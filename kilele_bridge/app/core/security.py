"""
Security utilities — password hashing and JWT management.

Design decisions:
- passlib[bcrypt] with a work-factor of 12 (OWASP recommended minimum).
- JWTs are short-lived (default 60 min) and signed with HS256.
- The secret key is loaded exclusively from environment variables.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,          # work-factor; increase over time as hardware improves
)


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of the supplied plaintext password."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Constant-time comparison of a plaintext password against its stored hash.
    Returns True only when they match.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JSON Web Tokens
# ---------------------------------------------------------------------------

def create_access_token(subject: int | str, extra_claims: dict[str, Any] | None = None) -> str:
    """
    Create a signed JWT.

    Args:
        subject:      Typically the user's database ID (stored as 'sub').
        extra_claims: Optional dict of additional claims to embed (e.g. role).

    Returns:
        Encoded JWT string.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.app_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT.

    Raises:
        JWTError: if the token is invalid, expired, or tampered with.
    """
    return jwt.decode(
        token,
        settings.app_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
