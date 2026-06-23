'use client';

import { useState } from 'react';

interface ContactStepProps {
  firstName: string;
  lastName: string;
  email: string;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactStep({
  firstName,
  lastName,
  email,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
}: ContactStepProps) {
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError(null);
    }
  };

  const handleSubmitClick = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    onSubmit();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Contact info (optional)</h2>
      <p className="text-sm text-muted-foreground">
        We&apos;ll use this to send you updates on your report.
      </p>

      {/* Soft warning when email is empty */}
      {!email && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
          Without an email you won&apos;t receive a confirmation.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* First name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="firstName" className="text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={e => onChange('firstName', e.target.value)}
            autoComplete="given-name"
            className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Last name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="lastName" className="text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={e => onChange('lastName', e.target.value)}
            autoComplete="family-name"
            className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => {
              onChange('email', e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={handleEmailBlur}
            autoComplete="email"
            className={`w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50 ${
              emailError ? 'border-red-400 focus:ring-red-300' : ''
            }`}
          />
          {emailError && (
            <p className="text-sm text-red-600">{emailError}</p>
          )}
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-md border font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            className="flex-1 h-11 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-70 transition-opacity flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>Submitting your report...</span>
              </>
            ) : (
              'Submit My Report'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
