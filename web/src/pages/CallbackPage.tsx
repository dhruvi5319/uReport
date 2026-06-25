import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setTokens } from '@/api/client';
import type { AuthUser } from '@/types/auth';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';

const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore(s => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code  = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code) { setError('Missing OAuth code parameter.'); return; }

    // The backend /callback endpoint handles CSRF state validation + IdP exchange.
    // The SPA just follows the redirect — the backend issues its own redirect with tokens
    // in query params or sets them in localStorage after SPA loads. Simplest approach:
    // call the backend callback endpoint via fetch and let it return the JWT pair.
    fetch(`/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state ?? '')}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? 'OAuth callback failed');
        }
        return res.json();
      })
      .then((data: { accessToken: string; refreshToken: string; role: string; personId: number }) => {
        setTokens(data.accessToken, data.refreshToken);
        const user: AuthUser = { personId: data.personId, role: data.role as AuthUser['role'] };
        setUser(user);
        navigate('/tickets', { replace: true });
      })
      .catch(err => setError((err as Error).message ?? 'OAuth callback failed'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div style={{ padding: '2rem' }}><ErrorBanner error={error} /></div>;
  return <LoadingSpinner />;
};
export default CallbackPage;
