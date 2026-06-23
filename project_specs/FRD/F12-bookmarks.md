---

## F12: Bookmark / Saved Search Management

**Description:** Staff who regularly monitor specific subsets of tickets can save their current search filter configuration as a named bookmark. Bookmarks are personal to each user, persist across sessions, and can be recalled with a single click from the search interface.

**Terminology:**
- **Bookmark:** A named, persisted snapshot of a search filter state (query + filters + sort) belonging to a specific user. Maps to `bookmarks` table.
- **Filter State:** The complete set of search parameters that, when restored, reproduce the same search result.

**Sub-features:**
- Save current search state as a named bookmark
- List all bookmarks for the current user
- Load (restore) a bookmark to the search form
- Delete a bookmark
- Bookmarks are user-scoped and not visible to other users

---

### F12 Process: Save Bookmark

1. Staff navigates to a search result page with applied filters.
2. Staff submits `POST /api/bookmarks` with a `name` and the current `filterState` (serialized from current URL params or SPA state).
3. System validates name uniqueness within the user's bookmarks.
4. System creates bookmark record linked to `personId` from session.
5. System returns created bookmark with HTTP 201.

### F12 Process: Load Bookmark

1. Staff selects a bookmark from the list.
2. SPA calls `GET /api/bookmarks/{id}`.
3. System returns the `filterState` object.
4. SPA deserializes and applies the filter state to the search form/URL.

---

### F12 Inputs

**Create Bookmark:**
- `name` (string, required, max 100): Human-readable name for the saved search
- `filterState` (object, required): Serialized filter parameters (same shape as F04 search inputs)

---

### F12 Outputs

**Bookmark object:**
```json
{
  "id": 12,
  "personId": 5,
  "name": "Open Potholes - My Department",
  "filterState": {
    "status": "open",
    "categoryId": [1],
    "departmentId": [3],
    "sort": "date_desc"
  },
  "createdAt": "2026-06-10T09:00:00Z"
}
```

---

### F12 Validation

- `name` must be non-empty, max 100 characters
- `name` must be unique within the user's bookmarks (case-insensitive)
- `filterState` must be a valid JSON object (contents not strictly validated — frontend is responsible for consistent shape)
- Bookmarks are scoped to the authenticated user; no cross-user access
- Maximum 50 bookmarks per user (configurable)

---

### F12 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Duplicate bookmark name | 422 | DUPLICATE_NAME | "You already have a bookmark with this name" |
| Bookmark not found | 404 | NOT_FOUND | "Bookmark not found" |
| Bookmark limit reached | 422 | BOOKMARK_LIMIT | "Maximum 50 bookmarks reached; delete one to add another" |
| Unauthorized (not logged in) | 401 | UNAUTHENTICATED | "Authentication required" |

---

### F12 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookmarks` | staff/admin | List current user's bookmarks |
| POST | `/api/bookmarks` | staff/admin | Create bookmark |
| GET | `/api/bookmarks/{id}` | staff/admin | Get bookmark (includes filterState) |
| DELETE | `/api/bookmarks/{id}` | staff/admin | Delete bookmark |

---

### F12 Schema Surface (this feature)

Table: `bookmarks`. See `Y0b-schema-supporting.md` §bookmarks.

Key columns: `id`, `personId` (FK → people), `name`, `filterState` (JSON), `createdAt`
