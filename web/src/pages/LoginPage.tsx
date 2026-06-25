import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import ErrorBanner from '@/components/common/ErrorBanner';

const LoginPage: React.FC = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/tickets';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(msg?.message ?? msg?.error ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '2rem', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,.1)', width: 340 }}>
        <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.4rem', fontWeight: 700 }}>uReport Sign In</h1>
        <ErrorBanner error={error} />
        <label htmlFor="username" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Username</label>
        <input
          id="username" type="text" value={username} onChange={e => setUsername(e.target.value)}
          required autoFocus disabled={loading}
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, marginBottom: '1rem', boxSizing: 'border-box' }}
        />
        <label htmlFor="password" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Password</label>
        <input
          id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          required disabled={loading}
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, marginBottom: '1.5rem', boxSizing: 'border-box' }}
        />
        <button
          type="submit" disabled={loading || !username || !password}
          style={{ width: '100%', padding: '0.6rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
export default LoginPage;
