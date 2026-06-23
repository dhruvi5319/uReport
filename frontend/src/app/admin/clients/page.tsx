'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ApiKeyModal } from '@/components/admin/ApiKeyModal';
import type { ApiClient, ApiClientWithKey } from '@/lib/api/admin';
import { getApiClients, revokeApiClient, updateApiClient, regenerateApiClientKey } from '@/lib/api/admin';

export default function ClientsPage() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // One-time key modal state
  const [keyModal, setKeyModal] = useState<{
    open: boolean;
    apiKey: string;
    clientName: string;
  }>({ open: false, apiKey: '', clientName: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getApiClients();
      setClients(res.data);
    } catch {
      setError('Failed to load API clients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRevoke(client: ApiClient) {
    try {
      await revokeApiClient(client.id);
      await load();
    } catch {
      // Error visible via reload
    }
  }

  async function handleReactivate(client: ApiClient) {
    try {
      await updateApiClient(client.id, { active: true });
      await load();
    } catch {
      // Error visible via reload
    }
  }

  async function handleRegenerate(client: ApiClient) {
    try {
      const res = await regenerateApiClientKey(client.id);
      const data = res.data as ApiClientWithKey;
      setKeyModal({
        open: true,
        apiKey: data.apiKey,
        clientName: client.name,
      });
    } catch {
      // Error visible via reload
    }
  }

  function handleKeyModalConfirm() {
    setKeyModal({ open: false, apiKey: '', clientName: '' });
    // Reload to reflect any state changes
    void load();
  }

  return (
    <div className="space-y-6">
      {/* One-time API key modal */}
      <ApiKeyModal
        open={keyModal.open}
        apiKey={keyModal.apiKey}
        clientName={keyModal.clientName}
        onConfirm={handleKeyModalConfirm}
      />

      {/* Page heading */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">API Clients</h1>
        <Link href="/admin/clients/new">
          <Button>+ New Client</Button>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-sm text-gray-500" aria-live="polite" aria-busy="true">
          Loading API clients…
        </p>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          {clients.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No API clients yet. Create your first Open311 API client.
            </div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Client Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Contact Email
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Key Hint
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {client.contactEmail}
                    </td>
                      <td className="px-4 py-3">
                      <Badge
                        variant={client.active ? 'default' : 'destructive'}
                        className={client.active ? 'bg-green-600 text-white' : ''}
                      >
                        {client.active ? 'Active' : 'Revoked'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {client.apiKeyHint}…
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(client.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {client.active ? (
                          <>
                            {/* Revoke */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  aria-label={`Revoke key for ${client.name}`}
                                >
                                  Revoke
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Revoke key for {client.name}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Open311 requests using this key will be immediately rejected. This action cannot be undone without regenerating the key.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => void handleRevoke(client)}
                                  >
                                    Revoke Key
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {/* Regenerate Key */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleRegenerate(client)}
                              aria-label={`Regenerate API key for ${client.name}`}
                            >
                              Regen Key
                            </Button>
                          </>
                        ) : (
                          /* Reactivate — shown only for inactive/revoked clients */
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleReactivate(client)}
                            aria-label={`Reactivate ${client.name}`}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
