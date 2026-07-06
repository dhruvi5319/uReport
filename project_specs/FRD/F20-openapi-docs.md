---

## F20: OpenAPI / Swagger API Documentation

**Priority:** P1 — High

### Description

All Spring Boot REST endpoints — both the internal React-to-API routes and the frozen Open311 endpoints — are documented via OpenAPI 3.0 using springdoc-openapi. The Swagger UI is accessible at a known URL, enabling developer exploration and integration testing. The OpenAPI spec is exportable as JSON or YAML for client code generation.

### Terminology

- **springdoc-openapi** — Spring Boot library that auto-generates OpenAPI 3.0 spec from controller annotations and exports it at `/v3/api-docs`.
- **Swagger UI** — Browser-based API explorer served at `/swagger-ui.html`.
- **`@Operation`** — springdoc annotation documenting a controller method.
- **`@ApiResponse`** — springdoc annotation documenting possible HTTP responses for an endpoint.
- **`@Schema`** — springdoc annotation documenting a DTO or model field.
- **Bearer token** — JWT authentication scheme; documented in OpenAPI securitySchemes.

### Sub-features

- springdoc-openapi integrated in Spring Boot application
- All controllers annotated with `@Operation`, `@ApiResponse`, `@Schema`
- OpenAPI 3.0 spec generated at `/v3/api-docs` (JSON)
- OpenAPI YAML at `/v3/api-docs.yaml`
- Swagger UI at `/swagger-ui.html`
- Open311 endpoints documented with GeoReport v2 field descriptions and frozen-contract note
- JWT Bearer authentication scheme documented and usable in Swagger UI (Authorize button)
- Spec exportable as JSON/YAML
- API tags grouping endpoints by feature domain

### Process — Spec Generation

1. springdoc-openapi scans all `@RestController` classes on Spring Boot startup.
2. For each `@RequestMapping` method, it reads `@Operation` for summary/description, `@ApiResponse` for response schemas, and `@Schema` on DTOs for field documentation.
3. The generated spec is served at `/v3/api-docs`.
4. Swagger UI at `/swagger-ui.html` loads the spec and renders the interactive explorer.
5. Developers can click "Authorize" and enter their JWT to make authenticated test calls from the UI.

### API Tags (Grouping)

| Tag | Endpoints Covered |
|---|---|
| `Open311` | /open311/v2/* |
| `Tickets` | /api/tickets/* |
| `People` | /api/people/* |
| `Departments` | /api/departments/* |
| `Categories` | /api/categories/*, /api/category-groups/* |
| `Actions` | /api/actions/*, /api/tickets/{id}/history |
| `Media` | /api/media/*, /api/tickets/{id}/media |
| `Auth` | /api/auth/* |
| `Admin` | /api/substatuses/*, /api/issue-types/*, /api/contact-methods/*, /api/clients/* |
| `Dashboard` | /api/dashboard/*, /api/geoclusters |
| `Bookmarks` | /api/bookmarks/* |
| `Reports` | /api/metrics, /api/reports/* |

### Security Scheme in OpenAPI Spec

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "JWT issued by POST /api/auth/ldap or CAS callback. Include in Authorization header: Bearer {token}. Alternatively, the httpOnly cookie auth_token is used automatically by browsers."
security:
  - BearerAuth: []
```

Open311 endpoints (`/open311/v2/*`) have `security: []` (no auth for reads; api_key param for writes documented as a query parameter, not a security scheme).

### Controller Annotation Requirements

Every controller method must have:
```java
@Operation(
    summary = "Short summary (≤100 chars)",
    description = "Longer description explaining behavior, side effects, and special cases."
)
@ApiResponse(responseCode = "200", description = "Success", content = @Content(schema = @Schema(implementation = TicketDto.class)))
@ApiResponse(responseCode = "400", description = "Validation error")
@ApiResponse(responseCode = "401", description = "Authentication required")
@ApiResponse(responseCode = "403", description = "Insufficient permissions")
@ApiResponse(responseCode = "404", description = "Resource not found")
```

DTO fields must have:
```java
@Schema(description = "The unique ticket ID", example = "12345")
private Long id;
```

### Coverage Requirement

100% of controller methods must be annotated. CI check: `mvn verify -Dspringdoc.api-docs.enabled=true` and validate that the generated spec contains an entry for every known endpoint path.

### Swagger UI Configuration

```yaml
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: alpha
    tagsSorter: alpha
    tryItOutEnabled: true
    filter: true
  api-docs:
    path: /v3/api-docs
  show-actuator: false
  default-produces-media-type: application/json
```

### Access Control

- In production: Swagger UI and `/v3/api-docs` should be accessible only from internal network (configurable via Spring Security path matchers).
- In development: accessible without authentication.
- Configuration: `springdoc.swagger-ui.enabled` and `springdoc.api-docs.enabled` properties control visibility per environment.

### Open311 Documentation Note

All Open311 endpoints must include in their `@Operation.description`:
> "**Frozen Contract:** This endpoint implements the Open311 / GeoReport v2 specification. Its path, HTTP method, query parameters, and response format are frozen and must not change. External clients are deployed against this contract."

### Validation

- All `@ApiResponse` annotations must cover at least: 200, 400, 401, 403, 404.
- All DTO fields with business semantics must have `@Schema(description = ...)`.
- CI build fails if any controller method is missing `@Operation`.

### Error States

| Scenario | Behavior |
|---|---|
| Swagger UI inaccessible in prod | Developer contacts admin; internal network access required |
| Spec generation fails at startup | Spring Boot startup fails with descriptive error; fix annotations |

### API Surface

| URL | Description |
|---|---|
| `GET /v3/api-docs` | OpenAPI 3.0 spec (JSON) |
| `GET /v3/api-docs.yaml` | OpenAPI 3.0 spec (YAML) |
| `GET /swagger-ui.html` | Swagger UI explorer |

### Schema Surface

None — documentation only.
