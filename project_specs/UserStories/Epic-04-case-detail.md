## Epic 4: Case Detail View (F4)

The case detail at `/cases/{id}` shows the complete ticket record in a split-pane layout. Staff perform all management actions — status transitions, response logging, field editing, media attachment — without navigating away.

---

### US-4.1: View Complete Case Metadata and History on One Screen
**As a** Marcus Rivera (311 Operator), **I want to** view all case metadata and the full action history on a single screen when a caller asks for a status update, **so that** I never need to navigate to multiple screens during a live call.

**Acceptance Criteria:**
- [ ] Case detail at `/cases/{id}` shows a split-pane layout: metadata panel (left) + timeline panel (right)
- [ ] Metadata panel displays: Case ID, status badge, substatus, category, department, assignee, reporter, location, contact method, issue type, entered date, closed date, SLA indicator
- [ ] An interactive map pin shows the ticket's geographic location in the metadata panel
- [ ] Timeline panel shows all `ticket_history` entries chronologically, each with: action type icon, actor name, date, notes, and any attached media
- [ ] Parallel data requests are made on load: ticket metadata, history, and media fetched simultaneously
- [ ] Skeleton placeholders display while data is loading
- [ ] On mobile (≤ 768 px), layout stacks: metadata → action form → timeline
- [ ] Breadcrumb shows `Cases > Case #ID`; back link preserves case list filter state

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.2: Edit Case Fields Inline Without Leaving the Screen
**As a** Marcus Rivera (311 Operator), **I want to** edit ticket fields (category, assignee, location, description) inline on the case detail screen, **so that** I can update a case without navigating to a separate edit form.

**Acceptance Criteria:**
- [ ] Editable fields show an "Edit" icon; clicking it transitions the field to an editable control (input, dropdown, or date picker)
- [ ] "Save" commits the change via `PATCH /api/tickets/{id}`; "Cancel" restores the original value
- [ ] On save, a `ticket_history` entry is created for the field change (e.g., "changeCategory", "changeLocation")
- [ ] Optimistic UI: field shows new value immediately; reverts on API error with error toast
- [ ] Closed tickets are read-only for standard staff; only admin role can edit closed ticket fields
- [ ] Toast "Case updated" confirms each save
- [ ] Field validation: category must be active, assignee must be staff, lat/lon must be in valid range

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.3: Log a Response and Optionally Notify the Reporter
**As a** Diane Kowalski (Department Field Supervisor), **I want to** log a response on a case with optional email notification to the reporter, **so that** the 311 operator and the constituent are both informed of what action was taken.

**Acceptance Criteria:**
- [ ] An action log form at the top of the timeline panel shows: action type dropdown, notes textarea, "Notify Reporter" toggle, "Notify Assignee" toggle
- [ ] Action type dropdown shows only actions of type `department` that are permitted for the ticket's department (`department_actions`)
- [ ] Admin users see all department actions regardless of department filtering
- [ ] Notes are required when action type is "response"; optional for other types
- [ ] On submit: `POST /api/tickets/{id}/history` creates the history entry
- [ ] If "Notify Reporter" is checked and reporter has a notification email, email is sent
- [ ] Email delivery failure is non-fatal: history entry is saved and a warning toast appears "Email notification failed to send"
- [ ] New timeline entry appears at the top of the history panel without full page reload
- [ ] `sentNotifications` JSON field records which email addresses were actually notified

**Priority:** P0 | **Feature Ref:** F4

---

### US-4.4: Use a Response Template to Pre-Fill Action Notes
**As a** Diane Kowalski (Department Field Supervisor), **I want to** select a pre-written response template when logging an action, **so that** I can send consistent, professional responses without retyping boilerplate text for every case closure.

**Acceptance Criteria:**
- [ ] A "Select template" dropdown is available in the action log form
- [ ] Templates are loaded from `category_action_responses` for the current ticket's category + selected action type
- [ ] If no category-specific template exists, the fallback is `actions.template` for the selected action type
- [ ] Selecting a template pre-fills the notes textarea; staff can edit before submitting
- [ ] Template variables (e.g., `{actionPerson}`, `{reportedByPerson}`) are rendered server-side before returning to the frontend
- [ ] Changing the action type resets the template selector

**Priority:** P0 | **Feature Ref:** F4

---
