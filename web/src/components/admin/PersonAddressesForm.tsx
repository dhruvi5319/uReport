import React, { useState } from 'react';
import type { PeopleAddress } from '@/types/admin';

interface PersonAddressesFormProps {
  personId: number;
  addresses: PeopleAddress[];
  onAdd: (body: Omit<PeopleAddress, 'id'>) => Promise<void>;
  onUpdate: (id: number, body: Partial<PeopleAddress>) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}

const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.875rem',
};

const PersonAddressesForm: React.FC<PersonAddressesFormProps> = ({ addresses, onAdd, onUpdate, onRemove }) => {
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<PeopleAddress>>({});
  const [newForm, setNewForm] = useState<Omit<PeopleAddress, 'id'>>({
    address: '', city: null, state: null, zip: null, label: null,
  });
  const [adding, setAdding] = useState(false);

  const startEdit = (addr: PeopleAddress) => {
    setEditId(addr.id);
    setEditForm({ address: addr.address, city: addr.city, state: addr.state, zip: addr.zip, label: addr.label });
  };

  const saveEdit = async () => {
    if (editId === null) return;
    await onUpdate(editId, editForm);
    setEditId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.address) return;
    await onAdd(newForm);
    setNewForm({ address: '', city: null, state: null, zip: null, label: null });
    setAdding(false);
  };

  const formatAddr = (a: PeopleAddress) =>
    [a.address, a.city, a.state, a.zip].filter(Boolean).join(', ');

  return (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>Addresses</h4>
      {addresses.length === 0 && <p style={{ color: '#666', fontSize: '0.875rem' }}>No addresses on file.</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
        <tbody>
          {addresses.map(addr => (
            <tr key={addr.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem' }}>
                {editId === addr.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input
                      style={inputStyle} placeholder="Street address" required
                      value={editForm.address ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }} placeholder="City"
                        value={editForm.city ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, city: e.target.value || null }))}
                      />
                      <input
                        style={{ ...inputStyle, width: 60 }} placeholder="ST" maxLength={2}
                        value={editForm.state ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, state: e.target.value || null }))}
                      />
                      <input
                        style={{ ...inputStyle, width: 80 }} placeholder="Zip"
                        value={editForm.zip ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, zip: e.target.value || null }))}
                      />
                    </div>
                    <select
                      style={inputStyle} value={editForm.label ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, label: e.target.value || null }))}
                    >
                      <option value="">— Label —</option>
                      <option>Home</option><option>Business</option><option>Rental</option>
                    </select>
                  </div>
                ) : (
                  <span>{formatAddr(addr)}{addr.label ? ` (${addr.label})` : ''}</span>
                )}
              </td>
              <td style={{ padding: '0.4rem', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                {editId === addr.id ? (
                  <>
                    <button onClick={saveEdit} style={{ marginRight: 4, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditId(null)} style={{ cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(addr)} style={{ marginRight: 4, cursor: 'pointer' }}>Edit</button>
                    <button
                      onClick={() => window.confirm('Delete this address?') && onRemove(addr.id)}
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
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 480 }}>
          <input
            style={inputStyle} placeholder="Street address" required
            value={newForm.address} onChange={e => setNewForm(f => ({ ...f, address: e.target.value }))}
          />
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <input
              style={{ ...inputStyle, flex: 1 }} placeholder="City"
              value={newForm.city ?? ''} onChange={e => setNewForm(f => ({ ...f, city: e.target.value || null }))}
            />
            <input
              style={{ ...inputStyle, width: 60 }} placeholder="ST" maxLength={2}
              value={newForm.state ?? ''} onChange={e => setNewForm(f => ({ ...f, state: e.target.value || null }))}
            />
            <input
              style={{ ...inputStyle, width: 80 }} placeholder="Zip"
              value={newForm.zip ?? ''} onChange={e => setNewForm(f => ({ ...f, zip: e.target.value || null }))}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              style={inputStyle} value={newForm.label ?? ''}
              onChange={e => setNewForm(f => ({ ...f, label: e.target.value || null }))}
            >
              <option value="">— Label —</option>
              <option>Home</option><option>Business</option><option>Rental</option>
            </select>
            <button type="submit" style={{ cursor: 'pointer' }}>Add</button>
            <button type="button" onClick={() => setAdding(false)} style={{ cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} style={{ fontSize: '0.875rem', cursor: 'pointer' }}>+ Add Address</button>
      )}
    </div>
  );
};

export default PersonAddressesForm;
