---

## Y1a: REST API — Tickets, Search, Reporting, Geo

All endpoints are prefixed `/api/`. All responses use the JSON envelope `{ "data": …, "meta": …, "errors": [] }` unless noted. Authentication via `ureport_session` cookie or `Authorization: Bearer <token>`.

---

### §Tickets

#### POST /api/tickets
Create a new ticket.

**Auth:** Any caller (role and category permission checked).

**Request body:**
```json
{
  "title": "Pothole on Main St",
  "description": "Large pothole causing vehicle damage",
  "categoryId": 1,
  "lat": 43.1234,
  "lng": -79.5678,
  "address": "123 Main St, Anytown",
  "reporterName": "Jane Doe",
  "reporterEmail": "jane@example.com",
  "reporterPhone": "555-1234",
  "customFields": { "severity": "high" },
  "mediaUrls": []
}
```

**Response 201:**
```json
{
  "data": { "id": 101, "title": "Pothole on Main St", "status": "open", "…": "…" },
  "meta": {},
  "errors": []
}
```

---

#### GET /api/tickets
List/search tickets with filters.

**Auth:** Any caller (results filtered by role and category visibility).

**Query params:** `q`, `status`, `substatusId`, `categoryId`, `departmentId`, `assigneeId`, `reporterEmail`, `dateFrom`, `dateTo`, `lat`, `lng`, `radius`, `bbox`, `sort`, `page`, `perPage`, `export` — see F04.

**Response 200:**
```json
{
  "data": [ { ticket objects } ],
  "meta": { "total": 342, "page": 1, "perPage": 25, "pages": 14, "facets": { "…": {} } },
  "errors": []
}
```

**CSV Export:** Add `?export=csv` → `Content-Type: text/csv`, `Content-Disposition: attachment; filename="tickets.csv"`.

---

#### GET /api/tickets/{id}
Get single ticket detail.

**Auth:** Any (visibility-checked). **Response 200** with full ticket object including `substatus`, `category`, `department`, `assignee`, `reporter`, `sla`.

**Ticket object shape:**
```json
{
  "id": 101,
  "title": "Pothole on Main St",
  "description": "Large pothole…",
  "status": "open",
  "substatus": { "id": 4, "label": "Pending Parts", "primaryStatus": "open" },
  "category": { "id": 1, "name": "Pothole Repair" },
  "department": { "id": 3, "name": "Roads" },
  "assignee": { "id": 5, "name": "John Smith" },
  "reporter": { "name": "Jane Doe", "email": "jane@example.com" },
  "address": "123 Main St",
  "lat": 43.1234,
  "lng": -79.5678,
  "customFields": { "severity": "high" },
  "sla": { "slaDays": 5, "expectedCloseDate": "2026-06-28", "status": "on_time", "pctElapsed": 42 },
  "datetimeOpened": "2026-06-23T10:00:00Z",
  "datetimeClosed": null,
  "mergedIntoTicketId": null
}
```

---

#### PUT /api/tickets/{id}
Update ticket fields (title, description, categoryId, address, lat, lng, customFields, substatusId).

**Auth:** staff/admin. **Request body:** Partial update — only provided fields are updated. **Response 200.**

---

#### POST /api/tickets/{id}/assign
Assign ticket to department/staff.

**Auth:** staff/admin.

**Request body:**
```json
{ "assigneeId": 5, "departmentId": 3 }
```
**Response 200** with updated ticket.

---

#### POST /api/tickets/{id}/close
Close ticket with optional resolution response.

**Auth:** staff/admin.

**Request body:**
```json
{ "response": "We have repaired the pothole. Thank you for reporting." }
```
**Response 200** with updated ticket.

---

#### POST /api/tickets/{id}/reopen
Reopen closed ticket.

**Auth:** staff/admin.

**Request body:**
```json
{ "reason": "Repair was incomplete; pothole reappeared." }
```
**Response 200** with updated ticket.

---

#### DELETE /api/tickets/{id}
Soft-delete ticket. **Auth:** admin. **Response 204.**

---

#### POST /api/tickets/{id}/responses
Post external response (sent to reporter by email).

**Auth:** staff/admin.

**Request body:**
```json
{ "body": "We have scheduled a repair crew.", "templateId": 3 }
```
**Response 201** with created action object.

---

#### POST /api/tickets/{id}/comments
Post internal comment (not sent externally).

**Auth:** staff/admin.

**Request body:**
```json
{ "body": "Waiting on parts from supplier." }
```
**Response 201** with created action object.

---

#### POST /api/tickets/{id}/merge
Merge source ticket into target.

**Auth:** staff/admin.

**Request body:**
```json
{ "targetTicketId": 101 }
```
**Response 200** with merge result object (see F18).

---

#### GET /api/tickets/{id}/merge-candidates
Search for valid merge target tickets.

**Auth:** staff/admin. **Query:** `q` (search string). **Response 200** with filtered ticket list.

---

### §History

#### GET /api/tickets/{id}/history
Get chronological action history for a ticket.

**Auth:** Any (internal actions filtered for non-staff). **Query:** `type`, `visibility`, `page`, `perPage`. **Response 200** with paginated action list.

---

### §Media

#### GET /api/tickets/{id}/media
List attachments for a ticket. **Auth:** Any (visibility-checked). **Response 200.**

#### POST /api/tickets/{id}/media
Upload attachment (multipart/form-data). **Auth:** Any (role-checked). **Response 201** with media object.

#### DELETE /api/tickets/{id}/media/{mediaId}
Soft-delete attachment. **Auth:** staff/admin. **Response 204.**

---

### §Search & Geo

#### GET /api/tickets/clusters
Geo-cluster data for map view.

**Auth:** Any (role-filtered).

**Query:** `bbox`, `zoom`, plus standard search filters.

**Response 200:**
```json
{
  "data": [
    { "lat": 43.1200, "lng": -79.5600, "count": 12, "zoom": 13 }
  ],
  "meta": {},
  "errors": []
}
```

#### GET /api/geocode
Geocode an address string (utility for SPA map picker).

**Auth:** staff. **Query:** `address` (string). **Response 200:** `{ "data": { "lat": 43.12, "lng": -79.56, "addressNormalized": "123 Main St, Anytown, ON" } }`

---

### §Reporting

All report endpoints accept query params: `dateFrom`, `dateTo`, `categoryId`, `departmentId`, `assigneeId`, `format=csv`.

**Auth:** staff/admin for all reports; `GET /api/metrics/sla` is public.

| Endpoint | Description | Key response fields |
|----------|-------------|-------------------|
| `GET /api/reports/activity` | Ticket counts by period | `totalOpened`, `totalClosed`, `byDay[]` |
| `GET /api/reports/assignments` | Tickets per staff | `assigneeId`, `open`, `closed`, `avgDaysToClose` |
| `GET /api/reports/categories` | Volume + SLA per category | `categoryId`, `total`, `onTimePct`, `latePct` |
| `GET /api/reports/departments` | Volume per department | `departmentId`, `total`, `open`, `closed` |
| `GET /api/reports/staff-performance` | Per-staff response metrics | `avgResponseHours`, `closureRate` |
| `GET /api/reports/sla` | SLA on-time/late | `onTime`, `late`, `noSla`, `onTimePct` |
| `GET /api/reports/volume` | Daily/weekly/monthly trends | `period`, `opened`, `closed` |
| `GET /api/reports/open-age` | Tickets open past SLA | `ticketId`, `daysOpen`, `slaStatus` |
| `GET /api/metrics/sla` | Lightweight SLA % (cached 5min) | `categoryId`, `onTimePct` |

---

*End of Y1a — tickets/search/reporting API chunk. Continue to `Y1b-api-admin.md` for admin endpoints.*
