// F9: US-9.1, US-9.2, US-9.3 — Actions CRUD with system protection and category response overrides
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useActions, useCategories } from '@/hooks/useAdminApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import ActionForm from '@/components/admin/ActionForm';
import CategoryResponseOverrideForm from '@/components/admin/CategoryResponseOverrideForm';
import type { Action } from '@/types/admin';

const systemBadge = (
  <span style={{
    fontSize: '0.7rem', background: '#e5e7eb', color: '#6b7280',
    padding: '0.1rem 0.4rem', borderRadius: 12, marginLeft: '0.4rem', fontWeight: 600,
  }}>
    System
  </span>
);

const ActionsPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { actions, loading, error, list, create, update, remove } = useActions();
  const { categories, list: listCategories, upsertActionResponse } = useCategories();

  const [showModal, setShowModal] = useState<{ editing?: Action } | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  useEffect(() => {
    list();
    listCategories();
  }, []);

  const systemActions = actions.filter(a => a.type === 'system');
  const deptActions = actions.filter(a => a.type === 'department');

  const handleCreate = async (data: Partial<Action>) => {
    setOpError(null);
    try {
      await create({ ...data, type: 'department' });
      setShowModal(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to create action');
    }
  };

  const handleUpdate = async (data: Partial<Action>) => {
    if (!showModal?.editing) return;
    setOpError(null);
    try {
      await update(showModal.editing.id, data);
      setShowModal(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to update action');
    }
  };

  const handleDelete = async (a: Action) => {
    if (!window.confirm(`Delete action "${a.name}"?`)) return;
    setOpError(null);
    try {
      await remove(a.id);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setOpError(err.response?.data?.message ?? 'Failed to delete action');
    }
  };

  const handleCategoryOverride = async (
    categoryId: number, actionId: number, template: string | null, replyEmail: string | null
  ) => {
    await upsertActionResponse(categoryId, { action_id: actionId, template, replyEmail });
  };

  const categorySummaries = categories.map(c => ({ id: c.id, name: c.name }));

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Action Types</h1>

      <ErrorBanner error={error || opError} />

      {loading ? <LoadingSpinner /> : (
        <>
          {/* System Actions (read-only) */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>System Actions</h2>
            {systemActions.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No system actions.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Template</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Reply Email</th>
                    <th style={{ padding: '0.5rem' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {systemActions.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>
                        {a.name}{systemBadge}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.template ?? '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{a.replyEmail ?? '—'}</td>
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', background: '#e5e7eb', padding: '0.1rem 0.4rem', borderRadius: 4 }}>System</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Department Actions (editable) */}
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Department Actions</h2>
              <button
                onClick={() => setShowModal({})}
                style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                + New Action
              </button>
            </div>

            {deptActions.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No department actions. Create one to get started.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Template</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Reply Email</th>
                    <th style={{ padding: '0.5rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {deptActions.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>{a.name}</td>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.template ?? '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{a.replyEmail ?? '—'}</td>
                      <td style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setShowModal({ editing: a })}
                          style={{ marginRight: 4, cursor: 'pointer' }}
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(a)}
                          style={{ color: '#dc2626', cursor: 'pointer' }}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Category Response Override Form */}
          <section>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Category Response Overrides</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
              Override the response template and reply email for a specific action within a specific category.
            </p>
            <CategoryResponseOverrideForm
              categories={categorySummaries}
              actions={actions}
              onSubmit={handleCategoryOverride}
            />
          </section>
        </>
      )}

      {/* Modal */}
      {showModal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', maxWidth: 560, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>{showModal.editing ? 'Edit Action' : 'New Action'}</h2>
            {opError && <ErrorBanner error={opError} />}
            <ActionForm
              initialValues={showModal.editing}
              onSubmit={showModal.editing ? handleUpdate : handleCreate}
              onCancel={() => { setShowModal(null); setOpError(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsPage;
