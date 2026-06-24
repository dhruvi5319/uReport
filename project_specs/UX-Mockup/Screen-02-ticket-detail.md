---

## Screen SCR-03: Ticket Detail View

**Purpose:** View and act on a single ticket. All ticket actions available from this screen without navigation.
**User Stories:** US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-0.7, US-1.1, US-1.3, US-10.1, US-10.2, US-8.2
**Journey:** JRN-01.2

### Layout

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│  Sidebar     │  ← Back to Tickets (breadcrumb — restores filter/scroll)  │
│              ├──────────────────────────────────────────────────────────┤
│              │  TICKET HEADER (sticky on scroll)                         │
│              │  ┌──────────────────────────────────────────────────────┐ │
│              │  │  #5821                                    [🔴 OPEN]  │ │
│              │  │  Pothole Repair — 1245 Main St, Springfield          │ │
│              │  │  Category: Streets / Pothole  |  SLA: ⚠ OVERDUE     │ │
│              │  │  Substatus: In Progress   Entered: 2026-06-14        │ │
│              │  │  Reporter: Jane Smith (jane@email.com)               │ │
│              │  │  Assigned: [Marcus Webb ▾ (change)]    [More ▾]     │ │
│              │  └──────────────────────────────────────────────────────┘ │
│              │                                                            │
│              │  ACTION PANEL  ┌────────────────────────────────────────┐ │
│              │                │ [Comment/Response] [Status] [Media]    │ │
│              │                ├────────────────────────────────────────┤ │
│              │                │  Template: [Select template... ▾]      │ │
│              │                │                                        │ │
│              │                │  Notes:                                │ │
│              │                │  ┌──────────────────────────────────┐  │ │
│              │                │  │                                  │  │ │
│              │                │  └──────────────────────────────────┘  │ │
│              │                │  [Submit Comment]                      │ │
│              │                └────────────────────────────────────────┘ │
│              │                                                            │
│              │  TICKET DETAILS  (collapsible sections)                   │
│              │  Description | Location | Custom Fields | Contact Method  │
│              │                                                            │
│              │  ATTACHMENTS  (thumbnail grid)                            │
│              │  [img1] [img2] [+ Add File]                               │
│              │                                                            │
│              │  HISTORY LOG  (append-only, oldest first)                 │
│              │  ┌────────────────────────────────────────────────────┐   │
│              │  │ Jun 14  Marcus W.  Ticket opened by Marcus Webb    │   │
│              │  │ Jun 14  Marcus W.  Assigned to Marcus Webb         │   │
│              │  │ Jun 16  Marcus W.  Comment: "Site inspection sched"│   │
│              │  │                   📧 Sent to: jane@email.com       │   │
│              │  └────────────────────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Ticket ID, status badge, category, location | Sticky header top row |
| Primary | SLA indicator, substatus | Sticky header second row |
| Secondary | Reporter info, assignee (with change affordance) | Sticky header third row |
| Secondary | Action panel (comment, status, media) | Immediately below header |
| Tertiary | Description, location detail, custom fields | Collapsible sections below action panel |
| Tertiary | Attachments thumbnails | Below collapsibles |
| Audit | History log | Bottom of view |

### Action Panel Tabs

#### Tab 1: Comment / Response (US-0.7, US-9.2, US-20.1)

| Element | Behavior |
|---------|----------|
| Template picker dropdown | Lists available response templates for this category's actions; selecting pre-fills notes textarea |
| Notes textarea | Editable; required (non-empty) to submit |
| Submit Comment button | POST /api/v1/tickets/{id}/comments; optimistic append to history; toast on success |

#### Tab 2: Change Status (US-0.4, US-0.6, US-8.2)

```
Current: OPEN / In Progress
New Status: [Close ▾]
  Substatus: [Resolved ▾]  (filtered to closed-type)
  Notes (optional): [__________]
  [Save Status Change]

--- or if ticket is closed ---

[Reopen Ticket]  → assigns default open substatus
```

| Validation | Behavior |
|------------|----------|
| Close requires substatus | Substatus dropdown required; empty = disabled Save button |
| Invalid transition | 422 response → inline error "Ticket is already in that state" |
| Duplicate marking | Separate "Mark as Duplicate" option under [More ▾] in header |

#### Tab 3: Attach Media (US-10.1, US-10.2)

```
┌─────────────────────────────────────────────┐
│  Drag & drop files here, or click to browse │
│  Supported: JPG, PNG, GIF, PDF              │
└─────────────────────────────────────────────┘
[file1.jpg ████████████ 100%  ✓]
[file2.png ████░░░░░░░░  42%  ⏳]
```

- Upload progress bar per file
- Thumbnail preview on successful upload (GET /api/v1/media/{id}/thumbnail)
- "upload_media" history entry auto-appended

### More Actions Menu (header [More ▾])

| Action | Behavior |
|--------|----------|
| Assign to… | Opens staff search modal; POST /api/v1/tickets/{id}/assign |
| Mark as Duplicate | Opens ticket search to find parent; PATCH /api/v1/tickets/{id}/duplicate |
| Edit Ticket Details | Opens inline edit mode for description, location, category, custom fields |
| Delete Ticket | Admin only; confirm dialog |

### Assignee Change Control

Clicking `[Marcus Webb ▾ (change)]` in the header opens a searchable staff picker popover scoped to staff-role people. Selection submits PATCH /api/v1/tickets/{id}/assign immediately.

### History Log (US-1.1, US-1.3)

Each entry shows:
- Date/time (relative + absolute on hover)
- Actor name (enteredByPerson)
- Rendered action description (template variables resolved)
- Notes (if present)
- 📧 Sent to: [email list] — shown when sentNotifications is populated (US-1.3)
- Action person name where applicable (e.g., "Assigned to [name]")

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Loading | Skeleton header + skeleton history entries | — |
| Error (404) | Full-page error card | "Ticket not found. [Back to list]" |
| Open ticket | Status badge green-ish, action panel all tabs active | — |
| Closed ticket | Status badge grey, "Reopen" shown in Status tab, comment still allowed | — |
| Overdue | SLA badge red with warning icon | — |
| Submitting action | Action panel button disabled + spinner | — |
| Action success | New history entry animates in at bottom of log | Toast: "Comment saved" |
