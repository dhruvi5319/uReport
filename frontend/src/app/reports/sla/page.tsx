// frontend/src/app/reports/sla/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { SlaKpiCards } from '@/components/reports/SlaKpiCards';
import { SlaCategoryTable } from '@/components/reports/SlaCategoryTable';
import { SlaBreachList } from '@/components/reports/SlaBreachList';
import { StaffWorkloadChart } from '@/components/reports/StaffWorkloadChart';
import { DownloadCsvButton } from '@/components/reports/DownloadCsvButton';
import {
  fetchSlaMetrics,
  fetchOpenAge,
  fetchAssignments,
  buildCsvUrl,
  type SlaMetricRow,
  type TicketAgeRow,
  type AssignmentRow,
} from '@/lib/api/reports';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 14 days', value: '14' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

export default function SlaPage() {
  const [days, setDays] = useState(30);
  const [metrics, setMetrics] = useState<SlaMetricRow[]>([]);
  const [breachRows, setBreachRows] = useState<TicketAgeRow[]>([]);
  const [staffRows, setStaffRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSlaMetrics(days),
      fetchOpenAge({}),
      fetchAssignments({}),
    ])
      .then(([m, b, s]) => {
        setMetrics(m);
        setBreachRows(b);
        setStaffRows(s);
        setLastUpdated(new Date());
      })
      .finally(() => setLoading(false));
  }, [days]);

  const csvUrl = buildCsvUrl('sla', { dateFrom: daysAgoDate(days) });

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">SLA Compliance Dashboard</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-sm text-muted-foreground">
            Period:
          </label>
          <Select
            value={String(days)}
            onValueChange={(v) => setDays(Number(v))}
          >
            <SelectTrigger id="period-select" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Last updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div role="status" aria-live="polite" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <SlaKpiCards data={metrics} />
      )}

      {/* SLA by Category */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">SLA Performance by Category</h2>
          <DownloadCsvButton
            href={csvUrl}
            filename="sla-report.csv"
            label="Download as CSV"
          />
        </div>
        {loading ? (
          <div role="status" aria-live="polite" className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : (
          <SlaCategoryTable data={metrics} />
        )}
      </div>

      {/* Open Tickets Past SLA */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Open Tickets Past SLA
            {breachRows.length > 0 && (
              <span className="ml-2 text-sm font-normal text-red-600">
                ({breachRows.length} tickets)
              </span>
            )}
          </h2>
        </div>
        {loading ? (
          <div role="status" aria-live="polite" className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : (
          <SlaBreachList rows={breachRows} />
        )}
      </div>

      {/* Staff Workload */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Staff Workload (open tickets)</h2>
        {loading ? (
          <div role="status" aria-live="polite" className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ) : (
          <StaffWorkloadChart data={staffRows} />
        )}
      </div>
    </div>
  );
}

function daysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
