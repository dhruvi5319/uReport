---
phase: 09-admin-panels-and-integration
plan: GGAP-01
subsystem: auth
tags: [vite, react, typescript, login, dev-login, vitest]

# Dependency graph
requires:
  - phase: 09-admin-panels-and-integration
    provides: DevLoginController @Profile("dev") at POST /api/auth/dev-login
provides:
  - frontend/.env.development with VITE_USE_DEV_LOGIN=true
  - LoginPage.tsx with conditional endpoint (dev-login vs ldap) gated by env flag
affects: [09-admin-panels-and-integration, UAT-Test-1]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vite build-time env flag (VITE_USE_DEV_LOGIN) to switch auth endpoints without code changes"
    - "import.meta.env.VITE_USE_DEV_LOGIN === 'true' for build-time env gate in React"

key-files:
  created:
    - frontend/.env.development
  modified:
    - frontend/src/pages/LoginPage.tsx
    - frontend/src/__tests__/LoginPage.test.tsx

key-decisions:
  - "Button selector fixed to /^sign in$/i (anchored regex) to avoid ambiguity with 'Sign in with City SSO' button in new userEvent-based tests"
  - "VITE_USE_DEV_LOGIN flag is build-time only — Vite inlines it at bundle time; .env.development never deployed to production"

patterns-established:
  - "Pattern: Vite .env.development for dev-only feature flags (not committed with production secrets)"

# Metrics
duration: 1min
completed: 2026-07-09
---

# Phase 9 Plan GGAP-01: Dev Login Endpoint Switch Summary

**LoginPage.tsx conditionally calls /api/auth/dev-login (when VITE_USE_DEV_LOGIN=true) or /api/auth/ldap (production) — unblocks UAT Test 1 devadmin/admin123 authentication**

## Performance

- **Duration:** 1 min
- **Started:** 2026-07-09T23:06:33Z
- **Completed:** 2026-07-09T23:07:53Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Created `frontend/.env.development` with `VITE_USE_DEV_LOGIN=true` so Vite dev builds automatically use the dev endpoint
- Updated `LoginPage.tsx` to read `import.meta.env.VITE_USE_DEV_LOGIN` and route to `/api/auth/dev-login` in dev mode (unchanged behavior for prod path `/api/auth/ldap`)
- Added two vitest tests asserting correct endpoint selection per flag value; all 6 LoginPage tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Add VITE_USE_DEV_LOGIN flag and wire LoginPage to dev endpoint** - `2145f69` (feat)

**Plan metadata:** _(see docs commit below)_

## Files Created/Modified
- `frontend/.env.development` - VITE_USE_DEV_LOGIN=true for Vite dev builds
- `frontend/src/pages/LoginPage.tsx` - Added useDevLogin constant + conditional endpoint in handleLdapSubmit
- `frontend/src/__tests__/LoginPage.test.tsx` - Added two endpoint-selection tests using userEvent + vi.spyOn

## Decisions Made
- **Button selector anchored:** New tests use `/^sign in$/i` instead of the plan's `/sign in/i` to avoid matching "Sign in with City SSO" button — necessary because `getByRole` throws on multiple matches. This is a test correctness fix, not a behavior change.
- **vi import added:** `import { vi } from 'vitest'` added at top of test file alongside `userEvent` import — both required by the new tests.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ambiguous button selector in new endpoint-selection tests**
- **Found during:** Task 1 (running vitest after adding new tests)
- **Issue:** Plan specified `{ name: /sign in/i }` in `getByRole('button', ...)`, but LoginPage has two buttons matching that pattern: "Sign in with City SSO" and "Sign In". Testing Library throws on multiple matches.
- **Fix:** Changed to `{ name: /^sign in$/i }` (anchored regex, exact match for "Sign In" submit button only)
- **Files modified:** `frontend/src/__tests__/LoginPage.test.tsx`
- **Verification:** `npx vitest run src/__tests__/LoginPage.test.tsx` — 6/6 tests pass
- **Committed in:** `2145f69` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for test correctness — selector was ambiguous given the actual LoginPage DOM. No scope creep; plan intent fully preserved.

## Issues Encountered
None — single auto-fix resolved the only test failure immediately.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- UAT Test 1 (devadmin/admin123 login) is now unblocked: LoginPage routes to `/api/auth/dev-login` when `VITE_USE_DEV_LOGIN=true`, which DevLoginController handles correctly
- Production path unchanged: when `VITE_USE_DEV_LOGIN` is absent/false, LoginPage calls `/api/auth/ldap` as before
- Phase 09 GGAP gap closure complete

---
*Phase: 09-admin-panels-and-integration*
*Completed: 2026-07-09*

## Self-Check: PASSED
- `frontend/.env.development` — FOUND ✓
- `frontend/src/pages/LoginPage.tsx` (modified) — FOUND ✓
- `frontend/src/__tests__/LoginPage.test.tsx` (modified) — FOUND ✓
- Commit `2145f69` — FOUND ✓ (git log confirms)
