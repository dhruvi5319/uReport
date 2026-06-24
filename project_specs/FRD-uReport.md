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
---

## F00: Ticket / Case Lifecycle Management

**Description:** The ticket (case) is the core entity of uReport. Staff and public users create tickets for constituent issues, and staff manage them through their full lifecycle from opening through assignment, updates, closure, reopening, and duplicate detection. Every state change is recorded in an immutable history log (`ticketHistory`). Tickets are the primary unit tracked by the Open311 API and the metrics system.

---

### Terminology

- **Open status:** A ticket that has not yet been resolved; `status = 'open'`.
- **Closed status:** A ticket that has been resolved, marked duplicate, or otherwise finalized; `status = 'closed'`.
- **Assigned status:** A ticket with a non-null `assignedPerson_id`; it remains `open`.
- **Substatus:** Fine-grained state within open or closed (see F08).
- **Parent ticket:** A ticket that another ticket (`child`) has been marked a duplicate of; referenced via `parent_id`.
- **Issue Type:** Secondary classification (Comment, Complaint, Question, Report, Request, Violation); see F19.
- **Custom Fields:** Per-category JSON schema values attached to a ticket; stored as JSON in `tickets.customFields`.
- **additionalFields:** Supplementary location/address data from the AddressService, stored as JSON in `tickets.additionalFields`.
- **enteredByPerson:** The staff user who created the ticket record in the system.
- **reportedByPerson:** The constituent who originally reported the issue.
- **assignedPerson:** The staff member currently responsible for resolving the ticket.

---

### Sub-features

- Create ticket (staff or public/anonymous per category permission)
- Assign ticket to a staff person
- Update ticket fields (category, location, description, custom fields, assigned person)
- Close ticket with substatus
- Mark ticket as duplicate of parent ticket
- Reopen closed ticket
- Change ticket category (with history)
- Change ticket location (with history)
- Record free-text comment on ticket
- Filter and search tickets (see F11)
- Export ticket list in CSV, print HTML formats (staff only)
- Display ticket list in list or map view

---

### Process

#### Create Ticket
1. Client submits POST `/api/v1/tickets` with required fields (category_id, description, location fields, reportedByPerson_id or reporter contact info).
2. System validates category is active and caller has posting permission (see F03).
3. System creates `people` record for reporter if not found (by email/name lookup).
4. System creates `tickets` row with `status = 'open'`, `enteredDate = NOW()`, `lastModified = NOW()`.
5. System looks up default substatus for `open` and assigns it.
6. System assigns `assignedPerson_id` to category's `defaultPerson_id` if set.
7. System writes a `ticketHistory` entry with `action_id` = (id of system action "open").
8. System returns created ticket with 201 Created.

#### Assign Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}/assign` with `assignedPerson_id`.
2. System validates ticket is open and target person exists.
3. System updates `tickets.assignedPerson_id` and `lastModified`.
4. System appends `ticketHistory` entry with action "assignment".
5. Digest notification scheduled (see F16).

#### Update Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}` with changed fields.
2. System validates role is `staff`.
3. For category change: records old and new `category_id` in history `data` JSON; appends "changeCategory" history entry.
4. For location change: records old and new address in history `data` JSON; appends "changeLocation" history entry.
5. System updates `tickets` row and `lastModified`.
6. System appends "update" history entry with changed fields in `data`.

#### Close Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}/close` with `substatus_id` (must map to `status = 'closed'`).
2. System validates substatus exists and is `closed`-type.
3. System updates `tickets.status = 'closed'`, `closedDate = NOW()`, `substatus_id`.
4. System appends "closed" history entry.
5. Digest notification scheduled (see F16).

#### Mark Duplicate
1. Staff submits PATCH `/api/v1/tickets/{id}/duplicate` with `parent_id`.
2. System validates parent ticket exists and is not itself a child.
3. System sets `tickets.parent_id = parent_id`, `status = 'closed'`, closes with Duplicate substatus.
4. System appends "duplicate" history entry with `data = { "duplicate": parent_id }`.

#### Reopen Ticket
1. Staff submits PATCH `/api/v1/tickets/{id}/reopen`.
2. System validates ticket is closed.
3. System updates `status = 'open'`, clears `closedDate`, assigns default open substatus.
4. System appends "update" history entry with `notes = 'Reopened'`.

#### Record Comment
1. Staff or permitted user submits POST `/api/v1/tickets/{id}/comments` with `notes`.
2. System appends "comment" history entry with `notes` text.

---

### Inputs

- `category_id` (integer, required): Category this ticket belongs to.
- `description` (text, required): Free-text description of the issue.
- `location` (string, optional): Human-readable address string.
- `city` (string, optional): City of the reported location.
- `state` (string, optional): State abbreviation (2 chars).
- `zip` (string, optional): ZIP code.
- `latitude` (decimal, optional): Latitude coordinate.
- `longitude` (decimal, optional): Longitude coordinate.
- `reportedByPerson_id` (integer, optional): FK to `people.id`; if absent, reporter info fields used.
- `reporterFirstname` (string, optional): Used if no existing person found.
- `reporterLastname` (string, optional): Used if no existing person found.
- `reporterEmail` (string, optional): Used if no existing person found; creates `peopleEmails` record.
- `assignedPerson_id` (integer, optional): Staff person to assign ticket to.
- `issueType_id` (integer, optional): FK to `issueTypes.id`.
- `contactMethod_id` (integer, optional): FK to `contactMethods.id`.
- `responseMethod_id` (integer, optional): FK to `contactMethods.id` (preferred response channel).
- `substatus_id` (integer, optional): FK to `substatus.id`; applied on close.
- `parent_id` (integer, optional): FK to `tickets.id`; set when marking duplicate.
- `customFields` (JSON, optional): Values matching category's `customFields` schema.
- `additionalFields` (JSON, optional): Supplementary address fields from AddressService.
- `client_id` (integer, optional): FK to `clients.id`; set when ticket arrives via API client.

---

### Outputs

- **201 Created:** Full ticket object (see API spec `Y1b-api-tickets.md §POST /api/v1/tickets`).
- **200 OK:** Updated/closed ticket object.
- **Ticket object fields:** id, parent_id, category_id, category (name), issueType_id, client_id, enteredByPerson_id, reportedByPerson_id, assignedPerson_id, contactMethod_id, responseMethod_id, enteredDate (ISO 8601), lastModified (ISO 8601), addressId, latitude, longitude, location, city, state, zip, status, closedDate, substatus_id, substatus (name), additionalFields, customFields, description, historyCount, mediaCount.

---

### Validation Rules

- `category_id` must reference an active category (`categories.active = true`).
- Caller's role must satisfy category's `postingPermissionLevel` (anonymous ≤ public ≤ staff).
- `description` must be non-empty; max 65,535 characters.
- `status` transitions: open → open (update/assign), open → closed (close/duplicate), closed → open (reopen).
- Closing requires a `substatus_id` whose `status = 'closed'`.
- `substatus_id` used on reopen must reference a substatus with `status = 'open'`.
- `assignedPerson_id` must reference a person with `role = 'staff'`.
- `parent_id` must reference an existing ticket; circular parentage is forbidden.
- `latitude` must be in range [-90, 90]; `longitude` in range [-180, 180].
- `customFields` JSON must conform to the schema defined in `categories.customFields` for the ticket's category.
- `issueType_id` must reference a valid `issueTypes.id` if provided.
- `contactMethod_id` must reference a valid `contactMethods.id` if provided.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Category not found or inactive | 404 | CATEGORY_NOT_FOUND | "Category not found or inactive" |
| Insufficient posting permission | 403 | PERMISSION_DENIED | "Insufficient permission to post to this category" |
| Ticket not found | 404 | TICKET_NOT_FOUND | "Ticket not found" |
| Invalid substatus for close (wrong type) | 422 | INVALID_SUBSTATUS | "Substatus must be a closed-type substatus" |
| Invalid status transition (e.g., close already-closed) | 422 | INVALID_TRANSITION | "Invalid status transition" |
| Circular duplicate parentage | 422 | CIRCULAR_DUPLICATE | "Ticket cannot be its own ancestor" |
| assignedPerson not staff | 422 | INVALID_ASSIGNEE | "Assigned person must have staff role" |
| Invalid lat/long range | 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" |
| description empty | 422 | DESCRIPTION_REQUIRED | "Description is required" |

---

### API Surface (this feature)

See full request/response schemas in `Y1b-api-tickets.md`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/tickets` | staff/public/anonymous (per category) | Create ticket |
| GET | `/api/v1/tickets/{id}` | staff/public (per display permission) | Get ticket detail |
| PATCH | `/api/v1/tickets/{id}` | staff | Update ticket fields |
| PATCH | `/api/v1/tickets/{id}/assign` | staff | Assign ticket |
| PATCH | `/api/v1/tickets/{id}/close` | staff | Close ticket |
| PATCH | `/api/v1/tickets/{id}/reopen` | staff | Reopen ticket |
| PATCH | `/api/v1/tickets/{id}/duplicate` | staff | Mark as duplicate |
| POST | `/api/v1/tickets/{id}/comments` | staff | Add comment |
| DELETE | `/api/v1/tickets/{id}` | staff | Delete ticket (admin only) |

---

### Schema Surface (this feature)

Primary table: `tickets`. See full DDL in `Y0a-schema-core.md §tickets`.

Key columns: id (BIGSERIAL PK), parent_id (FK tickets), category_id (FK categories), issueType_id (FK issueTypes), client_id (FK clients), enteredByPerson_id (FK people), reportedByPerson_id (FK people), assignedPerson_id (FK people), contactMethod_id (FK contactMethods), responseMethod_id (FK contactMethods), enteredDate (TIMESTAMPTZ), lastModified (TIMESTAMPTZ), addressId (FK locations), latitude (NUMERIC 9,6), longitude (NUMERIC 9,6), location (TEXT), city (VARCHAR 100), state (VARCHAR 2), zip (VARCHAR 10), status (VARCHAR 20 CHECK IN ('open','closed')), closedDate (TIMESTAMPTZ), substatus_id (FK substatus), additionalFields (JSONB), customFields (JSONB), description (TEXT).
---

## F01: Ticket History and Action Log

**Description:** Every change to a ticket is recorded as an immutable `ticketHistory` entry linked to an action type. Action description templates use `{variable}` placeholder substitution so descriptions are rendered dynamically at read time rather than stored as static strings. Each history entry also records which email notifications were dispatched, supporting the digest notification system (F16).

---

### Terminology

- **History Entry:** A single record in `ticketHistory` representing one event on a ticket.
- **Action:** A named event type from the `actions` table (see F09). System actions are fixed; departments may define custom actions.
- **Template Variable:** A `{placeholder}` token in an action's `description` or `template` field resolved at render time (e.g., `{actionPerson}`, `{original:category_id}`).
- **enteredByPerson:** The person who performed the action (e.g., the staff member who closed the ticket).
- **actionPerson:** The person the action was performed *on* (e.g., the newly assigned staff member).
- **sentNotifications:** Serialized list of email addresses that received notifications for this history entry.
- **data (JSON):** Structured field-level change data stored per history entry (e.g., `{"original": {"category_id": 5}, "updated": {"category_id": 12}}`).
- **notes:** Free-text annotation attached to a history entry (e.g., staff comment text).

---

### Sub-features

- Append history entry for any ticket lifecycle event
- Store action performer, action subject, timestamps
- Store free-text notes and structured JSON data per entry
- Store sent notification recipients per entry
- Render action description by interpolating template variables at read time
- Display full history log on ticket detail view
- Support all system action types
- Support department-defined custom action types

---

### System Action Types (seed data)

| Action Name | Type | Template (example) |
|-------------|------|--------------------|
| open | system | "Ticket opened by {enteredByPerson}" |
| assignment | system | "Assigned to {actionPerson} by {enteredByPerson}" |
| closed | system | "Closed by {enteredByPerson}" |
| changeCategory | system | "Category changed from {original:category_id} to {updated:category_id} by {enteredByPerson}" |
| changeLocation | system | "Location changed from {original:location} to {updated:location} by {enteredByPerson}" |
| response | system | "Response recorded by {enteredByPerson}" |
| duplicate | system | "Marked as duplicate of #{duplicate:ticket_id} by {enteredByPerson}" |
| update | system | "Updated by {enteredByPerson}" |
| comment | system | "Comment added by {enteredByPerson}" |
| upload_media | system | "Media uploaded by {enteredByPerson}" |

---

### Process

#### Appending a History Entry
1. A ticket lifecycle action occurs (create, assign, close, update, comment, upload, etc.).
2. The service layer calls `TicketHistoryService.append(ticketId, actionId, enteredByPersonId, actionPersonId, notes, data)`.
3. System resolves `enteredDate = NOW()` and `actionDate = NOW()` (may differ if backfilling; default both to NOW).
4. System inserts a row into `ticketHistory`.
5. System queues any pending notifications (see F16) using the action's template and the category's `notificationReplyEmail`.
6. After notifications sent, system updates `ticketHistory.sentNotifications` with the list of email addresses notified.

#### Rendering History Descriptions
1. Client requests GET `/api/v1/tickets/{id}/history` or ticket detail view.
2. System fetches all `ticketHistory` rows for the ticket, joined with `actions`.
3. For each entry, system interpolates template variables:
   - `{enteredByPerson}` → full name from `people` lookup by `enteredByPerson_id`.
   - `{actionPerson}` → full name from `people` lookup by `actionPerson_id`.
   - `{reportedByPerson_id}` → full name from `people` lookup on ticket.
   - `{original:field}` → value from `data.original.field`.
   - `{updated:field}` → value from `data.updated.field`.
   - `{duplicate:ticket_id}` → ticket ID from `data.duplicate`.
   - Unknown variable tokens are left as-is (no exception thrown).
4. System returns rendered history list to client.

#### Displaying History
- History entries are ordered by `enteredDate ASC` (oldest first) on ticket detail.
- Staff see full history including internal notes.
- Public/anonymous users see only history entries associated with public-facing action types.

---

### Inputs

- `ticket_id` (BIGINT, required): The ticket this history entry belongs to.
- `action_id` (INTEGER, required): FK to `actions.id`.
- `enteredByPerson_id` (INTEGER, optional): FK to `people.id`; null for system-generated entries.
- `actionPerson_id` (INTEGER, optional): FK to `people.id`; the person acted upon.
- `enteredDate` (TIMESTAMPTZ, optional): Defaults to NOW().
- `actionDate` (TIMESTAMPTZ, optional): Defaults to NOW().
- `notes` (TEXT, optional): Free-text annotation.
- `data` (JSONB, optional): Structured change data with `original` and `updated` keys.
- `sentNotifications` (TEXT, optional): Serialized email list (comma-separated or JSON array).

---

### Outputs

- **History entry object:** id, ticket_id, action_id, action (name, type, template), enteredByPerson_id, enteredByPerson (name), actionPerson_id, actionPerson (name), enteredDate, actionDate, notes, data, sentNotifications, renderedDescription.
- **History list:** Array of history entry objects, ordered by `enteredDate ASC`.

---

### Validation Rules

- `ticket_id` must reference an existing ticket.
- `action_id` must reference an existing action.
- `enteredByPerson_id` must reference an existing person if provided.
- `actionPerson_id` must reference an existing person if provided.
- History entries are **immutable** after insert — no UPDATE or DELETE is permitted by the application layer.
- `data` must be valid JSON (JSONB constraint enforced by PostgreSQL).
- System action templates must not be modified by the application (read-only in the system).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Ticket not found | 404 | TICKET_NOT_FOUND | "Ticket not found" |
| Action not found | 422 | ACTION_NOT_FOUND | "Action type not found" |
| enteredByPerson not found | 422 | PERSON_NOT_FOUND | "Entered-by person not found" |
| actionPerson not found | 422 | PERSON_NOT_FOUND | "Action person not found" |
| Attempt to modify history entry | 405 | METHOD_NOT_ALLOWED | "Ticket history entries are immutable" |

---

### API Surface (this feature)

See full request/response schemas in `Y1b-api-tickets.md`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/tickets/{id}/history` | staff | Get full history for a ticket |
| GET | `/api/v1/tickets/{id}/history/{historyId}` | staff | Get single history entry |

*(History entries are written internally by the service layer, not directly via API.)*

---

### Schema Surface (this feature)

Primary table: `ticketHistory`. See full DDL in `Y0a-schema-core.md §ticketHistory`.

Key columns: id (BIGSERIAL PK), ticket_id (FK tickets), enteredByPerson_id (FK people), actionPerson_id (FK people), action_id (FK actions), enteredDate (TIMESTAMPTZ), actionDate (TIMESTAMPTZ), notes (TEXT), data (JSONB), sentNotifications (TEXT).
---

## F02: Open311 GeoReport v2 REST API

**Description:** uReport exposes a fully Open311 GeoReport v2 compliant REST API consumed by external municipality systems, mobile apps, and third-party integrators. All six Open311 endpoints must produce byte-compatible JSON and XML responses compared to the current PHP implementation. API key authentication is required for write operations; read operations may be anonymous or authenticated.

---

### Terminology

- **Open311 / GeoReport v2:** An open standard for civic issue reporting APIs. See http://wiki.open311.org/GeoReport_v2/.
- **service_code:** The Open311 identifier for a service type — maps to `categories.id` in uReport.
- **service_request_id:** The Open311 identifier for a submitted request — maps to `tickets.id`.
- **service:** An Open311 service definition — maps to a uReport `category`.
- **api_key:** A shared secret required for POST /requests; validated against `clients.api_key`.
- **Obsolete API key:** A key in the server-side `OBSOLETE_API_KEYS` list that triggers a mobile-app-shutdown JSON response instead of a normal error.
- **discovery:** The Open311 discovery endpoint returning API metadata (endpoint URLs, changeset, formats).
- **format:** Response format; `json` (default) or `xml`. Passed as `?format=xml` or HTTP Accept header.

---

### Sub-features

- GET /open311/discovery — API metadata
- GET /open311/services — list all active postable services
- GET /open311/services/{service_code} — single service with attribute schema
- POST /open311/requests — submit a new service request
- GET /open311/requests — search/list service requests
- GET /open311/requests/{service_request_id} — retrieve a single request
- JSON and XML format support for all endpoints
- API key validation for POST
- Obsolete API key detection
- Category posting permission level enforcement

---

### Process

#### GET /open311/discovery
1. System reads configured endpoint URLs, jurisdiction_id, changeset date from config.
2. Returns discovery object with `changeset`, `contact`, `key_service`, and `endpoints` array.
3. Supports `format=json` and `format=xml`.

#### GET /open311/services
1. System queries all categories where `active = true` AND `postingPermissionLevel IN ('public','anonymous')`.
2. Maps each category to an Open311 service object (see field mapping below).
3. Returns array ordered by `categoryGroups.ordering`, then `categories.name`.
4. If `service_code` query param present, filters to that single service (equivalent to GET /services/{code}).
5. Supports `format=json` and `format=xml`.

#### GET /open311/services/{service_code}
1. System looks up category by `id = service_code`.
2. If not found → 404.
3. Returns single service definition including `attributes` array from `categories.customFields` schema.
4. Supports `format=json` and `format=xml`.

#### POST /open311/requests
1. System validates `api_key` against `clients.api_key` (hashed comparison).
2. If key is in OBSOLETE_API_KEYS list → return 200 with mobile-shutdown JSON payload (no ticket created).
3. If key invalid or missing → 403.
4. System resolves `service_code` to a category; validates category exists and is postable.
5. System creates or matches a `people` record from `first_name`, `last_name`, `email`, `phone`.
6. System creates ticket via same logic as F00 Create Ticket (steps 4–8).
7. Sets `tickets.client_id` to the authenticated client's id.
8. Returns array with single Open311 service request object containing `service_request_id` and `token` (same as id).
9. Appends "open" history entry with `enteredByPerson_id = null` (API-submitted).
10. Schedules digest notification (F16).

#### GET /open311/requests
1. Supports filter params: `service_request_id`, `service_code`, `status`, `start_date`, `end_date`, `lat`, `long`, `radius` (meters), `keyword`, `page`, `per_page` (default 50, max 200).
2. System builds query joining `tickets` with `categories`, `people`, `media`.
3. Returns array of Open311 request objects.
4. `status` filter maps: `open` → `tickets.status = 'open'`; `closed` → `tickets.status = 'closed'`.
5. Supports `format=json` and `format=xml`.

#### GET /open311/requests/{service_request_id}
1. System looks up ticket by id.
2. If not found → 404.
3. Returns array with single Open311 request object.
4. Includes `media_url` if ticket has attachments (first image URL).
5. Supports `format=json` and `format=xml`.

---

### Open311 Service Object Field Mapping (category → service)

| Open311 Field | uReport Source |
|---------------|---------------|
| service_code | categories.id |
| service_name | categories.name |
| description | categories.description |
| metadata | "true" if customFields non-empty, else "false" |
| type | "realtime" |
| keywords | categories.name |
| group | categoryGroups.name |

---

### Open311 Service Attributes (customFields → attributes)

Each key in `categories.customFields` maps to an Open311 attribute:

| Open311 Attribute Field | customFields Source |
|------------------------|-------------------|
| variable | true |
| code | field key |
| datatype | field type (string/number/singlevaluelist/multivaluelist/datetime) |
| required | field.required |
| description | field.label |
| order | field.order |
| values | field.options (for list types) |

---

### Open311 Request Object Field Mapping (ticket → request)

| Open311 Field | uReport Source |
|---------------|---------------|
| service_request_id | tickets.id |
| status | tickets.status |
| status_notes | substatus.name |
| service_name | categories.name |
| service_code | categories.id |
| description | tickets.description |
| agency_responsible | people.firstname + lastname (assignedPerson) |
| requested_datetime | tickets.enteredDate (ISO 8601) |
| updated_datetime | tickets.lastModified (ISO 8601) |
| expected_datetime | enteredDate + category.slaDays (ISO 8601, if slaDays set) |
| lat | tickets.latitude |
| long | tickets.longitude |
| address | tickets.location |
| address_id | tickets.addressId |
| zipcode | tickets.zip |
| media_url | First media URL if attachments exist |

---

### Inputs (POST /open311/requests)

- `api_key` (string, required): Client API key.
- `service_code` (string, required): Category ID.
- `lat` (decimal, optional): Latitude.
- `long` (decimal, optional): Longitude.
- `address_string` (string, optional): Street address.
- `address_id` (string, optional): Canonical address ID.
- `email` (string, optional): Reporter email.
- `device_id` (string, optional): Mobile device identifier (logged, not persisted).
- `account_id` (string, optional): External account identifier.
- `first_name` (string, optional): Reporter first name.
- `last_name` (string, optional): Reporter last name.
- `phone` (string, optional): Reporter phone.
- `description` (string, optional): Issue description.
- `media_url` (string, optional): URL of attached media (linked, not downloaded).
- `attribute[key]` (string, optional): Custom field values, one per attribute code.

---

### Outputs

- **GET /open311/services:** JSON array of service objects or XML `<services>` document.
- **POST /open311/requests:** JSON array `[{"service_request_id": "123", "service_notice": "", "account_id": ""}]` or XML equivalent.
- **GET /open311/requests:** JSON array of request objects or XML `<service_requests>` document.
- **GET /open311/requests/{id}:** JSON array (single element) or XML `<service_requests>` (single element).
- **GET /open311/discovery:** JSON discovery object or XML equivalent.
- **Obsolete key response:** `{"shutdown": true, "message": "<shutdown notice>"}` (200 OK).

---

### Validation Rules

- `api_key` on POST must match an active `clients.api_key` (stored hashed; compared via bcrypt).
- Obsolete API keys return shutdown notice before any other processing.
- `service_code` must reference a category with `active = true` and `postingPermissionLevel` that permits anonymous/public posting.
- `lat` must be [-90, 90]; `long` must be [-180, 180] if provided.
- At least one of `lat`+`long` or `address_string` should be provided (soft validation — system does not reject if missing, matching legacy behavior).
- `per_page` maximum is 200; minimum is 1.
- `start_date` and `end_date` must be ISO 8601 datetime strings if provided.
- `format` must be `json` or `xml`; defaults to `json`.
- XML output must use exact element names as defined in GeoReport v2 spec (byte-compatible).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Missing or invalid api_key | 403 | API_KEY_INVALID | "Invalid or missing api_key" |
| Obsolete api_key | 200 | — | Shutdown JSON payload |
| service_code not found | 404 | SERVICE_NOT_FOUND | "Service not found" |
| Category not postable (permission) | 403 | PERMISSION_DENIED | "Service does not allow public posting" |
| Invalid lat/long | 422 | INVALID_COORDINATES | "Invalid coordinates" |
| Invalid format param | 400 | INVALID_FORMAT | "Format must be json or xml" |
| service_request_id not found | 404 | REQUEST_NOT_FOUND | "Service request not found" |

---

### API Surface (this feature)

Full request/response schemas in `Y1b-api-tickets.md §Open311`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/open311/discovery` | none | Discovery metadata |
| GET | `/open311/services` | none | List all services |
| GET | `/open311/services/{service_code}` | none | Single service with attributes |
| POST | `/open311/requests` | api_key | Submit service request |
| GET | `/open311/requests` | none | List/filter service requests |
| GET | `/open311/requests/{service_request_id}` | none | Get single service request |

---

### Schema Surface (this feature)

Uses: `tickets`, `categories`, `categoryGroups`, `people`, `clients`, `media`, `substatus`. No new tables. See `Y0a-schema-core.md` and `Y0c-schema-categories.md`.
---

## F03: Role-Based Access Control (RBAC)

**Description:** uReport enforces three permission levels across all controllers: `anonymous` (unauthenticated), `public` (authenticated constituent), and `staff` (authenticated municipality employee). Categories independently configure `displayPermissionLevel` and `postingPermissionLevel`. The `Person.role` field and a static `isAllowed(resource, action)` method gate every protected operation. All existing role names and permission semantics must be preserved exactly.

---

### Terminology

- **anonymous:** An unauthenticated request (no JWT, no API key).
- **public:** A request authenticated as a non-staff user (`people.role = 'public'`).
- **staff:** A request authenticated as a municipality employee (`people.role = 'staff'`).
- **displayPermissionLevel:** The minimum role required to *view* a category and its tickets.
- **postingPermissionLevel:** The minimum role required to *create* a ticket in a category.
- **isAllowed(resource, action):** A server-side gate that returns boolean given the current user's role and the requested resource/action pair. Implemented as a Spring Security method or a custom `PermissionEvaluator`.
- **Permission hierarchy:** `anonymous < public < staff` (staff can do everything public can; public can do everything anonymous can).

---

### Sub-features

- Role encoding in JWT claims (F04)
- Role-based endpoint access guards (Spring Security annotations)
- Per-category display permission enforcement
- Per-category posting permission enforcement
- Open311 posting permission enforcement (per category)
- Export/CSV/print gating to staff only
- Admin screen gating to staff only

---

### Permission Matrix

| Resource / Action | anonymous | public | staff |
|-------------------|-----------|--------|-------|
| View category (displayPermissionLevel=anonymous) | ✓ | ✓ | ✓ |
| View category (displayPermissionLevel=public) | ✗ | ✓ | ✓ |
| View category (displayPermissionLevel=staff) | ✗ | ✗ | ✓ |
| Create ticket (postingPermissionLevel=anonymous) | ✓ | ✓ | ✓ |
| Create ticket (postingPermissionLevel=public) | ✗ | ✓ | ✓ |
| Create ticket (postingPermissionLevel=staff) | ✗ | ✗ | ✓ |
| View ticket detail (category display permission) | per category | per category | ✓ |
| Assign ticket | ✗ | ✗ | ✓ |
| Close ticket | ✗ | ✗ | ✓ |
| Reopen ticket | ✗ | ✗ | ✓ |
| Update ticket | ✗ | ✗ | ✓ |
| Mark duplicate | ✗ | ✗ | ✓ |
| Delete ticket | ✗ | ✗ | ✓ |
| Export CSV/print | ✗ | ✗ | ✓ |
| View ticket history | ✗ | ✗ | ✓ |
| Admin: departments | ✗ | ✗ | ✓ |
| Admin: categories | ✗ | ✗ | ✓ |
| Admin: people | ✗ | ✗ | ✓ |
| Admin: clients | ✗ | ✗ | ✓ |
| Admin: substatus | ✗ | ✗ | ✓ |
| Admin: actions | ✗ | ✗ | ✓ |
| Admin: bookmarks (own) | ✗ | ✗ | ✓ |
| Upload media to ticket | per category permission | per category permission | ✓ |
| View metrics/reports | ✗ | ✗ | ✓ |
| Open311 POST /requests | api_key + postingPermissionLevel | api_key + postingPermissionLevel | api_key + any |

---

### Process

1. Every HTTP request passes through the Spring Security filter chain.
2. If JWT is present and valid, the user's role is extracted from the `role` claim (see F04).
3. If no JWT and no API key, the request is treated as `anonymous`.
4. For each protected endpoint, a Spring Security `@PreAuthorize` annotation or a custom `PermissionEvaluator` evaluates the current principal's role.
5. For category-gated operations (view, post), the service layer additionally checks `category.displayPermissionLevel` / `category.postingPermissionLevel` against the current role using the hierarchy: `anonymous(0) < public(1) < staff(2)`.
6. If the check fails, the system returns HTTP 403 with `PERMISSION_DENIED`.
7. For Open311 API write operations, the `api_key` is validated against `clients.api_key` first (F13), then the category posting permission level is checked.

---

### Inputs

- JWT Bearer token (from `Authorization` header) — carries `sub` (person_id) and `role` claims.
- `api_key` query/form param for Open311 write endpoints.
- `category_id` (implicit from request context) for per-category permission checks.

---

### Outputs

- Transparent pass-through on success (the guarded operation proceeds).
- HTTP 401 if authentication is required but not provided.
- HTTP 403 if authenticated but insufficient role.

---

### Validation Rules

- Role values are exactly: `staff`, `public`, `anonymous` (lowercase, no variants).
- Permission level values are exactly: `staff`, `public`, `anonymous`.
- A user with role `staff` is implicitly allowed for any permission level.
- A user with role `public` is allowed for permission levels `public` and `anonymous`.
- An unauthenticated request is only allowed for permission level `anonymous`.
- Permission levels on categories must be one of the three valid values; invalid values reject at category creation (F07).
- The `isAllowed` check is performed server-side; the React SPA also enforces display gating for UX but the API is the security boundary.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| No auth provided for protected endpoint | 401 | UNAUTHORIZED | "Authentication required" |
| Role insufficient for operation | 403 | PERMISSION_DENIED | "Insufficient permissions" |
| Category display permission denied | 403 | PERMISSION_DENIED | "You do not have permission to view this category" |
| Category posting permission denied | 403 | PERMISSION_DENIED | "You do not have permission to post to this category" |

---

### Schema Surface (this feature)

Uses `people.role` (VARCHAR 20 CHECK IN ('staff','public','anonymous')) and `categories.displayPermissionLevel`, `categories.postingPermissionLevel` (VARCHAR 20 CHECK IN ('staff','public','anonymous')). No dedicated RBAC table — permissions are derived from JWT role and category config.
---

## F04: Authentication — JWT / Spring Security

**Description:** The legacy PHP session-based authentication is replaced with stateless JWT-based authentication via Spring Security. Staff users log in with username/password and receive a short-lived access token plus a refresh token. External API clients authenticate via API key on Open311 write endpoints. An OAuth callback endpoint supports external identity provider flows.

---

### Terminology

- **Access Token:** A short-lived JWT (default 1-hour expiry) encoding the user's identity and role.
- **Refresh Token:** A longer-lived token (default 24-hour expiry) stored server-side (or as a secure HttpOnly cookie) used to obtain new access tokens without re-login.
- **JWT Claims:** Payload fields in the JWT — `sub` (person_id), `role`, `iat`, `exp`, `iss`.
- **Spring Security:** The Java framework handling filter chains, token validation, and method-level authorization.
- **Token Blacklist:** A server-side store (e.g., Redis or DB table) of invalidated token JTIs for logout support.
- **OAuth Callback:** `GET /callback` — receives an authorization code from an external identity provider and maps it to a local `people` record.
- **MSAL / OIDC:** External identity providers optionally used for SSO login (callback endpoint only).

---

### Sub-features

- Staff login with username + password
- JWT access token issuance
- Refresh token issuance and rotation
- Token validation middleware (Spring Security filter)
- Logout / token invalidation
- OAuth/external identity callback handler
- API key authentication (Open311 write, validated against clients table)
- Role loading from `people.role` into JWT claims

---

### Process

#### Staff Login
1. Client POSTs to `POST /api/v1/auth/login` with `username` and `password`.
2. System looks up `people` record by `username`.
3. System verifies password against `people.passwordHash` using BCrypt.
4. If credentials invalid → 401.
5. System generates JWT with claims: `sub = people.id`, `role = people.role`, `iat = now`, `exp = now + 1h`, `iss = "ureport"`, `jti = UUID`.
6. System generates refresh token: `UUID`, stored in `refresh_tokens` table with `person_id`, `expiresAt = now + 24h`, `revoked = false`.
7. Returns `{ "accessToken": "<jwt>", "refreshToken": "<uuid>", "expiresIn": 3600, "role": "staff" }`.

#### Token Refresh
1. Client POSTs to `POST /api/v1/auth/refresh` with `refreshToken`.
2. System looks up refresh token in `refresh_tokens`; validates not revoked and not expired.
3. System revokes the old refresh token (rotation).
4. System issues new access token and new refresh token.
5. Returns same shape as login response.

#### Logout
1. Client POSTs to `POST /api/v1/auth/logout` with `refreshToken` (or reads from cookie).
2. System marks refresh token as revoked in `refresh_tokens`.
3. System adds the access token's `jti` to a token blacklist (TTL = remaining exp).
4. Returns 200 OK.

#### Token Validation (Every Request)
1. Spring Security `JwtAuthenticationFilter` intercepts every request.
2. Extracts Bearer token from `Authorization` header.
3. Validates signature, expiry, and issuer.
4. Checks `jti` against blacklist (if blacklist enabled).
5. If valid, sets `SecurityContextHolder` with authenticated principal (person_id + role).
6. If invalid/expired → 401.

#### OAuth Callback
1. External IdP redirects to `GET /callback?code=<auth_code>&state=<csrf_state>`.
2. System validates CSRF state.
3. System exchanges auth code for IdP token.
4. System extracts identity claim (email or sub) from IdP token.
5. System looks up `people` by email or external ID.
6. If not found → 404 (no auto-registration; staff must pre-exist).
7. System issues local JWT + refresh token as in login flow.
8. Redirects to SPA with tokens.

#### API Key Authentication (Open311)
1. Request to `POST /open311/requests` includes `api_key` parameter.
2. Spring Security `ApiKeyAuthenticationFilter` (separate from JWT filter) intercepts Open311 routes.
3. Looks up `clients` by hashed `api_key`.
4. If found → sets an `ApiKeyPrincipal` in security context with `client_id`.
5. If not found → 403.
6. Obsolete key check occurs before client lookup (F02).

---

### Inputs

**Login:**
- `username` (string, required): Person's username.
- `password` (string, required): Plain-text password (never logged).

**Refresh:**
- `refreshToken` (string, required): Refresh token UUID.

**Logout:**
- `refreshToken` (string, required): Refresh token to invalidate.

**OAuth Callback:**
- `code` (string, required): Authorization code from IdP.
- `state` (string, required): CSRF state token.

---

### Outputs

**Login/Refresh Response:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<uuid>",
  "expiresIn": 3600,
  "role": "staff",
  "personId": 42
}
```

**Logout Response:** `200 OK`, empty body.

**OAuth Callback:** Redirect to SPA with query params or cookie set.

---

### Validation Rules

- `username` must be non-empty and exist in `people` table.
- `password` must match BCrypt hash in `people.passwordHash`.
- JWT signing algorithm: HS256 or RS256 (configurable via `app.jwt.algorithm`).
- JWT secret key min length: 256 bits for HS256.
- Access token expiry: configurable, default 3600 seconds.
- Refresh token expiry: configurable, default 86400 seconds.
- Refresh tokens are single-use (rotated on each refresh).
- On logout, both the refresh token and the access token `jti` are invalidated.
- `people.passwordHash` must be stored as BCrypt (cost factor ≥ 10).
- API keys are stored hashed in `clients.api_key` (BCrypt or SHA-256 + salt).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Invalid username or password | 401 | AUTH_FAILED | "Invalid username or password" |
| Account not found | 401 | AUTH_FAILED | "Invalid username or password" |
| Expired access token | 401 | TOKEN_EXPIRED | "Access token has expired" |
| Invalid/malformed token | 401 | TOKEN_INVALID | "Invalid token" |
| Blacklisted token (post-logout) | 401 | TOKEN_REVOKED | "Token has been revoked" |
| Expired/revoked refresh token | 401 | REFRESH_TOKEN_INVALID | "Refresh token is invalid or expired" |
| Invalid OAuth state (CSRF) | 400 | OAUTH_STATE_INVALID | "Invalid OAuth state parameter" |
| OAuth identity not found | 404 | PERSON_NOT_FOUND | "No account found for this identity" |
| Missing api_key | 403 | API_KEY_REQUIRED | "API key is required" |
| Invalid api_key | 403 | API_KEY_INVALID | "Invalid API key" |

---

### API Surface (this feature)

See full request/response schemas in `Y1a-api-auth-people.md §Auth`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | none | Authenticate with username/password |
| POST | `/api/v1/auth/refresh` | none (refresh token) | Rotate access + refresh tokens |
| POST | `/api/v1/auth/logout` | Bearer JWT | Revoke tokens |
| GET | `/callback` | none (OAuth code) | OAuth identity provider callback |

---

### Schema Surface (this feature)

New tables: `refresh_tokens`, `token_blacklist`. See `Y0b-schema-people.md §Auth`.

`people.passwordHash` (VARCHAR 255): BCrypt hash of password. `people.username` (VARCHAR 100 UNIQUE).
`refresh_tokens`: id (UUID PK), person_id (FK people), createdAt, expiresAt, revoked (BOOLEAN).
`token_blacklist`: jti (VARCHAR 36 PK), expiresAt (TIMESTAMPTZ) — cleaned up after expiry by scheduler.
---

## F05: People / Contact Management

**Description:** The `people` table is the central identity registry for uReport, holding both staff users (who have `username`, `passwordHash`, and `role`) and constituent contacts (who may not have accounts). A person may have multiple email addresses, phone numbers, and physical addresses, each labeled. Staff manage the directory via a CRUD interface; the system also auto-creates person records from Open311 reporter info.

---

### Terminology

- **Staff Person:** A `people` record with `role = 'staff'` and a non-null `username`. Can log in.
- **Constituent Contact:** A `people` record with `role = 'public'` or null role; typically no login credentials.
- **peopleEmails:** Child table of zero-or-more email addresses per person, each with a label and `usedForNotifications` flag.
- **peoplePhones:** Child table of zero-or-more phone numbers per person, each with a label.
- **peopleAddresses:** Child table of zero-or-more addresses per person, each with a label.
- **usedForNotifications:** Flag on `peopleEmails` indicating this email should receive digest notifications for associated tickets.
- **defaultPerson:** A `people` record designated as default assignee for a department or category.

---

### Sub-features

- Create, read, update, delete person records
- Assign person to department
- Assign username, passwordHash, and role to staff users
- Manage multiple email addresses per person
- Manage multiple phone numbers per person
- Manage multiple addresses per person
- Search and filter people
- View all tickets associated with a person
- Auto-create person from Open311 reporter fields (F02)

---

### Process

#### Create Person
1. Staff POSTs to `POST /api/v1/people` with required fields.
2. System validates no existing person shares the same `username` (if username provided).
3. If `passwordHash` is not pre-hashed, system hashes the `password` with BCrypt.
4. System inserts `people` row.
5. If `emails` array provided, inserts `peopleEmails` rows.
6. If `phones` array provided, inserts `peoplePhones` rows.
7. If `addresses` array provided, inserts `peopleAddresses` rows.
8. Returns created person object with 201.

#### Search / List People
1. Staff GETs `/api/v1/people` with optional query params: `q` (name/email search), `role`, `department_id`, `organization`.
2. System performs case-insensitive ILIKE search on `firstname`, `lastname`, `organization` and JOIN email search on `peopleEmails.email`.
3. Returns paginated list.

#### Get Person's Tickets
1. Staff GETs `/api/v1/people/{id}/tickets`.
2. System queries tickets where `reportedByPerson_id = id` OR `assignedPerson_id = id` OR `enteredByPerson_id = id`.
3. Returns paginated ticket list.

#### Auto-Create from Open311
1. On POST /open311/requests, system receives `first_name`, `last_name`, `email`, `phone`.
2. System searches `people` by email (via `peopleEmails.email`).
3. If match found → use existing person_id.
4. If no match → create new `people` record with `role = 'public'`; create `peopleEmails` record.
5. Uses resulting person_id as `reportedByPerson_id` on the new ticket.

---

### Inputs

**Person record:**
- `firstname` (string, required): First name.
- `middlename` (string, optional): Middle name.
- `lastname` (string, required): Last name.
- `organization` (string, optional): Organization/company.
- `address` (string, optional): Primary street address.
- `city` (string, optional): Primary city.
- `state` (string, optional): Primary state (2 chars).
- `zip` (string, optional): Primary ZIP.
- `department_id` (integer, optional): FK to `departments.id`.
- `username` (string, optional): Login username (staff only).
- `password` (string, optional): Plain-text password (BCrypt-hashed before storage).
- `role` (string, optional): `staff`, `public`, or `anonymous`.

**Email sub-record:**
- `email` (string, required): Email address.
- `label` (string, optional): `Home`, `Work`, `Other`.
- `usedForNotifications` (boolean, optional): Default false.

**Phone sub-record:**
- `number` (string, required): Phone number (freeform).
- `label` (string, optional): `Main`, `Mobile`, `Work`, `Home`, `Fax`, `Pager`, `Other`.

**Address sub-record:**
- `address` (string, required): Street address.
- `city` (string, optional): City.
- `state` (string, optional): State.
- `zip` (string, optional): ZIP.
- `label` (string, optional): `Home`, `Business`, `Rental`.

---

### Outputs

- **Person object:** id, firstname, middlename, lastname, organization, address, city, state, zip, department_id, department (name), username, role, emails (array), phones (array), addresses (array), createdAt, updatedAt.
- **People list:** Paginated array of person objects (without sub-arrays by default; `?expand=emails,phones,addresses` to include).

---

### Validation Rules

- `firstname` and `lastname` are required; max 100 chars each.
- `username` must be unique across `people` table (case-insensitive).
- `username` must be provided if `role = 'staff'`.
- `role` must be one of: `staff`, `public`, `anonymous` (or null for contacts without a role).
- `email` values in `peopleEmails` must pass RFC 5322 format validation.
- `state` max 2 characters.
- `zip` max 10 characters.
- At most one `peopleEmails` record per person can have `usedForNotifications = true` per label type (soft rule; system does not enforce uniqueness, but digest logic uses all flagged emails).
- Phone `number` is stored as-is (no normalization); max 30 chars.
- Deleting a person is blocked if they are referenced as `reportedByPerson_id`, `assignedPerson_id`, `enteredByPerson_id` on any ticket. Soft-delete (`deletedAt` timestamp) is preferred.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Person not found | 404 | PERSON_NOT_FOUND | "Person not found" |
| Username already taken | 409 | USERNAME_CONFLICT | "Username already in use" |
| Invalid email format | 422 | INVALID_EMAIL | "Invalid email address format" |
| Invalid role value | 422 | INVALID_ROLE | "Role must be staff, public, or anonymous" |
| Delete blocked by ticket references | 409 | PERSON_IN_USE | "Person is referenced by existing tickets" |
| firstname or lastname missing | 422 | MISSING_REQUIRED_FIELD | "First name and last name are required" |

---

### API Surface (this feature)

See full request/response schemas in `Y1a-api-auth-people.md §People`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/people` | staff | List/search people |
| POST | `/api/v1/people` | staff | Create person |
| GET | `/api/v1/people/{id}` | staff | Get person detail |
| PUT | `/api/v1/people/{id}` | staff | Replace person record |
| PATCH | `/api/v1/people/{id}` | staff | Update person fields |
| DELETE | `/api/v1/people/{id}` | staff | Soft-delete person |
| GET | `/api/v1/people/{id}/tickets` | staff | Get tickets associated with person |
| POST | `/api/v1/people/{id}/emails` | staff | Add email to person |
| PUT | `/api/v1/people/{id}/emails/{emailId}` | staff | Update email record |
| DELETE | `/api/v1/people/{id}/emails/{emailId}` | staff | Remove email |
| POST | `/api/v1/people/{id}/phones` | staff | Add phone to person |
| PUT | `/api/v1/people/{id}/phones/{phoneId}` | staff | Update phone record |
| DELETE | `/api/v1/people/{id}/phones/{phoneId}` | staff | Remove phone |
| POST | `/api/v1/people/{id}/addresses` | staff | Add address to person |
| PUT | `/api/v1/people/{id}/addresses/{addrId}` | staff | Update address record |
| DELETE | `/api/v1/people/{id}/addresses/{addrId}` | staff | Remove address |

---

### Schema Surface (this feature)

Primary tables: `people`, `peopleEmails`, `peoplePhones`, `peopleAddresses`. See full DDL in `Y0b-schema-people.md §People`.

Key columns:
- `people`: id (SERIAL PK), firstname, middlename, lastname, organization, address, city, state, zip, department_id (FK), username (UNIQUE), passwordHash, role, deletedAt (TIMESTAMPTZ).
- `peopleEmails`: id (SERIAL PK), person_id (FK), email, label, usedForNotifications (BOOLEAN).
- `peoplePhones`: id (SERIAL PK), person_id (FK), number, label.
- `peopleAddresses`: id (SERIAL PK), person_id (FK), address, city, state, zip, label.
---

## F06: Department Administration

**Description:** Departments represent organizational units within the municipality (e.g., Streets, Sanitation, Parks). Each department has a name and an optional default person (default assignee for tickets routed to that department). Departments are linked to categories via `department_categories` and to available action types via `department_actions`. Staff members belong to departments via `people.department_id`.

---

### Terminology

- **defaultPerson:** The staff member automatically assigned as the default assignee for tickets belonging to this department's categories.
- **department_actions:** A join table mapping departments to the action types available to them (custom + inherited system actions).
- **department_categories:** A join table mapping departments to the categories they are responsible for.

---

### Sub-features

- Create, read, update, delete department records
- Assign a default person to a department
- Associate departments with categories
- Associate departments with action types
- View staff members belonging to a department
- View categories assigned to a department

---

### Process

#### Create Department
1. Staff POSTs to `POST /api/v1/departments` with `name` and optional `defaultPerson_id`.
2. System validates `name` is non-empty and unique.
3. System validates `defaultPerson_id` references a staff person if provided.
4. System inserts `departments` row.
5. Returns created department with 201.

#### Associate Categories
1. Staff PUTs to `PUT /api/v1/departments/{id}/categories` with array of `category_id` values.
2. System replaces the `department_categories` rows for this department (delete-and-reinsert).
3. Returns updated category list.

#### Associate Actions
1. Staff PUTs to `PUT /api/v1/departments/{id}/actions` with array of `action_id` values.
2. System replaces `department_actions` rows for this department.
3. Returns updated action list.

#### List Staff in Department
1. Staff GETs `/api/v1/departments/{id}/people`.
2. System queries `people WHERE department_id = id AND role = 'staff'`.
3. Returns paginated list.

---

### Inputs

- `name` (string, required): Department name; max 100 chars.
- `defaultPerson_id` (integer, optional): FK to `people.id`; must be a staff person.
- `category_ids` (array of integers, optional): Used when setting category associations.
- `action_ids` (array of integers, optional): Used when setting action associations.

---

### Outputs

- **Department object:** id, name, defaultPerson_id, defaultPerson (name), categoryCount, staffCount.
- **Department list:** Paginated array of department objects.
- **Categories list:** Array of category objects belonging to the department.
- **People list:** Array of staff person objects in the department.

---

### Validation Rules

- `name` is required; max 100 chars; must be unique (case-insensitive) across departments.
- `defaultPerson_id` must reference a person with `role = 'staff'` if provided.
- Deleting a department is blocked if any `categories.department_id` references it. Must reassign or delete categories first.
- `category_ids` must all reference existing categories.
- `action_ids` must all reference existing actions.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Department not found | 404 | DEPT_NOT_FOUND | "Department not found" |
| Duplicate department name | 409 | DEPT_NAME_CONFLICT | "Department name already exists" |
| defaultPerson not staff | 422 | INVALID_DEFAULT_PERSON | "Default person must have staff role" |
| Delete blocked by categories | 409 | DEPT_IN_USE | "Department has assigned categories" |
| Invalid category_id in list | 422 | CATEGORY_NOT_FOUND | "One or more category IDs not found" |
| Invalid action_id in list | 422 | ACTION_NOT_FOUND | "One or more action IDs not found" |

---

### API Surface (this feature)

See full schemas in `Y1a-api-auth-people.md §Departments`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/departments` | staff | List all departments |
| POST | `/api/v1/departments` | staff | Create department |
| GET | `/api/v1/departments/{id}` | staff | Get department detail |
| PUT | `/api/v1/departments/{id}` | staff | Update department |
| DELETE | `/api/v1/departments/{id}` | staff | Delete department |
| GET | `/api/v1/departments/{id}/people` | staff | List staff in department |
| GET | `/api/v1/departments/{id}/categories` | staff | List categories in department |
| PUT | `/api/v1/departments/{id}/categories` | staff | Set categories for department |
| PUT | `/api/v1/departments/{id}/actions` | staff | Set actions for department |

---

### Schema Surface (this feature)

Tables: `departments`, `department_actions`, `department_categories`. See `Y0c-schema-categories.md §Departments`.

- `departments`: id (SERIAL PK), name (VARCHAR 100 UNIQUE), defaultPerson_id (FK people, nullable).
- `department_actions`: department_id (FK), action_id (FK), PRIMARY KEY (department_id, action_id).
- `department_categories`: department_id (FK), category_id (FK), PRIMARY KEY (department_id, category_id).
---

## F07: Category and Category-Group Management

**Description:** Categories are the service type taxonomy for uReport (equivalent to Open311 services). They are grouped into named, ordered category groups. Each category carries rich configuration: posting/display permission levels, a custom field schema, SLA days, auto-close rules, a default assignee, per-action response templates, and notification reply email. Categories are the primary ticket routing mechanism.

---

### Terminology

- **Category Group:** A named container that groups related categories for display ordering. Has an `ordering` integer.
- **customFields:** A JSON schema stored on a category defining the structured data fields constituents must/may fill in when submitting a ticket. Values are stored on the ticket's `customFields` JSONB column.
- **slaDays:** Service Level Agreement — number of calendar days by which a ticket in this category should be closed. Used in SLA reporting (F17) and `expected_datetime` in Open311 responses.
- **autoClose:** When `autoCloseIsActive = true`, stale open tickets in this category are automatically closed to `autoCloseSubstatus_id` by the scheduled job (F16).
- **notificationReplyEmail:** The reply-to address used in outbound notification emails for tickets in this category.
- **featured:** Boolean flag indicating this category should be displayed prominently on the public submission form.
- **active:** Boolean flag; inactive categories are hidden from public and excluded from Open311 services list.
- **category_action_responses:** Per-category overrides for action description templates and reply emails (see F09).

---

### Sub-features

- Create, read, update, delete category records
- Assign category to department and optional default person
- Assign category to a category group
- Set active and featured flags
- Configure display and posting permission levels
- Define customFields JSON schema
- Set slaDays
- Set notificationReplyEmail
- Configure autoClose rule (isActive + substatus target)
- Create, read, update, delete category group records
- Set ordering on category groups
- View all categories within a group
- Manage category_action_responses (see F09)

---

### Process

#### Create Category
1. Staff POSTs to `POST /api/v1/categories` with required fields.
2. System validates `name` is non-empty; `department_id` references existing department.
3. System validates `displayPermissionLevel` and `postingPermissionLevel` are valid values.
4. System validates `autoCloseSubstatus_id` references a closed-type substatus if `autoCloseIsActive = true`.
5. System validates `customFields` is valid JSON if provided.
6. System inserts `categories` row.
7. System sets `lastModified = NOW()`.
8. Returns created category with 201.

#### Update Category
1. Staff PATCHes `/api/v1/categories/{id}`.
2. System validates changed fields as in Create.
3. System updates `categories` row and `lastModified = NOW()`.
4. Returns updated category.

#### Create Category Group
1. Staff POSTs to `POST /api/v1/category-groups` with `name` and `ordering`.
2. System inserts `categoryGroups` row.
3. Returns created group with 201.

#### Reorder Category Groups
1. Staff PUTs to `PUT /api/v1/category-groups/order` with array of `{id, ordering}` pairs.
2. System updates `ordering` on each group.

#### List Categories for Open311
- Returns all categories where `active = true` AND `postingPermissionLevel IN ('public','anonymous')`, ordered by group ordering then name. (See F02.)

---

### customFields JSON Schema Format

The `customFields` column stores a JSON array of field definition objects:

```json
[
  {
    "key": "field_key",
    "label": "Field Label",
    "type": "string|number|singlevaluelist|multivaluelist|datetime|text",
    "required": true,
    "order": 1,
    "options": ["Option A", "Option B"]
  }
]
```

- `key` must be unique within the category's fields.
- `type` values map to Open311 attribute `datatype` values.
- `options` is required for `singlevaluelist` and `multivaluelist` types.
- Ticket `customFields` JSONB stores `{ "field_key": "user_value" }` pairs.

---

### Inputs

**Category:**
- `name` (string, required): Category name; max 200 chars.
- `description` (text, optional): Description shown to constituents.
- `department_id` (integer, optional): FK to `departments.id`.
- `defaultPerson_id` (integer, optional): FK to `people.id` (staff).
- `categoryGroup_id` (integer, optional): FK to `categoryGroups.id`.
- `active` (boolean, optional): Default true.
- `featured` (boolean, optional): Default false.
- `displayPermissionLevel` (string, required): `anonymous`, `public`, or `staff`.
- `postingPermissionLevel` (string, required): `anonymous`, `public`, or `staff`.
- `customFields` (JSON array, optional): Field schema (see above).
- `slaDays` (integer, optional): SLA target days; null = no SLA.
- `notificationReplyEmail` (string, optional): Reply-to email for notifications.
- `autoCloseIsActive` (boolean, optional): Default false.
- `autoCloseSubstatus_id` (integer, optional): FK to `substatus.id` (must be closed-type).

**Category Group:**
- `name` (string, required): Group name; max 100 chars.
- `ordering` (integer, required): Display sort order.

---

### Outputs

- **Category object:** id, name, description, department_id, department (name), defaultPerson_id, defaultPerson (name), categoryGroup_id, categoryGroup (name), active, featured, displayPermissionLevel, postingPermissionLevel, customFields, slaDays, notificationReplyEmail, autoCloseIsActive, autoCloseSubstatus_id, lastModified.
- **Category Group object:** id, name, ordering, categoryCount, categories (array of category summaries).

---

### Validation Rules

- `name` required; max 200 chars.
- `displayPermissionLevel` and `postingPermissionLevel` must each be `anonymous`, `public`, or `staff`.
- `autoCloseSubstatus_id` must reference a substatus with `status = 'closed'` if `autoCloseIsActive = true`.
- `defaultPerson_id` must reference a person with `role = 'staff'` if provided.
- `customFields` must be valid JSON array conforming to field schema format.
- `slaDays` must be a positive integer if provided.
- `notificationReplyEmail` must be valid RFC 5322 email format if provided.
- Deleting a category is blocked if any tickets reference it. Deactivate (`active = false`) instead.
- Category group `ordering` values need not be unique; ties are broken by name.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Category not found | 404 | CATEGORY_NOT_FOUND | "Category not found" |
| Invalid permission level | 422 | INVALID_PERMISSION_LEVEL | "Permission level must be anonymous, public, or staff" |
| autoCloseSubstatus not closed-type | 422 | INVALID_SUBSTATUS | "Auto-close substatus must be a closed-type substatus" |
| defaultPerson not staff | 422 | INVALID_DEFAULT_PERSON | "Default person must have staff role" |
| Delete blocked by tickets | 409 | CATEGORY_IN_USE | "Category has associated tickets; deactivate instead" |
| Category group not found | 404 | GROUP_NOT_FOUND | "Category group not found" |
| Invalid customFields JSON | 422 | INVALID_CUSTOM_FIELDS | "customFields must be a valid JSON array" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Categories`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/categories` | staff/public/anonymous (per permission) | List categories |
| POST | `/api/v1/categories` | staff | Create category |
| GET | `/api/v1/categories/{id}` | staff/public/anonymous | Get category detail |
| PUT | `/api/v1/categories/{id}` | staff | Update category |
| DELETE | `/api/v1/categories/{id}` | staff | Delete category |
| GET | `/api/v1/category-groups` | staff | List category groups |
| POST | `/api/v1/category-groups` | staff | Create category group |
| GET | `/api/v1/category-groups/{id}` | staff | Get group with categories |
| PUT | `/api/v1/category-groups/{id}` | staff | Update category group |
| DELETE | `/api/v1/category-groups/{id}` | staff | Delete group |
| PUT | `/api/v1/category-groups/order` | staff | Reorder groups |

---

### Schema Surface (this feature)

Tables: `categories`, `categoryGroups`. See `Y0c-schema-categories.md §Categories`.

Key columns:
- `categoryGroups`: id (SERIAL PK), name (VARCHAR 100), ordering (INTEGER).
- `categories`: id (SERIAL PK), name (VARCHAR 200), description (TEXT), department_id (FK), defaultPerson_id (FK people, nullable), categoryGroup_id (FK categoryGroups), active (BOOLEAN DEFAULT true), featured (BOOLEAN DEFAULT false), displayPermissionLevel (VARCHAR 20), postingPermissionLevel (VARCHAR 20), customFields (JSONB), lastModified (TIMESTAMPTZ), slaDays (INTEGER), notificationReplyEmail (VARCHAR 255), autoCloseIsActive (BOOLEAN DEFAULT false), autoCloseSubstatus_id (FK substatus, nullable).
---

## F08: Substatus System

**Description:** The substatus table provides fine-grained lifecycle states beyond the binary `open`/`closed` ticket status. Each substatus maps to either `open` or `closed` parent status, carries a name and description, and may be flagged as the default for that parent status. Three system substatuses are seeded at installation; staff may define additional custom substatuses. Substatuses are used on ticket close, auto-close rules, and as search filters.

---

### Terminology

- **Parent Status:** The binary ticket status this substatus belongs to — either `open` or `closed`.
- **isDefault:** Boolean flag indicating this substatus is the system default for its parent status. Exactly one substatus per parent status should have `isDefault = true`.
- **System substatus:** A pre-seeded substatus that cannot be deleted (Resolved, Duplicate, Bogus — all `closed`-type).
- **Auto-close substatus:** The substatus applied when the category auto-close job fires (must be `closed`-type).

---

### Sub-features

- Create, read, update, delete substatus records
- Associate each substatus with parent status (open/closed)
- Mark one substatus as default per parent status
- Assign substatus on ticket close
- Use substatus as ticket search filter
- Seed system substatuses (Resolved, Duplicate, Bogus)
- Use substatus as auto-close target in category config

---

### Seed Data (System Substatuses)

| Name | Description | Status | isDefault |
|------|-------------|--------|-----------|
| Open | Ticket is open | open | true |
| Resolved | Issue has been resolved | closed | true |
| Duplicate | Ticket is a duplicate | closed | false |
| Bogus | Ticket was invalid/bogus | closed | false |

---

### Process

#### Create Substatus
1. Staff POSTs to `POST /api/v1/substatus` with `name`, `description`, `status`, `isDefault`.
2. System validates `status` is `open` or `closed`.
3. If `isDefault = true`, system clears `isDefault` on any existing substatus with the same `status`.
4. System inserts `substatus` row.
5. Returns created substatus with 201.

#### Update Substatus
1. Staff PATCHes `/api/v1/substatus/{id}`.
2. Same isDefault uniqueness rule applies.
3. System blocks update of `name` on system substatuses (Resolved, Duplicate, Bogus, Open).

#### Delete Substatus
1. Staff DELETEs `/api/v1/substatus/{id}`.
2. System blocks delete of system substatuses.
3. System blocks delete if any `tickets.substatus_id` references it.
4. System blocks delete if any `categories.autoCloseSubstatus_id` references it.
5. On success, returns 204.

---

### Inputs

- `name` (string, required): Substatus name; max 100 chars.
- `description` (text, optional): Longer description.
- `status` (string, required): `open` or `closed`.
- `isDefault` (boolean, optional): Default false.

---

### Outputs

- **Substatus object:** id, name, description, status, isDefault, isSystem (boolean — true for seeded records).
- **Substatus list:** Array of all substatus records (not paginated — expected to be a small set).

---

### Validation Rules

- `status` must be exactly `open` or `closed`.
- `name` is required; max 100 chars; should be unique (case-insensitive) per `status`.
- At most one substatus per `status` value should have `isDefault = true`; setting `isDefault = true` on a new or updated record must clear the previous default for that status.
- System substatuses (Resolved, Duplicate, Bogus, Open) cannot be deleted.
- System substatus names cannot be modified.
- A substatus cannot be deleted if referenced by `tickets.substatus_id` or `categories.autoCloseSubstatus_id`.
- A `closed`-type substatus is required when closing a ticket (F00).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Substatus not found | 404 | SUBSTATUS_NOT_FOUND | "Substatus not found" |
| Invalid status value | 422 | INVALID_STATUS | "Status must be 'open' or 'closed'" |
| Delete of system substatus | 403 | SYSTEM_SUBSTATUS | "System substatuses cannot be deleted" |
| Modify name of system substatus | 403 | SYSTEM_SUBSTATUS | "System substatus names cannot be modified" |
| Delete blocked by ticket references | 409 | SUBSTATUS_IN_USE | "Substatus is referenced by existing tickets" |
| Delete blocked by category auto-close | 409 | SUBSTATUS_IN_USE | "Substatus is used by a category auto-close rule" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Substatus`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/substatus` | staff | List all substatuses |
| POST | `/api/v1/substatus` | staff | Create substatus |
| GET | `/api/v1/substatus/{id}` | staff | Get substatus detail |
| PATCH | `/api/v1/substatus/{id}` | staff | Update substatus |
| DELETE | `/api/v1/substatus/{id}` | staff | Delete substatus |

---

### Schema Surface (this feature)

Table: `substatus`. See `Y0c-schema-categories.md §Substatus`.

Key columns: id (SERIAL PK), name (VARCHAR 100), description (TEXT), status (VARCHAR 10 CHECK IN ('open','closed')), isDefault (BOOLEAN DEFAULT false), isSystem (BOOLEAN DEFAULT false).
---

## F09: Action Types and Response Templates

**Description:** Actions define the vocabulary of ticket history events. System action types are fixed and seeded; departments may define custom action types. Each action has a name, description template (with `{variable}` placeholders), type, optional email template, and optional reply-to email. Per-category action response templates (`category_action_responses`) allow departments to override the notification text and reply email for each action type within each category.

---

### Terminology

- **System action:** A pre-seeded, read-only action type (e.g., open, assignment, closed). Cannot be modified or deleted by staff.
- **Department action:** A custom action type created by staff for department-specific events.
- **template:** The description text for a `ticketHistory` entry, containing `{variable}` placeholders resolved at render time (F01).
- **replyEmail:** The reply-to address for notification emails sent when this action occurs. Overrides category-level `notificationReplyEmail`.
- **category_action_responses:** A join table associating a specific action with a specific category and providing an optional template and replyEmail override for that combination.
- **department_actions:** A join table associating a department with the action types available to it.

---

### Sub-features

- Create, read, update, delete department-scoped custom action types
- View all system action types (read-only)
- Create, read, update, delete category_action_responses
- List available actions per department
- Associate actions with departments (department_actions)
- Render action templates at read time (see F01)

---

### Process

#### Create Custom Action
1. Staff POSTs to `POST /api/v1/actions` with `name`, `description`, `type = 'department'`, optional `template`, optional `replyEmail`.
2. System validates `type = 'department'` (cannot create system actions).
3. System inserts `actions` row.
4. Returns created action with 201.

#### Update Action
1. Staff PATCHes `/api/v1/actions/{id}`.
2. System rejects updates to system actions (type = 'system').
3. Returns updated action.

#### Delete Action
1. Staff DELETEs `/api/v1/actions/{id}`.
2. System rejects delete of system actions.
3. System blocks delete if any `ticketHistory.action_id` references it.
4. System removes associated `department_actions` and `category_action_responses` rows.
5. Returns 204.

#### Manage Category Action Responses
1. Staff POSTs to `POST /api/v1/categories/{categoryId}/action-responses` with `action_id`, `template`, `replyEmail`.
2. System validates `category_id` and `action_id` exist.
3. System upserts `category_action_responses` row.
4. Returns upserted record.

---

### Template Variable Reference

Variables are resolved at render time by `TicketHistoryService.renderTemplate()`:

| Variable | Resolved Value |
|----------|---------------|
| `{enteredByPerson}` | Full name of `ticketHistory.enteredByPerson_id` from `people` |
| `{actionPerson}` | Full name of `ticketHistory.actionPerson_id` from `people` |
| `{reportedByPerson_id}` | Full name of `tickets.reportedByPerson_id` from `people` |
| `{original:field}` | `ticketHistory.data.original.field` value |
| `{updated:field}` | `ticketHistory.data.updated.field` value |
| `{duplicate:ticket_id}` | Ticket ID from `ticketHistory.data.duplicate` |

Unknown variables are left as literal text.

---

### Inputs

**Action:**
- `name` (string, required): Action name; max 100 chars.
- `description` (text, optional): Human-readable description of the event.
- `type` (string, required for create): Must be `department` for new actions.
- `template` (text, optional): Email notification template text with `{variable}` placeholders.
- `replyEmail` (string, optional): Override reply-to email for this action.

**Category Action Response:**
- `category_id` (integer, required): FK to `categories.id`.
- `action_id` (integer, required): FK to `actions.id`.
- `template` (text, optional): Override template for this action in this category.
- `replyEmail` (string, optional): Override reply-to email for this action in this category.

---

### Outputs

- **Action object:** id, name, description, type, template, replyEmail.
- **Actions list:** Array of all action objects (system + department for the caller's department).
- **Category Action Response object:** id, category_id, action_id, action (name), template, replyEmail.

---

### Validation Rules

- `name` required; max 100 chars.
- `type` on create must be `department`; system actions cannot be created via API.
- System action types (type = 'system') cannot be updated or deleted.
- `replyEmail` must be valid RFC 5322 email format if provided.
- `action_id` in `category_action_responses` must reference an existing action.
- `category_id` in `category_action_responses` must reference an existing category.
- Deleting an action that has `ticketHistory` references is blocked (history is immutable).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Action not found | 404 | ACTION_NOT_FOUND | "Action not found" |
| Cannot modify system action | 403 | SYSTEM_ACTION | "System actions cannot be modified or deleted" |
| Cannot create system action | 403 | SYSTEM_ACTION | "Cannot create actions with type 'system'" |
| Delete blocked by history | 409 | ACTION_IN_USE | "Action is referenced by ticket history entries" |
| Invalid replyEmail | 422 | INVALID_EMAIL | "Reply email address is invalid" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Actions`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/actions` | staff | List all actions |
| POST | `/api/v1/actions` | staff | Create department action |
| GET | `/api/v1/actions/{id}` | staff | Get action detail |
| PATCH | `/api/v1/actions/{id}` | staff | Update department action |
| DELETE | `/api/v1/actions/{id}` | staff | Delete department action |
| GET | `/api/v1/categories/{id}/action-responses` | staff | List category action responses |
| POST | `/api/v1/categories/{id}/action-responses` | staff | Create/update category action response |
| DELETE | `/api/v1/categories/{id}/action-responses/{responseId}` | staff | Delete category action response |

---

### Schema Surface (this feature)

Tables: `actions`, `category_action_responses`, `department_actions`. See `Y0c-schema-categories.md §Actions`.

Key columns:
- `actions`: id (SERIAL PK), name (VARCHAR 100), description (TEXT), type (VARCHAR 20 CHECK IN ('system','department')), template (TEXT), replyEmail (VARCHAR 255).
- `category_action_responses`: id (SERIAL PK), category_id (FK), action_id (FK), template (TEXT), replyEmail (VARCHAR 255), UNIQUE(category_id, action_id).
- `department_actions`: department_id (FK), action_id (FK), PRIMARY KEY(department_id, action_id).
---

## F10: Media / Attachment Upload and Thumbnail Caching

**Description:** Staff and (permission-permitted) public users can attach images and files to tickets. Uploaded media is stored on disk with an opaque internal filename. Image thumbnails are generated on first request and served from a cache directory. Media is listed on the ticket detail view and included in Open311 API responses as `media_url`. Every upload triggers an `upload_media` history entry.

---

### Terminology

- **internalFilename:** A UUID-based opaque filename assigned by the server on upload, used for secure file access.
- **filename:** The original human-readable filename as supplied by the uploader.
- **mime_type:** MIME type of the uploaded file (e.g., `image/jpeg`, `application/pdf`).
- **Thumbnail:** A resized version of an uploaded image, generated on first request and cached on disk.
- **media endpoint:** `GET /api/v1/media/{internalFilename}` — serves the original file. `GET /api/v1/media/{internalFilename}/thumbnail` — serves the thumbnail.
- **upload_media:** The system action type recorded in `ticketHistory` when files are attached.

---

### Sub-features

- Upload one or more files to a ticket
- Store file metadata in `media` table
- Generate and cache image thumbnails on first request
- Serve original and thumbnail files via media endpoint
- List all attachments on ticket detail
- Include media URL in Open311 API responses
- Record upload_media history entry on each upload
- Restrict upload by user role

---

### Process

#### Upload Media
1. Client POSTs multipart/form-data to `POST /api/v1/tickets/{ticketId}/media` with one or more file parts.
2. System validates caller has permission to upload to this ticket (staff always allowed; public/anonymous per category postingPermissionLevel).
3. System validates file count ≤ 10 per request; each file ≤ 20MB.
4. For each file:
   a. System generates a UUID-based `internalFilename` (e.g., `3f7c9b12-...jpg`).
   b. System saves file to `$MEDIA_STORAGE_PATH/{internalFilename}`.
   c. System inserts `media` row with `filename`, `internalFilename`, `mime_type`, `uploaded = NOW()`, `person_id`, `ticket_id`.
5. System appends a single `ticketHistory` entry with action `upload_media` and `data = { "mediaIds": [ids] }`.
6. Returns array of created media objects.

#### Serve Media File
1. Client GETs `/api/v1/media/{internalFilename}`.
2. System looks up `media` by `internalFilename`.
3. System validates caller's display permission for the ticket's category.
4. System streams file from `$MEDIA_STORAGE_PATH/{internalFilename}` with correct `Content-Type`.
5. If file not found on disk → 404.

#### Serve Thumbnail
1. Client GETs `/api/v1/media/{internalFilename}/thumbnail`.
2. System checks if thumbnail exists in `$THUMBNAIL_CACHE_PATH/{internalFilename}_thumb.jpg`.
3. If not cached: system generates thumbnail (max 200×200px, JPEG) from original file.
4. System saves thumbnail to cache path.
5. System streams thumbnail with `Content-Type: image/jpeg`.
6. If original is not an image → returns original file or 415 (Unsupported Media Type).

#### Delete Media
1. Staff DELETEs `/api/v1/tickets/{ticketId}/media/{mediaId}`.
2. System removes `media` row.
3. System deletes file from disk and thumbnail from cache if present.
4. System appends history entry with action `update` noting media deletion.

---

### Inputs

- Multipart form fields:
  - File binary data (one or more parts).
  - `ticket_id` (from URL path).
- Upload context: `person_id` from JWT (or null for anonymous/API submissions).

---

### Outputs

- **Media object:** id, ticket_id, filename, internalFilename, mime_type, uploaded (ISO 8601), person_id, url (constructed from base URL + internalFilename), thumbnailUrl.
- **Media list:** Array of media objects on ticket detail.
- **Open311 media_url:** URL string of first media item when responding to Open311 requests.

---

### Validation Rules

- File count per upload request: max 10 files.
- File size per file: max 20MB (configurable via `app.media.maxSizeMb`).
- Allowed MIME types (configurable, default): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- `internalFilename` must be unique (UUID generation effectively guarantees this).
- Caller must have at minimum the posting permission level for the ticket's category to upload.
- Files are served with appropriate `Content-Disposition: inline` or `attachment` header based on MIME type.
- Thumbnails are only generated for image/* MIME types.
- Thumbnail dimensions: max 200×200px, preserving aspect ratio.
- Disk storage path must be a mounted Docker volume (`/app/media`).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Ticket not found | 404 | TICKET_NOT_FOUND | "Ticket not found" |
| No files in upload | 422 | NO_FILE | "No files provided" |
| File exceeds size limit | 413 | FILE_TOO_LARGE | "File exceeds maximum allowed size" |
| Unsupported MIME type | 415 | UNSUPPORTED_MEDIA | "File type not allowed" |
| Too many files in one request | 422 | TOO_MANY_FILES | "Maximum 10 files per upload" |
| Media not found | 404 | MEDIA_NOT_FOUND | "Media not found" |
| File missing from disk | 404 | FILE_NOT_FOUND | "File data not found on server" |
| Permission denied for category | 403 | PERMISSION_DENIED | "Insufficient permission to upload to this ticket" |

---

### API Surface (this feature)

See full schemas in `Y1b-api-tickets.md §Media`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/tickets/{id}/media` | staff/public (per category) | Upload files to ticket |
| GET | `/api/v1/tickets/{id}/media` | staff/public (per category display) | List media for ticket |
| DELETE | `/api/v1/tickets/{id}/media/{mediaId}` | staff | Delete media item |
| GET | `/api/v1/media/{internalFilename}` | staff/public (per category display) | Serve file |
| GET | `/api/v1/media/{internalFilename}/thumbnail` | staff/public (per category display) | Serve thumbnail |

---

### Schema Surface (this feature)

Table: `media`. See `Y0a-schema-core.md §Media`.

Key columns: id (BIGSERIAL PK), ticket_id (FK tickets), filename (VARCHAR 255), internalFilename (VARCHAR 255 UNIQUE), mime_type (VARCHAR 100), uploaded (TIMESTAMPTZ DEFAULT NOW()), person_id (FK people, nullable).
---

## F11: Full-Text Search (PostgreSQL FTS replacing Solr)

**Description:** The current system uses Apache Solr 7.4 for ticket indexing and full-text search. The new system replaces Solr with PostgreSQL Full-Text Search (FTS), preserving equivalent search semantics and result equivalence. Ticket search supports filtering by dozens of fields and returns paginated results. Search results power the ticket list view, map view, and CSV/print exports. The search endpoint is the primary data retrieval mechanism for the staff dashboard.

---

### Terminology

- **FTS vector:** A PostgreSQL `tsvector` column stored on `tickets` (or a separate FTS index table) combining all searchable text fields.
- **FTS query:** A `tsquery` built from the user's keyword input (using `plainto_tsquery` or `websearch_to_tsquery`).
- **FTS index:** A `GIN` index on the `tsvector` column for performant full-text search.
- **Facet filter:** A non-text filter parameter that further restricts results (e.g., `category_id`, `status`, date ranges).
- **Radius search:** A geographic filter returning only tickets within N meters of a given lat/long (using PostGIS `ST_DWithin`).
- **Map view:** A query variant returning geo-clustered ticket counts rather than paginated ticket records.

---

### Sub-features

- Index all relevant ticket fields for FTS
- Keyword search across indexed fields
- Filter by: category_id, department_id, assignedPerson_id, enteredByPerson_id, status, substatus_id, contactMethod_id, client_id, issueType_id
- Filter by date ranges: enteredDate, closedDate, lastModified
- Filter by location: city, zip, latitude+longitude+radius
- Paginated result sets (list view)
- Unpaginated results for CSV/print export (staff only)
- Map view with geo-clustered counts
- Maintain search result equivalence with current Solr output

---

### Process

#### Standard Search
1. Client GETs `/api/v1/tickets` with zero or more filter params.
2. System builds a parameterized SQL query:
   a. Applies `WHERE` clauses for each provided facet filter.
   b. If `q` (keyword) is provided, adds `AND tickets.search_vector @@ websearch_to_tsquery('english', :q)`.
   c. If `lat`, `long`, `radius` provided, adds `AND ST_DWithin(tickets.geo_point, ST_MakePoint(:long, :lat)::geography, :radius)`.
3. System applies ORDER BY: `ts_rank(search_vector, query) DESC` if keyword search; else `enteredDate DESC`.
4. System applies `LIMIT :limit OFFSET :offset` for pagination.
5. Returns paginated response: `{ "total": N, "page": P, "limit": L, "tickets": [...] }`.

#### Export (CSV / Print)
1. Client GETs `/api/v1/tickets/export?format=csv` (or `format=print`) with same filter params.
2. System validates caller has `staff` role.
3. System executes same query without LIMIT/OFFSET.
4. For CSV: streams `text/csv` response with header row and one ticket per line.
5. For print: returns HTML-formatted ticket list (no pagination controls).

#### Map View
1. Client GETs `/api/v1/tickets/map` with filter params and optional `zoomLevel` (0–6).
2. System applies same filters.
3. System groups results by `ticket_geodata.cluster_id_{zoomLevel}`.
4. Returns array of cluster objects: `{ "cluster_id": N, "count": N, "lat": f, "long": f }`.

---

### FTS Index Construction

The `search_vector` column is populated by a PostgreSQL trigger or scheduled refresh:

```sql
tickets.search_vector = to_tsvector('english',
  coalesce(tickets.description, '') || ' ' ||
  coalesce(tickets.location, '') || ' ' ||
  coalesce(tickets.city, '') || ' ' ||
  coalesce(tickets.zip, '') || ' ' ||
  coalesce(p_reported.firstname || ' ' || p_reported.lastname, '') || ' ' ||
  coalesce(p_assigned.firstname || ' ' || p_assigned.lastname, '') || ' ' ||
  coalesce(categories.name, '') || ' ' ||
  coalesce(departments.name, '')
)
```

A `GIN` index on `tickets.search_vector` ensures sub-500ms full-text queries.

---

### Search Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Keyword query (full-text) |
| `category_id` | integer | Filter by category |
| `department_id` | integer | Filter by department |
| `assignedPerson_id` | integer | Filter by assigned person |
| `enteredByPerson_id` | integer | Filter by staff who entered |
| `reportedByPerson_id` | integer | Filter by reporter |
| `status` | string | `open` or `closed` |
| `substatus_id` | integer | Filter by substatus |
| `contactMethod_id` | integer | Filter by contact method |
| `client_id` | integer | Filter by API client |
| `issueType_id` | integer | Filter by issue type |
| `enteredDateFrom` | ISO date | Ticket opened on or after |
| `enteredDateTo` | ISO date | Ticket opened on or before |
| `closedDateFrom` | ISO date | Ticket closed on or after |
| `closedDateTo` | ISO date | Ticket closed on or before |
| `city` | string | Filter by city (ILIKE) |
| `zip` | string | Filter by ZIP code |
| `lat` | decimal | Center latitude for radius search |
| `long` | decimal | Center longitude for radius search |
| `radius` | integer | Radius in meters (default 1000) |
| `page` | integer | Page number (1-indexed, default 1) |
| `limit` | integer | Page size (default 25, max 500) |
| `sortBy` | string | Field to sort by (default: enteredDate) |
| `sortDir` | string | `asc` or `desc` (default: desc) |

---

### Outputs

**Paginated ticket list:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 25,
  "tickets": [ { ticket object... }, ... ]
}
```

**Map view:**
```json
{
  "clusters": [
    { "cluster_id": 42, "count": 7, "lat": 40.712, "long": -74.006 }
  ]
}
```

**CSV:** `text/csv` stream with headers: id, enteredDate, category, status, substatus, description, location, city, zip, assignedPerson, reportedBy.

---

### Validation Rules

- `status` filter must be `open` or `closed` if provided.
- `lat` must be in [-90, 90]; `long` in [-180, 180] if provided for radius search.
- `radius` must be a positive integer (meters); max 50,000.
- `limit` max is 500 for list; no limit for export (staff only).
- `sortBy` must be a whitelisted field name (prevents SQL injection).
- Keyword `q` is passed through `websearch_to_tsquery` which sanitizes the input.
- Export endpoints require `staff` role (F03).
- Date range parameters must be parseable ISO 8601 date strings.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Export attempted by non-staff | 403 | PERMISSION_DENIED | "Export requires staff role" |
| Invalid status filter | 422 | INVALID_STATUS | "Status must be 'open' or 'closed'" |
| Invalid lat/long | 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" |
| Invalid date format | 422 | INVALID_DATE | "Date must be ISO 8601 format" |
| limit exceeds maximum | 422 | LIMIT_EXCEEDED | "Page size exceeds maximum allowed" |
| Invalid sortBy field | 422 | INVALID_SORT_FIELD | "Invalid sort field" |

---

### API Surface (this feature)

See full schemas in `Y1b-api-tickets.md §Search`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/tickets` | staff/public/anonymous (per category display) | Search/list tickets |
| GET | `/api/v1/tickets/export` | staff | Export search results (CSV/print) |
| GET | `/api/v1/tickets/map` | staff/public/anonymous | Map view with geo-clusters |

---

### Schema Surface (this feature)

FTS column on `tickets`: `search_vector TSVECTOR`. GIN index: `CREATE INDEX idx_tickets_fts ON tickets USING GIN(search_vector)`. Geo column: `geo_point GEOGRAPHY(POINT, 4326)` indexed with `CREATE INDEX idx_tickets_geo ON tickets USING GIST(geo_point)`.

See `Y0a-schema-core.md §Tickets (FTS extensions)` and `Y0d-schema-geo.md §ticket_geodata`.
---

## F12: Bookmarks (Staff Saved Searches)

**Description:** Staff users can save named ticket search filters as bookmarks. A bookmark stores the full request URI of a search query (including all filter parameters) so that the staff member can return to a frequently-used filtered view with a single click. Bookmarks are personal (per person), typed, and listed in the staff UI sidebar.

---

### Terminology

- **requestUri:** The full URL path + query string of the saved search (e.g., `/api/v1/tickets?status=open&category_id=5&assignedPerson_id=12`).
- **type:** Bookmark type field for future extensibility; current allowed value is `search`.

---

### Sub-features

- Create bookmark (save current search URI with a name)
- List all bookmarks for the current staff user
- Delete a bookmark
- Navigate to a bookmarked search (follow stored requestUri)

---

### Process

#### Create Bookmark
1. Staff POSTs to `POST /api/v1/bookmarks` with `name` and `requestUri`.
2. System validates `name` is non-empty; `requestUri` is a valid relative URL path.
3. System sets `person_id` from JWT claims; `type = 'search'`.
4. System inserts `bookmarks` row.
5. Returns created bookmark with 201.

#### List Bookmarks
1. Staff GETs `/api/v1/bookmarks`.
2. System returns all bookmarks for the current `person_id` (from JWT).
3. Returns array ordered by `id ASC` (creation order).

#### Delete Bookmark
1. Staff DELETEs `/api/v1/bookmarks/{id}`.
2. System validates bookmark belongs to the current person.
3. System deletes row.
4. Returns 204.

---

### Inputs

- `name` (string, required): Display name for the bookmark; max 200 chars.
- `requestUri` (string, required): Relative URL path with query params; max 2048 chars.
- `type` (string, optional): Default `search`; max 50 chars.

---

### Outputs

- **Bookmark object:** id, person_id, type, name, requestUri, createdAt.
- **Bookmark list:** Array of bookmark objects for the current user.

---

### Validation Rules

- `name` required; max 200 chars.
- `requestUri` required; must start with `/`; max 2048 chars.
- `type` default `search`; no current enforcement of allowed values (forward compatibility).
- Bookmark must belong to the calling user (from JWT `sub`) to be deletable.
- No uniqueness constraint on `name` or `requestUri` per person (duplicates allowed).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Bookmark not found | 404 | BOOKMARK_NOT_FOUND | "Bookmark not found" |
| Delete bookmark belonging to another user | 403 | PERMISSION_DENIED | "Cannot delete another user's bookmark" |
| name missing or empty | 422 | MISSING_REQUIRED_FIELD | "Bookmark name is required" |
| requestUri missing or empty | 422 | MISSING_REQUIRED_FIELD | "Request URI is required" |
| requestUri does not start with / | 422 | INVALID_URI | "Request URI must be a relative path" |

---

### API Surface (this feature)

See full schemas in `Y1b-api-tickets.md §Bookmarks`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/bookmarks` | staff | List current user's bookmarks |
| POST | `/api/v1/bookmarks` | staff | Create bookmark |
| DELETE | `/api/v1/bookmarks/{id}` | staff | Delete bookmark |

---

### Schema Surface (this feature)

Table: `bookmarks`. See `Y0a-schema-core.md §Bookmarks`.

Key columns: id (SERIAL PK), person_id (FK people), type (VARCHAR 50 DEFAULT 'search'), name (VARCHAR 200), requestUri (VARCHAR 2048), createdAt (TIMESTAMPTZ DEFAULT NOW()).
---

## F13: API Client Management

**Description:** External applications that integrate with uReport via the Open311 API are registered as API clients. Each client has a name, URL, a unique API key, a contact person, and an optional default contact method. API keys are validated on Open311 write operations. Tickets submitted via API carry the originating client's ID. Staff manage clients via an admin interface.

---

### Terminology

- **api_key:** A shared secret assigned to a client, used to authenticate Open311 POST requests. Stored hashed at rest.
- **contactPerson:** A `people` record who is the human point of contact for this API integration.
- **contactMethod:** The default contact method applied to tickets submitted by this client.
- **OBSOLETE_API_KEYS:** A server-side configuration list of deprecated keys that trigger the mobile-shutdown notice (see F02).

---

### Sub-features

- Create, read, update, delete API client records
- Generate or assign a unique api_key per client
- Associate client with contact person and optional contact method
- Validate api_key on Open311 write requests
- Associate submitted tickets with their client (tickets.client_id)
- List all registered clients (staff only)

---

### Process

#### Create Client
1. Staff POSTs to `POST /api/v1/clients` with `name`, `url`, optional `contactPerson_id`, optional `contactMethod_id`.
2. If `api_key` not provided, system generates a cryptographically random 32-byte hex string.
3. System hashes the raw key with BCrypt (or SHA-256 + salt) before storing.
4. System returns the raw (unhashed) key **once** in the 201 response — it is not retrievable again.
5. System inserts `clients` row.

#### Update Client
1. Staff PATCHes `/api/v1/clients/{id}`.
2. If `regenerateApiKey = true`, system generates and returns a new raw api_key.
3. System updates `clients` row.

#### Validate API Key (Open311 write)
1. Request arrives at `POST /open311/requests` with `api_key` param.
2. System iterates `clients` table, checking `bcrypt.verify(api_key, clients.api_key_hash)` for each (or uses a lookup-table approach with a salted index for performance).
3. Alternative (preferred for performance): Store a salted SHA-256 hash in a separate indexed column for fast lookup; BCrypt for secure storage.
4. If match found → sets `client_id` on the new ticket.
5. If no match → 403 (see F02).

---

### Inputs

- `name` (string, required): Client/application name; max 200 chars.
- `url` (string, optional): Client's website or integration URL; max 500 chars.
- `api_key` (string, optional): If not provided, auto-generated.
- `contactPerson_id` (integer, optional): FK to `people.id`.
- `contactMethod_id` (integer, optional): FK to `contactMethods.id`.
- `regenerateApiKey` (boolean, optional): On PATCH, triggers new key generation.

---

### Outputs

- **Client object (create/update):** id, name, url, contactPerson_id, contactPerson (name), contactMethod_id, contactMethod (name), rawApiKey (returned once on create/regenerate only).
- **Client object (read/list):** id, name, url, contactPerson_id, contactPerson (name), contactMethod_id, contactMethod (name). `api_key` is NEVER returned in read responses.
- **Clients list:** Paginated array of client objects.

---

### Validation Rules

- `name` required; max 200 chars.
- `api_key` is stored hashed — the raw key is never stored in plaintext.
- Raw API key is returned in the response body only at creation time or key regeneration — never again.
- `contactPerson_id` must reference an existing person if provided.
- `contactMethod_id` must reference an existing contact method if provided.
- Deleting a client is blocked if any `tickets.client_id` references it. Deactivate or reassign first.
- API keys must be unique across all clients (pre-store uniqueness check on hash).
- `url` must be a valid URL format if provided.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Client not found | 404 | CLIENT_NOT_FOUND | "Client not found" |
| Duplicate api_key | 409 | API_KEY_CONFLICT | "API key already in use" |
| Delete blocked by ticket references | 409 | CLIENT_IN_USE | "Client is referenced by existing tickets" |
| Invalid contactPerson | 422 | PERSON_NOT_FOUND | "Contact person not found" |
| Invalid contactMethod | 422 | CONTACT_METHOD_NOT_FOUND | "Contact method not found" |
| name missing | 422 | MISSING_REQUIRED_FIELD | "Client name is required" |

---

### API Surface (this feature)

See full schemas in `Y1a-api-auth-people.md §Clients`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/clients` | staff | List all API clients |
| POST | `/api/v1/clients` | staff | Register new API client |
| GET | `/api/v1/clients/{id}` | staff | Get client detail |
| PATCH | `/api/v1/clients/{id}` | staff | Update client / regenerate key |
| DELETE | `/api/v1/clients/{id}` | staff | Delete client |

---

### Schema Surface (this feature)

Table: `clients`. See `Y0b-schema-people.md §Clients`.

Key columns: id (SERIAL PK), name (VARCHAR 200), url (VARCHAR 500), api_key_hash (VARCHAR 255) — hashed storage, api_key_lookup (VARCHAR 64) — fast-lookup SHA-256 hash (indexed), contactPerson_id (FK people, nullable), contactMethod_id (FK contactMethods, nullable).
---

## F14: Contact Method Tracking

**Description:** uReport tracks how tickets were submitted and how constituents prefer to receive responses via the `contactMethods` lookup table. Four system contact methods are seeded at installation (Email, Phone, Web Form, Other). Tickets reference a `contactMethod_id` for the submission channel and a `responseMethod_id` for the preferred response channel. Contact methods are also associated with API clients.

---

### Terminology

- **contactMethod_id:** FK on `tickets` — the channel through which this ticket was submitted.
- **responseMethod_id:** FK on `tickets` — the constituent's preferred response channel.
- **System contact method:** One of the four seeded methods (Email, Phone, Web Form, Other). Cannot be deleted.

---

### Sub-features

- Seed four system contact methods: Email, Phone, Web Form, Other
- Record submission contact method on a ticket
- Record preferred response method on a ticket
- Filter ticket searches by contact method (F11)
- Associate API clients with a contact method (F13)

---

### Seed Data

| ID | Name |
|----|------|
| 1 | Email |
| 2 | Phone |
| 3 | Web Form |
| 4 | Other |

*(IDs are stable seeds; must not be altered post-installation)*

---

### Process

#### List Contact Methods
1. Client GETs `/api/v1/contact-methods`.
2. System returns all contact methods ordered by ID.
3. No authentication required (reference data).

#### Create Contact Method (admin)
1. Staff POSTs to `POST /api/v1/contact-methods` with `name`.
2. System validates `name` is non-empty and unique.
3. System inserts `contactMethods` row.
4. Returns created method with 201.

#### Delete Contact Method
1. Staff DELETEs `/api/v1/contact-methods/{id}`.
2. System blocks delete of system contact methods (IDs 1–4).
3. System blocks delete if any `tickets.contactMethod_id` or `tickets.responseMethod_id` references it.
4. Returns 204.

---

### Inputs

- `name` (string, required): Contact method name; max 100 chars.

---

### Outputs

- **Contact method object:** id, name, isSystem (boolean).
- **Contact methods list:** Array of all contact method objects.

---

### Validation Rules

- `name` required; max 100 chars; must be unique (case-insensitive).
- System contact methods (IDs 1–4) cannot be deleted or renamed.
- Deleting a contact method referenced by any ticket is blocked.
- `contactMethod_id` and `responseMethod_id` on tickets must reference valid `contactMethods.id` values.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Contact method not found | 404 | CONTACT_METHOD_NOT_FOUND | "Contact method not found" |
| Delete system contact method | 403 | SYSTEM_CONTACT_METHOD | "System contact methods cannot be deleted" |
| Delete blocked by ticket references | 409 | CONTACT_METHOD_IN_USE | "Contact method is referenced by existing tickets" |
| Duplicate name | 409 | CONTACT_METHOD_CONFLICT | "Contact method name already exists" |

---

### API Surface (this feature)

See schemas in `Y1c-api-admin.md §ContactMethods`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/contact-methods` | none | List all contact methods |
| POST | `/api/v1/contact-methods` | staff | Create contact method |
| DELETE | `/api/v1/contact-methods/{id}` | staff | Delete contact method |

---

### Schema Surface (this feature)

Table: `contactMethods`. See `Y0b-schema-people.md §ContactMethods`.

Key columns: id (SERIAL PK), name (VARCHAR 100 UNIQUE), isSystem (BOOLEAN DEFAULT false).
---

## F15: Location / Address Management and Geo-Cluster Analysis

**Description:** Tickets carry geographic data (latitude, longitude, street address, city, state, zip). The `locations` table provides a canonical validated address registry. Geo-cluster analysis groups nearby tickets into hierarchical spatial clusters across 7 zoom levels (0–6), used by the map view. A scheduled background job (replacing `matchLocationAddresses.php`) links tickets to canonical addresses and rebuilds geo-clusters using PostGIS spatial operations.

---

### Terminology

- **locations:** Canonical address records — a registry of validated street addresses with lat/long.
- **addressId:** FK on `tickets` linking to a validated `locations` record (may be null if address unvalidated).
- **geoclusters:** Spatial cluster records at each of 7 zoom levels, each with a center point and level.
- **ticket_geodata:** Join table linking each ticket to its cluster assignment at each of the 7 zoom levels.
- **cluster_id_N:** The cluster assignment at zoom level N (0 = coarsest, 6 = finest).
- **geo_point:** A `GEOGRAPHY(POINT, 4326)` column on `tickets` for PostGIS spatial queries.
- **AddressService:** An optional external address validation/normalization service integration (see F15 §Integration).
- **matchLocationAddresses job:** The legacy PHP cron script replaced by `GeoClusterScheduler` in Spring.

---

### Sub-features

- Capture and store lat/long, address, city, state, zip on tickets
- Validate and normalize addresses via optional AddressService
- Store canonical address records in `locations`
- Generate geo-cluster entries in `geoclusters` (7 zoom levels)
- Link each ticket to its cluster assignments in `ticket_geodata`
- Rebuild geo-clusters via scheduled background job
- Serve map view with geo-clustered ticket data (F11)
- Support location-based ticket search (radius, city, zip filters) (F11)

---

### Process

#### Address Capture on Ticket Creation
1. On ticket creation (F00), caller provides `location`, `city`, `state`, `zip`, `latitude`, `longitude`.
2. System stores raw fields on `tickets` directly.
3. If `latitude` and `longitude` are provided, system populates `tickets.geo_point = ST_MakePoint(longitude, latitude)::geography`.
4. System optionally calls AddressService to validate/normalize the address (if configured); stores `additionalFields` JSON from AddressService response.
5. System looks up or creates a `locations` record matching the canonical address.
6. System sets `tickets.addressId` to the matching `locations.id`.

#### Geo-Cluster Rebuild Job
1. `GeoClusterScheduler` runs on a configured cron schedule (default: nightly at 2 AM).
2. Job queries all tickets with non-null `geo_point`.
3. For each zoom level N (0–6), job groups nearby tickets using a spatial clustering algorithm:
   - Level 0: clusters within ~50km radius.
   - Level 6: clusters within ~100m radius.
   - Cluster radii configurable via `app.geo.clusterRadii[0..6]` (meters).
4. For each new cluster: job inserts a `geoclusters` row with `level = N` and `center = ST_Centroid(...)`.
5. Job upserts `ticket_geodata` rows linking each ticket to its cluster at each level.
6. Job logs execution time and counts.

#### Cluster Radius (Default Values)

| Level | Approximate Radius |
|-------|-------------------|
| 0 | 50,000 m (50 km) |
| 1 | 20,000 m (20 km) |
| 2 | 10,000 m (10 km) |
| 3 | 5,000 m (5 km) |
| 4 | 2,000 m (2 km) |
| 5 | 500 m |
| 6 | 100 m |

---

### Inputs

**Ticket location fields (at ticket creation/update):**
- `latitude` (NUMERIC 9,6, optional): Decimal latitude.
- `longitude` (NUMERIC 9,6, optional): Decimal longitude.
- `location` (string, optional): Human-readable address string.
- `city` (string, optional): City name.
- `state` (string, optional): 2-char state abbreviation.
- `zip` (string, optional): ZIP/postal code.
- `additionalFields` (JSONB, optional): Extra address data from AddressService.

**Map view query (F11):**
- `zoomLevel` (integer 0–6): Determines which `cluster_id_N` column to group by.
- Standard ticket search filter parameters.

---

### Outputs

- **Location object:** id, address, city, state, zip, latitude, longitude.
- **Geocluster object:** id, level, center (lat/long), ticketCount.
- **Map view response:** Array of cluster objects `{ cluster_id, count, lat, long }` (see F11).
- **ticket_geodata:** Internal table; not directly exposed via API.

---

### Validation Rules

- `latitude` in [-90, 90]; `longitude` in [-180, 180] (enforced at ticket creation).
- `geo_point` populated only when both `latitude` and `longitude` are non-null.
- `locations` records are upserted on address match (normalized street + city + state + zip).
- Geo-cluster rebuild job is idempotent — re-running produces the same clusters.
- `zoomLevel` parameter for map view must be 0–6; defaults to 3 if not provided.
- AddressService integration is optional; if unavailable, system stores raw address without validation.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Invalid lat/long on ticket create | 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" |
| Invalid zoomLevel for map view | 422 | INVALID_ZOOM_LEVEL | "Zoom level must be 0–6" |
| AddressService unavailable (soft) | — | — | (logged; ticket created without canonical address) |
| Geo-cluster rebuild job failure | — | — | (logged; job retries on next schedule) |

---

### API Surface (this feature)

Map view served via F11 endpoint. Direct location management:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/locations` | staff | List canonical locations |
| GET | `/api/v1/locations/{id}` | staff | Get location detail |
| GET | `/api/v1/tickets/map` | any | Map view with geo-clusters (see F11) |

---

### Schema Surface (this feature)

Tables: `locations`, `geoclusters`, `ticket_geodata`. See `Y0d-schema-geo.md §Geo`.

Key columns:
- `locations`: id (SERIAL PK), address (VARCHAR 255), city (VARCHAR 100), state (VARCHAR 2), zip (VARCHAR 10), latitude (NUMERIC 9,6), longitude (NUMERIC 9,6), geo_point (GEOGRAPHY(POINT, 4326)).
- `geoclusters`: id (BIGSERIAL PK), level (SMALLINT CHECK 0-6), center (GEOGRAPHY(POINT, 4326)), UNIQUE(level, center).
- `ticket_geodata`: ticket_id (FK tickets), cluster_id_0 ... cluster_id_6 (FK geoclusters, nullable), PRIMARY KEY(ticket_id).
- `tickets` additions: geo_point (GEOGRAPHY(POINT, 4326)), addressId (FK locations, nullable).
---

## F16: Digest Email Notifications

**Description:** uReport sends outbound email notifications to constituents and staff when ticket events occur. The legacy PHP cron scripts (`digestNotifications.php`, `closeOldTickets.php`, `auditTickets.php`) are replaced by Spring Scheduler jobs. Notification emails are templated via the action template system (F09). Each `ticketHistory` entry records which emails were dispatched in `sentNotifications`. The scheduler also handles auto-close of stale tickets and periodic audit/integrity checks.

---

### Terminology

- **Digest notification:** A notification email sent to a reporter or staff member when a relevant ticket history event occurs.
- **notificationReplyEmail:** The reply-to email for notifications, set per-category in `categories.notificationReplyEmail`.
- **replyEmail:** An action-level or category_action_response-level override for the reply-to address.
- **sentNotifications:** A serialized list of email addresses that received notifications for a given `ticketHistory` entry, stored in `ticketHistory.sentNotifications`.
- **usedForNotifications:** A flag on `peopleEmails` — only flagged addresses receive digest notifications.
- **digestNotifications job:** The Spring Scheduler task replacing `digestNotifications.php`. Fires on a configurable schedule.
- **autoClose job:** The Spring Scheduler task replacing `closeOldTickets.php`. Fires nightly.
- **audit job:** The Spring Scheduler task replacing `auditTickets.php`. Fires on a configurable schedule.

---

### Sub-features

- Run scheduled digest notification job
- Identify pending notification history entries
- Render notification emails via action template variable substitution
- Send to all usedForNotifications emails for the reporter
- Record sent addresses in ticketHistory.sentNotifications
- Run scheduled auto-close job (close stale tickets per category auto-close rules)
- Run scheduled audit job (data integrity checks)

---

### Process

#### Digest Notification Job
1. `DigestNotificationScheduler` fires on schedule (default: every 5 minutes, configurable via `app.scheduler.digestInterval`).
2. Job queries `ticketHistory` entries where `sentNotifications IS NULL` AND `action_id` has a non-null `template` OR the category has a `category_action_response` for this action.
3. For each qualifying history entry:
   a. Load the ticket, category, action, and reporter's people record.
   b. Select the effective template: category_action_response.template > action.template.
   c. Select the effective replyEmail: category_action_response.replyEmail > action.replyEmail > category.notificationReplyEmail.
   d. Interpolate template variables (see F09 §Template Variable Reference).
   e. Collect all `peopleEmails.email` where `person_id = ticket.reportedByPerson_id` AND `usedForNotifications = true`.
   f. Send one email per address via configured SMTP/mail service.
   g. Set `ticketHistory.sentNotifications = comma-joined list of sent addresses`.
4. Job logs total entries processed, emails sent, failures.

#### Auto-Close Job
1. `AutoCloseScheduler` fires nightly (default: 1 AM, configurable).
2. Job queries categories where `autoCloseIsActive = true`.
3. For each such category, queries tickets where:
   - `status = 'open'`
   - `category_id = category.id`
   - `lastModified < NOW() - INTERVAL slaDays DAY` (or a separate `autoCloseDays` config per category if available; falls back to `slaDays`).
4. For each stale ticket:
   a. Sets `tickets.status = 'closed'`, `closedDate = NOW()`, `substatus_id = category.autoCloseSubstatus_id`.
   b. Appends `ticketHistory` entry with action "closed", `notes = 'Auto-closed by scheduler'`.
5. Logs count of auto-closed tickets.

#### Audit Job
1. `AuditScheduler` fires weekly (default: Sunday 3 AM, configurable).
2. Checks for data integrity issues: orphaned history entries, tickets with null category, missing geo_point when lat/long present.
3. Logs issues to application log; does not auto-correct.

---

### Email Message Format

- **Subject:** Configurable; default uses category name and ticket ID: `"[uReport] #{ticketId} - {categoryName} Update"`.
- **From:** Configurable system email (`app.mail.from`).
- **Reply-To:** Effective `replyEmail` (see above).
- **Body:** Rendered template text (plain text; optionally HTML if template contains HTML tags).
- **Footer:** Configurable system footer text (`app.mail.footer`).

---

### Inputs

*(Consumed internally by scheduler — not direct API inputs)*

- `ticketHistory` entries with null `sentNotifications` and non-null action template.
- `categories.autoCloseIsActive`, `categories.autoCloseSubstatus_id`, `categories.slaDays`.
- `peopleEmails.usedForNotifications`.
- SMTP configuration: `app.mail.host`, `app.mail.port`, `app.mail.username`, `app.mail.password`, `app.mail.from`.

---

### Outputs

- Outbound SMTP emails to constituent notification addresses.
- Updated `ticketHistory.sentNotifications` fields.
- Auto-closed tickets (status + history entries).
- Scheduler execution logs.

---

### Validation Rules

- Only emails with `usedForNotifications = true` receive digest notifications.
- `sentNotifications` is set once per history entry; job must not re-send to already-notified addresses.
- Auto-close only applies to tickets with `status = 'open'`; closed tickets are not re-closed.
- Auto-close requires `autoCloseSubstatus_id` to reference a valid closed-type substatus.
- Notification job is idempotent: a history entry with non-null `sentNotifications` is skipped.
- Email delivery failures are logged but do not prevent `sentNotifications` from being set (mark as sent even on failure to prevent retry loops; alternatively track failure status separately).
- Scheduler cron expressions are configurable via `application.yml`; defaults must match legacy PHP cron timing.

---

### Error States

*(All scheduler errors are logged; no HTTP responses)*

| Scenario | Log Level | Action |
|----------|-----------|--------|
| SMTP connection failure | ERROR | Log; mark notification as failed (null sentNotifications retained); retry next cycle |
| Template variable resolution failure | WARN | Log; send email with unresolved variable literal |
| Auto-close substatus not found | ERROR | Log; skip ticket; alert admin |
| Audit finds orphaned history | WARN | Log anomaly count |

---

### API Surface (this feature)

No direct REST API. Admin trigger endpoints for manual job execution:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/admin/jobs/digest-notifications/run` | staff | Manually trigger digest job |
| POST | `/api/v1/admin/jobs/auto-close/run` | staff | Manually trigger auto-close job |
| POST | `/api/v1/admin/jobs/audit/run` | staff | Manually trigger audit job |

---

### Schema Surface (this feature)

No new tables. Uses existing: `ticketHistory.sentNotifications` (TEXT), `categories.autoCloseIsActive`, `categories.autoCloseSubstatus_id`, `categories.slaDays`, `categories.notificationReplyEmail`, `actions.template`, `actions.replyEmail`, `category_action_responses.template`, `category_action_responses.replyEmail`, `peopleEmails.usedForNotifications`.
---

## F17: Metrics and Reporting Dashboard

**Description:** uReport provides a metrics endpoint and a set of canned reports for staff. The primary metrics calculation is `onTimePercentage` — the fraction of tickets closed within SLA for a given category over a configurable time window. Reports cover ticket activity, assignments, categories, staff performance, SLA compliance, volume trends, and current/opened/closed ticket counts. All metrics endpoints require `staff` role.

---

### Terminology

- **onTimePercentage:** The percentage of tickets in a category that were closed within `slaDays` of their `enteredDate`, over a given time window.
- **effectiveDate:** The reference date for the metrics calculation window end.
- **numDays:** The lookback window in days for the onTimePercentage calculation.
- **SLA compliance:** A ticket is SLA-compliant if it was closed and `closedDate - enteredDate <= slaDays * 1 day`.

---

### Sub-features

- Metrics: onTimePercentage for a category over a time window
- Activity report: ticket counts over a date range
- Assignments report: tickets grouped by assigned person
- Categories report: tickets grouped by category
- Staff report: per-staff ticket counts
- Person report: tickets for a specific person
- SLA report: tickets grouped by SLA compliance
- Volume report: ticket volume over time
- Current open tickets report: open ticket counts by category/department
- Opened today report: tickets opened in current period
- Closed today report: tickets closed in current period

---

### Process

#### GET /api/v1/metrics
1. Staff GETs `/api/v1/metrics?category_id={id}&numDays={n}&effectiveDate={date}`.
2. System calculates:
   - Denominator: COUNT of tickets in category where `enteredDate >= effectiveDate - numDays DAYS` AND `enteredDate <= effectiveDate` AND `closedDate IS NOT NULL`.
   - Numerator: COUNT of above where `closedDate - enteredDate <= slaDays * 1 day`.
3. `onTimePercentage = (numerator / denominator) * 100` — returns 0 if denominator = 0.
4. Returns `{ "category_id": N, "numDays": N, "effectiveDate": "...", "onTimePercentage": 73.5, "closedCount": 100, "onTimeCount": 73 }`.

#### GET /api/v1/reports/{reportType}
1. Staff GETs `/api/v1/reports/{reportType}` with optional date range and filter params.
2. System executes the report query corresponding to `reportType`.
3. Returns report data object.

#### Report Types

| reportType | Description | Key Output Fields |
|------------|-------------|------------------|
| `activity` | Ticket counts over date range | date, opened, closed, total |
| `assignments` | Tickets by assigned person | person_id, name, openCount, closedCount, totalCount |
| `categories` | Tickets by category | category_id, name, openCount, closedCount, totalCount |
| `staff` | Per-staff activity | person_id, name, openCount, closedCount, assignedCount |
| `person` | Tickets for one person | person_id, name, tickets (array) |
| `sla` | SLA compliance by category | category_id, name, slaDays, onTime, late, percentage |
| `volume` | Volume over time (daily/weekly/monthly) | period, count |
| `current` | Open tickets by category/dept | category_id or dept_id, openCount |
| `opened` | Tickets opened in period | date range, tickets array |
| `closed` | Tickets closed in period | date range, tickets array |

---

### Inputs

**Metrics endpoint:**
- `category_id` (integer, required): Category to calculate metrics for.
- `numDays` (integer, optional): Lookback window; default 30.
- `effectiveDate` (ISO date, optional): Window end date; default today.

**Reports endpoint:**
- `reportType` (string, required): One of the report types above.
- `startDate` (ISO date, optional): Report date range start.
- `endDate` (ISO date, optional): Report date range end.
- `category_id` (integer, optional): Filter by category.
- `department_id` (integer, optional): Filter by department.
- `person_id` (integer, optional): Filter by person (required for `person` report).
- `granularity` (string, optional): `daily`, `weekly`, `monthly` for volume report.

---

### Outputs

**Metrics response:**
```json
{
  "category_id": 5,
  "categoryName": "Pothole",
  "numDays": 30,
  "effectiveDate": "2026-06-24",
  "onTimePercentage": 73.5,
  "closedCount": 40,
  "onTimeCount": 29
}
```

**Report responses:** Structured JSON arrays (see report type table above). All report responses include `reportType`, `generatedAt`, and a `data` array.

---

### Validation Rules

- All metrics/reports endpoints require `staff` role.
- `category_id` for metrics must reference an existing category.
- `numDays` must be a positive integer; max 365.
- `effectiveDate` must be a valid ISO 8601 date if provided; defaults to current server date.
- `reportType` must be one of the defined values; unknown type returns 404.
- Date range for reports: `startDate` must be before or equal to `endDate`.
- `person_id` is required for `person` report type.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Non-staff access | 403 | PERMISSION_DENIED | "Reports require staff role" |
| Category not found (metrics) | 404 | CATEGORY_NOT_FOUND | "Category not found" |
| Unknown reportType | 404 | REPORT_NOT_FOUND | "Unknown report type" |
| Invalid numDays | 422 | INVALID_PARAM | "numDays must be between 1 and 365" |
| Invalid date format | 422 | INVALID_DATE | "Date must be ISO 8601 format" |
| startDate after endDate | 422 | INVALID_DATE_RANGE | "startDate must be before endDate" |
| person_id missing for person report | 422 | MISSING_REQUIRED_FIELD | "person_id is required for person report" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Metrics`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/metrics` | staff | Calculate onTimePercentage for a category |
| GET | `/api/v1/reports/{reportType}` | staff | Run a canned report |

---

### Schema Surface (this feature)

No new tables. All queries run against `tickets`, `ticketHistory`, `categories`, `people`, `departments`. See `Y0a-schema-core.md §Tickets`. SQL queries should use indexed columns (`enteredDate`, `closedDate`, `status`, `category_id`, `assignedPerson_id`) for sub-500ms performance on 500K+ ticket datasets.
---

## F18: Multi-Format Output Feeds

**Description:** The legacy PHP template system renders responses in multiple formats by switching template files based on a `format` request parameter or `Accept` header. The new Spring Boot system must support equivalent multi-format output for all endpoints that currently support it. Open311 endpoints must support JSON and XML with byte-compatible response shapes. The React SPA consumes JSON; CSV and print-HTML are staff export formats; XML is required for legacy Open311 consumers.

---

### Terminology

- **format param:** `?format=json`, `?format=xml`, `?format=csv`, `?format=print`, `?format=txt` — controls output format.
- **Content negotiation:** Spring `HttpMessageConverter` selection; `format` query param takes precedence over `Accept` header for Open311 compatibility.
- **Byte-compatible XML:** The XML response shapes must exactly match the current PHP Laminas XML template output — same element names, same attribute structure, same encoding.
- **CSV export:** A downloadable `text/csv` file for ticket search results (staff only).
- **Print HTML:** A server-rendered HTML page optimized for browser print, served for ticket search results.

---

### Sub-features

- JSON output (default for all API endpoints)
- XML output for Open311 endpoints (byte-compatible)
- CSV export for ticket search (staff only)
- Print-friendly HTML for ticket search (staff only)
- TXT output where currently supported
- `format` query param overrides Accept header
- Open311 endpoints: `format=json` and `format=xml`

---

### Format Support Matrix

| Endpoint Group | JSON | XML | CSV | Print HTML | TXT |
|---------------|------|-----|-----|------------|-----|
| Open311 /discovery | ✓ | ✓ | ✗ | ✗ | ✗ |
| Open311 /services | ✓ | ✓ | ✗ | ✗ | ✗ |
| Open311 /requests | ✓ | ✓ | ✗ | ✗ | ✗ |
| GET /api/v1/tickets | ✓ | ✗ | ✓ (staff) | ✓ (staff) | ✗ |
| GET /api/v1/tickets/export | ✗ | ✗ | ✓ | ✓ | ✗ |
| All other /api/v1/* | ✓ | ✗ | ✗ | ✗ | ✗ |

---

### Process

#### Format Resolution
1. Request arrives at any endpoint.
2. Spring filter checks `?format=` query param.
3. If `format=xml` → sets response `Content-Type: application/xml; charset=UTF-8`.
4. If `format=csv` → sets `Content-Type: text/csv; charset=UTF-8`; adds `Content-Disposition: attachment; filename="tickets.csv"`.
5. If `format=print` → returns HTML template (server-rendered via Thymeleaf or similar; or delegates to React print route).
6. If no `format` param → uses `Accept` header negotiation; defaults to `application/json`.

#### Open311 XML Output
1. Open311 controller serializes response using dedicated XML message converter.
2. XML must use exact GeoReport v2 element structure:
   - `<services>` containing `<service>` elements.
   - `<service_requests>` containing `<request>` elements.
   - Field names must match JSON field names as XML element names (e.g., `<service_code>`, `<service_request_id>`).
3. XML declaration: `<?xml version="1.0" encoding="utf-8"?>`.
4. No XML attributes — all values as text content of elements.

#### CSV Export (Tickets)
1. Staff requests `/api/v1/tickets/export?format=csv` with filter params (F11).
2. System queries all matching tickets (no pagination limit for staff export).
3. System writes CSV rows with headers matching legacy export columns.
4. Streams response without buffering entire result set (use Spring `StreamingResponseBody`).

**CSV Column Order:**
id, enteredDate, lastModified, closedDate, status, substatus, category, department, issueType, description, location, city, state, zip, latitude, longitude, assignedPerson, reportedBy, contactMethod, client, customFields

---

### Inputs

- `format` (string, optional query param): `json` | `xml` | `csv` | `print` | `txt`. Defaults to `json`.
- `Accept` header (optional): Used if `format` not specified. `application/json`, `application/xml`, `text/csv`, `text/html`.

---

### Outputs

- **JSON:** `application/json` — standard REST response bodies.
- **XML:** `application/xml` — GeoReport v2 compliant XML for Open311 endpoints.
- **CSV:** `text/csv` — streaming comma-separated values with header row.
- **Print HTML:** `text/html` — print-optimized ticket list.

---

### Validation Rules

- `format` param must be one of the supported values for the endpoint; unsupported combinations return 400.
- CSV and print formats require `staff` role (enforced by F03 permission check).
- XML output for Open311 must be validated against GeoReport v2 fixture files in CI (NFR-1).
- The `format` query param takes precedence over the `Accept` header to preserve legacy behavior.
- XML character encoding must be UTF-8.
- XML must use no XML attributes — all data as element text content (matches legacy PHP template output).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Unsupported format for endpoint | 400 | UNSUPPORTED_FORMAT | "Format 'txt' is not supported for this endpoint" |
| CSV/print requested by non-staff | 403 | PERMISSION_DENIED | "Export formats require staff role" |
| format param value unrecognized | 400 | INVALID_FORMAT | "Unknown format: {value}" |

---

### API Surface (this feature)

Cross-cutting — applies to all endpoints. No dedicated API surface. Format is a query parameter modifier on existing endpoints. See `Y1b-api-tickets.md §Export` for CSV/print endpoint specs.

---

### Schema Surface (this feature)

No database tables. Format selection is a presentation-layer concern handled by Spring `HttpMessageConverter` configuration and `ContentNegotiationStrategy`.
---

## F19: Issue Type Management

**Description:** Issue types provide a secondary classification for tickets beyond category. They represent the nature of the constituent's concern: Comment, Complaint, Question, Report, Request, or Violation. Issue types are seeded at installation and may be extended by administrators. A ticket optionally carries an `issueType_id`.

---

### Terminology

- **Issue type:** A named label classifying the constituent's intent (Comment, Complaint, Question, Report, Request, Violation).
- **System issue type:** One of the six seeded values; cannot be deleted.

---

### Sub-features

- Seed six system issue types
- Assign issue type to ticket at creation or update
- Filter ticket searches by issue type (F11)
- Administrative CRUD for issue type records

---

### Seed Data

| ID | Name |
|----|------|
| 1 | Comment |
| 2 | Complaint |
| 3 | Question |
| 4 | Report |
| 5 | Request |
| 6 | Violation |

---

### Process

#### Create Issue Type
1. Staff POSTs to `POST /api/v1/issue-types` with `name`.
2. System validates `name` is non-empty and unique.
3. System inserts `issueTypes` row.
4. Returns created issue type with 201.

#### Delete Issue Type
1. Staff DELETEs `/api/v1/issue-types/{id}`.
2. System blocks delete of system issue types (IDs 1–6).
3. System blocks delete if any `tickets.issueType_id` references it.
4. Returns 204.

---

### Inputs

- `name` (string, required): Issue type name; max 100 chars.

---

### Outputs

- **Issue type object:** id, name, isSystem (boolean).
- **Issue types list:** Array of all issue types.

---

### Validation Rules

- `name` required; max 100 chars; must be unique (case-insensitive).
- System issue types (IDs 1–6) cannot be deleted or renamed.
- Deleting an issue type referenced by any ticket is blocked.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Issue type not found | 404 | ISSUE_TYPE_NOT_FOUND | "Issue type not found" |
| Delete system issue type | 403 | SYSTEM_ISSUE_TYPE | "System issue types cannot be deleted" |
| Delete blocked by tickets | 409 | ISSUE_TYPE_IN_USE | "Issue type is referenced by existing tickets" |
| Duplicate name | 409 | ISSUE_TYPE_CONFLICT | "Issue type name already exists" |

---

### API Surface (this feature)

See schemas in `Y1c-api-admin.md §IssueTypes`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/issue-types` | none | List all issue types |
| POST | `/api/v1/issue-types` | staff | Create issue type |
| DELETE | `/api/v1/issue-types/{id}` | staff | Delete issue type |

---

### Schema Surface (this feature)

Table: `issueTypes`. See `Y0a-schema-core.md §IssueTypes`.

Key columns: id (SERIAL PK), name (VARCHAR 100 UNIQUE), isSystem (BOOLEAN DEFAULT false).
---

## F20: Response Templates

**Description:** Response templates provide staff with pre-authored text blocks for common ticket responses. Each template is associated with an action type and can be selected when recording a response action on a ticket. The template text pre-populates the `notes` field on a new history entry, which staff may edit before saving. This feature reduces repetitive typing for common responses (e.g., "We will inspect this within 48 hours").

---

### Terminology

- **Response template:** A named text block associated with an action type, used as a starting point for history entry notes.
- **responseTemplates:** The table storing these text blocks.

---

### Sub-features

- Create, read, update, delete response template records
- Associate a response template with an action type
- List available templates when recording a response on a ticket
- Use template text as starting point for history entry notes field

---

### Process

#### Create Response Template
1. Staff POSTs to `POST /api/v1/response-templates` with `name`, `template`, `action_id`.
2. System validates `action_id` references an existing action.
3. System inserts `responseTemplates` row.
4. Returns created template with 201.

#### Use Template on Ticket Response
1. Staff opens ticket response form; GETs `/api/v1/response-templates?action_id={id}` to load available templates.
2. Staff selects a template; client pre-populates the `notes` textarea with `template.template`.
3. Staff edits as needed and submits the history entry (POST `/api/v1/tickets/{id}/comments` or response action).
4. The template text is not stored on the history entry — only the final notes text is stored.

---

### Inputs

- `name` (string, required): Template display name; max 200 chars.
- `template` (text, required): Pre-authored response text; max 65,535 chars.
- `action_id` (integer, optional): FK to `actions.id`; associates template with an action type.

---

### Outputs

- **Response template object:** id, name, template, action_id, action (name).
- **Response templates list:** Array of template objects, optionally filtered by `action_id`.

---

### Validation Rules

- `name` required; max 200 chars.
- `template` required; max 65,535 chars.
- `action_id` must reference an existing action if provided.
- No uniqueness constraint on name (multiple templates per action allowed).
- Deleting a template does not affect existing history entries (template text was never stored on history).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Response template not found | 404 | TEMPLATE_NOT_FOUND | "Response template not found" |
| action_id not found | 422 | ACTION_NOT_FOUND | "Action not found" |
| name missing | 422 | MISSING_REQUIRED_FIELD | "Template name is required" |
| template text missing | 422 | MISSING_REQUIRED_FIELD | "Template text is required" |

---

### API Surface (this feature)

See schemas in `Y1c-api-admin.md §ResponseTemplates`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/response-templates` | staff | List all response templates |
| POST | `/api/v1/response-templates` | staff | Create response template |
| GET | `/api/v1/response-templates/{id}` | staff | Get template detail |
| PUT | `/api/v1/response-templates/{id}` | staff | Update response template |
| DELETE | `/api/v1/response-templates/{id}` | staff | Delete response template |

---

### Schema Surface (this feature)

Table: `responseTemplates`. See `Y0d-schema-geo.md §ResponseTemplates`.

Key columns: id (SERIAL PK), name (VARCHAR 200), template (TEXT), action_id (FK actions, nullable).
---

## Y0a: Database Schema — Core Tickets, History, Media, Auth, and Lookup Tables

**PostgreSQL 16 DDL. All timestamps are `TIMESTAMPTZ`. UUIDs use `gen_random_uuid()`. PostGIS extension required for geography columns.**

---

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

### issueTypes

```sql
CREATE TABLE issueTypes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    isSystem    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_issue_types_name UNIQUE (name)
);

-- Seed data
INSERT INTO issueTypes (id, name, isSystem) VALUES
    (1, 'Comment',   true),
    (2, 'Complaint', true),
    (3, 'Question',  true),
    (4, 'Report',    true),
    (5, 'Request',   true),
    (6, 'Violation', true);
SELECT setval('issuetypes_id_seq', 6);
```

---

### tickets

```sql
CREATE TABLE tickets (
    id                      BIGSERIAL PRIMARY KEY,
    parent_id               BIGINT         REFERENCES tickets(id) ON DELETE SET NULL,
    category_id             INTEGER        NOT NULL REFERENCES categories(id),
    issueType_id            INTEGER        REFERENCES issueTypes(id),
    client_id               INTEGER        REFERENCES clients(id) ON DELETE SET NULL,
    enteredByPerson_id      INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    reportedByPerson_id     INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    assignedPerson_id       INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    contactMethod_id        INTEGER        REFERENCES contactMethods(id),
    responseMethod_id       INTEGER        REFERENCES contactMethods(id),
    enteredDate             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    lastModified            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    addressId               INTEGER        REFERENCES locations(id) ON DELETE SET NULL,
    latitude                NUMERIC(9,6),
    longitude               NUMERIC(9,6),
    geo_point               GEOGRAPHY(POINT, 4326),
    location                TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(2),
    zip                     VARCHAR(10),
    status                  VARCHAR(20)    NOT NULL DEFAULT 'open'
                                           CHECK (status IN ('open','closed')),
    closedDate              TIMESTAMPTZ,
    substatus_id            INTEGER        REFERENCES substatus(id),
    additionalFields        JSONB,
    customFields            JSONB,
    description             TEXT           NOT NULL,
    search_vector           TSVECTOR
);

-- Indexes
CREATE INDEX idx_tickets_status        ON tickets (status);
CREATE INDEX idx_tickets_category      ON tickets (category_id);
CREATE INDEX idx_tickets_assignedPerson ON tickets (assignedPerson_id);
CREATE INDEX idx_tickets_reportedBy    ON tickets (reportedByPerson_id);
CREATE INDEX idx_tickets_enteredDate   ON tickets (enteredDate);
CREATE INDEX idx_tickets_closedDate    ON tickets (closedDate);
CREATE INDEX idx_tickets_lastModified  ON tickets (lastModified);
CREATE INDEX idx_tickets_substatus     ON tickets (substatus_id);
CREATE INDEX idx_tickets_client        ON tickets (client_id);
CREATE INDEX idx_tickets_parent        ON tickets (parent_id);
CREATE INDEX idx_tickets_fts           ON tickets USING GIN (search_vector);
CREATE INDEX idx_tickets_geo           ON tickets USING GIST (geo_point);

-- FTS update trigger
CREATE OR REPLACE FUNCTION tickets_fts_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.zip, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_tickets_fts
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION tickets_fts_update();

-- geo_point sync trigger
CREATE OR REPLACE FUNCTION tickets_geo_sync() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geo_point := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
    ELSE
        NEW.geo_point := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_tickets_geo
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION tickets_geo_sync();
```

---

### ticketHistory

```sql
CREATE TABLE ticketHistory (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    enteredByPerson_id  INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    actionPerson_id     INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    action_id           INTEGER        NOT NULL REFERENCES actions(id),
    enteredDate         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    actionDate          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    notes               TEXT,
    data                JSONB,
    sentNotifications   TEXT
);

CREATE INDEX idx_history_ticket     ON ticketHistory (ticket_id);
CREATE INDEX idx_history_action     ON ticketHistory (action_id);
CREATE INDEX idx_history_entered    ON ticketHistory (enteredDate);
CREATE INDEX idx_history_sn_null    ON ticketHistory (ticket_id) WHERE sentNotifications IS NULL;
```

---

### media

```sql
CREATE TABLE media (
    id                  BIGSERIAL PRIMARY KEY,
    ticket_id           BIGINT         NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    filename            VARCHAR(255)   NOT NULL,
    internalFilename    VARCHAR(255)   NOT NULL,
    mime_type           VARCHAR(100)   NOT NULL,
    uploaded            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    person_id           INTEGER        REFERENCES people(id) ON DELETE SET NULL,
    CONSTRAINT uq_media_internal_filename UNIQUE (internalFilename)
);

CREATE INDEX idx_media_ticket ON media (ticket_id);
```

---

### bookmarks

```sql
CREATE TABLE bookmarks (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type        VARCHAR(50)     NOT NULL DEFAULT 'search',
    name        VARCHAR(200)    NOT NULL,
    requestUri  VARCHAR(2048)   NOT NULL,
    createdAt   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_person ON bookmarks (person_id);
```

---

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    createdAt   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expiresAt   TIMESTAMPTZ     NOT NULL,
    revoked     BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_refresh_tokens_person  ON refresh_tokens (person_id);
CREATE INDEX idx_refresh_tokens_expiry  ON refresh_tokens (expiresAt) WHERE revoked = false;
```

---

### token_blacklist

```sql
CREATE TABLE token_blacklist (
    jti         VARCHAR(36)  PRIMARY KEY,
    expiresAt   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_token_blacklist_expiry ON token_blacklist (expiresAt);
```

---

### responseTemplates

```sql
CREATE TABLE responseTemplates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    template    TEXT            NOT NULL,
    action_id   INTEGER         REFERENCES actions(id) ON DELETE SET NULL
);

CREATE INDEX idx_response_templates_action ON responseTemplates (action_id);
```

---

### Notes on MySQL → PostgreSQL Mapping

| MySQL Type | PostgreSQL Equivalent | Notes |
|------------|----------------------|-------|
| `INT AUTO_INCREMENT` | `SERIAL` or `BIGSERIAL` | Use BIGSERIAL for high-volume tables (tickets, ticketHistory, media) |
| `ENUM('open','closed')` | `VARCHAR(20) CHECK (... IN (...))` | PostgreSQL ENUMs exist but CHECK constraints are more portable |
| `TEXT` | `TEXT` | Identical |
| `TINYINT(1)` | `BOOLEAN` | MySQL boolean equivalent |
| `DATETIME` | `TIMESTAMPTZ` | Always use timezone-aware timestamps |
| `JSON` | `JSONB` | PostgreSQL JSONB for indexable JSON |
| `POINT` (MySQL spatial) | `GEOGRAPHY(POINT, 4326)` (PostGIS) | Requires PostGIS extension |
| `VARCHAR(n)` | `VARCHAR(n)` | Identical |
| `FLOAT` / `DOUBLE` | `NUMERIC(9,6)` | Fixed precision for coordinates |
---

## Y0b: Database Schema — People, Clients, Contact Methods, Departments

---

### contactMethods

```sql
CREATE TABLE contactMethods (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    isSystem    BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT uq_contact_methods_name UNIQUE (name)
);

-- Seed data (stable IDs)
INSERT INTO contactMethods (id, name, isSystem) VALUES
    (1, 'Email',    true),
    (2, 'Phone',    true),
    (3, 'Web Form', true),
    (4, 'Other',    true);
SELECT setval('contactmethods_id_seq', 4);
```

---

### departments

```sql
CREATE TABLE departments (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100)    NOT NULL,
    defaultPerson_id    INTEGER,        -- FK added after people table (see below)
    CONSTRAINT uq_departments_name UNIQUE (name)
);
```

---

### people

```sql
CREATE TABLE people (
    id              SERIAL PRIMARY KEY,
    firstname       VARCHAR(100)    NOT NULL,
    middlename      VARCHAR(100),
    lastname        VARCHAR(100)    NOT NULL,
    organization    VARCHAR(200),
    address         VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(2),
    zip             VARCHAR(10),
    department_id   INTEGER         REFERENCES departments(id) ON DELETE SET NULL,
    username        VARCHAR(100),
    passwordHash    VARCHAR(255),
    role            VARCHAR(20)     CHECK (role IN ('staff', 'public', 'anonymous')),
    deletedAt       TIMESTAMPTZ,
    CONSTRAINT uq_people_username UNIQUE (username)
);

-- Add FK from departments to people (post-creation to avoid circular dependency)
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_default_person
    FOREIGN KEY (defaultPerson_id) REFERENCES people(id) ON DELETE SET NULL;

CREATE INDEX idx_people_department  ON people (department_id);
CREATE INDEX idx_people_role        ON people (role);
CREATE INDEX idx_people_username    ON people (username);
CREATE INDEX idx_people_name        ON people (lastname, firstname);
CREATE INDEX idx_people_deleted     ON people (deletedAt) WHERE deletedAt IS NULL;
```

---

### peopleEmails

```sql
CREATE TABLE peopleEmails (
    id                      SERIAL PRIMARY KEY,
    person_id               INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    email                   VARCHAR(255)    NOT NULL,
    label                   VARCHAR(50),    -- 'Home', 'Work', 'Other'
    usedForNotifications    BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_people_emails_person  ON peopleEmails (person_id);
CREATE INDEX idx_people_emails_email   ON peopleEmails (email);
CREATE INDEX idx_people_emails_notify  ON peopleEmails (person_id) WHERE usedForNotifications = true;
```

---

### peoplePhones

```sql
CREATE TABLE peoplePhones (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    number      VARCHAR(30)     NOT NULL,
    label       VARCHAR(50)     -- 'Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'
);

CREATE INDEX idx_people_phones_person ON peoplePhones (person_id);
```

---

### peopleAddresses

```sql
CREATE TABLE peopleAddresses (
    id          SERIAL PRIMARY KEY,
    person_id   INTEGER         NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100),
    state       VARCHAR(2),
    zip         VARCHAR(10),
    label       VARCHAR(50)     -- 'Home', 'Business', 'Rental'
);

CREATE INDEX idx_people_addresses_person ON peopleAddresses (person_id);
```

---

### clients

```sql
CREATE TABLE clients (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(200)    NOT NULL,
    url                 VARCHAR(500),
    api_key_hash        VARCHAR(255)    NOT NULL,   -- BCrypt hash for secure storage
    api_key_lookup      VARCHAR(64)     NOT NULL,   -- SHA-256 hex for fast indexed lookup
    contactPerson_id    INTEGER         REFERENCES people(id) ON DELETE SET NULL,
    contactMethod_id    INTEGER         REFERENCES contactMethods(id) ON DELETE SET NULL,
    CONSTRAINT uq_clients_api_key_lookup UNIQUE (api_key_lookup)
);

CREATE INDEX idx_clients_contact_person ON clients (contactPerson_id);
```

---

### department_actions

```sql
CREATE TABLE department_actions (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    action_id       INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, action_id)
);
```

---

### department_categories

```sql
CREATE TABLE department_categories (
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, category_id)
);
```

---

### Notes

- `people.deletedAt`: Soft-delete pattern. Application filters `WHERE deletedAt IS NULL` for active people. Physical delete blocked by FK constraints.
- `clients.api_key_hash` stores BCrypt-hashed raw key (for secure comparison). `clients.api_key_lookup` stores SHA-256(raw_key) for indexed fast lookup (raw key never stored).
- `departments.defaultPerson_id` FK is added after `people` to avoid a circular dependency at DDL time.
- `department_actions` and `department_categories` are explicit join tables preserving the MySQL many-to-many relationships.
---

## Y0c: Database Schema — Categories, Actions, Substatus

---

### substatus

```sql
CREATE TABLE substatus (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    status      VARCHAR(10)     NOT NULL CHECK (status IN ('open', 'closed')),
    isDefault   BOOLEAN         NOT NULL DEFAULT false,
    isSystem    BOOLEAN         NOT NULL DEFAULT false
);

CREATE INDEX idx_substatus_status    ON substatus (status);
CREATE INDEX idx_substatus_default   ON substatus (status) WHERE isDefault = true;

-- Seed data
INSERT INTO substatus (id, name, description, status, isDefault, isSystem) VALUES
    (1, 'Open',      'Ticket is open',                  'open',   true,  true),
    (2, 'Resolved',  'Issue has been resolved',          'closed', true,  true),
    (3, 'Duplicate', 'Ticket is a duplicate of another', 'closed', false, true),
    (4, 'Bogus',     'Ticket was invalid or bogus',      'closed', false, true);
SELECT setval('substatus_id_seq', 4);
```

---

### categoryGroups

```sql
CREATE TABLE categoryGroups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    ordering    INTEGER         NOT NULL DEFAULT 0
);

CREATE INDEX idx_category_groups_ordering ON categoryGroups (ordering);
```

---

### categories

```sql
CREATE TABLE categories (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(200)    NOT NULL,
    description                 TEXT,
    department_id               INTEGER         REFERENCES departments(id) ON DELETE SET NULL,
    defaultPerson_id            INTEGER         REFERENCES people(id) ON DELETE SET NULL,
    categoryGroup_id            INTEGER         REFERENCES categoryGroups(id) ON DELETE SET NULL,
    active                      BOOLEAN         NOT NULL DEFAULT true,
    featured                    BOOLEAN         NOT NULL DEFAULT false,
    displayPermissionLevel      VARCHAR(20)     NOT NULL DEFAULT 'anonymous'
                                                CHECK (displayPermissionLevel IN ('staff','public','anonymous')),
    postingPermissionLevel      VARCHAR(20)     NOT NULL DEFAULT 'anonymous'
                                                CHECK (postingPermissionLevel IN ('staff','public','anonymous')),
    customFields                JSONB,
    lastModified                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    slaDays                     INTEGER,
    notificationReplyEmail      VARCHAR(255),
    autoCloseIsActive           BOOLEAN         NOT NULL DEFAULT false,
    autoCloseSubstatus_id       INTEGER         REFERENCES substatus(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_department      ON categories (department_id);
CREATE INDEX idx_categories_group           ON categories (categoryGroup_id);
CREATE INDEX idx_categories_active          ON categories (active) WHERE active = true;
CREATE INDEX idx_categories_posting_perm    ON categories (postingPermissionLevel);
```

---

### actions

```sql
CREATE TABLE actions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    type        VARCHAR(20)     NOT NULL CHECK (type IN ('system', 'department')),
    template    TEXT,
    replyEmail  VARCHAR(255)
);

CREATE INDEX idx_actions_type ON actions (type);

-- System action seed data
INSERT INTO actions (id, name, description, type, template) VALUES
    (1,  'open',            'Ticket opened',                             'system', 'Ticket opened by {enteredByPerson}'),
    (2,  'assignment',      'Ticket assigned to person',                 'system', 'Assigned to {actionPerson} by {enteredByPerson}'),
    (3,  'closed',          'Ticket closed',                             'system', 'Closed by {enteredByPerson}'),
    (4,  'changeCategory',  'Ticket category changed',                   'system', 'Category changed from {original:category_id} to {updated:category_id} by {enteredByPerson}'),
    (5,  'changeLocation',  'Ticket location changed',                   'system', 'Location changed from {original:location} to {updated:location} by {enteredByPerson}'),
    (6,  'response',        'Response recorded on ticket',               'system', 'Response recorded by {enteredByPerson}'),
    (7,  'duplicate',       'Ticket marked as duplicate',                'system', 'Marked as duplicate of #{duplicate:ticket_id} by {enteredByPerson}'),
    (8,  'update',          'Ticket updated',                            'system', 'Updated by {enteredByPerson}'),
    (9,  'comment',         'Comment added to ticket',                   'system', 'Comment added by {enteredByPerson}'),
    (10, 'upload_media',    'Media uploaded to ticket',                  'system', 'Media uploaded by {enteredByPerson}');
SELECT setval('actions_id_seq', 10);
```

---

### category_action_responses

```sql
CREATE TABLE category_action_responses (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER     NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    action_id       INTEGER     NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    template        TEXT,
    replyEmail      VARCHAR(255),
    CONSTRAINT uq_cat_action_response UNIQUE (category_id, action_id)
);

CREATE INDEX idx_cat_action_responses_category ON category_action_responses (category_id);
CREATE INDEX idx_cat_action_responses_action   ON category_action_responses (action_id);
```

---

### Notes

- `substatus.isDefault` uniqueness per status: enforced at application layer (F08 process step). DB allows multiple defaults but app logic maintains invariant.
- `categories.customFields` JSONB schema format is defined in F07. No DB-level JSON schema validation; application layer validates structure on write.
- `actions` seed IDs 1–10 are stable system records. Action IDs above 10 are department-created custom actions.
- `category_action_responses` UNIQUE constraint on `(category_id, action_id)` ensures one override per category+action combination; application performs upsert.
---

## Y0d: Database Schema — Geo, Locations, and Miscellaneous

---

### locations

```sql
CREATE TABLE locations (
    id          SERIAL PRIMARY KEY,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100),
    state       VARCHAR(2),
    zip         VARCHAR(10),
    latitude    NUMERIC(9,6),
    longitude   NUMERIC(9,6),
    geo_point   GEOGRAPHY(POINT, 4326)
);

CREATE INDEX idx_locations_geo   ON locations USING GIST (geo_point);
CREATE INDEX idx_locations_addr  ON locations (address, city, state, zip);
```

---

### geoclusters

```sql
CREATE TABLE geoclusters (
    id      BIGSERIAL PRIMARY KEY,
    level   SMALLINT            NOT NULL CHECK (level BETWEEN 0 AND 6),
    center  GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE INDEX idx_geoclusters_level  ON geoclusters (level);
CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center);
```

---

### ticket_geodata

```sql
CREATE TABLE ticket_geodata (
    ticket_id       BIGINT  PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    cluster_id_0    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_1    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_2    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_3    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_4    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_5    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL,
    cluster_id_6    BIGINT  REFERENCES geoclusters(id) ON DELETE SET NULL
);

CREATE INDEX idx_ticket_geodata_c0 ON ticket_geodata (cluster_id_0);
CREATE INDEX idx_ticket_geodata_c1 ON ticket_geodata (cluster_id_1);
CREATE INDEX idx_ticket_geodata_c2 ON ticket_geodata (cluster_id_2);
CREATE INDEX idx_ticket_geodata_c3 ON ticket_geodata (cluster_id_3);
CREATE INDEX idx_ticket_geodata_c4 ON ticket_geodata (cluster_id_4);
CREATE INDEX idx_ticket_geodata_c5 ON ticket_geodata (cluster_id_5);
CREATE INDEX idx_ticket_geodata_c6 ON ticket_geodata (cluster_id_6);
```

---

### responseTemplates

```sql
-- (Also declared in Y0a for reference; canonical DDL here)
CREATE TABLE IF NOT EXISTS responseTemplates (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    template    TEXT            NOT NULL,
    action_id   INTEGER         REFERENCES actions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_response_templates_action ON responseTemplates (action_id);
```

---

### DDL Dependency Order

The tables must be created in this order to satisfy FK constraints:

1. `contactMethods`
2. `departments` (without FK to people initially)
3. `people` (references departments)
4. `ALTER TABLE departments ADD CONSTRAINT ... FOREIGN KEY (defaultPerson_id) REFERENCES people`
5. `peopleEmails`, `peoplePhones`, `peopleAddresses` (reference people)
6. `clients` (references people, contactMethods)
7. `substatus`
8. `categoryGroups`
9. `categories` (references departments, people, categoryGroups, substatus)
10. `actions`
11. `category_action_responses` (references categories, actions)
12. `department_actions` (references departments, actions)
13. `department_categories` (references departments, categories)
14. `issueTypes`
15. `locations`
16. `tickets` (references categories, people, clients, contactMethods, locations, substatus, issueTypes)
17. `ticketHistory` (references tickets, people, actions)
18. `media` (references tickets, people)
19. `bookmarks` (references people)
20. `geoclusters`
21. `ticket_geodata` (references tickets, geoclusters)
22. `responseTemplates` (references actions)
23. `refresh_tokens` (references people)
24. `token_blacklist` (no FKs)

---

### Migration Notes (MySQL → PostgreSQL)

- All `INT AUTO_INCREMENT` PKs become `SERIAL` (or `BIGSERIAL` for high-volume tables).
- MySQL `ENUM` types become `VARCHAR(n) CHECK (value IN (...))` for portability.
- MySQL `TINYINT(1)` booleans become PostgreSQL `BOOLEAN`.
- MySQL `DATETIME` becomes `TIMESTAMPTZ` (timezone-aware).
- MySQL `JSON` becomes `JSONB` (binary JSON with GIN index support).
- MySQL spatial `POINT` becomes PostGIS `GEOGRAPHY(POINT, 4326)`.
- MySQL `TEXT` stays `TEXT`.
- All `FOREIGN KEY ... ON DELETE` behaviors are preserved.
- Sequence values must be reset after data migration: `SELECT setval('tablename_id_seq', (SELECT MAX(id) FROM tablename))` for each table.
---

## Y1a: REST API — Authentication, People, Departments, Clients

**Base path prefix:** `/api/v1/`  
**Auth:** `Authorization: Bearer <jwt>` unless noted.  
**Content-Type:** `application/json` for all requests unless noted.  
**Error shape:** `{ "error": "ERROR_CODE", "message": "Human readable message" }`

---

### Auth Endpoints

#### POST /api/v1/auth/login
Authenticate staff user with username and password.

**Auth:** None required.

**Request:**
```json
{ "username": "jsmith", "password": "s3cr3t" }
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresIn": 3600,
  "role": "staff",
  "personId": 42
}
```

**Errors:** 401 AUTH_FAILED, 422 MISSING_REQUIRED_FIELD.

---

#### POST /api/v1/auth/refresh
Rotate access and refresh tokens.

**Auth:** None (refresh token in body).

**Request:**
```json
{ "refreshToken": "550e8400-e29b-41d4-a716-446655440000" }
```

**Response 200:** Same shape as login response.

**Errors:** 401 REFRESH_TOKEN_INVALID.

---

#### POST /api/v1/auth/logout
Revoke refresh token and blacklist access token JTI.

**Auth:** Bearer JWT required.

**Request:**
```json
{ "refreshToken": "550e8400-..." }
```

**Response 200:** `{}`

---

#### GET /callback
OAuth/external IdP callback. Exchanges auth code for local JWT.

**Auth:** None (OAuth code in query param).

**Query params:** `code` (required), `state` (required).

**Response:** Redirect to SPA with tokens in query params or cookie.

**Errors:** 400 OAUTH_STATE_INVALID, 404 PERSON_NOT_FOUND.

---

### People Endpoints

#### GET /api/v1/people
List and search people.

**Auth:** staff.

**Query params:** `q` (string), `role` (staff/public/anonymous), `department_id` (integer), `organization` (string), `page` (integer, default 1), `limit` (integer, default 25).

**Response 200:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 25,
  "people": [
    {
      "id": 1,
      "firstname": "Jane",
      "middlename": null,
      "lastname": "Smith",
      "organization": "City Hall",
      "address": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "department_id": 3,
      "departmentName": "Streets",
      "username": "jsmith",
      "role": "staff"
    }
  ]
}
```

---

#### POST /api/v1/people
Create a new person.

**Auth:** staff.

**Request:**
```json
{
  "firstname": "Jane",
  "lastname": "Smith",
  "organization": "City Hall",
  "department_id": 3,
  "username": "jsmith",
  "password": "s3cr3t",
  "role": "staff",
  "emails": [
    { "email": "jsmith@city.gov", "label": "Work", "usedForNotifications": true }
  ],
  "phones": [
    { "number": "555-1234", "label": "Work" }
  ],
  "addresses": []
}
```

**Response 201:** Full person object with id, sub-arrays.

**Errors:** 409 USERNAME_CONFLICT, 422 INVALID_ROLE, 422 INVALID_EMAIL, 422 MISSING_REQUIRED_FIELD.

---

#### GET /api/v1/people/{id}
Get person detail including sub-records.

**Auth:** staff.

**Response 200:** Full person object with emails, phones, addresses arrays.

**Errors:** 404 PERSON_NOT_FOUND.

---

#### PUT /api/v1/people/{id}
Replace person record (full update).

**Auth:** staff.

**Request:** Same shape as POST.

**Response 200:** Updated person object.

**Errors:** 404, 409 USERNAME_CONFLICT, 422.

---

#### PATCH /api/v1/people/{id}
Partial update of person fields.

**Auth:** staff.

**Request:** Any subset of person fields.

**Response 200:** Updated person object.

---

#### DELETE /api/v1/people/{id}
Soft-delete person (sets `deletedAt = NOW()`).

**Auth:** staff.

**Response 204:** No body.

**Errors:** 404, 409 PERSON_IN_USE.

---

#### GET /api/v1/people/{id}/tickets
Get all tickets associated with person (reported, assigned, or entered).

**Auth:** staff.

**Query params:** `role` (reported/assigned/entered), `page`, `limit`.

**Response 200:** Paginated ticket list.

---

#### People Email Sub-Endpoints

```
POST   /api/v1/people/{id}/emails              Create email
PUT    /api/v1/people/{id}/emails/{emailId}    Update email
DELETE /api/v1/people/{id}/emails/{emailId}    Delete email
```

**Request (POST/PUT):**
```json
{ "email": "jane@home.com", "label": "Home", "usedForNotifications": false }
```

**Response:** 201 (POST) or 200 (PUT) with email object `{ id, person_id, email, label, usedForNotifications }`.

---

#### People Phone Sub-Endpoints

```
POST   /api/v1/people/{id}/phones              Create phone
PUT    /api/v1/people/{id}/phones/{phoneId}    Update phone
DELETE /api/v1/people/{id}/phones/{phoneId}    Delete phone
```

**Request:** `{ "number": "555-9876", "label": "Mobile" }`

---

#### People Address Sub-Endpoints

```
POST   /api/v1/people/{id}/addresses             Create address
PUT    /api/v1/people/{id}/addresses/{addrId}    Update address
DELETE /api/v1/people/{id}/addresses/{addrId}    Delete address
```

**Request:** `{ "address": "456 Oak Ave", "city": "Springfield", "state": "IL", "zip": "62702", "label": "Home" }`

---

### Department Endpoints

#### GET /api/v1/departments
List all departments.

**Auth:** staff.

**Response 200:**
```json
[
  { "id": 1, "name": "Streets", "defaultPerson_id": 12, "defaultPersonName": "Bob Jones" }
]
```

---

#### POST /api/v1/departments
Create department.

**Auth:** staff.

**Request:** `{ "name": "Parks", "defaultPerson_id": 7 }`

**Response 201:** Department object.

**Errors:** 409 DEPT_NAME_CONFLICT, 422 INVALID_DEFAULT_PERSON.

---

#### GET /api/v1/departments/{id}
Get department detail.

**Auth:** staff.

**Response 200:** Department object with staffCount, categoryCount.

---

#### PUT /api/v1/departments/{id}
Update department.

**Auth:** staff.

**Response 200:** Updated department object.

---

#### DELETE /api/v1/departments/{id}
Delete department.

**Auth:** staff.

**Response 204.**

**Errors:** 404, 409 DEPT_IN_USE.

---

#### GET /api/v1/departments/{id}/people
List staff members in department.

**Auth:** staff.

**Response 200:** Paginated people list.

---

#### GET /api/v1/departments/{id}/categories
List categories in department.

**Auth:** staff.

**Response 200:** Array of category summaries.

---

#### PUT /api/v1/departments/{id}/categories
Set full category list for department (replaces existing associations).

**Auth:** staff.

**Request:** `{ "category_ids": [1, 2, 5] }`

**Response 200:** Updated category list.

---

#### PUT /api/v1/departments/{id}/actions
Set full action list for department.

**Auth:** staff.

**Request:** `{ "action_ids": [1, 2, 3, 11] }`

**Response 200:** Updated action list.

---

### Client Endpoints

#### GET /api/v1/clients
List all API clients.

**Auth:** staff.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "MobileApp",
    "url": "https://app.example.com",
    "contactPerson_id": 5,
    "contactPersonName": "Alice Brown",
    "contactMethod_id": 1,
    "contactMethodName": "Email"
  }
]
```

Note: `api_key` / `api_key_hash` never returned.

---

#### POST /api/v1/clients
Register new API client.

**Auth:** staff.

**Request:**
```json
{
  "name": "MobileApp",
  "url": "https://app.example.com",
  "contactPerson_id": 5,
  "contactMethod_id": 1
}
```

**Response 201:**
```json
{
  "id": 2,
  "name": "MobileApp",
  "rawApiKey": "a3f2c8d1e9b04f7..."
}
```
`rawApiKey` is returned **once only** — not retrievable again.

---

#### GET /api/v1/clients/{id}
Get client detail (no api_key).

**Auth:** staff.

**Response 200:** Client object without api_key fields.

---

#### PATCH /api/v1/clients/{id}
Update client or regenerate API key.

**Auth:** staff.

**Request:** Any subset of client fields, plus optional `"regenerateApiKey": true`.

**Response 200:** Updated client object. If key regenerated, includes `rawApiKey` field.

---

#### DELETE /api/v1/clients/{id}
Delete API client.

**Auth:** staff.

**Response 204.**

**Errors:** 404, 409 CLIENT_IN_USE.
---

## Y1b: REST API — Tickets, History, Search, Media, Bookmarks, Open311

**Base path:** `/api/v1/` (internal), `/open311/` (Open311 GeoReport v2).

---

### Ticket Endpoints

#### POST /api/v1/tickets
Create a new ticket.

**Auth:** anonymous/public/staff depending on category's `postingPermissionLevel`.

**Request:**
```json
{
  "category_id": 5,
  "description": "Large pothole on Main St near Oak Ave",
  "location": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "latitude": 39.7817,
  "longitude": -89.6501,
  "reportedByPerson_id": null,
  "reporterFirstname": "John",
  "reporterLastname": "Doe",
  "reporterEmail": "john.doe@email.com",
  "issueType_id": 5,
  "contactMethod_id": 3,
  "responseMethod_id": 1,
  "customFields": { "severity": "High" },
  "additionalFields": {}
}
```

**Response 201:**
```json
{
  "id": 1001,
  "status": "open",
  "substatus": "Open",
  "category_id": 5,
  "categoryName": "Pothole",
  "description": "Large pothole on Main St near Oak Ave",
  "location": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "latitude": 39.7817,
  "longitude": -89.6501,
  "enteredDate": "2026-06-24T10:00:00Z",
  "lastModified": "2026-06-24T10:00:00Z",
  "assignedPerson_id": null,
  "reportedByPerson_id": 87,
  "customFields": { "severity": "High" }
}
```

---

#### GET /api/v1/tickets/{id}
Get ticket detail.

**Auth:** anonymous/public/staff per category `displayPermissionLevel`.

**Response 200:** Full ticket object plus `historyCount`, `mediaCount`.

**Errors:** 404, 403.

---

#### PATCH /api/v1/tickets/{id}
Update ticket fields.

**Auth:** staff.

**Request:** Any subset of updatable ticket fields (description, category_id, location fields, assignedPerson_id, customFields, additionalFields, issueType_id, contactMethod_id, responseMethod_id).

**Response 200:** Updated ticket object.

---

#### PATCH /api/v1/tickets/{id}/assign
Assign ticket to a staff person.

**Auth:** staff.

**Request:** `{ "assignedPerson_id": 12 }`

**Response 200:** Updated ticket object.

**Errors:** 404, 422 INVALID_ASSIGNEE.

---

#### PATCH /api/v1/tickets/{id}/close
Close ticket with substatus.

**Auth:** staff.

**Request:** `{ "substatus_id": 2, "notes": "Pothole filled 2026-06-24" }`

**Response 200:** Updated ticket with `status = "closed"`.

**Errors:** 404, 422 INVALID_SUBSTATUS, 422 INVALID_TRANSITION.

---

#### PATCH /api/v1/tickets/{id}/reopen
Reopen a closed ticket.

**Auth:** staff.

**Request:** `{}` (empty; optional `notes`)

**Response 200:** Updated ticket with `status = "open"`.

**Errors:** 404, 422 INVALID_TRANSITION.

---

#### PATCH /api/v1/tickets/{id}/duplicate
Mark ticket as duplicate of another.

**Auth:** staff.

**Request:** `{ "parent_id": 500 }`

**Response 200:** Updated ticket with `parent_id` set and `status = "closed"`.

**Errors:** 404, 422 CIRCULAR_DUPLICATE.

---

#### POST /api/v1/tickets/{id}/comments
Add a comment to a ticket.

**Auth:** staff.

**Request:** `{ "notes": "Forwarded to Streets department for review." }`

**Response 201:** History entry object.

---

#### DELETE /api/v1/tickets/{id}
Delete ticket (hard delete; admin use only).

**Auth:** staff.

**Response 204.**

---

### Ticket History Endpoints

#### GET /api/v1/tickets/{id}/history
Get full history for a ticket, ordered by enteredDate ASC.

**Auth:** staff.

**Response 200:**
```json
{
  "ticketId": 1001,
  "history": [
    {
      "id": 2001,
      "action_id": 1,
      "actionName": "open",
      "actionType": "system",
      "enteredByPerson_id": 42,
      "enteredByPersonName": "Jane Smith",
      "actionPerson_id": null,
      "actionPersonName": null,
      "enteredDate": "2026-06-24T10:00:00Z",
      "actionDate": "2026-06-24T10:00:00Z",
      "notes": null,
      "data": null,
      "sentNotifications": "john.doe@email.com",
      "renderedDescription": "Ticket opened by Jane Smith"
    }
  ]
}
```

---

#### GET /api/v1/tickets/{id}/history/{historyId}
Get single history entry.

**Auth:** staff.

**Response 200:** Single history entry object.

---

### Ticket Search Endpoints

#### GET /api/v1/tickets
Search and list tickets with filters.

**Auth:** anonymous/public/staff (per category display permissions; staff see all).

**Query params:** See F11 §Search Filter Parameters.

**Response 200:**
```json
{
  "total": 342,
  "page": 1,
  "limit": 25,
  "tickets": [ { ticket summary objects... } ]
}
```

---

#### GET /api/v1/tickets/export
Export search results as CSV or print HTML.

**Auth:** staff.

**Query params:** Same as GET /api/v1/tickets plus `format=csv` or `format=print`.

**Response:** `text/csv` stream (CSV) or `text/html` (print).

---

#### GET /api/v1/tickets/map
Map view with geo-cluster counts.

**Auth:** anonymous/public/staff.

**Query params:** Same filters as search, plus `zoomLevel` (0–6, default 3).

**Response 200:**
```json
{
  "clusters": [
    { "cluster_id": 101, "count": 12, "lat": 39.781, "long": -89.650 },
    { "cluster_id": 102, "count": 5,  "lat": 39.795, "long": -89.640 }
  ]
}
```

---

### Media Endpoints

#### POST /api/v1/tickets/{id}/media
Upload files to a ticket.

**Auth:** staff/public per category posting permission.

**Content-Type:** `multipart/form-data`.

**Response 201:** Array of media objects.
```json
[
  {
    "id": 301,
    "ticket_id": 1001,
    "filename": "pothole.jpg",
    "internalFilename": "3f7c9b12-uuid.jpg",
    "mime_type": "image/jpeg",
    "uploaded": "2026-06-24T10:05:00Z",
    "url": "/api/v1/media/3f7c9b12-uuid.jpg",
    "thumbnailUrl": "/api/v1/media/3f7c9b12-uuid.jpg/thumbnail"
  }
]
```

---

#### GET /api/v1/tickets/{id}/media
List media for a ticket.

**Auth:** per category display permission.

**Response 200:** Array of media objects.

---

#### DELETE /api/v1/tickets/{id}/media/{mediaId}
Delete media item and file from disk.

**Auth:** staff.

**Response 204.**

---

#### GET /api/v1/media/{internalFilename}
Serve original file.

**Auth:** per category display permission.

**Response:** Binary file stream with appropriate Content-Type.

**Errors:** 404, 403.

---

#### GET /api/v1/media/{internalFilename}/thumbnail
Serve thumbnail (generated on first request).

**Auth:** per category display permission.

**Response:** Binary JPEG stream `Content-Type: image/jpeg`.

**Errors:** 404, 415 (non-image file).

---

### Bookmark Endpoints

#### GET /api/v1/bookmarks
List current user's bookmarks.

**Auth:** staff.

**Response 200:**
```json
[
  { "id": 1, "type": "search", "name": "Open Potholes", "requestUri": "/api/v1/tickets?status=open&category_id=5", "createdAt": "2026-06-01T09:00:00Z" }
]
```

---

#### POST /api/v1/bookmarks
Create bookmark.

**Auth:** staff.

**Request:** `{ "name": "Open Potholes", "requestUri": "/api/v1/tickets?status=open&category_id=5" }`

**Response 201:** Bookmark object.

**Errors:** 422 MISSING_REQUIRED_FIELD, 422 INVALID_URI.

---

#### DELETE /api/v1/bookmarks/{id}
Delete bookmark.

**Auth:** staff.

**Response 204.**

**Errors:** 404, 403 PERMISSION_DENIED.

---

### Open311 GeoReport v2 Endpoints

All Open311 endpoints support `?format=json` (default) and `?format=xml`.

---

#### GET /open311/discovery
Return API discovery metadata.

**Auth:** None.

**Response 200 (JSON):**
```json
{
  "changeset": "2026-06-24T00:00:00Z",
  "contact": "help@city.gov",
  "key_service": "https://city.gov/open311/key",
  "endpoints": [
    {
      "specification": "http://wiki.open311.org/GeoReport_v2",
      "url": "https://city.gov/open311",
      "changeset": "2026-06-24T00:00:00Z",
      "type": "production",
      "formats": ["application/json", "text/xml"]
    }
  ]
}
```

---

#### GET /open311/services
List all active, postable services.

**Auth:** None.

**Response 200:** JSON array or XML document.
```json
[
  {
    "service_code": "5",
    "service_name": "Pothole",
    "description": "Report a pothole",
    "metadata": "true",
    "type": "realtime",
    "keywords": "Pothole",
    "group": "Streets"
  }
]
```

---

#### GET /open311/services/{service_code}
Get single service with attribute schema.

**Auth:** None.

**Response 200:**
```json
{
  "service_code": "5",
  "attributes": [
    {
      "variable": true,
      "code": "severity",
      "datatype": "singlevaluelist",
      "required": false,
      "description": "Severity of the pothole",
      "order": 1,
      "values": [
        { "key": "Low", "name": "Low" },
        { "key": "High", "name": "High" }
      ]
    }
  ]
}
```

---

#### POST /open311/requests
Submit a new service request.

**Auth:** `api_key` parameter (required).

**Request (form-encoded or JSON):**
```
api_key=abc123&service_code=5&lat=39.78&long=-89.65&description=Big+pothole&first_name=John&last_name=Doe&email=john@email.com
```

**Response 200:**
```json
[
  {
    "service_request_id": "1001",
    "service_notice": "",
    "account_id": ""
  }
]
```

---

#### GET /open311/requests
List/filter service requests.

**Auth:** None.

**Query params:** `service_request_id`, `service_code`, `status` (open/closed), `start_date`, `end_date`, `lat`, `long`, `radius`, `keyword`, `page`, `per_page` (max 200).

**Response 200:** JSON array or XML document of request objects.
```json
[
  {
    "service_request_id": "1001",
    "status": "open",
    "status_notes": "Open",
    "service_name": "Pothole",
    "service_code": "5",
    "description": "Large pothole",
    "agency_responsible": "Bob Jones",
    "requested_datetime": "2026-06-24T10:00:00Z",
    "updated_datetime": "2026-06-24T10:00:00Z",
    "expected_datetime": "2026-07-01T10:00:00Z",
    "lat": "39.7817",
    "long": "-89.6501",
    "address": "123 Main St",
    "address_id": "201",
    "zipcode": "62701",
    "media_url": "https://city.gov/api/v1/media/3f7c9b12.jpg"
  }
]
```

---

#### GET /open311/requests/{service_request_id}
Get single service request by ID.

**Auth:** None.

**Response 200:** JSON array (single element) or XML document (single element).

**Errors:** 404 REQUEST_NOT_FOUND.

---

### Open311 XML Response Shape

For all Open311 endpoints with `?format=xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<service_requests>
  <request>
    <service_request_id>1001</service_request_id>
    <status>open</status>
    <status_notes>Open</status_notes>
    <service_name>Pothole</service_name>
    <service_code>5</service_code>
    <description>Large pothole</description>
    <agency_responsible>Bob Jones</agency_responsible>
    <requested_datetime>2026-06-24T10:00:00Z</requested_datetime>
    <updated_datetime>2026-06-24T10:00:00Z</updated_datetime>
    <expected_datetime>2026-07-01T10:00:00Z</expected_datetime>
    <lat>39.7817</lat>
    <long>-89.6501</long>
    <address>123 Main St</address>
    <address_id>201</address_id>
    <zipcode>62701</zipcode>
    <media_url>https://city.gov/api/v1/media/3f7c9b12.jpg</media_url>
  </request>
</service_requests>
```

No XML attributes. All values as text content of elements. Root element matches collection name.
---

## Y1c: REST API — Admin (Categories, Actions, Substatus, Contact Methods, Issue Types, Metrics, Response Templates)

---

### Category Endpoints

#### GET /api/v1/categories
List categories. Public/anonymous users only see categories they have display permission for.

**Auth:** anonymous/public/staff.

**Query params:** `department_id`, `group_id`, `active` (true/false), `featured` (true/false), `page`, `limit`.

**Response 200:**
```json
{
  "total": 45,
  "categories": [
    {
      "id": 5,
      "name": "Pothole",
      "description": "Report a pothole in a street or sidewalk",
      "department_id": 1,
      "departmentName": "Streets",
      "categoryGroup_id": 2,
      "categoryGroupName": "Streets & Infrastructure",
      "active": true,
      "featured": true,
      "displayPermissionLevel": "anonymous",
      "postingPermissionLevel": "anonymous",
      "slaDays": 7,
      "lastModified": "2026-06-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/v1/categories
Create category.

**Auth:** staff.

**Request:**
```json
{
  "name": "Graffiti",
  "description": "Report graffiti on public property",
  "department_id": 2,
  "defaultPerson_id": null,
  "categoryGroup_id": 3,
  "active": true,
  "featured": false,
  "displayPermissionLevel": "anonymous",
  "postingPermissionLevel": "anonymous",
  "customFields": [
    { "key": "surface", "label": "Surface Type", "type": "singlevaluelist", "required": false, "order": 1, "options": ["Wall","Sign","Bench"] }
  ],
  "slaDays": 5,
  "notificationReplyEmail": "graffiti@city.gov",
  "autoCloseIsActive": false,
  "autoCloseSubstatus_id": null
}
```

**Response 201:** Full category object.

**Errors:** 422 INVALID_PERMISSION_LEVEL, 422 INVALID_SUBSTATUS, 422 INVALID_CUSTOM_FIELDS.

---

#### GET /api/v1/categories/{id}
Get category detail including customFields schema.

**Auth:** per displayPermissionLevel.

**Response 200:** Full category object with customFields array.

---

#### PUT /api/v1/categories/{id}
Replace category (full update).

**Auth:** staff.

**Response 200:** Updated category object.

---

#### DELETE /api/v1/categories/{id}
Delete category. Blocked if tickets exist.

**Auth:** staff.

**Response 204.**

**Errors:** 409 CATEGORY_IN_USE.

---

#### GET /api/v1/categories/{id}/action-responses
List all category_action_responses for a category.

**Auth:** staff.

**Response 200:** Array of `{ id, category_id, action_id, actionName, template, replyEmail }`.

---

#### POST /api/v1/categories/{id}/action-responses
Upsert a category action response.

**Auth:** staff.

**Request:** `{ "action_id": 6, "template": "Dear resident, we have responded to your report.", "replyEmail": "noreply@city.gov" }`

**Response 201:** Created/updated response object.

---

#### DELETE /api/v1/categories/{id}/action-responses/{responseId}
Delete category action response.

**Auth:** staff.

**Response 204.**

---

### Category Group Endpoints

#### GET /api/v1/category-groups
List all category groups ordered by `ordering`.

**Auth:** staff.

**Response 200:** Array of `{ id, name, ordering, categoryCount }`.

---

#### POST /api/v1/category-groups
Create group.

**Auth:** staff.

**Request:** `{ "name": "Streets & Infrastructure", "ordering": 1 }`

**Response 201:** Group object.

---

#### GET /api/v1/category-groups/{id}
Get group with its categories.

**Auth:** staff.

**Response 200:** `{ id, name, ordering, categories: [...] }`.

---

#### PUT /api/v1/category-groups/{id}
Update group.

**Auth:** staff.

**Response 200:** Updated group.

---

#### DELETE /api/v1/category-groups/{id}
Delete group. Sets `categories.categoryGroup_id = null` for member categories.

**Auth:** staff.

**Response 204.**

---

#### PUT /api/v1/category-groups/order
Reorder all groups.

**Auth:** staff.

**Request:** `[{ "id": 1, "ordering": 2 }, { "id": 2, "ordering": 1 }]`

**Response 200:** Updated groups array.

---

### Substatus Endpoints

#### GET /api/v1/substatus
List all substatuses.

**Auth:** staff.

**Response 200:** Array of `{ id, name, description, status, isDefault, isSystem }`.

---

#### POST /api/v1/substatus
Create substatus.

**Auth:** staff.

**Request:** `{ "name": "Pending Contractor", "description": "Waiting for contractor", "status": "open", "isDefault": false }`

**Response 201:** Substatus object.

**Errors:** 422 INVALID_STATUS.

---

#### PATCH /api/v1/substatus/{id}
Update substatus.

**Auth:** staff.

**Response 200:** Updated substatus.

**Errors:** 403 SYSTEM_SUBSTATUS.

---

#### DELETE /api/v1/substatus/{id}
Delete substatus.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_SUBSTATUS, 409 SUBSTATUS_IN_USE.

---

### Action Endpoints

#### GET /api/v1/actions
List all actions (system + department).

**Auth:** staff.

**Response 200:** Array of `{ id, name, description, type, template, replyEmail }`.

---

#### POST /api/v1/actions
Create department action.

**Auth:** staff.

**Request:** `{ "name": "Escalated", "description": "Issue escalated to supervisor", "type": "department", "template": "Escalated by {enteredByPerson}" }`

**Response 201:** Action object.

**Errors:** 403 SYSTEM_ACTION.

---

#### PATCH /api/v1/actions/{id}
Update department action.

**Auth:** staff.

**Response 200:** Updated action.

**Errors:** 403 SYSTEM_ACTION.

---

#### DELETE /api/v1/actions/{id}
Delete department action.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_ACTION, 409 ACTION_IN_USE.

---

### Contact Method Endpoints

#### GET /api/v1/contact-methods
List all contact methods.

**Auth:** None.

**Response 200:** `[{ "id": 1, "name": "Email", "isSystem": true }, ...]`

---

#### POST /api/v1/contact-methods
Create contact method.

**Auth:** staff.

**Request:** `{ "name": "In-Person" }`

**Response 201:** Contact method object.

---

#### DELETE /api/v1/contact-methods/{id}
Delete contact method.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_CONTACT_METHOD, 409 CONTACT_METHOD_IN_USE.

---

### Issue Type Endpoints

#### GET /api/v1/issue-types
List all issue types.

**Auth:** None.

**Response 200:** `[{ "id": 1, "name": "Comment", "isSystem": true }, ...]`

---

#### POST /api/v1/issue-types
Create issue type.

**Auth:** staff.

**Request:** `{ "name": "Suggestion" }`

**Response 201:** Issue type object.

---

#### DELETE /api/v1/issue-types/{id}
Delete issue type.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_ISSUE_TYPE, 409 ISSUE_TYPE_IN_USE.

---

### Response Template Endpoints

#### GET /api/v1/response-templates
List response templates. Filter by action_id.

**Auth:** staff.

**Query params:** `action_id` (optional).

**Response 200:** Array of `{ id, name, template, action_id, actionName }`.

---

#### POST /api/v1/response-templates
Create response template.

**Auth:** staff.

**Request:** `{ "name": "48-Hour Inspection", "template": "We will inspect this within 48 hours.", "action_id": 6 }`

**Response 201:** Template object.

---

#### GET /api/v1/response-templates/{id}
Get template detail.

**Auth:** staff.

**Response 200:** Template object.

---

#### PUT /api/v1/response-templates/{id}
Update template.

**Auth:** staff.

**Response 200:** Updated template.

---

#### DELETE /api/v1/response-templates/{id}
Delete template.

**Auth:** staff.

**Response 204.**

---

### Metrics Endpoints

#### GET /api/v1/metrics
Calculate onTimePercentage for a category.

**Auth:** staff.

**Query params:** `category_id` (required), `numDays` (default 30), `effectiveDate` (ISO date, default today).

**Response 200:**
```json
{
  "category_id": 5,
  "categoryName": "Pothole",
  "numDays": 30,
  "effectiveDate": "2026-06-24",
  "onTimePercentage": 73.5,
  "closedCount": 40,
  "onTimeCount": 29
}
```

---

### Reports Endpoints

#### GET /api/v1/reports/{reportType}
Run a canned report.

**Auth:** staff.

**Query params:** `startDate`, `endDate`, `category_id`, `department_id`, `person_id` (required for 'person'), `granularity` (daily/weekly/monthly for volume).

**Response 200:**
```json
{
  "reportType": "assignments",
  "generatedAt": "2026-06-24T12:00:00Z",
  "data": [
    { "person_id": 12, "name": "Bob Jones", "openCount": 5, "closedCount": 20, "totalCount": 25 }
  ]
}
```

**Errors:** 404 REPORT_NOT_FOUND, 422 MISSING_REQUIRED_FIELD, 422 INVALID_DATE_RANGE.

---

### Admin Job Trigger Endpoints

#### POST /api/v1/admin/jobs/digest-notifications/run
Manually trigger digest notification job.

**Auth:** staff.

**Response 200:** `{ "message": "Digest notification job triggered", "startedAt": "..." }`

---

#### POST /api/v1/admin/jobs/auto-close/run
Manually trigger auto-close job.

**Auth:** staff.

**Response 200:** `{ "message": "Auto-close job triggered", "startedAt": "..." }`

---

#### POST /api/v1/admin/jobs/audit/run
Manually trigger audit job.

**Auth:** staff.

**Response 200:** `{ "message": "Audit job triggered", "startedAt": "..." }`
---

## Y2: Cross-Feature Error Catalog

This catalog lists all error codes used across uReport REST API endpoints with their HTTP status codes, human-readable messages, and retry guidance.

---

### Standard Error Response Shape

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description of the error",
  "field": "fieldName"
}
```

- `field` is optional; included for field-level validation errors (422).
- Multiple field errors may be returned as an array under `"errors": [...]`.

---

### Authentication & Authorization Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 401 | AUTH_FAILED | "Invalid username or password" | F04 | No |
| 401 | TOKEN_EXPIRED | "Access token has expired" | F04 | Yes — refresh token |
| 401 | TOKEN_INVALID | "Invalid or malformed token" | F04 | No |
| 401 | TOKEN_REVOKED | "Token has been revoked" | F04 | No — re-login |
| 401 | REFRESH_TOKEN_INVALID | "Refresh token is invalid or expired" | F04 | No — re-login |
| 401 | UNAUTHORIZED | "Authentication required" | F03 | Yes — authenticate |
| 403 | PERMISSION_DENIED | "Insufficient permissions" | F03 | No |
| 403 | API_KEY_INVALID | "Invalid or missing api_key" | F02, F13 | No |
| 403 | API_KEY_REQUIRED | "API key is required" | F02, F13 | Yes — add key |
| 400 | OAUTH_STATE_INVALID | "Invalid OAuth state parameter" | F04 | No |
| 404 | PERSON_NOT_FOUND | "No account found for this identity" | F04 | No |

---

### Ticket Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | TICKET_NOT_FOUND | "Ticket not found" | F00 | No |
| 422 | DESCRIPTION_REQUIRED | "Description is required" | F00 | Yes — fix input |
| 422 | INVALID_SUBSTATUS | "Substatus must be a closed-type substatus" | F00, F08 | Yes — fix input |
| 422 | INVALID_TRANSITION | "Invalid status transition" | F00 | Yes — check status |
| 422 | CIRCULAR_DUPLICATE | "Ticket cannot be its own ancestor" | F00 | Yes — fix parent_id |
| 422 | INVALID_ASSIGNEE | "Assigned person must have staff role" | F00 | Yes — fix person |
| 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" | F00, F15 | Yes — fix coords |
| 403 | PERMISSION_DENIED | "Insufficient permission to post to this category" | F00, F03 | No |

---

### Category Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | CATEGORY_NOT_FOUND | "Category not found or inactive" | F00, F07 | No |
| 422 | INVALID_PERMISSION_LEVEL | "Permission level must be anonymous, public, or staff" | F07 | Yes |
| 422 | INVALID_CUSTOM_FIELDS | "customFields must be a valid JSON array" | F07 | Yes |
| 422 | INVALID_DEFAULT_PERSON | "Default person must have staff role" | F06, F07 | Yes |
| 409 | CATEGORY_IN_USE | "Category has associated tickets; deactivate instead" | F07 | No |
| 404 | GROUP_NOT_FOUND | "Category group not found" | F07 | No |

---

### People Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | PERSON_NOT_FOUND | "Person not found" | F05 | No |
| 409 | USERNAME_CONFLICT | "Username already in use" | F05 | Yes — choose new username |
| 422 | INVALID_EMAIL | "Invalid email address format" | F05 | Yes |
| 422 | INVALID_ROLE | "Role must be staff, public, or anonymous" | F05 | Yes |
| 422 | MISSING_REQUIRED_FIELD | "First name and last name are required" | F05 | Yes |
| 409 | PERSON_IN_USE | "Person is referenced by existing tickets" | F05 | No |

---

### Department Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | DEPT_NOT_FOUND | "Department not found" | F06 | No |
| 409 | DEPT_NAME_CONFLICT | "Department name already exists" | F06 | Yes — choose new name |
| 409 | DEPT_IN_USE | "Department has assigned categories" | F06 | No |
| 422 | ACTION_NOT_FOUND | "One or more action IDs not found" | F06, F09 | Yes |

---

### Substatus Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | SUBSTATUS_NOT_FOUND | "Substatus not found" | F08 | No |
| 422 | INVALID_STATUS | "Status must be 'open' or 'closed'" | F08 | Yes |
| 403 | SYSTEM_SUBSTATUS | "System substatuses cannot be deleted or modified" | F08 | No |
| 409 | SUBSTATUS_IN_USE | "Substatus is referenced by tickets or category rules" | F08 | No |

---

### Action Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | ACTION_NOT_FOUND | "Action not found" | F09 | No |
| 403 | SYSTEM_ACTION | "System actions cannot be modified or deleted" | F09 | No |
| 409 | ACTION_IN_USE | "Action is referenced by ticket history" | F09 | No |
| 422 | INVALID_EMAIL | "Reply email address is invalid" | F09 | Yes |

---

### Media Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | MEDIA_NOT_FOUND | "Media not found" | F10 | No |
| 404 | FILE_NOT_FOUND | "File data not found on server" | F10 | No |
| 413 | FILE_TOO_LARGE | "File exceeds maximum allowed size" | F10 | Yes — reduce file size |
| 415 | UNSUPPORTED_MEDIA | "File type not allowed" | F10 | Yes — change format |
| 422 | NO_FILE | "No files provided" | F10 | Yes |
| 422 | TOO_MANY_FILES | "Maximum 10 files per upload" | F10 | Yes — split upload |

---

### Search / Export Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 422 | INVALID_DATE | "Date must be ISO 8601 format" | F11, F17 | Yes |
| 422 | INVALID_DATE_RANGE | "startDate must be before endDate" | F17 | Yes |
| 422 | LIMIT_EXCEEDED | "Page size exceeds maximum allowed" | F11 | Yes |
| 422 | INVALID_SORT_FIELD | "Invalid sort field" | F11 | Yes |
| 422 | INVALID_ZOOM_LEVEL | "Zoom level must be 0–6" | F15 | Yes |

---

### API Client Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | CLIENT_NOT_FOUND | "Client not found" | F13 | No |
| 409 | API_KEY_CONFLICT | "API key already in use" | F13 | Yes — regenerate |
| 409 | CLIENT_IN_USE | "Client is referenced by existing tickets" | F13 | No |

---

### Contact Method / Issue Type Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | CONTACT_METHOD_NOT_FOUND | "Contact method not found" | F14 | No |
| 403 | SYSTEM_CONTACT_METHOD | "System contact methods cannot be deleted" | F14 | No |
| 409 | CONTACT_METHOD_IN_USE | "Contact method referenced by existing tickets" | F14 | No |
| 409 | CONTACT_METHOD_CONFLICT | "Contact method name already exists" | F14 | Yes |
| 404 | ISSUE_TYPE_NOT_FOUND | "Issue type not found" | F19 | No |
| 403 | SYSTEM_ISSUE_TYPE | "System issue types cannot be deleted" | F19 | No |
| 409 | ISSUE_TYPE_IN_USE | "Issue type referenced by existing tickets" | F19 | No |

---

### Open311 Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | SERVICE_NOT_FOUND | "Service not found" | F02 | No |
| 403 | PERMISSION_DENIED | "Service does not allow public posting" | F02 | No |
| 404 | REQUEST_NOT_FOUND | "Service request not found" | F02 | No |
| 400 | INVALID_FORMAT | "Format must be json or xml" | F02, F18 | Yes |
| 400 | UNSUPPORTED_FORMAT | "Format not supported for this endpoint" | F18 | Yes |

---

### Metrics / Reports Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | REPORT_NOT_FOUND | "Unknown report type" | F17 | No |
| 422 | INVALID_PARAM | "numDays must be between 1 and 365" | F17 | Yes |

---

### Bookmark Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | BOOKMARK_NOT_FOUND | "Bookmark not found" | F12 | No |
| 403 | PERMISSION_DENIED | "Cannot delete another user's bookmark" | F12 | No |
| 422 | INVALID_URI | "Request URI must be a relative path" | F12 | Yes |

---

### Response Template Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | TEMPLATE_NOT_FOUND | "Response template not found" | F20 | No |

---

### HTTP 405 Method Not Allowed

Returned for any attempt to call an HTTP method not supported on an endpoint (e.g., PUT on a list endpoint, or any write on `ticketHistory`).

| HTTP | Error Code | Message |
|------|-----------|---------|
| 405 | METHOD_NOT_ALLOWED | "HTTP method not allowed on this endpoint" |
---

## Y3: Integration Points

This section documents all external system dependencies, integration contracts, and the interfaces between uReport and third-party services.

---

### 1. Open311 GeoReport v2 — External Consumer Contract

**Direction:** Inbound (external systems call uReport)  
**Protocol:** HTTPS REST  
**Standard:** http://wiki.open311.org/GeoReport_v2  

**Contract requirements:**
- Response field names, types, and structures must be byte-compatible with legacy PHP output.
- JSON and XML response shapes are both required.
- Authentication via `api_key` query parameter or form field for POST.
- No breaking changes to response payloads — external municipality integrations cannot be modified.
- Endpoint paths must match exactly: `/open311/discovery`, `/open311/services`, `/open311/services/{code}`, `/open311/requests`, `/open311/requests/{id}`.

**Validation approach:**
- Generate XML/JSON fixture files from legacy PHP system before migration.
- Run automated byte-level comparison tests against fixtures after migration (NFR-1, NFR-9).
- Integration tests for all 6 Open311 endpoints in CI pipeline.

---

### 2. SMTP / Email Service

**Direction:** Outbound (uReport sends email)  
**Protocol:** SMTP (or SMTP over TLS)  
**Used by:** F16 (Digest Notifications)  

**Configuration properties:**
```yaml
app:
  mail:
    host: smtp.example.com
    port: 587
    username: notifications@city.gov
    password: <secret>
    from: "uReport Notifications <notifications@city.gov>"
    footer: "This is an automated message from uReport."
    starttls: true
```

**Contract:**
- Spring Boot `JavaMailSender` or compatible SMTP client.
- Each notification email targets all `peopleEmails` records flagged `usedForNotifications = true` for the ticket reporter.
- Reply-To is set from the effective `replyEmail` (category or action override, see F09).
- Failed sends are logged; `sentNotifications` field is set to sent addresses (or null on total failure).
- No retry queue in MVP — failures are logged and addressed at next scheduler run.

---

### 3. AddressService (Optional External Address Validation)

**Direction:** Outbound (uReport calls AddressService)  
**Protocol:** HTTPS REST  
**Used by:** F15 (Location / Address Management)  
**Status:** Optional — system functions without it; raw address stored if unavailable.

**Integration contract:**
- System calls configured `app.address.serviceUrl` with address components.
- Expects a JSON response with canonical address fields and optionally `additionalFields` data.
- If service unavailable (timeout, 5xx), system logs warning and continues ticket creation with unvalidated address.
- `tickets.additionalFields` JSONB stores the raw AddressService response for downstream use.
- No specific AddressService vendor is mandated — interface is configurable.

**Configuration:**
```yaml
app:
  address:
    serviceUrl: https://address.example.gov/validate
    enabled: true
    timeoutMs: 3000
```

---

### 4. OAuth / External Identity Provider (Optional)

**Direction:** Inbound (IdP redirects to uReport callback)  
**Protocol:** OAuth 2.0 Authorization Code Flow  
**Used by:** F04 (Authentication — JWT)  
**Status:** Optional — local username/password is always available.

**Integration contract:**
- `GET /callback?code=<auth_code>&state=<csrf_state>` endpoint receives IdP redirect.
- System exchanges auth code for IdP token using configured client credentials.
- System extracts identity claim (email or `sub`) from IdP token.
- System looks up matching `people` record by email; no auto-registration.
- If no match → 404 (administrator must pre-create the person record).
- Issues local JWT and refresh token for the matched person.

**Configuration:**
```yaml
app:
  oauth:
    enabled: false
    clientId: <idp-client-id>
    clientSecret: <idp-client-secret>
    authorizationUri: https://idp.example.com/oauth2/authorize
    tokenUri: https://idp.example.com/oauth2/token
    redirectUri: https://city.gov/callback
    userInfoUri: https://idp.example.com/oauth2/userinfo
    scope: openid email profile
```

---

### 5. PostGIS (PostgreSQL Extension)

**Direction:** Internal (uReport database layer)  
**Used by:** F15 (Geo-Cluster Analysis), F11 (Radius Search)  

**Integration contract:**
- PostgreSQL must be configured with `CREATE EXTENSION IF NOT EXISTS postgis;`.
- `GEOGRAPHY(POINT, 4326)` type is used for ticket and location geo-points.
- `ST_DWithin` is used for radius-based ticket search.
- `ST_MakePoint(longitude, latitude)::geography` converts decimal lat/long to geography.
- `ST_Centroid` and `ST_DWithin` are used in the geo-cluster rebuild job.
- Docker image: `postgis/postgis:16-3.4` (or equivalent PostGIS + PostgreSQL 16 image).

---

### 6. React SPA ↔ Spring Boot API

**Direction:** Internal (SPA consumes REST API)  
**Protocol:** HTTPS REST  
**Used by:** All features  

**Contract:**
- SPA communicates exclusively via `/api/v1/*` endpoints.
- SPA stores JWT access token in memory (not localStorage) for security; refresh token in HttpOnly cookie.
- SPA handles 401 TOKEN_EXPIRED by calling `/api/v1/auth/refresh` before retrying.
- SPA performs client-side permission gating (hides UI elements) based on role from JWT, but API is the authoritative security boundary.
- Open311 endpoints are not consumed by the SPA directly — they are for external consumers only.

---

### 7. Docker / docker-compose

**Direction:** Deployment  
**Used by:** All features  

**Service definitions:**
```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: ureport
      POSTGRES_USER: ureport
      POSTGRES_PASSWORD: <secret>

  api:
    build: ./api
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/ureport
      APP_JWT_SECRET: <secret>
      APP_MAIL_HOST: mailhog
    volumes: ["mediadata:/app/media"]
    depends_on: [db]

  web:
    build: ./web
    ports: ["3000:80"]
    depends_on: [api]

  mailhog:
    image: mailhog/mailhog
    ports: ["8025:8025", "1025:1025"]
```

**Volumes:**
- `pgdata`: PostgreSQL data directory.
- `mediadata`: Media file storage (`/app/media`), mounted to same path inside container.

**Constraints:**
- Service names (`db`, `api`, `web`) should remain familiar to existing operators.
- Port assignments must match or be documented if changed (legacy: Apache on 80, MySQL on 3306).
- Media volume path `/app/media` must be consistent with `$MEDIA_STORAGE_PATH` config.

---

### 8. Scheduled Jobs (Spring Scheduler)

**Direction:** Internal (replaces PHP cron scripts)  
**Used by:** F16 (Notifications, Auto-Close, Audit), F15 (Geo-Cluster Rebuild)  

| Job | Replaces | Default Schedule | Cron Expression |
|-----|---------|-----------------|----------------|
| DigestNotificationScheduler | digestNotifications.php | Every 5 min | `0 */5 * * * *` |
| AutoCloseScheduler | closeOldTickets.php | Nightly 1 AM | `0 0 1 * * *` |
| AuditScheduler | auditTickets.php | Weekly Sun 3 AM | `0 0 3 * * SUN` |
| GeoClusterScheduler | matchLocationAddresses.php | Nightly 2 AM | `0 0 2 * * *` |
| TokenBlacklistCleanupScheduler | (new) | Hourly | `0 0 * * * *` |

All schedules are configurable via `application.yml`. Jobs log start time, end time, and outcome counters.
