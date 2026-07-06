---

## F19: Accessibility and Responsive Design

**Priority:** P0 — Critical

### Description

Every screen and component in the React frontend must meet WCAG 2.1 Level AA and Section 508 requirements. Accessibility is a design constraint from day one — not a post-launch retrofit. The application must be fully usable via keyboard navigation and screen readers. Responsive breakpoints at 375 px, 768 px, and 1280 px+ ensure usability across mobile, tablet, and desktop.

### Terminology

- **WCAG 2.1 AA** — Web Content Accessibility Guidelines version 2.1, Level AA. The applicable conformance target.
- **Section 508** — U.S. federal accessibility law; the relevant standard for government applications.
- **axe-core** — Open-source accessibility testing engine. Automated scans run in CI; target: 0 critical/serious violations.
- **Focus indicator** — The visible outline on a focused interactive element. Must be ≥ 2 px, high-contrast.
- **ARIA** — Accessible Rich Internet Applications; HTML attributes for describing dynamic content to assistive technologies.
- **Live region** — An ARIA region (`aria-live="polite"` or `aria-live="assertive"`) that causes screen readers to announce changes without the user moving focus.
- **Touch target** — The minimum tappable area for a UI element on mobile. WCAG requires ≥ 44 × 44 px.

### WCAG 2.1 AA Requirements (Selected Key Rules)

| Criterion | Requirement | Implementation |
|---|---|---|
| 1.1.1 Non-text content | All images have text alternatives | `alt` on all `<img>`; decorative images get `alt=""` |
| 1.3.1 Info and Relationships | Structure conveyed by HTML semantics | Semantic HTML: `<main>`, `<nav>`, `<header>`, `<table>`, `<form>` + `<label>` |
| 1.4.3 Contrast (minimum) | Normal text ≥ 4.5:1; large text ≥ 3:1 | Verified via design token palette; automated axe scan |
| 1.4.4 Resize text | Text resizable to 200% without loss | Relative units (rem/em); no fixed-height containers that clip text |
| 2.1.1 Keyboard | All functionality keyboard-accessible | All interactive elements reachable and operable via keyboard |
| 2.1.2 No keyboard trap | Focus is never trapped outside a dialog | shadcn/ui Dialog and Sheet handle focus trapping correctly |
| 2.4.1 Bypass Blocks | Mechanism to bypass nav | Skip-to-main-content link (see F18) |
| 2.4.3 Focus Order | Focus order is meaningful | DOM order matches visual order; no tabindex > 0 |
| 2.4.4 Link Purpose | Link purpose identifiable from text or context | Avoid "click here" links; all links have descriptive text or aria-label |
| 2.4.6 Headings | Headings and labels are descriptive | Proper heading hierarchy (h1 → h2 → h3); no skipped levels |
| 2.4.7 Focus Visible | Keyboard focus indicator visible | 2 px solid outline on `:focus-visible`; never `outline: none` |
| 3.1.1 Language of Page | Page language identified | `<html lang="en">` |
| 3.3.1 Error Identification | Form errors described in text | Inline error messages with `aria-describedby` |
| 3.3.2 Labels or Instructions | Inputs have associated labels | `<label for>` or `aria-label` on all inputs |
| 4.1.2 Name, Role, Value | All UI components have accessible names and states | ARIA roles, labels, `aria-expanded`, `aria-selected` on custom components |
| 4.1.3 Status Messages | Status messages announced to screen readers | Toast notifications use `aria-live="polite"`; errors use `aria-live="assertive"` |

### Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|---|---|---|
| Mobile | 375 px | Single-column; hamburger drawer; stacked case detail; touch targets ≥ 44 px |
| Tablet | 768 px | Two-column dashboard grid; sidebar hidden (hamburger); case detail may still be stacked |
| Desktop | 1280 px+ | Full sidebar; split-pane case detail; two-column admin panels |

**No horizontal scroll** at any breakpoint. All tables use responsive patterns (horizontal scroll container or card-stack on mobile).

**Touch targets:** All interactive elements (buttons, links, checkboxes, toggle switches) have a minimum clickable area of 44 × 44 px on mobile viewports, achieved via padding even if the visual element is smaller.

### Component-Level Accessibility Requirements

**Forms (New Case, Public Submission, Admin Panels):**
- Every `<input>` and `<select>` has an associated `<label>` (using `for`/`id` pairing or wrapping `<label>`).
- Required fields marked with `aria-required="true"` and a visual asterisk (*) with sr-only explanation.
- Inline validation errors use `aria-describedby` pointing to an error message element with `role="alert"`.

**Tables (Case List, Admin Lists):**
- `<table>` with `<thead>` and `<th scope="col">` for column headers.
- Sortable columns: `aria-sort="ascending"` / `aria-sort="descending"` / `aria-sort="none"` on `<th>`.
- Bulk select checkbox in header: `aria-label="Select all cases"`.

**Dialogs (Confirmations, Lightbox):**
- Focus trapped inside `Dialog` while open (shadcn/ui handles this via Radix UI).
- `aria-labelledby` pointing to dialog title; `aria-describedby` pointing to dialog body.
- Escape key closes all dialogs.
- Focus returns to the trigger element on close.

**Status Badge Pills:**
- Not conveyed by color alone: badge text ("Open", "Resolved") is always visible.
- `aria-label` on badge if text is abbreviated.

**Maps (Dashboard, Case Detail):**
- Map iframe/canvas has `aria-label="Map showing case locations"`.
- Map controls (zoom in/out) are keyboard-accessible.
- All case information available without the map (data table / case list as alternative).

**Skeleton Loaders:**
- `aria-busy="true"` on the container while loading; `aria-live="polite"` region announces when content is loaded.
- Screen readers announced "Loading cases..." → "42 cases loaded."

**Toast Notifications:**
- Use `role="status"` and `aria-live="polite"` for success messages.
- Use `role="alert"` and `aria-live="assertive"` for errors.
- Auto-dismiss timeout ≥ 5 seconds; dismiss button provided.

### Keyboard Navigation

All user flows must be completable using only a keyboard:
- **Tab**: move forward through focusable elements
- **Shift+Tab**: move backward
- **Enter / Space**: activate buttons and links
- **Arrow keys**: navigate Select options, Table rows, Map zoom controls
- **Escape**: close dialogs, drawers, popovers, lightbox

### Testing Requirements

| Tool | When | Pass Criterion |
|---|---|---|
| axe-core (automated) | CI on every PR | 0 critical or serious violations |
| Lighthouse (automated) | CI | Accessibility score ≥ 90 |
| Keyboard navigation audit (manual) | Before each release | All core workflows completable by keyboard only |
| Screen reader test (manual) | Before each release | NVDA/JAWS on Windows; VoiceOver on macOS/iOS |
| Color contrast check (automated) | axe-core covers this | 0 contrast violations |
| Touch target check | Responsive viewport test | All targets ≥ 44 × 44 px at 375 px |

### API Surface

None — accessibility is a frontend-only cross-cutting concern.

### Schema Surface

None.
