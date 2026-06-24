import React, { useState, useEffect } from 'react';
import type { CategorySummary } from '@/types/admin';

interface DepartmentCategoryPanelProps {
  departmentId: number;
  associatedIds: number[];
  allCategories: CategorySummary[];
  onSave: (categoryIds: number[]) => Promise<void>;
}

const DepartmentCategoryPanel: React.FC<DepartmentCategoryPanelProps> = ({
  associatedIds, allCategories, onSave,
}) => {
  const [selected, setSelected] = useState<Set<number>>(new Set(associatedIds));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelected(new Set(associatedIds));
  }, [associatedIds]);

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(selected));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>Associated Categories</h4>
      {allCategories.length === 0 && (
        <p style={{ color: '#666', fontSize: '0.875rem' }}>No categories available.</p>
      )}
      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, padding: '0.5rem', marginBottom: '0.5rem' }}>
        {allCategories.map(cat => (
          <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selected.has(cat.id)}
              onChange={() => toggle(cat.id)}
            />
            {cat.name}
          </label>
        ))}
      </div>
      <button
        onClick={handleSave} disabled={saving}
        style={{ padding: '0.4rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        {saving ? 'Saving…' : 'Save Associations'}
      </button>
      {saved && <span style={{ marginLeft: '0.5rem', color: '#16a34a', fontSize: '0.875rem' }}>Saved ✓</span>}
    </div>
  );
};

export default DepartmentCategoryPanel;
