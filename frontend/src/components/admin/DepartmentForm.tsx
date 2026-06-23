'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  createDepartment,
  updateDepartment,
  type Department,
  type CreateDepartmentBody,
} from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/api-client';

interface DepartmentFormProps {
  initialData?: Department;
}

export function DepartmentForm({ initialData }: DepartmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateDepartmentBody>({
    defaultValues: {
      name: initialData?.name ?? '',
      active: initialData?.active ?? true,
    },
  });

  const activeValue = watch('active');

  const onSubmit = async (data: CreateDepartmentBody) => {
    try {
      if (initialData) {
        await updateDepartment(initialData.id, data);
      } else {
        await createDepartment(data);
      }
      toast({ title: initialData ? 'Department updated' : 'Department created' });
      router.push('/admin/departments');
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors?.length) {
        err.fieldErrors.forEach((fieldErr) => {
          if (fieldErr.field) {
            setError(fieldErr.field as keyof CreateDepartmentBody, {
              message: fieldErr.message,
            });
          }
        });
      } else {
        toast({ title: 'Failed to save department', variant: 'destructive' });
      }
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="space-y-6 max-w-md"
      noValidate
    >
      <div>
        <Label htmlFor="name">
          Name <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="name"
          {...register('name', { required: 'Name is required' })}
          aria-required="true"
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={!!errors.name}
          className="mt-1"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-1 text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="active"
          checked={activeValue ?? true}
          onCheckedChange={(checked) => setValue('active', checked)}
        />
        <Label htmlFor="active">Active</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Department'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
