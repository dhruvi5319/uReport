---

## F18: Navigation Shell — Navbar, Sidebar, Breadcrumbs, Mobile Drawer

**Priority:** P0 — Critical

### Description

The application chrome consists of four elements that wrap every authenticated screen: a persistent top navbar, a collapsible left admin sidebar, contextual breadcrumbs, and a mobile hamburger drawer. The shell provides consistent navigation, branding, and accessibility scaffolding for the entire authenticated experience.

### Terminology

- **Navbar** — The horizontal top bar fixed to the viewport top. Always visible.
- **Sidebar** — The vertical left navigation panel for admin links. Collapsible; state persisted to localStorage.
- **Breadcrumb** — A horizontal trail below the navbar showing the current route hierarchy.
- **Sheet drawer** — The shadcn/ui `Sheet` component used as the mobile hamburger menu (slides in from left).
- **Active route** — The sidebar link matching the current `window.location.pathname` is highlighted.
- **Skip link** — A visually-hidden-until-focused `<a href="#main-content">Skip to main content</a>` as the first focusable element in the DOM (accessibility).

### Sub-features

- Top navbar: city logo/name, global search trigger, user avatar + dropdown menu, dark mode toggle
- Collapsible left sidebar: admin navigation groups (Cases, Admin, Reports); collapse/expand with 200 ms slide transition; state persisted to localStorage
- Contextual breadcrumbs: below navbar, reflecting current route hierarchy; all crumbs are navigable links
- Mobile hamburger drawer: on viewport ≤ 768 px, hamburger button opens Sheet drawer with full nav links
- Active route highlighted in sidebar and drawer
- Skip-to-main-content link (first in DOM; visible on keyboard focus)

### Navbar Elements

| Element | Description |
|---|---|
| City logo + name | Links to `/dashboard`; SVG logo + text brand name |
| Global search trigger | Opens the Command palette (shadcn/ui Command component) for global case/person search |
| Notification bell | (Optional: preserved if PHP app has notifications; out of scope if not present in existing) |
| User avatar | Circular avatar (initials from `people.firstname + people.lastname` if no photo) |
| User dropdown menu | Items: "My Account" (`/account`), "Sign Out" (calls POST /api/auth/logout) |
| Dark mode toggle | Moon/sun icon; toggles `.dark` class; saves to localStorage |

### Sidebar Navigation Groups and Links

| Group | Link | Route |
|---|---|---|
| **Cases** | All Cases | `/cases` |
| **Cases** | New Case | `/cases/new` |
| **Cases** | Dashboard | `/dashboard` |
| **Admin** | People | `/admin/people` |
| **Admin** | Departments | `/admin/departments` |
| **Admin** | Categories | `/admin/categories` |
| **Admin** | Substatuses | `/admin/substatus` |
| **Admin** | Issue Types | `/admin/issue-types` |
| **Admin** | Contact Methods | `/admin/contact-methods` |
| **Admin** | API Clients | `/admin/clients` |
| **Admin** | Actions | `/admin/actions` |
| **Reports** | Metrics | `/metrics` |
| **Reports** | Reports | `/reports` |

Sidebar shows only links appropriate to the user's role:
- `staff` role: Cases group only
- `admin` role: All groups

### Sidebar Collapse Behavior

- Collapsed state: sidebar width collapses to icon-only view (icon + tooltip on hover).
- Expanded state: full icon + label.
- Toggle button at the bottom of the sidebar (or a `«` / `»` control).
- State stored in `localStorage` under key `sidebar_collapsed`.
- Collapse/expand animated with 200 ms CSS transition on `width`.
- At mobile breakpoint (≤ 768 px), sidebar is hidden entirely; hamburger drawer is used instead.

### Breadcrumb Rules

| Route | Breadcrumb |
|---|---|
| `/dashboard` | Dashboard |
| `/cases` | Cases |
| `/cases/new` | Cases > New Case |
| `/cases/{id}` | Cases > Case #{id} |
| `/admin/people` | Admin > People |
| `/admin/people/{id}` | Admin > People > {person name} |
| `/admin/departments` | Admin > Departments |
| `/admin/categories` | Admin > Categories |
| `/admin/substatus` | Admin > Substatuses |
| `/admin/issue-types` | Admin > Issue Types |
| `/admin/contact-methods` | Admin > Contact Methods |
| `/admin/clients` | Admin > API Clients |
| `/admin/actions` | Admin > Actions |
| `/metrics` | Reports > Metrics |
| `/reports` | Reports > Reports |
| `/account` | Account |

All crumbs except the last (current page) are `<a>` links. Current page is `aria-current="page"`.

### Mobile Drawer

- Visible at viewport ≤ 768 px.
- Hamburger icon in navbar opens Sheet from the left.
- Sheet contains all sidebar navigation links (with role-based filtering).
- Closing: click outside the Sheet, press Escape, or click a nav link.
- Focus trap is active while Sheet is open (shadcn/ui Sheet handles this).

### Skip Link

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded">
  Skip to main content
</a>
```

- The main content area has `id="main-content"` and `tabIndex={-1}`.

### Process — Rendering the Shell

1. `<AppShell>` component wraps all authenticated routes in React Router.
2. On mount: reads `sidebar_collapsed` from localStorage; sets initial sidebar state.
3. On mount: reads JWT cookie presence; if absent, redirects to `/login`.
4. `GET /api/auth/me` is called once on app load to populate the current user context (name, role, personId).
5. Navbar renders with user info from context.
6. Sidebar renders navigation groups filtered by user role.
7. Breadcrumb component reads `useLocation()` hook and computes the crumb trail from a static route→crumb map.

### Validation

- All nav links use React Router `<Link>` (not `<a href>`) for client-side navigation.
- Active state uses `NavLink` with `aria-current="page"` on the active link.
- Skip link must be the first focusable element in the DOM (Lighthouse/axe check).
- Focus indicators must be visible on all interactive shell elements (min 2 px outline).

### Error States

| Scenario | Behavior |
|---|---|
| `/api/auth/me` fails | Toast "Session error"; redirect to login |
| Unauthorized route access | Redirect to `/login?returnTo={path}` |
| Admin route accessed by staff role | Show "Access denied" page; link to `/cases` |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/me` | Current user info for shell rendering |

### Schema Surface

- `people` — current user name/role used in navbar and sidebar
