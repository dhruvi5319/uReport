import { redirect } from 'next/navigation';
import { getSession, redirectByRole } from '@/lib/auth';

interface CallbackPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const params = await searchParams;

  // Handle error forwarded from PHP (e.g. ?error=auth_failed)
  if (params.error) {
    redirect(`/login?error=${encodeURIComponent(params.error)}`);
  }

  // PHP backend has already set the ureport_session cookie.
  // Validate the session by fetching /auth/me.
  const user = await getSession();

  if (!user) {
    // Cookie missing or invalid — PHP callback may have failed
    redirect('/login?error=auth_failed');
  }

  // Restore the originally requested URL if provided, else use role default
  const returnTo = params.redirect;
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    redirect(returnTo);
  }

  redirect(redirectByRole(user.role));
}
