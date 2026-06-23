// frontend/src/lib/api/search.ts
import type { TicketSearchParams, TicketSearchResult } from '@/types/search';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function buildQuery(params: TicketSearchParams & { export?: string }): string {
  const qs = new URLSearchParams();
  if (params.q)             qs.set('q', params.q);
  if (params.status)        qs.set('status', params.status);
  if (params.substatusId)   qs.set('substatusId', String(params.substatusId));
  if (params.assigneeId)    qs.set('assigneeId', String(params.assigneeId));
  if (params.reporterEmail) qs.set('reporterEmail', params.reporterEmail);
  if (params.dateFrom)      qs.set('dateFrom', params.dateFrom);
  if (params.dateTo)        qs.set('dateTo', params.dateTo);
  if (params.lat)           qs.set('lat', String(params.lat));
  if (params.lng)           qs.set('lng', String(params.lng));
  if (params.radius)        qs.set('radius', String(params.radius));
  if (params.bbox)          qs.set('bbox', params.bbox);
  if (params.sort)          qs.set('sort', params.sort);
  if (params.page)          qs.set('page', String(params.page));
  if (params.perPage)       qs.set('perPage', String(params.perPage));
  if (params.export)        qs.set('export', params.export);
  // Arrays
  params.categoryId?.forEach((id) => qs.append('categoryId[]', String(id)));
  params.departmentId?.forEach((id) => qs.append('departmentId[]', String(id)));
  return qs.toString();
}

export async function searchTickets(
  params: TicketSearchParams,
  signal?: AbortSignal,
): Promise<TicketSearchResult> {
  const qs = buildQuery(params);
  const res = await fetch(`${API_BASE}/api/tickets${qs ? '?' + qs : ''}`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Surface 503 as a recognizable error so UI can show the Solr unavailable banner
    if (res.status === 503) {
      throw Object.assign(new Error('SEARCH_UNAVAILABLE'), { status: 503 });
    }
    throw new Error((body as { errors?: Array<{ message: string }> })?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<TicketSearchResult>;
}

/**
 * Triggers a CSV file download for the current filtered result set.
 * Uses an anchor click so the browser handles Content-Disposition: attachment.
 */
export async function exportCsv(params: TicketSearchParams): Promise<void> {
  const qs = buildQuery({ ...params, export: 'csv' });
  // Let the browser handle download directly — do not fetch into memory
  const url = `${API_BASE}/api/tickets?${qs}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tickets.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
