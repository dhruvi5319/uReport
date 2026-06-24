import React, { useEffect, useState } from 'react';
import { responseTemplatesApi, ResponseTemplate } from '@/api/responseTemplates';

interface Props {
  actionId: number | null;
  onSelect: (templateText: string) => void;
}

const ResponseTemplatePicker: React.FC<Props> = ({ actionId, onSelect }) => {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (actionId != null) {
      responseTemplatesApi.list(actionId).then(setTemplates).catch(console.error);
    } else {
      setTemplates([]);
    }
    setSelected('');
  }, [actionId]);

  if (templates.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelected(e.target.value);
    const tpl = templates.find(t => t.id === id);
    if (tpl) onSelect(tpl.template);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.875rem', color: '#6b7280', whiteSpace: 'nowrap' }}>Use template:</label>
      <select
        value={selected}
        onChange={handleChange}
        style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
      >
        <option value="">— Select —</option>
        {templates.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
};

export default ResponseTemplatePicker;
