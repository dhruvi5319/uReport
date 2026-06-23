---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 14
type: execute
wave: 3
depends_on: [2]
files_modified:
  - frontend/src/app/admin/people/page.tsx
  - frontend/src/app/admin/people/[id]/page.tsx
  - frontend/src/app/admin/people/new/page.tsx
  - frontend/src/components/admin/PersonForm.tsx
  - frontend/src/components/admin/ContactMethodsPanel.tsx
  - frontend/src/app/admin/templates/page.tsx
  - frontend/src/app/admin/templates/[id]/page.tsx
  - frontend/src/components/admin/TemplateForm.tsx
  - frontend/src/app/admin/clients/page.tsx
  - frontend/src/app/admin/clients/new/page.tsx
  - frontend/src/components/admin/ClientForm.tsx
  - frontend/src/components/admin/ApiKeyModal.tsx
  - frontend/e2e/admin-people.spec.ts
  - frontend/e2e/admin-templates.spec.ts
  - frontend/e2e/admin-clients.spec.ts
autonomous: true

features:
  implements: ["F3", "F13", "F14", "F15"]
  depends_on: ["F16", "F10", "F11"]
  enables: []

must_haves:
  truths:
    - "Admin can search and list people with role/department/active filters at /admin/people"
    - "Admin can create and edit a person record with role selector showing human-readable descriptions"
    - "Admin can add, update, and remove contact methods (email/phone/address) per person with isPrimary promotion"
    - "Admin can list, create, edit, and toggle active state on response templates at /admin/templates"
    - "Template form shows variable hint panel listing all supported {{...}} placeholders"
    - "Admin can list, create, revoke, and regenerate API client keys at /admin/clients"
    - "API key is displayed once-only in a modal with copy-to-clipboard; modal cannot be closed without confirming key was saved"
    - "All admin screens are WCAG 2.1 AA compliant and fully functional at 375px mobile viewport"
  artifacts:
    - path: "frontend/src/app/admin/people/page.tsx"
      provides: "/admin/people list page"
      min_lines: 60
    - path: "frontend/src/components/admin/PersonForm.tsx"
      provides: "Create/edit person form with role selector and validation"
      exports: ["PersonForm"]
    - path: "frontend/src/components/admin/ContactMethodsPanel.tsx"
      provides: "Contact methods sub-panel (email/phone/address CRUD)"
      exports: ["ContactMethodsPanel"]
    - path: "frontend/src/components/admin/TemplateForm.tsx"
      provides: "Template CRUD form with variable hint panel"
      exports: ["TemplateForm"]
    - path: "frontend/src/components/admin/ApiKeyModal.tsx"
      provides: "One-time API key display modal with copy-to-clipboard"
      exports: ["ApiKeyModal"]
    - path: "frontend/e2e/admin-people.spec.ts"
      provides: "Playwright e2e tests for /admin/people flows"
    - path: "frontend/e2e/admin-templates.spec.ts"
      provides: "Playwright e2e tests for /admin/templates flows"
    - path: "frontend/e2e/admin-clients.spec.ts"
      provides: "Playwright e2e tests for /admin/clients flows"
  key_links:
    - from: "frontend/src/app/admin/people/page.tsx"
      to: "GET /api/people"
      via: "fetch with role/departmentId/active query params"
      pattern: "api/people"
    - from: "frontend/src/components/admin/ContactMethodsPanel.tsx"
      to: "POST /api/people/{id}/contact-methods"
      via: "fetch POST with type/value/isPrimary body"
      pattern: "api/people.*contact-methods"
    - from: "frontend/src/components/admin/ApiKeyModal.tsx"
      to: "POST /api/clients or POST /api/clients/{id}/regenerate-key"
      via: "displays apiKey from response body (returned once only)"
      pattern: "apiKey"

integration_contracts:
  requires:
    - from_plan: "06"
      artifact: "crm/src/Controllers/Api/PersonController.php"
      exports: ["GET /api/people", "POST /api/people", "GET /api/people/{id}", "PUT /api/people/{id}", "DELETE /api/people/{id}"]
      verify: "grep -n 'class PersonController' crm/src/Controllers/Api/PersonController.php && echo CONTRACT_OK"
    - from_plan: "06"
      artifact: "crm/src/Controllers/Api/ContactMethodController.php"
      exports: ["GET /api/people/{id}/contact-methods", "POST /api/people/{id}/contact-methods", "PUT /api/people/{id}/contact-methods/{cmId}", "DELETE /api/people/{id}/contact-methods/{cmId}"]
      verify: "grep -n 'class ContactMethodController' crm/src/Controllers/Api/ContactMethodController.php && echo CONTRACT_OK"
    - from_plan: "06"
      artifact: "crm/src/Controllers/Api/TemplateController.php"
      exports: ["GET /api/templates", "POST /api/templates", "GET /api/templates/{id}", "PUT /api/templates/{id}", "DELETE /api/templates/{id}"]
      verify: "grep -n 'class TemplateController' crm/src/Controllers/Api/TemplateController.php && echo CONTRACT_OK"
    - from_plan: "06"
      artifact: "crm/src/Controllers/Api/ClientController.php"
      exports: ["GET /api/clients", "POST /api/clients", "GET /api/clients/{id}", "DELETE /api/clients/{id}", "POST /api/clients/{id}/regenerate-key"]
      verify: "grep -n 'class ClientController' crm/src/Controllers/Api/ClientController.php && echo CONTRACT_OK"
  provides:
    - artifact: "frontend/src/app/admin/people/page.tsx"
      exports: ["PeoplePage (default export)"]
      shape: |
        Route: /admin/people
        Query params: q (name/email search), role (admin|staff|public), departmentId, active (boolean)
        Renders searchable/filterable table of person records with Edit and Deactivate actions per row
      verify: "grep -rn 'admin/people' frontend/src/app/admin/people/page.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/components/admin/ApiKeyModal.tsx"
      exports: ["ApiKeyModal"]
      shape: |
        Props: { apiKey: string; onConfirm: () => void }
        Renders one-time API key display with copy button; only exit is confirm button (no X close)
        Used for POST /api/clients and POST /api/clients/{id}/regenerate-key responses
      verify: "grep -n 'export.*ApiKeyModal\\|ApiKeyModal' frontend/src/components/admin/ApiKeyModal.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/components/admin/TemplateForm.tsx"
      exports: ["TemplateForm"]
      shape: |
        Props: { template?: Template; onSave: (t: Template) => void; onCancel: () => void }
        Renders name, subject, body textarea with variable hint panel listing all supported {{...}} tokens
      verify: "grep -n 'export.*TemplateForm\\|TemplateForm' frontend/src/components/admin/TemplateForm.tsx && echo CONTRACT_OK"
---

<objective>
Implement the Wave 3b second frontend plan: admin screens for People/Contacts (F3), Response Templates (F13), and API Client management (F14). These are the remaining three admin configuration screens from Wave 3b. All screens consume Wave 2b (Plan 06) REST API controllers.

Purpose: Complete the admin configuration UI so that Tomás (PER-04) can manage staff user accounts, response templates, and Open311 API client keys through the SPA without SSH access. These screens are specifically called out in US-3.1, US-3.3, US-13.1, US-14.1, and US-14.2.

Output:
- `/admin/people` — searchable/filterable people list, create/edit forms, contact methods sub-panel
- `/admin/templates` — response template list with create/edit; variable hint panel; system template protection
- `/admin/clients` — API client list with create (one-time key modal), revoke, and regenerate-key (one-time modal)
- All components WCAG 2.1 AA (axe-core 0 critical violations), responsive 375px–1920px
- Playwright e2e tests covering each screen's critical flows
</objective>

<feature_dependencies>
Implements: F3: People & Contact Management (people list/search, create/edit person, contact methods CRUD with isPrimary promotion), F13: Response Templates (template list/create/edit with variable hints, system template protection), F14: API Client Management (client list, create with one-time key modal, revoke, regenerate key with one-time modal), F15: Modern React/Next.js SPA Frontend (admin screens, WCAG 2.1 AA, mobile-responsive)
Depends on: F16 (Wave 2a — JSON API envelope/middleware), F10 (RBAC — admin-only route guard), F11 (OIDC session — authenticated routing)
Enables: None (terminal Wave 3b plan)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/UX-Mockup-uReport.md
@project_specs/UserStories-uReport.md
@project_specs/PERSONAS-uReport.md

# Wave 2b outputs consumed by this plan:
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/06-PLAN.md

# Wave 3b sibling plan (Wave 3b-1 covers /admin/departments, /admin/categories, /admin/substatuses):
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/13-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: /admin/people — list, create/edit form, and contact methods sub-panel</name>
  <files>
    frontend/src/app/admin/people/page.tsx
    frontend/src/app/admin/people/new/page.tsx
    frontend/src/app/admin/people/[id]/page.tsx
    frontend/src/components/admin/PersonForm.tsx
    frontend/src/components/admin/ContactMethodsPanel.tsx
    frontend/e2e/admin-people.spec.ts
  </files>
  <action>
Implement the `/admin/people` admin screens. Check if Wave 3b-1 (Plan 13) established patterns for admin pages (layout wrapper, admin route guard, data-fetching hooks). Follow those patterns exactly — do NOT invent new ones.

Check for existing shared utilities:
```bash
ls frontend/src/components/admin/ 2>/dev/null
ls frontend/src/hooks/ 2>/dev/null
ls frontend/src/lib/api*.ts 2>/dev/null || ls frontend/src/lib/apiClient.ts 2>/dev/null
```

---

### `frontend/src/app/admin/people/page.tsx`

Route: `/admin/people` — searchable, filterable list of people.

**API call:** `GET /api/people?q={q}&role={role}&departmentId={id}&active={bool}&page={n}&perPage=25`

Response shape from Plan 06:
```typescript
{
  data: Array<{
    id: number; firstName: string; lastName: string; fullName: string;
    role: 'admin'|'staff'|'public'; departmentId: number|null; active: boolean;
    oidcSubject: string|null; createdAt: string; updatedAt: string;
  }>;
  meta: { page: number; perPage: number; total: number; pages: number };
  errors: [];
}
```

**Layout:**
- Page heading: "People" with "+ New Person" button (admin-only)
- Filter bar (collapsible on mobile): text search `q` input, Role dropdown (All / Admin / Staff / Public / Citizen), Active toggle
- Table columns (desktop): Full Name | Role | Department | Email (primary, loaded inline) | Active | Actions
- Mobile: card-based layout (one card per person showing full name, role badge, active status)
- Actions per row: Edit (→ `/admin/people/{id}`), Deactivate/Reactivate (toggle active via PUT)
- Pagination: previous/next with page count
- Role badge colors: admin = red/destructive, staff = blue, public = gray (using shadcn/ui Badge variants)
- Deactivate shows a confirm dialog: "Deactivate {fullName}? They will no longer be able to log in."

**Role selector human-readable labels** (from UX-Mockup Flow-05):
```
admin  → "Admin — Can configure all system settings, manage users, and access all tickets"
staff  → "Staff — Can manage tickets in assigned departments and view all permitted categories"
public → "Public (Citizen) — Can submit and track their own tickets; no staff access"
```

**WCAG 2.1 AA requirements:**
- All table column headers use `<th scope="col">`
- Role filter uses `<label htmlFor>` or `aria-label`
- Deactivate confirm dialog uses Radix `AlertDialog` with `aria-describedby`
- Pagination uses `<nav aria-label="People pagination">`
- Color-only role badges must also include text label (never color alone)

---

### `frontend/src/components/admin/PersonForm.tsx`

Reusable create/edit form — used by both `/admin/people/new` and `/admin/people/[id]`.

Props:
```typescript
interface PersonFormProps {
  person?: Person;                // undefined = create mode
  departments: Department[];      // for department select
  onSave: (saved: Person) => void;
  onCancel: () => void;
}
```

Fields:
- First Name (required, text, max 100)
- Last Name (required, text, max 100)
- Role (required, Select with human-readable descriptions per UX-Mockup)
- Department (Select, required when role is admin/staff; hidden for public)
- Active (Switch/Checkbox — only shown in edit mode)

Validation (client-side, mirrors backend):
- firstName and lastName required and non-empty
- role must be one of admin|staff|public
- role admin/staff requires departmentId selection
- On role change to 'public': clear departmentId

API calls:
- Create: `POST /api/people` body `{firstName, lastName, role, departmentId?, active?}`
- Update: `PUT /api/people/{id}` body (partial, same shape)

Server 422 errors: map field-level errors to inline field messages under each input using react-hook-form `setError`.

On success: call `onSave(savedPerson)`.

**WCAG:** All inputs have `<label>` or `aria-label`; error messages use `role="alert"` or linked via `aria-describedby`.

---

### `frontend/src/components/admin/ContactMethodsPanel.tsx`

Sub-panel shown in the edit view (`/admin/people/[id]`) for managing contact methods.

Props:
```typescript
interface ContactMethodsPanelProps {
  personId: number;
}
```

**Contact method shape (from Plan 06):**
```typescript
{
  id: number; personId: number; type: 'email'|'phone'|'address';
  value: string; phoneType: 'mobile'|'office'|'home'|null;
  isPrimary: boolean; label: string|null;
}
```

**Layout:**
- Section heading: "Contact Methods" with "+ Add" button
- Listed in groups: Email addresses, Phone numbers, Addresses
- Each entry shows: value, type badge, isPrimary star (★ if primary), label (if set), Edit / Remove actions
- "+ Add" opens an inline form (accordion-expand or dialog) with:
  - Type (Select: Email / Phone / Address)
  - Value (text; validated as email format client-side if type=email)
  - Phone Type (Select: Mobile / Office / Home — shown only if type=phone)
  - Label (optional text)
  - Is Primary (Checkbox)

**API calls:**
- List: `GET /api/people/{personId}/contact-methods`
- Create: `POST /api/people/{personId}/contact-methods` body `{type, value, phoneType?, isPrimary, label?}`
- Update: `PUT /api/people/{personId}/contact-methods/{id}` body (partial)
- Delete: `DELETE /api/people/{personId}/contact-methods/{id}` — shows confirm: "Remove {value}?"

**Error handling:**
- `DUPLICATE_EMAIL` → inline: "This email address is already registered to another person"
- `INVALID_EMAIL` → inline: "Please enter a valid email address"

**isPrimary promotion UX:** When isPrimary is checked and there is already a primary of the same type, show a note: "This will replace the current primary {type}."

**WCAG:** Add/edit form uses a `<dialog>` (Radix Dialog) with `aria-labelledby`; remove action uses Radix `AlertDialog`.

---

### `frontend/src/app/admin/people/new/page.tsx`

Thin wrapper — renders admin layout, breadcrumb "People → New Person", and `<PersonForm>` with no `person` prop. On save, redirects to `/admin/people/{id}`.

### `frontend/src/app/admin/people/[id]/page.tsx`

Loads person by id: `GET /api/people/{id}` (includes `contactMethods[]`). Renders:
1. `<PersonForm person={person} .../>` (edit mode) above the fold
2. `<ContactMethodsPanel personId={person.id} />` below

Handles 404: shows "Person not found" with "Back to People" link.

---

### `frontend/e2e/admin-people.spec.ts`

Playwright tests — cover these specific behaviors:

```typescript
test('admin can view people list and search by name', ...)
test('admin can create a new person with staff role and email', ...)
test('creating person with duplicate email shows DUPLICATE_EMAIL error', ...)
test('admin can add an email contact method to a person', ...)
test('adding duplicate email contact method shows inline error', ...)
test('setting isPrimary demotes existing primary contact method', ...)
test('admin can deactivate a person with confirmation dialog', ...)
test('people list table is keyboard-navigable (Tab through rows)', ...)
test('mobile 375px: people list renders as cards without horizontal scroll', ...)
```

Test setup: authenticate as admin via OIDC (or mock session cookie), seed test person via API before each relevant test.
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend
npx tsc --noEmit 2>&1 | grep -E "admin/people|PersonForm|ContactMethod" | head -20 && echo "TS_TYPES_OK"
grep -n "export default\|export function\|export const" src/app/admin/people/page.tsx && echo "PEOPLE_PAGE_OK"
grep -n "export.*PersonForm\|PersonForm" src/components/admin/PersonForm.tsx && echo "PERSONFORM_OK"
grep -n "export.*ContactMethodsPanel\|ContactMethodsPanel" src/components/admin/ContactMethodsPanel.tsx && echo "CMSPANEL_OK"
grep -n "isPrimary\|demote\|DUPLICATE_EMAIL" src/components/admin/ContactMethodsPanel.tsx && echo "ISPRIMARY_LOGIC_OK"
grep -n "Admin.*settings\|Staff.*departments\|Public.*Citizen\|human-readable\|Can configure\|Can manage\|submit and track" src/components/admin/PersonForm.tsx && echo "ROLE_LABELS_OK"
npx playwright test e2e/admin-people.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `/admin/people` page renders searchable table (desktop) and card list (mobile 375px) without horizontal scroll
- `PersonForm` shows human-readable role descriptions matching UX-Mockup Flow-05 role table exactly
- `ContactMethodsPanel` enforces email uniqueness (shows DUPLICATE_EMAIL inline) and promotes isPrimary with demotion UX
- All inputs have associated `<label>` or `aria-label` (WCAG 2.1 AA)
- Deactivate and remove-contact-method actions use Radix AlertDialog for confirmation
- All Playwright tests in `admin-people.spec.ts` pass (0 failing, 0 skipped)
- Tests cover: list/search, create person, duplicate email error, contact method CRUD, isPrimary flow, deactivate confirmation, keyboard navigation, mobile 375px layout
  </done>
</task>

<task type="auto">
  <name>Task 2: /admin/templates (CRUD + variable hints) and /admin/clients (create/revoke/regenerate + one-time key modal)</name>
  <files>
    frontend/src/app/admin/templates/page.tsx
    frontend/src/app/admin/templates/[id]/page.tsx
    frontend/src/components/admin/TemplateForm.tsx
    frontend/src/app/admin/clients/page.tsx
    frontend/src/app/admin/clients/new/page.tsx
    frontend/src/components/admin/ClientForm.tsx
    frontend/src/components/admin/ApiKeyModal.tsx
    frontend/e2e/admin-templates.spec.ts
    frontend/e2e/admin-clients.spec.ts
  </files>
  <action>
Implement `/admin/templates` and `/admin/clients` admin screens. Follow patterns established by Wave 3b-1 and Task 1 above.

---

## PART A — Response Templates (`/admin/templates`)

### `frontend/src/app/admin/templates/page.tsx`

Route: `/admin/templates`

**API call:** `GET /api/templates` (returns active templates by default; add `?active=all` for admin to see inactive)

Response shape from Plan 06:
```typescript
{
  data: Array<{
    id: number; name: string; subject: string|null; body: string;
    slug: string|null; active: boolean; createdAt: string; updatedAt: string;
  }>;
  meta: { total: number };
  errors: [];
}
```

**Layout:**
- Page heading: "Response Templates" + "+ New Template" button
- Table columns: Name | Subject | Active | System? | Actions
- "System?" column: shows a badge "System" (gray, non-deletable) if `slug !== null`; empty otherwise
- Actions per row:
  - Edit (→ `/admin/templates/{id}`)
  - Toggle Active (PUT with `{active: !current}`) — shown for non-system templates; system templates can be deactivated but not deleted
  - Delete (AlertDialog confirm) — disabled/hidden for system templates (slug !== null)
- System templates show a tooltip/hint: "System templates cannot be deleted"
- Empty state: "No templates yet. Create your first response template."

**WCAG:** Table with proper th scope, delete button disabled + aria-disabled for system templates, tooltips use `title` attribute or Radix Tooltip with accessible trigger.

---

### `frontend/src/components/admin/TemplateForm.tsx`

Props:
```typescript
interface TemplateFormProps {
  template?: Template;           // undefined = create mode
  onSave: (saved: Template) => void;
  onCancel: () => void;
}
```

**Fields:**
- Name (required, text, max 255 chars)
- Subject (optional, text, max 255 chars — used as email subject for notifications)
- Body (required, `<textarea>`, max 10,000 chars with character counter)
- Active (Switch — only shown in edit mode)

**Variable hint panel** (from UX-Mockup Flow-05 `/admin/templates`):
- Placed to the right of the body textarea (desktop) or below it (mobile)
- Heading: "Available Variables"
- Listed as clickable chips/badges — clicking inserts the variable at cursor position in the textarea:

```
{{ticket_id}}         {{title}}              {{category}}
{{department}}        {{assignee_name}}      {{reporter_name}}
{{status}}            {{date_opened}}        {{expected_close_date}}
{{ticket_url}}        {{response_body}}
```

- Small note below: "Unknown variables are flagged as warnings by the server but do not block saving."

**Variable insertion UX:** Use a `ref` on the textarea; on chip click, call `insertAtCursor(ref, '{{variable_name}}')` helper that inserts at the current `selectionStart` and moves cursor after the inserted text.

**API calls:**
- Create: `POST /api/templates` body `{name, subject?, body, active?}`
- Update: `PUT /api/templates/{id}` body (partial)

**Validation:**
- name required, max 255
- body required, max 10,000
- Server 422: map field-level errors to inline messages

**System template protection:** If editing a template where `slug !== null`, show a read-only notice: "This is a system template. The name and body can be edited, but this template cannot be deleted." Do NOT disable editing — system templates CAN be updated.

**WCAG:**
- Textarea has `<label>` and character counter linked via `aria-describedby`
- Variable chips are `<button type="button">` with descriptive `aria-label="Insert {{ticket_id}}"`
- Form errors use `role="alert"` or `aria-live="polite"`

---

### `frontend/src/app/admin/templates/[id]/page.tsx`

Loads template: `GET /api/templates/{id}`. Renders `<TemplateForm template={template} .../>`. On 404: "Template not found. Back to Templates."

---

## PART B — API Clients (`/admin/clients`)

### `frontend/src/app/admin/clients/page.tsx`

Route: `/admin/clients`

**API call:** `GET /api/clients`

Response shape from Plan 06 (apiKeyHash NEVER included):
```typescript
{
  data: Array<{
    id: number; name: string; contactEmail: string;
    apiKeyHint: string;          // e.g. "a1b2c3d4…"
    notes: string|null; active: boolean; createdAt: string; updatedAt: string;
  }>;
  meta: { total: number };
}
```

**Layout (matches UX-Mockup Flow-05 `/admin/clients`):**
```
Client Name | Contact Email | Status | Key Hint       | Created    | Actions
──────────────────────────────────────────────────────────────────────────────
Mobile App  | dev@city.gov  | Active | a1b2c3d4…      | Jun 1 2026 | [Revoke] [Regen Key]
Legacy Sync | it@city.gov   | Revoked| bb44ff22…      | May 3 2026 | [Reactivate]
```

**Actions:**
- Revoke: `DELETE /api/clients/{id}` — AlertDialog: "Revoke key for {name}? Open311 requests using this key will be immediately rejected."
- Regenerate Key: `POST /api/clients/{id}/regenerate-key` — opens `<ApiKeyModal>` with the new key
- Reactivate: `PUT /api/clients/{id}` body `{active: true}` — shown only for inactive clients

**Status badge:** Active = green, Revoked/Inactive = red.

**WCAG:** Table headers with scope, action buttons have `aria-label="{action} for {clientName}"`, AlertDialog is Radix with role="alertdialog".

---

### `frontend/src/components/admin/ClientForm.tsx`

Used by `/admin/clients/new` only (clients cannot be fully edited post-create — only name/email/notes via PUT after creation, but the primary flow is create).

Props:
```typescript
interface ClientFormProps {
  onCreated: (savedClient: ApiClient, plainApiKey: string) => void;
  onCancel: () => void;
}
```

**Fields:**
- Client Name (required, text, max 255, unique)
- Contact Email (required, valid email)
- Notes (optional, textarea)

**API call:** `POST /api/clients` body `{name, contactEmail, notes?}`

On success: response includes `{data: {..., apiKey: "<plain key>"}}` — the `apiKey` is the full plain key returned only this once. Call `onCreated(savedClient, response.data.apiKey)`.

**Validation:**
- name required, max 255
- contactEmail required, valid RFC 5322 format
- Server 422: `DUPLICATE_NAME` → "A client with this name already exists"
- Server 422: `INVALID_EMAIL` → "Enter a valid email address"

---

### `frontend/src/components/admin/ApiKeyModal.tsx`

**Critical UX requirement from UX-Mockup Flow-05** — the one-time API key display modal. This modal is used for both client creation and key regeneration.

Props:
```typescript
interface ApiKeyModalProps {
  open: boolean;
  apiKey: string;           // full plain key — shown once only
  clientName: string;       // shown in heading
  onConfirm: () => void;    // only exit — no X / escape close
}
```

**Implementation (matches UX-Mockup exact design):**
```
┌─────────────────────────────────────────────────────┐
│  API Key Generated                                   │
│                                                      │
│  a3f82b91-xxxx-xxxx-xxxx-xxxxxxxxxxxx               │
│  [📋 Copy to clipboard]                              │
│                                                      │
│  ⚠️  This key will not be shown again.               │
│     Store it securely before closing.               │
│                                                      │
│  [I've saved my key — Close]                        │
└─────────────────────────────────────────────────────┘
```

**Critical rules:**
- Use Radix `Dialog` with `onInteractOutside={(e) => e.preventDefault()}` and `onEscapeKeyDown={(e) => e.preventDefault()}` — modal CANNOT be dismissed by clicking outside or pressing Escape
- NO X close button in the top-right corner
- The ONLY exit is the "I've saved my key — Close" button
- Copy to clipboard: use `navigator.clipboard.writeText(apiKey)`. On success show inline "✅ Copied!" for 2 seconds. On failure (permission denied): show "Unable to copy — select and copy manually"
- Key is displayed in a monospace `<code>` block with `select-all` styling so user can easily highlight
- Warning uses amber/yellow color with warning icon
- After `onConfirm()` is called, parent sets `open=false` and clears the `apiKey` from state

**WCAG:**
- Dialog has `aria-labelledby` pointing to "API Key Generated" heading
- Dialog has `aria-describedby` pointing to the warning paragraph
- Copy button `aria-label="Copy API key to clipboard"`
- After copy, `aria-live="polite"` region announces "Copied!" to screen readers

---

### `frontend/src/app/admin/clients/new/page.tsx`

Renders `<ClientForm>`. On `onCreated(client, apiKey)`:
1. Store `apiKey` in local component state
2. Show `<ApiKeyModal open={true} apiKey={apiKey} ...>`
3. On `onConfirm()`: clear apiKey state, close modal, redirect to `/admin/clients`

---

## PLAYWRIGHT TESTS

### `frontend/e2e/admin-templates.spec.ts`

```typescript
test('admin can view templates list including system templates', ...)
test('admin can create a new template with body text', ...)
test('variable hint chips insert {{...}} into textarea at cursor', ...)
test('duplicate template name shows DUPLICATE_NAME inline error', ...)
test('system template cannot be deleted (button absent or disabled)', ...)
test('admin can toggle template active state', ...)
test('template form is keyboard-navigable (Tab through fields)', ...)
test('mobile 375px: template list renders without horizontal scroll', ...)
```

### `frontend/e2e/admin-clients.spec.ts`

```typescript
test('admin can view clients list with key hints', ...)
test('admin can create a new client and API key modal appears', ...)
test('API key modal cannot be closed by clicking outside or pressing Escape', ...)
test('copy to clipboard button works in API key modal', ...)
test('admin can confirm key saved and be redirected to client list', ...)
test('admin can revoke a client key with confirmation dialog', ...)
test('admin can regenerate a client key and new key modal appears', ...)
test('mobile 375px: clients list renders without horizontal scroll', ...)
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend
npx tsc --noEmit 2>&1 | grep -E "admin/templates|admin/clients|TemplateForm|ClientForm|ApiKeyModal" | head -20 && echo "TS_TYPES_OK"
grep -n "export.*TemplateForm\|TemplateForm" src/components/admin/TemplateForm.tsx && echo "TEMPLATEFORM_OK"
grep -n "ticket_id\|ticket_url\|response_body\|expected_close_date" src/components/admin/TemplateForm.tsx && echo "VARIABLE_HINTS_OK"
grep -n "insertAtCursor\|selectionStart" src/components/admin/TemplateForm.tsx && echo "INSERT_AT_CURSOR_OK"
grep -n "export.*ApiKeyModal\|ApiKeyModal" src/components/admin/ApiKeyModal.tsx && echo "APIKEY_MODAL_OK"
grep -n "onInteractOutside.*preventDefault\|onEscapeKeyDown.*preventDefault" src/components/admin/ApiKeyModal.tsx && echo "MODAL_NODISMISS_OK"
grep -n "navigator.clipboard\|writeText" src/components/admin/ApiKeyModal.tsx && echo "CLIPBOARD_OK"
grep -n "SYSTEM_TEMPLATE\|slug.*null\|slug !== null" src/components/admin/TemplateForm.tsx src/app/admin/templates/page.tsx && echo "SYSPROTECT_OK"
npx playwright test e2e/admin-templates.spec.ts e2e/admin-clients.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `/admin/templates` list shows system template badge and disables/hides delete button for `slug !== null` entries
- `TemplateForm` shows variable hint panel with all 11 supported `{{...}}` tokens as clickable chips that insert at cursor position
- `ApiKeyModal` cannot be dismissed by clicking outside or pressing Escape (only exit is confirm button)
- `ApiKeyModal` copy-to-clipboard announces "Copied!" to screen readers via `aria-live="polite"`
- `/admin/clients` list shows `apiKeyHint` (never full key); Revoke uses AlertDialog confirmation
- After client creation, `ApiKeyModal` is shown with the full plain key from POST response; dismissed only via confirm
- All Playwright tests in `admin-templates.spec.ts` and `admin-clients.spec.ts` pass (0 failing, 0 skipped)
- Tests cover: list rendering, CRUD flows, system template protection, variable hint insertion, key modal no-dismiss behavior, copy-to-clipboard, revoke/regenerate, mobile 375px layout
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/frontend

# TypeScript strict mode passes for all new files
npx tsc --noEmit 2>&1 | grep -E "admin/people|admin/templates|admin/clients|PersonForm|ContactMethod|TemplateForm|ClientForm|ApiKeyModal" | head -30 && echo "TS_CLEAN"

# All component exports exist
grep -n "export.*PersonForm" src/components/admin/PersonForm.tsx && echo "PERSONFORM OK"
grep -n "export.*ContactMethodsPanel" src/components/admin/ContactMethodsPanel.tsx && echo "CM_PANEL OK"
grep -n "export.*TemplateForm" src/components/admin/TemplateForm.tsx && echo "TEMPLATEFORM OK"
grep -n "export.*ClientForm" src/components/admin/ClientForm.tsx && echo "CLIENTFORM OK"
grep -n "export.*ApiKeyModal" src/components/admin/ApiKeyModal.tsx && echo "APIKEY_MODAL OK"

# Critical behavioral checks
grep -n "ticket_id\|ticket_url\|response_body" src/components/admin/TemplateForm.tsx && echo "TEMPLATE_VARS OK"
grep -n "onInteractOutside.*preventDefault" src/components/admin/ApiKeyModal.tsx && echo "MODAL_LOCKED OK"
grep -n "DUPLICATE_EMAIL" src/components/admin/ContactMethodsPanel.tsx && echo "EMAIL_UNIQUE OK"
grep -n "slug.*null\|system.*template\|SYSTEM_TEMPLATE" src/app/admin/templates/page.tsx && echo "SYS_PROTECT OK"
grep -n "Can configure\|Can manage.*departments\|submit and track" src/components/admin/PersonForm.tsx && echo "ROLE_LABELS OK"

# E2e tests exist
ls e2e/admin-people.spec.ts e2e/admin-templates.spec.ts e2e/admin-clients.spec.ts && echo "E2E_FILES OK"

# All 3 e2e test suites pass
npx playwright test e2e/admin-people.spec.ts e2e/admin-templates.spec.ts e2e/admin-clients.spec.ts --reporter=list 2>&1 | tail -40 && echo "ALL_PLAYWRIGHT_PASSED"
```
</verification>

<success_criteria>
- `/admin/people`, `/admin/templates`, and `/admin/clients` routes exist and render correctly
- People list: searchable by name/email, filterable by role/department/active; mobile renders as cards at 375px
- PersonForm: role selector shows human-readable descriptions exactly matching UX-Mockup (PER-04 JRN-04.2 requirement)
- ContactMethodsPanel: enforces email uniqueness, isPrimary promotion demotes existing primary with user notice
- TemplateForm: variable hint panel with all 11 supported tokens as clickable insert-at-cursor chips; system template protection note shown when slug != null
- ApiKeyModal: ONLY exit is confirm button (no X, no outside click, no Escape key); copy-to-clipboard with accessible live announcement
- Clients list shows `apiKeyHint` only (never full key); revoke uses AlertDialog; regenerate triggers ApiKeyModal
- Zero TypeScript strict mode errors on all new files
- All 3 Playwright test suites pass (0 failing, 0 skipped) covering all behavioral tests listed in tasks
- axe-core WCAG 2.1 AA: 0 critical violations on all three admin routes (verified via playwright-axe in e2e tests)
- All screens functional and no horizontal scroll at 375px viewport
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/14-SUMMARY.md` with:
- What was built (components, routes, test coverage)
- Key decisions (component patterns reused from Wave 3b-1, ApiKeyModal lock mechanism)
- Integration contracts fulfilled (Plan 06 API endpoints consumed)
- Any deviations from the plan
</output>
