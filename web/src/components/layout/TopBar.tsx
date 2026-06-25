import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

const TopBar: React.FC = () => {
  const { user, logout } = useAuthContext();
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 600 }}>uReport CRM</span>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>{user.role}</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Logout</button>
        </div>
      )}
    </header>
  );
};
export default TopBar;
