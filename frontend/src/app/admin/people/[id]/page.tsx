'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PersonForm } from '@/components/admin/PersonForm';
import { ContactMethodsPanel } from '@/components/admin/ContactMethodsPanel';
import type { Person, Department } from '@/lib/api/admin';
import { getPerson, getDepartments } from '@/lib/api/admin';

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const personId = parseInt(params.id, 10);

  const [person, setPerson] = useState<Person | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [personRes, deptsRes] = await Promise.all([
          getPerson(personId),
          getDepartments(),
        ]);
        setPerson(personRes.data);
        setDepartments(deptsRes.data);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [personId]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500" aria-live="polite" aria-busy="true">
        Loading…
      </p>
    );
  }

  if (notFound || !person) {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">Person not found.</p>
        <Link href="/admin/people" className="text-blue-600 hover:underline text-sm">
          ← Back to People
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
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
            {person.fullName}
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900">{person.fullName}</h1>

      <PersonForm
        person={person}
        departments={departments}
        onSave={(saved) => setPerson(saved)}
        onCancel={() => router.push('/admin/people')}
      />

      <ContactMethodsPanel personId={person.id} />
    </div>
  );
}
