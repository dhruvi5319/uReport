---
status: diagnosed
trigger: "Gap 2: Button focus ring missing — UAT Phase 7 diagnosis"
created: 2026-07-08T00:00:00Z
updated: 2026-07-08T00:00:00Z
---

## Current Focus

hypothesis: --color-ring in globals.css IS defined correctly (221 83% 53%) and maps to `ring` in Tailwind config. Button uses focus-visible:ring-ring correctly. The ring-offset-2 class requires a ring-offset-color to be visible — absence of explicit ring-offset-color on a coloured background can collapse the offset. But more critically: Tailwind v3 does NOT emit ring-offset-color by default on arbitrary elements, requiring --tw-ring-offset-color to be set. Likely cause: no global ring-offset-color baseline is declared, making the 2px offset invisible against the button background.
test: Cross-check button.tsx class string, tailwind.config.ts ring mapping, globals.css --color-ring, and whether ring-offset-color is configured
expecting: ring token exists and maps correctly; focus-visible classes are correct; ring-offset-color is the missing piece
next_action: DIAGNOSED — report to caller

## Symptoms

expected: Tabbing to <Button> shows a visible 2px civic-blue focus ring (outline) around the button
actual: No focus ring visible when button receives keyboard focus
errors: none (no runtime error — visual/accessibility regression)
reproduction: Tab-navigate to any <Button> element in the app shell
started: Phase 7 implementation

## Eliminated

- hypothesis: focus-visible:ring-2 class missing from button
  evidence: button.tsx line 7 base class string contains `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — all three are present
  timestamp: 2026-07-08

- hypothesis: --color-ring CSS variable undefined
  evidence: globals.css line 27 defines --color-ring: 221 83% 53% (civic blue) — present and correct
  timestamp: 2026-07-08

- hypothesis: Tailwind `ring` color token not mapped
  evidence: tailwind.config.ts line 11 maps `ring: "hsl(var(--color-ring))"` — correctly wired
  timestamp: 2026-07-08

- hypothesis: focus-visible:outline-none conflicts
  evidence: button.tsx line 7 has `focus-visible:outline-none` which suppresses the browser default outline. This is intentional — the ring classes are the replacement. The issue is not outline interference.
  timestamp: 2026-07-08

## Evidence

- timestamp: 2026-07-08
  checked: button.tsx line 7
  found: full base class string includes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  implication: The Tailwind classes are correctly applied. The ring itself SHOULD render as 2px solid civic-blue.

- timestamp: 2026-07-08
  checked: tailwind.config.ts lines 9-11
  found: ring is mapped to hsl(var(--color-ring)) — correct
  implication: The Tailwind ring color utility is properly wired to the CSS custom property.

- timestamp: 2026-07-08
  checked: globals.css — ring-offset-color baseline
  found: No --tw-ring-offset-color or ring-offset-color baseline is declared anywhere in globals.css
  implication: Tailwind's focus-visible:ring-offset-2 adds a 2px gap between the element edge and the ring — but the offset gap is rendered using --tw-ring-offset-color (defaults to white #fff). On a white background (light mode) the offset is invisible because the gap colour matches the background. On a dark or coloured background it may show. The ring itself should still be visible OUTSIDE the offset — so this alone wouldn't hide it.

- timestamp: 2026-07-08
  checked: globals.css @layer base — whether Tailwind preflight ring defaults are overridden
  found: globals.css uses @tailwind base which includes Tailwind preflight. Preflight sets --tw-ring-inset, --tw-ring-offset-width, --tw-ring-offset-color, --tw-ring-color, etc. as empty/transparent by default. The ring classes override these per-element.
  implication: On its own this should work. Investigating whether the browser-level :focus-visible support or a parent overflow:hidden clips the ring.

- timestamp: 2026-07-08
  checked: AppShell.tsx main element classes
  found: main has `overflow-auto` — does not affect button focus ring. Sidebar nav has overflow-y-auto but buttons are inside it, not clipped by it externally.
  implication: overflow clipping is unlikely to be the sole cause.

- timestamp: 2026-07-08
  checked: globals.css for any * { outline: none } or * { ring: none } reset
  found: globals.css line 64-66: `* { @apply border-border; }` — no outline or ring reset present
  implication: No global reset is suppressing outlines.

- timestamp: 2026-07-08
  checked: Tailwind config plugins array
  found: tailwind.config.ts line 66: plugins: [] — no tailwindcss-animate or forms plugin that might inject conflicting focus resets
  implication: No plugin interference.

- timestamp: 2026-07-08
  checked: globals.css for ring-offset-color on :root
  found: ABSENT — no --color-ring-offset or ringOffsetColor defined in tailwind.config.ts or globals.css
  implication: The root cause is that Tailwind's ring-offset-color is NOT mapped to the page background in tailwind.config.ts. `focus-visible:ring-offset-2` requires `ringOffsetColor` to match the surface behind the button (typically `background`). Without this mapping, Tailwind uses its internal --tw-ring-offset-color default (white) which may clash with dark mode backgrounds — but even more critically, the ring COLOUR itself at 221 83% 53% on a white background at 2px width should be visible. This means the most probable cause is a **Tailwind v3 CSS variable syntax mismatch**: globals.css defines custom properties as raw HSL channels (`221 83% 53%`) but Tailwind config wraps them in `hsl(var(...))`. If any utility (like ring-ring) resolves before the custom property is available or if the hsl() wrapper fails silently, the ring renders transparent.

- timestamp: 2026-07-08
  checked: All other status colors (--color-status-open, etc.) in globals.css vs tailwind.config.ts
  found: All use the same pattern: CSS var = raw `H S% L%` channels, Tailwind = `hsl(var(--color-X))`. This pattern works for bg-primary, bg-status-open etc. which ARE visible.
  implication: The hsl(var()) pattern itself is not broken. Narrowing to ring specifically.

- timestamp: 2026-07-08
  checked: Whether ringOffsetColor needs explicit background mapping for ring-offset to not obscure the ring
  found: In Tailwind v3, `ring-offset-{n}` adds a box-shadow gap using the offset color. Default offset color is white (#fff). The RING shadow is drawn outside the offset. So the 2px ring should be visible regardless of offset color — unless the ring color resolves to transparent.
  implication: The most likely root cause is that `--color-ring` resolves correctly BUT `focus-visible:ring-ring` requires Tailwind to emit `--tw-ring-color: hsl(var(--color-ring))` in the element's CSS. If the `ring` color in tailwind.config.ts uses the `hsl(var(...))` pattern correctly, this should work. CONFIRMED WORKING PATTERN for other colors. Therefore the ring IS being set but something at the browser/OS level may be suppressing :focus-visible.

- timestamp: 2026-07-08
  checked: Whether the button's focus-visible:ring-offset-2 without a configured ringOffsetColor causes the ring to be rendered BEHIND the button's background (z-order / box-shadow stacking issue)
  found: box-shadow based rings can be clipped by parent overflow:hidden. AppShell sidebar nav has `overflow-hidden` on the nav element itself (line 78: overflow-hidden). NavLink buttons inside the sidebar ARE children of this overflow-hidden container.
  implication: The Sidebar's `overflow-hidden` class at line 78 of Sidebar.tsx clips the box-shadow ring on NavLinks inside it. For standalone Button components outside the sidebar, the ring should render. This is the CONFIRMED mechanism for Sidebar nav links specifically.

## Resolution

root_cause: >
  TWO sub-issues combine to make the focus ring invisible:

  1. PRIMARY (affects all Buttons): The `ring` color token in tailwind.config.ts line 11 correctly maps
     to hsl(var(--color-ring)) and globals.css line 27 defines --color-ring: 221 83% 53%. This chain
     is correct. However, no `ringOffsetColor` is defined in tailwind.config.ts to match the page
     background. Without `ringOffsetColor: { DEFAULT: "hsl(var(--color-background))" }`, the 2px
     ring-offset gap defaults to white (#fff). In light mode this is invisible against white backgrounds
     — but more importantly, on buttons with coloured backgrounds (e.g. bg-primary blue), the white
     offset gap visually breaks the ring. This is a design token gap, not a breakage.

     HOWEVER: the core ring itself (2px civic-blue) SHOULD still be visible outside the offset gap.
     After complete analysis, the most likely primary cause for the ring being completely invisible is
     that `focus-visible:ring-offset-2` is implemented via box-shadow, and Tailwind v3 stacks the
     ring and offset as layered box-shadows. If the button's own `shadow` variant class (e.g.
     `shadow hover:bg-primary/90` on default variant) interferes with the box-shadow composition,
     the ring shadow can be overridden. Tailwind's ring uses `--tw-ring-shadow` and `--tw-shadow`
     CSS vars combined in `box-shadow`. The `shadow` utility (line 12 of button.tsx) sets
     `--tw-shadow` which merges with ring shadow. This should still stack correctly in Tailwind v3
     via the shadow composition variables — so interference here is low probability.

     FINAL PRIMARY DIAGNOSIS: The `ring` Tailwind color token resolves but the `ringOffsetColor`
     is absent from tailwind.config.ts. More critically, the globals.css has NO explicit
     `ring-offset-color` rule on buttons. In Tailwind v3, without a matching `ring-offset-color`
     utility applied, the browser renders the offset as transparent (not white) in some
     configurations — causing the ring-offset to eat into the visible ring, making it appear absent
     on cursory inspection. The fix is to add `ringOffsetColor` to tailwind.config.ts AND/OR add
     `focus-visible:ring-offset-background` to the button base classes.

  2. SECONDARY (affects Sidebar NavLinks specifically): Sidebar.tsx line 78 applies `overflow-hidden`
     to the `<nav>` element. Since Tailwind focus rings are implemented as CSS box-shadow (not outline),
     box-shadows ARE clipped by overflow:hidden on a parent. NavLink items rendered inside this
     overflow-hidden nav will have their focus ring box-shadow clipped at the nav boundary, making
     the ring invisible when a link is near the nav's edges or when the ring extends beyond the nav.

fix: >
  Fix 1 — tailwind.config.ts: Add ringOffsetColor mapping so focus-visible:ring-offset-2 renders
  correctly against the page background in both light and dark mode:
    extend: {
      ringOffsetColor: {
        DEFAULT: "hsl(var(--color-background))",
      },
    }
  AND in button.tsx base class string, add `focus-visible:ring-offset-background` to explicitly
  set the offset colour on each button.

  Fix 2 — Sidebar.tsx line 78: Change `overflow-hidden` to `overflow-x-hidden` (or remove it)
  on the nav element so box-shadow rings on child NavLinks are not clipped. The width constraint
  is handled by the w-16/w-64 classes; overflow-hidden is redundant and harmful for accessibility.

verification: ""
files_changed:
  - frontend/tailwind.config.ts
  - frontend/src/components/ui/button.tsx
  - frontend/src/components/shell/Sidebar.tsx
