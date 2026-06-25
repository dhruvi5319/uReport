// F2: Open311 public service list — no authentication required
import React, { useEffect, useState } from 'react';
import { open311Api, Open311Service } from '@/api/open311';

const Open311ServiceListPage: React.FC = () => {
  const [services, setServices] = useState<Open311Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    open311Api.listServices()
      .then(setServices)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '1.5rem' }}>Loading services…</div>;
  if (error) return <div style={{ padding: '1.5rem', color: '#dc2626' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Open311 Service List</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Public-facing service types available via the Open311 GeoReport v2 API.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Group</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            {services.map(svc => (
              <tr key={svc.service_code} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{svc.service_code}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{svc.service_name}</td>
                <td style={{ ...tdStyle, color: '#6b7280' }}>{svc.group ?? '—'}</td>
                <td style={{ ...tdStyle, color: '#6b7280' }}>{svc.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {services.length === 0 && (
        <p style={{ color: '#6b7280', marginTop: '1rem' }}>No active public services found.</p>
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

export default Open311ServiceListPage;
