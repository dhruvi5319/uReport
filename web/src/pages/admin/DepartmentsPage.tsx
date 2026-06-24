// F6: US-6.1, US-6.2 — Departments CRUD with category and action association panels
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useDepartments, usePeople, useCategories, useActions } from '@/hooks/useAdminApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import DepartmentForm from '@/components/admin/DepartmentForm';
import DepartmentCategoryPanel from '@/components/admin/DepartmentCategoryPanel';
import DepartmentActionPanel from '@/components/admin/DepartmentActionPanel';
import type { Department } from '@/types/admin';

const DepartmentsPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { departments, loading, error, list, create, update, remove, setCategoryAssociations, setActionAssociations } = useDepartments();
  const { people, list: listPeople } = usePeople();
  const { categories, list: listCategories } = useCategories();
  const { actions, list: listActions } = useActions();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editDept, setEditDept] = useState<Department | null>(null);

  useEffect(() => {
    list();
    listPeople({ role: 'staff' });
    listCategories();
    listActions();
  }, []);

  const selectedDept = departments.find(d => d.id === selectedId) ?? null;

  const handleCreate = async (data: Partial<Department>) => {
    setSaveError(null);
    try {
      await create(data);
      setShowCreateForm(false);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveError(err.response?.data?.message ?? 'Failed to create department');
    }
  };

  const handleUpdate = async (data: Partial<Department>) => {
    if (!editDept) return;
    setSaveError(null);
    try {
      await update(editDept.id, data);
      setEditDept(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveError(err.response?.data?.message ?? 'Failed to update department');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await remove(id);
      if (selectedId === id) setSelectedId(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveError(err.response?.data?.message ?? 'Failed to delete department');
    }
  };

  const staffPeople = people.filter(p => p.role === 'staff').map(p => ({
    id: p.id, firstname: p.firstname, lastname: p.lastname,
  }));

  const allCategories = categories.map(c => ({ id: c.id, name: c.name }));
  const allActions = actions.map(a => ({ id: a.id, name: a.name, type: a.type as 'system' | 'department' }));

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Departments</h1>

      <ErrorBanner error={saveError} />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        {/* Left: Department list */}
        <div>
          <button
            onClick={() => { setShowCreateForm(true); setSelectedId(null); }}
            style={{ width: '100%', padding: '0.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: '0.75rem' }}
          >
            + New Department
          </button>

          {loading ? <LoadingSpinner /> : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {departments.length === 0 && (
                <li style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No departments yet.
                </li>
              )}
              {departments.map(dept => (
                <li
                  key={dept.id}
                  onClick={() => { setSelectedId(dept.id); setShowCreateForm(false); setEditDept(null); }}
                  style={{
                    padding: '0.6rem 0.75rem', borderRadius: 4, cursor: 'pointer', marginBottom: '0.25rem',
                    background: selectedId === dept.id ? '#dbeafe' : '#f9fafb',
                    border: `1px solid ${selectedId === dept.id ? '#93c5fd' : '#e5e7eb'}`,
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{dept.name}</div>
                  {dept.defaultPersonName && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{dept.defaultPersonName}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Detail panel */}
        <div>
          {showCreateForm && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>New Department</h2>
              {saveError && <ErrorBanner error={saveError} />}
              <DepartmentForm
                staffPeople={staffPeople}
                onSubmit={handleCreate}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {selectedDept && !showCreateForm && (
            <>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedDept.name}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setEditDept(editDept ? null : selectedDept)}
                      style={{ padding: '0.3rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' }}
                    >
                      {editDept ? 'Cancel Edit' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedDept.id)}
                      style={{ padding: '0.3rem 0.75rem', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#dc2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editDept ? (
                  <DepartmentForm
                    initialValues={editDept}
                    staffPeople={staffPeople}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditDept(null)}
                  />
                ) : (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Default person: {selectedDept.defaultPersonName ?? '—'}
                  </div>
                )}
              </div>

              {/* Category associations */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem' }}>
                <DepartmentCategoryPanel
                  departmentId={selectedDept.id}
                  associatedIds={(selectedDept.categories ?? []).map(c => c.id)}
                  allCategories={allCategories}
                  onSave={async ids => {
                    await setCategoryAssociations(selectedDept.id, ids);
                    await list();
                  }}
                />
              </div>

              {/* Action associations */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem' }}>
                <DepartmentActionPanel
                  departmentId={selectedDept.id}
                  associatedIds={(selectedDept.actions ?? []).map(a => a.id)}
                  allActions={allActions}
                  onSave={async ids => {
                    await setActionAssociations(selectedDept.id, ids);
                    await list();
                  }}
                />
              </div>
            </>
          )}

          {!selectedDept && !showCreateForm && (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
              Select a department to view details, or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage;
