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
