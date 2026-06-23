---

### Screen 08: Admin Panel (Categories, Departments, Users, Clients)

**Route:** `/admin` and sub-routes  
**Purpose:** System configuration for admins. All CRUD operations for departments, categories, people, templates, API clients, and substatuses — without SSH or direct DB access.  
**User Stories:** US-2.1, US-2.2, US-3.1, US-14.1, US-14.2, US-15.4  
**Personas:** Tomás (PER-04)  
**Journey:** JRN-04.1 (Configure OIDC), JRN-04.2 (Register API Client, Provision Staff User)

#### Admin Navigation Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [uReport Logo]  Tickets  Reports  Map  │  Admin  │  [Tomás E. ▾]         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐  │
│  │  ADMIN               │  │                                          │  │
│  │                      │  │  [Content area for selected section]     │  │
│  │  ● Departments       │  │                                          │  │
│  │  ○ Categories        │  │                                          │  │
│  │  ○ People & Users    │  │                                          │  │
│  │  ○ Substatuses       │  │                                          │  │
│  │  ○ Templates         │  │                                          │  │
│  │  ○ API Clients       │  │                                          │  │
│  │  ○ Settings          │  │                                          │  │
│  │    ↳ OIDC            │  │                                          │  │
│  │    ↳ SMTP            │  │                                          │  │
│  └──────────────────────┘  └──────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

#### /admin/departments

```
│  Departments                                        [+ New Department]  │
│                                                                         │
│  Name               Default Assignee  Open Tickets  Active  Actions    │
│  ────────────────────────────────────────────────────────────────────  │
│  Public Works       Dana Reyes         45           ✅       [Edit][⋮] │
│  Utilities          Alex Turner        12           ✅       [Edit][⋮] │
│  Parks Dept         Jordan Mills        8           ✅       [Edit][⋮] │
│  Legacy Dept        —                   0           ❌       [Reactivate]│
│
│  Deactivate modal (when dept has active tickets):
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  ⚠️  This department has 45 active tickets.                     │
│  │                                                                 │
│  │  Deactivating it will remove it from ticket routing and the    │
│  │  Open311 services list. Existing tickets will not be affected. │
│  │                                                                 │
│  │  Type the department name to confirm: [___________________]    │
│  │                                    [Cancel]  [Deactivate]      │
│  └─────────────────────────────────────────────────────────────────┘
```

#### /admin/categories

```
│  Categories                                          [+ New Category]  │
│  🔍 [Search categories...]        Department: [All ▾]                  │
│                                                                         │
│  Name                   Dept         SLA  Display  Posting  Active     │
│  ─────────────────────────────────────────────────────────────────────│
│  Pothole or Road Dmg    Public Works  5d  Public   Public    ✅  [Edit] │
│  Storm Drain            Public Works  5d  Public   Public    ✅  [Edit] │
│  Internal: HR Request   HR Dept       —   Staff    Staff     ✅  [Edit] │
│                                                                         │
│  New / Edit Category — multi-step form:                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Step 1: Basic Info                                             │   │
│  │  Name * [_________________________]                             │   │
│  │  Department * [Public Works ▾]                                  │   │
│  │  Group [Roads & Infrastructure ▾]                               │   │
│  │  SLA Days [5]  (0 = no SLA)                                    │   │
│  │                                                    [Next →]     │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Step 2: Permissions                                            │   │
│  │  Display permission:                                            │   │
│  │  ○ Public  ○ Staff only  ○ Anonymous                            │   │
│  │  Posting permission:                                            │   │
│  │  ○ Public  ○ Staff only  ○ Anonymous                            │   │
│  │  Default Assignee [search person...▾]                           │   │
│  │  Auto-close after [_] days (0 = disabled)                       │   │
│  │                                          [← Back]  [Next →]    │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  Step 3: Custom Fields (optional)                               │   │
│  │  [+ Add field]                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ Code [severity]  Label [Severity]  Type [Select ▾]       │  │   │
│  │  │ Options: [High] [Medium] [Low] [+ Add option]            │  │   │
│  │  │                                              [✕ Remove]  │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                          [← Back]  [Save]      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
```

#### /admin/people

```
│  People & Users                                        [+ New Person]  │
│  🔍 [Search by name or email...]  Role: [All ▾]  Dept: [All ▾]        │
│                                                                         │
│  Name           Role    Department    Email                    Active  │
│  ────────────────────────────────────────────────────────────────────│
│  Dana Reyes     Staff   Public Works  dana@city.gov            ✅  [Edit]│
│  Marcus Webb    Admin   (all depts)   marcus@city.gov          ✅  [Edit]│
│  Priya Nair     Public  —             priya@example.com        ✅  [Edit]│
│
│  Edit Person — with Contact Methods tab:
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  [General]  [Contact Methods]                                   │
│  │                                                                 │
│  │  First name * [Dana]    Last name * [Reyes]                    │
│  │  Role * [Staff ▾]  — "can manage tickets in assigned depts"   │
│  │  Department [Public Works ▾]                                    │
│  │  Active [✅]                                                    │
│  │                                                                 │
│  │  Contact Methods tab:                                           │
│  │  [+ Add email]  [+ Add phone]  [+ Add address]                 │
│  │  dana@city.gov  📧 Primary  [✏ Edit] [🗑 Remove]               │
│  │  dana.reyes@personal.com  📧  [Set primary] [🗑 Remove]        │
│  └─────────────────────────────────────────────────────────────────┘
```

#### /admin/clients (API Client Management)

```
│  API Clients                                      [+ New API Client]  │
│                                                                        │
│  Name                 Contact              Key Hint      Status       │
│  ──────────────────────────────────────────────────────────────────  │
│  City Mobile App v1   mobile@city.gov      a3f82b91…    ✅ Active     │
│                                            [Regenerate Key] [Revoke]  │
│  Legacy Integration   legacy@example.com   f1e2d3c4…    ❌ Revoked   │
│                                                         [Reactivate]  │
│
│  New API Client form:
│  Name * [_________________________]  (unique, max 255)
│  Contact Email * [_________________________]
│  Notes [_________________________]
│                                              [Generate API Key]
│
│  One-time key modal (after generation):
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  🔑  API Key Generated                                          │
│  │                                                                 │
│  │  a3f82b91-dc4e-4f62-8a1b-xxxxxxxxxxxx                          │
│  │  ┌───────────────┐                                             │
│  │  │ 📋 Copy key   │                                             │
│  │  └───────────────┘                                             │
│  │                                                                 │
│  │  ⚠️  This key will NOT be shown again after you close          │
│  │     this dialog. Save it in a secure location.                 │
│  │                                                                 │
│  │                    [✅ I've saved my key — Close]               │
│  └─────────────────────────────────────────────────────────────────┘
│  (No × button on this modal — must acknowledge)
```

#### /admin/settings (OIDC + SMTP)

```
│  Settings
│  [OIDC Authentication]  [Email (SMTP)]
│
│  OIDC Authentication Settings
│  ──────────────────────────────────────────────
│  OIDC Issuer URL   [https://sso.city.gov/realm/ureport      ]
│  Client ID         [ureport-app                              ]
│  Client Secret     [••••••••••••••••••••    ] [👁 Show]
│  Session TTL       [28800] seconds  (8 hours)
│
│  [🔌 Test Connection]
│  ✅ Provider reachable at https://sso.city.gov — Login flow will work.
│  (or ❌ Could not reach provider. Check issuer URL and network access.)
│
│                                                       [Save Settings]
```

#### States (Key admin screens)

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Save success | Row updates; toast | "Department saved." / "Category saved." |
| Validation error | Inline red errors | Field-level messages |
| Deactivate blocked | Modal with confirmation | "Has active tickets — confirm?" |
| OIDC test in progress | Button spinner | "Testing connection..." |
| OIDC test success | Green inline banner | "Provider reachable." |
| OIDC test fail | Red inline banner | "Could not reach provider." |
| Key modal open | Modal blocks background | No X button; must acknowledge |

#### Non-admin access
- All `/admin/*` routes redirect to `/login` for unauthenticated users
- Authenticated `staff` or `public` role users see a "Access Denied" page with a "Go to Tickets" link
