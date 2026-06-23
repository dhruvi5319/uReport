'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Template, CreateTemplateBody } from '@/lib/api/admin';
import { createTemplate, updateTemplate, ApiError } from '@/lib/api/admin';

// All 11 supported template variable tokens — per UX-Mockup Flow-05 /admin/templates
const TEMPLATE_VARIABLES = [
  '{{ticket_id}}',
  '{{title}}',
  '{{category}}',
  '{{department}}',
  '{{assignee_name}}',
  '{{reporter_name}}',
  '{{status}}',
  '{{date_opened}}',
  '{{expected_close_date}}',
  '{{ticket_url}}',
  '{{response_body}}',
] as const;

interface FieldError {
  message: string;
}

interface FormErrors {
  name?: FieldError;
  body?: FieldError;
  general?: string;
}

interface TemplateFormProps {
  template?: Template;
  onSave: (saved: Template) => void;
  onCancel: () => void;
}

/**
 * Insert text at the current cursor position in a textarea.
 * Moves the cursor after the inserted text.
 */
function insertAtCursor(textarea: HTMLTextAreaElement, text: string): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = textarea.value;
  const newValue = current.slice(0, start) + text + current.slice(end);

  // Set the new value and reposition cursor after inserted text
  // Note: React controlled components need a different approach — we return the new value
  // and set cursor position via requestAnimationFrame after state update
  const newCursorPos = start + text.length;

  // Store cursor position for after re-render
  requestAnimationFrame(() => {
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
  });

  return newValue;
}

export function TemplateForm({ template, onSave, onCancel }: TemplateFormProps) {
  const isEditMode = !!template;
  const isSystemTemplate = isEditMode && template.slug !== null;

  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [body, setBody] = useState(template?.body ?? '');
  const [active, setActive] = useState(template?.active ?? true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const MAX_BODY = 10_000;

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = { message: 'Template name is required' };
    } else if (name.length > 255) {
      newErrors.name = { message: 'Name must be 255 characters or fewer' };
    }

    if (!body.trim()) {
      newErrors.body = { message: 'Body is required' };
    } else if (body.length > MAX_BODY) {
      newErrors.body = { message: `Body must be ${MAX_BODY.toLocaleString()} characters or fewer` };
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
      const payload: CreateTemplateBody = {
        name: name.trim(),
        subject: subject.trim() || null,
        body: body.trim(),
        ...(isEditMode ? { active } : {}),
      };

      const response = isEditMode
        ? await updateTemplate(template.id, payload)
        : await createTemplate(payload);

      onSave(response.data);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        const newErrors: FormErrors = {};
        for (const fe of err.fieldErrors) {
          if (fe.field === 'name') newErrors.name = { message: fe.message };
          else if (fe.field === 'body') newErrors.body = { message: fe.message };
          else newErrors.general = fe.message;
        }
        setErrors(newErrors);
      } else {
        setErrors({ general: err instanceof Error ? err.message : 'An error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleInsertVariable = useCallback(
    (variable: string) => {
      if (!bodyRef.current) return;
      const newValue = insertAtCursor(bodyRef.current, variable);
      setBody(newValue);
    },
    [],
  );

  const bodyCharCount = body.length;
  const bodyNearLimit = bodyCharCount > MAX_BODY * 0.9;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
      {/* System template notice */}
      {isSystemTemplate && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <strong>System template</strong> — The name and body can be edited, but this template
          cannot be deleted (slug: <code className="font-mono text-xs">{template.slug}</code>).
        </div>
      )}

      {errors.general && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="template-name">
          Name <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Input
          id="template-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="template-subject">Subject (optional)</Label>
        <Input
          id="template-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={255}
          placeholder="Email subject line for notification messages"
        />
      </div>

      {/* Body + Variable Hints — side by side on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Body textarea */}
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="template-body">
            Body <span aria-hidden="true" className="text-red-500">*</span>
          </Label>
          <Textarea
            id="template-body"
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="font-mono text-sm resize-y"
            aria-required="true"
            aria-invalid={!!errors.body}
            aria-describedby={
              [errors.body ? 'body-error' : '', 'body-char-count'].filter(Boolean).join(' ')
            }
          />
          <p
            id="body-char-count"
            className={`text-xs text-right ${bodyNearLimit ? 'text-amber-600 font-medium' : 'text-gray-500'}`}
            aria-live={bodyNearLimit ? 'polite' : 'off'}
          >
            {bodyCharCount.toLocaleString()} / {MAX_BODY.toLocaleString()} characters
          </p>
          {errors.body && (
            <p id="body-error" role="alert" className="text-sm text-red-600">
              {errors.body.message}
            </p>
          )}
        </div>

        {/* Variable hint panel */}
        <aside
          aria-label="Available template variables"
          className="lg:w-64 shrink-0 space-y-3"
        >
          <h3 className="text-sm font-semibold text-gray-700">Available Variables</h3>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((variable) => (
              <button
                key={variable}
                type="button"
                onClick={() => handleInsertVariable(variable)}
                aria-label={`Insert ${variable}`}
                className="inline-flex items-center rounded px-2 py-1 text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {variable}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Click a variable to insert it at the cursor position in the body.
          </p>
          <p className="text-xs text-gray-400">
            Unknown variables are flagged as warnings by the server but do not block saving.
          </p>
        </aside>
      </div>

      {/* Active — edit mode only */}
      {isEditMode && (
        <div className="flex items-center gap-3">
          <Switch
            id="template-active"
            checked={active}
            onCheckedChange={setActive}
          />
          <Label htmlFor="template-active" className="cursor-pointer">
            Active
          </Label>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Template'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
