"""
Database initialisation script.

Usage (from the kilele_bridge/ directory):

    # 1. Create tables via SQLAlchemy metadata (development / CI shortcut)
    python scripts/db_init.py --create-tables

    # 2. Seed a first admin user
    python scripts/db_init.py --seed-admin

    # 3. Both at once
    python scripts/db_init.py --create-tables --seed-admin

For production, prefer Alembic migrations:
    alembic upgrade head

IMPORTANT: Never commit real credentials. The admin password is read from the
ADMIN_SEED_PASSWORD environment variable or prompted interactively.
"""
import argparse
import getpass
import os
import sys

# Make the app package importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.security import hash_password
from app.database import Base, get_session_factory, get_engine
from app.models import User, Payment  # noqa: F401 — registers models on Base
from app.models.user import UserRole


def create_tables() -> None:
    print("Creating all tables from SQLAlchemy metadata...")
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("Done.")


def seed_admin() -> None:
    settings = get_settings()

    # Read admin credentials from env or prompt — never hardcode
    admin_email = os.getenv("ADMIN_SEED_EMAIL", "admin@kilelebridge.co.ke")
    admin_name = os.getenv("ADMIN_SEED_NAME", "Kilele Admin")
    admin_password = os.getenv("ADMIN_SEED_PASSWORD") or getpass.getpass(
        f"Enter password for admin account ({admin_email}): "
    )

    if len(admin_password) < 8:
        print("ERROR: Admin password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    SessionLocal = get_session_factory()
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == admin_email.lower()).first()
        if existing:
            print(f"Admin user '{admin_email}' already exists — skipping seed.")
            return

        admin = User(
            full_name=admin_name,
            email=admin_email.lower(),
            hashed_password=hash_password(admin_password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin user '{admin_email}' created successfully.")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Kilele Bridge DB initialisation")
    parser.add_argument(
        "--create-tables",
        action="store_true",
        help="Create all tables (SQLAlchemy metadata). Use Alembic in production.",
    )
    parser.add_argument(
        "--seed-admin",
        action="store_true",
        help="Seed an initial admin user.",
    )
    args = parser.parse_args()

    if not args.create_tables and not args.seed_admin:
        parser.print_help()
        sys.exit(0)

    if args.create_tables:
        create_tables()

    if args.seed_admin:
        seed_admin()


if __name__ == "__main__":
    main()
