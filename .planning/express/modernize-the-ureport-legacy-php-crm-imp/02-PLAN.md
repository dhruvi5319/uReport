---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - crm/src/Repositories/RepositoryInterface.php
  - crm/src/Repositories/AbstractPdoRepository.php
  - crm/src/Repositories/TicketRepository.php
  - crm/src/Repositories/ActionRepository.php
  - crm/src/Repositories/PersonRepository.php
  - crm/src/Repositories/CategoryRepository.php
  - crm/src/Repositories/DepartmentRepository.php
  - crm/src/Repositories/MediaRepository.php
  - crm/src/Repositories/SubstatusRepository.php
  - crm/src/Repositories/ClientRepository.php
  - crm/src/Repositories/BookmarkRepository.php
  - crm/src/Repositories/TemplateRepository.php
  - crm/src/Repositories/NotificationLogRepository.php
  - crm/src/Repositories/ContactMethodRepository.php
  - crm/src/Infrastructure/Database/PdoConnection.php
  - crm/src/Domain/Ticket.php
  - crm/src/Domain/Person.php
  - crm/src/Domain/Category.php
  - crm/src/Domain/Department.php
  - crm/src/Domain/Action.php
  - crm/src/Domain/Media.php
  - crm/src/Domain/Substatus.php
  - crm/src/Domain/Bookmark.php
  - crm/src/Domain/Client.php
  - crm/src/Domain/ContactMethod.php
  - crm/src/Domain/Template.php
  - crm/src/Domain/CategoryGroup.php
  - crm/src/Domain/NotificationLog.php
  - crm/composer.json
autonomous: true

features:
  implements: ["F16", "F0", "F2", "F3", "F6", "F7", "F8", "F11", "F12", "F13", "F14", "F17", "F18"]
  depends_on: []
  enables: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F16", "F17", "F18"]

must_haves:
  truths:
    - "Every table in TechArch §3.2/3.3 has a typed Domain object with exact column mapping"
    - "RepositoryInterface defines find, findById, save, delete methods with typed return values"
    - "AbstractPdoRepository implements PDO lifecycle: prepared statements, pagination, transaction helpers"
    - "Each named repository (Ticket, Person, etc.) implements RepositoryInterface returning its Domain type"
    - "No ActiveRecord inheritance in new code — repositories are independent of legacy Application\ActiveRecord"
    - "Legacy crm/src/Application/ files are NOT modified — repositories live in crm/src/Repositories/"
    - "All domain objects are plain PHP 8.5 value objects (readonly properties, named constructor fromRow())"
  artifacts:
    - path: "crm/src/Repositories/RepositoryInterface.php"
      provides: "Contract all repositories must implement"
      exports: ["RepositoryInterface"]
    - path: "crm/src/Repositories/AbstractPdoRepository.php"
      provides: "Shared PDO infrastructure"
      exports: ["AbstractPdoRepository"]
    - path: "crm/src/Repositories/TicketRepository.php"
      provides: "Ticket data access"
      exports: ["TicketRepository"]
    - path: "crm/src/Domain/Ticket.php"
      provides: "Typed ticket entity"
      exports: ["Ticket"]
    - path: "crm/src/Domain/Person.php"
      provides: "Typed person entity"
      exports: ["Person"]
    - path: "crm/src/Domain/Action.php"
      provides: "Typed immutable action entity"
      exports: ["Action"]
  key_links:
    - from: "crm/src/Repositories/AbstractPdoRepository.php"
      to: "crm/src/Infrastructure/Database/PdoConnection.php"
      via: "constructor injection of PDO"
      pattern: "PdoConnection::getInstance|new PdoConnection"
    - from: "crm/src/Repositories/TicketRepository.php"
      to: "crm/src/Domain/Ticket.php"
      via: "Ticket::fromRow() factory"
      pattern: "Ticket::fromRow"
    - from: "crm/src/Repositories/ActionRepository.php"
      to: "crm/src/Domain/Action.php"
      via: "Action::fromRow() factory"
      pattern: "Action::fromRow"

integration_contracts:
  requires: []
  provides:
    - artifact: "crm/src/Repositories/RepositoryInterface.php"
      exports: ["RepositoryInterface"]
      shape: |
        namespace Repositories;
        interface RepositoryInterface {
          public function findById(int $id): ?object;
          public function save(object $entity): object;
          public function delete(int $id): void;
        }
      verify: "grep -n 'interface RepositoryInterface' crm/src/Repositories/RepositoryInterface.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/AbstractPdoRepository.php"
      exports: ["AbstractPdoRepository"]
      shape: |
        namespace Repositories;
        abstract class AbstractPdoRepository {
          protected PDO $pdo;
          protected function paginate(string $sql, array $params, int $page, int $perPage): array;
          public function beginTransaction(): void;
          public function commit(): void;
          public function rollback(): void;
        }
      verify: "grep -n 'abstract class AbstractPdoRepository' crm/src/Repositories/AbstractPdoRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/TicketRepository.php"
      exports: ["TicketRepository"]
      shape: |
        namespace Repositories;
        class TicketRepository extends AbstractPdoRepository implements RepositoryInterface {
          public function findById(int $id): ?Domain\Ticket;
          public function findByFilters(array $filters, int $page, int $perPage): array;
          public function save(Domain\Ticket $ticket): Domain\Ticket;
          public function softDelete(int $id): void;
        }
      verify: "grep -n 'class TicketRepository' crm/src/Repositories/TicketRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/PersonRepository.php"
      exports: ["PersonRepository"]
      shape: |
        namespace Repositories;
        class PersonRepository extends AbstractPdoRepository implements RepositoryInterface {
          public function findById(int $id): ?Domain\Person;
          public function findByOidcSubject(string $sub): ?Domain\Person;
        }
      verify: "grep -n 'class PersonRepository' crm/src/Repositories/PersonRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/ActionRepository.php"
      exports: ["ActionRepository"]
      shape: |
        namespace Repositories;
        class ActionRepository extends AbstractPdoRepository {
          public function findByTicketId(int $ticketId): array; // returns Action[]
          public function insert(Domain\Action $action): Domain\Action; // no update/delete — immutable
        }
      verify: "grep -n 'class ActionRepository' crm/src/Repositories/ActionRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/CategoryRepository.php"
      exports: ["CategoryRepository"]
      verify: "grep -n 'class CategoryRepository' crm/src/Repositories/CategoryRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/DepartmentRepository.php"
      exports: ["DepartmentRepository"]
      verify: "grep -n 'class DepartmentRepository' crm/src/Repositories/DepartmentRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/MediaRepository.php"
      exports: ["MediaRepository"]
      verify: "grep -n 'class MediaRepository' crm/src/Repositories/MediaRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/SubstatusRepository.php"
      exports: ["SubstatusRepository"]
      verify: "grep -n 'class SubstatusRepository' crm/src/Repositories/SubstatusRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/ClientRepository.php"
      exports: ["ClientRepository"]
      verify: "grep -n 'class ClientRepository' crm/src/Repositories/ClientRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/BookmarkRepository.php"
      exports: ["BookmarkRepository"]
      verify: "grep -n 'class BookmarkRepository' crm/src/Repositories/BookmarkRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/TemplateRepository.php"
      exports: ["TemplateRepository"]
      verify: "grep -n 'class TemplateRepository' crm/src/Repositories/TemplateRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/NotificationLogRepository.php"
      exports: ["NotificationLogRepository"]
      verify: "grep -n 'class NotificationLogRepository' crm/src/Repositories/NotificationLogRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Repositories/ContactMethodRepository.php"
      exports: ["ContactMethodRepository"]
      verify: "grep -n 'class ContactMethodRepository' crm/src/Repositories/ContactMethodRepository.php && echo CONTRACT_OK"
    - artifact: "crm/src/Domain/Ticket.php"
      exports: ["Domain\\Ticket"]
      shape: |
        readonly class Ticket {
          public int $id;
          public string $title;
          public ?string $description;
          public string $status; // 'open'|'closed'
          public string $datetimeOpened;
          public ?string $datetimeClosed;
          public string $datetimeUpdated;
          public ?string $deletedAt;
          public int $categoryId;
          public int $departmentId;
          public ?int $personId;
          public ?int $reporterPersonId;
          public ?string $reporterName;
          public ?string $reporterEmail;
          public ?string $reporterPhone;
          public ?string $address;
          public ?string $lat;
          public ?string $lng;
          public ?int $substatusId;
          public ?int $mergedIntoTicketId;
          public ?int $apiClientId;
          public ?string $customFields; // JSON string
          public static function fromRow(array $row): self;
        }
      verify: "grep -n 'readonly class Ticket' crm/src/Domain/Ticket.php && grep -n 'fromRow' crm/src/Domain/Ticket.php && echo CONTRACT_OK"
    - artifact: "crm/src/Domain/Person.php"
      exports: ["Domain\\Person"]
      shape: |
        readonly class Person {
          public int $id;
          public string $firstName;
          public string $lastName;
          public string $role; // 'admin'|'staff'|'public'
          public ?int $departmentId;
          public bool $active;
          public ?string $oidcSubject;
          public string $createdAt;
          public string $updatedAt;
          public static function fromRow(array $row): self;
        }
      verify: "grep -n 'readonly class Person' crm/src/Domain/Person.php && grep -n 'fromRow' crm/src/Domain/Person.php && echo CONTRACT_OK"
    - artifact: "crm/src/Domain/Action.php"
      exports: ["Domain\\Action"]
      shape: |
        readonly class Action {
          public int $id;
          public int $ticketId;
          public string $type; // 'open'|'assignment'|'closed'|'reopen'|'response'|'comment'|'upload'|'deleted'|'merged'|'substatus'|'notification_sent'
          public string $visibility; // 'external'|'internal'
          public ?int $actorPersonId;
          public ?int $actorClientId;
          public string $datetimeCreated;
          public ?string $payload; // JSON string
          public static function fromRow(array $row): self;
        }
      verify: "grep -n 'readonly class Action' crm/src/Domain/Action.php && grep -n 'fromRow' crm/src/Domain/Action.php && echo CONTRACT_OK"
    - artifact: "crm/src/Infrastructure/Database/PdoConnection.php"
      exports: ["Infrastructure\\Database\\PdoConnection"]
      verify: "grep -n 'class PdoConnection' crm/src/Infrastructure/Database/PdoConnection.php && echo CONTRACT_OK"
---

<objective>
Implement the PHP 8.5 typed repository pattern layer: `RepositoryInterface`, `AbstractPdoRepository`, `PdoConnection` infrastructure, all Domain value objects (plain readonly classes), and all named typed repositories (Ticket, Action, Person, Category, Department, Media, Substatus, Client, Bookmark, Template, NotificationLog, ContactMethod).

Purpose: Provide the clean data-access foundation that all Wave 2 backend controllers and services will call. No business logic lives here — repositories execute SQL via PDO and return typed Domain objects.

Output: 14 repository classes + 13 domain classes + PdoConnection — all in new `crm/src/Repositories/`, `crm/src/Domain/`, `crm/src/Infrastructure/` namespaces. Legacy `crm/src/Application/` files untouched.
</objective>

<feature_dependencies>
Implements: F16: RESTful JSON API Backend (repository pattern per TechArch §2), F0: Ticket Lifecycle Management (TicketRepository, ActionRepository), F2: Dept & Category Mgmt (CategoryRepository, DepartmentRepository), F3: People & Contacts (PersonRepository, ContactMethodRepository), F6: Audit Trail (ActionRepository — immutable insert-only), F7: Media (MediaRepository), F8: Notifications (NotificationLogRepository), F12: Bookmarks (BookmarkRepository), F13: Templates (TemplateRepository), F14: API Clients (ClientRepository), F17: Substatus (SubstatusRepository), F18: Ticket Merging (TicketRepository.merge support)
Depends on: None (Wave 1 — no prior plans)
Enables: F0, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13, F14, F16, F17, F18 (all Wave 2 backend waves consume these repositories)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@project_specs/TechArch-uReport.md

# Existing codebase reference (do NOT modify these files):
@crm/src/Application/PdoRepository.php
@crm/src/Application/ActiveRecord.php
@crm/src/Application/Database.php
</context>

<tasks>

<task type="auto">
  <name>Task 1: Domain value objects and PdoConnection infrastructure</name>
  <files>
    crm/src/Infrastructure/Database/PdoConnection.php
    crm/src/Domain/Ticket.php
    crm/src/Domain/Person.php
    crm/src/Domain/Category.php
    crm/src/Domain/Department.php
    crm/src/Domain/Action.php
    crm/src/Domain/Media.php
    crm/src/Domain/Substatus.php
    crm/src/Domain/Bookmark.php
    crm/src/Domain/Client.php
    crm/src/Domain/ContactMethod.php
    crm/src/Domain/Template.php
    crm/src/Domain/CategoryGroup.php
    crm/src/Domain/NotificationLog.php
    crm/composer.json
  </files>
  <action>
**Step 1: Update composer.json PSR-4 autoload** to add two new namespaces alongside existing ones.
Add to `autoload.psr-4`:
```json
"Repositories\\": "src/Repositories",
"Domain\\":       "src/Domain",
"Infrastructure\\": "src/Infrastructure"
```
NOTE: The existing `"Domain\\"` key already maps to `src/Domain` — if it conflicts, rename the new key to `"App\\Domain\\"` and use that namespace instead. Check existing composer.json first, then decide. Use `Domain\` as the namespace if free.

**Step 2: Create `crm/src/Infrastructure/Database/PdoConnection.php`**
This replaces `Application\Database` for new code (do NOT touch Database.php). Provides a PDO singleton using the same `$DATABASES` global used by the legacy code so both old and new code share one connection pool.

```php
<?php
declare(strict_types=1);
namespace Infrastructure\Database;

class PdoConnection
{
    private static array $instances = [];

    public static function get(string $db = 'default'): \PDO
    {
        global $DATABASES;

        if (!isset(self::$instances[$db]) && !empty($DATABASES[$db])) {
            $conf = $DATABASES[$db];
            $pdo  = new \PDO($conf['dsn'], $conf['user'], $conf['pass']);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
            $pdo->exec("SET NAMES utf8mb4");
            self::$instances[$db] = $pdo;
        }
        return self::$instances[$db];
    }

    /** Allow injecting a test PDO (replaces singleton) */
    public static function set(string $db, \PDO $pdo): void
    {
        self::$instances[$db] = $pdo;
    }
}
```

**Step 3: Create all Domain value objects**

All domain objects are **`readonly` classes** in namespace `Domain`. Every class has:
- `public readonly` typed properties matching EXACT column names from TechArch §3.2/3.3 DDL
- A static `fromRow(array $row): static` named constructor that maps DB rows to the object
- No ActiveRecord inheritance; no database calls; no business logic
- `null` safety for nullable columns
- JSON columns (`customFields`, `payload`, `fields`, `filterState`) stored as `?string` (raw JSON); callers decode

**`crm/src/Domain/Ticket.php`** — maps to `tickets` table (TechArch §3.2):
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Ticket
{
    public function __construct(
        public int     $id,
        public string  $title,
        public ?string $description,
        public string  $status,           // 'open'|'closed'
        public string  $datetimeOpened,
        public ?string $datetimeClosed,
        public string  $datetimeUpdated,
        public ?string $deletedAt,
        public int     $categoryId,
        public int     $departmentId,
        public ?int    $personId,
        public ?int    $reporterPersonId,
        public ?string $reporterName,
        public ?string $reporterEmail,
        public ?string $reporterPhone,
        public ?string $address,
        public ?string $lat,
        public ?string $lng,
        public ?int    $substatusId,
        public ?int    $mergedIntoTicketId,
        public ?int    $apiClientId,
        public ?string $customFields,     // raw JSON or null
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:                 (int) $row['id'],
            title:              $row['title'],
            description:        $row['description'] ?? null,
            status:             $row['status'],
            datetimeOpened:     $row['datetimeOpened'],
            datetimeClosed:     $row['datetimeClosed'] ?? null,
            datetimeUpdated:    $row['datetimeUpdated'],
            deletedAt:          $row['deletedAt'] ?? null,
            categoryId:         (int) $row['categoryId'],
            departmentId:       (int) $row['departmentId'],
            personId:           isset($row['personId']) ? (int) $row['personId'] : null,
            reporterPersonId:   isset($row['reporterPersonId']) ? (int) $row['reporterPersonId'] : null,
            reporterName:       $row['reporterName'] ?? null,
            reporterEmail:      $row['reporterEmail'] ?? null,
            reporterPhone:      $row['reporterPhone'] ?? null,
            address:            $row['address'] ?? null,
            lat:                $row['lat'] ?? null,
            lng:                $row['lng'] ?? null,
            substatusId:        isset($row['substatusId']) ? (int) $row['substatusId'] : null,
            mergedIntoTicketId: isset($row['mergedIntoTicketId']) ? (int) $row['mergedIntoTicketId'] : null,
            apiClientId:        isset($row['apiClientId']) ? (int) $row['apiClientId'] : null,
            customFields:       $row['customFields'] ?? null,
        );
    }
}
```

**`crm/src/Domain/Person.php`** — maps to `people` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Person
{
    public function __construct(
        public int     $id,
        public string  $firstName,
        public string  $lastName,
        public string  $role,         // 'admin'|'staff'|'public'
        public ?int    $departmentId,
        public bool    $active,
        public ?string $oidcSubject,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public function fullName(): string
    {
        return trim($this->firstName.' '.$this->lastName);
    }

    public static function fromRow(array $row): static
    {
        return new static(
            id:           (int) $row['id'],
            firstName:    $row['firstName'],
            lastName:     $row['lastName'],
            role:         $row['role'],
            departmentId: isset($row['departmentId']) ? (int) $row['departmentId'] : null,
            active:       (bool) $row['active'],
            oidcSubject:  $row['oidcSubject'] ?? null,
            createdAt:    $row['createdAt'],
            updatedAt:    $row['updatedAt'],
        );
    }
}
```

**`crm/src/Domain/Action.php`** — maps to `actions` table (IMMUTABLE — no update/delete):
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Action
{
    // Valid type values from TechArch DDL ENUM:
    public const TYPES = [
        'open','assignment','closed','reopen',
        'response','comment','upload',
        'deleted','merged','substatus','notification_sent',
    ];

    public function __construct(
        public int     $id,
        public int     $ticketId,
        public string  $type,        // one of self::TYPES
        public string  $visibility,  // 'external'|'internal'
        public ?int    $actorPersonId,
        public ?int    $actorClientId,
        public string  $datetimeCreated,
        public ?string $payload,     // raw JSON or null
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:              (int) $row['id'],
            ticketId:        (int) $row['ticketId'],
            type:            $row['type'],
            visibility:      $row['visibility'],
            actorPersonId:   isset($row['actorPersonId']) ? (int) $row['actorPersonId'] : null,
            actorClientId:   isset($row['actorClientId']) ? (int) $row['actorClientId'] : null,
            datetimeCreated: $row['datetimeCreated'],
            payload:         $row['payload'] ?? null,
        );
    }
}
```

**`crm/src/Domain/Department.php`** — maps to `departments` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Department
{
    public function __construct(
        public int     $id,
        public string  $name,
        public ?int    $defaultAssigneeId,
        public bool    $active,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:                (int) $row['id'],
            name:              $row['name'],
            defaultAssigneeId: isset($row['defaultAssigneeId']) ? (int) $row['defaultAssigneeId'] : null,
            active:            (bool) $row['active'],
            createdAt:         $row['createdAt'],
            updatedAt:         $row['updatedAt'],
        );
    }
}
```

**`crm/src/Domain/Category.php`** — maps to `categories` table including `fields` JSON column:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Category
{
    public function __construct(
        public int     $id,
        public string  $name,
        public int     $departmentId,
        public ?int    $groupId,
        public ?int    $slaDays,
        public string  $displayPermission,  // 'public'|'staff'|'anonymous'
        public string  $postingPermission,  // 'staff'|'public'|'anonymous'
        public ?int    $defaultAssigneeId,
        public ?int    $autoCloseDays,
        public bool    $active,
        public ?string $fields,             // raw JSON array string or null
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:                (int) $row['id'],
            name:              $row['name'],
            departmentId:      (int) $row['departmentId'],
            groupId:           isset($row['groupId']) ? (int) $row['groupId'] : null,
            slaDays:           isset($row['slaDays']) ? (int) $row['slaDays'] : null,
            displayPermission: $row['displayPermission'],
            postingPermission: $row['postingPermission'],
            defaultAssigneeId: isset($row['defaultAssigneeId']) ? (int) $row['defaultAssigneeId'] : null,
            autoCloseDays:     isset($row['autoCloseDays']) ? (int) $row['autoCloseDays'] : null,
            active:            (bool) $row['active'],
            fields:            $row['fields'] ?? null,
            createdAt:         $row['createdAt'],
            updatedAt:         $row['updatedAt'],
        );
    }
}
```

**`crm/src/Domain/CategoryGroup.php`** — maps to `categoryGroups` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class CategoryGroup
{
    public function __construct(
        public int    $id,
        public string $name,
        public int    $sortOrder,
        public bool   $active,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:        (int) $row['id'],
            name:      $row['name'],
            sortOrder: (int) $row['sortOrder'],
            active:    (bool) $row['active'],
        );
    }
}
```

**`crm/src/Domain/Substatus.php`** — maps to `substatus` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Substatus
{
    public function __construct(
        public int    $id,
        public string $label,
        public string $primaryStatus,  // 'open'|'closed'
        public bool   $isDefault,
        public bool   $active,
        public int    $sortOrder,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:            (int) $row['id'],
            label:         $row['label'],
            primaryStatus: $row['primaryStatus'],
            isDefault:     (bool) $row['isDefault'],
            active:        (bool) $row['active'],
            sortOrder:     (int) $row['sortOrder'],
            createdAt:     $row['createdAt'],
            updatedAt:     $row['updatedAt'],
        );
    }
}
```

**`crm/src/Domain/Client.php`** — maps to `clients` table (NOTE: `apiKeyHash` stored, plain key never stored in domain):
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Client
{
    public function __construct(
        public int     $id,
        public string  $name,
        public string  $contactEmail,
        public string  $apiKeyHash,   // bcrypt hash — never expose in API responses
        public string  $apiKeyHint,   // first 8 chars of plain key
        public ?string $notes,
        public bool    $active,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:           (int) $row['id'],
            name:         $row['name'],
            contactEmail: $row['contactEmail'],
            apiKeyHash:   $row['apiKeyHash'],
            apiKeyHint:   $row['apiKeyHint'],
            notes:        $row['notes'] ?? null,
            active:       (bool) $row['active'],
            createdAt:    $row['createdAt'],
            updatedAt:    $row['updatedAt'],
        );
    }
}
```

**`crm/src/Domain/Media.php`** — maps to `media` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Media
{
    public function __construct(
        public int     $id,
        public int     $ticketId,
        public string  $filename,
        public ?string $originalName,
        public string  $mimeType,
        public int     $size,
        public string  $path,
        public ?string $thumbnailPath,
        public ?string $sourceUrl,
        public ?string $label,
        public ?string $deletedAt,
        public string  $createdAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:            (int) $row['id'],
            ticketId:      (int) $row['ticketId'],
            filename:      $row['filename'],
            originalName:  $row['originalName'] ?? null,
            mimeType:      $row['mimeType'],
            size:          (int) $row['size'],
            path:          $row['path'],
            thumbnailPath: $row['thumbnailPath'] ?? null,
            sourceUrl:     $row['sourceUrl'] ?? null,
            label:         $row['label'] ?? null,
            deletedAt:     $row['deletedAt'] ?? null,
            createdAt:     $row['createdAt'],
        );
    }
}
```

**`crm/src/Domain/ContactMethod.php`** — maps to `contactMethods` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class ContactMethod
{
    public function __construct(
        public int     $id,
        public int     $personId,
        public string  $type,       // 'email'|'phone'|'address'
        public string  $value,
        public ?string $phoneType,  // 'mobile'|'office'|'home'|null
        public bool    $isPrimary,
        public ?string $label,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:         (int) $row['id'],
            personId:   (int) $row['personId'],
            type:       $row['type'],
            value:      $row['value'],
            phoneType:  $row['phoneType'] ?? null,
            isPrimary:  (bool) $row['isPrimary'],
            label:      $row['label'] ?? null,
        );
    }
}
```

**`crm/src/Domain/Bookmark.php`** — maps to `bookmarks` table (`filterState` is JSON):
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Bookmark
{
    public function __construct(
        public int    $id,
        public int    $personId,
        public string $name,
        public string $filterState, // raw JSON string (F04 search params)
        public string $createdAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:          (int) $row['id'],
            personId:    (int) $row['personId'],
            name:        $row['name'],
            filterState: $row['filterState'],
            createdAt:   $row['createdAt'],
        );
    }
}
```

**`crm/src/Domain/Template.php`** — maps to `templates` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class Template
{
    public function __construct(
        public int     $id,
        public string  $name,
        public ?string $subject,
        public string  $body,
        public ?string $slug,   // null for user-created; set for system templates
        public bool    $active,
        public string  $createdAt,
        public string  $updatedAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:        (int) $row['id'],
            name:      $row['name'],
            subject:   $row['subject'] ?? null,
            body:      $row['body'],
            slug:      $row['slug'] ?? null,
            active:    (bool) $row['active'],
            createdAt: $row['createdAt'],
            updatedAt: $row['updatedAt'],
        );
    }
}
```

**`crm/src/Domain/NotificationLog.php`** — maps to `notification_log` table:
```php
<?php
declare(strict_types=1);
namespace Domain;

readonly class NotificationLog
{
    public function __construct(
        public int     $id,
        public ?int    $ticketId,
        public string  $templateSlug,
        public string  $recipientEmail,
        public ?string $sentAt,
        public string  $status,         // 'sent'|'failed'|'skipped'
        public int     $attemptCount,
        public ?string $errorMessage,
        public string  $createdAt,
    ) {}

    public static function fromRow(array $row): static
    {
        return new static(
            id:             (int) $row['id'],
            ticketId:       isset($row['ticketId']) ? (int) $row['ticketId'] : null,
            templateSlug:   $row['templateSlug'],
            recipientEmail: $row['recipientEmail'],
            sentAt:         $row['sentAt'] ?? null,
            status:         $row['status'],
            attemptCount:   (int) $row['attemptCount'],
            errorMessage:   $row['errorMessage'] ?? null,
            createdAt:      $row['createdAt'],
        );
    }
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm
# Autoload dump succeeds
composer dump-autoload --quiet && echo "AUTOLOAD OK"

# All domain files exist
ls src/Domain/Ticket.php src/Domain/Person.php src/Domain/Action.php src/Domain/Department.php src/Domain/Category.php src/Domain/CategoryGroup.php src/Domain/Substatus.php src/Domain/Client.php src/Domain/Media.php src/Domain/ContactMethod.php src/Domain/Bookmark.php src/Domain/Template.php src/Domain/NotificationLog.php && echo "DOMAIN FILES OK"

# PdoConnection exists
ls src/Infrastructure/Database/PdoConnection.php && echo "PDOCONN OK"

# fromRow present in key domain files
grep -l "fromRow" src/Domain/*.php | wc -l | grep -q "13" && echo "FROMROW OK" || echo "FROMROW COUNT MISMATCH — check individual files"

# PHPStan on domain layer (no DB needed — pure value objects)
vendor/bin/phpstan analyse src/Domain/ src/Infrastructure/ --level=8 --no-progress 2>&1 | tail -5
```
  </verify>
  <done>
- `composer dump-autoload` exits 0 with no errors
- All 13 Domain/*.php files exist with `readonly class` and `fromRow(array $row): static`
- `crm/src/Infrastructure/Database/PdoConnection.php` exists with `static get()` and `static set()` methods
- PHPStan level 8 passes on `src/Domain/` and `src/Infrastructure/` with 0 errors (pure value objects need no DB)
- EXACT column names from TechArch DDL used throughout (e.g., `datetimeOpened` not `created_at`, `apiKeyHash` not `api_key_hash`)
  </done>
</task>

<task type="auto">
  <name>Task 2: RepositoryInterface, AbstractPdoRepository, and all typed repository classes</name>
  <files>
    crm/src/Repositories/RepositoryInterface.php
    crm/src/Repositories/AbstractPdoRepository.php
    crm/src/Repositories/TicketRepository.php
    crm/src/Repositories/ActionRepository.php
    crm/src/Repositories/PersonRepository.php
    crm/src/Repositories/CategoryRepository.php
    crm/src/Repositories/DepartmentRepository.php
    crm/src/Repositories/MediaRepository.php
    crm/src/Repositories/SubstatusRepository.php
    crm/src/Repositories/ClientRepository.php
    crm/src/Repositories/BookmarkRepository.php
    crm/src/Repositories/TemplateRepository.php
    crm/src/Repositories/NotificationLogRepository.php
    crm/src/Repositories/ContactMethodRepository.php
  </files>
  <action>
**Step 1: `crm/src/Repositories/RepositoryInterface.php`**

Generic interface. All methods type-hinted with `object` at interface level; concrete repositories override with covariant Domain types.

```php
<?php
declare(strict_types=1);
namespace Repositories;

interface RepositoryInterface
{
    public function findById(int $id): ?object;
    public function save(object $entity): object;
    public function delete(int $id): void;
}
```

**Step 2: `crm/src/Repositories/AbstractPdoRepository.php`**

Provides: PDO from PdoConnection, paginated SELECT helper, transaction wrappers.

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Infrastructure\Database\PdoConnection;

abstract class AbstractPdoRepository
{
    protected \PDO $pdo;

    public function __construct()
    {
        $this->pdo = PdoConnection::get();
    }

    /**
     * Execute a SELECT and return ['rows' => Domain[], 'total' => int].
     * $hydrate is a callable(array $row): object.
     */
    protected function paginate(
        string   $sql,
        array    $params,
        callable $hydrate,
        int      $page    = 1,
        int      $perPage = 25,
    ): array {
        $page    = max(1, $page);
        $perPage = max(1, min(100, $perPage));

        // Count query
        $countSql = "SELECT COUNT(*) AS cnt FROM ($sql) AS _sub";
        $stmt     = $this->pdo->prepare($countSql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();

        // Data query
        $offset = ($page - 1) * $perPage;
        $stmt   = $this->pdo->prepare("$sql LIMIT :limit OFFSET :offset");
        // Bind named params first, then add pagination
        foreach ($params as $key => $val) {
            $stmt->bindValue(":$key", $val);
        }
        $stmt->bindValue(':limit',  $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset,  \PDO::PARAM_INT);
        $stmt->execute();

        $rows = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $rows[] = $hydrate($row);
        }

        return ['rows' => $rows, 'total' => $total];
    }

    /**
     * Execute a SELECT with no pagination; returns array of hydrated objects.
     */
    protected function fetchAll(string $sql, array $params, callable $hydrate): array
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $rows[] = $hydrate($row);
        }
        return $rows;
    }

    /** Return last inserted auto-increment ID */
    protected function lastInsertId(): int
    {
        return (int) $this->pdo->lastInsertId();
    }

    public function beginTransaction(): void { $this->pdo->beginTransaction(); }
    public function commit(): void           { $this->pdo->commit(); }
    public function rollback(): void         { $this->pdo->rollBack(); }
}
```

**Step 3: `crm/src/Repositories/TicketRepository.php`**

Primary data access class for the `tickets` table. Complex enough to warrant detailed attention.

Key responsibilities: CRUD on `tickets`, soft-delete (`deletedAt`), find-with-filters (status, category, dept, assignee, date range, reporter), merge support (update `mergedIntoTicketId`, `status = 'closed'`).

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Ticket;

class TicketRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Ticket
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM tickets WHERE id = :id AND deletedAt IS NULL'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Ticket::fromRow($row) : null;
    }

    /** Find including soft-deleted (for admin / audit) */
    public function findByIdIncludeDeleted(int $id): ?Ticket
    {
        $stmt = $this->pdo->prepare('SELECT * FROM tickets WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Ticket::fromRow($row) : null;
    }

    /**
     * Filtered list — used by SearchController (MySQL fallback when Solr unavailable).
     * $filters keys: status, categoryId, departmentId, personId, substatusId,
     *                reporterEmail, dateFrom, dateTo, deletedAt (boolean).
     * Returns ['rows' => Ticket[], 'total' => int].
     */
    public function findByFilters(
        array  $filters = [],
        int    $page    = 1,
        int    $perPage = 25,
        string $order   = 'datetimeOpened DESC',
    ): array {
        $where  = ['t.deletedAt IS NULL'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[]          = 't.status = :status';
            $params['status'] = $filters['status'];
        }
        if (!empty($filters['categoryId'])) {
            $where[]            = 't.categoryId = :categoryId';
            $params['categoryId'] = $filters['categoryId'];
        }
        if (!empty($filters['departmentId'])) {
            $where[]              = 't.departmentId = :departmentId';
            $params['departmentId'] = $filters['departmentId'];
        }
        if (!empty($filters['personId'])) {
            $where[]          = 't.personId = :personId';
            $params['personId'] = $filters['personId'];
        }
        if (!empty($filters['substatusId'])) {
            $where[]             = 't.substatusId = :substatusId';
            $params['substatusId'] = $filters['substatusId'];
        }
        if (!empty($filters['reporterEmail'])) {
            $where[]               = 't.reporterEmail = :reporterEmail';
            $params['reporterEmail'] = $filters['reporterEmail'];
        }
        if (!empty($filters['dateFrom'])) {
            $where[]           = 't.datetimeOpened >= :dateFrom';
            $params['dateFrom'] = $filters['dateFrom'];
        }
        if (!empty($filters['dateTo'])) {
            $where[]         = 't.datetimeOpened <= :dateTo';
            $params['dateTo'] = $filters['dateTo'];
        }

        $whereClause = $where ? 'WHERE '.implode(' AND ', $where) : '';
        $sql = "SELECT t.* FROM tickets t $whereClause ORDER BY t.$order";

        return $this->paginate($sql, $params, fn($row) => Ticket::fromRow($row), $page, $perPage);
    }

    /**
     * Insert or update a ticket.
     * For INSERT: $ticket->id must be 0 or negative (not set).
     * Returns Ticket with id populated.
     */
    public function save(object $entity): Ticket
    {
        /** @var Ticket $entity */
        $data = [
            'title'              => $entity->title,
            'description'        => $entity->description,
            'status'             => $entity->status,
            'datetimeOpened'     => $entity->datetimeOpened,
            'datetimeClosed'     => $entity->datetimeClosed,
            'categoryId'         => $entity->categoryId,
            'departmentId'       => $entity->departmentId,
            'personId'           => $entity->personId,
            'reporterPersonId'   => $entity->reporterPersonId,
            'reporterName'       => $entity->reporterName,
            'reporterEmail'      => $entity->reporterEmail,
            'reporterPhone'      => $entity->reporterPhone,
            'address'            => $entity->address,
            'lat'                => $entity->lat,
            'lng'                => $entity->lng,
            'substatusId'        => $entity->substatusId,
            'mergedIntoTicketId' => $entity->mergedIntoTicketId,
            'apiClientId'        => $entity->apiClientId,
            'customFields'       => $entity->customFields,
        ];

        if ($entity->id > 0) {
            // UPDATE
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE tickets SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            // INSERT
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO tickets ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? Ticket::fromRow(array_merge($data, ['id' => $newId, 'datetimeUpdated' => date('Y-m-d H:i:s'), 'deletedAt' => null]));
        }
    }

    /** Soft-delete by setting deletedAt = NOW() */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE tickets SET deletedAt = NOW() WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }

    /** For merge: set mergedIntoTicketId and close source ticket */
    public function setMerged(int $sourceId, int $targetId): void
    {
        $stmt = $this->pdo->prepare(
            "UPDATE tickets SET mergedIntoTicketId = :targetId, status = 'closed', datetimeClosed = NOW() WHERE id = :sourceId"
        );
        $stmt->execute(['targetId' => $targetId, 'sourceId' => $sourceId]);
    }

    /** Find tickets matching IDs (used after Solr returns IDs) */
    public function findByIds(array $ids): array
    {
        if (empty($ids)) { return []; }
        $in   = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare("SELECT * FROM tickets WHERE id IN ($in) AND deletedAt IS NULL");
        $stmt->execute(array_values($ids));
        $rows = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $rows[] = Ticket::fromRow($row);
        }
        return $rows;
    }
}
```

**Step 4: `crm/src/Repositories/ActionRepository.php`**

IMPORTANT: Actions are IMMUTABLE per TechArch §3.2. Only `insert` is allowed — no `update`, no physical `delete`. The `save()` method delegates to `insert()`. `delete()` throws `\LogicException`.

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Action;

class ActionRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Action
    {
        $stmt = $this->pdo->prepare('SELECT * FROM actions WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Action::fromRow($row) : null;
    }

    /** @return Action[] */
    public function findByTicketId(int $ticketId): array
    {
        return $this->fetchAll(
            'SELECT * FROM actions WHERE ticketId = :ticketId ORDER BY datetimeCreated ASC',
            ['ticketId' => $ticketId],
            fn($row) => Action::fromRow($row),
        );
    }

    /** Insert a new action; returns the persisted Action with id set. */
    public function insert(Action $action): Action
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO actions (ticketId, type, visibility, actorPersonId, actorClientId, datetimeCreated, payload)
             VALUES (:ticketId, :type, :visibility, :actorPersonId, :actorClientId, :datetimeCreated, :payload)'
        );
        $stmt->execute([
            'ticketId'        => $action->ticketId,
            'type'            => $action->type,
            'visibility'      => $action->visibility,
            'actorPersonId'   => $action->actorPersonId,
            'actorClientId'   => $action->actorClientId,
            'datetimeCreated' => $action->datetimeCreated,
            'payload'         => $action->payload,
        ]);
        return $this->findById($this->lastInsertId()) ?? $action;
    }

    /** Delegates to insert(). $entity MUST be a Domain\Action. */
    public function save(object $entity): Action
    {
        /** @var Action $entity */
        return $this->insert($entity);
    }

    /** Actions are immutable — throws LogicException. */
    public function delete(int $id): void
    {
        throw new \LogicException('Actions are immutable and cannot be deleted.');
    }
}
```

**Step 5: `crm/src/Repositories/PersonRepository.php`**

Key extras: `findByOidcSubject()` for OIDC callback, `findWithFilters()` for people search.

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Person;

class PersonRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Person
    {
        $stmt = $this->pdo->prepare('SELECT * FROM people WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Person::fromRow($row) : null;
    }

    public function findByOidcSubject(string $sub): ?Person
    {
        $stmt = $this->pdo->prepare('SELECT * FROM people WHERE oidcSubject = :sub LIMIT 1');
        $stmt->execute(['sub' => $sub]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Person::fromRow($row) : null;
    }

    public function findByEmail(string $email): ?Person
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.* FROM people p
             JOIN contactMethods cm ON cm.personId = p.id
             WHERE cm.type = \'email\' AND cm.value = :email LIMIT 1'
        );
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Person::fromRow($row) : null;
    }

    public function findWithFilters(array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $where  = [];
        $params = [];

        if (isset($filters['role'])) {
            $where[]        = 'p.role = :role';
            $params['role'] = $filters['role'];
        }
        if (isset($filters['departmentId'])) {
            $where[]                = 'p.departmentId = :departmentId';
            $params['departmentId'] = $filters['departmentId'];
        }
        if (isset($filters['active'])) {
            $where[]          = 'p.active = :active';
            $params['active'] = (int) $filters['active'];
        }

        $whereClause = $where ? 'WHERE '.implode(' AND ', $where) : '';
        $sql = "SELECT p.* FROM people p $whereClause ORDER BY p.lastName ASC, p.firstName ASC";

        return $this->paginate($sql, $params, fn($row) => Person::fromRow($row), $page, $perPage);
    }

    public function save(object $entity): Person
    {
        /** @var Person $entity */
        $data = [
            'firstName'   => $entity->firstName,
            'lastName'    => $entity->lastName,
            'role'        => $entity->role,
            'departmentId'=> $entity->departmentId,
            'active'      => (int) $entity->active,
            'oidcSubject' => $entity->oidcSubject,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE people SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
            return $this->findById($entity->id) ?? $entity;
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO people ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $newId = $this->lastInsertId();
            return $this->findById($newId) ?? $entity;
        }
    }

    /** Soft-deactivate: preserve record for history */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE people SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
```

**Step 6: `crm/src/Repositories/DepartmentRepository.php`**

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Department;

class DepartmentRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Department
    {
        $stmt = $this->pdo->prepare('SELECT * FROM departments WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Department::fromRow($row) : null;
    }

    /** @return Department[] */
    public function findAll(bool $activeOnly = true): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM departments WHERE active = 1 ORDER BY name ASC'
            : 'SELECT * FROM departments ORDER BY name ASC';
        return $this->fetchAll($sql, [], fn($row) => Department::fromRow($row));
    }

    public function save(object $entity): Department
    {
        /** @var Department $entity */
        $data = [
            'name'              => $entity->name,
            'defaultAssigneeId' => $entity->defaultAssigneeId,
            'active'            => (int) $entity->active,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE departments SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO departments ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $entity = $this->findById($this->lastInsertId()) ?? $entity;
        }
        return $this->findById($entity->id) ?? $entity;
    }

    /** Soft-deactivate */
    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE departments SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
```

**Step 7: `crm/src/Repositories/CategoryRepository.php`**

```php
<?php
declare(strict_types=1);
namespace Repositories;

use Domain\Category;

class CategoryRepository extends AbstractPdoRepository implements RepositoryInterface
{
    public function findById(int $id): ?Category
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categories WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? Category::fromRow($row) : null;
    }

    /** @return Category[] */
    public function findAll(bool $activeOnly = false): array
    {
        $sql = $activeOnly
            ? 'SELECT * FROM categories WHERE active = 1 ORDER BY name ASC'
            : 'SELECT * FROM categories ORDER BY name ASC';
        return $this->fetchAll($sql, [], fn($row) => Category::fromRow($row));
    }

    /** @return Category[] filtered by departmentId */
    public function findByDepartment(int $departmentId): array
    {
        return $this->fetchAll(
            'SELECT * FROM categories WHERE departmentId = :deptId AND active = 1 ORDER BY name ASC',
            ['deptId' => $departmentId],
            fn($row) => Category::fromRow($row),
        );
    }

    public function save(object $entity): Category
    {
        /** @var Category $entity */
        $data = [
            'name'               => $entity->name,
            'departmentId'       => $entity->departmentId,
            'groupId'            => $entity->groupId,
            'slaDays'            => $entity->slaDays,
            'displayPermission'  => $entity->displayPermission,
            'postingPermission'  => $entity->postingPermission,
            'defaultAssigneeId'  => $entity->defaultAssigneeId,
            'autoCloseDays'      => $entity->autoCloseDays,
            'active'             => (int) $entity->active,
            'fields'             => $entity->fields,
        ];

        if ($entity->id > 0) {
            $set  = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
            $stmt = $this->pdo->prepare("UPDATE categories SET $set WHERE id = :id");
            $data['id'] = $entity->id;
            $stmt->execute($data);
        } else {
            $cols = implode(', ', array_keys($data));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));
            $stmt = $this->pdo->prepare("INSERT INTO categories ($cols) VALUES ($vals)");
            $stmt->execute($data);
            $entity = $this->findById($this->lastInsertId()) ?? $entity;
        }
        return $this->findById($entity->id) ?? $entity;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("UPDATE categories SET active = 0 WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
```

**Step 8: Remaining repositories** — follow the same pattern. Each class has the same structure: `findById`, `findAll`/`findBy*`, `save` (INSERT or UPDATE), `delete` (deactivate or hard-delete as appropriate), uses `$this->pdo` from `AbstractPdoRepository`.

**`crm/src/Repositories/SubstatusRepository.php`**
- Table: `substatus`
- `findAll(bool $activeOnly = true)`: returns all substatus records sorted by `sortOrder ASC`
- `findByPrimaryStatus(string $status)`: returns substatuses matching `primaryStatus`
- `save()`: INSERT/UPDATE with all columns from TechArch DDL (`label`, `primaryStatus`, `isDefault`, `active`, `sortOrder`)
- `delete()`: hard delete (OK — substatus records cascade to tickets.substatusId ON DELETE SET NULL via DB constraint; check TechArch — if not, soft-delete by `active = 0`)

**`crm/src/Repositories/ClientRepository.php`**
- Table: `clients`
- `findByApiKeyHash(string $hash)`: used for Open311 API key validation
- `findAll(bool $activeOnly = true)`: list for admin
- `save()`: INSERT/UPDATE with `name`, `contactEmail`, `apiKeyHash`, `apiKeyHint`, `notes`, `active`
- `delete()`: soft-deactivate (`active = 0`)
- NOTE: `apiKeyHash` is bcrypt — CallerService is responsible for hashing before passing to save()

**`crm/src/Repositories/BookmarkRepository.php`**
- Table: `bookmarks`
- `findByPersonId(int $personId)`: returns all bookmarks for the authenticated user
- `save()`: INSERT (`personId`, `name`, `filterState` JSON string) — no UPDATE (delete+create to replace)
- `delete()`: hard delete (personal data, no historical reference needed)

**`crm/src/Repositories/MediaRepository.php`**
- Table: `media`
- `findByTicketId(int $ticketId, bool $includeDeleted = false)`: returns media for ticket
- `save()`: INSERT/UPDATE with all columns
- `delete()`: soft-delete (`deletedAt = NOW()`)

**`crm/src/Repositories/TemplateRepository.php`**
- Table: `templates`
- `findBySlug(string $slug)`: for system template lookup (e.g., `ticket_created`)
- `findAll(bool $activeOnly = false)`: all templates
- `save()`: INSERT/UPDATE; `slug` is NULLABLE (only system templates have slugs) — do not overwrite existing slug on update
- `delete()`: set `active = 0`

**`crm/src/Repositories/NotificationLogRepository.php`**
- Table: `notification_log`
- `findByTicketId(int $ticketId)`: audit log for a ticket's notifications
- `insert(NotificationLog $entry)`: INSERT only — no update/delete (audit trail)
- `save()`: delegates to `insert()`
- `delete()`: throws `\LogicException` — logs are immutable

**`crm/src/Repositories/ContactMethodRepository.php`**
- Table: `contactMethods`
- `findByPersonId(int $personId)`: all contact methods for a person
- `findPrimaryEmail(int $personId)`: returns the `isPrimary = 1, type = 'email'` record or first email
- `save()`: INSERT/UPDATE; when `isPrimary = true` on save, first demote all other records of same `type` for same `personId` to `isPrimary = 0`
- `delete()`: hard delete (no historical dependency)
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# All repository files exist
ls src/Repositories/RepositoryInterface.php \
   src/Repositories/AbstractPdoRepository.php \
   src/Repositories/TicketRepository.php \
   src/Repositories/ActionRepository.php \
   src/Repositories/PersonRepository.php \
   src/Repositories/CategoryRepository.php \
   src/Repositories/DepartmentRepository.php \
   src/Repositories/MediaRepository.php \
   src/Repositories/SubstatusRepository.php \
   src/Repositories/ClientRepository.php \
   src/Repositories/BookmarkRepository.php \
   src/Repositories/TemplateRepository.php \
   src/Repositories/NotificationLogRepository.php \
   src/Repositories/ContactMethodRepository.php && echo "ALL REPO FILES EXIST"

# Autoload regeneration
composer dump-autoload --quiet && echo "AUTOLOAD OK"

# RepositoryInterface is implemented by all named repositories
for repo in Ticket Action Person Category Department Media Substatus Client Bookmark Template NotificationLog ContactMethod; do
  grep -q "implements RepositoryInterface" src/Repositories/${repo}Repository.php && echo "${repo}Repository: OK" || echo "${repo}Repository: MISSING RepositoryInterface"
done

# ActionRepository.delete() throws LogicException (immutability)
grep -q "LogicException" src/Repositories/ActionRepository.php && echo "ActionRepository immutability: OK"

# NotificationLogRepository.delete() throws LogicException
grep -q "LogicException" src/Repositories/NotificationLogRepository.php && echo "NotificationLogRepository immutability: OK"

# PHPStan on all new code
vendor/bin/phpstan analyse src/Repositories/ src/Domain/ src/Infrastructure/ --level=8 --no-progress 2>&1 | tail -10

# Legacy Application/ directory untouched — spot check
stat src/Application/PdoRepository.php && stat src/Application/ActiveRecord.php && echo "LEGACY UNTOUCHED"
```
  </verify>
  <done>
- All 14 repository files exist in `crm/src/Repositories/`
- Every named repository extends `AbstractPdoRepository` and implements `RepositoryInterface`
- `ActionRepository.delete()` throws `\LogicException` (immutability per TechArch §3.2 note)
- `NotificationLogRepository.delete()` throws `\LogicException` (audit log immutability)
- `TicketRepository.setMerged()` exists (supports F18 merge flow)
- `PersonRepository.findByOidcSubject()` exists (supports F11 OIDC callback)
- `ClientRepository.findByApiKeyHash()` exists (supports F1/F14 Open311 API key validation)
- `ContactMethodRepository.save()` demotes other primary methods of same type before promoting new primary
- `AbstractPdoRepository.paginate()` returns `['rows' => [], 'total' => int]` with working LIMIT/OFFSET
- PHPStan level 8 passes on `src/Repositories/`, `src/Domain/`, `src/Infrastructure/` with 0 errors
- `composer dump-autoload` exits 0
- Legacy `crm/src/Application/` files have identical mtime to before this task ran (untouched)
  </done>
</task>

<task type="auto">
  <name>Task 3: PHPUnit repository tests (unit + integration stubs)</name>
  <files>
    crm/src/Test/Unit/Domain/TicketTest.php
    crm/src/Test/Unit/Domain/PersonTest.php
    crm/src/Test/Unit/Domain/ActionTest.php
    crm/src/Test/Unit/Repository/ActionRepositoryImmutabilityTest.php
    crm/src/Test/Unit/Repository/ContactMethodRepositoryPrimaryTest.php
    crm/phpunit.xml
  </files>
  <action>
Write PHPUnit 11.x unit tests for the new domain and repository layer. These tests must NOT hit MySQL — they use in-memory PDO (SQLite where possible) or mock PDO via PHPUnit mocks.

**`crm/phpunit.xml`** — configure test suites. If it already exists, add the new `Unit/Domain` and `Unit/Repository` directories; do not remove existing config.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="src/Test/bootstrap.php"
         colors="true">
  <testsuites>
    <testsuite name="Unit">
      <directory>src/Test/Unit</directory>
    </testsuite>
    <testsuite name="Integration">
      <directory>src/Test/Integration</directory>
    </testsuite>
  </testsuites>
  <source>
    <include>
      <directory>src/Repositories</directory>
      <directory>src/Domain</directory>
      <directory>src/Infrastructure</directory>
    </include>
  </source>
</phpunit>
```

**`crm/src/Test/Unit/Domain/TicketTest.php`** — tests `Ticket::fromRow()` correctness:

```php
<?php
declare(strict_types=1);
namespace Test\Unit\Domain;

use Domain\Ticket;
use PHPUnit\Framework\TestCase;

class TicketTest extends TestCase
{
    private function sampleRow(): array
    {
        return [
            'id'                 => '42',
            'title'              => 'Pothole on Main St',
            'description'        => 'Large pothole near intersection',
            'status'             => 'open',
            'datetimeOpened'     => '2026-06-23 10:00:00',
            'datetimeClosed'     => null,
            'datetimeUpdated'    => '2026-06-23 10:00:00',
            'deletedAt'          => null,
            'categoryId'         => '1',
            'departmentId'       => '2',
            'personId'           => null,
            'reporterPersonId'   => null,
            'reporterName'       => 'John Smith',
            'reporterEmail'      => 'john@example.com',
            'reporterPhone'      => null,
            'address'            => '123 Main St',
            'lat'                => '43.1234567',
            'lng'                => '-79.5678901',
            'substatusId'        => null,
            'mergedIntoTicketId' => null,
            'apiClientId'        => null,
            'customFields'       => null,
        ];
    }

    public function testFromRowCreatesTypedTicket(): void
    {
        $ticket = Ticket::fromRow($this->sampleRow());

        $this->assertSame(42, $ticket->id);
        $this->assertSame('Pothole on Main St', $ticket->title);
        $this->assertSame('open', $ticket->status);
        $this->assertSame(1, $ticket->categoryId);
        $this->assertSame(2, $ticket->departmentId);
        $this->assertNull($ticket->personId);
        $this->assertNull($ticket->deletedAt);
        $this->assertNull($ticket->customFields);
    }

    public function testFromRowNullablesAreNull(): void
    {
        $ticket = Ticket::fromRow($this->sampleRow());

        $this->assertNull($ticket->datetimeClosed);
        $this->assertNull($ticket->reporterPersonId);
        $this->assertNull($ticket->substatusId);
        $this->assertNull($ticket->mergedIntoTicketId);
        $this->assertNull($ticket->apiClientId);
    }

    public function testTicketIsReadonly(): void
    {
        $ticket = Ticket::fromRow($this->sampleRow());

        $this->expectException(\Error::class);
        // @phpstan-ignore-next-line
        $ticket->id = 99; // readonly — must throw
    }
}
```

**`crm/src/Test/Unit/Domain/PersonTest.php`**:

```php
<?php
declare(strict_types=1);
namespace Test\Unit\Domain;

use Domain\Person;
use PHPUnit\Framework\TestCase;

class PersonTest extends TestCase
{
    public function testFromRowCreatesTypedPerson(): void
    {
        $row = [
            'id'           => '5',
            'firstName'    => 'Alice',
            'lastName'     => 'Admin',
            'role'         => 'admin',
            'departmentId' => '3',
            'active'       => '1',
            'oidcSubject'  => 'sub|abc123',
            'createdAt'    => '2026-01-01 00:00:00',
            'updatedAt'    => '2026-01-01 00:00:00',
        ];
        $person = Person::fromRow($row);

        $this->assertSame(5, $person->id);
        $this->assertSame('Alice', $person->firstName);
        $this->assertSame('admin', $person->role);
        $this->assertSame(3, $person->departmentId);
        $this->assertTrue($person->active);
        $this->assertSame('Alice Admin', $person->fullName());
    }

    public function testFromRowNullDepartment(): void
    {
        $row = [
            'id' => '1', 'firstName' => 'Bob', 'lastName' => 'User',
            'role' => 'public', 'departmentId' => null, 'active' => '1',
            'oidcSubject' => null, 'createdAt' => '2026-01-01 00:00:00',
            'updatedAt' => '2026-01-01 00:00:00',
        ];
        $person = Person::fromRow($row);
        $this->assertNull($person->departmentId);
        $this->assertNull($person->oidcSubject);
    }
}
```

**`crm/src/Test/Unit/Domain/ActionTest.php`**:

```php
<?php
declare(strict_types=1);
namespace Test\Unit\Domain;

use Domain\Action;
use PHPUnit\Framework\TestCase;

class ActionTest extends TestCase
{
    public function testFromRowCreatesTypedAction(): void
    {
        $row = [
            'id'              => '10',
            'ticketId'        => '42',
            'type'            => 'open',
            'visibility'      => 'internal',
            'actorPersonId'   => '5',
            'actorClientId'   => null,
            'datetimeCreated' => '2026-06-23 10:00:00',
            'payload'         => '{"note":"initial open"}',
        ];
        $action = Action::fromRow($row);

        $this->assertSame(10, $action->id);
        $this->assertSame(42, $action->ticketId);
        $this->assertSame('open', $action->type);
        $this->assertSame(5, $action->actorPersonId);
        $this->assertNull($action->actorClientId);
        $this->assertSame('{"note":"initial open"}', $action->payload);
    }

    public function testActionTypesConstantContainsAllEnumValues(): void
    {
        $expected = [
            'open','assignment','closed','reopen',
            'response','comment','upload',
            'deleted','merged','substatus','notification_sent',
        ];
        $this->assertSame(sort($expected), sort(Action::TYPES));
    }
}
```

**`crm/src/Test/Unit/Repository/ActionRepositoryImmutabilityTest.php`**:

Tests that `ActionRepository::delete()` throws `\LogicException` without hitting the DB.

```php
<?php
declare(strict_types=1);
namespace Test\Unit\Repository;

use Repositories\ActionRepository;
use Infrastructure\Database\PdoConnection;
use PHPUnit\Framework\TestCase;

class ActionRepositoryImmutabilityTest extends TestCase
{
    public function testDeleteThrowsLogicException(): void
    {
        // We test only the exception; no DB call happens before the throw
        $repo = new ActionRepository();
        $this->expectException(\LogicException::class);
        $repo->delete(1);
    }
}
```

NOTE: This test will fail at construction if no DB is configured. If the test bootstrap (`src/Test/bootstrap.php`) doesn't set up a DB connection, add a minimal SQLite in-memory PDO for tests:

In `src/Test/bootstrap.php` (if not already setting `$DATABASES`), check whether it sets up a test database. If not, add a SQLite fallback block after the existing include/require lines:

```php
// At the end of src/Test/bootstrap.php — only if $DATABASES is not set
if (empty($DATABASES['default'])) {
    $DATABASES['default'] = [
        'dsn'  => 'sqlite::memory:',
        'user' => '',
        'pass' => '',
    ];
}
```

This allows `PdoConnection::get()` to succeed and `ActionRepository` to instantiate.

**`crm/src/Test/Unit/Repository/ContactMethodRepositoryPrimaryTest.php`**:

Tests the primary demotion logic using an in-memory SQLite DB:

```php
<?php
declare(strict_types=1);
namespace Test\Unit\Repository;

use Domain\ContactMethod;
use Repositories\ContactMethodRepository;
use Infrastructure\Database\PdoConnection;
use PHPUnit\Framework\TestCase;

class ContactMethodRepositoryPrimaryTest extends TestCase
{
    private \PDO $sqlite;

    protected function setUp(): void
    {
        // Build a minimal SQLite schema mirroring contactMethods table
        $this->sqlite = new \PDO('sqlite::memory:');
        $this->sqlite->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        $this->sqlite->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
        $this->sqlite->exec("
            CREATE TABLE contactMethods (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                personId  INTEGER NOT NULL,
                type      TEXT NOT NULL,
                value     TEXT NOT NULL,
                phoneType TEXT,
                isPrimary INTEGER NOT NULL DEFAULT 0,
                label     TEXT
            )
        ");
        // Seed two existing emails, first is primary
        $this->sqlite->exec("
            INSERT INTO contactMethods (personId, type, value, isPrimary) VALUES
            (1, 'email', 'old@example.com', 1),
            (1, 'email', 'other@example.com', 0)
        ");
        PdoConnection::set('default', $this->sqlite);
    }

    public function testSavingNewPrimaryDemotesExistingPrimary(): void
    {
        $repo = new ContactMethodRepository();

        $newMethod = new ContactMethod(
            id:        0,
            personId:  1,
            type:      'email',
            value:     'new@example.com',
            phoneType: null,
            isPrimary: true,
            label:     null,
        );

        $saved = $repo->save($newMethod);

        // The new one should be primary
        $this->assertTrue($saved->isPrimary);

        // The old primary should be demoted
        $stmt = $this->sqlite->query(
            "SELECT * FROM contactMethods WHERE value = 'old@example.com'"
        );
        $old = $stmt->fetch(\PDO::FETCH_ASSOC);
        $this->assertSame(0, (int) $old['isPrimary'], 'Old primary should be demoted');
    }
}
```
  </action>
  <verify>
```bash
cd /app/workspaces/pivota/uReport/crm

# Confirm test files exist
ls src/Test/Unit/Domain/TicketTest.php \
   src/Test/Unit/Domain/PersonTest.php \
   src/Test/Unit/Domain/ActionTest.php \
   src/Test/Unit/Repository/ActionRepositoryImmutabilityTest.php \
   src/Test/Unit/Repository/ContactMethodRepositoryPrimaryTest.php && echo "TEST FILES EXIST"

# Run only the new Unit tests (avoid Integration tests that need real DB/Solr)
vendor/bin/phpunit --testsuite Unit --no-coverage 2>&1 | tail -20

# PHPStan on test files
vendor/bin/phpstan analyse src/Test/Unit/ --level=5 --no-progress 2>&1 | tail -10
```
  </verify>
  <done>
- All 5 test files exist
- `vendor/bin/phpunit --testsuite Unit` exits 0 with all new tests PASSING (no failures, no errors)
- `TicketTest` verifies: `fromRow` types are correct, nullable fields are null, readonly enforced
- `PersonTest` verifies: `fromRow` types, `fullName()` computed property, null `departmentId` case
- `ActionTest` verifies: `fromRow` types, `Action::TYPES` constant completeness
- `ActionRepositoryImmutabilityTest` verifies: `delete()` throws `\LogicException`
- `ContactMethodRepositoryPrimaryTest` verifies: saving a new `isPrimary=true` contact method demotes existing primary of same type
- PHPStan level 5 passes on test files (level 5 for tests, level 8 for production code)
  </done>
</task>

</tasks>

<verification>
After all tasks complete:

```bash
cd /app/workspaces/pivota/uReport/crm

# 1. Full autoload regeneration clean
composer dump-autoload --optimize --quiet && echo "AUTOLOAD CLEAN"

# 2. Domain + infrastructure PHPStan level 8
vendor/bin/phpstan analyse src/Domain/ src/Infrastructure/ src/Repositories/ --level=8 --no-progress 2>&1 | grep -E "(Error|OK|passed)"

# 3. Unit tests pass
vendor/bin/phpunit --testsuite Unit --no-coverage 2>&1 | tail -5

# 4. Spot-check key contract methods exist
grep -rn "RepositoryInterface" src/Repositories/*.php | grep "implements" | wc -l
# Should be >= 12 (all named repos)

# 5. Immutability guards in place
grep -c "LogicException" src/Repositories/ActionRepository.php src/Repositories/NotificationLogRepository.php
# Should show 1 each

# 6. Legacy untouched
md5sum src/Application/PdoRepository.php src/Application/ActiveRecord.php src/Application/Database.php

# 7. Key column names match TechArch EXACTLY (spot-check)
grep -n "apiKeyHash\|datetimeOpened\|oidcSubject\|filterState\|mergedIntoTicketId" src/Domain/*.php | head -20
```
</verification>

<success_criteria>
- `crm/src/Domain/` contains 13 `readonly class` domain objects with `fromRow()` — exact TechArch column names
- `crm/src/Repositories/RepositoryInterface.php` declares `findById`, `save`, `delete`
- `crm/src/Repositories/AbstractPdoRepository.php` provides `paginate()`, `fetchAll()`, transaction wrappers
- `crm/src/Repositories/` contains 14 concrete repository classes (Ticket, Action, Person, Category, Department, Media, Substatus, Client, Bookmark, Template, NotificationLog, ContactMethod + base)
- `crm/src/Infrastructure/Database/PdoConnection.php` provides singleton PDO with `set()` injection hook for tests
- `ActionRepository.delete()` and `NotificationLogRepository.delete()` throw `\LogicException` (TechArch immutability requirement)
- `PersonRepository.findByOidcSubject()` exists (required by Wave 2a OIDC controller)
- `ClientRepository.findByApiKeyHash()` exists (required by Wave 2d Open311 controller)
- `TicketRepository.setMerged()` exists (required by Wave 2d merge controller)
- `ContactMethodRepository.save()` auto-demotes existing primary methods on new primary save
- PHPStan level 8 passes on all new code with 0 errors
- PHPUnit Unit testsuite passes with 0 failures
- Legacy `crm/src/Application/` files untouched — existing system unbroken
- Wave 2a/2b/2c/2d backend controllers can `new TicketRepository()` and call `findById()`, `save()`, `findByFilters()` without any further work
</success_criteria>

<output>
After completing all tasks, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/02-SUMMARY.md` with:
- What was built (repository classes, domain objects, counts)
- Namespace decisions made (`Domain\`, `Repositories\`, `Infrastructure\Database\`)
- Key design decisions (readonly domain objects, immutability guards on Action/NotificationLog, PDO injection hook for tests)
- Any deviations from TechArch (note: none expected)
- All file paths created
- PHPStan and PHPUnit results
</output>
