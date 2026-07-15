"""
Database engine and session factory.

Design decisions:
- Engine is built lazily on first use, not at import time.
  This means the DATABASE_URL env-var is read when a connection is actually
  needed, not when Python imports this module. This is critical for the
  Heroku release phase (alembic upgrade head) where the container is started
  without the full set of config vars being injected by the buildpack.

- Aiven MySQL requires SSL. pymysql accepts SSL config via connect_args,
  not URL query parameters, so we strip ssl_* params from the URL string
  and pass {"ssl": {"verify_cert": False}} separately.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


# ---------------------------------------------------------------------------
# Lazy engine
# ---------------------------------------------------------------------------

_engine = None
_SessionLocal = None


def _strip_ssl_params(url: str) -> str:
    """Remove ssl_* query params that pymysql/SQLAlchemy doesn't understand."""
    for fragment in (
        "?ssl_verify_cert=false&ssl_verify_identity=false",
        "&ssl_verify_cert=false&ssl_verify_identity=false",
        "?ssl_verify_cert=false",
        "&ssl_verify_cert=false",
        "?ssl_verify_identity=false",
        "&ssl_verify_identity=false",
        "?ssl-mode=REQUIRED",
        "&ssl-mode=REQUIRED",
    ):
        url = url.replace(fragment, "")
    return url


def _needs_ssl(url: str) -> bool:
    return any(
        kw in url
        for kw in ("ssl_verify_cert", "ssl_verify_identity", "ssl-mode", "ssl=true")
    )


def get_engine():
    global _engine
    if _engine is None:
        raw_url = os.environ.get("DATABASE_URL", "")
        if not raw_url:
            # Fallback: try loading from .env file (local development)
            from app.config import get_settings
            raw_url = get_settings().database_url

        ssl = _needs_ssl(raw_url)
        clean_url = _strip_ssl_params(raw_url)

        connect_args = {"ssl": {"verify_cert": False}} if ssl else {}

        _engine = create_engine(
            clean_url,
            pool_pre_ping=True,
            pool_recycle=1800,   # recycle before Heroku kills idle connections (~30 min)
            pool_size=5,         # single eco dyno — keep pool small
            max_overflow=10,
            connect_args=connect_args,
        )
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine(),
        )
    return _SessionLocal


# ---------------------------------------------------------------------------
# Declarative base (imported by models — must be available at import time)
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_db():
    """
    Yields a database session and guarantees cleanup.
    Usage:
        db: Session = Depends(get_db)
    """
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
