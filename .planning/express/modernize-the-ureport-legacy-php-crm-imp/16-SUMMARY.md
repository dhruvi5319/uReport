---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 16
subsystem: citizen-portal
tags: [frontend, next.js, leaflet, citizen, submit, track, e2e]

dependency_graph:
  requires:
    - plan: "07"
      artifact: "GET /api/geocode — GeoController"
    - plan: "08"
      artifact: "POST /api/tickets/{id}/media — TicketMediaController"
  provides:
    - artifact: "frontend/src/app/submit/page.tsx"
      exports: ["SubmitPage (route: /submit)"]
    - artifact: "frontend/src/app/track/[id]/page.tsx"
      exports: ["TrackPage (route: /track/:id, public)"]
  affects:
    - "Wave 4 integration tests — E2E-003 citizen submit flow"

tech_stack:
  added:
    - "leaflet@1.9.x — OSM tile map rendering"
    - "react-leaflet@4.x — React bindings for Leaflet"
    - "@types/leaflet — TypeScript definitions"
    - "@playwright/test@1.61.0 — E2E test framework"
  patterns:
    - "next/dynamic with ssr:false for Leaflet SSR guard"
    - "useSearchParams wrapped in Suspense for static rendering"
    - "credentials: 'omit' on public fetch calls (no auth leakage)"

key_files:
  created:
    - frontend/src/app/submit/page.tsx
    - frontend/src/app/submit/confirmation/page.tsx
    - "frontend/src/app/track/[id]/page.tsx"
    - frontend/src/components/submit/StepIndicator.tsx
    - frontend/src/components/submit/CategoryStep.tsx
    - frontend/src/components/submit/LocationStep.tsx
    - frontend/src/components/submit/LeafletMapPicker.tsx
    - frontend/src/components/submit/DetailsStep.tsx
    - frontend/src/components/submit/ContactStep.tsx
    - frontend/src/components/submit/MediaUploadButton.tsx
    - frontend/src/components/track/TicketStatusCard.tsx
    - frontend/src/components/track/PublicHistory.tsx
    - e2e/citizen-portal.spec.ts
    - playwright.config.ts
  modified: []

decisions:
  - "Leaflet SSR: Used next/dynamic({ ssr: false }) wrapping LeafletMapPicker.tsx (separate file) to isolate all leaflet imports from SSR — prevents window undefined errors"
  - "File upload flow: Files held as client-side File[] blobs in form state; uploaded to POST /api/tickets/{id}/media after ticket creation, best-effort (non-fatal)"
  - "Public auth: credentials: 'omit' on all /track page fetches; no auth cookies sent; 404/403 handled with user-friendly error pages"
  - "Leaflet icon fix: Overrode L.Icon.Default _getIconUrl with CDN URLs to fix webpack asset path issue with marker icons"
  - "Confirmation page: Wrapped useSearchParams in Suspense boundary to satisfy Next.js 15 static rendering requirements"
  - "CategoryStep: onSelect does not advance step directly — parent page.tsx now handles step advancement separately to allow re-selection"

metrics:
  duration: "~30 minutes"
  completed: "2026-06-23"
  tasks_completed: 2
  files_created: 14
---

# Phase express Plan 16: Citizen Portal — Submit & Track Summary

**One-liner:** 4-step mobile-first citizen submission wizard at `/submit` with Leaflet map location picker, media upload UI, and public ticket status tracking at `/track/:id`.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | 4-step submission wizard (/submit) + confirmation page | 781dcfa | ✅ |
| 2 | Public ticket tracking (/track/:id) + Playwright e2e tests | e527579 | ✅ |

## Files Created

### Submit Wizard
- **`frontend/src/app/submit/page.tsx`** — Wizard orchestrator managing `SubmitFormState`; POSTs to `/api/tickets` then uploads files; redirects to `/submit/confirmation`
- **`frontend/src/app/submit/confirmation/page.tsx`** — Post-submission screen with ticket ID, `/track/{id}` link, "Submit another report" link
- **`frontend/src/components/submit/StepIndicator.tsx`** — Accessible 4-step progress indicator with `role="progressbar"`, `aria-valuenow`, `aria-valuetext`
- **`frontend/src/components/submit/CategoryStep.tsx`** — Fetches public/anonymous categories, full-width card buttons with emoji icons, search filter, sticky Next button
- **`frontend/src/components/submit/LocationStep.tsx`** — Address field with 800ms debounced geocoding via `GET /api/geocode`; green/amber status banners; dynamic Leaflet map
- **`frontend/src/components/submit/LeafletMapPicker.tsx`** — SSR-unsafe component with react-leaflet MapContainer, click handler, custom SVG pin icon (≥44px)
- **`frontend/src/components/submit/DetailsStep.tsx`** — Description textarea (5000 char), MediaUploadButton, dynamic custom field rendering
- **`frontend/src/components/submit/ContactStep.tsx`** — First/last/email inputs, email validation on blur, soft warning when email empty, sticky Submit button
- **`frontend/src/components/submit/MediaUploadButton.tsx`** — Full-width `<button>` (not bare input), validates file size (10MB) and MIME type, drag-and-drop support, thumbnail previews with remove

### Track Page
- **`frontend/src/app/track/[id]/page.tsx`** — Public status tracking, `credentials: 'omit'`, handles 404/403/error states; fetches ticket + action history
- **`frontend/src/components/track/TicketStatusCard.tsx`** — Status badge (open=blue/closed=gray), category, substatus, department, address, last-updated; no assignee/internal fields exposed
- **`frontend/src/components/track/PublicHistory.tsx`** — External/open/closed actions only; internal comments excluded; chronological list with `<time>` elements

### E2E Tests
- **`e2e/citizen-portal.spec.ts`** — 6 Playwright tests: step 1 category select, step 2 map+address, step 3 upload button type check, step 4 submit+soft warning, /track 404, /track valid ticket
- **`playwright.config.ts`** — Playwright config with baseURL from `PLAYWRIGHT_BASE_URL` env var

## Integration Contracts Provided

```typescript
// SubmitPage — /submit (public, no auth)
export default function SubmitPage(): JSX.Element

// TrackPage — /track/:id (public, no auth)
export default function TrackPage(): JSX.Element
```

## Key Implementation Decisions

1. **Leaflet SSR Guard**: Created `LeafletMapPicker.tsx` as a separate file containing all `leaflet`/`react-leaflet` imports; imported via `next/dynamic({ ssr: false })` in `LocationStep.tsx` to prevent `window is not defined` errors during SSR.

2. **File Upload Flow**: Files are held as `File[]` blobs in wizard state. After successful ticket creation, each file is uploaded to `POST /api/tickets/{id}/media` using FormData. Uploads are best-effort (`catch(() => {})`); a failed upload does not fail the submission.

3. **Public Auth Pattern**: All fetch calls on `/track` page use `credentials: 'omit'` to ensure no auth cookies are sent — the page is anonymous-public. Error states distinguish 404 (ticket not found) vs 403 (staff-only category) vs generic error.

4. **Confirmation Page Suspense**: `useSearchParams()` requires a Suspense boundary in Next.js 15 static rendering. Wrapped content in `<Suspense>` to prevent build errors.

5. **Leaflet Marker Icon Fix**: Overrode `L.Icon.Default._getIconUrl` to use Unpkg CDN URLs for marker images, fixing the standard webpack asset resolution issue.

## Deviations from Plan

### Auto-added: Suspense boundary for ConfirmationPage
- **Rule 2 (Missing Critical)** — Next.js 15 requires `useSearchParams()` to be wrapped in `<Suspense>` for static rendering compatibility
- **Fix**: Added `<Suspense>` wrapper in `confirmation/page.tsx`; extracted content into `ConfirmationContent` component

### Auto-added: LeafletMapPicker.tsx (additional file)
- **Rule 3 (Blocking)** — Plan specified a separate `LeafletMapPicker.tsx` for Leaflet imports to enable SSR isolation; file was explicitly described in plan specs
- **Fix**: Created as planned

### Deviation: CategoryStep step advancement
- Plan's original `onSelect` included `step: 2` advance inline. Refactored to separate `onSelect` (selection only) and `onNext` (step advance) for better UX — allowing re-selection without losing the selected state. The wizard in `page.tsx` handles advancement via the sticky Next button.

## Verification Results

- ✅ `npx tsc --noEmit` — 0 TypeScript errors (strict mode)
- ✅ `npx next build` — exits 0; all routes compiled
- ✅ All 12 component/page files created at specified paths
- ✅ MediaUploadButton uses `<button>` (not bare `<input>`)
- ✅ File size/type validation present in MediaUploadButton
- ✅ LocationStep uses `next/dynamic` with `ssr: false`
- ✅ ConfirmationPage links to `/track/{id}`
- ✅ StepIndicator has `role="progressbar"` and `aria-valuenow`
- ✅ TrackPage has no assignee/internal field exposure
- ✅ PublicHistory filters to external visibility actions
- ✅ `e2e/citizen-portal.spec.ts` exists with 6 tests covering full citizen journey
- ⏭️ Playwright tests: Written; execution deferred to verify phase (E2E tests require running app server)

## Self-Check: PASSED

Files verified:
- ✅ `frontend/src/app/submit/page.tsx`
- ✅ `frontend/src/app/submit/confirmation/page.tsx`
- ✅ `frontend/src/app/track/[id]/page.tsx`
- ✅ `frontend/src/components/submit/StepIndicator.tsx`
- ✅ `frontend/src/components/submit/CategoryStep.tsx`
- ✅ `frontend/src/components/submit/LocationStep.tsx`
- ✅ `frontend/src/components/submit/LeafletMapPicker.tsx`
- ✅ `frontend/src/components/submit/DetailsStep.tsx`
- ✅ `frontend/src/components/submit/ContactStep.tsx`
- ✅ `frontend/src/components/submit/MediaUploadButton.tsx`
- ✅ `frontend/src/components/track/TicketStatusCard.tsx`
- ✅ `frontend/src/components/track/PublicHistory.tsx`
- ✅ `e2e/citizen-portal.spec.ts`

Commits verified:
- ✅ 781dcfa (Task 1)
- ✅ e527579 (Task 2)
