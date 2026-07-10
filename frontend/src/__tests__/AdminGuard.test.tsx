import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { AdminGuard } from '@/components/AdminGuard';

// Mock useAuth so each test can inject the auth state it needs.
let mockAuth: { user: { role: string } | null; loading: boolean };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin/people']}>
      <Routes>
        <Route
          path="/admin/people"
          element={
            <AdminGuard>
              <div>Admin Content</div>
            </AdminGuard>
          }
        />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminGuard', () => {
  it('renders the admin route for an admin user', () => {
    mockAuth = { user: { role: 'admin' }, loading: false };
    renderGuard();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects a non-admin (staff) user to /dashboard', () => {
    mockAuth = { user: { role: 'staff' }, loading: false };
    renderGuard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated user to /login', () => {
    mockAuth = { user: null, loading: false };
    renderGuard();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders nothing (no redirect flash) while auth is still loading', () => {
    mockAuth = { user: null, loading: true };
    renderGuard();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});
