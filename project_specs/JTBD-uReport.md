# Jobs-to-be-Done: uReport Modernization

| Field | Value |
|---|---|
| **Product Name** | uReport — Municipal Constituent Issue Tracking System |
| **Version** | 1.0 |
| **Date** | 2026-06-24 |
| **Related Personas** | `project_specs/PERSONAS-uReport.md` |
| **Related PRD** | `project_specs/PRD-uReport.md` |
| **Project** | `.planning/PROJECT.md` |

---

## JTBD Summary Table

| JTBD-ID | Persona | Job Statement (Summary) | Priority |
|---------|---------|------------------------|----------|
| JTBD-01.1 | PER-01 Marcus (Case Worker) | Triage daily ticket queue and surface overdue items | P0 |
| JTBD-01.2 | PER-01 Marcus (Case Worker) | Find and update a specific ticket without losing context | P0 |
| JTBD-01.3 | PER-01 Marcus (Case Worker) | Re-use recurring filter combinations without rebuilding them | P2 |
| JTBD-02.1 | PER-02 Diana (Dept Admin) | Keep category taxonomy accurate so tickets route automatically | P1 |
| JTBD-02.2 | PER-02 Diana (Dept Admin) | Monitor SLA compliance trends and catch categories falling behind | P2 |
| JTBD-02.3 | PER-02 Diana (Dept Admin) | Onboard new staff to categories without calling the system admin | P1 |
| JTBD-03.1 | PER-03 Jordan (Sys Admin) | Provision and manage user accounts and roles from one surface | P0 |
| JTBD-03.2 | PER-03 Jordan (Sys Admin) | Register, key, and rotate external API clients securely | P1 |
| JTBD-03.3 | PER-03 Jordan (Sys Admin) | Validate the deployed system's health and background job execution | P1 |
| JTBD-04.1 | PER-04 Integra (API Client) | Submit service requests and receive valid IDs without code changes | P0 |
| JTBD-04.2 | PER-04 Integra (API Client) | Poll for request status updates with byte-identical response shapes | P0 |
| JTBD-04.3 | PER-04 Integra (API Client) | Authenticate write operations using existing API keys | P0 |

---

## PER-01: Marcus Webb — City Case Worker

---

### JTBD-01.1: Daily Queue Triage

**Job Statement:**
When I arrive at work and open uReport to start my day, I want to see all my assigned tickets filtered by status and due date at a glance, so I can identify which cases need immediate action before SLAs are breached.

**Current Alternatives:**
- Opens multiple browser tabs with different filter combinations, mentally cross-referencing them
- Relies on email notifications for escalations, which frequently arrive too late
- Rebuilds the same filter (status=open, sorted by due date) from scratch every morning

**Hiring Criteria:**
- Displays all assigned open tickets in a single filtered list view with SLA due date visible per row
- Visually highlights overdue or near-deadline tickets without requiring manual filtering
- Ticket list loads and re-filters without full page reload — live filtering on parameter changes
- Paginated results return in under 500ms for datasets up to 500,000 tickets

**Success Measure:** Marcus can identify his top 3 priority items within 60 seconds of logging in, with zero SLA-breached tickets attributed to navigation friction.

**Related Features:** F0, F8, F11, F12
**Priority:** P0

---

### JTBD-01.2: Full Ticket Update Without Context-Switching

**Job Statement:**
When I open a ticket to record a constituent response, I want to add a comment, change the status, and attach supporting photos all within the same view, so I can complete the full update in under 3 minutes without losing my place in the queue.

**Current Alternatives:**
- Navigates to separate pages to record notes, change status, and upload media — three distinct page loads
- Loses queue position on each navigation, requiring a new search to return to the correct filter set
- Copy-pastes boilerplate response text manually from a shared document

**Hiring Criteria:**
- Comment entry, status change (including substatus), and media upload are all available on the ticket detail view without page navigation
- Response templates are selectable from the ticket action area to pre-fill note text
- Every change is appended to the immutable ticket history log immediately
- Full ticket update (comment + status change + media attach) completes in under 3 minutes

**Success Measure:** Staff can locate any ticket by keyword or address in under 30 seconds, and complete a full update (comment + status + media) in under 3 minutes.

**Related Features:** F0, F1, F9, F10, F20
**Priority:** P0

---

### JTBD-01.3: Persistent Saved Searches

**Job Statement:**
When I rely on the same filter combination every day (e.g., my department + open status + overdue), I want to save that search as a named bookmark and return to it with a single click, so I can eliminate the daily setup tax and start working immediately.

**Current Alternatives:**
- Rebuilds identical filter combinations from scratch every morning — no persistence mechanism exists in the legacy system
- Uses browser bookmarks to save full page URLs, which break when session tokens expire or URL structure changes

**Hiring Criteria:**
- Can save any current search as a named bookmark linked to the logged-in user account
- Bookmarks are listed in a persistent sidebar or navigation area
- Clicking a bookmark loads the saved filter results in under 2 seconds
- Bookmarks survive session logout and re-login

**Success Measure:** Marcus can return to his primary work view in under 5 seconds after login using a saved bookmark, with zero re-entry of filter parameters.

**Related Features:** F11, F12
**Priority:** P2

---

## PER-02: Diana Reyes — Department Administrator

---

### JTBD-02.1: Accurate Category Configuration

**Job Statement:**
When I need to activate a new service type or adjust routing for an existing one, I want to configure a category's SLA, default assignee, custom fields, and permission levels through a validated form, so I can ensure tickets route correctly to the right staff without manual intervention from the moment of submission.

**Current Alternatives:**
- Hand-edits raw JSON in a text field to update custom field schemas — no inline validation; errors are discovered only after a ticket is submitted
- Each save triggers a full page reload, requiring multiple round trips to configure all category settings
- Calls Jordan (sys admin) to verify that a custom field change took effect because there is no immediate feedback

**Hiring Criteria:**
- A single category configuration form covers all fields: active status, SLA days, permission levels, default assignee, auto-close rule, and custom field schema
- Custom field schema changes are validated inline (not on save) and take effect immediately on the next ticket submission without a deployment
- Category saves complete without full page reload; feedback confirms success or surface validation errors in-context
- Entire category setup or reconfiguration completes in under 10 minutes

**Success Measure:** Diana can create or fully reconfigure a category (all fields, SLA, custom fields, assignee) in under 10 minutes, with custom field changes live on the next ticket submission.

**Related Features:** F6, F7, F9
**Priority:** P1

---

### JTBD-02.2: SLA Compliance Monitoring

**Job Statement:**
When the end of the month approaches and I need to assess department performance, I want to view on-time closure percentages and volume trends by category in a single dashboard, so I can identify which categories are falling behind and take corrective action before the reporting period closes.

**Current Alternatives:**
- Navigates to a separate reports screen and manually assembles 3–4 separate filter combinations to piece together a department picture
- Mentally stitches results from multiple reports — no unified departmental SLA view exists
- Exports raw CSV data to a spreadsheet to calculate on-time percentages herself

**Hiring Criteria:**
- Metrics dashboard shows on-time closure percentage per category over a selectable time window (default 30 days) scoped to her department
- Dashboard loads all category SLA metrics in under 5 seconds
- Volume trend data is available alongside SLA data without switching report screens
- No system admin involvement required to access or filter the dashboard

**Success Measure:** Diana can view her department's 30-day SLA compliance summary across all categories in under 5 seconds, without running multiple separate reports.

**Related Features:** F7, F17
**Priority:** P2

---

### JTBD-02.3: Self-Service Staff Onboarding

**Job Statement:**
When a new case worker joins my department, I want to create their account, assign their role, and associate them with the appropriate categories myself, so I can have them productive on day one without waiting on the system administrator.

**Current Alternatives:**
- Submits a request to Jordan (sys admin) for account creation and category assignment — introduces a 1–2 day lag
- Jordan creates accounts but doesn't know which categories apply, requiring a second back-and-forth
- Diana lacks visibility into her staff's current category assignments, making it hard to audit or adjust

**Hiring Criteria:**
- Department Administrator role has permission to add a person to the department and assign that person to categories within her department without system admin access
- New staff member assignment to 3 categories takes under 5 minutes
- Diana can view all staff currently assigned to each of her department's categories
- New user can authenticate via JWT and access their queue immediately after assignment

**Success Measure:** Diana can add a new staff member and assign them to 3 categories in under 5 minutes without involving the system administrator.

**Related Features:** F5, F6, F4
**Priority:** P1

---

## PER-03: Jordan Kim — System Administrator

---

### JTBD-03.1: Centralized User Account Management

**Job Statement:**
When I need to provision a new staff member or adjust an existing user's role after the JWT migration, I want to create, update, and deactivate user accounts with role and department assignments from a single admin interface, so I can maintain a secure, accurate user directory without writing SQL or touching the database directly.

**Current Alternatives:**
- Runs SQL queries against the MySQL database to create or update user records when the admin UI is insufficient
- Maintains two separate auth paths (PHP session for staff, API key for clients) — no unified admin surface
- Cannot confirm a staff login will succeed after a role change without asking the user to test it themselves

**Hiring Criteria:**
- Admin UI supports create, update, and deactivate for all user accounts with role (`staff`, `public`, `anonymous`) and department assignment
- New staff user can be created and assigned a role in under 3 minutes
- All legacy staff accounts authenticate via JWT after migration with zero manual password resets
- Auth events (login, failure, token issuance) are logged with timestamp, user, and outcome

**Success Measure:** All existing staff accounts authenticate via JWT after migration with zero manual interventions, and Jordan can create a new staff user with role and department in under 3 minutes.

**Related Features:** F3, F4, F5
**Priority:** P0

---

### JTBD-03.2: Secure API Client Lifecycle Management

**Job Statement:**
When an external integrator needs to connect to uReport or an existing client's key is compromised, I want to register new API clients, generate hashed API keys, and rotate or revoke existing keys from the admin interface, so I can maintain the security boundary between external consumers and the system without code changes or service restarts.

**Current Alternatives:**
- API keys are stored unhashed in the legacy database — Jordan cannot remediate this security exposure without a code change
- Registering a new API client requires direct database manipulation for key assignment in the current system
- Key rotation requires a service restart or manual database update to propagate the new key

**Hiring Criteria:**
- Admin interface supports create, update, and delete for API client records including key generation
- API keys are stored hashed at rest (not plaintext)
- Key rotation is reflected immediately without a service restart
- Each client is linked to a contact person for accountability
- Rotating a key does not disrupt other active clients

**Success Measure:** Jordan can register a new API client and generate a hashed key in under 3 minutes, and key rotation takes effect immediately without a service restart.

**Related Features:** F13, F4
**Priority:** P1

---

### JTBD-03.3: Deployment and Scheduler Health Verification

**Job Statement:**
When I bring up a new deployment or investigate a reported issue, I want to verify that all Spring Scheduler background jobs ran successfully and that the Open311 API is backward-compatible, so I can confirm system health with confidence before declaring the deployment stable.

**Current Alternatives:**
- Inspects raw Apache and PHP error logs with no structured job execution tracking — no timestamps or outcomes for cron runs
- Manually runs curl commands against Open311 endpoints after each deployment to spot-check response shapes
- The Ansible + Solr ops model requires monitoring two separate processes; Docker removes this split but Jordan needs equivalent visibility

**Hiring Criteria:**
- Spring Scheduler job execution is logged with job name, execution timestamp, and outcome (success/failure)
- `docker-compose up` from a clean checkout produces a fully functional system in under 10 minutes
- Automated Open311 integration tests validate all response shapes (JSON and XML) against legacy fixtures per deployment
- Logs are accessible via standard `docker logs` without additional tooling

**Success Measure:** Jordan can confirm all background jobs ran and Open311 response shapes match legacy fixtures within 15 minutes of a deployment, using only `docker logs` and the automated test suite.

**Related Features:** F2, F16, F18
**Priority:** P1

---

## PER-04: Integra Transit App — External API Client

---

### JTBD-04.1: Zero-Change Service Request Submission

**Job Statement:**
When a transit rider submits a service issue through the Integra portal, the Integra backend needs to POST to `/open311/requests` and receive a valid `service_request_id` in the exact same JSON or XML shape as before the migration, so that no changes are required to Integra's integration code and riders receive uninterrupted confirmation of their submissions.

**Current Alternatives:**
- There is no alternative — this is the contracted API integration. Any response shape change forces a code change and re-deployment on Integra's side, which may not be feasible on short notice.

**Hiring Criteria:**
- POST `/open311/requests` accepts the same parameters (api_key, service_code, lat, long, description, custom attributes) as the legacy system
- JSON and XML response shapes for the POST response are byte-compatible with legacy PHP output
- HTTP status codes (200, 403, 404) and error response structures are identical to legacy behavior
- `service_request_id` is returned in the same field position and type as the legacy response

**Success Measure:** Zero changes required to Integra's integration code after uReport migration; all Open311 POST responses pass byte-level comparison against legacy PHP fixtures.

**Related Features:** F2, F4, F18
**Priority:** P0

---

### JTBD-04.2: Byte-Identical Status Polling

**Job Statement:**
When a constituent checks their submission status on the Integra portal, Integra's frontend polls GET `/open311/requests/{id}` and GET `/open311/requests` and parses the response to display current ticket status, so the response field names, types, ordering, pagination format, and null-handling must remain indistinguishable from the legacy PHP system.

**Current Alternatives:**
- There is no alternative — Integra's XML and JSON parsers were written to a specific response contract. Any field drift (renamed key, CDATA wrapping added, null returned as empty string vs. omitted) causes a silent parse failure or crash.

**Hiring Criteria:**
- GET `/open311/requests/{id}` returns all fields with the same names, types, and null-handling as legacy
- GET `/open311/requests` pagination, field ordering, and filter semantics are indistinguishable from Solr-backed legacy output (≥95% result overlap on equivalent queries)
- XML output format (escaping, CDATA usage, empty element handling) is byte-compatible with legacy
- `GET /open311/services` returns accurate custom attribute schemas reflecting the current category configuration

**Success Measure:** All Open311 GET response payloads pass byte-level comparison against legacy PHP fixtures with zero field name, type, or structural deviations.

**Related Features:** F2, F11, F18
**Priority:** P0

---

### JTBD-04.3: Uninterrupted API Key Authentication

**Job Statement:**
When Integra's backend sends write requests to uReport using the API key issued years ago, it needs those requests to be authenticated successfully against the new Spring Boot backend, so the migration does not require Integra's operators to re-register or obtain new credentials.

**Current Alternatives:**
- There is no alternative for existing integrations — any change to key validation semantics (format, hash comparison, header vs. query param) would silently reject requests that previously succeeded, causing data loss on the constituent side.

**Hiring Criteria:**
- Existing API keys from the legacy `clients` table are migrated and validate successfully against the Spring Boot API key authentication layer
- API key is accepted in the same request location (query parameter `api_key`) as the legacy system
- HTTP 403 response for invalid or unauthorized keys uses the same response shape as the legacy system
- Key migration does not require any action from Integra's operators

**Success Measure:** All registered API client keys authenticate successfully against the Spring Boot backend post-migration, with zero re-registration required and HTTP 403/404 error shapes identical to legacy.

**Related Features:** F2, F4, F13
**Priority:** P0

---

## Outcome-to-Feature Traceability

| JTBD-ID | Related Feature(s) | Expected Outcome |
|---------|-------------------|-----------------|
| JTBD-01.1 | F0, F8, F11, F12 | Case workers identify priority tickets within 60 seconds of login with zero SLA breaches from navigation friction |
| JTBD-01.2 | F0, F1, F9, F10, F20 | Full ticket update (comment + status + media) completes in under 3 minutes from a single view |
| JTBD-01.3 | F11, F12 | Saved bookmarks load recurring filter results in under 2 seconds, eliminating daily setup |
| JTBD-02.1 | F6, F7, F9 | Categories configured correctly once route all tickets automatically; custom fields live immediately |
| JTBD-02.2 | F7, F17 | Department SLA dashboard loads 30-day summary in under 5 seconds, replacing manual report assembly |
| JTBD-02.3 | F5, F6, F4 | Department admins onboard new staff to 3 categories in under 5 minutes without system admin |
| JTBD-03.1 | F3, F4, F5 | All staff accounts authenticate via JWT post-migration; new users provisioned in under 3 minutes |
| JTBD-03.2 | F13, F4 | API keys stored hashed; rotation is immediate with no service restart; new clients registered in under 3 minutes |
| JTBD-03.3 | F2, F16, F18 | All scheduler jobs logged with timestamp and outcome; Open311 shapes validated per deployment |
| JTBD-04.1 | F2, F4, F18 | POST /open311/requests response is byte-compatible; zero integration code changes required |
| JTBD-04.2 | F2, F11, F18 | All GET response payloads pass byte-level comparison against legacy PHP fixtures |
| JTBD-04.3 | F2, F4, F13 | All existing API keys authenticate against Spring Boot; zero re-registration required |

---

## NaC Preview

> These are candidate Natural Acceptance Criteria for each job. They will be refined into full NaC statements in STORY-MAP.

| JTBD-ID | Outcome | Candidate Natural Acceptance Criterion |
|---------|---------|---------------------------------------|
| JTBD-01.1 | Identify priority tickets within 60 seconds | Given a case worker logs in with 30+ open assigned tickets, when the ticket list loads with status=open filter, then overdue tickets are visually highlighted and sorted to the top within 500ms |
| JTBD-01.2 | Full ticket update in under 3 minutes | Given a staff member is on a ticket detail view, when they add a comment, change substatus, and upload a photo, then all three actions are recorded as history entries without navigating away from the ticket |
| JTBD-01.3 | Saved bookmark loads in under 2 seconds | Given a case worker has saved a search bookmark, when they navigate to that bookmark after logging in, then the filtered ticket list loads with all saved parameters applied in under 2 seconds |
| JTBD-02.1 | Custom fields live on next submission | Given a department admin saves a category custom field schema change, when a constituent submits a ticket for that category immediately after, then the new fields are collected and stored without a deployment |
| JTBD-02.2 | SLA dashboard loads in under 5 seconds | Given a department admin opens the metrics dashboard, when she selects her department and a 30-day window, then on-time closure percentages for all categories are displayed within 5 seconds |
| JTBD-02.3 | New staff in 3 categories in under 5 minutes | Given a department admin creates a new person record, when she assigns the person to 3 categories in her department, then the person appears in each category's assignee list and can authenticate via JWT |
| JTBD-03.1 | Zero manual interventions on JWT migration | Given all legacy staff accounts have been migrated, when each staff user attempts login with their existing credentials, then JWT access tokens are issued with no password reset prompts |
| JTBD-03.2 | Key rotation immediate, no restart | Given an admin rotates an API client key via the admin UI, when the new key is used immediately in an Open311 POST request, then the request authenticates successfully without a service restart |
| JTBD-03.3 | Background jobs visible in logs | Given a Spring Scheduler job runs (notification digest, auto-close, audit), when Jordan inspects `docker logs`, then each job execution shows job name, start time, and success/failure outcome |
| JTBD-04.1 | POST response byte-compatible | Given a registered API client POSTs a service request, when the Spring Boot backend responds, then the JSON/XML response structure matches the legacy PHP fixture with no field name or type deviations |
| JTBD-04.2 | GET response byte-compatible | Given a GET /open311/requests/{id} request is made, when the Spring Boot backend responds, then the response passes byte-level comparison against the legacy PHP fixture for that request ID |
| JTBD-04.3 | Existing keys authenticate post-migration | Given an existing API client key from the migrated `clients` table is used in an Open311 POST, when the Spring Boot auth layer validates it, then the request succeeds with HTTP 200 and no re-registration required |

---

*JTBD generated 2026-06-24 | uReport Modernization Project*
