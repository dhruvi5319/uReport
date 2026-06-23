'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TemplateForm } from '@/components/admin/TemplateForm';
import type { Template } from '@/lib/api/admin';
import { getTemplate } from '@/lib/api/admin';

export default function TemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const templateId = parseInt(params.id, 10);

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getTemplate(templateId);
        setTemplate(res.data);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [templateId]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500" aria-live="polite" aria-busy="true">
        Loading…
      </p>
    );
  }

  if (notFound || !template) {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">Template not found.</p>
        <Link href="/admin/templates" className="text-blue-600 hover:underline text-sm">
          ← Back to Templates
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/admin/templates" className="hover:text-blue-600">
              Response Templates
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-gray-900 font-medium" aria-current="page">
            {template.name}
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900">{template.name}</h1>

      <TemplateForm
        template={template}
        onSave={(saved) => setTemplate(saved)}
        onCancel={() => router.push('/admin/templates')}
      />
    </div>
  );
}
