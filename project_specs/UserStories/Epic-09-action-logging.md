## Epic 9: Action / Response Logging and Email Notifications (F9)

Every significant event on a ticket is recorded as an immutable `ticket_history` entry. System actions are auto-created; department actions are user-selectable. Email notifications are dispatched via SMTP.

---

### US-9.1: Automatic System Action Created on Ticket Events
**As a** Marcus Rivera (311 Operator), **I want to** see every structural ticket event (open, assignment, close, category change, location change) automatically recorded in the timeline without any manual input, **so that** the audit trail is always complete and accurate.

**Acceptance Criteria:**
- [ ] "open" action entry is created automatically when a ticket is created or reopened
- [ ] "assignment" action entry is created automatically when assignee changes
- [ ] "closed" action entry is created automatically when ticket is closed
- [ ] "changeCategory" action entry is created automatically when category field is edited
- [ ] "changeLocation" action entry is created automatically when location field is edited
- [ ] "duplicate" action entry is created automatically when ticket is marked as a duplicate
- [ ] "upload_media" action entry is created automatically when media is attached
- [ ] Each system action entry includes: `ticket_id`, `enteredByPerson_id`, `enteredDate`, `actionDate`, `action_id`
- [ ] System action types cannot be manually selected in the action log form dropdown

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.2: Send Email Notification to Reporter on Action
**As a** Marcus Rivera (311 Operator), **I want to** check a "Notify Reporter" box when logging an action and have an email sent automatically, **so that** the constituent receives a professional update without me copying and pasting case details into a separate email.

**Acceptance Criteria:**
- [ ] "Notify Reporter" and "Notify Assignee" toggles are available in the action log form
- [ ] Email is sent only if the recipient has at least one email with `usedForNotifications = true`
- [ ] Email subject: "[uReport] Case #{id} — {action name}"
- [ ] Email body: action notes + standard case link footer
- [ ] Reply-to uses `category_action_responses.replyEmail` if set, else `actions.replyEmail`, else system default
- [ ] `sentNotifications` JSON field on the history entry records all email addresses actually notified
- [ ] Email delivery failure is non-fatal: history entry is saved regardless; toast "Email notification failed to send" warns the user
- [ ] Email is delivered via configured SMTP server (host/port/credentials in Spring Boot app config)

**Priority:** P0 | **Feature Ref:** F9

---

### US-9.3: Load Response Template into Action Notes
**As a** Diane Kowalski (Department Field Supervisor), **I want to** select a pre-configured response template for the current ticket's category and action type, **so that** I don't have to type repetitive resolution notes for common case types.

**Acceptance Criteria:**
- [ ] Template dropdown in action log form queries `GET /api/categories/{category_id}/action-responses/{action_id}`
- [ ] If no category-specific template exists, falls back to `GET /api/actions/{action_id}` template field
- [ ] Selecting a template pre-fills the notes textarea with the rendered template body
- [ ] Template variables (e.g., `{actionPerson}`, `{reportedByPerson}`) are rendered server-side before returning to frontend
- [ ] Staff may freely edit the pre-filled notes before submitting
- [ ] Changing the action type dropdown clears and resets the template selector

**Priority:** P0 | **Feature Ref:** F9

---
