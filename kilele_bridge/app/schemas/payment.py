from decimal import Decimal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class PaymentInitiateRequest(BaseModel):
    phone_number: str

# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class CheckoutResponse(BaseModel):
    """Returned to the client after a checkout is initiated."""
    payment_id: int          # our internal Payment row ID
    invoice_id: str          # IntaSend invoice reference
    checkout_url: str        # redirect the user here to complete payment
    amount: Decimal
    currency: str


class PaymentStatusResponse(BaseModel):
    """Current state of a payment record."""
    payment_id: int = Field(alias="id")
    invoice_id: str | None
    status: str
    amount: Decimal
    currency: str

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------------------------------------------------------------------------
# Webhook payload — IntaSend sends this as JSON on payment events
# ---------------------------------------------------------------------------

class IntaSendWebhookPayload(BaseModel):
    """
    Minimal fields IntaSend includes in its webhook POST body.
    Extra fields are ignored (extra="ignore").
    """
    invoice_id: str = Field(..., alias="invoice_id")
    state: str               # COMPLETE | FAILED | RETRY | PENDING
    value: str | None = None # amount as string, e.g. "100.00"
    currency: str | None = None
    account: str | None = None   # payer phone / email

    model_config = {"populate_by_name": True, "extra": "ignore"}
