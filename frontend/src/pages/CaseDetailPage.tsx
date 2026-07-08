import { useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { MetadataPanel, MetadataPanelSkeleton } from '@/components/cases/MetadataPanel';
import { ActionLogForm } from '@/components/cases/ActionLogForm';
import { Timeline } from '@/components/cases/Timeline';
import type { Ticket, TicketHistory, Media } from '@/types/ticket';

export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();

  // 3 parallel queries
  const [ticketResult, historyResult, mediaResult] = useQueries({
    queries: [
      {
        queryKey: ['ticket', id],
        queryFn: () =>
          fetch(`/api/tickets/${id}`).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
      },
      {
        queryKey: ['ticket-history', id],
        queryFn: () =>
          fetch(`/api/tickets/${id}/history`).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
      },
      {
        queryKey: ['ticket-media', id],
        queryFn: () =>
          fetch(`/api/tickets/${id}/media`).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
      },
    ],
  });

  const ticket = ticketResult.data as Ticket | undefined;
  const history = (historyResult.data as TicketHistory[]) ?? [];
  const media = (mediaResult.data as Media[]) ?? [];
  const isLoading = ticketResult.isLoading;

  // Split-pane layout:
  // Mobile: stack vertically (flex-col)
  // Desktop: flex-row — left pane w-2/5, right pane w-3/5
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left pane */}
      <div className="w-full lg:w-2/5">
        {isLoading ? (
          <MetadataPanelSkeleton />
        ) : ticket ? (
          <MetadataPanel ticket={ticket} media={media} ticketId={id!} />
        ) : (
          <div className="p-6 text-muted-foreground">Ticket not found</div>
        )}
      </div>

      {/* Right pane */}
      <div className="w-full lg:w-3/5 flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <>
            <ActionLogForm ticketId={id!} departmentId={ticket?.departmentId} />
            <Timeline entries={history} />
          </>
        )}
      </div>
    </div>
  );
}
