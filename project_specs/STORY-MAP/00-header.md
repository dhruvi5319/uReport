# Story Map — uReport CRM Modernization

| Field | Value |
|---|---|
| **Product** | uReport Civic CRM (311 Service Request Management) |
| **Version** | 1.0 |
| **Date** | 2026-07-06 |
| **Related Personas** | PERSONAS-UReport.md |
| **Related Journeys** | JOURNEYS-UReport.md |
| **Related JTBD** | JTBD-UReport.md |
| **Related UserStories** | UserStories-UReport.md |
| **Related PRD** | PRD-UReport.md |
| **Status** | Active |

---

## Overview

This Story Map organizes all 74 user stories (US-X.Y) across two dimensions:

- **X-axis (columns):** Journey stages drawn from JOURNEYS-UReport.md — the chronological steps each persona takes to accomplish their primary job.
- **Y-axis (rows):** Stories within each stage, grouped by persona and epic.

Each story is annotated with:

1. **SM-ID** — Story Map entry identifier (`SM-{Epic}.{NN}`)
2. **NaC** — Natural Acceptance Criterion derived from the JTBD outcome that applies at that journey stage. NaC are NOT invented; each is derived from the intersection of a JTBD outcome (the "what matters") + journey stage (the "when/where") + user story (the "what is built").
3. **Release** — Increment assignment (R1/R2/R3) based on journey completeness and PRD priority.

### NaC Derivation Pattern

```
JTBD outcome (success measure)
  × Journey stage (contextual moment)
  → Testable NaC statement
  → Cross-checked against UserStory acceptance criteria
```

### Release Themes

| Release | Theme | Priority Basis | Journey Goal |
|---|---|---|---|
| R1 | Core Operator & Public Workflows | All P0 stories | Complete JRN-01.1, JRN-01.2, JRN-04.1 end-to-end |
| R2 | Field Supervision & Admin Foundation | P0 remainder + P1 stories | Complete JRN-02.x, JRN-03.x |
| R3 | Insights & Enhanced Maps | P2 stories | Complete reporting and geo-clustering journeys |

### Journey Stages Reference

| Journey | Stages (in order) |
|---|---|
| JRN-01.1 (Marcus — Case Intake) | Receive → Enter Details → Assign → Submit → Confirm |
| JRN-01.2 (Marcus — Status Inquiry) | Trigger → Search → Refine → Identify → Respond |
| JRN-01.3 (Marcus — Bulk Cleanup) | Identify Cluster → Select Batch → Choose Action → Confirm → Verify |
| JRN-02.1 (Diane — Morning Triage) | Login → Orient → View Cases → Prioritize → Plan |
| JRN-02.2 (Diane — Field Closure) | Access → Find Case → Review → Log Resolution → Attach Photos → Submit |
| JRN-02.3 (Diane — Overdue Escalation) | Check Dashboard → Surface Overdue → Review Overdue List → Investigate → Escalate |
| JRN-03.1 (Jordan — Category Config) | Navigate → Create Group → Configure Category → Add Templates → Verify → Confirm Security |
| JRN-03.2 (Jordan — API Onboarding) | Navigate → Create Client → Save & Retrieve Key → Verify Activation → Deliver |
| JRN-04.1 (Priya — Mobile Submission) | Discover → Contact → Category → Location → Description & Photos → Review & Submit |

---
