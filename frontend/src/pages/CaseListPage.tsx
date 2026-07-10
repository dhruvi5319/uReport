import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { CaseTable } from '@/components/cases/CaseTable';
import { FilterPanel } from '@/components/cases/FilterPanel';
import { FilterChips } from '@/components/cases/FilterChips';
import { BulkActionBar } from '@/components/cases/BulkActionBar';
import { SearchInput } from '@/components/cases/SearchInput';
import { EmptyState } from '@/components/cases/EmptyState';
import { Pagination } from '@/components/cases/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import type { FilterState, PaginatedTickets, TicketStatus } from '@/types/ticket';

interface Bookmark {
  id: number;
  name: string;
  requestUri: string;
}

export function CaseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

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

  // Save Search dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState('');

  // Delete bookmark alert dialog state
  const [deleteBookmarkId, setDeleteBookmarkId] = useState<number | null>(null);
  const [deleteBookmarkName, setDeleteBookmarkName] = useState('');

  // Saved Searches dropdown open state (for refetch on open)
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);

  // Ref for bookmark name input
  const bookmarkNameRef = useRef<HTMLInputElement>(null);

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

  // Bookmarks query — enabled when dropdown is open
  const { data: bookmarks, isLoading: bookmarksLoading } = useQuery<Bookmark[]>({
    queryKey: ['bookmarks'],
    queryFn: () =>
      fetch('/api/bookmarks').then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    enabled: savedSearchesOpen,
  });

  // Save bookmark mutation
  const saveBookmarkMutation = useMutation({
    mutationFn: (payload: { name: string; requestUri: string }) =>
      fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setSaveDialogOpen(false);
      setBookmarkName('');
      toast({ title: `Search saved as '${variables.name}'` });
    },
    onError: () => {
      toast({ title: 'Failed to save search', variant: 'destructive' });
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/bookmarks/${id}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setDeleteBookmarkId(null);
      toast({ title: 'Saved search deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete saved search', variant: 'destructive' });
    },
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

  // Determine if any search params are active (for Save Search button disable)
  const hasActiveSearchParams = (() => {
    const paginationKeys = new Set(['page', 'pageSize', 'sortBy', 'sortDir']);
    for (const [key] of searchParams.entries()) {
      if (!paginationKeys.has(key)) return true;
    }
    return false;
  })();

  function handleSaveSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bookmarkName.trim()) return;
    saveBookmarkMutation.mutate({
      name: bookmarkName.trim(),
      requestUri: window.location.search,
    });
  }

  function handleBookmarkClick(bookmark: Bookmark) {
    const parsed = new URLSearchParams(bookmark.requestUri.replace(/^\?/, ''));
    setSearchParams(parsed);
    setSavedSearchesOpen(false);
  }

  function handleDeleteBookmarkClick(e: React.MouseEvent, bookmark: Bookmark) {
    e.stopPropagation(); // prevent bookmark item click
    setDeleteBookmarkId(bookmark.id);
    setDeleteBookmarkName(bookmark.name);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
        <div className="flex items-center gap-2">
          <SearchInput value={filterState.q ?? ''} onChange={q => updateFilter({ q })} />

          {/* Save Search button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSaveDialogOpen(true);
              setBookmarkName('');
            }}
            disabled={!hasActiveSearchParams}
            title="Save current search"
          >
            <Bookmark className="h-4 w-4 mr-1" aria-hidden="true" />
            Save Search
          </Button>

          {/* Saved Searches dropdown */}
          <DropdownMenu open={savedSearchesOpen} onOpenChange={setSavedSearchesOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" title="Saved searches">
                <BookmarkCheck className="h-4 w-4 mr-1" aria-hidden="true" />
                Saved Searches
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {bookmarksLoading ? (
                <>
                  <Skeleton className="h-8 mx-2 my-1" />
                  <Skeleton className="h-8 mx-2 my-1" />
                </>
              ) : !bookmarks || bookmarks.length === 0 ? (
                <DropdownMenuLabel className="text-muted-foreground font-normal">
                  No saved searches yet
                </DropdownMenuLabel>
              ) : (
                <>
                  <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {bookmarks.map(bookmark => (
                    <DropdownMenuItem
                      key={bookmark.id}
                      className="flex items-center justify-between gap-2 cursor-pointer"
                      onSelect={() => handleBookmarkClick(bookmark)}
                    >
                      <span className="truncate flex-1">{bookmark.name}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded p-0.5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={(e) => handleDeleteBookmarkClick(e, bookmark)}
                        aria-label={`Delete saved search '${bookmark.name}'`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Current Search</DialogTitle>
            <DialogDescription>
              Give this search a name to recall it later
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSearch}>
            <div className="py-2">
              <Input
                ref={bookmarkNameRef}
                placeholder="e.g. Open potholes this week"
                value={bookmarkName}
                onChange={e => setBookmarkName(e.target.value)}
                required
                minLength={1}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!bookmarkName.trim() || saveBookmarkMutation.isPending}
              >
                {saveBookmarkMutation.isPending ? 'Saving…' : 'Save Search'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Bookmark AlertDialog */}
      <AlertDialog
        open={deleteBookmarkId !== null}
        onOpenChange={open => { if (!open) setDeleteBookmarkId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved search '{deleteBookmarkName}'?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteBookmarkId !== null) {
                  deleteBookmarkMutation.mutate(deleteBookmarkId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
