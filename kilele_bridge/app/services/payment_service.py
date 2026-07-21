"""
Payment service — IntaSend STK Push initiation and webhook processing.

Security decisions
------------------
1. Webhook events are validated by matching invoice_id against our own DB
   before acting — IntaSend does not send HMAC signature headers.
2. Role upgrades happen ONLY on a confirmed COMPLETE state from IntaSend,
   never on client-supplied data alone.
3. All DB operations use SQLAlchemy ORM (parameterised) — no raw SQL.
4. The PENDING idempotency guard always re-fires the STK push so the user
   can retry without creating duplicate payment rows.
"""
import json
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
# Helpers
# ---------------------------------------------------------------------------

def _format_phone(phone: str) -> str:
    """
    Normalise a Kenyan phone number to IntaSend's required format: 254XXXXXXXXX

      07XXXXXXXX  → 254XXXXXXXXX
      +2547XXXXXXX → 254XXXXXXXXX
      2547XXXXXXXX → 2547XXXXXXXX  (no change)
    """
    phone = phone.strip().replace(" ", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    if not phone.startswith("254"):
        phone = "254" + phone
    return phone


def _intasend_client() -> APIService:
    """Return a configured IntaSend APIService, raising 503 if keys are missing."""
    if not settings.intasend_publishable_key or not settings.intasend_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway is not configured.",
        )
    return APIService(
        token=settings.intasend_secret_key,
        publishable_key=settings.intasend_publishable_key,
        test=settings.intasend_test_mode,
    )


def _send_stk_push(client: APIService, payment: Payment, phone: str, email: str) -> str:
    """
    Fire an IntaSend M-Pesa STK push and return the invoice_id.

    IntaSend STK push response shape:
      {
        "id": "<tracking-id>",
        "invoice": {
          "invoice_id": "<XXXXXXX>",
          "state": "PENDING",
          ...
        },
        ...
      }
    """
    formatted = _format_phone(phone)
    logger.info(
        "Sending STK push | payment_id=%s user_email=%s phone=%s amount=%s test=%s",
        payment.id, email, formatted, settings.registration_fee_kes, settings.intasend_test_mode,
    )

    response = client.collect.mpesa_stk_push(
        phone_number=formatted,
        email=email,
        amount=settings.registration_fee_kes,
        narrative="Kilele Bridge registration fee",
        api_ref=f"KILELE-REG-{payment.id}",
    )

    logger.info("IntaSend STK push response | payment_id=%s response=%s", payment.id, response)

    # Extract the invoice_id — it lives inside the 'invoice' sub-object
    invoice_id: str = (
        response.get("invoice", {}).get("invoice_id")
        or response.get("id")
        or ""
    )

    if not invoice_id:
        raise ValueError(f"IntaSend did not return an invoice_id. Full response: {response}")

    return invoice_id


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def initiate_registration_payment(
    user: User,
    phone_number: str,
    db: Session,
) -> CheckoutResponse:
    """
    Initiate (or re-initiate) an M-Pesa STK push for the registration fee.

    Idempotency rules:
    - COMPLETE  → reject with 409; payment already done.
    - PENDING   → re-fire the STK push using the existing payment row so the
                  user can tap "Pay again" without creating duplicate rows.
    - None/FAILED/CANCELLED → create a fresh payment row, then fire STK push.
    """
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

    client = _intasend_client()

    # Re-use the existing PENDING row and re-send the STK push
    if existing and existing.status == PaymentStatus.PENDING:
        payment = existing
        logger.info("Re-sending STK push for existing payment | payment_id=%s", payment.id)
    else:
        # Create a fresh PENDING row
        payment = Payment(
            user_id=user.id,
            amount=Decimal(str(settings.registration_fee_kes)),
            currency="KES",
            status=PaymentStatus.PENDING,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

    try:
        invoice_id = _send_stk_push(client, payment, phone_number, user.email)
    except Exception as exc:
        logger.error(
            "STK push failed | payment_id=%s error=%s", payment.id, exc, exc_info=True
        )
        payment.status = PaymentStatus.FAILED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {exc}",
        ) from exc

    payment.invoice_id = invoice_id
    db.commit()

    return CheckoutResponse(
        payment_id=payment.id,
        invoice_id=invoice_id,
        checkout_url=settings.payment_redirect_url,
        amount=payment.amount,
        currency=payment.currency,
    )


def process_webhook(raw_body: bytes, db: Session) -> dict:
    """
    Handle an incoming IntaSend webhook event.

    IntaSend does NOT send an HMAC signature header — it simply POSTs JSON.
    Security relies on:
    - Only acting on invoice_ids that exist in our own database.
    - Ignoring unknown invoice_ids silently (no data leakage).
    - State transitions only upgrade roles (COMPLETE) or mark failures.

    IntaSend webhook POST body shape:
      {
        "invoice_id": "XXXXXXX",
        "state":      "COMPLETE" | "FAILED" | "CANCELLED" | "PENDING" | "RETRY",
        "value":      "500.00",
        "currency":   "KES",
        "account":    "254XXXXXXXXX",
        "api_ref":    "KILELE-REG-3",
        ...
      }
    """
    # 1. Parse payload
    try:
        body_dict = json.loads(raw_body)
        payload = IntaSendWebhookPayload.model_validate(body_dict)
    except Exception as exc:
        logger.error("Webhook payload parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Malformed webhook payload.",
        ) from exc

    logger.info(
        "Webhook received | invoice_id=%s state=%s", payload.invoice_id, payload.state
    )

    # 2. Look up payment by invoice_id
    payment = (
        db.query(Payment)
        .filter(Payment.invoice_id == payload.invoice_id)
        .first()
    )
    if payment is None:
        # Unknown invoice — acknowledge so IntaSend doesn't keep retrying
        logger.warning("Webhook ignored: unknown invoice_id=%s", payload.invoice_id)
        return {"status": "ignored", "reason": "unknown invoice"}

    state = payload.state.upper()

    # 3. Update payment status and conditionally upgrade user role
    if state == "COMPLETE":
        payment.status = PaymentStatus.COMPLETE
        user = db.get(User, payment.user_id)
        if user and user.role == UserRole.FREE:
            user.role = UserRole.MEMBER
            logger.info(
                "User upgraded to MEMBER | user_id=%s payment_id=%s",
                user.id, payment.id,
            )
    elif state == "FAILED":
        payment.status = PaymentStatus.FAILED
        logger.info("Payment FAILED | payment_id=%s", payment.id)
    elif state == "CANCELLED":
        payment.status = PaymentStatus.CANCELLED
        logger.info("Payment CANCELLED | payment_id=%s", payment.id)
    else:
        # PENDING / RETRY — no action needed, just acknowledge
        logger.debug(
            "Webhook no-op | invoice_id=%s state=%s", payload.invoice_id, state
        )

    db.commit()
    return {"status": "ok"}
