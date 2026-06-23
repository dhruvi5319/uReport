---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 13
type: execute
wave: 3
depends_on: [2]
files_modified:
  - frontend/src/app/admin/layout.tsx
  - frontend/src/app/admin/page.tsx
  - frontend/src/components/admin/AdminNav.tsx
  - frontend/src/app/admin/departments/page.tsx
  - frontend/src/app/admin/departments/[id]/page.tsx
  - frontend/src/components/admin/DepartmentForm.tsx
  - frontend/src/app/admin/categories/page.tsx
  - frontend/src/app/admin/categories/[id]/page.tsx
  - frontend/src/components/admin/CategoryForm.tsx
  - frontend/src/components/admin/CustomFieldBuilder.tsx
  - frontend/src/app/admin/substatuses/page.tsx
  - frontend/src/app/admin/substatuses/[id]/page.tsx
  - frontend/src/components/admin/SubstatusForm.tsx
  - frontend/src/lib/api/admin.ts
  - e2e/admin-depts-cats-substatus.spec.ts
autonomous: true

features:
  implements: ["F2", "F17", "F15"]
  depends_on: ["F16"]
  enables: ["F15"]

must_haves:
  truths:
    - "Admin sees a left-nav sidebar with all six admin sections; non-admin roles see Access Denied"
    - "Admin can list, create, edit, and deactivate departments; deactivation modal warns about active tickets"
    - "Admin can list, create, edit (multi-step form), and deactivate categories with SLA / permissions / custom fields / group assignment"
    - "Admin can list, create, edit, and deactivate substatuses; isDefault badge shown; drag-order preserved per primaryStatus group"
    - "All forms show inline field-level errors from API (422 responses mapped to fields)"
    - "All screens are WCAG 2.1 AA compliant and fully usable at 375px–1920px"
  artifacts:
    - path: "frontend/src/app/admin/layout.tsx"
      provides: "Admin shell layout with AdminNav sidebar + role guard"
      exports: ["AdminLayout"]
    - path: "frontend/src/components/admin/AdminNav.tsx"
      provides: "Left-nav sidebar with Departments/Categories/People/Substatuses/Templates/Clients/Settings links"
      exports: ["AdminNav"]
    - path: "frontend/src/app/admin/departments/page.tsx"
      provides: "/admin/departments list page with table, new button, deactivation flow"
      exports: ["DepartmentsPage"]
    - path: "frontend/src/components/admin/DepartmentForm.tsx"
      provides: "Create/edit department form with inline validation"
      exports: ["DepartmentForm"]
    - path: "frontend/src/app/admin/categories/page.tsx"
      provides: "/admin/categories list page with search + department filter"
      exports: ["CategoriesPage"]
    - path: "frontend/src/components/admin/CategoryForm.tsx"
      provides: "Multi-step create/edit category form (Basic Info → Permissions → Custom Fields)"
      exports: ["CategoryForm"]
    - path: "frontend/src/components/admin/CustomFieldBuilder.tsx"
      provides: "Dynamic add/remove custom field rows with type-conditional options list"
      exports: ["CustomFieldBuilder"]
    - path: "frontend/src/app/admin/substatuses/page.tsx"
      provides: "/admin/substatuses page grouped by primaryStatus; isDefault badge; create/edit"
      exports: ["SubstatusesPage"]
    - path: "frontend/src/lib/api/admin.ts"
      provides: "Typed API client functions for departments, categories, category-groups, substatuses"
      exports: ["getDepartments", "createDepartment", "updateDepartment", "deleteDepartment",
                "getCategories", "createCategory", "updateCategory", "deleteCategory",
                "getCategoryGroups",
                "getSubstatuses", "createSubstatus", "updateSubstatus", "deleteSubstatus"]
  key_links:
    - from: "frontend/src/app/admin/layout.tsx"
      to: "frontend/src/components/admin/AdminNav.tsx"
      via: "import AdminNav"
      pattern: "AdminNav"
    - from: "frontend/src/app/admin/departments/page.tsx"
      to: "frontend/src/lib/api/admin.ts"
      via: "getDepartments / deleteDepartment"
      pattern: "getDepartments|deleteDepartment"
    - from: "frontend/src/components/admin/CategoryForm.tsx"
      to: "frontend/src/lib/api/admin.ts"
      via: "createCategory / updateCategory / getCategoryGroups"
      pattern: "createCategory|updateCategory|getCategoryGroups"

integration_contracts:
  requires:
    - from_plan: "05"
      artifact: "crm/src/Controllers/Api/DepartmentController.php"
      exports: ["GET /api/departments", "POST /api/departments", "PUT /api/departments/{id}", "DELETE /api/departments/{id}"]
      verify: "grep -n 'class DepartmentController' crm/src/Controllers/Api/DepartmentController.php && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "crm/src/Controllers/Api/CategoryController.php"
      exports: ["GET /api/categories", "POST /api/categories", "PUT /api/categories/{id}", "DELETE /api/categories/{id}"]
      verify: "grep -n 'class CategoryController' crm/src/Controllers/Api/CategoryController.php && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "crm/src/Controllers/Api/CategoryGroupController.php"
      exports: ["GET /api/category-groups"]
      verify: "grep -n 'class CategoryGroupController' crm/src/Controllers/Api/CategoryGroupController.php && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "crm/src/Controllers/Api/SubstatusController.php"
      exports: ["GET /api/substatuses", "POST /api/substatuses", "PUT /api/substatuses/{id}", "DELETE /api/substatuses/{id}"]
      verify: "grep -n 'class SubstatusController' crm/src/Controllers/Api/SubstatusController.php && echo CONTRACT_OK"
  provides:
    - artifact: "frontend/src/app/admin/layout.tsx"
      exports: ["AdminLayout — wraps all /admin/* routes; renders AdminNav + role guard"]
      shape: |
        export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element
        Redirects to /login if unauthenticated; renders <AccessDenied> if role !== 'admin'
      verify: "grep -n 'AdminLayout\\|export default' frontend/src/app/admin/layout.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/app/admin/departments/page.tsx"
      exports: ["DepartmentsPage — /admin/departments list with create / edit / deactivate"]
      shape: |
        Rendered route: /admin/departments
        Consumes: GET /api/departments, DELETE /api/departments/{id}
      verify: "grep -n 'DepartmentsPage\\|export default' frontend/src/app/admin/departments/page.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/app/admin/categories/page.tsx"
      exports: ["CategoriesPage — /admin/categories list with search + dept filter + multi-step create/edit"]
      shape: |
        Rendered route: /admin/categories
        Consumes: GET /api/categories, GET /api/category-groups, DELETE /api/categories/{id}
      verify: "grep -n 'CategoriesPage\\|export default' frontend/src/app/admin/categories/page.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/app/admin/substatuses/page.tsx"
      exports: ["SubstatusesPage — /admin/substatuses grouped by open/closed; isDefault badge; CRUD"]
      shape: |
        Rendered route: /admin/substatuses
        Consumes: GET /api/substatuses, POST /api/substatuses, PUT /api/substatuses/{id}, DELETE /api/substatuses/{id}
      verify: "grep -n 'SubstatusesPage\\|export default' frontend/src/app/admin/substatuses/page.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/lib/api/admin.ts"
      exports: ["getDepartments", "createDepartment", "updateDepartment", "deleteDepartment",
                "getCategories", "createCategory", "updateCategory", "deleteCategory",
                "getCategoryGroups", "getSubstatuses", "createSubstatus", "updateSubstatus", "deleteSubstatus"]
      shape: |
        All functions return Promise<ApiResponse<T>> using the { data, meta, errors } envelope.
        Types:
          Department: { id: number; name: string; defaultAssignee: {id:number,name:string}|null; active: boolean; createdAt: string; updatedAt: string }
          Category: { id: number; name: string; departmentId: number; groupId: number|null; slaDays: number|null; displayPermission: 'public'|'staff'|'anonymous'; postingPermission: 'staff'|'public'|'anonymous'; defaultAssigneeId: number|null; autoCloseDays: number|null; active: boolean; fields: CategoryField[]; createdAt: string; updatedAt: string }
          CategoryField: { code: string; label: string; type: 'text'|'select'|'date'|'checkbox'; required: boolean; options?: string[] }
          CategoryGroup: { id: number; name: string; sortOrder: number; active: boolean }
          Substatus: { id: number; label: string; primaryStatus: 'open'|'closed'; isDefault: boolean; active: boolean; sortOrder: number; createdAt: string }
      verify: "grep -n 'getDepartments\\|getCategories\\|getSubstatuses' frontend/src/lib/api/admin.ts && echo CONTRACT_OK"

---

<objective>
Implement all admin configuration screens for Wave 3b (first plan): the admin shell layout/navigation, the departments CRUD page, the categories multi-step CRUD page (with custom field builder and SLA/permissions), and the substatuses CRUD page.

Purpose: Tomás (admin persona) must be able to configure the entire ticket-routing taxonomy (departments → categories → category groups → substatuses) without SSH access or direct DB editing. These are the highest-priority admin screens (F2 P0, F17 P1) that unlock category-aware ticket creation in Wave 3a's ticket form.

Output:
- Admin shell: `layout.tsx` + `AdminNav.tsx` — sidebar nav + role guard applied to all /admin/* routes
- Departments: list page, create/edit form — CRUD + deactivation warning modal (HAS_ACTIVE_TICKETS)
- Categories: list page with search + department filter, multi-step create/edit form, custom field builder
- Substatuses: list page grouped by open/closed, create/edit form with isDefault handling
- Typed API client: `frontend/src/lib/api/admin.ts` — all fetch wrappers for these four entity types
- Playwright e2e: `e2e/admin-depts-cats-substatus.spec.ts` — covers list/create/edit/deactivate flows
</objective>

<feature_dependencies>
Implements: F2: Department & Category Management (departments CRUD UI, categories multi-step CRUD UI with custom field builder + SLA + permissions + group assignment), F17: Substatus Management (substatus CRUD UI with isDefault badge and primaryStatus grouping), F15: SPA Frontend (admin configuration screens, mobile-responsive, WCAG 2.1 AA)
Depends on: F16: RESTful JSON API Backend (Wave 2b Plans 05+06 provide all admin entity REST endpoints consumed here)
Enables: F15 Wave 3b Plan 14 (people, templates, clients admin screens) and Wave 3a ticket create form (category selection depends on categories being populated via this admin UI)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/UX-Mockup-uReport.md
@project_specs/TechArch-uReport.md

# Wave 2b API outputs consumed here:
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/05-PLAN.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/06-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Admin API client + shell layout + departments CRUD page</name>
  <files>
    frontend/src/lib/api/admin.ts
    frontend/src/app/admin/layout.tsx
    frontend/src/app/admin/page.tsx
    frontend/src/components/admin/AdminNav.tsx
    frontend/src/app/admin/departments/page.tsx
    frontend/src/app/admin/departments/[id]/page.tsx
    frontend/src/components/admin/DepartmentForm.tsx
  </files>
  <action>
Build the typed API client, admin shell, and the departments admin page.

---

### Step 1: `frontend/src/lib/api/admin.ts` — Typed API client

All functions call the backend using the project's existing `fetchApi` helper (or equivalent from Wave 3a's API client setup). Return the standard `{ data, meta, errors }` envelope. TypeScript strict mode — no `any`.

```typescript
// Types derived from TechArch §4.2 and Wave 2b Plan 05 integration_contracts

export interface Department {
  id: number;
  name: string;
  defaultAssignee: { id: number; name: string } | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentBody {
  name: string;
  defaultAssigneeId?: number | null;
  active?: boolean;
}

export interface CategoryField {
  code: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  departmentId: number;
  groupId: number | null;
  slaDays: number | null;
  displayPermission: 'public' | 'staff' | 'anonymous';
  postingPermission: 'staff' | 'public' | 'anonymous';
  defaultAssigneeId: number | null;
  autoCloseDays: number | null;
  active: boolean;
  fields: CategoryField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryBody {
  name: string;
  departmentId: number;
  groupId?: number | null;
  slaDays?: number | null;
  displayPermission: 'public' | 'staff' | 'anonymous';
  postingPermission: 'staff' | 'public' | 'anonymous';
  defaultAssigneeId?: number | null;
  autoCloseDays?: number | null;
  active?: boolean;
  fields?: CategoryField[];
}

export interface CategoryGroup {
  id: number;
  name: string;
  sortOrder: number;
  active: boolean;
}

export interface Substatus {
  id: number;
  label: string;
  primaryStatus: 'open' | 'closed';
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateSubstatusBody {
  label: string;
  primaryStatus: 'open' | 'closed';
  isDefault?: boolean;
  active?: boolean;
  sortOrder?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  errors: Array<{ field: string | null; message: string; code?: string }>;
}
```

Implement all fetch functions using `fetchApi` from the project's existing API layer (check for `frontend/src/lib/api/client.ts` or `frontend/src/lib/fetch.ts` from Wave 3a). If the helper does not exist yet, use a plain `fetch` wrapper that appends credentials and the base URL from `process.env.NEXT_PUBLIC_API_URL`.

```typescript
// Example pattern — adapt to whatever base client Wave 3a established:
export async function getDepartments(): Promise<ApiResponse<Department[]>> {
  return fetchApi('/api/departments');
}

export async function createDepartment(body: CreateDepartmentBody): Promise<ApiResponse<Department>> {
  return fetchApi('/api/departments', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateDepartment(id: number, body: Partial<CreateDepartmentBody>): Promise<ApiResponse<Department>> {
  return fetchApi(`/api/departments/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteDepartment(id: number): Promise<ApiResponse<null>> {
  return fetchApi(`/api/departments/${id}`, { method: 'DELETE' });
}

export async function getCategories(params?: { departmentId?: number; q?: string }): Promise<ApiResponse<Category[]>> {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString() : '';
  return fetchApi(`/api/categories${qs}`);
}

export async function getCategory(id: number): Promise<ApiResponse<Category>> {
  return fetchApi(`/api/categories/${id}`);
}

export async function createCategory(body: CreateCategoryBody): Promise<ApiResponse<Category>> {
  return fetchApi('/api/categories', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCategory(id: number, body: Partial<CreateCategoryBody>): Promise<ApiResponse<Category>> {
  return fetchApi(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteCategory(id: number): Promise<ApiResponse<null>> {
  return fetchApi(`/api/categories/${id}`, { method: 'DELETE' });
}

export async function getCategoryGroups(): Promise<ApiResponse<CategoryGroup[]>> {
  return fetchApi('/api/category-groups');
}

export async function getSubstatuses(primaryStatus?: 'open' | 'closed'): Promise<ApiResponse<Substatus[]>> {
  const qs = primaryStatus ? `?primaryStatus=${primaryStatus}` : '';
  return fetchApi(`/api/substatuses${qs}`);
}

export async function createSubstatus(body: CreateSubstatusBody): Promise<ApiResponse<Substatus>> {
  return fetchApi('/api/substatuses', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateSubstatus(id: number, body: Partial<CreateSubstatusBody>): Promise<ApiResponse<Substatus>> {
  return fetchApi(`/api/substatuses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteSubstatus(id: number): Promise<ApiResponse<null>> {
  return fetchApi(`/api/substatuses/${id}`, { method: 'DELETE' });
}
```

---

### Step 2: `frontend/src/app/admin/layout.tsx` — Admin shell layout

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session'; // or project's auth helper from Wave 3a
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8" role="main">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access admin settings.</p>
          <a href="/tickets" className="text-blue-600 underline hover:text-blue-800">
            Go to Tickets
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNav />
      <main className="flex-1 p-6 lg:p-8" id="main-content">
        {children}
      </main>
    </div>
  );
}
```

**NOTE:** Use the project's actual `getServerSession()` / auth helper established in Wave 3a. If it returns a different shape, adapt accordingly. The key check is `role !== 'admin'`.

---

### Step 3: `frontend/src/components/admin/AdminNav.tsx` — Left sidebar navigation

Build using shadcn/ui `Button` or plain links. Active route highlighted using `usePathname()` (client component). Items per UX-Mockup Screen-08:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // shadcn/ui utility

const NAV_ITEMS = [
  { href: '/admin/departments',  label: 'Departments' },
  { href: '/admin/categories',   label: 'Categories' },
  { href: '/admin/people',       label: 'People & Users' },
  { href: '/admin/substatuses',  label: 'Substatuses' },
  { href: '/admin/templates',    label: 'Templates' },
  { href: '/admin/clients',      label: 'API Clients' },
  { href: '/admin/settings',     label: 'Settings' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="w-56 shrink-0 bg-white border-r border-gray-200 min-h-screen p-4"
      aria-label="Admin navigation"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
        ADMIN
      </h2>
      <ul className="space-y-1" role="list">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

On mobile (< 768px): hide the sidebar and show a top horizontal nav or hamburger menu. Implement with Tailwind responsive classes: `hidden md:block` on the nav, with a mobile toggle if needed. Minimum: at 375px, provide a top bar with "Admin" label and a dropdown/menu icon that reveals nav links.

---

### Step 4: `frontend/src/app/admin/page.tsx` — /admin root redirect

```typescript
import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/departments');
}
```

---

### Step 5: `frontend/src/app/admin/departments/page.tsx` — Departments list

Implement per UX-Mockup Screen-08 `/admin/departments` spec:
- Table with columns: Name | Default Assignee | Open Ticket Count | Active | Actions
- `[+ New Department]` button → navigates to `/admin/departments/new`
- Edit button → `/admin/departments/{id}`
- Deactivate button (kebab `⋮` menu) → calls `deleteDepartment(id)`
  - If API returns **409 with `HAS_ACTIVE_TICKETS`**: open a shadcn/ui `AlertDialog` modal:
    - Title: "Deactivate Department?"
    - Body: "This department has N active tickets. Deactivating it will remove it from ticket routing and the Open311 services list. Existing tickets will not be affected."
    - Input: text field requiring user to type the department name to confirm
    - Buttons: "Cancel" | "Deactivate" (destructive variant, disabled until name typed correctly)
    - On confirm: call `deleteDepartment(id)` with a `?force=1` query param (or the API's confirmation mechanism from Plan 05)
  - Success: toast "Department deactivated" + refresh list
- Inactive departments show "Reactivate" action (PUT with `{ active: true }`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDepartments, deleteDepartment, updateDepartment, type Department } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivateTarget, setDeactivateTarget] = useState<Department | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const res = await getDepartments();
    setDepartments(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeactivate = async (dept: Department) => {
    const res = await deleteDepartment(dept.id);
    if (res.errors?.some((e) => e.code === 'HAS_ACTIVE_TICKETS')) {
      setDeactivateTarget(dept);
      setConfirmName('');
    } else {
      toast({ title: 'Department deactivated' });
      load();
    }
  };

  const handleConfirmedDeactivate = async () => {
    if (!deactivateTarget) return;
    // Re-call with force; adapt to API's actual mechanism (e.g., ?confirmed=1 or separate endpoint)
    await deleteDepartment(deactivateTarget.id);
    toast({ title: 'Department deactivated' });
    setDeactivateTarget(null);
    load();
  };

  const handleReactivate = async (id: number) => {
    await updateDepartment(id, { active: true });
    toast({ title: 'Department reactivated' });
    load();
  };

  if (loading) return <div aria-busy="true" className="p-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
        <Link href="/admin/departments/new">
          <Button>+ New Department</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200" aria-label="Departments list">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Default Assignee</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Active</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{dept.defaultAssignee?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={dept.active ? 'default' : 'secondary'}>
                    {dept.active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link href={`/admin/departments/${dept.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  {dept.active ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeactivate(dept)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleReactivate(dept.id)}>
                      Reactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deactivation confirmation dialog */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This department has active tickets. Deactivating it will remove it from ticket routing
              and the Open311 services list. Existing tickets will not be affected.
              <br /><br />
              Type <strong>{deactivateTarget?.name}</strong> to confirm:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm mt-2"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            aria-label="Type department name to confirm deactivation"
            placeholder={deactivateTarget?.name ?? ''}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmName !== deactivateTarget?.name}
              onClick={handleConfirmedDeactivate}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---

### Step 6: `frontend/src/components/admin/DepartmentForm.tsx` — Create/edit form

Form with fields: `name` (required), `defaultAssigneeId` (optional — person search, staff/admin only), `active` toggle. Renders inline errors from API 422 response mapped to field names. On success, redirect to `/admin/departments`.

Use `react-hook-form` + shadcn/ui `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`, `Input`, `Switch` components. Submit calls `createDepartment` or `updateDepartment` depending on whether an `id` prop is passed.

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createDepartment, updateDepartment, type Department, type CreateDepartmentBody } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

interface DepartmentFormProps {
  initialData?: Department;
}

export function DepartmentForm({ initialData }: DepartmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CreateDepartmentBody>({
    defaultValues: {
      name: initialData?.name ?? '',
      active: initialData?.active ?? true,
    },
  });

  const onSubmit = async (data: CreateDepartmentBody) => {
    const res = initialData
      ? await updateDepartment(initialData.id, data)
      : await createDepartment(data);

    if (res.errors?.length) {
      res.errors.forEach((err) => {
        if (err.field) {
          setError(err.field as keyof CreateDepartmentBody, { message: err.message });
        }
      });
      return;
    }

    toast({ title: initialData ? 'Department updated' : 'Department created' });
    router.push('/admin/departments');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md" noValidate>
      <div>
        <Label htmlFor="name">Name <span aria-hidden="true">*</span></Label>
        <Input
          id="name"
          {...register('name', { required: 'Name is required' })}
          aria-required="true"
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch id="active" {...register('active')} defaultChecked={initialData?.active ?? true} />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : (initialData ? 'Save Changes' : 'Create Department')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### Step 7: `frontend/src/app/admin/departments/[id]/page.tsx`

Load department by ID, render `<DepartmentForm initialData={dept} />`. Also handle `id === 'new'` to render empty form.

```typescript
import { getCategory } from '@/lib/api/admin'; // use appropriate getter
import { DepartmentForm } from '@/components/admin/DepartmentForm';

// For /admin/departments/new → render empty DepartmentForm
// For /admin/departments/{id} → fetch and render with initialData
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend
npx tsc --noEmit 2>&1 | grep -c "error TS" | xargs -I{} sh -c 'if [ {} -eq 0 ]; then echo "TS OK"; else echo "TS ERRORS: {}"; fi'
grep -n "getDepartments\|getCategories\|getSubstatuses" src/lib/api/admin.ts && echo "API CLIENT OK"
grep -n "AdminNav\|AdminLayout\|export default" src/app/admin/layout.tsx && echo "LAYOUT OK"
grep -n "HAS_ACTIVE_TICKETS\|deactivateTarget" src/app/admin/departments/page.tsx && echo "DEACTIVATE_MODAL OK"
grep -n "DepartmentForm" src/components/admin/DepartmentForm.tsx && echo "DEPT_FORM OK"
```
  </verify>
  <done>
- `frontend/src/lib/api/admin.ts` exports all typed functions: getDepartments, createDepartment, updateDepartment, deleteDepartment, getCategories, getCategory, createCategory, updateCategory, deleteCategory, getCategoryGroups, getSubstatuses, createSubstatus, updateSubstatus, deleteSubstatus
- `frontend/src/app/admin/layout.tsx` redirects unauthenticated users to /login; renders "Access Denied" for non-admin roles; renders `<AdminNav>` sidebar for admin
- `frontend/src/components/admin/AdminNav.tsx` lists all 7 nav items; active route highlighted via `aria-current="page"`; visible on md+ as sidebar, accessible on 375px via responsive classes
- `frontend/src/app/admin/departments/page.tsx` renders department table; deactivation with HAS_ACTIVE_TICKETS opens confirmation modal requiring name-match input before confirming
- `frontend/src/components/admin/DepartmentForm.tsx` maps API 422 errors to fields; shows inline error messages; submits correctly for create and edit
- TypeScript compiles with 0 errors on these files
  </done>
</task>

<task type="auto">
  <name>Task 2: Categories multi-step form + Substatuses page + Playwright e2e</name>
  <files>
    frontend/src/app/admin/categories/page.tsx
    frontend/src/app/admin/categories/[id]/page.tsx
    frontend/src/components/admin/CategoryForm.tsx
    frontend/src/components/admin/CustomFieldBuilder.tsx
    frontend/src/app/admin/substatuses/page.tsx
    frontend/src/app/admin/substatuses/[id]/page.tsx
    frontend/src/components/admin/SubstatusForm.tsx
    e2e/admin-depts-cats-substatus.spec.ts
  </files>
  <action>

### Step 1: `frontend/src/components/admin/CustomFieldBuilder.tsx`

Reusable component for building the `fields[]` array in the category form. Renders one row per field with controls for `code`, `label`, `type`, `required`, and conditional `options` list (only when `type === 'select'`). Matches UX-Mockup Screen-08 Step 3 custom fields design.

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { CategoryField } from '@/lib/api/admin';

interface CustomFieldBuilderProps {
  fields: CategoryField[];
  onChange: (fields: CategoryField[]) => void;
  errors?: Record<string, string>; // keyed by "fields[i].fieldName"
}

const EMPTY_FIELD: CategoryField = { code: '', label: '', type: 'text', required: false };

export function CustomFieldBuilder({ fields, onChange, errors = {} }: CustomFieldBuilderProps) {
  const addField = () => onChange([...fields, { ...EMPTY_FIELD }]);

  const updateField = (index: number, patch: Partial<CategoryField>) => {
    const next = fields.map((f, i) => i === index ? { ...f, ...patch } : f);
    onChange(next);
  };

  const removeField = (index: number) => onChange(fields.filter((_, i) => i !== index));

  const addOption = (index: number) => {
    const current = fields[index].options ?? [];
    updateField(index, { options: [...current, ''] });
  };

  const updateOption = (fieldIdx: number, optIdx: number, value: string) => {
    const opts = [...(fields[fieldIdx].options ?? [])];
    opts[optIdx] = value;
    updateField(fieldIdx, { options: opts });
  };

  const removeOption = (fieldIdx: number, optIdx: number) => {
    const opts = (fields[fieldIdx].options ?? []).filter((_, i) => i !== optIdx);
    updateField(fieldIdx, { options: opts });
  };

  return (
    <section aria-label="Custom fields">
      {fields.map((field, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-3 space-y-3"
          aria-label={`Custom field ${idx + 1}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`field-code-${idx}`}>Code</Label>
              <Input
                id={`field-code-${idx}`}
                value={field.code}
                onChange={(e) => updateField(idx, { code: e.target.value })}
                placeholder="e.g. severity"
                pattern="[a-z0-9_]+"
                aria-describedby={errors[`fields[${idx}].code`] ? `field-code-err-${idx}` : undefined}
              />
              {errors[`fields[${idx}].code`] && (
                <p id={`field-code-err-${idx}`} role="alert" className="text-xs text-red-600 mt-1">
                  {errors[`fields[${idx}].code`]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor={`field-label-${idx}`}>Label</Label>
              <Input
                id={`field-label-${idx}`}
                value={field.label}
                onChange={(e) => updateField(idx, { label: e.target.value })}
                placeholder="e.g. Severity"
              />
            </div>
            <div>
              <Label htmlFor={`field-type-${idx}`}>Type</Label>
              <Select
                value={field.type}
                onValueChange={(v) => updateField(idx, { type: v as CategoryField['type'], options: v === 'select' ? [''] : undefined })}
              >
                <SelectTrigger id={`field-type-${idx}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id={`field-required-${idx}`}
              checked={field.required}
              onCheckedChange={(v) => updateField(idx, { required: v })}
            />
            <Label htmlFor={`field-required-${idx}`}>Required</Label>
          </div>

          {field.type === 'select' && (
            <div>
              <Label>Options</Label>
              {(field.options ?? []).map((opt, optIdx) => (
                <div key={optIdx} className="flex gap-2 mt-1">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    aria-label={`Option ${optIdx + 1} for field ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(idx, optIdx)}
                    aria-label={`Remove option ${optIdx + 1}`}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              {errors[`fields[${idx}].options`] && (
                <p role="alert" className="text-xs text-red-600 mt-1">
                  {errors[`fields[${idx}].options`]}
                </p>
              )}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addOption(idx)}>
                + Add option
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => removeField(idx)}
            aria-label={`Remove field ${idx + 1}`}
          >
            ✕ Remove field
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addField}>
        + Add field
      </Button>
    </section>
  );
}
```

---

### Step 2: `frontend/src/components/admin/CategoryForm.tsx` — Multi-step form

Three steps per UX-Mockup Screen-08:
- **Step 1 — Basic Info:** `name` (required), `departmentId` (required, select from GET /api/departments), `groupId` (optional select from getCategoryGroups), `slaDays` (optional number, 0 = no SLA)
- **Step 2 — Permissions:** `displayPermission` (radio: public/staff/anonymous), `postingPermission` (radio: staff/public/anonymous), `defaultAssigneeId` (optional person search — use a plain text input for person ID until Wave 3b Plan 14 adds the people picker), `autoCloseDays` (optional, 0 = disabled)
- **Step 3 — Custom Fields:** `<CustomFieldBuilder>` component

Use local `useState` to manage step (1–3) and accumulated form data. On final step submit, call `createCategory` or `updateCategory`. Map 422 errors back to steps — if field errors exist for Step 1 fields (`name`, `departmentId`), surface them at the top of the current step with a summary.

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCategory, updateCategory, getDepartments, getCategoryGroups,
  type Category, type CreateCategoryBody, type Department, type CategoryGroup, type CategoryField
} from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CustomFieldBuilder } from '@/components/admin/CustomFieldBuilder';
import { useToast } from '@/components/ui/use-toast';

interface Props { initialData?: Category }

type FormData = Omit<CreateCategoryBody, 'fields'> & { fields: CategoryField[] };

export function CategoryForm({ initialData }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<FormData>({
    name: initialData?.name ?? '',
    departmentId: initialData?.departmentId ?? 0,
    groupId: initialData?.groupId ?? null,
    slaDays: initialData?.slaDays ?? null,
    displayPermission: initialData?.displayPermission ?? 'public',
    postingPermission: initialData?.postingPermission ?? 'public',
    defaultAssigneeId: initialData?.defaultAssigneeId ?? null,
    autoCloseDays: initialData?.autoCloseDays ?? null,
    active: initialData?.active ?? true,
    fields: initialData?.fields ?? [],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDepartments().then((r) => setDepartments((r.data ?? []).filter((d) => d.active)));
    getCategoryGroups().then((r) => setGroups((r.data ?? []).filter((g) => g.active)));
  }, []);

  const update = (patch: Partial<FormData>) => setData((prev) => ({ ...prev, ...patch }));

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = 'Name is required';
    if (!data.departmentId) e.departmentId = 'Department is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.displayPermission) e.displayPermission = 'Display permission is required';
    if (!data.postingPermission) e.postingPermission = 'Posting permission is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const body: CreateCategoryBody = { ...data };
    const res = initialData
      ? await updateCategory(initialData.id, body)
      : await createCategory(body);

    if (res.errors?.length) {
      const mapped: Record<string, string> = {};
      res.errors.forEach((err) => {
        if (err.field) mapped[err.field] = err.message;
      });
      setErrors(mapped);
      // If step 1 field has error, go back to step 1
      if (mapped.name || mapped.departmentId) setStep(1);
      else if (mapped.displayPermission || mapped.postingPermission) setStep(2);
      setSubmitting(false);
      return;
    }

    toast({ title: initialData ? 'Category updated' : 'Category created' });
    router.push('/admin/categories');
  };

  const stepLabels = ['Basic Info', 'Permissions', 'Custom Fields'];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl" noValidate>
      {/* Step indicator */}
      <nav aria-label="Form steps" className="mb-6">
        <ol className="flex gap-2">
          {stepLabels.map((label, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i + 1 === step ? 'bg-blue-600 text-white' : i + 1 < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
                aria-current={i + 1 === step ? 'step' : undefined}
              >
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 hidden sm:inline">{label}</span>
              {i < stepLabels.length - 1 && <span className="text-gray-300 mx-1">→</span>}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step 1 */}
      {step === 1 && (
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium mb-4">Basic Info</legend>
          <div>
            <Label htmlFor="cat-name">Name <span aria-hidden="true">*</span></Label>
            <Input id="cat-name" value={data.name} onChange={(e) => update({ name: e.target.value })}
              aria-required="true" aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'cat-name-err' : undefined} />
            {errors.name && <p id="cat-name-err" role="alert" className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="cat-dept">Department <span aria-hidden="true">*</span></Label>
            <Select
              value={data.departmentId ? String(data.departmentId) : ''}
              onValueChange={(v) => update({ departmentId: Number(v) })}
            >
              <SelectTrigger id="cat-dept" aria-required="true" aria-invalid={!!errors.departmentId}>
                <SelectValue placeholder="Select department…" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && <p role="alert" className="text-sm text-red-600 mt-1">{errors.departmentId}</p>}
          </div>
          <div>
            <Label htmlFor="cat-group">Group (optional)</Label>
            <Select
              value={data.groupId ? String(data.groupId) : ''}
              onValueChange={(v) => update({ groupId: v ? Number(v) : null })}
            >
              <SelectTrigger id="cat-group"><SelectValue placeholder="No group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No group</SelectItem>
                {groups.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cat-sla">SLA Days (0 = no SLA)</Label>
            <Input id="cat-sla" type="number" min="0"
              value={data.slaDays ?? ''}
              onChange={(e) => update({ slaDays: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>
        </fieldset>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium mb-4">Permissions</legend>
          <div>
            <Label>Display permission <span aria-hidden="true">*</span></Label>
            <RadioGroup
              value={data.displayPermission}
              onValueChange={(v) => update({ displayPermission: v as typeof data.displayPermission })}
              className="flex flex-col gap-2 mt-2"
            >
              {['public', 'staff', 'anonymous'].map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <RadioGroupItem value={p} id={`disp-${p}`} />
                  <Label htmlFor={`disp-${p}`} className="capitalize">{p}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.displayPermission && <p role="alert" className="text-sm text-red-600 mt-1">{errors.displayPermission}</p>}
          </div>
          <div>
            <Label>Posting permission <span aria-hidden="true">*</span></Label>
            <RadioGroup
              value={data.postingPermission}
              onValueChange={(v) => update({ postingPermission: v as typeof data.postingPermission })}
              className="flex flex-col gap-2 mt-2"
            >
              {['staff', 'public', 'anonymous'].map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <RadioGroupItem value={p} id={`post-${p}`} />
                  <Label htmlFor={`post-${p}`} className="capitalize">{p}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.postingPermission && <p role="alert" className="text-sm text-red-600 mt-1">{errors.postingPermission}</p>}
          </div>
          <div>
            <Label htmlFor="cat-autoclose">Auto-close after N days (0 = disabled)</Label>
            <Input id="cat-autoclose" type="number" min="0"
              value={data.autoCloseDays ?? ''}
              onChange={(e) => update({ autoCloseDays: e.target.value === '' ? null : Number(e.target.value) })} />
          </div>
        </fieldset>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <fieldset>
          <legend className="text-lg font-medium mb-4">Custom Fields (optional)</legend>
          <CustomFieldBuilder
            fields={data.fields}
            onChange={(fields) => update({ fields })}
            errors={errors}
          />
          {Object.entries(errors).filter(([k]) => k.startsWith('fields')).map(([k, v]) => (
            <p key={k} role="alert" className="text-sm text-red-600 mt-1">{v}</p>
          ))}
        </fieldset>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            ← Back
          </Button>
        )}
        {step < 3 && (
          <Button type="button" onClick={handleNext}>
            Next →
          </Button>
        )}
        {step === 3 && (
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : (initialData ? 'Save Changes' : 'Create Category')}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

---

### Step 3: `frontend/src/app/admin/categories/page.tsx`

List page with columns: Name | Department | SLA | Display | Posting | Active | Actions. Top row: search input + department filter dropdown + `[+ New Category]` button. Client-side search filters the loaded list by name; `departmentId` filter calls `getCategories({ departmentId })`.

Deactivate calls `deleteCategory(id)` → 204 on success → toast + refresh. No confirmation modal needed for category deactivation (no active-tickets guard in the API for categories).

---

### Step 4: `frontend/src/app/admin/categories/[id]/page.tsx`

Load category by ID for `/admin/categories/{id}`. For `/admin/categories/new`, render empty `<CategoryForm />`. For existing ID, fetch category and render `<CategoryForm initialData={category} />`.

---

### Step 5: `frontend/src/components/admin/SubstatusForm.tsx` + pages

`SubstatusForm` has fields: `label` (required), `primaryStatus` (radio: open/closed), `isDefault` (toggle — note: only one can be default per primaryStatus; UI warns but API enforces the clearing), `active` (toggle), `sortOrder` (number).

`frontend/src/app/admin/substatuses/page.tsx`: Lists substatuses grouped into two sections: "Open statuses" and "Closed statuses". Each item shows the `label`, a `Default` badge if `isDefault`, an Active/Inactive badge, and Edit/Deactivate actions. `[+ New Substatus]` button navigates to `/admin/substatuses/new`.

`frontend/src/app/admin/substatuses/[id]/page.tsx`: Create or edit form.

```typescript
// SubstatusForm.tsx key points:
// - 'label' + 'primaryStatus' are required on create
// - isDefault Switch: when toggled on, show a note "Setting this as default will
//   clear the current default for {primaryStatus} statuses"
// - map API 422 DUPLICATE_NAME → inline error on label field
```

---

### Step 6: `e2e/admin-depts-cats-substatus.spec.ts` — Playwright tests

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth'; // shared helper from Wave 3a

test.describe('Admin: Departments', () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test('lists departments and shows create button', async ({ page }) => {
    await page.goto('/admin/departments');
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
    await expect(page.getByRole('link', { name: '+ New Department' })).toBeVisible();
    // Table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Active' })).toBeVisible();
  });

  test('creates a new department', async ({ page }) => {
    await page.goto('/admin/departments/new');
    await page.getByLabel('Name').fill('Test Department E2E');
    await page.getByRole('button', { name: 'Create Department' }).click();
    await expect(page.getByText('Department created')).toBeVisible(); // toast
    await expect(page).toHaveURL('/admin/departments');
  });

  test('shows validation error for empty name', async ({ page }) => {
    await page.goto('/admin/departments/new');
    await page.getByRole('button', { name: 'Create Department' }).click();
    await expect(page.getByRole('alert')).toContainText('required');
  });

  test('non-admin user sees Access Denied', async ({ page }) => {
    // Log in as staff (use a staff login helper)
    await page.goto('/admin/departments');
    await expect(page.getByText('Access Denied')).toBeVisible();
  });
});

test.describe('Admin: Categories', () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test('lists categories with search and department filter', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.getByRole('link', { name: '+ New Category' })).toBeVisible();
  });

  test('navigates multi-step category create form', async ({ page }) => {
    await page.goto('/admin/categories/new');
    // Step 1
    await expect(page.getByText('Basic Info')).toBeVisible();
    await page.getByLabel('Name').fill('E2E Test Category');
    // Select first department
    await page.getByRole('combobox', { name: /department/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Next' }).click();
    // Step 2
    await expect(page.getByText('Permissions')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    // Step 3
    await expect(page.getByText('Custom Fields')).toBeVisible();
    await page.getByRole('button', { name: 'Create Category' }).click();
    await expect(page.getByText('Category created')).toBeVisible();
  });

  test('custom field builder adds select field with options', async ({ page }) => {
    await page.goto('/admin/categories/new');
    await page.getByLabel('Name').fill('Custom Field Test');
    await page.getByRole('combobox', { name: /department/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Next' }).click(); // step 2
    await page.getByRole('button', { name: 'Next' }).click(); // step 3
    await page.getByRole('button', { name: '+ Add field' }).click();
    await page.getByLabel('Type').last().click();
    await page.getByRole('option', { name: 'Select' }).click();
    await expect(page.getByRole('button', { name: '+ Add option' })).toBeVisible();
  });
});

test.describe('Admin: Substatuses', () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test('lists substatuses grouped by primary status', async ({ page }) => {
    await page.goto('/admin/substatuses');
    await expect(page.getByRole('heading', { name: 'Substatuses' })).toBeVisible();
    // Should show Open and Closed sections
    await expect(page.getByText(/open statuses/i)).toBeVisible();
    await expect(page.getByText(/closed statuses/i)).toBeVisible();
  });

  test('creates a new substatus', async ({ page }) => {
    await page.goto('/admin/substatuses/new');
    await page.getByLabel('Label').fill('E2E Test Substatus');
    await page.getByRole('radio', { name: 'open' }).click();
    await page.getByRole('button', { name: 'Create Substatus' }).click();
    await expect(page.getByText('Substatus created')).toBeVisible();
  });
});
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend && npx tsc --noEmit 2>&1 | grep -c "error TS" | xargs -I{} sh -c 'if [ {} -eq 0 ]; then echo "TS OK"; else echo "TS ERRORS: {}"; fi'
grep -n "CustomFieldBuilder" src/components/admin/CustomFieldBuilder.tsx && echo "CUSTOM_FIELD_BUILDER OK"
grep -n "CategoryForm\|handleNext\|step" src/components/admin/CategoryForm.tsx && echo "MULTI_STEP_FORM OK"
grep -n "SubstatusForm\|isDefault" src/components/admin/SubstatusForm.tsx && echo "SUBSTATUS_FORM OK"
grep -n "primaryStatus\|Open statuses\|Closed statuses" src/app/admin/substatuses/page.tsx && echo "SUBSTATUS_GROUPED OK"
test -f e2e/admin-depts-cats-substatus.spec.ts && echo "E2E FILE OK"
npx playwright test e2e/admin-depts-cats-substatus.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `CustomFieldBuilder.tsx` renders add/remove field rows; `type=select` shows options list; ARIA labels on all inputs; validates `code` pattern client-side
- `CategoryForm.tsx` three-step form: step indicator updates, back/next navigation preserves state, API 422 errors mapped to correct step, CustomFieldBuilder integrated in step 3
- `SubstatusForm.tsx` form with label, primaryStatus radio, isDefault toggle, active toggle
- `frontend/src/app/admin/substatuses/page.tsx` groups substatuses into "Open statuses" and "Closed statuses" sections; isDefault badge displayed
- Playwright e2e tests at `e2e/admin-depts-cats-substatus.spec.ts`:
  - Departments: list renders, create succeeds, validation error on empty name, non-admin sees Access Denied
  - Categories: list renders, multi-step form navigates correctly, custom field select type shows options builder
  - Substatuses: list renders with grouping, create succeeds
- All TypeScript compiles with 0 errors on these new files
- All admin screens are fully navigable via keyboard (shadcn/ui Radix primitives); all form inputs have associated labels; color contrast meets WCAG 2.1 AA via semantic tokens
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/frontend

# TypeScript strict mode: 0 errors on new files
npx tsc --noEmit 2>&1 | tail -10

# Key contracts present
grep -n "getDepartments\|getCategories\|getSubstatuses\|getCategoryGroups" src/lib/api/admin.ts && echo "API_FUNCTIONS OK"
grep -n "role.*admin\|Access Denied" src/app/admin/layout.tsx && echo "ROLE_GUARD OK"
grep -n "HAS_ACTIVE_TICKETS" src/app/admin/departments/page.tsx && echo "DEACTIVATE_GUARD OK"
grep -n "CategoryForm\|step.*3\|CustomFieldBuilder" src/components/admin/CategoryForm.tsx && echo "CATEGORY_FORM OK"
grep -n "primaryStatus\|isDefault" src/app/admin/substatuses/page.tsx && echo "SUBSTATUS_PAGE OK"

# E2E test file exists and runs
test -f e2e/admin-depts-cats-substatus.spec.ts && echo "E2E FILE EXISTS"
npx playwright test e2e/admin-depts-cats-substatus.spec.ts --reporter=list 2>&1 | tail -15
```
</verification>

<success_criteria>
1. `/admin/departments` — lists all departments, allows create/edit via form, deactivation shows modal with name-confirmation for departments with active tickets
2. `/admin/categories` — lists with search+filter, multi-step create/edit form (3 steps: Basic Info → Permissions → Custom Fields), custom field builder with type-conditional options
3. `/admin/substatuses` — lists grouped by open/closed primary status, isDefault badge visible, CRUD functional
4. Admin shell layout — left sidebar nav, role guard redirects non-admin to Access Denied, mobile-responsive at 375px
5. All API calls typed in `frontend/src/lib/api/admin.ts` using exact shapes from Wave 2b Plans 05/06
6. All form inputs have `<label>`, all errors use `role="alert"`, keyboard navigation functional (WCAG 2.1 AA)
7. Playwright e2e: 0 failing tests across departments, categories, substatuses describe blocks
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/13-SUMMARY.md` with:
- Files created/modified
- Key implementation decisions
- Any deviations from plan
- Integration contract status (what this plan provides to Plan 14)
</output>
