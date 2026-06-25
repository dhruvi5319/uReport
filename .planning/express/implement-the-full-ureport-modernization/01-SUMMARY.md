---
phase: implement-the-full-ureport-modernization
plan: "01"
subsystem: database
tags: [postgresql, postgis, schema, ddl, seed-data, fts, geography]
dependency_graph:
  requires: []
  provides:
    - db/init/01-extensions.sql
    - db/init/02-schema.sql
    - db/init/03-seed.sql
  affects:
    - All Wave 2a–2d backend plans (02–05)
    - All Wave 3a–3c frontend plans (06–08)
    - Wave 4 integration plan (09)
tech_stack:
  added:
    - PostgreSQL 16
    - PostGIS 3.4 (postgis extension)
    - pgcrypto (UUID generation)
  patterns:
    - GEOGRAPHY(POINT, 4326) for geospatial columns
    - TSVECTOR + GIN index for full-text search
    - Trigger-based FTS population (tickets_fts_update)
    - Trigger-based geo_point sync (tickets_geo_sync)
    - Circular FK resolved via ALTER TABLE after both tables exist
    - BIGSERIAL PKs for high-volume tables (tickets, ticketHistory, media)
    - UUID PK via gen_random_uuid() for refresh_tokens
key_files:
  created:
    - db/init/01-extensions.sql
    - db/init/02-schema.sql
    - db/init/03-seed.sql
  modified: []
decisions:
  - "Followed spec's actual 25-table DDL content (token_blacklist is table 25), not the frontmatter's '24 tables' count — the spec body is authoritative"
  - "Seed data uses explicit IDs and setval() resets to ensure stable system IDs that backend services reference by integer value"
metrics:
  duration: "~2 minutes"
  completed: "2026-06-24T19:27:14Z"
  tasks_completed: 3
  files_created: 3
  commits: 3
---

# Phase implement-the-full-ureport-modernization Plan 01: PostgreSQL 16 Schema Foundation Summary

## One-liner

Complete PostgreSQL 16 database schema with 25 tables, PostGIS geography columns, FTS trigger (trig_tickets_fts), geo-sync trigger (trig_tickets_geo), and seed data for 4 contactMethods, 6 issueTypes, 4 substatuses, and 10 actions.

## What Was Built

Three SQL init scripts that are consumed by the `postgis/postgis:16-3.4` Docker container via `./db/init:/docker-entrypoint-initdb.d` volume mount. These scripts are the universal foundation for all 9 subsequent build waves.

### Files Created

| File | Size | Purpose |
|------|------|---------|
| `db/init/01-extensions.sql` | 81 bytes | Enable postgis + pgcrypto extensions |
| `db/init/02-schema.sql` | 20.9 KB | All 25 tables + triggers + all indexes |
| `db/init/03-seed.sql` | 2.6 KB | Seed rows for 4 system lookup tables |

### Tables Created (25 total)

| # | Table | Key Columns / Notes |
|---|-------|---------------------|
| 1 | contactMethods | id SERIAL, name, isSystem |
| 2 | departments | id SERIAL, name, defaultPerson_id (FK via ALTER TABLE) |
| 3 | people | id SERIAL, role CHECK('staff','public','anonymous'), username UNIQUE |
| 4 | peopleEmails | person_id FK, email, usedForNotifications |
| 5 | peoplePhones | person_id FK, number, label |
| 6 | peopleAddresses | person_id FK, address, city, state, zip, label |
| 7 | clients | api_key_hash, api_key_lookup UNIQUE |
| 8 | substatus | status CHECK('open','closed'), isDefault, isSystem |
| 9 | categoryGroups | name, ordering |
| 10 | categories | customFields JSONB, slaDays, autoCloseIsActive, displayPermissionLevel |
| 11 | actions | type CHECK('system','department'), template, replyEmail |
| 12 | category_action_responses | UNIQUE(category_id, action_id) |
| 13 | department_actions | Composite PK (department_id, action_id) |
| 14 | department_categories | Composite PK (department_id, category_id) |
| 15 | issueTypes | name UNIQUE, isSystem |
| 16 | locations | geo_point GEOGRAPHY(POINT,4326), GIST index |
| 17 | tickets | BIGSERIAL PK, search_vector TSVECTOR, geo_point GEOGRAPHY(POINT,4326) |
| 18 | ticketHistory | BIGSERIAL PK, sentNotifications TEXT, actionDate |
| 19 | media | BIGSERIAL PK, internalFilename UNIQUE |
| 20 | bookmarks | person_id FK, requestUri VARCHAR(2048) |
| 21 | geoclusters | level SMALLINT CHECK(0-6), center GEOGRAPHY(POINT,4326) |
| 22 | ticket_geodata | ticket_id PK, cluster_id_0..6 FKs to geoclusters |
| 23 | responseTemplates | name, template, action_id FK |
| 24 | refresh_tokens | id UUID DEFAULT gen_random_uuid(), expiresAt, revoked |
| 25 | token_blacklist | jti VARCHAR(36) PK, expiresAt |

### Triggers

| Trigger | Function | Fires On | Purpose |
|---------|----------|----------|---------|
| `trig_tickets_fts` | `tickets_fts_update()` | BEFORE INSERT OR UPDATE ON tickets | Populates `search_vector` TSVECTOR from description(A), location(B), city(C), zip(D) with weighted to_tsvector |
| `trig_tickets_geo` | `tickets_geo_sync()` | BEFORE INSERT OR UPDATE ON tickets | Auto-syncs `geo_point` GEOGRAPHY from latitude/longitude via ST_MakePoint() |

### Extensions

| Extension | Purpose |
|-----------|---------|
| postgis | GEOGRAPHY columns, ST_MakePoint(), ST_DWithin(), GIST spatial indexes |
| pgcrypto | gen_random_uuid() for refresh_tokens.id UUID PK |

### Seed Data

| Table | Rows | IDs | Notes |
|-------|------|-----|-------|
| contactMethods | 4 | 1–4 | Email, Phone, Web Form, Other |
| issueTypes | 6 | 1–6 | Comment, Complaint, Question, Report, Request, Violation |
| substatus | 4 | 1–4 | Open(open/default), Resolved(closed/default), Duplicate(closed), Bogus(closed) |
| actions | 10 | 1–10 | open, assignment, closed, changeCategory, changeLocation, response, duplicate, update, comment, upload_media |

All sequences reset via `setval()` to ensure correct auto-increment starting points.

## Commits

| Hash | Task | Description |
|------|------|-------------|
| b56f50e | Task 1 | Create db/init directory and extension script |
| f2078c3 | Task 2 | Write complete PostgreSQL schema DDL |
| d205e02 | Task 3 | Write seed data SQL for system lookup tables |

## Deviations from Plan

### Spec Inconsistency (Auto-resolved)

**1. [Rule 1 - Spec inconsistency] Plan frontmatter says "24 tables" but DDL body specifies 25**
- **Found during:** Task 2
- **Issue:** Plan frontmatter (`must_haves.truths`) states "All 24 tables exist" but the actual DDL content in Task 2's `<action>` block explicitly defines 25 tables with section headers numbered 1–25, ending at `token_blacklist` labeled as "25. token_blacklist"
- **Fix:** Implemented all 25 tables as specified in the DDL content body, which is authoritative (the frontmatter count was an off-by-one). The `integration_contracts.provides.verify` commands pass for all critical tables.
- **Files modified:** db/init/02-schema.sql
- **Commit:** f2078c3

## Integration Contracts

### Verified: db/init/02-schema.sql
```
✓ CREATE TABLE tickets — line 248
✓ search_vector TSVECTOR — line 276
✓ trig_tickets_fts — line 307
✓ trig_tickets_geo — line 323
✓ GEOGRAPHY(POINT — lines 239, 264, 384
✓ token_blacklist — line 441
CONTRACT_OK
```

### Verified: db/init/03-seed.sql
```
✓ INSERT INTO contactMethods — line 7
✓ INSERT INTO issueTypes — line 15
✓ INSERT INTO substatus — line 25
✓ INSERT INTO actions — line 33
CONTRACT_OK
```

## Self-Check: PASSED

Files verified:
- ✓ db/init/01-extensions.sql exists
- ✓ db/init/02-schema.sql exists (25 CREATE TABLE statements)
- ✓ db/init/03-seed.sql exists (4 setval calls)

Commits verified:
- ✓ b56f50e exists
- ✓ f2078c3 exists
- ✓ d205e02 exists
