---

### PER-02: Diane Kowalski — Department Field Supervisor

#### JRN-02.1: Morning Department Triage

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-02.1) | Release |
|---|---|---|---|---|
| SM-12.01 | Login | US-12.1: Log In via CAS SSO | **Given** Diane opens uReport, **when** she authenticates via CAS, **then** she is redirected directly to her department's pre-filtered view — not a global unfiltered list | R1 |
| SM-12.02 | Login | US-12.2: Log In via LDAP | **Given** CAS is unavailable, **when** Diane logs in with LDAP credentials, **then** the same post-login redirect behavior applies — she lands on her department view | R1 |
| SM-18.04 | Login | US-18.2: Mobile Hamburger Drawer | **Given** Diane opens uReport on her phone, **when** she authenticates, **then** the mobile hamburger nav provides access to her department case queue with ≥ 44 px touch targets | R2 |
| SM-5.01 | Orient | US-5.1: Dashboard KPIs | **Given** Diane lands on the dashboard after login, **when** stat cards load, **then** the "Overdue" card shows a count scoped to her department and is a clickable link | R2 |
| SM-5.02 | Orient | US-5.4: Quick-Link Buttons | **Given** Diane is on the dashboard, **when** she clicks "All Open Cases", **then** the case list opens pre-filtered to `status=open` for her department in one click | R2 |
| SM-3.10 | View Cases | US-3.2: Filter by Department | **Given** Diane navigates to the case list, **when** the "My Department" pre-filtered view loads, **then** all visible cases belong to Public Works with a filter chip showing "Department: Public Works" | R1 |
| SM-3.11 | View Cases | US-3.5: Save Search Bookmark | **Given** Diane's department filter is active, **when** she saves it as "My Department Open Cases", **then** future sessions can restore this view in one click — no re-filtering required | R1 |
| SM-3.12 | Prioritize | US-3.2: Overdue Badge | **Given** cases exist that exceed the configured SLA threshold, **when** Diane scans the case list, **then** overdue cases display a red badge with elapsed days visible without opening each record | R2 |
| SM-5.03 | Prioritize | US-5.1: Overdue Stat Card | **Given** the dashboard loads, **when** Diane sees the Overdue stat card, **then** clicking it navigates to `/cases` pre-filtered to overdue + her department — no manual filter setup required | R2 |
| SM-1.06 | Plan | US-1.4: Assign a Ticket | **Given** Diane identifies priority cases, **when** she updates the assignee field from the case list row, **then** the reassignment is saved in one click with a toast confirmation | R1 |

---

#### JRN-02.2: Field Resolution Closure with Photo Evidence

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-02.2) | Release |
|---|---|---|---|---|
| SM-19.01 | Access | US-19.3: Mobile Responsive Layout | **Given** Diane opens uReport on a 375 px mobile browser, **when** any screen loads, **then** no horizontal scroll occurs and all touch targets are ≥ 44 px | R1 |
| SM-12.03 | Access | US-12.3: Session Expiry & Refresh | **Given** Diane is working in the field, **when** her session approaches expiry, **then** the JWT is silently refreshed without interrupting her workflow | R1 |
| SM-3.13 | Find Case | US-3.2: Mobile Case List | **Given** Diane opens the case list on mobile, **when** the list renders, **then** it shows her department's open cases with touch-optimized tap targets — tapping a row opens case detail | R1 |
| SM-4.03 | Review | US-4.1: Mobile Case Detail | **Given** Diane opens a case on mobile (≤ 768 px), **when** the case detail loads, **then** layout stacks: metadata → action form → timeline with key info visible above the fold | R1 |
| SM-4.04 | Log Resolution | US-4.3: Log Response + Notify | **Given** Diane taps "Log Response" on mobile, **when** she types a resolution note, toggles "Notify Reporter", and submits, **then** the history entry is created and an email is dispatched in a single submission | R1 |
| SM-9.03 | Log Resolution | US-9.3: Load Response Template | **Given** Diane is logging a resolution, **when** she selects a pre-configured template for "Pothole Resolved", **then** the notes textarea is pre-filled and she can edit before submitting | R1 |
| SM-4.05 | Log Resolution | US-4.4: Response Template Selector | **Given** the action log form is open, **when** Diane selects an action type, **then** templates for that action + category combination are available in the template dropdown | R1 |
| SM-1.07 | Log Resolution | US-1.2: Close Ticket with Substatus | **Given** Diane taps "Close Case" on mobile, **when** she selects substatus "Resolved" and optional notes, **then** the case status changes to closed and the confirmation dialog shows correctly on 375 px | R1 |
| SM-10.01 | Attach Photos | US-10.2: Attach Photo from Field | **Given** Diane taps "Add Photos" on her phone, **when** the native file picker opens, **then** she can select photos from camera roll; thumbnails confirm selection; upload succeeds on mobile | R2 |
| SM-10.02 | Attach Photos | US-10.3: View Photos in Lightbox | **Given** photos are attached to a case, **when** Diane or Marcus taps a thumbnail, **then** the full-size image opens in a lightbox with navigation arrows | R2 |
| SM-1.08 | Submit | US-1.3: Reopen a Closed Ticket | **Given** a ticket is closed, **when** Marcus or Diane clicks "Reopen", **then** a confirmation dialog with optional notes appears and the status updates without page reload | R1 |
| SM-19.02 | Submit | US-19.1: Keyboard-Only Access | **Given** any form is submitted, **when** using keyboard navigation, **then** all form controls are reachable and operable via Tab, Enter, Space, Escape | R1 |

---

#### JRN-02.3: Overdue Case Escalation

| SM-ID | Journey Stage | Story | NaC (derived from JTBD-02.3) | Release |
|---|---|---|---|---|
| SM-5.04 | Check Dashboard | US-5.1: Dashboard KPI — Overdue | **Given** cases exceed the configured SLA threshold, **when** Diane opens the dashboard, **then** the Overdue stat card displays a count scoped to her department within ≤ 2 s | R2 |
| SM-5.05 | Surface Overdue | US-5.4: Quick-Link from Dashboard | **Given** Diane clicks the Overdue stat card, **when** the navigation executes, **then** the case list opens pre-filtered to overdue + her department — no additional filter setup required | R2 |
| SM-3.14 | Review Overdue List | US-3.2: Overdue Badge in List | **Given** the overdue-filtered case list renders, **when** Diane scans rows, **then** days-overdue is shown in each row (via badge or tooltip) — no case-opening required to calculate elapsed time | R2 |
| SM-4.06 | Investigate | US-4.1: Case Timeline | **Given** Diane opens an overdue case, **when** the case detail loads, **then** the timeline panel shows all history entries chronologically; last action date is prominent without additional navigation | R1 |
| SM-4.07 | Escalate | US-4.2: Edit Fields Inline | **Given** Diane needs to reassign an overdue case, **when** she edits the assignee field inline, **then** the change is saved via PATCH and a history entry is created — no separate form required | R1 |
| SM-4.08 | Escalate | US-4.3: Log Response + Reassign | **Given** Diane submits a reassignment with a response note, **when** the single form submits, **then** both the reassignment history entry and the response log are created in one action | R1 |

---
