// frontend/src/types/search.ts

export type SlaStatus = 'breach' | 'warning' | 'ok' | 'none';

export interface TicketListItem {
  id: number;
  title: string;
  status: 'open' | 'closed';
  substatusId: number | null;
  categoryId: number;
  departmentId: number;
  assigneeId: number | null;
  reporterName: string | null;
  reporterEmail: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  datetimeOpened: string;
  datetimeClosed: string | null;
  datetimeUpdated: string | null;
  mergedIntoTicketId: number | null;
}

export interface SearchFacets {
  status: Record<string, number>;
  category: Record<string, number>;
  department: Record<string, number>;
}

export interface TicketSearchMeta {
  total: number;
  page: number;
  perPage: number;
  pages: number;
  facets: SearchFacets;
}

export interface TicketSearchResult {
  data: TicketListItem[];
  meta: TicketSearchMeta;
  errors: Array<{ field: string | null; message: string; code: string }>;
}

export interface TicketSearchParams {
  q?: string;
  status?: string;
  substatusId?: number;
  categoryId?: number[];
  departmentId?: number[];
  assigneeId?: number;
  reporterEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  bbox?: string;
  sort?: 'date_desc' | 'date_asc' | 'sla_asc' | 'assignee' | 'category';
  page?: number;
  perPage?: number;
}
