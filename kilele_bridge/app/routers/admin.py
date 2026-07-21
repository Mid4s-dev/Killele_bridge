"""
Admin-only router — role-gated endpoints for platform administration.

All endpoints MUST use Depends(require_admin) to enforce ADMIN role.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc
from app.core.dependencies import get_db, require_admin
from app.models.user import User
from app.models.payment import Payment, PaymentStatus
from app.schemas.admin import AdminUserRow, AdminMembersResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/members", response_model=AdminMembersResponse)
def list_all_members(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    q: str | None = Query(None, description="Search by email, name, or phone"),
    sort_by: str = Query("created_at", description="Sort field: created_at, email, role"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    current_user: Annotated[User, Depends(require_admin)] = None,
    db: Session = Depends(get_db),
) -> AdminMembersResponse:
    """
    GET /api/v1/admin/members — List all registered users (admin-only).

    Security: Returns 403 Forbidden if requesting user lacks ADMIN role.
    
    Returns:
        - User ID, email, phone, role, KYC status, timestamps
        - Latest payment status/amount/date (if any payments exist)
        - Pagination metadata
    
    Query params:
        - page (int): 1-indexed page number
        - page_size (int): items per page (max 100)
        - q (str): search term (email, name, phone)
        - sort_by (str): created_at | email | role
        - order (str): asc | desc
    """
    # Base query with eager-loaded payments relationship
    query = db.query(User).options(joinedload(User.payments))

    # Search filter (case-insensitive partial match)
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.full_name.ilike(search_term),
                User.phone_number.ilike(search_term),
            )
        )

    # Count total matching records BEFORE pagination
    total = query.count()

    # Sorting
    sort_column = {
        "created_at": User.created_at,
        "email": User.email,
        "role": User.role,
    }.get(sort_by, User.created_at)

    if order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)

    # Pagination
    offset = (page - 1) * page_size
    users = query.offset(offset).limit(page_size).all()

    # Transform ORM models into admin response schema
    user_rows = []
    for user in users:
        # Get latest payment (if any) — payments are ordered by created_at DESC
        latest_payment = None
        if user.payments:
            latest_payment = max(user.payments, key=lambda p: p.created_at)

        user_row = AdminUserRow(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone_number=user.phone_number,
            role=user.role.value,
            is_active=user.is_active,
            kyc_status=user.kyc_status.value,
            created_at=user.created_at,
            updated_at=user.updated_at,
            latest_payment_status=latest_payment.status.value if latest_payment else None,
            latest_payment_amount=str(latest_payment.amount) if latest_payment else None,
            latest_payment_date=latest_payment.created_at if latest_payment else None,
        )
        user_rows.append(user_row)

    total_pages = (total + page_size - 1) // page_size  # ceil division

    return AdminMembersResponse(
        users=user_rows,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
