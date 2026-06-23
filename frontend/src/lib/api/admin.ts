// Admin API client — typed fetch functions for all admin entity endpoints
// Consumed by Wave 3b admin pages (Plans 13 and 14)

import { apiClient, ApiError } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export { ApiError };

// ─── Re-export ApiResponse ────────────────────────────────────────────────────
export type { ApiResponse };

// ─── Department ───────────────────────────────────────────────────────────────

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

export async function getDepartments(): Promise<ApiResponse<Department[]>> {
  return apiClient<Department[]>('/api/departments');
}

export async function getDepartment(id: number): Promise<ApiResponse<Department>> {
  return apiClient<Department>(`/api/departments/${id}`);
}

export async function createDepartment(body: CreateDepartmentBody): Promise<ApiResponse<Department>> {
  return apiClient<Department>('/api/departments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateDepartment(
  id: number,
  body: Partial<CreateDepartmentBody>,
): Promise<ApiResponse<Department>> {
  return apiClient<Department>(`/api/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteDepartment(
  id: number,
  params?: { force?: boolean },
): Promise<ApiResponse<null>> {
  const qs = params?.force ? '?force=1' : '';
  return apiClient<null>(`/api/departments/${id}${qs}`, { method: 'DELETE' });
}

// ─── Category ─────────────────────────────────────────────────────────────────

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

export async function getCategories(params?: {
  departmentId?: number;
  q?: string;
}): Promise<ApiResponse<Category[]>> {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [string, string][];
  const qs = entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
  return apiClient<Category[]>(`/api/categories${qs}`);
}

export async function getCategory(id: number): Promise<ApiResponse<Category>> {
  return apiClient<Category>(`/api/categories/${id}`);
}

export async function createCategory(body: CreateCategoryBody): Promise<ApiResponse<Category>> {
  return apiClient<Category>('/api/categories', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateCategory(
  id: number,
  body: Partial<CreateCategoryBody>,
): Promise<ApiResponse<Category>> {
  return apiClient<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteCategory(id: number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/api/categories/${id}`, { method: 'DELETE' });
}

export async function getCategoryGroups(): Promise<ApiResponse<CategoryGroup[]>> {
  return apiClient<CategoryGroup[]>('/api/category-groups');
}

// ─── Substatus ────────────────────────────────────────────────────────────────

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

export async function getSubstatuses(
  primaryStatus?: 'open' | 'closed',
): Promise<ApiResponse<Substatus[]>> {
  const qs = primaryStatus ? `?primaryStatus=${primaryStatus}` : '';
  return apiClient<Substatus[]>(`/api/substatuses${qs}`);
}

export async function createSubstatus(body: CreateSubstatusBody): Promise<ApiResponse<Substatus>> {
  return apiClient<Substatus>('/api/substatuses', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateSubstatus(
  id: number,
  body: Partial<CreateSubstatusBody>,
): Promise<ApiResponse<Substatus>> {
  return apiClient<Substatus>(`/api/substatuses/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteSubstatus(id: number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/api/substatuses/${id}`, { method: 'DELETE' });
}

// ─── Person ───────────────────────────────────────────────────────────────────

export type PersonRole = 'admin' | 'staff' | 'public';

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: PersonRole;
  departmentId: number | null;
  active: boolean;
  oidcSubject: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonBody {
  firstName: string;
  lastName: string;
  role: PersonRole;
  departmentId?: number | null;
  active?: boolean;
}

export interface PersonListParams {
  q?: string;
  role?: PersonRole;
  departmentId?: number;
  active?: boolean;
  page?: number;
  perPage?: number;
}

export async function getPeople(params?: PersonListParams): Promise<ApiResponse<Person[]>> {
  const entries: [string, string][] = [];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        entries.push([k, String(v)]);
      }
    }
  }
  const qs = entries.length ? '?' + new URLSearchParams(entries).toString() : '';
  return apiClient<Person[]>(`/api/people${qs}`);
}

export async function getPerson(id: number): Promise<ApiResponse<Person>> {
  return apiClient<Person>(`/api/people/${id}`);
}

export async function createPerson(body: CreatePersonBody): Promise<ApiResponse<Person>> {
  return apiClient<Person>('/api/people', { method: 'POST', body: JSON.stringify(body) });
}

export async function updatePerson(
  id: number,
  body: Partial<CreatePersonBody>,
): Promise<ApiResponse<Person>> {
  return apiClient<Person>(`/api/people/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deletePerson(id: number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/api/people/${id}`, { method: 'DELETE' });
}

// ─── Contact Method ───────────────────────────────────────────────────────────

export type ContactMethodType = 'email' | 'phone' | 'address';
export type PhoneType = 'mobile' | 'office' | 'home';

export interface ContactMethod {
  id: number;
  personId: number;
  type: ContactMethodType;
  value: string;
  phoneType: PhoneType | null;
  isPrimary: boolean;
  label: string | null;
}

export interface CreateContactMethodBody {
  type: ContactMethodType;
  value: string;
  phoneType?: PhoneType | null;
  isPrimary: boolean;
  label?: string | null;
}

export async function getContactMethods(personId: number): Promise<ApiResponse<ContactMethod[]>> {
  return apiClient<ContactMethod[]>(`/api/people/${personId}/contact-methods`);
}

export async function createContactMethod(
  personId: number,
  body: CreateContactMethodBody,
): Promise<ApiResponse<ContactMethod>> {
  return apiClient<ContactMethod>(`/api/people/${personId}/contact-methods`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateContactMethod(
  personId: number,
  cmId: number,
  body: Partial<CreateContactMethodBody>,
): Promise<ApiResponse<ContactMethod>> {
  return apiClient<ContactMethod>(`/api/people/${personId}/contact-methods/${cmId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteContactMethod(
  personId: number,
  cmId: number,
): Promise<ApiResponse<null>> {
  return apiClient<null>(`/api/people/${personId}/contact-methods/${cmId}`, { method: 'DELETE' });
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface Template {
  id: number;
  name: string;
  subject: string | null;
  body: string;
  slug: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateBody {
  name: string;
  subject?: string | null;
  body: string;
  active?: boolean;
}

export async function getTemplates(params?: {
  active?: 'all' | boolean;
}): Promise<ApiResponse<Template[]>> {
  const qs =
    params?.active !== undefined
      ? `?active=${String(params.active)}`
      : '';
  return apiClient<Template[]>(`/api/templates${qs}`);
}

export async function getTemplate(id: number): Promise<ApiResponse<Template>> {
  return apiClient<Template>(`/api/templates/${id}`);
}

export async function createTemplate(body: CreateTemplateBody): Promise<ApiResponse<Template>> {
  return apiClient<Template>('/api/templates', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateTemplate(
  id: number,
  body: Partial<CreateTemplateBody>,
): Promise<ApiResponse<Template>> {
  return apiClient<Template>(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteTemplate(id: number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/api/templates/${id}`, { method: 'DELETE' });
}

// ─── API Client ───────────────────────────────────────────────────────────────

export interface ApiClient {
  id: number;
  name: string;
  contactEmail: string;
  apiKeyHint: string;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiClientWithKey extends ApiClient {
  apiKey: string; // plain key — returned once only
}

export interface CreateApiClientBody {
  name: string;
  contactEmail: string;
  notes?: string | null;
}

export async function getApiClients(): Promise<ApiResponse<ApiClient[]>> {
  return apiClient<ApiClient[]>('/api/clients');
}

export async function getApiClient(id: number): Promise<ApiResponse<ApiClient>> {
  return apiClient<ApiClient>(`/api/clients/${id}`);
}

export async function createApiClient(
  body: CreateApiClientBody,
): Promise<ApiResponse<ApiClientWithKey>> {
  return apiClient<ApiClientWithKey>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateApiClient(
  id: number,
  body: Partial<CreateApiClientBody & { active: boolean }>,
): Promise<ApiResponse<ApiClient>> {
  return apiClient<ApiClient>(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function revokeApiClient(id: number): Promise<ApiResponse<null>> {
  return apiClient<null>(`/api/clients/${id}`, { method: 'DELETE' });
}

export async function regenerateApiClientKey(
  id: number,
): Promise<ApiResponse<ApiClientWithKey>> {
  return apiClient<ApiClientWithKey>(`/api/clients/${id}/regenerate-key`, { method: 'POST' });
}
