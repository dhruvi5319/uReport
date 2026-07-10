---
phase: 09-admin-panels-and-integration
plan: "01"
subsystem: ui
tags: [react, shadcn-ui, tanstack-query, admin, crud, accessibility, axe-core]

# Dependency graph
requires:
  - phase: 07-react-design-system-and-shell
    provides: shadcn/ui Sheet, AlertDialog, Toast, Table, Skeleton, Badge, Breadcrumb, Input, Select, Textarea, Tabs components
  - phase: 05-admin-configuration-backend
    provides: /api/people, /api/departments, /api/categories, /api/category-groups, /api/substatus, /api/issue-types, /api/contact-methods, /api/actions, /api/clients REST APIs
  - phase: 08-core-frontend-screens
    provides: AppShell, AuthContext, useAuth hook, CaseListPage pattern for HOC reference

provides:
  - AdminListPage HOC with Sheet+AlertDialog+Toast+Table+Skeleton pattern (right-side 40% Sheet)
  - PeoplePage - Full CRUD with sub-tabs for Emails/Phones/Addresses
  - DepartmentsPage - CRUD with combobox person search and action associations
  - CategoriesPage - Accordion of groups with nested category tables
  - ClientsPage - API key shown once after POST with copy button
  - SubstatusPage - isDefault star icon and radio behavior
  - IssueTypesPage - Inline row editing with seeded record lock protection
  - ContactMethodsPage - Inline row editing with seeded record lock protection
  - ActionsPage - DEPARTMENT-only create; system actions read-only; no Delete for SYSTEM type
  - AdminGuard in App.tsx - ROLE_ADMIN check; non-admin redirected to /dashboard
  - axe-core accessibility tests - 3 tests pass with 0 wcag2a/wcag2aa violations

affects:
  - 09-02 (SEARCH-02 search UI wiring, AUTH-03 login screen)

# Tech tracking
tech-stack:
  added: [jest-axe (already in devDeps), axe-core (via jest-axe)]
  patterns:
    - AdminListPage generic HOC pattern for all admin panels
    - Inline row editing for simple lookup tables (IssueTypes, ContactMethods)
    - API key shown once in ephemeral React state (never localStorage)
    - Accordion-based category browser with proper ARIA button pattern

key-files:
  created:
    - frontend/src/components/admin/AdminListPage.tsx
    - frontend/src/pages/admin/PeoplePage.tsx
    - frontend/src/pages/admin/DepartmentsPage.tsx
    - frontend/src/pages/admin/CategoriesPage.tsx
    - frontend/src/pages/admin/ClientsPage.tsx
    - frontend/src/pages/admin/SubstatusPage.tsx
    - frontend/src/pages/admin/IssueTypesPage.tsx
    - frontend/src/pages/admin/ContactMethodsPage.tsx
    - frontend/src/pages/admin/ActionsPage.tsx
    - frontend/src/__tests__/admin-accessibility.test.tsx
  modified:
    - frontend/src/App.tsx

key-decisions:
  - "AdminGuard uses user.role === 'admin' (lowercase, matching AuthContext UAT_MOCK_USER) not 'ROLE_ADMIN' string"
  - "CategoriesPage accordion restructured: expand <button> separate from action buttons (fixes nested-interactive axe violation)"
  - "AdminListPage HOC uses generic type T extends {id} for universal use across all entity types"
  - "Axe tests run only wcag2a/wcag2aa tags to focus on critical/serious violations per plan spec"

patterns-established:
  - "AdminListPage<T> HOC: pass fetchFn + queryKey + columns + renderSheet + onDelete for instant admin panel"
  - "Inline editing pattern: editingRow state with id=null for new row, id=N for existing row"
  - "API key once pattern: store in useState, clear on sheet close, display warning with copy button"
  - "Lock icon pattern: SEEDED_IDS Set for O(1) guard, tooltip + disabled Delete for system records"

# Metrics
duration: 9min
completed: 2026-07-09
---

# Phase 9 Plan 01: Admin Panels Summary

**8 admin CRUD panels built using shared AdminListPage HOC implementing Sheet+AlertDialog+Toast pattern; all routes guarded by AdminGuard; 3 axe accessibility tests passing with 0 wcag2a/wcag2aa violations.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-09T20:14:03Z
- **Completed:** 2026-07-09T20:23:48Z
- **Tasks:** 2 completed
- **Files modified:** 11 (10 created + 1 updated)

## Accomplishments

- AdminListPage HOC with generic type support — single import gives any admin page: search toolbar, skeleton loading, right-side 40% Sheet for create/edit, AlertDialog for delete confirmation, Toast on success/error
- PeoplePage with "Last, First" name format, role badge variants (destructive/default/secondary), and sub-tabs for Emails/Phones/Addresses inline management
- CategoriesPage with accessible accordion of category groups (proper `<button>` for expand toggle, separate action buttons), nested category tables with posting permission and active status
- ClientsPage with API key shown exactly once after POST, stored in ephemeral React state, copy button, warning banner — masked on subsequent GET
- IssueTypesPage + ContactMethodsPage with inline row editing (click to edit in place); seeded system records show Lock icon with tooltip and disabled Delete
- ActionsPage: [+ New Department Action] only creates DEPARTMENT type; system actions open read-only Sheet; no Delete button for SYSTEM type
- SubstatusPage with star icon for default substatus, warning on delete of default record
- AdminGuard component wrapping all 8 routes; non-admin users redirected to /dashboard; unauthenticated to /login
- axe-core Vitest tests: 3 tests pass with 0 critical/serious violations for PeoplePage, DepartmentsPage, CategoriesPage

## Task Commits

Each task was committed atomically:

1. **Task 1: AdminListPage HOC + People, Departments, Categories, Clients** - `cffc507` (feat)
2. **Task 2: Substatus, IssueTypes, ContactMethods, Actions + App.tsx + axe tests** - `7ffc78f` (feat)

**Plan metadata:** (committed with docs commit below)

## Files Created/Modified

- `frontend/src/components/admin/AdminListPage.tsx` — Generic HOC: Sheet+AlertDialog+Toast+Table+Skeleton+Breadcrumb pattern
- `frontend/src/pages/admin/PeoplePage.tsx` — People CRUD with sub-tabs for Emails/Phones/Addresses
- `frontend/src/pages/admin/DepartmentsPage.tsx` — Department CRUD with combobox person search and action multi-select
- `frontend/src/pages/admin/CategoriesPage.tsx` — Category accordion browser with accessible toggle buttons
- `frontend/src/pages/admin/ClientsPage.tsx` — Open311 client CRUD; API key shown once with copy button
- `frontend/src/pages/admin/SubstatusPage.tsx` — Substatus CRUD; isDefault star icon, warning on delete
- `frontend/src/pages/admin/IssueTypesPage.tsx` — Inline row editing; seeded IDs 1-6 locked
- `frontend/src/pages/admin/ContactMethodsPage.tsx` — Inline row editing; seeded IDs 1-4 locked
- `frontend/src/pages/admin/ActionsPage.tsx` — DEPARTMENT actions CRUD; SYSTEM actions read-only
- `frontend/src/__tests__/admin-accessibility.test.tsx` — axe-core tests for 3 admin pages
- `frontend/src/App.tsx` — AdminGuard + all 8 admin routes registered

## Decisions Made

- **AdminGuard uses lowercase "admin"**: AuthContext User type uses lowercase role strings ("admin", "staff") — AdminGuard matches this convention rather than using "ROLE_ADMIN" string constant
- **CategoriesPage accordion redesigned**: Plan used `role="button"` with nested buttons (axe nested-interactive violation). Fixed by using `<button>` element for expand-only toggle and placing Edit/Delete as sibling elements outside the button
- **AdminListPage HOC shape**: Follows plan's interface exactly — `fetchFn: () => Promise<T[]>`, `renderSheet: (item: T | null, onClose: () => void) => ReactNode`, `onDelete: (item: T) => Promise<void>` plus optional `get*` helpers for AlertDialog customization
- **Axe test scope**: Used `runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }` to focus on critical/serious violations per plan spec; canvas-related color contrast not blocking (jsdom limitation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CategoriesPage nested-interactive accessibility violation**
- **Found during:** Task 2 (running axe tests)
- **Issue:** CategoriesPage accordion header used `role="button"` div with nested Edit/Delete `<button>` elements — axe reports "Interactive controls must not be nested (nested-interactive)" violation
- **Fix:** Restructured accordion header: expand toggle uses a proper `<button>` element; Edit/Delete buttons are sibling elements in a flex row outside the toggle button
- **Files modified:** frontend/src/pages/admin/CategoriesPage.tsx
- **Verification:** All 3 axe tests pass: `toHaveNoViolations()` holds for PeoplePage, DepartmentsPage, CategoriesPage
- **Committed in:** 7ffc78f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix necessary for plan's success criteria (0 critical/serious axe violations). No scope creep.

## Issues Encountered

None — plan executed as specified with one auto-fixed accessibility issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 8 admin CRUD panels functional and accessible
- AdminGuard ready for real auth integration (replaces UAT_MOCK_USER when 09-02 completes LoginPage)
- AdminListPage HOC pattern available for any additional admin panels in future plans
- Ready for 09-02: Search UI wiring + Auth-03 login screen integration

---
*Phase: 09-admin-panels-and-integration*
*Completed: 2026-07-09*

## Self-Check: PASSED

All created files verified on disk:
- ✅ frontend/src/components/admin/AdminListPage.tsx
- ✅ frontend/src/pages/admin/PeoplePage.tsx
- ✅ frontend/src/pages/admin/DepartmentsPage.tsx
- ✅ frontend/src/pages/admin/CategoriesPage.tsx
- ✅ frontend/src/pages/admin/ClientsPage.tsx
- ✅ frontend/src/pages/admin/SubstatusPage.tsx
- ✅ frontend/src/pages/admin/IssueTypesPage.tsx
- ✅ frontend/src/pages/admin/ContactMethodsPage.tsx
- ✅ frontend/src/pages/admin/ActionsPage.tsx
- ✅ frontend/src/__tests__/admin-accessibility.test.tsx

Commits verified:
- ✅ cffc507 — feat(09-01): build AdminListPage HOC and complex admin panels
- ✅ 7ffc78f — feat(09-01): build lookup admin panels, wire admin routes, add axe accessibility tests
