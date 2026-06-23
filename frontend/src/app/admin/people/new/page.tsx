'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PersonForm } from '@/components/admin/PersonForm';
import type { Person, Department } from '@/lib/api/admin';
import { getDepartments } from '@/lib/api/admin';

export default function NewPersonPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => {/* non-critical */})
      .finally(() => setLoadingDepts(false));
  }, []);

  function handleSave(saved: Person) {
    router.push(`/admin/people/${saved.id}`);
  }

  function handleCancel() {
    router.push('/admin/people');
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/admin/people" className="hover:text-blue-600">
              People
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-gray-900 font-medium" aria-current="page">
            New Person
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900">New Person</h1>

      {loadingDepts ? (
        <p className="text-sm text-gray-500" aria-live="polite">Loading…</p>
      ) : (
        <PersonForm
          departments={departments}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
