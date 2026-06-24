---

## Screen SCR-05: People Directory

**Purpose:** Search, browse, and manage staff and constituent contact records.
**User Stories:** US-5.1, US-5.3, US-5.4
**Journey:** JRN-02.3 Stage 1, JRN-03.1 Stage 2

### Layout

```
┌──────────────┬────────────────────────────────────────────────────────┐
│  Sidebar     │  People Directory            [New Person]              │
│              ├────────────────────────────────────────────────────────┤
│              │  Search: [Search by name, email, org...  🔍]           │
│              │  Role: [All ▾]  Dept: [All ▾]  Org: [______]  [Search]│
│              ├────────────────────────────────────────────────────────┤
│              │  ┌──────────────────────────────────────────────────┐  │
│              │  │  Marcus Webb      staff   Streets & Sanitation  │  │
│              │  │  marcus.w@city.gov  |  (555) 234-5678           │  │
│              │  ├──────────────────────────────────────────────────┤  │
│              │  │  Jane Smith       public  —                     │  │
│              │  │  jsmith@email.com |  (555) 111-2222             │  │
│              │  ├──────────────────────────────────────────────────┤  │
│              │  │  Priya Tanaka     staff   Streets & Sanitation  │  │
│              │  │  priya.t@city.gov |  (555) 345-6789             │  │
│              │  └──────────────────────────────────────────────────┘  │
│              │  Page 1 of 12  [< Prev] [Next >]                        │
└──────────────┴────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Full name | Row left |
| Primary | Role badge | Row right of name |
| Secondary | Department | Row right |
| Secondary | Primary email, primary phone | Row second line |
| Tertiary | Organization | Shown if present |

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Paginated list (25/page) | — |
| Searching | Skeleton rows | — |
| No results | Empty state with illustration | "No people match your search. [New Person]" |
| Loading | Shimmer rows | — |

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Search field | Text input with live debounce | ILIKE search on name, email, org (US-5.3) |
| Role filter | Select | Filters to staff/public |
| Department filter | Select | Filters by department_id |
| Person row | Clickable | Opens SCR-06 Person Detail |
| New Person | Primary button | Opens SCR-06 in Create mode |

---

## Screen SCR-06: Person Detail / Edit

**Purpose:** View and edit a person's full profile, contact details, assigned categories, and associated tickets.
**User Stories:** US-5.1, US-5.2, US-5.4
**Journey:** JRN-02.3

### Layout

```
┌──────────────┬────────────────────────────────────────────────────────┐
│  Sidebar     │  ← People  /  Marcus Webb  (or: New Person)   [Edit]  │
│              ├────────────────────────────────────────────────────────┤
│              │  PROFILE HEADER                                         │
│              │  [👤]  Marcus Webb                                      │
│              │        staff | Streets & Sanitation                     │
│              │        Username: marcus.w | Dept: Streets & Sanitation  │
│              ├────────────────────────────────────────────────────────┤
│              │  CONTACT DETAILS  (inline edit)                         │
│              │                                                         │
│              │  Emails                                                 │
│              │  ┌───────────────────────────────────────────────────┐ │
│              │  │ 📧 marcus.w@city.gov  [Work]  🔔 Notify  [Delete] │ │
│              │  │ [+ Add Email]                                     │ │
│              │  └───────────────────────────────────────────────────┘ │
│              │                                                         │
│              │  Phones                                                 │
│              │  ┌───────────────────────────────────────────────────┐ │
│              │  │ 📞 (555) 234-5678  [Mobile]  [Delete]             │ │
│              │  │ [+ Add Phone]                                     │ │
│              │  └───────────────────────────────────────────────────┘ │
│              │                                                         │
│              │  Addresses  [+ Add Address]                             │
│              ├────────────────────────────────────────────────────────┤
│              │  ASSIGNED CATEGORIES  (staff only)                      │
│              │  [Pothole Repair ✓]  [Street Cleaning ✓]  [+ Add]     │
│              │  Multi-select from department's categories              │
│              ├────────────────────────────────────────────────────────┤
│              │  ASSOCIATED TICKETS  (US-5.4)                           │
│              │  [Reported by] [Assigned to] [Entered by] — tab filter  │
│              │  Ticket list (paginated, links to SCR-03)               │
└──────────────┴────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Name, role, department | Profile header |
| Primary | Emails with notification flag | Contact section top |
| Secondary | Phones, addresses | Contact section below emails |
| Secondary | Assigned categories panel | Mid-section |
| Tertiary | Associated tickets | Bottom section |

### Email Management (US-5.2)

Each email row has:
- Email address (editable inline)
- Label selector (Home / Work / Other)
- 🔔 Notification flag toggle (`usedForNotifications`)  
- [Delete] link with confirm

Adding email: [+ Add Email] expands inline form with address + label + notification toggle.

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| View mode | Read-only display | [Edit] button in header |
| Edit mode | All fields become inputs | [Save] [Cancel] in header |
| Saving | Save button spinner | — |
| Duplicate username | Inline error on username field | "Username already taken" (US-5.1) |
| New person | Empty form with required field indicators | "New Person" in breadcrumb |
