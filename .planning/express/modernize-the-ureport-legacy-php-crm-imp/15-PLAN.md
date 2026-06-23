---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 15
type: execute
wave: 3
depends_on: [2]
files_modified:
  - frontend/src/app/(staff)/tickets/page.tsx
  - frontend/src/app/(staff)/tickets/components/FilterPanel.tsx
  - frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx
  - frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx
  - frontend/src/app/(staff)/tickets/components/SortBar.tsx
  - frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts
  - frontend/src/app/(staff)/map/page.tsx
  - frontend/src/app/(staff)/map/components/TicketMap.tsx
  - frontend/src/app/(staff)/map/components/ClusterLayer.tsx
  - frontend/src/app/(staff)/map/components/TicketPinLayer.tsx
  - frontend/src/app/(staff)/map/hooks/useClusterData.ts
  - frontend/src/lib/api/search.ts
  - frontend/src/lib/api/geo.ts
  - frontend/src/types/search.ts
  - frontend/src/types/geo.ts
  - frontend/e2e/search-filter.spec.ts
  - frontend/e2e/map-view.spec.ts
autonomous: true

features:
  implements: ["F4", "F5", "F15"]
  depends_on: ["F16", "F11", "F10"]
  enables: ["F4", "F5"]

must_haves:
  truths:
    - "Staff can enter keywords and apply filters (status, category, department, assignee, date range, reporter email) and see paginated Solr-backed ticket results"
    - "Each ticket row shows SLA badge (sla-breach red / sla-warning amber / sla-ok green / none) and clicking it navigates to /tickets/:id"
    - "Filter state is serialized into URL query params so the page is bookmarkable and shareable"
    - "Export CSV button triggers GET /api/tickets?export=csv download; hidden for public role"
    - "Sort control (date_desc default, date_asc, sla_asc, assignee, category) updates results without full-page reload"
    - "Solr unavailable banner (503) displayed without crashing the page"
    - "Map page at /map renders Leaflet with geo-cluster markers; zoom-in drill-down reveals individual ticket pins when count < 10"
    - "Bounding box changes (pan/zoom) re-query GET /api/tickets/clusters with current bbox and zoom params"
    - "Individual ticket pins are clickable and show a popup with ticket ID, title, status badge, and link to /tickets/:id"
  artifacts:
    - path: "frontend/src/app/(staff)/tickets/components/FilterPanel.tsx"
      provides: "Collapsible filter sidebar with status/substatus/category/dept/assignee/date/email controls"
      exports: ["FilterPanel"]
    - path: "frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx"
      provides: "Paginated ticket list with SLA badges, sort bar, bulk select checkboxes"
      exports: ["TicketResultsList"]
    - path: "frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts"
      provides: "React hook: manages filter state ↔ URL sync, calls GET /api/tickets, returns results + facets"
      exports: ["useTicketSearch"]
    - path: "frontend/src/app/(staff)/map/components/TicketMap.tsx"
      provides: "Leaflet map with cluster + pin layers, bbox-driven cluster refetch"
      exports: ["TicketMap"]
    - path: "frontend/src/lib/api/search.ts"
      provides: "searchTickets(), exportCsv() — typed wrappers around GET /api/tickets"
      exports: ["searchTickets", "exportCsv"]
    - path: "frontend/src/lib/api/geo.ts"
      provides: "fetchClusters() — typed wrapper around GET /api/tickets/clusters"
      exports: ["fetchClusters"]
  key_links:
    - from: "frontend/src/app/(staff)/tickets/page.tsx"
      to: "frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts"
      via: "hook consumes URL searchParams, calls searchTickets()"
      pattern: "useTicketSearch"
    - from: "frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts"
      to: "frontend/src/lib/api/search.ts"
      via: "import searchTickets"
      pattern: "searchTickets"
    - from: "frontend/src/app/(staff)/map/components/TicketMap.tsx"
      to: "frontend/src/lib/api/geo.ts"
      via: "Leaflet moveend event → fetchClusters(bbox, zoom, filters)"
      pattern: "fetchClusters"
    - from: "frontend/src/app/(staff)/map/components/ClusterLayer.tsx"
      to: "frontend/src/app/(staff)/map/hooks/useClusterData.ts"
      via: "useClusterData returns GeoCluster[] array"
      pattern: "useClusterData"

integration_contracts:
  requires:
    - from_plan: "07"
      artifact: "crm/src/Controllers/Api/SearchController.php"
      exports: ["GET /api/tickets — search + filters + pagination + CSV export"]
      verify: "grep -n 'class SearchController' crm/src/Controllers/Api/SearchController.php && echo CONTRACT_OK"
    - from_plan: "07"
      artifact: "crm/src/Controllers/Api/GeoController.php"
      exports: ["GET /api/tickets/clusters", "GET /api/geocode", "GET /api/tickets/{id}/location"]
      verify: "grep -n 'class GeoController' crm/src/Controllers/Api/GeoController.php && echo CONTRACT_OK"
    - from_plan: "07"
      artifact: "crm/src/Services/SearchService.php"
      exports: ["SearchService::search(array $params): array"]
      verify: "grep -n 'function search' crm/src/Services/SearchService.php && echo CONTRACT_OK"
  provides:
    - artifact: "frontend/src/lib/api/search.ts"
      exports: ["searchTickets(params: TicketSearchParams): Promise<TicketSearchResult>", "exportCsv(params: TicketSearchParams): Promise<void>"]
      shape: |
        export interface TicketSearchParams {
          q?: string; status?: string; substatusId?: number; categoryId?: number[];
          departmentId?: number[]; assigneeId?: number; reporterEmail?: string;
          dateFrom?: string; dateTo?: string; lat?: number; lng?: number;
          radius?: number; bbox?: string; sort?: string; page?: number; perPage?: number;
        }
        export interface TicketSearchResult {
          data: TicketListItem[];
          meta: { total: number; page: number; perPage: number; pages: number; facets: SearchFacets };
        }
        export async function searchTickets(params: TicketSearchParams): Promise<TicketSearchResult>;
        export async function exportCsv(params: TicketSearchParams): Promise<void>;
      verify: "grep -n 'export.*searchTickets\|export.*exportCsv' frontend/src/lib/api/search.ts && echo CONTRACT_OK"
    - artifact: "frontend/src/lib/api/geo.ts"
      exports: ["fetchClusters(params: ClusterParams): Promise<GeoCluster[]>"]
      shape: |
        export interface ClusterParams { bbox?: string; zoom?: number; status?: string; categoryId?: number[]; departmentId?: number[]; }
        export interface GeoCluster { lat: number; lng: number; count: number; zoom: number; }
        export async function fetchClusters(params: ClusterParams): Promise<GeoCluster[]>;
      verify: "grep -n 'export.*fetchClusters' frontend/src/lib/api/geo.ts && echo CONTRACT_OK"
    - artifact: "frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts"
      exports: ["useTicketSearch(): { params, setParam, results, facets, isLoading, error }"]
      shape: |
        export function useTicketSearch(): {
          params: TicketSearchParams;
          setParam: (key: string, value: unknown) => void;
          results: TicketListItem[];
          facets: SearchFacets | null;
          meta: { total: number; page: number; pages: number } | null;
          isLoading: boolean;
          error: string | null;
        }
      verify: "grep -n 'export function useTicketSearch' frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts && echo CONTRACT_OK"
    - artifact: "frontend/src/app/(staff)/map/components/TicketMap.tsx"
      exports: ["TicketMap — default export React component"]
      shape: |
        interface TicketMapProps { initialFilters?: Record<string, unknown>; height?: string; }
        export default function TicketMap(props: TicketMapProps): JSX.Element;
      verify: "grep -n 'export default.*TicketMap\|export default function TicketMap' frontend/src/app/(staff)/map/components/TicketMap.tsx && echo CONTRACT_OK"
---

<objective>
Implement the Wave 3c-1 frontend: faceted search UI (filter sidebar, paginated results with SLA badges, sort controls, CSV export) and geo-clustered map view (Leaflet.js integration, zoom-responsive cluster drill-down, individual ticket pins with popups, bounding-box-driven cluster refetch).

Purpose: This is the search-and-map surface that staff (Dana) and managers (Marcus) use to find tickets spatially and by filter. It directly consumes the Wave 2c backend services: SearchController (GET /api/tickets) and GeoController (GET /api/tickets/clusters) implemented in plans 07/08.

Output:
- `/tickets` page with collapsible FilterPanel + TicketResultsList + URL-serialized filter state
- `useTicketSearch` hook managing filter ↔ URL sync and Solr-backed data fetching
- API client wrappers: `searchTickets()`, `exportCsv()`, `fetchClusters()`
- `/map` page with Leaflet `TicketMap`, `ClusterLayer` (Solr geo-clusters), `TicketPinLayer` (individual pins at high zoom)
- Playwright e2e tests for both pages
</objective>

<feature_dependencies>
Implements: F4: Full-Text Search & Filtering (FilterPanel, TicketResultsList, useTicketSearch, search API client, CSV export, URL-serialized filter state, SLA urgency badges), F5: Geospatial Features (TicketMap, ClusterLayer, TicketPinLayer, fetchClusters, bbox filter, zoom drill-down), F15: SPA Frontend (search and map routes within the Next.js SPA shell)
Depends on: F16: JSON API Backend (GET /api/tickets and GET /api/tickets/clusters from Wave 2c plans 07/08), F11: Authentication (useAuth hook from Wave 3a — route guard already present), F10: RBAC (CSV export button hidden for public role, checked via caller role from session)
Enables: F4: Solr regression tests in Wave 4 require these UI flows, F5: geo-cluster integration tests in Wave 4 validate this map component
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/UX-Mockup-uReport.md
@project_specs/UserStories-uReport.md

# Wave 2c contracts consumed:
# - GET /api/tickets: q, status, substatusId, categoryId[], departmentId[], assigneeId,
#   reporterEmail, dateFrom, dateTo, bbox, lat, lng, radius, sort, page, perPage, export=csv
# - Response: { data: Ticket[], meta: { total, page, perPage, pages, facets: { status, category, department } } }
# - GET /api/tickets/clusters: bbox, zoom, status, categoryId[], departmentId[]
# - Response: { data: [{ lat, lng, count, zoom }][] }
# - CSV: GET /api/tickets?export=csv → text/csv download, 413 if > 5000 rows
# - 503 SEARCH_UNAVAILABLE if Solr is down

# UX specs (from UX-Mockup Screen 02 / Flow 03):
# - Filter panel: left sidebar on desktop (collapsible), bottom sheet on mobile
# - Ticket list: SLA badges (sla-breach=red, sla-warning=amber, sla-ok=green, none=no badge)
# - SLA warning = closes within 24 hours; breach = past expected close date
# - Sort bar: date_desc (default), date_asc, sla_asc, assignee, category
# - Facet counts shown below filters after results load
# - Solr unavailable: banner "Search temporarily unavailable. Showing all tickets." (not crash)
# - Map view at /map (Screen 10); same filters applied from /tickets toggle
# - Clusters: geo-clustered markers; clicking cluster zooms in; at high zoom with <10 per cell → individual pins
# - Individual pin popup: ticket ID, title, status badge, "View ticket →" link to /tickets/:id

# Design system:
# - Component library: Radix UI / shadcn/ui (already installed in Wave 3a)
# - Semantic color tokens: status-open=blue, status-closed=gray, sla-ok=green, sla-warning=amber, sla-breach=red
# - Breakpoints: sm=375px, md=768px, lg=1024px, xl=1280px
# - 8px base grid
# - Leaflet.js for map (install leaflet + @types/leaflet if not already in package.json)

# Prior wave context:
# - Next.js 15 SPA shell, TypeScript strict mode — from Wave 3a (plans 09/10)
# - Shared layout with top nav already in place from Wave 3a
# - useAuth() hook provides { user, role } from Wave 3a session
# - API base URL: process.env.NEXT_PUBLIC_API_URL or relative /api
</context>

<tasks>

<task type="auto">
  <name>Task 1: Search API client, types, useTicketSearch hook, and /tickets page with FilterPanel + TicketResultsList</name>
  <files>
    frontend/src/types/search.ts
    frontend/src/lib/api/search.ts
    frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts
    frontend/src/app/(staff)/tickets/components/FilterPanel.tsx
    frontend/src/app/(staff)/tickets/components/SortBar.tsx
    frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx
    frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx
    frontend/src/app/(staff)/tickets/page.tsx
    frontend/e2e/search-filter.spec.ts
  </files>
  <action>
**Step 1: Create frontend/src/types/search.ts**

TypeScript types for the search domain. All shapes mirror the Wave 2c SearchController response contract exactly.

```typescript
// frontend/src/types/search.ts

export type SlaStatus = 'breach' | 'warning' | 'ok' | 'none';

export interface TicketListItem {
  id: number;
  title: string;
  status: 'open' | 'closed';
  substatusId: number | null;
  categoryId: number;
  departmentId: number;
  assigneeId: number | null;
  reporterName: string | null;
  reporterEmail: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  datetimeOpened: string;
  datetimeClosed: string | null;
  datetimeUpdated: string | null;
  mergedIntoTicketId: number | null;
}

export interface SearchFacets {
  status: Record<string, number>;
  category: Record<string, number>;
  department: Record<string, number>;
}

export interface TicketSearchMeta {
  total: number;
  page: number;
  perPage: number;
  pages: number;
  facets: SearchFacets;
}

export interface TicketSearchResult {
  data: TicketListItem[];
  meta: TicketSearchMeta;
  errors: Array<{ field: string | null; message: string; code: string }>;
}

export interface TicketSearchParams {
  q?: string;
  status?: string;
  substatusId?: number;
  categoryId?: number[];
  departmentId?: number[];
  assigneeId?: number;
  reporterEmail?: string;
  dateFrom?: string;
  dateTo?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  bbox?: string;
  sort?: 'date_desc' | 'date_asc' | 'sla_asc' | 'assignee' | 'category';
  page?: number;
  perPage?: number;
}
```

**Step 2: Create frontend/src/lib/api/search.ts**

Type-safe wrappers over GET /api/tickets. Uses the existing API base URL pattern from Wave 3a.

```typescript
// frontend/src/lib/api/search.ts
import type { TicketSearchParams, TicketSearchResult } from '@/types/search';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function buildQuery(params: TicketSearchParams & { export?: string }): string {
  const qs = new URLSearchParams();
  if (params.q)             qs.set('q', params.q);
  if (params.status)        qs.set('status', params.status);
  if (params.substatusId)   qs.set('substatusId', String(params.substatusId));
  if (params.assigneeId)    qs.set('assigneeId', String(params.assigneeId));
  if (params.reporterEmail) qs.set('reporterEmail', params.reporterEmail);
  if (params.dateFrom)      qs.set('dateFrom', params.dateFrom);
  if (params.dateTo)        qs.set('dateTo', params.dateTo);
  if (params.lat)           qs.set('lat', String(params.lat));
  if (params.lng)           qs.set('lng', String(params.lng));
  if (params.radius)        qs.set('radius', String(params.radius));
  if (params.bbox)          qs.set('bbox', params.bbox);
  if (params.sort)          qs.set('sort', params.sort);
  if (params.page)          qs.set('page', String(params.page));
  if (params.perPage)       qs.set('perPage', String(params.perPage));
  if (params.export)        qs.set('export', params.export);
  // Arrays
  params.categoryId?.forEach((id) => qs.append('categoryId[]', String(id)));
  params.departmentId?.forEach((id) => qs.append('departmentId[]', String(id)));
  return qs.toString();
}

export async function searchTickets(
  params: TicketSearchParams,
  signal?: AbortSignal,
): Promise<TicketSearchResult> {
  const qs = buildQuery(params);
  const res = await fetch(`${API_BASE}/api/tickets${qs ? '?' + qs : ''}`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Surface 503 as a recognizable error so UI can show the Solr unavailable banner
    if (res.status === 503) {
      throw Object.assign(new Error('SEARCH_UNAVAILABLE'), { status: 503 });
    }
    throw new Error(body?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<TicketSearchResult>;
}

/**
 * Triggers a CSV file download for the current filtered result set.
 * Uses an anchor click so the browser handles Content-Disposition: attachment.
 */
export async function exportCsv(params: TicketSearchParams): Promise<void> {
  const qs = buildQuery({ ...params, export: 'csv' });
  // Let the browser handle download directly — do not fetch into memory
  const url = `${API_BASE}/api/tickets?${qs}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tickets.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

**Step 3: Create frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts**

URL-sync hook: reads URLSearchParams from Next.js `useSearchParams()`, builds `TicketSearchParams`, debounces the Solr call (300ms), and syncs filter changes back to the URL via `router.replace()`.

```typescript
// frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { searchTickets } from '@/lib/api/search';
import type { TicketListItem, TicketSearchMeta, TicketSearchParams, SearchFacets } from '@/types/search';

function paramsFromUrl(sp: URLSearchParams): TicketSearchParams {
  const arr = (key: string) => sp.getAll(key).map(Number).filter(Boolean);
  return {
    q:             sp.get('q') ?? undefined,
    status:        sp.get('status') ?? undefined,
    substatusId:   sp.has('substatusId') ? Number(sp.get('substatusId')) : undefined,
    categoryId:    arr('categoryId').length ? arr('categoryId') : undefined,
    departmentId:  arr('departmentId').length ? arr('departmentId') : undefined,
    assigneeId:    sp.has('assigneeId') ? Number(sp.get('assigneeId')) : undefined,
    reporterEmail: sp.get('reporterEmail') ?? undefined,
    dateFrom:      sp.get('dateFrom') ?? undefined,
    dateTo:        sp.get('dateTo') ?? undefined,
    sort:          (sp.get('sort') as TicketSearchParams['sort']) ?? 'date_desc',
    page:          sp.has('page') ? Number(sp.get('page')) : 1,
    perPage:       sp.has('perPage') ? Number(sp.get('perPage')) : 25,
  };
}

export function useTicketSearch() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [results,   setResults]   = useState<TicketListItem[]>([]);
  const [meta,      setMeta]      = useState<TicketSearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [isSearchUnavailable, setIsSearchUnavailable] = useState(false);

  const params = paramsFromUrl(searchParams);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (updates: Partial<TicketSearchParams>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        next.delete(key);
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          (value as number[]).forEach((v) => next.append(key, String(v)));
        } else {
          next.set(key, String(value));
        }
      });
      // Reset page when any filter changes
      if (!('page' in updates)) next.set('page', '1');
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setIsSearchUnavailable(false);

      searchTickets(params, abortRef.current.signal)
        .then((res) => {
          setResults(res.data);
          setMeta(res.meta);
        })
        .catch((err: Error & { status?: number }) => {
          if (err.name === 'AbortError') return;
          if (err.status === 503) {
            setIsSearchUnavailable(true);
            setResults([]);
          } else {
            setError(err.message);
          }
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Depend on the serialized URL params — avoids stale closure issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return {
    params,
    setParam,
    results,
    facets: meta?.facets ?? null,
    meta,
    isLoading,
    error,
    isSearchUnavailable,
  };
}
```

**Step 4: Create frontend/src/app/(staff)/tickets/components/FilterPanel.tsx**

Collapsible left sidebar on desktop (≥lg), bottom sheet on mobile. Uses shadcn/ui Sheet for mobile and a plain `<aside>` on desktop. All filter controls call `setParam` from the parent.

```tsx
// frontend/src/app/(staff)/tickets/components/FilterPanel.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TicketSearchParams } from '@/types/search';

interface FilterPanelProps {
  params: TicketSearchParams;
  facets: { status: Record<string, number>; category: Record<string, number>; department: Record<string, number> } | null;
  onParamChange: (updates: Partial<TicketSearchParams>) => void;
}

export function FilterPanel({ params, facets, onParamChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      aria-label="Ticket filters"
      className={`
        bg-white border border-gray-200 rounded-lg p-4 space-y-5
        lg:block lg:w-64 lg:shrink-0
        ${isOpen ? 'block' : 'hidden lg:block'}
      `}
    >
      {/* Status */}
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</Label>
        <div className="mt-2 flex flex-col gap-1">
          {(['', 'open', 'closed'] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                name="status"
                value={s}
                checked={(params.status ?? '') === s}
                onChange={() => onParamChange({ status: s || undefined })}
                className="accent-blue-600"
              />
              <span className="capitalize">{s === '' ? 'All' : s}</span>
              {facets && s !== '' && (
                <span className="ml-auto text-xs text-gray-400">
                  ({facets.status[s] ?? 0})
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Category multi-select (simple) */}
      <div>
        <Label htmlFor="filter-category" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Category ID
        </Label>
        <Input
          id="filter-category"
          type="number"
          placeholder="e.g. 3"
          value={params.categoryId?.[0] ?? ''}
          onChange={(e) =>
            onParamChange({ categoryId: e.target.value ? [Number(e.target.value)] : undefined })
          }
          className="mt-1 h-8 text-sm"
        />
        {facets && Object.keys(facets.category).length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            Top: {Object.entries(facets.category).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ')}
          </p>
        )}
      </div>

      {/* Department */}
      <div>
        <Label htmlFor="filter-dept" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Department ID
        </Label>
        <Input
          id="filter-dept"
          type="number"
          placeholder="e.g. 1"
          value={params.departmentId?.[0] ?? ''}
          onChange={(e) =>
            onParamChange({ departmentId: e.target.value ? [Number(e.target.value)] : undefined })
          }
          className="mt-1 h-8 text-sm"
        />
      </div>

      {/* Date range */}
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Range</Label>
        <div className="mt-1 space-y-1">
          <Input
            type="date"
            aria-label="From date"
            value={params.dateFrom ?? ''}
            onChange={(e) => onParamChange({ dateFrom: e.target.value || undefined })}
            className="h-8 text-sm"
          />
          <Input
            type="date"
            aria-label="To date"
            value={params.dateTo ?? ''}
            onChange={(e) => onParamChange({ dateTo: e.target.value || undefined })}
            className="h-8 text-sm"
          />
          {params.dateFrom && params.dateTo && params.dateFrom > params.dateTo && (
            <p role="alert" className="text-xs text-red-600">Start date must be before end date</p>
          )}
        </div>
      </div>

      {/* Reporter email */}
      <div>
        <Label htmlFor="filter-email" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Reporter Email
        </Label>
        <Input
          id="filter-email"
          type="email"
          placeholder="reporter@example.com"
          value={params.reporterEmail ?? ''}
          onChange={(e) => onParamChange({ reporterEmail: e.target.value || undefined })}
          className="mt-1 h-8 text-sm"
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          onParamChange({
            q: undefined, status: undefined, categoryId: undefined,
            departmentId: undefined, dateFrom: undefined, dateTo: undefined,
            reporterEmail: undefined, substatusId: undefined, assigneeId: undefined,
          })
        }
      >
        Clear All
      </Button>
    </aside>
  );
}
```

**Step 5: Create frontend/src/app/(staff)/tickets/components/SortBar.tsx**

```tsx
// frontend/src/app/(staff)/tickets/components/SortBar.tsx
'use client';

import type { TicketSearchParams } from '@/types/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortBarProps {
  sort: TicketSearchParams['sort'];
  total: number;
  onSortChange: (sort: TicketSearchParams['sort']) => void;
}

const SORT_OPTIONS: { value: NonNullable<TicketSearchParams['sort']>; label: string }[] = [
  { value: 'date_desc', label: 'Date (newest first)' },
  { value: 'date_asc',  label: 'Date (oldest first)' },
  { value: 'sla_asc',   label: 'SLA Urgency' },
  { value: 'assignee',  label: 'Assignee' },
  { value: 'category',  label: 'Category' },
];

export function SortBar({ sort, total, onSortChange }: SortBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-gray-600">
        {total.toLocaleString()} result{total !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Sort:</span>
        <Select
          value={sort ?? 'date_desc'}
          onValueChange={(v) => onSortChange(v as TicketSearchParams['sort'])}
        >
          <SelectTrigger className="h-8 text-sm w-48" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

**Step 6: Create frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx**

Renders paginated ticket rows with SLA badges. SLA computation is client-side:
- `breach`: `status === 'open'` and now > expectedCloseDate (derived from datetimeOpened if we have slaDays — but we don't in the list payload). Instead, rely on a `slaStatus` field if the API returns it. For MVP, treat any ticket open > 7 days as `warning` and > 14 days as `breach` if no explicit SLA data is available (matching legacy heuristic). The proper SLA field can be added when category data is joined on the API side.
- Actually: per UX spec, show the badge only when Ticket has an `slaStatus` field. For now, accept `slaStatus?: SlaStatus` as optional on TicketListItem and gracefully omit the badge if not present.

```tsx
// frontend/src/app/(staff)/tickets/components/TicketResultsList.tsx
'use client';

import Link from 'next/link';
import type { TicketListItem, SlaStatus } from '@/types/search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TicketResultsListProps {
  tickets: TicketListItem[];
  isLoading: boolean;
  meta: { total: number; page: number; pages: number } | null;
  onPageChange: (page: number) => void;
}

const SLA_BADGE_CONFIG: Record<SlaStatus, { label: string; className: string }> = {
  breach:  { label: '🔴 SLA Breach',   className: 'bg-red-100 text-red-700 border-red-200' },
  warning: { label: '🟡 Due Today',    className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ok:      { label: '🟢 On Track',     className: 'bg-green-100 text-green-700 border-green-200' },
  none:    { label: '',                className: '' },
};

function SlaBadge({ status }: { status?: SlaStatus }) {
  if (!status || status === 'none') return null;
  const cfg = SLA_BADGE_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.className}`}
      aria-label={`SLA status: ${status}`}
    >
      {cfg.label}
    </span>
  );
}

function TicketRow({ ticket }: { ticket: TicketListItem & { slaStatus?: SlaStatus } }) {
  const openedDate = new Date(ticket.datetimeOpened).toLocaleDateString();

  return (
    <li className="border-b last:border-b-0 py-3 px-1 hover:bg-gray-50 transition-colors">
      <Link
        href={`/tickets/${ticket.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        aria-label={`Ticket #${ticket.id}: ${ticket.title}`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-label={`Select ticket ${ticket.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 accent-blue-600 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm text-gray-900 truncate max-w-xs">
                #{ticket.id} {ticket.title}
              </span>
              <SlaBadge status={(ticket as TicketListItem & { slaStatus?: SlaStatus }).slaStatus} />
              <Badge
                variant="outline"
                className={ticket.status === 'open' ? 'text-blue-700 border-blue-200' : 'text-gray-500 border-gray-200'}
              >
                {ticket.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              {ticket.address && <span className="truncate max-w-xs">{ticket.address}</span>}
              <span>Dept {ticket.departmentId}</span>
              {ticket.assigneeId && <span>Assignee #{ticket.assigneeId}</span>}
              <span>{openedDate}</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function TicketResultsList({ tickets, isLoading, meta, onPageChange }: TicketResultsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading tickets">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400" role="status">
        <p className="text-sm">No tickets match your filters.</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} />
        ))}
      </ul>

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Page {meta.page} of {meta.pages} ({meta.total.toLocaleString()} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="Previous page"
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.pages}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="Next page"
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 7: Create frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx** (Jest unit test — NOT Playwright)

```tsx
// frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx
import { render, screen } from '@testing-library/react';
import { TicketResultsList } from './TicketResultsList';

const mockTickets = [
  {
    id: 101,
    title: 'Pothole on Oak Ave',
    status: 'open' as const,
    substatusId: null,
    categoryId: 3,
    departmentId: 1,
    assigneeId: 5,
    reporterName: 'Priya Nair',
    reporterEmail: 'priya@example.com',
    address: 'Oak Ave @ Main St',
    lat: 40.7128,
    lng: -74.006,
    datetimeOpened: '2026-06-01T10:00:00Z',
    datetimeClosed: null,
    datetimeUpdated: null,
    mergedIntoTicketId: null,
    slaStatus: 'breach' as const,
  },
];

describe('TicketResultsList', () => {
  it('renders ticket rows with id and title', () => {
    render(
      <TicketResultsList
        tickets={mockTickets}
        isLoading={false}
        meta={{ total: 1, page: 1, pages: 1 }}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByText(/#101 Pothole on Oak Ave/)).toBeInTheDocument();
  });

  it('shows SLA breach badge when slaStatus=breach', () => {
    render(
      <TicketResultsList
        tickets={mockTickets}
        isLoading={false}
        meta={{ total: 1, page: 1, pages: 1 }}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/SLA status: breach/i)).toBeInTheDocument();
  });

  it('renders skeleton when isLoading=true', () => {
    render(
      <TicketResultsList
        tickets={[]}
        isLoading={true}
        meta={null}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/loading tickets/i)).toBeInTheDocument();
  });

  it('shows empty state when no tickets', () => {
    render(
      <TicketResultsList
        tickets={[]}
        isLoading={false}
        meta={{ total: 0, page: 1, pages: 0 }}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/no tickets match/i);
  });
});
```

**Step 8: Create frontend/src/app/(staff)/tickets/page.tsx**

Main search page composing the hook + all sub-components. Includes keyword search bar, view toggle (list/map), CSV export button (staff/admin only), and the Solr unavailable banner.

```tsx
// frontend/src/app/(staff)/tickets/page.tsx
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { exportCsv } from '@/lib/api/search';
import { FilterPanel } from './components/FilterPanel';
import { SortBar } from './components/SortBar';
import { TicketResultsList } from './components/TicketResultsList';
import { useTicketSearch } from './hooks/useTicketSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

function TicketsPageContent() {
  const { user } = useAuth();
  const router   = useRouter();
  const {
    params, setParam, results, facets, meta,
    isLoading, error, isSearchUnavailable,
  } = useTicketSearch();

  const canExport = user?.role === 'staff' || user?.role === 'admin';

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-6">

        {/* Search bar + actions row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            type="search"
            placeholder="Search tickets…"
            value={params.q ?? ''}
            onChange={(e) => setParam({ q: e.target.value || undefined })}
            className="flex-1 min-w-48 h-9"
            aria-label="Search tickets"
          />
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(params)}
              aria-label="Export CSV"
            >
              Export CSV
            </Button>
          )}
          <Link href={`/map?${new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          ).toString()}`}>
            <Button variant="outline" size="sm" aria-label="Switch to map view">
              🗺 Map View
            </Button>
          </Link>
          <Link href="/tickets/new">
            <Button size="sm">+ New Ticket</Button>
          </Link>
        </div>

        {/* Solr unavailable banner */}
        {isSearchUnavailable && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertDescription>
              Search temporarily unavailable. Showing all tickets.
            </AlertDescription>
          </Alert>
        )}

        {/* Generic error banner */}
        {error && !isSearchUnavailable && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-6 items-start">
          {/* Filter sidebar */}
          <FilterPanel
            params={params}
            facets={facets}
            onParamChange={setParam}
          />

          {/* Results area */}
          <div className="flex-1 min-w-0">
            <SortBar
              sort={params.sort}
              total={meta?.total ?? 0}
              onSortChange={(s) => setParam({ sort: s })}
            />
            <TicketResultsList
              tickets={results}
              isLoading={isLoading}
              meta={meta}
              onPageChange={(page) => setParam({ page })}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
      <TicketsPageContent />
    </Suspense>
  );
}
```

**Step 9: Create frontend/e2e/search-filter.spec.ts** (Playwright)

```typescript
// frontend/e2e/search-filter.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search & Filter UI', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes test user is logged in (Wave 3a auth fixtures should set cookie)
    await page.goto('/tickets');
  });

  test('search bar is visible and accepts input', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: /search tickets/i });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('pothole');
    // URL should update with q=pothole
    await expect(page).toHaveURL(/q=pothole/);
  });

  test('filter panel renders status radio buttons', async ({ page }) => {
    await expect(page.getByRole('radio', { name: /^open$/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^closed$/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^all$/i })).toBeVisible();
  });

  test('selecting Open status updates URL and shows results', async ({ page }) => {
    await page.getByRole('radio', { name: /^open$/i }).click();
    await expect(page).toHaveURL(/status=open/);
    // Results list or empty state should appear (not crash)
    await expect(page.getByRole('list').or(page.getByRole('status'))).toBeVisible({ timeout: 5000 });
  });

  test('Export CSV button visible for staff role', async ({ page }) => {
    // Assumes test session has staff role
    const exportBtn = page.getByRole('button', { name: /export csv/i });
    await expect(exportBtn).toBeVisible();
  });

  test('Map View button navigates to /map', async ({ page }) => {
    await page.getByRole('link', { name: /map view/i }).click();
    await expect(page).toHaveURL(/\/map/);
  });

  test('Solr unavailable shows banner not crash', async ({ page }) => {
    // Mock the API to return 503
    await page.route('**/api/tickets*', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, meta: {}, errors: [{ field: null, code: 'SEARCH_UNAVAILABLE', message: 'Solr unavailable' }] }),
      }),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(/search temporarily unavailable/i);
  });

  test('Clear All resets filters and URL', async ({ page }) => {
    await page.getByRole('radio', { name: /^open$/i }).click();
    await expect(page).toHaveURL(/status=open/);
    await page.getByRole('button', { name: /clear all/i }).click();
    await expect(page).not.toHaveURL(/status=open/);
  });
});
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend

# Type-check
npx tsc --noEmit 2>&1 | tail -20 && echo "TS_OK"

# Jest unit tests
npx jest src/app/\\(staff\\)/tickets/components/TicketResultsList.test.tsx --no-coverage 2>&1 | tail -20 && echo "JEST_PASSED"

# File existence checks
ls src/types/search.ts \
   src/lib/api/search.ts \
   src/app/\(staff\)/tickets/hooks/useTicketSearch.ts \
   src/app/\(staff\)/tickets/components/FilterPanel.tsx \
   src/app/\(staff\)/tickets/components/SortBar.tsx \
   src/app/\(staff\)/tickets/components/TicketResultsList.tsx \
   src/app/\(staff\)/tickets/page.tsx \
   e2e/search-filter.spec.ts && echo "FILES_OK"

# Integration contracts present
grep -n 'export.*searchTickets\|export.*exportCsv' src/lib/api/search.ts && echo "API_EXPORTS_OK"
grep -n 'export function useTicketSearch' src/app/\(staff\)/tickets/hooks/useTicketSearch.ts && echo "HOOK_OK"

# Playwright search-filter e2e
npx playwright test e2e/search-filter.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `frontend/src/types/search.ts` exports: TicketSearchParams, TicketListItem, TicketSearchResult, SearchFacets, TicketSearchMeta, SlaStatus
- `frontend/src/lib/api/search.ts` exports: `searchTickets()` (fetches GET /api/tickets, throws `{ status: 503 }` on Solr unavailable), `exportCsv()` (triggers browser download via anchor click)
- `frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts` exports: `useTicketSearch()` — syncs filter state ↔ URL with 300ms debounce, handles 503 gracefully
- `FilterPanel.tsx` renders status radios, categoryId/departmentId inputs, date range pickers with validation, reporter email field, Clear All button
- `SortBar.tsx` renders sort Select with 5 options (date_desc default)
- `TicketResultsList.tsx` renders ticket rows with SLA badges, pagination prev/next, loading skeleton, empty state
- `TicketResultsList.test.tsx`: 4 Jest tests pass — renders rows, SLA badge, loading state, empty state
- `/tickets/page.tsx` composes all components; includes Solr unavailable Alert banner; Export CSV hidden for non-staff roles; Map View link navigates to /map
- `e2e/search-filter.spec.ts`: all Playwright tests pass — search input, status filter, CSV button visibility, map view nav, Solr 503 banner, Clear All
  </done>
</task>

<task type="auto">
  <name>Task 2: Geo API client, types, useClusterData hook, and /map page with TicketMap + ClusterLayer + TicketPinLayer</name>
  <files>
    frontend/src/types/geo.ts
    frontend/src/lib/api/geo.ts
    frontend/src/app/(staff)/map/hooks/useClusterData.ts
    frontend/src/app/(staff)/map/components/ClusterLayer.tsx
    frontend/src/app/(staff)/map/components/TicketPinLayer.tsx
    frontend/src/app/(staff)/map/components/TicketMap.tsx
    frontend/src/app/(staff)/map/page.tsx
    frontend/e2e/map-view.spec.ts
  </files>
  <action>
**Step 1: Install Leaflet if not already present**

Check `frontend/package.json`. If `leaflet` and `@types/leaflet` are missing, add them:
```bash
cd frontend
npm install leaflet react-leaflet @types/leaflet --save
```
Also install `react-leaflet` (Leaflet React bindings).

**Step 2: Create frontend/src/types/geo.ts**

```typescript
// frontend/src/types/geo.ts

export interface GeoCluster {
  lat: number;
  lng: number;
  count: number;
  zoom: number;
}

export interface TicketPin {
  id: number;
  title: string;
  status: 'open' | 'closed';
  lat: number;
  lng: number;
}

export interface ClusterParams {
  bbox?: string;
  zoom?: number;
  status?: string;
  categoryId?: number[];
  departmentId?: number[];
}
```

**Step 3: Create frontend/src/lib/api/geo.ts**

```typescript
// frontend/src/lib/api/geo.ts
import type { GeoCluster, ClusterParams } from '@/types/geo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function fetchClusters(
  params: ClusterParams,
  signal?: AbortSignal,
): Promise<GeoCluster[]> {
  const qs = new URLSearchParams();
  if (params.bbox)   qs.set('bbox', params.bbox);
  if (params.zoom)   qs.set('zoom', String(params.zoom));
  if (params.status) qs.set('status', params.status);
  params.categoryId?.forEach((id) => qs.append('categoryId[]', String(id)));
  params.departmentId?.forEach((id) => qs.append('departmentId[]', String(id)));

  const res = await fetch(
    `${API_BASE}/api/tickets/clusters${qs.toString() ? '?' + qs.toString() : ''}`,
    { credentials: 'include', signal },
  );
  if (!res.ok) throw new Error(`Cluster fetch failed: HTTP ${res.status}`);
  const body = await res.json();
  return body.data as GeoCluster[];
}

/**
 * Fetch individual ticket pins at high zoom (when cluster count < 10).
 * Reuses the search endpoint with a tight bbox filter.
 */
export async function fetchTicketPins(
  bbox: string,
  signal?: AbortSignal,
): Promise<Array<{ id: number; title: string; status: 'open' | 'closed'; lat: number; lng: number }>> {
  const res = await fetch(
    `${API_BASE}/api/tickets?bbox=${encodeURIComponent(bbox)}&perPage=50&status=open`,
    { credentials: 'include', signal },
  );
  if (!res.ok) return [];
  const body = await res.json();
  return (body.data ?? [])
    .filter((t: { lat: number | null; lng: number | null }) => t.lat !== null && t.lng !== null)
    .map((t: { id: number; title: string; status: 'open' | 'closed'; lat: number; lng: number }) => ({
      id: t.id, title: t.title, status: t.status, lat: t.lat, lng: t.lng,
    }));
}
```

**Step 4: Create frontend/src/app/(staff)/map/hooks/useClusterData.ts**

Manages bbox and zoom state; refetches on Leaflet `moveend` events passed from TicketMap.

```typescript
// frontend/src/app/(staff)/map/hooks/useClusterData.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClusters, fetchTicketPins } from '@/lib/api/geo';
import type { GeoCluster, ClusterParams, TicketPin } from '@/types/geo';

const DRILL_DOWN_THRESHOLD = 10; // switch to individual pins when max cluster count < this

export function useClusterData(baseFilters: Omit<ClusterParams, 'bbox' | 'zoom'>) {
  const [clusters,  setClusters]  = useState<GeoCluster[]>([]);
  const [pins,      setPins]      = useState<TicketPin[]>([]);
  const [showPins,  setShowPins]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(
    (bbox: string, zoom: number) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      const params: ClusterParams = { bbox, zoom, ...baseFilters };

      fetchClusters(params, abortRef.current.signal)
        .then(async (newClusters) => {
          // Determine if all clusters are small enough to drill down to pins
          const maxCount = newClusters.reduce((m, c) => Math.max(m, c.count), 0);
          if (zoom >= 14 && maxCount < DRILL_DOWN_THRESHOLD) {
            // Fetch individual pins instead
            const newPins = await fetchTicketPins(bbox, abortRef.current?.signal);
            setPins(newPins);
            setClusters([]);
            setShowPins(true);
          } else {
            setClusters(newClusters);
            setPins([]);
            setShowPins(false);
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          setError(err.message);
        })
        .finally(() => setIsLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(baseFilters)],
  );

  return { clusters, pins, showPins, isLoading, error, refetch };
}
```

**Step 5: Create frontend/src/app/(staff)/map/components/ClusterLayer.tsx**

Renders geo-cluster circles on the Leaflet map. Each circle's radius is proportional to `count`. Clicking a cluster marker zooms the map in 2 levels to drill down.

```tsx
// frontend/src/app/(staff)/map/components/ClusterLayer.tsx
'use client';

import { useMap, CircleMarker, Tooltip } from 'react-leaflet';
import type { GeoCluster } from '@/types/geo';

interface ClusterLayerProps {
  clusters: GeoCluster[];
}

function clusterRadius(count: number): number {
  // min 14px, max 50px, log-scale
  return Math.min(50, Math.max(14, Math.round(14 + Math.log2(count + 1) * 5)));
}

export function ClusterLayer({ clusters }: ClusterLayerProps) {
  const map = useMap();

  return (
    <>
      {clusters.map((cluster, i) => (
        <CircleMarker
          key={`cluster-${i}-${cluster.lat}-${cluster.lng}`}
          center={[cluster.lat, cluster.lng]}
          radius={clusterRadius(cluster.count)}
          pathOptions={{
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
            color: '#1d4ed8',
            weight: 1,
          }}
          eventHandlers={{
            click: () => {
              // Drill down: zoom in 2 levels centered on cluster
              map.setView([cluster.lat, cluster.lng], Math.min(20, map.getZoom() + 2));
            },
          }}
          aria-label={`Cluster of ${cluster.count} tickets`}
        >
          <Tooltip permanent direction="center" className="cluster-count-label">
            {cluster.count}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
```

**Step 6: Create frontend/src/app/(staff)/map/components/TicketPinLayer.tsx**

Renders individual ticket pins at high zoom levels. Each pin has a popup with ticket ID, title, status badge, and a link to /tickets/:id.

```tsx
// frontend/src/app/(staff)/map/components/TicketPinLayer.tsx
'use client';

import { Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import type { TicketPin } from '@/types/geo';

interface TicketPinLayerProps {
  pins: TicketPin[];
}

export function TicketPinLayer({ pins }: TicketPinLayerProps) {
  return (
    <>
      {pins.map((pin) => (
        <Marker
          key={`pin-${pin.id}`}
          position={[pin.lat, pin.lng]}
          title={`Ticket #${pin.id}: ${pin.title}`}
        >
          <Popup>
            <div className="min-w-40 text-sm">
              <p className="font-semibold text-gray-900">#{pin.id}</p>
              <p className="text-gray-700 mt-0.5 leading-snug">{pin.title}</p>
              <span
                className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                  pin.status === 'open'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {pin.status}
              </span>
              <div className="mt-2">
                <Link
                  href={`/tickets/${pin.id}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  View ticket →
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
```

**Step 7: Create frontend/src/app/(staff)/map/components/TicketMap.tsx**

Main Leaflet map component. Uses `react-leaflet` MapContainer. Listens to `moveend` / `zoomend` to update bbox and trigger cluster refetch. Propagates filter params from URL search params.

```tsx
// frontend/src/app/(staff)/map/components/TicketMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ClusterLayer } from './ClusterLayer';
import { TicketPinLayer } from './TicketPinLayer';
import { useClusterData } from '../hooks/useClusterData';
import type { ClusterParams } from '@/types/geo';

interface TicketMapProps {
  initialFilters?: Omit<ClusterParams, 'bbox' | 'zoom'>;
  height?: string;
}

function BboxTracker({
  onBoundsChange,
}: {
  onBoundsChange: (bbox: string, zoom: number) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      const bbox = [
        b.getSouth().toFixed(6),
        b.getWest().toFixed(6),
        b.getNorth().toFixed(6),
        b.getEast().toFixed(6),
      ].join(',');
      onBoundsChange(bbox, map.getZoom());
    },
  });

  // Trigger on mount
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      const b = map.getBounds();
      const bbox = [
        b.getSouth().toFixed(6),
        b.getWest().toFixed(6),
        b.getNorth().toFixed(6),
        b.getEast().toFixed(6),
      ].join(',');
      onBoundsChange(bbox, map.getZoom());
    }
  });

  return null;
}

export default function TicketMap({ initialFilters = {}, height = '600px' }: TicketMapProps) {
  const { clusters, pins, showPins, isLoading, error, refetch } = useClusterData(initialFilters);

  return (
    <div className="relative" style={{ height }}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 text-xs text-gray-600 px-3 py-1 rounded-full shadow border">
          Loading map data…
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 text-xs text-red-700 px-3 py-1 rounded-full shadow border border-red-200"
        >
          Map data temporarily unavailable
        </div>
      )}

      <MapContainer
        center={[39.5, -98.35]} // Continental US default center
        zoom={5}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        aria-label="Ticket location map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <BboxTracker onBoundsChange={refetch} />

        {!showPins && <ClusterLayer clusters={clusters} />}
        {showPins && <TicketPinLayer pins={pins} />}
      </MapContainer>
    </div>
  );
}
```

**Step 8: Create frontend/src/app/(staff)/map/page.tsx**

Map page that reads filter params from URL (forwarded from /tickets view toggle) and renders TicketMap. Uses dynamic import to prevent SSR issues with Leaflet (browser-only).

```tsx
// frontend/src/app/(staff)/map/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Dynamic import prevents Leaflet SSR issues — Leaflet uses window/document
const TicketMap = dynamic(() => import('./components/TicketMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm animate-pulse">
      Loading map…
    </div>
  ),
});

function MapPageContent() {
  const searchParams = useSearchParams();

  // Forward relevant filter params from /tickets page to map
  const mapFilters = {
    status:       searchParams.get('status') ?? undefined,
    categoryId:   searchParams.getAll('categoryId').map(Number).filter(Boolean),
    departmentId: searchParams.getAll('departmentId').map(Number).filter(Boolean),
  };

  // Build back-link preserving filters
  const backHref = `/tickets?${searchParams.toString()}`;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Ticket Map</h1>
          <Link href={backHref}>
            <Button variant="outline" size="sm" aria-label="Switch to list view">
              ≡ List View
            </Button>
          </Link>
        </div>

        <TicketMap
          initialFilters={mapFilters}
          height="calc(100vh - 160px)"
        />

        <p className="mt-2 text-xs text-gray-400 text-center">
          Map tiles © OpenStreetMap contributors. Clusters update on pan/zoom.
          At high zoom, individual ticket pins are shown (click for details).
        </p>
      </div>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading map…</div>}>
      <MapPageContent />
    </Suspense>
  );
}
```

**Step 9: Create frontend/e2e/map-view.spec.ts** (Playwright)

```typescript
// frontend/e2e/map-view.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
  });

  test('map container renders with aria-label', async ({ page }) => {
    // Wait for Leaflet to mount (dynamic import — may take a moment)
    const mapEl = page.locator('[aria-label="Ticket location map"]');
    await expect(mapEl).toBeVisible({ timeout: 10000 });
  });

  test('List View button navigates back to /tickets', async ({ page }) => {
    await page.getByRole('link', { name: /list view/i }).click();
    await expect(page).toHaveURL(/\/tickets/);
  });

  test('map loads without crashing when cluster API returns empty array', async ({ page }) => {
    await page.route('**/api/tickets/clusters*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: {}, errors: [] }),
      }),
    );
    await page.reload();
    // Page should still render the map container — not an error page
    await expect(page.locator('[aria-label="Ticket location map"]')).toBeVisible({ timeout: 10000 });
  });

  test('error banner shown when cluster API returns 500', async ({ page }) => {
    await page.route('**/api/tickets/clusters*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, meta: {}, errors: [{ code: 'SERVER_ERROR' }] }),
      }),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(/map data temporarily unavailable/i);
  });

  test('navigating to /map from /tickets preserves filter params', async ({ page }) => {
    await page.goto('/tickets?status=open&departmentId=1');
    await page.getByRole('link', { name: /map view/i }).click();
    await expect(page).toHaveURL(/\/map.*status=open/);
  });
});
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend

# Leaflet installed
grep -n '"leaflet"\|"react-leaflet"' package.json && echo "LEAFLET_DEP_OK"

# File existence
ls src/types/geo.ts \
   src/lib/api/geo.ts \
   src/app/\(staff\)/map/hooks/useClusterData.ts \
   src/app/\(staff\)/map/components/ClusterLayer.tsx \
   src/app/\(staff\)/map/components/TicketPinLayer.tsx \
   src/app/\(staff\)/map/components/TicketMap.tsx \
   src/app/\(staff\)/map/page.tsx \
   e2e/map-view.spec.ts && echo "FILES_OK"

# Integration contract exports
grep -n 'export.*fetchClusters' src/lib/api/geo.ts && echo "GEO_EXPORT_OK"
grep -n 'export default.*TicketMap\|export default function TicketMap' src/app/\(staff\)/map/components/TicketMap.tsx && echo "MAP_DEFAULT_EXPORT_OK"
grep -n 'export function useClusterData' src/app/\(staff\)/map/hooks/useClusterData.ts && echo "HOOK_OK"

# TypeScript check
npx tsc --noEmit 2>&1 | tail -20 && echo "TS_OK"

# Playwright map e2e
npx playwright test e2e/map-view.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `frontend/src/types/geo.ts` exports: GeoCluster, TicketPin, ClusterParams
- `frontend/src/lib/api/geo.ts` exports: `fetchClusters()` (GET /api/tickets/clusters → GeoCluster[]), `fetchTicketPins()` (GET /api/tickets?bbox=…&perPage=50 for individual pins)
- `frontend/src/app/(staff)/map/hooks/useClusterData.ts` exports: `useClusterData()` — refetches on bbox/zoom change; switches from clusters to individual pins when zoom ≥ 14 AND max cluster count < 10
- `ClusterLayer.tsx` renders CircleMarker per cluster with log-scale radius; clicking zooms in 2 levels
- `TicketPinLayer.tsx` renders Marker per pin with Popup containing ticket ID, title, status badge, "View ticket →" link
- `TicketMap.tsx` default export — MapContainer with OpenStreetMap tiles, BboxTracker fires refetch on moveend/mount, dynamically switches between ClusterLayer and TicketPinLayer; shows loading indicator and error banner
- `/map/page.tsx` uses `dynamic(() => import('./components/TicketMap'), { ssr: false })` to prevent Leaflet SSR crash; reads filter params from URL and passes to TicketMap; includes List View back-link
- `e2e/map-view.spec.ts`: all Playwright tests pass — map renders, list view nav, empty cluster graceful, 500 error banner, filter param preservation through view toggle
  </done>
</task>

</tasks>

<verification>
```bash
cd /app/workspaces/pivota/uReport/frontend

# Full TypeScript strict mode check (zero errors)
npx tsc --noEmit 2>&1 | grep -c 'error TS' | xargs -I{} sh -c 'test {} -eq 0 && echo "TS_CLEAN" || echo "TS_ERRORS: {}"'

# Jest unit tests (TicketResultsList)
npx jest src/app/\\(staff\\)/tickets/components/ --no-coverage 2>&1 | tail -5

# Playwright: search + map e2e suites
npx playwright test e2e/search-filter.spec.ts e2e/map-view.spec.ts --reporter=list 2>&1 | tail -30 && echo "ALL_E2E_PASSED"

# Integration contract spot-checks (backend Wave 2c still intact)
grep -n 'class SearchController' /app/workspaces/pivota/uReport/crm/src/Controllers/Api/SearchController.php && echo "BACKEND_OK"
grep -n 'class GeoController' /app/workspaces/pivota/uReport/crm/src/Controllers/Api/GeoController.php && echo "GEO_BACKEND_OK"
```
</verification>

<success_criteria>
1. **F4 Search UI complete:** `/tickets` renders FilterPanel (status/category/dept/date/email), SortBar, TicketResultsList with SLA badges, pagination, and URL-serialized filter state. `useTicketSearch` debounces calls, handles 503 with a banner (not a crash), and syncs all filter changes to URL params.
2. **F4 CSV export:** "Export CSV" button visible for staff/admin roles; triggers browser download via anchor click against `/api/tickets?export=csv`.
3. **F5 Map UI complete:** `/map` renders Leaflet MapContainer with OSM tiles. `useClusterData` re-fetches on pan/zoom via `moveend`. ClusterLayer shows geo-cluster circles; drilling in to zoom ≥ 14 with max count < 10 switches to TicketPinLayer showing individual Markers with Popup (ID, title, status, link).
4. **View toggle:** List View ↔ Map View navigation preserves URL filter params bi-directionally.
5. **TypeScript strict mode:** `npx tsc --noEmit` exits 0 on all new files.
6. **Jest:** `TicketResultsList.test.tsx` — 4 tests pass.
7. **Playwright:** `search-filter.spec.ts` + `map-view.spec.ts` — all tests pass (0 failing, 0 skipped).
8. **Integration contracts provided:** `searchTickets`, `exportCsv`, `fetchClusters`, `useTicketSearch`, `TicketMap` default export all exported as specified in frontmatter.
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/15-SUMMARY.md` with:
- Files created/modified
- Key implementation decisions (e.g., Leaflet dynamic import for SSR safety, 503 handling in useTicketSearch, DRILL_DOWN_THRESHOLD=10)
- Integration contracts fulfilled (from 07-PLAN.md: SearchController, GeoController)
- Playwright test results summary
</output>
