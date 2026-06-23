---

### Flow 02: Ticket Lifecycle — Assign, Respond, Close, Reopen

**Trigger:** Staff opens an existing ticket  
**User Stories:** US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-13.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.2 (Assign, Select Template, Send Response), JRN-02.1 (Bulk Reassign)

```
[Ticket Detail View — open ticket]
    │
    ├─▶ [ASSIGN ACTION]
    │       Sidebar: "Assignee" field → inline person search
    │       Shows assignee's current open ticket count
    │       "Assign" button → POST /api/tickets/{id}/assign
    │       │
    │       ├── Success ──▶ [assignee badge updates; history entry added; email sent to assignee]
    │       └── Invalid assignee ──▶ [inline: "Staff member not found or inactive"]
    │
    ├─▶ [RESPOND ACTION — external, sent to reporter]
    │       "Add Response" button in sidebar or history panel
    │       Opens inline compose panel (NOT a new page):
    │         - Template dropdown (populated from GET /api/templates)
    │         - Selecting template pre-fills body (editable before send)
    │         - Variables substituted at send time
    │       "Send Response" → POST /api/tickets/{id}/responses
    │       │
    │       ├── Success ──▶ [toast: "Response sent to {email}"; action logged in history]
    │       └── SMTP failure ──▶ [toast warning: "Email delivery failed — will retry automatically"]
    │
    ├─▶ [INTERNAL COMMENT — staff-only, not sent to reporter]
    │       "Add Comment" tab in compose panel
    │       "Internal" badge clearly visible
    │       POST /api/tickets/{id}/comments
    │       │
    │       └── Success ──▶ [comment appears in history with 🔒 "Internal" badge]
    │
    ├─▶ [CLOSE ACTION]
    │       "Close Ticket" button → opens inline close modal
    │       Optional resolution text (max 5000)
    │       "Close & Notify Reporter" (if response text entered) or "Close Silently"
    │       │
    │       ├── Success ──▶ [status badge → Closed; history entry; reporter email if response]
    │       └── Already closed ──▶ [409 ALREADY_CLOSED → banner: "Ticket is already closed"]
    │
    ├─▶ [REOPEN ACTION — only on closed tickets]
    │       "Reopen" button visible only when status=closed
    │       Required reason field (max 1000)
    │       │
    │       ├── Success ──▶ [status badge → Open; history entry]
    │       ├── Empty reason ──▶ [inline: "Reason is required to reopen"]
    │       └── Already open ──▶ [409 ALREADY_OPEN → banner]
    │
    └─▶ [DELETE ACTION — admin only]
            "Delete Ticket" in kebab menu (⋮) — destructive, clearly separated
            Confirmation dialog: "This will permanently remove the ticket. Type the ticket ID to confirm."
            │
            └── Success ──▶ [navigate back to ticket list; toast: "Ticket #XXXX deleted"]

─────────────────────────────────
BULK REASSIGN (JRN-02.1)
─────────────────────────────────
[Ticket list — multi-select mode]
    │
    ▼
[Select checkboxes on 2+ tickets]
    │
    ▼
[Bulk actions bar appears at bottom of screen]
    "Assign to…" | "Change Status…" | "Export Selected"
    │
    ▼
[Assignee search in bulk panel — shows workload count per person]
    │
    ▼
[Confirm → PATCH each ticket async; progress indicator]
    │
    ▼
[Toast: "3 tickets reassigned to Jordan M." | Audit trail entry per ticket]
```

**Inline compose panel (template UX — US-13.2):**
- Panel opens in the right sidebar of the ticket detail view on desktop, or as a bottom sheet on mobile
- Template dropdown is visible immediately (no extra navigation — addresses JRN-01.2 pain point)
- Selecting a template populates the body; staff can edit before sending
- `{{ticket_id}}`, `{{category}}`, `{{assignee_name}}` etc. are shown as readable placeholders in the compose view and substituted at send time
- Missing variable values show as empty string (never raw `{{…}}` in the sent email)

**Substatus (US-17.1):**
- Substatus badge appears next to the primary status badge in the ticket header
- Clicking the substatus badge opens a dropdown to change it (inline, no modal)
- "Pending Parts", "Scheduled", "In Review" etc. configured by admin
