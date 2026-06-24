import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '1.5rem', background: '#f5f7fa' }}>
        {children}
      </main>
    </div>
  </div>
);
export default AppLayout;
