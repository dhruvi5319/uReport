import { apiClient } from './client';

export interface MetricsResponse {
  category_id: number;
  categoryName: string;
  numDays: number;
  effectiveDate: string;
  onTimePercentage: number;
  closedCount: number;
  onTimeCount: number;
}

export interface ReportRow {
  [key: string]: string | number | null;
}

export interface ReportResponse {
  reportType: string;
  generatedAt: string;
  data: ReportRow[];
}

export type ReportType =
  | 'activity' | 'assignments' | 'categories' | 'staff'
  | 'person' | 'sla' | 'volume' | 'current' | 'opened' | 'closed';

export const metricsApi = {
  getMetrics: (params: { category_id: number; numDays: number; effectiveDate: string }) =>
    apiClient.get<MetricsResponse>('/metrics', { params }).then(r => r.data),
  getReport: (reportType: ReportType, params: Record<string, string>) =>
    apiClient.get<ReportResponse>(`/reports/${reportType}`, { params }).then(r => r.data),
};
