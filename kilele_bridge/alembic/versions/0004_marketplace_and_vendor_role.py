"""Add vendor role, listings, applications, and course_progress tables

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-15
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Extend user_role_enum to include 'vendor'
    #
    # MySQL does not support ADD VALUE on an existing ENUM; the only
    # supported path is to ALTER COLUMN with the full new definition.
    # SQLAlchemy / Alembic expose this via op.execute() raw DDL.
    # ------------------------------------------------------------------
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('free','member','vendor','admin') NOT NULL DEFAULT 'free'"
    )

    # ------------------------------------------------------------------
    # 2. listings table
    # ------------------------------------------------------------------
    op.create_table(
        "listings",
        sa.Column("id",          sa.Integer(),                    autoincrement=True, nullable=False),
        sa.Column("vendor_id",   sa.Integer(),                    nullable=False),
        sa.Column("title",       sa.String(length=200),           nullable=False),
        sa.Column("description", sa.Text(),                       nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "account_sale", "task", "service", "other",
                name="listing_category_enum",
            ),
            nullable=False,
            server_default="other",
        ),
        sa.Column("price", sa.Numeric(precision=12, scale=2),    nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "active", "paused", "closed", "sold",
                name="listing_status_enum",
            ),
            nullable=False,
            server_default="active",
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
            ["vendor_id"], ["users.id"],
            name="fk_listings_vendor_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_listings_vendor_id", "listings", ["vendor_id"], unique=False)
    op.create_index("ix_listings_status",    "listings", ["status"],    unique=False)
    op.create_index("ix_listings_category",  "listings", ["category"],  unique=False)

    # ------------------------------------------------------------------
    # 3. applications table
    # ------------------------------------------------------------------
    op.create_table(
        "applications",
        sa.Column("id",           sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("listing_id",   sa.Integer(), nullable=False),
        sa.Column("applicant_id", sa.Integer(), nullable=False),
        sa.Column("message",      sa.Text(),    nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "accepted", "rejected", "withdrawn",
                name="application_status_enum",
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
            ["listing_id"], ["listings.id"],
            name="fk_applications_listing_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["applicant_id"], ["users.id"],
            name="fk_applications_applicant_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("listing_id", "applicant_id", name="uq_application_listing_applicant"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_applications_listing_id",   "applications", ["listing_id"],   unique=False)
    op.create_index("ix_applications_applicant_id", "applications", ["applicant_id"], unique=False)

    # ------------------------------------------------------------------
    # 4. course_progress table
    # ------------------------------------------------------------------
    op.create_table(
        "course_progress",
        sa.Column("id",               sa.Integer(),             autoincrement=True, nullable=False),
        sa.Column("user_id",          sa.Integer(),             nullable=False),
        sa.Column("course_id",        sa.String(length=64),     nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "not_started", "in_progress", "completed",
                name="progress_status_enum",
            ),
            nullable=False,
            server_default="not_started",
        ),
        sa.Column("percent_complete", sa.Float(),               nullable=False, server_default="0"),
        sa.Column("started_at",       sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at",     sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW() ON UPDATE NOW()"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"],
            name="fk_course_progress_user_id",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("user_id", "course_id", name="uq_progress_user_course"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_course_progress_user_id",   "course_progress", ["user_id"],   unique=False)
    op.create_index("ix_course_progress_course_id", "course_progress", ["course_id"], unique=False)


def downgrade() -> None:
    # Reverse order — children before parents
    op.drop_index("ix_course_progress_course_id", table_name="course_progress")
    op.drop_index("ix_course_progress_user_id",   table_name="course_progress")
    op.drop_table("course_progress")

    op.drop_index("ix_applications_applicant_id", table_name="applications")
    op.drop_index("ix_applications_listing_id",   table_name="applications")
    op.drop_table("applications")

    op.drop_index("ix_listings_category",  table_name="listings")
    op.drop_index("ix_listings_status",    table_name="listings")
    op.drop_index("ix_listings_vendor_id", table_name="listings")
    op.drop_table("listings")

    # Restore user_role_enum without 'vendor'
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('free','member','admin') NOT NULL DEFAULT 'free'"
    )
