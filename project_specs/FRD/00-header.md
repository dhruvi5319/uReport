# Functional Requirements Document — uReport CRM Modernization

**Project:** UReport  
**Acronym:** UReport  
**Version:** 1.0  
**Date:** 2026-07-06  
**Status:** Active  
**Classification:** Internal — Engineering  
**Depends On:** PRD-UReport.md v1.0  

---

## Scope

This FRD specifies the detailed functional behavior of every feature in the uReport CRM modernization. It covers all UI screens, API endpoints (Open311/GeoReport v2 + internal CRM API), database schema (PostgreSQL), authentication flows, business rules, validation, and error handling. The modernization is a technology stack replacement — PHP/MySQL/Solr → React/Spring Boot/PostgreSQL — preserving 100% of existing capabilities.

---

## Conventions

- **Feature IDs** correspond to PRD-UReport.md section identifiers: F0–F21.
- **Table references** use the PostgreSQL table name (snake_case).
- **API endpoint paths** are relative to the API base. Open311 paths are frozen at their current values.
- **HTTP status codes** follow RFC 7231.
- **Validation rules** apply to both frontend pre-validation and backend server-side validation. Backend validation is authoritative.
- **"Existing behavior"** means byte-compatible with the PHP reference implementation.
- `[R]` = Required field. `[O]` = Optional field.
- Timestamps are ISO 8601 format (UTC) in JSON responses.
- All SQL types described are PostgreSQL types.

---

## Master Table of Contents

| Chunk File | Feature / Section |
|---|---|
| `00-header.md` | This document — conventions, TOC, shared terminology |
| `F00-open311-api.md` | F0: Open311 / GeoReport v2 API (Frozen Contract) |
| `F01-ticket-lifecycle.md` | F1: Ticket / Case Lifecycle Management |
| `F02-public-submission.md` | F2: Public Case Submission Form |
| `F03-case-list.md` | F3: Case List with Search, Filtering, and Sorting |
| `F04-case-detail.md` | F4: Case Detail View |
| `F05-dashboard.md` | F5: Dashboard |
| `F06-people-mgmt.md` | F6: People Management |
| `F07-department-mgmt.md` | F7: Department Management |
| `F08-category-mgmt.md` | F8: Category and Category Group Management |
| `F09-action-logging.md` | F9: Action / Response Logging and Email Notifications |
| `F10-media-upload.md` | F10: Media / Photo Attachment Upload |
| `F11-fts.md` | F11: PostgreSQL Full-Text Search (Solr Replacement) |
| `F12-auth.md` | F12: Authentication — LDAP and CAS |
| `F13-admin-panels.md` | F13: Admin Panels — Substatus, Issue Types, Templates, Contact Methods |
| `F14-client-mgmt.md` | F14: Client / API Key Management |
| `F15-metrics-reporting.md` | F15: Metrics and Reporting |
| `F16-geoclustering.md` | F16: Geo-Clustering for Map Views |
| `F17-design-system.md` | F17: Design System and UI Framework |
| `F18-navigation-shell.md` | F18: Navigation Shell |
| `F19-accessibility.md` | F19: Accessibility and Responsive Design |
| `F20-openapi-docs.md` | F20: OpenAPI / Swagger API Documentation |
| `F21-db-migration.md` | F21: Database Migration — MySQL to PostgreSQL (Flyway) |
| `Y0-schema.md` | Database Schema — Full PostgreSQL DDL (all 18 tables) |
| `Y1-api.md` | API Endpoints — Consolidated REST endpoint catalog |
| `Y2-errors.md` | Error Catalog — Cross-feature HTTP error codes and messages |
| `Y3-integrations.md` | Integration Points — External system dependencies |

---

## Cross-Cutting Terminology

- **Ticket** — A civic 311 service request (core domain entity). Also called "case" in the UI. Stored in `tickets` table.
- **Action** — A history event on a ticket (open, assign, close, response, comment, media upload). Stored in `ticket_history` table. Action *types* are defined in the `actions` lookup table.
- **Category** — A classification of service request type (e.g., "Pothole", "Graffiti"). Belongs to a CategoryGroup and a Department.
- **CategoryGroup** — A grouping of related categories (e.g., "Streets", "Sanitation").
- **Department** — An organizational unit that owns categories and receives ticket assignments.
- **Person** — Any individual in the system: staff, reporter, or assignee. Stored in `people` table.
- **Substatus** — A refined status value applied to closed tickets (e.g., Resolved, Duplicate, Bogus). Stored in `substatus` table.
- **Open311 / GeoReport v2** — The public REST API standard for civic 311 service requests. External clients consume this API.
- **Client** — An external Open311 API consumer (mobile app, aggregator) registered in the `clients` table with an API key.
- **JWT** — JSON Web Token issued by Spring Boot after successful LDAP/CAS authentication; used to authenticate all subsequent internal API calls.
- **tsvector / tsquery** — PostgreSQL full-text search data types. A `search_vector` tsvector column on `tickets` is kept synchronized via trigger and indexed with GIN.
- **CAS** — Central Authentication Service; staff SSO provider.
- **LDAP** — Lightweight Directory Access Protocol; alternative staff authentication provider.
- **IssueType** — Classification of the nature of a service request (Comment, Complaint, Question, Report, Request, Violation).
- **ContactMethod** — How a reporter contacted the city (Email, Phone, Web Form, Other).
- **Bookmark** — A saved search query persisted per-user in the `bookmarks` table.
- **Media** — Photo or file attachments associated with a ticket or action history entry. Stored in `media` table; files on disk.
- **Geocluster** — A pre-computed geographic cluster of ticket pins for map rendering at low zoom levels. Stored in `geoclusters` and `ticket_geodata` tables.
- **SLA** — Service Level Agreement; `categories.slaDays` defines the expected resolution window per category.
- **Flyway** — Database migration tool; all PostgreSQL schema changes are versioned as `V{n}__description.sql` scripts.
- **Content Negotiation** — The same API endpoints return JSON, XML, or HTML based on the HTTP `Accept` header or a `.json` / `.xml` format suffix in the URL path or `format` query parameter.

---

## Priority Legend

| Code | Meaning |
|---|---|
| P0 | Critical — blocks system operation or is a hard external contract |
| P1 | High — required for day-to-day staff workflows |
| P2 | Medium — important for management; does not block operations |

---

*FRD-UReport v1.0 — 2026-07-06*
