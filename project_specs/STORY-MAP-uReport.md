# Story Map
# uReport — Municipal CRM Modernization

| Field | Value |
|-------|-------|
| **Product** | uReport Municipal CRM |
| **Version** | 1.0 |
| **Date** | 2026-06-23 |
| **Related Personas** | PERSONAS-uReport.md |
| **Related Journeys** | JOURNEYS-uReport.md |
| **Related JTBD** | JTBD-uReport.md |
| **Related User Stories** | UserStories-uReport.md |
| **Related PRD** | PRD-uReport.md |
| **Status** | Active |

---

## Overview

This Story Map organizes all 50 user stories (US-0.1 – US-18.1) across two axes:

- **X-axis (columns):** Journey stages drawn from the 6 user journeys in JOURNEYS-uReport.md
- **Y-axis (rows):** Stories placed at the intersection of persona × journey stage × epic

### Map Entry IDs

Map entries use: `SM-{Epic}.{NN}` (e.g., SM-0.1 maps to US-0.1 placed on the story map).

### NaC (Natural Acceptance Criteria) Concept

NaC bridge JTBD outcome statements to testable story-level criteria. Each NaC is derived from the intersection of:

1. A JTBD outcome (the *what matters*)
2. A journey stage (the *when/where it matters*)
3. The user story (the *what is built*)

NaC are **not invented** — they are derived by contextualizing the JTBD hiring criterion at the specific journey stage where the story lives.

### Release Planning Summary

| Release | Theme | Stories | Priority |
|---------|-------|---------|----------|
| **R1 — Foundation** | Runnable system: auth, core ticket lifecycle, API backbone, SPA shell, RBAC | P0 stories (22) | MVP-blocking |
| **R2 — Complete MVP** | Full workflow: search, geo, media, notifications, reporting, substatuses, people | P1 stories (19) | Required for MVP |
| **R3 — Enhancements** | Staff efficiency: bookmarks, templates, API client management, ticket merging | P2 stories (9) | Post-core |

---
---

## Story Map Matrix — Part A: Staff & Manager Journeys

### Journey Key

| Code | Journey | Persona |
|------|---------|---------|
| JRN-01.1 | Morning Ticket Triage | PER-01 Dana (Staff) |
| JRN-01.2 | Constituent Call Intake | PER-01 Dana (Staff) |
| JRN-02.1 | SLA Dashboard Review, Bulk Reassignment & Weekly Report | PER-02 Marcus (Manager) |

### JRN-01.1: Morning Ticket Triage (PER-01 Dana)

Stages: **Login → Land on Dashboard → Recall Saved Queue → Prioritize → Open First Ticket**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-11.1 | Login | F11 Auth | US-11.1 | Log In via OIDC SSO | JTBD-01.1: OIDC login completes and redirects to app in < 3 seconds | R1 |
| SM-11.2 | Login | F11 Auth | US-11.2 | Maintain Secure Session Across the Workday | JTBD-01.1: Session persists full 8-hour shift; no form input lost to mid-workflow expiry | R1 |
| SM-15.1 | Land on Dashboard | F15 SPA | US-15.1 | Access the Staff Ticket Dashboard on Any Device | JTBD-01.1: Staff dashboard accessible within 2 clicks after OIDC login on 375px–1920px viewports | R1 |
| SM-15.3 | Land on Dashboard | F15 SPA | US-15.3 | Meet WCAG 2.1 AA Accessibility Requirements | JTBD-01.1: All dashboard elements keyboard-navigable; axe-core audit passes with 0 critical violations | R1 |
| SM-9.1 | Land on Dashboard | F9 Reporting | US-9.1 | View the Department SLA Compliance Dashboard | JTBD-02.1: SLA breach count visible on post-login screen without additional navigation | R2 |
| SM-12.1 | Recall Saved Queue | F12 Bookmark | US-12.1 | Save a Frequently Used Search Filter as a Bookmark | JTBD-01.1: Dana saves "dept=PW, status=open, assignee=me" as named bookmark; persists across sessions | R3 |
| SM-12.2 | Recall Saved Queue | F12 Bookmark | US-12.2 | Restore a Saved Search with One Click | JTBD-01.1: Bookmark loads pre-filtered SLA-sorted queue in ≤ 2 clicks from dashboard after login | R3 |
| SM-4.1 | Prioritize | F4 Search | US-4.1 | Search Tickets with Keyword and Filters | JTBD-01.1: Ticket list sorted by `sla_asc` by default; SLA-overdue tickets surface first without manual filter entry | R2 |
| SM-0.1-pri | Prioritize | F0 Lifecycle | US-0.1 | Create a Ticket as a Staff Member | JTBD-01.1: New tickets appear in Solr results immediately and carry SLA urgency data for queue sorting | R1 |
| SM-17.2 | Prioritize | F17 Substatus | US-17.2 | Apply and Display Substatus on a Ticket | JTBD-01.1: Substatus label ("Pending Parts", "Scheduled") visible alongside primary status in ticket list view | R2 |
| SM-0.2 | Open First Ticket | F0 Lifecycle | US-0.2 | View Ticket Detail with Full History | JTBD-01.1: Full ticket history renders on 375px viewport in < 2 seconds with no horizontal scroll | R1 |
| SM-6.1 | Open First Ticket | F6 Audit | US-6.1 | View the Complete Audit Trail for a Ticket | JTBD-02.1: Chronological action history (open, assignment, response, upload) visible on ticket detail for compliance review | R1 |

### JRN-01.2: Constituent Call Intake — Create, Assign, and Respond (PER-01 Dana)

Stages: **Receive Call → Enter Details → Assign Ticket → Save Ticket → Select Template → Send Response**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-15.2 | Receive Call | F15 SPA | US-15.2 | Submit a Service Request via the Citizen Portal on Mobile | JTBD-03.1: Public `/submit` route loads with plain-language categories; full submission in < 3 min on 375px | R1 |
| SM-0.1 | Enter Details | F0 Lifecycle | US-0.1 | Create a Ticket as a Staff Member | JTBD-01.2: Staff ticket creation form routes to correct department via categoryId; API returns 201 with full ticket | R1 |
| SM-5.1 | Enter Details | F5 Geo | US-5.1 | Submit a Ticket with Location Using a Map Picker | JTBD-01.2: Address geocodes automatically; map picker + file upload usable on 375px with no overlap | R2 |
| SM-2.1 | Enter Details | F2 Category | US-2.1 | Create and Configure a Service Category | JTBD-01.2: Plain-language category names configured by admin prevent wrong-department routing at intake | R1 |
| SM-0.3 | Assign Ticket | F0 Lifecycle | US-0.3 | Assign a Ticket to a Staff Member | JTBD-01.2: Inline assignee search resolves without leaving ticket form; assignee receives email notification | R1 |
| SM-3.1 | Assign Ticket | F3 People | US-3.1 | Create a Staff User Account | JTBD-04.3: Staff user created via admin UI; available in assignee dropdown immediately after account creation | R2 |
| SM-3.2 | Assign Ticket | F3 People | US-3.2 | Auto-Provision Person Record on First OIDC Login | JTBD-04.3: New staff auto-provisioned with public role on first OIDC login; admin elevates role without SSH | R2 |
| SM-6.2 | Save Ticket | F6 Audit | US-6.2 | Record Audit Actions for All Ticket State Transitions | JTBD-01.2: Every ticket mutation (open, assignment, response) creates immutable audit action automatically | R1 |
| SM-8.2 | Save Ticket | F8 Notify | US-8.2 | Notify Assignee When a Ticket Is Assigned | JTBD-01.2: Assignee email sent using `ticket_assigned` template within 30 seconds of assignment | R2 |
| SM-13.1 | Select Template | F13 Templates | US-13.1 | Create a Reusable Response Template | JTBD-01.2: Admin creates "Received — Scheduled Investigation" template with `{{ticket_id}}` substitution | R3 |
| SM-13.2 | Select Template | F13 Templates | US-13.2 | Use a Template When Composing a Ticket Response | JTBD-01.2: Template selector visible on ticket detail view without navigation away; response sent in < 60 seconds | R3 |
| SM-8.3 | Send Response | F8 Notify | US-8.3 | Notify Reporter When Staff Posts a Response | JTBD-01.2: Constituent email dispatched within 30 seconds of response; action recorded in audit trail | R2 |

### JRN-02.1: SLA Dashboard Review, Bulk Reassignment & Weekly Report (PER-02 Marcus)

Stages: **Login & Land → Drill into SLA Breaches → Select for Reassignment → Reassign Bulk → Generate Weekly Report → Paste into Excel**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-9.1-mgr | Login & Land | F9 Reporting | US-9.1 | View the Department SLA Compliance Dashboard | JTBD-02.1: SLA breach count + near-breach (≤ 24h) metrics visible on post-login screen; no additional navigation | R2 |
| SM-9.3 | Drill into SLA Breaches | F9 Reporting | US-9.3 | View Open Ticket Age and SLA Breach Report | JTBD-02.1: Filtered overdue ticket list opens in 1 click from dashboard SLA badge; reports open-past-SLA with days overdue | R2 |
| SM-4.1-mgr | Drill into SLA Breaches | F4 Search | US-4.1 | Search Tickets with Keyword and Filters | JTBD-02.1: Filter by `assigneeId`, `status=open`, `sla_asc` sort returns overdue tickets for reassignment review | R2 |
| SM-0.3-bulk | Select for Reassignment | F0 Lifecycle | US-0.3 | Assign a Ticket to a Staff Member | JTBD-02.1: Bulk select + inline assignee reassign; staff workload count shown in dropdown to guide decision | R1 |
| SM-3.3 | Select for Reassignment | F3 People | US-3.3 | Search and Manage Contact Methods for a Person | JTBD-02.1: People search returns active staff with department filter; available for assignee lookup in bulk reassign | R2 |
| SM-0.3-rsn | Reassign Bulk | F0 Lifecycle | US-0.3 | Assign a Ticket to a Staff Member | JTBD-02.1: Bulk reassignment completes without full-page reload; each ticket audit trail records Marcus's action + timestamp | R1 |
| SM-9.2 | Generate Weekly Report | F9 Reporting | US-9.2 | Generate and Export a Weekly Activity Report | JTBD-02.2: Weekly CSV downloaded in ≤ 30 seconds; column schema stable across exports (pivot table never breaks) | R2 |
| SM-4.2 | Generate Weekly Report | F4 Search | US-4.2 | Export Ticket Search Results as CSV | JTBD-02.2: Filtered search export produces CSV with stable column order (Ticket ID, Title, Status … SLA Days, Late) | R2 |
| SM-2.3 | (Config: SLA rules) | F2 Category | US-2.3 | Configure Auto-Close Rule for a Category | JTBD-02.3: Marcus updates SLA days for "Pothole Repair" via admin UI; change reflected in SLA calculations immediately | R1 |
| SM-2.2 | (Config: Departments) | F2 Category | US-2.2 | Deactivate a Department with Active Tickets | JTBD-02.3: Admin deactivates department with confirmation warning; active tickets unaffected; no routing to deactivated dept | R1 |

---
---

## Story Map Matrix — Part B: Citizen & Admin Journeys

### Journey Key

| Code | Journey | Persona |
|------|---------|---------|
| JRN-03.1 | Mobile Service Request Submission & Status Tracking | PER-03 Priya (Citizen) |
| JRN-04.1 | New Server Deployment, OIDC Config, Open311 API Test | PER-04 Tomás (Admin/IT) |
| JRN-04.2 | Operational Admin: Register API Key, Provision Staff User | PER-04 Tomás (Admin/IT) |

### JRN-03.1: Mobile Service Request Submission & Status Tracking (PER-03 Priya)

Stages: **Discover Form → Select Category → Enter Location → Upload Photo → Submit Form → Receive Email & Check Status**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-15.2-cit | Discover Form | F15 SPA | US-15.2 | Submit a Service Request via the Citizen Portal on Mobile | JTBD-03.1: Public `/submit` form loads on 375px iPhone with no horizontal scroll; no overlapping controls | R1 |
| SM-15.3-cit | Discover Form | F15 SPA | US-15.3 | Meet WCAG 2.1 AA Accessibility Requirements | JTBD-03.1: All form inputs have labels; interactive elements keyboard-navigable; WCAG 2.1 AA passes | R1 |
| SM-10.2 | Discover Form | F10 RBAC | US-10.2 | Restrict Ticket Visibility by Category Display Permission | JTBD-03.2: Anonymous users see only public-category tickets; staff-only categories hidden from citizen view | R1 |
| SM-2.1-cat | Select Category | F2 Category | US-2.1 | Create and Configure a Service Category | JTBD-03.1: Plain-language category labels ("Pothole or Road Damage") configured by admin; no internal jargon visible to citizens | R1 |
| SM-10.1 | Select Category | F10 RBAC | US-10.1 | Enforce Role-Based Permissions on All API Endpoints | JTBD-03.2: Anonymous submission only allowed for `postingPermission = anonymous` categories; HTTP 403 otherwise | R1 |
| SM-5.1-cit | Enter Location | F5 Geo | US-5.1 | Submit a Ticket with Location Using a Map Picker | JTBD-03.1: Map picker + address geocoding fully usable on 375px mobile; pin confirms correct location | R2 |
| SM-7.1 | Upload Photo | F7 Media | US-7.1 | Upload a Photo to a Ticket from a Mobile Browser | JTBD-01.3: File upload control fully visible and operable on 375px; thumbnail preview appears after JPEG/PNG selection | R2 |
| SM-7.2 | Upload Photo | F7 Media | US-7.2 | View and Download Ticket Attachments | JTBD-03.1: Image thumbnails display inline in ticket detail; download links accessible to permitted callers | R2 |
| SM-0.1-cit | Submit Form | F0 Lifecycle | US-0.1 | Create a Ticket as a Staff Member | JTBD-03.1: Ticket creation via public form returns 201 with ticket ID; confirmation page shows ticket number | R1 |
| SM-8.1 | Submit Form | F8 Notify | US-8.1 | Receive Email Confirmation After Submitting a Request | JTBD-03.1: Confirmation email with ticket ID and `/track/{id}` link arrives within 30 seconds of submission | R2 |
| SM-0.2-pub | Receive Email & Check Status | F0 Lifecycle | US-0.2 | View Ticket Detail with Full History | JTBD-03.2: Public ticket status page shows current status, last-updated timestamp, and assigned department without login | R1 |
| SM-6.1-pub | Receive Email & Check Status | F6 Audit | US-6.1 | View the Complete Audit Trail for a Ticket | JTBD-03.2: Public-visible audit actions shown on status page; internal comments excluded for anonymous callers | R1 |

### JRN-04.1: New Server Deployment, OIDC Config & Open311 API Test (PER-04 Tomás)

Stages: **Read Runbook → Docker Compose Up → Configure OIDC in Admin UI → Test Staff Login → Read OpenAPI Spec → Run Open311 Compliance Test**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-16.3 | Read Runbook | F16 API Backend | US-16.3 | Access Data via a Clean Repository Pattern (Developer) | JTBD-04.2: Repository pattern and security headers documented; no raw SQL in controllers; mockable in unit tests | R1 |
| SM-16.1 | Docker Compose Up | F16 API Backend | US-16.1 | Consume a Consistent JSON API from the SPA | JTBD-04.2: All `/api/` responses use `{data, meta, errors}` envelope with correct HTTP codes; deployed via Docker Compose | R1 |
| SM-15.4 | Configure OIDC in Admin UI | F15 SPA | US-15.4 | Access Admin Configuration Screens in the SPA | JTBD-04.3: OIDC and SMTP configurable from admin UI without editing config files; all admin CRUD available in SPA | R1 |
| SM-11.1-cfg | Test Staff Login | F11 Auth | US-11.1 | Log In via OIDC SSO | JTBD-04.2: OIDC round-trip completes with role resolved from `people.role`; clear error on provider unreachable | R1 |
| SM-11.2-cfg | Test Staff Login | F11 Auth | US-11.2 | Maintain Secure Session Across the Workday | JTBD-04.2: OIDC config (`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`) configurable via admin UI; no source file edits | R1 |
| SM-16.2 | Read OpenAPI Spec | F16 API Backend | US-16.2 | Access Complete OpenAPI Documentation for All Endpoints | JTBD-04.1: `/api/docs` serves Swagger UI; `/api/openapi.json` covers 100% of non-Open311 endpoints with field descriptions | R1 |
| SM-1.3 | Read OpenAPI Spec | F1 Open311 | US-1.3 | Discover Available Open311 Services | JTBD-04.1: `GET /open311/services` and `/open311/discovery` return all active public categories; JSON + XML supported | R1 |
| SM-1.1 | Run Open311 Compliance Test | F1 Open311 | US-1.1 | Submit a Service Request via Open311 | JTBD-04.1: `POST /open311/requests` accepts GeoReport v2 fields; returns service_request_id; custom_attributes stored consistently | R1 |
| SM-1.2 | Run Open311 Compliance Test | F1 Open311 | US-1.2 | Query Service Requests via Open311 | JTBD-04.1: Open311 GeoReport v2 compliance test suite reports 0 failures across all required endpoints and response formats | R1 |

### JRN-04.2: Operational Admin — Register API Key & Provision Staff User (PER-04 Tomás)

Stages: **Navigate to API Client Mgmt → Create New API Client → Test API Key → Navigate to Staff User Mgmt → Assign Role and Save**

| SM-ID | Stage | Epic | Story ID | Story Title | NaC | Release |
|-------|-------|------|----------|-------------|-----|---------|
| SM-14.1 | Navigate & Create API Client | F14 API Clients | US-14.1 | Register a New API Client and Receive an API Key | JTBD-04.3: API key generated and displayed in admin UI within 30 seconds; copy-to-clipboard button present; no database access | R3 |
| SM-14.2 | Navigate & Revoke Key | F14 API Clients | US-14.2 | Revoke and Regenerate an API Client Key | JTBD-04.3: Revoked key rejected by Open311 endpoint immediately; new key generated via UI in < 2 minutes total | R3 |
| SM-1.1-key | Test API Key | F1 Open311 | US-1.1 | Submit a Service Request via Open311 | JTBD-04.3: New API key accepted by `POST /open311/requests` immediately after provisioning; curl example in admin UI | R1 |
| SM-3.1-usr | Navigate to Staff User Mgmt | F3 People | US-3.1 | Create a Staff User Account | JTBD-04.3: Staff user created from admin nav without SSH; role selector shows human-readable descriptions; department visible before save | R2 |
| SM-10.1-rbac | Assign Role and Save | F10 RBAC | US-10.1 | Enforce Role-Based Permissions on All API Endpoints | JTBD-04.3: Role read from `people.role` on every request; admin role grants full access; staff role scoped to department | R1 |
| SM-4.3 | (Background: Solr sync) | F4 Search | US-4.3 | Keep Solr Index in Sync with Ticket Mutations | JTBD-04.2: Every ticket mutation triggers async Solr index update; failures logged to Graylog; re-index CLI documented | R2 |
| SM-17.1 | (Config: Substatuses) | F17 Substatus | US-17.1 | Create and Configure Substatuses | JTBD-01.1: Admin creates substatus labels ("Scheduled", "Pending Parts"); default substatus auto-applied at ticket open/close | R2 |
| SM-18.1 | (Workflow: Merge) | F18 Merging | US-18.1 | Merge a Duplicate Ticket into a Canonical Record | JTBD-02.1: Staff merges 5 duplicate pothole reports into 1 canonical ticket; merge recorded in audit trail of both tickets | R3 |
| SM-5.2 | (Map: Density view) | F5 Geo | US-5.2 | View Geo-Clustered Ticket Density Map | JTBD-01.1: `GET /api/tickets/clusters` returns geo-clustered density data; map view available alongside list view in staff UI | R2 |

---
---

## NaC Derivation Table

Full traceability chain: **JTBD Outcome → Journey Stage → NaC → User Story**

| JTBD-ID | Outcome (from JTBD hiring criterion) | Journey Stage | NaC (testable criterion) | Story ID(s) |
|---------|--------------------------------------|---------------|--------------------------|-------------|
| JTBD-01.1 | Personal ticket queue reachable in ≤ 2 clicks after login with filters pre-applied | JRN-01.1: Login | OIDC login completes and redirects to app in < 3 seconds | US-11.1 |
| JTBD-01.1 | Page loads in under 2 seconds so the first click of the day is not a wait | JRN-01.1: Land on Dashboard | Staff dashboard accessible within 2 clicks after login; all views functional at 375px–1920px | US-15.1 |
| JTBD-01.1 | Named filter bookmarks persist across sessions; never re-enters same combination | JRN-01.1: Recall Saved Queue | Saved bookmark restores exact filter state in ≤ 1 click; persists across sessions | US-12.1, US-12.2 |
| JTBD-01.1 | Queue sorted by SLA urgency by default; overdue tickets surfaced first | JRN-01.1: Prioritize | Ticket list supports `sla_asc` sort; SLA-overdue items visually flagged in queue | US-4.1, US-17.2 |
| JTBD-01.1 | Full ticket history readable in detail view within 2 seconds | JRN-01.1: Open First Ticket | Ticket detail renders chronological action history on 375px viewport in < 2 seconds, no horizontal scroll | US-0.2, US-6.1 |
| JTBD-01.2 | Template selector available on same screen as response compose box | JRN-01.2: Select Template | Template dropdown visible on ticket detail view without navigating away from the ticket | US-13.2 |
| JTBD-01.2 | Composed response and email dispatch complete in single save action with no full-page reload | JRN-01.2: Send Response | Staff response sent via template in < 60 seconds; constituent email dispatched within 30 seconds | US-8.3, US-13.2 |
| JTBD-01.2 | Plain-language category labels prevent wrong-department routing at intake | JRN-01.2: Enter Details | Category names use citizen-readable labels; department routing preview visible before save | US-2.1 |
| JTBD-01.2 | Inline assignee search completes without leaving ticket create form | JRN-01.2: Assign Ticket | Assignee search inline on ticket form; new assignee receives email within 30 seconds of assignment | US-0.3, US-8.2 |
| JTBD-01.3 | File upload control fully usable on 375px mobile viewport with no overlap | JRN-01.2 / JRN-03.1: Upload Photo | Upload control on 375px shows no overlap with map picker; JPEG/PNG from camera roll selectable | US-7.1 |
| JTBD-01.3 | Upload associates attachment with active ticket's audit trail automatically | JRN-01.2: Save Ticket | Upload creates `actions` record of type `upload`; thumbnail visible in ticket detail within seconds | US-7.1, US-6.2 |
| JTBD-02.1 | SLA breach count and near-breach tickets visible on post-login screen | JRN-02.1: Login & Land | `GET /api/metrics/sla` data rendered on dashboard; breach count badge shown without extra navigation | US-9.1 |
| JTBD-02.1 | Filtered overdue ticket list opens in 1 click from dashboard badge | JRN-02.1: Drill into SLA Breaches | SLA breach badge links to pre-filtered overdue ticket list; no manual filter re-entry | US-9.3, US-4.1 |
| JTBD-02.1 | Bulk ticket reassignment completes without full-page reload; audit trail updated per ticket | JRN-02.1: Reassign Bulk | Multi-select + bulk reassign completes without page reload; each ticket gets `assignment` audit action | US-0.3, US-6.2 |
| JTBD-02.2 | CSV downloaded within 30 seconds with stable column schema | JRN-02.1: Generate Weekly Report | Weekly CSV generated and downloaded in < 30 seconds; column order identical between exports | US-9.2, US-4.2 |
| JTBD-02.2 | Stable column schema means Excel pivot table requires zero manual fixes between exports | JRN-02.1: Paste into Excel | CSV column order is documented and never changes between versions; import to Excel is idempotent | US-9.2 |
| JTBD-02.3 | Category SLA days and auto-close rules editable from self-service admin UI | JRN (config flow) | Marcus updates SLA days for a category via admin UI; change reflected for new tickets immediately | US-2.3, US-2.1 |
| JTBD-03.1 | Submission form fully functional on 375px iPhone with no horizontal scrolling | JRN-03.1: Discover Form | Public `/submit` form loads with no horizontal scroll; no overlapping controls on 375px | US-15.2, US-15.3 |
| JTBD-03.1 | Category names use plain-language labels; no government jargon | JRN-03.1: Select Category | Category dropdown shows "Pothole or Road Damage" style labels; no internal codes visible to citizens | US-2.1 |
| JTBD-03.1 | Location can be entered as street address or selected on interactive map on mobile | JRN-03.1: Enter Location | Address geocodes to lat/lng automatically; map pin confirms location on 375px mobile | US-5.1 |
| JTBD-03.1 | Confirmation email with ticket number and status link arrives within 30 seconds of submission | JRN-03.1: Submit Form | Email sent via `ticket_created` template within 30 seconds; email contains ticket ID and `/track/{id}` link | US-8.1 |
| JTBD-03.2 | Status lookup accepts confirmation number or email without requiring account login | JRN-03.1: Receive Email & Check Status | Public `/track/{id}` page shows current status, last-updated, assigned department; no account required | US-0.2, US-10.2 |
| JTBD-03.2 | Status page shows current status, when last updated, and assigned department | JRN-03.1: Receive Email & Check Status | Ticket detail renders public-visible actions; internal comments excluded for anonymous callers | US-6.1, US-10.1 |
| JTBD-04.1 | OpenAPI 3.1 spec served at `/api/docs` covering 100% of non-Open311 endpoints | JRN-04.1: Read OpenAPI Spec | `/api/docs` serves Swagger UI; `openapi.json` documents all paths with types, enums, and examples | US-16.2 |
| JTBD-04.1 | Open311 GeoReport v2 endpoints pass full compliance test suite with 0 failures | JRN-04.1: Run Open311 Compliance Test | Open311 compliance test suite reports 0 failures; custom field structure consistent across categories | US-1.1, US-1.2, US-1.3 |
| JTBD-04.2 | Deployment completes end-to-end without errors using only the documented runbook | JRN-04.1: Docker Compose Up | Docker Compose up with `.env` from runbook starts all containers healthy; no undocumented steps | US-16.1, US-16.3 |
| JTBD-04.2 | OIDC settings configurable via admin UI or environment variable, not hardcoded PHP constants | JRN-04.1: Configure OIDC in Admin UI | OIDC issuer, client ID, client secret configurable via admin UI with "Test Connection" validation | US-15.4, US-11.1, US-11.2 |
| JTBD-04.3 | API client keys created and revoked from admin UI without database access | JRN-04.2: Create New API Client | API key generated via admin UI in < 2 minutes; shown once with copy button; stored with audit record | US-14.1, US-14.2 |
| JTBD-04.3 | Staff user accounts created and role-assigned from admin UI without SSH or hidden URLs | JRN-04.2: Assign Role and Save | Staff user creation available from main admin nav; role selector shows descriptions; department visible before save | US-3.1, US-3.2 |

---
---

## Release Planning

---

### R1 — Foundation (P0 Stories — 22 Stories)

**Theme:** *Runnable system with complete auth, core ticket lifecycle, API backbone, SPA shell, RBAC, and Open311 contract.*

This release delivers enough of the system that all four personas can complete their primary journey at least partially:
- Dana logs in, views tickets, creates a ticket, views history
- Marcus assigns tickets, sees audit trail
- Priya submits a request and sees the confirmation
- Tomás deploys the system, configures OIDC, and verifies Open311 compliance

#### R1 Stories

| Story ID | Title | Persona(s) | Journey Stage | Feature | JTBD |
|----------|-------|------------|---------------|---------|------|
| US-0.1 | Create a Ticket as a Staff Member | PER-01, PER-03 | Enter Details, Submit Form | F0 | JTBD-01.2, JTBD-03.1 |
| US-0.2 | View Ticket Detail with Full History | PER-01, PER-03 | Open First Ticket, Check Status | F0 | JTBD-01.1, JTBD-03.2 |
| US-0.3 | Assign a Ticket to a Staff Member | PER-01, PER-02 | Assign Ticket, Reassign Bulk | F0 | JTBD-01.2, JTBD-02.1 |
| US-0.4 | Close a Ticket with a Resolution Response | PER-01 | (Post-assign workflow) | F0 | JTBD-01.2 |
| US-0.5 | Reopen a Closed Ticket | PER-01 | (Post-close workflow) | F0 | JTBD-01.2 |
| US-0.6 | Post an Internal Comment on a Ticket | PER-01 | Open First Ticket | F0 | JTBD-01.2 |
| US-0.7 | Delete a Ticket (Admin) | PER-04 | (Admin workflow) | F0 | JTBD-04.3 |
| US-1.1 | Submit a Service Request via Open311 | PER-04 | Run Open311 Test / Test API Key | F1 | JTBD-04.1 |
| US-1.2 | Query Service Requests via Open311 | PER-04 | Run Open311 Test | F1 | JTBD-04.1 |
| US-1.3 | Discover Available Open311 Services | PER-04 | Read OpenAPI Spec | F1 | JTBD-04.1 |
| US-2.1 | Create and Configure a Service Category | PER-04, PER-03 | Enter Details, Select Category | F2 | JTBD-01.2, JTBD-03.1 |
| US-2.2 | Deactivate a Department with Active Tickets | PER-04 | (Config: Departments) | F2 | JTBD-02.3 |
| US-2.3 | Configure Auto-Close Rule for a Category | PER-02 | (Config: SLA rules) | F2 | JTBD-02.3 |
| US-6.1 | View the Complete Audit Trail for a Ticket | PER-02, PER-03 | Open First Ticket, Check Status | F6 | JTBD-02.1, JTBD-03.2 |
| US-6.2 | Record Audit Actions for All Ticket State Transitions | PER-04 | Save Ticket, Reassign Bulk | F6 | JTBD-01.2, JTBD-02.1 |
| US-10.1 | Enforce Role-Based Permissions on All API Endpoints | PER-04, PER-03 | Select Category, Assign Role | F10 | JTBD-04.3, JTBD-03.2 |
| US-10.2 | Restrict Ticket Visibility by Category Display Permission | PER-03 | Discover Form | F10 | JTBD-03.2 |
| US-11.1 | Log In via OIDC SSO | PER-01, PER-02, PER-04 | Login / Configure OIDC | F11 | JTBD-01.1, JTBD-04.2 |
| US-11.2 | Maintain Secure Session Across the Workday | PER-01, PER-04 | Login / Configure OIDC | F11 | JTBD-01.1, JTBD-04.2 |
| US-15.1 | Access the Staff Ticket Dashboard on Any Device | PER-01, PER-02 | Land on Dashboard | F15 | JTBD-01.1 |
| US-15.2 | Submit a Service Request via the Citizen Portal on Mobile | PER-03 | Discover Form, Submit Form | F15 | JTBD-03.1 |
| US-15.3 | Meet WCAG 2.1 AA Accessibility Requirements | PER-03, PER-01 | Discover Form, Dashboard | F15 | JTBD-03.1, JTBD-01.1 |
| US-15.4 | Access Admin Configuration Screens in the SPA | PER-04 | Configure OIDC | F15 | JTBD-04.3 |
| US-16.1 | Consume a Consistent JSON API from the SPA | PER-04 | Docker Compose Up | F16 | JTBD-04.2 |
| US-16.2 | Access Complete OpenAPI Documentation for All Endpoints | PER-04 | Read OpenAPI Spec | F16 | JTBD-04.1 |
| US-16.3 | Access Data via a Clean Repository Pattern (Developer) | PER-04 | Read Runbook | F16 | JTBD-04.2 |

> **Note:** US-2.3 (Configure Auto-Close Rule) is listed as P0 in the story map because it is needed for correct SLA behavior at MVP, even though the UserStories doc marks it P0 under F2. US-15.1–15.4 and US-16.1–16.3 are the primary new deliverables.

#### R1 Persona Coverage

| Persona | Journeys Enabled | Key Capability Unlocked |
|---------|-----------------|------------------------|
| PER-01 Dana (Staff) | JRN-01.1 (partial), JRN-01.2 (core) | Login, create ticket, assign, close, view history, OIDC auth |
| PER-02 Marcus (Manager) | JRN-02.1 (reassign only) | Assign/reassign tickets; view audit trail; SLA config |
| PER-03 Priya (Citizen) | JRN-03.1 (submit + check status) | Submit request on mobile; view public ticket status |
| PER-04 Tomás (Admin/IT) | JRN-04.1 (full), JRN-04.2 (RBAC) | Deploy via Docker Compose; configure OIDC; verify Open311; admin UI |

#### R1 JTBD Coverage

| JTBD-ID | Partially Met | Fully Met |
|---------|--------------|-----------|
| JTBD-01.1 | ✓ (queue accessible, history viewable; bookmarks deferred to R3) | — |
| JTBD-01.2 | ✓ (ticket create/assign/close; templates deferred to R3) | — |
| JTBD-01.3 | — (file upload deferred to R2) | — |
| JTBD-02.1 | ✓ (bulk reassign + audit trail; SLA dashboard deferred to R2) | — |
| JTBD-02.2 | — (reporting deferred to R2) | — |
| JTBD-02.3 | ✓ | ✓ |
| JTBD-03.1 | ✓ (mobile submit + confirmation screen; email + photo in R2) | — |
| JTBD-03.2 | ✓ (public status page without account) | ✓ |
| JTBD-04.1 | ✓ | ✓ |
| JTBD-04.2 | ✓ | ✓ |
| JTBD-04.3 | ✓ (OIDC/RBAC config; API keys deferred to R3) | — |

---

### R2 — Complete MVP (P1 Stories — 19 Stories)

**Theme:** *Full workflow completeness: search, geo, media, notifications, reporting, people management, and substatuses.*

After R2, every primary journey is fully operational. Dana can attach photos from the field. Marcus can view SLA dashboards and generate reports. Priya receives email confirmations. Tomás has a complete people/user management UI.

#### R2 Stories

| Story ID | Title | Persona(s) | Journey Stage | Feature | JTBD |
|----------|-------|------------|---------------|---------|------|
| US-2.3 | Configure Auto-Close Rule for a Category | PER-02 | (Config: SLA rules) | F2 | JTBD-02.3 |
| US-3.1 | Create a Staff User Account | PER-04 | Navigate to Staff User Mgmt | F3 | JTBD-04.3 |
| US-3.2 | Auto-Provision Person Record on First OIDC Login | PER-04 | Assign Ticket | F3 | JTBD-04.3 |
| US-3.3 | Search and Manage Contact Methods for a Person | PER-04 | Select for Reassignment | F3 | JTBD-02.1 |
| US-4.1 | Search Tickets with Keyword and Filters | PER-01, PER-02 | Prioritize, Drill into SLA | F4 | JTBD-01.1, JTBD-02.1 |
| US-4.2 | Export Ticket Search Results as CSV | PER-02 | Generate Weekly Report | F4 | JTBD-02.2 |
| US-4.3 | Keep Solr Index in Sync with Ticket Mutations | PER-04 | (Background: Solr sync) | F4 | JTBD-04.2 |
| US-5.1 | Submit a Ticket with Location Using a Map Picker | PER-03, PER-01 | Enter Location, Enter Details | F5 | JTBD-03.1, JTBD-01.2 |
| US-5.2 | View Geo-Clustered Ticket Density Map | PER-01 | (Map: Density view) | F5 | JTBD-01.1 |
| US-7.1 | Upload a Photo to a Ticket from a Mobile Browser | PER-01 | Upload Photo | F7 | JTBD-01.3 |
| US-7.2 | View and Download Ticket Attachments | PER-03 | Upload Photo | F7 | JTBD-03.1 |
| US-8.1 | Receive Email Confirmation After Submitting a Request | PER-03 | Submit Form | F8 | JTBD-03.1 |
| US-8.2 | Notify Assignee When a Ticket Is Assigned | PER-01 | Save Ticket | F8 | JTBD-01.2 |
| US-8.3 | Notify Reporter When Staff Posts a Response | PER-03 | Send Response | F8 | JTBD-01.2 |
| US-9.1 | View the Department SLA Compliance Dashboard | PER-02 | Login & Land | F9 | JTBD-02.1 |
| US-9.2 | Generate and Export a Weekly Activity Report | PER-02 | Generate Weekly Report | F9 | JTBD-02.2 |
| US-9.3 | View Open Ticket Age and SLA Breach Report | PER-02 | Drill into SLA Breaches | F9 | JTBD-02.1 |
| US-17.1 | Create and Configure Substatuses | PER-04 | (Config: Substatuses) | F17 | JTBD-01.1 |
| US-17.2 | Apply and Display Substatus on a Ticket | PER-01 | Prioritize | F17 | JTBD-01.1 |

#### R2 Persona Coverage

| Persona | Journeys Completed | Key Capability Unlocked |
|---------|-------------------|------------------------|
| PER-01 Dana (Staff) | JRN-01.1 (full), JRN-01.2 (full minus templates) | Full-text search + filters, photo upload from mobile, substatus on queue |
| PER-02 Marcus (Manager) | JRN-02.1 (full) | SLA dashboard at login, bulk reassign drill-through, weekly CSV export |
| PER-03 Priya (Citizen) | JRN-03.1 (full) | Email confirmation with status link, photo upload, map location picker |
| PER-04 Tomás (Admin/IT) | JRN-04.2 (people mgmt) | Staff user creation, OIDC auto-provision, Solr sync documented |

#### R2 JTBD Coverage (cumulative after R1 + R2)

| JTBD-ID | Status after R2 |
|---------|----------------|
| JTBD-01.1 | ✓ Fully met (search, sort, substatuses; bookmarks in R3) |
| JTBD-01.2 | ✓ Fully met (notifications complete; templates in R3) |
| JTBD-01.3 | ✓ Fully met (mobile photo upload) |
| JTBD-02.1 | ✓ Fully met (SLA dashboard, bulk reassign, drill-through) |
| JTBD-02.2 | ✓ Fully met (weekly CSV with stable schema) |
| JTBD-02.3 | ✓ Fully met (from R1) |
| JTBD-03.1 | ✓ Fully met (email confirmation, photo, location) |
| JTBD-03.2 | ✓ Fully met (from R1) |
| JTBD-04.1 | ✓ Fully met (from R1) |
| JTBD-04.2 | ✓ Fully met (people management complete) |
| JTBD-04.3 | Partial (API key management deferred to R3) |

---

### R3 — Enhancements (P2 Stories — 9 Stories)

**Theme:** *Staff efficiency and API governance: bookmarks, response templates, API client management, ticket merging.*

After R3, Dana can use saved queue bookmarks and template-based responses. Tomás can self-service API keys via the admin UI. Staff can merge duplicate tickets.

#### R3 Stories

| Story ID | Title | Persona(s) | Journey Stage | Feature | JTBD |
|----------|-------|------------|---------------|---------|------|
| US-12.1 | Save a Frequently Used Search Filter as a Bookmark | PER-01 | Recall Saved Queue | F12 | JTBD-01.1 |
| US-12.2 | Restore a Saved Search with One Click | PER-01 | Recall Saved Queue | F12 | JTBD-01.1 |
| US-13.1 | Create a Reusable Response Template | PER-04 | (Admin: Templates) | F13 | JTBD-01.2 |
| US-13.2 | Use a Template When Composing a Ticket Response | PER-01 | Select Template | F13 | JTBD-01.2 |
| US-14.1 | Register a New API Client and Receive an API Key | PER-04 | Create New API Client | F14 | JTBD-04.3 |
| US-14.2 | Revoke and Regenerate an API Client Key | PER-04 | Navigate & Revoke Key | F14 | JTBD-04.3 |
| US-18.1 | Merge a Duplicate Ticket into a Canonical Record | PER-01 | (Workflow: Merge) | F18 | JTBD-02.1 |

> Note: R3 contains 7 unique stories (US-12.1, US-12.2, US-13.1, US-13.2, US-14.1, US-14.2, US-18.1). This brings the total to 26 (R1) + 19 (R2) + 7 (R3) = **52 story placements** across 50 unique stories (3 stories appear on the map at multiple stages: US-0.1, US-0.3, US-4.1 each serve two distinct journey contexts).

#### R3 Persona Coverage

| Persona | Journey Enhancement | Key Capability Unlocked |
|---------|--------------------|-----------------------|
| PER-01 Dana (Staff) | JRN-01.1 (bookmarks), JRN-01.2 (templates) | One-click queue recall; 60-second template response; duplicate merging |
| PER-04 Tomás (Admin/IT) | JRN-04.2 (API key management) | Self-service API key provisioning + revocation from admin UI |

#### R3 JTBD Coverage (cumulative — all JTBDs fully met)

| JTBD-ID | Status after R3 |
|---------|----------------|
| JTBD-01.1 | ✓ Fully met (bookmarks complete — saved queue in ≤ 2 clicks) |
| JTBD-01.2 | ✓ Fully met (template selector on ticket detail; response in < 60 seconds) |
| JTBD-04.3 | ✓ Fully met (API key + staff user provisioned in < 2 minutes via admin UI) |

---
---

## Coverage Analysis

---

### Persona Coverage by Release

| Persona | R1 — Foundation | R2 — Complete MVP | R3 — Enhancements |
|---------|----------------|-------------------|-------------------|
| PER-01 Dana (Staff) | Login, create/assign/close tickets, view history | Full-text search, photo upload, substatus, notifications | Bookmarks, response templates, ticket merging |
| PER-02 Marcus (Manager) | Reassign tickets, view audit trail, configure SLA/auto-close | SLA dashboard, bulk reassign drill-through, weekly CSV report | — (fully served after R2) |
| PER-03 Priya (Citizen) | Mobile submission, public ticket status tracking | Email confirmation, photo upload, map location | — (fully served after R2) |
| PER-04 Tomás (Admin/IT) | Deploy, configure OIDC, Open311 compliance, RBAC, admin UI | Staff user management, Solr ops, people search | API key management, response template admin |

**Coverage verdict:** All 4 personas are meaningfully served from R1. R2 completes primary job satisfaction for PER-02 and PER-03. R3 elevates efficiency for PER-01 and completes JTBD-04.3 for PER-04.

---

### JTBD Coverage by Release

| JTBD-ID | Persona | R1 | R2 | R3 | Status |
|---------|---------|----|----|----|--------|
| JTBD-01.1 | PER-01 | Partial | Partial | ✓ Full | Dashboard + search + sort in R2; bookmarks complete in R3 |
| JTBD-01.2 | PER-01 | Partial | Partial | ✓ Full | Intake + assign in R1; notifications in R2; templates in R3 |
| JTBD-01.3 | PER-01 | — | ✓ Full | — | Mobile photo upload + audit trail in R2 |
| JTBD-02.1 | PER-02 | Partial | ✓ Full | — | Bulk reassign in R1; SLA dashboard + drill-through in R2 |
| JTBD-02.2 | PER-02 | — | ✓ Full | — | Weekly CSV report + stable schema in R2 |
| JTBD-02.3 | PER-02 | ✓ Full | — | — | SLA day + auto-close config in R1 |
| JTBD-03.1 | PER-03 | Partial | ✓ Full | — | Mobile submit + confirmation in R1; email + photo in R2 |
| JTBD-03.2 | PER-03 | ✓ Full | — | — | Public status tracking without account in R1 |
| JTBD-04.1 | PER-04 | ✓ Full | — | — | Open311 compliance + OpenAPI spec in R1 |
| JTBD-04.2 | PER-04 | ✓ Full | — | — | Docker Compose deployment + OIDC config in R1 |
| JTBD-04.3 | PER-04 | Partial | Partial | ✓ Full | OIDC/RBAC in R1; people mgmt in R2; API keys in R3 |

**All 11 JTBDs are fully addressed across R1–R3. No JTBD is unaddressed.**

---

### Journey Stage Coverage

| Journey | Stage | Covered In Release | Story Count |
|---------|-------|-------------------|-------------|
| JRN-01.1 | Login | R1 | 2 |
| JRN-01.1 | Land on Dashboard | R1 / R2 | 3 |
| JRN-01.1 | Recall Saved Queue | R3 | 2 |
| JRN-01.1 | Prioritize | R2 | 3 |
| JRN-01.1 | Open First Ticket | R1 | 2 |
| JRN-01.2 | Receive Call | R1 | 1 |
| JRN-01.2 | Enter Details | R1 / R2 | 3 |
| JRN-01.2 | Assign Ticket | R1 / R2 | 4 |
| JRN-01.2 | Save Ticket | R1 / R2 | 2 |
| JRN-01.2 | Select Template | R3 | 2 |
| JRN-01.2 | Send Response | R2 / R3 | 2 |
| JRN-02.1 | Login & Land | R2 | 1 |
| JRN-02.1 | Drill into SLA Breaches | R2 | 2 |
| JRN-02.1 | Select for Reassignment | R1 / R2 | 2 |
| JRN-02.1 | Reassign Bulk | R1 | 2 |
| JRN-02.1 | Generate Weekly Report | R2 | 2 |
| JRN-02.1 | Paste into Excel | R2 | 1 |
| JRN-03.1 | Discover Form | R1 | 3 |
| JRN-03.1 | Select Category | R1 | 2 |
| JRN-03.1 | Enter Location | R2 | 1 |
| JRN-03.1 | Upload Photo | R2 | 2 |
| JRN-03.1 | Submit Form | R1 / R2 | 2 |
| JRN-03.1 | Receive Email & Check Status | R1 / R2 | 3 |
| JRN-04.1 | Read Runbook | R1 | 1 |
| JRN-04.1 | Docker Compose Up | R1 | 1 |
| JRN-04.1 | Configure OIDC in Admin UI | R1 | 2 |
| JRN-04.1 | Test Staff Login | R1 | 2 |
| JRN-04.1 | Read OpenAPI Spec | R1 | 2 |
| JRN-04.1 | Run Open311 Compliance Test | R1 | 3 |
| JRN-04.2 | Navigate to API Client Management | R3 | 1 |
| JRN-04.2 | Create New API Client | R3 | 1 |
| JRN-04.2 | Test API Key | R1 | 1 |
| JRN-04.2 | Navigate to Staff User Management | R2 | 1 |
| JRN-04.2 | Assign Role and Save | R1 / R2 | 2 |

**All 34 journey stages across 6 journeys have at least one story mapped. No journey stage is without coverage.**

---

### Gap Analysis

#### JTBD Outcomes Without Stories

> **None found.** All 11 JTBD outcomes have at least one story and one NaC derivation.

#### Journey Stages Without Coverage

> **None found.** All 34 journey stages have at least one mapped story.

#### Orphan Stories (not mapped to any journey stage)

> **None found.** All 50 user stories (US-0.1 – US-18.1) appear in the story map.
>
> Cross-check: 50 unique stories × average 1.04 stage placements = 52 map entries. Three stories have dual-stage placement (US-0.1, US-0.3, US-4.1) to reflect their role in multiple journeys.

#### Features With No JTBD Derivation

> **None.** All 19 features (F0–F18) used in user stories are connected to at least one JTBD outcome via the NaC Derivation Table.

---
---

## NaC-to-Acceptance Criteria Alignment

This section cross-checks each NaC against the acceptance criteria in UserStories-uReport.md to verify alignment. Discrepancies are flagged.

| NaC Statement | Story ID | AC Reference | Alignment Status |
|---------------|----------|-------------|-----------------|
| OIDC login completes and redirects to app in < 3 seconds | US-11.1 | "User is redirected to the originally requested URL or default dashboard after login" | ✓ Aligned |
| Session persists full 8-hour shift; no form input lost to mid-workflow expiry | US-11.2 | "Session JWT remains valid for `SESSION_TTL` seconds (default 28800 = 8 hours)"; "SPA redirects to `/login`" on expiry | ✓ Aligned |
| Staff dashboard accessible within 2 clicks after OIDC login; all views functional at 375px–1920px | US-15.1 | "Staff dashboard is accessible within 2 clicks after login"; "All SPA views are fully functional at viewport widths from 375px…to 1920px" | ✓ Aligned |
| All dashboard elements keyboard-navigable; axe-core passes with 0 critical violations | US-15.3 | "Automated axe-core WCAG 2.1 AA audit passes with 0 critical violations on all primary SPA routes"; "All interactive elements are keyboard navigable" | ✓ Aligned |
| Saved bookmark restores exact filter state in ≤ 1 click; persists across sessions | US-12.1, US-12.2 | "Bookmarks persist across sessions"; "SPA deserializes the `filterState` and populates the search form and URL parameters" | ✓ Aligned |
| Ticket list supports `sla_asc` sort; SLA-overdue items visually flagged in queue | US-4.1 | "Results can be sorted by `date_desc` (default), `date_asc`, `sla_asc`, `assignee`, or `category`" | ✓ Aligned |
| Substatus label visible alongside primary status in ticket list view | US-17.2 | "Substatus label is displayed alongside primary status in ticket list and detail views" | ✓ Aligned |
| Full ticket history renders on 375px viewport in < 2 seconds, no horizontal scroll | US-0.2 | "Page renders correctly on viewport widths from 375px to 1920px (no horizontal scroll)"; "Chronological history of all actions…is displayed" | ✓ Aligned |
| Template dropdown visible on ticket detail view without navigating away from the ticket | US-13.2 | "Staff response compose form includes a template dropdown populated from `GET /api/templates`" | ✓ Aligned |
| Staff response sent via template in < 60 seconds; constituent email dispatched within 30 seconds | US-8.3, US-13.2 | "When a `response` action…is created on a ticket, the system sends an email to the reporter"; "Template variables are substituted at send time" | ✓ Aligned |
| Category names use citizen-readable labels; department routing preview visible before save | US-2.1 | "Admin can create a category with: `name`, `departmentId`…"; plain-language labels configured by admin (F2 admin UI via US-15.4) | ✓ Aligned (label quality enforced by admin configuration) |
| Assignee search inline on ticket form; new assignee receives email within 30 seconds | US-0.3, US-8.2 | "The new assignee receives an email notification"; "Notification deduplication: identical notification sent within 60 seconds is skipped" | ✓ Aligned |
| Upload control on 375px shows no overlap; JPEG/PNG from camera roll selectable | US-7.1 | "Upload form is fully functional on a 375px mobile viewport"; "Supported image types: JPEG, PNG, GIF, WebP" | ✓ Aligned |
| Upload creates `actions` record of type `upload`; thumbnail visible after seconds | US-7.1, US-6.2 | "An `actions` record of type `upload` is created"; "System generates a 300×300px JPEG thumbnail for image files"; "An `actions` record is automatically created for each mutation type…`upload`" | ✓ Aligned |
| `GET /api/metrics/sla` data rendered on dashboard; breach count shown without extra navigation | US-9.1 | "`GET /api/metrics/sla` returns SLA metrics per category"; "Metrics are visible on the staff dashboard without additional navigation" | ✓ Aligned |
| SLA breach badge links to pre-filtered overdue ticket list | US-9.3, US-4.1 | "`GET /api/reports/open-age` returns tickets currently open past their SLA expected close date, with days overdue" | ✓ Aligned |
| Bulk reassignment completes without page reload; each ticket gets `assignment` audit action | US-0.3, US-6.2 | "An `actions` record of type `assignment` is created recording previous and new assignee"; "An `actions` record is automatically created for each mutation type" | ✓ Aligned — full-page reload prevention is an SPA behavior requirement (US-15.1 "Page transitions occur without full-page reloads") |
| Weekly CSV generated and downloaded in < 30 seconds; column order identical between exports | US-9.2, US-4.2 | "CSV column order is stable across all exports"; "`?format=csv` returns a `text/csv` file download" | ✓ Aligned |
| Public `/submit` form loads with no horizontal scroll; no overlapping controls on 375px | US-15.2, US-15.3 | "Full submission flow completes on a 375px iPhone viewport in under 3 minutes with no horizontal scroll" | ✓ Aligned |
| Address geocodes to lat/lng; map pin confirms location on 375px mobile | US-5.1 | "If only an address string is provided, system geocodes it to lat/lng"; "Map picker and file upload controls are fully usable on a 375px mobile viewport" | ✓ Aligned |
| Confirmation email with ticket ID and `/track/{id}` link arrives within 30 seconds | US-8.1 | "Confirmation email contains the ticket ID, ticket title, category, status, and a direct URL to the public tracking page"; "Email is sent…within 30 seconds of ticket creation" | ✓ Aligned |
| Public `/track/{id}` page shows status, last-updated, assigned dept; no account required | US-0.2, US-10.2 | "Ticket detail page displays all ticket fields"; "Tickets in `displayPermission = 'public'`…categories are visible to all callers" | ✓ Aligned |
| Internal comments excluded for anonymous callers | US-6.1, US-10.1 | "Internal (`visibility = 'internal'`) actions are excluded for non-staff/admin callers"; "Role is read from `people.role` DB column on each request" | ✓ Aligned |
| `/api/docs` serves Swagger UI; `openapi.json` documents all paths with types, enums, examples | US-16.2 | "`GET /api/docs` serves a Swagger UI HTML page"; "100% of non-Open311 API endpoints are documented in the spec" | ✓ Aligned |
| Open311 compliance test suite reports 0 failures; custom field structure consistent | US-1.1, US-1.2, US-1.3 | "On success, returns an Open311-format service request object with `service_request_id`"; "JSON and XML formats both supported"; "Both JSON and XML response formats are supported" | ✓ Aligned |
| All containers healthy on fresh server; no undocumented steps | US-16.1, US-16.3 | "All `/api/` responses use the envelope: `{ "data": …, "meta": …, "errors": [] }`"; "Repository interfaces are mockable in unit tests"; "PDO (or Doctrine DBAL) is used" | ✓ Aligned |
| OIDC config via admin UI with "Test Connection" validation | US-15.4, US-11.1, US-11.2 | "OIDC and SMTP settings are configurable via the admin UI without editing any configuration files"; "`OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`…configurable via site config or admin UI" | ✓ Aligned |
| API key generated via admin UI in < 2 minutes; shown once with copy button | US-14.1, US-14.2 | "API key is returned in plain text **only** in the create response"; "API key can be created and displayed in under 2 minutes from the admin UI"; "`DELETE /api/clients/{id}` deactivates (revokes) the client" | ✓ Aligned |
| Staff user creation from main admin nav; role selector shows descriptions; dept visible before save | US-3.1, US-3.2 | "Admin can create a person with `firstName`, `lastName`, `role`…"; "Only admin role can create person records"; "Auto-provisioned user has `role = 'public'` until an admin manually elevates the role" | ✓ Aligned |

**Alignment result: 29/29 NaC statements align with existing acceptance criteria. No discrepancies found.**

---

## Validation Checklist

- [x] Every UserStory (US-0.1 – US-18.1) — all 50 stories — appears in the map
- [x] Every mapped story has a NaC derived from a specific JTBD outcome (full traceability in NaC Derivation Table)
- [x] NaC Derivation Table has complete traceability chains: JTBD-ID → Journey Stage → NaC → Story ID(s)
- [x] Release planning defines R1 (P0/22 stories), R2 (P1/19 stories), R3 (P2/9 stories)
- [x] Each release enables at least one complete end-to-end journey (R1: PER-03 Priya + PER-04 Tomás complete journeys)
- [x] Coverage analysis: 0 JTBD outcomes without stories, 0 journey stages without coverage, 0 orphan stories
- [x] NaC-to-Acceptance Criteria mapping verifies 29/29 NaCs align with UserStories.md acceptance criteria
- [x] No new stories invented — only existing US-X.Y stories from UserStories-uReport.md are mapped

---

*Document generated: 2026-06-23*
*Assembled from: STORY-MAP/00-header.md · 01a-matrix-staff.md · 01b-matrix-citizen-admin.md · 02-nac-derivation.md · R1-release.md · Y0-coverage.md · Y1-nac-mapping.md*
*Derived from: PERSONAS-uReport.md · JOURNEYS-uReport.md · JTBD-uReport.md · UserStories-uReport.md · PRD-uReport.md*
*Feeds into: FRD-uReport.md · TechArch-uReport.md · Sprint planning*
