// frontend/src/components/reports/SlaReport.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  fetchSlaMetrics,
  buildCsvUrl,
  type ReportFilters,
  type SlaMetricRow,
} from '@/lib/api/reports';
import { SlaCategoryTable } from './SlaCategoryTable';
import { DownloadCsvButton } from './DownloadCsvButton';

export function SlaReport({ filters }: { filters: ReportFilters }) {
  const [rows, setRows] = useState<SlaMetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const days = filters.dateFrom ? dateDiffDays(filters.dateFrom, filters.dateTo) : 30;

  useEffect(() => {
    setLoading(true);
    fetchSlaMetrics(days, filters.departmentId).then(setRows).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (loading)
    return (
      <div
        role="status"
        aria-live="polite"
        className="h-32 animate-pulse rounded bg-gray-100"
      />
    );

  return (
    <div className="space-y-4">
      <SlaCategoryTable data={rows} />
      <DownloadCsvButton href={buildCsvUrl('sla', filters)} filename="sla-compliance-report.csv" />
    </div>
  );
}

function dateDiffDays(from?: string, to?: string): number {
  if (!from || !to) return 30;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.round(diff / 86400000));
}
