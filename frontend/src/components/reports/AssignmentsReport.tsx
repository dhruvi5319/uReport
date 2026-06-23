// frontend/src/components/reports/AssignmentsReport.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  fetchAssignments,
  buildCsvUrl,
  type ReportFilters,
  type AssignmentRow,
} from '@/lib/api/reports';
import { DownloadCsvButton } from './DownloadCsvButton';

export function AssignmentsReport({ filters }: { filters: ReportFilters }) {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAssignments(filters).then(setRows).finally(() => setLoading(false));
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
            <th className="pb-2 pr-4">Staff Member</th>
            <th className="pb-2 pr-4 text-right">Open</th>
            <th className="pb-2 pr-4 text-right">Closed</th>
            <th className="pb-2 text-right">Avg Days to Close</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.assigneeId ?? 'unassigned'} className="border-b last:border-0">
              <td className="py-1 pr-4">{r.assigneeName}</td>
              <td className="py-1 pr-4 text-right">{r.open}</td>
              <td className="py-1 pr-4 text-right">{r.closed}</td>
              <td className="py-1 text-right">
                {r.avgDaysToClose != null ? `${r.avgDaysToClose} days` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <DownloadCsvButton
        href={buildCsvUrl('assignments', filters)}
        filename="assignments-report.csv"
      />
    </div>
  );
}
