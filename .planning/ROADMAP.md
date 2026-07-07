# Roadmap: uReport CRM Modernization

## Overview

The modernization replaces a PHP/MySQL/Solr stack with React + Java Spring Boot + PostgreSQL, preserving 100% of features, data, and Open311 API contracts. Work proceeds in dependency order: data foundation first (PostgreSQL schema, Dockerfiles, Spring Boot skeleton), then backend services (auth, Open311 API, core case management), then admin configuration backend, then search and geo, then React design system and shell, then all frontend screens, and finally integration hardening and deployment. Note: the sandbox execution environment is Kubernetes (no Docker daemon); all tests use embedded PostgreSQL via Maven — Dockerfiles are for image packaging only.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Infrastructure Foundation** - PostgreSQL schema via Flyway, Dockerfiles for each service, Spring Boot skeleton (no Docker Compose — embedded-postgres for tests)
- [ ] **Phase 2: Authentication & Security** - LDAP/CAS + JWT auth, Spring Security, route-level authorization
- [ ] **Phase 3: Open311 / GeoReport v2 API** - All four frozen endpoints with content negotiation, API key auth, OpenAPI docs
- [ ] **Phase 4: Core Case Management Backend** - Full ticket lifecycle, action logging, media upload, business rules
- [ ] **Phase 5: Admin Configuration Backend** - People, departments, categories, and all lookup-table admin APIs
- [ ] **Phase 6: Search, Geo & Metrics Backend** - PostgreSQL FTS with GIN indexes, bookmarks, geo-clustering, reporting
- [ ] **Phase 7: React Design System & Shell** - Design tokens, shadcn/ui components, navbar, sidebar, animations, accessibility
- [ ] **Phase 8: Core Frontend Screens** - Dashboard, case list, case detail, and public submission form
- [ ] **Phase 9: Admin Panels & Integration** - Admin UI panels, search UI, auth screens, Dockerfile build verification, E2E tests

## Phase Details

### Phase 1: Infrastructure Foundation
**Status**: failed
<<<<<<< HEAD
**Goal**: The full PostgreSQL schema exists, migrations run cleanly, the Spring Boot app connects to the database, and each service has a working Dockerfile for image packaging
=======
**Goal**: The full PostgreSQL schema exists, migrations run cleanly, all three containers start, and the Spring Boot app connects to the database
>>>>>>> c1d19b5 (docs: phase 2 status → In Progress)
**Depends on**: Nothing (first phase)
**Requirements**: F21, DB-01, ARCH-02
**Success Criteria** (what must be TRUE):
  1. `flyway migrate` on a clean PostgreSQL instance creates all 18 tables with correct columns, types, foreign keys, and indexes — verified by automated row-count and constraint check
  2. The `search_vector` tsvector column and GIN index exist on `tickets`; the trigger fires on INSERT/UPDATE
  3. Spring Boot starts with embedded PostgreSQL in test profile; `/actuator/health` returns `{"status":"UP"}` verified by Maven integration test (no Docker daemon required)
  4. Spring Boot connects to PostgreSQL via HikariCP; Flyway migration history is visible in the `flyway_schema_history` table
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Flyway V1 initial schema (all 21 tables, snake_case columns, constraints, indexes, seed data) + V1SchemaIT integration test
- [ ] 01-02-PLAN.md — Flyway V2 search_vector TSVECTOR column, GIN index, trigger function + V2SearchVectorIT integration test
- [ ] 01-03-PLAN.md — Spring Boot 3.x Maven skeleton (pom.xml, UReportApplication, application.yml) + Dockerfiles for each service (backend, frontend/nginx) + embedded-postgres test configuration

### Phase 2: Authentication & Security
**Status**: In Progress
**Goal**: Staff can authenticate via LDAP or CAS, receive a JWT, and the API enforces route-level authorization for public, staff, and admin routes
**Depends on**: Phase 1
**Requirements**: F12, AUTH-01, AUTH-02, ARCH-01
**Success Criteria** (what must be TRUE):
  1. Staff can submit LDAP credentials to `POST /api/auth/ldap` and receive an httpOnly cookie containing a valid JWT
  2. Staff can authenticate via CAS redirect to `/auth/cas/callback` and receive an httpOnly cookie containing a valid JWT
  3. A valid JWT cookie grants access to protected `/api/*` endpoints; an expired or missing cookie returns 401
  4. Public routes (`/submit`, `GET /open311/*`) return data without a JWT; admin-only routes return 403 for staff-role JWT
  5. `POST /api/auth/refresh` issues a new JWT before expiry; `POST /api/auth/logout` invalidates the session
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Spring Security config + JWT filter chain (JwtService, JwtAuthFilter, SecurityConfig, CSRF double-submit, CORS)
- [ ] 02-02-PLAN.md — LDAP auth provider + AuthController (Person entity, PersonRepository, LdapAuthService, POST /api/auth/ldap, GET /api/auth/me, POST /api/auth/refresh, POST /api/auth/logout)
- [ ] 02-03-PLAN.md — CAS auth provider (CasAuthService ticket validation, CasAuthController GET /auth/cas + GET /auth/cas/callback, CAS XML parsing, unit tests)
- [ ] 02-04-PLAN.md — Route authorization enforcement + integration tests (RoleHierarchyConfig ADMIN>STAFF>PUBLIC, AuthorizationIT covering all TechArch §5.4 rules)
- [ ] 02-05-PLAN.md — [GAP CLOSURE] Fix dev server startup: rewrite start-dev.sh (no Docker/sudo, Maven install, Spring Boot with dev profile), add application-dev.yml (H2 in-memory), fix H2 scope to runtime

### Phase 3: Open311 / GeoReport v2 API
**Status**: completed (2026-07-07)
**Last Updated**: 2026-07-07T02:51:42Z
**Goal**: All four frozen Open311 endpoints return byte-compatible responses to the existing PHP implementation, with correct content negotiation and API key validation
**Depends on**: Phase 2
**Requirements**: F0, API-01, F20
**Success Criteria** (what must be TRUE):
  1. `GET /open311/v2/services` returns the full category list as JSON or XML based on Accept header or format parameter, identical in structure to the PHP reference output
  2. `GET /open311/v2/requests` accepts all documented filter parameters (service_code, status, start_date, end_date, bbox, page, page_size) and returns paginated service request objects in GeoReport v2 format
  3. `POST /open311/v2/requests` with a valid `api_key` creates a ticket and returns the new `service_request_id`; a missing or invalid api_key returns 403
  4. `GET /open311/v2/requests/{id}` returns a single service request object or 404 if not found
  5. All Open311 endpoints are documented in the OpenAPI spec at `/v3/api-docs` and browsable at `/swagger-ui.html`
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Open311 services controller: Category/CategoryGroup/Department JPA entities, Open311ServiceDto, Open311ServiceService (obsolete key handling), GET /services + GET /services/{code} with JSON/XML content negotiation
- [ ] 03-02-PLAN.md — Open311 requests controller: Ticket/TicketHistory/Media/Client JPA entities, Open311ServiceRequestDto (all 18 GeoReport v2 fields), Open311RequestService (filters, api_key validation, field mapping), GET/POST /requests + GET /requests/{id}
- [ ] 03-03-PLAN.md — OpenAPI/Swagger integration + golden-file tests: OpenApiConfig (JWT Bearer scheme), @Operation/@ApiResponse annotations on all 5 endpoints, Open311GoldenFileIT shape/content-negotiation tests

### Phase 4: Core Case Management Backend
**Status**: In Progress
**Goal**: The Spring Boot API supports the full ticket lifecycle — create, assign, update, close, reopen, bulk operations, action logging, and media upload — with all business rules preserved
**Depends on**: Phase 3
**Requirements**: F1, F9, F10, F14, CASE-01
**Success Criteria** (what must be TRUE):
  1. A staff user can create a ticket via `POST /api/tickets` with category, location, and description; the ticket record and an "open" history entry are created; email notification fires to the assignee
  2. A ticket can be closed with a substatus via `POST /api/tickets/{id}/close`, and reopened via `POST /api/tickets/{id}/reopen`; each transition creates an immutable `ticket_history` entry
  3. `POST /api/tickets/bulk` applies assign, close, or status-change to multiple tickets atomically, returning a per-ticket success/failure count
  4. An action/response can be logged on any ticket via `POST /api/tickets/{id}/history` with action type, notes, response template selection, and optional email notification flags
  5. Photos can be uploaded to a ticket via `POST /api/tickets/{id}/media`; MIME type and size are validated; the file is stored at `/var/ureport/media/{ticket_id}/{filename}` and a `media` record is created
  6. SLA overdue flag is computed from `categories.sla_days + tickets.entered_date`; Open311 client API key management CRUD is available at `/api/clients`
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md — Ticket CRUD: TicketService + TicketController (create, get, patch, close, reopen, assign), ticket_history entries for all transitions, TicketDetailDto with isOverdue/slaDueDate
- [ ] 04-02-PLAN.md — Bulk operations + CASE-01 rules: TicketBulkService + TicketBulkController (POST /api/tickets/bulk), SlaService (isOverdue, computeSlaDueDate, triggerAutoClose), BulkOperationResult DTO
- [ ] 04-03-PLAN.md — Action logging + notifications: NotificationService (SMTP JavaMailSender, non-fatal), TicketHistoryService (department_actions filter, response templates), TicketHistoryController, ActionRepository, application.yml SMTP config
- [ ] 04-04-PLAN.md — Media upload + client CRUD: MediaService (magic-byte MIME validation, Thumbnailator 150×150, file storage), TicketMediaController, ClientService + ClientController (/api/clients admin-only)

### Phase 5: Admin Configuration Backend
**Goal**: All administrative configuration APIs exist — people, departments, categories, and all lookup-table entities — so admin panels can be built in Phase 9
**Depends on**: Phase 4
**Requirements**: F6, F7, F8, F13
**Success Criteria** (what must be TRUE):
  1. People CRUD is available at `/api/people`; a person record can be created with multiple emails, phones, and addresses; LDAP/CAS username can be set; department assignment works
  2. Department CRUD at `/api/departments` supports creating departments, setting a default assignee, and managing `department_actions` and `department_categories` associations
  3. Category and category group CRUD at `/api/categories` and `/api/category-groups` supports full taxonomy management including `posting_permission_level`, `sla_days`, and `category_action_responses` templates
  4. All lookup-table entities (substatus, issue types, contact methods, response templates) have full CRUD endpoints at `/api/substatus`, `/api/issue-types`, `/api/contact-methods`, `/api/actions`
**Plans**: TBD

Plans:
- [ ] 05-01: People management API — PeopleController, PeopleService, people_emails/phones/addresses sub-resources, department assignment
- [ ] 05-02: Department management API — DepartmentController, DepartmentService, department_actions, department_categories
- [ ] 05-03: Category management API — CategoryController, CategoryGroupController, CategoryService, category_action_responses
- [ ] 05-04: Lookup table admin APIs — LookupController for substatus, issue_types, contact_methods; F13 admin panel endpoints

### Phase 6: Search, Geo & Metrics Backend
**Goal**: PostgreSQL full-text search works at parity with the existing Solr implementation, bookmarks persist per user, geo-cluster data serves the map widget, and metrics/reporting endpoints are live
**Depends on**: Phase 5
**Requirements**: F11, SEARCH-01, F16, F15
**Success Criteria** (what must be TRUE):
  1. `GET /api/tickets?q=pothole` executes a tsvector/tsquery query across ticket description, location, reporter name, and category name; results are relevance-ranked; `ts_headline` snippets are returned in the response
  2. A full-text search query with 300 ms debounce returns results in ≤500 ms P95 under representative data volume (GIN index verified)
  3. A user can save a search as a bookmark via `POST /api/bookmarks` with name and current query string; saved bookmarks are retrieved via `GET /api/bookmarks`
  4. `GET /api/geoclusters?zoom={level}` returns pre-computed cluster data from `geoclusters` and `ticket_geodata` tables
  5. `GET /api/dashboard/stats` returns open count, opened today, closed today, and overdue count; `GET /api/metrics` returns case volume, resolution time, and category breakdown with date-range filtering
**Plans**: TBD

Plans:
- [ ] 06-01: Full-text search — SearchService (tsvector queries, ts_headline, search + filter combine), TicketRepository @Query for FTS, SEARCH-01 bookmark CRUD
- [ ] 06-02: Geo and metrics — GeoclusterController/Service, DashboardController/Service (stat counts, chart aggregations), metrics/reporting endpoints

### Phase 7: React Design System & Shell
**Goal**: The React application has a complete design system, working navigation shell, and accessible responsive layout so all screens can be built consistently on top of it
**Depends on**: Phase 6
**Requirements**: F17, F18, F19, ANIM-01, RESP-01
**Success Criteria** (what must be TRUE):
  1. The Tailwind CSS configuration and CSS custom property tokens define the full civic color palette, spacing scale, and shadow system; dark mode toggles correctly via `:root`/`.dark` class swap and persists to localStorage
  2. All 12 required shadcn/ui components (Button, Badge, Card, Dialog, Input, Select, Table, Skeleton, Toast, Sheet, Tabs, Popover) are customized to the city brand and render correctly in both light and dark mode
  3. The persistent top navbar, collapsible sidebar (w-64 ↔ w-16, state persisted), breadcrumbs, and mobile hamburger Sheet drawer render and navigate correctly at 375px, 768px, and 1280px+ viewports
  4. Framer Motion page transitions, stagger animations, and micro-interactions fire within 300ms; `prefers-reduced-motion` disables all motion globally
  5. All shell components pass axe-core WCAG 2.1 AA scan (0 critical/serious violations); keyboard navigation and visible focus rings work throughout
**Plans**: TBD

Plans:
- [ ] 07-01: Design tokens and Tailwind config — globals.css, tokens.css, CSS variables (light + dark), Inter/JetBrains Mono fonts, 4px grid, shadow system
- [ ] 07-02: shadcn/ui component library — install and customize all 12 components; Badge status color variants; dark mode testing
- [ ] 07-03: Navigation shell — Navbar, Sidebar (collapsible), Breadcrumb, MobileDrawer; React Router integration; active route highlighting
- [ ] 07-04: Animation system and accessibility — lib/animations.ts Framer Motion variants, useReducedMotion hook; ARIA labels, focus rings, skip-to-main; responsive breakpoint smoke tests

### Phase 8: Core Frontend Screens
**Goal**: The four primary user-facing screens are complete — dashboard, case list, case detail, and public submission form — delivering the full staff and public workflow in the React UI
**Depends on**: Phase 7
**Requirements**: F5, F3, F4, F2
**Success Criteria** (what must be TRUE):
  1. An authenticated staff user lands on the dashboard and sees live stat cards, recent cases feed, a geo-clustered map widget, and a status donut chart; clicking a stat card navigates to the case list with the filter pre-applied
  2. The case list displays tickets in a sortable, paginated table with status badge pills; staff can type a search term and see results highlighted within 300ms debounce; filter chips appear for each active filter; bulk select and bulk close/assign work
  3. The case detail screen shows the split-pane layout; staff can close a ticket (with substatus), log an action/response, upload a photo, and view the complete action timeline — all without a page reload
  4. A public user can complete all five steps of the submission wizard (contact → category → location/pin-drop → description/photos → review), submit the form, and see a confirmation screen with their case ID
  5. All four screens are fully responsive at 375px, 768px, and 1280px+; skeleton loading states appear while data fetches; empty states render when no results
**Plans**: TBD

Plans:
- [ ] 08-01: Dashboard — DashboardPage, StatCard, RecentCasesFeed, StatusDonut (Recharts), MapWidget (Mapbox/Leaflet), parallel data fetching
- [ ] 08-02: Case list — CaseListPage, CaseTable (sortable columns), FilterPanel, FilterChips, BulkActionBar, SearchInput with debounce, skeleton loading, empty state
- [ ] 08-03: Case detail — CaseDetailPage, MetadataPanel (inline editing), TimelinePanel, ActionLogForm (templates, email toggles), MediaGallery, Lightbox
- [ ] 08-04: Public submission form — PublicSubmitPage, SubmissionWizard (5 steps + confirmation), StepLocation (pin-drop map), StepDescription (photo upload), Framer Motion step transitions

### Phase 9: Admin Panels & Integration
**Goal**: All admin configuration panels are complete, search UI is integrated, auth screens are branded, Dockerfile builds verify cleanly, and E2E tests pass
**Depends on**: Phase 8
**Requirements**: ADMIN-01, SEARCH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. An admin user can navigate to any admin panel (people, departments, categories, substatus, issue types, contact methods, response templates, API clients) and perform CRUD operations with inline editing, confirmation dialogs, and toast notifications
  2. The global search input produces live results with keyword highlighting, filter chips, and an empty state illustration; saved searches can be created and recalled from the bookmark dropdown
  3. The LDAP and CAS login screens display the branded city card layout with a loading spinner on submit and a clear error message on auth failure
  4. `docker build` succeeds for both `backend/Dockerfile` and `frontend/Dockerfile` from a clean checkout; all Maven integration tests pass using embedded PostgreSQL
  5. Open311 golden-file integration tests pass against the Spring Boot implementation (all four endpoints match PHP reference responses); WCAG axe-core scan finds 0 critical violations across all screens
**Plans**: TBD

Plans:
- [ ] 09-01: Admin panels UI — PeoplePage, DepartmentsPage, CategoriesPage, ClientsPage, LookupTableAdmin (substatus/issue-types/contact-methods); ADMIN-01 inline editing + toast + confirm dialogs
- [ ] 09-02: Search UI and auth screens — SEARCH-02 live search with highlight/chips/empty state, BookmarkController integration; AUTH-03 LoginPage (LDAP/CAS branded card)
- [ ] 09-03: Integration hardening — Dockerfile build verification (backend + frontend/nginx), Open311 golden-file tests, axe-core accessibility scan, E2E smoke tests against embedded Spring Boot

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure Foundation | 3/3 | Complete | 2026-07-06 |
| 2. Authentication & Security | 0/4 | Not started | - |
| 3. Open311 / GeoReport v2 API | 0/3 | Not started | - |
| 4. Core Case Management Backend | 0/4 | Not started | - |
| 5. Admin Configuration Backend | 0/4 | Not started | - |
| 6. Search, Geo & Metrics Backend | 0/2 | Not started | - |
| 7. React Design System & Shell | 0/4 | Not started | - |
| 8. Core Frontend Screens | 0/4 | Not started | - |
| 9. Admin Panels & Integration | 0/3 | Not started | - |