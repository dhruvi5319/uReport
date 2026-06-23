'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CategoryStep } from './CategoryStep';
import { LocationStep } from './LocationStep';
import { DetailsStep } from './DetailsStep';
import { createTicket } from '@/lib/api/tickets';
import { useToast } from '@/components/ui/use-toast';

type Step = 1 | 2 | 3;

interface CategorySelection {
  id: number;
  name: string;
  department: { id: number; name: string } | null;
  fields?: Array<{ code: string; label: string; type: 'text' | 'select' | 'date' | 'checkbox'; options?: string[]; required?: boolean }>;
}

export function CreateTicketForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedCategory, setSelectedCategory] = useState<CategorySelection | null>(null);
  const [location, setLocation] = useState<{ address: string; lat?: number; lng?: number }>({ address: '' });
  const [details, setDetails] = useState({
    title: '', description: '',
    reporterName: '', reporterEmail: '', reporterPhone: '',
    customFields: {} as Record<string, unknown>,
  });

  const canAdvanceStep1 = selectedCategory !== null;
  const canAdvanceStep2 = location.address.trim() !== '' || (location.lat != null && location.lng != null);

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!details.title.trim()) errs.title = 'Title is required';
    else if (details.title.length > 255) errs.title = 'Title must be 255 characters or fewer';
    if (details.reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.reporterEmail)) {
      errs.reporterEmail = 'Invalid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep3() || !selectedCategory) return;
    setSubmitting(true);
    try {
      const res = await createTicket({
        title: details.title,
        description: details.description || undefined,
        categoryId: selectedCategory.id,
        address: location.address || undefined,
        lat: location.lat,
        lng: location.lng,
        reporterName: details.reporterName || undefined,
        reporterEmail: details.reporterEmail || undefined,
        reporterPhone: details.reporterPhone || undefined,
        customFields: Object.keys(details.customFields).length > 0 ? details.customFields : undefined,
      });
      toast({ title: `Ticket #${res.data.id} created` });
      router.push(`/tickets/${res.data.id}`);
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ field: string; message: string }> };
      if (e?.errors) {
        const serverErrors: Record<string, string> = {};
        for (const fe of e.errors) {
          if (fe.field) serverErrors[fe.field] = fe.message;
        }
        setErrors(serverErrors);
      } else {
        toast({ variant: 'destructive', title: 'Failed to create ticket' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const steps: Record<Step, string> = { 1: 'Category', 2: 'Location', 3: 'Details' };

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-2 text-sm">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-400">→</span>}
              <span className={`font-medium ${step === s ? 'text-blue-600' : step > s ? 'text-gray-400 line-through' : 'text-gray-400'}`}>
                {s}. {steps[s]}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {step === 1 && (
          <CategoryStep
            value={selectedCategory?.id ?? null}
            onChange={(id, cat) => setSelectedCategory({ ...cat })}
          />
        )}
        {step === 2 && (
          <LocationStep value={location} onChange={setLocation} />
        )}
        {step === 3 && (
          <DetailsStep
            value={details}
            onChange={setDetails}
            categoryFields={selectedCategory?.fields}
            errors={errors}
          />
        )}
      </div>

      {/* Sticky review/navigation bar */}
      <div className="border-t bg-white px-6 py-3 flex items-center gap-3">
        {step === 3 && selectedCategory && (
          <p className="text-xs text-gray-500 flex-1 truncate">
            {selectedCategory.name}
            {selectedCategory.department && ` → ${selectedCategory.department.name}`}
            {location.address && ` · ${location.address}`}
          </p>
        )}
        <div className="flex gap-2 ml-auto">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>
              ← Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              disabled={(step === 1 && !canAdvanceStep1) || (step === 2 && !canAdvanceStep2)}
              onClick={() => setStep((s) => (s + 1) as Step)}
            >
              Next: {steps[(step + 1) as Step]} →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Ticket'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
