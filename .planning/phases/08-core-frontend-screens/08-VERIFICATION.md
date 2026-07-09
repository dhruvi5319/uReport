---
phase: 08-core-frontend-screens
verified: 2026-07-09T05:00:00Z
status: human_needed
score: 5/5 must-haves verified (automated checks)
re_verification: false
human_verification:
  - test: "Dashboard — stat cards, map, donut, feed all load and display live data"
    expected: "4 stat cards render with counts; donut chart shows status breakdown; map widget shows cluster markers (Leaflet fallback when no VITE_MAPBOX_TOKEN); Recent Cases feed shows relative timestamps and status badges; clicking a stat card navigates to /cases with filter pre-applied"
    why_human: "All rendering is browser JS; requires React Query data fetching, recharts rendering, and Leaflet map initialization — not verifiable via grep or static analysis"
  - test: "Case list — sortable table, 300ms debounce search, filter chips, bulk actions"
    expected: "Table rows display with status badge pills; typing in search box shows results within 300ms; filter chips appear for each active filter; selecting rows slides down BulkActionBar; bulk close requires substatus selection; URL updates with filter state"
    why_human: "Interactions require browser JS execution; URL state transitions require navigation testing"
  - test: "Case detail — split-pane layout, inline edit PATCH, close/reopen dialogs, action log, timeline"
    expected: "Left pane shows metadata with pencil-edit controls that switch to inline edit mode; PATCH request is sent and UI updates optimistically; Close dialog requires substatus before enabling Confirm; ActionLogForm prepends entry to timeline immediately on submit"
    why_human: "Optimistic UI mutations, dialog interactions, and form state transitions require browser JS"
  - test: "Public submission wizard — 5-step navigation, geocode autocomplete, photo upload, confirmation screen"
    expected: "Framer Motion direction-aware slide transitions between steps; WizardProgress shows checkmarks for completed steps; address autocomplete shows suggestions within 300ms; drag-drop adds photos (max 10, max 10MB); Step 5 review shows all data; submit POSTs to /api/tickets/public and confirmation screen shows case ID with Open311 tracking link"
    why_human: "Animations, geocode API calls, file drag-drop, and final POST submission require browser JS"
  - test: "All screens responsive at 375px, 768px, 1280px+"
    expected: "Dashboard stat cards go 2-col at 375px → 4-col at lg; case detail split-pane stacks vertically at 375px, side-by-side at lg; sidebar hides behind hamburger at mobile widths"
    why_human: "Visual layout at specific viewport widths requires browser rendering to verify"
  - test: "Skeleton loading states appear during data fetches"
    expected: "Stat card skeletons appear while dashboard queries are loading; 5 skeleton rows appear in case table while loading; MetadataPanelSkeleton renders in left pane of case detail while loading"
    why_human: "Loading state timing requires real network delay or React Query suspense simulation in browser"
  - test: "BulkActionBar — bulk assign shows informational message (partial implementation)"
    expected: "Clicking Assign in bulk bar opens a dialog explaining assignment requires individual case view; Close and Change Status bulk operations work with API POST to /api/tickets/bulk"
    why_human: "Bulk assign is intentionally a placeholder dialog (no person selection); Close and Change Status need browser interaction to verify the mutation fires"
---

# Phase 8: Core Frontend Screens Verification Report

**Phase Goal:** The four primary user-facing screens are complete — dashboard, case list, case detail, and public submission form — delivering the full staff and public workflow in the React UI
**Verified:** 2026-07-09T05:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1 | Dashboard shows live stat cards, recent cases feed, geo-clustered map widget, status donut chart; clicking stat card navigates to case list with filter pre-applied | ? HUMAN | All artifacts exist and are fully wired; DashboardPage uses 4 parallel `useQueries`; StatCard is a `<Link to="/cases?{filter}">` component; rendering requires browser JS |
| 2 | Case list displays sortable paginated table with status badges, 300ms debounce search, filter chips for active filters, bulk select/close/assign | ⚠️ PARTIAL | All code exists and is substantive; bulk assign shows informational dialog (no person picker — noted anti-pattern at warning level); requires browser JS for full verification |
| 3 | Case detail split-pane: close ticket with substatus, log action/response, upload photo, view timeline — no page reload | ? HUMAN | All components exist and are fully wired with optimistic mutations; CloseDialog enforces `canSubmit = substatusId !== ''`; ActionLogForm uses `onMutate` optimistic prepend; requires browser JS |
| 4 | Public wizard completes all 5 steps, submits POST, shows confirmation with case ID | ? HUMAN | All 5 step components + ConfirmationScreen exist; WizardContext manages state and direction; StepReview POSTs to `/api/tickets/public` and calls `goToStep(6)` on success; requires browser JS |
| 5 | All screens responsive at 375/768/1280px+; skeleton loading states appear; empty states render | ? HUMAN | Responsive Tailwind classes verified in code (grid-cols-2→lg:grid-cols-4, flex-col→lg:flex-row, hidden md:flex); Skeleton components used throughout; EmptyState component exists; requires browser for visual verification |

**Score:** 5/5 truths structurally verified — all require human browser testing to confirm runtime behavior

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/pages/DashboardPage.tsx` | ✓ VERIFIED | 165 lines; uses `useQueries` with 4 parallel fetches; imports StatCard, RecentCasesFeed, StatusDonut, MapWidget, QuickLinks |
| `src/pages/CaseListPage.tsx` | ✓ VERIFIED | 118 lines; URL-encoded filter state via `useSearchParams`; `useDebounce(filterState.q, 300)`; imports FilterChips, BulkActionBar, SearchInput, EmptyState, Pagination |
| `src/pages/CaseDetailPage.tsx` | ✓ VERIFIED | 76 lines; 3 parallel `useQueries`; split-pane layout with responsive classes; MetadataPanelSkeleton + Skeleton |
| `src/pages/PublicSubmitPage.tsx` | ✓ VERIFIED | 63 lines; WizardProvider wraps WizardInner; AnimatePresence with direction-aware stepVariants; step 6 = ConfirmationScreen |
| `src/components/dashboard/StatCard.tsx` | ✓ VERIFIED | 86 lines; `<Link to="/cases?{filterParam}">` navigation; animated count; destructive variant when count > 0; skeleton state |
| `src/components/dashboard/RecentCasesFeed.tsx` | ✓ VERIFIED | 77 lines; `getRelativeTime()` using `Intl.RelativeTimeFormat`; status badge pills; skeleton loading |
| `src/components/dashboard/StatusDonut.tsx` | ✓ VERIFIED | 87 lines; Recharts PieChart with `innerRadius=60` (donut); accessible SR-only `<table>`; skeleton state |
| `src/components/dashboard/MapWidget.tsx` | ✓ VERIFIED | 200 lines; Mapbox path (if `VITE_MAPBOX_TOKEN`) with cluster layers; Leaflet fallback (default); `initLeaflet()` adds tile layer and circle markers |
| `src/components/cases/CaseTable.tsx` | ✓ VERIFIED | 185 lines; `SortableHeader` with ArrowUp/Down icons; `SKELETON_ROW_COUNT = 5`; checkbox select-all + row toggle; status badge pills |
| `src/components/cases/FilterChips.tsx` | ✓ VERIFIED | 78 lines; derives chips from FilterState for 9 filter keys; Framer Motion AnimatePresence; `onRemove` handler |
| `src/components/cases/BulkActionBar.tsx` | ⚠️ PARTIAL | 214 lines; Close and Change Status bulk operations fully wired to `/api/tickets/bulk`; Assign dialog is a placeholder message ("requires person selection") — warning-level gap |
| `src/components/cases/SearchInput.tsx` | ✓ VERIFIED | 35 lines; internal `useDebounce(local, 300)` notifies parent on idle; syncs with external URL value |
| `src/components/cases/EmptyState.tsx` | ✓ VERIFIED | 26 lines; "No cases found" message with "Clear filters" button |
| `src/components/cases/Pagination.tsx` | ✓ VERIFIED | 120 lines; page navigation and page size selector |
| `src/components/cases/MetadataPanel.tsx` | ✓ VERIFIED | 386 lines; PATCH mutation with `onMutate` optimistic update + rollback; EditableField sub-component with pencil icon; integrates CloseDialog, ReopenDialog, SlaProgressBar, MediaGallery |
| `src/components/cases/CloseDialog.tsx` | ✓ VERIFIED | 112 lines; `canSubmit = substatusId !== ''` enforces substatus required; Confirm button disabled when empty; POST to `/api/tickets/{id}/close` |
| `src/components/cases/ReopenDialog.tsx` | ✓ VERIFIED | 62 lines; confirmation dialog; POST to `/api/tickets/{id}/reopen`; invalidates ticket and history queries |
| `src/components/cases/SlaProgressBar.tsx` | ✓ VERIFIED | 36 lines; calculates elapsed/slaDays ratio; `role="progressbar"` accessibility; destructive color when overdue |
| `src/components/cases/ActionLogForm.tsx` | ✓ VERIFIED | 183 lines; action type select + template select + notes textarea; `onMutate` prepends optimistic entry; notify checkboxes |
| `src/components/cases/Timeline.tsx` | ✓ VERIFIED | 103 lines; lucide icon mapping per action type; `isPending` italic/opacity for optimistic entries; newest-first (rendered as received from server) |
| `src/components/cases/MediaGallery.tsx` | ✓ VERIFIED | 114 lines; HTML5 drag-drop (onDrop); file input fallback; thumbnail grid; Radix Dialog lightbox |
| `src/contexts/WizardContext.tsx` | ✓ VERIFIED | 78 lines; `formData`, `step` (1–6), `direction` (+1/-1), `goNext`/`goBack`/`goToStep`; `useWizard` throws if outside provider |
| `src/components/submit/WizardProgress.tsx` | ✓ VERIFIED | 39 lines; checkmark for completed steps; `aria-current="step"` for current; connector lines |
| `src/components/submit/StepContact.tsx` | ✓ VERIFIED | 85 lines; react-hook-form + Zod validation; Skip button available; all fields optional |
| `src/components/submit/StepCategory.tsx` | ✓ VERIFIED | 117 lines; group tiles → category tiles drill-down; `canAdvance = !!selectedCategoryId`; skeleton while loading |
| `src/components/submit/StepLocation.tsx` | ✓ VERIFIED | 137 lines; `useDebounce(addressInput, 300)` for geocode; suggestion dropdown; MapWidget with `onPinDrag`; `canAdvance` requires address or pin |
| `src/components/submit/StepDescription.tsx` | ✓ VERIFIED | 145 lines; `react-dropzone` (maxFiles=10, maxSize=10MB); description `min(10)` Zod validation; thumbnail previews with remove |
| `src/components/submit/StepReview.tsx` | ✓ VERIFIED | 80 lines; renders all form data summary; POST to `/api/tickets/public` via FormData; `goToStep(6)` on success |
| `src/components/submit/ConfirmationScreen.tsx` | ✓ VERIFIED | 48 lines; shows `#{submittedTicketId}`; Open311 tracking link `/open311/v2/requests/{id}.json`; "Submit another report" link |
| `.pivota/start-dev.sh` (PGAP-01) | ✓ VERIFIED | Line 226: `mvn spring-boot:run -q -Dspring.profiles.active=dev` — dev profile activated; commit `55f9cbf` confirmed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `DashboardPage` | `/api/dashboard/stats` | `useQueries[0]` fetch | ✓ WIRED | Fetched; result destructured as `stats`; passed to `StatCard` components |
| `DashboardPage` | `/api/dashboard/chart` | `useQueries[1]` fetch | ✓ WIRED | Fetched; result as `chartData`; passed to `StatusDonut` |
| `DashboardPage` | `/api/geoclusters` | `useQueries[2]` fetch | ✓ WIRED | Fetched; result as `clusters`; passed to `MapWidget` |
| `DashboardPage` | `/api/tickets` (recent) | `useQueries[3]` fetch | ✓ WIRED | Fetched; `.items` extracted; passed to `RecentCasesFeed` |
| `StatCard` | `/cases?{filter}` | `<Link to={href}>` | ✓ WIRED | `href = '/cases?' + new URLSearchParams(filterParam)` — navigates with pre-applied filter |
| `CaseListPage` | `/api/tickets` | `useQuery` + `debouncedQ` | ✓ WIRED | Query built from URL params; response `.items` passed to `CaseTable` |
| `CaseListPage` | URL state | `useSearchParams` / `setSearchParams` | ✓ WIRED | `updateFilter` merges params; page resets to 1 on filter change |
| `MetadataPanel` | `PATCH /api/tickets/:id` | `patchMutation.mutate` | ✓ WIRED | `onMutate` optimistic update; `onError` rollback; `onSettled` invalidate |
| `CloseDialog` | `POST /api/tickets/:id/close` | `closeMutation` | ✓ WIRED | Requires `substatusId !== ''`; invalidates ticket + history queries |
| `ActionLogForm` | `POST /api/tickets/:id/history` | `submitMutation` + `onMutate` | ✓ WIRED | Optimistically prepends to `['ticket-history', ticketId]`; invalidates on success |
| `MediaGallery` | `POST /api/tickets/:id/media` | `uploadMutation` + drag-drop | ✓ WIRED | `handleDrop` calls `uploadMutation.mutate(f)` per file; invalidates media + history |
| `StepReview` | `POST /api/tickets/public` | `submitMutation.mutate()` | ✓ WIRED | FormData POST; `goToStep(6)` on success; caseId stored in WizardContext |
| `ConfirmationScreen` | WizardContext | `useWizard()` | ✓ WIRED | Reads `submittedTicketId` and `submittedCaseId` from formData |
| `PublicSubmitPage` | WizardProvider | wraps `WizardInner` | ✓ WIRED | All steps consume `useWizard()` within provider |
| `.pivota/start-dev.sh` | Spring Boot dev profile | `-Dspring.profiles.active=dev` | ✓ WIRED | Commit 55f9cbf; line 226 confirmed |

### Requirements Coverage

All 5 success criteria map directly to the 5 truths above. All 5 are structurally SATISFIED (all code is present and wired). Runtime behavior pending human testing.

| Success Criterion | Status | Notes |
|-------------------|--------|-------|
| Dashboard: stat cards + map + donut + feed + click-to-filter | ? HUMAN | Code complete; requires browser |
| Case list: sortable table + debounce search + filter chips + bulk actions | ⚠️ PARTIAL | Bulk assign is placeholder; rest complete |
| Case detail: split-pane + inline edit + close/reopen + action log + timeline | ? HUMAN | Code complete; requires browser |
| Public wizard: 5 steps + submit + confirmation screen with case ID | ? HUMAN | Code complete; requires browser |
| Responsive at 375/768/1280px+ + skeleton states + empty states | ? HUMAN | Tailwind classes present; requires browser |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/cases/BulkActionBar.tsx` | 199–201 | Bulk assign dialog shows "Assign feature requires person selection. Use the individual case view for now." — informational placeholder, no API call | ⚠️ Warning | Bulk close and bulk change status work correctly. Bulk assign is not functional. The success criterion says "bulk close/assign work" — assign is incomplete. |

### Human Verification Required

#### 1. Dashboard Data and Navigation
**Test:** Open app at `/` or `/dashboard` while logged in. Wait for queries to resolve.
**Expected:** 4 stat cards show numeric counts (Open, Opened Today, Closed Today, Overdue). Overdue card turns red when count > 0. Map widget renders (Leaflet tiles visible when no Mapbox token). Status donut chart renders with colored segments. Recent cases feed shows entries with relative timestamps. Clicking a stat card navigates to `/cases?status=open` (or appropriate filter).
**Why human:** React Query data fetching, Recharts rendering, Leaflet initialization all require browser JS.

#### 2. Case List Table, Search, and Filters
**Test:** Navigate to `/cases`. Type in the search box, apply filters, sort columns, select rows.
**Expected:** Table shows status badge pills. Typing searches fire within ~300ms (observe network tab). Filter chips appear for each active filter with × buttons. Clicking column headers toggles sort direction. Checking rows reveals BulkActionBar sliding down. Bulk Close works; Bulk Assign shows informational message. URL updates on every filter change.
**Why human:** All interaction behaviors require browser JS execution.

#### 3. Case Detail Split-Pane and Interactions
**Test:** Click a case row. Interact with edit controls, close dialog, action form.
**Expected:** Split pane: metadata left, timeline right. Pencil icon opens inline edit. Saving fires PATCH and UI updates without reload. Close Case dialog requires substatus before Confirm activates. ActionLogForm submission immediately prepends to timeline (optimistic). Media drag-drop uploads file.
**Why human:** Optimistic UI, dialog state, mutation lifecycle all require browser JS.

#### 4. Public Submission Wizard End-to-End
**Test:** Navigate to `/submit` (no login). Complete all 5 steps. Submit.
**Expected:** Direction-aware slide transitions. Progress indicator shows checkmarks. Address autocomplete triggers within 300ms. Drag-drop adds photo previews. Review step shows all entered data. Submit creates a case and confirmation screen shows case number and Open311 tracking link.
**Why human:** Animations, geocode API integration, file uploads, and POST submission require browser JS.

#### 5. Responsiveness at Three Breakpoints
**Test:** Resize browser or use DevTools device simulation at 375px, 768px, and 1280px+.
**Expected:** At 375px: dashboard stats 2-col, sidebar hidden behind hamburger. At 768px: dashboard stats 2-col still, sidebar visible. At 1280px+: stats 4-col, sidebar always visible, case detail side-by-side.
**Why human:** Visual layout requires browser rendering at specific viewport widths.

#### 6. Skeleton Loading States
**Test:** Throttle network to "Slow 3G" in DevTools, then navigate to each page.
**Expected:** Dashboard: 4 skeleton stat cards appear. Map: skeleton rectangle. Case table: 5 skeleton rows. Case detail: MetadataPanelSkeleton in left pane.
**Why human:** Loading state timing requires real network delay simulation.

### Gaps Summary

**No blocking gaps found in automated checks.**

The codebase is structurally complete: all 4 pages exist, all named components are substantive (not stubs), all key API connections are wired with proper mutation/query patterns, and the PGAP-01 dev server fix (Spring Boot dev profile) is confirmed at line 226 of `.pivota/start-dev.sh`.

One **warning-level** incomplete feature was found: the bulk assign dialog in `BulkActionBar.tsx` shows an informational message ("requires person selection") rather than a real person picker. Bulk close and bulk change status are fully functional. This partially satisfies success criterion 2 ("bulk close/assign work") — bulk assign does not work as a real action.

All 18 UAT tests identified in `08-UAT.md` remain pending human browser execution. The previous blocker (server crash) has been resolved by the PGAP-01 gap closure.

---
_Verified: 2026-07-09T05:00:00Z_
_Verifier: Claude (pivota_spec-verifier)_
