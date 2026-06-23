'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTicket, getTicketHistory } from '@/lib/api/tickets';
import { TicketDetailHeader } from '@/components/tickets/TicketDetailHeader';
import { ActionsPanel } from '@/components/tickets/ActionsPanel';
import { AuditHistoryList } from '@/components/tickets/AuditHistoryList';
import { Button } from '@/components/ui/button';
import type { Ticket, Action } from '@/types/api';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = parseInt(id, 10);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tRes, hRes] = await Promise.all([
        getTicket(ticketId),
        getTicketHistory(ticketId),
      ]);
      setTicket(tRes.data);
      setHistory(hRes.data);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex gap-6 p-6 animate-pulse">
        <div className="flex-1 space-y-4">
          <div className="h-6 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
        <div className="w-72 shrink-0 h-96 bg-gray-100 rounded" />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="mb-4">Ticket not found.</p>
        <Button asChild variant="outline"><Link href="/tickets">← Back to list</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-2 border-b text-sm">
        <Link href="/tickets" className="text-gray-500 hover:underline">
          ← Tickets
        </Link>
        <span className="text-gray-500">/</span>
        <span className="font-medium">#{ticket.id}</span>
      </div>

      {/* 2-panel layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left: info + history */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 min-w-0">
          <TicketDetailHeader ticket={ticket} />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              History &amp; Audit Trail
            </h2>
            <AuditHistoryList actions={history} />
          </div>
        </div>

        {/* Right: actions sidebar (desktop) / bottom sheet trigger (mobile) */}
        <ActionsPanel
          ticket={ticket}
          onMutated={load}
        />
      </div>
    </div>
  );
}
