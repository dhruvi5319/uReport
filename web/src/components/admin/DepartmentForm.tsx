import React, { useState, useEffect } from 'react';
import type { Department, Person } from '@/types/admin';

interface DepartmentFormProps {
  initialValues?: Partial<Department>;
  onSubmit: (data: Partial<Department>) => void;
  onCancel: () => void;
  staffPeople?: Pick<Person, 'id' | 'firstname' | 'lastname'>[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  initialValues = {}, onSubmit, onCancel, staffPeople = [],
}) => {
  const [form, setForm] = useState<Partial<Department>>({
    name: '',
    defaultPerson_id: null,
    ...initialValues,
  });

  useEffect(() => {
    setForm({ name: '', defaultPerson_id: null, ...initialValues });
  }, [initialValues.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Department Name *
        </label>
        <input
          style={inputStyle} required value={form.name ?? ''}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Default Person (Staff)
        </label>
        <select
          style={inputStyle}
          value={form.defaultPerson_id ?? ''}
          onChange={e => setForm(f => ({ ...f, defaultPerson_id: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">— None —</option>
          {staffPeople.map(p => (
            <option key={p.id} value={p.id}>{p.firstname} {p.lastname}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Save
        </button>
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

export default DepartmentForm;
