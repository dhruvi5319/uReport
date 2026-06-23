import { cookies } from 'next/headers';
import { type CurrentUser } from '@/types/api';

const COOKIE_NAME = 'ureport_session';

/**
 * Read the ureport_session cookie and fetch the current user from /auth/me.
 * Returns null if the cookie is missing or the session is invalid.
 * Safe to call from Server Components and Route Handlers.
 */
export async function getSession(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const res = await fetch(
      `${process.env.PHP_API_BASE_URL ?? 'http://localhost:8080'}/auth/me`,
      {
        headers: {
          Cookie: `${COOKIE_NAME}=${sessionCookie.value}`,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return null;
    }

    const json = await res.json() as { data: CurrentUser };
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the role-appropriate post-login redirect path.
 * - admin/staff → /dashboard
 * - public → /submit
 * - anonymous → /submit
 */
export function redirectByRole(role: CurrentUser['role']): string {
  return role === 'admin' || role === 'staff' ? '/dashboard' : '/submit';
}

/**
 * Determine whether a role has access to staff routes.
 */
export function isStaffOrAdmin(role: string): boolean {
  return role === 'admin' || role === 'staff';
}
