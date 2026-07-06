---

## F4: Case Detail View

**Priority:** P0 — Critical

### Description

The case detail screen shows the complete record for a single ticket in a split-pane layout: case metadata and controls on the left, action/history timeline on the right. Staff perform all ticket management actions from this screen — inline status transitions, response logging, media attachment, field editing — without navigating away. Route: `/cases/{id}`.

### Terminology

- **Timeline** — The chronological sequence of `ticket_history` entries shown in the right pane.
- **Inline editing** — Clicking a field value opens an edit control (input, dropdown, date picker) in place; "Save" commits via PATCH API call.
- **Lightbox** — A full-screen modal overlay for viewing attached photos at full resolution.
- **Response template** — Pre-written action note text loaded from `category_action_responses` or `actions.template`, reducing repetitive data entry.
- **Split-pane** — Two-column layout on tablet/desktop; stacked single-column on mobile.

### Sub-features

- Case metadata panel (left pane): ID, status badge, substatus, category, department, assignee, reporter, location, contact method, issue type, entered date, closed date, SLA indicator
- Interactive map pin for ticket location (left pane, below metadata)
- Inline status transition: open → close (with substatus), closed → reopen
- Inline field editing: category, assignee, location, description, issue type, contact method
- Action log entry form (right pane top): response type + notes + email toggle
- Response template selector (pre-fills action notes)
- Media / photo upload on ticket and on action entries (see F10)
- Media gallery with lightbox viewer
- Action/history timeline (right pane): chronological, each entry shows type icon, actor, date, notes, media
- Breadcrumb navigation: `Cases > Case #ID`
- Link back to case list preserving filter state

### Layout

```
┌─────────────────────────────┬──────────────────────────────────┐
│  Case Metadata Panel        │  Timeline + Action Log Panel     │
│  ─────────────────          │  ─────────────────               │
│  Status badge / controls    │  New action form (top)           │
│  All ticket fields          │  ─────────────────               │
│  Location map               │  History timeline (scrollable)   │
│  Media gallery              │  entry 1 (most recent)           │
│                             │  entry 2                         │
│                             │  ...                             │
└─────────────────────────────┴──────────────────────────────────┘
Mobile: stacked (metadata → action form → timeline)
```

### Process — Load Case Detail

1. Staff navigates to `/cases/{id}` (via breadcrumb, case list row click, or direct URL).
2. React issues parallel requests:
   - `GET /api/tickets/{id}` — ticket metadata
   - `GET /api/tickets/{id}/history` — action timeline
   - `GET /api/tickets/{id}/media` — attached photos
3. Skeleton placeholders shown while loading.
4. On response: metadata panel renders all fields; timeline renders history entries oldest-first (scrollable); media gallery renders thumbnails.
5. If ticket not found → display "Case not found" message with link back to case list.

### Process — Inline Field Editing

1. Staff clicks "Edit" icon on a field (category, assignee, location, description, issue type, contact method).
2. Field transitions to edit mode: input/dropdown replaces read-only text.
3. Staff modifies value; "Save" button commits, "Cancel" restores original value.
4. On Save: `PATCH /api/tickets/{id}` sends only changed fields.
5. System creates `ticket_history` entry for field change (action type: `changeCategory`, `changeLocation`, or `update` as appropriate).
6. Metadata panel updates with new values; toast "Case updated" shows.

### Process — Log Action / Response

1. Staff selects action type from dropdown (filtered to actions available to the ticket's department — see `department_actions`).
2. Optional: staff selects a response template from the template dropdown; this pre-fills the notes textarea.
3. Staff types notes (optional free text).
4. Staff toggles email notification checkboxes (Notify Reporter / Notify Assignee).
5. On "Submit": `POST /api/tickets/{id}/history` with action_id, notes, notification flags.
6. System creates `ticket_history` record; sends emails if notification flags set.
7. New entry prepended to top of timeline.

### Process — Status Transition (from Case Detail)

1. **Close:** Staff clicks "Close Case" button. Dialog opens with substatus selector (required) and optional notes. On confirm: see F1 §Process — Status Transition: Open → Closed.
2. **Reopen:** Staff clicks "Reopen" button on a closed case. Dialog confirms with optional notes. On confirm: see F1 §Process — Status Transition: Closed → Open.
3. Status badge on metadata panel updates immediately after transition.

### Inputs — Metadata Panel Editable Fields

| Field | Type | Validation |
|---|---|---|
| `category_id` | integer (select) | Must be active category |
| `assignedPerson_id` | integer (search/select) | Must be staff person |
| `location` | string (text) | Max 128 chars |
| `latitude` | float (map pin) | -90 to 90 |
| `longitude` | float (map pin) | -180 to 180 |
| `description` | text (textarea) | Min 1 char |
| `issueType_id` | integer (select) | Must be valid issue type |
| `contactMethod_id` | integer (select) | Must be valid contact method |

### Inputs — Action Log Form

| Field | Type | Required | Notes |
|---|---|---|---|
| `action_id` | integer (select) | [R] | Filtered to department's allowed actions |
| `notes` | text | [O] | Free text; pre-filled by template |
| `notifyReporter` | boolean | [O] | Default false |
| `notifyAssignee` | boolean | [O] | Default false |

### Outputs

- Updated ticket record (PATCH response)
- New `ticket_history` entry (POST history response)
- Timeline refreshes with new entry
- Email sent to reporter/assignee if notification flags set
- Toast notifications for all save actions

### Validation Rules

- Action type must be in the department's allowed actions list (`department_actions`) unless user role is `admin`.
- Notes field is optional for most action types but required for action type `response`.
- Email notifications can only be sent if the recipient has an email address in `peopleEmails` with `usedForNotifications = true`.
- Field edit saves are rejected if the ticket is `closed` and the user role is not `admin` (closed tickets are read-only for standard staff).
- All inline saves use optimistic UI: field shows new value immediately; reverts on API error.

### Error States

| Scenario | HTTP Status | User Behavior |
|---|---|---|
| Ticket not found | 404 | "Case not found" message; back link |
| Access denied | 403 | "You do not have permission to view this case" |
| Field save conflict | 409 | Toast "Another user updated this case. Refresh to see changes." |
| History load failure | 500 | Timeline shows error state with retry button |
| Email send failure | 200 | Action saved; toast warns "Email notification failed to send" |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/tickets/{id}` | Ticket metadata |
| PATCH | `/api/tickets/{id}` | Update ticket fields |
| POST | `/api/tickets/{id}/close` | Close with substatus |
| POST | `/api/tickets/{id}/reopen` | Reopen ticket |
| POST | `/api/tickets/{id}/assign` | Assign ticket |
| GET | `/api/tickets/{id}/history` | Action timeline |
| POST | `/api/tickets/{id}/history` | Log action |
| GET | `/api/tickets/{id}/media` | List media attachments |
| POST | `/api/tickets/{id}/media` | Upload media |
| DELETE | `/api/tickets/{id}/media/{mediaId}` | Delete media |

### Schema Surface

- `tickets` — main entity
- `ticket_history` — action timeline
- `actions` — action type lookup
- `media` — photo gallery
- `substatus` — close substatus
- `category_action_responses` — response templates per category+action
