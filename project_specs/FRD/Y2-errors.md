---

## Y2: Cross-Feature Error Catalog

This catalog lists all error codes used across uReport REST API endpoints with their HTTP status codes, human-readable messages, and retry guidance.

---

### Standard Error Response Shape

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description of the error",
  "field": "fieldName"
}
```

- `field` is optional; included for field-level validation errors (422).
- Multiple field errors may be returned as an array under `"errors": [...]`.

---

### Authentication & Authorization Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 401 | AUTH_FAILED | "Invalid username or password" | F04 | No |
| 401 | TOKEN_EXPIRED | "Access token has expired" | F04 | Yes — refresh token |
| 401 | TOKEN_INVALID | "Invalid or malformed token" | F04 | No |
| 401 | TOKEN_REVOKED | "Token has been revoked" | F04 | No — re-login |
| 401 | REFRESH_TOKEN_INVALID | "Refresh token is invalid or expired" | F04 | No — re-login |
| 401 | UNAUTHORIZED | "Authentication required" | F03 | Yes — authenticate |
| 403 | PERMISSION_DENIED | "Insufficient permissions" | F03 | No |
| 403 | API_KEY_INVALID | "Invalid or missing api_key" | F02, F13 | No |
| 403 | API_KEY_REQUIRED | "API key is required" | F02, F13 | Yes — add key |
| 400 | OAUTH_STATE_INVALID | "Invalid OAuth state parameter" | F04 | No |
| 404 | PERSON_NOT_FOUND | "No account found for this identity" | F04 | No |

---

### Ticket Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | TICKET_NOT_FOUND | "Ticket not found" | F00 | No |
| 422 | DESCRIPTION_REQUIRED | "Description is required" | F00 | Yes — fix input |
| 422 | INVALID_SUBSTATUS | "Substatus must be a closed-type substatus" | F00, F08 | Yes — fix input |
| 422 | INVALID_TRANSITION | "Invalid status transition" | F00 | Yes — check status |
| 422 | CIRCULAR_DUPLICATE | "Ticket cannot be its own ancestor" | F00 | Yes — fix parent_id |
| 422 | INVALID_ASSIGNEE | "Assigned person must have staff role" | F00 | Yes — fix person |
| 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" | F00, F15 | Yes — fix coords |
| 403 | PERMISSION_DENIED | "Insufficient permission to post to this category" | F00, F03 | No |

---

### Category Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | CATEGORY_NOT_FOUND | "Category not found or inactive" | F00, F07 | No |
| 422 | INVALID_PERMISSION_LEVEL | "Permission level must be anonymous, public, or staff" | F07 | Yes |
| 422 | INVALID_CUSTOM_FIELDS | "customFields must be a valid JSON array" | F07 | Yes |
| 422 | INVALID_DEFAULT_PERSON | "Default person must have staff role" | F06, F07 | Yes |
| 409 | CATEGORY_IN_USE | "Category has associated tickets; deactivate instead" | F07 | No |
| 404 | GROUP_NOT_FOUND | "Category group not found" | F07 | No |

---

### People Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | PERSON_NOT_FOUND | "Person not found" | F05 | No |
| 409 | USERNAME_CONFLICT | "Username already in use" | F05 | Yes — choose new username |
| 422 | INVALID_EMAIL | "Invalid email address format" | F05 | Yes |
| 422 | INVALID_ROLE | "Role must be staff, public, or anonymous" | F05 | Yes |
| 422 | MISSING_REQUIRED_FIELD | "First name and last name are required" | F05 | Yes |
| 409 | PERSON_IN_USE | "Person is referenced by existing tickets" | F05 | No |

---

### Department Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | DEPT_NOT_FOUND | "Department not found" | F06 | No |
| 409 | DEPT_NAME_CONFLICT | "Department name already exists" | F06 | Yes — choose new name |
| 409 | DEPT_IN_USE | "Department has assigned categories" | F06 | No |
| 422 | ACTION_NOT_FOUND | "One or more action IDs not found" | F06, F09 | Yes |

---

### Substatus Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | SUBSTATUS_NOT_FOUND | "Substatus not found" | F08 | No |
| 422 | INVALID_STATUS | "Status must be 'open' or 'closed'" | F08 | Yes |
| 403 | SYSTEM_SUBSTATUS | "System substatuses cannot be deleted or modified" | F08 | No |
| 409 | SUBSTATUS_IN_USE | "Substatus is referenced by tickets or category rules" | F08 | No |

---

### Action Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | ACTION_NOT_FOUND | "Action not found" | F09 | No |
| 403 | SYSTEM_ACTION | "System actions cannot be modified or deleted" | F09 | No |
| 409 | ACTION_IN_USE | "Action is referenced by ticket history" | F09 | No |
| 422 | INVALID_EMAIL | "Reply email address is invalid" | F09 | Yes |

---

### Media Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | MEDIA_NOT_FOUND | "Media not found" | F10 | No |
| 404 | FILE_NOT_FOUND | "File data not found on server" | F10 | No |
| 413 | FILE_TOO_LARGE | "File exceeds maximum allowed size" | F10 | Yes — reduce file size |
| 415 | UNSUPPORTED_MEDIA | "File type not allowed" | F10 | Yes — change format |
| 422 | NO_FILE | "No files provided" | F10 | Yes |
| 422 | TOO_MANY_FILES | "Maximum 10 files per upload" | F10 | Yes — split upload |

---

### Search / Export Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 422 | INVALID_DATE | "Date must be ISO 8601 format" | F11, F17 | Yes |
| 422 | INVALID_DATE_RANGE | "startDate must be before endDate" | F17 | Yes |
| 422 | LIMIT_EXCEEDED | "Page size exceeds maximum allowed" | F11 | Yes |
| 422 | INVALID_SORT_FIELD | "Invalid sort field" | F11 | Yes |
| 422 | INVALID_ZOOM_LEVEL | "Zoom level must be 0–6" | F15 | Yes |

---

### API Client Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | CLIENT_NOT_FOUND | "Client not found" | F13 | No |
| 409 | API_KEY_CONFLICT | "API key already in use" | F13 | Yes — regenerate |
| 409 | CLIENT_IN_USE | "Client is referenced by existing tickets" | F13 | No |

---

### Contact Method / Issue Type Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | CONTACT_METHOD_NOT_FOUND | "Contact method not found" | F14 | No |
| 403 | SYSTEM_CONTACT_METHOD | "System contact methods cannot be deleted" | F14 | No |
| 409 | CONTACT_METHOD_IN_USE | "Contact method referenced by existing tickets" | F14 | No |
| 409 | CONTACT_METHOD_CONFLICT | "Contact method name already exists" | F14 | Yes |
| 404 | ISSUE_TYPE_NOT_FOUND | "Issue type not found" | F19 | No |
| 403 | SYSTEM_ISSUE_TYPE | "System issue types cannot be deleted" | F19 | No |
| 409 | ISSUE_TYPE_IN_USE | "Issue type referenced by existing tickets" | F19 | No |

---

### Open311 Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | SERVICE_NOT_FOUND | "Service not found" | F02 | No |
| 403 | PERMISSION_DENIED | "Service does not allow public posting" | F02 | No |
| 404 | REQUEST_NOT_FOUND | "Service request not found" | F02 | No |
| 400 | INVALID_FORMAT | "Format must be json or xml" | F02, F18 | Yes |
| 400 | UNSUPPORTED_FORMAT | "Format not supported for this endpoint" | F18 | Yes |

---

### Metrics / Reports Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | REPORT_NOT_FOUND | "Unknown report type" | F17 | No |
| 422 | INVALID_PARAM | "numDays must be between 1 and 365" | F17 | Yes |

---

### Bookmark Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | BOOKMARK_NOT_FOUND | "Bookmark not found" | F12 | No |
| 403 | PERMISSION_DENIED | "Cannot delete another user's bookmark" | F12 | No |
| 422 | INVALID_URI | "Request URI must be a relative path" | F12 | Yes |

---

### Response Template Errors

| HTTP | Error Code | Message | Feature | Retry? |
|------|-----------|---------|---------|--------|
| 404 | TEMPLATE_NOT_FOUND | "Response template not found" | F20 | No |

---

### HTTP 405 Method Not Allowed

Returned for any attempt to call an HTTP method not supported on an endpoint (e.g., PUT on a list endpoint, or any write on `ticketHistory`).

| HTTP | Error Code | Message |
|------|-----------|---------|
| 405 | METHOD_NOT_ALLOWED | "HTTP method not allowed on this endpoint" |
