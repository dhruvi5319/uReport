# Product Requirements Document
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Acronym:** uReport  
**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Active  
**License:** AGPL-3.0  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision](#3-product-vision)
4. [Technical Architecture](#4-technical-architecture)
5. [Feature Requirements](#5-feature-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Success Metrics](#7-success-metrics)
8. [Risks & Mitigations](#8-risks--mitigations)
9. [Feature Index](#9-feature-index)

---

## 1. Executive Summary

uReport is a constituent relationship management (CRM) web application for small-to-mid-size municipalities that enables citizens to submit public service requests (potholes, broken streetlights, sanitation issues) and staff to manage, assign, and resolve them — all through Open311 GeoReport v2-compliant endpoints. This modernization project re-architects the legacy PHP monolith into a decoupled RESTful JSON API backend and a modern React/Next.js SPA frontend, delivering 100% functional parity with the existing system while eliminating tightly coupled business logic, introducing type-safe API contracts, and enabling WCAG 2.1 AA-accessible mobile-responsive interfaces.

---

## 2. Problem Statement

### The Legacy System

The existing uReport application is built on a custom PHP MVC framework ("blossom-lib") with no separation of concerns between data access, business logic, and HTML rendering. Controllers simultaneously compute business state and emit HTML, JSON, XML, or CSV depending on a `?format=` query parameter. This architecture creates a set of compounding problems that impede maintainability, extensibility, and staff productivity.

**Technical debt accumulation:**
- Controllers mix business logic with template rendering, making unit testing impractical
- No type-safe API contract: frontend consumers rely on HTML scraping or fragile JSON template output
- Frontend uses legacy jQuery patterns with no build pipeline, no TypeScript, and no component model
- PHPStan is configured at level 5 (non-strict), allowing type errors to reach production
- No CI pipeline enforcing code quality gates — regressions are caught manually

**Operational pain points:**
- The mobile experience is absent; layouts are desktop-first CSS with no responsive breakpoints
- No OpenAPI/Swagger documentation makes third-party Open311 integration unnecessarily difficult
- Adding a new field or UI component requires changes to PHP controllers, PHP template files, and raw CSS/JS simultaneously
- Onboarding new developers requires understanding the homegrown "blossom-lib" framework before any feature work can begin

**Risk to continuity:**
- External systems (Open311 clients, third-party apps) depend on the existing API surface; any uncontrolled change breaks those integrations
- The existing codebase has no automated regression safety net — the modernization itself could introduce silent regressions without comprehensive tests

### Who Is Affected

- **Municipal staff** (clerks, department heads, supervisors) who manage tickets daily and need a fast, accessible web interface
- **Citizens and constituents** who submit and track service requests via web or third-party Open311 apps
- **Third-party Open311 API clients** (mobile apps, integrations) that rely on spec-compliant endpoints
- **Developers and system administrators** who maintain and extend the system over time

---

## 3. Product Vision

### Vision Statement

uReport will become the reference-quality open-source municipal CRM: a clean, decoupled, fully tested system where staff resolve constituent issues faster, citizens get transparent request tracking, and developers can confidently extend the platform without fear of regression.

### Strategic Goals

- **Preserve and protect the Open311 GeoReport v2 API contract** so that all existing third-party integrations continue to work without modification after the modernization
- **Eliminate the coupled PHP MVC pattern** by separating the backend into a pure JSON API layer and the frontend into an independently deployable SPA
- **Achieve full functional parity** with the legacy system — no existing staff-facing or citizen-facing capability is removed
- **Introduce automated test coverage** (unit, integration, e2e) to prevent regressions during and after migration
- **Deliver a mobile-responsive, WCAG 2.1 AA-accessible frontend** that replaces the desktop-only legacy interface
- **Improve developer experience** with TypeScript, OpenAPI documentation, linting, hot reload, and a clear repository pattern for database access
- **Maintain deployment simplicity** — Apache + Linux, Docker Compose, and Ansible deployment paths must all remain supported

### Target Users

| User Type | Description | Primary Interaction |
|-----------|-------------|---------------------|
| Municipal Staff | Clerks, department heads, supervisors managing service requests | Internal ticket management UI |
| Citizens / Constituents | Residents submitting and tracking public service requests | Submission portal, status tracking |
| Open311 API Clients | Third-party apps and mobile apps consuming the Open311 endpoint | REST API (Open311 GeoReport v2) |
| System Administrators | IT staff deploying and configuring uReport for a municipality | Deployment tooling, configuration |
| Developers | Engineers extending or maintaining the codebase | API, codebase, CI/CD |

---

## 4. Technical Architecture

### Modernization Target Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18+ / Next.js 15+ with TypeScript | SSR + API routes; replaces PHP template rendering |
| API Backend | PHP 8.5 RESTful JSON layer (or Node.js/TypeScript) | Thin controllers; Open311 endpoint preserved |
| Database | MySQL 5.7+ | Existing schema preserved; PDO refactored to repository pattern |
| Full-Text Search | Apache Solr 7.4+ | Existing integration preserved, abstracted behind service layer |
| Authentication | OIDC / OpenID Connect with JWT session | Role model (`people.role`) preserved |
| API Documentation | OpenAPI / Swagger | Auto-generated from annotated controllers |
| Testing | PHPUnit (backend) · Jest (frontend) · Playwright (e2e) | Enforced via CI |
| CI/CD | GitHub Actions | Containerized test runs, code quality gates |
| Containerization | Docker Compose | Dev stack: PHP/Apache app, MySQL, Solr |
| Deployment | Apache + Linux, Ansible | Primary production target |
| Logging | Graylog centralized logging | Existing integration preserved |
| i18n | GNU gettext (.po/.mo files) | Existing locale support preserved |

### Brownfield Context

The modernization is **incremental, not a full rewrite**. The existing MySQL schema, domain models, Open311 endpoint surface, OIDC auth, Solr integration, and Graylog logging are all preserved. The primary deliverables are (1) a clean JSON API layer that replaces PHP template output and (2) a modern SPA frontend that consumes it. All other features (F0–F14, F17–F18) are validated existing capabilities that must be preserved with full parity.

---

## 5. Feature Requirements

---

### F0: Ticket Lifecycle Management

**Description:** The core capability of uReport. Staff and (where permitted) citizens can create service request tickets, view their details, assign them to department staff, update their status, add responses, close resolved issues, reopen them if needed, and delete them. The ticket is the fundamental unit of work in the system, and all other features orbit around it.

**Capabilities:**
- Create new tickets with title, description, category, location, and contact info
- View ticket detail with full history, attachments, and current status
- Assign tickets to a department and/or individual staff member
- Update ticket fields (category, location, description, custom fields)
- Change ticket status (open → assigned → closed, and back to open/reopen)
- Apply a substatus to refine the ticket's state beyond open/closed (see F17)
- Close tickets with a resolution response
- Reopen closed tickets with a reason
- Delete tickets (staff with appropriate permissions)
- Merge duplicate tickets (see F18)

**Priority:** P0 — Critical MVP requirement

---

### F1: Open311 GeoReport v2 API Compliance

**Description:** uReport implements the Open311 GeoReport v2 specification, allowing any Open311-compliant client (mobile app, third-party integration, city portal) to submit and query service requests without coupling to uReport's internal UI. This API surface is the most critical external contract in the system and must remain 100% spec-compliant after modernization.

**Capabilities:**
- `GET /open311/services` — list all available service types with metadata
- `GET /open311/services/{service_code}` — retrieve detailed service definition including custom fields
- `POST /open311/requests` — submit a new service request (supports API key auth)
- `GET /open311/requests` — query service requests with filters (status, service_code, date range, lat/long bounding box)
- `GET /open311/requests/{service_request_id}` — retrieve a single service request by ID
- `GET /open311/discovery` — return discovery document pointing to available endpoints
- Multi-format output: JSON (default) and XML as required by Open311 spec
- API key authentication for client identification (see F14)
- All request and response field mappings must match the GeoReport v2 schema exactly

**Priority:** P0 — Critical MVP requirement; external integrations depend on this contract

---

### F2: Department & Category Management

**Description:** Tickets are routed to departments via categories. Administrators configure the category taxonomy — including SLA days, display/posting permissions, custom fields, default assignees, and auto-close rules — that governs how tickets flow through the system. Department management defines the organizational units that own ticket queues.

**Capabilities:**
- Create, edit, and deactivate departments with default assignees
- Create, edit, and deactivate ticket categories with department assignment
- Configure SLA days per category (number of business days to resolution)
- Set display permissions per category (public, staff-only, anonymous viewing allowed)
- Set posting permissions per category (authenticated staff only, public posting allowed, anonymous allowed)
- Define custom fields per category (text, select, date, checkbox types)
- Configure auto-close rules per category (e.g., close automatically after N days of inactivity)
- Group categories for organizational display
- Assign default staff member per category or department

**Priority:** P0 — Critical MVP requirement

---

### F3: People & Contact Management

**Description:** uReport maintains a unified people/contacts directory covering both municipal staff and constituents. Each person can have multiple contact methods (email addresses, phone numbers, physical addresses) and is associated with a role that governs their access level.

**Capabilities:**
- Create, view, edit, and deactivate staff and constituent person records
- Associate multiple email addresses per person (primary + additional)
- Associate multiple phone numbers per person with type (mobile, office, home)
- Associate multiple physical addresses per person
- Assign staff roles (admin, staff, department head) via `people.role`
- Link person records to submitted tickets as the reporter
- Link person records to tickets as the assignee (staff)
- Search and filter people by name, email, role, or department

**Priority:** P1 — Required for MVP

---

### F4: Full-Text Search & Filtering

**Description:** Staff can search across all tickets using keywords and apply multi-dimensional filters to narrow results. Apache Solr powers the full-text index and geo-spatial clustering. Results can be exported as CSV or rendered for printing.

**Capabilities:**
- Keyword full-text search across ticket fields (title, description, responses, addresses)
- Filter by status, category, department, assignee, date range, and location
- Map view of search results with geo-clustered density visualization (see F5)
- Saved searches / bookmarks per user (see F12)
- CSV export of search results
- Print-friendly result rendering
- Pagination and sorting of result sets
- Solr index kept in sync with ticket mutations (create, update, close, delete)

**Priority:** P1 — Required for MVP

---

### F5: Geospatial Features

**Description:** Service requests are inherently location-based. uReport captures latitude/longitude coordinates for every ticket, integrates with a configurable address lookup service to resolve street addresses, and displays tickets on interactive maps with density clustering.

**Capabilities:**
- Capture and store latitude/longitude for each ticket
- Capture and store a human-readable address string per ticket
- Integrate with a configurable address lookup/geocoding service to resolve entered addresses to coordinates
- Display individual ticket locations on a map
- Display geo-clustered density map across search results (Solr geospatial clustering)
- Support bounding-box and radius-based geographic filtering in search
- Render map view as an alternative to the list view in search results

**Priority:** P1 — Required for MVP

---

### F6: Ticket History & Audit Trail

**Description:** Every mutation to a ticket is recorded as an immutable action entry. The history gives staff, supervisors, and auditors a complete chronological record of what happened to a ticket, who did it, and when. Action types are enumerated and structured for reporting.

**Capabilities:**
- Record an action entry for every ticket state change: open, assignment, status change, close, reopen, delete, merge
- Record response actions (staff email responses sent to constituents)
- Record comment actions (internal staff notes not sent externally)
- Record upload actions (media or file attachments added)
- Capture actor (staff person or API client), timestamp, and action payload for each entry
- Display chronological history on the ticket detail view
- Expose history in API responses for external consumers

**Priority:** P0 — Critical MVP requirement; required for audit compliance

---

### F7: Media Attachments

**Description:** Tickets can have images and files attached to them — either uploaded by the constituent at submission time or added by staff during the resolution workflow. Attachments are visible in the ticket detail view and are included in the audit trail.

**Capabilities:**
- Upload one or more image files (JPEG, PNG, GIF, WebP) to a ticket
- Upload one or more non-image files (PDF, documents) to a ticket
- Associate attachments with a specific action in the ticket history (see F6)
- Display image thumbnails inline in the ticket detail view
- Provide download links for all attachment types
- Enforce configurable file size and type limits
- Support attachment upload via the Open311 POST endpoint (media_url field)

**Priority:** P1 — Required for MVP

---

### F8: Notification System

**Description:** uReport sends email notifications to all relevant parties when tickets are created, assigned, updated, or responded to. Staff can also receive digest-style summary emails. Notification templates are configurable (see F13).

**Capabilities:**
- Send email notification to the ticket reporter when a ticket is created (confirmation)
- Send email notification to the assigned staff member when a ticket is assigned to them
- Send email notification to the reporter when a staff response is posted on their ticket
- Send internal email notifications to staff CC'd on a ticket when it is updated
- Send digest emails summarizing open/new tickets to department staff (configurable frequency)
- Track which notifications have been sent per ticket to avoid duplicates
- Configure SMTP connection settings via site configuration
- Use response templates for notification body content (see F13)

**Priority:** P1 — Required for MVP

---

### F9: Reporting & Metrics

**Description:** Supervisors and administrators need visibility into ticket volume, staff performance, SLA compliance, and departmental workload. uReport provides a set of standard reports and a metrics endpoint for real-time SLA percentage tracking.

**Capabilities:**
- Activity report: ticket counts by time period, with open/closed breakdown
- Assignment report: tickets per staff member with status distribution
- Category report: ticket volume per category with SLA compliance rates
- Department report: ticket volume and resolution rates per department
- Staff performance report: per-staff response times and closure rates
- SLA report: on-time vs. late closure rates per category and overall
- Volume report: daily/weekly/monthly submission trends
- Open ticket age report: tickets open beyond their SLA threshold
- Metrics API endpoint: on-time SLA percentage per category (consumed by external dashboards)
- Export reports as CSV

**Priority:** P1 — Required for MVP

---

### F10: Role-Based Access Control

**Description:** Access to uReport's features is governed by roles assigned to person records. Roles determine what a user can see, create, edit, and delete — including whether anonymous (unauthenticated) users can submit or view tickets in specific categories.

**Capabilities:**
- Defined roles: `admin`, `staff`, `public` (authenticated citizen), and anonymous (unauthenticated)
- Admins can configure all system settings, manage users, and access all tickets
- Staff can manage tickets in their assigned department(s) and view all permitted categories
- Public users can submit tickets in categories that permit public posting and view their own submissions
- Anonymous users can submit tickets in categories that permit anonymous posting and view public ticket lists
- Per-category display permission: public, staff-only, or anonymous-visible
- Per-category posting permission: staff-only, public-authenticated, or anonymous-allowed
- API endpoints enforce role checks; Open311 endpoints use API key authorization (see F14)
- Role stored on `people.role` column; enforced server-side on every request

**Priority:** P0 — Critical MVP requirement

---

### F11: Authentication

**Description:** uReport uses OpenID Connect (OIDC) as its authentication protocol. Staff log in via a configured OIDC provider (e.g., city SSO, Keycloak, Auth0). On the modernized stack, OIDC tokens are exchanged for JWT-backed sessions that are verified on every API request.

**Capabilities:**
- OIDC authorization code flow for staff login
- Configurable OIDC provider (issuer, client ID, client secret via site config)
- JWT session tokens issued after successful OIDC exchange
- Session validation on every authenticated API request
- Logout flow that invalidates the session and redirects to OIDC provider logout
- Role resolved from `people.role` after OIDC identity is matched to a person record
- Unauthenticated access permitted for public/anonymous endpoints (see F10)
- Secure, HttpOnly cookie-based session storage for the SPA

**Priority:** P0 — Critical MVP requirement

---

### F12: Bookmark & Saved Search Management

**Description:** Staff who regularly monitor specific subsets of tickets can save their current search filter configuration as a named bookmark. Bookmarks are personal to each user and can be recalled with one click from the search interface.

**Capabilities:**
- Save the current search query and filter state as a named bookmark
- List all bookmarks for the currently authenticated user
- Load a saved bookmark to restore the search state
- Delete a saved bookmark
- Bookmarks are user-scoped and not visible to other users
- Bookmarks persist across sessions

**Priority:** P2 — Standard feature; not MVP-blocking

---

### F13: Response Templates

**Description:** Staff frequently send similar email responses to constituents (e.g., "We have received your report and will investigate within X days"). Response templates allow administrators to define reusable message bodies that staff can select when posting a response on a ticket.

**Capabilities:**
- Create, edit, and delete response templates with a name and body text
- Support template variables (e.g., `{{ticket_id}}`, `{{category}}`, `{{assignee_name}}`) in the body
- Select a template when composing a ticket response in the staff UI
- Templates are available globally (not per-department) in MVP; per-department scoping is a future enhancement
- Templates are also available for use in automated notification emails (see F8)

**Priority:** P2 — Standard feature; improves staff efficiency

---

### F14: API Client Management

**Description:** Third-party Open311 clients are identified by API keys. Administrators manage these API key records, associating each key with a client name and contact information for accountability and rate-limiting.

**Capabilities:**
- Create a new API client record with name, contact email, and generated API key
- List all registered API clients
- Revoke (deactivate) an API client key
- Regenerate an API key for an existing client
- API key is passed as a parameter in Open311 requests (`api_key` field)
- Requests without a valid API key are permitted for public endpoints but logged as anonymous
- Client identity is recorded in the ticket audit trail for Open311-submitted tickets

**Priority:** P2 — Standard feature; required for production Open311 operation

---

### F15: Modern React/Next.js SPA Frontend

**Description:** The primary new deliverable of this modernization. The legacy PHP template rendering is replaced by a React 18+ / Next.js 15+ single-page application with TypeScript. The SPA consumes the new RESTful JSON API (F16) and the preserved Open311 endpoint (F1) to deliver a mobile-responsive, WCAG 2.1 AA-accessible interface for all staff and citizen-facing workflows.

**Capabilities:**
- Full staff-facing ticket management UI: list, search, detail, create, edit, assign, close, reopen
- Full public/citizen-facing submission and tracking portal
- Integrated map view for geospatial ticket visualization (F5)
- Reporting and metrics dashboards (F9)
- Admin configuration screens: departments, categories, people, templates, API clients
- Authentication flow: OIDC login, logout, session management (F11)
- Mobile-responsive layouts (replaces desktop-only legacy CSS)
- WCAG 2.1 AA accessibility compliance across all pages
- TypeScript throughout with strict null checks enabled
- Component library (Radix UI / shadcn/ui or equivalent) for accessible, consistent UI primitives
- Client-side form validation with server-side error surfacing
- OpenAPI-generated TypeScript client types for type-safe API calls
- Hot module replacement in development; production build with asset optimization

**Priority:** P0 — Primary new deliverable of this modernization project

---

### F16: RESTful JSON API Backend

**Description:** The second primary new deliverable. All data retrieval and mutation operations currently performed by PHP controllers rendering templates are refactored into clean, documented RESTful JSON API endpoints. The Open311 endpoint surface (F1) is preserved unchanged. The new internal API follows REST conventions, is described by an OpenAPI spec, and is consumed exclusively by the SPA frontend (F15) and authorized API clients.

**Capabilities:**
- RESTful endpoints for all ticket operations: CRUD, assign, close, reopen, merge
- RESTful endpoints for all admin operations: departments, categories, people, templates, API clients
- RESTful endpoints for search, filtering, and reporting (delegates to Solr where applicable)
- Authentication via JWT session validation on every protected endpoint (F11)
- Role-based authorization enforced at the controller layer (F10)
- Consistent JSON response envelope: `{ data, meta, errors }`
- HTTP status codes used correctly (200, 201, 400, 401, 403, 404, 422, 500)
- OpenAPI 3.1 specification document auto-generated and served at `/api/docs`
- Input validation with structured error responses (field-level messages)
- Database access via a clean repository pattern (PDO refactored, or Doctrine DBAL)
- Preserved Open311 endpoint at `/open311/` — not modified by this feature
- Multi-format output (CSV, print) exposed as content-negotiated variants or query parameters

**Priority:** P0 — Primary new deliverable of this modernization project

---

### F17: Substatus Management

**Description:** Tickets have a primary status of open or closed, but municipalities often need finer-grained state tracking (e.g., "Pending Parts", "Scheduled", "Referred to Third Party"). Substatuses allow administrators to define additional states that can be applied within the open or closed primary status, with one substatus configurable as the default for each primary state.

**Capabilities:**
- Create, edit, and deactivate substatus records with a label and associated primary status (open or closed)
- Assign a substatus to a ticket at any point in its lifecycle
- Configure a default substatus for newly opened tickets and newly closed tickets
- Display the substatus alongside the primary status in ticket lists and detail views
- Filter ticket search by substatus (see F4)
- Substatus changes are recorded in the ticket audit trail (see F6)

**Priority:** P1 — Required for MVP; existing validated feature

---

### F18: Ticket Merging

**Description:** When constituents report the same issue multiple times (e.g., the same pothole reported by five different residents), staff can merge the duplicate tickets into a single canonical record. The merged duplicates are closed and linked to the canonical ticket.

**Capabilities:**
- Search for and select a target ticket to merge the current ticket into
- Confirm merge action with a preview of both tickets
- On merge: close the source ticket, link it to the target, and preserve its history as a merged-in record
- Notify the reporter of the merged ticket with the canonical ticket ID
- Merged tickets are visible in the canonical ticket's history (see F6)
- Merged tickets are flagged in search results as merged/closed

**Priority:** P2 — Standard feature; existing validated capability

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Ticket list and search pages must return results in under 2 seconds at p95 under normal municipal load (< 500 concurrent users) |
| NFR-02 | Performance | Open311 API endpoints must respond in under 500ms at p95 for single-resource requests |
| NFR-03 | Availability | The system must target 99.5% uptime on standard Apache + Linux deployments |
| NFR-04 | Accessibility | The new SPA frontend must meet WCAG 2.1 Level AA on all pages before launch |
| NFR-05 | Responsiveness | All SPA views must be fully functional and usable on viewport widths from 375px (mobile) to 1920px (desktop) |
| NFR-06 | Security | All API endpoints must enforce authentication and authorization; no data leakage to unauthorized roles |
| NFR-07 | Security | HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) must be set on all responses |
| NFR-08 | Security | All user-supplied input must be sanitized and validated server-side; SQL injection and XSS must be prevented |
| NFR-09 | Open311 Compliance | The Open311 GeoReport v2 API must pass the full Open311 test suite after modernization |
| NFR-10 | Compatibility | MySQL schema upgrades must be provided as migration scripts; in-place upgrades from the legacy schema must work without data loss |
| NFR-11 | Licensing | All new code must be AGPL-3.0 compatible; no GPL-incompatible dependencies |
| NFR-12 | Deployability | The application must support Apache + Linux, Docker Compose, and Ansible deployment without custom infrastructure |
| NFR-13 | Observability | All errors must be forwarded to Graylog; structured logging must be used throughout |
| NFR-14 | Testability | Backend must have ≥ 70% unit test coverage; all API endpoints must have integration tests; critical user flows must have e2e Playwright tests |
| NFR-15 | Developer Experience | TypeScript strict mode enabled on the frontend; PHPStan level 8+ on backend; lint and type checks enforced in CI |
| NFR-16 | Internationalization | All user-facing strings must remain externalized via GNU gettext; no hard-coded English strings in templates or components |

---

## 7. Success Metrics

### Modernization Completion

- **100% functional parity**: All features listed in the "Validated" section of PROJECT.md are accessible and working in the new stack — verified by an automated e2e test suite with zero regressions from the legacy system
- **Open311 spec compliance**: The new API stack passes the Open311 GeoReport v2 compliance test suite with 0 failures
- **OpenAPI coverage**: Every non-Open311 API endpoint is described in the OpenAPI 3.1 spec document (100% coverage)
- **Frontend migration complete**: Zero PHP template files are served to end users; all HTML is rendered by the Next.js SPA

### Quality Gates

- **Test coverage**: Backend unit test coverage ≥ 70%; 100% of REST API endpoints have at least one integration test; all 10 critical user journeys covered by Playwright e2e tests
- **Type safety**: TypeScript strict mode passes with 0 errors; PHPStan level 8 passes with 0 errors on the new API layer
- **CI passing**: All GitHub Actions workflows (lint, type-check, unit test, integration test, e2e) pass on every pull request to main
- **Accessibility**: Automated WCAG 2.1 AA audit (axe-core) passes with 0 critical violations on all primary SPA routes

### Performance Benchmarks

- **p95 ticket list response time** ≤ 2 seconds under simulated load of 100 concurrent staff users
- **p95 Open311 endpoint response time** ≤ 500ms for single-resource GET requests
- **Lighthouse performance score** ≥ 85 on the ticket list and search pages (mobile profile)

### Operational Continuity

- **Zero downtime migration**: Existing deployments can upgrade to the modernized stack using provided migration scripts without data loss
- **External client continuity**: No Open311 API client requires code changes to continue operating against the modernized endpoint

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Open311 API surface regression during refactor breaks external clients | Medium | Critical | Freeze the Open311 endpoint contract; write Open311 spec compliance tests before any refactoring; run tests on every PR |
| Incremental modernization leaves zombie PHP template code paths alongside new API paths, creating dual-maintenance burden | High | High | Define a clear deprecation boundary: new API routes are added to the new controller layer; old template routes are removed feature-by-feature after SPA coverage is verified |
| MySQL schema changes during repository-layer refactor cause data loss on existing deployments | Low | Critical | All schema changes delivered as versioned migration scripts (e.g., Phinx); tested against a snapshot of production-schema data in CI |
| OIDC configuration differences between legacy `facile-it/php-openid-client` and the new JWT session model break staff login for existing deployments | Medium | High | Preserve OIDC configuration parameters; write auth integration tests against a local Keycloak container in CI |
| SPA accessibility debt: component library choices introduce inaccessible patterns that fail WCAG 2.1 AA | Medium | Medium | Require axe-core automated a11y tests in CI from day one; select a component library with established accessibility track record (Radix UI) |
| Full-text search parity: Solr query behavior differs subtly between legacy PHP client and new abstraction layer | Low | Medium | Capture legacy Solr query logs; write search regression tests using real query samples against a Solr test container |
| Scope creep: stakeholders request new features during modernization, diluting focus on parity | Medium | Medium | Define strict MVP scope as "parity + modernization"; new features must be logged as post-MVP issues and deferred |
| AGPL-3.0 license incompatibility introduced by a new dependency | Low | High | Audit every new dependency for license compatibility before merging; use `license-checker` in CI |

---

## 9. Feature Index

| ID | Feature | Category | Priority | Status |
|----|---------|----------|----------|--------|
| F0 | Ticket Lifecycle Management | Core | P0 | Validated (existing) |
| F1 | Open311 GeoReport v2 API Compliance | Integration | P0 | Validated (existing) |
| F2 | Department & Category Management | Administration | P0 | Validated (existing) |
| F3 | People & Contact Management | Administration | P1 | Validated (existing) |
| F4 | Full-Text Search & Filtering | Search | P1 | Validated (existing) |
| F5 | Geospatial Features | Location | P1 | Validated (existing) |
| F6 | Ticket History & Audit Trail | Compliance | P0 | Validated (existing) |
| F7 | Media Attachments | Core | P1 | Validated (existing) |
| F8 | Notification System | Communication | P1 | Validated (existing) |
| F9 | Reporting & Metrics | Analytics | P1 | Validated (existing) |
| F10 | Role-Based Access Control | Security | P0 | Validated (existing) |
| F11 | Authentication (OIDC) | Security | P0 | Validated (existing) |
| F12 | Bookmark / Saved Search Management | Search | P2 | Validated (existing) |
| F13 | Response Templates | Communication | P2 | Validated (existing) |
| F14 | API Client Management | Integration | P2 | Validated (existing) |
| F15 | Modern React/Next.js SPA Frontend | Modernization | P0 | **New deliverable** |
| F16 | RESTful JSON API Backend | Modernization | P0 | **New deliverable** |
| F17 | Substatus Management | Core | P1 | Validated (existing) |
| F18 | Ticket Merging | Core | P2 | Validated (existing) |

### Priority Summary

| Priority | Count | Features |
|----------|-------|---------|
| P0 — Critical / MVP-blocking | 7 | F0, F1, F2, F6, F10, F11, F15, F16 |
| P1 — Required for MVP | 7 | F3, F4, F5, F7, F8, F9, F17 |
| P2 — Standard / Post-core | 4 | F12, F13, F14, F18 |
| P3 — Future / Out of Scope | 0 | — |

> **Note:** P0 counts 8 features (F0, F1, F2, F6, F10, F11, F15, F16). Features F15 and F16 are the primary new modernization deliverables; all other P0 features are existing validated capabilities that must be preserved with full parity in the modernized stack.

---

*Document generated: 2026-06-23*  
*Based on: `.planning/PROJECT.md` — uReport CRM Modernization*  
*Next documents: FRD-uReport.md · TechArch-uReport.md · UserStories-uReport.md*
