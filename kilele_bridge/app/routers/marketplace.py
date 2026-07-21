"""
Marketplace router.

Endpoint summary:
  POST   /marketplace/listings               Create a listing (vendor only)
  GET    /marketplace/listings               Browse listings (member + vendor)
  GET    /marketplace/listings/{id}          Fetch one listing (member + vendor)
  PATCH  /marketplace/listings/{id}          Edit own listing (vendor only)
  DELETE /marketplace/listings/{id}          Delete own listing (vendor only)
  POST   /marketplace/listings/{id}/apply    Apply to a listing (member only)
  GET    /marketplace/listings/{id}/applications  View applications on own listing (vendor only)
  PATCH  /marketplace/listings/{id}/applications/{app_id}  Accept/reject (vendor only)
  DELETE /marketplace/listings/{id}/applications/{app_id}  Withdraw own application (member only)
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_db, require_member, require_vendor
from app.models.marketplace import (
    Application,
    ApplicationStatus,
    Listing,
    ListingCategory,
    ListingStatus,
)
from app.models.user import User
from app.schemas.marketplace import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    ListingCreate,
    ListingResponse,
    ListingsPageResponse,
    ListingUpdate,
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _listing_to_response(listing: Listing, db: Session) -> ListingResponse:
    app_count = (
        db.query(func.count(Application.id))
        .filter(Application.listing_id == listing.id)
        .scalar()
    ) or 0
    return ListingResponse(
        id=listing.id,
        vendor_id=listing.vendor_id,
        vendor_name=listing.vendor.full_name,
        title=listing.title,
        description=listing.description,
        category=listing.category.value,
        price=str(listing.price) if listing.price is not None else None,
        status=listing.status.value,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        application_count=app_count,
    )


def _app_to_response(app: Application) -> ApplicationResponse:
    return ApplicationResponse(
        id=app.id,
        listing_id=app.listing_id,
        applicant_id=app.applicant_id,
        applicant_name=app.applicant.full_name,
        applicant_email=app.applicant.email,
        message=app.message,
        status=app.status.value,
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


# ---------------------------------------------------------------------------
# Listings — CRUD
# ---------------------------------------------------------------------------

@router.post(
    "/listings",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a marketplace listing (vendor only)",
)
def create_listing(
    payload: ListingCreate,
    current_user: Annotated[User, Depends(require_vendor)],
    db: Session = Depends(get_db),
) -> ListingResponse:
    try:
        category = ListingCategory(payload.category)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid category '{payload.category}'. "
                   f"Valid values: {[c.value for c in ListingCategory]}",
        )

    listing = Listing(
        vendor_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=category,
        price=payload.price,
        status=ListingStatus.ACTIVE,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    # Eager-load vendor for the response helper
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.vendor))
        .filter(Listing.id == listing.id)
        .one()
    )
    return _listing_to_response(listing, db)


@router.get(
    "/listings",
    response_model=ListingsPageResponse,
    summary="Browse marketplace listings (member + vendor)",
)
def list_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, description="Search title / description"),
    category: str | None = Query(None, description="Filter by category slug"),
    current_user: Annotated[User, Depends(require_member)] = None,
    db: Session = Depends(get_db),
) -> ListingsPageResponse:
    query = (
        db.query(Listing)
        .options(joinedload(Listing.vendor))
        .filter(Listing.status == ListingStatus.ACTIVE)
    )

    if q:
        term = f"%{q}%"
        query = query.filter(
            or_(Listing.title.ilike(term), Listing.description.ilike(term))
        )
    if category:
        try:
            cat = ListingCategory(category)
            query = query.filter(Listing.category == cat)
        except ValueError:
            pass  # Unknown category → return empty, not an error

    total = query.count()
    listings = (
        query.order_by(desc(Listing.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ListingsPageResponse(
        listings=[_listing_to_response(l, db) for l in listings],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, (total + page_size - 1) // page_size),
    )


@router.get(
    "/listings/{listing_id}",
    response_model=ListingResponse,
    summary="Get a single listing",
)
def get_listing(
    listing_id: int,
    current_user: Annotated[User, Depends(require_member)],
    db: Session = Depends(get_db),
) -> ListingResponse:
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.vendor))
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    return _listing_to_response(listing, db)


@router.patch(
    "/listings/{listing_id}",
    response_model=ListingResponse,
    summary="Update own listing (vendor only)",
)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    current_user: Annotated[User, Depends(require_vendor)],
    db: Session = Depends(get_db),
) -> ListingResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if listing.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this listing.")

    if payload.title is not None:
        listing.title = payload.title.strip()
    if payload.description is not None:
        listing.description = payload.description.strip()
    if payload.category is not None:
        try:
            listing.category = ListingCategory(payload.category)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid category '{payload.category}'.")
    if payload.price is not None:
        listing.price = payload.price
    if payload.status is not None:
        try:
            listing.status = ListingStatus(payload.status)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid status '{payload.status}'.")

    db.commit()
    db.refresh(listing)
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.vendor))
        .filter(Listing.id == listing.id)
        .one()
    )
    return _listing_to_response(listing, db)


@router.delete(
    "/listings/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete own listing (vendor only)",
)
def delete_listing(
    listing_id: int,
    current_user: Annotated[User, Depends(require_vendor)],
    db: Session = Depends(get_db),
) -> None:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if listing.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this listing.")
    db.delete(listing)
    db.commit()


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

@router.post(
    "/listings/{listing_id}/apply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply to a listing (member only)",
)
def apply_to_listing(
    listing_id: int,
    payload: ApplicationCreate,
    current_user: Annotated[User, Depends(require_member)],
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if listing.status != ListingStatus.ACTIVE:
        raise HTTPException(status_code=409, detail="This listing is no longer accepting applications.")
    if listing.vendor_id == current_user.id:
        raise HTTPException(status_code=409, detail="Vendors cannot apply to their own listings.")

    existing = (
        db.query(Application)
        .filter(
            Application.listing_id == listing_id,
            Application.applicant_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already applied to this listing.")

    app = Application(
        listing_id=listing_id,
        applicant_id=current_user.id,
        message=payload.message,
        status=ApplicationStatus.PENDING,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    app = (
        db.query(Application)
        .options(joinedload(Application.applicant))
        .filter(Application.id == app.id)
        .one()
    )
    return _app_to_response(app)


@router.get(
    "/listings/{listing_id}/applications",
    response_model=list[ApplicationResponse],
    summary="View applications on own listing (vendor only)",
)
def list_applications(
    listing_id: int,
    current_user: Annotated[User, Depends(require_vendor)],
    db: Session = Depends(get_db),
) -> list[ApplicationResponse]:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
    if listing.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this listing.")

    apps = (
        db.query(Application)
        .options(joinedload(Application.applicant))
        .filter(Application.listing_id == listing_id)
        .order_by(Application.created_at)
        .all()
    )
    return [_app_to_response(a) for a in apps]


@router.patch(
    "/listings/{listing_id}/applications/{application_id}",
    response_model=ApplicationResponse,
    summary="Accept or reject an application (vendor only)",
)
def update_application_status(
    listing_id: int,
    application_id: int,
    payload: ApplicationStatusUpdate,
    current_user: Annotated[User, Depends(require_vendor)],
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing or listing.vendor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    app = (
        db.query(Application)
        .options(joinedload(Application.applicant))
        .filter(Application.id == application_id, Application.listing_id == listing_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    try:
        app.status = ApplicationStatus(payload.status)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{payload.status}'. "
                   f"Valid: accepted, rejected",
        )
    db.commit()
    db.refresh(app)
    return _app_to_response(app)


@router.delete(
    "/listings/{listing_id}/applications/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Withdraw own application (member only)",
)
def withdraw_application(
    listing_id: int,
    application_id: int,
    current_user: Annotated[User, Depends(require_member)],
    db: Session = Depends(get_db),
) -> None:
    app = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.listing_id == listing_id,
            Application.applicant_id == current_user.id,
        )
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    if app.status == ApplicationStatus.ACCEPTED:
        raise HTTPException(
            status_code=409,
            detail="Cannot withdraw an already accepted application. Contact the vendor.",
        )
    db.delete(app)
    db.commit()
