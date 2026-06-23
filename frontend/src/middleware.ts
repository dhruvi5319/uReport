import { type NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'ureport_session';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/tickets', '/admin', '/reports', '/map'];
// Routes that are always public
const PUBLIC_ROUTES = ['/login', '/auth', '/submit', '/track'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    // No session cookie → redirect to /login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie present — allow through; Server Component will validate via /auth/me
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tickets/:path*',
    '/admin/:path*',
    '/reports/:path*',
    '/map/:path*',
  ],
};
