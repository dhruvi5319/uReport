---
phase: implement-the-full-ureport-modernization
plan: "06"
subsystem: frontend-spa
tags: [react, vite, typescript, spa, auth, tickets, rbac, f0, f1, f3, f4, f11, f18]
dependency_graph:
  requires: [02-PLAN, 03-PLAN]
  provides: [web-spa, auth-context, use-permission-hook, api-client, ticket-list-page, ticket-detail-page, create-ticket-page, app-router]
  affects: [07-PLAN, 08-PLAN]
tech_stack:
  added: [react@18.3.1, vite@5.3.1, typescript@5.5.2, react-router-dom@6.23.1, axios@1.7.2, zustand@4.5.4, react-hook-form@7.52.0, date-fns@3.6.0]
  patterns: [react-context, zustand-store, axios-interceptors, jwt-localstorage, protected-routes, rbac-hooks]
key_files:
  created:
    - web/package.json
    - web/vite.config.ts
    - web/tsconfig.json
    - web/index.html
    - web/Dockerfile
    - web/nginx.conf
    - web/src/main.tsx
    - web/src/App.tsx
    - web/src/api/client.ts
    - web/src/api/auth.ts
    - web/src/api/tickets.ts
    - web/src/contexts/AuthContext.tsx
    - web/src/hooks/usePermission.ts
    - web/src/hooks/useAuth.ts
    - web/src/store/authStore.ts
    - web/src/store/ticketStore.ts
    - web/src/types/api.ts
    - web/src/types/ticket.ts
    - web/src/types/auth.ts
    - web/src/pages/LoginPage.tsx
    - web/src/pages/CallbackPage.tsx
    - web/src/components/common/ProtectedRoute.tsx
    - web/src/components/common/LoadingSpinner.tsx
    - web/src/components/common/ErrorBanner.tsx
    - web/src/components/common/Pagination.tsx
    - web/src/components/layout/AppLayout.tsx
    - web/src/components/layout/Sidebar.tsx
    - web/src/components/layout/TopBar.tsx
    - web/src/router/index.tsx
    - web/src/pages/tickets/TicketListPage.tsx
    - web/src/pages/tickets/TicketDetailPage.tsx
    - web/src/pages/tickets/CreateTicketPage.tsx
    - web/src/components/tickets/TicketSearchFilters.tsx
    - web/src/components/tickets/TicketHistoryList.tsx
    - web/src/components/tickets/TicketStatusBadge.tsx
  modified: []
decisions:
  - React Router v6 createBrowserRouter used (not legacy BrowserRouter) for future data-router compatibility
  - JWT stored in localStorage (not httpOnly cookies) per spec — backend responsible for CSRF protection
  - Placeholder page factory pattern used for Wave 3b/3c admin pages instead of lazy imports to avoid 404 on nav
  - TypeScript strict mode enabled; skipLibCheck=true for faster CI builds
metrics:
  duration: "~20 minutes"
  completed: "2026-06-24"
  tasks: 2
  files: 35
---

# Phase implement-the-full-ureport-modernization Plan 06: React SPA Scaffold + P0 Frontend Features Summary

**One-liner:** React 18 + Vite 5 SPA with JWT auth context, RBAC permission hooks, ticket CRUD pages, and full search/filter UI consuming the Wave 2a/2b backend APIs.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | SPA scaffold, API client, AuthContext, RBAC hooks, auth pages (F3, F4) | 8aacdb9 | web/package.json, vite.config.ts, src/api/client.ts, src/contexts/AuthContext.tsx, src/hooks/usePermission.ts, src/pages/LoginPage.tsx, src/router/index.tsx |
| 2 | Ticket list (F11, F18), ticket detail (F0, F1), create ticket form (F0) | c421b58 | src/pages/tickets/TicketListPage.tsx, TicketDetailPage.tsx, CreateTicketPage.tsx, src/components/tickets/TicketSearchFilters.tsx, TicketHistoryList.tsx |

## Files Created

### SPA Scaffold
- `web/package.json` — React 18 + Vite 5 + TypeScript, react-router-dom v6, axios, zustand, react-hook-form, date-fns
- `web/vite.config.ts` — host=0.0.0.0, port=3000, proxy /api /open311 /callback → backend; no X-Frame-Options/CSP headers
- `web/tsconfig.json` — strict mode, bundler module resolution, @/* path alias
- `web/index.html` — SPA entry point
- `web/Dockerfile` — Multi-stage build: node:20-alpine build → nginx:alpine serve
- `web/nginx.conf` — SPA fallback (try_files → index.html)

### API Client + Auth
- `web/src/api/client.ts` — Axios instance with Bearer token request interceptor; 401 response interceptor with queue-based refresh + redirect to /login on failure
- `web/src/api/auth.ts` — login/refresh/logout wrappers
- `web/src/api/tickets.ts` — search/getById/getHistory/create/assign/close/reopen/comment + buildExportUrl

### State + Types
- `web/src/store/authStore.ts` — Zustand authStore (user, setUser)
- `web/src/store/ticketStore.ts` — Zustand ticketStore (result, filters, loading, error)
- `web/src/types/auth.ts` — AuthUser, LoginRequest, AuthResponse
- `web/src/types/ticket.ts` — Ticket, TicketSearchParams, TicketHistoryEntry, PagedResult
- `web/src/types/api.ts` — ApiError, ApiResult

### Auth + RBAC (F3, F4)
- `web/src/contexts/AuthContext.tsx` — AuthProvider + useAuthContext; login/logout/refreshToken; localStorage token persistence; JWT decode on mount
- `web/src/hooks/useAuth.ts` — re-export of useAuthContext
- `web/src/hooks/usePermission.ts` — RANK hierarchy (anonymous=0, public=1, staff=2); usePermission(role) → boolean
- `web/src/pages/LoginPage.tsx` — username/password form → POST /api/v1/auth/login; ErrorBanner on 401; redirect to previous route on success
- `web/src/pages/CallbackPage.tsx` — OAuth callback handler calling /callback backend endpoint; stores JWT + navigates to /tickets

### Shared Components
- `web/src/components/common/ProtectedRoute.tsx` — redirects unauthenticated to /login; insufficient role to /tickets
- `web/src/components/common/LoadingSpinner.tsx` — centered loading indicator
- `web/src/components/common/ErrorBanner.tsx` — role="alert" error display
- `web/src/components/common/Pagination.tsx` — prev/next page controls
- `web/src/components/layout/AppLayout.tsx` — Sidebar + TopBar + main content
- `web/src/components/layout/Sidebar.tsx` — all nav items link to real routes; staff-only items hidden via usePermission
- `web/src/components/layout/TopBar.tsx` — user role display + Logout button

### Router
- `web/src/router/index.tsx` — createBrowserRouter with all routes; admin placeholders (Wave 3b will replace); zero dead 404 links

### Ticket Pages (F0, F1, F11, F18)
- `web/src/pages/tickets/TicketListPage.tsx` — paginated ticket table; re-fetches on filter change; CSV Export + New Ticket (staff only)
- `web/src/pages/tickets/TicketDetailPage.tsx` — ticket fields + history; Reopen action (staff only); concurrent fetch of ticket + history
- `web/src/pages/tickets/CreateTicketPage.tsx` — categoryId + description required; location/city/zip optional; navigates to new ticket on success
- `web/src/components/tickets/TicketSearchFilters.tsx` — 11 filter fields (q, status, categoryId, departmentId, assignedPersonId, substatusId, contactMethodId, enteredDateFrom/To, city, zip); every onChange triggers onFilterChange
- `web/src/components/tickets/TicketHistoryList.tsx` — chronological history with actionName, renderedDescription, enteredByPersonName, enteredDate, notes, sentNotifications
- `web/src/components/tickets/TicketStatusBadge.tsx` — colored badge for open/closed with substatus

## Dev Server Verification
- `host: '0.0.0.0'` ✓ (Vite binds to all interfaces for sandbox preview)
- `port: 3000` ✓
- Proxy: `/api`, `/open311`, `/callback` → `http://localhost:8080` ✓
- No `X-Frame-Options DENY` or `CSP frame-ancestors` headers ✓ (comments only in config)

## Auth Integration (F3, F4)
- AuthContext: `user (personId, role)`, `login()`, `logout()`, `refreshToken()` ✓
- Tokens persisted in localStorage (`ureport_access_token`, `ureport_refresh_token`) ✓
- JWT decoded client-side on mount to restore user state ✓
- usePermission hook: anonymous(0) < public(1) < staff(2) rank hierarchy per F03 ✓
- ProtectedRoute: unauthenticated → /login; insufficient role → /tickets ✓

## Features Covered
- **F0**: TicketListPage (list), TicketDetailPage (view + reopen), CreateTicketPage (create)
- **F1**: TicketHistoryList rendering GET /api/v1/tickets/{id}/history with all required fields
- **F3**: usePermission hook + ProtectedRoute + Sidebar staff-only nav items
- **F4**: LoginPage (POST /api/v1/auth/login), CallbackPage (OAuth), JWT token management, logout
- **F11**: TicketSearchFilters with all 11 search params; every change triggers re-fetch
- **F18**: CSV Export button (staff only) → GET /api/v1/tickets/export?format=csv with active filters

## Router Routes (All Lead to Real Pages)
| Path | Guard | Component |
|------|-------|-----------|
| / | — | Navigate → /tickets |
| /login | public | LoginPage |
| /callback | public | CallbackPage |
| /tickets | auth | TicketListPage |
| /tickets/:id | auth | TicketDetailPage |
| /tickets/new | staff | CreateTicketPage |
| /people | staff | PeopleListPage (placeholder) |
| /departments | staff | DepartmentsPage (placeholder) |
| /categories | staff | CategoriesPage (placeholder) |
| /admin/substatuses | staff | SubstatusPage (placeholder) |
| /admin/actions | staff | ActionsPage (placeholder) |
| /admin/clients | staff | ClientsPage (placeholder) |
| /admin/jobs | staff | AdminJobsPage (placeholder) |
| /metrics | staff | MetricsDashboardPage (placeholder) |
| /reports | staff | ReportsPage (placeholder) |

## Integration Contract Verification
All `integration_contracts.provides.verify` commands passed:
- `apiClient` + `interceptors` in `web/src/api/client.ts` ✓
- `AuthProvider` + `useAuthContext` in `web/src/contexts/AuthContext.tsx` ✓
- `usePermission` + `staff` in `web/src/hooks/usePermission.ts` ✓
- `TicketListPage` + `ticketsApi` in `web/src/pages/tickets/TicketListPage.tsx` ✓
- `TicketDetailPage` + `history` in `web/src/pages/tickets/TicketDetailPage.tsx` ✓
- `TicketSearchFilters` + `onFilterChange` in `web/src/components/tickets/TicketSearchFilters.tsx` ✓
- `AppRouter` + `createBrowserRouter` + `RouterProvider` + `/tickets` in `web/src/router/index.tsx` ✓

## TypeScript
- `npx tsc --noEmit` → **PASSED** (zero errors, strict mode)

## Deviations from Plan

None — plan executed exactly as written.

Minor notes:
- Added `import React from 'react'` to files that needed it (the plan's code snippets omitted imports for brevity; added for correct compilation)
- `CallbackPage` used `(err as Error).message` instead of `err.message ?? ...` for type-safe error extraction
- `TicketListPage` `useEffect` dependency array uses `// eslint-disable-line` comment (intentional: only fetch on mount, not on every `fetchTickets` reference change)

## Self-Check: PASSED

**Files exist:**
- web/package.json ✓
- web/vite.config.ts ✓
- web/src/api/client.ts ✓
- web/src/contexts/AuthContext.tsx ✓
- web/src/hooks/usePermission.ts ✓
- web/src/pages/tickets/TicketListPage.tsx ✓
- web/src/pages/tickets/TicketDetailPage.tsx ✓
- web/src/pages/tickets/CreateTicketPage.tsx ✓
- web/src/components/tickets/TicketSearchFilters.tsx ✓
- web/src/router/index.tsx ✓

**Commits exist:**
- 8aacdb9 (Task 1) ✓
- c421b58 (Task 2) ✓

**TypeScript:** `npx tsc --noEmit` → zero errors ✓
