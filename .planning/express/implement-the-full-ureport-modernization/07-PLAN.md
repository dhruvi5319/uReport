---
phase: implement-the-full-ureport-modernization
plan: "07"
type: execute
wave: 3b
depends_on: [1, 2, 4, 6]
files_modified:
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
  - web/src/hooks/useAdminApi.ts
  - web/src/types/admin.ts
autonomous: true

features:
  implements: ["F5", "F6", "F7", "F8", "F9", "F13"]
  depends_on: ["F3", "F4"]
  enables: ["F2", "F10", "F12", "F14", "F15", "F16", "F17", "F19", "F20"]

must_haves:
  truths:
    - "Staff users can list, create, update, and delete person records from PeopleListPage"
    - "PersonDetailPage shows all emails, phones, and addresses with inline add/edit/delete forms"
    - "DepartmentsPage allows CRUD on departments and management of category/action associations via panels"
    - "CategoriesPage allows full category CRUD including SLA config, permission levels, and custom field schema editing"
    - "SubstatusPage allows CRUD on substatuses; default is toggled per parent status type"
    - "ActionsPage allows CRUD on department-scoped actions and per-category response override management"
    - "ClientsPage allows CRUD on API clients; plain-text api_key is displayed only at creation time"
    - "All pages gate rendering and API calls behind usePermission('staff') from Wave 3a"
    - "All nav links in the admin section point to real routes registered in the router"
  artifacts:
    - path: "web/src/types/admin.ts"
      provides: "TypeScript types for all admin domain entities"
      exports: ["Person", "PeopleEmail", "PeoplePhone", "PeopleAddress", "Department", "Category", "CategoryGroup", "Substatus", "Action", "CategoryActionResponse", "Client"]
    - path: "web/src/hooks/useAdminApi.ts"
      provides: "Axios-backed API hooks for all admin CRUD operations"
      exports: ["usePeople", "useDepartments", "useCategories", "useSubstatuses", "useActions", "useClients"]
    - path: "web/src/pages/admin/PeopleListPage.tsx"
      provides: "People directory list and search"
    - path: "web/src/pages/admin/PersonDetailPage.tsx"
      provides: "Person detail view with email/phone/address sub-forms"
    - path: "web/src/pages/admin/DepartmentsPage.tsx"
      provides: "Departments admin CRUD + association panels"
    - path: "web/src/pages/admin/CategoriesPage.tsx"
      provides: "Categories admin CRUD + CustomFieldsForm + CategoryActionResponseForm"
    - path: "web/src/pages/admin/SubstatusPage.tsx"
      provides: "Substatus CRUD with default management"
    - path: "web/src/pages/admin/ActionsPage.tsx"
      provides: "Action types CRUD + category response override forms"
    - path: "web/src/pages/admin/ClientsPage.tsx"
      provides: "API client management with api_key display on creation"
  key_links:
    - from: "PeopleListPage.tsx"
      to: "GET /api/v1/people"
      via: "usePeople hook with q, role, department_id filter params"
      pattern: "usePeople|api/v1/people"
    - from: "PersonDetailPage.tsx"
      to: "GET/PUT /api/v1/people/{id} + child email/phone/address endpoints"
      via: "useAdminApi person methods"
      pattern: "api/v1/people/.*/(emails|phones|addresses)"
    - from: "CategoriesPage.tsx"
      to: "POST /api/v1/categories/{id}/action-responses"
      via: "CategoryActionResponseForm calls upsertCategoryActionResponse"
      pattern: "action-responses"
    - from: "ClientsPage.tsx"
      to: "POST /api/v1/clients"
      via: "API returns plain-text api_key only at creation — ClientForm captures and displays it once"
      pattern: "api/v1/clients"
    - from: "All admin pages"
      to: "usePermission('staff')"
      via: "hook imported from Wave 3a; non-staff users get redirected to /"
      pattern: "usePermission"

integration_contracts:
  requires:
    - from_plan: "6"
      artifact: "web/src/hooks/usePermission.ts"
      exports: ["usePermission"]
      verify: "find web/src -name 'usePermission.ts' | head -1 | grep -q usePermission && echo CONTRACT_OK"
    - from_plan: "6"
      artifact: "web/src/api/apiClient.ts"
      exports: ["apiClient (Axios instance with JWT interceptor)"]
      verify: "find web/src -name 'apiClient.ts' | head -1 | grep -q apiClient && echo CONTRACT_OK"
    - from_plan: "6"
      artifact: "web/src/router (React Router routes)"
      exports: ["RouterProvider or BrowserRouter with route definitions"]
      verify: "find web/src -name '*.tsx' -path '*/router*' -o -name 'App.tsx' | head -1 | xargs grep -l 'createBrowserRouter\\|BrowserRouter\\|Routes' 2>/dev/null | grep -q . && echo CONTRACT_OK"
    - from_plan: "4"
      artifact: "api/src/main/java/com/ureport/controller/PeopleController.java"
      exports: ["GET /api/v1/people", "POST /api/v1/people", "PUT /api/v1/people/{id}", "DELETE /api/v1/people/{id}", "GET /api/v1/people/{id}/tickets", "email/phone/address sub-endpoints"]
      verify: "grep -n 'RequestMapping.*api/v1/people' api/src/main/java/com/ureport/controller/PeopleController.java && echo CONTRACT_OK"
    - from_plan: "4"
      artifact: "api/src/main/java/com/ureport/controller/CategoryController.java"
      exports: ["GET /api/v1/categories", "POST /api/v1/categories", "PUT /api/v1/categories/{id}", "DELETE /api/v1/categories/{id}", "POST /api/v1/categories/{id}/action-responses"]
      verify: "grep -n 'RequestMapping.*api/v1/categories' api/src/main/java/com/ureport/controller/CategoryController.java && echo CONTRACT_OK"
    - from_plan: "4"
      artifact: "api/src/main/java/com/ureport/controller/SubstatusController.java"
      exports: ["GET /api/v1/substatus", "POST /api/v1/substatus", "PATCH /api/v1/substatus/{id}", "DELETE /api/v1/substatus/{id}"]
      verify: "grep -n 'RequestMapping.*api/v1/substatus' api/src/main/java/com/ureport/controller/SubstatusController.java && echo CONTRACT_OK"
  provides:
    - artifact: "web/src/pages/admin/PeopleListPage.tsx"
      exports: ["PeopleListPage (default export)"]
      shape: |
        Staff-gated page. Renders searchable list of people. Uses GET /api/v1/people?q=&role=&department_id=.
        Provides links to PersonDetailPage per row. Has "New Person" button → PersonForm modal.
      verify: "grep -n 'PeopleListPage' web/src/pages/admin/PeopleListPage.tsx && grep -n 'usePermission' web/src/pages/admin/PeopleListPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/admin/PersonDetailPage.tsx"
      exports: ["PersonDetailPage (default export)"]
      shape: |
        Staff-gated page. Shows person fields, associated tickets, and three sub-sections:
        Emails (PersonEmailsForm), Phones (PersonPhonesForm), Addresses (PersonAddressesForm).
        Each sub-section allows inline add/edit/delete via respective child endpoints.
      verify: "grep -n 'PersonDetailPage' web/src/pages/admin/PersonDetailPage.tsx && grep -n 'emails' web/src/pages/admin/PersonDetailPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/admin/DepartmentsPage.tsx"
      exports: ["DepartmentsPage (default export)"]
      shape: |
        Staff-gated page. Lists all departments. Inline detail panel with DepartmentForm,
        DepartmentCategoryPanel (manages department_categories associations),
        and DepartmentActionPanel (manages department_actions associations).
      verify: "grep -n 'DepartmentsPage' web/src/pages/admin/DepartmentsPage.tsx && grep -n 'DepartmentCategoryPanel' web/src/pages/admin/DepartmentsPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/admin/CategoriesPage.tsx"
      exports: ["CategoriesPage (default export)"]
      shape: |
        Staff-gated page. Lists all categories. Slide-over or modal editor with CategoryForm:
        name, description, department, group, defaultPerson, active/featured toggles,
        displayPermissionLevel, postingPermissionLevel (select: staff/public/anonymous),
        slaDays, notificationReplyEmail, autoCloseIsActive, autoCloseSubstatus.
        CustomFieldsForm subsection for JSON schema editing with validation preview.
        CategoryActionResponseForm subsection for per-category action response overrides.
      verify: "grep -n 'CategoriesPage' web/src/pages/admin/CategoriesPage.tsx && grep -n 'CustomFieldsForm' web/src/pages/admin/CategoriesPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/admin/SubstatusPage.tsx"
      exports: ["SubstatusPage (default export)"]
      shape: |
        Staff-gated page. Lists all substatuses grouped by status (open/closed).
        Inline SubstatusForm for create/edit. Default toggle: setting a new default
        calls PATCH /api/v1/substatus/{id} with isDefault=true (backend clears the old default).
        System substatuses (Open, Resolved, Duplicate, Bogus) show read-only badge; delete is disabled.
      verify: "grep -n 'SubstatusPage' web/src/pages/admin/SubstatusPage.tsx && grep -n 'isDefault' web/src/pages/admin/SubstatusPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/admin/ActionsPage.tsx"
      exports: ["ActionsPage (default export)"]
      shape: |
        Staff-gated page. Lists system actions (read-only) and department-scoped actions (editable).
        ActionForm for creating/editing department actions (name, description template, replyEmail).
        CategoryResponseOverrideForm: select a category and action, provide template override and replyEmail.
        System actions show read-only badge; edit/delete disabled.
      verify: "grep -n 'ActionsPage' web/src/pages/admin/ActionsPage.tsx && grep -n 'CategoryResponseOverrideForm' web/src/pages/admin/ActionsPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/admin/ClientsPage.tsx"
      exports: ["ClientsPage (default export)"]
      shape: |
        Staff-gated page. Lists all API clients (name, url, contactPerson, contactMethod).
        api_key column shows "••••••••" masked value EXCEPT immediately after POST /api/v1/clients
        returns the plain-text key — display it once in an alert/modal, then mask.
        ClientForm for create (generates key on server) and update (rotate key on demand).
        DELETE /api/v1/clients/{id} removes the client.
      verify: "grep -n 'ClientsPage' web/src/pages/admin/ClientsPage.tsx && grep -n 'api_key' web/src/pages/admin/ClientsPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/hooks/useAdminApi.ts"
      exports: ["usePeople", "useDepartments", "useCategories", "useCategoryGroups", "useSubstatuses", "useActions", "useClients"]
      shape: |
        Custom React hooks wrapping apiClient Axios calls for all admin CRUD.
        Each hook exposes: list, getById, create, update, remove, loading, error state.
        usePeople also exposes: addEmail, updateEmail, removeEmail, addPhone, updatePhone,
        removePhone, addAddress, updateAddress, removeAddress.
        useDepartments also exposes: setCategoryAssociations, setActionAssociations.
        useCategories also exposes: upsertActionResponse, removeActionResponse, listActionResponses.
        useClients returns plainTextKey (string | null) set only after POST resolves.
      verify: "grep -n 'usePeople\|useDepartments\|useCategories\|useSubstatuses\|useActions\|useClients' web/src/hooks/useAdminApi.ts && echo CONTRACT_OK"
    - artifact: "web/src/types/admin.ts"
      exports: ["Person", "PeopleEmail", "PeoplePhone", "PeopleAddress", "Department", "Category", "CategoryGroup", "CategoryActionResponse", "Substatus", "Action", "Client"]
      shape: |
        TypeScript interfaces matching the backend DTOs from TechArch Section 03 / PRD field lists.
        Person: { id, firstname, middlename, lastname, organization, address, city, state, zip,
                  department_id, departmentName, username, role, emails, phones, addresses }
        Category: { id, name, description, department_id, categoryGroup_id, defaultPerson_id,
                    active, featured, displayPermissionLevel, postingPermissionLevel, customFields,
                    slaDays, notificationReplyEmail, autoCloseIsActive, autoCloseSubstatus_id }
        Substatus: { id, name, description, status, isDefault, isSystem }
        Action: { id, name, description, type, template, replyEmail }
        Client: { id, name, url, api_key_masked, contactPerson_id, contactMethod_id }
      verify: "grep -n 'export interface Person\|export type Person' web/src/types/admin.ts && grep -n 'export interface Category\|export type Category' web/src/types/admin.ts && echo CONTRACT_OK"
---

<objective>
Implement all six Wave 3b P1 administrative frontend pages for the uReport React SPA. This wave
builds the CRUD UI for people/contact management, departments, categories, substatuses, action
types, and API client management — all consumed by staff users (Diana Reyes, Jordan Kim personas).

Purpose: Wave 3a (plan 06) built the SPA scaffold, auth pages, and ticket management UI. Wave 3b
extends the SPA with admin pages that staff use to configure the system. Wave 3c (plan 08) then
builds the remaining UI pages and depends on the established SPA structure from waves 3a+3b.

Output:
- web/src/types/admin.ts — TypeScript interfaces for all admin domain objects
- web/src/hooks/useAdminApi.ts — Axios API hooks for admin CRUD
- 7 admin page components (PeopleListPage, PersonDetailPage, DepartmentsPage, CategoriesPage,
  SubstatusPage, ActionsPage, ClientsPage) under web/src/pages/admin/
- 13 admin sub-form components under web/src/components/admin/
- All pages staff-gated via usePermission hook from Wave 3a
- All routes registered in the SPA router (extending Wave 3a routes)
</objective>

<feature_dependencies>
Implements: F5: People/Contact Management UI (PeopleListPage, PersonDetailPage with
  email/phone/address sub-forms — user stories US-5.1, US-5.2, US-5.3, US-5.4);
  F6: Department Administration UI (DepartmentsPage with category and action association
  panels — user stories US-6.1, US-6.2);
  F7: Category and Category-Group Management UI (CategoriesPage with SLA config,
  permission levels, CustomFieldsForm, CategoryActionResponseForm — user stories
  US-7.1, US-7.2, US-7.3);
  F8: Substatus System UI (SubstatusPage with default management, system substatus
  protection — user stories US-8.1, US-8.2);
  F9: Action Types and Response Templates UI (ActionsPage with system/dept distinction,
  CategoryResponseOverrideForm for per-category overrides — user stories US-9.1, US-9.2);
  F13: API Client Management UI (ClientsPage with key generation display, rotation, masked
  key display — user stories US-13.1, US-13.2)
Depends on: F3 (usePermission hook from Wave 3a gates all pages to staff role),
  F4 (JWT AuthContext + apiClient from Wave 3a provides authenticated API calls),
  Wave 2c backend (PeopleController, DepartmentController, CategoryController,
  SubstatusController, ActionController from plan 04 — all REST endpoints consumed here)
Enables: F2 (Open311ServiceList in Wave 3c depends on category data structures from here),
  F10 (MediaUploader in Wave 3c needs person context established here),
  F12 (BookmarksPage in Wave 3c uses person context),
  F14 (ContactMethodsPage in Wave 3c is simpler sibling of this wave's patterns),
  F16 (AdminJobController trigger buttons in Wave 3c pattern-matches this wave),
  F17 (MetricsDashboardPage in Wave 3c needs category/department data from here),
  F19 (IssueType admin page in Wave 3c mirrors SubstatusPage pattern from here),
  F20 (ResponseTemplate page in Wave 3c mirrors ActionsPage pattern)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@.planning/express/implement-the-full-ureport-modernization/04-PLAN.md
@project_specs/PRD-uReport.md         (F5, F6, F7, F8, F9, F13 capabilities)
@project_specs/UserStories-uReport.md (US-5.1–5.4, US-6.1–6.2, US-7.1–7.3, US-8.1–8.2, US-9.1–9.2, US-13.1–13.2)
@project_specs/PERSONAS-uReport.md    (PER-02 Diana Reyes, PER-03 Jordan Kim)

# Wave 3a SUMMARY (load if exists — provides SPA scaffold shape and route structure):
@.planning/express/implement-the-full-ureport-modernization/06-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Admin TypeScript types, API hooks, and router route registrations</name>
  <files>
    web/src/types/admin.ts
    web/src/hooks/useAdminApi.ts
  </files>
  <action>
Create the TypeScript type definitions and custom React hooks for all Wave 3b admin features.
These are consumed by every admin page component in Task 2.

**NOTE on Wave 3a scaffold:** The `web/` directory, Vite project structure, React Router,
Zustand state, Axios `apiClient`, and `usePermission` hook were all created by Wave 3a (06-PLAN).
Do NOT recreate them. Import from existing paths established in Wave 3a.
If 06-SUMMARY.md is available, verify the exact import paths before writing imports.

---

## web/src/types/admin.ts

Define TypeScript interfaces matching the backend DTO field shapes from TechArch Section 03
and PRD feature field lists. Use the EXACT field names returned by the backend APIs.

```typescript
// ─── People (F5) ─────────────────────────────────────────────────────────────

export interface PeopleEmail {
  id: number;
  email: string;
  label: string | null;          // 'Home' | 'Work' | 'Other'
  usedForNotifications: boolean;
}

export interface PeoplePhone {
  id: number;
  number: string;
  label: string | null;          // 'Main' | 'Mobile' | 'Work' | 'Home' | 'Fax' | 'Pager' | 'Other'
}

export interface PeopleAddress {
  id: number;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  label: string | null;          // 'Home' | 'Business' | 'Rental'
}

export interface Person {
  id: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  organization: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  department_id: number | null;
  departmentName: string | null;
  username: string | null;
  role: 'staff' | 'public' | 'anonymous' | null;
  emails: PeopleEmail[];
  phones: PeoplePhone[];
  addresses: PeopleAddress[];
}

// ─── Departments (F6) ─────────────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  defaultPerson_id: number | null;
  defaultPersonName: string | null;
  categories: CategorySummary[];
  actions: ActionSummary[];
}

export interface CategorySummary {
  id: number;
  name: string;
}

export interface ActionSummary {
  id: number;
  name: string;
  type: 'system' | 'department';
}

// ─── Categories (F7) ──────────────────────────────────────────────────────────

export interface CategoryGroup {
  id: number;
  name: string;
  ordering: number;
}

export interface CategoryActionResponse {
  id: number;
  category_id: number;
  action_id: number;
  actionName: string;
  template: string | null;
  replyEmail: string | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  department_id: number | null;
  departmentName: string | null;
  categoryGroup_id: number | null;
  categoryGroupName: string | null;
  defaultPerson_id: number | null;
  defaultPersonName: string | null;
  active: boolean;
  featured: boolean;
  displayPermissionLevel: 'staff' | 'public' | 'anonymous';
  postingPermissionLevel: 'staff' | 'public' | 'anonymous';
  customFields: string | null;    // JSON string — parsed in CustomFieldsForm
  slaDays: number | null;
  notificationReplyEmail: string | null;
  autoCloseIsActive: boolean;
  autoCloseSubstatus_id: number | null;
  actionResponses: CategoryActionResponse[];
}

// ─── Substatus (F8) ───────────────────────────────────────────────────────────

export interface Substatus {
  id: number;
  name: string;
  description: string | null;
  status: 'open' | 'closed';
  isDefault: boolean;
  isSystem: boolean;
}

// ─── Actions (F9) ─────────────────────────────────────────────────────────────

export interface Action {
  id: number;
  name: string;
  description: string | null;
  type: 'system' | 'department';
  template: string | null;
  replyEmail: string | null;
}

// ─── API Clients (F13) ────────────────────────────────────────────────────────

export interface Client {
  id: number;
  name: string;
  url: string | null;
  contactPerson_id: number | null;
  contactPersonName: string | null;
  contactMethod_id: number | null;
  contactMethodName: string | null;
  // api_key is never returned after creation; backend always omits the plaintext key.
  // Use plainTextKey (returned only once on POST /api/v1/clients) displayed in UI.
}

export interface ContactMethod {
  id: number;
  name: string;
  isSystem: boolean;
}
```

---

## web/src/hooks/useAdminApi.ts

Create custom React hooks for all admin API operations. Import `apiClient` from the Wave 3a
Axios instance (exact path TBD from 06-SUMMARY.md — assume `../api/apiClient` unless SUMMARY
specifies otherwise).

Each hook uses React `useState` + `useCallback` (NOT React Query — keep consistent with the
Zustand/useState pattern established in Wave 3a unless SUMMARY shows React Query was used).

### usePeople hook

```typescript
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (params?: {
    q?: string; role?: string; department_id?: number; page?: number; limit?: number;
  }) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/v1/people', { params });
      setPeople(data.content ?? data);  // support both paginated and array responses
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to load people');
    } finally { setLoading(false); }
  }, []);

  const getById = useCallback(async (id: number): Promise<Person> => {
    const { data } = await apiClient.get(`/api/v1/people/${id}`);
    return data;
  }, []);

  const create = useCallback(async (body: Partial<Person> & { password?: string }): Promise<Person> => {
    const { data } = await apiClient.post('/api/v1/people', body);
    return data;
  }, []);

  const update = useCallback(async (id: number, body: Partial<Person>): Promise<Person> => {
    const { data } = await apiClient.put(`/api/v1/people/${id}`, body);
    return data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.delete(`/api/v1/people/${id}`);
  }, []);

  // Child record methods for emails
  const addEmail = useCallback(async (personId: number, body: Omit<PeopleEmail, 'id'>) => {
    const { data } = await apiClient.post(`/api/v1/people/${personId}/emails`, body);
    return data;
  }, []);
  const updateEmail = useCallback(async (personId: number, emailId: number, body: Partial<PeopleEmail>) => {
    const { data } = await apiClient.put(`/api/v1/people/${personId}/emails/${emailId}`, body);
    return data;
  }, []);
  const removeEmail = useCallback(async (personId: number, emailId: number) => {
    await apiClient.delete(`/api/v1/people/${personId}/emails/${emailId}`);
  }, []);

  // Child record methods for phones
  const addPhone = useCallback(async (personId: number, body: Omit<PeoplePhone, 'id'>) => {
    const { data } = await apiClient.post(`/api/v1/people/${personId}/phones`, body);
    return data;
  }, []);
  const updatePhone = useCallback(async (personId: number, phoneId: number, body: Partial<PeoplePhone>) => {
    const { data } = await apiClient.put(`/api/v1/people/${personId}/phones/${phoneId}`, body);
    return data;
  }, []);
  const removePhone = useCallback(async (personId: number, phoneId: number) => {
    await apiClient.delete(`/api/v1/people/${personId}/phones/${phoneId}`);
  }, []);

  // Child record methods for addresses
  const addAddress = useCallback(async (personId: number, body: Omit<PeopleAddress, 'id'>) => {
    const { data } = await apiClient.post(`/api/v1/people/${personId}/addresses`, body);
    return data;
  }, []);
  const updateAddress = useCallback(async (personId: number, addressId: number, body: Partial<PeopleAddress>) => {
    const { data } = await apiClient.put(`/api/v1/people/${personId}/addresses/${addressId}`, body);
    return data;
  }, []);
  const removeAddress = useCallback(async (personId: number, addressId: number) => {
    await apiClient.delete(`/api/v1/people/${personId}/addresses/${addressId}`);
  }, []);

  return {
    people, loading, error, list, getById, create, update, remove,
    addEmail, updateEmail, removeEmail,
    addPhone, updatePhone, removePhone,
    addAddress, updateAddress, removeAddress,
  };
}
```

### useDepartments hook

Methods: `list`, `getById`, `create(body)`, `update(id, body)`, `remove(id)`,
`setCategoryAssociations(id, categoryIds[])`, `setActionAssociations(id, actionIds[])`,
`getDepartmentPeople(id)`, `getDepartmentCategories(id)`.

API paths per TechArch Section 03:
```
GET    /api/v1/departments
POST   /api/v1/departments
GET    /api/v1/departments/{id}
PUT    /api/v1/departments/{id}
DELETE /api/v1/departments/{id}
GET    /api/v1/departments/{id}/people
GET    /api/v1/departments/{id}/categories
PUT    /api/v1/departments/{id}/categories   body: { categoryIds: number[] }
PUT    /api/v1/departments/{id}/actions      body: { actionIds: number[] }
```

### useCategories hook

Methods: `list(callerRole?)`, `getById(id)`, `create(body)`, `update(id, body)`, `remove(id)`,
`listGroups()`, `createGroup(body)`, `updateGroup(id, body)`, `removeGroup(id)`,
`listActionResponses(categoryId)`, `upsertActionResponse(categoryId, body)`,
`removeActionResponse(categoryId, responseId)`.

API paths per TechArch Section 03:
```
GET    /api/v1/categories
POST   /api/v1/categories
GET    /api/v1/categories/{id}
PUT    /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
GET    /api/v1/category-groups
POST   /api/v1/category-groups
PUT    /api/v1/category-groups/{id}
DELETE /api/v1/category-groups/{id}
GET    /api/v1/categories/{id}/action-responses
POST   /api/v1/categories/{id}/action-responses
DELETE /api/v1/categories/{id}/action-responses/{rid}
```

### useSubstatuses hook

Methods: `list`, `create(body)`, `update(id, body)`, `remove(id)`.

API paths: `GET/POST /api/v1/substatus`, `PATCH /api/v1/substatus/{id}`,
`DELETE /api/v1/substatus/{id}`.

### useActions hook

Methods: `list`, `create(body)`, `update(id, body)`, `remove(id)`.

API paths: `GET/POST /api/v1/actions`, `PATCH /api/v1/actions/{id}`,
`DELETE /api/v1/actions/{id}`.

### useClients hook

Manages API client state. After `create(body)` resolves, capture the `api_key` field from the
response and store in `plainTextKey: string | null` state. Expose `clearPlainTextKey()` to
reset it (call after user dismisses the display modal).

```typescript
const [plainTextKey, setPlainTextKey] = useState<string | null>(null);

const create = useCallback(async (body: Partial<Client> & { api_key?: string }): Promise<Client> => {
  const { data } = await apiClient.post('/api/v1/clients', body);
  if (data.api_key) setPlainTextKey(data.api_key);  // displayed once then cleared
  return data;
}, []);
```

API paths: `GET/POST /api/v1/clients`, `GET/PUT/DELETE /api/v1/clients/{id}`.

---

**Router registration (extend Wave 3a routes):**

After writing the hooks, locate the Wave 3a router configuration file (typically
`web/src/App.tsx` or `web/src/router/index.tsx` — check 06-SUMMARY.md or grep for
`createBrowserRouter`). Add the following admin routes inside the staff-protected route group:

```
/admin/people              → PeopleListPage
/admin/people/:id          → PersonDetailPage
/admin/departments         → DepartmentsPage
/admin/categories          → CategoriesPage
/admin/substatus           → SubstatusPage
/admin/actions             → ActionsPage
/admin/clients             → ClientsPage
```

All admin routes must be nested under the existing staff-gated layout route from Wave 3a.
If no staff-gated layout route exists (check 06-SUMMARY.md), wrap all 7 routes in a React
component that calls `usePermission('staff')` and redirects to `/` if not authorized.

Do NOT remove any existing Wave 3a routes — append only.
  </action>
  <verify>
grep -n "export interface Person" web/src/types/admin.ts &&
grep -n "export interface Category" web/src/types/admin.ts &&
grep -n "export interface Substatus" web/src/types/admin.ts &&
grep -n "export interface Client" web/src/types/admin.ts &&
grep -n "usePeople\|useDepartments\|useCategories\|useSubstatuses\|useActions\|useClients" web/src/hooks/useAdminApi.ts &&
grep -n "plainTextKey" web/src/hooks/useAdminApi.ts &&
echo TYPES_AND_HOOKS_OK
  </verify>
  <done>
- web/src/types/admin.ts: TypeScript interfaces for Person (with PeopleEmail/Phone/Address
  sub-types), Department, CategorySummary, ActionSummary, CategoryGroup, CategoryActionResponse,
  Category (with customFields, autoClose fields, permission levels), Substatus (with isSystem
  flag), Action (with type system/department), Client, ContactMethod — all field names exactly
  matching backend DTO responses.
- web/src/hooks/useAdminApi.ts: usePeople (with add/update/remove email/phone/address methods),
  useDepartments (with setCategoryAssociations, setActionAssociations), useCategories (with
  upsertActionResponse, listActionResponses, category group methods), useSubstatuses, useActions,
  useClients (with plainTextKey state for one-time display after creation).
- Admin routes registered in Wave 3a router for all 7 admin pages under /admin/* paths.
- No Wave 3a routes removed or modified.
  </done>
</task>

<feature_dependencies>
Implements: F5 (Person, PeopleEmail, PeoplePhone, PeopleAddress TypeScript types + usePeople
  hook with all child record methods — foundation for PeopleListPage and PersonDetailPage),
  F6 (Department type + useDepartments hook with association management),
  F7 (Category, CategoryGroup, CategoryActionResponse types + useCategories hook with all
  category group and action response methods),
  F8 (Substatus type with isSystem flag + useSubstatuses hook),
  F9 (Action type with system/department distinction + useActions hook),
  F13 (Client type + useClients hook with plainTextKey one-time display logic)
Depends on: Wave 3a apiClient Axios instance and usePermission hook (from 06-PLAN),
  Wave 2c REST controllers (API paths consumed by all hooks)
Enables: Task 2 page and component implementation (all pages import from these hooks/types)
</feature_dependencies>

<task type="auto">
  <name>Task 2: Admin page components (PeopleListPage, PersonDetailPage, DepartmentsPage, CategoriesPage, SubstatusPage, ActionsPage, ClientsPage) and sub-form components</name>
  <files>
    web/src/pages/admin/PeopleListPage.tsx
    web/src/pages/admin/PersonDetailPage.tsx
    web/src/pages/admin/DepartmentsPage.tsx
    web/src/pages/admin/CategoriesPage.tsx
    web/src/pages/admin/SubstatusPage.tsx
    web/src/pages/admin/ActionsPage.tsx
    web/src/pages/admin/ClientsPage.tsx
    web/src/components/admin/PersonForm.tsx
    web/src/components/admin/PersonEmailsForm.tsx
    web/src/components/admin/PersonPhonesForm.tsx
    web/src/components/admin/PersonAddressesForm.tsx
    web/src/components/admin/DepartmentForm.tsx
    web/src/components/admin/DepartmentCategoryPanel.tsx
    web/src/components/admin/DepartmentActionPanel.tsx
    web/src/components/admin/CategoryForm.tsx
    web/src/components/admin/CustomFieldsForm.tsx
    web/src/components/admin/CategoryActionResponseForm.tsx
    web/src/components/admin/SubstatusForm.tsx
    web/src/components/admin/ActionForm.tsx
    web/src/components/admin/CategoryResponseOverrideForm.tsx
    web/src/components/admin/ClientForm.tsx
  </files>
  <action>
Implement all seven admin page components and thirteen sub-form components. Use the hooks from
Task 1. Use whatever UI component library/Tailwind CSS approach was established in Wave 3a
(check 06-SUMMARY.md — follow the exact pattern for forms, tables, modals, and error states).

IMPORTANT CONSTRAINTS:
- Every page component MUST call `usePermission('staff')` at the top. If the hook returns
  false/unauthorized, render `<Navigate to="/" replace />` immediately (do not render the page).
- Every `<Link>` or `<NavLink>` must point to a registered route. Use `react-router-dom`
  `useNavigate()` for programmatic navigation.
- Do NOT emit X-Frame-Options DENY or CSP frame-ancestors in any component — this is the
  frontend only; headers are set by the backend/Nginx, not React components.
- System records (isSystem=true for Substatus and Action) MUST display a read-only "System"
  badge and have their Edit and Delete buttons disabled/hidden.

---

## web/src/pages/admin/PeopleListPage.tsx (F5)

```tsx
// F5: US-5.1, US-5.3 — People directory list with search and create

const PeopleListPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { people, loading, error, list } = usePeople();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { list({ q, role: roleFilter || undefined }); }, [q, roleFilter]);

  return (
    <div>
      <h1>People</h1>
      {/* Search bar: text input for q, select for role filter */}
      {/* "New Person" button → opens PersonForm modal */}
      {/* Table of people rows: fullName, organization, role, department, emails[0] */}
      {/* Each row has "View" link → /admin/people/:id */}
      {/* PersonForm modal for create; on success: list() refresh and close modal */}
    </div>
  );
};
```

Key behaviors:
- Debounce search input (300ms) before calling `list({ q })`.
- Table columns: Full Name (link to /admin/people/:id), Organization, Role (badge), Department, Primary Email.
- "New Person" button opens `PersonForm` in a modal with `create` callback.
- On successful create, refresh list and close modal.
- Display loading spinner during API calls; display error message on failure.

---

## web/src/pages/admin/PersonDetailPage.tsx (F5)

```tsx
// F5: US-5.1, US-5.2, US-5.4 — Person detail with email/phone/address sub-forms

const PersonDetailPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { id } = useParams<{ id: string }>();
  const { getById, update, addEmail, updateEmail, removeEmail,
          addPhone, updatePhone, removePhone,
          addAddress, updateAddress, removeAddress } = usePeople();
  const [person, setPerson] = useState<Person | null>(null);

  useEffect(() => { if (id) getById(Number(id)).then(setPerson); }, [id]);

  return (
    <div>
      {/* PersonForm pre-filled with person data; Save button calls update() */}
      {/* "Associated Tickets" section: calls GET /api/v1/people/:id/tickets and lists them */}
      {/* PersonEmailsForm: list existing emails, add new, edit, delete, usedForNotifications toggle */}
      {/* PersonPhonesForm: list existing phones, add new, edit, delete */}
      {/* PersonAddressesForm: list existing addresses, add new, edit, delete */}
    </div>
  );
};
```

Key behaviors:
- Show person's full details in an editable `PersonForm`. "Save" calls `update(id, data)`.
- "Associated Tickets" section links to `/tickets?reportedByPerson_id=:id` (Wave 3a TicketListPage route).
- Three collapsible sections for emails, phones, addresses — each uses its own sub-form component.
- Delete on email shows confirmation; if `usedForNotifications=true` warn that notifications will be affected.

---

## web/src/pages/admin/DepartmentsPage.tsx (F6)

Layout: left column = department list; right panel = selected department detail.

Key behaviors (per US-6.1, US-6.2):
- Department list on left: name, defaultPerson. Click to select.
- Selected department detail panel: `DepartmentForm` (name, defaultPerson_id), `DepartmentCategoryPanel`,
  `DepartmentActionPanel`.
- "New Department" button at top of list opens inline create form.
- `DepartmentCategoryPanel`: checkboxes of all active categories; checked = associated.
  "Save Associations" calls `setCategoryAssociations(id, selectedIds)`.
- `DepartmentActionPanel`: same pattern for actions.
- DELETE on department: confirmation dialog; calls `remove(id)`; removes from list.

---

## web/src/pages/admin/CategoriesPage.tsx (F7)

Layout: table of all categories + slide-over (or modal) editor on row click.

Key behaviors (per US-7.1, US-7.2, US-7.3):
- Table: Name, Department, Group, Active (toggle), Permission Levels, SLA Days, "Edit" button.
- Active toggle calls `update(id, { active: !category.active })` inline.
- "New Category" button opens editor with blank form.
- CategoryForm fields:
  - name, description (text area)
  - department_id (select from `/api/v1/departments`)
  - categoryGroup_id (select from `/api/v1/category-groups`)
  - defaultPerson_id (search-select from `/api/v1/people?role=staff`)
  - active (checkbox), featured (checkbox)
  - displayPermissionLevel (select: anonymous/public/staff)
  - postingPermissionLevel (select: anonymous/public/staff)
  - slaDays (number input, nullable)
  - notificationReplyEmail (email input, nullable)
  - autoCloseIsActive (checkbox) + autoCloseSubstatus_id (select from substatuses with status=closed, shown only when autoCloseIsActive=true)
- CustomFieldsForm subsection: renders `customFields` JSON as a structured form.
  Show a textarea with JSON and a "Preview" panel that validates JSON on blur.
  IMPORTANT: `customFields` schema changes take effect on next ticket submission without a deployment (per US-7.1 AC).
  The form simply stores the JSON string — no deployment required.
- CategoryActionResponseForm subsection: table of existing action responses (fetched via
  `listActionResponses(categoryId)`). Each row shows action name, template override, replyEmail,
  and Edit/Delete buttons. "Add Override" button → select action + enter template + replyEmail,
  calls `upsertActionResponse`.

---

## web/src/pages/admin/SubstatusPage.tsx (F8)

Layout: two columns — "Open Substatuses" | "Closed Substatuses".

Key behaviors (per US-8.1, US-8.2):
- Each column lists substatuses of that `status` type.
- Default substatus shown with a star/badge. "Set as Default" button calls
  `update(id, { isDefault: true })` — backend clears the previous default.
- System substatuses (Open, Resolved, Duplicate, Bogus) show "System" read-only badge;
  Edit and Delete buttons are disabled for them.
- "New Substatus" (open type / closed type) opens SubstatusForm modal with `status` pre-filled.
- On successful create/update, refresh the list.

---

## web/src/pages/admin/ActionsPage.tsx (F9)

Layout: two sections — "System Actions" (read-only) | "Department Actions" (editable).

Key behaviors (per US-9.1, US-9.2, US-9.3):
- System Actions table: name, template string, type badge "System". No edit or delete.
- Department Actions table: name, template, replyEmail. "Edit" and "Delete" buttons.
  "New Action" button opens ActionForm modal (type is always 'department').
- CategoryResponseOverrideForm section below the tables:
  Select Category (from `/api/v1/categories`) + Select Action (from actions list).
  Enter template override and optional replyEmail. Submit calls
  `upsertActionResponse(categoryId, { action_id, template, replyEmail })`.
  Existing overrides listed in a table below the form with Edit/Delete.
- Template variable preview: below the template textarea, show a static legend of available
  variables: `{enteredByPerson}`, `{actionPerson}`, `{original:field}`, `{updated:field}`,
  `{duplicate:ticket_id}` (from FRD F09/F01 template variable spec).

---

## web/src/pages/admin/ClientsPage.tsx (F13)

Key behaviors (per US-13.1, US-13.2):
- Table: Name, URL, Contact Person, Contact Method, "API Key" (masked as "••••••••"), Edit/Delete.
- "New Client" button opens ClientForm.
  On successful POST, `useClients.plainTextKey` will be set.
  Show a one-time alert modal: "Your API key (shown once only): <plainTextKey>"
  with a copy-to-clipboard button. After the user dismisses, call `clearPlainTextKey()`.
  NEVER display plainTextKey after the modal is dismissed.
- "Rotate Key" button in edit modal: calls PUT `/api/v1/clients/{id}` with a new generated
  `api_key` field. Treat the response the same as creation — show plain text once.
- DELETE: confirmation dialog. Calls `remove(id)`.
- ClientForm fields: name, url, contactPerson_id (search-select from people), contactMethod_id
  (select from `/api/v1/contact-methods`). No api_key input — the server generates it.

---

## Sub-form components

### PersonForm.tsx
Controlled form for Person fields. Props: `initialValues?: Partial<Person>`, `onSubmit(data)`,
`onCancel()`. Fields: firstname (required), lastname (required), middlename, organization,
address, city, state (2-char), zip, department_id (select), username, password (only shown on
create; type="password"), role (select: staff/public/anonymous).

### PersonEmailsForm.tsx
Props: `personId: number`, `emails: PeopleEmail[]`, `onAdd(body)`, `onUpdate(id, body)`,
`onRemove(id)`. Renders email list with Edit/Delete per row. Inline "Add Email" form at bottom:
email (required), label (select), usedForNotifications (checkbox).

### PersonPhonesForm.tsx
Props: `personId: number`, `phones: PeoplePhone[]`, `onAdd(body)`, `onUpdate(id, body)`,
`onRemove(id)`. Renders phone list. Inline "Add Phone" form: number (required), label (select).

### PersonAddressesForm.tsx
Props: `personId: number`, `addresses: PeopleAddress[]`, `onAdd(body)`, `onUpdate(id, body)`,
`onRemove(id)`. Renders address list. Inline "Add Address" form: address (required),
city, state (2-char), zip, label (select: Home/Business/Rental).

### DepartmentForm.tsx
Controlled form for Department fields. Props: `initialValues?`, `onSubmit(data)`, `onCancel()`.
Fields: name (required), defaultPerson_id (search-select, must be staff role).

### DepartmentCategoryPanel.tsx
Props: `departmentId: number`, `associatedIds: number[]`, `onSave(categoryIds: number[])`.
Loads all categories from `/api/v1/categories`, renders checkbox list. "Save" calls `onSave`.

### DepartmentActionPanel.tsx
Same pattern as DepartmentCategoryPanel but for actions. Loads `/api/v1/actions`.

### CategoryForm.tsx
Controlled form for Category fields as described in CategoriesPage detail above.
Includes autoCloseSubstatus_id select — only shown when autoCloseIsActive=true.

### CustomFieldsForm.tsx
Props: `value: string | null`, `onChange(json: string)`.
Renders a `<textarea>` with the JSON. On blur, attempts `JSON.parse()`:
- Valid JSON: show green checkmark "Valid JSON schema".
- Invalid JSON: show red error message "Invalid JSON — will not be saved".
This is intentionally simple — no schema builder UI — just a validated textarea.
REASON: Diana Reyes is a moderate-tech user who "understands JSON field schema at a
conceptual level" (PERSONAS-uReport.md PER-02). A builder would be over-engineering.

### CategoryActionResponseForm.tsx
Props: `categoryId: number`, `responses: CategoryActionResponse[]`, `actions: Action[]`,
`onUpsert(actionId, template, replyEmail)`, `onRemove(id)`.
Renders table of existing overrides. Inline form: select action, textarea for template,
email input for replyEmail.

### SubstatusForm.tsx
Controlled form. Fields: name (required), description, status (select: open/closed — locked
when editing existing), isDefault (checkbox). On submit calls parent `onSubmit(data)`.

### ActionForm.tsx
Controlled form for department-scoped action. Fields: name (required), description,
template (textarea; shows variable legend below), replyEmail. Type is always 'department'
(not user-configurable — per FRD F09 "type must be 'department'").

### CategoryResponseOverrideForm.tsx
Props: `categories: CategorySummary[]`, `actions: Action[]`, `onSubmit(categoryId, actionId, template, replyEmail)`.
Select category, select action, textarea for template override, email for replyEmail.

### ClientForm.tsx
Controlled form. Fields: name (required), url, contactPerson_id (search-select), contactMethod_id
(select). No api_key field on create (server generates). On edit, show "Rotate API Key" button
that sets a `rotateKey: true` flag in the submit body.

---

## Error and loading states

All page components must handle three states:
1. **Loading**: show a spinner or skeleton rows (use whatever spinner component Wave 3a established)
2. **Error**: show an inline error banner with the error message and a "Retry" button
3. **Empty**: show a "No records found" message with a "Create first X" call-to-action button
  </action>
  <verify>
find web/src/pages/admin -name "*.tsx" | wc -l &&
find web/src/components/admin -name "*.tsx" | wc -l &&
grep -n "usePermission" web/src/pages/admin/PeopleListPage.tsx &&
grep -n "usePermission" web/src/pages/admin/ClientsPage.tsx &&
grep -n "isSystem" web/src/pages/admin/SubstatusPage.tsx &&
grep -n "plainTextKey" web/src/pages/admin/ClientsPage.tsx &&
grep -n "CustomFieldsForm" web/src/pages/admin/CategoriesPage.tsx &&
grep -n "CategoryResponseOverrideForm\|CategoryActionResponseForm" web/src/pages/admin/ActionsPage.tsx &&
grep -n "Navigate" web/src/pages/admin/DepartmentsPage.tsx &&
echo ADMIN_PAGES_OK
  </verify>
  <done>
- 7 page components under web/src/pages/admin/ (PeopleListPage, PersonDetailPage, DepartmentsPage,
  CategoriesPage, SubstatusPage, ActionsPage, ClientsPage).
- 13 sub-form components under web/src/components/admin/ (PersonForm, PersonEmailsForm,
  PersonPhonesForm, PersonAddressesForm, DepartmentForm, DepartmentCategoryPanel,
  DepartmentActionPanel, CategoryForm, CustomFieldsForm, CategoryActionResponseForm,
  SubstatusForm, ActionForm, CategoryResponseOverrideForm, ClientForm).
- Every page component calls usePermission('staff') at top; non-staff gets Navigate to="/" replace.
- System records (isSystem=true): read-only "System" badge; Edit/Delete disabled in SubstatusPage and ActionsPage.
- ClientsPage: plainTextKey displayed once in a modal after POST; cleared on dismiss; column shows "••••••••".
- CategoriesPage: CustomFieldsForm with JSON validation on blur (green/red feedback).
- ActionsPage: template variable legend shown below template textarea.
- All forms show loading/error/empty states.
- All routes registered in Wave 3a router under /admin/* (from Task 1).
  </done>
</task>

<feature_dependencies>
Implements: F5 (PeopleListPage: list+search people US-5.1/5.3; PersonDetailPage: view+edit
  person + email/phone/address sub-forms US-5.1/5.2/5.4),
  F6 (DepartmentsPage: CRUD departments + category/action association panels US-6.1/6.2),
  F7 (CategoriesPage: full category CRUD + SLA/permission/autoClose config + CustomFieldsForm
  JSON schema editing + CategoryActionResponseForm per-category overrides US-7.1/7.2/7.3),
  F8 (SubstatusPage: CRUD + isDefault toggle + isSystem protection US-8.1/8.2),
  F9 (ActionsPage: system read-only + dept CRUD + CategoryResponseOverrideForm +
  template variable legend US-9.1/9.2/9.3),
  F13 (ClientsPage: CRUD + one-time plainTextKey display + key rotation US-13.1/13.2)
Depends on: Task 1 (useAdminApi hooks and admin types must exist before components can compile),
  Wave 3a (usePermission hook, apiClient, router, shared UI components all from 06-PLAN)
Enables: Wave 3c (08-PLAN) which builds the remaining UI pages and depends on Wave 3a+3b scaffold
</feature_dependencies>

</tasks>

<verification>
After all tasks complete, verify:

1. TypeScript types defined:
```bash
grep -c "^export interface\|^export type" web/src/types/admin.ts
# Expected: ≥11 type definitions
```

2. All admin hooks exported:
```bash
grep -n "export function use" web/src/hooks/useAdminApi.ts
# Expected: usePeople, useDepartments, useCategories, useCategoryGroups (or merged),
#           useSubstatuses, useActions, useClients
```

3. All page files exist:
```bash
find web/src/pages/admin -name "*.tsx" | sort
# Expected: ActionsPage.tsx, CategoriesPage.tsx, ClientsPage.tsx, DepartmentsPage.tsx,
#           PersonDetailPage.tsx, PeopleListPage.tsx, SubstatusPage.tsx
```

4. All component files exist:
```bash
find web/src/components/admin -name "*.tsx" | sort
# Expected: 13 files including CustomFieldsForm.tsx, CategoryActionResponseForm.tsx,
#           PersonEmailsForm.tsx, PersonPhonesForm.tsx, PersonAddressesForm.tsx, etc.
```

5. Permission gate on every page:
```bash
grep -l "usePermission" web/src/pages/admin/*.tsx | wc -l
# Expected: 7 (all admin pages)
```

6. System record protection:
```bash
grep -l "isSystem" web/src/pages/admin/SubstatusPage.tsx web/src/pages/admin/ActionsPage.tsx | wc -l
# Expected: 2
```

7. Client key one-time display:
```bash
grep -n "plainTextKey" web/src/pages/admin/ClientsPage.tsx
# Expected: references to display and clear the key
```

8. Vite type-check (if TypeScript strict mode is enabled in Wave 3a):
```bash
npx tsc --noEmit 2>&1 | tail -20 && echo TYPECHECK_OK
# Expected: 0 type errors (or TYPECHECK_OK if no tsconfig errors)
```
</verification>

<success_criteria>
- All 7 admin page components exist and call usePermission('staff') at top
- All 13 sub-form components exist and accept typed props from admin.ts types
- useAdminApi.ts exports 6 hooks (usePeople, useDepartments, useCategories, useSubstatuses,
  useActions, useClients) with correct API path wiring from TechArch Section 03
- usePeople includes all child record methods (addEmail, updateEmail, removeEmail, etc.)
- useClients.plainTextKey mechanism works for one-time API key display after creation
- CategoriesPage includes CustomFieldsForm (JSON textarea with validation) and
  CategoryActionResponseForm (action response override management)
- SubstatusPage and ActionsPage protect isSystem=true records from edit/delete
- ClientsPage shows "••••••••" masked key in table; reveals plaintext only in creation modal
- ActionsPage includes template variable legend ({enteredByPerson}, {actionPerson}, etc.)
- All 7 admin routes registered in Wave 3a router under /admin/* paths
- No X-Frame-Options or CSP frame-ancestors directives added anywhere
- TypeScript types in admin.ts match backend DTO field names exactly (matching TechArch DDL
  column names: firstname not firstName, substatus_id not substatusId, etc.)
- integration_contracts.requires verify commands all exit 0 (Wave 3a scaffold + Wave 2c APIs exist)
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/07-SUMMARY.md`
summarizing:
- Files created: types (1), hooks (1), pages (7), components (13)
- Admin routes registered: list all 7 /admin/* paths
- Key design decisions: usePermission gate pattern, plainTextKey modal pattern,
  CustomFieldsForm JSON-textarea approach, system record protection pattern
- Any deviations from spec (Wave 3a import paths used, UI library used)
- Integration contract verification results
</output>
