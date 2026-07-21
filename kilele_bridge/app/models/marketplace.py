"""
Marketplace ORM models — Listings and Applications.

Listing  : a vendor-posted account-for-sale or task/job.
Application : a member's expression of interest in a listing.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ListingCategory(str, enum.Enum):
    ACCOUNT_SALE = "account_sale"   # Selling a platform account
    TASK         = "task"           # Micro-task / job posting
    SERVICE      = "service"        # General service offer
    OTHER        = "other"


class ListingStatus(str, enum.Enum):
    ACTIVE   = "active"     # Visible and accepting applications
    PAUSED   = "paused"     # Hidden by vendor temporarily
    CLOSED   = "closed"     # No longer accepting applications
    SOLD     = "sold"       # Account sold / task filled


class ApplicationStatus(str, enum.Enum):
    PENDING  = "pending"    # Submitted, awaiting vendor review
    ACCEPTED = "accepted"   # Vendor accepted the applicant
    REJECTED = "rejected"   # Vendor declined
    WITHDRAWN = "withdrawn" # Applicant pulled their application


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Owner — must have VENDOR role (enforced at API layer)
    vendor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title       = Column(String(200), nullable=False)
    description = Column(Text,        nullable=False)
    category    = Column(
        Enum(
            ListingCategory,
            name="listing_category_enum",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        default=ListingCategory.OTHER,
        server_default=ListingCategory.OTHER.value,
    )

    # price for account sales; reward/budget for tasks; NULL means negotiable
    price = Column(Numeric(12, 2), nullable=True)

    status = Column(
        Enum(
            ListingStatus,
            name="listing_status_enum",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        default=ListingStatus.ACTIVE,
        server_default=ListingStatus.ACTIVE.value,
    )

    # Timestamps (UTC)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    vendor       = relationship("User", back_populates="listings", foreign_keys=[vendor_id])
    applications = relationship(
        "Application",
        back_populates="listing",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Listing id={self.id} title={self.title!r} vendor_id={self.vendor_id}>"


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        # A member may only apply once per listing
        UniqueConstraint("listing_id", "applicant_id", name="uq_application_listing_applicant"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    listing_id = Column(
        Integer,
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    applicant_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Optional cover note / message from the applicant
    message = Column(Text, nullable=True)

    status = Column(
        Enum(
            ApplicationStatus,
            name="application_status_enum",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        default=ApplicationStatus.PENDING,
        server_default=ApplicationStatus.PENDING.value,
    )

    # Timestamps (UTC)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    listing   = relationship("Listing",  back_populates="applications", foreign_keys=[listing_id])
    applicant = relationship("User",     back_populates="applications", foreign_keys=[applicant_id])

    def __repr__(self) -> str:
        return (
            f"<Application id={self.id} listing_id={self.listing_id} "
            f"applicant_id={self.applicant_id} status={self.status}>"
        )
