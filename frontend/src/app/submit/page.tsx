'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/submit/StepIndicator';
import CategoryStep from '@/components/submit/CategoryStep';
import LocationStep from '@/components/submit/LocationStep';
import DetailsStep from '@/components/submit/DetailsStep';
import ContactStep from '@/components/submit/ContactStep';

interface SubmitFormState {
  step: 1 | 2 | 3 | 4;
  categoryId: number | null;
  categoryLabel: string;
  address: string;
  lat: number | null;
  lng: number | null;
  addressNormalized: string;
  geoStatus: 'idle' | 'pending' | 'confirmed' | 'failed';
  description: string;
  files: File[];
  firstName: string;
  lastName: string;
  email: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const [state, setState] = useState<SubmitFormState>({
    step: 1,
    categoryId: null,
    categoryLabel: '',
    address: '',
    lat: null,
    lng: null,
    addressNormalized: '',
    geoStatus: 'idle',
    description: '',
    files: [],
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (patch: Partial<SubmitFormState>) =>
    setState(s => ({ ...s, ...patch }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const body: Record<string, unknown> = {
        categoryId: state.categoryId,
        address: state.address || state.addressNormalized,
        lat: state.lat,
        lng: state.lng,
        description: state.description || undefined,
        reporterFirstName: state.firstName || undefined,
        reporterLastName: state.lastName || undefined,
        reporterEmail: state.email || undefined,
        title: state.categoryLabel,
      };

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (err as { errors?: { message: string }[] })?.errors?.[0]?.message ??
          'Submission failed. Please try again.';
        setSubmitError(msg);
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      const ticketId: number = (data as { data: { id: number } }).data?.id;

      // Upload files (best-effort — non-fatal if upload fails)
      if (state.files.length > 0 && ticketId) {
        for (const file of state.files) {
          const fd = new FormData();
          fd.append('file', file);
          await fetch(`${apiBase}/api/tickets/${ticketId}/media`, {
            method: 'POST',
            body: fd,
          }).catch(() => {});
        }
      }

      router.push(
        `/submit/confirmation?id=${ticketId}&category=${encodeURIComponent(
          state.categoryLabel
        )}&address=${encodeURIComponent(
          state.addressNormalized || state.address
        )}&email=${encodeURIComponent(state.email)}`
      );
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal citizen header */}
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <span className="font-semibold text-base">Report Issue</span>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-4 pb-24 max-w-lg mx-auto w-full">
        <StepIndicator currentStep={state.step} totalSteps={4} />

        <div className="mt-6 flex-1">
          {state.step === 1 && (
            <CategoryStep
              selectedId={state.categoryId}
              onSelect={(id, label) => update({ categoryId: id, categoryLabel: label })}
              onNext={() => update({ step: 2 })}
            />
          )}
          {state.step === 2 && (
            <LocationStep
              address={state.address}
              lat={state.lat}
              lng={state.lng}
              geoStatus={state.geoStatus}
              onLocationChange={patch => update(patch as Partial<SubmitFormState>)}
              onBack={() => update({ step: 1 })}
              onNext={() => update({ step: 3 })}
            />
          )}
          {state.step === 3 && (
            <DetailsStep
              description={state.description}
              files={state.files}
              onDescriptionChange={v => update({ description: v })}
              onFilesChange={files => update({ files })}
              onBack={() => update({ step: 2 })}
              onNext={() => update({ step: 4 })}
            />
          )}
          {state.step === 4 && (
            <ContactStep
              firstName={state.firstName}
              lastName={state.lastName}
              email={state.email}
              onChange={(field, value) =>
                update({ [field]: value } as Partial<SubmitFormState>)
              }
              onSubmit={handleSubmit}
              onBack={() => update({ step: 3 })}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>
      </main>
    </div>
  );
}
