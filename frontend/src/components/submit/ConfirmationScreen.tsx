import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useWizard } from '@/contexts/WizardContext';

export function ConfirmationScreen() {
  const { formData } = useWizard();

  return (
    <div className="text-center py-8" data-testid="confirmation-screen">
      {/* Success icon */}
      <div className="flex justify-center mb-4">
        <CheckCircle className="h-16 w-16 text-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>

      <p className="text-muted-foreground mb-2">Your service request has been received.</p>

      {formData.submittedTicketId && (
        <p className="text-lg font-semibold mb-6">
          Your case number is{' '}
          <span className="font-mono text-primary" data-testid="case-id">
            #{formData.submittedTicketId}
          </span>
        </p>
      )}

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        {/* View case status via Open311 GET endpoint */}
        {formData.submittedCaseId && (
          <a
            href={`/open311/v2/requests/${formData.submittedCaseId}.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline text-sm"
          >
            View case status →
          </a>
        )}

        {/* Submit another report — reloads the wizard with fresh state */}
        <Link to="/submit" reloadDocument className="text-sm text-muted-foreground underline">
          Submit another report
        </Link>
      </div>
    </div>
  );
}
