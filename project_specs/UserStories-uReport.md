# User Stories
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Active  
**Based on:** PRD-uReport.md v1.0 · FRD-uReport.md v1.0 · PERSONAS-uReport.md v1.0  

---

## Priority Definitions

| Priority | Meaning |
|----------|---------|
| **P0** | Critical / MVP-blocking — system cannot launch without this |
| **P1** | Required for MVP — must ship before first production release |
| **P2** | Standard / Post-core — ships after MVP; improves usability or coverage |
| **P3** | Future / Out of scope for this release |

---

## Personas

| ID | Name | Role |
|----|------|------|
| PER-01 | Dana Reyes | Municipal Staff Member (CRM Operator) |
| PER-02 | Marcus Webb | Department Manager / Supervisor |
| PER-03 | Priya Nair | Constituent / Citizen |
| PER-04 | Tomás Eriksson | System Administrator / IT + Open311 API Developer |

---

## Epic 0: Ticket Lifecycle Management (F0)

> The core unit of work. Staff and permitted citizens create, update, assign, close, reopen, and delete service request tickets.

### US-0.1: Create a Ticket as a Staff Member
**As a** Dana Reyes (municipal staff), **I want to** create a new service request ticket with title, description, category, location, and reporter contact info, **so that** a constituent's issue is captured in the system and routed to the correct department.

**Acceptance Criteria:**
- [ ] Staff can submit a ticket creation form with `title`, `description`, `categoryId`, `address` or `lat`/`lng`, and optional reporter contact fields
- [ ] System validates that `categoryId` references an active category
- [ ] System validates that either an address or lat/lng coordinates are provided
- [ ] System sets `status = 'open'` and `datetimeOpened = NOW()` on creation
- [ ] System routes ticket to the department linked to the selected category
- [ ] System applies the default open substatus if one is configured
- [ ] An `actions` record of type `open` is created for the ticket
- [ ] Ticket appears in Solr search results immediately after creation
- [ ] API returns HTTP 201 with the full ticket object on success
- [ ] API returns HTTP 422 with field-level errors on validation failure

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: View Ticket Detail with Full History
**As a** Dana Reyes (municipal staff), **I want to** view the complete detail of any ticket including its fields, current status, assignee, attachments, and chronological action history, **so that** I can understand everything that has happened to a ticket before taking action.

**Acceptance Criteria:**
- [ ] Ticket detail page displays all ticket fields: title, description, category, department, assignee, reporter, status, substatus, address, and SLA data
- [ ] Chronological history of all actions (open, assignment, responses, comments, uploads, status changes) is displayed
- [ ] Internal comments are visible to staff/admin but hidden from public/anonymous callers
- [ ] Attachments are listed with thumbnails for images and download links for all file types
- [ ] Page renders correctly on viewport widths from 375px to 1920px (no horizontal scroll)
- [ ] API returns HTTP 404 with `NOT_FOUND` code if the ticket does not exist

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: Assign a Ticket to a Staff Member
**As a** Marcus Webb (department manager), **I want to** assign or reassign one or more tickets to a specific staff member and/or department — individually or in bulk — **so that** the right people are responsible for resolving them and workload can be rebalanced without visiting each ticket individually.

**Acceptance Criteria:**

*Single-ticket assignment:*
- [ ] Staff/admin can submit an assignment with `assigneeId` and/or `departmentId`
- [ ] System validates that the assignee is an active person with `staff` or `admin` role
- [ ] System validates that the department is active
- [ ] An `actions` record of type `assignment` is created recording previous and new assignee
- [ ] The new assignee receives an email notification
- [ ] Setting `assigneeId = null` unassigns the ticket without error
- [ ] API returns HTTP 200 with the updated ticket object
- [ ] Anonymous and public users cannot perform assignment (HTTP 403)

*Bulk assignment (via `POST /api/tickets/bulk-assign`):*
- [ ] Staff/admin can submit `ticketIds` (array, min 1, max 100) plus target `assigneeId` and/or `departmentId`
- [ ] Each ticket in the batch is independently assigned; partial success is allowed (failed IDs returned in `failed[]`)
- [ ] Each successfully reassigned ticket gets its own `actions` record of type `assignment` with the actor set to the requesting staff member
- [ ] Bulk assignment completes without requiring a full-page reload (SPA updates the ticket list in place)
- [ ] API returns HTTP 200 with `{ "data": { "reassigned": N, "failed": [] }, "meta": {}, "errors": [] }`

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: Close a Ticket with a Resolution Response
**As a** Dana Reyes (municipal staff), **I want to** close a resolved ticket with an optional resolution message, **so that** the constituent is informed the issue has been addressed and the ticket is marked complete.

**Acceptance Criteria:**
- [ ] Staff/admin can close a ticket with an optional `response` text (max 5000 chars)
- [ ] System sets `status = 'closed'` and `datetimeClosed = NOW()`
- [ ] System applies the default closed substatus if configured
- [ ] An `actions` record of type `closed` is created; if response text is provided, an additional `response` action is created
- [ ] Reporter receives an email notification with the response text
- [ ] Solr index is updated to reflect the closed status
- [ ] Attempting to close an already-closed ticket returns HTTP 409 with `ALREADY_CLOSED`
- [ ] API returns HTTP 200 with the updated ticket on success

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.5: Reopen a Closed Ticket
**As a** Dana Reyes (municipal staff), **I want to** reopen a closed ticket with an explanation, **so that** follow-up work can be tracked on the same ticket record.

**Acceptance Criteria:**
- [ ] Staff/admin can submit a reopen request with a required `reason` field (max 1000 chars)
- [ ] `reason` is validated as non-empty; HTTP 422 with `REASON_REQUIRED` if missing
- [ ] System sets `status = 'open'`, clears `datetimeClosed`, and applies the default open substatus
- [ ] An `actions` record of type `open` is created with `payload.reason` containing the reason text
- [ ] Solr index is updated
- [ ] Attempting to reopen an already-open ticket returns HTTP 409 with `ALREADY_OPEN`
- [ ] API returns HTTP 200 with the updated ticket

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.6: Post an Internal Comment on a Ticket
**As a** Dana Reyes (municipal staff), **I want to** add an internal comment to a ticket visible only to staff, **so that** I can record notes for colleagues without notifying the constituent.

**Acceptance Criteria:**
- [ ] Staff/admin can submit comment text via `POST /api/tickets/{id}/comments`
- [ ] An `actions` record of type `comment` with `visibility = 'internal'` is created
- [ ] Comment is displayed in the ticket history for staff/admin users
- [ ] Comment is excluded from the history response for public and anonymous callers
- [ ] No email notification is sent to the reporter for internal comments
- [ ] API returns HTTP 201 with the created action object

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.7: Delete a Ticket (Admin)
**As a** Tomás Eriksson (system administrator), **I want to** delete a spam or erroneous ticket, **so that** the queue is not cluttered with invalid records.

**Acceptance Criteria:**
- [ ] Only users with `admin` role can delete a ticket; HTTP 403 with `FORBIDDEN` for staff, public, or anonymous
- [ ] System soft-deletes the ticket by setting `deletedAt = NOW()`
- [ ] An `actions` record of type `deleted` is created
- [ ] Ticket is removed from the Solr search index
- [ ] API returns HTTP 204 on successful deletion
- [ ] Deleted tickets do not appear in search results or ticket lists

**Priority:** P0 | **Feature Ref:** F0

---

## Epic 1: Open311 GeoReport v2 API (F1)

> Spec-compliant REST endpoints enabling third-party apps and city portals to submit and query service requests.

### US-1.1: Submit a Service Request via Open311
**As a** Tomás Eriksson (Open311 API developer), **I want to** submit a service request via `POST /open311/requests` using a standard Open311 payload, **so that** my mobile app can create tickets without coupling to uReport's internal API.

**Acceptance Criteria:**
- [ ] `POST /open311/requests` accepts `service_code`, location (`lat`/`long` or `address_string`), contact fields, and optional `api_key`
- [ ] `service_code` must map to an active, publicly-postable category; returns `[{"code":404,"description":"service_code not found"}]` otherwise
- [ ] Valid `api_key` associates the request with the matching `clients` record; absent key is treated as anonymous (not rejected for public categories)
- [ ] Non-empty but invalid `api_key` returns `[{"code":400,"description":"Invalid api_key"}]`
- [ ] On success, returns an Open311-format service request object with `service_request_id`
- [ ] Response format is JSON by default; XML returned when `?format=xml` or `Accept: application/xml`
- [ ] Custom attribute fields prefixed `attribute[{code}]` are stored in ticket's `customFields` JSON
- [ ] `media_url` field stores the URL reference without downloading the file

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: Query Service Requests via Open311
**As a** Tomás Eriksson (Open311 API developer), **I want to** query service requests using `GET /open311/requests` with filters, **so that** my app can display the current status of submitted requests.

**Acceptance Criteria:**
- [ ] `GET /open311/requests` supports filter parameters: `service_code`, `status`, `start_date`, `end_date`, `lat`, `long`, `radius`, `page`, `page_size`
- [ ] `page_size` defaults to 50 and is capped at 200
- [ ] `start_date` and `end_date` must be ISO 8601 format; invalid format returns `400` error
- [ ] Response includes all Open311 GeoReport v2 required fields: `service_request_id`, `status`, `service_name`, `service_code`, `description`, `agency_responsible`, `requested_datetime`, `updated_datetime`, `expected_datetime`, `lat`, `long`, `address`
- [ ] `expected_datetime` is computed as `datetimeOpened + category.slaDays` business days
- [ ] `GET /open311/requests/{id}` returns a single-element array per GeoReport v2 spec, or `404` if not found
- [ ] JSON and XML formats both supported via `format` query parameter

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: Discover Available Open311 Services
**As a** Tomás Eriksson (Open311 API developer), **I want to** retrieve the service list and discovery document, **so that** I can auto-configure my app against the correct endpoints and available service types.

**Acceptance Criteria:**
- [ ] `GET /open311/services` returns all active, public categories with `service_code`, `service_name`, `description`, `metadata`, `type`, `keywords`, and `group`
- [ ] `GET /open311/services/{service_code}` returns the full service definition including custom field definitions (`attributes`)
- [ ] `GET /open311/discovery` returns a discovery document pointing to available endpoint URLs and supported formats
- [ ] Deactivated categories do not appear in the services list
- [ ] Both JSON and XML response formats are supported

**Priority:** P0 | **Feature Ref:** F1

---

## Epic 2: Department & Category Management (F2)

> Administrators configure departments and category taxonomy — the routing rules, SLA targets, and permissions that govern how tickets flow through the system.

### US-2.1: Create and Configure a Service Category
**As a** Tomás Eriksson (system administrator), **I want to** create a new service category with SLA days, display/posting permissions, and custom fields, **so that** tickets submitted in that category are correctly routed and validated.

**Acceptance Criteria:**
- [ ] Admin can create a category with: `name`, `departmentId`, `groupId`, `slaDays`, `displayPermission`, `postingPermission`, `defaultAssigneeId`, `autoCloseDays`, and `fields`
- [ ] `name` must be unique across all categories (case-insensitive); duplicate returns HTTP 422 with `DUPLICATE_NAME`
- [ ] `departmentId` must reference an active department; invalid returns HTTP 422 with `INVALID_DEPARTMENT`
- [ ] `displayPermission` and `postingPermission` must be valid enum values (`public`/`staff`/`anonymous` and `staff`/`public`/`anonymous` respectively)
- [ ] Custom field definitions require `code` (matching `/^[a-z0-9_]+$/`, unique within category), `label`, `type`, and `options` (required for `select` type)
- [ ] Select-type custom field without options returns HTTP 422 with `FIELD_OPTIONS_REQUIRED`
- [ ] API returns HTTP 201 with the full category object on success
- [ ] Only admin role can create categories; HTTP 403 for staff/public

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: Deactivate a Department with Active Tickets
**As a** Tomás Eriksson (system administrator), **I want to** deactivate a department, **so that** it no longer appears as a routing target for new tickets, while preserving existing ticket history.

**Acceptance Criteria:**
- [ ] Admin can deactivate (soft-delete) a department; system warns if active tickets are assigned to it
- [ ] Warning confirmation is required before proceeding with deactivation when active tickets exist; returns HTTP 409 with `HAS_ACTIVE_TICKETS` pending confirmation
- [ ] Deactivated department is hidden from ticket routing and Open311 services list
- [ ] Existing tickets assigned to the department are unaffected and remain accessible
- [ ] Deactivated departments cannot be set as `departmentId` on new tickets or categories
- [ ] API returns HTTP 204 on successful deactivation

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Configure Auto-Close Rule for a Category
**As a** Marcus Webb (department manager), **I want to** set an auto-close rule for a category so that inactive tickets close automatically after N days, **so that** the queue stays clean without manual follow-up.

**Acceptance Criteria:**
- [ ] Admin can set `autoCloseDays` (integer ≥ 0) on a category; `0` or `null` disables auto-close
- [ ] When a ticket in the category has had no activity for `autoCloseDays` days, a background job closes it
- [ ] Auto-close creates an `actions` entry of type `closed` with the actor set to a system account
- [ ] Reporter receives the standard ticket-closed email notification on auto-close
- [ ] `autoCloseDays` update is reflected immediately for tickets whose inactivity timer has not yet expired

**Priority:** P0 | **Feature Ref:** F2

---

## Epic 3: People & Contact Management (F3)

> A unified directory of staff and constituent person records with contact methods and role assignments.

### US-3.1: Create a Staff User Account
**As a** Tomás Eriksson (system administrator), **I want to** create a staff person record with a role and contact email, **so that** the staff member can log in via OIDC and be assigned to tickets.

**Acceptance Criteria:**
- [ ] Admin can create a person with `firstName`, `lastName`, `role` (`admin`/`staff`/`public`), `departmentId`, and at least one contact method
- [ ] Email `value` must be unique across all active contact methods; duplicate returns HTTP 422 with `DUPLICATE_EMAIL`
- [ ] `role` of `admin` or `staff` requires at least one valid email contact method
- [ ] `departmentId` must reference an active department if provided
- [ ] API returns HTTP 201 with the full person object including contact methods
- [ ] Only admin role can create person records; HTTP 403 for staff/public/anonymous

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.2: Auto-Provision Person Record on First OIDC Login
**As a** Tomás Eriksson (system administrator), **I want** the system to automatically create a person record when a new user completes OIDC login, **so that** new users can access the system immediately with default `public` role without manual pre-provisioning.

**Acceptance Criteria:**
- [ ] When OIDC callback is received and no person matches `oidcSubject` or email, system auto-creates a `people` record with `role = 'public'` and data from OIDC claims
- [ ] Subsequent logins for the same OIDC subject update the person's name/email from fresh claims
- [ ] Auto-provisioned user has `role = 'public'` until an admin manually elevates the role
- [ ] Admin can elevate role to `staff` or `admin` via the people management UI

**Priority:** P1 | **Feature Ref:** F3

---

### US-3.3: Search and Manage Contact Methods for a Person
**As a** Tomás Eriksson (system administrator), **I want to** add, edit, and remove contact methods (emails, phones, addresses) for a person record, **so that** notifications reach the right contact and the directory stays accurate.

**Acceptance Criteria:**
- [ ] Admin can add a contact method with `type`, `value`, `isPrimary`, `label`, and `phoneType` (for phone type)
- [ ] Email format is validated against RFC 5322; invalid email returns HTTP 422 with `INVALID_EMAIL`
- [ ] Setting `isPrimary = true` when another primary of the same type exists demotes the existing primary
- [ ] Admin can remove a contact method; person record is preserved
- [ ] Cannot delete a person record (only deactivate) — prevents loss of historical ticket references
- [ ] People list supports search by `q` (name/email), `role`, `departmentId`, and `active` filters with pagination

**Priority:** P1 | **Feature Ref:** F3

---

## Epic 4: Full-Text Search & Filtering (F4)

> Staff can search across all tickets using keywords and multi-dimensional filters, export results, and view them on a map.

### US-4.1: Search Tickets with Keyword and Filters
**As a** Dana Reyes (municipal staff), **I want to** search the ticket queue by keyword and apply filters (status, category, department, assignee, date range), **so that** I can quickly find the specific tickets I need to act on.

**Acceptance Criteria:**
- [ ] Search accepts `q` (keyword, max 500 chars), `status`, `substatusId`, `categoryId`, `departmentId`, `assigneeId`, `reporterEmail`, `dateFrom`, `dateTo`, and geo-filter params
- [ ] Keyword search queries Solr full-text across ticket title, description, responses, and address fields
- [ ] Results are paginated: `page` and `perPage` (default 25, max 100); meta includes `total`, `page`, `perPage`, `pages`, and `facets`
- [ ] `dateFrom` must be ≤ `dateTo`; invalid order returns HTTP 422 with `INVALID_DATE_RANGE`
- [ ] Staff-only category tickets are excluded from results for non-staff callers
- [ ] Solr unavailability returns HTTP 503 with `SEARCH_UNAVAILABLE`
- [ ] Results can be sorted by `date_desc` (default), `date_asc`, `sla_asc`, `assignee`, or `category`

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.2: Export Ticket Search Results as CSV
**As a** Marcus Webb (department manager), **I want to** export the current filtered search results as a CSV file, **so that** I can analyze ticket data in Excel or share it with city leadership.

**Acceptance Criteria:**
- [ ] Adding `?export=csv` to any search request returns a `text/csv` file download with `Content-Disposition: attachment; filename="tickets.csv"`
- [ ] CSV includes columns: Ticket ID, Title, Status, Substatus, Category, Department, Assignee, Reporter, Address, Date Opened, Date Closed, SLA Days, Late
- [ ] CSV column order is stable across all exports (does not change between versions)
- [ ] Export is capped at 5000 rows; exceeding the cap returns HTTP 413 with `EXPORT_TOO_LARGE`
- [ ] Only `staff` or `admin` role can trigger CSV export
- [ ] Solr re-index CLI command is available for disaster recovery

**Priority:** P1 | **Feature Ref:** F4

---

### US-4.3: Keep Solr Index in Sync with Ticket Mutations
**As a** Tomás Eriksson (system administrator), **I want** the Solr search index to update automatically whenever a ticket is created, updated, closed, reopened, or deleted, **so that** search results always reflect the current state of the ticket queue.

**Acceptance Criteria:**
- [ ] Every ticket create, update, close, reopen, and delete triggers an async Solr index update
- [ ] Deleting a ticket removes its Solr document
- [ ] A full re-index CLI command is available and documented for recovery scenarios
- [ ] Solr index update failures are logged to Graylog and do not fail the originating ticket operation

**Priority:** P1 | **Feature Ref:** F4

---

## Epic 5: Geospatial Features (F5)

> Location capture, geocoding, and map visualization for spatially-aware service request management.

### US-5.1: Submit a Ticket with Location Using a Map Picker
**As a** Priya Nair (constituent), **I want to** pinpoint my issue on an interactive map or enter a street address when submitting a request, **so that** the city can find and fix the exact location I reported.

**Acceptance Criteria:**
- [ ] Ticket submission form includes both a map picker and a text address field for location input
- [ ] If only an address string is provided, system geocodes it to lat/lng via the configured address service
- [ ] If only lat/lng are provided (e.g., from Open311 mobile app), system reverse-geocodes to populate the address string
- [ ] Geocoding failure is non-fatal: ticket is saved with `geoStatus = 'pending'` and a background retry is queued
- [ ] Lat/lng values are validated: lat in −90..+90, lng in −180..+180; out-of-range returns HTTP 422 with `INVALID_COORDINATES`
- [ ] Map picker and file upload controls are fully usable on a 375px mobile viewport

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.2: View Geo-Clustered Ticket Density Map
**As a** Dana Reyes (municipal staff), **I want to** switch the ticket search results to a map view showing clustered ticket density by area, **so that** I can identify neighborhoods with the highest concentration of open issues.

**Acceptance Criteria:**
- [ ] `GET /api/tickets/clusters` returns cluster data `[{ lat, lng, count, zoom }]` based on current search filters and optional bounding box
- [ ] Map clusters use Solr geospatial clustering; cluster grid resolution responds to `zoom` level (1–20)
- [ ] At high zoom levels with fewer than 10 tickets per cell, individual ticket markers are returned instead of clusters
- [ ] Bounding box filter (`bbox`) requires exactly 4 comma-separated decimals with `minLat < maxLat` and `minLng < maxLng`; invalid format returns HTTP 422 with `INVALID_BBOX`
- [ ] Address service type is configurable (`ADDRESS_SERVICE_TYPE`: google|nominatim|city_gis|none) without code changes

**Priority:** P1 | **Feature Ref:** F5

---

## Epic 6: Ticket History & Audit Trail (F6)

> Immutable, append-only audit records for every ticket mutation — required for compliance and transparency.

### US-6.1: View the Complete Audit Trail for a Ticket
**As a** Marcus Webb (department manager), **I want to** view the full chronological history of every action taken on a ticket, **so that** I can understand the complete picture before a constituent complaint review.

**Acceptance Criteria:**
- [ ] `GET /api/tickets/{id}/history` returns all `actions` records for the ticket ordered by `datetimeCreated ASC`
- [ ] Each action includes: `id`, `type`, `visibility`, `actor` (name + type), `datetimeCreated`, `payload`
- [ ] Internal (`visibility = 'internal'`) actions are excluded for non-staff/admin callers
- [ ] Actor name is resolved from `people` table for person actors and `clients` table for API client actors
- [ ] Action records are append-only — no PUT or DELETE on `/api/tickets/{id}/history`; HTTP 405 if attempted
- [ ] History endpoint supports `type` filter and `page`/`perPage` pagination

**Priority:** P0 | **Feature Ref:** F6

---

### US-6.2: Record Audit Actions for All Ticket State Transitions
**As a** Tomás Eriksson (system administrator), **I want** every ticket mutation to automatically generate an immutable audit action, **so that** the system maintains a complete compliance trail without requiring staff to log actions manually.

**Acceptance Criteria:**
- [ ] An `actions` record is automatically created for each mutation type: `open`, `assignment`, `closed`, `reopen`, `response`, `comment`, `upload`, `deleted`, `merged`, `substatus`
- [ ] Each action captures: `ticketId`, `type`, `actorPersonId` (or `actorClientId`), `datetimeCreated`, `payload`, and `visibility`
- [ ] Assignment actions include `payload.previousAssigneeId` and `payload.newAssigneeId`
- [ ] Substatus change actions include `payload.previousSubstatusId` and `payload.newSubstatusId`
- [ ] Merge actions include the linked source/target ticket IDs in the payload
- [ ] `actorPersonId` or `actorClientId` must always be non-null; automated actions use a system account ID

**Priority:** P0 | **Feature Ref:** F6

---

## Epic 7: Media Attachments (F7)

> File and image uploads attached to tickets, with thumbnail generation and download access.

### US-7.1: Upload a Photo to a Ticket from a Mobile Browser
**As a** Dana Reyes (municipal staff), **I want to** attach a photo taken by a field crew to the relevant ticket from a mobile browser, **so that** the visual evidence is permanently linked to the record.

**Acceptance Criteria:**
- [ ] `POST /api/tickets/{id}/media` accepts `multipart/form-data` with a `file` field and optional `label`
- [ ] Supported image types: JPEG, PNG, GIF, WebP; supported documents: PDF; all others return HTTP 422 with `INVALID_FILE_TYPE`
- [ ] File size must not exceed `MAX_UPLOAD_SIZE` (default 10 MB); exceeding returns HTTP 422 with `FILE_TOO_LARGE`
- [ ] System generates a 300×300px JPEG thumbnail for image files
- [ ] An `actions` record of type `upload` is created referencing the new media record ID
- [ ] Upload form is fully functional on a 375px mobile viewport
- [ ] Maximum 20 attachments per ticket (configurable); exceeding returns HTTP 422 with `ATTACHMENT_LIMIT`

**Priority:** P1 | **Feature Ref:** F7

---

### US-7.2: View and Download Ticket Attachments
**As a** Priya Nair (constituent), **I want to** see the photos I attached to my service request and know that staff can see them too, **so that** I'm confident my visual evidence was received.

**Acceptance Criteria:**
- [ ] Ticket detail view displays image thumbnails inline for all image attachments
- [ ] All attachment types include a download link accessible to permitted callers
- [ ] `GET /api/tickets/{id}/media` returns the full list of media records for a ticket
- [ ] For staff-only category tickets, callers without `staff` or `admin` role receive HTTP 403
- [ ] Open311 `media_url` submissions are stored as URL-referenced records (no file download); no thumbnail is generated

**Priority:** P1 | **Feature Ref:** F7

---

## Epic 8: Notification System (F8)

> Automated email notifications to constituents and staff triggered by ticket lifecycle events.

### US-8.1: Receive Email Confirmation After Submitting a Request
**As a** Priya Nair (constituent), **I want to** receive an email confirmation immediately after submitting a service request, **so that** I have the ticket number and a direct link to check its status without needing to call city hall.

**Acceptance Criteria:**
- [ ] Ticket creation triggers an email to `reporterEmail` using the `ticket_created` template
- [ ] Confirmation email contains the ticket ID, ticket title, category, status, and a direct URL to the public tracking page
- [ ] Email is sent via the configured SMTP server within 30 seconds of ticket creation
- [ ] No notification is sent if the reporter has no email address (silent skip)
- [ ] No notification is sent for tickets in staff-only categories to public/anonymous reporters
- [ ] SMTP failures are logged to Graylog and retried up to 3 times with exponential backoff; they do not fail the ticket creation

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.2: Notify Assignee When a Ticket Is Assigned
**As a** Dana Reyes (municipal staff), **I want** the staff member I assign a ticket to to receive an email notification, **so that** they are immediately aware of their new responsibility without me needing to contact them separately.

**Acceptance Criteria:**
- [ ] Ticket assignment triggers an email to the new assignee's primary email address
- [ ] Email uses the `ticket_assigned` template with variables: `{{ticket_id}}`, `{{title}}`, `{{assignee_name}}`, `{{reporter}}`, `{{ticket_url}}`
- [ ] Notification deduplication: identical notification sent within 60 seconds is skipped silently
- [ ] Notification log entry is created in `notification_log` for each sent notification
- [ ] Digest emails summarizing open/new tickets are sent to active department staff on a configurable schedule (default: daily at 7am)
- [ ] Digest email is skipped for departments with 0 open tickets

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.3: Notify Reporter When Staff Posts a Response
**As a** Priya Nair (constituent), **I want to** receive an email when a staff member posts an update on my service request, **so that** I know progress is being made without having to check the city website repeatedly.

**Acceptance Criteria:**
- [ ] When a `response` action (visibility = external) is created on a ticket, the system sends an email to the reporter
- [ ] Email uses the `ticket_response` template; the response body text is included in the email
- [ ] Email includes a link to the ticket's public status tracking page
- [ ] CC'd staff watchers on the ticket receive update notifications when the ticket is updated
- [ ] Admin can configure SMTP settings via `PUT /api/notifications/settings` without editing config files

**Priority:** P1 | **Feature Ref:** F8

---

## Epic 9: Reporting & Metrics (F9)

> Standard reports and a metrics endpoint for supervisors and administrators to monitor ticket volume, SLA compliance, and staff performance.

### US-9.1: View the Department SLA Compliance Dashboard
**As a** Marcus Webb (department manager), **I want to** see SLA compliance metrics on login without navigating away, **so that** I can immediately identify which categories are breaching their SLA targets.

**Acceptance Criteria:**
- [ ] `GET /api/metrics/sla` returns SLA metrics per category: `categoryId`, `categoryName`, `totalClosed`, `onTime`, `late`, `onTimePct`
- [ ] Metrics endpoint is public (no authentication required) and cached for 5 minutes
- [ ] SLA on-time calculation: closed before `datetimeOpened + category.slaDays` business days = `on_time`; past expected date (open or closed) = `late`; `slaDays = null` = `no_sla`
- [ ] Metrics are visible on the staff dashboard without additional navigation
- [ ] `days` filter parameter (1–365, default 30) controls the rolling calculation window

**Priority:** P1 | **Feature Ref:** F9

---

### US-9.2: Generate and Export a Weekly Activity Report
**As a** Marcus Webb (department manager), **I want to** generate an activity report for my department filtered by date range and download it as CSV, **so that** I can share weekly performance data with city leadership in under 5 minutes.

**Acceptance Criteria:**
- [ ] `GET /api/reports/activity` returns: `totalOpened`, `totalClosed`, `openAtPeriodEnd`, and a `byDay` breakdown
- [ ] All report endpoints support `dateFrom`, `dateTo`, `categoryId`, `departmentId`, and `assigneeId` filter parameters
- [ ] Maximum report date range is 2 years; exceeding returns HTTP 422 with `DATE_RANGE_TOO_LARGE`
- [ ] `?format=csv` returns a downloadable CSV for any report endpoint
- [ ] CSV column order is stable across all exports
- [ ] Caller must have `staff` or `admin` role; HTTP 403 otherwise
- [ ] Assignment report (`/api/reports/assignments`) returns per-staff: `open`, `closed`, `avgDaysToClose`

**Priority:** P1 | **Feature Ref:** F9

---

### US-9.3: View Open Ticket Age and SLA Breach Report
**As a** Marcus Webb (department manager), **I want to** see a report of all tickets that are open beyond their SLA threshold, **so that** I can prioritize reassignment and escalation before constituents complain.

**Acceptance Criteria:**
- [ ] `GET /api/reports/open-age` returns tickets currently open past their SLA expected close date, with days overdue
- [ ] `GET /api/reports/sla` returns on-time vs. late breakdown per category for a configurable period
- [ ] `GET /api/reports/staff-performance` returns per-staff response times and closure rates
- [ ] `GET /api/reports/volume` returns daily/weekly/monthly submission trend data
- [ ] All reports run against MySQL aggregation queries (not Solr)
- [ ] Report results return within a reasonable time for date ranges up to 2 years

**Priority:** P1 | **Feature Ref:** F9

---

## Epic 10: Role-Based Access Control (F10)

> Server-side enforcement of role-based permissions and per-category display/posting restrictions.

### US-10.1: Enforce Role-Based Permissions on All API Endpoints
**As a** Tomás Eriksson (system administrator), **I want** every API endpoint to enforce the caller's role before returning data or accepting mutations, **so that** staff cannot access data above their permission level and anonymous users cannot perform privileged actions.

**Acceptance Criteria:**
- [ ] Every API request passes through auth middleware that resolves caller role from JWT (or `anonymous` if no JWT)
- [ ] `admin` role can perform all operations including delete, user management, and admin configuration
- [ ] `staff` role can manage tickets in their department(s) and view all permitted categories
- [ ] `public` role can view and track only their own submitted tickets; matched by `reporterPersonId` or session-stored reporter email
- [ ] `anonymous` users can only submit tickets in categories with `postingPermission = 'anonymous'`; HTTP 403 otherwise
- [ ] Role is read from `people.role` DB column on each request — JWT role claim alone is not trusted
- [ ] HTTP 401 returned for missing/invalid JWT; HTTP 403 for valid JWT but insufficient role

**Priority:** P0 | **Feature Ref:** F10

---

### US-10.2: Restrict Ticket Visibility by Category Display Permission
**As a** Priya Nair (constituent), **I want to** see only the public service request categories and tickets, **so that** internal staff-only workflows remain confidential.

**Acceptance Criteria:**
- [ ] Ticket list and search results automatically exclude `displayPermission = 'staff'` category tickets for non-staff/admin callers
- [ ] Direct access to a staff-only category ticket by a public/anonymous caller returns HTTP 403 with `CATEGORY_FORBIDDEN`
- [ ] Tickets in `displayPermission = 'public'` or `'anonymous'` categories are visible to all callers
- [ ] `postingPermission = 'staff'` categories block public and anonymous submission with HTTP 403 and `POSTING_FORBIDDEN`
- [ ] Open311 endpoints apply the same category permission checks

**Priority:** P0 | **Feature Ref:** F10

---

## Epic 11: Authentication (F11)

> OIDC-based staff login with JWT session management and secure logout.

### US-11.1: Log In via OIDC SSO
**As a** Dana Reyes (municipal staff), **I want to** log in using my city SSO credentials via the OIDC login page, **so that** I don't need a separate uReport password and my session is managed securely.

**Acceptance Criteria:**
- [ ] `GET /auth/login` initiates OIDC authorization code flow, redirecting to the configured provider
- [ ] After authentication, `/auth/callback` exchanges the code for OIDC tokens; validates `state` nonce for CSRF protection
- [ ] ID token signature is validated against the provider's JWKS endpoint; invalid token returns HTTP 401 with `INVALID_ID_TOKEN`
- [ ] uReport issues a session JWT stored as an HttpOnly, Secure, SameSite=Lax cookie (`ureport_session`)
- [ ] JWT payload contains `{ sub: personId, role: people.role, iss: "ureport", exp }` with `SESSION_TTL` expiry (default 8 hours)
- [ ] User is redirected to the originally requested URL or default dashboard after login
- [ ] If OIDC provider is unreachable, user sees an error and the system returns HTTP 503 with `IDP_UNAVAILABLE`

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.2: Maintain Secure Session Across the Workday
**As a** Dana Reyes (municipal staff), **I want** my login session to persist for a full work shift and to be cleanly invalidated on logout, **so that** I never lose form input due to unexpected session expiry and my session ends securely when I leave.

**Acceptance Criteria:**
- [ ] Session JWT remains valid for `SESSION_TTL` seconds (default 28800 = 8 hours)
- [ ] Expired or invalid JWT returns HTTP 401 with `UNAUTHENTICATED`; SPA redirects to `/login`
- [ ] Deactivated person account returns HTTP 401 with `SESSION_REVOKED` on next request
- [ ] `POST /auth/logout` clears the `ureport_session` cookie and redirects to OIDC provider end-session endpoint
- [ ] `GET /auth/me` returns the current user's person record and role
- [ ] OIDC configuration (`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `SESSION_TTL`) is configurable via site config or admin UI without editing source files

**Priority:** P0 | **Feature Ref:** F11

---

## Epic 12: Bookmark & Saved Search Management (F12)

> Personal saved search shortcuts that eliminate repetitive filter re-entry for staff.

### US-12.1: Save a Frequently Used Search Filter as a Bookmark
**As a** Dana Reyes (municipal staff), **I want to** save my current filter combination (department + open + assigned to me) as a named bookmark, **so that** I can restore it instantly each morning without re-entering the same filters.

**Acceptance Criteria:**
- [ ] Staff can submit `POST /api/bookmarks` with a `name` (max 100 chars) and the current `filterState` object
- [ ] `name` must be unique within the user's own bookmarks (case-insensitive); duplicate returns HTTP 422 with `DUPLICATE_NAME`
- [ ] Maximum 50 bookmarks per user; exceeding returns HTTP 422 with `BOOKMARK_LIMIT`
- [ ] `GET /api/bookmarks` returns only the authenticated user's bookmarks (not other users')
- [ ] Bookmarks persist across sessions
- [ ] `DELETE /api/bookmarks/{id}` removes the bookmark; HTTP 404 if not found or not owned by the caller
- [ ] Unauthenticated requests return HTTP 401

**Priority:** P2 | **Feature Ref:** F12

---

### US-12.2: Restore a Saved Search with One Click
**As a** Dana Reyes (municipal staff), **I want to** select a saved bookmark from the search interface and have all filters automatically applied, **so that** I reach my personal ticket queue in ≤ 2 clicks after login.

**Acceptance Criteria:**
- [ ] `GET /api/bookmarks/{id}` returns the bookmark including the full `filterState` object
- [ ] SPA deserializes the `filterState` and populates the search form and URL parameters
- [ ] Bookmark filter state has the same shape as F4 search input parameters
- [ ] Bookmark is accessible in ≤ 2 interactions from the main dashboard after login

**Priority:** P2 | **Feature Ref:** F12

---

## Epic 13: Response Templates (F13)

> Reusable email response templates with variable substitution for efficient staff communication.

### US-13.1: Create a Reusable Response Template
**As a** Tomás Eriksson (system administrator), **I want to** create named response templates with variable placeholders, **so that** staff can respond to constituents consistently without retyping standard messages.

**Acceptance Criteria:**
- [ ] Admin can create a template with `name` (max 255 chars, unique), `subject`, and `body` (max 10,000 chars, required)
- [ ] Template body supports variable placeholders: `{{ticket_id}}`, `{{title}}`, `{{category}}`, `{{department}}`, `{{assignee_name}}`, `{{reporter_name}}`, `{{status}}`, `{{date_opened}}`, `{{expected_close_date}}`, `{{ticket_url}}`, `{{response_body}}`
- [ ] Unknown variable names in body are flagged as warnings in the API response but do not reject the creation
- [ ] Duplicate template name returns HTTP 422 with `DUPLICATE_NAME`
- [ ] System templates (identified by `slug`) cannot be deleted; attempting to delete returns HTTP 422 with `SYSTEM_TEMPLATE`
- [ ] API returns HTTP 201 with the full template object

**Priority:** P2 | **Feature Ref:** F13

---

### US-13.2: Use a Template When Composing a Ticket Response
**As a** Dana Reyes (municipal staff), **I want to** select a pre-written response template when replying to a constituent, **so that** I can compose and send a professional response in under 60 seconds.

**Acceptance Criteria:**
- [ ] Staff response compose form includes a template dropdown populated from `GET /api/templates`
- [ ] Selecting a template populates the response body with the template text (editable before sending)
- [ ] Template variables are substituted at send time with current ticket context values
- [ ] Missing variable values are substituted with an empty string (not left as raw `{{…}}` placeholders)
- [ ] Templates with `active = false` are hidden from the staff UI dropdown but still function for system notifications
- [ ] `GET /api/templates` requires `staff` or `admin` role; HTTP 403 otherwise

**Priority:** P2 | **Feature Ref:** F13

---

## Epic 14: API Client Management (F14)

> Admin management of Open311 API client keys for third-party integrations.

### US-14.1: Register a New API Client and Receive an API Key
**As a** Tomás Eriksson (Open311 API developer), **I want to** self-register a new API client through the admin UI and receive a generated API key, **so that** my mobile app can authenticate against the Open311 endpoint without filing an IT ticket.

**Acceptance Criteria:**
- [ ] Admin can create a client record via `POST /api/clients` with `name` (unique, max 255), `contactEmail` (valid RFC 5322), and optional `notes`
- [ ] System auto-generates a cryptographically random UUID v4 API key; admin cannot specify the key
- [ ] API key is returned in plain text **only** in the create response (`POST`) and key regeneration response — not in subsequent GET requests
- [ ] Subsequent `GET /api/clients/{id}` returns only `apiKeyHint` (first 8 chars + "…"), not the full key
- [ ] Duplicate client name returns HTTP 422 with `DUPLICATE_NAME`
- [ ] Only admin role can access client management endpoints; HTTP 403 otherwise
- [ ] API key can be created and displayed in under 2 minutes from the admin UI

**Priority:** P2 | **Feature Ref:** F14

---

### US-14.2: Revoke and Regenerate an API Client Key
**As a** Tomás Eriksson (system administrator), **I want to** revoke a compromised API key and issue a new one for the same client, **so that** a leaked key can be invalidated immediately without deleting the client record.

**Acceptance Criteria:**
- [ ] `DELETE /api/clients/{id}` deactivates (revokes) the client; subsequent Open311 requests with the revoked key are rejected with `[{"code":400,"description":"Invalid api_key"}]`
- [ ] `POST /api/clients/{id}/regenerate-key` generates a new UUID API key, immediately invalidates the old key, and returns the new key in plain text (one-time display)
- [ ] Revoking an already-inactive client returns HTTP 409 with `ALREADY_INACTIVE`
- [ ] Revoked client identity is preserved in the audit trail for previously submitted tickets (`actorClientId` remains intact)

**Priority:** P2 | **Feature Ref:** F14

---

## Epic 15: Modern React/Next.js SPA Frontend (F15)

> The primary new deliverable — a mobile-responsive, accessible SPA replacing all PHP template rendering.

### US-15.1: Access the Staff Ticket Dashboard on Any Device
**As a** Dana Reyes (municipal staff), **I want** the ticket management interface to work on both my desktop workstation and my laptop in the field, **so that** I can process tickets regardless of which device I'm using.

**Acceptance Criteria:**
- [ ] All SPA views are fully functional at viewport widths from 375px (mobile) to 1920px (desktop)
- [ ] Staff dashboard is accessible within 2 clicks after login
- [ ] Ticket list, search, detail, create, edit, assign, close, reopen, and delete actions are available in the SPA
- [ ] Ticket detail view renders all fields and action history without horizontal scroll at 375px
- [ ] Lighthouse performance score ≥ 85 on ticket list and search pages (mobile profile)
- [ ] Page transitions occur without full-page reloads (client-side navigation)

**Priority:** P0 | **Feature Ref:** F15

---

### US-15.2: Submit a Service Request via the Citizen Portal on Mobile
**As a** Priya Nair (constituent), **I want to** submit a service request with a description, location, and photo from my smartphone browser in under 3 minutes, **so that** I can report issues quickly without calling city hall.

**Acceptance Criteria:**
- [ ] Public `/submit` route loads active public categories using plain-language labels (not internal department codes)
- [ ] Form includes category selection, description, location (map picker + address field), optional contact info, and file upload
- [ ] Client-side validation runs before API submission: required fields, email format, location presence, file size/type limits
- [ ] Server validation errors (HTTP 422) are displayed as inline field-level error messages
- [ ] On successful submission, confirmation page displays ticket ID and a direct link to `/track/{id}`
- [ ] Full submission flow completes on a 375px iPhone viewport in under 3 minutes with no horizontal scroll
- [ ] Zero PHP template files are served to end users after migration — all HTML rendered by Next.js

**Priority:** P0 | **Feature Ref:** F15

---

### US-15.3: Meet WCAG 2.1 AA Accessibility Requirements
**As a** Priya Nair (constituent) and **as a** Dana Reyes (municipal staff), **we want** all pages to meet accessibility standards, **so that** staff and citizens with disabilities can use the system without barriers.

**Acceptance Criteria:**
- [ ] Automated axe-core WCAG 2.1 AA audit passes with 0 critical violations on all primary SPA routes
- [ ] All interactive elements are keyboard navigable
- [ ] All form inputs have associated `<label>` elements or `aria-label` attributes
- [ ] Color contrast ratios meet WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text)
- [ ] All images have descriptive `alt` text; decorative images have empty `alt=""`
- [ ] Component library (Radix UI / shadcn/ui) is used for accessible dialog, dropdown, and form primitives
- [ ] i18n: all user-facing strings use gettext-compatible i18n; no hard-coded English strings in templates or components

**Priority:** P0 | **Feature Ref:** F15

---

### US-15.4: Access Admin Configuration Screens in the SPA
**As a** Tomás Eriksson (system administrator), **I want to** manage departments, categories, people, templates, API clients, and substatuses through the SPA admin UI, **so that** I can configure the system without SSH access or direct database editing.

**Acceptance Criteria:**
- [ ] Admin routes are accessible: `/admin/departments`, `/admin/categories`, `/admin/people`, `/admin/templates`, `/admin/clients`, `/admin/substatuses`
- [ ] All admin CRUD operations (create, edit, deactivate/delete) are available without leaving the SPA
- [ ] Admin routes redirect to login for unauthenticated users; redirect to access-denied page for non-admin roles
- [ ] OIDC and SMTP settings are configurable via the admin UI without editing any configuration files
- [ ] OpenAPI Swagger UI is accessible at `/api/docs` for staff and admins

**Priority:** P0 | **Feature Ref:** F15

---

## Epic 16: RESTful JSON API Backend (F16)

> The second primary new deliverable — a documented, type-safe JSON API replacing all PHP template-based data output.

### US-16.1: Consume a Consistent JSON API from the SPA
**As a** Tomás Eriksson (Open311 API developer), **I want** all non-Open311 endpoints to follow a consistent JSON response envelope and use correct HTTP status codes, **so that** I can build reliable integrations without reverse-engineering PHP source code.

**Acceptance Criteria:**
- [ ] All `/api/` responses use the envelope: `{ "data": …, "meta": …, "errors": [] }`
- [ ] HTTP status codes follow the contract: 200 (read/update), 201 (create), 204 (delete), 400 (malformed), 401 (unauthenticated), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation), 500 (server error), 503 (dependency unavailable)
- [ ] Validation errors (HTTP 422) include field-level messages: `[{ "field": "…", "message": "…" }]`
- [ ] Malformed JSON body returns HTTP 400 before reaching controller logic
- [ ] All `id` path parameters must be positive integers; non-integer format returns HTTP 400
- [ ] String lengths, enum values, and date formats are validated server-side on every request regardless of frontend validation

**Priority:** P0 | **Feature Ref:** F16

---

### US-16.2: Access Complete OpenAPI Documentation for All Endpoints
**As a** Tomás Eriksson (Open311 API developer), **I want to** access a Swagger UI at `/api/docs` that documents every non-Open311 endpoint, **so that** I can map Open311 field names to internal fields and build my mobile app without reading PHP source code.

**Acceptance Criteria:**
- [ ] `GET /api/docs` serves a Swagger UI HTML page
- [ ] `GET /api/openapi.json` and `GET /api/openapi.yaml` serve the raw OpenAPI 3.1 specification
- [ ] 100% of non-Open311 API endpoints are documented in the spec (paths, parameters, request bodies, response schemas)
- [ ] TypeScript client types are auto-generated from the OpenAPI 3.1 spec during frontend build using `openapi-typescript`
- [ ] OpenAPI spec is auto-generated from annotated controllers (not hand-maintained)

**Priority:** P0 | **Feature Ref:** F16

---

### US-16.3: Access Data via a Clean Repository Pattern (Developer)
**As a** Tomás Eriksson (system administrator/developer), **I want** all database access to go through repository classes rather than raw SQL in controllers, **so that** I can mock dependencies in unit tests and maintain the codebase without fear of regressions.

**Acceptance Criteria:**
- [ ] Each entity has a corresponding repository class: `TicketRepository`, `PersonRepository`, `CategoryRepository`, etc.
- [ ] Repositories expose typed methods; no raw SQL in controllers
- [ ] Repository interfaces are mockable in unit tests
- [ ] PDO (or Doctrine DBAL) is used as the underlying database layer
- [ ] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) are applied to all `/api/` responses via middleware
- [ ] All unhandled exceptions are caught by the error handler middleware, logged to Graylog, and returned as generic HTTP 500 envelopes

**Priority:** P0 | **Feature Ref:** F16

---

## Epic 17: Substatus Management (F17)

> Fine-grained ticket state labels within the open/closed primary status for richer workflow tracking.

### US-17.1: Create and Configure Substatuses
**As a** Tomás Eriksson (system administrator), **I want to** create substatus labels like "Pending Parts" or "Scheduled" for open tickets and "Duplicate" for closed tickets, **so that** staff have finer-grained state information than just open/closed.

**Acceptance Criteria:**
- [ ] Admin can create a substatus with `label` (max 100 chars), `primaryStatus` (`open` or `closed`), `isDefault`, `active`, and `sortOrder`
- [ ] `label` must be unique within the same `primaryStatus` (case-insensitive); duplicate returns HTTP 422 with `DUPLICATE_LABEL`
- [ ] Setting `isDefault = true` automatically clears `isDefault` from any other substatus of the same `primaryStatus`
- [ ] Deactivating a substatus does not change tickets currently assigned it; those tickets retain the substatus until manually changed
- [ ] API returns HTTP 201 with the full substatus object; only admin role can create/edit/delete

**Priority:** P1 | **Feature Ref:** F17

---

### US-17.2: Apply and Display Substatus on a Ticket
**As a** Dana Reyes (municipal staff), **I want to** apply a substatus to a ticket and see it displayed alongside the primary status, **so that** I can communicate more specific state information to colleagues and supervisors.

**Acceptance Criteria:**
- [ ] Staff can apply a substatus via `PATCH /api/tickets/{id}` with `substatusId`
- [ ] Substatus `primaryStatus` must match the ticket's current primary status; mismatch returns HTTP 422 with `STATUS_MISMATCH`
- [ ] Substatus change creates an `actions` entry of type `substatus` with `payload.previousSubstatusId` and `payload.newSubstatusId`
- [ ] Substatus label is displayed alongside primary status in ticket list and detail views
- [ ] New tickets automatically receive the configured default substatus for their initial primary status on creation
- [ ] Ticket search (F4) supports filtering by `substatusId`

**Priority:** P1 | **Feature Ref:** F17

---

## Epic 18: Ticket Merging (F18)

> Merge duplicate service requests into a single canonical ticket to eliminate redundant queue entries.

### US-18.1: Merge a Duplicate Ticket into a Canonical Record
**As a** Dana Reyes (municipal staff), **I want to** merge a duplicate ticket into the original canonical ticket, **so that** staff work on one record instead of five identical pothole reports.

**Acceptance Criteria:**
- [ ] Staff can trigger a merge from the source ticket detail page by selecting a target ticket
- [ ] `GET /api/tickets/{id}/merge-candidates` returns valid merge target tickets (open, not already merged) for search/selection
- [ ] System displays a side-by-side preview of source and target ticket summaries before confirming
- [ ] After confirmation, `POST /api/tickets/{id}/merge` validates: source ≠ target, source not already merged, target is open and not merged
- [ ] Source ticket is closed (`status = 'closed'`, `mergedIntoTicketId = target.id`, `datetimeClosed = NOW()`)
- [ ] Two `actions` records of type `merged` are created: one on the source (with `payload.mergedIntoTicketId`) and one on the target (with `payload.mergedFromTicketId`)
- [ ] Source reporter receives an email with the target ticket URL
- [ ] Both tickets are updated in the Solr index; merged/closed source tickets are flagged as merged in search results
- [ ] Merging a ticket into itself returns HTTP 422 with `SELF_MERGE`
- [ ] Merging into a closed or already-merged target returns HTTP 409

**Priority:** P2 | **Feature Ref:** F18

---

## Story Index

| Story ID | Title | Persona | Priority | Feature |
|----------|-------|---------|----------|---------|
| US-0.1 | Create a Ticket as a Staff Member | PER-01 Dana | P0 | F0 |
| US-0.2 | View Ticket Detail with Full History | PER-01 Dana | P0 | F0 |
| US-0.3 | Assign a Ticket to a Staff Member | PER-02 Marcus | P0 | F0 |
| US-0.4 | Close a Ticket with a Resolution Response | PER-01 Dana | P0 | F0 |
| US-0.5 | Reopen a Closed Ticket | PER-01 Dana | P0 | F0 |
| US-0.6 | Post an Internal Comment on a Ticket | PER-01 Dana | P0 | F0 |
| US-0.7 | Delete a Ticket (Admin) | PER-04 Tomás | P0 | F0 |
| US-1.1 | Submit a Service Request via Open311 | PER-04 Tomás | P0 | F1 |
| US-1.2 | Query Service Requests via Open311 | PER-04 Tomás | P0 | F1 |
| US-1.3 | Discover Available Open311 Services | PER-04 Tomás | P0 | F1 |
| US-2.1 | Create and Configure a Service Category | PER-04 Tomás | P0 | F2 |
| US-2.2 | Deactivate a Department with Active Tickets | PER-04 Tomás | P0 | F2 |
| US-2.3 | Configure Auto-Close Rule for a Category | PER-02 Marcus | P0 | F2 |
| US-3.1 | Create a Staff User Account | PER-04 Tomás | P1 | F3 |
| US-3.2 | Auto-Provision Person Record on First OIDC Login | PER-04 Tomás | P1 | F3 |
| US-3.3 | Search and Manage Contact Methods for a Person | PER-04 Tomás | P1 | F3 |
| US-4.1 | Search Tickets with Keyword and Filters | PER-01 Dana | P1 | F4 |
| US-4.2 | Export Ticket Search Results as CSV | PER-02 Marcus | P1 | F4 |
| US-4.3 | Keep Solr Index in Sync with Ticket Mutations | PER-04 Tomás | P1 | F4 |
| US-5.1 | Submit a Ticket with Location Using a Map Picker | PER-03 Priya | P1 | F5 |
| US-5.2 | View Geo-Clustered Ticket Density Map | PER-01 Dana | P1 | F5 |
| US-6.1 | View the Complete Audit Trail for a Ticket | PER-02 Marcus | P0 | F6 |
| US-6.2 | Record Audit Actions for All Ticket State Transitions | PER-04 Tomás | P0 | F6 |
| US-7.1 | Upload a Photo to a Ticket from a Mobile Browser | PER-01 Dana | P1 | F7 |
| US-7.2 | View and Download Ticket Attachments | PER-03 Priya | P1 | F7 |
| US-8.1 | Receive Email Confirmation After Submitting a Request | PER-03 Priya | P1 | F8 |
| US-8.2 | Notify Assignee When a Ticket Is Assigned | PER-01 Dana | P1 | F8 |
| US-8.3 | Notify Reporter When Staff Posts a Response | PER-03 Priya | P1 | F8 |
| US-9.1 | View the Department SLA Compliance Dashboard | PER-02 Marcus | P1 | F9 |
| US-9.2 | Generate and Export a Weekly Activity Report | PER-02 Marcus | P1 | F9 |
| US-9.3 | View Open Ticket Age and SLA Breach Report | PER-02 Marcus | P1 | F9 |
| US-10.1 | Enforce Role-Based Permissions on All API Endpoints | PER-04 Tomás | P0 | F10 |
| US-10.2 | Restrict Ticket Visibility by Category Display Permission | PER-03 Priya | P0 | F10 |
| US-11.1 | Log In via OIDC SSO | PER-01 Dana | P0 | F11 |
| US-11.2 | Maintain Secure Session Across the Workday | PER-01 Dana | P0 | F11 |
| US-12.1 | Save a Frequently Used Search Filter as a Bookmark | PER-01 Dana | P2 | F12 |
| US-12.2 | Restore a Saved Search with One Click | PER-01 Dana | P2 | F12 |
| US-13.1 | Create a Reusable Response Template | PER-04 Tomás | P2 | F13 |
| US-13.2 | Use a Template When Composing a Ticket Response | PER-01 Dana | P2 | F13 |
| US-14.1 | Register a New API Client and Receive an API Key | PER-04 Tomás | P2 | F14 |
| US-14.2 | Revoke and Regenerate an API Client Key | PER-04 Tomás | P2 | F14 |
| US-15.1 | Access the Staff Ticket Dashboard on Any Device | PER-01 Dana | P0 | F15 |
| US-15.2 | Submit a Service Request via the Citizen Portal on Mobile | PER-03 Priya | P0 | F15 |
| US-15.3 | Meet WCAG 2.1 AA Accessibility Requirements | PER-03 Priya / PER-01 Dana | P0 | F15 |
| US-15.4 | Access Admin Configuration Screens in the SPA | PER-04 Tomás | P0 | F15 |
| US-16.1 | Consume a Consistent JSON API from the SPA | PER-04 Tomás | P0 | F16 |
| US-16.2 | Access Complete OpenAPI Documentation for All Endpoints | PER-04 Tomás | P0 | F16 |
| US-16.3 | Access Data via a Clean Repository Pattern (Developer) | PER-04 Tomás | P0 | F16 |
| US-17.1 | Create and Configure Substatuses | PER-04 Tomás | P1 | F17 |
| US-17.2 | Apply and Display Substatus on a Ticket | PER-01 Dana | P1 | F17 |
| US-18.1 | Merge a Duplicate Ticket into a Canonical Record | PER-01 Dana | P2 | F18 |

**Total stories: 51** across 19 epics (F0–F18).

---

## Priority Summary

| Priority | Story Count | Story IDs |
|----------|-------------|-----------|
| P0 — Critical / MVP-blocking | 26 | US-0.1–0.7, US-1.1–1.3, US-2.1–2.3, US-6.1–6.2, US-10.1–10.2, US-11.1–11.2, US-15.1–15.4, US-16.1–16.3 |
| P1 — Required for MVP | 18 | US-3.1–3.3, US-4.1–4.3, US-5.1–5.2, US-7.1–7.2, US-8.1–8.3, US-9.1–9.3, US-17.1–17.2 |
| P2 — Standard / Post-core | 7 | US-12.1–12.2, US-13.1–13.2, US-14.1–14.2, US-18.1 |
| P3 — Future / Out of scope | 0 | — |

---

*Document generated: 2026-06-23*  
*Based on: PRD-uReport.md v1.0 · FRD-uReport.md v1.0 · PERSONAS-uReport.md v1.0*  
*Project: uReport Municipal CRM Modernization*
