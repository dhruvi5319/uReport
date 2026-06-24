---

## Y1c: REST API — Admin (Categories, Actions, Substatus, Contact Methods, Issue Types, Metrics, Response Templates)

---

### Category Endpoints

#### GET /api/v1/categories
List categories. Public/anonymous users only see categories they have display permission for.

**Auth:** anonymous/public/staff.

**Query params:** `department_id`, `group_id`, `active` (true/false), `featured` (true/false), `page`, `limit`.

**Response 200:**
```json
{
  "total": 45,
  "categories": [
    {
      "id": 5,
      "name": "Pothole",
      "description": "Report a pothole in a street or sidewalk",
      "department_id": 1,
      "departmentName": "Streets",
      "categoryGroup_id": 2,
      "categoryGroupName": "Streets & Infrastructure",
      "active": true,
      "featured": true,
      "displayPermissionLevel": "anonymous",
      "postingPermissionLevel": "anonymous",
      "slaDays": 7,
      "lastModified": "2026-06-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/v1/categories
Create category.

**Auth:** staff.

**Request:**
```json
{
  "name": "Graffiti",
  "description": "Report graffiti on public property",
  "department_id": 2,
  "defaultPerson_id": null,
  "categoryGroup_id": 3,
  "active": true,
  "featured": false,
  "displayPermissionLevel": "anonymous",
  "postingPermissionLevel": "anonymous",
  "customFields": [
    { "key": "surface", "label": "Surface Type", "type": "singlevaluelist", "required": false, "order": 1, "options": ["Wall","Sign","Bench"] }
  ],
  "slaDays": 5,
  "notificationReplyEmail": "graffiti@city.gov",
  "autoCloseIsActive": false,
  "autoCloseSubstatus_id": null
}
```

**Response 201:** Full category object.

**Errors:** 422 INVALID_PERMISSION_LEVEL, 422 INVALID_SUBSTATUS, 422 INVALID_CUSTOM_FIELDS.

---

#### GET /api/v1/categories/{id}
Get category detail including customFields schema.

**Auth:** per displayPermissionLevel.

**Response 200:** Full category object with customFields array.

---

#### PUT /api/v1/categories/{id}
Replace category (full update).

**Auth:** staff.

**Response 200:** Updated category object.

---

#### DELETE /api/v1/categories/{id}
Delete category. Blocked if tickets exist.

**Auth:** staff.

**Response 204.**

**Errors:** 409 CATEGORY_IN_USE.

---

#### GET /api/v1/categories/{id}/action-responses
List all category_action_responses for a category.

**Auth:** staff.

**Response 200:** Array of `{ id, category_id, action_id, actionName, template, replyEmail }`.

---

#### POST /api/v1/categories/{id}/action-responses
Upsert a category action response.

**Auth:** staff.

**Request:** `{ "action_id": 6, "template": "Dear resident, we have responded to your report.", "replyEmail": "noreply@city.gov" }`

**Response 201:** Created/updated response object.

---

#### DELETE /api/v1/categories/{id}/action-responses/{responseId}
Delete category action response.

**Auth:** staff.

**Response 204.**

---

### Category Group Endpoints

#### GET /api/v1/category-groups
List all category groups ordered by `ordering`.

**Auth:** staff.

**Response 200:** Array of `{ id, name, ordering, categoryCount }`.

---

#### POST /api/v1/category-groups
Create group.

**Auth:** staff.

**Request:** `{ "name": "Streets & Infrastructure", "ordering": 1 }`

**Response 201:** Group object.

---

#### GET /api/v1/category-groups/{id}
Get group with its categories.

**Auth:** staff.

**Response 200:** `{ id, name, ordering, categories: [...] }`.

---

#### PUT /api/v1/category-groups/{id}
Update group.

**Auth:** staff.

**Response 200:** Updated group.

---

#### DELETE /api/v1/category-groups/{id}
Delete group. Sets `categories.categoryGroup_id = null` for member categories.

**Auth:** staff.

**Response 204.**

---

#### PUT /api/v1/category-groups/order
Reorder all groups.

**Auth:** staff.

**Request:** `[{ "id": 1, "ordering": 2 }, { "id": 2, "ordering": 1 }]`

**Response 200:** Updated groups array.

---

### Substatus Endpoints

#### GET /api/v1/substatus
List all substatuses.

**Auth:** staff.

**Response 200:** Array of `{ id, name, description, status, isDefault, isSystem }`.

---

#### POST /api/v1/substatus
Create substatus.

**Auth:** staff.

**Request:** `{ "name": "Pending Contractor", "description": "Waiting for contractor", "status": "open", "isDefault": false }`

**Response 201:** Substatus object.

**Errors:** 422 INVALID_STATUS.

---

#### PATCH /api/v1/substatus/{id}
Update substatus.

**Auth:** staff.

**Response 200:** Updated substatus.

**Errors:** 403 SYSTEM_SUBSTATUS.

---

#### DELETE /api/v1/substatus/{id}
Delete substatus.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_SUBSTATUS, 409 SUBSTATUS_IN_USE.

---

### Action Endpoints

#### GET /api/v1/actions
List all actions (system + department).

**Auth:** staff.

**Response 200:** Array of `{ id, name, description, type, template, replyEmail }`.

---

#### POST /api/v1/actions
Create department action.

**Auth:** staff.

**Request:** `{ "name": "Escalated", "description": "Issue escalated to supervisor", "type": "department", "template": "Escalated by {enteredByPerson}" }`

**Response 201:** Action object.

**Errors:** 403 SYSTEM_ACTION.

---

#### PATCH /api/v1/actions/{id}
Update department action.

**Auth:** staff.

**Response 200:** Updated action.

**Errors:** 403 SYSTEM_ACTION.

---

#### DELETE /api/v1/actions/{id}
Delete department action.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_ACTION, 409 ACTION_IN_USE.

---

### Contact Method Endpoints

#### GET /api/v1/contact-methods
List all contact methods.

**Auth:** None.

**Response 200:** `[{ "id": 1, "name": "Email", "isSystem": true }, ...]`

---

#### POST /api/v1/contact-methods
Create contact method.

**Auth:** staff.

**Request:** `{ "name": "In-Person" }`

**Response 201:** Contact method object.

---

#### DELETE /api/v1/contact-methods/{id}
Delete contact method.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_CONTACT_METHOD, 409 CONTACT_METHOD_IN_USE.

---

### Issue Type Endpoints

#### GET /api/v1/issue-types
List all issue types.

**Auth:** None.

**Response 200:** `[{ "id": 1, "name": "Comment", "isSystem": true }, ...]`

---

#### POST /api/v1/issue-types
Create issue type.

**Auth:** staff.

**Request:** `{ "name": "Suggestion" }`

**Response 201:** Issue type object.

---

#### DELETE /api/v1/issue-types/{id}
Delete issue type.

**Auth:** staff.

**Response 204.**

**Errors:** 403 SYSTEM_ISSUE_TYPE, 409 ISSUE_TYPE_IN_USE.

---

### Response Template Endpoints

#### GET /api/v1/response-templates
List response templates. Filter by action_id.

**Auth:** staff.

**Query params:** `action_id` (optional).

**Response 200:** Array of `{ id, name, template, action_id, actionName }`.

---

#### POST /api/v1/response-templates
Create response template.

**Auth:** staff.

**Request:** `{ "name": "48-Hour Inspection", "template": "We will inspect this within 48 hours.", "action_id": 6 }`

**Response 201:** Template object.

---

#### GET /api/v1/response-templates/{id}
Get template detail.

**Auth:** staff.

**Response 200:** Template object.

---

#### PUT /api/v1/response-templates/{id}
Update template.

**Auth:** staff.

**Response 200:** Updated template.

---

#### DELETE /api/v1/response-templates/{id}
Delete template.

**Auth:** staff.

**Response 204.**

---

### Metrics Endpoints

#### GET /api/v1/metrics
Calculate onTimePercentage for a category.

**Auth:** staff.

**Query params:** `category_id` (required), `numDays` (default 30), `effectiveDate` (ISO date, default today).

**Response 200:**
```json
{
  "category_id": 5,
  "categoryName": "Pothole",
  "numDays": 30,
  "effectiveDate": "2026-06-24",
  "onTimePercentage": 73.5,
  "closedCount": 40,
  "onTimeCount": 29
}
```

---

### Reports Endpoints

#### GET /api/v1/reports/{reportType}
Run a canned report.

**Auth:** staff.

**Query params:** `startDate`, `endDate`, `category_id`, `department_id`, `person_id` (required for 'person'), `granularity` (daily/weekly/monthly for volume).

**Response 200:**
```json
{
  "reportType": "assignments",
  "generatedAt": "2026-06-24T12:00:00Z",
  "data": [
    { "person_id": 12, "name": "Bob Jones", "openCount": 5, "closedCount": 20, "totalCount": 25 }
  ]
}
```

**Errors:** 404 REPORT_NOT_FOUND, 422 MISSING_REQUIRED_FIELD, 422 INVALID_DATE_RANGE.

---

### Admin Job Trigger Endpoints

#### POST /api/v1/admin/jobs/digest-notifications/run
Manually trigger digest notification job.

**Auth:** staff.

**Response 200:** `{ "message": "Digest notification job triggered", "startedAt": "..." }`

---

#### POST /api/v1/admin/jobs/auto-close/run
Manually trigger auto-close job.

**Auth:** staff.

**Response 200:** `{ "message": "Auto-close job triggered", "startedAt": "..." }`

---

#### POST /api/v1/admin/jobs/audit/run
Manually trigger audit job.

**Auth:** staff.

**Response 200:** `{ "message": "Audit job triggered", "startedAt": "..." }`
