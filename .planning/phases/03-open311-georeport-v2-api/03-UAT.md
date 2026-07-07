---
status: complete
phase: 03-open311-georeport-v2-api
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-07-07T01:47:55Z
updated: 2026-07-07T01:53:00Z
---

## Current Test

[testing complete]

## Tests

### 1. GET /open311/v2/services returns JSON list
expected: Calling GET /open311/v2/services (no auth required) returns a JSON array of service objects. Each object has the 7 GeoReport v2 fields: service_code, service_name, description, metadata, type, keywords, group.
result: issue
reported: "dev server log shows: docker: command not found — all 3 attempts failed. Docker is not available in the K8s sandbox."
severity: blocker

### 2. GET /open311/v2/services.xml returns XML list
expected: Calling GET /open311/v2/services.xml (URL suffix content negotiation) returns an XML response with <services> root element and <service> child elements — not JSON.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

### 3. GET /open311/v2/services/{code} returns single service or 404
expected: Calling GET /open311/v2/services/known_code returns a single service object with 7 fields. Calling GET /open311/v2/services/nonexistent returns a 404 error response with {errors:[{code, description}]} shape.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

### 4. GET /open311/v2/requests returns paginated list
expected: Calling GET /open311/v2/requests returns a JSON array of service_request objects. Each object has the GeoReport v2 fields including service_request_id, status, service_name, description, lat, long (not longitude), address. Filter params (service_code, status, start_date, end_date) narrow results.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

### 5. POST /open311/v2/requests creates a ticket with valid api_key
expected: Calling POST /open311/v2/requests with a valid api_key and required fields (service_code, description, lat, long) returns HTTP 200 with [{service_request_id: "..."}]. The ticket is created in the database.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

### 6. POST /open311/v2/requests returns 403 without valid api_key
expected: Calling POST /open311/v2/requests with a missing or invalid api_key returns HTTP 403 Forbidden — the ticket is NOT created.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

### 7. GET /open311/v2/requests/{id} returns single request or 404
expected: Calling GET /open311/v2/requests/known_id returns a single service_request object. Calling GET /open311/v2/requests/99999999 returns 404.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

### 8. Swagger UI and OpenAPI spec accessible
expected: Navigating to /swagger-ui.html shows the Swagger UI with all 5 Open311 endpoints listed. GET /v3/api-docs returns JSON with paths for /open311/v2/services, /open311/v2/services/{code}, /open311/v2/requests, /open311/v2/requests/{id}.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

### 9. Open311 endpoints are public (no JWT required)
expected: All GET Open311 endpoints return data without any Authorization header or cookie. The /open311/v2/* routes bypass Spring Security's auth requirement.
result: skipped
reason: Docker not available in K8s sandbox — dev server cannot start

## Summary

total: 9
passed: 0
issues: 1
pending: 0
skipped: 8

## Gaps

- truth: "GET /open311/v2/services returns a JSON array of service objects with 7 GeoReport v2 fields"
  status: failed
  reason: "User reported: dev server log shows: docker: command not found — all 3 attempts failed. Docker is not available in the K8s sandbox."
  severity: blocker
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
