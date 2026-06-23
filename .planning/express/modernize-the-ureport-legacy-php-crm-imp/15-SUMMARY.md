---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 15
subsystem: frontend
tags: [search, map, leaflet, solr, geo-clusters, filter-panel, sla-badges, csv-export]
dependency_graph:
  requires:
    - plan: "07"
      artifacts: ["GET /api/tickets (SearchController)", "GET /api/tickets/clusters (GeoController)"]
  provides:
    - artifact: "frontend/src/lib/api/search.ts"
      exports: ["searchTickets()", "exportCsv()"]
    - artifact: "frontend/src/lib/api/geo.ts"
      exports: ["fetchClusters()", "fetchTicketPins()"]
    - artifact: "frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts"
      exports: ["useTicketSearch()"]
    - artifact: "frontend/src/app/(staff)/map/components/TicketMap.tsx"
      exports: ["TicketMap (default export)"]
  affects:
    - "F4: Full-Text Search & Filtering"
    - "F5: Geospatial Features"
    - "F15: SPA Frontend"
tech_stack:
  added:
    - "leaflet ^1.9.4"
    - "react-leaflet ^5.0.0"
    - "@types/leaflet ^1.9.21"
  patterns:
    - "URL-serialized filter state via Next.js useSearchParams + router.replace"
    - "300ms debounced Solr calls with AbortController cancel"
    - "Leaflet dynamic import (ssr: false) to prevent SSR crash"
    - "Bbox-driven cluster refetch on Leaflet moveend"
    - "Drill-down threshold: zoom ≥ 14 AND max cluster count < 10 → individual pins"
key_files:
  created:
    - frontend/src/types/search.ts
    - frontend/src/types/geo.ts
    - frontend/src/lib/api/search.ts
    - frontend/src/lib/api/geo.ts
    - frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts
    - frontend/src/app/(staff)/tickets/components/FilterPanel.tsx
    - frontend/src/app/(staff)/tickets/components/SortBar.tsx
    - frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx
    - frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx
    - frontend/src/app/(staff)/map/hooks/useClusterData.ts
    - frontend/src/app/(staff)/map/components/ClusterLayer.tsx
    - frontend/src/app/(staff)/map/components/TicketPinLayer.tsx
    - frontend/src/app/(staff)/map/components/TicketMap.tsx
    - frontend/src/app/(staff)/map/page.tsx
    - frontend/e2e/search-filter.spec.ts
    - frontend/e2e/map-view.spec.ts
    - frontend/src/hooks/useAuth.ts
    - frontend/src/components/ui/badge.tsx
    - frontend/src/components/ui/select.tsx
    - frontend/src/components/ui/alert.tsx
  modified:
    - frontend/src/app/(staff)/tickets/page.tsx
decisions:
  - "Used Leaflet dynamic import (ssr: false) to prevent window/document SSR crashes"
  - "503 Solr error surfaced as banner (not crash) via status property on thrown Error"
  - "DRILL_DOWN_THRESHOLD=10: at zoom ≥ 14, max cluster count < 10 switches to individual pins"
  - "CSV export uses anchor-click pattern (not fetch-to-memory) for browser Content-Disposition handling"
  - "URL-serialized filter state: all filter changes go through router.replace() for bookmarkability"
  - "Debounce 300ms on search calls to avoid Solr overload during typing"
metrics:
  duration: "~30 minutes"
  completed_date: "2026-06-23"
  tasks_completed: 2
  files_created: 20
  files_modified: 1
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 15: Faceted Search UI + Geo-clustered Map View Summary

**One-liner:** Solr-backed faceted search with URL-serialized filters, SLA badges, CSV export, and Leaflet geo-cluster map with zoom drill-down to individual ticket pins.

## What Was Built

### Task 1: Search API client, types, useTicketSearch hook, and /tickets page

**Types (`frontend/src/types/search.ts`)**
- `TicketSearchParams` — all 16 filter/sort/pagination params matching Wave 2c SearchController
- `TicketListItem` — complete ticket representation including optional `slaStatus` field
- `SearchFacets`, `TicketSearchMeta`, `TicketSearchResult` — response envelope types
- `SlaStatus` — `'breach' | 'warning' | 'ok' | 'none'` union

**API Client (`frontend/src/lib/api/search.ts`)**
- `searchTickets(params, signal?)` — builds URLSearchParams, fetches GET /api/tickets, throws `Object.assign(new Error('SEARCH_UNAVAILABLE'), { status: 503 })` for Solr-down detection
- `exportCsv(params)` — appends `export=csv`, triggers browser download via hidden anchor click (no in-memory buffering)

**Hook (`frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts`)**
- Reads all filters from `useSearchParams()` (URL as single source of truth)
- `setParam(updates)` writes back to URL via `router.replace()` — resets `page` to 1 on any non-page change
- 300ms debounce + `AbortController` for cancel-on-change
- Returns `{ params, setParam, results, facets, meta, isLoading, error, isSearchUnavailable }`
- 503 detected via `err.status` → sets `isSearchUnavailable=true` (not crashes)

**FilterPanel (`frontend/src/app/(staff)/tickets/components/FilterPanel.tsx`)**
- Status radio group (All / Open / Closed) with facet counts
- CategoryID and DepartmentID number inputs with top facet hints
- Date range From/To with validation warning if start > end
- Reporter email field
- Clear All button resets all filter params at once

**SortBar (`frontend/src/app/(staff)/tickets/components/SortBar.tsx`)**
- 5 sort options: date_desc (default), date_asc, sla_asc, assignee, category
- Shows result count left-aligned; sort Select right-aligned

**TicketResultsList (`frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx`)**
- SLA badges: 🔴 SLA Breach (red), 🟡 Due Today (amber), 🟢 On Track (green)
- Each row links to `/tickets/:id`; bulk-select checkbox stops propagation
- Loading skeleton: 5 pulse bars with `aria-busy="true"` + `aria-label="Loading tickets"`
- Empty state: `role="status"` with "No tickets match your filters"
- Pagination: Prev/Next buttons, hidden when pages ≤ 1

**Unit Tests (`frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx`)**
- 4 tests: renders ticket row, SLA breach badge, loading skeleton, empty state
- Tests written; execution deferred to verify phase (Jest not configured yet)

**Tickets Page (`frontend/src/app/(staff)/tickets/page.tsx`)**
- Wraps everything in `<Suspense>` for `useSearchParams()`
- CSV Export button shown only for `staff` | `admin` roles (via `useAuth()`)
- Map View button links to `/map?{current-params}` for filter preservation
- Solr unavailable: inline `role="alert"` div (not Alert component — avoids `role="alert"` double-add)

### Task 2: Geo API client, types, useClusterData hook, and /map page

**Types (`frontend/src/types/geo.ts`)**
- `GeoCluster { lat, lng, count, zoom }` — matches GET /api/tickets/clusters response
- `TicketPin { id, title, status, lat, lng }` — individual ticket for pin rendering
- `ClusterParams` — bbox, zoom, status, categoryId[], departmentId[]

**API Client (`frontend/src/lib/api/geo.ts`)**
- `fetchClusters(params, signal?)` — builds query from ClusterParams, calls GET /api/tickets/clusters
- `fetchTicketPins(bbox, signal?)` — calls GET /api/tickets?bbox=…&perPage=50&status=open, filters null lat/lng

**useClusterData hook (`frontend/src/app/(staff)/map/hooks/useClusterData.ts`)**
- `refetch(bbox, zoom)` called on Leaflet `moveend` + initial mount
- If `zoom >= 14 && maxClusterCount < 10`: switches to `fetchTicketPins()` → individual pins
- Otherwise: shows cluster circles
- Cancels in-flight requests via `AbortController` on each refetch

**ClusterLayer (`frontend/src/app/(staff)/map/components/ClusterLayer.tsx`)**
- Renders `CircleMarker` per cluster with log-scale radius (14–50px)
- Click handler: `map.setView([lat, lng], zoom + 2)` for drill-down
- `Tooltip` shows count permanently centered on marker

**TicketPinLayer (`frontend/src/app/(staff)/map/components/TicketPinLayer.tsx`)**
- Renders `Marker` per pin with `Popup` containing: `#id`, title, status badge (blue=open, gray=closed), "View ticket →" link to `/tickets/:id`

**TicketMap (`frontend/src/app/(staff)/map/components/TicketMap.tsx`)**
- `MapContainer` centered on US (39.5, -98.35) zoom 5 (shows whole country)
- `BboxTracker` inner component fires refetch on `moveend` + initial mount effect
- Loading spinner (z-1000 overlay) and error banner (z-1000) shown above map
- Dynamically switches between ClusterLayer and TicketPinLayer based on `showPins`

**Map Page (`frontend/src/app/(staff)/map/page.tsx`)**
- `dynamic(() => import('./components/TicketMap'), { ssr: false })` — prevents Leaflet SSR crash
- Reads filter params from URL (forwarded from `/tickets` via Map View button)
- "List View" back-link preserves current URL params

**E2E Tests**
- `frontend/e2e/search-filter.spec.ts`: 6 Playwright tests (search input, status filter, CSV button, map view nav, Solr 503 banner, Clear All) — deferred to verify phase
- `frontend/e2e/map-view.spec.ts`: 5 Playwright tests (map renders, list view nav, empty cluster graceful, 500 error banner, filter param preservation) — deferred to verify phase

## Deviations from Plan

### Auto-added dependencies (Rule 2 — Missing Critical)

The `ui/` components directory was empty when plan execution started. Implemented stubs for required shadcn/ui components:
- `frontend/src/components/ui/badge.tsx` — `Badge` with variant support (default, outline, secondary, destructive)
- `frontend/src/components/ui/select.tsx` — full Radix UI Select with Trigger/Content/Item/Label/Separator
- `frontend/src/components/ui/alert.tsx` — `Alert`, `AlertDescription`, `AlertTitle` with default/destructive variants

Also added:
- `frontend/src/hooks/useAuth.ts` — client-side auth hook fetching GET /api/auth/me with module-level cache

These were required by the plan's components and not previously existing.

### Tickets page updated (not replaced)

The existing `/tickets/page.tsx` had evolved through prior plan implementations. Rather than replacing it wholesale, the page was updated to match plan 15 requirements: added `useAuth()`, `exportCsv()` import, Export CSV button (staff/admin only), and Map View link preserving URL params.

### Pre-existing TypeScript issue (out of scope)

`frontend/src/components/tickets/CreateTicketForm.tsx` has a type mismatch on `LocationStep`'s `onChange` prop. This is an untracked pre-existing issue unrelated to plan 15. `npx tsc --noEmit` passes cleanly on the committed codebase.

## Integration Contracts Fulfilled

| Contract | Verification |
|----------|-------------|
| `searchTickets(params)` exported from `lib/api/search.ts` | ✅ |
| `exportCsv(params)` exported from `lib/api/search.ts` | ✅ |
| `useTicketSearch()` exported from `tickets/hooks/useTicketSearch.ts` | ✅ |
| `fetchClusters(params)` exported from `lib/api/geo.ts` | ✅ |
| `TicketMap` default-exported from `map/components/TicketMap.tsx` | ✅ |
| `useClusterData()` exported from `map/hooks/useClusterData.ts` | ✅ |

## Self-Check: PASSED

All 17 required files found on disk. Key commits verified:
- `902a73c` — feat(express-15): search UI (tickets/page.tsx updated with CSV export + Map View)
- `a4e5433` — feat(modernize-the-ureport-legacy-php-crm-imp-11): search types, hook, components committed  
- `61a5f91` — feat(express-12): geo types, geo API, map components committed

TypeScript: `npx tsc --noEmit` exits clean (0 errors on committed files).
E2E tests: written as artifacts; execution deferred to verify phase (no browser/server during execute).
