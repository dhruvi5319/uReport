---
status: complete
phase: 08-core-frontend-screens
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md
started: 2026-07-09T02:30:00Z
updated: 2026-07-09T02:45:00Z
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
result: [pending]

### 3. Dashboard — Map Widget (Leaflet/Mapbox)
expected: The dashboard shows a map widget with cluster markers representing case locations. If no VITE_MAPBOX_TOKEN is set, Leaflet renders as the fallback map. The map loads without errors.
result: [pending]

### 4. Dashboard — Recent Cases Feed and Quick Links
expected: The dashboard shows a Recent Cases feed listing recent tickets with relative timestamps (e.g. "3 minutes ago") and status badge pills. Quick Links section shows "New Case", "All Open", and "Assigned to Me" navigation links.
result: [pending]

### 5. Case List — Table, Search, and Filter
expected: Navigate to /cases. A sortable paginated table of tickets renders with status badge pills (open/resolved/duplicate/bogus). Typing in the search box debounces and filters results within ~300ms. Clicking column headers sorts the table. Filter chips appear for each active filter showing what's currently filtered.
result: [pending]

### 6. Case List — Skeleton Loading and Empty State
expected: When loading, 5 skeleton rows appear in the table body. When no results match current filters, an empty state with a "clear filters" button appears.
result: [pending]

### 7. Case List — Bulk Actions
expected: Selecting one or more checkboxes in the table makes the BulkActionBar slide down from the top. The bar shows "N selected" and offers Close and Change Status actions. Clicking Close opens a confirmation dialog; confirming sends a bulk close request.
result: [pending]

### 8. Case List — Filter Panel and URL State
expected: Clicking the filter/funnel button reveals a filter panel with Status, Category, Department, Assignee, and Date selects. Applying a filter updates the URL (bookmarkable). Navigating away and back restores the filter state from the URL.
result: [pending]

### 9. Case Detail — Split-Pane Layout and Data
expected: Clicking a case row navigates to /cases/:id. The page shows a split-pane layout: left pane with case metadata (title, status, category, assignee, location, SLA bar), right pane with the action timeline. Three parallel queries load ticket info, history, and media without sequential waterfall.
result: [pending]

### 10. Case Detail — Inline Edit and PATCH
expected: In the MetadataPanel, clicking the pencil icon next to an editable field (e.g. assignee, category) switches it to edit mode. Editing and clicking Save sends a PATCH request and the UI updates optimistically without a full page reload. Clicking Cancel restores the previous value.
result: [pending]

### 11. Case Detail — Close and Reopen Dialogs
expected: Clicking Close Case opens a dialog requiring a substatus selection before the Confirm button becomes enabled. Confirming closes the ticket and creates a history entry. Clicking Reopen Case opens a confirmation dialog; confirming reopens the ticket.
result: [pending]

### 12. Case Detail — Action Log Form and Timeline
expected: The ActionLogForm lets staff select an action type and response template, enter notes, and optionally flag for email notification. Submitting prepends the new entry optimistically to the Timeline immediately (before server responds). The Timeline shows entries newest-first with appropriate icons.
result: [pending]

### 13. Case Detail — Media Gallery with Drag-Drop
expected: The MediaGallery section shows uploaded photos as thumbnails. Dragging and dropping image files onto the gallery uploads them. Clicking a thumbnail opens a fullscreen lightbox dialog.
result: [pending]

### 14. Public Submission Wizard — Step Navigation
expected: Navigate to /submit (no login required). A 5-step wizard shows: Contact → Category → Location → Description → Review. Clicking Next advances, clicking Back goes back, with Framer Motion direction-aware slide transitions. The WizardProgress indicator shows current step with checkmarks for completed steps.
result: [pending]

### 15. Public Submission Wizard — Category Selection
expected: In Step 2 (Category), category groups are shown as tiles. Clicking a group drills into its child categories. Selecting a category enables the Next button.
result: [pending]

### 16. Public Submission Wizard — Location and Geocode
expected: In Step 3 (Location), typing an address in the search box triggers debounced geocode autocomplete (~300ms). Selecting a result pins the location on the map. Either a typed address or map pin selection is sufficient to advance.
result: [pending]

### 17. Public Submission Wizard — Photo Upload and Description
expected: In Step 4 (Description), drag-dropping or browsing for image files adds them to the upload list (max 10 files, max 10MB each). The description field requires at least 10 characters before Next is enabled.
result: [pending]

### 18. Public Submission Wizard — Review and Submission
expected: Step 5 (Review) shows a summary of all entered data. Clicking Submit sends a POST to /api/tickets/public and navigates to a ConfirmationScreen displaying the new case ID with an Open311 status tracking link.
result: [pending]

## Summary

total: 18
passed: 0
issues: 1
pending: 17
skipped: 0

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
  status: failed
  reason: "User reported: server turns on then stops repeatedly; preview not visible. Root: start-dev.sh runs 'mvn spring-boot:run' without -Dspring.profiles.active=dev, so Spring Boot tries to connect to PostgreSQL (not available in this sandbox). Backend crashes → Pivota kills all children including Vite frontend."
  severity: blocker
  test: 1
  source: self_check
  root_cause: "start-dev.sh launches backend without dev profile; backend/src/main/resources/application-dev.yml has H2 in-memory config that avoids the PostgreSQL dependency, but it is not activated"
  artifacts:
    - path: ".pivota/start-dev.sh"
      issue: "Line 226: 'mvn spring-boot:run -q' missing -Dspring.profiles.active=dev — backend tries PostgreSQL and crashes"
    - path: "backend/src/main/resources/application-dev.yml"
      issue: "Dev profile exists with H2 in-memory DB and Flyway disabled, but never activated by start script"
  missing:
    - "Add -Dspring.profiles.active=dev to the mvn spring-boot:run command in start-dev.sh so backend uses H2 in-memory DB when no PostgreSQL sidecar is available"
  debug_session: ""
