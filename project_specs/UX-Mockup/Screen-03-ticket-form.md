---

## Screen SCR-04: Ticket Create / Edit Form

**Purpose:** Create a new ticket or edit existing ticket fields (category, description, location, custom fields, contact info).
**User Stories:** US-0.1, US-0.3, US-14.1, US-19.1, US-15.1
**Journey:** JRN-01.2

### Layout

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│  Sidebar     │  ← Back  /  New Ticket   (or: Edit Ticket #5821)         │
│              ├──────────────────────────────────────────────────────────┤
│              │                                                            │
│              │  SECTION: Category & Classification                        │
│              │  Category *          [Select category... ▾]              │
│              │  Issue Type          [Select issue type... ▾]             │
│              │  Contact Method      [Phone ▾]                            │
│              │  Response Method     [Email ▾]                            │
│              │                                                            │
│              │  SECTION: Description                                      │
│              │  Description *                                             │
│              │  ┌──────────────────────────────────────────────────┐    │
│              │  │                                                  │    │
│              │  │                                                  │    │
│              │  └──────────────────────────────────────────────────┘    │
│              │  (max 65,535 characters — character count shown)          │
│              │                                                            │
│              │  SECTION: Location                                         │
│              │  Address        [_________________________________]        │
│              │  City           [____________]  State [__]  ZIP [______] │
│              │  Latitude       [__________]  Longitude [__________]     │
│              │  [📍 Pick on Map]  (opens map picker modal)              │
│              │                                                            │
│              │  SECTION: Reporter                                         │
│              │  Reporter  [Search existing person... 🔍]                 │
│              │            [+ New Person]  (if not found)                 │
│              │  First Name [__________]  Last Name [__________]          │
│              │  Email      [________________________]                    │
│              │                                                            │
│              │  SECTION: Assignment                                       │
│              │  Assign To   [Search staff... ▾]  (optional)             │
│              │                                                            │
│              │  SECTION: Custom Fields  (dynamic — rendered per category)│
│              │  [Field Label 1] *  [_________________________________]  │
│              │  [Field Label 2]    [Dropdown option ▾]                  │
│              │                                                            │
│              │  ┌─────────────────┐  ┌──────────────────┐              │
│              │  │  [Save Ticket]  │  │    [Cancel]      │              │
│              │  └─────────────────┘  └──────────────────┘              │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Category (drives custom fields, permissions, routing) | First section, top |
| Primary | Description | Second section |
| Secondary | Location (address + coordinates) | Third section |
| Secondary | Reporter information | Fourth section |
| Tertiary | Assignment, contact/response method, issue type | Fifth section |
| Dynamic | Custom fields (rendered after category selection) | Bottom, before Submit |

### Dynamic Custom Fields

When category is selected:
1. React fetches `GET /open311/services/{service_code}` (or internal category endpoint) for the `attributes` schema
2. Custom fields render below based on schema:
   - `string` → text input
   - `number` → number input
   - `singlevaluelist` → select dropdown
   - `multivaluelist` → multi-select
   - `datetime` → date/time picker
3. Required fields marked with `*` and validated on submit
4. If category changes, custom fields re-render and prior values are cleared

### Location Map Picker

Clicking "📍 Pick on Map" opens a modal with:
- Leaflet map centered on municipality boundary
- Drag-to-place marker
- Reverse geocoding populates Address, City, State fields
- [Confirm Location] closes modal and populates form

### Validation Rules (client-side, mirroring API)

| Field | Validation |
|-------|-----------|
| Category | Required; must be active |
| Description | Required; max 65,535 chars (character counter shown) |
| Latitude | If entered: must be -90 to 90 |
| Longitude | If entered: must be -180 to 180 |
| Reporter | Either existing person ID OR new person fields (first/last name + email) |
| Custom fields | Per schema (required flags respected) |

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (Create) | Empty form, category dropdown focused | — |
| Edit mode | Form pre-populated with ticket values | Breadcrumb: "Edit Ticket #5821" |
| Category selected | Custom fields section populates | Custom fields fade in |
| Submitting | Save button disabled + spinner | "Saving…" |
| Success (Create) | — | Redirect to new Ticket Detail; toast "Ticket #5922 created" |
| Success (Edit) | — | Redirect to Ticket Detail; toast "Ticket updated" |
| Validation error | Fields with errors highlighted in red; error text below each | "Description is required" etc. |
| API error (422) | Banner at top | "Could not save ticket: [error message]" |

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Category selector | Searchable dropdown | Triggers custom field rendering |
| Reporter search | Autocomplete | Searches existing people by name/email |
| New Person link | Link button | Shows reporter name/email fields inline |
| Map picker | Modal trigger | Populates lat/long/address on confirm |
| Save Ticket | Primary CTA | POST /api/v1/tickets (create) or PATCH (edit) |
| Cancel | Secondary button | Returns to previous screen; confirms if form is dirty |
