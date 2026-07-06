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
