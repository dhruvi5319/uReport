
## Release Planning

---

### R1: MVP — "Working Migration Core"

**Theme:** Deliver a fully functional, byte-compatible replacement of the legacy PHP system for all P0 flows. After R1, staff can log in, manage tickets, search, and export. External API clients continue operating without code changes.

**Story Count:** 25 P0 stories

**Stories in R1:**

| Story ID | Title | Primary Persona | Journey Enabled |
|----------|-------|----------------|----------------|
| US-4.1 | Staff Login and JWT Issuance | PER-01, PER-02, PER-03 | JRN-01.1 Stage 1, JRN-02.3 Stage 5, JRN-03.1 Stage 3 |
| US-4.2 | JWT Token Refresh | PER-01, PER-02, PER-03 | JRN-01.1 long sessions |
| US-4.3 | Logout and Token Invalidation | PER-01, PER-02, PER-03 | JRN-03.1 Stage 5 |
| US-4.4 | OAuth / External IdP Callback | PER-03 | JRN-03.1 extended |
| US-3.1 | Enforce Role-Based Endpoint Access | PER-03 | All journeys |
| US-3.2 | Enforce Per-Category Permissions | PER-03, PER-04 | JRN-04.1 Stage 3 |
| US-3.3 | Gate Admin and Export Operations | PER-03 | JRN-03.1 Stage 1 |
| US-11.1 | Full-Text Keyword Search | PER-01 | JRN-01.1 Stage 3 |
| US-11.2 | Filter Tickets by Multiple Criteria | PER-01 | JRN-01.1 Stage 3–4 |
| US-11.3 | View Ticket Search Results on Map | PER-01 | JRN-01.1 Stage 4 |
| US-0.1 | Create a New Ticket | PER-01 | JRN-01.2 |
| US-0.2 | Assign a Ticket to a Staff Member | PER-01 | JRN-01.2 |
| US-0.3 | Update Ticket Fields | PER-01 | JRN-01.2 |
| US-0.4 | Close a Ticket with a Substatus | PER-01 | JRN-01.2 Stage 4 |
| US-0.5 | Mark a Ticket as a Duplicate | PER-01 | JRN-01.2 |
| US-0.6 | Reopen a Closed Ticket | PER-01 | JRN-01.2 |
| US-0.7 | Record a Comment on a Ticket | PER-01 | JRN-01.2 Stage 3 |
| US-0.8 | Export Ticket Search Results | PER-01 | JRN-01.1 Stage 5 |
| US-1.1 | View Full Ticket History | PER-01 | JRN-01.2 Stage 1 |
| US-1.2 | History Entry Auto-Appended | PER-01 | JRN-01.2 all stages |
| US-1.3 | View Notification Recipients | PER-01 | JRN-01.2 |
| US-18.1 | Receive Open311 Responses in JSON or XML | PER-04 | JRN-04.1, JRN-04.2 |
| US-18.2 | Export Ticket Data in Multiple Formats | PER-01 | JRN-01.1 Stage 5 |
| US-2.1 | Discover API Metadata | PER-04 | JRN-04.1 pre-flight |
| US-2.2 | List Available Services | PER-04 | JRN-04.1 Stage 1 |
| US-2.3 | Get Service Attributes | PER-04 | JRN-04.1 |
| US-2.4 | Submit a Service Request via Open311 | PER-04 | JRN-04.1 Stage 2–3 |
| US-2.5 | Retrieve and Filter Service Requests | PER-04 | JRN-04.2 Stage 2 |
| US-2.6 | Retrieve a Single Service Request | PER-04 | JRN-04.2 Stage 2–3 |

> **Note:** 29 P0 stories placed in R1 (US-4.1–4.4 = 4, US-3.1–3.3 = 3, US-11.1–11.3 = 3, US-0.1–0.8 = 8, US-1.1–1.3 = 3, US-18.1–18.2 = 2, US-2.1–2.6 = 6 → 29 total, all P0)

**Personas Served by R1:**
- PER-01 Marcus (Case Worker) — full ticket management lifecycle enabled
- PER-03 Jordan (Sys Admin) — JWT auth, RBAC enforcement; account validation journey partial
- PER-04 Integra (API Client) — complete Open311 submission and polling journey

**JTBD Addressed by R1:**

| JTBD-ID | Status after R1 |
|---------|----------------|
| JTBD-01.1 | ✅ Complete — login, filter, triage, overdue visibility, export |
| JTBD-01.2 | ✅ Complete — full ticket update (comment + status + media stub) from single view |
| JTBD-01.3 | ❌ Deferred to R3 — bookmarks not in P0 |
| JTBD-02.1 | ⚠️ Partial — RBAC enforced; category management in R2 |
| JTBD-02.2 | ❌ Deferred to R3 |
| JTBD-02.3 | ⚠️ Partial — JWT auth works; people management in R2 |
| JTBD-03.1 | ⚠️ Partial — JWT issued; user CRUD in R2 |
| JTBD-03.2 | ❌ Deferred to R2 |
| JTBD-03.3 | ⚠️ Partial — Open311 shapes validated; scheduler jobs in R2 |
| JTBD-04.1 | ✅ Complete — POST /open311/requests byte-compatible |
| JTBD-04.2 | ✅ Complete — GET /open311/requests byte-compatible |
| JTBD-04.3 | ✅ Complete — existing API keys authenticate against Spring Boot |

**Complete Journeys Enabled by R1:**
- ✅ JRN-01.1 (Morning Queue Triage) — all 5 stages covered
- ✅ JRN-01.2 (Full Ticket Update) — all 5 stages covered (media upload at basic level)
- ✅ JRN-04.1 (Service Request Submission) — all stages covered
- ✅ JRN-04.2 (Status Polling) — all stages covered
- ⚠️ JRN-03.1 (JWT Account Validation) — stages 3–5 covered; staff CRUD in R2

---
