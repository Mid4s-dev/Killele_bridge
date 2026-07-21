"""
Kilele Bridge — FastAPI application entry point.

Architecture (single Heroku dyno):
  - All /api/v1/* requests are handled by FastAPI
  - Everything else is served from the Next.js static export (frontend/out/)
  - Alembic migrations run in the Heroku release phase before startup

Middleware stack (outermost → innermost):
  1. TrustedHostMiddleware  — rejects requests with unexpected Host headers
  2. SecurityHeadersMiddleware (custom) — HSTS, CSP, X-Frame-Options, etc.
  3. CORSMiddleware          — same-origin in prod; localhost only in dev
  4. GZipMiddleware          — compress responses > 1 KB
"""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import admin, auth, coaching, config, kyc, payments

settings = get_settings()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG if settings.app_env == "development" else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Frontend static export path resolution
#
# Docker image layout:
#   /app/
#     kilele_bridge/     ← WORKDIR (this file lives at app/main.py inside it)
#     frontend/out/      ← Next.js static export
#
# FRONTEND_OUT_DIR env-var overrides the auto-detection for local dev.
# ---------------------------------------------------------------------------
def _find_frontend_out() -> Path | None:
    override = os.environ.get("FRONTEND_OUT_DIR")
    if override:
        p = Path(override)
        return p if p.is_dir() else None

    candidates = [
        Path(__file__).resolve().parents[1] / "frontend" / "out",  # local dev
        Path(__file__).resolve().parents[2] / "frontend" / "out",  # Docker
    ]
    for p in candidates:
        if p.is_dir():
            return p
    return None


FRONTEND_OUT = _find_frontend_out()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Kilele Bridge starting — env=%s  frontend=%s",
        settings.app_env,
        FRONTEND_OUT or "NOT FOUND (API-only mode)",
    )
    yield
    logger.info("Kilele Bridge shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Kilele Bridge API",
    version="1.0.0",
    description="Backend API for the Kilele Bridge freelancer coaching platform.",
    # Interactive docs only in development
    docs_url="/api/docs"       if settings.app_env == "development" else None,
    redoc_url="/api/redoc"     if settings.app_env == "development" else None,
    openapi_url="/api/openapi.json" if settings.app_env == "development" else None,
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

# 1. Trusted hosts — prevents Host-header injection
ALLOWED_HOSTS = (
    ["*"]
    if settings.app_env == "development"
    else [
        "*.herokuapp.com",
        "kilelebridge.co.ke",
        "www.kilelebridge.co.ke",
    ]
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)


# 2. Security response headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.app_env == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
    # CSP: Next.js static export requires 'unsafe-inline' for its runtime chunks.
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob: https://images.unsplash.com; "
        "connect-src 'self'; "
        "frame-ancestors 'none';"
    )
    return response


# 3. CORS — same-origin in production; dev origins for local work
CORS_ORIGINS = (
    ["http://localhost:3000", "http://127.0.0.1:3000"]
    if settings.app_env == "development"
    else [settings.frontend_url]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# 4. Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1024)


# ---------------------------------------------------------------------------
# API routers  — all mounted under /api/v1
# ---------------------------------------------------------------------------
app.include_router(config.router,   prefix="/api/v1")   # public, no auth
app.include_router(auth.router,     prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(kyc.router,      prefix="/api/v1")
app.include_router(coaching.router, prefix="/api/v1")
app.include_router(admin.router,    prefix="/api/v1")   # admin-only, role-gated


# ---------------------------------------------------------------------------
# Health check  — unauthenticated, used by Heroku's router / uptime monitors
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"], include_in_schema=False)
def health_check() -> dict:
    return {"status": "ok", "service": "kilele-bridge"}


# ---------------------------------------------------------------------------
# Frontend static files + SPA catch-all
#
# Mount order is critical — API routes above must be registered FIRST so
# the StaticFiles mount at "/" never shadows them.
#
#   /_next/*  → raw static chunks (JS, CSS) served with long-lived caching
#   /*        → html=True mode: serves .html files for matching paths
#              and falls back to 404.html; Next.js client router takes over
# ---------------------------------------------------------------------------
if FRONTEND_OUT is not None:
    _next_dir = FRONTEND_OUT / "_next"
    if _next_dir.is_dir():
        app.mount(
            "/_next",
            StaticFiles(directory=str(_next_dir)),
            name="next-chunks",
        )

    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_OUT), html=True),
        name="frontend",
    )
    logger.info("Frontend static files mounted from %s", FRONTEND_OUT)
else:
    @app.get("/", include_in_schema=False)
    def _root_fallback() -> dict:
        return {"message": "Kilele Bridge API — frontend not bundled."}
    logger.warning("Frontend out/ directory not found — running in API-only mode.")
