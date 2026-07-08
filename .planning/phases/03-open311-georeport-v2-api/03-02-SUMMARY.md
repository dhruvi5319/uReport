---
phase: 03-open311-georeport-v2-api
plan: 02
subsystem: api
tags: [open311, georeport-v2, spring-boot, jpa, postgresql, rest, tickets, clients]

# Dependency graph
requires:
  - phase: 03-open311-georeport-v2-api
    provides: Spring Boot project foundation (pom.xml, application.yml, Category/Department entities from 03-01)
provides:
  - Ticket, TicketHistory, Media, Client, Substatus JPA entities mapping tickets/media tables
  - TicketRepository with JpaSpecificationExecutor for dynamic filtering
  - ClientRepository with findByApiKey for api_key validation
  - Open311ServiceRequestDto with all 17 GeoReport v2 service_request fields
  - Open311RequestService with findRequests (filter+paginate), findRequest, createRequest
  - Open311RequestsController: GET/POST /open311/v2/requests, GET /open311/v2/requests/{id}
  - Open311RequestsIT: 8 integration tests using Zonky embedded PostgreSQL
affects: [03-03-openapi-documentation, 04-core-case-management-backend]

# Tech tracking
tech-stack:
  added: [JpaSpecificationExecutor, spring-data-jpa dynamic queries]
  patterns:
    - JPA Specification for dynamic multi-field filter queries (service_code, status, dates, bbox)
    - api_key validation before any state mutation (FORBIDDEN before DB write)
    - Silent media upload error handling (catch Exception ignored)
    - HTTP 200 (not 201) for POST per GeoReport v2 PHP reference behavior
    - @JsonProperty("long") for longitude field (reserved word workaround)
    - @AutoConfigureEmbeddedDatabase(ZONKY) for integration tests (no Docker daemon)

key-files:
  created:
    - backend/src/main/java/com/ureport/domain/Ticket.java
    - backend/src/main/java/com/ureport/domain/TicketHistory.java
    - backend/src/main/java/com/ureport/domain/Media.java
    - backend/src/main/java/com/ureport/domain/Client.java
    - backend/src/main/java/com/ureport/domain/Substatus.java
    - backend/src/main/java/com/ureport/repository/TicketRepository.java
    - backend/src/main/java/com/ureport/repository/TicketHistoryRepository.java
    - backend/src/main/java/com/ureport/repository/MediaRepository.java
    - backend/src/main/java/com/ureport/repository/ClientRepository.java
    - backend/src/main/java/com/ureport/repository/PersonRepository.java
    - backend/src/main/java/com/ureport/open311/dto/Open311ServiceRequestDto.java
    - backend/src/main/java/com/ureport/open311/service/Open311RequestService.java
    - backend/src/main/java/com/ureport/open311/controller/Open311RequestsController.java
    - backend/src/test/java/com/ureport/open311/Open311RequestsIT.java
  modified:
    - backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java (H2 → Zonky)

key-decisions:
  - "JPA Specification pattern for dynamic filter queries (service_code, status, date ranges, bbox) — parameterized predicates prevent SQL injection"
  - "api_key validated before any DB write — throws 403 FORBIDDEN immediately if missing or invalid"
  - "Media upload errors silently caught (Exception ignored) — ticket always created per TechArch spec"
  - "HTTP 200 (not 201) for POST /requests — matches PHP reference behavior"
  - "@JsonProperty('long') on Double lon field — GeoReport v2 requires 'long' as JSON key (reserved Java word)"
  - "@AutoConfigureEmbeddedDatabase(ZONKY) for integration tests — consistent with project test architecture"
  - "Open311ServiceRequestDto has 17 GeoReport v2 fields (not 18 as plan states — plan has documentation inconsistency)"

patterns-established:
  - "Open311 controller exception handler pattern: ResponseStatusException → Open311ErrorDto with {errors:[{code,description}]}"
  - "Content negotiation: URL suffix (.json/.xml) → format query param → Accept header → default JSON"
  - "Test data setup: @BeforeEach creates test client with known api_key + at least one active category"

# Metrics
duration: 10min
completed: 2026-07-08
---

# Phase 3 Plan 02: Open311 Requests Endpoints Summary

**Open311 GeoReport v2 requests CRUD: GET/POST /open311/v2/requests and GET /requests/{id} with JPA Specification filtering, api_key auth, and Zonky embedded PostgreSQL integration tests**

## Performance

- **Duration:** 10 min
- **Completed:** 2026-07-08
- **Tasks:** 2 completed
- **Files modified:** 14

## Accomplishments

- 5 JPA entities mapping the tickets domain: Ticket, TicketHistory, Media, Client, Substatus
- Open311ServiceRequestDto with all 17 GeoReport v2 service_request fields (plan says 18 but GeoReport v2 spec has 17 — note in plan is a documentation inconsistency)
- Open311RequestService with dynamic JPA Specification filtering (service_code, status, dates, bbox)
- Open311RequestsController with GET/POST /requests + content negotiation
- 8 integration tests using Zonky embedded PostgreSQL
- Open311GoldenFileIT also migrated to Zonky

## Task Commits

1. **Task 1: JPA entities + service + controller** - pre-existing code verified
2. **Task 2: Fix Open311RequestService reporter + migrate IT tests to Zonky** - `4263d19` (feat)

## Files Created/Modified

- `backend/src/main/java/com/ureport/domain/Ticket.java` — Maps tickets table with all columns
- `backend/src/main/java/com/ureport/domain/Client.java` — Maps clients table; api_key validation field
- `backend/src/main/java/com/ureport/domain/TicketHistory.java` — Maps ticket_history for status_notes
- `backend/src/main/java/com/ureport/domain/Media.java` — Maps media table for media_url
- `backend/src/main/java/com/ureport/domain/Substatus.java` — Maps substatus table (FK on Ticket)
- `backend/src/main/java/com/ureport/open311/dto/Open311ServiceRequestDto.java` — 17 GeoReport v2 fields
- `backend/src/main/java/com/ureport/open311/service/Open311RequestService.java` — Core business logic (fixed reporter creation)
- `backend/src/main/java/com/ureport/open311/controller/Open311RequestsController.java` — REST controller
- `backend/src/test/java/com/ureport/open311/Open311RequestsIT.java` — 8 integration tests (Zonky)
- `backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java` — Golden file tests (Zonky)

## Decisions Made

1. Used JPA Specification for dynamic query building — all filter params via parameterized predicates (SQL injection safe)
2. api_key check before any state mutation — FORBIDDEN thrown immediately if null/blank or not found in clients table
3. Media upload: catch(Exception ignored) in createRequest() — silently drops errors, ticket always persists
4. POST /requests returns HTTP 200 with array `[{...}]` per PHP reference implementation behavior
5. `@JsonProperty("long")` on `Double lon` field — GeoReport v2 JSON key is "long" (Java reserved word)
6. Zonky embedded PostgreSQL instead of H2 — consistent with project architecture decision from Phase 01

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Open311RequestService.resolveReporter() missing email/phone assignment**
- **Found during:** Task 2 review
- **Issue:** When creating a new Person reporter from POST params, `email` and `phone` fields were not being set on the new Person entity
- **Fix:** Added `person.setEmail(email != null ? email : "")` and `person.setPhone(params.getOrDefault("phone", ""))` before saving
- **Files modified:** backend/src/main/java/com/ureport/open311/service/Open311RequestService.java
- **Commit:** 4263d19

**2. [Rule 2 - Missing Critical] Open311RequestsIT using H2 instead of Zonky embedded PostgreSQL**
- **Found during:** Task 2 review
- **Issue:** `Open311RequestsIT` used `@TestPropertySource` to override datasource with H2, conflicting with the project's standard Zonky approach and missing H2 dependency in pom.xml
- **Fix:** Replaced `@TestPropertySource` with `@AutoConfigureEmbeddedDatabase(provider=ZONKY, type=POSTGRES)`
- **Files modified:** backend/src/test/java/com/ureport/open311/Open311RequestsIT.java
- **Commit:** 4263d19

**3. [Rule 2 - Missing Critical] Open311GoldenFileIT using H2 instead of Zonky**
- **Found during:** Task 2 review
- **Issue:** Same H2 pattern issue in golden file tests
- **Fix:** Migrated to Zonky embedded PostgreSQL
- **Files modified:** backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java
- **Commit:** 4263d19

---

**Total deviations:** 3 auto-fixed

## Self-Check: PASSED

All required files exist on disk:
- FOUND: backend/src/main/java/com/ureport/domain/Ticket.java
- FOUND: backend/src/main/java/com/ureport/domain/Client.java
- FOUND: backend/src/main/java/com/ureport/domain/TicketHistory.java
- FOUND: backend/src/main/java/com/ureport/domain/Media.java
- FOUND: backend/src/main/java/com/ureport/domain/Substatus.java
- FOUND: backend/src/main/java/com/ureport/repository/ClientRepository.java (findByApiKey)
- FOUND: backend/src/main/java/com/ureport/open311/dto/Open311ServiceRequestDto.java (17 fields, "long" field name)
- FOUND: backend/src/main/java/com/ureport/open311/service/Open311RequestService.java (email+phone in reporter)
- FOUND: backend/src/main/java/com/ureport/open311/controller/Open311RequestsController.java (POST returns 200)
- FOUND: backend/src/test/java/com/ureport/open311/Open311RequestsIT.java (Zonky, 8 tests)

Commits verified:
- FOUND: 4263d19 (feat(03-02): fix Open311RequestService reporter + migrate IT tests to Zonky)
