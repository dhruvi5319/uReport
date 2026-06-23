// frontend/src/app/(staff)/tickets/components/SortBar.tsx
'use client';

import type { TicketSearchParams } from '@/types/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortBarProps {
  sort: TicketSearchParams['sort'];
  total: number;
  onSortChange: (sort: TicketSearchParams['sort']) => void;
}

const SORT_OPTIONS: { value: NonNullable<TicketSearchParams['sort']>; label: string }[] = [
  { value: 'date_desc', label: 'Date (newest first)' },
  { value: 'date_asc',  label: 'Date (oldest first)' },
  { value: 'sla_asc',   label: 'SLA Urgency' },
  { value: 'assignee',  label: 'Assignee' },
  { value: 'category',  label: 'Category' },
];

export function SortBar({ sort, total, onSortChange }: SortBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-gray-600">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Sort:</span>
        <Select
          value={sort ?? 'date_desc'}
          onValueChange={(v) => onSortChange(v as TicketSearchParams['sort'])}
        >
          <SelectTrigger className="h-8 text-sm w-48" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
