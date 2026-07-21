"""
Public config endpoint.

Returns settings that the frontend needs to know at runtime but that
are declared as environment variables on the backend — e.g. the
registration fee so the UI always reflects whatever the server expects.

No authentication required; the values exposed here are non-sensitive.
"""
from fastapi import APIRouter
from app.config import get_settings

router = APIRouter(prefix="/config", tags=["Config"])
_settings = get_settings()


@router.get("", summary="Public runtime configuration")
def get_config() -> dict:
    """
    Returns safe, non-sensitive runtime config values.
    The frontend calls this on startup to pick up the live fee amount.
    """
    return {
        "registration_fee_kes": _settings.registration_fee_kes,
        "currency": "KES",
    }
