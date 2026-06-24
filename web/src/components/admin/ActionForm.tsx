import React, { useState, useEffect } from 'react';
import type { Action } from '@/types/admin';

interface ActionFormProps {
  initialValues?: Partial<Action>;
  onSubmit: (data: Partial<Action>) => void;
  onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const TEMPLATE_VARIABLES = [
  { variable: '{enteredByPerson}', description: 'Full name of the person who entered the ticket' },
  { variable: '{actionPerson}', description: 'Full name of the person who performed the action' },
  { variable: '{original:field}', description: 'Original value of a ticket field (e.g., {original:status})' },
  { variable: '{updated:field}', description: 'Updated value of a ticket field (e.g., {updated:status})' },
  { variable: '{duplicate:ticket_id}', description: 'ID of the ticket marked as duplicate' },
];

const ActionForm: React.FC<ActionFormProps> = ({ initialValues = {}, onSubmit, onCancel }) => {
  const [form, setForm] = useState<Partial<Action>>({
    name: '',
    description: null,
    type: 'department',
    template: null,
    replyEmail: null,
    ...initialValues,
  });

  useEffect(() => {
    setForm({ name: '', description: null, type: 'department', template: null, replyEmail: null, ...initialValues });
  }, [initialValues.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, type: 'department' }); // Type is always 'department' per FRD F09
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
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
          Response Template
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'monospace' }}
          value={form.template ?? ''}
          onChange={e => setForm(f => ({ ...f, template: e.target.value || null }))}
          placeholder="Enter template text with variable substitutions..."
        />
        <div style={{ marginTop: '0.4rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '0.5rem', fontSize: '0.75rem' }}>
          <strong>Available template variables:</strong>
          <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.2rem' }}>
            {TEMPLATE_VARIABLES.map(v => (
              <li key={v.variable} style={{ marginBottom: '0.2rem' }}>
                <code style={{ background: '#e5e7eb', padding: '0 0.2rem', borderRadius: 2 }}>{v.variable}</code>
                {' — '}{v.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Reply Email
        </label>
        <input
          style={inputStyle} type="email"
          value={form.replyEmail ?? ''}
          onChange={e => setForm(f => ({ ...f, replyEmail: e.target.value || null }))}
          placeholder="Leave blank to use system default"
        />
      </div>

      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>
        Type: <strong>Department</strong> (system actions are read-only)
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

export default ActionForm;
