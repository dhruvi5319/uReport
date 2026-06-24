// F5: US-5.1, US-5.3 — People directory list with search and create
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { usePeople } from '@/hooks/useAdminApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import PersonForm from '@/components/admin/PersonForm';
import type { Person } from '@/types/admin';

const roleBadgeStyle = (role: Person['role']): React.CSSProperties => ({
  display: 'inline-block',
  padding: '0.15rem 0.5rem',
  borderRadius: 12,
  fontSize: '0.75rem',
  fontWeight: 600,
  background: role === 'staff' ? '#dbeafe' : role === 'public' ? '#dcfce7' : '#f3f4f6',
  color: role === 'staff' ? '#1d4ed8' : role === 'public' ? '#15803d' : '#6b7280',
});

const PeopleListPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { people, loading, error, list, create } = usePeople();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPeople = useCallback(() => {
    list({ q: q || undefined, role: roleFilter || undefined });
  }, [q, roleFilter, list]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPeople, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchPeople]);

  const handleCreate = async (data: Partial<Person> & { password?: string }) => {
    setCreateError(null);
    try {
      await create(data);
      setShowCreateModal(false);
      fetchPeople();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setCreateError(err.response?.data?.message ?? 'Failed to create person');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>People</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          + New Person
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Search people…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.875rem', width: 280 }}
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.875rem' }}
        >
          <option value="">All Roles</option>
          <option value="staff">Staff</option>
          <option value="public">Public</option>
          <option value="anonymous">Anonymous</option>
        </select>
      </div>

      <ErrorBanner error={error} />

      {loading ? (
        <LoadingSpinner />
      ) : people.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>No people found.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Create First Person
          </button>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Full Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Organization</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Department</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Primary Email</th>
            </tr>
          </thead>
          <tbody>
            {people.map(person => (
              <tr key={person.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.6rem 0.5rem' }}>
                  <Link
                    to={`/admin/people/${person.id}`}
                    style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {[person.firstname, person.middlename, person.lastname].filter(Boolean).join(' ')}
                  </Link>
                </td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{person.organization ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.5rem' }}>
                  {person.role && <span style={roleBadgeStyle(person.role)}>{person.role}</span>}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{person.departmentName ?? '—'}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{person.emails?.[0]?.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>New Person</h2>
            {createError && <ErrorBanner error={createError} />}
            <PersonForm
              isCreate
              onSubmit={handleCreate}
              onCancel={() => { setShowCreateModal(false); setCreateError(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleListPage;
