# Killele Bridge

This repository can run as a single Heroku container: the Docker image builds
the Next.js frontend into static files and FastAPI serves both the frontend and
the API from one dyno.

Heroku container deployment:

```bash
heroku stack:set container -a kilele
heroku container:login
heroku container:push web -a kilele
heroku container:release web -a kilele
```

Set these runtime vars on the Heroku app:

- `APP_ENV=production`
- `APP_SECRET_KEY=<random>`
- `DATABASE_URL=<mysql url>`
- `INTASEND_PUBLISHABLE_KEY=<your key>`
- `INTASEND_SECRET_KEY=<your key>`
- `INTASEND_TEST_MODE=false`
- `PAYMENT_WEBHOOK_SECRET=<random>`
- `PAYMENT_REDIRECT_URL=https://<your-app>.herokuapp.com/payment/success`
- `FRONTEND_URL=https://<your-app>.herokuapp.com`

## Starting Docker Manually for Local Testing

To build and run the application locally using Docker, follow these steps:

1. **Build the Docker Image**:
   ```bash
   docker build -t kilele_bridge_app .
   ```

2. **Run the Docker Container**:
   You can run the container and pass any necessary environment variables (like the database URL or app secret). For example, to run the container and expose it on port 8000:
   ```bash
   docker run -p 8000:8000 --env-file kilele_bridge/.env -e PORT=8000 kilele_bridge_app
   ```

3. **Access the Application**:
   Once the container is running, access the platform by visiting `http://localhost:8000` in your web browser.