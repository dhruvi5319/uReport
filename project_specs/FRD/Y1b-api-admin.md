---

## Y1b: REST API — Admin & Authentication Endpoints

All endpoints are prefixed `/api/` or `/auth/`. JSON envelope applies to all `/api/` routes.

---

### §Departments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/departments` | staff/admin | List departments (active by default; `?active=false` for all) |
| POST | `/api/departments` | admin | Create department |
| GET | `/api/departments/{id}` | staff/admin | Get department detail |
| PUT | `/api/departments/{id}` | admin | Update department |
| DELETE | `/api/departments/{id}` | admin | Deactivate department |

**Department request body (POST/PUT):**
```json
{ "name": "Roads & Infrastructure", "defaultAssigneeId": 5, "active": true }
```

**Department response:**
```json
{
  "id": 3,
  "name": "Roads & Infrastructure",
  "defaultAssignee": { "id": 5, "name": "John Smith" },
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2026-06-01T00:00:00Z"
}
```

---

### §Categories

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

**Category request body (POST/PUT):**
```json
{
  "name": "Pothole Repair",
  "departmentId": 3,
  "groupId": 1,
  "slaDays": 5,
  "displayPermission": "public",
  "postingPermission": "anonymous",
  "defaultAssigneeId": null,
  "autoCloseDays": 30,
  "active": true,
  "fields": [
    {
      "code": "severity",
      "label": "Severity Level",
      "type": "select",
      "required": false,
      "options": ["low", "medium", "high", "critical"]
    }
  ]
}
```

---

### §People

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/people` | staff/admin | List/search people (`?q=`, `?role=`, `?departmentId=`, `?active=`) |
| POST | `/api/people` | admin | Create person |
| GET | `/api/people/{id}` | staff/admin | Get person detail |
| PUT | `/api/people/{id}` | admin | Update person |
| DELETE | `/api/people/{id}` | admin | Deactivate person |
| GET | `/api/people/{id}/contact-methods` | staff/admin | List contact methods |
| POST | `/api/people/{id}/contact-methods` | admin | Add contact method |
| PUT | `/api/people/{id}/contact-methods/{cmId}` | admin | Update contact method |
| DELETE | `/api/people/{id}/contact-methods/{cmId}` | admin | Remove contact method |

**Person request body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "staff",
  "departmentId": 3,
  "active": true
}
```

**Contact method request body:**
```json
{
  "type": "email",
  "value": "jane.smith@city.gov",
  "isPrimary": true,
  "label": "Work Email"
}
```

---

### §Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | staff/admin | List active templates |
| POST | `/api/templates` | admin | Create template |
| GET | `/api/templates/{id}` | staff/admin | Get template (for staff compose UI) |
| PUT | `/api/templates/{id}` | admin | Update template |
| DELETE | `/api/templates/{id}` | admin | Delete template (non-system only) |

**Template request body:**
```json
{
  "name": "Acknowledgement — Will Investigate",
  "subject": "Update on your service request #{{ticket_id}}",
  "body": "Dear {{reporter_name}},\n\nThank you for reporting {{title}}…",
  "active": true
}
```

---

### §API Clients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/clients` | admin | List all clients |
| POST | `/api/clients` | admin | Create client (returns key once) |
| GET | `/api/clients/{id}` | admin | Get client detail (key hint only) |
| PUT | `/api/clients/{id}` | admin | Update name/contact/notes |
| DELETE | `/api/clients/{id}` | admin | Deactivate client |
| POST | `/api/clients/{id}/regenerate-key` | admin | Regenerate API key (returns new key once) |

---

### §Substatuses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/substatuses` | staff/admin | List substatuses (`?primaryStatus=open\|closed`) |
| POST | `/api/substatuses` | admin | Create substatus |
| GET | `/api/substatuses/{id}` | staff/admin | Get substatus |
| PUT | `/api/substatuses/{id}` | admin | Update substatus |
| DELETE | `/api/substatuses/{id}` | admin | Deactivate substatus |

---

### §Bookmarks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookmarks` | staff/admin | List current user's bookmarks |
| POST | `/api/bookmarks` | staff/admin | Create bookmark |
| GET | `/api/bookmarks/{id}` | staff/admin | Get bookmark + filterState |
| DELETE | `/api/bookmarks/{id}` | staff/admin | Delete bookmark |

---

### §Notification Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/settings` | admin | Get current notification/SMTP settings |
| PUT | `/api/notifications/settings` | admin | Update digest frequency |

---

### §Authentication

Auth flows are handled through Next.js API routes (or PHP controller equivalent) at `/auth/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/login` | None | Initiate OIDC redirect |
| GET | `/auth/callback` | None | Handle OIDC callback, issue session cookie |
| POST | `/auth/logout` | session | Clear session, redirect to OIDC logout |
| GET | `/auth/me` | session | Return current user's person record + role |

**`GET /auth/me` response:**
```json
{
  "data": {
    "id": 5,
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "staff",
    "department": { "id": 3, "name": "Roads" },
    "primaryEmail": "jane.smith@city.gov"
  },
  "meta": {},
  "errors": []
}
```

---

### §OpenAPI Documentation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/docs` | staff | Swagger UI HTML |
| GET | `/api/openapi.json` | staff | OpenAPI 3.1 JSON spec |
| GET | `/api/openapi.yaml` | staff | OpenAPI 3.1 YAML spec |

---

### Common Query Parameters (Admin Lists)

All admin list endpoints (`GET /api/departments`, `/api/categories`, etc.) support:
- `?active=true|false` (default `true`)
- `?page=1&perPage=25`
- `?sort=name_asc|name_desc|created_asc|created_desc`

---

*End of Y1b — admin/auth API chunk.*
