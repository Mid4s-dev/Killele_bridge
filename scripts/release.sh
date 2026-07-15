#!/usr/bin/env bash
# =============================================================================
# Heroku release-phase script
# Runs BEFORE the web dyno starts on every successful deploy.
# Applies any pending Alembic migrations to the production database.
# =============================================================================
set -euo pipefail

echo "==> [release] Starting release phase"
echo "==> [release] Working directory: $(pwd)"

# The Dockerfile sets WORKDIR /app/kilele_bridge, so this is already correct.
# alembic.ini must be in the current directory.
if [ ! -f "alembic.ini" ]; then
  echo "ERROR: alembic.ini not found in $(pwd). Aborting." >&2
  exit 1
fi

echo "==> [release] Running: alembic upgrade head"
alembic upgrade head

echo "==> [release] Migrations complete."
