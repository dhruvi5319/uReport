---
status: complete
phase: 08-core-frontend-screens
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md
started: 2026-07-09T02:30:00Z
updated: 2026-07-09T18:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dashboard — Stat Cards and Data Loading
expected: Open the app at / (or /dashboard). After login (or if already logged in), the dashboard shows 4 stat cards: Open Cases, Opened Today, Closed Today, and Overdue. Cards display counts and have skeleton loading states while data fetches. Overdue count card turns red when overdue > 0. Clicking a stat card navigates to /cases with the corresponding filter pre-applied.
result: issue
reported: "The server is behaving weirdly, it is turning on then stopping and so on. I cannot see the preview."
severity: blocker

### 2. Dashboard — Status Donut Chart
expected: The dashboard shows a donut/pie chart displaying case counts by status (open, resolved, duplicate, bogus). The chart is accessible — a screen-reader-friendly data table exists alongside it. The chart renders without errors.
result: pass

### 3. Dashboard — Map Widget (Leaflet/Mapbox)
expected: The dashboard shows a map widget with cluster markers representing case locations. If no VITE_MAPBOX_TOKEN is set, Leaflet renders as the fallback map. The map loads without errors.
result: pass

### 4. Dashboard — Recent Cases Feed and Quick Links
expected: The dashboard shows a Recent Cases feed listing recent tickets with relative timestamps (e.g. "3 minutes ago") and status badge pills. Quick Links section shows "New Case", "All Open", and "Assigned to Me" navigation links.
result: pass

### 5. Case List — Table, Search, and Filter
expected: Navigate to /cases. A sortable paginated table of tickets renders with status badge pills (open/resolved/duplicate/bogus). Typing in the search box debounces and filters results within ~300ms. Clicking column headers sorts the table. Filter chips appear for each active filter showing what's currently filtered.
result: issue
reported: "Got this error when I want to create new case: App Error (issueTypes ?? []).map is not a function — FilterPanel.tsx:418. 401 API responses were being parsed as data objects and passed to .map()"
severity: major

### 6. Case List — Skeleton Loading and Empty State
expected: When loading, 5 skeleton rows appear in the table body. When no results match current filters, an empty state with a "clear filters" button appears.
result: pass

### 7. Case List — Bulk Actions
expected: Selecting one or more checkboxes in the table makes the BulkActionBar slide down from the top. The bar shows "N selected" and offers Close and Change Status actions. Clicking Close opens a confirmation dialog; confirming sends a bulk close request.
result: skipped
reason: API requires authentication to return ticket rows. Empty state prevents row selection. Visual code review confirms implementation is correct (BulkActionBar.tsx renders on selectedIds.size > 0 with Framer Motion slide-down).

### 8. Case List — Filter Panel and URL State
expected: Clicking the filter/funnel button reveals a filter panel with Status, Category, Department, Assignee, and Date selects. Applying a filter updates the URL (bookmarkable). Navigating away and back restores the filter state from the URL.
result: pass

### 9. Case Detail — Split-Pane Layout and Data
expected: Clicking a case row navigates to /cases/:id. The page shows a split-pane layout: left pane with case metadata (title, status, category, assignee, location, SLA bar), right pane with the action timeline. Three parallel queries load ticket info, history, and media without sequential waterfall.
result: pass

### 10. Case Detail — Inline Edit and PATCH
expected: In the MetadataPanel, clicking the pencil icon next to an editable field (e.g. assignee, category) switches it to edit mode. Editing and clicking Save sends a PATCH request and the UI updates optimistically without a full page reload. Clicking Cancel restores the previous value.
result: skipped
reason: No ticket data in H2 dev DB. Left pane shows "Ticket not found" — no metadata fields to edit.

### 11. Case Detail — Close and Reopen Dialogs
expected: Clicking Close Case opens a dialog requiring a substatus selection before the Confirm button becomes enabled. Confirming closes the ticket and creates a history entry. Clicking Reopen Case opens a confirmation dialog; confirming reopens the ticket.
result: skipped
reason: CloseDialog/ReopenDialog buttons only render inside MetadataPanel when a ticket record exists. No ticket data in H2 dev DB — MetadataPanel not rendered.

### 12. Case Detail — Action Log Form and Timeline
expected: The ActionLogForm lets staff select an action type and response template, enter notes, and optionally flag for email notification. Submitting prepends the new entry optimistically to the Timeline immediately (before server responds). The Timeline shows entries newest-first with appropriate icons.
result: pass

### 13. Case Detail — Media Gallery with Drag-Drop
expected: The MediaGallery section shows uploaded photos as thumbnails. Dragging and dropping image files onto the gallery uploads them. Clicking a thumbnail opens a fullscreen lightbox dialog.
result: skipped
reason: MediaGallery is rendered inside MetadataPanel which only shows when ticket record exists. No ticket data in H2 dev DB.

### 14. Public Submission Wizard — Step Navigation
expected: Navigate to /submit (no login required). A 5-step wizard shows: Contact → Category → Location → Description → Review. Clicking Next advances, clicking Back goes back, with Framer Motion direction-aware slide transitions. The WizardProgress indicator shows current step with checkmarks for completed steps.
result: issue
reported: "Wizard navigation works. Category tiles now show (Roads, Parks, Utilities). But on final Review step, submission fails: 'Submission failed. Please try again.' Backend has no POST /api/tickets/public endpoint implemented."
severity: major

### 15. Public Submission Wizard — Category Selection
expected: In Step 2 (Category), category groups are shown as tiles. Clicking a group drills into its child categories. Selecting a category enables the Next button.
result: pass

### 16. Public Submission Wizard — Location and Geocode
expected: In Step 3 (Location), typing an address in the search box triggers debounced geocode autocomplete (~300ms). Selecting a result pins the location on the map. Either a typed address or map pin selection is sufficient to advance.
result: issue
reported: "Leaflet map renders correctly. Typing 3+ characters does not produce geocode suggestions — /api/geocode endpoint returns 401 (endpoint not implemented in backend controller despite being permitAll() in SecurityConfig)"
severity: minor

### 17. Public Submission Wizard — Photo Upload and Description
expected: In Step 4 (Description), drag-dropping or browsing for image files adds them to the upload list (max 10 files, max 10MB each). The description field requires at least 10 characters before Next is enabled.
result: pass

### 18. Public Submission Wizard — Review and Submission
expected: Step 5 (Review) shows a summary of all entered data. Clicking Submit sends a POST to /api/tickets/public and navigates to a ConfirmationScreen displaying the new case ID with an Open311 status tracking link.
result: issue
reported: "Review step renders correctly with all entered data visible. Submit fails: POST /api/tickets/public not implemented in backend. Confirmation screen not reached. (Backend gap — same as test 14)"
severity: major

## Summary

total: 18
passed: 9
issues: 5
pending: 0
skipped: 4

## Self-Check

boot: 200
routes_probed: 4 ok / 0 failed
cookie: n/a (no auth flow executed; SPA routes all return 200)
per_test:
  - test: 1
    verdict: skipped (needs human)
    note: "SPA returns index.html for all routes; dashboard rendering requires browser JS execution"
  - test: 2
    verdict: skipped (needs human)
    note: "Chart rendering requires browser JS execution"
  - test: 3
    verdict: skipped (needs human)
    note: "Map widget requires browser JS execution; Leaflet/Mapbox fallback requires visual verification"
  - test: 4
    verdict: skipped (needs human)
    note: "Feed and quick links require browser JS execution"
  - test: 5
    verdict: skipped (needs human)
    note: "Table sorting/filtering requires browser JS execution"
  - test: 6
    verdict: skipped (needs human)
    note: "Skeleton and empty state require browser JS execution"
  - test: 7
    verdict: skipped (needs human)
    note: "Bulk action bar interaction requires browser JS execution"
  - test: 8
    verdict: skipped (needs human)
    note: "URL state filter panel requires browser JS execution"
  - test: 9
    verdict: skipped (needs human)
    note: "/cases/1 returns 200 (SPA); case detail rendering requires browser JS execution"
  - test: 10
    verdict: skipped (needs human)
    note: "Inline edit optimistic PATCH requires browser JS execution"
  - test: 11
    verdict: skipped (needs human)
    note: "Dialog interactions require browser JS execution"
  - test: 12
    verdict: skipped (needs human)
    note: "Action log form and timeline require browser JS execution"
  - test: 13
    verdict: skipped (needs human)
    note: "Drag-drop and lightbox require browser JS execution"
  - test: 14
    verdict: skipped (needs human)
    note: "/submit returns 200; wizard animations require browser JS execution"
  - test: 15
    verdict: skipped (needs human)
    note: "Category tile drill-down requires browser JS execution"
  - test: 16
    verdict: skipped (needs human)
    note: "Geocode autocomplete and map pin require browser JS execution"
  - test: 17
    verdict: skipped (needs human)
    note: "File drag-drop and Zod validation require browser JS execution"
  - test: 18
    verdict: skipped (needs human)
    note: "Form submission and confirmation screen require browser JS execution"

## Gaps

- truth: "Dev server stays running so the React frontend is accessible in the preview"
  status: fixed
  reason: "User reported: server turns on then stops repeatedly; preview not visible. Root cause: start-dev.sh used -Dspring.profiles.active=dev which Maven does not forward to the JVM. The correct flag is -Dspring-boot.run.profiles=dev. Additionally application-dev.yml lacked server.port override (defaulted to 3000 from application.properties, conflicting with Vite proxy targeting 8080) and mail health indicator caused 503."
  severity: blocker
  test: 1
  source: self_check
  root_cause: "Spring Boot Maven plugin does not propagate -Dspring.profiles.active=dev to the forked JVM; must use -Dspring-boot.run.profiles=dev instead"
  artifacts:
    - path: ".pivota/start-dev.sh"
      issue: "Line 226: used -Dspring.profiles.active=dev (Maven property) instead of -Dspring-boot.run.profiles=dev (plugin property)"
    - path: "backend/src/main/resources/application-dev.yml"
      issue: "Missing server.port: 8080 override (fell back to 3000 from application.properties, mismatching Vite proxy); missing management.health.mail.enabled: false"
  missing:
    - "FIXED: start-dev.sh now uses -Dspring-boot.run.profiles=dev"
    - "FIXED: application-dev.yml now sets server.port: 8080 and disables mail health check"
  debug_session: ""

- truth: "Case list filter panel renders without crashing when API returns 401"
  status: fixed
  reason: "User reported: App Error (issueTypes ?? []).map is not a function — FilterPanel tried to call .map() on a 401 error JSON object instead of an array"
  severity: major
  test: 5
  source: user
  root_cause: "Multiple fetch() calls used .then(r => r.json()) without checking r.ok first; 401 JSON objects were stored as query data and .map() crashed on non-arrays"
  artifacts:
    - path: "frontend/src/components/cases/FilterPanel.tsx"
      issue: "queryFns did not check r.ok; used ?? [] which doesn't protect against truthy non-array objects"
    - path: "frontend/src/pages/DashboardPage.tsx"
      issue: "Same issue — same pattern"
    - path: "frontend/src/components/cases/MetadataPanel.tsx"
      issue: "Same issue"
    - path: "frontend/src/components/cases/AssigneeCombobox.tsx"
      issue: "Same issue"
  missing:
    - "FIXED: Added if (!r.ok) throw new Error(HTTP $status) to all unsafe queryFns across 8 files"
    - "FIXED: Added Array.isArray() guard for chartData in DashboardPage"
    - "FIXED: Added AppErrorBoundary to display JS errors instead of blank screen"
  debug_session: ""

- truth: "Action type dropdown in ActionLogForm and public category wizard show available options"
  status: fixed
  reason: "ActionLogForm had same unsafe fetch pattern (actions.map crash). Public wizard categories empty because H2 dev DB had no seed data"
  severity: major
  test: 6
  source: user
  root_cause: "ActionLogForm.tsx used .then(r => r.json()) without r.ok check; H2 dev profile had no seed data (actions, categories, issue types)"
  artifacts:
    - path: "frontend/src/components/cases/ActionLogForm.tsx"
      issue: "Unsafe fetch in actions and templates queryFns"
    - path: "backend/src/main/java/com/ureport/config/DevDataSeeder.java"
      issue: "File did not exist — no seed data for H2 dev profile"
  missing:
    - "FIXED: ActionLogForm.tsx queryFns now throw on non-2xx responses"
    - "FIXED: Created DevDataSeeder.java with categories, substatuses, issue types, actions, departments"
  debug_session: ""

- truth: "Public submission wizard submits new case via POST /api/tickets/public and shows confirmation with case ID"
  status: failed
  reason: "Wizard navigation and category selection work. Submission fails: POST /api/tickets/public returns 401/404 — backend controller has no public ticket creation endpoint"
  severity: major
  test: 14
  source: user
  root_cause: "TicketController only has POST /api/tickets (auth required). No public /api/tickets/public endpoint exists in backend. Frontend StepReview sends FormData to this nonexistent endpoint."
  artifacts:
    - path: "backend/src/main/java/com/ureport/crm/controller/TicketController.java"
      issue: "Missing POST /api/tickets/public endpoint for unauthenticated public ticket creation"
  missing:
    - "Add POST /api/tickets/public endpoint to TicketController (or a dedicated PublicTicketController) that accepts FormData with contact info, categoryId, location, description, and optional photos"
    - "Endpoint should be permitAll() in SecurityConfig (already configured — line 64)"
  debug_session: ""

- truth: "Geocode autocomplete provides address suggestions in wizard Step 3"
  status: failed
  reason: "Map renders but geocode suggestions do not appear — GET /api/geocode returns 401 (endpoint not implemented in backend controller)"
  severity: minor
  test: 16
  source: user
  root_cause: "SecurityConfig permits GET /api/geocode but no controller implements the endpoint. The request falls through to the catch-all authenticated rule."
  artifacts:
    - path: "backend/src/main/java/com/ureport/security/SecurityConfig.java"
      issue: "Line 65: permitAll() for /api/geocode but no controller exists for this path"
  missing:
    - "Implement GET /api/geocode?q={query} endpoint in backend that returns { suggestions: [{display, lat, lon}] }"
    - "Can use Nominatim/OSM or a simple city-bounds geocoder — does not require external API keys"
  debug_session: ""
