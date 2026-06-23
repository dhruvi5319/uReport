---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 13
subsystem: frontend-admin
tags: [admin, departments, categories, substatuses, crud, multi-step-form, wave-3b]
dependency_graph:
  requires:
    - plan: "05"
      provides: ["GET /api/departments", "POST /api/departments", "PUT /api/departments/{id}", "DELETE /api/departments/{id}", "GET /api/categories", "POST /api/categories", "PUT /api/categories/{id}", "DELETE /api/categories/{id}", "GET /api/category-groups", "GET /api/substatuses", "POST /api/substatuses", "PUT /api/substatuses/{id}", "DELETE /api/substatuses/{id}"]
  provides:
    - artifact: "frontend/src/app/admin/layout.tsx"
      exports: ["AdminLayout — role-guarded shell for all /admin/* routes"]
    - artifact: "frontend/src/components/admin/AdminNav.tsx"
      exports: ["AdminNav — responsive sidebar with 7 admin sections, mobile hamburger menu"]
    - artifact: "frontend/src/app/admin/departments/page.tsx"
      exports: ["DepartmentsPage — list with deactivation modal for HAS_ACTIVE_TICKETS"]
    - artifact: "frontend/src/components/admin/DepartmentForm.tsx"
      exports: ["DepartmentForm — create/edit with API 422 field-level error mapping"]
    - artifact: "frontend/src/app/admin/categories/page.tsx"
      exports: ["CategoriesPage — list with search + department filter"]
    - artifact: "frontend/src/components/admin/CategoryForm.tsx"
      exports: ["CategoryForm — 3-step form: Basic Info → Permissions → Custom Fields"]
    - artifact: "frontend/src/components/admin/CustomFieldBuilder.tsx"
      exports: ["CustomFieldBuilder — dynamic field rows with type-conditional options list"]
    - artifact: "frontend/src/app/admin/substatuses/page.tsx"
      exports: ["SubstatusesPage — grouped by open/closed primary status with isDefault badge"]
    - artifact: "frontend/src/components/admin/SubstatusForm.tsx"
      exports: ["SubstatusForm — label, primaryStatus radio, isDefault toggle with default-change warning"]
    - artifact: "frontend/src/lib/api/admin.ts"
      exports: ["getDepartments", "createDepartment", "updateDepartment", "deleteDepartment", "getCategories", "getCategory", "createCategory", "updateCategory", "deleteCategory", "getCategoryGroups", "getSubstatuses", "createSubstatus", "updateSubstatus", "deleteSubstatus"]
  affects:
    - "Plan 14 — people, templates, clients admin screens (consumes AdminNav and admin layout shell)"
    - "Wave 3a ticket create form — categories must be populated via this UI"
tech_stack:
  added:
    - "shadcn/ui pattern via Radix UI primitives (Button, Input, Label, Switch, AlertDialog, Select, RadioGroup, Toast)"
  patterns:
    - "Client Components for interactive pages with useState/useEffect"
    - "Server Components for data-fetching edit pages (getDepartment, getCategory)"
    - "react-hook-form for DepartmentForm and SubstatusForm"
    - "Controlled state for CategoryForm multi-step (no RHF, manual state)"
    - "ApiError instanceof check for field-level 422 error mapping"
key_files:
  created:
    - frontend/src/lib/api/admin.ts
    - frontend/src/app/admin/layout.tsx
    - frontend/src/app/admin/page.tsx
    - frontend/src/components/admin/AdminNav.tsx
    - frontend/src/app/admin/departments/page.tsx
    - frontend/src/app/admin/departments/[id]/page.tsx
    - frontend/src/app/admin/departments/new/page.tsx
    - frontend/src/components/admin/DepartmentForm.tsx
    - frontend/src/app/admin/categories/page.tsx
    - frontend/src/app/admin/categories/[id]/page.tsx
    - frontend/src/app/admin/categories/new/page.tsx
    - frontend/src/components/admin/CategoryForm.tsx
    - frontend/src/components/admin/CustomFieldBuilder.tsx
    - frontend/src/app/admin/substatuses/page.tsx
    - frontend/src/app/admin/substatuses/[id]/page.tsx
    - frontend/src/app/admin/substatuses/new/page.tsx
    - frontend/src/components/admin/SubstatusForm.tsx
    - frontend/src/components/ui/button.tsx
    - frontend/src/components/ui/input.tsx
    - frontend/src/components/ui/label.tsx
    - frontend/src/components/ui/switch.tsx
    - frontend/src/components/ui/alert-dialog.tsx
    - frontend/src/components/ui/toast.tsx
    - frontend/src/components/ui/toaster.tsx
    - frontend/src/components/ui/use-toast.ts
    - frontend/src/components/ui/radio-group.tsx
    - e2e/admin-depts-cats-substatus.spec.ts
    - e2e/helpers/auth.ts
  modified:
    - frontend/src/lib/api/admin.ts (added force param to deleteDepartment)
    - frontend/src/components/admin/AdminNav.tsx (added mobile hamburger menu)
    - frontend/src/app/admin/layout.tsx (added Toaster)
decisions:
  - "Used existing requireRole(['admin']) guard from Wave 3a auth/guards.ts instead of reimplementing in layout — redirects non-admin to /access-denied"
  - "ApiError instanceof check for field-level mapping instead of checking res.errors — consistent with project error pattern from api-client.ts"
  - "CategoryForm uses controlled state (useState) not react-hook-form — multi-step forms with cross-step validation are simpler with manual state management"
  - "deleteDepartment extended with optional force parameter (?force=1) for HAS_ACTIVE_TICKETS confirmation flow"
  - "AdminNav upgraded from desktop-only to responsive: md+ sidebar, <md fixed top bar with hamburger toggle"
  - "Substatus edit page fetches all substatuses and finds by ID rather than adding a getSubstatus(id) function — minimizes API client changes"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-06-23"
  tasks: 2
  files: 28
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 13: Admin Configuration Screens Summary

**One-liner:** Admin shell layout with role guard, departments/categories/substatuses CRUD pages with multi-step category form and HAS_ACTIVE_TICKETS deactivation flow.

## What Was Built

This plan implemented the full admin configuration UI for Wave 3b (Plan 13). Tomás (admin persona) can now configure the entire ticket-routing taxonomy without SSH or direct DB access.

### Admin Shell
- **`AdminLayout`** (`frontend/src/app/admin/layout.tsx`): Server Component wrapping all `/admin/*` routes. Uses `requireRole(['admin'])` — unauthenticated users redirect to `/login`, non-admins to `/access-denied`. Includes `<Toaster>` for all admin toast notifications.
- **`AdminNav`** (`frontend/src/components/admin/AdminNav.tsx`): Left sidebar on md+ screens, fixed top bar with hamburger dropdown on mobile (375px+). Seven nav items: Departments, Categories, People & Users, Substatuses, Templates, API Clients, Settings. Active route highlighted with `aria-current="page"`.

### Departments CRUD
- **List page** (`/admin/departments`): Table with Name, Default Assignee, Active status. Deactivate → calls `deleteDepartment(id)`. If API returns `HAS_ACTIVE_TICKETS` error code (caught via `ApiError.code`), opens `AlertDialog` requiring admin to type the department name before confirming deactivation with `?force=1`. Reactivate action uses `updateDepartment(id, { active: true })`.
- **DepartmentForm**: `react-hook-form` with inline `role="alert"` error messages. Maps API 422 `fieldErrors` back to field-level errors. Create → `createDepartment()`, Edit → `updateDepartment()`.

### Categories CRUD
- **List page** (`/admin/categories`): Client-side search filter + server-side department filter (`getCategories({ departmentId })`). Deactivate with toast + reload.
- **CategoryForm** (3-step, controlled state):
  - Step 1 — Basic Info: name (required), departmentId (required, populated from `getDepartments()`), groupId (optional from `getCategoryGroups()`), slaDays
  - Step 2 — Permissions: displayPermission (radio), postingPermission (radio), autoCloseDays
  - Step 3 — Custom Fields: `<CustomFieldBuilder>` component
  - Step indicator (numbered circles, green ✓ for completed); API 422 errors navigate back to the step containing the erroring field.
- **CustomFieldBuilder**: Renders field rows (code, label, type, required switch). When `type === 'select'`, shows options list with add/remove per option. ARIA labels on all inputs.

### Substatuses CRUD
- **List page** (`/admin/substatuses`): Items grouped into "Open statuses" and "Closed statuses" sections, sorted by `sortOrder`. `Default` badge on `isDefault` items. Deactivate action with toast.
- **SubstatusForm**: `react-hook-form` with label (required), primaryStatus radio (open/closed), isDefault toggle (shows warning about clearing current default), active toggle, sortOrder. Maps `DUPLICATE_NAME` API error to label field.

### Typed API Client
`frontend/src/lib/api/admin.ts` already existed with full coverage; enhanced `deleteDepartment` with optional `{ force?: boolean }` parameter to append `?force=1` for confirmed deactivations.

### Playwright E2E Tests
`e2e/admin-depts-cats-substatus.spec.ts` covers:
- Departments: list renders, create succeeds, empty name validation, non-admin redirect
- Categories: list renders, multi-step form navigation, empty name validation on step 1, custom field select type shows options builder
- Substatuses: list renders with grouping, create succeeds, empty label validation

`e2e/helpers/auth.ts`: `loginAsAdmin()` helper navigating to `/login` and clicking sign-in button.

## Verification Results

```
TypeScript: 0 errors (excluding pre-existing TicketResultsList.test.tsx @testing-library issue)
API_FUNCTIONS OK: getDepartments, getCategories, getCategoryGroups, getSubstatuses all exported
ROLE_GUARD OK: requireRole(['admin']) in admin layout
DEACTIVATE_GUARD OK: HAS_ACTIVE_TICKETS error code triggers confirmation modal
CATEGORY_FORM OK: 3-step form with CustomFieldBuilder integration
SUBSTATUS_PAGE OK: primaryStatus grouping and isDefault badge
E2E FILE EXISTS: e2e/admin-depts-cats-substatus.spec.ts
```

## Integration Contract Status

This plan provides to Plan 14 (people, templates, clients):
- ✅ Admin shell layout + AdminNav (no changes needed — Plan 14 just adds /admin/people, /admin/templates, /admin/clients routes)
- ✅ `frontend/src/lib/api/admin.ts` already contains Person, Template, ApiClient types and API functions (previously implemented in the base admin API file)
- ✅ shadcn/ui components (Button, Input, Label, Switch, Select, RadioGroup, AlertDialog, Toast) available for Plan 14 forms

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AdminNav was desktop-only, not mobile-accessible at 375px**
- **Found during:** Task 1
- **Issue:** Original `AdminNav.tsx` had `hidden md:block` — no mobile access at all
- **Fix:** Added mobile top bar with hamburger button and dropdown menu, mobile spacer for content positioning
- **Files modified:** `frontend/src/components/admin/AdminNav.tsx`
- **Commit:** 1202ab2

**2. [Rule 2 - Missing Critical] deleteDepartment lacked force parameter for confirmed deactivations**
- **Found during:** Task 1 (writing DepartmentsPage)
- **Issue:** The existing `deleteDepartment` only accepted `id`; the HAS_ACTIVE_TICKETS flow requires re-calling with `?force=1`
- **Fix:** Added optional `params?: { force?: boolean }` argument to `deleteDepartment`
- **Files modified:** `frontend/src/lib/api/admin.ts`
- **Commit:** 1202ab2

**3. [Rule 2 - Missing Critical] Toast notifications missing from admin layout**
- **Found during:** Task 1
- **Issue:** All admin pages use `useToast()` but no `<Toaster>` was mounted to display them
- **Fix:** Added `<Toaster />` to `AdminLayout`
- **Files modified:** `frontend/src/app/admin/layout.tsx`
- **Commit:** 1202ab2

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: Admin API client, shell layout, departments CRUD | `1202ab2` | admin.ts, layout.tsx, AdminNav.tsx, departments/* , DepartmentForm.tsx, UI primitives |
| Task 2: Categories multi-step form, substatuses, e2e | `75fa9eb` | CategoryForm.tsx, CustomFieldBuilder.tsx, categories/*, SubstatusForm.tsx, substatuses/*, e2e |

## Self-Check: PASSED

Files verified present:
- ✅ frontend/src/lib/api/admin.ts
- ✅ frontend/src/app/admin/layout.tsx
- ✅ frontend/src/components/admin/AdminNav.tsx
- ✅ frontend/src/app/admin/departments/page.tsx
- ✅ frontend/src/components/admin/DepartmentForm.tsx
- ✅ frontend/src/app/admin/categories/page.tsx
- ✅ frontend/src/components/admin/CategoryForm.tsx
- ✅ frontend/src/components/admin/CustomFieldBuilder.tsx
- ✅ frontend/src/app/admin/substatuses/page.tsx
- ✅ frontend/src/components/admin/SubstatusForm.tsx
- ✅ e2e/admin-depts-cats-substatus.spec.ts
- ✅ e2e/helpers/auth.ts

Commits verified:
- ✅ 1202ab2 — exists (admin files including departments page)
- ✅ 75fa9eb — exists (categories, substatuses, e2e)
