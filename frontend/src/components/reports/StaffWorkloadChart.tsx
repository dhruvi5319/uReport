// frontend/src/components/reports/StaffWorkloadChart.tsx
'use client';
import Link from 'next/link';
import { AssignmentRow } from '@/lib/api/reports';

interface Props {
  data: AssignmentRow[];
}

export function StaffWorkloadChart({ data }: Props) {
  if (data.length === 0) return null;
  const maxOpen = Math.max(...data.map((r) => r.open), 1);

  return (
    <ul className="space-y-3" role="list" aria-label="Staff workload">
      {data.map((row) => (
        <li key={row.assigneeId ?? 'unassigned'} className="flex items-center gap-3">
          <Link
            href={`/tickets?assigneeId=${row.assigneeId ?? ''}`}
            className="w-32 shrink-0 truncate text-sm hover:underline"
            title={row.assigneeName}
          >
            {row.assigneeName}
          </Link>
          <div
            className="h-4 rounded bg-blue-200"
            style={{ width: `${Math.round((row.open / maxOpen) * 100)}%`, minWidth: '4px' }}
            role="img"
            aria-label={`${row.open} open tickets`}
          />
          <span className="shrink-0 text-xs text-muted-foreground">
            {row.open} open
          </span>
        </li>
      ))}
    </ul>
  );
}
