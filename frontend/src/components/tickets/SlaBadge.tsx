import { Badge } from '@/components/ui/badge';
import type { Ticket } from '@/types/api';

interface SlaBadgeProps {
  sla: Ticket['sla'];
}

export function SlaBadge({ sla }: SlaBadgeProps) {
  if (!sla || sla.status === 'no_sla') return null;

  if (sla.status === 'late') {
    return (
      <Badge className="bg-red-500 text-white border-transparent" aria-label="SLA breach">
        🔴 SLA Breach
      </Badge>
    );
  }

  // Within 24h: pctElapsed >= 95% of slaDays but not yet late
  const nearDue = sla.pctElapsed != null && sla.pctElapsed >= 95;

  if (nearDue) {
    return (
      <Badge className="bg-amber-500 text-white border-transparent" aria-label="Due today">
        🟡 Due today
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-500 text-white border-transparent" aria-label="On track">
      🟢 On track
    </Badge>
  );
}
