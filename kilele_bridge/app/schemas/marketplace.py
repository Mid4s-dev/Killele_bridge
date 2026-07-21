"""
Marketplace Pydantic schemas — request bodies and response shapes.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Listing schemas
# ---------------------------------------------------------------------------

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, examples=["Fiverr Level-2 Account for Sale"])
    description: str = Field(..., min_length=20, examples=["Established account with 5-star rating and 200+ reviews."])
    category: str = Field(..., examples=["account_sale"])  # matches ListingCategory values
    price: Optional[Decimal] = Field(None, ge=0, examples=[15000.00])


class ListingUpdate(BaseModel):
    title:       Optional[str]          = Field(None, min_length=5, max_length=200)
    description: Optional[str]          = Field(None, min_length=20)
    category:    Optional[str]          = None
    price:       Optional[Decimal]      = Field(None, ge=0)
    status:      Optional[str]          = None   # active | paused | closed | sold


class ListingResponse(BaseModel):
    id:          int
    vendor_id:   int
    vendor_name: str        # denormalised for display
    title:       str
    description: str
    category:    str
    price:       Optional[str]   = None   # serialised as string to avoid float precision issues
    status:      str
    created_at:  datetime
    updated_at:  datetime
    application_count: int = 0

    model_config = {"from_attributes": True}


class ListingsPageResponse(BaseModel):
    listings:    list[ListingResponse]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


# ---------------------------------------------------------------------------
# Application schemas
# ---------------------------------------------------------------------------

class ApplicationCreate(BaseModel):
    message: Optional[str] = Field(
        None,
        max_length=1000,
        examples=["I am very interested in this listing and have 3 years of experience."],
    )


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., examples=["accepted"])  # accepted | rejected


class ApplicationResponse(BaseModel):
    id:            int
    listing_id:    int
    applicant_id:  int
    applicant_name: str     # denormalised
    applicant_email: str    # denormalised
    message:       Optional[str]
    status:        str
    created_at:    datetime
    updated_at:    datetime

    model_config = {"from_attributes": True}
