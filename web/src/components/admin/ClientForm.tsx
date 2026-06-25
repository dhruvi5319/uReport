import React, { useState, useEffect } from 'react';
import type { Client, Person, ContactMethod } from '@/types/admin';

interface ClientFormProps {
  initialValues?: Partial<Client>;
  onSubmit: (data: Partial<Client> & { rotateKey?: boolean }) => void;
  onCancel: () => void;
  staffPeople?: Pick<Person, 'id' | 'firstname' | 'lastname'>[];
  contactMethods?: ContactMethod[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const ClientForm: React.FC<ClientFormProps> = ({
  initialValues = {}, onSubmit, onCancel, staffPeople = [], contactMethods = [],
}) => {
  const isEditing = !!initialValues.id;

  const [form, setForm] = useState<Partial<Client> & { rotateKey?: boolean }>({
    name: '',
    url: null,
    contactPerson_id: null,
    contactMethod_id: null,
    ...initialValues,
  });

  useEffect(() => {
    setForm({ name: '', url: null, contactPerson_id: null, contactMethod_id: null, ...initialValues });
  }, [initialValues.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleRotateKey = () => {
    if (window.confirm('Rotate the API key? This will invalidate the current key immediately.')) {
      onSubmit({ ...form, rotateKey: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Client Name *
        </label>
        <input
          style={inputStyle} required value={form.name ?? ''}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          URL
        </label>
        <input
          style={inputStyle} type="url" value={form.url ?? ''}
          onChange={e => setForm(f => ({ ...f, url: e.target.value || null }))}
          placeholder="https://example.com"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Contact Person
          </label>
          <select
            style={inputStyle}
            value={form.contactPerson_id ?? ''}
            onChange={e => setForm(f => ({ ...f, contactPerson_id: e.target.value ? Number(e.target.value) : null }))}
          >
            <option value="">— None —</option>
            {staffPeople.map(p => <option key={p.id} value={p.id}>{p.firstname} {p.lastname}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Contact Method
          </label>
          <select
            style={inputStyle}
            value={form.contactMethod_id ?? ''}
            onChange={e => setForm(f => ({ ...f, contactMethod_id: e.target.value ? Number(e.target.value) : null }))}
          >
            <option value="">— None —</option>
            {contactMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {!isEditing && (
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
          An API key will be generated automatically on creation and displayed once.
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="submit"
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          {isEditing ? 'Update' : 'Create Client'}
        </button>
        {isEditing && (
          <button
            type="button" onClick={handleRotateKey}
            style={{ padding: '0.5rem 1.25rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Rotate API Key
          </button>
        )}
        <button
          type="button" onClick={onCancel}
          style={{ padding: '0.5rem 1.25rem', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ClientForm;
