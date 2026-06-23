---

### Screen 05: Public Service Request Form (Constituent-Facing, Mobile-First)

**Route:** `/submit`  
**Purpose:** Citizen-facing ticket submission. No login required for public/anonymous categories. Designed primarily for 375px mobile viewports.  
**User Stories:** US-15.2, US-5.1, US-7.1, US-8.1  
**Personas:** Priya (PER-03)  
**Journey:** JRN-03.1

#### Layout (Mobile — 375px, Step 1: Category)

```
┌─────────────────────────────┐
│  [City Logo]   Report Issue │  ← minimal header, no nav
│  ─────────────────────────  │
│  Step 1 of 4                │
│  ●───○───○───○              │  ← step dots
│                             │
│  What's the problem?        │
│                             │
│  🔍 [Search...]             │
│                             │
│  ┌─────────────────────┐    │
│  │ 🕳 Pothole or Road  │    │
│  │    Damage           │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 💡 Broken           │    │
│  │    Streetlight      │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 🗑 Missed Garbage   │    │
│  │    Pickup           │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 🌳 Parks & Trees    │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 💧 Water or Sewer   │    │
│  └─────────────────────┘    │
│                             │
│  Can't find it? Call us:    │
│  📞 555-0100                │
│                             │
│         [Next →]            │  ← sticky bottom button; disabled until selection
└─────────────────────────────┘
```

#### Layout (Mobile — Step 2: Location)

```
┌─────────────────────────────┐
│  [← Back]       Step 2 of 4 │
│  ●───●───○───○              │
│                             │
│  Where is the problem?      │
│                             │
│  Street address             │
│  ┌───────────────────────┐  │
│  │ Oak Avenue near Oak…  │  │  ← geocodes on submit
│  └───────────────────────┘  │
│                             │
│  ── or tap the map ──       │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   [Map — full width]  │  │  ← tall map, ~250px
│  │        📍             │  │  ← large touch target pin
│  │                       │  │
│  └───────────────────────┘  │
│  Tap map to place pin       │
│                             │
│  ✅ Location confirmed:     │  ← shown after geocode
│  Oak Ave @ Oak Park         │
│                             │
│         [Next →]            │  ← disabled until location set
└─────────────────────────────┘
```

#### Layout (Mobile — Step 3: Details)

```
┌─────────────────────────────┐
│  [← Back]       Step 3 of 4 │
│  ●───●───●───○              │
│                             │
│  Describe the problem       │
│  (optional)                 │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │  Describe it here...  │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  Add a photo (optional)     │
│  ┌───────────────────────┐  │
│  │   📷 Take or choose   │  │  ← full-width button; no small input
│  │       a photo         │  │
│  └───────────────────────┘  │
│                             │
│  [🖼 pothole.jpg  ✕]        │  ← thumbnail preview after selection
│                             │
│         [Next →]            │
└─────────────────────────────┘
```

#### Layout (Mobile — Step 4: Contact Info)

```
┌─────────────────────────────┐
│  [← Back]       Step 4 of 4 │
│  ●───●───●───●              │
│                             │
│  Get updates (optional)     │
│                             │
│  First name                 │
│  [_______________________]  │
│                             │
│  Last name                  │
│  [_______________________]  │
│                             │
│  Email address              │
│  [_______________________]  │
│                             │
│  💡 We'll email you a       │
│     confirmation and status │
│     updates. No account     │
│     needed.                 │
│                             │
│  ⚠️  Without an email you   │  ← soft warning, not a hard error
│     won't get a confirmation│
│                             │
│  ┌───────────────────────┐  │
│  │   Submit My Report    │  │  ← large, high-contrast CTA
│  └───────────────────────┘  │
│                             │
│  By submitting you agree to │
│  our privacy notice. [Link] │
└─────────────────────────────┘
```

#### Confirmation Screen (/submit/confirmation)

```
┌─────────────────────────────┐
│  [City Logo]                │
│                             │
│         ✅                  │
│   Report submitted!         │
│                             │
│   Report #4821              │
│   Pothole or Road Damage    │
│   Oak Ave @ Oak Park        │
│                             │
│  ┌───────────────────────┐  │
│  │  Check report status  │  │  ← primary CTA → /track/4821
│  └───────────────────────┘  │
│                             │
│  📧 Confirmation email sent │
│     to priya@example.com    │
│                             │
│  [Submit another report]    │  ← secondary link
└─────────────────────────────┘
```

#### Tracking Page (/track/:id — public, no login)

```
┌─────────────────────────────┐
│  [City Logo]  Track Report  │
│                             │
│  Report #4821               │
│  Pothole or Road Damage     │
│                             │
│  Status: Open               │
│  🔵 Assigned to Public Works│
│  Last updated: Today, 10:30 │
│                             │
│  Updates                    │
│  ───────────────────────    │
│  Jun 22  Staff response     │
│  "We've received your       │
│   report and will           │
│   investigate..."           │
│                             │
│  Jun 21  Report opened      │
│                             │
│  [Submit another report]    │
└─────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Category selection (Step 1) | Full screen step |
| Primary | Location input (Step 2) | Full screen step |
| Secondary | Description + photo (Step 3) | Full screen step |
| Secondary | Contact info (Step 4) | Full screen step |
| Primary | Submit CTA | Sticky bottom |
| Primary | Confirmation: ticket ID + status link | Confirmation screen center |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Step 1: no selection | Next button disabled, gray | "Select an issue type to continue" (tooltip on tap) |
| Step 2: geocoding | Spinner under address field | "Finding location..." |
| Step 2: geocode confirmed | Green ✅ banner | "Location confirmed: [address]" |
| Step 2: geocode failed | Soft warning | "Exact location not confirmed — you can still submit." |
| Step 3: file too large | Inline error below upload | "Photo too large (max 10MB)." |
| Submitting | Button spinner, disabled | "Submitting your report..." |
| API validation error | Inline errors, scroll to first | Red field borders + error message |
| Success | Confirmation screen | ✅ with ticket ID and email note |
| Email not entered | Soft warning (not blocking) | "Without an email you won't get a confirmation." |

#### Accessibility Notes (Mobile-specific)
- Each step has a `<h1>` heading announcing the step purpose
- Step indicator is `role="progressbar"` with `aria-valuenow` and `aria-valuetext`
- Map has `aria-label="Interactive map — tap to place location pin"`
- Photo upload button is `<button>` not `<input type="file">` for tap target size compliance
- Error messages are associated with their fields via `aria-describedby`
- Submit button never hides; only changes to disabled state with `aria-disabled="true"`
