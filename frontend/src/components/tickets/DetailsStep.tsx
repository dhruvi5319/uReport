'use client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CategoryField {
  code: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'checkbox';
  options?: string[];
  required?: boolean;
}

interface DetailsValue {
  title: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  customFields: Record<string, unknown>;
}

interface DetailsStepProps {
  value: DetailsValue;
  onChange: (v: DetailsValue) => void;
  categoryFields?: CategoryField[];
  errors?: Record<string, string>;
}

export function DetailsStep({ value, onChange, categoryFields = [], errors = {} }: DetailsStepProps) {
  const set = (key: keyof DetailsValue, val: unknown) =>
    onChange({ ...value, [key]: val });

  const setCustomField = (code: string, val: unknown) =>
    onChange({ ...value, customFields: { ...value.customFields, [code]: val } });

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <Label htmlFor="ticket-title">
          Title <span aria-hidden="true" className="text-red-600">*</span>
        </Label>
        <Input
          id="ticket-title"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          maxLength={255}
          placeholder="Brief description of the issue"
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className="mt-1"
        />
        {errors.title && (
          <p id="title-error" className="text-xs text-red-600 mt-1" role="alert">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="ticket-desc">Description</Label>
        <Textarea
          id="ticket-desc"
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Describe the problem in a few words. Where exactly? How severe?"
          className="mt-1 resize-none"
        />
      </div>

      {/* Dynamic custom fields */}
      {categoryFields.length > 0 && (
        <div className="space-y-3 pt-2 border-t">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Category Details
          </p>
          {categoryFields.map((field) => (
            <div key={field.code}>
              <Label htmlFor={`cf-${field.code}`}>
                {field.label}
                {field.required && <span aria-hidden="true" className="text-red-600 ml-0.5">*</span>}
              </Label>
              {field.type === 'select' ? (
                <select
                  id={`cf-${field.code}`}
                  className="mt-1 w-full border rounded px-2 py-1.5 text-sm"
                  value={String(value.customFields[field.code] ?? '')}
                  onChange={(e) => setCustomField(field.code, e.target.value)}
                >
                  <option value="">Select…</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <input
                  id={`cf-${field.code}`}
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={Boolean(value.customFields[field.code])}
                  onChange={(e) => setCustomField(field.code, e.target.checked)}
                />
              ) : (
                <Input
                  id={`cf-${field.code}`}
                  type={field.type === 'date' ? 'date' : 'text'}
                  value={String(value.customFields[field.code] ?? '')}
                  onChange={(e) => setCustomField(field.code, e.target.value)}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reporter (optional) */}
      <div className="space-y-3 pt-2 border-t">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Reporter (optional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="reporter-name">Name</Label>
            <Input
              id="reporter-name"
              value={value.reporterName}
              onChange={(e) => set('reporterName', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="reporter-email">Email</Label>
            <Input
              id="reporter-email"
              type="email"
              value={value.reporterEmail}
              onChange={(e) => set('reporterEmail', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="reporter-phone">Phone</Label>
            <Input
              id="reporter-phone"
              type="tel"
              value={value.reporterPhone}
              onChange={(e) => set('reporterPhone', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
