import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { redirectByRole } from '@/lib/auth';

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string; error?: string; signed_out?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // If already authenticated, redirect to appropriate page
  const user = await getSession();
  if (user) {
    const params = await searchParams;
    redirect(params.redirect ?? redirectByRole(user.role));
  }

  const params = await searchParams;
  const returnTo = params.redirect;
  const error = params.error;
  const signedOut = params.signed_out;

  // Build the PHP /auth/login URL; pass redirect param so PHP can relay it back
  const loginUrl = returnTo
    ? `/auth/login?redirect=${encodeURIComponent(returnTo)}`
    : '/auth/login';

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        {/* Signed out banner */}
        {signedOut && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            You&apos;ve been signed out successfully.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error === 'auth_failed'
              ? 'Authentication failed. Please try again.'
              : error === 'idp_unavailable'
              ? 'Login service is temporarily unavailable. Please try again.'
              : error === 'deactivated'
              ? 'Your account has been deactivated. Contact your system administrator.'
              : 'An error occurred. Please try again.'}
          </div>
        )}

        {/* Login card */}
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          {/* Branding */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">uReport</h1>
            <p className="mt-1 text-sm text-muted-foreground">Municipal CRM</p>
          </div>

          {/* Primary CTA */}
          <a
            href={loginUrl}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {/* Key icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="7.5" cy="15.5" r="5.5" />
              <path d="m21 2-9.6 9.6" />
              <path d="m15.5 7.5 3 3L22 7l-3-3" />
            </svg>
            Sign in with City SSO
          </a>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t" />
          </div>

          {/* Citizen link */}
          <Link
            href="/submit"
            className="flex w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Submit a service request
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Version 2.0 · AGPL-3.0
        </p>
      </div>
    </main>
  );
}
