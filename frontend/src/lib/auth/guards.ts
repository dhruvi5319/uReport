// Wave 3a auth guard — server-side role enforcement for Next.js App Router
// Used by admin page routes to redirect unauthenticated / unauthorized users

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export type AppRole = 'admin' | 'staff' | 'public' | 'anonymous';

interface SessionPayload {
  userId: number;
  role: AppRole;
  exp: number;
}

/**
 * Reads the session cookie and returns the decoded payload, or null if missing/expired.
 * In production the cookie is an HttpOnly JWT signed by the PHP backend.
 */
async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('ureport_session')?.value;
    if (!token) return null;

    // Decode (not verify — verification happens at the PHP API layer).
    // We only need the role claim for the client-side gate.
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8'),
    ) as SessionPayload;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-component auth gate. Throws a Next.js redirect if the caller does not
 * hold one of the required roles.
 *
 * Usage:
 *   await requireRole(['admin']);
 *   await requireRole(['admin', 'staff']);
 */
export async function requireRole(roles: AppRole[]): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!roles.includes(session.role)) {
    redirect('/access-denied');
  }

  return session;
}
