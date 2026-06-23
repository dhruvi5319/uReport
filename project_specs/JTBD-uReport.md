# Jobs-to-be-Done
# uReport — Municipal CRM Modernization

| Field | Value |
|-------|-------|
| **Product** | uReport Municipal CRM |
| **Version** | 1.0 |
| **Date** | 2026-06-23 |
| **Related Personas** | PERSONAS-uReport.md |
| **Related PRD** | PRD-uReport.md |
| **Status** | Active |

---

## JTBD Summary Table

| JTBD-ID | Persona | Job Statement (abbreviated) | Priority |
|---------|---------|----------------------------|----------|
| JTBD-01.1 | PER-01 Dana (Staff) | Prioritize daily ticket queue without manual re-filtering every session | P0 |
| JTBD-01.2 | PER-01 Dana (Staff) | Respond to constituents efficiently without retyping standard messages | P0 |
| JTBD-01.3 | PER-01 Dana (Staff) | Capture field evidence on a ticket from a mobile device without returning to the office | P1 |
| JTBD-02.1 | PER-02 Marcus (Manager) | Identify SLA risk and rebalance workload before a deadline is missed | P0 |
| JTBD-02.2 | PER-02 Marcus (Manager) | Produce the weekly department report for city leadership without clerk involvement | P1 |
| JTBD-02.3 | PER-02 Marcus (Manager) | Update category SLA rules when city policy changes without IT involvement | P1 |
| JTBD-03.1 | PER-03 Priya (Citizen) | Report a neighborhood issue from a smartphone quickly and get a confirmation | P0 |
| JTBD-03.2 | PER-03 Priya (Citizen) | Check the status of a previously submitted request without calling city hall | P1 |
| JTBD-04.1 | PER-04 Tomás (Admin/IT) | Integrate an Open311 client app against a fully documented, stable API contract | P0 |
| JTBD-04.2 | PER-04 Tomás (Admin/IT) | Deploy and configure uReport on a new server without reverse-engineering undocumented settings | P0 |
| JTBD-04.3 | PER-04 Tomás (Admin/IT) | Manage API keys and system configuration without database access or code edits | P1 |

---

## PER-01: Dana Reyes — Municipal Staff Member (CRM Operator)

---

### JTBD-01.1: Zero-Friction Daily Queue Prioritization

**Job Statement:**
When I log in at the start of my shift and face a backlog of 80–120 open tickets, I want to immediately see only the tickets assigned to me and my department — sorted by urgency — so I can decide which three to act on first without spending time re-entering filters.

**Current Alternatives:**
- Re-enters the same department + open + assigned-to-me filter combination every single session because the legacy system has no saved search persistence
- Maintains a personal spreadsheet tracking which tickets she responded to this week because the legacy UI provides no quick status summary
- Scans an unfiltered list and applies mental heuristics to guess priority order

**Hiring Criteria:**
- Personal ticket queue is reachable in ≤ 2 clicks after login with filters pre-applied
- Queue is sorted by SLA urgency by default (tickets approaching or past deadline surfaced first)
- Named filter bookmarks persist across sessions so she never re-enters the same combination
- Page loads in under 2 seconds so the first click of the day is not a wait

**Success Measure:** Dana can identify her top 3 priority tickets within 60 seconds of logging in, measured from successful OIDC login to first ticket opened.

**Related Features:** F0, F4, F12, F15
**Priority:** P0

---

### JTBD-01.2: Efficient Constituent Response Using Templates

**Job Statement:**
When a constituent's ticket requires a standard update — an acknowledgment, a scheduled inspection notice, or a resolution confirmation — I want to select a pre-written response template and send it in under 60 seconds, so I can process high response volume without degrading message quality or retyping the same text repeatedly.

**Current Alternatives:**
- Types responses from scratch because template selection is buried two navigation levels deep in the legacy form — faster to write than to find
- Keeps a personal text file of frequently used phrases she copies and pastes
- Skips the template system entirely and sends shorter, lower-quality responses to save time

**Hiring Criteria:**
- Template selector is available on the same screen as the response compose box — no navigation away from the ticket
- Templates support variable substitution (e.g., `{{ticket_id}}`, `{{assignee_name}}`) so they read as personalized
- Composed response and email dispatch complete in a single save action with no full-page reload
- Confirmation email arrives to the constituent within 30 seconds of submission

**Success Measure:** Staff response composed and sent using a template in under 60 seconds from opening the ticket detail view, with zero form-submission failures due to session timeout.

**Related Features:** F0, F8, F13, F15
**Priority:** P0

---

### JTBD-01.3: Field Evidence Attachment from a Mobile Browser

**Job Statement:**
When a field crew resolves an issue on-site and I need to attach their photo evidence to the correct ticket from my city-issued laptop or phone in the field, I want to upload one or more images from a mobile browser and have them linked to the right ticket immediately, so I can close the ticket the same day without returning to the office to use a desktop.

**Current Alternatives:**
- Returns to the office desktop to upload photos because the legacy form's file upload control is unusable at 375px viewport width (the map picker and file upload overlap)
- Emails photos to a colleague to upload on her behalf, which adds a handoff delay
- Notes "photos attached separately" in the ticket description and uploads the next day

**Hiring Criteria:**
- File upload control is fully usable on a 375px mobile viewport with no overlap or horizontal scrolling
- Supports upload of JPEG and PNG images from the device camera roll directly
- Upload associates the attachment with the active ticket's audit trail automatically
- Upload completes without losing the session or requiring re-login on a mobile browser

**Success Measure:** Field photo attached to the correct ticket from a 375px mobile browser in under 3 minutes with zero horizontal scrolling required.

**Related Features:** F6, F7, F15, NFR-05
**Priority:** P1

---

## PER-02: Marcus Webb — Department Manager / Supervisor

---

### JTBD-02.1: Proactive SLA Risk Identification and Workload Rebalancing

**Job Statement:**
When I start my workday and need to protect my department's SLA compliance, I want to see — without navigating away from my landing screen — which tickets are past or within 24 hours of their SLA deadline and which staff members have a disproportionate share of the open load, so I can reassign tickets before a deadline is missed rather than discovering the breach when a constituent calls.

**Current Alternatives:**
- Discovers SLA breaches after the fact when a constituent calls to complain, because the legacy system has no proactive alert or dashboard surfacing overdue tickets
- Asks a clerk to manually run a filtered export and report back — adds a 10–30 minute delay
- Manually cross-references the legacy ticket list against a separately maintained spreadsheet of SLA thresholds per category

**Hiring Criteria:**
- SLA breach count and near-breach tickets (within 24 hours) are visible on the post-login screen without any navigation
- Staff workload distribution (open ticket count per assignee) is visible on the same screen
- Bulk ticket reassignment from one staff member to another completes without a full-page reload
- Reassignment action is recorded in each ticket's audit trail for accountability

**Success Measure:** Marcus can identify all SLA-breached tickets and complete at least one bulk reassignment within 5 minutes of logging in, without visiting more than 2 screens.

**Related Features:** F0, F3, F6, F9, F15
**Priority:** P0

---

### JTBD-02.2: Self-Service Weekly Report Generation for City Leadership

**Job Statement:**
When I need to prepare the weekly activity and SLA compliance summary for the city director, I want to generate and download the report directly from the application with a stable CSV column order, so I can paste the numbers into my existing Excel template in under 5 minutes — without asking a clerk to run an export or manually adjusting broken pivot table columns.

**Current Alternatives:**
- Relies on a staff member to navigate to a separate reporting page, set date filters manually, wait for a slow full-page reload, and export a CSV — adds a dependency and 15–30 minute turnaround
- Re-fixes his Excel pivot table formulas every few weeks when the CSV column order changes between legacy exports
- Accepts incomplete data when the clerk is absent or busy

**Hiring Criteria:**
- Report parameters (department, date range, report type) are accessible from the main navigation in ≤ 2 clicks
- CSV column order is stable and documented — identical schema between exports regardless of data content changes
- Report includes: ticket counts by status, SLA on-time vs. late breakdown per category, per-staff assignment totals
- Report generation and CSV download completes in under 5 minutes start-to-finish

**Success Measure:** Marcus generates and downloads the weekly department CSV report in under 5 minutes, with CSV column schema identical to the previous week's export (verified by stable Excel pivot table behavior).

**Related Features:** F9, F15
**Priority:** P1

---

### JTBD-02.3: Self-Service Category SLA Configuration When Policy Changes

**Job Statement:**
When city policy changes the required response time for a ticket category — for example, reducing the pothole SLA from 14 to 7 business days — I want to update the SLA days and any related auto-close rules directly in the admin interface, so I can implement the policy change the same day without filing an IT request or waiting for a developer.

**Current Alternatives:**
- Files a request with the IT team (Tomás) to manually update configuration values, creating a 1–5 day delay depending on Tomás's availability
- Operates under the wrong SLA threshold between policy change and IT action, potentially causing compliance issues
- Has no visibility into which categories currently have custom SLA settings without asking IT to query the database

**Hiring Criteria:**
- Category SLA days and auto-close rules are editable from a self-service admin UI without SSH or database access
- Changes take effect immediately and are reflected in SLA calculations for new tickets created after the change
- The edit form shows the current SLA value and last-modified timestamp before saving
- Admin UI is accessible to department manager role without requiring full admin privileges

**Success Measure:** Marcus updates SLA days for a category and confirms the change is reflected in the system in under 5 minutes from identifying the need, with zero IT tickets filed.

**Related Features:** F2, F15
**Priority:** P1

---

## PER-03: Priya Nair — Constituent / Citizen

---

### JTBD-03.1: Mobile-Friendly Service Request Submission with Immediate Confirmation

**Job Statement:**
When I notice a public infrastructure problem near my home and want to report it, I want to fill out a simple submission form on my smartphone — add a photo, confirm the location, describe the issue — and receive an email confirmation with a ticket number within 30 seconds of hitting submit, so I know my report reached the right department and I have a record to follow up with.

**Current Alternatives:**
- Calls the city's non-emergency line instead because the legacy submission form is unusable on a 375px phone screen — the map picker and file upload overlap and cannot be interacted with
- Abandons the web form after encountering internal jargon category names (e.g., "PW-Infra Tier 2") and calls city hall
- Submits without confidence that her report was received because the legacy system sends no confirmation email for anonymous submissions — leaving her with no ticket number

**Hiring Criteria:**
- Submission form is fully functional on a 375px iPhone viewport with no horizontal scrolling and no overlapping controls
- Category names use plain-language labels a non-government user understands (e.g., "Pothole or Road Damage" not "PW-Infra Tier 2")
- Location can be entered as a street address or selected on an interactive map that works on mobile
- Confirmation email with ticket number and status link arrives within 30 seconds of successful submission
- No account creation is required to submit

**Success Measure:** Citizen completes a new service request submission — including photo upload and location entry — on a 375px mobile browser in under 3 minutes, and receives a confirmation email with a working status link within 30 seconds of submission.

**Related Features:** F0, F5, F7, F8, F15, NFR-05
**Priority:** P0

---

### JTBD-03.2: Ticket Status Lookup Without an Account

**Job Statement:**
When I want to know whether my service request is being worked on — especially after not hearing back for a week — I want to look up my ticket using my confirmation number or email address without creating an account, so I can get a reassuring status update without having to call city hall.

**Current Alternatives:**
- Calls the city's non-emergency line to ask for an update — adding to phone queue volume and taking 5–15 minutes
- Navigates to a non-obvious URL in the legacy system that has no link from the confirmation email or submission page, then gives up when she can't find it
- Assumes the city ignored her report and re-submits, creating a duplicate ticket

**Hiring Criteria:**
- A "Check your request status" link is included directly in the confirmation email
- Status lookup accepts the confirmation number (ticket ID) or the submitter's email address without requiring account login
- Status page shows: current status, when it was last updated, and the assigned department (not internal staff names)
- The lookup flow works on a mobile browser without requiring navigation beyond the link in the email

**Success Measure:** Citizen locates their ticket status using the link in their confirmation email within 60 seconds of clicking it, without creating an account or visiting more than 1 additional page.

**Related Features:** F0, F6, F10, F15
**Priority:** P1

---

## PER-04: Tomás Eriksson — System Administrator / IT + API Client Developer

---

### JTBD-04.1: Open311 Client Integration Against a Documented, Stable API Contract

**Job Statement:**
When I am building or maintaining a mobile app that submits service requests on behalf of citizens via Open311, I want to consume a fully documented OpenAPI spec and verify my integration against a spec-compliant test endpoint, so I can map my app's data model to the correct field names without reading PHP source code and trust that my integration will not break after a uReport upgrade.

**Current Alternatives:**
- Reads raw PHP controller source code to discover field names, required/optional enums, and error response formats — a process that takes hours per integration task and breaks when code is refactored without documentation updates
- Tests against the production endpoint in staging and discovers field inconsistencies (e.g., custom field JSON structure differs by category) only when his mobile app's deserializer fails at runtime
- Maintains a private wiki of observed API behavior that becomes stale after each uReport release

**Hiring Criteria:**
- OpenAPI 3.1 spec is served at `/api/docs` and covers 100% of non-Open311 internal endpoints
- Open311 GeoReport v2 endpoints pass the full Open311 spec compliance test suite with 0 failures
- All response envelopes are consistent — custom field structure does not vary by category in ways not described in the spec
- The spec document is updated automatically from annotated controllers so it stays in sync with code

**Success Measure:** Tomás maps all required Open311 POST request fields from the OpenAPI spec to his mobile app's data model in under 2 hours, with zero PHP source code consulted.

**Related Features:** F1, F14, F16
**Priority:** P0

---

### JTBD-04.2: Reliable Deployment to a New Server Without Undocumented Configuration Guesswork

**Job Statement:**
When I need to deploy uReport to a new city server — either via Ansible or Docker Compose — I want to follow a complete, tested runbook that covers every required configuration parameter, so I can complete a fresh deployment without reverse-engineering `site_config.php` constants or discovering missing parameters through runtime errors.

**Current Alternatives:**
- Reads the existing `site_config.php` file line-by-line to discover configuration parameters, some of which are undocumented and whose valid values are only discoverable by reading deeper PHP code
- Uses a trial-and-error approach for OIDC settings where a typo takes down authentication for all staff with no useful error message
- Spends 1–2 days on each new deployment due to undocumented edge cases; the process is not repeatable without his personal notes

**Hiring Criteria:**
- Ansible playbook and Docker Compose deployment paths have complete, tested runbooks documenting every required configuration parameter and its valid values
- OIDC provider settings (issuer, client ID, client secret) are configurable via the admin UI or a clearly documented environment variable — not hardcoded PHP constants
- Deployment completes end-to-end without errors on a fresh server using only the documented runbook
- In-place upgrade from the legacy schema completes using versioned migration scripts tested against a production-schema snapshot in CI

**Success Measure:** Tomás completes a fresh Docker Compose deployment on a new server in under 2 hours using only the published runbook, with zero undocumented steps required.

**Related Features:** F11, F16, NFR-10, NFR-12
**Priority:** P0

---

### JTBD-04.3: Self-Service API Key and System Configuration Management via Admin UI

**Job Statement:**
When I need to provision an API key for a new Open311 client app, add a staff user, or update OIDC/SMTP settings after a provider migration, I want to complete these tasks through the admin UI in under 2 minutes, so I can handle routine operational changes without database access, SSH sessions, or editing configuration files.

**Current Alternatives:**
- Provisions API keys by inserting directly into the database — there is no UI; this requires SSH, MySQL credentials, and knowledge of the schema structure
- Adds new staff users by navigating to a hidden admin URL that is not documented anywhere and is discoverable only by reading the PHP router
- Updates OIDC or SMTP settings by editing `site_config.php` constants directly, where a syntax error or typo takes the entire application down with no error message

**Hiring Criteria:**
- API client keys can be created, viewed, and revoked from the admin UI without any database access
- Staff user accounts can be created and role-assigned from the admin UI without SSH or hidden URLs
- OIDC provider settings and SMTP settings are configurable from the admin UI with validation feedback before saving
- All admin UI operations are protected by the admin role (F10) and logged in the audit trail

**Success Measure:** Tomás creates a new API client key and provisions a new staff user account from the admin UI in under 2 minutes total, with zero database queries or file edits required.

**Related Features:** F2, F3, F10, F11, F14, F15
**Priority:** P1

---

## Outcome-to-Feature Traceability

| JTBD-ID | Persona | Related Feature(s) | Expected Outcome |
|---------|---------|-------------------|------------------|
| JTBD-01.1 | PER-01 Dana | F0, F4, F12, F15 | Staff reaches prioritized personal queue in ≤ 60 seconds of login; saved filter bookmarks eliminate daily re-entry |
| JTBD-01.2 | PER-01 Dana | F0, F8, F13, F15 | Response composed and sent via template in ≤ 60 seconds; constituent email delivered within 30 seconds |
| JTBD-01.3 | PER-01 Dana | F6, F7, F15 | Photo attached to correct ticket from 375px mobile browser in ≤ 3 minutes with no layout breakage |
| JTBD-02.1 | PER-02 Marcus | F0, F3, F6, F9, F15 | SLA-breached tickets visible at login; bulk reassignment completes without full-page reload |
| JTBD-02.2 | PER-02 Marcus | F9, F15 | Weekly CSV report generated in ≤ 5 minutes; column schema stable across exports |
| JTBD-02.3 | PER-02 Marcus | F2, F15 | SLA and auto-close rules updated in ≤ 5 minutes with no IT ticket filed |
| JTBD-03.1 | PER-03 Priya | F0, F5, F7, F8, F15 | Submission completes on 375px mobile in ≤ 3 minutes; confirmation email with status link in ≤ 30 seconds |
| JTBD-03.2 | PER-03 Priya | F0, F6, F10, F15 | Ticket status retrieved in ≤ 60 seconds via email link; no account required |
| JTBD-04.1 | PER-04 Tomás | F1, F14, F16 | Open311 field mapping completed from OpenAPI spec in ≤ 2 hours; zero PHP source code read |
| JTBD-04.2 | PER-04 Tomás | F11, F16, NFR-10, NFR-12 | Fresh deployment via runbook in ≤ 2 hours; zero undocumented steps; schema migration succeeds without data loss |
| JTBD-04.3 | PER-04 Tomás | F2, F3, F10, F11, F14, F15 | API key + staff user provisioned in ≤ 2 minutes via admin UI; zero database access or file edits required |

**Feature Coverage Check:**

| Feature | Covered By |
|---------|-----------|
| F0 | JTBD-01.1, JTBD-01.2, JTBD-02.1, JTBD-03.1, JTBD-03.2 |
| F1 | JTBD-04.1 |
| F2 | JTBD-02.3, JTBD-04.3 |
| F3 | JTBD-02.1, JTBD-04.3 |
| F4 | JTBD-01.1 |
| F5 | JTBD-03.1 |
| F6 | JTBD-01.3, JTBD-02.1, JTBD-03.2 |
| F7 | JTBD-01.3, JTBD-03.1 |
| F8 | JTBD-01.2, JTBD-03.1 |
| F9 | JTBD-02.1, JTBD-02.2 |
| F10 | JTBD-03.2, JTBD-04.3 |
| F11 | JTBD-04.2, JTBD-04.3 |
| F12 | JTBD-01.1 |
| F13 | JTBD-01.2 |
| F14 | JTBD-04.1, JTBD-04.3 |
| F15 | JTBD-01.1, JTBD-01.2, JTBD-01.3, JTBD-02.1, JTBD-02.2, JTBD-02.3, JTBD-03.1, JTBD-03.2, JTBD-04.3 |
| F16 | JTBD-04.1, JTBD-04.2 |
| F17 | JTBD-01.1 (substatus filter in queue view) |
| F18 | JTBD-02.1 (merge visible in audit trail during escalation review) |

---

## NaC Preview (Natural Acceptance Criteria)

Candidate acceptance criteria derived from each job's success measure. These will be refined into full Natural Acceptance Criteria in the Story Map and FRD phases.

| JTBD-ID | Outcome Measured | Candidate Natural Acceptance Criterion |
|---------|-----------------|----------------------------------------|
| JTBD-01.1 | Queue reachable in ≤ 60 sec from login | **Given** Dana completes OIDC login, **when** she clicks "My Queue" from the post-login screen, **then** her assigned open tickets appear filtered and sorted by SLA urgency within 2 seconds, without re-entering any filter parameters. |
| JTBD-01.1 | Saved bookmarks persist across sessions | **Given** Dana saved a named filter bookmark in a previous session, **when** she logs in again and opens the bookmarks list, **then** her bookmark is present and loading it restores the exact filter state she saved. |
| JTBD-01.2 | Response sent via template in ≤ 60 sec | **Given** Dana opens a ticket detail view, **when** she selects a response template from the inline selector and submits, **then** the constituent receives the email within 30 seconds and the action is recorded in the ticket history — all without navigating away from the ticket. |
| JTBD-01.3 | Photo attached on 375px viewport | **Given** Dana is on a 375px-wide mobile browser, **when** she opens the ticket attachment section, **then** the file upload control is fully visible and operable with no horizontal scroll and no overlap with other elements. |
| JTBD-02.1 | SLA breaches visible at login | **Given** Marcus logs in, **when** the post-login screen loads, **then** a count of tickets past their SLA deadline and tickets within 24 hours of their deadline are displayed without any additional navigation. |
| JTBD-02.1 | Bulk reassignment without reload | **Given** Marcus selects multiple tickets in the queue view, **when** he reassigns them to a different staff member, **then** the reassignment completes and the updated queue reflects the change without a full-page reload. |
| JTBD-02.2 | Weekly report in ≤ 5 min | **Given** Marcus opens the reporting section, **when** he selects "Weekly Department Summary" and his department, **then** the CSV downloads within 30 seconds and its column schema matches the documented stable schema definition. |
| JTBD-02.3 | SLA days updated without IT | **Given** Marcus opens the category admin screen for "Pothole Repair", **when** he changes the SLA days value and saves, **then** the new SLA threshold is applied to all tickets created after the save, with the change timestamp recorded. |
| JTBD-03.1 | Submission on mobile in ≤ 3 min | **Given** Priya opens the public submission form on a 375px iPhone, **when** she enters a description, selects a plain-language category, pins a location, attaches a photo, and submits, **then** the form completes without horizontal scrolling and a confirmation page with ticket ID appears. |
| JTBD-03.1 | Confirmation email in ≤ 30 sec | **Given** Priya completes a valid submission, **when** 30 seconds elapse, **then** she has received an email containing her ticket ID and a direct link to the ticket status page. |
| JTBD-03.2 | Status lookup without account | **Given** Priya clicks the status link in her confirmation email, **when** the status page loads, **then** it displays the current ticket status, last-updated timestamp, and assigned department — without prompting her to create an account. |
| JTBD-04.1 | Open311 fields mapped from spec | **Given** the OpenAPI spec is served at `/api/docs`, **when** Tomás inspects the Open311 POST `/open311/requests` schema, **then** all required and optional fields are described with correct types, enums, and examples matching the GeoReport v2 specification. |
| JTBD-04.1 | Open311 compliance test passes | **Given** the modernized Open311 endpoint is deployed, **when** the Open311 GeoReport v2 compliance test suite runs, **then** it reports 0 failures across all required endpoints and response formats. |
| JTBD-04.2 | Fresh deployment via runbook | **Given** a clean server with Docker and Docker Compose installed, **when** Tomás follows the published deployment runbook, **then** the application is running and all health checks pass within 2 hours, with no steps requiring access to PHP source code. |
| JTBD-04.3 | API key provisioned via admin UI | **Given** Tomás is logged in as an admin, **when** he navigates to API Client Management and creates a new client with name and contact email, **then** a new API key is generated and displayed within 30 seconds, with no database access required. |

---

*Document generated: 2026-06-23*
*Derived from: PERSONAS-uReport.md · PRD-uReport.md · .planning/PROJECT.md*
*Feeds into: FRD-uReport.md · UserStories-uReport.md · TechArch-uReport.md*
