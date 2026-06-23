---

## Accessibility Notes

**Standard:** WCAG 2.1 Level AA  
**Enforcement:** Automated axe-core audit in CI with 0 critical violations on all primary SPA routes (US-15.3)  
**Component library:** Radix UI / shadcn/ui for accessible dialog, dropdown, form, and navigation primitives  
**Internalization:** All user-facing strings use gettext-compatible i18n; no hard-coded English strings

---

### Color & Contrast

| Use case | Foreground | Background | Required ratio | Notes |
|----------|-----------|-----------|----------------|-------|
| Body text | #111827 | #FFFFFF | 4.5:1 ✅ | Normal text |
| Secondary text | #6B7280 | #FFFFFF | 4.5:1 ✅ | Min for small text |
| SLA Breach badge text | #FFFFFF | #EF4444 | 4.5:1 ✅ | |
| SLA Warning badge text | #1F2937 | #FCD34D | 4.5:1 ✅ | Dark text on amber |
| SLA OK badge text | #FFFFFF | #22C55E | 4.5:1 ✅ | |
| Primary CTA button | #FFFFFF | #2563EB | 4.5:1 ✅ | |
| Disabled button | #9CA3AF | #F3F4F6 | 4.5:1 (check) | Verify in design tokens |
| Link text | #1D4ED8 | #FFFFFF | 4.5:1 ✅ | |
| Error text | #DC2626 | #FFFFFF | 4.5:1 ✅ | |

**Critical rule:** SLA urgency is communicated by **color AND text label** simultaneously. The red/amber/green color is accompanied by the label "SLA Breach", "Due today", or "On track" in the badge. Color is never the sole differentiator (WCAG 1.4.1 — Use of Color).

---

### Keyboard Navigation

| Screen | Keyboard behavior required |
|--------|--------------------------|
| All | Tab order follows visual left-to-right, top-to-bottom DOM order |
| Login | Single focusable CTA; Enter triggers OIDC redirect |
| Ticket List | Arrow keys navigate table rows; Enter opens ticket detail |
| Ticket Detail | Tab reaches all sidebar controls; Enter/Space activates buttons |
| Compose Panel | Tab moves between Response/Comment radio, Template dropdown, textarea, Send button |
| Multi-select (ticket list) | Space selects/deselects focused row; Shift+click ranges work |
| Modals / Dialogs | Focus trapped inside while open; Escape closes; focus returns to trigger on close |
| Bottom sheets (mobile) | Same as modals; focus trapped; Escape closes |
| Dropdown menus | Arrow keys navigate options; Enter selects; Escape closes |
| Date pickers | Keyboard-navigable calendar (Radix UI DatePicker) |
| Map (Screen-10) | Map is `role="application"` with keyboard zoom controls; markers are keyboard-reachable |

**Skip links:** A "Skip to main content" link is the first focusable element on every page. Visible on focus.

---

### Screen Reader Requirements

| Element | Required ARIA / semantics |
|---------|--------------------------|
| Page title | `<title>` updates on every SPA route change via Next.js `<Head>` |
| Route changes | `aria-live="polite"` region announces new page title on navigation |
| Ticket list | `<table>` with `<caption>` and `<th scope>` headers; or `role="list"` on card layout |
| SLA badge | `aria-label="SLA status: Breach — 1 day overdue"` |
| Status badge | `aria-label="Status: Open"` |
| Step indicator | `role="progressbar" aria-valuenow="2" aria-valuemax="4" aria-valuetext="Step 2 of 4: Location"` |
| Internal comment badge | `aria-label="Internal comment — visible to staff only"` |
| Filter panel | `role="search"` landmark |
| Map | `role="application" aria-label="Interactive map showing ticket locations"` |
| Cluster markers | `aria-label="{count} tickets in this area — click to zoom in"` |
| Loading states | `role="status" aria-live="polite"` with "Loading…" text |
| Empty states | Static text; no special ARIA needed |
| Modals | `role="dialog" aria-modal="true" aria-labelledby="{modal-title-id}"` |
| Toast notifications | `role="alert" aria-live="assertive"` for errors; `aria-live="polite"` for success |
| Form errors | `aria-invalid="true"` on the input; `aria-describedby="{error-id}"` links to error message |
| Required fields | `aria-required="true"` on inputs; asterisk (*) in label with `aria-hidden="true"` |
| File upload (citizen form) | `aria-label="Upload a photo of the issue"` on the upload button |
| Confirmation dialogs | Destructive button has `aria-describedby` linking to the warning text |

---

### Form Accessibility

- Every `<input>`, `<select>`, and `<textarea>` has an associated `<label>` element (not just `aria-label`)  
- Error messages appear in the DOM immediately after their field (not floating)  
- Placeholder text is supplementary only — never used as the sole label  
- Required fields: marked with visual asterisk + `aria-required="true"` + explained in a legend at form top  
- Date inputs: use text inputs with `type="date"` or Radix DatePicker — avoid browser-default date pickers on mobile where accessible alternatives exist  
- Select dropdowns: use `<select>` for simple cases; Radix Select for styled dropdowns (preserves keyboard + screen reader behavior)  
- File upload: `<input type="file">` is present in DOM for screen readers; the styled button triggers it; `accept` attribute restricts file types client-side

---

### Image Accessibility

| Image type | `alt` text requirement |
|-----------|----------------------|
| Ticket attachment thumbnails | `alt="Attachment: {filename}"` or user-provided label if set |
| City logo | `alt="[City Name] uReport"` |
| Category icons (citizen form) | `aria-hidden="true"` (decorative; category name is the text label) |
| Map tiles | `aria-hidden="true"` (decorative; actual data in markers/clusters) |
| Status/SLA colored icons | `aria-hidden="true"` (supplementary to text label) |
| Empty state illustrations | `alt=""` (decorative) |

---

### Motion & Animation

- Skeleton loaders use CSS `animation: shimmer` — respects `prefers-reduced-motion: reduce` (no animation in that case; static gray blocks instead)  
- Toast entry/exit animations: fade only; no bounce or slide on `prefers-reduced-motion`  
- Map cluster zoom animation: instant on `prefers-reduced-motion`  
- Page transitions: instant on `prefers-reduced-motion`

---

### i18n Notes

- All user-facing strings are wrapped in `t('key')` or `__('key')` calls for gettext extraction  
- Date and time values rendered using `Intl.DateTimeFormat` with locale from user/browser settings  
- Number formatting (ticket counts, percentages) uses `Intl.NumberFormat`  
- RTL layout: while not required for initial MVP, the component library (Radix UI) supports RTL via CSS logical properties — avoid hard-coded `left`/`right` in layout CSS

---

### Testing

| Tool | Usage |
|------|-------|
| axe-core | Automated WCAG 2.1 AA audit in CI on all primary routes; 0 critical violations required before PR merge |
| Playwright | e2e keyboard navigation tests for critical flows (login, create ticket, public submit) |
| Manual testing | Screen reader (NVDA + Chrome, VoiceOver + Safari) on Login, Ticket Detail, and Public Submit screens before each major release |
| Lighthouse | Accessibility score ≥ 90 on ticket list and search pages (mobile profile) |
