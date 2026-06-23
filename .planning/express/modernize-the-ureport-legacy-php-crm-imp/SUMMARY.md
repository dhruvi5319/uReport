---
slug: modernize-the-ureport-legacy-php-crm-imp
description: Modernize the uReport Legacy PHP CRM Implementation
scope: full
date: 2026-06-23
total_plans: 20
total_waves: 4
---

# Express Task: Modernize the uReport Legacy PHP CRM — Summary

## Execution Overview

**Scope:** Full (multi-plan wave execution)
**Plans:** 20 across 4 waves
**Date:** 2026-06-23
**Total commits:** ~62

### Wave Breakdown

| Wave | Plans  | Domain     | Status      |
|------|--------|------------|-------------|
| 1    | 01-02  | database   | ✓ Complete  |
| 2    | 03-10  | backend    | ✓ Complete  |
| 3    | 11-18  | frontend   | ✓ Complete  |
| 4    | 19-20  | integration| ✓ Complete  |

### Per-Plan Details

**01:** Database Schema + Repository Layer — MySQL DDL for 16 tables (tickets, actions, people, contactMethods, departments, categories, categoryGroups, substatus, clients, media, ticket_geodata, templates, bookmarks, notification_log, geoclusters, sessions), Phinx migration infrastructure
- Tasks: 2/2 | Files: migrations/, crm/src/Repositories/BaseRepository.php

**02:** Repository Pattern Layer — Typed repository classes (TicketRepository, ActionRepository, PersonRepository, DepartmentRepository, CategoryRepository, MediaRepository, BookmarkRepository, TemplateRepository, ClientRepository, SubstatusRepository) with PDO/DBAL query builders
- Tasks: 2/2 | Files: crm/src/Repositories/*.php

**03:** HTTP API Kernel, Security Middleware, OIDC Auth Flow — JSON response envelope, SecurityHeadersMiddleware, ErrorHandlerMiddleware, OIDC /auth/login, /auth/callback, /auth/logout, /auth/me, JWT session validation middleware
- Tasks: 2/2 | Files: crm/src/Http/*.php, crm/src/Middleware/*.php, crm/src/Controllers/Auth/*.php

**04:** Ticket Lifecycle REST API — POST/GET/PUT/DELETE /api/tickets, assign, bulk-assign, close, reopen, responses, comments, RBAC enforcement middleware, full action history recording (GET /api/tickets/{id}/history)
- Tasks: 2/2 | Files: crm/src/Controllers/Api/TicketController.php, crm/src/Services/TicketService.php

**05:** Admin Taxonomy API Controllers — Department CRUD + deactivation warning, Category CRUD with custom fields/SLA/permissions/auto-close, CategoryGroup CRUD, Substatus CRUD with isDefault auto-clear
- Tasks: 2/2 | Files: crm/src/Controllers/Api/{DepartmentController,CategoryController,CategoryGroupController,SubstatusController}.php

**06:** Admin Entity Controllers — Person/ContactMethod CRUD with OIDC auto-provision, email uniqueness; Template CRUD with variable warning + system protection; API Client management (UUID key gen, bcrypt hash, revoke/regenerate)
- Tasks: 2/2 | Files: crm/src/Controllers/Api/{PersonController,ContactMethodController,TemplateController,ClientController}.php

**07:** Solr Search + Geospatial Services — Full-text search with faceted filters/pagination/CSV export, geocoding, reverse geocoding, geo-cluster density via Solr spatial heatmap
- Tasks: 2/2 | Files: crm/src/Services/{SearchService,GeoService}.php, crm/src/Controllers/Api/{SearchController,GeoController}.php

**08:** Media Upload, Notifications & Reporting — MIME validation, thumbnail generation, attachment limits; PHPMailer transactional email with deduplication/retry/digest; eight reporting endpoints + public SLA metrics with 5-min cache
- Tasks: 2/2 | Files: crm/src/Services/{MediaService,NotificationService,SlaService}.php, crm/src/Controllers/Api/ReportController.php

**09:** Open311 GeoReport v2 + Bookmarks API — /open311/services, /open311/requests, /open311/discovery (JSON+XML), api_key bcrypt validation; Bookmark CRUD with 50-limit per user
- Tasks: 2/2 | Files: crm/src/Controllers/Open311/*.php, crm/src/Controllers/Api/BookmarkController.php

**10:** Ticket Merge + OpenAPI 3.1 Spec — Transactional merge with dual action records, reporter notification; complete 52-path OpenAPI 3.1 spec at /api/openapi.json, Swagger UI at /api/docs
- Tasks: 2/2 | Files: crm/public/api/openapi.json, crm/src/Controllers/Api/OpenApiController.php

**11:** Next.js 15 SPA Shell + OIDC Auth — Project scaffold (TypeScript strict, Tailwind, shadcn/ui), Edge middleware protecting staff routes, OIDC login/callback/logout pages, staff dashboard shell with TopNav + Sidebar
- Tasks: 2/2 | Files: frontend/src/middleware.ts, frontend/src/app/{login,auth,dashboard}/*, frontend/src/components/nav/*.tsx

**12:** Staff Ticket Management UI — Ticket list (SLA badges, status filters, bulk selection), ticket detail page (compose panel, actions panel, audit history), 3-step create wizard (category → location → details)
- Tasks: 2/2 | Files: frontend/src/app/(staff)/tickets/*, frontend/src/components/tickets/*.tsx, frontend/src/lib/api/tickets.ts

**13:** Admin Screens — Departments, Categories, Substatuses — /admin/departments (deactivation modal), /admin/categories (3-step form, CustomFieldBuilder), /admin/substatuses (grouped by primaryStatus)
- Tasks: 2/2 | Files: frontend/src/app/admin/{departments,categories,substatuses}/*, frontend/src/components/admin/{DepartmentForm,CategoryForm,CustomFieldBuilder,SubstatusForm}.tsx

**14:** Admin Screens — People, Templates, API Clients — /admin/people (PersonForm, ContactMethodsPanel), /admin/templates (variable insertion, system protection), /admin/clients (one-time key ApiKeyModal)
- Tasks: 2/2 | Files: frontend/src/app/admin/{people,templates,clients}/*, frontend/src/components/admin/{PersonForm,TemplateForm,ClientForm,ApiKeyModal}.tsx

**15:** Search + Geo-Cluster Map UI — Faceted search page with URL-serialized filter state, Leaflet map with zoom-responsive geo-cluster drill-down and individual ticket pins, CSV export
- Tasks: 2/2 | Files: frontend/src/app/(staff)/{tickets/components,map}/*, frontend/src/lib/api/{search,geo}.ts, frontend/src/types/{search,geo}.ts

**16:** Citizen Submission Portal + Status Tracker — Public /submit 4-step wizard (category → Leaflet pin → details → contact), /submit/confirmation, /track/{id} status page (no auth)
- Tasks: 2/2 | Files: frontend/src/app/submit/*, frontend/src/app/track/[id]/page.tsx, frontend/src/components/{submit,track}/*.tsx

**17:** Reports/SLA Dashboards + Notification Settings — SLA KPI cards, category table, breach list, staff workload chart, activity/assignment/SLA/volume report pages, CSV export, /admin/settings/notifications
- Tasks: 2/2 | Files: frontend/src/app/{reports,admin/settings/notifications}/*, frontend/src/components/reports/*.tsx

**18:** Bookmarks, Merge Dialog, API Docs, WCAG A11y Pass — BookmarksDropdown + BookmarkManageSheet, MergeDialog (3-step), Swagger UI /api/docs, SkipLink, axe-core AxeAuditRunner, WCAG 2.1 AA compliance pass
- Tasks: 2/2 | Files: frontend/src/components/{tickets/{BookmarksDropdown,MergeDialog},bookmarks/BookmarkManageSheet,a11y/{SkipLink,AxeAuditRunner}}.tsx

**19:** PHPUnit Integration Test Suites — Open311 GeoReport v2 compliance (16 test methods, all 6 endpoints), OIDC integration tests, Solr async-poll sync tests, Graylog UDP GELF capture; phpunit.integration.xml
- Tasks: 2/2 | Files: tests/Integration/{Open311ComplianceTest,OidcIntegrationTest,SolrSearchIntegrationTest,GraylogLoggingTest}.php, tests/bootstrap.php, phpunit.integration.xml

**20:** Playwright E2E Journeys + GitHub Actions CI/CD — 10 journey specs (E2E-001 through E2E-010), 7-job GitHub Actions CI pipeline (PHPStan L8, PHPUnit ≥70%, Jest, build, license-check, docker-build), production Docker Compose with health gates
- Tasks: 2/2 | Files: e2e/journeys/*.spec.ts, .github/workflows/{ci,e2e}.yml, docker-compose.prod.yml

### Aggregated Stats

- **Total tasks:** 40 (2 per plan × 20 plans)
- **Total commits:** ~62
- **Total waves:** 4 (Wave 1: database, Wave 2: backend, Wave 3: frontend, Wave 4: integration)
- **Features delivered:** F0–F18 (all 19 features)
- **Key files created:** 16-table MySQL schema + Phinx migrations, 10 typed repositories, PHP HTTP kernel + middleware stack, OIDC auth controllers, Ticket/Department/Category/People/Template/Client/Bookmark/Open311 API controllers, Solr SearchService, GeoService, MediaService, NotificationService, SlaService, ReportController, 52-path OpenAPI 3.1 spec, Next.js 15 SPA with 40+ frontend components, 16+ Playwright e2e specs, GitHub Actions CI/CD pipeline, production Docker Compose

### Deviations

- **Plan 11:** Missing `next-env.d.ts` auto-created (Rule 3)
- **Plan 13:** Radix AlertDialog used for deactivation confirmation (as designed)
- **Plan 14:** Badge `success` variant didn't exist — used className override for green color (Rule 1)
- **Plan 16:** `playwright.config.ts` created (prerequisite for e2e test files)
- **Plan 17:** `sonner` toast library added (Rule 3 — missing critical dep)
- **Plan 19:** Integration test root placed at `tests/` not inside `crm/` (matches plan spec); PHP binary not in CI env — syntax verification deferred to verify phase
- All deviations self-resolved per deviation rules with no architectural changes required
