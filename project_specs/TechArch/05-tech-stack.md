---

## 6. Technology Stack

### 6.1 Full Stack Reference

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | Latest stable (19.x) | SPA rendering, component model |
| **Frontend Router** | React Router | v6 | Client-side routing, protected routes |
| **Build Tool** | Vite | Latest | Fast dev server, optimized production bundle |
| **Styling** | Tailwind CSS | v3 | Utility-first CSS, responsive breakpoints |
| **Component Library** | shadcn/ui | Latest | Accessible, customizable UI primitives |
| **Animation** | Framer Motion | Latest | Page transitions, micro-interactions, ≤300ms |
| **Maps** | Mapbox GL JS | Latest | Interactive map widget, pin-drop |
| **Map Fallback** | Leaflet + React Leaflet | Latest | OSM tile fallback when Mapbox key absent |
| **Charts** | Recharts | Latest | Donut/status charts on dashboard |
| **Server State** | TanStack Query (React Query) | v5 | API data fetching, caching, invalidation |
| **Form Handling** | React Hook Form + Zod | Latest | Form validation, schema-driven |
| **HTTP Client** | Axios | Latest | API calls with interceptors for auth |
| **Accessibility** | axe-core (dev), manual audit | — | WCAG 2.1 AA, Section 508 |
| **Typography** | Inter | — | UI text font (Google Fonts / self-hosted) |
| **Monospace Font** | JetBrains Mono | — | IDs, codes, monospaced values |
| **XSS Sanitization** | DOMPurify | Latest | Sanitize ts_headline HTML before render |
| **Backend Framework** | Spring Boot | 3.x (Java 21) | REST API, embedded Tomcat server |
| **Build** | Maven | 3.9.x | Dependency management, build lifecycle |
| **Java Version** | Java (Temurin/OpenJDK) | 21 LTS | Language version for Spring Boot 3.x |
| **Data Access** | Spring Data JPA | 3.x | Repository pattern over Hibernate |
| **ORM** | Hibernate | 6.x | JPA implementation; managed by Spring Boot |
| **DTO Mapping** | MapStruct | 1.6.x | Compile-time Entity ↔ DTO mapping |
| **Security** | Spring Security | 6.x | JWT filter chain, LDAP, CAS integration |
| **JWT** | JJWT (io.jsonwebtoken) | 0.12.x | JWT sign, parse, validate (HS256) |
| **LDAP** | Spring Security LDAP | 3.x | LDAP bind authentication |
| **CAS** | Spring Security CAS | 3.x | CAS service ticket validation |
| **OpenAPI Docs** | springdoc-openapi | 2.x | Auto-generated OpenAPI 3.0 spec + Swagger UI |
| **Database Migrations** | Flyway | 10.x | Versioned SQL migration scripts |
| **Database** | PostgreSQL | 16 | Relational store, FTS, POINT geometry |
| **Connection Pool** | HikariCP | 5.x (bundled) | High-performance JDBC connection pool |
| **Email** | Spring JavaMailSender | 3.x | SMTP email delivery (action notifications) |
| **Validation** | Hibernate Validator (Bean Validation) | 8.x | @Valid on request DTOs |
| **Image Thumbnails** | Thumbnailator | 0.4.x | 150×150 thumbnail generation |
| **JSON** | Jackson | 2.x (bundled) | JSON serialization/deserialization |
| **XML (Open311)** | JAXB / Jackson XML | — | XML serialization for Open311 XML responses |
| **Test (Backend)** | JUnit 5, Mockito, Spring Boot Test | — | Unit and integration testing |
| **Test (Frontend)** | Vitest, React Testing Library | — | Component and hook testing |
| **Container** | Docker | Latest | Application containerization |
| **Orchestration** | Docker Compose | v2 | Multi-container local + production deployment |
| **Web Server** | Nginx (Alpine) | Latest | Static SPA serving + reverse proxy |
| **Logging** | SLF4J + Logback | 1.5.x | Structured JSON logging in production |

---

### 6.2 Spring Boot `pom.xml` Key Dependencies

```xml
<!-- Core Spring Boot parent -->
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.3.x</version>
</parent>

<dependencies>
  <!-- Web -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>

  <!-- Data JPA + PostgreSQL -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
  </dependency>

  <!-- Security -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-ldap</artifactId>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.x</version>
  </dependency>

  <!-- Validation -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>

  <!-- Flyway -->
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
  </dependency>
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
  </dependency>

  <!-- MapStruct -->
  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.6.x</version>
  </dependency>

  <!-- OpenAPI / Swagger -->
  <dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.x.x</version>
  </dependency>

  <!-- Email -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
  </dependency>

  <!-- Thumbnailator for image thumbnails -->
  <dependency>
    <groupId>net.coobird</groupId>
    <artifactId>thumbnailator</artifactId>
    <version>0.4.x</version>
  </dependency>
</dependencies>
```

---

### 6.3 Frontend `package.json` Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.x.x",
    "framer-motion": "^11.x.x",
    "axios": "^1.x.x",
    "@tanstack/react-query": "^5.x.x",
    "react-hook-form": "^7.x.x",
    "zod": "^3.x.x",
    "@hookform/resolvers": "^3.x.x",
    "recharts": "^2.x.x",
    "mapbox-gl": "^3.x.x",
    "react-map-gl": "^7.x.x",
    "leaflet": "^1.x.x",
    "react-leaflet": "^4.x.x",
    "dompurify": "^3.x.x",
    "clsx": "^2.x.x",
    "tailwind-merge": "^2.x.x",
    "lucide-react": "^0.x.x"
  },
  "devDependencies": {
    "vite": "^5.x.x",
    "@vitejs/plugin-react": "^4.x.x",
    "tailwindcss": "^3.x.x",
    "autoprefixer": "^10.x.x",
    "postcss": "^8.x.x",
    "typescript": "^5.x.x",
    "vitest": "^1.x.x",
    "@testing-library/react": "^15.x.x",
    "@axe-core/react": "^4.x.x"
  }
}
```

---

### 6.4 application.yml Configuration Reference

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/ureport
    username: ${DB_USER:ureport}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  jpa:
    hibernate:
      ddl-auto: validate           # Flyway manages schema; Hibernate only validates
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false     # false for fresh installs; true for first-time migration of existing DB

  mail:
    host: ${SMTP_HOST:localhost}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USER:}
    password: ${SMTP_PASSWORD:}
    properties.mail.smtp.auth: true
    properties.mail.smtp.starttls.enable: true

jwt:
  secret: ${JWT_SECRET}            # Min 256 bits; required env var
  expiry-seconds: ${JWT_EXPIRY:28800}  # 8 hours
  issuer: ureport

ldap:
  enabled: ${LDAP_ENABLED:false}
  url: ${LDAP_URL:ldap://localhost:389}
  base-dn: ${LDAP_BASE_DN:dc=city,dc=gov}
  user-dn-pattern: uid={0},ou=people

cas:
  enabled: ${CAS_ENABLED:false}
  server-url: ${CAS_SERVER_URL:https://cas.city.gov}
  service-url: ${CAS_SERVICE_URL:https://ureport.city.gov}

media:
  root: ${MEDIA_ROOT:/var/ureport/media}
  max-file-size-bytes: 10485760    # 10 MB

open311:
  obsolete-api-keys: ${OBSOLETE_API_KEYS:}

geocode:
  mapbox-token: ${MAPBOX_TOKEN:}
  nominatim-url: ${NOMINATIM_URL:https://nominatim.openstreetmap.org}

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
```

---

### 6.5 Flyway Migration File Inventory

| Migration File | Description |
|---|---|
| `V1__initial_schema.sql` | All 18 tables migrated from MySQL; initial PostgreSQL DDL |
| `V2__search_vector.sql` | Add `search_vector` tsvector column to `tickets`; GIN index; trigger |
| `V3__seed_data.sql` | Seed: contact_methods, substatus, actions, issue_types, category_groups |
| `V4__data_migration.sql` | One-time import from MySQL dump (column name rename mappings) |

Future schema changes: `V5__*.sql`, `V6__*.sql`, etc. — never modify existing migration files.

---
