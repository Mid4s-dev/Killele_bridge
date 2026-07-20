"""
Payment service — IntaSend checkout initiation and webhook processing.

Security decisions
------------------
1. Webhook authenticity is verified using HMAC-SHA256 against the
   PAYMENT_WEBHOOK_SECRET from the environment. Requests without a valid
   signature are rejected with HTTP 400 before any DB writes occur.
2. Role upgrades happen ONLY after signature verification AND a confirmed
   COMPLETE state from IntaSend — never on client-supplied data alone.
3. All DB operations use SQLAlchemy ORM (parameterised) — no raw SQL.
"""
import hashlib
import hmac
import logging
from decimal import Decimal

from fastapi import HTTPException, status
from intasend import APIService
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.payment import Payment, PaymentStatus
from app.models.user import User, UserRole
from app.schemas.payment import CheckoutResponse, IntaSendWebhookPayload

logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_intasend_client() -> APIService:
    """
    Instantiate the IntaSend SDK client.
    test_mode=True routes requests to the IntaSend sandbox.
    """
    if not settings.intasend_publishable_key or not settings.intasend_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway is not configured.",
        )
    return APIService(
        publishable_key=settings.intasend_publishable_key,
        token=settings.intasend_secret_key,
        test=settings.intasend_test_mode,
    )


def _verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """
    Validate that the webhook POST originated from IntaSend by comparing
    the HMAC-SHA256 digest of the raw request body against the
    X-IntaSend-Signature header value.

    Returns True only when signatures match.
    """
    expected = hmac.new(
        settings.payment_webhook_secret.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    # compare_digest prevents timing-based attacks
    return hmac.compare_digest(expected, signature_header)


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def initiate_registration_payment(user: User, phone_number: str, db: Session) -> CheckoutResponse:
    """
    Create an IntaSend STK Push for the registration fee.

    Steps:
    1. Guard against double-payment (idempotency).
    2. Create a pending Payment row.
    3. Call IntaSend to get a checkout URL.
    4. Persist the invoice_id and return the checkout URL to the caller.
    """
    # Idempotency: if a pending or completed payment already exists, reuse it
    existing = (
        db.query(Payment)
        .filter(
            Payment.user_id == user.id,
            Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.COMPLETE]),
        )
        .first()
    )
    if existing and existing.status == PaymentStatus.COMPLETE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration fee has already been paid.",
        )
    if existing and existing.status == PaymentStatus.PENDING:
        # Return the existing pending checkout rather than creating a duplicate
        return CheckoutResponse(
            payment_id=existing.id,
            invoice_id=existing.invoice_id or "",
            checkout_url=settings.payment_redirect_url,
            amount=existing.amount,
            currency=existing.currency,
        )

    # 1. Create a PENDING payment record first — captured before any external call
    payment = Payment(
        user_id=user.id,
        amount=Decimal(str(settings.registration_fee_kes)),
        currency="KES",
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # 2. Call IntaSend checkout API
    try:
        client = _get_intasend_client()
        response = client.collect.mpesa_stk_push(
            phone_number=phone_number,
            email=user.email,
            amount=settings.registration_fee_kes,
            narrative=f"Kilele Bridge registration fee - User {user.id}",
        )
        # IntaSend STK push returns an invoice object
        invoice_id: str = response.get("invoice", {}).get("invoice_id", "")
        checkout_url: str = response.get("url", settings.payment_redirect_url)
    except Exception as exc:
        logger.error("IntaSend checkout initiation failed for user %s: %s", user.id, exc)
        # Mark payment as failed so the user can retry cleanly
        payment.status = PaymentStatus.FAILED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment gateway is unavailable. Please try again shortly.",
        ) from exc

    # 3. Persist IntaSend references
    payment.invoice_id = invoice_id
    db.commit()

    return CheckoutResponse(
        payment_id=payment.id,
        invoice_id=invoice_id,
        checkout_url=checkout_url,
        amount=payment.amount,
        currency=payment.currency,
    )


def process_webhook(
    raw_body: bytes,
    signature_header: str,
    db: Session,
) -> dict:
    """
    Handle an incoming IntaSend webhook event.

    Security:
    - Signature is verified BEFORE any payload is parsed or DB is touched.
    - Role upgrade only occurs when state == COMPLETE.
    - All updates use ORM queries — no dynamic SQL.
    """
    if not settings.payment_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment webhook is not configured.",
        )

    # ── 1. Verify signature ──────────────────────────────────────────────────
    if not _verify_webhook_signature(raw_body, signature_header):
        logger.warning("Webhook received with invalid signature — rejected.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature.",
        )

    # ── 2. Parse payload ─────────────────────────────────────────────────────
    import json
    try:
        body_dict = json.loads(raw_body)
        payload = IntaSendWebhookPayload.model_validate(body_dict)
    except Exception as exc:
        logger.error("Webhook payload parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Malformed webhook payload.",
        ) from exc

    # ── 3. Look up the Payment record by invoice_id ───────────────────────────
    payment = (
        db.query(Payment)
        .filter(Payment.invoice_id == payload.invoice_id)
        .first()
    )
    if payment is None:
        # Unknown invoice — log and acknowledge (IntaSend retries on non-200)
        logger.warning("Webhook for unknown invoice_id: %s", payload.invoice_id)
        return {"status": "ignored", "reason": "unknown invoice"}

    state = payload.state.upper()

    # ── 4. Update payment status ──────────────────────────────────────────────
    if state == "COMPLETE":
        payment.status = PaymentStatus.COMPLETE

        # ── 5. Upgrade user role to MEMBER ───────────────────────────────────
        user = db.get(User, payment.user_id)
        if user and user.role == UserRole.FREE:
            user.role = UserRole.MEMBER
            logger.info(
                "User %s upgraded to MEMBER after payment %s completed.",
                user.id,
                payment.id,
            )

    elif state == "FAILED":
        payment.status = PaymentStatus.FAILED
        logger.info("Payment %s marked FAILED by webhook.", payment.id)

    elif state == "CANCELLED":
        payment.status = PaymentStatus.CANCELLED
        logger.info("Payment %s marked CANCELLED by webhook.", payment.id)

    else:
        # PENDING / RETRY — no state change needed, just acknowledge
        logger.debug("Webhook for invoice %s in state %s — no action.", payload.invoice_id, state)

    db.commit()
    return {"status": "ok"}
