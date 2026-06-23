'use client';

interface Action {
  id: number;
  type: string;
  visibility: string;
  datetimeCreated: string;
  payload?: Record<string, unknown>;
}

interface PublicHistoryProps {
  actions: Action[];
}

function getActionLabel(type: string): string {
  if (type === 'open') return 'Report opened';
  if (type === 'response') return 'Staff response';
  if (type === 'closed') return 'Report closed';
  return type;
}

export default function PublicHistory({ actions }: PublicHistoryProps) {
  // Filter out any internal actions (external-only; internal comments excluded)
  const publicActions = actions.filter(
    a => a.visibility === 'external' || a.type === 'open' || a.type === 'closed'
  );

  if (publicActions.length === 0) {
    return (
      <section aria-label="Report updates">
        <h2 className="font-semibold mb-3">Updates</h2>
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      </section>
    );
  }

  return (
    <section aria-label="Report updates">
      <h2 className="font-semibold mb-3">Updates</h2>
      <ol className="flex flex-col gap-4">
        {publicActions.map(action => (
          <li
            key={action.id}
            className="border-l-2 border-muted pl-4 flex flex-col gap-1"
          >
            <time
              dateTime={action.datetimeCreated}
              className="text-xs text-muted-foreground"
            >
              {new Date(action.datetimeCreated).toLocaleString()}
            </time>
            <p className="text-sm font-medium capitalize">
              {getActionLabel(action.type)}
            </p>
            {action.type === 'response' && action.payload && (
              <p className="text-sm text-muted-foreground">
                {String(action.payload.body ?? action.payload.text ?? '')}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
