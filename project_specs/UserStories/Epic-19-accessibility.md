## Epic 19: Accessibility and Responsive Design (F19)

Every screen and component must meet WCAG 2.1 Level AA and Section 508 requirements. Responsive breakpoints at 375 px, 768 px, and 1280 px+ ensure full usability across all device types.

---

### US-19.1: Access All Features Using Only a Keyboard
**As a** staff member with motor impairment, **I want to** navigate and operate every screen using only the keyboard (Tab, Shift+Tab, Enter, Space, Escape, arrow keys), **so that** I can do my job without a mouse.

**Acceptance Criteria:**
- [ ] All interactive elements (buttons, links, inputs, dropdowns, checkboxes) are reachable and operable via keyboard
- [ ] Focus order follows logical reading order on every screen
- [ ] Modal dialogs trap focus while open; closing the modal returns focus to the trigger element
- [ ] Dropdown menus and comboboxes support keyboard navigation (arrow keys, Enter to select, Escape to close)
- [ ] A manual keyboard-navigation audit passes for all core workflows: create ticket, search/filter list, close ticket, log action

**Priority:** P0 | **Feature Ref:** F19

---

### US-19.2: Use a Screen Reader to Operate the Application
**As a** staff member who uses a screen reader, **I want to** receive meaningful announcements for all dynamic content changes (status updates, toast notifications, skeleton-to-content transitions), **so that** I can operate the application independently without visual feedback.

**Acceptance Criteria:**
- [ ] All images have descriptive `alt` text
- [ ] All tables have proper `<thead>` headers with `scope` attributes
- [ ] All form inputs have associated `<label>` elements
- [ ] Status badge pills include an accessible text label (not conveyed by color alone)
- [ ] Toast notifications are announced via ARIA live region (`aria-live="polite"`)
- [ ] Skeleton-to-content transitions are announced (e.g., `aria-busy` on the loading container)
- [ ] Dynamic content updates (new timeline entry, filter chip added) are announced via live regions
- [ ] axe-core automated scan reports 0 critical or serious accessibility violations

**Priority:** P0 | **Feature Ref:** F19

---

### US-19.3: Use the Application Comfortably on a Mobile Device
**As a** Diane Kowalski (Department Field Supervisor), **I want to** access and operate all case management features on my phone at 375 px viewport, **so that** I can close cases and upload photos in the field without returning to the office.

**Acceptance Criteria:**
- [ ] Application renders correctly at 375 px, 768 px, and 1280 px+ breakpoints
- [ ] No horizontal scrolling occurs at any supported breakpoint
- [ ] All touch targets are ≥ 44 px on mobile
- [ ] Case detail splits into a stacked single-column layout on mobile (metadata → action form → timeline)
- [ ] Case list table adapts to mobile: columns collapse to a card-style layout or horizontal scroll with sticky first column
- [ ] Public submission form is fully functional at 375 px (no features require desktop)
- [ ] Admin panels are usable on tablet (768 px) for occasional admin tasks

**Priority:** P0 | **Feature Ref:** F19

---

### US-19.4: Read Content with Sufficient Color Contrast in Both Light and Dark Mode
**As a** staff member with low vision, **I want to** read all text and distinguish all UI elements with sufficient color contrast in both light and dark mode, **so that** I can work without eye strain and the application meets legal accessibility standards.

**Acceptance Criteria:**
- [ ] Normal text meets WCAG 2.1 AA contrast ratio ≥ 4.5:1 in both light and dark mode
- [ ] Large text (≥ 18 pt or ≥ 14 pt bold) meets contrast ratio ≥ 3:1
- [ ] Status badge pills (open/closed/substatus) meet contrast requirements for both badge background and text
- [ ] Focus indicators are visible against the background in both modes
- [ ] Automated scan in dark mode reports 0 critical contrast violations (axe-core)

**Priority:** P0 | **Feature Ref:** F19

---
