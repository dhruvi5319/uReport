# Flow-01: Live-Call Case Intake

**Trigger:** Marcus receives a 311 call; clicks "New Case" in navbar or dashboard quick-link
**User Stories:** US-1.1, US-10.1, US-1.4, US-9.1, US-9.2
**Journey:** JRN-01.1 — Live-Call Case Intake
**Success Metric:** Case created in ≤90 seconds, case ID read to caller

---

## Flow Diagram

```
[Marcus receives call]
        │
        ▼
[Clicks "New Case" (navbar or dashboard)]
        │
        ▼
[/cases/new loads — single scrollable form]
        │
        ▼
┌───────────────────────────────┐
│  Fill required fields:        │
│  • Category (autocomplete)    │──▶ [Dept auto-populates from category]
│  • Location (address or map)  │
│  • Description                │
│  • Reporter (search/create)   │
│  • Assignee (optional)        │
│  • Photo upload (optional)    │
└───────────────────────────────┘
        │
        ▼
[Client-side validation]
        │
    ┌───┴───┐
  Pass    Fail
    │       └──▶ [Inline errors highlighted; focus moves to first error]
    ▼
[POST /api/tickets — multipart]
        │
    ┌───┴───┐
 Success  Network error
    │       └──▶ [Error toast + retry button; form data preserved]
    ▼
[Redirect to /cases/{id}]
        │
        ▼
[Toast: "Case #4821 created successfully"]
        │
        ▼
[Case Detail renders — Marcus reads ID to caller]
```

---

## Steps

1. **Entry**: Marcus clicks "New Case" from the persistent navbar button (always visible — no menu traversal). No full-page reload. Route changes to `/cases/new` via React Router.
2. **Form render**: Single scrollable form with all required fields visible. Category dropdown uses autocomplete (type to search). Selecting a category auto-populates Department field with a visual confirmation badge "→ Public Works".
3. **Location**: Address field shows Mapbox autocomplete suggestions after 300 ms debounce. Optional map pin-drop available inline. At least one location signal (address or lat/lon) is required.
4. **Reporter**: Searchable person selector (type name → results). Option to "Create new person inline" opens a mini-form in a Sheet without navigating away.
5. **Assignee**: Optional. If set, shows "Email notification will be sent to {name}" confirmation.
6. **Photos**: Drag-and-drop zone + file picker. Thumbnails shown immediately. Up to 10 files, ≤10 MB each.
7. **Submit**: Single "Create Case" button. Loading spinner replaces button text. Form stays enabled for edits during submission.
8. **Success**: Redirect to `/cases/{id}`. Toast appears: "Case #4821 created successfully". The case ID is shown prominently in the case detail header in JetBrains Mono font — Marcus reads it to the caller.
9. **Back navigation**: Breadcrumb returns to case list preserving all active filters.

---

## Critical UX Moment — Delight Opportunity

> At step 8, the case ID appears instantly in JetBrains Mono on the case detail. Marcus reads "Case 4,821" to the caller while still on the phone. This is the moment of visible competence — the system enables it only if the redirect is instant (<2 s total).

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | `/cases/{id}` + toast |
| Cancel (no changes) | `/cases` (case list) |
| Network error | Stay on `/cases/new` + error toast |

---

*End of Flow-01-case-intake.md*
