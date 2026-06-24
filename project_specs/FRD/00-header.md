# Functional Requirements Document: uReport Modernization

**Project:** uReport CRM — Municipal Constituent Issue Tracking System  
**Acronym:** uReport  
**FRD Version:** 1.0  
**PRD Version:** 1.0  
**Date:** 2026-06-24  
**Status:** Active  
**Migration Type:** Brownfield — PHP/MySQL/Solr → React 18 + Java 21 (Spring Boot 3.x) + PostgreSQL 16  

---

## Scope

This document provides detailed functional specifications for all 21 feature areas (F0–F20) of the uReport modernization. It is the authoritative implementation contract for the React frontend, Spring Boot backend, and PostgreSQL database layers. Every section specifies inputs, outputs, validation rules, error states, API endpoints, and database schema. The system must reproduce 100% of the legacy PHP/MySQL/Solr behavior with zero functional regression.

---

## Conventions

- **Feature IDs:** F0–F20 match PRD feature numbers exactly.
- **API prefix:** All internal REST endpoints are prefixed `/api/v1/`. Open311 endpoints are prefixed `/open311/`.
- **HTTP methods:** Standard REST — GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove).
- **Auth header:** `Authorization: Bearer <jwt>` for staff/public endpoints; `api_key` query param or form field for Open311 write endpoints.
- **Format param:** `?format=json` (default) or `?format=xml` for Open311 and legacy-compatible endpoints.
- **Error shape:** All API errors return `{ "error": "<code>", "message": "<human-readable>" }` with appropriate HTTP status.
- **Pagination:** Default page size 25; configurable via `?limit=` and `?offset=` (or `?page=`).
- **DDL:** Full PostgreSQL DDL in `Y0a–Y0d-schema-*.md`. Per-feature sections summarize affected tables only.
- **API full spec:** Full endpoint request/response schemas in `Y1a–Y1c-api-*.md`. Per-feature sections list endpoint names only.

---

## Table of Contents

### Feature Chunks
- [F00 — Ticket / Case Lifecycle Management](F00-ticket-lifecycle.md)
- [F01 — Ticket History and Action Log](F01-ticket-history.md)
- [F02 — Open311 GeoReport v2 REST API](F02-open311-api.md)
- [F03 — Role-Based Access Control (RBAC)](F03-rbac.md)
- [F04 — Authentication — JWT / Spring Security](F04-authentication.md)
- [F05 — People / Contact Management](F05-people.md)
- [F06 — Department Administration](F06-departments.md)
- [F07 — Category and Category-Group Management](F07-categories.md)
- [F08 — Substatus System](F08-substatus.md)
- [F09 — Action Types and Response Templates](F09-actions.md)
- [F10 — Media / Attachment Upload and Thumbnail Caching](F10-media.md)
- [F11 — Full-Text Search (PostgreSQL FTS replacing Solr)](F11-search.md)
- [F12 — Bookmarks (Staff Saved Searches)](F12-bookmarks.md)
- [F13 — API Client Management](F13-api-clients.md)
- [F14 — Contact Method Tracking](F14-contact-methods.md)
- [F15 — Location / Address Management and Geo-Cluster Analysis](F15-locations-geo.md)
- [F16 — Digest Email Notifications](F16-notifications.md)
- [F17 — Metrics and Reporting Dashboard](F17-metrics.md)
- [F18 — Multi-Format Output Feeds](F18-multiformat.md)
- [F19 — Issue Type Management](F19-issue-types.md)
- [F20 — Response Templates](F20-response-templates.md)

### Cross-Feature Chunks
- [Y0a — Database Schema: Core Tickets & Media](Y0a-schema-core.md)
- [Y0b — Database Schema: People & Clients](Y0b-schema-people.md)
- [Y0c — Database Schema: Categories & Actions](Y0c-schema-categories.md)
- [Y0d — Database Schema: Geo & Misc](Y0d-schema-geo.md)
- [Y1a — REST API: Auth, People, Departments, Clients](Y1a-api-auth-people.md)
- [Y1b — REST API: Tickets, History, Search, Media, Bookmarks](Y1b-api-tickets.md)
- [Y1c — REST API: Admin (Categories, Actions, Substatus, Metrics)](Y1c-api-admin.md)
- [Y2 — Cross-Feature Error Catalog](Y2-errors.md)
- [Y3 — Integration Points](Y3-integrations.md)

---

## Cross-Cutting Terminology

- **Ticket:** A constituent-reported issue/case tracked through a lifecycle (open → assigned → closed). Equivalent to an Open311 "service request."
- **Substatus:** A fine-grained lifecycle state (e.g., Resolved, Duplicate, Bogus) that maps to either `open` or `closed` parent status.
- **Category:** A service type definition (e.g., "Pothole", "Graffiti"). Equivalent to an Open311 "service." Contains routing, permission, SLA, and custom field configuration.
- **Category Group:** A named container grouping related categories for display ordering.
- **Department:** An organizational unit (e.g., Streets, Sanitation) that owns categories and has assigned staff.
- **Person:** A record in the `people` table representing either a staff user (has `username`/`role`) or a constituent contact.
- **Action:** A named event type that can occur on a ticket (e.g., "open", "assignment", "closed"). Drives history entries and notification templates.
- **ticketHistory:** An immutable append-only log of every action performed on a ticket.
- **Staff:** A person with `role = 'staff'` — authenticated municipality employee.
- **Public:** A person with `role = 'public'` — authenticated constituent.
- **Anonymous:** An unauthenticated request origin.
- **Open311:** The GeoReport v2 standard API for civic issue reporting (see http://wiki.open311.org/GeoReport_v2/).
- **JWT:** JSON Web Token used for stateless authentication of staff and public users.
- **API Key:** A shared secret string assigned to an API client for Open311 write authentication.
- **FTS:** PostgreSQL Full-Text Search, replacing legacy Apache Solr 7.4.
- **SLA Days:** Service Level Agreement target — number of days within which a ticket in a given category should be closed.
- **Custom Fields:** A JSON blob on a category defining constituent-supplied structured data fields; values stored on the ticket.
- **Geo-Cluster:** A spatial grouping of nearby tickets at a given zoom level for map view display.
- **Client:** An external application registered to use the Open311 API (see `clients` table).
- **Contact Method:** The channel through which a ticket was submitted (Email, Phone, Web Form, Other).
- **Issue Type:** A secondary ticket classification: Comment, Complaint, Question, Report, Request, Violation.
- **Response Template:** Pre-authored text for common staff ticket responses, linked to action types.
- **Bookmark:** A staff user's saved ticket search URI with a name.
- **Digest Notification:** A scheduled outbound email to a constituent or staff member summarizing ticket activity.
- **Permission Level:** One of `anonymous`, `public`, or `staff`, used to gate both display and posting access.

---

*FRD-uReport v1.0 | Generated 2026-06-24*
