'use client';

import MediaUploadButton from './MediaUploadButton';

type FieldType = 'text' | 'select' | 'date' | 'checkbox';

interface CategoryField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

interface DetailsStepProps {
  description: string;
  files: File[];
  customFields?: CategoryField[];
  customFieldValues?: Record<string, string | boolean>;
  onDescriptionChange: (v: string) => void;
  onFilesChange: (files: File[]) => void;
  onCustomFieldChange?: (id: string, value: string | boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function DetailsStep({
  description,
  files,
  customFields = [],
  customFieldValues = {},
  onDescriptionChange,
  onFilesChange,
  onCustomFieldChange,
  onBack,
  onNext,
}: DetailsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Tell us more (optional)</h2>

      {/* Description textarea */}
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Describe the problem in a few words. Where exactly? How severe?"
          className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
        <span className="text-xs text-muted-foreground text-right">
          {description.length} / 5000
        </span>
      </div>

      {/* Photo upload */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">Photos</span>
        <MediaUploadButton files={files} onFilesChange={onFilesChange} />
      </div>

      {/* Custom fields */}
      {customFields.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Additional information</span>
          {customFields.map(field => (
            <div key={field.id} className="flex flex-col gap-1">
              <label htmlFor={`cf-${field.id}`} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  id={`cf-${field.id}`}
                  type="text"
                  value={(customFieldValues[field.id] as string) ?? ''}
                  onChange={e => onCustomFieldChange?.(field.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}

              {field.type === 'select' && (
                <select
                  id={`cf-${field.id}`}
                  value={(customFieldValues[field.id] as string) ?? ''}
                  onChange={e => onCustomFieldChange?.(field.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select...</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'date' && (
                <input
                  id={`cf-${field.id}`}
                  type="date"
                  value={(customFieldValues[field.id] as string) ?? ''}
                  onChange={e => onCustomFieldChange?.(field.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}

              {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id={`cf-${field.id}`}
                    type="checkbox"
                    checked={(customFieldValues[field.id] as boolean) ?? false}
                    onChange={e => onCustomFieldChange?.(field.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation — always enabled (step is optional) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 h-11 rounded-md border font-medium hover:bg-muted/50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 h-11 rounded-md bg-primary text-primary-foreground font-medium transition-opacity"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
