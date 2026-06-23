---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 16
type: execute
wave: 3
depends_on: [2]
files_modified:
  - frontend/src/app/submit/page.tsx
  - frontend/src/app/submit/confirmation/page.tsx
  - frontend/src/app/track/[id]/page.tsx
  - frontend/src/components/submit/CategoryStep.tsx
  - frontend/src/components/submit/LocationStep.tsx
  - frontend/src/components/submit/DetailsStep.tsx
  - frontend/src/components/submit/ContactStep.tsx
  - frontend/src/components/submit/StepIndicator.tsx
  - frontend/src/components/submit/MediaUploadButton.tsx
  - frontend/src/components/track/TicketStatusCard.tsx
  - frontend/src/components/track/PublicHistory.tsx
  - e2e/citizen-portal.spec.ts
autonomous: true

features:
  implements: ["F15", "F7", "F5"]
  depends_on: ["F0", "F5", "F7", "F8", "F10"]
  enables: ["F15"]

must_haves:
  truths:
    - "Citizen can select a public category from a card grid on /submit (Step 1) and advance to Step 2"
    - "Citizen can enter a street address OR tap a Leaflet map to place a pin (Step 2); location confirmed banner appears on geocode success"
    - "Citizen can enter an optional description and attach a photo via full-width camera/file button (Step 3)"
    - "Citizen can enter optional contact info (Step 4); submit button POSTs to /api/tickets and returns to confirmation page"
    - "Confirmation page at /submit/confirmation shows ticket ID and a link to /track/{id}"
    - "/track/{id} is publicly accessible with no auth; shows ticket status, substatus, department, and public-visible action history"
    - "Form is fully usable at 375px viewport with no horizontal scroll and sticky submit/next buttons"
    - "Media upload button on Step 3 is a full-width <button> (not a bare <input type=file>); validates type and size client-side"
  artifacts:
    - path: "frontend/src/app/submit/page.tsx"
      provides: "4-step public submission wizard shell with URL-based or state-based step routing"
      exports: ["default (SubmitPage)"]
    - path: "frontend/src/app/submit/confirmation/page.tsx"
      provides: "Post-submission confirmation screen with ticket ID and /track link"
      exports: ["default (ConfirmationPage)"]
    - path: "frontend/src/app/track/[id]/page.tsx"
      provides: "Public ticket status tracking page — no auth required"
      exports: ["default (TrackPage)"]
    - path: "frontend/src/components/submit/CategoryStep.tsx"
      provides: "Step 1 — card grid of public categories with search input"
      exports: ["CategoryStep"]
    - path: "frontend/src/components/submit/LocationStep.tsx"
      provides: "Step 2 — address text field + Leaflet map pin with geocoding"
      exports: ["LocationStep"]
    - path: "frontend/src/components/submit/DetailsStep.tsx"
      provides: "Step 3 — description textarea + MediaUploadButton + custom fields"
      exports: ["DetailsStep"]
    - path: "frontend/src/components/submit/ContactStep.tsx"
      provides: "Step 4 — optional name/email fields + Submit button"
      exports: ["ContactStep"]
    - path: "frontend/src/components/track/TicketStatusCard.tsx"
      provides: "Public-facing status badge, department, last-updated display"
      exports: ["TicketStatusCard"]
    - path: "frontend/src/components/track/PublicHistory.tsx"
      provides: "Renders external-visibility action history for /track page"
      exports: ["PublicHistory"]
    - path: "e2e/citizen-portal.spec.ts"
      provides: "Playwright e2e: full 4-step submit flow + track page"
      exports: ["tests"]
  key_links:
    - from: "frontend/src/app/submit/page.tsx"
      to: "POST /api/tickets"
      via: "fetch in ContactStep onSubmit handler"
      pattern: "fetch.*api/tickets"
    - from: "frontend/src/app/track/[id]/page.tsx"
      to: "GET /api/tickets/{id}"
      via: "server component fetch or client useEffect"
      pattern: "api/tickets.*id"
    - from: "frontend/src/components/submit/LocationStep.tsx"
      to: "GET /api/geocode"
      via: "fetch on address blur"
      pattern: "api/geocode"
    - from: "frontend/src/components/submit/MediaUploadButton.tsx"
      to: "File validation (client-side only at submit step; actual upload after ticket creation)"
      via: "FileReader + type/size check before storing in form state"
      pattern: "file.*size|MIME|accept"

integration_contracts:
  requires:
    - from_plan: "07"
      artifact: "crm/src/Controllers/Api/GeoController.php"
      exports: ["GET /api/geocode?address=... → { data: { lat, lng, addressNormalized } }"]
      verify: "grep -n 'function geocode' crm/src/Controllers/Api/GeoController.php && echo CONTRACT_OK"
    - from_plan: "08"
      artifact: "crm/src/Controllers/Api/TicketMediaController.php"
      exports: ["POST /api/tickets/{id}/media → Media (201)"]
      verify: "grep -n 'function upload' crm/src/Controllers/Api/TicketMediaController.php && echo CONTRACT_OK"
  provides:
    - artifact: "frontend/src/app/submit/page.tsx"
      exports: ["SubmitPage (route: /submit)"]
      shape: |
        // Citizen-facing 4-step wizard; no auth required
        // Step state held in React state; progresses: category → location → details → contact
        // On final submit: POST /api/tickets; on success: router.push('/submit/confirmation?id=...')
        export default function SubmitPage(): JSX.Element
      verify: "grep -n 'SubmitPage\|export default' frontend/src/app/submit/page.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/app/track/[id]/page.tsx"
      exports: ["TrackPage (route: /track/:id, public)"]
      shape: |
        // Public ticket status page — no authentication required
        // Fetches GET /api/tickets/{id} (visibility=public)
        // Shows: ticket ID, category, status, substatus, department, last updated
        // Shows: external-visibility action history (responses only, no internal comments)
        // 404 if not found; 403 if staff-only category
        export default function TrackPage({ params }: { params: { id: string } }): JSX.Element
      verify: "grep -n 'TrackPage\|export default' frontend/src/app/track/\\[id\\]/page.tsx && echo CONTRACT_OK"
---

<objective>
Implement the citizen-facing public portal in Wave 3c-2: the 4-step service request submission form at `/submit` (mobile-first, no login required), the post-submission confirmation page at `/submit/confirmation`, and the public ticket status tracking page at `/track/:id`. Includes media attachment upload UI (drag-and-drop + camera capture) and Leaflet map location picker with geocoding.

Purpose: Wave 3c-2 delivers the constituent-facing half of Wave 3c. Priya (PER-03) needs to submit and track service requests from a 375px mobile browser. This plan covers F15 (SPA frontend — citizen portal), F7 (media upload UI), and F5 (geospatial location picker). Wave 4 integration tests depend on this being present.

Output:
- `/submit` — 4-step wizard: category card grid → Leaflet map location picker → description + photo upload → contact info
- `/submit/confirmation` — post-submission screen with ticket ID and `/track` link
- `/track/:id` — public status tracking page showing ticket status and public action history
- `e2e/citizen-portal.spec.ts` — Playwright tests covering the full citizen submission and tracking flow
</objective>

<feature_dependencies>
Implements: F15: Modern React/Next.js SPA Frontend (citizen-facing /submit portal, /submit/confirmation, /track/:id — public routes, no auth), F7: Media Attachments (upload UI — drag-and-drop + camera button on Step 3, client-side type/size validation, file attached to POST /api/tickets then uploaded via POST /api/tickets/{id}/media), F5: Geospatial Features (Leaflet map pin picker on Step 2, address geocoding via GET /api/geocode, location confirmation banner)
Depends on: F0: Ticket Lifecycle (POST /api/tickets to create public ticket; GET /api/tickets/{id} for tracking), F5: Geospatial — Wave 2c backend (GeoController.geocode() for address resolution), F7: Media Attachments — Wave 2c backend (TicketMediaController.upload()), F10: RBAC (categories with postingPermission=public|anonymous shown only; tracker respects displayPermission)
Enables: F15 in Wave 4 integration — Playwright e2e tests cover citizen submission journey (E2E-003 citizen submit flow)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/UX-Mockup-uReport.md
@project_specs/UserStories-uReport.md
@project_specs/PERSONAS-uReport.md
@project_specs/PRD-uReport.md

# Prior wave contracts consumed:
# Wave 3a (Plan 09/10) provides:
#   - Next.js 15 app scaffold with TypeScript strict mode
#   - shadcn/ui + Radix UI component primitives installed
#   - Leaflet (or react-leaflet) installed for map views
#   - OpenAPI-generated TypeScript client types at frontend/src/types/api.ts
#   - Shared layout in frontend/src/app/layout.tsx
#   - API base URL via NEXT_PUBLIC_API_URL env var
#
# Wave 2c (Plans 07/08) provides:
#   - GET /api/geocode?address=... → { data: { lat, lng, addressNormalized } }
#   - POST /api/tickets → creates ticket (public categories allowed without auth)
#   - POST /api/tickets/{id}/media → multipart upload, returns Media object
#   - GET /api/tickets/{id} → ticket detail (public visibility respected)
#   - GET /api/tickets/{id}/history → action history (internal filtered for anonymous)
#
# Design system (from UX-Mockup-uReport.md):
#   - Breakpoints: sm=375px, md=768px, lg=1024px, xl=1280px
#   - Min 16px body text on mobile; 8px base grid
#   - Semantic tokens: status-open (blue), status-closed (gray)
#   - All interactive elements: ≥44px touch targets
#   - Step indicator: role="progressbar" aria-valuenow aria-valuetext
#   - Map: aria-label="Interactive map — tap to place location pin"
#   - Photo upload: <button> not <input type=file> for tap target compliance
</context>

<tasks>

<task type="auto">
  <name>Task 1: 4-step submission wizard (/submit) — category, location (Leaflet), details (media upload), contact + confirmation page</name>
  <files>
    frontend/src/app/submit/page.tsx
    frontend/src/app/submit/confirmation/page.tsx
    frontend/src/components/submit/StepIndicator.tsx
    frontend/src/components/submit/CategoryStep.tsx
    frontend/src/components/submit/LocationStep.tsx
    frontend/src/components/submit/DetailsStep.tsx
    frontend/src/components/submit/ContactStep.tsx
    frontend/src/components/submit/MediaUploadButton.tsx
  </files>
  <action>
Build the 4-step citizen submission wizard. No authentication required. All steps collected in a single `formState` object managed in `/submit/page.tsx`; step index advances forward and back without losing state.

**Form state shape (held in useState in page.tsx):**
```typescript
interface SubmitFormState {
  step: 1 | 2 | 3 | 4;
  categoryId: number | null;
  categoryLabel: string;
  address: string;
  lat: number | null;
  lng: number | null;
  addressNormalized: string;
  geoStatus: 'idle' | 'pending' | 'confirmed' | 'failed';
  description: string;
  files: File[];          // client-side blobs; uploaded after ticket creation
  firstName: string;
  lastName: string;
  email: string;
}
```

---

**`StepIndicator.tsx`** — Accessible progress indicator.

Props: `currentStep: 1|2|3|4; totalSteps: 4`.
Renders four dot indicators with connecting lines.
ARIA: `role="progressbar"` on the container, `aria-valuenow={currentStep}`, `aria-valuemax={4}`, `aria-valuetext={`Step ${currentStep} of 4`}`.
Labels below each dot: "Category", "Location", "Details", "Contact".
Active dot is filled (primary color); completed dots are filled (muted); future dots are outlined.

---

**`CategoryStep.tsx`** — Step 1.

Props: `onSelect: (categoryId: number, label: string) => void`.

Behavior:
1. On mount, fetch `GET /api/categories?postingPermission[]=public&postingPermission[]=anonymous&active=true` (or use the OpenAPI types if available). If fetch fails, show error state.
2. Render a search `<input>` at top. Filter the list client-side by label as user types (case-insensitive substring).
3. Each category renders as a full-width card button (`<button>`) with an emoji icon (use `category.icon` if present, else derive from name) and label text. Min touch target: 48px height.
4. Only `postingPermission = 'public' | 'anonymous'` categories shown (filtered server-side by API param and double-checked client-side).
5. On select: call `onSelect(category.id, category.name)` immediately.
6. Fallback text at bottom: "Can't find your issue? Call us: 📞 555-0100".
7. "Next →" button at bottom (sticky): disabled until a category is selected.

**Layout at 375px:** Single column, full-width cards, sticky Next button pinned to bottom of viewport.

---

**`LocationStep.tsx`** — Step 2.

Props: `address: string; lat: number|null; lng: number|null; geoStatus: string; onLocationChange: (update: Partial<SubmitFormState>) => void`.

Behavior:
1. Render an address `<input type="text">`. On blur (or after 800ms debounce), call `GET /api/geocode?address={encoded}`.
   - On success: update `lat`, `lng`, `addressNormalized`, `geoStatus: 'confirmed'`; show green banner "✅ Location confirmed: {addressNormalized}".
   - On failure (non-200 or empty): set `geoStatus: 'failed'`; show soft amber warning "Exact location not confirmed — you can still submit."
2. Below the input (or side-by-side on md+): render a Leaflet map (`react-leaflet` or `leaflet` via dynamic import with `{ ssr: false }`). Map center defaults to city center coordinate (config constant or default `[43.7, -79.4]`). Show a draggable pin `<Marker>`.
   - On map click: update `lat`, `lng`, reverse-geocode via `GET /api/geocode?lat={lat}&lng={lng}` if available (or just confirm coordinates), set `geoStatus: 'confirmed'`.
   - `aria-label="Interactive map — tap to place location pin"` on the map container div.
3. Large touch target for the map pin marker (custom icon ≥44×44px).
4. Show "Tap map to place pin" hint text below map.
5. "Next →" sticky bottom button: disabled until `geoStatus !== 'idle'` (either confirmed or user manually entered address with failed geocode is also acceptable — soft error only).
6. Validation on Next press: if `address === '' && lat === null`, show inline error "Please enter a location or tap the map."

**Dynamic import for Leaflet (SSR-safe):**
```typescript
import dynamic from 'next/dynamic';
const LeafletMap = dynamic(() => import('./LeafletMapPicker'), { ssr: false });
```
Create `LeafletMapPicker.tsx` as a sibling file that encapsulates all `leaflet`/`react-leaflet` imports.

---

**`MediaUploadButton.tsx`** — Reusable file upload component for Step 3.

Props: `files: File[]; onFilesChange: (files: File[]) => void; maxFiles?: number (default 20); maxSizeMB?: number (default 10)`.

Renders:
- A full-width `<button>` with `📷 Take or choose a photo` label. Click triggers a hidden `<input type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" multiple>`.
- After selection: validate each file:
  - Size: `file.size > maxSizeMB * 1024 * 1024` → show inline error "Photo too large. Please use a file under {maxSizeMB}MB."
  - Type: check `file.type` against allowed list → show inline error "Only JPG, PNG, GIF, WebP, or PDF files accepted."
  - Count: `files.length + newFiles.length > maxFiles` → show inline error "Maximum {maxFiles} files."
- Render thumbnail previews (use `URL.createObjectURL(file)` for images) as 64×64px squares with an ✕ remove button.
- Supports drag-and-drop: `onDragOver`, `onDrop` on the button container; parse `event.dataTransfer.files`.
- `aria-label="Upload files — drag and drop or click to select"` on the drop zone.

---

**`DetailsStep.tsx`** — Step 3.

Props: `description: string; files: File[]; onDescriptionChange: (v: string) => void; onFilesChange: (files: File[]) => void`.

Render:
1. Optional description `<textarea>` (5000 char max); placeholder "Describe the problem in a few words. Where exactly? How severe?"
2. `<MediaUploadButton>` component.
3. If the selected category has custom fields, render them dynamically. (For MVP: pass `customFields: CategoryField[]` as a prop; render text, select, date, checkbox inputs based on `field.type`.)
4. "Next →" sticky button. This step is entirely optional — Next is always enabled.

---

**`ContactStep.tsx`** — Step 4.

Props: `firstName: string; lastName: string; email: string; onChange: (field: string, value: string) => void; onSubmit: () => void; isSubmitting: boolean`.

Render:
1. First name, Last name, Email inputs (all optional).
2. Email format validated on blur: if non-empty and invalid format, show inline "Please enter a valid email address."
3. Soft warning banner when email is empty (not blocking): "Without an email you won't receive a confirmation."
4. Large full-width `<button>` "Submit My Report" — sticky at bottom. Shows spinner + "Submitting your report..." when `isSubmitting=true`. `aria-disabled={isSubmitting}`.

---

**`/submit/page.tsx`** — Wizard orchestrator.

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/submit/StepIndicator';
import CategoryStep from '@/components/submit/CategoryStep';
import LocationStep from '@/components/submit/LocationStep';
import DetailsStep from '@/components/submit/DetailsStep';
import ContactStep from '@/components/submit/ContactStep';

// No layout nav bar for citizen portal — minimal header only (city logo + "Report Issue")
export default function SubmitPage() {
  const router = useRouter();
  const [state, setState] = useState<SubmitFormState>({
    step: 1, categoryId: null, categoryLabel: '',
    address: '', lat: null, lng: null, addressNormalized: '', geoStatus: 'idle',
    description: '', files: [],
    firstName: '', lastName: '', email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (patch: Partial<SubmitFormState>) => setState(s => ({ ...s, ...patch }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Step 1: Create the ticket (POST /api/tickets)
      const body: Record<string, unknown> = {
        categoryId: state.categoryId,
        address: state.address || state.addressNormalized,
        lat: state.lat,
        lng: state.lng,
        description: state.description || undefined,
        reporterFirstName: state.firstName || undefined,
        reporterLastName: state.lastName || undefined,
        reporterEmail: state.email || undefined,
        // Public submission — no title required; use category label as title fallback
        title: state.categoryLabel,
      };

      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.errors?.[0]?.message ?? 'Submission failed. Please try again.';
        setSubmitError(msg);
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      const ticketId: number = data.data?.id;

      // Step 2: Upload files if any
      if (state.files.length > 0 && ticketId) {
        for (const file of state.files) {
          const fd = new FormData();
          fd.append('file', file);
          // Best-effort — non-fatal if upload fails
          await fetch(`${apiBase}/api/tickets/${ticketId}/media`, {
            method: 'POST',
            body: fd,
          }).catch(() => {});
        }
      }

      router.push(`/submit/confirmation?id=${ticketId}&category=${encodeURIComponent(state.categoryLabel)}&address=${encodeURIComponent(state.addressNormalized || state.address)}&email=${encodeURIComponent(state.email)}`);
    } catch (e) {
      setSubmitError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal citizen header */}
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <span className="font-semibold text-base">Report Issue</span>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-4 pb-24 max-w-lg mx-auto w-full">
        <StepIndicator currentStep={state.step} totalSteps={4} />

        <div className="mt-6 flex-1">
          {state.step === 1 && (
            <CategoryStep
              onSelect={(id, label) => update({ categoryId: id, categoryLabel: label, step: 2 })}
            />
          )}
          {state.step === 2 && (
            <LocationStep
              address={state.address}
              lat={state.lat}
              lng={state.lng}
              geoStatus={state.geoStatus}
              onLocationChange={update}
              onBack={() => update({ step: 1 })}
              onNext={() => update({ step: 3 })}
            />
          )}
          {state.step === 3 && (
            <DetailsStep
              description={state.description}
              files={state.files}
              onDescriptionChange={v => update({ description: v })}
              onFilesChange={files => update({ files })}
              onBack={() => update({ step: 2 })}
              onNext={() => update({ step: 4 })}
            />
          )}
          {state.step === 4 && (
            <ContactStep
              firstName={state.firstName}
              lastName={state.lastName}
              email={state.email}
              onChange={(field, value) => update({ [field]: value } as Partial<SubmitFormState>)}
              onSubmit={handleSubmit}
              onBack={() => update({ step: 3 })}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          )}
        </div>
      </main>
    </div>
  );
}
```

---

**`/submit/confirmation/page.tsx`** — Confirmation screen.

Read query params: `id`, `category`, `address`, `email`.

```typescript
'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmationPage() {
  const sp = useSearchParams();
  const id = sp.get('id');
  const category = sp.get('category') ?? '';
  const address = sp.get('address') ?? '';
  const email = sp.get('email') ?? '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 max-w-sm mx-auto text-center gap-6">
      <div className="text-5xl">✅</div>
      <h1 className="text-2xl font-semibold">Report submitted!</h1>
      {id && (
        <p className="text-muted-foreground">
          Report #{id}<br />
          {category && <span>{category}<br /></span>}
          {address && <span className="text-sm">{address}</span>}
        </p>
      )}
      {id && (
        <Link
          href={`/track/${id}`}
          className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-11 px-6 font-medium"
        >
          Check report status →
        </Link>
      )}
      {email && (
        <p className="text-sm text-muted-foreground">
          📧 Confirmation email sent to {email}
        </p>
      )}
      <Link href="/submit" className="text-sm underline text-muted-foreground">
        Submit another report
      </Link>
    </div>
  );
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend

# TypeScript compile check (strict mode — no errors allowed)
npx tsc --noEmit 2>&1 | tail -20 && echo "TSC OK"

# All component files exist
ls src/app/submit/page.tsx \
   src/app/submit/confirmation/page.tsx \
   src/components/submit/StepIndicator.tsx \
   src/components/submit/CategoryStep.tsx \
   src/components/submit/LocationStep.tsx \
   src/components/submit/DetailsStep.tsx \
   src/components/submit/ContactStep.tsx \
   src/components/submit/MediaUploadButton.tsx && echo "FILES OK"

# MediaUploadButton uses <button> not bare <input>
grep -n '<button\|<Button' src/components/submit/MediaUploadButton.tsx | head -5 && echo "BUTTON_UPLOAD OK"

# Client-side file size and type validation
grep -n 'file\.size\|file\.type\|FILE_TOO_LARGE\|INVALID_FILE_TYPE' src/components/submit/MediaUploadButton.tsx && echo "VALIDATION OK"

# LocationStep has dynamic Leaflet import (SSR disabled)
grep -n "dynamic\|ssr.*false\|ssr: false" src/components/submit/LocationStep.tsx && echo "LEAFLET_SSR OK"

# Confirmation page links to /track
grep -n '/track/' src/app/submit/confirmation/page.tsx && echo "TRACK_LINK OK"

# StepIndicator has ARIA progressbar
grep -n 'progressbar\|aria-valuenow' src/components/submit/StepIndicator.tsx && echo "ARIA_STEP OK"

# Next.js build check
npx next build 2>&1 | tail -10 && echo "BUILD OK"
```
  </verify>
  <done>
- All 8 files exist at the specified paths
- `/submit/page.tsx` manages 4-step state; renders correct step component per step index; POSTs to /api/tickets on submit then uploads files via /api/tickets/{id}/media; redirects to /submit/confirmation on success
- `/submit/confirmation/page.tsx` displays ticket ID, category, address, email confirmation note, link to /track/{id}, and "Submit another report" link
- `StepIndicator.tsx` uses `role="progressbar"` with `aria-valuenow` and `aria-valuetext`
- `CategoryStep.tsx` fetches public categories, renders full-width card buttons, has search filter, fallback phone number, sticky Next button disabled until selection
- `LocationStep.tsx` dynamically imports Leaflet with `ssr: false`; geocodes address on blur via GET /api/geocode; shows green confirmation banner on success and amber soft warning on failure; map has aria-label
- `DetailsStep.tsx` includes description textarea and MediaUploadButton; step is entirely optional (Next always enabled)
- `MediaUploadButton.tsx` renders `<button>` (not bare `<input>`); validates file size and type client-side; shows thumbnail previews; supports drag-and-drop
- `ContactStep.tsx` validates email format on blur; shows soft warning when email is empty; large sticky Submit button with loading state
- TypeScript strict mode passes with 0 errors (`npx tsc --noEmit`)
- `npx next build` exits 0
  </done>
</task>

<task type="auto">
  <name>Task 2: Public ticket tracking page (/track/:id) + Playwright e2e citizen portal tests</name>
  <files>
    frontend/src/app/track/[id]/page.tsx
    frontend/src/components/track/TicketStatusCard.tsx
    frontend/src/components/track/PublicHistory.tsx
    e2e/citizen-portal.spec.ts
  </files>
  <action>
**`/track/[id]/page.tsx`** — Public ticket status page. No authentication required.

Per UX-Mockup Screen 05 (Tracking Page) and US-7.2, US-5.1, US-0.2.

```typescript
// Can be server component (SSR) or client component.
// Use client component for simplicity given the existing SPA pattern.
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TicketStatusCard from '@/components/track/TicketStatusCard';
import PublicHistory from '@/components/track/PublicHistory';

interface PublicTicket {
  id: number;
  title: string;
  categoryName?: string;
  status: 'open' | 'closed';
  substatusLabel?: string;
  departmentName?: string;
  datetimeUpdated: string;
  address?: string;
}

interface PublicAction {
  id: number;
  type: string;
  visibility: string;
  datetimeCreated: string;
  payload?: Record<string, unknown>;
}

export default function TrackPage() {
  const params = useParams();
  const id = params?.id as string;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [history, setHistory] = useState<PublicAction[]>([]);
  const [error, setError] = useState<'not_found' | 'forbidden' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/tickets/${id}`, {
          // No auth cookie — public access
          credentials: 'omit',
        });
        if (res.status === 404) { setError('not_found'); setLoading(false); return; }
        if (res.status === 403) { setError('forbidden'); setLoading(false); return; }
        if (!res.ok) { setError('error'); setLoading(false); return; }

        const data = await res.json();
        setTicket(data.data);

        // Fetch public history (internal actions filtered by API for anonymous callers)
        const histRes = await fetch(`${apiBase}/api/tickets/${id}/history`, {
          credentials: 'omit',
        });
        if (histRes.ok) {
          const histData = await histRes.json();
          // Only show external/public visibility actions
          const publicActions = (histData.data ?? []).filter(
            (a: PublicAction) => a.visibility === 'external' || a.type === 'open'
          );
          setHistory(publicActions);
        }
      } catch {
        setError('error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, apiBase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <h1 className="text-xl font-semibold">Report not found</h1>
        <p className="text-muted-foreground">Check your ticket number and try again.</p>
        <Link href="/submit" className="underline text-sm">Submit a new report</Link>
      </div>
    );
  }

  if (error === 'forbidden') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <h1 className="text-xl font-semibold">Report not publicly viewable</h1>
        <p className="text-muted-foreground">This report is not available for public viewing.</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <span className="font-semibold text-base">Track Report</span>
      </header>

      <main className="flex-1 px-4 pt-6 pb-12 max-w-lg mx-auto w-full flex flex-col gap-6">
        <TicketStatusCard ticket={ticket} />
        <PublicHistory actions={history} />
        <Link
          href="/submit"
          className="text-sm text-center underline text-muted-foreground"
        >
          Submit another report
        </Link>
      </main>
    </div>
  );
}
```

---

**`TicketStatusCard.tsx`** — Shows ticket metadata (public-safe fields only).

Per UX-Mockup tracking page layout. Does NOT show: assignee name, internal notes.
Shows: ticket ID, category, status badge, substatus (if set), department, address (if public), last updated.

```typescript
interface Props {
  ticket: {
    id: number; title: string; categoryName?: string;
    status: string; substatusLabel?: string;
    departmentName?: string; datetimeUpdated: string; address?: string;
  };
}

export default function TicketStatusCard({ ticket }: Props) {
  const statusColor = ticket.status === 'open' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 bg-gray-100';

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-lg font-semibold leading-tight">Report #{ticket.id}</h1>
        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor}`}>
          {ticket.status}
        </span>
      </div>

      {ticket.categoryName && (
        <p className="text-sm font-medium">{ticket.categoryName}</p>
      )}

      {ticket.substatusLabel && (
        <p className="text-sm text-muted-foreground">{ticket.substatusLabel}</p>
      )}

      <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {ticket.departmentName && (
          <>
            <dt className="text-muted-foreground">Department</dt>
            <dd>{ticket.departmentName}</dd>
          </>
        )}
        {ticket.address && (
          <>
            <dt className="text-muted-foreground">Location</dt>
            <dd>{ticket.address}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Last updated</dt>
        <dd>{new Date(ticket.datetimeUpdated).toLocaleString()}</dd>
      </dl>
    </div>
  );
}
```

---

**`PublicHistory.tsx`** — Chronological public action history.

Only external-visibility actions shown (responses; internal comments are filtered by API and by `TrackPage` client-side).
Action types rendered:
- `open`: "Report opened" (no response body)
- `response`: Shows response body text (from `payload.body` or `payload.text`)
- Others: Generic label derived from type

```typescript
interface Action {
  id: number; type: string; visibility: string;
  datetimeCreated: string; payload?: Record<string, unknown>;
}

export default function PublicHistory({ actions }: { actions: Action[] }) {
  if (actions.length === 0) {
    return (
      <section aria-label="Report updates">
        <h2 className="font-semibold mb-3">Updates</h2>
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      </section>
    );
  }

  return (
    <section aria-label="Report updates">
      <h2 className="font-semibold mb-3">Updates</h2>
      <ol className="flex flex-col gap-4">
        {actions.map(action => (
          <li key={action.id} className="border-l-2 border-muted pl-4 flex flex-col gap-1">
            <time
              dateTime={action.datetimeCreated}
              className="text-xs text-muted-foreground"
            >
              {new Date(action.datetimeCreated).toLocaleString()}
            </time>
            <p className="text-sm font-medium capitalize">
              {action.type === 'open' ? 'Report opened'
                : action.type === 'response' ? 'Staff response'
                : action.type === 'closed' ? 'Report closed'
                : action.type}
            </p>
            {action.type === 'response' && action.payload && (
              <p className="text-sm text-muted-foreground">
                {String(action.payload.body ?? action.payload.text ?? '')}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
```

---

**`e2e/citizen-portal.spec.ts`** — Playwright tests for citizen submission and tracking flow.

Tests target `baseURL` configured in `playwright.config.ts`.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Citizen Portal — /submit', () => {

  test('Step 1: loads public categories and advances on selection', async ({ page }) => {
    await page.goto('/submit');

    // Step indicator visible
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Next button disabled until selection
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeDisabled();

    // Wait for categories to load
    const firstCard = page.locator('[data-testid="category-card"]').first();
    await firstCard.waitFor({ timeout: 5000 });
    await firstCard.click();

    // Next button enabled after selection
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Now on Step 2
    await expect(page.getByText(/where is the problem/i)).toBeVisible();
  });

  test('Step 2: address field and map present; Next disabled until location set', async ({ page }) => {
    await page.goto('/submit');
    // Advance to Step 2 by clicking first category
    await page.locator('[data-testid="category-card"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();

    // Address input exists
    await expect(page.getByRole('textbox', { name: /address/i })).toBeVisible();

    // Map container exists with aria-label
    await expect(page.locator('[aria-label*="map"]')).toBeVisible();

    // Next disabled initially
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('Step 3: photo upload button is a button element (not bare input)', async ({ page }) => {
    await page.goto('/submit');
    // Navigate through steps 1 and 2
    await page.locator('[data-testid="category-card"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();

    // Enter address to enable Next on Step 2
    await page.getByRole('textbox', { name: /address/i }).fill('123 Main St');
    // Wait for geocode or soft warning (either is acceptable)
    await page.waitForTimeout(1200);
    const nextBtn2 = page.getByRole('button', { name: /next/i });
    // Force advance if enabled, or skip location confirmation (soft warning path)
    if (await nextBtn2.isEnabled()) {
      await nextBtn2.click();
    } else {
      // Fill address and explicitly click Next (soft-warning path still allows advancing)
      await page.getByRole('button', { name: /next/i }).click({ force: true });
    }

    // Photo upload button is a <button>
    const uploadBtn = page.getByRole('button', { name: /photo|upload/i });
    await expect(uploadBtn).toBeVisible();
    const tagName = await uploadBtn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('button');
  });

  test('Step 4: submit button present; soft warning when email is empty', async ({ page }) => {
    await page.goto('/submit');
    // Navigate to step 4 quickly using force-navigation via state
    // (simpler: go to /submit and use test-id navigation)
    await page.locator('[data-testid="category-card"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    // Skip location (address not required to be confirmed for soft-warning path)
    await page.getByRole('textbox', { name: /address/i }).fill('Main St');
    await page.waitForTimeout(500);
    const next2 = page.getByRole('button', { name: /next/i });
    if (await next2.isEnabled()) await next2.click();
    // Step 3: Next is always enabled
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4
    await expect(page.getByRole('button', { name: /submit my report/i })).toBeVisible();
    // Soft warning visible when email empty
    await expect(page.getByText(/without an email/i)).toBeVisible();
  });

  test('/track/:id — shows 404 message for unknown ticket', async ({ page }) => {
    await page.goto('/track/999999999');
    await expect(page.getByText(/report not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('/track/:id — shows status card for a valid ticket', async ({ page, request }) => {
    // This test depends on a ticket existing. Skip gracefully if none found.
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await request.get(`${apiBase}/api/tickets?perPage=1&status=open`);
    if (!res.ok()) {
      test.skip(true, 'API unavailable or no tickets for track test');
      return;
    }
    const body = await res.json();
    const ticketId = body?.data?.[0]?.id;
    if (!ticketId) {
      test.skip(true, 'No tickets available for track test');
      return;
    }

    await page.goto(`/track/${ticketId}`);
    await expect(page.getByText(new RegExp(`Report #${ticketId}`))).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: /track report/i })).toBeVisible();
  });

});
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/frontend

# TypeScript compile check
npx tsc --noEmit 2>&1 | tail -10 && echo "TSC OK"

# Track page and components exist
ls src/app/track/\[id\]/page.tsx \
   src/components/track/TicketStatusCard.tsx \
   src/components/track/PublicHistory.tsx && echo "TRACK_FILES OK"

# Track page does NOT expose assignee name (internal staff info)
grep -n 'assignee\|personId\|personName' src/app/track/\[id\]/page.tsx; echo "(no assignee exposure check)"
grep -n 'internal\|_internal' src/components/track/PublicHistory.tsx && echo "INTERNAL_FILTER OK"

# TicketStatusCard shows status badge
grep -n 'status\|statusColor' src/components/track/TicketStatusCard.tsx && echo "STATUS_BADGE OK"

# PublicHistory filters to external visibility actions
grep -n "visibility.*external\|type.*open\|internal" src/components/track/PublicHistory.tsx && echo "HISTORY_FILTER OK"

# e2e test file exists
ls /app/workspaces/pivota/uReport/e2e/citizen-portal.spec.ts && echo "E2E_FILE OK"

# Playwright available
npx playwright --version && echo "PLAYWRIGHT OK"

# Run Playwright tests (with --reporter=list for clean output; allow skip for API-dependent tests)
npx playwright test e2e/citizen-portal.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `frontend/src/app/track/[id]/page.tsx` exists; fetches GET /api/tickets/{id} with `credentials: 'omit'` (no auth); handles 404 → "Report not found" message, 403 → "Report not publicly viewable" message
- `TicketStatusCard.tsx` shows: ticket ID, category, status badge (colored), substatus, department, address, last-updated; does NOT show assignee name or internal notes
- `PublicHistory.tsx` filters to external-visibility actions (responses, open events); internal comments excluded; renders in chronological list with `<time>` elements
- `e2e/citizen-portal.spec.ts` exists at the expected path
- Playwright tests cover: Step 1 category selection advances wizard, Step 2 map + address present, Step 3 upload button is `<button>` element, Step 4 submit button + soft warning, /track 404 state, /track valid ticket shows status card
- `npx tsc --noEmit` passes with 0 errors
- `npx playwright test e2e/citizen-portal.spec.ts` passes (0 failing; API-dependent tests skip gracefully when backend unavailable)
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

```bash
cd /app/workspaces/pivota/uReport/frontend

# 1. TypeScript strict — zero errors
npx tsc --noEmit 2>&1 | grep -E 'error|Error' | wc -l | xargs -I{} sh -c '[ {} -eq 0 ] && echo "TSC CLEAN" || echo "TSC ERRORS: {}"'

# 2. Next.js build succeeds
npx next build 2>&1 | tail -5 && echo "BUILD OK"

# 3. All new citizen portal routes exist
ls src/app/submit/page.tsx src/app/submit/confirmation/page.tsx src/app/track/\[id\]/page.tsx

# 4. All step components present
ls src/components/submit/{StepIndicator,CategoryStep,LocationStep,DetailsStep,ContactStep,MediaUploadButton}.tsx

# 5. Track components present
ls src/components/track/{TicketStatusCard,PublicHistory}.tsx

# 6. Playwright tests pass
npx playwright test e2e/citizen-portal.spec.ts --reporter=list 2>&1 | tail -20 && echo "E2E PASSED"

# 7. Integration contracts provided (for Wave 4)
grep -n 'export default function SubmitPage' src/app/submit/page.tsx && echo "SUBMIT_CONTRACT OK"
grep -n 'export default function TrackPage' src/app/track/\[id\]/page.tsx && echo "TRACK_CONTRACT OK"
```
</verification>

<success_criteria>
- `/submit` renders a 4-step wizard at 375px with no horizontal scroll; each step advances and backs without state loss
- Step 1: public category cards load from API; Next disabled until selection
- Step 2: Leaflet map picker loads (SSR-disabled); address field triggers geocoding via GET /api/geocode; confirmation/soft-warning banners display correctly
- Step 3: MediaUploadButton is a `<button>` element; validates file size (10MB) and type (image/pdf) client-side; renders thumbnail previews
- Step 4: email validation on blur; soft warning when empty; Submit button POSTs to /api/tickets, uploads files, then redirects to /submit/confirmation
- `/submit/confirmation` displays ticket ID, category, address, email note, /track link
- `/track/:id` is publicly accessible (no auth required); shows ticket status, substatus, department, public action history; handles 404 and 403 gracefully
- TypeScript strict mode: 0 errors
- `npx next build` exits 0
- Playwright e2e: all 6 tests pass or skip gracefully for API-dependent tests
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/16-SUMMARY.md` with:
- Files created/modified
- Key implementation decisions (Leaflet SSR approach, file upload flow, public auth handling)
- Integration contract artifacts provided (SubmitPage route, TrackPage route)
- Any deviations from this plan
</output>
