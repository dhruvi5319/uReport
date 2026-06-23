---

### Screen 03: Ticket Detail View (with History, Media, Actions Sidebar)

**Route:** `/tickets/:id`  
**Purpose:** Full ticket record. Staff read all fields, see audit history, view attachments, and take all lifecycle actions (assign, respond, close, reopen, delete) from a single screen.  
**User Stories:** US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-6.1, US-7.2, US-13.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Open First Ticket), JRN-01.2 (Assign, Select Template, Send Response)

#### Layout (Desktop — 1280px+)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                              [← Back to list]        │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────────────────────────────┐  ┌───────────────────────────┐ │
│  │  TICKET #4821                              │  │  ACTIONS SIDEBAR          │ │
│  │                                            │  │                           │ │
│  │  Pothole on Oak Avenue                     │  │  Status                   │ │
│  │                                            │  │  🔴 Open  [Pending Parts ▾]│ │
│  │  ● Open  🔴 SLA Breach  1 day overdue     │  │     (substatus dropdown)  │ │
│  │                                            │  │                           │ │
│  │  Category:   Pothole or Road Damage        │  │  [Close Ticket]           │ │
│  │  Department: Public Works                  │  │  [Reopen] (hidden if open)│ │
│  │  SLA Target: 5 business days               │  │                           │ │
│  │  Opened:     Jun 21, 2026, 10:14 AM        │  │  Assignee                 │ │
│  │  Expected:   Jun 27, 2026 (1 day overdue)  │  │  [Dana Reyes ▾ search]   │ │
│  │                                            │  │  [18 tickets open]        │ │
│  │  Reporter                                  │  │  [Assign]                 │ │
│  │  Priya Nair · priya@example.com            │  │                           │ │
│  │  555-0182                                  │  │  Department               │ │
│  │                                            │  │  [Public Works       ▾]   │ │
│  │  Location                                  │  │                           │ │
│  │  Oak Ave @ Main St, Downtown               │  │  Reporter                 │ │
│  │  [📍 View on map]                          │  │  Priya Nair               │ │
│  │                                            │  │  priya@example.com        │ │
│  │  Description                               │  │                           │ │
│  │  Large pothole on Oak Avenue near the      │  │  ──────────────────────── │ │
│  │  intersection with Main Street. About      │  │  COMPOSE                  │ │
│  │  30cm wide and 10cm deep.                  │  │  ○ Response  ○ Comment   │ │
│  │                                            │  │  [Template ▾]             │ │
│  │  Custom Fields (if any)                    │  │  ┌─────────────────────┐  │ │
│  │  Severity: High                            │  │  │                     │  │ │
│  │  Road type: Local                          │  │  │  (response body)    │  │ │
│  │                                            │  │  │                     │  │ │
│  │  Attachments (2)                           │  │  └─────────────────────┘  │ │
│  │  [🖼 pothole1.jpg] [🖼 pothole2.jpg]        │  │  [Send]                   │ │
│  │  [+ Add attachment]                        │  │                           │ │
│  │                                            │  │  ──────────────────────── │ │
│  ├────────────────────────────────────────────┤  │  [⋮ More actions]         │ │
│  │  HISTORY & AUDIT TRAIL                     │  │   Delete Ticket (admin)   │ │
│  │                                            │  │   Merge Ticket            │ │
│  │  Jun 21, 10:14 AM  Priya Nair  Opened      │  └───────────────────────────┘ │
│  │  Jun 21, 10:15 AM  System      Assigned                                    │ │
│  │                    to Dana R.                                               │ │
│  │  Jun 21, 11:00 AM  Dana R.     Comment 🔒                                  │ │
│  │  ▸ "Called field crew — scheduling inspection."                            │ │
│  │    [Internal - staff only]                                                  │ │
│  │                                                                             │ │
│  │  Jun 22,  9:30 AM  Dana R.     Response  ✉️                                │ │
│  │  ▸ "We've received your report and will investigate within 2 business days."│ │
│  │    [Sent to priya@example.com]                                              │ │
│  │                                                                             │ │
│  │  Jun 22, 10:00 AM  Dana R.     Upload 📎                                   │ │
│  │  ▸ pothole_inspection.pdf  [Download]                                       │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Ticket title, status, SLA status | Ticket header |
| Primary | Actions sidebar (close, assign, compose) | Right sidebar — always visible |
| Secondary | Core fields: category, department, reporter, location, dates | Ticket body |
| Secondary | Audit history | Below main fields |
| Tertiary | Custom fields | After standard fields |
| Tertiary | Attachments | After custom fields |
| Tertiary | More actions (delete, merge) | Kebab menu in sidebar |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Open ticket | Blue status badge; Close button visible; Reopen hidden | N/A |
| Closed ticket | Gray status badge; Reopen button visible; Close hidden | Closed timestamp shown |
| Sending response | Send button → spinner | "Sending..." |
| Response sent | Toast | "Response sent to priya@example.com" |
| SMTP failure | Warning toast | "Email delivery failed — will retry." |
| Assignment saved | Assignee badge updates inline | Toast: "Assigned to Jordan M." |
| File uploading | Thumbnail placeholder + progress bar | "Uploading..." |
| Loading (initial) | Skeleton for all panels | Shimmer |
| 404 not found | Error page | "Ticket not found. [Back to list]" |

#### Internal Comment Visibility
- Comments with `visibility = 'internal'` show a 🔒 "Internal — staff only" badge in the history
- The compose panel has a clear "Response" vs "Comment" radio toggle at the top
- "Comment" mode shows a persistent 🔒 banner: "This note will NOT be sent to the reporter"
- Internal comments never render on the public `/track/:id` page

#### Attachment Panel
- Images render as 80×80px thumbnails in a grid
- Non-images render as file icon + filename + size + download link
- "+ Add attachment" opens native file picker; uploads via POST /api/tickets/{id}/media
- Thumbnail preview appears immediately after file selection (client-side)
- Upload progress bar per file
- Max 20 attachments shown; excess prevented with inline error

#### Mobile Layout (375px)
- Sidebar actions move to a sticky bottom action bar with "Actions ▾" chevron
- Tapping "Actions" opens a bottom sheet with all sidebar controls
- History renders in full width below the ticket fields
- Compose panel opens as a bottom sheet overlay
