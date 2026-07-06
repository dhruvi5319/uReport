# Screen-07: Public Case Submission Wizard

**Route:** `/submit`
**Purpose:** Mobile-first 5-step wizard for anonymous public submission; no account required
**User Stories:** US-2.1, US-2.2, US-2.3, US-2.4
**Journey:** JRN-04.1 — Mobile Service Request Submission

---

## Overall Wizard Shell

```
┌────────────────────────────────────────────────────────────────┐
│  [City Logo]  Report a 311 Issue                               │
│  ──────────────────────────────────────────────────────────    │
│  PROGRESS INDICATOR                                            │
│  [✓]──[✓]──[●]──[○]──[○]   Step 3 of 5: Location             │
│  (completed=checkmark; current=filled; future=empty circle)    │
│  ──────────────────────────────────────────────────────────    │
│  [Step Content Area — animated between steps]                  │
│  ──────────────────────────────────────────────────────────    │
│  [← Back]                               [Next →] or [Submit]  │
└────────────────────────────────────────────────────────────────┘
```

No top navbar (public route — no auth). No sidebar. Clean, focused layout.

**Navigation buttons**: Always at the bottom. "Back" always enabled. "Next"/"Submit" enables only when current step validates.

---

## Step 1 — Contact Info (Optional)

```
┌────────────────────────────────────────────────────────────────┐
│  Contact Information                               (optional)  │
│  ──────────────────────────────────────────────────────────    │
│  Help us follow up if we need more details. Not required.      │
│                                                                │
│  First Name                     Last Name                      │
│  [________________]             [________________]             │
│                                                                │
│  Email address  (optional — for status updates)                │
│  [__________________________________]                          │
│                                                                │
│  Phone number  (optional)                                      │
│  [__________________________________]                          │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│  [← Back]                                        [Next →]     │
│                                       OR                       │
│                                    [Skip →]  (prominent link)  │
└────────────────────────────────────────────────────────────────┘
```

**Mobile (375 px):**
- All fields stack single-column
- Labels above inputs (not inside — better mobile accessibility)
- "Skip" is as prominent as "Next" — zero friction for anonymous flow
- Email validates on blur (not on Next click)

---

## Step 2 — Category Selection

```
┌────────────────────────────────────────────────────────────────┐
│  What type of issue are you reporting?                         │
│  ──────────────────────────────────────────────────────────    │
│                                                                │
│  CATEGORY GROUP TILES (tap to drill down):                     │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  🛣️           │  │  🌳           │  │  💡           │           │
│  │ Roads &     │  │ Parks &     │  │ Lights &    │           │
│  │ Sidewalks   │  │ Greenspace  │  │ Electric    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  🏗️           │  │  🚌           │  │  ♻️           │           │
│  │ Buildings   │  │ Transport   │  │ Sanitation  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│  [← Back]                                        [Next →]     │
└────────────────────────────────────────────────────────────────┘
```

**After group tap (drill-down):**

```
┌────────────────────────────────────────────────────────────────┐
│  ← Roads & Sidewalks                                           │
│  ──────────────────────────────────────────────────────────    │
│  Select the specific issue:                                    │
│                                                                │
│  ● Pothole                                                     │
│  ○ Cracked Sidewalk                                            │
│  ○ Missing Street Sign                                         │
│  ○ Road Damage — Emergency                                     │
│  ○ Other / Unknown                                             │
│                                                                │
│  Description (when "Pothole" selected):                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Report a pothole or road surface damage. Provide        │  │
│  │ exact location for faster dispatch.                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│  [← Back]                                        [Next →]     │
└────────────────────────────────────────────────────────────────┘
```

- Only categories with `postingPermissionLevel = 'anonymous'` are shown
- Category description shown as informational callout (not an input)
- On mobile: radio list with large tap targets (≥44 px each)

---

## Step 3 — Location (Map Pin-Drop)

```
┌────────────────────────────────────────────────────────────────┐
│  Where is the issue?                                           │
│  ──────────────────────────────────────────────────────────    │
│                                                                │
│  Address (start typing or tap the map)                        │
│  [Cedar & 7th Avenue, Springfield ✓               ×]          │
│  (autocomplete suggestions dropdown below)                     │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  [Interactive map — Mapbox/Leaflet]                      │ │
│  │                                                          │ │
│  │         📍 (draggable pin at Cedar & 7th)                │ │
│  │                                                          │ │
│  │  Tap the map to place or move the pin                    │ │
│  │  (helper text — hidden after first interaction)          │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Tip: Tap where the issue is on the map. We'll figure out     │
│  the address automatically.                                    │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│  [← Back]                                        [Next →]     │
│  (Next disabled until address or pin-drop present)            │
└────────────────────────────────────────────────────────────────┘
```

**Map height**: 250 px on mobile, 350 px on desktop. Map fills full width.

**Pin-drop interactions**:
- First tap → pin appears at tapped location
- Drag pin → reverse-geocode fires after drag ends (500 ms debounce)
- Address input → autocomplete → select → pin jumps to geocoded location
- Both interactions update the same form state fields (lat, lon, address)

**Geocoding failure**:
```
⚠ Address lookup failed. You can still continue with the map pin.
[address field remains editable for manual entry]
```

---

## Step 4 — Description + Photos

```
┌────────────────────────────────────────────────────────────────┐
│  Describe the issue and add photos                             │
│  ──────────────────────────────────────────────────────────    │
│                                                                │
│  Description *                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Large pothole at the corner of Cedar and 7th.            │ │
│  │ About 18 inches wide and 4 inches deep. It's been        │ │
│  │ damaging vehicles.                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│  47 / 500 characters  (min 10 required)                        │
│                                                                │
│  Photos  (optional — up to 10, max 10 MB each)                 │
│                                                                │
│  MOBILE:                                                       │
│  [📷 Add Photos from Camera or Gallery]  (full-width button)   │
│                                                                │
│  DESKTOP (same area):                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ⬆ Drag & drop photos here, or click to select           │ │
│  │  JPEG, PNG, GIF · Max 10 MB each · Up to 10 files        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  THUMBNAIL PREVIEW (after selection):                          │
│  ┌──────┐ ┌──────┐                                            │
│  │ img1 │ │ img2 │   (150×150 thumbnails; tap/click for ×)   │
│  └──────┘ └──────┘                                            │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│  [← Back]                                        [Next →]     │
│  (Next disabled until description ≥ 10 chars)                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Step 5 — Review & Submit

```
┌────────────────────────────────────────────────────────────────┐
│  Review your report                                            │
│  ──────────────────────────────────────────────────────────    │
│                                                                │
│  Contact Info                                           [Edit] │
│  priya@email.com  |  (none provided for name/phone)            │
│                                                                │
│  Category                                               [Edit] │
│  Roads & Sidewalks > Pothole                                   │
│                                                                │
│  Location                                               [Edit] │
│  Cedar & 7th Avenue, Springfield                               │
│  (map thumbnail — static, 100% width, h-24)                    │
│                                                                │
│  Description                                            [Edit] │
│  "Large pothole at the corner of Cedar and 7th..."             │
│                                                                │
│  Photos                                                 [Edit] │
│  [thumb 1]  [thumb 2]                                          │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│  ⓘ If you provided your email, you'll receive a confirmation   │
│    message and updates on your case.                           │
│                                                                │
│  [← Back]                                       [Submit Report]│
└────────────────────────────────────────────────────────────────┘
```

**Submit button** state:
- Default: "Submit Report" — primary color, full-width on mobile
- Loading: "Submitting..." + spinner; button disabled; form disabled
- Failure: reverts to "Submit Report" + error toast

**"Edit" links** on each section navigate back to that step with all data preserved.

**Photo upload progress** (shown when photos are included):
```
Submitting...
[▓▓▓▓▓▓▓░░░] Uploading photo 1 of 2 (72%)
```

---

## Step 6 — Confirmation Screen

```
┌────────────────────────────────────────────────────────────────┐
│  [City Logo]                                                   │
│  ──────────────────────────────────────────────────────────    │
│                                                                │
│              ✅  Report Submitted!                              │
│                                                                │
│  Your case number is:                                          │
│                                                                │
│         ┌──────────────────────────────┐                       │
│         │         # 5 1 0 2            │  ← JetBrains Mono     │
│         └──────────────────────────────┘     large, bold       │
│                                                                │
│  We've received your report about Pothole at Cedar & 7th.      │
│                                                                │
│  ✉ A confirmation has been sent to priya@email.com             │
│    (shown only if email was provided)                          │
│                                                                │
│  ──────────────────────────────────────────────────────────    │
│                                                                │
│  [View Case Status]  (link to Open311 GET /requests/5102)      │
│                                                                │
│  [Submit Another Report]  (resets form, back to Step 1)        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**No navigation header on this screen** — screenshot-friendly, no auth wall, no distractions. The case number is the hero of this screen.

**ARIA**: `role="main"` with `aria-live="polite"` announcing "Your report has been submitted. Case number 5102."

---

## Framer Motion Step Transitions

```
Forward (Step N → Step N+1):
  Exiting step: slide LEFT + fade out (duration: 200ms)
  Entering step: slide from RIGHT + fade in (duration: 200ms)

Backward (Step N → Step N-1):
  Exiting step: slide RIGHT + fade out
  Entering step: slide from LEFT + fade in

prefers-reduced-motion: all animations disabled; instant step swap
```

---

## Responsive Adaptations

| Element | Desktop | Mobile |
|---|---|---|
| Progress indicator | Numbered circles with labels | Numbered dots only (compact) |
| Category tiles | 3-column grid | 2-column grid |
| Map | 350 px tall | 250 px tall; full viewport width |
| Photo upload | Drag-and-drop zone + picker | "Add Photos" button → native picker |
| Navigation buttons | Right-aligned | Full-width stack; Submit on top |

---

## States Summary

| Step | Loading | Error | Empty/Skip |
|---|---|---|---|
| Step 1 Contact | N/A | Email format error (inline, on blur) | "Skip →" advances with no data |
| Step 2 Category | N/A | "Category required" on Next | — |
| Step 3 Location | Geocoding spinner in input | Geocoding error inline | — |
| Step 4 Description | N/A | "10+ characters required" | Photo upload is optional |
| Step 5 Review | — | — | All sections summarized |
| Submission | "Submitting..." button state | "Submission failed. Try again." toast | — |
| Step 6 Confirmation | N/A | N/A | (success only shown here) |

---

*End of Screen-07-public-submit.md*
