"""Add kyc_status column to users table

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-16
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the kyc_status_enum type and column
    op.add_column(
        "users",
        sa.Column(
            "kyc_status",
            sa.Enum(
                "not_started",
                "pending",
                "verified",
                "action_required",
                name="kyc_status_enum",
            ),
            nullable=False,
            server_default="not_started",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "kyc_status")
    op.execute("DROP TYPE IF EXISTS kyc_status_enum")
