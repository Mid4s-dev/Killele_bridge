from urllib.parse import urlparse, parse_qs
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# SSL handling for Aiven MySQL
# ---------------------------------------------------------------------------
# Aiven requires SSL. pymysql accepts SSL config via connect_args, not URL
# params. We strip the ssl_* query params from the URL and pass them as a
# connect_args dict so SQLAlchemy doesn't choke on unknown URL parameters.

def _build_engine():
    url = settings.database_url

    # Detect Aiven / any SSL URL param and route to connect_args
    ssl_required = any(
        kw in url
        for kw in ("ssl_verify_cert", "ssl_verify_identity", "ssl-mode", "ssl=true")
    )

    # Strip SSL params from URL (SQLAlchemy URL parser rejects unknown ones)
    clean_url = (
        url
        .replace("?ssl_verify_cert=false&ssl_verify_identity=false", "")
        .replace("?ssl-mode=REQUIRED", "")
        .replace("&ssl_verify_cert=false", "")
        .replace("&ssl_verify_identity=false", "")
    )

    connect_args: dict = {}
    if ssl_required:
        # Tell pymysql to use SSL without checking the server certificate —
        # appropriate for Aiven's CA-signed certs when the CA bundle is not
        # bundled in the container.
        connect_args = {"ssl": {"verify_cert": False}}

    return create_engine(
        clean_url,
        pool_pre_ping=True,      # recycles stale connections automatically
        pool_recycle=1800,       # Heroku kills idle connections after ~30 min
        pool_size=5,             # single dyno — keep pool small
        max_overflow=10,
        connect_args=connect_args,
    )


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """
    FastAPI dependency — yields a DB session and guarantees cleanup.
    Usage:
        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
