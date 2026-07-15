"""
Alembic environment configuration.

Reads DATABASE_URL directly from the environment (os.environ) so that
the migration can run in the Heroku release phase where config vars are
injected as real environment variables — not from a .env file.

Falls back to pydantic Settings (which reads .env) for local development.
"""
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

# Make the app package importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Import Base — this registers all table metadata.
# database.py no longer builds the engine at import time, so this is safe.
from app.database import Base  # noqa: E402
import app.models               # noqa: F401, E402 — registers all ORM models on Base


# ---------------------------------------------------------------------------
# Resolve DATABASE_URL
# ---------------------------------------------------------------------------

def _get_database_url() -> str:
    """
    Priority:
    1. DATABASE_URL environment variable (Heroku release dyno / production)
    2. pydantic Settings / .env file (local dev)
    """
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        from app.config import get_settings
        url = get_settings().database_url
    return url


def _strip_ssl_params(url: str) -> str:
    for fragment in (
        "?ssl_verify_cert=false&ssl_verify_identity=false",
        "&ssl_verify_cert=false&ssl_verify_identity=false",
        "?ssl_verify_cert=false",
        "?ssl_verify_identity=false",
        "?ssl-mode=REQUIRED",
    ):
        url = url.replace(fragment, "")
    return url


# ---------------------------------------------------------------------------
# Alembic config
# ---------------------------------------------------------------------------

config = context.config

raw_url = _get_database_url()
clean_url = _strip_ssl_params(raw_url)
config.set_main_option("sqlalchemy.url", clean_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Migration runners
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    needs_ssl = any(
        kw in raw_url
        for kw in ("ssl_verify_cert", "ssl_verify_identity", "ssl-mode")
    )
    connect_args = {"ssl": {"verify_cert": False}} if needs_ssl else {}

    connectable = create_engine(
        clean_url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
