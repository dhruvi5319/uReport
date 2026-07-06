---

## F17: Design System and UI Framework

**Priority:** P0 — Critical

### Description

The React frontend is built on a custom design system defined by Tailwind CSS configuration, shadcn/ui components, and CSS variable design tokens. It is not a feature users interact with directly but is the technical foundation enabling visual consistency, theming (light/dark), accessibility, and animation across every screen. All UI feature implementations (F2–F6, F12, F13, etc.) depend on this system.

### Terminology

- **Design tokens** — Named CSS custom properties (`--color-primary`, `--radius-md`, etc.) defined on `:root` and overridden on `.dark`. All component styles reference tokens, never hardcoded values.
- **shadcn/ui** — A set of accessible, unstyled (primitives) React components built on Radix UI, styled via Tailwind. Components are vendored (copied, not imported) into the project for full customization.
- **Tailwind CSS** — Utility-first CSS framework. Extended with custom color palette, spacing scale, and shadow tokens.
- **4 px grid** — All spacing, padding, margin, and sizing values are multiples of 4 px (Tailwind `space-1` = 4 px).
- **3-tier shadow system** — `shadow-sm` (low elevation: inputs, cards), `shadow-md` (medium: dropdowns, panels), `shadow-lg` (high: modals, toasts).
- **Framer Motion** — React animation library. Used for page transitions, stagger children, and micro-interactions.
- **prefers-reduced-motion** — CSS/JS media query. When active, all Framer Motion animations are disabled globally via a single `AnimationProvider` that reads the media query and passes `{duration: 0}` to all motion variants.

### Sub-features

- Tailwind CSS custom configuration
- CSS variable design token system (light/dark mode)
- shadcn/ui component customizations
- Typography: Inter (UI text) + JetBrains Mono (IDs, codes)
- 4 px base grid
- 3-tier elevation shadow system
- Dark mode: `prefers-color-scheme` media query + manual toggle; persisted to localStorage
- Framer Motion animation system: page transitions, stagger, micro-interactions; all ≤ 300 ms
- prefers-reduced-motion: disables all motion globally

### Design Token System

All tokens are CSS custom properties on `:root` (light) and `.dark` (dark mode class on `<html>`):

**Color Tokens:**
```css
:root {
  --color-primary: hsl(221, 83%, 53%);       /* City brand blue */
  --color-primary-foreground: hsl(0, 0%, 100%);
  --color-secondary: hsl(210, 40%, 96%);
  --color-secondary-foreground: hsl(222, 47%, 11%);
  --color-destructive: hsl(0, 84%, 60%);
  --color-destructive-foreground: hsl(0, 0%, 100%);
  --color-muted: hsl(210, 40%, 96%);
  --color-muted-foreground: hsl(215, 16%, 47%);
  --color-accent: hsl(210, 40%, 96%);
  --color-background: hsl(0, 0%, 100%);
  --color-foreground: hsl(222, 47%, 11%);
  --color-border: hsl(214, 32%, 91%);
  --color-ring: hsl(221, 83%, 53%);
  /* Status colors */
  --color-status-open: hsl(217, 91%, 60%);
  --color-status-resolved: hsl(142, 71%, 45%);
  --color-status-duplicate: hsl(215, 16%, 47%);
  --color-status-bogus: hsl(0, 84%, 60%);
}
.dark {
  --color-background: hsl(222, 47%, 11%);
  --color-foreground: hsl(210, 40%, 98%);
  --color-border: hsl(217, 32%, 18%);
  /* ... all tokens overridden for dark mode */
}
```

**Spacing:** Tailwind default scale (4 px base). No custom spacing tokens beyond Tailwind defaults.

**Border radius tokens:**
```css
:root {
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
}
```

### shadcn/ui Components (Required Set)

| Component | Usage |
|---|---|
| `Button` | All action buttons (primary, secondary, destructive, ghost, link variants) |
| `Dialog` | Confirmation dialogs, lightbox overlay (focus-trapped) |
| `AlertDialog` | Destructive confirmations (delete actions) |
| `Input` | Text inputs, search fields |
| `Textarea` | Notes/description fields |
| `Select` | Dropdown selectors |
| `Badge` | Status badge pills |
| `Card` | Dashboard stat cards, case list rows |
| `Table` | Case list, admin panel tables |
| `Skeleton` | Loading placeholders |
| `Toast` / `Toaster` | Success/error notifications |
| `Sheet` | Side drawer for create/edit forms |
| `Tabs` | Category/department sub-navigation |
| `Popover` | Map pin preview popovers |
| `Command` | Search combobox (assignee picker, person search) |
| `Breadcrumb` | Route breadcrumbs |
| `Avatar` | User avatar in navbar |

All components are customized to use CSS design tokens. Primary color, radius, and shadow are applied via Tailwind config referencing the CSS variables.

### Typography

| Context | Font | Tailwind Class |
|---|---|---|
| All UI text | Inter (Google Fonts) | `font-sans` |
| IDs, codes, monospace values | JetBrains Mono | `font-mono` |
| Heading 1 | Inter 700, 2rem | `text-3xl font-bold` |
| Heading 2 | Inter 600, 1.5rem | `text-2xl font-semibold` |
| Body | Inter 400, 1rem | `text-base` |
| Caption | Inter 400, 0.875rem | `text-sm text-muted-foreground` |
| Code / ID | JetBrains Mono 400, 0.875rem | `font-mono text-sm` |

### Framer Motion Animation Presets

All animations respect `prefers-reduced-motion`:
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = prefersReducedMotion ? 0 : 0.2; // max 300ms = 0.3s
```

**Page transition variant:**
```tsx
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};
```

**Stagger children (lists, cards):**
```tsx
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } }
};
```

**Multi-step form step transition:**
```tsx
const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.25 } },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0, transition: { duration: 0.2 } })
};
```

### Dark Mode

- **Detection:** On app init, read `localStorage.getItem('theme')`. If `'dark'`, add `.dark` class to `<html>`. If `'system'` or absent, read `prefers-color-scheme: dark` media query.
- **Manual toggle:** User clicks dark mode toggle in navbar → toggled value saved to `localStorage`.
- **Implementation:** `ThemeProvider` context wraps the app; provides `theme`, `setTheme` to all components.
- All colors are CSS variable references; no hardcoded colors in Tailwind classes (use semantic token names: `bg-background`, `text-foreground`, `border-border`, etc.).

### Validation / Quality Gates

- Contrast check: all text must meet WCAG AA ratio (4.5:1 normal, 3:1 large). Verified via automated axe-core scan.
- Animation durations: all Framer Motion variants must have `duration ≤ 0.3` seconds.
- `prefers-reduced-motion`: a Storybook / Playwright smoke test verifies that all animations have duration 0 when the media query is active.
- Dark mode: automated contrast scan passes for all tokens in `.dark` mode.

### Schema Surface

None — design system is frontend-only.

### API Surface

None — design system is frontend-only.
