import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number; // 5
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <nav aria-label="Submission progress" className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(stepNum => {
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                isCompleted && 'bg-primary text-primary-foreground',
                isCurrent && 'border-2 border-primary text-primary',
                !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
              )}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${stepNum}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
            </div>
            {/* Connector line between steps */}
            {stepNum < totalSteps && (
              <div className={cn('h-px w-8 transition-colors', stepNum < currentStep ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
