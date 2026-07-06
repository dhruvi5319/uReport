---

## Y2: Error Catalog — Cross-Feature HTTP Error Codes and Messages

This catalog documents all error scenarios across all features with their HTTP status codes, application error codes, and response body format. All errors from the internal CRM API (`/api/*`) use the JSON error envelope. Open311 errors (`/open311/v2/*`) use the GeoReport v2 error format.

---

### Error Response Envelopes

**Internal CRM API Error Format (`/api/*`):**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description of the error",
  "details": { "field": "fieldName", "value": "invalidValue" }
}
```
`details` is optional; present for field-level validation errors.

**Open311 / GeoReport v2 Error Format (`/open311/v2/*`):**
```json
{
  "errors": [
    { "code": "error_code", "description": "Human-readable description" }
  ]
}
```
Or XML equivalent:
```xml
<errors>
  <error>
    <code>error_code</code>
    <description>Human-readable description</description>
  </error>
</errors>
```

---

### HTTP Status Code Summary

| Code | Meaning | When Used |
|---|---|---|
| 200 | OK | Successful GET, PATCH, POST (action) responses |
| 201 | Created | Successful POST that creates a new resource |
| 204 | No Content | Successful DELETE |
| 207 | Multi-Status | Bulk operations with partial success/failure |
| 400 | Bad Request | Validation error, missing required field, malformed input |
| 401 | Unauthorized | No valid JWT; authentication required |
| 403 | Forbidden | Valid JWT but insufficient role/permissions; invalid api_key (Open311) |
| 404 | Not Found | Requested resource (ticket, person, category, etc.) does not exist |
| 409 | Conflict | Unique constraint violation; delete blocked by references |
| 413 | Payload Too Large | File upload exceeds size limit |
| 415 | Unsupported Media Type | Invalid file MIME type |
| 500 | Internal Server Error | Unhandled server-side error |
| 503 | Service Unavailable | LDAP/CAS server unreachable; external geocoding service unavailable |

---

### Authentication Errors (F12)

| Code | HTTP | Error Code | Message |
|---|---|---|---|
| Invalid LDAP credentials | 401 | `AUTH_INVALID_CREDENTIALS` | "Invalid username or password" |
| LDAP server unavailable | 503 | `AUTH_SERVICE_UNAVAILABLE` | "Authentication service unavailable. Please try again later." |
| CAS ticket validation failure | 401 | `AUTH_CAS_FAILED` | "CAS authentication failed" |
| JWT missing or invalid | 401 | `AUTH_REQUIRED` | "Authentication required" |
| JWT expired | 401 | `AUTH_TOKEN_EXPIRED` | "Session expired. Please sign in again." |
| Role insufficient | 403 | `FORBIDDEN` | "You do not have permission to perform this action" |
| Admin role required | 403 | `ADMIN_REQUIRED` | "Administrator role required" |
| Open redirect attempt | 400 | `INVALID_RETURN_URL` | "Invalid redirect URL" |

---

### Ticket Errors (F1, F4)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Ticket not found | 404 | `TICKET_NOT_FOUND` | "Case not found" |
| Invalid category_id | 400 | `INVALID_CATEGORY` | "Invalid or inactive category" |
| Missing description | 400 | `MISSING_REQUIRED` | "Description is required" |
| Missing location | 400 | `MISSING_LOCATION` | "Location or coordinates are required" |
| Invalid lat/lon range | 400 | `INVALID_COORDINATES` | "Coordinates out of valid range" |
| Close without substatus | 400 | `MISSING_SUBSTATUS` | "Substatus is required to close a case" |
| Duplicate parent not found | 400 | `PARENT_NOT_FOUND` | "Parent ticket not found" |
| Edit closed ticket (no admin) | 403 | `TICKET_CLOSED` | "Closed cases cannot be edited without admin role" |
| Concurrent update conflict | 409 | `CONFLICT` | "Another user updated this case. Refresh to see the latest changes." |

---

### Bulk Operation Errors (F3)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| No tickets selected | 400 | `EMPTY_SELECTION` | "No cases selected" |
| Invalid action | 400 | `INVALID_BULK_ACTION` | "Invalid bulk action type" |
| Bulk close without substatus | 400 | `MISSING_SUBSTATUS` | "Substatus required for bulk close" |
| Partial failure | 207 | — | `{"succeeded": [...], "failed": [...]}` |

---

### People Errors (F6)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Person not found | 404 | `PERSON_NOT_FOUND` | "Person not found" |
| Duplicate username | 409 | `DUPLICATE_USERNAME` | "Username is already in use" |
| Invalid email format | 400 | `INVALID_EMAIL` | "Invalid email address format" |
| Missing name | 400 | `MISSING_REQUIRED` | "At least one of first name, last name, or organization is required" |
| Delete blocked by tickets | 409 | `DELETE_BLOCKED` | "Cannot delete: this person is associated with one or more cases" |

---

### Department / Category Errors (F7, F8)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Department not found | 404 | `DEPARTMENT_NOT_FOUND` | "Department not found" |
| Delete blocked by categories | 409 | `DELETE_BLOCKED` | "Cannot delete: department has associated categories" |
| Category not found | 404 | `CATEGORY_NOT_FOUND` | "Category not found" |
| Delete blocked by tickets | 409 | `DELETE_BLOCKED` | "Cannot delete: category has associated cases" |
| Invalid permission level | 400 | `INVALID_PERMISSION_LEVEL` | "Invalid permission level value" |
| Category group not found | 404 | `CATEGORY_GROUP_NOT_FOUND` | "Category group not found" |
| Delete blocked by categories (group) | 409 | `DELETE_BLOCKED` | "Cannot delete: group has associated categories" |

---

### Action / History Errors (F9)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Invalid action_id | 400 | `INVALID_ACTION` | "Invalid action type" |
| Action not permitted for department | 403 | `ACTION_NOT_PERMITTED` | "This action is not available for the ticket's department" |
| Notes required but missing | 400 | `MISSING_NOTES` | "Notes are required for response actions" |
| SMTP delivery failure | 200 | — | (Action saved; toast warning "Email notification failed to send") |

---

### Media Errors (F10)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| File too large | 413 | `FILE_TOO_LARGE` | "File exceeds the maximum 10 MB size limit" |
| Unsupported MIME type | 415 | `INVALID_FILE_TYPE` | "Only JPEG, PNG, and GIF images are accepted" |
| Too many files | 400 | `TOO_MANY_FILES` | "Maximum 10 files per upload" |
| Media not found | 404 | `MEDIA_NOT_FOUND` | "Photo not found" |
| Disk storage failure | 500 | `STORAGE_ERROR` | "File storage error. Please contact the administrator." |

---

### Open311 Errors (F0)

| Scenario | HTTP | Error Code | GeoReport v2 Error |
|---|---|---|---|
| Unknown service_code | 404 | — | `open311/unknownService` |
| Not allowed to post to service | 403 | — | `noAccessAllowed` |
| Missing/invalid api_key | 403 | — | `clients/unknownClient` |
| Missing required field (POST) | 400 | — | `missingRequiredField` |
| Unknown service request ID | 404 | — | (error description) |
| Malformed date parameter | 400 | — | (error description) |

---

### Admin Panel Errors (F13, F14)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Duplicate substatus name | 409 | `DUPLICATE_NAME` | "Substatus name already in use" |
| Delete system substatus | 403 | `DELETE_SYSTEM_RECORD` | "System records cannot be deleted" |
| Delete substatus in use | 409 | `DELETE_BLOCKED` | "Cannot delete: substatus is in use by tickets" |
| Duplicate issue type name | 409 | `DUPLICATE_NAME` | "Issue type name already in use" |
| Duplicate contact method | 409 | `DUPLICATE_NAME` | "Contact method name already in use" |
| Client not found | 404 | `CLIENT_NOT_FOUND` | "Client not found" |
| Missing client name | 400 | `MISSING_REQUIRED` | "Client name is required" |
| Invalid client URL | 400 | `INVALID_URL` | "Invalid URL format" |

---

### Search Errors (F11)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Malformed tsquery | 400 | `INVALID_SEARCH_TERM` | "Search term is invalid" |
| Search term too long | 400 | `SEARCH_TERM_TOO_LONG` | "Search term exceeds maximum length" |

---

### Reporting Errors (F15)

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Start date > end date | 400 | `INVALID_DATE_RANGE` | "Start date must be before end date" |
| Date range > 12 months | 400 | `DATE_RANGE_TOO_LARGE` | "Date range cannot exceed 12 months" |
| Invalid groupBy value | 400 | `INVALID_GROUP_BY` | "Invalid groupBy parameter value" |

---

### Global Server Errors

| Scenario | HTTP | Error Code | Message |
|---|---|---|---|
| Unhandled exception | 500 | `INTERNAL_ERROR` | "An unexpected error occurred. Please try again or contact support." |
| Database connection failure | 500 | `DB_ERROR` | "Database unavailable. Please try again later." |
| Request timeout | 504 | `TIMEOUT` | "Request timed out. Please try again." |
