# uReport Modernization

## What This Is

uReport is a CRM web application for municipalities that provides constituent issue tracking (tickets/cases), an Open311 (GeoReport v2) compliant REST API, people/contact management, department and category administration, media/attachment handling, full-text search, and digest email notifications. It is currently built on PHP 8.x / Apache / MySQL / Solr and is being modernized to a React (frontend) + Java (Spring Boot backend) + PostgreSQL architecture, preserving 100% of existing features, data models, API contracts, and business logic.

## Core Value

Every existing feature, API endpoint, data relationship, and permission rule from the PHP/MySQL/Solr stack must be fully reproduced in the new stack — no functionality regression is acceptable.

## Requirements

### Validated

- ✓ Ticket/case lifecycle (open, assign, update, close, duplicate, reopen) — existing
- ✓ Open311 GeoReport v2 REST API (discovery, services, requests, CRUD) — existing
- ✓ People/contact management (persons, emails, phones, addresses, organizations) — existing
- ✓ Department and category/category-group administration — existing
- ✓ Role-based access control (staff, public, anonymous permission levels) — existing
- ✓ Ticket history and action log with template-driven descriptions — existing
- ✓ Substatus system (fine-grained ticket lifecycle states) — existing
- ✓ Media/image/attachment upload and thumbnail caching — existing
- ✓ Full-text search via Solr (ticket indexing, geo-cluster generation) — existing
- ✓ Response templates and per-category action responses — existing
- ✓ API client management with API key authentication — existing
- ✓ Bookmarks (staff saved ticket filters) — existing
- ✓ Digest email notifications (cron-driven) — existing
- ✓ Metrics/reporting dashboard — existing
- ✓ Custom fields per category — existing
- ✓ SLA days and auto-close rules per category — existing
- ✓ Location/address management and geo-cluster analysis — existing
- ✓ Contact method tracking (email, phone, web form, other) — existing
- ✓ Multi-format output feeds (XML, JSON, CSV, HTML, TXT) — existing
- ✓ External identity / OAuth callback support — existing

### Active

- [ ] Migrate all validated features to React + Java + PostgreSQL with zero feature loss
- [ ] Replace Solr full-text search with PostgreSQL full-text search (or Elasticsearch)
- [ ] Replace Apache/PHP routing with Spring Boot REST controllers
- [ ] Replace MySQL schema with equivalent PostgreSQL DDL (all tables, FKs, constraints)
- [ ] Replace PHP template rendering with React SPA consuming REST API
- [ ] Preserve all Open311 GeoReport v2 API contracts exactly
- [ ] Replace PHP session auth with JWT / Spring Security
- [ ] Replace PHP cron scripts with Spring Scheduler or equivalent
- [ ] Containerize with Docker (maintain existing docker-compose interface)
- [ ] Delete legacy PHP/Solr/Apache directories from repo after all features mapped in spec docs

### Out of Scope

- New features not present in current codebase — this is a 1:1 migration, not a feature addition
- Mobile native apps — web-first, not in current scope
- Multi-tenancy beyond what exists today — current single-municipality model is preserved

## Context

**Legacy stack:**
- PHP 8.x MVC with Laminas/Zend-style controllers in `crm/src/Application/Controllers/`
- Domain models in `crm/src/Application/Models/` and `crm/src/Domain/`
- MySQL schema defined in `crm/scripts/mysql.sql` (tables: departments, people, peopleEmails, peoplePhones, peopleAddresses, contactMethods, clients, substatus, actions, categoryGroups, categories, category_action_responses, tickets, ticketHistory, media, locations, etc.)
- Solr 7.4 for full-text ticket search and geo-clustering (`crm/scripts/solr/`)
- Apache 2.4 web server with mod_rewrite routing
- Template engine via `crm/templates/` (html, json, xml, csv, txt blocks)
- PHPUnit test suite in `crm/src/Test/`
- Composer dependency management

**Target stack:**
- Java 21 + Spring Boot 3.x REST API backend
- React 18 + TypeScript SPA frontend
- PostgreSQL 16 database
- Docker / docker-compose deployment
- JWT-based authentication (replacing PHP session)
- PostgreSQL FTS or Elasticsearch replacing Solr

**Key API contracts to preserve:**
- Open311 GeoReport v2: GET /services, GET/POST /requests, GET /requests/{id}, GET discovery
- Multi-format responses: JSON, XML (existing consumers depend on these)
- API key authentication for external clients

**Codebase to delete post-migration:**
- `crm/` directory (PHP application)
- `ansible/` directory (PHP deployment scripts)
- `infra/` directory (PHP-specific infrastructure config)
- Solr configuration files

## Constraints

- **Compatibility**: Open311 GeoReport v2 API response shapes must be byte-compatible — external integrations rely on them
- **Data**: All MySQL data relationships must map 1:1 to PostgreSQL schema
- **Auth**: Existing role names and permission levels (staff/public/anonymous) must be preserved
- **Search**: Ticket search must produce equivalent results to current Solr indexing
- **Deployment**: Docker compose interface should remain familiar for existing operators

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Java + PostgreSQL | User-specified target stack | — Pending |
| Delete legacy dirs after spec mapping | Avoid confusion between old and new code | — Pending |
| Preserve Open311 API contracts exactly | External municipality systems integrate via Open311 | — Pending |
| Replace Solr with PostgreSQL FTS | Eliminates Solr dependency, reduces ops complexity | — Pending |

---
*Last updated: 2026-06-24 after initialization*
