'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientForm } from '@/components/admin/ClientForm';
import { ApiKeyModal } from '@/components/admin/ApiKeyModal';
import type { ApiClient } from '@/lib/api/admin';

export default function NewClientPage() {
  const router = useRouter();

  // One-time API key modal state — stored here after creation
  const [keyModal, setKeyModal] = useState<{
    open: boolean;
    apiKey: string;
    clientName: string;
  }>({ open: false, apiKey: '', clientName: '' });

  function handleCreated(savedClient: ApiClient, plainApiKey: string) {
    // Store the key and open modal (only chance to see it)
    setKeyModal({
      open: true,
      apiKey: plainApiKey,
      clientName: savedClient.name,
    });
  }

  function handleModalConfirm() {
    // Clear key from state and navigate away
    setKeyModal({ open: false, apiKey: '', clientName: '' });
    router.push('/admin/clients');
  }

  function handleCancel() {
    router.push('/admin/clients');
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* One-time API key modal — shown after successful create */}
      <ApiKeyModal
        open={keyModal.open}
        apiKey={keyModal.apiKey}
        clientName={keyModal.clientName}
        onConfirm={handleModalConfirm}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/admin/clients" className="hover:text-blue-600">
              API Clients
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-gray-900 font-medium" aria-current="page">
            New Client
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900">New API Client</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
        After creating the client, the API key will be displayed <strong>once only</strong>.
        Save it in a secure location before closing the modal.
      </div>

      <ClientForm onCreated={handleCreated} onCancel={handleCancel} />
    </div>
  );
}
