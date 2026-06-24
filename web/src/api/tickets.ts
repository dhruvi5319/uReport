import { apiClient } from './client';
import type { Ticket, TicketHistoryEntry, TicketSearchParams, PagedResult } from '@/types/ticket';

export const ticketsApi = {
  search: (params: TicketSearchParams) =>
    apiClient.get<PagedResult<Ticket>>('/tickets', { params }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<Ticket>(`/tickets/${id}`).then(r => r.data),

  getHistory: (id: number) =>
    apiClient.get<TicketHistoryEntry[]>(`/tickets/${id}/history`).then(r => r.data),

  create: (data: Partial<Ticket> & { categoryId: number; description: string }) =>
    apiClient.post<Ticket>('/tickets', data).then(r => r.data),

  assign: (id: number, assignedPersonId: number) =>
    apiClient.patch<Ticket>(`/tickets/${id}/assign`, { assignedPersonId }).then(r => r.data),

  close: (id: number, substatusId: number) =>
    apiClient.patch<Ticket>(`/tickets/${id}/close`, { substatus_id: substatusId }).then(r => r.data),

  reopen: (id: number, reason?: string) =>
    apiClient.patch<Ticket>(`/tickets/${id}/reopen`, { reason }).then(r => r.data),

  comment: (id: number, notes: string) =>
    apiClient.post(`/tickets/${id}/comments`, { notes }).then(r => r.data),

  /** Build export URL for CSV or print download (triggers browser download) */
  buildExportUrl: (params: TicketSearchParams, format: 'csv' | 'print') => {
    const q = new URLSearchParams();
    q.set('format', format);
    Object.entries(params).forEach(([k, v]) => { if (v != null) q.set(k, String(v)); });
    return `/api/v1/tickets/export?${q.toString()}`;
  },
};
