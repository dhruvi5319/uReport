# User Stories — uReport CRM Modernization

**Project:** UReport  
**Version:** 1.0  
**Date:** 2026-07-06  
**Status:** Active  
**Depends On:** PRD-UReport.md v1.0, FRD-UReport.md v1.0, PERSONAS-UReport.md v1.0

---

## Personas

| ID | Name | Role |
|---|---|---|
| PER-01 | Marcus Rivera | 311 Operator / CRM Staff |
| PER-02 | Diane Kowalski | Department Field Supervisor |
| PER-03 | Jordan Calloway | System Administrator |
| PER-04 | Priya Nair | Constituent / Citizen Reporter |

---

## Priority Definitions

| Code | Meaning |
|---|---|
| P0 | Critical — blocks system operation or is a hard external contract |
| P1 | High — required for day-to-day staff workflows |
| P2 | Medium — important for management; does not block operations |
| P3 | Low — nice-to-have; deferred to post-MVP |

---

## Story ID Convention

Stories are numbered `US-{EpicNumber}.{StoryNumber}` where the epic number corresponds to the PRD feature ID (F0–F21).

---
## Epic 0: Open311 / GeoReport v2 API (F0)

The Open311 / GeoReport v2 API is a hard frozen contract consumed by external mobile apps and 311 aggregators. The Spring Boot backend must produce byte-level-compatible responses to the existing PHP implementation.

---

### US-0.1: List Available Services
**As a** mobile app developer (external client), **I want to** call `GET /open311/v2/services` and receive the same response structure as the existing PHP implementation, **so that** my app can display the city's available service categories without modification.

**Acceptance Criteria:**
- [ ] `GET /open311/v2/services` returns all active categories as a JSON array by default
- [ ] Each service object includes: `service_code`, `service_name`, `description`, `metadata`, `type`, `keywords`, `group`
- [ ] `format=xml` query parameter returns valid GeoReport v2 XML `<services>` document
- [ ] `Accept: application/xml` header also triggers XML response
- [ ] When `api_key` matches an OBSOLETE_API_KEYS entry, the mobile shutdown notice category list is returned instead
- [ ] `jurisdiction_id` parameter is accepted and ignored (single-jurisdiction deployment)
- [ ] Response is identical in field names and structure to the PHP reference implementation

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.2: Retrieve Service Requests with Filters
**As a** 311 aggregator developer, **I want to** call `GET /open311/v2/requests` with filter parameters (status, service_code, date range), **so that** I can retrieve a filtered list of service requests for display in my application.

**Acceptance Criteria:**
- [ ] Accepts filter parameters: `service_code`, `status`, `start_date`, `end_date`, `updated_before`, `updated_after`, `bbox`, `page_size`, `page`
- [ ] Each service request object includes all GeoReport v2 fields: `service_request_id`, `status`, `status_notes`, `service_name`, `service_code`, `description`, `agency_responsible`, `requested_datetime`, `updated_datetime`, `expected_datetime`, `address`, `lat`, `long`, `media_url`
- [ ] Malformed ISO 8601 date parameters return HTTP 400 with errors array
- [ ] Unknown `service_code` returns HTTP 404 with errors array
- [ ] `page_size=0` defaults to 1000; `page=0` treated as `page=1`
- [ ] JSON and XML responses available via format negotiation
- [ ] Results are paginated and match PHP implementation behavior

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.3: Submit a New Service Request via Open311
**As a** mobile app user, **I want to** submit a service request via `POST /open311/v2/requests` with my API key, **so that** I can report a civic issue through a third-party app and receive a case ID back.

**Acceptance Criteria:**
- [ ] `POST /open311/v2/requests` requires a valid `api_key` (query param or `X-Api-Key` header); missing/invalid key returns HTTP 403
- [ ] Required field `service_code` must reference an active category; unknown code returns HTTP 400
- [ ] Accepts optional fields: `lat`, `long`, `address_string`, `email`, `first_name`, `last_name`, `phone`, `description`, `account_id`, `media` (multipart)
- [ ] Open311 field names are mapped to internal ticket fields (`service_code` → `category_id`, `address_string` → `location`, etc.)
- [ ] Returns HTTP 200 with a single-element array containing the created service request object
- [ ] `service_request_id` in response contains the new ticket ID
- [ ] Media upload failure is silently ignored — ticket is still created and returned
- [ ] Email format is validated if provided

**Priority:** P0 | **Feature Ref:** F0

---

### US-0.4: Retrieve a Single Service Request by ID
**As a** mobile app developer, **I want to** call `GET /open311/v2/requests/{service_request_id}`, **so that** I can show a constituent the current status of their specific report.

**Acceptance Criteria:**
- [ ] Returns HTTP 200 with a single-element array containing the service request object
- [ ] Response field schema matches `GET /open311/v2/requests` list items exactly
- [ ] Non-existent ticket ID returns HTTP 404 with errors array
- [ ] Ticket with `allowsDisplay() = false` for the requesting context returns HTTP 403
- [ ] Format negotiation (JSON/XML) works identically to other Open311 endpoints
- [ ] Response is byte-level compatible with PHP implementation for same ticket ID

**Priority:** P0 | **Feature Ref:** F0

---
## Epic 1: Ticket / Case Lifecycle Management (F1)

The ticket is the core domain entity. Staff create, assign, update, close, reopen, and bulk-manage tickets through the React UI. Every state transition is recorded in the immutable ticket history.

---

### US-1.1: Create a New Ticket from a Phone Call
**As a** Marcus Rivera (311 Operator), **I want to** create a new ticket quickly from a form at `/cases/new`, **so that** I can intake a caller's service request and immediately redirect them to a case ID without interrupting the call.

**Acceptance Criteria:**
- [ ] `/cases/new` route is accessible to authenticated staff and loads without full page reload
- [ ] Required fields: category (dropdown from active categories), description, and at least one location signal (address or lat/lon)
- [ ] Optional fields: reporter person (search/select or inline create), assignee person, issue type, contact method
- [ ] On submit, ticket is created with `status = 'open'`, `enteredDate = NOW()`, `enteredByPerson_id = current user`
- [ ] A `ticket_history` "open" entry is created automatically on ticket creation
- [ ] If assignee is set, an additional "assignment" history entry is created and email notification sent to assignee
- [ ] Successful submission redirects to `/cases/{id}` and shows toast "Case #{id} created successfully"
- [ ] New case form completes end-to-end in under 90 seconds for a typical entry

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: Close a Ticket with a Substatus
**As a** Marcus Rivera (311 Operator), **I want to** close a ticket from the case detail screen with a required substatus selection, **so that** the ticket is accurately categorized (Resolved, Duplicate, Bogus) and the reporter is notified.

**Acceptance Criteria:**
- [ ] "Close Case" button opens a confirmation dialog with a required substatus dropdown
- [ ] Available substatuses: Resolved, Duplicate, Bogus, and any custom configured substatuses
- [ ] When substatus = Duplicate, a parent ticket ID input appears and is required before confirming
- [ ] Optional closing notes can be entered in the dialog
- [ ] On confirm: `tickets.status = 'closed'`, `closedDate = NOW()`, `substatus_id` set to selected value
- [ ] If Duplicate: `tickets.parent_id` is set to the specified parent ticket ID
- [ ] A `ticket_history` "closed" entry is created with closing notes
- [ ] Email notification is sent to reporter if notification toggle was enabled
- [ ] Status badge on case detail updates immediately to reflect closed state
- [ ] Attempting to close without selecting substatus shows inline validation error

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: Reopen a Closed Ticket
**As a** Marcus Rivera (311 Operator), **I want to** reopen a closed ticket from the case detail screen, **so that** I can resume managing a case that was prematurely closed or has recurred.

**Acceptance Criteria:**
- [ ] "Reopen" button is visible on case detail when `tickets.status = 'closed'`
- [ ] Clicking "Reopen" shows a confirmation dialog with an optional notes field
- [ ] On confirm: `tickets.status = 'open'`, `closedDate = NULL`, `substatus_id = NULL`
- [ ] A `ticket_history` "open" (reopen) entry is created with optional notes
- [ ] Assignee is notified via email if notification is configured
- [ ] Status badge updates immediately from closed to open without full page reload
- [ ] The Close button reappears and the Reopen button is hidden after reopening

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.4: Assign a Ticket to a Staff Person
**As a** Marcus Rivera (311 Operator), **I want to** assign a ticket to a specific staff person or department, **so that** the right person receives notification and takes ownership of the case.

**Acceptance Criteria:**
- [ ] Assignee field on case detail shows a searchable person selector (filtered to staff roles)
- [ ] Saving the assignment updates `tickets.assignedPerson_id`
- [ ] A `ticket_history` "assignment" entry is created referencing the new assignee
- [ ] Email notification is sent to the new assignee if they have a notification email configured
- [ ] Reassigning from one person to another creates a new history entry and sends a new notification
- [ ] Assignment can also be made from a bulk operation on the case list (see US-3.5)
- [ ] Toast "Case updated" confirms the save without page reload

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.5: Perform Bulk Operations on Multiple Tickets
**As a** Marcus Rivera (311 Operator), **I want to** select multiple tickets from the case list and perform bulk assign, close, or status-change in one action, **so that** I can process batches of duplicate reports without touching each record individually.

**Acceptance Criteria:**
- [ ] Checkboxes on each case list row allow multi-select; "Select all on page" header checkbox selects all visible rows
- [ ] A bulk action toolbar appears when one or more checkboxes are selected
- [ ] Available bulk actions: Assign, Close, Change Status
- [ ] Bulk assign shows assignee selector dialog; bulk close shows substatus selector dialog
- [ ] On confirm: each selected ticket receives the action individually with its own `ticket_history` record
- [ ] A toast notification shows "X cases updated successfully" (and "Y failed" if any errors)
- [ ] Case list refreshes after bulk action without full page reload
- [ ] Closing tickets in bulk requires substatus selection (same validation as single close)

**Priority:** P0 | **Feature Ref:** F1

---
## Epic 2: Public Case Submission Form (F2)

The public-facing multi-step wizard allows constituents to submit 311 service requests without an account. It features Framer Motion animated transitions, map pin-drop, and photo upload — fully responsive at 375 px.

---

### US-2.1: Complete the Multi-Step Submission Wizard on Mobile
**As a** Priya Nair (Constituent), **I want to** complete a service request submission on my phone using a guided multi-step form, **so that** I can report a civic issue in under 5 minutes without creating an account or encountering a confusing single-page form.

**Acceptance Criteria:**
- [ ] Public form is accessible at `/submit` with no login required
- [ ] Form is divided into 5 steps: Contact Info → Category → Location → Description/Photos → Review
- [ ] A step indicator (1–5) shows current position and completed steps (checkmark on completed steps)
- [ ] Framer Motion animated transitions between steps complete in ≤ 300 ms
- [ ] `prefers-reduced-motion` disables all step transitions globally
- [ ] Forward navigation validates the current step before advancing; backward navigation is always allowed
- [ ] All form data is preserved across step navigation (React form context)
- [ ] Form renders correctly at 375 px viewport with no horizontal scroll
- [ ] All touch targets are ≥ 44 px
- [ ] Anonymous submission (skipping all contact info) is permitted with zero friction

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: Drop a Map Pin to Identify Issue Location
**As a** Priya Nair (Constituent), **I want to** drop a pin on an interactive map instead of typing a street address, **so that** I can precisely identify the issue location when I'm standing near an unmarked spot.

**Acceptance Criteria:**
- [ ] Step 3 (Location) renders an interactive Mapbox GL JS or Leaflet map at zoom level 13 centered on city center
- [ ] Typing in the address field triggers autocomplete suggestions after 300 ms debounce (via Mapbox Geocoding API or Nominatim fallback)
- [ ] Selecting an autocomplete suggestion centers the map and places a pin; lat/lon and formatted address are stored in form state
- [ ] Clicking or touching the map places a draggable pin; lat/lon and reverse-geocoded address are stored in form state
- [ ] If Mapbox API key is unavailable, Leaflet renders with OSM tiles; geocoding degrades gracefully to manual address entry only
- [ ] At least one of address string or lat/lon must be provided before advancing to Step 4
- [ ] Geocoding failure shows an inline error; the map pin remains usable as fallback

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Upload a Photo from Phone Camera During Submission
**As a** Priya Nair (Constituent), **I want to** attach a photo directly from my phone camera or gallery during the submission wizard, **so that** I can provide photographic evidence of the civic issue.

**Acceptance Criteria:**
- [ ] Step 4 (Description/Photos) includes a file input with `accept="image/*" capture` for mobile camera access
- [ ] On desktop, a drag-and-drop zone and file picker button are provided
- [ ] Each selected file shows a thumbnail preview and a "remove" button
- [ ] Up to 10 files may be attached per submission; each must be ≤ 10 MB and JPEG/PNG/GIF
- [ ] Files are held in browser memory until final form submission (not uploaded on selection)
- [ ] Upload progress is shown per file during the final submission step
- [ ] Files exceeding 10 MB show an inline error "Photo exceeds maximum 10 MB size"
- [ ] Unsupported file types show an inline error "Only JPEG, PNG, and GIF photos are accepted"
- [ ] Photos are attached to the created ticket record upon successful submission

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.4: Receive a Confirmation Screen with Case ID
**As a** Priya Nair (Constituent), **I want to** receive a confirmation screen with my unique case ID after submitting, **so that** I have proof my report was received and can look up its status later.

**Acceptance Criteria:**
- [ ] After successful submission, Step 6 (Confirmation) renders: "Your report has been submitted. Case number: #{id}"
- [ ] A link to view the case status via the public Open311 endpoint is provided
- [ ] If an email address was provided, a confirmation email is sent to the reporter
- [ ] Network error on submit shows "Submission failed. Please try again." with a retry option
- [ ] The confirmation screen is accessible to screen readers with proper ARIA announcements
- [ ] Confirmation screen is fully readable at 375 px viewport

**Priority:** P0 | **Feature Ref:** F2

---
## Epic 3: Case List with Search, Filtering, and Sorting (F3)

The case list at `/cases` is the primary staff workspace — a sortable, filterable, paginated data grid with live search, filter chips, bulk selection, and saved searches.

---

### US-3.1: Search for a Case Using Live Full-Text Search
**As a** Marcus Rivera (311 Operator), **I want to** type a search term into the case list and see filtered results appear automatically, **so that** I can locate any specific case in under 30 seconds without submitting a separate search form.

**Acceptance Criteria:**
- [ ] A search input field is present above the case list table
- [ ] After 300 ms of inactivity (debounce), the list auto-refreshes with matching results
- [ ] Search covers: ticket ID, description, reporter name, address, category name
- [ ] Matching description text is highlighted with `<mark>` elements (from `ts_headline` API response)
- [ ] Search term of max 255 characters is enforced; excess is trimmed
- [ ] Empty search term returns the full unfiltered list (with other active filters preserved)
- [ ] Skeleton loader rows appear during search fetch
- [ ] Empty state renders "No cases match your filters" when search returns zero results
- [ ] Search state is encoded in the URL query string for shareability

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.2: Filter the Case List by Multiple Criteria
**As a** Diane Kowalski (Department Field Supervisor), **I want to** filter the case list by department, status, and date range simultaneously, **so that** I can immediately see only the open cases assigned to my department without sorting through irrelevant records.

**Acceptance Criteria:**
- [ ] A filter panel exposes controls for: status, substatus, category group, category, department, assignee, date range (start/end), issue type
- [ ] Each applied filter generates a filter chip above the table showing the active value with an "×" remove button
- [ ] Removing a filter chip immediately re-fetches the list with that filter cleared
- [ ] "Clear all filters" button removes all active filters at once
- [ ] Filter state is encoded in the URL query string (bookmarkable, shareable)
- [ ] `start_date` must be ≤ `end_date` when both are provided; inline error shown otherwise
- [ ] Filter changes take effect immediately (no "Apply" button needed)
- [ ] Status badge pills are color-coded: open=blue, closed-resolved=green, closed-duplicate=gray, closed-bogus=red, closed-other=purple
- [ ] Open tickets that have exceeded their category's `slaDays` threshold display a red "Overdue" badge in the case list row; the badge shows the number of elapsed days (e.g., "12 days") visible without opening the record
- [ ] Tickets in categories with no `slaDays` configured do not display an overdue badge

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.3: Sort the Case List by Column
**As a** Marcus Rivera (311 Operator), **I want to** click column headers to sort the case list, **so that** I can prioritize by date submitted, category, or status without building a manual query.

**Acceptance Criteria:**
- [ ] Clicking a column header sorts ascending; clicking again sorts descending
- [ ] Sortable columns: Case ID, Date Submitted, Category, Department, Assignee, Status, Location
- [ ] Active sort column shows a directional arrow indicator
- [ ] Sort state is encoded in URL query parameters (`sort`, `dir`)
- [ ] Unknown sort column value defaults to `enteredDate DESC`
- [ ] Sort and filter state are preserved together in the URL

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.4: Paginate Through the Case List
**As a** Marcus Rivera (311 Operator), **I want to** navigate pages of cases and choose how many results per page, **so that** I can work efficiently through large queues without the browser slowing down.

**Acceptance Criteria:**
- [ ] Pagination controls show: previous, next, and page number buttons
- [ ] Page size selector offers options: 10, 25, 50, 100
- [ ] A "Showing X–Y of Z cases" indicator is displayed above or below the table
- [ ] Page state is encoded in the URL (`page`, `pageSize`)
- [ ] Invalid `pageSize` values default to 10

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.5: Save a Search as a Bookmark for Quick Recall
**As a** Diane Kowalski (Department Field Supervisor), **I want to** save my department's filter configuration as a named bookmark, **so that** I can recall it with one click every time I open the case list instead of re-applying filters each session.

**Acceptance Criteria:**
- [ ] A "Save Search" button is available when filters or a search term are active
- [ ] Clicking "Save Search" opens a dialog prompting for a bookmark name
- [ ] On save, a `bookmarks` record is created: `person_id = current user`, `name = entered name`, `requestUri = current URL query string`
- [ ] Saved searches appear in a "Saved Searches" dropdown for quick recall
- [ ] Recalling a bookmark navigates to the saved URL, restoring all filter and search state
- [ ] Saved searches can be deleted individually
- [ ] Toast "Search saved" confirms the bookmark creation

**Priority:** P0 | **Feature Ref:** F3

---

### US-3.6: Export Case List Results to CSV
**As a** Marcus Rivera (311 Operator), **I want to** export the current filtered case list to CSV, **so that** I can share or process the data outside the application.

**Acceptance Criteria:**
- [ ] An "Export" button is present in the case list toolbar
- [ ] Export applies all current search, filter, and sort parameters
- [ ] Exporting an empty result set shows toast "No cases to export" (HTTP 400)
- [ ] Downloaded file is a valid CSV with column headers matching the table columns
- [ ] Export preserves existing report formats from the PHP implementation

**Priority:** P0 | **Feature Ref:** F3

---
## Epic 4: Case Detail View (F4)

The case detail at `/cases/{id}` shows the complete ticket record in a split-pane layout. Staff perform all management actions — status transitions, response logging, field editing, media attachment — without navigating away.

---

### US-4.1: View Complete Case Metadata and History on One Screen
**As a** Marcus Rivera (311 Operator), **I want to** view all case metadata and the full action history on a single screen when a caller asks for a status update, **so that** I never need to navigate to multiple screens during a live call.

**Acceptance Criteria:**
- [ ] Case detail at `/cases/{id}` shows a split-pane layout: metadata panel (left) + timeline panel (right)
- [ ] Metadata panel displays: Case ID, status badge, substatus, category, department, assignee, reporter, location, contact method, issue type, entered date, closed date, SLA indicator
- [ ] An interactive map pin shows the ticket's geographic location in the metadata panel
- [ ] Timeline panel shows all `ticket_history` entries chronologically, each with: action type icon, actor name, date, notes, and any attached media
- [ ] Parallel data requests are made on load: ticket metadata, history, and media fetched simultaneously
- [ ] Skeleton placeholders display while data is loading
- [ ] On mobile (≤ 768 px), layout stacks: metadata → action form → timeline
- [ ] Breadcrumb shows `Cases > Case #ID`; back link preserves case list filter state

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.2: Edit Case Fields Inline Without Leaving the Screen
**As a** Marcus Rivera (311 Operator), **I want to** edit ticket fields (category, assignee, location, description) inline on the case detail screen, **so that** I can update a case without navigating to a separate edit form.

**Acceptance Criteria:**
- [ ] Editable fields show an "Edit" icon; clicking it transitions the field to an editable control (input, dropdown, or date picker)
- [ ] "Save" commits the change via `PATCH /api/tickets/{id}`; "Cancel" restores the original value
- [ ] On save, a `ticket_history` entry is created for the field change (e.g., "changeCategory", "changeLocation")
- [ ] Optimistic UI: field shows new value immediately; reverts on API error with error toast
- [ ] Closed tickets are read-only for standard staff; only admin role can edit closed ticket fields
- [ ] Toast "Case updated" confirms each save
- [ ] Field validation: category must be active, assignee must be staff, lat/lon must be in valid range

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.3: Log a Response and Optionally Notify the Reporter
**As a** Diane Kowalski (Department Field Supervisor), **I want to** log a response on a case with optional email notification to the reporter, **so that** the 311 operator and the constituent are both informed of what action was taken.

**Acceptance Criteria:**
- [ ] An action log form at the top of the timeline panel shows: action type dropdown, notes textarea, "Notify Reporter" toggle, "Notify Assignee" toggle
- [ ] Action type dropdown shows only actions of type `department` that are permitted for the ticket's department (`department_actions`)
- [ ] Admin users see all department actions regardless of department filtering
- [ ] Notes are required when action type is "response"; optional for other types
- [ ] On submit: `POST /api/tickets/{id}/history` creates the history entry
- [ ] If "Notify Reporter" is checked and reporter has a notification email, email is sent
- [ ] Email delivery failure is non-fatal: history entry is saved and a warning toast appears "Email notification failed to send"
- [ ] New timeline entry appears at the top of the history panel without full page reload
- [ ] `sentNotifications` JSON field records which email addresses were actually notified

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.4: Use a Response Template to Pre-Fill Action Notes
**As a** Diane Kowalski (Department Field Supervisor), **I want to** select a pre-written response template when logging an action, **so that** I can send consistent, professional responses without retyping boilerplate text for every case closure.

**Acceptance Criteria:**
- [ ] A "Select template" dropdown is available in the action log form
- [ ] Templates are loaded from `category_action_responses` for the current ticket's category + selected action type
- [ ] If no category-specific template exists, the fallback is `actions.template` for the selected action type
- [ ] Selecting a template pre-fills the notes textarea; staff can edit before submitting
- [ ] Template variables (e.g., `{actionPerson}`, `{reportedByPerson}`) are rendered server-side before returning to the frontend
- [ ] Changing the action type resets the template selector

**Priority:** P0 | **Feature Ref:** F4

---
## Epic 5: Dashboard (F5)

The dashboard at `/dashboard` is the landing screen for authenticated staff, providing an at-a-glance operational overview with stat cards, a recent cases feed, a geo-clustered map widget, and a status donut chart.

---

### US-5.1: View Operational KPIs on the Dashboard
**As a** Marcus Rivera (311 Operator), **I want to** see stat cards on the dashboard showing total open cases, opened today, closed today, and overdue cases when I arrive each morning, **so that** I can immediately understand the current workload without manually filtering the case list.

**Acceptance Criteria:**
- [ ] Dashboard loads at `/dashboard` after authentication
- [ ] Four stat cards display: Total Open, Opened Today, Closed Today, Overdue
- [ ] Each card shows a numeric count and a descriptive label
- [ ] "Overdue" is calculated as open tickets where `NOW() > enteredDate + slaDays` (tickets in categories with no SLA are excluded)
- [ ] Skeleton loaders appear while stat data is fetching
- [ ] Each card is a link: clicking it navigates to `/cases` with the corresponding filter pre-applied
- [ ] All stat cards load within ≤ 2 seconds
- [ ] On API failure, card shows "—" with a retry icon
- [ ] For users with a department assignment (e.g., `staff` role with a department), all four stat cards are scoped to show counts for that department only; system-wide totals are shown for `admin` role users without a department scope
- [ ] The "Overdue" stat card link navigates to `/cases` pre-filtered to overdue cases for the current user's department (where applicable) — no additional manual filter setup is required

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.2: Review the Recent Cases Feed on the Dashboard
**As a** Marcus Rivera (311 Operator), **I want to** see the 10 most recently submitted cases in a feed on the dashboard, **so that** I can spot new incoming cases and navigate to them quickly.

**Acceptance Criteria:**
- [ ] Recent cases feed shows the last 10 tickets ordered by `enteredDate DESC`
- [ ] Each feed row shows: Case ID badge, Category name, Reporter last name, Status badge pill, time-since label (e.g., "2 hours ago")
- [ ] Clicking a feed row navigates to `/cases/{id}`
- [ ] "View all open cases" link at the bottom navigates to `/cases?status=open`
- [ ] Skeleton placeholders display while feed data is loading
- [ ] On API failure, feed shows an error state with a retry button

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.3: View Open Cases on the Dashboard Map Widget
**As a** Marcus Rivera (311 Operator), **I want to** see open cases displayed as clustered pins on the dashboard map, **so that** I can understand the geographic distribution of active cases at a glance.

**Acceptance Criteria:**
- [ ] Map widget renders using Mapbox GL JS (primary) or Leaflet (fallback if Mapbox key absent)
- [ ] Initial view is centered on city center at zoom 11 (configurable)
- [ ] Open case pins are clustered using `geoclusters` table data at low zoom levels
- [ ] Each cluster bubble shows a count of constituent tickets
- [ ] Clicking a cluster zooms in to reveal individual pins
- [ ] Clicking an individual pin shows a popover: ticket ID, category, status, and a link to case detail
- [ ] Map loads within ≤ 2 seconds; shows error tile overlay on map tile load failure
- [ ] If Mapbox key is absent, Leaflet with OSM tiles renders automatically without user-visible error

**Priority:** P1 | **Feature Ref:** F5

---

### US-5.4: Use Quick-Link Buttons to Navigate from the Dashboard
**As a** Diane Kowalski (Department Field Supervisor), **I want to** click quick-link buttons on the dashboard to jump to filtered case views, **so that** I can reach my assigned open cases with a single click instead of re-applying filters.

**Acceptance Criteria:**
- [ ] Three quick-link buttons are visible: "New Case" → `/cases/new`, "All Open Cases" → `/cases?status=open`, "Assigned to Me" → `/cases?status=open&assignedPerson_id={currentUserId}`
- [ ] Buttons are prominently styled and keyboard-accessible
- [ ] Dashboard layout is a responsive grid: 2-column on tablet/desktop, single-column on mobile
- [ ] Status donut chart shows open vs. closed case ratio with a legend
- [ ] Chart can be toggled to group by category or department via a "By Category" / "By Department" button
- [ ] On chart API failure, chart area shows "Chart unavailable" message

**Priority:** P1 | **Feature Ref:** F5

---
## Epic 6: People Management (F6)

The people management admin panel at `/admin/people` allows administrators to manage staff, reporters, and contacts — including multiple emails, phones, and addresses per person, with role and department assignment.

---

### US-6.1: List and Search People
**As a** Jordan Calloway (System Administrator), **I want to** list all people in the system with search and role filtering, **so that** I can quickly find any staff member or reporter record without scrolling through hundreds of entries.

**Acceptance Criteria:**
- [ ] `/admin/people` shows a table of all people: Name, Organization, Department, Role, Username, Email count, Actions (Edit / Delete)
- [ ] A search input (300 ms debounce) filters by name, email, or username
- [ ] A role filter dropdown offers: All, Admin, Staff, Public
- [ ] Table paginates for large people lists
- [ ] Skeleton loader rows show while data is fetching

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.2: Create a New Staff Person Record
**As a** Jordan Calloway (System Administrator), **I want to** create a new person record with name, role, department, and username, **so that** a new staff hire can log in and be assigned tickets on their first day.

**Acceptance Criteria:**
- [ ] A "New Person" button opens a side Sheet (shadcn/ui) with the create form
- [ ] Required: at least one of first name, last name, or organization name
- [ ] Optional fields: middle name, organization, department (dropdown), role (Admin/Staff/Public), username (max 40 chars, must be unique)
- [ ] Sub-panels allow adding email addresses (each with label and `usedForNotifications` flag), phone numbers (with label), and mailing addresses (with label)
- [ ] On save: `POST /api/people` creates the person and all nested contact records
- [ ] Duplicate username returns toast "Username already in use" without closing the form
- [ ] Toast "Person created" and sheet closes on success; list refreshes

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.3: Edit a Person and Manage Their Contact Records
**As a** Jordan Calloway (System Administrator), **I want to** edit an existing person's details and add, edit, or remove their email addresses, **so that** their notification preferences and contact information stay current.

**Acceptance Criteria:**
- [ ] Clicking "Edit" on a person row opens the Sheet pre-filled with all person data
- [ ] Email sub-panel allows adding new email records, editing existing ones (label, notification flag), and removing emails
- [ ] Phone and address sub-panels allow the same add/edit/remove pattern
- [ ] `usedForNotifications = true` emails must be valid email format; invalid format shows inline error
- [ ] On save: `PUT /api/people/{id}` sends the full updated record including nested contact arrays
- [ ] System reconciles contact records: adds new, updates existing, removes deleted ones
- [ ] Toast "Person updated" confirms success; form closes

**Priority:** P1 | **Feature Ref:** F6

---

### US-6.4: Delete a Person with Safety Check
**As a** Jordan Calloway (System Administrator), **I want to** delete a person record with a confirmation dialog and a system safety check, **so that** I can remove departed employees without accidentally corrupting ticket data.

**Acceptance Criteria:**
- [ ] Clicking "Delete" on a person row shows a confirmation dialog: "Are you sure you want to delete {name}?"
- [ ] If the person is referenced as a reporter, assignee, or enteredBy on any ticket, the delete is blocked with: "Cannot delete: this person is associated with {N} tickets."
- [ ] If safe to delete: `DELETE /api/people/{id}` removes the person and cascades related email/phone/address records
- [ ] Toast "Person deleted"; list refreshes
- [ ] Only admin role users can delete person records

**Priority:** P1 | **Feature Ref:** F6

---
## Epic 7: Department Management (F7)

Departments at `/admin/departments` are organizational units that own categories and receive ticket assignments. Admins manage department records, default assignees, action types, and category associations.

---

### US-7.1: List, Create, and Edit Departments
**As a** Jordan Calloway (System Administrator), **I want to** create and edit department records with a name and optional default assignee, **so that** new organizational units can be configured and tickets routed to them correctly.

**Acceptance Criteria:**
- [ ] `/admin/departments` shows a table: Department Name, Default Person, Category Count, Actions (Edit / Delete)
- [ ] "New Department" button opens a side Sheet with form fields: name (required, max 128 chars), default person (search/select, optional)
- [ ] On save: `POST /api/departments` creates the record; toast "Department created"; list refreshes
- [ ] Clicking "Edit" opens the Sheet pre-filled with department data
- [ ] Edit sheet includes sub-panels: Default Person (search/select with clear button), Action Types (checklist of all `actions` records), Categories (read-only list linking to category admin)
- [ ] Saving edit: `PUT /api/departments/{id}` updates the record and reconciles `department_actions` join table
- [ ] Missing department name shows inline validation error "Department name is required"

**Priority:** P1 | **Feature Ref:** F7

---

### US-7.2: Delete a Department with Safety Check
**As a** Jordan Calloway (System Administrator), **I want to** delete a department with a confirmation dialog and a safety check for associated categories, **so that** I cannot accidentally orphan categories that belong to it.

**Acceptance Criteria:**
- [ ] Clicking "Delete" shows confirmation dialog: "Delete {name}? This cannot be undone."
- [ ] If any category references this department (`categories.department_id`), delete is blocked with: "Cannot delete: department has associated categories."
- [ ] If safe: `DELETE /api/departments/{id}` removes the record; `department_actions` rows cascade-deleted
- [ ] Toast "Department deleted"; list refreshes
- [ ] Only admin role users can delete departments

**Priority:** P1 | **Feature Ref:** F7

---
## Epic 8: Category and Category Group Management (F8)

The category admin panel at `/admin/categories` manages the full taxonomy of service request types, their groupings, department assignments, permission levels, SLA configuration, and response templates.

---

### US-8.1: Create a New Category Group
**As a** Jordan Calloway (System Administrator), **I want to** create a new category group with a name and display order, **so that** related service types are organized together in the public submission form and Open311 API.

**Acceptance Criteria:**
- [ ] `/admin/categories` shows category groups in `ordering` sequence with expand/collapse to show child categories
- [ ] "New Group" button opens a form: name (required, max 50 chars), ordering (optional positive integer)
- [ ] `POST /api/category-groups` creates the group; toast "Category group saved"; list refreshes
- [ ] Delete group button shows confirmation dialog; delete is blocked with 409 if the group has associated categories
- [ ] Editing an existing group via "Edit" updates name/ordering via `PUT /api/category-groups/{id}`

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.2: Create and Fully Configure a New Category
**As a** Jordan Calloway (System Administrator), **I want to** create a new service category with department assignment, permission levels, SLA, and response templates in a single form, **so that** 311 operators can classify tickets in the new category within 10 minutes of setup.

**Acceptance Criteria:**
- [ ] "New Category" button opens a Sheet with sections: Basic, Permissions, Assignment, SLA, Auto-close, Response Templates
- [ ] Required fields: name (max 50 chars), department (dropdown)
- [ ] Optional fields: description, category group, active flag, featured flag, default person, SLA days, notification reply email, auto-close substatus
- [ ] `displayPermissionLevel` and `postingPermissionLevel` must each be one of: staff, public, anonymous
- [ ] `postingPermissionLevel` must be ≥ permissive as `displayPermissionLevel` (validated on save)
- [ ] `autoCloseSubstatus_id` is required when `autoCloseIsActive = true`
- [ ] Response Templates sub-panel allows adding/editing/removing `category_action_responses` entries (action type selector + template body + reply email)
- [ ] On save: `POST /api/categories` with nested response templates array; system reconciles
- [ ] Toast "Category saved"; sheet closes; list refreshes

**Priority:** P1 | **Feature Ref:** F8

---

### US-8.3: Delete a Category with Safety Check
**As a** Jordan Calloway (System Administrator), **I want to** delete a category with a confirmation dialog and a ticket safety check, **so that** I cannot remove a category that still has associated service requests.

**Acceptance Criteria:**
- [ ] Clicking "Delete" on a category shows confirmation dialog
- [ ] If any ticket references this category (`tickets.category_id`), delete is blocked with 409: "Cannot delete: category has associated tickets."
- [ ] If safe: `DELETE /api/categories/{id}` removes the category and cascades `category_action_responses`
- [ ] Toast "Category deleted"; list refreshes

**Priority:** P1 | **Feature Ref:** F8

---
## Epic 9: Action / Response Logging and Email Notifications (F9)

Every significant event on a ticket is recorded as an immutable `ticket_history` entry. System actions are auto-created; department actions are user-selectable. Email notifications are dispatched via SMTP.

---

### US-9.1: Automatic System Action Created on Ticket Events
**As a** Marcus Rivera (311 Operator), **I want to** see every structural ticket event (open, assignment, close, category change, location change) automatically recorded in the timeline without any manual input, **so that** the audit trail is always complete and accurate.

**Acceptance Criteria:**
- [ ] "open" action entry is created automatically when a ticket is created or reopened
- [ ] "assignment" action entry is created automatically when assignee changes
- [ ] "closed" action entry is created automatically when ticket is closed
- [ ] "changeCategory" action entry is created automatically when category field is edited
- [ ] "changeLocation" action entry is created automatically when location field is edited
- [ ] "duplicate" action entry is created automatically when ticket is marked as a duplicate
- [ ] "upload_media" action entry is created automatically when media is attached
- [ ] Each system action entry includes: `ticket_id`, `enteredByPerson_id`, `enteredDate`, `actionDate`, `action_id`
- [ ] System action types cannot be manually selected in the action log form dropdown

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.2: Send Email Notification to Reporter on Action
**As a** Marcus Rivera (311 Operator), **I want to** check a "Notify Reporter" box when logging an action and have an email sent automatically, **so that** the constituent receives a professional update without me copying and pasting case details into a separate email.

**Acceptance Criteria:**
- [ ] "Notify Reporter" and "Notify Assignee" toggles are available in the action log form
- [ ] Email is sent only if the recipient has at least one email with `usedForNotifications = true`
- [ ] Email subject: "[uReport] Case #{id} — {action name}"
- [ ] Email body: action notes + standard case link footer
- [ ] Reply-to uses `category_action_responses.replyEmail` if set, else `actions.replyEmail`, else system default
- [ ] `sentNotifications` JSON field on the history entry records all email addresses actually notified
- [ ] Email delivery failure is non-fatal: history entry is saved regardless; toast "Email notification failed to send" warns the user
- [ ] Email is delivered via configured SMTP server (host/port/credentials in Spring Boot app config)
- [ ] When a ticket is created via the public submission form and the reporter provided an email address, an acknowledgment email containing the case ID is sent within 2 minutes of successful submission (JTBD-04.3 success measure)
- [ ] The acknowledgment email for public submissions uses the subject "[uReport] Your report has been received — Case #{id}" and includes the case ID prominently in the body

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.3: Load Response Template into Action Notes
**As a** Diane Kowalski (Department Field Supervisor), **I want to** select a pre-configured response template for the current ticket's category and action type, **so that** I don't have to type repetitive resolution notes for common case types.

**Acceptance Criteria:**
- [ ] Template dropdown in action log form queries `GET /api/categories/{category_id}/action-responses/{action_id}`
- [ ] If no category-specific template exists, falls back to `GET /api/actions/{action_id}` template field
- [ ] Selecting a template pre-fills the notes textarea with the rendered template body
- [ ] Template variables (e.g., `{actionPerson}`, `{reportedByPerson}`) are rendered server-side before returning to frontend
- [ ] Staff may freely edit the pre-filled notes before submitting
- [ ] Changing the action type dropdown clears and resets the template selector

**Priority:** P0 | **Feature Ref:** F9

---
## Epic 10: Media / Photo Attachment Upload (F10)

Staff and public submitters can attach photos to tickets and action log entries. The modernized media handling supports multi-file upload, thumbnail preview, a lightbox gallery viewer, and deletion — all preserving existing media records from migration.

---

### US-10.1: Attach Photos to a Ticket at Creation (Staff)
**As a** Marcus Rivera (311 Operator), **I want to** drag-and-drop or pick photos on the New Case form, **so that** I can attach photographic evidence provided by the caller at the time of ticket creation.

**Acceptance Criteria:**
- [ ] New Case form includes a drag-and-drop zone and file picker button
- [ ] Selected files show thumbnail previews and individual "remove" buttons
- [ ] Up to 10 files per upload; each must be ≤ 10 MB and JPEG/PNG/GIF (MIME validated by magic bytes)
- [ ] Files are bundled with the ticket creation POST request (multipart/form-data)
- [ ] System generates an `internalFilename` (UUID + extension) and saves file to `{mediaRoot}/{ticket_id}/{internalFilename}`
- [ ] A `media` record is created for each file: `ticket_id`, `filename`, `internalFilename`, `mime_type`, `person_id = current user`
- [ ] File exceeding 10 MB shows error "File exceeds maximum 10 MB size" (HTTP 413)
- [ ] Unsupported MIME type shows error "Only JPEG, PNG, and GIF images are accepted" (HTTP 415)

**Priority:** P1 | **Feature Ref:** F10

---

### US-10.2: Attach a Photo to an Existing Ticket from the Field
**As a** Diane Kowalski (Department Field Supervisor), **I want to** attach a completion photo to an existing ticket from my phone while still at the job site, **so that** the case record has photographic evidence of the resolution without waiting until I return to the office.

**Acceptance Criteria:**
- [ ] "Attach Photo" button is available in the media gallery panel on case detail
- [ ] On mobile, file input uses `accept="image/*" capture` for native camera/gallery access
- [ ] `POST /api/tickets/{id}/media` accepts one or more files via multipart/form-data
- [ ] System processes each file: validates MIME by magic bytes, saves to disk, creates `media` record
- [ ] An "upload_media" system action entry is created in `ticket_history` for each upload
- [ ] Gallery thumbnails refresh immediately after upload; toast "Photo attached" confirms success
- [ ] Disk write failure returns HTTP 500: "File storage error — contact administrator"

**Priority:** P1 | **Feature Ref:** F10

---

### US-10.3: View Photos in the Case Detail Lightbox
**As a** Marcus Rivera (311 Operator), **I want to** click a photo thumbnail to view it full-size in a lightbox with navigation arrows, **so that** I can review photographic evidence without opening a new browser tab.

**Acceptance Criteria:**
- [ ] Case detail media gallery shows thumbnails (150×150 px) of all attached media, sorted by `media.uploaded ASC`
- [ ] Clicking a thumbnail opens a lightbox modal showing the full-resolution image
- [ ] Lightbox has previous/next buttons for navigating between multiple photos
- [ ] Each photo in lightbox shows: filename, upload date, uploader name
- [ ] Lightbox can be closed via "×" button or pressing Escape
- [ ] Focus is trapped inside the lightbox while open (ARIA modal pattern)
- [ ] Thumbnail URLs served at `GET /api/media/{mediaId}/thumbnail`; full-size at `GET /api/media/{mediaId}`
- [ ] Auth required for staff-only ticket media; public ticket media served without auth

**Priority:** P1 | **Feature Ref:** F10

---

### US-10.4: Delete an Attached Photo with Confirmation
**As a** Marcus Rivera (311 Operator), **I want to** delete an attached photo with a confirmation dialog, **so that** I can remove incorrectly attached files without permanent accidental deletion.

**Acceptance Criteria:**
- [ ] Hovering over a thumbnail reveals a delete button (icon button)
- [ ] Clicking delete shows confirmation dialog: "Delete this photo? This cannot be undone."
- [ ] On confirm: `DELETE /api/tickets/{id}/media/{mediaId}` removes the database record and the file on disk
- [ ] Gallery refreshes after deletion; toast "Photo deleted" confirms success
- [ ] Media not found returns HTTP 404: "Photo not found"
- [ ] Only authenticated staff may delete media from staff-only tickets

**Priority:** P1 | **Feature Ref:** F10

---
## Epic 11: PostgreSQL Full-Text Search — Solr Replacement (F11)

Full-text search across tickets is migrated from Apache Solr to PostgreSQL tsvector/tsquery with GIN indexes, delivering equivalent search behavior with sub-500 ms response times and highlighted keyword snippets.

---

### US-11.1: Search Tickets with PostgreSQL Full-Text Search
**As a** Marcus Rivera (311 Operator), **I want to** search tickets using the same fields I could search before (description, address, reporter name, category, ticket ID), **so that** the Solr replacement is transparent and my search workflows are uninterrupted.

**Acceptance Criteria:**
- [ ] `GET /api/tickets?q={term}` performs full-text search using `search_vector @@ plainto_tsquery('english', :q)`
- [ ] Search vector covers (with weights): ticket ID (A), description (B), location/address (B), reporter last name (C), reporter first name (C), category name (C)
- [ ] Results are ordered by relevance: `ts_rank_cd(search_vector, query) DESC`, then `enteredDate DESC`
- [ ] Empty or blank `q` returns the full unfiltered list (no FTS filter applied)
- [ ] Search term max 255 characters; excess trimmed before passing to `plainto_tsquery`
- [ ] Multi-word queries apply AND semantics; no special query syntax is exposed to users
- [ ] Full-text search query P95 ≤ 500 ms at up to ~100K tickets (GIN index required)

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.2: See Highlighted Keyword Matches in Search Results
**As a** Marcus Rivera (311 Operator), **I want to** see the matching portion of the ticket description highlighted in the search results list, **so that** I can immediately confirm that the right case was found without opening each one.

**Acceptance Criteria:**
- [ ] API response includes a `searchSnippet` field (PostgreSQL `ts_headline` output) for each search result
- [ ] `ts_headline` configuration: MaxWords=30, MinWords=10, StartSel=`<mark>`, StopSel=`</mark>`
- [ ] React renders the `searchSnippet` field using sanitized HTML (`DOMPurify` applied) in the description column
- [ ] `<mark>` elements visually highlight matching terms in the case list description column
- [ ] When search is cleared, `<mark>` highlighting disappears and normal description text renders

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.3: Search and Filter Can Be Combined
**As a** Diane Kowalski (Department Field Supervisor), **I want to** apply a text search AND department/status filters simultaneously, **so that** I can find "pothole" cases that are specifically open and assigned to my department.

**Acceptance Criteria:**
- [ ] When both `q` and filter parameters (`status`, `department_id`, etc.) are present, both conditions are applied with AND semantics
- [ ] SQL: `WHERE search_vector @@ plainto_tsquery('english', :q) AND status = :status AND ...`
- [ ] Active filter chips and search term coexist without clearing each other
- [ ] Saving a search bookmark with both a search term and active filters preserves the full URL query string

**Priority:** P0 | **Feature Ref:** F11

---

### US-11.4: Search Vector Auto-Maintained by Database Trigger
**As a** Jordan Calloway (System Administrator), **I want to** know that the `search_vector` column on tickets is automatically kept up to date by a database trigger, **so that** search results are always current without requiring manual re-indexing jobs (unlike Solr).

**Acceptance Criteria:**
- [ ] A PostgreSQL trigger `update_search_vector` fires on BEFORE INSERT OR UPDATE of `tickets`
- [ ] Trigger updates `tickets.search_vector` by joining to `people` (reporter) and `categories` to include all weighted fields
- [ ] GIN index `idx_tickets_search_vector ON tickets USING GIN (search_vector)` is created by Flyway migration `V2__search_vector.sql`
- [ ] No external indexing job or cron task is required to keep search current
- [ ] When a reporter's name changes in the `people` table, the corresponding `search_vector` entries are updated (via trigger or batch job)
- [ ] Flyway ensures the GIN index exists before the application goes live

**Priority:** P0 | **Feature Ref:** F11

---
## Epic 12: Authentication — LDAP and CAS (F12)

Staff authenticate via LDAP or CAS. Spring Security issues a JWT stored in an httpOnly cookie. Public users access the submission form without authentication. Branded login screens replace PHP auth views.

---

### US-12.1: Log In via CAS Single Sign-On
**As a** Marcus Rivera (311 Operator), **I want to** log in using my city SSO (CAS) credentials with a single click on the branded login screen, **so that** I don't need to remember a separate uReport password.

**Acceptance Criteria:**
- [ ] Navigating to a protected route while unauthenticated redirects to `/login?returnTo={originalPath}`
- [ ] Login screen shows the city logo, a "Sign in with CAS" button, a loading spinner on redirect, and an error state if auth fails
- [ ] Clicking "Sign in with CAS" redirects to the CAS server: `{casServer}/login?service={ureportBaseUrl}/auth/cas/callback`
- [ ] After CAS authenticates, browser is redirected to `/auth/cas/callback?ticket={serviceTicket}`
- [ ] Spring Security validates the service ticket; on success, looks up `people.username = principal` (creates minimal record if not found)
- [ ] JWT is issued: `{sub, role, personId, exp}` and set as an httpOnly, SameSite=Strict cookie named `auth_token`
- [ ] Browser is redirected to `returnTo` path (or `/dashboard` if none)
- [ ] React loads current user from `GET /api/auth/me` to confirm authentication
- [ ] When no `returnTo` path is present and the authenticated user has a department assignment, the dashboard stat cards and the "All Open Cases" quick-link navigate to case views pre-filtered to that user's department (the department filter preference is persisted in the session)

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.2: Log In via LDAP Credentials
**As a** Diane Kowalski (Department Field Supervisor), **I want to** log in with my LDAP username and password on the uReport login screen, **so that** I can access my department's case queue in environments where CAS is not available.

**Acceptance Criteria:**
- [ ] Login screen shows a username and password form (LDAP tab or fallback)
- [ ] Submitting credentials via `POST /api/auth/ldap` (JSON body) triggers Spring Security LDAP bind
- [ ] Successful bind creates/looks up `people` record by username; issues JWT httpOnly cookie
- [ ] Response body returns `{personId, role, name}` — JWT is in cookie only, not response body (XSS mitigation)
- [ ] React redirects to `returnTo` path after successful login; same department-scoped view behavior as CAS login applies
- [ ] Failed LDAP bind (wrong password/unknown user) shows error state on login screen
- [ ] LDAP and CAS are independently configurable per deployment

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.3: Session Expiry and Automatic Token Refresh
**As a** Marcus Rivera (311 Operator), **I want to** continue working without being abruptly logged out mid-shift, and to be redirected to login gracefully when my session does expire, **so that** call center work is not interrupted by unexpected authentication failures.

**Acceptance Criteria:**
- [ ] JWT expiry is configurable (recommended 8 hours for staff sessions)
- [ ] React reads `expiresAt` from `GET /api/auth/me` response and tracks expiry time
- [ ] 5 minutes before expiry, React calls `POST /api/auth/refresh` to silently renew the JWT
- [ ] Successful refresh issues a new JWT cookie with refreshed expiry
- [ ] If refresh fails (refresh token expired), React redirects to `/login?returnTo={currentPath}`
- [ ] Any 401 response from a protected API endpoint redirects to login with return URL preserved
- [ ] All API calls automatically include the httpOnly cookie (same-origin requests; no JavaScript access to JWT)

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.4: Sign Out and Invalidate the Session
**As a** Marcus Rivera (311 Operator), **I want to** sign out securely from the user menu, **so that** my session is fully terminated when I leave my workstation.

**Acceptance Criteria:**
- [ ] A "Sign Out" option is accessible in the user menu in the top navbar
- [ ] Clicking "Sign Out" calls `POST /api/auth/logout`
- [ ] Spring Boot clears the `auth_token` cookie (Set-Cookie: expires=past) and invalidates the refresh token
- [ ] If CAS is in use, browser is redirected to CAS logout URL for single sign-out
- [ ] React clears local auth state; redirects to `/login`
- [ ] After logout, navigating to any protected route redirects to login

**Priority:** P0 | **Feature Ref:** F12

---

### US-12.5: View and Update Own Profile on the Account Screen
**As a** Marcus Rivera (311 Operator), **I want to** view and update my profile information and notification email preferences at `/account`, **so that** I receive case notification emails at the correct address.

**Acceptance Criteria:**
- [ ] `/account` route shows the current user's name, email, username, department, and role
- [ ] User can update their profile fields (name, notification email preferences)
- [ ] Notification email with `usedForNotifications = true` is clearly indicated and editable
- [ ] Changes save via `PATCH /api/people/{currentUserId}`; toast "Profile updated" on success
- [ ] Account screen is accessible to all authenticated staff roles

**Priority:** P0 | **Feature Ref:** F12

---
## Epic 13: Admin Panels — Substatus, Issue Types, Response Templates, Contact Methods (F13)

A set of lookup-table admin panels allow administrators to manage configurable system values used throughout ticket creation and case management.

---

### US-13.1: Manage Substatus Values
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete substatus values (e.g., Resolved, Duplicate, Bogus), **so that** staff have accurate closure classification options that reflect current operational categories.

**Acceptance Criteria:**
- [ ] An admin panel (within `/admin`) lists all substatus values with name and Edit/Delete actions
- [ ] "New Substatus" button opens a form with a name field (required)
- [ ] On save: POST creates the substatus record; toast "Substatus saved"; list refreshes
- [ ] Edit opens the form pre-filled; PUT updates the record
- [ ] Delete shows confirmation dialog before executing
- [ ] Substatuses are available in the substatus selector on ticket close and bulk close dialogs
- [ ] Inline toast notification on every save action

**Priority:** P1 | **Feature Ref:** F13

---

### US-13.2: Manage Issue Types
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete issue types (Comment, Complaint, Question, Report, Request, Violation), **so that** operators can accurately classify the nature of each service request.

**Acceptance Criteria:**
- [ ] An admin panel lists all issue types with name and Edit/Delete actions
- [ ] "New Issue Type" button opens a form with a name field (required)
- [ ] On save: POST creates the issue type record; toast "Issue type saved"; list refreshes
- [ ] Issue types appear in the issue type dropdown on New Case form and Case Detail edit panel
- [ ] Delete shows confirmation dialog before executing
- [ ] Inline toast on every save action

**Priority:** P1 | **Feature Ref:** F13

---

### US-13.3: Manage Response Templates
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete global response templates with body text, **so that** 311 operators have a consistent library of pre-written responses to reduce data entry.

**Acceptance Criteria:**
- [ ] An admin panel lists all response templates with name, body preview, and Edit/Delete actions
- [ ] "New Template" button opens a form: name (required), body text (textarea, required)
- [ ] On save: POST creates the template; toast "Template saved"; list refreshes
- [ ] Edit opens the form pre-filled; PUT updates the record
- [ ] Delete shows confirmation dialog before executing
- [ ] Templates are available in the response template selector on the Case Detail action log form
- [ ] Category-level templates (`category_action_responses`) are managed within the category edit form (F8), not here

**Priority:** P1 | **Feature Ref:** F13

---

### US-13.4: Manage Contact Methods
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete contact method values (Email, Phone, Web Form, Other, custom), **so that** operators can accurately record how a constituent contacted the city.

**Acceptance Criteria:**
- [ ] An admin panel lists all contact methods with name and Edit/Delete actions
- [ ] "New Contact Method" button opens a form with a name field (required)
- [ ] On save: POST creates the contact method; toast "Contact method saved"; list refreshes
- [ ] Edit opens the form pre-filled; PUT updates the record
- [ ] Delete shows confirmation dialog before executing
- [ ] Contact methods appear in the contact method dropdown on New Case form and Case Detail inline edit
- [ ] Inline toast on every save action

**Priority:** P1 | **Feature Ref:** F13

---
## Epic 14: Client / API Key Management (F14)

External Open311 clients (mobile apps, aggregators) are registered in the system with a name, URL, API key, and contact person. The admin panel manages these records; the API key is validated for Open311 write operations.

---

### US-14.1: Register a New Open311 API Client
**As a** Jordan Calloway (System Administrator), **I want to** create a new Open311 client record and generate an API key, **so that** I can authorize a new mobile app vendor to submit service requests via the API in under 5 minutes.

**Acceptance Criteria:**
- [ ] An admin panel (within `/admin`) lists all registered Open311 clients with name, URL, contact person, and Actions (Edit / Delete)
- [ ] "New Client" button opens a form: client name (required), client URL (optional), contact person (search/select from people), contact method (dropdown)
- [ ] On save: `POST /api/clients` creates the record and auto-generates a UUID API key
- [ ] The generated API key is displayed once on the post-creation confirmation screen in a copyable text input, accompanied by a clear "Shown only once — copy now" label
- [ ] Navigating away from the confirmation screen does not show the full key again (subsequent view in edit form masks the key or shows a truncated prefix only)
- [ ] The confirmation screen includes a "Copy" button that copies the key to the clipboard
- [ ] Toast "Client registered"; list refreshes
- [ ] API key is validated by Spring Security filter for `POST /open311/v2/requests`
- [ ] The new API key is active immediately for `POST /open311/v2/requests` without requiring a service restart

**Priority:** P1 | **Feature Ref:** F14

---

### US-14.2: Edit and Delete an Open311 Client Record
**As a** Jordan Calloway (System Administrator), **I want to** edit a client's details or delete a revoked client's record, **so that** decommissioned integrations no longer have valid API access.

**Acceptance Criteria:**
- [ ] Clicking "Edit" on a client row opens the form pre-filled; PUT updates the record; toast "Client updated"
- [ ] API key is displayed (read-only) in the edit form; it does not regenerate on edit unless explicitly requested
- [ ] Clicking "Delete" shows confirmation dialog: "Delete {client name}? This will revoke their API access."
- [ ] On confirm: `DELETE /api/clients/{id}` removes the record; subsequent requests with this API key return HTTP 403
- [ ] Toast "Client deleted"; list refreshes

**Priority:** P1 | **Feature Ref:** F14

---
## Epic 15: Metrics and Reporting (F15)

The metrics and reporting screens give administrators and supervisors quantitative insight into case volume, response times, and category distribution — preserving the same calculated fields as the PHP Reports and Metrics screens.

---

### US-15.1: View Case Volume Over Time
**As a** Jordan Calloway (System Administrator), **I want to** view a chart of case volume over time (daily, weekly, monthly) with a date range filter, **so that** I can identify trends and report on service request activity to city leadership.

**Acceptance Criteria:**
- [ ] A Metrics screen displays case volume charts: daily, weekly, and monthly breakdowns
- [ ] A date range filter applies to all report sections
- [ ] Chart data matches the PHP implementation's calculated fields exactly (no regression in numbers)
- [ ] Metrics page route is preserved from the existing PHP application route structure
- [ ] Page loads within ≤ 2 seconds

**Priority:** P2 | **Feature Ref:** F15

---

### US-15.2: View Resolution Time and Case Breakdown Reports
**As a** Jordan Calloway (System Administrator), **I want to** view average resolution time by category and department, and open vs. closed ratios, **so that** I can identify departments with performance gaps and resource needs.

**Acceptance Criteria:**
- [ ] Reports screen displays: average resolution time by category, average resolution time by department, open vs. closed ratio, cases by category breakdown, cases by department breakdown, cases by assignee breakdown
- [ ] All breakdowns are filterable by date range
- [ ] Reports page route is distinct from Metrics page (preserving existing PHP route structure)
- [ ] Results can be exported to CSV
- [ ] Export of empty result set shows "No data to export" toast

**Priority:** P2 | **Feature Ref:** F15

---
## Epic 16: Geo-Clustering for Map Views (F16)

The geo-clustering feature pre-computes geographic clusters of ticket pins for legible map rendering in dense urban areas. Cluster data is migrated from MySQL to PostgreSQL and rendered via Mapbox GL JS / Leaflet.

---

### US-16.1: View Clustered Ticket Pins on the Map
**As a** Marcus Rivera (311 Operator), **I want to** see open ticket pins clustered into bubble groups on the dashboard map at low zoom levels, **so that** densely reported areas remain readable without overlapping pins.

**Acceptance Criteria:**
- [ ] At low zoom levels, the map shows cluster bubbles from the `geoclusters` table, each displaying the count of constituent tickets
- [ ] At high zoom levels, the map shows individual ticket pins from `ticket_geodata`
- [ ] Clicking a cluster bubble zooms in one level to reveal constituent clusters or individual pins
- [ ] Clicking an individual pin shows a popover: ticket ID, category, status, and a link to case detail
- [ ] Pre-computed `geoclusters` data is migrated from MySQL to PostgreSQL with no data loss
- [ ] Cluster rendering works with both Mapbox GL JS and Leaflet fallback

**Priority:** P2 | **Feature Ref:** F16

---

### US-16.2: View a Single Ticket Pin on Case Detail Map
**As a** Marcus Rivera (311 Operator), **I want to** see the exact location of a ticket displayed as a single pin on the map in the case detail view, **so that** I can verify the reported address is correct and understand the geographic context.

**Acceptance Criteria:**
- [ ] The case detail metadata panel includes a map widget showing a single pin at `tickets.latitude` / `tickets.longitude`
- [ ] If lat/lon is null (no coordinates), the map widget shows a "Location not set" placeholder
- [ ] The pin is not interactive (no click action needed) — display only
- [ ] Map tile load failure shows an error tile; case metadata is still displayed normally

**Priority:** P2 | **Feature Ref:** F16

---
## Epic 17: Design System and UI Framework (F17)

The React frontend is built on a custom design system: Tailwind CSS + shadcn/ui components + CSS variable design tokens. It enforces visual consistency, accessibility, light/dark mode, and Framer Motion animations across every screen.

---

### US-17.1: Use a Consistent, Branded Design System Across All Screens
**As a** Marcus Rivera (311 Operator), **I want to** experience a visually consistent, branded interface across all screens, **so that** I can build muscle memory for UI patterns and work without cognitive load from inconsistency.

**Acceptance Criteria:**
- [ ] Tailwind CSS extended config defines: custom color palette (primary, secondary, semantic), spacing scale, border-radius tokens
- [ ] shadcn/ui components (Button, Dialog, Input, Select, Badge, Card, Table, Skeleton, Toast, Sheet, Tabs, Popover, Command) are customized to city brand and used consistently throughout
- [ ] Inter font is used for all UI text; JetBrains Mono is used for ticket IDs, codes, and monospaced values
- [ ] 4 px base grid is applied consistently to all component sizing and spacing
- [ ] 3-tier elevation shadow system (low, medium, high) is applied to cards, modals, and dropdowns
- [ ] CSS custom property (variable) design tokens define all colors, spacing, and shadows

**Priority:** P0 | **Feature Ref:** F17

---

### US-17.2: Toggle Dark Mode and Have the Preference Persisted
**As a** Marcus Rivera (311 Operator), **I want to** switch to dark mode via the navbar toggle and have the preference remembered across sessions, **so that** I can work comfortably in low-light call center environments without re-toggling on every visit.

**Acceptance Criteria:**
- [ ] A dark mode toggle is present in the top navbar
- [ ] Dark mode is also activated automatically by `prefers-color-scheme: dark` media query
- [ ] Dark mode swaps CSS custom property values via `.dark` class on the root element
- [ ] Dark mode preference is persisted to `localStorage`
- [ ] Dark mode renders without color contrast violations (WCAG 4.5:1 for normal text, 3:1 for large text)
- [ ] Automated axe-core scan reports 0 critical contrast violations in dark mode

**Priority:** P0 | **Feature Ref:** F17

---

### US-17.3: Experience Smooth Animations Respecting Motion Preferences
**As a** Priya Nair (Constituent), **I want to** see smooth page transitions and micro-interactions, and have all animations automatically disabled if I've set "reduce motion" in my OS settings, **so that** the app is polished without causing discomfort for users sensitive to motion.

**Acceptance Criteria:**
- [ ] Framer Motion powers all page transitions, stagger animations, and micro-interactions throughout the app
- [ ] All motion durations are ≤ 300 ms
- [ ] `prefers-reduced-motion: reduce` media query disables all Framer Motion animations globally (motion is set to zero or instant)
- [ ] Public submission wizard step transitions use Framer Motion with ≤ 300 ms duration
- [ ] Animations do not block user interaction (transitions are decorative, not blocking)

**Priority:** P0 | **Feature Ref:** F17

---
## Epic 18: Navigation Shell — Navbar, Sidebar, Breadcrumbs, Mobile Drawer (F18)

The application chrome wraps every authenticated screen: a persistent top navbar, a collapsible admin sidebar, contextual breadcrumbs, and a mobile hamburger drawer.

---

### US-18.1: Navigate the Application Using the Persistent Navbar and Sidebar
**As a** Marcus Rivera (311 Operator), **I want to** use the top navbar and collapsible sidebar to navigate between all sections without ever losing my place in the case list, **so that** I can context-switch efficiently without full page reloads.

**Acceptance Criteria:**
- [ ] A persistent top navbar is visible on every authenticated screen: city logo/name, global search trigger, logged-in user avatar/menu, dark mode toggle
- [ ] A collapsible left sidebar shows navigation groups: Cases, People, Admin — each with relevant child links
- [ ] Active route is highlighted in the sidebar with a visual indicator
- [ ] Sidebar collapse/expand is smooth (CSS transition) and the state is persisted to `localStorage`
- [ ] All navigation is client-side routing (React Router); no full-page reloads
- [ ] Contextual breadcrumb trail below the navbar reflects the current route hierarchy
- [ ] Breadcrumb links are clickable and navigate to the corresponding parent route

**Priority:** P0 | **Feature Ref:** F18

---

### US-18.2: Navigate the Application on a Mobile Device via the Hamburger Drawer
**As a** Diane Kowalski (Department Field Supervisor), **I want to** access all navigation links on my phone via a hamburger menu drawer, **so that** I can navigate to my department's case queue while out in the field without needing a full desktop layout.

**Acceptance Criteria:**
- [ ] On viewports ≤ 768 px, the left sidebar is hidden and replaced by a hamburger menu icon in the navbar
- [ ] Clicking the hamburger icon opens a full-height Sheet (shadcn/ui) drawer with all navigation links
- [ ] The drawer contains the same navigation groups and links as the desktop sidebar
- [ ] Closing the drawer (via "×" button, Escape key, or overlay tap) returns focus to the hamburger icon
- [ ] All touch targets in the drawer are ≥ 44 px

**Priority:** P0 | **Feature Ref:** F18

---

### US-18.3: Use Keyboard Navigation and Skip Links for Accessibility
**As a** screen reader user, **I want to** skip directly to the main content area using a skip link, **so that** I don't have to tab through the entire navbar and sidebar on every page.

**Acceptance Criteria:**
- [ ] A "Skip to main content" link is the first focusable element on every page
- [ ] The skip link is visually hidden until it receives keyboard focus, at which point it becomes visible
- [ ] Activating the skip link moves focus to the main content area
- [ ] All navbar, sidebar, and breadcrumb interactive elements are keyboard-accessible (Tab, Enter, Space, Escape)
- [ ] Focus indicators are visible on all interactive elements throughout the navigation shell

**Priority:** P0 | **Feature Ref:** F18

---
## Epic 19: Accessibility and Responsive Design (F19)

Every screen and component must meet WCAG 2.1 Level AA and Section 508 requirements. Responsive breakpoints at 375 px, 768 px, and 1280 px+ ensure full usability across all device types.

---

### US-19.1: Access All Features Using Only a Keyboard
**As a** staff member with motor impairment, **I want to** navigate and operate every screen using only the keyboard (Tab, Shift+Tab, Enter, Space, Escape, arrow keys), **so that** I can do my job without a mouse.

**Acceptance Criteria:**
- [ ] All interactive elements (buttons, links, inputs, dropdowns, checkboxes) are reachable and operable via keyboard
- [ ] Focus order follows logical reading order on every screen
- [ ] Modal dialogs trap focus while open; closing the modal returns focus to the trigger element
- [ ] Dropdown menus and comboboxes support keyboard navigation (arrow keys, Enter to select, Escape to close)
- [ ] A manual keyboard-navigation audit passes for all core workflows: create ticket, search/filter list, close ticket, log action

**Priority:** P0 | **Feature Ref:** F19

---

### US-19.2: Use a Screen Reader to Operate the Application
**As a** staff member who uses a screen reader, **I want to** receive meaningful announcements for all dynamic content changes (status updates, toast notifications, skeleton-to-content transitions), **so that** I can operate the application independently without visual feedback.

**Acceptance Criteria:**
- [ ] All images have descriptive `alt` text
- [ ] All tables have proper `<thead>` headers with `scope` attributes
- [ ] All form inputs have associated `<label>` elements
- [ ] Status badge pills include an accessible text label (not conveyed by color alone)
- [ ] Toast notifications are announced via ARIA live region (`aria-live="polite"`)
- [ ] Skeleton-to-content transitions are announced (e.g., `aria-busy` on the loading container)
- [ ] Dynamic content updates (new timeline entry, filter chip added) are announced via live regions
- [ ] axe-core automated scan reports 0 critical or serious accessibility violations

**Priority:** P0 | **Feature Ref:** F19

---

### US-19.3: Use the Application Comfortably on a Mobile Device
**As a** Diane Kowalski (Department Field Supervisor), **I want to** access and operate all case management features on my phone at 375 px viewport, **so that** I can close cases and upload photos in the field without returning to the office.

**Acceptance Criteria:**
- [ ] Application renders correctly at 375 px, 768 px, and 1280 px+ breakpoints
- [ ] No horizontal scrolling occurs at any supported breakpoint
- [ ] All touch targets are ≥ 44 px on mobile
- [ ] Case detail splits into a stacked single-column layout on mobile (metadata → action form → timeline)
- [ ] Case list table adapts to mobile: columns collapse to a card-style layout or horizontal scroll with sticky first column
- [ ] Public submission form is fully functional at 375 px (no features require desktop)
- [ ] Admin panels are usable on tablet (768 px) for occasional admin tasks

**Priority:** P0 | **Feature Ref:** F19

---

### US-19.4: Read Content with Sufficient Color Contrast in Both Light and Dark Mode
**As a** staff member with low vision, **I want to** read all text and distinguish all UI elements with sufficient color contrast in both light and dark mode, **so that** I can work without eye strain and the application meets legal accessibility standards.

**Acceptance Criteria:**
- [ ] Normal text meets WCAG 2.1 AA contrast ratio ≥ 4.5:1 in both light and dark mode
- [ ] Large text (≥ 18 pt or ≥ 14 pt bold) meets contrast ratio ≥ 3:1
- [ ] Status badge pills (open/closed/substatus) meet contrast requirements for both badge background and text
- [ ] Focus indicators are visible against the background in both modes
- [ ] Automated scan in dark mode reports 0 critical contrast violations (axe-core)

**Priority:** P0 | **Feature Ref:** F19

---
## Epic 20: OpenAPI / Swagger API Documentation (F20)

All Spring Boot REST endpoints — including internal CRM API routes and frozen Open311 endpoints — are documented via OpenAPI 3.0 (springdoc-openapi). The Swagger UI is accessible to developers at a known URL.

---

### US-20.1: Explore All API Endpoints via Swagger UI
**As a** Jordan Calloway (System Administrator), **I want to** access a Swagger UI at `/swagger-ui.html` that documents all Spring Boot endpoints, **so that** I can answer vendor integration questions without reading PHP source code or maintaining separate API documentation.

**Acceptance Criteria:**
- [ ] Swagger UI is accessible at `/swagger-ui.html` after deployment
- [ ] OpenAPI spec is available at `/v3/api-docs` in JSON format
- [ ] All Spring Boot controllers have methods annotated with `@Operation`, `@ApiResponse`, and `@Schema`
- [ ] Open311 endpoints are documented with GeoReport v2 field descriptions
- [ ] JWT Bearer token authentication flow is documented (how to authenticate and pass the token)
- [ ] Spec coverage is 100%: every controller method has at least one documented `@Operation` annotation
- [ ] Spec is exportable as JSON/YAML for client code generation

**Priority:** P1 | **Feature Ref:** F20

---

### US-20.2: Test API Calls Directly from Swagger UI
**As a** Jordan Calloway (System Administrator), **I want to** execute API calls from Swagger UI using a Bearer token, **so that** I can help a third-party integration team verify their implementation without setting up a separate API client.

**Acceptance Criteria:**
- [ ] Swagger UI includes an "Authorize" button for entering a Bearer JWT token
- [ ] Authenticated endpoints can be tested directly from the Swagger UI using the entered token
- [ ] Open311 endpoints can be tested without a Bearer token (they use `api_key` instead)
- [ ] Request/response schemas are accurate and reflect the actual API behavior (no documentation drift)

**Priority:** P1 | **Feature Ref:** F20

---
## Epic 21: Database Migration — MySQL to PostgreSQL via Flyway (F21)

The existing MySQL schema (18 tables, all data) must be migrated to PostgreSQL using Flyway versioned migration scripts. No data may be lost and no table or column may be dropped.

---

### US-21.1: Migrate the Full MySQL Schema to PostgreSQL via Flyway
**As a** Jordan Calloway (System Administrator), **I want to** bootstrap a fresh PostgreSQL database by running `flyway migrate`, **so that** the system can be installed in any environment without manual SQL scripting or tribal knowledge.

**Acceptance Criteria:**
- [ ] Flyway migration scripts are stored in `src/main/resources/db/migration/` as `V{n}__description.sql`
- [ ] `V1__initial_schema.sql` recreates all 18 MySQL tables in PostgreSQL with equivalent types (INT → INTEGER, VARCHAR → VARCHAR, TINYINT(1) → BOOLEAN, etc.)
- [ ] All foreign key constraints, indexes, and auto-increment sequences are recreated
- [ ] `V2__search_vector.sql` adds the `search_vector` tsvector column and GIN index to `tickets` (additive — no existing columns removed)
- [ ] A clean PostgreSQL instance can be fully bootstrapped from scratch via `flyway migrate`
- [ ] Flyway migration history contains the complete schema evolution

**Priority:** P0 | **Feature Ref:** F21

---

### US-21.2: Migrate All Production Data from MySQL to PostgreSQL with Zero Loss
**As a** Jordan Calloway (System Administrator), **I want to** migrate all existing MySQL data to PostgreSQL and verify row counts match, **so that** every existing ticket, person, and case history entry is preserved after the modernization go-live.

**Acceptance Criteria:**
- [ ] A one-time data migration script handles `mysqldump` → `pg_restore` pipeline for all 18 tables
- [ ] Row count equality is verified between MySQL export and PostgreSQL import for all 18 tables
- [ ] 0 rows lost and 0 foreign key constraint violations in PostgreSQL after migration
- [ ] Existing stored media file paths and database records are preserved (path structure unchanged from PHP implementation)
- [ ] A migration validation script confirms row counts, data type integrity, and constraint satisfaction
- [ ] All data type mapping decisions are documented (e.g., TINYINT(1) as BOOLEAN, TEXT as TEXT)

**Priority:** P0 | **Feature Ref:** F21

---
---

## Story Index

| Story ID | Title | Priority | Feature Ref |
|---|---|---|---|
| US-0.1 | List Available Services (Open311) | P0 | F0 |
| US-0.2 | Retrieve Service Requests with Filters (Open311) | P0 | F0 |
| US-0.3 | Submit a New Service Request via Open311 | P0 | F0 |
| US-0.4 | Retrieve a Single Service Request by ID | P0 | F0 |
| US-1.1 | Create a New Ticket from a Phone Call | P0 | F1 |
| US-1.2 | Close a Ticket with a Substatus | P0 | F1 |
| US-1.3 | Reopen a Closed Ticket | P0 | F1 |
| US-1.4 | Assign a Ticket to a Staff Person | P0 | F1 |
| US-1.5 | Perform Bulk Operations on Multiple Tickets | P0 | F1 |
| US-2.1 | Complete the Multi-Step Submission Wizard on Mobile | P0 | F2 |
| US-2.2 | Drop a Map Pin to Identify Issue Location | P0 | F2 |
| US-2.3 | Upload a Photo from Phone Camera During Submission | P0 | F2 |
| US-2.4 | Receive a Confirmation Screen with Case ID | P0 | F2 |
| US-3.1 | Search for a Case Using Live Full-Text Search | P0 | F3 |
| US-3.2 | Filter the Case List by Multiple Criteria | P0 | F3 |
| US-3.3 | Sort the Case List by Column | P0 | F3 |
| US-3.4 | Paginate Through the Case List | P0 | F3 |
| US-3.5 | Save a Search as a Bookmark for Quick Recall | P0 | F3 |
| US-3.6 | Export Case List Results to CSV | P0 | F3 |
| US-4.1 | View Complete Case Metadata and History on One Screen | P0 | F4 |
| US-4.2 | Edit Case Fields Inline Without Leaving the Screen | P0 | F4 |
| US-4.3 | Log a Response and Optionally Notify the Reporter | P0 | F4 |
| US-4.4 | Use a Response Template to Pre-Fill Action Notes | P0 | F4 |
| US-5.1 | View Operational KPIs on the Dashboard | P1 | F5 |
| US-5.2 | Review the Recent Cases Feed on the Dashboard | P1 | F5 |
| US-5.3 | View Open Cases on the Dashboard Map Widget | P1 | F5 |
| US-5.4 | Use Quick-Link Buttons to Navigate from the Dashboard | P1 | F5 |
| US-6.1 | List and Search People | P1 | F6 |
| US-6.2 | Create a New Staff Person Record | P1 | F6 |
| US-6.3 | Edit a Person and Manage Their Contact Records | P1 | F6 |
| US-6.4 | Delete a Person with Safety Check | P1 | F6 |
| US-7.1 | List, Create, and Edit Departments | P1 | F7 |
| US-7.2 | Delete a Department with Safety Check | P1 | F7 |
| US-8.1 | Create a New Category Group | P1 | F8 |
| US-8.2 | Create and Fully Configure a New Category | P1 | F8 |
| US-8.3 | Delete a Category with Safety Check | P1 | F8 |
| US-9.1 | Automatic System Action Created on Ticket Events | P0 | F9 |
| US-9.2 | Send Email Notification to Reporter on Action | P0 | F9 |
| US-9.3 | Load Response Template into Action Notes | P0 | F9 |
| US-10.1 | Attach Photos to a Ticket at Creation (Staff) | P1 | F10 |
| US-10.2 | Attach a Photo to an Existing Ticket from the Field | P1 | F10 |
| US-10.3 | View Photos in the Case Detail Lightbox | P1 | F10 |
| US-10.4 | Delete an Attached Photo with Confirmation | P1 | F10 |
| US-11.1 | Search Tickets with PostgreSQL Full-Text Search | P0 | F11 |
| US-11.2 | See Highlighted Keyword Matches in Search Results | P0 | F11 |
| US-11.3 | Search and Filter Can Be Combined | P0 | F11 |
| US-11.4 | Search Vector Auto-Maintained by Database Trigger | P0 | F11 |
| US-12.1 | Log In via CAS Single Sign-On | P0 | F12 |
| US-12.2 | Log In via LDAP Credentials | P0 | F12 |
| US-12.3 | Session Expiry and Automatic Token Refresh | P0 | F12 |
| US-12.4 | Sign Out and Invalidate the Session | P0 | F12 |
| US-12.5 | View and Update Own Profile on the Account Screen | P0 | F12 |
| US-13.1 | Manage Substatus Values | P1 | F13 |
| US-13.2 | Manage Issue Types | P1 | F13 |
| US-13.3 | Manage Response Templates | P1 | F13 |
| US-13.4 | Manage Contact Methods | P1 | F13 |
| US-14.1 | Register a New Open311 API Client | P1 | F14 |
| US-14.2 | Edit and Delete an Open311 Client Record | P1 | F14 |
| US-15.1 | View Case Volume Over Time | P2 | F15 |
| US-15.2 | View Resolution Time and Case Breakdown Reports | P2 | F15 |
| US-16.1 | View Clustered Ticket Pins on the Map | P2 | F16 |
| US-16.2 | View a Single Ticket Pin on Case Detail Map | P2 | F16 |
| US-17.1 | Use a Consistent, Branded Design System Across All Screens | P0 | F17 |
| US-17.2 | Toggle Dark Mode and Have the Preference Persisted | P0 | F17 |
| US-17.3 | Experience Smooth Animations Respecting Motion Preferences | P0 | F17 |
| US-18.1 | Navigate the Application Using the Persistent Navbar and Sidebar | P0 | F18 |
| US-18.2 | Navigate the Application on a Mobile Device via the Hamburger Drawer | P0 | F18 |
| US-18.3 | Use Keyboard Navigation and Skip Links for Accessibility | P0 | F18 |
| US-19.1 | Access All Features Using Only a Keyboard | P0 | F19 |
| US-19.2 | Use a Screen Reader to Operate the Application | P0 | F19 |
| US-19.3 | Use the Application Comfortably on a Mobile Device | P0 | F19 |
| US-19.4 | Read Content with Sufficient Color Contrast in Both Light and Dark Mode | P0 | F19 |
| US-20.1 | Explore All API Endpoints via Swagger UI | P1 | F20 |
| US-20.2 | Test API Calls Directly from Swagger UI | P1 | F20 |
| US-21.1 | Migrate the Full MySQL Schema to PostgreSQL via Flyway | P0 | F21 |
| US-21.2 | Migrate All Production Data from MySQL to PostgreSQL with Zero Loss | P0 | F21 |

**Total Stories: 74**

---
## Priority Breakdown

| Priority | Story Count | Features |
|---|---|---|
| **P0 — Critical** | 50 | F0, F1, F2, F3, F4, F9, F11, F12, F17, F18, F19, F21 |
| **P1 — High** | 20 | F5, F6, F7, F8, F10, F13, F14, F20 |
| **P2 — Medium** | 4 | F15, F16 |
| **P3 — Low** | 0 | — |
| **Total** | **74** | F0–F21 |

### P0 Stories (Critical — must ship before launch)
All stories tagged P0 are prerequisites for a working system. Key clusters:
- **F0** Open311 API compatibility — external clients must continue working unchanged
- **F1 + F9** Ticket lifecycle and action logging — core business function
- **F2** Public submission form — primary public-facing feature
- **F3 + F4** Case list and detail — primary staff workspace
- **F11** Full-text search — Solr must be eliminated
- **F12** Authentication — all staff access gated behind LDAP/CAS
- **F17 + F18 + F19** Design system, navigation, and accessibility — foundation for all UI
- **F21** Database migration — system cannot run without successful migration

### P1 Stories (High — required for complete operational capability)
- **F5** Dashboard — staff landing experience
- **F6 + F7 + F8** Admin panels for people, departments, categories
- **F10** Media upload — photo evidence workflows
- **F13** Lookup table admin — substatus, issue types, templates, contact methods
- **F14** Open311 client management — API key administration
- **F20** OpenAPI documentation — developer onboarding

### P2 Stories (Medium — important for management oversight)
- **F15** Metrics and reporting — case volume, resolution time analysis
- **F16** Geo-clustering — enhanced map usability at scale

---

*UserStories-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
