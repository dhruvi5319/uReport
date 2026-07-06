# Screen-05: New Case Form (Staff)

**Route:** `/cases/new`
**Purpose:** Fast ticket intake for 311 operators during live calls; target ≤90 seconds end-to-end
**User Stories:** US-1.1, US-1.4, US-10.1, US-9.1
**Journeys:** JRN-01.1 — Live-Call Case Intake

---

## Layout — Desktop (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR                                                            │
│ Breadcrumb: Cases > New Case                                                │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  New Case                                                    │
│              │  ─────────────────────────────────────────────────────────   │
│              │                                                              │
│              │  ┌────────────────────────────────────────────────────────┐ │
│              │  │  REQUIRED FIELDS                                        │ │
│              │  │                                                         │ │
│              │  │  Category *                                             │ │
│              │  │  [Search categories...                        ▼]        │ │
│              │  │  → Department auto-fills: Public Works ✓                │ │
│              │  │                                                         │ │
│              │  │  Location *                                             │ │
│              │  │  [123 Oak Street, Springfield               ]           │ │
│              │  │  (address autocomplete suggestions dropdown)            │ │
│              │  │  — or —                                                 │ │
│              │  │  [Lat: ________]  [Lon: ________]  (optional fields)   │ │
│              │  │                                                         │ │
│              │  │  Description *                                          │ │
│              │  │  ┌─────────────────────────────────────────────────┐   │ │
│              │  │  │ Large pothole at the intersection...            │   │ │
│              │  │  │                                                 │   │ │
│              │  │  └─────────────────────────────────────────────────┘   │ │
│              │  │                                                         │ │
│              │  │  ──────────────────────────────────────────────────     │ │
│              │  │  OPTIONAL FIELDS                                        │ │
│              │  │                                                         │ │
│              │  │  Reporter                         Assignee              │ │
│              │  │  [Search people...      ▼]  [Search staff...    ▼]     │ │
│              │  │  [+ Create new person]        → Notification: ✓        │ │
│              │  │                                                         │ │
│              │  │  Issue Type                   Contact Method            │ │
│              │  │  [Report ▼]                   [Phone ▼]                │ │
│              │  │                                                         │ │
│              │  │  ──────────────────────────────────────────────────     │ │
│              │  │  PHOTOS (optional)                                      │ │
│              │  │  ┌─────────────────────────────────────────────────┐   │ │
│              │  │  │  ⬆ Drag & drop photos or click to browse       │   │ │
│              │  │  │  Up to 10 files · JPEG, PNG, GIF · Max 10 MB each│  │ │
│              │  │  └─────────────────────────────────────────────────┘   │ │
│              │  │  [thumb 1][thumb 2]  (after selection)                 │ │
│              │  │                                                         │ │
│              │  │  ──────────────────────────────────────────────────     │ │
│              │  │  [Cancel]                      [Create Case]            │ │
│              │  └────────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│ NAVBAR + breadcrumb            │
│ Cases > New Case               │
├────────────────────────────────┤
│ New Case                       │
│                                │
│ Category *                     │
│ [Search categories...   ▼]     │
│ → Dept: Public Works ✓         │
│                                │
│ Location *                     │
│ [123 Oak Street...      ]      │
│                                │
│ Description *                  │
│ [textarea, full width,         │
│  auto-expand]                  │
│                                │
│ Reporter                       │
│ [Search people...       ▼]     │
│                                │
│ Assignee                       │
│ [Search staff...        ▼]     │
│                                │
│ Issue Type   Contact Method    │
│ [Report ▼]   [Phone ▼]         │
│                                │
│ Photos                         │
│ [📷 Add Photos]  (native       │
│                   file picker) │
│ [thumb][thumb]                 │
│                                │
│ [      Create Case      ]      │
│ (full-width primary button)    │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Field | Rationale |
|---|---|---|
| Critical | Category | Drives department routing and SLA |
| Critical | Location | Geographic record; required for tracking |
| Critical | Description | Core case content |
| Secondary | Reporter | Caller identity; searchable later |
| Secondary | Assignee | Routing; triggers notification |
| Tertiary | Issue Type, Contact Method | Classification; less urgent |
| Tertiary | Photos | Supporting evidence; not required |

---

## Category Autocomplete Behavior

```
User types "pot" →

┌─────────────────────────────────────────────────────┐
│ [Pothole                          ] Roads & Sidewalks│
│ [Pothole — Emergency              ] Roads & Sidewalks│
│ [Pothole Report                   ] 311 Services     │
└─────────────────────────────────────────────────────┘
```

- After selection: `→ Department: Public Works ✓` auto-populates
- Department label animates in (Framer Motion, 150 ms)
- If category has a default assignee, Assignee field also pre-populates

---

## Reporter Search + Inline Create

```
User types "Priya" →
┌──────────────────────────────────────────┐
│  Priya Nair  priya@email.com             │
│  Priya Singh  (no email)                 │
│  ─────────────────────────────────────   │
│  + Create new person "Priya"             │
└──────────────────────────────────────────┘
```

Clicking "+ Create new person" opens a **mini Sheet** (right side panel) with inline person creation form. Sheet closes on save; reporter field fills with the new person's name.

---

## Assignee Notification Confirmation

When an assignee is selected:
```
Assignee
[Carlos Rivera ×]
✓ Email notification will be sent to carlos@city.gov
```

If the assignee has no notification email:
```
⚠ No notification email on file for this person
```

---

## Photo Upload Zone

| State | Appearance |
|---|---|
| Default | Dashed border rectangle; upload icon; helper text |
| Drag over | Solid primary blue border; "Drop photos here" |
| File selected | Thumbnail grid below zone; "×" remove per thumbnail |
| Error (size) | Red border on that thumbnail; "Exceeds 10 MB" inline |
| Error (type) | Red border; "Only JPEG, PNG, GIF accepted" inline |

---

## Form Validation

| Field | Rule | Error Message |
|---|---|---|
| Category | Required; must be active | "Please select a category" |
| Location | Address string OR lat/lon required | "Please enter a location or drop a pin" |
| Description | Required, min 1 char | "Please enter a description" |
| Lat | -90 to 90 | "Latitude must be between -90 and 90" |
| Lon | -180 to 180 | "Longitude must be between -180 and 180" |
| Photo | ≤10 MB, JPEG/PNG/GIF | Per-file inline error |

- Validation fires on **Submit** (not on blur) for required fields — minimize interruption during live call
- Exception: email field validates on blur if user moves away

---

## States

| State | Appearance |
|---|---|
| Default | Blank form; all required fields unlabeled (placeholder text) |
| Submitting | "Create Case" button shows spinner; form fields disabled |
| Success | Redirect to `/cases/{id}` + toast "Case #4821 created successfully" |
| Validation error | Required fields highlighted red; error text below each; focus moves to first error |
| Network error | Error toast "Failed to create case. Please try again." + retry; form data preserved |

---

## UX Design Decision — Single Screen vs. Multi-Step

The staff New Case form is intentionally a **single scrollable screen** (not a wizard). During a live phone call, Marcus cannot afford to navigate steps. All required and optional fields are visible and reachable in one scroll. The public submission form (Screen-07) uses a multi-step wizard because Priya is on mobile and the wizard reduces cognitive load for an unfamiliar user.

---

*End of Screen-05-new-case.md*
