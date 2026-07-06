---

## Y1: API Endpoints — Consolidated REST Endpoint Catalog

**Base URL (internal CRM API):** `/api`  
**Base URL (Open311):** `/open311/v2`  
**Content-Type:** `application/json` (default); `application/xml` for Open311 XML responses  
**Authentication:** JWT in httpOnly cookie `auth_token` (all `/api/*` endpoints except public ones)  
**API Documentation:** OpenAPI 3.0 at `/v3/api-docs`; Swagger UI at `/swagger-ui.html`

---

### §Auth — Authentication Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| POST | `/api/auth/ldap` | None | LDAP credential login |
| GET | `/auth/cas/callback` | None | CAS service ticket validation callback |
| POST | `/api/auth/refresh` | httpOnly cookie | Refresh JWT |
| POST | `/api/auth/logout` | JWT | Logout; clear cookie |
| GET | `/api/auth/me` | JWT | Current authenticated user info |

**POST /api/auth/ldap — Request:**
```json
{ "username": "jdoe", "password": "secret" }
```

**POST /api/auth/ldap — Response 200:**
```json
{ "personId": 42, "role": "staff", "name": "Jane Doe", "expiresAt": "2026-07-07T08:00:00Z" }
```
*(JWT set as httpOnly cookie `auth_token`)*

**GET /api/auth/me — Response 200:**
```json
{ "personId": 42, "username": "jdoe", "role": "staff", "name": "Jane Doe",
  "departmentId": 3, "expiresAt": "2026-07-07T08:00:00Z" }
```

---

### §Open311 — Open311 / GeoReport v2 Endpoints (Frozen)

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/open311/v2/services` | None (api_key optional) | List service categories |
| GET | `/open311/v2/services/{service_code}` | None | Get single service |
| GET | `/open311/v2/requests` | None | List service requests |
| GET | `/open311/v2/requests/{service_request_id}` | None | Get single service request |
| POST | `/open311/v2/requests` | api_key [R] | Submit new service request |

**GET /open311/v2/services — Response 200 (JSON):**
```json
[
  {
    "service_code": "3",
    "service_name": "Pothole",
    "description": "Report a pothole in the roadway",
    "metadata": false,
    "type": "realtime",
    "keywords": "",
    "group": "Streets"
  }
]
```

**GET /open311/v2/requests — Query Params:**
`service_code`, `status`, `start_date`, `end_date`, `updated_before`, `updated_after`, `bbox`, `page_size` (default 1000), `page` (1-based)

**GET /open311/v2/requests — Response 200 (JSON):**
```json
[
  {
    "service_request_id": "123",
    "status": "open",
    "status_notes": "Received and being reviewed",
    "service_name": "Pothole",
    "service_code": "3",
    "description": "Large pothole near intersection",
    "agency_responsible": "Public Works",
    "service_notice": "",
    "requested_datetime": "2026-07-01T14:32:00Z",
    "updated_datetime": "2026-07-02T09:10:00Z",
    "expected_datetime": "2026-07-08T14:32:00Z",
    "address": "123 Main St",
    "address_id": "456",
    "zipcode": "47401",
    "lat": 39.165,
    "long": -86.526,
    "media_url": "https://ureport.city.gov/api/media/78"
  }
]
```

**POST /open311/v2/requests — Request (multipart/form-data):**
`api_key`, `service_code`, `lat`, `long`, `address_string`, `email`, `first_name`, `last_name`, `phone`, `description`, `media` (file)

**POST /open311/v2/requests — Response 200:**
Single-element array with the same service request object schema.

---

### §Tickets — Internal Ticket (Case) Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/tickets` | JWT | List tickets (paginated, filtered, searchable) |
| POST | `/api/tickets` | JWT | Create ticket (staff) |
| POST | `/api/tickets/public` | None | Create ticket (public submission) |
| POST | `/api/tickets/bulk` | JWT | Bulk operations |
| GET | `/api/tickets/export` | JWT | Export tickets as CSV |
| GET | `/api/tickets/{id}` | JWT | Get ticket detail |
| PATCH | `/api/tickets/{id}` | JWT | Update ticket fields |
| POST | `/api/tickets/{id}/close` | JWT | Close ticket with substatus |
| POST | `/api/tickets/{id}/reopen` | JWT | Reopen ticket |
| POST | `/api/tickets/{id}/assign` | JWT | Assign ticket |
| GET | `/api/tickets/{id}/history` | JWT | Get action timeline |
| POST | `/api/tickets/{id}/history` | JWT | Log action entry |
| GET | `/api/tickets/{id}/media` | JWT* | List media |
| POST | `/api/tickets/{id}/media` | JWT | Upload media |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | JWT | Delete media |

**GET /api/tickets — Query Params:**
`q`, `status`, `substatus_id`, `category_id`, `categoryGroup_id`, `department_id`, `assignedPerson_id`, `issueType_id`, `start_date`, `end_date`, `sort`, `dir`, `page` (1-based), `pageSize` (10/25/50/100), `overdue`

**GET /api/tickets — Response 200:**
```json
{
  "total": 142,
  "page": 1,
  "pageSize": 25,
  "rows": [
    {
      "id": 123,
      "status": "open",
      "substatus": null,
      "category": { "id": 3, "name": "Pothole", "group": "Streets" },
      "department": { "id": 2, "name": "Public Works" },
      "assignedPerson": { "id": 12, "name": "John Smith" },
      "reportedByPerson": { "id": 45, "name": "Jane Doe" },
      "location": "123 Main St",
      "latitude": 39.165,
      "longitude": -86.526,
      "enteredDate": "2026-07-01T14:32:00Z",
      "lastModified": "2026-07-02T09:10:00Z",
      "closedDate": null,
      "searchSnippet": "Large <mark>pothole</mark> near intersection",
      "mediaCount": 2
    }
  ]
}
```

**POST /api/tickets — Request:**
```json
{
  "category_id": 3,
  "description": "Large pothole near Main and 3rd",
  "location": "123 Main St",
  "latitude": 39.165,
  "longitude": -86.526,
  "reportedByPerson_id": 45,
  "assignedPerson_id": 12,
  "issueType_id": 5,
  "contactMethod_id": 1
}
```

**POST /api/tickets — Response 201:**
Full ticket detail object (same schema as GET /api/tickets/{id}).

**POST /api/tickets/{id}/close — Request:**
```json
{ "substatus_id": 1, "notes": "Repaired on 2026-07-05", "notifyReporter": true }
```

**POST /api/tickets/{id}/close — Response 200:** Updated ticket object.

**POST /api/tickets/bulk — Request:**
```json
{
  "action": "close",
  "ticketIds": [101, 102, 103],
  "substatus_id": 1,
  "notes": "Batch closed"
}
```
Actions: `close`, `assign`, `changeStatus`. `assignedPerson_id` used for `assign`.

**POST /api/tickets/bulk — Response 207:**
```json
{ "succeeded": [101, 102], "failed": [{"id": 103, "reason": "Not found"}] }
```

**POST /api/tickets/{id}/history — Request:**
```json
{ "action_id": 6, "notes": "Called reporter; issue being addressed.", "notifyReporter": true }
```

**GET /api/tickets/{id}/history — Response 200:**
```json
[
  {
    "id": 55,
    "action": { "id": 6, "name": "response", "type": "system" },
    "enteredByPerson": { "id": 12, "name": "John Smith" },
    "actionPerson": { "id": 45, "name": "Jane Doe" },
    "enteredDate": "2026-07-03T10:00:00Z",
    "actionDate": "2026-07-03T10:00:00Z",
    "notes": "Called reporter; issue being addressed.",
    "sentNotifications": ["jane.doe@email.com"]
  }
]
```

---

### §People — People Management Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/people` | JWT | List people (search, role filter) |
| POST | `/api/people` | JWT (admin) | Create person |
| GET | `/api/people/{id}` | JWT | Get person detail |
| PUT | `/api/people/{id}` | JWT (admin) | Update person |
| DELETE | `/api/people/{id}` | JWT (admin) | Delete person |
| GET | `/api/people/{id}/tickets` | JWT | Tickets for person |

**GET /api/people — Query Params:** `q`, `role`, `page`, `pageSize`

**GET /api/people/{id} — Response 200:**
```json
{
  "id": 42, "firstname": "Jane", "lastname": "Doe",
  "organization": null, "department": {"id": 3, "name": "Public Works"},
  "username": "jdoe", "role": "staff",
  "emails": [{"id": 1, "email": "jdoe@city.gov", "label": "Work", "usedForNotifications": true}],
  "phones": [{"id": 2, "number": "555-1234", "label": "Work"}],
  "addresses": []
}
```

---

### §Departments — Department Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/departments` | JWT | List departments |
| POST | `/api/departments` | JWT (admin) | Create department |
| GET | `/api/departments/{id}` | JWT | Department detail |
| PUT | `/api/departments/{id}` | JWT (admin) | Update department |
| DELETE | `/api/departments/{id}` | JWT (admin) | Delete department |
| GET | `/api/departments/{id}/categories` | JWT | Categories for department |

---

### §Categories — Category Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/categories` | JWT | List categories |
| POST | `/api/categories` | JWT (admin) | Create category |
| GET | `/api/categories/{id}` | JWT | Category detail |
| PUT | `/api/categories/{id}` | JWT (admin) | Update category |
| DELETE | `/api/categories/{id}` | JWT (admin) | Delete category |
| GET | `/api/categories/public` | None | Public-postable categories |
| GET | `/api/categories/{id}/action-responses/{actionId}` | JWT | Response template |
| GET | `/api/category-groups` | JWT | List category groups |
| POST | `/api/category-groups` | JWT (admin) | Create category group |
| PUT | `/api/category-groups/{id}` | JWT (admin) | Update category group |
| DELETE | `/api/category-groups/{id}` | JWT (admin) | Delete category group |

---

### §Actions — Action Type and History Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/actions` | JWT | List action types |
| POST | `/api/actions` | JWT (admin) | Create department action |
| PUT | `/api/actions/{id}` | JWT (admin) | Update action (template, replyEmail) |
| DELETE | `/api/actions/{id}` | JWT (admin) | Delete department action |

---

### §Admin — Lookup Table Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/substatuses` | JWT | List substatuses |
| POST | `/api/substatuses` | JWT (admin) | Create substatus |
| PUT | `/api/substatuses/{id}` | JWT (admin) | Update substatus |
| DELETE | `/api/substatuses/{id}` | JWT (admin) | Delete substatus |
| GET | `/api/issue-types` | JWT | List issue types |
| POST | `/api/issue-types` | JWT (admin) | Create issue type |
| PUT | `/api/issue-types/{id}` | JWT (admin) | Update issue type |
| DELETE | `/api/issue-types/{id}` | JWT (admin) | Delete issue type |
| GET | `/api/contact-methods` | JWT | List contact methods |
| POST | `/api/contact-methods` | JWT (admin) | Create contact method |
| PUT | `/api/contact-methods/{id}` | JWT (admin) | Update contact method |
| DELETE | `/api/contact-methods/{id}` | JWT (admin) | Delete contact method |
| GET | `/api/clients` | JWT (admin) | List Open311 clients |
| POST | `/api/clients` | JWT (admin) | Create client |
| GET | `/api/clients/{id}` | JWT (admin) | Client detail |
| PUT | `/api/clients/{id}` | JWT (admin) | Update client |
| POST | `/api/clients/{id}/regenerate-key` | JWT (admin) | Regenerate API key |
| DELETE | `/api/clients/{id}` | JWT (admin) | Delete client |

---

### §Media — Media / Photo Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/media/{id}` | JWT* | Serve full-resolution file |
| GET | `/api/media/{id}/thumbnail` | JWT* | Serve 150×150 thumbnail |

*Auth required for staff-only ticket media; public ticket media served without auth.

---

### §Dashboard — Dashboard Data Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/dashboard/stats` | JWT | Stat card counts |
| GET | `/api/dashboard/chart` | JWT | Donut chart data |
| GET | `/api/geoclusters` | JWT | Cluster data for map |

**GET /api/dashboard/stats — Response 200:**
```json
{
  "openCount": 145,
  "openedToday": 12,
  "closedToday": 7,
  "overdueCount": 23
}
```

**GET /api/dashboard/chart — Query:** `groupBy=status|category|department`

**GET /api/geoclusters — Query:** `zoom=0-6`, `status=open|closed`

---

### §Bookmarks — Saved Search Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/bookmarks` | JWT | List user's saved searches |
| POST | `/api/bookmarks` | JWT | Create saved search |
| DELETE | `/api/bookmarks/{id}` | JWT | Delete saved search |

---

### §Reports — Metrics and Reporting Endpoints

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/metrics` | JWT | KPI metrics + volume by day |
| GET | `/api/reports` | JWT | Grouped report data |
| GET | `/api/reports/export` | JWT | CSV export |

---

### §Geocode — Address Geocoding Proxy

| Method | Path | Auth | Summary |
|---|---|---|---|
| GET | `/api/geocode` | None | Address autocomplete proxy |

**GET /api/geocode — Query:** `q={address_string}`  
**Response 200:** Array of `{label, lat, lon, formattedAddress}` suggestions (proxied from Mapbox or Nominatim).

---

### Common Response Headers

| Header | Value |
|---|---|
| `Content-Type` | `application/json` (or `application/xml` for Open311) |
| `X-Total-Count` | Total item count (paginated list endpoints) |
| `Cache-Control` | `no-store` (auth endpoints); `max-age=300` (lookup tables) |
