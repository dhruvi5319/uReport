import {
  FileText,
  UserCheck,
  MessageSquare,
  MessageCircle,
  CheckCircle,
  RotateCcw,
  Paperclip,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TicketHistory } from '@/types/ticket';
import { cn } from '@/lib/utils';

interface TimelineProps {
  entries: TicketHistory[];
}

// Action type → lucide icon mapping
const ACTION_ICONS: Record<string, LucideIcon> = {
  open: FileText,
  assignment: UserCheck,
  response: MessageSquare,
  comment: MessageCircle,
  close: CheckCircle,
  reopen: RotateCcw,
  media: Paperclip,
  default: Activity,
};

function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No activity yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative border-l border-muted ml-4">
          {entries.map(entry => {
            const iconKey = entry.actionName.toLowerCase();
            const Icon = ACTION_ICONS[iconKey] ?? ACTION_ICONS.default;
            return (
              <li
                key={entry.id}
                className={cn('mb-6 ml-6', entry.isPending && 'opacity-60 italic')}
              >
                {/* Icon dot on timeline line */}
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-muted">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </span>

                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-sm">{entry.actionName}</span>
                  <time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>
                    {formatDateTime(entry.createdAt)}
                  </time>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{entry.actorName}</p>
                {entry.notes && <p className="text-sm">{entry.notes}</p>}

                {/* Media thumbnails strip */}
                {entry.media && entry.media.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {entry.media.map(m => (
                      <img
                        key={m.id}
                        src={m.thumbnailUrl}
                        alt={m.filename}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
