---

### Flow 04: Citizen Submits a Public Service Request

**Trigger:** Priya taps "Report an Issue" link on the city website; navigates to /submit  
**User Stories:** US-15.2, US-5.1, US-7.1, US-8.1, US-0.1  
**Personas:** Priya (PER-03)  
**Journey:** JRN-03.1

```
[/submit — Public Service Request Form]
No login required (anonymous posting for public categories)
    │
    ▼
[Step 1 — What is your issue? (Category)]
    Grouped card/radio list with plain-language labels and icons
    e.g., 🕳 "Pothole or Road Damage" | 💡 "Broken Streetlight" | 🗑 "Missed Garbage Pickup"
    Search box above the list for quick filtering
    Only categories with postingPermission=public|anonymous shown
    │
    └── No category found ──▶ [fallback text: "Can't find your issue? Call us at 555-0100"]
    │
    ▼
[Step 2 — Where is the problem? (Location)]
    Two inputs side by side (desktop) / stacked (mobile):
      A) Address text field (geocodes on submit)
      B) Interactive map with tap-to-place pin
    Either method works independently
    Large touch target for the map pin (≥44px)
    │
    ├── Geocode success ──▶ [map pin confirms location; normalized address shown]
    ├── Geocode fail ──────▶ [soft warning: "Exact location not confirmed — your report will still be submitted"]
    └── No location entered ──▶ [inline error: "Please enter a location or tap the map"]
    │
    ▼
[Step 3 — Tell us more (Details)]
    Description textarea (optional, max 5000)
      Placeholder: "Describe the problem in a few words. Where exactly? How severe?"
    Photo upload (optional):
      "Add a photo" button → native camera/file picker
      Thumbnail preview after selection
      Max 10MB, JPEG/PNG/GIF/WebP only
    Custom fields (if category has them — rendered dynamically)
    │
    ├── File > 10MB ──▶ [inline: "Photo too large. Please use a photo under 10MB."]
    └── Wrong type ──▶ [inline: "Only JPG, PNG, GIF, or WebP photos accepted."]
    │
    ▼
[Step 4 — Your contact info (optional but recommended)]
    "Get a confirmation email" section (collapsible, expanded by default)
    First Name | Last Name | Email
    Friendly note: "We'll send you a confirmation and updates. No account needed."
    │
    ├── Invalid email ──▶ [inline: "Please enter a valid email address"]
    └── No email entered ──▶ [warning note: "Without an email, you won't receive a confirmation." (not a hard error)]
    │
    ▼
[Submit button — sticky at bottom on mobile]
    "Submit My Report" (large, high-contrast)
    Disabled until Step 1 (category) and Step 2 (location) are complete
    │
    ├── API 422 ──▶ [inline field errors displayed; scroll to first error]
    └── Success ──▶ [/submit/confirmation screen]

─────────────────────────────────
CONFIRMATION SCREEN (/submit/confirmation)
─────────────────────────────────
    ┌────────────────────────────────────┐
    │  ✅ Your report has been submitted │
    │                                    │
    │  Report #4821                      │
    │  Pothole or Road Damage            │
    │  Oak Avenue near Oak Park          │
    │                                    │
    │  [Check your report status →]      │
    │  (links to /track/4821)            │
    │                                    │
    │  📧 A confirmation email has been  │
    │     sent to priya@example.com      │
    │                                    │
    │  [Submit another report]           │
    └────────────────────────────────────┘

─────────────────────────────────
TRACKING PAGE (/track/:id)
─────────────────────────────────
[Public, no login required]
    Shows: ticket ID, category, status, substatus, department, last updated
    Shows: public-visible action history (external responses only; internal comments hidden)
    Does NOT show: assignee name, internal staff notes
    │
    ├── Ticket not found ──▶ [404 message: "Report not found. Check your ticket number."]
    └── Staff-only category ──▶ [403 message: "This report is not publicly viewable."]
```

**Mobile UX specifics (JRN-03.1):**
- Form renders in a single-column layout at 375px. No horizontal scroll at any step.
- Step indicator at top (1 of 4) with back navigation between steps.
- "Add a photo" button renders as a full-width tap target on mobile (not a small file input).
- Map uses a simplified touch-friendly tile view with a large centered pin. "Tap to place" hint text.
- Submit button is sticky at the bottom of the viewport on mobile (always reachable without scrolling).
- Total form completion target: ≤ 3 minutes on a 375px mobile browser (JRN-03.1 success criterion).
