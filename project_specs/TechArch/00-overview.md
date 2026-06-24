# TechArch — uReport Modernization
## Section 00: Architectural Overview

**Project:** uReport CRM — Municipal Constituent Issue Tracking System  
**Version:** 1.0  
**Date:** 2026-06-24  
**Stack:** React 18 + TypeScript → Java 21 (Spring Boot 3.x) → PostgreSQL 16  

---

## Architecture Pattern

uReport uses a **three-tier SPA + REST API + RDBMS** architecture:

1. **Presentation Tier** — React 18 TypeScript SPA (Vite), served as static assets from Nginx
2. **Application Tier** — Java 21 Spring Boot 3.x REST API, containerized in Docker
3. **Data Tier** — PostgreSQL 16 with PostGIS, containerized in Docker

This is a deliberate **clean-cut** from the PHP/Apache/MySQL/Solr monolith. No shared process, no filesystem coupling between tiers. Communication is exclusively over HTTP/JSON (internal API) and binary protocol (JDBC to PostgreSQL).

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Single Spring Boot JAR | Avoids microservice overhead for a single-municipality CRM |
| PostgreSQL FTS (tsvector/tsquery) | Eliminates Solr JVM process; GIN index delivers sub-500ms queries at 500K tickets |
| JWT HS256 with refresh token rotation | Stateless auth compatible with SPA and external API clients |
| PostGIS GEOGRAPHY(POINT, 4326) | Replaces MySQL POINT; enables ST_DWithin radius queries natively |
| Docker Compose single-file deployment | Preserves operator familiarity; same service names and ports |
| Open311 preserved at path boundary | Legacy external consumers hit the same `/open311/*` URLs; zero breaking change |
| Chunked CSV streaming via StreamingResponseBody | Prevents OOM on large exports without pagination |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL CLIENTS                              │
│  ┌──────────────┐   ┌──────────────────┐   ┌───────────────────────┐   │
│  │ Browser (SPA)│   │Open311 Consumers │   │ Mobile / 3rd-Party    │   │
│  │ React 18 /TS │   │(Municipality API)│   │ (api_key auth)        │   │
│  └──────┬───────┘   └────────┬─────────┘   └──────────┬────────────┘   │
└─────────┼────────────────────┼──────────────────────────┼───────────────┘
          │ HTTPS               │ HTTPS                    │ HTTPS
          │ JWT Bearer          │ /open311/* (JSON/XML)    │ api_key param
          ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DOCKER HOST / VPS                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    nginx (port 80/443)                             │ │
│  │   /              → serve React SPA static assets                  │ │
│  │   /api/v1/*      → proxy_pass http://api:8080                     │ │
│  │   /open311/*     → proxy_pass http://api:8080                     │ │
│  │   /callback      → proxy_pass http://api:8080                     │ │
│  └─────────────────────────────┬──────────────────────────────────────┘ │
│                                 │                                        │
│  ┌──────────────────────────────▼──────────────────────────────────────┐ │
│  │              Spring Boot API (api:8080)                             │ │
│  │                                                                     │ │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │ │
│  │  │  JwtAuthFilter  │  │ ApiKeyAuthFilter  │  │ SecurityConfig   │  │ │
│  │  └────────┬────────┘  └────────┬─────────┘  └──────────────────┘  │ │
│  │           │                    │                                    │ │
│  │  ┌────────▼────────────────────▼───────────────────────────────┐   │ │
│  │  │                  REST Controllers                            │   │ │
│  │  │  AuthController  TicketController  Open311Controller        │   │ │
│  │  │  PeopleController  CategoryController  MediaController      │   │ │
│  │  │  SearchController  MetricsController  AdminController       │   │ │
│  │  └─────────────────────────────┬───────────────────────────────┘   │ │
│  │                                 │                                    │ │
│  │  ┌──────────────────────────────▼──────────────────────────────┐   │ │
│  │  │                    Service Layer                             │   │ │
│  │  │  TicketService  TicketHistoryService  NotificationService   │   │ │
│  │  │  SearchService  GeoClusterScheduler  AutoCloseScheduler     │   │ │
│  │  │  MediaService   AuthService   Open311MappingService         │   │ │
│  │  └─────────────────────────────┬───────────────────────────────┘   │ │
│  │                                 │                                    │ │
│  │  ┌──────────────────────────────▼──────────────────────────────┐   │ │
│  │  │              Repository Layer (Spring Data JPA)              │   │ │
│  │  │  TicketRepository  PersonRepository  CategoryRepository     │   │ │
│  │  │  HistoryRepository  MediaRepository  GeoClusterRepository   │   │ │
│  │  └─────────────────────────────┬───────────────────────────────┘   │ │
│  └─────────────────────────────────┼───────────────────────────────────┘ │
│                                    │ JDBC (HikariCP)                      │
│  ┌─────────────────────────────────▼──────────────────────────────────┐  │
│  │          PostgreSQL 16 + PostGIS (db:5432)                          │  │
│  │                                                                      │  │
│  │  Schemas: tickets, ticketHistory, people, categories, actions ...   │  │
│  │  Extensions: postgis, pgcrypto                                       │  │
│  │  FTS: tsvector column + GIN index on tickets                         │  │
│  │  Geo: GEOGRAPHY(POINT,4326) + GIST index on tickets + locations      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │   Docker Volumes                                                │   │
│  │   pgdata  → PostgreSQL data                                     │   │
│  │   media   → /app/media (uploaded files + thumbnails)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Topology

The system runs as four Docker containers orchestrated by `docker-compose.yml`:

| Service | Image | Port | Role |
|---------|-------|------|------|
| `db` | `postgis/postgis:16-3.4` | 5432 (internal) | PostgreSQL 16 + PostGIS |
| `api` | Custom Java 21 image | 8080 (internal) | Spring Boot REST API |
| `web` | Custom Nginx + React build | 80 / 443 | Static SPA + reverse proxy |
| *(optional)* `mailhog` | `mailhog/mailhog` | 8025 | SMTP dev/testing relay |

### docker-compose.yml (reference)

```yaml
version: '3.9'

services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: ureport
      POSTGRES_USER: ureport
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"      # expose for local dev; close in prod
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ureport"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./api
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/ureport
      SPRING_DATASOURCE_USERNAME: ureport
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      APP_JWT_SECRET: ${JWT_SECRET}
      APP_JWT_EXPIRY: 3600
      APP_MEDIA_PATH: /app/media
      SPRING_MAIL_HOST: ${MAIL_HOST}
    volumes:
      - media:/app/media
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy

  web:
    build: ./web
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api

volumes:
  pgdata:
  media:
```

---

## Request Flow (Staff Ticket Search)

```
Browser                   Nginx                  API (Spring Boot)          PostgreSQL
  │                         │                          │                         │
  │── GET /api/v1/tickets?q=pothole&status=open ──────>│                         │
  │                         │── proxy_pass ──────────>│                         │
  │                         │                    JwtAuthFilter validates Bearer  │
  │                         │                          │── SELECT tickets WHERE  │
  │                         │                          │   search_vector @@      │
  │                         │                          │   websearch_to_tsquery  │
  │                         │                          │<─ rows ─────────────────│
  │                         │<── 200 JSON ────────────│                         │
  │<── 200 JSON ────────────│                          │                         │
```

---

## Authentication Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                 Authentication Flows                    │
│                                                        │
│  1. Staff Login:                                       │
│     POST /api/v1/auth/login {username, password}       │
│     → BCrypt verify → issue JWT (1h) + refresh (24h)  │
│                                                        │
│  2. Every Authenticated Request:                       │
│     Authorization: Bearer <jwt>                        │
│     → JwtAuthFilter validates signature + expiry       │
│     → checks token_blacklist for jti                   │
│     → sets SecurityContext {personId, role}            │
│                                                        │
│  3. Token Refresh:                                     │
│     POST /api/v1/auth/refresh {refreshToken}           │
│     → revoke old refresh → issue new pair              │
│                                                        │
│  4. Logout:                                            │
│     POST /api/v1/auth/logout {refreshToken}            │
│     → revoke refresh + blacklist access jti            │
│                                                        │
│  5. Open311 API Key:                                   │
│     POST /open311/requests?api_key=xxx                 │
│     → SHA-256(api_key) lookup in clients table         │
│     → BCrypt verify for full match                     │
│     → set ApiKeyPrincipal in SecurityContext           │
└────────────────────────────────────────────────────────┘
```
