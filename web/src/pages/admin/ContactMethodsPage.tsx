// F14: Contact Methods — Read-only page showing the four seeded contact methods
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { contactMethodsApi, ContactMethod } from '@/api/contactMethods';

const ContactMethodsPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const [methods, setMethods] = useState<ContactMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactMethodsApi.list()
      .then(setMethods)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Contact Methods</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        System-seeded submission and response channel types used on tickets.
      </p>
      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>System</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{m.id}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{m.name}</td>
                <td style={tdStyle}>
                  {m.isSystem ? (
                    <span style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#6b7280', padding: '0.125rem 0.5rem', borderRadius: 4 }}>
                      System
                    </span>
                  ) : null}
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

export default ContactMethodsPage;
