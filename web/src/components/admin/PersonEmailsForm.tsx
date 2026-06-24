import React, { useState } from 'react';
import type { PeopleEmail } from '@/types/admin';

interface PersonEmailsFormProps {
  personId: number;
  emails: PeopleEmail[];
  onAdd: (body: Omit<PeopleEmail, 'id'>) => Promise<void>;
  onUpdate: (id: number, body: Partial<PeopleEmail>) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}

const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.875rem',
};

const PersonEmailsForm: React.FC<PersonEmailsFormProps> = ({ emails, onAdd, onUpdate, onRemove }) => {
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PeopleEmail>>({});
  const [newForm, setNewForm] = useState<Omit<PeopleEmail, 'id'>>({ email: '', label: null, usedForNotifications: false });
  const [adding, setAdding] = useState(false);

  const startEdit = (email: PeopleEmail) => {
    setEditId(email.id);
    setEditForm({ email: email.email, label: email.label, usedForNotifications: email.usedForNotifications });
  };

  const saveEdit = async () => {
    if (editId === null) return;
    await onUpdate(editId, editForm);
    setEditId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.email) return;
    await onAdd(newForm);
    setNewForm({ email: '', label: null, usedForNotifications: false });
    setAdding(false);
  };

  const confirmRemove = async (email: PeopleEmail) => {
    const msg = email.usedForNotifications
      ? `Delete ${email.email}? This email is used for notifications — deleting it will affect notification delivery.`
      : `Delete ${email.email}?`;
    if (window.confirm(msg)) await onRemove(email.id);
  };

  return (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>Emails</h4>
      {emails.length === 0 && <p style={{ color: '#666', fontSize: '0.875rem' }}>No emails on file.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
        <tbody>
          {emails.map(em => (
            <tr key={em.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem' }}>
                {editId === em.id ? (
                  <input
                    style={inputStyle} type="email" value={editForm.email ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                ) : em.email}
              </td>
              <td style={{ padding: '0.4rem' }}>
                {editId === em.id ? (
                  <select
                    style={inputStyle}
                    value={editForm.label ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, label: e.target.value || null }))}
                  >
                    <option value="">—</option>
                    <option>Home</option><option>Work</option><option>Other</option>
                  </select>
                ) : (em.label ?? '—')}
              </td>
              <td style={{ padding: '0.4rem' }}>
                {editId === em.id ? (
                  <label>
                    <input
                      type="checkbox" checked={editForm.usedForNotifications ?? false}
                      onChange={e => setEditForm(f => ({ ...f, usedForNotifications: e.target.checked }))}
                    />{' '}Notifications
                  </label>
                ) : (em.usedForNotifications ? '★ Notifications' : '')}
              </td>
              <td style={{ padding: '0.4rem', whiteSpace: 'nowrap' }}>
                {editId === em.id ? (
                  <>
                    <button onClick={saveEdit} style={{ marginRight: 4, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditId(null)} style={{ cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(em)} style={{ marginRight: 4, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => confirmRemove(em)} style={{ color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {adding ? (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            style={inputStyle} type="email" placeholder="email@example.com" required
            value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
          />
          <select
            style={inputStyle} value={newForm.label ?? ''}
            onChange={e => setNewForm(f => ({ ...f, label: e.target.value || null }))}
          >
            <option value="">Label</option>
            <option>Home</option><option>Work</option><option>Other</option>
          </select>
          <label style={{ fontSize: '0.875rem' }}>
            <input
              type="checkbox" checked={newForm.usedForNotifications}
              onChange={e => setNewForm(f => ({ ...f, usedForNotifications: e.target.checked }))}
            />{' '}Notifications
          </label>
          <button type="submit" style={{ cursor: 'pointer' }}>Add</button>
          <button type="button" onClick={() => setAdding(false)} style={{ cursor: 'pointer' }}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} style={{ fontSize: '0.875rem', cursor: 'pointer' }}>+ Add Email</button>
      )}
    </div>
  );
};

export default PersonEmailsForm;
