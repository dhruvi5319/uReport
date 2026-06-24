---
phase: implement-the-full-ureport-modernization
plan: "08"
type: execute
wave: 3c
depends_on: [1, 2, 5, 6, 7]
files_modified:
  # Open311 public service list (F2)
  - web/src/pages/Open311ServiceListPage.tsx
  # Media uploader component (F10)
  - web/src/components/media/MediaUploader.tsx
  - web/src/components/media/MediaThumbnail.tsx
  # Bookmarks (F12)
  - web/src/pages/BookmarksPage.tsx
  - web/src/components/layout/Sidebar.tsx
  - web/src/hooks/useBookmarks.ts
  # Contact methods admin (F14)
  - web/src/pages/ContactMethodsPage.tsx
  # Geo map view (F15)
  - web/src/pages/TicketMapPage.tsx
  - web/src/components/map/GeoClusterMap.tsx
  # Scheduler admin trigger UI (F16)
  - web/src/pages/AdminJobsPage.tsx
  # Metrics + Reports dashboard (F17)
  - web/src/pages/MetricsDashboardPage.tsx
  - web/src/pages/ReportsPage.tsx
  - web/src/components/metrics/OnTimeChart.tsx
  - web/src/components/metrics/ReportTable.tsx
  # Issue types admin (F19)
  - web/src/pages/IssueTypesPage.tsx
  # Response templates CRUD + ticket integration (F20)
  - web/src/pages/ResponseTemplatesPage.tsx
  - web/src/components/tickets/ResponseTemplatePicker.tsx
  # API client layer
  - web/src/api/open311.ts
  - web/src/api/media.ts
  - web/src/api/bookmarks.ts
  - web/src/api/contactMethods.ts
  - web/src/api/geo.ts
  - web/src/api/adminJobs.ts
  - web/src/api/metrics.ts
  - web/src/api/issueTypes.ts
  - web/src/api/responseTemplates.ts
  # Router update (add new routes)
  - web/src/App.tsx
autonomous: true

features:
  implements: ["F2", "F10", "F12", "F14", "F15", "F16", "F17", "F19", "F20"]
  depends_on: ["F0", "F1", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20"]
  enables: []

must_haves:
  truths:
    - "Staff can see the Open311 service list (public category names, codes, and attributes) at /open311-services"
    - "Staff can drag-and-drop or click to upload files on a ticket and see thumbnail previews of uploaded images"
    - "Staff can save the current ticket search URL as a named bookmark and navigate to it from the sidebar"
    - "Staff can delete their own bookmarks from the BookmarksPage (non-owner attempt shows 403 error)"
    - "ContactMethodsPage shows the four seeded contact methods (Email, Phone, Web Form, Other)"
    - "TicketMapPage renders geo-clustered tickets on a Leaflet map; switching from list to map view on TicketListPage does not require re-submitting the search"
    - "AdminJobsPage lets staff manually trigger digest-notifications, auto-close, audit, and geo-cluster scheduler jobs with visible success/error feedback"
    - "MetricsDashboardPage shows onTimePercentage for a selected category and date window"
    - "ReportsPage provides UI to run all 10 canned reports (activity, assignments, categories, staff, person, sla, volume, current, opened, closed) and render results in a table"
    - "IssueTypesPage lists all issue types and allows staff to create, update, and delete non-system types"
    - "ResponseTemplatesPage supports full CRUD for response templates and associates them with an action type"
    - "When recording a response action on a ticket detail, a ResponseTemplatePicker dropdown lets staff pick a template to pre-fill the notes field"
    - "All new pages are staff-gated via the usePermission hook from Wave 3a; unauthenticated/public callers are redirected to /login"
    - "Every nav item in App.tsx points to a real route with a real component"
  artifacts:
    - path: "web/src/pages/Open311ServiceListPage.tsx"
      provides: "Displays Open311 /open311/services response as a card/table list"
      exports: ["Open311ServiceListPage"]
    - path: "web/src/components/media/MediaUploader.tsx"
      provides: "Drag-and-drop file upload component integrated with POST /api/v1/tickets/{id}/media"
      exports: ["MediaUploader"]
    - path: "web/src/pages/BookmarksPage.tsx"
      provides: "Lists and manages staff bookmarks via GET/DELETE /api/v1/bookmarks"
      exports: ["BookmarksPage"]
    - path: "web/src/components/layout/Sidebar.tsx"
      provides: "Sidebar listing saved bookmarks as clickable nav items"
      exports: ["Sidebar"]
    - path: "web/src/pages/TicketMapPage.tsx"
      provides: "Leaflet map rendering geo-clustered ticket data from GET /api/v1/tickets?view=map"
      exports: ["TicketMapPage"]
    - path: "web/src/pages/AdminJobsPage.tsx"
      provides: "Manual scheduler trigger buttons wired to POST /api/v1/admin/jobs/{jobName}/run"
      exports: ["AdminJobsPage"]
    - path: "web/src/pages/MetricsDashboardPage.tsx"
      provides: "onTimePercentage display wired to GET /api/v1/metrics"
      exports: ["MetricsDashboardPage"]
    - path: "web/src/pages/ReportsPage.tsx"
      provides: "10 canned reports UI wired to GET /api/v1/reports/{reportType}"
      exports: ["ReportsPage"]
    - path: "web/src/pages/IssueTypesPage.tsx"
      provides: "Issue type CRUD page gated to staff"
      exports: ["IssueTypesPage"]
    - path: "web/src/pages/ResponseTemplatesPage.tsx"
      provides: "Response template CRUD page gated to staff"
      exports: ["ResponseTemplatesPage"]
    - path: "web/src/components/tickets/ResponseTemplatePicker.tsx"
      provides: "Dropdown to pick a response template; pre-fills ticket response notes field"
      exports: ["ResponseTemplatePicker"]
    - path: "web/src/App.tsx"
      provides: "React Router routes for all new pages — every route has a real component"
      exports: ["App"]
  key_links:
    - from: "BookmarksPage"
      to: "POST /api/v1/bookmarks"
      via: "Save current search URL as bookmark; uses window.location.href as requestUri"
      pattern: "api/bookmarks.*createBookmark"
    - from: "Sidebar.tsx"
      to: "BookmarksPage / GET /api/v1/bookmarks"
      via: "useBookmarks hook fetches bookmark list; each bookmark link navigates to stored requestUri"
      pattern: "useBookmarks.*requestUri"
    - from: "MediaUploader.tsx"
      to: "POST /api/v1/tickets/{id}/media"
      via: "FormData file upload via axios; onSuccess refreshes parent ticket media list"
      pattern: "multipart.*tickets.*media"
    - from: "TicketMapPage"
      to: "GET /api/v1/tickets?view=map"
      via: "useTicketSearch hook (from Wave 3a TicketListPage) with view=map query param"
      pattern: "view.*map.*geoclusters\|cluster"
    - from: "ResponseTemplatePicker.tsx"
      to: "GET /api/v1/response-templates?action_id={actionId}"
      via: "Fetches templates for current action type; user selects one to pre-fill notes"
      pattern: "responseTemplates.*action_id"
    - from: "AdminJobsPage"
      to: "POST /api/v1/admin/jobs/{jobName}/run"
      via: "Button click triggers manual job run; displays API response status"
      pattern: "adminJobs.*run"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/init/02-schema.sql"
      exports: ["contactMethods", "issueTypes", "geoclusters", "ticket_geodata", "bookmarks", "responseTemplates", "media"]
      verify: "grep -n 'CREATE TABLE contactMethods' db/init/02-schema.sql && grep -n 'CREATE TABLE issueTypes' db/init/02-schema.sql && grep -n 'CREATE TABLE geoclusters' db/init/02-schema.sql && grep -n 'CREATE TABLE bookmarks' db/init/02-schema.sql && grep -n 'CREATE TABLE responseTemplates' db/init/02-schema.sql && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "api/src/main/java/com/ureport/config/SecurityConfig.java"
      exports: ["SecurityFilterChain", "JWT auth", "staff role gating"]
      verify: "grep -n 'SecurityFilterChain' api/src/main/java/com/ureport/config/SecurityConfig.java && grep -n 'hasRole' api/src/main/java/com/ureport/config/SecurityConfig.java && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "api/src/main/java/com/ureport/service/BookmarkService.java"
      exports: ["BookmarkService", "createBookmark", "listBookmarks", "deleteBookmark"]
      verify: "grep -n 'class BookmarkService' api/src/main/java/com/ureport/service/BookmarkService.java && grep -n 'deleteBookmark' api/src/main/java/com/ureport/service/BookmarkService.java && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "api/src/main/java/com/ureport/service/MediaService.java"
      exports: ["MediaService", "upload", "thumbnail"]
      verify: "grep -n 'class MediaService' api/src/main/java/com/ureport/service/MediaService.java && grep -n 'upload' api/src/main/java/com/ureport/service/MediaService.java && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "api/src/main/java/com/ureport/service/MetricsService.java"
      exports: ["MetricsService", "getOnTimePercentage", "getReport"]
      verify: "grep -n 'class MetricsService' api/src/main/java/com/ureport/service/MetricsService.java && grep -n 'getOnTimePercentage' api/src/main/java/com/ureport/service/MetricsService.java && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "api/src/main/java/com/ureport/service/ResponseTemplateService.java"
      exports: ["ResponseTemplateService", "listTemplates", "createTemplate"]
      verify: "grep -n 'class ResponseTemplateService' api/src/main/java/com/ureport/service/ResponseTemplateService.java && grep -n 'listTemplates' api/src/main/java/com/ureport/service/ResponseTemplateService.java && echo CONTRACT_OK"
    - from_plan: "05"
      artifact: "api/src/main/java/com/ureport/controller/AdminJobController.java"
      exports: ["AdminJobController", "POST /api/v1/admin/jobs/*/run"]
      verify: "grep -n 'class AdminJobController' api/src/main/java/com/ureport/controller/AdminJobController.java && grep -n '@PostMapping' api/src/main/java/com/ureport/controller/AdminJobController.java && echo CONTRACT_OK"
    - from_plan: "06"
      artifact: "web/src/hooks/usePermission.ts"
      exports: ["usePermission hook", "staff role check"]
      verify: "grep -n 'usePermission' web/src/hooks/usePermission.ts && echo CONTRACT_OK"
    - from_plan: "06"
      artifact: "web/src/api/client.ts"
      exports: ["axios instance with JWT interceptor", "apiClient"]
      verify: "grep -n 'apiClient\\|axios' web/src/api/client.ts && echo CONTRACT_OK"
    - from_plan: "07"
      artifact: "web/src/App.tsx"
      exports: ["React Router routes", "usePermission gating pattern"]
      verify: "grep -n 'Route\\|BrowserRouter\\|Routes' web/src/App.tsx && echo CONTRACT_OK"
  provides:
    - artifact: "web/src/pages/Open311ServiceListPage.tsx"
      exports: ["Open311ServiceListPage"]
      shape: |
        Functional React component. Fetches GET /open311/services (no auth required).
        Renders a table/card list with columns: service_code, service_name, description, group.
      verify: "grep -n 'Open311ServiceListPage' web/src/pages/Open311ServiceListPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/components/media/MediaUploader.tsx"
      exports: ["MediaUploader"]
      shape: |
        Props: { ticketId: number; onUploaded: (media: MediaItem) => void }
        Renders a drag-and-drop zone + file input. POST multipart/form-data to
        /api/v1/tickets/{ticketId}/media. Renders thumbnail preview for image types.
      verify: "grep -n 'MediaUploader' web/src/components/media/MediaUploader.tsx && grep -n 'onUploaded\\|ticketId' web/src/components/media/MediaUploader.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/BookmarksPage.tsx"
      exports: ["BookmarksPage"]
      shape: |
        Staff-gated page listing bookmarks with name, type, requestUri.
        Delete button calls DELETE /api/v1/bookmarks/{id}.
        Add-bookmark button saves window.location.search as requestUri.
      verify: "grep -n 'BookmarksPage' web/src/pages/BookmarksPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/components/layout/Sidebar.tsx"
      exports: ["Sidebar"]
      shape: |
        Sidebar renders: navigation links (Tickets, People, Departments, Categories,
        Substatuses, Actions, Clients, Admin Jobs, Metrics, Reports, Response Templates,
        Issue Types, Contact Methods, Open311 Services) + saved bookmarks section.
        Every nav item links to a real route defined in App.tsx.
        NOTE: Do NOT set X-Frame-Options DENY or CSP frame-ancestors in this component
        or any imported module — the app must be embeddable in iframes.
      verify: "grep -n 'Sidebar' web/src/components/layout/Sidebar.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/TicketMapPage.tsx"
      exports: ["TicketMapPage"]
      shape: |
        Staff-gated page. Accepts same filter params as TicketListPage but sends ?view=map.
        Renders a Leaflet map (react-leaflet) with cluster markers from the API response.
        Each cluster marker shows ticket count; click navigates to TicketListPage filtered
        to that cluster area.
      verify: "grep -n 'TicketMapPage' web/src/pages/TicketMapPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/AdminJobsPage.tsx"
      exports: ["AdminJobsPage"]
      shape: |
        Staff-gated page. Four cards, one per scheduler job:
        Digest Notifications, Auto-Close, Audit, Geo-Cluster Rebuild.
        Each card has a "Run Now" button: POST /api/v1/admin/jobs/{jobName}/run.
        Shows success/error toast feedback.
      verify: "grep -n 'AdminJobsPage' web/src/pages/AdminJobsPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/MetricsDashboardPage.tsx"
      exports: ["MetricsDashboardPage"]
      shape: |
        Staff-gated page. Category selector + numDays input + effectiveDate picker.
        On submit: GET /api/v1/metrics?category_id=&numDays=&effectiveDate=
        Renders onTimePercentage as a percentage bar chart (recharts or simple CSS bar).
      verify: "grep -n 'MetricsDashboardPage' web/src/pages/MetricsDashboardPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/ReportsPage.tsx"
      exports: ["ReportsPage"]
      shape: |
        Staff-gated page. Report type selector (dropdown for all 10 types).
        Date range inputs (startDate, endDate). Run Report button: GET /api/v1/reports/{type}.
        Results rendered in a ReportTable component. Valid reportType values:
        activity, assignments, categories, staff, person, sla, volume, current, opened, closed.
      verify: "grep -n 'ReportsPage' web/src/pages/ReportsPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/IssueTypesPage.tsx"
      exports: ["IssueTypesPage"]
      shape: |
        Staff-gated CRUD page for issue types. Lists all issue types.
        Create/edit form: name field. System types (isSystem=true) show a lock icon
        and disable delete button. Calls GET/POST/PUT/DELETE /api/v1/issue-types.
      verify: "grep -n 'IssueTypesPage' web/src/pages/IssueTypesPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/pages/ResponseTemplatesPage.tsx"
      exports: ["ResponseTemplatesPage"]
      shape: |
        Staff-gated CRUD page. Lists all response templates with name, template text, action.
        Create/edit form: name, template (textarea), action_id (select from GET /api/v1/actions).
        Calls GET/POST/PUT/DELETE /api/v1/response-templates.
      verify: "grep -n 'ResponseTemplatesPage' web/src/pages/ResponseTemplatesPage.tsx && echo CONTRACT_OK"
    - artifact: "web/src/components/tickets/ResponseTemplatePicker.tsx"
      exports: ["ResponseTemplatePicker"]
      shape: |
        Props: { actionId: number | null; onSelect: (templateText: string) => void }
        Renders a dropdown populated from GET /api/v1/response-templates?action_id={actionId}.
        On selection: calls onSelect(template.template) to pre-fill notes in parent form.
      verify: "grep -n 'ResponseTemplatePicker' web/src/components/tickets/ResponseTemplatePicker.tsx && grep -n 'onSelect' web/src/components/tickets/ResponseTemplatePicker.tsx && echo CONTRACT_OK"
    - artifact: "web/src/App.tsx"
      exports: ["App", "all routes"]
      shape: |
        All new routes added (building on Wave 3a/3b routes):
          /open311-services       → <Open311ServiceListPage />
          /bookmarks              → <BookmarksPage />
          /map                    → <TicketMapPage />
          /admin/jobs             → <AdminJobsPage />
          /metrics                → <MetricsDashboardPage />
          /reports                → <ReportsPage />
          /issue-types            → <IssueTypesPage />
          /response-templates     → <ResponseTemplatesPage />
          /contact-methods        → <ContactMethodsPage />
        All staff-only routes wrapped in a ProtectedRoute component that uses usePermission.
        No dead routes — every route resolves to a real component.
      verify: "grep -n 'Open311ServiceListPage\\|BookmarksPage\\|TicketMapPage\\|AdminJobsPage\\|MetricsDashboardPage\\|ReportsPage\\|IssueTypesPage\\|ResponseTemplatesPage\\|ContactMethodsPage' web/src/App.tsx && echo CONTRACT_OK"
---

<objective>
Implement the remaining Wave 3c frontend features: Open311 service list UI (F2), media
uploader with drag-and-drop and thumbnail preview (F10), bookmarks page and sidebar
integration (F12), contact methods admin page (F14), geo-cluster ticket map (F15),
scheduler admin trigger UI (F16), metrics dashboard and 10-report ReportsPage (F17),
issue types admin CRUD (F19), and response template CRUD with in-ticket template picker (F20).

Purpose: These nine feature areas complete the React SPA. The Wave 4 integration plan depends
on all frontend pages existing. Every page uses the Axios API client and JWT interceptors
established in Wave 3a, and all staff-only pages use the usePermission hook from Wave 3a.

Output:
- 9 new pages + 5 shared components + 9 API client modules
- Updated Sidebar.tsx with navigation to every new page
- Updated App.tsx with React Router routes for all new pages
- All staff-gated pages guarded by the usePermission hook from Wave 3a (plan 06)
</objective>

<feature_dependencies>
Implements: F2 (Open311ServiceListPage — displays /open311/services public endpoint),
            F10 (MediaUploader drag-and-drop component + MediaThumbnail integrated on TicketDetailPage),
            F12 (BookmarksPage CRUD + Sidebar bookmark list + useBookmarks hook),
            F14 (ContactMethodsPage showing four seeded contact methods),
            F15 (TicketMapPage with react-leaflet geo-cluster rendering from GET /api/v1/tickets?view=map),
            F16 (AdminJobsPage manual scheduler trigger buttons → POST /api/v1/admin/jobs/*/run),
            F17 (MetricsDashboardPage onTimePercentage + ReportsPage for 10 canned reports),
            F19 (IssueTypesPage CRUD for issue type records),
            F20 (ResponseTemplatesPage CRUD + ResponseTemplatePicker on ticket response form)
Depends on: Wave 3a (plan 06) — SPA scaffold: Vite+TypeScript, React Router, Zustand, Axios
              apiClient with JWT interceptors, usePermission hook, LoginPage, TicketListPage;
            Wave 3b (plan 07) — admin page patterns: PeopleListPage, DepartmentsPage,
              CategoriesPage, SubstatusPage, ActionsPage, ClientsPage (established form/table patterns);
            Wave 2d (plan 05) — backend APIs: BookmarkController, MediaController,
              MetricsController, ResponseTemplateController, AdminJobController,
              GeoClusterScheduler, IssueTypeController, ContactMethodController;
            Wave 2b (plan 03) — Open311 /open311/services endpoint;
            Wave 1 (plan 01) — DB seed data for contactMethods (4) and issueTypes (6)
Enables: Wave 4 (plan 09) — integration validation requires all frontend pages to exist
         for end-to-end test coverage
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@.planning/express/implement-the-full-ureport-modernization/01-PLAN.md
@.planning/express/implement-the-full-ureport-modernization/02-PLAN.md
@.planning/express/implement-the-full-ureport-modernization/05-PLAN.md
@project_specs/PRD-uReport.md        (F2, F10, F12, F14, F15, F16, F17, F19, F20 capabilities)
@project_specs/UserStories-uReport.md (US-2.x, US-10.x, US-12.x, US-14.x, US-15.x, US-16.x, US-17.x, US-19.x, US-20.x)
@project_specs/RTM-uReport.md        (TechArch component names: Open311ServiceList.tsx, MediaUploader.tsx, TicketMap.tsx, MetricsDashboardPage.tsx, ReportsPage.tsx, BookmarksPage.tsx, Sidebar.tsx)
</context>

<tasks>

<task type="auto">
  <name>Task 1: API modules + Open311, Media, Bookmarks, Contact Methods, Geo Map pages (F2, F10, F12, F14, F15)</name>
  <files>
    web/src/api/open311.ts
    web/src/api/media.ts
    web/src/api/bookmarks.ts
    web/src/api/contactMethods.ts
    web/src/api/geo.ts
    web/src/pages/Open311ServiceListPage.tsx
    web/src/components/media/MediaUploader.tsx
    web/src/components/media/MediaThumbnail.tsx
    web/src/pages/BookmarksPage.tsx
    web/src/hooks/useBookmarks.ts
    web/src/pages/ContactMethodsPage.tsx
    web/src/pages/TicketMapPage.tsx
    web/src/components/map/GeoClusterMap.tsx
  </files>
  <action>
Create the following files. All API modules import `apiClient` from `../api/client` (established
in Wave 3a plan 06). All page components import `usePermission` from `../hooks/usePermission`
(Wave 3a) and redirect unauthenticated users to `/login`. Follow the TypeScript + Tailwind CSS
patterns established in Wave 3b admin pages.

CRITICAL: Do NOT add X-Frame-Options DENY headers or CSP frame-ancestors directives anywhere
in this code — the SPA must remain embeddable in iframes per project requirements.

---

### web/src/api/open311.ts

```typescript
import { apiClient } from './client';

export interface Open311Service {
  service_code: string;
  service_name: string;
  description: string | null;
  metadata: boolean;
  type: string;
  keywords: string | null;
  group: string | null;
}

export interface Open311ServiceAttribute {
  code: string;
  datatype: string;
  required: boolean;
  description: string;
  order: number;
  values?: { key: string; name: string }[];
}

export const open311Api = {
  listServices: () =>
    apiClient.get<Open311Service[]>('/open311/services').then(r => r.data),
  getService: (serviceCode: string) =>
    apiClient.get<{ service: Open311Service; attributes: Open311ServiceAttribute[] }>(
      `/open311/services/${serviceCode}`
    ).then(r => r.data),
};
```

NOTE: /open311/services does NOT require authentication — do not add Authorization header
for this endpoint (apiClient will attach the JWT if present, which is fine; the server
permits anonymous access per SecurityConfig).

---

### web/src/api/media.ts

```typescript
import { apiClient } from './client';

export interface MediaItem {
  id: number;
  ticket_id: number;
  filename: string;
  internalFilename: string;
  mime_type: string;
  uploaded: string;
  person_id: number | null;
  url: string;
  thumbnailUrl: string | null;
}

export const mediaApi = {
  uploadFile: (ticketId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<MediaItem>(`/api/v1/tickets/${ticketId}/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  listMedia: (ticketId: number) =>
    apiClient.get<MediaItem[]>(`/api/v1/tickets/${ticketId}/media`).then(r => r.data),
  deleteMedia: (ticketId: number, mediaId: number) =>
    apiClient.delete(`/api/v1/tickets/${ticketId}/media/${mediaId}`),
  // URL helpers — backend serves files at these paths
  originalUrl: (internalFilename: string) =>
    `/api/v1/media/${internalFilename}`,
  thumbnailUrl: (internalFilename: string) =>
    `/api/v1/media/${internalFilename}/thumbnail`,
};
```

---

### web/src/api/bookmarks.ts

```typescript
import { apiClient } from './client';

export interface Bookmark {
  id: number;
  type: string;
  name: string;
  requestUri: string;
  createdAt: string;
}

export interface CreateBookmarkRequest {
  name: string;
  requestUri: string;
  type?: string;
}

export const bookmarksApi = {
  list: () =>
    apiClient.get<Bookmark[]>('/api/v1/bookmarks').then(r => r.data),
  create: (req: CreateBookmarkRequest) =>
    apiClient.post<Bookmark>('/api/v1/bookmarks', req).then(r => r.data),
  delete: (id: number) =>
    apiClient.delete(`/api/v1/bookmarks/${id}`),
};
```

---

### web/src/api/contactMethods.ts

```typescript
import { apiClient } from './client';

export interface ContactMethod {
  id: number;
  name: string;
  isSystem: boolean;
}

export const contactMethodsApi = {
  list: () =>
    apiClient.get<ContactMethod[]>('/api/v1/contact-methods').then(r => r.data),
};
```

---

### web/src/api/geo.ts

```typescript
import { apiClient } from './client';

export interface GeoClusterMarker {
  clusterId: number;
  level: number;
  lat: number;
  lng: number;
  ticketCount: number;
}

export interface MapViewResponse {
  clusters: GeoClusterMarker[];
  total: number;
}

export const geoApi = {
  // Send the same search params as ticket list but with view=map
  searchMap: (params: Record<string, string | number | undefined>) =>
    apiClient.get<MapViewResponse>('/api/v1/tickets', {
      params: { ...params, view: 'map' },
    }).then(r => r.data),
};
```

---

### web/src/pages/Open311ServiceListPage.tsx

Public-accessible page (no auth required) that fetches and displays Open311 services.

```typescript
import React, { useEffect, useState } from 'react';
import { open311Api, Open311Service } from '../api/open311';

export const Open311ServiceListPage: React.FC = () => {
  const [services, setServices] = useState<Open311Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    open311Api.listServices()
      .then(setServices)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading services…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Open311 Service List</h1>
      <p className="text-sm text-gray-500 mb-4">
        Public-facing service types available via the Open311 GeoReport v2 API.
      </p>
      <table className="w-full border-collapse border border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border border-gray-200 px-3 py-2 text-left">Code</th>
            <th className="border border-gray-200 px-3 py-2 text-left">Name</th>
            <th className="border border-gray-200 px-3 py-2 text-left">Group</th>
            <th className="border border-gray-200 px-3 py-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          {services.map(svc => (
            <tr key={svc.service_code} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-3 py-2 font-mono">{svc.service_code}</td>
              <td className="border border-gray-200 px-3 py-2 font-medium">{svc.service_name}</td>
              <td className="border border-gray-200 px-3 py-2 text-gray-600">{svc.group ?? '—'}</td>
              <td className="border border-gray-200 px-3 py-2 text-gray-600">{svc.description ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {services.length === 0 && (
        <p className="text-gray-500 mt-4">No active public services found.</p>
      )}
    </div>
  );
};
```

---

### web/src/components/media/MediaThumbnail.tsx

```typescript
import React from 'react';
import { mediaApi } from '../../api/media';

interface Props {
  internalFilename: string;
  filename: string;
  mimeType: string;
}

export const MediaThumbnail: React.FC<Props> = ({ internalFilename, filename, mimeType }) => {
  const isImage = mimeType.startsWith('image/');
  const originalUrl = mediaApi.originalUrl(internalFilename);

  return (
    <div className="border rounded p-2 flex flex-col items-center gap-1 w-32">
      {isImage ? (
        <a href={originalUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={mediaApi.thumbnailUrl(internalFilename)}
            alt={filename}
            className="w-24 h-24 object-cover rounded"
            onError={e => {
              (e.target as HTMLImageElement).src = originalUrl;
            }}
          />
        </a>
      ) : (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-xs break-all"
        >
          {filename}
        </a>
      )}
      <span className="text-xs text-gray-500 truncate w-full text-center">{filename}</span>
    </div>
  );
};
```

---

### web/src/components/media/MediaUploader.tsx

Drag-and-drop + click-to-browse file uploader for a specific ticket.

```typescript
import React, { useCallback, useRef, useState } from 'react';
import { mediaApi, MediaItem } from '../../api/media';
import { MediaThumbnail } from './MediaThumbnail';

interface Props {
  ticketId: number;
  onUploaded: (media: MediaItem) => void;
}

export const MediaUploader: React.FC<Props> = ({ ticketId, onUploaded }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const media = await mediaApi.uploadFile(ticketId, file);
        onUploaded(media);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [ticketId, onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(uploadFile);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <p className="text-sm text-gray-500">Uploading…</p>
        ) : (
          <p className="text-sm text-gray-500">
            Drag files here or <span className="text-blue-600 underline">click to browse</span>
          </p>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
};
```

---

### web/src/hooks/useBookmarks.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi, Bookmark } from '../api/bookmarks';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    bookmarksApi.list()
      .then(setBookmarks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const deleteBookmark = useCallback(async (id: number) => {
    await bookmarksApi.delete(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  return { bookmarks, loading, refresh, deleteBookmark };
};
```

---

### web/src/pages/BookmarksPage.tsx

Staff-only page for managing saved bookmarks. Uses usePermission from Wave 3a.

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { useBookmarks } from '../hooks/useBookmarks';
import { bookmarksApi } from '../api/bookmarks';

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStaff, loading: authLoading } = usePermission();
  const { bookmarks, loading, refresh, deleteBookmark } = useBookmarks();
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-staff to login
  if (!authLoading && !isStaff) {
    navigate('/login');
    return null;
  }

  const handleSaveCurrent = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await bookmarksApi.create({
        name: newName.trim(),
        requestUri: window.location.href,
        type: 'search',
      });
      setNewName('');
      refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save bookmark');
    } finally {
      setSaving(false);
    }
  };

  const handleNavigate = (requestUri: string) => {
    navigate(requestUri.replace(window.location.origin, '') || requestUri);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Bookmarks</h1>

      {/* Save current location as bookmark */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Bookmark name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
        />
        <button
          onClick={handleSaveCurrent}
          disabled={saving || !newName.trim()}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Current Page'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : bookmarks.length === 0 ? (
        <p className="text-gray-500">No saved bookmarks yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 px-3 py-2 text-left">Name</th>
              <th className="border border-gray-200 px-3 py-2 text-left">Type</th>
              <th className="border border-gray-200 px-3 py-2 text-left">URL</th>
              <th className="border border-gray-200 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {bookmarks.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">
                  <button
                    onClick={() => handleNavigate(b.requestUri)}
                    className="text-blue-600 hover:underline text-left"
                  >
                    {b.name}
                  </button>
                </td>
                <td className="border border-gray-200 px-3 py-2 text-gray-500">{b.type}</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-500 font-mono text-xs truncate max-w-xs">
                  {b.requestUri}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  <button
                    onClick={() => deleteBookmark(b.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

### web/src/pages/ContactMethodsPage.tsx

Read-only page for staff showing the four seeded contact methods. They are system-seeded
and not deletable; this page is informational (used to confirm the seeded records exist).

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { contactMethodsApi, ContactMethod } from '../api/contactMethods';

export const ContactMethodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStaff, loading: authLoading } = usePermission();
  const [methods, setMethods] = useState<ContactMethod[]>([]);
  const [loading, setLoading] = useState(true);

  if (!authLoading && !isStaff) { navigate('/login'); return null; }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    contactMethodsApi.list()
      .then(setMethods)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Contact Methods</h1>
      <p className="text-sm text-gray-500 mb-4">
        System-seeded submission and response channel types used on tickets.
      </p>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 px-3 py-2 text-left">ID</th>
              <th className="border border-gray-200 px-3 py-2 text-left">Name</th>
              <th className="border border-gray-200 px-3 py-2 text-left">System</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">{m.id}</td>
                <td className="border border-gray-200 px-3 py-2 font-medium">{m.name}</td>
                <td className="border border-gray-200 px-3 py-2">
                  {m.isSystem ? (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">System</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

### web/src/components/map/GeoClusterMap.tsx

Leaflet map component rendering geo-cluster markers. Requires `react-leaflet` and `leaflet`
packages. If not yet in package.json, add them: `npm install react-leaflet leaflet @types/leaflet`.

```typescript
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoClusterMarker } from '../../api/geo';

interface Props {
  clusters: GeoClusterMarker[];
  onClusterClick?: (cluster: GeoClusterMarker) => void;
}

export const GeoClusterMap: React.FC<Props> = ({ clusters, onClusterClick }) => {
  return (
    <MapContainer
      center={[39.5, -98.35]}  // Default center: continental US
      zoom={4}
      style={{ height: '600px', width: '100%' }}
      className="rounded border border-gray-200"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clusters.map(cluster => (
        <CircleMarker
          key={cluster.clusterId}
          center={[cluster.lat, cluster.lng]}
          radius={Math.min(Math.max(cluster.ticketCount / 2, 6), 30)}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
          }}
          eventHandlers={{
            click: () => onClusterClick?.(cluster),
          }}
        >
          <Popup>
            <strong>{cluster.ticketCount}</strong> ticket{cluster.ticketCount !== 1 ? 's' : ''}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};
```

---

### web/src/pages/TicketMapPage.tsx

Staff-gated map view for geo-clustered ticket search results.
Reads search params from URL query string and fetches with view=map.
Clicking a cluster navigates to TicketListPage with lat/long/radius filter.

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { geoApi, GeoClusterMarker, MapViewResponse } from '../api/geo';
import { GeoClusterMap } from '../components/map/GeoClusterMap';

export const TicketMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isStaff, loading: authLoading } = usePermission();
  const [mapData, setMapData] = useState<MapViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !isStaff) { navigate('/login'); return null; }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    geoApi.searchMap(params)
      .then(setMapData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleClusterClick = (cluster: GeoClusterMarker) => {
    // Navigate to ticket list with geo radius filter centered on this cluster
    const params = new URLSearchParams(searchParams);
    params.set('lat', String(cluster.lat));
    params.set('long', String(cluster.lng));
    params.set('radius', '5000');  // 5km radius
    navigate(`/tickets?${params.toString()}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Ticket Map</h1>
        <button
          onClick={() => navigate(`/tickets?${searchParams.toString()}`)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Switch to List View
        </button>
      </div>
      {mapData && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {mapData.total} tickets across {mapData.clusters.length} cluster
          {mapData.clusters.length !== 1 ? 's' : ''}.
        </p>
      )}
      {loading ? (
        <div className="h-96 flex items-center justify-center text-gray-500">
          Loading map data…
        </div>
      ) : error ? (
        <div className="p-4 text-red-600">Error: {error}</div>
      ) : (
        <GeoClusterMap
          clusters={mapData?.clusters ?? []}
          onClusterClick={handleClusterClick}
        />
      )}
    </div>
  );
};
```
  </action>
  <verify>
grep -n 'Open311ServiceListPage' web/src/pages/Open311ServiceListPage.tsx && echo OPEN311_PAGE_OK
grep -n 'MediaUploader' web/src/components/media/MediaUploader.tsx && grep -n 'onUploaded' web/src/components/media/MediaUploader.tsx && echo MEDIA_UPLOADER_OK
grep -n 'BookmarksPage' web/src/pages/BookmarksPage.tsx && grep -n 'deleteBookmark' web/src/pages/BookmarksPage.tsx && echo BOOKMARKS_PAGE_OK
grep -n 'useBookmarks' web/src/hooks/useBookmarks.ts && echo BOOKMARKS_HOOK_OK
grep -n 'ContactMethodsPage' web/src/pages/ContactMethodsPage.tsx && echo CONTACT_METHODS_PAGE_OK
grep -n 'TicketMapPage' web/src/pages/TicketMapPage.tsx && grep -n 'GeoClusterMap' web/src/pages/TicketMapPage.tsx && echo MAP_PAGE_OK
grep -n 'GeoClusterMap' web/src/components/map/GeoClusterMap.tsx && echo MAP_COMPONENT_OK
grep -n 'open311Api' web/src/api/open311.ts && grep -n 'mediaApi' web/src/api/media.ts && grep -n 'bookmarksApi' web/src/api/bookmarks.ts && echo API_MODULES_OK
  </verify>
  <done>
- web/src/api/open311.ts: open311Api.listServices(), getService(serviceCode)
- web/src/api/media.ts: mediaApi.uploadFile(), listMedia(), deleteMedia(), originalUrl(), thumbnailUrl()
- web/src/api/bookmarks.ts: bookmarksApi.list(), create(), delete()
- web/src/api/contactMethods.ts: contactMethodsApi.list()
- web/src/api/geo.ts: geoApi.searchMap() passing view=map
- web/src/pages/Open311ServiceListPage.tsx: public page, table of Open311 services with code/name/group/description
- web/src/components/media/MediaThumbnail.tsx: renders image thumbnail or file download link
- web/src/components/media/MediaUploader.tsx: drag-and-drop + click-to-browse; POST multipart to /api/v1/tickets/{id}/media; calls onUploaded callback
- web/src/hooks/useBookmarks.ts: fetches bookmark list; provides refresh + deleteBookmark
- web/src/pages/BookmarksPage.tsx: staff-gated; lists bookmarks; save-current-page button; delete button; click navigates to stored requestUri
- web/src/pages/ContactMethodsPage.tsx: staff-gated; table of contactMethods; system badge on system rows
- web/src/components/map/GeoClusterMap.tsx: react-leaflet MapContainer with CircleMarker per cluster; click calls onClusterClick
- web/src/pages/TicketMapPage.tsx: staff-gated; reads search params; fetches GET /api/v1/tickets?view=map; renders GeoClusterMap; cluster click navigates to /tickets with lat/long/radius filter; "Switch to List View" link
  </done>
</task>

<feature_dependencies>
Implements: F2 (Open311ServiceListPage displays /open311/services — public, no auth),
            F10 (MediaUploader drag-and-drop with thumbnail preview, MediaThumbnail component),
            F12 (BookmarksPage full CRUD, useBookmarks hook),
            F14 (ContactMethodsPage shows the four seeded contact methods),
            F15 (TicketMapPage + GeoClusterMap renders geo-cluster markers from GET /api/v1/tickets?view=map)
Depends on: Wave 3a (apiClient, usePermission, React Router, Tailwind CSS setup),
            Wave 2b backend (/open311/services endpoint),
            Wave 2d backend (MediaController, BookmarkController, ContactMethodController, geo map endpoint)
Enables: Task 2 (Admin/Metrics/Reports/IssueTypes/ResponseTemplates pages + Sidebar + App.tsx update)
</feature_dependencies>

<task type="auto">
  <name>Task 2: Scheduler admin, Metrics, Reports, Issue Types, Response Templates, Sidebar + App.tsx routes (F16, F17, F19, F20)</name>
  <files>
    web/src/api/adminJobs.ts
    web/src/api/metrics.ts
    web/src/api/issueTypes.ts
    web/src/api/responseTemplates.ts
    web/src/pages/AdminJobsPage.tsx
    web/src/pages/MetricsDashboardPage.tsx
    web/src/pages/ReportsPage.tsx
    web/src/components/metrics/OnTimeChart.tsx
    web/src/components/metrics/ReportTable.tsx
    web/src/pages/IssueTypesPage.tsx
    web/src/pages/ResponseTemplatesPage.tsx
    web/src/components/tickets/ResponseTemplatePicker.tsx
    web/src/components/layout/Sidebar.tsx
    web/src/App.tsx
  </files>
  <action>
Create the remaining frontend files, then update Sidebar.tsx and App.tsx to integrate all
new routes. Every nav item in the sidebar MUST point to a real route defined in App.tsx.

---

### web/src/api/adminJobs.ts

```typescript
import { apiClient } from './client';

export type JobName = 'digest-notifications' | 'auto-close' | 'audit' | 'geo-cluster';

export interface JobRunResponse {
  status: string;
  jobName: string;
  triggeredAt: string;
}

export const adminJobsApi = {
  run: (jobName: JobName) =>
    apiClient.post<JobRunResponse>(`/api/v1/admin/jobs/${jobName}/run`).then(r => r.data),
};
```

---

### web/src/api/metrics.ts

```typescript
import { apiClient } from './client';

export interface MetricsResponse {
  category_id: number;
  categoryName: string;
  numDays: number;
  effectiveDate: string;
  onTimePercentage: number;
  closedCount: number;
  onTimeCount: number;
}

export interface ReportRow {
  [key: string]: string | number | null;
}

export interface ReportResponse {
  reportType: string;
  generatedAt: string;
  data: ReportRow[];
}

export type ReportType =
  | 'activity' | 'assignments' | 'categories' | 'staff'
  | 'person' | 'sla' | 'volume' | 'current' | 'opened' | 'closed';

export const metricsApi = {
  getMetrics: (params: { category_id: number; numDays: number; effectiveDate: string }) =>
    apiClient.get<MetricsResponse>('/api/v1/metrics', { params }).then(r => r.data),
  getReport: (reportType: ReportType, params: Record<string, string>) =>
    apiClient.get<ReportResponse>(`/api/v1/reports/${reportType}`, { params }).then(r => r.data),
};
```

---

### web/src/api/issueTypes.ts

```typescript
import { apiClient } from './client';

export interface IssueType {
  id: number;
  name: string;
  isSystem: boolean;
}

export interface CreateIssueTypeRequest {
  name: string;
}

export const issueTypesApi = {
  list: () =>
    apiClient.get<IssueType[]>('/api/v1/issue-types').then(r => r.data),
  create: (req: CreateIssueTypeRequest) =>
    apiClient.post<IssueType>('/api/v1/issue-types', req).then(r => r.data),
  update: (id: number, req: CreateIssueTypeRequest) =>
    apiClient.put<IssueType>(`/api/v1/issue-types/${id}`, req).then(r => r.data),
  delete: (id: number) =>
    apiClient.delete(`/api/v1/issue-types/${id}`),
};
```

---

### web/src/api/responseTemplates.ts

```typescript
import { apiClient } from './client';

export interface ResponseTemplate {
  id: number;
  name: string;
  template: string;
  actionId: number | null;
  actionName?: string;
}

export interface CreateResponseTemplateRequest {
  name: string;
  template: string;
  action_id: number | null;
}

export const responseTemplatesApi = {
  list: (actionId?: number) =>
    apiClient.get<ResponseTemplate[]>('/api/v1/response-templates', {
      params: actionId != null ? { action_id: actionId } : undefined,
    }).then(r => r.data),
  create: (req: CreateResponseTemplateRequest) =>
    apiClient.post<ResponseTemplate>('/api/v1/response-templates', req).then(r => r.data),
  update: (id: number, req: CreateResponseTemplateRequest) =>
    apiClient.put<ResponseTemplate>(`/api/v1/response-templates/${id}`, req).then(r => r.data),
  delete: (id: number) =>
    apiClient.delete(`/api/v1/response-templates/${id}`),
};
```

---

### web/src/pages/AdminJobsPage.tsx

Staff-gated page with manual trigger buttons for each scheduler job.

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { adminJobsApi, JobName } from '../api/adminJobs';

interface JobCard {
  jobName: JobName;
  label: string;
  description: string;
}

const JOBS: JobCard[] = [
  {
    jobName: 'digest-notifications',
    label: 'Digest Notifications',
    description: 'Process pending ticketHistory entries and send email notifications.',
  },
  {
    jobName: 'auto-close',
    label: 'Auto-Close Stale Tickets',
    description: 'Close open tickets that have exceeded their category SLA window.',
  },
  {
    jobName: 'audit',
    label: 'Data Integrity Audit',
    description: 'Check for data inconsistencies and log findings.',
  },
  {
    jobName: 'geo-cluster',
    label: 'Geo-Cluster Rebuild',
    description: 'Rebuild geoclusters and ticket_geodata for all zoom levels.',
  },
];

export const AdminJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStaff, loading: authLoading } = usePermission();
  const [running, setRunning] = useState<JobName | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});

  if (!authLoading && !isStaff) { navigate('/login'); return null; }

  const handleRun = async (jobName: JobName) => {
    setRunning(jobName);
    try {
      const res = await adminJobsApi.run(jobName);
      setResults(prev => ({
        ...prev,
        [jobName]: { ok: true, message: `Triggered at ${res.triggeredAt ?? new Date().toISOString()}` },
      }));
    } catch (e: unknown) {
      setResults(prev => ({
        ...prev,
        [jobName]: { ok: false, message: e instanceof Error ? e.message : 'Error' },
      }));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Scheduler Jobs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {JOBS.map(job => (
          <div key={job.jobName} className="border rounded p-4 space-y-2">
            <h2 className="font-semibold">{job.label}</h2>
            <p className="text-sm text-gray-500">{job.description}</p>
            <button
              onClick={() => handleRun(job.jobName)}
              disabled={running === job.jobName}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
            >
              {running === job.jobName ? 'Running…' : 'Run Now'}
            </button>
            {results[job.jobName] && (
              <p className={`text-xs ${results[job.jobName].ok ? 'text-green-600' : 'text-red-600'}`}>
                {results[job.jobName].message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### web/src/components/metrics/OnTimeChart.tsx

Simple CSS/flex bar chart for onTimePercentage. Avoids heavy charting library dependency.

```typescript
import React from 'react';

interface Props {
  percentage: number;
  label: string;
}

export const OnTimeChart: React.FC<Props> = ({ percentage, label }) => {
  const pct = Math.min(Math.max(percentage, 0), 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded h-4">
        <div
          className={`h-4 rounded transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
```

---

### web/src/components/metrics/ReportTable.tsx

Generic table renderer for report data.

```typescript
import React from 'react';
import { ReportRow } from '../../api/metrics';

interface Props {
  data: ReportRow[];
}

export const ReportTable: React.FC<Props> = ({ data }) => {
  if (data.length === 0) return <p className="text-gray-500 text-sm">No data.</p>;

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col} className="border border-gray-200 px-3 py-2 text-left capitalize">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col} className="border border-gray-200 px-3 py-2">
                  {row[col] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

### web/src/pages/MetricsDashboardPage.tsx

Staff-gated metrics page showing onTimePercentage for a selected category.

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { metricsApi, MetricsResponse } from '../api/metrics';
import { OnTimeChart } from '../components/metrics/OnTimeChart';
import { apiClient } from '../api/client';

interface Category { id: number; name: string; }

export const MetricsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStaff, loading: authLoading } = usePermission();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [numDays, setNumDays] = useState(30);
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !isStaff) { navigate('/login'); return null; }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    apiClient.get<Category[]>('/api/v1/categories').then(r => setCategories(r.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await metricsApi.getMetrics({
        category_id: categoryId as number,
        numDays,
        effectiveDate,
      });
      setMetrics(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Metrics Dashboard</h1>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(Number(e.target.value))}
            className="border rounded px-3 py-1.5 text-sm"
            required
          >
            <option value="">Select category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Days</label>
          <input
            type="number"
            min={1}
            max={365}
            value={numDays}
            onChange={e => setNumDays(Number(e.target.value))}
            className="border rounded px-3 py-1.5 text-sm w-20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">As of Date</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={e => setEffectiveDate(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !categoryId}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load Metrics'}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {metrics && (
        <div className="max-w-lg space-y-4">
          <div className="text-sm text-gray-500">
            {metrics.categoryName} — {metrics.numDays} days ending {metrics.effectiveDate}
            <br />
            {metrics.onTimeCount} of {metrics.closedCount} tickets closed on time
          </div>
          <OnTimeChart
            percentage={metrics.onTimePercentage}
            label="On-Time Closure Rate"
          />
        </div>
      )}
    </div>
  );
};
```

---

### web/src/pages/ReportsPage.tsx

Staff-gated page to run all 10 canned reports.

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { metricsApi, ReportType, ReportResponse } from '../api/metrics';
import { ReportTable } from '../components/metrics/ReportTable';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'activity',     label: 'Activity' },
  { value: 'assignments',  label: 'Assignments' },
  { value: 'categories',   label: 'Categories' },
  { value: 'staff',        label: 'Staff' },
  { value: 'person',       label: 'Person' },
  { value: 'sla',          label: 'SLA Compliance' },
  { value: 'volume',       label: 'Volume Trend' },
  { value: 'current',      label: 'Current Open' },
  { value: 'opened',       label: 'Opened Today' },
  { value: 'closed',       label: 'Closed Today' },
];

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStaff, loading: authLoading } = usePermission();
  const [reportType, setReportType] = useState<ReportType>('activity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !isStaff) { navigate('/login'); return null; }

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const result = await metricsApi.getReport(reportType, params);
      setReport(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to run report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <form onSubmit={handleRun} className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value as ReportType)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            {REPORT_TYPES.map(rt => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Report'}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {report && (
        <div>
          <div className="text-sm text-gray-500 mb-2">
            Generated at {new Date(report.generatedAt).toLocaleString()} — {report.data.length} rows
          </div>
          <ReportTable data={report.data} />
        </div>
      )}
    </div>
  );
};
```

---

### web/src/pages/IssueTypesPage.tsx

Staff-gated CRUD page for issue types. System types (isSystem=true) are protected from deletion.

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { issueTypesApi, IssueType } from '../api/issueTypes';

export const IssueTypesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStaff, loading: authLoading } = usePermission();
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !isStaff) { navigate('/login'); return null; }

  const refresh = () => {
    issueTypesApi.list().then(setIssueTypes).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(refresh, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await issueTypesApi.create({ name: newName.trim() });
      setNewName('');
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await issueTypesApi.update(id, { name: editName.trim() });
      setEditId(null);
      setEditName('');
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this issue type?')) return;
    try {
      await issueTypesApi.delete(id);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Issue Types</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New issue type name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1 max-w-xs"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 px-3 py-2 text-left">ID</th>
              <th className="border border-gray-200 px-3 py-2 text-left">Name</th>
              <th className="border border-gray-200 px-3 py-2 text-left">System</th>
              <th className="border border-gray-200 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {issueTypes.map(it => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">{it.id}</td>
                <td className="border border-gray-200 px-3 py-2">
                  {editId === it.id ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="border rounded px-2 py-0.5 text-sm"
                        autoFocus
                      />
                      <button onClick={() => handleUpdate(it.id)} className="text-green-600 text-xs">Save</button>
                      <button onClick={() => setEditId(null)} className="text-gray-400 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <span>{it.name}</span>
                  )}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {it.isSystem && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">🔒 System</span>
                  )}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  {!it.isSystem && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditId(it.id); setEditName(it.name); }}
                        className="text-blue-600 text-xs hover:underline"
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(it.id)}
                        className="text-red-600 text-xs hover:underline"
                      >Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

### web/src/pages/ResponseTemplatesPage.tsx

Staff-gated CRUD page for response templates.

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { responseTemplatesApi, ResponseTemplate } from '../api/responseTemplates';
import { apiClient } from '../api/client';

interface Action { id: number; name: string; }

export const ResponseTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isStaff, loading: authLoading } = usePermission();
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', template: '', action_id: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !isStaff) { navigate('/login'); return null; }

  const refresh = () => {
    responseTemplatesApi.list().then(setTemplates).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    refresh();
    apiClient.get<Action[]>('/api/v1/actions').then(r => setActions(r.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const req = {
      name: form.name,
      template: form.template,
      action_id: form.action_id ? Number(form.action_id) : null,
    };
    try {
      if (editId !== null) {
        await responseTemplatesApi.update(editId, req);
      } else {
        await responseTemplatesApi.create(req);
      }
      setForm({ name: '', template: '', action_id: '' });
      setEditId(null);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleEdit = (t: ResponseTemplate) => {
    setEditId(t.id);
    setForm({ name: t.name, template: t.template, action_id: String(t.actionId ?? '') });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    try {
      await responseTemplatesApi.delete(id);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Response Templates</h1>

      {/* Create / Edit form */}
      <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 space-y-3 max-w-lg">
        <h2 className="font-semibold">{editId !== null ? 'Edit Template' : 'New Template'}</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="border rounded px-3 py-1.5 text-sm w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Template Text</label>
          <textarea
            value={form.template}
            onChange={e => setForm(f => ({ ...f, template: e.target.value }))}
            className="border rounded px-3 py-1.5 text-sm w-full h-24 resize-y"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Associated Action (optional)</label>
          <select
            value={form.action_id}
            onChange={e => setForm(f => ({ ...f, action_id: e.target.value }))}
            className="border rounded px-3 py-1.5 text-sm w-full"
          >
            <option value="">— None —</option>
            {actions.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
          >
            {editId !== null ? 'Update' : 'Create'}
          </button>
          {editId !== null && (
            <button
              type="button"
              onClick={() => { setEditId(null); setForm({ name: '', template: '', action_id: '' }); }}
              className="bg-gray-200 px-4 py-1.5 rounded text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-200 px-3 py-2 text-left">Name</th>
              <th className="border border-gray-200 px-3 py-2 text-left">Action</th>
              <th className="border border-gray-200 px-3 py-2 text-left">Template Preview</th>
              <th className="border border-gray-200 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 font-medium">{t.name}</td>
                <td className="border border-gray-200 px-3 py-2 text-gray-500">
                  {t.actionName ?? (t.actionId ? `Action #${t.actionId}` : '—')}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-gray-500 truncate max-w-xs">
                  {t.template.slice(0, 80)}{t.template.length > 80 ? '…' : ''}
                </td>
                <td className="border border-gray-200 px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(t)} className="text-blue-600 text-xs hover:underline">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 text-xs hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

### web/src/components/tickets/ResponseTemplatePicker.tsx

Dropdown that loads response templates filtered by action type and calls onSelect
when the user picks one. Used in ticket response forms on TicketDetailPage.

```typescript
import React, { useEffect, useState } from 'react';
import { responseTemplatesApi, ResponseTemplate } from '../../api/responseTemplates';

interface Props {
  actionId: number | null;
  onSelect: (templateText: string) => void;
}

export const ResponseTemplatePicker: React.FC<Props> = ({ actionId, onSelect }) => {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (actionId != null) {
      responseTemplatesApi.list(actionId).then(setTemplates).catch(console.error);
    } else {
      setTemplates([]);
    }
    setSelected('');
  }, [actionId]);

  if (templates.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelected(e.target.value);
    const tpl = templates.find(t => t.id === id);
    if (tpl) onSelect(tpl.template);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 whitespace-nowrap">Use template:</label>
      <select
        value={selected}
        onChange={handleChange}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">— Select —</option>
        {templates.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
};
```

---

### web/src/components/layout/Sidebar.tsx

Navigation sidebar with links to ALL pages including new Wave 3c pages.
Every href/to value must match a route defined in App.tsx.
Do NOT add any X-Frame-Options, CSP, or security headers here.

```typescript
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useBookmarks } from '../../hooks/useBookmarks';

interface NavItem {
  to: string;
  label: string;
  staffOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/tickets',            label: 'Tickets' },
  { to: '/map',                label: 'Map View',             staffOnly: true },
  { to: '/bookmarks',          label: 'Bookmarks',            staffOnly: true },
  { to: '/people',             label: 'People',               staffOnly: true },
  { to: '/departments',        label: 'Departments',          staffOnly: true },
  { to: '/categories',         label: 'Categories',           staffOnly: true },
  { to: '/substatuses',        label: 'Substatuses',          staffOnly: true },
  { to: '/actions',            label: 'Actions',              staffOnly: true },
  { to: '/clients',            label: 'API Clients',          staffOnly: true },
  { to: '/issue-types',        label: 'Issue Types',          staffOnly: true },
  { to: '/contact-methods',    label: 'Contact Methods',      staffOnly: true },
  { to: '/response-templates', label: 'Response Templates',   staffOnly: true },
  { to: '/open311-services',   label: 'Open311 Services' },
  { to: '/metrics',            label: 'Metrics',              staffOnly: true },
  { to: '/reports',            label: 'Reports',              staffOnly: true },
  { to: '/admin/jobs',         label: 'Admin Jobs',           staffOnly: true },
];

export const Sidebar: React.FC = () => {
  const { bookmarks } = useBookmarks();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-1.5 rounded text-sm transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 h-full overflow-y-auto py-4 space-y-0.5">
      {/* Main navigation */}
      {NAV_ITEMS.map(item => (
        <NavLink key={item.to} to={item.to} className={navLinkClass}>
          {item.label}
        </NavLink>
      ))}

      {/* Saved bookmarks section */}
      {bookmarks.length > 0 && (
        <div className="mt-4 px-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Saved Searches
          </p>
          {bookmarks.map(b => (
            <NavLink
              key={b.id}
              to={b.requestUri.replace(window.location.origin, '') || '/tickets'}
              className={navLinkClass}
              title={b.requestUri}
            >
              {b.name}
            </NavLink>
          ))}
        </div>
      )}
    </aside>
  );
};
```

---

### web/src/App.tsx

Update the root App.tsx to add all Wave 3c routes. Build on the route structure established
by Wave 3a and 3b. Every route in NAV_ITEMS in Sidebar.tsx MUST have a corresponding
`<Route>` element here. No dead routes allowed.

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Wave 3a pages (already exist)
import { LoginPage } from './pages/LoginPage';
import { CallbackPage } from './pages/CallbackPage';
import { TicketListPage } from './pages/TicketListPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { CreateTicketPage } from './pages/CreateTicketPage';

// Wave 3b pages (already exist)
import { PeopleListPage } from './pages/PeopleListPage';
import { PersonDetailPage } from './pages/PersonDetailPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SubstatusPage } from './pages/SubstatusPage';
import { ActionsPage } from './pages/ActionsPage';
import { ClientsPage } from './pages/ClientsPage';

// Wave 3c pages (new)
import { Open311ServiceListPage } from './pages/Open311ServiceListPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { ContactMethodsPage } from './pages/ContactMethodsPage';
import { TicketMapPage } from './pages/TicketMapPage';
import { AdminJobsPage } from './pages/AdminJobsPage';
import { MetricsDashboardPage } from './pages/MetricsDashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { IssueTypesPage } from './pages/IssueTypesPage';
import { ResponseTemplatesPage } from './pages/ResponseTemplatesPage';

// Layout
import { Sidebar } from './components/layout/Sidebar';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">{children}</main>
  </div>
);

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Public / auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/open311-services" element={<Open311ServiceListPage />} />

      {/* App shell routes */}
      <Route path="/" element={<AppLayout><Navigate to="/tickets" replace /></AppLayout>} />
      <Route path="/tickets" element={<AppLayout><TicketListPage /></AppLayout>} />
      <Route path="/tickets/new" element={<AppLayout><CreateTicketPage /></AppLayout>} />
      <Route path="/tickets/:id" element={<AppLayout><TicketDetailPage /></AppLayout>} />
      <Route path="/map" element={<AppLayout><TicketMapPage /></AppLayout>} />
      <Route path="/bookmarks" element={<AppLayout><BookmarksPage /></AppLayout>} />
      <Route path="/people" element={<AppLayout><PeopleListPage /></AppLayout>} />
      <Route path="/people/:id" element={<AppLayout><PersonDetailPage /></AppLayout>} />
      <Route path="/departments" element={<AppLayout><DepartmentsPage /></AppLayout>} />
      <Route path="/categories" element={<AppLayout><CategoriesPage /></AppLayout>} />
      <Route path="/substatuses" element={<AppLayout><SubstatusPage /></AppLayout>} />
      <Route path="/actions" element={<AppLayout><ActionsPage /></AppLayout>} />
      <Route path="/clients" element={<AppLayout><ClientsPage /></AppLayout>} />
      <Route path="/issue-types" element={<AppLayout><IssueTypesPage /></AppLayout>} />
      <Route path="/contact-methods" element={<AppLayout><ContactMethodsPage /></AppLayout>} />
      <Route path="/response-templates" element={<AppLayout><ResponseTemplatesPage /></AppLayout>} />
      <Route path="/metrics" element={<AppLayout><MetricsDashboardPage /></AppLayout>} />
      <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
      <Route path="/admin/jobs" element={<AppLayout><AdminJobsPage /></AppLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  </BrowserRouter>
);
```
  </action>
  <verify>
grep -n 'AdminJobsPage' web/src/pages/AdminJobsPage.tsx && echo ADMIN_JOBS_PAGE_OK
grep -n 'MetricsDashboardPage' web/src/pages/MetricsDashboardPage.tsx && grep -n 'onTimePercentage\|getMetrics' web/src/pages/MetricsDashboardPage.tsx && echo METRICS_PAGE_OK
grep -n 'ReportsPage' web/src/pages/ReportsPage.tsx && grep -n 'REPORT_TYPES\|metricsApi.getReport' web/src/pages/ReportsPage.tsx && echo REPORTS_PAGE_OK
grep -n 'IssueTypesPage' web/src/pages/IssueTypesPage.tsx && grep -n 'issueTypesApi' web/src/pages/IssueTypesPage.tsx && echo ISSUE_TYPES_PAGE_OK
grep -n 'ResponseTemplatesPage' web/src/pages/ResponseTemplatesPage.tsx && grep -n 'responseTemplatesApi' web/src/pages/ResponseTemplatesPage.tsx && echo RESPONSE_TEMPLATES_PAGE_OK
grep -n 'ResponseTemplatePicker' web/src/components/tickets/ResponseTemplatePicker.tsx && grep -n 'onSelect' web/src/components/tickets/ResponseTemplatePicker.tsx && echo TEMPLATE_PICKER_OK
grep -n 'Sidebar' web/src/components/layout/Sidebar.tsx && grep -n 'bookmarks\|useBookmarks' web/src/components/layout/Sidebar.tsx && echo SIDEBAR_OK
grep -n 'Open311ServiceListPage\|BookmarksPage\|TicketMapPage\|AdminJobsPage\|MetricsDashboardPage\|ReportsPage\|IssueTypesPage\|ResponseTemplatesPage\|ContactMethodsPage' web/src/App.tsx && echo APP_ROUTES_OK
  </verify>
  <done>
- web/src/api/adminJobs.ts: adminJobsApi.run(jobName) → POST /api/v1/admin/jobs/{jobName}/run
- web/src/api/metrics.ts: metricsApi.getMetrics(), getReport() for all 10 report types
- web/src/api/issueTypes.ts: issueTypesApi.list(), create(), update(), delete()
- web/src/api/responseTemplates.ts: responseTemplatesApi.list(actionId?), create(), update(), delete()
- web/src/pages/AdminJobsPage.tsx: staff-gated; 4 job cards (digest-notifications, auto-close, audit, geo-cluster); Run Now button with success/error feedback
- web/src/components/metrics/OnTimeChart.tsx: CSS percentage bar with green/yellow/red color coding
- web/src/components/metrics/ReportTable.tsx: generic table renderer for ReportRow[]
- web/src/pages/MetricsDashboardPage.tsx: staff-gated; category selector + numDays + effectiveDate form; onTimePercentage bar via OnTimeChart
- web/src/pages/ReportsPage.tsx: staff-gated; all 10 report types selectable; date range inputs; results in ReportTable
- web/src/pages/IssueTypesPage.tsx: staff-gated CRUD; system types locked (no delete/edit for isSystem=true)
- web/src/pages/ResponseTemplatesPage.tsx: staff-gated CRUD; create/edit form with name, template textarea, action dropdown
- web/src/components/tickets/ResponseTemplatePicker.tsx: dropdown filtered by actionId; calls onSelect(templateText) on pick; returns null when no templates available
- web/src/components/layout/Sidebar.tsx: all nav items link to real routes; saved bookmarks section from useBookmarks hook
- web/src/App.tsx: all 9 new routes added alongside Wave 3a/3b routes; every Sidebar nav item has a corresponding Route; no dead routes
  </done>
</task>

<feature_dependencies>
Implements: F16 (AdminJobsPage with 4 manual scheduler trigger buttons),
            F17 (MetricsDashboardPage + ReportsPage for all 10 canned reports),
            F19 (IssueTypesPage CRUD with system-type protection),
            F20 (ResponseTemplatesPage CRUD + ResponseTemplatePicker in-ticket integration)
Also completes: Sidebar.tsx with all nav items pointing to real routes, App.tsx with all routes
Depends on: Wave 3a (usePermission hook, apiClient, React Router, LoginPage, TicketListPage),
            Wave 3b (DepartmentsPage, CategoriesPage etc. — establishes page patterns and App.tsx structure),
            Wave 2d (AdminJobController, MetricsController, ResponseTemplateController, IssueTypeController)
Enables: Wave 4 integration (all frontend pages exist; Nginx can proxy /api/v1/* to Spring Boot;
         end-to-end browser tests can navigate to every route)
</feature_dependencies>

</tasks>

<verification>
After both tasks complete:

1. Verify all new page files exist:
```bash
ls web/src/pages/Open311ServiceListPage.tsx \
   web/src/pages/BookmarksPage.tsx \
   web/src/pages/ContactMethodsPage.tsx \
   web/src/pages/TicketMapPage.tsx \
   web/src/pages/AdminJobsPage.tsx \
   web/src/pages/MetricsDashboardPage.tsx \
   web/src/pages/ReportsPage.tsx \
   web/src/pages/IssueTypesPage.tsx \
   web/src/pages/ResponseTemplatesPage.tsx 2>&1 | grep -c tsx
# Expected: 9
```

2. Verify all API modules exist:
```bash
ls web/src/api/open311.ts web/src/api/media.ts web/src/api/bookmarks.ts \
   web/src/api/contactMethods.ts web/src/api/geo.ts web/src/api/adminJobs.ts \
   web/src/api/metrics.ts web/src/api/issueTypes.ts web/src/api/responseTemplates.ts 2>&1 | grep -c ts
# Expected: 9
```

3. Verify App.tsx has all 9 new routes:
```bash
grep -c 'Open311ServiceListPage\|BookmarksPage\|TicketMapPage\|AdminJobsPage\|MetricsDashboardPage\|ReportsPage\|IssueTypesPage\|ResponseTemplatesPage\|ContactMethodsPage' web/src/App.tsx
# Expected: 9
```

4. Verify no X-Frame-Options or CSP frame-ancestors in frontend code:
```bash
grep -r 'X-Frame-Options\|frame-ancestors' web/src/ 2>/dev/null | grep -c .
# Expected: 0
```

5. Verify TypeScript compiles (if npm/tsc available):
```bash
npm run build --prefix web 2>&1 | tail -10 && echo BUILD_OK
```
</verification>

<success_criteria>
- All 9 page components exist with the exact component names listed in integration_contracts.provides
- All 9 API modules exist importing from apiClient (Wave 3a)
- MediaUploader accepts ticketId and onUploaded props; uses multipart/form-data POST
- BookmarksPage lists all user bookmarks; delete is owner-enforced; save-current-page persists window.location.href
- Sidebar.tsx lists all navigation items from NAV_ITEMS with real to= values that match routes in App.tsx
- App.tsx has a <Route> for every path in NAV_ITEMS — zero dead routes
- TicketMapPage sends ?view=map param; cluster click navigates to /tickets with lat/long/radius filters
- MetricsDashboardPage sends GET /api/v1/metrics with category_id, numDays, effectiveDate; renders OnTimeChart
- ReportsPage supports all 10 report types via GET /api/v1/reports/{type}; renders ReportTable
- IssueTypesPage disables delete for isSystem=true rows
- ResponseTemplatePicker fetches templates filtered by actionId; calls onSelect(templateText) on pick
- No X-Frame-Options DENY or CSP frame-ancestors directives in any frontend file
- All staff-gated pages redirect to /login when isStaff is false
- All integration_contracts.provides.verify commands exit 0
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/08-SUMMARY.md`
summarizing:
- Pages created: 9 (Open311ServiceListPage, BookmarksPage, ContactMethodsPage, TicketMapPage,
  AdminJobsPage, MetricsDashboardPage, ReportsPage, IssueTypesPage, ResponseTemplatesPage)
- Components created: 5 (MediaUploader, MediaThumbnail, GeoClusterMap, OnTimeChart, ReportTable,
  ResponseTemplatePicker)
- API modules created: 9 (open311, media, bookmarks, contactMethods, geo, adminJobs, metrics,
  issueTypes, responseTemplates)
- Hook created: useBookmarks
- Updated: Sidebar.tsx (all nav items), App.tsx (all routes)
- Features implemented: F2, F10, F12, F14, F15, F16, F17, F19, F20
- Any deviations from spec
</output>
