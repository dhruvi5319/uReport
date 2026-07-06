# Screen-01: Navigation Shell

**Applies to:** All authenticated routes
**Purpose:** Persistent application chrome — top navbar, collapsible sidebar, breadcrumbs, mobile hamburger drawer
**User Stories:** F18 (Navigation Shell), F19 (Responsive Design)
**Journeys:** All staff journeys

---

## Layout — Desktop Full Shell

```
┌─────────────────────────────────────────────────────────────────────┐
│ NAVBAR (h-16, fixed, shadow-sm, z-50)                               │
│ ┌──────────┬──────────────────────────────────┬────────────────────┐│
│ │[≡]  Logo │  [Search bar — Cmd+K / Ctrl+K]   │ [🌙] [Avatar ▼]   ││
│ │  uReport │  Search cases, people...          │ Jordan Calloway    ││
│ └──────────┴──────────────────────────────────┴────────────────────┘│
├──────────────┬──────────────────────────────────────────────────────┤
│ SIDEBAR      │  MAIN CONTENT AREA                                   │
│ (w-64,       │  (ml-64 on desktop; full-width on mobile)            │
│  collapsible)│                                                       │
│              │  BREADCRUMBS (h-10, text-sm, text-muted)             │
│ ▾ Cases      │  Home > Cases > Case #4821                           │
│   All Cases  │  ─────────────────────────────────────────────       │
│   New Case   │                                                       │
│              │  [Page Content]                                       │
│ ▾ People     │                                                       │
│   All People │                                                       │
│              │                                                       │
│ ▾ Admin      │                                                       │
│   Categories │                                                       │
│   Departments│                                                       │
│   Substatuses│                                                       │
│   Issue Types│                                                       │
│   Contact    │                                                       │
│   Methods    │                                                       │
│   API Clients│                                                       │
│              │                                                       │
│ [◀ Collapse] │                                                       │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px) — Hamburger Drawer

```
┌─────────────────────────────────────┐
│ NAVBAR (h-14, fixed)                │
│ [☰]  uReport        [🌙] [Avatar]  │
├─────────────────────────────────────┤
│ BREADCRUMBS                         │
│ Cases > Case #4821                  │
├─────────────────────────────────────┤
│                                     │
│  [Full width content area]          │
│                                     │
└─────────────────────────────────────┘

HAMBURGER DRAWER (full-height Sheet, slides from left):
┌──────────────────────────┐
│  [×]  uReport            │
│  ─────────────────────   │
│  Marcus Rivera           │
│  311 Operator            │
│  ─────────────────────   │
│  ▾ CASES                 │
│    All Cases             │
│    New Case              │
│  ─────────────────────   │
│  ▾ PEOPLE                │
│    All People            │
│  ─────────────────────   │
│  ▾ ADMIN                 │
│    Categories            │
│    Departments           │
│    Substatuses           │
│    Issue Types           │
│    Contact Methods       │
│    API Clients           │
│  ─────────────────────   │
│  [Sign Out]              │
└──────────────────────────┘
```

---

## Sidebar Navigation Groups

| Group | Items | Icon |
|---|---|---|
| Cases | All Cases, New Case | Folder icon |
| People | All People | Users icon |
| Admin | Categories, Departments, Substatuses, Issue Types, Contact Methods, API Clients | Cog icon |

---

## Navbar Elements

| Element | Position | Behavior |
|---|---|---|
| Hamburger/collapse toggle | Left | Toggles sidebar on desktop; opens Sheet on mobile |
| City logo + "uReport" | Left (after toggle) | Links to `/dashboard` |
| Global search bar | Center (desktop) | Cmd+K/Ctrl+K focus; debounced live search |
| Dark mode toggle | Right | Toggles `.dark` class on `<html>`; persists to localStorage |
| User avatar + name | Right | Dropdown: My Profile, Sign Out |

---

## Breadcrumb Pattern

```
[Route segment 1] > [Route segment 2] > [Current page]

Examples:
  Dashboard
  Cases > All Cases
  Cases > Case #4821
  Admin > Categories
  Admin > People > Jordan Calloway
```

- Each segment (except the last) is a navigable link
- Current page segment is plain text (not a link)
- On mobile: abbreviated to last 2 segments when total width exceeds viewport
- Separator: `>` (chevron icon, `aria-hidden="true"`)

---

## Sidebar State

| State | Behavior |
|---|---|
| Expanded (default desktop) | Full width 256 px; labels visible |
| Collapsed (desktop) | Icon-only 64 px; labels shown in tooltip on hover |
| Group expanded | Child items visible (animated accordion) |
| Group collapsed | Child items hidden |
| Active route | Item highlighted with primary color background |

- Sidebar expand/collapse state persisted to `localStorage`
- Group expand/collapse state persisted to `localStorage`

---

## States

| State | Appearance |
|---|---|
| Default (desktop) | Full sidebar + navbar |
| Sidebar collapsed | Icon-only sidebar; content area wider |
| Mobile | No sidebar; hamburger only |
| Drawer open (mobile) | Sheet overlays content; backdrop dim |
| Global search active | Search bar expands; results dropdown appears |

---

## Accessibility Notes

- **Skip link**: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>` as the very first DOM element
- Sidebar navigation: `<nav aria-label="Main navigation">`
- Active item: `aria-current="page"` on the matching nav link
- Hamburger button: `aria-label="Open navigation menu"` / `aria-expanded`
- Drawer: focus trapped within Sheet when open; Escape closes
- Breadcrumb: `<nav aria-label="Breadcrumb">` with `<ol>` structure
- Dark mode toggle: `aria-label="Toggle dark mode"` + `aria-pressed`

---

*End of Screen-01-navigation.md*
