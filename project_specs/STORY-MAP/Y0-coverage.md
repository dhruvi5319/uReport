---

## Coverage Analysis

---

### Persona Coverage by Release

| Persona | R1 — Foundation | R2 — Complete MVP | R3 — Enhancements |
|---------|----------------|-------------------|-------------------|
| PER-01 Dana (Staff) | Login, create/assign/close tickets, view history | Full-text search, photo upload, substatus, notifications | Bookmarks, response templates, ticket merging |
| PER-02 Marcus (Manager) | Reassign tickets, view audit trail, configure SLA/auto-close | SLA dashboard, bulk reassign drill-through, weekly CSV report | — (fully served after R2) |
| PER-03 Priya (Citizen) | Mobile submission, public ticket status tracking | Email confirmation, photo upload, map location | — (fully served after R2) |
| PER-04 Tomás (Admin/IT) | Deploy, configure OIDC, Open311 compliance, RBAC, admin UI | Staff user management, Solr ops, people search | API key management, response template admin |

**Coverage verdict:** All 4 personas are meaningfully served from R1. R2 completes primary job satisfaction for PER-02 and PER-03. R3 elevates efficiency for PER-01 and completes JTBD-04.3 for PER-04.

---

### JTBD Coverage by Release

| JTBD-ID | Persona | R1 | R2 | R3 | Status |
|---------|---------|----|----|----|--------|
| JTBD-01.1 | PER-01 | Partial | Partial | ✓ Full | Dashboard + search + sort in R2; bookmarks complete in R3 |
| JTBD-01.2 | PER-01 | Partial | Partial | ✓ Full | Intake + assign in R1; notifications in R2; templates in R3 |
| JTBD-01.3 | PER-01 | — | ✓ Full | — | Mobile photo upload + audit trail in R2 |
| JTBD-02.1 | PER-02 | Partial | ✓ Full | — | Bulk reassign in R1; SLA dashboard + drill-through in R2 |
| JTBD-02.2 | PER-02 | — | ✓ Full | — | Weekly CSV report + stable schema in R2 |
| JTBD-02.3 | PER-02 | ✓ Full | — | — | SLA day + auto-close config in R1 |
| JTBD-03.1 | PER-03 | Partial | ✓ Full | — | Mobile submit + confirmation in R1; email + photo in R2 |
| JTBD-03.2 | PER-03 | ✓ Full | — | — | Public status tracking without account in R1 |
| JTBD-04.1 | PER-04 | ✓ Full | — | — | Open311 compliance + OpenAPI spec in R1 |
| JTBD-04.2 | PER-04 | ✓ Full | — | — | Docker Compose deployment + OIDC config in R1 |
| JTBD-04.3 | PER-04 | Partial | Partial | ✓ Full | OIDC/RBAC in R1; people mgmt in R2; API keys in R3 |

**All 11 JTBDs are fully addressed across R1–R3. No JTBD is unaddressed.**

---

### Journey Stage Coverage

| Journey | Stage | Covered In Release | Story Count |
|---------|-------|-------------------|-------------|
| JRN-01.1 | Login | R1 | 2 |
| JRN-01.1 | Land on Dashboard | R1 / R2 | 3 |
| JRN-01.1 | Recall Saved Queue | R3 | 2 |
| JRN-01.1 | Prioritize | R2 | 3 |
| JRN-01.1 | Open First Ticket | R1 | 2 |
| JRN-01.2 | Receive Call | R1 | 1 |
| JRN-01.2 | Enter Details | R1 / R2 | 3 |
| JRN-01.2 | Assign Ticket | R1 / R2 | 4 |
| JRN-01.2 | Save Ticket | R1 / R2 | 2 |
| JRN-01.2 | Select Template | R3 | 2 |
| JRN-01.2 | Send Response | R2 / R3 | 2 |
| JRN-02.1 | Login & Land | R2 | 1 |
| JRN-02.1 | Drill into SLA Breaches | R2 | 2 |
| JRN-02.1 | Select for Reassignment | R1 / R2 | 2 |
| JRN-02.1 | Reassign Bulk | R1 | 2 |
| JRN-02.1 | Generate Weekly Report | R2 | 2 |
| JRN-02.1 | Paste into Excel | R2 | 1 |
| JRN-03.1 | Discover Form | R1 | 3 |
| JRN-03.1 | Select Category | R1 | 2 |
| JRN-03.1 | Enter Location | R2 | 1 |
| JRN-03.1 | Upload Photo | R2 | 2 |
| JRN-03.1 | Submit Form | R1 / R2 | 2 |
| JRN-03.1 | Receive Email & Check Status | R1 / R2 | 3 |
| JRN-04.1 | Read Runbook | R1 | 1 |
| JRN-04.1 | Docker Compose Up | R1 | 1 |
| JRN-04.1 | Configure OIDC in Admin UI | R1 | 2 |
| JRN-04.1 | Test Staff Login | R1 | 2 |
| JRN-04.1 | Read OpenAPI Spec | R1 | 2 |
| JRN-04.1 | Run Open311 Compliance Test | R1 | 3 |
| JRN-04.2 | Navigate to API Client Management | R3 | 1 |
| JRN-04.2 | Create New API Client | R3 | 1 |
| JRN-04.2 | Test API Key | R1 | 1 |
| JRN-04.2 | Navigate to Staff User Management | R2 | 1 |
| JRN-04.2 | Assign Role and Save | R1 / R2 | 2 |

**All 34 journey stages across 6 journeys have at least one story mapped. No journey stage is without coverage.**

---

### Gap Analysis

#### JTBD Outcomes Without Stories

> **None found.** All 11 JTBD outcomes have at least one story and one NaC derivation.

#### Journey Stages Without Coverage

> **None found.** All 34 journey stages have at least one mapped story.

#### Orphan Stories (not mapped to any journey stage)

> **None found.** All 50 user stories (US-0.1 – US-18.1) appear in the story map.
>
> Cross-check: 50 unique stories × average 1.04 stage placements = 52 map entries. Three stories have dual-stage placement (US-0.1, US-0.3, US-4.1) to reflect their role in multiple journeys.

#### Features With No JTBD Derivation

> **None.** All 19 features (F0–F18) used in user stories are connected to at least one JTBD outcome via the NaC Derivation Table.

---
