---
status: diagnosed
trigger: "Gap 3: Sidebar nav links navigate to blank pages — UAT Phase 7 diagnosis"
created: 2026-07-08T00:00:00Z
updated: 2026-07-08T00:00:00Z
---

## Current Focus

hypothesis: App.tsx only registers /dashboard and / routes. All other sidebar nav hrefs (/cases, /cases/new, /admin/*, /metrics, /reports) have no matching Route. React Router renders the <AppShell> (Outlet) with nothing inside it — resulting in a blank main area. No 404 fallback route exists.
test: Read App.tsx routes vs Sidebar.tsx navGroups hrefs
expecting: Confirmed mismatch — routes exist only for dashboard, pages not yet built
next_action: DIAGNOSED — report to caller

## Symptoms

expected: Clicking sidebar nav links (All Cases, New Case, People, etc.) shows page content with a breadcrumb header inside the AppShell layout
actual: Blank page — the AppShell chrome (sidebar, navbar) renders but the main content area is empty
errors: none (no runtime error — React Router silently renders nothing when no route matches inside an Outlet)
reproduction: Log in, click any nav link other than Dashboard
started: Phase 7 — pages for these routes belong to Phase 8+

## Eliminated

- hypothesis: Sidebar NavLink hrefs are wrong (typos, wrong paths)
  evidence: Sidebar.tsx navGroups items are well-formed paths (/cases, /admin/people, etc.). NavLink to= props match expected URL structure.
  timestamp: 2026-07-08

- hypothesis: Router is not wrapping the app (BrowserRouter missing)
  evidence: App.tsx is rendered inside a BrowserRouter (standard Vite+React Router setup — confirmed by useLocation() at line 11 working without error, and AnimatePresence using location.pathname). Router is present.
  timestamp: 2026-07-08

- hypothesis: AppShell Outlet is broken (not rendering children)
  evidence: AppShell.tsx line 46 has <Outlet /> correctly inside the <main> tag. DashboardPage renders fine at /, confirming Outlet works.
  timestamp: 2026-07-08

- hypothesis: Auth guard redirecting to /login
  evidence: AppShell.tsx lines 11-15: auth redirect fires only when user === null. A logged-in user won't redirect. The blank page is observed after login.
  timestamp: 2026-07-08

## Evidence

- timestamp: 2026-07-08
  checked: App.tsx lines 19-23 — all registered routes
  found: Only 3 routes defined: /login (LoginPage), /dashboard (DashboardPage), / (DashboardPage). No catch-all /* route. No /cases, /admin/*, /metrics, /reports routes.
  implication: React Router v6 renders nothing into the Outlet when no child route matches the current URL. No error is thrown. The AppShell chrome renders, main content area is empty.

- timestamp: 2026-07-08
  checked: Sidebar.tsx navGroups — all hrefs
  found: 12 nav items total. 1 matches (/dashboard). 11 do not have corresponding routes:
    /cases, /cases/new, /admin/people, /admin/departments, /admin/categories,
    /admin/substatus, /admin/issue-types, /admin/contact-methods, /admin/clients,
    /admin/actions, /metrics, /reports
  implication: 11 out of 12 sidebar links lead to blank pages.

- timestamp: 2026-07-08
  checked: frontend/src/pages/ directory listing
  found: Only DashboardPage.tsx and LoginPage.tsx exist. No other page components exist.
  implication: The page components for all non-dashboard routes are Phase 8+ deliverables. They cannot be wired in Phase 7.

- timestamp: 2026-07-08
  checked: App.tsx for catch-all or 404 route
  found: No <Route path="*"> fallback route exists. When a user navigates to /cases, React Router finds the <Route element={<AppShell />}> (no path restriction) which renders, but its child routes have no match, so Outlet renders null.
  implication: A Phase 7 quality-of-life fix is possible without Phase 8 pages: add a catch-all <Route path="*"> inside AppShell's children that renders a "Coming Soon" or "Page not found" placeholder component. This would replace the blank area with user-legible feedback.

- timestamp: 2026-07-08
  checked: NavLink end prop usage in Sidebar.tsx line 117
  found: end={item.href === "/dashboard" || item.href === "/"} — correct, prevents / from matching all routes as active
  implication: No isActive styling bug here, strictly a routing registration gap.

## Resolution

root_cause: >
  App.tsx (lines 19-23) only registers two content routes (/dashboard and /) under the AppShell
  layout route. The Sidebar defines 12 navigation items pointing to 12 distinct paths, but 11 of
  those paths have no matching <Route> in the router tree. React Router v6 renders nothing into
  the <Outlet /> when no child route matches, producing a blank main content area with no error.
  Additionally, no catch-all /* fallback route is registered inside or outside the AppShell, so
  there is no user-facing "page not found" message either.

  The root cause has two layers:
  1. Phase 8 pages don't exist yet (by-design gap — cases, admin, reports pages are Phase 8 work)
  2. No placeholder/fallback route was added in Phase 7 to handle unbuilt routes gracefully (in-phase gap)

fix: >
  Phase 7 in-phase fix (does NOT require Phase 8 pages):
  Add a catch-all fallback route inside the AppShell children in App.tsx:

    import NotFoundPage from "./pages/NotFoundPage";   // or a simple inline placeholder

    <Route element={<AppShell />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<ComingSoonPage />} />   {/* catch-all */}
    </Route>

  ComingSoonPage (or NotFoundPage) should render a breadcrumb-compatible heading and message
  like "This section is coming soon" so the shell chrome remains functional and the user sees
  feedback rather than a blank page.

  Phase 8 work: Replace the catch-all with specific route registrations as each page component
  is built (CasesPage, AdminPeoplePage, etc.).

verification: ""
files_changed:
  - frontend/src/App.tsx
  - frontend/src/pages/ComingSoonPage.tsx  (new file needed)
