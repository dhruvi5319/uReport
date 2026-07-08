---
phase: 07-react-design-system-and-shell
plan: "01"
subsystem: ui
tags: [react, vite, typescript, tailwindcss, framer-motion, design-tokens, dark-mode, vitest]

# Dependency graph
requires: []
provides:
  - React + Vite + TypeScript frontend scaffold in frontend/
  - Tailwind CSS design token system (18 CSS custom properties, light + dark mode)
  - ThemeProvider + useTheme hook with localStorage persistence
  - AuthProvider + useAuth hook calling GET /api/auth/me
  - Framer Motion animation presets (pageVariants, containerVariants, itemVariants, stepVariants)
  - cn() utility, api.ts Axios base client
  - 9 passing unit tests (6 theme + 3 token/animation)
affects: [08-dashboard-ui, 09-auth-ui, 10-reporting-ui, F18, F19, ANIM-01]

# Tech tracking
tech-stack:
  added:
    - React 18.3 + react-dom + react-router-dom 6.26
    - Vite 5.3 + @vitejs/plugin-react 4.3
    - TypeScript 5.5
    - Tailwind CSS 3.4 + autoprefixer + postcss
    - framer-motion 11
    - "@fontsource/inter + @fontsource/jetbrains-mono (offline, no CDN)"
    - clsx + tailwind-merge (cn utility)
    - axios 1.7 with withCredentials
    - "@radix-ui: dialog, popover, select, toast, tabs, avatar, alert-dialog"
    - cmdk 1.0, class-variance-authority 0.7, lucide-react 0.400
    - vitest 2.1 + @testing-library/react 16 + @testing-library/jest-dom 6.4 + jsdom 24
  patterns:
    - CSS custom properties (HSL triplets) referenced via hsl(var(--color-*)) in Tailwind config
    - Dark mode via .dark class on <html> (not media query) — ThemeProvider toggles via useEffect
    - localStorage key ureport-theme for theme persistence (vitest mock required)
    - Axios base client /api with withCredentials for httpOnly JWT cookie
    - Vite proxy /api + /open311 + /auth → localhost:8080 (dev); nginx handles prod proxy

key-files:
  created:
    - frontend/package.json
    - frontend/vite.config.ts
    - frontend/tsconfig.json
    - frontend/tsconfig.node.json
    - frontend/tailwind.config.ts
    - frontend/postcss.config.js
    - frontend/index.html
    - frontend/src/globals.css
    - frontend/src/main.tsx
    - frontend/src/App.tsx
    - frontend/src/lib/utils.ts
    - frontend/src/lib/animations.ts
    - frontend/src/lib/api.ts
    - frontend/src/contexts/ThemeContext.tsx
    - frontend/src/contexts/AuthContext.tsx
    - frontend/src/components/shell/AppShell.tsx
    - frontend/src/pages/LoginPage.tsx
    - frontend/src/pages/DashboardPage.tsx
    - frontend/src/test-setup.ts
    - frontend/src/__tests__/theme.test.tsx
    - frontend/src/__tests__/tokens.test.ts
  modified: []

key-decisions:
  - "CSS @import statements must precede @tailwind directives in globals.css — moved fontsource imports above @tailwind base/components/utilities"
  - "vitest/jsdom provides null-prototype localStorage with no methods — localStorage and matchMedia mocked in test-setup.ts"
  - "ThemeContext and AuthContext created in Task 1 (not Task 2) to enable npm run build to succeed — Task 2 adds only tests"
  - "Context files included in Task 1 commit because App.tsx imports them and tsc requires all referenced modules"

patterns-established:
  - "Design tokens: HSL triplets as CSS custom properties in :root and .dark; Tailwind extends via hsl(var(--color-*))"
  - "Theme: localStorage key ureport-theme; ThemeProvider adds/removes .dark on document.documentElement"
  - "Auth: AuthContext calls /api/auth/me on mount; 401 → navigate to /login"
  - "Test mocks: localStorage + matchMedia mocked in test-setup.ts for vitest jsdom compatibility"

# Metrics
duration: 15min
completed: 2026-07-08
---

# Phase 7 Plan 01: React Design System and Shell Foundation Summary

**React 18 + Vite 5 + TypeScript frontend scaffolded with 18-token CSS design system (light/dark), Framer Motion animation presets, ThemeContext/AuthContext, and 9 passing vitest unit tests**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-08T17:35:00Z
- **Completed:** 2026-07-08T17:50:45Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments

- Complete Vite + React + TypeScript project in `frontend/` with all specified dependencies installed and `npm run build` exit 0
- Full CSS design token system: 18 custom properties in `:root` (light mode) and 16 overrides in `.dark` (dark mode); Tailwind config extends all via `hsl(var(--color-*))` references
- ThemeContext with localStorage persistence (`ureport-theme` key), `.dark` class toggling on `<html>`, system preference support via `window.matchMedia`
- AuthContext calling `GET /api/auth/me` on mount with 401 → `/login` redirect; User type with exact field names for backend contract
- 4 Framer Motion variant presets (pageVariants, containerVariants, itemVariants, stepVariants), all durations ≤ 0.3s
- 9 unit tests passing: 6 ThemeProvider tests + 3 CSS token/animation validation tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite + React + TypeScript project with design tokens** - `6b04b86` (feat)
2. **Task 2: ThemeContext, AuthContext, and unit tests** - `73bae22` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `frontend/package.json` - Project manifest with all 30+ dependencies
- `frontend/vite.config.ts` - Vite config bound to 0.0.0.0:5173, /api proxy to localhost:8080
- `frontend/tailwind.config.ts` - Tailwind extending all colors via CSS variables
- `frontend/tsconfig.json` + `frontend/tsconfig.node.json` - TypeScript strict config
- `frontend/postcss.config.js` - PostCSS with tailwindcss + autoprefixer
- `frontend/index.html` - SPA entry point
- `frontend/src/globals.css` - Full design token CSS (18 properties, light + dark)
- `frontend/src/main.tsx` - React root with BrowserRouter
- `frontend/src/App.tsx` - AnimatePresence routing shell with ThemeProvider + AuthProvider
- `frontend/src/lib/utils.ts` - cn() utility (clsx + tailwind-merge)
- `frontend/src/lib/animations.ts` - 4 Framer Motion variant exports
- `frontend/src/lib/api.ts` - Axios base client with withCredentials
- `frontend/src/contexts/ThemeContext.tsx` - ThemeProvider + useTheme hook
- `frontend/src/contexts/AuthContext.tsx` - AuthProvider + useAuth hook
- `frontend/src/components/shell/AppShell.tsx` - Layout placeholder (full implementation in 07-03)
- `frontend/src/pages/LoginPage.tsx` - Placeholder (full auth UI in Phase 9)
- `frontend/src/pages/DashboardPage.tsx` - Placeholder with pageVariants animation
- `frontend/src/test-setup.ts` - jest-dom + localStorage/matchMedia mocks
- `frontend/src/__tests__/theme.test.tsx` - 6 ThemeProvider unit tests
- `frontend/src/__tests__/tokens.test.ts` - 3 CSS token/animation tests

## Decisions Made

- Moved `@fontsource` `@import` statements before `@tailwind` directives in `globals.css` — CSS spec requires `@import` before all other rules; Vite warned on build with original order from plan spec
- ThemeContext and AuthContext created in Task 1 (plan places them in Task 2) — `App.tsx` imports both and `tsc` fails if they're missing; build verification in Task 1 requires both files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CSS @import order in globals.css**
- **Found during:** Task 1 (Vite build)
- **Issue:** Plan spec had `@tailwind base/components/utilities` before `@import "@fontsource/..."` — CSS spec requires `@import` before all other statements; Vite emitted warnings on build
- **Fix:** Moved all 6 `@import` statements above the `@tailwind` directives
- **Files modified:** `frontend/src/globals.css`
- **Verification:** `npm run build` exits 0 with zero warnings
- **Committed in:** `6b04b86` (Task 1 commit)

**2. [Rule 1 - Bug] Added localStorage mock to test-setup.ts**
- **Found during:** Task 2 (vitest run)
- **Issue:** `localStorage.clear is not a function` — vitest 2.1.9 jsdom provides a null-prototype localStorage proxy with no methods (`getItem`, `setItem`, `clear` all undefined); ThemeContext also can't read/write localStorage without the mock
- **Fix:** Added `localStorageMock` via `Object.defineProperty(window, "localStorage", ...)` in `test-setup.ts`
- **Files modified:** `frontend/src/test-setup.ts`
- **Verification:** All 6 theme tests pass
- **Committed in:** `73bae22` (Task 2 commit)

**3. [Rule 1 - Bug] Added matchMedia mock to test-setup.ts**
- **Found during:** Task 2 (vitest run — after localStorage fix)
- **Issue:** `window.matchMedia is not a function` — jsdom does not implement `window.matchMedia`; `ThemeContext.getSystemTheme()` calls it unconditionally
- **Fix:** Added `matchMedia` mock (always returns `matches: false` = light mode) via `Object.defineProperty(window, "matchMedia", ...)` in `test-setup.ts`
- **Files modified:** `frontend/src/test-setup.ts`
- **Verification:** All 6 theme tests pass
- **Committed in:** `73bae22` (Task 2 commit)

**4. [Rule 2 - Missing Critical] Created ThemeContext.tsx and AuthContext.tsx in Task 1**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan places context files in Task 2, but App.tsx (Task 1) imports both; `tsc` cannot compile without them; Task 1 requires `npm run build` to exit 0
- **Fix:** Created full implementations of both context files in Task 1 rather than placeholder stubs
- **Files modified:** `frontend/src/contexts/ThemeContext.tsx`, `frontend/src/contexts/AuthContext.tsx`
- **Verification:** `npm run build` exits 0; `npm run test` passes 9 tests
- **Committed in:** `6b04b86` (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 bug, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for build correctness and test compatibility. No scope creep. Context files match plan spec exactly — Task 2 delivered tests as specified.

## Issues Encountered

None — all issues resolved via deviation rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Design system foundation complete: all tokens, contexts, and utilities ready for consumption
- Ready for 07-02 (Radix UI primitives / shadcn components) and 07-03 (AppShell navigation)
- ThemeContext exports (`ThemeProvider`, `useTheme`, `Theme`) and AuthContext exports (`AuthProvider`, `useAuth`, `User`) match contracts required by F18/F19/ANIM-01

## Self-Check: PASSED

All 12 key files verified on disk. Both commits (6b04b86, 73bae22) present in git log.

---
*Phase: 07-react-design-system-and-shell*
*Completed: 2026-07-08*
