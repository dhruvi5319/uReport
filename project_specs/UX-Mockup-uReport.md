# UX Mockup
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Generated:** 2026-06-23  
**Based on:** UserStories-uReport.md · PRD-uReport.md · FRD-uReport.md · JOURNEYS-uReport.md · .planning/PROJECT.md  

---

## Overview

### UX Approach

uReport serves four distinct personas with fundamentally different mental models and device contexts:

- **Dana (Staff)** — Desktop-primary, speed-focused, keyboard-friendly. Needs triage and triage-to-action in ≤ 2 clicks.
- **Marcus (Manager)** — Dashboard-first, metrics-driven. Needs SLA visibility on login and CSV download in ≤ 2 screens.
- **Priya (Citizen)** — Mobile-primary, low-tech-literacy. Needs a linear, forgiving form flow with zero jargon.
- **Tomás (Admin/IT)** — Config-focused, developer-literate. Needs discoverable admin screens and API documentation.

These four context profiles drive every layout and interaction decision.

### Design Principles

1. **Role-appropriate defaults.** The first screen a user lands on after login must already show them what they need most — not a generic home page.
2. **Progressive disclosure.** Show required fields first; reveal advanced options only on demand. Applies to ticket create form, admin forms, and filter panels.
3. **Inline actions.** Actions (assign, respond, close, bulk-reassign) complete without navigating away from the current view. The user's context is preserved.
4. **Feedback is mandatory.** Every mutation has a visible result: inline toast, audit trail entry, or state badge change. No silent successes or silent failures.
5. **Mobile-first for citizen flows, desktop-optimized for staff flows.** The public submission form (`/submit`) is designed for a 375px iPhone. Staff views optimize for a 1280px+ workstation but remain functional at 375px.
6. **Stable output contracts.** CSV column order, API response shapes, and URL patterns are stable. Staff Excel pivot tables and third-party Open311 clients must never break from a UI-side change.

### Design System

- **Component library:** Radix UI / shadcn/ui primitives (dialog, dropdown, form, tooltip, command palette)
- **Color system:** Semantic tokens — `status-open` (blue), `status-closed` (gray), `sla-ok` (green), `sla-warning` (amber), `sla-breach` (red)
- **Typography:** System font stack; minimum 16px body text on mobile
- **Spacing:** 8px base grid
- **Breakpoints:** `sm` = 375px, `md` = 768px, `lg` = 1024px, `xl` = 1280px, `2xl` = 1920px

### Navigation Architecture

```
/ (root)
├── /login                  → OIDC redirect page (Screen-00)
├── /dashboard              → Staff dashboard with SLA widgets (Screen-02 context)
├── /tickets                → Ticket list / search (Screen-02)
│   ├── /tickets/new        → Create ticket (Screen-04)
│   └── /tickets/:id        → Ticket detail (Screen-03)
├── /submit                 → Public service request form (Screen-05)
├── /track/:id              → Public ticket status page (Screen-05 exit)
├── /map                    → Map view (Screen-10)
├── /reports                → Reports & metrics (Screen-07)
│   └── /reports/sla        → SLA dashboard (Screen-06)
├── /admin                  → Admin panel root (Screen-08)
│   ├── /admin/departments
│   ├── /admin/categories
│   ├── /admin/people
│   ├── /admin/templates
│   ├── /admin/clients
│   └── /admin/substatuses
└── /api/docs               → OpenAPI / Swagger UI (Screen-09)
```

### Role → Default Landing Page

| Role | Post-login redirect | Rationale |
|------|--------------------|-----------| 
| `admin` | `/dashboard` | Full SLA + workload overview |
| `staff` | `/dashboard` | SLA breach count + personal queue bookmark |
| `public` | `/track/:last-id` or `/submit` | Track last submission or start new one |
| `anonymous` | `/submit` | Direct to submission form |

---

*Sections continue in Flow-00 through Y2-accessibility.*
---

## User Flows

### Flow 00: Authentication (Login / Logout)

**Trigger:** User navigates to any protected route, or clicks Login  
**User Stories:** US-11.1, US-11.2, US-3.2  
**Personas:** Dana (PER-01), Marcus (PER-02), Tomás (PER-04)  
**Journey:** JRN-01.1 (Login stage), JRN-04.1 (Test Staff Login stage)

```
[User visits /tickets or any protected route]
    │
    ▼
[/login page — "Sign in with City SSO" button]
    │
    ▼
[Redirect → OIDC Provider (Keycloak / Auth0 / city SSO)]
    │
    ├── OIDC Provider Unreachable ──▶ [Error screen: "Login service unavailable"]
    │                                   HTTP 503 IDP_UNAVAILABLE
    │
    ▼
[User completes IdP auth; callback to /auth/callback]
    │
    ├── Invalid token / CSRF ──▶ [Error: "Authentication failed. Please try again."]
    │                              HTTP 401 INVALID_ID_TOKEN
    │
    ▼
[System looks up person record by oidcSubject or email]
    │
    ├── Person not found ──▶ [Auto-provision: create person with role=public]
    │                         (US-3.2)
    │
    ▼
[System issues JWT cookie (ureport_session)]
    │
    ▼
[Redirect to originally-requested URL or role-default dashboard]
    │
    ├── role=admin/staff ──▶ [/dashboard]
    └── role=public ──────▶ [/submit or /track/:id]

─────────────────────────────────
LOGOUT FLOW
─────────────────────────────────
[User clicks "Sign out" in user menu]
    │
    ▼
[POST /auth/logout — clears ureport_session cookie]
    │
    ▼
[Redirect to OIDC provider end-session endpoint]
    │
    ▼
[/login page with "Signed out successfully" banner]

─────────────────────────────────
SESSION EXPIRY FLOW
─────────────────────────────────
[Any API request with expired JWT]
    │
    ▼
[HTTP 401 UNAUTHENTICATED returned]
    │
    ▼
[SPA detects 401 → save current URL → redirect to /login]
    │
    ▼
[After re-auth → restore saved URL]
```

**Steps:**
1. `/login` page renders with a single CTA: "Sign in with City SSO". No username/password fields (OIDC only).
2. Clicking the button initiates OIDC authorization code flow with a `state` nonce stored in session for CSRF protection.
3. IdP redirects back to `/auth/callback?code=…&state=…`. System validates `state`, exchanges code for tokens.
4. JWT is set as `HttpOnly; Secure; SameSite=Lax` cookie named `ureport_session`. No token in localStorage.
5. System checks for an existing `people` record matched by `oidcSubject` (or fallback: email claim).
6. Auto-provisioned users get `role=public` until an admin elevates the role (US-3.2).
7. Role-based redirect delivers the user directly to their contextually appropriate landing page.
8. On logout, cookie is cleared and OIDC end-session redirect ensures IdP session is also terminated.

**Error Handling:**
| Scenario | User-facing message | Recovery action |
|----------|--------------------|-|
| IdP unreachable | "Login service is temporarily unavailable. Please try again." | Retry button |
| Invalid/expired token | "Authentication failed. Please try again." | Back to /login |
| Account deactivated | "Your account has been deactivated. Contact your administrator." | No retry; show contact info |
| Session expired (mid-session) | Toast: "Session expired — please sign in again." | Auto-redirect to /login |
---

### Flow 01: Staff Creates a New Ticket

**Trigger:** Dana clicks "New Ticket" from ticket list or dashboard  
**User Stories:** US-0.1, US-5.1, US-7.1, US-8.1  
**Personas:** Dana (PER-01)  
**Journey:** JRN-01.2

```
[Staff clicks "+ New Ticket" (persistent shortcut, top nav)]
    │
    ▼
[Step 1 — Category Selection]
    Select service category (plain-language labels, grouped)
    System shows: "Routes to: [Department Name]" preview
    │
    ├── Category with custom fields ──▶ [custom fields appear below in Step 3]
    └── No match / wrong category ──▶ [search filter in dropdown]
    │
    ▼
[Step 2 — Location]
    Address text field + interactive map picker (side by side, or stacked on mobile)
    Geocoding runs on blur/submit
    │
    ├── Geocode success ──▶ [map pin drops, address normalizes]
    ├── Geocode failure (non-fatal) ──▶ [warning banner: "Address could not be geocoded.
    │                                    Ticket saved — location will retry automatically."]
    └── Invalid coordinates ──▶ [inline error: "Coordinates out of valid range"]
    │
    ▼
[Step 3 — Details]
    Title (required, max 255)
    Description (optional, max 5000, rich textarea)
    Reporter: name, email, phone (optional)
    Custom fields (if category has them — rendered from category.fields)
    Attachments (drag-drop + file picker, image thumbnails preview)
    │
    ├── File > 10MB ──▶ [inline error: "File too large. Max 10MB."]
    ├── Wrong file type ──▶ [inline error: "Unsupported file type."]
    └── > 20 attachments ──▶ [inline error: "Attachment limit reached (20)."]
    │
    ▼
[Review & Submit bar (sticky bottom)]
    Shows: category, department, summary
    "Create Ticket" button (primary CTA)
    │
    ├── Validation failure ──▶ [field-level inline errors; scroll to first error]
    ├── API 422 ──────────▶ [inline field errors from server response]
    └── Success ──────────▶ [Ticket detail page opens; toast: "Ticket #XXXX created"]
                             System sends reporter confirmation email (F8)
                             Ticket indexed in Solr
```

**Steps:**
1. "+ New Ticket" button is always visible in the top navigation bar — accessible from any screen without losing context.
2. **Step 1 — Category:** Grouped dropdown with search. Category name is plain-language (configured in admin). Shows "→ [Department]" routing preview to prevent mis-routing (JRN-01.2 pain point).
3. **Step 2 — Location:** Text field and embedded map on the same view. Typing in the address field triggers geocoding on submit; the map pin updates live. For mobile, the map collapses below the text field.
4. **Step 3 — Details:** Title is required. Reporter fields are optional but prompted. Custom fields render dynamically based on selected category. File upload supports drag-and-drop on desktop, native picker on mobile.
5. **Sticky review bar** shows current routing before submission — prevents the wrong-department mistake from JRN-01.2.
6. On success, the form transitions to the new ticket's detail page. No full-page reload needed (SPA navigation). A toast confirms creation and links to the email status.
7. The response compose panel can be opened immediately on the detail page (see Flow-02, Stage: Select Template).

**Assignee inline search (US-0.3):**
After ticket creation, the detail view's sidebar surfaces an inline "Assign to" control. Staff name search returns results with current open ticket count (JRN-02.1 pain point: workload visibility before assigning).
---

### Flow 02: Ticket Lifecycle — Assign, Respond, Close, Reopen

**Trigger:** Staff opens an existing ticket  
**User Stories:** US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-13.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.2 (Assign, Select Template, Send Response), JRN-02.1 (Bulk Reassign)

```
[Ticket Detail View — open ticket]
    │
    ├─▶ [ASSIGN ACTION]
    │       Sidebar: "Assignee" field → inline person search
    │       Shows assignee's current open ticket count
    │       "Assign" button → POST /api/tickets/{id}/assign
    │       │
    │       ├── Success ──▶ [assignee badge updates; history entry added; email sent to assignee]
    │       └── Invalid assignee ──▶ [inline: "Staff member not found or inactive"]
    │
    ├─▶ [RESPOND ACTION — external, sent to reporter]
    │       "Add Response" button in sidebar or history panel
    │       Opens inline compose panel (NOT a new page):
    │         - Template dropdown (populated from GET /api/templates)
    │         - Selecting template pre-fills body (editable before send)
    │         - Variables substituted at send time
    │       "Send Response" → POST /api/tickets/{id}/responses
    │       │
    │       ├── Success ──▶ [toast: "Response sent to {email}"; action logged in history]
    │       └── SMTP failure ──▶ [toast warning: "Email delivery failed — will retry automatically"]
    │
    ├─▶ [INTERNAL COMMENT — staff-only, not sent to reporter]
    │       "Add Comment" tab in compose panel
    │       "Internal" badge clearly visible
    │       POST /api/tickets/{id}/comments
    │       │
    │       └── Success ──▶ [comment appears in history with 🔒 "Internal" badge]
    │
    ├─▶ [CLOSE ACTION]
    │       "Close Ticket" button → opens inline close modal
    │       Optional resolution text (max 5000)
    │       "Close & Notify Reporter" (if response text entered) or "Close Silently"
    │       │
    │       ├── Success ──▶ [status badge → Closed; history entry; reporter email if response]
    │       └── Already closed ──▶ [409 ALREADY_CLOSED → banner: "Ticket is already closed"]
    │
    ├─▶ [REOPEN ACTION — only on closed tickets]
    │       "Reopen" button visible only when status=closed
    │       Required reason field (max 1000)
    │       │
    │       ├── Success ──▶ [status badge → Open; history entry]
    │       ├── Empty reason ──▶ [inline: "Reason is required to reopen"]
    │       └── Already open ──▶ [409 ALREADY_OPEN → banner]
    │
    └─▶ [DELETE ACTION — admin only]
            "Delete Ticket" in kebab menu (⋮) — destructive, clearly separated
            Confirmation dialog: "This will permanently remove the ticket. Type the ticket ID to confirm."
            │
            └── Success ──▶ [navigate back to ticket list; toast: "Ticket #XXXX deleted"]

─────────────────────────────────
BULK REASSIGN (JRN-02.1)
─────────────────────────────────
[Ticket list — multi-select mode]
    │
    ▼
[Select checkboxes on 2+ tickets]
    │
    ▼
[Bulk actions bar appears at bottom of screen]
    "Assign to…" | "Change Status…" | "Export Selected"
    │
    ▼
[Assignee search in bulk panel — shows workload count per person]
    │
    ▼
[Confirm → PATCH each ticket async; progress indicator]
    │
    ▼
[Toast: "3 tickets reassigned to Jordan M." | Audit trail entry per ticket]
```

**Inline compose panel (template UX — US-13.2):**
- Panel opens in the right sidebar of the ticket detail view on desktop, or as a bottom sheet on mobile
- Template dropdown is visible immediately (no extra navigation — addresses JRN-01.2 pain point)
- Selecting a template populates the body; staff can edit before sending
- `{{ticket_id}}`, `{{category}}`, `{{assignee_name}}` etc. are shown as readable placeholders in the compose view and substituted at send time
- Missing variable values show as empty string (never raw `{{…}}` in the sent email)

**Substatus (US-17.1):**
- Substatus badge appears next to the primary status badge in the ticket header
- Clicking the substatus badge opens a dropdown to change it (inline, no modal)
- "Pending Parts", "Scheduled", "In Review" etc. configured by admin
---

### Flow 03: Search, Filter, Export, and Map View

**Trigger:** Dana or Marcus lands on /tickets or clicks a filter badge from the dashboard  
**User Stories:** US-4.1, US-4.2, US-5.2, US-12.1, US-12.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Recall Saved Queue, Prioritize), JRN-02.1 (Drill into SLA Breaches)

```
[/tickets — Ticket List Page]
    │
    ├─▶ [KEYWORD SEARCH]
    │       Search bar at top (always visible)
    │       Queries Solr full-text: title, description, responses, address
    │       Results update with debounce (300ms)
    │       │
    │       └── Solr unavailable ──▶ [banner: "Search temporarily unavailable. Showing all tickets."]
    │                                  HTTP 503 SEARCH_UNAVAILABLE
    │
    ├─▶ [FILTER PANEL — collapsible sidebar on desktop; bottom sheet on mobile]
    │       Status: Open | Closed | All
    │       Substatus: dropdown (multiselect)
    │       Category: grouped multiselect
    │       Department: multiselect
    │       Assignee: person search
    │       Date range: from/to date pickers
    │       Reporter email: text input
    │       │
    │       ├── dateFrom > dateTo ──▶ [inline: "Start date must be before end date"]
    │       └── Apply Filters button → URL params update; results refresh
    │
    ├─▶ [SORT CONTROLS — above results list]
    │       Sort by: Date (newest first ▼) | Date (oldest) | SLA urgency | Assignee | Category
    │       Default: date_desc
    │
    ├─▶ [SAVED BOOKMARKS — US-12.1, US-12.2]
    │       "Bookmarks" dropdown in filter bar
    │       Shows up to 50 personal bookmarks
    │       "Save current filters" button → name prompt (modal)
    │       Clicking a bookmark → instantly restores all filter + sort state
    │       │
    │       ├── Duplicate bookmark name ──▶ [422: "You already have a bookmark with this name"]
    │       └── Bookmark limit ──────────▶ [422: "Bookmark limit reached (50). Delete one to save."]
    │
    ├─▶ [VIEW TOGGLE — List | Map]
    │       Toggle button in results toolbar
    │       Map view → /map with same filters applied (see Screen-10)
    │       List view is default
    │
    ├─▶ [CSV EXPORT — US-4.2]
    │       "Export CSV" button (staff/admin only — hidden for public role)
    │       Triggers GET /api/tickets?export=csv with current filters
    │       Browser downloads tickets.csv
    │       │
    │       ├── > 5000 rows ──▶ [413: "Export too large. Refine your filters to under 5000 results."]
    │       └── Success ──────▶ [download starts; toast: "Downloading tickets.csv"]
    │
    └─▶ [RESULT CLICK]
            Click any ticket row → navigates to /tickets/:id (Ticket Detail)
```

**Facet sidebar content (informational, not actionable):**
After results load, the filter panel displays facet counts:
- Status: Open (280) / Closed (62)
- Top 5 categories with ticket counts
- Top 5 departments with ticket counts

These update in real-time when filters change, giving Marcus a quick workload distribution view.

**SLA urgency indicators in list view:**
- `sla-breach` (red) — ticket is past its expected close date
- `sla-warning` (amber) — ticket closes within 24 hours
- `sla-ok` (green) — within SLA window
- No badge — category has no SLA (`slaDays = null`)

These badge colors are the mechanism for JRN-01.1 "Prioritize" stage and JRN-02.1 "Drill into SLA Breaches".

**Dashboard shortcut integration (JRN-02.1):**
The dashboard's "3 SLA Breached" badge is a link that pre-populates the ticket list with `status=open&sla=breached&departmentId={manager's dept}` filters — one click from dashboard to filtered overdue list.
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
---

### Flow 05: Admin — Configure System (Categories, Departments, Users, API Clients)

**Trigger:** Tomás logs in as admin and navigates to /admin  
**User Stories:** US-2.1, US-2.2, US-3.1, US-3.2, US-14.1, US-14.2, US-15.4  
**Personas:** Tomás (PER-04)  
**Journey:** JRN-04.1 (Configure OIDC), JRN-04.2 (Register API Client, Provision Staff User)

```
[/admin — Admin Navigation Hub]
    │
    ├─▶ [/admin/departments]
    │       List: name, active status, default assignee, ticket count
    │       "+ New Department" button
    │       Edit / Deactivate actions per row
    │       │
    │       └── Deactivate with active tickets:
    │               → 409 HAS_ACTIVE_TICKETS
    │               → Confirmation modal: "This department has N active tickets.
    │                  Deactivating will remove it from routing. Proceed?"
    │               → Confirm → 204 success; department hidden from dropdowns
    │
    ├─▶ [/admin/categories]
    │       Grouped by department; searchable table
    │       Columns: Name | Department | SLA Days | Display | Posting | Active
    │       "+ New Category" → multi-step form:
    │         Step 1: Name, Department, Group, SLA Days
    │         Step 2: Display & Posting Permissions
    │         Step 3: Custom Fields (add/remove field rows)
    │         Step 4: Auto-close & Default Assignee
    │       │
    │       ├── Duplicate name ──▶ [422 DUPLICATE_NAME inline error]
    │       └── Select field without options ──▶ [422 FIELD_OPTIONS_REQUIRED]
    │
    ├─▶ [/admin/people]
    │       Searchable/filterable table: Name | Role | Department | Email | Active
    │       Filters: role, department, active status
    │       "+ New Person" → form:
    │         First Name, Last Name, Role selector (human-readable descriptions)
    │         Department (if staff/admin)
    │         Email contact method (required for staff/admin)
    │       Edit person → same form; tab for Contact Methods management
    │       │
    │       ├── Duplicate email ──▶ [422 DUPLICATE_EMAIL inline error]
    │       └── Staff without email ──▶ [422: "Staff and admin roles require an email address"]
    │
    ├─▶ [/admin/clients — API Client Management (US-14.1, US-14.2)]
    │       List: Client Name | Contact Email | Status | Key Hint (first 8 chars…) | Created
    │       "+ New API Client" → name + contact email → Generate Key
    │       │
    │       └── Key Generation Modal (one-time display):
    │               ┌─────────────────────────────────────────┐
    │               │ API Key Generated                        │
    │               │                                          │
    │               │ a3f82b91-xxxx-xxxx-xxxx-xxxxxxxxxxxx    │
    │               │ [📋 Copy to clipboard]                   │
    │               │                                          │
    │               │ ⚠️  This key will not be shown again.    │
    │               │ Store it securely before closing.        │
    │               │                                          │
    │               │ [I've saved my key — Close]              │
    │               └─────────────────────────────────────────┘
    │           "Close" button is the only exit; no X button on this modal
    │
    │       Revoke key → confirmation; key immediately invalid
    │       "Regenerate Key" → same one-time modal flow
    │
    ├─▶ [/admin/substatuses]
    │       Grouped by primary status (Open / Closed)
    │       Sortable drag-and-drop order
    │       Default substatus badge indicator
    │       "+ New Substatus" → label, primary status, set as default toggle
    │
    ├─▶ [/admin/templates — Response Templates (US-13.1)]
    │       List: Template Name | Subject | Active | System?
    │       System templates (identified by slug) cannot be deleted
    │       "+ New Template" → name, subject, body with variable hints panel
    │       Variable hints: {{ticket_id}}, {{title}}, {{category}}, etc.
    │       Live preview panel with sample data substitution
    │
    └─▶ [/admin/settings — OIDC + SMTP Config (US-11.2)]
            OIDC Settings tab:
              Issuer URL, Client ID, Client Secret (masked input)
              [Test Connection] button → validates against IdP before saving
              Success: "✅ Provider reachable. Login flow will work."
              Failure: "❌ Could not reach provider at {url}. Check your configuration."
            SMTP Settings tab:
              Host, Port, Username, Password (masked), From Address, From Name
              [Send Test Email] → sends to current admin's email
            [Save Settings] → applies without server restart
```

**Role selector UX (JRN-04.2 — "Role selector shows human-readable descriptions"):**

| Role value | Display label | Description shown to admin |
|-----------|--------------|---------------------------|
| `admin` | Admin | Can configure all system settings, manage users, and access all tickets |
| `staff` | Staff | Can manage tickets in assigned departments and view all permitted categories |
| `public` | Public (Citizen) | Can submit and track their own tickets; no staff access |

**OIDC Test Connection (JRN-04.1 delight):**
The "Test Connection" button runs a server-side check of the OIDC discovery endpoint (`{issuer}/.well-known/openid-configuration`) before saving. If the check fails, the admin sees a specific error message (unreachable vs. invalid client) rather than discovering the problem at the next staff login attempt.
---

## Screen Designs

### Screen 00: Login / OIDC Redirect Page

**Route:** `/login`  
**Purpose:** Entry point for staff and admin users. Initiates OIDC authentication flow.  
**User Stories:** US-11.1, US-11.2  
**Personas:** Dana (PER-01), Marcus (PER-02), Tomás (PER-04)

#### Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  [City Logo / uReport]               │
│                                                     │
│         ┌───────────────────────────────┐           │
│         │                               │           │
│         │    uReport                    │           │
│         │    Municipal CRM              │           │
│         │                               │           │
│         │    ┌─────────────────────┐    │           │
│         │    │  Sign in with       │    │           │
│         │    │  City SSO  🔑       │    │           │
│         │    └─────────────────────┘    │           │
│         │                               │           │
│         │    ─── or ───                 │           │
│         │                               │           │
│         │    [Submit a service request] │           │
│         │    (link to /submit)          │           │
│         │                               │           │
│         └───────────────────────────────┘           │
│                                                     │
│         Version 2.0 · AGPL-3.0                      │
└─────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | "Sign in with City SSO" button | Card center, large CTA |
| Secondary | Product name and branding | Card top |
| Tertiary | Citizen form link | Below the SSO button |
| Tertiary | Version / license | Page footer |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Clean card, single CTA | N/A |
| Loading (IdP redirect) | Button → spinner, text: "Redirecting to sign-in..." | Spinner in button |
| IdP unavailable | Error card replaces login card | "Login service temporarily unavailable. [Try again]" |
| Auth failed | Error banner below card | "Authentication failed. Please try again." |
| Signed out | Success banner above card | "You've been signed out successfully." |
| Account deactivated | Error card | "Your account has been deactivated. Contact your system administrator." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Sign in with City SSO | Primary button | Initiates OIDC flow; shows spinner on click |
| Submit a service request | Text link | Navigates to /submit |
| Try again (error state) | Secondary button | Reloads /login |

#### Notes
- No username/password fields — OIDC only.
- The `/login?redirect=/tickets/123` query param is preserved through the OIDC flow and restored on success.
- The "Submit a service request" link ensures citizens who accidentally navigate to /login can reach their destination.
- Fully functional at 375px (single column, centered card).
---

### Screen 01: Staff Dashboard (Post-Login Landing)

**Route:** `/dashboard`  
**Purpose:** Role-appropriate landing page for staff and admin. Surfaces SLA breaches, workload summary, and quick access to personal queue. First thing Dana and Marcus see after login.  
**User Stories:** US-9.1, US-15.1  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Land on Dashboard), JRN-02.1 (Login & Land)

#### Layout (Desktop — Manager view, Marcus)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [uReport logo]  Tickets ▾  Reports  Admin  Map │ 🔔 3  [Marcus Webb ▾]   │  ← Top nav
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Good morning, Marcus.                        [+ New Ticket]             │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │  ← KPI row
│  │  🔴 3        │  │  🟡 8        │  │  📋 127      │  │  ✅ 84%     │  │
│  │  SLA Breached│  │  Due Today   │  │  Open Tickets│  │  SLA On-Time│  │
│  │  [View →]    │  │  [View →]    │  │  [View →]    │  │  (30 days)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Staff Workload                 │  │  My Bookmarks                 │  │  ← Row 2
│  │                                 │  │                               │  │
│  │  Dana R.    ████████ 18 open    │  │  📌 My Open Tickets          │  │
│  │  Jordan M.  ████ 6 open         │  │  📌 Unassigned — Public Works │  │
│  │  Alex T.    ██████ 12 open      │  │  📌 SLA Breaches Today       │  │
│  │  Unassigned ██ 3 open           │  │                               │  │
│  │                                 │  │  [+ Save current filters]    │  │
│  │  [Reassign overloaded staff →]  │  │  [Manage bookmarks →]        │  │
│  └─────────────────────────────────┘  └───────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Recent Tickets (last 24 hours)                      [See all →]   │  │  ← Recent row
│  │                                                                     │  │
│  │  #4821 Pothole on Oak Ave      Open  🔴 Breached   Dana R.  2h ago │  │
│  │  #4820 Broken streetlight      Open  🟡 Due today  Jordan  4h ago  │  │
│  │  #4819 Storm drain collapse    Open  🟢 On track   Dana R.  5h ago │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Layout (Desktop — Staff view, Dana)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [uReport logo]  Tickets ▾  Reports  Map │ 🔔 1  [Dana Reyes ▾]           │  ← Top nav
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Good morning, Dana.                          [+ New Ticket]             │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │  🔴 2        │  │  🟡 5        │  │  📋 45       │                    │
│  │  SLA Breached│  │  Due Today   │  │  Assigned    │                    │
│  │  [View →]    │  │  [View →]    │  │  to me       │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  My Queue  (bookmark: "My Open Tickets")           [Edit filters]  │   │
│  │  Sorted by: SLA Urgency ▾                          [View as map]   │   │
│  │                                                                    │   │
│  │  #4821 Pothole on Oak Ave    Open  🔴 Breached  1 day overdue     │   │
│  │  #4815 Broken manhole cover  Open  🔴 Breached  3 hrs overdue     │   │
│  │  #4819 Storm drain collapse  Open  🟡 Due 4pm   5 hrs left        │   │
│  │  #4812 Fallen tree limb      Open  🟢 On track  3 days left       │   │
│  │  ...                                                                │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement | Role |
|----------|---------|-----------|------|
| Primary | SLA breach count + "SLA Breached" badge (red) | KPI card row, first card | Both |
| Primary | Personal queue (bookmark-restored) | Main content, Dana view | Staff |
| Primary | Staff workload chart | Main content, Marcus view | Manager |
| Secondary | Due today count | KPI card row, second card | Both |
| Secondary | Total open tickets | KPI card row, third card | Both |
| Secondary | SLA on-time % | KPI card row, fourth card | Manager |
| Tertiary | Recent tickets list | Bottom of page | Both |
| Tertiary | My Bookmarks panel | Right column | Both |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Full dashboard as shown | N/A |
| Loading | Skeleton loaders in KPI cards and table rows | Shimmer animation |
| No breaches | SLA card shows green "✅ 0 SLA Breached" | N/A |
| No tickets assigned | Empty state in queue: "No tickets assigned to you" | Add "Create ticket" CTA |
| Metrics stale (cache) | Small "Last updated 3m ago" note under SLA % | N/A |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| KPI card "View →" links | Navigation | Pre-filters /tickets with card's filter params |
| Staff workload bar chart | Interactive | Click a staff member's bar → /tickets?assigneeId={id} |
| Bookmark items | Navigation | Loads bookmark filter state into /tickets |
| "+ Save current filters" | Button | Opens name prompt modal |
| Recent ticket rows | Navigation | Opens /tickets/:id |
| "+ New Ticket" | Primary CTA | Navigates to /tickets/new |
| Top nav "Tickets" | Dropdown | My Queue / All Tickets / Map View |
---

### Screen 02: Ticket List / Search Results (Staff View)

**Route:** `/tickets`  
**Purpose:** Primary workspace for staff. Search, filter, sort, and take bulk actions on tickets. Entry point to individual ticket detail.  
**User Stories:** US-4.1, US-4.2, US-12.1, US-12.2, US-5.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Recall Saved Queue, Prioritize), JRN-02.1 (Drill into SLA Breaches, Select Tickets for Reassignment)

#### Layout (Desktop — 1280px+)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Top Nav: logo | Tickets ▾ | Reports | Admin | Map] [🔔] [User ▾]             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search tickets...                            [📌 Bookmarks ▾] [⊞ Map]│   │  ← Search bar row
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│ ┌──────────────────────┐  ┌──────────────────────────────────────────────────┐  │
│ │ FILTERS              │  │  127 results  Sort: SLA Urgency ▾  [Export CSV]  │  │  ← Filter + Results
│ │                      │  │  [☐ Select all]                                   │  │
│ │ Status               │  │  ──────────────────────────────────────────────── │  │
│ │ ○ All ● Open ○ Closed│  │  ☐ #4821 Pothole on Oak Ave                       │  │
│ │                      │  │     🔴 SLA Breach   Public Works   Dana R.  2h   │  │
│ │ Substatus            │  │     Oak Ave @ Main St, Downtown                   │  │
│ │ [Pending Parts   ▾]  │  │                                                   │  │
│ │                      │  │  ☐ #4815 Broken manhole cover                     │  │
│ │ Category             │  │     🔴 SLA Breach   Public Works   Dana R.  6h   │  │
│ │ [All categories  ▾]  │  │                                                   │  │
│ │                      │  │  ☐ #4819 Storm drain collapse                     │  │
│ │ Department           │  │     🟡 Due today    Public Works   Dana R.  5h   │  │
│ │ [Public Works    ▾]  │  │                                                   │  │
│ │                      │  │  ☐ #4812 Fallen tree limb                         │  │
│ │ Assignee             │  │     🟢 On track     Parks Dept     Jordan  3d    │  │
│ │ [Any assignee    ▾]  │  │                                                   │  │
│ │                      │  │  ...                                              │  │
│ │ Date range           │  │                                                   │  │
│ │ [From] → [To]        │  │  ──────────────────────────────────────────────── │  │
│ │                      │  │  ← 1  2  3  4  5  →   (25 per page)               │  │
│ │ Reporter email       │  └──────────────────────────────────────────────────┘  │
│ │ [_______________]    │                                                         │
│ │                      │   Facet summary:                                        │
│ │ [Apply Filters]      │   Status: Open (119) / Closed (8)                      │
│ │ [Clear All]          │   Top categories: Pothole (45), Lighting (30)...        │
│ └──────────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Bulk Action Bar (appears when 1+ rows selected)

```
┌──────────────────────────────────────────────────────────────────┐
│  3 tickets selected   [Assign to... ▾]  [Change status ▾]  [✕]  │
│                                                                   │
│  Assign to... search: [Search by name...]                         │
│  ● Dana R.     18 open tickets                                    │
│  ● Jordan M.    6 open tickets  ← workload count shown           │
│  ● Alex T.     12 open tickets                                    │
│                                         [Reassign 3 tickets]     │
└──────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Search bar | Top of content area, full width |
| Primary | Ticket rows with SLA badge, title, department, assignee | Main list |
| Secondary | Filter panel | Left sidebar (collapsible) |
| Secondary | Result count + sort control | Above list |
| Secondary | Facet summary | Below filter panel |
| Tertiary | Pagination | Below list |
| Tertiary | Export CSV button | Above list, right side |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default / loaded | Full list as shown | N/A |
| Loading / searching | Row skeleton loaders | Shimmer animation while Solr query runs |
| No results | Empty state illustration | "No tickets match your filters. [Clear filters]" |
| Solr unavailable | Warning banner above list | "Search is temporarily unavailable. Showing recent tickets." |
| Multi-select active | Checkboxes visible; bulk action bar fixed at bottom | Bulk action bar with count |
| Export downloading | Export button shows spinner | "Preparing export..." |
| Export too large | Error toast | "Export exceeds 5,000 rows. Refine your filters." |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Search input | Text search | Triggers Solr query with 300ms debounce |
| Bookmarks dropdown | Dropdown | Lists personal bookmarks; click to restore |
| Map toggle (⊞) | View toggle | Switches to /map with same filters |
| Filter fields | Form controls | Apply on change (with Apply button as fallback) |
| Ticket row | Navigation | Click → /tickets/:id |
| Row checkbox | Selection | Adds to bulk selection set |
| Sort dropdown | Sort control | Re-orders results |
| Export CSV | Action button | Downloads tickets.csv |
| Pagination | Navigation | ARIA-labeled prev/next + page numbers |

#### SLA Badge Color Semantics

| Badge | Color | Meaning |
|-------|-------|---------|
| 🔴 SLA Breach | Red (#EF4444) | Ticket past expected close date |
| 🟡 Due today | Amber (#F59E0B) | Closes within 24 hours |
| 🟢 On track | Green (#22C55E) | Within SLA window |
| — | None | No SLA configured for this category |
---

### Screen 03: Ticket Detail View (with History, Media, Actions Sidebar)

**Route:** `/tickets/:id`  
**Purpose:** Full ticket record. Staff read all fields, see audit history, view attachments, and take all lifecycle actions (assign, respond, close, reopen, delete) from a single screen.  
**User Stories:** US-0.2, US-0.3, US-0.4, US-0.5, US-0.6, US-6.1, US-7.2, US-13.2  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (Open First Ticket), JRN-01.2 (Assign, Select Template, Send Response)

#### Layout (Desktop — 1280px+)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                              [← Back to list]        │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────────────────────────────┐  ┌───────────────────────────┐ │
│  │  TICKET #4821                              │  │  ACTIONS SIDEBAR          │ │
│  │                                            │  │                           │ │
│  │  Pothole on Oak Avenue                     │  │  Status                   │ │
│  │                                            │  │  🔴 Open  [Pending Parts ▾]│ │
│  │  ● Open  🔴 SLA Breach  1 day overdue     │  │     (substatus dropdown)  │ │
│  │                                            │  │                           │ │
│  │  Category:   Pothole or Road Damage        │  │  [Close Ticket]           │ │
│  │  Department: Public Works                  │  │  [Reopen] (hidden if open)│ │
│  │  SLA Target: 5 business days               │  │                           │ │
│  │  Opened:     Jun 21, 2026, 10:14 AM        │  │  Assignee                 │ │
│  │  Expected:   Jun 27, 2026 (1 day overdue)  │  │  [Dana Reyes ▾ search]   │ │
│  │                                            │  │  [18 tickets open]        │ │
│  │  Reporter                                  │  │  [Assign]                 │ │
│  │  Priya Nair · priya@example.com            │  │                           │ │
│  │  555-0182                                  │  │  Department               │ │
│  │                                            │  │  [Public Works       ▾]   │ │
│  │  Location                                  │  │                           │ │
│  │  Oak Ave @ Main St, Downtown               │  │  Reporter                 │ │
│  │  [📍 View on map]                          │  │  Priya Nair               │ │
│  │                                            │  │  priya@example.com        │ │
│  │  Description                               │  │                           │ │
│  │  Large pothole on Oak Avenue near the      │  │  ──────────────────────── │ │
│  │  intersection with Main Street. About      │  │  COMPOSE                  │ │
│  │  30cm wide and 10cm deep.                  │  │  ○ Response  ○ Comment   │ │
│  │                                            │  │  [Template ▾]             │ │
│  │  Custom Fields (if any)                    │  │  ┌─────────────────────┐  │ │
│  │  Severity: High                            │  │  │                     │  │ │
│  │  Road type: Local                          │  │  │  (response body)    │  │ │
│  │                                            │  │  │                     │  │ │
│  │  Attachments (2)                           │  │  └─────────────────────┘  │ │
│  │  [🖼 pothole1.jpg] [🖼 pothole2.jpg]        │  │  [Send]                   │ │
│  │  [+ Add attachment]                        │  │                           │ │
│  │                                            │  │  ──────────────────────── │ │
│  ├────────────────────────────────────────────┤  │  [⋮ More actions]         │ │
│  │  HISTORY & AUDIT TRAIL                     │  │   Delete Ticket (admin)   │ │
│  │                                            │  │   Merge Ticket            │ │
│  │  Jun 21, 10:14 AM  Priya Nair  Opened      │  └───────────────────────────┘ │
│  │  Jun 21, 10:15 AM  System      Assigned                                    │ │
│  │                    to Dana R.                                               │ │
│  │  Jun 21, 11:00 AM  Dana R.     Comment 🔒                                  │ │
│  │  ▸ "Called field crew — scheduling inspection."                            │ │
│  │    [Internal - staff only]                                                  │ │
│  │                                                                             │ │
│  │  Jun 22,  9:30 AM  Dana R.     Response  ✉️                                │ │
│  │  ▸ "We've received your report and will investigate within 2 business days."│ │
│  │    [Sent to priya@example.com]                                              │ │
│  │                                                                             │ │
│  │  Jun 22, 10:00 AM  Dana R.     Upload 📎                                   │ │
│  │  ▸ pothole_inspection.pdf  [Download]                                       │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Ticket title, status, SLA status | Ticket header |
| Primary | Actions sidebar (close, assign, compose) | Right sidebar — always visible |
| Secondary | Core fields: category, department, reporter, location, dates | Ticket body |
| Secondary | Audit history | Below main fields |
| Tertiary | Custom fields | After standard fields |
| Tertiary | Attachments | After custom fields |
| Tertiary | More actions (delete, merge) | Kebab menu in sidebar |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Open ticket | Blue status badge; Close button visible; Reopen hidden | N/A |
| Closed ticket | Gray status badge; Reopen button visible; Close hidden | Closed timestamp shown |
| Sending response | Send button → spinner | "Sending..." |
| Response sent | Toast | "Response sent to priya@example.com" |
| SMTP failure | Warning toast | "Email delivery failed — will retry." |
| Assignment saved | Assignee badge updates inline | Toast: "Assigned to Jordan M." |
| File uploading | Thumbnail placeholder + progress bar | "Uploading..." |
| Loading (initial) | Skeleton for all panels | Shimmer |
| 404 not found | Error page | "Ticket not found. [Back to list]" |

#### Internal Comment Visibility
- Comments with `visibility = 'internal'` show a 🔒 "Internal — staff only" badge in the history
- The compose panel has a clear "Response" vs "Comment" radio toggle at the top
- "Comment" mode shows a persistent 🔒 banner: "This note will NOT be sent to the reporter"
- Internal comments never render on the public `/track/:id` page

#### Attachment Panel
- Images render as 80×80px thumbnails in a grid
- Non-images render as file icon + filename + size + download link
- "+ Add attachment" opens native file picker; uploads via POST /api/tickets/{id}/media
- Thumbnail preview appears immediately after file selection (client-side)
- Upload progress bar per file
- Max 20 attachments shown; excess prevented with inline error

#### Mobile Layout (375px)
- Sidebar actions move to a sticky bottom action bar with "Actions ▾" chevron
- Tapping "Actions" opens a bottom sheet with all sidebar controls
- History renders in full width below the ticket fields
- Compose panel opens as a bottom sheet overlay
---

### Screen 04: Create New Ticket (Staff — Multi-Step Form)

**Route:** `/tickets/new`  
**Purpose:** Staff creates a new service request ticket. Multi-step form: Category → Location → Details. Accessed from persistent "+ New Ticket" button.  
**User Stories:** US-0.1, US-5.1, US-7.1  
**Personas:** Dana (PER-01)  
**Journey:** JRN-01.2 (Receive Call, Enter Details, Assign Ticket, Save Ticket)

#### Layout (Desktop — Step 1: Category)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                              [✕ Cancel]         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  New Ticket         ① Category  →  ② Location  →  ③ Details             │
│                     [●━━━━━━━━━━━━━━○━━━━━━━━━━━━━○]  (step indicator)  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  What type of issue is this?                                       │   │
│  │                                                                    │   │
│  │  🔍 [Search categories...]                                         │   │
│  │                                                                    │   │
│  │  ▼ Roads & Infrastructure                                         │   │
│  │    ○ Pothole or Road Damage           → Public Works               │   │
│  │    ○ Storm Drain / Drainage Issue     → Public Works               │   │
│  │    ○ Sidewalk / Curb Damage           → Public Works               │   │
│  │                                                                    │   │
│  │  ▼ Lighting & Utilities                                           │   │
│  │    ○ Broken Streetlight               → Utilities Dept             │   │
│  │    ○ Traffic Signal Issue             → Transportation             │   │
│  │                                                                    │   │
│  │  ▼ Parks & Green Spaces                                           │   │
│  │    ○ Fallen Tree / Debris             → Parks Dept                 │   │
│  │    ○ Vandalism in Park                → Parks Dept                 │   │
│  │                                                                    │   │
│  │  Note: "→ Department Name" shows routing before committing         │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                          [Next: Location →]│
└───────────────────────────────────────────────────────────────────────────┘
```

#### Layout (Step 2: Location)

```
┌───────────────────────────────────────────────────────────────────────────┐
│  New Ticket         ① Category  →  ② Location  →  ③ Details             │
│                     [●━━━━━━━━━━━━━━●━━━━━━━━━━━━━○]                     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  Where is the issue located?                                       │   │
│  │                                                                    │   │
│  │  Street address                                                    │   │
│  │  [___________________________________________________]             │   │
│  │  ↳ Geocoding automatically...                                      │   │
│  │                                                                    │   │
│  │  ─── or click on the map ───                                       │   │
│  │                                                                    │   │
│  │  ┌────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                            │   │   │
│  │  │          [Interactive Map — Leaflet/MapLibre]              │   │   │
│  │  │          📍 Pin at geocoded location                       │   │   │
│  │  │          (click to reposition)                             │   │   │
│  │  │                                                            │   │   │
│  │  └────────────────────────────────────────────────────────────┘   │   │
│  │                                                                    │   │
│  │  Latitude: 43.1234   Longitude: -79.5678  (editable)              │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                          [← Back]  [Next: Details →]      │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Layout (Step 3: Details)

```
┌───────────────────────────────────────────────────────────────────────────┐
│  New Ticket         ① Category  →  ② Location  →  ③ Details             │
│                     [●━━━━━━━━━━━━━━●━━━━━━━━━━━━━●]                     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  Ticket details                                                    │   │
│  │                                                                    │   │
│  │  Title *                                                           │   │
│  │  [______________________________________________] (max 255)        │   │
│  │                                                                    │   │
│  │  Description                                                       │   │
│  │  [______________________________________________________]          │   │
│  │  [______________________________________________________]          │   │
│  │  [______________________________________________________] (5000)  │   │
│  │                                                                    │   │
│  │  ──── Custom fields (from selected category) ────                  │   │
│  │  Severity    [High ▾]     Road type  [Local ▾]                    │   │
│  │                                                                    │   │
│  │  ──── Attachments ────                                             │   │
│  │  [📎 Add files or drag & drop]                                    │   │
│  │  Max 10MB per file · JPEG, PNG, GIF, WebP, PDF                    │   │
│  │                                                                    │   │
│  │  ──── Reporter (optional) ────                                     │   │
│  │  Name  [_________________________]                                 │   │
│  │  Email [_________________________]   Phone [_____________]         │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─ Review ─────────────────────────────────────────────────────────┐    │
│  │  Pothole or Road Damage → Public Works · Oak Ave @ Main St       │    │  ← sticky
│  │                                          [← Back]  [Create Ticket]│    │
│  └───────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Step 1: Category selection with routing preview | Full content area, Step 1 |
| Primary | Step 2: Address field + map | Full content area, Step 2 |
| Primary | Step 3: Title (required) | Top of Step 3 |
| Secondary | Step 3: Description | Below title |
| Secondary | Step 3: Custom category fields | After description |
| Tertiary | Step 3: Reporter contact info | After custom fields |
| Tertiary | Step 3: File attachments | After reporter |
| Always | Review bar: routing summary + CTA | Sticky bottom bar |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Step 1 — no selection | Next button disabled | N/A |
| Geocoding in progress | Spinner next to address field | "Looking up address..." |
| Geocode success | Map pin drops; address field shows normalized value | Green checkmark next to field |
| Geocode fail (soft) | Warning banner | "Address not confirmed. Ticket will still be saved." |
| Form validation error | Red inline errors below each field | Scroll to first error on submit |
| API 422 errors | Inline errors from server mapped to fields | N/A |
| Submitting | Create Ticket → spinner, disabled | "Creating ticket..." |
| Success | Navigate to /tickets/:id | Toast: "Ticket #4821 created" |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Category search | Combobox | Filters list as user types |
| Category radio item | Radio | Selects category; shows department routing |
| Address field | Text input | Geocodes on blur |
| Map | Interactive map | Click to place pin; updates lat/lng fields |
| Custom fields | Dynamic form | Rendered from `category.fields` at runtime |
| File upload zone | Drag + click | Opens native picker; validates type/size client-side |
| Back button | Navigation | Returns to previous step; preserves form state |
| Next button | Navigation | Validates current step before advancing |
| Create Ticket | Submit CTA | Sends POST /api/tickets |
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
---

### Screen 06: Department / SLA Dashboard (Manager View)

**Route:** `/reports/sla` (also surfaced via dashboard KPI cards)  
**Purpose:** Real-time SLA compliance metrics per department and category. Manager's primary accountability tool. Answers: "Which categories are breaching SLA? Which staff are overloaded?"  
**User Stories:** US-9.1, US-9.3  
**Personas:** Marcus (PER-02)  
**Journey:** JRN-02.1 (Login & Land, Drill into SLA Breaches)

#### Layout (Desktop — 1280px+)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  SLA Compliance Dashboard                    Period: [Last 30 days ▾]    │
│                                              Department: [All ▾]          │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │  ← KPIs
│  │  Total Closed│  │  On Time     │  │  Late        │  │  On-Time %  │  │
│  │     342      │  │    287       │  │    55        │  │    83.9%    │  │
│  │  (last 30d)  │  │              │  │              │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │  ← Category breakdown
│  │  SLA Performance by Category                                        │  │
│  │                                                                     │  │
│  │  Category              Total  On-Time  Late  On-Time%  SLA Days    │  │
│  │  ──────────────────────────────────────────────────────────────── │  │
│  │  Pothole or Road Dmg    145     112      33    77.2%   🔴  5 days  │  │
│  │  Broken Streetlight      67      62       5    92.5%   🟢  3 days  │  │
│  │  Storm Drain             45      38       7    84.4%   🟡  5 days  │  │
│  │  Parks Maintenance       38      35       3    92.1%   🟢  7 days  │  │
│  │  Missed Garbage          28      26       2    92.9%   🟢  2 days  │  │
│  │  Other                   19      14       5    73.7%   🔴  5 days  │  │
│  │                                                                     │  │
│  │  [Download as CSV]                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │  ← Open tickets past SLA
│  │  Open Tickets Past SLA  (55 tickets)                    [View all →]│  │
│  │                                                                     │  │
│  │  #4821 Pothole on Oak Ave    +1 day overdue   Dana R.   [Reassign] │  │
│  │  #4815 Broken manhole        +1 day overdue   Dana R.   [Reassign] │  │
│  │  #4808 Sidewalk crack        +3 days overdue  Unassigned [Assign]  │  │
│  │  ... (showing 5 of 55)  [Show all overdue tickets]                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │  ← Staff workload
│  │  Staff Workload (open tickets)                                      │  │
│  │                                                                     │  │
│  │  Dana R.   ████████████████████ 18  (3 breached)                   │  │
│  │  Alex T.   ████████████ 12  (1 breached)                           │  │
│  │  Jordan M. ██████ 6  (0 breached)                                  │  │
│  │  Unassigned██ 3  (2 breached)                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | On-Time % KPI (large number) | KPI row, last card |
| Primary | Late / breach count | KPI row, third card |
| Primary | Open tickets past SLA (actionable list) | Middle panel |
| Secondary | SLA per-category table | Main content |
| Secondary | Staff workload chart | Bottom panel |
| Tertiary | Period and department filter | Top right |
| Tertiary | CSV download | Inside category table |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default | Full dashboard | N/A |
| Loading | Skeleton placeholders | Shimmer |
| No breaches | On-Time % = 100%; breach panel shows "✅ No SLA breaches" | Success callout |
| Stale cache | Note: "Last updated 3 minutes ago" | Small timestamp |
| Period filter applied | All numbers refresh | N/A |
| No SLA configured | Category row shows "—" in SLA Days; excluded from % calc | Tooltip: "No SLA configured" |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Period dropdown | Select | Triggers GET /api/metrics/sla?days={n} |
| Department dropdown | Select | Filters all panels to selected department |
| Category table row | Navigation | Click → /tickets?categoryId={id}&sla=late |
| "View all →" link | Navigation | /tickets?sla=breach&departmentId={id} |
| Inline Reassign/Assign | Quick action | Opens assignee search inline; assigns and removes from list |
| Download as CSV | Action | Downloads SLA report as CSV |
| Staff workload bar | Navigation | Click → /tickets?assigneeId={id} |

#### Notes
- The SLA metrics endpoint (`GET /api/metrics/sla`) is public (no auth required) and cached for 5 minutes per US-9.1. The UI shows a "Last updated" timestamp.
- The on-time percentage color coding: ≥90% = green, 75–89% = amber, <75% = red.
- "Open Tickets Past SLA" panel is the direct output of `GET /api/reports/open-age` (US-9.3).
- Inline quick-assign within the breach list enables JRN-02.1 bulk reassignment without navigating away.
---

### Screen 07: Reports View (Activity, Assignments, SLA)

**Route:** `/reports`  
**Purpose:** Staff/admin download standardized reports with configurable date range and department filters. Primary use case: Marcus generating the weekly city director briefing CSV.  
**User Stories:** US-9.2, US-9.3  
**Personas:** Marcus (PER-02)  
**Journey:** JRN-02.1 (Generate Weekly Report, Paste into Excel)

#### Layout (Desktop — 1280px+)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Reports                                                                  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │  ← Filter bar
│  │  Date range:  [Jun 17, 2026] to [Jun 23, 2026]  [This week]        │ │
│  │  Department:  [Public Works ▾]   Assignee: [All ▾]   Category: [All]│ │
│  │                                                       [Apply]        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────┐  ┌──────────────────────────────────────────────┐ │  ← Report nav
│  │  REPORT TYPES      │  │                                              │ │
│  │                    │  │  Activity Report                             │ │
│  │  ● Activity        │  │  ─────────────────────────────────────────  │ │
│  │  ○ Assignments     │  │                                              │ │
│  │  ○ SLA Compliance  │  │  ┌────────┐ ┌────────┐ ┌────────┐           │ │
│  │  ○ Volume Trends   │  │  │Opened  │ │Closed  │ │Open at │           │ │
│  │  ○ Staff Perf.     │  │  │  34    │ │  28    │ │end: 87 │           │ │
│  │  ○ Open Age (SLA)  │  │  └────────┘ └────────┘ └────────┘           │ │
│  │                    │  │                                              │ │
│  └────────────────────┘  │  Daily breakdown                            │ │
│                           │                                              │ │
│                           │  Date       Opened  Closed  Net             │ │
│                           │  Jun 17      6        4      +2             │ │
│                           │  Jun 18      8        5      +3             │ │
│                           │  Jun 19      4        6      -2             │ │
│                           │  Jun 20      7        4      +3             │ │
│                           │  Jun 21      5        5       0             │ │
│                           │  Jun 22      4        4       0             │ │
│                           │  TOTAL      34       28      +6             │ │
│                           │                                              │ │
│                           │  ┌──────────────────────┐                  │ │
│                           │  │  📥  Download CSV     │                  │ │
│                           │  └──────────────────────┘                  │ │
│                           └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Assignment Report (sub-view)

```
│  Assignment Report
│  ─────────────────────────────────────────────────────
│
│  Staff Member    Open  Closed  Avg Days to Close
│  Dana R.          18     142      3.2 days
│  Jordan M.         6      67      2.8 days
│  Alex T.          12      98      4.1 days
│  Unassigned        3      —         —
│
│  [Download CSV]
```

#### SLA Compliance Report (sub-view)

```
│  SLA Compliance Report
│  ─────────────────────────────────────────────────────
│
│  Category              Total  On-Time  Late  %
│  Pothole or Road Dmg    145    112      33   77.2%  🔴
│  Broken Streetlight      67     62       5   92.5%  🟢
│  Storm Drain             45     38       7   84.4%  🟡
│
│  [Download CSV]
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Date range filter (defaults to "This week") | Top filter bar |
| Primary | Report output table / metrics | Main content area |
| Primary | Download CSV button | Below each report table |
| Secondary | Report type navigation | Left sidebar |
| Secondary | Department / assignee filters | Top filter bar |
| Tertiary | Summary KPI cards above table | Per-report, optional |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (Activity) | Pre-loaded with "this week" data | N/A |
| Loading | Skeleton table rows | Shimmer |
| No data in range | Empty state | "No tickets found for this date range." |
| Date range too large (>2yr) | Inline error | "Date range cannot exceed 2 years." |
| Downloading | Button spinner | "Preparing CSV..." |
| Download success | Browser file download triggered | N/A |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Date range inputs | Date pickers | Triggers report refresh on Apply |
| "This week" shortcut | Quick-select | Sets dateFrom/dateTo to Mon–today |
| Report type radio | Navigation | Switches report content panel |
| Department dropdown | Select | Filters all reports to department |
| Download CSV | Action | GET /api/reports/{type}?format=csv with current filters |
| Table row (SLA report) | Navigation | Click → /tickets?categoryId={id}&sla=late |

#### Notes
- All date filters default to "this week" (Monday to today) per JRN-02.1: "date range defaults to 'current week'"
- CSV column order is stable and documented (per US-4.2, US-9.2) — Marcus's Excel pivot table relies on this
- Report requires `staff` or `admin` role; public users see 403 (US-9.2 acceptance criteria)
- Maximum report date range: 2 years (US-9.2); exceeding returns error with `DATE_RANGE_TOO_LARGE`
---

### Screen 08: Admin Panel (Categories, Departments, Users, Clients)

**Route:** `/admin` and sub-routes  
**Purpose:** System configuration for admins. All CRUD operations for departments, categories, people, templates, API clients, and substatuses — without SSH or direct DB access.  
**User Stories:** US-2.1, US-2.2, US-3.1, US-14.1, US-14.2, US-15.4  
**Personas:** Tomás (PER-04)  
**Journey:** JRN-04.1 (Configure OIDC), JRN-04.2 (Register API Client, Provision Staff User)

#### Admin Navigation Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [uReport Logo]  Tickets  Reports  Map  │  Admin  │  [Tomás E. ▾]         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐  │
│  │  ADMIN               │  │                                          │  │
│  │                      │  │  [Content area for selected section]     │  │
│  │  ● Departments       │  │                                          │  │
│  │  ○ Categories        │  │                                          │  │
│  │  ○ People & Users    │  │                                          │  │
│  │  ○ Substatuses       │  │                                          │  │
│  │  ○ Templates         │  │                                          │  │
│  │  ○ API Clients       │  │                                          │  │
│  │  ○ Settings          │  │                                          │  │
│  │    ↳ OIDC            │  │                                          │  │
│  │    ↳ SMTP            │  │                                          │  │
│  └──────────────────────┘  └──────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

#### /admin/departments

```
│  Departments                                        [+ New Department]  │
│                                                                         │
│  Name               Default Assignee  Open Tickets  Active  Actions    │
│  ────────────────────────────────────────────────────────────────────  │
│  Public Works       Dana Reyes         45           ✅       [Edit][⋮] │
│  Utilities          Alex Turner        12           ✅       [Edit][⋮] │
│  Parks Dept         Jordan Mills        8           ✅       [Edit][⋮] │
│  Legacy Dept        —                   0           ❌       [Reactivate]│
│
│  Deactivate modal (when dept has active tickets):
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  ⚠️  This department has 45 active tickets.                     │
│  │                                                                 │
│  │  Deactivating it will remove it from ticket routing and the    │
│  │  Open311 services list. Existing tickets will not be affected. │
│  │                                                                 │
│  │  Type the department name to confirm: [___________________]    │
│  │                                    [Cancel]  [Deactivate]      │
│  └─────────────────────────────────────────────────────────────────┘
```

#### /admin/categories

```
│  Categories                                          [+ New Category]  │
│  🔍 [Search categories...]        Department: [All ▾]                  │
│                                                                         │
│  Name                   Dept         SLA  Display  Posting  Active     │
│  ─────────────────────────────────────────────────────────────────────│
│  Pothole or Road Dmg    Public Works  5d  Public   Public    ✅  [Edit] │
│  Storm Drain            Public Works  5d  Public   Public    ✅  [Edit] │
│  Internal: HR Request   HR Dept       —   Staff    Staff     ✅  [Edit] │
│                                                                         │
│  New / Edit Category — multi-step form:                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Step 1: Basic Info                                             │   │
│  │  Name * [_________________________]                             │   │
│  │  Department * [Public Works ▾]                                  │   │
│  │  Group [Roads & Infrastructure ▾]                               │   │
│  │  SLA Days [5]  (0 = no SLA)                                    │   │
│  │                                                    [Next →]     │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Step 2: Permissions                                            │   │
│  │  Display permission:                                            │   │
│  │  ○ Public  ○ Staff only  ○ Anonymous                            │   │
│  │  Posting permission:                                            │   │
│  │  ○ Public  ○ Staff only  ○ Anonymous                            │   │
│  │  Default Assignee [search person...▾]                           │   │
│  │  Auto-close after [_] days (0 = disabled)                       │   │
│  │                                          [← Back]  [Next →]    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Step 3: Custom Fields (optional)                               │   │
│  │  [+ Add field]                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ Code [severity]  Label [Severity]  Type [Select ▾]       │  │   │
│  │  │ Options: [High] [Medium] [Low] [+ Add option]            │  │   │
│  │  │                                              [✕ Remove]  │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                          [← Back]  [Save]      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
```

#### /admin/people

```
│  People & Users                                        [+ New Person]  │
│  🔍 [Search by name or email...]  Role: [All ▾]  Dept: [All ▾]        │
│                                                                         │
│  Name           Role    Department    Email                    Active  │
│  ────────────────────────────────────────────────────────────────────│
│  Dana Reyes     Staff   Public Works  dana@city.gov            ✅  [Edit]│
│  Marcus Webb    Admin   (all depts)   marcus@city.gov          ✅  [Edit]│
│  Priya Nair     Public  —             priya@example.com        ✅  [Edit]│
│
│  Edit Person — with Contact Methods tab:
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  [General]  [Contact Methods]                                   │
│  │                                                                 │
│  │  First name * [Dana]    Last name * [Reyes]                    │
│  │  Role * [Staff ▾]  — "can manage tickets in assigned depts"   │
│  │  Department [Public Works ▾]                                    │
│  │  Active [✅]                                                    │
│  │                                                                 │
│  │  Contact Methods tab:                                           │
│  │  [+ Add email]  [+ Add phone]  [+ Add address]                 │
│  │  dana@city.gov  📧 Primary  [✏ Edit] [🗑 Remove]               │
│  │  dana.reyes@personal.com  📧  [Set primary] [🗑 Remove]        │
│  └─────────────────────────────────────────────────────────────────┘
```

#### /admin/clients (API Client Management)

```
│  API Clients                                      [+ New API Client]  │
│                                                                        │
│  Name                 Contact              Key Hint      Status       │
│  ──────────────────────────────────────────────────────────────────  │
│  City Mobile App v1   mobile@city.gov      a3f82b91…    ✅ Active     │
│                                            [Regenerate Key] [Revoke]  │
│  Legacy Integration   legacy@example.com   f1e2d3c4…    ❌ Revoked   │
│                                                         [Reactivate]  │
│
│  New API Client form:
│  Name * [_________________________]  (unique, max 255)
│  Contact Email * [_________________________]
│  Notes [_________________________]
│                                              [Generate API Key]
│
│  One-time key modal (after generation):
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  🔑  API Key Generated                                          │
│  │                                                                 │
│  │  a3f82b91-dc4e-4f62-8a1b-xxxxxxxxxxxx                          │
│  │  ┌───────────────┐                                             │
│  │  │ 📋 Copy key   │                                             │
│  │  └───────────────┘                                             │
│  │                                                                 │
│  │  ⚠️  This key will NOT be shown again after you close          │
│  │     this dialog. Save it in a secure location.                 │
│  │                                                                 │
│  │                    [✅ I've saved my key — Close]               │
│  └─────────────────────────────────────────────────────────────────┘
│  (No × button on this modal — must acknowledge)
```

#### /admin/settings (OIDC + SMTP)

```
│  Settings
│  [OIDC Authentication]  [Email (SMTP)]
│
│  OIDC Authentication Settings
│  ──────────────────────────────────────────────
│  OIDC Issuer URL   [https://sso.city.gov/realm/ureport      ]
│  Client ID         [ureport-app                              ]
│  Client Secret     [••••••••••••••••••••    ] [👁 Show]
│  Session TTL       [28800] seconds  (8 hours)
│
│  [🔌 Test Connection]
│  ✅ Provider reachable at https://sso.city.gov — Login flow will work.
│  (or ❌ Could not reach provider. Check issuer URL and network access.)
│
│                                                       [Save Settings]
```

#### States (Key admin screens)

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Save success | Row updates; toast | "Department saved." / "Category saved." |
| Validation error | Inline red errors | Field-level messages |
| Deactivate blocked | Modal with confirmation | "Has active tickets — confirm?" |
| OIDC test in progress | Button spinner | "Testing connection..." |
| OIDC test success | Green inline banner | "Provider reachable." |
| OIDC test fail | Red inline banner | "Could not reach provider." |
| Key modal open | Modal blocks background | No X button; must acknowledge |

#### Non-admin access
- All `/admin/*` routes redirect to `/login` for unauthenticated users
- Authenticated `staff` or `public` role users see a "Access Denied" page with a "Go to Tickets" link
---

### Screen 09: Open311 API Client Documentation Page (Swagger UI)

**Route:** `/api/docs`  
**Purpose:** Interactive OpenAPI 3.1 documentation for all internal API endpoints plus the Open311 GeoReport v2 surface. Allows Tomás and API developers to discover field names, request/response schemas, and test endpoints without reading PHP source code.  
**User Stories:** US-16.2, US-1.3  
**Personas:** Tomás (PER-04)  
**Journey:** JRN-04.1 (Read OpenAPI Spec)

#### Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav — minimal: uReport logo + "Back to app"]                        │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  uReport API  v2.0.0                                                     │
│  OpenAPI 3.1 Specification · [Download openapi.json] [Download YAML]    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  🔍 Filter endpoints...                                              │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ▼ Open311 GeoReport v2  (preserved spec)                                │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  GET  /open311/discovery          Discovery document                │ │
│  │  GET  /open311/services           List available services           │ │
│  │  GET  /open311/services/{code}    Service definition + attributes   │ │
│  │  POST /open311/requests           Submit service request ⬤ TRY IT  │ │
│  │  GET  /open311/requests           Query service requests ⬤ TRY IT  │ │
│  │  GET  /open311/requests/{id}      Get single request    ⬤ TRY IT  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ▼ Tickets                                                               │
│  │  POST /api/tickets                Create ticket                     │ │
│  │  GET  /api/tickets                Search / list tickets             │ │
│  │  GET  /api/tickets/{id}           Get ticket detail                 │ │
│  │  PUT  /api/tickets/{id}           Update ticket fields              │ │
│  │  POST /api/tickets/{id}/assign    Assign ticket                     │ │
│  │  POST /api/tickets/{id}/close     Close ticket                      │ │
│  │  POST /api/tickets/{id}/reopen    Reopen ticket                     │ │
│  │  DELETE /api/tickets/{id}         Delete ticket (admin)             │ │
│  │  POST /api/tickets/{id}/responses Post response (external)          │ │
│  │  POST /api/tickets/{id}/comments  Post comment (internal)           │ │
│  │  GET  /api/tickets/{id}/history   Ticket audit history              │ │
│  │  GET  /api/tickets/{id}/media     List attachments                  │ │
│  │  POST /api/tickets/{id}/media     Upload attachment                 │ │
│  │  GET  /api/tickets/clusters       Geo-cluster data                  │ │
│                                                                           │
│  ▼ Reports & Metrics                                                     │
│  ▼ Admin — Departments, Categories, People, Templates, Clients          │
│  ▼ Authentication                                                        │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Expanded endpoint (e.g. POST /open311/requests):                   │ │
│  │                                                                      │ │
│  │  Description: Submit a new service request via Open311              │ │
│  │  Auth: API key (optional — required for non-anonymous categories)   │ │
│  │                                                                      │ │
│  │  Parameters / Request body:                                          │ │
│  │  api_key         string  optional  "a3f82b91-…"                     │ │
│  │  service_code *  string  required  "1" (maps to category ID)        │ │
│  │  lat             number  optional  43.1234                          │ │
│  │  long            number  optional  -79.5678                         │ │
│  │  address_string  string  optional  "123 Main St"                    │ │
│  │  description     string  optional  "Large pothole..."               │ │
│  │  email           string  optional  "user@example.com"              │ │
│  │  media_url       string  optional  "https://…/photo.jpg"           │ │
│  │  attribute[severity]  string  optional  "high"                     │ │
│  │                                                                      │ │
│  │  Responses:                                                          │ │
│  │  201  [{ service_request_id: "4821", status: "open", … }]          │ │
│  │  400  [{ code: 400, description: "Invalid api_key" }]               │ │
│  │  404  [{ code: 404, description: "service_code not found" }]        │ │
│  │                                                                      │ │
│  │                                   [⬤ Try it out] [Execute]         │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Endpoint list with verb + path + description | Main content, scrollable |
| Primary | Expanded schema: request body, parameters, response shapes | Expanded accordion per endpoint |
| Secondary | "Try it out" / Execute panel | Inside each expanded endpoint |
| Secondary | Filter box | Top of endpoint list |
| Tertiary | Download openapi.json / YAML | Top of page |
| Tertiary | Back to app link | Top nav |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Endpoint collapsed | Single row: verb badge + path + summary | N/A |
| Endpoint expanded | Full schema accordion panel | N/A |
| Try it out active | Input fields populated; Execute button | N/A |
| Request executing | Execute button spinner | "Calling API..." |
| Response received | Response body + status code rendered | JSON/XML syntax-highlighted |
| Auth required for Try it | Bearer token input appears | "Provide your JWT to test protected endpoints" |

#### Notes
- The Swagger UI is served at `/api/docs` and is accessible to `staff` and `admin` roles (US-15.4, US-16.2).
- Raw spec files at `/api/openapi.json` and `/api/openapi.yaml` for tooling integration.
- Open311 endpoints are documented in the same spec with their spec-required error format (`[{code, description}]`) distinguished from the internal envelope format.
- The "Field Mapping" note for each Open311 endpoint cross-references internal field names (e.g., `service_code` = `categories.id`), directly addressing JRN-04.1 pain point: "No API documentation; required reading PHP controllers."
- TypeScript client types auto-generated from this spec during frontend build (per US-16.2 acceptance criteria). Not exposed in the UI but mentioned in the page description.
---

### Screen 10: Map View (Geo-Clustered Tickets)

**Route:** `/map` (also togglable from /tickets)  
**Purpose:** Visualize ticket density across the city. Staff identify neighborhood hotspots. Clusters drill down to individual ticket markers on zoom.  
**User Stories:** US-5.2, US-4.1  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (implied — geospatial triage)

#### Layout (Desktop — 1280px+)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                               [⊞ List view]    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │  ← Map fills viewport
│ │                                                                    │   │
│ │  [Full-width interactive map — Leaflet / MapLibre]                 │   │
│ │                                                                    │   │
│ │          ⬤ 45              ⬤ 23                                   │   │  ← cluster circles
│ │       (red cluster)     (amber cluster)                            │   │
│ │                    ⬤ 8                                            │   │
│ │                  (green)                                           │   │
│ │                                          📍  📍  📍                │   │  ← individual markers
│ │                                          (high zoom: individual)   │   │
│ │                                                                    │   │
│ │  [─ zoom controls ─]                                               │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │  ← Filter overlay panel
│ │ Filters (same as /tickets filter panel)                            │   │
│ │ Status: ● Open ○ Closed  │  Category: [All ▾]  │  [Apply]         │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │  ← Ticket popup (on click)
│ │  📍  Ticket #4821                                    [View ticket] │   │
│ │       Pothole on Oak Avenue                                        │   │
│ │       Status: Open  🔴 SLA Breach                                  │   │
│ │       Assigned: Dana R.  |  Jun 21, 2026                          │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Cluster Behavior

| Zoom Level | Behavior | API source |
|-----------|----------|-----------|
| 1–10 (city / region) | Large colored cluster circles, count shown | GET /api/tickets/clusters |
| 11–14 (neighborhood) | Medium clusters; ≤ 10 per cell → individual markers | GET /api/tickets/clusters |
| 15–20 (street level) | Individual ticket markers; cluster circles gone | GET /api/tickets (with bbox) |

**Cluster color by SLA status:**
- 🔴 Red cluster: ≥1 ticket in SLA breach within the cluster
- 🟡 Amber cluster: ≥1 ticket due within 24 hours (no breaches)
- 🟢 Green cluster: all tickets within SLA window
- Gray cluster: no SLA configured for tickets in cluster

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Map with cluster circles | Full viewport |
| Primary | Ticket popup on cluster/marker click | Overlay at click point |
| Secondary | Filter panel | Bottom overlay (collapsible) |
| Secondary | Cluster counts | Inside each cluster circle |
| Tertiary | List view toggle | Top right |
| Tertiary | Zoom controls | Left side of map |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Loading clusters | Spinner overlay on map | "Loading ticket data..." |
| No tickets in viewport | Empty map with filter panel | "No tickets in this area. Zoom out or clear filters." |
| Cluster clicked | Zooms in one level (or shows popup if individual marker) | N/A |
| Individual marker clicked | Popup with ticket summary | [View ticket →] link |
| Geo service unavailable | Banner | "Map data temporarily unavailable." |
| Filter applied | Clusters refresh to reflect filtered tickets | N/A |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Cluster circle | Click | Zooms in one level; if <10 items, shows list popup |
| Individual marker | Click | Opens ticket summary popup |
| "View ticket" in popup | Navigation | /tickets/:id |
| Map drag/pan | Map interaction | Updates bbox; fetches new cluster data |
| Zoom in/out | Map controls | Changes cluster resolution |
| Filter panel | Collapsible | Apply filters → refreshes cluster data |
| "List view" toggle | Navigation | /tickets with same filters |

#### Mobile Map (375px)
- Map fills entire screen (no sidebar)
- Filter icon (⚙) in top-right opens a bottom sheet with filter controls
- Ticket popup appears as a bottom sheet (not an overlay bubble)
- "View ticket" in popup navigates to /tickets/:id
- Zoom controls accessible via pinch gesture + floating +/- buttons
---

## Interaction Patterns

### Pattern: Inline Action Panels (No Page Navigation for Actions)

**When to use:** Any mutation action on a ticket (assign, respond, comment, close, reopen)  
**Behavior:** Action controls live in the right sidebar of the ticket detail view on desktop. On mobile, they appear as a bottom sheet. The user never navigates away from the ticket to perform an action.  
**Why:** JRN-01.2 pain point — legacy required navigating to separate pages for responses, templates, and assignment, losing context and slowing call intake.  
**Examples:** Ticket detail screen (Screen-03), compose panel, assignee field  
**Implementation notes:**
- Right sidebar is sticky (scrolls with the page on short viewports)
- Bottom sheet on mobile slides up from the bottom with a drag handle
- Compose panel shows "Response / Comment" radio clearly before typing begins
- All mutations submit via the existing ticket detail page URL (no route change)

---

### Pattern: Progressive Disclosure in Multi-Step Forms

**When to use:** Creating a ticket (staff, Screen-04), public submission (citizen, Screen-05), category configuration (admin, Screen-08)  
**Behavior:** Form is divided into 3–4 clearly labeled steps. Only the current step's fields are visible. Back/next navigation preserves entered data. Required fields block advancing; optional fields allow skipping.  
**Why:** Reduces cognitive load for first-time users (citizens, new staff). Applies to all four personas across different flows.  
**Examples:** Staff ticket create (/tickets/new), public submit (/submit), admin category create  
**Step indicator:** Visual step dots or numbered breadcrumb at top; announces current step via `aria-live`

---

### Pattern: One-Click Bookmark Restore

**When to use:** Staff user returns to /tickets after login  
**Behavior:** Bookmarks dropdown in the filter bar lists up to 50 personal bookmarks. Clicking any bookmark immediately sets all filter parameters (status, category, department, assignee, sort, date range) and reloads the result list.  
**Why:** JRN-01.1 core need — "restore her personal filter queue in ≤ 2 clicks after login"  
**Examples:** Ticket list (Screen-02), Dashboard (Screen-01)  
**URL state:** Filter state is reflected in the URL query params so bookmarks can be shared via link

---

### Pattern: SLA Color Semantics (Consistent Across All Views)

**When to use:** Any surface that shows a ticket with an SLA — ticket list, dashboard KPI cards, SLA dashboard, map clusters  
**Behavior:** A consistent three-color system communicates urgency at a glance without reading text:
- 🔴 Red: SLA breached (past expected close date)
- 🟡 Amber: SLA due within 24 hours
- 🟢 Green: Within SLA window
- — (none): No SLA configured for this category  
**Why:** JRN-01.1 "color-coded SLA status badges let Dana rank at a glance without opening tickets"  
**Accessibility:** Color is never the sole indicator — badge also includes text label ("Breached", "Due today", "On track") for color-blind users and screen readers

---

### Pattern: One-Time Secret Display (API Key Generation)

**When to use:** Admin generates a new API client key  
**Behavior:** Generated key is shown in a modal that:
1. Has no ✕ button (cannot be dismissed without acknowledging)
2. Has a "Copy to clipboard" button
3. Has a warning: "This key will not be shown again"
4. Has a single confirmation button: "I've saved my key — Close"  
**Why:** JRN-04.2 key moment — "the generated key is shown only once; a clear 'Copy to clipboard' interaction and a warning prevents Tomás from losing the key"  
**Examples:** Admin API Clients screen (Screen-08)

---

### Pattern: Sticky Submit CTA (Mobile Forms)

**When to use:** Any form on mobile viewport (≤768px)  
**Behavior:** The primary submit/next button is fixed to the bottom of the viewport using `position: sticky` on a button bar. Always reachable without scrolling.  
**Why:** JRN-03.1 — Priya submitting on a 375px phone. Scroll depth on mobile is unpredictable; the CTA must always be in thumb reach.  
**Examples:** Public submit form (Screen-05), ticket create (Screen-04 mobile)

---

### Pattern: Inline Error Display (Field-Level, Not Modal)

**When to use:** Any form with server-side validation (422 responses)  
**Behavior:**
1. Client-side validation runs first (required fields, email format, file size/type)
2. On submission, API 422 errors are mapped to field names and displayed below the relevant input
3. Page scrolls to the first field with an error
4. Error messages are associated with their inputs via `aria-describedby`  
**Why:** US-15.2: "Server validation errors (HTTP 422) are displayed as inline field-level error messages"  
**Examples:** All forms — ticket create, public submit, admin panels  
**Pattern:** Never use a generic modal for validation errors; always surface field-level

---

### Pattern: Toast Notifications for Action Feedback

**When to use:** After any successful mutation (assign, close, respond, create, delete, export)  
**Behavior:**
- Toast appears top-right (desktop) or top-center (mobile)
- Auto-dismisses after 4 seconds
- Can be manually dismissed
- Includes action summary: "Ticket #4821 assigned to Jordan M."
- Error toasts (SMTP failure, partial success) use amber/red color and do not auto-dismiss  
**Examples:** After assign, respond, close, create, bulk reassign, CSV download start

---

### Pattern: Confirmation Dialogs for Destructive Actions

**When to use:** Delete ticket (admin), deactivate department/category, revoke API key, reopen closed ticket  
**Behavior:**
- Modal dialog with clear warning copy
- For high-risk actions (delete ticket, deactivate dept with active tickets): user must type a confirmation string (ticket ID or department name)
- Cancel button always on the left; destructive button on the right
- Destructive button uses red color token with clear label ("Delete", "Deactivate")  
**Why:** US-0.7, US-2.2 — prevent accidental irreversible actions  
**Examples:** Ticket delete, Department deactivate (with active tickets warning)
---

## Responsive Considerations

### Breakpoints

| Name | Width | Primary target |
|------|-------|---------------|
| `sm` | 375px | iPhone SE / small Android; citizen submission form |
| `md` | 768px | iPad portrait; field staff with tablet |
| `lg` | 1024px | iPad landscape; laptop |
| `xl` | 1280px | Standard desktop workstation |
| `2xl` | 1920px | Wide monitor; manager dashboard |

---

### Screen-by-Screen Responsive Behavior

#### Screen 00: Login
- **Desktop:** Centered card (max-width 400px) on a full-page background
- **Mobile:** Card fills viewport width with 16px padding; no change in content

#### Screen 01: Dashboard
- **Desktop (xl+):** 4-column KPI card row; 2-column second row (workload + bookmarks); 1-column recent tickets
- **Tablet (md–lg):** 2-column KPI row; stacked second row; full-width recent tickets
- **Mobile (sm):** Single-column everything; KPI cards are horizontally scrollable (snap scroll); workload chart hidden or simplified to a list; bookmarks panel collapses to a "Bookmarks" button that opens a bottom sheet

#### Screen 02: Ticket List
- **Desktop (xl+):** Left filter sidebar (260px) + right results list
- **Tablet (md–lg):** Filter sidebar collapses to a top filter bar (horizontal chips); results full-width
- **Mobile (sm):** Filter icon opens a full-screen bottom sheet; results in single-column cards (not table rows); checkboxes for bulk selection present but toolbar adjusts; export CSV hidden (available in desktop/tablet)

#### Screen 03: Ticket Detail
- **Desktop (xl+):** 2-column layout — ticket content (left, ~65%) + actions sidebar (right, ~35%)
- **Tablet (md–lg):** 2-column layout with narrower sidebar; sidebar may stack below on landscape tablet
- **Mobile (sm):** 
  - Single column; ticket fields stack vertically
  - Sidebar collapses to sticky bottom action bar with "Actions ▾" button
  - Tapping "Actions" opens a bottom sheet with assign, close/reopen, compose controls
  - Compose panel is a full-screen bottom sheet with "Response / Comment" radio at top
  - History renders full-width below the ticket fields
  - "Add attachment" is a full-width button (not a small icon)

#### Screen 04: Create Ticket (Staff)
- **Desktop:** Two-panel layout on Step 2 (address field left, map right)
- **Tablet:** Same as desktop, map is proportionally smaller
- **Mobile (sm):** 
  - Step 2: address field stacked above map (full-width map, ~220px tall)
  - Step 3: all fields stack vertically; custom fields are full-width
  - Sticky bottom bar with "Next" / "Create Ticket" button

#### Screen 05: Public Submit Form
- **Designed mobile-first.** All steps are single-column at 375px.
- **Desktop (xl+):** Step 1 (category) shows a 2-column grid of category cards; Step 2 shows address field and map side by side; Steps 3–4 use a centered max-width container (640px) for comfortable reading

#### Screen 06: SLA Dashboard
- **Desktop (xl+):** 4-column KPI row; 2-column middle section (category table + staff workload)
- **Tablet:** KPI row becomes 2-column; middle section stacks vertically
- **Mobile (sm):** KPI cards are horizontal scroll; tables become card stacks; staff workload chart becomes a list

#### Screen 07: Reports
- **Desktop:** Left nav (report types) + right content panel
- **Tablet:** Left nav collapses to top tab bar
- **Mobile (sm):** Top tab bar for report types; filter bar collapses to a filter icon; table rows become card stacks; Download CSV button remains prominent

#### Screen 08: Admin Panel
- **Desktop:** Left nav sidebar + content area
- **Tablet:** Left nav becomes a top tab bar or collapsible hamburger
- **Mobile (sm):** Admin panel is usable on mobile but primarily optimized for desktop. Table rows become card stacks with visible actions; forms are full-width single-column

#### Screen 09: API Docs (Swagger UI)
- **Desktop:** Standard Swagger UI layout; wide endpoint list + schema panels
- **Mobile:** Swagger UI is readable but primarily for developer use. No specific mobile optimization beyond responsive meta tag.

#### Screen 10: Map View
- **Desktop:** Full-viewport map with filter overlay at bottom
- **Mobile (sm):**
  - Map fills entire screen (no sidebar)
  - Filter button (⚙) top-right opens a bottom sheet for filter controls
  - Ticket popup on marker click renders as a bottom sheet (not an overlay bubble)
  - Zoom controls are floating buttons (+/−) positioned left-center for thumb access

---

### Universal Responsive Rules

1. **No horizontal scroll at any breakpoint on any screen.** Text wraps; tables become card stacks; sidebars collapse.  
2. **Minimum touch target: 44×44px** on all interactive elements at sm/md breakpoints.  
3. **Font sizes:** Body text minimum 16px on mobile (prevents iOS auto-zoom on input focus).  
4. **Form inputs:** Full-width (100%) at sm breakpoint.  
5. **Tables:** Convert to card stacks at sm breakpoint. Each card shows field label + value pairs vertically.  
6. **Modals and dialogs:** Full-screen on sm; centered floating on md+.  
7. **Bottom sheets:** Used on sm for sidebars, filter panels, action menus, and compose panels. Includes a visible drag handle.  
8. **Navigation:** Top nav collapses to a hamburger menu on sm. "New Ticket" CTA remains accessible as a floating action button (FAB) on mobile if it disappears from the nav.
---

## Accessibility Notes

**Standard:** WCAG 2.1 Level AA  
**Enforcement:** Automated axe-core audit in CI with 0 critical violations on all primary SPA routes (US-15.3)  
**Component library:** Radix UI / shadcn/ui for accessible dialog, dropdown, form, and navigation primitives  
**Internalization:** All user-facing strings use gettext-compatible i18n; no hard-coded English strings

---

### Color & Contrast

| Use case | Foreground | Background | Required ratio | Notes |
|----------|-----------|-----------|----------------|-------|
| Body text | #111827 | #FFFFFF | 4.5:1 ✅ | Normal text |
| Secondary text | #6B7280 | #FFFFFF | 4.5:1 ✅ | Min for small text |
| SLA Breach badge text | #FFFFFF | #EF4444 | 4.5:1 ✅ | |
| SLA Warning badge text | #1F2937 | #FCD34D | 4.5:1 ✅ | Dark text on amber |
| SLA OK badge text | #FFFFFF | #22C55E | 4.5:1 ✅ | |
| Primary CTA button | #FFFFFF | #2563EB | 4.5:1 ✅ | |
| Disabled button | #9CA3AF | #F3F4F6 | 4.5:1 (check) | Verify in design tokens |
| Link text | #1D4ED8 | #FFFFFF | 4.5:1 ✅ | |
| Error text | #DC2626 | #FFFFFF | 4.5:1 ✅ | |

**Critical rule:** SLA urgency is communicated by **color AND text label** simultaneously. The red/amber/green color is accompanied by the label "SLA Breach", "Due today", or "On track" in the badge. Color is never the sole differentiator (WCAG 1.4.1 — Use of Color).

---

### Keyboard Navigation

| Screen | Keyboard behavior required |
|--------|--------------------------|
| All | Tab order follows visual left-to-right, top-to-bottom DOM order |
| Login | Single focusable CTA; Enter triggers OIDC redirect |
| Ticket List | Arrow keys navigate table rows; Enter opens ticket detail |
| Ticket Detail | Tab reaches all sidebar controls; Enter/Space activates buttons |
| Compose Panel | Tab moves between Response/Comment radio, Template dropdown, textarea, Send button |
| Multi-select (ticket list) | Space selects/deselects focused row; Shift+click ranges work |
| Modals / Dialogs | Focus trapped inside while open; Escape closes; focus returns to trigger on close |
| Bottom sheets (mobile) | Same as modals; focus trapped; Escape closes |
| Dropdown menus | Arrow keys navigate options; Enter selects; Escape closes |
| Date pickers | Keyboard-navigable calendar (Radix UI DatePicker) |
| Map (Screen-10) | Map is `role="application"` with keyboard zoom controls; markers are keyboard-reachable |

**Skip links:** A "Skip to main content" link is the first focusable element on every page. Visible on focus.

---

### Screen Reader Requirements

| Element | Required ARIA / semantics |
|---------|--------------------------|
| Page title | `<title>` updates on every SPA route change via Next.js `<Head>` |
| Route changes | `aria-live="polite"` region announces new page title on navigation |
| Ticket list | `<table>` with `<caption>` and `<th scope>` headers; or `role="list"` on card layout |
| SLA badge | `aria-label="SLA status: Breach — 1 day overdue"` |
| Status badge | `aria-label="Status: Open"` |
| Step indicator | `role="progressbar" aria-valuenow="2" aria-valuemax="4" aria-valuetext="Step 2 of 4: Location"` |
| Internal comment badge | `aria-label="Internal comment — visible to staff only"` |
| Filter panel | `role="search"` landmark |
| Map | `role="application" aria-label="Interactive map showing ticket locations"` |
| Cluster markers | `aria-label="{count} tickets in this area — click to zoom in"` |
| Loading states | `role="status" aria-live="polite"` with "Loading…" text |
| Empty states | Static text; no special ARIA needed |
| Modals | `role="dialog" aria-modal="true" aria-labelledby="{modal-title-id}"` |
| Toast notifications | `role="alert" aria-live="assertive"` for errors; `aria-live="polite"` for success |
| Form errors | `aria-invalid="true"` on the input; `aria-describedby="{error-id}"` links to error message |
| Required fields | `aria-required="true"` on inputs; asterisk (*) in label with `aria-hidden="true"` |
| File upload (citizen form) | `aria-label="Upload a photo of the issue"` on the upload button |
| Confirmation dialogs | Destructive button has `aria-describedby` linking to the warning text |

---

### Form Accessibility

- Every `<input>`, `<select>`, and `<textarea>` has an associated `<label>` element (not just `aria-label`)  
- Error messages appear in the DOM immediately after their field (not floating)  
- Placeholder text is supplementary only — never used as the sole label  
- Required fields: marked with visual asterisk + `aria-required="true"` + explained in a legend at form top  
- Date inputs: use text inputs with `type="date"` or Radix DatePicker — avoid browser-default date pickers on mobile where accessible alternatives exist  
- Select dropdowns: use `<select>` for simple cases; Radix Select for styled dropdowns (preserves keyboard + screen reader behavior)  
- File upload: `<input type="file">` is present in DOM for screen readers; the styled button triggers it; `accept` attribute restricts file types client-side

---

### Image Accessibility

| Image type | `alt` text requirement |
|-----------|----------------------|
| Ticket attachment thumbnails | `alt="Attachment: {filename}"` or user-provided label if set |
| City logo | `alt="[City Name] uReport"` |
| Category icons (citizen form) | `aria-hidden="true"` (decorative; category name is the text label) |
| Map tiles | `aria-hidden="true"` (decorative; actual data in markers/clusters) |
| Status/SLA colored icons | `aria-hidden="true"` (supplementary to text label) |
| Empty state illustrations | `alt=""` (decorative) |

---

### Motion & Animation

- Skeleton loaders use CSS `animation: shimmer` — respects `prefers-reduced-motion: reduce` (no animation in that case; static gray blocks instead)  
- Toast entry/exit animations: fade only; no bounce or slide on `prefers-reduced-motion`  
- Map cluster zoom animation: instant on `prefers-reduced-motion`  
- Page transitions: instant on `prefers-reduced-motion`

---

### i18n Notes

- All user-facing strings are wrapped in `t('key')` or `__('key')` calls for gettext extraction  
- Date and time values rendered using `Intl.DateTimeFormat` with locale from user/browser settings  
- Number formatting (ticket counts, percentages) uses `Intl.NumberFormat`  
- RTL layout: while not required for initial MVP, the component library (Radix UI) supports RTL via CSS logical properties — avoid hard-coded `left`/`right` in layout CSS

---

### Testing

| Tool | Usage |
|------|-------|
| axe-core | Automated WCAG 2.1 AA audit in CI on all primary routes; 0 critical violations required before PR merge |
| Playwright | e2e keyboard navigation tests for critical flows (login, create ticket, public submit) |
| Manual testing | Screen reader (NVDA + Chrome, VoiceOver + Safari) on Login, Ticket Detail, and Public Submit screens before each major release |
| Lighthouse | Accessibility score ≥ 90 on ticket list and search pages (mobile profile) |
