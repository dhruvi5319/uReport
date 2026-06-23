# Functional Requirements Document
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Acronym:** uReport  
**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Active  
**License:** AGPL-3.0  
**Based on:** PRD-uReport.md v1.0  

---

## Scope

This FRD specifies the detailed functional behavior of every feature in the uReport modernization. It covers the new RESTful JSON API backend (F16), the new React/Next.js SPA frontend (F15), and all preserved existing capabilities (F0–F14, F17–F18). For each feature it defines: inputs, outputs, validation rules, process steps, error states, API surface, and database schema surface. Full DDL is in `Y0a-schema-core.md` / `Y0b-schema-supporting.md`; full API specs are in `Y1a-api-tickets.md` / `Y1b-api-admin.md`; error catalog is in `Y2-errors.md`; integration points in `Y3-integrations.md`.

---

## Conventions

- **Feature IDs** follow PRD numbering: F0–F18. Chunks are zero-padded (`F00`–`F18`).
- **HTTP verbs** are uppercase: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- **JSON envelope** for all new API responses: `{ "data": …, "meta": …, "errors": [] }`.
- **Auth tokens** are JWT Bearer tokens delivered in `Authorization: Bearer <token>` header, plus HttpOnly cookie fallback for SPA.
- **Role names**: `admin`, `staff`, `public` (authenticated citizen), `anonymous` (unauthenticated).
- **Primary status values**: `open`, `closed`.
- **Cross-references** use `see F{nn}` or `see §{section}`.
- **Table names** reference the existing MySQL schema unless noted as new.
- **Open311 endpoints** are preserved verbatim at `/open311/`; they are not modified by F16.
- **Validation errors** return HTTP 422 with field-level messages: `{ "errors": [{ "field": "…", "message": "…" }] }`.

---

## Master Table of Contents

| Chunk | File | Description |
|-------|------|-------------|
| Header | `00-header.md` | This file — scope, conventions, TOC, shared terminology |
| F00 | `F00-ticket-lifecycle.md` | Ticket Lifecycle Management |
| F01 | `F01-open311.md` | Open311 GeoReport v2 API Compliance |
| F02 | `F02-dept-category.md` | Department & Category Management |
| F03 | `F03-people-contacts.md` | People & Contact Management |
| F04 | `F04-search-filtering.md` | Full-Text Search & Filtering |
| F05 | `F05-geospatial.md` | Geospatial Features |
| F06 | `F06-history-audit.md` | Ticket History & Audit Trail |
| F07 | `F07-media-attachments.md` | Media Attachments |
| F08 | `F08-notifications.md` | Notification System |
| F09 | `F09-reporting-metrics.md` | Reporting & Metrics |
| F10 | `F10-rbac.md` | Role-Based Access Control |
| F11 | `F11-authentication.md` | Authentication (OIDC + JWT) |
| F12 | `F12-bookmarks.md` | Bookmark / Saved Search Management |
| F13 | `F13-response-templates.md` | Response Templates |
| F14 | `F14-api-clients.md` | API Client Management |
| F15 | `F15-spa-frontend.md` | Modern React/Next.js SPA Frontend |
| F16 | `F16-json-api-backend.md` | RESTful JSON API Backend |
| F17 | `F17-substatus.md` | Substatus Management |
| F18 | `F18-ticket-merging.md` | Ticket Merging |
| Y0a | `Y0a-schema-core.md` | DDL: tickets, people, departments, categories, actions, media |
| Y0b | `Y0b-schema-supporting.md` | DDL: substatus, templates, bookmarks, clients, geoclusters, geodata, misc |
| Y1a | `Y1a-api-tickets.md` | REST API: Ticket, Search, Reporting, Geo endpoints |
| Y1b | `Y1b-api-admin.md` | REST API: Admin (departments, categories, people, templates, clients, auth) |
| Y2 | `Y2-errors.md` | Cross-feature Error Catalog |
| Y3 | `Y3-integrations.md` | External Integration Points |

---

## Cross-Cutting Terminology

| Term | Definition |
|------|-----------|
| **Ticket** | A constituent service request record. The core unit of work. Maps to `tickets` table. |
| **Action** | An immutable audit entry recording a mutation on a ticket (open, assign, close, response, comment, upload, merge). Maps to `actions` table. |
| **Person** | A user record for either staff or a constituent. Maps to `people` table. |
| **Department** | An organizational unit that owns a queue of tickets. Maps to `departments` table. |
| **Category** | A service-request type (e.g., "Pothole") that routes tickets to a department. Maps to `categories` table. |
| **Substatus** | A fine-grained state label within the open or closed primary status. Maps to `substatus` table. |
| **Response** | A staff message sent externally to the ticket reporter via email. Stored as an action of type `response`. |
| **Comment** | A staff internal note not sent externally. Stored as an action of type `comment`. |
| **SLA** | Service Level Agreement; the number of business days a category allows for ticket resolution (`categories.slaDays`). |
| **Open311** | The GeoReport v2 open API standard for civic service requests. Endpoint preserved at `/open311/`. |
| **API Client** | A third-party system identified by an API key, authorized to submit Open311 requests. Maps to `clients` table. |
| **Bookmark** | A saved search filter state per user. Maps to `bookmarks` table. |
| **JWT** | JSON Web Token. Used for session authentication on all protected API endpoints. |
| **OIDC** | OpenID Connect; the authentication protocol used for staff login. |
| **Solr** | Apache Solr — full-text search and geospatial indexing service. |
| **Graylog** | Centralized log aggregation service. All structured server-side errors are forwarded here. |
| **Repository Pattern** | Database access abstraction layer. Controllers call repository interfaces; repositories execute SQL via PDO/DBAL. |
| **JSON Envelope** | Standard API response wrapper: `{ "data": any, "meta": { "page": int, "total": int, … }, "errors": [] }`. |
| **Media** | File or image attachment on a ticket. Maps to `media` table. |
| **GeoCluster** | A spatial grid cell used for map density visualization. Maps to `geoclusters` table. |
| **Contact Method** | An email, phone, or address record for a person. Maps to `contactMethods` table. |

---

*End of header chunk. Continue reading feature chunks F00–F18, then cross-feature chunks Y0a–Y3.*
