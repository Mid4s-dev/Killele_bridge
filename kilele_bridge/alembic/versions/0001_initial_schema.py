"""Initial schema — users and payments tables

Revision ID: 0001
Revises:
Create Date: 2026-07-15
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("hashed_password", sa.String(length=72), nullable=False),
        sa.Column(
            "role",
            sa.Enum("free", "member", "admin", name="user_role_enum"),
            nullable=False,
            server_default="free",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW() ON UPDATE NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --------------------------------------------------------------- payments
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("invoice_id", sa.String(length=128), nullable=True),
        sa.Column("tracking_id", sa.String(length=128), nullable=True),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="KES"),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "complete", "failed", "cancelled",
                name="payment_status_enum",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW() ON UPDATE NOW()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_payments_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payments_user_id",    "payments", ["user_id"],    unique=False)
    op.create_index("ix_payments_invoice_id",  "payments", ["invoice_id"], unique=False)
    op.create_index("ix_payments_tracking_id", "payments", ["tracking_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_payments_tracking_id", table_name="payments")
    op.drop_index("ix_payments_invoice_id",  table_name="payments")
    op.drop_index("ix_payments_user_id",     table_name="payments")
    op.drop_table("payments")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # Drop custom enum types (MySQL ignores these; kept for portability)
    op.execute("DROP TYPE IF EXISTS payment_status_enum")
    op.execute("DROP TYPE IF EXISTS user_role_enum")
