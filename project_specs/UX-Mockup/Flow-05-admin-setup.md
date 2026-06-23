---

### Flow 05: Admin — Configure System (Categories, Departments, Users, API Clients)

**Trigger:** Tomás logs in as admin and navigates to /admin  
**User Stories:** US-2.1, US-2.2, US-3.1, US-3.2, US-14.1, US-14.2, US-15.4  
**Personas:** Tomás (PER-04)  
**Journey:** JRN-04.1 (Configure OIDC), JRN-04.2 (Register API Client, Provision Staff User)

```
[/admin — Admin Navigation Hub]
    │
    ├─▶ [/admin/departments]
    │       List: name, active status, default assignee, ticket count
    │       "+ New Department" button
    │       Edit / Deactivate actions per row
    │       │
    │       └── Deactivate with active tickets:
    │               → 409 HAS_ACTIVE_TICKETS
    │               → Confirmation modal: "This department has N active tickets.
    │                  Deactivating will remove it from routing. Proceed?"
    │               → Confirm → 204 success; department hidden from dropdowns
    │
    ├─▶ [/admin/categories]
    │       Grouped by department; searchable table
    │       Columns: Name | Department | SLA Days | Display | Posting | Active
    │       "+ New Category" → multi-step form:
    │         Step 1: Name, Department, Group, SLA Days
    │         Step 2: Display & Posting Permissions
    │         Step 3: Custom Fields (add/remove field rows)
    │         Step 4: Auto-close & Default Assignee
    │       │
    │       ├── Duplicate name ──▶ [422 DUPLICATE_NAME inline error]
    │       └── Select field without options ──▶ [422 FIELD_OPTIONS_REQUIRED]
    │
    ├─▶ [/admin/people]
    │       Searchable/filterable table: Name | Role | Department | Email | Active
    │       Filters: role, department, active status
    │       "+ New Person" → form:
    │         First Name, Last Name, Role selector (human-readable descriptions)
    │         Department (if staff/admin)
    │         Email contact method (required for staff/admin)
    │       Edit person → same form; tab for Contact Methods management
    │       │
    │       ├── Duplicate email ──▶ [422 DUPLICATE_EMAIL inline error]
    │       └── Staff without email ──▶ [422: "Staff and admin roles require an email address"]
    │
    ├─▶ [/admin/clients — API Client Management (US-14.1, US-14.2)]
    │       List: Client Name | Contact Email | Status | Key Hint (first 8 chars…) | Created
    │       "+ New API Client" → name + contact email → Generate Key
    │       │
    │       └── Key Generation Modal (one-time display):
    │               ┌─────────────────────────────────────────┐
    │               │ API Key Generated                        │
    │               │                                          │
    │               │ a3f82b91-xxxx-xxxx-xxxx-xxxxxxxxxxxx    │
    │               │ [📋 Copy to clipboard]                   │
    │               │                                          │
    │               │ ⚠️  This key will not be shown again.    │
    │               │ Store it securely before closing.        │
    │               │                                          │
    │               │ [I've saved my key — Close]              │
    │               └─────────────────────────────────────────┘
    │           "Close" button is the only exit; no X button on this modal
    │
    │       Revoke key → confirmation; key immediately invalid
    │       "Regenerate Key" → same one-time modal flow
    │
    ├─▶ [/admin/substatuses]
    │       Grouped by primary status (Open / Closed)
    │       Sortable drag-and-drop order
    │       Default substatus badge indicator
    │       "+ New Substatus" → label, primary status, set as default toggle
    │
    ├─▶ [/admin/templates — Response Templates (US-13.1)]
    │       List: Template Name | Subject | Active | System?
    │       System templates (identified by slug) cannot be deleted
    │       "+ New Template" → name, subject, body with variable hints panel
    │       Variable hints: {{ticket_id}}, {{title}}, {{category}}, etc.
    │       Live preview panel with sample data substitution
    │
    └─▶ [/admin/settings — OIDC + SMTP Config (US-11.2)]
            OIDC Settings tab:
              Issuer URL, Client ID, Client Secret (masked input)
              [Test Connection] button → validates against IdP before saving
              Success: "✅ Provider reachable. Login flow will work."
              Failure: "❌ Could not reach provider at {url}. Check your configuration."
            SMTP Settings tab:
              Host, Port, Username, Password (masked), From Address, From Name
              [Send Test Email] → sends to current admin's email
            [Save Settings] → applies without server restart
```

**Role selector UX (JRN-04.2 — "Role selector shows human-readable descriptions"):**

| Role value | Display label | Description shown to admin |
|-----------|--------------|---------------------------|
| `admin` | Admin | Can configure all system settings, manage users, and access all tickets |
| `staff` | Staff | Can manage tickets in assigned departments and view all permitted categories |
| `public` | Public (Citizen) | Can submit and track their own tickets; no staff access |

**OIDC Test Connection (JRN-04.1 delight):**
The "Test Connection" button runs a server-side check of the OIDC discovery endpoint (`{issuer}/.well-known/openid-configuration`) before saving. If the check fails, the admin sees a specific error message (unreachable vs. invalid client) rather than discovering the problem at the next staff login attempt.
