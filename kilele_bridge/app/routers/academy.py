"""
Training Academy router.

Courses are defined as static metadata here (no DB table needed in this
phase). Progress is persisted in the course_progress table per user.

Endpoints:
  GET  /academy/dashboard            Full course list + user's progress
  POST /academy/courses/{id}/start   Mark a course as started
  POST /academy/courses/{id}/progress  Update completion percentage
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_member
from app.models.academy import CourseProgress, ProgressStatus
from app.models.user import User
from app.schemas.academy import (
    AcademyDashboardResponse,
    CourseDetail,
    CourseProgressResponse,
    CourseProgressUpdate,
)

router = APIRouter(prefix="/academy", tags=["academy"])


# ---------------------------------------------------------------------------
# Static course catalogue — extend this list as content grows
# ---------------------------------------------------------------------------
COURSES: list[dict] = [
    {
        "course_id": "freelancing-101",
        "title": "Freelancing 101",
        "description": "Build your freelancing foundation: profile optimisation, "
                       "proposal writing, and landing your first client.",
        "category": "Getting Started",
        "duration_minutes": 45,
    },
    {
        "course_id": "upwork-mastery",
        "title": "Upwork Mastery",
        "description": "Advanced Upwork strategies — JSS protection, niche "
                       "positioning, and scaling to Top Rated Plus.",
        "category": "Platform Mastery",
        "duration_minutes": 60,
    },
    {
        "course_id": "fiverr-seller-playbook",
        "title": "Fiverr Seller Playbook",
        "description": "Gig SEO, upsell sequences, and building a 5-star "
                       "reputation on Fiverr from scratch.",
        "category": "Platform Mastery",
        "duration_minutes": 55,
    },
    {
        "course_id": "client-communication",
        "title": "Client Communication Mastery",
        "description": "Scripts and frameworks for handling difficult clients, "
                       "scope creep, and payment disputes professionally.",
        "category": "Soft Skills",
        "duration_minutes": 40,
    },
    {
        "course_id": "ai-tools-for-freelancers",
        "title": "AI Tools for Freelancers",
        "description": "Leverage ChatGPT, Midjourney, and automation tools to "
                       "deliver faster and charge premium rates.",
        "category": "AI & Productivity",
        "duration_minutes": 50,
    },
    {
        "course_id": "account-transition-guide",
        "title": "Account Transition Guide",
        "description": "How to safely buy, sell, and transfer freelancing "
                       "accounts without risking bans.",
        "category": "Marketplace",
        "duration_minutes": 35,
    },
]

COURSE_MAP = {c["course_id"]: c for c in COURSES}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_none(db: Session, user_id: int, course_id: str) -> CourseProgress | None:
    return (
        db.query(CourseProgress)
        .filter(
            CourseProgress.user_id == user_id,
            CourseProgress.course_id == course_id,
        )
        .first()
    )


def _build_course_detail(meta: dict, progress: CourseProgress | None) -> CourseDetail:
    return CourseDetail(
        course_id=meta["course_id"],
        title=meta["title"],
        description=meta["description"],
        category=meta["category"],
        duration_minutes=meta["duration_minutes"],
        status=progress.status.value if progress else "not_started",
        percent_complete=progress.percent_complete if progress else 0.0,
        started_at=progress.started_at if progress else None,
        completed_at=progress.completed_at if progress else None,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/dashboard",
    response_model=AcademyDashboardResponse,
    summary="Return all courses with user's progress (member only)",
)
def academy_dashboard(
    current_user: Annotated[User, Depends(require_member)],
    db: Session = Depends(get_db),
) -> AcademyDashboardResponse:
    # Load all progress rows for this user in one query
    progress_rows = (
        db.query(CourseProgress)
        .filter(CourseProgress.user_id == current_user.id)
        .all()
    )
    progress_map = {p.course_id: p for p in progress_rows}

    courses = [_build_course_detail(meta, progress_map.get(meta["course_id"])) for meta in COURSES]

    completed = sum(1 for c in courses if c.status == "completed")
    in_progress = sum(1 for c in courses if c.status == "in_progress")
    overall = sum(c.percent_complete for c in courses) / len(courses) if courses else 0.0

    return AcademyDashboardResponse(
        courses=courses,
        total_courses=len(courses),
        completed_courses=completed,
        in_progress_courses=in_progress,
        overall_percent=round(overall, 1),
    )


@router.post(
    "/courses/{course_id}/start",
    response_model=CourseProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark a course as started (member only)",
)
def start_course(
    course_id: str,
    current_user: Annotated[User, Depends(require_member)],
    db: Session = Depends(get_db),
) -> CourseProgressResponse:
    if course_id not in COURSE_MAP:
        raise HTTPException(status_code=404, detail="Course not found.")

    progress = _get_or_none(db, current_user.id, course_id)
    if progress:
        # Already started — return existing record unchanged
        return CourseProgressResponse.model_validate(progress)

    now = datetime.now(timezone.utc)
    progress = CourseProgress(
        user_id=current_user.id,
        course_id=course_id,
        status=ProgressStatus.IN_PROGRESS,
        percent_complete=0.0,
        started_at=now,
        updated_at=now,
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return CourseProgressResponse.model_validate(progress)


@router.post(
    "/courses/{course_id}/progress",
    response_model=CourseProgressResponse,
    summary="Update course completion percentage (member only)",
)
def update_progress(
    course_id: str,
    payload: CourseProgressUpdate,
    current_user: Annotated[User, Depends(require_member)],
    db: Session = Depends(get_db),
) -> CourseProgressResponse:
    if course_id not in COURSE_MAP:
        raise HTTPException(status_code=404, detail="Course not found.")

    now = datetime.now(timezone.utc)
    progress = _get_or_none(db, current_user.id, course_id)

    if not progress:
        # Auto-create progress record if client skipped the start call
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            status=ProgressStatus.IN_PROGRESS,
            percent_complete=payload.percent_complete,
            started_at=now,
            updated_at=now,
        )
        db.add(progress)
    else:
        progress.percent_complete = payload.percent_complete
        progress.updated_at = now

    # Auto-complete when client reports 100 %
    if payload.percent_complete >= 100:
        progress.status = ProgressStatus.COMPLETED
        progress.percent_complete = 100.0
        if not progress.completed_at:
            progress.completed_at = now
    elif payload.percent_complete > 0:
        progress.status = ProgressStatus.IN_PROGRESS

    db.commit()
    db.refresh(progress)
    return CourseProgressResponse.model_validate(progress)
