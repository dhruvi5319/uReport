---

## F13: Response Templates

**Description:** Staff frequently send similar email responses to constituents (e.g., "We have received your report and will investigate within X days"). Response templates allow administrators to define reusable message bodies with template variable placeholders that staff select when composing a ticket response in the UI or that the system uses for automated notifications.

**Terminology:**
- **Template:** A named, reusable message body stored in the system. Maps to a `templates` or `ticketHistory` templates concept — stored in the DB.
- **Template Variable:** A placeholder in the format `{{variable_name}}` that is substituted with real values at send time.
- **Template Slug:** A machine-readable identifier for system templates (e.g., `ticket_created`, `ticket_assigned`). User-created templates have no slug.

**Sub-features:**
- Create, edit, and delete response templates
- Template variable placeholders in body text
- Select template when composing a ticket response (staff UI)
- System templates for automated notifications (see F08)
- Template variable substitution at send time

---

### F13 Supported Template Variables

| Variable | Substitution |
|---------|-------------|
| `{{ticket_id}}` | The ticket's numeric ID |
| `{{title}}` | Ticket title |
| `{{category}}` | Category name |
| `{{department}}` | Department name |
| `{{assignee_name}}` | Assigned staff member's full name |
| `{{reporter_name}}` | Reporter's name |
| `{{status}}` | Current ticket status |
| `{{date_opened}}` | Date ticket was opened (formatted) |
| `{{expected_close_date}}` | SLA-computed expected close date |
| `{{ticket_url}}` | Full URL to the ticket detail page |
| `{{response_body}}` | Staff's response text (for notification wrappers) |

---

### F13 Process: Create Template

1. Admin submits `POST /api/templates` with `name`, `subject` (email subject), `body` (email body with optional `{{variable}}` placeholders).
2. System validates template variable syntax (warns on unknown variable names but does not reject).
3. System saves template record.
4. System returns created template with HTTP 201.

### F13 Process: Use Template in Response

1. Staff opens the response compose form on a ticket detail page.
2. Staff selects a template from the dropdown list.
3. SPA calls `GET /api/templates/{id}` and populates the response form with the template body.
4. Staff edits the pre-filled body as needed, then submits.
5. Final response text (post-edit) is sent — template is only a starting point.

### F13 Process: Variable Substitution (System Use)

1. Notification system (F08) constructs a notification with a template slug (e.g., `ticket_created`).
2. System loads the template by slug.
3. System replaces all `{{variable}}` tokens with values from the current ticket context.
4. Unknown/missing variables are replaced with an empty string.
5. Rendered subject + body are sent via SMTP.

---

### F13 Inputs

**Create/Edit Template:**
- `name` (string, required, max 255): Display name for the template
- `subject` (string, optional, max 255): Email subject line (may contain variables)
- `body` (string, required, max 10000): Email body text (plain text or HTML; may contain variables)
- `slug` (string, optional, max 50): Machine-readable identifier (for system templates only; admin cannot set)
- `active` (boolean, optional, default true)

---

### F13 Outputs

**Template object:**
```json
{
  "id": 3,
  "name": "Acknowledgement — Will Investigate",
  "subject": "Update on your service request #{{ticket_id}}",
  "body": "Dear {{reporter_name}},\n\nThank you for reporting {{title}}. Our team will investigate within {{expected_close_date}}.\n\nRegards,\n{{department}}",
  "slug": null,
  "active": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

### F13 Validation

- `name` must be non-empty, max 255 chars
- `name` must be unique across templates (case-insensitive)
- `body` must be non-empty
- Template variables in the format `{{word}}` are detected and warned if unknown (not rejected)
- `slug` is read-only for system templates; user-created templates have null slug
- `active = false` hides the template from the staff UI select list but does not affect system templates

---

### F13 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate template name | 422 | DUPLICATE_NAME | "A template with this name already exists" |
| Template not found | 404 | NOT_FOUND | "Template not found" |
| Delete system template | 422 | SYSTEM_TEMPLATE | "System templates cannot be deleted" |
| Caller not admin | 403 | FORBIDDEN | "Admin role required to manage templates" |

---

### F13 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/templates` | staff/admin | List all active templates |
| POST | `/api/templates` | admin | Create template |
| GET | `/api/templates/{id}` | staff/admin | Get template detail |
| PUT | `/api/templates/{id}` | admin | Update template |
| DELETE | `/api/templates/{id}` | admin | Delete template (non-system only) |

---

### F13 Schema Surface (this feature)

Table: `templates` (new table if not present in legacy as named entity; legacy may use inline strings). See `Y0b-schema-supporting.md` §templates.

Key columns: `id`, `name`, `subject`, `body`, `slug` (nullable, unique), `active`, `createdAt`, `updatedAt`
