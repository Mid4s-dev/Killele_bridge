# NOTE: This Procfile is NOT used when deploying via heroku.yml (container stack).
# The run: section in heroku.yml defines the web process instead.
# This file is kept as a reference for local uvicorn testing:
#   heroku local web
web: gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --workers 1 --bind 0.0.0.0:${PORT:-8000} --chdir kilele_bridge
