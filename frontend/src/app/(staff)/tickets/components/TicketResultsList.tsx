// frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx
'use client';

import Link from 'next/link';
import type { TicketListItem, SlaStatus } from '@/types/search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TicketResultsListProps {
  tickets: TicketListItem[];
  isLoading: boolean;
  meta: { total: number; page: number; pages: number } | null;
  onPageChange: (page: number) => void;
}

const SLA_BADGE_CONFIG: Record<SlaStatus, { label: string; className: string }> = {
  breach:  { label: '🔴 SLA Breach',   className: 'bg-red-100 text-red-700 border-red-200' },
  warning: { label: '🟡 Due Today',    className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ok:      { label: '🟢 On Track',     className: 'bg-green-100 text-green-700 border-green-200' },
  none:    { label: '',                className: '' },
};

function SlaBadge({ status }: { status?: SlaStatus }) {
  if (!status || status === 'none') return null;
  const cfg = SLA_BADGE_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.className}`}
      aria-label={`SLA status: ${status}`}
    >
      {cfg.label}
    </span>
  );
}

function TicketRow({ ticket }: { ticket: TicketListItem & { slaStatus?: SlaStatus } }) {
  const openedDate = new Date(ticket.datetimeOpened).toLocaleDateString();

  return (
    <li className="border-b last:border-b-0 py-3 px-1 hover:bg-gray-50 transition-colors">
      <Link
        href={`/tickets/${ticket.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        aria-label={`Ticket #${ticket.id}: ${ticket.title}`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-label={`Select ticket ${ticket.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 accent-blue-600 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm text-gray-900 truncate max-w-xs">
                #{ticket.id} {ticket.title}
              </span>
              <SlaBadge status={(ticket as TicketListItem & { slaStatus?: SlaStatus }).slaStatus} />
              <Badge
                variant="outline"
                className={ticket.status === 'open' ? 'text-blue-700 border-blue-200' : 'text-gray-500 border-gray-200'}
              >
                {ticket.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              {ticket.address && <span className="truncate max-w-xs">{ticket.address}</span>}
              <span>Dept {ticket.departmentId}</span>
              {ticket.assigneeId && <span>Assignee #{ticket.assigneeId}</span>}
              <span>{openedDate}</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function TicketResultsList({ tickets, isLoading, meta, onPageChange }: TicketResultsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading tickets">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400" role="status">
        <p className="text-sm">No tickets match your filters.</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} />
        ))}
      </ul>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Page {meta.page} of {meta.pages} ({meta.total.toLocaleString()} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="Previous page"
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.pages}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="Next page"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
