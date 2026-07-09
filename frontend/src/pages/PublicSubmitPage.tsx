import { AnimatePresence, motion } from 'framer-motion';
import { stepVariants } from '@/lib/animations';
import { WizardProvider, useWizard } from '@/contexts/WizardContext';
import { WizardProgress } from '@/components/submit/WizardProgress';
import { StepContact } from '@/components/submit/StepContact';
import { StepCategory } from '@/components/submit/StepCategory';
import { StepLocation } from '@/components/submit/StepLocation';
import { StepDescription } from '@/components/submit/StepDescription';
import { StepReview } from '@/components/submit/StepReview';
import { ConfirmationScreen } from '@/components/submit/ConfirmationScreen';

function WizardInner() {
  const { step, direction } = useWizard();

  const steps: Record<number, React.ReactElement> = {
    1: <StepContact />,
    2: <StepCategory />,
    3: <StepLocation />,
    4: <StepDescription />,
    5: <StepReview />,
    6: <ConfirmationScreen />,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Public branding header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Submit a Service Request</h1>
        <p className="text-muted-foreground mt-1">Report an issue to your local government</p>
      </div>

      {/* Progress indicator — shown for steps 1-5 only */}
      {step <= 5 && <WizardProgress currentStep={step} totalSteps={5} />}

      {/* Animated step container */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="mt-6"
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function PublicSubmitPage() {
  return (
    <WizardProvider>
      {/* No AppShell — public page uses minimal layout */}
      <div className="min-h-screen bg-background">
        <WizardInner />
      </div>
    </WizardProvider>
  );
}
