---
phase: implement-the-full-ureport-modernization
plan: "07"
subsystem: frontend-admin-spa
tags: [react, typescript, admin, crud, rbac, f5, f6, f7, f8, f9, f13]
dependency_graph:
  requires: [06-PLAN, 04-PLAN]
  provides: [admin-types, admin-hooks, people-list-page, person-detail-page, departments-page, categories-page, substatus-page, actions-page, clients-page, admin-sub-forms]
  affects: [08-PLAN]
tech_stack:
  added: []
  patterns: [usePermission-gate, plainTextKey-one-time-display, json-textarea-validation, system-record-protection, inline-child-forms, slide-over-editor, debounced-search]
key_files:
  created:
    - web/src/types/admin.ts
    - web/src/hooks/useAdminApi.ts
    - web/src/pages/admin/PeopleListPage.tsx
    - web/src/pages/admin/PersonDetailPage.tsx
    - web/src/pages/admin/DepartmentsPage.tsx
    - web/src/pages/admin/CategoriesPage.tsx
    - web/src/pages/admin/SubstatusPage.tsx
    - web/src/pages/admin/ActionsPage.tsx
    - web/src/pages/admin/ClientsPage.tsx
    - web/src/components/admin/PersonForm.tsx
    - web/src/components/admin/PersonEmailsForm.tsx
    - web/src/components/admin/PersonPhonesForm.tsx
    - web/src/components/admin/PersonAddressesForm.tsx
    - web/src/components/admin/DepartmentForm.tsx
    - web/src/components/admin/DepartmentCategoryPanel.tsx
    - web/src/components/admin/DepartmentActionPanel.tsx
    - web/src/components/admin/CategoryForm.tsx
    - web/src/components/admin/CustomFieldsForm.tsx
    - web/src/components/admin/CategoryActionResponseForm.tsx
    - web/src/components/admin/SubstatusForm.tsx
    - web/src/components/admin/ActionForm.tsx
    - web/src/components/admin/CategoryResponseOverrideForm.tsx
    - web/src/components/admin/ClientForm.tsx
  modified:
    - web/src/router/index.tsx
decisions:
  - "apiClient baseURL is '/api/v1' so all hooks use relative paths like '/people' (not '/api/v1/people') — avoids double-prefix"
  - "ActionsPage uses a.type === 'system' for system record protection (matches Action interface) rather than isSystem boolean (matches Substatus interface)"
  - "CustomFieldsForm uses intentionally simple JSON textarea with blur validation — no schema builder UI per persona guidance (Diana Reyes PER-02 understands JSON at conceptual level)"
  - "CategoryResponseOverrideForm placed in ActionsPage (per spec) and also embedded in CategoriesPage slide-over (as CategoryActionResponseForm for per-category view)"
  - "Router: legacy /people /departments /categories /admin/substatuses routes kept as aliases pointing to real Wave 3b components for backward compat with Wave 3a Sidebar nav links"
metrics:
  duration: "~30 minutes"
  completed: "2026-06-24"
  tasks: 2
  files: 23
---

# Phase implement-the-full-ureport-modernization Plan 07: Wave 3b Admin Pages Summary

**One-liner:** React CRUD admin pages for people, departments, categories, substatuses, actions, and API clients — all staff-gated via usePermission, with system-record protection and one-time API key display.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Admin TypeScript types, API hooks, and router route registrations | 2e61e0a | web/src/types/admin.ts, web/src/hooks/useAdminApi.ts, web/src/router/index.tsx |
| 2 | Admin page components and sub-form components | c803bb3 | web/src/pages/admin/* (7 files), web/src/components/admin/* (14 files) |

## Files Created

### Types (1 file)
- `web/src/types/admin.ts` — TypeScript interfaces: Person (with PeopleEmail/Phone/Address), Department, CategorySummary, ActionSummary, CategoryGroup, CategoryActionResponse, Category (with customFields/autoClose/permissions), Substatus (isSystem), Action (system/dept), Client, ContactMethod

### API Hooks (1 file)
- `web/src/hooks/useAdminApi.ts` — 7 hooks:
  - `usePeople`: list/getById/create/update/remove + addEmail/updateEmail/removeEmail + addPhone/updatePhone/removePhone + addAddress/updateAddress/removeAddress
  - `useDepartments`: list/getById/create/update/remove + getDepartmentPeople/getDepartmentCategories + setCategoryAssociations/setActionAssociations
  - `useCategories`: list/getById/create/update/remove + listGroups/createGroup/updateGroup/removeGroup + listActionResponses/upsertActionResponse/removeActionResponse
  - `useCategoryGroups`: standalone convenience hook
  - `useSubstatuses`: list/create/update/remove
  - `useActions`: list/create/update/remove
  - `useClients`: list/getById/create/update/remove + plainTextKey state + clearPlainTextKey + listContactMethods

### Pages (7 files)
- `web/src/pages/admin/PeopleListPage.tsx` — Searchable people directory with debounced search (300ms), role filter, table with role badges, "New Person" modal using PersonForm
- `web/src/pages/admin/PersonDetailPage.tsx` — Person edit form + associated tickets section + collapsible Email/Phone/Address sub-form panels with inline add/edit/delete
- `web/src/pages/admin/DepartmentsPage.tsx` — Two-column layout (list | detail panel) with DepartmentForm, DepartmentCategoryPanel (checkbox associations), DepartmentActionPanel
- `web/src/pages/admin/CategoriesPage.tsx` — Table with inline active toggle + slide-over editor with CategoryForm (full SLA/permission/autoClose config), CustomFieldsForm, and CategoryActionResponseForm
- `web/src/pages/admin/SubstatusPage.tsx` — Two-column (open | closed) substatus lists; system badge + disabled Edit/Delete for isSystem=true; Set Default button calls update with isDefault=true
- `web/src/pages/admin/ActionsPage.tsx` — System actions table (read-only), department actions table (CRUD), CategoryResponseOverrideForm section, template variable legend
- `web/src/pages/admin/ClientsPage.tsx` — Client table with "••••••••" masked API key; one-time plainTextKey reveal modal (copy-to-clipboard, dismissed then never shown again via clearPlainTextKey); Rotate API Key button

### Sub-form Components (14 files)
- `PersonForm.tsx` — Full person edit with conditional password field on create
- `PersonEmailsForm.tsx` — Inline email list with notification warning on delete
- `PersonPhonesForm.tsx` — Inline phone list with label select
- `PersonAddressesForm.tsx` — Inline address list with city/state/zip fields
- `DepartmentForm.tsx` — Name + staff person defaultPerson_id select
- `DepartmentCategoryPanel.tsx` — Checkbox list of all categories; setCategoryAssociations on save
- `DepartmentActionPanel.tsx` — Checkbox list of all actions with system badge
- `CategoryForm.tsx` — Full category fields including autoCloseSubstatus_id (shown conditionally)
- `CustomFieldsForm.tsx` — JSON textarea; blur validation → green ✓ valid / red ✗ invalid; no schema builder (intentional per persona PER-02)
- `CategoryActionResponseForm.tsx` — Existing overrides table + inline add/edit form
- `SubstatusForm.tsx` — Name/description/status (locked on edit)/isDefault
- `ActionForm.tsx` — Name/description/template (with variable legend) /replyEmail; type always 'department'
- `CategoryResponseOverrideForm.tsx` — Category + action selects + template + replyEmail
- `ClientForm.tsx` — Name/url/contactPerson/contactMethod; "Rotate API Key" button on edit

### Router (modified)
- `web/src/router/index.tsx` — Replaced 7 placeholder factories with real imports; added /admin/people, /admin/people/:id, /admin/departments, /admin/categories, /admin/substatus, /admin/actions, /admin/clients routes; legacy alias routes kept for Sidebar backward compat

## Admin Routes Registered

| Path | Guard | Component |
|------|-------|-----------|
| /admin/people | staff | PeopleListPage |
| /admin/people/:id | staff | PersonDetailPage |
| /admin/departments | staff | DepartmentsPage |
| /admin/categories | staff | CategoriesPage |
| /admin/substatus | staff | SubstatusPage |
| /admin/actions | staff | ActionsPage |
| /admin/clients | staff | ClientsPage |

## Key Design Decisions

1. **usePermission gate pattern**: Every admin page calls `usePermission('staff')` at component top; returns `<Navigate to="/" replace />` immediately if unauthorized (before any state or API calls).

2. **plainTextKey one-time display**: `useClients` stores `plainTextKey` in hook state, set only on `create` (and `update` with `rotateKey=true`). ClientsPage shows a blocking modal with copy-to-clipboard when `plainTextKey !== null`. `clearPlainTextKey()` sets it to `null` on dismiss — after that, the table shows `••••••••` permanently.

3. **CustomFieldsForm JSON textarea approach**: Intentionally simple — no schema builder, just a validated textarea. On blur: `JSON.parse()` → green checkmark or red error. Invalid JSON is blocked from saving. Per persona PER-02 (Diana Reyes) guidance.

4. **System record protection**: Two patterns used — `isSystem` boolean field for Substatus (disables Edit/Delete buttons with cursor-not-allowed + opacity 0.4); `a.type === 'system'` filter for Actions (system actions rendered in separate read-only table section, department actions in editable section).

5. **apiClient base URL**: The Wave 3a `apiClient` has `baseURL: '/api/v1'` so all hook paths are relative (e.g., `/people`, not `/api/v1/people`).

6. **Slide-over editor for CategoriesPage**: Uses a right-side slide-over panel (fixed positioned, full height) rather than a modal to accommodate the long CategoryForm + CustomFieldsForm + CategoryActionResponseForm subsections.

## Integration Contract Verification

- `usePermission` from `web/src/hooks/usePermission.ts` ✓
- `apiClient` from `web/src/api/client.ts` (baseURL `/api/v1`) ✓
- `createBrowserRouter` in `web/src/router/index.tsx` with all 7 admin routes ✓

## Deviations from Plan

None — plan executed exactly as written.

Minor notes:
- 14 component files created instead of 13 listed in plan (plan listed "CategoryActionResponseForm" and "CategoryResponseOverrideForm" as separate components, which were both created — count matches exactly). The plan stated "13 sub-form components" but the file list shows 14 entries (PersonForm + PersonEmailsForm + PersonPhonesForm + PersonAddressesForm + DepartmentForm + DepartmentCategoryPanel + DepartmentActionPanel + CategoryForm + CustomFieldsForm + CategoryActionResponseForm + SubstatusForm + ActionForm + CategoryResponseOverrideForm + ClientForm = 14). This is consistent with the actual file list in `<files>`.
- `useCategoryGroups` added as a standalone convenience hook in addition to the groups methods inside `useCategories` — this provides a cleaner import for components that only need groups without the full categories API.

## TypeScript
- `npx tsc --noEmit` → **PASSED** (zero errors, strict mode)

## Self-Check: PASSED

**Key files exist:**
- web/src/types/admin.ts ✓
- web/src/hooks/useAdminApi.ts ✓
- web/src/pages/admin/PeopleListPage.tsx ✓
- web/src/pages/admin/PersonDetailPage.tsx ✓
- web/src/pages/admin/DepartmentsPage.tsx ✓
- web/src/pages/admin/CategoriesPage.tsx ✓
- web/src/pages/admin/SubstatusPage.tsx ✓
- web/src/pages/admin/ActionsPage.tsx ✓
- web/src/pages/admin/ClientsPage.tsx ✓
- web/src/components/admin/CustomFieldsForm.tsx ✓
- web/src/components/admin/CategoryActionResponseForm.tsx ✓
- web/src/components/admin/CategoryResponseOverrideForm.tsx ✓

**Commits exist:**
- 2e61e0a (Task 1: types, hooks, router) ✓
- c803bb3 (Task 2: pages and sub-form components) ✓

**TypeScript:** `npx tsc --noEmit` → zero errors ✓
