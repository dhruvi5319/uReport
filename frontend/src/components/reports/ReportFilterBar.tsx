// frontend/src/components/reports/ReportFilterBar.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReportFilters } from '@/lib/api/reports';

export type { ReportFilters };

interface Props {
  filters: ReportFilters;
  onApply: (f: ReportFilters) => void;
}

function thisWeek(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  // Monday of this week
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return {
    dateFrom: mon.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  };
}

export interface ReportFilterBarProps extends Props {}

export function ReportFilterBar({ filters, onApply }: Props) {
  const [local, setLocal] = useState<ReportFilters>(filters);

  const applyThisWeek = () => {
    const w = thisWeek();
    const next = { ...local, ...w };
    setLocal(next);
    onApply(next);
  };

  const handleApply = () => onApply(local);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 shadow-sm">
      {/* Date range */}
      <div className="flex items-end gap-2">
        <div>
          <Label htmlFor="dateFrom" className="text-xs">From</Label>
          <Input
            id="dateFrom"
            type="date"
            className="mt-1 w-36"
            value={local.dateFrom ?? ''}
            onChange={(e) => setLocal({ ...local, dateFrom: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="dateTo" className="text-xs">To</Label>
          <Input
            id="dateTo"
            type="date"
            className="mt-1 w-36"
            value={local.dateTo ?? ''}
            onChange={(e) => setLocal({ ...local, dateTo: e.target.value })}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={applyThisWeek}>
          This week
        </Button>
      </div>

      {/* Apply */}
      <Button onClick={handleApply} size="sm">
        Apply
      </Button>
    </div>
  );
}
