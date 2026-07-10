---
phase: 09-admin-panels-and-integration
plan: "02"
subsystem: ui
tags: [react, shadcn, tanstack-query, react-router, vitest, rtl, bookmarks, command-palette, login, ldap, cas]

# Dependency graph
requires:
  - phase: 08-core-frontend-screens
    provides: CaseListPage with URL-as-state filter params, Navbar shell component
  - phase: 07-react-design-system-and-shell
    provides: shadcn/ui components (Dialog, AlertDialog, Command, Button, Input, Badge, Skeleton, useToast)
  - phase: 06-search-geo-and-metrics-backend
    provides: GET/POST/DELETE /api/bookmarks API, GET /api/tickets?q= FTS search API
  - phase: 02-authentication-security
    provides: POST /api/auth/ldap endpoint, CAS /auth/cas redirect endpoint
provides:
  - CaseListPage with Save Search button (POSTs to /api/bookmarks with requestUri) and Saved Searches dropdown (restores via setSearchParams)
  - Navbar with Cmd+K Command palette wired to GET /api/tickets?q={term}&pageSize=5 with 300ms debounce
  - LoginPage: public /login route with CAS SSO button and LDAP form, loading spinner, error state
  - 4 passing Vitest+RTL tests for LoginPage (render, spinner, error on 401, navigate on 200)
affects: [verifier-phase-9]

# Tech tracking
tech-stack:
  added: ["@radix-ui/react-dropdown-menu (installed)", "DropdownMenu shadcn component", "Label shadcn component"]
  patterns:
    - "Bookmark requestUri stored as window.location.search string; recalled via new URLSearchParams(bookmark.requestUri.replace(/^\\?/, '')); applied via setSearchParams()"
    - "Command palette: debounced via useEffect+setTimeout 300ms; fetch triggered when commandQuery.length >= 2; reset on dialog close"
    - "LoginPage: native fetch POST /api/auth/ldap with credentials:include; error state set from res.json().error; navigate via react-router (prevents open redirect)"
    - "Tests mock useAuth via vi.mock('@/contexts/AuthContext') to simulate unauthenticated state"

key-files:
  created:
    - frontend/src/components/ui/dropdown-menu.tsx
    - frontend/src/components/ui/label.tsx
    - frontend/src/pages/LoginPage.tsx (full implementation, replaces placeholder)
    - frontend/src/__tests__/LoginPage.test.tsx
  modified:
    - frontend/src/pages/CaseListPage.tsx (bookmark save/recall UI added)
    - frontend/src/components/shell/Navbar.tsx (Command palette search wired to API)
    - frontend/src/components/ui/index.ts (exports for dropdown-menu, label)
    - frontend/package.json (added @radix-ui/react-dropdown-menu)

key-decisions:
  - "LoginPage uses native fetch (not axios) for POST /api/auth/ldap — consistent with Phase 8 pattern; credentials:include sends httpOnly cookie"
  - "navigate(returnTo || '/dashboard') uses react-router navigate (not window.location.href) — prevents open redirect to external domains (T-09-07)"
  - "Command palette debounce implemented via useEffect+setTimeout (not useDeferredValue) — decouples input display from query state for 300ms idle trigger"
  - "dropdown-menu.tsx and label.tsx created manually (no CLI access to shadcn) — equivalent to official shadcn/ui output"
  - "Bookmark save button disabled when no active search params (pagination-only params excluded from detection)"

patterns-established:
  - "Bookmark recall: new URLSearchParams(bookmark.requestUri.replace(/^\\?/, '')) → setSearchParams(parsed) — URL-safe, no innerHTML injection"
  - "Tests mock AuthContext at module level with vi.mock to isolate LoginPage from UAT_MOCK_USER in AuthProvider"

# Metrics
duration: 5min
completed: 2026-07-09
---

# Phase 09 Plan 02: Bookmark UI, Command Palette Search, and LoginPage Summary

**CaseListPage bookmark save/recall wired to /api/bookmarks, Navbar Command palette (Cmd+K) hitting GET /api/tickets?q= with 300ms debounce, and full branded LoginPage (CAS SSO + LDAP form with spinner and error state) with 4 passing Vitest tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-09T20:13:28Z
- **Completed:** 2026-07-09T20:18:41Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- CaseListPage toolbar extended with "Save Search" button (Dialog → POST /api/bookmarks with requestUri=window.location.search) and "Saved Searches" DropdownMenu (GET /api/bookmarks; clicking restores URL via setSearchParams; trash icon triggers AlertDialog + DELETE /api/bookmarks/{id})
- Navbar Command palette (Cmd+K) wired to GET /api/tickets?q={term}&pageSize=5 with 300ms debounce; results show ticketId (mono), categoryName, status Badge; clicking navigates to /cases/{id}
- LoginPage fully implemented: centered card layout, city SVG logo, CAS SSO button (→ /auth/cas), LDAP form with Loader2 spinner and disabled button during submission, red role="alert" error paragraph on non-2xx, navigate to /dashboard (or ?returnTo) on success
- All 4 LoginPage Vitest+RTL tests pass: renders correctly, spinner/disabled on submit, error on 401, navigate on 200

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire bookmark save/recall into CaseListPage and Command palette search into Navbar** - `edd68f7` (feat)
2. **Task 2: Build LoginPage with CAS+LDAP auth, loading spinner, error state, and 4 Vitest tests** - `144fbb6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/src/pages/CaseListPage.tsx` — Added Save Search Dialog + Saved Searches DropdownMenu with AlertDialog for deletion
- `frontend/src/components/shell/Navbar.tsx` — Added Cmd+K command palette with 300ms debounced GET /api/tickets?q= search
- `frontend/src/pages/LoginPage.tsx` — Full login page replacing placeholder (CAS + LDAP + loading + error)
- `frontend/src/__tests__/LoginPage.test.tsx` — 4 Vitest+RTL tests for LoginPage
- `frontend/src/components/ui/dropdown-menu.tsx` — New shadcn DropdownMenu component
- `frontend/src/components/ui/label.tsx` — New shadcn Label component
- `frontend/src/components/ui/index.ts` — Added exports for dropdown-menu and label
- `frontend/package.json` + `package-lock.json` — Added @radix-ui/react-dropdown-menu

## Decisions Made

- Used native fetch for LDAP auth (consistent with Phase 8 pattern); `credentials: 'include'` sends httpOnly session cookie
- `navigate(returnTo || '/dashboard')` uses react-router navigate (not window.location.href) — client-side only, prevents open redirect (T-09-07 mitigation)
- Command palette debounce via useEffect+setTimeout pattern (300ms) matching plan spec; state reset on dialog close prevents stale results
- Tests mock `@/contexts/AuthContext` at module level with `vi.mock` to decouple from UAT_MOCK_USER in AuthProvider
- Bookmark save button disabled when no active non-pagination search params (q, status, categoryId, etc. absent)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @radix-ui/react-dropdown-menu and created DropdownMenu + Label components**
- **Found during:** Task 1 (CaseListPage bookmark UI)
- **Issue:** `dropdown-menu.tsx` and `label.tsx` shadcn components were absent; @radix-ui/react-dropdown-menu not in package.json
- **Fix:** Ran `npm install @radix-ui/react-dropdown-menu`; wrote `dropdown-menu.tsx` and `label.tsx` manually (equivalent to official shadcn/ui output); added exports to `index.ts`
- **Files modified:** `frontend/src/components/ui/dropdown-menu.tsx`, `frontend/src/components/ui/label.tsx`, `frontend/src/components/ui/index.ts`, `frontend/package.json`
- **Verification:** `npm run build` exits 0; all components used in CaseListPage and LoginPage without TypeScript errors
- **Committed in:** `edd68f7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for plan to proceed — DropdownMenu required by Saved Searches UI. No scope creep.

## Issues Encountered

None — all tasks completed as planned.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 09 plan 02 complete; the 3 plan-02 artifacts are fully implemented
- All LoginPage Vitest tests pass (4/4); build clean (0 TypeScript errors)
- Ready for Phase 09 verification pass and/or remaining Phase 09 plans (if any)
- App.tsx already had `/login` as a public route outside AppShell (from earlier work) — confirmed correct placement

---
*Phase: 09-admin-panels-and-integration*
*Completed: 2026-07-09*
