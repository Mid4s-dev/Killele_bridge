"""
Admin-only response schemas.

Security note: Admin endpoints must NEVER expose hashed_password or any
raw credential material, even to admin users.
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr


class AdminUserRow(BaseModel):
    """
    A single user row returned to admin dashboards.
    Includes metadata not exposed to regular users (signup timestamp, payment status).
    """
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None
    role: str
    is_active: bool
    kyc_status: str
    created_at: datetime
    updated_at: datetime
    
    # Payment metadata — derived from relationship
    latest_payment_status: str | None = None
    latest_payment_amount: str | None = None
    latest_payment_date: datetime | None = None

    model_config = {"from_attributes": True}


class AdminMembersResponse(BaseModel):
    """
    Paginated response for GET /admin/members.
    """
    users: list[AdminUserRow]
    total: int
    page: int
    page_size: int
    total_pages: int
