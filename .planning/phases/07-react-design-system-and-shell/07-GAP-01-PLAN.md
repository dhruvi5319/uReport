---
phase: 07-react-design-system-and-shell
plan: GAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/globals.css
  - frontend/tailwind.config.ts
  - frontend/src/components/ui/button.tsx
  - frontend/src/components/shell/Sidebar.tsx
  - frontend/src/App.tsx
  - frontend/src/pages/ComingSoonPage.tsx
autonomous: true
gap_closure: true

features:
  implements: ["F17", "F18", "F19"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Duplicate status badge renders with a distinct amber/orange color (not grey) in both light and dark mode"
    - "Tabbing to a Button component shows a visible 2px civic-blue focus ring that adapts to the background color"
    - "Clicking any Sidebar nav link renders a non-blank page (ComingSoonPage placeholder) with a descriptive heading"
  artifacts:
    - path: "frontend/src/globals.css"
      provides: "Amber HSL value for --color-status-duplicate in :root and .dark"
      contains: "38 92% 50%"
    - path: "frontend/tailwind.config.ts"
      provides: "ringOffsetColor token referencing --color-background CSS variable"
      contains: "ringOffsetColor"
    - path: "frontend/src/components/ui/button.tsx"
      provides: "focus-visible:ring-offset-background class on buttonVariants base"
      contains: "focus-visible:ring-offset-background"
    - path: "frontend/src/components/shell/Sidebar.tsx"
      provides: "overflow-x-hidden on nav element (not overflow-hidden)"
      contains: "overflow-x-hidden"
    - path: "frontend/src/App.tsx"
      provides: "Catch-all Route rendering ComingSoonPage inside AppShell route group"
      contains: "path=\"*\""
    - path: "frontend/src/pages/ComingSoonPage.tsx"
      provides: "Placeholder page component with descriptive heading"
  key_links:
    - from: "frontend/src/App.tsx"
      to: "frontend/src/pages/ComingSoonPage.tsx"
      via: "import + <Route path='*' element={<ComingSoonPage />} />"
      pattern: "ComingSoonPage"
    - from: "frontend/tailwind.config.ts"
      to: "frontend/src/globals.css"
      via: "ringOffsetColor hsl(var(--color-background))"
      pattern: "ringOffsetColor"

integration_contracts:
  requires: []
  provides:
    - artifact: "frontend/src/pages/ComingSoonPage.tsx"
      exports: ["ComingSoonPage"]
      shape: "default export React functional component"
      verify: "grep -n 'export default function ComingSoonPage' frontend/src/pages/ComingSoonPage.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/App.tsx"
      exports: ["catch-all Route"]
      shape: "<Route path='*' element={<ComingSoonPage />} /> inside AppShell group"
      verify: "grep -n 'path=\"\\*\"' frontend/src/App.tsx && echo CONTRACT_OK"
---

<objective>
Close three UAT gaps in the Phase 7 React design system and shell:
1. Fix the `duplicate` status badge color from grey to amber/orange.
2. Fix the missing Button focus ring by adding `ringOffsetColor` to Tailwind config, the adaptive offset class to `buttonVariants`, and changing `overflow-hidden` to `overflow-x-hidden` in Sidebar.
3. Add a catch-all route so unregistered Sidebar nav links render a "Coming Soon" placeholder page instead of a blank screen.

Purpose: All three issues were reported by the user during UAT. Two are "major" severity (focus ring, blank pages). All fixes are confined to Phase 7 files and require no cross-phase work.
Output: 6 files modified/created; Vitest suite still passes; dev server renders amber Duplicate badge, visible focus ring on Tab, and ComingSoonPage on any unregistered route.
</objective>

<feature_dependencies>
Implements: F17: Design tokens + Tailwind config, F18: shadcn/ui component library, F19: Navigation shell
Depends on: None
Enables: None
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/07-react-design-system-and-shell/07-04-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix duplicate badge color + button focus ring</name>
  <files>
    frontend/src/globals.css
    frontend/tailwind.config.ts
    frontend/src/components/ui/button.tsx
    frontend/src/components/shell/Sidebar.tsx
  </files>
  <action>
**Fix 1 — globals.css: Change `--color-status-duplicate` to amber HSL**

In `frontend/src/globals.css`:
- Line 35 (inside `:root`): change `--color-status-duplicate: 215 16% 47%;` → `--color-status-duplicate: 38 92% 50%;`
- Line 60 (inside `.dark`): change `--color-status-duplicate: 215 20% 65%;` → `--color-status-duplicate: 38 90% 60%;`

No other changes to globals.css.

**Fix 2a — tailwind.config.ts: Add ringOffsetColor token**

In `frontend/tailwind.config.ts`, inside the `theme.extend` object (alongside the existing `colors`, `borderRadius`, `boxShadow`, `fontFamily` keys), add a new `ringOffsetColor` key:

```ts
ringOffsetColor: {
  DEFAULT: "hsl(var(--color-background))",
},
```

Place it after the `colors` block, before `borderRadius`. The resulting `theme.extend` should look like:
```ts
theme: {
  extend: {
    colors: { /* existing */ },
    ringOffsetColor: {
      DEFAULT: "hsl(var(--color-background))",
    },
    borderRadius: { /* existing */ },
    boxShadow: { /* existing */ },
    fontFamily: { /* existing */ },
  },
},
```

**Fix 2b — button.tsx: Add focus-visible:ring-offset-background to base class**

In `frontend/src/components/ui/button.tsx`, the `buttonVariants` base class string is on line 7. It currently ends with:
```
...focus-visible:ring-offset-2 disabled:pointer-events-none...
```

Change it to:
```
...focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none...
```

Insert `focus-visible:ring-offset-background` between `focus-visible:ring-offset-2` and `disabled:pointer-events-none`. Keep all other classes exactly as-is.

**Fix 2c — Sidebar.tsx: Change overflow-hidden to overflow-x-hidden on nav element**

In `frontend/src/components/shell/Sidebar.tsx`, the `<nav>` element at line 75 has the className string containing `overflow-hidden`. Change only `overflow-hidden` to `overflow-x-hidden` within that className. All other classes remain identical.

The line currently reads (approximately):
```tsx
"hidden md:flex flex-col border-r border-border bg-card shrink-0 overflow-hidden",
```
Change to:
```tsx
"hidden md:flex flex-col border-r border-border bg-card shrink-0 overflow-x-hidden",
```
  </action>
  <verify>
Run the Vitest unit test suite to confirm no regressions:
```bash
cd frontend && npm run test -- --run 2>&1 | tail -20
```
Expected: all tests pass (≥65 passing, 0 failing).

Also verify the specific changes exist:
```bash
grep -n "38 92% 50%" frontend/src/globals.css && echo "BADGE COLOR LIGHT OK"
grep -n "38 90% 60%" frontend/src/globals.css && echo "BADGE COLOR DARK OK"
grep -n "ringOffsetColor" frontend/tailwind.config.ts && echo "RING OFFSET COLOR OK"
grep -n "ring-offset-background" frontend/src/components/ui/button.tsx && echo "BUTTON FIX OK"
grep -n "overflow-x-hidden" frontend/src/components/shell/Sidebar.tsx && echo "SIDEBAR FIX OK"
```
  </verify>
  <done>
- `--color-status-duplicate` is `38 92% 50%` in `:root` and `38 90% 60%` in `.dark`
- `tailwind.config.ts` contains `ringOffsetColor: { DEFAULT: "hsl(var(--color-background))" }`
- `buttonVariants` base class contains `focus-visible:ring-offset-background`
- Sidebar `<nav>` uses `overflow-x-hidden` (not `overflow-hidden`)
- All Vitest tests pass (0 failing)
  </done>
</task>

<task type="auto">
  <name>Task 2: Add ComingSoonPage + catch-all route in App.tsx</name>
  <files>
    frontend/src/pages/ComingSoonPage.tsx
    frontend/src/App.tsx
  </files>
  <action>
**Step 1 — Create `frontend/src/pages/ComingSoonPage.tsx`**

Create a new file with this exact content:

```tsx
import { motion } from "framer-motion";
import { pageVariants } from "../lib/animations";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ComingSoonPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center"
    >
      <div className="rounded-full bg-secondary p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Coming Soon</h1>
      <p className="text-muted-foreground max-w-sm">
        This page is under construction and will be available in an upcoming phase.
      </p>
      <Button variant="outline" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </motion.div>
  );
}
```

**Step 2 — Update `frontend/src/App.tsx` to add catch-all route**

Add an import for `ComingSoonPage` at the top (after the existing `DashboardPage` import):
```tsx
import ComingSoonPage from "./pages/ComingSoonPage";
```

Inside the `<Route element={<AppShell />}>` group, add a catch-all route as the LAST child route:
```tsx
<Route path="*" element={<ComingSoonPage />} />
```

The complete updated Routes block should be:
```tsx
<Routes location={location} key={location.pathname}>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<AppShell />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/" element={<DashboardPage />} />
    <Route path="*" element={<ComingSoonPage />} />
  </Route>
</Routes>
```

This ensures all 11 unregistered Sidebar links (/cases, /cases/new, /admin/*, /metrics, /reports) render ComingSoonPage inside the authenticated AppShell (with Navbar, Sidebar, and Breadcrumb) instead of a blank screen.
  </action>
  <verify>
Verify the new file and route exist:
```bash
grep -n "export default function ComingSoonPage" frontend/src/pages/ComingSoonPage.tsx && echo "PAGE OK"
grep -n 'path="\*"' frontend/src/App.tsx && echo "CATCH-ALL ROUTE OK"
grep -n "ComingSoonPage" frontend/src/App.tsx && echo "IMPORT OK"
```

Run the Vitest suite to confirm no regressions:
```bash
cd frontend && npm run test -- --run 2>&1 | tail -20
```
Expected: all tests pass (0 failing).

Run a TypeScript type-check to confirm no import errors:
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30 && echo "TSC OK"
```
  </verify>
  <done>
- `frontend/src/pages/ComingSoonPage.tsx` exists with `export default function ComingSoonPage`
- `App.tsx` imports `ComingSoonPage` and contains `<Route path="*" element={<ComingSoonPage />} />` inside the `AppShell` route group
- All Vitest tests pass (0 failing)
- TypeScript compiles without errors (`tsc --noEmit` exits 0)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→render | User-navigated URL path crossing into the React Router catch-all handler and rendered as ComingSoonPage |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07G-01 | Information disclosure | `<Route path="*">` catch-all in `App.tsx` | mitigate | ComingSoonPage renders static content only — no path segment is reflected into the DOM, no `useParams()` or `useLocation().pathname` rendered into innerHTML. The route simply renders a fixed placeholder; no user-controlled data crosses into a sink. |
| T-07G-02 | Elevation of privilege | `<Route path="*">` inside `AppShell` route group | mitigate | The catch-all is nested under `<Route element={<AppShell />}>`. `AppShell` already enforces auth redirect (`useEffect` → `navigate('/login')` when `!user`). Unauthenticated users reaching any `*` path are redirected to `/login` before ComingSoonPage renders. |
</threat_model>

<verification>
After both tasks complete:

1. **Badge color:** In the browser, the "Duplicate" badge on the dashboard showcase (`/dashboard`) must render in amber/orange — visually distinct from grey (Bogus) and the muted-foreground colour.

2. **Focus ring:** Pressing Tab on `/dashboard` must show a visible 2px blue ring around each focused Button, with the ring offset matching the page background (not hard-coded white).

3. **Catch-all route:** Navigating to `/cases`, `/cases/new`, `/admin/people`, `/admin/departments`, `/metrics`, `/reports` (any unregistered path) must render the AppShell layout (Navbar + Sidebar + Breadcrumb) with "Coming Soon" heading and "Back to Dashboard" button — no blank screen.

4. **No regressions:** `npm run test -- --run` passes all tests (≥65, 0 failing). `npx tsc --noEmit` exits 0.
</verification>

<success_criteria>
- `--color-status-duplicate` is amber (`38 92% 50%` light / `38 90% 60%` dark) in globals.css
- `tailwind.config.ts` has `ringOffsetColor: { DEFAULT: "hsl(var(--color-background))" }` in `theme.extend`
- `buttonVariants` base class in `button.tsx` includes `focus-visible:ring-offset-background`
- Sidebar `<nav>` uses `overflow-x-hidden` (focus rings on nav links are no longer clipped)
- `frontend/src/pages/ComingSoonPage.tsx` exists with a descriptive heading and "Back to Dashboard" button
- `App.tsx` has `<Route path="*" element={<ComingSoonPage />} />` as the last child of the `AppShell` route group
- All Vitest tests pass; TypeScript compiles clean
</success_criteria>

<output>
After completion, create `.planning/phases/07-react-design-system-and-shell/07-GAP-01-SUMMARY.md`
</output>
