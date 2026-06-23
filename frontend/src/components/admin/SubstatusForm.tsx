'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import {
  createSubstatus,
  updateSubstatus,
  type Substatus,
  type CreateSubstatusBody,
} from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/api-client';

interface SubstatusFormProps {
  initialData?: Substatus;
}

export function SubstatusForm({ initialData }: SubstatusFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDefaultWarning, setShowDefaultWarning] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubstatusBody>({
    defaultValues: {
      label: initialData?.label ?? '',
      primaryStatus: initialData?.primaryStatus ?? 'open',
      isDefault: initialData?.isDefault ?? false,
      active: initialData?.active ?? true,
      sortOrder: initialData?.sortOrder ?? 0,
    },
  });

  const isDefaultValue = watch('isDefault');
  const primaryStatusValue = watch('primaryStatus');
  const activeValue = watch('active');

  const onSubmit = async (data: CreateSubstatusBody) => {
    try {
      if (initialData) {
        await updateSubstatus(initialData.id, data);
      } else {
        await createSubstatus(data);
      }
      toast({ title: initialData ? 'Substatus updated' : 'Substatus created' });
      router.push('/admin/substatuses');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors?.length) {
          err.fieldErrors.forEach((fieldErr) => {
            if (fieldErr.field) {
              setError(fieldErr.field as keyof CreateSubstatusBody, {
                message: fieldErr.message,
              });
            } else if (fieldErr.code === 'DUPLICATE_NAME') {
              setError('label', { message: fieldErr.message || 'This label already exists' });
            }
          });
        } else if (err.code === 'DUPLICATE_NAME') {
          setError('label', { message: 'This label already exists' });
        } else {
          toast({ title: 'Failed to save substatus', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Failed to save substatus', variant: 'destructive' });
      }
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="space-y-6 max-w-md"
      noValidate
    >
      {/* Label */}
      <div>
        <Label htmlFor="substatus-label">
          Label <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="substatus-label"
          {...register('label', { required: 'Label is required' })}
          aria-required="true"
          aria-invalid={!!errors.label}
          aria-describedby={errors.label ? 'label-error' : undefined}
          className="mt-1"
        />
        {errors.label && (
          <p id="label-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.label.message}
          </p>
        )}
      </div>

      {/* Primary Status */}
      <div>
        <Label>
          Primary Status <span aria-hidden="true">*</span>
        </Label>
        <Controller
          name="primaryStatus"
          control={control}
          rules={{ required: 'Primary status is required' }}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="open" id="primary-open" />
                <Label htmlFor="primary-open" className="font-normal capitalize">
                  open
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="closed" id="primary-closed" />
                <Label htmlFor="primary-closed" className="font-normal capitalize">
                  closed
                </Label>
              </div>
            </RadioGroup>
          )}
        />
        {errors.primaryStatus && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.primaryStatus.message}
          </p>
        )}
      </div>

      {/* isDefault toggle */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Switch
            id="substatus-isDefault"
            checked={isDefaultValue ?? false}
            onCheckedChange={(checked) => {
              setValue('isDefault', checked);
              setShowDefaultWarning(checked);
            }}
          />
          <Label htmlFor="substatus-isDefault">Set as default</Label>
        </div>
        {showDefaultWarning && isDefaultValue && (
          <p className="text-xs text-amber-600" role="note">
            Setting this as default will clear the current default for{' '}
            <strong>{primaryStatusValue}</strong> statuses.
          </p>
        )}
      </div>

      {/* Sort Order */}
      <div>
        <Label htmlFor="substatus-sortOrder">Sort Order</Label>
        <Input
          id="substatus-sortOrder"
          type="number"
          min="0"
          {...register('sortOrder', { valueAsNumber: true })}
          className="mt-1"
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="substatus-active"
          checked={activeValue ?? true}
          onCheckedChange={(checked) => setValue('active', checked)}
        />
        <Label htmlFor="substatus-active">Active</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Substatus'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
