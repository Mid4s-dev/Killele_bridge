"""
Training Academy Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CourseProgressUpdate(BaseModel):
    """Sent by the client when a user advances through a course."""
    percent_complete: float = Field(..., ge=0, le=100)


class CourseProgressResponse(BaseModel):
    id:               int
    user_id:          int
    course_id:        str
    status:           str      # not_started | in_progress | completed
    percent_complete: float
    started_at:       Optional[datetime]
    completed_at:     Optional[datetime]
    updated_at:       datetime

    model_config = {"from_attributes": True}


class CourseDetail(BaseModel):
    """Static course metadata combined with the user's live progress."""
    course_id:        str
    title:            str
    description:      str
    category:         str
    duration_minutes: int
    # Progress fields — None when the user has never touched the course
    status:           str = "not_started"
    percent_complete: float = 0.0
    started_at:       Optional[datetime] = None
    completed_at:     Optional[datetime] = None


class AcademyDashboardResponse(BaseModel):
    """Full response for GET /academy/dashboard — all courses + progress."""
    courses:            list[CourseDetail]
    total_courses:      int
    completed_courses:  int
    in_progress_courses: int
    overall_percent:    float   # average across all courses
