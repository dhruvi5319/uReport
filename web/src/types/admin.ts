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
