'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Person, PersonRole, Department } from '@/lib/api/admin';
import { createPerson, updatePerson, ApiError } from '@/lib/api/admin';

// Human-readable role descriptions per UX-Mockup Flow-05 role table
const ROLE_OPTIONS: { value: PersonRole; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Admin — Can configure all system settings, manage users, and access all tickets',
  },
  {
    value: 'staff',
    label: 'Staff',
    description:
      'Staff — Can manage tickets in assigned departments and view all permitted categories',
  },
  {
    value: 'public',
    label: 'Public (Citizen)',
    description:
      'Public (Citizen) — Can submit and track their own tickets; no staff access',
  },
];

interface FieldError {
  message: string;
}

interface FormErrors {
  firstName?: FieldError;
  lastName?: FieldError;
  role?: FieldError;
  departmentId?: FieldError;
  general?: string;
}

interface PersonFormProps {
  person?: Person;
  departments: Department[];
  onSave: (saved: Person) => void;
  onCancel: () => void;
}

export function PersonForm({ person, departments, onSave, onCancel }: PersonFormProps) {
  const isEditMode = !!person;

  const [firstName, setFirstName] = useState(person?.firstName ?? '');
  const [lastName, setLastName] = useState(person?.lastName ?? '');
  const [role, setRole] = useState<PersonRole | ''>(person?.role ?? '');
  const [departmentId, setDepartmentId] = useState<string>(
    person?.departmentId ? String(person.departmentId) : '',
  );
  const [active, setActive] = useState(person?.active ?? true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = { message: 'First name is required' };
    } else if (firstName.length > 100) {
      newErrors.firstName = { message: 'First name must be 100 characters or fewer' };
    }

    if (!lastName.trim()) {
      newErrors.lastName = { message: 'Last name is required' };
    } else if (lastName.length > 100) {
      newErrors.lastName = { message: 'Last name must be 100 characters or fewer' };
    }

    if (!role) {
      newErrors.role = { message: 'Role is required' };
    }

    if (role === 'admin' || role === 'staff') {
      if (!departmentId) {
        newErrors.departmentId = { message: 'Department is required for admin and staff roles' };
      }
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
      const body = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role as PersonRole,
        departmentId: (role === 'admin' || role === 'staff') && departmentId
          ? parseInt(departmentId, 10)
          : null,
        ...(isEditMode ? { active } : {}),
      };

      const response = isEditMode
        ? await updatePerson(person.id, body)
        : await createPerson(body);

      onSave(response.data);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        const newErrors: FormErrors = {};
        for (const fe of err.fieldErrors) {
          if (fe.field === 'firstName') newErrors.firstName = { message: fe.message };
          else if (fe.field === 'lastName') newErrors.lastName = { message: fe.message };
          else if (fe.field === 'role') newErrors.role = { message: fe.message };
          else if (fe.field === 'departmentId') newErrors.departmentId = { message: fe.message };
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

  function handleRoleChange(newRole: string) {
    setRole(newRole as PersonRole);
    // Clear department when switching to public
    if (newRole === 'public') {
      setDepartmentId('');
    }
  }

  const showDepartmentField = role === 'admin' || role === 'staff';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {errors.general && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {/* First Name */}
      <div className="space-y-1.5">
        <Label htmlFor="firstName">
          First Name <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={100}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          aria-required="true"
          aria-invalid={!!errors.firstName}
        />
        {errors.firstName && (
          <p id="firstName-error" role="alert" className="text-sm text-red-600">
            {errors.firstName.message}
          </p>
        )}
      </div>

      {/* Last Name */}
      <div className="space-y-1.5">
        <Label htmlFor="lastName">
          Last Name <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          maxLength={100}
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          aria-required="true"
          aria-invalid={!!errors.lastName}
        />
        {errors.lastName && (
          <p id="lastName-error" role="alert" className="text-sm text-red-600">
            {errors.lastName.message}
          </p>
        )}
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label htmlFor="role-trigger">
          Role <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Select value={role} onValueChange={handleRoleChange}>
          <SelectTrigger
            id="role-trigger"
            aria-required="true"
            aria-invalid={!!errors.role}
            aria-describedby={errors.role ? 'role-error' : undefined}
            className="w-full"
          >
            <SelectValue placeholder="Select a role…" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="font-medium">{opt.label}</span>
                <span className="sr-only"> — {opt.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {role && (
          <p className="text-xs text-gray-500">
            {ROLE_OPTIONS.find((o) => o.value === role)?.description}
          </p>
        )}
        {errors.role && (
          <p id="role-error" role="alert" className="text-sm text-red-600">
            {errors.role.message}
          </p>
        )}
      </div>

      {/* Department — only for admin/staff */}
      {showDepartmentField && (
        <div className="space-y-1.5">
          <Label htmlFor="department-trigger">
            Department <span aria-hidden="true" className="text-red-500">*</span>
          </Label>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger
              id="department-trigger"
              aria-required="true"
              aria-invalid={!!errors.departmentId}
              aria-describedby={errors.departmentId ? 'dept-error' : undefined}
              className="w-full"
            >
              <SelectValue placeholder="Select a department…" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.departmentId && (
            <p id="dept-error" role="alert" className="text-sm text-red-600">
              {errors.departmentId.message}
            </p>
          )}
        </div>
      )}

      {/* Active — edit mode only */}
      {isEditMode && (
        <div className="flex items-center gap-3">
          <Switch
            id="active-switch"
            checked={active}
            onCheckedChange={setActive}
            aria-label="Account is active"
          />
          <Label htmlFor="active-switch" className="cursor-pointer">
            Active
          </Label>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Person'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
