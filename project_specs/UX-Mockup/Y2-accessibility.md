# Y2 — Accessibility Notes

**Standard:** WCAG 2.1 Level AA + Section 508
**Automation:** axe-core integrated in CI (0 critical/serious violations gate)
**Manual audit:** Keyboard-navigation walkthrough of all core workflows required before release

---

## 1. Color Contrast Requirements

### Text Contrast (minimum 4.5:1 for normal text, 3:1 for large text ≥18pt or bold ≥14pt)

| Element | Light Mode | Dark Mode | Ratio Target |
|---|---|---|---|
| Body text | `text-gray-900` on `white` | `text-gray-100` on `gray-900` | ≥ 4.5:1 |
| Muted text | `text-gray-500` on `white` | `text-gray-400` on `gray-900` | ≥ 4.5:1 |
| Primary button text | `white` on `civic-blue-600` | `white` on `civic-blue-500` | ≥ 4.5:1 |
| Status badge OPEN | `blue-800` on `blue-100` | `blue-200` on `blue-900/40` | ≥ 4.5:1 |
| Status badge RESOLVED | `green-800` on `green-100` | `green-200` on `green-900/40` | ≥ 4.5:1 |
| Status badge OVERDUE | `white` on `red-500` | `white` on `red-600` | ≥ 4.5:1 |
| `<mark>` highlights | `gray-900` on `yellow-300` | `gray-900` on `yellow-500` | ≥ 4.5:1 |
| Error text | `red-700` on `white` | `red-400` on `gray-900` | ≥ 4.5:1 |
| Placeholder text | `gray-400` on `white` | `gray-500` on `gray-800` | (informational) |

**Note:** Placeholder text contrast below 4.5:1 is acceptable per WCAG (placeholder is supplementary). Labels must always be visible — no floating label patterns that hide labels on input focus.

### Non-Text Contrast (3:1 minimum — icons, borders, UI components)

- Form input borders: `border-gray-300` on white background → validate ≥3:1
- Focus ring: 3 px solid `civic-blue-500` — must be ≥3:1 against adjacent background
- Icon-only buttons: icon must be ≥3:1 against background; always pair with `aria-label`

---

## 2. Keyboard Navigation

### Focus Management

| Scenario | Focus Behavior |
|---|---|
| Page load | Focus to `<main>` skip-link or first heading |
| Dialog opens | Focus moves to first interactive element or dialog title |
| Dialog closes | Focus returns to the trigger element that opened it |
| Toast appears | Toast is `role="alert"` or `role="status"`; no focus move required |
| Sheet opens | Focus moves to first form field in the sheet |
| Sheet closes | Focus returns to the row/button that triggered it |
| Inline edit activates | Focus moves to the edit input |
| Inline edit saves/cancels | Focus returns to the edit trigger [✎] button |
| Wizard step forward | Focus moves to step heading (Step N of 5) |
| Wizard step backward | Focus moves to step heading (Step N of 5) |
| Lightbox opens | Focus moves to lightbox; trapped within |
| Lightbox closes | Focus returns to the thumbnail that was clicked |
| Search results update | `aria-live="polite"` announces count update |

### Tab Order

All interactive elements must be reachable via Tab in logical document order:
1. Skip-to-main link (first in DOM)
2. Navbar (logo, search, dark mode toggle, user menu)
3. Sidebar (if expanded) — navigation links
4. Main content area
5. Modals/Sheets (when open): trap focus within

`tabindex="-1"` used only on elements that receive programmatic focus but are not in tab order (e.g., dialog container, live region).
`tabindex="0"` used to make non-interactive elements focusable only when necessary.
**Never use `tabindex > 0`.**

### Keyboard Shortcuts

| Key | Action | Context |
|---|---|---|
| Cmd/Ctrl+K | Focus global search input | Anywhere (except forms) |
| Escape | Close dialog / sheet / lightbox / dropdown | When any overlay is open |
| Enter | Submit form / activate button | Focused form |
| Shift+Enter | New line in textarea | Textarea focused |
| Arrow keys | Navigate lightbox photos | Lightbox open |
| Arrow keys | Navigate autocomplete dropdown | Dropdown open |
| Space | Toggle checkbox | Checkbox focused |
| Tab / Shift+Tab | Move forward/backward through focusable elements | Global |

---

## 3. ARIA Roles and Labels

### Landmarks

Every page must have exactly one `<main>` element and appropriate landmark regions:

```html
<header role="banner">         <!-- top navbar -->
<nav aria-label="Main navigation">   <!-- sidebar -->
<nav aria-label="Breadcrumb">        <!-- breadcrumb -->
<main id="main-content">             <!-- page content -->
<aside aria-label="Case timeline">   <!-- timeline panel -->
```

### Dynamic Content Regions

| Component | ARIA Implementation |
|---|---|
| Search results update | `aria-live="polite"` on the results count ("Showing 1–25 of 142 cases") |
| Toast notifications | `role="alert"` (errors) or `role="status"` (success/info) |
| Skeleton loading | `aria-busy="true"` on container; `aria-label="Loading cases..."` |
| Timeline prepend | `aria-live="polite"` on timeline container; new entry announced |
| Status badge update | `aria-live="polite"` on case header region |
| Step wizard navigation | `aria-live="polite"` announces "Step 3 of 5: Location" on step change |
| Confirmation screen (public) | `aria-live="assertive"` on case number display |

### Form Labels

- Every `<input>`, `<textarea>`, `<select>` must have an associated `<label>` via `htmlFor` / `id` or `aria-label`
- Error messages associated to inputs via `aria-describedby`
- Required fields: `aria-required="true"` on the input element (supplement to `*` visual indicator)
- Optional fields: "(optional)" in visible label text — no need for `aria-required="false"` (that's default)

```html
<!-- Required field example -->
<label htmlFor="category">Category <span aria-hidden="true">*</span></label>
<input id="category" aria-required="true" aria-describedby="category-error" />
<span id="category-error" role="alert" class="text-red-600">
  Please select a category
</span>

<!-- Error: only shown when invalid; hidden with CSS (not display:none which removes from ARIA tree) -->
```

### Tables

All data tables must have:
```html
<table>
  <caption class="sr-only">Case list — 142 cases</caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="ascending">Date Submitted ↑</th>
      ...
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>...</td>
    </tr>
  </tbody>
</table>
```

- `aria-sort="ascending"` / `"descending"` / `"none"` on sortable column headers
- Sort button inside `<th>`: `<button>` element with `aria-label="Sort by Date Submitted ascending"`
- Checkbox column: `<th scope="col"><input type="checkbox" aria-label="Select all cases on this page" /></th>`

### Buttons and Icon Buttons

Every icon-only button MUST have an accessible name:
```html
<button aria-label="Edit assignee">
  <PencilIcon aria-hidden="true" />
</button>

<button aria-label="Remove filter: Status Open">
  <XIcon aria-hidden="true" />
</button>

<button aria-label="Delete Case #5102 photo photo1.jpg">
  <TrashIcon aria-hidden="true" />
</button>
```

Decorative icons: `aria-hidden="true"` always.

---

## 4. Screen Reader Considerations

### Case List

- "Showing 1–25 of 142 cases" is a live region — updates announced when search/filter changes
- Status badge text should be read as: "Open" not "OPEN" (CSS transforms text to uppercase visually but HTML is sentence-case)
- Row checkboxes: `aria-label="Select case #5102"` (not generic "Select")
- "Select all" checkbox: `aria-label="Select all 25 cases on this page"`
- When bulk toolbar appears: `aria-live="polite"` announces "33 cases selected"

### Case Detail

- Timeline is a `<section aria-label="Case activity timeline">` containing an ordered list `<ol>`
- Each timeline entry is `<li>` with a heading level appropriate to document structure
- Action type icon: `aria-hidden="true"`; action type text is visible text
- "Notify Reporter" toggle: `<Switch aria-label="Notify reporter by email">`
- SLA progress bar: `<div role="progressbar" aria-valuenow="3" aria-valuemin="0" aria-valuemax="5" aria-label="SLA: 3 of 5 days elapsed">`

### Lightbox

```html
<div role="dialog" aria-modal="true" aria-label="Photo viewer: photo1.jpg">
  <button aria-label="Previous photo">←</button>
  <img alt="Pothole at Oak and 3rd Street, uploaded by Carlos Rivera on Jul 6" />
  <button aria-label="Next photo">→</button>
  <button aria-label="Close photo viewer">×</button>
  <p>photo1.jpg — Uploaded Jul 6 by Carlos Rivera</p>
</div>
```

All photos MUST have meaningful `alt` text. Formula: `{Category} at {Location}, uploaded by {person} on {date}`. If filename only is known: `alt="{filename}"` with surrounding caption providing context.

### Public Submission Form

- Step indicator: `<nav aria-label="Form progress">` with `<ol>` of steps
- Current step: `aria-current="step"` on the current step indicator element
- Completed step: descriptive text includes "Completed" for screen readers
- Map: `<div role="application" aria-label="Select location on map. Tap to drop a pin.">`
- Pin placed: announce via `aria-live="polite"`: "Pin placed at Cedar and 7th Avenue"
- Photo thumbnails: `<img alt="Selected photo: [filename], [file size]">` with remove button `aria-label="Remove photo: [filename]"`

### Toast Messages

- Success: `role="status"` (polite — does not interrupt)
- Error: `role="alert"` (assertive — interrupts immediately)
- Warning: `role="alert"` (for failures the user needs to act on)
- All toasts: Include text content only (no icon-only toasts)

---

## 5. Motion and Animation Safety

| Rule | Implementation |
|---|---|
| All Framer Motion animations | Wrapped in `motionSafe` check or use `reducedMotion="user"` on `AnimatePresence` |
| CSS transitions | Wrapped in `@media (prefers-reduced-motion: no-preference)` |
| Skeleton shimmer | Disabled when reduced motion preferred (static gray shown instead) |
| Toasts | Still appear/disappear but without slide-in animation |
| Step wizard | Instant step change; no slide transition |
| Status badge change | Color change only; no scale or position animation |

```css
/* Global pattern */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Skip Navigation

```html
<!-- First element in <body> -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
         focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary
         focus:border-2 focus:border-primary focus:rounded-md"
>
  Skip to main content
</a>
```

This link becomes visible when focused (Tab from browser chrome). All authenticated screens include this. Public submission form also includes it.

---

## 7. Dark Mode Accessibility

- All color contrast ratios verified in both light and dark modes
- Focus rings: 3 px solid `civic-blue-400` (slightly lighter in dark mode for contrast on dark backgrounds)
- Error states: `red-400` in dark mode (lighter than `red-700` in light mode) for adequate contrast on dark backgrounds
- `<mark>` highlights: `yellow-500` in dark mode text on `yellow-900/40` background — verify contrast

Dark mode is activated via:
1. `prefers-color-scheme: dark` media query (system preference, automatic)
2. Manual toggle button in navbar (persisted to `localStorage`)
3. Both result in `.dark` class on `<html>` element

---

## 8. Section 508 Compliance Summary

| Criterion | Implementation |
|---|---|
| 1194.22(a) — Text alternatives | All images have alt text; decorative images are `aria-hidden` |
| 1194.22(d) — Readable without CSS | Document structure (headings, lists, tables) is meaningful in linear order |
| 1194.22(k) — Keyboard access | All functionality operable via keyboard; no mouse-only interactions |
| 1194.22(l) — Scripts | Dynamic content changes announced via ARIA live regions |
| 1194.22(n) — Forms | All form elements have labels; errors identified by text (not color alone) |
| 1194.22(o) — Skip links | Skip-to-main-content link present on all pages |
| 1194.22(p) — Timed responses | No time limits on form completion; session expiry shows warning with option to extend |

---

*End of Y2-accessibility.md*
