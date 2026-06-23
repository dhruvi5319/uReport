---

## Responsive Considerations

### Breakpoints

| Name | Width | Primary target |
|------|-------|---------------|
| `sm` | 375px | iPhone SE / small Android; citizen submission form |
| `md` | 768px | iPad portrait; field staff with tablet |
| `lg` | 1024px | iPad landscape; laptop |
| `xl` | 1280px | Standard desktop workstation |
| `2xl` | 1920px | Wide monitor; manager dashboard |

---

### Screen-by-Screen Responsive Behavior

#### Screen 00: Login
- **Desktop:** Centered card (max-width 400px) on a full-page background
- **Mobile:** Card fills viewport width with 16px padding; no change in content

#### Screen 01: Dashboard
- **Desktop (xl+):** 4-column KPI card row; 2-column second row (workload + bookmarks); 1-column recent tickets
- **Tablet (md–lg):** 2-column KPI row; stacked second row; full-width recent tickets
- **Mobile (sm):** Single-column everything; KPI cards are horizontally scrollable (snap scroll); workload chart hidden or simplified to a list; bookmarks panel collapses to a "Bookmarks" button that opens a bottom sheet

#### Screen 02: Ticket List
- **Desktop (xl+):** Left filter sidebar (260px) + right results list
- **Tablet (md–lg):** Filter sidebar collapses to a top filter bar (horizontal chips); results full-width
- **Mobile (sm):** Filter icon opens a full-screen bottom sheet; results in single-column cards (not table rows); checkboxes for bulk selection present but toolbar adjusts; export CSV hidden (available in desktop/tablet)

#### Screen 03: Ticket Detail
- **Desktop (xl+):** 2-column layout — ticket content (left, ~65%) + actions sidebar (right, ~35%)
- **Tablet (md–lg):** 2-column layout with narrower sidebar; sidebar may stack below on landscape tablet
- **Mobile (sm):** 
  - Single column; ticket fields stack vertically
  - Sidebar collapses to sticky bottom action bar with "Actions ▾" button
  - Tapping "Actions" opens a bottom sheet with assign, close/reopen, compose controls
  - Compose panel is a full-screen bottom sheet with "Response / Comment" radio at top
  - History renders full-width below the ticket fields
  - "Add attachment" is a full-width button (not a small icon)

#### Screen 04: Create Ticket (Staff)
- **Desktop:** Two-panel layout on Step 2 (address field left, map right)
- **Tablet:** Same as desktop, map is proportionally smaller
- **Mobile (sm):** 
  - Step 2: address field stacked above map (full-width map, ~220px tall)
  - Step 3: all fields stack vertically; custom fields are full-width
  - Sticky bottom bar with "Next" / "Create Ticket" button

#### Screen 05: Public Submit Form
- **Designed mobile-first.** All steps are single-column at 375px.
- **Desktop (xl+):** Step 1 (category) shows a 2-column grid of category cards; Step 2 shows address field and map side by side; Steps 3–4 use a centered max-width container (640px) for comfortable reading

#### Screen 06: SLA Dashboard
- **Desktop (xl+):** 4-column KPI row; 2-column middle section (category table + staff workload)
- **Tablet:** KPI row becomes 2-column; middle section stacks vertically
- **Mobile (sm):** KPI cards are horizontal scroll; tables become card stacks; staff workload chart becomes a list

#### Screen 07: Reports
- **Desktop:** Left nav (report types) + right content panel
- **Tablet:** Left nav collapses to top tab bar
- **Mobile (sm):** Top tab bar for report types; filter bar collapses to a filter icon; table rows become card stacks; Download CSV button remains prominent

#### Screen 08: Admin Panel
- **Desktop:** Left nav sidebar + content area
- **Tablet:** Left nav becomes a top tab bar or collapsible hamburger
- **Mobile (sm):** Admin panel is usable on mobile but primarily optimized for desktop. Table rows become card stacks with visible actions; forms are full-width single-column

#### Screen 09: API Docs (Swagger UI)
- **Desktop:** Standard Swagger UI layout; wide endpoint list + schema panels
- **Mobile:** Swagger UI is readable but primarily for developer use. No specific mobile optimization beyond responsive meta tag.

#### Screen 10: Map View
- **Desktop:** Full-viewport map with filter overlay at bottom
- **Mobile (sm):**
  - Map fills entire screen (no sidebar)
  - Filter button (⚙) top-right opens a bottom sheet for filter controls
  - Ticket popup on marker click renders as a bottom sheet (not an overlay bubble)
  - Zoom controls are floating buttons (+/−) positioned left-center for thumb access

---

### Universal Responsive Rules

1. **No horizontal scroll at any breakpoint on any screen.** Text wraps; tables become card stacks; sidebars collapse.  
2. **Minimum touch target: 44×44px** on all interactive elements at sm/md breakpoints.  
3. **Font sizes:** Body text minimum 16px on mobile (prevents iOS auto-zoom on input focus).  
4. **Form inputs:** Full-width (100%) at sm breakpoint.  
5. **Tables:** Convert to card stacks at sm breakpoint. Each card shows field label + value pairs vertically.  
6. **Modals and dialogs:** Full-screen on sm; centered floating on md+.  
7. **Bottom sheets:** Used on sm for sidebars, filter panels, action menus, and compose panels. Includes a visible drag handle.  
8. **Navigation:** Top nav collapses to a hamburger menu on sm. "New Ticket" CTA remains accessible as a floating action button (FAB) on mobile if it disappears from the nav.
