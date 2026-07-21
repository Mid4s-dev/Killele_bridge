"""
Training Academy ORM model — tracks per-user course progress.

CourseProgress stores a member's completion state for each course/module.
Courses themselves are static (seeded data), so there is no separate
Course table in this phase; course metadata lives in the router/service.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ProgressStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"


class CourseProgress(Base):
    __tablename__ = "course_progress"
    __table_args__ = (
        # One progress record per user per course
        UniqueConstraint("user_id", "course_id", name="uq_progress_user_course"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Stable slug identifier for the course (e.g. "freelancing-101")
    course_id = Column(String(64), nullable=False, index=True)

    status = Column(
        Enum(
            ProgressStatus,
            name="progress_status_enum",
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        default=ProgressStatus.NOT_STARTED,
        server_default=ProgressStatus.NOT_STARTED.value,
    )

    # 0.0 – 100.0  percent complete
    percent_complete = Column(Float, nullable=False, default=0.0, server_default="0")

    # Timestamps (UTC)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    user = relationship("User", back_populates="course_progress", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return (
            f"<CourseProgress user_id={self.user_id} course_id={self.course_id!r} "
            f"status={self.status} pct={self.percent_complete}>"
        )
