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
