## Priority Breakdown

| Priority | Story Count | Features |
|---|---|---|
| **P0 — Critical** | 50 | F0, F1, F2, F3, F4, F9, F11, F12, F17, F18, F19, F21 |
| **P1 — High** | 20 | F5, F6, F7, F8, F10, F13, F14, F20 |
| **P2 — Medium** | 4 | F15, F16 |
| **P3 — Low** | 0 | — |
| **Total** | **74** | F0–F21 |

### P0 Stories (Critical — must ship before launch)
All stories tagged P0 are prerequisites for a working system. Key clusters:
- **F0** Open311 API compatibility — external clients must continue working unchanged
- **F1 + F9** Ticket lifecycle and action logging — core business function
- **F2** Public submission form — primary public-facing feature
- **F3 + F4** Case list and detail — primary staff workspace
- **F11** Full-text search — Solr must be eliminated
- **F12** Authentication — all staff access gated behind LDAP/CAS
- **F17 + F18 + F19** Design system, navigation, and accessibility — foundation for all UI
- **F21** Database migration — system cannot run without successful migration

### P1 Stories (High — required for complete operational capability)
- **F5** Dashboard — staff landing experience
- **F6 + F7 + F8** Admin panels for people, departments, categories
- **F10** Media upload — photo evidence workflows
- **F13** Lookup table admin — substatus, issue types, templates, contact methods
- **F14** Open311 client management — API key administration
- **F20** OpenAPI documentation — developer onboarding

### P2 Stories (Medium — important for management oversight)
- **F15** Metrics and reporting — case volume, resolution time analysis
- **F16** Geo-clustering — enhanced map usability at scale

---

*UserStories-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
