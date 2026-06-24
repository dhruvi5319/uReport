// F19: Issue Types — Staff-gated CRUD page; system types are protected from deletion
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { issueTypesApi, IssueType } from '@/api/issueTypes';

const IssueTypesPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    issueTypesApi.list().then(setIssueTypes).finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await issueTypesApi.create({ name: newName.trim() });
      setNewName('');
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setError(null);
    try {
      await issueTypesApi.update(id, { name: editName.trim() });
      setEditId(null);
      setEditName('');
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this issue type?')) return;
    setError(null);
    try {
      await issueTypesApi.delete(id);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Issue Types</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="New issue type name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem', flex: 1, maxWidth: 320 }}
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.375rem 1rem', fontSize: '0.875rem', cursor: 'pointer', opacity: !newName.trim() ? 0.5 : 1 }}
        >
          Add
        </button>
      </form>

      {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>System</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {issueTypes.map(it => (
              <tr key={it.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{it.id}</td>
                <td style={tdStyle}>
                  {editId === it.id ? (
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                        autoFocus
                      />
                      <button onClick={() => handleUpdate(it.id)} style={actionBtnStyle('#16a34a')}>Save</button>
                      <button onClick={() => setEditId(null)} style={actionBtnStyle('#6b7280')}>Cancel</button>
                    </div>
                  ) : (
                    <span>{it.name}</span>
                  )}
                </td>
                <td style={tdStyle}>
                  {it.isSystem && (
                    <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280', padding: '0.125rem 0.5rem', borderRadius: 4 }}>
                      🔒 System
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {!it.isSystem && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => { setEditId(it.id); setEditName(it.name); }}
                        style={actionBtnStyle('#2563eb')}
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(it.id)}
                        style={actionBtnStyle('#dc2626')}
                      >Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
  textAlign: 'left',
  borderBottom: '2px solid #e5e7eb',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '0.625rem 0.75rem',
};

const actionBtnStyle = (color: string): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  color,
  cursor: 'pointer',
  fontSize: '0.75rem',
  padding: '0.125rem 0.25rem',
});

export default IssueTypesPage;
