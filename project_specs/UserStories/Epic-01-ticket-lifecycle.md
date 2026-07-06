## Epic 1: Ticket / Case Lifecycle Management (F1)

The ticket is the core domain entity. Staff create, assign, update, close, reopen, and bulk-manage tickets through the React UI. Every state transition is recorded in the immutable ticket history.

---

### US-1.1: Create a New Ticket from a Phone Call
**As a** Marcus Rivera (311 Operator), **I want to** create a new ticket quickly from a form at `/cases/new`, **so that** I can intake a caller's service request and immediately redirect them to a case ID without interrupting the call.

**Acceptance Criteria:**
- [ ] `/cases/new` route is accessible to authenticated staff and loads without full page reload
- [ ] Required fields: category (dropdown from active categories), description, and at least one location signal (address or lat/lon)
- [ ] Optional fields: reporter person (search/select or inline create), assignee person, issue type, contact method
- [ ] On submit, ticket is created with `status = 'open'`, `enteredDate = NOW()`, `enteredByPerson_id = current user`
- [ ] A `ticket_history` "open" entry is created automatically on ticket creation
- [ ] If assignee is set, an additional "assignment" history entry is created and email notification sent to assignee
- [ ] Successful submission redirects to `/cases/{id}` and shows toast "Case #{id} created successfully"
- [ ] New case form completes end-to-end in under 90 seconds for a typical entry

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.2: Close a Ticket with a Substatus
**As a** Marcus Rivera (311 Operator), **I want to** close a ticket from the case detail screen with a required substatus selection, **so that** the ticket is accurately categorized (Resolved, Duplicate, Bogus) and the reporter is notified.

**Acceptance Criteria:**
- [ ] "Close Case" button opens a confirmation dialog with a required substatus dropdown
- [ ] Available substatuses: Resolved, Duplicate, Bogus, and any custom configured substatuses
- [ ] When substatus = Duplicate, a parent ticket ID input appears and is required before confirming
- [ ] Optional closing notes can be entered in the dialog
- [ ] On confirm: `tickets.status = 'closed'`, `closedDate = NOW()`, `substatus_id` set to selected value
- [ ] If Duplicate: `tickets.parent_id` is set to the specified parent ticket ID
- [ ] A `ticket_history` "closed" entry is created with closing notes
- [ ] Email notification is sent to reporter if notification toggle was enabled
- [ ] Status badge on case detail updates immediately to reflect closed state
- [ ] Attempting to close without selecting substatus shows inline validation error

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.3: Reopen a Closed Ticket
**As a** Marcus Rivera (311 Operator), **I want to** reopen a closed ticket from the case detail screen, **so that** I can resume managing a case that was prematurely closed or has recurred.

**Acceptance Criteria:**
- [ ] "Reopen" button is visible on case detail when `tickets.status = 'closed'`
- [ ] Clicking "Reopen" shows a confirmation dialog with an optional notes field
- [ ] On confirm: `tickets.status = 'open'`, `closedDate = NULL`, `substatus_id = NULL`
- [ ] A `ticket_history` "open" (reopen) entry is created with optional notes
- [ ] Assignee is notified via email if notification is configured
- [ ] Status badge updates immediately from closed to open without full page reload
- [ ] The Close button reappears and the Reopen button is hidden after reopening

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.4: Assign a Ticket to a Staff Person
**As a** Marcus Rivera (311 Operator), **I want to** assign a ticket to a specific staff person or department, **so that** the right person receives notification and takes ownership of the case.

**Acceptance Criteria:**
- [ ] Assignee field on case detail shows a searchable person selector (filtered to staff roles)
- [ ] Saving the assignment updates `tickets.assignedPerson_id`
- [ ] A `ticket_history` "assignment" entry is created referencing the new assignee
- [ ] Email notification is sent to the new assignee if they have a notification email configured
- [ ] Reassigning from one person to another creates a new history entry and sends a new notification
- [ ] Assignment can also be made from a bulk operation on the case list (see US-3.5)
- [ ] Toast "Case updated" confirms the save without page reload

**Priority:** P0 | **Feature Ref:** F1

---

### US-1.5: Perform Bulk Operations on Multiple Tickets
**As a** Marcus Rivera (311 Operator), **I want to** select multiple tickets from the case list and perform bulk assign, close, or status-change in one action, **so that** I can process batches of duplicate reports without touching each record individually.

**Acceptance Criteria:**
- [ ] Checkboxes on each case list row allow multi-select; "Select all on page" header checkbox selects all visible rows
- [ ] A bulk action toolbar appears when one or more checkboxes are selected
- [ ] Available bulk actions: Assign, Close, Change Status
- [ ] Bulk assign shows assignee selector dialog; bulk close shows substatus selector dialog
- [ ] On confirm: each selected ticket receives the action individually with its own `ticket_history` record
- [ ] A toast notification shows "X cases updated successfully" (and "Y failed" if any errors)
- [ ] Case list refreshes after bulk action without full page reload
- [ ] Closing tickets in bulk requires substatus selection (same validation as single close)

**Priority:** P0 | **Feature Ref:** F1

---
