---

## Flow FLW-02: Morning Queue Triage

**User Stories:** US-11.1, US-11.2, US-12.2
**Persona:** PER-01 Marcus Webb (Case Worker)
**Journey:** JRN-01.1

```
[Login complete → /tickets]
    │
    ▼
[Ticket List loads — default: My Open Tickets, sorted by SLA due ASC]
    │
    ├── Saved bookmarks in sidebar ──▶ Click bookmark ──▶ Load stored requestUri
    │                                                        Results reload (< 2 sec) US-12.2
    │
    ├── Filter panel visible ──▶ Apply / adjust filters
    │   (status, category, department, assigned, date range, substatus, keyword)
    │        │
    │        └── Filters applied ──▶ URL updates (serialized) ──▶ Results update < 500ms (NFR-6)
    │
    ├── [List view] SLA indicators on each row:
    │   - 🔴 Overdue (past SLA due date)
    │   - 🟡 Due today / tomorrow
    │   - ⚪ On track
    │        │
    │        └── Click row ──▶ [Ticket Detail] (SCR-03)
    │                           Breadcrumb retains filter context
    │
    ├── [Map view toggle] ──▶ Geo-clustered map (US-11.3)
    │
    └── [Export] dropdown ──▶ CSV / Print (US-0.8, US-18.2) — staff only
```

**Steps:**
1. Dashboard loads with last-used filter state from URL or saved bookmark
2. Filter panel is collapsible; shows active filter count badge when collapsed
3. Ticket rows display: ID, category, status badge (color), substatus, reporter, location, entered date, SLA indicator
4. Overdue rows highlighted with left-border accent (red); due-today with amber
5. Click any row opens Ticket Detail; "Back to results" breadcrumb preserves exact scroll + filter position
6. Map view toggle switches result rendering; no new search required (US-11.3)
7. Export button opens format picker: CSV, Print HTML (restricted to staff)

---

## Flow FLW-03: Full Ticket Update (Comment + Substatus + Media)

**User Stories:** US-0.7, US-0.4, US-10.1, US-1.1, US-20.1
**Persona:** PER-01 Marcus Webb
**Journey:** JRN-01.2

```
[Ticket Detail — SCR-03]
    │
    ├── Action Panel (always visible, below ticket header)
    │       │
    │       ├── "Add Comment / Response" tab
    │       │       │
    │       │       ├── Response template picker dropdown (US-20.1)
    │       │       │   Template selected ──▶ Pre-fills notes textarea (editable)
    │       │       │
    │       │       └── [Submit] ──▶ POST /api/v1/tickets/{id}/comments
    │       │                             │
    │       │                             ├── Success ──▶ New entry appended to History (optimistic)
    │       │                             │               Toast: "Comment saved"
    │       │                             └── Error ──▶ Toast error; textarea preserved
    │       │
    │       ├── "Change Status" tab
    │       │       │
    │       │       ├── Substatus dropdown (filtered by open/closed) (US-8.2)
    │       │       ├── Close: requires closed substatus_id
    │       │       ├── Reopen: available if ticket is closed
    │       │       │
    │       │       └── [Save Status] ──▶ PATCH /api/v1/tickets/{id}/close (or /reopen)
    │       │                                  │
    │       │                                  ├── Success ──▶ Status badge updates inline
    │       │                                  │               History entry appended
    │       │                                  └── 422 INVALID_TRANSITION ──▶ Inline error
    │       │
    │       └── "Attach Media" tab (US-10.1)
    │               │
    │               ├── Drag-and-drop zone or file picker
    │               │
    │               └── [Upload] ──▶ POST /api/v1/tickets/{id}/media
    │                                    │
    │                                    ├── Success ──▶ Thumbnail appears in attachments panel
    │                                    │               History entry: "upload_media"
    │                                    └── Error ──▶ Toast with filename and error
    │
    └── History Log (below action panel)
            Ordered by enteredDate ASC
            Each entry: action name, rendered description, person, date, notifications sent
```

**Steps:**
1. Ticket header (ID, category, status, substatus, SLA badge, reporter, assignee) always visible — sticky on scroll
2. Three action tabs below header: Comment/Response | Change Status | Attach Media
3. Response template dropdown appears in Comment tab; selecting a template pre-fills textarea
4. Status change tab shows current status/substatus and available transitions
5. Media upload shows drag-drop zone with thumbnail previews after upload (US-10.2)
6. History log is immutable, append-only (US-1.2); optimistic updates for new comments
7. "Assign to" picker appears in ticket header — opens staff search modal (US-0.2)

---

## Flow FLW-04: Save & Reuse Search Bookmark

**User Stories:** US-12.1, US-12.2, US-12.3
**Persona:** PER-01 Marcus Webb
**Journey:** JRN-01.3

```
[Ticket List with active filters]
    │
    ├── "Save Search" button (appears when filters are active)
    │       │
    │       └── [Save Bookmark Dialog]
    │               Name: [________________]
    │               [Save] [Cancel]
    │                   │
    │                   └── POST /api/v1/bookmarks {name, requestUri}
    │                             │
    │                             ├── 201 ──▶ Bookmark appears in sidebar immediately
    │                             │           Toast: "Bookmark saved"
    │                             └── Error ──▶ Toast error
    │
    ├── Sidebar: [Bookmarks section]
    │       Each bookmark: [name] [trash icon]
    │           │
    │           ├── Click name ──▶ Load requestUri → ticket list refilters (< 2 sec)
    │           │
    │           └── Click trash ──▶ [Confirm delete dialog]
    │                                   DELETE /api/v1/bookmarks/{id}
    │                                       │
    │                                       ├── 200 ──▶ Bookmark removed from sidebar
    │                                       └── 403 ──▶ Toast: "You can only delete your own bookmarks"
    │
    └── [Return next session]
            Bookmarks persist across sessions (stored server-side per person_id)
            Clicking bookmark loads full filter + sort state
```
