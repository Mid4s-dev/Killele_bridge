from pydantic import BaseModel, EmailStr, Field, field_validator
import re
from typing import Literal


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        examples=["Jane Mwangi"],
    )
    email: EmailStr = Field(..., examples=["jane@example.co.ke"])
    phone_number: str = Field(..., examples=["2547XXXXXXXX"])
    password: str = Field(
        ...,
        min_length=8,
        max_length=72,   # bcrypt truncates at 72 bytes
        examples=["Str0ng!Pass"],
    )
    # Allows the user to sign up directly as a vendor.
    # Accepted values: "member" (default freelancer) or "vendor".
    # Any other value is rejected by the validator below.
    # NOTE: "admin" can never be self-assigned — admins are seeded via script.
    role_requested: Literal["member", "vendor"] = Field(
        default="member",
        description="Choose 'member' (Freelancer) or 'vendor' (Account & Task Seller).",
    )

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        """
        Enforce a minimal complexity policy:
        - at least one uppercase letter
        - at least one lowercase letter
        - at least one digit
        """
        errors = []
        if not re.search(r"[A-Z]", v):
            errors.append("one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("one digit")
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)


# ---------------------------------------------------------------------------
# Response schemas — never expose hashed_password
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None = None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
