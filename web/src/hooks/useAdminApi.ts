import { useState, useCallback } from 'react';
import { apiClient } from '@/api/client';
import type {
  Person,
  PeopleEmail,
  PeoplePhone,
  PeopleAddress,
  Department,
  Category,
  CategoryGroup,
  CategoryActionResponse,
  Substatus,
  Action,
  Client,
  ContactMethod,
} from '@/types/admin';

// ─── usePeople (F5) ──────────────────────────────────────────────────────────

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (params?: {
    q?: string; role?: string; department_id?: number; page?: number; limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/people', { params });
      setPeople(data.content ?? data);  // support both paginated and array responses
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to load people');
    } finally { setLoading(false); }
  }, []);

  const getById = useCallback(async (id: number): Promise<Person> => {
    const { data } = await apiClient.get(`/people/${id}`);
    return data;
  }, []);

  const create = useCallback(async (body: Partial<Person> & { password?: string }): Promise<Person> => {
    const { data } = await apiClient.post('/people', body);
    return data;
  }, []);

  const update = useCallback(async (id: number, body: Partial<Person>): Promise<Person> => {
    const { data } = await apiClient.put(`/people/${id}`, body);
    return data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.delete(`/people/${id}`);
  }, []);

  // Child record methods for emails
  const addEmail = useCallback(async (personId: number, body: Omit<PeopleEmail, 'id'>) => {
    const { data } = await apiClient.post(`/people/${personId}/emails`, body);
    return data;
  }, []);
  const updateEmail = useCallback(async (personId: number, emailId: number, body: Partial<PeopleEmail>) => {
    const { data } = await apiClient.put(`/people/${personId}/emails/${emailId}`, body);
    return data;
  }, []);
  const removeEmail = useCallback(async (personId: number, emailId: number) => {
    await apiClient.delete(`/people/${personId}/emails/${emailId}`);
  }, []);

  // Child record methods for phones
  const addPhone = useCallback(async (personId: number, body: Omit<PeoplePhone, 'id'>) => {
    const { data } = await apiClient.post(`/people/${personId}/phones`, body);
    return data;
  }, []);
  const updatePhone = useCallback(async (personId: number, phoneId: number, body: Partial<PeoplePhone>) => {
    const { data } = await apiClient.put(`/people/${personId}/phones/${phoneId}`, body);
    return data;
  }, []);
  const removePhone = useCallback(async (personId: number, phoneId: number) => {
    await apiClient.delete(`/people/${personId}/phones/${phoneId}`);
  }, []);

  // Child record methods for addresses
  const addAddress = useCallback(async (personId: number, body: Omit<PeopleAddress, 'id'>) => {
    const { data } = await apiClient.post(`/people/${personId}/addresses`, body);
    return data;
  }, []);
  const updateAddress = useCallback(async (personId: number, addressId: number, body: Partial<PeopleAddress>) => {
    const { data } = await apiClient.put(`/people/${personId}/addresses/${addressId}`, body);
    return data;
  }, []);
  const removeAddress = useCallback(async (personId: number, addressId: number) => {
    await apiClient.delete(`/people/${personId}/addresses/${addressId}`);
  }, []);

  return {
    people, loading, error, list, getById, create, update, remove,
    addEmail, updateEmail, removeEmail,
    addPhone, updatePhone, removePhone,
    addAddress, updateAddress, removeAddress,
  };
}

// ─── useDepartments (F6) ─────────────────────────────────────────────────────

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/departments');
      setDepartments(data.content ?? data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to load departments');
    } finally { setLoading(false); }
  }, []);

  const getById = useCallback(async (id: number): Promise<Department> => {
    const { data } = await apiClient.get(`/departments/${id}`);
    return data;
  }, []);

  const create = useCallback(async (body: Partial<Department>): Promise<Department> => {
    const { data } = await apiClient.post('/departments', body);
    return data;
  }, []);

  const update = useCallback(async (id: number, body: Partial<Department>): Promise<Department> => {
    const { data } = await apiClient.put(`/departments/${id}`, body);
    return data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.delete(`/departments/${id}`);
  }, []);

  const getDepartmentPeople = useCallback(async (id: number): Promise<Person[]> => {
    const { data } = await apiClient.get(`/departments/${id}/people`);
    return data.content ?? data;
  }, []);

  const getDepartmentCategories = useCallback(async (id: number): Promise<{ id: number; name: string }[]> => {
    const { data } = await apiClient.get(`/departments/${id}/categories`);
    return data.content ?? data;
  }, []);

  const setCategoryAssociations = useCallback(async (id: number, categoryIds: number[]) => {
    await apiClient.put(`/departments/${id}/categories`, { categoryIds });
  }, []);

  const setActionAssociations = useCallback(async (id: number, actionIds: number[]) => {
    await apiClient.put(`/departments/${id}/actions`, { actionIds });
  }, []);

  return {
    departments, loading, error,
    list, getById, create, update, remove,
    getDepartmentPeople, getDepartmentCategories,
    setCategoryAssociations, setActionAssociations,
  };
}

// ─── useCategories (F7) ──────────────────────────────────────────────────────

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (callerRole?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = callerRole ? { callerRole } : undefined;
      const { data } = await apiClient.get('/categories', { params });
      setCategories(data.content ?? data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to load categories');
    } finally { setLoading(false); }
  }, []);

  const getById = useCallback(async (id: number): Promise<Category> => {
    const { data } = await apiClient.get(`/categories/${id}`);
    return data;
  }, []);

  const create = useCallback(async (body: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.post('/categories', body);
    return data;
  }, []);

  const update = useCallback(async (id: number, body: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.put(`/categories/${id}`, body);
    return data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.delete(`/categories/${id}`);
  }, []);

  // Category groups
  const listGroups = useCallback(async (): Promise<CategoryGroup[]> => {
    const { data } = await apiClient.get('/category-groups');
    return data.content ?? data;
  }, []);

  const createGroup = useCallback(async (body: Partial<CategoryGroup>): Promise<CategoryGroup> => {
    const { data } = await apiClient.post('/category-groups', body);
    return data;
  }, []);

  const updateGroup = useCallback(async (id: number, body: Partial<CategoryGroup>): Promise<CategoryGroup> => {
    const { data } = await apiClient.put(`/category-groups/${id}`, body);
    return data;
  }, []);

  const removeGroup = useCallback(async (id: number) => {
    await apiClient.delete(`/category-groups/${id}`);
  }, []);

  // Action responses
  const listActionResponses = useCallback(async (categoryId: number): Promise<CategoryActionResponse[]> => {
    const { data } = await apiClient.get(`/categories/${categoryId}/action-responses`);
    return data.content ?? data;
  }, []);

  const upsertActionResponse = useCallback(async (
    categoryId: number,
    body: { action_id: number; template?: string | null; replyEmail?: string | null }
  ): Promise<CategoryActionResponse> => {
    const { data } = await apiClient.post(`/categories/${categoryId}/action-responses`, body);
    return data;
  }, []);

  const removeActionResponse = useCallback(async (categoryId: number, responseId: number) => {
    await apiClient.delete(`/categories/${categoryId}/action-responses/${responseId}`);
  }, []);

  return {
    categories, loading, error,
    list, getById, create, update, remove,
    listGroups, createGroup, updateGroup, removeGroup,
    listActionResponses, upsertActionResponse, removeActionResponse,
  };
}

// ─── useCategoryGroups (convenience re-export shape) ─────────────────────────

export function useCategoryGroups() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/category-groups');
      setGroups(data.content ?? data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to load category groups');
    } finally { setLoading(false); }
  }, []);

  return { groups, loading, error, list };
}

// ─── useSubstatuses (F8) ─────────────────────────────────────────────────────

export function useSubstatuses() {
  const [substatuses, setSubstatuses] = useState<Substatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/substatus');
      setSubstatuses(data.content ?? data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to load substatuses');
    } finally { setLoading(false); }
  }, []);

  const create = useCallback(async (body: Partial<Substatus>): Promise<Substatus> => {
    const { data } = await apiClient.post('/substatus', body);
    return data;
  }, []);

  const update = useCallback(async (id: number, body: Partial<Substatus>): Promise<Substatus> => {
    const { data } = await apiClient.patch(`/substatus/${id}`, body);
    return data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.delete(`/substatus/${id}`);
  }, []);

  return { substatuses, loading, error, list, create, update, remove };
}

// ─── useActions (F9) ─────────────────────────────────────────────────────────

export function useActions() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/actions');
      setActions(data.content ?? data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to load actions');
    } finally { setLoading(false); }
  }, []);

  const create = useCallback(async (body: Partial<Action>): Promise<Action> => {
    const { data } = await apiClient.post('/actions', body);
    return data;
  }, []);

  const update = useCallback(async (id: number, body: Partial<Action>): Promise<Action> => {
    const { data } = await apiClient.patch(`/actions/${id}`, body);
    return data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.delete(`/actions/${id}`);
  }, []);

  return { actions, loading, error, list, create, update, remove };
}

// ─── useClients (F13) ────────────────────────────────────────────────────────

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plainTextKey, setPlainTextKey] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/clients');
      setClients(data.content ?? data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Failed to load clients');
    } finally { setLoading(false); }
  }, []);

  const getById = useCallback(async (id: number): Promise<Client> => {
    const { data } = await apiClient.get(`/clients/${id}`);
    return data;
  }, []);

  const create = useCallback(async (body: Partial<Client> & { api_key?: string }): Promise<Client> => {
    const { data } = await apiClient.post('/clients', body);
    if (data.api_key) setPlainTextKey(data.api_key);  // displayed once then cleared
    return data;
  }, []);

  const update = useCallback(async (id: number, body: Partial<Client> & { rotateKey?: boolean }): Promise<Client> => {
    const { data } = await apiClient.put(`/clients/${id}`, body);
    if (data.api_key) setPlainTextKey(data.api_key);  // show once if key was rotated
    return data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiClient.delete(`/clients/${id}`);
  }, []);

  const clearPlainTextKey = useCallback(() => {
    setPlainTextKey(null);
  }, []);

  // Contact methods for client form
  const listContactMethods = useCallback(async (): Promise<ContactMethod[]> => {
    const { data } = await apiClient.get('/contact-methods');
    return data.content ?? data;
  }, []);

  return {
    clients, loading, error, plainTextKey,
    list, getById, create, update, remove, clearPlainTextKey, listContactMethods,
  };
}
