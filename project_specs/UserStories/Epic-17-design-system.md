## Epic 17: Design System and UI Framework (F17)

The React frontend is built on a custom design system: Tailwind CSS + shadcn/ui components + CSS variable design tokens. It enforces visual consistency, accessibility, light/dark mode, and Framer Motion animations across every screen.

---

### US-17.1: Use a Consistent, Branded Design System Across All Screens
**As a** Marcus Rivera (311 Operator), **I want to** experience a visually consistent, branded interface across all screens, **so that** I can build muscle memory for UI patterns and work without cognitive load from inconsistency.

**Acceptance Criteria:**
- [ ] Tailwind CSS extended config defines: custom color palette (primary, secondary, semantic), spacing scale, border-radius tokens
- [ ] shadcn/ui components (Button, Dialog, Input, Select, Badge, Card, Table, Skeleton, Toast, Sheet, Tabs, Popover, Command) are customized to city brand and used consistently throughout
- [ ] Inter font is used for all UI text; JetBrains Mono is used for ticket IDs, codes, and monospaced values
- [ ] 4 px base grid is applied consistently to all component sizing and spacing
- [ ] 3-tier elevation shadow system (low, medium, high) is applied to cards, modals, and dropdowns
- [ ] CSS custom property (variable) design tokens define all colors, spacing, and shadows

**Priority:** P0 | **Feature Ref:** F17

---

### US-17.2: Toggle Dark Mode and Have the Preference Persisted
**As a** Marcus Rivera (311 Operator), **I want to** switch to dark mode via the navbar toggle and have the preference remembered across sessions, **so that** I can work comfortably in low-light call center environments without re-toggling on every visit.

**Acceptance Criteria:**
- [ ] A dark mode toggle is present in the top navbar
- [ ] Dark mode is also activated automatically by `prefers-color-scheme: dark` media query
- [ ] Dark mode swaps CSS custom property values via `.dark` class on the root element
- [ ] Dark mode preference is persisted to `localStorage`
- [ ] Dark mode renders without color contrast violations (WCAG 4.5:1 for normal text, 3:1 for large text)
- [ ] Automated axe-core scan reports 0 critical contrast violations in dark mode

**Priority:** P0 | **Feature Ref:** F17

---

### US-17.3: Experience Smooth Animations Respecting Motion Preferences
**As a** Priya Nair (Constituent), **I want to** see smooth page transitions and micro-interactions, and have all animations automatically disabled if I've set "reduce motion" in my OS settings, **so that** the app is polished without causing discomfort for users sensitive to motion.

**Acceptance Criteria:**
- [ ] Framer Motion powers all page transitions, stagger animations, and micro-interactions throughout the app
- [ ] All motion durations are ≤ 300 ms
- [ ] `prefers-reduced-motion: reduce` media query disables all Framer Motion animations globally (motion is set to zero or instant)
- [ ] Public submission wizard step transitions use Framer Motion with ≤ 300 ms duration
- [ ] Animations do not block user interaction (transitions are decorative, not blocking)

**Priority:** P0 | **Feature Ref:** F17

---
