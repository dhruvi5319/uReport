// frontend/src/components/reports/SlaBreachList.tsx
'use client';
import Link from 'next/link';
import { TicketAgeRow } from '@/lib/api/reports';

interface Props {
  rows: TicketAgeRow[];
  departmentId?: number;
}

export function SlaBreachList({ rows, departmentId }: Props) {
  const preview = rows.slice(0, 5);
  const viewAllHref = `/tickets?sla=breach${departmentId ? `&departmentId=${departmentId}` : ''}`;

  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
        <span className="text-green-700 text-sm font-medium">✅ No SLA breaches</span>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {preview.map((row) => (
          <div
            key={row.ticketId}
            className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"
          >
            <div>
              <Link href={`/tickets/${row.ticketId}`} className="font-medium hover:underline">
                #{row.ticketId} {row.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                +{row.daysOverdue} day{row.daysOverdue !== 1 ? 's' : ''} overdue
                {row.assigneeName ? ` · ${row.assigneeName}` : ' · Unassigned'}
              </p>
            </div>
            <Link
              href={`/tickets?ticketId=${row.ticketId}`}
              className="text-xs text-blue-600 hover:underline"
            >
              {row.assigneeId ? 'Reassign' : 'Assign'}
            </Link>
          </div>
        ))}
      </div>
      {rows.length > 5 && (
        <Link href={viewAllHref} className="mt-3 block text-sm text-blue-600 hover:underline">
          Show all {rows.length} overdue tickets →
        </Link>
      )}
    </div>
  );
}
