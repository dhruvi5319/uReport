## Section 03: API Design — TypeScript Interfaces & Endpoint Reference

**Base path:** `/api/v1/` (internal REST), `/open311/` (GeoReport v2 external API)  
**Auth:** `Authorization: Bearer <jwt>` unless noted  
**Content-Type:** `application/json`  
**Error shape:** `{ "error": "ERROR_CODE", "message": "..." }`  
**Pagination:** default `limit=25`, `offset=0`  

---

## TypeScript Interface Definitions

These interfaces are the canonical contract between the React SPA and the Spring Boot API. Generated from FRD response shapes.

### Auth Types

```typescript
// types/auth.types.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;       // seconds
  role: 'staff' | 'public' | 'anonymous';
  personId: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}
```

### Ticket Types

```typescript
// types/ticket.types.ts

export type TicketStatus = 'open' | 'closed';
export type PermissionLevel = 'anonymous' | 'public' | 'staff';

export interface Ticket {
  id: number;
  parent_id: number | null;
  category_id: number;
  categoryName: string;
  issueType_id: number | null;
  issueTypeName: string | null;
  client_id: number | null;
  enteredByPerson_id: number | null;
  reportedByPerson_id: number | null;
  assignedPerson_id: number | null;
  assignedPersonName: string | null;
  contactMethod_id: number | null;
  responseMethod_id: number | null;
  enteredDate: string;           // ISO 8601
  lastModified: string;          // ISO 8601
  closedDate: string | null;     // ISO 8601
  addressId: number | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: TicketStatus;
  substatus_id: number | null;
  substatusName: string | null;
  additionalFields: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
  description: string;
  historyCount?: number;
  mediaCount?: number;
}

export interface TicketSummary {
  id: number;
  status: TicketStatus;
  substatusName: string | null;
  categoryName: string;
  description: string;
  location: string | null;
  city: string | null;
  enteredDate: string;
  lastModified: string;
  assignedPersonName: string | null;
}

export interface TicketListResponse {
  total: number;
  page: number;
  limit: number;
  tickets: TicketSummary[];
}

export interface CreateTicketRequest {
  category_id: number;
  description: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  reportedByPerson_id?: number | null;
  reporterFirstname?: string;
  reporterLastname?: string;
  reporterEmail?: string;
  assignedPerson_id?: number | null;
  issueType_id?: number | null;
  contactMethod_id?: number | null;
  responseMethod_id?: number | null;
  customFields?: Record<string, unknown>;
  additionalFields?: Record<string, unknown>;
  client_id?: number | null;
}

export interface UpdateTicketRequest {
  category_id?: number;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  assignedPerson_id?: number | null;
  issueType_id?: number | null;
  contactMethod_id?: number | null;
  responseMethod_id?: number | null;
  customFields?: Record<string, unknown>;
  additionalFields?: Record<string, unknown>;
}

export interface CloseTicketRequest {
  substatus_id: number;
  notes?: string;
}

export interface DuplicateTicketRequest {
  parent_id: number;
}

export interface AssignTicketRequest {
  assignedPerson_id: number;
}

export interface CommentRequest {
  notes: string;
}
```

### Ticket History Types

```typescript
// types/ticket.types.ts (continued)

export interface TicketHistoryEntry {
  id: number;
  ticket_id: number;
  action_id: number;
  actionName: string;
  actionType: 'system' | 'department';
  enteredByPerson_id: number | null;
  enteredByPersonName: string | null;
  actionPerson_id: number | null;
  actionPersonName: string | null;
  enteredDate: string;    // ISO 8601
  actionDate: string;     // ISO 8601
  notes: string | null;
  data: Record<string, unknown> | null;
  sentNotifications: string | null;
  renderedDescription: string;
}

export interface TicketHistoryResponse {
  ticketId: number;
  history: TicketHistoryEntry[];
}
```

### Search Types

```typescript
// types/search.types.ts

export interface TicketSearchParams {
  q?: string;
  category_id?: number;
  department_id?: number;
  assignedPerson_id?: number;
  enteredByPerson_id?: number;
  reportedByPerson_id?: number;
  status?: 'open' | 'closed';
  substatus_id?: number;
  contactMethod_id?: number;
  client_id?: number;
  issueType_id?: number;
  enteredDateFrom?: string;   // ISO date
  enteredDateTo?: string;     // ISO date
  closedDateFrom?: string;    // ISO date
  closedDateTo?: string;      // ISO date
  city?: string;
  zip?: string;
  lat?: number;
  long?: number;
  radius?: number;            // meters
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface MapCluster {
  cluster_id: number;
  count: number;
  lat: number;
  long: number;
}

export interface MapViewResponse {
  clusters: MapCluster[];
}
```

### Person Types

```typescript
// types/person.types.ts

export type PersonRole = 'staff' | 'public' | 'anonymous';

export interface PersonEmail {
  id: number;
  person_id: number;
  email: string;
  label: string | null;
  usedForNotifications: boolean;
}

export interface PersonPhone {
  id: number;
  person_id: number;
  number: string;
  label: string | null;
}

export interface PersonAddress {
  id: number;
  person_id: number;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  label: string | null;
}

export interface Person {
  id: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  organization: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  department_id: number | null;
  departmentName: string | null;
  username: string | null;
  role: PersonRole | null;
  emails?: PersonEmail[];
  phones?: PersonPhone[];
  addresses?: PersonAddress[];
}

export interface PersonListResponse {
  total: number;
  page: number;
  limit: number;
  people: Person[];
}

export interface CreatePersonRequest {
  firstname: string;
  lastname: string;
  middlename?: string;
  organization?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  department_id?: number | null;
  username?: string;
  password?: string;
  role?: PersonRole;
  emails?: Omit<PersonEmail, 'id' | 'person_id'>[];
  phones?: Omit<PersonPhone, 'id' | 'person_id'>[];
  addresses?: Omit<PersonAddress, 'id' | 'person_id'>[];
}
```

### Category Types

```typescript
// types/category.types.ts

export interface CustomFieldOption {
  key: string;
  name: string;
}

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'singlevaluelist' | 'multivaluelist' | 'datetime' | 'text';
  required: boolean;
  order: number;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  department_id: number | null;
  departmentName: string | null;
  defaultPerson_id: number | null;
  defaultPersonName: string | null;
  categoryGroup_id: number | null;
  categoryGroupName: string | null;
  active: boolean;
  featured: boolean;
  displayPermissionLevel: PermissionLevel;
  postingPermissionLevel: PermissionLevel;
  customFields: CustomFieldDefinition[] | null;
  slaDays: number | null;
  notificationReplyEmail: string | null;
  autoCloseIsActive: boolean;
  autoCloseSubstatus_id: number | null;
  lastModified: string;
}

export interface CategoryGroup {
  id: number;
  name: string;
  ordering: number;
  categoryCount?: number;
  categories?: Category[];
}
```

### Admin Types

```typescript
// types/admin.types.ts

export interface Department {
  id: number;
  name: string;
  defaultPerson_id: number | null;
  defaultPersonName: string | null;
  categoryCount?: number;
  staffCount?: number;
}

export interface Substatus {
  id: number;
  name: string;
  description: string | null;
  status: 'open' | 'closed';
  isDefault: boolean;
  isSystem: boolean;
}

export interface Action {
  id: number;
  name: string;
  description: string | null;
  type: 'system' | 'department';
  template: string | null;
  replyEmail: string | null;
}

export interface Client {
  id: number;
  name: string;
  url: string | null;
  contactPerson_id: number | null;
  contactPersonName: string | null;
  contactMethod_id: number | null;
  contactMethodName: string | null;
  rawApiKey?: string;    // only present on create / key regeneration
}

export interface ContactMethod {
  id: number;
  name: string;
  isSystem: boolean;
}

export interface IssueType {
  id: number;
  name: string;
  isSystem: boolean;
}

export interface Bookmark {
  id: number;
  person_id: number;
  type: string;
  name: string;
  requestUri: string;
  createdAt: string;
}

export interface ResponseTemplate {
  id: number;
  name: string;
  template: string;
  action_id: number | null;
  actionName: string | null;
}

export interface CategoryActionResponse {
  id: number;
  category_id: number;
  action_id: number;
  actionName: string;
  template: string | null;
  replyEmail: string | null;
}
```

### Media Types

```typescript
// types/media.types.ts

export interface MediaItem {
  id: number;
  ticket_id: number;
  filename: string;
  internalFilename: string;
  mime_type: string;
  uploaded: string;    // ISO 8601
  person_id: number | null;
  url: string;
  thumbnailUrl: string;
}
```

### Open311 Types

```typescript
// types/open311.types.ts

export interface Open311ServiceAttribute {
  variable: boolean;
  code: string;
  datatype: string;
  required: boolean;
  description: string;
  order: number;
  values?: { key: string; name: string }[];
}

export interface Open311Service {
  service_code: string;
  service_name: string;
  description: string | null;
  metadata: 'true' | 'false';
  type: 'realtime';
  keywords: string;
  group: string | null;
  attributes?: Open311ServiceAttribute[];
}

export interface Open311ServiceRequest {
  service_request_id: string;
  status: 'open' | 'closed';
  status_notes: string | null;
  service_name: string;
  service_code: string;
  description: string | null;
  agency_responsible: string | null;
  requested_datetime: string;    // ISO 8601
  updated_datetime: string;      // ISO 8601
  expected_datetime: string | null;
  lat: string | null;
  long: string | null;
  address: string | null;
  address_id: string | null;
  zipcode: string | null;
  media_url: string | null;
}

export interface Open311PostResponse {
  service_request_id: string;
  service_notice: string;
  account_id: string;
}

export interface MetricsResponse {
  category_id: number;
  categoryName: string;
  numDays: number;
  effectiveDate: string;
  onTimePercentage: number;
  closedCount: number;
  onTimeCount: number;
}

export interface ReportResponse {
  reportType: string;
  generatedAt: string;
  data: Record<string, unknown>[];
}
```

---

## API Endpoint Summary

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | none | Authenticate, receive JWT + refresh token |
| POST | `/api/v1/auth/refresh` | none | Rotate tokens |
| POST | `/api/v1/auth/logout` | Bearer JWT | Revoke tokens |
| GET | `/callback` | none (OAuth code) | OAuth IdP callback |

### Tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/tickets` | per category posting permission | Create ticket |
| GET | `/api/v1/tickets` | per category display permission | Search/list tickets |
| GET | `/api/v1/tickets/export` | staff | CSV or print export |
| GET | `/api/v1/tickets/map` | any | Geo-cluster map view |
| GET | `/api/v1/tickets/{id}` | per category display permission | Ticket detail |
| PATCH | `/api/v1/tickets/{id}` | staff | Update ticket fields |
| PATCH | `/api/v1/tickets/{id}/assign` | staff | Assign to person |
| PATCH | `/api/v1/tickets/{id}/close` | staff | Close with substatus |
| PATCH | `/api/v1/tickets/{id}/reopen` | staff | Reopen closed ticket |
| PATCH | `/api/v1/tickets/{id}/duplicate` | staff | Mark as duplicate |
| POST | `/api/v1/tickets/{id}/comments` | staff | Add comment |
| DELETE | `/api/v1/tickets/{id}` | staff | Hard delete |
| GET | `/api/v1/tickets/{id}/history` | staff | Full history log |
| GET | `/api/v1/tickets/{id}/history/{historyId}` | staff | Single history entry |
| POST | `/api/v1/tickets/{id}/media` | per category posting permission | Upload files |
| GET | `/api/v1/tickets/{id}/media` | per category display permission | List media |
| DELETE | `/api/v1/tickets/{id}/media/{mediaId}` | staff | Delete media |

### Media

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/media/{internalFilename}` | per category display | Serve original file |
| GET | `/api/v1/media/{internalFilename}/thumbnail` | per category display | Serve thumbnail |

### People

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/people` | staff | List/search people |
| POST | `/api/v1/people` | staff | Create person |
| GET | `/api/v1/people/{id}` | staff | Person detail |
| PUT | `/api/v1/people/{id}` | staff | Replace person |
| PATCH | `/api/v1/people/{id}` | staff | Update person fields |
| DELETE | `/api/v1/people/{id}` | staff | Soft-delete person |
| GET | `/api/v1/people/{id}/tickets` | staff | Person's tickets |
| POST | `/api/v1/people/{id}/emails` | staff | Add email |
| PUT | `/api/v1/people/{id}/emails/{emailId}` | staff | Update email |
| DELETE | `/api/v1/people/{id}/emails/{emailId}` | staff | Remove email |
| POST | `/api/v1/people/{id}/phones` | staff | Add phone |
| PUT | `/api/v1/people/{id}/phones/{phoneId}` | staff | Update phone |
| DELETE | `/api/v1/people/{id}/phones/{phoneId}` | staff | Remove phone |
| POST | `/api/v1/people/{id}/addresses` | staff | Add address |
| PUT | `/api/v1/people/{id}/addresses/{addrId}` | staff | Update address |
| DELETE | `/api/v1/people/{id}/addresses/{addrId}` | staff | Remove address |

### Departments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/departments` | staff | List departments |
| POST | `/api/v1/departments` | staff | Create department |
| GET | `/api/v1/departments/{id}` | staff | Department detail |
| PUT | `/api/v1/departments/{id}` | staff | Update department |
| DELETE | `/api/v1/departments/{id}` | staff | Delete department |
| GET | `/api/v1/departments/{id}/people` | staff | Staff in department |
| GET | `/api/v1/departments/{id}/categories` | staff | Categories in department |
| PUT | `/api/v1/departments/{id}/categories` | staff | Set category associations |
| PUT | `/api/v1/departments/{id}/actions` | staff | Set action associations |

### Clients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/clients` | staff | List API clients |
| POST | `/api/v1/clients` | staff | Register client (returns rawApiKey once) |
| GET | `/api/v1/clients/{id}` | staff | Client detail |
| PATCH | `/api/v1/clients/{id}` | staff | Update / regenerate key |
| DELETE | `/api/v1/clients/{id}` | staff | Delete client |

### Categories & Groups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/categories` | per displayPermissionLevel | List categories |
| POST | `/api/v1/categories` | staff | Create category |
| GET | `/api/v1/categories/{id}` | per displayPermissionLevel | Category detail |
| PUT | `/api/v1/categories/{id}` | staff | Update category |
| DELETE | `/api/v1/categories/{id}` | staff | Delete category |
| GET | `/api/v1/categories/{id}/action-responses` | staff | List category action responses |
| POST | `/api/v1/categories/{id}/action-responses` | staff | Upsert category action response |
| DELETE | `/api/v1/categories/{id}/action-responses/{rid}` | staff | Delete category action response |
| GET | `/api/v1/category-groups` | staff | List groups |
| POST | `/api/v1/category-groups` | staff | Create group |
| GET | `/api/v1/category-groups/{id}` | staff | Group with categories |
| PUT | `/api/v1/category-groups/{id}` | staff | Update group |
| DELETE | `/api/v1/category-groups/{id}` | staff | Delete group |
| PUT | `/api/v1/category-groups/order` | staff | Reorder groups |

### Admin Lookups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/substatus` | staff | List substatuses |
| POST | `/api/v1/substatus` | staff | Create substatus |
| PATCH | `/api/v1/substatus/{id}` | staff | Update substatus |
| DELETE | `/api/v1/substatus/{id}` | staff | Delete substatus |
| GET | `/api/v1/actions` | staff | List actions |
| POST | `/api/v1/actions` | staff | Create department action |
| PATCH | `/api/v1/actions/{id}` | staff | Update action |
| DELETE | `/api/v1/actions/{id}` | staff | Delete action |
| GET | `/api/v1/contact-methods` | none | List contact methods |
| POST | `/api/v1/contact-methods` | staff | Create contact method |
| DELETE | `/api/v1/contact-methods/{id}` | staff | Delete contact method |
| GET | `/api/v1/issue-types` | none | List issue types |
| POST | `/api/v1/issue-types` | staff | Create issue type |
| DELETE | `/api/v1/issue-types/{id}` | staff | Delete issue type |
| GET | `/api/v1/bookmarks` | staff | List user's bookmarks |
| POST | `/api/v1/bookmarks` | staff | Create bookmark |
| DELETE | `/api/v1/bookmarks/{id}` | staff | Delete bookmark |
| GET | `/api/v1/response-templates` | staff | List response templates |
| POST | `/api/v1/response-templates` | staff | Create template |
| GET | `/api/v1/response-templates/{id}` | staff | Template detail |
| PUT | `/api/v1/response-templates/{id}` | staff | Update template |
| DELETE | `/api/v1/response-templates/{id}` | staff | Delete template |

### Metrics & Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/metrics` | staff | onTimePercentage for a category |
| GET | `/api/v1/reports/{reportType}` | staff | Canned report |
| GET | `/api/v1/locations` | staff | List canonical locations |
| GET | `/api/v1/locations/{id}` | staff | Location detail |
| POST | `/api/v1/admin/jobs/digest-notifications/run` | staff | Trigger digest job |
| POST | `/api/v1/admin/jobs/auto-close/run` | staff | Trigger auto-close job |
| POST | `/api/v1/admin/jobs/audit/run` | staff | Trigger audit job |

### Open311 GeoReport v2

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/open311/discovery` | none | API discovery metadata |
| GET | `/open311/services` | none | List active services (JSON or XML) |
| GET | `/open311/services/{service_code}` | none | Service with attribute schema |
| POST | `/open311/requests` | `api_key` param | Submit service request |
| GET | `/open311/requests` | none | Search service requests |
| GET | `/open311/requests/{service_request_id}` | none | Single service request |

---

## API Design Conventions

### Error Response Format

```json
{
  "error": "TICKET_NOT_FOUND",
  "message": "Ticket not found",
  "field": "id"
}
```

Multiple field errors:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    { "field": "description", "error": "DESCRIPTION_REQUIRED", "message": "Description is required" },
    { "field": "category_id", "error": "CATEGORY_NOT_FOUND", "message": "Category not found or inactive" }
  ]
}
```

### Pagination Response Envelope

All list endpoints return:
```json
{
  "total": 342,
  "page": 1,
  "limit": 25,
  "items": [ ... ]
}
```
(Field name for the array matches the resource: `tickets`, `people`, `categories`, etc.)

### Format Query Parameter

Open311 endpoints and ticket export endpoints support:
- `?format=json` — default
- `?format=xml` — Open311 byte-compatible XML
- `?format=csv` — staff only (tickets export)
- `?format=print` — staff only (tickets export, print HTML)

The `format` query param takes precedence over the `Accept` header.
