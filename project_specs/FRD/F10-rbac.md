---

## F10: Role-Based Access Control

**Description:** Access to uReport's features is governed by roles assigned to person records. Roles determine what a user can see, create, edit, and delete across all API endpoints and UI views. Category-level permissions add a second dimension: per-category display and posting permissions determine whether anonymous or public users can interact with specific service types.

**Terminology:**
- **Role:** The system-level access level of a person: `admin`, `staff`, or `public`. Anonymous (unauthenticated) users have no role.
- **Display Permission:** Per-category setting controlling who can see tickets in that category in list/search views.
- **Posting Permission:** Per-category setting controlling who can submit new tickets in that category.
- **Permission Check:** A server-side enforcement point that rejects unauthorized requests with HTTP 403.
- **Resource Ownership:** A public user can view and track only tickets they reported (matched by session token or email).

**Sub-features:**
- Role-based endpoint authorization (admin, staff, public, anonymous)
- Per-category display permission enforcement
- Per-category posting permission enforcement
- Resource ownership checks for public users
- API endpoint enforcement of all role constraints

---

### F10 Role Capabilities Matrix

| Capability | anonymous | public | staff | admin |
|-----------|-----------|--------|-------|-------|
| Submit ticket (category permitting) | ✓ | ✓ | ✓ | ✓ |
| View public ticket list/search | ✓ | ✓ | ✓ | ✓ |
| View own submitted tickets | — | ✓ | ✓ | ✓ |
| View all tickets | — | — | ✓ | ✓ |
| View staff-only category tickets | — | — | ✓ | ✓ |
| Assign tickets | — | — | ✓ | ✓ |
| Close/reopen tickets | — | — | ✓ | ✓ |
| Post responses (external) | — | — | ✓ | ✓ |
| Post comments (internal) | — | — | ✓ | ✓ |
| Upload attachments | ✓ (if category allows) | ✓ | ✓ | ✓ |
| Delete tickets | — | — | — | ✓ |
| Manage departments/categories | — | — | — | ✓ |
| Manage people/roles | — | — | — | ✓ |
| Manage response templates | — | — | — | ✓ |
| Manage API clients | — | — | — | ✓ |
| Manage substatuses | — | — | — | ✓ |
| View reports | — | — | ✓ | ✓ |
| View metrics endpoint | ✓ | ✓ | ✓ | ✓ |
| Merge tickets | — | — | ✓ | ✓ |

---

### F10 Process: Request Authorization

1. Every API request passes through the auth middleware (see F11).
2. Middleware resolves the caller's role from JWT claims (or `anonymous` if no JWT).
3. Controller checks route-level role requirement (e.g., `requiresRole('staff')`).
4. If route requires a higher role than caller has → HTTP 403.
5. For ticket reads/writes, controller additionally checks category-level permissions.
6. For public user ticket reads, controller checks resource ownership (reporter email or person ID match).

### F10 Process: Category Permission Check (Submit)

1. Caller submits ticket with `categoryId`.
2. System loads `categories.postingPermission`.
3. If `postingPermission = 'staff'` and caller is not staff/admin → HTTP 403.
4. If `postingPermission = 'public'` and caller is anonymous → HTTP 403.
5. If `postingPermission = 'anonymous'` → any caller permitted.

### F10 Process: Category Permission Check (View)

1. Caller requests ticket list or ticket detail.
2. System loads `categories.displayPermission` for the ticket's category.
3. If `displayPermission = 'staff'` and caller is not staff/admin → ticket excluded from results (or 403 on direct access).
4. If `displayPermission = 'public'` → authenticated and anonymous callers may view.
5. If `displayPermission = 'anonymous'` → all callers may view.

---

### F10 Inputs

- Role is determined from JWT session (see F11) — no input needed
- Category permissions are configured via F02 admin interfaces

---

### F10 Outputs

- **HTTP 200/201** on authorized requests
- **HTTP 401** if no JWT and endpoint requires authentication
- **HTTP 403** if JWT present but role is insufficient
- Filtered result sets for list endpoints (staff-only items excluded for non-staff)

---

### F10 Validation

- Role must be stored on the `people.role` column; JWT claims must be cross-validated against this column on each request (not trust JWT role claim alone)
- Category permission values must be one of the defined enums (enforced at category creation, see F02)
- Public users may only access their own ticket details (matched by `reporterPersonId` or session-stored reporter email)
- Open311 endpoints use API key authorization separately — no JWT required (see F01, F14)

---

### F10 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| No JWT / not logged in | 401 | UNAUTHENTICATED | "Authentication required" |
| Valid JWT but insufficient role | 403 | FORBIDDEN | "Your role does not permit this action" |
| Category display permission blocks view | 403 | CATEGORY_FORBIDDEN | "You do not have permission to view this category" |
| Category posting permission blocks submit | 403 | POSTING_FORBIDDEN | "This category does not allow posting by your role" |
| Public user accessing another user's ticket | 403 | NOT_YOUR_TICKET | "You may only view your own submitted tickets" |

---

### F10 API Surface (this feature)

RBAC is enforced transparently on every endpoint — no dedicated RBAC API endpoints. The role enforcement is middleware-level.

---

### F10 Schema Surface (this feature)

- `people.role` (enum: admin/staff/public) — the canonical role store
- `categories.displayPermission` (enum: public/staff/anonymous)
- `categories.postingPermission` (enum: staff/public/anonymous)

No additional tables. Role checks are computed at runtime from these columns.
