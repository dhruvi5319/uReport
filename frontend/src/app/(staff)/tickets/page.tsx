// frontend/src/app/(staff)/tickets/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { exportCsv } from '@/lib/api/search';
import { FilterPanel } from './components/FilterPanel';
import { SortBar } from './components/SortBar';
import { TicketResultsList } from './components/TicketResultsList';
import { useTicketSearch } from './hooks/useTicketSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { TicketSearchParams } from '@/types/search';

function TicketsPageContent() {
  const { user } = useAuth();
  const router   = useRouter();
  const {
    params, setParam, results, facets, meta,
    isLoading, error, isSearchUnavailable,
  } = useTicketSearch();

  const canExport = user?.role === 'staff' || user?.role === 'admin';

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Search bar + actions row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            type="search"
            placeholder="Search tickets…"
            value={params.q ?? ''}
            onChange={(e) => setParam({ q: e.target.value || undefined })}
            className="flex-1 min-w-48 h-9"
            aria-label="Search tickets"
          />
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(params)}
              aria-label="Export CSV"
            >
              Export CSV
            </Button>
          )}
          <Link href={`/map?${new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          ).toString()}`}>
            <Button variant="outline" size="sm" aria-label="Switch to map view">
              🗺 Map View
            </Button>
          </Link>
          <Link href="/tickets/new">
            <Button size="sm">+ New Ticket</Button>
          </Link>
        </div>

        {/* Solr unavailable banner */}
        {isSearchUnavailable && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            Search temporarily unavailable. Showing all tickets.
          </div>
        )}

        {/* Generic error banner */}
        {error && !isSearchUnavailable && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Filter sidebar */}
          <FilterPanel
            params={params}
            facets={facets}
            onParamChange={(updates: Partial<TicketSearchParams>) => setParam(updates)}
          />

          {/* Results area */}
          <div className="flex-1 min-w-0">
            <SortBar
              sort={params.sort}
              total={meta?.total ?? 0}
              onSortChange={(s) => setParam({ sort: s })}
            />
            <TicketResultsList
              tickets={results}
              isLoading={isLoading}
              meta={meta}
              onPageChange={(page) => setParam({ page })}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
      <TicketsPageContent />
    </Suspense>
  );
}
