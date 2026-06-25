// F13: US-13.1, US-13.2 — API Client management with one-time key display
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useClients, usePeople } from '@/hooks/useAdminApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import ClientForm from '@/components/admin/ClientForm';
import type { Client, ContactMethod } from '@/types/admin';

const ClientsPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { clients, loading, error, plainTextKey, list, create, update, remove, clearPlainTextKey, listContactMethods } = useClients();
  const { people, list: listPeople } = usePeople();

  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);
  const [showModal, setShowModal] = useState<{ editing?: Client } | null>(null);
  const [opError, setOpError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    list();
    listPeople({ role: 'staff' });
    listContactMethods().then(setContactMethods).catch(() => setContactMethods([]));
  }, []);

  const staffPeople = people.filter(p => p.role === 'staff').map(p => ({
    id: p.id, firstname: p.firstname, lastname: p.lastname,
  }));

  const handleCreate = async (data: Partial<Client>) => {
    setOpError(null);
    try {
      await create(data);
      setShowModal(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to create client');
    }
  };

  const handleUpdate = async (data: Partial<Client> & { rotateKey?: boolean }) => {
    if (!showModal?.editing) return;
    setOpError(null);
    try {
      await update(showModal.editing.id, data);
      setShowModal(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to update client');
    }
  };

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Delete client "${client.name}"?`)) return;
    setOpError(null);
    try {
      await remove(client.id);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to delete client');
    }
  };

  const handleCopyKey = async () => {
    if (!plainTextKey) return;
    try {
      await navigator.clipboard.writeText(plainTextKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // Clipboard not available, user can manually copy
    }
  };

  const handleDismissKey = () => {
    clearPlainTextKey();
    setCopiedKey(false);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>API Clients</h1>
        <button
          onClick={() => setShowModal({})}
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          + New Client
        </button>
      </div>

      <ErrorBanner error={error || opError} />

      {loading ? <LoadingSpinner /> : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>No API clients registered.</p>
          <button
            onClick={() => setShowModal({})}
            style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Create First Client
          </button>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>URL</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Contact Person</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Contact Method</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>API Key</th>
              <th style={{ padding: '0.5rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>{client.name}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>
                  {client.url ? (
                    <a href={client.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                      {client.url}
                    </a>
                  ) : '—'}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{client.contactPersonName ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{client.contactMethodName ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#9ca3af', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                  ••••••••
                </td>
                <td style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => setShowModal({ editing: client })}
                    style={{ marginRight: 4, cursor: 'pointer' }}
                  >Edit</button>
                  <button
                    onClick={() => handleDelete(client)}
                    style={{ color: '#dc2626', cursor: 'pointer' }}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* One-time API key reveal modal */}
      {plainTextKey && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 60,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '2rem', maxWidth: 520, width: '90%' }}>
            <h2 style={{ marginTop: 0, color: '#1f2937' }}>API Key Generated</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              <strong>This is the only time this key will be shown.</strong> Copy it now — it cannot be retrieved later.
            </p>
            <div style={{
              background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 6,
              padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.9rem',
              wordBreak: 'break-all', marginBottom: '1rem', userSelect: 'all',
            }}>
              {plainTextKey}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleCopyKey}
                style={{
                  padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                }}
              >
                {copiedKey ? 'Copied ✓' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleDismissKey}
                style={{
                  padding: '0.5rem 1.25rem', background: '#fff', border: '1px solid #d1d5db',
                  borderRadius: 4, cursor: 'pointer', color: '#374151',
                }}
              >
                I've Saved It — Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client create/edit modal */}
      {showModal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', maxWidth: 520, width: '90%' }}>
            <h2 style={{ marginTop: 0 }}>{showModal.editing ? 'Edit Client' : 'New API Client'}</h2>
            {opError && <ErrorBanner error={opError} />}
            <ClientForm
              initialValues={showModal.editing}
              staffPeople={staffPeople}
              contactMethods={contactMethods}
              onSubmit={showModal.editing ? handleUpdate : handleCreate}
              onCancel={() => { setShowModal(null); setOpError(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
