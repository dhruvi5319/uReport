# Technical Architecture Document
# uReport — Municipal CRM Modernization

**Project:** uReport  
**Acronym:** uReport  
**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Active  
**License:** AGPL-3.0  
**Based on:** PRD-uReport.md v1.0 · FRD-uReport.md v1.0

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Model](#3-data-model)
4. [API Design](#4-api-design)
5. [Security Architecture](#5-security-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Integration Points](#7-integration-points)

---

## 1. Architectural Overview

### 1.1 Architecture Pattern

uReport uses a **Decoupled Monolith** architecture: a single PHP 8.5 application serves both the preserved Open311 GeoReport v2 endpoint and a new RESTful JSON API backend, while a separate Next.js 15 SPA constitutes the frontend. This is a **brownfield incremental modernization** — not a rewrite. The existing MySQL schema, Apache Solr integration, OIDC authentication, Graylog logging, and GNU gettext i18n are all preserved.

**Key architectural decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend language | PHP 8.5 (thin controllers) | Avoids operational complexity of a second runtime; domain models preserved |
| Frontend | Next.js 15 (App Router) + TypeScript | SSR for public routes; SPA for staff UI; type-safe API contract via openapi-typescript |
| API style | REST at `/api/v1/` (new) + Open311 at `/open311/` (preserved) | Open311 endpoint frozen; internal API follows REST conventions |
| DB access | Repository pattern over PDO | Testable, typed; no full ORM overhead; existing schema preserved |
| Search | Apache Solr 9.x (preserved) | Proven geo-clustering and full-text; abstracted behind `SearchService` |
| Auth | OIDC authorization code flow → uReport session JWT | Staff SSO via city IdP; JWT in HttpOnly cookie for SPA |
| Deployment | Apache + Linux, Docker Compose, Ansible | Existing operators unchanged |

### 1.2 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL CLIENTS                                │
│                                                                              │
│  ┌───────────────────┐  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │  Browser (Staff / │  │  Open311 Mobile Apps │  │  External Dashboards   │ │
│  │  Citizen SPA)     │  │  & 3rd-party clients │  │  (SLA metrics API)     │ │
│  └─────────┬─────────┘  └──────────┬──────────┘  └──────────┬─────────────┘ │
└────────────┼────────────────────────┼────────────────────────┼──────────────┘
             │ HTTPS                  │ HTTPS                  │ HTTPS
             │                        │                        │
┌────────────▼────────────────────────▼────────────────────────▼──────────────┐
│                           Apache 2.4 + mod_proxy                             │
│           (SSL termination · HTTP security headers · CORS)                  │
│                                                                              │
│   /                  →  Next.js 15 (Node.js, port 3000)                     │
│   /api/              →  PHP 8.5 API layer (FPM, port 9000)                  │
│   /open311/          →  PHP 8.5 Open311 controller (FPM, port 9000)         │
│   /auth/             →  PHP 8.5 OIDC controller  (FPM, port 9000)          │
└──────────────────────────────────────────────────────────────────────────────┘
             │                        │
     ┌───────▼───────┐        ┌───────▼───────┐
     │  Next.js 15   │        │  PHP 8.5 API  │
     │  App Router   │        │  Application  │
     │               │        │               │
     │ ┌───────────┐ │        │ ┌───────────┐ │
     │ │  Pages /  │ │        │ │Controllers│ │
     │ │  Layouts  │ │        │ │(thin)     │ │
     │ └───────────┘ │        │ └─────┬─────┘ │
     │ ┌───────────┐ │        │       │       │
     │ │  API      │ │        │ ┌─────▼─────┐ │
     │ │  Routes   │ │        │ │Repository │ │
     │ │  (/auth/) │ │        │ │  Layer    │ │
     │ └─────┬─────┘ │        │ └─────┬─────┘ │
     └───────┼───────┘        └───────┼───────┘
             │  JSON/REST              │
             └────────────────────────┘
                      │  │  │
          ┌───────────┘  │  └─────────────────┐
          │              │                     │
  ┌───────▼──────┐  ┌────▼─────────┐  ┌───────▼──────────┐
  │  MySQL 8.x   │  │  Apache Solr │  │  Redis (optional) │
  │  (primary    │  │  9.x         │  │  (geocode cache / │
  │   datastore) │  │  (search +   │  │   metrics cache)  │
  │              │  │   geo-cluster│  │                   │
  └──────────────┘  └──────────────┘  └───────────────────┘
          │
  ┌───────▼──────────────────────────────────────────────┐
  │              External Services                        │
  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
  │  │  OIDC IdP    │  │  Geocoding   │  │  Graylog   │  │
  │  │  (Keycloak / │  │  Service     │  │  (GELF UDP)│  │
  │  │   Auth0/SSO) │  │  (Google /   │  │            │  │
  │  │              │  │   Nominatim) │  │            │  │
  │  └──────────────┘  └──────────────┘  └────────────┘  │
  └──────────────────────────────────────────────────────┘
```

### 1.3 Deployment Topology

#### Docker Compose (Development)

```
docker-compose.yml services:
  app         → PHP 8.5-FPM + Apache 2.4 (port 80)
  frontend    → Next.js 15 dev server (port 3000, proxied via Apache)
  db          → MySQL 8.x (port 3306)
  solr        → Apache Solr 9.x (port 8983)
  mailhog     → SMTP catch-all (port 1025 / UI 8025)
```

#### Production: Apache + Linux

```
┌─────────────────────────────────────────────────────────────┐
│  Linux host (Ubuntu 22.04+ / Debian 12+)                    │
│                                                             │
│  Apache 2.4                                                 │
│  ├── VirtualHost:443 (SSL, mod_ssl)                        │
│  │   ├── ProxyPass /api/ → php-fpm:9000 (via mod_proxy_fcgi│
│  │   ├── ProxyPass /open311/ → php-fpm:9000               │
│  │   ├── ProxyPass /auth/ → php-fpm:9000                  │
│  │   └── ProxyPass / → node:3000 (Next.js SSR)            │
│                                                             │
│  PHP 8.5-FPM (systemd)                                      │
│  Node.js 20 LTS + PM2 (Next.js production build)           │
│  MySQL 8.x (local or RDS)                                  │
│  Apache Solr 9.x (local or dedicated)                      │
└─────────────────────────────────────────────────────────────┘
```

#### Ansible

Ansible playbooks provision and configure all services above. No changes required to the existing playbook structure; new roles for `nodejs` and `nextjs` deployment added.

### 1.4 URL Routing Contract

| Path Prefix | Handler | Notes |
|-------------|---------|-------|
| `/open311/` | PHP 8.5 (preserved verbatim) | GeoReport v2; must not change |
| `/auth/` | PHP 8.5 OIDC controller | Login, callback, logout, me |
| `/api/` | PHP 8.5 REST API controllers | New JSON API layer |
| `/api/docs` | PHP Swagger UI | OpenAPI 3.1 spec viewer |
| `/api/openapi.json` | PHP | Raw OpenAPI 3.1 JSON |
| `/uploads/` | Apache static | File attachment serving |
| `/` (all others) | Next.js 15 (Node) | SPA + SSR pages |

---
