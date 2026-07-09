import { cn } from '@/lib/utils';

interface SlaProgressBarProps {
  slaDays?: number;
  enteredDate: string;
  isOverdue?: boolean;
}

export function SlaProgressBar({ slaDays, enteredDate, isOverdue }: SlaProgressBarProps) {
  if (!slaDays) return null;

  const entered = new Date(enteredDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  const percent = Math.min(100, Math.round((elapsed / slaDays) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>SLA: {elapsed} / {slaDays} days</span>
        {isOverdue && <span className="text-destructive font-medium">OVERDUE</span>}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isOverdue ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`SLA progress: ${percent}%`}
        />
      </div>
    </div>
  );
}
