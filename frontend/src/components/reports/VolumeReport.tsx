// frontend/src/components/reports/VolumeReport.tsx
'use client';
import { useEffect, useState } from 'react';
import { fetchReport, buildCsvUrl, type ReportFilters } from '@/lib/api/reports';
import { DownloadCsvButton } from './DownloadCsvButton';

export function VolumeReport({ filters }: { filters: ReportFilters }) {
  const [data, setData] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReport('volume', filters)
      .then((d) => setData((d as { byDay: typeof data }).byDay ?? []))
      .finally(() => setLoading(false));
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
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2 text-right">Tickets Submitted</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.date} className="border-b last:border-0">
              <td className="py-1 pr-4">{r.date}</td>
              <td className="py-1 text-right">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <DownloadCsvButton href={buildCsvUrl('volume', filters)} filename="volume-report.csv" />
    </div>
  );
}
