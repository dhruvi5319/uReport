---
phase: implement-the-full-ureport-modernization
plan: "06"
type: execute
wave: 3a
depends_on: [1, 2, 3, 4, 5]
files_modified:
  # SPA scaffold
  - web/package.json
  - web/vite.config.ts
  - web/tsconfig.json
  - web/index.html
  - web/Dockerfile
  - web/src/main.tsx
  - web/src/App.tsx
  # API client + auth
  - web/src/api/client.ts
  - web/src/api/auth.ts
  - web/src/api/tickets.ts
  - web/src/contexts/AuthContext.tsx
  - web/src/hooks/usePermission.ts
  - web/src/hooks/useAuth.ts
  # Auth pages (F4)
  - web/src/pages/LoginPage.tsx
  - web/src/pages/CallbackPage.tsx
  # Ticket pages (F0, F1)
  - web/src/pages/tickets/TicketListPage.tsx
  - web/src/pages/tickets/TicketDetailPage.tsx
  - web/src/pages/tickets/CreateTicketPage.tsx
  # Shared components
  - web/src/components/layout/AppLayout.tsx
  - web/src/components/layout/Sidebar.tsx
  - web/src/components/layout/TopBar.tsx
  - web/src/components/tickets/TicketSearchFilters.tsx
  - web/src/components/tickets/TicketHistoryList.tsx
  - web/src/components/tickets/TicketStatusBadge.tsx
  - web/src/components/common/ProtectedRoute.tsx
  - web/src/components/common/Pagination.tsx
  - web/src/components/common/LoadingSpinner.tsx
  - web/src/components/common/ErrorBanner.tsx
  # Router
  - web/src/router/index.tsx
  # State (Zustand)
  - web/src/store/authStore.ts
  - web/src/store/ticketStore.ts
  # Types
  - web/src/types/api.ts
  - web/src/types/ticket.ts
  - web/src/types/auth.ts
autonomous: true

features:
  implements: ["F0", "F1", "F3", "F4", "F11", "F18"]
  depends_on: ["F0", "F1", "F3", "F4", "F11", "F18"]
  enables: ["F5", "F6", "F7", "F8", "F9", "F13"]

must_haves:
  truths:
    - "Dev server starts on 0.0.0.0:3000 with npm run dev"
    - "Navigating to / redirects unauthenticated users to /login"
    - "Staff user can log in via LoginPage; JWT is stored and used on subsequent API calls"
    - "LoginPage form shows error on invalid credentials (401 from API)"
    - "GET /callback?code=...&state=... exchanges OAuth code and sets JWT in AuthContext"
    - "usePermission('staff') returns true only for authenticated users with role=staff"
    - "ProtectedRoute redirects to /login when user is not authenticated"
    - "TicketListPage renders a paginated list of tickets fetched from GET /api/v1/tickets"
    - "TicketSearchFilters panel supports q, status, categoryId, departmentId, assignedPersonId, substatus, date range, city, zip, contactMethodId filter fields — every filter change re-fetches the ticket list"
    - "Staff-only buttons (CSV export, Create ticket) are not rendered for non-staff users"
    - "CSV export button triggers GET /api/v1/tickets/export?format=csv download"
    - "TicketDetailPage fetches ticket + history and renders full history list with renderedDescription"
    - "History list renders each entry with action name, rendered description, entered-by name, and date"
    - "CreateTicketPage posts to POST /api/v1/tickets; on success navigates to the new ticket's detail page"
    - "All primary nav items in Sidebar link to real routes (no dead 404 links)"
    - "Every error from the API is surfaced via ErrorBanner with the error code and message"
  artifacts:
    - path: "web/package.json"
      provides: "React 18 + Vite + TypeScript project with react-router-dom, axios, zustand, react-hook-form, date-fns"
    - path: "web/vite.config.ts"
      provides: "Vite config with server.host=0.0.0.0, server.port=3000, API proxy to backend"
    - path: "web/src/api/client.ts"
      provides: "Axios instance with baseURL /api/v1, request interceptor adding Authorization: Bearer, response interceptor handling 401 token refresh"
      exports: ["apiClient"]
    - path: "web/src/contexts/AuthContext.tsx"
      provides: "AuthContext with user (personId, role), login(), logout(), refreshToken() methods"
      exports: ["AuthContext", "useAuthContext", "AuthProvider"]
    - path: "web/src/hooks/usePermission.ts"
      provides: "usePermission(requiredRole) hook returning boolean — used to gate staff-only UI"
      exports: ["usePermission"]
    - path: "web/src/pages/LoginPage.tsx"
      provides: "Login form posting to POST /api/v1/auth/login; stores JWT in AuthContext on success"
    - path: "web/src/pages/tickets/TicketListPage.tsx"
      provides: "Paginated ticket list with TicketSearchFilters, CSV export button, Create Ticket link"
    - path: "web/src/pages/tickets/TicketDetailPage.tsx"
      provides: "Ticket detail view with full TicketHistoryList"
    - path: "web/src/pages/tickets/CreateTicketPage.tsx"
      provides: "Create ticket form posting to POST /api/v1/tickets"
    - path: "web/src/components/tickets/TicketSearchFilters.tsx"
      provides: "Filter form for all F11 search params"
    - path: "web/src/components/tickets/TicketHistoryList.tsx"
      provides: "Chronological history log from GET /api/v1/tickets/{id}/history"
    - path: "web/src/router/index.tsx"
      provides: "React Router v6 route tree; all routes lead to real page components"
  key_links:
    - from: "web/src/api/client.ts"
      to: "web/src/contexts/AuthContext.tsx"
      via: "response interceptor calls refreshToken() on 401; on refresh failure calls logout()"
      pattern: "refreshToken.*logout"
    - from: "web/src/components/common/ProtectedRoute.tsx"
      to: "web/src/contexts/AuthContext.tsx"
      via: "reads user from context; redirects to /login if null"
      pattern: "useAuthContext.*Navigate"
    - from: "web/src/pages/tickets/TicketListPage.tsx"
      to: "web/src/api/tickets.ts"
      via: "calls searchTickets(params) on filter change; updates ticketStore"
      pattern: "searchTickets"
    - from: "web/src/components/tickets/TicketSearchFilters.tsx"
      to: "web/src/pages/tickets/TicketListPage.tsx"
      via: "onFilterChange callback triggers re-fetch with new TicketSearchParams"
      pattern: "onFilterChange"
    - from: "web/src/hooks/usePermission.ts"
      to: "web/src/contexts/AuthContext.tsx"
      via: "reads user.role from context; compares against required permission level"
      pattern: "user\\.role.*requiredRole"

integration_contracts:
  requires:
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/controller/AuthController.java"
      exports: ["POST /api/v1/auth/login", "POST /api/v1/auth/refresh", "POST /api/v1/auth/logout"]
      verify: "grep -n 'PostMapping.*auth/login' api/src/main/java/com/ureport/controller/AuthController.java && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/controller/TicketController.java"
      exports: ["POST /api/v1/tickets", "PATCH /api/v1/tickets/{id}", "PATCH /api/v1/tickets/{id}/assign", "PATCH /api/v1/tickets/{id}/close", "PATCH /api/v1/tickets/{id}/reopen"]
      verify: "grep -n 'PostMapping.*api/v1/tickets' api/src/main/java/com/ureport/controller/TicketController.java && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/controller/TicketHistoryController.java"
      exports: ["GET /api/v1/tickets/{id}/history"]
      verify: "grep -n 'GetMapping.*history' api/src/main/java/com/ureport/controller/TicketHistoryController.java && echo CONTRACT_OK"
    - from_plan: "03"
      artifact: "api/src/main/java/com/ureport/controller/TicketSearchController.java"
      exports: ["GET /api/v1/tickets", "GET /api/v1/tickets/export", "GET /api/v1/tickets/map"]
      verify: "grep -n 'GetMapping.*api/v1/tickets' api/src/main/java/com/ureport/controller/TicketSearchController.java && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/dto/response/AuthResponse.java"
      exports: ["accessToken", "refreshToken", "expiresIn", "role", "personId"]
      verify: "grep -n 'accessToken' api/src/main/java/com/ureport/dto/response/AuthResponse.java && grep -n 'role' api/src/main/java/com/ureport/dto/response/AuthResponse.java && echo CONTRACT_OK"
  provides:
    - artifact: "web/src/api/client.ts"
      exports: ["apiClient (Axios instance)"]
      shape: |
        Axios instance configured with:
          baseURL: '/api/v1'
          Authorization: Bearer {token} request interceptor
          401 response interceptor: attempt token refresh, on failure logout + redirect /login
        Export: export const apiClient = axios.create({ ... })
      verify: "grep -n 'apiClient' web/src/api/client.ts && grep -n 'interceptors' web/src/api/client.ts && echo CONTRACT_OK"
    - artifact: "web/src/contexts/AuthContext.tsx"
      exports: ["AuthContext", "AuthProvider", "useAuthContext"]
      shape: |
        interface AuthUser { personId: number; role: 'staff' | 'public' | 'anonymous'; }
        interface AuthContextValue {
          user: AuthUser | null;
          login(username: string, password: string): Promise<void>;
          logout(): void;
          refreshToken(): Promise<boolean>;
        }
        Persists accessToken + refreshToken in localStorage.
        Exported: AuthProvider (React context provider) and useAuthContext() hook.
      verify: "grep -n 'AuthProvider' web/src/contexts/AuthContext.tsx && grep -n 'useAuthContext' web/src/contexts/AuthContext.tsx && echo CONTRACT_OK"
    - artifact: "web/src/hooks/usePermission.ts"
      exports: ["usePermission(requiredRole: string): boolean"]
      shape: |
        Role hierarchy: anonymous(0) < public(1) < staff(2).
        usePermission('staff') returns true iff user.role === 'staff'.
        usePermission('public') returns true iff user.role in ['staff','public'].
        usePermission('anonymous') always returns true when user exists.
      verify: "grep -n 'usePermission' web/src/hooks/usePermission.ts && grep -n 'staff' web/src/hooks/usePermission.ts && echo CONTRACT_OK"
    - artifact: "web/src/pages/tickets/TicketListPage.tsx"
      exports: ["TicketListPage React component"]
      shape: |
        Renders: TicketSearchFilters, paginated ticket table, CSV export button (staff only),
        Create Ticket button (staff only), Pagination component.
        Fetches: GET /api/v1/tickets with TicketSearchParams on mount + filter change.
        CSV export: window.location.href = /api/v1/tickets/export?format=csv&{currentFilters}
      verify: "grep -n 'TicketListPage' web/src/pages/tickets/TicketListPage.tsx && grep -n 'searchTickets\|api/v1/tickets' web/src/pages/tickets/TicketListPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/tickets/TicketDetailPage.tsx"
      exports: ["TicketDetailPage React component"]
      shape: |
        Renders: ticket header (id, status, substatus, category, description, location, dates),
        TicketHistoryList component, action buttons (assign, close, reopen — staff only).
        Fetches: GET /api/v1/tickets/{id} and GET /api/v1/tickets/{id}/history on mount.
      verify: "grep -n 'TicketDetailPage' web/src/pages/tickets/TicketDetailPage.tsx && grep -n 'history' web/src/pages/tickets/TicketDetailPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/components/tickets/TicketSearchFilters.tsx"
      exports: ["TicketSearchFilters React component"]
      shape: |
        Props: { filters: TicketSearchParams; onFilterChange(params: TicketSearchParams): void }
        Fields rendered: q (text), status (select: open/closed/all), categoryId (select),
        departmentId (select), assignedPersonId (text/select), substatusId (select),
        enteredDateFrom/To (date inputs), city (text), zip (text), contactMethodId (select).
        Every field change calls onFilterChange with updated params.
      verify: "grep -n 'TicketSearchFilters' web/src/components/tickets/TicketSearchFilters.tsx && grep -n 'onFilterChange' web/src/components/tickets/TicketSearchFilters.tsx && echo CONTRACT_OK"
    - artifact: "web/src/router/index.tsx"
      exports: ["AppRouter React component with all routes"]
      shape: |
        Routes:
          / → redirect to /tickets
          /login → LoginPage (public)
          /callback → CallbackPage (public)
          /tickets → ProtectedRoute → TicketListPage
          /tickets/new → ProtectedRoute (staff) → CreateTicketPage
          /tickets/:id → ProtectedRoute → TicketDetailPage
          /people → ProtectedRoute (staff) → placeholder PeopleListPage
          /departments → ProtectedRoute (staff) → placeholder DepartmentsPage
          /categories → ProtectedRoute (staff) → placeholder CategoriesPage
          /admin/substatuses → ProtectedRoute (staff) → placeholder SubstatusPage
          /admin/actions → ProtectedRoute (staff) → placeholder ActionsPage
          /admin/clients → ProtectedRoute (staff) → placeholder ClientsPage
          /admin/jobs → ProtectedRoute (staff) → placeholder AdminJobsPage
          /metrics → ProtectedRoute (staff) → placeholder MetricsDashboardPage
          /reports → ProtectedRoute (staff) → placeholder ReportsPage
        All placeholder pages render a titled div — NO empty routes causing 404.
      verify: "grep -n 'AppRouter\|createBrowserRouter\|RouterProvider' web/src/router/index.tsx && grep -n '/tickets' web/src/router/index.tsx && echo CONTRACT_OK"
---

<objective>
Scaffold the React 18 + TypeScript SPA and implement all P0 frontend features: the project
scaffold (Vite, React Router, Zustand, Axios), authentication flows (F4), RBAC permission
hooks (F3), ticket list with full search filter UI (F11), ticket detail with history log (F0,
F1), ticket creation form (F0), and CSV/print export controls (F18).

Purpose: This wave establishes the SPA skeleton that Wave 3b (admin pages) and Wave 3c
(remaining pages) attach to. Without this wave, no frontend code exists at all. The
integration_contracts.provides artifacts — AppRouter, AuthContext, usePermission hook,
ApiClient, TicketListPage, TicketDetailPage, CreateTicketPage — are all consumed by Wave 3b.

Output:
- web/ directory: complete React 18 + Vite + TypeScript SPA project
- Axios API client with JWT interceptors + token refresh
- AuthContext + Zustand authStore for JWT state
- usePermission(role) hook for staff/public/anonymous RBAC gating
- LoginPage (F4), CallbackPage (F4)
- TicketListPage with TicketSearchFilters (F11), CSV export (F18)
- TicketDetailPage with TicketHistoryList (F0, F1)
- CreateTicketPage (F0)
- AppLayout with Sidebar nav (all items point to real routes)
- ProtectedRoute component for role-gated routing
</objective>

<feature_dependencies>
Implements: F0: Ticket UI (TicketListPage, TicketDetailPage, CreateTicketPage — list/view/create
  ticket flows; action buttons assign/close/reopen gated to staff);
  F1: Ticket history UI (TicketHistoryList rendering chronological entries with renderedDescription,
  enteredByPerson name, actionPerson name, enteredDate, notes);
  F3: RBAC/auth UI (usePermission hook, ProtectedRoute, staff-gated rendering of admin nav items
  and export buttons per F03 permission hierarchy: anonymous < public < staff);
  F4: Login/auth screens (LoginPage form → POST /api/v1/auth/login, JWT storage, token refresh
  interceptor, CallbackPage → GET /callback OAuth flow, logout);
  F11: Search UI (TicketSearchFilters with all filter params from FRD F11 — q, status,
  categoryId, departmentId, assignedPersonId, substatusId, contactMethodId, date ranges, city,
  zip; every field change triggers re-fetch; paginated results);
  F18: Multi-format export UI (CSV export button on TicketListPage triggers
  GET /api/v1/tickets/export?format=csv download; print button triggers format=print)
Depends on: F3 backend (SecurityConfig, JWT filter — Wave 2a),
  F4 backend (POST /api/v1/auth/login, /refresh, /logout — Wave 2a),
  F0 backend (TicketController CRUD endpoints — Wave 2a),
  F1 backend (GET /api/v1/tickets/{id}/history — Wave 2a),
  F11 backend (GET /api/v1/tickets search + export — Wave 2b),
  F18 backend (CsvExportUtil, FormatFilter — Wave 2b)
Enables: F5 UI (PeopleListPage/PersonDetailPage — Wave 3b needs AuthContext + AppLayout),
  F6/F7/F8/F9/F13 UI (admin pages in Wave 3b need usePermission + ProtectedRoute from this wave)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@.planning/express/implement-the-full-ureport-modernization/02-PLAN.md
@.planning/express/implement-the-full-ureport-modernization/03-PLAN.md
@project_specs/PRD-uReport.md         (F0, F1, F3, F4, F11, F18 feature capabilities)
@project_specs/UserStories-uReport.md (US-0.1–0.8, US-1.1–1.3, US-3.1–3.3, US-4.1–4.4, US-11.1–11.3, US-18.1–18.2)
@project_specs/RTM-uReport.md        (TechArch frontend components: LoginPage, TicketListPage, TicketDetailPage, etc.)
</context>

<tasks>

<task type="auto">
  <name>Task 1: SPA scaffold, API client, AuthContext, RBAC hooks, auth pages (F3, F4)</name>
  <files>
    web/package.json
    web/vite.config.ts
    web/tsconfig.json
    web/index.html
    web/Dockerfile
    web/src/main.tsx
    web/src/App.tsx
    web/src/api/client.ts
    web/src/api/auth.ts
    web/src/api/tickets.ts
    web/src/contexts/AuthContext.tsx
    web/src/hooks/usePermission.ts
    web/src/hooks/useAuth.ts
    web/src/store/authStore.ts
    web/src/store/ticketStore.ts
    web/src/types/api.ts
    web/src/types/ticket.ts
    web/src/types/auth.ts
    web/src/pages/LoginPage.tsx
    web/src/pages/CallbackPage.tsx
    web/src/components/common/ProtectedRoute.tsx
    web/src/components/common/LoadingSpinner.tsx
    web/src/components/common/ErrorBanner.tsx
    web/src/components/common/Pagination.tsx
    web/src/components/layout/AppLayout.tsx
    web/src/components/layout/Sidebar.tsx
    web/src/components/layout/TopBar.tsx
    web/src/router/index.tsx
  </files>
  <action>
Create the `web/` directory at the repository root. Scaffold the complete React 18 +
TypeScript SPA project and implement F3 (RBAC hooks) and F4 (auth screens + API client).

---

### web/package.json

```json
{
  "name": "ureport-web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev":   "vite --host 0.0.0.0 --port 3000",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react":              "^18.3.1",
    "react-dom":          "^18.3.1",
    "react-router-dom":   "^6.23.1",
    "axios":              "^1.7.2",
    "zustand":            "^4.5.4",
    "react-hook-form":    "^7.52.0",
    "date-fns":           "^3.6.0"
  },
  "devDependencies": {
    "@types/react":        "^18.3.3",
    "@types/react-dom":    "^18.3.0",
    "@vitejs/plugin-react":"^4.3.0",
    "typescript":          "^5.5.2",
    "vite":                "^5.3.1"
  }
}
```

---

### web/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // bind to all interfaces for sandbox preview
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
      '/open311': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
      '/callback': {
        target: process.env.VITE_API_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  // IMPORTANT: do NOT set X-Frame-Options DENY or CSP frame-ancestors — must allow iframe embedding
});
```

---

### web/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

---

### web/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>uReport</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### web/Dockerfile

Multi-stage build for production Nginx serving:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# CRITICAL: Do NOT add X-Frame-Options DENY or CSP frame-ancestors headers here
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Also create `web/nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### web/src/types/auth.ts

```typescript
export interface AuthUser {
  personId: number;
  role: 'staff' | 'public' | 'anonymous';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: string;
  personId: number;
}
```

---

### web/src/types/ticket.ts

```typescript
export interface Ticket {
  id: number;
  status: 'open' | 'closed';
  substatusName?: string;
  categoryId: number;
  categoryName?: string;
  description: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  enteredDate: string;
  lastModified: string;
  closedDate?: string;
  assignedPersonId?: number;
  assignedPersonName?: string;
  reportedByPersonId?: number;
  contactMethodName?: string;
  mediaCount?: number;
  customFields?: Record<string, unknown>;
}

export interface TicketSearchParams {
  q?: string;
  status?: string;
  categoryId?: number;
  departmentId?: number;
  assignedPersonId?: number;
  enteredByPersonId?: number;
  substatusId?: number;
  contactMethodId?: number;
  issueTypeId?: number;
  enteredDateFrom?: string;
  enteredDateTo?: string;
  closedDateFrom?: string;
  closedDateTo?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface TicketHistoryEntry {
  id: number;
  actionName: string;
  renderedDescription: string;
  enteredByPersonName?: string;
  actionPersonName?: string;
  enteredDate: string;
  notes?: string;
  sentNotifications?: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
```

---

### web/src/types/api.ts

```typescript
export interface ApiError {
  error: string;
  message: string;
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: ApiError };
```

---

### web/src/api/client.ts

Axios instance with JWT interceptors:

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY  = 'ureport_access_token';
const REFRESH_TOKEN_KEY = 'ureport_refresh_token';

export const getAccessToken  = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 try refresh, on failure clear auth and redirect
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        setTokens(accessToken, newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

---

### web/src/api/auth.ts

```typescript
import { apiClient } from './client';
import type { LoginRequest, AuthResponse } from '@/types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then(r => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),
};
```

---

### web/src/api/tickets.ts

```typescript
import { apiClient } from './client';
import type { Ticket, TicketHistoryEntry, TicketSearchParams, PagedResult } from '@/types/ticket';

export const ticketsApi = {
  search: (params: TicketSearchParams) =>
    apiClient.get<PagedResult<Ticket>>('/tickets', { params }).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<Ticket>(`/tickets/${id}`).then(r => r.data),

  getHistory: (id: number) =>
    apiClient.get<TicketHistoryEntry[]>(`/tickets/${id}/history`).then(r => r.data),

  create: (data: Partial<Ticket> & { categoryId: number; description: string }) =>
    apiClient.post<Ticket>('/tickets', data).then(r => r.data),

  assign: (id: number, assignedPersonId: number) =>
    apiClient.patch<Ticket>(`/tickets/${id}/assign`, { assignedPersonId }).then(r => r.data),

  close: (id: number, substatusId: number) =>
    apiClient.patch<Ticket>(`/tickets/${id}/close`, { substatus_id: substatusId }).then(r => r.data),

  reopen: (id: number, reason?: string) =>
    apiClient.patch<Ticket>(`/tickets/${id}/reopen`, { reason }).then(r => r.data),

  comment: (id: number, notes: string) =>
    apiClient.post(`/tickets/${id}/comments`, { notes }).then(r => r.data),

  /** Build export URL for CSV or print download (triggers browser download) */
  buildExportUrl: (params: TicketSearchParams, format: 'csv' | 'print') => {
    const q = new URLSearchParams();
    q.set('format', format);
    Object.entries(params).forEach(([k, v]) => { if (v != null) q.set(k, String(v)); });
    return `/api/v1/tickets/export?${q.toString()}`;
  },
};
```

---

### web/src/store/authStore.ts

```typescript
import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  setUser: user => set({ user }),
}));
```

---

### web/src/store/ticketStore.ts

```typescript
import { create } from 'zustand';
import type { Ticket, TicketSearchParams, PagedResult } from '@/types/ticket';

interface TicketState {
  result: PagedResult<Ticket> | null;
  filters: TicketSearchParams;
  loading: boolean;
  error: string | null;
  setResult: (r: PagedResult<Ticket> | null) => void;
  setFilters: (f: TicketSearchParams) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useTicketStore = create<TicketState>(set => ({
  result: null,
  filters: { page: 1, limit: 25 },
  loading: false,
  error: null,
  setResult: result => set({ result }),
  setFilters: filters => set({ filters }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
}));
```

---

### web/src/contexts/AuthContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '@/api/client';
import type { AuthUser } from '@/types/auth';

// Decode JWT claims without verification (verification is server-side)
function decodeToken(token: string): { sub: string; role: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore user from stored token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const claims = decodeToken(token);
      if (claims) {
        setUser({ personId: Number(claims.sub), role: claims.role as AuthUser['role'] });
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password });
    setTokens(res.accessToken, res.refreshToken);
    setUser({ personId: res.personId, role: res.role as AuthUser['role'] });
  };

  const logout = () => {
    const rt = getRefreshToken();
    if (rt) authApi.logout(rt).catch(() => {}); // best-effort
    clearTokens();
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    const rt = getRefreshToken();
    if (!rt) return false;
    try {
      const res = await authApi.refresh(rt);
      setTokens(res.accessToken, res.refreshToken);
      setUser({ personId: res.personId, role: res.role as AuthUser['role'] });
      return true;
    } catch {
      clearTokens();
      setUser(null);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
```

---

### web/src/hooks/useAuth.ts

```typescript
export { useAuthContext as useAuth } from '@/contexts/AuthContext';
```

---

### web/src/hooks/usePermission.ts

```typescript
import { useAuthContext } from '@/contexts/AuthContext';

type PermissionLevel = 'staff' | 'public' | 'anonymous';

const RANK: Record<PermissionLevel, number> = {
  anonymous: 0,
  public: 1,
  staff: 2,
};

/**
 * Returns true if the authenticated user's role satisfies the required permission level.
 * Role hierarchy (per F03): anonymous(0) < public(1) < staff(2).
 *
 * usePermission('staff')    → true only for role='staff'
 * usePermission('public')   → true for role='public' or 'staff'
 * usePermission('anonymous')→ true for any authenticated user
 */
export const usePermission = (required: PermissionLevel): boolean => {
  const { user } = useAuthContext();
  if (!user) return required === 'anonymous' ? false : false;
  const userRank = RANK[user.role] ?? 0;
  const requiredRank = RANK[required] ?? 0;
  return userRank >= requiredRank;
};
```

---

### web/src/components/common/ProtectedRoute.tsx

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import type { AuthUser } from '@/types/auth';
import LoadingSpinner from './LoadingSpinner';

type PermissionLevel = 'staff' | 'public' | 'anonymous';
const RANK: Record<PermissionLevel, number> = { anonymous: 0, public: 1, staff: 2 };

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: PermissionLevel;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'public' }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredRole !== 'anonymous') {
    const userRank = RANK[user.role] ?? 0;
    const required = RANK[requiredRole] ?? 0;
    if (userRank < required) return <Navigate to="/tickets" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
```

---

### web/src/components/common/LoadingSpinner.tsx

```typescript
const LoadingSpinner: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
    <span>Loading…</span>
  </div>
);
export default LoadingSpinner;
```

---

### web/src/components/common/ErrorBanner.tsx

```typescript
interface ErrorBannerProps { error: string | null; }
const ErrorBanner: React.FC<ErrorBannerProps> = ({ error }) => {
  if (!error) return null;
  return (
    <div role="alert" style={{ background: '#fee', border: '1px solid #f88', padding: '0.75rem 1rem', borderRadius: 4, color: '#900', marginBottom: '1rem' }}>
      {error}
    </div>
  );
};
export default ErrorBanner;
```

---

### web/src/components/common/Pagination.tsx

```typescript
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹ Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next ›</button>
    </nav>
  );
};
export default Pagination;
```

---

### web/src/components/layout/Sidebar.tsx

All nav items MUST link to real routes — no dead links:

```typescript
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';

const Sidebar: React.FC = () => {
  const isStaff = usePermission('staff');
  return (
    <nav style={{ width: 220, background: '#1a2433', minHeight: '100vh', padding: '1rem 0', color: '#fff' }}>
      <div style={{ padding: '0 1rem 1.5rem', fontWeight: 700, fontSize: '1.1rem' }}>uReport</div>
      <NavItem to="/tickets" label="Tickets" />
      {isStaff && <NavItem to="/tickets/new" label="New Ticket" />}
      {isStaff && <NavItem to="/people" label="People" />}
      {isStaff && <NavItem to="/departments" label="Departments" />}
      {isStaff && <NavItem to="/categories" label="Categories" />}
      {isStaff && <NavItem to="/admin/substatuses" label="Substatuses" />}
      {isStaff && <NavItem to="/admin/actions" label="Actions" />}
      {isStaff && <NavItem to="/admin/clients" label="API Clients" />}
      {isStaff && <NavItem to="/admin/jobs" label="Scheduler Jobs" />}
      {isStaff && <NavItem to="/metrics" label="Metrics" />}
      {isStaff && <NavItem to="/reports" label="Reports" />}
    </nav>
  );
};

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'block', padding: '0.6rem 1rem', color: isActive ? '#61dafb' : '#cfd8e3',
      textDecoration: 'none', fontWeight: isActive ? 600 : 400,
    })}
  >
    {label}
  </NavLink>
);

export default Sidebar;
```

---

### web/src/components/layout/TopBar.tsx

```typescript
import { useAuthContext } from '@/contexts/AuthContext';

const TopBar: React.FC = () => {
  const { user, logout } = useAuthContext();
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 600 }}>uReport CRM</span>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>{user.role}</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Logout</button>
        </div>
      )}
    </header>
  );
};
export default TopBar;
```

---

### web/src/components/layout/AppLayout.tsx

```typescript
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, padding: '1.5rem', background: '#f5f7fa' }}>
        {children}
      </main>
    </div>
  </div>
);
export default AppLayout;
```

---

### web/src/pages/LoginPage.tsx

```typescript
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
```

---

### web/src/pages/CallbackPage.tsx

Handles the GET /callback OAuth redirect per FRD F04.5:

```typescript
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
      .catch(err => setError(err.message ?? 'OAuth callback failed'));
  }, []);

  if (error) return <div style={{ padding: '2rem' }}><ErrorBanner error={error} /></div>;
  return <LoadingSpinner />;
};
export default CallbackPage;
```

---

### web/src/router/index.tsx

All routes lead to real page components — no empty routes causing 404:

```typescript
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import CallbackPage from '@/pages/CallbackPage';

// Eagerly-loaded P0 ticket pages
import TicketListPage   from '@/pages/tickets/TicketListPage';
import TicketDetailPage from '@/pages/tickets/TicketDetailPage';
import CreateTicketPage from '@/pages/tickets/CreateTicketPage';

// Placeholder factory — Wave 3b/3c will replace these with real components
const Placeholder = (title: string): React.FC =>
  () => <div style={{ padding: '1.5rem' }}><h2>{title}</h2><p>Coming in a future wave.</p></div>;

const PeopleListPage        = Placeholder('People');
const DepartmentsPage       = Placeholder('Departments');
const CategoriesPage        = Placeholder('Categories');
const SubstatusPage         = Placeholder('Substatuses');
const ActionsPage           = Placeholder('Action Types');
const ClientsPage           = Placeholder('API Clients');
const AdminJobsPage         = Placeholder('Scheduler Jobs');
const MetricsDashboardPage  = Placeholder('Metrics Dashboard');
const ReportsPage           = Placeholder('Reports');

const withLayout = (el: React.ReactNode) => <AppLayout>{el}</AppLayout>;
const staffRoute = (el: React.ReactNode) => (
  <ProtectedRoute requiredRole="staff">{withLayout(el)}</ProtectedRoute>
);
const authRoute = (el: React.ReactNode) => (
  <ProtectedRoute requiredRole="public">{withLayout(el)}</ProtectedRoute>
);

const router = createBrowserRouter([
  { path: '/',         element: <Navigate to="/tickets" replace /> },
  { path: '/login',    element: <LoginPage /> },
  { path: '/callback', element: <CallbackPage /> },

  // Ticket routes (authenticated, any role)
  { path: '/tickets',     element: authRoute(<TicketListPage />) },
  { path: '/tickets/:id', element: authRoute(<TicketDetailPage />) },

  // Ticket creation (staff only)
  { path: '/tickets/new', element: staffRoute(<CreateTicketPage />) },

  // Admin pages (staff only) — placeholders until Wave 3b
  { path: '/people',             element: staffRoute(<PeopleListPage />) },
  { path: '/departments',        element: staffRoute(<DepartmentsPage />) },
  { path: '/categories',         element: staffRoute(<CategoriesPage />) },
  { path: '/admin/substatuses',  element: staffRoute(<SubstatusPage />) },
  { path: '/admin/actions',      element: staffRoute(<ActionsPage />) },
  { path: '/admin/clients',      element: staffRoute(<ClientsPage />) },
  { path: '/admin/jobs',         element: staffRoute(<AdminJobsPage />) },
  { path: '/metrics',            element: staffRoute(<MetricsDashboardPage />) },
  { path: '/reports',            element: staffRoute(<ReportsPage />) },
]);

const AppRouter: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <RouterProvider router={router} />
  </Suspense>
);
export default AppRouter;
```

---

### web/src/App.tsx

```typescript
import { AuthProvider } from '@/contexts/AuthContext';
import AppRouter from '@/router/index';

const App: React.FC = () => (
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);
export default App;
```

---

### web/src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
  </action>
  <verify>
ls web/package.json web/vite.config.ts web/src/main.tsx web/src/api/client.ts web/src/contexts/AuthContext.tsx web/src/hooks/usePermission.ts web/src/pages/LoginPage.tsx web/src/router/index.tsx &&
grep -n 'host.*0\.0\.0\.0' web/vite.config.ts &&
grep -n 'port.*3000' web/vite.config.ts &&
grep -n 'AuthProvider' web/src/contexts/AuthContext.tsx &&
grep -n 'useAuthContext' web/src/contexts/AuthContext.tsx &&
grep -n 'usePermission' web/src/hooks/usePermission.ts &&
grep -n 'staff' web/src/hooks/usePermission.ts &&
grep -n 'interceptors' web/src/api/client.ts &&
grep -n 'refreshToken' web/src/api/client.ts &&
grep -n 'LoginPage' web/src/pages/LoginPage.tsx &&
grep -n 'AppRouter\|RouterProvider' web/src/router/index.tsx &&
grep -n '/tickets' web/src/router/index.tsx &&
echo TASK1_CHECKS_PASSED
  </verify>
  <done>
- web/ directory exists with package.json (React 18, Vite 5, TypeScript, react-router-dom v6, axios, zustand, react-hook-form, date-fns)
- vite.config.ts: server.host=0.0.0.0, server.port=3000, proxy for /api + /open311 + /callback; no X-Frame-Options or CSP headers
- src/api/client.ts: Axios instance with Bearer token request interceptor and 401 response interceptor with token refresh + redirect to /login
- src/contexts/AuthContext.tsx: AuthProvider + useAuthContext() with login/logout/refreshToken; persists tokens in localStorage
- src/hooks/usePermission.ts: usePermission(required) with anonymous/public/staff rank hierarchy per F03
- src/hooks/useAuth.ts: re-export of useAuthContext
- src/store/authStore.ts + ticketStore.ts: Zustand stores
- src/types/auth.ts, api.ts, ticket.ts: TypeScript interfaces matching backend DTOs
- src/api/auth.ts + tickets.ts: typed API functions
- LoginPage.tsx: username/password form, calls login(), shows ErrorBanner on 401, redirects to previous route on success
- CallbackPage.tsx: OAuth callback handler calling /callback backend endpoint
- ProtectedRoute.tsx: redirects to /login if unauthenticated; redirects to /tickets if insufficient role
- AppLayout, Sidebar (all nav items link to real routes), TopBar
- router/index.tsx: all routes including admin placeholders — zero dead 404 routes
- App.tsx wraps AppRouter in AuthProvider
  </done>
</task>

<feature_dependencies>
Implements: F4 (LoginPage → POST /api/v1/auth/login, JWT storage, token refresh interceptor,
  CallbackPage → GET /callback OAuth flow, logout via TopBar);
  F3 (usePermission hook with anonymous/public/staff rank hierarchy, ProtectedRoute with
  role-gated access, Sidebar hides staff-only nav items for non-staff users)
Depends on: Wave 2a AuthController (POST /api/v1/auth/login, /refresh, /logout endpoints)
Enables: All other frontend components — every page in Wave 3b/3c uses AuthProvider +
  usePermission + ProtectedRoute from this task
</feature_dependencies>

<task type="auto">
  <name>Task 2: Ticket list (F11, F18), ticket detail (F0, F1), create ticket form (F0)</name>
  <files>
    web/src/pages/tickets/TicketListPage.tsx
    web/src/pages/tickets/TicketDetailPage.tsx
    web/src/pages/tickets/CreateTicketPage.tsx
    web/src/components/tickets/TicketSearchFilters.tsx
    web/src/components/tickets/TicketHistoryList.tsx
    web/src/components/tickets/TicketStatusBadge.tsx
  </files>
  <action>
Implement the three P0 ticket pages and supporting components. These directly consume the
backend APIs from Wave 2a (TicketController, TicketHistoryController) and Wave 2b
(TicketSearchController).

---

### web/src/components/tickets/TicketStatusBadge.tsx

```typescript
interface BadgeProps { status: string; substatus?: string; }
const colors: Record<string, string> = { open: '#2e7d32', closed: '#c62828' };

const TicketStatusBadge: React.FC<BadgeProps> = ({ status, substatus }) => (
  <span style={{ background: colors[status] ?? '#555', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>
    {substatus ? `${status} / ${substatus}` : status}
  </span>
);
export default TicketStatusBadge;
```

---

### web/src/components/tickets/TicketSearchFilters.tsx

Implements all F11 search filter fields. Every field change calls onFilterChange immediately:

```typescript
import React from 'react';
import type { TicketSearchParams } from '@/types/ticket';

interface Props {
  filters: TicketSearchParams;
  onFilterChange: (params: TicketSearchParams) => void;
}

const TicketSearchFilters: React.FC<Props> = ({ filters, onFilterChange }) => {
  const update = (field: keyof TicketSearchParams, value: string | number | undefined) =>
    onFilterChange({ ...filters, [field]: value || undefined, page: 1 });

  return (
    <form
      style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}
      onSubmit={e => e.preventDefault()}
    >
      <div>
        <label htmlFor="q" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Keyword</label>
        <input id="q" type="text" value={filters.q ?? ''} placeholder="Search tickets…"
          onChange={e => update('q', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="status" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Status</label>
        <select id="status" value={filters.status ?? ''} onChange={e => update('status', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label htmlFor="categoryId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Category ID</label>
        <input id="categoryId" type="number" value={filters.categoryId ?? ''} placeholder="Category ID"
          onChange={e => update('categoryId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="departmentId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Department ID</label>
        <input id="departmentId" type="number" value={filters.departmentId ?? ''} placeholder="Department ID"
          onChange={e => update('departmentId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="assignedPersonId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Assigned Person ID</label>
        <input id="assignedPersonId" type="number" value={filters.assignedPersonId ?? ''} placeholder="Person ID"
          onChange={e => update('assignedPersonId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="substatusId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Substatus ID</label>
        <input id="substatusId" type="number" value={filters.substatusId ?? ''} placeholder="Substatus ID"
          onChange={e => update('substatusId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="contactMethodId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Contact Method ID</label>
        <input id="contactMethodId" type="number" value={filters.contactMethodId ?? ''} placeholder="1–4"
          onChange={e => update('contactMethodId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="enteredDateFrom" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Entered Date From</label>
        <input id="enteredDateFrom" type="date" value={filters.enteredDateFrom ?? ''}
          onChange={e => update('enteredDateFrom', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="enteredDateTo" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Entered Date To</label>
        <input id="enteredDateTo" type="date" value={filters.enteredDateTo ?? ''}
          onChange={e => update('enteredDateTo', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="city" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>City</label>
        <input id="city" type="text" value={filters.city ?? ''}
          onChange={e => update('city', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="zip" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Zip</label>
        <input id="zip" type="text" value={filters.zip ?? ''}
          onChange={e => update('zip', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button type="button" onClick={() => onFilterChange({ page: 1, limit: 25 })}
          style={{ padding: '0.4rem 1rem', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' }}>
          Clear Filters
        </button>
      </div>
    </form>
  );
};
export default TicketSearchFilters;
```

---

### web/src/components/tickets/TicketHistoryList.tsx

```typescript
import type { TicketHistoryEntry } from '@/types/ticket';

interface Props { entries: TicketHistoryEntry[]; }

const TicketHistoryList: React.FC<Props> = ({ entries }) => {
  if (!entries.length) return <p style={{ color: '#666' }}>No history entries.</p>;
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {entries.map(entry => (
        <li key={entry.id} style={{ borderLeft: '3px solid #1a73e8', marginBottom: '0.75rem', paddingLeft: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.actionName}</span>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {new Date(entry.enteredDate).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#333', marginBottom: 2 }}>
            {entry.renderedDescription}
          </div>
          {entry.enteredByPersonName && (
            <div style={{ fontSize: '0.8rem', color: '#666' }}>By: {entry.enteredByPersonName}</div>
          )}
          {entry.notes && (
            <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#555', marginTop: 4, borderLeft: '2px solid #ccc', paddingLeft: '0.5rem' }}>{entry.notes}</div>
          )}
          {entry.sentNotifications && (
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>Notified: {entry.sentNotifications}</div>
          )}
        </li>
      ))}
    </ol>
  );
};
export default TicketHistoryList;
```

---

### web/src/pages/tickets/TicketListPage.tsx

Fetches from GET /api/v1/tickets; every filter change triggers re-fetch:

```typescript
import React, { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import { useTicketStore } from '@/store/ticketStore';
import { usePermission } from '@/hooks/usePermission';
import TicketSearchFilters from '@/components/tickets/TicketSearchFilters';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import Pagination from '@/components/common/Pagination';
import ErrorBanner from '@/components/common/ErrorBanner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { TicketSearchParams } from '@/types/ticket';

const TicketListPage: React.FC = () => {
  const { result, filters, loading, error, setResult, setFilters, setLoading, setError } = useTicketStore();
  const isStaff = usePermission('staff');

  const fetchTickets = useCallback(async (params: TicketSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.search(params);
      setResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(msg?.message ?? msg?.error ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setResult]);

  useEffect(() => { fetchTickets(filters); }, []);

  const handleFilterChange = (newFilters: TicketSearchParams) => {
    setFilters(newFilters);
    fetchTickets(newFilters);
  };

  const handlePageChange = (page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetchTickets(updated);
  };

  const handleCsvExport = () => {
    window.location.href = ticketsApi.buildExportUrl(filters, 'csv');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Tickets</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isStaff && (
            <button onClick={handleCsvExport}
              style={{ padding: '0.4rem 1rem', background: '#fff', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
              Export CSV
            </button>
          )}
          {isStaff && (
            <Link to="/tickets/new"
              style={{ padding: '0.4rem 1rem', background: '#1a73e8', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>
              New Ticket
            </Link>
          )}
        </div>
      </div>

      <TicketSearchFilters filters={filters} onFilterChange={handleFilterChange} />

      <ErrorBanner error={error} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
            {(!result?.content?.length) ? (
              <p style={{ padding: '1.5rem', color: '#666', textAlign: 'center' }}>No tickets found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    {['ID', 'Status', 'Category', 'Description', 'Location', 'Entered', 'Assigned To'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.content.map(ticket => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <Link to={`/tickets/${ticket.id}`} style={{ color: '#1a73e8', fontWeight: 500 }}>#{ticket.id}</Link>
                      </td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <TicketStatusBadge status={ticket.status} substatus={ticket.substatusName} />
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>{ticket.categoryName ?? ticket.categoryId}</td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.description}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>{[ticket.location, ticket.city].filter(Boolean).join(', ')}</td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#555' }}>
                        {new Date(ticket.enteredDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>{ticket.assignedPersonName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {result && result.totalPages > 1 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={handlePageChange}
            />
          )}

          {result && (
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              {result.totalElements} ticket{result.totalElements !== 1 ? 's' : ''} found
            </p>
          )}
        </>
      )}
    </div>
  );
};
export default TicketListPage;
```

---

### web/src/pages/tickets/TicketDetailPage.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import { usePermission } from '@/hooks/usePermission';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import TicketHistoryList from '@/components/tickets/TicketHistoryList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import type { Ticket, TicketHistoryEntry } from '@/types/ticket';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const isStaff = usePermission('staff');

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    Promise.all([ticketsApi.getById(ticketId), ticketsApi.getHistory(ticketId)])
      .then(([t, h]) => { setTicket(t); setHistory(h); })
      .catch(err => {
        const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
        setError(msg?.message ?? msg?.error ?? 'Failed to load ticket.');
      })
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleReopen = async () => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await ticketsApi.reopen(ticket.id);
      setTicket(updated);
      const h = await ticketsApi.getHistory(ticket.id);
      setHistory(h);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(msg?.message ?? 'Reopen failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tickets" style={{ color: '#1a73e8', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Tickets</Link>
      </div>

      <ErrorBanner error={error} />

      {ticket && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Ticket #{ticket.id}</h1>
              <TicketStatusBadge status={ticket.status} substatus={ticket.substatusName} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><strong>Category:</strong> {ticket.categoryName ?? ticket.categoryId}</div>
              <div><strong>Assigned To:</strong> {ticket.assignedPersonName ?? '—'}</div>
              <div><strong>Location:</strong> {[ticket.location, ticket.city, ticket.state, ticket.zip].filter(Boolean).join(', ') || '—'}</div>
              <div><strong>Contact Method:</strong> {ticket.contactMethodName ?? '—'}</div>
              <div><strong>Entered:</strong> {new Date(ticket.enteredDate).toLocaleString()}</div>
              <div><strong>Last Modified:</strong> {new Date(ticket.lastModified).toLocaleString()}</div>
              {ticket.closedDate && <div><strong>Closed:</strong> {new Date(ticket.closedDate).toLocaleString()}</div>}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <strong>Description:</strong>
              <p style={{ marginTop: '0.4rem', background: '#f8f9fa', borderRadius: 4, padding: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                {ticket.description}
              </p>
            </div>

            {/* Staff action buttons */}
            {isStaff && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                {ticket.status === 'closed' && (
                  <button onClick={handleReopen} disabled={actionLoading}
                    style={{ padding: '0.4rem 1rem', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
                    Reopen
                  </button>
                )}
                {/* Close and Assign buttons would require substatus selector / person picker;
                    Wire them in Wave 3b when admin data (substatus list) is available */}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>History</h2>
            <TicketHistoryList entries={history} />
          </div>
        </>
      )}
    </div>
  );
};
export default TicketDetailPage;
```

---

### web/src/pages/tickets/CreateTicketPage.tsx

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import ErrorBanner from '@/components/common/ErrorBanner';

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation]       = useState('');
  const [city, setCity]               = useState('');
  const [zip, setZip]                 = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !description.trim()) {
      setError('Category ID and description are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const ticket = await ticketsApi.create({
        categoryId: Number(categoryId),
        description: description.trim(),
        location: location || undefined,
        city: city || undefined,
        zip: zip || undefined,
      });
      navigate(`/tickets/${ticket.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(msg?.message ?? msg?.error ?? 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 1.5rem' }}>Create New Ticket</h1>
      <ErrorBanner error={error} />

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="categoryId" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Category ID *</label>
          <input
            id="categoryId" type="number" value={categoryId} required
            onChange={e => setCategoryId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
          />
          <small style={{ color: '#666' }}>Enter the numeric category ID (visible in Categories admin page)</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Description *</label>
          <textarea
            id="description" value={description} required rows={5}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="location" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Address</label>
            <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label htmlFor="city" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>City</label>
            <input id="city" type="text" value={city} onChange={e => setCity(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label htmlFor="zip" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Zip</label>
            <input id="zip" type="text" value={zip} onChange={e => setZip(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={submitting}
            style={{ padding: '0.6rem 1.5rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
            {submitting ? 'Creating…' : 'Create Ticket'}
          </button>
          <button type="button" onClick={() => navigate('/tickets')}
            style={{ padding: '0.6rem 1.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreateTicketPage;
```
  </action>
  <verify>
ls web/src/pages/tickets/TicketListPage.tsx web/src/pages/tickets/TicketDetailPage.tsx web/src/pages/tickets/CreateTicketPage.tsx web/src/components/tickets/TicketSearchFilters.tsx web/src/components/tickets/TicketHistoryList.tsx &&
grep -n 'TicketListPage' web/src/pages/tickets/TicketListPage.tsx &&
grep -n 'searchTickets\|ticketsApi' web/src/pages/tickets/TicketListPage.tsx &&
grep -n 'onFilterChange' web/src/components/tickets/TicketSearchFilters.tsx &&
grep -n 'enteredDateFrom\|enteredDateTo\|substatusId\|contactMethodId' web/src/components/tickets/TicketSearchFilters.tsx &&
grep -n 'Export CSV' web/src/pages/tickets/TicketListPage.tsx &&
grep -n 'format=csv\|buildExportUrl' web/src/pages/tickets/TicketListPage.tsx &&
grep -n 'TicketHistoryList' web/src/pages/tickets/TicketDetailPage.tsx &&
grep -n 'getHistory' web/src/pages/tickets/TicketDetailPage.tsx &&
grep -n 'renderedDescription' web/src/components/tickets/TicketHistoryList.tsx &&
grep -n 'CreateTicketPage' web/src/pages/tickets/CreateTicketPage.tsx &&
grep -n 'ticketsApi.create\|POST.*tickets' web/src/pages/tickets/CreateTicketPage.tsx &&
echo TASK2_CHECKS_PASSED
  </verify>
  <done>
- TicketListPage.tsx: fetches GET /api/v1/tickets on mount and on every filter change; renders paginated table with #id links, status badges, category, description, location, enteredDate, assignedPerson; shows CSV Export button (staff only) and New Ticket link (staff only); CSV export uses buildExportUrl() with current filters
- TicketSearchFilters.tsx: renders all F11 filter fields (q, status, categoryId, departmentId, assignedPersonId, substatusId, contactMethodId, enteredDateFrom/To, city, zip, Clear Filters); every onChange calls onFilterChange immediately with page reset to 1
- TicketDetailPage.tsx: fetches ticket + history concurrently; renders ticket header with status badge, all fields, description; renders TicketHistoryList; shows Reopen button for staff on closed tickets; ErrorBanner on any API failure
- TicketHistoryList.tsx: chronological list of history entries each showing actionName, renderedDescription, enteredByPersonName, enteredDate, notes, sentNotifications
- CreateTicketPage.tsx: form with categoryId, description (required), location, city, zip; posts to ticketsApi.create(); on success navigates to /tickets/{id}; shows error on failure
  </done>
</task>

<feature_dependencies>
Implements: F0: Ticket UI (TicketListPage with create/list/view/action buttons, TicketDetailPage
  with reopen action, CreateTicketPage form → POST /api/v1/tickets);
  F1: Ticket history UI (TicketHistoryList rendering GET /api/v1/tickets/{id}/history entries
  with renderedDescription, enteredByPersonName, actionPersonName, enteredDate, notes,
  sentNotifications — all fields from FRD F01);
  F11: Search UI (TicketSearchFilters with all 11 filter fields from FRD F11 sub-requirements;
  every change triggers re-fetch; paginated results with Pagination component);
  F18: Multi-format export UI (CSV export button on TicketListPage triggers
  GET /api/v1/tickets/export?format=csv download; buildExportUrl passes all active filters)
Depends on: Task 1 (AuthContext, usePermission, ProtectedRoute, ticketsApi, Pagination, ErrorBanner)
  Wave 2a TicketController + TicketHistoryController (GET /api/v1/tickets/{id}, /history endpoints)
  Wave 2b TicketSearchController (GET /api/v1/tickets search endpoint)
  Wave 2b CsvExportUtil (GET /api/v1/tickets/export?format=csv)
Enables: Wave 3b admin pages attach to AppLayout + Sidebar already established;
  Wave 3c bookmark sidebar, map view, and media uploader all extend TicketDetailPage and
  TicketListPage from this task
</feature_dependencies>

</tasks>

<verification>
After both tasks complete, run the following checks:

1. Verify SPA project structure:
```bash
ls web/package.json web/vite.config.ts web/tsconfig.json web/index.html web/Dockerfile
# Expected: all 5 files present
```

2. Verify dev server config:
```bash
grep -E 'host.*0\.0\.0\.0|port.*3000' web/vite.config.ts
# Expected: both present — sandbox preview requires 0.0.0.0 binding on port 3000
```

3. Verify no X-Frame-Options DENY (would block iframe embedding):
```bash
grep -r 'X-Frame-Options\|frame-ancestors' web/
# Expected: no matches (or only comments)
```

4. Verify auth integration contracts:
```bash
grep -n 'AuthProvider' web/src/contexts/AuthContext.tsx &&
grep -n 'useAuthContext' web/src/contexts/AuthContext.tsx &&
grep -n 'usePermission' web/src/hooks/usePermission.ts &&
grep -n 'staff' web/src/hooks/usePermission.ts
```

5. Verify all Sidebar links go to real routes:
```bash
# Extract all NavItem 'to' props from Sidebar and verify each appears in router/index.tsx
grep -o "to=\"[^\"]*\"" web/src/components/layout/Sidebar.tsx | sed 's/to="\(.*\)"/\1/' | while read route; do
  grep -q "\"$route\"" web/src/router/index.tsx && echo "OK: $route" || echo "MISSING ROUTE: $route"
done
```

6. Verify search filter completeness:
```bash
grep -c 'onChange' web/src/components/tickets/TicketSearchFilters.tsx
# Expected: ≥10 (one per filter field)
```

7. Verify CSV export wiring:
```bash
grep -n 'format=csv\|buildExportUrl\|Export CSV' web/src/pages/tickets/TicketListPage.tsx
# Expected: all present
```

8. Verify history rendering:
```bash
grep -n 'renderedDescription\|getHistory\|TicketHistoryList' web/src/pages/tickets/TicketDetailPage.tsx
# Expected: all present
```

9. Install dependencies and verify TypeScript compiles:
```bash
cd web && npm install && npx tsc --noEmit 2>&1 | tail -20 && echo TYPESCRIPT_OK
```

10. Verify dev server starts on correct address:
```bash
cd web && npm run dev -- --port 3000 &
sleep 5 && curl -s http://localhost:3000/ | grep -q 'uReport\|<!DOCTYPE' && echo DEV_SERVER_OK
kill %1 2>/dev/null || true
```
</verification>

<success_criteria>
- web/ directory exists with package.json (React 18, Vite 5, TypeScript, react-router-dom v6, axios, zustand)
- vite.config.ts binds dev server to 0.0.0.0:3000 and proxies /api, /open311, /callback to backend
- No X-Frame-Options DENY or CSP frame-ancestors headers anywhere in the web/ project
- AuthContext provides user (personId, role), login(), logout(), refreshToken() — tokens stored in localStorage
- usePermission(role) implements anonymous/public/staff hierarchy per F03
- Axios client has request interceptor (Bearer token) and 401 response interceptor (token refresh → /login)
- LoginPage submits POST /api/v1/auth/login; stores JWT on success; shows error on failure
- CallbackPage handles GET /callback OAuth redirect
- ProtectedRoute redirects unauthenticated users to /login
- All Sidebar nav items use real routes present in router/index.tsx — zero dead 404 links
- TicketListPage fetches GET /api/v1/tickets; re-fetches on every filter change; shows paginated results
- TicketSearchFilters renders q, status, categoryId, departmentId, assignedPersonId, substatusId, contactMethodId, enteredDateFrom, enteredDateTo, city, zip — all 11 fields
- CSV Export button (staff only) triggers GET /api/v1/tickets/export?format=csv with active filters
- TicketDetailPage fetches ticket + history; renders TicketHistoryList with renderedDescription, enteredByPersonName, enteredDate, notes, sentNotifications
- CreateTicketPage posts to POST /api/v1/tickets; navigates to new ticket on success
- ErrorBanner surfaces API error codes and messages on every page
- All integration_contracts.provides.verify commands exit 0
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/06-SUMMARY.md`
summarizing:
- Files created: list all files under web/ (grouped by directory)
- SPA scaffold: React version, Vite version, TypeScript, key libraries
- Dev server: host=0.0.0.0 port=3000 confirmed
- Auth integration: AuthContext, usePermission hook, ProtectedRoute
- Pages implemented: LoginPage, CallbackPage, TicketListPage, TicketDetailPage, CreateTicketPage
- Features covered: F0 (ticket UI), F1 (history UI), F3 (RBAC hooks), F4 (auth screens), F11 (search filters), F18 (CSV export)
- Router: all routes listed, zero dead links
- Any deviations from spec (flag conflicts rather than silently diverging)
- Integration contract verification results
</output>
