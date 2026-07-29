# CodeVed Management Platform
## Technical Requirements Document (TRD) — v2.1

**Stack:** Next.js · Node.js · Supabase · Clerk (students) · ImageKit  
**PRD Reference:** CodeVed PRD v1.1  
**Last Updated:** July 2026  
**Status:** Approved for Build

---

## 1. Auth Architecture (Split Model)

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                             │
│  Student UI ── Clerk.js session                             │
│  Admin UI ─── HttpOnly cookies (access + refresh)           │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
                ▼                         ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│ Next.js (student routes)  │   │ Next.js (admin routes)      │
│ ClerkMiddleware           │   │ Admin cookie gate only      │
│ NO admin cookie required  │   │ REJECT Clerk tokens         │
└─────────────┬─────────────┘   └──────────────┬──────────────┘
              │ Bearer Clerk JWT               │ Cookie admin JWT
              ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│              Express API  /api/v1                           │
│  requireClerkUser()  |  requireAdmin()  |  requireRole()    │
│  Never accept Clerk JWT on /admin/*                         │
│  Never accept admin JWT on student-only mutations as        │
│  substitute for Clerk identity                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 Student Auth — Clerk
- Frontend: `@clerk/nextjs`
- Backend: `@clerk/backend` `verifyToken` / `authenticateRequest`
- After first Clerk sign-in, upsert `public.users` by `clerk_user_id`
- Student APIs require valid Clerk JWT in `Authorization: Bearer <token>`

### 1.2 Admin Auth — Local ID + Password
- Table: `admin_users` (id, admin_id, password_hash, role, failed_attempts, locked_until, …)
- `POST /api/v1/admin/auth/login` → `{ adminId, password }`
- Hash verify with **Argon2id**
- Issue:
  - Access token: JWT, **15 min**, `aud=codeved-admin`, HttpOnly cookie `cv_admin_at`
  - Refresh token: opaque, **7 days**, hashed in DB, cookie `cv_admin_rt`, rotated on use
- `POST /api/v1/admin/auth/logout` — revoke refresh, clear cookies
- `POST /api/v1/admin/auth/refresh` — rotate refresh; reuse detection revokes family
- Lockout: 5 failures → `locked_until = now() + 15m`
- Rate limit login: **5 requests / 15 min** per IP + adminId

---

## 2. Project Folder Structure

```
codeved/
├── docs/
│   ├── CodeVed_PRD.md
│   └── CodeVed_TRD.md
├── frontend/                     # Next.js App Router
│   ├── app/
│   │   ├── (public)/             # Landing, events (public)
│   │   ├── (student)/            # Clerk-protected
│   │   ├── (admin)/              # Admin-cookie-protected (no Clerk)
│   │   │   └── login/            # Admin ID + password form
│   │   └── api/                  # Thin BFF proxies if needed
│   ├── components/
│   ├── lib/
│   │   ├── clerk/                # Student session helpers
│   │   ├── admin-auth/           # Cookie-aware admin API client
│   │   ├── api/                  # Typed fetch to backend
│   │   └── imagekit/
│   ├── middleware.ts             # Clerk for /dashboard/*; admin gate for /admin/*
│   └── …
├── backend/
│   ├── src/
│   │   ├── config/               # env (zod), db, clerk, imagekit
│   │   ├── routes/
│   │   │   ├── auth.student.ts   # /auth/me profile sync
│   │   │   ├── auth.admin.ts     # login/logout/refresh
│   │   │   ├── events.ts
│   │   │   ├── registrations.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── securityHeaders.ts
│   │   │   ├── requireClerkUser.ts
│   │   │   ├── requireAdmin.ts
│   │   │   ├── requireRole.ts
│   │   │   ├── validate.ts       # Zod
│   │   │   ├── rateLimit.ts
│   │   │   └── requestId.ts
│   │   ├── services/
│   │   └── app.ts
│   └── …
├── packages/shared/
├── docker-compose.yml
└── .github/workflows/
```

---

## 3. Technology Stack

### 3.1 Frontend
| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Student Auth | Clerk (`@clerk/nextjs`) |
| Admin Auth UI | Custom form → backend cookies (`credentials: 'include'`) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| QR | html5-qrcode |

### 3.2 Backend
| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 + Express + TypeScript |
| Student Auth | `@clerk/backend` JWT verify |
| Admin Auth | Argon2id + jose (JWT) + refresh store |
| DB | Supabase PostgreSQL (service role in backend only) |
| Validation | Zod |
| Security | helmet, cors, express-rate-limit, cookie-parser, hpp |
| Queue | BullMQ + Redis |
| Email | SendGrid |
| Media | ImageKit |
| Logging | pino + requestId |

### 3.3 Explicit Non-Use
- **Supabase Auth** — not used (replaced by Clerk for students + local admin auth)
- **Clerk for admins** — forbidden

---

## 4. Database Schema (Supabase PostgreSQL)

### 4.1 `users` (students — Clerk-backed)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Internal id |
| clerk_user_id | TEXT UNIQUE NOT NULL | Clerk user id |
| email | TEXT UNIQUE NOT NULL | |
| name | TEXT NOT NULL | |
| college, branch, year, phone | … | Profile |
| avatar_url | TEXT | ImageKit |
| created_at / updated_at | TIMESTAMPTZ | |

RLS: students never hit DB directly from browser with service role; all access via backend. Optional RLS deny-all for anon.

### 4.2 `admin_users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| admin_id | TEXT UNIQUE NOT NULL | Login username |
| password_hash | TEXT NOT NULL | Argon2id |
| display_name | TEXT NOT NULL | |
| role | ENUM | `super_admin` \| `event_manager` \| `volunteer` |
| is_active | BOOLEAN DEFAULT true | |
| failed_attempts | INT DEFAULT 0 | |
| locked_until | TIMESTAMPTZ | |
| last_login_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

### 4.3 `admin_refresh_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| admin_user_id | UUID FK | |
| token_hash | TEXT UNIQUE | SHA-256 of opaque token |
| family_id | UUID | Rotation family |
| expires_at | TIMESTAMPTZ | |
| revoked_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| user_agent / ip | TEXT | Audit |

### 4.4 `events`, `registrations`, `teams`, `announcements`
Same as TechFest TRD v2.0 §§4.2–4.5, with `created_by` referencing `admin_users.id` where applicable, and `user_id` → `users.id` (students).

### 4.5 `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| actor_type | TEXT | `admin` \| `student` \| `system` |
| actor_id | TEXT | |
| action | TEXT | e.g. `admin.login.fail` |
| resource | TEXT | |
| meta | JSONB | |
| ip | TEXT | |
| request_id | TEXT | |
| created_at | TIMESTAMPTZ | |

---

## 5. API Design

Base: `http://localhost:4000/api/v1`  
Responses: `{ success, data, error, requestId }`

### 5.1 Student Auth / Profile — Clerk
| Method | Auth | Endpoint | Description |
|--------|------|----------|-------------|
| POST | Clerk | `/auth/sync` | Upsert student profile from Clerk claims + body |
| GET | Clerk | `/auth/me` | Current student profile |
| PATCH | Clerk | `/auth/me` | Update profile fields |

### 5.2 Admin Auth — ID + Password
| Method | Auth | Endpoint | Description |
|--------|------|----------|-------------|
| POST | Public + RL | `/admin/auth/login` | ID+password → set cookies |
| POST | Refresh cookie | `/admin/auth/refresh` | Rotate tokens |
| POST | Admin | `/admin/auth/logout` | Revoke + clear cookies |
| GET | Admin | `/admin/auth/me` | Current admin profile |

### 5.3 Events / Registrations / Admin
Same surface as TechFest TRD §§5.3–5.5, with auth column meaning:
- **Student** = Clerk JWT  
- **Admin / Volunteer / SuperAdmin** = admin cookie JWT + role check  

---

## 6. Backend Security Baseline

### 6.1 Middleware Stack (order)
1. `requestId`
2. `helmet` (CSP tuned for API)
3. `cors` (allowlist + `credentials: true` for admin cookies)
4. `cookie-parser`
5. `express.json({ limit: '100kb' })`
6. `hpp`
7. Global rate limit
8. Routes with per-route limiters + Zod + auth guards

### 6.2 Cookie Policy (admin)
```
cv_admin_at: HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
cv_admin_rt: HttpOnly; Secure; SameSite=Strict; Path=/api/v1/admin/auth; Max-Age=604800
```

### 6.3 JWT Claims (admin access)
```json
{
  "sub": "<admin_users.id>",
  "aid": "<admin_id>",
  "role": "super_admin",
  "aud": "codeved-admin",
  "iss": "codeved-api"
}
```

### 6.4 Confused-Deputy Prevention
- `requireAdmin` rejects `Authorization: Bearer` if token is a Clerk JWT (iss check).
- `requireClerkUser` rejects cookies-only requests without Clerk bearer/session.
- Admin UI never loads ClerkProvider on `/admin/*` layout (optional isolation).

### 6.5 Secrets (env)
```
# backend
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_KEY=          # or JWKS via CLERK_PUBLISHABLE / issuer
ADMIN_JWT_SECRET=       # min 32 chars
ADMIN_COOKIE_SECRET=    # optional signing
ARGON2_MEMORY_COST=65536
IMAGEKIT_*=
SENDGRID_API_KEY=
REDIS_URL=
```

```
# frontend
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_IMAGEKIT_*=
```

---

## 7. Frontend Routing Rules

| Path | Guard |
|------|-------|
| `/`, `/events/*` | Public |
| `/sign-in`, `/sign-up` | Clerk |
| `/dashboard/*`, `/tickets/*` | Clerk signed-in |
| `/admin/login` | Public (no Clerk required) |
| `/admin/*` (except login) | Valid admin access cookie; redirect to `/admin/login` |

---

## 8. Deployment

| Service | Target |
|---------|--------|
| Frontend | Vercel |
| Backend | Railway / ECS (Docker) |
| DB | Supabase |
| Redis | Upstash |
| Media | ImageKit |
| Student Auth | Clerk |
| Email | SendGrid |

CI: lint + tsc + unit tests + `npm audit` on every PR. No high/critical CVEs without waiver.

---

## 9. Testing Focus (Auth/Security)

| Case | Expected |
|------|----------|
| Student Clerk token on `/admin/auth/me` | 401 |
| Admin cookie on `/auth/me` without Clerk | 401 |
| 5 bad admin logins | 423/401 + lock |
| Refresh reuse | Family revoked |
| Oversized JSON body | 413 |
| CSRF from disallowed origin | CORS block |

---

## 10. Document History

| Version | Changes |
|---------|---------|
| 2.0 | TechFest: Next + Supabase Auth + ImageKit |
| 2.1 | CodeVed: Clerk students only; admin ID/password; security middleware; audit + refresh rotation |
