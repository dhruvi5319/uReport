---

## Y2: Cross-Feature Error Catalog

This catalog lists all error codes, HTTP status codes, and messages used across features. For Open311 errors, the format differs (see §Open311 Errors below).

---

### Standard JSON Envelope Error Format

```json
{
  "data": null,
  "meta": {},
  "errors": [
    {
      "field": "categoryId",
      "message": "Category not found or inactive",
      "code": "INVALID_CATEGORY"
    }
  ]
}
```

- `field`: The request field that caused the error, or `null` for non-field errors.
- `message`: Human-readable message (should be translatable in production).
- `code`: Machine-readable error code for client-side handling.

---

### Authentication & Authorization Errors

| HTTP | Code | Field | Message | Feature |
|------|------|-------|---------|---------|
| 401 | UNAUTHENTICATED | null | "Authentication required" | F11 |
| 401 | SESSION_EXPIRED | null | "Session expired; please log in again" | F11 |
| 401 | SESSION_REVOKED | null | "Your account has been deactivated" | F11 |
| 401 | INVALID_ID_TOKEN | null | "Identity token could not be verified" | F11 |
| 400 | OAUTH_STATE_MISMATCH | null | "Authentication state mismatch; possible CSRF" | F11 |
| 400 | OIDC_ERROR | null | Provider error description | F11 |
| 503 | IDP_UNAVAILABLE | null | "Authentication service unavailable; try again later" | F11 |
| 403 | FORBIDDEN | null | "Your role does not permit this action" | F10 |
| 403 | CATEGORY_FORBIDDEN | null | "You do not have permission to view this category" | F10 |
| 403 | POSTING_FORBIDDEN | null | "This category does not allow posting by your role" | F10 |
| 403 | NOT_YOUR_TICKET | null | "You may only view your own submitted tickets" | F10 |

---

### Ticket Errors

| HTTP | Code | Field | Message | Feature |
|------|------|-------|---------|---------|
| 404 | NOT_FOUND | null | "Ticket not found" | F00 |
| 422 | INVALID_CATEGORY | categoryId | "Category not found or inactive" | F00 |
| 422 | LOCATION_REQUIRED | lat/address | "Either coordinates or an address must be provided" | F00 |
| 422 | INVALID_COORDINATES | lat/lng | "Latitude must be −90 to +90; longitude −180 to +180" | F00 |
| 422 | INVALID_ASSIGNEE | assigneeId | "Assignee not found or not an active staff member" | F00 |
| 422 | REASON_REQUIRED | reason | "A reason is required to reopen a ticket" | F00 |
| 409 | ALREADY_CLOSED | null | "Ticket is already closed" | F00 |
| 409 | ALREADY_OPEN | null | "Ticket is already open" | F00 |
| 409 | ALREADY_MERGED | null | "This ticket has already been merged" | F18 |
| 409 | TARGET_CLOSED | targetTicketId | "Cannot merge into a closed ticket" | F18 |
| 409 | TARGET_MERGED | targetTicketId | "Cannot merge into a ticket that has already been merged" | F18 |
| 422 | SELF_MERGE | targetTicketId | "Cannot merge a ticket into itself" | F18 |
| 422 | STATUS_MISMATCH | substatusId | "Substatus does not match the ticket's current primary status" | F17 |

---

### Validation Errors

| HTTP | Code | Field | Message | Feature |
|------|------|-------|---------|---------|
| 422 | DUPLICATE_NAME | name | "A [resource] with this name already exists" | F02/F12/F13/F14/F17 |
| 422 | DUPLICATE_EMAIL | email/value | "This email address is already registered" | F03 |
| 422 | INVALID_EMAIL | email/value | "Email address is not valid" | F03/F14 |
| 422 | INVALID_ROLE | role | "Role must be admin, staff, or public" | F03 |
| 422 | INVALID_DEPARTMENT | departmentId | "Department not found or inactive" | F02/F03 |
| 422 | INVALID_GROUP | groupId | "Category group not found" | F02 |
| 422 | FIELD_OPTIONS_REQUIRED | fields | "Select-type fields require at least one option" | F02 |
| 422 | INVALID_DATE | dateFrom/dateTo | "Date must be ISO 8601 format (YYYY-MM-DD)" | F04/F09 |
| 422 | INVALID_DATE_RANGE | dateFrom | "Start date must be before end date" | F04/F09 |
| 422 | DATE_RANGE_TOO_LARGE | dateFrom | "Report date range cannot exceed 2 years" | F09 |
| 422 | INVALID_BBOX | bbox | "Bounding box must be minLat,minLng,maxLat,maxLng" | F04/F05 |
| 422 | BOOKMARK_LIMIT | null | "Maximum 50 bookmarks reached" | F12 |
| 422 | SYSTEM_TEMPLATE | null | "System templates cannot be deleted" | F13 |
| 422 | FILE_TOO_LARGE | file | "File exceeds maximum size of 10 MB" | F07 |
| 422 | INVALID_FILE_TYPE | file | "File type not allowed" | F07 |
| 422 | ATTACHMENT_LIMIT | null | "Maximum attachments per ticket reached" | F07 |
| 422 | INVALID_URL | media_url | "media_url must be a valid HTTP/HTTPS URL" | F07 |
| 413 | EXPORT_TOO_LARGE | null | "Export exceeds maximum 5000 rows; refine filters" | F04 |
| 422 | DUPLICATE_LABEL | label | "A substatus with this label already exists for this status" | F17 |

---

### Resource Not Found Errors

| HTTP | Code | Message | Feature |
|------|------|---------|---------|
| 404 | NOT_FOUND | "Ticket not found" | F00 |
| 404 | NOT_FOUND | "Person not found" | F03 |
| 404 | NOT_FOUND | "Department not found" | F02 |
| 404 | NOT_FOUND | "Category not found" | F02 |
| 404 | NOT_FOUND | "Bookmark not found" | F12 |
| 404 | NOT_FOUND | "Template not found" | F13 |
| 404 | NOT_FOUND | "API client not found" | F14 |
| 404 | NOT_FOUND | "Substatus not found" | F17 |

---

### Infrastructure & Integration Errors

| HTTP | Code | Message | Feature |
|------|------|---------|---------|
| 503 | SEARCH_UNAVAILABLE | "Search service is temporarily unavailable" | F04 |
| 503 | GEO_SERVICE_UNAVAILABLE | "Address lookup service unavailable; ticket saved without coordinates" | F05 |
| 422 | ADDRESS_NOT_FOUND | "Address could not be geocoded; please provide coordinates manually" | F05 |
| 503 | DATABASE_UNAVAILABLE | "Database service unavailable; try again later" | F16 |
| 500 | INTERNAL_ERROR | "An unexpected error occurred" | F16 |
| 405 | METHOD_NOT_ALLOWED | "HTTP method not supported on this endpoint" | F16 |
| 400 | MALFORMED_REQUEST | "Request body is not valid JSON" | F16 |
| 409 | ALREADY_INACTIVE | "Client is already inactive" | F14 |
| 409 | HAS_ACTIVE_TICKETS | "Resource has active tickets; confirm to proceed" | F02 |

---

### Open311 Error Format

Open311 errors use a different format (spec-required):

```json
[{"code": 404, "description": "Service request not found"}]
```

| HTTP | code | description | Feature |
|------|------|-------------|---------|
| 404 | 404 | "service_code not found" | F01 |
| 404 | 404 | "Service request not found" | F01 |
| 400 | 400 | "Invalid api_key" | F01/F14 |
| 400 | 400 | "lat/long or address_string required" | F01 |
| 403 | 403 | "This service requires authentication" | F01 |

---

### Error Handling Rules

1. **Unhandled exceptions** → HTTP 500 with `INTERNAL_ERROR` code; full stack trace logged to Graylog.
2. **Validation failures** → HTTP 422 with array of `{ field, message, code }` objects; all validation errors for a single request returned at once (not fail-fast).
3. **Not Found** → HTTP 404; never expose whether a resource exists to unauthorized callers (return 404 even if it's a 403 scenario for hidden resources).
4. **Conflict** → HTTP 409 for state conflicts; not for validation failures.
5. **SMTP failures** are non-fatal → ticket operations succeed; notification failure logged to Graylog.
6. **Geocoding failures** are non-fatal → ticket saved with `geoStatus = 'failed'`; no error returned to caller.
