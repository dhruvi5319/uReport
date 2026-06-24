import React, { useState, useEffect } from 'react';

interface CustomFieldsFormProps {
  value: string | null;
  onChange: (json: string) => void;
}

const CustomFieldsForm: React.FC<CustomFieldsFormProps> = ({ value, onChange }) => {
  const [text, setText] = useState(value ?? '');
  const [validState, setValidState] = useState<'valid' | 'invalid' | 'empty'>('empty');

  useEffect(() => {
    setText(value ?? '');
    if (!value || value.trim() === '') {
      setValidState('empty');
    } else {
      try {
        JSON.parse(value);
        setValidState('valid');
      } catch {
        setValidState('invalid');
      }
    }
  }, [value]);

  const handleBlur = () => {
    if (!text.trim()) {
      setValidState('empty');
      onChange('');
      return;
    }
    try {
      JSON.parse(text);
      setValidState('valid');
      onChange(text);
    } catch {
      setValidState('invalid');
      // Do not call onChange with invalid JSON — will not be saved
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Reset validation state while user is typing
    setValidState('empty');
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
        Custom Fields Schema (JSON)
      </label>
      <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 0, marginBottom: '0.4rem' }}>
        Enter a JSON object defining custom fields for this category. Changes take effect on next ticket submission without requiring a deployment.
      </p>
      <textarea
        style={{
          width: '100%', minHeight: 150, padding: '0.5rem',
          border: `1px solid ${validState === 'invalid' ? '#dc2626' : '#ccc'}`,
          borderRadius: 4, fontSize: '0.8rem', fontFamily: 'monospace',
          boxSizing: 'border-box', resize: 'vertical',
        }}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={'{\n  "fieldName": {\n    "type": "text",\n    "label": "Field Label",\n    "required": false\n  }\n}'}
        spellCheck={false}
      />
      {validState === 'valid' && (
        <p style={{ color: '#16a34a', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
          ✓ Valid JSON schema
        </p>
      )}
      {validState === 'invalid' && (
        <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
          ✗ Invalid JSON — will not be saved
        </p>
      )}
    </div>
  );
};

export default CustomFieldsForm;
