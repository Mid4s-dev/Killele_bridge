"""
Coaching router — member-only resources.

All endpoints here require a paid MEMBER (or ADMIN) role.
This is where Kilele Bridge's core value lives:
  - Portfolio review guides
  - Legitimate job search strategies for the Kenyan market
  - Freelancer pricing frameworks
  - Client communication templates
"""
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.dependencies import require_member
from app.models.user import User

router = APIRouter(prefix="/coaching", tags=["Coaching"])


@router.get(
    "/resources",
    summary="List available coaching resources (members only)",
)
def list_resources(
    _current_user: Annotated[User, Depends(require_member)],
) -> dict:
    """
    Returns the catalogue of coaching resources available to paid members.
    Replace the static list below with a database-driven resource model
    when your content library grows.
    """
    return {
        "resources": [
            {
                "id": 1,
                "title": "Building a Winning Upwork Profile for Kenyan Freelancers",
                "category": "portfolio",
                "description": (
                    "Step-by-step guide to crafting a profile that converts "
                    "visitors into clients — including niche selection, "
                    "portfolio curation, and rate setting."
                ),
            },
            {
                "id": 2,
                "title": "Client Communication Templates",
                "category": "communication",
                "description": (
                    "Professionally written proposal, follow-up, and "
                    "contract negotiation templates tailored to the "
                    "East African freelance market."
                ),
            },
            {
                "id": 3,
                "title": "Pricing Your Services in USD/KES",
                "category": "business",
                "description": (
                    "A practical framework for calculating your minimum viable "
                    "rate, anchoring against Kenyan living costs, and "
                    "positioning for premium clients."
                ),
            },
            {
                "id": 4,
                "title": "Legitimate Job Search Strategies",
                "category": "job-search",
                "description": (
                    "Ethical, platform-compliant methods for finding "
                    "consistent freelance work: cold outreach, LinkedIn "
                    "optimisation, and local business targeting."
                ),
            },
            {
                "id": 5,
                "title": "Introduction to Next.js for Freelancers",
                "category": "development",
                "description": "Learn the basics of Next.js and React to build modern web applications for your clients quickly.",
            },
            {
                "id": 6,
                "title": "Advanced API Integration in Python",
                "category": "development",
                "description": "Master building and consuming REST APIs in Python using FastAPI, including secure authentication and deployment.",
            },
            {
                "id": 7,
                "title": "Mastering LiDAR Data Processing",
                "category": "lidar",
                "description": "Comprehensive course on handling and processing LiDAR data for GIS professionals and mapping projects.",
            },
        ]
    }


@router.get(
    "/resources/{resource_id}",
    summary="Fetch a single coaching resource (members only)",
)
def get_resource(
    resource_id: int,
    _current_user: Annotated[User, Depends(require_member)],
) -> dict:
    """
    Placeholder for fetching a specific resource by ID.
    Wire this to your content database / CMS in production.
    """
    # TODO: replace with a real DB lookup
    return {
        "id": resource_id,
        "message": "Resource content would be fetched from the database here.",
    }
