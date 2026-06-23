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
