---
phase: 07-react-design-system-and-shell
plan: GAP-01
subsystem: ui
tags: [react, tailwind, shadcn, design-tokens, react-router, framer-motion]

# Dependency graph
requires: []
provides:
  - Amber HSL duplicate status badge color in light and dark mode
  - Adaptive focus ring offset via ringOffsetColor Tailwind token
  - focus-visible:ring-offset-background on buttonVariants
  - overflow-x-hidden on Sidebar nav (focus rings no longer clipped)
  - ComingSoonPage placeholder for unregistered routes
  - Catch-all Route inside AppShell covering 11 unregistered sidebar links
affects: [07-react-design-system-and-shell, UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ringOffsetColor DEFAULT referencing CSS variable for adaptive ring offset"
    - "Catch-all <Route path='*'> inside authenticated AppShell route group"

key-files:
  created:
    - frontend/src/pages/ComingSoonPage.tsx
  modified:
    - frontend/src/globals.css
    - frontend/tailwind.config.ts
    - frontend/src/components/ui/button.tsx
    - frontend/src/components/shell/Sidebar.tsx
    - frontend/src/App.tsx

key-decisions:
  - "ringOffsetColor DEFAULT uses hsl(var(--color-background)) to adapt ring offset to both light and dark mode backgrounds"
  - "Catch-all route nested inside AppShell group so unregistered paths render with auth protection (redirect to /login if unauthenticated)"
  - "ComingSoonPage uses framer-motion pageVariants consistent with other page transitions"

patterns-established:
  - "Adaptive ring offset: ringOffsetColor in tailwind.config.ts + focus-visible:ring-offset-background in component base class"
  - "Placeholder routes: catch-all <Route path='*'> inside authenticated shell group"

# Metrics
duration: 2min
completed: 2026-07-08
---

# Phase 7 GAP-01: UAT Gap Closure Summary

**Amber duplicate badge, adaptive button focus ring, and ComingSoonPage catch-all for 11 unregistered sidebar nav links**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-08T19:18:18Z
- **Completed:** 2026-07-08T19:20:06Z
- **Tasks:** 2 completed
- **Files modified:** 6 (4 modified, 1 created, 1 App.tsx updated)

## Accomplishments
- Fixed `--color-status-duplicate` from grey (215 16% 47%) to amber (38 92% 50%) in light mode and (38 90% 60%) in dark mode
- Added `ringOffsetColor: { DEFAULT: "hsl(var(--color-background))" }` to Tailwind config and `focus-visible:ring-offset-background` to `buttonVariants` base class for adaptive focus ring offset
- Changed Sidebar `<nav>` from `overflow-hidden` to `overflow-x-hidden` so Tab-focused nav link focus rings are no longer clipped
- Created `ComingSoonPage.tsx` with framer-motion animation, descriptive "Coming Soon" heading, and "Back to Dashboard" button
- Added `<Route path="*" element={<ComingSoonPage />} />` as catch-all inside the `AppShell` route group — all 11 unregistered sidebar nav links now render a placeholder page instead of a blank screen

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix duplicate badge color + button focus ring** - `dccd43f` (fix)
2. **Task 2: Add ComingSoonPage + catch-all route** - `7c6ecba` (feat)

**Plan metadata:** (see final docs commit)

## Files Created/Modified
- `frontend/src/globals.css` - `--color-status-duplicate` changed to amber in :root and .dark
- `frontend/tailwind.config.ts` - Added `ringOffsetColor` token in `theme.extend`
- `frontend/src/components/ui/button.tsx` - Added `focus-visible:ring-offset-background` to `buttonVariants` base class
- `frontend/src/components/shell/Sidebar.tsx` - Changed `overflow-hidden` → `overflow-x-hidden` on `<nav>`
- `frontend/src/pages/ComingSoonPage.tsx` - New placeholder page component
- `frontend/src/App.tsx` - Added `ComingSoonPage` import and `<Route path="*">` catch-all

## Decisions Made
- Used `hsl(var(--color-background))` for `ringOffsetColor DEFAULT` so the ring offset adapts to both light and dark mode without hard-coding white
- Catch-all route is nested inside `<Route element={<AppShell />}>` so it benefits from the existing auth redirect logic (`useEffect` → `navigate('/login')` when `!user`)
- `ComingSoonPage` uses the existing `pageVariants` from `lib/animations.ts` for visual consistency with `DashboardPage` transitions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three UAT gaps are closed: amber badge, adaptive focus ring, catch-all route
- Vitest suite: 65 tests pass, 0 failing
- TypeScript: `tsc --noEmit` exits 0
- Ready for visual UAT verification (browser: amber Duplicate badge, Tab focus ring with adaptive offset, ComingSoonPage on /cases etc.)

---
*Phase: 07-react-design-system-and-shell*
*Completed: 2026-07-08*

## Self-Check: PASSED

- FOUND: frontend/src/globals.css ✓
- FOUND: frontend/tailwind.config.ts ✓
- FOUND: frontend/src/components/ui/button.tsx ✓
- FOUND: frontend/src/components/shell/Sidebar.tsx ✓
- FOUND: frontend/src/pages/ComingSoonPage.tsx ✓
- FOUND: frontend/src/App.tsx ✓
- Commits dccd43f and 7c6ecba verified in git log ✓
