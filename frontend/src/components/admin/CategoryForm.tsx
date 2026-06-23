'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCategory,
  updateCategory,
  getDepartments,
  getCategoryGroups,
  type Category,
  type CreateCategoryBody,
  type Department,
  type CategoryGroup,
  type CategoryField,
} from '@/lib/api/admin';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CustomFieldBuilder } from '@/components/admin/CustomFieldBuilder';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/api-client';

interface Props {
  initialData?: Category;
}

type FormData = Omit<CreateCategoryBody, 'fields'> & { fields: CategoryField[] };

export function CategoryForm({ initialData }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<FormData>({
    name: initialData?.name ?? '',
    departmentId: initialData?.departmentId ?? 0,
    groupId: initialData?.groupId ?? null,
    slaDays: initialData?.slaDays ?? null,
    displayPermission: initialData?.displayPermission ?? 'public',
    postingPermission: initialData?.postingPermission ?? 'public',
    defaultAssigneeId: initialData?.defaultAssigneeId ?? null,
    autoCloseDays: initialData?.autoCloseDays ?? null,
    active: initialData?.active ?? true,
    fields: initialData?.fields ?? [],
  });

  useEffect(() => {
    getDepartments()
      .then((r) => setDepartments((r.data ?? []).filter((d) => d.active)))
      .catch(() => {/* silent */});
    getCategoryGroups()
      .then((r) => setGroups((r.data ?? []).filter((g) => g.active)))
      .catch(() => {/* silent */});
  }, []);

  const update = (patch: Partial<FormData>) =>
    setData((prev) => ({ ...prev, ...patch }));

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = 'Name is required';
    if (!data.departmentId) e.departmentId = 'Department is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!data.displayPermission) e.displayPermission = 'Display permission is required';
    if (!data.postingPermission) e.postingPermission = 'Posting permission is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body: CreateCategoryBody = { ...data };
      if (initialData) {
        await updateCategory(initialData.id, body);
      } else {
        await createCategory(body);
      }
      toast({ title: initialData ? 'Category updated' : 'Category created' });
      router.push('/admin/categories');
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors?.length) {
        const mapped: Record<string, string> = {};
        err.fieldErrors.forEach((fieldErr) => {
          if (fieldErr.field) mapped[fieldErr.field] = fieldErr.message;
        });
        setErrors(mapped);
        // Navigate back to step with errors
        if (mapped.name || mapped.departmentId) setStep(1);
        else if (mapped.displayPermission || mapped.postingPermission) setStep(2);
      } else {
        toast({ title: 'Failed to save category', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Basic Info', 'Permissions', 'Custom Fields'];

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="max-w-2xl"
      noValidate
    >
      {/* Step indicator */}
      <nav aria-label="Form steps" className="mb-6">
        <ol className="flex gap-2 items-center">
          {stepLabels.map((label, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i + 1 === step
                    ? 'bg-blue-600 text-white'
                    : i + 1 < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                aria-current={i + 1 === step ? 'step' : undefined}
              >
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 hidden sm:inline">{label}</span>
              {i < stepLabels.length - 1 && (
                <span className="text-gray-300 mx-1">→</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step 1 — Basic Info */}
      {step === 1 && (
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium mb-4">Basic Info</legend>

          <div>
            <Label htmlFor="cat-name">
              Name <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="cat-name"
              value={data.name}
              onChange={(e) => update({ name: e.target.value })}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'cat-name-err' : undefined}
              className="mt-1"
            />
            {errors.name && (
              <p id="cat-name-err" role="alert" className="text-sm text-red-600 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cat-dept">
              Department <span aria-hidden="true">*</span>
            </Label>
            <Select
              value={data.departmentId ? String(data.departmentId) : ''}
              onValueChange={(v) => update({ departmentId: Number(v) })}
            >
              <SelectTrigger
                id="cat-dept"
                aria-required="true"
                aria-invalid={!!errors.departmentId}
                className="mt-1"
              >
                <SelectValue placeholder="Select department…" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && (
              <p role="alert" className="text-sm text-red-600 mt-1">
                {errors.departmentId}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cat-group">Group (optional)</Label>
            <Select
              value={data.groupId ? String(data.groupId) : ''}
              onValueChange={(v) => update({ groupId: v ? Number(v) : null })}
            >
              <SelectTrigger id="cat-group" className="mt-1">
                <SelectValue placeholder="No group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No group</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cat-sla">SLA Days (0 = no SLA)</Label>
            <Input
              id="cat-sla"
              type="number"
              min="0"
              value={data.slaDays ?? ''}
              onChange={(e) =>
                update({ slaDays: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="mt-1"
            />
          </div>
        </fieldset>
      )}

      {/* Step 2 — Permissions */}
      {step === 2 && (
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium mb-4">Permissions</legend>

          <div>
            <Label>
              Display permission <span aria-hidden="true">*</span>
            </Label>
            <RadioGroup
              value={data.displayPermission}
              onValueChange={(v) =>
                update({ displayPermission: v as typeof data.displayPermission })
              }
              className="flex flex-col gap-2 mt-2"
            >
              {(['public', 'staff', 'anonymous'] as const).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <RadioGroupItem value={p} id={`disp-${p}`} />
                  <Label htmlFor={`disp-${p}`} className="capitalize font-normal">
                    {p}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.displayPermission && (
              <p role="alert" className="text-sm text-red-600 mt-1">
                {errors.displayPermission}
              </p>
            )}
          </div>

          <div>
            <Label>
              Posting permission <span aria-hidden="true">*</span>
            </Label>
            <RadioGroup
              value={data.postingPermission}
              onValueChange={(v) =>
                update({ postingPermission: v as typeof data.postingPermission })
              }
              className="flex flex-col gap-2 mt-2"
            >
              {(['staff', 'public', 'anonymous'] as const).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <RadioGroupItem value={p} id={`post-${p}`} />
                  <Label htmlFor={`post-${p}`} className="capitalize font-normal">
                    {p}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.postingPermission && (
              <p role="alert" className="text-sm text-red-600 mt-1">
                {errors.postingPermission}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cat-autoclose">Auto-close after N days (0 = disabled)</Label>
            <Input
              id="cat-autoclose"
              type="number"
              min="0"
              value={data.autoCloseDays ?? ''}
              onChange={(e) =>
                update({
                  autoCloseDays: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="mt-1"
            />
          </div>
        </fieldset>
      )}

      {/* Step 3 — Custom Fields */}
      {step === 3 && (
        <fieldset>
          <legend className="text-lg font-medium mb-4">
            Custom Fields (optional)
          </legend>
          <CustomFieldBuilder
            fields={data.fields}
            onChange={(fields) => update({ fields })}
            errors={errors}
          />
          {Object.entries(errors)
            .filter(([k]) => k.startsWith('fields'))
            .map(([k, v]) => (
              <p key={k} role="alert" className="text-sm text-red-600 mt-1">
                {v}
              </p>
            ))}
        </fieldset>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            ← Back
          </Button>
        )}
        {step < 3 && (
          <Button type="button" onClick={handleNext}>
            Next →
          </Button>
        )}
        {step === 3 && (
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Category'}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
