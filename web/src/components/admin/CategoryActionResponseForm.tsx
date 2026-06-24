import React, { useState } from 'react';
import type { CategoryActionResponse, Action } from '@/types/admin';

interface CategoryActionResponseFormProps {
  categoryId: number;
  responses: CategoryActionResponse[];
  actions: Action[];
  onUpsert: (actionId: number, template: string | null, replyEmail: string | null) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.4rem 0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const CategoryActionResponseForm: React.FC<CategoryActionResponseFormProps> = ({
  responses, actions, onUpsert, onRemove,
}) => {
  const [form, setForm] = useState<{ action_id: number | ''; template: string; replyEmail: string }>({
    action_id: '', template: '', replyEmail: '',
  });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.action_id) return;
    setSaving(true);
    try {
      await onUpsert(Number(form.action_id), form.template || null, form.replyEmail || null);
      setForm({ action_id: '', template: '', replyEmail: '' });
      setEditId(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r: CategoryActionResponse) => {
    setEditId(r.id);
    setForm({ action_id: r.action_id, template: r.template ?? '', replyEmail: r.replyEmail ?? '' });
  };

  return (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>Action Response Overrides</h4>
      {responses.length === 0 && (
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>No overrides configured.</p>
      )}
      {responses.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>Action</th>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>Template</th>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem' }}>Reply Email</th>
              <th style={{ padding: '0.3rem 0.4rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {responses.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.4rem' }}>{r.actionName}</td>
                <td style={{ padding: '0.4rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.template ?? '—'}
                </td>
                <td style={{ padding: '0.4rem' }}>{r.replyEmail ?? '—'}</td>
                <td style={{ padding: '0.4rem', whiteSpace: 'nowrap' }}>
                  <button onClick={() => startEdit(r)} style={{ marginRight: 4, cursor: 'pointer' }}>Edit</button>
                  <button
                    onClick={() => window.confirm('Remove this override?') && onRemove(r.id)}
                    style={{ color: '#dc2626', cursor: 'pointer' }}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleUpsert} style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '0.75rem' }}>
        <h5 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{editId ? 'Edit Override' : 'Add Override'}</h5>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>Action *</label>
          <select
            style={inputStyle} required
            value={form.action_id}
            onChange={e => setForm(f => ({ ...f, action_id: e.target.value ? Number(e.target.value) : '' }))}
          >
            <option value="">— Select action —</option>
            {actions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>Template Override</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'monospace' }}
            value={form.template}
            onChange={e => setForm(f => ({ ...f, template: e.target.value }))}
            placeholder="Leave blank to use default action template"
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>Reply Email Override</label>
          <input
            style={inputStyle} type="email"
            value={form.replyEmail}
            onChange={e => setForm(f => ({ ...f, replyEmail: e.target.value }))}
            placeholder="Leave blank to use action default"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit" disabled={saving}
            style={{ padding: '0.4rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : (editId ? 'Update Override' : 'Add Override')}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => { setEditId(null); setForm({ action_id: '', template: '', replyEmail: '' }); }}
              style={{ padding: '0.4rem 1rem', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CategoryActionResponseForm;
