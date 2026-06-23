// frontend/src/app/reports/page.tsx
'use client';
import { useState } from 'react';
import { ActivityReport } from '@/components/reports/ActivityReport';
import { AssignmentsReport } from '@/components/reports/AssignmentsReport';
import { SlaReport } from '@/components/reports/SlaReport';
import { VolumeReport } from '@/components/reports/VolumeReport';
import { ReportFilterBar } from '@/components/reports/ReportFilterBar';
import type { ReportFilters } from '@/lib/api/reports';
import { cn } from '@/lib/utils';

type ReportKey = 'activity' | 'assignments' | 'sla' | 'volume';

const REPORT_NAV: Array<{ key: ReportKey; label: string }> = [
  { key: 'activity', label: 'Activity' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'sla', label: 'SLA Compliance' },
  { key: 'volume', label: 'Volume Trends' },
];

function defaultFilters(): ReportFilters {
  // Default: "this week" per UX Screen-07 notes
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return {
    dateFrom: mon.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  };
}

export default function ReportsPage() {
  const [active, setActive] = useState<ReportKey>('activity');
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);

  const ReportPanel =
    active === 'activity'
      ? ActivityReport
      : active === 'assignments'
        ? AssignmentsReport
        : active === 'sla'
          ? SlaReport
          : VolumeReport;

  return (
    <div className="flex min-h-screen flex-col p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold">Reports</h1>
      <ReportFilterBar filters={filters} onApply={setFilters} />

      <div className="mt-4 flex flex-col gap-4 md:flex-row">
        {/* Left nav */}
        <nav aria-label="Report types" className="shrink-0 md:w-48">
          <ul className="space-y-1">
            {REPORT_NAV.map((item) => (
              <li key={item.key}>
                <button
                  className={cn(
                    'w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100',
                    active === item.key && 'bg-gray-100 font-semibold',
                  )}
                  onClick={() => setActive(item.key)}
                  aria-current={active === item.key ? 'page' : undefined}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Report content */}
        <main className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {REPORT_NAV.find((r) => r.key === active)?.label}
          </h2>
          <ReportPanel filters={filters} />
        </main>
      </div>
    </div>
  );
}
