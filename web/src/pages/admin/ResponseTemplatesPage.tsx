// F20: Response Templates — Staff-gated CRUD page for response templates
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { responseTemplatesApi, ResponseTemplate } from '@/api/responseTemplates';
import { apiClient } from '@/api/client';

interface Action { id: number; name: string; }

const ResponseTemplatesPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', template: '', action_id: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    responseTemplatesApi.list().then(setTemplates).finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    apiClient.get<Action[]>('/actions').then(r => setActions(r.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const req = {
      name: form.name,
      template: form.template,
      action_id: form.action_id ? Number(form.action_id) : null,
    };
    try {
      if (editId !== null) {
        await responseTemplatesApi.update(editId, req);
      } else {
        await responseTemplatesApi.create(req);
      }
      setForm({ name: '', template: '', action_id: '' });
      setEditId(null);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleEdit = (t: ResponseTemplate) => {
    setEditId(t.id);
    setForm({ name: t.name, template: t.template, action_id: String(t.actionId ?? '') });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this template?')) return;
    setError(null);
    try {
      await responseTemplatesApi.delete(id);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Response Templates</h1>

      {/* Create / Edit form */}
      <form onSubmit={handleSubmit} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem', maxWidth: 512, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{editId !== null ? 'Edit Template' : 'New Template'}</h2>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Template Text</label>
          <textarea
            value={form.template}
            onChange={e => setForm(f => ({ ...f, template: e.target.value }))}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem', width: '100%', height: 96, resize: 'vertical', boxSizing: 'border-box' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Associated Action (optional)</label>
          <select
            value={form.action_id}
            onChange={e => setForm(f => ({ ...f, action_id: e.target.value }))}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem', width: '100%' }}
          >
            <option value="">— None —</option>
            {actions.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.375rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            {editId !== null ? 'Update' : 'Create'}
          </button>
          {editId !== null && (
            <button
              type="button"
              onClick={() => { setEditId(null); setForm({ name: '', template: '', action_id: '' }); }}
              style={{ background: '#e5e7eb', border: 'none', borderRadius: 4, padding: '0.375rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Template Preview</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{t.name}</td>
                <td style={{ ...tdStyle, color: '#6b7280' }}>
                  {t.actionName ?? (t.actionId ? `Action #${t.actionId}` : '—')}
                </td>
                <td style={{ ...tdStyle, color: '#6b7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.template.slice(0, 80)}{t.template.length > 80 ? '…' : ''}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(t)} style={actionBtnStyle('#2563eb')}>Edit</button>
                    <button onClick={() => handleDelete(t.id)} style={actionBtnStyle('#dc2626')}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  textAlign: 'left',
  borderBottom: '2px solid #e5e7eb',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
};

const actionBtnStyle = (color: string): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  color,
  cursor: 'pointer',
  fontSize: '0.75rem',
  padding: '0.125rem 0.25rem',
});

export default ResponseTemplatesPage;
