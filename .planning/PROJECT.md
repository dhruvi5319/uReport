# uReport CRM Modernization

## What This Is

uReport is a civic CRM (Constituent Relationship Management) web application serving smaller municipalities, with a built-in Open311 / GeoReport v2 API endpoint for 311 service request management. The modernization project converts the existing PHP/MySQL/Solr/Apache stack into a production-grade React + Java Spring Boot + PostgreSQL architecture — preserving 100% of existing features, API contracts, and functionality while delivering a significantly upgraded, polished UI.

## Core Value

Every existing feature, screen, API contract, and Open311 endpoint must continue to work exactly as before — the modernization improves the technology stack and visual quality without removing or changing any capability.

## Requirements

### Validated

- ✓ Open311 / GeoReport v2 API (GET /services, GET /requests, POST /requests, GET /requests/:id) — existing
- ✓ Ticket/case lifecycle (create, assign, update, close, reopen) — existing
- ✓ Case submission public form — existing
- ✓ Case list with search and filtering — existing
- ✓ Case detail view with action/history timeline — existing
- ✓ Admin panels (categories, departments, people, locations, workflows) — existing
- ✓ LDAP and CAS authentication — existing
- ✓ Category and category group management — existing
- ✓ People management (staff, reporters, contacts) — existing
- ✓ Department management with default person assignment — existing
- ✓ Action/response logging with email notifications — existing
- ✓ Media/photo attachment upload — existing
- ✓ Full-text search (currently via Solr) — existing
- ✓ Bookmark / saved search — existing
- ✓ Metrics and reporting — existing
- ✓ Substatus management — existing
- ✓ Issue type management — existing
- ✓ Response template management — existing
- ✓ Client/API key management (Open311 clients) — existing
- ✓ Geo-clustering for map views — existing
- ✓ Context-switched feeds (JSON, XML, HTML by Accept header or format param) — existing

### Active

- [ ] React frontend replacing all PHP server-rendered views (Tailwind CSS + shadcn/ui, custom design tokens)
- [ ] Java Spring Boot REST API replacing all PHP controllers/models
- [ ] PostgreSQL database replacing MySQL (Flyway migration scripts)
- [ ] PostgreSQL full-text search (tsvector/tsquery + GIN indexes) replacing Solr
- [ ] JWT session management between React frontend and Spring backend
- [ ] Dashboard with stat cards, recent cases feed, map widget (Mapbox GL JS or Leaflet), status donut chart
- [ ] Advanced case list: sortable table, multi-column filter, status badge pills, bulk selection, skeleton loading
- [ ] Case detail: split-pane layout, activity timeline, inline status transition, photo lightbox
- [ ] Multi-step case submission form with Framer Motion transitions and map pin-drop
- [ ] Admin sidebar layout with inline editing, confirmation dialogs, toast notifications
- [ ] Live search with debounce, highlighted keyword matches, filter chips, empty state
- [ ] Persistent top navbar with breadcrumbs, collapsible admin sidebar, mobile hamburger drawer
- [ ] Branded auth screens (LDAP/CAS login) with loading spinner
- [ ] WCAG 2.1 AA accessibility + Section 508 compliance
- [ ] Responsive design: 375px, 768px, 1280px+ breakpoints
- [ ] Dark mode support with CSS variable design tokens
- [ ] Framer Motion animations (page transitions, stagger, micro-interactions, ≤300ms, prefers-reduced-motion)
- [ ] OpenAPI/Swagger documentation for all Spring Boot endpoints
- [ ] Spring Data JPA + MapStruct for data access and DTO mapping

### Out of Scope

- Changing any Open311 API endpoint paths, HTTP methods, or response formats — hard constraint, external clients must continue working
- Dropping any database tables or columns — hard constraint
- Removing any UI screens or admin features — hard constraint
- Changing the case/issue/people/location domain model — hard constraint
- New features not present in the original application — focus is modernization, not expansion

## Context

**Existing codebase:** PHP 8.5 application using a custom MVC framework (`Application/Controller`, `Application/Models`, `Application/Block`, `Application/Template`). 23 controllers, 36 models covering the full domain. Database schema in `crm/scripts/mysql.sql` with 18 tables: people, departments, tickets, categories, actions, ticketHistory, media, bookmarks, geoclusters, ticket_geodata, substatus, issueTypes, clients, contactMethods, categoryGroups, department_actions, department_categories, category_action_responses.

**Domain model:** Civic 311 service requests (tickets) are the core entity. A ticket belongs to a category (which belongs to a department), has a reporter person and assignee, tracks location (address + lat/lon), has a status (open/closed) with substatus (Resolved, Duplicate, Bogus), and has a full history of actions (open, assignment, response, comment, media upload, etc.).

**Open311 compliance:** The existing `Open311Controller.php` exposes GeoReport v2 endpoints. External clients (mobile apps, aggregators) call these endpoints — they must not change.

**Search:** Currently powered by Solr (`crm/scripts/solr/indexSearch.php`). Must be replaced with PostgreSQL full-text search with equivalent behavior (same search fields, relevance ranking).

**Auth:** LDAP and CAS (`crm/src/Domain/Auth/`). Staff log in via CAS or LDAP; public users submit cases anonymously or with email.

**Deployment:** Currently Docker-based (`docker-compose.yml`). New stack will use Docker Compose with separate containers for React (Nginx), Spring Boot, and PostgreSQL.

## Constraints

- **API Compatibility**: Open311 / GeoReport v2 endpoint paths and response formats must not change — external clients are already deployed
- **Data Integrity**: All MySQL tables and columns must exist in PostgreSQL; no data loss in migration
- **Feature Parity**: Every screen and feature in the PHP app must have an equivalent React screen
- **Accessibility**: WCAG 2.1 AA + Section 508 throughout — no exceptions
- **Animation**: All motion ≤300ms; prefers-reduced-motion must be respected
- **Design System**: Tailwind CSS with custom design tokens; shadcn/ui components fully customized; Inter + JetBrains Mono typography; 4px grid; 3-tier shadow system; dark mode
- **Tech Stack**: React (frontend), Java Spring Boot (backend), PostgreSQL (database), Flyway (migrations), Spring Security (auth), MapStruct (DTOs), Spring Data JPA (data access)
- **Search Replacement**: Solr → PostgreSQL tsvector/tsquery with GIN indexes; search behavior must be equivalent

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PostgreSQL full-text search instead of Solr | Eliminates external dependency; tsvector/tsquery is capable for single-city scale | — Pending |
| Flyway for schema migrations | Industry standard for Spring Boot; enables version-controlled schema evolution | — Pending |
| shadcn/ui + Tailwind | Component quality + design system flexibility; avoids building from scratch | — Pending |
| JWT for API auth | Stateless, standard for SPA-to-API communication; LDAP/CAS handles initial auth | — Pending |
| MapStruct for DTO mapping | Compile-time safety over runtime reflection (e.g., ModelMapper) | — Pending |
| Framer Motion for animations | Best-in-class React animation library; supports prefers-reduced-motion | — Pending |
| Mapbox GL JS / Leaflet for maps | Interactive map widget with pin-drop; Leaflet as fallback if Mapbox key unavailable | — Pending |
| Docker Compose for deployment | Continues existing Docker-based deployment pattern | — Pending |

---
*Last updated: 2026-07-06 after initialization*
