'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ApiClient, ApiClientWithKey } from '@/lib/api/admin';
import { createApiClient, ApiError } from '@/lib/api/admin';

interface FieldError {
  message: string;
}

interface FormErrors {
  name?: FieldError;
  contactEmail?: FieldError;
  general?: string;
}

interface ClientFormProps {
  onCreated: (savedClient: ApiClient, plainApiKey: string) => void;
  onCancel: () => void;
}

function isValidEmail(email: string): boolean {
  // RFC 5322 simplified validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ClientForm({ onCreated, onCancel }: ClientFormProps) {
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = { message: 'Client name is required' };
    } else if (name.length > 255) {
      newErrors.name = { message: 'Client name must be 255 characters or fewer' };
    }

    if (!contactEmail.trim()) {
      newErrors.contactEmail = { message: 'Contact email is required' };
    } else if (!isValidEmail(contactEmail)) {
      newErrors.contactEmail = { message: 'Enter a valid email address' };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await createApiClient({
        name: name.trim(),
        contactEmail: contactEmail.trim(),
        notes: notes.trim() || null,
      });

      // The plain API key is returned only once in the creation response
      const data = response.data as ApiClientWithKey;
      const { apiKey, ...clientData } = data;
      onCreated(clientData as ApiClient, apiKey);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        const newErrors: FormErrors = {};
        for (const fe of err.fieldErrors) {
          if (fe.field === 'name' || fe.code === 'DUPLICATE_NAME') {
            newErrors.name = {
              message: fe.code === 'DUPLICATE_NAME'
                ? 'A client with this name already exists'
                : fe.message,
            };
          } else if (fe.field === 'contactEmail' || fe.code === 'INVALID_EMAIL') {
            newErrors.contactEmail = {
              message: fe.code === 'INVALID_EMAIL'
                ? 'Enter a valid email address'
                : fe.message,
            };
          } else {
            newErrors.general = fe.message;
          }
        }
        setErrors(newErrors);
      } else {
        setErrors({ general: err instanceof Error ? err.message : 'An error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
      {errors.general && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {/* Client Name */}
      <div className="space-y-1.5">
        <Label htmlFor="client-name">
          Client Name <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Input
          id="client-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          placeholder="e.g. Mobile App, Legacy Sync"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Contact Email */}
      <div className="space-y-1.5">
        <Label htmlFor="client-email">
          Contact Email <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Input
          id="client-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.contactEmail}
          aria-describedby={errors.contactEmail ? 'email-error' : undefined}
          placeholder="developer@city.gov"
        />
        {errors.contactEmail && (
          <p id="email-error" role="alert" className="text-sm text-red-600">
            {errors.contactEmail.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="client-notes">Notes (optional)</Label>
        <Textarea
          id="client-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any notes about this API client…"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create API Client'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
