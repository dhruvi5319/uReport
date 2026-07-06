---

### PER-03: Jordan Calloway — City IT System Administrator

#### JRN-03.1: New Service Category Configuration

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-03.1) | Release |
|---|---|---|---|---|
| SM-18.05 | Navigate | US-18.1: Admin Sidebar Navigation | **Given** Jordan logs in as admin, **when** he opens the Admin sidebar, **then** Category Groups are accessible in one click with breadcrumb confirming his location | R2 |
| SM-8.01 | Create Group | US-8.1: Create Category Group | **Given** Jordan opens the category groups panel, **when** "Transportation" already exists, **then** child categories are visible inline — no separate tab required; "Add Category" is accessible in context | R2 |
| SM-8.02 | Configure Category | US-8.2: Create & Configure Category | **Given** Jordan fills the New Category form (name, group, department), **when** he saves, **then** inline validation confirms department exists; a toast "Category saved" appears; save is blocked if required fields are empty | R2 |
| SM-7.01 | Configure Category | US-7.1: Create/Edit Departments | **Given** Jordan needs to assign a category to "Mobility" department, **when** he searches the department dropdown, **then** the department appears immediately if it exists, or he can navigate to create it first | R2 |
| SM-8.03 | Add Templates | US-8.2: Response Templates Sub-Panel | **Given** Jordan is in the category edit sheet, **when** he adds response templates in the sub-panel, **then** templates are created in-context without navigating to a separate panel | R2 |
| SM-13.01 | Add Templates | US-13.3: Manage Response Templates | **Given** Jordan needs global response templates, **when** he navigates to the templates admin panel, **then** he can create, edit, and delete templates with inline toast notifications on each save | R2 |
| SM-2.01 | Verify | US-2.1: Public Submission Form | **Given** Jordan saves a new category, **when** he opens the public submission form in a separate tab, **then** the new category appears in the category dropdown immediately — no cache flush or restart required | R1 |
| SM-8.04 | Confirm Security | US-8.3: Delete Category Safety Check | **Given** Jordan views the delete button for a category, **when** he clicks it, **then** a confirmation dialog appears before any destructive operation executes — no silent deletions possible | R2 |
| SM-17.03 | Confirm Security | US-17.1: Design System — Dialog Pattern | **Given** any destructive admin operation is initiated, **when** the confirmation dialog renders, **then** it uses the consistent shadcn/ui Dialog pattern with equal prominence Cancel and Confirm buttons | R1 |

---

#### JRN-03.2: Open311 API Client Onboarding

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-03.2) | Release |
|---|---|---|---|---|
| SM-18.06 | Navigate | US-18.1: Admin Sidebar — API Clients | **Given** Jordan opens the Admin sidebar, **when** he clicks "API Clients", **then** the client list panel loads directly — no database access or command-line required | R2 |
| SM-14.01 | Create Client | US-14.1: Register New Open311 Client | **Given** Jordan fills the New Client form (name, contact, email), **when** he saves, **then** a UUID API key is auto-generated; the form requires no manual UUID creation | R2 |
| SM-14.02 | Save & Retrieve Key | US-14.1: API Key Copyable Display | **Given** Jordan saves a new client, **when** the confirmation screen renders, **then** the generated UUID key is displayed once in a copyable field, labeled "shown only once" | R2 |
| SM-0.01 | Verify Activation | US-0.3: Submit via Open311 API | **Given** Jordan copies the key and tests with curl POST /open311/v2/requests, **when** the request is made, **then** a valid 201 Created response is returned — key is active immediately; no restart required | R1 |
| SM-20.01 | Deliver | US-20.1: Swagger UI for Endpoints | **Given** Jordan wants to share API docs with a vendor, **when** he opens `/swagger-ui.html`, **then** all Open311 endpoints are documented with GeoReport v2 field descriptions and authentication requirements | R2 |
| SM-20.02 | Deliver | US-20.2: Test API from Swagger UI | **Given** Jordan or a vendor opens Swagger UI, **when** they enter a Bearer token and execute an Open311 call, **then** the request/response schemas match the actual API behavior | R2 |
| SM-14.03 | Deliver | US-14.2: Edit & Delete Client Record | **Given** a vendor's API access is revoked, **when** Jordan deletes their client record, **then** a confirmation dialog appears and subsequent requests with that key return HTTP 403 | R2 |

---

### PER-03 (Admin): Supporting Configuration Journeys

> These stories support Jordan's admin journeys but are not tied to a single JRN-03.x scenario. They are placed at the admin configuration layer.

| SM-ID | Admin Panel | Story | NaC (derived from JTBD-03.1 / JTBD-03.2) | Release |
|---|---|---|---|---|
| SM-6.01 | People Mgmt | US-6.1: List & Search People | **Given** Jordan needs to assign a default person to a department, **when** he searches the people panel, **then** results filter by name/email/username with 300 ms debounce | R2 |
| SM-6.02 | People Mgmt | US-6.2: Create Staff Person | **Given** a new staff hire starts, **when** Jordan creates their person record (name, role, department, username), **then** the new person appears in assignee selectors immediately after save | R2 |
| SM-6.03 | People Mgmt | US-6.3: Edit Person & Contacts | **Given** a staff member changes their notification email, **when** Jordan edits the person record, **then** the updated `usedForNotifications` email takes effect for future case notifications | R2 |
| SM-6.04 | People Mgmt | US-6.4: Delete Person Safety Check | **Given** Jordan attempts to delete a person referenced in tickets, **when** the delete is confirmed, **then** the system blocks the action with "Cannot delete: associated with N tickets" | R2 |
| SM-7.02 | Dept Mgmt | US-7.2: Delete Department Safety Check | **Given** Jordan attempts to delete a department with associated categories, **when** he confirms the dialog, **then** the delete is blocked with "Cannot delete: has associated categories" | R2 |
| SM-13.02 | Admin Panels | US-13.1: Manage Substatus Values | **Given** Jordan creates a new substatus "Escalated", **when** saved, **then** the new substatus appears in the Close Ticket dialog dropdown immediately | R2 |
| SM-13.03 | Admin Panels | US-13.2: Manage Issue Types | **Given** Jordan creates a new issue type, **when** saved, **then** it appears in the issue type dropdown on the New Case form and Case Detail inline edit | R2 |
| SM-13.04 | Admin Panels | US-13.4: Manage Contact Methods | **Given** Jordan adds a contact method "Mobile App", **when** saved, **then** it appears in the contact method selector on ticket forms | R2 |
| SM-21.01 | Infra | US-21.1: Flyway Schema Migration | **Given** a clean PostgreSQL instance is started, **when** `flyway migrate` runs, **then** all 18 tables are created with constraints, indexes, and sequences — zero manual SQL required | R1 |
| SM-21.02 | Infra | US-21.2: Data Migration Validation | **Given** the MySQL data is exported, **when** the migration script runs, **then** row counts match for all 18 tables and 0 foreign key violations exist in PostgreSQL | R1 |

---

### PER-04: Priya Nair — Constituent / Citizen Reporter

#### JRN-04.1: Mobile Service Request Submission

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-04.1 / JTBD-04.2 / JTBD-04.3) | Release |
|---|---|---|---|---|
| SM-19.03 | Discover | US-19.3: Mobile Responsive Layout | **Given** Priya opens the 311 portal on a 375 px phone, **when** the page loads, **then** the public form renders with no horizontal scroll, a progress indicator, and correct touch targets | R1 |
| SM-2.02 | Discover | US-2.1: Multi-Step Wizard | **Given** Priya lands on the submission form, **when** Step 1 loads, **then** a "Step 1 of 5" progress indicator sets expectations; animated transitions complete in ≤ 300 ms | R1 |
| SM-17.04 | Discover | US-17.3: Framer Motion Animations | **Given** Priya advances through wizard steps, **when** transitions play, **then** each step change animates in ≤ 300 ms; animation is disabled when `prefers-reduced-motion` is set | R1 |
| SM-2.03 | Contact | US-2.1: Anonymous Submission | **Given** Step 1 presents the contact info fields, **when** Priya skips all contact fields, **then** she can advance to Step 2 without account creation — zero friction login gate | R1 |
| SM-2.04 | Category | US-2.1: Category Selection Step | **Given** Step 2 shows category groups, **when** Priya taps "Roads & Sidewalks", **then** subcategories appear with large touch targets; "Pothole" is selectable in one tap | R1 |
| SM-2.05 | Location | US-2.2: Map Pin Drop | **Given** Step 3 shows an interactive map, **when** Priya taps near Cedar & 7th, **then** a draggable pin is placed and the address field auto-populates from reverse-geocoding — no typing required | R1 |
| SM-16.01 | Location | US-16.1: Geo-Clustering Map | **Given** the map is rendered, **when** Priya views the map step, **then** the map renders using Mapbox GL JS (or Leaflet fallback) and is interactive within 3 s on a mobile connection | R3 |
| SM-2.06 | Description & Photos | US-2.3: Photo Upload from Camera | **Given** Step 4 shows the description and photos section, **when** Priya taps "Add Photo", **then** the native file picker opens her camera roll; selected photos show thumbnail previews | R1 |
| SM-2.07 | Description & Photos | US-2.1: Description Textarea | **Given** Step 4 renders on mobile, **when** Priya types a description, **then** the textarea auto-expands and the virtual keyboard does not obscure the Submit button | R1 |
| SM-2.08 | Review & Submit | US-2.4: Confirmation Screen | **Given** Priya reviews her submission and taps Submit, **when** the API call succeeds, **then** a confirmation screen displays "Case #id" prominently within 3 s — no auth wall, screenshot-friendly | R1 |
| SM-9.04 | Review & Submit | US-9.2: Email Confirmation | **Given** Priya provided her email on Step 1, **when** the case is created, **then** an acknowledgment email containing the case ID is delivered within 2 minutes | R1 |
| SM-19.04 | Review & Submit | US-19.2: Screen Reader Announcements | **Given** Priya submits the form using a screen reader, **when** the confirmation screen renders, **then** an ARIA live region announces "Your report has been submitted. Case number: #id" | R1 |

---

### Cross-Cutting Stories (Platform Foundation)

> These stories enable all journeys but are not tied to a single journey stage.

| SM-ID | Category | Story | NaC | Release |
|---|---|---|---|---|
| SM-12.04 | Auth | US-12.3: Session Expiry & Refresh | **Given** any staff session is active, **when** it approaches expiry, **then** the JWT is silently refreshed; a 401 response redirects to login with `returnTo` preserved | R1 |
| SM-12.05 | Auth | US-12.4: Sign Out | **Given** Marcus leaves his workstation, **when** he clicks "Sign Out", **then** the session is terminated (cookie cleared) and CAS single sign-out is triggered | R1 |
| SM-12.06 | Auth | US-12.5: Profile & Notification Email | **Given** Marcus's notification email changes, **when** he updates it on `/account`, **then** future case notification emails go to the new address | R1 |
| SM-18.07 | Nav | US-18.3: Skip Links & Keyboard Nav | **Given** a screen reader or keyboard-only user loads any screen, **when** they press Tab, **then** a "Skip to main content" link is the first focusable element | R1 |
| SM-19.05 | A11y | US-19.1: Keyboard-Only Access | **Given** any interactive element is present, **when** a keyboard-only user operates it, **then** all modals, dropdowns, and forms are operable via Tab/Enter/Space/Escape | R1 |
| SM-19.06 | A11y | US-19.2: Screen Reader Compatibility | **Given** any dynamic content update occurs (toast, skeleton→content), **when** a screen reader user is present, **then** ARIA live regions announce the update appropriately | R1 |
| SM-19.07 | A11y | US-19.4: Color Contrast | **Given** any screen renders in light or dark mode, **when** axe-core scans run, **then** 0 critical contrast violations are reported (≥ 4.5:1 normal text, ≥ 3:1 large text) | R1 |
| SM-0.02 | API | US-0.1: List Available Services | **Given** an external mobile app calls GET /open311/v2/services, **when** the response is returned, **then** it is byte-level compatible with the PHP implementation including all GeoReport v2 fields | R1 |
| SM-0.03 | API | US-0.2: Retrieve Requests with Filters | **Given** a 311 aggregator calls GET /open311/v2/requests with filters, **when** the response is returned, **then** all GeoReport v2 fields are present and pagination matches PHP behavior | R1 |
| SM-0.04 | API | US-0.4: Retrieve Single Request by ID | **Given** a mobile app calls GET /open311/v2/requests/{id}, **when** the response is returned, **then** the schema matches the list endpoint and non-existent IDs return HTTP 404 | R1 |
| SM-11.04 | Infra | US-11.4: Search Vector DB Trigger | **Given** a ticket is created or updated, **when** the database trigger fires, **then** `search_vector` is updated automatically — no manual re-indexing is ever required | R1 |
| SM-5.06 | Dashboard | US-5.2: Recent Cases Feed | **Given** Marcus opens the dashboard, **when** the feed loads, **then** the 10 most recent cases appear with status badges, category, reporter, and time-since labels within ≤ 2 s | R2 |
| SM-5.07 | Dashboard | US-5.3: Map Widget on Dashboard | **Given** Marcus opens the dashboard, **when** the map widget loads, **then** open case pins are shown with geo-clustering; map loads in ≤ 2 s with Mapbox or Leaflet fallback | R2 |
| SM-10.03 | Media | US-10.1: Attach Photos at Ticket Creation | **Given** Marcus creates a new ticket with photos, **when** the form is submitted, **then** up to 10 files are bundled in the multipart request and stored with a media record per file | R2 |
| SM-10.04 | Media | US-10.4: Delete Photo with Confirmation | **Given** an incorrect photo is attached, **when** a staff member clicks the delete icon, **then** a confirmation dialog prevents accidental deletion before `DELETE /api/tickets/{id}/media/{mediaId}` executes | R2 |
| SM-15.01 | Reports | US-15.1: Case Volume Over Time | **Given** Jordan opens the Metrics screen, **when** the chart loads, **then** daily/weekly/monthly case volume data matches PHP implementation calculations | R3 |
| SM-15.02 | Reports | US-15.2: Resolution Time Reports | **Given** Jordan opens the Reports screen, **when** breakdowns render, **then** average resolution time by category and department is filterable by date range and exportable to CSV | R3 |
| SM-16.02 | Maps | US-16.2: Single Ticket Pin on Case Detail | **Given** a case has lat/lon coordinates, **when** the case detail loads, **then** a single map pin shows the ticket location; "Location not set" placeholder renders if coordinates are null | R3 |

---
