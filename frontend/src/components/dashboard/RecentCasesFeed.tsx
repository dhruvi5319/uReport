import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { TicketSummary } from '@/types/ticket';

interface RecentCasesFeedProps {
  tickets: TicketSummary[];
  loading: boolean;
}

function getRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHrs < 24) return rtf.format(-diffHrs, 'hour');
  return rtf.format(-diffDays, 'day');
}

function statusVariant(status: string): 'open' | 'resolved' | 'duplicate' | 'bogus' | 'default' {
  switch (status?.toLowerCase()) {
    case 'open': return 'open';
    case 'closed':
    case 'resolved': return 'resolved';
    case 'duplicate': return 'duplicate';
    case 'bogus': return 'bogus';
    default: return 'default';
  }
}

export function RecentCasesFeed({ tickets, loading }: RecentCasesFeedProps) {
  if (loading) {
    return (
      <ul className="space-y-3" aria-label="Recent cases loading">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-1" aria-label="Recent cases">
      {tickets.map((ticket) => (
        <li
          key={ticket.id}
          className="flex flex-wrap items-center gap-2 py-2 border-b last:border-b-0 hover:bg-muted/50 transition-colors px-1 rounded"
        >
          <Badge variant="outline" className="font-mono text-xs shrink-0">
            {ticket.ticketId}
          </Badge>
          <span className="text-sm font-medium truncate max-w-[160px]">{ticket.categoryName}</span>
          <span className="text-sm text-muted-foreground truncate max-w-[120px]">{ticket.reporterName ?? '—'}</span>
          <Badge variant={statusVariant(ticket.status)} className="shrink-0">
            {ticket.status}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {getRelativeTime(ticket.enteredDate)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default RecentCasesFeed;
