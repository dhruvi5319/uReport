import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const useDevLogin = import.meta.env.VITE_USE_DEV_LOGIN === 'true';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If user is already authenticated, redirect to /dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  async function handleLdapSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    const data = new FormData(e.currentTarget);
    try {
      const endpoint = useDevLogin ? '/api/auth/dev-login' : '/api/auth/ldap';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.get('username'),
          password: data.get('password'),
        }),
        credentials: 'include', // send/receive cookies
      });
      if (res.ok) {
        const returnTo = searchParams.get('returnTo');
        navigate(returnTo || '/dashboard');
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMessage(json.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40">
      {/* Logo section */}
      <div className="mb-6 flex flex-col items-center gap-2">
        {/* City logo placeholder — SVG rectangle with civic blue fill */}
        <svg
          aria-label="uReport city logo"
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="48" rx="6" fill="#1d4ed8" />
          <text
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
          >
            311
          </text>
        </svg>
        <h1 className="font-bold text-2xl text-foreground">uReport</h1>
        <p className="text-muted-foreground text-sm">311 Service Request Management</p>
      </div>

      {/* Auth card */}
      <Card className="max-w-sm w-full shadow-md">
        <CardHeader>
          <CardTitle>Sign In to uReport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* City SSO button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => { window.location.href = '/auth/cas'; }}
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign in with City SSO
          </Button>

          {/* Divider */}
          <div className="relative my-4">
            <hr className="border-border" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-card text-xs text-muted-foreground px-2">or</span>
            </span>
          </div>

          {/* LDAP form */}
          <form onSubmit={handleLdapSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {/* Error message */}
            {errorMessage && (
              <p role="alert" className="text-sm text-destructive mt-2">
                {errorMessage}
              </p>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
