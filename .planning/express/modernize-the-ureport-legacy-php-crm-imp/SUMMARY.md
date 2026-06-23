---
slug: modernize-the-ureport-legacy-php-crm-imp
description: Modernize the uReport Legacy PHP CRM Implementation
scope: full
date: 2026-06-23
total_plans: 20
total_waves: 10
---

# Express Task: Modernize the uReport Legacy PHP CRM Implementation — Summary

## Execution Overview

**Scope:** Full (multi-plan wave execution)
**Plans:** 20 across 10 waves
**Date:** 2026-06-23

### Wave Breakdown

| Wave | Domain | Plans | Status |
|------|--------|-------|--------|
| 1 | database | 01, 02 | ✓ Complete |
| 2a | backend (auth/tickets) | 03, 04 | ✓ Complete |
| 2b | backend (admin entities) | 05, 06 | ✓ Complete |
| 2c | backend (search/geo/media/notif) | 07, 08 | ✓ Complete |
| 2d | backend (open311/bookmarks/merge) | 09, 10 | ✓ Complete |
| 3a | frontend (auth/tickets) | 11, 12 | ✓ Complete |
| 3b | frontend (admin screens) | 13, 14 | ✓ Complete |
| 3c | frontend (search/map/media) | 15, 16 | ✓ Complete |
| 3d | frontend (reports/bookmarks/merge) | 17, 18 | ✓ Complete |
| 4 | integration/CI-CD | 19, 20 | ✓ Complete |

### Per-Plan Details

**01 — Database Schema + Repository Layer:**
- Tasks: 2/2 — 16 Phinx MySQL migration files (InnoDB, utf8mb4) + PDO singleton + 10 typed array-returning repository classes
- Commits: 549c518, 12d9ea5
- Key files: db/phinx.php, db/migrations/ (16 files), crm/src/Repositories/AbstractRepository.php, 10 entity repos

**02 — Repository Pattern Layer (Domain Objects):**
- Tasks: 3/3 — PHP 8.5 readonly Domain value objects + typed PDO repository pattern layer with RepositoryInterface, AbstractPdoRepository, PdoConnection singleton
- Commits: 549c518, 200dbdb, fee984a
- Key files: 13 Domain/*.php files, RepositoryInterface.php, AbstractPdoRepository.php, 12 named repositories, 5 PHPUnit tests

**03 — HTTP API Kernel, Security Middleware, OIDC Auth Flow:**
- Tasks: 2/2 — JWT auth with HS256 session cookies via OIDC authorization code flow, onion middleware pipeline
- Commits: 9f10ae8, 7094e14
- Key files: JsonResponse.php, Kernel.php, SecurityHeadersMiddleware.php, ErrorHandlerMiddleware.php, AuthMiddleware.php, RbacMiddleware.php, AuthService.php, 4 Auth controllers

**04 — Ticket Lifecycle REST API:**
- Tasks: 2/2 — Full ticket lifecycle endpoints (F0, F6) with TicketService orchestration, HTTP kernel, SlaService with business-day computation
- Commits: 5f69634, 7d68639, c52361c
- Key files: Request.php, Response.php, Router.php, SlaService.php, TicketService.php, TicketController.php, TicketHistoryController.php

**05 — Admin Taxonomy API Controllers:**
- Tasks: 2/2 — Wave 2b admin REST API controllers for departments, categories, category groups, and substatuses with role-enforced CRUD
- Commits: ecf2b66, 257b75d
- Key files: ApiController.php, CategoryGroupRepository.php, DepartmentController.php, CategoryGroupController.php, CategoryController.php, SubstatusController.php

**06 — Admin Entity Controllers (People/Templates/Clients):**
- Tasks: 2/2 — Wave 2b REST controllers for People/Contacts (F3), Response Templates (F13), and API Clients (F14) with bcrypt key generation
- Commits: 2fbe380, ad871a5
- Key files: PersonController.php, ContactMethodController.php, TemplateController.php, ClientController.php, ContactMethodRepository.php (extended)

**07 — Solr Search + Geospatial Services:**
- Tasks: 2/2 — Solarium ^6.3 client wrapper (SearchService) + geocoding abstraction (AddressService, 4 providers) + Solr spatial heatmap cluster service + controllers
- Commits: 8c59950, 9f10ae8
- Key files: SearchService.php, AddressService.php, GeoClusterService.php, SearchController.php, GeoController.php

**08 — Media Upload, Notifications & Reporting:**
- Tasks: 3/3 — PHPMailer notification dispatch with 60-second dedup, finfo MIME-validated media upload with GD thumbnail generation, 9-endpoint reporting suite with 5-minute MetricsCache
- Commits: 99ea108, 3bbee66, 9e34821
- Key files: TicketMediaController.php, NotificationService.php, DigestCronCommand.php, SlaService.php, MetricsCache.php, ReportController.php

**09 — Open311 GeoReport v2 + Bookmarks API:**
- Tasks: 2/2 — Open311 GeoReport v2 endpoints with frozen field mapping and bcrypt api_key validation, plus user-scoped bookmark CRUD with 50-item limit
- Commits: 04a94ec, 5634e04
- Key files: ServicesController.php, RequestsController.php, DiscoveryController.php, BookmarkController.php

**10 — Ticket Merge Endpoint + OpenAPI 3.1 Spec:**
- Tasks: 2/2 — Ticket merge with transactional dual-action records and complete 52-path OpenAPI 3.1 spec with Swagger UI
- Commits: 21e9d9f, ecf2b66
- Key files: TicketService.php (mergeTickets), TicketController.php (merge/mergeCandidates), OpenApiController.php, crm/public/api/openapi.json (52 paths, 34 schemas), Swagger UI

**11 — Next.js 15 SPA Shell Bootstrap:**
- Tasks: 2/2 — Next.js 15 SPA scaffold with TypeScript strict mode, Tailwind CSS, shadcn/ui wiring, OIDC auth delegation to PHP backend via HttpOnly cookie, Edge middleware route protection
- Commits: 662e20e, a4e5433
- Key files: frontend/package.json, next.config.mjs, tsconfig.json, tailwind.config.ts, api-client.ts, auth.ts, middleware.ts, dashboard layout, TopNav.tsx, Sidebar.tsx

**12 — Staff Ticket UI:**
- Tasks: 2/2 — Full staff ticket management UI — list with SLA badges/bulk selection, detail 2-panel, multi-step create form, 13 Playwright E2E tests
- Commits: 1202ab2, 61a5f91
- Key files: tickets.ts (API client), /tickets page, /tickets/[id] page, /tickets/new page, SlaBadge, TicketListItem, BulkActionBar, ActionsPanel, ComposePanel, AuditHistoryList

**13 — Admin Configuration Screens (Departments/Categories/Substatuses):**
- Tasks: 2/2 — Admin shell layout with role guard, departments/categories/substatuses CRUD pages with multi-step category form and HAS_ACTIVE_TICKETS deactivation flow
- Commits: 1202ab2, 75fa9eb
- Key files: admin/layout.tsx, AdminNav.tsx, DepartmentForm.tsx, CategoryForm.tsx, CustomFieldBuilder.tsx, SubstatusForm.tsx, all admin/departments, admin/categories, admin/substatuses routes

**14 — Admin Screens for People, Templates, and API Clients:**
- Tasks: 2/2 — People/contact-methods CRUD + template variable hints + one-time API key modal with escape/click-outside lock
- Commits: e527579, 1a5725a
- Key files: PersonForm.tsx, ContactMethodsPanel.tsx, TemplateForm.tsx, ApiKeyModal.tsx, ClientForm.tsx, all admin/people, admin/templates, admin/clients routes

**15 — Faceted Search UI + Geo-clustered Map View:**
- Tasks: 2/2 — Solr-backed faceted search with URL-serialized filters, SLA badges, CSV export, and Leaflet geo-cluster map with zoom drill-down to individual ticket pins
- Commits: 902a73c, a4e5433, 61a5f91
- Key files: search.ts, geo.ts, useTicketSearch.ts, FilterPanel.tsx, TicketResultsList.tsx, TicketMap.tsx, ClusterLayer.tsx, TicketPinLayer.tsx, /map page

**16 — Citizen Portal — Submit & Track:**
- Tasks: 2/2 — 4-step mobile-first citizen submission wizard at /submit with Leaflet map location picker, media upload UI, and public ticket status tracking at /track/:id
- Commits: 781dcfa, e527579
- Key files: submit/page.tsx, submit/confirmation/page.tsx, track/[id]/page.tsx, all submit wizard step components, LeafletMapPicker.tsx, TicketStatusCard.tsx, PublicHistory.tsx

**17 — Reporting & Notification Settings UI:**
- Tasks: 2/2 — Wave 3d reporting UI with SLA dashboard, multi-report hub with CSV export, and SMTP notification settings admin page
- Commits: fd0395a, e527579
- Key files: reports.ts, notifications.ts, SlaKpiCards.tsx, SlaCategoryTable.tsx, SlaBreachList.tsx, StaffWorkloadChart.tsx, /reports/sla page, /reports hub, /admin/settings/notifications page

**18 — Wave 3d Frontend Features (Bookmarks/Merge/Accessibility):**
- Tasks: 2/2 — Bookmark save/restore/delete UI, ticket merge 3-step dialog, CDN Swagger docs page, and WCAG 2.1 AA skip link + axe-core audit infrastructure
- Commits: a8d225a, d33c63b
- Key files: BookmarksDropdown.tsx, BookmarkManageSheet.tsx, MergeDialog.tsx, SwaggerUiClient.tsx, /api/docs page, SkipLink.tsx, AxeAuditRunner.tsx

**19 — Wave 4 Integration Test Suite:**
- Tasks: 2/2 — PHPUnit integration test suite for Open311 GeoReport v2 compliance, OIDC auth flow, Solr index sync, and Graylog GELF structured logging
- Commits: d441652, bd77493
- Key files: phpunit.integration.xml, tests/bootstrap.php, Open311ComplianceTest.php, OidcIntegrationTest.php, SolrSearchIntegrationTest.php, GraylogLoggingTest.php

**20 — Wave 4 E2E Tests, CI/CD Pipeline, Production Docker Compose:**
- Tasks: 2/2 — 10 graceful-skip Playwright journey specs (E2E-001–E2E-010) + 7-job GitHub Actions CI pipeline + 4-service health-gated Docker Compose production stack
- Commits: ed9b7fe, ec666ea
- Key files: playwright.config.ts, 10 e2e/journeys/*.spec.ts files, .github/workflows/ci.yml, .github/workflows/e2e.yml, docker-compose.prod.yml, docker-compose.override.yml

### Aggregated Stats

- **Total tasks:** 41 across all 20 plans
- **Total commits:** 50+ individual atomic commits
- **Waves executed:** 10 waves (1, 2a, 2b, 2c, 2d, 3a, 3b, 3c, 3d, 4)
- **Key files created:** 200+
- **Features delivered:** 19 features (F0–F18), all covered

### Features Delivered

| Feature | Status | Waves |
|---------|--------|-------|
| F0: Ticket Lifecycle | ✓ | 1 (schema), 2a (API), 3a (UI) |
| F1: Open311 API | ✓ | 2d (endpoints), 4 (compliance tests) |
| F2: Dept & Category Mgmt | ✓ | 1, 2b, 3b |
| F3: People & Contacts | ✓ | 1, 2b, 3b |
| F4: Full-Text Search | ✓ | 1, 2c, 3c, 4 |
| F5: Geospatial | ✓ | 1, 2c, 3c, 4 |
| F6: Audit Trail | ✓ | 1, 2a |
| F7: Media Attachments | ✓ | 1, 2c, 3c |
| F8: Notifications | ✓ | 1, 2c, 3d, 4 |
| F9: Reporting | ✓ | 1, 2c, 3d |
| F10: RBAC | ✓ | 1, 2a, 3a |
| F11: Authentication | ✓ | 1, 2a, 3a, 4 |
| F12: Bookmarks | ✓ | 1, 2d, 3d |
| F13: Templates | ✓ | 1, 2b, 3b |
| F14: API Client Mgmt | ✓ | 1, 2b, 3b |
| F15: SPA Frontend | ✓ | 3a + 3b + 3c + 3d |
| F16: JSON API Backend | ✓ | 2a–2d, 4 |
| F17: Substatus Mgmt | ✓ | 1, 2b, 3b |
| F18: Ticket Merging | ✓ | 1, 2d, 3d |

### Deviations

Deviations were handled via the standard deviation rules (Rule 1: bug auto-fix, Rule 2: missing critical auto-fix, Rule 3: blocking auto-fix):

1. **Plans 01/02 concurrent execution conflict** — Plan 01 and 02 ran in the same wave and overwrote each other's repository files. Fixed by reconciling both implementations into a single compatible version that satisfies both plans' contracts.
2. **PdoConnection incompatibility** — Plans 01 and 02 each specified different PdoConnection APIs. Resolved by implementing both `get()/set()` and `getInstance()` interfaces.
3. **Missing ApiController base** — Wave 2a did not produce a controller base class; created `ApiController.php` in Wave 2b (Plan 05).
4. **SlaService signature conflicts** — Multiple plans specified different SlaService signatures. Resolved with union type `Ticket|array` for backward compat.
5. **Missing UI primitives** — Frontend plans (12–18) needed shadcn/ui components not yet installed; created from Radix UI primitives inline.
6. **Next.js 15 Suspense requirement** — `useSearchParams()` must be wrapped in Suspense; auto-fixed in multiple frontend plans.
7. **Various missing repository methods** — `countByTicketId`, `softDelete`, `hasSentRecently`, `create`, `findByApiKey` etc. added as needed by service-layer consumers.
