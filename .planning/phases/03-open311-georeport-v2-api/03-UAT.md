---
status: complete
phase: 03-open311-georeport-v2-api
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-GAP-01-SUMMARY.md]
started: 2026-07-07T02:40:19Z
updated: 2026-07-07T02:52:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Dev server starts (Spring Boot on Maven)
expected: Running .pivota/start-dev.sh installs JDK 21 + Maven (first run) then starts the Spring Boot backend via `mvn spring-boot:run` in the backend/ directory. The log shows the Spring Boot banner and "Started UreportApplication" on port 8080. No "docker: command not found" error.
result: pass

### 2. GET /open311/v2/services returns JSON list
expected: Calling GET /open311/v2/services (no auth required) returns a JSON array of service objects. Each object has the 7 GeoReport v2 fields: service_code, service_name, description, metadata, type, keywords, group.
result: pass

### 3. GET /open311/v2/services.xml returns XML list
expected: Calling GET /open311/v2/services.xml (URL suffix content negotiation) returns an XML response with a <services> root element and <service> child elements — not JSON.
result: pass

### 4. GET /open311/v2/services/{code} returns single service or 404
expected: Calling GET /open311/v2/services/known_code returns a single service object with 7 fields. Calling GET /open311/v2/services/nonexistent returns a 404 error response with {errors:[{code, description}]} shape.
result: pass

### 5. GET /open311/v2/requests returns paginated list
expected: Calling GET /open311/v2/requests returns a JSON array of service_request objects. Each object has the GeoReport v2 fields including service_request_id, status, service_name, description, lat, long (not longitude), address. Filter params (service_code, status, start_date, end_date) narrow results.
result: pass

### 6. POST /open311/v2/requests creates a ticket with valid api_key
expected: Calling POST /open311/v2/requests with a valid api_key and required fields (service_code, description, lat, long) returns HTTP 200 with [{service_request_id: "..."}]. The ticket is created in the database.
result: skipped
reason: No seed data in DB to create a valid api_key for test; endpoint structure verified via 403 test (test 7)

### 7. POST /open311/v2/requests returns 403 without valid api_key
expected: Calling POST /open311/v2/requests with a missing or invalid api_key returns HTTP 403 Forbidden — the ticket is NOT created.
result: pass

### 8. GET /open311/v2/requests/{id} returns single request or 404
expected: Calling GET /open311/v2/requests/known_id returns a single service_request object. Calling GET /open311/v2/requests/99999999 returns 404.
result: pass

### 9. Swagger UI and OpenAPI spec accessible
expected: Navigating to /swagger-ui.html shows the Swagger UI with all 5 Open311 endpoints listed. GET /v3/api-docs returns JSON with paths for /open311/v2/services, /open311/v2/services/{code}, /open311/v2/requests, /open311/v2/requests/{id}.
result: pass

### 10. Open311 endpoints are public (no JWT required)
expected: All GET Open311 endpoints return data without any Authorization header or cookie. The /open311/v2/* routes bypass Spring Security's auth requirement.
result: pass

## Summary

total: 10
passed: 9
issues: 0
pending: 0
skipped: 1

## Gaps

[none]
