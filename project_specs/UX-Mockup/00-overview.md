# UX Mockup
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Generated:** 2026-06-23  
**Based on:** UserStories-uReport.md · PRD-uReport.md · FRD-uReport.md · JOURNEYS-uReport.md · .planning/PROJECT.md  

---

## Overview

### UX Approach

uReport serves four distinct personas with fundamentally different mental models and device contexts:

- **Dana (Staff)** — Desktop-primary, speed-focused, keyboard-friendly. Needs triage and triage-to-action in ≤ 2 clicks.
- **Marcus (Manager)** — Dashboard-first, metrics-driven. Needs SLA visibility on login and CSV download in ≤ 2 screens.
- **Priya (Citizen)** — Mobile-primary, low-tech-literacy. Needs a linear, forgiving form flow with zero jargon.
- **Tomás (Admin/IT)** — Config-focused, developer-literate. Needs discoverable admin screens and API documentation.

These four context profiles drive every layout and interaction decision.

### Design Principles

1. **Role-appropriate defaults.** The first screen a user lands on after login must already show them what they need most — not a generic home page.
2. **Progressive disclosure.** Show required fields first; reveal advanced options only on demand. Applies to ticket create form, admin forms, and filter panels.
3. **Inline actions.** Actions (assign, respond, close, bulk-reassign) complete without navigating away from the current view. The user's context is preserved.
4. **Feedback is mandatory.** Every mutation has a visible result: inline toast, audit trail entry, or state badge change. No silent successes or silent failures.
5. **Mobile-first for citizen flows, desktop-optimized for staff flows.** The public submission form (`/submit`) is designed for a 375px iPhone. Staff views optimize for a 1280px+ workstation but remain functional at 375px.
6. **Stable output contracts.** CSV column order, API response shapes, and URL patterns are stable. Staff Excel pivot tables and third-party Open311 clients must never break from a UI-side change.

### Design System

- **Component library:** Radix UI / shadcn/ui primitives (dialog, dropdown, form, tooltip, command palette)
- **Color system:** Semantic tokens — `status-open` (blue), `status-closed` (gray), `sla-ok` (green), `sla-warning` (amber), `sla-breach` (red)
- **Typography:** System font stack; minimum 16px body text on mobile
- **Spacing:** 8px base grid
- **Breakpoints:** `sm` = 375px, `md` = 768px, `lg` = 1024px, `xl` = 1280px, `2xl` = 1920px

### Navigation Architecture

```
/ (root)
├── /login                  → OIDC redirect page (Screen-00)
├── /dashboard              → Staff dashboard with SLA widgets (Screen-02 context)
├── /tickets                → Ticket list / search (Screen-02)
│   ├── /tickets/new        → Create ticket (Screen-04)
│   └── /tickets/:id        → Ticket detail (Screen-03)
├── /submit                 → Public service request form (Screen-05)
├── /track/:id              → Public ticket status page (Screen-05 exit)
├── /map                    → Map view (Screen-10)
├── /reports                → Reports & metrics (Screen-07)
│   └── /reports/sla        → SLA dashboard (Screen-06)
├── /admin                  → Admin panel root (Screen-08)
│   ├── /admin/departments
│   ├── /admin/categories
│   ├── /admin/people
│   ├── /admin/templates
│   ├── /admin/clients
│   └── /admin/substatuses
└── /api/docs               → OpenAPI / Swagger UI (Screen-09)
```

### Role → Default Landing Page

| Role | Post-login redirect | Rationale |
|------|--------------------|-----------| 
| `admin` | `/dashboard` | Full SLA + workload overview |
| `staff` | `/dashboard` | SLA breach count + personal queue bookmark |
| `public` | `/track/:last-id` or `/submit` | Track last submission or start new one |
| `anonymous` | `/submit` | Direct to submission form |

---

*Sections continue in Flow-00 through Y2-accessibility.*
