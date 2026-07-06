## Epic 2: Public Case Submission Form (F2)

The public-facing multi-step wizard allows constituents to submit 311 service requests without an account. It features Framer Motion animated transitions, map pin-drop, and photo upload — fully responsive at 375 px.

---

### US-2.1: Complete the Multi-Step Submission Wizard on Mobile
**As a** Priya Nair (Constituent), **I want to** complete a service request submission on my phone using a guided multi-step form, **so that** I can report a civic issue in under 5 minutes without creating an account or encountering a confusing single-page form.

**Acceptance Criteria:**
- [ ] Public form is accessible at `/submit` with no login required
- [ ] Form is divided into 5 steps: Contact Info → Category → Location → Description/Photos → Review
- [ ] A step indicator (1–5) shows current position and completed steps (checkmark on completed steps)
- [ ] Framer Motion animated transitions between steps complete in ≤ 300 ms
- [ ] `prefers-reduced-motion` disables all step transitions globally
- [ ] Forward navigation validates the current step before advancing; backward navigation is always allowed
- [ ] All form data is preserved across step navigation (React form context)
- [ ] Form renders correctly at 375 px viewport with no horizontal scroll
- [ ] All touch targets are ≥ 44 px
- [ ] Anonymous submission (skipping all contact info) is permitted with zero friction

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.2: Drop a Map Pin to Identify Issue Location
**As a** Priya Nair (Constituent), **I want to** drop a pin on an interactive map instead of typing a street address, **so that** I can precisely identify the issue location when I'm standing near an unmarked spot.

**Acceptance Criteria:**
- [ ] Step 3 (Location) renders an interactive Mapbox GL JS or Leaflet map at zoom level 13 centered on city center
- [ ] Typing in the address field triggers autocomplete suggestions after 300 ms debounce (via Mapbox Geocoding API or Nominatim fallback)
- [ ] Selecting an autocomplete suggestion centers the map and places a pin; lat/lon and formatted address are stored in form state
- [ ] Clicking or touching the map places a draggable pin; lat/lon and reverse-geocoded address are stored in form state
- [ ] If Mapbox API key is unavailable, Leaflet renders with OSM tiles; geocoding degrades gracefully to manual address entry only
- [ ] At least one of address string or lat/lon must be provided before advancing to Step 4
- [ ] Geocoding failure shows an inline error; the map pin remains usable as fallback

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.3: Upload a Photo from Phone Camera During Submission
**As a** Priya Nair (Constituent), **I want to** attach a photo directly from my phone camera or gallery during the submission wizard, **so that** I can provide photographic evidence of the civic issue.

**Acceptance Criteria:**
- [ ] Step 4 (Description/Photos) includes a file input with `accept="image/*" capture` for mobile camera access
- [ ] On desktop, a drag-and-drop zone and file picker button are provided
- [ ] Each selected file shows a thumbnail preview and a "remove" button
- [ ] Up to 10 files may be attached per submission; each must be ≤ 10 MB and JPEG/PNG/GIF
- [ ] Files are held in browser memory until final form submission (not uploaded on selection)
- [ ] Upload progress is shown per file during the final submission step
- [ ] Files exceeding 10 MB show an inline error "Photo exceeds maximum 10 MB size"
- [ ] Unsupported file types show an inline error "Only JPEG, PNG, and GIF photos are accepted"
- [ ] Photos are attached to the created ticket record upon successful submission

**Priority:** P0 | **Feature Ref:** F2

---

### US-2.4: Receive a Confirmation Screen with Case ID
**As a** Priya Nair (Constituent), **I want to** receive a confirmation screen with my unique case ID after submitting, **so that** I have proof my report was received and can look up its status later.

**Acceptance Criteria:**
- [ ] After successful submission, Step 6 (Confirmation) renders: "Your report has been submitted. Case number: #{id}"
- [ ] A link to view the case status via the public Open311 endpoint is provided
- [ ] If an email address was provided, a confirmation email is sent to the reporter
- [ ] Network error on submit shows "Submission failed. Please try again." with a retry option
- [ ] The confirmation screen is accessible to screen readers with proper ARIA announcements
- [ ] Confirmation screen is fully readable at 375 px viewport

**Priority:** P0 | **Feature Ref:** F2

---
