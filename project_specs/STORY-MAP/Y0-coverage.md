---

## Coverage Analysis

---

### Persona Coverage by Release

| Persona | R1 | R2 | R3 |
|---|---|---|---|
| PER-01 Marcus (311 Operator) | ✅ Full core workflows (case intake, search, bulk close) | ✅ Dashboard, media upload, recent feed | ✅ Geo-clustering map |
| PER-02 Diane (Dept Supervisor) | ✅ Auth, mobile layout, basic case list/detail/close | ✅ Dashboard + overdue, photo upload, field closure | — |
| PER-03 Jordan (Admin) | ✅ DB migration, search trigger (infrastructure) | ✅ All admin panels, API client mgmt, Swagger | ✅ Metrics & reporting |
| PER-04 Priya (Citizen) | ✅ Complete mobile submission journey | — | — |

---

### JTBD Coverage by Release

| JTBD-ID | JTBD Statement | R1 | R2 | R3 |
|---|---|---|---|---|
| JTBD-01.1 | Live-call case intake in ≤ 90 s | ✅ Complete | — | — |
| JTBD-01.2 | Instant case lookup in ≤ 30 s | ✅ Complete | — | ✅ Enhanced (geo) |
| JTBD-01.3 | Bulk cleanup of duplicates in ≤ 60 s | ✅ Complete | — | — |
| JTBD-02.1 | Department triage in ≤ 2 clicks | ⬜ Partial (case list) | ✅ Complete (dashboard) | — |
| JTBD-02.2 | Field closure with photo in ≤ 3 min | ⬜ Partial (mobile UI + close) | ✅ Complete (photo upload) | — |
| JTBD-02.3 | Overdue cases visible in ≤ 60 s | ⬜ Partial (timeline only) | ✅ Complete (overdue badge + stat card) | — |
| JTBD-03.1 | Service taxonomy config in ≤ 10 min | ⬜ Infrastructure only | ✅ Complete (admin panels) | — |
| JTBD-03.2 | API client onboarding in ≤ 5 min | ⬜ API works; no admin UI | ✅ Complete (client admin UI) | — |
| JTBD-03.3 | Vendor support via Swagger in ≤ 5 min | ⬜ Not started | ✅ Complete (Swagger UI) | — |
| JTBD-04.1 | Anonymous submission on mobile in ≤ 5 min | ✅ Complete | — | — |
| JTBD-04.2 | Map pin location in ≤ 60 s | ✅ Complete | — | — |
| JTBD-04.3 | Case ID on confirmation in ≤ 3 s | ✅ Complete | — | — |

---

### Story Coverage Map

All 74 stories from UserStories-UReport.md are mapped in this Story Map. The table below confirms placement and release assignment:

| Story ID | SM-ID(s) | Release | Orphan? |
|---|---|---|---|
| US-0.1 | SM-0.02 | R1 | No |
| US-0.2 | SM-0.03 | R1 | No |
| US-0.3 | SM-0.01 | R1 | No |
| US-0.4 | SM-0.04 | R1 | No |
| US-1.1 | SM-1.01 | R1 | No |
| US-1.2 | SM-1.03, SM-1.05, SM-1.07 | R1 | No |
| US-1.3 | SM-1.08 | R1 | No |
| US-1.4 | SM-1.02, SM-1.06 | R1 | No |
| US-1.5 | SM-3.06, SM-1.04 | R1 | No |
| US-2.1 | SM-2.02, SM-2.03, SM-2.04, SM-2.07 | R1 | No |
| US-2.2 | SM-2.05 | R1 | No |
| US-2.3 | SM-2.06 | R1 | No |
| US-2.4 | SM-2.08 | R1 | No |
| US-3.1 | SM-3.01 | R1 | No |
| US-3.2 | SM-3.02, SM-3.04, SM-3.05, SM-3.10, SM-3.11, SM-3.12, SM-3.13, SM-3.14 | R1/R2 | No |
| US-3.3 | SM-3.03 | R1 | No |
| US-3.4 | SM-3.07 | R1 | No |
| US-3.5 | SM-3.08, SM-3.11 | R1 | No |
| US-3.6 | SM-3.09 | R1 | No |
| US-4.1 | SM-4.01, SM-4.02, SM-4.03, SM-4.06 | R1 | No |
| US-4.2 | SM-4.07 | R1 | No |
| US-4.3 | SM-4.04, SM-4.08 | R1 | No |
| US-4.4 | SM-4.05 | R1 | No |
| US-5.1 | SM-5.01, SM-5.03, SM-5.04 | R2 | No |
| US-5.2 | SM-5.06 | R2 | No |
| US-5.3 | SM-5.07 | R2 | No |
| US-5.4 | SM-5.02, SM-5.05 | R2 | No |
| US-6.1 | SM-6.01 | R2 | No |
| US-6.2 | SM-6.02 | R2 | No |
| US-6.3 | SM-6.03 | R2 | No |
| US-6.4 | SM-6.04 | R2 | No |
| US-7.1 | SM-7.01 | R2 | No |
| US-7.2 | SM-7.02 | R2 | No |
| US-8.1 | SM-8.01 | R2 | No |
| US-8.2 | SM-8.02, SM-8.03 | R2 | No |
| US-8.3 | SM-8.04 | R2 | No |
| US-9.1 | SM-9.01 | R1 | No |
| US-9.2 | SM-9.02, SM-9.04 | R1 | No |
| US-9.3 | SM-9.03 | R1 | No |
| US-10.1 | SM-10.03 | R2 | No |
| US-10.2 | SM-10.01 | R2 | No |
| US-10.3 | SM-10.02 | R2 | No |
| US-10.4 | SM-10.04 | R2 | No |
| US-11.1 | SM-11.01 | R1 | No |
| US-11.2 | SM-11.02 | R1 | No |
| US-11.3 | SM-11.03 | R1 | No |
| US-11.4 | SM-11.04 | R1 | No |
| US-12.1 | SM-12.01 | R1 | No |
| US-12.2 | SM-12.02 | R1 | No |
| US-12.3 | SM-12.03, SM-12.04 | R1 | No |
| US-12.4 | SM-12.05 | R1 | No |
| US-12.5 | SM-12.06 | R1 | No |
| US-13.1 | SM-13.02 | R2 | No |
| US-13.2 | SM-13.03 | R2 | No |
| US-13.3 | SM-13.01 | R2 | No |
| US-13.4 | SM-13.04 | R2 | No |
| US-14.1 | SM-14.01, SM-14.02 | R2 | No |
| US-14.2 | SM-14.03 | R2 | No |
| US-15.1 | SM-15.01 | R3 | No |
| US-15.2 | SM-15.02 | R3 | No |
| US-16.1 | SM-16.01 | R3 | No |
| US-16.2 | SM-16.02 | R3 | No |
| US-17.1 | SM-17.01, SM-17.03 | R1 | No |
| US-17.2 | SM-18.02 | R1 | No |
| US-17.3 | SM-17.02, SM-17.04 | R1 | No |
| US-18.1 | SM-18.01, SM-18.03, SM-18.05, SM-18.06 | R1/R2 | No |
| US-18.2 | SM-18.04 | R2 | No |
| US-18.3 | SM-18.07 | R1 | No |
| US-19.1 | SM-19.02, SM-19.05 | R1 | No |
| US-19.2 | SM-19.06, SM-19.04 | R1 | No |
| US-19.3 | SM-19.01, SM-19.03 | R1 | No |
| US-19.4 | SM-19.07 | R1 | No |
| US-20.1 | SM-20.01 | R2 | No |
| US-20.2 | SM-20.02 | R2 | No |
| US-21.1 | SM-21.01 | R1 | No |
| US-21.2 | SM-21.02 | R1 | No |

**Total Stories Mapped: 74 / 74 — 0 Orphans**

---

### Gap Analysis

**Journey Stages with No Mapped Stories:**

> All nine journeys (JRN-01.1 through JRN-04.1) have at least one mapped story per stage. No journey stages are uncovered.

**JTBD Outcomes Without NaC:**

> All 12 JTBD outcomes have at least one derived NaC. The NaC Derivation Table lists 54 derivation rows covering all 12 JTBD.

**JTBD-03.3 Note:** JTBD-03.3 (Vendor support via Swagger) maps primarily to US-20.1 and US-20.2. It has no dedicated journey (JRN-03.3 was not created), but its success measure is covered by the JRN-03.2 Deliver stage. No gap.

**Orphan Stories:** None. Every story is mapped to at least one journey stage.

**R3-Only JTBD Gap:** F15 (Metrics/Reporting) has no formally specified JTBD in the JTBD document. US-15.1 and US-15.2 serve management oversight needs (Jordan + city leadership) but are not tied to a specific outcome-driven JTBD. This is intentional — they are P2 "nice-to-have" reporting screens, not core job-hiring criteria.

---
