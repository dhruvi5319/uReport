import { Badge } from '@/components/ui/badge';
import { SlaBadge } from './SlaBadge';
import type { Ticket } from '@/types/api';

interface TicketDetailHeaderProps {
  ticket: Ticket;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TicketDetailHeader({ ticket }: TicketDetailHeaderProps) {
  const statusVariant = ticket.status === 'open' ? 'default' : 'secondary';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-gray-500">#{ticket.id}</span>
        <Badge variant={statusVariant} className="capitalize">{ticket.status}</Badge>
        {ticket.substatus && (
          <Badge variant="outline">{ticket.substatus.label}</Badge>
        )}
        <SlaBadge sla={ticket.sla} />
      </div>

      <h1 className="text-xl font-semibold leading-tight">{ticket.title}</h1>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <dt className="text-gray-500 text-xs uppercase tracking-wide">Category</dt>
          <dd>{ticket.category?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs uppercase tracking-wide">Department</dt>
          <dd>{ticket.department?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500 text-xs uppercase tracking-wide">Opened</dt>
          <dd>{formatDate(ticket.datetimeOpened)}</dd>
        </div>
        {ticket.sla?.expectedCloseDate && (
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wide">Expected close</dt>
            <dd>{ticket.sla.expectedCloseDate}</dd>
          </div>
        )}
        {ticket.reporter?.name && (
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wide">Reporter</dt>
            <dd>
              {ticket.reporter.name}
              {ticket.reporter.email && (
                <span className="block text-xs text-gray-500">{ticket.reporter.email}</span>
              )}
            </dd>
          </div>
        )}
        {ticket.address && (
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wide">Location</dt>
            <dd>{ticket.address}</dd>
          </div>
        )}
      </dl>

      {ticket.description && (
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Description</p>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>
      )}
    </div>
  );
}
