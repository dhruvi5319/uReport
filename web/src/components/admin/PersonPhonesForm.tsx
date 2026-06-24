import React, { useState } from 'react';
import type { PeoplePhone } from '@/types/admin';

interface PersonPhonesFormProps {
  personId: number;
  phones: PeoplePhone[];
  onAdd: (body: Omit<PeoplePhone, 'id'>) => Promise<void>;
  onUpdate: (id: number, body: Partial<PeoplePhone>) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}

const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.875rem',
};

const PHONE_LABELS = ['Main', 'Mobile', 'Work', 'Home', 'Fax', 'Pager', 'Other'];

const PersonPhonesForm: React.FC<PersonPhonesFormProps> = ({ phones, onAdd, onUpdate, onRemove }) => {
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PeoplePhone>>({});
  const [newForm, setNewForm] = useState<Omit<PeoplePhone, 'id'>>({ number: '', label: null });
  const [adding, setAdding] = useState(false);

  const startEdit = (phone: PeoplePhone) => {
    setEditId(phone.id);
    setEditForm({ number: phone.number, label: phone.label });
  };

  const saveEdit = async () => {
    if (editId === null) return;
    await onUpdate(editId, editForm);
    setEditId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.number) return;
    await onAdd(newForm);
    setNewForm({ number: '', label: null });
    setAdding(false);
  };

  return (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>Phones</h4>
      {phones.length === 0 && <p style={{ color: '#666', fontSize: '0.875rem' }}>No phones on file.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
        <tbody>
          {phones.map(ph => (
            <tr key={ph.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem' }}>
                {editId === ph.id ? (
                  <input
                    style={inputStyle} value={editForm.number ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, number: e.target.value }))}
                  />
                ) : ph.number}
              </td>
              <td style={{ padding: '0.4rem' }}>
                {editId === ph.id ? (
                  <select
                    style={inputStyle} value={editForm.label ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, label: e.target.value || null }))}
                  >
                    <option value="">—</option>
                    {PHONE_LABELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                ) : (ph.label ?? '—')}
              </td>
              <td style={{ padding: '0.4rem', whiteSpace: 'nowrap' }}>
                {editId === ph.id ? (
                  <>
                    <button onClick={saveEdit} style={{ marginRight: 4, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditId(null)} style={{ cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(ph)} style={{ marginRight: 4, cursor: 'pointer' }}>Edit</button>
                    <button
                      onClick={() => window.confirm(`Delete ${ph.number}?`) && onRemove(ph.id)}
                      style={{ color: '#dc2626', cursor: 'pointer' }}
                    >Delete</button>
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
            style={inputStyle} placeholder="Phone number" required
            value={newForm.number} onChange={e => setNewForm(f => ({ ...f, number: e.target.value }))}
          />
          <select
            style={inputStyle} value={newForm.label ?? ''}
            onChange={e => setNewForm(f => ({ ...f, label: e.target.value || null }))}
          >
            <option value="">Label</option>
            {PHONE_LABELS.map(l => <option key={l}>{l}</option>)}
          </select>
          <button type="submit" style={{ cursor: 'pointer' }}>Add</button>
          <button type="button" onClick={() => setAdding(false)} style={{ cursor: 'pointer' }}>Cancel</button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} style={{ fontSize: '0.875rem', cursor: 'pointer' }}>+ Add Phone</button>
      )}
    </div>
  );
};

export default PersonPhonesForm;
