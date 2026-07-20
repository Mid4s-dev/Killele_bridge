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
    Create a new FREE-tier user account.

    Security notes:
    - Emails are normalised to lowercase before storage and lookup.
    - Duplicate email check uses a parameterised query via SQLAlchemy ORM
      (no raw SQL string interpolation — SQL injection is not possible here).
    - The password is hashed with bcrypt before the object is ever written to
      the session; plaintext never touches the database.
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

    user = User(
        full_name=payload.full_name.strip(),
        email=normalised_email,
        phone_number=payload.phone_number.strip(),
        hashed_password=hash_password(payload.password),
        role=UserRole.FREE,
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
