---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 18
subsystem: frontend
tags: [bookmarks, merge-dialog, swagger, accessibility, wcag, a11y, react, nextjs]
dependency_graph:
  requires:
    - plan: "09"
      artifact: "crm/src/Controllers/Api/BookmarkController.php"
    - plan: "10"
      artifact: "crm/src/Controllers/Api/TicketController.php"
    - plan: "10"
      artifact: "crm/public/api/openapi.json"
  provides:
    - artifact: "frontend/src/components/tickets/BookmarksDropdown.tsx"
      exports: ["BookmarksDropdown"]
    - artifact: "frontend/src/components/bookmarks/BookmarkManageSheet.tsx"
      exports: ["BookmarkManageSheet"]
    - artifact: "frontend/src/components/tickets/MergeDialog.tsx"
      exports: ["MergeDialog"]
    - artifact: "frontend/src/app/api/docs/page.tsx"
      exports: ["ApiDocsPage"]
    - artifact: "frontend/src/components/a11y/SkipLink.tsx"
      exports: ["SkipLink"]
    - artifact: "frontend/src/components/a11y/AxeAuditRunner.tsx"
      exports: ["AxeAuditRunner"]
  affects:
    - "frontend/src/app/(staff)/tickets/page.tsx"
    - "frontend/src/app/(staff)/tickets/[id]/page.tsx"
    - "frontend/src/app/layout.tsx"
tech_stack:
  added:
    - "sonner (toast notifications)"
    - "@axe-core/playwright (devDep — WCAG audit in Playwright tests)"
    - "@axe-core/react (devDep — dev-mode axe runtime)"
  patterns:
    - "Radix UI DropdownMenu for keyboard-accessible dropdown"
    - "Radix Dialog-based Sheet for side panel"
    - "CDN Swagger UI bundle via dynamic script injection"
    - "dev-mode axe-core lazy import with NODE_ENV guard"
    - "sr-only skip link visible on focus for WCAG 2.4.1"
key_files:
  created:
    - "frontend/src/components/tickets/BookmarksDropdown.tsx"
    - "frontend/src/components/bookmarks/BookmarkManageSheet.tsx"
    - "frontend/src/components/tickets/MergeDialog.tsx"
    - "frontend/src/components/api-docs/SwaggerUiClient.tsx"
    - "frontend/src/app/api/docs/page.tsx"
    - "frontend/src/components/a11y/SkipLink.tsx"
    - "frontend/src/components/a11y/AxeAuditRunner.tsx"
    - "frontend/src/app/(staff)/tickets/page.tsx"
    - "frontend/src/app/(staff)/tickets/[id]/page.tsx"
    - "frontend/src/components/ui/dropdown-menu.tsx"
    - "frontend/src/components/ui/sheet.tsx"
    - "frontend/e2e/bookmarks.spec.ts"
    - "frontend/e2e/merge-dialog.spec.ts"
    - "frontend/e2e/api-docs.spec.ts"
    - "frontend/e2e/accessibility.spec.ts"
  modified:
    - "frontend/src/app/layout.tsx (added SkipLink, AxeAuditRunner, route-announcer)"
    - "frontend/package.json (added sonner, @axe-core/playwright, @axe-core/react)"
decisions:
  - "Used CDN Swagger UI bundle (unpkg.com/swagger-ui-dist@5) instead of npm package — avoids ~2MB npm dep, no SSR issues"
  - "filterState stored as Record<string,unknown> in bookmarks — flexible shape matches TicketSearchParams; consumer reconstructs URLSearchParams on restore"
  - "50-bookmark limit returns HTTP 409; shown as toast rather than inline field error (per plan spec)"
  - "Duplicate name returns 422; shown as inline field error under the name input"
  - "MergeDialog 3-step flow: search → side-by-side preview → success; error codes mapped to user-readable messages at preview step"
  - "Sheet component built on Radix Dialog (no separate @radix-ui/react-sheet package exists)"
  - "AxeAuditRunner uses dynamic import with catch to silently no-op if @axe-core/react not installed"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-06-23"
  tasks_completed: 2
  tasks_total: 2
  files_created: 15
  files_modified: 1
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 18: Wave 3d Frontend Features Summary

**One-liner:** Bookmark save/restore/delete UI, ticket merge 3-step dialog, CDN Swagger docs page, and WCAG 2.1 AA skip link + axe-core audit infrastructure for the uReport Next.js SPA.

## Objective

Implement the final Wave 3d frontend features: bookmark management UI (F12), ticket merge confirmation dialog (F18), OpenAPI/Swagger embedded docs page (F16), and WCAG 2.1 AA accessibility pass (F15).

## Tasks Completed

### Task 1: Bookmark management UI (F12)
**Commit:** `a8d225a`

**Files created:**
- `frontend/src/components/tickets/BookmarksDropdown.tsx` — Radix DropdownMenu with bookmark list, save-filter Dialog, and manage-sheet trigger
- `frontend/src/components/bookmarks/BookmarkManageSheet.tsx` — Radix Sheet (right side panel) with accessible delete buttons
- `frontend/src/app/(staff)/tickets/page.tsx` — Ticket list page with BookmarksDropdown in search toolbar
- `frontend/src/components/ui/dropdown-menu.tsx` — Missing UI primitive (created)
- `frontend/src/components/ui/sheet.tsx` — Missing UI primitive (created, built on Radix Dialog)
- `frontend/e2e/bookmarks.spec.ts` — Playwright e2e tests

**Key implementation details:**
- `GET /api/bookmarks` on mount; parsed `{ data }` from JSON envelope
- `POST /api/bookmarks` with `{ name, filterState }` — 422 shows inline field error; 409 shows toast
- `DELETE /api/bookmarks/{id}` — 204 removes from local state; 404 removes from UI anyway
- `onRestoreBookmark` converts filterState to URLSearchParams and calls `router.push`
- Trigger has `aria-label="Bookmarks — manage saved searches"` for WCAG 4.1.2
- Name input has `aria-invalid="true"` + `aria-describedby` on validation failure
- Bookmark list in ManageSheet uses `role="list"` for screen reader semantics

### Task 2: MergeDialog, API docs page, WCAG accessibility pass (F18 + F16 + F15)
**Commit:** `d33c63b`

**Files created:**
- `frontend/src/components/tickets/MergeDialog.tsx` — 3-step Radix Dialog (search → preview → success)
- `frontend/src/app/(staff)/tickets/[id]/page.tsx` — Ticket detail page with MergeDialog via kebab menu
- `frontend/src/components/api-docs/SwaggerUiClient.tsx` — CDN Swagger UI via dynamic script injection
- `frontend/src/app/api/docs/page.tsx` — Next.js page at /api/docs
- `frontend/src/components/a11y/SkipLink.tsx` — WCAG 2.4.1 skip navigation link
- `frontend/src/components/a11y/AxeAuditRunner.tsx` — Dev-mode axe-core runner (no-op in production)
- `frontend/e2e/merge-dialog.spec.ts` — Playwright tests for merge dialog
- `frontend/e2e/api-docs.spec.ts` — Playwright tests for API docs page
- `frontend/e2e/accessibility.spec.ts` — WCAG 2.1 AA axe-core audits + skip link tests

**Files modified:**
- `frontend/src/app/layout.tsx` — Added `<SkipLink />`, `<AxeAuditRunner />`, `aria-live` route announcer

**MergeDialog implementation:**
- Step 1 (search): `GET /api/tickets/{id}/merge-candidates?q=&page=1&perPage=25` with 300ms debounce; `role="listbox"` + `role="option"` for ARIA listbox pattern
- Step 2 (preview): Side-by-side source (red border, "will be closed") vs target (canonical); error shown as `role="alert" aria-live="assertive"`
- Step 3 (success): Link to target ticket with ArrowRight icon
- Error code mapping: SELF_MERGE → "Cannot merge a ticket into itself", ALREADY_MERGED, TARGET_CLOSED, TARGET_MERGED → user-readable messages
- `aria-labelledby="merge-dialog-title"` + `aria-describedby="merge-dialog-description"` on DialogContent
- `onMergeSuccess` calls `router.refresh()` to re-fetch ticket with updated merged status

**OpenAPI docs:**
- CDN approach: `https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js` loaded on client mount
- `#swagger-ui` container with `aria-label="uReport API documentation — interactive OpenAPI spec"`
- Page metadata: `title: 'API Documentation — uReport'`

**WCAG 2.1 AA fixes:**
- SkipLink: `<a href="#main-content">` as first focusable element; `sr-only focus:not-sr-only` pattern
- All `<main>` elements use `id="main-content"` as skip link target
- Loading states: `role="status" aria-live="polite"` on skeleton containers
- Form errors: `aria-invalid="true"` + `aria-describedby` pattern established and applied
- SLA badges: `aria-label="SLA status: {status}"` in TicketResultsList (pre-existing from Wave 3c)
- Filter search: `role="search" aria-label="Filter tickets"` on search toolbar wrapper
- Route announcer: `aria-live="polite"` div in root layout for page navigation announcements

## Integration Contracts Verified

- `BookmarksDropdown` exports: `export function BookmarksDropdown` ✓
- `MergeDialog` exports: `export function MergeDialog` ✓
- `/api/docs` page references `/api/openapi.json` ✓
- SkipLink targets `#main-content` ✓
- BookmarksDropdown calls `/api/bookmarks` (GET/POST) ✓
- MergeDialog calls `/api/tickets/{id}/merge-candidates` + `/api/tickets/{id}/merge` ✓

## Deviations from Plan

### Auto-added Missing Infrastructure (Rule 3)

**1. [Rule 3 - Blocking] Created missing UI primitives (DropdownMenu, Sheet)**
- **Found during:** Task 1
- **Issue:** `DropdownMenu` and `Sheet` components referenced in plan but not yet installed as shadcn/ui primitives
- **Fix:** Created from scratch using `@radix-ui/react-dropdown-menu` and `@radix-ui/react-dialog` (Sheet is built on Dialog — no separate `@radix-ui/react-sheet` package exists)
- **Files created:** `frontend/src/components/ui/dropdown-menu.tsx`, `frontend/src/components/ui/sheet.tsx`

**2. [Rule 3 - Blocking] Created missing tickets page.tsx and [id]/page.tsx**
- **Found during:** Task 1 (tickets page), Task 2 (detail page)
- **Issue:** Plan says "wire BookmarksDropdown into ticket list page" and "wire MergeDialog into ticket detail page" — but neither page existed yet (Wave 3a plans 12-17 not yet executed)
- **Fix:** Created full page implementations for both routes with proper main content structure and `id="main-content"` for skip link

**3. [Rule 2 - Missing Critical] Added Sonner toast provider + @axe-core packages**
- **Found during:** Task 1
- **Issue:** `toast` from `sonner` used in components but package not installed; `@axe-core/playwright` needed for accessibility.spec.ts
- **Fix:** `npm install sonner` + `npm install --save-dev @axe-core/playwright @axe-core/react`

### Design Decision: CDN Swagger UI
The plan specified CDN approach; no new npm package was needed. Implemented exactly as specified.

## Playwright Test Coverage

| Test file | Tests | Coverage |
|-----------|-------|----------|
| `bookmarks.spec.ts` | 5 | Dropdown trigger, open/menu items, save dialog validation, accessible label, manage sheet |
| `merge-dialog.spec.ts` | 5 | Kebab menu item, dialog opens, description, candidate listbox, cancel |
| `api-docs.spec.ts` | 3 | #swagger-ui visible, page title, aria-label |
| `accessibility.spec.ts` | 6 | WCAG 2.1 AA on 4 routes + skip link tab order + #main-content exists |

Note: E2E tests written as deliverables; execution deferred to verify phase (requires running application).

## Self-Check

### Files exist:
- [x] `frontend/src/components/tickets/BookmarksDropdown.tsx`
- [x] `frontend/src/components/bookmarks/BookmarkManageSheet.tsx`
- [x] `frontend/src/components/tickets/MergeDialog.tsx`
- [x] `frontend/src/components/api-docs/SwaggerUiClient.tsx`
- [x] `frontend/src/app/api/docs/page.tsx`
- [x] `frontend/src/components/a11y/SkipLink.tsx`
- [x] `frontend/src/components/a11y/AxeAuditRunner.tsx`
- [x] `frontend/e2e/bookmarks.spec.ts`
- [x] `frontend/e2e/merge-dialog.spec.ts`
- [x] `frontend/e2e/api-docs.spec.ts`
- [x] `frontend/e2e/accessibility.spec.ts`

### Commits exist:
- [x] `a8d225a` — Task 1: bookmark management UI
- [x] `d33c63b` — Task 2: MergeDialog, API docs, accessibility

### TypeScript: 0 errors on new files (pre-existing errors in unrelated test file excluded)

## Self-Check: PASSED
