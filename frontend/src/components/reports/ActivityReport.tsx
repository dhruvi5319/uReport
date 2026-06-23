// frontend/src/components/reports/ActivityReport.tsx
'use client';
import { useEffect, useState } from 'react';
import { fetchReport, buildCsvUrl, type ReportFilters } from '@/lib/api/reports';
import { DownloadCsvButton } from './DownloadCsvButton';

interface ActivityData {
  period: { from: string; to: string };
  totalOpened: number;
  totalClosed: number;
  openAtPeriodEnd: number;
  byDay: Array<{ date: string; opened: number; closed: number }>;
}

export function ActivityReport({ filters }: { filters: ReportFilters }) {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReport('activity', filters)
      .then((d) => setData(d as ActivityData))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  if (loading) return <SkeletonTable rows={5} />;
  if (!data) return <p>No data.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Opened" value={data.totalOpened} />
        <MetricCard label="Closed" value={data.totalClosed} />
        <MetricCard label="Open at end" value={data.openAtPeriodEnd} />
      </div>
      <h3 className="font-medium">Daily Breakdown</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2 pr-4 text-right">Opened</th>
            <th className="pb-2 pr-4 text-right">Closed</th>
            <th className="pb-2 text-right">Net</th>
          </tr>
        </thead>
        <tbody>
          {data.byDay.map((r) => (
            <tr key={r.date} className="border-b last:border-0">
              <td className="py-1 pr-4">{r.date}</td>
              <td className="py-1 pr-4 text-right">{r.opened}</td>
              <td className="py-1 pr-4 text-right">{r.closed}</td>
              <td className={`py-1 text-right ${r.opened - r.closed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {r.opened - r.closed > 0 ? '+' : ''}{r.opened - r.closed}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <DownloadCsvButton
        href={buildCsvUrl('activity', filters)}
        filename="activity-report.csv"
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function SkeletonTable({ rows }: { rows: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
      ))}
    </div>
  );
}
