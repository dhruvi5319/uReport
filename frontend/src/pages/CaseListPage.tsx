import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CaseTable } from '@/components/cases/CaseTable';
import { FilterPanel } from '@/components/cases/FilterPanel';
import { FilterChips } from '@/components/cases/FilterChips';
import { BulkActionBar } from '@/components/cases/BulkActionBar';
import { SearchInput } from '@/components/cases/SearchInput';
import { EmptyState } from '@/components/cases/EmptyState';
import { Pagination } from '@/components/cases/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { FilterState, PaginatedTickets, TicketStatus } from '@/types/ticket';

export function CaseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive FilterState from URL searchParams
  const filterState: FilterState = {
    q: searchParams.get('q') ?? undefined,
    status: (searchParams.get('status') as TicketStatus) ?? undefined,
    substatusId: searchParams.get('substatusId') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    departmentId: searchParams.get('departmentId') ?? undefined,
    assignedPersonId: searchParams.get('assignedPersonId') ?? undefined,
    issueTypeId: searchParams.get('issueTypeId') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? 'enteredDate',
    sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') ?? 'desc',
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: Number(searchParams.get('pageSize') ?? '25'),
  };

  // Debounced search query — fires API after 300ms idle
  const debouncedQ = useDebounce(filterState.q, 300);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Build query params for API call using debounced q
  const queryParams = new URLSearchParams();
  if (debouncedQ) queryParams.set('q', debouncedQ);
  if (filterState.status) queryParams.set('status', filterState.status);
  if (filterState.substatusId) queryParams.set('substatus_id', filterState.substatusId);
  if (filterState.categoryId) queryParams.set('category_id', filterState.categoryId);
  if (filterState.departmentId) queryParams.set('department_id', filterState.departmentId);
  if (filterState.assignedPersonId) queryParams.set('assignedPerson_id', filterState.assignedPersonId);
  if (filterState.issueTypeId) queryParams.set('issueType_id', filterState.issueTypeId);
  if (filterState.dateFrom) queryParams.set('dateFrom', filterState.dateFrom);
  if (filterState.dateTo) queryParams.set('dateTo', filterState.dateTo);
  queryParams.set('page', String(filterState.page));
  queryParams.set('pageSize', String(filterState.pageSize));
  queryParams.set('sortBy', filterState.sortBy ?? 'enteredDate');
  queryParams.set('sortDir', filterState.sortDir ?? 'desc');

  const { data, isLoading } = useQuery<PaginatedTickets>({
    queryKey: ['tickets', Object.fromEntries(queryParams)],
    queryFn: () =>
      fetch(`/api/tickets?${queryParams.toString()}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    placeholderData: (prev) => prev,
  });

  // Update URL when filter changes (merges with existing params)
  const updateFilter = (updates: Partial<FilterState>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    // Reset to page 1 when filter changes (except pagination itself)
    if (!('page' in updates)) next.set('page', '1');
    setSearchParams(next, { replace: true });
    setSelectedIds(new Set()); // clear selection on filter change
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
        <SearchInput value={filterState.q ?? ''} onChange={q => updateFilter({ q })} />
      </div>

      {/* Filter chips for each active non-pagination filter */}
      <FilterChips filterState={filterState} onRemove={key => updateFilter({ [key]: undefined })} />

      {/* Bulk action toolbar — Framer Motion slide down */}
      <BulkActionBar selectedIds={selectedIds} onSuccess={() => setSelectedIds(new Set())} />

      {/* Filter panel (collapsible) */}
      <FilterPanel filterState={filterState} onChange={updateFilter} />

      {/* Table or empty state */}
      {!isLoading && data?.total === 0 ? (
        <EmptyState onClearFilters={() => setSearchParams(new URLSearchParams())} />
      ) : (
        <CaseTable
          tickets={data?.items ?? []}
          loading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          sortBy={filterState.sortBy}
          sortDir={filterState.sortDir}
          onSort={(col, dir) => updateFilter({ sortBy: col, sortDir: dir })}
        />
      )}

      <Pagination
        page={filterState.page ?? 1}
        pageSize={filterState.pageSize ?? 25}
        total={data?.total ?? 0}
        onPageChange={(p: number) => updateFilter({ page: p })}
        onPageSizeChange={(ps: number) => updateFilter({ pageSize: ps, page: 1 })}
      />
    </div>
  );
}
