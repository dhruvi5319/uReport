import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useBookmarks } from '@/hooks/useBookmarks';

interface NavItemProps {
  to: string;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, label }) => (
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

const Sidebar: React.FC = () => {
  const isStaff = usePermission('staff');
  const { bookmarks } = useBookmarks();

  return (
    <nav style={{ width: 220, background: '#1a2433', minHeight: '100vh', padding: '1rem 0', color: '#fff', overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ padding: '0 1rem 1.5rem', fontWeight: 700, fontSize: '1.1rem' }}>uReport</div>

      {/* Public */}
      <NavItem to="/tickets" label="Tickets" />
      <NavItem to="/open311-services" label="Open311 Services" />

      {/* Staff-only */}
      {isStaff && <NavItem to="/tickets/new" label="New Ticket" />}
      {isStaff && <NavItem to="/map" label="Map View" />}
      {isStaff && <NavItem to="/bookmarks" label="Bookmarks" />}
      {isStaff && <NavItem to="/people" label="People" />}
      {isStaff && <NavItem to="/departments" label="Departments" />}
      {isStaff && <NavItem to="/categories" label="Categories" />}
      {isStaff && <NavItem to="/admin/substatuses" label="Substatuses" />}
      {isStaff && <NavItem to="/admin/actions" label="Actions" />}
      {isStaff && <NavItem to="/admin/clients" label="API Clients" />}
      {isStaff && <NavItem to="/issue-types" label="Issue Types" />}
      {isStaff && <NavItem to="/contact-methods" label="Contact Methods" />}
      {isStaff && <NavItem to="/response-templates" label="Response Templates" />}
      {isStaff && <NavItem to="/metrics" label="Metrics" />}
      {isStaff && <NavItem to="/reports" label="Reports" />}
      {isStaff && <NavItem to="/admin/jobs" label="Scheduler Jobs" />}

      {/* Saved bookmarks section */}
      {isStaff && bookmarks.length > 0 && (
        <div style={{ marginTop: '1.5rem', padding: '0 1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8899aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Saved Searches
          </div>
          {bookmarks.map(b => (
            <NavLink
              key={b.id}
              to={b.requestUri.replace(window.location.origin, '') || '/tickets'}
              title={b.requestUri}
              style={({ isActive }) => ({
                display: 'block', padding: '0.4rem 0', color: isActive ? '#61dafb' : '#a0b0c0',
                textDecoration: 'none', fontSize: '0.875rem',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              })}
            >
              {b.name}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
