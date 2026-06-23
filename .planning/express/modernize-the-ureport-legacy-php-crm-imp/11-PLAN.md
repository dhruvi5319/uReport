---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 11
type: execute
wave: 3
depends_on: [2]
files_modified:
  - frontend/package.json
  - frontend/next.config.mjs
  - frontend/tsconfig.json
  - frontend/tailwind.config.ts
  - frontend/postcss.config.mjs
  - frontend/.env.local.example
  - frontend/src/lib/api-client.ts
  - frontend/src/lib/auth.ts
  - frontend/src/middleware.ts
  - frontend/src/app/layout.tsx
  - frontend/src/app/page.tsx
  - frontend/src/app/login/page.tsx
  - frontend/src/app/auth/callback/page.tsx
  - frontend/src/app/auth/logout/route.ts
  - frontend/src/app/dashboard/layout.tsx
  - frontend/src/app/dashboard/page.tsx
  - frontend/src/components/nav/TopNav.tsx
  - frontend/src/components/nav/Sidebar.tsx
  - frontend/src/types/api.ts
autonomous: true

features:
  implements: ["F15", "F11", "F10"]
  depends_on: ["F16"]
  enables: ["F0", "F15"]

must_haves:
  truths:
    - "Next.js 15 dev server starts on 0.0.0.0:3000 with `npm run dev` without errors"
    - "Navigating to /login renders a card with 'Sign in with City SSO' button and a link to /submit"
    - "Clicking the SSO button redirects to the PHP backend /auth/login which initiates OIDC flow"
    - "After OIDC callback, the PHP backend sets ureport_session HttpOnly cookie and redirects to /dashboard"
    - "/auth/callback Next.js page reads the redirect from PHP backend and completes the SPA handoff"
    - "Accessing /dashboard, /tickets, or /admin/* without the ureport_session cookie redirects to /login"
    - "Staff (role=staff/admin) can access /dashboard after login; public role is redirected to /submit"
    - "The staff dashboard layout renders a persistent top nav bar and left sidebar with: Tickets, Reports, Map, Admin links"
    - "X-Frame-Options DENY is NOT set by Next.js (allow iframe preview); next.config.mjs omits the header"
    - "TypeScript strict mode: `npm run build` exits 0 with 0 type errors"
  artifacts:
    - path: "frontend/next.config.mjs"
      provides: "Next.js 15 config: dev server 0.0.0.0:3000, no X-Frame-Options DENY, API proxy to PHP backend"
      exports: ["default export"]
    - path: "frontend/src/middleware.ts"
      provides: "Authenticated route guard: reads ureport_session cookie, redirects unauthenticated requests to /login"
      exports: ["middleware", "config"]
    - path: "frontend/src/lib/auth.ts"
      provides: "Auth utilities: getSession() from cookie, role-based redirect logic"
      exports: ["getSession", "requireAuth", "redirectByRole"]
    - path: "frontend/src/lib/api-client.ts"
      provides: "Typed fetch wrapper for PHP API: auto-attaches cookie, handles 401 redirect, wraps { data, meta, errors } envelope"
      exports: ["apiClient", "ApiResponse"]
    - path: "frontend/src/app/login/page.tsx"
      provides: "Login page: SSO button + citizen link"
      exports: ["default export LoginPage"]
    - path: "frontend/src/app/auth/callback/page.tsx"
      provides: "OIDC callback landing: reads URL state, resolves session, redirects to role-appropriate page"
      exports: ["default export CallbackPage"]
    - path: "frontend/src/app/dashboard/layout.tsx"
      provides: "Authenticated shell layout with TopNav + Sidebar, session-gated"
      exports: ["default export DashboardLayout"]
    - path: "frontend/src/types/api.ts"
      provides: "TypeScript interfaces for API envelope and core domain types (CurrentUser, Ticket stub)"
      exports: ["ApiResponse", "CurrentUser", "UserRole"]
  key_links:
    - from: "frontend/src/middleware.ts"
      to: "frontend/src/lib/auth.ts"
      via: "middleware calls getSession() to read ureport_session cookie"
      pattern: "getSession|ureport_session"
    - from: "frontend/src/app/login/page.tsx"
      to: "crm/src/Controllers/Auth/LoginController.php"
      via: "SSO button href points to PHP backend /auth/login"
      pattern: "/auth/login"
    - from: "frontend/src/app/dashboard/layout.tsx"
      to: "frontend/src/middleware.ts"
      via: "middleware protects /dashboard/* before layout renders"
      pattern: "dashboard"
    - from: "frontend/src/lib/api-client.ts"
      to: "crm/src/Http/JsonResponse.php"
      via: "apiClient parses { data, meta, errors } JSON envelope from PHP API"
      pattern: "data.*meta.*errors"

integration_contracts:
  requires:
    - from_plan: "03"
      artifact: "crm/src/Controllers/Auth/LoginController.php"
      exports: ["GET /auth/login — OIDC redirect initiator"]
      verify: "grep -n 'class LoginController' crm/src/Controllers/Auth/LoginController.php && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "crm/src/Controllers/Auth/CallbackController.php"
      exports: ["GET /auth/callback — sets ureport_session cookie, redirects to /dashboard"]
      verify: "grep -n 'ureport_session' crm/src/Controllers/Auth/CallbackController.php && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "crm/src/Controllers/Auth/MeController.php"
      exports: ["GET /auth/me — returns CurrentUser { id, firstName, lastName, role, department, primaryEmail }"]
      verify: "grep -n 'class MeController' crm/src/Controllers/Auth/MeController.php && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "crm/src/Http/JsonResponse.php"
      exports: ["JsonResponse::success — emits { data, meta, errors } envelope"]
      verify: "grep -n 'function success' crm/src/Http/JsonResponse.php && echo CONTRACT_OK"
    - from_plan: "04"
      artifact: "crm/src/Controllers/Api/TicketController.php"
      exports: ["GET /api/tickets — ticket list endpoint consumed by dashboard"]
      verify: "grep -n 'class TicketController' crm/src/Controllers/Api/TicketController.php && echo CONTRACT_OK"
  provides:
    - artifact: "frontend/src/lib/api-client.ts"
      exports: ["apiClient", "ApiResponse<T>"]
      shape: |
        export async function apiClient<T>(
          path: string,
          options?: RequestInit
        ): Promise<ApiResponse<T>>

        export interface ApiResponse<T> {
          data: T;
          meta: Record<string, unknown>;
          errors: Array<{ field: string | null; message: string; code: string }>;
        }
      verify: "grep -n 'export.*apiClient\|export.*ApiResponse' frontend/src/lib/api-client.ts && echo CONTRACT_OK"
    - artifact: "frontend/src/types/api.ts"
      exports: ["CurrentUser", "UserRole", "ApiResponse"]
      shape: |
        export type UserRole = 'admin' | 'staff' | 'public' | 'anonymous';
        export interface CurrentUser {
          id: number;
          firstName: string;
          lastName: string;
          role: UserRole;
          department: { id: number; name: string } | null;
          primaryEmail: string | null;
        }
      verify: "grep -n 'UserRole\|CurrentUser' frontend/src/types/api.ts && echo CONTRACT_OK"
    - artifact: "frontend/src/middleware.ts"
      exports: ["middleware — Next.js edge middleware protecting /dashboard, /tickets, /admin, /reports routes"]
      shape: |
        // Reads ureport_session cookie.
        // Unauthenticated → redirect to /login?redirect=<original_url>
        // Authenticated public role on /dashboard → redirect to /submit
        export { middleware };
        export const config = { matcher: ['/dashboard/:path*', '/tickets/:path*', '/admin/:path*', '/reports/:path*'] };
      verify: "grep -n 'export.*middleware\|ureport_session' frontend/src/middleware.ts && echo CONTRACT_OK"
    - artifact: "frontend/src/app/dashboard/layout.tsx"
      exports: ["DashboardLayout — authenticated shell consumed by all Wave 3a+ staff pages"]
      shape: |
        // Props: { children: React.ReactNode }
        // Renders: <TopNav /> + <Sidebar /> + <main>{children}</main>
        // Server component: reads session, passes CurrentUser to client children via context
      verify: "grep -n 'DashboardLayout\|TopNav\|Sidebar' frontend/src/app/dashboard/layout.tsx && echo CONTRACT_OK"
---

<objective>
Bootstrap the Next.js 15 SPA shell that is the primary UI container for all Wave 3a–3d frontend work. This plan delivers: the project scaffold (TypeScript strict, Tailwind CSS, shadcn/ui wiring), the OIDC login/logout/callback pages that bridge the SPA to the PHP OIDC backend, authenticated route middleware that enforces role-based access, and the staff dashboard layout shell with persistent top navigation and sidebar.

Purpose: Wave 3b, 3c, and 3d all depend on the DashboardLayout, apiClient, auth middleware, and TypeScript types established here. Getting the OIDC handoff, cookie session reading, and route guard correct now prevents auth regressions across all subsequent frontend plans.

Output:
- frontend/ — Next.js 15 project with TypeScript strict + Tailwind + shadcn/ui scaffold
- frontend/next.config.mjs — dev server bound to 0.0.0.0:3000, API proxy to PHP, no X-Frame-Options DENY
- frontend/src/middleware.ts — Edge middleware protecting all staff routes
- frontend/src/lib/auth.ts + api-client.ts — Auth utilities and typed API fetch wrapper
- frontend/src/types/api.ts — Shared TypeScript interfaces (CurrentUser, UserRole, ApiResponse)
- frontend/src/app/login/page.tsx — OIDC login page
- frontend/src/app/auth/callback/page.tsx — OIDC callback landing
- frontend/src/app/auth/logout/route.ts — Logout API route
- frontend/src/app/dashboard/layout.tsx + page.tsx — Dashboard shell with TopNav + Sidebar
- frontend/src/components/nav/TopNav.tsx + Sidebar.tsx — Navigation components
</objective>

<feature_dependencies>
Implements: F15: Modern React/Next.js SPA Frontend — project scaffold, navigation shell, authenticated routing; F11: Authentication — OIDC login/callback/logout pages, HttpOnly cookie session reading, role-based redirect; F10: RBAC — Edge middleware enforcing route access by role (admin/staff can access /dashboard; public redirected to /submit)
Depends on: F16: RESTful JSON API Backend — PHP /auth/login, /auth/callback, /auth/me, /auth/logout endpoints (Wave 2a Plans 03/04)
Enables: F0: Ticket Management UI (Wave 3a Plan 12 builds on DashboardLayout + apiClient established here); F15: All admin/search/reports screens (Waves 3b/3c/3d) consume this shell
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/UX-Mockup-uReport.md
@project_specs/PRD-uReport.md

# Wave 2a auth contracts consumed by this plan:
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/03-PLAN.md

Key constraints:
- next.config.mjs (NOT next.config.ts) — constraint from plan instructions
- Dev server MUST bind to 0.0.0.0:3000 (not localhost only)
- NO X-Frame-Options: DENY header from Next.js (allow iframe preview)
- TypeScript strict mode: "strict": true in tsconfig.json
- Component library: Radix UI / shadcn/ui
- Cookie name: ureport_session (HttpOnly, set by PHP backend)
- PHP API base URL: proxied at /api/* in development; direct in production via NEXT_PUBLIC_API_URL
- OIDC flow: SPA does NOT do OIDC directly — it navigates browser to PHP /auth/login; PHP sets cookie; redirects back to Next.js /auth/callback (or /dashboard)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Next.js 15 project scaffold with TypeScript strict, Tailwind CSS, shadcn/ui, and next.config.mjs</name>
  <files>
    frontend/package.json
    frontend/next.config.mjs
    frontend/tsconfig.json
    frontend/tailwind.config.ts
    frontend/postcss.config.mjs
    frontend/.env.local.example
    frontend/src/types/api.ts
    frontend/src/lib/auth.ts
    frontend/src/lib/api-client.ts
    frontend/src/app/layout.tsx
    frontend/src/app/page.tsx
    frontend/src/app/globals.css
    frontend/components.json
  </files>
  <action>
**Step 1: Create frontend/package.json**

Bootstrap a Next.js 15 project. All dependencies pinned to stable versions.

```json
{
  "name": "ureport-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --hostname 0.0.0.0 --port 3000",
    "build": "next build",
    "start": "next start --hostname 0.0.0.0 --port 3000",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.3.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.3",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.1.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.5.1",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.0.0",
    "eslint-config-next": "15.3.3"
  }
}
```

**Step 2: Create frontend/next.config.mjs**

Critical constraints:
- Dev server 0.0.0.0:3000 is in package.json `--hostname` flag; next.config.mjs sets no separate host.
- NO `X-Frame-Options: DENY` header (allow iframe preview).
- API rewrites proxy `/api/*` and `/auth/*` to PHP backend in development.
- Use `.mjs` extension (NOT `.ts`).

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do NOT add X-Frame-Options: DENY — iframe preview must work
  // Security headers that are safe to set:
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Deliberately omitting X-Frame-Options to allow iframe preview
        ],
      },
    ];
  },

  // In development, proxy PHP API calls to the PHP container
  async rewrites() {
    const phpApiBase = process.env.PHP_API_BASE_URL ?? 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${phpApiBase}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${phpApiBase}/auth/:path*`,
      },
      {
        source: '/open311/:path*',
        destination: `${phpApiBase}/open311/:path*`,
      },
    ];
  },

  // TypeScript strict is configured in tsconfig.json, not here
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
```

**Step 3: Create frontend/tsconfig.json**

TypeScript strict mode, Next.js compatible.

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4: Create frontend/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      screens: {
        sm: '375px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1920px',
      },
      colors: {
        // uReport semantic status tokens (UX-Mockup §Design System)
        'status-open': '#3b82f6',   // blue-500
        'status-closed': '#6b7280', // gray-500
        'sla-ok': '#22c55e',        // green-500
        'sla-warning': '#f59e0b',   // amber-500
        'sla-breach': '#ef4444',    // red-500
      },
    },
  },
  plugins: [animate],
};

export default config;
```

**Step 5: Create frontend/postcss.config.mjs**

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

**Step 6: Create frontend/.env.local.example**

```bash
# PHP API backend URL (used by next.config.mjs rewrites in development)
# In production, set this to the PHP API base URL.
PHP_API_BASE_URL=http://localhost:8080

# Public API URL for client-side requests in production
# In development, requests go through Next.js rewrites (no CORS needed).
NEXT_PUBLIC_API_URL=

# Application URL (used for OIDC callback redirect construction)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 7: Create frontend/src/types/api.ts**

Core TypeScript interfaces for the API envelope and shared domain types.

```typescript
// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiError {
  field: string | null;
  message: string;
  code: string | null;
}

export interface ApiMeta {
  page?: number;
  perPage?: number;
  total?: number;
  pages?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
  errors: ApiError[];
}

// ─── Auth / User ──────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'staff' | 'public' | 'anonymous';

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: { id: number; name: string } | null;
  primaryEmail: string | null;
}

// ─── Ticket (stub — full type expanded in Wave 3a Plan 12) ───────────────────

export interface TicketSummary {
  id: number;
  title: string;
  status: 'open' | 'closed';
  category: { id: number; name: string };
  department: { id: number; name: string };
  assignee: { id: number; name: string } | null;
  sla: {
    slaDays: number | null;
    expectedCloseDate: string | null;
    status: 'on_time' | 'late' | 'no_sla';
    pctElapsed: number | null;
  };
  datetimeOpened: string;
  datetimeClosed: string | null;
}
```

**Step 8: Create frontend/src/lib/auth.ts**

Auth utilities for reading the session cookie (server-side in Server Components and middleware).

```typescript
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
```

**Step 9: Create frontend/src/lib/api-client.ts**

Typed fetch wrapper. In development, calls go through Next.js rewrites (no CORS). In production, uses NEXT_PUBLIC_API_URL.

```typescript
import { type ApiResponse } from '@/types/api';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors: ApiResponse<never>['errors'] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base URL for API calls.
 * - Client-side: relative path (Next.js rewrites handle proxying in dev)
 * - Server-side SSR: must be absolute (PHP_API_BASE_URL)
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client: use relative path — rewrite proxy handles /api/* and /auth/*
    return '';
  }
  // Server: absolute URL to PHP backend
  return process.env.PHP_API_BASE_URL ?? 'http://localhost:8080';
}

/**
 * Typed fetch wrapper for the PHP JSON API.
 * Parses { data, meta, errors } envelope.
 * Throws ApiError on non-2xx responses.
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${getBaseUrl()}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send ureport_session cookie
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, 'PARSE_ERROR', 'Invalid JSON response from API');
  }

  if (!res.ok) {
    const firstError = json.errors?.[0];
    throw new ApiError(
      res.status,
      firstError?.code ?? 'API_ERROR',
      firstError?.message ?? `HTTP ${res.status}`,
      json.errors
    );
  }

  return json;
}

export { ApiError };
```

**Step 10: Create frontend/src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }

  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-size: 16px; /* minimum per UX spec §Design System */
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  }
}
```

**Step 11: Create frontend/src/app/layout.tsx**

Root layout — minimal, no auth logic here.

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'uReport — Municipal CRM',
  description: 'Municipal service request management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Step 12: Create frontend/src/app/page.tsx**

Root redirect — send to /login (unauthenticated) or /dashboard (middleware handles auth).

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { redirectByRole } from '@/lib/auth';

export default async function RootPage() {
  const user = await getSession();
  if (user) {
    redirect(redirectByRole(user.role));
  }
  redirect('/login');
}
```

**Step 13: Create frontend/components.json**

shadcn/ui configuration file. Required so `npx shadcn@latest add <component>` works correctly in Wave 3b+.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

Also create the shadcn/ui utility helper frontend/src/lib/utils.ts:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend

# Project structure exists
ls package.json next.config.mjs tsconfig.json tailwind.config.ts postcss.config.mjs && echo "CONFIG FILES OK"

# next.config.mjs uses .mjs extension (NOT .ts)
ls next.config.mjs && echo "MJS EXTENSION OK"

# X-Frame-Options DENY must NOT be in next.config.mjs
grep -v 'X-Frame-Options.*DENY\|DENY.*X-Frame-Options' next.config.mjs && echo "NO_XFRAME_DENY OK"

# Dev server hostname 0.0.0.0 in package.json
grep '0.0.0.0' package.json && echo "HOSTNAME_0000 OK"

# TypeScript strict mode enabled
grep '"strict": true' tsconfig.json && echo "TS_STRICT OK"

# Core source files exist
ls src/types/api.ts src/lib/auth.ts src/lib/api-client.ts src/app/layout.tsx src/app/page.tsx src/app/globals.css && echo "SRC FILES OK"

# Key exports present
grep -n 'export.*apiClient\|export.*ApiResponse' src/lib/api-client.ts && echo "API_CLIENT_EXPORTS OK"
grep -n 'export.*getSession\|export.*redirectByRole' src/lib/auth.ts && echo "AUTH_EXPORTS OK"
grep -n 'UserRole\|CurrentUser' src/types/api.ts && echo "TYPES_EXPORTS OK"

# PHP API proxy rewrites configured
grep -n 'rewrites\|PHP_API_BASE_URL' next.config.mjs && echo "PROXY_REWRITES OK"

# Install dependencies
npm install --silent && echo "NPM_INSTALL OK"

# TypeScript type check
npm run type-check 2>&1 | tail -10 && echo "TYPE_CHECK OK"
```
  </verify>
  <done>
- All config files exist: package.json, next.config.mjs (NOT .ts), tsconfig.json, tailwind.config.ts, postcss.config.mjs
- next.config.mjs contains NO `X-Frame-Options: DENY` header
- package.json `dev` script includes `--hostname 0.0.0.0 --port 3000`
- tsconfig.json has `"strict": true`
- src/types/api.ts exports `ApiResponse<T>`, `CurrentUser`, `UserRole`
- src/lib/auth.ts exports `getSession()`, `redirectByRole()`, `isStaffOrAdmin()`
- src/lib/api-client.ts exports `apiClient<T>()` and `ApiError`
- `npm install` exits 0
- `npm run type-check` exits 0 with 0 errors
  </done>
</task>

<task type="auto">
  <name>Task 2: OIDC login/callback/logout pages + authenticated route middleware + staff dashboard shell</name>
  <files>
    frontend/src/middleware.ts
    frontend/src/app/login/page.tsx
    frontend/src/app/auth/callback/page.tsx
    frontend/src/app/auth/logout/route.ts
    frontend/src/app/dashboard/layout.tsx
    frontend/src/app/dashboard/page.tsx
    frontend/src/components/nav/TopNav.tsx
    frontend/src/components/nav/Sidebar.tsx
  </files>
  <action>
**Step 1: frontend/src/middleware.ts**

Next.js Edge Middleware. Reads `ureport_session` cookie. Protects /dashboard, /tickets, /admin, /reports routes. Does NOT make a network call (edge-compatible — just checks cookie presence; full user fetch happens in Server Components).

Note: Full JWT validation in middleware requires running the PHP backend or replicating JWT logic in Edge. For this plan, the middleware checks cookie presence; the dashboard Server Component calls `/auth/me` to validate the session and handles 401 by redirecting to /login.

```typescript
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
```

**Step 2: frontend/src/app/login/page.tsx**

Login page per UX-Mockup Screen 00. Single CTA "Sign in with City SSO" that navigates to PHP /auth/login. No username/password fields.

```typescript
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
```

**Step 3: frontend/src/app/auth/callback/page.tsx**

OIDC callback page. The PHP backend sets the `ureport_session` cookie and redirects the browser to the SPA. This page finalises the SPA side: reads the session and redirects to the role-appropriate page.

```typescript
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
```

**Step 4: frontend/src/app/auth/logout/route.ts**

Next.js API Route that clears the session cookie on the SPA side and then proxies the logout request to the PHP backend. This ensures the cookie is cleared even if the PHP redirect doesn't hit the browser directly.

```typescript
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
```

**Step 5: frontend/src/components/nav/TopNav.tsx**

Persistent top navigation bar per UX-Mockup Screen 01. Client component for interactive user menu dropdown.

```typescript
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type CurrentUser } from '@/types/api';

interface TopNavProps {
  user: CurrentUser;
}

export function TopNav({ user }: TopNavProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login?signed_out=1');
    router.refresh();
  }

  const isAdmin = user.role === 'admin';

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-white px-4 shadow-sm">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
        <span className="text-lg">uReport</span>
      </Link>

      {/* Primary nav links */}
      <nav className="ml-8 hidden items-center gap-1 md:flex" aria-label="Primary navigation">
        <Link
          href="/tickets"
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          Tickets
        </Link>
        <Link
          href="/reports"
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          Reports
        </Link>
        <Link
          href="/map"
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        >
          Map
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New Ticket shortcut */}
      <Link
        href="/tickets/new"
        className="mr-4 hidden rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 md:inline-flex"
      >
        + New Ticket
      </Link>

      {/* User menu */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-muted"
          aria-label="User menu"
          onClick={() => {
            // Simple toggle — shadcn DropdownMenu added in Wave 3b
            const menu = document.getElementById('user-menu-dropdown');
            menu?.classList.toggle('hidden');
          }}
        >
          <span className="hidden sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown */}
        <div
          id="user-menu-dropdown"
          className="hidden absolute right-0 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg"
        >
          <div className="border-b px-4 py-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">
              {user.primaryEmail ?? `${user.firstName} ${user.lastName}`}
            </p>
            <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
```

**Step 6: frontend/src/components/nav/Sidebar.tsx**

Left sidebar for staff dashboard. Shows SLA widgets / quick links in Wave 3a Plan 12; for now renders navigation structure.

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CurrentUser } from '@/types/api';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: CurrentUser;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/map', label: 'Map', icon: '🗺️' },
];

const adminItems = [
  { href: '/admin/departments', label: 'Departments', icon: '🏢' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { href: '/admin/people', label: 'People', icon: '👥' },
  { href: '/admin/templates', label: 'Templates', icon: '📝' },
  { href: '/admin/clients', label: 'API Clients', icon: '🔑' },
  { href: '/admin/substatuses', label: 'Substatuses', icon: '🔖' },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === 'admin';

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r bg-white md:flex md:flex-col">
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Sidebar navigation">
        <ul className="space-y-1" role="list">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(item.href) && item.href !== '/dashboard'
                    ? 'bg-primary/10 text-primary'
                    : pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                )}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </p>
            <ul className="space-y-1" role="list">
              {adminItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      pathname.startsWith(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    )}
                    aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Department badge at bottom */}
      {user.department && (
        <div className="border-t p-3">
          <p className="text-xs text-muted-foreground">Department</p>
          <p className="text-sm font-medium truncate">{user.department.name}</p>
        </div>
      )}
    </aside>
  );
}
```

**Step 7: frontend/src/app/dashboard/layout.tsx**

Authenticated dashboard shell. Server Component — reads session, 401 redirects to /login, passes user to client nav components.

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { TopNav } from '@/components/nav/TopNav';
import { Sidebar } from '@/components/nav/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate session (middleware only checked cookie presence)
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  // Public role should not access staff dashboard
  if (user.role === 'public') {
    redirect('/submit');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-muted/20 p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Step 8: frontend/src/app/dashboard/page.tsx**

Dashboard landing page — stub with greeting and placeholder KPI cards. Full SLA widgets are implemented in Wave 3d Plan 19. Keeps Wave 3a Plan 12 from depending on this page.

```typescript
import { getSession } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getSession();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {greeting}{user ? `, ${user.firstName}` : ''}.
        </h1>
        <Link
          href="/tickets/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          + New Ticket
        </Link>
      </div>

      {/* KPI cards — placeholder until Wave 3d adds real data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'SLA Breached', value: '—', color: 'text-sla-breach', href: '/tickets?sla=breached' },
          { label: 'Due Today', value: '—', color: 'text-sla-warning', href: '/tickets?sla=due_today' },
          { label: 'Open Tickets', value: '—', color: 'text-status-open', href: '/tickets?status=open' },
          { label: 'SLA On-Time', value: '—', color: 'text-sla-ok', href: '/reports/sla' },
        ].map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View →
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/tickets" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            View All Tickets
          </Link>
          <Link href="/tickets/new" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            Create Ticket
          </Link>
          <Link href="/reports/sla" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            SLA Report
          </Link>
        </div>
      </div>
    </div>
  );
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend

# All target files exist
ls src/middleware.ts src/app/login/page.tsx src/app/auth/callback/page.tsx src/app/auth/logout/route.ts src/app/dashboard/layout.tsx src/app/dashboard/page.tsx src/components/nav/TopNav.tsx src/components/nav/Sidebar.tsx && echo "ALL FILES OK"

# Middleware: reads ureport_session cookie and exports config matcher
grep -n 'ureport_session' src/middleware.ts && echo "MIDDLEWARE_COOKIE OK"
grep -n 'export const config' src/middleware.ts && echo "MIDDLEWARE_CONFIG OK"
grep -n 'dashboard.*tickets.*admin\|matcher' src/middleware.ts && echo "MIDDLEWARE_MATCHER OK"

# Login page: NO username/password fields, SSO button points to /auth/login
grep -n '/auth/login' src/app/login/page.tsx && echo "LOGIN_OIDC_URL OK"
grep -v 'type="password"\|name="password"' src/app/login/page.tsx && echo "NO_PASSWORD_FIELD OK"

# Callback page: calls getSession() after PHP sets cookie
grep -n 'getSession' src/app/auth/callback/page.tsx && echo "CALLBACK_GETSESSION OK"

# Logout route: clears cookie, redirects to /login
grep -n 'ureport_session\|signed_out' src/app/auth/logout/route.ts && echo "LOGOUT_COOKIE_CLEAR OK"

# Dashboard layout: validates session, redirects public role
grep -n 'getSession\|redirect.*login\|role.*public' src/app/dashboard/layout.tsx && echo "DASHBOARD_AUTH_GUARD OK"

# TopNav: has logout handler, shows user name and role links
grep -n 'handleLogout\|Sign out' src/components/nav/TopNav.tsx && echo "TOPNAV_LOGOUT OK"
grep -n 'Tickets\|Reports\|Admin' src/components/nav/TopNav.tsx && echo "TOPNAV_LINKS OK"

# Sidebar: renders nav items, admin section conditional
grep -n 'isAdmin\|admin.*items\|Administration' src/components/nav/Sidebar.tsx && echo "SIDEBAR_ADMIN OK"

# Type check must pass
npm run type-check 2>&1 | tail -15 && echo "TYPE_CHECK_FINAL OK"

# Dev server starts (background, test port is bound to 0.0.0.0:3000)
timeout 30 npm run dev &
sleep 12
curl -sf http://0.0.0.0:3000 -o /dev/null && echo "DEV_SERVER_0000 OK" || echo "DEV_SERVER_NOT_READY (may need full PHP stack)"
kill %1 2>/dev/null || true
```
  </verify>
  <done>
- All 8 files exist and TypeScript strict mode passes (`npm run type-check` exits 0)
- `src/middleware.ts` reads `ureport_session` cookie, redirects unauthenticated requests to `/login?redirect=<path>`, exports config matcher for `/dashboard/:path*`, `/tickets/:path*`, `/admin/:path*`, `/reports/:path*`, `/map/:path*`
- `/login` page renders SSO button (`href="/auth/login"`) and citizen link (`href="/submit"`); NO username/password inputs
- `/auth/callback` page calls `getSession()` after PHP sets the cookie, redirects to role-appropriate page
- `/auth/logout` route clears `ureport_session` cookie and redirects to `/login?signed_out=1`
- `DashboardLayout` calls `getSession()`, redirects to `/login` if null, redirects `public` role to `/submit`
- `TopNav` renders: uReport logo link, Tickets/Reports/Map/Admin nav items (Admin conditional on role=admin), "+ New Ticket" button, user name with logout
- `Sidebar` renders nav items with active state highlighting; shows Administration section only for admin role
- Dev server starts on `0.0.0.0:3000` (confirmed by `--hostname 0.0.0.0` in `npm run dev`)
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/frontend

# 1. No X-Frame-Options DENY anywhere in Next.js config
grep -r 'X-Frame-Options.*DENY' next.config.mjs src/ && echo "FAIL: XFRAME DENY FOUND" || echo "PASS: No X-Frame-Options DENY"

# 2. Dev server hostname is 0.0.0.0
grep '0\.0\.0\.0' package.json && echo "PASS: Hostname 0.0.0.0 present"

# 3. Config file is .mjs (not .ts)
ls next.config.mjs && echo "PASS: next.config.mjs exists" && ls next.config.ts 2>/dev/null && echo "FAIL: next.config.ts also exists" || true

# 4. TypeScript strict mode
grep '"strict": true' tsconfig.json && echo "PASS: TypeScript strict mode"

# 5. Full TypeScript type check
npm run type-check && echo "PASS: Zero type errors"

# 6. Core integration contracts provided
grep -n 'export.*apiClient' src/lib/api-client.ts && echo "PASS: apiClient exported"
grep -n 'export.*CurrentUser' src/types/api.ts && echo "PASS: CurrentUser exported"
grep -n 'export.*middleware' src/middleware.ts && echo "PASS: middleware exported"
grep -n 'DashboardLayout\|export default' src/app/dashboard/layout.tsx && echo "PASS: DashboardLayout exported"
```
</verification>

<success_criteria>
- `npm install` exits 0
- `npm run type-check` exits 0 with 0 TypeScript errors
- `next.config.mjs` exists (not `.ts`), has NO `X-Frame-Options: DENY`, has `/api/*` and `/auth/*` rewrites to PHP backend
- `package.json` dev script includes `--hostname 0.0.0.0 --port 3000`
- `/login` page renders SSO button and citizen link; zero password inputs
- `/auth/callback` validates session via `getSession()` and redirects by role
- `DashboardLayout` validates session server-side and redirects public/unauthenticated users
- `TopNav` and `Sidebar` render navigation structure matching UX-Mockup Screen 01
- All integration contract exports verified: `apiClient`, `CurrentUser`, `UserRole`, `middleware`, `DashboardLayout`
- Wave 3a Plan 12 can import `DashboardLayout`, `apiClient`, `CurrentUser`, `getSession()` without modification
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/11-SUMMARY.md` with:
- Files created and their key exports
- Authentication flow: how SPA delegates OIDC to PHP backend
- Next.js routing structure established
- Integration contracts provided for Wave 3a Plan 12
- Any deviations from plan or issues encountered
</output>
