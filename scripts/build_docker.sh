#!/bin/bash
set -e

echo "🧹 Cleaning up UI build artifacts..."
rm -rf frontend/.next frontend/out

echo "🐳 Building Docker image..."
docker build -t kilele_bridge_app .

echo "🛑 Stopping existing container (if any)..."
docker rm -f kilele_bridge_app 2>/dev/null || true

echo "🚀 Starting new Docker container..."
docker run -d --name kilele_bridge_app -p 8000:8000 --env-file kilele_bridge/.env -e PORT=8000 kilele_bridge_app

echo "✅ Done! Application is running on http://localhost:8000"
