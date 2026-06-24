import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';

const Sidebar: React.FC = () => {
  const isStaff = usePermission('staff');
  return (
    <nav style={{ width: 220, background: '#1a2433', minHeight: '100vh', padding: '1rem 0', color: '#fff' }}>
      <div style={{ padding: '0 1rem 1.5rem', fontWeight: 700, fontSize: '1.1rem' }}>uReport</div>
      <NavItem to="/tickets" label="Tickets" />
      {isStaff && <NavItem to="/tickets/new" label="New Ticket" />}
      {isStaff && <NavItem to="/people" label="People" />}
      {isStaff && <NavItem to="/departments" label="Departments" />}
      {isStaff && <NavItem to="/categories" label="Categories" />}
      {isStaff && <NavItem to="/admin/substatuses" label="Substatuses" />}
      {isStaff && <NavItem to="/admin/actions" label="Actions" />}
      {isStaff && <NavItem to="/admin/clients" label="API Clients" />}
      {isStaff && <NavItem to="/admin/jobs" label="Scheduler Jobs" />}
      {isStaff && <NavItem to="/metrics" label="Metrics" />}
      {isStaff && <NavItem to="/reports" label="Reports" />}
    </nav>
  );
};

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'block', padding: '0.6rem 1rem', color: isActive ? '#61dafb' : '#cfd8e3',
      textDecoration: 'none', fontWeight: isActive ? 600 : 400,
    })}
  >
    {label}
  </NavLink>
);

export default Sidebar;
