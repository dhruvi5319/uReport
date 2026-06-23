'use client';
import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listTickets } from '@/lib/api/tickets';
import { TicketListItem } from '@/components/tickets/TicketListItem';
import { StatusFilter } from '@/components/tickets/StatusFilter';
import { BulkActionBar } from '@/components/tickets/BulkActionBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import type { Ticket } from '@/types/api';

function TicketsPageContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as 'open' | 'closed' | null;
  const q = searchParams.get('q') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [, startTransition] = useTransition();

  const fetchTickets = () => {
    setLoading(true);
    listTickets({ status: status ?? undefined, q, page, perPage: 25 })
      .then((res) => {
        setTickets(res.data);
        setTotal((res.meta as { total?: number })?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    startTransition(fetchTickets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, page]);

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? tickets.map((t) => t.id) : []);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search + controls row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Input
          placeholder="Search tickets…"
          className="max-w-sm"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const next = new URLSearchParams(searchParams.toString());
              next.set('q', (e.target as HTMLInputElement).value);
              window.history.pushState({}, '', `/tickets?${next.toString()}`);
              fetchTickets();
            }
          }}
          aria-label="Search tickets"
        />
        <StatusFilter />
        <div className="ml-auto">
          <Button asChild size="sm">
            <Link href="/tickets/new">+ New Ticket</Link>
          </Button>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 border-b">
        <input
          type="checkbox"
          aria-label="Select all"
          checked={selectedIds.length === tickets.length && tickets.length > 0}
          onChange={(e) => toggleAll(e.target.checked)}
          className="h-4 w-4"
        />
        <span>{total} results</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse mx-4 my-1 rounded" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500" data-testid="empty-state">
            <p>No tickets match your filters.</p>
            <Button variant="link" onClick={() => window.location.href = '/tickets'}>
              Clear filters
            </Button>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              selected={selectedIds.includes(ticket.id)}
              onSelect={(checked) => toggleSelect(ticket.id, checked as boolean)}
            />
          ))
        )}
      </div>

      {/* Bulk action bar — fixed bottom */}
      <BulkActionBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        onComplete={fetchTickets}
      />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-6 animate-pulse">Loading tickets…</div>}>
      <TicketsPageContent />
    </Suspense>
  );
}
