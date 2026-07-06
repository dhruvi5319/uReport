# UX Mockup — uReport CRM Modernization

**Project:** uReport Civic CRM (311 Service Request Management)
**Generated:** 2026-07-06
**Based on:** UserStories-UReport.md, JOURNEYS-UReport.md, PRD-UReport.md, FRD-UReport.md, PROJECT.md
**Version:** 1.0

---

## Overview

uReport modernized is a civic 311 CRM serving municipal staff, department field supervisors, system administrators, and the general public. The UX is designed around three primary truths surfaced by the journey maps:

1. **No full-page reloads** — Every action (filter, save, status change, bulk operation) must complete within the current view, confirmed via toast. This is the single largest pain point across all staff journeys (CP-01).
2. **Mobile is a first-class workflow**, not a nice-to-have — Diane closes cases from a job site on a 375 px phone. Priya submits reports standing at a pothole. Both require pixel-perfect mobile layouts (CP-02).
3. **Context is precomputed, not re-entered** — Role-aware defaults (department filter, dashboard scoping), pre-filtered quick-links, and URL-serialized filter state mean staff reach their relevant data in ≤2 clicks (CP-05).

---

## Design Principles

| # | Principle | Expression |
|---|---|---|
| 1 | Speed over completeness | Skeleton loaders, optimistic UI, parallel data fetching |
| 2 | Role-aware defaults | Dashboard and case list pre-scoped to user's department |
| 3 | Destructive actions always confirm | shadcn/ui Dialog on every delete, close, and bulk operation |
| 4 | URL-serialized state | All filter, sort, search, and page state in query params for shareability |
| 5 | Progressive disclosure | Key metadata visible in list rows; full detail only on open |
| 6 | Consistent feedback | Toast for every async save; inline error for every validation failure |
| 7 | Accessibility first | WCAG 2.1 AA + Section 508 baked in from day one, not retrofitted |

---

## Design System Reference

| Token | Value |
|---|---|
| **Primary** | Civic blue (CSS var `--color-primary`) |
| **Typography — UI** | Inter, 4 px grid |
| **Typography — IDs/Code** | JetBrains Mono |
| **Component library** | shadcn/ui (fully customized) |
| **Animation** | Framer Motion, ≤300 ms, prefers-reduced-motion respected |
| **Shadows** | 3-tier: `shadow-sm` / `shadow-md` / `shadow-lg` |
| **Dark mode** | CSS variable swap on `.dark` class; persisted to localStorage |
| **Breakpoints** | 375 px (mobile) / 768 px (tablet) / 1280 px+ (desktop) |
| **Touch targets** | Minimum 44 × 44 px on all interactive elements |

---

## Screen Index

| Screen | Route | Persona(s) | Story IDs |
|---|---|---|---|
| Login | `/login` | All staff | — |
| Dashboard | `/dashboard` | PER-01, PER-02 | US-5.1–5.4 |
| Case List | `/cases` | PER-01, PER-02 | US-3.1–3.6, US-1.5 |
| Case Detail | `/cases/:id` | PER-01, PER-02 | US-4.1–4.4, US-1.2–1.4, US-10.1–10.4 |
| New Case Form | `/cases/new` | PER-01 | US-1.1, US-10.1 |
| Public Submission | `/submit` | PER-04 | US-2.1–2.4 |
| Search Results | `/cases?q=…` | PER-01, PER-02 | US-3.1, US-11.1–11.3 |
| Admin — People | `/admin/people` | PER-03 | US-6.1–6.4 |
| Admin — Departments | `/admin/departments` | PER-03 | US-7.1–7.2 |
| Admin — Categories | `/admin/categories` | PER-03 | US-8.1–8.3 |
| Admin — Substatuses | `/admin/substatuses` | PER-03 | F13 |
| Admin — Issue Types | `/admin/issue-types` | PER-03 | F13 |
| Admin — Contact Methods | `/admin/contact-methods` | PER-03 | F13 |
| Admin — API Clients | `/admin/clients` | PER-03 | US (JRN-03.2) |
| Navigation Shell | (wraps all auth screens) | All staff | F18 |

---

## Flow Index

| Flow | File | Journey |
|---|---|---|
| Staff Authentication | Flow-00-auth.md | JRN-02.1 Login |
| Live-Call Case Intake | Flow-01-case-intake.md | JRN-01.1 |
| Caller Status Inquiry | Flow-02-status-inquiry.md | JRN-01.2 |
| Storm Event Bulk Cleanup | Flow-03-bulk-ops.md | JRN-01.3 |
| Field Resolution Closure | Flow-04-field-closure.md | JRN-02.2 |
| Public Mobile Submission | Flow-05-public-submit.md | JRN-04.1 |
| Admin Category Setup | Flow-06-admin-category.md | JRN-03.1 |

---

*End of 00-overview.md*
