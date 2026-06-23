---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: "06"
type: express
subsystem: api-controllers
tags: [people, contact-methods, templates, api-clients, rest, rbac, wave-2b]
implements: [F3, F13, F14]
depends_on: [F16]
enables: [F15]

dependency_graph:
  requires:
    - crm/src/Repositories/PersonRepository.php
    - crm/src/Repositories/ClientRepository.php
    - crm/src/Repositories/TemplateRepository.php
    - crm/src/Domain/Person.php
    - crm/src/Domain/ContactMethod.php
    - crm/src/Domain/Client.php
    - crm/src/Domain/Template.php
  provides:
    - crm/src/Repositories/ContactMethodRepository.php
    - crm/src/Controllers/Api/PersonController.php
    - crm/src/Controllers/Api/ContactMethodController.php
    - crm/src/Controllers/Api/TemplateController.php
    - crm/src/Controllers/Api/ClientController.php
  affects:
    - Wave 3b SPA admin screens: /admin/people, /admin/templates, /admin/clients

tech_stack:
  patterns:
    - Thin controller pattern (no business logic in controllers)
    - Constructor injection of repositories
    - Readonly domain objects for immutability
    - Standard JSON envelope {data, meta, errors} on all responses
    - Soft-deactivation (active=0) instead of hard-delete for people and clients
    - bcrypt (PASSWORD_BCRYPT) for API key hashing; plain key returned only once

key_files:
  created:
    - crm/src/Controllers/Api/PersonController.php
    - crm/src/Controllers/Api/ContactMethodController.php
    - crm/src/Controllers/Api/TemplateController.php
    - crm/src/Controllers/Api/ClientController.php
  modified:
    - crm/src/Repositories/ContactMethodRepository.php

decisions:
  - "ContactMethodRepository.save() does NOT auto-demote primaries internally; controllers call demotePrimariesForPerson() explicitly before save() for clearer intent and separation of concerns"
  - "API key uses bin2hex(random_bytes(16)) = 32 hex chars (128-bit entropy); not UUID format intentionally for stronger key material"
  - "ClientController.deactivate() performs soft-deactivate via save() (sets active=false) rather than calling clientRepo.delete(), keeping consistent with other deactivation patterns in the codebase"
  - "PersonController.update() passes a clean array (not casting Person to array) to validatePersonBody() to avoid readonly property cast issues"
  - "System template protection enforced in controller, not repository, keeping TemplateRepository generic"

metrics:
  completed_date: "2026-06-23"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase modernize-the-ureport-legacy-php-crm-imp Plan 06: Admin Entity Controllers Summary

**One-liner:** Wave 2b REST controllers for People/Contacts (F3), Response Templates (F13), and API Clients (F14) with bcrypt key generation, isPrimary promotion, and system-template protection.

## What Was Built

Five PHP files implementing the admin entity management API layer:

### ContactMethodRepository (expanded)
- Added `demotePrimariesForPerson(int $personId, string $type): void` — explicit public method that sets `isPrimary = 0` for all contact methods of a given type/person before promoting a new primary
- Added `emailExists(string $email, ?int $excludeContactMethodId): bool` — uniqueness check for email type contact methods across all persons
- Preserved existing `findByPersonId`, `findPrimaryEmail`, `save`, `delete` implementations

### PersonController
Endpoints: `GET /api/people`, `POST /api/people`, `GET /api/people/{id}`, `PUT /api/people/{id}`, `DELETE /api/people/{id}`
- List/search with `role`, `departmentId`, `active` filters and pagination (`page`, `perPage`, max 100)
- Detail responses embed `contactMethods[]` array via `serializePersonWithContacts()`
- Validation: `firstName`, `lastName` required on create; `role` must be `admin|staff|public`
- Soft-deactivation on DELETE (delegates to `PersonRepository::delete()` which sets `active = 0`)

### ContactMethodController
Endpoints: `GET /api/people/{id}/contact-methods`, `POST`, `PUT /api/people/{id}/contact-methods/{cmId}`, `DELETE`
- RFC 5322 email validation (`FILTER_VALIDATE_EMAIL`) on create/update
- Duplicate email rejection with `DUPLICATE_EMAIL` error code
- `isPrimary` promotion calls `demotePrimariesForPerson()` before save — ensures only one primary per type per person
- `type` field is immutable after creation (update ignores type changes)
- Validates parent person exists on all sub-resource operations

### TemplateController
Endpoints: `GET /api/templates`, `POST /api/templates`, `GET /api/templates/{id}`, `PUT /api/templates/{id}`, `DELETE /api/templates/{id}`
- System templates (`slug != null`) cannot be deleted — returns 422 with `SYSTEM_TEMPLATE_PROTECTED` error code
- User-created templates always have `slug = null`; slug is immutable once set
- `name` max 255 chars enforced
- `body` field required on create

### ClientController
Endpoints: `GET /api/clients`, `POST /api/clients`, `GET /api/clients/{id}`, `PUT /api/clients/{id}`, `DELETE /api/clients/{id}`, `POST /api/clients/{id}/regenerate-key`
- API key generated with `bin2hex(random_bytes(16))` — 32 hex chars, 128-bit entropy
- Key is bcrypt-hashed (`password_hash($plainKey, PASSWORD_BCRYPT)`) before storage
- `apiKeyHint` = first 8 chars + `…` — safe to display, not reversible
- Full plain `apiKey` returned ONLY on `POST /api/clients` (create) and `POST /api/clients/{id}/regenerate-key`
- `serialize()` never includes `apiKeyHash` — only `apiKeyHint` exposed
- `DELETE` is soft-deactivation (`active = false`); key revocation takes effect immediately via `ClientRepository::findAll(activeOnly: true)` and middleware auth checks

## Contracts Provided for Wave 3b

| Endpoint | Response Shape |
|---|---|
| GET /api/people | `{data: Person[], meta: {page, perPage, total, pages}, errors: []}` |
| GET /api/people/{id} | `{data: Person+contactMethods[], meta: {}, errors: []}` |
| GET /api/people/{id}/contact-methods | `{data: ContactMethod[], meta: {}, errors: []}` |
| POST /api/people/{id}/contact-methods | 201 `{data: ContactMethod, meta: {}, errors: []}` |
| GET /api/templates | `{data: Template[], meta: {total}, errors: []}` |
| DELETE /api/templates/{id} | 422 if `slug != null` (system template) |
| POST /api/clients | 201 `{data: Client+apiKey, meta: {}, errors: []}` — apiKey one-time only |
| GET /api/clients/{id} | `{data: Client (apiKeyHint only), meta: {}, errors: []}` |
| POST /api/clients/{id}/regenerate-key | 200 `{data: Client+apiKey, meta: {}, errors: []}` — new apiKey one-time |

## Commits

| Task | Commit | Files |
|---|---|---|
| Task 1: ContactMethodRepository + PersonController + ContactMethodController | `2fbe380` | `ContactMethodRepository.php` (modified), `PersonController.php`, `ContactMethodController.php` |
| Task 2: TemplateController + ClientController | `ad871a5` | `TemplateController.php`, `ClientController.php` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PersonController.update() validation used unsafe cast**
- **Found during:** Task 1 implementation review
- **Issue:** The plan's `validatePersonBody((array) $updated, isUpdate: true)` would cast a readonly `Person` object to array using PHP internal property names, potentially causing issues with readonly properties and inconsistent key names
- **Fix:** Extracted the fields into a clean array `['firstName' => $updated->firstName, 'lastName' => $updated->lastName, 'role' => $updated->role]` before calling `validatePersonBody()`
- **Files modified:** `crm/src/Controllers/Api/PersonController.php`

### Notes

- PHP binary not available in this execution environment; `php -l` syntax checks could not be run. All code follows the same syntactic patterns as verified existing files in the codebase (e.g., `PersonRepository.php`, `ClientRepository.php`).
- LSP errors in `crm/src/Application/PdoRepository.php` and Test files are pre-existing and out of scope.

## Self-Check: PASSED

Files exist:
- FOUND: crm/src/Repositories/ContactMethodRepository.php
- FOUND: crm/src/Controllers/Api/PersonController.php
- FOUND: crm/src/Controllers/Api/ContactMethodController.php
- FOUND: crm/src/Controllers/Api/TemplateController.php
- FOUND: crm/src/Controllers/Api/ClientController.php

Commits exist:
- FOUND: 2fbe380 (Task 1)
- FOUND: ad871a5 (Task 2)

Key contracts verified:
- ContactMethodRepository: `demotePrimariesForPerson` ✓, `emailExists` ✓
- PersonController: `serializePersonWithContacts` ✓
- ContactMethodController: `DUPLICATE_EMAIL` ✓
- TemplateController: `SYSTEM_TEMPLATE_PROTECTED` ✓
- ClientController: `password_hash(PASSWORD_BCRYPT)` ✓, `random_bytes` ✓, `regenerateKey` ✓, `apiKeyHash` not in serialize() ✓
