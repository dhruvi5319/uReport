---
phase: 08-core-frontend-screens
plan: "02"
subsystem: ui
tags: [react, tanstack-query, framer-motion, react-router, msw, vitest, typescript, shadcn]

# Dependency graph
requires:
  - phase: 07-react-design-system-and-shell
    provides: shadcn/ui Table, Badge, Skeleton, Button, Input, Select, Dialog; pageVariants, itemVariants animations; AppShell with auth guard
  - phase: 08-core-frontend-screens (01)
    provides: "@tanstack/react-query QueryClientProvider in main.tsx, queryClient.ts, DashboardPage patterns, MSW server setup"

provides:
  - "CaseListPage — URL-encoded filter state, 300ms debounced search, sortable paginated table"
  - "CaseTable — checkbox selection, status badges (open/resolved/duplicate/bogus), 5 skeleton rows"
  - "FilterPanel — collapsible panel with status/category/department/assignee/date selects"
  - "FilterChips — Framer Motion stagger, × remove buttons"
  - "BulkActionBar — Framer Motion slide-down, POST /api/tickets/bulk, close/change_status dialogs"
  - "SearchInput — 300ms debounce + external value sync"
  - "EmptyState — SearchX icon, clear-filters button"
  - "Pagination — 10/25/50/100 page sizes, page number generation with ellipsis"
  - "Checkbox UI component (Radix @radix-ui/react-checkbox)"
  - "src/types/ticket.ts — Ticket, TicketSummary, FilterState, PaginatedTickets types"
  - "7 integration tests for CaseListPage (all passing)"

affects:
  - 08-core-frontend-screens (03, 04) — case detail will import Ticket type and navigate from CaseListPage

# Tech tracking
tech-stack:
  added: ["@tanstack/react-query (via 08-01)", "msw (via 08-01)", "@radix-ui/react-checkbox"]
  patterns:
    - "URL-as-state: all filter/sort/page state in URLSearchParams via useSearchParams"
    - "Debounced search: local state → useDebounce(300ms) → parent URL update"
    - "Framer Motion height animation: height 0→auto with AnimatePresence for conditional panels"
    - "Framer Motion stagger: itemVariants + AnimatePresence for filter chip enter/exit"

key-files:
  created:
    - src/types/ticket.ts
    - src/pages/CaseListPage.tsx
    - src/components/cases/CaseTable.tsx
    - src/components/cases/FilterPanel.tsx
    - src/components/cases/FilterChips.tsx
    - src/components/cases/SearchInput.tsx
    - src/components/cases/BulkActionBar.tsx
    - src/components/cases/EmptyState.tsx
    - src/components/cases/Pagination.tsx
    - src/components/ui/checkbox.tsx
    - src/__tests__/CaseListPage.test.tsx
  modified:
    - src/App.tsx (added /cases route → CaseListPage)
    - src/components/dashboard/RecentCasesFeed.tsx (optional reporterName null-safe)

key-decisions:
  - "URL-as-state for all filter params — enables bookmarkable/shareable filter URLs; React Router useSearchParams read/write"
  - "Debounce in both CaseListPage (debouncedQ for API call) and SearchInput (local debounce before parent notify) — prevents double-fire"
  - "Framer Motion height: 0 → auto for BulkActionBar — standard slide-down pattern, no fixed pixel height needed"
  - "Checkbox component created manually (not in Phase 7 component set) using @radix-ui/react-checkbox"
  - "BulkActionBar Assign dialog is a stub — full person combobox deferred; close and change_status are fully implemented"

patterns-established:
  - "URL filter pattern: derive FilterState from searchParams → debounce q → build queryParams → useQuery → updateFilter(partial) merges back"
  - "Skeleton pattern: conditional render of N skeleton rows in TableBody when loading === true"

# Metrics
duration: 11min
completed: 2026-07-08
---

# Phase 8 Plan 2: Case List Screen Summary

**Sortable paginated case list with URL-encoded filter state, 300ms debounce search, Framer Motion filter chips + slide-down bulk toolbar, skeleton loading, empty state, and 7 passing integration tests**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-08T19:39:45Z
- **Completed:** 2026-07-08T19:50:25Z
- **Tasks:** 2 completed
- **Files modified:** 13 (11 created, 2 modified)

## Accomplishments

- Complete CaseListPage with all filter state encoded in URLSearchParams (bookmarkable URLs)
- CaseTable with sortable columns, checkbox selection, status badge variants, 5 skeleton rows during load
- BulkActionBar with Framer Motion height 0→auto slide-down, POST /api/tickets/bulk integration
- FilterChips with AnimatePresence stagger entry/exit using itemVariants from Phase 7
- 7 integration tests all passing: table render, skeleton, debounce, filter chips, bulk selection, empty state, pagination

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared types + CaseListPage + CaseTable + FilterPanel + FilterChips + SearchInput** - `8e0505f` (feat)
2. **Task 2: BulkActionBar + EmptyState + Pagination + integration tests** - `3cfebbe` (feat)

## Files Created/Modified

- `src/types/ticket.ts` — Ticket, TicketSummary, FilterState, PaginatedTickets types
- `src/pages/CaseListPage.tsx` — Main case list page with URL-state, debounced search, all filter/sort/pagination
- `src/components/cases/CaseTable.tsx` — Sortable table with checkbox selection, status badges, skeleton rows
- `src/components/cases/FilterPanel.tsx` — Collapsible filter panel fetching categories/departments/people
- `src/components/cases/FilterChips.tsx` — Active filter badges with AnimatePresence + itemVariants
- `src/components/cases/SearchInput.tsx` — Debounced search input with external value sync
- `src/components/cases/BulkActionBar.tsx` — Slide-down bulk action bar with POST /api/tickets/bulk
- `src/components/cases/EmptyState.tsx` — Zero-results empty state with clear-filters button
- `src/components/cases/Pagination.tsx` — Page size select (10/25/50/100) + prev/next/numbered pages
- `src/components/ui/checkbox.tsx` — Checkbox with indeterminate support (Radix primitive)
- `src/__tests__/CaseListPage.test.tsx` — 7 integration tests using MSW + @testing-library/react
- `src/App.tsx` — Added /cases route pointing to CaseListPage
- `src/components/dashboard/RecentCasesFeed.tsx` — Added `?? '—'` null-safe for optional reporterName

## Decisions Made

- **URL-as-state pattern**: All filter/sort/page state lives in URLSearchParams. useSearchParams reads on render, updateFilter() merges partial changes back. Enables bookmarking and browser back/forward to restore filters.
- **Dual debounce**: CaseListPage debounces the API query key via `useDebounce(filterState.q, 300)`. SearchInput also debounces local state before calling onChange. This prevents firing the API on every keystroke while keeping UI responsive.
- **Height animation**: BulkActionBar uses `{ height: 0 → 'auto' }` in Framer Motion — no fixed pixel height needed, works with any content height.
- **Checkbox component**: Phase 7 didn't include Checkbox. Created manually using `@radix-ui/react-checkbox` (already in package.json dependencies).
- **Assign stub in BulkActionBar**: Full person search combobox would require additional API integration. Assign shows a dialog with explanatory text; close and change_status are fully functional.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] RecentCasesFeed reporterName null-safety**
- **Found during:** Task 1 build check
- **Issue:** My new `TicketSummary` type made `reporterName` optional (`string | undefined`) but `RecentCasesFeed` rendered it as a plain string (could render `undefined` as text)
- **Fix:** Added `?? '—'` fallback: `{ticket.reporterName ?? '—'}`
- **Files modified:** `src/components/dashboard/RecentCasesFeed.tsx`
- **Verification:** TypeScript build passes with no errors
- **Committed in:** 8e0505f (Task 1 commit)

**2. [Rule 3 - Blocking] Phase 08-01 had stub BulkActionBar/EmptyState/Pagination**
- **Found during:** Task 2 — discovered these files existed as stubs in HEAD commit (phase 08-01)
- **Issue:** Stubs had different prop interfaces (optional props, `title?: string`) vs plan's required props
- **Fix:** Re-wrote files with full implementations; git tracked them as modified files in Task 2 commit
- **Files modified:** `src/components/cases/BulkActionBar.tsx`, `src/components/cases/EmptyState.tsx`, `src/components/cases/Pagination.tsx`
- **Verification:** Build passes, 7 tests pass
- **Committed in:** 3cfebbe (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

None - all 7 integration tests pass, build succeeds with 0 TypeScript errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CaseListPage is complete and registered at /cases
- Ticket types (Ticket, TicketSummary, FilterState) are exported and ready for Phase 8 Plan 3 (case detail)
- BulkActionBar POST /api/tickets/bulk integration ready (requires backend bulk endpoint)
- Filter panel fetches from /api/categories/public, /api/departments, /api/people, /api/issue-types
- Row click navigates to /cases/{id} (case detail — to be built in 08-04)

---
*Phase: 08-core-frontend-screens*
*Completed: 2026-07-08*

## Self-Check: PASSED

All 10 key files exist on disk. Both task commits (8e0505f, 3cfebbe) verified in git log.
