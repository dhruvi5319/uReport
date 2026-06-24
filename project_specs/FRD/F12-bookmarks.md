---

## F12: Bookmarks (Staff Saved Searches)

**Description:** Staff users can save named ticket search filters as bookmarks. A bookmark stores the full request URI of a search query (including all filter parameters) so that the staff member can return to a frequently-used filtered view with a single click. Bookmarks are personal (per person), typed, and listed in the staff UI sidebar.

---

### Terminology

- **requestUri:** The full URL path + query string of the saved search (e.g., `/api/v1/tickets?status=open&category_id=5&assignedPerson_id=12`).
- **type:** Bookmark type field for future extensibility; current allowed value is `search`.

---

### Sub-features

- Create bookmark (save current search URI with a name)
- List all bookmarks for the current staff user
- Delete a bookmark
- Navigate to a bookmarked search (follow stored requestUri)

---

### Process

#### Create Bookmark
1. Staff POSTs to `POST /api/v1/bookmarks` with `name` and `requestUri`.
2. System validates `name` is non-empty; `requestUri` is a valid relative URL path.
3. System sets `person_id` from JWT claims; `type = 'search'`.
4. System inserts `bookmarks` row.
5. Returns created bookmark with 201.

#### List Bookmarks
1. Staff GETs `/api/v1/bookmarks`.
2. System returns all bookmarks for the current `person_id` (from JWT).
3. Returns array ordered by `id ASC` (creation order).

#### Delete Bookmark
1. Staff DELETEs `/api/v1/bookmarks/{id}`.
2. System validates bookmark belongs to the current person.
3. System deletes row.
4. Returns 204.

---

### Inputs

- `name` (string, required): Display name for the bookmark; max 200 chars.
- `requestUri` (string, required): Relative URL path with query params; max 2048 chars.
- `type` (string, optional): Default `search`; max 50 chars.

---

### Outputs

- **Bookmark object:** id, person_id, type, name, requestUri, createdAt.
- **Bookmark list:** Array of bookmark objects for the current user.

---

### Validation Rules

- `name` required; max 200 chars.
- `requestUri` required; must start with `/`; max 2048 chars.
- `type` default `search`; no current enforcement of allowed values (forward compatibility).
- Bookmark must belong to the calling user (from JWT `sub`) to be deletable.
- No uniqueness constraint on `name` or `requestUri` per person (duplicates allowed).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Bookmark not found | 404 | BOOKMARK_NOT_FOUND | "Bookmark not found" |
| Delete bookmark belonging to another user | 403 | PERMISSION_DENIED | "Cannot delete another user's bookmark" |
| name missing or empty | 422 | MISSING_REQUIRED_FIELD | "Bookmark name is required" |
| requestUri missing or empty | 422 | MISSING_REQUIRED_FIELD | "Request URI is required" |
| requestUri does not start with / | 422 | INVALID_URI | "Request URI must be a relative path" |

---

### API Surface (this feature)

See full schemas in `Y1b-api-tickets.md §Bookmarks`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/bookmarks` | staff | List current user's bookmarks |
| POST | `/api/v1/bookmarks` | staff | Create bookmark |
| DELETE | `/api/v1/bookmarks/{id}` | staff | Delete bookmark |

---

### Schema Surface (this feature)

Table: `bookmarks`. See `Y0a-schema-core.md §Bookmarks`.

Key columns: id (SERIAL PK), person_id (FK people), type (VARCHAR 50 DEFAULT 'search'), name (VARCHAR 200), requestUri (VARCHAR 2048), createdAt (TIMESTAMPTZ DEFAULT NOW()).
