---
phase: 09-admin-panels-and-integration
plan: PGAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/contexts/AuthContext.tsx
autonomous: true
gap_closure: true

features:
  implements: ["AUTH-03"]
  depends_on: []
  enables: ["ADMIN-01", "SEARCH-02"]

must_haves:
  truths:
    - "On app load, AuthContext calls GET /api/auth/me to check session — it is NOT skipped"
    - "When no JWT cookie exists, GET /api/auth/me returns 401, AuthContext sets user=null, router redirects to /login"
    - "After successful login, user state is populated from /api/auth/me response and admin panels load"
    - "UAT_MOCK_USER constant no longer exists in any production code path"
  artifacts:
    - path: "frontend/src/contexts/AuthContext.tsx"
      provides: "Real auth context that calls GET /api/auth/me on mount"
      min_lines: 40
  key_links:
    - from: "frontend/src/contexts/AuthContext.tsx"
      to: "/api/auth/me"
      via: "api.get('/auth/me') in useEffect on mount"
      pattern: "api\\.get.*auth/me"

integration_contracts:
  requires: []
  provides:
    - artifact: "frontend/src/contexts/AuthContext.tsx"
      exports: ["AuthProvider", "useAuth", "User"]
      shape: |
        export interface User { personId: number; username: string; role: "staff" | "admin"; firstname: string; lastname: string; }
        export function AuthProvider({ children }): JSX.Element  // calls GET /api/auth/me on mount
        export function useAuth(): AuthContextValue
      verify: "grep -n 'api.get.*auth/me\\|auth/me' frontend/src/contexts/AuthContext.tsx && echo CONTRACT_OK"

---

<objective>
Remove the UAT_MOCK_USER bypass from AuthContext.tsx so the real JWT-cookie-based authentication flow works end-to-end.

Purpose: The `UAT_MOCK_USER` constant was added as a temporary Phase 7 scaffold when the backend wasn't running. It short-circuits the real auth check — no JWT cookie is ever validated, so every POST/PUT/DELETE from the frontend hits the backend as unauthenticated and returns 401. This is the root cause of all "cannot save" failures across admin panels, bookmarks, and any other write operation.

Output: A clean AuthContext.tsx that calls GET /api/auth/me on mount (the real auth check), redirects to /login on 401, and populates user state from the server response once the user has a valid JWT cookie from logging in.
</objective>

<feature_dependencies>
Implements: AUTH-03: Auth context wired to real backend JWT session
Depends on: None (prerequisite gap fix)
Enables: ADMIN-01: Admin panels CRUD operations (require real JWT), SEARCH-02: Bookmark save (requires JWT principal)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-admin-panels-and-integration/09-01-SUMMARY.md
@.planning/phases/09-admin-panels-and-integration/09-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove UAT_MOCK_USER from AuthContext and restore real auth check</name>
  <files>frontend/src/contexts/AuthContext.tsx</files>
  <action>
Rewrite `frontend/src/contexts/AuthContext.tsx` to remove all UAT mock code and restore the real auth check.

Current broken code (lines 21-49):
```typescript
// REMOVE these lines entirely:
const UAT_MOCK_USER: User = {
  personId: 1,
  username: "uat_admin",
  role: "admin",
  firstname: "UAT",
  lastname: "Admin",
};

// REMOVE: useState(UAT_MOCK_USER) — change to useState<User | null>(null)
const [user, setUser] = useState<User | null>(UAT_MOCK_USER);
// REMOVE: loading: false initial value change
const [loading, setLoading] = useState(false);

useEffect(() => {
  // REMOVE these two lines:
  if (UAT_MOCK_USER) return;
  // ... the rest of the real api call is correct
```

Replace with the clean implementation:
```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export interface User {
  personId: number;
  username: string;
  role: "staff" | "admin";
  firstname: string;
  lastname: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);  // null by default — no mock
  const [loading, setLoading] = useState(true);         // true so AppShell can show skeleton
  const navigate = useNavigate();

  useEffect(() => {
    // Real auth check: GET /api/auth/me returns 200+body if JWT cookie is valid, 401 otherwise
    api
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          // No valid session — redirect to login
          navigate("/login", { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function logout() {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

Key changes:
1. Delete the `UAT_MOCK_USER` constant (lines 21-29)
2. Change `useState<User | null>(UAT_MOCK_USER)` → `useState<User | null>(null)`
3. Change `useState(false)` for loading → `useState(true)` (start in loading state until /auth/me resolves)
4. Remove the `if (UAT_MOCK_USER) return;` guard from useEffect (lines 37-39)
5. Keep the `api.get<User>("/auth/me")` call and all its handlers unchanged
  </action>
  <verify>
grep -n "UAT_MOCK_USER" frontend/src/contexts/AuthContext.tsx && echo "FAIL: UAT_MOCK_USER still present" || echo "PASS: UAT_MOCK_USER removed"
grep -n "api.get.*auth/me\|auth/me" frontend/src/contexts/AuthContext.tsx | head -5
grep -n "useState.*null" frontend/src/contexts/AuthContext.tsx | head -3
cd frontend && npm run build 2>&1 | tail -15 && echo "BUILD OK"
  </verify>
  <done>
- `grep -n "UAT_MOCK_USER" frontend/src/contexts/AuthContext.tsx` returns no matches
- `grep -n "api.get.*auth/me" frontend/src/contexts/AuthContext.tsx` returns a match (real API call present)
- `useState<User | null>(null)` is the initial state (not UAT_MOCK_USER)
- `npm run build` exits 0 with no TypeScript errors
- On app load without a JWT cookie, the app redirects to /login instead of showing the admin UI
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | GET /api/auth/me response data from backend crosses into React state as the authenticated User object |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-09P1-01 | Spoofing | AuthContext user state | mitigate | User state is derived exclusively from GET /api/auth/me response (validated JWT on the server); no client-side identity assertion. The mock bypass (UAT_MOCK_USER) that allowed spoofing admin identity is removed in this task. |
| T-09P1-02 | Elevation of privilege | AdminGuard in App.tsx | transfer | AdminGuard checks `user.role === 'admin'` against the AuthContext user from /api/auth/me; the role originates from the JWT claims set by the backend at login time. Backend route guards (SecurityConfig) enforce ADMIN/STAFF roles independently — frontend guard is defense-in-depth only. |
| T-09P1-03 | Information disclosure | Open redirect via returnTo param in LoginPage | mitigate | LoginPage uses `navigate(returnTo || '/dashboard')` via react-router's `navigate()` — prevents open redirect to external URLs as react-router only handles relative paths. Confirmed in Phase 9 decision log. |
</threat_model>

<verification>
1. `grep -n "UAT_MOCK_USER" frontend/src/contexts/AuthContext.tsx` → returns 0 matches
2. `grep -n "api.get.*auth/me" frontend/src/contexts/AuthContext.tsx` → shows the real API call
3. `grep -n "useState.*null" frontend/src/contexts/AuthContext.tsx` → shows `useState<User | null>(null)`
4. `grep -n "useState.*true" frontend/src/contexts/AuthContext.tsx` → shows loading starts as `true`
5. `cd frontend && npm run build` → exits 0, no TypeScript errors
</verification>

<success_criteria>
- UAT_MOCK_USER is completely removed from AuthContext.tsx
- GET /api/auth/me is called on every app mount (no bypass)
- User state starts as `null` (not a mock admin user)
- Loading state starts as `true` until /auth/me resolves (prevents flash of unauthenticated content)
- `npm run build` passes cleanly
- Unauthenticated users see the login page, not the admin dashboard
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-panels-and-integration/09-PGAP-01-SUMMARY.md` with:
- Confirmation that UAT_MOCK_USER was removed
- The exact lines changed
- Any downstream effects observed (e.g., tests that mocked UAT_MOCK_USER that now need updating)
</output>
