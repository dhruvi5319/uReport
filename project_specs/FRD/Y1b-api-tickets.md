---

## Y1b: REST API — Tickets, History, Search, Media, Bookmarks, Open311

**Base path:** `/api/v1/` (internal), `/open311/` (Open311 GeoReport v2).

---

### Ticket Endpoints

#### POST /api/v1/tickets
Create a new ticket.

**Auth:** anonymous/public/staff depending on category's `postingPermissionLevel`.

**Request:**
```json
{
  "category_id": 5,
  "description": "Large pothole on Main St near Oak Ave",
  "location": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "latitude": 39.7817,
  "longitude": -89.6501,
  "reportedByPerson_id": null,
  "reporterFirstname": "John",
  "reporterLastname": "Doe",
  "reporterEmail": "john.doe@email.com",
  "issueType_id": 5,
  "contactMethod_id": 3,
  "responseMethod_id": 1,
  "customFields": { "severity": "High" },
  "additionalFields": {}
}
```

**Response 201:**
```json
{
  "id": 1001,
  "status": "open",
  "substatus": "Open",
  "category_id": 5,
  "categoryName": "Pothole",
  "description": "Large pothole on Main St near Oak Ave",
  "location": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "latitude": 39.7817,
  "longitude": -89.6501,
  "enteredDate": "2026-06-24T10:00:00Z",
  "lastModified": "2026-06-24T10:00:00Z",
  "assignedPerson_id": null,
  "reportedByPerson_id": 87,
  "customFields": { "severity": "High" }
}
```

---

#### GET /api/v1/tickets/{id}
Get ticket detail.

**Auth:** anonymous/public/staff per category `displayPermissionLevel`.

**Response 200:** Full ticket object plus `historyCount`, `mediaCount`.

**Errors:** 404, 403.

---

#### PATCH /api/v1/tickets/{id}
Update ticket fields.

**Auth:** staff.

**Request:** Any subset of updatable ticket fields (description, category_id, location fields, assignedPerson_id, customFields, additionalFields, issueType_id, contactMethod_id, responseMethod_id).

**Response 200:** Updated ticket object.

---

#### PATCH /api/v1/tickets/{id}/assign
Assign ticket to a staff person.

**Auth:** staff.

**Request:** `{ "assignedPerson_id": 12 }`

**Response 200:** Updated ticket object.

**Errors:** 404, 422 INVALID_ASSIGNEE.

---

#### PATCH /api/v1/tickets/{id}/close
Close ticket with substatus.

**Auth:** staff.

**Request:** `{ "substatus_id": 2, "notes": "Pothole filled 2026-06-24" }`

**Response 200:** Updated ticket with `status = "closed"`.

**Errors:** 404, 422 INVALID_SUBSTATUS, 422 INVALID_TRANSITION.

---

#### PATCH /api/v1/tickets/{id}/reopen
Reopen a closed ticket.

**Auth:** staff.

**Request:** `{}` (empty; optional `notes`)

**Response 200:** Updated ticket with `status = "open"`.

**Errors:** 404, 422 INVALID_TRANSITION.

---

#### PATCH /api/v1/tickets/{id}/duplicate
Mark ticket as duplicate of another.

**Auth:** staff.

**Request:** `{ "parent_id": 500 }`

**Response 200:** Updated ticket with `parent_id` set and `status = "closed"`.

**Errors:** 404, 422 CIRCULAR_DUPLICATE.

---

#### POST /api/v1/tickets/{id}/comments
Add a comment to a ticket.

**Auth:** staff.

**Request:** `{ "notes": "Forwarded to Streets department for review." }`

**Response 201:** History entry object.

---

#### DELETE /api/v1/tickets/{id}
Delete ticket (hard delete; admin use only).

**Auth:** staff.

**Response 204.**

---

### Ticket History Endpoints

#### GET /api/v1/tickets/{id}/history
Get full history for a ticket, ordered by enteredDate ASC.

**Auth:** staff.

**Response 200:**
```json
{
  "ticketId": 1001,
  "history": [
    {
      "id": 2001,
      "action_id": 1,
      "actionName": "open",
      "actionType": "system",
      "enteredByPerson_id": 42,
      "enteredByPersonName": "Jane Smith",
      "actionPerson_id": null,
      "actionPersonName": null,
      "enteredDate": "2026-06-24T10:00:00Z",
      "actionDate": "2026-06-24T10:00:00Z",
      "notes": null,
      "data": null,
      "sentNotifications": "john.doe@email.com",
      "renderedDescription": "Ticket opened by Jane Smith"
    }
  ]
}
```

---

#### GET /api/v1/tickets/{id}/history/{historyId}
Get single history entry.

**Auth:** staff.

**Response 200:** Single history entry object.

---

### Ticket Search Endpoints

#### GET /api/v1/tickets
Search and list tickets with filters.

**Auth:** anonymous/public/staff (per category display permissions; staff see all).

**Query params:** See F11 §Search Filter Parameters.

**Response 200:**
```json
{
  "total": 342,
  "page": 1,
  "limit": 25,
  "tickets": [ { ticket summary objects... } ]
}
```

---

#### GET /api/v1/tickets/export
Export search results as CSV or print HTML.

**Auth:** staff.

**Query params:** Same as GET /api/v1/tickets plus `format=csv` or `format=print`.

**Response:** `text/csv` stream (CSV) or `text/html` (print).

---

#### GET /api/v1/tickets/map
Map view with geo-cluster counts.

**Auth:** anonymous/public/staff.

**Query params:** Same filters as search, plus `zoomLevel` (0–6, default 3).

**Response 200:**
```json
{
  "clusters": [
    { "cluster_id": 101, "count": 12, "lat": 39.781, "long": -89.650 },
    { "cluster_id": 102, "count": 5,  "lat": 39.795, "long": -89.640 }
  ]
}
```

---

### Media Endpoints

#### POST /api/v1/tickets/{id}/media
Upload files to a ticket.

**Auth:** staff/public per category posting permission.

**Content-Type:** `multipart/form-data`.

**Response 201:** Array of media objects.
```json
[
  {
    "id": 301,
    "ticket_id": 1001,
    "filename": "pothole.jpg",
    "internalFilename": "3f7c9b12-uuid.jpg",
    "mime_type": "image/jpeg",
    "uploaded": "2026-06-24T10:05:00Z",
    "url": "/api/v1/media/3f7c9b12-uuid.jpg",
    "thumbnailUrl": "/api/v1/media/3f7c9b12-uuid.jpg/thumbnail"
  }
]
```

---

#### GET /api/v1/tickets/{id}/media
List media for a ticket.

**Auth:** per category display permission.

**Response 200:** Array of media objects.

---

#### DELETE /api/v1/tickets/{id}/media/{mediaId}
Delete media item and file from disk.

**Auth:** staff.

**Response 204.**

---

#### GET /api/v1/media/{internalFilename}
Serve original file.

**Auth:** per category display permission.

**Response:** Binary file stream with appropriate Content-Type.

**Errors:** 404, 403.

---

#### GET /api/v1/media/{internalFilename}/thumbnail
Serve thumbnail (generated on first request).

**Auth:** per category display permission.

**Response:** Binary JPEG stream `Content-Type: image/jpeg`.

**Errors:** 404, 415 (non-image file).

---

### Bookmark Endpoints

#### GET /api/v1/bookmarks
List current user's bookmarks.

**Auth:** staff.

**Response 200:**
```json
[
  { "id": 1, "type": "search", "name": "Open Potholes", "requestUri": "/api/v1/tickets?status=open&category_id=5", "createdAt": "2026-06-01T09:00:00Z" }
]
```

---

#### POST /api/v1/bookmarks
Create bookmark.

**Auth:** staff.

**Request:** `{ "name": "Open Potholes", "requestUri": "/api/v1/tickets?status=open&category_id=5" }`

**Response 201:** Bookmark object.

**Errors:** 422 MISSING_REQUIRED_FIELD, 422 INVALID_URI.

---

#### DELETE /api/v1/bookmarks/{id}
Delete bookmark.

**Auth:** staff.

**Response 204.**

**Errors:** 404, 403 PERMISSION_DENIED.

---

### Open311 GeoReport v2 Endpoints

All Open311 endpoints support `?format=json` (default) and `?format=xml`.

---

#### GET /open311/discovery
Return API discovery metadata.

**Auth:** None.

**Response 200 (JSON):**
```json
{
  "changeset": "2026-06-24T00:00:00Z",
  "contact": "help@city.gov",
  "key_service": "https://city.gov/open311/key",
  "endpoints": [
    {
      "specification": "http://wiki.open311.org/GeoReport_v2",
      "url": "https://city.gov/open311",
      "changeset": "2026-06-24T00:00:00Z",
      "type": "production",
      "formats": ["application/json", "text/xml"]
    }
  ]
}
```

---

#### GET /open311/services
List all active, postable services.

**Auth:** None.

**Response 200:** JSON array or XML document.
```json
[
  {
    "service_code": "5",
    "service_name": "Pothole",
    "description": "Report a pothole",
    "metadata": "true",
    "type": "realtime",
    "keywords": "Pothole",
    "group": "Streets"
  }
]
```

---

#### GET /open311/services/{service_code}
Get single service with attribute schema.

**Auth:** None.

**Response 200:**
```json
{
  "service_code": "5",
  "attributes": [
    {
      "variable": true,
      "code": "severity",
      "datatype": "singlevaluelist",
      "required": false,
      "description": "Severity of the pothole",
      "order": 1,
      "values": [
        { "key": "Low", "name": "Low" },
        { "key": "High", "name": "High" }
      ]
    }
  ]
}
```

---

#### POST /open311/requests
Submit a new service request.

**Auth:** `api_key` parameter (required).

**Request (form-encoded or JSON):**
```
api_key=abc123&service_code=5&lat=39.78&long=-89.65&description=Big+pothole&first_name=John&last_name=Doe&email=john@email.com
```

**Response 200:**
```json
[
  {
    "service_request_id": "1001",
    "service_notice": "",
    "account_id": ""
  }
]
```

---

#### GET /open311/requests
List/filter service requests.

**Auth:** None.

**Query params:** `service_request_id`, `service_code`, `status` (open/closed), `start_date`, `end_date`, `lat`, `long`, `radius`, `keyword`, `page`, `per_page` (max 200).

**Response 200:** JSON array or XML document of request objects.
```json
[
  {
    "service_request_id": "1001",
    "status": "open",
    "status_notes": "Open",
    "service_name": "Pothole",
    "service_code": "5",
    "description": "Large pothole",
    "agency_responsible": "Bob Jones",
    "requested_datetime": "2026-06-24T10:00:00Z",
    "updated_datetime": "2026-06-24T10:00:00Z",
    "expected_datetime": "2026-07-01T10:00:00Z",
    "lat": "39.7817",
    "long": "-89.6501",
    "address": "123 Main St",
    "address_id": "201",
    "zipcode": "62701",
    "media_url": "https://city.gov/api/v1/media/3f7c9b12.jpg"
  }
]
```

---

#### GET /open311/requests/{service_request_id}
Get single service request by ID.

**Auth:** None.

**Response 200:** JSON array (single element) or XML document (single element).

**Errors:** 404 REQUEST_NOT_FOUND.

---

### Open311 XML Response Shape

For all Open311 endpoints with `?format=xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<service_requests>
  <request>
    <service_request_id>1001</service_request_id>
    <status>open</status>
    <status_notes>Open</status_notes>
    <service_name>Pothole</service_name>
    <service_code>5</service_code>
    <description>Large pothole</description>
    <agency_responsible>Bob Jones</agency_responsible>
    <requested_datetime>2026-06-24T10:00:00Z</requested_datetime>
    <updated_datetime>2026-06-24T10:00:00Z</updated_datetime>
    <expected_datetime>2026-07-01T10:00:00Z</expected_datetime>
    <lat>39.7817</lat>
    <long>-89.6501</long>
    <address>123 Main St</address>
    <address_id>201</address_id>
    <zipcode>62701</zipcode>
    <media_url>https://city.gov/api/v1/media/3f7c9b12.jpg</media_url>
  </request>
</service_requests>
```

No XML attributes. All values as text content of elements. Root element matches collection name.
