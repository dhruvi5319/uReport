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
