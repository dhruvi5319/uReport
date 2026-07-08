---
status: diagnosed
trigger: "Gap 1: Duplicate badge renders grey — UAT Phase 7 diagnosis"
created: 2026-07-08T00:00:00Z
updated: 2026-07-08T00:00:00Z
---

## Current Focus

hypothesis: --color-status-duplicate is set to a grey muted value (215 16% 47%) instead of an orange/amber hue
test: Read globals.css line 35 and cross-reference badge.tsx bg-status-duplicate class
expecting: CSS custom property has wrong hue — confirmed
next_action: DIAGNOSED — report to caller

## Symptoms

expected: <Badge variant="duplicate"> renders with an orange/yellow (amber) color to visually signal a duplicate status
actual: renders grey — indistinguishable from muted/disabled UI elements
errors: none (no runtime error — purely a visual/semantic design token error)
reproduction: Render <Badge variant="duplicate">Duplicate</Badge> in any story or page
started: Phase 7 implementation — likely always wrong

## Eliminated

- hypothesis: Tailwind color mapping missing for status-duplicate
  evidence: tailwind.config.ts line 45 correctly maps `status.duplicate` to hsl(var(--color-status-duplicate))
  timestamp: 2026-07-08

- hypothesis: badge.tsx variant missing or misconfigured
  evidence: badge.tsx line 22-23 has `duplicate: "border-transparent bg-status-duplicate text-white shadow"` — class is correct
  timestamp: 2026-07-08

## Evidence

- timestamp: 2026-07-08
  checked: globals.css line 35
  found: --color-status-duplicate: 215 16% 47%; (hue=215, saturation=16%, lightness=47%)
  implication: HSL 215 16% 47% is a desaturated blue-grey — this IS the muted-foreground color (same as --color-muted-foreground on line 21), NOT an orange/amber

- timestamp: 2026-07-08
  checked: globals.css line 21
  found: --color-muted-foreground: 215 16% 47%; — identical value to --color-status-duplicate
  implication: The duplicate token was assigned the muted foreground color by mistake during token definition

- timestamp: 2026-07-08
  checked: globals.css line 60 (dark mode)
  found: --color-status-duplicate: 215 20% 65%; — also a blue-grey, still wrong
  implication: Both light and dark mode have the wrong hue for duplicate

- timestamp: 2026-07-08
  checked: tailwind.config.ts lines 42-47
  found: status colors mapped correctly — the pipeline from CSS var → Tailwind token → class is intact
  implication: The entire chain works; only the source CSS var value is wrong

## Resolution

root_cause: >
  globals.css line 35 defines --color-status-duplicate as HSL 215 16% 47%, which is the same
  muted grey used for --color-muted-foreground. The correct value should be an orange/amber hue
  (e.g. ~38 92% 50% for a civic amber). The token was given the wrong hue during Phase 7
  design token authoring — it was copied or conflated with the muted-foreground value instead
  of being set to a distinct warm color.

fix: >
  In globals.css :root, change line 35:
    --color-status-duplicate: 215 16% 47%;
  to an orange/amber value, e.g.:
    --color-status-duplicate: 38 92% 50%;   /* amber-500 equivalent */
  Also update the .dark block line 60:
    --color-status-duplicate: 215 20% 65%;
  to the dark-mode amber variant, e.g.:
    --color-status-duplicate: 38 90% 60%;

verification: ""
files_changed:
  - frontend/src/globals.css
