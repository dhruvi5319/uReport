// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiError {
  field: string | null;
  message: string;
  code: string | null;
}

export interface ApiMeta {
  page?: number;
  perPage?: number;
  total?: number;
  pages?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
  errors: ApiError[];
}

// ─── Auth / User ──────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'staff' | 'public' | 'anonymous';

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: { id: number; name: string } | null;
  primaryEmail: string | null;
}

// ─── Ticket (stub — full type expanded in Wave 3a Plan 12) ───────────────────

export interface TicketSummary {
  id: number;
  title: string;
  status: 'open' | 'closed';
  category: { id: number; name: string };
  department: { id: number; name: string };
  assignee: { id: number; name: string } | null;
  sla: {
    slaDays: number | null;
    expectedCloseDate: string | null;
    status: 'on_time' | 'late' | 'no_sla';
    pctElapsed: number | null;
  };
  datetimeOpened: string;
  datetimeClosed: string | null;
}

// ─── Ticket (full — Wave 3a Plan 12) ─────────────────────────────────────────

export interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: 'open' | 'closed';
  category?: { id: number; name: string; fields?: CategoryField[] } | null;
  department?: { id: number; name: string } | null;
  assignee?: { id: number; name: string } | null;
  reporter?: { name?: string; email?: string; phone?: string } | null;
  substatus?: { id: number; label: string } | null;
  sla?: {
    slaDays: number | null;
    expectedCloseDate: string | null;
    status: 'on_time' | 'late' | 'no_sla';
    pctElapsed: number | null;
  } | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  customFields?: Record<string, unknown>;
  datetimeOpened: string;
  datetimeClosed?: string | null;
}

export interface CategoryField {
  code: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'checkbox';
  options?: string[];
  required?: boolean;
}

// ─── Action / Audit Trail ─────────────────────────────────────────────────────

export interface Action {
  id: number;
  type: 'open' | 'assignment' | 'closed' | 'reopen' | 'response' | 'comment' | 'upload' | 'deleted' | 'merged' | 'substatus' | string;
  visibility: 'public' | 'internal';
  actor?: { id: number; name: string } | null;
  payload?: Record<string, unknown> | null;
  datetimeCreated: string;
}

// ─── Pagination Meta ──────────────────────────────────────────────────────────

export interface PaginatedMeta extends ApiMeta {
  page: number;
  perPage: number;
  total: number;
  pages: number;
}
