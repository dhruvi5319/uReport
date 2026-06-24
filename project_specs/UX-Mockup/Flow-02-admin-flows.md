---

## Flow FLW-05: Create & Configure Category

**User Stories:** US-7.1, US-7.2, US-7.3, US-9.2
**Persona:** PER-02 Diana Reyes (Department Administrator)
**Journey:** JRN-02.1

```
[/admin/categories → Category List]
    │
    └── "New Category" button ──▶ [Category Create Form — SCR-08]
            │
            ├── Section 1: Basic Info
            │   name, description, department (dropdown), category group (dropdown)
            │   active toggle, featured toggle
            │
            ├── Section 2: Permissions & SLA
            │   displayPermissionLevel (select: anonymous/public/staff)
            │   postingPermissionLevel (select: anonymous/public/staff)
            │   slaDays (number input)
            │   notificationReplyEmail (email input)
            │
            ├── Section 3: Auto-Close Rule
            │   autoCloseIsActive toggle
            │   autoCloseSubstatus (dropdown — filtered to closed-type substatuses)
            │
            ├── Section 4: Default Assignee
            │   Staff picker (searchable, scoped to selected department) (US-5.3)
            │
            └── Section 5: Custom Fields Builder (US-7.1)
                    [+ Add Field] button
                    Each field:
                      Field Label, Field Type (text/number/select/multiselect/date)
                      Required toggle, Display Order
                      For select/multiselect: [+ Add Option] list
                      [Remove field] button
                    Live JSON preview (collapsed by default)
                    ──▶ POST /api/v1/categories
                              │
                              ├── 201 ──▶ Toast: "Category created. Custom fields active on next submission."
                              │           Redirect → Category detail
                              └── 422 ──▶ Inline field errors (permission level, substatus)
```

**Key UX Notes (JRN-02.1):**
- Custom field builder is a visual form — no raw JSON required (pain point from legacy)
- All sections are on a single scrollable form with sticky section headers for navigation
- Custom field changes are live immediately on next ticket submission (no deployment required)
- Staff picker in "Default Assignee" is scoped to the selected department

---

## Flow FLW-06: SLA Metrics Review & Drill-Down

**User Stories:** US-17.1, US-17.2
**Persona:** PER-02 Diana Reyes
**Journey:** JRN-02.2

```
[/reports → Metrics Dashboard — SCR-11]
    │
    ├── Department scope auto-applied (user's department)
    ├── Default time window: 30 days
    │
    ├── Summary table: category × on-time %
    │   Below-target rows highlighted (amber/red)
    │       │
    │       └── Click category row ──▶ [Category Drill-Down Panel]
    │                                       Volume trend chart (bar/line)
    │                                       Average close days
    │                                       Open ticket count
    │                                       [View open tickets] → Ticket List (filtered)
    │
    ├── Controls: [Department selector] [Date range] [Apply]
    │
    ├── Report tabs:
    │   Activity | Assignments | Categories | Staff | Person | SLA | Volume | Current Open | Opened Today | Closed Today
    │       │
    │       └── Click tab ──▶ Load report data → table + chart
    │
    └── [Export] ──▶ CSV (US-18.2)
                     (Print-formatted summary for meeting decks)
```

---

## Flow FLW-07: Onboard New Staff Member

**User Stories:** US-5.1, US-5.2, US-6.2
**Persona:** PER-02 Diana Reyes
**Journey:** JRN-02.3

```
[/admin/people → People List]
    │
    └── "New Person" button ──▶ [Person Create Form — SCR-06]
            │
            ├── Basic Info: firstname, lastname, organization, city, state, zip
            ├── Account: username, password, role (select: staff/public/anonymous)
            ├── Department assignment (dropdown)
            ├── Contact: emails (+ add), phones (+ add), addresses (+ add)
            │
            └── [Save] ──▶ POST /api/v1/people
                                │
                                ├── 201 ──▶ Toast: "Staff account created"
                                │           Redirect → Person Detail
                                └── 422 DUPLICATE_USERNAME ──▶ Inline: "Username already taken"

[Person Detail — SCR-06]
    │
    └── "Assign to Categories" panel
            Multi-select of categories (scoped to person's department) (US-6.2)
            [Save Assignments] ──▶ API calls to add category-person associations
                                        │
                                        ├── Success ──▶ "Assigned Categories" list updates
                                        └── Error ──▶ Toast error
```
