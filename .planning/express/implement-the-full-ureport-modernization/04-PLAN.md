---
phase: implement-the-full-ureport-modernization
plan: "04"
type: execute
wave: 2c
depends_on: [1, 2]
files_modified:
  - api/src/main/java/com/ureport/entity/Person.java
  - api/src/main/java/com/ureport/entity/PeopleEmail.java
  - api/src/main/java/com/ureport/entity/PeoplePhone.java
  - api/src/main/java/com/ureport/entity/PeopleAddress.java
  - api/src/main/java/com/ureport/entity/Department.java
  - api/src/main/java/com/ureport/entity/Category.java
  - api/src/main/java/com/ureport/entity/CategoryGroup.java
  - api/src/main/java/com/ureport/entity/CategoryActionResponse.java
  - api/src/main/java/com/ureport/entity/Substatus.java
  - api/src/main/java/com/ureport/entity/Action.java
  - api/src/main/java/com/ureport/entity/ContactMethod.java
  - api/src/main/java/com/ureport/entity/IssueType.java
  - api/src/main/java/com/ureport/repository/PersonRepository.java
  - api/src/main/java/com/ureport/repository/DepartmentRepository.java
  - api/src/main/java/com/ureport/repository/CategoryRepository.java
  - api/src/main/java/com/ureport/repository/SubstatusRepository.java
  - api/src/main/java/com/ureport/repository/ActionRepository.java
  - api/src/main/java/com/ureport/repository/ContactMethodRepository.java
  - api/src/main/java/com/ureport/repository/IssueTypeRepository.java
  - api/src/main/java/com/ureport/service/PersonService.java
  - api/src/main/java/com/ureport/service/DepartmentService.java
  - api/src/main/java/com/ureport/service/CategoryService.java
  - api/src/main/java/com/ureport/service/SubstatusService.java
  - api/src/main/java/com/ureport/service/ActionService.java
  - api/src/main/java/com/ureport/controller/PeopleController.java
  - api/src/main/java/com/ureport/controller/DepartmentController.java
  - api/src/main/java/com/ureport/controller/CategoryController.java
  - api/src/main/java/com/ureport/controller/CategoryGroupController.java
  - api/src/main/java/com/ureport/controller/SubstatusController.java
  - api/src/main/java/com/ureport/controller/ActionController.java
  - api/src/main/java/com/ureport/controller/ContactMethodController.java
  - api/src/main/java/com/ureport/controller/IssueTypeController.java
  - api/src/main/java/com/ureport/dto/request/CreatePersonRequest.java
  - api/src/main/java/com/ureport/dto/response/PersonResponse.java
  - api/src/test/java/com/ureport/service/PersonServiceTest.java
  - api/src/test/java/com/ureport/service/DepartmentServiceTest.java
  - api/src/test/java/com/ureport/service/CategoryServiceTest.java
  - api/src/test/java/com/ureport/service/SubstatusServiceTest.java
  - api/src/test/java/com/ureport/service/ActionServiceTest.java
autonomous: true

features:
  implements: ["F5", "F6", "F7", "F8", "F9", "F14", "F19"]
  depends_on: ["F3", "F4"]
  enables: ["F10", "F12", "F13", "F15", "F16", "F17", "F20"]

must_haves:
  truths:
    - "Staff can create, update, search, and delete person records including child email/phone/address sub-records"
    - "Staff can create and manage departments with category and action associations"
    - "Staff can create categories with SLA config, permission levels, custom fields, and category-group assignment"
    - "Staff can create and update substatuses; only one isDefault per parent status at a time"
    - "Staff can create department-scoped action types and set per-category action response overrides"
    - "GET /api/v1/contact-methods returns all 4 seeded methods; isSystem methods cannot be deleted"
    - "GET /api/v1/issue-types returns all 6 seeded types; isSystem types cannot be deleted"
    - "PersonService.findOrCreateFromOpen311() creates a person from first_name, last_name, email, phone when no match found by email"
  artifacts:
    - path: "api/src/main/java/com/ureport/service/PersonService.java"
      provides: "Person CRUD + findOrCreateFromOpen311()"
      exports: ["PersonService"]
    - path: "api/src/main/java/com/ureport/service/DepartmentService.java"
      provides: "Department CRUD + category/action associations"
      exports: ["DepartmentService"]
    - path: "api/src/main/java/com/ureport/service/CategoryService.java"
      provides: "Category CRUD + CategoryGroup CRUD + permission validation"
      exports: ["CategoryService"]
    - path: "api/src/main/java/com/ureport/service/SubstatusService.java"
      provides: "Substatus CRUD + default maintenance"
      exports: ["SubstatusService"]
    - path: "api/src/main/java/com/ureport/service/ActionService.java"
      provides: "Action CRUD + category_action_responses management"
      exports: ["ActionService"]
    - path: "api/src/main/java/com/ureport/controller/PeopleController.java"
      provides: "REST endpoints for people"
      exports: ["PeopleController"]
    - path: "api/src/main/java/com/ureport/controller/CategoryController.java"
      provides: "REST endpoints for categories"
      exports: ["CategoryController"]
  key_links:
    - from: "PersonService.findOrCreateFromOpen311()"
      to: "Open311RequestsController (wave 2b)"
      via: "called when POST /open311/requests creates a ticket with reporter info"
      pattern: "findOrCreateFromOpen311"
    - from: "SubstatusService.setDefault()"
      to: "SubstatusService.clearPreviousDefault()"
      via: "only one isDefault per status type; clearing old default before setting new"
      pattern: "isDefault.*true"
    - from: "CategoryService.validatePermissionLevel()"
      to: "categories.displayPermissionLevel / categories.postingPermissionLevel"
      via: "CHECK constraint values: staff, public, anonymous"
      pattern: "displayPermissionLevel|postingPermissionLevel"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/init/02-schema.sql"
      exports: ["people", "peopleEmails", "peoplePhones", "peopleAddresses", "departments", "categories", "categoryGroups", "substatus", "actions", "category_action_responses", "department_actions", "department_categories", "contactMethods", "issueTypes"]
      verify: "grep -n 'CREATE TABLE people' db/init/02-schema.sql && grep -n 'CREATE TABLE categories' db/init/02-schema.sql && grep -n 'CREATE TABLE substatus' db/init/02-schema.sql && echo CONTRACT_OK"
    - from_plan: "01"
      artifact: "db/init/03-seed.sql"
      exports: ["contactMethods rows (id 1-4)", "issueTypes rows (id 1-6)", "substatus rows (id 1-4)", "actions rows (id 1-10)"]
      verify: "grep -n 'INSERT INTO contactMethods' db/init/03-seed.sql && grep -n 'INSERT INTO issueTypes' db/init/03-seed.sql && echo CONTRACT_OK"
    - from_plan: "2"
      artifact: "api/src/main/java/com/ureport/config/SecurityConfig.java"
      exports: ["SecurityConfig", "JwtAuthenticationFilter", "PermissionEvaluator"]
      verify: "find api/src -name 'SecurityConfig.java' | head -1 | grep -q SecurityConfig && echo CONTRACT_OK"
    - from_plan: "2"
      artifact: "api/src/main/java/com/ureport/entity/Ticket.java"
      exports: ["Ticket", "TicketRepository"]
      verify: "find api/src -name 'Ticket.java' -path '*/entity/*' | head -1 | grep -q Ticket && echo CONTRACT_OK"
  provides:
    - artifact: "api/src/main/java/com/ureport/service/PersonService.java"
      exports: ["PersonService", "findOrCreateFromOpen311"]
      shape: |
        @Service PersonService with:
          - createPerson(CreatePersonRequest) → PersonResponse (201)
          - getPerson(Integer id) → PersonResponse
          - searchPeople(String q, String role, Integer department_id, Integer page, Integer limit) → Page<PersonResponse>
          - updatePerson(Integer id, UpdatePersonRequest) → PersonResponse
          - softDeletePerson(Integer id) → void (sets deletedAt)
          - getPersonTickets(Integer id) → List<TicketSummaryResponse>
          - findOrCreateFromOpen311(String firstName, String lastName, String email, String phone) → Person (entity)
          - addEmail / updateEmail / deleteEmail
          - addPhone / updatePhone / deletePhone
          - addAddress / updateAddress / deleteAddress
      verify: "grep -n 'findOrCreateFromOpen311' api/src/main/java/com/ureport/service/PersonService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/DepartmentService.java"
      exports: ["DepartmentService"]
      shape: |
        @Service DepartmentService with:
          - createDepartment(CreateDepartmentRequest) → DepartmentResponse
          - getDepartment(Integer id) → DepartmentResponse
          - listDepartments() → List<DepartmentResponse>
          - updateDepartment(Integer id, UpdateDepartmentRequest) → DepartmentResponse
          - deleteDepartment(Integer id) → void
          - setCategoryAssociations(Integer id, List<Integer> categoryIds) → void (writes department_categories)
          - setActionAssociations(Integer id, List<Integer> actionIds) → void (writes department_actions)
          - getDepartmentPeople(Integer id) → List<PersonResponse>
          - getDepartmentCategories(Integer id) → List<CategoryResponse>
      verify: "grep -n 'setCategoryAssociations\|setActionAssociations' api/src/main/java/com/ureport/service/DepartmentService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/CategoryService.java"
      exports: ["CategoryService"]
      shape: |
        @Service CategoryService with:
          - createCategory(CreateCategoryRequest) → CategoryResponse
          - getCategory(Integer id) → CategoryResponse
          - listCategories(PermissionLevel callerRole) → List<CategoryResponse> (filtered by displayPermissionLevel)
          - updateCategory(Integer id, UpdateCategoryRequest) → CategoryResponse
          - deleteCategory(Integer id) → void
          - createCategoryGroup / getCategoryGroup / listCategoryGroups / updateCategoryGroup / deleteCategoryGroup / reorderGroups
          - upsertCategoryActionResponse(Integer categoryId, Integer actionId, String template, String replyEmail) → CategoryActionResponse
          - deleteCategoryActionResponse(Integer id) → void
          - listCategoryActionResponses(Integer categoryId) → List<CategoryActionResponse>
      verify: "grep -n 'upsertCategoryActionResponse' api/src/main/java/com/ureport/service/CategoryService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/SubstatusService.java"
      exports: ["SubstatusService"]
      shape: |
        @Service SubstatusService with:
          - createSubstatus(CreateSubstatusRequest) → SubstatusResponse
          - listSubstatuses() → List<SubstatusResponse>
          - updateSubstatus(Integer id, UpdateSubstatusRequest) → SubstatusResponse  [sets default, clears others]
          - deleteSubstatus(Integer id) → void  [rejects isSystem=true]
          - getDefaultSubstatusForStatus(String status) → Substatus (entity, used by TicketService wave 2a)
      verify: "grep -n 'getDefaultSubstatusForStatus\|isSystem' api/src/main/java/com/ureport/service/SubstatusService.java && echo CONTRACT_OK"
    - artifact: "api/src/main/java/com/ureport/service/ActionService.java"
      exports: ["ActionService"]
      shape: |
        @Service ActionService with:
          - createAction(CreateActionRequest) → ActionResponse  [type must be 'department']
          - listActions() → List<ActionResponse>
          - updateAction(Integer id, UpdateActionRequest) → ActionResponse  [rejects isSystem type modifications]
          - deleteAction(Integer id) → void  [rejects isSystem=true]
      verify: "grep -n 'class ActionService' api/src/main/java/com/ureport/service/ActionService.java && echo CONTRACT_OK"
---

<objective>
Implement all seven Wave 2c reference-data backend features: People/Contact management (F5),
Department administration (F6), Category and category-group management (F7), Substatus system
(F8), Action types and response templates (F9), Contact method tracking (F14), and Issue type
management (F19). These features produce the service layer beans consumed by Wave 2d (media,
geo, notifications, metrics) and all Wave 3 frontend admin pages.

Purpose: Tickets (wave 2a) and Open311 (wave 2b) already reference these entities by FK;
wave 2c wires up the full CRUD APIs so those FKs resolve at runtime.

Output:
- 12 JPA @Entity classes (Person, PeopleEmail, PeoplePhone, PeopleAddress, Department, Category,
  CategoryGroup, CategoryActionResponse, Substatus, Action, ContactMethod, IssueType)
- 7 Spring Data repositories
- 5 @Service classes (PersonService, DepartmentService, CategoryService, SubstatusService,
  ActionService — ContactMethod and IssueType are simple enough to serve via controller + repo)
- 8 REST controllers covering all endpoints in TechArch Section 03
- JUnit 5 unit tests for every service class (≥80% coverage target)
</objective>

<feature_dependencies>
Implements: F5: People/Contact management, F6: Department administration,
  F7: Category and category-group management, F8: Substatus system,
  F9: Action types and category action responses, F14: Contact method tracking,
  F19: Issue type management
Depends on: F3: RBAC (SecurityConfig + @PreAuthorize from wave 2a),
  F4: Authentication (JWT filter chain from wave 2a),
  Wave 1 DB schema (all tables from 01-PLAN.md)
Enables: F10 (MediaService needs CategoryService for posting permission),
  F12 (BookmarkController needs PersonRepository), F13 (ClientService needs PersonRepository),
  F15 (GeoService needs LocationRepository and CategoryService),
  F16 (AutoCloseScheduler needs CategoryService, SubstatusService),
  F17 (MetricsService needs CategoryService), F20 (ResponseTemplateController needs ActionRepository)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@project_specs/TechArch-uReport.md   (Section 01 package structure, Section 02 DDL, Section 03 API/TypeScript interfaces)
@project_specs/FRD-uReport.md        (F05–F09, F14, F19 feature specifications)
@project_specs/RTM-uReport.md        (FRD sub-requirements F05.1–F09.3, F14.1–F14.4, F19.1–F19.3)
@.planning/express/implement-the-full-ureport-modernization/01-PLAN.md  (DB schema wave — provides table definitions)
</context>

<tasks>

<task type="auto">
  <name>Task 1: JPA entities and repositories for F5/F6/F7/F8/F9/F14/F19</name>
  <files>
    api/src/main/java/com/ureport/entity/Person.java
    api/src/main/java/com/ureport/entity/PeopleEmail.java
    api/src/main/java/com/ureport/entity/PeoplePhone.java
    api/src/main/java/com/ureport/entity/PeopleAddress.java
    api/src/main/java/com/ureport/entity/Department.java
    api/src/main/java/com/ureport/entity/Category.java
    api/src/main/java/com/ureport/entity/CategoryGroup.java
    api/src/main/java/com/ureport/entity/CategoryActionResponse.java
    api/src/main/java/com/ureport/entity/Substatus.java
    api/src/main/java/com/ureport/entity/Action.java
    api/src/main/java/com/ureport/entity/ContactMethod.java
    api/src/main/java/com/ureport/entity/IssueType.java
    api/src/main/java/com/ureport/repository/PersonRepository.java
    api/src/main/java/com/ureport/repository/DepartmentRepository.java
    api/src/main/java/com/ureport/repository/CategoryRepository.java
    api/src/main/java/com/ureport/repository/SubstatusRepository.java
    api/src/main/java/com/ureport/repository/ActionRepository.java
    api/src/main/java/com/ureport/repository/ContactMethodRepository.java
    api/src/main/java/com/ureport/repository/IssueTypeRepository.java
  </files>
  <action>
Create JPA @Entity classes and Spring Data JPA repositories. Column names MUST match the
PostgreSQL DDL from TechArch Section 02 EXACTLY — the schema already exists in the DB;
field name mismatches cause boot-time mapping errors.

NOTE: Wave 2a (plan 02) already defines Person.java, Department.java, Category.java,
Substatus.java, and Action.java as stubs (they appear in its entity list). Extend those
stubs rather than replace them. If they do not yet exist, create them from scratch.

---

## entity/Person.java

```java
@Entity
@Table(name = "people")
public class Person {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100) private String firstname;
    @Column(length = 100) private String middlename;
    @Column(nullable = false, length = 100) private String lastname;
    @Column(length = 200) private String organization;
    @Column(length = 255) private String address;
    @Column(length = 100) private String city;
    @Column(length = 2) private String state;
    @Column(length = 10) private String zip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(unique = true, length = 100) private String username;
    @Column(length = 255) private String passwordHash;

    // CHECK(role IN ('staff','public','anonymous'))
    @Column(length = 20) private String role;

    @Column(columnDefinition = "TIMESTAMPTZ") private OffsetDateTime deletedAt;

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PeopleEmail> emails = new ArrayList<>();

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PeoplePhone> phones = new ArrayList<>();

    @OneToMany(mappedBy = "person", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PeopleAddress> addresses = new ArrayList<>();
    // getters/setters
}
```

## entity/PeopleEmail.java

```java
@Entity
@Table(name = "peopleEmails")
public class PeopleEmail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(nullable = false, length = 255) private String email;
    @Column(length = 50) private String label;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false")
    private boolean usedForNotifications;
    // getters/setters
}
```

## entity/PeoplePhone.java

```java
@Entity
@Table(name = "peoplePhones")
public class PeoplePhone {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(nullable = false, length = 30) private String number;
    @Column(length = 50) private String label;
    // getters/setters
}
```

## entity/PeopleAddress.java

```java
@Entity
@Table(name = "peopleAddresses")
public class PeopleAddress {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(nullable = false, length = 255) private String address;
    @Column(length = 100) private String city;
    @Column(length = 2) private String state;
    @Column(length = 10) private String zip;
    @Column(length = 50) private String label;
    // getters/setters
}
```

## entity/Department.java

```java
@Entity
@Table(name = "departments")
public class Department {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;

    @Column(nullable = false, unique = true, length = 100) private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defaultPerson_id")
    private Person defaultPerson;

    @ManyToMany
    @JoinTable(
        name = "department_categories",
        joinColumns = @JoinColumn(name = "department_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "department_actions",
        joinColumns = @JoinColumn(name = "department_id"),
        inverseJoinColumns = @JoinColumn(name = "action_id")
    )
    private Set<Action> actions = new HashSet<>();
    // getters/setters
}
```

## entity/CategoryGroup.java

```java
@Entity
@Table(name = "categoryGroups")
public class CategoryGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0") private Integer ordering;
    // getters/setters
}
```

## entity/Substatus.java

```java
@Entity
@Table(name = "substatus")
public class Substatus {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, length = 100) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    // CHECK(status IN ('open','closed'))
    @Column(nullable = false, length = 10) private String status;
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false") private boolean isDefault;
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false") private boolean isSystem;
    // getters/setters
}
```

## entity/Action.java

```java
@Entity
@Table(name = "actions")
public class Action {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, length = 100) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    // CHECK(type IN ('system','department'))
    @Column(nullable = false, length = 20) private String type;
    @Column(columnDefinition = "TEXT") private String template;
    @Column(length = 255) private String replyEmail;
    // getters/setters
}
```

## entity/Category.java

```java
@Entity
@Table(name = "categories")
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, length = 200) private String name;
    @Column(columnDefinition = "TEXT") private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defaultPerson_id")
    private Person defaultPerson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryGroup_id")
    private CategoryGroup categoryGroup;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT true") private boolean active;
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false") private boolean featured;

    // CHECK(displayPermissionLevel IN ('staff','public','anonymous'))
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'anonymous'")
    private String displayPermissionLevel;

    // CHECK(postingPermissionLevel IN ('staff','public','anonymous'))
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'anonymous'")
    private String postingPermissionLevel;

    // JSONB — store as String and deserialize in service layer
    @Column(columnDefinition = "jsonb") private String customFields;

    @Column(nullable = false, columnDefinition = "TIMESTAMPTZ DEFAULT NOW()")
    private OffsetDateTime lastModified;

    private Integer slaDays;
    @Column(length = 255) private String notificationReplyEmail;
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false") private boolean autoCloseIsActive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autoCloseSubstatus_id")
    private Substatus autoCloseSubstatus;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CategoryActionResponse> actionResponses = new ArrayList<>();
    // getters/setters
}
```

## entity/CategoryActionResponse.java

```java
@Entity
@Table(name = "category_action_responses",
    uniqueConstraints = @UniqueConstraint(columnNames = {"category_id", "action_id"}))
public class CategoryActionResponse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_id", nullable = false)
    private Action action;

    @Column(columnDefinition = "TEXT") private String template;
    @Column(length = 255) private String replyEmail;
    // getters/setters
}
```

## entity/ContactMethod.java

```java
@Entity
@Table(name = "contactMethods")
public class ContactMethod {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, unique = true, length = 100) private String name;
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false") private boolean isSystem;
    // getters/setters
}
```

## entity/IssueType.java

```java
@Entity
@Table(name = "issueTypes")
public class IssueType {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Integer id;
    @Column(nullable = false, unique = true, length = 100) private String name;
    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT false") private boolean isSystem;
    // getters/setters
}
```

---

## Repositories

Create the following interfaces (all extend JpaRepository):

### PersonRepository.java
```java
public interface PersonRepository extends JpaRepository<Person, Integer> {
    Optional<Person> findByUsername(String username);
    Optional<Person> findByEmailsEmail(String email);  // join to peopleEmails
    Page<Person> findByDeletedAtIsNull(Pageable pageable);
    // Custom JPQL for search:
    @Query("SELECT p FROM Person p LEFT JOIN p.emails e WHERE p.deletedAt IS NULL AND " +
           "(:q IS NULL OR LOWER(p.firstname) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(p.lastname) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(p.organization) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(e.email) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Person> searchPeople(@Param("q") String q, Pageable pageable);
}
```

### DepartmentRepository.java
```java
public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    boolean existsByName(String name);
}
```

### CategoryRepository.java
```java
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    List<Category> findByActiveTrueOrderByCategoryGroupOrderingAscNameAsc();
    List<Category> findByDepartmentId(Integer departmentId);
    List<Category> findByCategoryGroupId(Integer groupId);
}
```

### SubstatusRepository.java
```java
public interface SubstatusRepository extends JpaRepository<Substatus, Integer> {
    Optional<Substatus> findByStatusAndIsDefaultTrue(String status);
    List<Substatus> findByStatus(String status);
}
```

### ActionRepository.java
```java
public interface ActionRepository extends JpaRepository<Action, Integer> {
    List<Action> findByType(String type);
}
```

### ContactMethodRepository.java
```java
public interface ContactMethodRepository extends JpaRepository<ContactMethod, Integer> {}
```

### IssueTypeRepository.java
```java
public interface IssueTypeRepository extends JpaRepository<IssueType, Integer> {}
```

---

Implementation notes:
- For JSONB fields (Category.customFields), use `@Column(columnDefinition = "jsonb")` and
  keep the field as `String`. Serialize/deserialize with Jackson ObjectMapper in the service layer.
- Use `@PrePersist` and `@PreUpdate` on Category to set `lastModified = OffsetDateTime.now()`.
- PersonRepository.findByEmailsEmail uses a JOIN query; add a test to confirm it works with
  the cascade-loaded emails collection.
  </action>
  <verify>
find api/src/main/java/com/ureport/entity -name "*.java" | wc -l &&
find api/src/main/java/com/ureport/repository -name "*Repository.java" | wc -l &&
grep -n "class Person " api/src/main/java/com/ureport/entity/Person.java &&
grep -n "class Category " api/src/main/java/com/ureport/entity/Category.java &&
grep -n "class Substatus " api/src/main/java/com/ureport/entity/Substatus.java &&
grep -n "class CategoryActionResponse " api/src/main/java/com/ureport/entity/CategoryActionResponse.java &&
echo ENTITIES_OK
  </verify>
  <done>
- 12 entity classes exist under api/src/main/java/com/ureport/entity/
- 7 repository interfaces exist under api/src/main/java/com/ureport/repository/
- All column names match TechArch Section 02 DDL exactly (people.firstname not firstName, etc.)
- Category.customFields annotated @Column(columnDefinition = "jsonb")
- PersonRepository includes searchPeople JPQL query
- SubstatusRepository includes findByStatusAndIsDefaultTrue for default maintenance
  </done>
</task>

<feature_dependencies>
Implements: F5 (Person, PeopleEmail, PeoplePhone, PeopleAddress entities + PersonRepository),
  F6 (Department entity + DepartmentRepository with department_categories/department_actions joins),
  F7 (Category, CategoryGroup, CategoryActionResponse entities + CategoryRepository),
  F8 (Substatus entity + SubstatusRepository.findByStatusAndIsDefaultTrue),
  F9 (Action entity + CategoryActionResponse entity + ActionRepository),
  F14 (ContactMethod entity + ContactMethodRepository),
  F19 (IssueType entity + IssueTypeRepository)
Depends on: Wave 1 DB schema (tables must exist before JPA mapping is validated at boot)
  Wave 2a Security config (Person entity referenced by JwtUserDetails — must be compatible)
Enables: All service classes in Task 2, all controller classes in Task 3
</feature_dependencies>

<task type="auto">
  <name>Task 2: Service classes (F5/F6/F7/F8/F9) and REST controllers + unit tests (F14/F19)</name>
  <files>
    api/src/main/java/com/ureport/service/PersonService.java
    api/src/main/java/com/ureport/service/DepartmentService.java
    api/src/main/java/com/ureport/service/CategoryService.java
    api/src/main/java/com/ureport/service/SubstatusService.java
    api/src/main/java/com/ureport/service/ActionService.java
    api/src/main/java/com/ureport/controller/PeopleController.java
    api/src/main/java/com/ureport/controller/DepartmentController.java
    api/src/main/java/com/ureport/controller/CategoryController.java
    api/src/main/java/com/ureport/controller/CategoryGroupController.java
    api/src/main/java/com/ureport/controller/SubstatusController.java
    api/src/main/java/com/ureport/controller/ActionController.java
    api/src/main/java/com/ureport/controller/ContactMethodController.java
    api/src/main/java/com/ureport/controller/IssueTypeController.java
    api/src/main/java/com/ureport/dto/request/CreatePersonRequest.java
    api/src/main/java/com/ureport/dto/response/PersonResponse.java
    api/src/test/java/com/ureport/service/PersonServiceTest.java
    api/src/test/java/com/ureport/service/DepartmentServiceTest.java
    api/src/test/java/com/ureport/service/CategoryServiceTest.java
    api/src/test/java/com/ureport/service/SubstatusServiceTest.java
    api/src/test/java/com/ureport/service/ActionServiceTest.java
  </files>
  <action>
Implement all five service classes and all eight REST controllers for wave 2c features.
Each controller must use `@PreAuthorize("hasRole('ROLE_STAFF')")` (all wave 2c endpoints
are staff-only per the RBAC permission matrix in FRD F03). The exact endpoint paths
come from TechArch Section 03 API Endpoint Summary — use them verbatim.

---

## PersonService.java

Key logic points (from FRD F05 sub-requirements F05.1–F05.5 and RTM):

1. **createPerson**: Validate unique username (if provided); throw 409 `USERNAME_CONFLICT`
   if duplicate. BCrypt hash the raw `password` field (cost 10) into `passwordHash`.
   Insert child emails/phones/addresses arrays in same transaction.

2. **searchPeople**: ILIKE search on firstname, lastname, organization, and joined email.
   Accepts `?q=`, `?role=`, `?department_id=`, `?page=`, `?limit=` (default 25).
   Returns paginated list. Staff only.

3. **softDeletePerson**: Set `deletedAt = OffsetDateTime.now()`. Do NOT hard-delete.

4. **findOrCreateFromOpen311(String firstName, String lastName, String email, String phone)**:
   - If email non-null: look up by `peopleEmails.email = email` (case-insensitive).
   - If found: return existing Person entity.
   - If not found: create new Person with role=null (public constituent).
     If phone non-null: add a PeoplePhone with label='Main'.
     If email non-null: add a PeopleEmail with usedForNotifications=true.
   - Return saved Person entity (NOT a DTO — callers need the entity for FK assignment).
   - This method is called by Open311RequestsController (wave 2b) and TicketService (wave 2a).

5. **addEmail / updateEmail / deleteEmail**: Manage child `peopleEmails` rows.
   Validate person exists; apply orphanRemoval via parent collection.

---

## DepartmentService.java

Key logic points (from FRD F06, RTM F06.1–F06.3):

1. **createDepartment**: name required; optional `defaultPerson_id` must reference a person
   with `role = 'staff'`; throw 422 `INVALID_ASSIGNEE` if not staff.

2. **setCategoryAssociations(Integer departmentId, List<Integer> categoryIds)**:
   - Load Department entity.
   - Clear department.categories set, add each Category from categoryIds.
   - Save — JPA cascade handles `department_categories` join table.

3. **setActionAssociations(Integer departmentId, List<Integer> actionIds)**:
   - Same pattern for `department_actions`.

4. **getDepartmentPeople**: `SELECT * FROM people WHERE department_id = ?` (via PersonRepository).

---

## CategoryService.java

Key logic points (from FRD F07, RTM F07.1–F07.3):

1. **validatePermissionLevel(String level)**: Throws 422 `INVALID_PERMISSION_LEVEL` if
   value is not one of `staff`, `public`, `anonymous`.

2. **createCategory / updateCategory**: Validate displayPermissionLevel and
   postingPermissionLevel on every write. Set `lastModified = OffsetDateTime.now()` on every
   update (also handled by @PreUpdate on entity).

3. **listCategories(String callerRole)**:
   - `staff` → return all active categories.
   - `public` → filter `displayPermissionLevel IN ('public','anonymous')`.
   - `anonymous` → filter `displayPermissionLevel = 'anonymous'`.
   - Used by Open311ServicesController (wave 2b) and TicketController (wave 2a).

4. **upsertCategoryActionResponse(Integer categoryId, Integer actionId, String template, String replyEmail)**:
   - Find existing CategoryActionResponse by categoryId + actionId; if found, update template/replyEmail;
     if not found, create new.
   - Constraint `uq_cat_action_response` enforces uniqueness at DB level.

5. **createCategoryGroup / reorderGroups**: CategoryGroup CRUD. `reorderGroups` accepts
   `List<{id, ordering}>` and bulk-updates ordering values.

---

## SubstatusService.java

Key logic points (from FRD F08, RTM F08.1–F08.3):

1. **createSubstatus**: Validate `status IN ('open','closed')`.

2. **updateSubstatus(Integer id, UpdateSubstatusRequest request)**:
   - If `isDefault = true` in request: first call
     `substatusRepository.findByStatusAndIsDefaultTrue(substatus.getStatus())`
     and set that record's `isDefault = false`, save it.
     Then set new record's `isDefault = true` and save. Both ops in same `@Transactional`.

3. **deleteSubstatus(Integer id)**:
   - Load substatus; if `isSystem = true`, throw 422 `SYSTEM_SUBSTATUS_NOT_DELETABLE`.
   - Perform hard delete.

4. **getDefaultSubstatusForStatus(String status)**:
   - Returns the Substatus entity with `isDefault = true` for the given status.
   - Used by TicketService (wave 2a) for `reopenTicket()` (assigns default 'open' substatus)
     and `createTicket()` (assigns default 'open' substatus).

---

## ActionService.java

Key logic points (from FRD F09, RTM F09.1):

1. **createAction**: `type` must be `'department'`. Throw 422 if caller tries to create
   a `'system'` type action.

2. **updateAction / deleteAction**: Reject modifications to records where `type = 'system'`.
   Throw 403 `PERMISSION_DENIED` (system actions are read-only per FRD F09).

---

## REST Controllers

All controllers are `@RestController`, inject the corresponding service, and are annotated
`@RequestMapping`. All require `@PreAuthorize("hasRole('ROLE_STAFF')")` on the class EXCEPT:
- `ContactMethodController.listContactMethods()` — `GET /api/v1/contact-methods` is public (no auth)
- `IssueTypeController.listIssueTypes()` — `GET /api/v1/issue-types` is public (no auth)

### PeopleController.java — `@RequestMapping("/api/v1/people")`

From TechArch Section 03 People endpoints:
```
GET    /api/v1/people               → searchPeople(q, role, department_id, page, limit)
POST   /api/v1/people               → createPerson(body)  → 201
GET    /api/v1/people/{id}          → getPerson(id)
PUT    /api/v1/people/{id}          → updatePerson(id, body)
PATCH  /api/v1/people/{id}          → partialUpdatePerson(id, body)
DELETE /api/v1/people/{id}          → softDeletePerson(id) → 204
GET    /api/v1/people/{id}/tickets  → getPersonTickets(id)
POST   /api/v1/people/{id}/emails   → addEmail(id, body) → 201
PUT    /api/v1/people/{id}/emails/{emailId}   → updateEmail(id, emailId, body)
DELETE /api/v1/people/{id}/emails/{emailId}   → deleteEmail(id, emailId) → 204
POST   /api/v1/people/{id}/phones   → addPhone(id, body) → 201
PUT    /api/v1/people/{id}/phones/{phoneId}   → updatePhone(id, phoneId, body)
DELETE /api/v1/people/{id}/phones/{phoneId}   → deletePhone(id, phoneId) → 204
POST   /api/v1/people/{id}/addresses → addAddress(id, body) → 201
PUT    /api/v1/people/{id}/addresses/{addrId} → updateAddress(id, addrId, body)
DELETE /api/v1/people/{id}/addresses/{addrId} → deleteAddress(id, addrId) → 204
```

### DepartmentController.java — `@RequestMapping("/api/v1/departments")`
```
GET    /api/v1/departments          → listDepartments()
POST   /api/v1/departments          → createDepartment(body) → 201
GET    /api/v1/departments/{id}     → getDepartment(id)
PUT    /api/v1/departments/{id}     → updateDepartment(id, body)
DELETE /api/v1/departments/{id}     → deleteDepartment(id) → 204
GET    /api/v1/departments/{id}/people     → getDepartmentPeople(id)
GET    /api/v1/departments/{id}/categories → getDepartmentCategories(id)
PUT    /api/v1/departments/{id}/categories → setCategoryAssociations(id, body)
PUT    /api/v1/departments/{id}/actions    → setActionAssociations(id, body)
```

### CategoryController.java — `@RequestMapping("/api/v1/categories")`
(Note: GET list and GET detail use per-displayPermissionLevel logic, NOT blanket staff-only)
```
GET    /api/v1/categories           → listCategories() [permission-gated by displayPermissionLevel]
POST   /api/v1/categories           → createCategory(body) → 201  [staff only]
GET    /api/v1/categories/{id}      → getCategory(id) [permission-gated]
PUT    /api/v1/categories/{id}      → updateCategory(id, body)  [staff only]
DELETE /api/v1/categories/{id}      → deleteCategory(id) → 204  [staff only]
GET    /api/v1/categories/{id}/action-responses   → listActionResponses(id)
POST   /api/v1/categories/{id}/action-responses   → upsertActionResponse(id, body) → 201
DELETE /api/v1/categories/{id}/action-responses/{rid} → deleteActionResponse(id, rid) → 204
```

### CategoryGroupController.java — `@RequestMapping("/api/v1/category-groups")`
```
GET    /api/v1/category-groups      → listGroups()
POST   /api/v1/category-groups      → createGroup(body) → 201
GET    /api/v1/category-groups/{id} → getGroupWithCategories(id)
PUT    /api/v1/category-groups/{id} → updateGroup(id, body)
DELETE /api/v1/category-groups/{id} → deleteGroup(id) → 204
PUT    /api/v1/category-groups/order → reorderGroups(body)
```

### SubstatusController.java — `@RequestMapping("/api/v1/substatus")`
```
GET    /api/v1/substatus            → listSubstatuses()
POST   /api/v1/substatus            → createSubstatus(body) → 201
PATCH  /api/v1/substatus/{id}       → updateSubstatus(id, body)
DELETE /api/v1/substatus/{id}       → deleteSubstatus(id) → 204
```

### ActionController.java — `@RequestMapping("/api/v1/actions")`
```
GET    /api/v1/actions              → listActions()
POST   /api/v1/actions              → createAction(body) → 201  [type must be 'department']
PATCH  /api/v1/actions/{id}         → updateAction(id, body)
DELETE /api/v1/actions/{id}         → deleteAction(id) → 204
```

### ContactMethodController.java — `@RequestMapping("/api/v1/contact-methods")`
```
GET    /api/v1/contact-methods      → listContactMethods()  [NO auth required — public]
POST   /api/v1/contact-methods      → createContactMethod(body) → 201  [staff only]
DELETE /api/v1/contact-methods/{id} → deleteContactMethod(id) → 204  [staff only, reject isSystem=true]
```

### IssueTypeController.java — `@RequestMapping("/api/v1/issue-types")`
```
GET    /api/v1/issue-types          → listIssueTypes()  [NO auth required — public]
POST   /api/v1/issue-types          → createIssueType(body) → 201  [staff only]
DELETE /api/v1/issue-types/{id}     → deleteIssueType(id) → 204  [staff only, reject isSystem=true]
```

---

## DTO Classes

### CreatePersonRequest.java
```java
public class CreatePersonRequest {
    @NotBlank private String firstname;
    @NotBlank private String lastname;
    private String middlename;
    private String organization;
    private String address;
    private String city;
    private String state;
    private String zip;
    private Integer department_id;
    private String username;
    private String password;       // plain text; service BCrypts it
    private String role;           // 'staff', 'public', 'anonymous'
    private List<CreateEmailRequest> emails;
    private List<CreatePhoneRequest> phones;
    private List<CreateAddressRequest> addresses;
}
```

### PersonResponse.java
```java
public class PersonResponse {
    private Integer id;
    private String firstname;
    private String middlename;
    private String lastname;
    private String organization;
    private String address;
    private String city;
    private String state;
    private String zip;
    private Integer department_id;
    private String departmentName;
    private String username;
    private String role;
    private List<PersonEmailDTO> emails;
    private List<PersonPhoneDTO> phones;
    private List<PersonAddressDTO> addresses;
}
```

(Create analogous request/response DTOs for Department, Category, CategoryGroup, Substatus,
Action, CategoryActionResponse, ContactMethod, IssueType. Follow the TypeScript interface
shapes defined in TechArch Section 03 as the authoritative field list.)

---

## Unit Tests

For each of the five service classes, create a JUnit 5 test class using Mockito:

### PersonServiceTest.java — test cases:
- createPerson_withDuplicateUsername_throws409
- createPerson_withPassword_bcryptHashesIt
- softDeletePerson_setsDeletableAt
- findOrCreateFromOpen311_existingEmail_returnsExisting
- findOrCreateFromOpen311_noMatch_createsNewPerson
- findOrCreateFromOpen311_noEmail_createsPersonWithoutEmail

### DepartmentServiceTest.java — test cases:
- createDepartment_withNonStaffDefaultPerson_throws422
- setCategoryAssociations_replacesExistingAssociations

### CategoryServiceTest.java — test cases:
- createCategory_withInvalidPermissionLevel_throws422
- listCategories_anonymousCaller_filtersToAnonymousOnly
- upsertCategoryActionResponse_existingRecord_updates
- upsertCategoryActionResponse_noExisting_creates

### SubstatusServiceTest.java — test cases:
- updateSubstatus_setDefault_clearsPreviousDefault
- deleteSubstatus_systemSubstatus_throws422
- getDefaultSubstatusForStatus_returnsCorrectDefault

### ActionServiceTest.java — test cases:
- createAction_withSystemType_throws422
- deleteAction_systemAction_throws403
  </action>
  <verify>
find api/src/main/java/com/ureport/service -name "*.java" | wc -l &&
find api/src/main/java/com/ureport/controller -name "*.java" | wc -l &&
grep -n "findOrCreateFromOpen311" api/src/main/java/com/ureport/service/PersonService.java &&
grep -n "getDefaultSubstatusForStatus" api/src/main/java/com/ureport/service/SubstatusService.java &&
grep -n "upsertCategoryActionResponse" api/src/main/java/com/ureport/service/CategoryService.java &&
grep -n "setCategoryAssociations" api/src/main/java/com/ureport/service/DepartmentService.java &&
find api/src/test -name "*ServiceTest.java" | wc -l &&
mvn -f api/pom.xml test -pl . -q 2>&1 | tail -10 &&
echo SERVICES_AND_TESTS_OK
  </verify>
  <done>
- PersonService.java, DepartmentService.java, CategoryService.java, SubstatusService.java,
  ActionService.java all exist and compile.
- findOrCreateFromOpen311() method exists in PersonService — callable by wave 2a/2b.
- getDefaultSubstatusForStatus() exists in SubstatusService — callable by TicketService (wave 2a).
- upsertCategoryActionResponse() exists in CategoryService with upsert logic.
- 8 REST controllers exist covering all endpoints in TechArch Section 03.
- ContactMethodController and IssueTypeController allow unauthenticated GET for list endpoints.
- 5 unit test classes exist covering ≥5 test methods each; all tests pass.
- isSystem=true substatuses and actions are rejected on delete.
- Default substatus uniqueness per parent status is enforced in SubstatusService.
  </done>
</task>

<feature_dependencies>
Implements: F5 (PersonService CRUD + findOrCreateFromOpen311 + PeopleController all endpoints),
  F6 (DepartmentService CRUD + category/action associations + DepartmentController),
  F7 (CategoryService CRUD + CategoryGroup CRUD + CategoryActionResponse upsert + controllers),
  F8 (SubstatusService with isDefault enforcement + SubstatusController),
  F9 (ActionService with system action protection + ActionController + category action responses),
  F14 (ContactMethodController — seeded data served; isSystem cannot be deleted),
  F19 (IssueTypeController — seeded data served; isSystem cannot be deleted)
Depends on: Task 1 (entities and repositories must exist before services can compile)
  Wave 2a SecurityConfig (for @PreAuthorize to resolve; JwtUserDetails for principal extraction)
Enables: Wave 2b Open311RequestsController calls PersonService.findOrCreateFromOpen311(),
  Wave 2a TicketService calls SubstatusService.getDefaultSubstatusForStatus(),
  Wave 2d CategoryService needed by AutoCloseScheduler, MediaService, MetricsService
</feature_dependencies>

</tasks>

<verification>
After both tasks complete, run the following checks:

1. Verify entity count:
```bash
find api/src/main/java/com/ureport/entity -name "*.java" | wc -l
# Expected: ≥12 entity classes
```

2. Verify repository count:
```bash
find api/src/main/java/com/ureport/repository -name "*Repository.java" | wc -l
# Expected: ≥7 repository interfaces (this wave adds 7; prior waves may have added others)
```

3. Verify critical service methods exist:
```bash
grep -rn "findOrCreateFromOpen311" api/src/main/java/com/ureport/service/PersonService.java
grep -rn "getDefaultSubstatusForStatus" api/src/main/java/com/ureport/service/SubstatusService.java
grep -rn "upsertCategoryActionResponse" api/src/main/java/com/ureport/service/CategoryService.java
```

4. Verify all tests pass:
```bash
mvn -f api/pom.xml test 2>&1 | grep -E 'BUILD|Tests run|FAIL|ERROR' | tail -20
# Expected: BUILD SUCCESS, 0 failures, 0 errors
```

5. Verify integration contracts are satisfiable:
```bash
# Wave 1 provides:
grep -n 'CREATE TABLE people' db/init/02-schema.sql && echo CONTRACT_OK
grep -n 'CREATE TABLE categories' db/init/02-schema.sql && echo CONTRACT_OK
# This wave provides (for wave 2b):
grep -n 'findOrCreateFromOpen311' api/src/main/java/com/ureport/service/PersonService.java && echo CONTRACT_OK
# This wave provides (for wave 2a):
grep -n 'getDefaultSubstatusForStatus' api/src/main/java/com/ureport/service/SubstatusService.java && echo CONTRACT_OK
```
</verification>

<success_criteria>
- All 12 JPA entity classes map correctly to the PostgreSQL DDL from TechArch Section 02
  (column names, types, FKs verbatim — no camelCase divergence from snake_case DB columns)
- All 7 repository interfaces implement the necessary query methods
- PersonService.findOrCreateFromOpen311() is implemented and tested (wave 2b depends on it)
- SubstatusService.getDefaultSubstatusForStatus() is implemented and tested (wave 2a depends on it)
- CategoryService enforces permission level validation (anonymous/public/staff only)
- SubstatusService enforces single-default-per-status invariant in updateSubstatus()
- ActionService and ContactMethodController/IssueTypeController protect isSystem=true records from deletion
- All 8 controllers expose endpoints at the exact paths specified in TechArch Section 03
- GET /api/v1/contact-methods and GET /api/v1/issue-types are publicly accessible (no auth)
- All remaining admin endpoints require staff role via @PreAuthorize
- 5 service unit test classes exist with ≥5 test methods each; mvn test exits 0
- integration_contracts.provides.verify commands all exit 0
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/04-SUMMARY.md`
summarizing:
- Files created: entities (list), repositories (list), services (list), controllers (list)
- Key methods implemented: findOrCreateFromOpen311, getDefaultSubstatusForStatus, upsertCategoryActionResponse, etc.
- Test results: pass/fail count, coverage estimate
- Any deviations from spec (should be none; flag any conflicts with wave 2a entity stubs)
- Integration contract verification results
</output>
