import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    """
    FREE    – registered but registration fee not yet confirmed.
    MEMBER  – registration fee paid and webhook-verified (freelancer).
    VENDOR  – account/task seller; can post marketplace listings.
    ADMIN   – platform administrator.
    """
    FREE = "free"
    MEMBER = "member"
    VENDOR = "vendor"
    ADMIN = "admin"


class KycStatus(str, enum.Enum):
    """Tracks identity verification progress."""
    NOT_STARTED     = "not_started"
    PENDING         = "pending"
    VERIFIED        = "verified"
    ACTION_REQUIRED = "action_required"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Identity — store minimal PII
    full_name     = Column(String(120), nullable=False)
    email         = Column(String(254), nullable=False, index=True)
    phone_number  = Column(String(20),  nullable=True)

    # Security — bcrypt hash only; plaintext password is NEVER stored
    hashed_password = Column(String(72), nullable=False)

    # Membership
    role = Column(
        Enum(UserRole, name="user_role_enum", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=UserRole.FREE,
        server_default=UserRole.FREE.value,
    )
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")

    # KYC
    kyc_status = Column(
        Enum(KycStatus, name="kyc_status_enum", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=KycStatus.NOT_STARTED,
        server_default=KycStatus.NOT_STARTED.value,
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
    payments        = relationship("Payment",        back_populates="user",      lazy="select")
    listings        = relationship("Listing",        back_populates="vendor",    lazy="select", foreign_keys="Listing.vendor_id")
    applications    = relationship("Application",    back_populates="applicant", lazy="select", foreign_keys="Application.applicant_id")
    course_progress = relationship("CourseProgress", back_populates="user",      lazy="select", foreign_keys="CourseProgress.user_id")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
