# Ustawi — Complete Project Development Guide

**Author:** Tony Wangolo (Lead Engineer)  
**Project:** Ustawi — Verified Rental Platform for Kenya  
**Version:** 1.0 (Production)  
**Last Updated:** July 2026  
**Live URLs:** Frontend `https://ustawi-1.vercel.app` · API `https://ustawi-api.onrender.com`

---

## Table of Contents

1. [Introduction and Project Vision](#1-introduction-and-project-vision)
2. [Overall System Architecture](#2-overall-system-architecture)
3. [Repository and Folder Structure](#3-repository-and-folder-structure)
4. [Backend Architecture (Django REST API)](#4-backend-architecture-django-rest-api)
5. [Frontend Architecture (Next.js)](#5-frontend-architecture-nextjs)
6. [Authentication and Authorization](#6-authentication-and-authorization)
7. [Database Design and Relationships](#7-database-design-and-relationships)
8. [API Design Philosophy and Conventions](#8-api-design-philosophy-and-conventions)
9. [Complete Request Lifecycle](#9-complete-request-lifecycle)
10. [State Management (Frontend)](#10-state-management-frontend)
11. [Core Business Domains and Workflows](#11-core-business-domains-and-workflows)
12. [Background Processing: Celery and Redis](#12-background-processing-celery-and-redis)
13. [Email and SMS Workflows](#13-email-and-sms-workflows)
14. [File Upload and Media Handling](#14-file-upload-and-media-handling)
15. [Search, Filtering, and Caching](#15-search-filtering-and-caching)
16. [Error Handling and Logging](#16-error-handling-and-logging)
17. [Security Considerations](#17-security-considerations)
18. [Environment Variables Reference](#18-environment-variables-reference)
19. [Docker and Local Development](#19-docker-and-local-development)
20. [Deployment Process (Render + Vercel)](#20-deployment-process-render--vercel)
21. [Production Configuration and Operational Lessons](#21-production-configuration-and-operational-lessons)
22. [CI/CD Pipeline](#22-cicd-pipeline)
23. [Third-Party Integrations](#23-third-party-integrations)
24. [Performance and Scalability](#24-performance-and-scalability)
25. [Testing Strategy](#25-testing-strategy)
26. [Future Improvements and Technical Debt](#26-future-improvements-and-technical-debt)
27. [Lessons Learned Throughout Development](#27-lessons-learned-throughout-development)
28. [Appendix: Key End-to-End Flows](#28-appendix-key-end-to-end-flows)

---

## 1. Introduction and Project Vision

### 1.1 What I Built

I built **Ustawi**, a full-stack rental platform tailored for Kenya. The system connects **tenants**, **landlords/agents**, **property inspectors**, and **platform administrators** through a single verified marketplace. Tenants search for homes with safety scores, apply online, sign digital leases, and pay rent via M-Pesa. Landlords manage listings, review applications, collect rent, and handle maintenance. Inspectors verify properties before they go live. Admins oversee users, verification pipelines, and support.

### 1.2 Why I Chose This Architecture

I deliberately split the system into:

- **Django REST Framework backend** — Strong ORM, mature auth, excellent fit for complex business rules, PDF generation, webhooks, and background jobs.
- **Next.js 16 frontend** — Server-side rendering for SEO on public property pages, App Router for clean route organization, and excellent Vercel deployment.
- **PostgreSQL** — Relational integrity for leases, payments, and multi-role permissions.
- **Redis** — Cache, Celery broker, and rate-limit backing store.
- **Render (API + worker) + Vercel (frontend)** — Low-cost production hosting with separate scaling for web and background workers.

I rejected a monolithic Next.js API approach because payment webhooks, PDF generation, Celery workers, and complex verification workflows belong in a dedicated backend with clear service boundaries.

### 1.3 Design Principles I Followed

1. **Role-separated API namespaces** — `/api/v1/leases/` for tenants, `/api/v1/landlord/leases/` for landlords. This keeps permissions obvious and prevents accidental cross-role data leaks.
2. **Workflow services over fat views** — Business logic lives in `services/workflow.py` files, not in view classes.
3. **Consistent API envelope** — Every response uses `{ success, data, message }` or `{ success: false, error: { message, details } }`.
4. **Kenya-first defaults** — `Africa/Nairobi` timezone, `+254` phone normalization, KES currency, M-Pesa payments, Kenya DPA privacy endpoints.
5. **Dev-friendly fallbacks** — M-Pesa simulation, in-app OTP display, Celery eager mode, and console email so developers can run the full stack without external accounts.

---

## 2. Overall System Architecture

### 2.1 High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Client Layer
        Browser[Browser / Mobile Web]
    end

    subgraph Frontend["Vercel — Next.js 16"]
        SSR[Server Components<br/>Public pages]
        CSR[Client Components<br/>Authenticated panels]
        Rewrites["/media/* and /api-backend/* rewrites"]
    end

    subgraph Backend["Render — Django + Gunicorn"]
        API[Django REST API]
        MW[Middleware Stack]
        SVC[Workflow Services]
        SER[Serializers]
    end

    subgraph Worker["Render — Celery Worker"]
        Tasks[M-Pesa callbacks<br/>Notification delivery<br/>Receipt emails]
    end

    subgraph Data
        PG[(PostgreSQL / Neon)]
        Redis[(Redis / Upstash)]
    end

    subgraph External
        MPesa[M-Pesa Daraja]
        AT[Africa's Talking SMS]
        Google[Google OAuth]
        Cloudinary[Cloudinary Media]
        Sentry[Sentry]
    end

    Browser --> SSR
    Browser --> CSR
    SSR --> Rewrites
    CSR --> Rewrites
    Rewrites --> API
    API --> MW --> SER --> SVC --> PG
    API --> Redis
    API --> Tasks
    Tasks --> Redis
    Tasks --> PG
    API --> MPesa
    MPesa -->|Webhook| API
    Tasks --> AT
    API --> Google
    API --> Cloudinary
    API --> Sentry
    Tasks --> Sentry
```

### 2.2 Technology Stack Summary

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Frontend | Next.js, React, TypeScript | 16.x / 19.x |
| Styling | Tailwind CSS | v4 with CSS variables |
| Backend | Django, DRF, SimpleJWT | Django 5.1, DRF 3.15 |
| Database | PostgreSQL (+ optional PostGIS) | 16 |
| Cache / Queue | Redis | 7 |
| Task Queue | Celery | 5.x |
| PDF | ReportLab | Leases, receipts |
| Maps | Leaflet | Property search map |
| API Docs | drf-spectacular | Swagger at `/api/docs/` |
| Monitoring | Sentry | Production only |

---

## 3. Repository and Folder Structure

### 3.1 Monorepo Layout

```
Ustawi/
├── backend/                 # Django API
│   ├── apps/                # Domain Django apps
│   ├── config/              # Settings, URLs, Celery, WSGI
│   ├── core/                # Shared utilities
│   ├── docs/                # Backend-specific docs
│   ├── requirements/        # base.txt, dev.txt, prod.txt
│   ├── Dockerfile
│   └── docker-entrypoint.sh
├── frontend/                # Next.js app (Vercel root)
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Domain-organized UI
│   │   ├── lib/             # API client, auth, utils
│   │   └── types/           # TypeScript API types
│   └── public/              # Static assets
├── docs/                    # Project-wide documentation
├── docker-compose.yml       # Local dev stack
├── render.yaml              # Render blueprint
└── .github/workflows/ci.yml # GitHub Actions
```

### 3.2 Why I Organized It This Way

- **`backend/apps/` by domain** — Each business area (`accounts`, `properties`, `leases`, `payments`, etc.) is a self-contained Django app with its own models, serializers, views, URLs, services, and tests. This mirrors bounded contexts and makes onboarding easier.
- **`frontend/src/components/` by role/feature** — `landlord/`, `tenant/`, `admin/`, `inspector/`, `properties/` etc. Pages stay thin; panels hold the logic.
- **`frontend/src/lib/api/` mirrors backend domains** — One module per API area (`auth.ts`, `landlord-properties.ts`, `payments.ts`). Easy to find and maintain.
- **Separate `docs/` at repo root** — Cross-cutting documentation (this guide) lives outside either app.

### 3.3 Backend App Map

| App | Responsibility |
|-----|----------------|
| `core` | TimeStampedModel, pagination, throttling, middleware, health check, upload validation |
| `accounts` | Users, registration, JWT, Google OAuth, profile, privacy (DPA) |
| `properties` | Listings, neighborhoods, amenities, images, saved properties, featured carousel |
| `applications` | Tenant rental applications, screening, landlord inbox |
| `verification` | Inspector pipeline, safety scoring, community reports, audit logs |
| `leases` | Digital leases, signatures, PDF generation |
| `payments` | Invoices, M-Pesa STK Push, receipts |
| `maintenance` | Tenant requests, landlord assignment, photo attachments |
| `notifications` | In-app notifications, activity feed, async email/SMS |
| `support` | Support cases, knowledge base, live chat |
| `analytics` | Stateless dashboard aggregations (no models) |

---

## 4. Backend Architecture (Django REST API)

### 4.1 Settings Layering

I use environment-specific settings modules:

| Module | Purpose |
|--------|---------|
| `config/settings/base.py` | Shared config: apps, DRF, JWT, Redis, Celery, integrations |
| `config/settings/development.py` | DEBUG, Debug Toolbar, Celery eager, LocMem cache |
| `config/settings/production.py` | SSL, HSTS, JSON logging, Sentry, Render hostname auto-add |
| `config/settings/staging.py` | Thin wrapper over base |

Environment variables are loaded via `django-environ` from `backend/.env`.

**Key decision:** In production, if Redis is unavailable (Render free tier edge cases), I fall back to `LocMemCache` so the API does not 500 on every throttled request.

### 4.2 URL Routing Strategy

All API routes live under `/api/v1/`. I grouped them by actor:

```
/api/v1/auth/              → Registration, login, Google, JWT refresh
/api/v1/profile/           → Profile, avatar, privacy, notification prefs
/api/v1/properties/        → Public search, featured, detail
/api/v1/landlord/properties/ → Landlord CRUD, publish, images
/api/v1/applications/      → Tenant applications
/api/v1/landlord/applications/ → Landlord review/approve
/api/v1/inspector/verification/ → Verification queue and case actions
/api/v1/leases/            → Tenant leases
/api/v1/landlord/leases/   → Landlord lease management
/api/v1/payments/          → Tenant rent payments
/api/v1/payments/webhooks/ → M-Pesa callbacks
/api/v1/maintenance/       → Tenant maintenance
/api/v1/notifications/     → Notifications and activity
/api/v1/analytics/         → Dashboards
/api/v1/admin/             → Admin user management
```

Health check: `GET /api/health/`  
OpenAPI docs: `GET /api/docs/`

### 4.3 The View → Serializer → Service Pattern

I keep views thin. A typical flow:

1. **View** — Parses request, checks permissions, calls serializer for validation.
2. **Serializer** — Validates input, transforms output, handles nested relations.
3. **Service (`workflow.py`)** — Encodes business rules, side effects, notifications.
4. **Model** — Persistence only; minimal logic in `save()` overrides where needed (e.g., slug generation).

**Example:** Landlord publishes a property:

```
LandlordPropertyPublishView.post()
  → validates property status and images exist
  → create_verification_case(prop, actor)
  → (DEBUG only) approve_case() for local testing
  → returns { success, data: { id, status } }
```

### 4.4 Permissions Model

I use DRF permission classes at two levels:

**Role-based (`core/permissions.py`):**
- `IsTenant`, `IsLandlord` (includes AGENT), `IsInspector`, `IsAdmin`

**Object-based (per app):**
- `IsPropertyOwnerOrAdmin` — Landlords can only edit their own listings
- `IsLeaseTenant` / `IsLeaseLandlord` — Lease-scoped access
- `IsApplicationLandlord` — Landlord sees applications for their properties only

**Default DRF config:** `IsAuthenticated` on all endpoints unless explicitly opened (`AllowAny` on auth routes).

### 4.5 Middleware Stack

```
SecurityMiddleware
WhiteNoiseMiddleware          → Static files
CorsMiddleware                → CORS for Vercel frontend
SecurityHeadersMiddleware     → Referrer-Policy, X-Frame-Options, etc.
SessionMiddleware
CommonMiddleware
CsrfViewMiddleware
AuthenticationMiddleware
MessageMiddleware
ClickjackingMiddleware
```

Production adds HSTS, secure cookies, and SSL redirect.

---

## 5. Frontend Architecture (Next.js)

### 5.1 App Router Structure

I use **42 page routes** under `frontend/src/app/`. Pages are intentionally thin:

```tsx
// Typical authenticated page
export const metadata = createPageMetadata({ title: "...", path: "...", noIndex: true });
export default function Page() {
  return (
    <LandlordShell title="Properties">
      <LandlordPropertiesPanel />
    </LandlordShell>
  );
}
```

**Public pages** (home, property search, property detail) fetch data in Server Components for SEO.  
**Authenticated pages** delegate to client `"use client"` panels that call the API with JWT tokens.

### 5.2 Component Organization

| Folder | Purpose |
|--------|---------|
| `components/landlord/` | Landlord portal shells and panels |
| `components/tenant/` | Tenant dashboard |
| `components/admin/` | Admin dashboard, users, verification overview |
| `components/inspector/` | Verification queue and case review |
| `components/properties/` | Search, cards, detail, map, filters |
| `components/auth/` | Login, register wizard, Google OAuth |
| `components/providers/` | AuthProvider, QueryProvider |
| `components/ui/` | Button, Input, Badge primitives |
| `components/layout/` | Header, footer, user menu, site chrome |

### 5.3 Role-Based Shells

Each role gets a consistent navigation shell:

- **`LandlordShell`** — Dark navy sidebar, dashboard/properties/applications/leases/payments/maintenance
- **`TenantShell`** — Simpler nav for dashboard and payments
- **`AdminShell`** — Overview, users, verification, support
- **`InspectorShell`** — Verification queue

Shells include `ProfileAvatar`, `NotificationBell`, and mobile drawer navigation.

### 5.4 API Client Layer

Central client: `frontend/src/lib/api/client.ts`

```typescript
export async function apiFetch<T>(path, { method, body, token, cache }) {
  // Adds Authorization: Bearer when token provided
  // Parses JSON, throws ApiRequestError with field details on failure
}
```

Domain modules wrap `apiFetch`:
- `auth.ts`, `properties.ts`, `landlord-properties.ts`, `payments.ts`, etc.

**File uploads** bypass JSON `apiFetch` and use raw `fetch` + `FormData` (avatars, property images, maintenance photos).

### 5.5 Next.js Configuration

`frontend/next.config.ts`:

1. **Rewrites:**
   - `/api-backend/:path*` → backend API (optional proxy path)
   - `/media/:path*` → backend media (same-origin image loading)

2. **Image remote patterns:** API origin, Cloudinary, ui-avatars.com, Unsplash

3. **Why rewrites matter:** Next.js 16 blocks localhost/private IP in the image optimizer. Routing `/media/*` through the Next origin avoids broken images in development and simplifies production CDN paths.

### 5.6 SEO Strategy

- `lib/seo/metadata.ts` — Central `createPageMetadata()` with Open Graph, Twitter cards, canonical URLs
- `lib/seo/json-ld.tsx` — Schema.org Organization and RealEstateListing
- `app/sitemap.ts` — Dynamic sitemap including property slugs
- Public pages indexed; authenticated areas use `noIndex: true`

---

## 6. Authentication and Authorization

### 6.1 Why JWT (Not Session Cookies Alone)

I use **SimpleJWT** with Bearer tokens because:
- The frontend is on a different origin (Vercel) than the API (Render)
- Stateless tokens scale horizontally without sticky sessions
- Refresh token rotation with blacklist gives secure logout

**Trade-off:** Tokens in localStorage are vulnerable to XSS. I mitigate with strict CSP headers, no inline scripts, and short access token lifetime (60 minutes).

### 6.2 Registration Flow (Multi-Step + OTP)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Next.js Frontend
    participant A as Django API
    participant DB as PostgreSQL
    participant SMS as Africa's Talking

    U->>F: Select role (TENANT/LANDLORD/AGENT)
    F->>A: POST /auth/register/role/
    A->>DB: Create RegistrationSession
    A-->>F: registration_token

    U->>F: Enter profile (email, phone, password, name)
    F->>A: POST /auth/register/profile/
    A->>DB: Update session, hash password
    A->>SMS: Send OTP (or in-app if REGISTRATION_OTP_IN_APP=true)
    A-->>F: step=OTP_SENT, otp_delivery

    U->>F: Enter OTP code
    F->>A: POST /auth/register/verify/
    A->>DB: Create User + UserProfile + NotificationPreference
    A-->>F: { user, tokens: { access, refresh } }
    F->>F: persistAuthPayload() → localStorage + cookie
```

**Why multi-step:** I store partial registration in `RegistrationSession` so users can recover if they close the browser. OTP verifies phone ownership before account creation.

**Production lesson:** Africa's Talking sandbox caused 30-second timeouts and 500 errors. I added:
- `AFRICAS_TALKING_SMS_ENABLED=false` fallback
- `REGISTRATION_OTP_IN_APP=true` to display OTP on screen during testing
- Combined profile + OTP send in one API call to reduce round trips

### 6.3 Login and Session Hydration

```mermaid
sequenceDiagram
    participant F as Frontend AuthProvider
    participant LS as localStorage
    participant A as API /auth/me/

    F->>LS: getClientSession()
    alt token exists
        F->>A: GET /auth/me/ (Bearer token)
        A-->>F: fresh user + profile (including avatar)
        F->>LS: update session with mapped user
    else token invalid
        F->>LS: clearClientSession()
    end
```

Session storage (`lib/auth/session.ts`):
- `ustawi_access_token`, `ustawi_refresh_token`, `ustawi_user` in localStorage
- Mirror access token in cookie (`ustawi_access_token`) for future SSR auth

**Important:** I pass `context={"request": request}` to `UserSerializer` everywhere so avatar URLs are absolute (required for navbar/profile display).

### 6.4 Google OAuth

Flow in `apps/accounts/services/google_auth.py`:
1. Frontend obtains Google ID token via `@react-oauth/google`
2. Backend verifies token against `GOOGLE_CLIENT_ID`
3. Links existing user by `google_sub` or email, or creates new user if `role` provided
4. Returns JWT tokens same as email login

**Production requirement:** Add `https://ustawi-1.vercel.app` to Google Cloud Console **JavaScript origins** (not just redirect URIs).

### 6.5 Authorization Matrix

| Action | TENANT | LANDLORD/AGENT | INSPECTOR | ADMIN |
|--------|--------|----------------|-----------|-------|
| Search properties | ✓ | ✓ | ✓ | ✓ |
| Save properties | ✓ | ✗ | ✗ | ✓ |
| Apply to rent | ✓ | ✗ | ✗ | ✗ |
| Create listing | ✗ | ✓ | ✗ | ✓ |
| Review applications | ✗ | ✓ (own) | ✗ | ✓ |
| Verify properties | ✗ | ✗ | ✓ | ✓ |
| Manage all users | ✗ | ✗ | ✗ | ✓ |

---

## 7. Database Design and Relationships

### 7.1 Core Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| UserProfile : has
    User ||--o{ Property : owns
    User ||--o{ RentalApplication : submits
    User ||--o{ Lease : "tenant/landlord"
    User ||--o{ Payment : makes

    Property ||--o{ PropertyImage : has
    Property ||--o{ PropertyDocument : has
    Property }o--|| Neighborhood : in
    Property }o--o{ Amenity : has
    Property ||--o| VerificationCase : verified_by
    Property ||--o| SafetyScore : scored

    RentalApplication ||--o| Lease : creates
    Lease ||--o{ Invoice : bills
    Invoice ||--o| Payment : paid_by
    Payment ||--o| PaymentReceipt : generates

    VerificationCase ||--o{ VerificationDocument : has
    VerificationCase ||--o{ AuditLog : tracks

    User {
        uuid id PK
        string email UK
        string phone UK
        enum role
        boolean is_email_verified
        boolean is_phone_verified
    }

    Property {
        uuid id PK
        uuid owner_id FK
        string title
        string slug UK
        enum status
        decimal safety_score
        boolean is_verified
        decimal price_monthly
    }

    Lease {
        uuid id PK
        uuid application_id FK
        uuid tenant_id FK
        uuid landlord_id FK
        enum status
        date start_date
        date end_date
    }
```

### 7.2 Key Design Decisions

1. **UUID primary keys everywhere** — Safer in URLs, no sequential ID enumeration.
2. **`TimeStampedModel` base** — All models get `created_at`, `updated_at` from `core/models.py`.
3. **Property status enum** — `DRAFT → PENDING_REVIEW → ACTIVE → OCCUPIED/VACANT/REJECTED`. Status drives what actions are allowed.
4. **Safety score on Property, not per-image** — Public badge shows property-level score (0–10). Photo review sets `verification_status` on `PropertyImage` separately.
5. **One active application per tenant+property** — Database constraint prevents duplicate applications.
6. **Lease created from approved application** — `RentalApplication` has 1:1 with `Lease` via PROTECT delete.

### 7.3 Indexing Strategy

I indexed fields used in filters and sorting:
- `Property`: `(status, city)`, `price_monthly`, `-safety_score`, `is_featured`
- `User`: `(role, is_active)`

---

## 8. API Design Philosophy and Conventions

### 8.1 Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

**Paginated:**
```json
{
  "success": true,
  "count": 42,
  "next": "https://...",
  "previous": null,
  "results": [ ... ]
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation failed.",
    "details": {
      "price_monthly": ["This field is required."]
    }
  }
}
```

### 8.2 Why This Envelope

- Frontend can uniformly check `success === true` before reading `data`
- Field-level validation errors map directly to form fields
- `message` gives user-friendly text without parsing `details`

### 8.3 Versioning

URL path versioning: `/api/v1/`. Configured in DRF `DEFAULT_VERSIONING_CLASS`.

### 8.4 Throttling

| Scope | Limit |
|-------|-------|
| Anonymous burst | 30/minute |
| Authenticated burst | 120/minute |
| Auth endpoints (login, OTP) | 10/minute |

Implemented in `core/throttling.py`, backed by Redis cache in production.

---

## 9. Complete Request Lifecycle

### 9.1 Example: Tenant Searches Properties

```mermaid
sequenceDiagram
    participant U as User
    participant P as properties/page.tsx (SSR)
    participant API as GET /api/v1/properties/
    participant Cache as Redis
    participant DB as PostgreSQL

    U->>P: Visit /properties?q=nairobi
    P->>API: fetch with query params
    API->>Cache: Check properties:search:{hash}
    alt cache hit
        Cache-->>API: cached JSON
    else cache miss
        API->>DB: Filter queryset (city, price, safety, etc.)
        DB-->>API: Property rows
        API->>Cache: Store 5 min TTL
    end
    API-->>P: Paginated results
    P-->>U: HTML with property grid + map
```

**Components involved:**
1. `frontend/src/app/properties/page.tsx` — Server Component, parses search params
2. `frontend/src/lib/api/properties.ts` — `searchProperties()`
3. `backend/apps/properties/views/public.py` — `PropertyListView`
4. `backend/apps/properties/filters.py` — django-filter queryset
5. `backend/apps/properties/services/cache.py` — Versioned cache keys
6. `PropertyListSerializer` — Output shape

### 9.2 Example: Landlord Creates and Publishes a Listing

**Step 1 — Save details:**
```
LandlordPropertyFormPanel.handleSubmit()
  → POST /api/v1/landlord/properties/
  → PropertyCreateUpdateSerializer validates
  → Property.objects.create(status=DRAFT)
  → router.push(/landlord/properties/{id})
```

**Step 2 — Upload photos:**
```
LandlordPropertyPhotos.uploadMain()
  → POST /api/v1/landlord/properties/{id}/images/ (multipart)
  → PropertyImageUploadSerializer saves to Cloudinary/local
```

**Step 3 — Publish:**
```
LandlordPropertyDetailPanel.handlePublish()
  → POST /api/v1/landlord/properties/{id}/publish/
  → status = PENDING_REVIEW
  → create_verification_case()
  → Inspector queue receives case
```

**Step 4 — Inspector approves:**
```
InspectorCaseDetailPanel
  → PATCH photos (APPROVED/REJECTED)
  → POST safety-score/ (optional custom score)
  → POST approve/
  → bootstrap_safety_score_if_missing() if score is 0
  → approve_case() → status=ACTIVE, is_verified=true
  → Property appears in public search
```

### 9.3 Example: Tenant Pays Rent via M-Pesa

```mermaid
sequenceDiagram
    participant T as Tenant
    participant F as Frontend
    participant API as Django API
    participant D as Daraja (M-Pesa)
    participant W as Celery Worker
    participant DB as PostgreSQL

    T->>F: Click Pay Rent
    F->>API: POST /payments/initiate/
    API->>D: STK Push request
    D-->>T: M-Pesa prompt on phone
    T->>D: Enter PIN
    D->>API: POST /payments/webhooks/mpesa/
    API->>W: process_mpesa_callback_task.delay()
    W->>DB: Update Payment status, generate Receipt PDF
    W->>W: send_payment_receipt_email_task.delay()
    F->>API: Poll payment status
    API-->>F: Payment COMPLETED
```

---

## 10. State Management (Frontend)

### 10.1 What I Use (and What I Don't)

| Concern | Solution |
|---------|----------|
| Auth session | React Context (`AuthProvider`) + localStorage |
| Saved properties | TanStack React Query (optimistic updates) |
| Notification badge | React Query with 60s refetch interval |
| Everything else | Local `useState` + `useEffect` fetch on mount |

**Why no Redux/Zustand:** Most panels are isolated. Auth is the only truly global client state. React Query handles server cache for the two features that benefit from it.

### 10.2 Auth State Flow

```
Login success
  → persistAuthPayload() writes tokens + user to localStorage
  → setSession() updates AuthProvider context
  → Role-based redirect (tenant → /dashboard, landlord → /landlord, etc.)

Profile avatar upload
  → uploadProfileAvatar()
  → fetchCurrentUser() refreshes session
  → setSession() updates navbar avatar immediately
```

### 10.3 Route Protection Pattern

I deliberately **do not use Next.js middleware** for auth. Each client panel checks:

```typescript
useEffect(() => {
  if (authLoading) return;
  if (!isAuthenticated) router.replace("/login?next=...");
  if (!isLandlord(user)) router.replace("/profile");
}, [...]);
```

**Trade-off:** Brief flash before redirect. **Benefit:** Simpler deployment, no edge middleware config, works with client-only JWT storage.

---

## 11. Core Business Domains and Workflows

### 11.1 Properties

**Landlord lifecycle:** DRAFT → (publish) → PENDING_REVIEW → (inspector approve) → ACTIVE → OCCUPIED

**Featured carousel:** `sync_featured_properties` management command + auto-sync on approval. Homepage marquee pulls featured property images.

**Search:** django-filter with city, neighborhood, price range, bedrooms, safety score, property type. Results cached 5 minutes with version invalidation on property save.

### 11.2 Applications and Screening

When tenant submits application:
1. `submit_application()` validates property is ACTIVE and not OCCUPIED
2. `apply_screening()` computes income-to-rent ratio and screening score
3. Notification sent to landlord
4. Landlord approves → `approve_application()` creates Lease in DRAFT

### 11.3 Leases and Digital Signatures

1. Landlord approves application → lease created
2. Both parties sign via `DigitalSignature` records
3. `leases/services/pdf.py` generates PDF with ReportLab
4. Signed PDF stored on `Lease.signed_pdf`

### 11.4 Verification and Safety Scoring

**Two separate concepts I had to clarify in production:**

| Concept | Field | Set by |
|---------|-------|--------|
| Photo approval | `PropertyImage.verification_status` | Inspector photo OK/Reject |
| Public safety badge | `Property.safety_score` | Safety score form OR auto on approve |

**Safety score calculation** (`verification/services/workflow.py`):
- Weighted factors: neighborhood (25%), building condition (25%), access control (20%), lighting (15%), emergency readiness (15%)
- Each factor normalized to 0–10, weighted sum = overall score
- `bootstrap_safety_score_if_missing()` applies score on approval if inspector skipped the form

### 11.5 Payments

- Invoices generated per lease billing period
- M-Pesa STK Push via Daraja API
- Dev mode simulates payment when credentials blank
- Receipt PDF + optional email via Celery

### 11.6 Maintenance

- Tenant creates request with up to 5 photos (FormData upload)
- Landlord assigns technician, updates status
- Timeline of `MaintenanceUpdate` records

### 11.7 Notifications

Central dispatch: `notifications/services/dispatch.py`

```python
send_notification(user, title, message, category)
  → creates Notification + ActivityEvent in DB
  → deliver_notification_channels_task.delay()  # email/SMS per preferences
```

---

## 12. Background Processing: Celery and Redis

### 12.1 Celery Configuration

```python
# config/celery.py
app = Celery("ustawi")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

**Broker:** Redis DB 1  
**Result backend:** Redis DB 2  
**Django cache:** Redis DB 0

### 12.2 Registered Tasks

| Task | File | Trigger | Retries |
|------|------|---------|---------|
| `process_mpesa_callback_task` | `payments/tasks.py` | M-Pesa webhook | 3 × 10s |
| `send_payment_receipt_email_task` | `payments/tasks.py` | After payment complete | 3 × 30s |
| `deliver_notification_channels_task` | `notifications/tasks.py` | New notification | default |

### 12.3 Development vs Production

| Setting | Development | Production |
|---------|-------------|------------|
| `CELERY_TASK_ALWAYS_EAGER` | `True` (sync) | `False` |
| Worker process | Not needed | Render `ustawi-worker` service |
| Cache backend | LocMemCache | Redis |

**Why eager in dev:** Developers run `runserver` without a Celery worker. Tasks execute inline so M-Pesa callbacks and notifications still work locally.

### 12.4 Redis Usage Beyond Celery

1. **DRF throttling** — Rate limit counters
2. **Property search cache** — Versioned keys, TTL 5–30 min
3. **Health check** — `cache.set("health:ping", "ok", 10)`

Cache invalidation: `properties/services/cache.py` bumps `properties:cache_version` on any property save/delete.

---

## 13. Email and SMS Workflows

### 13.1 Email

**Development:** `EMAIL_BACKEND = django.core.mail.backends.console.EmailBackend` — emails print to terminal.

**Production:** Configure SMTP via env vars (not yet wired to SendGrid/SES in all environments).

**Used for:**
- Password reset links
- Payment receipt emails (Celery task)
- Notification delivery (if user prefs allow)

### 13.2 SMS (Africa's Talking)

Implementation: `apps/accounts/services/africas_talking.py`

**Used for:**
- Registration OTP
- Optional notification SMS

**Fallback chain I implemented:**
1. If `AFRICAS_TALKING_SMS_ENABLED=false` → skip SMS, return dev_mode
2. If sandbox username → skip HTTP call (was causing 30s timeouts)
3. If `REGISTRATION_OTP_IN_APP=true` → return OTP in API response for display on verify screen

---

## 14. File Upload and Media Handling

### 14.1 Storage Strategy

| Environment | Storage | Why |
|-------------|---------|-----|
| Local dev | `backend/media/` on disk | Simple, no external deps |
| Render (without Cloudinary) | Ephemeral disk | **Files lost on redeploy** — unacceptable for production |
| Production (recommended) | **Cloudinary** via `CLOUDINARY_URL` | Persistent, CDN-backed, works with Render |

**Critical production lesson:** Profile photos and property images uploaded to Render's local disk return 404 after the next deploy. I integrated Cloudinary:

```python
# config/settings/base.py
if CLOUDINARY_URL:
    INSTALLED_APPS = ["cloudinary_storage", "cloudinary", ...]
    STORAGES = {
        "default": {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"},
        ...
    }
```

### 14.2 Upload Paths

| Model | Path | Max size |
|-------|------|----------|
| UserProfile.avatar | `avatars/` | 5 MB (frontend enforced) |
| PropertyImage.image | `properties/gallery/` | 10 MB |
| MaintenancePhoto.image | `maintenance/photos/` | 10 MB × 5 |
| CaseAttachment.file | `support/attachments/` | 10 MB × 5 |

### 14.3 Validation

`core/upload_validation.py`:
- Images: Pillow verify, allowed extensions JPG/PNG/WEBP/GIF
- Documents: PDF magic-byte check (`%PDF`)

### 14.4 Frontend Media URL Resolution

`lib/media-url.ts`:
- Property images: rewrite to `/media/*` for Next.js optimizer
- Avatars: direct Cloudinary/API URL (plain `<img>`, not Next Image — avoids recompression)

---

## 15. Search, Filtering, and Caching

### 15.1 Property Search

Backend: `django-filter` on `PropertyListView`

Filters: `city`, `neighborhood`, `property_type`, `min_price`, `max_price`, `bedrooms`, `min_safety_score`, `ordering`

Only `ACTIVE` properties appear in public search (`get_public_queryset()`).

### 15.2 Caching Strategy

| Endpoint | TTL | Invalidation |
|----------|-----|--------------|
| Property search | 5 min | Version bump on property save |
| Featured listings | 10 min | Version bump + `sync_featured_properties` |
| Filter metadata | 30 min | Version bump |

**Why versioned keys instead of deleting:** Simpler invalidation — increment `properties:cache_version` and all old keys become stale automatically.

---

## 16. Error Handling and Logging

### 16.1 API Errors

Custom handler: `core/exceptions.py`

All DRF exceptions wrapped in consistent `{ success: false, error: { code, message, details } }`.

Frontend: `ApiRequestError` class with `status`, `message`, `details` for field mapping.

**Frontend lesson:** `formatApiFieldErrors()` must handle non-array detail values (e.g. `{ detail: "string" }`) or the catch block throws silently and the user sees "nothing happens."

### 16.2 Logging

**Development:** Verbose console format, `apps.accounts` at DEBUG.

**Production:** JSON structured logs via `core/logging.py` `JsonFormatter`. Django at WARNING, accounts at INFO.

### 16.3 Health Check

`GET /api/health/` checks database and cache. Returns 503 if either fails. Render uses this for deploy health checks.

### 16.4 Sentry

Initialized in `production.py` when `SENTRY_DSN` set. Django + Celery integrations. `send_default_pii=False`.

---

## 17. Security Considerations

### 17.1 What I Implemented

- JWT with refresh rotation and blacklist on logout
- Rate limiting on auth endpoints (10/min)
- CORS restricted to known frontend origins
- HSTS, secure cookies, SSL redirect in production
- Security headers middleware (X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Upload validation (type, size, magic bytes)
- Kenya DPA: data export and account deletion endpoints
- Object-level permissions on all sensitive resources
- Password validators (min 8, common password check)
- Google OAuth token verification server-side

### 17.2 Secrets Management

- All secrets in environment variables, never committed
- Render/Vercel env var UI for production
- `backend/.env` gitignored locally
- `.env.example` files document required vars without values

### 17.3 Common Pitfalls

1. **Committing `.env` or exposing Neon/Redis tokens in chat** — rotate immediately
2. **CORS misconfiguration** — frontend origin must exactly match `CORS_ALLOWED_ORIGINS`
3. **ALLOWED_HOSTS missing Render hostname** — causes `DisallowedHost` 400
4. **JWT in localStorage** — XSS risk; keep dependencies updated

---

## 18. Environment Variables Reference

### 18.1 Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DJANGO_SETTINGS_MODULE` | ✓ | `config.settings.production` |
| `SECRET_KEY` | ✓ | Django secret |
| `DEBUG` | ✓ | `false` in production |
| `DATABASE_URL` | ✓ | PostgreSQL connection (Neon or Render) |
| `REDIS_URL` | ✓ | `rediss://...` for Upstash TLS |
| `CELERY_BROKER_URL` | ✓ | Same Redis, DB 1 |
| `CELERY_RESULT_BACKEND` | ✓ | Same Redis, DB 2 |
| `ALLOWED_HOSTS` | ✓ | `ustawi-api.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | ✓ | `https://ustawi-1.vercel.app` |
| `USE_POSTGIS` | ✓ | `false` on Render starter |
| `CLOUDINARY_URL` | ✓ | `cloudinary://key:secret@cloud` |
| `GOOGLE_CLIENT_ID` | ✓ | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ✓ | Google OAuth |
| `REGISTRATION_OTP_IN_APP` | ○ | `true` until SMS live |
| `AFRICAS_TALKING_SMS_ENABLED` | ○ | `false` until SMS live |
| `MPESA_*` | ○ | M-Pesa Daraja credentials |
| `SENTRY_DSN` | ○ | Error monitoring |

### 18.2 Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✓ | `https://ustawi-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | ✓ | `https://ustawi-1.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✓ | Google OAuth client ID |

---

## 19. Docker and Local Development

### 19.1 Docker Compose Stack

`docker-compose.yml` at repo root:

| Service | Image | Port |
|---------|-------|------|
| `db` | postgis/postgis:16-3.4 | 5432 |
| `redis` | redis:7-alpine | 6379 |
| `web` | Built from `backend/Dockerfile` | 8000 |

Volumes: `postgres_data`, `redis_data`, `media_data`

### 19.2 Local Development (Without Docker)

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env  # configure DATABASE_URL, REDIS_URL
python manage.py migrate
python manage.py runserver 8001

# Frontend
cd frontend
npm install
cp .env.local.example .env.local
npm run dev  # http://localhost:3000
```

### 19.3 Useful Management Commands

| Command | Purpose |
|---------|---------|
| `ensure_admin <email> --password ...` | Create/promote admin user |
| `seed_properties` | Demo Nairobi listings |
| `purge_seed_listings` | Remove demo data |
| `sync_featured_properties` | Recompute homepage carousel |
| `backfill_safety_scores` | Fix listings stuck at 0.0 |
| `seed_verification` | Test inspector queue |
| `seed_knowledge_base` | Support KB articles |

---

## 20. Deployment Process (Render + Vercel)

### 20.1 Deployment Architecture

```mermaid
flowchart LR
    GitHub[GitHub main branch]
    GitHub --> Render[Render Blueprint]
    GitHub --> Vercel[Vercel Git Integration]

    Render --> API[ustawi-api Web Service]
    Render --> Worker[ustawi-worker Celery]
    Render --> Redis[ustawi-redis]
    Render --> PG[ustawi-db PostgreSQL]

    Vercel --> CDN[Global CDN]
    CDN --> Next[Next.js SSR/Static]

    Next -->|API calls| API
    Next -->|/media rewrite| API
```

### 20.2 Backend Deploy Steps

1. Push to `main` on GitHub
2. Render detects change, builds Docker image from `backend/Dockerfile`
3. `docker-entrypoint.sh` runs `python manage.py migrate --noinput`
4. Gunicorn starts on port 8000 (2 workers)
5. Celery worker service restarts with same image
6. Health check: `GET /api/health/`

### 20.3 Frontend Deploy Steps

1. Push to `main`
2. Vercel builds from `frontend/` directory
3. **Critical:** Use **Promote to Production** on the correct deployment — redeploying an old commit is a common mistake I hit multiple times

### 20.4 Post-Deploy Checklist

- [ ] `GET /api/health/` returns 200
- [ ] `GET /api/docs/` loads Swagger
- [ ] Login works on production frontend
- [ ] Google OAuth JS origin includes Vercel URL
- [ ] `CLOUDINARY_URL` set — re-upload media after first configure
- [ ] Run `python manage.py backfill_safety_scores` if needed
- [ ] Verify Celery worker logs show task processing

---

## 21. Production Configuration and Operational Lessons

### 21.1 Issues I Encountered and Fixed

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `DisallowedHost` on Render | `ALLOWED_HOSTS` not set | Auto-add from `RENDER_EXTERNAL_URL` in production.py |
| Vercel build failed | `.gitignore` blocked `frontend/src/lib/env/` | Fixed gitignore patterns |
| Images missing on Vercel | `.gitignore` blocked `frontend/public/images/` | Fixed gitignore |
| Google `origin_mismatch` | Vercel URL not in JS origins | Added to Google Cloud Console |
| API 500 on every request | Invalid Redis URL in env | Use `rediss://` Upstash URL, not redis-cli command |
| Registration 30s timeout | Africa's Talking sandbox HTTP hang | Disable SMS, in-app OTP fallback |
| Profile photos 404 | Render ephemeral disk | Cloudinary storage |
| Safety score always 0.0 | Photo approval ≠ safety score | Auto-bootstrap on approve + backfill command |
| Landlord "Save & continue" silent fail | Error formatter crashed on `{detail: string}` | Hardened `formatApiFieldErrors()` |

### 21.2 Render Free Tier Constraints

- Ephemeral disk — must use Cloudinary/S3 for uploads
- No shell access on free tier — migrations via `docker-entrypoint.sh`
- Redis may sleep — LocMem fallback prevents total API failure
- Cold starts — first request after idle can take 30–60 seconds

### 21.3 Vercel Deployment Gotcha

**Promote vs Redeploy:** Redeploying rebuilds the same commit. If production points at an old deployment, you must **Promote to Production** the deployment with the latest commit hash.

---

## 22. CI/CD Pipeline

### 22.1 GitHub Actions

File: `.github/workflows/ci.yml`

**Triggers:** Push and PR to `main`

**Backend job steps:**
1. Checkout
2. Python 3.12 setup
3. Redis service container
4. `pip install -r requirements/dev.txt`
5. `ruff check .` — lint
6. `manage.py check --deploy` — production settings validation
7. `manage.py migrate --check` — migration consistency
8. `manage.py test` — unit tests

**Environment:** SQLite (`USE_SQLITE=true`), Celery eager mode, no PostGIS.

**What CI does NOT do yet:** Deploy to Render/Vercel (those use their own Git integrations), frontend lint/build, E2E tests.

---

## 23. Third-Party Integrations

| Service | Purpose | Config | Fallback |
|---------|---------|--------|----------|
| **M-Pesa Daraja** | Rent payments | `MPESA_*` env vars | Dev simulation |
| **Africa's Talking** | SMS OTP | `AFRICAS_TALKING_*` | In-app OTP display |
| **Google OAuth** | Social login | `GOOGLE_CLIENT_ID/SECRET` | Email/password only |
| **Cloudinary** | Media storage | `CLOUDINARY_URL` | Local disk (dev only) |
| **Sentry** | Error tracking | `SENTRY_DSN` | Console logs |
| **Neon Postgres** | Production DB | `DATABASE_URL` | Render Postgres |
| **Upstash Redis** | Cache + Celery | `REDIS_URL` (`rediss://`) | LocMem fallback |
| **ReportLab** | PDF generation | N/A (library) | N/A |

---

## 24. Performance and Scalability

### 24.1 Optimizations I Implemented

- Redis caching on hot public endpoints (search, featured, filters)
- Cache version invalidation instead of per-key deletion
- `select_related` / `prefetch_related` on list views
- Database indexes on filter/sort columns
- Next.js SSR for public pages (SEO + fast first paint)
- Dynamic import for Leaflet maps (no SSR bundle bloat)
- Cloudinary CDN for media delivery
- Gunicorn 2 workers (adjust per Render plan)

### 24.2 Scalability Path

| Component | Current | Scale path |
|-----------|---------|------------|
| API | Render starter, 2 Gunicorn workers | Horizontal scaling, more workers |
| Database | Neon/Render Postgres starter | Read replicas, connection pooling (PgBouncer) |
| Cache | Upstash Redis | Already external, scales independently |
| Media | Cloudinary | CDN included |
| Celery | 1 worker, concurrency 2 | Add workers, dedicated queues per task type |
| Frontend | Vercel serverless | Auto-scales |

---

## 25. Testing Strategy

### 25.1 Current Coverage

- Django unit tests in `apps/*/tests/`
- Privacy tests: `apps/accounts/tests/test_privacy.py`
- CI runs `manage.py test` on every push
- Ruff linting in CI
- Production settings check (`check --deploy`)

### 25.2 What I Would Add

- Frontend component tests (Vitest + Testing Library)
- API integration tests with pytest-django
- E2E tests (Playwright) for registration and payment flows
- Load testing on property search endpoint

---

## 26. Future Improvements and Technical Debt

### 26.1 High Priority

1. **SMTP email provider** — Wire SendGrid/SES for production password reset and receipts
2. **Live Africa's Talking SMS** — Enable real OTP delivery in production
3. **Next.js middleware auth** — Server-side route protection with httpOnly cookies
4. **S3 storage option** — Env vars exist but STORAGES not wired; alternative to Cloudinary
5. **WebSocket notifications** — Replace 60s polling with SSE or WebSocket

### 26.2 Medium Priority

6. **Landlord analytics export** — CSV/PDF download of payment history
7. **Tenant lease renewal flow** — Automated reminders before expiry
8. **Inspector mobile app** — Photo capture on-site during verification
9. **Multi-language support** — Swahili UI strings
10. **Frontend CI** — `npm run build` + ESLint in GitHub Actions

### 26.3 Known Technical Debt

- No Next.js `middleware.ts` for auth
- Most panels use imperative fetch instead of React Query
- `paypal-pay-button.tsx` naming despite M-Pesa being the payment method
- Analytics app has no models — all computed on the fly (acceptable for now)
- DEBUG auto-approve on property publish bypasses verification locally

---

## 27. Lessons Learned Throughout Development

### 27.1 Architecture

1. **Separate photo verification from safety scoring** — Users (and I) conflated these. Document clearly and auto-bridge on approval.
2. **Role-separated API paths reduce bugs** — `/landlord/` vs tenant paths make permission mistakes obvious in code review.
3. **Workflow services are worth the indirection** — When M-Pesa callback logic changed, I only touched `payments/services/workflow.py`.

### 27.2 Deployment

4. **Never trust ephemeral disk in production** — Always use external object storage (Cloudinary) from day one.
5. **Environment variables are the #1 production failure source** — Wrong Redis URL format, missing ALLOWED_HOSTS, CORS mismatches. Maintain a checklist.
6. **Vercel Promote ≠ Redeploy** — I lost hours to production running old commits.
7. **Run migrations in entrypoint** — Render free tier has no shell; `docker-entrypoint.sh` migrate before Gunicorn.

### 27.3 Frontend

8. **Silent error handling is the worst UX** — Always surface API errors; never `return` early without user feedback.
9. **Separate upload actions from form submit** — Profile photo vs "Save changes" caused user confusion until I split the UI.
10. **Media URL strategy differs by asset type** — Property images through Next optimizer; avatars as direct Cloudinary URLs.

### 27.4 Integrations

11. **Third-party sandboxes can block your API** — Africa's Talking sandbox caused 30s hangs. Always implement timeouts and fallbacks.
12. **Google OAuth needs JS origins, not just redirect URIs** — For `@react-oauth/google` popup flow.
13. **M-Pesa webhooks must be async** — Queue Celery task immediately; Daraja expects fast 200 response.

### 27.5 Process

14. **Seed data management commands are essential** — `purge_seed_listings` and `seed_properties` saved hours during demos.
15. **Backfill commands for production fixes** — `backfill_safety_scores` fixed live data without manual SQL.
16. **Document env vars in `.env.example`** — Future me (and other engineers) will thank present me.

---

## 28. Appendix: Key End-to-End Flows

### 28.1 Complete Tenant Journey

```
Register (role → profile → OTP → verify)
  → Browse /properties (SSR search + map)
  → View /properties/[slug] (detail + safety badge)
  → Save property (heart icon, React Query optimistic)
  → Apply /properties/[slug]/apply (application form + documents)
  → Landlord approves → Lease created
  → Both sign lease → PDF generated
  → Pay rent via M-Pesa STK Push
  → Receive receipt (PDF + email)
  → Submit maintenance request with photos
```

### 28.2 Complete Landlord Journey

```
Register as LANDLORD
  → /landlord dashboard (analytics KPIs)
  → /landlord/properties/new (Step 1: details)
  → /landlord/properties/[id] (Step 2: photos, Step 3: publish)
  → Property enters verification queue
  → Inspector approves → ACTIVE on marketplace
  → Review applications at /landlord/applications
  → Approve → Lease auto-created
  → Sign lease → Tenant signs → Active lease
  → Collect rent (visible in /landlord/payments)
  → Handle maintenance at /landlord/maintenance
```

### 28.3 Complete Verification Flow

```
Landlord publishes → VerificationCase created (PENDING)
  → Inspector opens /inspector/[caseId]
  → Start review → IN_REVIEW
  → Review documents (APPROVED/REJECTED)
  → Review photos (OK/Reject per image)
  → (Optional) Submit safety score form
  → Approve property
    → bootstrap_safety_score_if_missing()
    → Property ACTIVE + is_verified=true
    → Landlord marked is_verified_landlord
    → Featured carousel sync
```

---

## Document Maintenance

This guide reflects the system as deployed in July 2026. When adding features:

1. Update the relevant section with what you built, why, and how it connects.
2. Add new env vars to Section 18.
3. Add new sequence diagrams for non-trivial flows.
4. Record production incidents in Section 21.

**Repository:** `captainblair/USTAWI1`  
**API Documentation:** `/api/docs/` (Swagger)  
**Production Runbook:** `backend/docs/PRODUCTION.md`

---

*End of Ustawi Development Guide*
