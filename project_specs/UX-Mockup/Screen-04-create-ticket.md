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
