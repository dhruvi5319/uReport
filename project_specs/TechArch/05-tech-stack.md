## Section 05: Technology Stack

---

## Backend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Java | 21 LTS | JVM runtime; virtual threads available |
| Framework | Spring Boot | 3.x | Auto-configuration, REST, Scheduler, Security |
| Web / REST | Spring Web MVC | 6.x | REST controllers, content negotiation |
| Security | Spring Security | 6.x | Filter chain, method-level auth, JWT validation |
| JWT | JJWT (io.jsonwebtoken) | 0.12.x | JWT generation, parsing, validation |
| ORM | Spring Data JPA + Hibernate | 6.x | Entity mapping, repository pattern |
| DB Driver | PostgreSQL JDBC | 42.x | JDBC driver for PG 16 |
| Connection Pool | HikariCP | 5.x | High-performance JDBC connection pooling |
| Migration | Flyway | 10.x | Schema versioning; DDL in `db/migration/V*.sql` |
| Scheduling | Spring `@Scheduled` | — | Digest, auto-close, geo-cluster, audit jobs |
| Email | Spring Boot Mail (Jakarta Mail) | — | SMTP email dispatch for notifications |
| Image Processing | Thumbnailator | 0.4.x | Thumbnail generation (200×200px) |
| JSON | Jackson | 2.x | JSON serialization/deserialization |
| XML | Custom writer (no JAXB) | — | Byte-compatible Open311 XML output |
| CSV | Apache Commons CSV | 1.x | CSV export formatting |
| Build | Gradle (or Maven) | 8.x | Dependency management, packaging |
| Testing | JUnit 5 + Spring Boot Test | — | Unit + integration tests |
| Mocking | Mockito | 5.x | Service layer unit test mocking |
| HTTP Testing | MockMvc | — | Controller-level integration tests |
| Containerization | Docker | 24.x | Application container |

### Key Backend Dependency Justifications

- **Flyway** instead of Hibernate `ddl-auto=create`: Schema migrations are versioned SQL files, enabling safe production upgrades and testable migration scripts.
- **Thumbnailator** over ImageIO direct: simpler API, good quality, handles aspect ratio automatically.
- **Custom XML writer** (not JAXB): JAXB would require annotating DTOs; a manual writer can exactly replicate the legacy PHP Laminas XML template element names and structure, guaranteeing byte-compatibility.
- **HikariCP**: Default Spring Boot connection pool; fastest available for JDBC; pool size tuned to `DB_POOL_SIZE` env var (default 10).

---

## Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| UI Framework | React | 18.x | Component-based SPA |
| Language | TypeScript | 5.x | Type safety, IDE autocompletion |
| Build Tool | Vite | 5.x | Fast dev server, optimized production build |
| Routing | React Router | 6.x | Client-side SPA routing |
| HTTP Client | Axios | 1.x | REST API calls, interceptors for JWT refresh |
| State Management | Zustand | 4.x | Lightweight global state (auth, filters) |
| Form Handling | React Hook Form | 7.x | Ticket creation, people forms, dynamic customFields |
| Validation | Zod | 3.x | Schema validation for forms and API response types |
| Map | MapLibre GL JS | 3.x | Geo-cluster map view (open-source, no API key) |
| UI Components | shadcn/ui + Tailwind CSS | — | Accessible components, utility-first styling |
| Testing | Vitest + React Testing Library | — | Unit + component tests |
| Containerization | Nginx + Docker | — | Static asset serving + reverse proxy |

### Frontend Dependency Justifications

- **Vite over CRA**: Faster build times, native ESM dev server; CRA is deprecated.
- **Zustand over Redux**: Lower boilerplate for a CRM with mostly server-driven state; Redux overkill.
- **MapLibre over Leaflet**: Native WebGL rendering for geo-clusters at scale; no proprietary tile API key needed.
- **shadcn/ui**: Accessible, unstyled-by-default components composable with Tailwind; avoids opinionated MUI theming.

---

## Database Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| RDBMS | PostgreSQL | 16 | Primary data store |
| Spatial Extension | PostGIS | 3.4 | GEOGRAPHY types, ST_DWithin, ST_MakePoint, GiST indexes |
| Crypto Extension | pgcrypto | — | `gen_random_uuid()` for refresh token PKs |
| FTS | PostgreSQL native | — | `tsvector`, `tsquery`, `GIN` index on `tickets.search_vector` |
| Image | Docker: postgis/postgis | 16-3.4 | Official image with PostGIS pre-installed |

### FTS Configuration

```sql
-- FTS is configured for English:
to_tsvector('english', ...)
websearch_to_tsquery('english', ?)

-- Weight assignments:
-- 'A' = description (highest relevance)
-- 'B' = location
-- 'C' = city
-- 'D' = zip (lowest relevance)

-- ts_rank used for result ordering when keyword is provided
ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', ?)) DESC
```

The FTS trigger runs `BEFORE INSERT OR UPDATE` to keep `search_vector` always current. No separate Solr indexing job is needed.

---

## Infrastructure Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Container Runtime | Docker 24.x | Container lifecycle |
| Orchestration | Docker Compose 3.9 | Multi-container local + single-host deployment |
| Reverse Proxy | Nginx 1.25 | Static asset serving, SSL termination, API proxy |
| Media Storage | Docker named volume `media` | Persistent file storage for uploads + thumbnails |
| DB Storage | Docker named volume `pgdata` | Persistent PostgreSQL data |
| SSL (optional) | Let's Encrypt + Certbot | TLS certificate for production domain |
| SMTP | Configurable SMTP relay | Outbound email for digest notifications |
| Dev SMTP | MailHog | Local email testing |

---

## Replaced Legacy Components

| Legacy | Replaced By | Notes |
|--------|------------|-------|
| PHP 8.x + Laminas MVC | Java 21 + Spring Boot 3.x | 1:1 feature parity |
| Apache 2.4 | Nginx (reverse proxy) + Spring Boot (app server) | |
| MySQL 8.x | PostgreSQL 16 | All DDL migrated; type mapping documented |
| Apache Solr 7.4 | PostgreSQL FTS (tsvector + GIN) | Eliminates Solr JVM process |
| PHP sessions | JWT + Spring Security | Stateless; supports SPA and API clients |
| PHP cron scripts | Spring `@Scheduled` | Same intervals, configurable via application.yml |
| PHPUnit | JUnit 5 + Spring Boot Test | ≥80% service layer coverage target |
| Ansible / Apache vhost | Docker Compose | Familiar operator interface |
| PHP Composer | Gradle (or Maven) | Java dependency management |

---

## Application Configuration (application.yml skeleton)

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    hikari:
      maximum-pool-size: ${DB_POOL_SIZE:10}
  jpa:
    hibernate:
      ddl-auto: validate      # Flyway manages schema; Hibernate only validates
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration
  mail:
    host: ${SPRING_MAIL_HOST}
    port: ${SPRING_MAIL_PORT:587}
    username: ${SPRING_MAIL_USERNAME}
    password: ${SPRING_MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

app:
  jwt:
    secret: ${APP_JWT_SECRET}
    algorithm: HS256
    expiry: 3600
    refreshExpiry: 86400
  media:
    path: ${APP_MEDIA_PATH:/app/media}
    maxSizeMb: 20
    allowedMimeTypes:
      - image/jpeg
      - image/png
      - image/gif
      - image/webp
      - application/pdf
      - text/plain
  mail:
    from: ${APP_MAIL_FROM:noreply@ureport.local}
    footer: ${APP_MAIL_FOOTER:"Sent by uReport"}
  scheduler:
    digestInterval: "0 */5 * * * *"       # every 5 minutes
    autoCloseInterval: "0 0 1 * * *"      # 1 AM daily
    geoClusterInterval: "0 0 2 * * *"     # 2 AM daily
    auditInterval: "0 0 3 * * SUN"        # 3 AM Sunday
  geo:
    clusterRadii:
      - 50000   # level 0: 50 km
      - 20000   # level 1: 20 km
      - 10000   # level 2: 10 km
      - 5000    # level 3: 5 km
      - 2000    # level 4: 2 km
      - 500     # level 5: 500 m
      - 100     # level 6: 100 m
  open311:
    jurisdictionId: ${OPEN311_JURISDICTION_ID:city.gov}
    endpointUrl: ${OPEN311_ENDPOINT_URL:https://city.gov/open311}
    obsoleteApiKeys: ${OPEN311_OBSOLETE_KEYS:}
    contact: ${OPEN311_CONTACT:help@city.gov}
    keyService: ${OPEN311_KEY_SERVICE:https://city.gov/open311/key}
  cors:
    allowedOrigins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```
