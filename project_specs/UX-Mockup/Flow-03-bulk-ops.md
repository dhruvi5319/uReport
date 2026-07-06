# Flow-03: Storm Event Bulk Cleanup

**Trigger:** 34 duplicate reports from overnight storm; Marcus needs to close 33 as Duplicate in one action
**User Stories:** US-1.5, US-3.2, US-3.3
**Journey:** JRN-01.3 — Storm Event Bulk Cleanup
**Success Metric:** 33 cases bulk-closed in ≤60 seconds from first checkbox to success toast

---

## Flow Diagram

```
[Marcus opens /cases]
        │
        ▼
[Applies filters: Date=Yesterday, Category=Fallen Tree]
  → 34 rows visible
        │
        ▼
[Clicks "Select All on Page" header checkbox]
  → 34 rows highlighted with blue selection tint
  → Bulk toolbar appears: "34 cases selected"
        │
        ▼
[Unchecks the ONE canonical case to keep open]
  → "33 cases selected"
        │
        ▼
[Clicks "Bulk Close" in toolbar]
        │
        ▼
[Dialog opens: "Close 33 cases"]
  ┌──────────────────────────────────────┐
  │  Close 33 Cases                      │
  │  ──────────────────────────────────  │
  │  Substatus: [Duplicate ▼]  (required)│
  │  Parent Ticket ID: [______] (shown   │
  │  when Duplicate is selected)         │
  │  Notes: [optional textarea]          │
  │                                      │
  │  [Cancel]          [Confirm Close]   │
  └──────────────────────────────────────┘
        │
    ┌───┴───┐
  Cancel  Confirm
    │         │
    │         ▼
    │   [POST /api/tickets/bulk]
    │         │
    │     ┌───┴───┐
    │  Success  Partial fail
    │     │         └──▶ Toast: "30 closed, 3 failed"
    │     ▼
    │   Toast: "33 cases closed successfully"
    │   Case list refreshes (no page reload)
    │   Filtered list shows 1 remaining open case
    │
    ▼
[Toolbar dismissed; checkboxes cleared]
```

---

## Steps

1. **Filter application**: Date range and category filters applied via filter panel. Filter chips show active state. 34 rows rendered.
2. **Select All**: Header checkbox checked → all visible rows highlighted. Bulk action toolbar slides in from bottom (Framer Motion, 200 ms). Counter shows "34 cases selected".
3. **Deselect one**: Unchecking a row decrements counter. Selection tint is removed from that row. Remaining 33 stay highlighted.
4. **Bulk toolbar actions**: Three buttons visible — "Assign", "Change Status", "Close". "Close" is primary action.
5. **Confirmation dialog**: Shows exact count ("Close 33 cases"). Substatus dropdown is required. When "Duplicate" is selected, Parent Ticket ID field appears. Optional notes field below. Cancel is equally prominent as Confirm (equal weight buttons, not destructive styling on Cancel).
6. **Execution**: Single API call. Progress not shown (fast). On success, case list refreshes showing 1 remaining open row.
7. **Toast**: "33 cases closed successfully" with optional "View closed cases" link. Partial failure shows split count.

---

## Critical UX Moment

> The confirmation dialog **must** show the exact count ("33 cases") before Marcus clicks Confirm. Without this, he risks accidentally closing all 34 including the canonical case. The count is the trust signal.

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | Stay on `/cases` — refreshed list |
| Cancel | Stay on `/cases` — selection cleared |
| Partial failure | Stay on `/cases` — error toast with count |

---

*End of Flow-03-bulk-ops.md*
