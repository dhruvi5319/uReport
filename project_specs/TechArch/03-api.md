---

## 4. API Design

### 4.1 Base URLs and Conventions

| Surface | Base Path | Auth |
|---|---|---|
| Open311 / GeoReport v2 | `/open311/v2/` | Public (api_key for writes) |
| Internal CRM API | `/api/` | JWT (httpOnly cookie) |
| Auth endpoints | `/api/auth/`, `/auth/` | Special (see §Security) |
| Media serving | `/api/media/` | JWT (public categories: none) |
| OpenAPI spec | `/v3/api-docs` | None |
| Swagger UI | `/swagger-ui.html` | None |

**Response format:** `application/json` for all `/api/*` endpoints.  
**Error format:** `{ "code": "ERROR_CODE", "message": "Human-readable message" }`  
**Pagination:** `{ "data": [...], "total": N, "page": N, "pageSize": N }`  
**Timestamps:** ISO 8601 UTC in all JSON responses.  
**Content negotiation (Open311 only):** Format priority: URL suffix (`.json`/`.xml`) → `format` query param → `Accept` header → default JSON.

---

### 4.2 Open311 / GeoReport v2 Endpoints (Frozen Contract)

These endpoints are identical in path, HTTP method, query parameters, and response field names to the existing PHP implementation. **No changes are permitted.**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/open311/v2/services` | None (api_key opt.) | List all postable service categories |
| GET | `/open311/v2/services/{service_code}` | None | Single service category detail |
| GET | `/open311/v2/requests` | None | List service requests with filters |
| GET | `/open311/v2/requests/{service_request_id}` | None | Single service request |
| POST | `/open311/v2/requests` | api_key required | Submit a new service request |

**Content negotiation precedence:**
1. URL path suffix: `.json` → JSON; `.xml` → XML
2. `format` query param: `json` / `xml`
3. `Accept` header: `application/json` / `application/xml` / `text/html`
4. Default: JSON

**Service Object (GET /services response element):**

```typescript
interface Open311Service {
  service_code: string;       // categories.id as string
  service_name: string;       // categories.name
  description: string;        // categories.description
  metadata: false;            // always false
  type: "realtime";           // always "realtime"
  keywords: "";               // always empty string
  group: string;              // category_groups.name
}
```

**Service Request Object (GET /requests response element):**

```typescript
interface Open311ServiceRequest {
  service_request_id: string;   // tickets.id as string
  status: "open" | "closed";
  status_notes: string;         // latest action notes
  service_name: string;         // categories.name
  service_code: string;         // tickets.category_id as string
  description: string;          // tickets.description
  agency_responsible: string;   // departments.name
  service_notice: "";           // always empty
  requested_datetime: string;   // tickets.entered_date ISO 8601
  updated_datetime: string;     // tickets.last_modified ISO 8601
  expected_datetime: string | null; // entered_date + sla_days or null
  address: string;              // tickets.location
  address_id: string;           // tickets.address_id
  zipcode: string;              // tickets.zip
  lat: number | null;           // tickets.latitude
  long: number | null;          // tickets.longitude
  media_url: string;            // URL of first media or ""
}
```

---

### 4.3 Internal CRM API Endpoints

#### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/ldap` | None | LDAP login; sets JWT cookie |
| GET | `/api/auth/me` | JWT | Current authenticated user |
| POST | `/api/auth/refresh` | Refresh cookie | Renew JWT |
| POST | `/api/auth/logout` | JWT | Clear cookies; CAS single sign-out |
| GET | `/auth/cas/callback` | None | CAS service ticket validation |

```typescript
interface LdapLoginRequest {
  username: string;   // max 40 chars
  password: string;   // never logged or stored
}

interface AuthMeResponse {
  personId: number;
  username: string;
  role: "admin" | "staff" | "public";
  firstname: string | null;
  lastname: string | null;
  expiresAt: string; // ISO 8601 UTC
}
```

---

#### Tickets

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tickets` | JWT | Paginated filtered ticket list with FTS |
| POST | `/api/tickets` | JWT | Create ticket (staff) |
| POST | `/api/tickets/public` | None | Create ticket (public submission) |
| GET | `/api/tickets/export` | JWT | CSV export of filtered results |
| POST | `/api/tickets/bulk` | JWT | Bulk assign/close/status |
| GET | `/api/tickets/{id}` | JWT | Single ticket detail |
| PATCH | `/api/tickets/{id}` | JWT | Partial field update |
| POST | `/api/tickets/{id}/close` | JWT | Close with substatus |
| POST | `/api/tickets/{id}/reopen` | JWT | Reopen closed ticket |
| POST | `/api/tickets/{id}/assign` | JWT | Assign to person |
| GET | `/api/tickets/{id}/history` | JWT | Action timeline |
| POST | `/api/tickets/{id}/history` | JWT | Log action entry |
| GET | `/api/tickets/{id}/media` | JWT* | List media attachments |
| POST | `/api/tickets/{id}/media` | JWT | Upload media to ticket |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | JWT | Delete media |

*JWT required for staff-only categories; public categories served without auth.

```typescript
// GET /api/tickets query parameters
interface TicketListParams {
  q?: string;              // full-text search term (max 255 chars)
  status?: "open" | "closed";
  substatus_id?: number;
  category_id?: number;
  category_group_id?: number;
  department_id?: number;
  assigned_person_id?: number;
  issue_type_id?: number;
  start_date?: string;     // YYYY-MM-DD
  end_date?: string;       // YYYY-MM-DD
  sort?: string;           // field name whitelist
  dir?: "asc" | "desc";
  page?: number;           // 1-based
  page_size?: number;      // 10 | 25 | 50 | 100
}

interface TicketListItem {
  id: number;
  status: "open" | "closed";
  substatus: SubstatusRef | null;
  category: CategoryRef;
  department: DepartmentRef;
  assignedPerson: PersonRef | null;
  reportedByPerson: PersonRef | null;
  location: string | null;
  enteredDate: string;       // ISO 8601
  lastModified: string;      // ISO 8601
  searchSnippet: string | null; // ts_headline output when q provided
  mediaCount: number;
}

interface TicketDetail extends TicketListItem {
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  parentId: number | null;
  contactMethod: ContactMethodRef | null;
  issueType: IssueTypeRef | null;
  closedDate: string | null;
  customFields: Record<string, unknown> | null;
  enteredByPerson: PersonRef | null;
  client: ClientRef | null;
  slaDueDate: string | null;  // entered_date + sla_days
  isOverdue: boolean;
}

interface CreateTicketRequest {
  categoryId: number;        // required; active category
  description: string;       // required; min 1 char
  location?: string;         // required if no lat/lon
  latitude?: number;         // -90 to 90
  longitude?: number;        // -180 to 180
  city?: string;
  state?: string;
  zip?: string;
  reportedByPersonId?: number;
  assignedPersonId?: number;
  issueTypeId?: number;
  contactMethodId?: number;
  customFields?: Record<string, unknown>;
}

interface CloseTicketRequest {
  substatusId: number;       // required
  parentId?: number;         // required when substatus = Duplicate
  notes?: string;
  notifyReporter?: boolean;
}

interface AssignTicketRequest {
  personId: number;          // required; must be staff person
  notes?: string;
  notifyAssignee?: boolean;
}

interface BulkTicketRequest {
  ticketIds: number[];       // required; min 1
  action: "assign" | "close" | "changeStatus";
  assignedPersonId?: number; // for action=assign
  substatusId?: number;      // for action=close
  status?: string;           // for action=changeStatus
}
```

---

#### Ticket History (Action Log)

```typescript
interface TicketHistoryEntry {
  id: number;
  ticketId: number;
  action: ActionRef;
  enteredByPerson: PersonRef | null;
  actionPerson: PersonRef | null;
  enteredDate: string;   // ISO 8601
  actionDate: string;    // ISO 8601
  notes: string | null;
  sentNotifications: string[] | null; // email addresses
  media: MediaRef[];
}

interface LogActionRequest {
  actionId: number;          // required; department-type action
  notes?: string;            // required when action = "response"
  notifyReporter?: boolean;
  notifyAssignee?: boolean;
  actionPersonId?: number;   // defaults to current user
}
```

---

#### People

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/people` | JWT | List people (search + role filter, paginated) |
| POST | `/api/people` | JWT (admin) | Create person |
| GET | `/api/people/{id}` | JWT | Person detail |
| PUT | `/api/people/{id}` | JWT (admin) | Full update |
| PATCH | `/api/people/{id}` | JWT | Partial update (own record or admin) |
| DELETE | `/api/people/{id}` | JWT (admin) | Delete person |
| GET | `/api/people/{id}/tickets` | JWT | Tickets for person |

```typescript
interface PersonDetail {
  id: number;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  organization: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  department: DepartmentRef | null;
  username: string | null;
  role: "admin" | "staff" | "public" | null;
  emails: PersonEmail[];
  phones: PersonPhone[];
  addresses: PersonAddress[];
}

interface PersonEmail {
  id?: number;
  email: string;
  label: "Home" | "Work" | "Other";
  usedForNotifications: boolean;
}

interface PersonPhone {
  id?: number;
  number: string;
  label: "Main" | "Mobile" | "Work" | "Home" | "Fax" | "Pager" | "Other";
}

interface PersonAddress {
  id?: number;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  label: "Home" | "Business" | "Rental";
}
```

---

#### Departments

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/departments` | JWT | List all departments |
| POST | `/api/departments` | JWT (admin) | Create department |
| GET | `/api/departments/{id}` | JWT | Department detail |
| PUT | `/api/departments/{id}` | JWT (admin) | Update department |
| DELETE | `/api/departments/{id}` | JWT (admin) | Delete department |
| GET | `/api/departments/{id}/categories` | JWT | Categories in department |

```typescript
interface DepartmentDetail {
  id: number;
  name: string;
  defaultPerson: PersonRef | null;
  categoryCount: number;
  actionIds: number[];  // allowed action type IDs
}

interface CreateDepartmentRequest {
  name: string;          // required; max 128 chars
  defaultPersonId?: number;
  actionIds?: number[];  // department_actions entries
}
```

---

#### Categories and Category Groups

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/category-groups` | JWT | List category groups |
| POST | `/api/category-groups` | JWT (admin) | Create category group |
| PUT | `/api/category-groups/{id}` | JWT (admin) | Update category group |
| DELETE | `/api/category-groups/{id}` | JWT (admin) | Delete category group |
| GET | `/api/categories` | JWT | List categories |
| POST | `/api/categories` | JWT (admin) | Create category |
| GET | `/api/categories/{id}` | JWT | Category detail |
| PUT | `/api/categories/{id}` | JWT (admin) | Update category |
| DELETE | `/api/categories/{id}` | JWT (admin) | Delete category |
| GET | `/api/categories/public` | None | Public-postable categories |
| GET | `/api/categories/{id}/action-responses/{actionId}` | JWT | Response template |

```typescript
interface CategoryDetail {
  id: number;
  name: string;
  description: string | null;
  department: DepartmentRef;
  defaultPerson: PersonRef | null;
  categoryGroup: CategoryGroupRef | null;
  active: boolean;
  featured: boolean;
  displayPermissionLevel: "staff" | "public" | "anonymous";
  postingPermissionLevel: "staff" | "public" | "anonymous";
  slaDays: number | null;
  notificationReplyEmail: string | null;
  autoCloseIsActive: boolean;
  autoCloseSubstatusId: number | null;
  actionResponses: CategoryActionResponse[];
}

interface CategoryActionResponse {
  id?: number;
  actionId: number;
  template: string | null;
  replyEmail: string | null;
}
```

---

#### Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | JWT | Stat card counts |
| GET | `/api/dashboard/chart` | JWT | Donut chart data |
| GET | `/api/geoclusters` | JWT | Cluster data (zoom param) |

```typescript
interface DashboardStats {
  totalOpen: number;
  openedToday: number;
  closedToday: number;
  overdue: number;
}

interface DashboardChartData {
  groupBy: "status" | "category" | "department";
  segments: { label: string; count: number; color?: string }[];
}

interface GeoclusterResponse {
  clusters: {
    id: number;
    level: number;
    center: { lat: number; lon: number };
    ticketCount: number;
  }[];
}
```

---

#### Media

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/media/{mediaId}` | JWT* | Serve full-resolution file |
| GET | `/api/media/{mediaId}/thumbnail` | JWT* | Serve 150×150 thumbnail |

*JWT optional for public-category tickets.

```typescript
interface MediaRef {
  id: number;
  filename: string;
  mimeType: string;
  uploaded: string;    // ISO 8601
  uploadedBy: PersonRef | null;
  url: string;         // /api/media/{id}
  thumbnailUrl: string; // /api/media/{id}/thumbnail
}
```

---

#### Bookmarks

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/bookmarks` | JWT | List user's saved searches |
| POST | `/api/bookmarks` | JWT | Create saved search |
| DELETE | `/api/bookmarks/{id}` | JWT | Delete saved search |

```typescript
interface Bookmark {
  id: number;
  type: string;          // "search"
  name: string | null;
  requestUri: string;    // URL query string snapshot
}
```

---

#### Lookup Tables (Admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/substatus` | JWT | List substatuses |
| POST | `/api/substatus` | JWT (admin) | Create substatus |
| PUT | `/api/substatus/{id}` | JWT (admin) | Update substatus |
| DELETE | `/api/substatus/{id}` | JWT (admin) | Delete substatus |
| GET | `/api/issue-types` | JWT | List issue types |
| POST | `/api/issue-types` | JWT (admin) | Create issue type |
| PUT | `/api/issue-types/{id}` | JWT (admin) | Update issue type |
| DELETE | `/api/issue-types/{id}` | JWT (admin) | Delete issue type |
| GET | `/api/contact-methods` | JWT | List contact methods |
| POST | `/api/contact-methods` | JWT (admin) | Create contact method |
| PUT | `/api/contact-methods/{id}` | JWT (admin) | Update contact method |
| DELETE | `/api/contact-methods/{id}` | JWT (admin) | Delete contact method |
| GET | `/api/actions` | JWT | List action types |

---

#### Clients (Open311 API Key Management)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/clients` | JWT (admin) | List Open311 clients |
| POST | `/api/clients` | JWT (admin) | Create client + generate API key |
| GET | `/api/clients/{id}` | JWT (admin) | Client detail |
| PUT | `/api/clients/{id}` | JWT (admin) | Update client |
| DELETE | `/api/clients/{id}` | JWT (admin) | Delete client |

```typescript
interface ClientDetail {
  id: number;
  name: string;
  url: string | null;
  apiKey: string;          // UUID; shown only on create or explicit reveal
  contactPerson: PersonRef;
  contactMethod: ContactMethodRef | null;
}
```

---

#### Geocode Proxy

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/geocode` | None | Address autocomplete proxy |

```typescript
// Query params: q (string, address query), limit (int, default 5)
interface GeocodeResult {
  results: {
    display_name: string;
    lat: number;
    lon: number;
    boundingBox: [number, number, number, number];
  }[];
}
```

---

### 4.4 Common Reference Types

```typescript
interface PersonRef {
  id: number;
  firstname: string | null;
  lastname: string | null;
  organization: string | null;
}

interface CategoryRef {
  id: number;
  name: string;
  department: DepartmentRef;
}

interface DepartmentRef {
  id: number;
  name: string;
}

interface CategoryGroupRef {
  id: number;
  name: string;
}

interface SubstatusRef {
  id: number;
  name: string;
  status: "open" | "closed";
}

interface ActionRef {
  id: number;
  name: string;
  type: "system" | "department";
  description: string;
}

interface IssueTypeRef {
  id: number;
  name: string;
}

interface ContactMethodRef {
  id: number;
  name: string;
}

interface ClientRef {
  id: number;
  name: string;
}
```

---
