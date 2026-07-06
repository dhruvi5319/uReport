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
- [ ] **ARCH-02**: Docker Compose deployment with separate containers for React/Nginx, Spring Boot, and PostgreSQL

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

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| F21 (DB Migration) | Phase 1 | Pending |
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| F12 (Auth) | Phase 2 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| F0 (Open311 API) | Phase 3 | Pending |
| API-01 (Context switching) | Phase 3 | Pending |
| F20 (OpenAPI docs) | Phase 3 | Pending |
| F1 (Case lifecycle) | Phase 4 | Pending |
| F9 (Action logging) | Phase 4 | Pending |
| F10 (Media upload) | Phase 4 | Pending |
| F14 (Client management) | Phase 4 | Pending |
| CASE-01 (Business rules) | Phase 4 | Pending |
| F6 (People mgmt) | Phase 5 | Pending |
| F7 (Dept mgmt) | Phase 5 | Pending |
| F8 (Category mgmt) | Phase 5 | Pending |
| F13 (Admin panels backend) | Phase 5 | Pending |
| F11 (Full-text search) | Phase 6 | Pending |
| SEARCH-01 (Bookmarks) | Phase 6 | Pending |
| F16 (Geo-clustering) | Phase 6 | Pending |
| F15 (Metrics) | Phase 6 | Pending |
| F17 (Design system) | Phase 7 | Pending |
| F18 (Navigation shell) | Phase 7 | Pending |
| F19 (Accessibility) | Phase 7 | Pending |
| ANIM-01 (Animations) | Phase 7 | Pending |
| RESP-01 (Responsive) | Phase 7 | Pending |
| F5 (Dashboard) | Phase 8 | Pending |
| F3 (Case list) | Phase 8 | Pending |
| F4 (Case detail) | Phase 8 | Pending |
| F2 (Submission form) | Phase 8 | Pending |
| ADMIN-01 (Admin panels UI) | Phase 9 | Pending |
| SEARCH-02 (Search UI) | Phase 9 | Pending |
| AUTH-03 (Auth screens) | Phase 9 | Pending |
| ARCH-01 (Spring Boot + JPA) | Phase 2 | Pending |
| ARCH-02 (Docker Compose) | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-06*
*Last updated: 2026-07-06 after initial definition*
