# Requirements: uReport CRM Modernization

**Defined:** 2026-07-06
**Core Value:** Every existing feature, screen, API contract, and Open311 endpoint must continue to work exactly as before — the modernization improves the technology stack and visual quality without removing or changing any capability.

## v1 Requirements

Requirements for the full modernization release. Each maps to roadmap phases.

### Infrastructure & Database

- [ ] **F21**: Migrate full MySQL schema to PostgreSQL using Flyway migration scripts — all 18 tables, columns, constraints, indexes, and seed data preserved; zero data loss
- [ ] **DB-01**: Replace MySQL AUTO_INCREMENT with PostgreSQL SERIAL, TINYINT(1) with BOOLEAN, and handle all other MySQL-to-PostgreSQL syntax differences
- [ ] **DB-02**: Replace Solr full-text search with PostgreSQL tsvector/tsquery + GIN indexes; implement equivalent search behavior to crm/scripts/solr/indexSearch.php

### Authentication & Security

- [ ] **F12**: Re-implement LDAP and CAS login in Spring Security; add JWT for session management between React frontend and Spring backend
- [ ] **AUTH-01**: JWT token issuance on successful LDAP/CAS auth, refresh token support, logout invalidation
- [ ] **AUTH-02**: Route-level authorization — public routes (case submission, Open311), staff routes (case management), admin routes (configuration panels)

### Open311 / GeoReport v2 API

- [ ] **F0**: Implement all Open311 / GeoReport v2 endpoints exactly — GET /services, GET /requests, POST /requests, GET /requests/:id — with identical request/response contracts; external clients must continue working without changes
- [ ] **API-01**: Context-switching: same endpoints serve JSON, XML, and HTML based on Accept header or `format` parameter, exactly as the original PHP version does
- [ ] **F20**: Add OpenAPI/Swagger documentation for all Spring Boot endpoints

### Case / Ticket Management

- [ ] **F1**: Implement full case lifecycle in Spring Boot — case creation, assignment, status transitions (open → in-progress → closed), reopen, duplicate marking, bulk operations
- [ ] **F9**: Implement action/response logging — all system actions (open, assignment, closed, changeCategory, changeLocation, response, duplicate, update, comment, upload_media) with email notifications and response templates
- [ ] **F10**: Implement media/photo upload handling — file storage, MIME type validation, attachment listing
- [ ] **F14**: Implement API client / api_key management for Open311 clients
- [ ] **CASE-01**: Preserve all CRM business rules — SLA tracking via slaDays, autoCloseIsActive, substatus transitions, category-based routing to departments

### People, Departments & Categories

- [ ] **F6**: People management — create, edit, delete staff/contact people with emails, phones, addresses, role, department assignment
- [ ] **F7**: Department management — create, edit, delete departments; default person assignment; department-action associations
- [ ] **F8**: Category management — full CRUD with category groups, display/posting permission levels, custom fields, SLA days, auto-close settings, notification reply email, featured/active flags
- [ ] **F13**: Admin panels for substatus, issue types, contact methods, response templates, department-category links, category-action responses

### Search & Bookmarks

- [ ] **F11**: Full-text search across tickets (description, location, people) using PostgreSQL tsvector/tsquery with GIN indexes; same search behavior as Solr implementation
- [ ] **SEARCH-01**: Bookmark/saved search functionality — save, name, and recall search queries per user

### Geo & Metrics

- [ ] **F16**: Geo-clustering for map views — cluster_id_0 through cluster_id_6 hierarchy for map zoom levels
- [ ] **F15**: Metrics and reporting — case counts by status, category, department, date range; exportable reports

### React Frontend — Design System & Navigation

- [ ] **F17**: Design system — Tailwind CSS with custom design tokens (CSS variables for civic blue, 12-stop neutral gray, semantic status colors, dark mode palette); shadcn/ui components fully customized (not defaults); Inter for UI text, JetBrains Mono for IDs/code; 4px base grid; 3-tier shadow system (sm/md/lg); consistent border radii (sm 4px, md 8px, lg 16px)
- [ ] **F18**: Navigation shell — persistent top navbar with breadcrumbs; collapsible sidebar for admin (w-64 ↔ w-16); mobile-responsive hamburger menu with slide-in Sheet drawer; active route highlighting
- [ ] **F19**: WCAG 2.1 AA accessibility + Section 508 compliance throughout — all interactive elements keyboard navigable, ARIA labels on icons, visible focus rings, color contrast ratios met in both light and dark mode
- [ ] **ANIM-01**: Framer Motion for page transitions, list stagger animations, and micro-interactions on buttons and form inputs; all animations ≤300ms; prefers-reduced-motion respected
- [ ] **RESP-01**: Every screen works at 375px (mobile), 768px (tablet), 1280px+ (desktop); CSS Grid and Flexbox; no horizontal scroll on mobile

### React Frontend — Screens

- [ ] **F5**: Dashboard — summary stat cards (total cases, open, in-progress, resolved) with animated counters; recent cases feed; map widget (Mapbox GL JS or Leaflet) showing case locations; status breakdown donut chart (Recharts)
- [ ] **F3**: Case list — full data table with column sorting, multi-column filtering, status badge pills, pagination, row-level actions (view, assign, close); bulk selection; skeleton loading state
- [ ] **F4**: Case detail — split-pane layout (left: case info, right: activity/action timeline); timeline entries with icon + timestamp + actor; inline status transition dropdown; photo attachment lightbox gallery
- [ ] **F2**: Case submission public form — multi-step with progress indicator; Step 1: category card-based picker with icons; Step 2: description + photo upload with drag-and-drop; Step 3: interactive map pin-drop; Step 4: contact info; Framer Motion step transitions
- [ ] **ADMIN-01**: Admin panels — sidebar layout with grouped navigation; tables with inline editing; confirmation dialogs for destructive actions; toast notifications for all save/delete operations
- [ ] **SEARCH-02**: Search UI — live search with debounce, highlighted keyword matches in results, filter chips for status/category/date range, empty state illustrations
- [ ] **AUTH-03**: Auth screens (LDAP/CAS login) — centered card layout, branded with city logo placeholder, clean input styling, loading spinner on submit

### Backend Architecture

- [ ] **ARCH-01**: Java Spring Boot REST API with Spring Data JPA for database access and MapStruct for DTO mapping
- [ ] **ARCH-02**: Container image packaging — each service (React/Nginx, Spring Boot, PostgreSQL) has its own `Dockerfile`; no Docker Compose (sandbox runs on Kubernetes without Docker daemon); dev verification uses Maven with embedded PostgreSQL (`io.zonky.test:embedded-postgres`); production targets any OCI-compatible runtime

## v2 Requirements

Deferred to future release. Tracked but not in current modernization scope.

### Enhancements (Post-Modernization)

- **V2-01**: Mobile native apps (iOS/Android) — web-first modernization first
- **V2-02**: Real-time push notifications (WebSocket/SSE) — polling sufficient for v1
- **V2-03**: Advanced analytics dashboard with trend charts — basic metrics in v1
- **V2-04**: Multi-municipality / multi-tenant support — single-city scope for v1

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Changing Open311 API endpoint paths, HTTP methods, or response formats | Hard constraint — external clients (mobile apps, aggregators) already deployed |
| Dropping any database tables or columns | Hard constraint — zero data loss migration |
| Removing any UI screens or admin features | Hard constraint — 100% feature parity required |
| Changing the case/issue/people/location domain model | Hard constraint — domain model is stable and proven |
| New features not in the original application | Focus is modernization + visual upgrade, not expansion |
| Native mobile apps | Web-responsive is sufficient for v1 |
| Real-time WebSocket push | HTTP polling/refresh sufficient for civic 311 use case |

## Traceability

Updated during roadmap creation (2026-07-06).

| Requirement | Phase | Status |
|-------------|-------|--------|
| F21 (DB Migration — Flyway) | Phase 1 — Infrastructure Foundation | Pending |
| DB-01 (MySQL→PostgreSQL type mapping) | Phase 1 — Infrastructure Foundation | Pending |
| ARCH-02 (Dockerfiles + embedded-postgres) | Phase 1 — Infrastructure Foundation | Pending |
| F12 (LDAP/CAS Auth + JWT) | Phase 2 — Authentication & Security | Pending |
| AUTH-01 (JWT issuance, refresh, logout) | Phase 2 — Authentication & Security | Pending |
| AUTH-02 (Route-level authorization) | Phase 2 — Authentication & Security | Pending |
| ARCH-01 (Spring Boot + JPA + MapStruct) | Phase 2 — Authentication & Security | Pending |
| F0 (Open311 / GeoReport v2 API) | Phase 3 — Open311 / GeoReport v2 API | Pending |
| API-01 (Content negotiation JSON/XML/HTML) | Phase 3 — Open311 / GeoReport v2 API | Pending |
| F20 (OpenAPI/Swagger documentation) | Phase 3 — Open311 / GeoReport v2 API | Pending |
| F1 (Case lifecycle — create/assign/close/reopen) | Phase 4 — Core Case Management Backend | Pending |
| F9 (Action/response logging + email notifications) | Phase 4 — Core Case Management Backend | Pending |
| F10 (Media/photo upload) | Phase 4 — Core Case Management Backend | Pending |
| F14 (Open311 client/API key management) | Phase 4 — Core Case Management Backend | Pending |
| CASE-01 (CRM business rules — SLA, substatus, routing) | Phase 4 — Core Case Management Backend | Pending |
| F6 (People management) | Phase 5 — Admin Configuration Backend | Pending |
| F7 (Department management) | Phase 5 — Admin Configuration Backend | Pending |
| F8 (Category & category group management) | Phase 5 — Admin Configuration Backend | Pending |
| F13 (Admin panels — substatus, issue types, templates, contact methods) | Phase 5 — Admin Configuration Backend | Pending |
| F11 (PostgreSQL full-text search — Solr replacement) | Phase 6 — Search, Geo & Metrics Backend | Pending |
| SEARCH-01 (Bookmark/saved search) | Phase 6 — Search, Geo & Metrics Backend | Pending |
| F16 (Geo-clustering for map views) | Phase 6 — Search, Geo & Metrics Backend | Pending |
| F15 (Metrics and reporting) | Phase 6 — Search, Geo & Metrics Backend | Pending |
| DB-02 (tsvector/tsquery + GIN indexes) | Phase 6 — Search, Geo & Metrics Backend | Pending |
| F17 (Design system — Tailwind, shadcn/ui, design tokens) | Phase 7 — React Design System & Shell | Pending |
| F18 (Navigation shell — navbar, sidebar, breadcrumbs) | Phase 7 — React Design System & Shell | Pending |
| F19 (WCAG 2.1 AA + Section 508 accessibility) | Phase 7 — React Design System & Shell | Pending |
| ANIM-01 (Framer Motion animations ≤300ms) | Phase 7 — React Design System & Shell | Pending |
| RESP-01 (Responsive design 375/768/1280px) | Phase 7 — React Design System & Shell | Pending |
| F5 (Dashboard) | Phase 8 — Core Frontend Screens | Pending |
| F3 (Case list with search/filter/sort) | Phase 8 — Core Frontend Screens | Pending |
| F4 (Case detail view) | Phase 8 — Core Frontend Screens | Pending |
| F2 (Public case submission form) | Phase 8 — Core Frontend Screens | Pending |
| ADMIN-01 (Admin panels UI — inline editing, toasts, dialogs) | Phase 9 — Admin Panels & Integration | Pending |
| SEARCH-02 (Search UI — live search, highlights, filter chips) | Phase 9 — Admin Panels & Integration | Pending |
| AUTH-03 (Auth screens — branded LDAP/CAS login) | Phase 9 — Admin Panels & Integration | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

Note: DB-02 (tsvector/GIN indexes) is addressed in two phases:
- Flyway V2 migration script created in Phase 1 (schema only)
- SearchService implementation and FTS endpoints delivered in Phase 6

---
*Requirements defined: 2026-07-06*
*Last updated: 2026-07-06 after roadmap creation*
