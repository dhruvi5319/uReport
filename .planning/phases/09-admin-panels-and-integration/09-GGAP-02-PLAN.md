---
phase: 09-admin-panels-and-integration
plan: GGAP-02
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java
  - backend/src/test/resources/application-test.yml
  - backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java
  - backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java
autonomous: true
gap_closure: true

features:
  implements: ["AUTH-03", "ADMIN-01"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Open311GoldenFileIT all 8 tests pass with no DataIntegrityViolationException"
    - "ApplicationSmokeIT actuatorHealth_returnsUp passes (DB health shows UP)"
    - "ApplicationSmokeIT has a correctly-named test asserting 503 when LDAP is disabled"
    - "A new LdapAuthControllerTest @WebMvcTest verifies BadCredentialsException → 401"
  artifacts:
    - path: "backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java"
      provides: "Open311 golden file tests — Client seeded with Person FK to satisfy NOT NULL constraint"
    - path: "backend/src/test/resources/application-test.yml"
      provides: "Test classpath config with datasource block removed — Zonky blank-URL wins"
    - path: "backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java"
      provides: "4 smoke tests with corrected LDAP-disabled assertion (503)"
    - path: "backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java"
      provides: "WebMvcTest verifying BadCredentialsException → 401 via mocked LdapAuthService"
  key_links:
    - from: "backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java"
      to: "backend/src/main/java/com/ureport/domain/Client.java"
      via: "client.setContactPerson(contact) before clientRepository.save()"
      pattern: "setContactPerson"
    - from: "backend/src/test/resources/application-test.yml"
      to: "backend/src/main/resources/application-test.yml"
      via: "Zonky DataSource bean auto-configuration with blank url"
      pattern: "datasource"

integration_contracts:
  requires: []
  provides:
    - artifact: "backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java"
      exports: ["Open311GoldenFileIT"]
      shape: |
        @Autowired PersonRepository personRepository;
        // @BeforeEach seeds Person then sets client.setContactPerson(contact)
      verify: "grep -n 'setContactPerson' backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java && echo CONTRACT_OK"
    - artifact: "backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java"
      exports: ["LdapAuthControllerTest"]
      shape: |
        @WebMvcTest(AuthController.class)
        @MockBean LdapAuthService
        // when().thenThrow(BadCredentialsException) → expect 401
      verify: "grep -n 'LdapAuthControllerTest' backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java && echo CONTRACT_OK"
---

<objective>
Fix two backend test suite failures: Open311GoldenFileIT (contact_person_id NOT NULL FK violation) and ApplicationSmokeIT (wrong datasource URL override + wrong LDAP-disabled status assertion).

Purpose: All 8 Open311GoldenFileIT tests and all 4 ApplicationSmokeIT tests must pass to satisfy UAT Tests 13 and 14. Three targeted changes achieve this without touching production code.
Output: Fixed Open311GoldenFileIT with Person seed before Client; application-test.yml with datasource block removed; ApplicationSmokeIT with renamed test asserting 503; new LdapAuthControllerTest asserting BadCredentialsException → 401.
</objective>

<feature_dependencies>
Implements: AUTH-03: Integration tests covering auth rejection paths; ADMIN-01: Open311 golden file regression guard
Depends on: None (all production code already exists)
Enables: None
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-admin-panels-and-integration/09-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Open311GoldenFileIT — seed Person before creating Client</name>
  <files>backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java</files>
  <action>
**Root cause:** The V1 schema declares `contact_person_id BIGINT NOT NULL` on the `clients` table. Open311GoldenFileIT.java `@BeforeEach` creates a `Client` and sets `name` and `apiKey` but never calls `setContactPerson()`. When Hibernate flushes, PostgreSQL rejects the null FK → `DataIntegrityViolationException`.

**Fix:**

1. Add `@Autowired PersonRepository personRepository;` field to the test class (alongside the existing `clientRepository`, `categoryRepository`, `categoryGroupRepository` autowires).

2. In `@BeforeEach setUp()`, before the `if (clientRepository.findByApiKey(TEST_API_KEY).isEmpty())` block, seed a contact Person:

```java
// Seed a contact person required by Client.contact_person_id NOT NULL constraint
Person contact = personRepository.findByUsername("test-contact").orElseGet(() -> {
    Person p = new Person();
    p.setFirstname("Test");
    p.setLastname("Contact");
    p.setUsername("test-contact");
    p.setRole("staff");
    return personRepository.save(p);
});
```

3. Then inside the `if (clientRepository.findByApiKey(TEST_API_KEY).isEmpty())` block, add `client.setContactPerson(contact);` before `clientRepository.save(client)`:

```java
if (clientRepository.findByApiKey(TEST_API_KEY).isEmpty()) {
    Client client = new Client();
    client.setName("Test Client");
    client.setApiKey(TEST_API_KEY);
    client.setContactPerson(contact);   // ← ADD THIS LINE
    clientRepository.save(client);
}
```

**Import to add:** `import com.ureport.domain.Person;` and `import com.ureport.repository.PersonRepository;` at the top of the file alongside existing imports.

The `Person` no-arg constructor is available (JPA requirement). Set `firstname`, `lastname`, `username`, `role` to satisfy any non-null constraints. The `findByUsername` guard mirrors the existing Client guard pattern so re-runs within the same transaction don't duplicate the record.
  </action>
  <verify>
```bash
grep -n 'setContactPerson' backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java && echo CONTACT_PERSON_SET
grep -n 'PersonRepository' backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java && echo PERSON_REPO_INJECTED
```
Both must print.
  </verify>
  <done>
- Open311GoldenFileIT.java injects PersonRepository
- @BeforeEach seeds a Person with username "test-contact" using findByUsername guard
- Client.setContactPerson(contact) is called before clientRepository.save()
- All 8 Open311GoldenFileIT tests should pass: no DataIntegrityViolationException on Client insert
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix ApplicationSmokeIT datasource override + LDAP-disabled assertion + add WebMvcTest</name>
  <files>backend/src/test/resources/application-test.yml, backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java, backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java</files>
  <action>
**Fix A — Remove datasource block from src/test/resources/application-test.yml:**

Root cause: `src/test/resources/application-test.yml` (test-classpath) contains:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ureport
    driver-class-name: org.postgresql.Driver
    username: ureport
    password: ureport
```
This overrides the main-classpath `src/main/resources/application-test.yml` which intentionally sets `url:` blank so Zonky's `EmbeddedPostgresAutoConfiguration` can register the DataSource bean first. With the hardcoded URL, Hikari tries to connect to `localhost:5432` (no PostgreSQL running in K8s sandbox) → DB health check fails → actuator returns DOWN → 503.

**Action:** Remove the entire `spring.datasource` block (lines containing `datasource:`, `url: jdbc:postgresql://...`, `driver-class-name:`, `username: ureport`, `password: ureport`) from `backend/src/test/resources/application-test.yml`. Keep the remaining properties (`open311.obsolete-api-keys`, `spring.jpa.*`, `spring.flyway.*`, `jwt.*`, `ldap.*`, `cas.*`).

The resulting file should look like:
```yaml
open311:
  obsolete-api-keys: test-obsolete-key

spring:
  jpa:
    hibernate:
      ddl-auto: none
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    clean-disabled: false

jwt:
  secret: test-secret-key-for-testing-only-must-be-at-least-32-chars
  expiry-seconds: 3600
  issuer: ureport-test

ldap:
  enabled: false

cas:
  enabled: false
```

**Fix B — Rename LDAP-disabled test in ApplicationSmokeIT.java:**

Root cause: `ldapAuth_withBadCredentials_returns401()` asserts `HttpStatus.UNAUTHORIZED` (401) but when `ldap.enabled=false`, `LdapAuthService.authenticate()` throws `IllegalStateException` → `AuthController` catches it → returns 503 `SERVICE_UNAVAILABLE`. The test is asserting the wrong expected status.

**Action:** In `backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java`:
- Rename the test method from `ldapAuth_withBadCredentials_returns401` → `ldapAuth_whenLdapDisabled_returns503`
- Change the assertion from `HttpStatus.UNAUTHORIZED` → `HttpStatus.SERVICE_UNAVAILABLE`
- Update the Javadoc comment accordingly:

```java
/**
 * T-09-12 regression guard: POST /api/auth/ldap when ldap.enabled=false
 * returns 503 SERVICE_UNAVAILABLE (LDAP not configured in test profile).
 * See LdapAuthControllerTest for the 401 bad-credentials path (mocked).
 */
@Test
void ldapAuth_whenLdapDisabled_returns503() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    HttpEntity<String> request = new HttpEntity<>(
        "{\"username\":\"nobody\",\"password\":\"wrong\"}", headers);
    ResponseEntity<String> response = restTemplate.postForEntity(
        url("/api/auth/ldap"), request, String.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
}
```

**Fix C — Create LdapAuthControllerTest.java (new file):**

Create `backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java` — a `@WebMvcTest` that mocks `LdapAuthService` to throw `BadCredentialsException` and verifies `AuthController` returns 401:

```java
package com.ureport.auth;

import com.ureport.repository.PersonRepository;
import com.ureport.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit test for AuthController LDAP login path using @WebMvcTest (no full Spring context).
 * Mocks LdapAuthService so we can exercise the 401 path without a real LDAP server.
 */
@WebMvcTest(AuthController.class)
@ActiveProfiles("test")
class LdapAuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    LdapAuthService ldapAuthService;

    @MockBean
    JwtService jwtService;

    @MockBean
    PersonRepository personRepository;

    /**
     * When LdapAuthService throws BadCredentialsException, AuthController returns 401.
     */
    @Test
    void ldapLogin_badCredentials_returns401() throws Exception {
        when(ldapAuthService.authenticate(anyString(), anyString()))
            .thenThrow(new BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/ldap")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"attacker\",\"password\":\"wrong\"}"))
            .andExpect(status().isUnauthorized());
    }
}
```

**Note on WebMvcTest security:** `@WebMvcTest` loads the security filter chain. If `SecurityConfig` requires beans that aren't mocked here (e.g., `JwtAuthFilter`), add `@MockBean` for those as well. If the test fails due to missing security beans, add `@MockBean` for `com.ureport.security.JwtAuthFilter` and `com.ureport.security.CustomUserDetailsService`.
  </action>
  <verify>
```bash
# Verify datasource block removed
grep -n 'jdbc:postgresql' backend/src/test/resources/application-test.yml && echo "FAIL - datasource URL still present" || echo "OK - datasource URL removed"

# Verify smoke test renamed
grep -n 'ldapAuth_whenLdapDisabled_returns503' backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java && echo SMOKE_RENAMED
grep -n 'SERVICE_UNAVAILABLE' backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java && echo SMOKE_503

# Verify new WebMvcTest exists
grep -n 'LdapAuthControllerTest' backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java && echo WEBMVC_TEST_EXISTS
grep -n 'BadCredentialsException' backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java && echo BAD_CREDS_MOCKED
```
All echo statements except the first "FAIL" check must print.
  </verify>
  <done>
- backend/src/test/resources/application-test.yml: spring.datasource block fully removed; remaining properties intact
- ApplicationSmokeIT.java: method renamed to ldapAuth_whenLdapDisabled_returns503; asserts SERVICE_UNAVAILABLE (503)
- LdapAuthControllerTest.java created with @WebMvcTest(AuthController.class), mocks LdapAuthService to throw BadCredentialsException, asserts 401
- actuatorHealth_returnsUp test will pass (Zonky DataSource now wins, DB health UP)
- ldapAuth_whenLdapDisabled_returns503 test passes (asserts correct 503)
- ldapLogin_badCredentials_returns401 unit test passes (mocked service, no LDAP needed)
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→API | POST /api/auth/ldap accepting JSON credentials into AuthController handler |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-09-G2-01 | Information disclosure | ApplicationSmokeIT datasource URL | mitigate | Removing hardcoded `jdbc:postgresql://localhost:5432/ureport` from test-classpath YAML prevents credential leakage in test config; Zonky provides ephemeral embedded DB with no persistent credentials. Guard: `src/test/resources/application-test.yml` datasource block absent. |
| T-09-G2-02 | Spoofing | LdapAuthControllerTest MockBean injection | accept | Test uses `@MockBean` — mock is scoped to test context only; cannot affect production auth flow. Residual risk: none in test scope. Owner: test suite. |
</threat_model>

<verification>
```bash
# Gap 2: Open311GoldenFileIT fix
grep -c 'setContactPerson' backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java
grep -c 'PersonRepository' backend/src/test/java/com/ureport/open311/Open311GoldenFileIT.java

# Gap 3a: datasource URL removed from test classpath
grep 'jdbc:postgresql' backend/src/test/resources/application-test.yml && echo FAIL || echo PASS

# Gap 3b: smoke test assertion corrected
grep 'SERVICE_UNAVAILABLE' backend/src/test/java/com/ureport/smoke/ApplicationSmokeIT.java

# Gap 3c: new WebMvcTest present
ls backend/src/test/java/com/ureport/auth/LdapAuthControllerTest.java && echo EXISTS
```
</verification>

<success_criteria>
- Open311GoldenFileIT seeds a Person before creating the Client; no DataIntegrityViolationException
- src/test/resources/application-test.yml has NO spring.datasource block; Zonky DataSource wins
- ApplicationSmokeIT has ldapAuth_whenLdapDisabled_returns503 asserting 503 (not 401)
- LdapAuthControllerTest.java exists with @WebMvcTest mocking BadCredentialsException → 401
- UAT Test 13 gap resolved: Open311GoldenFileIT 8/8 pass
- UAT Test 14 gap resolved: ApplicationSmokeIT 4/4 pass (health UP, Open311 OK, LDAP-disabled 503, tickets 401)
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-panels-and-integration/09-GGAP-02-SUMMARY.md`
</output>
