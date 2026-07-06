# Jobs-to-be-Done Document — uReport CRM Modernization

| Field | Value |
|---|---|
| **Product** | uReport Civic CRM (311 Service Request Management) |
| **Version** | 1.0 |
| **Date** | 2026-07-06 |
| **Related Personas** | PERSONAS-UReport.md |
| **Related PRD** | PRD-UReport.md |
| **Status** | Active |

---

## JTBD Summary Table

| JTBD-ID | Persona | Job Statement (abbreviated) | Priority |
|---|---|---|---|
| JTBD-01.1 | PER-01 Marcus (311 Operator) | Intake a service request during a live call without losing call focus | P0 |
| JTBD-01.2 | PER-01 Marcus (311 Operator) | Locate any case instantly so I can answer a caller's status question | P0 |
| JTBD-01.3 | PER-01 Marcus (311 Operator) | Eliminate repetitive single-record edits on high-volume duplicate reports | P0 |
| JTBD-02.1 | PER-02 Diane (Dept Supervisor) | Know exactly which department cases need my crew's attention today | P0 |
| JTBD-02.2 | PER-02 Diane (Dept Supervisor) | Close a resolved case and attach photographic proof from the field | P0 |
| JTBD-02.3 | PER-02 Diane (Dept Supervisor) | Surface overdue cases so I can reprioritize crew dispatch without manual date math | P1 |
| JTBD-03.1 | PER-03 Jordan (Admin) | Configure the service taxonomy without touching the database | P1 |
| JTBD-03.2 | PER-03 Jordan (Admin) | Onboard a new Open311 client and issue credentials without reading source code | P1 |
| JTBD-03.3 | PER-03 Jordan (Admin) | Answer integration questions from vendors using self-service API documentation | P1 |
| JTBD-04.1 | PER-04 Priya (Citizen) | Report a neighborhood issue from my phone in under 5 minutes without creating an account | P0 |
| JTBD-04.2 | PER-04 Priya (Citizen) | Pin the exact problem location on a map rather than typing an address I don't know | P0 |
| JTBD-04.3 | PER-04 Priya (Citizen) | Receive confirmation that the city has my report so I know it wasn't lost | P0 |

---

## PER-01: Marcus Rivera — 311 Operator / CRM Staff

### JTBD-01.1: Live-Call Case Intake

**Job Statement:**
When a caller is on the line describing a service issue, I want to capture and submit all required case details without triggering a page reload or losing my place in the form, so I can complete the intake in under 90 seconds and keep the caller engaged.

**Current Alternatives:**
- Enters data in a PHP form, hits Save, waits for full-page reload, then must re-navigate back to the record to confirm it was created
- Keeps a paper notepad beside the keyboard to log call details in case the browser loses state during save

**Hiring Criteria:**
- Case creation form submits and confirms without a full-page reload
- All required fields (category, location, reporter, description) are reachable on one screen or within a single scrollable flow
- Success toast or inline confirmation appears within 2 seconds of submitting
- Newly created case is immediately accessible without re-navigating the menu

**Success Measure:** Marcus creates a complete new case in under 90 seconds while maintaining an active phone call, measured from first keystroke to confirmation screen.

**Related Features:** F1, F17, F18
**Priority:** P0

---

### JTBD-01.2: Instant Case Lookup During Caller Status Inquiry

**Job Statement:**
When a caller asks for an update on a previously submitted case, I want to locate that specific case in seconds using a name, address, or ID without manually building a query, so I can give the caller an accurate status and avoid putting them on hold.

**Current Alternatives:**
- Submits a filter form, waits for page reload, refines query and reloads again until the right record surfaces
- Asks the caller to repeat information while manually cross-referencing multiple browser tabs

**Hiring Criteria:**
- Live search with ≤300 ms debounce returns results as I type — no form submission required
- Search covers ticket ID, reporter name, address, and description simultaneously
- Results highlight the matched keyword so I can visually confirm the right record
- Filters can be combined with search (e.g., search within a department or status)

**Success Measure:** Marcus locates any specific case within 30 seconds of starting a search, including applying at least one filter, without a full-page reload.

**Related Features:** F3, F11
**Priority:** P0

---

### JTBD-01.3: Bulk Cleanup of Duplicate Reports

**Job Statement:**
When a high-volume event (severe weather, road closure) generates dozens of duplicate case reports on the same issue, I want to select and close or reassign the entire batch in a single action, so I can eliminate the backlog without spending hours on repetitive single-record edits.

**Current Alternatives:**
- Opens each duplicate case individually, changes status to "Duplicate" substatus, saves, reloads, and moves to the next — 30 seconds per record on 20+ records
- Relies on a supervisor to handle overflow because the volume of clicks is unsustainable during a shift

**Hiring Criteria:**
- Checkbox selection per row plus a Select All action in the case list
- Bulk action toolbar appears when ≥2 records are selected: options include Close (with substatus), Reassign, Change Status
- Entire bulk operation executes in one API call — no per-record page reload
- Confirmation dialog shows count of affected records before committing

**Success Measure:** Marcus bulk-closes or bulk-reassigns 10+ duplicate cases in a single action (one confirmation click), completing the operation in under 60 seconds total.

**Related Features:** F1, F3
**Priority:** P0

---

## PER-02: Diane Kowalski — Department Field Supervisor

### JTBD-02.1: Daily Department Triage

**Job Statement:**
When I start my workday and need to brief my crew on what needs to get done, I want to see all cases currently assigned to my department — and only those cases — without applying filters or searching, so I can immediately identify open work items and assign crew efficiently.

**Current Alternatives:**
- Logs into uReport, navigates to the case list, manually sets department filter, waits for page reload, then scrolls through mixed results that may include closed cases from other departments
- Relies on Marcus to email her a daily summary because the system view is too noisy to use efficiently

**Hiring Criteria:**
- A pre-filtered "My Department" view is available within 2 taps/clicks of login — no additional filter setup required
- View defaults to open cases only, with a clear toggle to include closed
- Case rows show category, date submitted, and current status at a glance without opening each record
- View persists between sessions so she doesn't re-filter every time

**Success Measure:** Diane reaches her department's full open case list within 2 clicks of logging in, with no additional filter configuration needed, in under 30 seconds.

**Related Features:** F3, F5
**Priority:** P0

---

### JTBD-02.2: Field Resolution Closure with Photo Evidence

**Job Statement:**
When my crew finishes a repair job on-site, I want to close the case, log what was done, and attach a photo of the completed work — all from my phone's browser while still at the job site — so I can keep the record accurate without driving back to the office to use a desktop.

**Current Alternatives:**
- Takes photos on her phone, returns to the office, transfers photos to desktop, then opens uReport on a desktop browser to attach them and log closure — adding 1–2 hours of delay per resolution
- Sometimes delays closure until end of day batch, which inflates open case metrics and delays reporter notifications

**Hiring Criteria:**
- Case detail and action log form are fully usable on a 375 px mobile viewport — no horizontal scroll, no tiny touch targets
- Photo upload accepts files directly from the mobile camera roll or live camera
- Closure action (status transition + response note + photo attach) completes in a single form submission without page reload
- Reporter receives an email notification on closure without Diane needing to configure it per-case

**Success Measure:** Diane closes a case and attaches a resolution photo from a mobile browser in under 3 minutes, while standing at the field site, with zero need to return to a desktop.

**Related Features:** F1, F4, F9, F10, F19
**Priority:** P0

---

### JTBD-02.3: Overdue Case Escalation

**Job Statement:**
When I review my department's workload mid-week, I want overdue cases to be visually distinguished from on-track cases without manually calculating elapsed days, so I can escalate or reprioritize crew assignments before a case breaches its service level.

**Current Alternatives:**
- Exports the case list to a spreadsheet and applies a formula to calculate days elapsed since submission, then manually identifies overdue rows
- Relies on complaints from 311 operators or constituent follow-ups to learn a case has gone overdue

**Hiring Criteria:**
- Overdue cases display a visual indicator (badge, row highlight, or icon) in the case list without any manual date math
- "Overdue" threshold is defined by a configurable system setting (e.g., open > N days)
- Overdue count surfaces on the dashboard stat card so it is visible before opening the case list
- Clicking the overdue indicator or stat card opens a pre-filtered case list showing only overdue cases

**Success Measure:** Diane identifies all overdue department cases within 60 seconds of opening the dashboard, without performing any manual calculations or exporting data.

**Related Features:** F5, F3
**Priority:** P1

---

## PER-03: Jordan Calloway — City IT System Administrator

### JTBD-03.1: Service Taxonomy Configuration

**Job Statement:**
When the city launches a new service category (e.g., "E-Scooter Obstruction") or reorganizes its department structure, I want to create, configure, and activate the new category — including group assignment, department ownership, and response templates — entirely through the admin UI without writing SQL or touching the database directly, so I can complete the change accurately in under 10 minutes.

**Current Alternatives:**
- Writes SQL INSERT statements against the production database, verifies the change by querying the table directly, and manually checks that the UI reflects the update — with no safety net if a foreign key is wrong
- Asks a developer to make the change, introducing a scheduling dependency and days of delay

**Hiring Criteria:**
- Category, category group, department assignment, and response template fields are all editable from connected admin panels without any SQL access
- Inline editing with a toast notification confirms save success
- Confirmation dialog appears before any destructive operation (delete category, remove department link)
- A newly created category appears in the public submission form and case creation form immediately after save

**Success Measure:** Jordan creates a fully configured new service category (group, department, response templates) in under 10 minutes without consulting documentation or writing any SQL.

**Related Features:** F7, F8, F13
**Priority:** P1

---

### JTBD-03.2: Open311 Client Onboarding and API Key Issuance

**Job Statement:**
When a new mobile app vendor or 311 aggregator requests API access, I want to register their client record and generate an API key through the admin panel, so I can deliver working credentials to the vendor in under 5 minutes without involving a developer.

**Current Alternatives:**
- Manually inserts a client record into the `clients` database table and generates a UUID key via SQL — requiring database access and knowledge of the table schema
- Shares the key via an insecure method (email body) because there is no structured delivery workflow

**Hiring Criteria:**
- Admin panel lists all registered Open311 clients with name, contact, and API key status
- "New Client" form captures name, URL, contact person, and contact method, then generates a UUID API key on save
- Generated key is displayed once in a copyable field on the confirmation screen
- API key is immediately active for POST /requests authentication without a service restart

**Success Measure:** Jordan registers a new Open311 client and delivers a valid API key to the vendor in under 5 minutes, entirely through the admin UI with no database access.

**Related Features:** F14, F0
**Priority:** P1

---

### JTBD-03.3: Vendor Integration Support via API Documentation

**Job Statement:**
When a third-party integrator asks how to authenticate, which fields are required for POST /requests, or what error codes the API returns, I want to point them to a self-service Swagger UI where all endpoints are documented with examples, so I can answer integration questions in minutes without reading PHP source code.

**Current Alternatives:**
- Opens the legacy `Open311Controller.php` file and reads the raw PHP to extract parameter names, types, and validation logic — often spending 30–60 minutes per vendor question
- Maintains an informal Word document of API notes that is perpetually out of date

**Hiring Criteria:**
- Swagger UI accessible at `/swagger-ui.html` without authentication
- All Open311 endpoints (GET /services, GET /requests, POST /requests, GET /requests/:id) documented with GeoReport v2 field descriptions and example request/response bodies
- JWT/API key authentication requirements explicitly documented per endpoint
- OpenAPI spec exportable as JSON/YAML for client code generation

**Success Measure:** Jordan answers any vendor API question using only the Swagger UI in under 5 minutes, without consulting the PHP source code or any external documentation.

**Related Features:** F20, F0
**Priority:** P1

---

## PER-04: Priya Nair — Constituent / Citizen Reporter

### JTBD-04.1: Frictionless Anonymous Service Request Submission

**Job Statement:**
When I notice a problem in my neighborhood (pothole, broken streetlight, graffiti), I want to submit a service request from my phone without creating an account or navigating a confusing multi-field form, so I can complete the report in under 5 minutes and get back to my day.

**Current Alternatives:**
- Abandons the current web form after encountering horizontal scroll and tiny touch targets on her phone
- Calls the 311 hotline instead, waiting on hold to speak with an operator
- Gives up and accepts the problem will go unreported

**Hiring Criteria:**
- Form is fully usable on a 375 px mobile viewport with no horizontal scroll and touch targets ≥44 px
- Anonymous submission requires no account creation — contact info is optional, not gated
- Multi-step wizard breaks the form into digestible steps (contact → category → location → description/photos → review) with clear progress indication
- Each step is reachable forward and backward without losing previously entered data
- Total time from landing on the form to confirmation is under 5 minutes on a mobile connection

**Success Measure:** Priya completes a full anonymous service request submission on a 375 px mobile viewport in under 5 minutes without encountering any errors or forced account creation.

**Related Features:** F2, F17, F19
**Priority:** P0

---

### JTBD-04.2: Map-Based Location Identification

**Job Statement:**
When I'm standing near the problem location and need to specify where it is, I want to drop a pin on an interactive map rather than type a precise street address I don't know by heart, so I can identify the exact location accurately without leaving the submission form.

**Current Alternatives:**
- Types an approximate address from memory, which is often imprecise or wrong (especially for mid-block issues with no visible street number)
- Abandons the location field or enters a nearby landmark name, which the system doesn't accept as a valid address

**Hiring Criteria:**
- Submission form includes an interactive map (Mapbox GL JS or Leaflet) with a draggable pin
- Pin placement automatically reverse-geocodes to a human-readable address shown in a read-only field for confirmation
- Address text input and map pin are synchronized — typing an address moves the pin; moving the pin updates the address
- Map renders and is interactive on mobile within 3 seconds on a mobile connection

**Success Measure:** Priya accurately places a map pin within 10 meters of the actual problem location without typing a street address, completing the location step in under 60 seconds.

**Related Features:** F2, F16
**Priority:** P0

---

### JTBD-04.3: Submission Confirmation and Case Reference

**Job Statement:**
When I finish submitting a service request, I want to receive an unambiguous confirmation with a unique case reference number and optionally an email acknowledgment, so I can verify my report was accepted and follow up with the city if needed.

**Current Alternatives:**
- The current system provides no meaningful confirmation screen — she cannot tell if the submission succeeded or silently failed
- Takes a screenshot of a blank page as her only "proof" of submission
- Calls the 311 line to confirm her report was received, adding work for both her and the call center

**Hiring Criteria:**
- A dedicated confirmation screen appears immediately after successful submission showing the generated case ID in a prominent, readable format
- Confirmation screen includes a clear success message and the category/description of what was submitted
- If she provided an email address, an acknowledgment email with the case ID is sent within 2 minutes
- Confirmation screen is printable / screenshot-friendly (no authentication wall, no auto-redirect)

**Success Measure:** Priya receives a confirmation screen with a unique case ID within 3 seconds of submitting her report, and receives an acknowledgment email within 2 minutes if she provided her email address.

**Related Features:** F2, F9
**Priority:** P0

---

## Outcome-to-Feature Traceability

| JTBD-ID | Related Feature(s) | Expected Outcome |
|---|---|---|
| JTBD-01.1 | F1, F17, F18 | Case creation completes in ≤90 s with no page reload; new case immediately accessible |
| JTBD-01.2 | F3, F11 | Any case located in ≤30 s via live search with keyword highlighting; no full-page reload |
| JTBD-01.3 | F1, F3 | 10+ cases bulk-closed/reassigned in single action in ≤60 s total |
| JTBD-02.1 | F3, F5 | Department case list reachable in ≤2 clicks; pre-filtered, no extra setup |
| JTBD-02.2 | F1, F4, F9, F10, F19 | Case closed with photo from 375 px mobile viewport in ≤3 min; reporter notified |
| JTBD-02.3 | F5, F3 | Overdue cases visually flagged; all overdue items identified in ≤60 s from dashboard |
| JTBD-03.1 | F7, F8, F13 | New category fully configured in ≤10 min via admin UI; no SQL access required |
| JTBD-03.2 | F14, F0 | Open311 client registered and API key delivered in ≤5 min via admin UI |
| JTBD-03.3 | F20, F0 | Any vendor API question answered via Swagger UI in ≤5 min; no source code needed |
| JTBD-04.1 | F2, F17, F19 | Anonymous submission completed on 375 px viewport in ≤5 min with no account required |
| JTBD-04.2 | F2, F16 | Map pin placed within 10 m of actual location in ≤60 s; no street address required |
| JTBD-04.3 | F2, F9 | Confirmation screen with case ID appears ≤3 s post-submit; email sent ≤2 min |

---

## NaC Preview

> Natural Acceptance Criteria candidates to be refined in STORY-MAP. Each is expressed as a testable condition derived from the job's success measure.

| JTBD-ID | Outcome (from Success Measure) | Candidate Natural Acceptance Criterion |
|---|---|---|
| JTBD-01.1 | Case created in ≤90 s without page reload | **Given** a logged-in operator fills all required fields, **when** they submit the new case form, **then** a success toast appears within 2 s and the new case is navigable without a full-page reload |
| JTBD-01.2 | Any case located in ≤30 s via live search | **Given** the operator types 3+ characters into the search bar, **when** 300 ms have elapsed, **then** matching results with highlighted keywords appear without a form submission |
| JTBD-01.3 | 10+ cases bulk-actioned in ≤60 s | **Given** ≥10 cases are selected via checkbox, **when** the operator chooses Bulk Close with a substatus, **then** a confirmation dialog shows the count and a single confirm click closes all selected cases |
| JTBD-02.1 | Dept case list reached in ≤2 clicks | **Given** Diane logs in, **when** she navigates to her department view, **then** the case list is filtered to her department's open cases with no additional filter action required |
| JTBD-02.2 | Case closed with photo on mobile in ≤3 min | **Given** Diane opens a case on a 375 px mobile browser, **when** she attaches a photo from camera roll, logs a resolution note, and submits, **then** the case status changes to Closed and the reporter receives an email notification |
| JTBD-02.3 | All overdue cases visible in ≤60 s | **Given** cases exist that exceed the configured overdue threshold, **when** Diane views the dashboard, **then** overdue cases display a visual badge and the overdue stat card count links to a pre-filtered case list |
| JTBD-03.1 | New category created in ≤10 min via UI | **Given** Jordan fills the new category form (group, dept, templates), **when** he saves, **then** a success toast confirms the save, and the category appears in the public form and case creation dropdowns immediately |
| JTBD-03.2 | API key issued in ≤5 min via admin UI | **Given** Jordan completes the new client form, **when** he saves, **then** a UUID API key is displayed in a copyable field and is immediately valid for POST /requests authentication |
| JTBD-03.3 | Vendor question answered via Swagger in ≤5 min | **Given** a developer opens `/swagger-ui.html`, **when** they navigate to any Open311 endpoint, **then** all parameters, response schemas, and authentication requirements are documented with examples |
| JTBD-04.1 | Anonymous submission on 375 px in ≤5 min | **Given** Priya opens the public form on a 375 px viewport with no account, **when** she completes all steps and submits, **then** she reaches the confirmation screen without encountering an account creation gate |
| JTBD-04.2 | Map pin placed in ≤60 s without address typing | **Given** the location step shows an interactive map, **when** Priya taps the map to place a pin, **then** the address field auto-populates from reverse geocoding and no manual text entry is required |
| JTBD-04.3 | Case ID on confirmation in ≤3 s | **Given** Priya submits the public form, **when** the submission succeeds, **then** a confirmation screen displays a unique case ID within 3 s, and if she provided an email, an acknowledgment email arrives within 2 min |

---

*JTBD-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
