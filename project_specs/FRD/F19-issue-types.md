---

## F19: Issue Type Management

**Description:** Issue types provide a secondary classification for tickets beyond category. They represent the nature of the constituent's concern: Comment, Complaint, Question, Report, Request, or Violation. Issue types are seeded at installation and may be extended by administrators. A ticket optionally carries an `issueType_id`.

---

### Terminology

- **Issue type:** A named label classifying the constituent's intent (Comment, Complaint, Question, Report, Request, Violation).
- **System issue type:** One of the six seeded values; cannot be deleted.

---

### Sub-features

- Seed six system issue types
- Assign issue type to ticket at creation or update
- Filter ticket searches by issue type (F11)
- Administrative CRUD for issue type records

---

### Seed Data

| ID | Name |
|----|------|
| 1 | Comment |
| 2 | Complaint |
| 3 | Question |
| 4 | Report |
| 5 | Request |
| 6 | Violation |

---

### Process

#### Create Issue Type
1. Staff POSTs to `POST /api/v1/issue-types` with `name`.
2. System validates `name` is non-empty and unique.
3. System inserts `issueTypes` row.
4. Returns created issue type with 201.

#### Delete Issue Type
1. Staff DELETEs `/api/v1/issue-types/{id}`.
2. System blocks delete of system issue types (IDs 1–6).
3. System blocks delete if any `tickets.issueType_id` references it.
4. Returns 204.

---

### Inputs

- `name` (string, required): Issue type name; max 100 chars.

---

### Outputs

- **Issue type object:** id, name, isSystem (boolean).
- **Issue types list:** Array of all issue types.

---

### Validation Rules

- `name` required; max 100 chars; must be unique (case-insensitive).
- System issue types (IDs 1–6) cannot be deleted or renamed.
- Deleting an issue type referenced by any ticket is blocked.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Issue type not found | 404 | ISSUE_TYPE_NOT_FOUND | "Issue type not found" |
| Delete system issue type | 403 | SYSTEM_ISSUE_TYPE | "System issue types cannot be deleted" |
| Delete blocked by tickets | 409 | ISSUE_TYPE_IN_USE | "Issue type is referenced by existing tickets" |
| Duplicate name | 409 | ISSUE_TYPE_CONFLICT | "Issue type name already exists" |

---

### API Surface (this feature)

See schemas in `Y1c-api-admin.md §IssueTypes`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/issue-types` | none | List all issue types |
| POST | `/api/v1/issue-types` | staff | Create issue type |
| DELETE | `/api/v1/issue-types/{id}` | staff | Delete issue type |

---

### Schema Surface (this feature)

Table: `issueTypes`. See `Y0a-schema-core.md §IssueTypes`.

Key columns: id (SERIAL PK), name (VARCHAR 100 UNIQUE), isSystem (BOOLEAN DEFAULT false).
