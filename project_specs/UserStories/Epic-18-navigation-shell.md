## Epic 18: Navigation Shell — Navbar, Sidebar, Breadcrumbs, Mobile Drawer (F18)

The application chrome wraps every authenticated screen: a persistent top navbar, a collapsible admin sidebar, contextual breadcrumbs, and a mobile hamburger drawer.

---

### US-18.1: Navigate the Application Using the Persistent Navbar and Sidebar
**As a** Marcus Rivera (311 Operator), **I want to** use the top navbar and collapsible sidebar to navigate between all sections without ever losing my place in the case list, **so that** I can context-switch efficiently without full page reloads.

**Acceptance Criteria:**
- [ ] A persistent top navbar is visible on every authenticated screen: city logo/name, global search trigger, logged-in user avatar/menu, dark mode toggle
- [ ] A collapsible left sidebar shows navigation groups: Cases, People, Admin — each with relevant child links
- [ ] Active route is highlighted in the sidebar with a visual indicator
- [ ] Sidebar collapse/expand is smooth (CSS transition) and the state is persisted to `localStorage`
- [ ] All navigation is client-side routing (React Router); no full-page reloads
- [ ] Contextual breadcrumb trail below the navbar reflects the current route hierarchy
- [ ] Breadcrumb links are clickable and navigate to the corresponding parent route

**Priority:** P0 | **Feature Ref:** F18

---

### US-18.2: Navigate the Application on a Mobile Device via the Hamburger Drawer
**As a** Diane Kowalski (Department Field Supervisor), **I want to** access all navigation links on my phone via a hamburger menu drawer, **so that** I can navigate to my department's case queue while out in the field without needing a full desktop layout.

**Acceptance Criteria:**
- [ ] On viewports ≤ 768 px, the left sidebar is hidden and replaced by a hamburger menu icon in the navbar
- [ ] Clicking the hamburger icon opens a full-height Sheet (shadcn/ui) drawer with all navigation links
- [ ] The drawer contains the same navigation groups and links as the desktop sidebar
- [ ] Closing the drawer (via "×" button, Escape key, or overlay tap) returns focus to the hamburger icon
- [ ] All touch targets in the drawer are ≥ 44 px

**Priority:** P0 | **Feature Ref:** F18

---

### US-18.3: Use Keyboard Navigation and Skip Links for Accessibility
**As a** screen reader user, **I want to** skip directly to the main content area using a skip link, **so that** I don't have to tab through the entire navbar and sidebar on every page.

**Acceptance Criteria:**
- [ ] A "Skip to main content" link is the first focusable element on every page
- [ ] The skip link is visually hidden until it receives keyboard focus, at which point it becomes visible
- [ ] Activating the skip link moves focus to the main content area
- [ ] All navbar, sidebar, and breadcrumb interactive elements are keyboard-accessible (Tab, Enter, Space, Escape)
- [ ] Focus indicators are visible on all interactive elements throughout the navigation shell

**Priority:** P0 | **Feature Ref:** F18

---
