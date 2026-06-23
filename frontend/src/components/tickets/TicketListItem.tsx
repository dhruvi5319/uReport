import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { SlaBadge } from './SlaBadge';
import type { Ticket } from '@/types/api';

interface TicketListItemProps {
  ticket: Ticket;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function TicketListItem({ ticket, selected, onSelect }: TicketListItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b hover:bg-gray-50 transition-colors">
      <Checkbox
        checked={selected}
        onCheckedChange={onSelect}
        aria-label={`Select ticket #${ticket.id}`}
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
      />
      <Link
        href={`/tickets/${ticket.id}`}
        className="flex-1 min-w-0 group"
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs text-gray-500 font-mono">#{ticket.id}</span>
          <SlaBadge sla={ticket.sla} />
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {ticket.status === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="font-medium text-sm group-hover:underline truncate">{ticket.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
          {ticket.department?.name && <span>{ticket.department.name}</span>}
          {ticket.assignee?.name && <span>→ {ticket.assignee.name}</span>}
          {ticket.address && <span className="truncate max-w-[200px]">{ticket.address}</span>}
          <span>{formatRelativeTime(ticket.datetimeOpened)}</span>
        </div>
      </Link>
    </div>
  );
}
