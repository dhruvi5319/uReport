---

## F09: Action Types and Response Templates

**Description:** Actions define the vocabulary of ticket history events. System action types are fixed and seeded; departments may define custom action types. Each action has a name, description template (with `{variable}` placeholders), type, optional email template, and optional reply-to email. Per-category action response templates (`category_action_responses`) allow departments to override the notification text and reply email for each action type within each category.

---

### Terminology

- **System action:** A pre-seeded, read-only action type (e.g., open, assignment, closed). Cannot be modified or deleted by staff.
- **Department action:** A custom action type created by staff for department-specific events.
- **template:** The description text for a `ticketHistory` entry, containing `{variable}` placeholders resolved at render time (F01).
- **replyEmail:** The reply-to address for notification emails sent when this action occurs. Overrides category-level `notificationReplyEmail`.
- **category_action_responses:** A join table associating a specific action with a specific category and providing an optional template and replyEmail override for that combination.
- **department_actions:** A join table associating a department with the action types available to it.

---

### Sub-features

- Create, read, update, delete department-scoped custom action types
- View all system action types (read-only)
- Create, read, update, delete category_action_responses
- List available actions per department
- Associate actions with departments (department_actions)
- Render action templates at read time (see F01)

---

### Process

#### Create Custom Action
1. Staff POSTs to `POST /api/v1/actions` with `name`, `description`, `type = 'department'`, optional `template`, optional `replyEmail`.
2. System validates `type = 'department'` (cannot create system actions).
3. System inserts `actions` row.
4. Returns created action with 201.

#### Update Action
1. Staff PATCHes `/api/v1/actions/{id}`.
2. System rejects updates to system actions (type = 'system').
3. Returns updated action.

#### Delete Action
1. Staff DELETEs `/api/v1/actions/{id}`.
2. System rejects delete of system actions.
3. System blocks delete if any `ticketHistory.action_id` references it.
4. System removes associated `department_actions` and `category_action_responses` rows.
5. Returns 204.

#### Manage Category Action Responses
1. Staff POSTs to `POST /api/v1/categories/{categoryId}/action-responses` with `action_id`, `template`, `replyEmail`.
2. System validates `category_id` and `action_id` exist.
3. System upserts `category_action_responses` row.
4. Returns upserted record.

---

### Template Variable Reference

Variables are resolved at render time by `TicketHistoryService.renderTemplate()`:

| Variable | Resolved Value |
|----------|---------------|
| `{enteredByPerson}` | Full name of `ticketHistory.enteredByPerson_id` from `people` |
| `{actionPerson}` | Full name of `ticketHistory.actionPerson_id` from `people` |
| `{reportedByPerson_id}` | Full name of `tickets.reportedByPerson_id` from `people` |
| `{original:field}` | `ticketHistory.data.original.field` value |
| `{updated:field}` | `ticketHistory.data.updated.field` value |
| `{duplicate:ticket_id}` | Ticket ID from `ticketHistory.data.duplicate` |

Unknown variables are left as literal text.

---

### Inputs

**Action:**
- `name` (string, required): Action name; max 100 chars.
- `description` (text, optional): Human-readable description of the event.
- `type` (string, required for create): Must be `department` for new actions.
- `template` (text, optional): Email notification template text with `{variable}` placeholders.
- `replyEmail` (string, optional): Override reply-to email for this action.

**Category Action Response:**
- `category_id` (integer, required): FK to `categories.id`.
- `action_id` (integer, required): FK to `actions.id`.
- `template` (text, optional): Override template for this action in this category.
- `replyEmail` (string, optional): Override reply-to email for this action in this category.

---

### Outputs

- **Action object:** id, name, description, type, template, replyEmail.
- **Actions list:** Array of all action objects (system + department for the caller's department).
- **Category Action Response object:** id, category_id, action_id, action (name), template, replyEmail.

---

### Validation Rules

- `name` required; max 100 chars.
- `type` on create must be `department`; system actions cannot be created via API.
- System action types (type = 'system') cannot be updated or deleted.
- `replyEmail` must be valid RFC 5322 email format if provided.
- `action_id` in `category_action_responses` must reference an existing action.
- `category_id` in `category_action_responses` must reference an existing category.
- Deleting an action that has `ticketHistory` references is blocked (history is immutable).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Action not found | 404 | ACTION_NOT_FOUND | "Action not found" |
| Cannot modify system action | 403 | SYSTEM_ACTION | "System actions cannot be modified or deleted" |
| Cannot create system action | 403 | SYSTEM_ACTION | "Cannot create actions with type 'system'" |
| Delete blocked by history | 409 | ACTION_IN_USE | "Action is referenced by ticket history entries" |
| Invalid replyEmail | 422 | INVALID_EMAIL | "Reply email address is invalid" |

---

### API Surface (this feature)

See full schemas in `Y1c-api-admin.md §Actions`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/actions` | staff | List all actions |
| POST | `/api/v1/actions` | staff | Create department action |
| GET | `/api/v1/actions/{id}` | staff | Get action detail |
| PATCH | `/api/v1/actions/{id}` | staff | Update department action |
| DELETE | `/api/v1/actions/{id}` | staff | Delete department action |
| GET | `/api/v1/categories/{id}/action-responses` | staff | List category action responses |
| POST | `/api/v1/categories/{id}/action-responses` | staff | Create/update category action response |
| DELETE | `/api/v1/categories/{id}/action-responses/{responseId}` | staff | Delete category action response |

---

### Schema Surface (this feature)

Tables: `actions`, `category_action_responses`, `department_actions`. See `Y0c-schema-categories.md §Actions`.

Key columns:
- `actions`: id (SERIAL PK), name (VARCHAR 100), description (TEXT), type (VARCHAR 20 CHECK IN ('system','department')), template (TEXT), replyEmail (VARCHAR 255).
- `category_action_responses`: id (SERIAL PK), category_id (FK), action_id (FK), template (TEXT), replyEmail (VARCHAR 255), UNIQUE(category_id, action_id).
- `department_actions`: department_id (FK), action_id (FK), PRIMARY KEY(department_id, action_id).
