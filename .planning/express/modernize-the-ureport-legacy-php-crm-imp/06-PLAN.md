---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 06
type: execute
wave: 2
depends_on: [1]
files_modified:
  - crm/src/Controllers/Api/PersonController.php
  - crm/src/Controllers/Api/ContactMethodController.php
  - crm/src/Controllers/Api/TemplateController.php
  - crm/src/Controllers/Api/ClientController.php
  - crm/src/Repositories/ContactMethodRepository.php
autonomous: true

features:
  implements: ["F3", "F13", "F14"]
  depends_on: ["F16"]
  enables: ["F15"]

must_haves:
  truths:
    - "Staff can list, create, view, update, and deactivate people via REST endpoints"
    - "Admin can add, update, and remove contact methods (email/phone/address) per person; isPrimary promotion demotes existing primary"
    - "Admin can list, create, update, and delete response templates; system templates (slugged) cannot be deleted"
    - "Admin can create API clients and receive the full plain API key once; subsequent reads return apiKeyHint only"
    - "Admin can revoke (deactivate) an API client and regenerate its key (new bcrypt hash + hint; full key returned once)"
    - "Every mutating endpoint returns the standard JSON envelope {data, meta, errors}"
  artifacts:
    - path: "crm/src/Controllers/Api/PersonController.php"
      provides: "People CRUD + deactivation endpoints"
      exports: ["PersonController"]
    - path: "crm/src/Controllers/Api/ContactMethodController.php"
      provides: "Contact-method sub-resource endpoints for a person"
      exports: ["ContactMethodController"]
    - path: "crm/src/Controllers/Api/TemplateController.php"
      provides: "Response template CRUD endpoints"
      exports: ["TemplateController"]
    - path: "crm/src/Controllers/Api/ClientController.php"
      provides: "API client CRUD + key-generation endpoints"
      exports: ["ClientController"]
    - path: "crm/src/Repositories/ContactMethodRepository.php"
      provides: "ContactMethod data access (list, create, update, delete)"
      exports: ["ContactMethodRepository"]
  key_links:
    - from: "crm/src/Controllers/Api/PersonController.php"
      to: "crm/src/Repositories/PersonRepository.php"
      via: "constructor injection"
      pattern: "PersonRepository"
    - from: "crm/src/Controllers/Api/ContactMethodController.php"
      to: "crm/src/Repositories/ContactMethodRepository.php"
      via: "constructor injection"
      pattern: "ContactMethodRepository"
    - from: "crm/src/Controllers/Api/ClientController.php"
      to: "crm/src/Repositories/ClientRepository.php"
      via: "constructor injection; bcrypt key generation"
      pattern: "password_hash.*PASSWORD_BCRYPT|ClientRepository"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "crm/src/Repositories/PersonRepository.php"
      exports: ["PersonRepository"]
      verify: "grep -n 'class PersonRepository' crm/src/Repositories/PersonRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/ClientRepository.php"
      exports: ["ClientRepository"]
      verify: "grep -n 'class ClientRepository' crm/src/Repositories/ClientRepository.php && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "crm/src/Repositories/TemplateRepository.php"
      exports: ["TemplateRepository"]
      verify: "grep -n 'class TemplateRepository' crm/src/Repositories/TemplateRepository.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Person.php"
      exports: ["Domain\\Person"]
      verify: "grep -n 'readonly class Person' crm/src/Domain/Person.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/ContactMethod.php"
      exports: ["Domain\\ContactMethod"]
      verify: "grep -n 'readonly class ContactMethod' crm/src/Domain/ContactMethod.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Client.php"
      exports: ["Domain\\Client"]
      verify: "grep -n 'readonly class Client' crm/src/Domain/Client.php && echo CONTRACT_OK"
    - from_plan: "02"
      artifact: "crm/src/Domain/Template.php"
      exports: ["Domain\\Template"]
      verify: "grep -n 'readonly class Template' crm/src/Domain/Template.php && echo CONTRACT_OK"
  provides:
    - artifact: "crm/src/Controllers/Api/PersonController.php"
      exports:
        - "GET /api/people — list/search people (staff/admin)"
        - "POST /api/people — create person (admin)"
        - "GET /api/people/{id} — get person with contactMethods[] (staff/admin)"
        - "PUT /api/people/{id} — update person (admin)"
        - "DELETE /api/people/{id} — deactivate person (admin)"
      shape: |
        Response shape (Person detail):
        { "data": { "id": int, "firstName": str, "lastName": str, "fullName": str,
            "role": "admin"|"staff"|"public", "departmentId": int|null, "active": bool,
            "oidcSubject": str|null, "contactMethods": ContactMethod[], "createdAt": str, "updatedAt": str },
          "meta": { "page": int, "perPage": int, "total": int, "pages": int }, "errors": [] }
      verify: "grep -n 'class PersonController' crm/src/Controllers/Api/PersonController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/ContactMethodController.php"
      exports:
        - "GET /api/people/{id}/contact-methods"
        - "POST /api/people/{id}/contact-methods"
        - "PUT /api/people/{id}/contact-methods/{cmId}"
        - "DELETE /api/people/{id}/contact-methods/{cmId}"
      shape: |
        ContactMethod shape: { "id": int, "personId": int, "type": "email"|"phone"|"address",
          "value": str, "phoneType": "mobile"|"office"|"home"|null, "isPrimary": bool, "label": str|null }
      verify: "grep -n 'class ContactMethodController' crm/src/Controllers/Api/ContactMethodController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/TemplateController.php"
      exports:
        - "GET /api/templates — list active templates (staff/admin)"
        - "POST /api/templates — create template (admin)"
        - "GET /api/templates/{id} — get template (staff/admin)"
        - "PUT /api/templates/{id} — update template (admin)"
        - "DELETE /api/templates/{id} — delete non-system template (admin)"
      shape: |
        Template shape: { "id": int, "name": str, "subject": str|null, "body": str,
          "slug": str|null, "active": bool, "createdAt": str, "updatedAt": str }
      verify: "grep -n 'class TemplateController' crm/src/Controllers/Api/TemplateController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Controllers/Api/ClientController.php"
      exports:
        - "GET /api/clients — list clients (admin)"
        - "POST /api/clients — create client + return full apiKey once (admin)"
        - "GET /api/clients/{id} — get client with apiKeyHint only (admin)"
        - "PUT /api/clients/{id} — update name/contact/notes (admin)"
        - "DELETE /api/clients/{id} — deactivate client (admin)"
        - "POST /api/clients/{id}/regenerate-key — regenerate key; return full key once (admin)"
      shape: |
        ApiClient shape: { "id": int, "name": str, "contactEmail": str,
          "apiKeyHint": str, "notes": str|null, "active": bool, "createdAt": str, "updatedAt": str }
        ApiClientWithKey adds: { "apiKey": str } — only on POST /api/clients and POST /api/clients/{id}/regenerate-key
      verify: "grep -n 'class ClientController' crm/src/Controllers/Api/ClientController.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/ContactMethodRepository.php"
      exports: ["ContactMethodRepository"]
      shape: |
        class ContactMethodRepository extends AbstractPdoRepository {
          public function findByPersonId(int $personId): array; // ContactMethod[]
          public function findById(int $id): ?Domain\ContactMethod;
          public function save(object $entity): Domain\ContactMethod;
          public function delete(int $id): void;
          public function demotePrimariesForPerson(int $personId, string $type): void;
        }
      verify: "grep -n 'class ContactMethodRepository' crm/src/Repositories/ContactMethodRepository.php && echo CONTRACT_OK"
---

<objective>
Implement REST API controllers for People/Contacts (F3), Response Templates (F13), and API Clients (F14) — the admin entity endpoints for Wave 2b. Each controller is a thin PHP class consuming Wave 1 repositories and returning the standard JSON envelope.

Purpose: These endpoints power the admin configuration screens in Wave 3b. Getting the exact response shapes, validation rules, and security behaviours right here prevents contract mismatches in the frontend.

Output:
- PersonController (people CRUD + deactivation, search/filter, with embedded contactMethods[])
- ContactMethodController (contact-method sub-resource: add/update/remove; isPrimary promotion logic)
- TemplateController (response template CRUD; system-template delete protection)
- ClientController (API client CRUD; bcrypt key generation; key hint on GET; revoke/regenerate)
- ContactMethodRepository (data-access class for contactMethods table — not yet created in Wave 1 plans)
</objective>

<feature_dependencies>
Implements: F3: People & Contact Management (PersonController, ContactMethodController, ContactMethodRepository — people CRUD, contact method CRUD, email uniqueness, OIDC auto-provision), F13: Response Templates (TemplateController — template CRUD, system template slug protection), F14: API Client Management (ClientController — UUID key generation, bcrypt hash storage, key hint on GET, revoke/regenerate)
Depends on: F16: RESTful JSON API Backend (Wave 2a establishes JSON envelope, middleware stack, RBAC enforcement — all controllers here depend on those conventions being in place)
Enables: F15: Modern SPA Frontend — specifically Wave 3b admin screens for /admin/people, /admin/templates, /admin/clients
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md

# Wave 1 outputs consumed by this plan:
@crm/src/Repositories/PersonRepository.php
@crm/src/Repositories/ClientRepository.php
@crm/src/Repositories/TemplateRepository.php
@crm/src/Domain/Person.php
@crm/src/Domain/ContactMethod.php
@crm/src/Domain/Client.php
@crm/src/Domain/Template.php
</context>

<tasks>

<task type="auto">
  <name>Task 1: ContactMethodRepository + PersonController + ContactMethodController</name>
  <files>
    crm/src/Repositories/ContactMethodRepository.php
    crm/src/Controllers/Api/PersonController.php
    crm/src/Controllers/Api/ContactMethodController.php
  </files>
  <action>
**Background:** Wave 1 (Plan 02) scaffolded `ContactMethodRepository` as a stub file. This task provides the full implementation alongside the two controllers that depend on it.

---

### Step 1: `crm/src/Repositories/ContactMethodRepository.php`

Full data-access implementation for the `contactMethods` table (TechArch §3.2 DDL).

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Domain\ContactMethod;

class ContactMethodRepository extends AbstractPdoRepository implements RepositoryInterface
{
    /** @return ContactMethod[] */
    public function findByPersonId(int $personId): array
    {
        return $this->fetchAll(
            'SELECT * FROM contactMethods WHERE personId = :personId ORDER BY isPrimary DESC, id ASC',
            ['personId' => $personId],
            fn($row) => ContactMethod::fromRow($row)
        );
    }

    public function findById(int $id): ?ContactMethod
    {
        $stmt = $this->pdo->prepare('SELECT * FROM contactMethods WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? ContactMethod::fromRow($row) : null;
    }

    /**
     * If $entity->id > 0 → UPDATE; otherwise → INSERT.
     * Before saving with isPrimary=true, call demotePrimariesForPerson() first.
     */
    public function save(object $entity): ContactMethod
    {
        /** @var ContactMethod $entity */
        $data = [
            'personId'  => $entity->personId,
            'type'      => $entity->type,
            'value'     => $entity->value,
            'phoneType' => $entity->phoneType,
            'isPrimary' => (int) $entity->isPrimary,
            'label'     => $entity->label,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE contactMethods SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO contactMethods ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM contactMethods WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }

    /**
     * Demote all existing primary contact methods of a given type for a person.
     * Call before saving a new/updated contact method with isPrimary=true (F03 process).
     */
    public function demotePrimariesForPerson(int $personId, string $type): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE contactMethods SET isPrimary = 0 WHERE personId = :personId AND type = :type"
        );
        $stmt->execute(['personId' => $personId, 'type' => $type]);
    }

    /**
     * Check email uniqueness across all active contactMethods of type 'email'.
     * Returns true if the email is already in use (by a different person or contact method).
     */
    public function emailExists(string $email, ?int $excludeContactMethodId = null): bool
    {
        $sql    = "SELECT COUNT(*) FROM contactMethods WHERE type = 'email' AND value = :email";
        $params = ['email' => $email];
        if ($excludeContactMethodId !== null) {
            $sql .= " AND id != :excludeId";
            $params['excludeId'] = $excludeContactMethodId;
        }
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }
}
```

---

### Step 2: `crm/src/Controllers/Api/PersonController.php`

Thin controller: parses request, delegates to PersonRepository + ContactMethodRepository, returns JSON envelope. No business logic beyond validation.

Endpoints implemented (from TechArch §4.3 People):
- `GET /api/people` — list/search (staff/admin)
- `POST /api/people` — create person (admin)
- `GET /api/people/{id}` — get person + contactMethods (staff/admin)
- `PUT /api/people/{id}` — update person (admin)
- `DELETE /api/people/{id}` — deactivate person (admin)

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Person;
use Repositories\PersonRepository;
use Repositories\ContactMethodRepository;

class PersonController
{
    public function __construct(
        private PersonRepository        $personRepo,
        private ContactMethodRepository $cmRepo,
    ) {}

    // ── GET /api/people ──────────────────────────────────────────────────────

    public function index(array $query, array $currentUser): array
    {
        $filters = [];
        if (!empty($query['role']))         $filters['role']         = $query['role'];
        if (isset($query['departmentId']))  $filters['departmentId'] = (int) $query['departmentId'];
        if (isset($query['active']))        $filters['active']       = filter_var($query['active'], FILTER_VALIDATE_BOOLEAN);

        $page    = max(1, (int) ($query['page']    ?? 1));
        $perPage = max(1, min(100, (int) ($query['perPage'] ?? 25)));

        $result = $this->personRepo->findWithFilters($filters, $page, $perPage);

        return [
            'status' => 200,
            'body'   => [
                'data'   => array_map([$this, 'serializePerson'], $result['rows']),
                'meta'   => [
                    'page'    => $page,
                    'perPage' => $perPage,
                    'total'   => $result['total'],
                    'pages'   => (int) ceil($result['total'] / $perPage),
                ],
                'errors' => [],
            ],
        ];
    }

    // ── POST /api/people ─────────────────────────────────────────────────────

    public function create(array $body, array $currentUser): array
    {
        $errors = $this->validatePersonBody($body);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $entity = new Person(
            id:           0,
            firstName:    trim($body['firstName']),
            lastName:     trim($body['lastName']),
            role:         $body['role'],
            departmentId: isset($body['departmentId']) ? (int) $body['departmentId'] : null,
            active:       (bool) ($body['active'] ?? true),
            oidcSubject:  $body['oidcSubject'] ?? null,
            createdAt:    date('Y-m-d H:i:s'),
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $saved = $this->personRepo->save($entity);

        return [
            'status' => 201,
            'body'   => ['data' => $this->serializePersonWithContacts($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── GET /api/people/{id} ─────────────────────────────────────────────────

    public function show(int $id, array $currentUser): array
    {
        $person = $this->personRepo->findById($id);
        if (!$person) {
            return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Person not found', 'code' => 'NOT_FOUND']]]];
        }

        return [
            'status' => 200,
            'body'   => ['data' => $this->serializePersonWithContacts($person), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/people/{id} ─────────────────────────────────────────────────

    public function update(int $id, array $body, array $currentUser): array
    {
        $person = $this->personRepo->findById($id);
        if (!$person) {
            return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Person not found', 'code' => 'NOT_FOUND']]]];
        }

        // Merge updates into existing person
        $updated = new Person(
            id:           $person->id,
            firstName:    isset($body['firstName']) ? trim($body['firstName']) : $person->firstName,
            lastName:     isset($body['lastName'])  ? trim($body['lastName'])  : $person->lastName,
            role:         $body['role']         ?? $person->role,
            departmentId: array_key_exists('departmentId', $body)
                            ? (isset($body['departmentId']) ? (int) $body['departmentId'] : null)
                            : $person->departmentId,
            active:       isset($body['active']) ? (bool) $body['active'] : $person->active,
            oidcSubject:  array_key_exists('oidcSubject', $body) ? $body['oidcSubject'] : $person->oidcSubject,
            createdAt:    $person->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $errors = $this->validatePersonBody((array) $updated, isUpdate: true);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $saved = $this->personRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serializePersonWithContacts($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/people/{id} ──────────────────────────────────────────────

    public function deactivate(int $id, array $currentUser): array
    {
        $person = $this->personRepo->findById($id);
        if (!$person) {
            return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => 'Person not found', 'code' => 'NOT_FOUND']]]];
        }

        // Preserve record; soft-deactivate via active = 0 (F03: "Cannot delete — only deactivate")
        $this->personRepo->delete($id);

        return ['status' => 204, 'body' => null];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function validatePersonBody(array $body, bool $isUpdate = false): array
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($body['firstName']) || !is_string($body['firstName'])) {
                $errors[] = ['field' => 'firstName', 'message' => 'firstName is required', 'code' => 'REQUIRED'];
            }
            if (empty($body['lastName']) || !is_string($body['lastName'])) {
                $errors[] = ['field' => 'lastName', 'message' => 'lastName is required', 'code' => 'REQUIRED'];
            }
            if (!in_array($body['role'] ?? '', ['admin', 'staff', 'public'], true)) {
                $errors[] = ['field' => 'role', 'message' => 'Role must be admin, staff, or public', 'code' => 'INVALID_ROLE'];
            }
        } else {
            if (isset($body['role']) && !in_array($body['role'], ['admin', 'staff', 'public'], true)) {
                $errors[] = ['field' => 'role', 'message' => 'Role must be admin, staff, or public', 'code' => 'INVALID_ROLE'];
            }
        }

        return $errors;
    }

    private function serializePerson(Person $p): array
    {
        return [
            'id'           => $p->id,
            'firstName'    => $p->firstName,
            'lastName'     => $p->lastName,
            'fullName'     => $p->firstName . ' ' . $p->lastName,
            'role'         => $p->role,
            'departmentId' => $p->departmentId,
            'active'       => $p->active,
            'oidcSubject'  => $p->oidcSubject,
            'createdAt'    => $p->createdAt,
            'updatedAt'    => $p->updatedAt,
        ];
    }

    private function serializePersonWithContacts(Person $p): array
    {
        $base             = $this->serializePerson($p);
        $cms              = $this->cmRepo->findByPersonId($p->id);
        $base['contactMethods'] = array_map(
            fn($cm) => [
                'id'        => $cm->id,
                'personId'  => $cm->personId,
                'type'      => $cm->type,
                'value'     => $cm->value,
                'phoneType' => $cm->phoneType,
                'isPrimary' => $cm->isPrimary,
                'label'     => $cm->label,
            ],
            $cms
        );
        return $base;
    }
}
```

---

### Step 3: `crm/src/Controllers/Api/ContactMethodController.php`

Endpoints (from TechArch §4.3 People):
- `GET /api/people/{id}/contact-methods`
- `POST /api/people/{id}/contact-methods`
- `PUT /api/people/{id}/contact-methods/{cmId}`
- `DELETE /api/people/{id}/contact-methods/{cmId}`

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\ContactMethod;
use Repositories\PersonRepository;
use Repositories\ContactMethodRepository;

class ContactMethodController
{
    public function __construct(
        private PersonRepository        $personRepo,
        private ContactMethodRepository $cmRepo,
    ) {}

    // ── GET /api/people/{id}/contact-methods ─────────────────────────────────

    public function index(int $personId, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $cms = $this->cmRepo->findByPersonId($personId);
        return [
            'status' => 200,
            'body'   => ['data' => array_map([$this, 'serialize'], $cms), 'meta' => [], 'errors' => []],
        ];
    }

    // ── POST /api/people/{id}/contact-methods ────────────────────────────────

    public function create(int $personId, array $body, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $errors = $this->validate($body);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        // Uniqueness check for email type (F03 validation)
        if (($body['type'] ?? '') === 'email') {
            if ($this->cmRepo->emailExists($body['value'])) {
                return [
                    'status' => 422,
                    'body'   => ['data' => null, 'meta' => [], 'errors' => [
                        ['field' => 'value', 'message' => 'This email address is already registered', 'code' => 'DUPLICATE_EMAIL']
                    ]],
                ];
            }
        }

        // Demote existing primaries if this one claims primary (F03 process step 3)
        $isPrimary = (bool) ($body['isPrimary'] ?? false);
        if ($isPrimary) {
            $this->cmRepo->demotePrimariesForPerson($personId, $body['type']);
        }

        $entity = new ContactMethod(
            id:        0,
            personId:  $personId,
            type:      $body['type'],
            value:     trim($body['value']),
            phoneType: $body['phoneType'] ?? null,
            isPrimary: $isPrimary,
            label:     $body['label'] ?? null,
        );

        $saved = $this->cmRepo->save($entity);

        return [
            'status' => 201,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/people/{id}/contact-methods/{cmId} ──────────────────────────

    public function update(int $personId, int $cmId, array $body, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $cm = $this->cmRepo->findById($cmId);
        if (!$cm || $cm->personId !== $personId) {
            return $this->notFound('Contact method not found');
        }

        // Email uniqueness check (exclude self)
        if (($body['value'] ?? $cm->value) !== $cm->value && $cm->type === 'email') {
            if ($this->cmRepo->emailExists($body['value'], $cmId)) {
                return [
                    'status' => 422,
                    'body'   => ['data' => null, 'meta' => [], 'errors' => [
                        ['field' => 'value', 'message' => 'This email address is already registered', 'code' => 'DUPLICATE_EMAIL']
                    ]],
                ];
            }
        }

        $newIsPrimary = isset($body['isPrimary']) ? (bool) $body['isPrimary'] : $cm->isPrimary;
        if ($newIsPrimary && !$cm->isPrimary) {
            $this->cmRepo->demotePrimariesForPerson($personId, $cm->type);
        }

        $updated = new ContactMethod(
            id:        $cm->id,
            personId:  $cm->personId,
            type:      $cm->type,  // type is immutable after creation
            value:     isset($body['value']) ? trim($body['value']) : $cm->value,
            phoneType: $body['phoneType'] ?? $cm->phoneType,
            isPrimary: $newIsPrimary,
            label:     array_key_exists('label', $body) ? $body['label'] : $cm->label,
        );

        $saved = $this->cmRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/people/{id}/contact-methods/{cmId} ───────────────────────

    public function remove(int $personId, int $cmId, array $currentUser): array
    {
        if (!$this->personRepo->findById($personId)) {
            return $this->notFound('Person not found');
        }

        $cm = $this->cmRepo->findById($cmId);
        if (!$cm || $cm->personId !== $personId) {
            return $this->notFound('Contact method not found');
        }

        $this->cmRepo->delete($cmId);

        return ['status' => 204, 'body' => null];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function validate(array $body): array
    {
        $errors = [];
        $type = $body['type'] ?? '';

        if (!in_array($type, ['email', 'phone', 'address'], true)) {
            $errors[] = ['field' => 'type', 'message' => 'type must be email, phone, or address', 'code' => 'INVALID_TYPE'];
        }

        if (empty($body['value'])) {
            $errors[] = ['field' => 'value', 'message' => 'value is required', 'code' => 'REQUIRED'];
        }

        if ($type === 'email' && !empty($body['value']) && !filter_var($body['value'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['field' => 'value', 'message' => 'Email address is not valid', 'code' => 'INVALID_EMAIL'];
        }

        if ($type === 'phone' && isset($body['phoneType'])
            && !in_array($body['phoneType'], ['mobile', 'office', 'home'], true)) {
            $errors[] = ['field' => 'phoneType', 'message' => 'phoneType must be mobile, office, or home', 'code' => 'INVALID_PHONE_TYPE'];
        }

        return $errors;
    }

    private function serialize(ContactMethod $cm): array
    {
        return [
            'id'        => $cm->id,
            'personId'  => $cm->personId,
            'type'      => $cm->type,
            'value'     => $cm->value,
            'phoneType' => $cm->phoneType,
            'isPrimary' => $cm->isPrimary,
            'label'     => $cm->label,
        ];
    }

    private function notFound(string $message): array
    {
        return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [['field' => null, 'message' => $message, 'code' => 'NOT_FOUND']]]];
    }
}
```
  </action>
  <verify>
```bash
# Syntax-check all three files
php -l crm/src/Repositories/ContactMethodRepository.php && echo "CMREPO SYNTAX OK"
php -l crm/src/Controllers/Api/PersonController.php && echo "PERSON_CTRL SYNTAX OK"
php -l crm/src/Controllers/Api/ContactMethodController.php && echo "CM_CTRL SYNTAX OK"

# Class existence checks
grep -n 'class ContactMethodRepository' crm/src/Repositories/ContactMethodRepository.php && echo "CONTRACT_OK"
grep -n 'class PersonController' crm/src/Controllers/Api/PersonController.php && echo "CONTRACT_OK"
grep -n 'class ContactMethodController' crm/src/Controllers/Api/ContactMethodController.php && echo "CONTRACT_OK"

# Key method checks
grep -n 'demotePrimariesForPerson' crm/src/Repositories/ContactMethodRepository.php && echo "DEMOTE_METHOD OK"
grep -n 'emailExists' crm/src/Repositories/ContactMethodRepository.php && echo "EMAIL_UNIQUE_METHOD OK"
grep -n 'serializePersonWithContacts' crm/src/Controllers/Api/PersonController.php && echo "EMBED_CONTACTS OK"

# F03 validation: DUPLICATE_EMAIL error code present
grep -n 'DUPLICATE_EMAIL' crm/src/Controllers/Api/ContactMethodController.php && echo "DUPLICATE_EMAIL_CODE OK"
```
  </verify>
  <done>
- `php -l` exits 0 on all three files (no syntax errors)
- `ContactMethodRepository` has `findByPersonId`, `emailExists`, `demotePrimariesForPerson`, `save`, `delete` methods
- `PersonController` embeds `contactMethods[]` in GET /api/people/{id} response via `serializePersonWithContacts`
- `ContactMethodController` enforces email uniqueness via `emailExists()` and returns `DUPLICATE_EMAIL` error code on duplicate
- `isPrimary` promotion calls `demotePrimariesForPerson` before saving new primary contact method
- All responses follow `{data, meta, errors}` JSON envelope structure
  </done>
</task>

<task type="auto">
  <name>Task 2: TemplateController + ClientController</name>
  <files>
    crm/src/Controllers/Api/TemplateController.php
    crm/src/Controllers/Api/ClientController.php
  </files>
  <action>

### Step 1: `crm/src/Controllers/Api/TemplateController.php`

Endpoints (TechArch §4.3 Templates):
- `GET /api/templates` — list active templates (staff/admin)
- `POST /api/templates` — create template (admin)
- `GET /api/templates/{id}` — get template (staff/admin)
- `PUT /api/templates/{id}` — update template (admin)
- `DELETE /api/templates/{id}` — delete non-system template (admin); system templates (slug != null) are protected

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Template;
use Repositories\TemplateRepository;

class TemplateController
{
    public function __construct(
        private TemplateRepository $templateRepo,
    ) {}

    // ── GET /api/templates ───────────────────────────────────────────────────

    public function index(array $query, array $currentUser): array
    {
        $activeOnly = (bool) ($query['active'] ?? true);
        $templates  = $this->templateRepo->findAll($activeOnly);

        return [
            'status' => 200,
            'body'   => [
                'data'   => array_map([$this, 'serialize'], $templates),
                'meta'   => ['total' => count($templates)],
                'errors' => [],
            ],
        ];
    }

    // ── POST /api/templates ──────────────────────────────────────────────────

    public function create(array $body, array $currentUser): array
    {
        $errors = $this->validate($body, isCreate: true);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $entity = new Template(
            id:        0,
            name:      trim($body['name']),
            subject:   $body['subject'] ?? null,
            body:      $body['body'],
            slug:      null,  // user-created templates never have a slug
            active:    (bool) ($body['active'] ?? true),
            createdAt: date('Y-m-d H:i:s'),
            updatedAt: date('Y-m-d H:i:s'),
        );

        $saved = $this->templateRepo->save($entity);

        return [
            'status' => 201,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── GET /api/templates/{id} ──────────────────────────────────────────────

    public function show(int $id, array $currentUser): array
    {
        $template = $this->templateRepo->findById($id);
        if (!$template) {
            return $this->notFound();
        }

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($template), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/templates/{id} ──────────────────────────────────────────────

    public function update(int $id, array $body, array $currentUser): array
    {
        $template = $this->templateRepo->findById($id);
        if (!$template) {
            return $this->notFound();
        }

        $updated = new Template(
            id:        $template->id,
            name:      isset($body['name']) ? trim($body['name']) : $template->name,
            subject:   array_key_exists('subject', $body) ? $body['subject'] : $template->subject,
            body:      $body['body'] ?? $template->body,
            slug:      $template->slug,   // slug is immutable
            active:    isset($body['active']) ? (bool) $body['active'] : $template->active,
            createdAt: $template->createdAt,
            updatedAt: date('Y-m-d H:i:s'),
        );

        $errors = $this->validate(['name' => $updated->name, 'body' => $updated->body], isCreate: false);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $saved = $this->templateRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/templates/{id} ───────────────────────────────────────────

    public function delete(int $id, array $currentUser): array
    {
        $template = $this->templateRepo->findById($id);
        if (!$template) {
            return $this->notFound();
        }

        // System templates (non-null slug) cannot be deleted (F13)
        if ($template->slug !== null) {
            return [
                'status' => 422,
                'body'   => ['data' => null, 'meta' => [], 'errors' => [
                    ['field' => null, 'message' => 'System templates cannot be deleted', 'code' => 'SYSTEM_TEMPLATE_PROTECTED']
                ]],
            ];
        }

        $this->templateRepo->delete($id);

        return ['status' => 204, 'body' => null];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function validate(array $body, bool $isCreate): array
    {
        $errors = [];

        if ($isCreate && empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'name is required', 'code' => 'REQUIRED'];
        }

        if ($isCreate && empty($body['body'])) {
            $errors[] = ['field' => 'body', 'message' => 'body is required', 'code' => 'REQUIRED'];
        }

        if (!empty($body['name']) && mb_strlen($body['name']) > 255) {
            $errors[] = ['field' => 'name', 'message' => 'name must be 255 chars or fewer', 'code' => 'TOO_LONG'];
        }

        return $errors;
    }

    private function serialize(Template $t): array
    {
        return [
            'id'        => $t->id,
            'name'      => $t->name,
            'subject'   => $t->subject,
            'body'      => $t->body,
            'slug'      => $t->slug,
            'active'    => $t->active,
            'createdAt' => $t->createdAt,
            'updatedAt' => $t->updatedAt,
        ];
    }

    private function notFound(): array
    {
        return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [
            ['field' => null, 'message' => 'Template not found', 'code' => 'NOT_FOUND']
        ]]];
    }
}
```

---

### Step 2: `crm/src/Controllers/Api/ClientController.php`

Endpoints (TechArch §4.3 API Clients):
- `GET /api/clients` — list all (admin); response always uses `apiKeyHint`, NEVER `apiKeyHash`
- `POST /api/clients` — create; generate UUID key, bcrypt-hash it, store hash + hint, return full key ONCE
- `GET /api/clients/{id}` — get detail with `apiKeyHint` only
- `PUT /api/clients/{id}` — update name/contactEmail/notes (not key)
- `DELETE /api/clients/{id}` — deactivate (active = 0)
- `POST /api/clients/{id}/regenerate-key` — generate new UUID key, update hash + hint, return full key ONCE

**Security rules (TechArch §3.2 clients table comment):**
- Plain-text API key returned ONLY on create and regenerate
- `apiKeyHash` (bcrypt) is what is stored; never expose in API responses
- `apiKeyHint` is first 8 chars + "…" for display

```php
<?php
declare(strict_types=1);
namespace Controllers\Api;

use Domain\Client;
use Repositories\ClientRepository;

class ClientController
{
    public function __construct(
        private ClientRepository $clientRepo,
    ) {}

    // ── GET /api/clients ─────────────────────────────────────────────────────

    public function index(array $query, array $currentUser): array
    {
        $activeOnly = isset($query['active']) ? (bool) $query['active'] : true;
        $clients    = $this->clientRepo->findAll($activeOnly);

        return [
            'status' => 200,
            'body'   => [
                'data'   => array_map([$this, 'serialize'], $clients),
                'meta'   => ['total' => count($clients)],
                'errors' => [],
            ],
        ];
    }

    // ── POST /api/clients ────────────────────────────────────────────────────

    public function create(array $body, array $currentUser): array
    {
        $errors = $this->validate($body, isCreate: true);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        // Generate plain API key (UUID v4 format, 36 chars without dashes = 32 hex chars for entropy)
        $plainKey    = $this->generateApiKey();
        $keyHash     = password_hash($plainKey, PASSWORD_BCRYPT);
        $keyHint     = substr($plainKey, 0, 8) . '…';

        $entity = new Client(
            id:           0,
            name:         trim($body['name']),
            contactEmail: trim($body['contactEmail']),
            apiKeyHash:   $keyHash,
            apiKeyHint:   $keyHint,
            notes:        $body['notes'] ?? null,
            active:       true,
            createdAt:    date('Y-m-d H:i:s'),
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $saved = $this->clientRepo->save($entity);

        // Return full key ONCE — callers must save it; not retrievable later
        $data           = $this->serialize($saved);
        $data['apiKey'] = $plainKey;

        return [
            'status' => 201,
            'body'   => ['data' => $data, 'meta' => [], 'errors' => []],
        ];
    }

    // ── GET /api/clients/{id} ────────────────────────────────────────────────

    public function show(int $id, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($client), 'meta' => [], 'errors' => []],
        ];
    }

    // ── PUT /api/clients/{id} ────────────────────────────────────────────────

    public function update(int $id, array $body, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        $updated = new Client(
            id:           $client->id,
            name:         isset($body['name']) ? trim($body['name']) : $client->name,
            contactEmail: isset($body['contactEmail']) ? trim($body['contactEmail']) : $client->contactEmail,
            apiKeyHash:   $client->apiKeyHash,   // key is NOT updated here
            apiKeyHint:   $client->apiKeyHint,
            notes:        array_key_exists('notes', $body) ? $body['notes'] : $client->notes,
            active:       isset($body['active']) ? (bool) $body['active'] : $client->active,
            createdAt:    $client->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $errors = $this->validate(['name' => $updated->name, 'contactEmail' => $updated->contactEmail], isCreate: false);
        if ($errors) {
            return ['status' => 422, 'body' => ['data' => null, 'meta' => [], 'errors' => $errors]];
        }

        $saved = $this->clientRepo->save($updated);

        return [
            'status' => 200,
            'body'   => ['data' => $this->serialize($saved), 'meta' => [], 'errors' => []],
        ];
    }

    // ── DELETE /api/clients/{id} ─────────────────────────────────────────────

    public function deactivate(int $id, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        // Soft-deactivate: set active = 0 (Open311 validation will reject future requests from this key)
        $deactivated = new Client(
            id:           $client->id,
            name:         $client->name,
            contactEmail: $client->contactEmail,
            apiKeyHash:   $client->apiKeyHash,
            apiKeyHint:   $client->apiKeyHint,
            notes:        $client->notes,
            active:       false,
            createdAt:    $client->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $this->clientRepo->save($deactivated);

        return ['status' => 204, 'body' => null];
    }

    // ── POST /api/clients/{id}/regenerate-key ────────────────────────────────

    public function regenerateKey(int $id, array $currentUser): array
    {
        $client = $this->clientRepo->findById($id);
        if (!$client) {
            return $this->notFound();
        }

        $plainKey = $this->generateApiKey();
        $keyHash  = password_hash($plainKey, PASSWORD_BCRYPT);
        $keyHint  = substr($plainKey, 0, 8) . '…';

        $updated = new Client(
            id:           $client->id,
            name:         $client->name,
            contactEmail: $client->contactEmail,
            apiKeyHash:   $keyHash,
            apiKeyHint:   $keyHint,
            notes:        $client->notes,
            active:       $client->active,
            createdAt:    $client->createdAt,
            updatedAt:    date('Y-m-d H:i:s'),
        );

        $saved = $this->clientRepo->save($updated);

        // Return full key ONCE
        $data           = $this->serialize($saved);
        $data['apiKey'] = $plainKey;

        return [
            'status' => 200,
            'body'   => ['data' => $data, 'meta' => [], 'errors' => []],
        ];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Generate a cryptographically random API key (32 hex chars = 128-bit entropy).
     * Not UUID format intentionally — longer entropy for API key use.
     */
    private function generateApiKey(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function validate(array $body, bool $isCreate): array
    {
        $errors = [];

        if ($isCreate && empty($body['name'])) {
            $errors[] = ['field' => 'name', 'message' => 'name is required', 'code' => 'REQUIRED'];
        }
        if ($isCreate && empty($body['contactEmail'])) {
            $errors[] = ['field' => 'contactEmail', 'message' => 'contactEmail is required', 'code' => 'REQUIRED'];
        }
        if (!empty($body['contactEmail']) && !filter_var($body['contactEmail'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = ['field' => 'contactEmail', 'message' => 'contactEmail must be a valid email address', 'code' => 'INVALID_EMAIL'];
        }

        return $errors;
    }

    /**
     * Serialize a Client for API response.
     * NEVER include apiKeyHash — only apiKeyHint.
     */
    private function serialize(Client $c): array
    {
        return [
            'id'           => $c->id,
            'name'         => $c->name,
            'contactEmail' => $c->contactEmail,
            'apiKeyHint'   => $c->apiKeyHint,   // e.g. "a1b2c3d4…"
            'notes'        => $c->notes,
            'active'       => $c->active,
            'createdAt'    => $c->createdAt,
            'updatedAt'    => $c->updatedAt,
            // apiKey NOT included here — only returned on create/regenerate by callers
        ];
    }

    private function notFound(): array
    {
        return ['status' => 404, 'body' => ['data' => null, 'meta' => [], 'errors' => [
            ['field' => null, 'message' => 'API client not found', 'code' => 'NOT_FOUND']
        ]]];
    }
}
```
  </action>
  <verify>
```bash
# Syntax checks
php -l crm/src/Controllers/Api/TemplateController.php && echo "TEMPLATE_CTRL SYNTAX OK"
php -l crm/src/Controllers/Api/ClientController.php && echo "CLIENT_CTRL SYNTAX OK"

# Class checks
grep -n 'class TemplateController' crm/src/Controllers/Api/TemplateController.php && echo "CONTRACT_OK"
grep -n 'class ClientController' crm/src/Controllers/Api/ClientController.php && echo "CONTRACT_OK"

# System template protection
grep -n 'SYSTEM_TEMPLATE_PROTECTED' crm/src/Controllers/Api/TemplateController.php && echo "SYSPROTECT OK"
grep -n 'slug.*null' crm/src/Controllers/Api/TemplateController.php && echo "SLUG_IMMUTABLE OK"

# Security: apiKeyHash must NOT appear in serialize() response array
# (apiKeyHash should only be used internally, not in the serialize return)
grep -n "'apiKeyHash'" crm/src/Controllers/Api/ClientController.php | grep -v "apiKeyHash.*=" | grep -v "//\|client->" && echo "NO_HASH_IN_RESPONSE" || echo "HASH_EXPOSURE_CHECK: review manually"

# Key generation uses password_hash + PASSWORD_BCRYPT + random_bytes
grep -n 'password_hash.*PASSWORD_BCRYPT' crm/src/Controllers/Api/ClientController.php && echo "BCRYPT OK"
grep -n 'random_bytes' crm/src/Controllers/Api/ClientController.php && echo "RANDOM_BYTES OK"

# regenerateKey returns full key + hash update
grep -n 'regenerateKey' crm/src/Controllers/Api/ClientController.php && echo "REGENERATE_METHOD OK"

# Template user-created: slug always null on create
grep -n 'slug.*null.*user-created\|null.*slug' crm/src/Controllers/Api/TemplateController.php && echo "NULL_SLUG_CREATE OK"
```
  </verify>
  <done>
- `php -l` exits 0 on both controller files (no syntax errors)
- `TemplateController::delete()` returns 422 with `SYSTEM_TEMPLATE_PROTECTED` error code when `slug !== null`
- `TemplateController::create()` sets `slug = null` — user-created templates never receive a slug
- `ClientController::serialize()` includes `apiKeyHint` but NEVER exposes `apiKeyHash` in the response body
- `ClientController::create()` and `regenerateKey()` return `apiKey` (full plain key) in response body — one-time only
- `ClientController::generateApiKey()` uses `random_bytes(16)` for cryptographic entropy (128-bit)
- `ClientController::deactivate()` soft-deactivates (sets `active = false`) rather than hard-deleting
- Both controllers follow `{data, meta, errors}` JSON envelope
  </done>
</task>

</tasks>

<verification>
```bash
# All 5 new files exist
ls crm/src/Repositories/ContactMethodRepository.php \
   crm/src/Controllers/Api/PersonController.php \
   crm/src/Controllers/Api/ContactMethodController.php \
   crm/src/Controllers/Api/TemplateController.php \
   crm/src/Controllers/Api/ClientController.php && echo "ALL FILES PRESENT"

# Syntax check all
for f in crm/src/Repositories/ContactMethodRepository.php \
          crm/src/Controllers/Api/PersonController.php \
          crm/src/Controllers/Api/ContactMethodController.php \
          crm/src/Controllers/Api/TemplateController.php \
          crm/src/Controllers/Api/ClientController.php; do
  php -l "$f" || exit 1
done && echo "ALL SYNTAX OK"

# Wave 1 dependency contracts satisfied
grep -n 'class PersonRepository' crm/src/Repositories/PersonRepository.php && echo "PERSONREPO CONTRACT_OK"
grep -n 'class ClientRepository' crm/src/Repositories/ClientRepository.php && echo "CLIENTREPO CONTRACT_OK"
grep -n 'class TemplateRepository' crm/src/Repositories/TemplateRepository.php && echo "TEMPLATEREPO CONTRACT_OK"

# Core feature contracts provided
grep -n 'class ContactMethodRepository' crm/src/Repositories/ContactMethodRepository.php && echo "CMREPO CONTRACT_OK"
grep -n 'demotePrimariesForPerson' crm/src/Repositories/ContactMethodRepository.php && echo "F03_ISPRIMARY OK"
grep -n 'SYSTEM_TEMPLATE_PROTECTED' crm/src/Controllers/Api/TemplateController.php && echo "F13_SYSPROTECT OK"
grep -n 'password_hash.*PASSWORD_BCRYPT' crm/src/Controllers/Api/ClientController.php && echo "F14_BCRYPT OK"
grep -n 'regenerateKey' crm/src/Controllers/Api/ClientController.php && echo "F14_REGEN OK"
```
</verification>

<success_criteria>
- All 5 files are syntactically valid PHP 8.5 (php -l exits 0)
- `ContactMethodRepository` provides full CRUD + `demotePrimariesForPerson` + `emailExists` for F03 uniqueness enforcement
- `PersonController` returns `contactMethods[]` embedded in GET /api/people/{id} detail response
- `ContactMethodController` enforces RFC 5322 email validation and duplicate-email rejection (DUPLICATE_EMAIL error code)
- `TemplateController` protects system templates from deletion via `SYSTEM_TEMPLATE_PROTECTED` error code
- `ClientController` generates API keys with `random_bytes` + bcrypt hash; exposes only `apiKeyHint` on GET; returns full `apiKey` only on POST create and POST regenerate-key
- All controllers use `{data, meta, errors}` JSON envelope (consistent with Wave 2a API kernel)
- Wave 1 repository dependencies (PersonRepository, ClientRepository, TemplateRepository, Domain objects) consumed via constructor injection — no instantiation inside methods
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/06-SUMMARY.md` with:
- Files created
- Key implementation decisions
- Contracts provided for Wave 3b frontend
</output>
