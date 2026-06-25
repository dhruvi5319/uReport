// F12: Bookmarks — Staff-only page for managing saved search bookmarks
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useBookmarks } from '@/hooks/useBookmarks';
import { bookmarksApi } from '@/api/bookmarks';

const BookmarksPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const navigate = useNavigate();
  const { bookmarks, loading, refresh, deleteBookmark } = useBookmarks();
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveCurrent = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await bookmarksApi.create({
        name: newName.trim(),
        requestUri: window.location.href,
        type: 'search',
      });
      setNewName('');
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save bookmark');
    } finally {
      setSaving(false);
    }
  };

  const handleNavigate = (requestUri: string) => {
    const relative = requestUri.replace(window.location.origin, '') || requestUri;
    navigate(relative);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Saved Bookmarks</h1>

      {/* Save current location as bookmark */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Bookmark name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem', flex: 1, maxWidth: 320 }}
        />
        <button
          onClick={handleSaveCurrent}
          disabled={saving || !newName.trim()}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.375rem 1rem', fontSize: '0.875rem', cursor: 'pointer', opacity: saving || !newName.trim() ? 0.5 : 1 }}
        >
          {saving ? 'Saving…' : 'Save Current Page'}
        </button>
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : bookmarks.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No saved bookmarks yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>URL</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {bookmarks.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleNavigate(b.requestUri)}
                      style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                    >
                      {b.name}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, color: '#6b7280' }}>{b.type}</td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.requestUri}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => deleteBookmark(b.id)}
                      style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

export default BookmarksPage;
