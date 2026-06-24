---
phase: implement-the-full-ureport-modernization
plan: "08"
subsystem: frontend-wave3c
tags: [react, typescript, leaflet, maps, bookmarks, metrics, reports, crud, open311]
dependency_graph:
  requires:
    - plan: "06"
      artifacts: ["web/src/api/client.ts", "web/src/hooks/usePermission.ts"]
    - plan: "07"
      artifacts: ["web/src/router/index.tsx", "web/src/components/layout/Sidebar.tsx"]
    - plan: "05"
      artifacts: ["BookmarkController", "MediaController", "MetricsController", "AdminJobController", "ResponseTemplateController", "IssueTypeController", "ContactMethodController"]
  provides:
    - artifact: "web/src/pages/Open311ServiceListPage.tsx"
      exports: ["Open311ServiceListPage"]
    - artifact: "web/src/components/media/MediaUploader.tsx"
      exports: ["MediaUploader"]
    - artifact: "web/src/pages/admin/BookmarksPage.tsx"
      exports: ["BookmarksPage"]
    - artifact: "web/src/components/layout/Sidebar.tsx"
      exports: ["Sidebar (with bookmarks)"]
    - artifact: "web/src/pages/admin/TicketMapPage.tsx"
      exports: ["TicketMapPage"]
    - artifact: "web/src/pages/admin/AdminJobsPage.tsx"
      exports: ["AdminJobsPage"]
    - artifact: "web/src/pages/admin/MetricsDashboardPage.tsx"
      exports: ["MetricsDashboardPage"]
    - artifact: "web/src/pages/admin/ReportsPage.tsx"
      exports: ["ReportsPage"]
    - artifact: "web/src/pages/admin/IssueTypesPage.tsx"
      exports: ["IssueTypesPage"]
    - artifact: "web/src/pages/admin/ResponseTemplatesPage.tsx"
      exports: ["ResponseTemplatesPage"]
    - artifact: "web/src/components/tickets/ResponseTemplatePicker.tsx"
      exports: ["ResponseTemplatePicker"]
  affects:
    - "web/src/router/index.tsx"
    - "web/src/components/layout/Sidebar.tsx"
tech_stack:
  added:
    - react-leaflet@4 + leaflet (geo-cluster map rendering)
    - @types/leaflet
  patterns:
    - inline-style React components (project convention)
    - usePermission('staff') boolean guard pattern
    - Navigate redirect for auth gating (no loading state)
    - createBrowserRouter route definitions
    - apiClient relative paths (baseURL /api/v1)
    - plain axios for public /open311 endpoints (no auth required)
key_files:
  created:
    - web/src/api/open311.ts
    - web/src/api/media.ts
    - web/src/api/bookmarks.ts
    - web/src/api/contactMethods.ts
    - web/src/api/geo.ts
    - web/src/api/adminJobs.ts
    - web/src/api/metrics.ts
    - web/src/api/issueTypes.ts
    - web/src/api/responseTemplates.ts
    - web/src/pages/Open311ServiceListPage.tsx
    - web/src/components/media/MediaThumbnail.tsx
    - web/src/components/media/MediaUploader.tsx
    - web/src/hooks/useBookmarks.ts
    - web/src/pages/admin/BookmarksPage.tsx
    - web/src/pages/admin/ContactMethodsPage.tsx
    - web/src/components/map/GeoClusterMap.tsx
    - web/src/pages/admin/TicketMapPage.tsx
    - web/src/api/adminJobs.ts
    - web/src/pages/admin/AdminJobsPage.tsx
    - web/src/components/metrics/OnTimeChart.tsx
    - web/src/components/metrics/ReportTable.tsx
    - web/src/pages/admin/MetricsDashboardPage.tsx
    - web/src/pages/admin/ReportsPage.tsx
    - web/src/pages/admin/IssueTypesPage.tsx
    - web/src/pages/admin/ResponseTemplatesPage.tsx
    - web/src/components/tickets/ResponseTemplatePicker.tsx
  modified:
    - web/src/components/layout/Sidebar.tsx
    - web/src/router/index.tsx
    - web/vite.config.ts
    - web/package.json
decisions:
  - "Use plain axios (not apiClient) for /open311/services endpoint since it is public and not under /api/v1"
  - "Pages created under web/src/pages/admin/ following Wave 3b convention, not top-level pages/"
  - "react-leaflet v4 installed (not v5) for React 18 compatibility"
  - "Added @/ alias to vite.config.ts to fix production build (pre-existing missing config)"
metrics:
  duration: "~30 minutes"
  completed: "2026-06-24T20:43:31Z"
  tasks_completed: 2
  files_created: 26
  files_modified: 4
---

# Phase implement-the-full-ureport-modernization Plan 08: Wave 3c Frontend Pages Summary

**One-liner:** Implemented 9 Wave 3c feature pages (Open311 list, media uploader, bookmarks, contact methods, geo-cluster map, scheduler admin, metrics dashboard, 10-report page, issue types CRUD, response template CRUD + picker) with 9 API modules, 5 shared components, updated Sidebar and router.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | API modules + Open311, Media, Bookmarks, Contact Methods, Geo Map pages (F2, F10, F12, F14, F15) | `83b62e4` | 14 files created |
| 2 | Scheduler admin, Metrics, Reports, Issue Types, Response Templates, Sidebar + Router routes (F16, F17, F19, F20) | `cbed6b5` | 15 files created/modified |

## Features Implemented

- **F2** — `Open311ServiceListPage`: Public (no auth) page fetching `/open311/services` and displaying service_code, service_name, group, description in a table. Uses plain `axios` (not `apiClient`) since endpoint is outside `/api/v1`.
- **F10** — `MediaUploader` + `MediaThumbnail`: Drag-and-drop + click-to-browse file uploader POSTing `multipart/form-data` to `/api/v1/tickets/{id}/media`. Shows thumbnail previews for images.
- **F12** — `BookmarksPage` + `useBookmarks` hook: Staff-gated CRUD page; save current URL as named bookmark; click bookmark to navigate; delete button. Sidebar shows saved searches.
- **F14** — `ContactMethodsPage`: Staff-gated read-only table of the four system-seeded contact methods with "System" badge.
- **F15** — `TicketMapPage` + `GeoClusterMap`: Staff-gated map view using `react-leaflet` with `CircleMarker` per cluster; cluster click navigates to `/tickets` with lat/long/radius filters; "Switch to List View" link.
- **F16** — `AdminJobsPage`: Four job cards (digest-notifications, auto-close, audit, geo-cluster); "Run Now" button → `POST /api/v1/admin/jobs/{jobName}/run`; green/red feedback text.
- **F17** — `MetricsDashboardPage` + `ReportsPage`: Metrics page has category/numDays/effectiveDate form with `OnTimeChart` (CSS bar). Reports page has all 10 report types, date range inputs, results in `ReportTable`.
- **F19** — `IssueTypesPage`: Full CRUD; system types show 🔒 badge and have edit/delete disabled.
- **F20** — `ResponseTemplatesPage` + `ResponseTemplatePicker`: Template CRUD with name/template text/action association. Picker dropdown filtered by `actionId` calls `onSelect(templateText)` to pre-fill ticket response notes.

## Files Created

### API Modules (9)
- `web/src/api/open311.ts` — `open311Api.listServices()`, `getService()`
- `web/src/api/media.ts` — `mediaApi.uploadFile()`, `listMedia()`, `deleteMedia()`, `originalUrl()`, `thumbnailUrl()`
- `web/src/api/bookmarks.ts` — `bookmarksApi.list()`, `create()`, `delete()`
- `web/src/api/contactMethods.ts` — `contactMethodsApi.list()`
- `web/src/api/geo.ts` — `geoApi.searchMap()` with `view=map` param
- `web/src/api/adminJobs.ts` — `adminJobsApi.run(jobName)`
- `web/src/api/metrics.ts` — `metricsApi.getMetrics()`, `getReport()`
- `web/src/api/issueTypes.ts` — `issueTypesApi.list()`, `create()`, `update()`, `delete()`
- `web/src/api/responseTemplates.ts` — `responseTemplatesApi.list(actionId?)`, `create()`, `update()`, `delete()`

### Pages (9)
- `web/src/pages/Open311ServiceListPage.tsx` — public service list
- `web/src/pages/admin/BookmarksPage.tsx` — staff-gated bookmark CRUD
- `web/src/pages/admin/ContactMethodsPage.tsx` — read-only contact methods
- `web/src/pages/admin/TicketMapPage.tsx` — geo-cluster map view
- `web/src/pages/admin/AdminJobsPage.tsx` — scheduler trigger buttons
- `web/src/pages/admin/MetricsDashboardPage.tsx` — onTimePercentage metrics
- `web/src/pages/admin/ReportsPage.tsx` — 10 canned reports
- `web/src/pages/admin/IssueTypesPage.tsx` — issue type CRUD
- `web/src/pages/admin/ResponseTemplatesPage.tsx` — response template CRUD

### Components (6)
- `web/src/components/media/MediaThumbnail.tsx` — image thumbnail or file link
- `web/src/components/media/MediaUploader.tsx` — drag-and-drop uploader
- `web/src/components/map/GeoClusterMap.tsx` — Leaflet cluster map
- `web/src/components/metrics/OnTimeChart.tsx` — CSS percentage bar
- `web/src/components/metrics/ReportTable.tsx` — generic data table
- `web/src/components/tickets/ResponseTemplatePicker.tsx` — template dropdown

### Hooks (1)
- `web/src/hooks/useBookmarks.ts` — fetches bookmarks, provides refresh + deleteBookmark

### Updated Files
- `web/src/components/layout/Sidebar.tsx` — All nav items for new Wave 3c pages + saved bookmarks section
- `web/src/router/index.tsx` — All 9 new routes replacing placeholder stubs; zero dead routes
- `web/vite.config.ts` — Added `resolve.alias` for `@/` (Rule 3 fix, see Deviations)
- `web/package.json` — Added react-leaflet@4, leaflet, @types/leaflet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted file structure to match project conventions**
- **Found during:** Task 1
- **Issue:** Plan specified pages at `web/src/pages/BookmarksPage.tsx` etc., but the project uses `web/src/pages/admin/` for admin/staff pages (established in Wave 3b)
- **Fix:** Created pages under `web/src/pages/admin/` following the existing convention
- **Files modified:** All new page files

**2. [Rule 3 - Blocking] Adapted `usePermission` usage to actual API**
- **Found during:** Task 1
- **Issue:** Plan specified `const { isStaff, loading: authLoading } = usePermission()` but the actual hook signature is `usePermission(role: PermissionLevel): boolean`
- **Fix:** Used `const authorized = usePermission('staff'); if (!authorized) return <Navigate to="/" replace />;` pattern from Wave 3b

**3. [Rule 3 - Blocking] Used plain axios for /open311/services endpoint**
- **Found during:** Task 1
- **Issue:** `apiClient` has `baseURL: '/api/v1'` so relative paths would resolve incorrectly for `/open311/services`
- **Fix:** Used plain `axios` (not `apiClient`) for the open311 API module

**4. [Rule 3 - Blocking] Fixed missing Vite `@/` path alias**
- **Found during:** Task 2 (build check)
- **Issue:** `web/vite.config.ts` was missing `resolve.alias` for the `@/` → `./src` path alias used throughout the codebase. Build failed with "Rollup failed to resolve import `@/contexts/AuthContext`"
- **Fix:** Added `resolve: { alias: { '@': path.resolve(__dirname, './src') } }` to `vite.config.ts`
- **Files modified:** `web/vite.config.ts`
- **Note:** This was a pre-existing issue present before plan 08; fixing it here ensures the production build works

**5. [Rule 3 - Blocking] Used react-leaflet v4 (not latest v5)**
- **Found during:** Task 1
- **Issue:** `react-leaflet@5` requires React 19, but the project uses React 18
- **Fix:** Installed `react-leaflet@4` with `--legacy-peer-deps`
- **Files modified:** `web/package.json`

**6. [Rule 1 - Adaptation] Updated router instead of App.tsx**
- **Found during:** Task 2
- **Issue:** Plan said to update `App.tsx` with `BrowserRouter + Routes` pattern, but the project uses `createBrowserRouter` in `web/src/router/index.tsx`
- **Fix:** Updated `web/src/router/index.tsx` to add all new routes, replacing placeholder stubs

## Self-Check

### Files exist:
- [x] `web/src/api/open311.ts`
- [x] `web/src/api/media.ts`
- [x] `web/src/api/bookmarks.ts`
- [x] `web/src/api/contactMethods.ts`
- [x] `web/src/api/geo.ts`
- [x] `web/src/api/adminJobs.ts`
- [x] `web/src/api/metrics.ts`
- [x] `web/src/api/issueTypes.ts`
- [x] `web/src/api/responseTemplates.ts`
- [x] `web/src/pages/Open311ServiceListPage.tsx`
- [x] `web/src/pages/admin/BookmarksPage.tsx`
- [x] `web/src/pages/admin/ContactMethodsPage.tsx`
- [x] `web/src/pages/admin/TicketMapPage.tsx`
- [x] `web/src/pages/admin/AdminJobsPage.tsx`
- [x] `web/src/pages/admin/MetricsDashboardPage.tsx`
- [x] `web/src/pages/admin/ReportsPage.tsx`
- [x] `web/src/pages/admin/IssueTypesPage.tsx`
- [x] `web/src/pages/admin/ResponseTemplatesPage.tsx`
- [x] `web/src/components/media/MediaUploader.tsx`
- [x] `web/src/components/media/MediaThumbnail.tsx`
- [x] `web/src/components/map/GeoClusterMap.tsx`
- [x] `web/src/components/metrics/OnTimeChart.tsx`
- [x] `web/src/components/metrics/ReportTable.tsx`
- [x] `web/src/components/tickets/ResponseTemplatePicker.tsx`
- [x] `web/src/hooks/useBookmarks.ts`

### Commits exist:
- [x] `83b62e4` — Task 1 (F2, F10, F12, F14, F15)
- [x] `cbed6b5` — Task 2 (F16, F17, F19, F20 + Sidebar + Router)

### Build passes:
- [x] `npm run build` — 207 modules transformed, 0 errors, built in 1.75s

## Self-Check: PASSED
