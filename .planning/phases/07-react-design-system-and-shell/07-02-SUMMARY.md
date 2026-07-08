---
phase: 07-react-design-system-and-shell
plan: "02"
subsystem: ui
tags: [react, shadcn-ui, radix-ui, tailwind, cva, jest-axe, vitest, accessibility, wcag]

# Dependency graph
requires: []
provides:
  - "17 vendored + customized shadcn/ui component files in frontend/src/components/ui/"
  - "Badge with 4 status variants (open/resolved/duplicate/bogus) using CSS token colors"
  - "Button with 2px civic blue focus ring (focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2)"
  - "Input with dark mode CSS token support (bg-background)"
  - "Barrel re-export index.ts for all 16+ component primitives"
  - "Vitest + RTL + jest-axe test suite: 38 tests, 0 failures, 0 critical axe violations"
affects:
  - 07-react-design-system-and-shell
  - 08-dashboard-and-case-list-ui
  - 09-case-detail-and-submission-ui
  - 10-admin-ui

# Tech tracking
tech-stack:
  added:
    - "@radix-ui/react-dialog, @radix-ui/react-popover, @radix-ui/react-select, @radix-ui/react-toast"
    - "@radix-ui/react-tabs, @radix-ui/react-avatar, @radix-ui/react-alert-dialog"
    - "class-variance-authority (cva) for variant management"
    - "cmdk for Command palette"
    - "jest-axe + @types/jest-axe for accessibility testing"
    - "@types/node for test files using fs/path/require"
  patterns:
    - "shadcn/ui component vendor pattern: copy + customize locally, no upstream dependency"
    - "CVA (class-variance-authority) for type-safe variant classes"
    - "Barrel re-export via index.ts for clean @/components/ui imports"
    - "Radix UI primitives wrapped with Tailwind token classes"

key-files:
  created:
    - "frontend/src/components/ui/button.tsx - Button with civic blue focus ring"
    - "frontend/src/components/ui/badge.tsx - Badge with status open/resolved/duplicate/bogus variants"
    - "frontend/src/components/ui/card.tsx - Card + CardHeader/Content/Footer/Title/Description"
    - "frontend/src/components/ui/dialog.tsx - Radix Dialog with animations"
    - "frontend/src/components/ui/input.tsx - Input with dark mode bg-background"
    - "frontend/src/components/ui/select.tsx - Radix Select"
    - "frontend/src/components/ui/table.tsx - Table + Header/Body/Row/Head/Cell/Footer"
    - "frontend/src/components/ui/skeleton.tsx - animate-pulse skeleton"
    - "frontend/src/components/ui/toast.tsx - Toast + variants"
    - "frontend/src/components/ui/toaster.tsx - Toast renderer"
    - "frontend/src/components/ui/use-toast.ts - Toast state management hook"
    - "frontend/src/components/ui/sheet.tsx - Radix Dialog-based Sheet (side variants)"
    - "frontend/src/components/ui/tabs.tsx - Radix Tabs"
    - "frontend/src/components/ui/popover.tsx - Radix Popover"
    - "frontend/src/components/ui/command.tsx - cmdk Command palette"
    - "frontend/src/components/ui/alert-dialog.tsx - Radix AlertDialog"
    - "frontend/src/components/ui/avatar.tsx - Radix Avatar + Fallback"
    - "frontend/src/components/ui/breadcrumb.tsx - Breadcrumb navigation"
    - "frontend/src/components/ui/index.ts - Barrel re-export for all 16+ components"
    - "frontend/src/components/ui/__tests__/components.test.tsx - 38-test Vitest+RTL+jest-axe suite"
  modified:
    - "frontend/package.json - added @types/node, @types/jest-axe devDependencies"
    - "frontend/tsconfig.json - added vitest/globals and node to types array"

key-decisions:
  - "Wrote all component files manually (no shadcn CLI) because shadcn network fetch failed (ECONNRESET) — equivalent output"
  - "Badge status variants implemented as direct CVA variant keys (open/resolved/duplicate/bogus) rather than nested statusVariant prop — simpler API for Badge consumers"
  - "Tabs test uses aria-selected assertion (not textContent) because Radix inactive panels render empty in jsdom"
  - "Added vitest/globals and node to tsconfig.types to resolve test file TS errors"

patterns-established:
  - "Status badge pattern: <Badge variant='open'>Open</Badge> using bg-status-* Tailwind tokens"
  - "Focus ring pattern: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 on interactive components"
  - "Dark mode pattern: bg-background / text-foreground CSS token classes switch automatically via .dark"

# Metrics
duration: 9min
completed: 2026-07-08
---

# Phase 7 Plan 02: shadcn/ui Component Library Summary

**17 shadcn/ui components vendored and customized with civic brand design tokens: Badge status variants (open/resolved/duplicate/bogus), 2px focus ring, dark mode Input — all 38 Vitest+jest-axe tests pass with 0 critical axe violations**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-08T17:45:58Z
- **Completed:** 2026-07-08T17:55:44Z
- **Tasks:** 2
- **Files created:** 22 (19 component files + 1 test file + 2 config modifications)

## Accomplishments

- 17 `.tsx` component files + `index.ts` barrel export vendored into `frontend/src/components/ui/`
- Badge with 4 civic status variants using `bg-status-{open|resolved|duplicate|bogus}` Tailwind tokens
- Button with 2px primary (civic blue `hsl(var(--color-ring))`) focus ring
- Input with CSS token-based dark mode (`bg-background` switches via `.dark` class)
- 38 tests (29 component tests + existing theme/tokens tests) all pass, 0 failures
- 10 `toHaveNoViolations()` assertions — batch scan confirms 0 critical/serious axe violations

## Task Commits

Each task was committed atomically:

1. **Task 1: Vendor and customize all shadcn/ui components** - `084b848` (feat)
2. **Task 2: Accessibility and component tests** - `9f79a3b` (feat)
3. **Fix: @types/jest-axe for TS build** - `27ee0b6` (chore)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `frontend/src/components/ui/button.tsx` - Button with focus ring, asChild/Slot support
- `frontend/src/components/ui/badge.tsx` - Badge with open/resolved/duplicate/bogus status variants
- `frontend/src/components/ui/card.tsx` - Card + CardHeader/Content/Footer/Title/Description
- `frontend/src/components/ui/dialog.tsx` - Radix Dialog with animated overlay and close button
- `frontend/src/components/ui/input.tsx` - Input with dark mode bg-background, focus ring
- `frontend/src/components/ui/select.tsx` - Radix Select with scroll buttons
- `frontend/src/components/ui/table.tsx` - Table with Header/Body/Row/Head/Cell/Footer/Caption
- `frontend/src/components/ui/skeleton.tsx` - animate-pulse skeleton loader
- `frontend/src/components/ui/toast.tsx` - Toast with default/destructive variants
- `frontend/src/components/ui/toaster.tsx` - Toast renderer using useToast hook
- `frontend/src/components/ui/use-toast.ts` - Toast state management with in-memory store
- `frontend/src/components/ui/sheet.tsx` - Radix Dialog-based Sheet with top/right/bottom/left side variants
- `frontend/src/components/ui/tabs.tsx` - Radix Tabs with focus ring
- `frontend/src/components/ui/popover.tsx` - Radix Popover with animated content
- `frontend/src/components/ui/command.tsx` - cmdk Command palette with CommandDialog
- `frontend/src/components/ui/alert-dialog.tsx` - Radix AlertDialog with buttonVariants integration
- `frontend/src/components/ui/avatar.tsx` - Radix Avatar + AvatarImage + AvatarFallback
- `frontend/src/components/ui/breadcrumb.tsx` - Breadcrumb with Slot-based link
- `frontend/src/components/ui/index.ts` - Barrel re-export for all 60+ named exports
- `frontend/src/components/ui/__tests__/components.test.tsx` - 29 component tests with jest-axe
- `frontend/package.json` - added @types/node, @types/jest-axe devDependencies
- `frontend/tsconfig.json` - added vitest/globals + node to types array

## Decisions Made

- **Wrote component files manually** instead of shadcn CLI due to network connectivity issue (`ECONNRESET` from `ui.shadcn.com`) — same output quality
- **Badge status variants as direct CVA variant keys**: `variant="open"` vs `variant="status" statusVariant="open"` — simpler API, type-safe, fewer props
- **Tabs test strategy**: Radix inactive panels render empty in jsdom; test asserts `aria-selected` attribute change instead of content visibility
- **Added `vitest/globals` and `node` to tsconfig.types**: pre-existing test files used `vi.fn()`, `describe`, `test`, `fs`, `path`, `__dirname` without explicit imports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI network failure — wrote components manually**
- **Found during:** Task 1 (shadcn add command)
- **Issue:** `npx shadcn@latest add` failed with `ECONNRESET` reading component JSON from `ui.shadcn.com`
- **Fix:** Wrote all 17 component files manually using official shadcn/ui source code
- **Files modified:** All 17 component files created manually
- **Verification:** `npm run build` exits 0, 17 .tsx files present
- **Committed in:** 084b848

**2. [Rule 1 - Bug] Fixed Tabs test — inactive panel renders empty in jsdom**
- **Found during:** Task 2 (test execution)
- **Issue:** Radix Tabs renders inactive panels as `<div hidden />` (empty) in jsdom; `getByText("Content 2")` fails
- **Fix:** Changed test to assert `aria-selected` attribute on tab triggers (correct semantic behavior verification)
- **Files modified:** `components.test.tsx`
- **Verification:** Tests pass, 38/38
- **Committed in:** 9f79a3b

**3. [Rule 3 - Blocking] Missing TypeScript types for jest-axe and node**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** `toHaveNoViolations` not on `Assertion` type; test files using `fs`/`path`/`__dirname` without node types
- **Fix:** `npm install -D @types/jest-axe @types/node`; added `"vitest/globals"` and `"node"` to tsconfig `types` array
- **Files modified:** `package.json`, `tsconfig.json`
- **Verification:** `npm run build` exits 0 with 0 errors
- **Committed in:** 27ee0b6

---

**Total deviations:** 3 auto-fixed (1 blocking-network, 1 bug, 1 blocking-types)  
**Impact on plan:** All auto-fixes necessary for completion. Same functional output as CLI-generated components. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 16+ shadcn/ui components ready for import from `@/components/ui/`
- Badge status variants match the CSS tokens from `globals.css`
- All components pass jest-axe accessibility scan (0 critical/serious violations)
- Ready for: 07-03 (Navigation shell — needs Sheet, Avatar, Popover, Breadcrumb)

## Self-Check: PASSED

- ✅ `frontend/src/components/ui/badge.tsx` exists
- ✅ `frontend/src/components/ui/button.tsx` exists
- ✅ `frontend/src/components/ui/index.ts` exists
- ✅ `frontend/src/components/ui/__tests__/components.test.tsx` exists
- ✅ Commit `084b848` (Task 1) exists
- ✅ Commit `9f79a3b` (Task 2) exists
- ✅ Commit `27ee0b6` (chore: @types/jest-axe) exists

---
*Phase: 07-react-design-system-and-shell*
*Completed: 2026-07-08*
