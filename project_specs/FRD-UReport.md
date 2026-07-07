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
---

## F0: Open311 / GeoReport v2 API (Hard Constraint — Frozen)

**Priority:** P0 — Critical  
**Status:** Frozen contract — no path, HTTP method, query parameter, or response format may change.

### Description

The Open311 / GeoReport v2 REST API exposes four endpoints that external clients (mobile apps, municipal 311 aggregators) consume. This API is a hard frozen contract: the Spring Boot implementation must produce byte-level-compatible responses to the existing PHP implementation. Any divergence in field names, response structure, HTTP status codes, or content types constitutes a regression.

Content negotiation is performed via Accept header or format path suffix/query parameter: `.json`/`format=json` → `application/json`; `.xml`/`format=xml` → `application/xml`. HTML is served when Accept is `text/html` (legacy browser fallback only).

### Terminology

- **service_code** — The category ID used as the Open311 service identifier. Maps to `categories.id`.
- **service_request_id** — The ticket ID used as the Open311 request identifier. Maps to `tickets.id`.
- **jurisdiction_id** — Optional query parameter accepted but not required; used by multi-jurisdiction Open311 deployments.
- **api_key** — Required for POST /requests; validated against `clients.api_key`. Also accepted via `X-Api-Key` header.
- **OBSOLETE_API_KEYS** — Configurable list of deprecated API keys that trigger a mobile shutdown notice instead of the real service list. Preserved from existing PHP behavior.

### Sub-features

- `GET /open311/v2/services` — List all postable service categories
- `GET /open311/v2/services/{service_code}` — Get details for a single service
- `GET /open311/v2/requests` — Search/list service requests with filters
- `GET /open311/v2/requests/{service_request_id}` — Get a single service request by ID
- `POST /open311/v2/requests` — Submit a new service request
- Content negotiation: JSON, XML, HTML based on Accept header or format suffix
- API key validation for write operations
- Mobile shutdown notice for OBSOLETE_API_KEYS

---

### F0.1: GET /open311/v2/services

**Process:**
1. Parse `api_key` query parameter (or `X-Api-Key` header).
2. If `api_key` matches a value in the OBSOLETE_API_KEYS configuration list, return the mobile shutdown notice category list (three synthetic categories with instructional names).
3. Query `categories` where `active = true`.
4. Filter by `displayPermissionLevel` and `postingPermissionLevel` relative to the requesting person's session (unauthenticated → anonymous; authenticated staff → staff).
5. Serialize each category as a service object.
6. Return the list in the requested format (JSON array / XML `<services>` / HTML table).

**Inputs:**
- `api_key` [O] (string): Open311 client API key
- `jurisdiction_id` [O] (string): Accepted, ignored — single-jurisdiction deployment
- `service_code` [O] (string/integer): If provided, returns single service info (see F0.1b below)
- `format` [O] (string): `json` or `xml`; overrides Accept header

**Service Object Fields (JSON/XML):**

| Field | Type | Source | Notes |
|---|---|---|---|
| `service_code` | string | `categories.id` | |
| `service_name` | string | `categories.name` | |
| `description` | string | `categories.description` | |
| `metadata` | boolean | `false` | customFields reserved |
| `type` | string | `"realtime"` | Always realtime |
| `keywords` | string | `""` | Empty in current impl |
| `group` | string | `categoryGroups.name` | Category group name |

**Validation:**
- No required parameters for list endpoint.
- If `service_code` is provided and the category does not exist → 404.
- If `service_code` exists but `allowsPosting()` returns false for current person → 403.

**Error States:**

| Scenario | HTTP Status | Response |
|---|---|---|
| Unknown service_code | 404 | `{"errors":[{"code":"open311/unknownService","description":"Unknown service"}]}` |
| Not allowed to post | 403 | `{"errors":[{"code":"noAccessAllowed","description":"Forbidden"}]}` |

---

### F0.2: GET /open311/v2/requests

**Process:**
1. Parse filter parameters from query string.
2. Build ticket search criteria object from valid parameters.
3. Execute paginated `TicketTable.find()` query.
4. Serialize each ticket as a service request object.
5. If response format is HTML, also include pagination navigation block.

**Filter Parameters (Query String):**

| Parameter | Type | Maps To | Notes |
|---|---|---|---|
| `service_code` | integer | `tickets.category_id` | Category filter |
| `status` | string | `tickets.status` | `open` or `closed` |
| `start_date` | ISO 8601 | `tickets.enteredDate >=` | Date range start |
| `end_date` | ISO 8601 | `tickets.enteredDate <=` | Date range end |
| `updated_before` | ISO 8601 | `tickets.lastModified <=` | Last modified range |
| `updated_after` | ISO 8601 | `tickets.lastModified >=` | Last modified range |
| `bbox` | string | spatial filter | `lat_lo,lng_lo,lat_hi,lng_hi` |
| `page_size` | integer | LIMIT | Default 1000; zero treated as default |
| `page` | integer | OFFSET | One-based; page=0 treated as page=1 |

**Service Request Object Fields:**

| Field | Type | Source |
|---|---|---|
| `service_request_id` | string | `tickets.id` |
| `status` | string | `tickets.status` |
| `status_notes` | string | Latest action notes |
| `service_name` | string | `categories.name` |
| `service_code` | string | `tickets.category_id` |
| `description` | string | `tickets.description` |
| `agency_responsible` | string | `departments.name` |
| `service_notice` | string | `""` |
| `requested_datetime` | ISO 8601 | `tickets.enteredDate` |
| `updated_datetime` | ISO 8601 | `tickets.lastModified` |
| `expected_datetime` | ISO 8601 | `enteredDate + slaDays` or `null` |
| `address` | string | `tickets.location` |
| `address_id` | string | `tickets.addressId` |
| `zipcode` | string | `tickets.zip` |
| `lat` | float | `tickets.latitude` |
| `long` | float | `tickets.longitude` |
| `media_url` | string | URL of first media attachment or `""` |

**Validation:**
- `start_date` / `end_date` must parse as ISO 8601 datetime; if malformed, return 400.
- `page_size` must be a positive integer; 0 treated as default (1000).
- If `service_code` provided but unknown → 404.
- If `service_code` exists but `allowsDisplay()` returns false → 404 (per existing behavior).

**Error States:**

| Scenario | HTTP Status | Response |
|---|---|---|
| Unknown service_code | 404 | errors array |
| Malformed date parameter | 400 | errors array |
| Category not displayable | 404 | errors array |

---

### F0.3: POST /open311/v2/requests

**Process:**
1. Validate `api_key` parameter (query string or `X-Api-Key` header) against `clients.api_key`. If missing or invalid → 403.
2. Validate required fields: `service_code`, optionally `lat`+`long` or `address_string`.
3. Translate the Open311 POST field names to internal Ticket field names via `Open311Client.translatePostArray()`.
4. Create and persist a new `Ticket` record.
5. If `media` file is present in the multipart request, attach it to the new ticket (Media record created; file stored on disk). Media errors are silently swallowed — the ticket is still created.
6. Return a single-element service request object for the created ticket (same schema as GET /requests response).

**Inputs (multipart/form-data or application/x-www-form-urlencoded):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `api_key` | string | [R] | Must match `clients.api_key` |
| `service_code` | integer | [R] | Category ID |
| `lat` | float | [O] | Latitude; required if no address_string |
| `long` | float | [O] | Longitude |
| `address_string` | string | [O] | Street address |
| `address_id` | integer | [O] | Address service ID |
| `email` | string | [O] | Reporter email |
| `first_name` | string | [O] | Reporter first name |
| `last_name` | string | [O] | Reporter last name |
| `phone` | string | [O] | Reporter phone |
| `description` | string | [O] | Issue description |
| `account_id` | string | [O] | Reporter account ID (mapped to person) |
| `media` | file | [O] | Photo attachment (multipart) |

**Field Mapping (Open311 → Internal):**

| Open311 Field | Internal Field |
|---|---|
| `service_code` | `category_id` |
| `lat` | `latitude` |
| `long` | `longitude` |
| `address_string` | `location` |
| `first_name` | `reportedByPerson.firstname` |
| `last_name` | `reportedByPerson.lastname` |
| `email` | `reportedByPerson.email` |
| `phone` | `reportedByPerson.phone` |
| `account_id` | `reportedByPerson_id` |

**Outputs:**
- HTTP 200 with service request object for the created ticket (wrapped in array for JSON: `[{...}]`)
- `service_request_id` contains the new ticket ID

**Validation:**
- `api_key` must match an existing `clients.api_key` → 403 if missing/invalid
- `service_code` must reference an existing, active category → 400 if unknown
- At least one of `lat`+`long` or `address_string` should be provided (soft validation; ticket can be created without location)
- Email format validated if provided

**Error States:**

| Scenario | HTTP Status | Error Code |
|---|---|---|
| Missing or invalid api_key | 403 | `clients/unknownClient` |
| Missing required field | 400 | `missingRequiredField` |
| Unknown service_code | 400 | `categories/unknownCategory` |
| Media upload failure | 200 | (silently ignored; ticket still created) |

---

### F0.4: GET /open311/v2/requests/{service_request_id}

**Process:**
1. Parse `service_request_id` from URL path.
2. Load `Ticket` by ID. If not found → 404.
3. Check `ticket.allowsDisplay(person)`. If denied → 403.
4. Serialize and return single service request object (same schema as GET /requests list item, wrapped in array).

**Inputs:**
- `service_request_id` [R] (integer): Ticket ID (URL path parameter)
- `format` [O] (string): `json` or `xml`

**Outputs:**
- HTTP 200 with single-element array containing the service request object
- Same field schema as GET /requests list items

**Error States:**

| Scenario | HTTP Status | Response |
|---|---|---|
| Ticket not found | 404 | errors array |
| Access denied | 403 | errors array |

---

### Content Negotiation Rules

The Spring Boot Open311 controller must implement the following negotiation logic:

1. Check URL path for format suffix: `.json` → force JSON; `.xml` → force XML.
2. Check `format` query parameter: `json` → JSON; `xml` → XML.
3. Check `Accept` header: `application/json` → JSON; `application/xml` → XML; `text/html` → HTML.
4. Default (no hint): JSON.

XML responses must use the GeoReport v2 XML element names. JSON responses must use snake_case field names as defined by GeoReport v2 spec.

---

### API Surface Summary

Full endpoint specifications are in `Y1-api.md` §Open311. The four endpoints are:

| Method | Path | Auth |
|---|---|---|
| GET | `/open311/v2/services` | None (api_key optional) |
| GET | `/open311/v2/services/{service_code}` | None |
| GET | `/open311/v2/requests` | None |
| GET | `/open311/v2/requests/{service_request_id}` | None |
| POST | `/open311/v2/requests` | api_key [R] |

### Schema Surface

- `tickets` — core request entity
- `categories` — service definitions
- `categoryGroups` — service groupings
- `departments` — agency responsible
- `clients` — API key registry
- `media` — photo attachments

See `Y0-schema.md` for full DDL.
---

## F1: Ticket / Case Lifecycle Management

**Priority:** P0 — Critical

### Description

The ticket (civic 311 service request) is the core domain entity. Staff create tickets via the internal CRM UI, manage assignments, update fields, log responses, and transition the ticket through its lifecycle. Every state transition is recorded as an immutable history entry in `ticket_history`. The lifecycle is: `open` → (assigned) → (in-progress) → `closed`, with substatus applied at close. Tickets can be reopened from `closed` → `open`.

### Terminology

- **Status** — Binary field: `open` or `closed`. Stored in `tickets.status`.
- **Substatus** — Refinement applied when closing a ticket (Resolved, Duplicate, Bogus, or custom). Stored in `tickets.substatus_id`.
- **Assignee** — The staff person responsible for resolving the ticket (`tickets.assignedPerson_id`).
- **Reporter** — The constituent who submitted the ticket (`tickets.reportedByPerson_id`).
- **EnteredBy** — The staff person who created the ticket in the CRM (`tickets.enteredByPerson_id`).
- **Parent ticket** — A ticket may be marked as a duplicate of another via `tickets.parent_id`.
- **SLA** — `categories.slaDays` defines the expected resolution window; `expected_datetime` is `enteredDate + slaDays days`.
- **Overdue** — A ticket is overdue when `NOW() > enteredDate + slaDays` and the ticket is still open.

### Sub-features

- Create ticket (manual staff entry)
- View ticket detail
- Assign ticket to person and/or department
- Update ticket fields (category, location, description, substatus, issueType, contactMethod)
- Transition: open → closed (with substatus)
- Transition: closed → open (reopen)
- Mark as duplicate (set parent_id + substatus = Duplicate)
- Log actions and responses (see F9)
- Attach media (see F10)
- Bulk operations: assign, close, change status on multiple selected tickets
- SLA tracking: expose overdue flag on ticket

### Process — Create Ticket (Staff)

1. Staff navigates to New Case form (route: `/cases/new`).
2. Staff fills required fields: category, location (address or lat/lon), description.
3. Staff optionally fills: reporter person (search/select or create inline), assignee person, issue type, contact method, custom fields.
4. System validates all required fields and field formats.
5. On submit, system creates `tickets` record with `status = 'open'`, `enteredDate = NOW()`, `enteredByPerson_id = current user`.
6. System creates `ticket_history` entry with `action_id` = "open" action, `enteredByPerson_id = current user`, `actionDate = NOW()`.
7. If `assignedPerson_id` is set, system creates a second `ticket_history` entry with `action_id` = "assignment" action.
8. System triggers email notification to assignee (if notification is configured).
9. System redirects to Case Detail screen for the new ticket (route: `/cases/{id}`).

### Process — Status Transition: Open → Closed

1. Staff clicks "Close" button on Case Detail screen.
2. System shows confirmation dialog with substatus selector (required).
3. Staff selects substatus (Resolved, Duplicate, Bogus, or other configured substatus).
4. If substatus = Duplicate, staff must provide parent ticket ID.
5. Staff optionally adds closing notes.
6. On confirm: system sets `tickets.status = 'closed'`, `tickets.closedDate = NOW()`, `tickets.substatus_id = selected`.
7. If Duplicate: system sets `tickets.parent_id = specified parent ticket ID`.
8. System creates `ticket_history` entry with `action_id` = "closed" action, notes = closing notes.
9. System sends email notification to reporter (if notification toggle enabled).

### Process — Status Transition: Closed → Open (Reopen)

1. Staff clicks "Reopen" button on Case Detail screen of a closed ticket.
2. System shows confirmation dialog with optional notes field.
3. On confirm: system sets `tickets.status = 'open'`, `tickets.closedDate = NULL`, `tickets.substatus_id = NULL`.
4. System creates `ticket_history` entry with `action_id` = "open" (reopen).
5. System notifies assignee (if configured).

### Process — Assign Ticket

1. Staff opens ticket assignment control (inline on Case Detail or from case list bulk assign).
2. Staff selects an assignee from the people list (filtered to staff roles).
3. On save: system updates `tickets.assignedPerson_id`.
4. System creates `ticket_history` entry with `action_id` = "assignment", `actionPerson_id` = new assignee.
5. System sends email to new assignee (if notification configured).

### Process — Bulk Operations

1. Staff selects multiple tickets via checkbox column in case list.
2. Staff clicks bulk action button (Assign, Close, or Change Status) in the action bar.
3. System displays a bulk action dialog with appropriate fields (assignee selector for assign; substatus selector for close).
4. On confirm: system applies the action to each selected ticket sequentially.
5. Each ticket gets an individual `ticket_history` record for the action.
6. System shows a toast notification with success count and any failure count.

### Inputs — Create Ticket

| Field | Type | Required | Validation |
|---|---|---|---|
| `category_id` | integer | [R] | Must reference active category |
| `description` | text | [R] | Min 1 character |
| `location` | string | [R*] | Required if lat/lon not provided |
| `latitude` | float | [O] | -90.0 to 90.0 |
| `longitude` | float | [O] | -180.0 to 180.0 |
| `reportedByPerson_id` | integer | [O] | Must reference existing person |
| `assignedPerson_id` | integer | [O] | Must reference staff person |
| `issueType_id` | integer | [O] | Must reference existing issue type |
| `contactMethod_id` | integer | [O] | Must reference existing contact method |
| `enteredByPerson_id` | integer | [R] | Auto-set to current authenticated user |

*[R*] = At least location string OR lat+lon required.

### Outputs

- Created ticket record with auto-generated `id`
- `ticket_history` record(s) for open and optional assignment actions
- Redirect to `/cases/{id}`
- Toast notification: "Case #{id} created successfully"
- Email notification to assignee (if assigned and notification configured)

### Validation Rules

- `category_id` must reference an active category (`categories.active = true`).
- `latitude` must be in range [-90, 90]; `longitude` must be in range [-180, 180].
- At least one location signal (address string or lat/lon coordinates) is recommended; system warns but does not block if no location provided.
- `status` field is not user-editable on create; always initialized to `'open'`.
- `substatus_id` is only settable when status is `'closed'`.
- `parent_id` is only settable when substatus = Duplicate.
- Bulk close requires substatus selection for all tickets being closed.
- Staff role check: only users with role `admin` or `staff` may create, update, or close tickets.

### Error States

| Scenario | HTTP Status | Error Code | User Message |
|---|---|---|---|
| Unknown category_id | 400 | `INVALID_CATEGORY` | "Invalid category selected" |
| Invalid lat/lon range | 400 | `INVALID_COORDINATES` | "Coordinates out of valid range" |
| Missing description | 400 | `MISSING_REQUIRED` | "Description is required" |
| Unauthorized (not logged in) | 401 | `UNAUTHORIZED` | Redirect to login |
| Forbidden (wrong role) | 403 | `FORBIDDEN` | "Insufficient permissions" |
| Ticket not found | 404 | `NOT_FOUND` | "Case not found" |
| Close without substatus | 400 | `MISSING_SUBSTATUS` | "Substatus required to close a case" |

### API Surface

See `Y1-api.md` §Tickets. Key endpoints:

| Method | Path | Description |
|---|---|---|
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets/{id}` | Get ticket detail |
| PATCH | `/api/tickets/{id}` | Update ticket fields |
| POST | `/api/tickets/{id}/close` | Close ticket with substatus |
| POST | `/api/tickets/{id}/reopen` | Reopen ticket |
| POST | `/api/tickets/{id}/assign` | Assign ticket |
| POST | `/api/tickets/bulk` | Bulk operations |

### Schema Surface

- `tickets` — core entity
- `ticket_history` — immutable audit trail
- `substatus` — substatus lookup
- `actions` — action type lookup

See `Y0-schema.md` §Tickets for full DDL.
---

## F2: Public Case Submission Form

**Priority:** P0 — Critical

### Description

The public-facing case submission form allows constituents to report a 311 service request without logging in. The form is a multi-step wizard with Framer Motion animated step transitions. It collects contact info (optional), category, location (address + map pin-drop), description, and photo uploads, then calls the internal ticket creation API (equivalent to Open311 POST /requests). A confirmation screen returns the generated case ID.

### Terminology

- **Anonymous submission** — Submission without any contact info. Allowed; reporter fields left null.
- **Identified submission** — Submission with at least name and/or email. Creates a `people` record if new.
- **Step** — One screen of the multi-step wizard. Steps navigate forward and backward without losing data.
- **Pin-drop** — Interactive map action where the user clicks the map to set lat/lon for the ticket location.
- **Geocoding** — Converting an address string to lat/lon coordinates via the geocoding API (Mapbox / OpenStreetMap Nominatim).

### Sub-features

- Step 1: Contact Information (optional)
- Step 2: Category selection (group → category drill-down)
- Step 3: Location (address autocomplete + map pin-drop)
- Step 4: Description + photo upload
- Step 5: Review and submit
- Step 6: Confirmation screen with case ID
- Anonymous and identified submission modes
- Framer Motion step transitions (≤ 300 ms, prefers-reduced-motion respected)
- Mobile-first responsive layout (375 px minimum)

### Process

1. Constituent navigates to `/submit` (public route; no auth required).
2. **Step 1 — Contact Info:** Constituent enters first name, last name, email, phone (all optional). "Skip" button advances without entering info.
3. **Step 2 — Category:** Constituent selects a category group from a dropdown or tile grid, then selects a specific category. Only categories where `postingPermissionLevel = 'anonymous'` are shown to unauthenticated users. Category description is shown for guidance.
4. **Step 3 — Location:** Constituent types an address (autocomplete queries geocoding API). Map renders with a draggable pin. Constituent can also click the map to drop a pin. Selected lat/lon and formatted address are stored in form state.
5. **Step 4 — Description + Photos:** Constituent enters a description (required). Optionally uploads one or more photos (file picker; drag-and-drop on desktop). Thumbnail previews shown for each uploaded file.
6. **Step 5 — Review:** Summary of all entered data displayed. Constituent can click "Back" or "Edit" links to return to any step.
7. On "Submit": system calls `POST /api/tickets/public` with form data and photo files.
8. **Step 6 — Confirmation:** Displays "Your report has been submitted. Case number: #{id}". Provides a link to view the case status (public GET /open311/v2/requests/{id}).

### Step Navigation Rules

- Forward navigation: each step validates its own fields before advancing.
- Backward navigation: always allowed without re-validation.
- Browser back button is handled by React Router; state is preserved in form context.
- Step indicator (1–5) shows current position and completed steps.
- Completed steps show a checkmark indicator.

### Inputs

| Field | Type | Step | Required | Validation |
|---|---|---|---|---|
| `firstName` | string | 1 | [O] | Max 128 chars |
| `lastName` | string | 1 | [O] | Max 128 chars |
| `email` | string | 1 | [O] | Valid email format |
| `phone` | string | 1 | [O] | Digits, spaces, dashes allowed |
| `category_id` | integer | 2 | [R] | Must be active, postable by anonymous |
| `address` | string | 3 | [R*] | At least address or pin-drop required |
| `latitude` | float | 3 | [R*] | Set by geocode or pin-drop |
| `longitude` | float | 3 | [R*] | Set by geocode or pin-drop |
| `description` | text | 4 | [R] | Min 10 characters |
| `photos` | files | 4 | [O] | Max 10 files; each ≤ 10 MB; JPEG/PNG/GIF |

*[R*] = Either address string or lat/lon must be provided.

### Outputs

- Created ticket record (via POST /api/tickets/public)
- Confirmation screen with ticket ID
- Optional: email confirmation to reporter if email was provided

### Validation Rules

- Step 1 (Contact Info): if email provided, must be valid format. Phone accepts digits/spaces/dashes.
- Step 2 (Category): `category_id` must reference an active category with `postingPermissionLevel` of `'anonymous'` or `'public'`. Staff-only categories are excluded from the public form.
- Step 3 (Location): at least one of address string or lat/lon coordinates must be captured before advancing.
- Step 4 (Description): minimum 10 characters. Photo files: max 10 per submission, max 10 MB each, MIME types: `image/jpeg`, `image/png`, `image/gif`.
- All form data must be preserved across step navigation (React form context / controlled components).
- CSRF protection: the public submission endpoint must include a CSRF token (Spring Security CSRF or stateless with SameSite cookies).

### Map / Geocoding Behavior

- Address input: Mapbox Geocoding API (or Nominatim fallback) provides autocomplete suggestions after 300 ms debounce.
- Selecting a suggestion sets the formatted address, lat, and lon in form state and centers the map.
- Manual pin-drop: clicking or touching the map sets lat/lon and reverse-geocodes to populate address.
- Map renders at zoom level 13 initially centered on the city center (configurable coordinates).
- If Mapbox API key is unavailable, Leaflet renders with OpenStreetMap tiles; geocoding degrades to manual address entry only.

### Photo Upload Behavior

- Files can be selected via file picker or dragged onto the drop zone (desktop).
- Mobile: native camera/gallery picker via `<input type="file" accept="image/*" capture>`.
- Each selected file shows a thumbnail preview and a remove button.
- Upload occurs on form submit, not on file selection (files held in browser memory until submit).
- Upload progress shown for each file during submission.

### Error States

| Scenario | HTTP Status | User Message |
|---|---|---|
| Unknown/inactive category | 400 | "Invalid category. Please reselect." |
| Description too short | 400 | "Please provide at least 10 characters of description." |
| Invalid email format | 400 | "Please enter a valid email address." |
| File too large | 400 | "Photo exceeds maximum 10 MB size." |
| Unsupported file type | 400 | "Only JPEG, PNG, and GIF photos are accepted." |
| Network error on submit | 503 | "Submission failed. Please try again." |
| Geocoding failure | — | Map pin remains; address field shows error inline. |

### API Surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/tickets/public` | None | Public submission; maps to Open311 semantics |
| GET | `/api/categories/public` | None | Returns public-postable categories |
| GET | `/api/geocode` | None | Address autocomplete proxy to Mapbox/Nominatim |

### Schema Surface

- `tickets` — created record
- `media` — photo attachments
- `people` — reporter record created or matched if email provided
- `categories` — filtered to `postingPermissionLevel IN ('public','anonymous')`
---

## F3: Case List with Search, Filtering, and Sorting

**Priority:** P0 — Critical

### Description

The case list is the primary staff workspace. It is a sortable, filterable, paginated data table of tickets with status badge pills, multi-column filter panel, live search with debounce, filter chips, and bulk selection. It replaces the PHP-rendered table with a fully interactive React data grid backed by PostgreSQL full-text search. Staff access it at route `/cases`.

### Terminology

- **Filter panel** — A collapsible left or top panel with filter controls (dropdowns, date pickers, checkboxes) for narrowing the ticket list.
- **Filter chip** — A small pill tag showing an active filter with an individual "×" remove button.
- **Sort column** — Clicking a column header toggles ascending/descending sort on that column.
- **Skeleton loader** — Animated placeholder rows shown while data is loading (shadcn/ui Skeleton).
- **Empty state** — A full-area graphic/message shown when no tickets match the current filters and search.
- **Bulk selection** — Checkbox column allowing multiple tickets to be selected for batch operations.
- **Bookmark** — A saved search/filter combination persisted to the `bookmarks` table for the current user.
- **Debounce** — Search input waits 300 ms after the user stops typing before issuing the API call.

### Sub-features

- Sortable column headers (case ID, date, category, department, assignee, status, location)
- Multi-column filter panel (status, substatus, category group, category, department, assignee, date range, issue type)
- Status badge pills (color-coded: open=blue, closed-resolved=green, closed-duplicate=gray, closed-bogus=red)
- Live search with 300 ms debounce
- Highlighted keyword matches in description and reporter name
- Filter chips with individual remove buttons
- Bulk selection (checkbox per row + select-all header checkbox)
- Bulk actions: assign, close, change status
- Skeleton loading placeholders during fetch
- Empty state with "No cases match your filters" guidance
- Pagination with configurable page size (10, 25, 50, 100)
- Saved search / bookmark creation and management
- Export results (CSV format)

### Process — Loading the List

1. Staff navigates to `/cases` (authenticated route).
2. React reads current URL query parameters to initialize filter state (supports bookmarkable/shareable filter URLs).
3. React issues `GET /api/tickets` with current filter, sort, search, and page parameters.
4. While fetching: skeleton loader rows are shown (5 placeholder rows).
5. On response: ticket rows render with status badge pills and all column data.
6. If zero results: empty state component renders.

### Process — Live Search

1. Staff types in the search input field.
2. After 300 ms of inactivity (debounce), React issues `GET /api/tickets?q={term}&...` with current filters preserved.
3. Response includes highlighted `ts_headline` snippet for matching description text.
4. Keyword matches are highlighted in description and reporter name columns using `<mark>` elements.

### Process — Filtering

1. Staff opens the filter panel (button or collapsible panel).
2. Staff selects filter values (dropdowns, date range pickers, checkboxes).
3. Each filter change is immediately reflected as a filter chip above the table.
4. Filter chip "×" removes that filter and re-fetches.
5. "Clear all filters" button removes all filters at once.
6. Filter state is encoded in the URL query string (React Router) for bookmarkability.

### Process — Bulk Operations

1. Staff selects tickets via checkboxes (or "Select all on this page" header checkbox).
2. Bulk action toolbar appears with available actions: Assign, Close, Change Status.
3. Staff selects action; a dialog appears for action-specific input (e.g., assignee selector, substatus).
4. On confirm: system sends `POST /api/tickets/bulk` with selected IDs and action details.
5. System applies action to each ticket (see F1 §Bulk Operations Process).
6. Case list refreshes; toast shows "X cases updated successfully".

### Process — Save Search / Bookmark

1. Staff clicks "Save Search" button after configuring filters/search.
2. A dialog prompts for a bookmark name.
3. System saves a `bookmarks` record: `person_id = current user`, `type = 'search'`, `name = entered name`, `requestUri = current URL query string`.
4. Saved searches appear in a "Saved Searches" dropdown for quick recall.

### Inputs (Query Parameters for GET /api/tickets)

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Full-text search term |
| `status` | string | `open` or `closed` |
| `substatus_id` | integer | Substatus filter |
| `category_id` | integer | Category filter |
| `categoryGroup_id` | integer | Category group filter |
| `department_id` | integer | Department filter |
| `assignedPerson_id` | integer | Assignee filter |
| `issueType_id` | integer | Issue type filter |
| `start_date` | date | `enteredDate >=` filter (YYYY-MM-DD) |
| `end_date` | date | `enteredDate <=` filter (YYYY-MM-DD) |
| `sort` | string | Column name to sort by |
| `dir` | string | `asc` or `desc` |
| `page` | integer | Page number (1-based) |
| `pageSize` | integer | Items per page (10/25/50/100) |

### Sortable Columns

| Column | DB Field |
|---|---|
| Case ID | `tickets.id` |
| Date Submitted | `tickets.enteredDate` |
| Category | `categories.name` |
| Department | `departments.name` |
| Assignee | `people.lastname` (assignee) |
| Status | `tickets.status` |
| Location | `tickets.location` |

### Outputs

- Paginated list of ticket rows with columns: Case ID, Date, Category, Department, Assignee, Status badge, Location
- Filter chips showing active filters
- Total count indicator ("Showing X–Y of Z cases")
- Pagination controls (prev/next + page number buttons)
- Search term highlighted in description/reporter columns

### Status Badge Colors

| Status | Substatus | Badge Color / Style |
|---|---|---|
| open | any | Blue pill |
| closed | Resolved | Green pill |
| closed | Duplicate | Gray pill |
| closed | Bogus | Red pill |
| closed | (other) | Purple pill |

### Validation

- Search term: max 255 characters; special characters are escaped before passing to tsquery.
- Date filters: `start_date` must be ≤ `end_date` when both provided.
- `pageSize` must be one of [10, 25, 50, 100].
- Sort column values are validated against whitelist; unknown sort column defaults to `enteredDate DESC`.

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| API error on load | 500 | Error toast; retry button shown |
| Zero results | 200 | Empty state component rendered |
| Invalid filter combo | 400 | Inline validation message on filter |
| Bulk action partial failure | 207 | Toast shows "X succeeded, Y failed" |
| Export empty result set | 400 | Toast "No cases to export" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/tickets` | Paginated filtered ticket list |
| POST | `/api/tickets/bulk` | Bulk operations |
| GET | `/api/tickets/export` | CSV export |
| GET | `/api/bookmarks` | List user's saved searches |
| POST | `/api/bookmarks` | Create saved search |
| DELETE | `/api/bookmarks/{id}` | Delete saved search |

### Schema Surface

- `tickets` — main query target with `search_vector` tsvector column
- `bookmarks` — saved search persistence
- `ticket_history` — not queried on list; used in detail
---

## F4: Case Detail View

**Priority:** P0 — Critical

### Description

The case detail screen shows the complete record for a single ticket in a split-pane layout: case metadata and controls on the left, action/history timeline on the right. Staff perform all ticket management actions from this screen — inline status transitions, response logging, media attachment, field editing — without navigating away. Route: `/cases/{id}`.

### Terminology

- **Timeline** — The chronological sequence of `ticket_history` entries shown in the right pane.
- **Inline editing** — Clicking a field value opens an edit control (input, dropdown, date picker) in place; "Save" commits via PATCH API call.
- **Lightbox** — A full-screen modal overlay for viewing attached photos at full resolution.
- **Response template** — Pre-written action note text loaded from `category_action_responses` or `actions.template`, reducing repetitive data entry.
- **Split-pane** — Two-column layout on tablet/desktop; stacked single-column on mobile.

### Sub-features

- Case metadata panel (left pane): ID, status badge, substatus, category, department, assignee, reporter, location, contact method, issue type, entered date, closed date, SLA indicator
- Interactive map pin for ticket location (left pane, below metadata)
- Inline status transition: open → close (with substatus), closed → reopen
- Inline field editing: category, assignee, location, description, issue type, contact method
- Action log entry form (right pane top): response type + notes + email toggle
- Response template selector (pre-fills action notes)
- Media / photo upload on ticket and on action entries (see F10)
- Media gallery with lightbox viewer
- Action/history timeline (right pane): chronological, each entry shows type icon, actor, date, notes, media
- Breadcrumb navigation: `Cases > Case #ID`
- Link back to case list preserving filter state

### Layout

```
┌─────────────────────────────┬──────────────────────────────────┐
│  Case Metadata Panel        │  Timeline + Action Log Panel     │
│  ─────────────────          │  ─────────────────               │
│  Status badge / controls    │  New action form (top)           │
│  All ticket fields          │  ─────────────────               │
│  Location map               │  History timeline (scrollable)   │
│  Media gallery              │  entry 1 (most recent)           │
│                             │  entry 2                         │
│                             │  ...                             │
└─────────────────────────────┴──────────────────────────────────┘
Mobile: stacked (metadata → action form → timeline)
```

### Process — Load Case Detail

1. Staff navigates to `/cases/{id}` (via breadcrumb, case list row click, or direct URL).
2. React issues parallel requests:
   - `GET /api/tickets/{id}` — ticket metadata
   - `GET /api/tickets/{id}/history` — action timeline
   - `GET /api/tickets/{id}/media` — attached photos
3. Skeleton placeholders shown while loading.
4. On response: metadata panel renders all fields; timeline renders history entries oldest-first (scrollable); media gallery renders thumbnails.
5. If ticket not found → display "Case not found" message with link back to case list.

### Process — Inline Field Editing

1. Staff clicks "Edit" icon on a field (category, assignee, location, description, issue type, contact method).
2. Field transitions to edit mode: input/dropdown replaces read-only text.
3. Staff modifies value; "Save" button commits, "Cancel" restores original value.
4. On Save: `PATCH /api/tickets/{id}` sends only changed fields.
5. System creates `ticket_history` entry for field change (action type: `changeCategory`, `changeLocation`, or `update` as appropriate).
6. Metadata panel updates with new values; toast "Case updated" shows.

### Process — Log Action / Response

1. Staff selects action type from dropdown (filtered to actions available to the ticket's department — see `department_actions`).
2. Optional: staff selects a response template from the template dropdown; this pre-fills the notes textarea.
3. Staff types notes (optional free text).
4. Staff toggles email notification checkboxes (Notify Reporter / Notify Assignee).
5. On "Submit": `POST /api/tickets/{id}/history` with action_id, notes, notification flags.
6. System creates `ticket_history` record; sends emails if notification flags set.
7. New entry prepended to top of timeline.

### Process — Status Transition (from Case Detail)

1. **Close:** Staff clicks "Close Case" button. Dialog opens with substatus selector (required) and optional notes. On confirm: see F1 §Process — Status Transition: Open → Closed.
2. **Reopen:** Staff clicks "Reopen" button on a closed case. Dialog confirms with optional notes. On confirm: see F1 §Process — Status Transition: Closed → Open.
3. Status badge on metadata panel updates immediately after transition.

### Inputs — Metadata Panel Editable Fields

| Field | Type | Validation |
|---|---|---|
| `category_id` | integer (select) | Must be active category |
| `assignedPerson_id` | integer (search/select) | Must be staff person |
| `location` | string (text) | Max 128 chars |
| `latitude` | float (map pin) | -90 to 90 |
| `longitude` | float (map pin) | -180 to 180 |
| `description` | text (textarea) | Min 1 char |
| `issueType_id` | integer (select) | Must be valid issue type |
| `contactMethod_id` | integer (select) | Must be valid contact method |

### Inputs — Action Log Form

| Field | Type | Required | Notes |
|---|---|---|---|
| `action_id` | integer (select) | [R] | Filtered to department's allowed actions |
| `notes` | text | [O] | Free text; pre-filled by template |
| `notifyReporter` | boolean | [O] | Default false |
| `notifyAssignee` | boolean | [O] | Default false |

### Outputs

- Updated ticket record (PATCH response)
- New `ticket_history` entry (POST history response)
- Timeline refreshes with new entry
- Email sent to reporter/assignee if notification flags set
- Toast notifications for all save actions

### Validation Rules

- Action type must be in the department's allowed actions list (`department_actions`) unless user role is `admin`.
- Notes field is optional for most action types but required for action type `response`.
- Email notifications can only be sent if the recipient has an email address in `peopleEmails` with `usedForNotifications = true`.
- Field edit saves are rejected if the ticket is `closed` and the user role is not `admin` (closed tickets are read-only for standard staff).
- All inline saves use optimistic UI: field shows new value immediately; reverts on API error.

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| Ticket not found | 404 | "Case not found" message; back link |
| Access denied | 403 | "You do not have permission to view this case" |
| Field save conflict | 409 | Toast "Another user updated this case. Refresh to see changes." |
| History load failure | 500 | Timeline shows error state with retry button |
| Email send failure | 200 | Action saved; toast warns "Email notification failed to send" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/tickets/{id}` | Ticket metadata |
| PATCH | `/api/tickets/{id}` | Update ticket fields |
| POST | `/api/tickets/{id}/close` | Close with substatus |
| POST | `/api/tickets/{id}/reopen` | Reopen ticket |
| POST | `/api/tickets/{id}/assign` | Assign ticket |
| GET | `/api/tickets/{id}/history` | Action timeline |
| POST | `/api/tickets/{id}/history` | Log action |
| GET | `/api/tickets/{id}/media` | List media attachments |
| POST | `/api/tickets/{id}/media` | Upload media |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | Delete media |

### Schema Surface

- `tickets` — main entity
- `ticket_history` — action timeline
- `actions` — action type lookup
- `media` — photo gallery
- `substatus` — close substatus
- `category_action_responses` — response templates per category+action
---

## F5: Dashboard

**Priority:** P1 — High

### Description

The dashboard is the landing screen for authenticated staff at route `/dashboard`. It provides an at-a-glance operational overview through stat cards, a recent cases feed, a map widget with geo-clustered open case pins, and a status breakdown donut chart. All widgets link into the case list with pre-applied filters for drill-down.

### Terminology

- **Stat card** — A summary tile showing a single KPI metric (count, ratio, etc.).
- **Overdue threshold** — Configurable application setting: number of days after which an open ticket without resolution is considered overdue. Default: derived from `categories.slaDays`.
- **Recent cases feed** — A scrollable list of the most recently created or updated tickets.
- **Map widget** — An interactive Mapbox GL JS / Leaflet map showing open ticket pins clustered by `geoclusters`.
- **Donut chart** — A React SVG chart showing proportional breakdown of case statuses.

### Sub-features

- Stat cards: total open, opened today, closed today, overdue
- Recent cases feed (last 10 tickets by `enteredDate DESC`)
- Map widget: clustered open case pins
- Status donut chart (open vs. closed, breakable by category or department)
- Quick-link action buttons: New Case, All Open Cases, Assigned to Me
- Skeleton loading for all widgets
- Responsive grid: 2-column on tablet/desktop; single-column on mobile

### Process

1. Staff authenticates and lands on `/dashboard` (or is redirected here after login).
2. React dispatches parallel data requests on mount:
   - `GET /api/dashboard/stats` — stat card counts
   - `GET /api/tickets?status=open&page=1&pageSize=10&sort=enteredDate&dir=desc` — recent cases feed
   - `GET /api/dashboard/chart?groupBy=status` — donut chart data
   - `GET /api/geoclusters?zoom=10` — map cluster data
3. All four widgets display skeleton loaders while data is in flight.
4. As each response resolves, the corresponding widget renders.
5. Clicking a stat card navigates to `/cases` with the corresponding filter pre-applied.
6. Clicking a recent case row navigates to `/cases/{id}`.
7. Clicking a map cluster zooms in to show constituent pins.
8. Clicking a map pin opens a popover showing ticket ID, category, and status, with a link to the case detail.

### Stat Card Definitions

| Card | Query Logic | Filter Link |
|---|---|---|
| **Total Open** | `COUNT(*) WHERE status='open'` | `/cases?status=open` |
| **Opened Today** | `COUNT(*) WHERE status='open' AND enteredDate >= today` | `/cases?status=open&start_date={today}` |
| **Closed Today** | `COUNT(*) WHERE status='closed' AND closedDate >= today` | `/cases?status=closed&start_date={today}` |
| **Overdue** | `COUNT(*) WHERE status='open' AND enteredDate + slaDays < NOW()` (JOIN categories on slaDays) | `/cases?status=open&overdue=true` |

### Recent Cases Feed

- Shows last 10 tickets ordered by `enteredDate DESC`.
- Each row: Case ID (badge), Category name, Reporter last name, Status badge pill, time-since label ("2 hours ago").
- Clicking a row navigates to `/cases/{id}`.
- "View all open cases" link at the bottom navigates to `/cases?status=open`.

### Donut Chart

- Data endpoint `GET /api/dashboard/chart` returns counts by status (and optionally by `category_id` or `department_id` when `groupBy` param is set).
- Default: open vs. closed ratio.
- Toggling "By Category" or "By Department" re-fetches with different `groupBy` param.
- Chart uses a legend with status/category labels and counts.
- Accessible: chart is accompanied by a data table (visually hidden but available to screen readers).

### Map Widget

- Renders Mapbox GL JS (primary) or Leaflet (fallback if Mapbox key absent).
- Initial view: city center coordinates at zoom 11 (configurable).
- Cluster pins from `geoclusters` table at low zoom; individual ticket pins at high zoom.
- Cluster bubble shows count of constituent tickets.
- Clicking cluster zooms in one level.
- Clicking individual pin shows popover: ticket ID, category, status + link to case detail.
- Map is interactive (pan, zoom) but not used for data entry on the dashboard.

### Quick-Link Buttons

| Button | Route |
|---|---|
| New Case | `/cases/new` |
| All Open Cases | `/cases?status=open` |
| Assigned to Me | `/cases?status=open&assignedPerson_id={currentUserId}` |

### Inputs

- None (dashboard is read-only).
- `groupBy` query param on chart endpoint: `status` (default), `category`, `department`.

### Outputs

- Stat card counts (4 numbers)
- Recent cases list (10 rows)
- Donut chart (SVG, with accessible data table)
- Map with cluster / pin markers

### Validation

- All data endpoints must respond in ≤ 2 s; widgets showing stale/no data show an error state with retry link.
- Overdue calculation requires JOIN to `categories.slaDays`; tickets in categories with `slaDays = NULL` are excluded from the overdue count.

### Error States

| Scenario | User Behavior |
|---|---|
| Stat API failure | Card shows "—" with retry icon |
| Recent cases API failure | Feed shows error state with retry button |
| Chart API failure | Chart area shows "Chart unavailable" |
| Map tile load failure | Map shows error tile; pin data may still load |
| Mapbox key absent | Leaflet / OSM tiles render automatically |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Stat card counts |
| GET | `/api/dashboard/chart` | Donut chart data |
| GET | `/api/geoclusters` | Cluster data for map widget |

### Schema Surface

- `tickets` — stat queries and recent feed
- `categories` — slaDays for overdue calculation
- `geoclusters`, `ticket_geodata` — map cluster data
---

## F6: People Management

**Priority:** P1 — High

### Description

The people management admin panel (`/admin/people`) allows administrators to manage all individuals in the system: staff, reporters, and contacts. A person record stores name, organization, address, department affiliation, role, and username. Related records manage multiple emails (with notification flags), phones, and addresses. Person records are used throughout the system as reporters and assignees on tickets.

### Terminology

- **Staff person** — A person with `role = 'admin'` or `role = 'staff'`; eligible for ticket assignment.
- **Reporter** — Any person who has submitted a ticket; may have `role = 'public'` or null.
- **Notification email** — `peopleEmails.usedForNotifications = true`; used for all automated email sends.
- **LDAP/CAS linkage** — `people.username` stores the LDAP UID or CAS principal name used for SSO login.

### Sub-features

- List all people with search (name, email, username) and role filter
- Create new person record
- Edit person record (inline)
- Delete person record (with confirmation and safety check)
- Manage multiple email addresses per person (with notification flag)
- Manage multiple phone numbers per person (with label)
- Manage multiple addresses per person (with label)
- Assign person to department
- Set username and role
- View all tickets reported by or assigned to a person (linked list)

### Process — List People

1. Staff navigates to `/admin/people`.
2. React issues `GET /api/people` with optional `q` (search) and `role` filter params.
3. Table renders: Name, Organization, Department, Role, Username, Email count, Actions (Edit / Delete).
4. Search input (300 ms debounce) filters by name, email, or username.
5. Role filter dropdown: All, Admin, Staff, Public.

### Process — Create Person

1. Staff clicks "New Person" button.
2. A Sheet (side drawer) opens with the create form.
3. Staff fills: first name, last name (or organization name), department, role, username.
4. Optionally adds email, phone, address records.
5. On save: `POST /api/people` with person data and nested email/phone/address arrays.
6. System creates `people` record and related `peopleEmails`, `peoplePhones`, `peopleAddresses` records.
7. Sheet closes; toast "Person created"; list refreshes.

### Process — Edit Person

1. Staff clicks "Edit" on a person row.
2. Sheet opens pre-filled with person data.
3. Staff modifies fields; sub-panels allow adding/removing emails, phones, addresses.
4. On save: `PUT /api/people/{id}` (full replace) or `PATCH /api/people/{id}` (partial update).
5. Related records sent as nested arrays; system reconciles (add new, update existing, delete removed).
6. Toast "Person updated"; sheet closes.

### Process — Delete Person

1. Staff clicks "Delete" on a person row.
2. Confirmation dialog: "Are you sure you want to delete {name}?"
3. If person is referenced as `enteredByPerson_id`, `reportedByPerson_id`, or `assignedPerson_id` on any ticket, system returns 409 and shows: "Cannot delete: this person is associated with {N} tickets."
4. If safe to delete: `DELETE /api/people/{id}` cascades to remove related email/phone/address records.
5. Toast "Person deleted"; list refreshes.

### Inputs — Person Record

| Field | Type | Required | Validation |
|---|---|---|---|
| `firstname` | string | [O] | Max 128 chars |
| `middlename` | string | [O] | Max 128 chars |
| `lastname` | string | [O] | Max 128 chars |
| `organization` | string | [O] | Max 128 chars |
| `address` | string | [O] | Max 128 chars (primary address on people record) |
| `city` | string | [O] | Max 128 chars |
| `state` | string | [O] | Max 128 chars |
| `zip` | string | [O] | Max 20 chars |
| `department_id` | integer | [O] | Must reference valid department |
| `username` | string | [O] | Max 40 chars; unique across all people |
| `role` | string | [O] | Enum: `admin`, `staff`, `public`, or null |

### Inputs — Email Record (peopleEmails)

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | [R] | Valid email format; max 255 chars |
| `label` | enum | [R] | Home, Work, Other |
| `usedForNotifications` | boolean | [R] | Default false |

### Inputs — Phone Record (peoplePhones)

| Field | Type | Required | Validation |
|---|---|---|---|
| `number` | string | [R] | Max 20 chars |
| `label` | enum | [R] | Main, Mobile, Work, Home, Fax, Pager, Other |

### Inputs — Address Record (peopleAddresses)

| Field | Type | Required | Validation |
|---|---|---|---|
| `address` | string | [R] | Max 128 chars |
| `city` | string | [O] | Max 128 chars |
| `state` | string | [O] | Max 128 chars |
| `zip` | string | [O] | Max 20 chars |
| `label` | enum | [R] | Home, Business, Rental |

### Validation Rules

- At least one of `firstname`, `lastname`, or `organization` must be provided.
- `username` must be unique; system returns 409 if duplicate.
- Emails with `usedForNotifications = true` must be valid email format.
- `role` must be one of the defined enum values or null.
- Only `admin` role users may set another user's role to `admin` or `staff`.
- Delete blocked if person has associated ticket records.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate username | 409 | "Username already in use" |
| Invalid email format | 400 | "Invalid email address" |
| Delete blocked by tickets | 409 | "Cannot delete: person has associated cases" |
| Person not found | 404 | "Person not found" |
| Unauthorized | 403 | "Admin role required" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/people` | List people (search, role filter, paginated) |
| POST | `/api/people` | Create person |
| GET | `/api/people/{id}` | Get person detail |
| PUT | `/api/people/{id}` | Update person (full replace) |
| DELETE | `/api/people/{id}` | Delete person |
| GET | `/api/people/{id}/tickets` | Tickets reported by or assigned to person |

### Schema Surface

- `people` — core entity
- `peopleEmails` — email addresses with notification flag
- `peoplePhones` — phone numbers
- `peopleAddresses` — physical addresses
- `departments` — department affiliation FK
---

## F7: Department Management

**Priority:** P1 — High

### Description

Departments are organizational units that own categories and receive ticket assignments. Each department can have a default assignee person. The department admin panel (`/admin/departments`) allows administrators to create, edit, and delete departments, manage their default person assignment, and view associated categories and action types.

### Terminology

- **Default person** — `departments.defaultPerson_id`; the person automatically assigned to new tickets in this department when no specific assignee is designated.
- **Department actions** — The set of action types allowed for this department, stored in `department_actions` (join table). Controls which action types appear in the case detail action log dropdown.
- **Department categories** — Categories associated with this department via `department_categories` (join table; in addition to the primary FK `categories.department_id`).

### Sub-features

- List departments (name, default person, category count)
- Create department
- Edit department (name, default person)
- Delete department (with safety check)
- View categories belonging to department
- Manage department-level action types (department_actions)
- Manage department-category associations (department_categories)
- Confirmation dialogs for delete

### Process — List Departments

1. Staff navigates to `/admin/departments`.
2. `GET /api/departments` returns all departments with name, default person, and category count.
3. Table renders: Department Name, Default Person, Categories count, Actions (Edit / Delete).

### Process — Create Department

1. Staff clicks "New Department".
2. Sheet opens with form: Name (required), Default Person (search/select from people, optional).
3. On save: `POST /api/departments` creates the record.
4. System creates `departments` record.
5. Toast "Department created"; list refreshes.

### Process — Edit Department

1. Staff clicks "Edit" on a department row.
2. Sheet opens pre-filled.
3. Sub-panels:
   - **Default Person**: search/select any person; clear button removes assignment.
   - **Action Types**: checklist of all `actions` records; checked actions saved to `department_actions`.
   - **Categories**: read-only list of categories where `categories.department_id = this department` (link to category admin).
4. On save: `PUT /api/departments/{id}` updates the record and reconciles `department_actions`.
5. Toast "Department updated".

### Process — Delete Department

1. Staff clicks "Delete" on a department row.
2. Confirmation dialog: "Delete {name}? This cannot be undone."
3. Safety check: if any `categories.department_id` references this department, system returns 409: "Cannot delete: department has associated categories."
4. If safe: `DELETE /api/departments/{id}` removes the record and cascades `department_actions` rows (cascade delete).
5. Toast "Department deleted".

### Inputs

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars; unique recommended |
| `defaultPerson_id` | integer | [O] | Must reference valid person |
| `action_ids` | integer[] | [O] | Array of action IDs for department_actions |

### Validation Rules

- `name` is required and max 128 chars.
- `defaultPerson_id` must reference an existing person if provided.
- Delete blocked if any category references this department.
- `action_ids` must reference existing action records; unknown IDs rejected with 400.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Missing name | 400 | "Department name is required" |
| Invalid defaultPerson_id | 400 | "Person not found" |
| Delete blocked by categories | 409 | "Cannot delete: department has categories" |
| Department not found | 404 | "Department not found" |
| Unauthorized | 403 | "Admin role required" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/departments` | List all departments |
| POST | `/api/departments` | Create department |
| GET | `/api/departments/{id}` | Department detail |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |
| GET | `/api/departments/{id}/categories` | Categories for department |

### Schema Surface

- `departments` — core entity
- `department_actions` — allowed action types (join table)
- `department_categories` — category associations (join table)
- `people` — default person FK
---

## F8: Category and Category Group Management

**Priority:** P1 — High

### Description

Categories classify service request types (e.g., "Pothole", "Graffiti"). Categories are grouped into Category Groups (e.g., "Streets", "Sanitation"). Each category belongs to a department, has permission levels controlling visibility, and can have a default assignee, SLA configuration, response templates, and auto-close behavior. The admin panel at `/admin/categories` manages the full taxonomy.

### Terminology

- **Category Group** (`categoryGroups`) — Top-level grouping of related categories. Used in the Open311 `group` field and in the public submission form's category picker.
- **displayPermissionLevel** — Controls who can *view* cases in this category: `staff`, `public`, `anonymous`.
- **postingPermissionLevel** — Controls who can *submit* cases in this category: `staff`, `public`, `anonymous`.
- **Featured** — `categories.featured = true`; highlights the category in the public submission form.
- **autoClose** — When `categories.autoCloseIsActive = true` and the system-configured auto-close interval elapses, tickets in this category are automatically closed with `autoCloseSubstatus_id`.
- **Category action response** — A response template body associated with a specific category + action type combination (`category_action_responses`). Used to pre-fill action notes on the case detail.

### Sub-features

- List category groups (with category count)
- Create / edit / delete category groups
- List categories within a group (or all categories)
- Create / edit / delete categories
- Assign category to department
- Set default person (assignee) for category
- Set display and posting permission levels
- Set active / featured flags
- Set SLA days
- Set notification reply email
- Configure auto-close substatus
- Manage category-level response templates (category_action_responses)
- Inline editing with toast notifications

### Process — List Category Groups

1. Staff navigates to `/admin/categories`.
2. `GET /api/category-groups` returns all groups with ordering and category count.
3. Groups are shown in `ordering` sequence with expand/collapse to show their categories.

### Process — Create/Edit Category Group

1. Staff clicks "New Group" or "Edit" on a group.
2. Form fields: `name` (required, max 50 chars), `ordering` (optional integer).
3. `POST /api/category-groups` or `PUT /api/category-groups/{id}`.
4. Toast "Category group saved"; list refreshes.

### Process — Delete Category Group

1. Confirmation dialog.
2. Safety check: if any `categories.categoryGroup_id` references this group → 409 "Cannot delete: group has categories."
3. If safe: `DELETE /api/category-groups/{id}`.

### Process — Create/Edit Category

1. Staff clicks "New Category" or "Edit" on a category row.
2. Sheet opens with full category form.
3. Sections:
   - **Basic**: name, description, department (required), category group, active, featured
   - **Permissions**: displayPermissionLevel, postingPermissionLevel
   - **Assignment**: defaultPerson_id
   - **SLA**: slaDays, notificationReplyEmail
   - **Auto-close**: autoCloseIsActive toggle, autoCloseSubstatus_id selector
   - **Response Templates**: list of `category_action_responses` — each row: action type selector + template textarea + replyEmail
4. On save: `POST /api/categories` or `PUT /api/categories/{id}`. Response templates sent as nested array; system reconciles.

### Process — Delete Category

1. Confirmation dialog.
2. Safety check: if any `tickets.category_id` references this category → 409 "Cannot delete: category has associated tickets."
3. If safe: `DELETE /api/categories/{id}`. Cascades `category_action_responses` rows.

### Inputs — Category Group

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 50 chars |
| `ordering` | integer | [O] | Positive integer; sets display order |

### Inputs — Category

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 50 chars |
| `description` | string | [O] | Max 512 chars |
| `department_id` | integer | [R] | Must reference valid department |
| `defaultPerson_id` | integer | [O] | Must reference valid person |
| `categoryGroup_id` | integer | [O] | Must reference valid category group |
| `active` | boolean | [O] | Default true |
| `featured` | boolean | [O] | Default false |
| `displayPermissionLevel` | enum | [R] | staff, public, anonymous; default staff |
| `postingPermissionLevel` | enum | [R] | staff, public, anonymous; default staff |
| `customFields` | text | [O] | JSON definition of custom form fields |
| `slaDays` | integer | [O] | Positive integer; days for SLA resolution |
| `notificationReplyEmail` | string | [O] | Max 128 chars; valid email format |
| `autoCloseIsActive` | boolean | [O] | Default false |
| `autoCloseSubstatus_id` | integer | [O] | Required if autoCloseIsActive is true |

### Inputs — Category Action Response (category_action_responses)

| Field | Type | Required | Validation |
|---|---|---|---|
| `action_id` | integer | [R] | Must reference valid action |
| `template` | text | [O] | Response body text |
| `replyEmail` | string | [O] | Max 128 chars; valid email format |

### Validation Rules

- Category `name` is required; max 50 chars.
- `department_id` is required for category; must exist.
- `displayPermissionLevel` must be one of: `staff`, `public`, `anonymous`.
- `postingPermissionLevel` must be one of: `staff`, `public`, `anonymous`.
- `postingPermissionLevel` must be ≥ permissive as `displayPermissionLevel` (cannot post without displaying).
- `autoCloseSubstatus_id` required when `autoCloseIsActive = true`.
- `notificationReplyEmail` must be valid email format if provided.
- Delete blocked if tickets reference the category.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Missing name | 400 | "Category name is required" |
| Invalid department_id | 400 | "Department not found" |
| Delete blocked by tickets | 409 | "Cannot delete: category has associated tickets" |
| Invalid permission level | 400 | "Invalid permission level value" |
| Category not found | 404 | "Category not found" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/category-groups` | List category groups |
| POST | `/api/category-groups` | Create category group |
| PUT | `/api/category-groups/{id}` | Update category group |
| DELETE | `/api/category-groups/{id}` | Delete category group |
| GET | `/api/categories` | List categories (filterable by group/department) |
| POST | `/api/categories` | Create category |
| GET | `/api/categories/{id}` | Category detail |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |
| GET | `/api/categories/public` | Public-postable categories (no auth) |

### Schema Surface

- `categories` — core entity
- `categoryGroups` — grouping
- `category_action_responses` — response templates per category+action
- `department_categories` — department-category associations
---

## F9: Action / Response Logging and Email Notifications

**Priority:** P0 — Critical

### Description

Every significant event on a ticket is recorded as an immutable action entry in `ticket_history`. Staff log responses (with optional email to the reporter), internal comments, and the system automatically records structural events (open, assign, close, category change, location change, duplicate marking, media upload). Response templates reduce repetitive data entry. Email notifications are dispatched via SMTP on configured action types.

### Terminology

- **Action type** — An entry in the `actions` lookup table. Has a `type` field: `system` (auto-generated by the application) or `department` (user-selectable in the log form).
- **System action** — Created automatically by the application during ticket operations (e.g., "open", "assignment", "closed", "changeCategory"). Staff cannot select system actions in the log form.
- **Department action** — An action type available for manual logging (e.g., "response", "comment", "upload_media"). Filtered by the department's allowed actions (`department_actions`).
- **Action person** — The person who is the subject of the action (e.g., the new assignee in an "assignment" action). Different from `enteredByPerson` (who logged the entry).
- **Entered by person** — The authenticated staff member who created the history entry.
- **Notification recipient** — A person whose notification email(s) (`usedForNotifications = true`) receive the email.
- **sentNotifications** — JSON blob stored in `ticket_history.sentNotifications` recording which email addresses were notified.

### Sub-features

- Automatic system action creation for all structural ticket events
- User-selectable department action logging from case detail
- Free-text notes field on all action entries
- Response template selector (pre-fills notes from `category_action_responses` or `actions.template`)
- Email notification toggle: notify reporter / notify assignee
- Email delivery via SMTP
- Full chronological action timeline on case detail (see F4)
- `sentNotifications` audit stored per history entry

### System Action Types (Auto-Created)

| Action Name | Trigger | Description Template |
|---|---|---|
| `open` | Ticket created or reopened | "Opened by {actionPerson}" |
| `assignment` | Assignee changed | "{enteredByPerson} assigned this case to {actionPerson}" |
| `closed` | Ticket status → closed | "Closed by {actionPerson}" |
| `changeCategory` | Category field edited | "Changed category from {original} to {updated}" |
| `changeLocation` | Location field edited | "Changed location from {original} to {updated}" |
| `response` | Staff logs response | "{actionPerson} contacted {reportedByPerson}" |
| `duplicate` | Ticket marked as duplicate | "{duplicate ticket} marked as a duplicate of this case" |
| `update` | Generic field update | "{enteredByPerson} updated this case." |
| `comment` | Internal comment logged | "{enteredByPerson} commented on this case." |
| `upload_media` | Media attached | "{enteredByPerson} uploaded an attachment." |

### Process — Log Department Action (Manual)

1. Staff opens case detail for an open ticket.
2. In the action log form (F4), staff selects action type from dropdown.
   - Dropdown shows only action types where `actions.type = 'department'` AND the action is in `department_actions` for the ticket's department.
   - Admin users see all department actions regardless of department filtering.
3. Optional: staff selects a response template. Loads from `category_action_responses` where `category_id = ticket.category_id AND action_id = selected_action_id`. If no category-specific template, loads from `actions.template`.
4. Staff enters or edits notes.
5. Staff toggles "Notify Reporter" and/or "Notify Assignee" checkboxes.
6. On "Submit": `POST /api/tickets/{id}/history` with payload.
7. System creates `ticket_history` record:
   - `ticket_id` = ticket ID
   - `enteredByPerson_id` = current authenticated user
   - `actionPerson_id` = current authenticated user (or designated person for assignment)
   - `action_id` = selected action
   - `enteredDate` = NOW()
   - `actionDate` = NOW()
   - `notes` = entered text
8. If "Notify Reporter" checked and reporter has a notification email: send email.
9. If "Notify Assignee" checked and assignee has a notification email: send email.
10. Store sent email addresses in `sentNotifications` JSON field.
11. New timeline entry appears at top of timeline on case detail.

### Process — System Action Creation

System actions are created programmatically during ticket operations. They follow the same `ticket_history` schema but are not user-selectable. The application creates them automatically:

- On `POST /api/tickets` → creates "open" action entry
- On `PATCH /api/tickets/{id}` with assignee change → creates "assignment" action entry
- On `POST /api/tickets/{id}/close` → creates "closed" action entry
- On `POST /api/tickets/{id}/reopen` → creates "open" action entry
- On category field change → creates "changeCategory" action entry
- On location field change → creates "changeLocation" action entry
- On duplicate substatus set → creates "duplicate" action entry
- On `POST /api/tickets/{id}/media` → creates "upload_media" action entry

### Inputs — Action Log Entry

| Field | Type | Required | Validation |
|---|---|---|---|
| `action_id` | integer | [R] | Must reference a `department` type action available to the ticket's department |
| `notes` | text | [O*] | Required when action type is `response` |
| `notifyReporter` | boolean | [O] | Default false |
| `notifyAssignee` | boolean | [O] | Default false |
| `actionPerson_id` | integer | [O] | Defaults to current user; used in "assignment" type |

### Email Notification Behavior

- Email is sent via configured SMTP server (host/port/credentials in Spring Boot application config).
- **Reply-to:** Use `category_action_responses.replyEmail` if set; else `actions.replyEmail` if set; else system default reply-to.
- **To:** Reporter's notification email(s) (if "Notify Reporter") + assignee's notification email(s) (if "Notify Assignee").
- **Subject:** "[uReport] Case #{id} — {action name}"
- **Body:** `ticket_history.notes` field content + standard case link footer.
- Emails are sent synchronously (or via a small async queue); failure is non-fatal: the history entry is saved regardless, and a warning is shown to the user.
- `sentNotifications` stores a JSON array of addresses actually sent to: `["reporter@email.com", "assignee@email.com"]`.

### Response Template Loading

1. API call: `GET /api/categories/{category_id}/action-responses/{action_id}` — returns template body and replyEmail if configured.
2. If no category-specific response exists, falls back to `GET /api/actions/{action_id}` which returns `actions.template`.
3. Template variables (`{actionPerson}`, `{reportedByPerson_id}`, etc.) are rendered server-side before returning to the frontend.

### Validation Rules

- `action_id` must reference a `department` type action (system actions cannot be manually created by users).
- The action must be permitted for the ticket's department (`department_actions`), unless the user role is `admin`.
- `notes` is required when `action_id` refers to the "response" action type.
- Notification emails can only be sent to persons with `peopleEmails.usedForNotifications = true`.
- Closed tickets: new actions can still be logged (audit trail continues after close).

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Invalid action_id | 400 | "Invalid action type" |
| Action not permitted for department | 403 | "This action is not available for the ticket's department" |
| Notes required but missing | 400 | "Notes are required for response actions" |
| Ticket not found | 404 | "Case not found" |
| SMTP failure | 200 | Action saved; toast "Email notification failed to send" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/tickets/{id}/history` | Get action timeline |
| POST | `/api/tickets/{id}/history` | Log action entry |
| GET | `/api/actions` | List all action types |
| GET | `/api/categories/{id}/action-responses/{actionId}` | Get response template |

### Schema Surface

- `ticket_history` — immutable action audit trail
- `actions` — action type lookup (system + department types)
- `department_actions` — allowed actions per department
- `category_action_responses` — response templates per category+action
- `peopleEmails` — notification email lookup
---

## F10: Media / Photo Attachment Upload

**Priority:** P1 — High

### Description

Staff and public submitters can attach photos to tickets. Staff can also attach photos to individual action log entries. The modernized media handling supports multi-file upload with thumbnail preview during upload, a photo gallery on the case detail, and a lightbox viewer for full-size photo review. All existing media records and stored file paths are preserved from the MySQL migration.

### Terminology

- **internalFilename** — A system-generated filename used for on-disk storage (separate from the original filename). Stored in `media.internalFilename`.
- **Lightbox** — A full-screen modal overlay showing a full-resolution image with navigation between multiple attachments.
- **Thumbnail** — A small (e.g., 150×150 px) version of an uploaded image displayed in the gallery grid.
- **File storage path** — Files are stored on disk at a configurable base path. The path structure includes the ticket ID: `{mediaRoot}/{ticket_id}/{internalFilename}`. The same path structure is preserved from the PHP implementation.

### Sub-features

- Multi-file upload input (drag-and-drop on desktop, native picker on mobile)
- Upload at ticket creation (bundled with ticket POST)
- Upload attached to action log entry (POST /api/tickets/{id}/media)
- Thumbnail preview during upload with progress indicator
- Photo gallery grid on case detail (all media for ticket)
- Lightbox viewer (previous/next navigation between photos)
- Delete media with confirmation
- Public submission photo upload (see F2)

### Process — Upload at Case Creation (Staff)

1. On the New Case form (`/cases/new`), a drag-and-drop zone and file picker button are provided.
2. Staff selects or drops files; thumbnails preview in the upload zone.
3. On ticket submit: files are sent as multipart form fields alongside ticket data to `POST /api/tickets`.
4. System saves ticket; then processes each file:
   - Generates `internalFilename` (UUID + file extension).
   - Saves file to disk at `{mediaRoot}/{ticket_id}/{internalFilename}`.
   - Creates `media` record: `ticket_id`, `filename` (original), `internalFilename`, `mime_type`, `person_id = current user`.
5. Returns created ticket with `mediaCount` in response.

### Process — Upload to Existing Ticket / Action

1. Staff on case detail clicks "Attach Photo" in the media gallery panel or in the action log form.
2. File picker opens; staff selects files.
3. `POST /api/tickets/{id}/media` with `multipart/form-data` containing one or more files.
4. System processes each file (same steps as above).
5. System creates an `upload_media` action entry in `ticket_history` (see F9 §System Action Types).
6. Gallery refreshes with new thumbnails; toast "Photo attached".

### Process — View Gallery / Lightbox

1. Case detail renders a photo gallery grid showing thumbnails of all `media` records for the ticket.
2. Thumbnails are sorted by `media.uploaded ASC`.
3. Clicking a thumbnail opens the lightbox overlay showing the full-resolution image.
4. Lightbox has previous/next buttons to navigate between photos.
5. Each photo shows: filename, upload date, uploader name.
6. Lightbox can be closed via "×" button or pressing Escape.

### Process — Delete Media

1. Staff hovers over a thumbnail; a delete button appears.
2. Confirmation dialog: "Delete this photo? This cannot be undone."
3. On confirm: `DELETE /api/tickets/{id}/media/{mediaId}`.
4. System removes the `media` record from the database.
5. File on disk is also deleted.
6. Gallery refreshes; toast "Photo deleted".

### Inputs

| Field | Type | Required | Validation |
|---|---|---|---|
| `files` | file[] | [R] | Min 1 file per upload request |
| `ticket_id` | integer | [R] | Path param; must reference existing ticket |
| `mime_type` | string | auto-detected | Must be: `image/jpeg`, `image/png`, `image/gif` |

**File constraints:**
- Maximum file size: 10 MB per file
- Accepted MIME types: `image/jpeg`, `image/png`, `image/gif`
- Maximum files per upload request: 10
- MIME type is validated by reading file magic bytes (not trusting Content-Type header alone)

### Outputs

- `media` record(s) created with ID, ticket_id, filename, internalFilename, mime_type, uploaded, person_id
- `ticket_history` entry for `upload_media` action (on staff upload)
- Thumbnail URL returned in response: `/api/media/{mediaId}/thumbnail`
- Full-size URL: `/api/media/{mediaId}`

### Media URL Scheme

| URL | Description |
|---|---|
| `GET /api/media/{mediaId}` | Full-resolution original file (streaming) |
| `GET /api/media/{mediaId}/thumbnail` | 150×150 thumbnail (generated on first request, cached) |

Authentication: media URLs for tickets with `displayPermissionLevel = 'staff'` require JWT. Media for public/anonymous tickets may be served without auth.

### Validation Rules

- File size: max 10 MB per file; reject with 413 if exceeded.
- MIME type: must be `image/jpeg`, `image/png`, or `image/gif`; validated by magic bytes.
- File count per request: max 10.
- `ticket_id` must reference an existing ticket.
- User must be authenticated to upload to staff-only tickets.
- Public submission uploads: permitted without auth (ticket in public/anonymous posting category).

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| File too large | 413 | "File exceeds maximum 10 MB size" |
| Unsupported MIME type | 415 | "Only JPEG, PNG, and GIF images are accepted" |
| Too many files | 400 | "Maximum 10 files per upload" |
| Ticket not found | 404 | "Case not found" |
| Disk write failure | 500 | "File storage error — contact administrator" |
| Media not found (DELETE) | 404 | "Photo not found" |

### API Surface

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/tickets/{id}/media` | JWT | Upload media to ticket |
| GET | `/api/tickets/{id}/media` | JWT* | List media for ticket |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | JWT | Delete media |
| GET | `/api/media/{mediaId}` | JWT* | Serve full-resolution file |
| GET | `/api/media/{mediaId}/thumbnail` | JWT* | Serve thumbnail |

*Auth required for staff-only tickets; public tickets served without auth.

### Schema Surface

- `media` — core entity: ticket_id, filename, internalFilename, mime_type, uploaded, person_id
---

## F11: PostgreSQL Full-Text Search (Solr Replacement)

**Priority:** P0 — Critical

### Description

Full-text search across tickets, people, and addresses is currently powered by Apache Solr. This feature replaces Solr with PostgreSQL `tsvector`/`tsquery` search with GIN indexes, delivering functionally equivalent search behavior. The `tickets` table gains a `search_vector` column maintained by a trigger. Search queries use `ts_headline` for highlighted snippets. Live search with 300 ms debounce is exposed via the internal `/api/tickets` endpoint's `q` parameter.

### Terminology

- **tsvector** — PostgreSQL data type representing a document as a weighted lexeme vector. Stored in `tickets.search_vector`.
- **tsquery** — PostgreSQL query type; constructed from user input using `plainto_tsquery()` (safe, handles arbitrary input without injection risk).
- **GIN index** — Generalized Inverted Index; optimal for tsvector columns. Enables sub-100 ms full-text queries.
- **ts_headline** — PostgreSQL function that returns a snippet of the original text with matching terms highlighted using `<b>` tags (or configurable markers).
- **Weight** — tsvector supports A/B/C/D weights to rank fields by importance. Higher-weighted fields rank higher in results.
- **Trigger** — A PostgreSQL trigger on INSERT/UPDATE of `tickets` maintains `search_vector` automatically.

### Sub-features

- `search_vector` tsvector column on `tickets` table (additive; no existing columns removed)
- GIN index on `search_vector` for query performance
- Database trigger to auto-update `search_vector` on ticket INSERT/UPDATE
- Fields included in search vector (with weights)
- Live search via `/api/tickets?q={term}` with 300 ms debounce
- `ts_headline` snippet returned in API response for highlighted matches
- Search combined with filter panel (AND semantics: search results filtered by active filters)
- Saved search bookmark persistence (see F3)

### Fields Included in Search Vector

| Field | Source Table | Weight | Notes |
|---|---|---|---|
| Ticket ID (as text) | `tickets.id` | A | Exact match on ID |
| Description | `tickets.description` | B | Primary content field |
| Address / Location | `tickets.location` | B | Street address search |
| Reporter last name | `people.lastname` | C | Via JOIN in trigger or indexed view |
| Reporter first name | `people.firstname` | C | |
| Category name | `categories.name` | C | Via JOIN |
| Action notes | (optional) | D | From recent ticket_history entries |

**Implementation note:** The trigger updates `search_vector` by JOINing to `people` (reporter) and `categories` when the ticket is inserted or updated. A separate batch job or trigger also updates `search_vector` when the reporter's name changes.

### tsvector Configuration

```sql
-- Trigger function (conceptual — full SQL in Y0-schema.md)
NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(reporter_lastname, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(reporter_firstname, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(category_name, '')), 'C');
```

Language: `'english'` (stemming + stop words for English). Configurable via application property.

### Process — Live Search (Case List)

1. Staff types in the search field in the case list.
2. After 300 ms debounce, React issues `GET /api/tickets?q={term}&{other_filters}`.
3. Spring Boot constructs: `WHERE tickets.search_vector @@ plainto_tsquery('english', :q)`.
4. Results are ordered by: `ts_rank_cd(search_vector, query) DESC, enteredDate DESC`.
5. Response includes `searchSnippet` field (ts_headline output) for each result.
6. React renders `<mark>` tags around highlighted terms in the description column.

### tsquery Construction

- User input is passed to `plainto_tsquery('english', :input)` — this function handles multiple words as AND semantics, ignores stop words, and is safe from injection.
- Multi-word queries: all terms must be present (AND).
- No special query syntax is exposed to users (no `AND`, `OR`, `NOT` operators in input).
- Empty search term: `q` parameter absent or blank → no full-text filter applied; all tickets returned (filtered by other active filters only).

### Search + Filter Combination

When both `q` and filter parameters are present, both conditions are applied with AND semantics:

```sql
WHERE search_vector @@ plainto_tsquery('english', :q)
  AND status = :status
  AND category_id = :categoryId
  -- ... other active filters
ORDER BY ts_rank_cd(search_vector, plainto_tsquery('english', :q)) DESC, enteredDate DESC
```

### ts_headline Configuration

```sql
ts_headline('english', description, query,
    'MaxWords=30, MinWords=10, ShortWord=3, StartSel=<mark>, StopSel=</mark>, HighlightAll=false')
```

The `searchSnippet` field in the API response is this ts_headline output. React renders it using `dangerouslySetInnerHTML` with appropriate XSS sanitization (the output is from our own database and is safe, but DOMPurify is applied as defense in depth).

### GIN Index

```sql
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);
```

This index is created in Flyway migration `V2__search_vector.sql` (separate from the initial schema migration).

### People and Address Search

- Ticket search covers reporter names and location address via the `search_vector` (updated by trigger).
- Dedicated `GET /api/people?q={term}` for the people admin panel uses a simpler `ILIKE` search on firstname, lastname, email (low volume; GIN search not needed).

### Performance Requirements

- Full-text search query P95 ≤ 500 ms under representative data volumes (single-city scale: up to ~100K tickets).
- GIN index must exist before going live; Flyway ensures it is created in migration.

### Saved Search / Bookmark

- When a staff member saves a search (see F3), the URL query string (including `q` and filter params) is stored in `bookmarks.requestUri`.
- Recalling a bookmark reconstructs the URL state; React reads params and re-issues the search.

### Validation

- Search term: max 255 characters; excess trimmed before passing to `plainto_tsquery`.
- `plainto_tsquery` handles all special characters safely; no additional escaping needed beyond the JDBC parameterized query.
- Empty/blank `q` is treated as absent (no FTS filter).

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| Empty search results | 200 | Empty state component in case list |
| tsquery parse error (malformed input) | 400 | Toast "Search term is invalid" |
| GIN index missing | — | Fallback to sequential scan (degraded performance, not a visible error) |

### API Surface

| Method | Path | Param | Description |
|---|---|---|---|
| GET | `/api/tickets` | `q` (string) | Full-text search in ticket list |
| GET | `/api/people` | `q` (string) | ILIKE search in people admin |

### Schema Surface

- `tickets.search_vector` — tsvector column (added by Flyway `V2__search_vector.sql`)
- GIN index: `idx_tickets_search_vector ON tickets USING GIN (search_vector)`
- Trigger: `update_search_vector` BEFORE INSERT OR UPDATE ON tickets
---

## F12: Authentication — LDAP and CAS

**Priority:** P0 — Critical

### Description

Staff authenticate via LDAP or CAS (Central Authentication Service). Public users submit cases without authentication. After successful LDAP/CAS authentication, Spring Security issues a JWT to the React frontend; the JWT is stored in an httpOnly cookie or in-memory (not localStorage, for XSS mitigation). Every subsequent internal API call includes the JWT for validation. Branded login screens replace PHP auth views.

### Terminology

- **CAS** — Central Authentication Service; a single sign-on protocol used by the municipality. Spring Security CAS extension handles the redirect/callback flow.
- **LDAP** — Lightweight Directory Access Protocol; alternative authentication for environments without CAS. Spring Security LDAP binds with user credentials.
- **JWT** — JSON Web Token. Issued by Spring Boot after successful auth; signed with HS256 (configurable secret). Contains: `sub` (username), `role`, `person_id`, `exp` (expiry).
- **httpOnly cookie** — Browser cookie not accessible to JavaScript; prevents XSS theft of JWT.
- **Refresh token** — A longer-lived token stored server-side; used to issue new JWTs without re-authentication. Stored in a `refresh_tokens` in-memory store or database table.
- **CAS service URL** — The URL of the uReport application registered with the CAS server; used in the CAS authentication redirect.
- **LDAP bind** — The process of authenticating a user by binding to the LDAP server with their credentials.

### Sub-features

- CAS authentication flow (redirect → callback → JWT issue)
- LDAP authentication flow (form-based → bind → JWT issue)
- Dual provider selection: CAS or LDAP (configurable per deployment)
- JWT issuance and validation on every protected API endpoint
- httpOnly cookie storage of JWT (XSS mitigation)
- JWT expiry: configurable (recommended 8 hours for staff sessions)
- Refresh token flow: silently renew JWT before expiry
- Branded login screen: city logo, CAS/LDAP tabs, loading spinner, error state
- Session expiry: redirect to login with return URL preserved
- Logout: invalidates JWT / refresh token; CAS single sign-out supported
- Account screen (`/account`): view and update own profile fields, notification email preferences
- Protected route guard: React redirects unauthenticated users to login

### Process — CAS Authentication

1. User navigates to a protected route (e.g., `/dashboard`).
2. React detects no valid JWT; redirects to `/login?returnTo={originalPath}`.
3. Login screen renders CAS login option.
4. User clicks "Sign in with CAS".
5. Browser redirects to CAS server URL: `{casServer}/login?service={ureportBaseUrl}/auth/cas/callback`.
6. User authenticates on CAS server (username + password on CAS UI).
7. CAS server redirects back to `{ureportBaseUrl}/auth/cas/callback?ticket={serviceTicket}`.
8. Spring Security CAS filter validates the service ticket with CAS server (`/serviceValidate`).
9. On success: Spring Security resolves the CAS principal (username).
10. System looks up `people` record where `people.username = principal`. If not found, creates a minimal `people` record.
11. Spring Boot issues JWT: `{sub: username, role: person.role, personId: person.id, exp: NOW + jwtExpirySeconds}`.
12. JWT is set as an httpOnly, SameSite=Strict cookie named `auth_token`.
13. Browser is redirected to `returnTo` path (or `/dashboard` if no `returnTo`).
14. React reads the presence of the cookie (not its value) to confirm authentication; loads the current user from `GET /api/auth/me`.

### Process — LDAP Authentication

1. User navigates to a protected route; redirected to `/login?returnTo={path}`.
2. Login screen renders LDAP form (username + password fields).
3. User submits credentials via `POST /api/auth/ldap` (JSON body: `{username, password}`).
4. Spring Security LDAP binds to the LDAP server with provided credentials.
5. On success: system looks up `people` record by username; creates if not found.
6. JWT issued; set as httpOnly cookie (same as step 12 above).
7. Response: `{personId, role, name}` (no JWT in body — only in cookie).
8. React redirects to `returnTo` path.

### Process — JWT Validation (Every Protected API Call)

1. React includes the httpOnly cookie automatically in every same-origin request.
2. Spring Security JWT filter extracts and validates the `auth_token` cookie on every request.
3. Validation: signature, expiry (`exp`), issuer (configured).
4. If valid: populates Spring Security `SecurityContext` with the authenticated principal.
5. If invalid or expired: returns 401 response.
6. React intercepts 401 response; redirects to `/login?returnTo={currentPath}`.

### Process — Token Refresh

1. React tracks JWT expiry time (from `GET /api/auth/me` response which includes `expiresAt`).
2. 5 minutes before expiry, React proactively calls `POST /api/auth/refresh`.
3. Spring Boot validates the refresh token (stored server-side or encoded in a second httpOnly cookie).
4. On success: issues a new JWT cookie with refreshed expiry.
5. If refresh fails (refresh token expired): React redirects to login.

### Process — Logout

1. User clicks "Sign Out" in the user menu.
2. React calls `POST /api/auth/logout`.
3. Spring Boot clears the `auth_token` cookie (Set-Cookie: expires=past) and invalidates the refresh token.
4. If CAS is in use: Spring Boot redirects to CAS logout URL for single sign-out: `{casServer}/logout?service={ureportBaseUrl}`.
5. React clears local auth state; redirects to `/login`.

### Protected vs. Public Routes

| Route Pattern | Auth Required |
|---|---|
| `/login` | Public |
| `/submit` | Public |
| `/open311/*` | Public (api_key for writes) |
| `/api/tickets/public` | Public |
| `/api/categories/public` | Public |
| `/api/geocode` | Public |
| `/dashboard`, `/cases/*`, `/admin/*`, `/account` | JWT Required |
| All other `/api/*` | JWT Required |

### Account Screen (`/account`)

- Shows current user's person record: name, email, phone, department, role.
- Editable fields: name fields, notification email preference (which email to use for notifications).
- `PATCH /api/people/{currentPersonId}` to save changes.
- Password change not managed here (handled by CAS/LDAP systems).

### JWT Claims

| Claim | Type | Description |
|---|---|---|
| `sub` | string | Username (LDAP UID or CAS principal) |
| `personId` | integer | `people.id` of the authenticated user |
| `role` | string | `admin`, `staff`, or `public` |
| `exp` | integer | Unix timestamp of expiry |
| `iat` | integer | Unix timestamp of issue time |
| `iss` | string | Issuer string (configurable; e.g., "ureport") |

### Inputs — LDAP Login

| Field | Type | Required | Validation |
|---|---|---|---|
| `username` | string | [R] | Max 40 chars |
| `password` | string | [R] | Min 1 char; never logged |

### Validation Rules

- JWT must be signed with the configured HS256 secret; tampered tokens are rejected.
- JWT expiry is enforced server-side; expired tokens return 401 regardless of cookie presence.
- LDAP bind errors (wrong password, account locked, server unavailable) return 401.
- CAS ticket must be validated with the CAS server; local ticket reuse is rejected by CAS.
- `returnTo` parameter must be a relative path on the same origin; absolute URLs rejected (open redirect prevention).

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| Invalid LDAP credentials | 401 | Login form shows "Invalid username or password" |
| LDAP server unavailable | 503 | Login form shows "Authentication service unavailable. Try again later." |
| CAS ticket validation failure | 401 | Redirect back to login with "Authentication failed" message |
| JWT expired | 401 | React redirects to login; returnTo preserved |
| Role insufficient for route | 403 | Shows "Access denied" page with link to dashboard |
| CAS server unavailable | 503 | Login page shows error; LDAP form still available |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/login` | Branded login page (React route) |
| POST | `/api/auth/ldap` | LDAP credential authentication |
| GET | `/auth/cas/callback` | CAS service ticket callback (Spring) |
| POST | `/api/auth/refresh` | Refresh JWT |
| POST | `/api/auth/logout` | Logout (clear cookie, invalidate refresh) |
| GET | `/api/auth/me` | Current user info + expiresAt |
| GET | `/account` | Account screen (React route) |
| PATCH | `/api/people/{id}` | Update own profile |

### Schema Surface

- `people` — user account records (username, role, department_id)
- `peopleEmails` — notification email preferences
- No dedicated auth tables required (JWT is stateless; refresh tokens stored in application memory or a simple in-process cache)
---

## F13: Admin Panels — Substatus, Issue Types, Response Templates, Contact Methods

**Priority:** P1 — High

### Description

A set of lookup-table admin panels manage configurable system values used throughout ticket creation and case management. These are infrequently-changed CRUD panels for: substatuses (refined ticket closure states), issue types (nature classification), response templates (canned action responses), and contact methods (reporter contact channel). All panels follow the same UX pattern: inline editing, toast notifications, and confirmation dialogs before delete.

### Terminology

- **Substatus** — A refined state applied when closing a ticket. System defaults: Resolved, Duplicate, Bogus. Custom substatuses can be created. Has a `status` field (`open` or `closed`) indicating the parent status it applies to.
- **isDefault** — `substatus.isDefault = true`; one substatus per `status` value can be flagged as the default selection in the close dialog.
- **Issue Type** — Classification of the nature of the service request (Comment, Complaint, Question, Report, Request, Violation). Set on a ticket at creation.
- **Response Template** — Pre-written action note text. Stored at the global level in `actions.template`. Category-specific templates are managed via `category_action_responses` (see F8).
- **Contact Method** — How the reporter contacted the city (Email, Phone, Web Form, Other, custom). Selected on a ticket record.

---

### F13.1: Substatus Management (`/admin/substatus`)

**Sub-features:** List, create, edit, delete substatus values; set isDefault flag.

**Process:**
1. List: `GET /api/substatuses` → table with columns: Name, Description, Status (open/closed), Default.
2. Create: "New Substatus" button opens Sheet form.
3. Edit: inline row editing or Sheet.
4. Delete: confirmation dialog. System prevents delete if `tickets.substatus_id` references this substatus (409).
5. isDefault: toggling to `true` on one substatus automatically sets `false` on all others with the same `status` value.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 25 chars; unique |
| `description` | string | [R] | Max 128 chars |
| `status` | enum | [R] | `open` or `closed` |
| `isDefault` | boolean | [O] | Default false |

**Validation:**
- Name max 25 chars; unique.
- Only one substatus per `status` value may have `isDefault = true`; saving with `isDefault = true` clears the flag on others.
- Cannot delete system-seeded substatuses (Resolved, Duplicate, Bogus) — these are essential for existing ticket data integrity.
- Delete blocked if tickets reference this substatus.

**Error States:**

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate name | 409 | "Substatus name already in use" |
| Delete blocked | 409 | "Cannot delete: substatus is in use by tickets" |
| Delete system substatus | 403 | "System substatuses cannot be deleted" |

---

### F13.2: Issue Type Management (`/admin/issue-types`)

**Sub-features:** List, create, edit, delete issue types.

**Process:**
1. List: `GET /api/issue-types` → table: Name, Actions.
2. Create: "New Issue Type" → Sheet or inline row append.
3. Edit: click name cell → inline edit → save on blur or Enter.
4. Delete: confirmation dialog. Blocked if `tickets.issueType_id` references this record.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars; unique |

**Validation:**
- Name required; max 128 chars; unique.
- System-seeded issue types (Comment, Complaint, Question, Report, Request, Violation) may be edited but not deleted.
- Delete blocked if tickets reference this issue type.

**Error States:**

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate name | 409 | "Issue type name already in use" |
| Delete blocked | 409 | "Cannot delete: issue type is in use by tickets" |

---

### F13.3: Response Template Management (`/admin/actions`)

**Description:** The `actions` table stores both system action types and their optional `template` body text. This panel allows admins to view all actions, edit template text for department-type actions, and set a `replyEmail` for responses.

**Note:** Category-specific response templates are managed under category admin (F8 §F8, category_action_responses). This panel manages the global fallback template on the `actions` record itself.

**Sub-features:** List actions, edit template body and replyEmail for department-type actions.

**Process:**
1. List: `GET /api/actions` → table: Name, Type (system/department), Template (truncated preview), Reply Email.
2. Edit: click row → Sheet with template textarea and replyEmail field.
3. System-type actions: template editable, but `name`, `type`, and `description` are read-only.
4. Department-type actions: all fields editable.
5. Create new department action: "New Action" button → Sheet → `POST /api/actions`.
6. Delete: only department-type actions; system actions cannot be deleted.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R for new] | Max 25 chars; unique |
| `description` | string | [R] | Max 128 chars |
| `type` | enum | [R for new] | `department` only (system set by code) |
| `template` | text | [O] | Free text |
| `replyEmail` | string | [O] | Valid email; max 128 chars |

**Validation:**
- System actions cannot be deleted.
- New actions must have `type = 'department'`.
- `replyEmail` must be valid email format.

---

### F13.4: Contact Method Management (`/admin/contact-methods`)

**Sub-features:** List, create, edit, delete contact methods.

**Process:**
1. List: `GET /api/contact-methods` → table: Name, Actions.
2. Create: "New Contact Method" → inline row append or Sheet.
3. Edit: inline row edit.
4. Delete: confirmation dialog. Blocked if `tickets.contactMethod_id` or `clients.contactMethod_id` references this record.

**Inputs:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars; unique |

**Validation:**
- Name required; max 128 chars; unique.
- System-seeded contact methods (Email, Phone, Web Form, Other) may be edited but not deleted.
- Delete blocked if any ticket or client references this contact method.

**Error States:**

| Scenario | HTTP Status | Message |
|---|---|---|
| Duplicate name | 409 | "Contact method name already in use" |
| Delete blocked | 409 | "Cannot delete: contact method is in use" |

---

### Shared UX Pattern for All Lookup Admin Panels

- **Loading:** Skeleton table rows shown during data fetch.
- **Save feedback:** Toast notification "Saved" or "Deleted" on success.
- **Error feedback:** Toast notification with error message on failure.
- **Confirmation dialog:** shadcn/ui `AlertDialog` with destructive button styling for all delete operations.
- **Inline editing:** Optional row-level inline editing for simple single-field records (issue types, contact methods). Sheet drawer used for multi-field records (substatus, actions).

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/substatuses` | List substatuses |
| POST | `/api/substatuses` | Create substatus |
| PUT | `/api/substatuses/{id}` | Update substatus |
| DELETE | `/api/substatuses/{id}` | Delete substatus |
| GET | `/api/issue-types` | List issue types |
| POST | `/api/issue-types` | Create issue type |
| PUT | `/api/issue-types/{id}` | Update issue type |
| DELETE | `/api/issue-types/{id}` | Delete issue type |
| GET | `/api/actions` | List action types |
| POST | `/api/actions` | Create department action |
| PUT | `/api/actions/{id}` | Update action (template, replyEmail) |
| DELETE | `/api/actions/{id}` | Delete department action |
| GET | `/api/contact-methods` | List contact methods |
| POST | `/api/contact-methods` | Create contact method |
| PUT | `/api/contact-methods/{id}` | Update contact method |
| DELETE | `/api/contact-methods/{id}` | Delete contact method |

### Schema Surface

- `substatus` — substatus lookup
- `issueTypes` — issue type lookup
- `actions` — action type lookup with template
- `contactMethods` — contact method lookup
---

## F14: Client / API Key Management

**Priority:** P1 — High

### Description

External Open311 clients (mobile apps, third-party 311 aggregators) are registered in the system with a name, URL, API key, contact person, and contact method. The admin panel at `/admin/clients` manages these client records. The API key is validated by the Spring Boot Open311 controller on every `POST /open311/v2/requests` call.

### Terminology

- **Client** — An external organization or application that integrates with the uReport Open311 API. Stored in `clients` table.
- **API key** — A unique secret string (UUID format) stored in `clients.api_key`. Required for Open311 write operations. Passed via `api_key` query parameter or `X-Api-Key` header.
- **OBSOLETE_API_KEYS** — A configurable list (application config) of deprecated API keys that trigger the mobile shutdown notice (see F0). These keys are not deleted from the database but are listed in config.
- **Contact person** — A `people` record associated with the client as the technical contact (`clients.contactPerson_id`).

### Sub-features

- List all client records (name, URL, API key masked, contact person, contact method)
- Create new client (generate API key)
- Edit client record
- Delete client record (with confirmation)
- Display full API key (reveal button, with copy to clipboard)
- Regenerate API key (generates new UUID, old key immediately invalidated)
- API key validation in Spring Security filter for POST /open311/v2/requests

### Process — List Clients

1. Staff navigates to `/admin/clients`.
2. `GET /api/clients` returns all client records.
3. Table columns: Name, URL, API Key (masked: `{first6}...{last4}`), Contact Person, Contact Method, Actions (Edit / Delete).

### Process — Create Client

1. Staff clicks "New Client".
2. Sheet opens with form.
3. Staff fills: name (required), URL, contact person (search/select from people), contact method.
4. API key is auto-generated as a UUID on save (not entered by staff).
5. `POST /api/clients` creates the record.
6. Sheet closes; the newly generated API key is displayed in a one-time reveal dialog with a "Copy" button.
7. Toast "Client created. Copy the API key — it will be masked after this dialog."

### Process — Edit Client

1. Staff clicks "Edit" on a client row.
2. Sheet opens pre-filled with name, URL, contact person, contact method.
3. API key field: shown masked with a "Reveal" button (requires confirming intent).
4. "Regenerate API Key" button available; confirmation dialog: "This will invalidate the existing API key. Continue?"
5. On regenerate confirm: new UUID generated; displayed once; old key immediately invalid.
6. `PUT /api/clients/{id}` saves changes.

### Process — Delete Client

1. Staff clicks "Delete" on a client row.
2. Confirmation dialog: "Delete client {name}? Their API key will immediately stop working."
3. `DELETE /api/clients/{id}` removes the record.
4. Any future request with the deleted key returns 403.
5. Toast "Client deleted".

### API Key Validation (Spring Security Filter)

1. On `POST /open311/v2/requests`: Spring Security filter extracts `api_key` query param or `X-Api-Key` header.
2. Queries `SELECT id FROM clients WHERE api_key = :key` (with a prepared statement; exact match required).
3. If found: sets `client_id` on the request context; allows the request.
4. If not found: returns `HTTP 403 Forbidden` with error body `{"errors":[{"code":"clients/unknownClient","description":"Invalid API key"}]}`.
5. OBSOLETE_API_KEYS check: if the key is in the configured obsolete list, request proceeds but the service list will return the shutdown notice (handled in F0 §F0.1).

### Inputs

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | [R] | Max 128 chars |
| `url` | string | [O] | Valid URL; max 255 chars |
| `api_key` | string | auto-generated | UUID (v4); unique |
| `contactPerson_id` | integer | [R] | Must reference existing person |
| `contactMethod_id` | integer | [O] | Must reference existing contact method |

### Validation Rules

- `name` is required; max 128 chars.
- `contactPerson_id` must reference an existing `people` record.
- `api_key` is generated server-side as a UUID; staff cannot set it manually.
- `url` must be a valid URL if provided.
- API key uniqueness enforced by database unique constraint on `clients.api_key`.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| Missing name | 400 | "Client name is required" |
| Invalid contactPerson_id | 400 | "Contact person not found" |
| Invalid URL | 400 | "Invalid URL format" |
| Client not found | 404 | "Client not found" |
| Unauthorized | 403 | "Admin role required" |
| Invalid API key (Open311) | 403 | "Invalid API key" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/clients` | List all clients |
| POST | `/api/clients` | Create client (API key auto-generated) |
| GET | `/api/clients/{id}` | Client detail |
| PUT | `/api/clients/{id}` | Update client |
| POST | `/api/clients/{id}/regenerate-key` | Regenerate API key |
| DELETE | `/api/clients/{id}` | Delete client |

### Schema Surface

- `clients` — core entity (name, url, api_key, contactPerson_id, contactMethod_id)
- `people` — contact person FK
- `contactMethods` — contact method FK
---

## F15: Metrics and Reporting

**Priority:** P2 — Medium

### Description

The metrics and reporting screens give administrators and supervisors quantitative insight into 311 service request volume, response times, and category distribution. The modernized reporting preserves the existing PHP Reports and Metrics screens with the same calculated fields and route structure. Routes: `/metrics` and `/reports`.

### Terminology

- **Resolution time** — Time from `tickets.enteredDate` to `tickets.closedDate` for closed tickets (in hours or days).
- **Volume** — Count of tickets in a given time period.
- **Date range filter** — Applies to `enteredDate` for all volume/resolution metrics.
- **Export** — CSV download of the current report dataset.

### Sub-features

- Case volume over time (daily, weekly, monthly counts)
- Average resolution time by category and department
- Open vs. closed case ratio
- Cases by category breakdown
- Cases by department breakdown
- Cases by assignee breakdown
- Date range filter for all reports
- Export to CSV
- Metrics page (`/metrics`) distinct from Reports page (`/reports`)

### Process — Metrics Page (`/metrics`)

1. Staff navigates to `/metrics`.
2. Date range picker defaults to "Last 30 days".
3. React issues `GET /api/metrics?start={date}&end={date}`.
4. Response includes:
   - `volumeByDay`: array of `{date, count}` for chart
   - `openCount`: current open ticket count
   - `closedCount`: tickets closed in date range
   - `avgResolutionHours`: average resolution time in hours for closed tickets in range
   - `overdueCount`: currently open tickets past SLA
5. Volume chart renders as a line/bar chart (SVG or Recharts).
6. KPI tiles show the aggregate numbers.
7. Date range change triggers re-fetch.

### Process — Reports Page (`/reports`)

1. Staff navigates to `/reports`.
2. Report type selector: By Category / By Department / By Assignee.
3. Date range filter.
4. `GET /api/reports?groupBy={category|department|assignee}&start={date}&end={date}`.
5. Response: array of `{groupName, openCount, closedCount, avgResolutionHours}`.
6. Renders as a sortable table.
7. "Export CSV" button: `GET /api/reports/export?groupBy=...&start=...&end=...` → downloads CSV.

### Metrics API Response Schema

```json
{
  "volumeByDay": [{"date": "2026-07-01", "count": 12}, ...],
  "openCount": 145,
  "closedCount": 87,
  "avgResolutionHours": 48.5,
  "overdueCount": 23,
  "dateRange": {"start": "2026-06-06", "end": "2026-07-06"}
}
```

### Reports API Response Schema

```json
{
  "groupBy": "category",
  "rows": [
    {"groupId": 3, "groupName": "Pothole", "openCount": 12, "closedCount": 45, "avgResolutionHours": 72.0},
    ...
  ],
  "dateRange": {"start": "2026-06-06", "end": "2026-07-06"}
}
```

### SQL Patterns

**Volume by day:**
```sql
SELECT DATE(entered_date) as date, COUNT(*) as count
FROM tickets
WHERE entered_date BETWEEN :start AND :end
GROUP BY DATE(entered_date)
ORDER BY date ASC;
```

**Average resolution time:**
```sql
SELECT AVG(EXTRACT(EPOCH FROM (closed_date - entered_date))/3600) as avg_hours
FROM tickets
WHERE status = 'closed'
  AND entered_date BETWEEN :start AND :end;
```

**By category:**
```sql
SELECT c.name, 
       SUM(CASE WHEN t.status='open' THEN 1 ELSE 0 END) as open_count,
       SUM(CASE WHEN t.status='closed' THEN 1 ELSE 0 END) as closed_count,
       AVG(CASE WHEN t.status='closed' THEN EXTRACT(EPOCH FROM (t.closed_date - t.entered_date))/3600 END) as avg_hours
FROM tickets t JOIN categories c ON t.category_id = c.id
WHERE t.entered_date BETWEEN :start AND :end
GROUP BY c.id, c.name
ORDER BY open_count DESC;
```

### Inputs

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `start` | date (YYYY-MM-DD) | [R] | Must be ≤ `end` |
| `end` | date (YYYY-MM-DD) | [R] | Must be ≥ `start` |
| `groupBy` | string | [O on /metrics] | `category`, `department`, or `assignee` |

### Outputs

- Metrics: KPI numbers + volumeByDay array for charting
- Reports: grouped table data + sortable table rendering
- CSV export file (Content-Disposition: attachment)

### Validation

- Date range: `start` ≤ `end`; both required.
- Max date range: 12 months (to prevent excessively expensive queries); if exceeded, return 400 with message.
- `groupBy` must be one of: `category`, `department`, `assignee`.

### Error States

| Scenario | HTTP Status | Message |
|---|---|---|
| start > end | 400 | "Start date must be before end date" |
| Date range > 12 months | 400 | "Date range cannot exceed 12 months" |
| Invalid groupBy | 400 | "Invalid groupBy value" |
| No data in range | 200 | Empty dataset; table shows "No data for this period" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/metrics` | KPI metrics + volume by day |
| GET | `/api/reports` | Grouped report data |
| GET | `/api/reports/export` | CSV export |

### Schema Surface

- `tickets` — primary query source (enteredDate, closedDate, status, category_id, assignedPerson_id)
- `categories` — groupBy category join
- `departments` — groupBy department join (via categories.department_id)
- `people` — groupBy assignee join
---

## F16: Geo-Clustering for Map Views

**Priority:** P2 — Medium

### Description

The application pre-computes geographic clusters of ticket pins so map views remain legible in dense urban areas. The `geoclusters` table stores cluster center points at multiple zoom levels (0–6). The `ticket_geodata` join table links each ticket to its cluster membership at each zoom level. The map widget on the dashboard and the case detail map use this data to render clustered and individual pins via Mapbox GL JS or Leaflet.

### Terminology

- **Geocluster** — A pre-computed geographic cluster of nearby tickets at a given zoom level. Stored in `geoclusters`.
- **Zoom level** — Integer 0–6 corresponding to map zoom tiers. Level 0 = widest cluster; level 6 = finest cluster (near individual pins).
- **ticket_geodata** — Join table linking `tickets.id` to `geoclusters.id` at each zoom level (cluster_id_0 through cluster_id_6).
- **Cluster center** — A `POINT` geometry (lat/lon) stored in `geoclusters.center` representing the centroid of the cluster.

### Sub-features

- Pre-computed cluster data migrated from MySQL `geoclusters` and `ticket_geodata` to PostgreSQL
- Dashboard map widget: cluster pins at low zoom, individual pins at high zoom
- Cluster bubble shows constituent ticket count
- Cluster click zooms in one level
- Individual pin click opens case preview popover (ticket ID, category, status, link to detail)
- Case detail map: single ticket location pin (no clustering needed)
- Dashboard cluster data served via `GET /api/geoclusters`

### Process — Dashboard Map Rendering

1. Map widget loads; initial zoom level determined from browser (default: city center, zoom 11 → use cluster_id_3 or cluster_id_4 tier).
2. React issues `GET /api/geoclusters?zoom={level}`.
3. API returns cluster centers and ticket counts for the requested zoom tier.
4. Map renders cluster bubbles at each center point; bubble label shows count.
5. User zooms in: map fires zoom event; React issues new `GET /api/geoclusters?zoom={newLevel}`.
6. At highest zoom level (6) or zoom > 14: `GET /api/tickets?status=open&pageSize=500` fetched for individual pins.
7. Clicking a cluster: map zooms to `zoom + 1`; cluster expands.
8. Clicking an individual pin: popover opens with: Case #{id}, Category, Status, "View Case" link.

### Process — Cluster Data API

```
GET /api/geoclusters?zoom={0-6}
```

Response:
```json
{
  "zoom": 4,
  "clusters": [
    {"id": 12, "lat": 39.165, "lon": -86.526, "count": 23},
    {"id": 13, "lat": 39.170, "lon": -86.531, "count": 8},
    ...
  ]
}
```

The `count` for each cluster is computed by:
```sql
SELECT tg.cluster_id_4 as cluster_id, COUNT(*) as count, g.center
FROM ticket_geodata tg
JOIN geoclusters g ON g.id = tg.cluster_id_4
JOIN tickets t ON t.id = tg.ticket_id
WHERE t.status = 'open'
GROUP BY tg.cluster_id_4, g.center;
```

(Zoom parameter maps to `cluster_id_{zoom}` column dynamically, whitelisted server-side.)

### Process — Case Detail Map

1. Case detail page loads; map widget renders with a single marker at `tickets.latitude`, `tickets.longitude`.
2. No clustering; static single pin.
3. Map is informational (view only, not interactive for editing on this screen).
4. Location editing on case detail uses the inline field edit (F4), not the map.

### PostgreSQL Spatial Support

- The `geoclusters.center` column uses PostgreSQL `POINT` type (not PostGIS; keeping parity with MySQL `POINT` type).
- Spatial index on `center` column is recreated in Flyway migration.
- If PostGIS is available in the environment, the type may be upgraded to `geometry(Point, 4326)` in a later migration.
- For now: `POINT` type with a functional GiST index or sp-GiST index is acceptable.

### Inputs

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `zoom` | integer | [R] | 0–6; values outside range clamped to valid range |
| `status` | string | [O] | `open` or `closed`; default `open` |

### Outputs

- Array of cluster objects: id, lat, lon, count
- At zoom > max cluster level: individual ticket pins from ticket list endpoint

### Validation

- `zoom` must be 0–6; values outside this range clamped to [0, 6].
- Only open tickets are clustered by default; `status` param overrides.

### Error States

| Scenario | HTTP Status | Behavior |
|---|---|---|
| Mapbox key absent | — | Leaflet/OSM tile fallback; cluster data still loads |
| Cluster API failure | 500 | Map shows error state; retry button available |
| Ticket at null lat/lon | — | Ticket excluded from map display (not in ticket_geodata) |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/geoclusters` | Cluster data for map widget |

### Schema Surface

- `geoclusters` — cluster center points by zoom level
- `ticket_geodata` — per-ticket cluster membership at each zoom level
---

## F17: Design System and UI Framework

**Priority:** P0 — Critical

### Description

The React frontend is built on a custom design system defined by Tailwind CSS configuration, shadcn/ui components, and CSS variable design tokens. It is not a feature users interact with directly but is the technical foundation enabling visual consistency, theming (light/dark), accessibility, and animation across every screen. All UI feature implementations (F2–F6, F12, F13, etc.) depend on this system.

### Terminology

- **Design tokens** — Named CSS custom properties (`--color-primary`, `--radius-md`, etc.) defined on `:root` and overridden on `.dark`. All component styles reference tokens, never hardcoded values.
- **shadcn/ui** — A set of accessible, unstyled (primitives) React components built on Radix UI, styled via Tailwind. Components are vendored (copied, not imported) into the project for full customization.
- **Tailwind CSS** — Utility-first CSS framework. Extended with custom color palette, spacing scale, and shadow tokens.
- **4 px grid** — All spacing, padding, margin, and sizing values are multiples of 4 px (Tailwind `space-1` = 4 px).
- **3-tier shadow system** — `shadow-sm` (low elevation: inputs, cards), `shadow-md` (medium: dropdowns, panels), `shadow-lg` (high: modals, toasts).
- **Framer Motion** — React animation library. Used for page transitions, stagger children, and micro-interactions.
- **prefers-reduced-motion** — CSS/JS media query. When active, all Framer Motion animations are disabled globally via a single `AnimationProvider` that reads the media query and passes `{duration: 0}` to all motion variants.

### Sub-features

- Tailwind CSS custom configuration
- CSS variable design token system (light/dark mode)
- shadcn/ui component customizations
- Typography: Inter (UI text) + JetBrains Mono (IDs, codes)
- 4 px base grid
- 3-tier elevation shadow system
- Dark mode: `prefers-color-scheme` media query + manual toggle; persisted to localStorage
- Framer Motion animation system: page transitions, stagger, micro-interactions; all ≤ 300 ms
- prefers-reduced-motion: disables all motion globally

### Design Token System

All tokens are CSS custom properties on `:root` (light) and `.dark` (dark mode class on `<html>`):

**Color Tokens:**
```css
:root {
  --color-primary: hsl(221, 83%, 53%);       /* City brand blue */
  --color-primary-foreground: hsl(0, 0%, 100%);
  --color-secondary: hsl(210, 40%, 96%);
  --color-secondary-foreground: hsl(222, 47%, 11%);
  --color-destructive: hsl(0, 84%, 60%);
  --color-destructive-foreground: hsl(0, 0%, 100%);
  --color-muted: hsl(210, 40%, 96%);
  --color-muted-foreground: hsl(215, 16%, 47%);
  --color-accent: hsl(210, 40%, 96%);
  --color-background: hsl(0, 0%, 100%);
  --color-foreground: hsl(222, 47%, 11%);
  --color-border: hsl(214, 32%, 91%);
  --color-ring: hsl(221, 83%, 53%);
  /* Status colors */
  --color-status-open: hsl(217, 91%, 60%);
  --color-status-resolved: hsl(142, 71%, 45%);
  --color-status-duplicate: hsl(215, 16%, 47%);
  --color-status-bogus: hsl(0, 84%, 60%);
}
.dark {
  --color-background: hsl(222, 47%, 11%);
  --color-foreground: hsl(210, 40%, 98%);
  --color-border: hsl(217, 32%, 18%);
  /* ... all tokens overridden for dark mode */
}
```

**Spacing:** Tailwind default scale (4 px base). No custom spacing tokens beyond Tailwind defaults.

**Border radius tokens:**
```css
:root {
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
}
```

### shadcn/ui Components (Required Set)

| Component | Usage |
|---|---|
| `Button` | All action buttons (primary, secondary, destructive, ghost, link variants) |
| `Dialog` | Confirmation dialogs, lightbox overlay (focus-trapped) |
| `AlertDialog` | Destructive confirmations (delete actions) |
| `Input` | Text inputs, search fields |
| `Textarea` | Notes/description fields |
| `Select` | Dropdown selectors |
| `Badge` | Status badge pills |
| `Card` | Dashboard stat cards, case list rows |
| `Table` | Case list, admin panel tables |
| `Skeleton` | Loading placeholders |
| `Toast` / `Toaster` | Success/error notifications |
| `Sheet` | Side drawer for create/edit forms |
| `Tabs` | Category/department sub-navigation |
| `Popover` | Map pin preview popovers |
| `Command` | Search combobox (assignee picker, person search) |
| `Breadcrumb` | Route breadcrumbs |
| `Avatar` | User avatar in navbar |

All components are customized to use CSS design tokens. Primary color, radius, and shadow are applied via Tailwind config referencing the CSS variables.

### Typography

| Context | Font | Tailwind Class |
|---|---|---|
| All UI text | Inter (Google Fonts) | `font-sans` |
| IDs, codes, monospace values | JetBrains Mono | `font-mono` |
| Heading 1 | Inter 700, 2rem | `text-3xl font-bold` |
| Heading 2 | Inter 600, 1.5rem | `text-2xl font-semibold` |
| Body | Inter 400, 1rem | `text-base` |
| Caption | Inter 400, 0.875rem | `text-sm text-muted-foreground` |
| Code / ID | JetBrains Mono 400, 0.875rem | `font-mono text-sm` |

### Framer Motion Animation Presets

All animations respect `prefers-reduced-motion`:
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = prefersReducedMotion ? 0 : 0.2; // max 300ms = 0.3s
```

**Page transition variant:**
```tsx
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};
```

**Stagger children (lists, cards):**
```tsx
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } }
};
```

**Multi-step form step transition:**
```tsx
const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.25 } },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0, transition: { duration: 0.2 } })
};
```

### Dark Mode

- **Detection:** On app init, read `localStorage.getItem('theme')`. If `'dark'`, add `.dark` class to `<html>`. If `'system'` or absent, read `prefers-color-scheme: dark` media query.
- **Manual toggle:** User clicks dark mode toggle in navbar → toggled value saved to `localStorage`.
- **Implementation:** `ThemeProvider` context wraps the app; provides `theme`, `setTheme` to all components.
- All colors are CSS variable references; no hardcoded colors in Tailwind classes (use semantic token names: `bg-background`, `text-foreground`, `border-border`, etc.).

### Validation / Quality Gates

- Contrast check: all text must meet WCAG AA ratio (4.5:1 normal, 3:1 large). Verified via automated axe-core scan.
- Animation durations: all Framer Motion variants must have `duration ≤ 0.3` seconds.
- `prefers-reduced-motion`: a Storybook / Playwright smoke test verifies that all animations have duration 0 when the media query is active.
- Dark mode: automated contrast scan passes for all tokens in `.dark` mode.

### Schema Surface

None — design system is frontend-only.

### API Surface

None — design system is frontend-only.
---

## F18: Navigation Shell — Navbar, Sidebar, Breadcrumbs, Mobile Drawer

**Priority:** P0 — Critical

### Description

The application chrome consists of four elements that wrap every authenticated screen: a persistent top navbar, a collapsible left admin sidebar, contextual breadcrumbs, and a mobile hamburger drawer. The shell provides consistent navigation, branding, and accessibility scaffolding for the entire authenticated experience.

### Terminology

- **Navbar** — The horizontal top bar fixed to the viewport top. Always visible.
- **Sidebar** — The vertical left navigation panel for admin links. Collapsible; state persisted to localStorage.
- **Breadcrumb** — A horizontal trail below the navbar showing the current route hierarchy.
- **Sheet drawer** — The shadcn/ui `Sheet` component used as the mobile hamburger menu (slides in from left).
- **Active route** — The sidebar link matching the current `window.location.pathname` is highlighted.
- **Skip link** — A visually-hidden-until-focused `<a href="#main-content">Skip to main content</a>` as the first focusable element in the DOM (accessibility).

### Sub-features

- Top navbar: city logo/name, global search trigger, user avatar + dropdown menu, dark mode toggle
- Collapsible left sidebar: admin navigation groups (Cases, Admin, Reports); collapse/expand with 200 ms slide transition; state persisted to localStorage
- Contextual breadcrumbs: below navbar, reflecting current route hierarchy; all crumbs are navigable links
- Mobile hamburger drawer: on viewport ≤ 768 px, hamburger button opens Sheet drawer with full nav links
- Active route highlighted in sidebar and drawer
- Skip-to-main-content link (first in DOM; visible on keyboard focus)

### Navbar Elements

| Element | Description |
|---|---|
| City logo + name | Links to `/dashboard`; SVG logo + text brand name |
| Global search trigger | Opens the Command palette (shadcn/ui Command component) for global case/person search |
| Notification bell | (Optional: preserved if PHP app has notifications; out of scope if not present in existing) |
| User avatar | Circular avatar (initials from `people.firstname + people.lastname` if no photo) |
| User dropdown menu | Items: "My Account" (`/account`), "Sign Out" (calls POST /api/auth/logout) |
| Dark mode toggle | Moon/sun icon; toggles `.dark` class; saves to localStorage |

### Sidebar Navigation Groups and Links

| Group | Link | Route |
|---|---|---|
| **Cases** | All Cases | `/cases` |
| **Cases** | New Case | `/cases/new` |
| **Cases** | Dashboard | `/dashboard` |
| **Admin** | People | `/admin/people` |
| **Admin** | Departments | `/admin/departments` |
| **Admin** | Categories | `/admin/categories` |
| **Admin** | Substatuses | `/admin/substatus` |
| **Admin** | Issue Types | `/admin/issue-types` |
| **Admin** | Contact Methods | `/admin/contact-methods` |
| **Admin** | API Clients | `/admin/clients` |
| **Admin** | Actions | `/admin/actions` |
| **Reports** | Metrics | `/metrics` |
| **Reports** | Reports | `/reports` |

Sidebar shows only links appropriate to the user's role:
- `staff` role: Cases group only
- `admin` role: All groups

### Sidebar Collapse Behavior

- Collapsed state: sidebar width collapses to icon-only view (icon + tooltip on hover).
- Expanded state: full icon + label.
- Toggle button at the bottom of the sidebar (or a `«` / `»` control).
- State stored in `localStorage` under key `sidebar_collapsed`.
- Collapse/expand animated with 200 ms CSS transition on `width`.
- At mobile breakpoint (≤ 768 px), sidebar is hidden entirely; hamburger drawer is used instead.

### Breadcrumb Rules

| Route | Breadcrumb |
|---|---|
| `/dashboard` | Dashboard |
| `/cases` | Cases |
| `/cases/new` | Cases > New Case |
| `/cases/{id}` | Cases > Case #{id} |
| `/admin/people` | Admin > People |
| `/admin/people/{id}` | Admin > People > {person name} |
| `/admin/departments` | Admin > Departments |
| `/admin/categories` | Admin > Categories |
| `/admin/substatus` | Admin > Substatuses |
| `/admin/issue-types` | Admin > Issue Types |
| `/admin/contact-methods` | Admin > Contact Methods |
| `/admin/clients` | Admin > API Clients |
| `/admin/actions` | Admin > Actions |
| `/metrics` | Reports > Metrics |
| `/reports` | Reports > Reports |
| `/account` | Account |

All crumbs except the last (current page) are `<a>` links. Current page is `aria-current="page"`.

### Mobile Drawer

- Visible at viewport ≤ 768 px.
- Hamburger icon in navbar opens Sheet from the left.
- Sheet contains all sidebar navigation links (with role-based filtering).
- Closing: click outside the Sheet, press Escape, or click a nav link.
- Focus trap is active while Sheet is open (shadcn/ui Sheet handles this).

### Skip Link

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded">
  Skip to main content
</a>
```

- The main content area has `id="main-content"` and `tabIndex={-1}`.

### Process — Rendering the Shell

1. `<AppShell>` component wraps all authenticated routes in React Router.
2. On mount: reads `sidebar_collapsed` from localStorage; sets initial sidebar state.
3. On mount: reads JWT cookie presence; if absent, redirects to `/login`.
4. `GET /api/auth/me` is called once on app load to populate the current user context (name, role, personId).
5. Navbar renders with user info from context.
6. Sidebar renders navigation groups filtered by user role.
7. Breadcrumb component reads `useLocation()` hook and computes the crumb trail from a static route→crumb map.

### Validation

- All nav links use React Router `<Link>` (not `<a href>`) for client-side navigation.
- Active state uses `NavLink` with `aria-current="page"` on the active link.
- Skip link must be the first focusable element in the DOM (Lighthouse/axe check).
- Focus indicators must be visible on all interactive shell elements (min 2 px outline).

### Error States

| Scenario | Behavior |
|---|---|
| `/api/auth/me` fails | Toast "Session error"; redirect to login |
| Unauthorized route access | Redirect to `/login?returnTo={path}` |
| Admin route accessed by staff role | Show "Access denied" page; link to `/cases` |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/me` | Current user info for shell rendering |

### Schema Surface

- `people` — current user name/role used in navbar and sidebar
---

## F19: Accessibility and Responsive Design

**Priority:** P0 — Critical

### Description

Every screen and component in the React frontend must meet WCAG 2.1 Level AA and Section 508 requirements. Accessibility is a design constraint from day one — not a post-launch retrofit. The application must be fully usable via keyboard navigation and screen readers. Responsive breakpoints at 375 px, 768 px, and 1280 px+ ensure usability across mobile, tablet, and desktop.

### Terminology

- **WCAG 2.1 AA** — Web Content Accessibility Guidelines version 2.1, Level AA. The applicable conformance target.
- **Section 508** — U.S. federal accessibility law; the relevant standard for government applications.
- **axe-core** — Open-source accessibility testing engine. Automated scans run in CI; target: 0 critical/serious violations.
- **Focus indicator** — The visible outline on a focused interactive element. Must be ≥ 2 px, high-contrast.
- **ARIA** — Accessible Rich Internet Applications; HTML attributes for describing dynamic content to assistive technologies.
- **Live region** — An ARIA region (`aria-live="polite"` or `aria-live="assertive"`) that causes screen readers to announce changes without the user moving focus.
- **Touch target** — The minimum tappable area for a UI element on mobile. WCAG requires ≥ 44 × 44 px.

### WCAG 2.1 AA Requirements (Selected Key Rules)

| Criterion | Requirement | Implementation |
|---|---|---|
| 1.1.1 Non-text content | All images have text alternatives | `alt` on all `<img>`; decorative images get `alt=""` |
| 1.3.1 Info and Relationships | Structure conveyed by HTML semantics | Semantic HTML: `<main>`, `<nav>`, `<header>`, `<table>`, `<form>` + `<label>` |
| 1.4.3 Contrast (minimum) | Normal text ≥ 4.5:1; large text ≥ 3:1 | Verified via design token palette; automated axe scan |
| 1.4.4 Resize text | Text resizable to 200% without loss | Relative units (rem/em); no fixed-height containers that clip text |
| 2.1.1 Keyboard | All functionality keyboard-accessible | All interactive elements reachable and operable via keyboard |
| 2.1.2 No keyboard trap | Focus is never trapped outside a dialog | shadcn/ui Dialog and Sheet handle focus trapping correctly |
| 2.4.1 Bypass Blocks | Mechanism to bypass nav | Skip-to-main-content link (see F18) |
| 2.4.3 Focus Order | Focus order is meaningful | DOM order matches visual order; no tabindex > 0 |
| 2.4.4 Link Purpose | Link purpose identifiable from text or context | Avoid "click here" links; all links have descriptive text or aria-label |
| 2.4.6 Headings | Headings and labels are descriptive | Proper heading hierarchy (h1 → h2 → h3); no skipped levels |
| 2.4.7 Focus Visible | Keyboard focus indicator visible | 2 px solid outline on `:focus-visible`; never `outline: none` |
| 3.1.1 Language of Page | Page language identified | `<html lang="en">` |
| 3.3.1 Error Identification | Form errors described in text | Inline error messages with `aria-describedby` |
| 3.3.2 Labels or Instructions | Inputs have associated labels | `<label for>` or `aria-label` on all inputs |
| 4.1.2 Name, Role, Value | All UI components have accessible names and states | ARIA roles, labels, `aria-expanded`, `aria-selected` on custom components |
| 4.1.3 Status Messages | Status messages announced to screen readers | Toast notifications use `aria-live="polite"`; errors use `aria-live="assertive"` |

### Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|---|---|---|
| Mobile | 375 px | Single-column; hamburger drawer; stacked case detail; touch targets ≥ 44 px |
| Tablet | 768 px | Two-column dashboard grid; sidebar hidden (hamburger); case detail may still be stacked |
| Desktop | 1280 px+ | Full sidebar; split-pane case detail; two-column admin panels |

**No horizontal scroll** at any breakpoint. All tables use responsive patterns (horizontal scroll container or card-stack on mobile).

**Touch targets:** All interactive elements (buttons, links, checkboxes, toggle switches) have a minimum clickable area of 44 × 44 px on mobile viewports, achieved via padding even if the visual element is smaller.

### Component-Level Accessibility Requirements

**Forms (New Case, Public Submission, Admin Panels):**
- Every `<input>` and `<select>` has an associated `<label>` (using `for`/`id` pairing or wrapping `<label>`).
- Required fields marked with `aria-required="true"` and a visual asterisk (*) with sr-only explanation.
- Inline validation errors use `aria-describedby` pointing to an error message element with `role="alert"`.

**Tables (Case List, Admin Lists):**
- `<table>` with `<thead>` and `<th scope="col">` for column headers.
- Sortable columns: `aria-sort="ascending"` / `aria-sort="descending"` / `aria-sort="none"` on `<th>`.
- Bulk select checkbox in header: `aria-label="Select all cases"`.

**Dialogs (Confirmations, Lightbox):**
- Focus trapped inside `Dialog` while open (shadcn/ui handles this via Radix UI).
- `aria-labelledby` pointing to dialog title; `aria-describedby` pointing to dialog body.
- Escape key closes all dialogs.
- Focus returns to the trigger element on close.

**Status Badge Pills:**
- Not conveyed by color alone: badge text ("Open", "Resolved") is always visible.
- `aria-label` on badge if text is abbreviated.

**Maps (Dashboard, Case Detail):**
- Map iframe/canvas has `aria-label="Map showing case locations"`.
- Map controls (zoom in/out) are keyboard-accessible.
- All case information available without the map (data table / case list as alternative).

**Skeleton Loaders:**
- `aria-busy="true"` on the container while loading; `aria-live="polite"` region announces when content is loaded.
- Screen readers announced "Loading cases..." → "42 cases loaded."

**Toast Notifications:**
- Use `role="status"` and `aria-live="polite"` for success messages.
- Use `role="alert"` and `aria-live="assertive"` for errors.
- Auto-dismiss timeout ≥ 5 seconds; dismiss button provided.

### Keyboard Navigation

All user flows must be completable using only a keyboard:
- **Tab**: move forward through focusable elements
- **Shift+Tab**: move backward
- **Enter / Space**: activate buttons and links
- **Arrow keys**: navigate Select options, Table rows, Map zoom controls
- **Escape**: close dialogs, drawers, popovers, lightbox

### Testing Requirements

| Tool | When | Pass Criterion |
|---|---|---|
| axe-core (automated) | CI on every PR | 0 critical or serious violations |
| Lighthouse (automated) | CI | Accessibility score ≥ 90 |
| Keyboard navigation audit (manual) | Before each release | All core workflows completable by keyboard only |
| Screen reader test (manual) | Before each release | NVDA/JAWS on Windows; VoiceOver on macOS/iOS |
| Color contrast check (automated) | axe-core covers this | 0 contrast violations |
| Touch target check | Responsive viewport test | All targets ≥ 44 × 44 px at 375 px |

### API Surface

None — accessibility is a frontend-only cross-cutting concern.

### Schema Surface

None.
---

## F20: OpenAPI / Swagger API Documentation

**Priority:** P1 — High

### Description

All Spring Boot REST endpoints — both the internal React-to-API routes and the frozen Open311 endpoints — are documented via OpenAPI 3.0 using springdoc-openapi. The Swagger UI is accessible at a known URL, enabling developer exploration and integration testing. The OpenAPI spec is exportable as JSON or YAML for client code generation.

### Terminology

- **springdoc-openapi** — Spring Boot library that auto-generates OpenAPI 3.0 spec from controller annotations and exports it at `/v3/api-docs`.
- **Swagger UI** — Browser-based API explorer served at `/swagger-ui.html`.
- **`@Operation`** — springdoc annotation documenting a controller method.
- **`@ApiResponse`** — springdoc annotation documenting possible HTTP responses for an endpoint.
- **`@Schema`** — springdoc annotation documenting a DTO or model field.
- **Bearer token** — JWT authentication scheme; documented in OpenAPI securitySchemes.

### Sub-features

- springdoc-openapi integrated in Spring Boot application
- All controllers annotated with `@Operation`, `@ApiResponse`, `@Schema`
- OpenAPI 3.0 spec generated at `/v3/api-docs` (JSON)
- OpenAPI YAML at `/v3/api-docs.yaml`
- Swagger UI at `/swagger-ui.html`
- Open311 endpoints documented with GeoReport v2 field descriptions and frozen-contract note
- JWT Bearer authentication scheme documented and usable in Swagger UI (Authorize button)
- Spec exportable as JSON/YAML
- API tags grouping endpoints by feature domain

### Process — Spec Generation

1. springdoc-openapi scans all `@RestController` classes on Spring Boot startup.
2. For each `@RequestMapping` method, it reads `@Operation` for summary/description, `@ApiResponse` for response schemas, and `@Schema` on DTOs for field documentation.
3. The generated spec is served at `/v3/api-docs`.
4. Swagger UI at `/swagger-ui.html` loads the spec and renders the interactive explorer.
5. Developers can click "Authorize" and enter their JWT to make authenticated test calls from the UI.

### API Tags (Grouping)

| Tag | Endpoints Covered |
|---|---|
| `Open311` | /open311/v2/* |
| `Tickets` | /api/tickets/* |
| `People` | /api/people/* |
| `Departments` | /api/departments/* |
| `Categories` | /api/categories/*, /api/category-groups/* |
| `Actions` | /api/actions/*, /api/tickets/{id}/history |
| `Media` | /api/media/*, /api/tickets/{id}/media |
| `Auth` | /api/auth/* |
| `Admin` | /api/substatuses/*, /api/issue-types/*, /api/contact-methods/*, /api/clients/* |
| `Dashboard` | /api/dashboard/*, /api/geoclusters |
| `Bookmarks` | /api/bookmarks/* |
| `Reports` | /api/metrics, /api/reports/* |

### Security Scheme in OpenAPI Spec

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "JWT issued by POST /api/auth/ldap or CAS callback. Include in Authorization header: Bearer {token}. Alternatively, the httpOnly cookie auth_token is used automatically by browsers."
security:
  - BearerAuth: []
```

Open311 endpoints (`/open311/v2/*`) have `security: []` (no auth for reads; api_key param for writes documented as a query parameter, not a security scheme).

### Controller Annotation Requirements

Every controller method must have:
```java
@Operation(
    summary = "Short summary (≤100 chars)",
    description = "Longer description explaining behavior, side effects, and special cases."
)
@ApiResponse(responseCode = "200", description = "Success", content = @Content(schema = @Schema(implementation = TicketDto.class)))
@ApiResponse(responseCode = "400", description = "Validation error")
@ApiResponse(responseCode = "401", description = "Authentication required")
@ApiResponse(responseCode = "403", description = "Insufficient permissions")
@ApiResponse(responseCode = "404", description = "Resource not found")
```

DTO fields must have:
```java
@Schema(description = "The unique ticket ID", example = "12345")
private Long id;
```

### Coverage Requirement

100% of controller methods must be annotated. CI check: `mvn verify -Dspringdoc.api-docs.enabled=true` and validate that the generated spec contains an entry for every known endpoint path.

### Swagger UI Configuration

```yaml
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: alpha
    tagsSorter: alpha
    tryItOutEnabled: true
    filter: true
  api-docs:
    path: /v3/api-docs
  show-actuator: false
  default-produces-media-type: application/json
```

### Access Control

- In production: Swagger UI and `/v3/api-docs` should be accessible only from internal network (configurable via Spring Security path matchers).
- In development: accessible without authentication.
- Configuration: `springdoc.swagger-ui.enabled` and `springdoc.api-docs.enabled` properties control visibility per environment.

### Open311 Documentation Note

All Open311 endpoints must include in their `@Operation.description`:
> "**Frozen Contract:** This endpoint implements the Open311 / GeoReport v2 specification. Its path, HTTP method, query parameters, and response format are frozen and must not change. External clients are deployed against this contract."

### Validation

- All `@ApiResponse` annotations must cover at least: 200, 400, 401, 403, 404.
- All DTO fields with business semantics must have `@Schema(description = ...)`.
- CI build fails if any controller method is missing `@Operation`.

### Error States

| Scenario | Behavior |
|---|---|
| Swagger UI inaccessible in prod | Developer contacts admin; internal network access required |
| Spec generation fails at startup | Spring Boot startup fails with descriptive error; fix annotations |

### API Surface

| URL | Description |
|---|---|
| `GET /v3/api-docs` | OpenAPI 3.0 spec (JSON) |
| `GET /v3/api-docs.yaml` | OpenAPI 3.0 spec (YAML) |
| `GET /swagger-ui.html` | Swagger UI explorer |

### Schema Surface

None — documentation only.
---

## F21: Database Migration — MySQL to PostgreSQL (Flyway)

**Priority:** P0 — Critical

### Description

The existing MySQL schema (18 tables, all data) is migrated to PostgreSQL using Flyway versioned migration scripts. The PostgreSQL schema preserves all tables, columns, constraints, and relationships from the MySQL schema. No data may be lost; no table or column may be dropped. An additional `search_vector` tsvector column is added to `tickets` (additive, non-destructive). All data from the existing production MySQL database is imported via a one-time migration script.

### Terminology

- **Flyway** — Database schema migration tool. Scans `src/main/resources/db/migration/` for `V{n}__{description}.sql` files; executes each once in version order; tracks applied migrations in `flyway_schema_history` table.
- **V1__initial_schema.sql** — The baseline Flyway migration that creates all 18 tables in PostgreSQL.
- **V2__search_vector.sql** — Adds `search_vector` column, GIN index, and trigger to `tickets` table.
- **Migration validation script** — A script run after data import that verifies row counts between MySQL export and PostgreSQL for all 18 tables.
- **Type mapping** — Converting MySQL data types to PostgreSQL equivalents (see table below).

### Flyway Migration Files

| File | Contents |
|---|---|
| `V1__initial_schema.sql` | All 18 tables with PKs, FKs, unique constraints, indexes |
| `V2__search_vector.sql` | `tickets.search_vector` tsvector column + GIN index + update trigger |
| `V3__seed_data.sql` | Seed data inserts (contactMethods, substatus, actions, issueTypes, categoryGroups) |
| `R__procedures.sql` | Repeatable migration: utility functions if needed |

### Data Type Mapping (MySQL → PostgreSQL)

| MySQL Type | PostgreSQL Type | Notes |
|---|---|---|
| `INT UNSIGNED AUTO_INCREMENT` | `SERIAL` or `INTEGER GENERATED ALWAYS AS IDENTITY` | PK sequences |
| `INT UNSIGNED` (FK) | `INTEGER` | FK columns |
| `TINYINT(1) UNSIGNED` / `BOOL` | `BOOLEAN` | `0`→`false`, `1`→`true` |
| `TINYINT UNSIGNED` | `SMALLINT` | e.g., `categoryGroups.ordering` |
| `VARCHAR(n)` | `VARCHAR(n)` | Direct mapping |
| `TEXT` | `TEXT` | Direct mapping |
| `DATETIME` | `TIMESTAMP` | `enteredDate`, `actionDate` |
| `TIMESTAMP` | `TIMESTAMPTZ` | `lastModified`, `uploaded`, `closedDate` |
| `FLOAT(17,14)` | `DOUBLE PRECISION` | `tickets.latitude`, `tickets.longitude` |
| `ENUM('a','b','c')` | `VARCHAR(n) CHECK (col IN ('a','b','c'))` | Or custom `CREATE TYPE` |
| `POINT` | `POINT` | `geoclusters.center`; native PostgreSQL POINT type |
| `TINYINT UNSIGNED` (ordering) | `SMALLINT` | Non-nullable variants |

### 18 Tables in Scope for Migration

| Table | Notes |
|---|---|
| `people` | Core person entity |
| `departments` | Organizational units |
| `peopleEmails` | Email addresses with notification flag |
| `peoplePhones` | Phone numbers |
| `peopleAddresses` | Physical addresses |
| `contactMethods` | Contact method lookup (seeded) |
| `clients` | Open311 API clients |
| `substatus` | Substatus lookup (seeded) |
| `actions` | Action type lookup (seeded) |
| `categoryGroups` | Category groupings (seeded) |
| `categories` | Service request categories |
| `category_action_responses` | Per-category response templates |
| `department_actions` | Allowed actions per department (join table) |
| `department_categories` | Department-category associations (join table) |
| `tickets` | Core ticket entity |
| `issueTypes` | Issue type lookup (seeded) |
| `ticketHistory` | Ticket action history |
| `media` | Photo attachments |
| `bookmarks` | Saved searches |
| `geoclusters` | Pre-computed geo clusters |
| `ticket_geodata` | Per-ticket cluster membership |

*(Note: `version` table from MySQL is not migrated; Flyway provides its own version tracking.)*

### V1 Schema Notes (PostgreSQL-Specific)

1. **ENUM types**: MySQL ENUMs are converted to PostgreSQL `VARCHAR(n)` columns with `CHECK` constraints. Example:
   ```sql
   role VARCHAR(30) CHECK (role IN ('admin', 'staff', 'public'))
   ```
2. **AUTO_INCREMENT**: Replaced by PostgreSQL `SERIAL` or `GENERATED ALWAYS AS IDENTITY`:
   ```sql
   id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
   ```
3. **FK circular dependency** (`departments` ↔ `people`): Handled by creating both tables, then adding the FK in a subsequent `ALTER TABLE` (same order as MySQL script using `foreign_key_checks=0` equivalent).
4. **`POINT` type**: PostgreSQL native `POINT` type used. Spatial index: `CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center)`.
5. **`CURRENT_TIMESTAMP`**: Same in PostgreSQL; `DEFAULT CURRENT_TIMESTAMP` works as-is.
6. **`bool` type**: PostgreSQL `BOOLEAN` with default `false` or `true` as appropriate.
7. **Case sensitivity**: PostgreSQL unquoted identifiers are lowercase. All column names in the PHP app were mixed-case; the Spring Boot JPA entity field mappings use `@Column(name = "camelCaseName")` to preserve the original column names with quoted identifiers.

### V2 Search Vector Migration

```sql
-- V2__search_vector.sql
ALTER TABLE tickets ADD COLUMN search_vector tsvector;

CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

CREATE OR REPLACE FUNCTION update_ticket_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector
BEFORE INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_ticket_search_vector();

-- Backfill search_vector for existing rows
UPDATE tickets SET search_vector =
    setweight(to_tsvector('english', coalesce(id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B');
```

### One-Time Data Migration Process

1. **Export MySQL data:** `mysqldump --no-create-info --complete-insert {database} > data_export.sql`
2. **Convert SQL:** A Python/sed conversion script translates MySQL INSERT syntax to PostgreSQL-compatible syntax:
   - Remove MySQL backtick quoting → double-quote or no quotes
   - Convert `\0` TINYINT to `false`/`true` boolean literals
   - Convert `0000-00-00 00:00:00` dates to `NULL`
   - Handle MySQL-specific functions (`NOW()` is compatible; others handled case-by-case)
3. **Import to PostgreSQL:** `psql {database} < data_converted.sql`
4. **Backfill search_vector:** Run UPDATE statement (see V2 above).
5. **Run validation script:** Compare row counts table by table between MySQL and PostgreSQL; fail if any mismatch.

### Validation Script Requirements

```
For each of the 18 tables:
  mysql_count = SELECT COUNT(*) FROM {table} [on source MySQL]
  pg_count    = SELECT COUNT(*) FROM {table} [on target PostgreSQL]
  assert mysql_count == pg_count, "Row count mismatch on {table}: MySQL={mysql_count}, PG={pg_count}"

FK integrity check: SELECT COUNT(*) should be 0 for each FK relationship where referenced ID does not exist.
```

### Constraints

- Zero rows lost: row count equality required for all 18 tables.
- Zero columns dropped: every column in mysql.sql must exist in the PostgreSQL schema.
- Zero FK violations: all foreign key constraints must be satisfied after data import.
- Flyway `baseline` is not used; clean PostgreSQL instance bootstrapped purely from `flyway migrate`.
- All future schema changes must be implemented as new Flyway versioned migrations (`V4__`, `V5__`, etc.).

### Error States

| Scenario | Resolution |
|---|---|
| Row count mismatch on table | Investigate conversion script; re-run import |
| FK constraint violation in PostgreSQL | Find orphaned row; either fix reference or null the FK (data quality issue) |
| Flyway checksum mismatch | Never modify applied migration files; create a new migration to fix |
| ENUM conversion error | Verify CHECK constraint values match all values in source data |
| POINT conversion error | Verify geoclusters.center data format; may need coordinate extraction |

### API Surface

None — migration is infrastructure/ops only.

### Schema Surface

All 18 tables — full PostgreSQL DDL in `Y0-schema.md`.
---

## Y0: Database Schema — Full PostgreSQL DDL

This section contains the complete PostgreSQL DDL for all 18 migrated tables plus the `search_vector` addition. This is the authoritative schema reference for Spring Data JPA entity definitions and Flyway migration `V1__initial_schema.sql`.

**Source:** `crm/scripts/mysql.sql` (authoritative MySQL reference)  
**Target:** PostgreSQL 15+  
**Migration tool:** Flyway

---

### V1__initial_schema.sql (All 18 Tables)

```sql
-- ============================================================
-- uReport CRM — PostgreSQL Schema
-- Migrated from MySQL by Flyway V1__initial_schema.sql
-- ============================================================

-- Disable FK checks temporarily via deferred constraints
SET CONSTRAINTS ALL DEFERRED;

-- ============================================================
-- departments (defined before people due to circular FK)
-- ============================================================
CREATE TABLE departments (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    defaultPerson_id  INTEGER
    -- FK to people added below after people table creation
);

-- ============================================================
-- people
-- ============================================================
CREATE TABLE people (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    firstname      VARCHAR(128),
    middlename     VARCHAR(128),
    lastname       VARCHAR(128),
    organization   VARCHAR(128),
    address        VARCHAR(128),
    city           VARCHAR(128),
    state          VARCHAR(128),
    zip            VARCHAR(20),
    department_id  INTEGER,
    username       VARCHAR(40) UNIQUE,
    role           VARCHAR(30) CHECK (role IN ('admin', 'staff', 'public')),
    CONSTRAINT FK_people_department_id FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Add deferred FK from departments back to people
ALTER TABLE departments
    ADD CONSTRAINT FK_departments_defaultPerson_id
    FOREIGN KEY (defaultPerson_id) REFERENCES people(id)
    DEFERRABLE INITIALLY DEFERRED;

-- ============================================================
-- peopleEmails
-- ============================================================
CREATE TABLE "peopleEmails" (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id            INTEGER NOT NULL,
    email                VARCHAR(255) NOT NULL,
    label                VARCHAR(10) NOT NULL DEFAULT 'Other'
                             CHECK (label IN ('Home', 'Work', 'Other')),
    "usedForNotifications" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_peopleEmails_person_id" FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- peoplePhones
-- ============================================================
CREATE TABLE "peoplePhones" (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id INTEGER NOT NULL,
    number    VARCHAR(20),
    label     VARCHAR(10) NOT NULL DEFAULT 'Other'
                  CHECK (label IN ('Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other')),
    CONSTRAINT "FK_peoplePhones_person_id" FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- peopleAddresses
-- ============================================================
CREATE TABLE "peopleAddresses" (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id INTEGER NOT NULL,
    address   VARCHAR(128) NOT NULL,
    city      VARCHAR(128),
    state     VARCHAR(128),
    zip       VARCHAR(20),
    label     VARCHAR(10) NOT NULL DEFAULT 'Home'
                  CHECK (label IN ('Home', 'Business', 'Rental')),
    CONSTRAINT "FK_peopleAddresses_person_id" FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- contactMethods
-- ============================================================
CREATE TABLE "contactMethods" (
    id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO "contactMethods" (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');

-- ============================================================
-- clients (Open311 API clients)
-- ============================================================
CREATE TABLE clients (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              VARCHAR(128) NOT NULL,
    url               VARCHAR(255),
    api_key           VARCHAR(50) NOT NULL UNIQUE,
    "contactPerson_id" INTEGER NOT NULL,
    "contactMethod_id" INTEGER,
    CONSTRAINT "FK_clients_contactPerson_id" FOREIGN KEY ("contactPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_clients_contactMethod_id" FOREIGN KEY ("contactMethod_id") REFERENCES "contactMethods"(id)
);

-- ============================================================
-- substatus
-- ============================================================
CREATE TABLE substatus (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(25) NOT NULL,
    description VARCHAR(128) NOT NULL,
    status      VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    "isDefault" BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO substatus (status, name, description) VALUES
    ('closed', 'Resolved',  'This ticket has been taken care of'),
    ('closed', 'Duplicate', 'This ticket is a duplicate of another ticket'),
    ('closed', 'Bogus',     'This ticket is not actually a problem or has already been taken care of');

-- ============================================================
-- actions (action type lookup)
-- ============================================================
CREATE TABLE actions (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(25) NOT NULL,
    description VARCHAR(128) NOT NULL,
    type        VARCHAR(15) NOT NULL DEFAULT 'department' CHECK (type IN ('system', 'department')),
    template    TEXT,
    "replyEmail" VARCHAR(128)
);
INSERT INTO actions (name, type, description) VALUES
    ('open',           'system', 'Opened by {actionPerson}'),
    ('assignment',     'system', '{enteredByPerson} assigned this case to {actionPerson}'),
    ('closed',         'system', 'Closed by {actionPerson}'),
    ('changeCategory', 'system', 'Changed category from {original:category_id} to {updated:category_id}'),
    ('changeLocation', 'system', 'Changed location from {original:location} to {updated:location}'),
    ('response',       'system', '{actionPerson} contacted {reportedByPerson_id}'),
    ('duplicate',      'system', '{duplicate:ticket_id} marked as a duplicate of this case.'),
    ('update',         'system', '{enteredByPerson} updated this case.'),
    ('comment',        'system', '{enteredByPerson} commented on this case.'),
    ('upload_media',   'system', '{enteredByPerson} uploaded an attachment.');

-- ============================================================
-- categoryGroups
-- ============================================================
CREATE TABLE "categoryGroups" (
    id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     VARCHAR(50) NOT NULL,
    ordering SMALLINT
);
INSERT INTO "categoryGroups" (name) VALUES ('Streets'), ('Sanitation'), ('Other');

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE categories (
    id                       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                     VARCHAR(50) NOT NULL,
    description              VARCHAR(512),
    department_id            INTEGER NOT NULL,
    "defaultPerson_id"       INTEGER,
    "categoryGroup_id"       INTEGER,
    active                   BOOLEAN,
    featured                 BOOLEAN,
    "displayPermissionLevel"  VARCHAR(15) NOT NULL DEFAULT 'staff'
                                 CHECK ("displayPermissionLevel" IN ('staff', 'public', 'anonymous')),
    "postingPermissionLevel"  VARCHAR(15) NOT NULL DEFAULT 'staff'
                                 CHECK ("postingPermissionLevel" IN ('staff', 'public', 'anonymous')),
    "customFields"           TEXT,
    "lastModified"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slaDays"                INTEGER CHECK ("slaDays" > 0),
    "notificationReplyEmail" VARCHAR(128),
    "autoCloseIsActive"      BOOLEAN,
    "autoCloseSubstatus_id"  INTEGER,
    CONSTRAINT FK_categories_department_id    FOREIGN KEY (department_id)      REFERENCES departments(id),
    CONSTRAINT "FK_categories_defaultPerson_id" FOREIGN KEY ("defaultPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_categories_categoryGroup_id" FOREIGN KEY ("categoryGroup_id") REFERENCES "categoryGroups"(id)
);

-- ============================================================
-- category_action_responses
-- ============================================================
CREATE TABLE category_action_responses (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id INTEGER NOT NULL,
    action_id   INTEGER NOT NULL,
    template    TEXT,
    "replyEmail" VARCHAR(128),
    CONSTRAINT FK_car_category_id FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT FK_car_action_id   FOREIGN KEY (action_id)   REFERENCES actions(id)
);

-- ============================================================
-- department_actions (join table)
-- ============================================================
CREATE TABLE department_actions (
    department_id INTEGER NOT NULL,
    action_id     INTEGER NOT NULL,
    PRIMARY KEY (department_id, action_id),
    CONSTRAINT FK_da_department_id FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT FK_da_action_id     FOREIGN KEY (action_id)     REFERENCES actions(id)
);

-- ============================================================
-- department_categories (join table)
-- ============================================================
CREATE TABLE department_categories (
    department_id INTEGER NOT NULL,
    category_id   INTEGER NOT NULL,
    PRIMARY KEY (department_id, category_id),
    CONSTRAINT FK_dc_department_id FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT FK_dc_category_id   FOREIGN KEY (category_id)   REFERENCES categories(id)
);

-- ============================================================
-- issueTypes
-- ============================================================
CREATE TABLE "issueTypes" (
    id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);
INSERT INTO "issueTypes" (name) VALUES
    ('Comment'), ('Complaint'), ('Question'), ('Report'), ('Request'), ('Violation');

-- ============================================================
-- tickets (core entity)
-- ============================================================
CREATE TABLE tickets (
    id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_id             INTEGER,
    category_id           INTEGER,
    "issueType_id"        INTEGER,
    client_id             INTEGER,
    "enteredByPerson_id"  INTEGER,
    "reportedByPerson_id" INTEGER,
    "assignedPerson_id"   INTEGER,
    "contactMethod_id"    INTEGER,
    "responseMethod_id"   INTEGER,
    "enteredDate"         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addressId"           INTEGER,
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    location              VARCHAR(128),
    city                  VARCHAR(128),
    state                 VARCHAR(128),
    zip                   VARCHAR(40),
    status                VARCHAR(20) NOT NULL DEFAULT 'open',
    "closedDate"          TIMESTAMPTZ,
    substatus_id          INTEGER,
    "additionalFields"    VARCHAR(255),
    "customFields"        TEXT,
    description           TEXT,
    CONSTRAINT FK_tickets_parent_id          FOREIGN KEY (parent_id)             REFERENCES tickets(id),
    CONSTRAINT FK_tickets_category_id        FOREIGN KEY (category_id)           REFERENCES categories(id),
    CONSTRAINT FK_tickets_client_id          FOREIGN KEY (client_id)             REFERENCES clients(id),
    CONSTRAINT "FK_tickets_enteredByPerson_id" FOREIGN KEY ("enteredByPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_tickets_assignedPerson_id"  FOREIGN KEY ("assignedPerson_id")  REFERENCES people(id),
    CONSTRAINT FK_tickets_substatus_id       FOREIGN KEY (substatus_id)          REFERENCES substatus(id)
);

CREATE INDEX idx_tickets_status      ON tickets (status);
CREATE INDEX idx_tickets_category_id ON tickets (category_id);
CREATE INDEX idx_tickets_entered_date ON tickets ("enteredDate");
CREATE INDEX idx_tickets_assigned_person ON tickets ("assignedPerson_id");

-- ============================================================
-- ticketHistory (action audit trail)
-- ============================================================
CREATE TABLE "ticketHistory" (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id            INTEGER NOT NULL,
    "enteredByPerson_id" INTEGER,
    "actionPerson_id"    INTEGER,
    action_id            INTEGER NOT NULL,
    "enteredDate"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionDate"         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes                TEXT,
    data                 TEXT,
    "sentNotifications"  TEXT,
    CONSTRAINT "FK_ticketHistory_ticket_id"          FOREIGN KEY (ticket_id)            REFERENCES tickets(id),
    CONSTRAINT "FK_ticketHistory_enteredByPerson_id" FOREIGN KEY ("enteredByPerson_id") REFERENCES people(id),
    CONSTRAINT "FK_ticketHistory_actionPerson_id"    FOREIGN KEY ("actionPerson_id")    REFERENCES people(id),
    CONSTRAINT "FK_ticketHistory_action_id"          FOREIGN KEY (action_id)            REFERENCES actions(id)
);

CREATE INDEX "idx_ticketHistory_ticket_id" ON "ticketHistory" (ticket_id);
CREATE INDEX "idx_ticketHistory_entered_date" ON "ticketHistory" ("enteredDate");

-- ============================================================
-- media (photo attachments)
-- ============================================================
CREATE TABLE media (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id         INTEGER NOT NULL,
    filename          VARCHAR(128) NOT NULL,
    "internalFilename" VARCHAR(50) NOT NULL,
    mime_type         VARCHAR(128),
    uploaded          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    person_id         INTEGER,
    CONSTRAINT FK_media_ticket_id FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    CONSTRAINT FK_media_person_id FOREIGN KEY (person_id) REFERENCES people(id)
);

CREATE INDEX idx_media_ticket_id ON media (ticket_id);

-- ============================================================
-- bookmarks (saved searches)
-- ============================================================
CREATE TABLE bookmarks (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    person_id   INTEGER NOT NULL,
    type        VARCHAR(128) NOT NULL DEFAULT 'search',
    name        VARCHAR(128),
    "requestUri" VARCHAR(1024) NOT NULL,
    CONSTRAINT FK_bookmarks_person_id FOREIGN KEY (person_id) REFERENCES people(id)
);

-- ============================================================
-- geoclusters (pre-computed map clusters)
-- ============================================================
CREATE TABLE geoclusters (
    id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    level  SMALLINT NOT NULL,
    center POINT NOT NULL
);

CREATE INDEX idx_geoclusters_center ON geoclusters USING GIST (center);

-- ============================================================
-- ticket_geodata (per-ticket cluster membership)
-- ============================================================
CREATE TABLE ticket_geodata (
    ticket_id    INTEGER NOT NULL PRIMARY KEY,
    cluster_id_0 INTEGER,
    cluster_id_1 INTEGER,
    cluster_id_2 INTEGER,
    cluster_id_3 INTEGER,
    cluster_id_4 INTEGER,
    cluster_id_5 INTEGER,
    cluster_id_6 INTEGER,
    FOREIGN KEY (ticket_id)    REFERENCES tickets(id),
    FOREIGN KEY (cluster_id_0) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_1) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_2) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_3) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_4) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_5) REFERENCES geoclusters(id),
    FOREIGN KEY (cluster_id_6) REFERENCES geoclusters(id)
);

SET CONSTRAINTS ALL IMMEDIATE;
```

---

### V2__search_vector.sql

```sql
-- Add full-text search vector column to tickets
ALTER TABLE tickets ADD COLUMN search_vector TSVECTOR;

-- GIN index for fast FTS queries
CREATE INDEX idx_tickets_search_vector ON tickets USING GIN (search_vector);

-- Trigger function to keep search_vector in sync
CREATE OR REPLACE FUNCTION update_ticket_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.id::text, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector
BEFORE INSERT OR UPDATE OF description, location ON tickets
FOR EACH ROW EXECUTE FUNCTION update_ticket_search_vector();

-- Backfill for existing rows
UPDATE tickets SET search_vector =
    setweight(to_tsvector('english', coalesce(id::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'B');
```

---

### Entity Relationship Summary

```
departments ←——— people (department_id)
     |
     └——→ categories (department_id)
               |
               └——→ tickets (category_id)
                        |
                        ├——→ ticketHistory (ticket_id)
                        ├——→ media (ticket_id)
                        └——→ ticket_geodata (ticket_id)
                                   |
                                   └——→ geoclusters (cluster_id_0..6)

people ←——— tickets (reportedByPerson_id, assignedPerson_id, enteredByPerson_id)
people ←——— peopleEmails (person_id)
people ←——— peoplePhones (person_id)
people ←——— peopleAddresses (person_id)
people ←——— bookmarks (person_id)
people ←——— clients (contactPerson_id)

categories ←——— categoryGroups (categoryGroup_id)
categories ←——— category_action_responses (category_id)
actions ←——— category_action_responses (action_id)
actions ←——— department_actions (action_id)
departments ←——— department_actions (department_id)
departments ←——— department_categories (department_id)
categories ←——— department_categories (category_id)

substatus ←——— tickets (substatus_id)
issueTypes ←——— tickets (issueType_id)
contactMethods ←——— tickets (contactMethod_id)
clients ←——— tickets (client_id)
```
---

## Y1: API Endpoints — Consolidated REST Endpoint Catalog

**Base URL (internal CRM API):** `/api`  
**Base URL (Open311):** `/open311/v2`  
**Content-Type:** `application/json` (default); `application/xml` for Open311 XML responses  
**Authentication:** JWT in httpOnly cookie `auth_token` (all `/api/*` endpoints except public ones)  
**API Documentation:** OpenAPI 3.0 at `/v3/api-docs`; Swagger UI at `/swagger-ui.html`

---

### §Auth — Authentication Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| POST | `/api/auth/ldap` | None | LDAP credential login |
| GET | `/auth/cas/callback` | None | CAS service ticket validation callback |
| POST | `/api/auth/refresh` | httpOnly cookie | Refresh JWT |
| POST | `/api/auth/logout` | JWT | Logout; clear cookie |
| GET | `/api/auth/me` | JWT | Current authenticated user info |

**POST /api/auth/ldap — Request:**
```json
{ "username": "jdoe", "password": "secret" }
```

**POST /api/auth/ldap — Response 200:**
```json
{ "personId": 42, "role": "staff", "name": "Jane Doe", "expiresAt": "2026-07-07T08:00:00Z" }
```
*(JWT set as httpOnly cookie `auth_token`)*

**GET /api/auth/me — Response 200:**
```json
{ "personId": 42, "username": "jdoe", "role": "staff", "name": "Jane Doe",
  "departmentId": 3, "expiresAt": "2026-07-07T08:00:00Z" }
```

---

### §Open311 — Open311 / GeoReport v2 Endpoints (Frozen)

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/open311/v2/services` | None (api_key optional) | List service categories |
| GET | `/open311/v2/services/{service_code}` | None | Get single service |
| GET | `/open311/v2/requests` | None | List service requests |
| GET | `/open311/v2/requests/{service_request_id}` | None | Get single service request |
| POST | `/open311/v2/requests` | api_key [R] | Submit new service request |

**GET /open311/v2/services — Response 200 (JSON):**
```json
[
  {
    "service_code": "3",
    "service_name": "Pothole",
    "description": "Report a pothole in the roadway",
    "metadata": false,
    "type": "realtime",
    "keywords": "",
    "group": "Streets"
  }
]
```

**GET /open311/v2/requests — Query Params:**
`service_code`, `status`, `start_date`, `end_date`, `updated_before`, `updated_after`, `bbox`, `page_size` (default 1000), `page` (1-based)

**GET /open311/v2/requests — Response 200 (JSON):**
```json
[
  {
    "service_request_id": "123",
    "status": "open",
    "status_notes": "Received and being reviewed",
    "service_name": "Pothole",
    "service_code": "3",
    "description": "Large pothole near intersection",
    "agency_responsible": "Public Works",
    "service_notice": "",
    "requested_datetime": "2026-07-01T14:32:00Z",
    "updated_datetime": "2026-07-02T09:10:00Z",
    "expected_datetime": "2026-07-08T14:32:00Z",
    "address": "123 Main St",
    "address_id": "456",
    "zipcode": "47401",
    "lat": 39.165,
    "long": -86.526,
    "media_url": "https://ureport.city.gov/api/media/78"
  }
]
```

**POST /open311/v2/requests — Request (multipart/form-data):**
`api_key`, `service_code`, `lat`, `long`, `address_string`, `email`, `first_name`, `last_name`, `phone`, `description`, `media` (file)

**POST /open311/v2/requests — Response 200:**
Single-element array with the same service request object schema.

---

### §Tickets — Internal Ticket (Case) Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/tickets` | JWT | List tickets (paginated, filtered, searchable) |
| POST | `/api/tickets` | JWT | Create ticket (staff) |
| POST | `/api/tickets/public` | None | Create ticket (public submission) |
| POST | `/api/tickets/bulk` | JWT | Bulk operations |
| GET | `/api/tickets/export` | JWT | Export tickets as CSV |
| GET | `/api/tickets/{id}` | JWT | Get ticket detail |
| PATCH | `/api/tickets/{id}` | JWT | Update ticket fields |
| POST | `/api/tickets/{id}/close` | JWT | Close ticket with substatus |
| POST | `/api/tickets/{id}/reopen` | JWT | Reopen ticket |
| POST | `/api/tickets/{id}/assign` | JWT | Assign ticket |
| GET | `/api/tickets/{id}/history` | JWT | Get action timeline |
| POST | `/api/tickets/{id}/history` | JWT | Log action entry |
| GET | `/api/tickets/{id}/media` | JWT* | List media |
| POST | `/api/tickets/{id}/media` | JWT | Upload media |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | JWT | Delete media |

**GET /api/tickets — Query Params:**
`q`, `status`, `substatus_id`, `category_id`, `categoryGroup_id`, `department_id`, `assignedPerson_id`, `issueType_id`, `start_date`, `end_date`, `sort`, `dir`, `page` (1-based), `pageSize` (10/25/50/100), `overdue`

**GET /api/tickets — Response 200:**
```json
{
  "total": 142,
  "page": 1,
  "pageSize": 25,
  "rows": [
    {
      "id": 123,
      "status": "open",
      "substatus": null,
      "category": { "id": 3, "name": "Pothole", "group": "Streets" },
      "department": { "id": 2, "name": "Public Works" },
      "assignedPerson": { "id": 12, "name": "John Smith" },
      "reportedByPerson": { "id": 45, "name": "Jane Doe" },
      "location": "123 Main St",
      "latitude": 39.165,
      "longitude": -86.526,
      "enteredDate": "2026-07-01T14:32:00Z",
      "lastModified": "2026-07-02T09:10:00Z",
      "closedDate": null,
      "searchSnippet": "Large <mark>pothole</mark> near intersection",
      "mediaCount": 2
    }
  ]
}
```

**POST /api/tickets — Request:**
```json
{
  "category_id": 3,
  "description": "Large pothole near Main and 3rd",
  "location": "123 Main St",
  "latitude": 39.165,
  "longitude": -86.526,
  "reportedByPerson_id": 45,
  "assignedPerson_id": 12,
  "issueType_id": 5,
  "contactMethod_id": 1
}
```

**POST /api/tickets — Response 201:**
Full ticket detail object (same schema as GET /api/tickets/{id}).

**POST /api/tickets/{id}/close — Request:**
```json
{ "substatus_id": 1, "notes": "Repaired on 2026-07-05", "notifyReporter": true }
```

**POST /api/tickets/{id}/close — Response 200:** Updated ticket object.

**POST /api/tickets/bulk — Request:**
```json
{
  "action": "close",
  "ticketIds": [101, 102, 103],
  "substatus_id": 1,
  "notes": "Batch closed"
}
```
Actions: `close`, `assign`, `changeStatus`. `assignedPerson_id` used for `assign`.

**POST /api/tickets/bulk — Response 207:**
```json
{ "succeeded": [101, 102], "failed": [{"id": 103, "reason": "Not found"}] }
```

**POST /api/tickets/{id}/history — Request:**
```json
{ "action_id": 6, "notes": "Called reporter; issue being addressed.", "notifyReporter": true }
```

**GET /api/tickets/{id}/history — Response 200:**
```json
[
  {
    "id": 55,
    "action": { "id": 6, "name": "response", "type": "system" },
    "enteredByPerson": { "id": 12, "name": "John Smith" },
    "actionPerson": { "id": 45, "name": "Jane Doe" },
    "enteredDate": "2026-07-03T10:00:00Z",
    "actionDate": "2026-07-03T10:00:00Z",
    "notes": "Called reporter; issue being addressed.",
    "sentNotifications": ["jane.doe@email.com"]
  }
]
```

---

### §People — People Management Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/people` | JWT | List people (search, role filter) |
| POST | `/api/people` | JWT (admin) | Create person |
| GET | `/api/people/{id}` | JWT | Get person detail |
| PUT | `/api/people/{id}` | JWT (admin) | Update person |
| DELETE | `/api/people/{id}` | JWT (admin) | Delete person |
| GET | `/api/people/{id}/tickets` | JWT | Tickets for person |

**GET /api/people — Query Params:** `q`, `role`, `page`, `pageSize`

**GET /api/people/{id} — Response 200:**
```json
{
  "id": 42, "firstname": "Jane", "lastname": "Doe",
  "organization": null, "department": {"id": 3, "name": "Public Works"},
  "username": "jdoe", "role": "staff",
  "emails": [{"id": 1, "email": "jdoe@city.gov", "label": "Work", "usedForNotifications": true}],
  "phones": [{"id": 2, "number": "555-1234", "label": "Work"}],
  "addresses": []
}
```

---

### §Departments — Department Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/departments` | JWT | List departments |
| POST | `/api/departments` | JWT (admin) | Create department |
| GET | `/api/departments/{id}` | JWT | Department detail |
| PUT | `/api/departments/{id}` | JWT (admin) | Update department |
| DELETE | `/api/departments/{id}` | JWT (admin) | Delete department |
| GET | `/api/departments/{id}/categories` | JWT | Categories for department |

---

### §Categories — Category Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/categories` | JWT | List categories |
| POST | `/api/categories` | JWT (admin) | Create category |
| GET | `/api/categories/{id}` | JWT | Category detail |
| PUT | `/api/categories/{id}` | JWT (admin) | Update category |
| DELETE | `/api/categories/{id}` | JWT (admin) | Delete category |
| GET | `/api/categories/public` | None | Public-postable categories |
| GET | `/api/categories/{id}/action-responses/{actionId}` | JWT | Response template |
| GET | `/api/category-groups` | JWT | List category groups |
| POST | `/api/category-groups` | JWT (admin) | Create category group |
| PUT | `/api/category-groups/{id}` | JWT (admin) | Update category group |
| DELETE | `/api/category-groups/{id}` | JWT (admin) | Delete category group |

---

### §Actions — Action Type and History Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/actions` | JWT | List action types |
| POST | `/api/actions` | JWT (admin) | Create department action |
| PUT | `/api/actions/{id}` | JWT (admin) | Update action (template, replyEmail) |
| DELETE | `/api/actions/{id}` | JWT (admin) | Delete department action |

---

### §Admin — Lookup Table Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/substatuses` | JWT | List substatuses |
| POST | `/api/substatuses` | JWT (admin) | Create substatus |
| PUT | `/api/substatuses/{id}` | JWT (admin) | Update substatus |
| DELETE | `/api/substatuses/{id}` | JWT (admin) | Delete substatus |
| GET | `/api/issue-types` | JWT | List issue types |
| POST | `/api/issue-types` | JWT (admin) | Create issue type |
| PUT | `/api/issue-types/{id}` | JWT (admin) | Update issue type |
| DELETE | `/api/issue-types/{id}` | JWT (admin) | Delete issue type |
| GET | `/api/contact-methods` | JWT | List contact methods |
| POST | `/api/contact-methods` | JWT (admin) | Create contact method |
| PUT | `/api/contact-methods/{id}` | JWT (admin) | Update contact method |
| DELETE | `/api/contact-methods/{id}` | JWT (admin) | Delete contact method |
| GET | `/api/clients` | JWT (admin) | List Open311 clients |
| POST | `/api/clients` | JWT (admin) | Create client |
| GET | `/api/clients/{id}` | JWT (admin) | Client detail |
| PUT | `/api/clients/{id}` | JWT (admin) | Update client |
| POST | `/api/clients/{id}/regenerate-key` | JWT (admin) | Regenerate API key |
| DELETE | `/api/clients/{id}` | JWT (admin) | Delete client |

---

### §Media — Media / Photo Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/media/{id}` | JWT* | Serve full-resolution file |
| GET | `/api/media/{id}/thumbnail` | JWT* | Serve 150×150 thumbnail |

*Auth required for staff-only ticket media; public ticket media served without auth.

---

### §Dashboard — Dashboard Data Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/dashboard/stats` | JWT | Stat card counts |
| GET | `/api/dashboard/chart` | JWT | Donut chart data |
| GET | `/api/geoclusters` | JWT | Cluster data for map |

**GET /api/dashboard/stats — Response 200:**
```json
{
  "openCount": 145,
  "openedToday": 12,
  "closedToday": 7,
  "overdueCount": 23
}
```

**GET /api/dashboard/chart — Query:** `groupBy=status|category|department`

**GET /api/geoclusters — Query:** `zoom=0-6`, `status=open|closed`

---

### §Bookmarks — Saved Search Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/bookmarks` | JWT | List user's saved searches |
| POST | `/api/bookmarks` | JWT | Create saved search |
| DELETE | `/api/bookmarks/{id}` | JWT | Delete saved search |

---

### §Reports — Metrics and Reporting Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/metrics` | JWT | KPI metrics + volume by day |
| GET | `/api/reports` | JWT | Grouped report data |
| GET | `/api/reports/export` | JWT | CSV export |

---

### §Geocode — Address Geocoding Proxy

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/geocode` | None | Address autocomplete proxy |

**GET /api/geocode — Query:** `q={address_string}`  
**Response 200:** Array of `{label, lat, lon, formattedAddress}` suggestions (proxied from Mapbox or Nominatim).

---

### Common Response Headers

| Header | Value |
|---|---|
| `Content-Type` | `application/json` (or `application/xml` for Open311) |
| `X-Total-Count` | Total item count (paginated list endpoints) |
| `Cache-Control` | `no-store` (auth endpoints); `max-age=300` (lookup tables) |
---

## Y2: Error Catalog — Cross-Feature HTTP Error Codes and Messages

This catalog documents all error scenarios across all features with their HTTP status codes, application error codes, and response body format. All errors from the internal CRM API (`/api/*`) use the JSON error envelope. Open311 errors (`/open311/v2/*`) use the GeoReport v2 error format.

---

### Error Response Envelopes

**Internal CRM API Error Format (`/api/*`):**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description of the error",
  "details": { "field": "fieldName", "value": "invalidValue" }
}
```
`details` is optional; present for field-level validation errors.

**Open311 / GeoReport v2 Error Format (`/open311/v2/*`):**
```json
{
  "errors": [
    { "code": "error_code", "description": "Human-readable description" }
  ]
}
```
Or XML equivalent:
```xml
<errors>
  <error>
    <code>error_code</code>
    <description>Human-readable description</description>
  </error>
</errors>
```

---

### HTTP Status Code Summary

| Code | Meaning | When Used |
|---|---|---|
| 200 | OK | Successful GET, PATCH, POST (action) responses |
| 201 | Created | Successful POST that creates a new resource |
| 204 | No Content | Successful DELETE |
| 207 | Multi-Status | Bulk operations with partial success/failure |
| 400 | Bad Request | Validation error, missing required field, malformed input |
| 401 | Unauthorized | No valid JWT; authentication required |
| 403 | Forbidden | Valid JWT but insufficient role/permissions; invalid api_key (Open311) |
| 404 | Not Found | Requested resource (ticket, person, category, etc.) does not exist |
| 409 | Conflict | Unique constraint violation; delete blocked by references |
| 413 | Payload Too Large | File upload exceeds size limit |
| 415 | Unsupported Media Type | Invalid file MIME type |
| 500 | Internal Server Error | Unhandled server-side error |
| 503 | Service Unavailable | LDAP/CAS server unreachable; external geocoding service unavailable |

---

### Authentication Errors (F12)

| Code | HTTP | Error Code | Message |
|---|---|---|---|
| Invalid LDAP credentials | 401 | `AUTH_INVALID_CREDENTIALS` | "Invalid username or password" |
| LDAP server unavailable | 503 | `AUTH_SERVICE_UNAVAILABLE` | "Authentication service unavailable. Please try again later." |
| CAS ticket validation failure | 401 | `AUTH_CAS_FAILED` | "CAS authentication failed" |
| JWT missing or invalid | 401 | `AUTH_REQUIRED` | "Authentication required" |
| JWT expired | 401 | `AUTH_TOKEN_EXPIRED` | "Session expired. Please sign in again." |
| Role insufficient | 403 | `FORBIDDEN` | "You do not have permission to perform this action" |
| Admin role required | 403 | `ADMIN_REQUIRED` | "Administrator role required" |
| Open redirect attempt | 400 | `INVALID_RETURN_URL` | "Invalid redirect URL" |

---

### Ticket Errors (F1, F4)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Ticket not found | 404 | `TICKET_NOT_FOUND` | "Case not found" |
| Invalid category_id | 400 | `INVALID_CATEGORY` | "Invalid or inactive category" |
| Missing description | 400 | `MISSING_REQUIRED` | "Description is required" |
| Missing location | 400 | `MISSING_LOCATION` | "Location or coordinates are required" |
| Invalid lat/lon range | 400 | `INVALID_COORDINATES` | "Coordinates out of valid range" |
| Close without substatus | 400 | `MISSING_SUBSTATUS` | "Substatus is required to close a case" |
| Duplicate parent not found | 400 | `PARENT_NOT_FOUND` | "Parent ticket not found" |
| Edit closed ticket (no admin) | 403 | `TICKET_CLOSED` | "Closed cases cannot be edited without admin role" |
| Concurrent update conflict | 409 | `CONFLICT` | "Another user updated this case. Refresh to see the latest changes." |

---

### Bulk Operation Errors (F3)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| No tickets selected | 400 | `EMPTY_SELECTION` | "No cases selected" |
| Invalid action | 400 | `INVALID_BULK_ACTION` | "Invalid bulk action type" |
| Bulk close without substatus | 400 | `MISSING_SUBSTATUS` | "Substatus required for bulk close" |
| Partial failure | 207 | — | `{"succeeded": [...], "failed": [...]}` |

---

### People Errors (F6)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Person not found | 404 | `PERSON_NOT_FOUND` | "Person not found" |
| Duplicate username | 409 | `DUPLICATE_USERNAME` | "Username is already in use" |
| Invalid email format | 400 | `INVALID_EMAIL` | "Invalid email address format" |
| Missing name | 400 | `MISSING_REQUIRED` | "At least one of first name, last name, or organization is required" |
| Delete blocked by tickets | 409 | `DELETE_BLOCKED` | "Cannot delete: this person is associated with one or more cases" |

---

### Department / Category Errors (F7, F8)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Department not found | 404 | `DEPARTMENT_NOT_FOUND` | "Department not found" |
| Delete blocked by categories | 409 | `DELETE_BLOCKED` | "Cannot delete: department has associated categories" |
| Category not found | 404 | `CATEGORY_NOT_FOUND` | "Category not found" |
| Delete blocked by tickets | 409 | `DELETE_BLOCKED` | "Cannot delete: category has associated cases" |
| Invalid permission level | 400 | `INVALID_PERMISSION_LEVEL` | "Invalid permission level value" |
| Category group not found | 404 | `CATEGORY_GROUP_NOT_FOUND` | "Category group not found" |
| Delete blocked by categories (group) | 409 | `DELETE_BLOCKED` | "Cannot delete: group has associated categories" |

---

### Action / History Errors (F9)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Invalid action_id | 400 | `INVALID_ACTION` | "Invalid action type" |
| Action not permitted for department | 403 | `ACTION_NOT_PERMITTED` | "This action is not available for the ticket's department" |
| Notes required but missing | 400 | `MISSING_NOTES` | "Notes are required for response actions" |
| SMTP delivery failure | 200 | — | (Action saved; toast warning "Email notification failed to send") |

---

### Media Errors (F10)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| File too large | 413 | `FILE_TOO_LARGE` | "File exceeds the maximum 10 MB size limit" |
| Unsupported MIME type | 415 | `INVALID_FILE_TYPE` | "Only JPEG, PNG, and GIF images are accepted" |
| Too many files | 400 | `TOO_MANY_FILES` | "Maximum 10 files per upload" |
| Media not found | 404 | `MEDIA_NOT_FOUND` | "Photo not found" |
| Disk storage failure | 500 | `STORAGE_ERROR` | "File storage error. Please contact the administrator." |

---

### Open311 Errors (F0)

| Scenario | HTTP | Error Code | GeoReport v2 Error |
|---|---|---|---|
| Unknown service_code | 404 | — | `open311/unknownService` |
| Not allowed to post to service | 403 | — | `noAccessAllowed` |
| Missing/invalid api_key | 403 | — | `clients/unknownClient` |
| Missing required field (POST) | 400 | — | `missingRequiredField` |
| Unknown service request ID | 404 | — | (error description) |
| Malformed date parameter | 400 | — | (error description) |

---

### Admin Panel Errors (F13, F14)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Duplicate substatus name | 409 | `DUPLICATE_NAME` | "Substatus name already in use" |
| Delete system substatus | 403 | `DELETE_SYSTEM_RECORD` | "System records cannot be deleted" |
| Delete substatus in use | 409 | `DELETE_BLOCKED` | "Cannot delete: substatus is in use by tickets" |
| Duplicate issue type name | 409 | `DUPLICATE_NAME` | "Issue type name already in use" |
| Duplicate contact method | 409 | `DUPLICATE_NAME` | "Contact method name already in use" |
| Client not found | 404 | `CLIENT_NOT_FOUND` | "Client not found" |
| Missing client name | 400 | `MISSING_REQUIRED` | "Client name is required" |
| Invalid client URL | 400 | `INVALID_URL` | "Invalid URL format" |

---

### Search Errors (F11)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Malformed tsquery | 400 | `INVALID_SEARCH_TERM` | "Search term is invalid" |
| Search term too long | 400 | `SEARCH_TERM_TOO_LONG` | "Search term exceeds maximum length" |

---

### Reporting Errors (F15)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Start date > end date | 400 | `INVALID_DATE_RANGE` | "Start date must be before end date" |
| Date range > 12 months | 400 | `DATE_RANGE_TOO_LARGE` | "Date range cannot exceed 12 months" |
| Invalid groupBy value | 400 | `INVALID_GROUP_BY` | "Invalid groupBy parameter value" |

---

### Global Server Errors

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Unhandled exception | 500 | `INTERNAL_ERROR` | "An unexpected error occurred. Please try again or contact support." |
| Database connection failure | 500 | `DB_ERROR` | "Database unavailable. Please try again later." |
| Request timeout | 504 | `TIMEOUT` | "Request timed out. Please try again." |
---

## Y3: Integration Points — External System Dependencies

This section documents all external system dependencies and integration contracts for the uReport modernized stack.

---

### INT-01: CAS — Central Authentication Service

**Feature:** F12  
**Direction:** Outbound (Spring Boot → CAS server)  
**Protocol:** CAS 2.0 / CAS 3.0 (HTTPS)  
**Library:** `spring-security-cas` (Spring Security CAS extension)

**Integration Contract:**

| Endpoint | Description |
|---|---|
| `{casServer}/login?service={serviceUrl}` | Redirect user to CAS login |
| `{casServer}/serviceValidate?service={serviceUrl}&ticket={ticket}` | Validate service ticket |
| `{casServer}/logout?service={serviceUrl}` | CAS single sign-out |

**Configuration Properties:**
```properties
cas.server.url=https://cas.city.gov
cas.service.url=https://ureport.city.gov/auth/cas/callback
```

**Failure Mode:** If CAS server is unreachable, users cannot authenticate via CAS. LDAP authentication remains available as fallback. Login screen shows a "CAS service unavailable" message.

**Dependency Risk:** Medium — CAS service is an external dependency. Prototype the integration early in development (see PRD §8 Risks).

---

### INT-02: LDAP — Lightweight Directory Access Protocol

**Feature:** F12  
**Direction:** Outbound (Spring Boot → LDAP server)  
**Protocol:** LDAP / LDAPS (port 389 / 636)  
**Library:** `spring-security-ldap`

**Integration Contract:**

- Spring Boot binds to the LDAP server using the provided `username` + `password`.
- On successful bind, the user's DN is resolved and the Spring Security principal is set.
- Group membership (for role mapping, if applicable) may be queried via LDAP search.

**Configuration Properties:**
```properties
spring.ldap.urls=ldaps://ldap.city.gov:636
spring.ldap.base=dc=city,dc=gov
spring.ldap.user-dn-pattern=uid={0},ou=people
```

**Failure Mode:** If LDAP server is unreachable, LDAP login attempts return 503. CAS remains available.

---

### INT-03: SMTP — Email Delivery

**Feature:** F9  
**Direction:** Outbound (Spring Boot → SMTP server)  
**Protocol:** SMTP / SMTPS  
**Library:** `spring-boot-starter-mail` (JavaMailSender)

**Integration Contract:**
- Spring Boot sends emails via the configured SMTP host/port/credentials.
- Emails are sent for: action responses to reporters, assignment notifications to assignees.
- Email delivery is synchronous (or via a small async queue). Failure is non-fatal — the ticket history entry is saved and the user receives a warning toast.

**Configuration Properties:**
```properties
spring.mail.host=smtp.city.gov
spring.mail.port=587
spring.mail.username=ureport@city.gov
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Email Fields:**
- **From:** `ureport@city.gov` (configurable)
- **Reply-To:** From `category_action_responses.replyEmail` or `actions.replyEmail` or system default
- **To:** Recipient notification emails from `peopleEmails.usedForNotifications = true`
- **Subject:** `[uReport] Case #{ticket_id} — {action_name}`
- **Body:** Plain text or HTML; contains action notes + case link footer

**Failure Mode:** SMTP failure is logged at ERROR level. The `ticket_history` record is saved. A `sentNotifications` value of `[]` (empty) is stored. User receives a warning toast.

---

### INT-04: Mapbox GL JS — Interactive Maps

**Feature:** F2, F5, F16  
**Direction:** Outbound (React browser → Mapbox API)  
**Protocol:** HTTPS (REST + WebSocket)  
**API Key:** `VITE_MAPBOX_TOKEN` (environment variable)

**Integration Contract:**
- Map tiles loaded from `https://api.mapbox.com/styles/v1/...`
- Geocoding: `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={token}`
- Map styles and token managed client-side via environment variable.

**Geocoding API Response (simplified):**
```json
{
  "features": [
    {
      "place_name": "123 Main St, Bloomington, IN",
      "center": [-86.526, 39.165],
      "geometry": { "type": "Point", "coordinates": [-86.526, 39.165] }
    }
  ]
}
```

**Failure Mode:** If Mapbox token is absent or invalid, the system automatically falls back to Leaflet + OpenStreetMap tiles (see INT-05). Geocoding falls back to manual address-only entry (no autocomplete suggestions).

---

### INT-05: Leaflet + OpenStreetMap — Map Fallback

**Feature:** F2, F5, F16  
**Direction:** Outbound (React browser → OSM tile servers)  
**Protocol:** HTTPS  
**Trigger:** Used when Mapbox token is absent or when `VITE_MAP_PROVIDER=leaflet`

**Integration Contract:**
- Tile URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution: "© OpenStreetMap contributors" (required by OSM tile usage policy)
- Geocoding fallback: Nominatim API (`https://nominatim.openstreetmap.org/search?q={query}&format=json`). Rate limit: 1 request/second. Public-facing deployment must not abuse Nominatim; a self-hosted or commercial geocoding service is recommended for production.

**Failure Mode:** If both Mapbox and OSM tiles fail, the map widget is hidden with a "Map unavailable" message. All ticket data remains accessible without the map.

---

### INT-06: PostgreSQL — Primary Database

**Feature:** All features  
**Direction:** Outbound (Spring Boot → PostgreSQL)  
**Protocol:** PostgreSQL wire protocol (JDBC)  
**Library:** Spring Data JPA + HikariCP connection pool

**Configuration:**
```properties
spring.datasource.url=jdbc:postgresql://postgres:5432/ureport
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.hikari.maximum-pool-size=20
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

**Failure Mode:** If PostgreSQL is unreachable, all API endpoints return 500. Spring Boot health endpoint `/actuator/health` reports `DOWN`. OCI runtime restart policy (e.g., Kubernetes pod restart policy) ensures auto-recovery.

---

### INT-07: Flyway — Database Migration

**Feature:** F21  
**Direction:** Outbound (Spring Boot startup → PostgreSQL)  
**Protocol:** JDBC  
**Trigger:** Automatic on Spring Boot startup

**Integration Contract:**
- Flyway scans `src/main/resources/db/migration/` for `V{n}__{description}.sql` files.
- Executes unapplied migrations in version order.
- Records applied migrations in `flyway_schema_history` table.
- On checksum mismatch (modified applied migration): startup fails; requires `flyway repair` in non-production only.

**Failure Mode:** If a migration fails, Spring Boot startup is aborted. Fix the migration SQL and restart. Never modify already-applied migration files.

---

### INT-08: Nginx — Reverse Proxy (React Frontend)

**Feature:** F17, F18, F19  
**Direction:** Inbound (clients → Nginx → React SPA / Spring Boot)  
**Protocol:** HTTPS  
**Configuration:** `frontend/Dockerfile` (nginx:alpine image)

**Integration Contract:**
- Nginx serves the React SPA static files (built by `npm run build`).
- All `/api/*` and `/open311/*` requests are reverse-proxied to the Spring Boot container.
- React Router routes (all non-`/api/*` paths) return `index.html` (client-side routing).
- HTTPS enforced; HTTP redirected to HTTPS.
- `Content-Security-Policy` header set to restrict script sources.

**Key Nginx Configuration (excerpt):**
```nginx
location /api/ { proxy_pass http://springboot:8080; }
location /open311/ { proxy_pass http://springboot:8080; }
location /auth/ { proxy_pass http://springboot:8080; }
location /v3/ { proxy_pass http://springboot:8080; }   # OpenAPI
location /swagger-ui { proxy_pass http://springboot:8080; }
location / { try_files $uri /index.html; }             # SPA fallback
```

---

### INT-09: Container Images — OCI Packaging

**Feature:** F21 (deployment)
**Note:** No Docker Compose — the execution sandbox is Kubernetes (no Docker daemon at runtime). Each service is packaged as an independent OCI image via its own Dockerfile. Dev/test uses `io.zonky.test:embedded-postgres` in Maven — no container runtime needed for tests.

**Images:**
- `frontend/Dockerfile` — Nginx serving built React SPA (port 80/443)
- `backend/Dockerfile` — Spring Boot application (port 8080, internal only)
- `postgres:16-alpine` — PostgreSQL (port 5432, internal only; standard public image)

**Persistent Volumes:**
- `postgres_data` — Persistent PostgreSQL data volume
- `media_files` — Shared volume between Spring Boot and Nginx for uploaded photos

**Environment Variables (injected by OCI runtime; never in source):**
```
DATABASE_URL=jdbc:postgresql://<host>:5432/ureport
DB_USER=ureport
DB_PASSWORD=<secret>
SMTP_HOST=<host>
SMTP_PASSWORD=<secret>
JWT_SECRET=<secret>
MAPBOX_TOKEN=<token>
CAS_SERVER_URL=https://cas.city.gov
LDAP_URL=ldaps://ldap.city.gov:636
```

---

### Integration Dependency Matrix

| Integration | Feature(s) | Criticality | Failure Impact |
|---|---|---|---|
| PostgreSQL | All | P0 | Total system outage |
| Flyway | F21 | P0 | Startup failure |
| CAS | F12 | P0 | Staff cannot authenticate (LDAP fallback) |
| LDAP | F12 | P0 | Staff cannot authenticate (CAS fallback) |
| SMTP | F9 | P1 | Email notifications fail; core workflows unaffected |
| Mapbox | F2, F5, F16 | P2 | Map degrades to Leaflet/OSM |
| Leaflet/OSM | F2, F5, F16 | P2 | Map unavailable if both fail |
| Nginx | F17, F18 | P0 | Frontend inaccessible |
| OCI Runtime (Kubernetes/etc.) | All | P0 | Container restart policy handles transient failures |
