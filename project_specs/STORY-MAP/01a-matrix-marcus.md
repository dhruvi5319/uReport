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
