# Screen-08: Admin Panels

**Routes:** `/admin/people`, `/admin/departments`, `/admin/categories`, `/admin/substatuses`, `/admin/issue-types`, `/admin/contact-methods`, `/admin/clients`
**Purpose:** CRUD management for all system configuration entities
**User Stories:** US-6.1–6.4, US-7.1–7.2, US-8.1–8.3, F13, JRN-03.2
**Journeys:** JRN-03.1 (all stages), JRN-03.2 (all stages)

---

## Shared Admin Panel Layout Pattern

All admin panels share the same shell layout:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR (admin section active)                                     │
│ Breadcrumb: Admin > [Panel Name]                                            │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  [Panel Name]                                                │
│ (admin group │  ─────────────────────────────────────────────────────────   │
│  expanded)   │  TOOLBAR                                                     │
│              │  [🔍 Search...]   [Role: All ▼]   [+ New {Entity}]           │
│              │                                                              │
│              │  DATA TABLE                                                  │
│              │  ┌──────────────────────────────────────────────────────┐   │
│              │  │ Column 1 │ Column 2 │ Column 3 │ Actions             │   │
│              │  │──────────│──────────│──────────│─────────────────── │   │
│              │  │ Value    │ Value    │ Value    │ [Edit] [Delete]     │   │
│              │  │ ░░░░░░░░ │ ░░░░░░░░ │ ░░░░░░░░ │ (skeleton rows)     │   │
│              │  └──────────────────────────────────────────────────────┘   │
│              │                                                              │
│              │  PAGINATION (if needed)                                      │
│              │  [← Prev]  Page 1 of 4  [Next →]                            │
│              │                                                              │
│              │  RIGHT SIDE SHEET (opens on Edit/New — 40% viewport width)  │
│              │  ┌─────────────────────────────────────────────────────┐    │
│              │  │  Edit / New {Entity}                          [×]   │    │
│              │  │  ─────────────────────────────────────────────────  │    │
│              │  │  [Form fields]                                       │    │
│              │  │  [Sub-panels — tabs or accordion]                   │    │
│              │  │                                                      │    │
│              │  │  [Cancel]                     [Save]                │    │
│              │  └─────────────────────────────────────────────────────┘    │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Admin — People (`/admin/people`)

### Table Columns

| Column | Type | Notes |
|---|---|---|
| Name | Text | "Last, First" format; link to person detail |
| Organization | Text | Optional; may be empty |
| Department | Badge | Department name |
| Role | Badge | `Admin` (red) / `Staff` (blue) / `Public` (gray) |
| Username | Mono text | JetBrains Mono; may be empty |
| Emails | Count | "3 emails" — shows count with notification flag |
| Actions | Icon buttons | [✎ Edit] [🗑 Delete] |

### People List Wireframe

```
┌────────────────────────────────────────────────────────────────────────┐
│  People                                                                │
│  ──────────────────────────────────────────────────────────────────    │
│  [🔍 Search by name, email, username...]    [Role: All ▼]   [+ New]   │
│                                                                        │
│  ┌──────────────┬──────────────┬──────────┬──────┬──────┬──────────┐  │
│  │ Name         │ Department   │ Role     │ User │ Emails│ Actions  │  │
│  │──────────────│──────────────│──────────│──────│───────│──────────│  │
│  │ Calloway, J. │ IT Admin     │ [Admin]  │ jord │ 2     │ [✎][🗑] │  │
│  │ Rivera, M.   │ 311 Center   │ [Staff]  │ marc │ 1     │ [✎][🗑] │  │
│  │ Kowalski, D. │ Public Works │ [Staff]  │ dian │ 1 ✉  │ [✎][🗑] │  │
│  │ Nair, P.     │ —            │ [Public] │ —    │ 1     │ [✎][🗑] │  │
│  └──────────────┴──────────────┴──────────┴──────┴───────┴──────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

`✉` icon indicates email with `usedForNotifications = true`.

### New/Edit Person Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Person: Diane Kowalski                             [×]    │
│  ─────────────────────────────────────────────────────────────  │
│  First Name          Last Name                                  │
│  [Diane            ] [Kowalski            ]                     │
│                                                                 │
│  Middle Name         Organization                               │
│  [               ]   [City of Springfield  ]                    │
│                                                                 │
│  Department          Role                                       │
│  [Public Works ▼]    [Staff ▼]                                  │
│                                                                 │
│  Username  (max 40 chars)                                       │
│  [diane_k                                ]                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  EMAILS  [+ Add Email]                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [diane@city.gov     ] Label:[Work] [✉ Notify] [🗑]       │  │
│  │ [diane@personal.com ] Label:[Home] [  Notify] [🗑]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  PHONES  [+ Add Phone]                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [(555) 555-1234    ] Label:[Office]                 [🗑] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ADDRESSES  [+ Add Address]                                     │
│  (collapsed — click to expand)                                  │
│                                                                 │
│  [Cancel]                                       [Save Person]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin — Departments (`/admin/departments`)

### Table Columns

| Column | Notes |
|---|---|
| Department Name | Link to edit sheet |
| Default Person | Staff member name or "—" |
| Category Count | Count of associated categories |
| Actions | [✎ Edit] [🗑 Delete] |

### Edit Department Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Department: Public Works                           [×]    │
│  ─────────────────────────────────────────────────────────────  │
│  Department Name *                                              │
│  [Public Works                                     ]            │
│                                                                 │
│  Default Assignee                                               │
│  [Search staff...                   ▼] [Clear]                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ACTION TYPES  (checklist — dept can use these in responses)    │
│  ☑ Response    ☑ Comment    ☑ Assignment                        │
│  ☐ Inspection  ☑ Escalation ☐ Review                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  CATEGORIES (read-only list)                                    │
│  • Pothole           • Road Damage                              │
│  • Street Repair     (link → /admin/categories)                 │
│                                                                 │
│  [Cancel]                                   [Save Department]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin — Categories (`/admin/categories`)

### Category Group Tree Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Categories                                                          │
│  ────────────────────────────────────────────────────────────────    │
│  [+ New Group]                                                       │
│                                                                      │
│  ▼ Roads & Sidewalks  (4 categories)              [✎ Edit] [🗑]     │
│    • Pothole                       Pub Works  [Active]  [✎][🗑]     │
│    • Cracked Sidewalk              Pub Works  [Active]  [✎][🗑]     │
│    • Road Damage                   Pub Works  [Active]  [✎][🗑]     │
│    • Street Sign Missing           Pub Works  [Active]  [✎][🗑]     │
│    [+ New Category under this group]                                 │
│                                                                      │
│  ▶ Parks & Greenspace  (3 categories)             [✎ Edit] [🗑]     │
│                                                                      │
│  ▶ Transportation  (2 categories)                 [✎ Edit] [🗑]     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### New/Edit Category Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  New Category                                            [×]    │
│  ─────────────────────────────────────────────────────────────  │
│  BASIC                                                          │
│  Name *                                                         │
│  [E-Scooter Obstruction                          ]              │
│                                                                 │
│  Category Group                                                 │
│  [Transportation ▼]                                             │
│                                                                 │
│  Department *                                                   │
│  [Mobility ▼]                                                   │
│                                                                 │
│  Description                                                    │
│  [textarea — optional]                                          │
│                                                                 │
│  ☑ Active    ☐ Featured                                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  PERMISSIONS                                                    │
│  Display Permission   [Public ▼]                                │
│  Posting Permission   [Anonymous ▼]                             │
│  ⚠ Posting must be ≥ permissive as Display                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  SLA & ASSIGNMENT                                               │
│  SLA Days        [5      ]    Default Person  [Search... ▼]     │
│  Reply Email     [admin@city.gov              ]                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  AUTO-CLOSE                                                     │
│  ☐ Enable auto-close                                            │
│  Auto-close Substatus  [Resolved ▼]  (shown when enabled)       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  RESPONSE TEMPLATES  [+ Add Template]                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Action: [Response ▼]                                     │  │
│  │ Template:                                                │  │
│  │ [Scooter has been reported to the vendor...  textarea]   │  │
│  │ Reply Email: [vendor@scootco.com           ]             │  │
│  │                                            [🗑 Remove]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  [+ Add another template]                                       │
│                                                                 │
│  [Cancel]                                     [Save Category]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin — API Clients (`/admin/clients`)

### Table Columns

| Column | Notes |
|---|---|
| Client Name | Organization name |
| Contact Person | Person record link |
| Contact Method | Email/Phone/Web |
| API Key | Masked: `••••••••-••••-••••-1234` (last 4 visible) |
| Actions | [✎ Edit] [🗑 Delete] |

### New Client Sheet — API Key Display (One-Time)

```
┌─────────────────────────────────────────────────────────────────┐
│  Client Created: CivicPath Inc.                          [×]    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ⚠️ Copy this API key now — it will not be shown again.         │
│                                                                 │
│  API Key                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ f7a4b2c9-1d3e-4f6a-8b2c-9d0e1f2a3b4c            [Copy] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Share this key with CivicPath Inc. to enable API access.       │
│                                                                 │
│  [View Swagger UI / API Docs]  (link to /swagger-ui.html)       │
│                                                                 │
│  [Done]                                                         │
└─────────────────────────────────────────────────────────────────┘
```

"Copy" button: copies to clipboard; label changes to "Copied ✓" for 2 seconds.

---

## Admin — Lookup Table Panels (Substatuses, Issue Types, Contact Methods)

These three panels share an identical minimal CRUD pattern:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Substatuses                                                         │
│  ────────────────────────────────────────────────────────────────    │
│  [+ New Substatus]                                                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Name                           Description         Actions     │ │
│  │ ──────────────────────────     ─────────────────   ──────────  │ │
│  │ Resolved                       Issue fixed         [✎][🗑]    │ │
│  │ Duplicate                      Same as another     [✎][🗑]    │ │
│  │ Bogus                          Invalid report      [✎][🗑]    │ │
│  │ Referred                       Sent to other dept  [✎][🗑]    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

Inline editing: clicking [✎] opens a Sheet with name + description fields.

---

## Delete Confirmation Dialog (All Admin Panels)

```
┌─────────────────────────────────────────────────────────────┐
│  Delete Public Works?                                       │
│  ───────────────────────────────────────────────────────    │
│  This action cannot be undone.                              │
│                                                             │
│  If this department has associated categories, the         │
│  deletion will be blocked.                                  │
│                                                             │
│  [Cancel]                          [Delete Department]      │
└─────────────────────────────────────────────────────────────┘
```

**Safety check failure (blocked delete):**
```
┌─────────────────────────────────────────────────────────────┐
│  Cannot Delete Public Works                                 │
│  ───────────────────────────────────────────────────────    │
│  ⚠ This department has 4 associated categories.             │
│     Reassign or delete those categories first.              │
│                                                             │
│  [View categories] (link)            [Close]                │
└─────────────────────────────────────────────────────────────┘
```

---

## States (All Admin Panels)

| State | Appearance |
|---|---|
| Loading table | Skeleton rows (5 rows) with shimmer |
| Table loaded | Rows with data |
| Empty table | "No {entities} yet. Create the first one." + CTA button |
| Sheet open | Right-side sheet overlays with backdrop; main table visible behind |
| Saving | "Save" button shows spinner; form disabled |
| Save success | Toast "Department saved"; sheet closes; table refreshes |
| Save error | Inline errors on fields; sheet stays open; toast for network errors |
| Delete loading | Button shows spinner |
| Delete success | Toast "{Entity} deleted"; row removed from table (optimistic) |
| Delete blocked | Error dialog with reason |

---

*End of Screen-08-admin-panels.md*
