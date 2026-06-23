## 4. API Design

### 4.1 API Surface Overview

| Prefix | Handler | Purpose |
|--------|---------|---------|
| `/api/` | PHP 8.5 REST controllers | New internal JSON API |
| `/open311/` | PHP 8.5 (preserved) | GeoReport v2 compliance |
| `/auth/` | PHP 8.5 OIDC controllers | Session management |

**JSON Envelope (all `/api/` responses):**
```json
{
  "data": any,
  "meta": { "page": 1, "perPage": 25, "total": 342, "pages": 14 },
  "errors": []
}
```

**HTTP Status Code Contract:**

| Status | Meaning |
|--------|---------|
| 200 OK | Successful read or update |
| 201 Created | Resource created |
| 204 No Content | Successful delete |
| 400 Bad Request | Malformed JSON or invalid params |
| 401 Unauthorized | Missing or invalid session |
| 403 Forbidden | Role insufficient |
| 404 Not Found | Resource not found |
| 409 Conflict | State conflict (double-close, self-merge) |
| 413 Payload Too Large | Upload or export exceeds limit |
| 422 Unprocessable Entity | Validation failure (field-level errors) |
| 500 Internal Server Error | Unhandled exception |
| 503 Service Unavailable | MySQL/Solr/IdP unavailable |

---

### 4.2 TypeScript Interfaces

Generated from the OpenAPI 3.1 spec via `openapi-typescript` during the frontend build. The following are the canonical source shapes.

```typescript
// ─── Shared ──────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'staff' | 'public';
export type TicketStatus = 'open' | 'closed';
export type DisplayPermission = 'public' | 'staff' | 'anonymous';
export type PostingPermission = 'staff' | 'public' | 'anonymous';
export type ActionType =
  | 'open' | 'assignment' | 'closed' | 'reopen'
  | 'response' | 'comment' | 'upload'
  | 'deleted' | 'merged' | 'substatus' | 'notification_sent';
export type ContactMethodType = 'email' | 'phone' | 'address';
export type PhoneType = 'mobile' | 'office' | 'home';
export type GeoStatus = 'located' | 'pending' | 'failed';

export interface ApiEnvelope<T> {
  data: T;
  meta: PaginationMeta;
  errors: ApiError[];
}

export interface PaginationMeta {
  page?: number;
  perPage?: number;
  total?: number;
  pages?: number;
  facets?: Record<string, Record<string, number>>;
}

export interface ApiError {
  field: string | null;
  message: string;
  code?: string;
}

// ─── Ticket ──────────────────────────────────────────────────────────────────

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  substatus: SubstatusRef | null;
  category: CategoryRef;
  department: DepartmentRef;
  assignee: PersonRef | null;
  reporter: ReporterInfo;
  address: string | null;
  lat: number | null;
  lng: number | null;
  customFields: Record<string, unknown> | null;
  sla: SlaInfo | null;
  datetimeOpened: string;   // ISO 8601
  datetimeClosed: string | null;
  datetimeUpdated: string;
  mergedIntoTicketId: number | null;
  deletedAt: string | null;
}

export interface SlaInfo {
  slaDays: number | null;
  expectedCloseDate: string | null;  // ISO 8601 date
  status: 'on_time' | 'late' | 'no_sla';
  pctElapsed: number | null;         // 0–100+
}

export interface ReporterInfo {
  personId: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface CategoryRef {
  id: number;
  name: string;
}

export interface DepartmentRef {
  id: number;
  name: string;
}

export interface PersonRef {
  id: number;
  name: string;
}

export interface SubstatusRef {
  id: number;
  label: string;
  primaryStatus: TicketStatus;
}

// ─── Create/Update Request Bodies ────────────────────────────────────────────

export interface CreateTicketBody {
  title: string;
  description?: string;
  categoryId: number;
  lat?: number;
  lng?: number;
  address?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  customFields?: Record<string, unknown>;
  mediaUrls?: string[];
}

export interface UpdateTicketBody {
  title?: string;
  description?: string;
  categoryId?: number;
  address?: string;
  lat?: number;
  lng?: number;
  customFields?: Record<string, unknown>;
  substatusId?: number | null;
}

export interface AssignTicketBody {
  assigneeId?: number | null;
  departmentId?: number;
}

export interface CloseTicketBody {
  response?: string;
}

export interface ReopenTicketBody {
  reason: string;
}

export interface MergeTicketBody {
  targetTicketId: number;
}

export interface PostResponseBody {
  body: string;
  templateId?: number;
}

export interface PostCommentBody {
  body: string;
}

// ─── Action / History ────────────────────────────────────────────────────────

export interface Action {
  id: number;
  ticketId: number;
  type: ActionType;
  visibility: 'external' | 'internal';
  actor: ActorInfo;
  datetimeCreated: string;
  payload: Record<string, unknown> | null;
}

export interface ActorInfo {
  id: number;
  name: string;
  type: 'person' | 'client';
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface Media {
  id: number;
  ticketId: number;
  filename: string;
  originalName: string | null;
  mimeType: string;
  size: number;
  isImage: boolean;
  thumbnailUrl: string | null;
  downloadUrl: string;
  label: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

// ─── GeoCluster ──────────────────────────────────────────────────────────────

export interface GeoCluster {
  lat: number;
  lng: number;
  count: number;
  zoom: number;
}

// ─── Department ──────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  defaultAssignee: PersonRef | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentBody {
  name: string;
  defaultAssigneeId?: number | null;
  active?: boolean;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface CategoryField {
  code: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  departmentId: number;
  groupId: number | null;
  slaDays: number | null;
  displayPermission: DisplayPermission;
  postingPermission: PostingPermission;
  defaultAssigneeId: number | null;
  autoCloseDays: number | null;
  active: boolean;
  fields: CategoryField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryBody {
  name: string;
  departmentId: number;
  groupId?: number;
  slaDays?: number;
  displayPermission: DisplayPermission;
  postingPermission: PostingPermission;
  defaultAssigneeId?: number;
  autoCloseDays?: number;
  active?: boolean;
  fields?: CategoryField[];
}

// ─── CategoryGroup ───────────────────────────────────────────────────────────

export interface CategoryGroup {
  id: number;
  name: string;
  sortOrder: number;
  active: boolean;
}

// ─── Person ──────────────────────────────────────────────────────────────────

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  departmentId: number | null;
  active: boolean;
  oidcSubject: string | null;
  contactMethods: ContactMethod[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonBody {
  firstName: string;
  lastName: string;
  role: Role;
  departmentId?: number;
  active?: boolean;
  oidcSubject?: string;
}

export interface ContactMethod {
  id: number;
  personId: number;
  type: ContactMethodType;
  value: string;
  phoneType: PhoneType | null;
  isPrimary: boolean;
  label: string | null;
}

export interface CreateContactMethodBody {
  type: ContactMethodType;
  value: string;
  phoneType?: PhoneType;
  isPrimary?: boolean;
  label?: string;
}

// ─── Substatus ───────────────────────────────────────────────────────────────

export interface Substatus {
  id: number;
  label: string;
  primaryStatus: TicketStatus;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateSubstatusBody {
  label: string;
  primaryStatus: TicketStatus;
  isDefault?: boolean;
  active?: boolean;
  sortOrder?: number;
}

// ─── Template ────────────────────────────────────────────────────────────────

export interface Template {
  id: number;
  name: string;
  subject: string | null;
  body: string;
  slug: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateBody {
  name: string;
  subject?: string;
  body: string;
  active?: boolean;
}

// ─── API Client ──────────────────────────────────────────────────────────────

export interface ApiClient {
  id: number;
  name: string;
  contactEmail: string;
  apiKeyHint: string;    // First 8 chars + "…" for display
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiClientWithKey extends ApiClient {
  apiKey: string;        // Full key — only returned on create / regenerate
}

export interface CreateApiClientBody {
  name: string;
  contactEmail: string;
  notes?: string;
}

// ─── Bookmark ────────────────────────────────────────────────────────────────

export interface Bookmark {
  id: number;
  personId: number;
  name: string;
  filterState: TicketSearchParams;
  createdAt: string;
}

export interface CreateBookmarkBody {
  name: string;
  filterState: TicketSearchParams;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface TicketSearchParams {
  q?: string;
  status?: TicketStatus;
  substatusId?: number;
  categoryId?: number | number[];
  departmentId?: number | number[];
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
  export?: 'csv';
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  role: Role;
  department: DepartmentRef | null;
  primaryEmail: string | null;
}

// ─── Reporting ───────────────────────────────────────────────────────────────

export interface SlaMetric {
  categoryId: number;
  categoryName: string;
  totalClosed: number;
  onTime: number;
  late: number;
  onTimePct: number;
}

export interface ActivityReport {
  period: { from: string; to: string };
  totalOpened: number;
  totalClosed: number;
  openAtPeriodEnd: number;
  byDay: Array<{ date: string; opened: number; closed: number }>;
}

export interface AssignmentReport {
  assigneeId: number;
  assigneeName: string;
  open: number;
  closed: number;
  avgDaysToClose: number | null;
}
```

---

### 4.3 Endpoint Reference

#### Tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tickets` | Any (role-checked) | Create ticket |
| GET | `/api/tickets` | Any (role-filtered) | Search/list tickets + filters |
| GET | `/api/tickets?export=csv` | staff/admin | CSV export of search results |
| GET | `/api/tickets/{id}` | Any (visibility-checked) | Get ticket detail |
| PUT | `/api/tickets/{id}` | staff/admin | Update ticket fields |
| DELETE | `/api/tickets/{id}` | admin | Soft-delete ticket |
| POST | `/api/tickets/{id}/assign` | staff/admin | Assign to dept/staff |
| POST | `/api/tickets/{id}/close` | staff/admin | Close with optional response |
| POST | `/api/tickets/{id}/reopen` | staff/admin | Reopen with required reason |
| POST | `/api/tickets/{id}/responses` | staff/admin | Post external response |
| POST | `/api/tickets/{id}/comments` | staff/admin | Post internal comment |
| POST | `/api/tickets/{id}/merge` | staff/admin | Merge into target ticket |
| GET | `/api/tickets/{id}/merge-candidates` | staff/admin | Search valid merge targets |
| GET | `/api/tickets/{id}/history` | Any (filtered) | Ticket action history |
| GET | `/api/tickets/{id}/media` | Any (visibility-checked) | List attachments |
| POST | `/api/tickets/{id}/media` | Any (role-checked) | Upload attachment |
| GET | `/api/tickets/{id}/media/{mediaId}` | Any (visibility-checked) | Get attachment metadata |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | staff/admin | Soft-delete attachment |

#### Search & Geo

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/clusters` | Any (role-filtered) | Geo-cluster data for map |
| GET | `/api/geocode` | staff | Geocode address string (map picker utility) |
| GET | `/api/tickets/{id}/location` | Any (visibility-checked) | Get ticket geodata |

#### Reporting

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reports/activity` | staff/admin | Activity report (tickets by period) |
| GET | `/api/reports/assignments` | staff/admin | Per-assignee ticket counts |
| GET | `/api/reports/categories` | staff/admin | Category volume + SLA rates |
| GET | `/api/reports/departments` | staff/admin | Department volume + resolution |
| GET | `/api/reports/staff-performance` | staff/admin | Per-staff response times |
| GET | `/api/reports/sla` | staff/admin | SLA on-time/late breakdown |
| GET | `/api/reports/volume` | staff/admin | Daily/weekly/monthly trends |
| GET | `/api/reports/open-age` | staff/admin | Tickets open past SLA |
| GET | `/api/metrics/sla` | Public | Lightweight SLA % (cached 5 min) |

#### Departments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/departments` | staff/admin | List departments |
| POST | `/api/departments` | admin | Create department |
| GET | `/api/departments/{id}` | staff/admin | Get department detail |
| PUT | `/api/departments/{id}` | admin | Update department |
| DELETE | `/api/departments/{id}` | admin | Deactivate department |

#### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories` | Any (active public cats visible to all) | List categories |
| POST | `/api/categories` | admin | Create category |
| GET | `/api/categories/{id}` | Any (visibility-checked) | Get category detail |
| PUT | `/api/categories/{id}` | admin | Update category |
| DELETE | `/api/categories/{id}` | admin | Deactivate category |
| GET | `/api/category-groups` | Any | List category groups |
| POST | `/api/category-groups` | admin | Create category group |
| PUT | `/api/category-groups/{id}` | admin | Update category group |
| DELETE | `/api/category-groups/{id}` | admin | Delete category group |

#### People

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/people` | staff/admin | List/search people |
| POST | `/api/people` | admin | Create person |
| GET | `/api/people/{id}` | staff/admin | Get person detail |
| PUT | `/api/people/{id}` | admin | Update person |
| DELETE | `/api/people/{id}` | admin | Deactivate person |
| GET | `/api/people/{id}/contact-methods` | staff/admin | List contact methods |
| POST | `/api/people/{id}/contact-methods` | admin | Add contact method |
| PUT | `/api/people/{id}/contact-methods/{cmId}` | admin | Update contact method |
| DELETE | `/api/people/{id}/contact-methods/{cmId}` | admin | Remove contact method |

#### Substatuses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/substatuses` | staff/admin | List substatuses |
| POST | `/api/substatuses` | admin | Create substatus |
| GET | `/api/substatuses/{id}` | staff/admin | Get substatus |
| PUT | `/api/substatuses/{id}` | admin | Update substatus |
| DELETE | `/api/substatuses/{id}` | admin | Deactivate substatus |

#### Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | staff/admin | List active templates |
| POST | `/api/templates` | admin | Create template |
| GET | `/api/templates/{id}` | staff/admin | Get template |
| PUT | `/api/templates/{id}` | admin | Update template |
| DELETE | `/api/templates/{id}` | admin | Delete (non-system only) |

#### API Clients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clients` | admin | List all clients |
| POST | `/api/clients` | admin | Create client (returns key once) |
| GET | `/api/clients/{id}` | admin | Get client detail (key hint only) |
| PUT | `/api/clients/{id}` | admin | Update name/contact/notes |
| DELETE | `/api/clients/{id}` | admin | Deactivate client |
| POST | `/api/clients/{id}/regenerate-key` | admin | Regenerate API key |

#### Bookmarks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookmarks` | staff/admin | List current user's bookmarks |
| POST | `/api/bookmarks` | staff/admin | Create bookmark |
| GET | `/api/bookmarks/{id}` | staff/admin | Get bookmark + filterState |
| DELETE | `/api/bookmarks/{id}` | staff/admin | Delete bookmark |

#### Notification Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/settings` | admin | Get notification/SMTP settings |
| PUT | `/api/notifications/settings` | admin | Update digest frequency |

#### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/login` | None | Initiate OIDC authorization code flow |
| GET | `/auth/callback` | None | Handle OIDC callback; issue session cookie |
| POST | `/auth/logout` | session | Clear session; redirect to OIDC logout |
| GET | `/auth/me` | session | Return current user person record + role |

#### OpenAPI Documentation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/docs` | staff | Swagger UI HTML page |
| GET | `/api/openapi.json` | staff | OpenAPI 3.1 JSON spec |
| GET | `/api/openapi.yaml` | staff | OpenAPI 3.1 YAML spec |

#### Open311 (Preserved Verbatim)

| Method | Path | Auth | Format |
|--------|------|------|--------|
| GET | `/open311/discovery` | None | JSON, XML |
| GET | `/open311/services` | None | JSON, XML |
| GET | `/open311/services/{service_code}` | None | JSON, XML |
| POST | `/open311/requests` | API key (optional) | JSON, XML |
| GET | `/open311/requests` | API key (optional) | JSON, XML |
| GET | `/open311/requests/{service_request_id}` | API key (optional) | JSON, XML |

> **Open311 preservation guarantee:** Paths, parameters, and response shapes under `/open311/` are frozen. No external clients require code changes after the modernization.

---
