// frontend/src/components/reports/SlaCategoryTable.tsx
'use client';
import Link from 'next/link';
import { SlaMetricRow } from '@/lib/api/reports';

interface Props {
  data: SlaMetricRow[];
}

export function SlaCategoryTable({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No SLA data for this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Category</th>
            <th className="pb-2 pr-4 text-right font-medium">Total</th>
            <th className="pb-2 pr-4 text-right font-medium">On-Time</th>
            <th className="pb-2 pr-4 text-right font-medium">Late</th>
            <th className="pb-2 pr-4 text-right font-medium">On-Time %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.categoryId} className="border-b last:border-0">
              <td className="py-2 pr-4">
                <Link
                  href={`/tickets?categoryId=${row.categoryId}&sla=late`}
                  className="hover:underline"
                >
                  {row.categoryName}
                </Link>
              </td>
              <td className="py-2 pr-4 text-right">{row.totalClosed}</td>
              <td className="py-2 pr-4 text-right">{row.onTime}</td>
              <td className="py-2 pr-4 text-right">{row.late}</td>
              <td className="py-2 pr-4 text-right">
                <OnTimePctBadge pct={row.onTimePct} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OnTimePctBadge({ pct }: { pct: number }) {
  const color =
    pct >= 90
      ? 'bg-green-100 text-green-700'
      : pct >= 75
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';
  const label =
    pct >= 90 ? 'On track' : pct >= 75 ? 'At risk' : 'Breaching';
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}
      aria-label={`On-time percentage: ${pct}% — ${label}`}
    >
      {pct}%
    </span>
  );
}
