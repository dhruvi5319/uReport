---
wave: 1
domain: database
depends_on: []
features: [F0, F2, F3, F5, F6, F7, F8, F11, F12, F13, F14, F17, F18]
objective: "Establish the complete MySQL schema with DDL for all 16 tables (tickets, actions, people, contactMethods, departments, categories, categoryGroups, substatus, clients, media, ticket_geodata, templates, bookmarks, notification_log, geoclusters, sessions), implement Phinx migration infrastructure, and scaffold the typed repository base classes (TicketRepository, ActionRepository, PersonRepository, etc.) with PDO/DBAL. No business logic — pure data access layer with NFR-10 migration scripts."
estimated_plans: 2
---
wave: 2a
domain: backend
depends_on: [1]
features: [F0, F6, F10, F11, F16]
objective: "Implement the API framework kernel: JSON response envelope, HTTP status contract, SecurityHeadersMiddleware, ErrorHandlerMiddleware, OIDC authentication flow (F11 — /auth/login, /auth/callback, /auth/logout, /auth/me), JWT session validation middleware, RBAC enforcement middleware (F10 — role hierarchy + category permissions), and all ticket lifecycle endpoints (F0 — POST /api/tickets, GET/PUT /api/tickets/{id}, DELETE, assign, bulk-assign, close, reopen, responses, comments) with full action history recording (F6 — GET /api/tickets/{id}/history)."
estimated_plans: 2
---
wave: 2b
domain: backend
depends_on: [1]
features: [F2, F3, F13, F14, F17]
objective: "Implement admin entity API endpoints: departments (CRUD + deactivation warning), categories (CRUD with custom fields, SLA, permissions, auto-close), category groups, people and contact methods (CRUD, OIDC auto-provision, email uniqueness), substatuses (CRUD, isDefault auto-clear, primaryStatus validation), response templates (CRUD, variable warning, system template protection), and API client management (UUID key generation, bcrypt hash storage, key hint on GET, revoke/regenerate)."
estimated_plans: 2
---
wave: 2c
domain: backend
depends_on: [1]
features: [F4, F5, F7, F8, F9]
objective: "Implement data-intensive backend services: Solr-powered full-text search with faceted filters, pagination, and CSV export (F4); geospatial endpoints — geocoding, reverse geocoding, geo-cluster density via Solr spatial heatmap (F5); media upload with MIME validation, thumbnail generation, and attachment limits (F7); transactional email notifications via PHPMailer with deduplication, retry logic, and digest scheduling (F8); all eight reporting endpoints plus the public SLA metrics endpoint with 5-minute cache (F9)."
estimated_plans: 2
---
wave: 2d
domain: backend
depends_on: [1]
features: [F1, F12, F18]
objective: "Implement the frozen Open311 GeoReport v2 endpoint surface (/open311/services, /open311/requests, /open311/discovery — JSON+XML output, api_key validation via F14 client hash, GeoReport v2 field mapping preserved verbatim), bookmark/saved search CRUD scoped per authenticated user with 50-bookmark limit (F12), ticket merge flow with candidate search, preview, source closure, dual action records, and reporter notification (F18), and auto-generate the OpenAPI 3.1 spec served at /api/openapi.json and /api/docs."
estimated_plans: 2
---
wave: 3a
domain: frontend
depends_on: [2a]
features: [F15, F11, F10, F0]
objective: "Bootstrap the Next.js 15 / TypeScript / Radix UI / shadcn/ui SPA shell: project scaffold with strict TypeScript, OpenAPI-generated client types, OIDC login/callback/logout flow with HttpOnly cookie session, authenticated route guard, and the full staff-facing ticket management UI — list view, search bar, ticket detail page, create/edit form, assign modal, close/reopen actions, internal comment and response composer."
estimated_plans: 2
---
wave: 3b
domain: frontend
depends_on: [2b]
features: [F15, F2, F3, F13, F14, F17]
objective: "Implement all admin configuration screens: /admin/departments (CRUD + deactivation warning), /admin/categories (CRUD with custom field builder, SLA, permissions), /admin/people (CRUD, role assignment, contact methods), /admin/templates (CRUD with variable hints), /admin/clients (create, revoke, regenerate with one-time key display), /admin/substatuses (CRUD, default configuration). All screens mobile-responsive (375px–1920px) with WCAG 2.1 AA compliance."
estimated_plans: 2
---
wave: 3c
domain: frontend
depends_on: [2c]
features: [F15, F4, F5, F7]
objective: "Implement search, geospatial, and media UI: full-text search page with faceted filter panel, pagination, CSV export trigger, and URL-serialized filter state; map view with Leaflet integration showing geo-clustered ticket density with zoom-responsive cluster drill-down; individual ticket location display; public citizen submission portal (/submit) with map location picker, file upload, contact info, and category selection; /track/{id} status page; staff media attachment viewer with inline thumbnails and download links."
estimated_plans: 2
---
wave: 3d
domain: frontend
depends_on: [2a, 2c, 2d]
features: [F15, F8, F9, F12, F18]
objective: "Implement remaining staff-facing UI features: reporting and SLA metrics dashboards with chart visualizations and CSV export (F9); bookmark management — save current search state, list, restore, delete (F12); ticket merge flow — candidate search, side-by-side preview, confirmation modal, merged ticket badge in search results (F18); notification settings screen (F8). Complete the WCAG 2.1 AA axe-core compliance pass across all routes and Lighthouse performance optimization."
estimated_plans: 2
---
wave: 4
domain: integration
depends_on: [2a, 2b, 2c, 2d, 3a, 3b, 3c, 3d]
features: [F1, F4, F5, F8, F11, F15, F16]
objective: "End-to-end integration validation and CI/CD hardening: run the Open311 GeoReport v2 compliance test suite against /open311/ endpoints (NFR-09); validate Solr index sync with full re-index CLI and search regression tests against Solr test container (F4/F5); OIDC integration tests against a local Keycloak container (F11); Graylog structured logging verification (NFR-13); Playwright e2e tests covering all 10 critical user journeys (E2E-001 through E2E-010); GitHub Actions CI/CD pipeline with PHPUnit (≥70% coverage), Jest, Playwright, PHPStan level 8, TypeScript strict mode, axe-core WCAG audit, and license-checker (NFR-14, NFR-15, NFR-11)."
estimated_plans: 2
---

## WAVE SCHEDULE

| Wave | Domain | Plans | Features | Objective |
|------|--------|-------|----------|-----------|
| 1 | database | 2 | F0, F2, F3, F5, F6, F7, F8, F11, F12, F13, F14, F17, F18 | Complete MySQL schema DDL (16 tables), Phinx migration infrastructure, typed repository base classes |
| 2a | backend | 2 | F0, F6, F10, F11, F16 | API kernel: JSON envelope, middleware stack, OIDC auth, JWT sessions, RBAC enforcement, ticket CRUD + action history |
| 2b | backend | 2 | F2, F3, F13, F14, F17 | Admin entity APIs: departments, categories, people, substatuses, templates, API clients |
| 2c | backend | 2 | F4, F5, F7, F8, F9 | Data-intensive services: Solr search, geocoding, media uploads, email notifications, reporting |
| 2d | backend | 2 | F1, F12, F18 | Open311 endpoint (frozen), bookmarks, ticket merging, OpenAPI 3.1 spec generation |
| 3a | frontend | 2 | F15, F11, F10, F0 | SPA shell: Next.js scaffold, OIDC auth flow, authenticated routing, ticket management UI |
| 3b | frontend | 2 | F15, F2, F3, F13, F14, F17 | Admin screens: all /admin/* configuration pages, mobile-responsive + WCAG AA |
| 3c | frontend | 2 | F15, F4, F5, F7 | Search/map/media UI: faceted search, Leaflet geo-cluster map, citizen submission portal |
| 3d | frontend | 2 | F15, F8, F9, F12, F18 | Reporting dashboards, bookmarks, merge flow, notification settings, accessibility pass |
| 4 | integration | 2 | F1, F4, F5, F8, F11, F15, F16 | Open311 compliance suite, Solr/OIDC/Graylog integration tests, Playwright e2e, CI/CD pipeline |

**Total features:** 19 (F0–F18) | **Covered:** 19 | **Uncovered:** 0

### Feature → Wave Assignment (canonical)

| Feature | Priority | Primary Wave(s) | Notes |
|---------|----------|-----------------|-------|
| F0: Ticket Lifecycle | P0 | 1 (schema), 2a (API), 3a (UI) | Core entity — spans all layers |
| F1: Open311 API | P0 | 2d (API endpoints), 4 (compliance tests) | Frozen endpoint; compliance validated in Wave 4 |
| F2: Dept & Category Mgmt | P0 | 1 (schema), 2b (API), 3b (UI) | Admin routing taxonomy |
| F3: People & Contacts | P1 | 1 (schema), 2b (API), 3b (UI) | Staff + constituent directory |
| F4: Full-Text Search | P1 | 1 (schema), 2c (API), 3c (UI), 4 (Solr validation) | Solr-dependent |
| F5: Geospatial | P1 | 1 (schema), 2c (API), 3c (UI), 4 (Solr geo validation) | Solr spatial + geocoding |
| F6: Audit Trail | P0 | 1 (schema), 2a (API) | Immutable actions table |
| F7: Media Attachments | P1 | 1 (schema), 2c (API), 3c (UI) | File upload + thumbnails |
| F8: Notifications | P1 | 1 (schema), 2c (API), 3d (settings UI), 4 (SMTP integration) | Email via PHPMailer |
| F9: Reporting | P1 | 1 (schema), 2c (API), 3d (UI) | Eight report endpoints + metrics |
| F10: RBAC | P0 | 1 (schema), 2a (middleware), 3a (route guards) | Role + category permission matrix |
| F11: Authentication | P0 | 1 (schema), 2a (API), 3a (UI), 4 (Keycloak integration tests) | OIDC + JWT sessions |
| F12: Bookmarks | P2 | 1 (schema), 2d (API), 3d (UI) | Personal saved searches |
| F13: Templates | P2 | 1 (schema), 2b (API), 3b (UI) | Response templates + variables |
| F14: API Client Mgmt | P2 | 1 (schema), 2b (API), 3b (UI) | Open311 API key management |
| F15: SPA Frontend | P0 | 3a + 3b + 3c + 3d | Primary new deliverable |
| F16: JSON API Backend | P0 | 2a (framework), 2b + 2c + 2d (endpoints), 4 (OpenAPI coverage) | Second primary new deliverable |
| F17: Substatus Mgmt | P1 | 1 (schema), 2b (API), 3b (UI) | Fine-grained ticket states |
| F18: Ticket Merging | P2 | 1 (schema), 2d (API), 3d (UI) | Duplicate consolidation |

### Dependency Graph

```
Wave 1 (database)
  └─► Wave 2a (backend: kernel/auth/tickets)   ─┐
  └─► Wave 2b (backend: admin entities)          │
  └─► Wave 2c (backend: search/geo/media/notif)  ├─► Wave 3a (frontend: auth/tickets)   ─┐
  └─► Wave 2d (backend: open311/bookmarks/merge) │    Wave 3b (frontend: admin)           │
                                                  │    Wave 3c (frontend: search/map)      ├─► Wave 4 (integration)
                                                  └─►  Wave 3d (frontend: reports/misc)   ─┘
```

Waves 2a/2b/2c/2d run in parallel (no shared file conflicts between plans).
Waves 3a/3b/3c/3d run in parallel (each depends on its corresponding Wave 2 plan, no UI file conflicts).
Wave 4 depends on all Wave 2 and Wave 3 plans completing.
