import React, { useState, useEffect } from 'react';
import type { Substatus } from '@/types/admin';

interface SubstatusFormProps {
  initialValues?: Partial<Substatus>;
  onSubmit: (data: Partial<Substatus>) => void;
  onCancel: () => void;
  defaultStatus?: 'open' | 'closed';
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const SubstatusForm: React.FC<SubstatusFormProps> = ({
  initialValues = {}, onSubmit, onCancel, defaultStatus = 'open',
}) => {
  const isEditing = !!initialValues.id;

  const [form, setForm] = useState<Partial<Substatus>>({
    name: '',
    description: null,
    status: defaultStatus,
    isDefault: false,
    ...initialValues,
  });

  useEffect(() => {
    setForm({ name: '', description: null, status: defaultStatus, isDefault: false, ...initialValues });
  }, [initialValues.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Name *
        </label>
        <input
          style={inputStyle} required value={form.name ?? ''}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Description
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          value={form.description ?? ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Status Type
        </label>
        <select
          style={inputStyle}
          value={form.status ?? 'open'}
          disabled={isEditing}
          onChange={e => setForm(f => ({ ...f, status: e.target.value as 'open' | 'closed' }))}
        >
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        {isEditing && (
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.2rem 0 0' }}>
            Status type cannot be changed on existing substatus.
          </p>
        )}
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={form.isDefault ?? false}
            onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
          />{' '}Set as Default
        </label>
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

export default SubstatusForm;
