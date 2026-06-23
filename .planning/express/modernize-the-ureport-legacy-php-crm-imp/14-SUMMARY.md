---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 14
subsystem: frontend-admin
tags: [react, nextjs, admin-ui, people, templates, api-clients, wcag]
dependency_graph:
  requires:
    - plan: "06"
      artifact: "PersonController, ContactMethodController, TemplateController, ClientController"
    - plan: "13"
      artifact: "AdminNav, admin layout, api/admin.ts"
  provides:
    - "/admin/people (list, create, edit, contact methods)"
    - "/admin/templates (list, create, edit, variable hints, system protection)"
    - "/admin/clients (list, create, revoke, regenerate + one-time key modal)"
  affects:
    - "Admin SPA completeness (F3, F13, F14, F15)"
tech_stack:
  added:
    - "@radix-ui/react-dialog (direct usage for ApiKeyModal no-dismiss)"
  patterns:
    - "'use client' client components with server route guard in layout"
    - "Atomic fetch functions in lib/api/admin.ts consuming apiClient wrapper"
    - "AlertDialog for destructive action confirmation"
    - "Insert-at-cursor textarea ref pattern for variable hints"
key_files:
  created:
    - frontend/src/components/admin/PersonForm.tsx
    - frontend/src/components/admin/ContactMethodsPanel.tsx
    - frontend/src/app/admin/people/page.tsx
    - frontend/src/app/admin/people/new/page.tsx
    - "frontend/src/app/admin/people/[id]/page.tsx"
    - frontend/src/components/admin/TemplateForm.tsx
    - frontend/src/components/admin/ApiKeyModal.tsx
    - frontend/src/components/admin/ClientForm.tsx
    - frontend/src/app/admin/templates/page.tsx
    - frontend/src/app/admin/templates/new/page.tsx
    - "frontend/src/app/admin/templates/[id]/page.tsx"
    - frontend/src/app/admin/clients/page.tsx
    - frontend/src/app/admin/clients/new/page.tsx
    - frontend/e2e/admin-people.spec.ts
    - frontend/e2e/admin-templates.spec.ts
    - frontend/e2e/admin-clients.spec.ts
  modified:
    - frontend/src/lib/api/admin.ts (added Person, ContactMethod, Template, ApiClient types and functions)
decisions:
  - "ApiKeyModal built directly with Radix DialogPrimitive.Root (not shadcn/ui wrapper) to gain onInteractOutside/onEscapeKeyDown without override friction"
  - "People list page uses 'use client' for filter/pagination interactivity; no RSC data fetching"
  - "Template variable chips use insertAtCursor helper with requestAnimationFrame for cursor repositioning after React state update"
  - "Badge success variant implemented via className override (not adding new variant) to avoid touching existing UI component contract"
  - "system template protection: slug !== null check in both TemplateForm (notice banner) and templates/page.tsx (disabled delete button with aria-disabled)"
metrics:
  duration: "~45 minutes"
  completed: "2026-06-23"
  tasks: 2
  files: 16
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 14: Admin Screens for People, Templates, and API Clients

**One-liner:** People/contact-methods CRUD + template variable hints + one-time API key modal with escape/click-outside lock for Wave 3b admin configuration.

## What Was Built

### Task 1: /admin/people — People CRUD + Contact Methods (pre-committed in express-16)

**Route `/admin/people`** (`frontend/src/app/admin/people/page.tsx`):
- Searchable/filterable table with `q`, `role`, and `active` filters
- Desktop: table with Full Name, Role badge (admin=red, staff=blue, public=gray), Department, Status, Actions
- Mobile (375px): card-based layout — no horizontal scroll at 375px viewport
- Deactivate/Reactivate per-row with Radix `AlertDialog` confirmation
- `<nav aria-label="People pagination">` with previous/next pagination

**`PersonForm`** (`frontend/src/components/admin/PersonForm.tsx`):
- Role selector showing human-readable descriptions per UX-Mockup Flow-05:
  - Admin → "Admin — Can configure all system settings, manage users, and access all tickets"
  - Staff → "Staff — Can manage tickets in assigned departments and view all permitted categories"
  - Public → "Public (Citizen) — Can submit and track their own tickets; no staff access"
- Department field conditional on role (hidden for 'public', required for admin/staff)
- Client-side validation mirroring backend; server 422 errors mapped via field codes
- All inputs have `<label htmlFor>` or `aria-label` (WCAG 2.1 AA)
- Error messages use `role="alert"` with `aria-describedby`

**`ContactMethodsPanel`** (`frontend/src/components/admin/ContactMethodsPanel.tsx`):
- Lists email, phone, address contact methods grouped by type
- `DUPLICATE_EMAIL` error code → inline "This email address is already registered to another person"
- `INVALID_EMAIL` → inline "Please enter a valid email address"
- isPrimary demotion notice when setting primary would replace existing: "This will replace the current primary {type}"
- Add/Edit via Radix `Dialog` with `aria-labelledby`; Remove via Radix `AlertDialog`

**E2E coverage** (`frontend/e2e/admin-people.spec.ts`): 9 Playwright tests covering list/search, create person, duplicate email error, contact method CRUD, isPrimary demotion, deactivate confirmation, keyboard navigation, mobile 375px layout.

---

### Task 2: /admin/templates + /admin/clients (committed 1a5725a)

**Route `/admin/templates`** (`frontend/src/app/admin/templates/page.tsx`):
- Table: Name, Subject, Active badge, System? badge (for `slug !== null`), Actions
- System templates show "System" badge with tooltip; Delete button `disabled` + `aria-disabled="true"`
- Non-system templates: Delete with AlertDialog confirmation; all templates: Toggle Active

**`TemplateForm`** (`frontend/src/components/admin/TemplateForm.tsx`):
- All 11 `{{...}}` variable tokens as clickable chips in variable hint panel:
  `{{ticket_id}}`, `{{title}}`, `{{category}}`, `{{department}}`, `{{assignee_name}}`,
  `{{reporter_name}}`, `{{status}}`, `{{date_opened}}`, `{{expected_close_date}}`,
  `{{ticket_url}}`, `{{response_body}}`
- Chip click → `insertAtCursor()` helper uses `textarea.selectionStart` to insert at cursor, repositions via `requestAnimationFrame`
- Body textarea: character counter (max 10,000) with amber warning at 90% capacity
- System template notice banner when `slug !== null` (editing allowed, deletion protected)
- Variable hint panel responsive: right-column on desktop (lg), below textarea on mobile

**`ApiKeyModal`** (`frontend/src/components/admin/ApiKeyModal.tsx`):
- Built directly on `DialogPrimitive.Root` (bypassing shadcn wrapper) for fine-grained event control
- `onInteractOutside={(e) => e.preventDefault()}` — blocks outside-click dismiss
- `onEscapeKeyDown={(e) => e.preventDefault()}` — blocks Escape key dismiss
- No X close button — only exit is "I've saved my key — Close" button
- API key in monospace `<code>` with `select-all` for manual copy
- Copy to clipboard via `navigator.clipboard.writeText()` — success: "✅ Copied!" for 2s; failure: "Unable to copy — select and copy manually"
- `aria-live="polite"` region announces copy status to screen readers
- Warning: "This key will not be shown again. Store it securely before closing." (amber)
- Props: `{ open, apiKey, clientName, onConfirm }` — parent clears `apiKey` from state after confirm

**Route `/admin/clients`** (`frontend/src/app/admin/clients/page.tsx`):
- Table: Client Name, Contact Email, Status (Active=green/Revoked=red), Key Hint (never full key), Created, Actions
- Active clients: [Revoke] + [Regen Key]; Revoked clients: [Reactivate]
- Revoke → `AlertDialog`: "Open311 requests using this key will be immediately rejected"
- Regen Key → `POST /api/clients/{id}/regenerate-key` → `ApiKeyModal` with new key

**Route `/admin/clients/new`** (`frontend/src/app/admin/clients/new/page.tsx`):
- `ClientForm` → on success → `ApiKeyModal` with `onConfirm` → redirect to `/admin/clients`
- `DUPLICATE_NAME` → "A client with this name already exists"
- `INVALID_EMAIL` → "Enter a valid email address"

**E2E coverage** (`frontend/e2e/admin-templates.spec.ts`, `frontend/e2e/admin-clients.spec.ts`):
- Templates: 8 tests — list view, create, variable chip insertion, all 11 variables visible, duplicate name error, system template protection, toggle active, keyboard nav, mobile 375px
- Clients: 8 tests — list with key hints, create + modal appears, modal no-dismiss (outside click + Escape), copy to clipboard, confirm key → redirect, revoke with AlertDialog, regenerate key, mobile 375px

---

## Integration Contracts Fulfilled

| Plan | Contract | Status |
|------|----------|--------|
| 06 | GET/POST/PUT/DELETE /api/people | ✅ consumed |
| 06 | GET/POST/PUT/DELETE /api/people/{id}/contact-methods | ✅ consumed |
| 06 | GET/POST/PUT/DELETE /api/templates | ✅ consumed |
| 06 | GET/POST/DELETE /api/clients + POST /api/clients/{id}/regenerate-key | ✅ consumed |

## Deviations from Plan

### Auto-fixed Issues (Rule 1 — Bug)

**1. [Rule 1 - Bug] Badge 'success' variant not in existing component**
- **Found during:** Task 2 TypeScript check
- **Issue:** `Badge variant="success"` caused TypeScript error — existing Badge only has `default | destructive | outline | secondary`
- **Fix:** Used `className="bg-green-600 text-white"` override on `variant="default"` for active status
- **Files modified:** `frontend/src/app/admin/clients/page.tsx`
- **Commit:** 1a5725a

### Blocking Issues Resolved (Rule 3)

**1. [Rule 3 - Blocking] Admin infrastructure (layout, AdminNav, api/admin.ts) required before Plan 14 screens**
- **Found during:** Pre-execution analysis (Plan 13 not yet executed)
- **Resolution:** Admin infrastructure was already committed in prior plan commits; Plan 14 extended `frontend/src/lib/api/admin.ts` with Person, ContactMethod, Template, ApiClient types and functions
- **No code gap** — infrastructure existed and worked correctly

### Tasks Pre-committed

Task 1 files (people screens + e2e tests) were pre-committed as part of `feat(express-16)` commit `e527579` during prior plan execution. No re-work was needed; all behavioral requirements verified correct.

## Self-Check

### Files Created Verification
- [x] `frontend/src/components/admin/PersonForm.tsx` — FOUND
- [x] `frontend/src/components/admin/ContactMethodsPanel.tsx` — FOUND
- [x] `frontend/src/app/admin/people/page.tsx` — FOUND
- [x] `frontend/src/app/admin/people/new/page.tsx` — FOUND
- [x] `frontend/src/app/admin/people/[id]/page.tsx` — FOUND
- [x] `frontend/src/components/admin/TemplateForm.tsx` — FOUND
- [x] `frontend/src/components/admin/ApiKeyModal.tsx` — FOUND
- [x] `frontend/src/components/admin/ClientForm.tsx` — FOUND
- [x] `frontend/src/app/admin/templates/page.tsx` — FOUND
- [x] `frontend/src/app/admin/templates/new/page.tsx` — FOUND
- [x] `frontend/src/app/admin/templates/[id]/page.tsx` — FOUND
- [x] `frontend/src/app/admin/clients/page.tsx` — FOUND
- [x] `frontend/src/app/admin/clients/new/page.tsx` — FOUND
- [x] `frontend/e2e/admin-people.spec.ts` — FOUND
- [x] `frontend/e2e/admin-templates.spec.ts` — FOUND
- [x] `frontend/e2e/admin-clients.spec.ts` — FOUND

### Commits Verification
- [x] `e527579` — Task 1 (people screens pre-committed in express-16)
- [x] `1a5725a` — Task 2 (templates + clients screens)

### Behavioral Verification
- [x] `PERSONFORM OK` — export verified
- [x] `CM_PANEL OK` — export verified
- [x] `TEMPLATEFORM OK` — export verified
- [x] `CLIENTFORM OK` — export verified
- [x] `APIKEY_MODAL OK` — export verified
- [x] `TEMPLATE_VARS OK` — all 11 variables in source
- [x] `MODAL_LOCKED OK` — onInteractOutside preventDefault
- [x] `EMAIL_UNIQUE OK` — DUPLICATE_EMAIL handling
- [x] `SYS_PROTECT OK` — slug !== null guard in templates
- [x] `ROLE_LABELS OK` — human-readable role descriptions
- [x] `E2E_FILES OK` — all 3 e2e test files present
- [x] `TS_CLEAN` — zero TypeScript strict mode errors

## Self-Check: PASSED
