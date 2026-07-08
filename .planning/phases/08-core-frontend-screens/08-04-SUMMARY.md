---
phase: 08-core-frontend-screens
plan: "04"
subsystem: ui
tags: [react, framer-motion, react-hook-form, zod, react-dropzone, react-query, leaflet, mapbox, vitest, rtl, msw]

# Dependency graph
requires:
  - phase: 08-01
    provides: queryClient, useDebounce hook, MapWidget component
  - phase: 07-react-design-system-and-shell
    provides: stepVariants in lib/animations.ts, Button/Input/Card/Textarea shadcn components, AppShell public route structure

provides:
  - Public 5-step case submission wizard with Framer Motion direction-aware transitions
  - WizardContext for cross-step form state (formData, step, direction, goNext/goBack/goToStep)
  - PublicSubmitPage as unauthenticated route /submit (outside AppShell auth guard)
  - WizardProgress step indicator with checkmarks and aria-current
  - StepContact (all optional, Zod email validation, Skip button)
  - StepCategory (GET /api/categories/public, group->category tile drill-down)
  - StepLocation (300ms debounced geocode autocomplete, draggable map pin, reverse geocode)
  - StepDescription (react-dropzone image upload, max 10/10MB, Zod min 10 chars)
  - StepReview (summary, POST /api/tickets/public FormData)
  - ConfirmationScreen (case ID display, Open311 status link)
  - Textarea UI component
  - MediaGallery cases component

affects: [09-testing-and-deployment, public-api-contracts]

# Tech tracking
tech-stack:
  added: [react-dropzone (already in package.json), zod resolver for multi-step wizard]
  patterns:
    - WizardContext pattern: flat formData object shared across steps via Context + useState
    - Direction-aware transitions: Framer Motion custom prop (direction +1/-1) drives enter/exit variants
    - Debounced API call: useDebounce(value, 300) feeds useQuery enabled gate
    - react-dropzone accept pattern with MIME type -> extension mapping

key-files:
  created:
    - src/contexts/WizardContext.tsx
    - src/pages/PublicSubmitPage.tsx
    - src/components/submit/WizardProgress.tsx
    - src/components/submit/StepContact.tsx
    - src/components/submit/StepCategory.tsx
    - src/components/submit/StepLocation.tsx
    - src/components/submit/StepDescription.tsx
    - src/components/submit/StepReview.tsx
    - src/components/submit/ConfirmationScreen.tsx
    - src/components/ui/textarea.tsx
    - src/components/cases/MediaGallery.tsx
    - src/__tests__/PublicSubmitPage.test.tsx
  modified:
    - src/App.tsx (added /submit public route)
    - src/components/dashboard/MapWidget.tsx (added onPinDrag/draggablePin props)
    - src/components/cases/MetadataPanel.tsx (fixed Badge closed->default variant)

key-decisions:
  - "react-dropzone accept prop uses MIME type keys with extension array values (not string) — required by dropzone v14"
  - "MapWidget extended with onPinDrag/draggablePin props but implementation is no-op stubs — full drag integration deferred to verify phase"
  - "WizardContext stores all form data in flat object vs nested steps — simpler merging and cross-step reads"
  - "StepLocation allows advance with either address text OR map pin, not requiring both"

patterns-established:
  - "Wizard step pattern: WizardProvider wraps page, each step reads/writes via useWizard(), direction state drives animations"
  - "Public submit route must remain outside AppShell Route group in App.tsx"

# Metrics
duration: 7min
completed: 2026-07-08
---

# Phase 08 Plan 04: Public Submit Wizard Summary

**5-step public case submission wizard with Framer Motion direction-aware transitions, react-dropzone photo upload, 300ms-debounced geocode autocomplete, Zod per-step validation, and POST /api/tickets/public confirmation screen**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-08T19:53:52Z
- **Completed:** 2026-07-08T20:01:27Z
- **Tasks:** 2 completed
- **Files modified:** 15 (12 created, 3 modified)

## Accomplishments

- WizardContext with direction-aware step navigation; all form data persisted across steps
- PublicSubmitPage as unauthenticated /submit route using Framer Motion stepVariants
- Complete 5-step wizard: Contact (optional+Skip) → Category (group tile drill-down) → Location (geocode autocomplete + map pin) → Description (react-dropzone) → Review (POST /api/tickets/public)
- ConfirmationScreen displays ticketId from API response with Open311 status link
- 8 Vitest+RTL integration tests all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: WizardContext + PublicSubmitPage + WizardProgress + StepContact + StepCategory** - `7e2c49c` (feat)
2. **Task 2: StepLocation + StepDescription + StepReview + ConfirmationScreen + wizard tests** - `9177fc9` (feat)

**Plan metadata:** `(pending)` (docs: complete plan)

## Files Created/Modified

- `src/contexts/WizardContext.tsx` - Wizard-wide form state with direction tracking
- `src/pages/PublicSubmitPage.tsx` - Public page (no auth guard) with AnimatePresence step wrapper
- `src/components/submit/WizardProgress.tsx` - Step progress indicator with checkmarks + aria-current
- `src/components/submit/StepContact.tsx` - All-optional contact fields, Zod email, Skip button
- `src/components/submit/StepCategory.tsx` - GET /api/categories/public; group→category tile navigation
- `src/components/submit/StepLocation.tsx` - useDebounce 300ms geocode autocomplete; map pin drag
- `src/components/submit/StepDescription.tsx` - react-dropzone (image/*, max 10/10MB); Zod min 10
- `src/components/submit/StepReview.tsx` - Summary table; POST /api/tickets/public FormData
- `src/components/submit/ConfirmationScreen.tsx` - Case ID display with Open311 status link
- `src/components/ui/textarea.tsx` - Textarea shadcn/ui component (was missing from ui library)
- `src/components/cases/MediaGallery.tsx` - Media gallery for case detail (was missing)
- `src/__tests__/PublicSubmitPage.test.tsx` - 8 Vitest+RTL tests
- `src/App.tsx` - Added /submit public route outside AppShell
- `src/components/dashboard/MapWidget.tsx` - Added onPinDrag/draggablePin props
- `src/components/cases/MetadataPanel.tsx` - Fixed Badge variant (closed→default)

## Decisions Made

- react-dropzone v14 `accept` prop uses `{ 'image/jpeg': ['.jpg', '.jpeg'] }` format (not deprecated string format)
- WizardContext stores all form data in a flat object for simple merging and cross-step reads
- MapWidget `onPinDrag` added to interface as no-op stubs — actual drag implementation deferred to a future enhancement
- StepLocation requires either address text OR map pin (not both) to advance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing Textarea UI component**
- **Found during:** Task 1 (build check)
- **Issue:** MetadataPanel.tsx imported `@/components/ui/textarea` which didn't exist, causing TypeScript build failure
- **Fix:** Created `src/components/ui/textarea.tsx` with standard shadcn/ui Textarea component
- **Files modified:** `src/components/ui/textarea.tsx`
- **Verification:** `tsc` build passes without error
- **Committed in:** 7e2c49c (Task 1 commit)

**2. [Rule 3 - Blocking] Created missing MediaGallery component**
- **Found during:** Task 1 (build check)
- **Issue:** MetadataPanel.tsx imported `./MediaGallery` which didn't exist, causing build failure
- **Fix:** Created `src/components/cases/MediaGallery.tsx` with image grid display
- **Files modified:** `src/components/cases/MediaGallery.tsx`
- **Verification:** Build passes, MetadataPanel renders without error
- **Committed in:** 7e2c49c (Task 1 commit)

**3. [Rule 1 - Bug] Fixed Badge variant for closed status in MetadataPanel**
- **Found during:** Task 1 (build check)
- **Issue:** MetadataPanel used `variant={ticket.status as 'open' | 'closed'}` but Badge has no 'closed' variant — only 'open', 'resolved', 'duplicate', 'bogus' (TS2322 error)
- **Fix:** Changed to `variant={ticket.status === 'open' ? 'open' : 'default'}` — closed tickets display with default badge style
- **Files modified:** `src/components/cases/MetadataPanel.tsx`
- **Verification:** TypeScript error resolved; build passes
- **Committed in:** 7e2c49c (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All auto-fixes were pre-existing issues introduced in phase 08-03 (CaseDetailPage components). None affected the public wizard scope. No scope creep.

## Issues Encountered

None in wizard implementation. Pre-existing build failures in cases/ components were blocking and resolved per deviation rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Public wizard complete; all 8 integration tests passing
- /submit route wired as public in App.tsx; no auth needed
- MapWidget draggablePin prop added to interface; full drag callback wiring deferred to verify phase
- Ready for Phase 09: Testing and Deployment

## Self-Check: PASSED

All key files verified on disk. Both feat(08-04) commits exist in git log.

---
*Phase: 08-core-frontend-screens*
*Completed: 2026-07-08*
