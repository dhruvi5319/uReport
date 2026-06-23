// frontend/src/components/reports/SlaKpiCards.tsx
'use client';
import { SlaMetricRow } from '@/lib/api/reports';

interface Props {
  data: SlaMetricRow[];
}

export function SlaKpiCards({ data }: Props) {
  const totalClosed = data.reduce((s, r) => s + r.totalClosed, 0);
  const onTime = data.reduce((s, r) => s + r.onTime, 0);
  const late = data.reduce((s, r) => s + r.late, 0);
  const pct = totalClosed > 0 ? Math.round((onTime / totalClosed) * 100 * 10) / 10 : 0;

  const pctColor =
    pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <KpiCard label="Total Closed" value={totalClosed} />
      <KpiCard label="On Time" value={onTime} valueClass="text-green-600" />
      <KpiCard label="Late" value={late} valueClass="text-red-600" />
      <KpiCard
        label="On-Time %"
        value={`${pct}%`}
        valueClass={pctColor}
        note="(last period)"
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClass = '',
  note,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueClass}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
