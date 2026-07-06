# Flow-05: Public Mobile Submission Wizard

**Trigger:** Priya finds the 311 portal from a search result on her phone; 7 minutes before her bus arrives
**User Stories:** US-2.1, US-2.2, US-2.3, US-2.4
**Journey:** JRN-04.1 — Mobile Service Request Submission
**Success Metric:** Anonymous submission completed on 375 px in ≤5 minutes; case ID shown within 3 seconds of submit

---

## Flow Diagram

```
[Priya taps link → /submit]
        │
        ▼
[Step 1 of 5: Contact Info]
  Optional fields — "Skip" always visible
        │
   [Next →]
        │
        ▼
[Step 2 of 5: Category]
  Category Group tiles → subcategory list
  "Roads & Sidewalks" → "Pothole"
        │
   [Next →]
        │
        ▼
[Step 3 of 5: Location]
  Address autocomplete + interactive map
  Priya taps map near Cedar & 7th → pin drops
  Reverse-geocoded address fills text field
        │
   [Next →]  ← blocked if no location set
        │
        ▼
[Step 4 of 5: Description + Photos]
  Textarea (min 10 chars required)
  Photo upload button → camera roll → thumbnail
        │
   [Next →]  ← blocked if description < 10 chars
        │
        ▼
[Step 5 of 5: Review]
  Summary of all steps
  [← Edit] links per section
        │
   [Submit]
        │
        ▼
[POST /api/tickets/public — multipart]
        │
    ┌───┴──────────────┐
 Success           Network error
    │                   └──▶ "Submission failed. Try again." + [Retry]
    ▼
[Step 6: Confirmation Screen]
  ┌─────────────────────────────────────┐
  │  ✓ Your report has been submitted!  │
  │                                     │
  │  Case Number: #5102                 │  ← JetBrains Mono, large
  │                                     │
  │  We'll email you when there's an    │
  │  update (if email was provided).    │
  │                                     │
  │  [View Case Status] (Open311 link)  │
  │  [Submit Another Report]            │
  └─────────────────────────────────────┘
```

---

## Step Navigation Rules

- **Forward**: validates current step before advancing; shows inline errors on invalid fields
- **Backward**: always allowed without re-validation; all data preserved
- **Progress indicator**: 1–5 (step 6 is confirmation, not counted as a step in the indicator)
- **Completed steps**: checkmark (✓) icon on completed step dots
- **Framer Motion transitions**: slide-left on forward, slide-right on backward, ≤300 ms
- **prefers-reduced-motion**: all transitions disabled; instant step switch

---

## Detailed Step Breakdown

### Step 1 — Contact Info
- Fields: First Name, Last Name, Email, Phone (all optional)
- "Skip" button advances without any input — zero friction for anonymous submission
- Clear label: "Optional — We'll email you when your case is updated"
- Email format validation if provided (inline, on blur)

### Step 2 — Category
- Two-level selection: Category Group tiles (large, touchable) → Category list
- Only categories with `postingPermissionLevel = 'anonymous'` shown
- Category description shown in a callout below selection for guidance
- "Back" link returns to group tiles

### Step 3 — Location
- Address input with Mapbox autocomplete (300 ms debounce)
- Map renders at zoom 13 centered on city center
- Tap/click map → draggable pin placed → reverse-geocode auto-fills address
- If Mapbox key absent: Leaflet + OSM tiles, manual address entry only
- Geocoding error: inline message below address field; map pin still usable
- Validation: at least one of address string or lat/lon required before Next

### Step 4 — Description + Photos
- Textarea: min 10 characters; character count shown (e.g., "47/500")
- Photo button: native `<input type="file" accept="image/*" capture>` on mobile
- Desktop: drag-and-drop zone + file picker
- Thumbnail grid below input; "×" remove button on each thumbnail
- Error per file: size > 10 MB → "Photo exceeds 10 MB limit"; bad type → "Only JPEG, PNG, GIF accepted"
- Files held in browser memory; not uploaded until Step 5 Submit

### Step 5 — Review
- All entered data summarized in readable format
- Each section has an "[Edit]" link that navigates back to that step
- Submit button is full-width, primary color, with accessible label

### Step 6 — Confirmation
- Full-page success state (no header needed)
- Case number in large JetBrains Mono
- Screenshot-friendly layout (no auth wall, no modal)
- ARIA live region announces "Report submitted. Case number 5102" for screen readers

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | Step 6 confirmation screen |
| "Submit Another Report" | `/submit` fresh form |
| "View Case Status" | Open311 GET request URL (public) |
| Network error | Stay on Step 5 Review + retry |

---

*End of Flow-05-public-submit.md*
