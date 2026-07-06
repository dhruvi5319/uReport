# Story Map — uReport CRM Modernization

| Field | Value |
|---|---|
| **Product** | uReport Civic CRM (311 Service Request Management) |
| **Version** | 1.0 |
| **Date** | 2026-07-06 |
| **Related Personas** | PERSONAS-UReport.md |
| **Related Journeys** | JOURNEYS-UReport.md |
| **Related JTBD** | JTBD-UReport.md |
| **Related UserStories** | UserStories-UReport.md |
| **Related PRD** | PRD-UReport.md |
| **Status** | Active |

---

## Overview

This Story Map organizes all 74 user stories (US-X.Y) across two dimensions:

- **X-axis (columns):** Journey stages drawn from JOURNEYS-UReport.md — the chronological steps each persona takes to accomplish their primary job.
- **Y-axis (rows):** Stories within each stage, grouped by persona and epic.

Each story is annotated with:

1. **SM-ID** — Story Map entry identifier (`SM-{Epic}.{NN}`)
2. **NaC** — Natural Acceptance Criterion derived from the JTBD outcome that applies at that journey stage. NaC are NOT invented; each is derived from the intersection of a JTBD outcome (the "what matters") + journey stage (the "when/where") + user story (the "what is built").
3. **Release** — Increment assignment (R1/R2/R3) based on journey completeness and PRD priority.

### NaC Derivation Pattern

```
JTBD outcome (success measure)
  × Journey stage (contextual moment)
  → Testable NaC statement
  → Cross-checked against UserStory acceptance criteria
```

### Release Themes

| Release | Theme | Priority Basis | Journey Goal |
|---|---|---|---|
| R1 | Core Operator & Public Workflows | All P0 stories | Complete JRN-01.1, JRN-01.2, JRN-04.1 end-to-end |
| R2 | Field Supervision & Admin Foundation | P0 remainder + P1 stories | Complete JRN-02.x, JRN-03.x |
| R3 | Insights & Enhanced Maps | P2 stories | Complete reporting and geo-clustering journeys |

### Journey Stages Reference

| Journey | Stages (in order) |
|---|---|
| JRN-01.1 (Marcus — Case Intake) | Receive → Enter Details → Assign → Submit → Confirm |
| JRN-01.2 (Marcus — Status Inquiry) | Trigger → Search → Refine → Identify → Respond |
| JRN-01.3 (Marcus — Bulk Cleanup) | Identify Cluster → Select Batch → Choose Action → Confirm → Verify |
| JRN-02.1 (Diane — Morning Triage) | Login → Orient → View Cases → Prioritize → Plan |
| JRN-02.2 (Diane — Field Closure) | Access → Find Case → Review → Log Resolution → Attach Photos → Submit |
| JRN-02.3 (Diane — Overdue Escalation) | Check Dashboard → Surface Overdue → Review Overdue List → Investigate → Escalate |
| JRN-03.1 (Jordan — Category Config) | Navigate → Create Group → Configure Category → Add Templates → Verify → Confirm Security |
| JRN-03.2 (Jordan — API Onboarding) | Navigate → Create Client → Save & Retrieve Key → Verify Activation → Deliver |
| JRN-04.1 (Priya — Mobile Submission) | Discover → Contact → Category → Location → Description & Photos → Review & Submit |

---
## Story Map Matrix

> **Legend:** SM-ID = Story Map entry | NaC = Natural Acceptance Criterion (derived from JTBD) | R = Release

---

### PER-01: Marcus Rivera — 311 Operator

#### JRN-01.1: Live-Call Case Intake

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-01.1) | Release |
|---|---|---|---|---|
| SM-18.01 | Receive | US-18.1: Persistent Navbar & Sidebar | **Given** Marcus is on a live call, **when** he clicks "New Case" in the persistent navbar, **then** the `/cases/new` route loads client-side with zero full-page reload | R1 |
| SM-17.01 | Receive | US-17.1: Consistent Design System | **Given** any authenticated screen loads, **when** Marcus navigates, **then** the UI uses consistent shadcn/ui components and 4 px grid — no relearning across screens | R1 |
| SM-18.02 | Receive | US-17.2: Dark Mode Toggle | **Given** Marcus works in a dim call center, **when** he toggles dark mode, **then** the preference is saved and all screens render contrast-compliant in dark mode | R1 |
| SM-1.01 | Enter Details | US-1.1: Create a New Ticket | **Given** Marcus fills all required fields in a single-scroll form, **when** he submits, **then** a success toast appears within 2 s and the new case ID is visible without a full-page reload | R1 |
| SM-9.01 | Enter Details | US-9.1: Automatic System Action | **Given** Marcus submits a new ticket, **when** the ticket is created, **then** an "open" history entry is auto-created — Marcus never has to log the creation manually | R1 |
| SM-1.02 | Assign | US-1.4: Assign a Ticket | **Given** Marcus selects a department from the dropdown, **when** he saves the assignment, **then** the assignee receives an email notification and a history entry is created without page reload | R1 |
| SM-9.02 | Assign | US-9.2: Send Email Notification | **Given** Marcus checks "Notify Assignee" on ticket creation, **when** the ticket is saved, **then** an email is sent to the assignee within the same request cycle | R1 |
| SM-1.03 | Submit | US-1.2: Close a Ticket | **Given** Marcus submits the new case form, **when** the API call succeeds, **then** a toast "Case #id created" appears within 2 s; no full-page reload occurs | R1 |
| SM-17.02 | Submit | US-17.3: Smooth Animations | **Given** a form is submitted, **when** the success state appears, **then** the transition completes in ≤ 300 ms and is disabled when `prefers-reduced-motion` is set | R1 |
| SM-4.01 | Confirm | US-4.1: Case Metadata on One Screen | **Given** Marcus confirms the new case, **when** the toast links to `/cases/{id}`, **then** clicking it shows all case metadata and timeline on one screen without additional navigation | R1 |
| SM-18.03 | Confirm | US-18.1: Navbar Breadcrumbs | **Given** Marcus navigates to the new case detail, **when** he wants to return to the case list, **then** a breadcrumb "Cases > Case #id" appears and returns to the list in one click | R1 |

---

#### JRN-01.2: Caller Status Inquiry — Instant Case Lookup

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-01.2) | Release |
|---|---|---|---|---|
| SM-3.01 | Trigger | US-3.1: Live Full-Text Search | **Given** Marcus starts typing a caller's name, **when** 300 ms elapses after 3+ characters, **then** matching results appear automatically without form submission | R1 |
| SM-11.01 | Search | US-11.1: PostgreSQL Full-Text Search | **Given** Marcus types "Maria Santos" into search, **when** the query runs, **then** results covering reporter name, description, and address return in ≤ 500 ms | R1 |
| SM-11.02 | Search | US-11.2: Highlighted Keyword Matches | **Given** a search term matches case data, **when** results render, **then** matched text is highlighted with `<mark>` elements so Marcus can visually confirm the right record | R1 |
| SM-3.02 | Refine | US-3.2: Filter by Multiple Criteria | **Given** three results return for "Maria Santos", **when** Marcus adds a department or address filter chip, **then** results narrow without a full-page reload | R1 |
| SM-11.03 | Refine | US-11.3: Search + Filter Combined | **Given** a search term and filter chips are both active, **when** results render, **then** both conditions are applied with AND semantics — no clearing of either | R1 |
| SM-3.03 | Identify | US-3.3: Sort Case List by Column | **Given** results return, **when** Marcus clicks "Date Submitted" column header, **then** results sort ascending/descending with a visible directional arrow | R1 |
| SM-3.04 | Identify | US-3.2: Status Badge Pills | **Given** case list renders, **when** Marcus scans rows, **then** status badges are color-coded (open=blue, closed-resolved=green, etc.) and category/date are visible without opening each record | R1 |
| SM-4.02 | Respond | US-4.1: Case Detail Split-Pane | **Given** Marcus finds the correct case, **when** he opens it, **then** a split-pane shows metadata on the left and full timeline on the right — no additional navigation required | R1 |

---

#### JRN-01.3: Storm Event Bulk Cleanup

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-01.3) | Release |
|---|---|---|---|---|
| SM-3.05 | Identify Cluster | US-3.2: Filter Case List | **Given** Marcus applies a date + category filter, **when** the filter chips are active, **then** the matching cluster of duplicate cases is visible without page reload | R1 |
| SM-3.06 | Select Batch | US-1.5: Bulk Operations | **Given** Marcus checks the "Select All on Page" checkbox, **when** rows are selected, **then** a bulk action toolbar appears showing the selected count | R1 |
| SM-1.04 | Choose Action | US-1.5: Bulk Close | **Given** ≥10 cases are selected, **when** Marcus chooses "Bulk Close" with substatus "Duplicate", **then** a confirmation dialog shows the exact count before committing | R1 |
| SM-1.05 | Confirm | US-1.2: Close with Substatus Dialog | **Given** the confirmation dialog is shown, **when** Marcus clicks Confirm, **then** all selected cases are closed in a single API call — no per-record reload | R1 |
| SM-3.07 | Verify | US-3.4: Paginate Case List | **Given** bulk operation completes, **when** the toast "33 cases closed" appears, **then** the case list refreshes showing the remaining open case — no full-page reload | R1 |
| SM-3.08 | Verify | US-3.5: Save Search Bookmark | **Given** Marcus uses this filter combination regularly, **when** he clicks "Save Search", **then** a named bookmark is stored and recallable in one click for future storm events | R1 |
| SM-3.09 | Verify | US-3.6: Export Case List | **Given** the filtered list is shown, **when** Marcus clicks Export, **then** a CSV of the current filtered results is downloaded with all current filter parameters applied | R1 |

---
---

### PER-02: Diane Kowalski — Department Field Supervisor

#### JRN-02.1: Morning Department Triage

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-02.1) | Release |
|---|---|---|---|---|
| SM-12.01 | Login | US-12.1: Log In via CAS SSO | **Given** Diane opens uReport, **when** she authenticates via CAS, **then** she is redirected directly to her department's pre-filtered view — not a global unfiltered list | R1 |
| SM-12.02 | Login | US-12.2: Log In via LDAP | **Given** CAS is unavailable, **when** Diane logs in with LDAP credentials, **then** the same post-login redirect behavior applies — she lands on her department view | R1 |
| SM-18.04 | Login | US-18.2: Mobile Hamburger Drawer | **Given** Diane opens uReport on her phone, **when** she authenticates, **then** the mobile hamburger nav provides access to her department case queue with ≥ 44 px touch targets | R2 |
| SM-5.01 | Orient | US-5.1: Dashboard KPIs | **Given** Diane lands on the dashboard after login, **when** stat cards load, **then** the "Overdue" card shows a count scoped to her department and is a clickable link | R2 |
| SM-5.02 | Orient | US-5.4: Quick-Link Buttons | **Given** Diane is on the dashboard, **when** she clicks "All Open Cases", **then** the case list opens pre-filtered to `status=open` for her department in one click | R2 |
| SM-3.10 | View Cases | US-3.2: Filter by Department | **Given** Diane navigates to the case list, **when** the "My Department" pre-filtered view loads, **then** all visible cases belong to Public Works with a filter chip showing "Department: Public Works" | R1 |
| SM-3.11 | View Cases | US-3.5: Save Search Bookmark | **Given** Diane's department filter is active, **when** she saves it as "My Department Open Cases", **then** future sessions can restore this view in one click — no re-filtering required | R1 |
| SM-3.12 | Prioritize | US-3.2: Overdue Badge | **Given** cases exist that exceed the configured SLA threshold, **when** Diane scans the case list, **then** overdue cases display a red badge with elapsed days visible without opening each record | R2 |
| SM-5.03 | Prioritize | US-5.1: Overdue Stat Card | **Given** the dashboard loads, **when** Diane sees the Overdue stat card, **then** clicking it navigates to `/cases` pre-filtered to overdue + her department — no manual filter setup required | R2 |
| SM-1.06 | Plan | US-1.4: Assign a Ticket | **Given** Diane identifies priority cases, **when** she updates the assignee field from the case list row, **then** the reassignment is saved in one click with a toast confirmation | R1 |

---

#### JRN-02.2: Field Resolution Closure with Photo Evidence

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-02.2) | Release |
|---|---|---|---|---|
| SM-19.01 | Access | US-19.3: Mobile Responsive Layout | **Given** Diane opens uReport on a 375 px mobile browser, **when** any screen loads, **then** no horizontal scroll occurs and all touch targets are ≥ 44 px | R1 |
| SM-12.03 | Access | US-12.3: Session Expiry & Refresh | **Given** Diane is working in the field, **when** her session approaches expiry, **then** the JWT is silently refreshed without interrupting her workflow | R1 |
| SM-3.13 | Find Case | US-3.2: Mobile Case List | **Given** Diane opens the case list on mobile, **when** the list renders, **then** it shows her department's open cases with touch-optimized tap targets — tapping a row opens case detail | R1 |
| SM-4.03 | Review | US-4.1: Mobile Case Detail | **Given** Diane opens a case on mobile (≤ 768 px), **when** the case detail loads, **then** layout stacks: metadata → action form → timeline with key info visible above the fold | R1 |
| SM-4.04 | Log Resolution | US-4.3: Log Response + Notify | **Given** Diane taps "Log Response" on mobile, **when** she types a resolution note, toggles "Notify Reporter", and submits, **then** the history entry is created and an email is dispatched in a single submission | R1 |
| SM-9.03 | Log Resolution | US-9.3: Load Response Template | **Given** Diane is logging a resolution, **when** she selects a pre-configured template for "Pothole Resolved", **then** the notes textarea is pre-filled and she can edit before submitting | R1 |
| SM-4.05 | Log Resolution | US-4.4: Response Template Selector | **Given** the action log form is open, **when** Diane selects an action type, **then** templates for that action + category combination are available in the template dropdown | R1 |
| SM-1.07 | Log Resolution | US-1.2: Close Ticket with Substatus | **Given** Diane taps "Close Case" on mobile, **when** she selects substatus "Resolved" and optional notes, **then** the case status changes to closed and the confirmation dialog shows correctly on 375 px | R1 |
| SM-10.01 | Attach Photos | US-10.2: Attach Photo from Field | **Given** Diane taps "Add Photos" on her phone, **when** the native file picker opens, **then** she can select photos from camera roll; thumbnails confirm selection; upload succeeds on mobile | R2 |
| SM-10.02 | Attach Photos | US-10.3: View Photos in Lightbox | **Given** photos are attached to a case, **when** Diane or Marcus taps a thumbnail, **then** the full-size image opens in a lightbox with navigation arrows | R2 |
| SM-1.08 | Submit | US-1.3: Reopen a Closed Ticket | **Given** a ticket is closed, **when** Marcus or Diane clicks "Reopen", **then** a confirmation dialog with optional notes appears and the status updates without page reload | R1 |
| SM-19.02 | Submit | US-19.1: Keyboard-Only Access | **Given** any form is submitted, **when** using keyboard navigation, **then** all form controls are reachable and operable via Tab, Enter, Space, Escape | R1 |

---

#### JRN-02.3: Overdue Case Escalation

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-02.3) | Release |
|---|---|---|---|---|
| SM-5.04 | Check Dashboard | US-5.1: Dashboard KPI — Overdue | **Given** cases exceed the configured SLA threshold, **when** Diane opens the dashboard, **then** the Overdue stat card displays a count scoped to her department within ≤ 2 s | R2 |
| SM-5.05 | Surface Overdue | US-5.4: Quick-Link from Dashboard | **Given** Diane clicks the Overdue stat card, **when** the navigation executes, **then** the case list opens pre-filtered to overdue + her department — no additional filter setup required | R2 |
| SM-3.14 | Review Overdue List | US-3.2: Overdue Badge in List | **Given** the overdue-filtered case list renders, **when** Diane scans rows, **then** days-overdue is shown in each row (via badge or tooltip) — no case-opening required to calculate elapsed time | R2 |
| SM-4.06 | Investigate | US-4.1: Case Timeline | **Given** Diane opens an overdue case, **when** the case detail loads, **then** the timeline panel shows all history entries chronologically; last action date is prominent without additional navigation | R1 |
| SM-4.07 | Escalate | US-4.2: Edit Fields Inline | **Given** Diane needs to reassign an overdue case, **when** she edits the assignee field inline, **then** the change is saved via PATCH and a history entry is created — no separate form required | R1 |
| SM-4.08 | Escalate | US-4.3: Log Response + Reassign | **Given** Diane submits a reassignment with a response note, **when** the single form submits, **then** both the reassignment history entry and the response log are created in one action | R1 |

---
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
---

## NaC Derivation Table

> Full traceability: JTBD outcome → journey stage → NaC → story. Every NaC is derived from a specific JTBD outcome at a specific journey stage.

| JTBD-ID | JTBD Outcome (Success Measure) | Journey Stage | NaC Statement | Mapped Story | SM-ID |
|---|---|---|---|---|---|
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Receive | Clicking "New Case" in the persistent navbar loads `/cases/new` client-side with zero full-page reload | US-18.1 | SM-18.01 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Enter Details | On form submit, success toast appears within 2 s and new case ID is visible without full-page reload | US-1.1 | SM-1.01 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Assign | Selecting a department triggers auto-assignment; email notification is sent in the same API call | US-1.4, US-9.2 | SM-1.02, SM-9.02 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Submit | Success toast "Case #id created" appears within 2 s; no full-page reload | US-1.2 | SM-1.03 |
| JTBD-01.1 | Case created in ≤ 90 s without page reload | JRN-01.1: Confirm | Toast link to `/cases/{id}` shows all metadata and timeline on one screen | US-4.1 | SM-4.01 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Trigger | Global search input in navbar triggers live search; typing begins immediately without a form submit | US-3.1 | SM-3.01 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Search | After 300 ms debounce with 3+ characters, PostgreSQL FTS returns results covering reporter name, description, address in ≤ 500 ms | US-11.1 | SM-11.01 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Search | Matched text is highlighted with `<mark>` elements in result rows | US-11.2 | SM-11.02 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Refine | Filter chips combinable with live search; adding a chip narrows results without clearing the search term | US-3.2, US-11.3 | SM-3.02, SM-11.03 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Identify | Status badges are color-coded; category and date visible in row without opening each record | US-3.2 | SM-3.04 |
| JTBD-01.2 | Any case located in ≤ 30 s via live search | JRN-01.2: Respond | Split-pane case detail shows full timeline on right panel without additional navigation | US-4.1 | SM-4.02 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Identify Cluster | Date + category filter chips surface the cluster of duplicates without page reload | US-3.2 | SM-3.05 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Select Batch | "Select All on Page" checkbox appears; bulk action toolbar shows selected count on ≥ 1 selection | US-1.5 | SM-3.06 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Choose Action | Bulk Close with substatus option available; a confirmation dialog shows exact case count before commit | US-1.5 | SM-1.04 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Confirm | Single Confirm click closes all selected cases in one API call — no per-record reload | US-1.2 | SM-1.05 |
| JTBD-01.3 | 10+ cases bulk-actioned in single click ≤ 60 s | JRN-01.3: Verify | Toast "N cases closed"; case list refreshes without full-page reload showing remaining open cases | US-3.4 | SM-3.07 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Login | After CAS/LDAP auth, session persists department filter and user lands on My Department view | US-12.1, US-12.2 | SM-12.01, SM-12.02 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Orient | Dashboard Overdue stat card is scoped to Diane's department and is a clickable link to filtered list | US-5.1 | SM-5.01 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: View Cases | Pre-filtered "My Department" case list shows only Public Works open cases with filter chip visible | US-3.2 | SM-3.10 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Prioritize | Overdue badge (red pill) on cases exceeding configured SLA threshold; days-overdue visible in row | US-3.2 | SM-3.12 |
| JTBD-02.1 | Dept case list reached in ≤ 2 clicks after login | JRN-02.1: Plan | Assignee update from case list row saves in one click with toast confirmation | US-1.4 | SM-1.06 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Access | Application renders correctly at 375 px; no horizontal scroll; all touch targets ≥ 44 px | US-19.3 | SM-19.01 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Access | JWT is silently refreshed 5 min before expiry during field use | US-12.3 | SM-12.03 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Find Case | Pre-filtered mobile case list shows department's cases; tap opens case detail without extra navigation | US-3.2 | SM-3.13 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Review | Case detail stacks vertically on mobile; location and status visible above the fold | US-4.1 | SM-4.03 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Log Resolution | Action log form is fully usable at 375 px; notes textarea auto-expands; Submit button is thumb-reachable | US-4.3 | SM-4.04 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Attach Photos | Native file picker opens camera roll on mobile; thumbnails confirm photo selection; upload succeeds | US-10.2 | SM-10.01 |
| JTBD-02.2 | Case closed with photo on mobile in ≤ 3 min | JRN-02.2: Submit | Case status changes to Closed; reporter email is dispatched; success toast appears without redirect | US-1.2 | SM-1.07 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Check Dashboard | Overdue stat card on dashboard is scoped to Diane's department; count renders within ≤ 2 s | US-5.1 | SM-5.04 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Surface Overdue | Clicking overdue stat card opens case list pre-filtered to overdue + department — no manual filter setup | US-5.4 | SM-5.05 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Review Overdue List | Days-overdue shown in case list rows via badge or tooltip without opening each case | US-3.2 | SM-3.14 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Investigate | Case detail timeline shows all history chronologically; last action date is prominent on load | US-4.1 | SM-4.06 |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s from dashboard | JRN-02.3: Escalate | Inline reassignment + response note submitted in a single form action — two history entries created | US-4.2, US-4.3 | SM-4.07, SM-4.08 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Navigate | Admin sidebar "Category Groups" link accessible in one click; breadcrumb confirms location | US-18.1 | SM-18.05 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Create Group | Category group panel shows child categories inline with "Add Category" action visible in context | US-8.1 | SM-8.01 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Configure Category | Inline validation confirms department exists; save is blocked if required fields are empty | US-8.2 | SM-8.02 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Add Templates | Templates created in-context from the category edit sheet without navigating to a separate panel | US-8.2 | SM-8.03 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Verify | New category appears in public form and case creation dropdowns immediately after save — no restart | US-2.1 | SM-2.01 |
| JTBD-03.1 | New category configured in ≤ 10 min via admin UI | JRN-03.1: Confirm Security | Confirmation dialog appears before any destructive admin operation | US-8.3 | SM-8.04 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Navigate | Admin sidebar "API Clients" link accessible directly; no database access needed | US-18.1 | SM-18.06 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Create Client | New Client form auto-generates UUID API key on save; no manual UUID creation required | US-14.1 | SM-14.01 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Save & Retrieve Key | Generated key displayed once in a copyable field labeled "shown only once" on confirmation screen | US-14.1 | SM-14.02 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Verify Activation | API key is immediately active for POST /open311/v2/requests; 201 response returned without restart | US-0.3 | SM-0.01 |
| JTBD-03.2 | Open311 client registered and key delivered ≤ 5 min | JRN-03.2: Deliver | Swagger UI at `/swagger-ui.html` documents all Open311 endpoints with GeoReport v2 descriptions | US-20.1 | SM-20.01 |
| JTBD-03.3 | Vendor API question answered via Swagger in ≤ 5 min | JRN-03.2: Deliver | All controllers annotated; spec covers 100% of endpoints; exportable as JSON/YAML | US-20.1, US-20.2 | SM-20.01, SM-20.02 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Discover | Public form loads at 375 px with no horizontal scroll; progress indicator and correct touch targets | US-19.3 | SM-19.03 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Discover | Step 1 of 5 progress indicator renders; Framer Motion step transitions ≤ 300 ms | US-2.1 | SM-2.02 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Contact | All contact fields optional; advancing without any contact info is permitted — zero friction | US-2.1 | SM-2.03 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Category | Two-level category selection renders with large touch targets; subcategory list appears after group tap | US-2.1 | SM-2.04 |
| JTBD-04.1 | Anonymous submission on 375 px in ≤ 5 min | JRN-04.1: Description & Photos | Native file picker opens camera roll; thumbnails confirm selection; textarea auto-expands on mobile | US-2.3 | SM-2.06 |
| JTBD-04.2 | Map pin placed in ≤ 60 s without address typing | JRN-04.1: Location | Tapping the map places a draggable pin; reverse-geocoding auto-fills address field within 1 s | US-2.2 | SM-2.05 |
| JTBD-04.3 | Case ID on confirmation screen in ≤ 3 s | JRN-04.1: Review & Submit | Confirmation screen displays "Case #id" prominently within 3 s; no auth wall; screenshot-friendly | US-2.4 | SM-2.08 |
| JTBD-04.3 | Case ID on confirmation screen in ≤ 3 s | JRN-04.1: Review & Submit | If email provided, acknowledgment email with case ID sent within 2 min | US-9.2 | SM-9.04 |

---
---

## Release Planning

---

### Release R1 — "Core Workflows & Platform Foundation"

**Theme:** Deliver the complete core staff and public workflows with zero regressions on Open311, authentication, database migration, design system, and accessibility. R1 makes the system fully operational for Marcus (311 Operator) and Priya (Citizen Reporter) and lays the foundation for all subsequent releases.

**Journey Completeness Enabled:**
- ✅ JRN-01.1: Live-Call Case Intake — complete end-to-end
- ✅ JRN-01.2: Caller Status Inquiry — complete end-to-end
- ✅ JRN-01.3: Storm Event Bulk Cleanup — complete end-to-end
- ✅ JRN-04.1: Mobile Service Request Submission — complete end-to-end
- ⬜ JRN-02.x: Diane's journeys — Login and basic case views covered; overdue/dashboard in R2
- ⬜ JRN-03.x: Jordan's admin journeys — deferred to R2

**Stories in R1 (50 stories — all P0):**

| Story ID | Title | Epic | Primary Persona | JTBD |
|---|---|---|---|---|
| US-0.1 | List Available Services (Open311) | F0 | External clients | JTBD-03.2 |
| US-0.2 | Retrieve Service Requests with Filters (Open311) | F0 | External clients | JTBD-03.2 |
| US-0.3 | Submit a New Service Request via Open311 | F0 | External clients | JTBD-03.2 |
| US-0.4 | Retrieve a Single Service Request by ID | F0 | External clients | JTBD-03.2 |
| US-1.1 | Create a New Ticket from a Phone Call | F1 | PER-01 Marcus | JTBD-01.1 |
| US-1.2 | Close a Ticket with a Substatus | F1 | PER-01 Marcus | JTBD-01.1, JTBD-02.2 |
| US-1.3 | Reopen a Closed Ticket | F1 | PER-01 Marcus | JTBD-01.1 |
| US-1.4 | Assign a Ticket to a Staff Person | F1 | PER-01 Marcus | JTBD-01.1, JTBD-02.1 |
| US-1.5 | Perform Bulk Operations on Multiple Tickets | F1 | PER-01 Marcus | JTBD-01.3 |
| US-2.1 | Complete the Multi-Step Submission Wizard on Mobile | F2 | PER-04 Priya | JTBD-04.1 |
| US-2.2 | Drop a Map Pin to Identify Issue Location | F2 | PER-04 Priya | JTBD-04.2 |
| US-2.3 | Upload a Photo from Phone Camera During Submission | F2 | PER-04 Priya | JTBD-04.1 |
| US-2.4 | Receive a Confirmation Screen with Case ID | F2 | PER-04 Priya | JTBD-04.3 |
| US-3.1 | Search for a Case Using Live Full-Text Search | F3 | PER-01 Marcus | JTBD-01.2 |
| US-3.2 | Filter the Case List by Multiple Criteria | F3 | PER-01 Marcus, PER-02 Diane | JTBD-01.2, JTBD-02.1 |
| US-3.3 | Sort the Case List by Column | F3 | PER-01 Marcus | JTBD-01.2 |
| US-3.4 | Paginate Through the Case List | F3 | PER-01 Marcus | JTBD-01.3 |
| US-3.5 | Save a Search as a Bookmark for Quick Recall | F3 | PER-02 Diane | JTBD-02.1 |
| US-3.6 | Export Case List Results to CSV | F3 | PER-01 Marcus | JTBD-01.3 |
| US-4.1 | View Complete Case Metadata and History on One Screen | F4 | PER-01 Marcus | JTBD-01.1, JTBD-01.2 |
| US-4.2 | Edit Case Fields Inline Without Leaving the Screen | F4 | PER-01 Marcus | JTBD-01.2, JTBD-02.3 |
| US-4.3 | Log a Response and Optionally Notify the Reporter | F4 | PER-02 Diane | JTBD-02.2 |
| US-4.4 | Use a Response Template to Pre-Fill Action Notes | F4 | PER-02 Diane | JTBD-02.2 |
| US-9.1 | Automatic System Action Created on Ticket Events | F9 | PER-01 Marcus | JTBD-01.1 |
| US-9.2 | Send Email Notification to Reporter on Action | F9 | PER-01 Marcus, PER-04 Priya | JTBD-01.1, JTBD-04.3 |
| US-9.3 | Load Response Template into Action Notes | F9 | PER-02 Diane | JTBD-02.2 |
| US-11.1 | Search Tickets with PostgreSQL Full-Text Search | F11 | PER-01 Marcus | JTBD-01.2 |
| US-11.2 | See Highlighted Keyword Matches in Search Results | F11 | PER-01 Marcus | JTBD-01.2 |
| US-11.3 | Search and Filter Can Be Combined | F11 | PER-02 Diane | JTBD-02.1 |
| US-11.4 | Search Vector Auto-Maintained by Database Trigger | F11 | PER-03 Jordan | JTBD-03.1 |
| US-12.1 | Log In via CAS Single Sign-On | F12 | PER-01 Marcus, PER-02 Diane | JTBD-02.1 |
| US-12.2 | Log In via LDAP Credentials | F12 | PER-02 Diane | JTBD-02.1 |
| US-12.3 | Session Expiry and Automatic Token Refresh | F12 | PER-01 Marcus | JTBD-02.2 |
| US-12.4 | Sign Out and Invalidate the Session | F12 | PER-01 Marcus | JTBD-01.1 |
| US-12.5 | View and Update Own Profile on the Account Screen | F12 | PER-01 Marcus | JTBD-01.1 |
| US-17.1 | Use a Consistent, Branded Design System Across All Screens | F17 | All | All |
| US-17.2 | Toggle Dark Mode and Have the Preference Persisted | F17 | PER-01 Marcus | JTBD-01.1 |
| US-17.3 | Experience Smooth Animations Respecting Motion Preferences | F17 | PER-04 Priya | JTBD-04.1 |
| US-18.1 | Navigate the Application Using the Persistent Navbar and Sidebar | F18 | PER-01 Marcus | JTBD-01.1 |
| US-18.2 | Navigate the Application on a Mobile Device via the Hamburger Drawer | F18 | PER-02 Diane | JTBD-02.2 |
| US-18.3 | Use Keyboard Navigation and Skip Links for Accessibility | F18 | All | All |
| US-19.1 | Access All Features Using Only a Keyboard | F19 | All staff | All |
| US-19.2 | Use a Screen Reader to Operate the Application | F19 | All | All |
| US-19.3 | Use the Application Comfortably on a Mobile Device | F19 | PER-02 Diane, PER-04 Priya | JTBD-02.2, JTBD-04.1 |
| US-19.4 | Read Content with Sufficient Color Contrast | F19 | All | All |
| US-21.1 | Migrate the Full MySQL Schema to PostgreSQL via Flyway | F21 | PER-03 Jordan | JTBD-03.1 |
| US-21.2 | Migrate All Production Data from MySQL to PostgreSQL | F21 | PER-03 Jordan | JTBD-03.1 |

> **Note:** US-2.1 is in R1 because the public form Verify stage (Jordan confirming a new category appears immediately) makes use of it — but the story itself is primarily R1 as the public submission flow is a P0 feature.

**Personas Served in R1:**
- ✅ PER-01 Marcus — Primary: full case intake, search, status lookup, bulk close
- ✅ PER-04 Priya — Primary: complete mobile submission journey
- ✅ PER-02 Diane — Partial: authentication, basic case list/detail, close from field (mobile layout)
- ⬜ PER-03 Jordan — Infrastructure only (DB migration, search trigger)

**JTBD Addressed in R1:**
- ✅ JTBD-01.1: Live-call case intake — fully covered
- ✅ JTBD-01.2: Instant case lookup — fully covered
- ✅ JTBD-01.3: Bulk cleanup of duplicates — fully covered
- ✅ JTBD-04.1: Frictionless mobile submission — fully covered
- ✅ JTBD-04.2: Map-based location identification — fully covered
- ✅ JTBD-04.3: Submission confirmation and case reference — fully covered
- ⬜ JTBD-02.1: Department triage — partially covered (case list + filter, not dashboard)
- ⬜ JTBD-02.2: Field closure with photo — partially covered (mobile layout + close, not photo upload)
- ⬜ JTBD-02.3: Overdue escalation — partially covered (timeline visible, not overdue dashboard)
- ⬜ JTBD-03.1: Service taxonomy config — deferred to R2
- ⬜ JTBD-03.2: API client onboarding — partially covered (API works; admin UI in R2)
- ⬜ JTBD-03.3: Vendor API documentation — deferred to R2

---
---

### Release R2 — "Field Supervision, Admin Configuration & Dashboard"

**Theme:** Complete Diane's field supervision journeys (morning triage, overdue escalation) and Jordan's admin configuration journeys (category taxonomy, API client management). Deliver the dashboard experience and media upload for all personas.

**Journey Completeness Enabled:**
- ✅ JRN-02.1: Morning Department Triage — complete end-to-end (dashboard + overdue badges)
- ✅ JRN-02.2: Field Closure with Photo Evidence — complete end-to-end (photo upload added)
- ✅ JRN-02.3: Overdue Case Escalation — complete end-to-end (overdue stat card + escalation)
- ✅ JRN-03.1: New Service Category Configuration — complete end-to-end
- ✅ JRN-03.2: Open311 API Client Onboarding — complete end-to-end (admin UI added)

**Stories in R2 (24 stories — all P1):**

| Story ID | Title | Epic | Primary Persona | JTBD |
|---|---|---|---|---|
| US-5.1 | View Operational KPIs on the Dashboard | F5 | PER-01 Marcus, PER-02 Diane | JTBD-02.1, JTBD-02.3 |
| US-5.2 | Review the Recent Cases Feed on the Dashboard | F5 | PER-01 Marcus | JTBD-02.1 |
| US-5.3 | View Open Cases on the Dashboard Map Widget | F5 | PER-01 Marcus | JTBD-02.1 |
| US-5.4 | Use Quick-Link Buttons to Navigate from the Dashboard | F5 | PER-02 Diane | JTBD-02.1, JTBD-02.3 |
| US-6.1 | List and Search People | F6 | PER-03 Jordan | JTBD-03.1 |
| US-6.2 | Create a New Staff Person Record | F6 | PER-03 Jordan | JTBD-03.1 |
| US-6.3 | Edit a Person and Manage Their Contact Records | F6 | PER-03 Jordan | JTBD-03.1 |
| US-6.4 | Delete a Person with Safety Check | F6 | PER-03 Jordan | JTBD-03.1 |
| US-7.1 | List, Create, and Edit Departments | F7 | PER-03 Jordan | JTBD-03.1 |
| US-7.2 | Delete a Department with Safety Check | F7 | PER-03 Jordan | JTBD-03.1 |
| US-8.1 | Create a New Category Group | F8 | PER-03 Jordan | JTBD-03.1 |
| US-8.2 | Create and Fully Configure a New Category | F8 | PER-03 Jordan | JTBD-03.1 |
| US-8.3 | Delete a Category with Safety Check | F8 | PER-03 Jordan | JTBD-03.1 |
| US-10.1 | Attach Photos to a Ticket at Creation (Staff) | F10 | PER-01 Marcus | JTBD-02.2 |
| US-10.2 | Attach a Photo to an Existing Ticket from the Field | F10 | PER-02 Diane | JTBD-02.2 |
| US-10.3 | View Photos in the Case Detail Lightbox | F10 | PER-01 Marcus, PER-02 Diane | JTBD-02.2 |
| US-10.4 | Delete an Attached Photo with Confirmation | F10 | PER-01 Marcus | JTBD-02.2 |
| US-13.1 | Manage Substatus Values | F13 | PER-03 Jordan | JTBD-03.1 |
| US-13.2 | Manage Issue Types | F13 | PER-03 Jordan | JTBD-03.1 |
| US-13.3 | Manage Response Templates | F13 | PER-03 Jordan | JTBD-03.1 |
| US-13.4 | Manage Contact Methods | F13 | PER-03 Jordan | JTBD-03.1 |
| US-14.1 | Register a New Open311 API Client | F14 | PER-03 Jordan | JTBD-03.2 |
| US-14.2 | Edit and Delete an Open311 Client Record | F14 | PER-03 Jordan | JTBD-03.2 |
| US-20.1 | Explore All API Endpoints via Swagger UI | F20 | PER-03 Jordan | JTBD-03.3 |
| US-20.2 | Test API Calls Directly from Swagger UI | F20 | PER-03 Jordan | JTBD-03.3 |

**Personas Served in R2:**
- ✅ PER-02 Diane — Complete: all three journeys fully operational including dashboard + photo upload
- ✅ PER-03 Jordan — Complete: full admin configuration + API client management + Swagger docs
- ✅ PER-01 Marcus — Enhanced: dashboard, media upload, recent cases feed
- ✅ PER-04 Priya — Unchanged from R1

**JTBD Addressed in R2:**
- ✅ JTBD-02.1: Department triage — fully covered (dashboard, overdue badge, pre-filtered views)
- ✅ JTBD-02.2: Field closure with photo — fully covered (photo upload, mobile media gallery)
- ✅ JTBD-02.3: Overdue escalation — fully covered (overdue stat card, pre-filtered list)
- ✅ JTBD-03.1: Service taxonomy config — fully covered (category, department, template, substatus admin)
- ✅ JTBD-03.2: API client onboarding — fully covered (admin UI, key generation, immediate activation)
- ✅ JTBD-03.3: Vendor API documentation — fully covered (Swagger UI with 100% endpoint coverage)

---
---

### Release R3 — "Insights, Enhanced Maps & Reporting"

**Theme:** Deliver management-level visibility through metrics and reporting, plus enhanced geographic map rendering for dense urban areas. These features are valuable for oversight and planning but do not block any daily operational workflow.

**Journey Completeness Enabled:**
- ✅ Metrics & reporting screens — Jordan and city leadership get quantitative case insights
- ✅ Geo-clustering map — Marcus gets geographic distribution view for dense areas
- ✅ Single-ticket map pin on case detail — completes the geographic context feature for all staff

**Stories in R3 (4 stories — all P2):**

| Story ID | Title | Epic | Primary Persona | JTBD |
|---|---|---|---|---|
| US-15.1 | View Case Volume Over Time | F15 | PER-03 Jordan | — |
| US-15.2 | View Resolution Time and Case Breakdown Reports | F15 | PER-03 Jordan | — |
| US-16.1 | View Clustered Ticket Pins on the Map | F16 | PER-01 Marcus | JTBD-01.2 (geographic context) |
| US-16.2 | View a Single Ticket Pin on Case Detail Map | F16 | PER-01 Marcus | JTBD-01.2 (geographic context) |

**Personas Served in R3:**
- ✅ PER-03 Jordan — Enhanced: full metrics and reporting for leadership briefings
- ✅ PER-01 Marcus — Enhanced: geographic case distribution visible on dashboard and case detail
- ✅ PER-02 Diane — Indirect: can use resolution time reports to justify crew dispatch priorities

**JTBD Addressed in R3:**

> R3 stories address management oversight needs rather than a formal JTBD from the JTBD document. The Metrics and Reporting features (F15) are P2 because they are valuable but do not block any of the 12 defined JTBD outcomes. Geo-clustering (F16) enhances JTBD-01.2 (case lookup) by providing geographic context but is not required to satisfy the 30-second lookup success measure.

---
---

## Coverage Analysis

---

### Persona Coverage by Release

| Persona | R1 | R2 | R3 |
|---|---|---|---|
| PER-01 Marcus (311 Operator) | ✅ Full core workflows (case intake, search, bulk close) | ✅ Dashboard, media upload, recent feed | ✅ Geo-clustering map |
| PER-02 Diane (Dept Supervisor) | ✅ Auth, mobile layout, basic case list/detail/close | ✅ Dashboard + overdue, photo upload, field closure | — |
| PER-03 Jordan (Admin) | ✅ DB migration, search trigger (infrastructure) | ✅ All admin panels, API client mgmt, Swagger | ✅ Metrics & reporting |
| PER-04 Priya (Citizen) | ✅ Complete mobile submission journey | — | — |

---

### JTBD Coverage by Release

| JTBD-ID | JTBD Statement | R1 | R2 | R3 |
|---|---|---|---|---|
| JTBD-01.1 | Live-call case intake in ≤ 90 s | ✅ Complete | — | — |
| JTBD-01.2 | Instant case lookup in ≤ 30 s | ✅ Complete | — | ✅ Enhanced (geo) |
| JTBD-01.3 | Bulk cleanup of duplicates in ≤ 60 s | ✅ Complete | — | — |
| JTBD-02.1 | Department triage in ≤ 2 clicks | ⬜ Partial (case list) | ✅ Complete (dashboard) | — |
| JTBD-02.2 | Field closure with photo in ≤ 3 min | ⬜ Partial (mobile UI + close) | ✅ Complete (photo upload) | — |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s | ⬜ Partial (timeline only) | ✅ Complete (overdue badge + stat card) | — |
| JTBD-03.1 | Service taxonomy config in ≤ 10 min | ⬜ Infrastructure only | ✅ Complete (admin panels) | — |
| JTBD-03.2 | API client onboarding in ≤ 5 min | ⬜ API works; no admin UI | ✅ Complete (client admin UI) | — |
| JTBD-03.3 | Vendor support via Swagger in ≤ 5 min | ⬜ Not started | ✅ Complete (Swagger UI) | — |
| JTBD-04.1 | Anonymous submission on mobile in ≤ 5 min | ✅ Complete | — | — |
| JTBD-04.2 | Map pin location in ≤ 60 s | ✅ Complete | — | — |
| JTBD-04.3 | Case ID on confirmation in ≤ 3 s | ✅ Complete | — | — |

---

### Story Coverage Map

All 74 stories from UserStories-UReport.md are mapped in this Story Map. The table below confirms placement and release assignment:

| Story ID | SM-ID(s) | Release | Orphan? |
|---|---|---|---|
| US-0.1 | SM-0.02 | R1 | No |
| US-0.2 | SM-0.03 | R1 | No |
| US-0.3 | SM-0.01 | R1 | No |
| US-0.4 | SM-0.04 | R1 | No |
| US-1.1 | SM-1.01 | R1 | No |
| US-1.2 | SM-1.03, SM-1.05, SM-1.07 | R1 | No |
| US-1.3 | SM-1.08 | R1 | No |
| US-1.4 | SM-1.02, SM-1.06 | R1 | No |
| US-1.5 | SM-3.06, SM-1.04 | R1 | No |
| US-2.1 | SM-2.02, SM-2.03, SM-2.04, SM-2.07 | R1 | No |
| US-2.2 | SM-2.05 | R1 | No |
| US-2.3 | SM-2.06 | R1 | No |
| US-2.4 | SM-2.08 | R1 | No |
| US-3.1 | SM-3.01 | R1 | No |
| US-3.2 | SM-3.02, SM-3.04, SM-3.05, SM-3.10, SM-3.11, SM-3.12, SM-3.13, SM-3.14 | R1/R2 | No |
| US-3.3 | SM-3.03 | R1 | No |
| US-3.4 | SM-3.07 | R1 | No |
| US-3.5 | SM-3.08, SM-3.11 | R1 | No |
| US-3.6 | SM-3.09 | R1 | No |
| US-4.1 | SM-4.01, SM-4.02, SM-4.03, SM-4.06 | R1 | No |
| US-4.2 | SM-4.07 | R1 | No |
| US-4.3 | SM-4.04, SM-4.08 | R1 | No |
| US-4.4 | SM-4.05 | R1 | No |
| US-5.1 | SM-5.01, SM-5.03, SM-5.04 | R2 | No |
| US-5.2 | SM-5.06 | R2 | No |
| US-5.3 | SM-5.07 | R2 | No |
| US-5.4 | SM-5.02, SM-5.05 | R2 | No |
| US-6.1 | SM-6.01 | R2 | No |
| US-6.2 | SM-6.02 | R2 | No |
| US-6.3 | SM-6.03 | R2 | No |
| US-6.4 | SM-6.04 | R2 | No |
| US-7.1 | SM-7.01 | R2 | No |
| US-7.2 | SM-7.02 | R2 | No |
| US-8.1 | SM-8.01 | R2 | No |
| US-8.2 | SM-8.02, SM-8.03 | R2 | No |
| US-8.3 | SM-8.04 | R2 | No |
| US-9.1 | SM-9.01 | R1 | No |
| US-9.2 | SM-9.02, SM-9.04 | R1 | No |
| US-9.3 | SM-9.03 | R1 | No |
| US-10.1 | SM-10.03 | R2 | No |
| US-10.2 | SM-10.01 | R2 | No |
| US-10.3 | SM-10.02 | R2 | No |
| US-10.4 | SM-10.04 | R2 | No |
| US-11.1 | SM-11.01 | R1 | No |
| US-11.2 | SM-11.02 | R1 | No |
| US-11.3 | SM-11.03 | R1 | No |
| US-11.4 | SM-11.04 | R1 | No |
| US-12.1 | SM-12.01 | R1 | No |
| US-12.2 | SM-12.02 | R1 | No |
| US-12.3 | SM-12.03, SM-12.04 | R1 | No |
| US-12.4 | SM-12.05 | R1 | No |
| US-12.5 | SM-12.06 | R1 | No |
| US-13.1 | SM-13.02 | R2 | No |
| US-13.2 | SM-13.03 | R2 | No |
| US-13.3 | SM-13.01 | R2 | No |
| US-13.4 | SM-13.04 | R2 | No |
| US-14.1 | SM-14.01, SM-14.02 | R2 | No |
| US-14.2 | SM-14.03 | R2 | No |
| US-15.1 | SM-15.01 | R3 | No |
| US-15.2 | SM-15.02 | R3 | No |
| US-16.1 | SM-16.01 | R3 | No |
| US-16.2 | SM-16.02 | R3 | No |
| US-17.1 | SM-17.01, SM-17.03 | R1 | No |
| US-17.2 | SM-18.02 | R1 | No |
| US-17.3 | SM-17.02, SM-17.04 | R1 | No |
| US-18.1 | SM-18.01, SM-18.03, SM-18.05, SM-18.06 | R1/R2 | No |
| US-18.2 | SM-18.04 | R2 | No |
| US-18.3 | SM-18.07 | R1 | No |
| US-19.1 | SM-19.02, SM-19.05 | R1 | No |
| US-19.2 | SM-19.06, SM-19.04 | R1 | No |
| US-19.3 | SM-19.01, SM-19.03 | R1 | No |
| US-19.4 | SM-19.07 | R1 | No |
| US-20.1 | SM-20.01 | R2 | No |
| US-20.2 | SM-20.02 | R2 | No |
| US-21.1 | SM-21.01 | R1 | No |
| US-21.2 | SM-21.02 | R1 | No |

**Total Stories Mapped: 74 / 74 — 0 Orphans**

---

### Gap Analysis

**Journey Stages with No Mapped Stories:**

> All nine journeys (JRN-01.1 through JRN-04.1) have at least one mapped story per stage. No journey stages are uncovered.

**JTBD Outcomes Without NaC:**

> All 12 JTBD outcomes have at least one derived NaC. The NaC Derivation Table lists 54 derivation rows covering all 12 JTBD.

**JTBD-03.3 Note:** JTBD-03.3 (Vendor support via Swagger) maps primarily to US-20.1 and US-20.2. It has no dedicated journey (JRN-03.3 was not created), but its success measure is covered by the JRN-03.2 Deliver stage. No gap.

**Orphan Stories:** None. Every story is mapped to at least one journey stage.

**R3-Only JTBD Gap:** F15 (Metrics/Reporting) has no formally specified JTBD in the JTBD document. US-15.1 and US-15.2 serve management oversight needs (Jordan + city leadership) but are not tied to a specific outcome-driven JTBD. This is intentional — they are P2 "nice-to-have" reporting screens, not core job-hiring criteria.

---
---

## NaC-to-Acceptance Criteria Alignment

> This section verifies that each derived NaC aligns with the formal acceptance criteria in UserStories-UReport.md. A NaC "aligns" when the testable condition in the NaC is covered by at least one acceptance criterion checkbox in the referenced story.

| SM-ID | Story | NaC Statement | Aligning Acceptance Criterion | Status |
|---|---|---|---|---|
| SM-1.01 | US-1.1 | Toast appears within 2 s; no full-page reload | "Successful submission redirects to `/cases/{id}` and shows toast 'Case #{id} created successfully'" | ✅ Aligned |
| SM-1.02 | US-1.4 | Email notification sent without page reload; history entry created | "Email notification is sent to the new assignee" + "Toast 'Case updated' confirms the save without page reload" | ✅ Aligned |
| SM-1.04 | US-1.5 | Bulk Close shows count in confirmation dialog | "Bulk close shows substatus selector dialog" + "toast notification shows 'X cases updated successfully'" | ✅ Aligned |
| SM-1.07 | US-1.2 | Case closes on mobile; reporter email triggered | "'Close Case' button opens confirmation dialog with substatus" + "Email notification sent to reporter if toggle enabled" | ✅ Aligned |
| SM-2.02 | US-2.1 | Step 1 of 5 progress indicator; transitions ≤ 300 ms | "A step indicator (1–5) shows current position" + "Framer Motion animated transitions ≤ 300 ms" | ✅ Aligned |
| SM-2.03 | US-2.1 | Anonymous submission, no account required | "Anonymous submission (skipping all contact info) is permitted with zero friction" | ✅ Aligned |
| SM-2.05 | US-2.2 | Pin placed; address auto-fills from reverse-geocoding | "Clicking/touching map places draggable pin; reverse-geocoded address stored in form state" | ✅ Aligned |
| SM-2.06 | US-2.3 | Native file picker opens camera roll; thumbnails confirm | "Step 4 includes file input with `accept='image/*' capture` for mobile camera access" + thumbnail preview | ✅ Aligned |
| SM-2.08 | US-2.4 | Confirmation screen with case ID in ≤ 3 s | "Step 6 (Confirmation) renders: 'Your report has been submitted. Case number: #{id}'" | ✅ Aligned |
| SM-3.01 | US-3.1 | Results after 300 ms debounce; 3+ characters | "After 300 ms of inactivity (debounce), the list auto-refreshes with matching results" | ✅ Aligned |
| SM-3.02 | US-3.2 | Filter chips combinable with live search; no page reload | "Filter changes take effect immediately (no Apply button needed)" + filter chips with × remove | ✅ Aligned |
| SM-3.04 | US-3.2 | Status badges color-coded; category/date visible in row | "Status badge pills are color-coded: open=blue, closed-resolved=green..." | ✅ Aligned |
| SM-3.06 | US-1.5 | Bulk action toolbar on ≥ 1 selection; count shown | "Checkboxes on each row; bulk action toolbar appears when ≥1 selected" | ✅ Aligned |
| SM-3.12 | US-3.2 | Overdue badge with elapsed days; no case-opening required | "Open tickets that have exceeded their category's `slaDays` threshold display a red 'Overdue' badge in the case list row; the badge shows the number of elapsed days visible without opening the record" | ✅ Aligned |
| SM-4.01 | US-4.1 | All metadata + timeline on one screen | "Case detail shows split-pane layout: metadata panel + timeline panel" | ✅ Aligned |
| SM-4.04 | US-4.3 | Action log form usable at 375 px; single submission | "On submit: POST /api/tickets/{id}/history" + "Email delivery failure is non-fatal" | ✅ Aligned |
| SM-5.01 | US-5.1 | Overdue stat card scoped to dept; clickable link | "Four stat cards display: Total Open, Opened Today, Closed Today, Overdue" + "Each card is a link" + "For users with a department assignment, all four stat cards are scoped to show counts for that department only" | ✅ Aligned |
| SM-8.02 | US-8.2 | Inline validation; save blocked if required fields empty | "Required fields: name, department (dropdown)" + "Toast 'Category saved'; sheet closes; list refreshes" | ✅ Aligned |
| SM-8.04 | US-8.3 | Confirmation dialog before destructive delete | "Clicking 'Delete' on a category shows confirmation dialog" | ✅ Aligned |
| SM-9.02 | US-9.2 | Email sent to assignee in same request cycle | "Email is sent only if recipient has ≥1 email with `usedForNotifications = true`" | ✅ Aligned |
| SM-9.04 | US-9.2 | Acknowledgment email within 2 min | "Email body: action notes + standard case link footer" + SMTP delivery | ✅ Aligned |
| SM-10.01 | US-10.2 | Native file picker on mobile; thumbnails visible | "On mobile, file input uses `accept='image/*' capture`" + "Gallery thumbnails refresh after upload" | ✅ Aligned |
| SM-11.01 | US-11.1 | FTS results ≤ 500 ms covering reporter name, description, address | "Full-text search query P95 ≤ 500 ms" + search vector covers description, location, reporter name | ✅ Aligned |
| SM-11.02 | US-11.2 | `<mark>` elements highlight matched terms | "React renders `searchSnippet` using sanitized HTML" + `<mark>` elements for matching terms | ✅ Aligned |
| SM-12.01 | US-12.1 | CAS auth redirects to dept view after login | "Browser is redirected to `returnTo` path (or `/dashboard` if none)" + "When no `returnTo` path is present and the authenticated user has a department assignment, dashboard and case list views are pre-filtered to that user's department" | ✅ Aligned |
| SM-14.01 | US-14.1 | UUID key auto-generated; no manual UUID creation | "On save: `POST /api/clients` creates record and auto-generates UUID API key" | ✅ Aligned |
| SM-14.02 | US-14.1 | Key displayed once in copyable field | "The generated API key is displayed once on the post-creation confirmation screen in a copyable text input, accompanied by a clear 'Shown only once — copy now' label" + "The confirmation screen includes a 'Copy' button" | ✅ Aligned |
| SM-17.02 | US-17.3 | Transitions ≤ 300 ms; disabled by prefers-reduced-motion | "All motion durations ≤ 300 ms" + "`prefers-reduced-motion: reduce` disables all Framer Motion animations globally" | ✅ Aligned |
| SM-18.01 | US-18.1 | `/cases/new` loads without full-page reload | "All navigation is client-side routing (React Router); no full-page reloads" | ✅ Aligned |
| SM-19.01 | US-19.3 | 375 px; no horizontal scroll; ≥ 44 px touch targets | "Application renders correctly at 375 px" + "No horizontal scrolling" + "Touch targets ≥ 44 px on mobile" | ✅ Aligned |
| SM-20.01 | US-20.1 | Swagger at `/swagger-ui.html`; all endpoints documented | "Swagger UI accessible at `/swagger-ui.html`" + "Spec coverage 100%" | ✅ Aligned |
| SM-21.01 | US-21.1 | Clean DB bootstrapped via `flyway migrate` | "Clean PostgreSQL instance fully bootstrapped from scratch via `flyway migrate`" | ✅ Aligned |

**NaC Alignment Summary:**

| Status | Count | Notes |
|---|---|---|
| ✅ Fully Aligned | 33 | NaC testable condition directly covered by ≥1 AC checkbox |
| ⚠️ Partially Aligned | 0 | All previously partial NaC resolved — ACs updated in UserStories-UReport.md v1.1 |
| ❌ Not Aligned | 0 | No NaC contradicts or is uncovered by ACs |

**Resolution Note (v1.1):**

Five previously partially-aligned NaC were resolved by adding targeted acceptance criteria to the following stories in UserStories-UReport.md:
- **US-3.2** — Added: overdue badge with elapsed-days display; no SLA = no badge
- **US-5.1** — Added: department-scoped stat card counts for users with a department assignment; "Overdue" stat card link opens pre-filtered list
- **US-9.2** — Added: public submission acknowledgment email within 2 minutes; subject line format
- **US-12.1 / US-12.2** — Added: department-scoped view preference persists after login for users with a department assignment
- **US-14.1** — Added: one-time key display with "Shown only once" label, Copy button, masked view on subsequent edits, immediate key activation

---

*STORY-MAP-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
