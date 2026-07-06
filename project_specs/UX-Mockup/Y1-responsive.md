# Y1 — Responsive Design Considerations

**Breakpoints:**
- **Mobile**: `< 768 px` (375 px minimum — tested at 375 px)
- **Tablet**: `768 px – 1279 px`
- **Desktop**: `≥ 1280 px`

**Design approach**: Mobile-first CSS. Base styles for mobile; `md:` and `lg:` modifiers for tablet/desktop.

---

## Global Responsive Rules

| Rule | Mobile | Tablet | Desktop |
|---|---|---|---|
| Sidebar | Hidden (hamburger drawer) | Icon-only (w-16) | Full (w-64) or collapsed |
| Content area | Full width | ml-16 | ml-64 or ml-16 |
| Grid columns | 1-col | 2-col | 2–4 col depending on screen |
| Touch targets | ≥ 44 × 44 px | ≥ 44 × 44 px | ≥ 36 × 36 px |
| Font sizes | Base 16 px | Base 16 px | Base 16 px |
| Horizontal scroll | NEVER | NEVER | NEVER |
| Table layout | Card layout | Compact table | Full table |

---

## Screen-by-Screen Responsive Adaptations

### Login Screen

| Viewport | Adaptation |
|---|---|
| Mobile | Card fills full width with `mx-4` padding; CAS button is full-width |
| Tablet | Card centered, max-width 400 px |
| Desktop | Card centered, max-width 420 px; logo above card |

### Navigation Shell

| Viewport | Adaptation |
|---|---|
| Mobile | No sidebar; hamburger `[☰]` in navbar opens a Sheet drawer |
| Tablet | Sidebar collapses to icon-only (w-16); tooltip on icon hover |
| Desktop | Full sidebar (w-64); collapsible to icon-only via toggle button |

Breadcrumbs:
- Mobile: truncated to last 2 segments when too wide; `…` prefix shown
- Tablet/Desktop: full breadcrumb trail visible

### Dashboard

| Viewport | Adaptation |
|---|---|
| Mobile | Single column: Quick links → Stat cards (2-col grid) → Map → Donut → Feed |
| Tablet | 2-col grid: Stat cards 4-col row; Map (2/3) + Donut (1/3); Feed below |
| Desktop | Same as tablet but sidebar visible |

Stat cards: Always show 4 in a 2×2 grid on mobile, 4-col row on tablet+.

Map widget height:
- Mobile: `h-48` (192 px)
- Tablet: `h-64` (256 px)
- Desktop: `h-80` (320 px)

### Case List

| Viewport | Adaptation |
|---|---|
| Mobile | Card layout (no table); each card shows: ID, category, reporter, status, date; filter panel is a Sheet drawer |
| Tablet | Compact table; fewer columns (hide Location, show 5 columns) |
| Desktop | Full table; all 7 columns visible; filter panel is inline left or collapsible |

Bulk selection:
- Mobile: No checkboxes (bulk operations not available on mobile — use individual case actions)
- Tablet/Desktop: Checkbox column + Select All header

Pagination:
- Mobile: Simplified — "← Prev | Page X of Y | Next →" (no numbered page buttons)
- Desktop: Full paginator with numbered page buttons

### Case Detail

| Viewport | Adaptation |
|---|---|
| Mobile | Stacked: Metadata → Action form → Media gallery → Timeline |
| Tablet | Split-pane: left (metadata, 40%) + right (action + timeline, 60%); map hidden or collapsed |
| Desktop | Full split-pane; map and media gallery both visible in left pane |

Action log form on mobile:
- Full-width textarea with `rows={4}` initial; auto-expand on content
- Notification toggles: full-width touch targets
- Submit button: full-width primary button at bottom of form section

Timeline on mobile:
- Scroll independently within the page (not in a fixed-height panel)
- Timeline entries are full-width cards

### New Case Form (Staff)

| Viewport | Adaptation |
|---|---|
| Mobile | Single column; all fields stacked; photo zone replaced with "📷 Add Photos" button |
| Tablet | Single column (form is 2-col on desktop only for side-by-side optional fields) |
| Desktop | 2-column optional fields (Reporter + Assignee side by side); required fields full-width |

### Public Submission Wizard

| Viewport | Adaptation |
|---|---|
| Mobile | Single column; wizard shell full-width; map 250 px tall; photo = native picker button |
| Tablet | Centered card (max-w-lg); same structure as mobile with more padding |
| Desktop | Centered card (max-w-2xl); category tiles 3-col; map 350 px; drag-drop zone |

**375 px specific rules for public form:**
- No horizontal scroll at any step
- Navigation buttons (Back / Next) are each ≥44 px tall; full-width on Step 5 Submit
- Progress dots: compact (16 px diameter); no labels (too narrow)
- Textarea: `fontSize: 16px` minimum to prevent iOS zoom on focus

### Admin Panels

| Viewport | Adaptation |
|---|---|
| Mobile | Table collapses to single-column card list (name + actions only); Sheet opens full-width |
| Tablet | Table with 3–4 columns; Sheet opens at 60% width |
| Desktop | Full table; Sheet at 480 px fixed width |

Delete and action buttons on mobile:
- Action buttons stack vertically in each card: `[Edit]` and `[Delete]`
- Minimum 44 px height per button

---

## Touch Interaction Requirements (Mobile)

| Target | Minimum Size | Notes |
|---|---|---|
| Buttons (all) | 44 × 44 px | Padding added to maintain size |
| Checkbox (bulk select) | 44 × 44 px tap target | Actual checkbox smaller but hit area extended |
| Table row (case list) | Full row height ≥ 56 px | Entire row is the tap target |
| Sidebar nav items | 44 px height | Left edge to right edge |
| Filter chip remove [×] | 44 × 44 px | Extended tap area around "×" |
| Thumbnail [×] remove | 44 × 44 px | Positioned at corner of thumbnail |
| Lightbox prev/next | 48 × 48 px | Large enough for gloved/imprecise tap |
| Step wizard Back/Next | 44 px height, 100% width | Full width on mobile Step 5 |

---

## No-Horizontal-Scroll Checklist

All screens must pass this checklist at 375 px viewport width:

- [ ] All form fields: `max-w-full` or `w-full`
- [ ] All tables: hidden on mobile (replaced by cards) or use `overflow-x-auto` with scroll hint
- [ ] All images: `max-w-full` or `object-cover` in bounded containers
- [ ] All fixed-width containers: replaced with `max-w-full` equivalents
- [ ] Toasts: `max-w-[calc(100vw-2rem)]`
- [ ] Dialogs: `max-w-[calc(100vw-2rem)] mx-4`
- [ ] Sheets: full-width on mobile
- [ ] Map widget: `width: 100%` always

---

## Performance Targets by Viewport

| Metric | Mobile (3G) | Desktop |
|---|---|---|
| Case list initial load | ≤ 4 s | ≤ 2 s |
| Search response | ≤ 500 ms | ≤ 500 ms |
| Dashboard widgets | ≤ 4 s | ≤ 2 s |
| Map widget load | ≤ 3 s | ≤ 2 s |
| Step transition animation | ≤ 300 ms | ≤ 300 ms |
| Public form submission | ≤ 5 s | ≤ 2 s |

Image optimization for mobile:
- Thumbnails served from `/api/media/{id}/thumbnail` (150×150 px, JPEG 80%)
- Full-size photos lazy-loaded only when lightbox opens
- Map tiles: Mapbox uses vector tiles (smaller than raster on mobile)

---

*End of Y1-responsive.md*
