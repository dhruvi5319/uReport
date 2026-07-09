import { useMutation } from '@tanstack/react-query';
import { useWizard } from '@/contexts/WizardContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function StepReview() {
  const { formData, updateFormData, goBack, goToStep } = useWizard();

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Build FormData to include photo files alongside ticket fields
      const form = new FormData();
      if (formData.firstname) form.append('firstname', formData.firstname);
      if (formData.lastname) form.append('lastname', formData.lastname);
      if (formData.email) form.append('email', formData.email);
      if (formData.phone) form.append('phone', formData.phone);
      if (formData.categoryId !== undefined) form.append('categoryId', String(formData.categoryId));
      if (formData.address) form.append('location', formData.address);
      if (formData.lat !== undefined) form.append('lat', String(formData.lat));
      if (formData.lon !== undefined) form.append('lon', String(formData.lon));
      if (formData.description) form.append('description', formData.description);
      formData.photos?.forEach(file => form.append('photos', file));

      const res = await fetch('/api/tickets/public', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Submission failed');
      return res.json() as Promise<{ id: number; ticketId: string }>;
    },
    onSuccess: (data) => {
      // Store case ID in WizardContext and navigate to confirmation (step 6)
      updateFormData({ submittedCaseId: String(data.id), submittedTicketId: data.ticketId });
      goToStep(6);
    },
  });

  const reviewRows = [
    { label: 'Name', value: [formData.firstname, formData.lastname].filter(Boolean).join(' ') || 'Anonymous' },
    { label: 'Email', value: formData.email || '—' },
    { label: 'Phone', value: formData.phone || '—' },
    { label: 'Category', value: formData.categoryName || '—' },
    { label: 'Location', value: formData.address || (formData.lat && formData.lon ? `${formData.lat.toFixed(5)}, ${formData.lon.toFixed(5)}` : '—') },
    { label: 'Description', value: formData.description || '—' },
    { label: 'Photos', value: formData.photos?.length ? `${formData.photos.length} photo(s)` : 'None' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Report</CardTitle>
        <CardDescription>Please confirm the details below before submitting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="divide-y">
          {reviewRows.map(({ label, value }) => (
            <div key={label} className="py-3 flex justify-between items-start gap-4">
              <dt className="text-sm font-medium text-muted-foreground w-24 shrink-0">{label}</dt>
              <dd className="text-sm text-right break-words max-w-xs">{value}</dd>
            </div>
          ))}
        </dl>

        {submitMutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            Submission failed. Please try again.
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={goBack}>← Back</Button>
          <Button
            className="flex-1"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit Report'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
