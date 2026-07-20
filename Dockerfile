# =============================================================================
# Stage 1 — Build the Next.js static export
# =============================================================================
FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /build/frontend

ENV NEXT_TELEMETRY_DISABLED=1
# API calls are same-origin in production (/api/v1), so no absolute URL needed
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_REGISTRATION_FEE_KES=100
ENV NEXT_PUBLIC_REGISTRATION_FEE_KES=$NEXT_PUBLIC_REGISTRATION_FEE_KES

# Install deps first (layer-cached unless package-lock changes)
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY frontend/ ./
RUN npm run build
# Output is in /build/frontend/out


# =============================================================================
# Stage 2 — Production runtime image
# =============================================================================
FROM python:3.12-slim AS runtime

# ── System hardening ──────────────────────────────────────────────────────
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

# Non-root user for security
RUN addgroup --system kilele && adduser --system --ingroup kilele kilele

# ── Python dependencies ───────────────────────────────────────────────────
WORKDIR /app/kilele_bridge
COPY kilele_bridge/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────
COPY kilele_bridge/ ./

# ── Frontend static export ────────────────────────────────────────────────
# Placed at /app/frontend/out — matches the path resolved by main.py
COPY --from=frontend-builder /build/frontend/out /app/frontend/out

# ── Alembic migration script (release phase) ─────────────────────────────
COPY scripts/release.sh /app/release.sh
RUN chmod +x /app/release.sh

# Hand off ownership to the non-root user
RUN chown -R kilele:kilele /app
USER kilele

# ── Startup ───────────────────────────────────────────────────────────────
# Heroku sets $PORT dynamically. Gunicorn manages the uvicorn worker process.
# Single dyno → 1 worker (-w 1). WEB_CONCURRENCY can override via config var.
EXPOSE 8000
CMD gunicorn app.main:app \
      --worker-class uvicorn.workers.UvicornWorker \
      --workers "${WEB_CONCURRENCY:-1}" \
      --bind "0.0.0.0:${PORT:-8000}" \
      --timeout 120 \
      --keep-alive 5 \
      --log-level info \
      --access-logfile -
