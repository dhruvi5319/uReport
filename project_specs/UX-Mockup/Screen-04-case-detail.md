# Screen-04: Case Detail

**Route:** `/cases/:id`
**Purpose:** Full case record, inline editing, status transitions, action logging, media gallery, history timeline — all without leaving the screen
**User Stories:** US-4.1–4.4, US-1.2–1.4, US-10.2–10.4, US-9.1–9.3
**Journeys:** JRN-01.1 (Confirm), JRN-01.2 (Respond), JRN-02.2 (Review, Log Resolution, Attach Photos), JRN-02.3 (Investigate, Escalate)

---

## Layout — Desktop Split-Pane (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                                      │
│ Breadcrumb: Cases > Case #5102                                              │
├──────────────┬──────────────────────┬──────────────────────────────────────┤
│ SIDEBAR      │ LEFT PANE (w-2/5)    │ RIGHT PANE (w-3/5)                   │
│              │                      │                                      │
│              │ ┌──────────────────┐ │ ┌──────────────────────────────────┐ │
│              │ │ [OPEN] Case #5102│ │ │ LOG ACTION / RESPONSE            │ │
│              │ │ Pothole          │ │ │ ─────────────────────────────── │ │
│              │ │                  │ │ │ Action Type: [Response ▼]        │ │
│              │ │ Status           │ │ │ Template: [Select template ▼]    │ │
│              │ │ [OPEN ▼]  (edit) │ │ │ Notes:                           │ │
│              │ │                  │ │ │ ┌───────────────────────────────┐│ │
│              │ │ Category [✎]     │ │ │ │ (textarea — auto-expand)      ││ │
│              │ │ Pothole          │ │ │ │                               ││ │
│              │ │                  │ │ │ └───────────────────────────────┘│ │
│              │ │ Department       │ │ │                                  │ │
│              │ │ Public Works     │ │ │ ☐ Notify Reporter                │ │
│              │ │                  │ │ │ ☐ Notify Assignee                │ │
│              │ │ Assignee [✎]     │ │ │                                  │ │
│              │ │ Carlos Rivera    │ │ │ [      Submit Action       ]     │ │
│              │ │                  │ │ ├──────────────────────────────────┤ │
│              │ │ Reporter         │ │ │ ACTIVITY TIMELINE                │ │
│              │ │ Priya Nair       │ │ │ ─────────────────────────────── │ │
│              │ │                  │ │ │ ┌──────────────────────────────┐ │ │
│              │ │ Location [✎]     │ │ │ │[↩] RESPONSE — Jul 6, 10:14am│ │ │
│              │ │ Oak & 3rd St     │ │ │ │ Carlos Rivera                │ │ │
│              │ │                  │ │ │ │ "Pothole filled with cold    │ │ │
│              │ │ SLA              │ │ │ │  patch asphalt, area secured"│ │ │
│              │ │ [▓▓▓░░░] 3/5days │ │ │ │ [Photo thumbnail x2]        │ │ │
│              │ │                  │ │ │ └──────────────────────────────┘ │ │
│              │ │ Entered: Jul 4   │ │ │ ┌──────────────────────────────┐ │ │
│              │ │ Contact: Phone   │ │ │ │[→] ASSIGNED — Jul 4, 8:52am │ │ │
│              │ │ Issue: Report    │ │ │ │ Marcus Rivera → Carlos Rivera│ │ │
│              │ │                  │ │ │ └──────────────────────────────┘ │ │
│              │ │ [Close Case]     │ │ │ ┌──────────────────────────────┐ │ │
│              │ │ [Reopen] (hidden)│ │ │ │[◯] OPENED — Jul 4, 8:50am  │ │ │
│              │ │                  │ │ │ │ Marcus Rivera                │ │ │
│              │ │ ─────────────── │ │ │ └──────────────────────────────┘ │ │
│              │ │ MAP PIN          │ │ └──────────────────────────────────┘ │
│              │ │ [mini map — pin  │ │                                      │
│              │ │  at Oak & 3rd]   │ │                                      │
│              │ │                  │ │                                      │
│              │ │ ─────────────── │ │                                      │
│              │ │ MEDIA GALLERY    │ │                                      │
│              │ │ [thumb][thumb]   │ │                                      │
│              │ │ [+ Attach Photo] │ │                                      │
│              │ └──────────────────┘ │                                      │
└──────────────┴──────────────────────┴──────────────────────────────────────┘
```

---

## Layout — Mobile Stacked (375 px)

```
┌────────────────────────────────┐
│ NAVBAR (hamburger)             │
│ ← Cases > Case #5102           │
├────────────────────────────────┤
│ [OPEN]  Case #5102  Pothole   │  ← status badge + title
│                                │
│ METADATA (stacked)            │
│ Category: Pothole              │
│ Department: Public Works       │
│ Assignee: Carlos Rivera [✎]   │
│ Reporter: Priya Nair           │
│ Location: Oak & 3rd St [✎]    │
│ SLA: [▓▓▓░░░] 3 of 5 days     │
│ Entered: Jul 4, 2026           │
│ Contact: Phone                 │
│                                │
│ [MAP PIN — compact h-36]       │
│                                │
│ [Close Case]                   │
│                                │
├────────────────────────────────┤
│ LOG ACTION                     │
│ Action Type: [Response ▼]      │
│ Template: [Select ▼]           │
│ Notes: [textarea, auto-expand] │
│ ☐ Notify Reporter              │
│ ☐ Notify Assignee              │
│ [Submit Action] (full-width)   │
├────────────────────────────────┤
│ MEDIA                          │
│ [thumb 1][thumb 2]             │
│ [+ Attach Photo]               │
├────────────────────────────────┤
│ TIMELINE                       │
│ ┌──────────────────────────┐  │
│ │ RESPONSE — Jul 6, 10:14  │  │
│ │ Carlos Rivera            │  │
│ │ "Pothole filled..."      │  │
│ │ [📷 2 photos]            │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ ASSIGNED — Jul 4, 8:52   │  │
│ │ Marcus → Carlos          │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ OPENED — Jul 4, 8:50     │  │
│ │ Marcus Rivera            │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Status badge + Case ID + Category | Top of left pane / above fold |
| Primary | Close Case / Reopen button | Below metadata |
| Primary | Action log form | Top of right pane (above timeline) |
| Secondary | Assignee (editable) | Left pane metadata |
| Secondary | Activity timeline | Right pane (scrollable) |
| Secondary | SLA progress bar | Left pane |
| Tertiary | Map pin | Below metadata, left pane |
| Tertiary | Media gallery | Below map, left pane |

---

## Inline Editing Pattern

```
READ MODE:
  Assignee
  Carlos Rivera  [✎ Edit]

EDIT MODE (on [✎] click):
  Assignee
  [Search people...        ▼]  [✓ Save]  [✕ Cancel]

SAVING MODE (optimistic — shows new value immediately):
  Assignee
  Jenna Torres  [Saving...]

ERROR (reverts to original):
  Assignee
  Carlos Rivera  [✎ Edit]
  ⚠ Could not save. Try again.
```

- **Optimistic UI**: New value shown immediately; revert on API error
- **Fields editable**: Category, Assignee, Location, Description, Issue Type, Contact Method
- **Closed tickets**: All fields read-only for staff role; edit icons hidden. Admin role retains edit access.

---

## Close Case Dialog

```
┌────────────────────────────────────────────────┐
│  Close Case #5102                              │
│  ────────────────────────────────────────────  │
│  Substatus (required)                          │
│  [Resolved ▼]                                  │
│                                                │
│  (When "Duplicate" selected:)                  │
│  Parent Ticket ID (required)                   │
│  [_________]                                   │
│                                                │
│  Closing notes (optional)                      │
│  [textarea]                                    │
│                                                │
│  ☐ Notify reporter of closure                  │
│                                                │
│  [Cancel]              [Close Case]            │
└────────────────────────────────────────────────┘
```

After confirm: Status badge animates from blue `[OPEN]` → green `[RESOLVED]`. "Close Case" button replaces with "Reopen". Timeline prepends "CLOSED" entry.

---

## Timeline Entry Design

```
┌──────────────────────────────────────────────────────┐
│ [icon]  ACTION TYPE          Date: Jul 6 10:14 AM    │
│          Actor: Carlos Rivera                        │
│          ──────────────────────────────────          │
│          Notes text appears here, can wrap to        │
│          multiple lines as needed                    │
│                                                      │
│          [📷 photo1.jpg]  [📷 photo2.jpg]           │
│                    (thumbnail click → lightbox)      │
└──────────────────────────────────────────────────────┘
```

**Action type icons**:
- OPENED: `◯` (open circle)
- ASSIGNED: `→` (arrow)
- RESPONSE: `↩` (reply)
- COMMENT: `💬`
- CLOSED: `✕`
- UPLOAD_MEDIA: `📷`
- CHANGE_CATEGORY: `⊙`
- CHANGE_LOCATION: `📍`

---

## Lightbox (Photo Viewer)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                           [×]   │
│                                                                 │
│  [◀]          [Full-size photo centered]               [▶]     │
│                                                                 │
│              photo1.jpg — Uploaded Jul 6 by Carlos Rivera       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Opens as a full-screen modal overlay
- Previous/Next navigation (keyboard arrow keys also work)
- Close: `×` button or Escape key
- Focus trapped inside lightbox (ARIA modal pattern)
- Photo metadata below image: filename, upload date, uploader name
- On thumbnail hover (desktop): delete button (trash icon) appears; click → confirmation dialog

---

## Media Gallery

```
[thumb 1]  [thumb 2]  [thumb 3]  [+ Attach Photo]
(150×150)  (150×150)  (150×150)
```

- Thumbnails sorted by `media.uploaded ASC`
- Hover reveals delete button (staff only)
- Mobile: `<input type="file" accept="image/*" capture>` — opens native camera/gallery
- After upload: gallery refreshes; toast "Photo attached"

---

## Response Template Selector

- Appears in action log form
- Queries `GET /api/categories/{cat_id}/action-responses/{action_id}` when action type changes
- Falls back to `GET /api/actions/{action_id}` template if no category-specific template
- Selecting a template pre-fills the notes textarea
- Staff can freely edit pre-filled notes before submitting
- Changing action type resets the template selector

---

## States

| Element | Loading | Success | Error | Empty |
|---|---|---|---|---|
| Metadata panel | Skeleton fields | Fields rendered | "Case not found" + back link | — |
| Timeline | Skeleton entries (3) | Entries rendered | Error + retry | "No activity yet" |
| Media gallery | Skeleton thumbnails | Thumbnails rendered | Error message | "No photos attached" + "Attach Photo" CTA |
| Action form | — | Enabled | Field-level errors | — |
| Inline edit save | Field shows spinner | Optimistic new value | Reverts + error toast | — |

---

*End of Screen-04-case-detail.md*
