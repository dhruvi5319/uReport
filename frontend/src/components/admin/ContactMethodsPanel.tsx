'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type {
  ContactMethod,
  ContactMethodType,
  PhoneType,
  CreateContactMethodBody,
} from '@/lib/api/admin';
import {
  getContactMethods,
  createContactMethod,
  updateContactMethod,
  deleteContactMethod,
  ApiError,
} from '@/lib/api/admin';

interface ContactMethodsPanelProps {
  personId: number;
}

interface FormState {
  type: ContactMethodType | '';
  value: string;
  phoneType: PhoneType | '';
  isPrimary: boolean;
  label: string;
}

interface FormErrors {
  type?: string;
  value?: string;
  general?: string;
}

const TYPE_LABELS: Record<ContactMethodType, string> = {
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
};

const PHONE_TYPE_LABELS: Record<PhoneType, string> = {
  mobile: 'Mobile',
  office: 'Office',
  home: 'Home',
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ContactMethodsPanel({ personId }: ContactMethodsPanelProps) {
  const [methods, setMethods] = useState<ContactMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ContactMethod | null>(null);

  const [form, setForm] = useState<FormState>({
    type: '',
    value: '',
    phoneType: '',
    isPrimary: false,
    label: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await getContactMethods(personId);
      setMethods(res.data);
    } catch {
      setLoadError('Failed to load contact methods');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  function openAddDialog() {
    setEditingMethod(null);
    setForm({ type: '', value: '', phoneType: '', isPrimary: false, label: '' });
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEditDialog(method: ContactMethod) {
    setEditingMethod(method);
    setForm({
      type: method.type,
      value: method.value,
      phoneType: method.phoneType ?? '',
      isPrimary: method.isPrimary,
      label: method.label ?? '',
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function validateForm(): boolean {
    const errs: FormErrors = {};

    if (!form.type) {
      errs.type = 'Please select a contact type';
    }

    if (!form.value.trim()) {
      errs.value = 'Value is required';
    } else if (form.type === 'email' && !validateEmail(form.value)) {
      errs.value = 'Please enter a valid email address';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Check if setting isPrimary would replace an existing primary
  const existingPrimaryOfType = form.type
    ? methods.find(
        (m) =>
          m.type === form.type &&
          m.isPrimary &&
          m.id !== (editingMethod?.id ?? -1),
      )
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const body: CreateContactMethodBody = {
        type: form.type as ContactMethodType,
        value: form.value.trim(),
        isPrimary: form.isPrimary,
        phoneType: form.type === 'phone' && form.phoneType ? (form.phoneType as PhoneType) : null,
        label: form.label.trim() || null,
      };

      if (editingMethod) {
        await updateContactMethod(personId, editingMethod.id, body);
      } else {
        await createContactMethod(personId, body);
      }

      setDialogOpen(false);
      await loadMethods();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        const newErrors: FormErrors = {};
        for (const fe of err.fieldErrors) {
          if (fe.code === 'DUPLICATE_EMAIL' || fe.field === 'value') {
            newErrors.value =
              fe.code === 'DUPLICATE_EMAIL'
                ? 'This email address is already registered to another person'
                : fe.code === 'INVALID_EMAIL'
                  ? 'Please enter a valid email address'
                  : fe.message;
          } else {
            newErrors.general = fe.message;
          }
        }
        setFormErrors(newErrors);
      } else {
        setFormErrors({ general: err instanceof Error ? err.message : 'An error occurred' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(method: ContactMethod) {
    try {
      await deleteContactMethod(personId, method.id);
      await loadMethods();
    } catch {
      // error is handled by the AlertDialog action itself
    }
  }

  // Group by type
  const grouped: Record<ContactMethodType, ContactMethod[]> = {
    email: methods.filter((m) => m.type === 'email'),
    phone: methods.filter((m) => m.type === 'phone'),
    address: methods.filter((m) => m.type === 'address'),
  };

  return (
    <section aria-labelledby="contact-methods-heading" className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 id="contact-methods-heading" className="text-lg font-semibold text-gray-900">
          Contact Methods
        </h2>
        <Button type="button" size="sm" onClick={openAddDialog}>
          + Add
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500" aria-live="polite">
          Loading contact methods…
        </p>
      )}
      {loadError && (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      )}

      {!loading && !loadError && methods.length === 0 && (
        <p className="text-sm text-gray-500">
          No contact methods yet. Add an email, phone, or address.
        </p>
      )}

      {(['email', 'phone', 'address'] as ContactMethodType[]).map((type) => {
        const items = grouped[type];
        if (items.length === 0) return null;
        return (
          <div key={type} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 capitalize">{TYPE_LABELS[type]}</h3>
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200" role="list">
              {items.map((method) => (
                <li
                  key={method.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono text-gray-900 break-all">
                        {method.value}
                      </span>
                      {method.isPrimary && (
                        <span
                          title="Primary contact method"
                          className="text-amber-500"
                          aria-label="Primary"
                        >
                          ★
                        </span>
                      )}
                      {method.phoneType && (
                        <span className="text-xs text-gray-500 capitalize">
                          ({PHONE_TYPE_LABELS[method.phoneType]})
                        </span>
                      )}
                      {method.label && (
                        <span className="text-xs text-gray-500">{method.label}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(method)}
                      aria-label={`Edit ${method.value}`}
                    >
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label={`Remove ${method.value}`}
                        >
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove contact method?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove <strong>{method.value}</strong>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => void handleDelete(method)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-labelledby="cm-dialog-title" aria-describedby="cm-dialog-desc">
          <DialogHeader>
            <DialogTitle id="cm-dialog-title">
              {editingMethod ? 'Edit Contact Method' : 'Add Contact Method'}
            </DialogTitle>
            <DialogDescription id="cm-dialog-desc">
              {editingMethod
                ? 'Update the contact method details below.'
                : 'Add a new email, phone number, or address for this person.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4 mt-2">
            {formErrors.general && (
              <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {formErrors.general}
              </div>
            )}

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="cm-type">
                Type <span aria-hidden="true" className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as ContactMethodType, phoneType: '' }))}
                disabled={!!editingMethod}
              >
                <SelectTrigger
                  id="cm-type"
                  aria-required="true"
                  aria-invalid={!!formErrors.type}
                >
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.type && (
                <p role="alert" className="text-sm text-red-600">{formErrors.type}</p>
              )}
            </div>

            {/* Value */}
            <div className="space-y-1.5">
              <Label htmlFor="cm-value">
                {form.type === 'email' ? 'Email Address' : form.type === 'phone' ? 'Phone Number' : 'Address'}{' '}
                <span aria-hidden="true" className="text-red-500">*</span>
              </Label>
              <Input
                id="cm-value"
                type={form.type === 'email' ? 'email' : 'text'}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                aria-required="true"
                aria-invalid={!!formErrors.value}
                aria-describedby={formErrors.value ? 'cm-value-error' : undefined}
              />
              {formErrors.value && (
                <p id="cm-value-error" role="alert" className="text-sm text-red-600">
                  {formErrors.value}
                </p>
              )}
            </div>

            {/* Phone Type — only for phone */}
            {form.type === 'phone' && (
              <div className="space-y-1.5">
                <Label htmlFor="cm-phone-type">Phone Type</Label>
                <Select
                  value={form.phoneType}
                  onValueChange={(v) => setForm((f) => ({ ...f, phoneType: v as PhoneType }))}
                >
                  <SelectTrigger id="cm-phone-type">
                    <SelectValue placeholder="Select phone type…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="cm-label">Label (optional)</Label>
              <Input
                id="cm-label"
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Work, Personal…"
              />
            </div>

            {/* isPrimary */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cm-primary"
                  checked={form.isPrimary}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, isPrimary: checked === true }))
                  }
                />
                <Label htmlFor="cm-primary" className="cursor-pointer">
                  Set as primary {form.type || 'contact method'}
                </Label>
              </div>
              {form.isPrimary && existingPrimaryOfType && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  This will replace the current primary {TYPE_LABELS[existingPrimaryOfType.type].toLowerCase()} ({existingPrimaryOfType.value}).
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : editingMethod ? 'Save Changes' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
