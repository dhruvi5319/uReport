---
phase: 09-admin-panels-and-integration
plan: PGAP-02
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/main/java/com/ureport/config/DevDataSeeder.java
  - backend/src/main/java/com/ureport/auth/DevLoginController.java
  - backend/src/main/resources/application-dev.yml
  - backend/src/main/java/com/ureport/security/SecurityConfig.java
autonomous: true
gap_closure: true

features:
  implements: ["ADMIN-01", "F6", "F7", "F8", "F13"]
  depends_on: []
  enables: ["SEARCH-02"]

must_haves:
  truths:
    - "GET /api/contact-methods returns [Phone, Email, Walk-in, Mail] when running dev profile"
    - "GET /api/substatus returns 3 entries including one with isDefault=true when running dev profile"
    - "GET /api/issue-types returns 6 entries (Comment, Complaint, Question, Report, Request, Violation) when running dev profile"
    - "GET /api/actions returns 10 system action entries when running dev profile"
    - "GET /api/category-groups returns at least 3 entries when running dev profile"
    - "GET /api/departments returns at least 1 entry when running dev profile"
    - "POST /api/auth/dev-login with body {username: 'devadmin', password: 'admin123'} returns 200 with Set-Cookie auth_token (dev profile only)"
    - "After dev login, POST /api/people with valid body returns 201 (not 401)"
  artifacts:
    - path: "backend/src/main/java/com/ureport/config/DevDataSeeder.java"
      provides: "H2 dev DB seed: contact methods, substatus, issue types, actions, category groups, departments, admin person"
      min_lines: 100
    - path: "backend/src/main/java/com/ureport/auth/DevLoginController.java"
      provides: "Dev-only POST /api/auth/dev-login endpoint for H2 password-based auth"
      exports: ["DevLoginController"]
  key_links:
    - from: "backend/src/main/java/com/ureport/auth/DevLoginController.java"
      to: "backend/src/main/java/com/ureport/security/JwtService.java"
      via: "jwtService.generateToken(personId, username, role)"
      pattern: "jwtService\\.generateToken"
    - from: "backend/src/main/java/com/ureport/config/DevDataSeeder.java"
      to: "backend/src/main/java/com/ureport/repository/ContactMethodRepository.java"
      via: "contactMethodRepo.save(contactMethod)"
      pattern: "contactMethodRepo\\.save"

integration_contracts:
  requires: []
  provides:
    - artifact: "backend/src/main/java/com/ureport/auth/DevLoginController.java"
      exports: ["POST /api/auth/dev-login (dev profile only)"]
      shape: |
        POST /api/auth/dev-login
        Request: { "username": "devadmin", "password": "admin123" }
        Response (200): { personId, username, role, firstname, lastname, expiresAt } + Set-Cookie: auth_token=<jwt>; HttpOnly; SameSite=Strict
        Response (401): { "error": "Invalid credentials" }
        Response (404): { "error": "Not found" }  (only exists in @Profile("dev"))
      verify: "grep -n 'dev-login\\|DevLoginController\\|@Profile.*dev' backend/src/main/java/com/ureport/auth/DevLoginController.java && echo CONTRACT_OK"
    - artifact: "backend/src/main/java/com/ureport/config/DevDataSeeder.java"
      exports: ["contact_methods seed", "substatus seed", "issue_types seed", "actions seed", "people admin seed"]
      verify: "grep -n 'contactMethodRepo\\|ContactMethod\\|Phone\\|Email\\|Walk' backend/src/main/java/com/ureport/config/DevDataSeeder.java && echo CONTRACT_OK"

---

<objective>
Fix the H2 dev database seed data so all reference tables are populated on startup, and add a dev-only login endpoint so devs can obtain a real JWT cookie without LDAP (which is disabled in dev profile).

Purpose: The DevDataSeeder already exists but is missing contact methods seeding and a seeded admin Person with a password. Without a seeded admin person and a local login mechanism, removing the UAT_MOCK_USER bypass (PGAP-01) would leave devs unable to authenticate at all (LDAP returns 503 in dev profile). This plan seeds all required reference data and provides a dev-only `POST /api/auth/dev-login` endpoint that validates against H2-stored bcrypt password hash.

Output:
1. DevDataSeeder.java enhanced with contact methods + admin person (with bcrypt password_hash) seeding
2. DevLoginController.java — new `@Profile("dev")` controller with `POST /api/auth/dev-login` that validates password against BCrypt hash and issues JWT cookie
3. application-dev.yml updated to expose the dev-login endpoint publicly (SecurityConfig patch note)
</objective>

<feature_dependencies>
Implements: ADMIN-01: Admin panels reference data (departments, categories, contact methods seeded for dropdowns), F13: Lookup table admin reference data (substatus, issue types, contact methods, actions)
Depends on: None (prerequisite gap fix, runs parallel to PGAP-01)
Enables: SEARCH-02: Bookmark save (requires seeded person for FK reference)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@backend/src/main/java/com/ureport/config/DevDataSeeder.java
@backend/src/main/resources/application-dev.yml
@backend/src/main/java/com/ureport/auth/AuthController.java
@backend/src/main/java/com/ureport/security/SecurityConfig.java
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enhance DevDataSeeder with contact methods and seeded admin person</name>
  <files>backend/src/main/java/com/ureport/config/DevDataSeeder.java</files>
  <action>
Rewrite `backend/src/main/java/com/ureport/config/DevDataSeeder.java` to add:
1. Contact methods seeding (was completely missing)
2. A seeded admin Person with bcrypt password_hash (so dev login works after PGAP-01)

The current DevDataSeeder seeds: Substatus, IssueTypes, Department, CategoryGroups+Categories, Actions.
Missing: ContactMethods, a Person with admin role + password.

Also fix the issue type names to match V1 migration exactly:
- Current seeder: "Complaint", "Service Request", "Inquiry", "Compliment", "Suggestion", "Other"
- V1 migration (correct): "Comment", "Complaint", "Question", "Report", "Request", "Violation"

The rewrite should preserve ALL existing seed logic and add the new seed blocks:

```java
package com.ureport.config;

import com.ureport.domain.*;
import com.ureport.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Seeds minimal reference data for the 'dev' profile (H2 in-memory database).
 * Enables the React frontend to render dropdowns, category tiles, etc.
 * during development without requiring a live PostgreSQL database with Flyway migrations.
 *
 * Dev admin credentials: username=devadmin / password=admin123
 * Use POST /api/auth/dev-login to obtain a JWT cookie for testing authenticated endpoints.
 */
@Configuration
@Profile("dev")
public class DevDataSeeder {

    @Bean
    CommandLineRunner seedDevData(
            ContactMethodRepository contactMethodRepo,
            SubstatusRepository substatusRepo,
            IssueTypeRepository issueTypeRepo,
            CategoryGroupRepository categoryGroupRepo,
            CategoryRepository categoryRepo,
            ActionsRepository actionsRepo,
            DepartmentRepository deptRepo,
            PersonRepository personRepo
    ) {
        return args -> {

            // --- Contact Methods (Phone, Email, Walk-in, Mail) ---
            // Matches V1 migration: INSERT INTO contact_methods (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');
            if (contactMethodRepo.count() == 0) {
                for (String name : new String[]{"Phone", "Email", "Walk-in", "Mail"}) {
                    ContactMethod cm = new ContactMethod();
                    cm.setName(name);
                    contactMethodRepo.save(cm);
                }
            }

            // --- Substatuses (closed, resolved, etc.) ---
            if (substatusRepo.count() == 0) {
                Substatus resolved = new Substatus();
                resolved.setName("Resolved");
                resolved.setStatus("closed");
                resolved.setIsDefault(true);
                substatusRepo.save(resolved);

                Substatus duplicate = new Substatus();
                duplicate.setName("Duplicate");
                duplicate.setStatus("closed");
                duplicate.setIsDefault(false);
                substatusRepo.save(duplicate);

                Substatus bogus = new Substatus();
                bogus.setName("Bogus");
                bogus.setStatus("closed");
                bogus.setIsDefault(false);
                substatusRepo.save(bogus);
            }

            // --- Issue Types (matching V1 migration names exactly) ---
            if (issueTypeRepo.count() == 0) {
                for (String name : new String[]{"Comment", "Complaint", "Question", "Report", "Request", "Violation"}) {
                    IssueType it = new IssueType();
                    it.setName(name);
                    issueTypeRepo.save(it);
                }
            }

            // --- Departments ---
            Department dept;
            if (deptRepo.count() == 0) {
                dept = new Department();
                dept.setName("Public Works");
                dept = deptRepo.save(dept);
            } else {
                dept = deptRepo.findAll().iterator().next();
            }

            // --- Dev admin Person (for JWT authentication in dev mode) ---
            // Credentials: devadmin / admin123 (bcrypt hash of "admin123")
            if (personRepo.count() == 0) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                Person admin = new Person();
                admin.setUsername("devadmin");
                admin.setFirstname("Dev");
                admin.setLastname("Admin");
                admin.setRole("admin");
                admin.setPasswordHash(encoder.encode("admin123"));
                admin.setDepartment(dept);
                personRepo.save(admin);
            }

            // --- Category Groups + Categories (for StepCategory wizard and accordion) ---
            if (categoryGroupRepo.count() == 0) {
                // Group 1: Streets/Roads (matches V1 seed name variant)
                CategoryGroup roads = new CategoryGroup();
                roads.setName("Streets");
                roads.setOrdering((short) 1);
                roads = categoryGroupRepo.save(roads);

                Category pothole = new Category();
                pothole.setName("Pothole");
                pothole.setDescription("Report a pothole");
                pothole.setCategoryGroup(roads);
                pothole.setDepartment(dept);
                pothole.setActive(true);
                pothole.setFeatured(true);
                pothole.setDisplayPermissionLevel("anonymous");
                pothole.setPostingPermissionLevel("anonymous");
                categoryRepo.save(pothole);

                Category streetlight = new Category();
                streetlight.setName("Street Light Outage");
                streetlight.setDescription("Report a broken street light");
                streetlight.setCategoryGroup(roads);
                streetlight.setDepartment(dept);
                streetlight.setActive(true);
                streetlight.setFeatured(false);
                streetlight.setDisplayPermissionLevel("anonymous");
                streetlight.setPostingPermissionLevel("anonymous");
                categoryRepo.save(streetlight);

                // Group 2: Sanitation
                CategoryGroup sanitation = new CategoryGroup();
                sanitation.setName("Sanitation");
                sanitation.setOrdering((short) 2);
                sanitation = categoryGroupRepo.save(sanitation);

                Category trash = new Category();
                trash.setName("Overflowing Trash");
                trash.setDescription("Report overflowing trash bins");
                trash.setCategoryGroup(sanitation);
                trash.setDepartment(dept);
                trash.setActive(true);
                trash.setFeatured(true);
                trash.setDisplayPermissionLevel("anonymous");
                trash.setPostingPermissionLevel("anonymous");
                categoryRepo.save(trash);

                // Group 3: Other
                CategoryGroup other = new CategoryGroup();
                other.setName("Other");
                other.setOrdering((short) 3);
                other = categoryGroupRepo.save(other);

                Category general = new Category();
                general.setName("General Request");
                general.setDescription("General service request");
                general.setCategoryGroup(other);
                general.setDepartment(dept);
                general.setActive(true);
                general.setFeatured(false);
                general.setDisplayPermissionLevel("anonymous");
                general.setPostingPermissionLevel("anonymous");
                categoryRepo.save(general);
            }

            // --- Actions (system actions matching V1 migration — 10 entries) ---
            if (actionsRepo.count() == 0) {
                String[][] actions = {
                    {"open",           "system", "Opened by {actionPerson}"},
                    {"assignment",     "system", "{enteredByPerson} assigned this case to {actionPerson}"},
                    {"closed",         "system", "Closed by {actionPerson}"},
                    {"changeCategory", "system", "Changed category from {original:category_id} to {updated:category_id}"},
                    {"changeLocation", "system", "Changed location from {original:location} to {updated:location}"},
                    {"response",       "system", "{actionPerson} contacted {reportedByPerson_id}"},
                    {"duplicate",      "system", "{duplicate:ticket_id} marked as a duplicate of this case."},
                    {"update",         "system", "{enteredByPerson} updated this case."},
                    {"comment",        "system", "{enteredByPerson} commented on this case."},
                    {"upload_media",   "system", "{enteredByPerson} uploaded an attachment."},
                };
                for (String[] row : actions) {
                    Action a = new Action();
                    a.setName(row[0]);
                    a.setType(row[1]);
                    a.setDescription(row[2]);
                    actionsRepo.save(a);
                }
            }
        };
    }
}
```

**Important implementation notes:**
- The `ContactMethodRepository` already exists at `com.ureport.repository.ContactMethodRepository`
- `BCryptPasswordEncoder` is available via `spring-boot-starter-security` (already in pom.xml) — no new dependency needed
- The `Person()` default constructor (no-args) is used, then setters called individually — do NOT use `Person(String, String)` constructor for the admin (it only sets username+role, not all fields)
- `dept = deptRepo.save(dept)` must use the return value (managed entity) before passing to categories
- After saving the department, save person referencing that department before saving categories
- `personRepo` is the existing `com.ureport.repository.PersonRepository`
  </action>
  <verify>
cd backend && mvn compile -q 2>&1 | tail -20 && echo "COMPILE OK"
grep -n "contactMethodRepo\|ContactMethod\|Phone.*Email\|Walk-in" backend/src/main/java/com/ureport/config/DevDataSeeder.java | head -10
grep -n "BCryptPasswordEncoder\|passwordHash\|devadmin" backend/src/main/java/com/ureport/config/DevDataSeeder.java | head -10
grep -n "Comment.*Complaint\|\"Comment\"\|\"Complaint\"\|\"Question\"\|\"Report\"\|\"Request\"\|\"Violation\"" backend/src/main/java/com/ureport/config/DevDataSeeder.java | head -5
  </verify>
  <done>
- `mvn compile` exits 0 with no Java compilation errors
- `grep contactMethodRepo DevDataSeeder.java` returns matches — contact methods are seeded
- `grep BCryptPasswordEncoder DevDataSeeder.java` returns matches — admin person password is hashed
- Issue type names match V1 migration: Comment, Complaint, Question, Report, Request, Violation
- Category groups seeded as: Streets, Sanitation, Other (matching V1 migration names)
- 10 system actions seeded with correct names matching V1 migration
  </done>
</task>

<task type="auto">
  <name>Task 2: Create DevLoginController for password-based JWT auth in dev profile</name>
  <files>
    backend/src/main/java/com/ureport/auth/DevLoginController.java
    backend/src/main/resources/application-dev.yml
  </files>
  <action>
Create `backend/src/main/java/com/ureport/auth/DevLoginController.java` — a dev-profile-only Spring MVC controller that authenticates by checking the BCrypt password_hash stored in H2 for the seeded devadmin person.

This endpoint replaces LDAP for dev-mode authentication (LDAP is disabled in dev profile → returns 503 for all LDAP attempts). Without this, removing UAT_MOCK_USER would make the app completely unusable in dev mode.

```java
package com.ureport.auth;

import com.ureport.auth.dto.AuthMeResponse;
import com.ureport.domain.Person;
import com.ureport.repository.PersonRepository;
import com.ureport.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * DEV PROFILE ONLY — not included in production builds.
 *
 * Provides POST /api/auth/dev-login for password-based authentication
 * against the H2 in-memory database (bypasses LDAP which is disabled in dev).
 *
 * Used to obtain a real JWT cookie during development/UAT so all /api/** authenticated
 * endpoints can be exercised via the React frontend.
 *
 * Credentials seeded by DevDataSeeder: username=devadmin, password=admin123
 */
@RestController
@RequestMapping("/api/auth")
@Profile("dev")
public class DevLoginController {

    private final PersonRepository personRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${jwt.expiry-seconds:28800}")
    private long expirySeconds;

    public DevLoginController(PersonRepository personRepository, JwtService jwtService) {
        this.personRepository = personRepository;
        this.jwtService = jwtService;
    }

    record DevLoginRequest(String username, String password) {}

    /**
     * POST /api/auth/dev-login
     *
     * Validates username + password against BCrypt hash in H2 people table.
     * Returns 200 + AuthMeResponse + auth_token httpOnly cookie on success.
     * Returns 401 on bad credentials, 404 if user not found.
     *
     * This endpoint is CSRF-exempt (like /api/auth/ldap — see SecurityConfig.ignoringRequestMatchers).
     */
    @PostMapping("/dev-login")
    public ResponseEntity<AuthMeResponse> devLogin(@RequestBody DevLoginRequest request) {
        Person person = personRepository.findByUsername(request.username())
                .orElse(null);

        if (person == null) {
            return ResponseEntity.status(401)
                    .body(null);
        }

        // Validate password against bcrypt hash stored by DevDataSeeder
        if (person.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), person.getPasswordHash())) {
            return ResponseEntity.status(401).build();
        }

        String token = jwtService.generateToken(person.getId(), person.getUsername(), person.getRole());

        Instant expiresAt = Instant.now().plusSeconds(expirySeconds);
        String expiresAtStr = DateTimeFormatter.ISO_INSTANT.format(expiresAt);

        AuthMeResponse body = new AuthMeResponse(
                person.getId(),
                person.getUsername(),
                person.getRole(),
                person.getFirstname(),
                person.getLastname(),
                expiresAtStr
        );

        ResponseCookie cookie = ResponseCookie.from("auth_token", token)
                .httpOnly(true)
                .sameSite("Strict")
                .secure(false)     // false for HTTP localhost dev (not HTTPS in dev)
                .path("/")
                .maxAge(expirySeconds)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }
}
```

**SecurityConfig note:** The existing SecurityConfig already has:
```java
.requestMatchers(HttpMethod.POST, "/api/auth/ldap").permitAll()
```
And a catch-all:
```java
"/api/**" → .authenticated()
```
The `/api/auth/dev-login` endpoint needs to be publicly accessible (no JWT required to call it — it IS the login endpoint). SecurityConfig is NOT annotated `@Profile("dev")` and cannot conditionally permit endpoints.

**Solution:** Add `/api/auth/dev-login` to SecurityConfig's permitAll list. This is safe because:
1. The endpoint class itself is `@Profile("dev")` — it doesn't exist in production → any call to `/api/auth/dev-login` in prod returns 404 (no route)
2. The permitAll in SecurityConfig for a non-existent route is harmless

Update `backend/src/main/resources/application-dev.yml` to add a comment noting the dev login endpoint:

```yaml
# Dev-only authentication endpoint (replaces LDAP which is disabled in dev)
# POST /api/auth/dev-login with {"username": "devadmin", "password": "admin123"}
# to obtain a JWT cookie for testing authenticated API endpoints.
#
# The devadmin account is seeded by DevDataSeeder on startup.
```

Add this comment block at the bottom of application-dev.yml (after the `cas:` block).

**ALSO update SecurityConfig.java** to permit the dev-login endpoint:

In `backend/src/main/java/com/ureport/security/SecurityConfig.java`, find the section:
```java
.requestMatchers(HttpMethod.POST, "/api/auth/ldap").permitAll()
```

Add immediately after it:
```java
.requestMatchers(HttpMethod.POST, "/api/auth/dev-login").permitAll()  // dev profile only — endpoint is @Profile("dev")
```

This requires adding `backend/src/main/java/com/ureport/security/SecurityConfig.java` to files_modified as well. The edit is a single line addition in the permitAll block.
  </action>
  <verify>
cd backend && mvn compile -q 2>&1 | tail -20 && echo "COMPILE OK"
grep -n "DevLoginController\|dev-login\|@Profile.*dev" backend/src/main/java/com/ureport/auth/DevLoginController.java | head -10
grep -n "dev-login" backend/src/main/java/com/ureport/security/SecurityConfig.java | head -5
grep -n "BCryptPasswordEncoder\|passwordEncoder\|matches" backend/src/main/java/com/ureport/auth/DevLoginController.java | head -5
grep -n "secure.*false\|SameSite\|auth_token" backend/src/main/java/com/ureport/auth/DevLoginController.java | head -5
  </verify>
  <done>
- `mvn compile` exits 0 with no compilation errors
- `DevLoginController.java` exists at the correct path with `@Profile("dev")` annotation
- `grep "dev-login" SecurityConfig.java` returns the permitAll rule for POST /api/auth/dev-login
- `grep BCryptPasswordEncoder DevLoginController.java` shows password validation via bcrypt
- Cookie uses `secure(false)` for HTTP localhost dev (unlike production which uses `secure(true)`)
- `grep "devadmin\|admin123" application-dev.yml` shows the usage comment
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | POST /api/auth/dev-login request body ({username, password}) from the dev browser crossing into the Spring MVC handler |
| db→auth | BCrypt hash from H2 people table used to validate submitted plaintext password |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-09P2-01 | Elevation of privilege | DevLoginController endpoint in production | mitigate | `DevLoginController` is annotated `@Profile("dev")` — Spring does NOT register this bean when `spring.profiles.active` is not `dev`. In production (PostgreSQL profile), the endpoint returns 404 (no route). The SecurityConfig permitAll for `/api/auth/dev-login` is harmless in production because no controller handles that path. |
| T-09P2-02 | Spoofing | BCrypt password validation in DevLoginController | mitigate | Password validated via `BCryptPasswordEncoder.matches(rawPassword, storedHash)` in `DevLoginController.devLogin()`. Plaintext password is never stored; only the BCrypt hash (set by DevDataSeeder using `encoder.encode("admin123")`) is persisted in H2. |
| T-09P2-03 | Information disclosure | Seeded devadmin credentials in source code | accept | Dev credentials (devadmin/admin123) are hardcoded in DevDataSeeder as a development convenience. This is intentional — it is a disposable H2 in-memory database that is destroyed on restart. Production uses PostgreSQL with real LDAP/CAS credentials, never the BCrypt seed. Risk accepted: development environment only, no production data involved. |
| T-09P2-04 | Tampering | Issue type names mismatch vs V1 migration | mitigate | DevDataSeeder corrected to use V1-matching names (Comment, Complaint, Question, Report, Request, Violation) matching `V1__initial_schema.sql` INSERT exactly. Category groups also aligned to V1 names (Streets, Sanitation, Other) to match production seed data. |
| T-09P2-05 | Denial of service | BCryptPasswordEncoder in dev login | accept | BCrypt work factor (default 10) adds ~100ms per login attempt. Acceptable for dev endpoint with minimal traffic. No rate limiting implemented; dev-only endpoint, owned by development team. |
</threat_model>

<verification>
1. `cd backend && mvn compile -q` → exits 0, no compilation errors
2. `grep -n "contactMethodRepo" backend/src/main/java/com/ureport/config/DevDataSeeder.java` → shows contact method seeding block
3. `grep -n '"Comment"\|"Complaint"\|"Question"\|"Report"\|"Request"\|"Violation"' backend/src/main/java/com/ureport/config/DevDataSeeder.java` → shows corrected V1-matching issue type names
4. `grep -n "BCryptPasswordEncoder\|devadmin" backend/src/main/java/com/ureport/config/DevDataSeeder.java` → shows admin person seeding with bcrypt
5. `grep -n "@Profile.*dev\|DevLoginController" backend/src/main/java/com/ureport/auth/DevLoginController.java` → confirms dev profile annotation
6. `grep -n "dev-login\|permitAll" backend/src/main/java/com/ureport/security/SecurityConfig.java` → shows dev-login in permitAll list
7. `grep -n "secure.*false" backend/src/main/java/com/ureport/auth/DevLoginController.java` → confirms HTTP localhost compatibility (no HTTPS requirement in dev)
</verification>

<success_criteria>
- DevDataSeeder seeds contact methods (Phone, Email, Walk-in, Mail) — was completely missing
- DevDataSeeder uses correct V1-matching issue type names: Comment, Complaint, Question, Report, Request, Violation
- DevDataSeeder seeds a devadmin Person with BCrypt-hashed password for local login
- DevDataSeeder seeds 10 system actions matching V1 migration names exactly
- DevDataSeeder seeds category groups as Streets, Sanitation, Other (matching V1 migration)
- DevLoginController.java exists and is `@Profile("dev")` — not included in production
- POST /api/auth/dev-login with correct credentials returns 200 + auth_token httpOnly cookie
- POST /api/auth/dev-login with wrong credentials returns 401
- SecurityConfig permits POST /api/auth/dev-login without JWT
- `mvn compile` exits 0
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-panels-and-integration/09-PGAP-02-SUMMARY.md` with:
- List of all files created/modified
- Dev credentials documented: username=devadmin, password=admin123, endpoint=POST /api/auth/dev-login
- Confirmation that contact methods seed block was added
- Confirmation that issue type names were corrected to match V1 migration
- Any compilation issues encountered and resolved
</output>
