
---

## Coverage Analysis

### Persona Coverage by Release

| Persona | R1 | R2 | R3 |
|---------|----|----|-----|
| PER-01 Marcus (Case Worker) | ✅ Core workflow (login, triage, ticket CRUD, export, search) | ✅ Enhanced (media, location, substatus, notifications, people lookup) | ✅ Complete (bookmarks, templates, contact method, issue types) |
| PER-02 Diana (Dept Admin) | ⚠️ Partial (RBAC enforced; no category config yet) | ✅ Primary journey complete (category config, staff onboarding, scheduler) | ✅ Complete (SLA dashboard, canned reports, response templates) |
| PER-03 Jordan (Sys Admin) | ⚠️ Partial (JWT auth enforced; no user CRUD yet) | ✅ Primary journey complete (user management, API clients, deployment health) | ✅ Complete (issue type admin) |
| PER-04 Integra (API Client) | ✅ Complete (all Open311 endpoints, API key auth) | — (no additional stories) | — (no additional stories) |

### JTBD Coverage by Release

| JTBD-ID | R1 | R2 | R3 |
|---------|----|----|-----|
| JTBD-01.1 Daily Queue Triage | ✅ Complete | ✅ Enhanced | ✅ Full |
| JTBD-01.2 Full Ticket Update | ✅ Complete | ✅ Enhanced (media, templates) | ✅ Full |
| JTBD-01.3 Persistent Saved Searches | ❌ | ❌ | ✅ Complete |
| JTBD-02.1 Category Configuration | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-02.2 SLA Compliance Monitoring | ❌ | ❌ | ✅ Complete |
| JTBD-02.3 Self-Service Staff Onboarding | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-03.1 Centralized User Management | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-03.2 Secure API Client Lifecycle | ❌ | ✅ Complete | ✅ Full |
| JTBD-03.3 Deployment Health Verification | ⚠️ Partial | ✅ Complete | ✅ Full |
| JTBD-04.1 Zero-Change Service Request Submission | ✅ Complete | ✅ Full | ✅ Full |
| JTBD-04.2 Byte-Identical Status Polling | ✅ Complete | ✅ Full | ✅ Full |
| JTBD-04.3 Uninterrupted API Key Authentication | ✅ Complete | ✅ Full | ✅ Full |

### Journey Coverage Summary

| JRN-ID | Journey | First Complete Release | Stages Covered |
|--------|---------|----------------------|----------------|
| JRN-01.1 | Morning Queue Triage | R1 | All 5 stages |
| JRN-01.2 | Full Ticket Update | R1 (basic) / R2 (full media+templates) | All 5 stages by R2 |
| JRN-01.3 | Saving and Reusing a Filter | R3 | All 4 stages |
| JRN-02.1 | Category Configuration | R2 | All 6 stages |
| JRN-02.2 | Month-End SLA Review | R3 | All 5 stages |
| JRN-02.3 | Staff Onboarding | R2 | All 5 stages |
| JRN-03.1 | Post-Migration JWT Validation | R1 (partial) / R2 (full) | All 5 stages by R2 |
| JRN-03.2 | API Client Registration & Key Rotation | R2 | All 5 stages |
| JRN-03.3 | Post-Deployment Health Verification | R2 | All 5 stages |
| JRN-04.1 | Service Request Submission | R1 | All 5 stages |
| JRN-04.2 | Status Polling | R1 | All 4 stages |

### Gap Analysis

#### Journey Stages Without Mapped Stories
_No gaps. All 11 journeys across all stages have at least one mapped story._

Stage verification:
- **S-AUTH** → US-4.1, US-4.2, US-4.3, US-4.4 ✅
- **S-TRIAGE** → US-11.2, US-11.3, US-8.2 ✅
- **S-WORK** → US-0.1–0.8, US-1.1–1.3, US-8.2, US-9.3, US-10.1–10.2, US-14.1, US-15.1, US-16.1, US-19.1, US-20.2 ✅
- **S-SEARCH** → US-0.8, US-5.3, US-11.1, US-15.3, US-18.2 ✅
- **S-BOOKMARK** → US-12.1, US-12.2, US-12.3 ✅
- **S-CONFIG** → US-6.1, US-6.2, US-7.1–7.3, US-8.1, US-9.1–9.2, US-16.2, US-20.1 ✅
- **S-METRICS** → US-17.1, US-17.2 ✅
- **S-ADMIN** → US-3.1, US-3.3, US-5.1–5.2, US-5.4, US-13.1, US-13.2, US-19.2 ✅
- **S-DEPLOY** → US-15.2, US-16.3 ✅
- **S-API** → US-2.1–2.6, US-3.2, US-18.1 ✅

#### JTBD Outcomes Without Derived NaC
_No gaps. All 12 JTBD entries (JTBD-01.1 through JTBD-04.3) have at least one NaC derived in the NaC Derivation Table._

#### Orphan Stories (not mapped to any journey stage)
_No orphan stories. All 63 user stories are placed in the Story Map Matrix._

#### Cross-Journey Risk Hotspots
These areas have the highest cross-journey dependency and represent the highest regression risk:

| Risk Area | Stories | Affected Journeys | Mitigation |
|-----------|---------|------------------|------------|
| **JWT Auth (S-AUTH)** | US-4.1–4.4 | JRN-01.1, JRN-02.3, JRN-03.1, JRN-04.1 | Auth migration validated in JRN-03.1; R1 acceptance gate |
| **Open311 Response Shape** | US-2.1–2.6, US-18.1 | JRN-03.3, JRN-04.1, JRN-04.2 | Automated fixture comparison test suite; R1 acceptance gate |
| **Category Config Upstream** | US-7.1, US-7.3 | JRN-02.1 → JRN-04.1 (service discovery) | Category config in R2 must not break Open311 service list shape |
| **Scheduler Jobs** | US-16.1, US-16.2, US-16.3, US-15.2 | JRN-03.3 | Structured logging (NFR-10); all jobs verified in R2 |

---
