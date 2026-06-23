'use client';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
  totalSteps: 4;
}

const STEP_LABELS = ['Category', 'Location', 'Details', 'Contact'];

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemax={totalSteps}
      aria-valuetext={`Step ${currentStep} of ${totalSteps}`}
      className="w-full"
    >
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = (i + 1) as 1 | 2 | 3 | 4;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          const isFuture = step > currentStep;

          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Connector line (left) */}
                {i > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isCompleted || isActive ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}

                {/* Dot */}
                <div
                  className={`w-4 h-4 rounded-full flex-shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-primary/60'
                      : isActive
                      ? 'bg-primary'
                      : 'border-2 border-muted bg-background'
                  }`}
                  aria-label={`${STEP_LABELS[i]}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
                />

                {/* Connector line (right) */}
                {i < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isCompleted ? 'bg-primary/60' : 'bg-muted'
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-1 text-xs text-center ${
                  isActive ? 'text-primary font-medium' : isFuture ? 'text-muted-foreground' : 'text-muted-foreground'
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
