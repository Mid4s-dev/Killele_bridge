# Kilele Bridge — Backend API

A coaching platform for Kenyan freelancers. Built with **FastAPI**, **MySQL**, and **IntaSend** payments.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Local Setup](#local-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Running the Server](#running-the-server)
7. [API Reference](#api-reference)
8. [Payment Flow](#payment-flow)
9. [Security Architecture](#security-architecture)
10. [Production Checklist](#production-checklist)

---

## Project Structure

```
kilele_bridge/
├── alembic/                    # Database migrations
│   ├── versions/
│   │   └── 0001_initial_schema.py
│   ├── env.py
│   └── script.py.mako
├── alembic.ini
├── app/
│   ├── core/
│   │   ├── dependencies.py     # FastAPI auth dependencies (get_current_user, etc.)
│   │   └── security.py         # bcrypt hashing + JWT utilities
│   ├── models/
│   │   ├── user.py             # User ORM model (roles: free / member / admin)
│   │   └── payment.py          # Payment ORM model (statuses: pending / complete / failed / cancelled)
│   ├── routers/
│   │   ├── auth.py             # POST /auth/register, POST /auth/login, GET /auth/me
│   │   ├── payments.py         # POST /payments/initiate, POST /payments/webhook, GET /payments/status/{id}
│   │   └── coaching.py         # GET /coaching/resources (member-only)
│   ├── schemas/
│   │   ├── auth.py             # Pydantic request/response schemas for auth
│   │   └── payment.py          # Pydantic schemas for payments and webhook
│   ├── services/
│   │   ├── auth_service.py     # Registration and login business logic
│   │   └── payment_service.py  # IntaSend checkout + webhook processing
│   ├── config.py               # Settings (loaded from .env via pydantic-settings)
│   ├── database.py             # SQLAlchemy engine, session, Base
│   └── main.py                 # FastAPI app, middleware, router mounts
├── scripts/
│   └── db_init.py              # CLI: --create-tables and --seed-admin
├── .env.example
├── .gitignore
└── requirements.txt
```

---

## Prerequisites

- Python 3.11+
- MySQL 8.0+
- A free [IntaSend developer account](https://developers.intasend.com/) for sandbox keys

---

## Local Setup

```bash
# 1. Clone and enter the project
cd kilele_bridge

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy the environment template and fill in your values
cp .env.example .env
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `APP_ENV` | yes | `development` or `production` |
| `APP_SECRET_KEY` | yes | Random string ≥ 64 chars — signs JWTs |
| `FRONTEND_URL` | yes | Public URL of the React/Next frontend, used for CORS |
| `DATABASE_URL` | yes | `mysql+pymysql://user:pass@host:3306/dbname` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | no | Default: `60` |
| `INTASEND_PUBLISHABLE_KEY` | yes | From IntaSend dashboard |
| `INTASEND_SECRET_KEY` | yes | From IntaSend dashboard |
| `INTASEND_TEST_MODE` | no | `true` (sandbox) / `false` (live) |
| `REGISTRATION_FEE_KES` | no | Default: `100` |
| `PAYMENT_REDIRECT_URL` | yes | Where users land after completing payment |
| `PAYMENT_WEBHOOK_SECRET` | yes | Random string — verifies IntaSend webhook signatures |

For Heroku, set `FRONTEND_URL` to the deployed frontend app URL and `PAYMENT_REDIRECT_URL` to that app's public success page. The backend accepts Heroku hostnames in production via `*.herokuapp.com`, so custom domains only need to be added if you use them.

**Generate secure secrets:**
```bash
python3 -c "import secrets; print(secrets.token_hex(64))"
```

---

## Database Setup

### Option A — Alembic (recommended for all environments)

```bash
# Apply all migrations to head
alembic upgrade head

# Check current revision
alembic current

# Roll back one step if needed
alembic downgrade -1
```

### Option B — Quick init script (development / CI only)

```bash
# Create tables directly from SQLAlchemy metadata
python scripts/db_init.py --create-tables

# Seed the first admin account
# Password is read from ADMIN_SEED_PASSWORD env var or prompted interactively
ADMIN_SEED_EMAIL=admin@kilelebridge.co.ke \
ADMIN_SEED_PASSWORD=YourStr0ngPass! \
python scripts/db_init.py --seed-admin
```

### Create the MySQL database and user

```sql
CREATE DATABASE kilele_bridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kilele_user'@'localhost' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON kilele_bridge_db.* TO 'kilele_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Running the Server

```bash
# Development (auto-reload, interactive docs at http://127.0.0.1:8000/docs)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Production (multiple workers, no reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

> In production, sit Uvicorn behind **Nginx** (reverse proxy + TLS termination).
> Interactive docs (`/docs`, `/redoc`) are automatically disabled when `APP_ENV=production`.

---

## API Reference

All routes are prefixed with `/api/v1`.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Create a FREE-tier account |
| `POST` | `/api/v1/auth/login` | None | Get a JWT Bearer token |
| `GET` | `/api/v1/auth/me` | Bearer | Return current user profile |

**Register example:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Jane Mwangi","email":"jane@example.co.ke","password":"Str0ng!Pass"}'
```

**Login example:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.co.ke","password":"Str0ng!Pass"}'
# Returns: {"access_token": "<jwt>", "token_type": "bearer", "user": {...}}
```

### Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/payments/initiate` | Bearer | Start a 100 KES checkout |
| `POST` | `/api/v1/payments/webhook` | Signature | IntaSend event receiver (internal) |
| `GET` | `/api/v1/payments/status/{id}` | Bearer | Poll payment status |

### Coaching (members only)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/coaching/resources` | Bearer + MEMBER role | List coaching resources |
| `GET` | `/api/v1/coaching/resources/{id}` | Bearer + MEMBER role | Fetch a single resource |

### Admin (admin role only)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/members` | Bearer + ADMIN role | List all registered users with pagination and search |

**Query Parameters:**
- `page` (int, default: 1) — Page number (1-indexed)
- `page_size` (int, default: 20, max: 100) — Items per page
- `q` (string, optional) — Search by email, name, or phone (case-insensitive)
- `sort_by` (string, default: "created_at") — Sort field: `created_at`, `email`, or `role`
- `order` (string, default: "desc") — Sort order: `asc` or `desc`

**Response includes:**
- User ID, full name, email, phone number
- Role (free / member / admin), active status, KYC status
- Timestamps (created_at, updated_at)
- Latest payment details (status, amount, date) if any payments exist
- Pagination metadata (total, page, page_size, total_pages)

**Security:** Returns `403 Forbidden` if the requesting user does not have the ADMIN role.

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/admin/members?page=1&page_size=20&q=jane" \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Unauthenticated uptime check |

---

## Payment Flow

```
Client                    Kilele Bridge API           IntaSend
  |                              |                        |
  |-- POST /payments/initiate -->|                        |
  |                              |-- create checkout ---->|
  |                              |<-- invoice_id + URL ---|
  |<-- {checkout_url} -----------|                        |
  |                              |                        |
  |-- redirect to checkout_url --------------------------------->|
  |                              |                        |
  |                              |<-- POST /payments/webhook ----|
  |                              |    (HMAC-SHA256 verified)     |
  |                              |                        |
  |                              |-- if state==COMPLETE:         |
  |                              |   update payment status       |
  |                              |   upgrade user role → MEMBER  |
  |                              |                        |
  |-- GET /payments/status/{id}->|                        |
  |<-- {status: "complete"} -----|                        |
```

---

## Security Architecture

| Concern | Implementation |
|---|---|
| Password storage | bcrypt (work-factor 12) via passlib — plaintext never stored |
| SQL injection | SQLAlchemy ORM with parameterised queries throughout — no raw SQL string interpolation |
| JWT signing | HS256, short-lived tokens (60 min default), secret loaded from env only |
| Webhook authenticity | HMAC-SHA256 signature verification before any payload parsing or DB writes |
| User enumeration | Identical error message for wrong email and wrong password |
| HTTP headers | `X-Frame-Options`, `X-Content-Type-Options`, `CSP`, `HSTS` (production), `Referrer-Policy` |
| CORS | Locked to configured origins in production; wildcard only in development |
| Host header injection | `TrustedHostMiddleware` rejects unexpected `Host` values in production |
| Secrets management | All secrets in `.env` (gitignored); `.env.example` contains no real values |
| OpenAPI docs | Disabled (`docs_url=None`) when `APP_ENV=production` |
| Role escalation | User role upgrade happens only after webhook signature is verified AND `state == COMPLETE` |
| Ownership checks | Users can only read/modify their own payment records |

### What this platform does NOT do

- No proxy masking or IP rotation logic
- No account sharing or credential relay mechanisms
- No circumvention of third-party platform policies
- No storage of raw identity documents

---

## Admin Access

The admin dashboard provides platform administrators with a comprehensive view of all registered users, their membership status, payment history, and contact details.

### Admin Dashboard UI

Navigate to `/admin` in the frontend to access the admin dashboard. The route is protected — non-admin users are automatically redirected to the main dashboard.

**Features:**
- **User List Table:** Displays all registered users with:
  - Full name, email, phone number
  - Role badges (Admin / Active Member / Free Tier)
  - Payment status indicators (complete, pending, failed, cancelled)
  - Join date and last update timestamps
- **Search:** Real-time search by email, name, or phone number
- **Pagination:** Navigate through large user lists (20 users per page)
- **Statistics:** Quick view of total users, active members, and free-tier accounts

### Admin API Endpoint

**Endpoint:** `GET /api/v1/admin/members`

**Authentication:** Requires a valid JWT Bearer token with **ADMIN role**. Returns `403 Forbidden` for non-admin users.

**Query Parameters:**
- `page` (int, default: 1) — Page number (1-indexed)
- `page_size` (int, default: 20, max: 100) — Items per page
- `q` (string, optional) — Search term (filters by email, name, or phone)
- `sort_by` (string, default: "created_at") — Sort field: `created_at`, `email`, or `role`
- `order` (string, default: "desc") — Sort order: `asc` or `desc`

**Response Format:**
```json
{
  "users": [
    {
      "id": 1,
      "full_name": "Jane Mwangi",
      "email": "jane@example.co.ke",
      "phone_number": "+254712345678",
      "role": "member",
      "is_active": true,
      "kyc_status": "not_started",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z",
      "latest_payment_status": "complete",
      "latest_payment_amount": "500.00",
      "latest_payment_date": "2024-01-15T11:45:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

### Designating an Admin User

Admin users must be created directly in the MySQL database. **Never expose admin role assignment via a public API endpoint.**

#### Option 1: Promote an existing user to admin

```sql
-- Find the user by email
SELECT id, email, role FROM users WHERE email = 'admin@kilelebridge.co.ke';

-- Promote to admin role
UPDATE users SET role = 'admin' WHERE email = 'admin@kilelebridge.co.ke';
```

#### Option 2: Use the seed script (development only)

```bash
# Set admin credentials via environment variables
ADMIN_SEED_EMAIL=admin@kilelebridge.co.ke \
ADMIN_SEED_PASSWORD=YourStr0ngPass! \
python scripts/db_init.py --seed-admin
```

The seed script creates a new user with the ADMIN role. It's safe to run multiple times — it skips if the email already exists.

#### Option 3: Direct SQL insert (production)

```sql
-- Create admin user directly (replace with real bcrypt hash)
-- Generate hash: python3 -c "from passlib.context import CryptContext; print(CryptContext(['bcrypt']).hash('YourPassword'))"

INSERT INTO users (full_name, email, hashed_password, role, is_active, kyc_status, created_at, updated_at)
VALUES (
  'Admin User',
  'admin@kilelebridge.co.ke',
  '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH',
  'admin',
  1,
  'not_started',
  NOW(),
  NOW()
);
```

### Security Notes

- **Admin endpoints return 403 for non-admin users** — the `require_admin` dependency checks the JWT payload and rejects requests if `user.role != "admin"`.
- **No sensitive credential material is exposed** — hashed passwords are excluded from all API responses.
- **Admin role cannot be self-assigned** — there is no registration or profile update endpoint that accepts a `role` field.
- **Access control is enforced at the API layer** — the frontend role guard is a UX convenience, not a security boundary.

---

## Production Checklist

- [ ] Set `APP_ENV=production` in your environment
- [ ] Generate a strong `APP_SECRET_KEY` (≥ 64 random hex chars)
- [ ] Generate a strong `PAYMENT_WEBHOOK_SECRET`
- [ ] Set `INTASEND_TEST_MODE=false` and use live IntaSend keys
- [ ] Restrict `DATABASE_URL` user to minimum required privileges
- [ ] Sit Uvicorn behind Nginx with a valid TLS certificate (Let's Encrypt)
- [ ] Register your webhook URL with IntaSend: `https://kilelebridge.co.ke/api/v1/payments/webhook`
- [ ] Set `ALLOWED_HOSTS` and `CORS_ORIGINS` in `main.py` to your real domain
- [ ] Enable MySQL `require_secure_transport` to enforce TLS on DB connections
- [ ] Set up log rotation and monitoring (e.g., structured JSON logs → CloudWatch / Datadog)
- [ ] Run `alembic upgrade head` as part of your deployment pipeline, not at app startup
