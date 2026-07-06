# Technical Architecture Document — uReport CRM Modernization

**Project:** UReport  
**Acronym:** UReport  
**Version:** 1.0  
**Date:** 2026-07-06  
**Status:** Active  
**Classification:** Internal — Engineering  
**Depends On:** PRD-UReport.md v1.0, FRD-UReport.md v1.0

---

## 1. Architectural Overview

### Pattern

uReport uses a **three-tier SPA + REST API** architecture. The React single-page application communicates exclusively with the Spring Boot JSON/XML REST API. The API owns all business logic and data access. PostgreSQL is the sole persistence store. There are no server-rendered views in the new stack — all rendering is client-side in React.

The Open311 / GeoReport v2 API is implemented as a set of **content-negotiated controllers** in the same Spring Boot application. They share the same service and repository layers as the internal CRM API but apply Open311-specific serialization (GeoReport v2 JSON/XML field names). This avoids a separate service while preserving the frozen contract.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  React SPA (Nginx-served static bundle)                      │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │   │
│  │  │ Auth Shell   │  │ Case Mgmt   │  │ Admin Panels     │   │   │
│  │  │ Login/CAS    │  │ List/Detail │  │ People/Dept/Cat  │   │   │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘   │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │   │
│  │  │ Dashboard    │  │ Public Form │  │ Metrics/Reports  │   │   │
│  │  │ Map/Charts   │  │ Wizard/Map  │  │ Recharts/Tables  │   │   │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘   │   │
│  │                                                              │   │
│  │  Tailwind CSS + shadcn/ui + Framer Motion + Mapbox/Leaflet   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS (JWT in httpOnly cookie)
┌──────────────────────────────▼──────────────────────────────────────┐
│                        API TIER                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Spring Boot 3.x (Embedded Tomcat)                           │   │
│  │                                                              │   │
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │ Open311 Controllers │  │ Internal CRM Controllers     │  │   │
│  │  │  /open311/v2/*      │  │  /api/tickets                │  │   │
│  │  │  JSON + XML + HTML  │  │  /api/people                 │  │   │
│  │  │  Content-negotiated │  │  /api/departments            │  │   │
│  │  └─────────────────────┘  │  /api/categories             │  │   │
│  │                           │  /api/dashboard              │  │   │
│  │  ┌─────────────────────┐  │  /api/auth                   │  │   │
│  │  │ Auth Controllers    │  │  /api/media                  │  │   │
│  │  │  /auth/cas/callback │  └──────────────────────────────┘  │   │
│  │  │  /api/auth/ldap     │                                     │   │
│  │  │  /api/auth/refresh  │  ┌──────────────────────────────┐  │   │
│  │  └─────────────────────┘  │ Service Layer                │  │   │
│  │                           │  TicketService               │  │   │
│  │  ┌─────────────────────┐  │  PeopleService               │  │   │
│  │  │ Spring Security     │  │  CategoryService             │  │   │
│  │  │  JWT Filter Chain   │  │  MediaService                │  │   │
│  │  │  LDAP Provider      │  │  NotificationService (SMTP)  │  │   │
│  │  │  CAS Provider       │  │  SearchService (tsvector)    │  │   │
│  │  └─────────────────────┘  └──────────────────────────────┘  │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │ Repository Layer (Spring Data JPA + MapStruct DTOs)  │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ JDBC (HikariCP connection pool)
┌──────────────────────────────▼──────────────────────────────────────┐
│                       DATA TIER                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 16                                               │   │
│  │                                                              │   │
│  │  18 tables + tsvector/GIN index + spatial support            │   │
│  │  Flyway versioned migrations (V1__initial_schema.sql, ...)   │   │
│  │  File storage: /var/ureport/media/{ticket_id}/{filename}     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Deployment Topology (Docker Compose)

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose Host (Single Server)                 │
│                                                      │
│  ┌────────────────────┐   ┌───────────────────────┐ │
│  │  nginx:alpine      │   │  openjdk:21-jre-slim  │ │
│  │  Container: web    │   │  Container: api        │ │
│  │  Port: 80 → 443    │──▶│  Port: 8080 (internal)│ │
│  │  Serves React SPA  │   │  Spring Boot app.jar   │ │
│  │  Proxy /api, /open │   │  SMTP: JavaMailSender  │ │
│  │  /auth → api:8080  │   └──────────┬────────────┘ │
│  └────────────────────┘              │               │
│                                      │ JDBC 5432     │
│  ┌───────────────────────────────────▼─────────────┐ │
│  │  postgres:16-alpine                              │ │
│  │  Container: db                                   │ │
│  │  Port: 5432 (internal only)                      │ │
│  │  Volume: postgres_data                           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  Volumes:                                            │
│    postgres_data   → /var/lib/postgresql/data        │
│    media_files     → /var/ureport/media              │
│    (shared: api + nginx for media serving)           │
└─────────────────────────────────────────────────────┘
```

**Nginx responsibilities:**
- Serve the React SPA static bundle (`build/` output)
- Reverse-proxy `/api/*`, `/open311/*`, `/auth/*`, `/swagger-ui.html`, `/v3/api-docs` to `api:8080`
- Serve media files from the shared volume at `/api/media/*` (optional — can be proxied through Spring Boot)
- Enforce HTTPS (TLS termination)
- SameSite cookie enforcement (HTTPS required for SameSite=Strict)

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Single Spring Boot app for Open311 + internal CRM API | Avoids service mesh complexity; shared domain model; simpler deployment |
| JWT in httpOnly cookie (not Authorization header) | SPA cannot read httpOnly cookie value → XSS cannot steal JWT; CSRF mitigated by SameSite=Strict + CSRF token for state-changing requests |
| PostgreSQL tsvector/tsquery replacing Solr | Eliminates external JVM dependency; single-city data volume fits GIN index comfortably within ≤500 ms P95 budget |
| Content negotiation in Open311 controllers | Preserves byte-compatible responses with PHP implementation; Open311 clients may request XML or JSON |
| Flyway for all schema changes | Reproducible schema bootstrap; GitOps-compatible; mandatory for PostgreSQL migration from MySQL |
| MapStruct for DTO mapping | Compile-time safe; no runtime reflection overhead; generated code is debuggable |
| Docker Compose (not Kubernetes) | Continues existing deployment model; single-server city deployment; out of scope to introduce orchestration |
| File storage on shared volume (not object store) | Preserves existing file path structure from PHP; avoids introducing S3 dependency |

---
