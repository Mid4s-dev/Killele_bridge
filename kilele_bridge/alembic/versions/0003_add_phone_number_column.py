"""Add phone_number column to users table

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add phone_number column to users table
    op.add_column(
        "users",
        sa.Column("phone_number", sa.String(20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "phone_number")
