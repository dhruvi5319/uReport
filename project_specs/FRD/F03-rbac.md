---

## F03: Role-Based Access Control (RBAC)

**Description:** uReport enforces three permission levels across all controllers: `anonymous` (unauthenticated), `public` (authenticated constituent), and `staff` (authenticated municipality employee). Categories independently configure `displayPermissionLevel` and `postingPermissionLevel`. The `Person.role` field and a static `isAllowed(resource, action)` method gate every protected operation. All existing role names and permission semantics must be preserved exactly.

---

### Terminology

- **anonymous:** An unauthenticated request (no JWT, no API key).
- **public:** A request authenticated as a non-staff user (`people.role = 'public'`).
- **staff:** A request authenticated as a municipality employee (`people.role = 'staff'`).
- **displayPermissionLevel:** The minimum role required to *view* a category and its tickets.
- **postingPermissionLevel:** The minimum role required to *create* a ticket in a category.
- **isAllowed(resource, action):** A server-side gate that returns boolean given the current user's role and the requested resource/action pair. Implemented as a Spring Security method or a custom `PermissionEvaluator`.
- **Permission hierarchy:** `anonymous < public < staff` (staff can do everything public can; public can do everything anonymous can).

---

### Sub-features

- Role encoding in JWT claims (F04)
- Role-based endpoint access guards (Spring Security annotations)
- Per-category display permission enforcement
- Per-category posting permission enforcement
- Open311 posting permission enforcement (per category)
- Export/CSV/print gating to staff only
- Admin screen gating to staff only

---

### Permission Matrix

| Resource / Action | anonymous | public | staff |
|-------------------|-----------|--------|-------|
| View category (displayPermissionLevel=anonymous) | ✓ | ✓ | ✓ |
| View category (displayPermissionLevel=public) | ✗ | ✓ | ✓ |
| View category (displayPermissionLevel=staff) | ✗ | ✗ | ✓ |
| Create ticket (postingPermissionLevel=anonymous) | ✓ | ✓ | ✓ |
| Create ticket (postingPermissionLevel=public) | ✗ | ✓ | ✓ |
| Create ticket (postingPermissionLevel=staff) | ✗ | ✗ | ✓ |
| View ticket detail (category display permission) | per category | per category | ✓ |
| Assign ticket | ✗ | ✗ | ✓ |
| Close ticket | ✗ | ✗ | ✓ |
| Reopen ticket | ✗ | ✗ | ✓ |
| Update ticket | ✗ | ✗ | ✓ |
| Mark duplicate | ✗ | ✗ | ✓ |
| Delete ticket | ✗ | ✗ | ✓ |
| Export CSV/print | ✗ | ✗ | ✓ |
| View ticket history | ✗ | ✗ | ✓ |
| Admin: departments | ✗ | ✗ | ✓ |
| Admin: categories | ✗ | ✗ | ✓ |
| Admin: people | ✗ | ✗ | ✓ |
| Admin: clients | ✗ | ✗ | ✓ |
| Admin: substatus | ✗ | ✗ | ✓ |
| Admin: actions | ✗ | ✗ | ✓ |
| Admin: bookmarks (own) | ✗ | ✗ | ✓ |
| Upload media to ticket | per category permission | per category permission | ✓ |
| View metrics/reports | ✗ | ✗ | ✓ |
| Open311 POST /requests | api_key + postingPermissionLevel | api_key + postingPermissionLevel | api_key + any |

---

### Process

1. Every HTTP request passes through the Spring Security filter chain.
2. If JWT is present and valid, the user's role is extracted from the `role` claim (see F04).
3. If no JWT and no API key, the request is treated as `anonymous`.
4. For each protected endpoint, a Spring Security `@PreAuthorize` annotation or a custom `PermissionEvaluator` evaluates the current principal's role.
5. For category-gated operations (view, post), the service layer additionally checks `category.displayPermissionLevel` / `category.postingPermissionLevel` against the current role using the hierarchy: `anonymous(0) < public(1) < staff(2)`.
6. If the check fails, the system returns HTTP 403 with `PERMISSION_DENIED`.
7. For Open311 API write operations, the `api_key` is validated against `clients.api_key` first (F13), then the category posting permission level is checked.

---

### Inputs

- JWT Bearer token (from `Authorization` header) — carries `sub` (person_id) and `role` claims.
- `api_key` query/form param for Open311 write endpoints.
- `category_id` (implicit from request context) for per-category permission checks.

---

### Outputs

- Transparent pass-through on success (the guarded operation proceeds).
- HTTP 401 if authentication is required but not provided.
- HTTP 403 if authenticated but insufficient role.

---

### Validation Rules

- Role values are exactly: `staff`, `public`, `anonymous` (lowercase, no variants).
- Permission level values are exactly: `staff`, `public`, `anonymous`.
- A user with role `staff` is implicitly allowed for any permission level.
- A user with role `public` is allowed for permission levels `public` and `anonymous`.
- An unauthenticated request is only allowed for permission level `anonymous`.
- Permission levels on categories must be one of the three valid values; invalid values reject at category creation (F07).
- The `isAllowed` check is performed server-side; the React SPA also enforces display gating for UX but the API is the security boundary.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| No auth provided for protected endpoint | 401 | UNAUTHORIZED | "Authentication required" |
| Role insufficient for operation | 403 | PERMISSION_DENIED | "Insufficient permissions" |
| Category display permission denied | 403 | PERMISSION_DENIED | "You do not have permission to view this category" |
| Category posting permission denied | 403 | PERMISSION_DENIED | "You do not have permission to post to this category" |

---

### Schema Surface (this feature)

Uses `people.role` (VARCHAR 20 CHECK IN ('staff','public','anonymous')) and `categories.displayPermissionLevel`, `categories.postingPermissionLevel` (VARCHAR 20 CHECK IN ('staff','public','anonymous')). No dedicated RBAC table — permissions are derived from JWT role and category config.
