---

## F2: Public Case Submission Form

**Priority:** P0 — Critical

### Description

The public-facing case submission form allows constituents to report a 311 service request without logging in. The form is a multi-step wizard with Framer Motion animated step transitions. It collects contact info (optional), category, location (address + map pin-drop), description, and photo uploads, then calls the internal ticket creation API (equivalent to Open311 POST /requests). A confirmation screen returns the generated case ID.

### Terminology

- **Anonymous submission** — Submission without any contact info. Allowed; reporter fields left null.
- **Identified submission** — Submission with at least name and/or email. Creates a `people` record if new.
- **Step** — One screen of the multi-step wizard. Steps navigate forward and backward without losing data.
- **Pin-drop** — Interactive map action where the user clicks the map to set lat/lon for the ticket location.
- **Geocoding** — Converting an address string to lat/lon coordinates via the geocoding API (Mapbox / OpenStreetMap Nominatim).

### Sub-features

- Step 1: Contact Information (optional)
- Step 2: Category selection (group → category drill-down)
- Step 3: Location (address autocomplete + map pin-drop)
- Step 4: Description + photo upload
- Step 5: Review and submit
- Step 6: Confirmation screen with case ID
- Anonymous and identified submission modes
- Framer Motion step transitions (≤ 300 ms, prefers-reduced-motion respected)
- Mobile-first responsive layout (375 px minimum)

### Process

1. Constituent navigates to `/submit` (public route; no auth required).
2. **Step 1 — Contact Info:** Constituent enters first name, last name, email, phone (all optional). "Skip" button advances without entering info.
3. **Step 2 — Category:** Constituent selects a category group from a dropdown or tile grid, then selects a specific category. Only categories where `postingPermissionLevel = 'anonymous'` are shown to unauthenticated users. Category description is shown for guidance.
4. **Step 3 — Location:** Constituent types an address (autocomplete queries geocoding API). Map renders with a draggable pin. Constituent can also click the map to drop a pin. Selected lat/lon and formatted address are stored in form state.
5. **Step 4 — Description + Photos:** Constituent enters a description (required). Optionally uploads one or more photos (file picker; drag-and-drop on desktop). Thumbnail previews shown for each uploaded file.
6. **Step 5 — Review:** Summary of all entered data displayed. Constituent can click "Back" or "Edit" links to return to any step.
7. On "Submit": system calls `POST /api/tickets/public` with form data and photo files.
8. **Step 6 — Confirmation:** Displays "Your report has been submitted. Case number: #{id}". Provides a link to view the case status (public GET /open311/v2/requests/{id}).

### Step Navigation Rules

- Forward navigation: each step validates its own fields before advancing.
- Backward navigation: always allowed without re-validation.
- Browser back button is handled by React Router; state is preserved in form context.
- Step indicator (1–5) shows current position and completed steps.
- Completed steps show a checkmark indicator.

### Inputs

| Field | Type | Step | Required | Validation |
|---|---|---|---|---|
| `firstName` | string | 1 | [O] | Max 128 chars |
| `lastName` | string | 1 | [O] | Max 128 chars |
| `email` | string | 1 | [O] | Valid email format |
| `phone` | string | 1 | [O] | Digits, spaces, dashes allowed |
| `category_id` | integer | 2 | [R] | Must be active, postable by anonymous |
| `address` | string | 3 | [R*] | At least address or pin-drop required |
| `latitude` | float | 3 | [R*] | Set by geocode or pin-drop |
| `longitude` | float | 3 | [R*] | Set by geocode or pin-drop |
| `description` | text | 4 | [R] | Min 10 characters |
| `photos` | files | 4 | [O] | Max 10 files; each ≤ 10 MB; JPEG/PNG/GIF |

*[R*] = Either address string or lat/lon must be provided.

### Outputs

- Created ticket record (via POST /api/tickets/public)
- Confirmation screen with ticket ID
- Optional: email confirmation to reporter if email was provided

### Validation Rules

- Step 1 (Contact Info): if email provided, must be valid format. Phone accepts digits/spaces/dashes.
- Step 2 (Category): `category_id` must reference an active category with `postingPermissionLevel` of `'anonymous'` or `'public'`. Staff-only categories are excluded from the public form.
- Step 3 (Location): at least one of address string or lat/lon coordinates must be captured before advancing.
- Step 4 (Description): minimum 10 characters. Photo files: max 10 per submission, max 10 MB each, MIME types: `image/jpeg`, `image/png`, `image/gif`.
- All form data must be preserved across step navigation (React form context / controlled components).
- CSRF protection: the public submission endpoint must include a CSRF token (Spring Security CSRF or stateless with SameSite cookies).

### Map / Geocoding Behavior

- Address input: Mapbox Geocoding API (or Nominatim fallback) provides autocomplete suggestions after 300 ms debounce.
- Selecting a suggestion sets the formatted address, lat, and lon in form state and centers the map.
- Manual pin-drop: clicking or touching the map sets lat/lon and reverse-geocodes to populate address.
- Map renders at zoom level 13 initially centered on the city center (configurable coordinates).
- If Mapbox API key is unavailable, Leaflet renders with OpenStreetMap tiles; geocoding degrades to manual address entry only.

### Photo Upload Behavior

- Files can be selected via file picker or dragged onto the drop zone (desktop).
- Mobile: native camera/gallery picker via `<input type="file" accept="image/*" capture>`.
- Each selected file shows a thumbnail preview and a remove button.
- Upload occurs on form submit, not on file selection (files held in browser memory until submit).
- Upload progress shown for each file during submission.

### Error States

| Scenario | HTTP Status | User Message |
|---|---|---|
| Unknown/inactive category | 400 | "Invalid category. Please reselect." |
| Description too short | 400 | "Please provide at least 10 characters of description." |
| Invalid email format | 400 | "Please enter a valid email address." |
| File too large | 400 | "Photo exceeds maximum 10 MB size." |
| Unsupported file type | 400 | "Only JPEG, PNG, and GIF photos are accepted." |
| Network error on submit | 503 | "Submission failed. Please try again." |
| Geocoding failure | — | Map pin remains; address field shows error inline. |

### API Surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/tickets/public` | None | Public submission; maps to Open311 semantics |
| GET | `/api/categories/public` | None | Returns public-postable categories |
| GET | `/api/geocode` | None | Address autocomplete proxy to Mapbox/Nominatim |

### Schema Surface

- `tickets` — created record
- `media` — photo attachments
- `people` — reporter record created or matched if email provided
- `categories` — filtered to `postingPermissionLevel IN ('public','anonymous')`
