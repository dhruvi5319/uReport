---
phase: 08-core-frontend-screens
plan: "01"
subsystem: ui
tags: [react, tanstack-query, recharts, leaflet, mapbox-gl, msw, vitest, dashboard]

# Dependency graph
requires:
  - phase: 07-react-design-system-and-shell
    provides: shadcn/ui components, AppShell, AuthContext, ThemeContext, Skeleton, Card, Badge, Button
provides:
  - DashboardPage with 4 parallel useQueries (stats/chart/geoclusters/tickets)
  - StatCard with animated counter, destructive variant, URLSearchParams filter links
  - RecentCasesFeed with relative timestamps, status badges, skeleton loading
  - StatusDonut with Recharts PieChart and sr-only accessible data table
  - MapWidget with Mapbox token / Leaflet fallback and cluster markers
  - QuickLinks reading authenticated user ID from AuthContext
  - TanStack QueryClient singleton with 30s staleTime
  - useDebounce hook
  - MSW v2 handlers and server for dashboard API endpoints
  - DashboardPage Vitest integration test suite (5 tests passing)
affects: [08-02-case-list, 08-03-case-detail, 08-04-public-submission]

# Tech tracking
tech-stack:
  added:
    - "@tanstack/react-query@^5.0.0"
    - "recharts@^2.12.0"
    - "leaflet@^1.9.0"
    - "mapbox-gl@3.25.0"
    - "react-dropzone@^14.2.0"
    - "react-hook-form@^7.52.0"
    - "@hookform/resolvers@^3.9.0"
    - "zod@^3.23.0"
    - "msw@^2.3.0 (devDependency)"
  patterns:
    - "useQueries for parallel data fetching (4 simultaneous requests in single call)"
    - "MSW v2 (http/HttpResponse) for API mocking in Vitest tests"
    - "Framer Motion useMotionValue + animate for animated counter in StatCard"
    - "sr-only accessible data table sibling pattern for chart accessibility"
    - "Dynamic import of mapbox-gl with Leaflet fallback when VITE_MAPBOX_TOKEN absent"

key-files:
  created:
    - src/lib/queryClient.ts
    - src/hooks/useDebounce.ts
    - src/components/dashboard/StatCard.tsx
    - src/components/dashboard/RecentCasesFeed.tsx
    - src/components/dashboard/StatusDonut.tsx
    - src/components/dashboard/MapWidget.tsx
    - src/components/dashboard/QuickLinks.tsx
    - src/__tests__/DashboardPage.test.tsx
    - src/__tests__/setup/msw-handlers.ts
    - src/__tests__/setup/server.ts
    - src/components/cases/BulkActionBar.tsx (stub)
    - src/components/cases/EmptyState.tsx (stub)
    - src/components/cases/Pagination.tsx (stub)
  modified:
    - src/main.tsx (added QueryClientProvider)
    - src/pages/DashboardPage.tsx (full rewrite with useQueries)
    - frontend/package.json (added 8 new deps)
    - src/test-setup.ts (added ResizeObserver mock)

key-decisions:
  - "mapbox-gl installed as production dep so TypeScript can compile dynamic import; token check at runtime ensures Leaflet fallback when token absent"
  - "useAuth() hook used in QuickLinks (not direct AuthContext import) — consistent with project auth pattern"
  - "Stub BulkActionBar/EmptyState/Pagination created to unblock pre-existing CaseListPage TypeScript build errors"
  - "ResizeObserver mock added to test-setup.ts for recharts ResponsiveContainer compatibility"

patterns-established:
  - "MSW v2 server: beforeAll(server.listen) + afterEach(server.resetHandlers) + afterAll(server.close) pattern"
  - "vi.mock('leaflet') in test file for DOM-free map testing"

# Metrics
duration: 7min
completed: 2026-07-08
---

# Phase 8 Plan 1: Dashboard Screen with TanStack Query, Recharts Donut, Leaflet/Mapbox Map Summary

**TanStack Query v5 wired with 4 parallel useQueries; Dashboard built with StatCard, StatusDonut (Recharts + sr-only a11y table), MapWidget (Mapbox/Leaflet fallback), RecentCasesFeed, and QuickLinks; MSW v2 integration tests pass**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-08T19:40:01Z
- **Completed:** 2026-07-08T19:47:26Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- TanStack Query v5 set up with QueryClient (30s staleTime) wrapped in main.tsx QueryClientProvider
- DashboardPage fires 4 parallel API requests via useQueries (stats, chart, geoclusters, tickets)
- StatCard with Framer Motion animated counter, destructive variant (red only when overdue > 0), and URLSearchParams filter links
- StatusDonut with Recharts PieChart + sr-only accessible data table (WCAG 2.1 AA)
- MapWidget: dynamic Mapbox import when VITE_MAPBOX_TOKEN present; Leaflet fallback otherwise
- RecentCasesFeed with Intl.RelativeTimeFormat relative timestamps and status badges
- QuickLinks reading authenticated user's personId from useAuth()
- MSW v2 handlers + server; 5 DashboardPage integration tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: TanStack Query setup + DashboardPage + stat/feed/donut widgets** - `a36d9a7` (feat)
2. **Task 2: MapWidget (Mapbox/Leaflet fallback) + QuickLinks + Dashboard integration tests** - `6d78513` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `src/lib/queryClient.ts` — TanStack QueryClient singleton with staleTime/retry config
- `src/hooks/useDebounce.ts` — Generic debounce hook
- `src/components/dashboard/StatCard.tsx` — Animated counter card with destructive variant + filter link
- `src/components/dashboard/RecentCasesFeed.tsx` — 10-row feed with relative time and status badges
- `src/components/dashboard/StatusDonut.tsx` — Recharts PieChart donut with sr-only accessible data table
- `src/components/dashboard/MapWidget.tsx` — Mapbox/Leaflet fallback cluster map widget
- `src/components/dashboard/QuickLinks.tsx` — New Case / All Open / Assigned to Me quick links
- `src/__tests__/DashboardPage.test.tsx` — 5 integration tests (MSW-backed)
- `src/__tests__/setup/msw-handlers.ts` — MSW v2 request handlers for dashboard endpoints
- `src/__tests__/setup/server.ts` — MSW node server setup
- `src/main.tsx` — Added QueryClientProvider wrapping App
- `src/pages/DashboardPage.tsx` — Full rewrite with 4 parallel useQueries
- `src/test-setup.ts` — Added ResizeObserver mock
- `src/components/cases/BulkActionBar.tsx` — Stub (blocking fix)
- `src/components/cases/EmptyState.tsx` — Stub with onClearFilters prop (blocking fix)
- `src/components/cases/Pagination.tsx` — Stub with page/total/pageSize props (blocking fix)

## Decisions Made
- mapbox-gl installed as production dependency so TypeScript can compile the dynamic import statement; runtime VITE_MAPBOX_TOKEN check ensures Leaflet fallback when token is absent
- useAuth() used in QuickLinks instead of direct AuthContext import (consistent with project auth pattern)
- Stub BulkActionBar/EmptyState/Pagination created to fix pre-existing CaseListPage build error (missing components from a prior plan scaffold)
- ResizeObserver mock added globally to test-setup.ts for recharts ResponsiveContainer

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub BulkActionBar, EmptyState, Pagination to fix pre-existing CaseListPage build errors**
- **Found during:** Task 1 (npm run build)
- **Issue:** CaseListPage.tsx (pre-existing from prior phase) imported BulkActionBar, EmptyState, Pagination which did not exist — TypeScript error blocked build
- **Fix:** Created type-safe stubs with correct prop signatures inferred from CaseListPage usage
- **Files modified:** src/components/cases/BulkActionBar.tsx, EmptyState.tsx, Pagination.tsx
- **Verification:** npm run build exits 0
- **Committed in:** a36d9a7 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added ResizeObserver mock to test-setup.ts**
- **Found during:** Task 2 (first test run)
- **Issue:** recharts ResponsiveContainer requires ResizeObserver which jsdom doesn't implement — all tests threw ReferenceError
- **Fix:** Added global ResizeObserver stub (observe/unobserve/disconnect stubs) to test-setup.ts
- **Files modified:** src/test-setup.ts
- **Verification:** All 5 DashboardPage tests pass
- **Committed in:** 6d78513 (Task 2 commit)

**3. [Rule 3 - Blocking] Installed mapbox-gl as production dependency**
- **Found during:** Task 2 (build)
- **Issue:** TypeScript could not compile dynamic `import('mapbox-gl')` without the package installed (even for optional/dynamic imports)
- **Fix:** npm install mapbox-gl (also added to package.json)
- **Files modified:** package.json, package-lock.json
- **Verification:** npm run build exits 0
- **Committed in:** a36d9a7 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking × 2, 1 missing critical)
**Impact on plan:** All auto-fixes were necessary for build and test correctness. No scope creep. Stub case components align with the next plan's full implementation scope.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None — no external service configuration required. (VITE_MAPBOX_TOKEN is optional; Leaflet fallback used when absent.)

## Next Phase Readiness
- Dashboard screen complete with all 5 widgets (stat cards, map, donut, feed, quick links)
- TanStack Query infrastructure ready for 08-02 (Case List), 08-03 (Case Detail), 08-04 (Public Submission)
- useDebounce, queryClient, and MSW server/handlers available for reuse
- StatCard links point to /cases with correct filter params — ready for Case List implementation

## Self-Check: PASSED

- ✅ src/lib/queryClient.ts exists
- ✅ src/hooks/useDebounce.ts exists
- ✅ src/components/dashboard/StatCard.tsx exists
- ✅ src/components/dashboard/RecentCasesFeed.tsx exists
- ✅ src/components/dashboard/StatusDonut.tsx exists
- ✅ src/components/dashboard/MapWidget.tsx exists
- ✅ src/components/dashboard/QuickLinks.tsx exists
- ✅ src/__tests__/DashboardPage.test.tsx exists
- ✅ src/__tests__/setup/msw-handlers.ts exists
- ✅ src/__tests__/setup/server.ts exists
- ✅ Commit a36d9a7 found
- ✅ Commit 6d78513 found

---
*Phase: 08-core-frontend-screens*
*Completed: 2026-07-08*
