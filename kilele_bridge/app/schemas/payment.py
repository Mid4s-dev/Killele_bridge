from decimal import Decimal
from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class PaymentInitiateRequest(BaseModel):
    phone_number: str


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class CheckoutResponse(BaseModel):
    """Returned to the client after an STK push is initiated."""
    payment_id: int
    invoice_id: str
    checkout_url: str
    amount: Decimal
    currency: str


class PaymentStatusResponse(BaseModel):
    """Current state of a payment record — used for polling."""
    payment_id: int = Field(alias="id")
    invoice_id: str | None
    status: str
    amount: Decimal
    currency: str

    model_config = {"from_attributes": True, "populate_by_name": True}


# ---------------------------------------------------------------------------
# IntaSend webhook payload
# ---------------------------------------------------------------------------

class IntaSendWebhookPayload(BaseModel):
    """
    IntaSend POSTs this body on payment state changes.

    IntaSend STK push webhook shape (top-level fields):
      {
        "invoice_id": "XXXXXXX",
        "state":      "COMPLETE" | "FAILED" | "CANCELLED" | "PENDING" | "RETRY",
        "value":      "500.00",
        "currency":   "KES",
        "account":    "254XXXXXXXXX",
        "api_ref":    "KILELE-REG-3",
        "failed_reason": null,
        ...
      }

    IntaSend sometimes wraps events in an "invoice" key instead:
      { "invoice": { "invoice_id": "...", "state": "...", ... }, ... }

    The model_validator handles both shapes.
    """
    invoice_id: str
    state: str
    value: str | None = None
    currency: str | None = None
    account: str | None = None
    api_ref: str | None = None
    failed_reason: str | None = None

    model_config = {"populate_by_name": True, "extra": "ignore"}

    @model_validator(mode="before")
    @classmethod
    def _unwrap_invoice(cls, data: dict) -> dict:
        """
        If IntaSend wraps payload inside an 'invoice' object, unwrap it
        so the rest of the validator sees a flat dict.
        """
        if isinstance(data, dict) and "invoice" in data and "invoice_id" not in data:
            invoice = data["invoice"]
            if isinstance(invoice, dict):
                merged = {**data, **invoice}
                merged.pop("invoice", None)
                return merged
        return data
