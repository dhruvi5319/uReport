import type { Action } from '@/types/api';

interface AuditHistoryListProps {
  actions: Action[];
}

function ActionIcon({ type }: { type: Action['type'] }) {
  const map: Record<string, string> = {
    open: '🟢',
    assignment: '👤',
    closed: '✅',
    reopen: '🔄',
    response: '✉️',
    comment: '💬',
    upload: '📎',
    deleted: '🗑',
    merged: '🔀',
    substatus: '🏷',
  };
  return <span aria-hidden="true">{map[type] ?? '📋'}</span>;
}

function actionLabel(action: Action): string {
  switch (action.type) {
    case 'open':      return action.payload?.reason ? `Reopened: ${String(action.payload.reason)}` : 'Opened';
    case 'assignment': return `Assigned${action.payload?.assigneeId ? ` → #${String(action.payload.assigneeId)}` : ''}`;
    case 'closed':    return 'Closed';
    case 'response':  return action.payload?.body ? String(action.payload.body) : 'Response sent';
    case 'comment':   return action.payload?.body ? String(action.payload.body) : 'Comment added';
    case 'upload':    return 'Attachment added';
    case 'deleted':   return 'Deleted';
    default:          return action.type;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AuditHistoryList({ actions }: AuditHistoryListProps) {
  if (actions.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No history yet.</p>;
  }

  return (
    <ol className="space-y-3" aria-label="Ticket history">
      {actions.map((action) => (
        <li key={action.id} className="flex gap-3 text-sm">
          <div className="w-5 pt-0.5 text-center shrink-0">
            <ActionIcon type={action.type} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{action.actor?.name ?? 'System'}</span>
              <span className="text-xs text-gray-500">
                {formatDate(action.datetimeCreated)}
              </span>
              {action.visibility === 'internal' && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 border"
                  aria-label="Internal staff only"
                >
                  🔒 Internal
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-0.5 text-xs whitespace-pre-wrap break-words">
              {actionLabel(action)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
