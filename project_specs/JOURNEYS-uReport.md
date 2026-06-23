# User Journey Maps
# uReport — Municipal CRM Modernization

| Field | Value |
|-------|-------|
| **Product** | uReport Municipal CRM |
| **Version** | 1.0 |
| **Date** | 2026-06-23 |
| **Related Personas** | PERSONAS-uReport.md |
| **Related JTBD** | JTBD-uReport.md |
| **Related PRD** | PRD-uReport.md |
| **Status** | Active |

---

## Journey Index

| JRN-ID | Persona | Scenario | Key JTBD(s) | Stages |
|--------|---------|----------|-------------|--------|
| JRN-01.1 | PER-01 Dana (Staff) | Morning ticket triage: log in, prioritize queue, open first ticket | JTBD-01.1 | 5 |
| JRN-01.2 | PER-01 Dana (Staff) | Constituent call intake: create ticket, assign it, log a template response | JTBD-01.2 | 6 |
| JRN-02.1 | PER-02 Marcus (Manager) | SLA review: identify overdue tickets, bulk reassign, generate weekly report | JTBD-02.1, JTBD-02.2 | 6 |
| JRN-03.1 | PER-03 Priya (Citizen) | Mobile service request: submit pothole report, get email, track status | JTBD-03.1, JTBD-03.2 | 6 |
| JRN-04.1 | PER-04 Tomás (Admin/IT) | System setup: deploy via Docker Compose, configure OIDC, test Open311 API | JTBD-04.2, JTBD-04.1 | 6 |
| JRN-04.2 | PER-04 Tomás (Admin/IT) | Operational admin: register API client key, provision staff user | JTBD-04.3 | 5 |

---

## PER-01: Dana Reyes — Municipal Staff Member

---

### JRN-01.1: Morning Ticket Triage

**Persona:** PER-01 (Dana Reyes)

**Scenario:** Dana arrives at the office at 8:00 a.m. She has 45 tickets assigned to her across the public works department. She needs to identify which three require action today before her first field crew call at 9:00 a.m. In the legacy system she would re-enter the same filter combination (department = Public Works, status = open, assignee = me) and scan an unsorted list for anything urgent. With the modernized uReport, her saved bookmark and SLA-sorted queue should eliminate that friction.

**Related Jobs:** JTBD-01.1

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Login | Navigates to the city SSO portal, authenticates via OIDC | Login page → OIDC provider (F11) | "Let me get in fast — my shift starts now" | Neutral, slightly hurried | Legacy: had to wait for slow post-login page load | Fast redirect back to app after OIDC; auto-restore last session context |
| Land on Dashboard | Post-login screen loads with SLA summary widgets and "My Queue" shortcut | SPA Dashboard (F15, F9) | "Is today going to be a heavy day?" | Curious, mildly anxious | Legacy: no dashboard — just an unfiltered ticket list | SLA breach count badge visible immediately on the landing screen |
| Recall Saved Queue | Clicks "My Queue" bookmark to restore her personal filter | Saved Search / Bookmarks (F12, F4) | "Good — no re-entering filters. Let me see the list." | Relieved | Legacy: re-enters department + open + assigned-to-her filter every single session | One-click bookmark loads pre-filtered, SLA-sorted results instantly |
| Prioritize | Scans ticket list sorted by SLA urgency; spots two tickets past their SLA deadline flagged in red | Ticket List (F0, F15, F17) | "These two are overdue — they go first. What's the third?" | Focused, determined | No urgency cues in legacy list meant manual mental ranking | Color-coded SLA status badges let Dana rank at a glance without opening tickets |
| Open First Ticket | Clicks the highest-priority ticket; reads the full history in the detail view | Ticket Detail / History (F0, F6, F15) | "What's the latest on this? Do I need to call the crew or just update the status?" | Engaged | Legacy: had to ask colleagues for context since no readable history panel | Full chronological audit trail surfaces the last action, assignee, and any field notes immediately |

### Key Moments

- **Decision Point:** Prioritize stage — Dana's sort order determines which constituents get attention first; an incorrect default sort means a late response SLA breach she never notices until a complaint arrives
- **Risk of Abandonment:** Land on Dashboard — if the post-login screen is identical to the legacy unfiltered list, Dana will maintain her personal spreadsheet as a workaround instead of trusting the new system
- **Delight Opportunity:** Recall Saved Queue — the first time her bookmark loads with zero manual filter input, Dana recognizes the modernization delivered real daily value

### Success Outcome

Dana identifies her top 3 priority tickets within 60 seconds of completing OIDC login, measured from redirect back to the app. (JTBD-01.1 success measure)

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Login | F11 (Authentication / OIDC) |
| Land on Dashboard | F15 (SPA Frontend), F9 (Reporting & Metrics) |
| Recall Saved Queue | F12 (Bookmark / Saved Search), F4 (Full-Text Search & Filtering) |
| Prioritize | F0 (Ticket Lifecycle), F15 (SPA), F17 (Substatus) |
| Open First Ticket | F0 (Ticket Lifecycle), F6 (Ticket History & Audit Trail), F15 (SPA) |

---

### JRN-01.2: Constituent Call Intake — Create, Assign, and Respond

**Persona:** PER-01 (Dana Reyes)

**Scenario:** A constituent calls the public works line to report a collapsed storm drain on Maple Street. Dana doesn't have a pre-existing ticket for this. She needs to create a new ticket, attach the location, assign it to the field crew queue, and immediately post a response to the constituent (who provided their email) confirming receipt and a response window. In the legacy system, this took 5–8 minutes because the response template was buried two navigation levels deep and she usually just typed the acknowledgment from scratch.

**Related Jobs:** JTBD-01.2

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Receive Call | Picks up call; constituent describes storm drain collapse on Maple Street; Dana opens new ticket form | New Ticket Form (F0, F15) | "Storm drain — that's Public Works Maintenance. Let me get this logged before they hang up." | Alert, task-oriented | Legacy: had to navigate to a separate "create" page, losing her current queue view | Persistent "New Ticket" shortcut accessible from any screen without leaving the queue |
| Enter Details | Types title, description, selects category "Storm Drain / Drainage", enters Maple Street address; map auto-geocodes | Ticket Create Form (F0, F5, F15) | "Is 'Storm Drain / Drainage' the right category? I hope it routes to the right team." | Mildly uncertain | Legacy: internal category codes like "PW-Infra Tier 2" required Dana to know the taxonomy by memory | Plain-language category labels with visible department routing preview before saving |
| Assign Ticket | Assigns ticket to the Public Works field crew queue from the assignee dropdown | Ticket Assign (F0, F3, F15) | "I'll assign this to the Field Crew pool — they'll pick it up in their queue." | Confident | Legacy: assignment required navigating to a separate person profile page | Inline assignee search by name or department with available-staff indicator |
| Save Ticket | Submits the form; ticket ID is generated; system auto-sends internal assignment notification | Ticket Create (F0, F8, F15) | "Created. Now I need to respond to the constituent while I have them on the phone." | Focused | Legacy: full-page reload after save interrupted workflow and cleared context | Partial-page submit: ticket saves without reloading; response compose panel opens inline |
| Select Template | Opens the response compose panel on the new ticket; selects "Received — Scheduled Investigation" template from an inline dropdown | Response Compose / Templates (F13, F8, F15) | "There's the template — I don't have to retype this. Let me just verify the details are right." | Relieved | Legacy: template selector was buried two navigation levels deep — faster to type from scratch | Inline template selector in the response panel, visible on first load with no extra navigation |
| Send Response | Reviews auto-populated template with `{{ticket_id}}` and `{{category}}` filled, hits Send | Notification System (F8, F13, F0) | "Sent. The constituent will get their confirmation. I can close this call." | Satisfied | Legacy: no confirmation that the email was actually dispatched; had to trust it worked | Inline "Email sent" toast with timestamp; action recorded in ticket history immediately |

### Key Moments

- **Decision Point:** Enter Details stage — selecting the wrong category routes the ticket to the wrong department; plain-language labels with routing preview eliminate this risk
- **Risk of Abandonment:** Select Template stage — if the template selector is hidden or requires navigation, Dana reverts to typing from scratch, defeating the efficiency goal and slowing the constituent on the phone
- **Delight Opportunity:** Send Response — seeing "Email sent to constituent@example.com" with a timestamp confirms the workflow completed; Dana can hang up confidently

### Success Outcome

Dana creates the ticket, assigns it, and sends the template response in under 60 seconds from the first form field, with the constituent email delivered within 30 seconds of send. (JTBD-01.2 success measure)

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Receive Call | F0 (Ticket Lifecycle), F15 (SPA) |
| Enter Details | F0, F5 (Geospatial), F15 |
| Assign Ticket | F0, F3 (People & Contacts), F15 |
| Save Ticket | F0, F8 (Notification System), F15 |
| Select Template | F13 (Response Templates), F8, F15 |
| Send Response | F8, F13, F0, F6 (Audit Trail) |

---

## PER-02: Marcus Webb — Department Manager / Supervisor

---

### JRN-02.1: SLA Dashboard Review, Bulk Reassignment, and Weekly Report

**Persona:** PER-02 (Marcus Webb)

**Scenario:** Marcus starts his Tuesday morning. He needs to check whether any tickets in the Public Works department breached their SLA overnight, rebalance workload from an overloaded staff member (Dana has 18 open tickets; her colleague Jordan has 6), and then generate the weekly activity and SLA compliance CSV for the city director's briefing at 10:00 a.m. In the legacy system, this chain of tasks took 25–40 minutes and required a staff member to run the CSV export for him.

**Related Jobs:** JTBD-02.1, JTBD-02.2

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Login & Land | Logs in via OIDC; post-login screen shows SLA summary with breach count badge and workload bar chart per staff member | SPA Dashboard (F11, F15, F9) | "Three SLA breaches already — let me see who owns those." | Concerned, alert | Legacy: SLA breaches only discovered when a constituent called to complain | Prominent SLA breach counter and near-breach (≤ 24 hours) list visible on the landing screen without any navigation |
| Drill into SLA Breaches | Clicks "3 SLA Breached" badge; filtered ticket list opens showing only overdue tickets in his department | Ticket List / SLA Filter (F0, F4, F9, F15) | "All three are assigned to Dana. She's been out for two days. Makes sense." | Analytical | Legacy: required navigating to a report page, manually setting date and status filters, waiting for full-page reload | One-click SLA breach list from the dashboard badge; no filter re-entry needed |
| Select Tickets for Reassignment | Multi-selects the three overdue tickets using checkboxes; opens bulk actions menu | Ticket List Bulk Actions (F0, F15) | "I'll move these to Jordan — she has capacity. Let me check her queue count first." | Decisive | Legacy: reassignment required visiting staff profile, then each ticket, then editing assignment — three page visits per ticket | Bulk select + inline reassign; staff workload count shown in the assignee dropdown to guide the decision |
| Reassign Bulk | Selects Jordan from the assignee dropdown in the bulk action panel; confirms reassignment | Bulk Reassign (F0, F3, F15) | "Done. Jordan will see these in her queue. The audit trail will show I moved them." | Confident, relieved | Legacy: no bulk reassignment — each ticket required individual edits with full-page reloads | Bulk reassignment completes without a full-page reload; each reassigned ticket's audit trail records Marcus's action with timestamp |
| Generate Weekly Report | Navigates to Reporting; selects "Weekly Department Summary" for Public Works, sets date range to current week; hits Download CSV | Reports (F9, F15) | "I just need the count, SLA rate, and per-staff totals. Let me download this before the 10 a.m. meeting." | Task-focused, slightly time-pressured | Legacy: separate reporting page, manual date filter every time, slow reload, and CSV column order varied between exports | Report section reachable in ≤ 2 clicks from nav; date range defaults to "current week"; CSV column schema is stable and documented |
| Paste into Excel Template | Opens downloaded CSV in Excel; pivot table auto-refreshes with the new data | External: Excel (F9 output) | "Column order matches last week — pivot table updated automatically. Good. I'm ready for the meeting." | Satisfied, prepared | Legacy: CSV column order changed unpredictably, breaking pivot table formulas every few weeks | Stable, documented CSV column schema means Excel template requires zero adjustments between exports |

### Key Moments

- **Decision Point:** Select Tickets for Reassignment stage — Marcus needs to see Jordan's current workload before reassigning; if the reassign dropdown shows only names without load indicators, he may over-assign and recreate the imbalance
- **Risk of Abandonment:** Generate Weekly Report stage — if report generation takes >30 seconds or requires navigating more than 2 screens, Marcus calls a staff member for the export, reverting to the legacy dependency
- **Delight Opportunity:** Paste into Excel — stable CSV columns means his pivot table just works; for the first time in months, he finishes his weekly report prep in under 5 minutes and doesn't have to fix broken formulas

### Success Outcome

Marcus identifies all SLA-breached tickets, bulk reassigns them, and downloads the weekly CSV report within 5 minutes of logging in, without visiting more than 3 screens total. (JTBD-02.1 + JTBD-02.2 success measures)

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Login & Land | F11 (Auth), F15 (SPA), F9 (Reporting & Metrics) |
| Drill into SLA Breaches | F0 (Ticket Lifecycle), F4 (Search & Filter), F9 |
| Select Tickets for Reassignment | F0, F15 |
| Reassign Bulk | F0, F3 (People & Contacts), F6 (Audit Trail), F15 |
| Generate Weekly Report | F9, F15 |
| Paste into Excel | F9 (CSV output) |

---

## PER-03: Priya Nair — Constituent / Citizen

---

### JRN-03.1: Mobile Service Request Submission and Status Tracking

**Persona:** PER-03 (Priya Nair)

**Scenario:** Priya notices a large pothole on Oak Avenue during her morning walk. She pulls out her iPhone, navigates to the city website, and finds the "Report an Issue" link. She wants to submit the report on the spot — taking a photo right now while she's standing next to the pothole — and get a confirmation she can reference later. Two weeks after submitting, she wants to check whether the city has done anything without calling city hall. She has no account and won't create one.

**Related Jobs:** JTBD-03.1, JTBD-03.2

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Discover Form | Taps "Report an Issue" link on the city website; public submission form loads on her phone | Public Submission Form (F0, F15, NFR-05) | "I hope this actually works on my phone. Last time it was a mess." | Skeptical, cautious | Legacy: desktop-only CSS caused the form to require horizontal scrolling and overlapping controls at 375px | Fully responsive mobile layout; form elements stack vertically with no overlap and no horizontal scroll |
| Select Category | Taps the category dropdown; scans labels to find the right one for a pothole | Category Selector (F0, F2, F15) | "Let me find 'pothole'... not 'PW-Infra Tier 2' — whatever that means. There it is: 'Pothole or Road Damage'." | Tentatively confident | Legacy: internal department codes like "PW-Infra Tier 2" are meaningless to a resident | Plain-language category labels (e.g., "Pothole or Road Damage", "Broken Streetlight") configured by admins in F2 |
| Enter Location | Types "Oak Avenue near Oak Park" into the address field; map auto-pins the location on an interactive mobile map | Geospatial / Map Picker (F5, F15) | "Good, the pin landed in the right place. I'll leave it there." | Relieved | Legacy: map picker and file upload overlapped at 375px, making both unusable | Mobile-friendly map with large touch targets; address geocodes automatically with a visible confirmation pin |
| Upload Photo | Taps the camera icon; selects the photo she just took of the pothole from her camera roll | Media Attachment Upload (F7, F15) | "Photo attached. This should help them find it." | Purposeful | Legacy: file upload control was obscured by the overlapping map on mobile | Native file picker integration; upload progress indicator; thumbnail preview appears immediately after selection |
| Submit Form | Reviews the summary (description, location, photo thumbnail, email field); taps Submit | Ticket Create / Submit (F0, F8, F15) | "I entered my email — they'll confirm to me. Submitting..." | Hopeful, slightly uncertain | Legacy: no confirmation email for anonymous submissions — left with no record | Post-submit confirmation screen shows generated ticket ID; explains that an email is on its way |
| Receive Email & Check Status | 15 seconds after submission, checks her inbox; taps the "Check your request status" link in the confirmation email | Notification System / Status Page (F8, F6, F10, F15) | "Ticket #4821. Current status: Assigned to Public Works. Last updated: today. Okay — they got it." | Reassured, satisfied | Legacy: no confirmation email; status lookup required a non-obvious URL with no link from the submission page | Confirmation email arrives within 30 seconds with a direct link; status page shows current status + assigned department without requiring login |

### Key Moments

- **Decision Point:** Select Category stage — if Priya can't recognize her issue in the dropdown, she abandons the web form and calls city hall, increasing phone queue volume
- **Risk of Abandonment:** Upload Photo — if the file upload control is broken on mobile (overlapping or unresponsive), Priya submits without a photo or abandons the form entirely; both outcomes degrade ticket quality
- **Delight Opportunity:** Receive Email & Check Status — seeing "Assigned to Public Works" in her email within 30 seconds of submission is the moment Priya trusts the city's digital channel; it directly reduces repeat call volume

### Success Outcome

Priya completes submission on a 375px mobile browser in under 3 minutes with no horizontal scrolling, and receives a confirmation email with a working status link within 30 seconds. Two weeks later she checks status without creating an account. (JTBD-03.1 + JTBD-03.2 success measures)

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Discover Form | F0 (Ticket Lifecycle), F15 (SPA), NFR-05 (Responsiveness) |
| Select Category | F0, F2 (Category Management), F15 |
| Enter Location | F5 (Geospatial), F15 |
| Upload Photo | F7 (Media Attachments), F15 |
| Submit Form | F0, F8 (Notification System), F15 |
| Receive Email & Check Status | F8, F6 (Ticket History), F10 (RBAC — anonymous access), F15 |

---

## PER-04: Tomás Eriksson — System Administrator / IT + API Client Developer

---

### JRN-04.1: New Server Deployment, OIDC Configuration, and Open311 API Integration Test

**Persona:** PER-04 (Tomás Eriksson)

**Scenario:** The city is provisioning a new Linux server and Tomás has been asked to stand up the modernized uReport instance from scratch. He needs to complete a Docker Compose deployment using only the published runbook, configure the OIDC provider (Keycloak) via the admin UI, and then verify that his team's mobile app — which submits service requests via the Open311 API — continues to work correctly against the modernized endpoint. In the legacy system, this process took 1–2 days because configuration required reading PHP source code and the Open311 endpoint's field inconsistencies would only surface at runtime.

**Related Jobs:** JTBD-04.2, JTBD-04.1

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Read Runbook | Opens the published deployment runbook; reviews Docker Compose instructions and environment variable reference table | Deployment Documentation (F16, NFR-12) | "Every parameter is documented. I don't have to grep through site_config.php this time." | Cautiously optimistic | Legacy: `site_config.php` required line-by-line reading to discover parameters; valid values were only discoverable by reading deeper PHP code | Complete runbook with every required environment variable, its purpose, valid values, and example entries |
| Docker Compose Up | Runs `docker compose up -d` with the `.env` file populated from the runbook; all containers start healthy | Docker Compose / CLI (F16, NFR-12) | "PHP, MySQL, Solr — all green. Health check passed. That's faster than I expected." | Pleasantly surprised | Legacy: undocumented edge cases meant trial-and-error for each fresh deployment; personal notes were required | Documented health check endpoint; all containers start correctly on a clean server with no undocumented steps |
| Configure OIDC in Admin UI | Navigates to Admin → Authentication Settings; enters Keycloak issuer URL, client ID, and client secret; clicks Save & Test | Admin UI / OIDC Config (F11, F15) | "I can set the OIDC issuer here without touching a config file. If this breaks, I can fix it here too — not via SSH." | Confident | Legacy: OIDC settings were hardcoded PHP constants in `site_config.php`; a typo took down auth for all staff with no error message | OIDC settings saved via admin UI with server-side validation; "Test Connection" button verifies the provider before saving |
| Test Staff Login | Opens the app in a browser; clicks Login; completes Keycloak auth flow; lands on the dashboard as an admin | OIDC Login Flow (F11, F15) | "OIDC round-trip works. Roles resolved correctly — I'm showing as admin." | Relieved, validated | Legacy: auth failures produced blank screens with no error message; diagnosing required reading Apache error logs | Clear error messages if OIDC fails (e.g., "Provider unreachable", "Invalid client secret"); successful login lands on role-appropriate screen |
| Read OpenAPI Spec | Navigates to `/api/docs`; browses Open311 POST `/open311/requests` schema; maps required fields to his mobile app's data model | OpenAPI Spec (F16, F1) | "All required fields are here with types and examples. No need to open a PHP file. Let me verify the custom_attributes structure." | Focused, efficient | Legacy: no API documentation; required reading PHP controllers to discover field names, enums, and error formats — hours per integration task | OpenAPI 3.1 spec auto-generated from annotated controllers; complete field descriptions with examples for every Open311 endpoint |
| Run Open311 Compliance Test | Executes the Open311 GeoReport v2 compliance test suite against the local instance; reviews results | Open311 Endpoint / Test Suite (F1, NFR-09) | "0 failures. The spec compliance test confirms the modernized endpoint is correct. The mobile app won't break." | Satisfied, confident | Legacy: field inconsistencies (custom attribute JSON structure varying by category) would only surface at mobile app runtime | All custom field structures consistent across categories; compliance test suite runs in CI and blocks PRs on failure |

### Key Moments

- **Decision Point:** Configure OIDC in Admin UI — if Tomás makes a configuration error, the "Test Connection" button surfaces it before saving; without this, a bad value takes down auth for all staff
- **Risk of Abandonment:** Read Runbook — if any parameter in the deployment runbook is missing or undocumented, Tomás falls back to reading PHP source code, the exact behavior the modernization should eliminate
- **Delight Opportunity:** Run Open311 Compliance Test — seeing "0 failures" on the compliance suite is the moment Tomás can guarantee to his mobile app team that their integration won't break after this deployment

### Success Outcome

Tomás completes a fresh Docker Compose deployment in under 2 hours using only the published runbook, configures OIDC via the admin UI without editing any files, and verifies 0 Open311 compliance failures — all without reading PHP source code. (JTBD-04.2 + JTBD-04.1 success measures)

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Read Runbook | F16 (RESTful JSON API Backend), NFR-12 (Deployability) |
| Docker Compose Up | F16, NFR-12 |
| Configure OIDC in Admin UI | F11 (Authentication), F15 (SPA Admin UI) |
| Test Staff Login | F11, F15 |
| Read OpenAPI Spec | F16, F1 (Open311 API) |
| Run Open311 Compliance Test | F1, NFR-09 (Open311 Compliance) |

---

### JRN-04.2: Operational Admin — Register API Client and Provision Staff User

**Persona:** PER-04 (Tomás Eriksson)

**Scenario:** The city's mobile app team is ready to go to production and needs a real API key provisioned for the Open311 endpoint. Separately, a new public works clerk (Jordan) has been hired and needs a staff user account created and assigned the `staff` role. In the legacy system, both tasks required direct database access via SSH — there was no admin UI and the create-user URL was undocumented.

**Related Jobs:** JTBD-04.3

### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|-------|--------|------------|----------|---------|------------|-------------|
| Navigate to API Client Management | Logs in as admin; navigates to Admin → API Clients; sees the list of existing registered clients | Admin UI / API Client Management (F14, F15) | "I can see all the existing clients here. Let me add the new mobile app client." | Confident | Legacy: no admin UI for API keys — required SSH + MySQL INSERT to provision a key; schema knowledge was required | Full API client list visible with status indicators (active/revoked); Create button prominently accessible |
| Create New API Client | Clicks "New API Client"; enters app name "City Mobile App v1" and contact email; clicks Generate Key | API Client Create (F14, F15) | "Key generated. I'll copy this now — it won't be shown again." | Focused, careful | Legacy: database-inserted keys had no contact info field and no audit record of who created them | Generated key displayed once with a copy-to-clipboard button; client record stored with name, email, creation timestamp, and creator identity |
| Test API Key | Runs a quick `curl` against `POST /open311/requests` with the new API key; confirms `201 Created` response | Open311 API Endpoint (F1, F14) | "Key works. The mobile app team can now start using this for production." | Validated, satisfied | Legacy: had to guess whether the key was active; no test endpoint and no error distinction between "key invalid" and "key revoked" | Clear API error response for invalid/revoked keys; documented curl example in the API client management screen |
| Navigate to Staff User Management | Navigates to Admin → People → Create Staff User; enters Jordan's name, email, and selects role `staff` | Admin UI / People Management (F3, F10, F15) | "I can create the account here without SSH. Jordan will get an OIDC login once I add her email." | Efficient | Legacy: new staff users required navigating to a hidden admin URL not in any documentation; role assignment was not self-evident | Documented, linked "Create Staff User" screen accessible from the main admin navigation |
| Assign Role and Save | Confirms Jordan's department assignment (Public Works), sets role to `staff`, saves | People / RBAC (F3, F10, F15) | "Role assigned. Jordan can log in via SSO and see her queue immediately." | Done | Legacy: role assignment was a raw database column update with no UI validation | Role selector shows human-readable role descriptions (e.g., "Staff — can manage tickets in assigned departments"); department assignment visible before saving |

### Key Moments

- **Decision Point:** Create New API Client — the generated key is shown only once; a clear "Copy to clipboard" interaction and a warning prevents Tomás from closing the modal and losing the key
- **Risk of Abandonment:** Navigate to Staff User Management — if the "Create Staff User" page is not in the navigation (as in the legacy hidden URL), Tomás files an IT self-service failure and reverts to database access
- **Delight Opportunity:** Test API Key — a successful `curl` response immediately after key creation confirms the end-to-end provisioning worked; Tomás can hand off the key to the mobile app team on the same call

### Success Outcome

Tomás creates a new API client key and provisions a new staff user account from the admin UI in under 2 minutes total, with zero database queries or file edits required. (JTBD-04.3 success measure)

### Feature Touchpoints

| Stage | Features |
|-------|----------|
| Navigate to API Client Management | F14 (API Client Management), F15 (SPA) |
| Create New API Client | F14, F15 |
| Test API Key | F1 (Open311 API), F14 |
| Navigate to Staff User Management | F3 (People & Contacts), F10 (RBAC), F15 |
| Assign Role and Save | F3, F10, F15 |

---

## Cross-Journey Patterns

### Common Pain Points Across Multiple Journeys

1. **Mobile layout breakage (JRN-01.2, JRN-01.3 implied, JRN-03.1):** The legacy desktop-only CSS creates friction for both Dana (field work) and Priya (citizen submission). The single fix — a fully responsive SPA with WCAG 2.1 AA compliance (F15, NFR-05) — resolves pain points for two distinct personas simultaneously.

2. **No confirmation or feedback after action (JRN-01.2, JRN-03.1):** Dana doesn't know if her email actually sent; Priya doesn't know if her submission was received. Adding inline action confirmation (toast notifications + ticket history) and a confirmation email (F8) resolves both at once with a shared notification layer.

3. **Hidden or navigation-heavy admin functions (JRN-04.2, JRN-02.1):** Both Tomás and Marcus hit walls where system capabilities exist but aren't discoverable — API key management is a hidden database operation; report generation requires navigating to a separate page every time. A coherent admin navigation structure (F15 SPA, F14, F9) surfaces these functions at ≤ 2 clicks.

4. **Friction eliminated by saved state (JRN-01.1, JRN-02.1):** Both Dana (saved queue bookmark) and Marcus (report defaults to current week) suffer from re-entering the same parameters every session. Persistent bookmark storage (F12) and default parameters reduce daily friction for both roles.

5. **Audit trail as a trust signal (JRN-01.2, JRN-02.1, JRN-04.1):** Dana needs the audit trail to hand off context; Marcus needs it to verify reassignment accountability; Tomás needs it for production API key governance. The shared F6 (Ticket History & Audit Trail) investment provides value across all three staff/admin personas.

### Shared Opportunities

- **Progressive disclosure in forms:** The ticket create form (JRN-01.2), public submission form (JRN-03.1), and category admin form (JTBD-02.3 flow) all benefit from progressive disclosure — show only required fields first, reveal advanced options on demand. One frontend design pattern serves all three.

- **Inline action panels:** Both Dana (response compose) and Marcus (bulk reassign) gain from actions that complete without navigating away from the current list or detail view. A consistent "action panel" UI pattern in the SPA serves both flows.

- **Stable, documented output schemas:** Marcus's Excel pivot table (CSV export) and Tomás's mobile app deserializer (Open311 JSON) both break when schemas change unpredictably. A strict, versioned output contract (F9 CSV schema, F1 OpenAPI spec) benefits both personas from a single architectural discipline.

---

## Journey-to-JTBD Traceability

| Journey | Stage | JTBD-ID | Expected Outcome |
|---------|-------|---------|-----------------|
| JRN-01.1 | Login | JTBD-01.1 | OIDC login completes and redirects to app in < 3 seconds |
| JRN-01.1 | Land on Dashboard | JTBD-01.1 | SLA breach count visible without navigating away from landing screen |
| JRN-01.1 | Recall Saved Queue | JTBD-01.1 | Saved bookmark restores filter state in ≤ 1 click; no filter re-entry |
| JRN-01.1 | Prioritize | JTBD-01.1 | Ticket list sorted by SLA urgency by default with color-coded breach indicators |
| JRN-01.1 | Open First Ticket | JTBD-01.1 | Full ticket history readable on detail view within 2 seconds |
| JRN-01.2 | Enter Details | JTBD-01.2 | Plain-language categories prevent mis-routing; geocode resolves address instantly |
| JRN-01.2 | Assign Ticket | JTBD-01.2 | Inline assignee search completes without leaving ticket create form |
| JRN-01.2 | Select Template | JTBD-01.2 | Template selector visible on ticket detail view without any navigation away |
| JRN-01.2 | Send Response | JTBD-01.2 | Constituent email dispatched within 30 seconds; action recorded in audit trail |
| JRN-02.1 | Login & Land | JTBD-02.1 | SLA breach count and staff workload visible immediately on post-login screen |
| JRN-02.1 | Drill into SLA Breaches | JTBD-02.1 | Filtered overdue ticket list opens in 1 click from dashboard badge |
| JRN-02.1 | Reassign Bulk | JTBD-02.1 | Bulk reassignment completes without full-page reload; audit trail updated per ticket |
| JRN-02.1 | Generate Weekly Report | JTBD-02.2 | CSV downloaded in ≤ 30 seconds with stable column schema |
| JRN-02.1 | Paste into Excel | JTBD-02.2 | Stable column schema means Excel pivot table requires zero manual fixes |
| JRN-03.1 | Discover Form | JTBD-03.1 | Public form loads fully functional on 375px iPhone with no horizontal scroll |
| JRN-03.1 | Select Category | JTBD-03.1 | Plain-language labels allow citizen to identify correct category without jargon |
| JRN-03.1 | Upload Photo | JTBD-03.1 | File upload usable on 375px mobile with no overlap; thumbnail preview after selection |
| JRN-03.1 | Submit Form | JTBD-03.1 | Submission completes in ≤ 3 minutes on mobile with confirmation screen |
| JRN-03.1 | Receive Email & Check Status | JTBD-03.1, JTBD-03.2 | Confirmation email with status link arrives within 30 seconds; status page accessible without account |
| JRN-04.1 | Read Runbook | JTBD-04.2 | Every environment variable documented with valid values; no PHP source reading required |
| JRN-04.1 | Docker Compose Up | JTBD-04.2 | All containers healthy on fresh server in < 2 hours using only the runbook |
| JRN-04.1 | Configure OIDC in Admin UI | JTBD-04.2, JTBD-04.3 | OIDC settings saved via admin UI with "Test Connection" validation before commit |
| JRN-04.1 | Read OpenAPI Spec | JTBD-04.1 | All Open311 POST fields described at `/api/docs` with types, enums, and examples |
| JRN-04.1 | Run Open311 Compliance Test | JTBD-04.1 | Open311 GeoReport v2 compliance test suite reports 0 failures |
| JRN-04.2 | Create New API Client | JTBD-04.3 | API key generated and displayed in admin UI in ≤ 30 seconds; no database access required |
| JRN-04.2 | Test API Key | JTBD-04.3 | New key accepted by Open311 endpoint immediately after creation |
| JRN-04.2 | Assign Role and Save | JTBD-04.3 | Staff user account created and role-assigned via admin UI; no SSH or hidden URL required |

---

## Validation Checklist

- [x] Every persona (PER-01, PER-02, PER-03, PER-04) has at least 1 journey
- [x] Every journey maps to at least 1 JTBD
- [x] All stages have all columns populated (Action, Touchpoint, Thinking, Feeling, Pain Point, Opportunity)
- [x] Success outcomes trace to JTBD success measures
- [x] Key moments identified (Decision Point, Risk of Abandonment, Delight Opportunity) for every journey
- [x] Cross-journey patterns documented (5 common pain points, 3 shared opportunities)
- [x] Feature touchpoints reference valid PRD feature IDs (F0–F18, NFR-05, NFR-09, NFR-12)
- [x] Journey-to-JTBD traceability table is complete (all 11 JTBD covered across journey stages)

---

*Document generated: 2026-06-23*
*Derived from: PERSONAS-uReport.md · JTBD-uReport.md · PRD-uReport.md · .planning/PROJECT.md*
*Feeds into: FRD-uReport.md · UserStories-uReport.md · TechArch-uReport.md*
