"""
KYC (Know Your Customer) router.

Current implementation: functional stub that records document uploads
and tracks verification status via a simple status flag on the User model.

Phase 2 roadmap:
  - Store encrypted ID images in S3-compatible object storage
  - Admin review queue endpoint
  - Webhook / notification on status change
"""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User, KycStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kyc", tags=["KYC"])

# Allowed MIME types for ID uploads
_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


@router.get(
    "/status",
    summary="Return the current KYC verification status for the logged-in user",
)
def get_kyc_status(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """
    Returns the KYC status for the authenticated user.

    Possible values:
      not_started      — user has not submitted documents yet
      pending          — documents submitted, awaiting admin review
      verified         — identity confirmed
      action_required  — documents rejected, re-submission needed
    """
    return {
        "status": current_user.kyc_status.value,
        "submitted_at": None,
        "reviewed_at": None,
        "notes": None,
    }


@router.post(
    "/submit",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit National ID images for verification",
)
async def submit_kyc(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    id_front: Annotated[UploadFile, File(description="Front of National ID")],
    id_back: Annotated[UploadFile, File(description="Back of National ID")],
) -> dict:
    """
    Accept front and back images of the user's National ID.

    Security:
    - File type restricted to JPEG/PNG/WebP.
    - Maximum 5 MB per file enforced server-side.
    - Files are not persisted in this stub — add encrypted S3 storage in production.
    - Status transitions: not_started/action_required → pending only.
    """
    if current_user.kyc_status == KycStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Your identity is already verified.",
        )
    if current_user.kyc_status == KycStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Your documents are already under review.",
        )

    # Validate file types
    for upload, label in ((id_front, "id_front"), (id_back, "id_back")):
        if upload.content_type not in _ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{label}: only JPEG, PNG, and WebP are accepted.",
            )
        contents = await upload.read()
        if len(contents) > _MAX_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"{label}: file exceeds the 5 MB limit.",
            )
        # TODO: encrypt and store contents in S3 / object storage here

    # Advance KYC status to pending
    current_user.kyc_status = KycStatus.PENDING
    db.commit()

    logger.info("KYC documents received for user %s — status set to PENDING.", current_user.id)

    return {"message": "Documents received. We will review them within 1–2 business days."}
