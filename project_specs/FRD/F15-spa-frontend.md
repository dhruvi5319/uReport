---

## F15: Modern React/Next.js SPA Frontend

**Description:** The primary new deliverable of this modernization. The legacy PHP template rendering is entirely replaced by a React 18+ / Next.js 15+ SPA with TypeScript. The SPA consumes the new RESTful JSON API (F16) and preserves the Open311 endpoint (F1) to deliver a mobile-responsive, WCAG 2.1 AA-accessible interface for all staff and citizen-facing workflows. No PHP template is served to end users after migration.

**Terminology:**
- **SPA:** Single-Page Application — a web application where navigation occurs client-side without full-page reloads.
- **SSR:** Server-Side Rendering — Next.js renders initial HTML on the server for performance and SEO.
- **API Route:** A Next.js server-side handler proxying requests to the backend API (used for auth flows, CSRF protection).
- **OpenAPI TypeScript Client:** Auto-generated TypeScript types and fetch wrappers derived from the OpenAPI 3.1 spec; ensures type-safe API calls.
- **axe-core:** Automated accessibility testing library integrated into the CI pipeline.
- **Radix UI / shadcn/ui:** The component library providing accessible, unstyled primitives (dialogs, dropdowns, forms).

**Sub-features:**
- Staff ticket management UI (list, search, filter, detail, create, edit, assign, close, reopen, delete)
- Public/citizen submission portal and request tracking
- Map view for geospatial ticket visualization (integrated with F05)
- Reporting and metrics dashboards (F09)
- Admin configuration screens: departments, categories, people, templates, API clients, substatuses
- Authentication flow: OIDC login, logout, session management (F11)
- Mobile-responsive layouts (375px–1920px)
- WCAG 2.1 AA accessibility on all pages
- TypeScript strict mode (no `any`, no skipped null checks)
- Client-side form validation + server-side error surfacing
- OpenAPI-generated TypeScript client types

---

### F15 Page Inventory

| Route | Auth | Description |
|-------|------|-------------|
| `/` | None | Public homepage / submission portal |
| `/submit` | None (category-permitting) | Citizen ticket submission form |
| `/track/{id}` | None | Public ticket status tracking |
| `/login` | None | OIDC login initiation |
| `/dashboard` | staff | Staff ticket queue/dashboard |
| `/tickets` | staff | Ticket list + search + filter |
| `/tickets/new` | staff | Staff ticket creation form |
| `/tickets/{id}` | staff/public (own) | Ticket detail view |
| `/tickets/{id}/edit` | staff | Edit ticket fields |
| `/map` | staff | Map view of ticket locations |
| `/reports` | staff | Reporting dashboard |
| `/reports/{type}` | staff | Specific report view |
| `/admin/departments` | admin | Department management |
| `/admin/categories` | admin | Category management |
| `/admin/people` | admin | People management |
| `/admin/templates` | admin | Response templates |
| `/admin/clients` | admin | API client management |
| `/admin/substatuses` | admin | Substatus management |
| `/api/docs` | staff | OpenAPI Swagger UI |

---

### F15 Process: Ticket Submission (Citizen)

1. Citizen navigates to `/submit`.
2. SPA loads active categories with `postingPermission = 'anonymous' | 'public'`.
3. Citizen fills in category, description, location (map picker or address field), and optional contact info.
4. SPA validates client-side: required fields, email format, location present.
5. SPA submits `POST /api/tickets` (or `POST /open311/requests` for Open311 path).
6. On success: SPA displays confirmation with ticket ID and tracking URL.
7. On error: SPA displays field-level error messages from API 422 response.

### F15 Process: Staff Ticket Detail

1. Staff navigates to `/tickets/{id}`.
2. SPA calls `GET /api/tickets/{id}` and `GET /api/tickets/{id}/history`.
3. SPA renders: ticket fields, current status/substatus, assignee, SLA indicator, action history timeline, attachments.
4. Staff action buttons rendered per role and ticket state: Assign, Close, Reopen, Post Response, Add Comment, Merge, Delete.
5. All mutations dispatch API calls and update local state on success.

---

### F15 Inputs

- User interactions: form inputs, button clicks, map selections
- API responses: JSON from the RESTful backend (typed via OpenAPI-generated client)
- Environment: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MAP_TILE_URL`, `OIDC_CLIENT_ID` (server-side)

---

### F15 Outputs

- Server-rendered HTML pages (Next.js SSR/SSG for public routes)
- Client-navigated SPA for authenticated routes
- HTTP 302 redirects for auth flows (handled via Next.js API routes)

---

### F15 Validation (Frontend)

- All required form fields validated before API submission
- Email fields validated with RFC 5322 pattern
- Lat/lng coordinate ranges validated in map picker
- Server validation errors (HTTP 422) mapped to field-level error UI
- File upload size and type validated client-side before upload (same limits as F07)
- CSRF protection via SameSite cookie + Next.js API route token for state-mutating requests

---

### F15 Non-Functional Requirements

| Requirement | Specification |
|-------------|--------------|
| Accessibility | WCAG 2.1 AA — axe-core automated tests pass with 0 critical violations |
| Responsiveness | Fully functional at 375px (mobile) through 1920px (desktop) |
| Performance | Lighthouse score ≥ 85 on ticket list/search pages (mobile profile) |
| TypeScript | Strict mode; `noImplicitAny: true`; `strictNullChecks: true` |
| Build | Next.js production build with asset hashing; HMR in development |
| Testing | Jest unit tests for utilities; Playwright e2e for all 10 critical user journeys |
| i18n | All user-facing strings use next-intl or equivalent gettext-compatible i18n |

---

### F15 Error States

| Scenario | UI Behavior |
|----------|------------|
| API 401 | Redirect to `/login`; preserve intended destination |
| API 403 | Show "Access denied" inline message |
| API 404 | Render 404 page |
| API 422 | Map field errors to form inputs; display inline |
| API 5xx | Display "Something went wrong" with retry button |
| Network error | Display offline/retry message |

---

### F15 API Surface (this feature)

The SPA itself does not expose API endpoints. It consumes all endpoints defined in F16 (see `Y1a-api-tickets.md` and `Y1b-api-admin.md`). Next.js API routes at `/auth/*` handle OIDC flows (see F11).

---

### F15 Schema Surface (this feature)

No database schema. The SPA is purely a consumer of the API layer.
