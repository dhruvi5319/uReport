# Y0 — Interaction Patterns

---

## Pattern 1: Toast Notifications

**When to use:** Every async save, bulk operation result, network error, email notification warning
**Component:** shadcn/ui `Toast` (via `useToast` hook)

```
TOAST ANATOMY (top-right, stacks):
┌────────────────────────────────────────────────────────┐
│  ✓  Case #4821 created successfully      [View] [×]   │  ← success
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│  ⚠  Email notification failed to send          [×]    │  ← warning
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│  ✕  Failed to save. Please try again.  [Retry] [×]   │  ← error
└────────────────────────────────────────────────────────┘
```

| Variant | Color | Icon | Auto-dismiss |
|---|---|---|---|
| Success | Green | ✓ check | 4 seconds |
| Warning | Amber | ⚠ | 6 seconds |
| Error | Red | ✕ | Manual dismiss only |
| Info | Blue | ℹ | 4 seconds |

- Position: `top-right` on desktop, `bottom-center` on mobile (above thumb reach)
- Maximum 3 toasts stacked simultaneously; oldest dismissed first
- ARIA: `role="status"` (success/info) or `role="alert"` (warning/error)
- Keyboard: `Escape` dismisses topmost toast

---

## Pattern 2: Confirmation Dialog

**When to use:** All destructive or irreversible actions — bulk close, single close with substatus, delete entity, reopen
**Component:** shadcn/ui `Dialog`

```
┌────────────────────────────────────────────────────────────┐
│  [Dialog Title — describes the action]             [×]    │
│  ──────────────────────────────────────────────────────    │
│  [Body — explains what will happen, how many affected]     │
│                                                            │
│  [Input fields if needed — substatus, notes, etc.]         │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│  [Cancel]                          [Confirm Action]        │
└────────────────────────────────────────────────────────────┘
```

**Rules:**
- Cancel is ALWAYS present and equally visible — never hidden or de-emphasized
- Confirm button text describes the action, not just "OK" or "Confirm" ("Close Case", "Delete Department", "Bulk Close 33 Cases")
- Destructive action buttons: `variant="destructive"` (red) — only for permanent deletes, not for status changes
- Focus trap: Escape closes dialog (unless a required field is empty); focus returns to trigger element
- Focus on open: first interactive field (or Cancel if form is review-only)
- ARIA: `aria-modal="true"`, `aria-labelledby` pointing to dialog title

**Examples:**

| Action | Title | Confirm Button |
|---|---|---|
| Close case | "Close Case #5102" | "Close Case" |
| Bulk close | "Close 33 Cases" | "Close 33 Cases" |
| Delete department | "Delete Public Works?" | "Delete Department" |
| Delete person | "Delete Diane Kowalski?" | "Delete Person" |
| Reopen case | "Reopen Case #5102?" | "Reopen Case" |
| Delete photo | "Delete this photo?" | "Delete Photo" |

---

## Pattern 3: Skeleton Loading

**When to use:** Every data fetch — table rows, stat cards, case detail panels, timeline
**Component:** shadcn/ui `Skeleton`

```
SKELETON ROW (table):
┌──────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░ │ ░░░░░░░░░░░ │ ░░░░ │ ░░░░░ │
└──────────────────────────────────────────────────────────────────────┘
(shimmer animation: background moves left-to-right, 1.5s loop)

SKELETON CARD (stat card):
┌────────────────┐
│ ░░░░░░░░░░░░░░ │  ← label skeleton
│                │
│   ░░░░░░░░░    │  ← number skeleton (taller)
│                │
│ ░░░░░░░░░░░░   │  ← sub-label skeleton
└────────────────┘
```

- Always show the same number of skeleton items as the expected result count
- For unknown counts: show 5 skeleton rows for tables, 3 for timelines, 4 for stat cards
- Skeletons preserve column widths so the layout doesn't shift when real data arrives
- ARIA: `aria-busy="true"` on the container while loading; `aria-busy="false"` after data loads

---

## Pattern 4: Inline Editing

**When to use:** Editable fields on Case Detail metadata panel
**Pattern:** Read → Edit → Save/Cancel

```
STATES:
Read:   [Field Value                ] [✎]
Edit:   [___Field Input___________] [✓ Save] [✕ Cancel]
Saving: [New Value                 ] [Saving... ⟳]  ← optimistic
Error:  [Original Value            ] [✎]
        ⚠ Could not save changes. Try again.
```

- Entire field label + value row is clickable to enter edit mode (not just the ✎ icon)
- Escape key cancels editing
- Enter key submits for single-line inputs; Shift+Enter for multiline textareas
- Tab moves focus to next editable field
- Closed ticket fields: ✎ icon hidden entirely; value is plain text only

---

## Pattern 5: Filter Chips

**When to use:** Active filters on Case List; active search term display

```
CHIP ANATOMY:
┌──────────────────────────┐
│  Status: Open  [×]       │  ← label + value + remove button
└──────────────────────────┘
```

- Each active filter = one chip
- Search term chip: `Search: "maria santos" [×]`
- "×" on chip removes that single filter and refetches
- "Clear all filters" link appears when ≥1 chip is active
- Chips wrap to multiple rows on narrow viewports
- Chips are keyboard-navigable; Tab moves between chips; Enter/Space activates remove "×"
- ARIA: `role="button"` on remove "×" with `aria-label="Remove filter: Status Open"`

---

## Pattern 6: Status Badge Pills

**When to use:** Case list rows, case detail header, recent cases feed, timeline entries

```
Badge rendering:
[OPEN]        → bg-blue-100   text-blue-800  (border-blue-200)
[RESOLVED]    → bg-green-100  text-green-800
[DUPLICATE]   → bg-gray-100   text-gray-700
[BOGUS]       → bg-red-100    text-red-700
[CLOSED]      → bg-purple-100 text-purple-800
[OVERDUE]     → bg-red-500    text-white      (solid — more urgent)
```

Dark mode equivalents use the same semantic tokens (CSS variables):
```
[OPEN] dark: bg-blue-900/40 text-blue-300
```

- Badges are `<span>` elements (not interactive unless in a filter dropdown)
- Font: Inter, uppercase, font-semibold, text-xs, px-2 py-0.5, rounded-full
- Min-width: enough for the longest text ("DUPLICATE") to avoid layout shift

---

## Pattern 7: Side Sheet (Admin CRUD)

**When to use:** All admin create/edit operations (Person, Department, Category, etc.)
**Component:** shadcn/ui `Sheet` with `side="right"`

```
SHEET BEHAVIOR:
- Opens from the RIGHT edge of the viewport
- Width: 480 px on desktop; full width on mobile
- Background: main content visible but dimmed (backdrop opacity-40)
- Closing: [×] button, Escape key, or clicking backdrop
- Focus: trapped within sheet when open
- Scroll: sheet content scrolls independently; main content is fixed

SHEET HEADER:
┌──────────────────────────────────────────────────────────────┐
│  [Sheet Title]                                        [×]   │
│  [Optional subtitle / description]                          │
├──────────────────────────────────────────────────────────────┤
│  [Scrollable form content]                                   │
├──────────────────────────────────────────────────────────────┤
│  [Cancel]                                    [Save]         │  ← sticky footer
└──────────────────────────────────────────────────────────────┘
```

- Sticky footer ensures Save/Cancel are always visible regardless of form scroll position
- Form sections separated by horizontal rules with section labels
- ARIA: `role="dialog"`, `aria-labelledby` pointing to sheet title, `aria-modal="true"`

---

## Pattern 8: Optimistic UI

**When to use:** Inline field saves on Case Detail; status badge transitions; timeline prepends

**Sequence:**
1. User clicks Save
2. **Immediately**: UI shows new value; spinner appears on field; action logged pessimistically
3. API call fires in background
4. **On success**: Spinner removed; toast "Case updated"
5. **On failure**: UI reverts to original value; error toast; field re-enters edit mode

This pattern is critical for Marcus during live calls — he cannot wait 500 ms for the UI to update.

---

## Pattern 9: Debounced Live Search

**When to use:** Case list search, admin people search, reporter search, category autocomplete

**Behavior:**
1. User types character(s)
2. Skeleton/loading indicator appears **immediately** (within 16 ms)
3. Wait 300 ms from last keypress
4. API call fires with current input value
5. Results replace skeleton
6. On fast typing: only the most recent request is used; previous requests cancelled (AbortController)

**Edge cases:**
- Minimum query length: 1 character (no minimum — every character triggers search after debounce)
- Empty string: returns full unfiltered list (with other filters preserved)
- Max 255 characters: enforced via HTML `maxlength`; no server-side truncation error shown

---

## Pattern 10: Framer Motion Animation Variants

**Page transitions:**
```javascript
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};
// duration: 200ms, easing: easeOut
```

**Stagger children (e.g., stat cards, list rows):**
```javascript
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 }
};
```

**Status badge transition:**
```javascript
// Badge color change on close/reopen
// Use layout animation: layoutId="status-badge"
// Color animates via CSS variable; no JS color interpolation
```

**Wizard step transitions (public form):**
```javascript
const stepVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 })
};
// duration: 200ms
```

**prefers-reduced-motion handling:**
```javascript
const motionSafe = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// All Framer Motion animations wrapped in motionSafe check
// Or use AnimatePresence with reducedMotion="user" prop
```

---

## Pattern 11: Bulk Action Toolbar

**When to use:** Case list — appears when ≥1 row checkbox is checked

```
TOOLBAR BEHAVIOR:
- Enter animation: slides up from bottom of table with Framer Motion (y: 100 → 0, 200ms)
- Exit animation: slides down when all selections cleared
- Sticks to bottom of viewport on mobile (fixed positioning)
- On desktop: appears inline above pagination

TOOLBAR CONTENT:
┌─────────────────────────────────────────────────────────────────┐
│  ☑ 33 cases selected          [Assign]  [Change Status]  [Close]│
└─────────────────────────────────────────────────────────────────┘

ACTIONS:
- Assign → Opens dialog with staff search/select
- Change Status → Opens dialog with status dropdown
- Close → Opens dialog with required substatus selector
```

---

*End of Y0-patterns.md*
