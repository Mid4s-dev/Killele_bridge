"""
Kilele Bridge — FastAPI application entry point.

Security middleware applied (outermost → innermost):
  1. TrustedHostMiddleware  — rejects requests with unexpected Host headers
  2. SecurityHeadersMiddleware (custom) — adds HSTS, CSP, X-Frame-Options, etc.
  3. CORSMiddleware          — restricts cross-origin access to configured origins
  4. GZipMiddleware          — compression for responses > 1 KB
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.routers import auth, payments, coaching

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
# Lifespan (startup / shutdown hooks)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Kilele Bridge starting up — env=%s", settings.app_env)
    yield
    logger.info("Kilele Bridge shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Kilele Bridge API",
    description=(
        "Backend API for the Kilele Bridge freelancer coaching platform. "
        "Provides user registration, authentication, membership payments, "
        "and access to coaching resources for Kenyan freelancers."
    ),
    version="1.0.0",
    docs_url="/docs" if settings.app_env == "development" else None,
    redoc_url="/redoc" if settings.app_env == "development" else None,
    openapi_url="/openapi.json" if settings.app_env == "development" else None,
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Middleware stack
# ---------------------------------------------------------------------------

# 1. Trusted host — prevents HTTP Host header injection
#    Update ALLOWED_HOSTS in production to your actual domain(s)
ALLOWED_HOSTS = (
    ["*"]
    if settings.app_env == "development"
    else ["kilelebridge.co.ke", "www.kilelebridge.co.ke"]
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)


# 2. Security response headers (custom middleware)
@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # Only set HSTS in production (HTTPS required)
    if settings.app_env == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data:; "
        "frame-ancestors 'none';"
    )
    return response


# 3. CORS — lock down to your frontend origin(s) in production
CORS_ORIGINS = (
    ["*"]
    if settings.app_env == "development"
    else ["https://kilelebridge.co.ke", "https://www.kilelebridge.co.ke"]
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
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router,     prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(coaching.router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health check — unauthenticated, used by load balancers / uptime monitors
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"], include_in_schema=False)
def health_check() -> dict:
    return {"status": "ok", "service": "kilele-bridge"}
