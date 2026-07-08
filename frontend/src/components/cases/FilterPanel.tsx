import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { FilterState } from '@/types/ticket';

interface FilterPanelProps {
  filterState: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
}

interface NamedItem {
  id: number;
  name: string;
}

const SUBSTATUS_OPTIONS = [
  { id: '1', name: 'Resolved' },
  { id: '2', name: 'Duplicate' },
  { id: '3', name: 'Bogus' },
];

export function FilterPanel({ filterState, onChange }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: categories } = useQuery<NamedItem[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories/public').then(r => r.json()),
    enabled: expanded,
  });

  const { data: departments } = useQuery<NamedItem[]>({
    queryKey: ['departments'],
    queryFn: () => fetch('/api/departments').then(r => r.json()),
    enabled: expanded,
  });

  const { data: people } = useQuery<NamedItem[]>({
    queryKey: ['people'],
    queryFn: () => fetch('/api/people').then(r => r.json()),
    enabled: expanded,
  });

  const { data: issueTypes } = useQuery<NamedItem[]>({
    queryKey: ['issue-types'],
    queryFn: () => fetch('/api/issue-types').then(r => r.json()),
    enabled: expanded,
  });

  function clearAll() {
    onChange({
      status: undefined,
      substatusId: undefined,
      categoryId: undefined,
      departmentId: undefined,
      assignedPersonId: undefined,
      issueTypeId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }

  return (
    <div className="rounded-md border bg-card">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="filter-panel-content"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div id="filter-panel-content" className="border-t px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={filterState.status ?? 'all'}
                onValueChange={v => onChange({ status: v === 'all' ? undefined : v as 'open' | 'closed' })}
              >
                <SelectTrigger aria-label="Filter by status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Substatus */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Substatus</label>
              <Select
                value={filterState.substatusId ?? 'all'}
                onValueChange={v => onChange({ substatusId: v === 'all' ? undefined : v })}
              >
                <SelectTrigger aria-label="Filter by substatus">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {SUBSTATUS_OPTIONS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select
                value={filterState.categoryId ?? 'all'}
                onValueChange={v => onChange({ categoryId: v === 'all' ? undefined : v })}
              >
                <SelectTrigger aria-label="Filter by category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(categories ?? []).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Department</label>
              <Select
                value={filterState.departmentId ?? 'all'}
                onValueChange={v => onChange({ departmentId: v === 'all' ? undefined : v })}
              >
                <SelectTrigger aria-label="Filter by department">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(departments ?? []).map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <Select
                value={filterState.assignedPersonId ?? 'all'}
                onValueChange={v => onChange({ assignedPersonId: v === 'all' ? undefined : v })}
              >
                <SelectTrigger aria-label="Filter by assignee">
                  <SelectValue placeholder="All assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(people ?? []).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Issue Type</label>
              <Select
                value={filterState.issueTypeId ?? 'all'}
                onValueChange={v => onChange({ issueTypeId: v === 'all' ? undefined : v })}
              >
                <SelectTrigger aria-label="Filter by issue type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {(issueTypes ?? []).map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date from</label>
              <Input
                type="date"
                value={filterState.dateFrom ?? ''}
                onChange={e => onChange({ dateFrom: e.target.value || undefined })}
                aria-label="Date from"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date to</label>
              <Input
                type="date"
                value={filterState.dateTo ?? ''}
                onChange={e => onChange({ dateTo: e.target.value || undefined })}
                aria-label="Date to"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
