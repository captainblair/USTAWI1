# Ustawi

**Find safe homes. Rent with confidence. Thrive where you live.**

Ustawi is a verified rental and housing platform (PropTech) built for Nairobi and Kenya's broader housing market. It helps tenants find safe, verified homes while giving landlords and agents reliable tools for property management, tenant screening, and rent collection.

This repository contains the full-stack Ustawi platform. **Phase 1 (backend foundation & authentication) is complete.** The frontend and remaining backend phases are planned and documented below.

---

## Table of Contents

- [Core Value Proposition](#core-value-proposition)
- [Platform Modules](#platform-modules)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Backend (Phase 1 — Complete)](#backend-phase-1--complete)
- [Frontend (Planned)](#frontend-planned)
- [Development Phases Roadmap](#development-phases-roadmap)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference (Phase 1)](#api-reference-phase-1)
- [Docker Workflow](#docker-workflow)
- [Deployment](#deployment)
- [Security & Compliance](#security--compliance)
- [Contributing](#contributing)

---

## Core Value Proposition

| Pillar | Description |
|--------|-------------|
| **Trust** | Verified listings, safety scores, inspector workflows, and community reporting |
| **Safety** | AI-assisted safety scoring, document verification, and dispute resolution |
| **Transparency** | Clear pricing, landlord profiles, lease documents, and payment receipts |
| **Local-first** | M-Pesa payments, Kenyan phone OTP (+254), Nairobi-centric locations |

---

## Platform Modules

| Module | Description | Status |
|--------|-------------|--------|
| Homepage & Search | Map-based search, filters (price, safety, amenities), featured listings | Backend: Phase 2 |
| Property Listings | Photos, documents, safety scores, virtual tours | Backend: Phase 2–4 |
| Tenant Portal | Applications, leases, M-Pesa rent, maintenance, dashboard | Backend: Phase 3–7 |
| Landlord / Agent Portal | Property CRUD, application inbox, analytics, billing | Backend: Phase 2–10 |
| Inspector / Admin | Verification queue, safety scoring, platform management | Backend: Phase 4, 10 |
| Community & Insights | Utility reports, forums, safety alerts | Backend: Post-MVP |
| Blog / Resources | Tenant rights, market trends, maintenance tips | Backend: Post-MVP |

---

## Technology Stack

### Backend (current)

| Layer | Technology |
|-------|-------------|
| Framework | Django 5.x + Django REST Framework |
| Auth | JWT (`djangorestframework-simplejwt`) + token blacklist |
| Database | PostgreSQL + PostGIS (geo search in Phase 2+) |
| Cache / Queue | Redis + Celery (configured, tasks in later phases) |
| API Docs | drf-spectacular (OpenAPI 3 / Swagger) |
| SMS / OTP | Africa's Talking |
| File Storage | Local (dev) → S3 / Cloudinary (production) |
| Deploy target | Render |

### Frontend (planned)

| Layer | Technology |
|-------|-------------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS + Shadcn/ui + Radix UI |
| State | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Maps | Mapbox GL JS or Leaflet |
| Real-time | WebSockets / polling (Phase 8+) |
| Deploy target | Vercel |

### Design Language

Inspired by Nenasasa: **navy hero sections**, **red accent CTAs**, generous whitespace, mobile-first responsive layout.

---

## Repository Structure

```
ustawi/
├── backend/                    # Django REST API
│   ├── config/                 # Settings (dev / staging / prod), URLs, WSGI
│   ├── core/                   # Shared utilities, RBAC, pagination, health check
│   ├── apps/
│   │   └── accounts/           # Users, auth, profiles, OTP (Phase 1)
│   ├── requirements/           # base.txt, dev.txt, prod.txt
│   ├── Dockerfile
│   ├── manage.py
│   └── .env.example            # Copy to .env — never commit .env
├── frontend/                   # Next.js app (Phase 2 of project — not yet started)
├── docker-compose.yml          # PostGIS + Redis + Django web
├── render.yaml                 # Render deployment blueprint
├── images/                     # Wireframes & sample assets (gitignored for now)
└── README.md
```

---

## Backend (Phase 1 — Complete)

### What's implemented

- **Project scaffold** — Django 5, DRF, Docker Compose, multi-environment settings
- **Custom User model** — UUID primary key, email login, Kenyan phone support
- **Roles** — `TENANT`, `LANDLORD`, `AGENT`, `INSPECTOR`, `ADMIN`
- **UserProfile** — name, avatar, address, DOB, verification flags
- **NotificationPreference** — email/SMS toggles (stub for Phase 8)
- **Multi-step registration** — role → profile → phone OTP → account created
- **Phone OTP** — Africa's Talking integration with dev-mode fallback
- **JWT auth** — login, logout (token blacklist), refresh, password reset
- **RBAC** — `IsTenant`, `IsLandlord`, `IsInspector`, `IsAdmin` permission classes
- **Login activity logging** — IP, user agent, location, timestamp
- **Django Admin** — full user and session management
- **API standards** — `/api/v1/` versioning, pagination, unified error format
- **OpenAPI docs** — interactive Swagger UI at `/api/docs/`
- **Health check** — `/api/health/` for Render and monitoring

### Backend apps (planned)

| App | Phase | Purpose |
|-----|-------|---------|
| `accounts` | 1 ✅ | Users, auth, profiles |
| `properties` | 2 | Listings, search, PostGIS, media |
| `applications` | 3 | Rental applications, screening |
| `verification` | 4 | Inspector queue, safety scores |
| `leases` | 5 | Digital leases, documents |
| `payments` | 6 | M-Pesa, invoices, receipts |
| `maintenance` | 7 | Maintenance requests |
| `notifications` | 8 | In-app, email, SMS alerts |
| `support` | 9 | Disputes, knowledge base |
| `analytics` | 10 | Dashboard KPIs, charts |

---

## Frontend (Planned)

The frontend will be a **Next.js 15** application deployed on **Vercel**, consuming the Django REST API.

### Wireframe pages (~21)

| # | Page | Primary role |
|---|------|--------------|
| 1 | Homepage | Public |
| 2 | Login | All |
| 3 | Registration (multi-step + OTP) | All |
| 4 | Property search | Public / Tenant |
| 5 | Property detail | Public / Tenant |
| 6 | Search empty state | Public |
| 7 | Tenant dashboard | Tenant |
| 8 | My applications | Tenant |
| 9 | Application success | Tenant |
| 10 | Leases & contracts | Tenant |
| 11 | Payments & billing | Tenant / Landlord |
| 12 | Payment success | Tenant |
| 13 | Maintenance requests | Tenant |
| 14 | Profile & settings | All |
| 15 | Notifications center | All |
| 16 | Landlord dashboard | Landlord |
| 17 | My properties | Landlord |
| 18 | Tenant application inbox | Landlord |
| 19 | Admin dashboard | Admin |
| 20 | Property verification portal | Inspector |
| 21 | Support / dispute center | All |

Wireframes live in `images/` (gitignored until ready for the repo).

---

## Development Phases Roadmap

### Backend phases

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Foundation & Authentication | ✅ Complete |
| 2 | Properties, Media & Search | Pending |
| 3 | Rental Applications & Screening | Pending |
| 4 | Verification & Safety Scoring | Pending |
| 5 | Leases & Document Management | Pending |
| 6 | Payments & Billing (M-Pesa) | Pending |
| 7 | Maintenance Requests | Pending |
| 8 | Notifications & Activity Feed | Pending |
| 9 | Support & Disputes | Pending |
| 10 | Analytics & Dashboard APIs | Pending |
| 11 | Production Hardening & Render Deploy | Pending |

### Frontend

Starts after backend Phase 1 approval, built page-by-page against the wireframes and API endpoints.

---

## Getting Started

### Prerequisites

- **Python 3.12+** (3.14 works for local dev)
- **Docker Desktop** (recommended — provides PostGIS + Redis)
- **Git**

### Option A — Docker (recommended)

Requires Docker Desktop running.

```bash
# From project root
cp backend/.env.example backend/.env   # edit if needed

docker compose up --build              # first time only — use --build
# API: http://localhost:8000/api/docs/
```

> **Note:** First build downloads ~1 GB of GDAL/PostGIS dependencies and can take 15–30 minutes. Subsequent starts use `docker compose up` (no `--build`).

### Option B — Local development (Windows / no Docker)

For quick auth testing without PostGIS:

```bash
cd backend
cp .env.example .env
```

Set in `.env`:

```env
USE_POSTGIS=false
USE_SQLITE=true
```

Then:

```bash
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver 8001
# API: http://localhost:8001/api/docs/
```

> Use port **8001** if another Django project occupies **8000**.

### Create a superuser

**Docker:**

```bash
docker compose exec web python manage.py createsuperuser
```

**Local:**

```bash
cd backend
python manage.py createsuperuser
```

Admin panel: `http://localhost:8000/admin/` (Docker) or `http://localhost:8001/admin/` (local).

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`. **Never commit `.env`.**

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | — |
| `DEBUG` | Debug mode | `True` (dev) |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `USE_POSTGIS` | Enable PostGIS engine | `true` (Docker) |
| `USE_SQLITE` | SQLite fallback (dev only) | `false` |
| `DATABASE_URL` | Database connection string | See `.env.example` |
| `REDIS_URL` | Redis cache URL | `redis://localhost:6379/0` |
| `CORS_ALLOWED_ORIGINS` | Frontend origins (Vercel) | `http://localhost:3000` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access token TTL | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh token TTL | `7` |
| `AFRICAS_TALKING_USERNAME` | SMS API username | blank = dev OTP mode |
| `AFRICAS_TALKING_API_KEY` | SMS API key | blank = dev OTP mode |
| `AFRICAS_TALKING_SENDER_ID` | SMS sender ID | `USTAWI` |
| `OTP_LENGTH` | OTP digit count | `6` |
| `OTP_EXPIRY_MINUTES` | OTP validity | `10` |
| `FRONTEND_PASSWORD_RESET_URL` | Reset link base URL | `http://localhost:3000/reset-password` |

### Dev OTP mode

When Africa's Talking credentials are blank, OTP codes are logged to the console and returned as `dev_otp` in the registration API response. **Disable this in production.**

---

## API Reference (Phase 1)

Base URL: `http://localhost:8000` (Docker) or `http://localhost:8001` (local)

Interactive docs: **`/api/docs/`**

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health/` | None | Service + database health |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register/role/` | None | Step 1 — select role |
| POST | `/api/v1/auth/register/profile/` | None | Step 2 — profile + credentials |
| POST | `/api/v1/auth/register/send-otp/` | None | Step 3 — send phone OTP |
| POST | `/api/v1/auth/register/verify/` | None | Step 4 — verify OTP, create account |
| POST | `/api/v1/auth/login/` | None | Login, returns JWT |
| POST | `/api/v1/auth/logout/` | Bearer | Blacklist refresh token |
| POST | `/api/v1/auth/refresh/` | None | Refresh access token |
| GET | `/api/v1/auth/me/` | Bearer | Current user |
| POST | `/api/v1/auth/password-reset/` | None | Request reset email |
| POST | `/api/v1/auth/password-reset/confirm/` | None | Confirm password reset |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/profile/` | Bearer | Get profile |
| PATCH | `/api/v1/profile/` | Bearer | Update profile |
| GET | `/api/v1/profile/notifications/` | Bearer | Notification preferences |
| PATCH | `/api/v1/profile/notifications/` | Bearer | Update preferences |
| GET | `/api/v1/profile/login-activity/` | Bearer | Login history (last 20) |

### Registration flow example

```bash
# 1. Select role
POST /api/v1/auth/register/role/
{ "role": "TENANT" }
# → registration_token

# 2. Submit profile
POST /api/v1/auth/register/profile/
{
  "registration_token": "<uuid>",
  "email": "tenant@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "full_name": "Jane Doe",
  "phone": "0712345678"
}

# 3. Send OTP
POST /api/v1/auth/register/send-otp/
{ "registration_token": "<uuid>" }
# → dev_otp (development only)

# 4. Verify & create account
POST /api/v1/auth/register/verify/
{
  "registration_token": "<uuid>",
  "otp": "123456"
}
# → user + JWT tokens
```

### Response format

**Success:**

```json
{
  "success": true,
  "message": "Optional message",
  "data": { }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Human-readable message",
    "details": { }
  }
}
```

**Paginated lists:**

```json
{
  "success": true,
  "count": 100,
  "next": "…",
  "previous": null,
  "results": []
}
```

---

## Docker Workflow

| Task | Command |
|------|---------|
| First start (build) | `docker compose up --build` |
| Daily start | `docker compose up` |
| Start in background | `docker compose up -d` |
| Stop | `docker compose down` |
| Stop + wipe DB | `docker compose down -v` ⚠️ |
| Run migrations | `docker compose exec web python manage.py migrate` |
| Create superuser | `docker compose exec web python manage.py createsuperuser` |
| View logs | `docker compose logs -f web` |

You **do not** need `--build` on every restart — only when `Dockerfile` or `requirements/` change.

---

## Deployment

| Service | Provider | URL |
|---------|----------|-----|
| Backend API | Render | `render.yaml` blueprint included |
| Frontend | Vercel | Planned (Next.js) |
| Database | Render PostgreSQL + PostGIS | Via `render.yaml` |
| Redis | Render Redis | Link in Render dashboard |
| Domain | ustawikenya.com / .co.ke | Planned |

### Render checklist

1. Connect GitHub repo to Render
2. Apply `render.yaml` or create Web Service from `backend/Dockerfile`
3. Add managed PostgreSQL (PostGIS) and Redis
4. Set environment variables from `.env.example`
5. Set `DJANGO_SETTINGS_MODULE=config.settings.production`
6. Health check path: `/api/health/`

---

## Security & Compliance

- JWT with refresh token rotation and blacklist on logout
- Role-based access control (RBAC) on all protected endpoints
- Password validation (min 8 chars, Django validators)
- Phone verification via OTP before account activation
- Login activity audit trail (IP, location, user agent)
- CORS restricted to configured frontend origins
- Kenya Data Protection Act alignment (export/delete endpoints in Phase 11)
- OWASP best practices, rate limiting (Phase 11)

---

## External Integrations (planned)

| Service | Purpose | Phase |
|---------|---------|-------|
| M-Pesa Daraja | Rent payments (STK Push) | 6 |
| Africa's Talking | SMS / OTP | 1 ✅ |
| Mapbox / Google Maps | Property maps | 2 (frontend) |
| Resend / AWS SES | Transactional email | 1 ✅ (console dev) |
| S3 / Cloudinary | Property photos & documents | 2 |
| Firebase / FCM | Push notifications | 8 |

---

## Contributing

Development is phased. Each backend phase requires approval before the next begins.

1. Fork / branch from `main`
2. Follow existing code conventions in `backend/`
3. Never commit `.env` or secrets
4. Run migrations and test via `/api/docs/` before opening a PR

---

## License

Proprietary — Ustawi Kenya. All rights reserved.

---

## Contact

**Product:** Ustawi — Verified Rental & Housing Platform  
**Market:** Nairobi, Kenya → East Africa
