## Epic 20: OpenAPI / Swagger API Documentation (F20)

All Spring Boot REST endpoints — including internal CRM API routes and frozen Open311 endpoints — are documented via OpenAPI 3.0 (springdoc-openapi). The Swagger UI is accessible to developers at a known URL.

---

### US-20.1: Explore All API Endpoints via Swagger UI
**As a** Jordan Calloway (System Administrator), **I want to** access a Swagger UI at `/swagger-ui.html` that documents all Spring Boot endpoints, **so that** I can answer vendor integration questions without reading PHP source code or maintaining separate API documentation.

**Acceptance Criteria:**
- [ ] Swagger UI is accessible at `/swagger-ui.html` after deployment
- [ ] OpenAPI spec is available at `/v3/api-docs` in JSON format
- [ ] All Spring Boot controllers have methods annotated with `@Operation`, `@ApiResponse`, and `@Schema`
- [ ] Open311 endpoints are documented with GeoReport v2 field descriptions
- [ ] JWT Bearer token authentication flow is documented (how to authenticate and pass the token)
- [ ] Spec coverage is 100%: every controller method has at least one documented `@Operation` annotation
- [ ] Spec is exportable as JSON/YAML for client code generation

**Priority:** P1 | **Feature Ref:** F20

---

### US-20.2: Test API Calls Directly from Swagger UI
**As a** Jordan Calloway (System Administrator), **I want to** execute API calls from Swagger UI using a Bearer token, **so that** I can help a third-party integration team verify their implementation without setting up a separate API client.

**Acceptance Criteria:**
- [ ] Swagger UI includes an "Authorize" button for entering a Bearer JWT token
- [ ] Authenticated endpoints can be tested directly from the Swagger UI using the entered token
- [ ] Open311 endpoints can be tested without a Bearer token (they use `api_key` instead)
- [ ] Request/response schemas are accurate and reflect the actual API behavior (no documentation drift)

**Priority:** P1 | **Feature Ref:** F20

---
