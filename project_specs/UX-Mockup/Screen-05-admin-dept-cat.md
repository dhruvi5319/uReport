---

## Screen SCR-07: Department Admin

**Purpose:** Manage department records, default assignees, category associations, and staff membership.
**User Stories:** US-6.1, US-6.2
**Journey:** JRN-02.3

### Layout

```
┌──────────────┬───────────────────────────────────────────────────────┐
│  Sidebar     │  Administration > Departments          [New Dept]      │
│              ├───────────────────────────────────────────────────────┤
│              │  ┌─────────────────────────────────────────────────┐  │
│              │  │  Streets & Sanitation                           │  │
│              │  │  Default: Marcus Webb  |  4 categories  |  6 staff│  │
│              │  ├─────────────────────────────────────────────────┤  │
│              │  │  Parks & Recreation                             │  │
│              │  │  Default: Diana Reyes  |  3 categories  |  4 staff│  │
│              │  └─────────────────────────────────────────────────┘  │
└──────────────┴───────────────────────────────────────────────────────┘
```

### Department Detail / Edit (inline panel or modal)

```
Department Name:  [Streets & Sanitation___________]
Default Person:   [Search staff... Marcus Webb  ▾]

Categories Assigned:
  [Pothole Repair ✓] [Street Light ✓] [Illegal Dumping ✓] [+ Add]

Action Types Available:
  [Work Order ✓] [Inspection ✓] [+ Add]

Staff Members:
  Marcus Webb | Priya Tanaka | [+ Add Staff]

[Save] [Cancel] [Delete Department]
```

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Department list | — |
| Editing | Inline form in list row or slide-over panel | — |
| Saving | Save button spinner | Toast: "Department updated" |
| Delete confirm | Confirm dialog | "Are you sure? This cannot be undone." |
| Default person error | Inline | "Default person must be a staff member" |

---

## Screen SCR-08: Category Admin

**Purpose:** Create and configure service categories including SLA, permissions, custom field schema, and default assignee.
**User Stories:** US-7.1, US-7.2, US-7.3
**Journey:** JRN-02.1

### Layout — Category List

```
┌──────────────┬───────────────────────────────────────────────────────┐
│  Sidebar     │  Administration > Categories       [New Category]      │
│              ├───────────────────────────────────────────────────────┤
│              │  Search: [___________]  Group: [All ▾]  Active: [✓ ▾] │
│              ├───────────────────────────────────────────────────────┤
│              │  GROUP: Streets (order: 1)           [Edit Group]       │
│              │  ┌─────────────────────────────────────────────────┐  │
│              │  │  ✓ Pothole Repair         staff/public  10d SLA │  │
│              │  │    Dept: Streets | Default: Marcus W.           │  │
│              │  ├─────────────────────────────────────────────────┤  │
│              │  │  ✓ Street Light Out       public/anon   7d SLA  │  │
│              │  │    Dept: Streets | Default: unassigned          │  │
│              │  └─────────────────────────────────────────────────┘  │
│              │  GROUP: Sanitation (order: 2)         [Edit Group]      │
│              │  ...                                                    │
└──────────────┴───────────────────────────────────────────────────────┘
```

### Layout — Category Create / Edit Form

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Categories  /  New Category   (or: Edit: Pothole Repair)          │
├──────────────────────────────────────────────────────────────────────┤
│  ▸ BASIC INFO                                                         │
│    Name *        [_________________________________]                  │
│    Description   [_________________________________]                  │
│    Category Group [Select group... ▾]  [+ New Group]                 │
│    Department    [Select dept... ▾]                                   │
│    Active        [✓]     Featured    [  ]                             │
│                                                                       │
│  ▸ PERMISSIONS & SLA                                                  │
│    Display Permission  [public ▾]     Posting Permission  [public ▾] │
│    SLA Days            [10      ]     Notification Email  [________] │
│                                                                       │
│  ▸ AUTO-CLOSE RULE                                                    │
│    Auto-Close Active   [  ]                                           │
│    Auto-Close Substatus [Select closed substatus... ▾]               │
│                                                                       │
│  ▸ DEFAULT ASSIGNEE                                                   │
│    Default Person      [Search staff in dept... ▾]                   │
│                                                                       │
│  ▸ CUSTOM FIELDS                                                      │
│    [+ Add Field]                                                      │
│    ┌───────────────────────────────────────────────────────────────┐ │
│    │  Field 1                                            [Remove]  │ │
│    │  Label *  [Location Type____________]                         │ │
│    │  Type     [Single-value list ▾]   Required [✓]  Order [1]    │ │
│    │  Options: [Alley] [Street] [Vacant Lot] [+ Add Option]        │ │
│    ├───────────────────────────────────────────────────────────────┤ │
│    │  Field 2                                            [Remove]  │ │
│    │  Label *  [Estimated Volume_______]                           │ │
│    │  Type     [Single-value list ▾]   Required [  ]  Order [2]   │ │
│    │  Options: [Small] [Large] [Bulk] [+ Add Option]               │ │
│    └───────────────────────────────────────────────────────────────┘ │
│    [▸ Preview JSON schema]                                            │
│                                                                       │
│  [Save Category]  [Cancel]  [Delete Category]                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Custom Field Builder Detail (US-7.1, JRN-02.1)

| Field Type | Control Rendered | Notes |
|------------|-----------------|-------|
| text | Text input | Simple string |
| number | Number input | Numeric validation |
| singlevaluelist | Select dropdown | Requires options list |
| multivaluelist | Multi-select | Requires options list |
| datetime | Date/time picker | ISO 8601 stored |

Options list: inline chip list with [+ Add Option] / [×] remove. Reorderable via drag.

**No raw JSON editing required** (pain point eliminated from legacy, JRN-02.1 Stage 4).

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (list) | Grouped by category group, sorted by group ordering | — |
| Creating | Empty form | "New Category" breadcrumb |
| Editing | Pre-populated form | Category name in breadcrumb |
| Saving | Save button spinner | — |
| Success | — | Toast: "Category saved. Custom fields active on next submission." |
| Permission level error | Inline | "Must be one of: staff, public, anonymous" |
| Auto-close substatus error | Inline | "Substatus must be a closed-type substatus" |
