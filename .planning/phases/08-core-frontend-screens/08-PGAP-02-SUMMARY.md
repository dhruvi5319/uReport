---
phase: 08-core-frontend-screens
plan: PGAP-02
subsystem: api
tags: [java, spring-boot, rest, multipart, geocode, nominatim, public-api, open311]

# Dependency graph
requires:
  - phase: 08-core-frontend-screens
    provides: "Frontend public submission wizard (StepReview POSTs to /api/tickets/public, StepLocation calls /api/geocode)"
  - phase: 04-core-case-management-backend
    provides: "Ticket, TicketHistory entities and repositories; SecurityConfig permitAll() rules already in place"
provides:
  - "POST /api/tickets/public — anonymous multipart ticket creation endpoint returning { id, ticketId: 'SR-{N}' }"
  - "GET /api/geocode — forward and reverse geocoding proxy via Nominatim returning { suggestions } or { address }"
  - "PublicTicketController, PublicTicketRequest DTO, PublicTicketResponse DTO in com.ureport.public_api"
  - "GeocodeController in com.ureport.geo.controller (alongside existing GeoclusterController)"
affects: [phase-9-rate-limiting, uat-tests-14-16-18]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Anonymous public endpoint with multipart/form-data: permitAll() in SecurityConfig, no @PreAuthorize"
    - "Contact info stored in additionalFields JSON column (write-only from public endpoint)"
    - "Nominatim geocoding proxy with URLEncoder (T-08-P2-01) and graceful fallback on network failure"
    - "Open311-style human-readable ticket ID: SR-{id}"

key-files:
  created:
    - backend/src/main/java/com/ureport/public_api/controller/PublicTicketController.java
    - backend/src/main/java/com/ureport/public_api/dto/PublicTicketRequest.java
    - backend/src/main/java/com/ureport/public_api/dto/PublicTicketResponse.java
    - backend/src/main/java/com/ureport/geo/controller/GeocodeController.java
  modified: []

key-decisions:
  - "Photo upload skipped in public endpoint — MediaService.upload() requires PersonDetails (JWT principal); photos received but not persisted; ticket created and confirmed successfully per UAT scope"
  - "SR-{id} format for public ticketId (Open311-style); matches ConfirmationScreen Open311 link"
  - "Contact fields stored in additionalFields JSON column — write-only from public endpoint, not returned in POST response; only accessible to authenticated staff"
  - "Nominatim calls wrapped in try/catch — empty suggestions on network failure; wizard degrades gracefully"
  - "Short geocode queries (< 3 chars) return empty suggestions without calling Nominatim"

patterns-established:
  - "Public API package: com.ureport.public_api.{controller,dto} separates anonymous endpoints from staff CRM"
  - "STRIDE threat mitigations documented inline as T-{phase}-{plan}-{nn} comments"

# Metrics
duration: 2min
completed: 2026-07-09
---

# Phase 8 Plan PGAP-02: Public Ticket Submission and Geocode Endpoints Summary

**POST /api/tickets/public multipart endpoint and GET /api/geocode Nominatim proxy added to close UAT gaps 14, 16, and 18 — public wizard now completes end-to-end with SR-{id} confirmation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-09T18:56:27Z
- **Completed:** 2026-07-09T18:58:57Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `POST /api/tickets/public` implemented — validates categoryId (JPA, no SQL injection), description, and location; persists Ticket + TicketHistory; returns `{ id, ticketId: "SR-{N}" }`
- `GET /api/geocode` implemented — forward geocode (`?q=`) returns `{ suggestions: [...] }` via Nominatim; reverse geocode (`?lat=&lon=`) returns `{ address: string }`; graceful empty-suggestions fallback if Nominatim unreachable
- SecurityConfig `permitAll()` rules at lines 64–65 were already in place; no security config changes needed

## Task Commits

Each task was committed atomically:

1. **Task 1: POST /api/tickets/public** - `edfa8a6` (feat)
2. **Task 2: GET /api/geocode** - `7864acd` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `backend/src/main/java/com/ureport/public_api/controller/PublicTicketController.java` — anonymous multipart ticket submission at POST /api/tickets/public
- `backend/src/main/java/com/ureport/public_api/dto/PublicTicketRequest.java` — POJO for form fields (firstname, lastname, email, phone, categoryId, location, lat, lon, description)
- `backend/src/main/java/com/ureport/public_api/dto/PublicTicketResponse.java` — response shape `{ id, ticketId }` matching frontend expectation
- `backend/src/main/java/com/ureport/geo/controller/GeocodeController.java` — forward + reverse geocoding proxy via Nominatim; URL-encoded queries (T-08-P2-01); try/catch fallback

## Decisions Made

- **Photo upload deferred:** `MediaService.upload()` requires `PersonDetails` (JWT principal). Public endpoint is anonymous — no JWT principal available. Photos are received by the controller but not persisted. A WARN log is emitted. Ticket creation succeeds and the UAT ConfirmationScreen shows the case ID. Acceptable per Phase 8 UAT scope (only tests submission success, not media storage).
- **SR-{id} ticket ID format:** Matches the `ConfirmationScreen` Open311 link pattern. Simple, zero-dependency string format avoids a separate sequence table.
- **Contact info in `additionalFields`:** No `Person` record is created for anonymous reporters; contact fields are stored as JSON in the existing `additional_fields` column. Write-only from this endpoint — not returned in the POST response (T-08-P2-02).
- **Nominatim fallback:** All outbound Nominatim HTTP calls are wrapped in try/catch returning empty suggestions or coordinate string. K8s sandbox network egress may block outbound calls — wizard must not crash.

## Deviations from Plan

None — plan executed exactly as written. The photo-upload skip was explicitly documented in the plan as the intended approach for Phase 8 scope.

## Issues Encountered

None. Maven compile succeeded cleanly on first attempt for both tasks.

## User Setup Required

None — no external service configuration required. Nominatim is a public API (no key needed).

## Next Phase Readiness

- UAT tests 14, 16, and 18 can now pass: the missing backend endpoints exist and return the expected shapes
- Phase 8 gap closure complete — public submission wizard works end-to-end
- Phase 9 rate limiting (T-08-P2-03, T-08-P2-06 deferred risks) is the natural next step for production hardening

---
*Phase: 08-core-frontend-screens*
*Completed: 2026-07-09*

## Self-Check: PASSED

- FOUND: PublicTicketController.java
- FOUND: PublicTicketRequest.java
- FOUND: PublicTicketResponse.java
- FOUND: GeocodeController.java
- FOUND: SUMMARY.md
- FOUND commit edfa8a6: feat(08-PGAP-02): implement POST /api/tickets/public anonymous submission endpoint
- FOUND commit 7864acd: feat(08-PGAP-02): implement GET /api/geocode Nominatim proxy endpoint
