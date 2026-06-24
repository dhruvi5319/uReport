---

## Screen SCR-09: Substatus & Actions Admin

**Purpose:** Manage ticket substatuses and department action types; configure per-category action response templates.
**User Stories:** US-8.1, US-9.1, US-9.2
**Personas:** PER-02 Diana Reyes, PER-03 Jordan Kim

### Layout — Substatus Management

```
┌──────────────┬─────────────────────────────────────────────────────┐
│  Sidebar     │  Administration > Substatuses        [New Substatus] │
│              ├─────────────────────────────────────────────────────┤
│              │  OPEN substatuses                                    │
│              │  ┌───────────────────────────────────────────────┐  │
│              │  │  ⭐ New (default)          [system — read only]│  │
│              │  │  In Progress               [custom] [Edit]    │  │
│              │  │  Scheduled                 [custom] [Edit]    │  │
│              │  └───────────────────────────────────────────────┘  │
│              │                                                      │
│              │  CLOSED substatuses                                  │
│              │  ┌───────────────────────────────────────────────┐  │
│              │  │  ⭐ Resolved (default)      [system — read only]│  │
│              │  │  Duplicate                 [system — read only]│  │
│              │  │  Bogus                     [system — read only]│  │
│              │  │  Unable to Reproduce       [custom] [Edit]    │  │
│              │  └───────────────────────────────────────────────┘  │
└──────────────┴─────────────────────────────────────────────────────┘
```

### Substatus Create / Edit (inline form or modal)

```
Name *        [In Progress______________]
Description   [Ticket is actively being worked on]
Status *      [open ▾]     (open or closed)
Default       [  ]         (one default per parent status — auto-clears previous)

[Save] [Cancel]
```

**Notes (US-8.1):**
- System substatuses (Resolved, Duplicate, Bogus) show "system — read only" badge; no Edit/Delete
- Marking a substatus as Default automatically un-marks the previous default for that status
- Delete disabled for system substatuses

### Layout — Action Types Management

```
Administration > Action Types                      [New Action Type]
─────────────────────────────────────────────────────────────────────
SYSTEM ACTIONS (read-only seeds)
  open | assignment | closed | changeCategory | changeLocation
  response | duplicate | update | comment | upload_media

DEPARTMENT ACTIONS
  Work Order Scheduled  —  Streets & Sanitation  [Edit] [Delete]
  Inspection Complete   —  Streets & Sanitation  [Edit] [Delete]

[+ New Action Type]
```

### Action Type Create / Edit

```
Name *              [Work Order Scheduled__________]
Description Template [Work order scheduled by {enteredByPerson}]
                    (Template variable reference shown)
Email Template      [________________] (optional)
Reply Email         [________________] (optional)
Departments:        [Streets & Sanitation ✓] [Parks ✓] [+ Add]

[Save] [Cancel]
```

**Template variable reference** (inline help):
- `{enteredByPerson}` — person who performed the action
- `{actionPerson}` — person acted upon
- `{original:field}` / `{updated:field}` — field change values
- `{duplicate:ticket_id}` — parent ticket ID

### Category Action Response Overrides (US-9.2)

Accessible from Category Detail view → "Action Responses" section:

```
Category: Pothole Repair
──────────────────────────────────────────────
Action              | Override Template  | Reply Email
────────────────────|──────────────────────────────────
open               | [default]          | [default]
assignment         | [custom: ...]  [✎] | [default]
closed             | [custom: ...]  [✎] | repairs@city.gov
────────────────────|──────────────────────────────────
[+ Add Response Override]
```

Clicking [✎] opens an inline edit form for the template and reply email for that action/category pair.

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default list | System actions at top (greyed), department actions below | — |
| System action hover | Tooltip: "System action — cannot be modified" | — |
| Creating action | Form below/beside list | — |
| Default substatus conflict | Auto-resolved silently; previous default cleared | Toast: "Previous default cleared" |
| Template variable error | None (unknown tokens left as-is per spec) | — |
