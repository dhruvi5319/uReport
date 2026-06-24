---

## F20: Response Templates

**Description:** Response templates provide staff with pre-authored text blocks for common ticket responses. Each template is associated with an action type and can be selected when recording a response action on a ticket. The template text pre-populates the `notes` field on a new history entry, which staff may edit before saving. This feature reduces repetitive typing for common responses (e.g., "We will inspect this within 48 hours").

---

### Terminology

- **Response template:** A named text block associated with an action type, used as a starting point for history entry notes.
- **responseTemplates:** The table storing these text blocks.

---

### Sub-features

- Create, read, update, delete response template records
- Associate a response template with an action type
- List available templates when recording a response on a ticket
- Use template text as starting point for history entry notes field

---

### Process

#### Create Response Template
1. Staff POSTs to `POST /api/v1/response-templates` with `name`, `template`, `action_id`.
2. System validates `action_id` references an existing action.
3. System inserts `responseTemplates` row.
4. Returns created template with 201.

#### Use Template on Ticket Response
1. Staff opens ticket response form; GETs `/api/v1/response-templates?action_id={id}` to load available templates.
2. Staff selects a template; client pre-populates the `notes` textarea with `template.template`.
3. Staff edits as needed and submits the history entry (POST `/api/v1/tickets/{id}/comments` or response action).
4. The template text is not stored on the history entry — only the final notes text is stored.

---

### Inputs

- `name` (string, required): Template display name; max 200 chars.
- `template` (text, required): Pre-authored response text; max 65,535 chars.
- `action_id` (integer, optional): FK to `actions.id`; associates template with an action type.

---

### Outputs

- **Response template object:** id, name, template, action_id, action (name).
- **Response templates list:** Array of template objects, optionally filtered by `action_id`.

---

### Validation Rules

- `name` required; max 200 chars.
- `template` required; max 65,535 chars.
- `action_id` must reference an existing action if provided.
- No uniqueness constraint on name (multiple templates per action allowed).
- Deleting a template does not affect existing history entries (template text was never stored on history).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Response template not found | 404 | TEMPLATE_NOT_FOUND | "Response template not found" |
| action_id not found | 422 | ACTION_NOT_FOUND | "Action not found" |
| name missing | 422 | MISSING_REQUIRED_FIELD | "Template name is required" |
| template text missing | 422 | MISSING_REQUIRED_FIELD | "Template text is required" |

---

### API Surface (this feature)

See schemas in `Y1c-api-admin.md §ResponseTemplates`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/response-templates` | staff | List all response templates |
| POST | `/api/v1/response-templates` | staff | Create response template |
| GET | `/api/v1/response-templates/{id}` | staff | Get template detail |
| PUT | `/api/v1/response-templates/{id}` | staff | Update response template |
| DELETE | `/api/v1/response-templates/{id}` | staff | Delete response template |

---

### Schema Surface (this feature)

Table: `responseTemplates`. See `Y0d-schema-geo.md §ResponseTemplates`.

Key columns: id (SERIAL PK), name (VARCHAR 200), template (TEXT), action_id (FK actions, nullable).
