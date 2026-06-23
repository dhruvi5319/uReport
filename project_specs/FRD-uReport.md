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
---

## F00: Ticket Lifecycle Management

**Description:** The core operational capability of uReport. Staff and (where category permissions allow) citizens create service request tickets, which flow through a defined lifecycle: open → assigned → closed, with optional reopen, merge, and deletion paths. Every state transition is recorded in the immutable audit trail (see F06). All other features orbit the ticket entity.

**Terminology:**
- **Primary Status:** The ticket's top-level state: `open` or `closed`.
- **Substatus:** A finer-grained label applied within the primary status (see F17).
- **Reporter:** The person (citizen or staff) who submitted the ticket. References `people.id`.
- **Assignee:** The staff member responsible for resolving the ticket. References `people.id`.
- **Resolution Response:** The final staff message sent to the reporter when closing a ticket.
- **Reopen Reason:** A required text field explaining why a closed ticket is being reopened.

**Sub-features:**
- Create ticket (staff or public, depending on category permissions)
- View ticket detail (full fields, history, attachments)
- Edit ticket fields (category, description, location, custom fields)
- Assign ticket to department and/or staff member
- Change ticket status (open ↔ closed)
- Apply/change substatus
- Post response (external — sent to reporter via email)
- Post comment (internal — not sent externally)
- Close ticket with resolution response
- Reopen closed ticket with reason
- Delete ticket (staff with `admin` or `staff` role, subject to permissions)
- Merge duplicate tickets (see F18)

---

### F00 Process: Create Ticket

1. Caller (staff, public user, or anonymous via API) submits ticket payload.
2. System validates all required fields and category posting permissions (see F10).
3. System resolves category → department mapping; sets `tickets.departmentId`.
4. System sets `tickets.status = 'open'`, `tickets.datetimeOpened = NOW()`.
5. System applies the default substatus for `open` state if one is configured (see F17).
6. System geocodes or stores the provided lat/long (see F05).
7. System creates an `actions` entry with `type = 'open'`, actor = caller.
8. System indexes the ticket in Solr.
9. System sends confirmation email to reporter (see F08).
10. System returns the created ticket object with HTTP 201.

### F00 Process: Assign Ticket

1. Staff submits assignment request with `assigneeId` and/or `departmentId`.
2. System validates the assignee is an active staff member.
3. System updates `tickets.personId` (assignee) and/or `tickets.departmentId`.
4. System creates an `actions` entry with `type = 'assignment'`.
5. System sends email notification to the new assignee (see F08).
6. System returns updated ticket with HTTP 200.

### F00 Process: Close Ticket

1. Staff submits close request with optional `response` text.
2. System validates caller has `staff` or `admin` role.
3. System sets `tickets.status = 'closed'`, `tickets.datetimeClosed = NOW()`.
4. System applies default closed substatus if configured.
5. System creates an `actions` entry with `type = 'closed'`; if response text provided, also creates `type = 'response'` action.
6. System sends email to reporter with response text (see F08).
7. System updates Solr index.
8. System returns updated ticket with HTTP 200.

### F00 Process: Reopen Ticket

1. Staff submits reopen request with required `reason` text.
2. System validates `tickets.status = 'closed'`.
3. System sets `tickets.status = 'open'`, clears `tickets.datetimeClosed`.
4. System applies default open substatus if configured.
5. System creates an `actions` entry with `type = 'open'`, payload includes `reason`.
6. System updates Solr index.
7. System returns updated ticket with HTTP 200.

### F00 Process: Delete Ticket

1. Staff with `admin` role submits delete request.
2. System soft-deletes by setting `tickets.deletedAt = NOW()` (or hard-deletes per config).
3. System creates `actions` entry with `type = 'deleted'`.
4. System removes ticket from Solr index.
5. System returns HTTP 204.

---

### F00 Inputs

**Create Ticket:**
- `title` (string, required, max 255): Short description of the issue
- `description` (string, optional, max 5000): Detailed description
- `categoryId` (integer, required): Must reference an active category
- `lat` (decimal, optional): Latitude — required if no `address` provided
- `lng` (decimal, optional): Longitude — required if no `address` provided
- `address` (string, optional, max 500): Human-readable address string
- `reporterName` (string, optional, max 255): Reporter's name (anonymous allowed per category)
- `reporterEmail` (string, optional, max 255): Reporter's email for notifications
- `reporterPhone` (string, optional, max 50): Reporter's phone
- `customFields` (object, optional): Key-value map of category-specific custom field values
- `mediaUrls` (array of strings, optional): URLs of pre-uploaded media (Open311 `media_url`)

**Assign Ticket:**
- `assigneeId` (integer, optional): Person ID of staff assignee (null to unassign)
- `departmentId` (integer, optional): Department ID override

**Close Ticket:**
- `response` (string, optional, max 5000): Resolution message sent to reporter

**Reopen Ticket:**
- `reason` (string, required, max 1000): Explanation for reopening

**Update Ticket Fields:**
- `title` (string, optional)
- `description` (string, optional)
- `categoryId` (integer, optional)
- `address` (string, optional)
- `lat` (decimal, optional)
- `lng` (decimal, optional)
- `customFields` (object, optional)

---

### F00 Outputs

- **Ticket object** (on create, read, update): Full ticket record including resolved department, category, assignee, substatus, and SLA data
- **HTTP 201** on successful create
- **HTTP 200** on successful update/assign/close/reopen
- **HTTP 204** on successful delete
- **Action log entry** created for every mutation (see F06)
- **Solr index** updated on every mutation

---

### F00 Validation

- `categoryId` must reference an existing, active category
- Category posting permissions must allow the caller's role (see F10)
- Either `lat`/`lng` pair OR `address` must be provided (both recommended)
- `lat` must be in range −90 to +90; `lng` in range −180 to +180
- `reporterEmail` must be valid RFC 5322 email format if provided
- `assigneeId` must reference an active person with role `staff` or `admin`
- `departmentId` must reference an active department
- `reason` (reopen) must be non-empty string, max 1000 chars
- Callers with role `anonymous` may only create; they may not edit, assign, close, delete, or reopen
- Delete requires `admin` role; soft-delete is the default behavior

---

### F00 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Invalid `categoryId` | 422 | INVALID_CATEGORY | "Category not found or inactive" |
| Category does not permit caller's role | 403 | POSTING_FORBIDDEN | "This category does not allow posting by your role" |
| Location missing (no lat/lng and no address) | 422 | LOCATION_REQUIRED | "Either coordinates or an address must be provided" |
| Invalid lat/lng range | 422 | INVALID_COORDINATES | "Latitude must be −90 to +90; longitude −180 to +180" |
| Assignee not found or inactive | 422 | INVALID_ASSIGNEE | "Assignee not found or not an active staff member" |
| Reopen with missing reason | 422 | REASON_REQUIRED | "A reason is required to reopen a ticket" |
| Delete without admin role | 403 | FORBIDDEN | "Ticket deletion requires admin role" |
| Ticket not found | 404 | NOT_FOUND | "Ticket not found" |
| Close already-closed ticket | 409 | ALREADY_CLOSED | "Ticket is already closed" |
| Reopen already-open ticket | 409 | ALREADY_OPEN | "Ticket is already open" |

---

### F00 API Surface (this feature)

Full request/response schemas: see `Y1a-api-tickets.md` §Tickets.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tickets` | Any (role-checked) | Create ticket |
| GET | `/api/tickets/{id}` | Any (visibility-checked) | Get ticket detail |
| PUT | `/api/tickets/{id}` | staff/admin | Update ticket fields |
| POST | `/api/tickets/{id}/assign` | staff/admin | Assign ticket |
| POST | `/api/tickets/{id}/close` | staff/admin | Close ticket |
| POST | `/api/tickets/{id}/reopen` | staff/admin | Reopen ticket |
| DELETE | `/api/tickets/{id}` | admin | Delete ticket |
| POST | `/api/tickets/{id}/responses` | staff/admin | Post response (external) |
| POST | `/api/tickets/{id}/comments` | staff/admin | Post comment (internal) |

---

### F00 Schema Surface (this feature)

Primary table: `tickets`. Also writes to `actions`, `ticket_geodata`. See `Y0a-schema-core.md` §tickets and §actions.

Key columns on `tickets`:
- `id`, `title`, `description`, `status` (enum open/closed), `datetimeOpened`, `datetimeClosed`
- `categoryId` (FK → categories), `departmentId` (FK → departments)
- `personId` (FK → people, assignee), `reporterPersonId` (FK → people, reporter)
- `substatusId` (FK → substatus), `deletedAt`
- `address`, `lat`, `lng`
---

## F01: Open311 GeoReport v2 API Compliance

**Description:** uReport implements the Open311 GeoReport v2 specification at `/open311/`, enabling any spec-compliant client (mobile app, third-party integration, city portal) to submit and query civic service requests without coupling to uReport's internal UI. This endpoint surface is the highest-priority external contract in the system and must remain 100% spec-compliant — unchanged in path, parameters, and response shape — after the modernization.

**Terminology:**
- **GeoReport v2:** The Open311 REST API specification for civic service requests (open311.org).
- **service_code:** The Open311 identifier for a service type. Maps to `categories.id` (prefixed/formatted as needed).
- **service_request_id:** The Open311 identifier for a submitted request. Maps to `tickets.id`.
- **api_key:** An API key issued to an Open311 client (see F14). Passed as a query/body parameter, not an HTTP header.
- **discovery document:** An Open311 JSON/XML document listing available endpoints and supported formats.
- **jurisdiction_id:** An Open311 parameter scoping requests to a municipality; optional in uReport (single-tenant).

**Sub-features:**
- Service list endpoint (`GET /open311/services`)
- Service definition endpoint (`GET /open311/services/{service_code}`)
- Submit service request (`POST /open311/requests`)
- Query service requests (`GET /open311/requests`)
- Get single service request (`GET /open311/requests/{service_request_id}`)
- Discovery document (`GET /open311/discovery`)
- Multi-format output (JSON and XML)
- API key validation and client identification

---

### F01 Process: Submit Service Request (POST /open311/requests)

1. Client submits `POST /open311/requests` with `api_key`, `service_code`, location, and contact fields.
2. System validates `api_key` — if provided and valid, associates request with the client record; if missing or invalid, logs as anonymous (not rejected for public categories).
3. System maps `service_code` to a `categories.id`; validates the category is active and permits public posting.
4. System creates a ticket record via the same internal create logic as F00 (step 3 onwards).
5. System returns an Open311 service request object with `service_request_id` in the spec-compliant response format.
6. Multi-format: if `?format=xml` (or `Accept: application/xml`), response is wrapped in `<service_requests><request>…</request></service_requests>`.

### F01 Process: Query Service Requests (GET /open311/requests)

1. Client submits GET with optional filters: `service_request_id`, `service_code`, `status`, `start_date`, `end_date`, `lat`, `long`, `radius`, `bbox`.
2. System applies filters to the `tickets` table (with Solr for text/geo queries).
3. System maps internal ticket records to Open311 response schema fields.
4. System returns array of service request objects (JSON or XML per `format` param).
5. Pagination: `page_size` (default 50, max 200) and `page` parameters supported.

### F01 Process: Get Single Service Request (GET /open311/requests/{id})

1. Client requests a specific `service_request_id`.
2. System looks up the ticket; enforces that it is not deleted.
3. System maps ticket to Open311 response schema.
4. Returns single-element array (per GeoReport v2 spec) or 404 if not found.

---

### F01 Inputs

**POST /open311/requests:**
- `api_key` (string, optional): Identifies the API client
- `service_code` (string, required): Maps to a category
- `lat` (decimal, optional): Latitude
- `long` (decimal, optional): Longitude (note: Open311 uses `long`, not `lng`)
- `address_string` (string, optional): Human-readable address
- `address_id` (string, optional): Address identifier from address service
- `email` (string, optional): Reporter email
- `device_id` (string, optional): Device identifier for the submitting app
- `account_id` (string, optional): Open311 account identifier
- `first_name` (string, optional): Reporter first name
- `last_name` (string, optional): Reporter last name
- `phone` (string, optional): Reporter phone
- `description` (string, optional): Issue description
- `media_url` (string, optional): URL of an attached image/file
- Custom attribute fields prefixed with `attribute[{code}]`

**GET /open311/requests filters:**
- `service_request_id` (string, optional): Comma-separated list of IDs
- `service_code` (string, optional): Filter by service type
- `status` (string, optional): `open` or `closed`
- `start_date` (ISO 8601, optional): Submissions on or after this date
- `end_date` (ISO 8601, optional): Submissions on or before this date
- `lat` (decimal, optional): Center latitude for geo search
- `long` (decimal, optional): Center longitude for geo search
- `radius` (integer, optional): Radius in meters for geo search
- `page` (integer, optional, default 1)
- `page_size` (integer, optional, default 50, max 200)
- `format` (string, optional): `json` (default) or `xml`

---

### F01 Outputs

**Service object** (services list):
```json
{
  "service_code": "1",
  "service_name": "Pothole Repair",
  "description": "Report a road pothole",
  "metadata": true,
  "type": "realtime",
  "keywords": ["pothole","road"],
  "group": "Roads"
}
```

**Service request object**:
```json
{
  "service_request_id": "101",
  "status": "open",
  "status_notes": "",
  "service_name": "Pothole Repair",
  "service_code": "1",
  "description": "Large pothole on Main St",
  "agency_responsible": "Roads Dept",
  "service_notice": "",
  "requested_datetime": "2026-06-23T10:00:00Z",
  "updated_datetime": "2026-06-23T10:00:00Z",
  "expected_datetime": "2026-06-30T00:00:00Z",
  "address": "123 Main St",
  "address_id": "",
  "zipcode": "",
  "lat": 43.1234,
  "long": -79.5678,
  "media_url": ""
}
```

---

### F01 Validation

- `service_code` must map to an active, public-posting-allowed category
- At least one of `lat`/`long` pair OR `address_string` must be provided
- `lat` in −90..+90; `long` in −180..+180
- `email` must be valid RFC 5322 format if provided
- `api_key` existence is validated but absence is not an error for public categories
- `start_date` / `end_date` must be ISO 8601 format if provided
- `page_size` capped at 200

---

### F01 Error States

| Scenario | HTTP | Error Code | Open311 Response |
|----------|------|------------|-----------------|
| Invalid `service_code` | 404 | — | `[{"code":404,"description":"service_code not found"}]` |
| Invalid API key (non-empty but invalid) | 400 | — | `[{"code":400,"description":"Invalid api_key"}]` |
| Location not provided | 400 | — | `[{"code":400,"description":"lat/long or address_string required"}]` |
| Service request not found | 404 | — | `[{"code":404,"description":"Service request not found"}]` |
| Category requires authentication | 403 | — | `[{"code":403,"description":"This service requires authentication"}]` |

> **Note:** Open311 error format (`[{"code":…,"description":…}]`) is spec-required and differs from the internal JSON envelope.

---

### F01 API Surface (this feature)

> **Preserved verbatim — not modified by F16.** All paths remain under `/open311/`.

| Method | Path | Auth | Format |
|--------|------|------|--------|
| GET | `/open311/discovery` | None | JSON, XML |
| GET | `/open311/services` | None | JSON, XML |
| GET | `/open311/services/{service_code}` | None | JSON, XML |
| POST | `/open311/requests` | API key (optional) | JSON, XML |
| GET | `/open311/requests` | API key (optional) | JSON, XML |
| GET | `/open311/requests/{service_request_id}` | API key (optional) | JSON, XML |

Full field mappings: see `Y3-integrations.md` §Open311.

---

### F01 Schema Surface (this feature)

Reads from `tickets`, `categories`, `departments`, `ticket_geodata`. Reads `clients` for API key validation. Writes via same path as F00 create. No schema changes needed for Open311 compliance.

**Field mapping (Open311 → internal):**

| Open311 Field | Internal Column |
|--------------|-----------------|
| `service_request_id` | `tickets.id` |
| `service_code` | `tickets.categoryId` |
| `status` | `tickets.status` |
| `description` | `tickets.description` |
| `lat` | `ticket_geodata.lat` |
| `long` | `ticket_geodata.lng` |
| `address` | `tickets.address` |
| `requested_datetime` | `tickets.datetimeOpened` |
| `updated_datetime` | `tickets.datetimeUpdated` |
| `expected_datetime` | computed: `datetimeOpened + category.slaDays business days` |
| `agency_responsible` | `departments.name` |
---

## F02: Department & Category Management

**Description:** Tickets are routed to departments via category assignment. Administrators configure the category taxonomy — including SLA days, display and posting permissions, custom fields, default assignees, and auto-close rules — that governs how tickets flow through the system. Department management defines the organizational units that own ticket queues. Both entities use soft-deactivation to preserve historical data integrity.

**Terminology:**
- **Category Group:** A named grouping of categories for organizational display. Maps to `categoryGroups` table.
- **Custom Field:** A category-specific extra input field (text, select, date, checkbox) configured per category. Stored in a JSON column or `categoryFields` table.
- **SLA Days:** Number of business days from ticket creation to expected closure for a given category (`categories.slaDays`).
- **Display Permission:** Whether ticket list items in this category are visible to the public, staff only, or anonymous.
- **Posting Permission:** Whether new tickets in this category can be submitted by staff only, authenticated public, or anonymous.
- **Default Assignee:** The staff person automatically assigned to new tickets in this category or department.
- **Auto-Close:** A rule to automatically close tickets in a category after N days of inactivity.

**Sub-features:**
- Create, edit, and deactivate departments
- Create, edit, and deactivate categories
- Assign categories to departments
- Group categories under category groups
- Configure per-category SLA days
- Configure per-category display and posting permissions
- Define per-category custom fields
- Configure per-category auto-close rules
- Assign default staff member per category and per department

---

### F02 Process: Create Category

1. Admin submits category payload.
2. System validates `departmentId` references an active department.
3. System validates `groupId` if provided references an active category group.
4. System saves category with `active = true`.
5. System returns created category with HTTP 201.

### F02 Process: Deactivate Department or Category

1. Admin requests deactivation.
2. System checks: if any active tickets are assigned to this department or category, warn the admin (proceed requires confirmation).
3. System sets `active = false`; does not delete.
4. Deactivated categories are hidden from public submission forms and Open311 services list.
5. Existing tickets in the category are unaffected.

### F02 Process: Update Category Custom Fields

1. Admin submits updated `fields` array with field definitions.
2. System validates each field: `name`, `type` (text|select|date|checkbox), `required` flag, `options` array (for select type).
3. System persists field definitions; existing ticket custom field values are preserved (orphaned if field removed).
4. System returns updated category with HTTP 200.

---

### F02 Inputs

**Create/Edit Department:**
- `name` (string, required, max 255): Department name
- `defaultAssigneeId` (integer, optional): Default staff person for new tickets
- `active` (boolean, optional, default true)

**Create/Edit Category:**
- `name` (string, required, max 255): Category name
- `departmentId` (integer, required): Owning department
- `groupId` (integer, optional): Category group
- `slaDays` (integer, optional, min 0): Business days for SLA
- `displayPermission` (enum, required): `public` | `staff` | `anonymous`
- `postingPermission` (enum, required): `staff` | `public` | `anonymous`
- `defaultAssigneeId` (integer, optional): Overrides department default
- `autoCloseDays` (integer, optional, min 0): Days of inactivity before auto-close (0 = disabled)
- `active` (boolean, optional, default true)
- `fields` (array, optional): Custom field definitions

**Custom Field Definition Object:**
- `code` (string, required, max 50): Machine-readable key (URL-safe, unique within category)
- `label` (string, required, max 255): Display label
- `type` (enum, required): `text` | `select` | `date` | `checkbox`
- `required` (boolean, default false)
- `options` (array of strings, required when type = `select`): Allowed values

---

### F02 Outputs

- **Department object**: `{ id, name, defaultAssigneeId, active, createdAt, updatedAt }`
- **Category object**: `{ id, name, departmentId, groupId, slaDays, displayPermission, postingPermission, defaultAssigneeId, autoCloseDays, active, fields[], createdAt, updatedAt }`
- **HTTP 201** on create; **HTTP 200** on update; **HTTP 204** on deactivate (or 200 with updated record)

---

### F02 Validation

- `name` must be unique within departments (case-insensitive)
- `name` must be unique within categories (case-insensitive)
- `departmentId` must reference an active department
- `slaDays` ≥ 0; null means "no SLA" (not displayed/tracked)
- `displayPermission` must be one of: `public`, `staff`, `anonymous`
- `postingPermission` must be one of: `staff`, `public`, `anonymous`
- `displayPermission = 'anonymous'` implies `postingPermission` may also be `anonymous`
- `postingPermission = 'anonymous'` requires `displayPermission` to be `public` or `anonymous`
- Custom field `code` must match `/^[a-z0-9_]+$/` and be unique within the category
- `type = 'select'` requires at least one option in `options`
- `defaultAssigneeId` must reference an active person with role `staff` or `admin`
- `autoCloseDays` = 0 or null means auto-close is disabled

---

### F02 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate department name | 422 | DUPLICATE_NAME | "A department with this name already exists" |
| Duplicate category name | 422 | DUPLICATE_NAME | "A category with this name already exists" |
| Invalid `departmentId` | 422 | INVALID_DEPARTMENT | "Department not found or inactive" |
| Invalid `groupId` | 422 | INVALID_GROUP | "Category group not found" |
| Invalid `defaultAssigneeId` | 422 | INVALID_ASSIGNEE | "Assignee not found or not active staff" |
| Select field with no options | 422 | FIELD_OPTIONS_REQUIRED | "Select-type fields require at least one option" |
| Deactivate department with active tickets | 409 | HAS_ACTIVE_TICKETS | "Department has active tickets; confirm to proceed" |
| Department/category not found | 404 | NOT_FOUND | "Department/category not found" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required" |

---

### F02 API Surface (this feature)

Full schemas: see `Y1b-api-admin.md` §Departments and §Categories.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/departments` | staff/admin | List all departments |
| POST | `/api/departments` | admin | Create department |
| GET | `/api/departments/{id}` | staff/admin | Get department detail |
| PUT | `/api/departments/{id}` | admin | Update department |
| DELETE | `/api/departments/{id}` | admin | Deactivate department |
| GET | `/api/categories` | staff/admin (or public for active) | List categories |
| POST | `/api/categories` | admin | Create category |
| GET | `/api/categories/{id}` | Any (visibility-checked) | Get category detail |
| PUT | `/api/categories/{id}` | admin | Update category |
| DELETE | `/api/categories/{id}` | admin | Deactivate category |
| GET | `/api/category-groups` | staff/admin | List category groups |
| POST | `/api/category-groups` | admin | Create category group |
| PUT | `/api/category-groups/{id}` | admin | Update category group |
| DELETE | `/api/category-groups/{id}` | admin | Delete category group |

---

### F02 Schema Surface (this feature)

Tables: `departments`, `categories`, `categoryGroups`. See `Y0a-schema-core.md` §departments and §categories.

Key columns:
- `departments`: `id`, `name`, `defaultAssigneeId` (FK → people), `active`
- `categories`: `id`, `name`, `departmentId` (FK → departments), `groupId` (FK → categoryGroups), `slaDays`, `displayPermission`, `postingPermission`, `defaultAssigneeId`, `autoCloseDays`, `active`, `fields` (JSON)
- `categoryGroups`: `id`, `name`, `sortOrder`, `active`
---

## F03: People & Contact Management

**Description:** uReport maintains a unified people/contacts directory covering both municipal staff and constituents. Each person record holds identity data, role, and one or more contact methods (email addresses, phone numbers, physical addresses). Staff persons are linked to departments; constituent persons are linked as ticket reporters.

**Terminology:**
- **Contact Method:** An email address, phone number, or physical address record associated with a person. Maps to `contactMethods` table.
- **Primary Email:** The designated primary email address for a person; used for notifications.
- **Role:** The access level of the person — `admin`, `staff`, or `public`. Stored in `people.role`. Anonymous users have no `people` record.
- **Active:** Whether the person record is enabled. Inactive staff cannot log in; inactive reporters are preserved for history.

**Sub-features:**
- Create person record (staff-created or auto-created on first OIDC login)
- View person detail with all contact methods
- Edit person fields (name, role, department association)
- Add/edit/remove contact methods (emails, phones, addresses)
- Deactivate person record
- Search and filter people by name, email, role, department
- Link person as ticket reporter
- Link person as ticket assignee

---

### F03 Process: Create Person

1. Admin submits person payload with at least one contact method (email recommended).
2. System validates email uniqueness across all `contactMethods` of type `email`.
3. System creates `people` record with `active = true`.
4. System creates associated `contactMethods` records.
5. System returns created person with HTTP 201.

### F03 Process: OIDC Auto-Provision

1. Staff completes OIDC login flow (see F11).
2. System looks up `people` record by `oidcSubject` or primary email from OIDC claims.
3. If no record found, system auto-creates a person record with role `public` and data from OIDC claims.
4. Admin must manually elevate role to `staff` or `admin` after first login.
5. Subsequent logins update the person's name/email from fresh OIDC claims.

### F03 Process: Add Contact Method

1. Staff or admin submits new contact method (type + value + optional `isPrimary` flag).
2. System validates the value format per type.
3. If `isPrimary = true` and another primary of the same type already exists, the existing primary is demoted.
4. System creates `contactMethods` record linked to the person.
5. System returns updated person with HTTP 200.

---

### F03 Inputs

**Create/Edit Person:**
- `firstName` (string, required, max 100)
- `lastName` (string, required, max 100)
- `role` (enum, required): `admin` | `staff` | `public`
- `departmentId` (integer, optional): Staff department affiliation
- `active` (boolean, optional, default true)
- `oidcSubject` (string, optional, max 255): OIDC `sub` claim for SSO matching

**Contact Method Object:**
- `type` (enum, required): `email` | `phone` | `address`
- `value` (string, required): The email address, phone number, or address string
- `phoneType` (enum, optional, when type=phone): `mobile` | `office` | `home`
- `isPrimary` (boolean, default false)
- `label` (string, optional, max 100): Friendly label (e.g., "Work Email")

**Search/Filter:**
- `q` (string, optional): Free-text search over name, email
- `role` (enum, optional): Filter by role
- `departmentId` (integer, optional): Filter by department
- `active` (boolean, optional, default true): Include/exclude inactive

---

### F03 Outputs

- **Person object**: `{ id, firstName, lastName, fullName, role, departmentId, active, oidcSubject, contactMethods[], createdAt, updatedAt }`
- **Contact method object**: `{ id, personId, type, value, phoneType, isPrimary, label }`
- **Paginated list** on search endpoints
- **HTTP 201** on create; **HTTP 200** on update; **HTTP 204** on deactivate

---

### F03 Validation

- `firstName` and `lastName` must be non-empty strings
- `role` must be one of: `admin`, `staff`, `public`
- Email `value` must be valid RFC 5322 format
- Email `value` must be unique across all active `contactMethods` of type `email`
- Phone `value` should match a reasonable phone pattern (digits, spaces, dashes, parentheses, +)
- `departmentId` must reference an active department if provided
- Cannot set role `admin` or `staff` on a person without a valid email contact method
- Deactivating a person does not delete their tickets or actions
- Cannot delete a person record (only deactivate) — preserves historical references

---

### F03 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate email across persons | 422 | DUPLICATE_EMAIL | "This email address is already registered" |
| Invalid email format | 422 | INVALID_EMAIL | "Email address is not valid" |
| Invalid role value | 422 | INVALID_ROLE | "Role must be admin, staff, or public" |
| Invalid `departmentId` | 422 | INVALID_DEPARTMENT | "Department not found or inactive" |
| Person not found | 404 | NOT_FOUND | "Person not found" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required to manage people" |

---

### F03 API Surface (this feature)

Full schemas: see `Y1b-api-admin.md` §People.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/people` | staff/admin | List/search people |
| POST | `/api/people` | admin | Create person |
| GET | `/api/people/{id}` | staff/admin | Get person detail |
| PUT | `/api/people/{id}` | admin | Update person |
| DELETE | `/api/people/{id}` | admin | Deactivate person |
| GET | `/api/people/{id}/contact-methods` | staff/admin | List contact methods |
| POST | `/api/people/{id}/contact-methods` | admin | Add contact method |
| PUT | `/api/people/{id}/contact-methods/{cmId}` | admin | Update contact method |
| DELETE | `/api/people/{id}/contact-methods/{cmId}` | admin | Remove contact method |

---

### F03 Schema Surface (this feature)

Tables: `people`, `contactMethods`. See `Y0a-schema-core.md` §people.

Key columns:
- `people`: `id`, `firstName`, `lastName`, `role` (enum admin/staff/public), `departmentId` (FK), `active`, `oidcSubject`, `createdAt`, `updatedAt`
- `contactMethods`: `id`, `personId` (FK → people), `type` (enum email/phone/address), `value`, `phoneType`, `isPrimary`, `label`
---

## F04: Full-Text Search & Filtering

**Description:** Staff can search across all tickets using keywords and apply multi-dimensional filters to narrow results. Apache Solr powers the full-text index and geo-spatial clustering. The search system is the primary way staff navigate the ticket queue; it supports CSV export, print rendering, saved bookmarks, and a map visualization mode.

**Terminology:**
- **Solr Index:** The Apache Solr search index that mirrors ticket fields for fast full-text and faceted queries.
- **Facet:** A Solr-computed count breakdown by a dimension (e.g., tickets per status, per category).
- **Sort:** The ordering of results — by date (default desc), SLA status, assignee, category, etc.
- **Bookmark:** A saved search filter state per user (see F12).
- **Export:** Download of search results as a CSV file.
- **Cluster:** A geo-density group of tickets for map visualization (see F05).

**Sub-features:**
- Keyword full-text search
- Filter by status, substatus, category, department, assignee, date range, location
- Sort results (date, SLA, assignee, etc.)
- Paginate results
- Map view of results with geo-clustering (see F05)
- CSV export of current result set
- Print-friendly rendering
- Saved search bookmarks (see F12)
- Solr index synchronization on ticket mutations

---

### F04 Process: Execute Search

1. Client submits search request with optional `q` (keyword) and filter parameters.
2. System builds a Solr query: full-text match on `q` (if provided) across indexed fields (title, description, responses, address).
3. System applies filter facets: status, categoryId, departmentId, assigneeId, substatusId, dateRange, geoBox/radius.
4. System executes Solr query; retrieves matching ticket IDs and computed facet counts.
5. System loads full ticket records from MySQL for the current page (ID-based lookup, not full Solr payload).
6. System returns paginated result list with facet counts and pagination meta.

### F04 Process: CSV Export

1. Client requests export with same filter parameters plus `export=csv`.
2. System executes Solr query without page size cap (up to a configurable maximum, default 5000 rows).
3. System streams CSV response with headers: `Content-Disposition: attachment; filename="tickets.csv"`.
4. CSV columns: Ticket ID, Title, Status, Substatus, Category, Department, Assignee, Reporter, Address, Date Opened, Date Closed, SLA Days, Late.
5. Response is `text/csv` format.

### F04 Process: Solr Index Sync

1. Any ticket create/update/close/reopen/delete triggers an async Solr index update.
2. System calls Solr update API with the full document for the ticket.
3. On delete, system removes the document from Solr.
4. A full re-index CLI command must be available for recovery.

---

### F04 Inputs

- `q` (string, optional): Keyword search string (max 500 chars)
- `status` (enum, optional): `open` | `closed`
- `substatusId` (integer, optional): Filter by specific substatus
- `categoryId` (integer or array, optional): One or more category IDs
- `departmentId` (integer or array, optional): One or more department IDs
- `assigneeId` (integer, optional): Filter by assignee person ID
- `reporterEmail` (string, optional): Filter by reporter email
- `dateFrom` (ISO 8601 date, optional): Opened on or after
- `dateTo` (ISO 8601 date, optional): Opened on or before
- `lat` (decimal, optional): Geo center latitude
- `lng` (decimal, optional): Geo center longitude
- `radius` (integer, optional): Radius in meters
- `bbox` (string, optional): Bounding box `minLat,minLng,maxLat,maxLng`
- `sort` (string, optional): `date_desc` (default) | `date_asc` | `sla_asc` | `assignee` | `category`
- `page` (integer, optional, default 1)
- `perPage` (integer, optional, default 25, max 100)
- `export` (string, optional): `csv` to trigger export mode

---

### F04 Outputs

**Search result envelope:**
```json
{
  "data": [{ ticket objects }],
  "meta": {
    "total": 342,
    "page": 1,
    "perPage": 25,
    "pages": 14,
    "facets": {
      "status": { "open": 280, "closed": 62 },
      "category": { "1": 45, "2": 30 },
      "department": { "3": 120 }
    }
  },
  "errors": []
}
```

**CSV export:** `text/csv` file with columns as listed in process above.

---

### F04 Validation

- `q` max 500 characters; HTML and script tags stripped before Solr query
- `status` must be `open` or `closed` if provided
- `dateFrom` and `dateTo` must be parseable ISO 8601 dates
- `dateFrom` must be ≤ `dateTo` if both provided
- `lat`/`lng` must be valid coordinate ranges; `radius` must be positive integer
- `bbox` must be exactly 4 comma-separated decimals in correct order
- `perPage` capped at 100 for list view, 5000 for CSV export
- Caller must have at minimum anonymous access; staff-only categories are excluded from results for non-staff callers

---

### F04 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Solr unavailable | 503 | SEARCH_UNAVAILABLE | "Search service is temporarily unavailable" |
| Invalid date format | 422 | INVALID_DATE | "Date must be ISO 8601 format (YYYY-MM-DD)" |
| Invalid `bbox` format | 422 | INVALID_BBOX | "Bounding box must be minLat,minLng,maxLat,maxLng" |
| `dateFrom` after `dateTo` | 422 | INVALID_DATE_RANGE | "Start date must be before end date" |
| Export exceeds row cap | 413 | EXPORT_TOO_LARGE | "Export exceeds maximum 5000 rows; refine filters" |

---

### F04 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §Search.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets` | Any (role-filtered) | Search/list tickets |
| GET | `/api/tickets?export=csv` | staff/admin | CSV export |
| GET | `/api/tickets/clusters` | Any (role-filtered) | Geo-cluster data for map view |

---

### F04 Schema Surface (this feature)

Reads `tickets`, `categories`, `departments`, `people`, `ticket_geodata`. Solr index is the primary search engine; MySQL is used for full record hydration. Writes to Solr on every ticket mutation. No new tables.
---

## F05: Geospatial Features

**Description:** Service requests are inherently location-based. uReport captures latitude/longitude coordinates and a human-readable address string for every ticket, integrates with a configurable address lookup service to resolve entered addresses to coordinates, and displays tickets on interactive maps with density clustering powered by Solr geospatial indexing.

**Terminology:**
- **Geocoding:** The process of converting a human-readable address string into latitude/longitude coordinates.
- **Reverse Geocoding:** Converting lat/lng back into a human-readable address string.
- **Address Service:** The configurable external service (e.g., Google Maps, Nominatim, a city GIS API) used for geocoding.
- **GeoCluster:** A Solr-computed spatial grid cell aggregating nearby tickets for density map rendering. Maps to `geoclusters` table.
- **Bounding Box:** A rectangular geographic area defined by `minLat, minLng, maxLat, maxLng`.
- **Heatmap / Density Map:** The map view showing relative ticket density per area.

**Sub-features:**
- Store lat/lng and address string per ticket
- Geocode address → lat/lng via configurable address service
- Reverse geocode lat/lng → address string
- Display single ticket on map (marker)
- Display search results as geo-clustered density map
- Support bounding-box and radius-based geographic filtering (see F04)
- Return cluster data endpoint for map rendering

---

### F05 Process: Geocode on Ticket Create

1. Caller provides `address` string (and optionally lat/lng).
2. If lat/lng not provided, system calls the configured address service with the `address` string.
3. Address service returns lat/lng; system stores in `ticket_geodata`.
4. If address service is unavailable or returns no result, system stores ticket without coordinates and sets `geoStatus = 'pending'`.
5. A background job (or retry on next view) attempts geocoding for `pending` tickets.

### F05 Process: Reverse Geocode on Coordinate-Only Submit

1. Caller provides lat/lng but no address string (common via Open311 mobile apps).
2. System calls address service with lat/lng for reverse geocoding.
3. System stores the returned address string in `tickets.address`.
4. If reverse geocode fails, `tickets.address` remains null.

### F05 Process: Geo-Cluster Map Data

1. Client requests `/api/tickets/clusters` with optional bounding box or search filters.
2. System queries Solr geospatial clustering (spatial heatmap component) with the filters.
3. Solr returns cluster grid cells with ticket counts and centroid coordinates.
4. System returns cluster array: `[{ lat, lng, count, level }]` for map rendering.
5. Individual ticket markers: returned from standard search results at high zoom levels when count per cell < threshold (default 10).

### F05 Process: Address Service Integration

1. System reads address service config: `ADDRESS_SERVICE_TYPE` (google|nominatim|city_gis|none), `ADDRESS_SERVICE_URL`, `ADDRESS_SERVICE_KEY`.
2. All geocoding calls are routed through an `AddressService` interface (repository pattern).
3. If `ADDRESS_SERVICE_TYPE = 'none'`, geocoding is disabled; lat/lng from caller is stored as-is.
4. Geocoding calls are cached by address string (Redis or in-memory) to avoid redundant API calls.

---

### F05 Inputs

**Geocode request (internal):**
- `address` (string, required): Human-readable address to geocode

**Reverse geocode request (internal):**
- `lat` (decimal, required): Latitude
- `lng` (decimal, required): Longitude

**Cluster map request:**
- `bbox` (string, optional): Bounding box `minLat,minLng,maxLat,maxLng`
- `zoom` (integer, optional): Map zoom level (1–20) — determines cluster grid resolution
- Plus all standard search filter params (see F04)

---

### F05 Outputs

- **Geocoded coordinates:** `{ lat: decimal, lng: decimal, addressNormalized: string }`
- **Cluster array:** `[{ lat, lng, count, zoom }]`
- **Single ticket map marker:** included in ticket detail response as `{ lat, lng, address }`

---

### F05 Validation

- `lat` must be in −90..+90; `lng` in −180..+180
- `address` for geocoding must be non-empty, max 500 chars
- `zoom` for clusters must be 1–20 inclusive if provided
- `bbox` format: 4 comma-separated decimals, `minLat < maxLat`, `minLng < maxLng`
- Geocoding is optional on ticket create if lat/lng are directly provided

---

### F05 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Address service unavailable | 503 | GEO_SERVICE_UNAVAILABLE | "Address lookup service unavailable; ticket saved without coordinates" |
| Address not found by geocoding service | 422 | ADDRESS_NOT_FOUND | "Address could not be geocoded; please provide coordinates manually" |
| Invalid bounding box | 422 | INVALID_BBOX | "Bounding box must be minLat,minLng,maxLat,maxLng" |
| Coordinates out of range | 422 | INVALID_COORDINATES | "Latitude must be −90 to +90; longitude −180 to +180" |

> **Note:** Geocoding failure is non-fatal for ticket creation — the ticket is saved without coordinates and flagged for retry.

---

### F05 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/clusters` | Any (role-filtered) | Geo-cluster data for map |
| GET | `/api/geocode` | staff | Geocode an address (utility endpoint for SPA map picker) |
| GET | `/api/tickets/{id}/location` | Any (visibility-checked) | Get ticket location data |

---

### F05 Schema Surface (this feature)

Tables: `ticket_geodata`, `geoclusters`. See `Y0b-schema-supporting.md` §geodata.

Key columns:
- `ticket_geodata`: `id`, `ticketId` (FK → tickets), `lat` (decimal 10,7), `lng` (decimal 10,7), `address`, `geoStatus` (enum: located|pending|failed), `addressNormalized`
- `geoclusters`: `id`, `lat`, `lng`, `zoom`, `count`, `updatedAt` — periodically recomputed by Solr cluster job
---

## F06: Ticket History & Audit Trail

**Description:** Every mutation to a ticket is recorded as an immutable action entry in the `actions` table. The history gives staff, supervisors, and auditors a complete chronological record of what happened to a ticket, who did it, and when. Action types are enumerated and structured. History is displayed in the ticket detail view and is accessible via API.

**Terminology:**
- **Action:** An immutable event record for a ticket mutation. Maps to `actions` table.
- **Action Type:** An enumerated string identifying the kind of mutation: `open`, `assignment`, `closed`, `reopen`, `response`, `comment`, `upload`, `deleted`, `merged`, `substatus`.
- **Actor:** The person or API client who caused the action.
- **Payload:** A JSON blob containing action-specific data (e.g., previous/new assignee, response text, media ID).
- **Visibility:** Whether the action is visible to the ticket reporter (`external`) or only to staff (`internal`).

**Sub-features:**
- Record action on every ticket mutation
- Action types: open, assignment, closed, reopen, response, comment, upload, deleted, merged, substatus
- Capture actor, timestamp, and payload per action
- Display chronological history in ticket detail view
- Expose history via API endpoint
- Filter history by action type in API

---

### F06 Process: Record Action

1. Triggered internally by ticket lifecycle operations (F00, F17, F18).
2. System constructs the action record: `ticketId`, `type`, `actorPersonId` (or `actorClientId` for API clients), `datetimeCreated = NOW()`, `payload` (JSON), `visibility` (internal/external).
3. System inserts into `actions` — no update or delete ever; records are append-only.
4. For `response` type: `payload.body` = response text; `visibility = 'external'`.
5. For `comment` type: `payload.body` = comment text; `visibility = 'internal'`.
6. For `assignment` type: `payload.previousAssigneeId`, `payload.newAssigneeId`.
7. For `substatus` type: `payload.previousSubstatusId`, `payload.newSubstatusId`.
8. For `upload` type: `payload.mediaId` array referencing `media` records.
9. For `merged` type: `payload.mergedFromTicketId` or `payload.mergedIntoTicketId`.

### F06 Process: Retrieve History

1. Client requests `GET /api/tickets/{id}/history`.
2. System fetches all `actions` for the ticket, ordered by `datetimeCreated ASC`.
3. System filters: if caller is not staff/admin, `internal` visibility actions are excluded.
4. System resolves actor names from `people` (for `actorPersonId`) or `clients` (for `actorClientId`).
5. System returns paginated action list.

---

### F06 Inputs

**History list query parameters:**
- `type` (enum, optional): Filter by action type
- `visibility` (enum, optional): `external` | `internal` (staff/admin only)
- `page` (integer, optional, default 1)
- `perPage` (integer, optional, default 50, max 200)

---

### F06 Outputs

**Action object:**
```json
{
  "id": 4521,
  "ticketId": 101,
  "type": "response",
  "visibility": "external",
  "actor": { "id": 5, "name": "Jane Smith", "type": "person" },
  "datetimeCreated": "2026-06-23T14:32:00Z",
  "payload": {
    "body": "We have scheduled a repair crew for Wednesday."
  }
}
```

**Assignment action payload:**
```json
{
  "previousAssigneeId": null,
  "newAssigneeId": 5,
  "previousDepartmentId": 2,
  "newDepartmentId": 2
}
```

---

### F06 Validation

- Action records are **append-only** — no PUT or DELETE on `actions` is permitted
- `type` must be one of the enumerated action types
- `actorPersonId` or `actorClientId` must be non-null (system cannot record anonymous actor; use a system account for automated actions)
- `payload` must be valid JSON; schema depends on `type`
- `visibility` defaults to `internal` for `comment` type; `external` for `response` and `open` types; `internal` for all others

---

### F06 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Ticket not found | 404 | NOT_FOUND | "Ticket not found" |
| Attempt to modify action record | 405 | METHOD_NOT_ALLOWED | "Action records cannot be modified" |
| Invalid `type` filter | 422 | INVALID_ACTION_TYPE | "Invalid action type filter" |

---

### F06 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §History.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/{id}/history` | Any (visibility-filtered) | Get ticket action history |
| POST | `/api/tickets/{id}/responses` | staff/admin | Post response (creates action type=response) |
| POST | `/api/tickets/{id}/comments` | staff/admin | Post comment (creates action type=comment) |

> Note: POST to responses/comments are also listed under F00 — they route to the same action creation logic.

---

### F06 Schema Surface (this feature)

Primary table: `actions`. See `Y0a-schema-core.md` §actions.

Key columns:
- `id`, `ticketId` (FK → tickets), `type` (enum), `visibility` (enum: external/internal)
- `actorPersonId` (FK → people, nullable), `actorClientId` (FK → clients, nullable)
- `datetimeCreated`, `payload` (JSON)
- No `updatedAt` — records are immutable
---

## F07: Media Attachments

**Description:** Tickets can have images and files attached to them — either uploaded by the constituent at submission time or added by staff during the resolution workflow. Attachments are stored with their metadata in the `media` table, displayed in the ticket detail view, and recorded in the audit trail as upload actions. The Open311 POST endpoint also accepts a `media_url` field pointing to a remote image.

**Terminology:**
- **Media Record:** The database record tracking a file attachment. Maps to `media` table.
- **Upload Action:** An `actions` record of type `upload` that references one or more media records.
- **Thumbnail:** A resized preview image generated server-side for image attachments (JPEG, PNG, GIF, WebP).
- **media_url:** The Open311 field allowing a remote image URL to be associated with a service request.
- **File Size Limit:** Configurable maximum upload size per file (default 10 MB).
- **Allowed Types:** Configurable list of permitted MIME types.

**Sub-features:**
- Upload image files (JPEG, PNG, GIF, WebP) to a ticket
- Upload non-image files (PDF and other document types) to a ticket
- Associate attachments with a specific action in the ticket history
- Generate and serve image thumbnails
- Provide download links for all attachment types
- Enforce configurable file size and MIME type limits
- Support `media_url` field from Open311 POST (store URL reference, not the file itself)
- Delete attachment (admin/staff with appropriate permission)

---

### F07 Process: Upload File

1. Staff or public user submits `POST /api/tickets/{id}/media` with `multipart/form-data`.
2. System validates file size ≤ configured `MAX_UPLOAD_SIZE` (default 10 MB).
3. System validates MIME type against allowed list.
4. System generates a unique filename and stores the file in the configured upload directory.
5. For image types (JPEG, PNG, GIF, WebP), system generates a thumbnail (max 300×300px, JPEG).
6. System creates a `media` record with `ticketId`, `filename`, `originalName`, `mimeType`, `size`, `thumbnailPath`.
7. System creates an `actions` record with `type = 'upload'`, `payload.mediaIds = [id]`.
8. System updates Solr index for the ticket.
9. System returns the media record with HTTP 201.

### F07 Process: Retrieve Attachments

1. Client requests `GET /api/tickets/{id}/media`.
2. System returns list of `media` records for the ticket.
3. Each record includes a signed URL or direct path for download/thumbnail.
4. Visibility enforcement: if ticket is staff-only category, caller must be staff/admin.

### F07 Process: Delete Attachment

1. Staff/admin requests `DELETE /api/tickets/{id}/media/{mediaId}`.
2. System verifies caller has staff or admin role.
3. System soft-deletes the `media` record (`deletedAt = NOW()`).
4. System does **not** remove the physical file immediately (garbage collection handles orphan cleanup).
5. System returns HTTP 204.

### F07 Process: Open311 media_url

1. Open311 POST request includes `media_url` field.
2. System stores the URL in `media` table as `sourceUrl`, `mimeType = 'external'`, without downloading the file.
3. Thumbnail is not generated for URL-referenced media.
4. Upload action is created referencing this media record.

---

### F07 Inputs

**Upload:**
- `file` (binary, required): The file content (`multipart/form-data`)
- `label` (string, optional, max 255): Human-readable label for the attachment

**Open311 URL reference:**
- `media_url` (string): Valid HTTP/HTTPS URL pointing to an image

---

### F07 Outputs

**Media object:**
```json
{
  "id": 88,
  "ticketId": 101,
  "filename": "upload_101_abc123.jpg",
  "originalName": "pothole-photo.jpg",
  "mimeType": "image/jpeg",
  "size": 2048576,
  "isImage": true,
  "thumbnailUrl": "/uploads/thumbs/upload_101_abc123_thumb.jpg",
  "downloadUrl": "/uploads/upload_101_abc123.jpg",
  "label": null,
  "sourceUrl": null,
  "createdAt": "2026-06-23T10:00:00Z"
}
```

---

### F07 Validation

- File size must not exceed `MAX_UPLOAD_SIZE` (configurable, default 10 MB)
- MIME type must be in `ALLOWED_MIME_TYPES` list (configurable; default: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`)
- `media_url` must be a valid absolute HTTP/HTTPS URL if provided
- Ticket must exist and not be deleted
- Caller must have posting permission for the ticket's category (see F10)
- Max attachments per ticket: configurable (default 20)

---

### F07 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| File exceeds size limit | 422 | FILE_TOO_LARGE | "File exceeds maximum size of 10 MB" |
| Disallowed MIME type | 422 | INVALID_FILE_TYPE | "File type not allowed" |
| Ticket not found | 404 | NOT_FOUND | "Ticket not found" |
| Attachment count limit reached | 422 | ATTACHMENT_LIMIT | "Maximum attachments per ticket reached" |
| Delete without permission | 403 | FORBIDDEN | "Staff or admin role required to delete attachments" |
| Invalid media_url | 422 | INVALID_URL | "media_url must be a valid HTTP/HTTPS URL" |

---

### F07 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §Media.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/{id}/media` | Any (visibility-checked) | List ticket attachments |
| POST | `/api/tickets/{id}/media` | Any (role-checked) | Upload attachment |
| GET | `/api/tickets/{id}/media/{mediaId}` | Any (visibility-checked) | Get attachment metadata |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | staff/admin | Delete attachment |

---

### F07 Schema Surface (this feature)

Table: `media`. See `Y0a-schema-core.md` §media.

Key columns:
- `id`, `ticketId` (FK → tickets), `filename`, `originalName`, `mimeType`, `size` (bytes)
- `path` (server file path), `thumbnailPath` (nullable), `sourceUrl` (nullable — for Open311 media_url)
- `label` (nullable), `deletedAt` (nullable), `createdAt`
- `isImage` (computed or stored boolean)
---

## F08: Notification System

**Description:** uReport sends transactional email notifications to all relevant parties when tickets are created, assigned, updated, or responded to. Staff can receive digest-style summary emails. All email sending uses SMTP configured via site config. Notification templates (see F13) are used for message body content, with template variable substitution.

**Terminology:**
- **Transactional Notification:** A single-event email triggered by a ticket mutation (e.g., "new ticket assigned to you").
- **Digest Email:** A scheduled summary email listing open/new tickets for a department.
- **Notification Log:** A record that a specific notification was sent for a ticket, to prevent duplicates.
- **CC Recipients:** Staff members explicitly added as watchers on a ticket who receive update emails.
- **SMTP Config:** Server address, port, credentials, TLS settings — stored in `site_config.php` constants.

**Sub-features:**
- Send confirmation email to reporter on ticket creation
- Send assignment notification to new assignee
- Send update notification to reporter when staff posts a response
- Send CC notifications to staff watchers on ticket updates
- Send digest emails to department staff (configurable frequency)
- Prevent duplicate notification sends
- SMTP configuration via site config
- Template variable substitution in email bodies (see F13)

---

### F08 Process: Ticket Creation Notification

1. Ticket is created (F00 step 9).
2. System checks: does the ticket have a reporter email (`reporterEmail` or `contactMethods`)?
3. If yes, system composes email using the "ticket_created" template.
4. System substitutes template variables: `{{ticket_id}}`, `{{title}}`, `{{category}}`, `{{status}}`, `{{ticket_url}}`.
5. System sends email via SMTP.
6. System logs notification in `ticketHistory` or notification log table (prevents resend).

### F08 Process: Assignment Notification

1. Ticket assignment is updated (F00 process: Assign Ticket, step 5).
2. System fetches new assignee's primary email from `contactMethods`.
3. System composes email using "ticket_assigned" template.
4. System substitutes variables: `{{ticket_id}}`, `{{title}}`, `{{assignee_name}}`, `{{reporter}}`, `{{ticket_url}}`.
5. System sends email.
6. System logs notification.

### F08 Process: Response Notification

1. Staff posts a response (action type `response`, visibility `external`).
2. System fetches reporter's email.
3. System composes email using "ticket_response" template; body includes the response text.
4. System sends email to reporter.
5. System logs notification.

### F08 Process: Digest Email

1. A scheduled job (cron / queue worker) runs at configured frequency (default: daily at 7am).
2. For each department, system queries tickets open > 0 days in that department.
3. System groups by assignee; composes digest email with ticket list.
4. System sends digest to all active staff in the department.
5. No individual notification log entry per ticket — digest is a summary.

---

### F08 Inputs

**Email composition parameters (internal):**
- `to` (string): Recipient email address
- `templateSlug` (string): Which template to use (e.g., `ticket_created`, `ticket_assigned`, `ticket_response`)
- `variables` (object): Key-value map for template variable substitution
- `ticketId` (integer): For notification deduplication logging

**SMTP config (site_config.php constants):**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_TLS` (bool), `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME`

---

### F08 Outputs

- Email delivered to recipient(s) via SMTP
- Notification log entry created (prevents duplicate sends)
- No synchronous API output — notifications are fire-and-forget (async preferred)

---

### F08 Validation

- Recipient email must be valid RFC 5322 format
- Template slug must reference an existing template (see F13)
- Notification not sent if identical notification was sent within the last 60 seconds (dedup window)
- If SMTP fails, system logs error to Graylog and does not retry indefinitely (max 3 retries with exponential backoff)
- No notification is sent for tickets in staff-only categories to public/anonymous reporters
- Digest email only sent if there are ≥ 1 open tickets for the recipient's department

---

### F08 Error States

| Scenario | Handling |
|----------|---------|
| SMTP connection failure | Log error to Graylog; retry up to 3 times; if all fail, mark notification as `failed` in log |
| Invalid recipient email | Skip silently; log to Graylog as a warning |
| Template not found | Log error; use fallback plain-text format |
| Duplicate notification within dedup window | Skip silently |
| Reporter has no email address | Skip notification silently |

> **Note:** Notification failures are non-fatal — the ticket operation proceeds regardless of email delivery success.

---

### F08 API Surface (this feature)

Notifications are internal — no external API endpoints. Configuration is via site config. The following admin-facing API is exposed for digest configuration:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/settings` | admin | Get notification settings |
| PUT | `/api/notifications/settings` | admin | Update digest frequency and SMTP settings |

---

### F08 Schema Surface (this feature)

No dedicated notifications table in legacy schema — notifications are tracked via `ticketHistory`/`actions` with a `type = 'notification_sent'` record, or via a new `notification_log` table.

**New table: `notification_log`** (if not already present in legacy schema):
- `id`, `ticketId` (FK → tickets), `templateSlug`, `recipientEmail`, `sentAt`, `status` (sent|failed), `attemptCount`

See `Y0b-schema-supporting.md` §notification_log.
---

## F09: Reporting & Metrics

**Description:** Supervisors and administrators need visibility into ticket volume, staff performance, SLA compliance, and departmental workload. uReport provides a set of standard parameterized reports and a metrics API endpoint for real-time SLA percentage tracking consumed by external dashboards. All reports support CSV export.

**Terminology:**
- **SLA On-Time:** A ticket is "on-time" if it was closed before `datetimeOpened + category.slaDays` business days elapsed.
- **SLA Late:** A ticket is "late" if it was closed after its expected close date, or if it is still open and the expected close date has passed.
- **Activity Period:** The time range filter applied to a report (default: last 30 days).
- **Metrics Endpoint:** A lightweight API endpoint returning SLA percentages per category, consumed by external monitoring dashboards.

**Sub-features:**
- Activity report (ticket counts by time period)
- Assignment report (tickets per staff member)
- Category report (volume + SLA rates per category)
- Department report (volume + resolution rates)
- Staff performance report (response times, closure rates)
- SLA report (on-time vs. late)
- Volume report (daily/weekly/monthly trends)
- Open ticket age report (tickets open beyond SLA)
- Metrics API endpoint (on-time SLA % per category)
- CSV export for all reports

---

### F09 Process: Generate Report

1. Staff/admin requests a report endpoint with filter parameters.
2. System queries MySQL (no Solr for reports — aggregation queries run against the DB).
3. System computes aggregates: counts, averages, percentages.
4. System returns report data as JSON or CSV (based on `Accept` header or `format` param).

### F09 Process: SLA Calculation

1. For each ticket in the report scope, compute `expectedCloseDatetime = datetimeOpened + (category.slaDays × 8 working hours)`.
2. Compare against `datetimeClosed` (for closed tickets) or `NOW()` (for open tickets).
3. `slaStatus = 'on_time'` if closed before expected; `'late'` if closed after or still open past expected; `'no_sla'` if `slaDays = null`.
4. Aggregate into on-time %, late %, no-SLA % per category.

### F09 Process: Metrics Endpoint (External Dashboard)

1. External system calls `GET /api/metrics/sla`.
2. System computes on-time SLA percentage for each active category over the last 30 days (configurable).
3. System returns lightweight JSON: array of `{ categoryId, categoryName, totalClosed, onTime, late, onTimePct }`.
4. Response is cached for 5 minutes to avoid repeated DB aggregation.

---

### F09 Inputs

**Common report filters:**
- `dateFrom` (ISO 8601 date, optional): Period start (default: 30 days ago)
- `dateTo` (ISO 8601 date, optional): Period end (default: today)
- `categoryId` (integer, optional): Limit to specific category
- `departmentId` (integer, optional): Limit to specific department
- `assigneeId` (integer, optional): Limit to specific staff member
- `format` (string, optional): `json` (default) | `csv`

**Metrics endpoint filters:**
- `days` (integer, optional, default 30): Rolling window in days
- `categoryId` (integer, optional): Limit to specific category

---

### F09 Outputs

**Activity Report:**
```json
{
  "data": {
    "period": { "from": "2026-05-24", "to": "2026-06-23" },
    "totalOpened": 142,
    "totalClosed": 118,
    "openAtPeriodEnd": 24,
    "byDay": [{ "date": "2026-06-01", "opened": 8, "closed": 5 }]
  }
}
```

**SLA Metrics:**
```json
{
  "data": [
    {
      "categoryId": 1,
      "categoryName": "Pothole Repair",
      "totalClosed": 45,
      "onTime": 38,
      "late": 7,
      "onTimePct": 84.4
    }
  ]
}
```

**Assignment Report:** `[{ assigneeId, assigneeName, open, closed, avgDaysToClose }]`

**Volume Report:** `[{ period: "2026-W24", opened: 32, closed: 28 }]`

---

### F09 Validation

- `dateFrom` must be ≤ `dateTo`
- Maximum report range: 2 years
- `days` for metrics endpoint: 1–365
- Caller must have `staff` or `admin` role for all reporting endpoints
- CSV export available for all reports

---

### F09 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Date range too large | 422 | DATE_RANGE_TOO_LARGE | "Report date range cannot exceed 2 years" |
| `dateFrom` after `dateTo` | 422 | INVALID_DATE_RANGE | "Start date must be before end date" |
| Unauthorized (not staff) | 403 | FORBIDDEN | "Staff or admin role required for reports" |
| Invalid `categoryId` or `departmentId` | 422 | INVALID_FILTER | "Category or department not found" |

---

### F09 API Surface (this feature)

Full schemas: see `Y1a-api-tickets.md` §Reporting.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reports/activity` | staff/admin | Activity report |
| GET | `/api/reports/assignments` | staff/admin | Assignment report |
| GET | `/api/reports/categories` | staff/admin | Category volume + SLA |
| GET | `/api/reports/departments` | staff/admin | Department report |
| GET | `/api/reports/staff-performance` | staff/admin | Per-staff metrics |
| GET | `/api/reports/sla` | staff/admin | SLA on-time/late breakdown |
| GET | `/api/reports/volume` | staff/admin | Volume trends |
| GET | `/api/reports/open-age` | staff/admin | Tickets open past SLA |
| GET | `/api/metrics/sla` | Any (public) | External SLA metrics (cached) |

---

### F09 Schema Surface (this feature)

Read-only aggregation over `tickets`, `actions`, `categories`, `departments`, `people`. No dedicated report tables — all computed on demand from normalized schema. Metrics endpoint output cached in memory (or Redis if configured).
---

## F10: Role-Based Access Control

**Description:** Access to uReport's features is governed by roles assigned to person records. Roles determine what a user can see, create, edit, and delete across all API endpoints and UI views. Category-level permissions add a second dimension: per-category display and posting permissions determine whether anonymous or public users can interact with specific service types.

**Terminology:**
- **Role:** The system-level access level of a person: `admin`, `staff`, or `public`. Anonymous (unauthenticated) users have no role.
- **Display Permission:** Per-category setting controlling who can see tickets in that category in list/search views.
- **Posting Permission:** Per-category setting controlling who can submit new tickets in that category.
- **Permission Check:** A server-side enforcement point that rejects unauthorized requests with HTTP 403.
- **Resource Ownership:** A public user can view and track only tickets they reported (matched by session token or email).

**Sub-features:**
- Role-based endpoint authorization (admin, staff, public, anonymous)
- Per-category display permission enforcement
- Per-category posting permission enforcement
- Resource ownership checks for public users
- API endpoint enforcement of all role constraints

---

### F10 Role Capabilities Matrix

| Capability | anonymous | public | staff | admin |
|-----------|-----------|--------|-------|-------|
| Submit ticket (category permitting) | ✓ | ✓ | ✓ | ✓ |
| View public ticket list/search | ✓ | ✓ | ✓ | ✓ |
| View own submitted tickets | — | ✓ | ✓ | ✓ |
| View all tickets | — | — | ✓ | ✓ |
| View staff-only category tickets | — | — | ✓ | ✓ |
| Assign tickets | — | — | ✓ | ✓ |
| Close/reopen tickets | — | — | ✓ | ✓ |
| Post responses (external) | — | — | ✓ | ✓ |
| Post comments (internal) | — | — | ✓ | ✓ |
| Upload attachments | ✓ (if category allows) | ✓ | ✓ | ✓ |
| Delete tickets | — | — | — | ✓ |
| Manage departments/categories | — | — | — | ✓ |
| Manage people/roles | — | — | — | ✓ |
| Manage response templates | — | — | — | ✓ |
| Manage API clients | — | — | — | ✓ |
| Manage substatuses | — | — | — | ✓ |
| View reports | — | — | ✓ | ✓ |
| View metrics endpoint | ✓ | ✓ | ✓ | ✓ |
| Merge tickets | — | — | ✓ | ✓ |

---

### F10 Process: Request Authorization

1. Every API request passes through the auth middleware (see F11).
2. Middleware resolves the caller's role from JWT claims (or `anonymous` if no JWT).
3. Controller checks route-level role requirement (e.g., `requiresRole('staff')`).
4. If route requires a higher role than caller has → HTTP 403.
5. For ticket reads/writes, controller additionally checks category-level permissions.
6. For public user ticket reads, controller checks resource ownership (reporter email or person ID match).

### F10 Process: Category Permission Check (Submit)

1. Caller submits ticket with `categoryId`.
2. System loads `categories.postingPermission`.
3. If `postingPermission = 'staff'` and caller is not staff/admin → HTTP 403.
4. If `postingPermission = 'public'` and caller is anonymous → HTTP 403.
5. If `postingPermission = 'anonymous'` → any caller permitted.

### F10 Process: Category Permission Check (View)

1. Caller requests ticket list or ticket detail.
2. System loads `categories.displayPermission` for the ticket's category.
3. If `displayPermission = 'staff'` and caller is not staff/admin → ticket excluded from results (or 403 on direct access).
4. If `displayPermission = 'public'` → authenticated and anonymous callers may view.
5. If `displayPermission = 'anonymous'` → all callers may view.

---

### F10 Inputs

- Role is determined from JWT session (see F11) — no input needed
- Category permissions are configured via F02 admin interfaces

---

### F10 Outputs

- **HTTP 200/201** on authorized requests
- **HTTP 401** if no JWT and endpoint requires authentication
- **HTTP 403** if JWT present but role is insufficient
- Filtered result sets for list endpoints (staff-only items excluded for non-staff)

---

### F10 Validation

- Role must be stored on the `people.role` column; JWT claims must be cross-validated against this column on each request (not trust JWT role claim alone)
- Category permission values must be one of the defined enums (enforced at category creation, see F02)
- Public users may only access their own ticket details (matched by `reporterPersonId` or session-stored reporter email)
- Open311 endpoints use API key authorization separately — no JWT required (see F01, F14)

---

### F10 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| No JWT / not logged in | 401 | UNAUTHENTICATED | "Authentication required" |
| Valid JWT but insufficient role | 403 | FORBIDDEN | "Your role does not permit this action" |
| Category display permission blocks view | 403 | CATEGORY_FORBIDDEN | "You do not have permission to view this category" |
| Category posting permission blocks submit | 403 | POSTING_FORBIDDEN | "This category does not allow posting by your role" |
| Public user accessing another user's ticket | 403 | NOT_YOUR_TICKET | "You may only view your own submitted tickets" |

---

### F10 API Surface (this feature)

RBAC is enforced transparently on every endpoint — no dedicated RBAC API endpoints. The role enforcement is middleware-level.

---

### F10 Schema Surface (this feature)

- `people.role` (enum: admin/staff/public) — the canonical role store
- `categories.displayPermission` (enum: public/staff/anonymous)
- `categories.postingPermission` (enum: staff/public/anonymous)

No additional tables. Role checks are computed at runtime from these columns.
---

## F11: Authentication (OIDC + JWT)

**Description:** uReport uses OpenID Connect (OIDC) as its authentication protocol. Staff log in via a configured OIDC provider (city SSO, Keycloak, Auth0, etc.). On the modernized stack, the OIDC authorization code flow exchanges tokens for a JWT-backed session stored in an HttpOnly cookie. The JWT is validated on every API request. Role is resolved from `people.role` after matching OIDC identity to a person record.

**Terminology:**
- **OIDC:** OpenID Connect — the authentication protocol layered on top of OAuth 2.0.
- **Authorization Code Flow:** The OIDC flow where the user is redirected to the provider, authenticates, and returns with an authorization code that is exchanged for tokens.
- **ID Token:** The OIDC JWT containing user identity claims (`sub`, `email`, `name`).
- **Access Token:** The OAuth 2.0 token used to call the OIDC provider's userinfo endpoint.
- **Session JWT:** The uReport-issued JWT stored in an HttpOnly cookie, representing the user's session. Distinct from the OIDC access token.
- **OIDC Subject (`sub`):** The unique identifier for the user at the OIDC provider. Stored in `people.oidcSubject`.
- **OIDC Config:** Provider issuer URL, client ID, client secret — stored in `site_config.php` constants.

**Sub-features:**
- OIDC authorization code flow (login redirect + callback)
- JWT session issuance after successful OIDC exchange
- Session JWT validation on every authenticated request
- Person record matching by `oidcSubject` or email claim
- Auto-provisioning of new person records on first login (role = `public`)
- Logout (invalidate session, redirect to OIDC provider logout)
- Unauthenticated access for public/anonymous endpoints
- Secure HttpOnly cookie-based session storage

---

### F11 Process: Staff Login

1. User navigates to `/auth/login` (or unauthenticated redirect).
2. System redirects to the configured OIDC provider's authorization endpoint with `response_type=code`, `scope=openid email profile`, and a `state` nonce.
3. User authenticates with the OIDC provider.
4. Provider redirects back to `/auth/callback?code=…&state=…`.
5. System validates the `state` nonce; exchanges `code` for OIDC tokens via the provider's token endpoint.
6. System validates the ID token signature and claims (`iss`, `aud`, `exp`).
7. System looks up person by `oidcSubject = id_token.sub` OR by `email = id_token.email`.
8. If no person found, system auto-creates with role `public` (see F03 §OIDC Auto-Provision).
9. System issues a uReport session JWT: payload `{ sub: people.id, role: people.role, exp: NOW() + SESSION_TTL }`.
10. System sets the session JWT as an HttpOnly, Secure, SameSite=Lax cookie (`ureport_session`).
11. System redirects to the originally requested URL (or default dashboard).

### F11 Process: Request Authentication

1. Every API request to a protected endpoint passes through auth middleware.
2. Middleware extracts session JWT from `ureport_session` cookie OR `Authorization: Bearer <token>` header.
3. Middleware validates JWT signature with the server's signing secret.
4. Middleware validates `exp` claim (not expired).
5. Middleware loads the person record from DB to confirm `active = true` and get current `role`.
6. Middleware sets caller context (`personId`, `role`) for downstream controllers.
7. If JWT is missing/invalid/expired → HTTP 401.
8. If person is inactive → HTTP 401 with `SESSION_REVOKED` code.

### F11 Process: Logout

1. User calls `POST /auth/logout`.
2. System clears the `ureport_session` cookie.
3. System invalidates any server-side session record (if session table maintained).
4. System redirects to the OIDC provider's end-session endpoint with `id_token_hint` and `post_logout_redirect_uri`.

---

### F11 Inputs

**Login initiation:**
- No direct inputs — user is redirected to OIDC provider

**Callback:**
- `code` (string): OIDC authorization code from provider
- `state` (string): Nonce for CSRF protection

**OIDC Config (site_config.php):**
- `OIDC_ISSUER`: Provider issuer URL
- `OIDC_CLIENT_ID`: Client ID registered with provider
- `OIDC_CLIENT_SECRET`: Client secret
- `OIDC_REDIRECT_URI`: Callback URL (`BASE_URL + '/auth/callback'`)
- `SESSION_TTL`: Session lifetime in seconds (default 28800 = 8 hours)
- `JWT_SECRET`: Signing secret for uReport session JWTs

---

### F11 Outputs

- **Session cookie** `ureport_session`: HttpOnly, Secure, SameSite=Lax, path=/
- **JWT payload**: `{ sub: personId, role: string, iss: "ureport", exp: unix_timestamp }`
- **HTTP 302** redirect on login and logout
- **HTTP 401** on invalid/expired session

---

### F11 Validation

- `state` nonce must match the value stored in the pre-login session (CSRF protection)
- ID token signature must be validated against the provider's JWKS endpoint
- ID token `exp` must be in the future
- ID token `iss` must match `OIDC_ISSUER`; `aud` must match `OIDC_CLIENT_ID`
- Session JWT `exp` must be in the future
- Person record must be `active = true` to accept login
- OIDC `sub` is the primary matching key; email is fallback; never match on name alone

---

### F11 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Invalid/expired session JWT | 401 | UNAUTHENTICATED | "Session expired; please log in again" |
| Person account inactive | 401 | SESSION_REVOKED | "Your account has been deactivated" |
| OIDC state mismatch | 400 | OAUTH_STATE_MISMATCH | "Authentication state mismatch; possible CSRF" |
| OIDC provider unreachable | 503 | IDP_UNAVAILABLE | "Authentication service unavailable; try again later" |
| ID token validation failure | 401 | INVALID_ID_TOKEN | "Identity token could not be verified" |
| OIDC provider returns error | 400 | OIDC_ERROR | Provider error description forwarded |

---

### F11 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/login` | None | Initiate OIDC authorization code flow |
| GET | `/auth/callback` | None | OIDC callback; exchange code for session |
| POST | `/auth/logout` | session | Clear session and redirect to provider logout |
| GET | `/auth/me` | session | Return current user's person record + role |

---

### F11 Schema Surface (this feature)

- `people.oidcSubject` (varchar 255): OIDC `sub` claim — used for identity matching
- `people.role`: resolved role for JWT payload
- **Optional:** `sessions` table for server-side session invalidation: `(id, personId, jwtJti, expiresAt, revokedAt)`

See `Y0b-schema-supporting.md` §sessions.
---

## F12: Bookmark / Saved Search Management

**Description:** Staff who regularly monitor specific subsets of tickets can save their current search filter configuration as a named bookmark. Bookmarks are personal to each user, persist across sessions, and can be recalled with a single click from the search interface.

**Terminology:**
- **Bookmark:** A named, persisted snapshot of a search filter state (query + filters + sort) belonging to a specific user. Maps to `bookmarks` table.
- **Filter State:** The complete set of search parameters that, when restored, reproduce the same search result.

**Sub-features:**
- Save current search state as a named bookmark
- List all bookmarks for the current user
- Load (restore) a bookmark to the search form
- Delete a bookmark
- Bookmarks are user-scoped and not visible to other users

---

### F12 Process: Save Bookmark

1. Staff navigates to a search result page with applied filters.
2. Staff submits `POST /api/bookmarks` with a `name` and the current `filterState` (serialized from current URL params or SPA state).
3. System validates name uniqueness within the user's bookmarks.
4. System creates bookmark record linked to `personId` from session.
5. System returns created bookmark with HTTP 201.

### F12 Process: Load Bookmark

1. Staff selects a bookmark from the list.
2. SPA calls `GET /api/bookmarks/{id}`.
3. System returns the `filterState` object.
4. SPA deserializes and applies the filter state to the search form/URL.

---

### F12 Inputs

**Create Bookmark:**
- `name` (string, required, max 100): Human-readable name for the saved search
- `filterState` (object, required): Serialized filter parameters (same shape as F04 search inputs)

---

### F12 Outputs

**Bookmark object:**
```json
{
  "id": 12,
  "personId": 5,
  "name": "Open Potholes - My Department",
  "filterState": {
    "status": "open",
    "categoryId": [1],
    "departmentId": [3],
    "sort": "date_desc"
  },
  "createdAt": "2026-06-10T09:00:00Z"
}
```

---

### F12 Validation

- `name` must be non-empty, max 100 characters
- `name` must be unique within the user's bookmarks (case-insensitive)
- `filterState` must be a valid JSON object (contents not strictly validated — frontend is responsible for consistent shape)
- Bookmarks are scoped to the authenticated user; no cross-user access
- Maximum 50 bookmarks per user (configurable)

---

### F12 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate bookmark name | 422 | DUPLICATE_NAME | "You already have a bookmark with this name" |
| Bookmark not found | 404 | NOT_FOUND | "Bookmark not found" |
| Bookmark limit reached | 422 | BOOKMARK_LIMIT | "Maximum 50 bookmarks reached; delete one to add another" |
| Unauthorized (not logged in) | 401 | UNAUTHENTICATED | "Authentication required" |

---

### F12 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookmarks` | staff/admin | List current user's bookmarks |
| POST | `/api/bookmarks` | staff/admin | Create bookmark |
| GET | `/api/bookmarks/{id}` | staff/admin | Get bookmark (includes filterState) |
| DELETE | `/api/bookmarks/{id}` | staff/admin | Delete bookmark |

---

### F12 Schema Surface (this feature)

Table: `bookmarks`. See `Y0b-schema-supporting.md` §bookmarks.

Key columns: `id`, `personId` (FK → people), `name`, `filterState` (JSON), `createdAt`
---

## F13: Response Templates

**Description:** Staff frequently send similar email responses to constituents (e.g., "We have received your report and will investigate within X days"). Response templates allow administrators to define reusable message bodies with template variable placeholders that staff select when composing a ticket response in the UI or that the system uses for automated notifications.

**Terminology:**
- **Template:** A named, reusable message body stored in the system. Maps to a `templates` or `ticketHistory` templates concept — stored in the DB.
- **Template Variable:** A placeholder in the format `{{variable_name}}` that is substituted with real values at send time.
- **Template Slug:** A machine-readable identifier for system templates (e.g., `ticket_created`, `ticket_assigned`). User-created templates have no slug.

**Sub-features:**
- Create, edit, and delete response templates
- Template variable placeholders in body text
- Select template when composing a ticket response (staff UI)
- System templates for automated notifications (see F08)
- Template variable substitution at send time

---

### F13 Supported Template Variables

| Variable | Substitution |
|---------|-------------|
| `{{ticket_id}}` | The ticket's numeric ID |
| `{{title}}` | Ticket title |
| `{{category}}` | Category name |
| `{{department}}` | Department name |
| `{{assignee_name}}` | Assigned staff member's full name |
| `{{reporter_name}}` | Reporter's name |
| `{{status}}` | Current ticket status |
| `{{date_opened}}` | Date ticket was opened (formatted) |
| `{{expected_close_date}}` | SLA-computed expected close date |
| `{{ticket_url}}` | Full URL to the ticket detail page |
| `{{response_body}}` | Staff's response text (for notification wrappers) |

---

### F13 Process: Create Template

1. Admin submits `POST /api/templates` with `name`, `subject` (email subject), `body` (email body with optional `{{variable}}` placeholders).
2. System validates template variable syntax (warns on unknown variable names but does not reject).
3. System saves template record.
4. System returns created template with HTTP 201.

### F13 Process: Use Template in Response

1. Staff opens the response compose form on a ticket detail page.
2. Staff selects a template from the dropdown list.
3. SPA calls `GET /api/templates/{id}` and populates the response form with the template body.
4. Staff edits the pre-filled body as needed, then submits.
5. Final response text (post-edit) is sent — template is only a starting point.

### F13 Process: Variable Substitution (System Use)

1. Notification system (F08) constructs a notification with a template slug (e.g., `ticket_created`).
2. System loads the template by slug.
3. System replaces all `{{variable}}` tokens with values from the current ticket context.
4. Unknown/missing variables are replaced with an empty string.
5. Rendered subject + body are sent via SMTP.

---

### F13 Inputs

**Create/Edit Template:**
- `name` (string, required, max 255): Display name for the template
- `subject` (string, optional, max 255): Email subject line (may contain variables)
- `body` (string, required, max 10000): Email body text (plain text or HTML; may contain variables)
- `slug` (string, optional, max 50): Machine-readable identifier (for system templates only; admin cannot set)
- `active` (boolean, optional, default true)

---

### F13 Outputs

**Template object:**
```json
{
  "id": 3,
  "name": "Acknowledgement — Will Investigate",
  "subject": "Update on your service request #{{ticket_id}}",
  "body": "Dear {{reporter_name}},\n\nThank you for reporting {{title}}. Our team will investigate within {{expected_close_date}}.\n\nRegards,\n{{department}}",
  "slug": null,
  "active": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

### F13 Validation

- `name` must be non-empty, max 255 chars
- `name` must be unique across templates (case-insensitive)
- `body` must be non-empty
- Template variables in the format `{{word}}` are detected and warned if unknown (not rejected)
- `slug` is read-only for system templates; user-created templates have null slug
- `active = false` hides the template from the staff UI select list but does not affect system templates

---

### F13 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate template name | 422 | DUPLICATE_NAME | "A template with this name already exists" |
| Template not found | 404 | NOT_FOUND | "Template not found" |
| Delete system template | 422 | SYSTEM_TEMPLATE | "System templates cannot be deleted" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required to manage templates" |

---

### F13 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | staff/admin | List all active templates |
| POST | `/api/templates` | admin | Create template |
| GET | `/api/templates/{id}` | staff/admin | Get template detail |
| PUT | `/api/templates/{id}` | admin | Update template |
| DELETE | `/api/templates/{id}` | admin | Delete template (non-system only) |

---

### F13 Schema Surface (this feature)

Table: `templates` (new table if not present in legacy as named entity; legacy may use inline strings). See `Y0b-schema-supporting.md` §templates.

Key columns: `id`, `name`, `subject`, `body`, `slug` (nullable, unique), `active`, `createdAt`, `updatedAt`
---

## F14: API Client Management

**Description:** Third-party Open311 clients (mobile apps, city portals, integrations) are identified by API keys. Administrators manage these client records, associating each key with a client name and contact information for accountability, audit trail attribution, and future rate-limiting. An API key is passed as a query parameter in Open311 requests.

**Terminology:**
- **API Client:** A registered third-party system authorized to submit Open311 requests. Maps to `clients` table.
- **API Key:** A cryptographically random string (UUID v4 or 32-char hex) that identifies a client. Passed as `api_key` in Open311 requests.
- **Revocation:** Deactivating a client so its API key is no longer accepted.

**Sub-features:**
- Create API client record (name, contact email, auto-generated API key)
- List all registered API clients
- View single client detail
- Revoke (deactivate) a client
- Regenerate API key for an existing client
- Validate API key on Open311 requests
- Log client identity in ticket audit trail for Open311-submitted tickets

---

### F14 Process: Create API Client

1. Admin submits `POST /api/clients` with `name` and `contactEmail`.
2. System generates a cryptographically random API key (UUID v4 format).
3. System creates `clients` record with `active = true`.
4. System returns the full client record **including the plain-text API key** (only shown once; not retrievable again).
5. Admin copies the key and distributes to the third-party client owner.

### F14 Process: Validate API Key (Open311 Request)

1. Open311 endpoint receives `api_key` parameter.
2. System looks up `clients` record by `apiKey` value where `active = true`.
3. If found: attach `clientId` to the request context; ticket creation sets `actorClientId`.
4. If not found or `active = false`: if the category permits anonymous posting, proceed without client attribution; otherwise, reject with HTTP 400.
5. If `api_key` not provided: treat as anonymous (no client record attached).

### F14 Process: Regenerate API Key

1. Admin requests `POST /api/clients/{id}/regenerate-key`.
2. System generates a new API key.
3. System updates `clients.apiKey` with the new key.
4. System returns the new key in plain text (only shown once).
5. The old key is immediately invalidated.

---

### F14 Inputs

**Create/Edit Client:**
- `name` (string, required, max 255): Human-readable client name
- `contactEmail` (string, required): Contact email for the client owner
- `notes` (string, optional, max 1000): Admin notes

**API key in Open311 request:**
- `api_key` (string, optional): Passed as query param or form field

---

### F14 Outputs

**Client object (on create / regenerate — includes key):**
```json
{
  "id": 7,
  "name": "City Mobile App",
  "contactEmail": "dev@cityapp.example.com",
  "apiKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "active": true,
  "createdAt": "2026-01-10T08:00:00Z"
}
```

**Client object (on list/get — key NOT shown):**
```json
{
  "id": 7,
  "name": "City Mobile App",
  "contactEmail": "dev@cityapp.example.com",
  "apiKeyHint": "f47ac10b…",
  "active": true,
  "createdAt": "2026-01-10T08:00:00Z"
}
```

---

### F14 Validation

- `name` must be non-empty, max 255 chars
- `contactEmail` must be valid RFC 5322 email format
- `name` must be unique across clients (case-insensitive)
- API key is auto-generated — not provided by the caller
- Once created, the plain-text API key is only returned in the create and regenerate responses; subsequent GET requests return only a hint (first 8 chars + "…")

---

### F14 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate client name | 422 | DUPLICATE_NAME | "A client with this name already exists" |
| Invalid contact email | 422 | INVALID_EMAIL | "Contact email is not valid" |
| Client not found | 404 | NOT_FOUND | "API client not found" |
| Revoke already-inactive client | 409 | ALREADY_INACTIVE | "Client is already inactive" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required to manage API clients" |

---

### F14 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clients` | admin | List all API clients |
| POST | `/api/clients` | admin | Create API client |
| GET | `/api/clients/{id}` | admin | Get client detail (key hint only) |
| PUT | `/api/clients/{id}` | admin | Update name/contact/notes |
| DELETE | `/api/clients/{id}` | admin | Revoke (deactivate) client |
| POST | `/api/clients/{id}/regenerate-key` | admin | Regenerate API key |

---

### F14 Schema Surface (this feature)

Table: `clients`. See `Y0b-schema-supporting.md` §clients.

Key columns: `id`, `name`, `contactEmail`, `apiKey` (hashed or plain — recommend bcrypt hash + hint), `notes`, `active`, `createdAt`, `updatedAt`

> **Security note:** Consider storing `bcrypt(apiKey)` and a plain-text `apiKeyHint` (first 8 chars) rather than the plain key. On validation, hash the provided key and compare.
---

## F15: Modern React/Next.js SPA Frontend

**Description:** The primary new deliverable of this modernization. The legacy PHP template rendering is entirely replaced by a React 18+ / Next.js 15+ SPA with TypeScript. The SPA consumes the new RESTful JSON API (F16) and preserves the Open311 endpoint (F1) to deliver a mobile-responsive, WCAG 2.1 AA-accessible interface for all staff and citizen-facing workflows. No PHP template is served to end users after migration.

**Terminology:**
- **SPA:** Single-Page Application — a web application where navigation occurs client-side without full-page reloads.
- **SSR:** Server-Side Rendering — Next.js renders initial HTML on the server for performance and SEO.
- **API Route:** A Next.js server-side handler proxying requests to the backend API (used for auth flows, CSRF protection).
- **OpenAPI TypeScript Client:** Auto-generated TypeScript types and fetch wrappers derived from the OpenAPI 3.1 spec; ensures type-safe API calls.
- **axe-core:** Automated accessibility testing library integrated into the CI pipeline.
- **Radix UI / shadcn/ui:** The component library providing accessible, unstyled primitives (dialogs, dropdowns, forms).

**Sub-features:**
- Staff ticket management UI (list, search, filter, detail, create, edit, assign, close, reopen, delete)
- Public/citizen submission portal and request tracking
- Map view for geospatial ticket visualization (integrated with F05)
- Reporting and metrics dashboards (F09)
- Admin configuration screens: departments, categories, people, templates, API clients, substatuses
- Authentication flow: OIDC login, logout, session management (F11)
- Mobile-responsive layouts (375px–1920px)
- WCAG 2.1 AA accessibility on all pages
- TypeScript strict mode (no `any`, no skipped null checks)
- Client-side form validation + server-side error surfacing
- OpenAPI-generated TypeScript client types

---

### F15 Page Inventory

| Route | Auth | Description |
|-------|------|-------------|
| `/` | None | Public homepage / submission portal |
| `/submit` | None (category-permitting) | Citizen ticket submission form |
| `/track/{id}` | None | Public ticket status tracking |
| `/login` | None | OIDC login initiation |
| `/dashboard` | staff | Staff ticket queue/dashboard |
| `/tickets` | staff | Ticket list + search + filter |
| `/tickets/new` | staff | Staff ticket creation form |
| `/tickets/{id}` | staff/public (own) | Ticket detail view |
| `/tickets/{id}/edit` | staff | Edit ticket fields |
| `/map` | staff | Map view of ticket locations |
| `/reports` | staff | Reporting dashboard |
| `/reports/{type}` | staff | Specific report view |
| `/admin/departments` | admin | Department management |
| `/admin/categories` | admin | Category management |
| `/admin/people` | admin | People management |
| `/admin/templates` | admin | Response templates |
| `/admin/clients` | admin | API client management |
| `/admin/substatuses` | admin | Substatus management |
| `/api/docs` | staff | OpenAPI Swagger UI |

---

### F15 Process: Ticket Submission (Citizen)

1. Citizen navigates to `/submit`.
2. SPA loads active categories with `postingPermission = 'anonymous' | 'public'`.
3. Citizen fills in category, description, location (map picker or address field), and optional contact info.
4. SPA validates client-side: required fields, email format, location present.
5. SPA submits `POST /api/tickets` (or `POST /open311/requests` for Open311 path).
6. On success: SPA displays confirmation with ticket ID and tracking URL.
7. On error: SPA displays field-level error messages from API 422 response.

### F15 Process: Staff Ticket Detail

1. Staff navigates to `/tickets/{id}`.
2. SPA calls `GET /api/tickets/{id}` and `GET /api/tickets/{id}/history`.
3. SPA renders: ticket fields, current status/substatus, assignee, SLA indicator, action history timeline, attachments.
4. Staff action buttons rendered per role and ticket state: Assign, Close, Reopen, Post Response, Add Comment, Merge, Delete.
5. All mutations dispatch API calls and update local state on success.

---

### F15 Inputs

- User interactions: form inputs, button clicks, map selections
- API responses: JSON from the RESTful backend (typed via OpenAPI-generated client)
- Environment: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_MAP_TILE_URL`, `OIDC_CLIENT_ID` (server-side)

---

### F15 Outputs

- Server-rendered HTML pages (Next.js SSR/SSG for public routes)
- Client-navigated SPA for authenticated routes
- HTTP 302 redirects for auth flows (handled via Next.js API routes)

---

### F15 Validation (Frontend)

- All required form fields validated before API submission
- Email fields validated with RFC 5322 pattern
- Lat/lng coordinate ranges validated in map picker
- Server validation errors (HTTP 422) mapped to field-level error UI
- File upload size and type validated client-side before upload (same limits as F07)
- CSRF protection via SameSite cookie + Next.js API route token for state-mutating requests

---

### F15 Non-Functional Requirements

| Requirement | Specification |
|-------------|--------------|
| Accessibility | WCAG 2.1 AA — axe-core automated tests pass with 0 critical violations |
| Responsiveness | Fully functional at 375px (mobile) through 1920px (desktop) |
| Performance | Lighthouse score ≥ 85 on ticket list/search pages (mobile profile) |
| TypeScript | Strict mode; `noImplicitAny: true`; `strictNullChecks: true` |
| Build | Next.js production build with asset hashing; HMR in development |
| Testing | Jest unit tests for utilities; Playwright e2e for all 10 critical user journeys |
| i18n | All user-facing strings use next-intl or equivalent gettext-compatible i18n |

---

### F15 Error States

| Scenario | UI Behavior |
|----------|------------|
| API 401 | Redirect to `/login`; preserve intended destination |
| API 403 | Show "Access denied" inline message |
| API 404 | Render 404 page |
| API 422 | Map field errors to form inputs; display inline |
| API 5xx | Display "Something went wrong" with retry button |
| Network error | Display offline/retry message |

---

### F15 API Surface (this feature)

The SPA itself does not expose API endpoints. It consumes all endpoints defined in F16 (see `Y1a-api-tickets.md` and `Y1b-api-admin.md`). Next.js API routes at `/auth/*` handle OIDC flows (see F11).

---

### F15 Schema Surface (this feature)

No database schema. The SPA is purely a consumer of the API layer.
---

## F16: RESTful JSON API Backend

**Description:** The second primary new deliverable. All data retrieval and mutation operations currently performed by PHP controllers rendering templates are refactored into clean, documented RESTful JSON API endpoints. The Open311 endpoint surface (F1) is preserved verbatim at `/open311/`. The new internal API follows REST conventions, is described by an OpenAPI 3.1 spec, is consumed by the SPA (F15) and authorized API clients, and enforces authentication (F11) and role-based authorization (F10) on every protected endpoint.

**Terminology:**
- **JSON Envelope:** Standard response wrapper `{ "data": any, "meta": { … }, "errors": [] }` used on all non-Open311 endpoints.
- **Repository Pattern:** Database access abstraction; controllers call repository interfaces; repositories execute SQL via PDO or Doctrine DBAL.
- **OpenAPI 3.1 Spec:** The machine-readable API description served at `/api/docs` and used to generate TypeScript client types.
- **Content Negotiation:** `Accept` header or `?format=` param used for CSV/print variants.
- **Middleware Stack:** Auth middleware, RBAC middleware, validation middleware, error handler — applied globally to all `/api/` routes.

**Sub-features:**
- RESTful endpoints for all ticket operations (F00)
- RESTful endpoints for search/filter (F04) and reporting (F09)
- RESTful endpoints for all admin operations: departments, categories, people, templates, API clients, substatuses
- JWT session validation on every protected endpoint (F11)
- RBAC enforcement at controller layer (F10)
- Consistent JSON response envelope
- Correct HTTP status codes
- OpenAPI 3.1 spec served at `/api/docs`
- Field-level validation errors (HTTP 422)
- Repository pattern for all DB access
- CSV and print export via content negotiation
- Preserved Open311 at `/open311/` (not modified here)

---

### F16 Standard Response Shapes

**Success (single resource):**
```json
{
  "data": { "id": 101, "title": "Pothole on Main St", "…": "…" },
  "meta": {},
  "errors": []
}
```

**Success (collection):**
```json
{
  "data": [ { "id": 101, "…": "…" }, { "id": 102, "…": "…" } ],
  "meta": {
    "page": 1,
    "perPage": 25,
    "total": 342,
    "pages": 14
  },
  "errors": []
}
```

**Validation error (HTTP 422):**
```json
{
  "data": null,
  "meta": {},
  "errors": [
    { "field": "categoryId", "message": "Category not found or inactive" },
    { "field": "lat", "message": "Latitude must be between -90 and 90" }
  ]
}
```

**Not found (HTTP 404):**
```json
{
  "data": null,
  "meta": {},
  "errors": [{ "field": null, "message": "Ticket not found", "code": "NOT_FOUND" }]
}
```

---

### F16 HTTP Status Code Contract

| Status | Meaning |
|--------|---------|
| 200 OK | Successful read or update |
| 201 Created | Successful resource creation |
| 204 No Content | Successful delete (no response body) |
| 400 Bad Request | Malformed request (e.g., invalid JSON body) |
| 401 Unauthorized | Missing or invalid authentication |
| 403 Forbidden | Authenticated but insufficient role/permission |
| 404 Not Found | Resource does not exist |
| 405 Method Not Allowed | HTTP verb not supported on this route |
| 409 Conflict | State conflict (e.g., close already-closed ticket) |
| 413 Payload Too Large | File upload or export exceeds size limit |
| 422 Unprocessable Entity | Validation failure (with field-level errors) |
| 500 Internal Server Error | Unhandled server error (logged to Graylog) |
| 503 Service Unavailable | Solr or external service unavailable |

---

### F16 Middleware Stack (applied to all `/api/` routes)

1. **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options added to every response.
2. **CORS:** Configurable allowed origins; credentials allowed for same-origin SPA.
3. **Auth Middleware:** Extracts and validates JWT from cookie or `Authorization` header (see F11). Sets caller context.
4. **Rate Limiting:** Optional per-IP or per-client rate limiting (configurable; off by default).
5. **Request Validation:** Body and query parameter validation before reaching controller.
6. **Error Handler:** Catches unhandled exceptions; returns 500 envelope; forwards structured error to Graylog.

---

### F16 Repository Pattern

- Each entity has a corresponding repository class: `TicketRepository`, `PersonRepository`, `CategoryRepository`, etc.
- Repositories expose typed methods: `findById(int): ?Ticket`, `findAll(array $filters): TicketCollection`, `save(Ticket): Ticket`, `delete(int): void`.
- No raw SQL in controllers — only repository method calls.
- Repository interfaces enable easy mocking in unit tests.
- PDO (or Doctrine DBAL) used as the underlying database layer.

---

### F16 OpenAPI Spec

- Served at `GET /api/docs` as a Swagger UI HTML page.
- Raw OpenAPI 3.1 JSON/YAML served at `GET /api/openapi.json` and `GET /api/openapi.yaml`.
- All non-Open311 API endpoints documented: paths, parameters, request bodies, response schemas.
- TypeScript client types auto-generated from spec during frontend build (`openapi-typescript` tool).

---

### F16 Inputs

- HTTP request: method, path, headers (Authorization, Content-Type, Accept), query params, JSON body
- JWT session (cookie or header)

---

### F16 Outputs

- JSON response with envelope (all `/api/` routes)
- `text/csv` for export endpoints (content-negotiated)
- HTTP status codes per contract above
- OpenAPI 3.1 spec at `/api/openapi.json`

---

### F16 Validation

- All inputs validated server-side — frontend validation is UX only, not a security gate
- JSON body must be valid JSON; malformed JSON returns HTTP 400
- All `id` path parameters must be positive integers; invalid formats return HTTP 400
- Pagination: `page` ≥ 1; `perPage` 1–100 for lists, 1–5000 for exports
- String fields: length limits enforced per-field (see individual feature specs)
- Enum fields: values strictly validated against allowed sets
- Date fields: ISO 8601 format required

---

### F16 Error States

See `Y2-errors.md` for the cross-feature error catalog. Backend error handling rules:

| Scenario | HTTP | Behavior |
|----------|------|---------|
| Unhandled exception | 500 | Log full stack trace to Graylog; return generic `INTERNAL_ERROR` envelope |
| MySQL connection failure | 503 | Log to Graylog; return `DATABASE_UNAVAILABLE` |
| Solr connection failure | 503 | Log to Graylog; return `SEARCH_UNAVAILABLE` |
| SMTP failure (notifications) | — | Non-fatal; log to Graylog; do not fail the ticket operation |

---

### F16 API Surface (this feature)

All endpoints documented in `Y1a-api-tickets.md` and `Y1b-api-admin.md`. Summary:

- Tickets: CRUD, assign, close, reopen, merge, responses, comments, history, media
- Search: ticket list with filters, clusters
- Reports: 8 report types + metrics endpoint
- Admin: departments, categories, category-groups, people, contact-methods, templates, clients, substatuses
- Auth: login, callback, logout, me
- Docs: openapi.json, openapi.yaml, /api/docs

---

### F16 Schema Surface (this feature)

All tables — full DDL in `Y0a-schema-core.md` and `Y0b-schema-supporting.md`. Repository pattern abstracts all direct DB access.
---

## F17: Substatus Management

**Description:** Tickets have a primary status of `open` or `closed`, but municipalities often need finer-grained state tracking (e.g., "Pending Parts", "Scheduled", "Referred to Third Party"). Substatuses allow administrators to define additional state labels that can be applied within either primary status, with one substatus configurable as the default for each primary state.

**Terminology:**
- **Substatus:** A named label providing more detail about a ticket's state within its primary status. Maps to `substatus` table.
- **Primary Status Association:** Each substatus is associated with either `open` or `closed` primary status.
- **Default Substatus:** The substatus automatically applied when a ticket transitions to open or closed state.

**Sub-features:**
- Create, edit, and deactivate substatus records
- Associate each substatus with `open` or `closed` primary status
- Configure a default substatus for new open tickets
- Configure a default substatus for newly closed tickets
- Assign/change substatus on a ticket at any point
- Filter ticket search by substatus (see F04)
- Display substatus alongside primary status in ticket list and detail views
- Record substatus changes in ticket audit trail (see F06)

---

### F17 Process: Create Substatus

1. Admin submits `POST /api/substatuses` with `label` and `primaryStatus`.
2. System validates `label` uniqueness within the same `primaryStatus`.
3. System saves with `active = true`.
4. System returns created substatus with HTTP 201.

### F17 Process: Set Default Substatus

1. Admin submits `PUT /api/substatuses/{id}` with `isDefault = true`.
2. System clears `isDefault` from any other substatus of the same `primaryStatus`.
3. System sets this substatus as default.
4. Going forward, all newly created `open` (or `closed`) tickets auto-receive this substatus.

### F17 Process: Assign Substatus to Ticket

1. Staff submits `PATCH /api/tickets/{id}` with `substatusId`.
2. System validates substatus is active and matches the ticket's current `primaryStatus`.
3. System updates `tickets.substatusId`.
4. System creates an `actions` entry with `type = 'substatus'`, `payload.previousSubstatusId`, `payload.newSubstatusId`.
5. System returns updated ticket with HTTP 200.

---

### F17 Inputs

**Create/Edit Substatus:**
- `label` (string, required, max 100): Display label (e.g., "Pending Parts")
- `primaryStatus` (enum, required): `open` | `closed`
- `isDefault` (boolean, optional, default false): Set as default for this primary status
- `active` (boolean, optional, default true)
- `sortOrder` (integer, optional): Display order in UI dropdowns

**Assign to Ticket:**
- `substatusId` (integer, required): ID of the substatus to apply (or null to clear)

---

### F17 Outputs

**Substatus object:**
```json
{
  "id": 4,
  "label": "Pending Parts",
  "primaryStatus": "open",
  "isDefault": false,
  "active": true,
  "sortOrder": 2,
  "createdAt": "2026-01-05T10:00:00Z"
}
```

**Ticket object** includes `substatus: { id, label, primaryStatus }`.

---

### F17 Validation

- `label` must be non-empty, max 100 chars
- `label` must be unique within the same `primaryStatus` (case-insensitive)
- `primaryStatus` must be `open` or `closed`
- Only one substatus per `primaryStatus` may have `isDefault = true`
- When assigning to a ticket: substatus `primaryStatus` must match ticket's current `status`
- Deactivating a substatus does not change tickets currently assigned that substatus; they retain it until explicitly changed

---

### F17 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate label for same primary status | 422 | DUPLICATE_LABEL | "A substatus with this label already exists for this status" |
| Substatus/ticket primary status mismatch | 422 | STATUS_MISMATCH | "Substatus does not match the ticket's current primary status" |
| Substatus not found | 404 | NOT_FOUND | "Substatus not found" |
| Caller not admin (for create/edit/delete) | 403 | FORBIDDEN | "Admin role required to manage substatuses" |

---

### F17 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/substatuses` | staff/admin | List all substatuses |
| POST | `/api/substatuses` | admin | Create substatus |
| GET | `/api/substatuses/{id}` | staff/admin | Get substatus detail |
| PUT | `/api/substatuses/{id}` | admin | Update substatus |
| DELETE | `/api/substatuses/{id}` | admin | Deactivate substatus |

Substatus assignment to ticket: `PATCH /api/tickets/{id}` with `{ "substatusId": n }` — see `Y1a-api-tickets.md`.

---

### F17 Schema Surface (this feature)

Table: `substatus`. See `Y0b-schema-supporting.md` §substatus.

Key columns: `id`, `label`, `primaryStatus` (enum open/closed), `isDefault`, `active`, `sortOrder`, `createdAt`, `updatedAt`

`tickets.substatusId` (FK → substatus, nullable) — references the currently applied substatus.
---

## F18: Ticket Merging

**Description:** When constituents report the same issue multiple times (e.g., the same pothole reported by five different residents), staff can merge the duplicate source tickets into a single canonical target ticket. The merged source tickets are closed and linked to the canonical ticket. Reporters of merged tickets are notified with the canonical ticket ID.

**Terminology:**
- **Source Ticket:** The duplicate ticket being merged away. It will be closed and linked to the target.
- **Target Ticket:** The canonical ticket that represents the issue. It remains open and receives the merge reference.
- **Merge Action:** An `actions` entry of type `merged` on both source and target tickets recording the merge event.

**Sub-features:**
- Search for a target ticket to merge the current source ticket into
- Preview both tickets before confirming the merge
- Execute the merge: close source, link to target, record audit trail entries
- Notify the reporter of the source (merged) ticket with the target ticket ID
- Display merged references in the target ticket's history
- Flag merged/closed source tickets in search results

---

### F18 Process: Execute Merge

1. Staff is viewing the source ticket and selects "Merge into another ticket".
2. Staff searches for and selects a target ticket (any open ticket, different from source).
3. System displays a merge preview: both ticket summaries side-by-side.
4. Staff confirms the merge.
5. System validates: source ≠ target; source not already merged; target is not merged/closed.
6. System sets `source.status = 'closed'`, `source.mergedIntoTicketId = target.id`, `source.datetimeClosed = NOW()`.
7. System creates an `actions` entry on the source ticket: `type = 'merged'`, `payload.mergedIntoTicketId = target.id`.
8. System creates an `actions` entry on the target ticket: `type = 'merged'`, `payload.mergedFromTicketId = source.id`.
9. System sends email to the source ticket's reporter (if email available) with the target ticket's URL (see F08).
10. System updates Solr index for both tickets.
11. System returns the updated source ticket with HTTP 200.

---

### F18 Inputs

**Merge request:**
- `targetTicketId` (integer, required): The ID of the canonical ticket to merge into

---

### F18 Outputs

- Source ticket updated: `status = 'closed'`, `mergedIntoTicketId` set
- Two `actions` records created (one on each ticket)
- Email notification sent to source reporter
- Both tickets updated in Solr

**Merge response:**
```json
{
  "data": {
    "sourceTicketId": 98,
    "targetTicketId": 101,
    "status": "merged",
    "mergedAt": "2026-06-23T15:00:00Z"
  },
  "meta": {},
  "errors": []
}
```

---

### F18 Validation

- `targetTicketId` must be different from the source ticket ID
- Source ticket must not already be merged (i.e., `mergedIntoTicketId` is null)
- Target ticket must be `status = 'open'` and not itself a merged ticket
- Caller must have `staff` or `admin` role
- Both tickets must exist and not be deleted

---

### F18 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Source = target | 422 | SELF_MERGE | "Cannot merge a ticket into itself" |
| Source already merged | 409 | ALREADY_MERGED | "This ticket has already been merged" |
| Target is closed | 409 | TARGET_CLOSED | "Cannot merge into a closed ticket" |
| Target is itself merged | 409 | TARGET_MERGED | "Cannot merge into a ticket that has already been merged" |
| Target ticket not found | 404 | NOT_FOUND | "Target ticket not found" |
| Caller not staff | 403 | FORBIDDEN | "Staff or admin role required to merge tickets" |

---

### F18 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tickets/{id}/merge` | staff/admin | Merge source ticket into target |
| GET | `/api/tickets/{id}/merge-candidates` | staff/admin | Search for valid merge target tickets |

---

### F18 Schema Surface (this feature)

Adds one column to `tickets`: `mergedIntoTicketId` (FK → tickets, nullable — self-referential).

Uses `actions` table for merge audit trail entries (type = `merged`). See `Y0a-schema-core.md` §tickets.
---

## Y0a: Database Schema — Core Tables

Full DDL for the core entities. All tables use InnoDB engine, `utf8mb4` charset. All `id` columns are `INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY` unless noted. Timestamps default to UTC.

---

### Table: `tickets`

```sql
CREATE TABLE tickets (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  status              ENUM('open','closed') NOT NULL DEFAULT 'open',
  datetimeOpened      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  datetimeClosed      DATETIME NULL,
  datetimeUpdated     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt           DATETIME NULL,

  -- Routing
  categoryId          INT UNSIGNED NOT NULL,
  departmentId        INT UNSIGNED NOT NULL,

  -- People references
  personId            INT UNSIGNED NULL COMMENT 'Assignee (staff)',
  reporterPersonId    INT UNSIGNED NULL COMMENT 'Reporter (may be null for anonymous)',

  -- Reporter fields (for anonymous/non-registered reporters)
  reporterName        VARCHAR(255) NULL,
  reporterEmail       VARCHAR(255) NULL,
  reporterPhone       VARCHAR(50) NULL,

  -- Location
  address             VARCHAR(500) NULL,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,

  -- State
  substatusId         INT UNSIGNED NULL,
  mergedIntoTicketId  INT UNSIGNED NULL COMMENT 'FK to tickets.id (self-referential)',

  -- Open311 client attribution
  apiClientId         INT UNSIGNED NULL COMMENT 'FK to clients.id',

  -- Custom fields (category-specific, JSON)
  customFields        JSON NULL,

  PRIMARY KEY (id),
  INDEX idx_status (status),
  INDEX idx_categoryId (categoryId),
  INDEX idx_departmentId (departmentId),
  INDEX idx_personId (personId),
  INDEX idx_datetimeOpened (datetimeOpened),
  INDEX idx_datetimeClosed (datetimeClosed),
  INDEX idx_deletedAt (deletedAt),

  CONSTRAINT fk_tickets_category    FOREIGN KEY (categoryId)         REFERENCES categories(id),
  CONSTRAINT fk_tickets_department  FOREIGN KEY (departmentId)       REFERENCES departments(id),
  CONSTRAINT fk_tickets_assignee    FOREIGN KEY (personId)           REFERENCES people(id),
  CONSTRAINT fk_tickets_reporter    FOREIGN KEY (reporterPersonId)   REFERENCES people(id),
  CONSTRAINT fk_tickets_substatus   FOREIGN KEY (substatusId)        REFERENCES substatus(id),
  CONSTRAINT fk_tickets_merged      FOREIGN KEY (mergedIntoTicketId) REFERENCES tickets(id),
  CONSTRAINT fk_tickets_client      FOREIGN KEY (apiClientId)        REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `people`

```sql
CREATE TABLE people (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  firstName     VARCHAR(100) NOT NULL,
  lastName      VARCHAR(100) NOT NULL,
  role          ENUM('admin','staff','public') NOT NULL DEFAULT 'public',
  departmentId  INT UNSIGNED NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  oidcSubject   VARCHAR(255) NULL UNIQUE COMMENT 'OIDC sub claim',
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_role (role),
  INDEX idx_active (active),
  INDEX idx_departmentId (departmentId),

  CONSTRAINT fk_people_department FOREIGN KEY (departmentId) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `contactMethods`

```sql
CREATE TABLE contactMethods (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  type        ENUM('email','phone','address') NOT NULL,
  value       VARCHAR(500) NOT NULL,
  phoneType   ENUM('mobile','office','home') NULL,
  isPrimary   TINYINT(1) NOT NULL DEFAULT 0,
  label       VARCHAR(100) NULL,

  PRIMARY KEY (id),
  INDEX idx_personId (personId),
  INDEX idx_type_value (type, value(191)),

  CONSTRAINT fk_contact_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `departments`

```sql
CREATE TABLE departments (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                VARCHAR(255) NOT NULL,
  defaultAssigneeId   INT UNSIGNED NULL,
  active              TINYINT(1) NOT NULL DEFAULT 1,
  createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_dept_name (name),
  INDEX idx_active (active),

  CONSTRAINT fk_dept_assignee FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `categories`

```sql
CREATE TABLE categories (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                VARCHAR(255) NOT NULL,
  departmentId        INT UNSIGNED NOT NULL,
  groupId             INT UNSIGNED NULL,
  slaDays             INT UNSIGNED NULL COMMENT 'NULL = no SLA',
  displayPermission   ENUM('public','staff','anonymous') NOT NULL DEFAULT 'public',
  postingPermission   ENUM('staff','public','anonymous') NOT NULL DEFAULT 'public',
  defaultAssigneeId   INT UNSIGNED NULL,
  autoCloseDays       INT UNSIGNED NULL DEFAULT 0 COMMENT '0 = disabled',
  active              TINYINT(1) NOT NULL DEFAULT 1,
  fields              JSON NULL COMMENT 'Array of custom field definition objects',
  createdAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_name (name),
  INDEX idx_departmentId (departmentId),
  INDEX idx_active (active),

  CONSTRAINT fk_cat_department FOREIGN KEY (departmentId) REFERENCES departments(id),
  CONSTRAINT fk_cat_group      FOREIGN KEY (groupId)      REFERENCES categoryGroups(id),
  CONSTRAINT fk_cat_assignee   FOREIGN KEY (defaultAssigneeId) REFERENCES people(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `categoryGroups`

```sql
CREATE TABLE categoryGroups (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  sortOrder   INT UNSIGNED NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  UNIQUE KEY uq_group_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `actions`

```sql
CREATE TABLE actions (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NOT NULL,
  type            ENUM('open','assignment','closed','reopen','response','comment',
                       'upload','deleted','merged','substatus','notification_sent') NOT NULL,
  visibility      ENUM('external','internal') NOT NULL DEFAULT 'internal',
  actorPersonId   INT UNSIGNED NULL,
  actorClientId   INT UNSIGNED NULL,
  datetimeCreated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payload         JSON NULL,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_type (type),
  INDEX idx_datetimeCreated (datetimeCreated),

  CONSTRAINT fk_action_ticket FOREIGN KEY (ticketId)      REFERENCES tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_person FOREIGN KEY (actorPersonId) REFERENCES people(id),
  CONSTRAINT fk_action_client FOREIGN KEY (actorClientId) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> **Immutability note:** No `UPDATE` or `DELETE` statements should ever be issued against `actions`. Enforce via application layer and consider a `BEFORE UPDATE` / `BEFORE DELETE` trigger that raises an error.

---

### Table: `media`

```sql
CREATE TABLE media (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NOT NULL,
  filename        VARCHAR(255) NOT NULL COMMENT 'Stored filename on disk',
  originalName    VARCHAR(255) NULL COMMENT 'Original filename from uploader',
  mimeType        VARCHAR(100) NOT NULL,
  size            INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'File size in bytes',
  path            VARCHAR(500) NOT NULL COMMENT 'Relative path under upload root',
  thumbnailPath   VARCHAR(500) NULL,
  sourceUrl       VARCHAR(2048) NULL COMMENT 'Open311 media_url reference',
  label           VARCHAR(255) NULL,
  deletedAt       DATETIME NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_deletedAt (deletedAt),

  CONSTRAINT fk_media_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `ticket_geodata`

```sql
CREATE TABLE ticket_geodata (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId            INT UNSIGNED NOT NULL UNIQUE,
  lat                 DECIMAL(10,7) NULL,
  lng                 DECIMAL(10,7) NULL,
  address             VARCHAR(500) NULL,
  addressNormalized   VARCHAR(500) NULL COMMENT 'Normalized form from geocoder',
  geoStatus           ENUM('located','pending','failed') NOT NULL DEFAULT 'pending',
  updatedAt           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_lat_lng (lat, lng),

  CONSTRAINT fk_geodata_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

*End of Y0a — core schema chunk. Continue to `Y0b-schema-supporting.md` for substatus, templates, bookmarks, clients, sessions, notification_log, geoclusters.*
---

## Y0b: Database Schema — Supporting Tables

Continuation of schema DDL. All tables use InnoDB engine, `utf8mb4` charset.

---

### Table: `substatus`

```sql
CREATE TABLE substatus (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  label         VARCHAR(100) NOT NULL,
  primaryStatus ENUM('open','closed') NOT NULL,
  isDefault     TINYINT(1) NOT NULL DEFAULT 0,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  sortOrder     INT UNSIGNED NOT NULL DEFAULT 0,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_substatus_label_status (label, primaryStatus),
  INDEX idx_primaryStatus (primaryStatus),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `clients`

```sql
CREATE TABLE clients (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(255) NOT NULL,
  contactEmail  VARCHAR(255) NOT NULL,
  apiKeyHash    VARCHAR(255) NOT NULL COMMENT 'bcrypt hash of the API key',
  apiKeyHint    VARCHAR(20) NOT NULL COMMENT 'First 8 chars of the key for display',
  notes         TEXT NULL,
  active        TINYINT(1) NOT NULL DEFAULT 1,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_client_name (name),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> **Note:** The plain-text API key is generated on create/regenerate and returned once. Only the bcrypt hash is stored. On validation, hash the provided key and compare with `apiKeyHash`.

---

### Table: `bookmarks`

```sql
CREATE TABLE bookmarks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,
  filterState JSON NOT NULL COMMENT 'Serialized search filter state',
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_bookmark_person_name (personId, name),
  INDEX idx_personId (personId),

  CONSTRAINT fk_bookmark_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `templates`

```sql
CREATE TABLE templates (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  subject     VARCHAR(255) NULL,
  body        TEXT NOT NULL,
  slug        VARCHAR(50) NULL UNIQUE COMMENT 'System templates only; null for user-created',
  active      TINYINT(1) NOT NULL DEFAULT 1,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_template_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**System template slugs (seed data):**

| Slug | Purpose |
|------|---------|
| `ticket_created` | Confirmation to reporter on ticket creation |
| `ticket_assigned` | Notification to new assignee |
| `ticket_response` | Notification to reporter when staff posts response |
| `ticket_closed` | Notification to reporter on ticket closure |
| `ticket_merged` | Notification to reporter of merged ticket |
| `digest_daily` | Daily digest email for department staff |

---

### Table: `notification_log`

```sql
CREATE TABLE notification_log (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticketId        INT UNSIGNED NULL,
  templateSlug    VARCHAR(50) NOT NULL,
  recipientEmail  VARCHAR(255) NOT NULL,
  sentAt          DATETIME NULL,
  status          ENUM('sent','failed','skipped') NOT NULL DEFAULT 'sent',
  attemptCount    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  errorMessage    TEXT NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_recipientEmail (recipientEmail(191)),
  INDEX idx_sentAt (sentAt),

  CONSTRAINT fk_notif_ticket FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Table: `geoclusters`

```sql
CREATE TABLE geoclusters (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  zoom        TINYINT UNSIGNED NOT NULL COMMENT 'Map zoom level 1-20',
  count       INT UNSIGNED NOT NULL DEFAULT 0,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_lat_lng_zoom (lat, lng, zoom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> **Note:** `geoclusters` is a pre-computed cache table populated by a Solr spatial clustering job. It is not source-of-truth data — it can be rebuilt from Solr. The API `/api/tickets/clusters` may query this table or call Solr directly depending on implementation.

---

### Table: `sessions` (optional — for server-side session invalidation)

```sql
CREATE TABLE sessions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  personId    INT UNSIGNED NOT NULL,
  jwtJti      VARCHAR(255) NOT NULL UNIQUE COMMENT 'JWT ID claim for revocation',
  expiresAt   DATETIME NOT NULL,
  revokedAt   DATETIME NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_personId (personId),
  INDEX idx_jwtJti (jwtJti),
  INDEX idx_expiresAt (expiresAt),

  CONSTRAINT fk_session_person FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### Schema Migration Notes

- All schema changes must be provided as versioned migration scripts (e.g., Phinx migrations).
- The `tickets.mergedIntoTicketId` column is a new addition to the existing schema.
- The `people.oidcSubject` column may already exist in some legacy deployments (check before adding).
- The `categories.fields` JSON column should default to `NULL`; existing rows will have `NULL` and are treated as having no custom fields.
- The `clients.apiKeyHash` replaces any plain-text `apiKey` column in the legacy `clients` table; migration should hash existing keys.
- `ticketHistory` table (legacy name for `actions`) — confirm the legacy table name and alias if needed.
- New tables (`sessions`, `notification_log`, `templates`) are additive — no existing data affected.

---

*End of Y0b — supporting schema chunk.*
---

## Y1a: REST API — Tickets, Search, Reporting, Geo

All endpoints are prefixed `/api/`. All responses use the JSON envelope `{ "data": …, "meta": …, "errors": [] }` unless noted. Authentication via `ureport_session` cookie or `Authorization: Bearer <token>`.

---

### §Tickets

#### POST /api/tickets
Create a new ticket.

**Auth:** Any caller (role and category permission checked).

**Request body:**
```json
{
  "title": "Pothole on Main St",
  "description": "Large pothole causing vehicle damage",
  "categoryId": 1,
  "lat": 43.1234,
  "lng": -79.5678,
  "address": "123 Main St, Anytown",
  "reporterName": "Jane Doe",
  "reporterEmail": "jane@example.com",
  "reporterPhone": "555-1234",
  "customFields": { "severity": "high" },
  "mediaUrls": []
}
```

**Response 201:**
```json
{
  "data": { "id": 101, "title": "Pothole on Main St", "status": "open", "…": "…" },
  "meta": {},
  "errors": []
}
```

---

#### GET /api/tickets
List/search tickets with filters.

**Auth:** Any caller (results filtered by role and category visibility).

**Query params:** `q`, `status`, `substatusId`, `categoryId`, `departmentId`, `assigneeId`, `reporterEmail`, `dateFrom`, `dateTo`, `lat`, `lng`, `radius`, `bbox`, `sort`, `page`, `perPage`, `export` — see F04.

**Response 200:**
```json
{
  "data": [ { ticket objects } ],
  "meta": { "total": 342, "page": 1, "perPage": 25, "pages": 14, "facets": { "…": {} } },
  "errors": []
}
```

**CSV Export:** Add `?export=csv` → `Content-Type: text/csv`, `Content-Disposition: attachment; filename="tickets.csv"`.

---

#### GET /api/tickets/{id}
Get single ticket detail.

**Auth:** Any (visibility-checked). **Response 200** with full ticket object including `substatus`, `category`, `department`, `assignee`, `reporter`, `sla`.

**Ticket object shape:**
```json
{
  "id": 101,
  "title": "Pothole on Main St",
  "description": "Large pothole…",
  "status": "open",
  "substatus": { "id": 4, "label": "Pending Parts", "primaryStatus": "open" },
  "category": { "id": 1, "name": "Pothole Repair" },
  "department": { "id": 3, "name": "Roads" },
  "assignee": { "id": 5, "name": "John Smith" },
  "reporter": { "name": "Jane Doe", "email": "jane@example.com" },
  "address": "123 Main St",
  "lat": 43.1234,
  "lng": -79.5678,
  "customFields": { "severity": "high" },
  "sla": { "slaDays": 5, "expectedCloseDate": "2026-06-28", "status": "on_time", "pctElapsed": 42 },
  "datetimeOpened": "2026-06-23T10:00:00Z",
  "datetimeClosed": null,
  "mergedIntoTicketId": null
}
```

---

#### PUT /api/tickets/{id}
Update ticket fields (title, description, categoryId, address, lat, lng, customFields, substatusId).

**Auth:** staff/admin. **Request body:** Partial update — only provided fields are updated. **Response 200.**

---

#### POST /api/tickets/{id}/assign
Assign ticket to department/staff.

**Auth:** staff/admin.

**Request body:**
```json
{ "assigneeId": 5, "departmentId": 3 }
```
**Response 200** with updated ticket.

---

#### POST /api/tickets/{id}/close
Close ticket with optional resolution response.

**Auth:** staff/admin.

**Request body:**
```json
{ "response": "We have repaired the pothole. Thank you for reporting." }
```
**Response 200** with updated ticket.

---

#### POST /api/tickets/{id}/reopen
Reopen closed ticket.

**Auth:** staff/admin.

**Request body:**
```json
{ "reason": "Repair was incomplete; pothole reappeared." }
```
**Response 200** with updated ticket.

---

#### DELETE /api/tickets/{id}
Soft-delete ticket. **Auth:** admin. **Response 204.**

---

#### POST /api/tickets/{id}/responses
Post external response (sent to reporter by email).

**Auth:** staff/admin.

**Request body:**
```json
{ "body": "We have scheduled a repair crew.", "templateId": 3 }
```
**Response 201** with created action object.

---

#### POST /api/tickets/{id}/comments
Post internal comment (not sent externally).

**Auth:** staff/admin.

**Request body:**
```json
{ "body": "Waiting on parts from supplier." }
```
**Response 201** with created action object.

---

#### POST /api/tickets/{id}/merge
Merge source ticket into target.

**Auth:** staff/admin.

**Request body:**
```json
{ "targetTicketId": 101 }
```
**Response 200** with merge result object (see F18).

---

#### GET /api/tickets/{id}/merge-candidates
Search for valid merge target tickets.

**Auth:** staff/admin. **Query:** `q` (search string). **Response 200** with filtered ticket list.

---

### §History

#### GET /api/tickets/{id}/history
Get chronological action history for a ticket.

**Auth:** Any (internal actions filtered for non-staff). **Query:** `type`, `visibility`, `page`, `perPage`. **Response 200** with paginated action list.

---

### §Media

#### GET /api/tickets/{id}/media
List attachments for a ticket. **Auth:** Any (visibility-checked). **Response 200.**

#### POST /api/tickets/{id}/media
Upload attachment (multipart/form-data). **Auth:** Any (role-checked). **Response 201** with media object.

#### DELETE /api/tickets/{id}/media/{mediaId}
Soft-delete attachment. **Auth:** staff/admin. **Response 204.**

---

### §Search & Geo

#### GET /api/tickets/clusters
Geo-cluster data for map view.

**Auth:** Any (role-filtered).

**Query:** `bbox`, `zoom`, plus standard search filters.

**Response 200:**
```json
{
  "data": [
    { "lat": 43.1200, "lng": -79.5600, "count": 12, "zoom": 13 }
  ],
  "meta": {},
  "errors": []
}
```

#### GET /api/geocode
Geocode an address string (utility for SPA map picker).

**Auth:** staff. **Query:** `address` (string). **Response 200:** `{ "data": { "lat": 43.12, "lng": -79.56, "addressNormalized": "123 Main St, Anytown, ON" } }`

---

### §Reporting

All report endpoints accept query params: `dateFrom`, `dateTo`, `categoryId`, `departmentId`, `assigneeId`, `format=csv`.

**Auth:** staff/admin for all reports; `GET /api/metrics/sla` is public.

| Endpoint | Description | Key response fields |
|----------|-------------|-------------------|
| `GET /api/reports/activity` | Ticket counts by period | `totalOpened`, `totalClosed`, `byDay[]` |
| `GET /api/reports/assignments` | Tickets per staff | `assigneeId`, `open`, `closed`, `avgDaysToClose` |
| `GET /api/reports/categories` | Volume + SLA per category | `categoryId`, `total`, `onTimePct`, `latePct` |
| `GET /api/reports/departments` | Volume per department | `departmentId`, `total`, `open`, `closed` |
| `GET /api/reports/staff-performance` | Per-staff response metrics | `avgResponseHours`, `closureRate` |
| `GET /api/reports/sla` | SLA on-time/late | `onTime`, `late`, `noSla`, `onTimePct` |
| `GET /api/reports/volume` | Daily/weekly/monthly trends | `period`, `opened`, `closed` |
| `GET /api/reports/open-age` | Tickets open past SLA | `ticketId`, `daysOpen`, `slaStatus` |
| `GET /api/metrics/sla` | Lightweight SLA % (cached 5min) | `categoryId`, `onTimePct` |

---

*End of Y1a — tickets/search/reporting API chunk. Continue to `Y1b-api-admin.md` for admin endpoints.*
---

## Y1b: REST API — Admin & Authentication Endpoints

All endpoints are prefixed `/api/` or `/auth/`. JSON envelope applies to all `/api/` routes.

---

### §Departments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/departments` | staff/admin | List departments (active by default; `?active=false` for all) |
| POST | `/api/departments` | admin | Create department |
| GET | `/api/departments/{id}` | staff/admin | Get department detail |
| PUT | `/api/departments/{id}` | admin | Update department |
| DELETE | `/api/departments/{id}` | admin | Deactivate department |

**Department request body (POST/PUT):**
```json
{ "name": "Roads & Infrastructure", "defaultAssigneeId": 5, "active": true }
```

**Department response:**
```json
{
  "id": 3,
  "name": "Roads & Infrastructure",
  "defaultAssignee": { "id": 5, "name": "John Smith" },
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2026-06-01T00:00:00Z"
}
```

---

### §Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories` | Any (active public cats visible to all) | List categories |
| POST | `/api/categories` | admin | Create category |
| GET | `/api/categories/{id}` | Any (visibility-checked) | Get category detail |
| PUT | `/api/categories/{id}` | admin | Update category |
| DELETE | `/api/categories/{id}` | admin | Deactivate category |
| GET | `/api/category-groups` | Any | List category groups |
| POST | `/api/category-groups` | admin | Create category group |
| PUT | `/api/category-groups/{id}` | admin | Update category group |
| DELETE | `/api/category-groups/{id}` | admin | Delete category group |

**Category request body (POST/PUT):**
```json
{
  "name": "Pothole Repair",
  "departmentId": 3,
  "groupId": 1,
  "slaDays": 5,
  "displayPermission": "public",
  "postingPermission": "anonymous",
  "defaultAssigneeId": null,
  "autoCloseDays": 30,
  "active": true,
  "fields": [
    {
      "code": "severity",
      "label": "Severity Level",
      "type": "select",
      "required": false,
      "options": ["low", "medium", "high", "critical"]
    }
  ]
}
```

---

### §People

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/people` | staff/admin | List/search people (`?q=`, `?role=`, `?departmentId=`, `?active=`) |
| POST | `/api/people` | admin | Create person |
| GET | `/api/people/{id}` | staff/admin | Get person detail |
| PUT | `/api/people/{id}` | admin | Update person |
| DELETE | `/api/people/{id}` | admin | Deactivate person |
| GET | `/api/people/{id}/contact-methods` | staff/admin | List contact methods |
| POST | `/api/people/{id}/contact-methods` | admin | Add contact method |
| PUT | `/api/people/{id}/contact-methods/{cmId}` | admin | Update contact method |
| DELETE | `/api/people/{id}/contact-methods/{cmId}` | admin | Remove contact method |

**Person request body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "staff",
  "departmentId": 3,
  "active": true
}
```

**Contact method request body:**
```json
{
  "type": "email",
  "value": "jane.smith@city.gov",
  "isPrimary": true,
  "label": "Work Email"
}
```

---

### §Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | staff/admin | List active templates |
| POST | `/api/templates` | admin | Create template |
| GET | `/api/templates/{id}` | staff/admin | Get template (for staff compose UI) |
| PUT | `/api/templates/{id}` | admin | Update template |
| DELETE | `/api/templates/{id}` | admin | Delete template (non-system only) |

**Template request body:**
```json
{
  "name": "Acknowledgement — Will Investigate",
  "subject": "Update on your service request #{{ticket_id}}",
  "body": "Dear {{reporter_name}},\n\nThank you for reporting {{title}}…",
  "active": true
}
```

---

### §API Clients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clients` | admin | List all clients |
| POST | `/api/clients` | admin | Create client (returns key once) |
| GET | `/api/clients/{id}` | admin | Get client detail (key hint only) |
| PUT | `/api/clients/{id}` | admin | Update name/contact/notes |
| DELETE | `/api/clients/{id}` | admin | Deactivate client |
| POST | `/api/clients/{id}/regenerate-key` | admin | Regenerate API key (returns new key once) |

---

### §Substatuses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/substatuses` | staff/admin | List substatuses (`?primaryStatus=open\|closed`) |
| POST | `/api/substatuses` | admin | Create substatus |
| GET | `/api/substatuses/{id}` | staff/admin | Get substatus |
| PUT | `/api/substatuses/{id}` | admin | Update substatus |
| DELETE | `/api/substatuses/{id}` | admin | Deactivate substatus |

---

### §Bookmarks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookmarks` | staff/admin | List current user's bookmarks |
| POST | `/api/bookmarks` | staff/admin | Create bookmark |
| GET | `/api/bookmarks/{id}` | staff/admin | Get bookmark + filterState |
| DELETE | `/api/bookmarks/{id}` | staff/admin | Delete bookmark |

---

### §Notification Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/settings` | admin | Get current notification/SMTP settings |
| PUT | `/api/notifications/settings` | admin | Update digest frequency |

---

### §Authentication

Auth flows are handled through Next.js API routes (or PHP controller equivalent) at `/auth/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/login` | None | Initiate OIDC redirect |
| GET | `/auth/callback` | None | Handle OIDC callback, issue session cookie |
| POST | `/auth/logout` | session | Clear session, redirect to OIDC logout |
| GET | `/auth/me` | session | Return current user's person record + role |

**`GET /auth/me` response:**
```json
{
  "data": {
    "id": 5,
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "staff",
    "department": { "id": 3, "name": "Roads" },
    "primaryEmail": "jane.smith@city.gov"
  },
  "meta": {},
  "errors": []
}
```

---

### §OpenAPI Documentation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/docs` | staff | Swagger UI HTML |
| GET | `/api/openapi.json` | staff | OpenAPI 3.1 JSON spec |
| GET | `/api/openapi.yaml` | staff | OpenAPI 3.1 YAML spec |

---

### Common Query Parameters (Admin Lists)

All admin list endpoints (`GET /api/departments`, `/api/categories`, etc.) support:
- `?active=true|false` (default `true`)
- `?page=1&perPage=25`
- `?sort=name_asc|name_desc|created_asc|created_desc`

---

*End of Y1b — admin/auth API chunk.*
---

## Y2: Cross-Feature Error Catalog

This catalog lists all error codes, HTTP status codes, and messages used across features. For Open311 errors, the format differs (see §Open311 Errors below).

---

### Standard JSON Envelope Error Format

```json
{
  "data": null,
  "meta": {},
  "errors": [
    {
      "field": "categoryId",
      "message": "Category not found or inactive",
      "code": "INVALID_CATEGORY"
    }
  ]
}
```

- `field`: The request field that caused the error, or `null` for non-field errors.
- `message`: Human-readable message (should be translatable in production).
- `code`: Machine-readable error code for client-side handling.

---

### Authentication & Authorization Errors

| HTTP | Code | Field | Message | Feature |
|------|------|-------|---------|---------|
| 401 | UNAUTHENTICATED | null | "Authentication required" | F11 |
| 401 | SESSION_EXPIRED | null | "Session expired; please log in again" | F11 |
| 401 | SESSION_REVOKED | null | "Your account has been deactivated" | F11 |
| 401 | INVALID_ID_TOKEN | null | "Identity token could not be verified" | F11 |
| 400 | OAUTH_STATE_MISMATCH | null | "Authentication state mismatch; possible CSRF" | F11 |
| 400 | OIDC_ERROR | null | Provider error description | F11 |
| 503 | IDP_UNAVAILABLE | null | "Authentication service unavailable; try again later" | F11 |
| 403 | FORBIDDEN | null | "Your role does not permit this action" | F10 |
| 403 | CATEGORY_FORBIDDEN | null | "You do not have permission to view this category" | F10 |
| 403 | POSTING_FORBIDDEN | null | "This category does not allow posting by your role" | F10 |
| 403 | NOT_YOUR_TICKET | null | "You may only view your own submitted tickets" | F10 |

---

### Ticket Errors

| HTTP | Code | Field | Message | Feature |
|------|------|-------|---------|---------|
| 404 | NOT_FOUND | null | "Ticket not found" | F00 |
| 422 | INVALID_CATEGORY | categoryId | "Category not found or inactive" | F00 |
| 422 | LOCATION_REQUIRED | lat/address | "Either coordinates or an address must be provided" | F00 |
| 422 | INVALID_COORDINATES | lat/lng | "Latitude must be −90 to +90; longitude −180 to +180" | F00 |
| 422 | INVALID_ASSIGNEE | assigneeId | "Assignee not found or not an active staff member" | F00 |
| 422 | REASON_REQUIRED | reason | "A reason is required to reopen a ticket" | F00 |
| 409 | ALREADY_CLOSED | null | "Ticket is already closed" | F00 |
| 409 | ALREADY_OPEN | null | "Ticket is already open" | F00 |
| 409 | ALREADY_MERGED | null | "This ticket has already been merged" | F18 |
| 409 | TARGET_CLOSED | targetTicketId | "Cannot merge into a closed ticket" | F18 |
| 409 | TARGET_MERGED | targetTicketId | "Cannot merge into a ticket that has already been merged" | F18 |
| 422 | SELF_MERGE | targetTicketId | "Cannot merge a ticket into itself" | F18 |
| 422 | STATUS_MISMATCH | substatusId | "Substatus does not match the ticket's current primary status" | F17 |

---

### Validation Errors

| HTTP | Code | Field | Message | Feature |
|------|------|-------|---------|---------|
| 422 | DUPLICATE_NAME | name | "A [resource] with this name already exists" | F02/F12/F13/F14/F17 |
| 422 | DUPLICATE_EMAIL | email/value | "This email address is already registered" | F03 |
| 422 | INVALID_EMAIL | email/value | "Email address is not valid" | F03/F14 |
| 422 | INVALID_ROLE | role | "Role must be admin, staff, or public" | F03 |
| 422 | INVALID_DEPARTMENT | departmentId | "Department not found or inactive" | F02/F03 |
| 422 | INVALID_GROUP | groupId | "Category group not found" | F02 |
| 422 | FIELD_OPTIONS_REQUIRED | fields | "Select-type fields require at least one option" | F02 |
| 422 | INVALID_DATE | dateFrom/dateTo | "Date must be ISO 8601 format (YYYY-MM-DD)" | F04/F09 |
| 422 | INVALID_DATE_RANGE | dateFrom | "Start date must be before end date" | F04/F09 |
| 422 | DATE_RANGE_TOO_LARGE | dateFrom | "Report date range cannot exceed 2 years" | F09 |
| 422 | INVALID_BBOX | bbox | "Bounding box must be minLat,minLng,maxLat,maxLng" | F04/F05 |
| 422 | BOOKMARK_LIMIT | null | "Maximum 50 bookmarks reached" | F12 |
| 422 | SYSTEM_TEMPLATE | null | "System templates cannot be deleted" | F13 |
| 422 | FILE_TOO_LARGE | file | "File exceeds maximum size of 10 MB" | F07 |
| 422 | INVALID_FILE_TYPE | file | "File type not allowed" | F07 |
| 422 | ATTACHMENT_LIMIT | null | "Maximum attachments per ticket reached" | F07 |
| 422 | INVALID_URL | media_url | "media_url must be a valid HTTP/HTTPS URL" | F07 |
| 413 | EXPORT_TOO_LARGE | null | "Export exceeds maximum 5000 rows; refine filters" | F04 |
| 422 | DUPLICATE_LABEL | label | "A substatus with this label already exists for this status" | F17 |

---

### Resource Not Found Errors

| HTTP | Code | Message | Feature |
|------|------|---------|---------|
| 404 | NOT_FOUND | "Ticket not found" | F00 |
| 404 | NOT_FOUND | "Person not found" | F03 |
| 404 | NOT_FOUND | "Department not found" | F02 |
| 404 | NOT_FOUND | "Category not found" | F02 |
| 404 | NOT_FOUND | "Bookmark not found" | F12 |
| 404 | NOT_FOUND | "Template not found" | F13 |
| 404 | NOT_FOUND | "API client not found" | F14 |
| 404 | NOT_FOUND | "Substatus not found" | F17 |

---

### Infrastructure & Integration Errors

| HTTP | Code | Message | Feature |
|------|------|---------|---------|
| 503 | SEARCH_UNAVAILABLE | "Search service is temporarily unavailable" | F04 |
| 503 | GEO_SERVICE_UNAVAILABLE | "Address lookup service unavailable; ticket saved without coordinates" | F05 |
| 422 | ADDRESS_NOT_FOUND | "Address could not be geocoded; please provide coordinates manually" | F05 |
| 503 | DATABASE_UNAVAILABLE | "Database service unavailable; try again later" | F16 |
| 500 | INTERNAL_ERROR | "An unexpected error occurred" | F16 |
| 405 | METHOD_NOT_ALLOWED | "HTTP method not supported on this endpoint" | F16 |
| 400 | MALFORMED_REQUEST | "Request body is not valid JSON" | F16 |
| 409 | ALREADY_INACTIVE | "Client is already inactive" | F14 |
| 409 | HAS_ACTIVE_TICKETS | "Resource has active tickets; confirm to proceed" | F02 |

---

### Open311 Error Format

Open311 errors use a different format (spec-required):

```json
[{"code": 404, "description": "Service request not found"}]
```

| HTTP | code | description | Feature |
|------|------|-------------|---------|
| 404 | 404 | "service_code not found" | F01 |
| 404 | 404 | "Service request not found" | F01 |
| 400 | 400 | "Invalid api_key" | F01/F14 |
| 400 | 400 | "lat/long or address_string required" | F01 |
| 403 | 403 | "This service requires authentication" | F01 |

---

### Error Handling Rules

1. **Unhandled exceptions** → HTTP 500 with `INTERNAL_ERROR` code; full stack trace logged to Graylog.
2. **Validation failures** → HTTP 422 with array of `{ field, message, code }` objects; all validation errors for a single request returned at once (not fail-fast).
3. **Not Found** → HTTP 404; never expose whether a resource exists to unauthorized callers (return 404 even if it's a 403 scenario for hidden resources).
4. **Conflict** → HTTP 409 for state conflicts; not for validation failures.
5. **SMTP failures** are non-fatal → ticket operations succeed; notification failure logged to Graylog.
6. **Geocoding failures** are non-fatal → ticket saved with `geoStatus = 'failed'`; no error returned to caller.
---

## Y3: External Integration Points

This document catalogs all external systems that uReport integrates with, the integration contracts, configuration parameters, failure modes, and abstraction layers used.

---

### §Open311 GeoReport v2

**Direction:** Inbound (external clients call uReport)  
**Type:** REST API (inbound)  
**Contract:** GeoReport v2 specification (open311.org)  
**Endpoint base:** `/open311/`  
**Formats:** JSON and XML (content negotiation via `format` query parameter or `Accept` header)  
**Auth:** API key (`api_key` query/body parameter)

**Field Mapping (Open311 → uReport internal):**

| Open311 Request Field | Internal Mapping |
|----------------------|-----------------|
| `service_code` | `categories.id` |
| `description` | `tickets.description` |
| `lat` | `ticket_geodata.lat` |
| `long` | `ticket_geodata.lng` |
| `address_string` | `tickets.address` |
| `first_name` + `last_name` | `tickets.reporterName` |
| `email` | `tickets.reporterEmail` |
| `phone` | `tickets.reporterPhone` |
| `media_url` | `media.sourceUrl` |
| `api_key` | Validated against `clients.apiKeyHash` |

| Open311 Response Field | Internal Source |
|-----------------------|----------------|
| `service_request_id` | `tickets.id` |
| `status` | `tickets.status` |
| `service_code` | `tickets.categoryId` |
| `service_name` | `categories.name` |
| `description` | `tickets.description` |
| `lat` | `ticket_geodata.lat` |
| `long` | `ticket_geodata.lng` |
| `address` | `tickets.address` |
| `requested_datetime` | `tickets.datetimeOpened` (ISO 8601) |
| `updated_datetime` | `tickets.datetimeUpdated` (ISO 8601) |
| `expected_datetime` | Computed: `datetimeOpened + (slaDays × 8h)` |
| `agency_responsible` | `departments.name` |
| `media_url` | `media.sourceUrl` or first image URL |

**Preservation guarantee:** The Open311 endpoint surface at `/open311/` is not modified during modernization. External clients require zero code changes after migration.

---

### §OIDC Provider

**Direction:** Outbound (uReport calls provider for auth exchange)  
**Protocol:** OpenID Connect 1.0 (Authorization Code Flow)  
**Examples:** Keycloak, Auth0, Azure AD, city SSO

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `OIDC_ISSUER` | Provider issuer URL (e.g., `https://sso.city.gov/`) |
| `OIDC_CLIENT_ID` | Client ID registered at provider |
| `OIDC_CLIENT_SECRET` | Client secret |
| `OIDC_REDIRECT_URI` | Callback URL (`BASE_URL . '/auth/callback'`) |
| `OIDC_SCOPES` | Scopes to request (default: `openid email profile`) |

**Endpoints used:**
- Authorization endpoint (from discovery document)
- Token endpoint (code exchange)
- JWKS endpoint (token signature validation)
- End-session endpoint (logout)

**Failure mode:** If the OIDC provider is unreachable, unauthenticated users receive HTTP 503 `IDP_UNAVAILABLE`. Already-authenticated users with valid session JWTs are not affected until their session expires.

---

### §Apache Solr

**Direction:** Bidirectional (uReport indexes to and queries from Solr)  
**Version:** Apache Solr 7.4+  
**Use cases:** Full-text search, faceted filtering, geospatial clustering

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `SOLR_URL` | Solr base URL (e.g., `http://solr:8983/solr/ureport`) |
| `SOLR_TIMEOUT` | Request timeout in seconds (default: 5) |

**Index operations:**
- **Create/Update:** `POST /solr/ureport/update` with ticket document on every ticket mutation
- **Delete:** `POST /solr/ureport/update` with delete-by-id on ticket delete
- **Query:** `GET /solr/ureport/select` with `q`, `fq`, `facet`, `spatial` params
- **Geo-cluster:** Solr Heatmap Faceting (`facet.heatmap` component) for density map data

**Solr document fields:**
- `id` (string): `ticket_<ticket_id>`
- `ticket_id` (int), `title` (text_en), `description` (text_en), `status` (string)
- `category_id` (int), `department_id` (int), `assignee_id` (int)
- `address` (text_en), `lat` (double), `lng` (double)
- `date_opened` (date), `date_closed` (date)
- `response_text` (text_en): Concatenated response action bodies for full-text search

**Abstraction:** All Solr calls are routed through a `SearchService` class. Controllers never call Solr directly.

**Failure mode:** Solr unavailability degrades to MySQL-only search (with reduced performance and no geo-clustering). API returns HTTP 503 `SEARCH_UNAVAILABLE` if Solr is required for the request.

---

### §SMTP / Email

**Direction:** Outbound (uReport sends email to users)  
**Protocol:** SMTP with STARTTLS or SSL  
**Use cases:** Ticket notifications, assignment alerts, reporter responses, digest emails

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (typically 587 for STARTTLS, 465 for SSL) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_TLS` | Boolean — use STARTTLS |
| `SMTP_FROM_ADDRESS` | From address (e.g., `noreply@city.gov`) |
| `SMTP_FROM_NAME` | From name (e.g., "City uReport") |

**Library:** PHPMailer (existing dependency) or equivalent Node.js mailer.

**Failure mode:** Non-fatal. SMTP failures are caught, logged to Graylog, and retried up to 3 times with exponential backoff. Ticket operations proceed regardless.

---

### §Address / Geocoding Service

**Direction:** Outbound (uReport calls geocoding service)  
**Use cases:** Address → lat/lng, lat/lng → address string (reverse geocode)

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `ADDRESS_SERVICE_TYPE` | `google` \| `nominatim` \| `city_gis` \| `none` |
| `ADDRESS_SERVICE_URL` | Base URL for the geocoding API |
| `ADDRESS_SERVICE_KEY` | API key (required for Google Maps) |

**Abstraction:** All geocoding calls routed through `AddressService` interface. Concrete implementations per service type.

**Failure mode:** Non-fatal. Geocoding failure sets `ticket_geodata.geoStatus = 'failed'`; ticket is saved. A CLI re-index command retries failed geocodes.

---

### §Graylog (Centralized Logging)

**Direction:** Outbound (uReport sends log messages to Graylog)  
**Protocol:** GELF (Graylog Extended Log Format) over UDP or HTTP  
**Use cases:** Error logging, structured application events, SMTP failure logs, auth events

**Configuration (site_config.php):**

| Constant | Description |
|---------|-------------|
| `GRAYLOG_HOST` | Graylog GELF input hostname |
| `GRAYLOG_PORT` | GELF port (default: 12201 UDP) |
| `GRAYLOG_ENABLED` | Boolean — disable in local dev |

**Log levels used:** ERROR (unhandled exceptions), WARNING (non-fatal failures), INFO (ticket lifecycle events), DEBUG (dev only).

**Failure mode:** If Graylog is unavailable, log falls back to local error log. Never blocks request handling.

---

### §GNU gettext / i18n

**Direction:** Internal (compile-time)  
**Use cases:** All user-facing strings externalized via `.po`/`.mo` files

- PHP backend: `_('string')` or `gettext('string')` via existing `LOCALE` constant
- Next.js frontend: `next-intl` or equivalent library reading compiled message catalogs
- Locale determined from `LOCALE` site config constant
- No hard-coded English strings in templates, component JSX, or API responses (for translatable messages)

---

*End of Y3 — integration points chunk.*
