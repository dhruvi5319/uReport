---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 11
subsystem: frontend
tags: [next.js, typescript, tailwind, shadcn, oidc, auth, middleware, dashboard]
dependency_graph:
  requires:
    - crm/src/Controllers/Auth/LoginController.php (GET /auth/login — OIDC redirect)
    - crm/src/Controllers/Auth/CallbackController.php (sets ureport_session cookie)
    - crm/src/Controllers/Auth/MeController.php (GET /auth/me — CurrentUser)
    - crm/src/Http/JsonResponse.php (JSON envelope)
  provides:
    - frontend/src/lib/api-client.ts (apiClient<T>, ApiResponse<T>)
    - frontend/src/middleware.ts (Next.js edge middleware protecting staff routes)
    - frontend/src/app/dashboard/layout.tsx (DashboardLayout shell for Wave 3a+)
    - frontend/src/types/api.ts (CurrentUser, UserRole, ApiResponse)
  affects:
    - All Wave 3a–3d frontend plans that consume DashboardLayout, apiClient, auth utilities
tech_stack:
  added:
    - Next.js 15.3.3
    - React 19
    - TypeScript 5 (strict mode)
    - Tailwind CSS 3
    - shadcn/ui (Radix UI primitives)
    - tailwindcss-animate
    - @testing-library/react (for pre-existing test file types)
    - @types/jest + @testing-library/jest-dom
  patterns:
    - Next.js App Router with Server Components
    - Edge Middleware for auth route protection
    - HttpOnly cookie session (ureport_session) set by PHP backend
    - Server-side session validation via /auth/me on protected routes
    - Typed API fetch wrapper with { data, meta, errors } envelope parsing
key_files:
  created:
    - frontend/package.json
    - frontend/next.config.mjs
    - frontend/tsconfig.json
    - frontend/tailwind.config.ts
    - frontend/postcss.config.mjs
    - frontend/components.json
    - frontend/next-env.d.ts
    - frontend/.env.local.example
    - frontend/src/types/api.ts
    - frontend/src/lib/auth.ts
    - frontend/src/lib/api-client.ts
    - frontend/src/lib/utils.ts
    - frontend/src/app/globals.css
    - frontend/src/app/layout.tsx
    - frontend/src/app/page.tsx
    - frontend/src/middleware.ts
    - frontend/src/app/login/page.tsx
    - frontend/src/app/auth/callback/page.tsx
    - frontend/src/app/auth/logout/route.ts
    - frontend/src/app/dashboard/layout.tsx
    - frontend/src/app/dashboard/page.tsx
    - frontend/src/components/nav/TopNav.tsx
    - frontend/src/components/nav/Sidebar.tsx
  modified:
    - frontend/tsconfig.json (added jest/jest-dom types for test file compatibility)
decisions:
  - "next.config.mjs (not .ts) per plan constraint — ensures ESM module compatibility"
  - "Middleware checks only cookie presence (not JWT validity) — edge-compatible; full session validation via /auth/me in Server Components"
  - "Dev server bound to 0.0.0.0:3000 via --hostname flag in npm scripts"
  - "No X-Frame-Options DENY header — iframe preview must work per project requirement"
  - "Added jest/jest-dom types to tsconfig to fix type errors from pre-existing test file (plan 17 artifact)"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-23"
  tasks: 2
  files: 23
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 11: Next.js 15 SPA Shell Bootstrap Summary

**One-liner:** Next.js 15 SPA scaffold with TypeScript strict mode, Tailwind CSS, shadcn/ui wiring, OIDC auth delegation to PHP backend via ureport_session HttpOnly cookie, Edge middleware route protection, and authenticated dashboard shell with TopNav + Sidebar.

## What Was Built

### Task 1: Project Scaffold (Commit: 662e20e)

All core configuration and foundation files for the Next.js 15 frontend:

- **`frontend/package.json`** — Next.js 15.3.3 project with dev server bound to `0.0.0.0:3000` via `--hostname 0.0.0.0 --port 3000`
- **`frontend/next.config.mjs`** — API/auth proxy rewrites to PHP backend (`/api/*`, `/auth/*`, `/open311/*`), security headers (no X-Frame-Options DENY to allow iframe preview), TypeScript strict errors enabled
- **`frontend/tsconfig.json`** — TypeScript strict mode with `"strict": true`, Next.js plugin, `@/*` path alias
- **`frontend/tailwind.config.ts`** — uReport semantic color tokens: `status-open`, `status-closed`, `sla-ok`, `sla-warning`, `sla-breach`
- **`frontend/components.json`** — shadcn/ui configuration for Wave 3b+ component additions
- **`frontend/src/types/api.ts`** — `ApiResponse<T>`, `ApiMeta`, `ApiError`, `CurrentUser`, `UserRole`, `TicketSummary` interfaces
- **`frontend/src/lib/auth.ts`** — `getSession()` (reads ureport_session cookie, fetches /auth/me), `redirectByRole()`, `isStaffOrAdmin()`
- **`frontend/src/lib/api-client.ts`** — Typed fetch wrapper parsing `{ data, meta, errors }` envelope, auto-attaches cookie, handles 401
- **`frontend/src/lib/utils.ts`** — `cn()` Tailwind class merge utility
- **`frontend/next-env.d.ts`** — Required for TypeScript to resolve Next.js types (was missing; created as part of fix)

### Task 2: Auth Pages + Middleware + Dashboard Shell (Commit: a4e5433)

- **`frontend/src/middleware.ts`** — Edge middleware reading `ureport_session` cookie; unauthenticated requests to `/dashboard`, `/tickets`, `/admin`, `/reports`, `/map` redirected to `/login?redirect=<path>`
- **`frontend/src/app/login/page.tsx`** — Login page with "Sign in with City SSO" button (`href=/auth/login`) and citizen link (`/submit`); no password inputs; error/signed-out banners
- **`frontend/src/app/auth/callback/page.tsx`** — OIDC callback page; validates session via `getSession()` after PHP sets cookie; redirects by role
- **`frontend/src/app/auth/logout/route.ts`** — POST route proxying logout to PHP, clearing `ureport_session` cookie, redirecting to `/login?signed_out=1`
- **`frontend/src/components/nav/TopNav.tsx`** — Persistent top nav: uReport logo, Tickets/Reports/Map/Admin links (Admin conditional on role=admin), "+ New Ticket", user name + logout dropdown
- **`frontend/src/components/nav/Sidebar.tsx`** — Left sidebar with active-state highlighting, Administration section for admin role, department badge
- **`frontend/src/app/dashboard/layout.tsx`** — Authenticated shell: calls `getSession()`, redirects unauthenticated to `/login`, redirects `public` role to `/submit`, renders `<TopNav>` + `<Sidebar>` + `<main>`
- **`frontend/src/app/dashboard/page.tsx`** — Dashboard landing with greeting, KPI card placeholders (SLA Breached, Due Today, Open Tickets, SLA On-Time), Quick Actions

## Authentication Flow

```
Browser → /auth/login (Next.js rewrite) → PHP /auth/login → OIDC Provider
OIDC Provider → PHP /auth/callback → PHP sets ureport_session HttpOnly cookie
PHP → redirects to /auth/callback (Next.js)
Next.js /auth/callback → getSession() → PHP /auth/me → returns CurrentUser
→ redirect(redirectByRole(user.role)) → /dashboard (staff/admin) or /submit (public)
```

The SPA never handles OIDC tokens directly. It delegates entirely to PHP which manages the OIDC flow and session.

## Route Protection

- **Edge middleware** (`src/middleware.ts`): Fast cookie presence check at the edge; protects all staff routes
- **Server Component gate** (`dashboard/layout.tsx`): Full session validation via `/auth/me`; handles expired/invalid cookies that passed the edge check

## Integration Contracts Provided for Wave 3a+

| Artifact | Exports | Shape |
|----------|---------|-------|
| `src/lib/api-client.ts` | `apiClient<T>`, `ApiError` | `(path, options?) => Promise<ApiResponse<T>>` |
| `src/types/api.ts` | `CurrentUser`, `UserRole`, `ApiResponse<T>` | Full TypeScript interfaces |
| `src/middleware.ts` | `middleware`, `config` | Edge middleware + matcher config |
| `src/app/dashboard/layout.tsx` | `DashboardLayout` | Server component shell with TopNav + Sidebar |
| `src/lib/auth.ts` | `getSession()`, `redirectByRole()`, `isStaffOrAdmin()` | Auth utilities for Server Components |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing `next-env.d.ts` causing TypeScript type resolution failure**
- **Found during:** Task 1 verification
- **Issue:** `next/headers` module's `cookies` export couldn't be resolved by TypeScript — `next-env.d.ts` was missing from the project root (it's generated by Next.js on first dev server start, but hadn't been created yet)
- **Fix:** Created `next-env.d.ts` with standard Next.js type references
- **Files modified:** `frontend/next-env.d.ts` (created)
- **Commit:** 662e20e

**2. [Rule 3 - Blocking] Pre-existing test file missing jest/jest-dom types causing type errors**
- **Found during:** Task 2 verification (type-check step)
- **Issue:** `frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx` (from plan 17/express-15) imported `@testing-library/react` and used jest globals, but neither `@types/jest` nor `@testing-library/jest-dom` were installed, causing 4+ type errors that blocked `npm run type-check`
- **Fix:** Installed `@testing-library/react`, `@testing-library/jest-dom`, `@types/jest` as devDependencies; added `"types": ["jest", "@testing-library/jest-dom"]` to tsconfig.json
- **Files modified:** `frontend/package.json`, `frontend/tsconfig.json`
- **Commit:** a4e5433

## Self-Check

### Files Created Verification

```
✅ frontend/package.json
✅ frontend/next.config.mjs
✅ frontend/tsconfig.json
✅ frontend/tailwind.config.ts
✅ frontend/postcss.config.mjs
✅ frontend/components.json
✅ frontend/next-env.d.ts
✅ frontend/.env.local.example
✅ frontend/src/types/api.ts
✅ frontend/src/lib/auth.ts
✅ frontend/src/lib/api-client.ts
✅ frontend/src/lib/utils.ts
✅ frontend/src/app/globals.css
✅ frontend/src/app/layout.tsx
✅ frontend/src/app/page.tsx
✅ frontend/src/middleware.ts
✅ frontend/src/app/login/page.tsx
✅ frontend/src/app/auth/callback/page.tsx
✅ frontend/src/app/auth/logout/route.ts
✅ frontend/src/app/dashboard/layout.tsx
✅ frontend/src/app/dashboard/page.tsx
✅ frontend/src/components/nav/TopNav.tsx
✅ frontend/src/components/nav/Sidebar.tsx
```

### Commits Verification

```
✅ 662e20e — feat(modernize-the-ureport-legacy-php-crm-imp-11): Task 1 scaffold
✅ a4e5433 — feat(modernize-the-ureport-legacy-php-crm-imp-11): Task 2 auth+dashboard
```

### Type Check Verification

```
✅ npm run type-check exits 0 with 0 TypeScript errors
✅ no X-Frame-Options: DENY header in next.config.mjs
✅ dev server uses --hostname 0.0.0.0 --port 3000
✅ tsconfig.json has "strict": true
✅ apiClient exported from src/lib/api-client.ts
✅ CurrentUser, UserRole exported from src/types/api.ts
✅ middleware exported from src/middleware.ts
✅ DashboardLayout exported from src/app/dashboard/layout.tsx
```

## Self-Check: PASSED
