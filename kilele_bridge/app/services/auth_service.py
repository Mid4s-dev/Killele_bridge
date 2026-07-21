"""
Auth service — business logic kept separate from the HTTP layer.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse


def register_user(payload: RegisterRequest, db: Session) -> UserResponse:
    """
    Create a new user account.

    - role_requested="member"  → creates a FREE-tier account (must pay KES 500
      to be upgraded to MEMBER via the payment webhook).
    - role_requested="vendor"  → creates a VENDOR account directly (vendors
      are not subject to the membership fee; they pay per listing in future).

    Security notes:
    - Emails are normalised to lowercase before storage and lookup.
    - Duplicate email check uses a parameterised query via SQLAlchemy ORM
      (no raw SQL string interpolation — SQL injection is not possible here).
    - The password is hashed with bcrypt before the object is ever written to
      the session; plaintext never touches the database.
    - "admin" role is NEVER accepted from registration — admins are seeded via
      the db_init script only.
    """
    normalised_email = payload.email.lower().strip()

    existing = (
        db.query(User)
        .filter(User.email == normalised_email)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Map role_requested to the correct UserRole enum value.
    # Vendors get the VENDOR role immediately; everyone else starts FREE
    # and upgrades to MEMBER after payment.
    initial_role = (
        UserRole.VENDOR if payload.role_requested == "vendor" else UserRole.FREE
    )

    user = User(
        full_name=payload.full_name.strip(),
        email=normalised_email,
        phone_number=payload.phone_number.strip(),
        hashed_password=hash_password(payload.password),
        role=initial_role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


def login_user(payload: LoginRequest, db: Session) -> TokenResponse:
    """
    Authenticate a user and issue a JWT.

    Security notes:
    - verify_password uses constant-time comparison (passlib).
    - The same generic error message is returned for both "user not found"
      and "wrong password" to prevent user enumeration attacks.
    """
    normalised_email = payload.email.lower().strip()

    user = db.query(User).filter(User.email == normalised_email).first()

    # Deliberate: identical error for missing user AND wrong password
    auth_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise auth_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact support.",
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.value},
    )

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
