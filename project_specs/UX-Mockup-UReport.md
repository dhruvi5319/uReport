# UX Mockup — uReport CRM Modernization

**Project:** uReport Civic CRM (311 Service Request Management)
**Generated:** 2026-07-06
**Based on:** UserStories-UReport.md, JOURNEYS-UReport.md, PRD-UReport.md, FRD-UReport.md, PROJECT.md
**Version:** 1.0

---

## Overview

uReport modernized is a civic 311 CRM serving municipal staff, department field supervisors, system administrators, and the general public. The UX is designed around three primary truths surfaced by the journey maps:

1. **No full-page reloads** — Every action (filter, save, status change, bulk operation) must complete within the current view, confirmed via toast. This is the single largest pain point across all staff journeys (CP-01).
2. **Mobile is a first-class workflow**, not a nice-to-have — Diane closes cases from a job site on a 375 px phone. Priya submits reports standing at a pothole. Both require pixel-perfect mobile layouts (CP-02).
3. **Context is precomputed, not re-entered** — Role-aware defaults (department filter, dashboard scoping), pre-filtered quick-links, and URL-serialized filter state mean staff reach their relevant data in ≤2 clicks (CP-05).

---

## Design Principles

| # | Principle | Expression |
|---|---|---|
| 1 | Speed over completeness | Skeleton loaders, optimistic UI, parallel data fetching |
| 2 | Role-aware defaults | Dashboard and case list pre-scoped to user's department |
| 3 | Destructive actions always confirm | shadcn/ui Dialog on every delete, close, and bulk operation |
| 4 | URL-serialized state | All filter, sort, search, and page state in query params for shareability |
| 5 | Progressive disclosure | Key metadata visible in list rows; full detail only on open |
| 6 | Consistent feedback | Toast for every async save; inline error for every validation failure |
| 7 | Accessibility first | WCAG 2.1 AA + Section 508 baked in from day one, not retrofitted |

---

## Design System Reference

| Token | Value |
|---|---|
| **Primary** | Civic blue (CSS var `--color-primary`) |
| **Typography — UI** | Inter, 4 px grid |
| **Typography — IDs/Code** | JetBrains Mono |
| **Component library** | shadcn/ui (fully customized) |
| **Animation** | Framer Motion, ≤300 ms, prefers-reduced-motion respected |
| **Shadows** | 3-tier: `shadow-sm` / `shadow-md` / `shadow-lg` |
| **Dark mode** | CSS variable swap on `.dark` class; persisted to localStorage |
| **Breakpoints** | 375 px (mobile) / 768 px (tablet) / 1280 px+ (desktop) |
| **Touch targets** | Minimum 44 × 44 px on all interactive elements |

---

## Screen Index

| Screen | Route | Persona(s) | Story IDs |
|---|---|---|---|
| Login | `/login` | All staff | — |
| Dashboard | `/dashboard` | PER-01, PER-02 | US-5.1–5.4 |
| Case List | `/cases` | PER-01, PER-02 | US-3.1–3.6, US-1.5 |
| Case Detail | `/cases/:id` | PER-01, PER-02 | US-4.1–4.4, US-1.2–1.4, US-10.1–10.4 |
| New Case Form | `/cases/new` | PER-01 | US-1.1, US-10.1 |
| Public Submission | `/submit` | PER-04 | US-2.1–2.4 |
| Search Results | `/cases?q=…` | PER-01, PER-02 | US-3.1, US-11.1–11.3 |
| Admin — People | `/admin/people` | PER-03 | US-6.1–6.4 |
| Admin — Departments | `/admin/departments` | PER-03 | US-7.1–7.2 |
| Admin — Categories | `/admin/categories` | PER-03 | US-8.1–8.3 |
| Admin — Substatuses | `/admin/substatuses` | PER-03 | F13 |
| Admin — Issue Types | `/admin/issue-types` | PER-03 | F13 |
| Admin — Contact Methods | `/admin/contact-methods` | PER-03 | F13 |
| Admin — API Clients | `/admin/clients` | PER-03 | US (JRN-03.2) |
| Navigation Shell | (wraps all auth screens) | All staff | F18 |

---

## Flow Index

| Flow | File | Journey |
|---|---|---|
| Staff Authentication | Flow-00-auth.md | JRN-02.1 Login |
| Live-Call Case Intake | Flow-01-case-intake.md | JRN-01.1 |
| Caller Status Inquiry | Flow-02-status-inquiry.md | JRN-01.2 |
| Storm Event Bulk Cleanup | Flow-03-bulk-ops.md | JRN-01.3 |
| Field Resolution Closure | Flow-04-field-closure.md | JRN-02.2 |
| Public Mobile Submission | Flow-05-public-submit.md | JRN-04.1 |
| Admin Category Setup | Flow-06-admin-category.md | JRN-03.1 |

---

*End of 00-overview.md*
# Flow-00: Staff Authentication

**Trigger:** Staff navigates to any protected route, or directly to `/login`
**User Stories:** F12 (Authentication)
**Journeys:** JRN-02.1 (Login stage), JRN-02.2 (Access stage)

---

## Flow Diagram

```
[Browser opens protected URL]
         │
         ▼
 [Redirect to /login]
         │
         ▼
 [Login Card renders]
  ┌─────────────────┐
  │  CAS button     │──▶ [CAS SSO redirect] ──▶ [CAS authenticates]
  │  LDAP form      │                                    │
  └─────────────────┘                                    ▼
         │                                   [Spring Boot issues JWT]
         │ (LDAP path)                                   │
         ▼                                               ▼
  [Submit credentials]                        [JWT stored (httpOnly cookie)]
         │                                               │
    ┌────┴────┐                                          ▼
    │         │                                [Redirect to /dashboard]
  Error     Success                                      │
    │         │                                          ▼
    ▼         ▼                               [Dashboard renders with
  [Inline  [Loading                            role-scoped widgets]
   error]   spinner]
```

---

## Steps

1. **Entry**: User lands on `/login` (direct or redirect from protected route). The original attempted URL is preserved in redirect state.
2. **CAS path**: Clicking "Sign in with City SSO" redirects to the CAS server. On success, CAS redirects back with a service ticket; Spring Boot validates and issues JWT.
3. **LDAP path**: User enters username + password; form submits to `POST /api/auth/login`. Loading spinner shown during request.
4. **Success**: JWT set in httpOnly cookie. React redirects to originally requested URL (or `/dashboard` if none). Role and department stored in React auth context.
5. **Error**: Inline error message under the failed field or below the form. Form re-enabled for retry.
6. **Session expiry**: Protected API call returns 401 → React clears auth context → redirect to `/login` with toast "Your session has expired. Please sign in again."

---

## Exit Points

| Outcome | Destination |
|---|---|
| Authentication success | `/dashboard` (or originally requested URL) |
| CAS single sign-out | `/login` with success message |
| Session expired (anywhere) | `/login` with expiry toast |

---

*End of Flow-00-auth.md*
# Flow-01: Live-Call Case Intake

**Trigger:** Marcus receives a 311 call; clicks "New Case" in navbar or dashboard quick-link
**User Stories:** US-1.1, US-10.1, US-1.4, US-9.1, US-9.2
**Journey:** JRN-01.1 — Live-Call Case Intake
**Success Metric:** Case created in ≤90 seconds, case ID read to caller

---

## Flow Diagram

```
[Marcus receives call]
        │
        ▼
[Clicks "New Case" (navbar or dashboard)]
        │
        ▼
[/cases/new loads — single scrollable form]
        │
        ▼
┌───────────────────────────────┐
│  Fill required fields:        │
│  • Category (autocomplete)    │──▶ [Dept auto-populates from category]
│  • Location (address or map)  │
│  • Description                │
│  • Reporter (search/create)   │
│  • Assignee (optional)        │
│  • Photo upload (optional)    │
└───────────────────────────────┘
        │
        ▼
[Client-side validation]
        │
    ┌───┴───┐
  Pass    Fail
    │       └──▶ [Inline errors highlighted; focus moves to first error]
    ▼
[POST /api/tickets — multipart]
        │
    ┌───┴───┐
 Success  Network error
    │       └──▶ [Error toast + retry button; form data preserved]
    ▼
[Redirect to /cases/{id}]
        │
        ▼
[Toast: "Case #4821 created successfully"]
        │
        ▼
[Case Detail renders — Marcus reads ID to caller]
```

---

## Steps

1. **Entry**: Marcus clicks "New Case" from the persistent navbar button (always visible — no menu traversal). No full-page reload. Route changes to `/cases/new` via React Router.
2. **Form render**: Single scrollable form with all required fields visible. Category dropdown uses autocomplete (type to search). Selecting a category auto-populates Department field with a visual confirmation badge "→ Public Works".
3. **Location**: Address field shows Mapbox autocomplete suggestions after 300 ms debounce. Optional map pin-drop available inline. At least one location signal (address or lat/lon) is required.
4. **Reporter**: Searchable person selector (type name → results). Option to "Create new person inline" opens a mini-form in a Sheet without navigating away.
5. **Assignee**: Optional. If set, shows "Email notification will be sent to {name}" confirmation.
6. **Photos**: Drag-and-drop zone + file picker. Thumbnails shown immediately. Up to 10 files, ≤10 MB each.
7. **Submit**: Single "Create Case" button. Loading spinner replaces button text. Form stays enabled for edits during submission.
8. **Success**: Redirect to `/cases/{id}`. Toast appears: "Case #4821 created successfully". The case ID is shown prominently in the case detail header in JetBrains Mono font — Marcus reads it to the caller.
9. **Back navigation**: Breadcrumb returns to case list preserving all active filters.

---

## Critical UX Moment — Delight Opportunity

> At step 8, the case ID appears instantly in JetBrains Mono on the case detail. Marcus reads "Case 4,821" to the caller while still on the phone. This is the moment of visible competence — the system enables it only if the redirect is instant (<2 s total).

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | `/cases/{id}` + toast |
| Cancel (no changes) | `/cases` (case list) |
| Network error | Stay on `/cases/new` + error toast |

---

*End of Flow-01-case-intake.md*
# Flow-02: Caller Status Inquiry — Instant Case Lookup

**Trigger:** Caller gives Marcus a name and street; Marcus needs to find the case in <30 seconds
**User Stories:** US-3.1, US-3.2, US-3.3, US-11.1, US-11.2, US-11.3
**Journey:** JRN-01.2 — Caller Status Inquiry
**Success Metric:** Case located within 30 seconds including one filter application

---

## Flow Diagram

```
[Caller asks for status on "Maria Santos / Elm Avenue"]
        │
        ▼
[Marcus moves focus to Case List search bar]
        │
        ▼
[Types "Maria Santos" — 300 ms debounce fires]
        │
        ▼
[Results appear inline — reporter name highlighted]
  ┌─────────────────────────────┐
  │  3 results found            │
  │  [Mark: Maria Santos] ...   │
  └─────────────────────────────┘
        │
        ▼
[Marcus adds address filter chip "Elm Ave"]
  from filter panel or URL bar
        │
        ▼
[Results narrow to 1 — correct case visible]
  Status badge: OPEN (blue pill)
  Category: Streetlight
        │
        ▼
[Marcus clicks the row → /cases/{id}]
        │
        ▼
[Case Detail: split-pane, timeline always visible]
        │
        ▼
[Marcus reads timeline top entry to caller:
 "Scheduled for repair week of July 14"]
```

---

## Steps

1. **Global search bar** (in top navbar) is always visible and focused on Cmd+K / Ctrl+K shortcut. Marcus does not need to navigate to the case list first.
2. **Debounced live search**: Results update after 300 ms. Minimum 1 character triggers search. Matched text (`<mark>`) highlighted in reporter name and description columns.
3. **Filter combination**: Address filter added via filter panel without clearing the search term. Both conditions applied simultaneously (AND semantics). Filter chip "Address: Elm Ave" appears above the table.
4. **Row identification**: Color-coded status badge (OPEN = blue pill) and category name visible in the row without opening the case. Overdue badge shown in red if applicable.
5. **Case Detail**: Split-pane with timeline immediately visible on right. No secondary navigation needed. Most recent action entry at the top.
6. **Back navigation**: Breadcrumb "← Cases" returns to case list with all filters preserved (URL-encoded state).

---

## Exit Points

| Outcome | Destination |
|---|---|
| Case found + opened | `/cases/{id}` |
| No results | Empty state on `/cases` with "No cases match your filters" |
| User returns to list | `/cases` with filters preserved |

---

*End of Flow-02-status-inquiry.md*
# Flow-03: Storm Event Bulk Cleanup

**Trigger:** 34 duplicate reports from overnight storm; Marcus needs to close 33 as Duplicate in one action
**User Stories:** US-1.5, US-3.2, US-3.3
**Journey:** JRN-01.3 — Storm Event Bulk Cleanup
**Success Metric:** 33 cases bulk-closed in ≤60 seconds from first checkbox to success toast

---

## Flow Diagram

```
[Marcus opens /cases]
        │
        ▼
[Applies filters: Date=Yesterday, Category=Fallen Tree]
  → 34 rows visible
        │
        ▼
[Clicks "Select All on Page" header checkbox]
  → 34 rows highlighted with blue selection tint
  → Bulk toolbar appears: "34 cases selected"
        │
        ▼
[Unchecks the ONE canonical case to keep open]
  → "33 cases selected"
        │
        ▼
[Clicks "Bulk Close" in toolbar]
        │
        ▼
[Dialog opens: "Close 33 cases"]
  ┌──────────────────────────────────────┐
  │  Close 33 Cases                      │
  │  ──────────────────────────────────  │
  │  Substatus: [Duplicate ▼]  (required)│
  │  Parent Ticket ID: [______] (shown   │
  │  when Duplicate is selected)         │
  │  Notes: [optional textarea]          │
  │                                      │
  │  [Cancel]          [Confirm Close]   │
  └──────────────────────────────────────┘
        │
    ┌───┴───┐
  Cancel  Confirm
    │         │
    │         ▼
    │   [POST /api/tickets/bulk]
    │         │
    │     ┌───┴───┐
    │  Success  Partial fail
    │     │         └──▶ Toast: "30 closed, 3 failed"
    │     ▼
    │   Toast: "33 cases closed successfully"
    │   Case list refreshes (no page reload)
    │   Filtered list shows 1 remaining open case
    │
    ▼
[Toolbar dismissed; checkboxes cleared]
```

---

## Steps

1. **Filter application**: Date range and category filters applied via filter panel. Filter chips show active state. 34 rows rendered.
2. **Select All**: Header checkbox checked → all visible rows highlighted. Bulk action toolbar slides in from bottom (Framer Motion, 200 ms). Counter shows "34 cases selected".
3. **Deselect one**: Unchecking a row decrements counter. Selection tint is removed from that row. Remaining 33 stay highlighted.
4. **Bulk toolbar actions**: Three buttons visible — "Assign", "Change Status", "Close". "Close" is primary action.
5. **Confirmation dialog**: Shows exact count ("Close 33 cases"). Substatus dropdown is required. When "Duplicate" is selected, Parent Ticket ID field appears. Optional notes field below. Cancel is equally prominent as Confirm (equal weight buttons, not destructive styling on Cancel).
6. **Execution**: Single API call. Progress not shown (fast). On success, case list refreshes showing 1 remaining open row.
7. **Toast**: "33 cases closed successfully" with optional "View closed cases" link. Partial failure shows split count.

---

## Critical UX Moment

> The confirmation dialog **must** show the exact count ("33 cases") before Marcus clicks Confirm. Without this, he risks accidentally closing all 34 including the canonical case. The count is the trust signal.

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | Stay on `/cases` — refreshed list |
| Cancel | Stay on `/cases` — selection cleared |
| Partial failure | Stay on `/cases` — error toast with count |

---

*End of Flow-03-bulk-ops.md*
# Flow-04: Field Resolution Closure with Photo Evidence

**Trigger:** Diane is at a completed job site; needs to close the case, log resolution, attach photos, notify reporter — all on her phone
**User Stories:** US-1.2, US-4.3, US-9.2, US-10.2, US-4.1
**Journey:** JRN-02.2 — Field Resolution Closure
**Success Metric:** Case closed with 2 photos from 375 px mobile browser in ≤3 minutes

---

## Flow Diagram

```
[Diane opens uReport mobile browser]
        │
        ▼
[CAS session persists — no re-login needed]
        │
        ▼
[/cases — pre-filtered to My Department, mobile layout]
  → Large touch targets (≥44px)
  → Case 4812 "Pothole, Oak & 3rd" visible
        │
        ▼
[Taps case row → /cases/4812]
        │
        ▼
[Mobile case detail: stacked layout]
  Metadata at top (location, status visible above fold)
  Action form below metadata
  Timeline scrollable below action form
        │
        ▼
[Taps "Log Response"]
  Action form expands:
  • Action type: Response
  • Notes textarea: "Pothole filled with cold patch asphalt"
  • Substatus: Resolved
  • Notify Reporter: [toggle ON]
        │
        ▼
[Taps "Add Photos" button]
  → Native file picker opens camera roll
  → Selects 2 photos
  → Thumbnails appear inline
        │
        ▼
[Taps "Submit"]
  → POST /api/tickets/4812/history (with photo files)
        │
    ┌───┴───┐
 Success  Error
    │         └──▶ Error toast; form preserved; retry available
    ▼
[Toast: "Case 4812 closed. Reporter notified."]
  No redirect — stays on case detail
  Status badge updates to CLOSED (green) in place
  Timeline prepends new entry at top
```

---

## Steps

1. **Mobile access**: CAS session persists for the shift (8 hr JWT). Diane opens uReport in Safari mobile. No re-login. Pre-filtered "My Department" view loads immediately.
2. **Case list (mobile)**: Large tap targets. Row shows: Case ID badge, category, location summary, status pill. Overdue badge visible if applicable. Swipe-to-scroll works naturally.
3. **Case detail (mobile stacked)**: Location address and status badge visible above the fold without scrolling. Map pin shows location. Action form is below metadata — accessible without deep scrolling on mobile.
4. **Action log form**: Textarea auto-expands as Diane types. "Notify Reporter" toggle is thumb-reachable (bottom of form area). Submit button is full-width at the bottom of the form — easy to tap.
5. **Photo upload**: `<input type="file" accept="image/*" capture>` — native iOS/Android picker opens camera roll. Multiple selection supported. Thumbnails appear immediately below the form. Diane can remove a photo by tapping the "×" on the thumbnail.
6. **Submit**: Single tap. Loading indicator on the button. No spinner overlay that blocks the page.
7. **Success**: Toast notification "Case 4812 closed. Reporter notified." Status badge animates (Framer Motion, 200 ms) from blue (open) to green (closed). Timeline entry appears at the top. No redirect — Diane can immediately see confirmation.

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | Stay on `/cases/4812` — updated state |
| Submit error | Stay on `/cases/4812` — form preserved |
| Back to list | `/cases` (tap breadcrumb) |

---

*End of Flow-04-field-closure.md*
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
# Flow-06: Admin — New Service Category Configuration

**Trigger:** Jordan needs to create "E-Scooter Obstruction" category before next morning's operations
**User Stories:** US-8.1, US-8.2, US-8.3, US-7.1
**Journey:** JRN-03.1 — New Service Category Configuration
**Success Metric:** Fully configured category in ≤10 minutes, no SQL access required

---

## Flow Diagram

```
[Jordan navigates to Admin → Categories]
        │
        ▼
[/admin/categories — group tree with expand/collapse]
  "Transportation" group already exists
        │
        ▼
[Clicks "+ New Category" in Transportation row]
        │
        ▼
[Side Sheet opens (right-side panel, shadcn/ui Sheet)]
  ┌────────────────────────────────────────────────┐
  │  New Category                             [×]  │
  │  ─────────────────────────────────────────     │
  │  Basic:                                        │
  │    Name: [E-Scooter Obstruction]               │
  │    Category Group: [Transportation ▼]          │
  │    Department: [Mobility ▼]                    │
  │    Active: [✓]  Featured: [ ]                  │
  │    Description: [textarea]                     │
  │  ─────────────────────────────────────────     │
  │  Permissions:                                  │
  │    Display: [Public ▼]   Posting: [Anonymous ▼]│
  │  ─────────────────────────────────────────     │
  │  SLA:                                          │
  │    SLA Days: [5]                               │
  │    Notification Reply Email: [____]            │
  │  ─────────────────────────────────────────     │
  │  Response Templates: [+ Add Template]          │
  │    (empty)                                     │
  │                                                │
  │  [Cancel]                    [Save Category]   │
  └────────────────────────────────────────────────┘
        │
        ▼
[Jordan clicks "+ Add Template"]
  Inline template row expands:
  • Action Type: [Response ▼]
  • Template Body: [Scooter reported to vendor...]
  • Reply Email: [optional]
  [+ Add another template]
        │
        ▼
[Fills second template, clicks "Save Category"]
        │
        ▼
[POST /api/categories with nested templates]
        │
    ┌───┴───┐
 Success  Validation error
    │         └──▶ Inline errors; Sheet stays open
    ▼
[Toast: "Category saved"]
[Sheet closes; Category tree refreshes]
[New "E-Scooter Obstruction" appears under Transportation]
        │
        ▼
[Jordan opens /submit in new tab to verify]
  → "E-Scooter Obstruction" visible in Roads category group
```

---

## Steps

1. **Navigate**: Admin sidebar → "Categories". Collapsible sidebar shows "Admin" section with sub-items. Breadcrumb: `Admin > Categories`.
2. **Group context**: Category groups listed as collapsible accordions. "Transportation" expands to show child categories and "+ New Category" button inline.
3. **Side Sheet**: Opens from right edge of screen (not full-screen modal). Background is dimmed but visible — Jordan can see the category tree context he just came from.
4. **Validation**: Department dropdown validates against existing departments. If "Mobility" does not exist, Jordan sees "No departments found matching 'Mobility'" and a "Create Department" link in the dropdown.
5. **Permissions**: `postingPermissionLevel` must be ≥ permissive as `displayPermissionLevel`. If violated, inline error: "Posting permission must allow at least as many users as Display permission."
6. **Response templates**: Templates added inline within the Sheet — no separate navigation required. Each template row: action type selector + body textarea + optional reply email.
7. **Save**: Single submit. Backend reconciles templates. Toast confirms. Sheet closes and animate-out.
8. **Verify**: New category immediately visible in the public submission form (no cache flush). Jordan opens `/submit` in a new tab within seconds of saving.
9. **Delete safety**: Each category row has a "Delete" (trash icon) button. Clicking shows confirmation dialog: "Delete E-Scooter Obstruction? This cannot be undone." If associated tickets exist, delete is blocked: "Cannot delete: category has 12 associated tickets."

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | `/admin/categories` — tree refreshed |
| Cancel | `/admin/categories` — no changes |
| Validation error | Sheet stays open |
| Group delete blocked | Confirmation dialog with error message |

---

*End of Flow-06-admin-category.md*
# Screen-00: Authentication (Login)

**Route:** `/login`
**Purpose:** Branded staff login via CAS SSO or LDAP credentials
**User Stories:** F12 (Authentication)
**Journeys:** JRN-02.1 (Login), JRN-02.2 (Access)

---

## Layout — Desktop

```
┌─────────────────────────────────────────────────────────────────┐
│                    [City Logo / uReport wordmark]               │
│                    "311 Service Request Management"             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌─────────────────────────────────┐               │
│              │        Sign In to uReport        │               │
│              │                                 │               │
│              │  ┌─────────────────────────────┐│               │
│              │  │  Sign in with City SSO      ││  (CAS)        │
│              │  │  [City Logo]  CAS Login     ││               │
│              │  └─────────────────────────────┘│               │
│              │                                 │               │
│              │         ── or ──                │               │
│              │                                 │               │
│              │  Username                       │               │
│              │  [________________________]     │               │
│              │                                 │               │
│              │  Password                       │               │
│              │  [________________________]     │               │
│              │                                 │               │
│              │  [        Sign In         ]     │  (primary btn)│
│              │                                 │               │
│              │  [Error message area]           │               │
│              └─────────────────────────────────┘               │
│                                                                 │
│              Shadow-md card, max-w-sm, centered                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│  [City Logo — centered]        │
│  uReport                       │
│  311 Service Request Mgmt      │
├────────────────────────────────┤
│                                │
│ ┌────────────────────────────┐ │
│ │  Sign In to uReport        │ │
│ │                            │ │
│ │ [City SSO — full width]    │ │
│ │                            │ │
│ │  ── or ──                  │ │
│ │                            │ │
│ │ Username                   │ │
│ │ [__________________]       │ │
│ │                            │ │
│ │ Password                   │ │
│ │ [__________________]       │ │
│ │                            │ │
│ │ [      Sign In       ]     │ │
│ │                            │ │
│ │ [Error message area]       │ │
│ └────────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Sign-in actions (SSO button, LDAP form) | Card center |
| Primary | Error messages | Below form fields |
| Secondary | City branding / logo | Above card |
| Tertiary | "uReport" product name | Below logo |

---

## States

| State | Appearance | User Feedback |
|---|---|---|
| Default | Clean card, both sign-in options | N/A |
| CAS loading | SSO button shows spinner; disabled | "Redirecting to City SSO…" |
| LDAP loading | Sign In button shows spinner; form disabled | Loading spinner inside button |
| LDAP error | Red border on failed field; error message below form | "Invalid username or password" |
| CAS error | Error banner below SSO button | "SSO login failed. Please try again or use username/password." |
| Session expired (redirected) | Toast at top of card | "Your session has expired. Please sign in again." |
| Success | Brief loading spinner | (redirect to dashboard) |

---

## Interactive Elements

| Element | Type | Behavior |
|---|---|---|
| City SSO button | Primary action | Redirects to CAS; shows loading state |
| Username input | Text input | Autofocus on page load |
| Password input | Password input | Enter key submits form |
| Sign In button | Primary button | Submits LDAP form; shows spinner |
| Error message | Alert region | ARIA role="alert"; announced by screen readers |

---

## Accessibility Notes

- `aria-live="polite"` on error message region
- Autofocus on username input on page load
- Enter key submits form (keyboard-only flow)
- Loading state disables all interactive elements to prevent double-submit
- Color contrast: error red on white ≥ 4.5:1
- Skip-to-main is unnecessary on this route (no nav shell)

---

*End of Screen-00-auth.md*
# Screen-01: Navigation Shell

**Applies to:** All authenticated routes
**Purpose:** Persistent application chrome — top navbar, collapsible sidebar, breadcrumbs, mobile hamburger drawer
**User Stories:** F18 (Navigation Shell), F19 (Responsive Design)
**Journeys:** All staff journeys

---

## Layout — Desktop Full Shell

```
┌─────────────────────────────────────────────────────────────────────┐
│ NAVBAR (h-16, fixed, shadow-sm, z-50)                               │
│ ┌──────────┬──────────────────────────────────┬────────────────────┐│
│ │[≡]  Logo │  [Search bar — Cmd+K / Ctrl+K]   │ [🌙] [Avatar ▼]   ││
│ │  uReport │  Search cases, people...          │ Jordan Calloway    ││
│ └──────────┴──────────────────────────────────┴────────────────────┘│
├──────────────┬──────────────────────────────────────────────────────┤
│ SIDEBAR      │  MAIN CONTENT AREA                                   │
│ (w-64,       │  (ml-64 on desktop; full-width on mobile)            │
│  collapsible)│                                                       │
│              │  BREADCRUMBS (h-10, text-sm, text-muted)             │
│ ▾ Cases      │  Home > Cases > Case #4821                           │
│   All Cases  │  ─────────────────────────────────────────────       │
│   New Case   │                                                       │
│              │  [Page Content]                                       │
│ ▾ People     │                                                       │
│   All People │                                                       │
│              │                                                       │
│ ▾ Admin      │                                                       │
│   Categories │                                                       │
│   Departments│                                                       │
│   Substatuses│                                                       │
│   Issue Types│                                                       │
│   Contact    │                                                       │
│   Methods    │                                                       │
│   API Clients│                                                       │
│              │                                                       │
│ [◀ Collapse] │                                                       │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px) — Hamburger Drawer

```
┌─────────────────────────────────────┐
│ NAVBAR (h-14, fixed)                │
│ [☰]  uReport        [🌙] [Avatar]  │
├─────────────────────────────────────┤
│ BREADCRUMBS                         │
│ Cases > Case #4821                  │
├─────────────────────────────────────┤
│                                     │
│  [Full width content area]          │
│                                     │
└─────────────────────────────────────┘

HAMBURGER DRAWER (full-height Sheet, slides from left):
┌──────────────────────────┐
│  [×]  uReport            │
│  ─────────────────────   │
│  Marcus Rivera           │
│  311 Operator            │
│  ─────────────────────   │
│  ▾ CASES                 │
│    All Cases             │
│    New Case              │
│  ─────────────────────   │
│  ▾ PEOPLE                │
│    All People            │
│  ─────────────────────   │
│  ▾ ADMIN                 │
│    Categories            │
│    Departments           │
│    Substatuses           │
│    Issue Types           │
│    Contact Methods       │
│    API Clients           │
│  ─────────────────────   │
│  [Sign Out]              │
└──────────────────────────┘
```

---

## Sidebar Navigation Groups

| Group | Items | Icon |
|---|---|---|
| Cases | All Cases, New Case | Folder icon |
| People | All People | Users icon |
| Admin | Categories, Departments, Substatuses, Issue Types, Contact Methods, API Clients | Cog icon |

---

## Navbar Elements

| Element | Position | Behavior |
|---|---|---|
| Hamburger/collapse toggle | Left | Toggles sidebar on desktop; opens Sheet on mobile |
| City logo + "uReport" | Left (after toggle) | Links to `/dashboard` |
| Global search bar | Center (desktop) | Cmd+K/Ctrl+K focus; debounced live search |
| Dark mode toggle | Right | Toggles `.dark` class on `<html>`; persists to localStorage |
| User avatar + name | Right | Dropdown: My Profile, Sign Out |

---

## Breadcrumb Pattern

```
[Route segment 1] > [Route segment 2] > [Current page]

Examples:
  Dashboard
  Cases > All Cases
  Cases > Case #4821
  Admin > Categories
  Admin > People > Jordan Calloway
```

- Each segment (except the last) is a navigable link
- Current page segment is plain text (not a link)
- On mobile: abbreviated to last 2 segments when total width exceeds viewport
- Separator: `>` (chevron icon, `aria-hidden="true"`)

---

## Sidebar State

| State | Behavior |
|---|---|
| Expanded (default desktop) | Full width 256 px; labels visible |
| Collapsed (desktop) | Icon-only 64 px; labels shown in tooltip on hover |
| Group expanded | Child items visible (animated accordion) |
| Group collapsed | Child items hidden |
| Active route | Item highlighted with primary color background |

- Sidebar expand/collapse state persisted to `localStorage`
- Group expand/collapse state persisted to `localStorage`

---

## States

| State | Appearance |
|---|---|
| Default (desktop) | Full sidebar + navbar |
| Sidebar collapsed | Icon-only sidebar; content area wider |
| Mobile | No sidebar; hamburger only |
| Drawer open (mobile) | Sheet overlays content; backdrop dim |
| Global search active | Search bar expands; results dropdown appears |

---

## Accessibility Notes

- **Skip link**: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>` as the very first DOM element
- Sidebar navigation: `<nav aria-label="Main navigation">`
- Active item: `aria-current="page"` on the matching nav link
- Hamburger button: `aria-label="Open navigation menu"` / `aria-expanded`
- Drawer: focus trapped within Sheet when open; Escape closes
- Breadcrumb: `<nav aria-label="Breadcrumb">` with `<ol>` structure
- Dark mode toggle: `aria-label="Toggle dark mode"` + `aria-pressed`

---

*End of Screen-01-navigation.md*
# Screen-02: Dashboard

**Route:** `/dashboard`
**Purpose:** At-a-glance operational overview; landing screen after authentication
**User Stories:** US-5.1, US-5.2, US-5.3, US-5.4
**Journeys:** JRN-02.1 (Orient, View Cases), JRN-02.3 (Check Dashboard, Surface Overdue)

---

## Layout — Desktop (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR (see Screen-01)                                        │
├──────────────┬──────────────────────────────────────────────────────────┤
│ SIDEBAR      │  Dashboard                                               │
│              │  ──────────────────────────────────────────────────      │
│              │  QUICK LINKS                                             │
│              │  [+ New Case]  [All Open Cases]  [Assigned to Me]        │
│              │                                                          │
│              │  STAT CARDS (4-column grid, gap-4)                       │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│              │  │ TOTAL    │ │ OPENED   │ │ CLOSED   │ │ OVERDUE  │   │
│              │  │ OPEN     │ │ TODAY    │ │ TODAY    │ │ ●        │   │
│              │  │          │ │          │ │          │ │          │   │
│              │  │   142    │ │    18    │ │    24    │ │    4     │   │
│              │  │ open     │ │ since    │ │ resolved │ │ past SLA │   │
│              │  │ cases    │ │ midnight │ │ today    │ │          │   │
│              │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│              │  (each card is a link to /cases with filter applied)     │
│              │                                                          │
│              │  ROW 2: MAP WIDGET (2/3 width) + DONUT CHART (1/3)       │
│              │  ┌──────────────────────────┐ ┌───────────────────────┐ │
│              │  │  Open Cases Map          │ │  Case Status          │ │
│              │  │                          │ │  ┌──────────────────┐ │ │
│              │  │  [Interactive map —      │ │  │   [Donut chart]  │ │ │
│              │  │   Mapbox/Leaflet]        │ │  │   Open: 142      │ │ │
│              │  │                          │ │  │   Closed: 891    │ │ │
│              │  │   ● cluster (24)         │ │  └──────────────────┘ │ │
│              │  │      ● (7)               │ │                       │ │
│              │  │         ● (3)            │ │  [By Category] toggle │ │
│              │  │                          │ │  [By Department]      │ │
│              │  └──────────────────────────┘ └───────────────────────┘ │
│              │                                                          │
│              │  ROW 3: RECENT CASES FEED (full width)                   │
│              │  ┌──────────────────────────────────────────────────┐   │
│              │  │  Recent Cases                                    │   │
│              │  │  ────────────────────────────────────────────    │   │
│              │  │  #5102  Pothole     Santos    OPEN     2m ago    │   │
│              │  │  #5101  Graffiti    Kim       OPEN     15m ago   │   │
│              │  │  #5100  Streetlight Williams  CLOSED   1h ago    │   │
│              │  │  #5099  Tree Down  Johnson   OPEN     2h ago    │   │
│              │  │  ... (10 rows total)                             │   │
│              │  │  ────────────────────────────────────────────    │   │
│              │  │  [View all open cases →]                         │   │
│              │  └──────────────────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────────────┘
```

---

## Layout — Tablet (768 px)

```
┌──────────────────────────────────────────────────┐
│ NAVBAR (collapsed sidebar — icon only)           │
├──────────────────────────────────────────────────┤
│ [+ New Case] [All Open]  [Assigned to Me]        │
│                                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ 142     │ │ 18      │ │ 24      │ │ 4 ●     ││
│ │ Total   │ │ Today   │ │ Closed  │ │ Overdue ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                  │
│ ┌──────────────────────┐ ┌────────────────────┐ │
│ │  Map Widget          │ │  Donut Chart       │ │
│ │  (full height)       │ │                    │ │
│ └──────────────────────┘ └────────────────────┘ │
│                                                  │
│ ┌────────────────────────────────────────────┐  │
│ │  Recent Cases (scrollable)                 │  │
│ └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│ NAVBAR (hamburger)             │
├────────────────────────────────┤
│ [+ New Case] (full width btn)  │
│ [All Open Cases] (full width)  │
│ [Assigned to Me] (full width)  │
├────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐     │
│ │ 142 Open │ │ 4 Overdue│     │
│ └──────────┘ └──────────┘     │
│ ┌──────────┐ ┌──────────┐     │
│ │ 18 Today │ │ 24 Closed│     │
│ └──────────┘ └──────────┘     │
├────────────────────────────────┤
│ ┌──────────────────────────┐  │
│ │  Map Widget (h-48)        │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│ ┌──────────────────────────┐  │
│ │  Donut Chart (compact)   │  │
│ └──────────────────────────┘  │
├────────────────────────────────┤
│  Recent Cases (list)           │
│  #5102  Pothole  OPEN  2m ago │
│  #5101  Graffiti OPEN  15m    │
│  ...                          │
│  [View all open cases →]      │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement | Rationale |
|---|---|---|---|
| Primary | Overdue count (red) | Stat card row, rightmost | Actionable — requires immediate attention |
| Primary | Quick-link buttons | Top of content area | 1-click navigation to most common workflows |
| Secondary | Total Open, Today counts | Stat card row | Workload context |
| Secondary | Map widget | Row 2, left | Geographic awareness |
| Secondary | Recent cases feed | Row 3 | Incoming work queue |
| Tertiary | Donut chart | Row 2, right | Trend overview |

---

## Stat Card Design

```
┌────────────────────────────────────────┐
│  [Trend icon ↑]              OVERDUE   │
│                                        │
│         4                              │  ← large number, bold
│   cases past SLA                       │  ← label, text-muted-sm
│                                        │
│  ────────────────────────────────────  │
│  Click to view overdue cases →         │  ← hover state
└────────────────────────────────────────┘
Shadow-sm → shadow-md on hover; entire card is a link
```

**Overdue card**: Red accent border-left or red icon. Badge-style "●" indicator.

---

## Map Widget Interactions

| Action | Result |
|---|---|
| Cluster click (low zoom) | Zoom in; cluster expands |
| Pin click (high zoom) | Popover: Case ID, Category, Status, "View Case →" link |
| Map load error | Overlay: "Map unavailable. Try refreshing." |
| No Mapbox key | Leaflet with OSM tiles renders; user-visible experience unchanged |

---

## Donut Chart Interactions

| Element | Behavior |
|---|---|
| Chart segment hover | Tooltip with count and percentage |
| "By Category" button | Re-queries chart API; chart transitions |
| "By Department" button | Re-queries chart API; chart transitions |
| Chart API failure | "Chart unavailable" text + retry icon in chart area |

---

## Recent Cases Feed — Row Design

```
┌────────────────────────────────────────────────────────────────┐
│  [#5102]  Pothole         Santos, M.   [OPEN]      2 min ago  │
│           Category name   Reporter     Status pill  Time-since │
└────────────────────────────────────────────────────────────────┘
```

- Case ID in JetBrains Mono
- Status pill: color-coded (open=blue, closed-resolved=green, etc.)
- Time-since: human-readable relative (uses `date-fns formatDistanceToNow`)
- Entire row is a link to `/cases/{id}`
- Hover: row background lightens; cursor pointer

---

## States

| Widget | Loading State | Error State | Empty State |
|---|---|---|---|
| Stat cards | 4 skeleton cards (shimmer) | "—" with retry icon | N/A (zero is valid) |
| Map widget | Skeleton rectangle (h-64) | "Map unavailable" overlay | No pins shown (no open cases) |
| Donut chart | Skeleton circle | "Chart unavailable" message | Empty ring shown |
| Recent cases feed | 5 skeleton rows | Error message + retry | "No recent cases" |

---

## Quick Link Buttons

| Button | Route | Aria Label |
|---|---|---|
| + New Case | `/cases/new` | "Create a new case" |
| All Open Cases | `/cases?status=open` | "View all open cases" |
| Assigned to Me | `/cases?status=open&assignedPerson_id={userId}` | "View cases assigned to me" |

Buttons are secondary/outlined style; not primary — they should not visually compete with the stat cards.

---

*End of Screen-02-dashboard.md*
# Screen-03: Case List

**Route:** `/cases`
**Purpose:** Primary staff workspace — sortable, filterable, searchable data table with bulk operations
**User Stories:** US-3.1–3.6, US-1.5, US-11.1–11.3
**Journeys:** JRN-01.1 (Confirm), JRN-01.2 (all), JRN-01.3 (all), JRN-02.1 (View Cases, Prioritize)

---

## Layout — Desktop (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR                                                            │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  Cases                     Breadcrumb: Cases                 │
│              │  ─────────────────────────────────────────────────────────   │
│              │  TOOLBAR ROW 1                                               │
│              │  [🔍 Search cases...         ]  [⚙ Filters ▼]  [📥 Export]  │
│              │  [💾 Save Search]  [Saved Searches ▼]                        │
│              │                                                              │
│              │  FILTER CHIPS (when active)                                  │
│              │  [Status: Open ×]  [Dept: Public Works ×]  [Clear all]       │
│              │                                                              │
│              │  BULK ACTION TOOLBAR (visible when ≥1 row selected)          │
│              │  ┌──────────────────────────────────────────────────────┐   │
│              │  │  ✓ 33 cases selected  [Assign] [Change Status][Close]│   │
│              │  └──────────────────────────────────────────────────────┘   │
│              │                                                              │
│              │  Showing 1–25 of 142 cases                                  │
│              │                                                              │
│              │  DATA TABLE                                                  │
│              │  ┌──┬──────┬──────────┬──────────┬────────┬──────┬───────┐ │
│              │  │☐ │ ID   │ Date     │ Category │  Dept  │ Assi │Status │ │
│              │  │──│──────│──────────│──────────│────────│──────│───────│ │
│              │  │☐ │#5102 │ Jul 6    │ Pothole  │ Pub Wk │ —    │[OPEN] │ │
│              │  │☐ │#5101 │ Jul 6    │ Graffiti │ Parks  │ Kim  │[OPEN] │ │
│              │  │☑ │#5100 │ Jul 5    │ Tree Down│ Pub Wk │Jones │[OPEN] │ │ ← selected row (blue tint)
│              │  │☐ │#5099 │ Jul 5    │ Streetlt │ Elect  │ Lee  │[CLSD] │ │
│              │  │  │      │          │ ... 21 more rows ...         │      │ │
│              │  └──┴──────┴──────────┴──────────┴────────┴──────┴───────┘ │
│              │                                                              │
│              │  PAGINATION                                                  │
│              │  [← Prev]  [1] [2] [3] ... [6]  [Next →]    [25 per page▼] │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Layout — Filter Panel (expanded, overlays or pushes table on desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Filters                                                      [×]    │
│  ──────────────────────────────────────────────────────────────      │
│  Status        [Open ▼]                                              │
│  Substatus     [All ▼]                                               │
│  Category Group [All ▼]                                              │
│  Category      [All ▼]                                               │
│  Department    [Public Works ▼]                                      │
│  Assignee      [All ▼]                                               │
│  Issue Type    [All ▼]                                               │
│  Date From     [MM/DD/YYYY]    Date To  [MM/DD/YYYY]                 │
│                                                                      │
│  [Clear All Filters]                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│ NAVBAR (hamburger)             │
├────────────────────────────────┤
│ [🔍 Search...    ] [Filters ▼] │
│                                │
│ [Status: Open ×] [Clear all]   │
│                                │
│ Showing 1–10 of 142            │
│                                │
│ ┌──────────────────────────┐  │
│ │ #5102 — Pothole          │  │  ← card layout (no table on mobile)
│ │ Public Works  Jul 6      │  │
│ │ Reporter: Santos         │  │
│ │ [OPEN]  2m ago           │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ #5101 — Graffiti         │  │
│ │ Parks Dept   Jul 6       │  │
│ │ Reporter: Kim            │  │
│ │ [OPEN]  15m ago          │  │
│ └──────────────────────────┘  │
│  ... (10 cards total)         │
│                               │
│ [← Prev]  Page 1 of 15  [Next→]│
└────────────────────────────────┘
```

---

## Column Definitions

| Column | Sortable | Mobile visible | Notes |
|---|---|---|---|
| ☐ (checkbox) | — | Hidden (bulk select N/A on mobile) | Select All on page via header |
| Case ID | ✓ | Card title | JetBrains Mono; link to `/cases/{id}` |
| Date Submitted | ✓ | Card subtitle | Formatted: "Jul 6, 2026" |
| Category | ✓ | Card line | Category name |
| Department | ✓ | Card line | Department name |
| Assignee | ✓ | Card line | Last name or "—" if unassigned |
| Status | ✓ | Card badge | Color-coded pill (see below) |
| Location | ✓ | Hidden (collapsed on mobile) | Address text |

---

## Status Badge Colors

| Status | Substatus | Badge | CSS class |
|---|---|---|---|
| open | any | `OPEN` | `bg-blue-100 text-blue-800` |
| closed | Resolved | `RESOLVED` | `bg-green-100 text-green-800` |
| closed | Duplicate | `DUPLICATE` | `bg-gray-100 text-gray-700` |
| closed | Bogus | `BOGUS` | `bg-red-100 text-red-700` |
| closed | other | `CLOSED` | `bg-purple-100 text-purple-800` |
| open, overdue | — | `OVERDUE` badge (separate, red) | `bg-red-500 text-white` |

---

## Search Behavior

- Search input is in the toolbar — always visible above the table
- 300 ms debounce after last keypress
- Skeleton rows appear immediately on keypress (before debounce fires)
- `<mark>` highlighting on matched text in Description/Reporter column (from `ts_headline`)
- Search term encoded in URL: `/cases?q=maria+santos`
- Clearing search: "×" button inside search input; restores unfiltered list

---

## Skeleton Loading State

```
┌──┬──────────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
│  │░░░░░░░░░░│░░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│░░░░░░░░░░│
└──┴──────────┴───────────┴──────────┴──────────┴──────────┴──────────┘
5 skeleton rows, shimmer animation, column widths preserved
```

---

## Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [Empty mailbox illustration]                   │
│                                                             │
│           No cases match your filters                       │
│                                                             │
│   Try adjusting your search or clearing some filters.       │
│                                                             │
│              [Clear all filters]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Bulk Action Toolbar (appears on ≥1 selection)

```
┌─────────────────────────────────────────────────────────────────┐
│  ☑  33 cases selected         [Assign]  [Change Status]  [Close] │
└─────────────────────────────────────────────────────────────────┘
```

- Slides up with Framer Motion (200 ms) when first checkbox selected
- Slides down when all checkboxes cleared
- "X cases selected" counter updates live with each checkbox change
- Selected rows have `bg-blue-50 dark:bg-blue-900/20` tint

---

## Saved Searches

| Action | Behavior |
|---|---|
| "Save Search" button visible when | search term or filters are active |
| Click "Save Search" | Dialog prompts for bookmark name |
| "Saved Searches ▼" dropdown | Lists user's bookmarks; click recalls filter state |
| Delete bookmark | "×" next to each saved search in dropdown |
| Toast on save | "Search saved" |

---

## States Summary

| State | Appearance |
|---|---|
| Loading | 5 skeleton rows; toolbar disabled |
| Default (no search/filter) | Full table; all rows |
| Search active | `<mark>` highlights; skeleton on debounce |
| Filters active | Filter chips above table |
| Row(s) selected | Blue tint; bulk toolbar visible |
| Empty | Empty state illustration |
| API error | Error toast + "Retry" button |
| Export loading | Button shows spinner; disabled |

---

*End of Screen-03-case-list.md*
# Screen-04: Case Detail

**Route:** `/cases/:id`
**Purpose:** Full case record, inline editing, status transitions, action logging, media gallery, history timeline — all without leaving the screen
**User Stories:** US-4.1–4.4, US-1.2–1.4, US-10.2–10.4, US-9.1–9.3
**Journeys:** JRN-01.1 (Confirm), JRN-01.2 (Respond), JRN-02.2 (Review, Log Resolution, Attach Photos), JRN-02.3 (Investigate, Escalate)

---

## Layout — Desktop Split-Pane (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR                                                                      │
│ Breadcrumb: Cases > Case #5102                                              │
├──────────────┬──────────────────────┬──────────────────────────────────────┤
│ SIDEBAR      │ LEFT PANE (w-2/5)    │ RIGHT PANE (w-3/5)                   │
│              │                      │                                      │
│              │ ┌──────────────────┐ │ ┌──────────────────────────────────┐ │
│              │ │ [OPEN] Case #5102│ │ │ LOG ACTION / RESPONSE            │ │
│              │ │ Pothole          │ │ │ ─────────────────────────────── │ │
│              │ │                  │ │ │ Action Type: [Response ▼]        │ │
│              │ │ Status           │ │ │ Template: [Select template ▼]    │ │
│              │ │ [OPEN ▼]  (edit) │ │ │ Notes:                           │ │
│              │ │                  │ │ │ ┌───────────────────────────────┐│ │
│              │ │ Category [✎]     │ │ │ │ (textarea — auto-expand)      ││ │
│              │ │ Pothole          │ │ │ │                               ││ │
│              │ │                  │ │ │ └───────────────────────────────┘│ │
│              │ │ Department       │ │ │                                  │ │
│              │ │ Public Works     │ │ │ ☐ Notify Reporter                │ │
│              │ │                  │ │ │ ☐ Notify Assignee                │ │
│              │ │ Assignee [✎]     │ │ │                                  │ │
│              │ │ Carlos Rivera    │ │ │ [      Submit Action       ]     │ │
│              │ │                  │ │ ├──────────────────────────────────┤ │
│              │ │ Reporter         │ │ │ ACTIVITY TIMELINE                │ │
│              │ │ Priya Nair       │ │ │ ─────────────────────────────── │ │
│              │ │                  │ │ │ ┌──────────────────────────────┐ │ │
│              │ │ Location [✎]     │ │ │ │[↩] RESPONSE — Jul 6, 10:14am│ │ │
│              │ │ Oak & 3rd St     │ │ │ │ Carlos Rivera                │ │ │
│              │ │                  │ │ │ │ "Pothole filled with cold    │ │ │
│              │ │ SLA              │ │ │ │  patch asphalt, area secured"│ │ │
│              │ │ [▓▓▓░░░] 3/5days │ │ │ │ [Photo thumbnail x2]        │ │ │
│              │ │                  │ │ │ └──────────────────────────────┘ │ │
│              │ │ Entered: Jul 4   │ │ │ ┌──────────────────────────────┐ │ │
│              │ │ Contact: Phone   │ │ │ │[→] ASSIGNED — Jul 4, 8:52am │ │ │
│              │ │ Issue: Report    │ │ │ │ Marcus Rivera → Carlos Rivera│ │ │
│              │ │                  │ │ │ └──────────────────────────────┘ │ │
│              │ │ [Close Case]     │ │ │ ┌──────────────────────────────┐ │ │
│              │ │ [Reopen] (hidden)│ │ │ │[◯] OPENED — Jul 4, 8:50am  │ │ │
│              │ │                  │ │ │ │ Marcus Rivera                │ │ │
│              │ │ ─────────────── │ │ │ └──────────────────────────────┘ │ │
│              │ │ MAP PIN          │ │ └──────────────────────────────────┘ │
│              │ │ [mini map — pin  │ │                                      │
│              │ │  at Oak & 3rd]   │ │                                      │
│              │ │                  │ │                                      │
│              │ │ ─────────────── │ │                                      │
│              │ │ MEDIA GALLERY    │ │                                      │
│              │ │ [thumb][thumb]   │ │                                      │
│              │ │ [+ Attach Photo] │ │                                      │
│              │ └──────────────────┘ │                                      │
└──────────────┴──────────────────────┴──────────────────────────────────────┘
```

---

## Layout — Mobile Stacked (375 px)

```
┌────────────────────────────────┐
│ NAVBAR (hamburger)             │
│ ← Cases > Case #5102           │
├────────────────────────────────┤
│ [OPEN]  Case #5102  Pothole   │  ← status badge + title
│                                │
│ METADATA (stacked)            │
│ Category: Pothole              │
│ Department: Public Works       │
│ Assignee: Carlos Rivera [✎]   │
│ Reporter: Priya Nair           │
│ Location: Oak & 3rd St [✎]    │
│ SLA: [▓▓▓░░░] 3 of 5 days     │
│ Entered: Jul 4, 2026           │
│ Contact: Phone                 │
│                                │
│ [MAP PIN — compact h-36]       │
│                                │
│ [Close Case]                   │
│                                │
├────────────────────────────────┤
│ LOG ACTION                     │
│ Action Type: [Response ▼]      │
│ Template: [Select ▼]           │
│ Notes: [textarea, auto-expand] │
│ ☐ Notify Reporter              │
│ ☐ Notify Assignee              │
│ [Submit Action] (full-width)   │
├────────────────────────────────┤
│ MEDIA                          │
│ [thumb 1][thumb 2]             │
│ [+ Attach Photo]               │
├────────────────────────────────┤
│ TIMELINE                       │
│ ┌──────────────────────────┐  │
│ │ RESPONSE — Jul 6, 10:14  │  │
│ │ Carlos Rivera            │  │
│ │ "Pothole filled..."      │  │
│ │ [📷 2 photos]            │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ ASSIGNED — Jul 4, 8:52   │  │
│ │ Marcus → Carlos          │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ OPENED — Jul 4, 8:50     │  │
│ │ Marcus Rivera            │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|---|---|---|
| Primary | Status badge + Case ID + Category | Top of left pane / above fold |
| Primary | Close Case / Reopen button | Below metadata |
| Primary | Action log form | Top of right pane (above timeline) |
| Secondary | Assignee (editable) | Left pane metadata |
| Secondary | Activity timeline | Right pane (scrollable) |
| Secondary | SLA progress bar | Left pane |
| Tertiary | Map pin | Below metadata, left pane |
| Tertiary | Media gallery | Below map, left pane |

---

## Inline Editing Pattern

```
READ MODE:
  Assignee
  Carlos Rivera  [✎ Edit]

EDIT MODE (on [✎] click):
  Assignee
  [Search people...        ▼]  [✓ Save]  [✕ Cancel]

SAVING MODE (optimistic — shows new value immediately):
  Assignee
  Jenna Torres  [Saving...]

ERROR (reverts to original):
  Assignee
  Carlos Rivera  [✎ Edit]
  ⚠ Could not save. Try again.
```

- **Optimistic UI**: New value shown immediately; revert on API error
- **Fields editable**: Category, Assignee, Location, Description, Issue Type, Contact Method
- **Closed tickets**: All fields read-only for staff role; edit icons hidden. Admin role retains edit access.

---

## Close Case Dialog

```
┌────────────────────────────────────────────────┐
│  Close Case #5102                              │
│  ────────────────────────────────────────────  │
│  Substatus (required)                          │
│  [Resolved ▼]                                  │
│                                                │
│  (When "Duplicate" selected:)                  │
│  Parent Ticket ID (required)                   │
│  [_________]                                   │
│                                                │
│  Closing notes (optional)                      │
│  [textarea]                                    │
│                                                │
│  ☐ Notify reporter of closure                  │
│                                                │
│  [Cancel]              [Close Case]            │
└────────────────────────────────────────────────┘
```

After confirm: Status badge animates from blue `[OPEN]` → green `[RESOLVED]`. "Close Case" button replaces with "Reopen". Timeline prepends "CLOSED" entry.

---

## Timeline Entry Design

```
┌──────────────────────────────────────────────────────┐
│ [icon]  ACTION TYPE          Date: Jul 6 10:14 AM    │
│          Actor: Carlos Rivera                        │
│          ──────────────────────────────────          │
│          Notes text appears here, can wrap to        │
│          multiple lines as needed                    │
│                                                      │
│          [📷 photo1.jpg]  [📷 photo2.jpg]           │
│                    (thumbnail click → lightbox)      │
└──────────────────────────────────────────────────────┘
```

**Action type icons**:
- OPENED: `◯` (open circle)
- ASSIGNED: `→` (arrow)
- RESPONSE: `↩` (reply)
- COMMENT: `💬`
- CLOSED: `✕`
- UPLOAD_MEDIA: `📷`
- CHANGE_CATEGORY: `⊙`
- CHANGE_LOCATION: `📍`

---

## Lightbox (Photo Viewer)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                           [×]   │
│                                                                 │
│  [◀]          [Full-size photo centered]               [▶]     │
│                                                                 │
│              photo1.jpg — Uploaded Jul 6 by Carlos Rivera       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Opens as a full-screen modal overlay
- Previous/Next navigation (keyboard arrow keys also work)
- Close: `×` button or Escape key
- Focus trapped inside lightbox (ARIA modal pattern)
- Photo metadata below image: filename, upload date, uploader name
- On thumbnail hover (desktop): delete button (trash icon) appears; click → confirmation dialog

---

## Media Gallery

```
[thumb 1]  [thumb 2]  [thumb 3]  [+ Attach Photo]
(150×150)  (150×150)  (150×150)
```

- Thumbnails sorted by `media.uploaded ASC`
- Hover reveals delete button (staff only)
- Mobile: `<input type="file" accept="image/*" capture>` — opens native camera/gallery
- After upload: gallery refreshes; toast "Photo attached"

---

## Response Template Selector

- Appears in action log form
- Queries `GET /api/categories/{cat_id}/action-responses/{action_id}` when action type changes
- Falls back to `GET /api/actions/{action_id}` template if no category-specific template
- Selecting a template pre-fills the notes textarea
- Staff can freely edit pre-filled notes before submitting
- Changing action type resets the template selector

---

## States

| Element | Loading | Success | Error | Empty |
|---|---|---|---|---|
| Metadata panel | Skeleton fields | Fields rendered | "Case not found" + back link | — |
| Timeline | Skeleton entries (3) | Entries rendered | Error + retry | "No activity yet" |
| Media gallery | Skeleton thumbnails | Thumbnails rendered | Error message | "No photos attached" + "Attach Photo" CTA |
| Action form | — | Enabled | Field-level errors | — |
| Inline edit save | Field shows spinner | Optimistic new value | Reverts + error toast | — |

---

*End of Screen-04-case-detail.md*
# Screen-05: New Case Form (Staff)

**Route:** `/cases/new`
**Purpose:** Fast ticket intake for 311 operators during live calls; target ≤90 seconds end-to-end
**User Stories:** US-1.1, US-1.4, US-10.1, US-9.1
**Journeys:** JRN-01.1 — Live-Call Case Intake

---

## Layout — Desktop (1280 px+)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR                                                            │
│ Breadcrumb: Cases > New Case                                                │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  New Case                                                    │
│              │  ─────────────────────────────────────────────────────────   │
│              │                                                              │
│              │  ┌────────────────────────────────────────────────────────┐ │
│              │  │  REQUIRED FIELDS                                        │ │
│              │  │                                                         │ │
│              │  │  Category *                                             │ │
│              │  │  [Search categories...                        ▼]        │ │
│              │  │  → Department auto-fills: Public Works ✓                │ │
│              │  │                                                         │ │
│              │  │  Location *                                             │ │
│              │  │  [123 Oak Street, Springfield               ]           │ │
│              │  │  (address autocomplete suggestions dropdown)            │ │
│              │  │  — or —                                                 │ │
│              │  │  [Lat: ________]  [Lon: ________]  (optional fields)   │ │
│              │  │                                                         │ │
│              │  │  Description *                                          │ │
│              │  │  ┌─────────────────────────────────────────────────┐   │ │
│              │  │  │ Large pothole at the intersection...            │   │ │
│              │  │  │                                                 │   │ │
│              │  │  └─────────────────────────────────────────────────┘   │ │
│              │  │                                                         │ │
│              │  │  ──────────────────────────────────────────────────     │ │
│              │  │  OPTIONAL FIELDS                                        │ │
│              │  │                                                         │ │
│              │  │  Reporter                         Assignee              │ │
│              │  │  [Search people...      ▼]  [Search staff...    ▼]     │ │
│              │  │  [+ Create new person]        → Notification: ✓        │ │
│              │  │                                                         │ │
│              │  │  Issue Type                   Contact Method            │ │
│              │  │  [Report ▼]                   [Phone ▼]                │ │
│              │  │                                                         │ │
│              │  │  ──────────────────────────────────────────────────     │ │
│              │  │  PHOTOS (optional)                                      │ │
│              │  │  ┌─────────────────────────────────────────────────┐   │ │
│              │  │  │  ⬆ Drag & drop photos or click to browse       │   │ │
│              │  │  │  Up to 10 files · JPEG, PNG, GIF · Max 10 MB each│  │ │
│              │  │  └─────────────────────────────────────────────────┘   │ │
│              │  │  [thumb 1][thumb 2]  (after selection)                 │ │
│              │  │                                                         │ │
│              │  │  ──────────────────────────────────────────────────     │ │
│              │  │  [Cancel]                      [Create Case]            │ │
│              │  └────────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Layout — Mobile (375 px)

```
┌────────────────────────────────┐
│ NAVBAR + breadcrumb            │
│ Cases > New Case               │
├────────────────────────────────┤
│ New Case                       │
│                                │
│ Category *                     │
│ [Search categories...   ▼]     │
│ → Dept: Public Works ✓         │
│                                │
│ Location *                     │
│ [123 Oak Street...      ]      │
│                                │
│ Description *                  │
│ [textarea, full width,         │
│  auto-expand]                  │
│                                │
│ Reporter                       │
│ [Search people...       ▼]     │
│                                │
│ Assignee                       │
│ [Search staff...        ▼]     │
│                                │
│ Issue Type   Contact Method    │
│ [Report ▼]   [Phone ▼]         │
│                                │
│ Photos                         │
│ [📷 Add Photos]  (native       │
│                   file picker) │
│ [thumb][thumb]                 │
│                                │
│ [      Create Case      ]      │
│ (full-width primary button)    │
└────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Field | Rationale |
|---|---|---|
| Critical | Category | Drives department routing and SLA |
| Critical | Location | Geographic record; required for tracking |
| Critical | Description | Core case content |
| Secondary | Reporter | Caller identity; searchable later |
| Secondary | Assignee | Routing; triggers notification |
| Tertiary | Issue Type, Contact Method | Classification; less urgent |
| Tertiary | Photos | Supporting evidence; not required |

---

## Category Autocomplete Behavior

```
User types "pot" →

┌─────────────────────────────────────────────────────┐
│ [Pothole                          ] Roads & Sidewalks│
│ [Pothole — Emergency              ] Roads & Sidewalks│
│ [Pothole Report                   ] 311 Services     │
└─────────────────────────────────────────────────────┘
```

- After selection: `→ Department: Public Works ✓` auto-populates
- Department label animates in (Framer Motion, 150 ms)
- If category has a default assignee, Assignee field also pre-populates

---

## Reporter Search + Inline Create

```
User types "Priya" →
┌──────────────────────────────────────────┐
│  Priya Nair  priya@email.com             │
│  Priya Singh  (no email)                 │
│  ─────────────────────────────────────   │
│  + Create new person "Priya"             │
└──────────────────────────────────────────┘
```

Clicking "+ Create new person" opens a **mini Sheet** (right side panel) with inline person creation form. Sheet closes on save; reporter field fills with the new person's name.

---

## Assignee Notification Confirmation

When an assignee is selected:
```
Assignee
[Carlos Rivera ×]
✓ Email notification will be sent to carlos@city.gov
```

If the assignee has no notification email:
```
⚠ No notification email on file for this person
```

---

## Photo Upload Zone

| State | Appearance |
|---|---|
| Default | Dashed border rectangle; upload icon; helper text |
| Drag over | Solid primary blue border; "Drop photos here" |
| File selected | Thumbnail grid below zone; "×" remove per thumbnail |
| Error (size) | Red border on that thumbnail; "Exceeds 10 MB" inline |
| Error (type) | Red border; "Only JPEG, PNG, GIF accepted" inline |

---

## Form Validation

| Field | Rule | Error Message |
|---|---|---|
| Category | Required; must be active | "Please select a category" |
| Location | Address string OR lat/lon required | "Please enter a location or drop a pin" |
| Description | Required, min 1 char | "Please enter a description" |
| Lat | -90 to 90 | "Latitude must be between -90 and 90" |
| Lon | -180 to 180 | "Longitude must be between -180 and 180" |
| Photo | ≤10 MB, JPEG/PNG/GIF | Per-file inline error |

- Validation fires on **Submit** (not on blur) for required fields — minimize interruption during live call
- Exception: email field validates on blur if user moves away

---

## States

| State | Appearance |
|---|---|
| Default | Blank form; all required fields unlabeled (placeholder text) |
| Submitting | "Create Case" button shows spinner; form fields disabled |
| Success | Redirect to `/cases/{id}` + toast "Case #4821 created successfully" |
| Validation error | Required fields highlighted red; error text below each; focus moves to first error |
| Network error | Error toast "Failed to create case. Please try again." + retry; form data preserved |

---

## UX Design Decision — Single Screen vs. Multi-Step

The staff New Case form is intentionally a **single scrollable screen** (not a wizard). During a live phone call, Marcus cannot afford to navigate steps. All required and optional fields are visible and reachable in one scroll. The public submission form (Screen-07) uses a multi-step wizard because Priya is on mobile and the wizard reduces cognitive load for an unfamiliar user.

---

*End of Screen-05-new-case.md*
# Screen-06: Search Results

**Route:** `/cases?q={term}&...` (search is embedded in the Case List view)
**Purpose:** Live full-text search with highlighted keyword matches, filter chip combination, empty state
**User Stories:** US-3.1, US-11.1, US-11.2, US-11.3
**Journeys:** JRN-01.2 (Search, Refine, Identify stages)

---

## Layout — Search Active State (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR                                                            │
│ Breadcrumb: Cases > Search: "maria santos"                                  │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  Cases                                                       │
│              │                                                              │
│              │  ┌──────────────────────────────────────────────────────┐  │
│              │  │🔍 [maria santos                               ×]      │  │
│              │  │                                         [Filters ▼]  │  │
│              │  └──────────────────────────────────────────────────────┘  │
│              │                                                              │
│              │  ACTIVE FILTER CHIPS                                         │
│              │  [Search: "maria santos" ×]  [Address: Elm Ave ×]           │
│              │  [Clear all filters]                                         │
│              │                                                              │
│              │  Showing 1 of 3 cases (search results)                      │
│              │                                                              │
│              │  ┌──┬──────┬──────────────────────────────────┬──────────┐ │
│              │  │☐ │ ID   │ Description / Reporter            │ Status   │ │
│              │  │──│──────│──────────────────────────────────│──────────│ │
│              │  │☐ │#4892 │ Reported by: Maria Santos        │ [OPEN]   │ │
│              │  │  │      │ "Broken streetlight on           │          │ │
│              │  │  │      │  <mark>Elm Avenue</mark> near    │ Jul 4    │ │
│              │  │  │      │  Oak Street. Light has been      │ Streetlt │ │
│              │  │  │      │  out for 2 weeks."               │ Electric │ │
│              │  └──┴──────┴──────────────────────────────────┴──────────┘ │
│              │                                                              │
│              │  [← Prev]  Page 1 of 1  [Next →]    [10 per page ▼]        │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Search-Specific Column Behavior

When search is active, the **Description** column expands to show the `ts_headline` snippet:

```
Normal (no search):
┌───────────────────────────────────────────────────────────────────┐
│ #4892  │ Streetlight │ Electric Dept │ Santos, M. │ [OPEN] │ Elm  │
└───────────────────────────────────────────────────────────────────┘

Search active ("elm avenue"):
┌─────────────────────────────────────────────────────────────────────────┐
│ #4892 — Streetlight — Maria Santos — [OPEN] — Jul 4                    │
│                                                                         │
│ "Broken streetlight on <mark>Elm Avenue</mark> near Oak Street. Light   │
│  has been out for two weeks causing traffic concerns..."                 │
│                                                                         │
│ Reporter: <mark>Maria Santos</mark>   Location: <mark>Elm Ave</mark>    │
└─────────────────────────────────────────────────────────────────────────┘
```

- `<mark>` elements: `background-color: yellow` (light mode) / `background-color: #854d0e` (dark mode)
- Sanitized via DOMPurify before rendering (XSS prevention)
- Multiple matches per snippet: all highlighted
- When search is cleared: `<mark>` elements removed; normal description column resumes

---

## Search Input Behavior

| Event | Behavior |
|---|---|
| User types | Skeleton rows appear after first keypress (before debounce) |
| 300 ms inactivity | API call fires; results update |
| Enter key | Same as 300 ms debounce (immediate) |
| "×" in search box | Search cleared; full list returns; other filters preserved |
| Cmd+K / Ctrl+K | Focus jumps to search input from anywhere on the page |
| 255+ characters typed | Input truncates silently (browser maxlength) |

---

## Combined Search + Filter State

```
FILTER CHIPS ROW (when both search and filters active):
[Search: "pothole" ×]  [Status: Open ×]  [Dept: Public Works ×]  [Clear all]
```

- Search term chip and filter chips coexist
- Removing one does not clear the others
- URL encodes both: `/cases?q=pothole&status=open&department_id=3`
- "Clear all filters" removes ALL chips including search

---

## Skeleton State During Search (300 ms debounce)

```
┌──────────────────────────────────────────────────────┐
│ [🔍 maria santos ...]                                 │
│                                                      │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← shimmer row 1
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← shimmer row 2
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← shimmer row 3
└──────────────────────────────────────────────────────┘
```

Skeleton appears instantly on keypress — the user sees visual feedback before results arrive.

---

## Empty State (Zero Search Results)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [Magnifying glass illustration]                │
│                                                             │
│         No cases match "pterodactyl report"                 │
│                                                             │
│   Try a different search term or adjust your filters.       │
│                                                             │
│   [Clear search]          [Clear all filters]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Shows the actual search term in the empty state message
- "Clear search" removes only the search term (preserves filters)
- "Clear all filters" removes everything

---

## Saved Search Integration

```
SAVE SEARCH BUTTON (visible when search or filters are active):
[💾 Save Search]

CLICK → Dialog:
┌──────────────────────────────────────────┐
│  Save this search                        │
│  ────────────────────────────────────    │
│  Search name                             │
│  [Maria Santos - Elm Ave streetlight]    │
│                                          │
│  This will save: q=maria santos,         │
│  address=Elm Ave                         │
│                                          │
│  [Cancel]              [Save Search]     │
└──────────────────────────────────────────┘

SAVED SEARCHES DROPDOWN:
[📚 Saved Searches ▼]
  Maria Santos - Elm Ave streetlight  [×]
  My Dept Open Cases                  [×]
  Overdue Potholes                    [×]
```

---

## Mobile Search Layout (375 px)

```
┌────────────────────────────────┐
│ [🔍 Search...         ×]       │
│ [Filters ▼]                    │
│                                │
│ [Search: "elm ave" ×]          │
│ [Clear all]                    │
│                                │
│ 1 result                       │
│                                │
│ ┌──────────────────────────┐  │
│ │ #4892 — Streetlight      │  │
│ │ [OPEN]  Jul 4            │  │
│ │ Reporter: Maria Santos   │  │
│ │ "Broken streetlight on   │  │
│ │  Elm Avenue near Oak..." │  │
│ │ (mark highlighted)       │  │
│ └──────────────────────────┘  │
└────────────────────────────────┘
```

- Card layout on mobile (same as Case List mobile)
- Search snippet visible within the card
- `<mark>` highlighting preserved in card view

---

## States

| State | Appearance |
|---|---|
| No search term | Normal case list; no filter chip for search |
| Typing (< 300 ms) | Skeleton rows immediately; previous results still visible underneath |
| Loading (API call) | Skeleton rows; spinner in search input right side |
| Results returned | Rows with `<mark>` highlights; count updated |
| Zero results | Empty state component |
| Search cleared | Normal list resumes; marks disappear; count resets |
| API error | Error toast; previous results preserved |

---

*End of Screen-06-search-results.md*
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
# Screen-08: Admin Panels

**Routes:** `/admin/people`, `/admin/departments`, `/admin/categories`, `/admin/substatuses`, `/admin/issue-types`, `/admin/contact-methods`, `/admin/clients`
**Purpose:** CRUD management for all system configuration entities
**User Stories:** US-6.1–6.4, US-7.1–7.2, US-8.1–8.3, F13, JRN-03.2
**Journeys:** JRN-03.1 (all stages), JRN-03.2 (all stages)

---

## Shared Admin Panel Layout Pattern

All admin panels share the same shell layout:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR + SIDEBAR (admin section active)                                     │
│ Breadcrumb: Admin > [Panel Name]                                            │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │  [Panel Name]                                                │
│ (admin group │  ─────────────────────────────────────────────────────────   │
│  expanded)   │  TOOLBAR                                                     │
│              │  [🔍 Search...]   [Role: All ▼]   [+ New {Entity}]           │
│              │                                                              │
│              │  DATA TABLE                                                  │
│              │  ┌──────────────────────────────────────────────────────┐   │
│              │  │ Column 1 │ Column 2 │ Column 3 │ Actions             │   │
│              │  │──────────│──────────│──────────│─────────────────── │   │
│              │  │ Value    │ Value    │ Value    │ [Edit] [Delete]     │   │
│              │  │ ░░░░░░░░ │ ░░░░░░░░ │ ░░░░░░░░ │ (skeleton rows)     │   │
│              │  └──────────────────────────────────────────────────────┘   │
│              │                                                              │
│              │  PAGINATION (if needed)                                      │
│              │  [← Prev]  Page 1 of 4  [Next →]                            │
│              │                                                              │
│              │  RIGHT SIDE SHEET (opens on Edit/New — 40% viewport width)  │
│              │  ┌─────────────────────────────────────────────────────┐    │
│              │  │  Edit / New {Entity}                          [×]   │    │
│              │  │  ─────────────────────────────────────────────────  │    │
│              │  │  [Form fields]                                       │    │
│              │  │  [Sub-panels — tabs or accordion]                   │    │
│              │  │                                                      │    │
│              │  │  [Cancel]                     [Save]                │    │
│              │  └─────────────────────────────────────────────────────┘    │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Admin — People (`/admin/people`)

### Table Columns

| Column | Type | Notes |
|---|---|---|
| Name | Text | "Last, First" format; link to person detail |
| Organization | Text | Optional; may be empty |
| Department | Badge | Department name |
| Role | Badge | `Admin` (red) / `Staff` (blue) / `Public` (gray) |
| Username | Mono text | JetBrains Mono; may be empty |
| Emails | Count | "3 emails" — shows count with notification flag |
| Actions | Icon buttons | [✎ Edit] [🗑 Delete] |

### People List Wireframe

```
┌────────────────────────────────────────────────────────────────────────┐
│  People                                                                │
│  ──────────────────────────────────────────────────────────────────    │
│  [🔍 Search by name, email, username...]    [Role: All ▼]   [+ New]   │
│                                                                        │
│  ┌──────────────┬──────────────┬──────────┬──────┬──────┬──────────┐  │
│  │ Name         │ Department   │ Role     │ User │ Emails│ Actions  │  │
│  │──────────────│──────────────│──────────│──────│───────│──────────│  │
│  │ Calloway, J. │ IT Admin     │ [Admin]  │ jord │ 2     │ [✎][🗑] │  │
│  │ Rivera, M.   │ 311 Center   │ [Staff]  │ marc │ 1     │ [✎][🗑] │  │
│  │ Kowalski, D. │ Public Works │ [Staff]  │ dian │ 1 ✉  │ [✎][🗑] │  │
│  │ Nair, P.     │ —            │ [Public] │ —    │ 1     │ [✎][🗑] │  │
│  └──────────────┴──────────────┴──────────┴──────┴───────┴──────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

`✉` icon indicates email with `usedForNotifications = true`.

### New/Edit Person Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Person: Diane Kowalski                             [×]    │
│  ─────────────────────────────────────────────────────────────  │
│  First Name          Last Name                                  │
│  [Diane            ] [Kowalski            ]                     │
│                                                                 │
│  Middle Name         Organization                               │
│  [               ]   [City of Springfield  ]                    │
│                                                                 │
│  Department          Role                                       │
│  [Public Works ▼]    [Staff ▼]                                  │
│                                                                 │
│  Username  (max 40 chars)                                       │
│  [diane_k                                ]                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  EMAILS  [+ Add Email]                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [diane@city.gov     ] Label:[Work] [✉ Notify] [🗑]       │  │
│  │ [diane@personal.com ] Label:[Home] [  Notify] [🗑]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  PHONES  [+ Add Phone]                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [(555) 555-1234    ] Label:[Office]                 [🗑] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ADDRESSES  [+ Add Address]                                     │
│  (collapsed — click to expand)                                  │
│                                                                 │
│  [Cancel]                                       [Save Person]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin — Departments (`/admin/departments`)

### Table Columns

| Column | Notes |
|---|---|
| Department Name | Link to edit sheet |
| Default Person | Staff member name or "—" |
| Category Count | Count of associated categories |
| Actions | [✎ Edit] [🗑 Delete] |

### Edit Department Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Department: Public Works                           [×]    │
│  ─────────────────────────────────────────────────────────────  │
│  Department Name *                                              │
│  [Public Works                                     ]            │
│                                                                 │
│  Default Assignee                                               │
│  [Search staff...                   ▼] [Clear]                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ACTION TYPES  (checklist — dept can use these in responses)    │
│  ☑ Response    ☑ Comment    ☑ Assignment                        │
│  ☐ Inspection  ☑ Escalation ☐ Review                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  CATEGORIES (read-only list)                                    │
│  • Pothole           • Road Damage                              │
│  • Street Repair     (link → /admin/categories)                 │
│                                                                 │
│  [Cancel]                                   [Save Department]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin — Categories (`/admin/categories`)

### Category Group Tree Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Categories                                                          │
│  ────────────────────────────────────────────────────────────────    │
│  [+ New Group]                                                       │
│                                                                      │
│  ▼ Roads & Sidewalks  (4 categories)              [✎ Edit] [🗑]     │
│    • Pothole                       Pub Works  [Active]  [✎][🗑]     │
│    • Cracked Sidewalk              Pub Works  [Active]  [✎][🗑]     │
│    • Road Damage                   Pub Works  [Active]  [✎][🗑]     │
│    • Street Sign Missing           Pub Works  [Active]  [✎][🗑]     │
│    [+ New Category under this group]                                 │
│                                                                      │
│  ▶ Parks & Greenspace  (3 categories)             [✎ Edit] [🗑]     │
│                                                                      │
│  ▶ Transportation  (2 categories)                 [✎ Edit] [🗑]     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### New/Edit Category Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  New Category                                            [×]    │
│  ─────────────────────────────────────────────────────────────  │
│  BASIC                                                          │
│  Name *                                                         │
│  [E-Scooter Obstruction                          ]              │
│                                                                 │
│  Category Group                                                 │
│  [Transportation ▼]                                             │
│                                                                 │
│  Department *                                                   │
│  [Mobility ▼]                                                   │
│                                                                 │
│  Description                                                    │
│  [textarea — optional]                                          │
│                                                                 │
│  ☑ Active    ☐ Featured                                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  PERMISSIONS                                                    │
│  Display Permission   [Public ▼]                                │
│  Posting Permission   [Anonymous ▼]                             │
│  ⚠ Posting must be ≥ permissive as Display                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  SLA & ASSIGNMENT                                               │
│  SLA Days        [5      ]    Default Person  [Search... ▼]     │
│  Reply Email     [admin@city.gov              ]                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  AUTO-CLOSE                                                     │
│  ☐ Enable auto-close                                            │
│  Auto-close Substatus  [Resolved ▼]  (shown when enabled)       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  RESPONSE TEMPLATES  [+ Add Template]                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Action: [Response ▼]                                     │  │
│  │ Template:                                                │  │
│  │ [Scooter has been reported to the vendor...  textarea]   │  │
│  │ Reply Email: [vendor@scootco.com           ]             │  │
│  │                                            [🗑 Remove]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  [+ Add another template]                                       │
│                                                                 │
│  [Cancel]                                     [Save Category]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin — API Clients (`/admin/clients`)

### Table Columns

| Column | Notes |
|---|---|
| Client Name | Organization name |
| Contact Person | Person record link |
| Contact Method | Email/Phone/Web |
| API Key | Masked: `••••••••-••••-••••-1234` (last 4 visible) |
| Actions | [✎ Edit] [🗑 Delete] |

### New Client Sheet — API Key Display (One-Time)

```
┌─────────────────────────────────────────────────────────────────┐
│  Client Created: CivicPath Inc.                          [×]    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ⚠️ Copy this API key now — it will not be shown again.         │
│                                                                 │
│  API Key                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ f7a4b2c9-1d3e-4f6a-8b2c-9d0e1f2a3b4c            [Copy] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Share this key with CivicPath Inc. to enable API access.       │
│                                                                 │
│  [View Swagger UI / API Docs]  (link to /swagger-ui.html)       │
│                                                                 │
│  [Done]                                                         │
└─────────────────────────────────────────────────────────────────┘
```

"Copy" button: copies to clipboard; label changes to "Copied ✓" for 2 seconds.

---

## Admin — Lookup Table Panels (Substatuses, Issue Types, Contact Methods)

These three panels share an identical minimal CRUD pattern:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Substatuses                                                         │
│  ────────────────────────────────────────────────────────────────    │
│  [+ New Substatus]                                                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Name                           Description         Actions     │ │
│  │ ──────────────────────────     ─────────────────   ──────────  │ │
│  │ Resolved                       Issue fixed         [✎][🗑]    │ │
│  │ Duplicate                      Same as another     [✎][🗑]    │ │
│  │ Bogus                          Invalid report      [✎][🗑]    │ │
│  │ Referred                       Sent to other dept  [✎][🗑]    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

Inline editing: clicking [✎] opens a Sheet with name + description fields.

---

## Delete Confirmation Dialog (All Admin Panels)

```
┌─────────────────────────────────────────────────────────────┐
│  Delete Public Works?                                       │
│  ───────────────────────────────────────────────────────    │
│  This action cannot be undone.                              │
│                                                             │
│  If this department has associated categories, the         │
│  deletion will be blocked.                                  │
│                                                             │
│  [Cancel]                          [Delete Department]      │
└─────────────────────────────────────────────────────────────┘
```

**Safety check failure (blocked delete):**
```
┌─────────────────────────────────────────────────────────────┐
│  Cannot Delete Public Works                                 │
│  ───────────────────────────────────────────────────────    │
│  ⚠ This department has 4 associated categories.             │
│     Reassign or delete those categories first.              │
│                                                             │
│  [View categories] (link)            [Close]                │
└─────────────────────────────────────────────────────────────┘
```

---

## States (All Admin Panels)

| State | Appearance |
|---|---|
| Loading table | Skeleton rows (5 rows) with shimmer |
| Table loaded | Rows with data |
| Empty table | "No {entities} yet. Create the first one." + CTA button |
| Sheet open | Right-side sheet overlays with backdrop; main table visible behind |
| Saving | "Save" button shows spinner; form disabled |
| Save success | Toast "Department saved"; sheet closes; table refreshes |
| Save error | Inline errors on fields; sheet stays open; toast for network errors |
| Delete loading | Button shows spinner |
| Delete success | Toast "{Entity} deleted"; row removed from table (optimistic) |
| Delete blocked | Error dialog with reason |

---

*End of Screen-08-admin-panels.md*
# Y0 — Interaction Patterns

---

## Pattern 1: Toast Notifications

**When to use:** Every async save, bulk operation result, network error, email notification warning
**Component:** shadcn/ui `Toast` (via `useToast` hook)

```
TOAST ANATOMY (top-right, stacks):
┌────────────────────────────────────────────────────────┐
│  ✓  Case #4821 created successfully      [View] [×]   │  ← success
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│  ⚠  Email notification failed to send          [×]    │  ← warning
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│  ✕  Failed to save. Please try again.  [Retry] [×]   │  ← error
└────────────────────────────────────────────────────────┘
```

| Variant | Color | Icon | Auto-dismiss |
|---|---|---|---|
| Success | Green | ✓ check | 4 seconds |
| Warning | Amber | ⚠ | 6 seconds |
| Error | Red | ✕ | Manual dismiss only |
| Info | Blue | ℹ | 4 seconds |

- Position: `top-right` on desktop, `bottom-center` on mobile (above thumb reach)
- Maximum 3 toasts stacked simultaneously; oldest dismissed first
- ARIA: `role="status"` (success/info) or `role="alert"` (warning/error)
- Keyboard: `Escape` dismisses topmost toast

---

## Pattern 2: Confirmation Dialog

**When to use:** All destructive or irreversible actions — bulk close, single close with substatus, delete entity, reopen
**Component:** shadcn/ui `Dialog`

```
┌────────────────────────────────────────────────────────────┐
│  [Dialog Title — describes the action]             [×]    │
│  ──────────────────────────────────────────────────────    │
│  [Body — explains what will happen, how many affected]     │
│                                                            │
│  [Input fields if needed — substatus, notes, etc.]         │
│                                                            │
│  ──────────────────────────────────────────────────────    │
│  [Cancel]                          [Confirm Action]        │
└────────────────────────────────────────────────────────────┘
```

**Rules:**
- Cancel is ALWAYS present and equally visible — never hidden or de-emphasized
- Confirm button text describes the action, not just "OK" or "Confirm" ("Close Case", "Delete Department", "Bulk Close 33 Cases")
- Destructive action buttons: `variant="destructive"` (red) — only for permanent deletes, not for status changes
- Focus trap: Escape closes dialog (unless a required field is empty); focus returns to trigger element
- Focus on open: first interactive field (or Cancel if form is review-only)
- ARIA: `aria-modal="true"`, `aria-labelledby` pointing to dialog title

**Examples:**

| Action | Title | Confirm Button |
|---|---|---|
| Close case | "Close Case #5102" | "Close Case" |
| Bulk close | "Close 33 Cases" | "Close 33 Cases" |
| Delete department | "Delete Public Works?" | "Delete Department" |
| Delete person | "Delete Diane Kowalski?" | "Delete Person" |
| Reopen case | "Reopen Case #5102?" | "Reopen Case" |
| Delete photo | "Delete this photo?" | "Delete Photo" |

---

## Pattern 3: Skeleton Loading

**When to use:** Every data fetch — table rows, stat cards, case detail panels, timeline
**Component:** shadcn/ui `Skeleton`

```
SKELETON ROW (table):
┌──────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░ │ ░░░░░░░░░░░░ │ ░░░░░░░░░ │ ░░░░░░░░░░░ │ ░░░░ │ ░░░░░ │
└──────────────────────────────────────────────────────────────────────┘
(shimmer animation: background moves left-to-right, 1.5s loop)

SKELETON CARD (stat card):
┌────────────────┐
│ ░░░░░░░░░░░░░░ │  ← label skeleton
│                │
│   ░░░░░░░░░    │  ← number skeleton (taller)
│                │
│ ░░░░░░░░░░░░   │  ← sub-label skeleton
└────────────────┘
```

- Always show the same number of skeleton items as the expected result count
- For unknown counts: show 5 skeleton rows for tables, 3 for timelines, 4 for stat cards
- Skeletons preserve column widths so the layout doesn't shift when real data arrives
- ARIA: `aria-busy="true"` on the container while loading; `aria-busy="false"` after data loads

---

## Pattern 4: Inline Editing

**When to use:** Editable fields on Case Detail metadata panel
**Pattern:** Read → Edit → Save/Cancel

```
STATES:
Read:   [Field Value                ] [✎]
Edit:   [___Field Input___________] [✓ Save] [✕ Cancel]
Saving: [New Value                 ] [Saving... ⟳]  ← optimistic
Error:  [Original Value            ] [✎]
        ⚠ Could not save changes. Try again.
```

- Entire field label + value row is clickable to enter edit mode (not just the ✎ icon)
- Escape key cancels editing
- Enter key submits for single-line inputs; Shift+Enter for multiline textareas
- Tab moves focus to next editable field
- Closed ticket fields: ✎ icon hidden entirely; value is plain text only

---

## Pattern 5: Filter Chips

**When to use:** Active filters on Case List; active search term display

```
CHIP ANATOMY:
┌──────────────────────────┐
│  Status: Open  [×]       │  ← label + value + remove button
└──────────────────────────┘
```

- Each active filter = one chip
- Search term chip: `Search: "maria santos" [×]`
- "×" on chip removes that single filter and refetches
- "Clear all filters" link appears when ≥1 chip is active
- Chips wrap to multiple rows on narrow viewports
- Chips are keyboard-navigable; Tab moves between chips; Enter/Space activates remove "×"
- ARIA: `role="button"` on remove "×" with `aria-label="Remove filter: Status Open"`

---

## Pattern 6: Status Badge Pills

**When to use:** Case list rows, case detail header, recent cases feed, timeline entries

```
Badge rendering:
[OPEN]        → bg-blue-100   text-blue-800  (border-blue-200)
[RESOLVED]    → bg-green-100  text-green-800
[DUPLICATE]   → bg-gray-100   text-gray-700
[BOGUS]       → bg-red-100    text-red-700
[CLOSED]      → bg-purple-100 text-purple-800
[OVERDUE]     → bg-red-500    text-white      (solid — more urgent)
```

Dark mode equivalents use the same semantic tokens (CSS variables):
```
[OPEN] dark: bg-blue-900/40 text-blue-300
```

- Badges are `<span>` elements (not interactive unless in a filter dropdown)
- Font: Inter, uppercase, font-semibold, text-xs, px-2 py-0.5, rounded-full
- Min-width: enough for the longest text ("DUPLICATE") to avoid layout shift

---

## Pattern 7: Side Sheet (Admin CRUD)

**When to use:** All admin create/edit operations (Person, Department, Category, etc.)
**Component:** shadcn/ui `Sheet` with `side="right"`

```
SHEET BEHAVIOR:
- Opens from the RIGHT edge of the viewport
- Width: 480 px on desktop; full width on mobile
- Background: main content visible but dimmed (backdrop opacity-40)
- Closing: [×] button, Escape key, or clicking backdrop
- Focus: trapped within sheet when open
- Scroll: sheet content scrolls independently; main content is fixed

SHEET HEADER:
┌──────────────────────────────────────────────────────────────┐
│  [Sheet Title]                                        [×]   │
│  [Optional subtitle / description]                          │
├──────────────────────────────────────────────────────────────┤
│  [Scrollable form content]                                   │
├──────────────────────────────────────────────────────────────┤
│  [Cancel]                                    [Save]         │  ← sticky footer
└──────────────────────────────────────────────────────────────┘
```

- Sticky footer ensures Save/Cancel are always visible regardless of form scroll position
- Form sections separated by horizontal rules with section labels
- ARIA: `role="dialog"`, `aria-labelledby` pointing to sheet title, `aria-modal="true"`

---

## Pattern 8: Optimistic UI

**When to use:** Inline field saves on Case Detail; status badge transitions; timeline prepends

**Sequence:**
1. User clicks Save
2. **Immediately**: UI shows new value; spinner appears on field; action logged pessimistically
3. API call fires in background
4. **On success**: Spinner removed; toast "Case updated"
5. **On failure**: UI reverts to original value; error toast; field re-enters edit mode

This pattern is critical for Marcus during live calls — he cannot wait 500 ms for the UI to update.

---

## Pattern 9: Debounced Live Search

**When to use:** Case list search, admin people search, reporter search, category autocomplete

**Behavior:**
1. User types character(s)
2. Skeleton/loading indicator appears **immediately** (within 16 ms)
3. Wait 300 ms from last keypress
4. API call fires with current input value
5. Results replace skeleton
6. On fast typing: only the most recent request is used; previous requests cancelled (AbortController)

**Edge cases:**
- Minimum query length: 1 character (no minimum — every character triggers search after debounce)
- Empty string: returns full unfiltered list (with other filters preserved)
- Max 255 characters: enforced via HTML `maxlength`; no server-side truncation error shown

---

## Pattern 10: Framer Motion Animation Variants

**Page transitions:**
```javascript
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};
// duration: 200ms, easing: easeOut
```

**Stagger children (e.g., stat cards, list rows):**
```javascript
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 }
};
```

**Status badge transition:**
```javascript
// Badge color change on close/reopen
// Use layout animation: layoutId="status-badge"
// Color animates via CSS variable; no JS color interpolation
```

**Wizard step transitions (public form):**
```javascript
const stepVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 })
};
// duration: 200ms
```

**prefers-reduced-motion handling:**
```javascript
const motionSafe = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// All Framer Motion animations wrapped in motionSafe check
// Or use AnimatePresence with reducedMotion="user" prop
```

---

## Pattern 11: Bulk Action Toolbar

**When to use:** Case list — appears when ≥1 row checkbox is checked

```
TOOLBAR BEHAVIOR:
- Enter animation: slides up from bottom of table with Framer Motion (y: 100 → 0, 200ms)
- Exit animation: slides down when all selections cleared
- Sticks to bottom of viewport on mobile (fixed positioning)
- On desktop: appears inline above pagination

TOOLBAR CONTENT:
┌─────────────────────────────────────────────────────────────────┐
│  ☑ 33 cases selected          [Assign]  [Change Status]  [Close]│
└─────────────────────────────────────────────────────────────────┘

ACTIONS:
- Assign → Opens dialog with staff search/select
- Change Status → Opens dialog with status dropdown
- Close → Opens dialog with required substatus selector
```

---

*End of Y0-patterns.md*
# Y1 — Responsive Design Considerations

**Breakpoints:**
- **Mobile**: `< 768 px` (375 px minimum — tested at 375 px)
- **Tablet**: `768 px – 1279 px`
- **Desktop**: `≥ 1280 px`

**Design approach**: Mobile-first CSS. Base styles for mobile; `md:` and `lg:` modifiers for tablet/desktop.

---

## Global Responsive Rules

| Rule | Mobile | Tablet | Desktop |
|---|---|---|---|
| Sidebar | Hidden (hamburger drawer) | Icon-only (w-16) | Full (w-64) or collapsed |
| Content area | Full width | ml-16 | ml-64 or ml-16 |
| Grid columns | 1-col | 2-col | 2–4 col depending on screen |
| Touch targets | ≥ 44 × 44 px | ≥ 44 × 44 px | ≥ 36 × 36 px |
| Font sizes | Base 16 px | Base 16 px | Base 16 px |
| Horizontal scroll | NEVER | NEVER | NEVER |
| Table layout | Card layout | Compact table | Full table |

---

## Screen-by-Screen Responsive Adaptations

### Login Screen

| Viewport | Adaptation |
|---|---|
| Mobile | Card fills full width with `mx-4` padding; CAS button is full-width |
| Tablet | Card centered, max-width 400 px |
| Desktop | Card centered, max-width 420 px; logo above card |

### Navigation Shell

| Viewport | Adaptation |
|---|---|
| Mobile | No sidebar; hamburger `[☰]` in navbar opens a Sheet drawer |
| Tablet | Sidebar collapses to icon-only (w-16); tooltip on icon hover |
| Desktop | Full sidebar (w-64); collapsible to icon-only via toggle button |

Breadcrumbs:
- Mobile: truncated to last 2 segments when too wide; `…` prefix shown
- Tablet/Desktop: full breadcrumb trail visible

### Dashboard

| Viewport | Adaptation |
|---|---|
| Mobile | Single column: Quick links → Stat cards (2-col grid) → Map → Donut → Feed |
| Tablet | 2-col grid: Stat cards 4-col row; Map (2/3) + Donut (1/3); Feed below |
| Desktop | Same as tablet but sidebar visible |

Stat cards: Always show 4 in a 2×2 grid on mobile, 4-col row on tablet+.

Map widget height:
- Mobile: `h-48` (192 px)
- Tablet: `h-64` (256 px)
- Desktop: `h-80` (320 px)

### Case List

| Viewport | Adaptation |
|---|---|
| Mobile | Card layout (no table); each card shows: ID, category, reporter, status, date; filter panel is a Sheet drawer |
| Tablet | Compact table; fewer columns (hide Location, show 5 columns) |
| Desktop | Full table; all 7 columns visible; filter panel is inline left or collapsible |

Bulk selection:
- Mobile: No checkboxes (bulk operations not available on mobile — use individual case actions)
- Tablet/Desktop: Checkbox column + Select All header

Pagination:
- Mobile: Simplified — "← Prev | Page X of Y | Next →" (no numbered page buttons)
- Desktop: Full paginator with numbered page buttons

### Case Detail

| Viewport | Adaptation |
|---|---|
| Mobile | Stacked: Metadata → Action form → Media gallery → Timeline |
| Tablet | Split-pane: left (metadata, 40%) + right (action + timeline, 60%); map hidden or collapsed |
| Desktop | Full split-pane; map and media gallery both visible in left pane |

Action log form on mobile:
- Full-width textarea with `rows={4}` initial; auto-expand on content
- Notification toggles: full-width touch targets
- Submit button: full-width primary button at bottom of form section

Timeline on mobile:
- Scroll independently within the page (not in a fixed-height panel)
- Timeline entries are full-width cards

### New Case Form (Staff)

| Viewport | Adaptation |
|---|---|
| Mobile | Single column; all fields stacked; photo zone replaced with "📷 Add Photos" button |
| Tablet | Single column (form is 2-col on desktop only for side-by-side optional fields) |
| Desktop | 2-column optional fields (Reporter + Assignee side by side); required fields full-width |

### Public Submission Wizard

| Viewport | Adaptation |
|---|---|
| Mobile | Single column; wizard shell full-width; map 250 px tall; photo = native picker button |
| Tablet | Centered card (max-w-lg); same structure as mobile with more padding |
| Desktop | Centered card (max-w-2xl); category tiles 3-col; map 350 px; drag-drop zone |

**375 px specific rules for public form:**
- No horizontal scroll at any step
- Navigation buttons (Back / Next) are each ≥44 px tall; full-width on Step 5 Submit
- Progress dots: compact (16 px diameter); no labels (too narrow)
- Textarea: `fontSize: 16px` minimum to prevent iOS zoom on focus

### Admin Panels

| Viewport | Adaptation |
|---|---|
| Mobile | Table collapses to single-column card list (name + actions only); Sheet opens full-width |
| Tablet | Table with 3–4 columns; Sheet opens at 60% width |
| Desktop | Full table; Sheet at 480 px fixed width |

Delete and action buttons on mobile:
- Action buttons stack vertically in each card: `[Edit]` and `[Delete]`
- Minimum 44 px height per button

---

## Touch Interaction Requirements (Mobile)

| Target | Minimum Size | Notes |
|---|---|---|
| Buttons (all) | 44 × 44 px | Padding added to maintain size |
| Checkbox (bulk select) | 44 × 44 px tap target | Actual checkbox smaller but hit area extended |
| Table row (case list) | Full row height ≥ 56 px | Entire row is the tap target |
| Sidebar nav items | 44 px height | Left edge to right edge |
| Filter chip remove [×] | 44 × 44 px | Extended tap area around "×" |
| Thumbnail [×] remove | 44 × 44 px | Positioned at corner of thumbnail |
| Lightbox prev/next | 48 × 48 px | Large enough for gloved/imprecise tap |
| Step wizard Back/Next | 44 px height, 100% width | Full width on mobile Step 5 |

---

## No-Horizontal-Scroll Checklist

All screens must pass this checklist at 375 px viewport width:

- [ ] All form fields: `max-w-full` or `w-full`
- [ ] All tables: hidden on mobile (replaced by cards) or use `overflow-x-auto` with scroll hint
- [ ] All images: `max-w-full` or `object-cover` in bounded containers
- [ ] All fixed-width containers: replaced with `max-w-full` equivalents
- [ ] Toasts: `max-w-[calc(100vw-2rem)]`
- [ ] Dialogs: `max-w-[calc(100vw-2rem)] mx-4`
- [ ] Sheets: full-width on mobile
- [ ] Map widget: `width: 100%` always

---

## Performance Targets by Viewport

| Metric | Mobile (3G) | Desktop |
|---|---|---|
| Case list initial load | ≤ 4 s | ≤ 2 s |
| Search response | ≤ 500 ms | ≤ 500 ms |
| Dashboard widgets | ≤ 4 s | ≤ 2 s |
| Map widget load | ≤ 3 s | ≤ 2 s |
| Step transition animation | ≤ 300 ms | ≤ 300 ms |
| Public form submission | ≤ 5 s | ≤ 2 s |

Image optimization for mobile:
- Thumbnails served from `/api/media/{id}/thumbnail` (150×150 px, JPEG 80%)
- Full-size photos lazy-loaded only when lightbox opens
- Map tiles: Mapbox uses vector tiles (smaller than raster on mobile)

---

*End of Y1-responsive.md*
# Y2 — Accessibility Notes

**Standard:** WCAG 2.1 Level AA + Section 508
**Automation:** axe-core integrated in CI (0 critical/serious violations gate)
**Manual audit:** Keyboard-navigation walkthrough of all core workflows required before release

---

## 1. Color Contrast Requirements

### Text Contrast (minimum 4.5:1 for normal text, 3:1 for large text ≥18pt or bold ≥14pt)

| Element | Light Mode | Dark Mode | Ratio Target |
|---|---|---|---|
| Body text | `text-gray-900` on `white` | `text-gray-100` on `gray-900` | ≥ 4.5:1 |
| Muted text | `text-gray-500` on `white` | `text-gray-400` on `gray-900` | ≥ 4.5:1 |
| Primary button text | `white` on `civic-blue-600` | `white` on `civic-blue-500` | ≥ 4.5:1 |
| Status badge OPEN | `blue-800` on `blue-100` | `blue-200` on `blue-900/40` | ≥ 4.5:1 |
| Status badge RESOLVED | `green-800` on `green-100` | `green-200` on `green-900/40` | ≥ 4.5:1 |
| Status badge OVERDUE | `white` on `red-500` | `white` on `red-600` | ≥ 4.5:1 |
| `<mark>` highlights | `gray-900` on `yellow-300` | `gray-900` on `yellow-500` | ≥ 4.5:1 |
| Error text | `red-700` on `white` | `red-400` on `gray-900` | ≥ 4.5:1 |
| Placeholder text | `gray-400` on `white` | `gray-500` on `gray-800` | (informational) |

**Note:** Placeholder text contrast below 4.5:1 is acceptable per WCAG (placeholder is supplementary). Labels must always be visible — no floating label patterns that hide labels on input focus.

### Non-Text Contrast (3:1 minimum — icons, borders, UI components)

- Form input borders: `border-gray-300` on white background → validate ≥3:1
- Focus ring: 3 px solid `civic-blue-500` — must be ≥3:1 against adjacent background
- Icon-only buttons: icon must be ≥3:1 against background; always pair with `aria-label`

---

## 2. Keyboard Navigation

### Focus Management

| Scenario | Focus Behavior |
|---|---|
| Page load | Focus to `<main>` skip-link or first heading |
| Dialog opens | Focus moves to first interactive element or dialog title |
| Dialog closes | Focus returns to the trigger element that opened it |
| Toast appears | Toast is `role="alert"` or `role="status"`; no focus move required |
| Sheet opens | Focus moves to first form field in the sheet |
| Sheet closes | Focus returns to the row/button that triggered it |
| Inline edit activates | Focus moves to the edit input |
| Inline edit saves/cancels | Focus returns to the edit trigger [✎] button |
| Wizard step forward | Focus moves to step heading (Step N of 5) |
| Wizard step backward | Focus moves to step heading (Step N of 5) |
| Lightbox opens | Focus moves to lightbox; trapped within |
| Lightbox closes | Focus returns to the thumbnail that was clicked |
| Search results update | `aria-live="polite"` announces count update |

### Tab Order

All interactive elements must be reachable via Tab in logical document order:
1. Skip-to-main link (first in DOM)
2. Navbar (logo, search, dark mode toggle, user menu)
3. Sidebar (if expanded) — navigation links
4. Main content area
5. Modals/Sheets (when open): trap focus within

`tabindex="-1"` used only on elements that receive programmatic focus but are not in tab order (e.g., dialog container, live region).
`tabindex="0"` used to make non-interactive elements focusable only when necessary.
**Never use `tabindex > 0`.**

### Keyboard Shortcuts

| Key | Action | Context |
|---|---|---|
| Cmd/Ctrl+K | Focus global search input | Anywhere (except forms) |
| Escape | Close dialog / sheet / lightbox / dropdown | When any overlay is open |
| Enter | Submit form / activate button | Focused form |
| Shift+Enter | New line in textarea | Textarea focused |
| Arrow keys | Navigate lightbox photos | Lightbox open |
| Arrow keys | Navigate autocomplete dropdown | Dropdown open |
| Space | Toggle checkbox | Checkbox focused |
| Tab / Shift+Tab | Move forward/backward through focusable elements | Global |

---

## 3. ARIA Roles and Labels

### Landmarks

Every page must have exactly one `<main>` element and appropriate landmark regions:

```html
<header role="banner">         <!-- top navbar -->
<nav aria-label="Main navigation">   <!-- sidebar -->
<nav aria-label="Breadcrumb">        <!-- breadcrumb -->
<main id="main-content">             <!-- page content -->
<aside aria-label="Case timeline">   <!-- timeline panel -->
```

### Dynamic Content Regions

| Component | ARIA Implementation |
|---|---|
| Search results update | `aria-live="polite"` on the results count ("Showing 1–25 of 142 cases") |
| Toast notifications | `role="alert"` (errors) or `role="status"` (success/info) |
| Skeleton loading | `aria-busy="true"` on container; `aria-label="Loading cases..."` |
| Timeline prepend | `aria-live="polite"` on timeline container; new entry announced |
| Status badge update | `aria-live="polite"` on case header region |
| Step wizard navigation | `aria-live="polite"` announces "Step 3 of 5: Location" on step change |
| Confirmation screen (public) | `aria-live="assertive"` on case number display |

### Form Labels

- Every `<input>`, `<textarea>`, `<select>` must have an associated `<label>` via `htmlFor` / `id` or `aria-label`
- Error messages associated to inputs via `aria-describedby`
- Required fields: `aria-required="true"` on the input element (supplement to `*` visual indicator)
- Optional fields: "(optional)" in visible label text — no need for `aria-required="false"` (that's default)

```html
<!-- Required field example -->
<label htmlFor="category">Category <span aria-hidden="true">*</span></label>
<input id="category" aria-required="true" aria-describedby="category-error" />
<span id="category-error" role="alert" class="text-red-600">
  Please select a category
</span>

<!-- Error: only shown when invalid; hidden with CSS (not display:none which removes from ARIA tree) -->
```

### Tables

All data tables must have:
```html
<table>
  <caption class="sr-only">Case list — 142 cases</caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="ascending">Date Submitted ↑</th>
      ...
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>...</td>
    </tr>
  </tbody>
</table>
```

- `aria-sort="ascending"` / `"descending"` / `"none"` on sortable column headers
- Sort button inside `<th>`: `<button>` element with `aria-label="Sort by Date Submitted ascending"`
- Checkbox column: `<th scope="col"><input type="checkbox" aria-label="Select all cases on this page" /></th>`

### Buttons and Icon Buttons

Every icon-only button MUST have an accessible name:
```html
<button aria-label="Edit assignee">
  <PencilIcon aria-hidden="true" />
</button>

<button aria-label="Remove filter: Status Open">
  <XIcon aria-hidden="true" />
</button>

<button aria-label="Delete Case #5102 photo photo1.jpg">
  <TrashIcon aria-hidden="true" />
</button>
```

Decorative icons: `aria-hidden="true"` always.

---

## 4. Screen Reader Considerations

### Case List

- "Showing 1–25 of 142 cases" is a live region — updates announced when search/filter changes
- Status badge text should be read as: "Open" not "OPEN" (CSS transforms text to uppercase visually but HTML is sentence-case)
- Row checkboxes: `aria-label="Select case #5102"` (not generic "Select")
- "Select all" checkbox: `aria-label="Select all 25 cases on this page"`
- When bulk toolbar appears: `aria-live="polite"` announces "33 cases selected"

### Case Detail

- Timeline is a `<section aria-label="Case activity timeline">` containing an ordered list `<ol>`
- Each timeline entry is `<li>` with a heading level appropriate to document structure
- Action type icon: `aria-hidden="true"`; action type text is visible text
- "Notify Reporter" toggle: `<Switch aria-label="Notify reporter by email">`
- SLA progress bar: `<div role="progressbar" aria-valuenow="3" aria-valuemin="0" aria-valuemax="5" aria-label="SLA: 3 of 5 days elapsed">`

### Lightbox

```html
<div role="dialog" aria-modal="true" aria-label="Photo viewer: photo1.jpg">
  <button aria-label="Previous photo">←</button>
  <img alt="Pothole at Oak and 3rd Street, uploaded by Carlos Rivera on Jul 6" />
  <button aria-label="Next photo">→</button>
  <button aria-label="Close photo viewer">×</button>
  <p>photo1.jpg — Uploaded Jul 6 by Carlos Rivera</p>
</div>
```

All photos MUST have meaningful `alt` text. Formula: `{Category} at {Location}, uploaded by {person} on {date}`. If filename only is known: `alt="{filename}"` with surrounding caption providing context.

### Public Submission Form

- Step indicator: `<nav aria-label="Form progress">` with `<ol>` of steps
- Current step: `aria-current="step"` on the current step indicator element
- Completed step: descriptive text includes "Completed" for screen readers
- Map: `<div role="application" aria-label="Select location on map. Tap to drop a pin.">`
- Pin placed: announce via `aria-live="polite"`: "Pin placed at Cedar and 7th Avenue"
- Photo thumbnails: `<img alt="Selected photo: [filename], [file size]">` with remove button `aria-label="Remove photo: [filename]"`

### Toast Messages

- Success: `role="status"` (polite — does not interrupt)
- Error: `role="alert"` (assertive — interrupts immediately)
- Warning: `role="alert"` (for failures the user needs to act on)
- All toasts: Include text content only (no icon-only toasts)

---

## 5. Motion and Animation Safety

| Rule | Implementation |
|---|---|
| All Framer Motion animations | Wrapped in `motionSafe` check or use `reducedMotion="user"` on `AnimatePresence` |
| CSS transitions | Wrapped in `@media (prefers-reduced-motion: no-preference)` |
| Skeleton shimmer | Disabled when reduced motion preferred (static gray shown instead) |
| Toasts | Still appear/disappear but without slide-in animation |
| Step wizard | Instant step change; no slide transition |
| Status badge change | Color change only; no scale or position animation |

```css
/* Global pattern */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Skip Navigation

```html
<!-- First element in <body> -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
         focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary
         focus:border-2 focus:border-primary focus:rounded-md"
>
  Skip to main content
</a>
```

This link becomes visible when focused (Tab from browser chrome). All authenticated screens include this. Public submission form also includes it.

---

## 7. Dark Mode Accessibility

- All color contrast ratios verified in both light and dark modes
- Focus rings: 3 px solid `civic-blue-400` (slightly lighter in dark mode for contrast on dark backgrounds)
- Error states: `red-400` in dark mode (lighter than `red-700` in light mode) for adequate contrast on dark backgrounds
- `<mark>` highlights: `yellow-500` in dark mode text on `yellow-900/40` background — verify contrast

Dark mode is activated via:
1. `prefers-color-scheme: dark` media query (system preference, automatic)
2. Manual toggle button in navbar (persisted to `localStorage`)
3. Both result in `.dark` class on `<html>` element

---

## 8. Section 508 Compliance Summary

| Criterion | Implementation |
|---|---|
| 1194.22(a) — Text alternatives | All images have alt text; decorative images are `aria-hidden` |
| 1194.22(d) — Readable without CSS | Document structure (headings, lists, tables) is meaningful in linear order |
| 1194.22(k) — Keyboard access | All functionality operable via keyboard; no mouse-only interactions |
| 1194.22(l) — Scripts | Dynamic content changes announced via ARIA live regions |
| 1194.22(n) — Forms | All form elements have labels; errors identified by text (not color alone) |
| 1194.22(o) — Skip links | Skip-to-main-content link present on all pages |
| 1194.22(p) — Timed responses | No time limits on form completion; session expiry shows warning with option to extend |

---

*End of Y2-accessibility.md*
