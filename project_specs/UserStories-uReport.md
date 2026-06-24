# User Stories: uReport Modernization

**Project:** uReport CRM — Municipal Constituent Issue Tracking System  
**Acronym:** uReport  
**Version:** 1.0  
**Date:** 2026-06-24  
**Status:** Active  
**Related PRD:** `project_specs/PRD-uReport.md`  
**Related FRD:** `project_specs/FRD-uReport.md`  
**Related Personas:** `project_specs/PERSONAS-uReport.md`

---

## Priority Definitions

| Priority | Label | Description |
|----------|-------|-------------|
| **P0** | Critical / MVP | Must be delivered in the first working release; system is non-functional without it |
| **P1** | High / Required | Required for a fully operational system; blocks key workflows if absent |
| **P2** | Medium / Required | Important operational or productivity feature; system is usable without it but meaningfully degraded |
| **P3** | Low | Nice-to-have; not present in this migration (all features are P0–P2) |

---

## Personas Reference

| ID | Name | Role |
|----|------|------|
| PER-01 | Marcus Webb | City Case Worker (Staff) |
| PER-02 | Diana Reyes | Department Administrator |
| PER-03 | Jordan Kim | System Administrator |
| PER-04 | Integra Transit App | External API Client / Third-Party Integrator |

---

## Epic 0: Ticket / Case Lifecycle Management (F0)

*The core entity of uReport. Staff and public users create and manage constituent issue tickets through their full lifecycle, from creation through resolution.*

---

### US-0.1: Create a New Ticket
**As a** Marcus Webb (case worker), **I want to** create a new ticket with category, description, location, and reporter details, **so that** constituent issues are formally tracked from first report to resolution.

**Acceptance Criteria:**
- [ ] POST `/api/v1/tickets` accepts category_id, description, location fields, reporter info, issueType_id, contactMethod_id, and customFields
- [ ] System validates the category is active and the caller's role satisfies the category's `postingPermissionLevel`
- [ ] If no existing person matches the reporter email, a new `people` record is auto-created
- [ ] Ticket is created with `status = 'open'`, `enteredDate = NOW()`, and default substatus for open
- [ ] System assigns `assignedPerson_id` to the category's `defaultPerson_id` if one is configured
- [ ] A `ticketHistory` entry is appended with action type "open"
- [ ] API returns 201 Created with the full ticket object including id, status, and all provided fields
- [ ] `description` must be non-empty; max 65,535 characters; empty description returns 422 DESCRIPTION_REQUIRED
- [ ] `latitude` must be in [-90, 90] and `longitude` in [-180, 180]; out-of-range values return 422 INVALID_COORDINATES

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: Assign a Ticket to a Staff Member
**As a** Marcus Webb (case worker), **I want to** assign an open ticket to a specific staff person, **so that** ownership and accountability are clear and the right person works on each issue.

**Acceptance Criteria:**
- [ ] PATCH `/api/v1/tickets/{id}/assign` accepts `assignedPerson_id`
- [ ] System validates the ticket is open and the target person has `role = 'staff'`
- [ ] `tickets.assignedPerson_id` and `lastModified` are updated
- [ ] A "assignment" history entry is appended with the assigned person captured
- [ ] Attempting to assign to a non-staff person returns 422 INVALID_ASSIGNEE
- [ ] Attempting to assign a non-existent ticket returns 404 TICKET_NOT_FOUND

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: Update Ticket Fields
**As a** Marcus Webb (case worker), **I want to** update a ticket's category, location, description, or custom fields, **so that** the record reflects the most current and accurate information.

**Acceptance Criteria:**
- [ ] PATCH `/api/v1/tickets/{id}` accepts any combination of updatable fields
- [ ] Only users with `role = 'staff'` can perform updates
- [ ] A category change appends a "changeCategory" history entry with `data.original.category_id` and `data.updated.category_id`
- [ ] A location change appends a "changeLocation" history entry with old and new address in `data`
- [ ] Other field changes append an "update" history entry with changed fields in `data`
- [ ] `tickets.lastModified` is updated on every change
- [ ] Non-staff requests return 403 PERMISSION_DENIED

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: Close a Ticket with a Substatus
**As a** Marcus Webb (case worker), **I want to** close a ticket with an appropriate substatus (e.g., Resolved, Duplicate, Bogus), **so that** the outcome is clearly recorded and the constituent receives proper notification.

**Acceptance Criteria:**
- [ ] PATCH `/api/v1/tickets/{id}/close` accepts `substatus_id`
- [ ] `substatus_id` must reference a substatus with `status = 'closed'`; wrong type returns 422 INVALID_SUBSTATUS
- [ ] `tickets.status` is set to `'closed'`, `closedDate = NOW()`, `substatus_id` is updated
- [ ] A "closed" history entry is appended
- [ ] Attempting to close an already-closed ticket returns 422 INVALID_TRANSITION
- [ ] Digest notification is scheduled per F16

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.5: Mark a Ticket as a Duplicate
**As a** Marcus Webb (case worker), **I want to** mark one ticket as a duplicate of another, **so that** duplicate constituent reports are linked and resolved together without redundant work.

**Acceptance Criteria:**
- [ ] PATCH `/api/v1/tickets/{id}/duplicate` accepts `parent_id`
- [ ] System validates the parent ticket exists and is not itself a child of another ticket in the chain (circular parentage is forbidden)
- [ ] `tickets.parent_id` is set, `status` is set to `'closed'` using the Duplicate substatus
- [ ] A "duplicate" history entry is appended with `data = { "duplicate": parent_id }`
- [ ] Circular parentage returns 422 CIRCULAR_DUPLICATE
- [ ] Non-existent parent_id returns 404 TICKET_NOT_FOUND

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.6: Reopen a Closed Ticket
**As a** Marcus Webb (case worker), **I want to** reopen a previously closed ticket, **so that** issues that resurface or were closed prematurely can be re-entered into the active workflow.

**Acceptance Criteria:**
- [ ] PATCH `/api/v1/tickets/{id}/reopen` is available to staff only
- [ ] System validates the ticket is currently closed
- [ ] `status` is set to `'open'`, `closedDate` is cleared, and the default open substatus is assigned
- [ ] An "update" history entry is appended with `notes = 'Reopened'`
- [ ] Attempting to reopen an already-open ticket returns 422 INVALID_TRANSITION

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.7: Record a Comment on a Ticket
**As a** Marcus Webb (case worker), **I want to** add a free-text comment to a ticket, **so that** internal notes and observations are preserved in the ticket record.

**Acceptance Criteria:**
- [ ] POST `/api/v1/tickets/{id}/comments` accepts a `notes` text field
- [ ] A "comment" history entry is appended with the provided `notes`
- [ ] Ticket `lastModified` is updated
- [ ] Comment is visible in the ticket history view

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.8: Export Ticket Search Results
**As a** Marcus Webb (case worker), **I want to** export a filtered set of tickets to CSV or print view, **so that** I can prepare briefings and reports for my supervisor.

**Acceptance Criteria:**
- [ ] CSV and print-HTML export is restricted to staff only; public/anonymous requests return 403
- [ ] Export reflects the active search/filter parameters applied
- [ ] CSV output includes all standard ticket fields as column headers
- [ ] Print-HTML output renders a printable layout of the result set
- [ ] Export of up to 200 tickets completes within 10 seconds

**Priority:** P0 | **Feature Ref:** F0

---

## Epic 1: Ticket History and Action Log (F1)

*Every change to a ticket is immutably recorded as a `ticketHistory` entry. Descriptions are rendered dynamically via template variable substitution.*

---

### US-1.1: View Full Ticket History
**As a** Marcus Webb (case worker), **I want to** view the complete chronological history of a ticket, **so that** I can understand all prior actions, comments, and status changes at a glance.

**Acceptance Criteria:**
- [ ] GET `/api/v1/tickets/{id}/history` returns all history entries ordered by `enteredDate ASC`
- [ ] Each entry includes: action name, rendered description, enteredByPerson name, actionPerson name, enteredDate, notes, and sentNotifications
- [ ] Template variables (`{enteredByPerson}`, `{actionPerson}`, `{original:field}`, `{updated:field}`, `{duplicate:ticket_id}`) are resolved to human-readable values at read time
- [ ] Unknown template variable tokens are left as-is without error
- [ ] Staff see all history entries including internal notes
- [ ] Ticket not found returns 404 TICKET_NOT_FOUND

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: History Entry Auto-Appended on Lifecycle Events
**As a** Marcus Webb (case worker), **I want** a history entry to be automatically created for every ticket action, **so that** the audit trail is complete and requires no manual intervention.

**Acceptance Criteria:**
- [ ] A history entry is automatically appended for: open, assign, close, reopen, update, comment, mark-duplicate, category change, location change, media upload, and response actions
- [ ] Each entry records `enteredByPerson_id`, `actionPerson_id` (where applicable), `action_id`, `enteredDate`, `actionDate`, `notes`, and `data`
- [ ] History entries are immutable — no application-layer UPDATE or DELETE is permitted; attempts return 405 METHOD_NOT_ALLOWED
- [ ] `data` JSONB is valid JSON; invalid JSON is rejected by the database constraint

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: View Notification Recipients on History Entry
**As a** Marcus Webb (case worker), **I want to** see which email addresses were notified for each history entry, **so that** I can confirm constituents and assignees received relevant communications.

**Acceptance Criteria:**
- [ ] `sentNotifications` field is returned on each history entry object
- [ ] After the digest notification job runs, `sentNotifications` is populated with the list of notified email addresses
- [ ] Entries with no notifications sent show an empty or null `sentNotifications` field

**Priority:** P0 | **Feature Ref:** F1

---

## Epic 2: Open311 GeoReport v2 REST API (F2)

*uReport exposes a fully Open311 GeoReport v2 compliant REST API. All response shapes must be byte-compatible with the legacy PHP implementation.*

---

### US-2.1: Discover API Metadata
**As a** Integra Transit App (external API client), **I want to** call `GET /open311/discovery` to retrieve API endpoint URLs and metadata, **so that** my integration can auto-configure its endpoint base URLs.

**Acceptance Criteria:**
- [ ] GET `/open311/discovery` returns endpoint URLs, jurisdiction_id, changeset date, contact info, and formats list
- [ ] Response is available in both `format=json` (default) and `format=xml`
- [ ] XML element names exactly match the GeoReport v2 specification
- [ ] No authentication is required

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: List Available Services
**As a** Integra Transit App (external API client), **I want to** call `GET /open311/services` to enumerate active service types, **so that** my app can populate its issue category picker for constituents.

**Acceptance Criteria:**
- [ ] GET `/open311/services` returns all categories where `active = true` AND `postingPermissionLevel IN ('public', 'anonymous')`
- [ ] Results are ordered by `categoryGroups.ordering`, then `categories.name`
- [ ] Each service object includes: service_code, service_name, description, metadata (true/false), type ("realtime"), keywords, and group
- [ ] Optional `?service_code={id}` filter returns a single service definition
- [ ] Response is available in both JSON and XML formats with byte-compatible shapes
- [ ] No authentication is required

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Get Service Attributes
**As a** Integra Transit App (external API client), **I want to** call `GET /open311/services/{service_code}` to retrieve the custom attribute schema for a service, **so that** I can build the correct input form for constituent submissions.

**Acceptance Criteria:**
- [ ] GET `/open311/services/{service_code}` returns the service definition including an `attributes` array
- [ ] Each attribute maps from `categories.customFields` schema: code, datatype, required, description, order, and values (for list types)
- [ ] Non-existent service_code returns 404 SERVICE_NOT_FOUND
- [ ] Response is available in both JSON and XML formats

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.4: Submit a Service Request via Open311
**As a** Integra Transit App (external API client), **I want to** POST a new service request with my API key, **so that** constituent issue reports from my app are tracked in uReport without my code needing changes after the migration.

**Acceptance Criteria:**
- [ ] POST `/open311/requests` validates `api_key` against hashed `clients.api_key` using bcrypt comparison
- [ ] Obsolete API keys return 200 with a mobile-shutdown JSON payload; no ticket is created
- [ ] Invalid or missing API key returns 403 API_KEY_INVALID
- [ ] System creates a ticket via the same logic as internal ticket creation (F0), setting `client_id` to the authenticated client
- [ ] Response is a JSON array: `[{"service_request_id": "...", "service_notice": "", "account_id": ""}]` (or XML equivalent)
- [ ] Category posting permission is enforced; categories with `postingPermissionLevel = 'staff'` return 403 PERMISSION_DENIED
- [ ] A "open" history entry is appended with `enteredByPerson_id = null` (API-submitted)

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.5: Retrieve and Filter Service Requests
**As a** Integra Transit App (external API client), **I want to** call `GET /open311/requests` with filter parameters, **so that** I can synchronize ticket statuses with my app's data store.

**Acceptance Criteria:**
- [ ] GET `/open311/requests` supports filters: service_request_id, service_code, status, start_date, end_date, lat, long, radius, keyword, page, per_page
- [ ] Default per_page is 50; maximum is 200; minimum is 1
- [ ] `status=open` maps to `tickets.status = 'open'`; `status=closed` maps to `tickets.status = 'closed'`
- [ ] Response shape (JSON array or XML document) is byte-compatible with the legacy PHP output
- [ ] Each request object includes all required Open311 fields: service_request_id, status, status_notes, service_name, service_code, description, agency_responsible, requested_datetime, updated_datetime, expected_datetime, lat, long, address, address_id, zipcode, media_url

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.6: Retrieve a Single Service Request
**As a** Integra Transit App (external API client), **I want to** call `GET /open311/requests/{id}` to fetch the current status of a previously submitted request, **so that** I can show constituents real-time status updates.

**Acceptance Criteria:**
- [ ] GET `/open311/requests/{service_request_id}` returns a single-element JSON array (or XML `<service_requests>` with one child)
- [ ] Response includes `media_url` if the ticket has attachments (first image URL)
- [ ] Non-existent service_request_id returns 404 REQUEST_NOT_FOUND
- [ ] `expected_datetime` is computed as `enteredDate + category.slaDays` if `slaDays` is set

**Priority:** P0 | **Feature Ref:** F2

---

## Epic 3: Role-Based Access Control (F3)

*Three permission levels govern all system access: anonymous, public, and staff. Categories independently configure display and posting permission levels.*

---

### US-3.1: Enforce Role-Based Endpoint Access
**As a** Jordan Kim (system administrator), **I want** every API endpoint to enforce the appropriate role requirement, **so that** unauthorized users cannot access protected data or perform restricted operations.

**Acceptance Criteria:**
- [ ] Staff-only endpoints return 403 PERMISSION_DENIED for public or anonymous callers
- [ ] Public endpoints return 403 PERMISSION_DENIED for anonymous callers where the permission level requires authentication
- [ ] An unauthenticated request to a non-anonymous endpoint returns 401 UNAUTHORIZED
- [ ] Role is read from the `role` claim in the JWT and evaluated server-side; the React SPA also enforces display gating for UX

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.2: Enforce Per-Category Display and Posting Permissions
**As a** Jordan Kim (system administrator), **I want** each category to enforce its own `displayPermissionLevel` and `postingPermissionLevel`, **so that** sensitive service types are only visible and postable by the correct user tier.

**Acceptance Criteria:**
- [ ] Viewing a category with `displayPermissionLevel = 'staff'` returns 403 for anonymous and public callers
- [ ] Posting a ticket to a category with `postingPermissionLevel = 'public'` is denied for anonymous callers with 403 PERMISSION_DENIED
- [ ] Staff callers are allowed for any permission level (hierarchy: anonymous < public < staff)
- [ ] Permission level values are exactly: `staff`, `public`, `anonymous` — invalid values are rejected at category creation

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.3: Gate Admin and Export Operations to Staff
**As a** Jordan Kim (system administrator), **I want** administrative screens and CSV/print exports to be restricted to staff users only, **so that** sensitive configuration and bulk data are protected from constituent access.

**Acceptance Criteria:**
- [ ] Endpoints for departments, categories, users, clients, substatus, and actions require `role = 'staff'`
- [ ] GET for CSV export and print-HTML returns 403 for non-staff callers
- [ ] Ticket history endpoint requires `role = 'staff'`
- [ ] Metrics and reports endpoints require `role = 'staff'`

**Priority:** P0 | **Feature Ref:** F3

---

## Epic 4: Authentication — JWT / Spring Security (F4)

*Staff users log in with username/password and receive JWT access and refresh tokens. External API clients authenticate via API key.*

---

### US-4.1: Staff Login and JWT Issuance
**As a** Marcus Webb (case worker), **I want to** log in with my username and password and receive a JWT access token, **so that** I can access protected ticket management functions without repeated authentication.

**Acceptance Criteria:**
- [ ] POST `/api/v1/auth/login` accepts `username` and `password`
- [ ] System looks up `people` by `username` and verifies password against BCrypt hash
- [ ] On success, returns `{ accessToken, refreshToken, expiresIn: 3600, role, personId }`
- [ ] JWT claims include: `sub` (person_id), `role`, `iat`, `exp`, `iss = "ureport"`, `jti = UUID`
- [ ] Invalid credentials return 401 AUTH_FAILED with generic message (no enumeration of which field is wrong)
- [ ] JWT algorithm is HS256 or RS256 (configurable); minimum key length 256 bits for HS256

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.2: JWT Token Refresh
**As a** Marcus Webb (case worker), **I want** my session to silently refresh without requiring me to log in again, **so that** long work sessions are not interrupted by token expiry.

**Acceptance Criteria:**
- [ ] POST `/api/v1/auth/refresh` accepts `refreshToken` UUID
- [ ] System validates the refresh token is not expired or revoked
- [ ] Old refresh token is revoked (single-use rotation) and a new pair is issued
- [ ] Expired or revoked refresh token returns 401 REFRESH_TOKEN_INVALID
- [ ] Default access token expiry: 3600 seconds (configurable); default refresh token expiry: 86400 seconds (configurable)

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.3: Logout and Token Invalidation
**As a** Marcus Webb (case worker), **I want to** log out securely so that my token cannot be reused, **so that** shared workstations do not pose a security risk.

**Acceptance Criteria:**
- [ ] POST `/api/v1/auth/logout` accepts the `refreshToken`
- [ ] Refresh token is marked `revoked = true` in `refresh_tokens` table
- [ ] Access token `jti` is added to the `token_blacklist` table with TTL equal to remaining expiry
- [ ] Subsequent requests with the blacklisted access token return 401 TOKEN_REVOKED
- [ ] Returns 200 OK with empty body on success

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.4: OAuth / External Identity Provider Callback
**As a** Jordan Kim (system administrator), **I want** the system to support an OAuth callback endpoint so that external identity providers can be used for staff login, **so that** SSO integrations are possible without changes to the internal people directory.

**Acceptance Criteria:**
- [ ] GET `/callback?code=<auth_code>&state=<csrf_state>` validates CSRF state and exchanges the code with the IdP
- [ ] System maps the IdP identity (by email or external sub) to an existing `people` record
- [ ] If no matching `people` record exists, returns 404 PERSON_NOT_FOUND (no auto-registration)
- [ ] On successful match, issues a local JWT + refresh token and redirects to the SPA
- [ ] Invalid CSRF state returns 400 OAUTH_STATE_INVALID

**Priority:** P0 | **Feature Ref:** F4

---

## Epic 5: People / Contact Management (F5)

*The `people` table is the central identity registry for both staff users and constituent contacts, with support for multiple emails, phones, and addresses per person.*

---

### US-5.1: Create and Manage Staff User Accounts
**As a** Jordan Kim (system administrator), **I want to** create, update, and deactivate staff user accounts from the admin interface, **so that** I never need to touch the database directly for routine user management.

**Acceptance Criteria:**
- [ ] POST `/api/v1/people` creates a person record with firstname, lastname, organization, username (for staff), role, and department
- [ ] System validates no duplicate `username` exists; duplicate returns 422 DUPLICATE_USERNAME
- [ ] `password` input is hashed with BCrypt (cost ≥ 10) before storage; plain-text password is never logged
- [ ] PUT `/api/v1/people/{id}` updates all person fields
- [ ] DELETE `/api/v1/people/{id}` deactivates or removes the record (staff only)
- [ ] Staff user creation completes in under 3 minutes via the SPA form

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.2: Manage Multiple Emails, Phones, and Addresses
**As a** Jordan Kim (system administrator), **I want to** add and label multiple email addresses, phone numbers, and physical addresses per person, **so that** contact records are complete and notifications reach the right channel.

**Acceptance Criteria:**
- [ ] `peopleEmails`, `peoplePhones`, and `peopleAddresses` support multiple records per person
- [ ] Each email has a label (Home, Work, Other) and `usedForNotifications` flag
- [ ] Each phone has a label (Main, Mobile, Work, Home, Fax, Pager, Other)
- [ ] Each address has a label (Home, Business, Rental)
- [ ] API supports create, update, and delete on each child record
- [ ] At least one email flagged `usedForNotifications` is required to receive digest notifications

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.3: Search the People Directory
**As a** Marcus Webb (case worker), **I want to** search for a person by name, organization, email, role, or department, **so that** I can quickly look up a constituent or colleague when creating or updating a ticket.

**Acceptance Criteria:**
- [ ] GET `/api/v1/people?q=` performs case-insensitive ILIKE search on firstname, lastname, organization, and email (via JOIN on `peopleEmails`)
- [ ] Additional filters: `role`, `department_id`, `organization`
- [ ] Returns paginated results (default page size 25)
- [ ] Response includes all person fields including email and phone sub-records

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.4: View All Tickets Associated With a Person
**As a** Marcus Webb (case worker), **I want to** view all tickets reported by, assigned to, or entered by a specific person, **so that** I can identify repeat reporters and manage duplicate or related issues efficiently.

**Acceptance Criteria:**
- [ ] GET `/api/v1/people/{id}/tickets` returns all tickets where `reportedByPerson_id`, `assignedPerson_id`, or `enteredByPerson_id` equals the person's id
- [ ] Results are paginated (default page size 25)
- [ ] Requires `role = 'staff'`

**Priority:** P1 | **Feature Ref:** F5

---

## Epic 6: Department Administration (F6)

*Departments represent the organizational units within the municipality. They link to categories and staff.*

---

### US-6.1: Create and Manage Departments
**As a** Diana Reyes (department administrator), **I want to** create, update, and delete department records, **so that** the organizational structure of the municipality is accurately reflected in ticket routing.

**Acceptance Criteria:**
- [ ] POST `/api/v1/departments` creates a department with name and optional `defaultPerson_id`
- [ ] PUT `/api/v1/departments/{id}` updates name or defaultPerson_id
- [ ] DELETE `/api/v1/departments/{id}` removes the department (staff only)
- [ ] All department CRUD operations require `role = 'staff'`
- [ ] `defaultPerson_id` must reference a person with `role = 'staff'` if provided

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.2: Assign Categories and Action Types to Departments
**As a** Diana Reyes (department administrator), **I want to** associate categories and action types with my department, **so that** tickets route correctly and my staff have access to the right action vocabulary.

**Acceptance Criteria:**
- [ ] Many-to-many relationships are managed via `department_categories` and `department_actions` tables
- [ ] API supports adding and removing category-department and action-department associations
- [ ] Viewing a department returns its associated categories and available action types
- [ ] Staff members belonging to a department are listed on the department detail view

**Priority:** P1 | **Feature Ref:** F6

---

## Epic 7: Category and Category-Group Management (F7)

*Categories are the service type taxonomy (equivalent to Open311 services). They carry rich configuration including SLAs, custom fields, permissions, and routing.*

---

### US-7.1: Create and Configure a Category
**As a** Diana Reyes (department administrator), **I want to** create and fully configure a service category including SLA days, permission levels, default assignee, and custom field schema, **so that** new service types are available and correctly configured for constituent submissions.

**Acceptance Criteria:**
- [ ] POST `/api/v1/categories` creates a category with: name, description, department_id, categoryGroup_id, defaultPerson_id, active, featured, displayPermissionLevel, postingPermissionLevel, slaDays, notificationReplyEmail, autoCloseIsActive, autoCloseSubstatus_id, customFields (JSON)
- [ ] `displayPermissionLevel` and `postingPermissionLevel` must be exactly `staff`, `public`, or `anonymous`; invalid values return 422
- [ ] `customFields` schema changes take effect on the next ticket submission without a deployment
- [ ] Full category creation (all fields) completes within the SPA in under 10 minutes
- [ ] Requires `role = 'staff'`

**Priority:** P1 | **Feature Ref:** F7

---

### US-7.2: Manage Category Groups
**As a** Diana Reyes (department administrator), **I want to** create, reorder, and manage category groups, **so that** the service type taxonomy is organized clearly for constituents and staff.

**Acceptance Criteria:**
- [ ] POST `/api/v1/category-groups` creates a category group with name and `ordering`
- [ ] PUT `/api/v1/category-groups/{id}` updates name or ordering
- [ ] DELETE `/api/v1/category-groups/{id}` removes a category group
- [ ] GET `/api/v1/category-groups/{id}/categories` lists all categories in the group
- [ ] Open311 `/open311/services` response respects `categoryGroups.ordering` for sort order

**Priority:** P1 | **Feature Ref:** F7

---

### US-7.3: Configure Auto-Close Rules Per Category
**As a** Diana Reyes (department administrator), **I want to** configure an auto-close rule per category with a target substatus, **so that** stale tickets in my department are automatically resolved without manual intervention.

**Acceptance Criteria:**
- [ ] `autoCloseIsActive` (boolean) and `autoCloseSubstatus_id` are configurable per category
- [ ] Spring Scheduler job evaluates tickets against auto-close rules and closes qualifying tickets with the configured substatus
- [ ] Auto-close job appends a "closed" history entry for every ticket it closes
- [ ] The substatus referenced by `autoCloseSubstatus_id` must have `status = 'closed'`

**Priority:** P1 | **Feature Ref:** F7

---

## Epic 8: Substatus System (F8)

*Substatuses provide fine-grained lifecycle states beyond binary open/closed. System substatuses (Resolved, Duplicate, Bogus) are seeded; staff can define additional ones.*

---

### US-8.1: Create and Manage Substatuses
**As a** Diana Reyes (department administrator), **I want to** create custom substatuses beyond the system defaults, **so that** my department can track nuanced ticket states relevant to our workflows.

**Acceptance Criteria:**
- [ ] POST `/api/v1/substatuses` creates a substatus with name, description, status (open/closed), and isDefault flag
- [ ] `status` must be exactly `'open'` or `'closed'`
- [ ] Only one substatus can be marked `isDefault` per parent status; setting a new default clears the previous one
- [ ] System substatuses (Resolved, Duplicate, Bogus) are seeded at install and cannot be deleted
- [ ] Requires `role = 'staff'`

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.2: Apply Substatus to Ticket Lifecycle Actions
**As a** Marcus Webb (case worker), **I want** substatus to be applied and visible on tickets during close and reopen operations, **so that** the fine-grained state of each ticket is always clear.

**Acceptance Criteria:**
- [ ] Closing a ticket requires a `substatus_id` with `status = 'closed'`
- [ ] Reopening a ticket assigns the default `'open'` substatus
- [ ] Ticket detail view displays the current substatus name alongside the parent status
- [ ] Ticket search supports filtering by `substatus_id`

**Priority:** P1 | **Feature Ref:** F8

---

## Epic 9: Action Types and Response Templates (F9)

*Actions define the event vocabulary for ticket history. Per-category action response templates allow departments to customize notification text per action type.*

---

### US-9.1: Create and Manage Department Action Types
**As a** Diana Reyes (department administrator), **I want to** define custom action types for my department, **so that** my team's unique workflow events are accurately captured in ticket history.

**Acceptance Criteria:**
- [ ] POST `/api/v1/actions` creates a department-scoped action with name, description template, optional email template, and optional `replyEmail`
- [ ] System action types (open, assignment, closed, changeCategory, changeLocation, response, duplicate, update, comment, upload_media) are read-only seeds; they cannot be modified or deleted
- [ ] Department actions are associated with departments via `department_actions`
- [ ] Requires `role = 'staff'`

**Priority:** P1 | **Feature Ref:** F9

---

### US-9.2: Configure Category Action Response Overrides
**As a** Diana Reyes (department administrator), **I want to** set per-category action response templates and reply-to emails, **so that** notifications sent from my department's tickets use the correct content and routing.

**Acceptance Criteria:**
- [ ] POST `/api/v1/categories/{id}/action-responses` creates a `category_action_responses` record linking a category, an action, a custom template, and an optional `replyEmail`
- [ ] When a digest notification is triggered, the per-category template overrides the default action template if one exists
- [ ] Requires `role = 'staff'`

**Priority:** P1 | **Feature Ref:** F9

---

### US-9.3: Render Template Variables in History Descriptions
**As a** Marcus Webb (case worker), **I want** action description templates to automatically resolve person names and field change values, **so that** the ticket history reads clearly without requiring manual description authoring.

**Acceptance Criteria:**
- [ ] `{enteredByPerson}` resolves to the full name of the person who performed the action
- [ ] `{actionPerson}` resolves to the full name of the person the action was performed on
- [ ] `{original:field}` and `{updated:field}` resolve to values in `data.original.field` and `data.updated.field`
- [ ] `{duplicate:ticket_id}` resolves to the parent ticket ID from `data.duplicate`
- [ ] Unknown tokens are left as-is (no exception is thrown)
- [ ] Resolution occurs at read time, not at write time

**Priority:** P1 | **Feature Ref:** F9

---

## Epic 10: Media / Attachment Upload and Thumbnail Caching (F10)

*Staff and permitted users attach images and files to tickets. Thumbnails are generated and cached on first request.*

---

### US-10.1: Upload Media to a Ticket
**As a** Marcus Webb (case worker), **I want to** attach photos and files to a ticket without navigating away from it, **so that** visual evidence and supporting documents are linked directly to the issue.

**Acceptance Criteria:**
- [ ] POST `/api/v1/tickets/{id}/media` accepts one or more file uploads
- [ ] File metadata is stored in the `media` table: filename, internalFilename, mime_type, uploaded timestamp, person_id
- [ ] An "upload_media" history entry is appended on every upload
- [ ] Upload permission is gated by user role per category configuration
- [ ] Uploaded files are listed on the ticket detail view

**Priority:** P1 | **Feature Ref:** F10

---

### US-10.2: Serve Media Files and Thumbnails
**As a** Marcus Webb (case worker), **I want** image attachments to display as thumbnails in the ticket view, **so that** I can quickly assess photo evidence without downloading full-size files.

**Acceptance Criteria:**
- [ ] GET `/api/v1/media/{id}` serves the original file
- [ ] GET `/api/v1/media/{id}/thumbnail` serves a cached thumbnail; if the thumbnail doesn't exist yet it is generated on first request and cached for subsequent requests
- [ ] Both original and thumbnail endpoints respect the stored `mime_type`
- [ ] Media URLs are included in Open311 API response objects where attachments exist (first image URL as `media_url`)

**Priority:** P1 | **Feature Ref:** F10

---

## Epic 11: Full-Text Search — PostgreSQL FTS (F11)

*Ticket search replaces Apache Solr 7.4 with PostgreSQL Full-Text Search, preserving equivalent search semantics across all filter fields.*

---

### US-11.1: Full-Text Keyword Search Across Tickets
**As a** Marcus Webb (case worker), **I want to** search tickets by keyword, **so that** I can find any relevant ticket in under 30 seconds regardless of which field the keyword appears in.

**Acceptance Criteria:**
- [ ] GET `/api/v1/tickets?q=<keyword>` performs full-text search across indexed ticket fields (description, location, reporter name, category name, etc.)
- [ ] PostgreSQL FTS index is maintained on all indexed ticket fields
- [ ] Search results are returned in under 500ms for datasets up to 500,000 tickets
- [ ] Search results are equivalent to the current Solr output (≥95% overlap on ranked results for defined test corpus)

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.2: Filter Tickets by Multiple Criteria
**As a** Marcus Webb (case worker), **I want to** filter tickets by category, department, assigned person, status, substatus, date range, location, and contact method simultaneously, **so that** I can precisely target the subset of tickets I need to review.

**Acceptance Criteria:**
- [ ] Ticket search supports filters: category_id, department_id, assignedPerson_id, enteredByPerson_id, status, substatus_id, contactMethod_id, client_id, enteredDate range, closedDate range, location, city, zip, latitude/longitude radius, issueType_id
- [ ] Multiple filters are combined with AND logic
- [ ] Paginated results default to 25 per page; configurable via `?limit=` and `?offset=` or `?page=`
- [ ] Unpaginated results are available for CSV/print export (staff only)

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.3: View Ticket Search Results on Map
**As a** Marcus Webb (case worker), **I want to** switch between list and map views of ticket search results, **so that** I can identify geographic clusters of issues and prioritize field responses.

**Acceptance Criteria:**
- [ ] Ticket search results support a `view=map` mode returning geo-clustered data
- [ ] Map view data includes cluster center points and ticket counts at zoom levels 0–6
- [ ] Switching between list and map view does not require a separate search submission

**Priority:** P0 | **Feature Ref:** F11

---

## Epic 12: Bookmarks — Staff Saved Searches (F12)

*Staff can save named ticket search filters as personal bookmarks for one-click access to frequently-used filtered views.*

---

### US-12.1: Save a Ticket Search as a Bookmark
**As a** Marcus Webb (case worker), **I want to** save my current ticket search filter as a named bookmark, **so that** I can return to my most-used filtered views without rebuilding the filter every morning.

**Acceptance Criteria:**
- [ ] POST `/api/v1/bookmarks` accepts `name` and `requestUri` (the full search URI)
- [ ] Bookmark is linked to the current staff user's `person_id`
- [ ] Bookmark `type` defaults to `search`
- [ ] Requires `role = 'staff'`

**Priority:** P2 | **Feature Ref:** F12

---

### US-12.2: List and Navigate Saved Bookmarks
**As a** Marcus Webb (case worker), **I want to** see a list of my saved bookmarks and navigate to any of them with a single click, **so that** my daily triage workflow starts instantly without setup.

**Acceptance Criteria:**
- [ ] GET `/api/v1/bookmarks` returns all bookmarks belonging to the current staff user
- [ ] Each bookmark includes id, name, type, and requestUri
- [ ] Clicking a bookmark in the SPA navigates to the stored `requestUri` and reloads the search results
- [ ] Bookmark navigation loads in under 2 seconds

**Priority:** P2 | **Feature Ref:** F12

---

### US-12.3: Delete a Bookmark
**As a** Marcus Webb (case worker), **I want to** delete saved bookmarks I no longer need, **so that** my bookmark list stays relevant and uncluttered.

**Acceptance Criteria:**
- [ ] DELETE `/api/v1/bookmarks/{id}` removes the bookmark
- [ ] Only the bookmark owner (matched by `person_id`) can delete their own bookmarks
- [ ] Non-owner deletion attempts return 403 PERMISSION_DENIED
- [ ] Deleted bookmark id returns 404 BOOKMARK_NOT_FOUND on subsequent requests

**Priority:** P2 | **Feature Ref:** F12

---

## Epic 13: API Client Management (F13)

*External applications integrating via the Open311 API are registered as API clients with unique keys, contact persons, and contact methods.*

---

### US-13.1: Register and Manage an API Client
**As a** Jordan Kim (system administrator), **I want to** register new API clients, assign them an API key, and link them to a contact person, **so that** external integrations are tracked and authenticated.

**Acceptance Criteria:**
- [ ] POST `/api/v1/clients` creates a client with name, url, api_key, contactPerson_id, and optional contactMethod_id
- [ ] `api_key` is stored hashed (BCrypt or SHA-256 + salt); plain-text key is returned only at creation
- [ ] GET `/api/v1/clients` lists all clients; requires `role = 'staff'`
- [ ] PUT `/api/v1/clients/{id}` updates client metadata including rotating the API key
- [ ] DELETE `/api/v1/clients/{id}` removes the client; requires `role = 'staff'`

**Priority:** P1 | **Feature Ref:** F13

---

### US-13.2: API Key Rotation
**As a** Jordan Kim (system administrator), **I want to** rotate or revoke an API key for a registered client without a service restart, **so that** compromised keys are invalidated immediately.

**Acceptance Criteria:**
- [ ] PUT `/api/v1/clients/{id}` with a new `api_key` updates the hashed key immediately
- [ ] New key is effective for the next API request without requiring a server restart
- [ ] Tickets submitted by the client retain their `client_id` link regardless of key rotation

**Priority:** P1 | **Feature Ref:** F13

---

## Epic 14: Contact Method Tracking (F14)

*uReport tracks the submission channel (Email, Phone, Web Form, Other) and preferred response method for each ticket.*

---

### US-14.1: Record Submission and Response Channel on a Ticket
**As a** Marcus Webb (case worker), **I want to** record how a constituent submitted their issue and how they prefer to be contacted back, **so that** routing and communication preferences are captured for every ticket.

**Acceptance Criteria:**
- [ ] Ticket creation and update support `contactMethod_id` (submission channel) and `responseMethod_id` (preferred response channel)
- [ ] Both fields reference the `contactMethods` table seeded with: Email, Phone, Web Form, Other
- [ ] Ticket search supports filtering by `contactMethod_id`
- [ ] API clients can be associated with a `contactMethod_id` to auto-populate the submission channel on tickets they create

**Priority:** P2 | **Feature Ref:** F14

---

## Epic 15: Location / Address Management and Geo-Cluster Analysis (F15)

*Tickets carry geographic data. Canonical address records link to tickets; geo-cluster analysis groups nearby tickets at 7 zoom levels for the map view.*

---

### US-15.1: Capture and Validate Ticket Location
**As a** Marcus Webb (case worker), **I want to** record a validated street address and coordinates on a ticket, **so that** the location of the issue is accurate and consistent with the canonical address registry.

**Acceptance Criteria:**
- [ ] Ticket creation accepts latitude, longitude, location (address string), city, state, and zip
- [ ] Address is normalized via AddressService integration; canonical address record is stored in `locations` table
- [ ] `tickets.addressId` references the canonical `locations` record
- [ ] `additionalFields` JSON stores supplementary address data from AddressService

**Priority:** P1 | **Feature Ref:** F15

---

### US-15.2: Rebuild Geo-Clusters via Scheduled Job
**As a** Jordan Kim (system administrator), **I want** geo-cluster data to be automatically rebuilt on a schedule, **so that** the map view always reflects current ticket distribution without manual maintenance.

**Acceptance Criteria:**
- [ ] Spring Scheduler job replaces legacy `matchLocationAddresses.php` cron script
- [ ] Job populates `geoclusters` table with center point geometry at levels 0–6
- [ ] Job populates `ticket_geodata` with `cluster_id_0` through `cluster_id_6` for each ticket
- [ ] Job execution is logged with timestamp, job name, and outcome
- [ ] Map view uses geo-clustered data from `ticket_geodata` for display

**Priority:** P1 | **Feature Ref:** F15

---

### US-15.3: Location-Based Ticket Search
**As a** Marcus Webb (case worker), **I want to** search for tickets within a geographic radius or by city/zip, **so that** I can find all issues in a specific area quickly for field coordination.

**Acceptance Criteria:**
- [ ] Ticket search supports `lat`, `long`, and `radius` (meters) filters for radius-based search
- [ ] Ticket search supports `city` and `zip` filters for area-based search
- [ ] Spatial queries run against PostGIS or equivalent spatial index for performance

**Priority:** P1 | **Feature Ref:** F15

---

## Epic 16: Digest Email Notifications (F16)

*uReport sends scheduled digest email notifications to constituents and staff. Legacy PHP cron scripts are replaced by Spring Scheduler jobs.*

---

### US-16.1: Receive Email Notification After Ticket Action
**As a** Marcus Webb (case worker), **I want** constituents to receive digest email notifications when relevant ticket actions occur (open, close, assignment, response), **so that** reporters are kept informed without requiring staff to manually send emails.

**Acceptance Criteria:**
- [ ] Spring Scheduler job identifies ticket history entries with pending outbound notifications
- [ ] Notification emails are rendered using the action template with template variables resolved
- [ ] `notificationReplyEmail` from category config is used as the reply-to address; per-action `replyEmail` override takes precedence where configured
- [ ] Emails are sent to all `peopleEmails` records for the reporter that have `usedForNotifications = true`
- [ ] `ticketHistory.sentNotifications` is updated with the list of notified email addresses after sending

**Priority:** P1 | **Feature Ref:** F16

---

### US-16.2: Auto-Close Stale Tickets by Category Rule
**As a** Diana Reyes (department administrator), **I want** stale tickets in my department to be automatically closed per category auto-close rules, **so that** my team's backlog stays current without manual housekeeping.

**Acceptance Criteria:**
- [ ] Spring Scheduler job (replacing `closeOldTickets.php`) evaluates open tickets against their category's `autoCloseIsActive` and `slaDays` configuration
- [ ] Qualifying tickets are closed with the category's `autoCloseSubstatus_id`
- [ ] A "closed" history entry is appended for each auto-closed ticket
- [ ] Job execution is logged with timestamp, job name, ticket count closed, and outcome

**Priority:** P1 | **Feature Ref:** F16

---

### US-16.3: Audit Data Integrity via Scheduled Job
**As a** Jordan Kim (system administrator), **I want** a scheduled audit job to run data integrity checks, **so that** I receive early warning of any data inconsistencies before they affect operations.

**Acceptance Criteria:**
- [ ] Spring Scheduler job replaces `auditTickets.php` cron script
- [ ] Job checks for configurable data integrity conditions (e.g., orphaned records, tickets with invalid FK references)
- [ ] Audit results are written to logs with timestamp, job name, and findings
- [ ] Job execution is observable without manual database queries

**Priority:** P1 | **Feature Ref:** F16

---

## Epic 17: Metrics and Reporting Dashboard (F17)

*uReport provides a metrics dashboard and a set of canned reports for staff covering SLA compliance, ticket volume, assignments, and category activity.*

---

### US-17.1: View SLA Compliance Metrics by Category
**As a** Diana Reyes (department administrator), **I want to** view on-time closure percentages per category over a configurable time window, **so that** I can identify which service types are falling behind and take corrective action.

**Acceptance Criteria:**
- [ ] GET `/api/v1/metrics?category_id=&numDays=&effectiveDate=` returns `onTimePercentage` for the given parameters
- [ ] Metrics dashboard loads the department's 30-day SLA summary in under 5 seconds
- [ ] Requires `role = 'staff'`

**Priority:** P2 | **Feature Ref:** F17

---

### US-17.2: Run Canned Activity and Volume Reports
**As a** Diana Reyes (department administrator), **I want to** run pre-built reports covering ticket activity, assignments, categories, staff performance, and volume trends, **so that** I can review operational metrics without manually constructing filter combinations each time.

**Acceptance Criteria:**
- [ ] The following reports are available: Activity, Assignments, Categories, Staff, Person, SLA, Volume, Current Open, Opened Today, Closed Today
- [ ] Each report accepts appropriate date range and filter parameters
- [ ] Reports return structured data suitable for table display and chart rendering in the SPA
- [ ] All report endpoints require `role = 'staff'`

**Priority:** P2 | **Feature Ref:** F17

---

## Epic 18: Multi-Format Output Feeds (F18)

*All applicable endpoints support multiple output formats (JSON, XML, CSV, HTML, TXT) to preserve backward compatibility with existing consumers.*

---

### US-18.1: Receive Open311 Responses in JSON or XML
**As a** Integra Transit App (external API client), **I want to** specify `format=json` or `format=xml` on any Open311 request, **so that** my existing XML parser continues working after the migration without code changes.

**Acceptance Criteria:**
- [ ] All Open311 endpoints (`/open311/discovery`, `/open311/services`, `/open311/requests`) support `?format=json` and `?format=xml`
- [ ] XML output uses exact GeoReport v2 element names and structure (byte-compatible)
- [ ] JSON is the default format when no `format` param is provided
- [ ] Invalid `format` value returns 400 INVALID_FORMAT
- [ ] XML CDATA handling, null field representation, and empty string behavior match the legacy PHP output exactly

**Priority:** P0 | **Feature Ref:** F18

---

### US-18.2: Export Ticket Data in Multiple Formats
**As a** Marcus Webb (case worker), **I want to** export ticket search results in CSV, print-HTML, or plain-text format, **so that** I can share data with stakeholders using whatever format they require.

**Acceptance Criteria:**
- [ ] Ticket search supports `?format=csv`, `?format=print`, and `?format=txt` output modes
- [ ] CSV output includes a header row and one row per ticket with all standard fields
- [ ] Print-HTML output is a printable layout of the ticket list
- [ ] All export formats require `role = 'staff'`
- [ ] Content negotiation via `format` query parameter matches legacy behavior

**Priority:** P0 | **Feature Ref:** F18

---

## Epic 19: Issue Type Management (F19)

*Issue types provide secondary ticket classification beyond category: Comment, Complaint, Question, Report, Request, Violation.*

---

### US-19.1: Assign an Issue Type to a Ticket
**As a** Marcus Webb (case worker), **I want to** classify a ticket by issue type (e.g., Complaint vs. Request), **so that** the nature of each constituent issue is captured for reporting and filtering.

**Acceptance Criteria:**
- [ ] `issueType_id` is an optional field on ticket creation and update
- [ ] Valid values are seeded at install: Comment, Complaint, Question, Report, Request, Violation
- [ ] Ticket search supports filtering by `issueType_id`
- [ ] Invalid `issueType_id` returns 422 with an appropriate error

**Priority:** P2 | **Feature Ref:** F19

---

### US-19.2: Administer Issue Type Records
**As a** Jordan Kim (system administrator), **I want to** create, update, and delete issue type records, **so that** the classification vocabulary can evolve with municipal needs.

**Acceptance Criteria:**
- [ ] POST `/api/v1/issue-types` creates a new issue type with a name
- [ ] PUT `/api/v1/issue-types/{id}` updates the name
- [ ] DELETE `/api/v1/issue-types/{id}` removes the record
- [ ] All issue type admin operations require `role = 'staff'`

**Priority:** P2 | **Feature Ref:** F19

---

## Epic 20: Response Templates (F20)

*Response templates provide staff with pre-authored text blocks for common ticket responses, linked to action types.*

---

### US-20.1: Create and Manage Response Templates
**As a** Diana Reyes (department administrator), **I want to** create pre-authored response templates for common ticket actions, **so that** my team sends consistent, professional replies without drafting from scratch each time.

**Acceptance Criteria:**
- [ ] POST `/api/v1/response-templates` creates a template with name, body text, and `action_id` association
- [ ] PUT `/api/v1/response-templates/{id}` updates the template
- [ ] DELETE `/api/v1/response-templates/{id}` removes the template
- [ ] All template CRUD operations require `role = 'staff'`

**Priority:** P2 | **Feature Ref:** F20

---

### US-20.2: Use a Response Template When Recording a Ticket Response
**As a** Marcus Webb (case worker), **I want to** select a pre-authored response template when recording a response action on a ticket, **so that** I can compose consistent, accurate replies faster without retyping common text.

**Acceptance Criteria:**
- [ ] When recording a response action on a ticket, the SPA presents available response templates filtered by the matching `action_id`
- [ ] Selecting a template pre-populates the `notes` field with the template body text
- [ ] Staff can edit the pre-populated text before submitting
- [ ] Template text is used as a starting point only — the final `notes` value is whatever is submitted

**Priority:** P2 | **Feature Ref:** F20

---

## Story Index

| Story ID | Title | Priority | Feature Ref | Primary Persona |
|----------|-------|----------|-------------|-----------------|
| US-0.1 | Create a New Ticket | P0 | F0 | PER-01 Marcus Webb |
| US-0.2 | Assign a Ticket to a Staff Member | P0 | F0 | PER-01 Marcus Webb |
| US-0.3 | Update Ticket Fields | P0 | F0 | PER-01 Marcus Webb |
| US-0.4 | Close a Ticket with a Substatus | P0 | F0 | PER-01 Marcus Webb |
| US-0.5 | Mark a Ticket as a Duplicate | P0 | F0 | PER-01 Marcus Webb |
| US-0.6 | Reopen a Closed Ticket | P0 | F0 | PER-01 Marcus Webb |
| US-0.7 | Record a Comment on a Ticket | P0 | F0 | PER-01 Marcus Webb |
| US-0.8 | Export Ticket Search Results | P0 | F0 | PER-01 Marcus Webb |
| US-1.1 | View Full Ticket History | P0 | F1 | PER-01 Marcus Webb |
| US-1.2 | History Entry Auto-Appended on Lifecycle Events | P0 | F1 | PER-01 Marcus Webb |
| US-1.3 | View Notification Recipients on History Entry | P0 | F1 | PER-01 Marcus Webb |
| US-2.1 | Discover API Metadata | P0 | F2 | PER-04 Integra |
| US-2.2 | List Available Services | P0 | F2 | PER-04 Integra |
| US-2.3 | Get Service Attributes | P0 | F2 | PER-04 Integra |
| US-2.4 | Submit a Service Request via Open311 | P0 | F2 | PER-04 Integra |
| US-2.5 | Retrieve and Filter Service Requests | P0 | F2 | PER-04 Integra |
| US-2.6 | Retrieve a Single Service Request | P0 | F2 | PER-04 Integra |
| US-3.1 | Enforce Role-Based Endpoint Access | P0 | F3 | PER-03 Jordan Kim |
| US-3.2 | Enforce Per-Category Display and Posting Permissions | P0 | F3 | PER-03 Jordan Kim |
| US-3.3 | Gate Admin and Export Operations to Staff | P0 | F3 | PER-03 Jordan Kim |
| US-4.1 | Staff Login and JWT Issuance | P0 | F4 | PER-01 Marcus Webb |
| US-4.2 | JWT Token Refresh | P0 | F4 | PER-01 Marcus Webb |
| US-4.3 | Logout and Token Invalidation | P0 | F4 | PER-01 Marcus Webb |
| US-4.4 | OAuth / External Identity Provider Callback | P0 | F4 | PER-03 Jordan Kim |
| US-5.1 | Create and Manage Staff User Accounts | P1 | F5 | PER-03 Jordan Kim |
| US-5.2 | Manage Multiple Emails, Phones, and Addresses | P1 | F5 | PER-03 Jordan Kim |
| US-5.3 | Search the People Directory | P1 | F5 | PER-01 Marcus Webb |
| US-5.4 | View All Tickets Associated With a Person | P1 | F5 | PER-01 Marcus Webb |
| US-6.1 | Create and Manage Departments | P1 | F6 | PER-02 Diana Reyes |
| US-6.2 | Assign Categories and Action Types to Departments | P1 | F6 | PER-02 Diana Reyes |
| US-7.1 | Create and Configure a Category | P1 | F7 | PER-02 Diana Reyes |
| US-7.2 | Manage Category Groups | P1 | F7 | PER-02 Diana Reyes |
| US-7.3 | Configure Auto-Close Rules Per Category | P1 | F7 | PER-02 Diana Reyes |
| US-8.1 | Create and Manage Substatuses | P1 | F8 | PER-02 Diana Reyes |
| US-8.2 | Apply Substatus to Ticket Lifecycle Actions | P1 | F8 | PER-01 Marcus Webb |
| US-9.1 | Create and Manage Department Action Types | P1 | F9 | PER-02 Diana Reyes |
| US-9.2 | Configure Category Action Response Overrides | P1 | F9 | PER-02 Diana Reyes |
| US-9.3 | Render Template Variables in History Descriptions | P1 | F9 | PER-01 Marcus Webb |
| US-10.1 | Upload Media to a Ticket | P1 | F10 | PER-01 Marcus Webb |
| US-10.2 | Serve Media Files and Thumbnails | P1 | F10 | PER-01 Marcus Webb |
| US-11.1 | Full-Text Keyword Search Across Tickets | P0 | F11 | PER-01 Marcus Webb |
| US-11.2 | Filter Tickets by Multiple Criteria | P0 | F11 | PER-01 Marcus Webb |
| US-11.3 | View Ticket Search Results on Map | P0 | F11 | PER-01 Marcus Webb |
| US-12.1 | Save a Ticket Search as a Bookmark | P2 | F12 | PER-01 Marcus Webb |
| US-12.2 | List and Navigate Saved Bookmarks | P2 | F12 | PER-01 Marcus Webb |
| US-12.3 | Delete a Bookmark | P2 | F12 | PER-01 Marcus Webb |
| US-13.1 | Register and Manage an API Client | P1 | F13 | PER-03 Jordan Kim |
| US-13.2 | API Key Rotation | P1 | F13 | PER-03 Jordan Kim |
| US-14.1 | Record Submission and Response Channel on a Ticket | P2 | F14 | PER-01 Marcus Webb |
| US-15.1 | Capture and Validate Ticket Location | P1 | F15 | PER-01 Marcus Webb |
| US-15.2 | Rebuild Geo-Clusters via Scheduled Job | P1 | F15 | PER-03 Jordan Kim |
| US-15.3 | Location-Based Ticket Search | P1 | F15 | PER-01 Marcus Webb |
| US-16.1 | Receive Email Notification After Ticket Action | P1 | F16 | PER-01 Marcus Webb |
| US-16.2 | Auto-Close Stale Tickets by Category Rule | P1 | F16 | PER-02 Diana Reyes |
| US-16.3 | Audit Data Integrity via Scheduled Job | P1 | F16 | PER-03 Jordan Kim |
| US-17.1 | View SLA Compliance Metrics by Category | P2 | F17 | PER-02 Diana Reyes |
| US-17.2 | Run Canned Activity and Volume Reports | P2 | F17 | PER-02 Diana Reyes |
| US-18.1 | Receive Open311 Responses in JSON or XML | P0 | F18 | PER-04 Integra |
| US-18.2 | Export Ticket Data in Multiple Formats | P0 | F18 | PER-01 Marcus Webb |
| US-19.1 | Assign an Issue Type to a Ticket | P2 | F19 | PER-01 Marcus Webb |
| US-19.2 | Administer Issue Type Records | P2 | F19 | PER-03 Jordan Kim |
| US-20.1 | Create and Manage Response Templates | P2 | F20 | PER-02 Diana Reyes |
| US-20.2 | Use a Response Template When Recording a Ticket Response | P2 | F20 | PER-01 Marcus Webb |

---

## Priority Summary

| Priority | Count | Story IDs |
|----------|-------|-----------|
| **P0 — Critical / MVP** | 25 | US-0.1–0.8, US-1.1–1.3, US-2.1–2.6, US-3.1–3.3, US-4.1–4.4, US-11.1–11.3, US-18.1–18.2 |
| **P1 — High / Required** | 27 | US-5.1–5.4, US-6.1–6.2, US-7.1–7.3, US-8.1–8.2, US-9.1–9.3, US-10.1–10.2, US-13.1–13.2, US-15.1–15.3, US-16.1–16.3 |
| **P2 — Medium / Required** | 11 | US-12.1–12.3, US-14.1, US-17.1–17.2, US-19.1–19.2, US-20.1–20.2 |
| **Total** | **63** | — |

---

*UserStories generated 2026-06-24 | uReport Modernization Project*
