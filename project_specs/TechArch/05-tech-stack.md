## 6. Technology Stack

### 6.1 Backend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Language | PHP | 8.5 | API layer + Open311 controllers |
| HTTP Server | Apache httpd | 2.4 | Reverse proxy, SSL termination, static files |
| PHP Process Manager | PHP-FPM | 8.5 | FastCGI process management |
| Autoloading | Composer (PSR-4) | 2.x | Dependency management |
| Database driver | PDO + PDO_MySQL | bundled | Parameterized queries |
| DB migration | Phinx | ^1.4 | Versioned MySQL schema migrations |
| OIDC client | facile-it/php-openid-client | ^3.x | OIDC authorization code flow |
| JWT library | firebase/php-jwt | ^6.x | Session JWT issuance/validation |
| Mailer | PHPMailer | ^6.x | SMTP email dispatch |
| HTTP client | Guzzle | ^7.x | Solr + geocoding + OIDC token requests |
| Logging | monolog/monolog | ^3.x | Structured logging + Graylog GELF handler |
| Code analysis | phpstan/phpstan | ^1.x | Static analysis at level 8+ |
| Testing | PHPUnit | ^11.x | Unit + integration tests |
| i18n | GNU gettext | system | `.po`/`.mo` locale files |

### 6.2 Frontend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 15.x (App Router) | SSR/SSG + client-side SPA |
| Language | TypeScript | 5.x | Strict type safety |
| Runtime | Node.js | 20 LTS | Next.js production server |
| Process manager | PM2 | ^5.x | Next.js production process management |
| UI primitives | Radix UI / shadcn/ui | latest | Accessible, unstyled component library |
| Styling | Tailwind CSS | ^3.x | Utility-first CSS |
| Map | Leaflet + react-leaflet | ^4.x | Interactive ticket maps + clusters |
| Forms / validation | React Hook Form + Zod | ^7.x / ^3.x | Form state + schema validation |
| API types | openapi-typescript | ^6.x | Auto-generated TypeScript types from OpenAPI spec |
| API client | openapi-fetch | ^0.x | Type-safe fetch wrapper |
| i18n | next-intl | ^3.x | Gettext-compatible message catalogs |
| Testing (unit) | Jest + Testing Library | ^29.x | Component and utility unit tests |
| Testing (e2e) | Playwright | ^1.x | End-to-end critical user journey tests |
| Accessibility | axe-core + jest-axe | ^4.x | WCAG 2.1 AA automated audits in CI |
| Build | Next.js built-in (Webpack/Turbopack) | — | Asset optimization + HMR |

### 6.3 Data & Search

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Primary database | MySQL | 8.x | Relational data store |
| Full-text search | Apache Solr | 9.x | Full-text + geospatial clustering |
| Cache (optional) | Redis | 7.x | SLA metrics cache + geocode cache |

### 6.4 Infrastructure & DevOps

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Containerization | Docker + Docker Compose | 24.x / 2.x | Local development stack |
| Provisioning | Ansible | 2.x | Production deployment automation |
| CI/CD | GitHub Actions | — | Automated test + quality gates |
| Logging aggregation | Graylog | 5.x | Centralized structured log ingestion |
| Secret management | site_config.php constants | — | Per-deployment config (excluded from VCS) |

### 6.5 CI/CD Pipeline (GitHub Actions)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Pull Request → main                         │
│                                                                 │
│  Job: lint-php                                                  │
│  ├── composer install                                           │
│  ├── php-cs-fixer --dry-run                                     │
│  └── phpstan analyse --level=8                                  │
│                                                                 │
│  Job: test-php                                                  │
│  ├── docker compose up -d db solr                               │
│  ├── phinx migrate (test DB)                                    │
│  └── phpunit --coverage-clover=coverage.xml (≥70% required)    │
│                                                                 │
│  Job: lint-frontend                                             │
│  ├── npm ci                                                     │
│  ├── tsc --noEmit (strict mode)                                 │
│  └── next lint                                                  │
│                                                                 │
│  Job: test-frontend                                             │
│  └── jest --coverage                                            │
│                                                                 │
│  Job: e2e                                                       │
│  ├── docker compose up -d (full stack)                          │
│  └── playwright test (all 10 critical journeys)                 │
│                                                                 │
│  Job: license-check                                             │
│  └── license-checker (fail on GPL-incompatible)                 │
│                                                                 │
│  Job: security-audit                                            │
│  ├── composer audit                                             │
│  └── npm audit                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 Docker Compose Dev Stack

```yaml
# docker-compose.yml (summary)
services:
  app:
    image: php:8.5-fpm-apache
    volumes:
      - .:/var/www/html
    environment:
      - SITE_CONFIG=/var/www/html/site_config.php
    ports:
      - "80:80"

  frontend:
    image: node:20-alpine
    command: npm run dev
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost/api

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ureport
      MYSQL_ROOT_PASSWORD: secret
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

  solr:
    image: solr:9-slim
    ports:
      - "8983:8983"
    volumes:
      - ./solr/configsets:/opt/solr/server/solr/configsets
    command: solr-precreate ureport

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  db_data:
```

### 6.7 Key Configuration Constants (site_config.php)

| Constant | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `https://ureport.city.gov` |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` | MySQL connection | — |
| `SOLR_URL` | Solr base URL | `http://solr:8983/solr/ureport` |
| `SOLR_TIMEOUT` | Solr request timeout (s) | `5` |
| `OIDC_ISSUER` | OIDC provider issuer URL | `https://sso.city.gov/` |
| `OIDC_CLIENT_ID` | OIDC client ID | — |
| `OIDC_CLIENT_SECRET` | OIDC client secret | — |
| `OIDC_REDIRECT_URI` | OIDC callback URL | `{BASE_URL}/auth/callback` |
| `SESSION_TTL` | JWT session lifetime (s) | `28800` |
| `JWT_SECRET` | HMAC-SHA256 signing key | ≥32 random bytes |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP config | — |
| `SMTP_TLS` | Use STARTTLS | `true` |
| `SMTP_FROM_ADDRESS` | Email from address | `noreply@city.gov` |
| `SMTP_FROM_NAME` | Email from name | `City uReport` |
| `ADDRESS_SERVICE_TYPE` | Geocoding provider | `google` \| `nominatim` \| `none` |
| `ADDRESS_SERVICE_URL` | Geocoding API base URL | — |
| `ADDRESS_SERVICE_KEY` | Geocoding API key | — |
| `GRAYLOG_HOST` | Graylog GELF host | `logs.city.gov` |
| `GRAYLOG_PORT` | Graylog GELF port | `12201` |
| `GRAYLOG_ENABLED` | Enable Graylog (bool) | `true` |
| `LOCALE` | Application locale | `en_US` |
| `UPLOAD_ROOT` | File upload directory | `/var/uploads/ureport` |
| `MAX_UPLOAD_SIZE` | Max file size (bytes) | `10485760` |

---
