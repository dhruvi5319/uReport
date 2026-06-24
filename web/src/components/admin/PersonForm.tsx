import React, { useState, useEffect } from 'react';
import type { Person } from '@/types/admin';

interface PersonFormProps {
  initialValues?: Partial<Person>;
  onSubmit: (data: Partial<Person> & { password?: string }) => void;
  onCancel: () => void;
  isCreate?: boolean;
  departments?: { id: number; name: string }[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem',
};

const fieldStyle: React.CSSProperties = { marginBottom: '0.75rem' };

const PersonForm: React.FC<PersonFormProps> = ({
  initialValues = {}, onSubmit, onCancel, isCreate = false, departments = [],
}) => {
  const [form, setForm] = useState<Partial<Person> & { password?: string }>({
    firstname: '',
    middlename: null,
    lastname: '',
    organization: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    department_id: null,
    username: null,
    role: null,
    ...initialValues,
  });

  useEffect(() => {
    setForm({ firstname: '', lastname: '', ...initialValues });
  }, [initialValues.id]);

  const set = (field: string, value: string | number | null) =>
    setForm(f => ({ ...f, [field]: value === '' ? null : value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>First Name *</label>
          <input
            style={inputStyle} required value={form.firstname ?? ''}
            onChange={e => set('firstname', e.target.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Middle Name</label>
          <input
            style={inputStyle} value={form.middlename ?? ''}
            onChange={e => set('middlename', e.target.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Last Name *</label>
          <input
            style={inputStyle} required value={form.lastname ?? ''}
            onChange={e => set('lastname', e.target.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Organization</label>
          <input
            style={inputStyle} value={form.organization ?? ''}
            onChange={e => set('organization', e.target.value)}
          />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Address</label>
        <input style={inputStyle} value={form.address ?? ''} onChange={e => set('address', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '0.75rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>City</label>
          <input style={inputStyle} value={form.city ?? ''} onChange={e => set('city', e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>State</label>
          <input style={inputStyle} maxLength={2} value={form.state ?? ''} onChange={e => set('state', e.target.value)} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Zip</label>
          <input style={inputStyle} value={form.zip ?? ''} onChange={e => set('zip', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Department</label>
          <select
            style={inputStyle}
            value={form.department_id ?? ''}
            onChange={e => set('department_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— None —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Role</label>
          <select
            style={inputStyle}
            value={form.role ?? ''}
            onChange={e => set('role', e.target.value || null)}
          >
            <option value="">— None —</option>
            <option value="staff">Staff</option>
            <option value="public">Public</option>
            <option value="anonymous">Anonymous</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Username</label>
          <input style={inputStyle} value={form.username ?? ''} onChange={e => set('username', e.target.value)} />
        </div>
        {isCreate && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <input
              style={inputStyle} type="password"
              value={(form as { password?: string }).password ?? ''}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          type="submit"
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '0.5rem 1.25rem', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PersonForm;
