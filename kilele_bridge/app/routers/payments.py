"""
Payment router.

Endpoints:
  POST /payments/initiate     — authenticated; starts a checkout for the current user
  POST /payments/webhook      — public; called by IntaSend on payment events
  GET  /payments/status/{id}  — authenticated; poll payment status
"""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import CheckoutResponse, PaymentStatusResponse
from app.services.payment_service import initiate_registration_payment, process_webhook

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/initiate",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate the 100 KES registration payment",
)
def initiate_payment(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CheckoutResponse:
    """
    Creates an IntaSend checkout session and returns the payment URL.
    The user should be redirected to `checkout_url` to complete payment.
    After payment, IntaSend will POST to `/payments/webhook`.
    """
    return initiate_registration_payment(current_user, db)


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="IntaSend webhook receiver (internal — not for client use)",
    include_in_schema=False,   # hide from public OpenAPI docs
)
async def payment_webhook(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    x_intasend_signature: Annotated[str | None, Header()] = None,
) -> dict:
    """
    Receives payment event notifications from IntaSend.

    Security:
    - The raw body is read before any parsing so the HMAC signature can
      be verified against the exact bytes IntaSend signed.
    - Signature header is required; missing header → HTTP 400.
    """
    if not x_intasend_signature:
        logger.warning("Webhook request missing X-IntaSend-Signature header.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing signature header.",
        )

    raw_body = await request.body()
    return process_webhook(raw_body, x_intasend_signature, db)


@router.get(
    "/status/{payment_id}",
    response_model=PaymentStatusResponse,
    summary="Poll the status of a specific payment",
)
def get_payment_status(
    payment_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PaymentStatusResponse:
    """
    Returns the current status of a payment record.
    Users may only view their own payments.
    """
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found.",
        )
    # Ownership check — users cannot query other users' payments
    if payment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )
    return PaymentStatusResponse.model_validate(payment)
