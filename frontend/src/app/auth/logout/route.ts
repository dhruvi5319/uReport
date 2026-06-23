import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Proxy logout to PHP backend to clear the HttpOnly cookie there
  const phpBase = process.env.PHP_API_BASE_URL ?? 'http://localhost:8080';
  const sessionCookie = request.cookies.get('ureport_session');

  try {
    await fetch(`${phpBase}/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: sessionCookie
          ? `ureport_session=${sessionCookie.value}`
          : '',
      },
    });
  } catch {
    // Best-effort: even if PHP logout fails, clear the cookie on the Next.js side
  }

  const response = NextResponse.redirect(new URL('/login?signed_out=1', request.url));
  // Expire the cookie on the Next.js / browser side as well
  response.cookies.set('ureport_session', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
