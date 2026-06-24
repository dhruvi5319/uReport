import React, { useState, useEffect } from 'react';
import type { Category, Department, CategoryGroup, Person, Substatus } from '@/types/admin';

interface CategoryFormProps {
  initialValues?: Partial<Category>;
  onSubmit: (data: Partial<Category>) => void;
  onCancel: () => void;
  departments?: Pick<Department, 'id' | 'name'>[];
  categoryGroups?: Pick<CategoryGroup, 'id' | 'name'>[];
  staffPeople?: Pick<Person, 'id' | 'firstname' | 'lastname'>[];
  closedSubstatuses?: Pick<Substatus, 'id' | 'name'>[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4,
  fontSize: '0.875rem', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem',
};

const fieldStyle: React.CSSProperties = { marginBottom: '0.75rem' };

const PERMISSION_LEVELS = [
  { value: 'anonymous', label: 'Anonymous' },
  { value: 'public', label: 'Public' },
  { value: 'staff', label: 'Staff' },
];

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialValues = {}, onSubmit, onCancel,
  departments = [], categoryGroups = [], staffPeople = [], closedSubstatuses = [],
}) => {
  const [form, setForm] = useState<Partial<Category>>({
    name: '',
    description: null,
    department_id: null,
    categoryGroup_id: null,
    defaultPerson_id: null,
    active: true,
    featured: false,
    displayPermissionLevel: 'public',
    postingPermissionLevel: 'public',
    customFields: null,
    slaDays: null,
    notificationReplyEmail: null,
    autoCloseIsActive: false,
    autoCloseSubstatus_id: null,
    ...initialValues,
  });

  useEffect(() => {
    setForm({ name: '', active: true, featured: false, displayPermissionLevel: 'public', postingPermissionLevel: 'public', autoCloseIsActive: false, ...initialValues });
  }, [initialValues.id]);

  const set = (field: keyof Category, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} required value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={form.description ?? ''}
          onChange={e => set('description', e.target.value || null)}
        />
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
          <label style={labelStyle}>Category Group</label>
          <select
            style={inputStyle}
            value={form.categoryGroup_id ?? ''}
            onChange={e => set('categoryGroup_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— None —</option>
            {categoryGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Default Person (Staff)</label>
        <select
          style={inputStyle}
          value={form.defaultPerson_id ?? ''}
          onChange={e => set('defaultPerson_id', e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— None —</option>
          {staffPeople.map(p => <option key={p.id} value={p.id}>{p.firstname} {p.lastname}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={form.active ?? true}
            onChange={e => set('active', e.target.checked)}
          />{' '}Active
        </label>
        <label style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="checkbox" checked={form.featured ?? false}
            onChange={e => set('featured', e.target.checked)}
          />{' '}Featured
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Display Permission Level</label>
          <select
            style={inputStyle}
            value={form.displayPermissionLevel ?? 'public'}
            onChange={e => set('displayPermissionLevel', e.target.value as Category['displayPermissionLevel'])}
          >
            {PERMISSION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Posting Permission Level</label>
          <select
            style={inputStyle}
            value={form.postingPermissionLevel ?? 'public'}
            onChange={e => set('postingPermissionLevel', e.target.value as Category['postingPermissionLevel'])}
          >
            {PERMISSION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>SLA Days</label>
          <input
            style={inputStyle} type="number" min={1}
            value={form.slaDays ?? ''}
            onChange={e => set('slaDays', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Notification Reply Email</label>
          <input
            style={inputStyle} type="email"
            value={form.notificationReplyEmail ?? ''}
            onChange={e => set('notificationReplyEmail', e.target.value || null)}
          />
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: 4 }}>
        <label style={{ fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <input
            type="checkbox" checked={form.autoCloseIsActive ?? false}
            onChange={e => set('autoCloseIsActive', e.target.checked)}
          />
          <strong>Auto-close enabled</strong>
        </label>
        {form.autoCloseIsActive && (
          <div>
            <label style={labelStyle}>Auto-close Substatus</label>
            <select
              style={inputStyle}
              value={form.autoCloseSubstatus_id ?? ''}
              onChange={e => set('autoCloseSubstatus_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Select closed substatus —</option>
              {closedSubstatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
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

export default CategoryForm;
