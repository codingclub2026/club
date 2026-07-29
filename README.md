# CodeVed Management Platform

> A full-stack web application for India's premier technical festival — with split authentication, enterprise security, and a rich student experience.

## 📁 Project Structure

```
codingclub/
├── frontend/          # Student portal — Next.js 15 + Clerk (port 3000)
├── backend/           # API server — Express + Prisma → Supabase (port 4000)
├── admin/             # Admin dashboard — Next.js 15, no Clerk (port 3001)
```

---

## 🚀 Quick Start

### 1. Configure Environment Variables

**Backend** (`backend/.env` — copy from `.env.example`):
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
CLERK_SECRET_KEY=sk_test_...
FRONTEND_ORIGIN=http://localhost:3000
ADMIN_ORIGIN=http://localhost:3001
ADMIN_JWT_SECRET=your-32-char-min-secret-here!!!
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4
SEED_ADMIN_ID=superadmin
SEED_ADMIN_PASSWORD=ChangeMe@2026!!
SEED_ADMIN_NAME=Super Admin
```

**Frontend** (`frontend/.env.local` — copy from `.env.local.example`):
```env
# Only the PUBLISHABLE key is needed here (public, safe to expose)
# The backend already has CLERK_SECRET_KEY — it does all JWT verification
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

**Admin** (`admin/.env.local` — copy from `.env.local.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 2. Push Schema to Supabase

```bash
cd backend
npx prisma db push
```

### 3. Seed Super Admin

```bash
cd backend
npm run seed
```

Default credentials: `superadmin` / `ChangeMe@2026!!` (change immediately!)

### 4. Start All Three Apps

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend (student portal)
cd frontend
npm run dev

# Terminal 3 — Admin dashboard
cd admin
npm run dev
```

| Service | URL |
|---------|-----|
| Student Portal | http://localhost:3000 |
| Admin Dashboard | http://localhost:3001 |
| API Backend | http://localhost:4000 |
| Health Check | http://localhost:4000/health |

---

## 🔐 Authentication Architecture

### Students — Clerk
- Sign up/in via Clerk (email + Google OAuth)
- Frontend: `@clerk/nextjs` with `ClerkProvider`
- Backend: Clerk JWT verified via `@clerk/backend`
- Student routes use `Authorization: Bearer <clerk_jwt>`

### Admins — ID + Password (No Clerk)
- Login via `POST /api/v1/admin/auth/login` with `{ adminId, password }`
- Passwords hashed with **Argon2id** (memory-hard, secure)
- Issues **HttpOnly Secure cookies** (`cv_admin_at` + `cv_admin_rt`)
- Access token: 15 minutes | Refresh token: 7 days with rotation
- **5 failed logins → 15-minute account lockout**
- All attempts logged to `audit_logs` table

### Confused-Deputy Prevention
- Admin routes reject `Authorization: Bearer` (Clerk tokens)
- Student routes reject cookie-only requests without Clerk bearer
- Admin UI has no `ClerkProvider` — completely separate

---

## 🛡️ Security Baseline

| Layer | Implementation |
|-------|---------------|
| Headers | Helmet (CSP, HSTS, X-Frame, nosniff) |
| CORS | Strict allowlist — only frontend/admin origins |
| Rate Limits | Public: 100/min · Student: 30/min · Admin login: 5/15min |
| Body Size | 100kb limit + JSON depth limits |
| Validation | Zod on every mutating endpoint |
| Queries | Prisma parameterized queries only |
| Refresh Tokens | Rotation + reuse detection → family revocation |
| Audit Log | Login, logout, create, delete, export, attendance override |
| Request ID | `X-Request-Id` on every response |

---

## 📊 Database Schema (Prisma → Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Students (Clerk-backed, keyed by `clerk_user_id`) |
| `admin_users` | Admins (separate from Clerk) |
| `admin_refresh_tokens` | Refresh token store with family rotation |
| `events` | Event catalog |
| `registrations` | Solo + team registrations |
| `teams` + `team_members` | Team management with invite codes |
| `bookmarks` | Student event bookmarks |
| `announcements` | Event-scoped or global announcements |
| `audit_logs` | Security and activity trail |

---

## 🌐 API Endpoints

Base: `http://localhost:4000/api/v1`

### Student Auth (Clerk)
- `POST /auth/sync` — Upsert student profile
- `GET /auth/me` — Get student profile
- `PATCH /auth/me` — Update profile

### Admin Auth (ID + Password)
- `POST /admin/auth/login` — Rate-limited, lockout
- `POST /admin/auth/refresh` — Token rotation
- `POST /admin/auth/logout` — Revoke + clear cookies
- `GET /admin/auth/me` — Admin profile

### Events (Public + Admin)
- `GET /events` — Public listing (filter, search, paginate)
- `GET /events/:id` — Public detail
- `POST /events` — Admin create (event_manager+)
- `PATCH /events/:id` — Admin update
- `DELETE /events/:id` — Super Admin only
- `POST /events/:id/bookmark` — Student toggle

### Registrations
- `POST /registrations/solo` — Student solo register
- `POST /registrations/team/create` — Student create team
- `POST /registrations/team/join` — Student join via code
- `GET /registrations/my` — Student's registrations
- `GET /registrations` — Admin view all
- `PATCH /registrations/:id/attendance` — Volunteer mark attended

### Admin Management
- `GET /admin/dashboard/stats` — Stats overview
- `GET /admin/admins` — List admins (super_admin)
- `POST /admin/admins` — Create admin (super_admin)
- `PATCH /admin/admins/:id/deactivate` — Deactivate (super_admin)
- `GET /admin/audit-logs` — Audit trail (super_admin)
- `GET /admin/export/registrations` — CSV export
- `POST /admin/announcements` — Create announcement

---

## 🗺️ Frontend Routes

| Path | Guard |
|------|-------|
| `/` | Public — Landing |
| `/events` | Public — Event catalog |
| `/events/:id` | Public — Event detail |
| `/sign-in`, `/sign-up` | Clerk |
| `/dashboard` | Clerk signed-in |
| `/profile` | Clerk signed-in |
| `/admin/login` | Public (no Clerk) |
| `/admin/*` | Admin cookie required |

---

## 📦 Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS |
| Student Auth | Clerk (`@clerk/nextjs`) |
| Admin Auth | Custom Argon2id · Jose JWT · HttpOnly cookies |
| Backend | Node.js 20 · Express · TypeScript |
| Database | Supabase PostgreSQL via Prisma ORM |
| Security | Helmet · CORS · express-rate-limit · HPP · Zod |
| Admin UI | Next.js 15 (separate app, no Clerk) |

---

## 🧪 Security Test Checklist

- [ ] Student Clerk token on `/admin/auth/me` → `401`
- [ ] Admin cookie on `/auth/me` without Clerk → `401`
- [ ] 5 bad admin logins → `423 Locked`
- [ ] Refresh token reuse → family revoked, `401`
- [ ] Body > 100kb → `413`
- [ ] CORS from unknown origin → blocked
- [ ] Clerk token in admin cookie field → rejected (iss check)
