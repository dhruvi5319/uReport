// frontend/src/app/(staff)/tickets/components/FilterPanel.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TicketSearchParams } from '@/types/search';

interface FilterPanelProps {
  params: TicketSearchParams;
  facets: { status: Record<string, number>; category: Record<string, number>; department: Record<string, number> } | null;
  onParamChange: (updates: Partial<TicketSearchParams>) => void;
}

export function FilterPanel({ params, facets, onParamChange }: FilterPanelProps) {
  return (
    <aside
      aria-label="Ticket filters"
      className="bg-white border border-gray-200 rounded-lg p-4 space-y-5 lg:block lg:w-64 lg:shrink-0"
    >
      {/* Status */}
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</Label>
        <div className="mt-2 flex flex-col gap-1">
          {(['', 'open', 'closed'] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="status"
                value={s}
                checked={(params.status ?? '') === s}
                onChange={() => onParamChange({ status: s || undefined })}
                className="accent-blue-600"
              />
              <span className="capitalize">{s === '' ? 'All' : s}</span>
              {facets && s !== '' && (
                <span className="ml-auto text-xs text-gray-400">
                  ({facets.status[s] ?? 0})
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Category multi-select (simple) */}
      <div>
        <Label htmlFor="filter-category" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Category ID
        </Label>
        <Input
          id="filter-category"
          type="number"
          placeholder="e.g. 3"
          value={params.categoryId?.[0] ?? ''}
          onChange={(e) =>
            onParamChange({ categoryId: e.target.value ? [Number(e.target.value)] : undefined })
          }
          className="mt-1 h-8 text-sm"
        />
        {facets && Object.keys(facets.category).length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            Top: {Object.entries(facets.category).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ')}
          </p>
        )}
      </div>

      {/* Department */}
      <div>
        <Label htmlFor="filter-dept" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Department ID
        </Label>
        <Input
          id="filter-dept"
          type="number"
          placeholder="e.g. 1"
          value={params.departmentId?.[0] ?? ''}
          onChange={(e) =>
            onParamChange({ departmentId: e.target.value ? [Number(e.target.value)] : undefined })
          }
          className="mt-1 h-8 text-sm"
        />
      </div>

      {/* Date range */}
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Range</Label>
        <div className="mt-1 space-y-1">
          <Input
            type="date"
            aria-label="From date"
            value={params.dateFrom ?? ''}
            onChange={(e) => onParamChange({ dateFrom: e.target.value || undefined })}
            className="h-8 text-sm"
          />
          <Input
            type="date"
            aria-label="To date"
            value={params.dateTo ?? ''}
            onChange={(e) => onParamChange({ dateTo: e.target.value || undefined })}
            className="h-8 text-sm"
          />
          {params.dateFrom && params.dateTo && params.dateFrom > params.dateTo && (
            <p role="alert" className="text-xs text-red-600">Start date must be before end date</p>
          )}
        </div>
      </div>

      {/* Reporter email */}
      <div>
        <Label htmlFor="filter-email" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Reporter Email
        </Label>
        <Input
          id="filter-email"
          type="email"
          placeholder="reporter@example.com"
          value={params.reporterEmail ?? ''}
          onChange={(e) => onParamChange({ reporterEmail: e.target.value || undefined })}
          className="mt-1 h-8 text-sm"
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          onParamChange({
            q: undefined, status: undefined, categoryId: undefined,
            departmentId: undefined, dateFrom: undefined, dateTo: undefined,
            reporterEmail: undefined, substatusId: undefined, assigneeId: undefined,
          })
        }
      >
        Clear All
      </Button>
    </aside>
  );
}
