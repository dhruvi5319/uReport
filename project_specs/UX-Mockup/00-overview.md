# UX Mockup: uReport Modernization

**Project:** uReport CRM — Municipal Constituent Issue Tracking System
**Generated:** 2026-06-24
**Based on:** UserStories-uReport.md, PRD-uReport.md, FRD-uReport.md, JOURNEYS-uReport.md
**Stack:** React 18 + TypeScript SPA consuming Spring Boot 3.x REST API

---

## Overview

uReport is a staff-facing municipal CRM used to track and resolve constituent-reported issues. The UX modernization replaces a PHP server-side templated interface with a React SPA. The design preserves 100% of legacy functionality while eliminating full-page reloads, delivering persistent filter state, inline actions, and clear information hierarchy.

---

## Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Glanceable priority** | Overdue and urgent tickets must be identifiable within 60 seconds of login (JRN-01.1). Color-coded SLA status rows, not buried metadata. |
| **Single-view actions** | All ticket actions (comment, status change, photo upload) are available from the Ticket Detail without navigation (JRN-01.2). |
| **Persistent state** | Filters and sort order survive navigation and session restore via URL serialization + saved bookmarks (JRN-01.3, F12). |
| **Progressive disclosure** | Complex admin forms (category custom fields, SLA, permissions) are surfaced via accordions or step sections — not separate pages. |
| **Inline feedback** | Optimistic UI updates for comments and status changes; success/error toasts; no full reloads. |
| **Staff-first** | All screens are staff-authenticated. Public-facing views are handled by the Open311 API, not the SPA. |

---

## Screen Index

| Screen ID | Screen Name | Primary Persona | Key User Stories |
|-----------|-------------|-----------------|-----------------|
| SCR-01 | Login | All Staff | US-4.1, US-4.3 |
| SCR-02 | Staff Dashboard / Ticket List | PER-01 Marcus | US-0.1, US-11.1, US-11.2, US-12.2 |
| SCR-03 | Ticket Detail | PER-01 Marcus | US-0.2–0.7, US-1.1, US-10.1 |
| SCR-04 | Ticket Create / Edit Form | PER-01 Marcus | US-0.1, US-0.3, US-14.1, US-19.1 |
| SCR-05 | People Directory | PER-03 Jordan | US-5.1–5.4 |
| SCR-06 | Person Detail / Edit | PER-02 Diana | US-5.1, US-5.2, US-5.4 |
| SCR-07 | Department Admin | PER-02 Diana | US-6.1, US-6.2 |
| SCR-08 | Category Admin | PER-02 Diana | US-7.1, US-7.2, US-7.3 |
| SCR-09 | Substatus & Actions Admin | PER-02 Diana | US-8.1, US-9.1, US-9.2 |
| SCR-10 | Search Interface | PER-01 Marcus | US-11.1–11.3, US-0.8 |
| SCR-11 | Metrics / Reports Dashboard | PER-02 Diana | US-17.1, US-17.2 |
| SCR-12 | API Client Management | PER-03 Jordan | US-13.1, US-13.2 |

---

## Flow Index

| Flow ID | Flow Name | Primary Story |
|---------|-----------|---------------|
| FLW-01 | Staff Login & Session Restore | US-4.1, US-4.2 |
| FLW-02 | Morning Queue Triage | JRN-01.1, US-11.2, US-12.2 |
| FLW-03 | Full Ticket Update (Comment + Status + Media) | JRN-01.2, US-0.7, US-0.4, US-10.1 |
| FLW-04 | Save & Reuse Search Bookmark | JRN-01.3, US-12.1–12.3 |
| FLW-05 | Create & Configure Category | JRN-02.1, US-7.1, US-7.2 |
| FLW-06 | SLA Metrics Review & Drill-Down | JRN-02.2, US-17.1, US-17.2 |
| FLW-07 | Onboard New Staff Member | JRN-02.3, US-5.1, US-5.2, US-6.2 |
| FLW-08 | API Client Registration & Key Rotation | JRN-03.2, US-13.1, US-13.2 |

---

## Global Navigation Structure

The SPA uses a persistent left sidebar + top header layout.

```
┌────────────────────────────────────────────────────────────────┐
│  [uReport Logo]          [Search bar]       [User] [Logout]   │  ← Top Header
├──────────────┬─────────────────────────────────────────────────┤
│  Sidebar     │  Main Content Area                              │
│  ─────────── │                                                 │
│  Tickets     │                                                 │
│  ─────────── │                                                 │
│  Reports     │                                                 │
│  ─────────── │                                                 │
│  Admin ▾     │                                                 │
│    People    │                                                 │
│    Depts     │                                                 │
│    Cats      │                                                 │
│    Actions   │                                                 │
│    Clients   │                                                 │
│  ─────────── │                                                 │
│  Bookmarks   │                                                 │
│  [+ New]     │                                                 │
└──────────────┴─────────────────────────────────────────────────┘
```

**Nav items (staff role):** Tickets, Reports, Admin (People / Departments / Categories / Actions & Substatuses / API Clients), Bookmarks.

**Role gating (React):** Admin sub-items are hidden for non-staff roles. The API enforces the real security boundary (F3, US-3.1).
