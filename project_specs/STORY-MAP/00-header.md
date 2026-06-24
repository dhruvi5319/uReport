# Story Map: uReport Modernization

| Field | Value |
|---|---|
| **Product Name** | uReport — Municipal Constituent Issue Tracking System |
| **Version** | 1.0 |
| **Date** | 2026-06-24 |
| **Related PRD** | `project_specs/PRD-uReport.md` |
| **Related Personas** | `project_specs/PERSONAS-uReport.md` |
| **Related JTBD** | `project_specs/JTBD-uReport.md` |
| **Related Journeys** | `project_specs/JOURNEYS-uReport.md` |
| **Related UserStories** | `project_specs/UserStories-uReport.md` |
| **Total Stories Mapped** | 63 (US-0.1 through US-20.2) |
| **Releases Planned** | R1 (MVP), R2 (Full Operations), R3 (Productivity) |

---

## Overview

This Story Map organizes uReport's 63 user stories into a two-dimensional structure:

- **X-axis (columns):** Journey stages drawn from JOURNEYS-uReport.md — the temporal sequence of user actions across all 11 journeys.
- **Y-axis (rows):** User stories grouped by Epic, placed at the journey stage where they are most directly exercised.
- **NaC column:** Natural Acceptance Criteria derived from JTBD outcomes, applied at the journey stage level. NaC bridge the "what matters" (JTBD) to "what is testable" (acceptance criteria).
- **Release column:** Increment assignment based on feature priority (P0 = R1, P1 = R2, P2 = R3) and journey completeness.

### What is Natural Acceptance Criteria (NaC)?

NaC is not invented — it is **derived** from the intersection of:
1. A **JTBD outcome** (the functional result that matters to the user)
2. A **journey stage** (the moment in the user's flow where that outcome applies)
3. A **user story** (the capability being built)

The derivation chain is: `JTBD-ID → Journey Stage → NaC Statement → Story AC verification`

NaC provides a bridge for increment planning: each release must enable at least one complete journey path, and each story in the release must have at least one NaC traceable to a P0 or P1 JTBD.

### Map ID Convention

Story map entries are identified as `SM-{Epic}.{NN}` (e.g., SM-0.1 = first story in Epic 0 mapped to the story map).

### Journey Stage Reference

The map uses the following consolidated stage labels drawn from the 11 journeys:

| Stage Code | Stage Name | Primary Journeys |
|-----------|-----------|-----------------|
| **S-AUTH** | Arrive & Authenticate | JRN-01.1, JRN-02.3, JRN-03.1, JRN-04.1 |
| **S-TRIAGE** | Queue Triage & Prioritization | JRN-01.1 |
| **S-WORK** | Ticket Work — View, Update, Close | JRN-01.2 |
| **S-SEARCH** | Search & Filter | JRN-01.1, JRN-01.3 |
| **S-BOOKMARK** | Save & Reuse Filters | JRN-01.3 |
| **S-CONFIG** | Configuration — Categories, Departments, SLA | JRN-02.1, JRN-02.3 |
| **S-METRICS** | Metrics & Reporting Review | JRN-02.2 |
| **S-ADMIN** | System Administration — Users, Clients | JRN-03.1, JRN-03.2 |
| **S-DEPLOY** | Deployment & Health Verification | JRN-03.3 |
| **S-API** | Open311 API Integration — Submit & Poll | JRN-04.1, JRN-04.2 |

---
