# Ustawi Production Deployment Guide

This document covers environment configuration for deploying the Ustawi backend to **Render** with a **Vercel** frontend. Deployment wiring is prepared but can be connected when you are ready.

## Architecture

| Service | Render type | Purpose |
|---------|-------------|---------|
| `ustawi-api` | Web (Docker) | Django + Gunicorn API |
| `ustawi-worker` | Worker (Docker) | Celery background tasks (notifications, M-Pesa callbacks) |
| `ustawi-db` | PostgreSQL 16 | Primary database |
| `ustawi-redis` | Redis | Cache + Celery broker |

Blueprint: [`render.yaml`](../../render.yaml) at repo root.

## Required environment variables

Set these on the **web** and **worker** services in Render:

| Variable | Example | Notes |
|----------|---------|-------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | Set in blueprint |
| `SECRET_KEY` | *(auto-generated)* | Render can generate |
| `DEBUG` | `false` | Never `true` in production |
| `USE_POSTGIS` | `false` | Use `true` only if PostGIS extension is enabled |
| `DATABASE_URL` | *(from Render Postgres)* | Linked via blueprint |
| `REDIS_URL` | *(from Render Redis)* | Django cache |
| `CELERY_BROKER_URL` | *(same Redis)* | Celery message broker |
| `CELERY_RESULT_BACKEND` | *(same Redis)* | Task results |
| `ALLOWED_HOSTS` | `ustawi-api.onrender.com` | Comma-separated |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Vercel frontend URL |
| `CSRF_TRUSTED_ORIGINS` | `https://your-app.vercel.app` | Match CORS origins |
| `MPESA_CALLBACK_URL` | `https://ustawi-api.onrender.com/api/v1/payments/webhooks/mpesa/` | Public webhook URL |
| `SENTRY_DSN` | *(from Sentry project)* | Optional but recommended |

## Vercel frontend connection

1. Deploy frontend to Vercel (e.g. `https://ustawi.vercel.app`).
2. Set on Render web service:
   ```
   CORS_ALLOWED_ORIGINS=https://ustawi.vercel.app
   CSRF_TRUSTED_ORIGINS=https://ustawi.vercel.app
   ```
3. Set on Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://ustawi-api.onrender.com
   ```

CORS is configured with credentials support for JWT cookies if needed later.

## Security features (Phase 11)

- **Rate limiting**: DRF throttling on all API endpoints; stricter limits on auth/OTP routes (`10/minute`).
- **Security headers**: HSTS, secure cookies, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Upload validation**: Pillow-based image verification + PDF magic-byte checks on maintenance/support uploads.
- **Kenya DPA**: `GET /api/v1/profile/data-export/` and `POST /api/v1/profile/delete-account/`.
- **Structured logging**: JSON logs in production settings.
- **Sentry**: Enabled when `SENTRY_DSN` is set.

## Redis caching

Hot public endpoints are cached:

| Endpoint | TTL |
|----------|-----|
| `GET /api/v1/properties/` | 5 min |
| `GET /api/v1/properties/featured/` | 10 min |
| `GET /api/v1/properties/filters/` | 30 min |

Cache is invalidated when property listings change.

## Celery worker

The worker runs:

```bash
celery -A config worker --loglevel=info --concurrency=2
```

Tasks: notification delivery, M-Pesa callback processing, payment receipt emails.

## Deploy steps (when ready)

1. Push repo to GitHub.
2. In Render: **New → Blueprint** → connect repo → apply `render.yaml`.
3. Set `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `MPESA_CALLBACK_URL`, `SENTRY_DSN`.
4. Run migrations on first deploy (add to Dockerfile CMD or run manually):
   ```bash
   python manage.py migrate --noinput
   ```
5. Verify health: `GET https://<your-api>/api/health/`
6. Open Swagger: `https://<your-api>/api/docs/`

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR:

- Ruff lint
- `manage.py check --deploy` (production settings)
- `migrate --check`
- Unit tests

## API documentation

- **Swagger UI**: `/api/docs/`
- **OpenAPI schema**: `/api/schema/`
- **Postman collection**: `backend/docs/postman/Ustawi-API.postman_collection.json`

Import the Postman collection and set collection variables:

- `base_url`: `http://localhost:8001` or your Render URL
- `access_token`: JWT from login response

## Local production smoke test

```bash
cd backend
export DJANGO_SETTINGS_MODULE=config.settings.production
export SECRET_KEY=test-secret
export DEBUG=false
export USE_SQLITE=true
export USE_POSTGIS=false
export ALLOWED_HOSTS=localhost
python manage.py check --deploy
```
