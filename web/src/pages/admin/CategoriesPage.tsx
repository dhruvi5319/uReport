// F7: US-7.1, US-7.2, US-7.3 — Category CRUD with SLA, permissions, custom fields, action responses
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useCategories, useDepartments, usePeople, useSubstatuses, useActions } from '@/hooks/useAdminApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import CategoryForm from '@/components/admin/CategoryForm';
import CustomFieldsForm from '@/components/admin/CustomFieldsForm';
import CategoryActionResponseForm from '@/components/admin/CategoryActionResponseForm';
import type { Category, CategoryActionResponse, CategoryGroup } from '@/types/admin';

const CategoriesPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const {
    categories, loading, error, list, create, update, remove,
    listGroups, listActionResponses, upsertActionResponse, removeActionResponse,
  } = useCategories();
  const { departments, list: listDepts } = useDepartments();
  const { people, list: listPeople } = usePeople();
  const { substatuses, list: listSubstatuses } = useSubstatuses();
  const { actions, list: listActions } = useActions();

  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [actionResponses, setActionResponses] = useState<CategoryActionResponse[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editorCategory, setEditorCategory] = useState<Partial<Category> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [customFieldsJson, setCustomFieldsJson] = useState<string>('');

  useEffect(() => {
    list();
    listDepts();
    listPeople({ role: 'staff' });
    listSubstatuses();
    listActions();
    listGroups().then(setGroups).catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      listActionResponses(selectedCategory.id).then(setActionResponses).catch(() => setActionResponses([]));
      setCustomFieldsJson(selectedCategory.customFields ?? '');
    }
  }, [selectedCategory?.id]);

  const openCreate = () => {
    setEditorCategory({});
    setSelectedCategory(null);
    setShowEditor(true);
    setSaveError(null);
  };

  const openEdit = (cat: Category) => {
    setEditorCategory(cat);
    setSelectedCategory(cat);
    setShowEditor(true);
    setCustomFieldsJson(cat.customFields ?? '');
    setSaveError(null);
  };

  const handleSave = async (data: Partial<Category>) => {
    setSaveError(null);
    try {
      const saveData = { ...data, customFields: customFieldsJson || null };
      if (editorCategory?.id) {
        await update(editorCategory.id, saveData);
      } else {
        await create(saveData);
      }
      setShowEditor(false);
      setEditorCategory(null);
      setSelectedCategory(null);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveError(err.response?.data?.message ?? 'Failed to save category');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await remove(cat.id);
      if (selectedCategory?.id === cat.id) setSelectedCategory(null);
      if (showEditor && editorCategory?.id === cat.id) setShowEditor(false);
      await list();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveError(err.response?.data?.message ?? 'Failed to delete category');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await update(cat.id, { active: !cat.active });
      await list();
    } catch { /* ignore */ }
  };

  const staffPeople = people.filter(p => p.role === 'staff').map(p => ({
    id: p.id, firstname: p.firstname, lastname: p.lastname,
  }));
  const closedSubstatuses = substatuses.filter(s => s.status === 'closed').map(s => ({
    id: s.id, name: s.name,
  }));

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Categories</h1>
        <button
          onClick={openCreate}
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          + New Category
        </button>
      </div>

      <ErrorBanner error={error || saveError} />

      {loading ? <LoadingSpinner /> : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>No categories found.</p>
          <button onClick={openCreate} style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Create First Category
          </button>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Department</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Group</th>
              <th style={{ textAlign: 'center', padding: '0.5rem' }}>Active</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Display / Post</th>
              <th style={{ textAlign: 'center', padding: '0.5rem' }}>SLA Days</th>
              <th style={{ padding: '0.5rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>{cat.name}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{cat.departmentName ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{cat.categoryGroupName ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                  <input
                    type="checkbox" checked={cat.active}
                    onChange={() => handleToggleActive(cat)}
                    title="Toggle active"
                  />
                </td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280', fontSize: '0.75rem' }}>
                  {cat.displayPermissionLevel} / {cat.postingPermissionLevel}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#6b7280' }}>
                  {cat.slaDays ?? '—'}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap' }}>
                  <button onClick={() => openEdit(cat)} style={{ marginRight: 4, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(cat)} style={{ color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Slide-over editor */}
      {showEditor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          justifyContent: 'flex-end', zIndex: 50,
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 680, padding: '1.5rem',
            overflowY: 'auto', boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{editorCategory?.id ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowEditor(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {saveError && <ErrorBanner error={saveError} />}

            <CategoryForm
              initialValues={editorCategory ?? {}}
              departments={departments.map(d => ({ id: d.id, name: d.name }))}
              categoryGroups={groups}
              staffPeople={staffPeople}
              closedSubstatuses={closedSubstatuses}
              onSubmit={handleSave}
              onCancel={() => setShowEditor(false)}
            />

            <hr style={{ margin: '1.5rem 0', borderColor: '#e5e7eb' }} />

            <CustomFieldsForm
              value={customFieldsJson}
              onChange={setCustomFieldsJson}
            />

            {editorCategory?.id && (
              <>
                <hr style={{ margin: '1.5rem 0', borderColor: '#e5e7eb' }} />
                <CategoryActionResponseForm
                  categoryId={editorCategory.id}
                  responses={actionResponses}
                  actions={actions}
                  onUpsert={async (actionId, template, replyEmail) => {
                    await upsertActionResponse(editorCategory.id!, { action_id: actionId, template, replyEmail });
                    const updated = await listActionResponses(editorCategory.id!);
                    setActionResponses(updated);
                  }}
                  onRemove={async responseId => {
                    await removeActionResponse(editorCategory.id!, responseId);
                    const updated = await listActionResponses(editorCategory.id!);
                    setActionResponses(updated);
                  }}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
