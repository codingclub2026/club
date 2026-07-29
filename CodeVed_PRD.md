# CodeVed Management Platform
## Product Requirements Document (PRD)
**Version 1.1** | July 2026

| Field | Value |
|-------|-------|
| Document Owner | CodeVed Organizing Committee |
| Version | 1.1 |
| Status | Approved for Build |
| Last Updated | July 2026 |
| Target Release | Q3 2026 |
| Supersedes | TechFest PRD v1.0 (rebranded + auth/security revision) |

---

## 1. Executive Summary

CodeVed is a full-stack web application that enables organizers to manage a multi-event technical festival while giving students a seamless interface to discover, register, and track events. The platform has two primary surfaces: a **student-facing portal** and a **privileged admin panel**.

### Key Goals
- Centralize event creation, scheduling, and participant management.
- Let students browse events, register (solo/team), receive confirmations, and track registrations.
- Provide analytics and export capabilities for admins.
- Enforce a **split authentication model**: Clerk for students; local ID/password for admins.
- Harden the backend against common web threats (OWASP Top 10).

---

## 2. Stakeholders & User Personas

| Persona | Role | Primary Need |
|---------|------|--------------|
| Super Admin | Fest Coordinator | Full CRUD over events, admins, registrations & analytics |
| Event Manager | Club/Dept Head | Manage assigned events, view registrations |
| Volunteer | Support Staff | Mark attendance, view participant list |
| Student | Participant | Browse events, register solo/team, download e-ticket |
| Guest / Public | Visitor | View event details without registration |

---

## 3. Scope

### 3.1 In Scope
- Student authentication via **Clerk** (email, Google OAuth, session management).
- Admin authentication via **local ID + password** (never Clerk) with lockout & audit.
- Event catalog: Technical, Cultural, Gaming, Workshops, Hackathons.
- Solo & team registration with configurable team size limits.
- Admin dashboard: event CRUD, registration management, bulk CSV export.
- Confirmation emails & e-ticket (QR) generation.
- Attendance tracking via QR scan.
- Announcements & notifications (email + in-app).
- Payment gateway (optional, paid events) — Phase later.

### 3.2 Out of Scope
- Native mobile apps (Phase 2).
- Live streaming.
- Social media auto-posting.
- Admin accounts in Clerk (explicitly forbidden).

---

## 4. Authentication Model (Critical)

### 4.1 Students — Clerk Only
- Sign-up / sign-in through Clerk (email verification, Google OAuth).
- Profile fields (name, college, branch, year, phone) stored in our DB, keyed by `clerk_user_id`.
- Backend verifies **Clerk session JWT** on student/protected APIs.
- Students **cannot** access admin routes even if they obtain a Clerk session.

### 4.2 Admins — ID + Password Only
- Admins authenticate with **admin ID (username) + password** against our backend.
- Passwords hashed with **Argon2id** (or bcrypt cost ≥ 12).
- Sessions issued as **short-lived access JWT + rotating refresh token** in HttpOnly Secure cookies.
- Optional TOTP 2FA for Super Admin (Phase 1.5).
- Admin credentials are stored in `admin_users` — **completely separate** from Clerk and from `users` (students).
- Failed login rate-limited + progressive lockout; all attempts written to `audit_logs`.

### 4.3 Separation Rules
| Rule | Requirement |
|------|-------------|
| R1 | Clerk keys/SDK used only on student routes and student middleware |
| R2 | Admin panel middleware rejects Clerk tokens; accepts only admin JWT cookies |
| R3 | No shared password table between students and admins |
| R4 | Promoting a student to admin is **not** allowed; admins are provisioned by Super Admin |
| R5 | Service-role DB keys never exposed to the browser |

---

## 5. Feature Requirements

### 5.1 Student Portal
#### 5.1.1 Authentication (Clerk)
- Sign-up / sign-in via Clerk UI components or custom flows.
- Profile page: name, college, branch, year, phone, profile photo.
- Account recovery handled by Clerk.

#### 5.1.2 Event Discovery
- Landing with hero, featured events, fest countdown.
- Browse/filter: Category | Date | Status.
- Search by name/keywords.
- Event detail: description, rules, timeline, prizes, coordinators, venue.
- Bookmark events.

#### 5.1.3 Registration
- Solo: one-click register + confirmation.
- Team: create team → share code → teammates join; enforce min/max size.
- Cut-off enforced server-side.
- My Registrations dashboard with status badges.
- Download e-ticket PDF with QR.
- Cancel before deadline (if permitted).

### 5.2 Admin Panel
#### 5.2.1 Authentication & Roles
- Login page: Admin ID + password (no Clerk).
- Roles: Super Admin > Event Manager > Volunteer.
- Super Admin CRUD for other admin accounts.
- Session timeout + forced re-auth for sensitive actions (role change, delete).

#### 5.2.2–5.2.6
Event management, registration management, QR attendance, analytics dashboard, and announcements — same capabilities as TechFest PRD §4.2.2–4.2.6.

---

## 6. User Stories (Priority Backlog)

| ID | Story | Priority | Acceptance |
|----|-------|----------|------------|
| US-01 | Student signs in with Clerk | P0 | Session valid; profile synced |
| US-02 | Student browses/searches events | P0 | Filter+search < 1s |
| US-03 | Student registers for solo event | P0 | Email + e-ticket issued |
| US-04 | Student creates/joins team via code | P0 | Code valid 48h |
| US-05 | Student downloads e-ticket PDF | P1 | QR scannable |
| US-06 | Admin logs in with ID + password | P0 | HttpOnly cookie; Clerk token rejected |
| US-07 | Admin creates/publishes event | P0 | Visible after Publish |
| US-08 | Admin exports registrations CSV | P0 | Matches UI; < 3s |
| US-09 | Volunteer scans QR for attendance | P0 | Duplicate flagged |
| US-10 | Super Admin manages admin accounts | P0 | Role effective next request |
| US-11 | Failed admin logins lock account | P0 | Lock after N failures; audit logged |
| US-12 | Student cancel before deadline | P2 | Slot freed |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Page load < 2s on 4G; API p95 < 300ms under 500 concurrent |
| Scalability | Containerized; support 10,000 registered students |
| Security | HTTPS; split auth; Argon2id; Helmet; CORS allowlist; Zod; RBAC; rate limits; audit logs; OWASP Top 10 |
| Availability | 99.5% uptime during fest window |
| Accessibility | WCAG 2.1 AA |
| Privacy | PII encrypted at rest (DB); retention 1 year |
| Mobile | Responsive 320px–2560px |

### 7.1 Backend Security Requirements (Added in v1.1)
1. **Helmet** security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy).
2. **Strict CORS** — only frontend origin(s).
3. **Rate limiting** — public 100/min; student auth-adjacent 30/min; **admin login 5/15min per IP+ID**.
4. **Admin lockout** — 5 failures → 15-minute lock (configurable).
5. **Zod validation** on every mutating endpoint.
6. **Parameterized queries only** (Supabase client / prepared statements).
7. **Refresh token rotation** + reuse detection for admin sessions.
8. **Audit log** for admin login, role change, event delete, bulk export, attendance override.
9. **Request ID** (`X-Request-Id`) on every response for tracing.
10. **No secrets in client bundles**; env validation at boot (fail-fast).
11. **Soft secrets rotation** support for `ADMIN_JWT_SECRET`.
12. **Payload size limits** and JSON depth limits.
13. **Disable `X-Powered-By`**; no stack traces in production responses.

---

## 8. Success Metrics & KPIs

- Registration conversion ≥ 60%.
- Zero critical P0 bugs during live fest.
- Admin event creation < 5 minutes.
- Student onboarding (Clerk sign-in → first registration) < 3 minutes.
- QR throughput ≥ 120 scans/minute.
- Zero successful admin brute-force during penetration test.

---

## 9. Delivery Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 0 | Week 1–2 | Repo, CI, design system, schema, security baseline |
| Phase 1 | Week 3–5 | Clerk student auth, admin ID/password auth, event CRUD |
| Phase 2 | Week 6–8 | Registration, e-tickets, admin reg management |
| Phase 3 | Week 9–11 | Full admin dashboard, analytics, announcements |
| Phase 4 | Week 12 | QR attendance, volunteer UI |
| Phase 5 | Week 13–14 | E2E, load, security testing, UAT |
| Phase 6 | Week 15 | Production deploy, runbook |

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Clerk outage blocks students | Cached sessions; status page; retry UX |
| Admin credential leak | Argon2id, lockout, 2FA, audit, short JWT TTL |
| Confused-deputy (Clerk token on admin API) | Explicit dual middleware; reject wrong issuer |
| ImageKit private key exposure | Server-only signing endpoint |
| Registration stampede | Idempotent register; Redis rate limits; DB constraints |

---

## 11. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | June 2025 | TechFest baseline |
| 1.1 | July 2026 | Rebrand CodeVed; Clerk for students only; admin ID/password; expanded security NFRs |
