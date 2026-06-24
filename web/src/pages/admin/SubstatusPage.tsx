// F8: US-8.1, US-8.2 — Substatus CRUD with default management and system protection
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useSubstatuses } from '@/hooks/useAdminApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import SubstatusForm from '@/components/admin/SubstatusForm';
import type { Substatus } from '@/types/admin';

const systemBadge = (
  <span style={{
    fontSize: '0.7rem', background: '#e5e7eb', color: '#6b7280',
    padding: '0.1rem 0.4rem', borderRadius: 12, marginLeft: '0.4rem', fontWeight: 600,
  }}>
    System
  </span>
);

const defaultBadge = (
  <span style={{
    fontSize: '0.7rem', background: '#fef3c7', color: '#92400e',
    padding: '0.1rem 0.4rem', borderRadius: 12, marginLeft: '0.4rem', fontWeight: 600,
  }}>
    ★ Default
  </span>
);

const SubstatusPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { substatuses, loading, error, list, create, update, remove } = useSubstatuses();
  const [showModal, setShowModal] = useState<{ status: 'open' | 'closed'; editing?: Substatus } | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  useEffect(() => { list(); }, []);

  const openSubstatuses = substatuses.filter(s => s.status === 'open');
  const closedSubstatuses = substatuses.filter(s => s.status === 'closed');

  const handleCreate = async (data: Partial<Substatus>) => {
    setOpError(null);
    try {
      await create(data);
      setShowModal(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to create substatus');
    }
  };

  const handleUpdate = async (data: Partial<Substatus>) => {
    if (!showModal?.editing) return;
    setOpError(null);
    try {
      await update(showModal.editing.id, data);
      setShowModal(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to update substatus');
    }
  };

  const handleSetDefault = async (s: Substatus) => {
    setOpError(null);
    try {
      await update(s.id, { isDefault: true });
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to set default');
    }
  };

  const handleDelete = async (s: Substatus) => {
    if (!window.confirm(`Delete substatus "${s.name}"?`)) return;
    setOpError(null);
    try {
      await remove(s.id);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to delete substatus');
    }
  };

  const renderColumn = (statusType: 'open' | 'closed', items: Substatus[]) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'capitalize' }}>{statusType} Substatuses</h2>
        <button
          onClick={() => setShowModal({ status: statusType })}
          style={{ padding: '0.3rem 0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}
        >
          + New
        </button>
      </div>

      {items.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No {statusType} substatuses.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(s => (
          <li
            key={s.id}
            style={{
              padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6,
              marginBottom: '0.4rem', background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{s.name}</span>
                {s.isSystem && systemBadge}
                {s.isDefault && defaultBadge}
                {s.description && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>{s.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                {!s.isDefault && (
                  <button
                    onClick={() => handleSetDefault(s)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', border: '1px solid #d97706', color: '#d97706', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
                    title="Set as default"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => setShowModal({ status: s.status, editing: s })}
                  disabled={s.isSystem}
                  style={{
                    padding: '0.2rem 0.5rem', fontSize: '0.75rem', border: '1px solid #ccc',
                    borderRadius: 4, cursor: s.isSystem ? 'not-allowed' : 'pointer',
                    background: '#fff', opacity: s.isSystem ? 0.4 : 1,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={s.isSystem}
                  style={{
                    padding: '0.2rem 0.5rem', fontSize: '0.75rem', border: '1px solid #fca5a5',
                    borderRadius: 4, cursor: s.isSystem ? 'not-allowed' : 'pointer',
                    color: '#dc2626', background: '#fff', opacity: s.isSystem ? 0.4 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Substatuses</h1>

      <ErrorBanner error={error || opError} />

      {loading ? <LoadingSpinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {renderColumn('open', openSubstatuses)}
          {renderColumn('closed', closedSubstatuses)}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', maxWidth: 440, width: '90%' }}>
            <h2 style={{ marginTop: 0 }}>
              {showModal.editing ? 'Edit Substatus' : `New ${showModal.status} Substatus`}
            </h2>
            {opError && <ErrorBanner error={opError} />}
            <SubstatusForm
              initialValues={showModal.editing}
              defaultStatus={showModal.status}
              onSubmit={showModal.editing ? handleUpdate : handleCreate}
              onCancel={() => { setShowModal(null); setOpError(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubstatusPage;
