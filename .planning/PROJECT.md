# uReport CRM — Modernization

## What This Is

uReport is a legacy PHP 8.5 + Apache + MySQL + Apache Solr constituent relationship management (CRM) web application built for small-to-mid-size municipalities. It implements the Open311 GeoReport v2 API standard so citizens and third-party apps can submit, track, and query public service requests (e.g., potholes, broken streetlights, sanitation issues). The goal of this modernization project is to re-architect the backend as a clean RESTful API (or GraphQL) with a modern JavaScript frontend, replacing the tightly coupled PHP MVC/template system with a decoupled, maintainable, and testable architecture while preserving 100% functional parity and the Open311 spec compliance.

## Core Value

Every staff member can create, assign, update, and close constituent service tickets through a fast, accessible interface — and every citizen can submit and track their requests via Open311-compliant endpoints.

## Requirements

### Validated

- ✓ Ticket lifecycle management (open, assign, update, close, reopen) — existing
- ✓ Open311 GeoReport v2 API (services list, service info, POST/GET service requests) — existing
- ✓ Multi-department routing with category-based auto-assignment — existing
- ✓ Geospatial ticket location (lat/long, address string, address service integration) — existing
- ✓ Ticket history / audit trail with action types (open, assignment, closed, response, comment, upload) — existing
- ✓ Ticket merging / duplicate detection — existing
- ✓ SLA tracking (slaDays per category, % time elapsed, expected close date) — existing
- ✓ Media attachments (images and files) on tickets — existing
- ✓ Full-text search via Apache Solr (search, filters, map view, CSV/print export) — existing
- ✓ Geo-clustering for map density visualization — existing
- ✓ People/contacts management (staff + constituents, emails, phones, addresses) — existing
- ✓ Department management with default assignees — existing
- ✓ Category management (groups, SLA, display/posting permissions, custom fields, auto-close rules) — existing
- ✓ Substatus management (fine-grained closed/open sub-states with defaults) — existing
- ✓ Response templates for email notifications — existing
- ✓ Notification system (email digests, per-ticket notification to involved parties) — existing
- ✓ Bookmark / saved search management per user — existing
- ✓ Role-based access control (staff, public, anonymous posting/display permissions) — existing
- ✓ OIDC / OpenID Connect authentication support — existing
- ✓ Metrics endpoint (on-time SLA percentage per category) — existing
- ✓ Reporting (activity, assignments, categories, staff, SLA, volume, open/closed ticket counts) — existing
- ✓ Multi-format output (HTML, JSON, XML, CSV) from same controller endpoints — existing
- ✓ Multi-client API key management (Open311 clients with contact info) — existing
- ✓ Internationalization / gettext translation support — existing
- ✓ Graylog centralized logging integration — existing
- ✓ Docker-based development environment — existing
- ✓ Ansible deployment support — existing

### Active

- [ ] Modern RESTful JSON API backend (replaces PHP controller + template rendering for data)
- [ ] Modern JavaScript SPA frontend (React or Next.js) consuming the new API
- [ ] OpenAPI / Swagger documentation for all endpoints
- [ ] Database migration strategy (MySQL schema preserved, ORM or query builder layer added)
- [ ] Preserve full Open311 GeoReport v2 compliance on modernized stack
- [ ] Authentication modernization (OIDC integration with JWT/session on new stack)
- [ ] Comprehensive automated test suite (unit, integration, e2e)
- [ ] CI/CD pipeline improvements (GitHub Actions, containerized tests)
- [ ] Improved developer experience (TypeScript, linting, hot reload)
- [ ] Accessibility improvements (WCAG 2.1 AA compliance on new frontend)
- [ ] Mobile-responsive frontend (current desktop-only CSS replaced)

### Out of Scope

- Real-time push notifications (WebSockets) — phase 2, not core to modernization MVP
- Mobile native apps — web-first modernization; native apps are separate projects
- Replacing MySQL with a different database engine — schema is stable; changing engines adds risk without benefit for MVP
- AI-powered ticket classification — future enhancement, not part of this modernization

## Context

**Existing codebase architecture:**
- PHP 8.5+ with PSR-4 autoloading via Composer
- Custom MVC framework ("blossom-lib") — no Laravel/Symfony; homegrown Controller, Template, Block, ActiveRecord pattern
- MySQL 5.7+ as the primary datastore (15+ tables: tickets, people, categories, departments, actions, media, geoclusters, etc.)
- Apache Solr 7.4+ for full-text search and geospatial clustering
- PHP `.inc` template files for HTML, JSON, XML, CSV output — all output handled server-side
- OIDC authentication via `facile-it/php-openid-client`; role stored on `people.role` column
- Multi-format output via `$_GET['format']` parameter switching the template engine
- Open311 GeoReport v2 endpoint at `/open311/` with services, requests, discovery
- Configuration via `SITE_HOME/site_config.php` — constants define everything (BASE_URL, SMTP, Solr, DB)
- Internationalization via GNU gettext (`.po`/`.mo` files, `LOCALE` constant)
- Docker Compose dev stack: PHP/Apache app, MySQL, Solr containers

**Legacy pain points being addressed:**
- No separation of concerns: controllers render both business logic and HTML
- No frontend build pipeline; vanilla CSS/JS, legacy jQuery patterns
- No type-safe API contract; consumers rely on HTML scraping or fragile JSON template output
- PHPStan at level 5 — not fully strict
- No CI that enforces code quality gates
- Mobile experience is an afterthought; layouts are desktop-first CSS files

**Target modernization stack (to be finalized in spec docs):**
- Backend: PHP 8.5 API layer (or Node.js/TypeScript) exposing JSON REST endpoints; Open311 endpoint preserved
- Frontend: React 18+ / Next.js 15+ with TypeScript
- Auth: OIDC with JWT, preserved role model
- Search: Solr integration preserved, abstracted behind service layer
- DB: MySQL preserved, PDO layer refactored to a clean repository pattern
- CI/CD: GitHub Actions with PHPUnit / Jest / Playwright

## Constraints

- **Tech stack**: PHP 8.5 is already the minimum — cannot downgrade
- **Open311 compliance**: The GeoReport v2 API must remain 100% spec-compliant post-modernization — external consumers depend on it
- **MySQL schema**: Existing schema must be preserved (or migration scripts provided) to support in-place upgrades for existing deployments
- **AGPL-3 license**: All new code must remain AGPL-3 compatible
- **Deployment targets**: Must continue to support Apache + Linux installs and Docker Compose; Ansible deployment is a secondary concern

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modernize in-place vs rewrite | Existing codebase has solid domain logic in models; a full rewrite risks regression; incremental modernization de-risks | — Pending |
| Frontend framework choice (React vs Vue vs Next.js) | To be finalized in TechArch spec — Next.js 15 preferred for SSR + API routes | — Pending |
| API layer: PHP thin controllers vs separate Node/TS service | Keeping PHP reduces operational complexity; a separate TS service improves type safety for the frontend contract | — Pending |
| ORM vs raw PDO | Current PDO-based ActiveRecord is simple but fragile; a thin query builder (e.g., Doctrine DBAL) would improve safety without full ORM overhead | — Pending |

---
*Last updated: 2026-06-23 after project initialization (spec-express mode)*
