---
phase: 07-react-design-system-and-shell
plan: "04"
subsystem: ui
tags: [react, framer-motion, accessibility, wcag, axe-core, vitest, tailwind, nginx, docker]

# Dependency graph
requires:
  - phase: 07-01
    provides: animations.ts pageVariants, AuthContext, ThemeContext, design tokens
  - phase: 07-02
    provides: shadcn/ui Sheet, Avatar, Popover, Breadcrumb components
  - phase: 07-03
    provides: AppShell, Navbar, Sidebar, Breadcrumb, MobileDrawer shell components
provides:
  - useReducedMotion hook for prefers-reduced-motion media query
  - AnimationProvider wrapping MotionConfig reducedMotion='user' for global Framer Motion support
  - App.tsx with AnimationProvider in provider tree
  - Full navigation shell (AppShell, Navbar, Sidebar, Breadcrumb, MobileDrawer)
  - Accessibility test suite with axe-core WCAG 2.1 AA scan
  - Responsive viewport tests at 375px, 768px, 1280px
  - Multi-stage Dockerfile (Node 20 build → nginx serve)
affects: [08-react-screens, 09-testing-and-deployment]

# Tech tracking
tech-stack:
  added: ["@testing-library/user-event@^14.5.0", "framer-motion MotionConfig reducedMotion"]
  patterns:
    - "useReducedMotion hook reading prefers-reduced-motion media query with reactive addEventListener"
    - "AnimationProvider context pattern with MotionConfig for global reduced-motion override"
    - "jest-axe WCAG 2.1 AA scan with color-contrast disabled (CSS custom properties not resolved in jsdom)"
    - "userEvent.setup() keyboard navigation testing via Tab key simulation"
    - "Multi-stage Docker build: node:20-alpine builder → nginx:alpine server"

key-files:
  created:
    - frontend/src/lib/hooks/useReducedMotion.ts
    - frontend/src/components/AnimationProvider.tsx
    - frontend/src/components/shell/Navbar.tsx
    - frontend/src/components/shell/Sidebar.tsx
    - frontend/src/components/shell/Breadcrumb.tsx
    - frontend/src/components/shell/MobileDrawer.tsx
    - frontend/src/components/shell/__tests__/accessibility.test.tsx
    - frontend/src/__tests__/responsive.test.tsx
  modified:
    - frontend/src/App.tsx (added AnimationProvider wrapper)
    - frontend/src/components/shell/AppShell.tsx (full shell with skip link, Navbar, Sidebar)
    - frontend/Dockerfile (multi-stage Node + nginx build)
    - frontend/package.json (added @testing-library/user-event)

key-decisions:
  - "AnimationProvider uses MotionConfig reducedMotion='user' — Framer Motion honors OS prefers-reduced-motion natively at library level"
  - "Shell components (Navbar, Sidebar, Breadcrumb, MobileDrawer) built in this plan as blocking deviation since 07-03 was not executed"
  - "axe-core color-contrast rule disabled in tests — CSS custom properties not resolved in jsdom environment"
  - "Multi-stage Dockerfile uses npm ci (not npm install) for reproducible builds per T-07-13 security mitigation"

patterns-established:
  - "Pattern: useReducedMotion + AnimationProvider pair — hook reads OS signal, provider distributes to all Framer Motion components"
  - "Pattern: accessibility tests mock AnimationProvider to avoid Framer Motion in jsdom"
  - "Pattern: responsive tests use setViewport() helper to set window.innerWidth before each test"

# Metrics
duration: 15min
completed: 2026-07-08
---

# Phase 7 Plan 4: Animation System, Accessibility Tests, and Responsive Tests Summary

**useReducedMotion hook + AnimationProvider using Framer Motion MotionConfig, full shell navigation (AppShell/Navbar/Sidebar/MobileDrawer/Breadcrumb), axe-core WCAG 2.1 AA scan (0 critical violations), and responsive tests at 375/768/1280px**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-08T17:57:15Z
- **Completed:** 2026-07-08T18:04:26Z
- **Tasks:** 2 completed
- **Files modified:** 11

## Accomplishments

- Created `useReducedMotion` hook using `window.matchMedia('(prefers-reduced-motion: reduce)')` with reactive event listener
- Created `AnimationProvider` wrapping `<MotionConfig reducedMotion="user">` — Framer Motion honors OS reduced-motion preference globally
- Built full navigation shell: AppShell (skip link + redirect guard), Navbar (hamburger, theme toggle, user avatar), Sidebar (collapsible w-64/w-16, localStorage persist, role filter), Breadcrumb (14-route map), MobileDrawer (Sheet-based)
- Accessibility test suite: axe WCAG 2.1 AA scan (0 critical/serious violations), skip link first in DOM, all icon buttons have aria-label, keyboard Tab navigation
- Responsive tests at 375px, 768px, 1280px confirming no render errors and no inline overflow
- Updated Dockerfile to multi-stage Node 20 builder + nginx serve

## Task Commits

Each task was committed atomically:

1. **Task 1: useReducedMotion hook, AnimationProvider, full AppShell, Dockerfile** - `6a2b06b` (feat)
2. **Task 2: Accessibility test suite and responsive smoke tests** - `ec17a03` (feat)
3. **Fix: TypeScript unused variable in accessibility test** - `f392aaa` (fix)

## Files Created/Modified

- `frontend/src/lib/hooks/useReducedMotion.ts` - React hook wrapping prefers-reduced-motion media query
- `frontend/src/components/AnimationProvider.tsx` - Context provider with MotionConfig reducedMotion="user"
- `frontend/src/App.tsx` - Updated to wrap routes in AnimationProvider
- `frontend/src/components/shell/AppShell.tsx` - Full shell with skip link, Navbar, Sidebar, main content
- `frontend/src/components/shell/Navbar.tsx` - City logo, hamburger, dark mode toggle, user avatar popover
- `frontend/src/components/shell/Sidebar.tsx` - Collapsible w-64/w-16 with role-based nav filtering
- `frontend/src/components/shell/Breadcrumb.tsx` - Route-aware breadcrumb with 14-route map + dynamic segments
- `frontend/src/components/shell/MobileDrawer.tsx` - Sheet-based mobile navigation drawer
- `frontend/src/components/shell/__tests__/accessibility.test.tsx` - Axe WCAG 2.1 AA full shell scan
- `frontend/src/__tests__/responsive.test.tsx` - Responsive smoke tests at 375px/768px/1280px
- `frontend/Dockerfile` - Multi-stage Node 20 Alpine builder → nginx Alpine server

## Decisions Made

- Used `MotionConfig reducedMotion="user"` — delegates reduced-motion handling to Framer Motion's built-in OS-level detection rather than custom CSS; more reliable and covers all motion automatically
- Built shell components (Navbar, Sidebar, Breadcrumb, MobileDrawer) as blocking deviation since plan 07-03 was not previously executed — these are required by the 07-04 accessibility tests
- Disabled `color-contrast` axe rule in tests — CSS custom properties (Tailwind/shadcn tokens) are not resolved in jsdom; this rule would produce false positives in the test environment
- Multi-stage Dockerfile uses `npm ci` (not `npm install`) for reproducible builds from package-lock.json

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Built shell components from 07-03 (not previously executed)**
- **Found during:** Task 1 (useReducedMotion hook, AnimationProvider, App.tsx update)
- **Issue:** Plan 07-04 accessibility tests reference `AppShell` which imports `Navbar` and `Sidebar` — these files didn't exist (07-03 was not executed). The test suite would fail with import errors.
- **Fix:** Created all 5 shell component files (AppShell, Navbar, Sidebar, Breadcrumb, MobileDrawer) per the 07-03 plan specification before writing 07-04 tests
- **Files modified:** frontend/src/components/shell/AppShell.tsx, Navbar.tsx, Sidebar.tsx, Breadcrumb.tsx, MobileDrawer.tsx
- **Verification:** `npm run build` succeeds, all 65 tests pass
- **Committed in:** 6a2b06b (Task 1 commit)

**2. [Rule 1 - Bug] Fixed unused variable TypeScript error in accessibility test**
- **Found during:** Final verification (`npm run build`)
- **Issue:** `const { container }` was declared but not used in the keyboard navigation test, causing `TS6133: 'container' is declared but its value is never read` error
- **Fix:** Changed `const { container } = renderShell()` to just `renderShell()` in the Tab key focus test
- **Files modified:** frontend/src/components/shell/__tests__/accessibility.test.tsx
- **Verification:** `npm run build` exits 0 with no TypeScript errors
- **Committed in:** f392aaa (fix commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Blocking deviation was necessary — 07-03 shell components are a direct prerequisite for 07-04 accessibility tests. Bug fix was a minor TypeScript cleanup required for clean build.

## Self-Check: PASSED

- ✅ FOUND: frontend/src/lib/hooks/useReducedMotion.ts
- ✅ FOUND: frontend/src/components/AnimationProvider.tsx
- ✅ FOUND: frontend/src/components/shell/__tests__/accessibility.test.tsx
- ✅ FOUND: frontend/src/__tests__/responsive.test.tsx
- ✅ FOUND: frontend/Dockerfile (multi-stage build)
- ✅ FOUND commits: 6a2b06b, ec17a03, f392aaa

## Issues Encountered

None — all tests pass, build clean.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 7 complete: design system, shadcn/ui components, full navigation shell, animation system, accessibility, and responsive tests all passing
- All 65 tests pass in a single `npm run test` run
- Build produces clean output with no TypeScript errors
- Frontend Dockerfile updated for proper containerized deployment (Phase 9)
- Ready for Phase 8: React screens (cases list, case detail, admin screens)

---
*Phase: 07-react-design-system-and-shell*
*Completed: 2026-07-08*
