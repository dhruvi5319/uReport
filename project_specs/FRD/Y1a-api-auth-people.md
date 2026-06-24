---

## Y1a: REST API — Authentication, People, Departments, Clients

**Base path prefix:** `/api/v1/`  
**Auth:** `Authorization: Bearer <jwt>` unless noted.  
**Content-Type:** `application/json` for all requests unless noted.  
**Error shape:** `{ "error": "ERROR_CODE", "message": "Human readable message" }`

---

### Auth Endpoints

#### POST /api/v1/auth/login
Authenticate staff user with username and password.

**Auth:** None required.

**Request:**
```json
{ "username": "jsmith", "password": "s3cr3t" }
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "expiresIn": 3600,
  "role": "staff",
  "personId": 42
}
```

**Errors:** 401 AUTH_FAILED, 422 MISSING_REQUIRED_FIELD.

---

#### POST /api/v1/auth/refresh
Rotate access and refresh tokens.

**Auth:** None (refresh token in body).

**Request:**
```json
{ "refreshToken": "550e8400-e29b-41d4-a716-446655440000" }
```

**Response 200:** Same shape as login response.

**Errors:** 401 REFRESH_TOKEN_INVALID.

---

#### POST /api/v1/auth/logout
Revoke refresh token and blacklist access token JTI.

**Auth:** Bearer JWT required.

**Request:**
```json
{ "refreshToken": "550e8400-..." }
```

**Response 200:** `{}`

---

#### GET /callback
OAuth/external IdP callback. Exchanges auth code for local JWT.

**Auth:** None (OAuth code in query param).

**Query params:** `code` (required), `state` (required).

**Response:** Redirect to SPA with tokens in query params or cookie.

**Errors:** 400 OAUTH_STATE_INVALID, 404 PERSON_NOT_FOUND.

---

### People Endpoints

#### GET /api/v1/people
List and search people.

**Auth:** staff.

**Query params:** `q` (string), `role` (staff/public/anonymous), `department_id` (integer), `organization` (string), `page` (integer, default 1), `limit` (integer, default 25).

**Response 200:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 25,
  "people": [
    {
      "id": 1,
      "firstname": "Jane",
      "middlename": null,
      "lastname": "Smith",
      "organization": "City Hall",
      "address": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701",
      "department_id": 3,
      "departmentName": "Streets",
      "username": "jsmith",
      "role": "staff"
    }
  ]
}
```

---

#### POST /api/v1/people
Create a new person.

**Auth:** staff.

**Request:**
```json
{
  "firstname": "Jane",
  "lastname": "Smith",
  "organization": "City Hall",
  "department_id": 3,
  "username": "jsmith",
  "password": "s3cr3t",
  "role": "staff",
  "emails": [
    { "email": "jsmith@city.gov", "label": "Work", "usedForNotifications": true }
  ],
  "phones": [
    { "number": "555-1234", "label": "Work" }
  ],
  "addresses": []
}
```

**Response 201:** Full person object with id, sub-arrays.

**Errors:** 409 USERNAME_CONFLICT, 422 INVALID_ROLE, 422 INVALID_EMAIL, 422 MISSING_REQUIRED_FIELD.

---

#### GET /api/v1/people/{id}
Get person detail including sub-records.

**Auth:** staff.

**Response 200:** Full person object with emails, phones, addresses arrays.

**Errors:** 404 PERSON_NOT_FOUND.

---

#### PUT /api/v1/people/{id}
Replace person record (full update).

**Auth:** staff.

**Request:** Same shape as POST.

**Response 200:** Updated person object.

**Errors:** 404, 409 USERNAME_CONFLICT, 422.

---

#### PATCH /api/v1/people/{id}
Partial update of person fields.

**Auth:** staff.

**Request:** Any subset of person fields.

**Response 200:** Updated person object.

---

#### DELETE /api/v1/people/{id}
Soft-delete person (sets `deletedAt = NOW()`).

**Auth:** staff.

**Response 204:** No body.

**Errors:** 404, 409 PERSON_IN_USE.

---

#### GET /api/v1/people/{id}/tickets
Get all tickets associated with person (reported, assigned, or entered).

**Auth:** staff.

**Query params:** `role` (reported/assigned/entered), `page`, `limit`.

**Response 200:** Paginated ticket list.

---

#### People Email Sub-Endpoints

```
POST   /api/v1/people/{id}/emails              Create email
PUT    /api/v1/people/{id}/emails/{emailId}    Update email
DELETE /api/v1/people/{id}/emails/{emailId}    Delete email
```

**Request (POST/PUT):**
```json
{ "email": "jane@home.com", "label": "Home", "usedForNotifications": false }
```

**Response:** 201 (POST) or 200 (PUT) with email object `{ id, person_id, email, label, usedForNotifications }`.

---

#### People Phone Sub-Endpoints

```
POST   /api/v1/people/{id}/phones              Create phone
PUT    /api/v1/people/{id}/phones/{phoneId}    Update phone
DELETE /api/v1/people/{id}/phones/{phoneId}    Delete phone
```

**Request:** `{ "number": "555-9876", "label": "Mobile" }`

---

#### People Address Sub-Endpoints

```
POST   /api/v1/people/{id}/addresses             Create address
PUT    /api/v1/people/{id}/addresses/{addrId}    Update address
DELETE /api/v1/people/{id}/addresses/{addrId}    Delete address
```

**Request:** `{ "address": "456 Oak Ave", "city": "Springfield", "state": "IL", "zip": "62702", "label": "Home" }`

---

### Department Endpoints

#### GET /api/v1/departments
List all departments.

**Auth:** staff.

**Response 200:**
```json
[
  { "id": 1, "name": "Streets", "defaultPerson_id": 12, "defaultPersonName": "Bob Jones" }
]
```

---

#### POST /api/v1/departments
Create department.

**Auth:** staff.

**Request:** `{ "name": "Parks", "defaultPerson_id": 7 }`

**Response 201:** Department object.

**Errors:** 409 DEPT_NAME_CONFLICT, 422 INVALID_DEFAULT_PERSON.

---

#### GET /api/v1/departments/{id}
Get department detail.

**Auth:** staff.

**Response 200:** Department object with staffCount, categoryCount.

---

#### PUT /api/v1/departments/{id}
Update department.

**Auth:** staff.

**Response 200:** Updated department object.

---

#### DELETE /api/v1/departments/{id}
Delete department.

**Auth:** staff.

**Response 204.**

**Errors:** 404, 409 DEPT_IN_USE.

---

#### GET /api/v1/departments/{id}/people
List staff members in department.

**Auth:** staff.

**Response 200:** Paginated people list.

---

#### GET /api/v1/departments/{id}/categories
List categories in department.

**Auth:** staff.

**Response 200:** Array of category summaries.

---

#### PUT /api/v1/departments/{id}/categories
Set full category list for department (replaces existing associations).

**Auth:** staff.

**Request:** `{ "category_ids": [1, 2, 5] }`

**Response 200:** Updated category list.

---

#### PUT /api/v1/departments/{id}/actions
Set full action list for department.

**Auth:** staff.

**Request:** `{ "action_ids": [1, 2, 3, 11] }`

**Response 200:** Updated action list.

---

### Client Endpoints

#### GET /api/v1/clients
List all API clients.

**Auth:** staff.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "MobileApp",
    "url": "https://app.example.com",
    "contactPerson_id": 5,
    "contactPersonName": "Alice Brown",
    "contactMethod_id": 1,
    "contactMethodName": "Email"
  }
]
```

Note: `api_key` / `api_key_hash` never returned.

---

#### POST /api/v1/clients
Register new API client.

**Auth:** staff.

**Request:**
```json
{
  "name": "MobileApp",
  "url": "https://app.example.com",
  "contactPerson_id": 5,
  "contactMethod_id": 1
}
```

**Response 201:**
```json
{
  "id": 2,
  "name": "MobileApp",
  "rawApiKey": "a3f2c8d1e9b04f7..."
}
```
`rawApiKey` is returned **once only** — not retrievable again.

---

#### GET /api/v1/clients/{id}
Get client detail (no api_key).

**Auth:** staff.

**Response 200:** Client object without api_key fields.

---

#### PATCH /api/v1/clients/{id}
Update client or regenerate API key.

**Auth:** staff.

**Request:** Any subset of client fields, plus optional `"regenerateApiKey": true`.

**Response 200:** Updated client object. If key regenerated, includes `rawApiKey` field.

---

#### DELETE /api/v1/clients/{id}
Delete API client.

**Auth:** staff.

**Response 204.**

**Errors:** 404, 409 CLIENT_IN_USE.
