## Epic 13: Admin Panels — Substatus, Issue Types, Response Templates, Contact Methods (F13)

A set of lookup-table admin panels allow administrators to manage configurable system values used throughout ticket creation and case management.

---

### US-13.1: Manage Substatus Values
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete substatus values (e.g., Resolved, Duplicate, Bogus), **so that** staff have accurate closure classification options that reflect current operational categories.

**Acceptance Criteria:**
- [ ] An admin panel (within `/admin`) lists all substatus values with name and Edit/Delete actions
- [ ] "New Substatus" button opens a form with a name field (required)
- [ ] On save: POST creates the substatus record; toast "Substatus saved"; list refreshes
- [ ] Edit opens the form pre-filled; PUT updates the record
- [ ] Delete shows confirmation dialog before executing
- [ ] Substatuses are available in the substatus selector on ticket close and bulk close dialogs
- [ ] Inline toast notification on every save action

**Priority:** P1 | **Feature Ref:** F13

---

### US-13.2: Manage Issue Types
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete issue types (Comment, Complaint, Question, Report, Request, Violation), **so that** operators can accurately classify the nature of each service request.

**Acceptance Criteria:**
- [ ] An admin panel lists all issue types with name and Edit/Delete actions
- [ ] "New Issue Type" button opens a form with a name field (required)
- [ ] On save: POST creates the issue type record; toast "Issue type saved"; list refreshes
- [ ] Issue types appear in the issue type dropdown on New Case form and Case Detail edit panel
- [ ] Delete shows confirmation dialog before executing
- [ ] Inline toast on every save action

**Priority:** P1 | **Feature Ref:** F13

---

### US-13.3: Manage Response Templates
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete global response templates with body text, **so that** 311 operators have a consistent library of pre-written responses to reduce data entry.

**Acceptance Criteria:**
- [ ] An admin panel lists all response templates with name, body preview, and Edit/Delete actions
- [ ] "New Template" button opens a form: name (required), body text (textarea, required)
- [ ] On save: POST creates the template; toast "Template saved"; list refreshes
- [ ] Edit opens the form pre-filled; PUT updates the record
- [ ] Delete shows confirmation dialog before executing
- [ ] Templates are available in the response template selector on the Case Detail action log form
- [ ] Category-level templates (`category_action_responses`) are managed within the category edit form (F8), not here

**Priority:** P1 | **Feature Ref:** F13

---

### US-13.4: Manage Contact Methods
**As a** Jordan Calloway (System Administrator), **I want to** create, edit, and delete contact method values (Email, Phone, Web Form, Other, custom), **so that** operators can accurately record how a constituent contacted the city.

**Acceptance Criteria:**
- [ ] An admin panel lists all contact methods with name and Edit/Delete actions
- [ ] "New Contact Method" button opens a form with a name field (required)
- [ ] On save: POST creates the contact method; toast "Contact method saved"; list refreshes
- [ ] Edit opens the form pre-filled; PUT updates the record
- [ ] Delete shows confirmation dialog before executing
- [ ] Contact methods appear in the contact method dropdown on New Case form and Case Detail inline edit
- [ ] Inline toast on every save action

**Priority:** P1 | **Feature Ref:** F13

---
