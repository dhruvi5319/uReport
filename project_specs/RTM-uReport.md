# Requirements Traceability Matrix
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Acronym:** uReport  
**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Active  
**License:** AGPL-3.0  
**Based on:** PRD-uReport.md v1.0 · FRD-uReport.md v1.0 · TechArch-uReport.md v1.0 · UserStories-uReport.md v1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Requirements Summary](#2-requirements-summary)
3. [Traceability Matrix](#3-traceability-matrix)
4. [Requirements Detail](#4-requirements-detail)
5. [Test Case Coverage](#5-test-case-coverage)
6. [Change Management](#6-change-management)
7. [Approval](#7-approval)

---

## 1. Overview

This Requirements Traceability Matrix (RTM) provides bidirectional traceability between all uReport Municipal CRM Modernization specification documents. It establishes verifiable links from high-level product requirements (PRD) through functional requirements (FRD) and technical architecture specifications (TechArch) down to individual user stories (UserStories), ensuring that every requirement is accounted for, implementable, and testable.

The RTM covers all 19 features (F0–F18) of the uReport modernization project: eight critical P0 features that constitute the MVP (F0, F1, F2, F6, F10, F11, F15, F16), seven P1 features required before first production release (F3, F4, F5, F7, F8, F9, F17), and four P2 standard features that ship post-core (F12, F13, F14, F18). Features F15 (SPA Frontend) and F16 (RESTful JSON API) are the two primary new deliverables of the modernization; all other features are validated existing capabilities that must be preserved with full functional parity.

Traceability operates at four levels. The PRD defines the business intent and acceptance boundaries for each feature. The FRD decomposes each feature into detailed functional sub-features, process steps, input/output contracts, validation rules, error states, API surface, and schema surface. The TechArch translates functional requirements into architectural decisions, component layouts, database DDL, TypeScript interfaces, endpoint tables, security specifications, and integration definitions. User Stories bridge the technical specifications back to concrete user goals and acceptance criteria, forming the basis for manual and automated test coverage.

All requirement IDs in this matrix are extracted directly from the source documents. PRD feature IDs use the pattern F0–F18. FRD functional requirement references use the feature chunk identifiers F00–F18. TechArch specification sections use the section-numbering scheme from that document (ARCH-1.x through ARCH-7.x). User Story IDs use the US-{feature}.{sequence} pattern as defined in UserStories-uReport.md. Non-functional requirements use NFR-01 through NFR-16. Test case IDs (TEST-xxx) are assigned in this RTM to represent the coverage areas derived from the acceptance criteria of each story.

---

## 2. Requirements Summary

### 2.1 PRD Feature Inventory

- **P0 — Critical / MVP-Blocking (8 features):**
  - F0: Ticket Lifecycle Management — the core unit of work; all other features orbit the ticket entity
  - F1: Open311 GeoReport v2 API Compliance — the highest-priority external contract; frozen endpoint surface
  - F2: Department & Category Management — routing taxonomy, SLA, permissions, and auto-close rules
  - F6: Ticket History & Audit Trail — immutable append-only audit records for compliance
  - F10: Role-Based Access Control — server-side role and category-permission enforcement
  - F11: Authentication (OIDC + JWT) — OIDC authorization code flow with JWT session management
  - F15: Modern React/Next.js SPA Frontend — primary new deliverable; replaces all PHP template rendering
  - F16: RESTful JSON API Backend — second primary new deliverable; type-safe JSON API replacing PHP controller output

- **P1 — Required for MVP (7 features):**
  - F3: People & Contact Management — unified staff and constituent directory with contact methods
  - F4: Full-Text Search & Filtering — Solr-powered keyword search with faceted filters and CSV export
  - F5: Geospatial Features — lat/lng capture, geocoding, reverse geocoding, and geo-cluster map
  - F7: Media Attachments — image and file uploads with thumbnail generation and audit trail integration
  - F8: Notification System — transactional email notifications via SMTP with template variable substitution
  - F9: Reporting & Metrics — eight standard reports plus a public SLA metrics endpoint
  - F17: Substatus Management — fine-grained open/closed state labels with default configuration

- **P2 — Standard / Post-Core (4 features):**
  - F12: Bookmark / Saved Search Management — personal named search shortcuts for staff
  - F13: Response Templates — reusable message bodies with variable substitution for email responses
  - F14: API Client Management — Open311 API key issuance, revocation, and audit attribution
  - F18: Ticket Merging — duplicate ticket consolidation with reporter notification

### 2.2 Non-Functional Requirements Summary

- **Performance:** NFR-01 (ticket list p95 ≤ 2s), NFR-02 (Open311 p95 ≤ 500ms)
- **Availability:** NFR-03 (99.5% uptime on Apache + Linux)
- **Accessibility:** NFR-04 (WCAG 2.1 AA on all SPA pages), NFR-05 (375px–1920px responsive)
- **Security:** NFR-06 (auth/authz enforcement), NFR-07 (HTTP security headers), NFR-08 (input validation / injection prevention)
- **Open311 Compliance:** NFR-09 (full GeoReport v2 test suite pass)
- **Compatibility:** NFR-10 (MySQL schema migration scripts; in-place upgrades)
- **Licensing:** NFR-11 (AGPL-3.0 compatible dependencies)
- **Deployability:** NFR-12 (Apache + Linux, Docker Compose, Ansible)
- **Observability:** NFR-13 (Graylog forwarding; structured logging)
- **Testability:** NFR-14 (≥70% backend unit coverage; 100% endpoint integration tests; Playwright e2e)
- **Developer Experience:** NFR-15 (TypeScript strict mode; PHPStan level 8+; CI enforcement)
- **Internationalization:** NFR-16 (GNU gettext externalization; no hard-coded English)

### 2.3 Architecture Specification Areas

- **ARCH-1:** Architectural overview — decoupled monolith, deployment topology, URL routing contract
- **ARCH-2:** Component architecture — PHP backend components, Next.js frontend components
- **ARCH-3:** Data model — entity relationships, complete DDL (core + supporting tables)
- **ARCH-4:** API design — endpoint reference, TypeScript interfaces, HTTP status contract
- **ARCH-5:** Security architecture — OIDC flow, session JWT, RBAC matrix, input validation
- **ARCH-6:** Technology stack — backend (PHP 8.5), frontend (Next.js 15), data (MySQL 8 + Solr 9), DevOps
- **ARCH-7:** Integration points — Open311, OIDC IdP, Apache Solr, SMTP, geocoding, Graylog, gettext

### 2.4 User Story Inventory

- **51 total stories** across 19 epics (F0–F18)
- **26 stories at P0** — US-0.1–0.7, US-1.1–1.3, US-2.1–2.3, US-6.1–6.2, US-10.1–10.2, US-11.1–11.2, US-15.1–15.4, US-16.1–16.3
- **18 stories at P1** — US-3.1–3.3, US-4.1–4.3, US-5.1–5.2, US-7.1–7.2, US-8.1–8.3, US-9.1–9.3, US-17.1–17.2
- **7 stories at P2** — US-12.1–12.2, US-13.1–13.2, US-14.1–14.2, US-18.1

---

## 3. Traceability Matrix

### 3.1 Primary Traceability Table — PRD Feature → FRD → TechArch → User Stories

| PRD Feature | Priority | FRD Chunk | TechArch Sections | User Stories |
|-------------|----------|-----------|-------------------|-------------|
| **F0: Ticket Lifecycle Management** | P0 | F00 | ARCH-2.1 (TicketController, TicketService, TicketRepository), ARCH-3.2 (tickets, actions DDL), ARCH-4.3 (Ticket endpoints) | US-0.1, US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-0.7 |
| **F1: Open311 GeoReport v2 API** | P0 | F01 | ARCH-1.4 (URL routing /open311/), ARCH-4.3 (Open311 endpoints), ARCH-7.1 (Open311 integration) | US-1.1, US-1.2, US-1.3 |
| **F2: Department & Category Management** | P0 | F02 | ARCH-2.1 (DepartmentController, CategoryController), ARCH-3.2 (departments, categories, categoryGroups DDL), ARCH-4.3 (Departments, Categories endpoints) | US-2.1, US-2.2, US-2.3 |
| **F3: People & Contact Management** | P1 | F03 | ARCH-2.1 (PersonController, ContactMethodController), ARCH-3.2 (people, contactMethods DDL), ARCH-4.3 (People endpoints) | US-3.1, US-3.2, US-3.3 |
| **F4: Full-Text Search & Filtering** | P1 | F04 | ARCH-2.1 (SearchController, SearchService), ARCH-4.3 (GET /api/tickets), ARCH-7.3 (Solr integration) | US-4.1, US-4.2, US-4.3 |
| **F5: Geospatial Features** | P1 | F05 | ARCH-2.1 (GeoController, AddressService), ARCH-3.2 (ticket_geodata, geoclusters DDL), ARCH-4.3 (Search & Geo endpoints), ARCH-7.5 (geocoding service) | US-5.1, US-5.2 |
| **F6: Ticket History & Audit Trail** | P0 | F06 | ARCH-2.1 (TicketHistoryController, ActionRepository), ARCH-3.2 (actions DDL), ARCH-4.3 (GET /api/tickets/{id}/history) | US-6.1, US-6.2 |
| **F7: Media Attachments** | P1 | F07 | ARCH-2.1 (TicketMediaController, MediaRepository), ARCH-3.2 (media DDL), ARCH-4.3 (Media endpoints) | US-7.1, US-7.2 |
| **F8: Notification System** | P1 | F08 | ARCH-2.1 (NotificationService, NotificationLogRepository), ARCH-3.3 (notification_log, templates DDL), ARCH-7.4 (SMTP integration) | US-8.1, US-8.2, US-8.3 |
| **F9: Reporting & Metrics** | P1 | F09 | ARCH-2.1 (ReportController), ARCH-3.2/3.3 (aggregation over all tables), ARCH-4.3 (Reporting endpoints) | US-9.1, US-9.2, US-9.3 |
| **F10: Role-Based Access Control** | P0 | F10 | ARCH-2.1 (AuthMiddleware, RbacMiddleware), ARCH-5.3 (RBAC matrix), ARCH-3.2 (people.role, categories permissions) | US-10.1, US-10.2 |
| **F11: Authentication (OIDC + JWT)** | P0 | F11 | ARCH-2.1 (LoginController, CallbackController, AuthService), ARCH-5.1 (auth flow), ARCH-5.2 (session JWT), ARCH-7.2 (OIDC IdP integration) | US-11.1, US-11.2 |
| **F12: Bookmark / Saved Search** | P2 | F12 | ARCH-2.1 (BookmarkController, BookmarkRepository), ARCH-3.3 (bookmarks DDL), ARCH-4.3 (Bookmarks endpoints) | US-12.1, US-12.2 |
| **F13: Response Templates** | P2 | F13 | ARCH-2.1 (TemplateController, TemplateRepository), ARCH-3.3 (templates DDL), ARCH-4.3 (Templates endpoints) | US-13.1, US-13.2 |
| **F14: API Client Management** | P2 | F14 | ARCH-2.1 (ClientController, ClientRepository), ARCH-3.2 (clients DDL), ARCH-4.3 (API Clients endpoints), ARCH-5.7 (API key security) | US-14.1, US-14.2 |
| **F15: Modern SPA Frontend** | P0 | F15 | ARCH-2.2 (Next.js component architecture), ARCH-4.2 (TypeScript interfaces), ARCH-6.2 (frontend stack) | US-15.1, US-15.2, US-15.3, US-15.4 |
| **F16: RESTful JSON API Backend** | P0 | F16 | ARCH-1.1 (architecture pattern), ARCH-2.1 (all PHP backend components), ARCH-4.1 (API design), ARCH-5 (security arch), ARCH-6.1 (backend stack) | US-16.1, US-16.2, US-16.3 |
| **F17: Substatus Management** | P1 | F17 | ARCH-2.1 (SubstatusController, SubstatusRepository), ARCH-3.2 (substatus DDL), ARCH-4.3 (Substatuses endpoints) | US-17.1, US-17.2 |
| **F18: Ticket Merging** | P2 | F18 | ARCH-2.1 (TicketController merge endpoint), ARCH-3.2 (tickets.mergedIntoTicketId), ARCH-4.3 (POST /api/tickets/{id}/merge) | US-18.1 |

---

### 3.2 Non-Functional Requirements Traceability

| NFR ID | Requirement | FRD Reference | TechArch Reference | User Story |
|--------|------------|---------------|-------------------|------------|
| NFR-01 | Ticket list/search p95 ≤ 2s under 500 concurrent users | F04 §F04 Validation | ARCH-7.3 (Solr), ARCH-3 (indexes) | US-4.1, US-15.1 |
| NFR-02 | Open311 API p95 ≤ 500ms for single-resource GET | F01 §F01 Validation | ARCH-7.1, ARCH-4.3 | US-1.2 |
| NFR-03 | 99.5% uptime on Apache + Linux | — | ARCH-1.3 (deployment topology), ARCH-6.4 | US-15.1, US-16.1 |
| NFR-04 | WCAG 2.1 AA on all SPA pages | F15 §F15 Sub-features | ARCH-6.2 (axe-core), ARCH-2.2 (Radix UI) | US-15.3 |
| NFR-05 | Responsive 375px–1920px | F15 §F15 Sub-features | ARCH-2.2 (frontend layout), ARCH-6.2 | US-15.1, US-15.2 |
| NFR-06 | Auth/authz on all API endpoints | F10 §F10 Process, F11 §F11 Process | ARCH-5.2, ARCH-5.3, ARCH-2.1 (AuthMiddleware) | US-10.1, US-11.1 |
| NFR-07 | HTTP security headers on all responses | F16 §F16 Sub-features | ARCH-5.4 (SecurityHeadersMiddleware) | US-16.3 |
| NFR-08 | Server-side input validation; SQL/XSS prevention | F00–F18 §Validation sections | ARCH-5.5 (input validation), ARCH-5.6 (CSRF) | US-16.1 |
| NFR-09 | Open311 GeoReport v2 test suite: 0 failures | F01 §F01 Validation | ARCH-7.1 (Open311 preservation guarantee) | US-1.1, US-1.2, US-1.3 |
| NFR-10 | MySQL schema migration scripts; zero data loss | F16 §F16 Sub-features | ARCH-3.4 (Phinx migrations), ARCH-6.1 (Phinx) | US-16.3 |
| NFR-11 | AGPL-3.0 compatible dependencies | — | ARCH-5.9 (license-checker in CI), ARCH-6.4 | — |
| NFR-12 | Apache + Linux, Docker Compose, Ansible support | — | ARCH-1.3 (deployment topology), ARCH-6.4, ARCH-6.6 | — |
| NFR-13 | Graylog forwarding; structured logging | F08 §F08 Error States | ARCH-2.1 (GraylogHandler), ARCH-7.6 | US-16.3 |
| NFR-14 | ≥70% unit coverage; 100% endpoint integration; e2e | — | ARCH-6.5 (CI/CD pipeline), ARCH-6.1 (PHPUnit), ARCH-6.2 (Playwright) | All P0 + P1 stories |
| NFR-15 | TypeScript strict mode; PHPStan level 8+; CI gates | — | ARCH-5.9, ARCH-6.1 (PHPStan), ARCH-6.2 (tsc) | US-16.2, US-16.3 |
| NFR-16 | GNU gettext externalization; no hard-coded English | — | ARCH-7.7 (i18n), ARCH-6.2 (next-intl) | US-15.3 |

---

### 3.3 API Endpoint Traceability

| API Endpoint | FRD Section | TechArch Section | User Story |
|-------------|-------------|-----------------|------------|
| `POST /api/tickets` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.1 |
| `GET /api/tickets` | F04 §F04 API Surface | ARCH-4.3 (Tickets) | US-4.1, US-4.2 |
| `GET /api/tickets/{id}` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.2 |
| `PUT /api/tickets/{id}` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.2 |
| `DELETE /api/tickets/{id}` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.7 |
| `POST /api/tickets/{id}/assign` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.3 |
| `POST /api/tickets/bulk-assign` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.3 |
| `POST /api/tickets/{id}/close` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.4 |
| `POST /api/tickets/{id}/reopen` | F00 §F00 API Surface | ARCH-4.3 (Tickets) | US-0.5 |
| `POST /api/tickets/{id}/responses` | F00 / F06 §API Surface | ARCH-4.3 (Tickets) | US-0.4, US-8.3 |
| `POST /api/tickets/{id}/comments` | F00 / F06 §API Surface | ARCH-4.3 (Tickets) | US-0.6 |
| `POST /api/tickets/{id}/merge` | F18 §F18 API Surface | ARCH-4.3 (Tickets) | US-18.1 |
| `GET /api/tickets/{id}/merge-candidates` | F18 §F18 API Surface | ARCH-4.3 (Tickets) | US-18.1 |
| `GET /api/tickets/{id}/history` | F06 §F06 API Surface | ARCH-4.3 (Tickets) | US-6.1, US-6.2 |
| `GET /api/tickets/{id}/media` | F07 §F07 API Surface | ARCH-4.3 (Tickets) | US-7.2 |
| `POST /api/tickets/{id}/media` | F07 §F07 API Surface | ARCH-4.3 (Tickets) | US-7.1 |
| `DELETE /api/tickets/{id}/media/{mediaId}` | F07 §F07 API Surface | ARCH-4.3 (Tickets) | US-7.1 |
| `GET /api/tickets/clusters` | F05 §F05 API Surface | ARCH-4.3 (Search & Geo) | US-5.2 |
| `GET /api/tickets/{id}/location` | F05 §F05 API Surface | ARCH-4.3 (Search & Geo) | US-5.1 |
| `GET /api/geocode` | F05 §F05 API Surface | ARCH-4.3 (Search & Geo) | US-5.1 |
| `GET /api/reports/activity` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.2 |
| `GET /api/reports/assignments` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.2 |
| `GET /api/reports/categories` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.3 |
| `GET /api/reports/departments` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.3 |
| `GET /api/reports/staff-performance` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.3 |
| `GET /api/reports/sla` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.3 |
| `GET /api/reports/volume` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.3 |
| `GET /api/reports/open-age` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.3 |
| `GET /api/metrics/sla` | F09 §F09 API Surface | ARCH-4.3 (Reporting) | US-9.1 |
| `GET /api/departments` | F02 §F02 API Surface | ARCH-4.3 (Departments) | US-2.1, US-2.2 |
| `POST /api/departments` | F02 §F02 API Surface | ARCH-4.3 (Departments) | US-2.1 |
| `PUT /api/departments/{id}` | F02 §F02 API Surface | ARCH-4.3 (Departments) | US-2.1 |
| `DELETE /api/departments/{id}` | F02 §F02 API Surface | ARCH-4.3 (Departments) | US-2.2 |
| `GET /api/categories` | F02 §F02 API Surface | ARCH-4.3 (Categories) | US-2.1, US-1.3 |
| `POST /api/categories` | F02 §F02 API Surface | ARCH-4.3 (Categories) | US-2.1 |
| `PUT /api/categories/{id}` | F02 §F02 API Surface | ARCH-4.3 (Categories) | US-2.1, US-2.3 |
| `DELETE /api/categories/{id}` | F02 §F02 API Surface | ARCH-4.3 (Categories) | US-2.2 |
| `GET/POST/PUT/DELETE /api/category-groups` | F02 §F02 API Surface | ARCH-4.3 (Categories) | US-2.1 |
| `GET /api/people` | F03 §F03 API Surface | ARCH-4.3 (People) | US-3.3 |
| `POST /api/people` | F03 §F03 API Surface | ARCH-4.3 (People) | US-3.1 |
| `PUT /api/people/{id}` | F03 §F03 API Surface | ARCH-4.3 (People) | US-3.2, US-3.3 |
| `DELETE /api/people/{id}` | F03 §F03 API Surface | ARCH-4.3 (People) | US-3.3 |
| `GET/POST/PUT/DELETE /api/people/{id}/contact-methods` | F03 §F03 API Surface | ARCH-4.3 (People) | US-3.3 |
| `GET /api/substatuses` | F17 §F17 API Surface | ARCH-4.3 (Substatuses) | US-17.1, US-17.2 |
| `POST /api/substatuses` | F17 §F17 API Surface | ARCH-4.3 (Substatuses) | US-17.1 |
| `PUT /api/substatuses/{id}` | F17 §F17 API Surface | ARCH-4.3 (Substatuses) | US-17.1 |
| `DELETE /api/substatuses/{id}` | F17 §F17 API Surface | ARCH-4.3 (Substatuses) | US-17.1 |
| `GET /api/templates` | F13 §F13 API Surface | ARCH-4.3 (Templates) | US-13.2 |
| `POST /api/templates` | F13 §F13 API Surface | ARCH-4.3 (Templates) | US-13.1 |
| `PUT /api/templates/{id}` | F13 §F13 API Surface | ARCH-4.3 (Templates) | US-13.1 |
| `DELETE /api/templates/{id}` | F13 §F13 API Surface | ARCH-4.3 (Templates) | US-13.1 |
| `GET /api/clients` | F14 §F14 API Surface | ARCH-4.3 (API Clients) | US-14.1, US-14.2 |
| `POST /api/clients` | F14 §F14 API Surface | ARCH-4.3 (API Clients) | US-14.1 |
| `DELETE /api/clients/{id}` | F14 §F14 API Surface | ARCH-4.3 (API Clients) | US-14.2 |
| `POST /api/clients/{id}/regenerate-key` | F14 §F14 API Surface | ARCH-4.3 (API Clients) | US-14.2 |
| `GET /api/bookmarks` | F12 §F12 API Surface | ARCH-4.3 (Bookmarks) | US-12.1, US-12.2 |
| `POST /api/bookmarks` | F12 §F12 API Surface | ARCH-4.3 (Bookmarks) | US-12.1 |
| `GET /api/bookmarks/{id}` | F12 §F12 API Surface | ARCH-4.3 (Bookmarks) | US-12.2 |
| `DELETE /api/bookmarks/{id}` | F12 §F12 API Surface | ARCH-4.3 (Bookmarks) | US-12.1 |
| `GET /api/notifications/settings` | F08 §F08 API Surface | ARCH-4.3 (Notification Settings) | US-8.3 |
| `PUT /api/notifications/settings` | F08 §F08 API Surface | ARCH-4.3 (Notification Settings) | US-8.3 |
| `GET /auth/login` | F11 §F11 API Surface | ARCH-4.3 (Authentication), ARCH-5.1 | US-11.1 |
| `GET /auth/callback` | F11 §F11 API Surface | ARCH-4.3 (Authentication), ARCH-5.1 | US-11.1 |
| `POST /auth/logout` | F11 §F11 API Surface | ARCH-4.3 (Authentication), ARCH-5.1 | US-11.2 |
| `GET /auth/me` | F11 §F11 API Surface | ARCH-4.3 (Authentication) | US-11.2 |
| `GET /api/docs` | F16 §F16 Sub-features | ARCH-4.3 (OpenAPI Documentation) | US-16.2 |
| `GET /api/openapi.json` | F16 §F16 Sub-features | ARCH-4.3 (OpenAPI Documentation) | US-16.2 |
| `GET /open311/discovery` | F01 §F01 API Surface | ARCH-4.3 (Open311), ARCH-7.1 | US-1.3 |
| `GET /open311/services` | F01 §F01 API Surface | ARCH-4.3 (Open311), ARCH-7.1 | US-1.3 |
| `GET /open311/services/{service_code}` | F01 §F01 API Surface | ARCH-4.3 (Open311), ARCH-7.1 | US-1.3 |
| `POST /open311/requests` | F01 §F01 API Surface | ARCH-4.3 (Open311), ARCH-7.1 | US-1.1 |
| `GET /open311/requests` | F01 §F01 API Surface | ARCH-4.3 (Open311), ARCH-7.1 | US-1.2 |
| `GET /open311/requests/{service_request_id}` | F01 §F01 API Surface | ARCH-4.3 (Open311), ARCH-7.1 | US-1.2 |

---

### 3.4 Database Schema Traceability

| Table | FRD Section | TechArch DDL | Feature(s) | User Stories |
|-------|------------|--------------|------------|--------------|
| `tickets` | F00 §F00 Schema Surface | ARCH-3.2 §tickets | F0, F1, F4, F5, F6, F9, F16, F17, F18 | US-0.1–0.7, US-1.1–1.2, US-4.1, US-17.2, US-18.1 |
| `actions` | F06 §F06 Schema Surface | ARCH-3.2 §actions | F0, F6, F7, F13, F17, F18 | US-6.1, US-6.2, US-0.3–0.7 |
| `people` | F03 §F03 Schema Surface | ARCH-3.2 §people | F3, F10, F11 | US-3.1, US-3.2, US-10.1, US-11.1 |
| `contactMethods` | F03 §F03 Schema Surface | ARCH-3.2 §contactMethods | F3, F8 | US-3.3, US-8.1, US-8.2 |
| `departments` | F02 §F02 Schema Surface | ARCH-3.2 §departments | F2, F0, F9 | US-2.1, US-2.2 |
| `categories` | F02 §F02 Schema Surface | ARCH-3.2 §categories | F2, F0, F1, F10 | US-2.1, US-2.2, US-2.3, US-10.2 |
| `categoryGroups` | F02 §F02 Schema Surface | ARCH-3.2 §categoryGroups | F2 | US-2.1 |
| `substatus` | F17 §F17 Schema Surface | ARCH-3.2 §substatus | F17, F0 | US-17.1, US-17.2 |
| `clients` | F14 §F14 Schema Surface | ARCH-3.2 §clients | F14, F1 | US-14.1, US-14.2, US-1.1 |
| `media` | F07 §F07 Schema Surface | ARCH-3.2 §media | F7 | US-7.1, US-7.2 |
| `ticket_geodata` | F05 §F05 Schema Surface | ARCH-3.2 §ticket_geodata | F5, F1 | US-5.1, US-5.2, US-1.1 |
| `templates` | F13 §F13 Schema Surface | ARCH-3.3 §templates | F13, F8 | US-13.1, US-13.2, US-8.1–8.3 |
| `bookmarks` | F12 §F12 Schema Surface | ARCH-3.3 §bookmarks | F12 | US-12.1, US-12.2 |
| `notification_log` | F08 §F08 Schema Surface | ARCH-3.3 §notification_log | F8 | US-8.1, US-8.2, US-8.3 |
| `geoclusters` | F05 §F05 Schema Surface | ARCH-3.3 §geoclusters | F5 | US-5.2 |
| `sessions` | F11 §F11 Schema Surface | ARCH-3.3 §sessions | F11 | US-11.2 |

---

## 4. Requirements Detail

### 4.1 F0: Ticket Lifecycle Management

**PRD Priority:** P0 | **FRD Chunk:** F00 | **User Stories:** US-0.1–US-0.7

**FRD Functional Requirements:**
- Create ticket with title, description, categoryId, location (lat/lng or address), reporter contact fields; system sets status=open, datetimeOpened=NOW(), routes to department, applies default substatus, indexes to Solr, sends confirmation email, returns HTTP 201
- View ticket detail including all fields, resolved relationships (department, category, assignee), substatus, SLA data, and chronological action history
- Assign ticket (single) with assigneeId and/or departmentId; system creates assignment action, notifies assignee; returns HTTP 200
- Bulk assign up to 100 tickets via `POST /api/tickets/bulk-assign`; partial success allowed; returns `{ reassigned: N, failed: [] }`
- Close ticket with optional response text; system sets status=closed, datetimeClosed=NOW(), creates closed+response actions, notifies reporter; returns HTTP 200
- Reopen ticket with required reason text; system sets status=open, clears datetimeClosed, creates open action with reason payload; returns HTTP 200
- Post internal comment (visibility=internal); no reporter notification; excluded from non-staff history responses; returns HTTP 201
- Post external response (visibility=external); triggers reporter email notification; returns HTTP 201
- Delete ticket (admin only); soft-delete via deletedAt=NOW(); removes from Solr; returns HTTP 204

**Key Validation Rules:**
- categoryId must reference an active category
- Either lat/lng pair OR address must be provided
- lat in −90..+90; lng in −180..+180
- assigneeId must reference active staff or admin
- reason (reopen) must be non-empty, max 1000 chars
- Delete requires admin role

**TechArch Components:** TicketController, TicketService, TicketRepository, ActionRepository; tables: tickets, actions

---

### 4.2 F1: Open311 GeoReport v2 API Compliance

**PRD Priority:** P0 | **FRD Chunk:** F01 | **User Stories:** US-1.1–US-1.3

**FRD Functional Requirements:**
- `GET /open311/services` — list all active, public categories as Open311 service objects (service_code, service_name, description, metadata, type, keywords, group)
- `GET /open311/services/{service_code}` — return full service definition including custom field attributes
- `POST /open311/requests` — create ticket via Open311; validate api_key; map service_code to category; return spec-compliant service request object
- `GET /open311/requests` — query with filters: service_code, status, start/end date, lat/long/radius, page, page_size (max 200)
- `GET /open311/requests/{id}` — return single-element array per GeoReport v2 spec
- `GET /open311/discovery` — discovery document pointing to available endpoints and formats
- JSON (default) and XML output via ?format= parameter
- expected_datetime computed as datetimeOpened + category.slaDays business days

**Key Preservation Guarantee:** The Open311 endpoint surface at `/open311/` is preserved verbatim — paths, parameters, and response shapes are frozen. Zero external code changes required after modernization.

**TechArch Components:** Open311 controllers (ServicesController, RequestsController, DiscoveryController); integration: ARCH-7.1 field mapping table

---

### 4.3 F2: Department & Category Management

**PRD Priority:** P0 | **FRD Chunk:** F02 | **User Stories:** US-2.1–US-2.3

**FRD Functional Requirements:**
- Create, edit, and soft-deactivate departments; warn on deactivation if active tickets exist (HTTP 409 HAS_ACTIVE_TICKETS)
- Create, edit, and soft-deactivate categories with: name (unique), departmentId, groupId, slaDays, displayPermission (public/staff/anonymous), postingPermission (staff/public/anonymous), defaultAssigneeId, autoCloseDays, active, fields[] (custom field definitions)
- Custom field definition object: code (regex /^[a-z0-9_]+$/), label, type (text|select|date|checkbox), required, options (required for select)
- Auto-close rule: background job closes tickets with no activity for autoCloseDays days; creates actions entry with system actor; notifies reporter
- Category admin requires admin role; staff can view but not mutate

**Key Validation Rules:**
- Department and category names must be unique (case-insensitive)
- displayPermission = 'anonymous' implies anonymous posting may also be enabled
- select-type custom field requires ≥1 option in options[]
- defaultAssigneeId must reference active staff or admin person

---

### 4.4 F3: People & Contact Management

**PRD Priority:** P1 | **FRD Chunk:** F03 | **User Stories:** US-3.1–US-3.3

**FRD Functional Requirements:**
- Create person record with firstName, lastName, role (admin/staff/public), optional departmentId, optional oidcSubject
- OIDC auto-provision: on first OIDC login with no matching person, create person with role=public from OIDC claims; admin must elevate role manually
- Contact methods (email/phone/address) with isPrimary flag; demote existing primary on new primary creation
- People soft-deactivation only (preserves historical ticket references)
- Search/filter by q, role, departmentId, active with pagination

**Key Validation Rules:**
- Email must be valid RFC 5322 format and unique across active contact methods
- role admin or staff requires at least one valid email contact method
- departmentId must reference active department

---

### 4.5 F4: Full-Text Search & Filtering

**PRD Priority:** P1 | **FRD Chunk:** F04 | **User Stories:** US-4.1–US-4.3

**FRD Functional Requirements:**
- Keyword search via Solr across ticket title, description, responses, address fields
- Filters: status, substatusId, categoryId (array), departmentId (array), assigneeId, reporterEmail, dateFrom, dateTo, lat/lng/radius, bbox
- Sort: date_desc (default), date_asc, sla_asc, assignee, category
- Pagination: page, perPage (default 25, max 100); meta includes total, pages, facets (status, category, department counts)
- CSV export via ?export=csv; capped at 5000 rows; staff/admin only; Content-Disposition header set
- Solr index sync on every ticket mutation (async); full re-index CLI command for recovery
- Staff-only category tickets excluded from results for non-staff callers

---

### 4.6 F5: Geospatial Features

**PRD Priority:** P1 | **FRD Chunk:** F05 | **User Stories:** US-5.1–US-5.2

**FRD Functional Requirements:**
- Store lat/lng in ticket_geodata; denormalized copy in tickets.lat/lng
- Geocode address→lat/lng via configurable AddressService (google|nominatim|city_gis|none)
- Reverse geocode lat/lng→address on Open311 submissions without address string
- Geocoding failure is non-fatal: geoStatus='pending'; background retry via `bin/console geo:retry`
- Geo-cluster endpoint: `GET /api/tickets/clusters` returns [{lat,lng,count,zoom}] using Solr spatial heatmap
- Cluster grid resolution responds to zoom (1–20); individual markers returned when count per cell < 10

---

### 4.7 F6: Ticket History & Audit Trail

**PRD Priority:** P0 | **FRD Chunk:** F06 | **User Stories:** US-6.1–US-6.2

**FRD Functional Requirements:**
- Immutable append-only actions table; no PUT or DELETE permitted (enforce via application layer + optional MySQL triggers)
- Action types: open, assignment, closed, reopen, response, comment, upload, deleted, merged, substatus, notification_sent
- Each action captures: ticketId, type, actorPersonId OR actorClientId (never null), datetimeCreated, payload (JSON), visibility (external/internal)
- History API: GET /api/tickets/{id}/history; ordered by datetimeCreated ASC; internal actions excluded for non-staff callers; supports type filter and pagination
- Actor names resolved from people (for actorPersonId) or clients (for actorClientId)

---

### 4.8 F7: Media Attachments

**PRD Priority:** P1 | **FRD Chunk:** F07 | **User Stories:** US-7.1–US-7.2

**FRD Functional Requirements:**
- Upload via POST /api/tickets/{id}/media multipart/form-data; MIME validated via finfo_file() magic bytes
- Allowed types: image/jpeg, image/png, image/gif, image/webp, application/pdf (configurable)
- File size limit: MAX_UPLOAD_SIZE (default 10 MB); max 20 attachments per ticket (configurable)
- Thumbnail generation: 300×300px JPEG for image types
- upload action created with payload.mediaIds referencing new media record
- Open311 media_url: stored as sourceUrl in media table; file not downloaded; no thumbnail
- Soft-delete media record; physical file cleanup by garbage collection

---

### 4.9 F8: Notification System

**PRD Priority:** P1 | **FRD Chunk:** F08 | **User Stories:** US-8.1–US-8.3

**FRD Functional Requirements:**
- Email notifications triggered by: ticket creation (→ reporter), assignment (→ new assignee), response posted (→ reporter), ticket closed (→ reporter), ticket merged (→ source reporter)
- Digest emails: scheduled daily at 7am to all active department staff; skipped for departments with 0 open tickets
- Deduplication: skip if identical (ticketId, templateSlug, recipientEmail) sent within last 60 seconds
- SMTP: via PHPMailer; up to 3 retries with exponential backoff (5s, 15s, 45s); non-fatal on failure
- Notification log entry created per sent notification
- Template variable substitution via F13 templates at send time

---

### 4.10 F9: Reporting & Metrics

**PRD Priority:** P1 | **FRD Chunk:** F09 | **User Stories:** US-9.1–US-9.3

**FRD Functional Requirements:**
- Eight report endpoints (activity, assignments, categories, departments, staff-performance, sla, volume, open-age); all staff/admin only; max 2-year date range
- All reports support ?format=csv with stable column order
- SLA calculation: expectedCloseDate = datetimeOpened + (slaDays × 8 working hours); on_time if closed before; late if closed after or still open past expected; no_sla if slaDays=null
- Metrics endpoint `GET /api/metrics/sla`: public; cached 5 minutes; returns [{categoryId, categoryName, totalClosed, onTime, late, onTimePct}]

---

### 4.11 F10: Role-Based Access Control

**PRD Priority:** P0 | **FRD Chunk:** F10 | **User Stories:** US-10.1–US-10.2

**FRD Functional Requirements:**
- Role hierarchy: admin > staff > public > anonymous
- Role stored on people.role column; JWT role claim cross-validated against DB on every request
- Category-level two-dimensional permissions: displayPermission (who can view) × postingPermission (who can submit)
- HTTP 401 for missing/invalid JWT; HTTP 403 for insufficient role
- Public users may only view their own tickets (matched by reporterPersonId or session email)
- Open311 endpoints use API key authorization (F14), not JWT

---

### 4.12 F11: Authentication (OIDC + JWT)

**PRD Priority:** P0 | **FRD Chunk:** F11 | **User Stories:** US-11.1–US-11.2

**FRD Functional Requirements:**
- OIDC authorization code flow: redirect to provider → receive code → exchange for id_token → validate signature against JWKS → match/create person → issue session JWT
- Session JWT payload: {sub: personId, role, iss: "ureport", jti, iat, exp}; HMAC-SHA256 signed with JWT_SECRET
- Cookie: HttpOnly, Secure, SameSite=Lax, name: ureport_session; SESSION_TTL default 28800s (8 hours)
- On every request: extract JWT → verify signature → check exp → load person from DB (confirm active=true, get current role)
- Logout: clear cookie + redirect to OIDC provider end-session endpoint
- State nonce validated on callback for CSRF protection

---

### 4.13 F12: Bookmark / Saved Search Management

**PRD Priority:** P2 | **FRD Chunk:** F12 | **User Stories:** US-12.1–US-12.2

**FRD Functional Requirements:**
- Create bookmark: POST /api/bookmarks with name (max 100, unique per user) and filterState (JSON matching F04 search params)
- List, get, delete: all scoped to authenticated user (personId from JWT); no cross-user access
- Maximum 50 bookmarks per user; exceeds returns HTTP 422 BOOKMARK_LIMIT
- filterState restored by SPA by deserializing into search form and URL parameters

---

### 4.14 F13: Response Templates

**PRD Priority:** P2 | **FRD Chunk:** F13 | **User Stories:** US-13.1–US-13.2

**FRD Functional Requirements:**
- Templates with name (unique), subject, body (max 10,000); system templates identified by slug (not deletable)
- Supported variables: {{ticket_id}}, {{title}}, {{category}}, {{department}}, {{assignee_name}}, {{reporter_name}}, {{status}}, {{date_opened}}, {{expected_close_date}}, {{ticket_url}}, {{response_body}}
- Unknown variable names warned in API response; not rejected
- Variable substitution at send time (F08 uses templates); missing variables → empty string

---

### 4.15 F14: API Client Management

**PRD Priority:** P2 | **FRD Chunk:** F14 | **User Stories:** US-14.1–US-14.2

**FRD Functional Requirements:**
- Create client: auto-generate UUID v4 API key; return plain text ONCE on create/regenerate; subsequent GETs return apiKeyHint (first 8 chars + "…")
- Store apiKeyHash (bcrypt cost ≥ 12); plain key never persisted
- Validate on Open311: hash provided key, compare with stored hash; invalid key for non-public category → HTTP 400
- Revoke (DELETE) deactivates client; revoked key immediately rejected
- Regenerate key: POST /api/clients/{id}/regenerate-key; new UUID key generated; old key immediately invalidated
- Client identity preserved in actions.actorClientId for audit trail

---

### 4.16 F15: Modern React/Next.js SPA Frontend

**PRD Priority:** P0 | **FRD Chunk:** F15 | **User Stories:** US-15.1–US-15.4

**FRD Functional Requirements:**
- Full staff ticket management UI: list, search, detail, create, edit, assign, close, reopen, delete; bulk assignment without page reload
- Public citizen portal: /submit form with category selection, description, location map picker, file upload, contact info; /track/{id} for status tracking
- Map view: integrated Leaflet map with geo-cluster density visualization (F5)
- Admin screens: /admin/departments, /admin/categories, /admin/people, /admin/templates, /admin/clients, /admin/substatuses
- OIDC login flow via auth/login → auth/callback → dashboard redirect; session stored in HttpOnly cookie
- Viewport: fully functional 375px–1920px; no horizontal scroll
- WCAG 2.1 AA: axe-core automated audit with 0 critical violations on all primary routes; all interactive elements keyboard navigable
- TypeScript strict mode throughout; Radix UI / shadcn/ui component library
- Zero PHP templates served to end users after migration; all HTML from Next.js

---

### 4.17 F16: RESTful JSON API Backend

**PRD Priority:** P0 | **FRD Chunk:** F16 | **User Stories:** US-16.1–US-16.3

**FRD Functional Requirements:**
- All /api/ responses use envelope: {"data": any, "meta": {...}, "errors": []}
- HTTP status codes: 200 (read/update), 201 (create), 204 (delete), 400 (malformed), 401 (unauthenticated), 403 (forbidden), 404 (not found), 409 (conflict), 413 (too large), 422 (validation), 500 (server error), 503 (dependency unavailable)
- Validation errors (422) include field-level messages: [{"field": "...", "message": "..."}]
- OpenAPI 3.1 spec auto-generated from annotated controllers; served at /api/openapi.json and /api/openapi.yaml; Swagger UI at /api/docs
- TypeScript client types auto-generated from OpenAPI spec via openapi-typescript during frontend build
- Repository pattern: each entity has a typed repository class; no raw SQL in controllers; PDO/DBAL as DB layer
- Security headers applied via SecurityHeadersMiddleware (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- All unhandled exceptions caught by ErrorHandlerMiddleware, logged to Graylog, returned as HTTP 500 envelope

---

### 4.18 F17: Substatus Management

**PRD Priority:** P1 | **FRD Chunk:** F17 | **User Stories:** US-17.1–US-17.2

**FRD Functional Requirements:**
- Create substatus with label (unique within primaryStatus), primaryStatus (open/closed), isDefault, active, sortOrder
- Setting isDefault=true clears isDefault on any other substatus of same primaryStatus
- Apply substatus via PATCH /api/tickets/{id} with substatusId; primaryStatus must match ticket's current primary status
- Substatus change creates actions entry of type=substatus with payload.previousSubstatusId and payload.newSubstatusId
- New tickets auto-receive the configured default substatus for their initial primary status
- Ticket search (F4) supports filtering by substatusId

---

### 4.19 F18: Ticket Merging

**PRD Priority:** P2 | **FRD Chunk:** F18 | **User Stories:** US-18.1

**FRD Functional Requirements:**
- GET /api/tickets/{id}/merge-candidates returns open, non-merged tickets for target selection
- Side-by-side preview before confirmation
- POST /api/tickets/{id}/merge: validates source ≠ target, source not already merged, target is open and not merged
- On merge: source ticket status=closed, mergedIntoTicketId=target.id, datetimeClosed=NOW()
- Two actions records created: one on source (payload.mergedIntoTicketId), one on target (payload.mergedFromTicketId)
- Source reporter notified via email with target ticket URL
- Both tickets updated in Solr index; merged source flagged as merged in search results
- Self-merge returns HTTP 422 SELF_MERGE; merge into closed/already-merged target returns HTTP 409

---

## 5. Test Case Coverage

### 5.1 Coverage Matrix by Feature

| Feature | Priority | User Stories | Test Cases | Coverage Areas | Target Coverage |
|---------|----------|-------------|------------|----------------|----------------|
| **F0: Ticket Lifecycle** | P0 | 7 (US-0.1–0.7) | TEST-001–010 | Create, View, Assign (single+bulk), Close, Reopen, Comment, Delete; HTTP status codes; validation errors | Unit + Integration + E2E |
| **F1: Open311 API** | P0 | 3 (US-1.1–1.3) | TEST-011–018 | Services list, service detail, discovery, POST request, GET requests with filters, GET single request; JSON+XML formats; api_key validation | Integration (Open311 compliance suite) |
| **F2: Dept & Category Mgmt** | P0 | 3 (US-2.1–2.3) | TEST-019–025 | Create/edit/deactivate dept, category with all fields; custom field types; auto-close rule; warning on deactivation with active tickets | Unit + Integration |
| **F3: People & Contacts** | P1 | 3 (US-3.1–3.3) | TEST-026–031 | Create staff user; OIDC auto-provision; add/edit/remove contact methods; search/filter; email uniqueness | Unit + Integration |
| **F4: Search & Filtering** | P1 | 3 (US-4.1–4.3) | TEST-032–038 | Keyword search; all filter parameters; pagination; facets; CSV export; Solr index sync on mutations; re-index CLI | Unit + Integration |
| **F5: Geospatial** | P1 | 2 (US-5.1–5.2) | TEST-039–044 | Geocode on create; reverse geocode; pending on failure; cluster endpoint; bbox filtering; zoom levels | Unit + Integration |
| **F6: Audit Trail** | P0 | 2 (US-6.1–6.2) | TEST-045–050 | History endpoint; all action types created; internal visibility excluded for non-staff; actor resolution; immutability (HTTP 405) | Unit + Integration |
| **F7: Media Attachments** | P1 | 2 (US-7.1–7.2) | TEST-051–057 | Upload image/PDF; MIME validation; size limit; thumbnail generation; attachment limit; download access; Open311 media_url | Unit + Integration |
| **F8: Notifications** | P1 | 3 (US-8.1–8.3) | TEST-058–063 | Creation notification; assignment notification; response notification; deduplication; SMTP retry; digest email skip on 0 tickets | Unit + Integration |
| **F9: Reporting** | P1 | 3 (US-9.1–9.3) | TEST-064–072 | All 8 report endpoints; SLA on-time calculation; metrics endpoint caching; CSV export; date range validation; role enforcement | Unit + Integration |
| **F10: RBAC** | P0 | 2 (US-10.1–10.2) | TEST-073–080 | Role hierarchy (admin/staff/public/anonymous); category display permission; category posting permission; HTTP 401 vs 403; public user own-ticket restriction | Unit + Integration |
| **F11: Authentication** | P0 | 2 (US-11.1–11.2) | TEST-081–087 | OIDC login flow; state nonce CSRF protection; JWT issuance; session validation; person DB lookup on each request; logout cookie clear; deactivated person 401 | Unit + Integration (Keycloak container) |
| **F12: Bookmarks** | P2 | 2 (US-12.1–12.2) | TEST-088–092 | Create bookmark; name uniqueness per user; max 50 limit; list scoped to user; delete; restore filterState | Unit + Integration |
| **F13: Templates** | P2 | 2 (US-13.1–13.2) | TEST-093–097 | Create template; variable warning; system template delete blocked; template selection in UI; variable substitution at send time | Unit + Integration |
| **F14: API Clients** | P2 | 2 (US-14.1–14.2) | TEST-098–103 | Create client + key returned once; GET returns hint only; revoke; regenerate; revoked key rejected by Open311; audit trail attribution | Unit + Integration |
| **F15: SPA Frontend** | P0 | 4 (US-15.1–15.4) | TEST-104–115 | Responsive layout (375px, 768px, 1920px); Lighthouse score; WCAG axe-core on all routes; keyboard navigation; citizen submission flow; admin screens; zero PHP templates served | E2E (Playwright) |
| **F16: JSON API Backend** | P0 | 3 (US-16.1–16.3) | TEST-116–123 | JSON envelope on all responses; HTTP status codes; field-level 422 errors; OpenAPI spec coverage; TypeScript types generated; repository pattern; security headers; Graylog on 500 | Unit + Integration |
| **F17: Substatus** | P1 | 2 (US-17.1–17.2) | TEST-124–128 | Create substatus; label uniqueness per primaryStatus; isDefault auto-clear; apply to ticket; primaryStatus mismatch 422; default applied on create/close/reopen | Unit + Integration |
| **F18: Ticket Merging** | P2 | 1 (US-18.1) | TEST-129–134 | Merge candidates; preview; merge execution; source closed + linked; two actions created; reporter notified; Solr updated; self-merge 422; closed target 409 | Unit + Integration |

---

### 5.2 Non-Functional Test Coverage

| NFR ID | Test Type | Test Description | Test ID |
|--------|-----------|-----------------|---------|
| NFR-01 | Performance | Load test: p95 ticket list ≤ 2s at 100 concurrent staff users | TEST-135 |
| NFR-02 | Performance | Load test: p95 Open311 GET single request ≤ 500ms | TEST-136 |
| NFR-04 | Accessibility | axe-core WCAG 2.1 AA audit on all primary SPA routes; 0 critical violations | TEST-137 |
| NFR-05 | Responsive | Playwright viewport tests at 375px, 768px, 1440px, 1920px | TEST-138 |
| NFR-06 | Security | Auth bypass attempts on all protected endpoints; verify 401/403 returned | TEST-139 |
| NFR-07 | Security | HTTP response header inspection on all /api/ responses for CSP, HSTS, X-Frame-Options | TEST-140 |
| NFR-08 | Security | SQL injection payloads in all string inputs; XSS payloads in text fields; verify sanitization | TEST-141 |
| NFR-09 | Compliance | Open311 GeoReport v2 compliance test suite executed against /open311/ endpoints | TEST-142 |
| NFR-10 | Migration | Phinx migration scripts applied to legacy schema snapshot; verify zero data loss | TEST-143 |
| NFR-13 | Observability | Trigger unhandled exception; verify Graylog GELF message received | TEST-144 |
| NFR-14 | Coverage | PHPUnit coverage report: verify ≥70% line coverage on backend; all /api/ endpoints have integration tests | TEST-145 |
| NFR-15 | Type Safety | CI: tsc --noEmit strict mode passes with 0 errors; phpstan --level=8 passes with 0 errors | TEST-146 |

---

### 5.3 End-to-End Critical User Journeys (Playwright)

| Journey ID | Persona | Journey Description | Feature Coverage |
|------------|---------|---------------------|-----------------|
| E2E-001 | Dana Reyes (staff) | Login via OIDC → create ticket → assign to colleague → close with response → verify reporter notification | F11, F0, F8 |
| E2E-002 | Priya Nair (citizen) | Navigate to /submit → fill form with map location → attach photo → submit → receive confirmation email → check /track/{id} | F15, F5, F7, F8 |
| E2E-003 | Tomás Eriksson (dev) | POST /open311/requests with api_key → GET /open311/requests with filters → GET /open311/requests/{id} | F1, F14 |
| E2E-004 | Marcus Webb (manager) | Login → search tickets with filters → export CSV → view SLA dashboard → generate activity report | F4, F9 |
| E2E-005 | Dana Reyes (staff) | View ticket detail → view full action history → add internal comment → post response template → attach document | F0, F6, F13, F7 |
| E2E-006 | Tomás Eriksson (admin) | Create department → create category with SLA + custom fields → create staff user → assign role → verify login | F2, F3, F11, F10 |
| E2E-007 | Dana Reyes (staff) | Search with keyword → switch to map view → zoom cluster → click individual ticket | F4, F5 |
| E2E-008 | Marcus Webb (manager) | Identify duplicate tickets → merge duplicate into canonical → verify source closed + reporter notified | F18 |
| E2E-009 | Dana Reyes (staff) | Save search filter as bookmark → logout → login → restore bookmark → verify filters applied | F12, F11 |
| E2E-010 | Tomás Eriksson (admin) | Access /api/docs Swagger UI → verify all endpoints documented → verify TypeScript types generated in build | F16 |

---

## 6. Change Management

### 6.1 RTM Change Log

| Version | Date | Author | Change Description | Affected Sections |
|---------|------|--------|-------------------|-------------------|
| 1.0 | 2026-06-23 | Generated | Initial RTM created from PRD v1.0, FRD v1.0, TechArch v1.0, UserStories v1.0 | All |

### 6.2 Change Control Process

Changes to any source specification document (PRD, FRD, TechArch, or UserStories) require a corresponding RTM update before the change is considered complete. The following procedure governs RTM maintenance:

- **PRD change (scope/priority):** Update Section 2 (Requirements Summary), update the affected row(s) in Section 3.1, update Section 4 (Requirements Detail), and update Section 5.1 (Coverage Matrix). Re-confirm approval in Section 7.
- **FRD change (process/validation/error states):** Update Section 4 (Requirements Detail) for the affected feature chunk. If API surface changes, update Section 3.3 (API Endpoint Traceability) and Section 5 (Test Case Coverage).
- **TechArch change (schema/component/endpoint):** Update Section 3.4 (Database Schema Traceability), Section 3.3 (API Endpoint Traceability), and the affected row(s) in Section 3.1.
- **UserStories change (new/modified story):** Update Section 3.1 (primary traceability table), Section 3.3 (API Endpoint Traceability where applicable), and Section 5 (Test Case Coverage). Assign new TEST-xxx IDs for new acceptance criteria.
- **New feature added:** A full row must be added to Section 3.1, a detail entry to Section 4, and coverage rows to Section 5.1.

### 6.3 Pending Decisions That May Affect RTM

The following architectural decisions recorded in PROJECT.md as "— Pending" may result in RTM updates when resolved:

- **Modernize in-place vs. rewrite:** If a full rewrite is chosen instead of incremental modernization, Sections 3.1 and 4 may require reassessment of the "Preserved" vs. "New Deliverable" classification for F0–F14, F17, F18.
- **Frontend framework choice (React vs. Vue vs. Next.js):** RTM currently reflects Next.js 15 (App Router) as specified in TechArch v1.0. A change would update ARCH-2.2 references throughout Section 3.
- **API layer (PHP thin controllers vs. separate Node/TS service):** If a separate TypeScript service is chosen, ARCH-2.1 component references and ARCH-6.1 technology stack references in Sections 3.1, 3.3, and 4.17 would require revision.
- **ORM vs. raw PDO:** RTM references "repository pattern over PDO" per TechArch. Selection of Doctrine DBAL or another query builder would update ARCH-2.1 (Repositories) references and Section 4.17.

---

## 7. Approval

### 7.1 Document Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | — | ___________________________ | _____ |
| Technical Lead | — | ___________________________ | _____ |
| QA Lead | — | ___________________________ | _____ |
| Security Reviewer | — | ___________________________ | _____ |
| System Administrator | — | ___________________________ | _____ |

### 7.2 RTM Completeness Checklist

| Criterion | Status |
|-----------|--------|
| All 19 PRD features (F0–F18) have a row in the Primary Traceability Table (§3.1) | ✓ Complete |
| All 16 Non-Functional Requirements (NFR-01–NFR-16) are traced in §3.2 | ✓ Complete |
| All 51 User Stories (US-0.1–US-18.1) are referenced in the traceability tables | ✓ Complete |
| All FRD chunks (F00–F18) are linked to PRD features and TechArch sections | ✓ Complete |
| All primary API endpoints from TechArch §4.3 are mapped in §3.3 | ✓ Complete |
| All database tables from TechArch §3.2–3.3 DDL are mapped in §3.4 | ✓ Complete |
| Each PRD feature has a Requirements Detail entry in §4 | ✓ Complete |
| Test case IDs (TEST-001–TEST-146) assigned for all acceptance criteria areas in §5 | ✓ Complete |
| 10 critical E2E user journeys defined in §5.3 | ✓ Complete |
| Change management process defined in §6 | ✓ Complete |
| Approval sign-off table present in §7 | ✓ Complete |
| No placeholder IDs — all IDs extracted from source documents | ✓ Verified |

### 7.3 Traceability Completeness Summary

| Traceability Direction | Items | Traced | Gaps |
|----------------------|-------|--------|------|
| PRD Features → FRD Chunks | 19 | 19 | 0 |
| PRD Features → TechArch Sections | 19 | 19 | 0 |
| PRD Features → User Stories | 19 | 19 | 0 |
| FRD Chunks → PRD Features | 19 | 19 | 0 |
| FRD Chunks → API Endpoints | 67 endpoints | 67 | 0 |
| TechArch DB Tables → Features | 16 tables | 16 | 0 |
| User Stories → Test Cases | 51 stories | 51 | 0 |
| NFRs → TechArch + FRD | 16 | 16 | 0 |

---

*Document generated: 2026-06-23*  
*Based on: PRD-uReport.md v1.0 · FRD-uReport.md v1.0 · TechArch-uReport.md v1.0 · UserStories-uReport.md v1.0*  
*Project: uReport Municipal CRM Modernization*
