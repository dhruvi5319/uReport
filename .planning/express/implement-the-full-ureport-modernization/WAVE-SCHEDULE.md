# Wave Schedule: uReport Modernization

**Project:** uReport CRM — React 18 + Spring Boot 3.x + PostgreSQL 16  
**Features:** F0–F20 (21 total)  
**Generated:** 2026-06-24  

---

```yaml
wave: 1
domain: database
plan_number: "01"
depends_on: []
features: [F0, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13, F14, F15, F16, F17, F18, F19, F20]
objective: >
  Create the complete PostgreSQL 16 schema: all 24 tables with exact DDL (FKs, constraints,
  enums, indexes), FTS triggers (tickets_fts_update), geo-sync trigger (tickets_geo_sync),
  PostGIS extension, seed data (substatuses, actions, contactMethods, issueTypes), and
  refresh_tokens / token_blacklist / responseTemplates tables. This is the foundation all
  backend and frontend waves depend on.
estimated_plans: 1
---
wave: 2a
domain: backend
plan_number: "02"
depends_on: [1]
features: [F3, F4, F0, F1]
objective: >
  Implement the P0 authentication and ticket core: JWT Spring Security stack (F4 — login,
  refresh, logout, OAuth callback, API key filter), RBAC guards (F3 — SecurityConfig,
  PermissionEvaluator, role enforcement), Ticket lifecycle CRUD (F0 — create/assign/update/
  close/duplicate/reopen/comment/CSV export), and Ticket history append + template variable
  resolution (F1 — TicketHistoryService, TemplateVariableResolver). These are the structural
  backbone all other backend features depend on.
estimated_plans: 1
---
wave: 2b
domain: backend
plan_number: "03"
depends_on: [1, 2]
features: [F2, F18, F11]
objective: >
  Implement the three P0 cross-cutting backend features: Open311 GeoReport v2 API (F2 —
  discovery, services, requests endpoints with JSON+XML, api_key validation, Open311MappingService,
  Open311XmlSerializer), Multi-format output (F18 — FormatFilter, CsvExportUtil, content
  negotiation, WebMvcConfig), and Full-Text Search (F11 — TicketSearchService with TSVECTOR
  GIN index queries, websearch_to_tsquery, multi-field filters, pagination, map view output).
  Requires Wave 2a ticket entities and auth.
estimated_plans: 1
---
wave: 2c
domain: backend
plan_number: "04"
depends_on: [1, 2]
features: [F5, F6, F7, F8, F9, F14, F19]
objective: >
  Implement P1 and P2 reference-data backend features that tickets depend on: People/Contact
  management (F5 — CRUD, email/phone/address child records, search, auto-create from Open311),
  Department admin (F6 — CRUD, department_categories/department_actions associations), Category
  management (F7 — CRUD with SLA/permissions/customFields/auto-close config, category groups),
  Substatus system (F8 — CRUD, default maintenance, lifecycle integration), Action types (F9 —
  CRUD, category_action_responses, TemplateVariableResolver), Contact methods (F14 — seeded
  records, ticket field assignment), and Issue types (F19 — seeded records, CRUD, ticket
  classification). These are all reference data services needed by ticket operations.
estimated_plans: 1
---
wave: 2d
domain: backend
plan_number: "05"
depends_on: [1, 2, 4]
features: [F10, F13, F15, F16, F12, F20, F17]
objective: >
  Implement remaining P1 and P2 backend features: Media upload and thumbnail caching (F10 —
  MediaController, file storage, thumbnail generation, Open311 media_url integration), API
  client management (F13 — ClientController, ApiKeyHashUtil, dual-hash generation/rotation),
  Location and geo-cluster analysis (F15 — LocationController, GeoService, GeoClusterScheduler
  nightly job, PostGIS ST_DWithin radius queries, ticket_geodata population), Digest email
  notifications (F16 — DigestNotificationScheduler every 5 min, AutoCloseScheduler nightly
  1AM, AuditScheduler weekly 3AM, MailHog integration), Bookmarks (F12 — CRUD, owner
  enforcement), Response templates (F20 — CRUD, action association), and Metrics/reports
  dashboard (F17 — onTimePercentage, 10 canned report endpoints). Depends on Wave 2c for
  people, categories, and substatuses.
estimated_plans: 1
---
wave: 3a
domain: frontend
plan_number: "06"
depends_on: [2, 3]
features: [F0, F1, F3, F4, F11, F18]
objective: >
  Scaffold the React 18 + TypeScript SPA and implement the P0 frontend: Vite project structure,
  React Router, Zustand state, Axios API client with JWT interceptors; LoginPage and
  CallbackPage (F4); usePermission hook and permission-gated routes (F3); TicketListPage with
  full search filter UI and FTS results (F11); TicketDetailPage with history log and action
  display (F0, F1); CreateTicketPage form; multi-format export controls (F18 — CSV/print
  trigger buttons). This establishes the SPA skeleton and all P0 user flows.
estimated_plans: 1
---
wave: 3b
domain: frontend
plan_number: "07"
depends_on: [4, 6]
features: [F5, F6, F7, F8, F9, F13]
objective: >
  Implement P1 administrative frontend pages: PeopleListPage and PersonDetailPage with
  email/phone/address sub-forms (F5); DepartmentsPage with category and action association
  panels (F6); CategoriesPage with SLA/permission/auto-close config and CustomFieldsForm
  (F7); SubstatusPage with default management (F8); ActionsPage with category response
  override forms and template variable preview (F9); ClientsPage with API key generation
  display (F13). All pages are staff-gated via the usePermission hook from Wave 3a.
estimated_plans: 1
---
wave: 3c
domain: frontend
plan_number: "08"
depends_on: [5, 7]
features: [F2, F10, F12, F14, F15, F16, F17, F19, F20]
objective: >
  Implement remaining frontend features: Open311ServiceList display page (F2); MediaUploader
  component with drag-and-drop and thumbnail preview (F10); BookmarksPage and sidebar
  integration (F12); ContactMethodsPage (F14); TicketMapPage with geo-cluster visualization
  (F15); AdminJobController trigger buttons for scheduler manual runs (F16); MetricsDashboardPage
  and ReportsPage with all 10 canned reports (F17); IssueType admin page (F19); ResponseTemplate
  CRUD page and template-picker integration on ticket response form (F20). Depends on Wave 2d
  for scheduler, geo, media, and metrics APIs and Wave 3b for the established SPA scaffold.
estimated_plans: 1
---
wave: 4
domain: integration
plan_number: "09"
depends_on: [1, 2, 3, 4, 5, 6, 7, 8]
features: [F0, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13, F14, F15, F16, F17, F18, F19, F20]
objective: >
  Complete containerization, end-to-end integration, and legacy decommission: write final
  docker-compose.yml with services db (postgis/postgis:16-3.4), api (Spring Boot 8080), web
  (Nginx → React SPA + /open311/* proxy), mailhog (1025/8025); configure Nginx reverse proxy
  preserving Open311 path boundaries (NFR-11); run byte-level Open311 JSON+XML fixture
  comparison tests against legacy PHP output (NFR-1, NFR-9); validate PostgreSQL FTS search
  equivalence corpus (NFR-4); verify ≥80%/90% test coverage targets (NFR-9); validate
  docker-compose up cold-start < 10 minutes (NFR-5); delete legacy crm/, ansible/, infra/
  directories after all features verified. This wave gates the system as production-ready.
estimated_plans: 1
```

---

## WAVE SCHEDULE SUMMARY

| Wave | Plan# | Domain | Features | Objective |
|------|-------|--------|----------|-----------|
| 1 | 01 | database | F0–F20 (all 21) | Complete PostgreSQL 16 schema: 24 tables, FTS/geo-sync triggers, PostGIS, seed data |
| 2a | 02 | backend | F3, F4, F0, F1 | P0 auth core: JWT/Spring Security, RBAC, Ticket lifecycle CRUD, Ticket history + template resolver |
| 2b | 03 | backend | F2, F18, F11 | P0 API layer: Open311 GeoReport v2, Multi-format output (XML/CSV), Full-text search with TSVECTOR |
| 2c | 04 | backend | F5, F6, F7, F8, F9, F14, F19 | P1/P2 reference-data APIs: People, Departments, Categories, Substatuses, Actions, Contact methods, Issue types |
| 2d | 05 | backend | F10, F13, F15, F16, F12, F20, F17 | P1/P2 service APIs: Media upload, API clients, Geo-cluster scheduler, Digest notifications, Bookmarks, Response templates, Metrics |
| 3a | 06 | frontend | F0, F1, F3, F4, F11, F18 | SPA scaffold + P0 UI: Login, RBAC hooks, Ticket list/detail/create pages, FTS search filters, export controls |
| 3b | 07 | frontend | F5, F6, F7, F8, F9, F13 | P1 admin pages: People, Departments, Categories, Substatuses, Actions, API Clients |
| 3c | 08 | frontend | F2, F10, F12, F14, F15, F16, F17, F19, F20 | Remaining pages: Open311 view, Media uploader, Bookmarks, Map view, Metrics dashboard, Reports, Templates |
| 4 | 09 | integration | F0–F20 (all 21) | Docker compose, Nginx proxy, Open311 fixture tests, FTS equivalence validation, coverage gates, legacy deletion |

**Total features:** 21 | **Covered:** 21 | **Uncovered:** 0

---

## Dependency Chain

```
Wave 1 (DB)
  └─► Wave 2a (Backend: Auth + Tickets)
        └─► Wave 2b (Backend: Open311 + FTS + Multi-format)   [parallel with 2c]
        └─► Wave 2c (Backend: Reference data APIs)
              └─► Wave 2d (Backend: Media + Geo + Schedulers)
                    └─► Wave 3c (Frontend: Map + Metrics + Media UI)
      Wave 2b ──────────► Wave 3a (Frontend: SPA scaffold + P0 UI)
      Wave 2c ──────────► Wave 3b (Frontend: P1 admin pages)
                    Wave 3a + 3b ──────────► Wave 3c
  All waves ────────────────────────────────► Wave 4 (Integration)
```

## Parallelization Opportunities

- **Plans 03 and 04** (waves 2b and 2c) can run **in parallel** — both depend on Wave 1 (DB) and Wave 2a (auth/tickets), but have no file overlap between them.
- **Plans 06 and 07** (waves 3a and 3b) can run **in parallel** — Wave 3a depends on plans 02+03, Wave 3b depends on plans 04+06 (3b needs 3a's SPA scaffold). Run 3a first, then 3b can start once 3a's scaffold exists.
- **Plan 09** (wave 4) is purely sequential — requires all prior plans complete.

## Feature Assignment Summary

| Feature | Priority | Wave | Plan# |
|---------|----------|------|-------|
| F0: Ticket Lifecycle | P0 | 2a | 02 |
| F1: Ticket History | P0 | 2a | 02 |
| F2: Open311 API | P0 | 2b | 03 |
| F3: RBAC | P0 | 2a | 02 |
| F4: Authentication | P0 | 2a | 02 |
| F5: People Management | P1 | 2c | 04 |
| F6: Department Admin | P1 | 2c | 04 |
| F7: Category Management | P1 | 2c | 04 |
| F8: Substatus System | P1 | 2c | 04 |
| F9: Action Types | P1 | 2c | 04 |
| F10: Media Upload | P1 | 2d | 05 |
| F11: Full-Text Search | P0 | 2b | 03 |
| F12: Bookmarks | P2 | 2d | 05 |
| F13: API Client Mgmt | P1 | 2d | 05 |
| F14: Contact Methods | P2 | 2c | 04 |
| F15: Location/Geo | P1 | 2d | 05 |
| F16: Digest Notifications | P1 | 2d | 05 |
| F17: Metrics/Reports | P2 | 2d | 05 |
| F18: Multi-Format Output | P0 | 2b | 03 |
| F19: Issue Types | P2 | 2c | 04 |
| F20: Response Templates | P2 | 2d | 05 |
| DB (all tables) | — | 1 | 01 |
