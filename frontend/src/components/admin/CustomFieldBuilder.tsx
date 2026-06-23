'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { CategoryField } from '@/lib/api/admin';

interface CustomFieldBuilderProps {
  fields: CategoryField[];
  onChange: (fields: CategoryField[]) => void;
  errors?: Record<string, string>; // keyed by "fields[i].fieldName"
}

const EMPTY_FIELD: CategoryField = { code: '', label: '', type: 'text', required: false };

export function CustomFieldBuilder({
  fields,
  onChange,
  errors = {},
}: CustomFieldBuilderProps) {
  const addField = () => onChange([...fields, { ...EMPTY_FIELD }]);

  const updateField = (index: number, patch: Partial<CategoryField>) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const removeField = (index: number) =>
    onChange(fields.filter((_, i) => i !== index));

  const addOption = (index: number) => {
    const current = fields[index].options ?? [];
    updateField(index, { options: [...current, ''] });
  };

  const updateOption = (fieldIdx: number, optIdx: number, value: string) => {
    const opts = [...(fields[fieldIdx].options ?? [])];
    opts[optIdx] = value;
    updateField(fieldIdx, { options: opts });
  };

  const removeOption = (fieldIdx: number, optIdx: number) => {
    const opts = (fields[fieldIdx].options ?? []).filter((_, i) => i !== optIdx);
    updateField(fieldIdx, { options: opts });
  };

  return (
    <section aria-label="Custom fields">
      {fields.map((field, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-3 space-y-3"
          aria-label={`Custom field ${idx + 1}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`field-code-${idx}`}>Code</Label>
              <Input
                id={`field-code-${idx}`}
                value={field.code}
                onChange={(e) => updateField(idx, { code: e.target.value })}
                placeholder="e.g. severity"
                pattern="[a-z0-9_]+"
                aria-describedby={
                  errors[`fields[${idx}].code`] ? `field-code-err-${idx}` : undefined
                }
                className="mt-1"
              />
              {errors[`fields[${idx}].code`] && (
                <p
                  id={`field-code-err-${idx}`}
                  role="alert"
                  className="text-xs text-red-600 mt-1"
                >
                  {errors[`fields[${idx}].code`]}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor={`field-label-${idx}`}>Label</Label>
              <Input
                id={`field-label-${idx}`}
                value={field.label}
                onChange={(e) => updateField(idx, { label: e.target.value })}
                placeholder="e.g. Severity"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`field-type-${idx}`}>Type</Label>
              <Select
                value={field.type}
                onValueChange={(v) =>
                  updateField(idx, {
                    type: v as CategoryField['type'],
                    options: v === 'select' ? [''] : undefined,
                  })
                }
              >
                <SelectTrigger id={`field-type-${idx}`} className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id={`field-required-${idx}`}
              checked={field.required}
              onCheckedChange={(v) => updateField(idx, { required: v })}
            />
            <Label htmlFor={`field-required-${idx}`}>Required</Label>
          </div>

          {field.type === 'select' && (
            <div>
              <Label>Options</Label>
              {(field.options ?? []).map((opt, optIdx) => (
                <div key={optIdx} className="flex gap-2 mt-1">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    aria-label={`Option ${optIdx + 1} for field ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(idx, optIdx)}
                    aria-label={`Remove option ${optIdx + 1}`}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              {errors[`fields[${idx}].options`] && (
                <p role="alert" className="text-xs text-red-600 mt-1">
                  {errors[`fields[${idx}].options`]}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => addOption(idx)}
              >
                + Add option
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => removeField(idx)}
            aria-label={`Remove field ${idx + 1}`}
          >
            ✕ Remove field
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addField}>
        + Add field
      </Button>
    </section>
  );
}
