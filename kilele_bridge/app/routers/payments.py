"""
Payment router.

Endpoints:
  POST /payments/initiate       — authenticated; fires M-Pesa STK push
  POST /payments/webhook        — public; called by IntaSend on payment events
  GET  /payments/my             — authenticated; latest payment for current user
  GET  /payments/status/{id}    — authenticated; poll a specific payment by ID
"""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import CheckoutResponse, PaymentStatusResponse, PaymentInitiateRequest
from app.services.payment_service import initiate_registration_payment, process_webhook
from fastapi import HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/initiate",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate the 100 KES registration payment",
)
def initiate_payment(
    payload: PaymentInitiateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CheckoutResponse:
    """
    Creates an IntaSend checkout session and returns the payment URL.
    The user should be redirected to `checkout_url` to complete payment.
    After payment, IntaSend will POST to `/payments/webhook`.
    """
    return initiate_registration_payment(current_user, payload.phone_number, db)


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="IntaSend webhook receiver (internal — not for client use)",
    include_in_schema=False,   # hide from public OpenAPI docs
)
async def payment_webhook(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """
    Receives payment event notifications from IntaSend.

    IntaSend does not send an HMAC signature header — it just POSTs JSON.
    Security is provided by:
    - The endpoint URL being non-guessable (not linked anywhere public).
    - Validating the invoice_id against our own DB before acting on it.
    - Only accepting COMPLETE/FAILED/CANCELLED state changes from a known invoice.
    """
    raw_body = await request.body()
    return process_webhook(raw_body, db)


@router.get(
    "/my",
    response_model=PaymentStatusResponse,
    summary="Return the current user's most recent payment record",
)
def get_my_payment(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PaymentStatusResponse:
    """
    Convenience endpoint — returns the latest payment for the authenticated
    user so the dashboard can show status without needing a stored payment ID.

    Returns 404 if the user has never initiated a payment.
    """
    payment = (
        db.query(Payment)
        .filter(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No payment record found.",
        )
    return PaymentStatusResponse.model_validate(payment)


@router.get(
    "/status/{payment_id}",
    response_model=PaymentStatusResponse,
    summary="Poll the status of a specific payment by ID",
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
