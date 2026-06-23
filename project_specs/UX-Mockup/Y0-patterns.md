---

## Interaction Patterns

### Pattern: Inline Action Panels (No Page Navigation for Actions)

**When to use:** Any mutation action on a ticket (assign, respond, comment, close, reopen)  
**Behavior:** Action controls live in the right sidebar of the ticket detail view on desktop. On mobile, they appear as a bottom sheet. The user never navigates away from the ticket to perform an action.  
**Why:** JRN-01.2 pain point — legacy required navigating to separate pages for responses, templates, and assignment, losing context and slowing call intake.  
**Examples:** Ticket detail screen (Screen-03), compose panel, assignee field  
**Implementation notes:**
- Right sidebar is sticky (scrolls with the page on short viewports)
- Bottom sheet on mobile slides up from the bottom with a drag handle
- Compose panel shows "Response / Comment" radio clearly before typing begins
- All mutations submit via the existing ticket detail page URL (no route change)

---

### Pattern: Progressive Disclosure in Multi-Step Forms

**When to use:** Creating a ticket (staff, Screen-04), public submission (citizen, Screen-05), category configuration (admin, Screen-08)  
**Behavior:** Form is divided into 3–4 clearly labeled steps. Only the current step's fields are visible. Back/next navigation preserves entered data. Required fields block advancing; optional fields allow skipping.  
**Why:** Reduces cognitive load for first-time users (citizens, new staff). Applies to all four personas across different flows.  
**Examples:** Staff ticket create (/tickets/new), public submit (/submit), admin category create  
**Step indicator:** Visual step dots or numbered breadcrumb at top; announces current step via `aria-live`

---

### Pattern: One-Click Bookmark Restore

**When to use:** Staff user returns to /tickets after login  
**Behavior:** Bookmarks dropdown in the filter bar lists up to 50 personal bookmarks. Clicking any bookmark immediately sets all filter parameters (status, category, department, assignee, sort, date range) and reloads the result list.  
**Why:** JRN-01.1 core need — "restore her personal filter queue in ≤ 2 clicks after login"  
**Examples:** Ticket list (Screen-02), Dashboard (Screen-01)  
**URL state:** Filter state is reflected in the URL query params so bookmarks can be shared via link

---

### Pattern: SLA Color Semantics (Consistent Across All Views)

**When to use:** Any surface that shows a ticket with an SLA — ticket list, dashboard KPI cards, SLA dashboard, map clusters  
**Behavior:** A consistent three-color system communicates urgency at a glance without reading text:
- 🔴 Red: SLA breached (past expected close date)
- 🟡 Amber: SLA due within 24 hours
- 🟢 Green: Within SLA window
- — (none): No SLA configured for this category  
**Why:** JRN-01.1 "color-coded SLA status badges let Dana rank at a glance without opening tickets"  
**Accessibility:** Color is never the sole indicator — badge also includes text label ("Breached", "Due today", "On track") for color-blind users and screen readers

---

### Pattern: One-Time Secret Display (API Key Generation)

**When to use:** Admin generates a new API client key  
**Behavior:** Generated key is shown in a modal that:
1. Has no ✕ button (cannot be dismissed without acknowledging)
2. Has a "Copy to clipboard" button
3. Has a warning: "This key will not be shown again"
4. Has a single confirmation button: "I've saved my key — Close"  
**Why:** JRN-04.2 key moment — "the generated key is shown only once; a clear 'Copy to clipboard' interaction and a warning prevents Tomás from losing the key"  
**Examples:** Admin API Clients screen (Screen-08)

---

### Pattern: Sticky Submit CTA (Mobile Forms)

**When to use:** Any form on mobile viewport (≤768px)  
**Behavior:** The primary submit/next button is fixed to the bottom of the viewport using `position: sticky` on a button bar. Always reachable without scrolling.  
**Why:** JRN-03.1 — Priya submitting on a 375px phone. Scroll depth on mobile is unpredictable; the CTA must always be in thumb reach.  
**Examples:** Public submit form (Screen-05), ticket create (Screen-04 mobile)

---

### Pattern: Inline Error Display (Field-Level, Not Modal)

**When to use:** Any form with server-side validation (422 responses)  
**Behavior:**
1. Client-side validation runs first (required fields, email format, file size/type)
2. On submission, API 422 errors are mapped to field names and displayed below the relevant input
3. Page scrolls to the first field with an error
4. Error messages are associated with their inputs via `aria-describedby`  
**Why:** US-15.2: "Server validation errors (HTTP 422) are displayed as inline field-level error messages"  
**Examples:** All forms — ticket create, public submit, admin panels  
**Pattern:** Never use a generic modal for validation errors; always surface field-level

---

### Pattern: Toast Notifications for Action Feedback

**When to use:** After any successful mutation (assign, close, respond, create, delete, export)  
**Behavior:**
- Toast appears top-right (desktop) or top-center (mobile)
- Auto-dismisses after 4 seconds
- Can be manually dismissed
- Includes action summary: "Ticket #4821 assigned to Jordan M."
- Error toasts (SMTP failure, partial success) use amber/red color and do not auto-dismiss  
**Examples:** After assign, respond, close, create, bulk reassign, CSV download start

---

### Pattern: Confirmation Dialogs for Destructive Actions

**When to use:** Delete ticket (admin), deactivate department/category, revoke API key, reopen closed ticket  
**Behavior:**
- Modal dialog with clear warning copy
- For high-risk actions (delete ticket, deactivate dept with active tickets): user must type a confirmation string (ticket ID or department name)
- Cancel button always on the left; destructive button on the right
- Destructive button uses red color token with clear label ("Delete", "Deactivate")  
**Why:** US-0.7, US-2.2 — prevent accidental irreversible actions  
**Examples:** Ticket delete, Department deactivate (with active tickets warning)
