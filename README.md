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