import { createContext, useContext, useState, type ReactNode } from 'react';

// All wizard form data in one flat object
export interface WizardFormData {
  // Step 1: Contact
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;

  // Step 2: Category
  categoryGroupId?: number;
  categoryGroupName?: string;
  categoryId?: number;
  categoryName?: string;

  // Step 3: Location
  address?: string;
  lat?: number;
  lon?: number;

  // Step 4: Description + Photos
  description?: string;
  photos?: File[];

  // Result (after submit)
  submittedCaseId?: string;
  submittedTicketId?: string;
}

interface WizardContextValue {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  step: number;        // 1–5 (wizard) or 6 (confirmation)
  direction: number;   // +1 forward, -1 backward
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
}

export const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<WizardFormData>({});
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const goNext = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(1, s - 1));
  };

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  return (
    <WizardContext.Provider value={{ formData, updateFormData, step, direction, goNext, goBack, goToStep }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
