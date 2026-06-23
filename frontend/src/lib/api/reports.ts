// frontend/src/lib/api/reports.ts
import { apiFetch } from '@/lib/api/client'; // uses existing Wave 3a fetch wrapper with cookie auth

export const REPORT_TYPES = [
  'activity',
  'assignments',
  'sla',
  'volume',
  'staff-performance',
  'open-age',
] as const;
export type ReportType = typeof REPORT_TYPES[number];

export interface ReportFilters {
  dateFrom?: string;   // YYYY-MM-DD
  dateTo?: string;     // YYYY-MM-DD
  departmentId?: number;
  categoryId?: number;
  assigneeId?: number;
}

// SLA metrics (public endpoint, 5-min cache — GET /api/metrics/sla)
export interface SlaMetricRow {
  categoryId: number;
  categoryName: string;
  totalClosed: number;
  onTime: number;
  late: number;
  onTimePct: number;
}

export async function fetchSlaMetrics(
  days = 30,
  departmentId?: number,
): Promise<SlaMetricRow[]> {
  const params = new URLSearchParams({ days: String(days) });
  if (departmentId) params.set('departmentId', String(departmentId));
  const res = await apiFetch(`/api/metrics/sla?${params}`);
  return (res.data as SlaMetricRow[]) ?? [];
}

// Open tickets past SLA (GET /api/reports/open-age)
export interface TicketAgeRow {
  ticketId: number;
  title: string;
  assigneeId: number | null;
  assigneeName: string | null;
  categoryName: string;
  daysOverdue: number;
  expectedCloseDate: string;
}

export async function fetchOpenAge(filters: ReportFilters): Promise<TicketAgeRow[]> {
  const params = buildParams(filters);
  const res = await apiFetch(`/api/reports/open-age?${params}`);
  return (res.data as TicketAgeRow[]) ?? [];
}

// Assignments report (GET /api/reports/assignments)
export interface AssignmentRow {
  assigneeId: number | null;
  assigneeName: string;
  open: number;
  closed: number;
  avgDaysToClose: number | null;
}

export async function fetchAssignments(filters: ReportFilters): Promise<AssignmentRow[]> {
  const params = buildParams(filters);
  const res = await apiFetch(`/api/reports/assignments?${params}`);
  return (res.data as AssignmentRow[]) ?? [];
}

// Generic report fetch (activity, sla, volume, staff-performance)
export async function fetchReport(
  type: ReportType,
  filters: ReportFilters,
): Promise<unknown> {
  const params = buildParams(filters);
  const res = await apiFetch(`/api/reports/${type}?${params}`);
  return res.data;
}

// CSV download URL builder — caller sets window.location.href to trigger download
export function buildCsvUrl(type: ReportType | 'sla', filters: ReportFilters): string {
  const endpoint = type === 'open-age' ? 'open-age' : type;
  const params = buildParams({ ...filters, format: 'csv' } as ReportFilters & { format: string });
  // For SLA metrics, use /api/reports/sla (not /api/metrics/sla) for CSV export
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api/reports/${endpoint}?${params}`;
}

function buildParams(filters: ReportFilters & { format?: string }): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.dateFrom) p.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) p.set('dateTo', filters.dateTo);
  if (filters.departmentId) p.set('departmentId', String(filters.departmentId));
  if (filters.categoryId) p.set('categoryId', String(filters.categoryId));
  if (filters.assigneeId) p.set('assigneeId', String(filters.assigneeId));
  if (filters.format) p.set('format', filters.format);
  return p;
}
