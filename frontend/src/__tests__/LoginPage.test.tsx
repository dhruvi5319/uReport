import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';

// Mock AuthContext to provide unauthenticated state
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, logout: vi.fn() }),
}));

// Helper wrapper providing MemoryRouter (required for useNavigate / useSearchParams)
function MemoryRouterWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={children} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('renders city SSO button and LDAP form', async () => {
    render(<LoginPage />, { wrapper: MemoryRouterWrapper });
    expect(screen.getByText('Sign in with City SSO')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
  });

  it('shows loading spinner and disables button during submit', async () => {
    // mock fetch to delay 200ms then resolve 200
    vi.spyOn(global, 'fetch').mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({}), { status: 200 })
              ),
            200
          )
        )
    );
    render(<LoginPage />, { wrapper: MemoryRouterWrapper });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'jdoe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));
    // immediately after click: spinner visible, button disabled
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('shows error message on 401 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
    );
    render(<LoginPage />, { wrapper: MemoryRouterWrapper });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bad' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    );
  });

  it('navigates to /dashboard on successful auth', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    render(<LoginPage />, { wrapper: MemoryRouterWrapper });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'jdoe' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));
    await waitFor(() =>
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    );
  });
});
