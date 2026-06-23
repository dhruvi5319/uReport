'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TemplateForm } from '@/components/admin/TemplateForm';
import type { Template } from '@/lib/api/admin';

export default function NewTemplatePage() {
  const router = useRouter();

  function handleSave(saved: Template) {
    router.push(`/admin/templates/${saved.id}`);
  }

  function handleCancel() {
    router.push('/admin/templates');
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
            New Template
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900">New Template</h1>

      <TemplateForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
