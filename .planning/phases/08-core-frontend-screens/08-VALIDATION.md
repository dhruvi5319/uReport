# Phase 08 — Validation

**Phase:** 08-core-frontend-screens
**Gap closure plans covered:** PGAP-02
**Type:** Backend-only gap closure

## Automated Verify Signal

```bash
cd backend && mvn compile -q 2>&1 | tail -20 && echo "COMPILE OK"
```

`mvn compile` exiting 0 with no errors is the primary automated verification signal for the PGAP-02 plan. No frontend build step is required by this plan.

## Dimensions

| Dimension | Status | Notes |
|-----------|--------|-------|
| 1 — Compilation | Automated | `mvn compile -q` must exit 0 |
| 2 — Endpoint contract | Automated (curl) | POST /api/tickets/public → 201; GET /api/geocode → 200 |
| 3 — Auth bypass | Automated (curl) | Both endpoints return non-401 without Authorization header |
| 4 — Validation errors | Automated (curl) | POST without categoryId → 400 |
| 5 — History entry | Runtime | TicketHistory row created with actionId=null (anonymous) |
| 6 — Photo no-op | Accepted | Photos received but not persisted; accepted per UAT scope |
| 9 — UI / Playwright | Not applicable | This plan adds backend controllers only; no UI components are added or modified |

## Acceptance

Phase 08 gap closure (PGAP-02) is complete when:
- `mvn compile -q` exits 0
- UAT tests 14, 16, and 18 move from `failed` to `pass`
- POST /api/tickets/public returns 201 with `{ id, ticketId }` for valid requests
- GET /api/geocode returns 200 with `{ suggestions: [...] }` for any `?q=` query
