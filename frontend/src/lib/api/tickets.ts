import type { Ticket, Action, ApiResponse } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw { status: res.status, errors: json.errors, code: json.errors?.[0]?.code };
  }
  return json as ApiResponse<T>;
}

export interface TicketListParams {
  status?: 'open' | 'closed';
  substatusId?: number;
  categoryId?: number;
  departmentId?: number;
  assigneeId?: number;
  reporterEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  page?: number;
  perPage?: number;
  sort?: 'date_desc' | 'date_asc' | 'sla_asc' | 'assignee' | 'category';
}

export interface CreateTicketInput {
  title: string;
  description?: string;
  categoryId: number;
  address?: string;
  lat?: number;
  lng?: number;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  customFields?: Record<string, unknown>;
}

export const listTickets = (params?: TicketListParams) => {
  const qs = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
  ).toString() : '';
  return apiFetch<Ticket[]>(`/api/tickets${qs}`);
};

export const getTicket = (id: number) =>
  apiFetch<Ticket>(`/api/tickets/${id}`);

export const createTicket = (data: CreateTicketInput) =>
  apiFetch<Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(data) });

export const updateTicket = (id: number, data: Partial<CreateTicketInput>) =>
  apiFetch<Ticket>(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteTicket = (id: number) =>
  apiFetch<null>(`/api/tickets/${id}`, { method: 'DELETE' });

export const assignTicket = (id: number, body: { assigneeId?: number | null; departmentId?: number }) =>
  apiFetch<Ticket>(`/api/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify(body) });

export const bulkAssign = (body: { ticketIds: number[]; assigneeId?: number; departmentId?: number }) =>
  apiFetch<{ reassigned: number; failed: Array<{ id: number; reason: string }> }>(
    '/api/tickets/bulk-assign', { method: 'POST', body: JSON.stringify(body) }
  );

export const closeTicket = (id: number, body: { response?: string }) =>
  apiFetch<Ticket>(`/api/tickets/${id}/close`, { method: 'POST', body: JSON.stringify(body) });

export const reopenTicket = (id: number, body: { reason: string }) =>
  apiFetch<Ticket>(`/api/tickets/${id}/reopen`, { method: 'POST', body: JSON.stringify(body) });

export const postResponse = (id: number, body: { body: string }) =>
  apiFetch<Action>(`/api/tickets/${id}/responses`, { method: 'POST', body: JSON.stringify(body) });

export const postComment = (id: number, body: { body: string }) =>
  apiFetch<Action>(`/api/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify(body) });

export const getTicketHistory = (id: number, params?: { page?: number; perPage?: number }) => {
  const qs = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
  ).toString() : '';
  return apiFetch<Action[]>(`/api/tickets/${id}/history${qs}`);
};
