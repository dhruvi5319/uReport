import React, { useState } from 'react';
import type { CategorySummary, Action } from '@/types/admin';

interface CategoryResponseOverrideFormProps {
  categories: CategorySummary[];
  actions: Action[];
  onSubmit: (categoryId: number, actionId: number, template: string | null, replyEmail: string | null) => Promise<void>;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const TEMPLATE_VARIABLES = [
  '{enteredByPerson}', '{actionPerson}', '{original:field}', '{updated:field}', '{duplicate:ticket_id}',
];

const CategoryResponseOverrideForm: React.FC<CategoryResponseOverrideFormProps> = ({
  categories, actions, onSubmit,
}) => {
  const [form, setForm] = useState<{
    categoryId: number | '';
    actionId: number | '';
    template: string;
    replyEmail: string;
  }>({ categoryId: '', actionId: '', template: '', replyEmail: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.actionId) return;
    setSaving(true);
    setSuccess(false);
    try {
      await onSubmit(Number(form.categoryId), Number(form.actionId), form.template || null, form.replyEmail || null);
      setForm({ categoryId: '', actionId: '', template: '', replyEmail: '' });
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '1rem', maxWidth: 560 }}>
      <h4 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Category Response Override</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Category *
          </label>
          <select
            style={inputStyle} required
            value={form.categoryId}
            onChange={e => setForm(f => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : '' }))}
          >
            <option value="">— Select category —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Action *
          </label>
          <select
            style={inputStyle} required
            value={form.actionId}
            onChange={e => setForm(f => ({ ...f, actionId: e.target.value ? Number(e.target.value) : '' }))}
          >
            <option value="">— Select action —</option>
            {actions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Template Override
        </label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'monospace' }}
          value={form.template}
          onChange={e => setForm(f => ({ ...f, template: e.target.value }))}
          placeholder="Leave blank to use default action template"
        />
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Variables: {TEMPLATE_VARIABLES.map(v => (
            <code key={v} style={{ background: '#e5e7eb', padding: '0 0.2rem', borderRadius: 2, marginRight: '0.25rem' }}>{v}</code>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Reply Email Override
        </label>
        <input
          style={inputStyle} type="email"
          value={form.replyEmail}
          onChange={e => setForm(f => ({ ...f, replyEmail: e.target.value }))}
          placeholder="Leave blank to use action default"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          type="submit" disabled={saving}
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save Override'}
        </button>
        {success && <span style={{ color: '#16a34a', fontSize: '0.875rem' }}>Override saved ✓</span>}
      </div>
    </form>
  );
};

export default CategoryResponseOverrideForm;
