---
phase: implement-the-full-ureport-modernization
plan: "02"
type: execute
wave: 2a
depends_on: [1]
files_modified:
  - api/pom.xml
  - api/src/main/java/com/ureport/UReportApplication.java
  - api/src/main/resources/application.yml
  - api/src/main/java/com/ureport/config/SecurityConfig.java
  - api/src/main/java/com/ureport/config/JwtConfig.java
  - api/src/main/java/com/ureport/config/WebMvcConfig.java
  - api/src/main/java/com/ureport/security/JwtAuthenticationFilter.java
  - api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java
  - api/src/main/java/com/ureport/security/JwtTokenProvider.java
  - api/src/main/java/com/ureport/security/JwtUserDetails.java
  - api/src/main/java/com/ureport/security/ApiKeyPrincipal.java
  - api/src/main/java/com/ureport/security/PermissionEvaluator.java
  - api/src/main/java/com/ureport/controller/AuthController.java
  - api/src/main/java/com/ureport/controller/CallbackController.java
  - api/src/main/java/com/ureport/controller/TicketController.java
  - api/src/main/java/com/ureport/controller/TicketHistoryController.java
  - api/src/main/java/com/ureport/service/AuthService.java
  - api/src/main/java/com/ureport/service/TicketService.java
  - api/src/main/java/com/ureport/service/TicketHistoryService.java
  - api/src/main/java/com/ureport/util/TemplateVariableResolver.java
  - api/src/main/java/com/ureport/entity/Ticket.java
  - api/src/main/java/com/ureport/entity/TicketHistory.java
  - api/src/main/java/com/ureport/entity/Person.java
  - api/src/main/java/com/ureport/entity/Category.java
  - api/src/main/java/com/ureport/entity/Substatus.java
  - api/src/main/java/com/ureport/entity/Action.java
  - api/src/main/java/com/ureport/entity/RefreshToken.java
  - api/src/main/java/com/ureport/entity/TokenBlacklist.java
  - api/src/main/java/com/ureport/repository/TicketRepository.java
  - api/src/main/java/com/ureport/repository/TicketHistoryRepository.java
  - api/src/main/java/com/ureport/repository/PersonRepository.java
  - api/src/main/java/com/ureport/repository/RefreshTokenRepository.java
  - api/src/main/java/com/ureport/repository/TokenBlacklistRepository.java
  - api/src/main/java/com/ureport/repository/ActionRepository.java
  - api/src/main/java/com/ureport/repository/SubstatusRepository.java
  - api/src/main/java/com/ureport/repository/CategoryRepository.java
  - api/src/main/java/com/ureport/dto/request/LoginRequest.java
  - api/src/main/java/com/ureport/dto/request/CreateTicketRequest.java
  - api/src/main/java/com/ureport/dto/request/UpdateTicketRequest.java
  - api/src/main/java/com/ureport/dto/request/CloseTicketRequest.java
  - api/src/main/java/com/ureport/dto/response/AuthResponse.java
  - api/src/main/java/com/ureport/dto/response/TicketResponse.java
  - api/src/main/java/com/ureport/dto/response/HistoryEntryResponse.java
  - api/src/main/java/com/ureport/exception/GlobalExceptionHandler.java
  - api/src/main/java/com/ureport/exception/NotFoundException.java
  - api/src/main/java/com/ureport/exception/PermissionDeniedException.java
  - api/src/main/java/com/ureport/exception/ValidationException.java
  - api/src/main/java/com/ureport/exception/InvalidTransitionException.java
  - api/Dockerfile
  - api/src/test/java/com/ureport/service/TicketServiceTest.java
  - api/src/test/java/com/ureport/service/AuthServiceTest.java
  - api/src/test/java/com/ureport/service/TicketHistoryServiceTest.java
autonomous: true

features:
  implements: ["F3", "F4", "F0", "F1"]
  depends_on: ["F0", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20"]
  enables: ["F2", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20"]

must_haves:
  truths:
    - "POST /api/v1/auth/login returns {accessToken, refreshToken, expiresIn, role, personId} for valid credentials"
    - "POST /api/v1/auth/refresh rotates the refresh token and returns a new access token"
    - "POST /api/v1/auth/logout revokes the refresh token and blacklists the access token jti"
    - "GET /callback exchanges OAuth code for a local people record and issues JWT"
    - "Every request with a valid JWT sets SecurityContextHolder with personId and role"
    - "Invalid or expired JWTs return HTTP 401; missing auth on protected endpoints returns HTTP 401"
    - "Staff-only endpoints return HTTP 403 for public/anonymous callers"
    - "POST /api/v1/tickets creates a ticket, writes an 'open' ticketHistory entry, returns 201"
    - "PATCH /api/v1/tickets/{id}/assign updates assignedPerson_id and appends 'assignment' history entry"
    - "PATCH /api/v1/tickets/{id}/close sets status=closed, closedDate, substatus_id, appends 'closed' history"
    - "PATCH /api/v1/tickets/{id}/reopen sets status=open, clears closedDate, assigns default open substatus"
    - "PATCH /api/v1/tickets/{id}/duplicate sets parent_id, closes ticket with Duplicate substatus"
    - "POST /api/v1/tickets/{id}/comments appends a 'comment' history entry"
    - "GET /api/v1/tickets/{id}/history returns entries ordered by enteredDate ASC with renderedDescription"
    - "TemplateVariableResolver correctly resolves {enteredByPerson}, {actionPerson}, {original:field}, {updated:field}, {duplicate:ticket_id}"
  artifacts:
    - path: "api/pom.xml"
      provides: "Maven project with Spring Boot 3.x, Spring Security, jose4j/jjwt, HikariCP, PostgreSQL JDBC"
    - path: "api/src/main/java/com/ureport/UReportApplication.java"
      provides: "Spring Boot entry point with @SpringBootApplication"
    - path: "api/src/main/resources/application.yml"
      provides: "datasource, JWT, mail, and media config properties"
    - path: "api/src/main/java/com/ureport/config/SecurityConfig.java"
      provides: "Spring Security filter chain with JWT + API key filters and @PreAuthorize support"
    - path: "api/src/main/java/com/ureport/security/JwtTokenProvider.java"
      provides: "JWT generate/validate/parse (HS256, configurable key)"
    - path: "api/src/main/java/com/ureport/security/JwtAuthenticationFilter.java"
      provides: "OncePerRequestFilter extracting Bearer token, checking blacklist, setting SecurityContext"
    - path: "api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java"
      provides: "OncePerRequestFilter for /open311/requests api_key validation"
    - path: "api/src/main/java/com/ureport/service/AuthService.java"
      provides: "login(), refresh(), logout() with BCrypt verify and refresh_tokens/token_blacklist writes"
    - path: "api/src/main/java/com/ureport/service/TicketService.java"
      provides: "createTicket(), assignTicket(), updateTicket(), closeTicket(), reopenTicket(), markDuplicate(), addComment()"
    - path: "api/src/main/java/com/ureport/service/TicketHistoryService.java"
      provides: "append() for all lifecycle events"
    - path: "api/src/main/java/com/ureport/util/TemplateVariableResolver.java"
      provides: "resolve(template, context) returning interpolated string"
    - path: "api/src/main/java/com/ureport/entity/Ticket.java"
      provides: "JPA @Entity mapping tickets table — all 25 columns"
    - path: "api/src/main/java/com/ureport/entity/TicketHistory.java"
      provides: "JPA @Entity mapping ticketHistory table"
    - path: "api/src/main/java/com/ureport/repository/TicketRepository.java"
      provides: "JpaRepository<Ticket, Long> with FTS and filter query methods"
  key_links:
    - from: "JwtAuthenticationFilter.java"
      to: "SecurityContextHolder"
      via: "sets UsernamePasswordAuthenticationToken with JwtUserDetails"
      pattern: "SecurityContextHolder.getContext().setAuthentication"
    - from: "TicketService.createTicket()"
      to: "TicketHistoryService.append()"
      via: "calls append with action_id=1 ('open') after ticket INSERT"
      pattern: "ticketHistoryService.append"
    - from: "TicketHistoryController.getHistory()"
      to: "TemplateVariableResolver.resolve()"
      via: "iterates history entries and resolves template per entry"
      pattern: "templateVariableResolver.resolve"
    - from: "AuthService.logout()"
      to: "token_blacklist table"
      via: "TokenBlacklistRepository.save() with jti + expiresAt"
      pattern: "tokenBlacklistRepository.save"

integration_contracts:
  requires:
    - from_plan: "01"
      artifact: "db/init/02-schema.sql"
      exports: ["tickets", "ticketHistory", "people", "actions", "substatus", "categories", "refresh_tokens", "token_blacklist", "clients"]
      verify: |
        grep -n 'CREATE TABLE tickets' db/init/02-schema.sql &&
        grep -n 'CREATE TABLE refresh_tokens' db/init/02-schema.sql &&
        grep -n 'CREATE TABLE token_blacklist' db/init/02-schema.sql &&
        grep -n 'passwordHash' db/init/02-schema.sql &&
        echo CONTRACT_OK
    - from_plan: "01"
      artifact: "db/init/03-seed.sql"
      exports: ["actions rows (id 1-10)", "substatus rows (id 1-4)"]
      verify: |
        grep -n "INSERT INTO actions" db/init/03-seed.sql &&
        grep -n "INSERT INTO substatus" db/init/03-seed.sql &&
        echo CONTRACT_OK
  provides:
    - artifact: "api/pom.xml"
      exports: ["Spring Boot 3.x project", "spring-security", "jjwt-api", "postgresql JDBC", "spring-data-jpa"]
      shape: |
        Maven Spring Boot 3.x project. Key dependencies:
          spring-boot-starter-web, spring-boot-starter-security,
          spring-boot-starter-data-jpa, postgresql, jjwt-api 0.12.x,
          spring-boot-starter-mail, commons-codec
      verify: |
        grep -n 'spring-boot-starter-security' api/pom.xml &&
        grep -n 'jjwt' api/pom.xml &&
        grep -n 'postgresql' api/pom.xml &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/config/SecurityConfig.java"
      exports: ["SecurityFilterChain bean", "PasswordEncoder bean", "AuthenticationManager bean"]
      shape: |
        @Configuration @EnableWebSecurity @EnableMethodSecurity
        SecurityFilterChain: permitAll on /api/v1/auth/**, /open311/**, /callback
        Adds JwtAuthenticationFilter and ApiKeyAuthenticationFilter before UsernamePasswordAuthenticationFilter
      verify: |
        grep -n 'SecurityFilterChain' api/src/main/java/com/ureport/config/SecurityConfig.java &&
        grep -n 'JwtAuthenticationFilter' api/src/main/java/com/ureport/config/SecurityConfig.java &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/security/JwtTokenProvider.java"
      exports: ["generateToken(personId, role)", "validateToken(token)", "getClaims(token)"]
      shape: |
        HS256 signing with configurable secret (app.jwt.secret).
        Claims: sub=personId, role, iat, exp, iss="ureport", jti=UUID.
      verify: |
        grep -n 'generateToken' api/src/main/java/com/ureport/security/JwtTokenProvider.java &&
        grep -n 'validateToken' api/src/main/java/com/ureport/security/JwtTokenProvider.java &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java"
      exports: ["OncePerRequestFilter for /open311/requests api_key param"]
      shape: |
        Intercepts POST /open311/requests. Looks up clients by SHA-256(api_key) in api_key_lookup,
        BCrypt verifies api_key_hash. Sets ApiKeyPrincipal in SecurityContext on match.
      verify: |
        grep -n 'ApiKeyAuthenticationFilter' api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java &&
        grep -n 'api_key_lookup' api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/service/TicketService.java"
      exports: ["createTicket()", "assignTicket()", "updateTicket()", "closeTicket()", "reopenTicket()", "markDuplicate()", "addComment()"]
      shape: |
        All lifecycle methods take a JwtUserDetails principal + request DTO.
        Each method calls ticketHistoryService.append() with the appropriate action_id.
        Uses stable seeded action IDs: 1=open, 2=assignment, 3=closed, 7=duplicate, 8=update, 9=comment.
      verify: |
        grep -n 'createTicket' api/src/main/java/com/ureport/service/TicketService.java &&
        grep -n 'ticketHistoryService' api/src/main/java/com/ureport/service/TicketService.java &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/service/TicketHistoryService.java"
      exports: ["append(ticketId, actionId, enteredByPersonId, actionPersonId, notes, data)"]
      shape: |
        Inserts immutable ticketHistory row. No UPDATE or DELETE methods.
        Called by TicketService for every lifecycle event.
      verify: |
        grep -n 'append' api/src/main/java/com/ureport/service/TicketHistoryService.java &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/util/TemplateVariableResolver.java"
      exports: ["resolve(template, context)"]
      shape: |
        Resolves: {enteredByPerson}, {actionPerson}, {original:field}, {updated:field},
        {duplicate:ticket_id}. Unknown tokens passed through unchanged.
      verify: |
        grep -n 'resolve' api/src/main/java/com/ureport/util/TemplateVariableResolver.java &&
        grep -n 'enteredByPerson' api/src/main/java/com/ureport/util/TemplateVariableResolver.java &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/entity/Ticket.java"
      exports: ["Ticket @Entity class — all 25 columns mapped to tickets table"]
      shape: |
        @Entity @Table(name="tickets"). Fields (exact column names):
        id(Long), parentId(Long), categoryId(Integer), issueTypeId(Integer), clientId(Integer),
        enteredByPersonId(Integer), reportedByPersonId(Integer), assignedPersonId(Integer),
        contactMethodId(Integer), responseMethodId(Integer), enteredDate(OffsetDateTime),
        lastModified(OffsetDateTime), addressId(Integer), latitude(BigDecimal), longitude(BigDecimal),
        location(String), city(String), state(String), zip(String), status(String),
        closedDate(OffsetDateTime), substatusId(Integer), additionalFields(String/JSONB),
        customFields(String/JSONB), description(String), searchVector(String — read-only)
      verify: |
        grep -n '@Entity' api/src/main/java/com/ureport/entity/Ticket.java &&
        grep -n 'enteredByPersonId\|enteredByPerson_id' api/src/main/java/com/ureport/entity/Ticket.java &&
        grep -n 'description' api/src/main/java/com/ureport/entity/Ticket.java &&
        echo CONTRACT_OK
    - artifact: "api/src/main/java/com/ureport/repository/TicketRepository.java"
      exports: ["JpaRepository<Ticket, Long>", "findById(Long)", "save(Ticket)"]
      shape: |
        JpaRepository<Ticket, Long>. Wave 2b (TicketSearchService) will add @Query FTS methods.
        This wave provides: findById, save, existsById, deleteById.
      verify: |
        grep -n 'JpaRepository' api/src/main/java/com/ureport/repository/TicketRepository.java &&
        echo CONTRACT_OK
---

<objective>
Scaffold the Spring Boot 3.x backend project and implement the P0 authentication and ticket
core — the structural backbone that all other backend waves (2b, 2c, 2d) depend on.

This wave has two inseparable concerns:
1. **Project scaffold** — Maven pom.xml, UReportApplication, application.yml, Dockerfile, and
   core config classes (SecurityConfig, JwtConfig, WebMvcConfig) that every other backend class
   compiles against.
2. **Auth + RBAC + Ticket + History** — the four P0 features that gate all protected API access
   and form the structural backbone of every ticket operation in every downstream wave.

Purpose: Without this wave, waves 2b/2c/2d cannot compile (no entities, no security context, no
TicketService/HistoryService to depend on). It must be completed before any other backend wave.

Output:
- api/ directory: complete Maven Spring Boot 3.x project skeleton
- SecurityConfig, JwtConfig, WebMvcConfig — Spring configuration classes
- JwtAuthenticationFilter, ApiKeyAuthenticationFilter, JwtTokenProvider, JwtUserDetails,
  ApiKeyPrincipal, PermissionEvaluator — complete security layer
- AuthController, CallbackController — F4 auth endpoints
- TicketController, TicketHistoryController — F0, F1 REST controllers
- AuthService, TicketService, TicketHistoryService — service layer
- TemplateVariableResolver — F1 template rendering utility
- All entity classes: Ticket, TicketHistory, Person, Category, Substatus, Action, RefreshToken,
  TokenBlacklist
- All repository interfaces: TicketRepository, TicketHistoryRepository, PersonRepository,
  RefreshTokenRepository, TokenBlacklistRepository, ActionRepository, SubstatusRepository,
  CategoryRepository
- All DTOs: request and response shapes for auth and ticket operations
- GlobalExceptionHandler and exception classes
- Unit tests: TicketServiceTest, AuthServiceTest, TicketHistoryServiceTest
</objective>

<feature_dependencies>
Implements: F4: Authentication (JWT Spring Security — login, refresh, logout, OAuth callback,
  API key filter); F3: RBAC (SecurityConfig, PermissionEvaluator, role-gated endpoint guards,
  per-category permission checks); F0: Ticket lifecycle (create/assign/update/close/reopen/
  duplicate/comment with validation, substatus enforcement, circular duplicate prevention);
  F1: Ticket history (append-only log, TemplateVariableResolver resolving {enteredByPerson},
  {actionPerson}, {original:field}, {updated:field}, {duplicate:ticket_id})
Depends on: Wave 1 (db/init/02-schema.sql for all tables; db/init/03-seed.sql for stable
  action IDs 1-10 and substatus IDs 1-4 that TicketService references by integer constant)
Enables: F2 (Open311 needs AuthFilter, ApiKeyFilter, TicketService.createTicket from this wave),
  F5 (PeopleController needs SecurityConfig + Person entity), F6-F9 (all reference SecurityConfig
  and entity base from this wave), F10 (MediaController calls TicketHistoryService.append),
  F11 (TicketSearchService extends TicketRepository), F12-F20 (all backend waves depend on
  SecurityConfig, entity package, and repository pattern established here)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/implement-the-full-ureport-modernization/WAVE-SCHEDULE.md
@.planning/express/implement-the-full-ureport-modernization/01-PLAN.md
@project_specs/TechArch-uReport.md   (Section 01: package structure; Section 02: DDL; Section 03: TS interfaces)
@project_specs/FRD-uReport.md        (F03 RBAC permission matrix; F04 auth flows; F00 ticket lifecycle processes; F01 history processes)
@project_specs/PRD-uReport.md        (F0-F4 capabilities)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Spring Boot project scaffold + security layer (F3, F4)</name>
  <files>
    api/pom.xml
    api/Dockerfile
    api/src/main/java/com/ureport/UReportApplication.java
    api/src/main/resources/application.yml
    api/src/main/java/com/ureport/config/SecurityConfig.java
    api/src/main/java/com/ureport/config/JwtConfig.java
    api/src/main/java/com/ureport/config/WebMvcConfig.java
    api/src/main/java/com/ureport/security/JwtTokenProvider.java
    api/src/main/java/com/ureport/security/JwtUserDetails.java
    api/src/main/java/com/ureport/security/JwtAuthenticationFilter.java
    api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java
    api/src/main/java/com/ureport/security/ApiKeyPrincipal.java
    api/src/main/java/com/ureport/security/PermissionEvaluator.java
    api/src/main/java/com/ureport/controller/AuthController.java
    api/src/main/java/com/ureport/controller/CallbackController.java
    api/src/main/java/com/ureport/service/AuthService.java
    api/src/main/java/com/ureport/entity/Person.java
    api/src/main/java/com/ureport/entity/RefreshToken.java
    api/src/main/java/com/ureport/entity/TokenBlacklist.java
    api/src/main/java/com/ureport/repository/PersonRepository.java
    api/src/main/java/com/ureport/repository/RefreshTokenRepository.java
    api/src/main/java/com/ureport/repository/TokenBlacklistRepository.java
    api/src/main/java/com/ureport/dto/request/LoginRequest.java
    api/src/main/java/com/ureport/dto/response/AuthResponse.java
    api/src/main/java/com/ureport/exception/GlobalExceptionHandler.java
    api/src/main/java/com/ureport/exception/NotFoundException.java
    api/src/main/java/com/ureport/exception/PermissionDeniedException.java
    api/src/main/java/com/ureport/exception/ValidationException.java
    api/src/main/java/com/ureport/exception/InvalidTransitionException.java
    api/src/test/java/com/ureport/service/AuthServiceTest.java
  </files>
  <action>
Create the `api/` directory at the repository root. Build the complete Spring Boot 3.x project
skeleton and implement the full F3/F4 security layer. Every file listed below must be created
exactly as specified — downstream waves 2b/2c/2d compile against this skeleton.

---

### api/pom.xml

Maven project with groupId=com.ureport, artifactId=ureport-api, version=1.0.0-SNAPSHOT, Java 21.

Parent: spring-boot-starter-parent 3.2.x (latest 3.2 stable).

Dependencies (exact):
- spring-boot-starter-web
- spring-boot-starter-security
- spring-boot-starter-data-jpa
- spring-boot-starter-mail
- spring-boot-starter-validation
- org.postgresql:postgresql (runtime)
- io.jsonwebtoken:jjwt-api:0.12.5
- io.jsonwebtoken:jjwt-impl:0.12.5 (runtime)
- io.jsonwebtoken:jjwt-jackson:0.12.5 (runtime)
- commons-codec:commons-codec:1.17.0 (for SHA-256 api_key_lookup hash — NOT for bcrypt)
- spring-boot-starter-test (test scope)
- spring-security-test (test scope)

Build plugin: spring-boot-maven-plugin.

---

### api/Dockerfile

Multi-stage Docker build:
```dockerfile
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### api/src/main/java/com/ureport/UReportApplication.java

```java
package com.ureport;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UReportApplication {
    public static void main(String[] args) {
        SpringApplication.run(UReportApplication.class, args);
    }
}
```

---

### api/src/main/resources/application.yml

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/ureport}
    username: ${SPRING_DATASOURCE_USERNAME:ureport}
    password: ${SPRING_DATASOURCE_PASSWORD:ureport}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          time_zone: UTC
  mail:
    host: ${SPRING_MAIL_HOST:localhost}
    port: ${SPRING_MAIL_PORT:1025}
    default-encoding: UTF-8

app:
  jwt:
    secret: ${APP_JWT_SECRET:changeme-at-least-32-chars-long-for-hs256}
    expiry: ${APP_JWT_EXPIRY:3600}
    refresh-expiry: ${APP_JWT_REFRESH_EXPIRY:86400}
    issuer: ureport
    algorithm: HS256
  media:
    path: ${APP_MEDIA_PATH:/app/media}
    max-size: 10485760

server:
  port: 8080
```

NOTE: `ddl-auto: validate` means Spring Boot validates JPA entities against the existing
schema (created by db/init/02-schema.sql). This catches column name mismatches at startup.
Never use `create`, `create-drop`, or `update` — the schema is managed by Wave 1 SQL files.

---

### api/src/main/java/com/ureport/config/JwtConfig.java

```java
package com.ureport.config;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtConfig {
    @Value("${app.jwt.secret}") private String secret;
    @Value("${app.jwt.expiry}") private long expiry;
    @Value("${app.jwt.refresh-expiry}") private long refreshExpiry;
    @Value("${app.jwt.issuer}") private String issuer;

    @Bean public SecretKey jwtSecretKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    public long getExpiry() { return expiry; }
    public long getRefreshExpiry() { return refreshExpiry; }
    public String getIssuer() { return issuer; }
}
```

---

### api/src/main/java/com/ureport/security/JwtUserDetails.java

Implements `UserDetails`. Fields: `Long personId`, `String role`. Username = personId as string.
Authorities: single `GrantedAuthority` with value `"ROLE_" + role.toUpperCase()`.
`isAccountNonExpired()`, `isAccountNonLocked()`, `isCredentialsNonExpired()`, `isEnabled()` all return `true`.

---

### api/src/main/java/com/ureport/security/JwtTokenProvider.java

Uses jjwt 0.12.x API (NOT deprecated 0.9.x). Key methods:

```java
// Generate access token
public String generateToken(Long personId, String role) {
    return Jwts.builder()
        .subject(String.valueOf(personId))
        .claim("role", role)
        .issuer(jwtConfig.getIssuer())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + jwtConfig.getExpiry() * 1000))
        .id(UUID.randomUUID().toString())  // jti
        .signWith(secretKey)
        .compact();
}

// Validate token — returns true if valid, false otherwise
public boolean validateToken(String token) { ... }

// Extract claims
public Claims getClaims(String token) { ... }

// Extract personId (sub claim)
public Long getPersonId(String token) { ... }

// Extract role claim
public String getRole(String token) { ... }

// Extract jti claim
public String getJti(String token) { ... }
```

---

### api/src/main/java/com/ureport/security/JwtAuthenticationFilter.java

`OncePerRequestFilter`. In `doFilterInternal`:
1. Extract `Authorization: Bearer <token>` header. If absent, proceed to next filter.
2. Call `jwtTokenProvider.validateToken(token)`. If invalid, return 401 JSON `{"error":"TOKEN_INVALID","message":"Invalid token"}`.
3. Check `tokenBlacklistRepository.existsById(jti)`. If blacklisted, return 401 JSON `{"error":"TOKEN_REVOKED","message":"Token has been revoked"}`.
4. Build `JwtUserDetails` from personId + role claims.
5. Set `SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(jwtUserDetails, null, jwtUserDetails.getAuthorities()))`.
6. Proceed to next filter.

---

### api/src/main/java/com/ureport/security/ApiKeyAuthenticationFilter.java

`OncePerRequestFilter`. Only intercepts requests to `/open311/requests` (check `request.getRequestURI()`).
In `doFilterInternal`:
1. Extract `api_key` from query parameter or form field.
2. Compute SHA-256 hex of api_key: `DigestUtils.sha256Hex(apiKey)` (commons-codec).
3. Look up `clientRepository.findByApiKeyLookup(sha256hex)`. If not found, return 403 JSON `{"error":"API_KEY_INVALID","message":"Invalid or missing api_key"}`.
4. BCrypt-verify `api_key` against `client.getApiKeyHash()`. If mismatch, return 403.
5. Set `SecurityContextHolder.getContext().setAuthentication(new ApiKeyPrincipal(client.getId()))`.
6. Proceed to next filter.

NOTE: ClientRepository is from Wave 2d. For this wave, inject `ClientRepository` as a Spring bean
but Wire it lazily (`@Lazy`) so the application compiles even if ClientRepository doesn't yet exist
in the same wave. Alternatively, declare a `ClientRepository` stub interface in `repository/`
package here — it will be fleshed out in Wave 2d. Create a minimal `Client.java` entity and
`ClientRepository.java` here (just the interface header + `findByApiKeyLookup` method) so
`ApiKeyAuthenticationFilter` compiles. Wave 2d will complete the `ClientService`.

---

### api/src/main/java/com/ureport/security/ApiKeyPrincipal.java

```java
package com.ureport.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import java.util.Collection;
import java.util.List;

public class ApiKeyPrincipal implements Authentication {
    private final Integer clientId;
    private boolean authenticated = true;

    public ApiKeyPrincipal(Integer clientId) { this.clientId = clientId; }
    public Integer getClientId() { return clientId; }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(); }
    @Override public Object getCredentials() { return null; }
    @Override public Object getDetails() { return null; }
    @Override public Object getPrincipal() { return this; }
    @Override public boolean isAuthenticated() { return authenticated; }
    @Override public void setAuthenticated(boolean isAuthenticated) { this.authenticated = isAuthenticated; }
    @Override public String getName() { return "api-key-client-" + clientId; }
}
```

---

### api/src/main/java/com/ureport/security/PermissionEvaluator.java

Implements the F03 `isAllowed(resource, action)` permission hierarchy check.

```java
package com.ureport.security;

import org.springframework.stereotype.Component;

@Component
public class PermissionEvaluator {
    // Role hierarchy: anonymous(0) < public(1) < staff(2)
    private int rankOf(String role) {
        return switch (role == null ? "anonymous" : role.toLowerCase()) {
            case "staff" -> 2;
            case "public" -> 1;
            default -> 0;
        };
    }

    /**
     * Returns true if the caller's role satisfies the required permission level.
     * Used for per-category displayPermissionLevel and postingPermissionLevel checks.
     */
    public boolean isAllowed(String callerRole, String requiredLevel) {
        return rankOf(callerRole) >= rankOf(requiredLevel);
    }

    /** Returns true if caller is staff. */
    public boolean isStaff(String callerRole) { return "staff".equalsIgnoreCase(callerRole); }
}
```

---

### api/src/main/java/com/ureport/config/SecurityConfig.java

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthenticationFilter jwtFilter,
                                           ApiKeyAuthenticationFilter apiKeyFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/open311/**", "/callback").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(apiKeyFilter, JwtAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"Authentication required\"}");
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setStatus(403);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"error\":\"PERMISSION_DENIED\",\"message\":\"Insufficient permissions\"}");
                })
            );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(10); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

---

### api/src/main/java/com/ureport/config/WebMvcConfig.java

Implements `WebMvcConfigurer`. Configure CORS to allow all origins (configurable) and
content negotiation so `?format=` query param takes precedence over Accept header.
Register `application/xml` as a supported media type for format=xml.
This is a placeholder for Wave 2b to extend — do not wire Open311XmlSerializer here.

---

### api/src/main/java/com/ureport/entity/Person.java

JPA `@Entity @Table(name="people")`. Map ALL columns from TechArch `people` table exactly:

| Field name (Java) | Column name (DB) | Type |
|---|---|---|
| id | id | Integer |
| firstname | firstname | String |
| middlename | middlename | String |
| lastname | lastname | String |
| organization | organization | String |
| address | address | String |
| city | city | String |
| state | state | String |
| zip | zip | String |
| departmentId | department_id | Integer |
| username | username | String |
| passwordHash | passwordHash | String |
| role | role | String |
| deletedAt | deletedAt | OffsetDateTime |

Use `@Column(name="passwordHash")` for camelCase columns that match DB column names.
Use `@Column(name="department_id")` for snake_case columns.

---

### api/src/main/java/com/ureport/entity/RefreshToken.java

JPA `@Entity @Table(name="refresh_tokens")`. Map columns: id (UUID), personId (Integer),
createdAt (OffsetDateTime), expiresAt (OffsetDateTime), revoked (Boolean).

---

### api/src/main/java/com/ureport/entity/TokenBlacklist.java

JPA `@Entity @Table(name="token_blacklist")`. Map columns: jti (String @Id), expiresAt (OffsetDateTime).

---

### api/src/main/java/com/ureport/repository/PersonRepository.java

`JpaRepository<Person, Integer>`. Add: `Optional<Person> findByUsername(String username)`.

---

### api/src/main/java/com/ureport/repository/RefreshTokenRepository.java

`JpaRepository<RefreshToken, UUID>`. Add:
- `Optional<RefreshToken> findByIdAndRevokedFalse(UUID id)`
- `void revokeById(UUID id)` (or use save to set revoked=true)

---

### api/src/main/java/com/ureport/repository/TokenBlacklistRepository.java

`JpaRepository<TokenBlacklist, String>`. `existsById(String jti)` is inherited.
Add: `void deleteByExpiresAtBefore(OffsetDateTime now)` for cleanup.

---

### api/src/main/java/com/ureport/dto/request/LoginRequest.java

Record or class with `String username` and `String password`. Add `@NotBlank` validation.

---

### api/src/main/java/com/ureport/dto/response/AuthResponse.java

```java
public record AuthResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    String role,
    Integer personId
) {}
```

---

### api/src/main/java/com/ureport/service/AuthService.java

Implements F04 auth flows:

**login(username, password):**
1. `personRepository.findByUsername(username)` — throw 401 `AUTH_FAILED` if not found.
2. `passwordEncoder.matches(password, person.getPasswordHash())` — throw 401 if mismatch.
3. `jwtTokenProvider.generateToken(person.getId(), person.getRole())` — access token.
4. Create `RefreshToken` entity: `id=UUID.randomUUID()`, `personId=person.getId()`,
   `expiresAt=now+refreshExpiry`, `revoked=false`. Save via `refreshTokenRepository`.
5. Return `AuthResponse(accessToken, refreshToken.getId().toString(), expiry, role, personId)`.

**refresh(refreshTokenId):**
1. `refreshTokenRepository.findByIdAndRevokedFalse(UUID)` — throw 401 `REFRESH_TOKEN_INVALID` if not found or expired (`expiresAt.isBefore(now)`).
2. Mark old token revoked: set `revoked=true`, save.
3. Generate new access token and new refresh token. Return `AuthResponse`.

**logout(refreshTokenId, accessTokenJti):**
1. Find refresh token, mark revoked.
2. Insert `TokenBlacklist` row: `jti=accessTokenJti`, `expiresAt=accessTokenExpiry`. Save via `tokenBlacklistRepository`.
3. Return void (controller returns 200 OK).

---

### api/src/main/java/com/ureport/controller/AuthController.java

`@RestController @RequestMapping("/api/v1/auth")`. Three endpoints matching FRD F04:

```
POST /api/v1/auth/login    → authService.login(request.username, request.password)
POST /api/v1/auth/refresh  → authService.refresh(request.refreshToken)
POST /api/v1/auth/logout   → authService.logout(request.refreshToken, jtiFromSecurityContext)
```

Logout extracts the JWT's jti from `SecurityContextHolder` (the access token jti is available
via `JwtUserDetails` or by re-parsing the `Authorization` header). Return 200 OK empty body.

---

### api/src/main/java/com/ureport/controller/CallbackController.java

`@RestController`. `GET /callback` endpoint per FRD F04.5 OAuth Callback process.
For now implement the CSRF state validation and person lookup. External IdP exchange can be
a stub returning 501 if `APP_OAUTH_CLIENT_ID` is not configured — the endpoint must exist
and compile. The CSRF state check must be implemented (compare `state` param against a
session/cookie value or a stateless HMAC-signed state token).

---

### api/src/main/java/com/ureport/exception/GlobalExceptionHandler.java

`@RestControllerAdvice`. Map exceptions to error JSON `{"error":"CODE","message":"..."}`:
- `NotFoundException` → 404
- `PermissionDeniedException` → 403
- `ValidationException` → 422
- `InvalidTransitionException` → 422
- `MethodArgumentNotValidException` → 422 (Bean Validation)
- `AccessDeniedException` (Spring Security) → 403

---

### Exception classes

`NotFoundException(String errorCode, String message)`,
`PermissionDeniedException(String errorCode, String message)`,
`ValidationException(String errorCode, String message)`,
`InvalidTransitionException(String errorCode, String message)`.

All extend `RuntimeException`. Store `errorCode` as a field for `GlobalExceptionHandler` to use.

---

### api/src/test/java/com/ureport/service/AuthServiceTest.java

JUnit 5 + Mockito unit tests for `AuthService`:
- `testLogin_validCredentials_returnsAuthResponse()`
- `testLogin_invalidPassword_throws401()`
- `testLogin_unknownUsername_throws401()`
- `testRefresh_validToken_rotatesAndReturnsNewPair()`
- `testRefresh_expiredToken_throws401()`
- `testRefresh_revokedToken_throws401()`
- `testLogout_blacklistsJti()`

Mock `PersonRepository`, `RefreshTokenRepository`, `TokenBlacklistRepository`,
`JwtTokenProvider`, `PasswordEncoder`.

  </action>
  <verify>
mvn -f api/pom.xml compile -q 2>&1 | tail -5 && echo COMPILE_OK
grep -n 'SecurityFilterChain' api/src/main/java/com/ureport/config/SecurityConfig.java && echo SECURITY_CONFIG_OK
grep -n 'generateToken' api/src/main/java/com/ureport/security/JwtTokenProvider.java && echo JWT_PROVIDER_OK
grep -n 'login' api/src/main/java/com/ureport/service/AuthService.java && echo AUTH_SERVICE_OK
grep -n '@Entity' api/src/main/java/com/ureport/entity/Person.java && echo PERSON_ENTITY_OK
  </verify>
  <done>
- api/pom.xml: Spring Boot 3.2.x parent, Java 21, all required dependencies including jjwt 0.12.5
- api/Dockerfile: multi-stage Maven + JRE build
- UReportApplication.java with @SpringBootApplication @EnableScheduling
- application.yml with datasource (ddl-auto: validate), JWT, mail, media config
- SecurityConfig: stateless, JWT+ApiKey filter chain, permitAll on auth/open311/callback, BCryptPasswordEncoder bean
- JwtConfig, WebMvcConfig config classes
- Complete security package: JwtTokenProvider (jjwt 0.12.x), JwtUserDetails, JwtAuthenticationFilter (blacklist check), ApiKeyAuthenticationFilter (SHA-256 lookup), ApiKeyPrincipal, PermissionEvaluator
- Person, RefreshToken, TokenBlacklist entities with exact column name mappings from TechArch DDL
- PersonRepository, RefreshTokenRepository, TokenBlacklistRepository
- LoginRequest DTO, AuthResponse DTO
- AuthService with login/refresh/logout implementing FRD F04 flows
- AuthController, CallbackController
- GlobalExceptionHandler + 4 exception classes
- AuthServiceTest with 7 test cases covering all error states
- mvn compile succeeds with 0 errors
  </done>
</task>

<feature_dependencies>
Implements: F4 (JWT auth flows: login/refresh/logout/OAuth callback/API key filter),
  F3 (SecurityConfig filter chain, PermissionEvaluator isAllowed(), role-gated endpoints,
  RBAC permission hierarchy anonymous/public/staff)
Depends on: Wave 1 (people table with username/passwordHash columns, refresh_tokens, token_blacklist)
Enables: All downstream waves — every controller in waves 2b/2c/2d needs SecurityConfig,
  JwtUserDetails, and the entity + repository pattern established here
</feature_dependencies>

<task type="auto">
  <name>Task 2: Ticket lifecycle CRUD + History service + Template resolver (F0, F1)</name>
  <files>
    api/src/main/java/com/ureport/entity/Ticket.java
    api/src/main/java/com/ureport/entity/TicketHistory.java
    api/src/main/java/com/ureport/entity/Category.java
    api/src/main/java/com/ureport/entity/Substatus.java
    api/src/main/java/com/ureport/entity/Action.java
    api/src/main/java/com/ureport/repository/TicketRepository.java
    api/src/main/java/com/ureport/repository/TicketHistoryRepository.java
    api/src/main/java/com/ureport/repository/ActionRepository.java
    api/src/main/java/com/ureport/repository/SubstatusRepository.java
    api/src/main/java/com/ureport/repository/CategoryRepository.java
    api/src/main/java/com/ureport/service/TicketService.java
    api/src/main/java/com/ureport/service/TicketHistoryService.java
    api/src/main/java/com/ureport/util/TemplateVariableResolver.java
    api/src/main/java/com/ureport/controller/TicketController.java
    api/src/main/java/com/ureport/controller/TicketHistoryController.java
    api/src/main/java/com/ureport/dto/request/CreateTicketRequest.java
    api/src/main/java/com/ureport/dto/request/UpdateTicketRequest.java
    api/src/main/java/com/ureport/dto/request/CloseTicketRequest.java
    api/src/main/java/com/ureport/dto/response/TicketResponse.java
    api/src/main/java/com/ureport/dto/response/HistoryEntryResponse.java
    api/src/test/java/com/ureport/service/TicketServiceTest.java
    api/src/test/java/com/ureport/service/TicketHistoryServiceTest.java
  </files>
  <action>
Implement F0 (ticket lifecycle) and F1 (history + template resolver). All validation rules,
error states, and process flows are from FRD sections F00 and F01.

---

### api/src/main/java/com/ureport/entity/Ticket.java

JPA `@Entity @Table(name="tickets")`. Map ALL 25 columns from TechArch DDL. Use exact Java field
names that match Java naming conventions but map to exact DB column names via `@Column(name=...)`:

| Java field | DB column | Java type |
|---|---|---|
| id | id | Long |
| parentId | parent_id | Long |
| categoryId | category_id | Integer (NOT NULL) |
| issueTypeId | issueType_id | Integer |
| clientId | client_id | Integer |
| enteredByPersonId | enteredByPerson_id | Integer |
| reportedByPersonId | reportedByPerson_id | Integer |
| assignedPersonId | assignedPerson_id | Integer |
| contactMethodId | contactMethod_id | Integer |
| responseMethodId | responseMethod_id | Integer |
| enteredDate | enteredDate | OffsetDateTime |
| lastModified | lastModified | OffsetDateTime |
| addressId | addressId | Integer |
| latitude | latitude | BigDecimal |
| longitude | longitude | BigDecimal |
| location | location | String |
| city | city | String |
| state | state | String |
| zip | zip | String |
| status | status | String |
| closedDate | closedDate | OffsetDateTime |
| substatusId | substatus_id | Integer |
| additionalFields | additionalFields | String (JSONB stored as text) |
| customFields | customFields | String (JSONB stored as text) |
| description | description | String (NOT NULL) |
| searchVector | search_vector | String (@Column(insertable=false, updatable=false)) |

CRITICAL: `searchVector` must be `insertable=false, updatable=false` — it is maintained by the
DB trigger `trig_tickets_fts`, never by JPA. Attempting to write it would cause constraint errors.

`@PrePersist` sets `enteredDate = OffsetDateTime.now()` and `lastModified = OffsetDateTime.now()`
if null. `@PreUpdate` updates `lastModified = OffsetDateTime.now()`.

---

### api/src/main/java/com/ureport/entity/TicketHistory.java

JPA `@Entity @Table(name="ticketHistory")`. Map all columns:

| Java field | DB column | Java type |
|---|---|---|
| id | id | Long |
| ticketId | ticket_id | Long (NOT NULL) |
| enteredByPersonId | enteredByPerson_id | Integer |
| actionPersonId | actionPerson_id | Integer |
| actionId | action_id | Integer (NOT NULL) |
| enteredDate | enteredDate | OffsetDateTime |
| actionDate | actionDate | OffsetDateTime |
| notes | notes | String |
| data | data | String (JSONB as text) |
| sentNotifications | sentNotifications | String |

NO `@PreUpdate`, NO delete operations — history is immutable (FRD F01 rule).
`@PrePersist` sets `enteredDate = OffsetDateTime.now()` and `actionDate = OffsetDateTime.now()` if null.

---

### api/src/main/java/com/ureport/entity/Category.java

JPA `@Entity @Table(name="categories")`. Map key columns needed by TicketService:
id, name, departmentId, defaultPersonId, categoryGroupId, active, displayPermissionLevel,
postingPermissionLevel, customFields, slaDays, notificationReplyEmail, autoCloseIsActive,
autoCloseSubstatusId. Full column list from TechArch DDL.

---

### api/src/main/java/com/ureport/entity/Substatus.java

JPA `@Entity @Table(name="substatus")`. Map: id, name, description, status, isDefault, isSystem.

---

### api/src/main/java/com/ureport/entity/Action.java

JPA `@Entity @Table(name="actions")`. Map: id, name, description, type, template, replyEmail.

---

### api/src/main/java/com/ureport/repository/TicketRepository.java

```java
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    // Wave 2b (TicketSearchService) will add @Query FTS and filter methods.
    // This wave provides basic CRUD + existence check.
    // Add only what TicketService needs:
    boolean existsByParentId(Long parentId);  // for circular duplicate check
}
```

---

### api/src/main/java/com/ureport/repository/TicketHistoryRepository.java

```java
public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketIdOrderByEnteredDateAsc(Long ticketId);
    Optional<TicketHistory> findByIdAndTicketId(Long id, Long ticketId);
}
```

---

### api/src/main/java/com/ureport/repository/ActionRepository.java

`JpaRepository<Action, Integer>`. Add: `Optional<Action> findByName(String name)`.

---

### api/src/main/java/com/ureport/repository/SubstatusRepository.java

```java
public interface SubstatusRepository extends JpaRepository<Substatus, Integer> {
    Optional<Substatus> findFirstByStatusAndIsDefaultTrue(String status);
    List<Substatus> findByStatus(String status);
}
```

---

### api/src/main/java/com/ureport/repository/CategoryRepository.java

`JpaRepository<Category, Integer>`. Add: `List<Category> findByActiveTrue()`.

---

### api/src/main/java/com/ureport/util/TemplateVariableResolver.java

Resolves FRD F01 template variable tokens. Input: template string + context map.

```java
@Component
public class TemplateVariableResolver {
    /**
     * Resolves template variables in the given template string using the provided context.
     *
     * Supported tokens (per FRD F01):
     *   {enteredByPerson}     → context.get("enteredByPersonName") (full name String)
     *   {actionPerson}        → context.get("actionPersonName")
     *   {reportedByPerson_id} → context.get("reportedByPersonName")
     *   {original:field}      → context.get("original.field") from data JSON
     *   {updated:field}       → context.get("updated.field") from data JSON
     *   {duplicate:ticket_id} → context.get("duplicate.ticket_id") from data JSON
     *
     * Unknown tokens are left as-is (per FRD F01 rule: "Unknown variable tokens are left as-is").
     */
    public String resolve(String template, Map<String, Object> context) {
        if (template == null) return "";
        String result = template;
        // Replace simple tokens: {enteredByPerson}, {actionPerson}, {reportedByPerson_id}
        result = replaceSimpleToken(result, "enteredByPerson", context);
        result = replaceSimpleToken(result, "actionPerson", context);
        result = replaceSimpleToken(result, "reportedByPerson_id", context);
        // Replace data tokens: {original:field}, {updated:field}, {duplicate:ticket_id}
        result = replaceDataToken(result, "original", context);
        result = replaceDataToken(result, "updated", context);
        result = replaceDuplicateToken(result, context);
        return result;
    }
    // private helper methods for pattern matching and replacement
}
```

Build the context map in `TicketHistoryService.getRenderedHistory()` by loading person names
from `PersonRepository` and parsing `data` JSON field.

---

### api/src/main/java/com/ureport/service/TicketHistoryService.java

```java
@Service
@Transactional
public class TicketHistoryService {

    /**
     * Appends an immutable history entry.
     * Called by TicketService on every lifecycle event.
     *
     * @param ticketId           required
     * @param actionId           required (use seeded IDs: 1=open, 2=assignment, 3=closed,
     *                           4=changeCategory, 5=changeLocation, 7=duplicate, 8=update, 9=comment)
     * @param enteredByPersonId  nullable (null for system/API-submitted entries)
     * @param actionPersonId     nullable (person acted upon, e.g. assignee)
     * @param notes              nullable free text
     * @param data               nullable JSON string (e.g. {"original":{"category_id":5},"updated":{"category_id":12}})
     */
    public TicketHistory append(Long ticketId, Integer actionId, Integer enteredByPersonId,
                                 Integer actionPersonId, String notes, String data) { ... }

    /**
     * Returns history entries for a ticket with renderedDescription populated.
     * Ordered by enteredDate ASC per FRD F01.
     */
    public List<HistoryEntryResponse> getHistory(Long ticketId) { ... }
}
```

`getHistory()` calls `ticketHistoryRepository.findByTicketIdOrderByEnteredDateAsc()`,
then for each entry: loads person names from `PersonRepository`, builds context map,
calls `templateVariableResolver.resolve(action.getTemplate(), context)`.

---

### api/src/main/java/com/ureport/service/TicketService.java

Implements all FRD F00 lifecycle operations. Key implementation details:

**System action IDs (from seeded data — MUST match 03-seed.sql):**
```java
private static final int ACTION_OPEN            = 1;
private static final int ACTION_ASSIGNMENT      = 2;
private static final int ACTION_CLOSED          = 3;
private static final int ACTION_CHANGE_CATEGORY = 4;
private static final int ACTION_CHANGE_LOCATION = 5;
private static final int ACTION_DUPLICATE       = 7;
private static final int ACTION_UPDATE          = 8;
private static final int ACTION_COMMENT         = 9;
```

**createTicket(CreateTicketRequest req, Integer enteredByPersonId):**
1. Load category; validate `active=true`; throw 404 `CATEGORY_NOT_FOUND` if not found/inactive.
2. Check posting permission: `permissionEvaluator.isAllowed(callerRole, category.getPostingPermissionLevel())`.
   Throw 403 `PERMISSION_DENIED` if fails.
3. Validate `description` not blank; throw 422 `DESCRIPTION_REQUIRED`.
4. Validate lat/long range if provided: lat ∈ [-90,90], long ∈ [-180,180]; throw 422 `INVALID_COORDINATES`.
5. Create `people` record for reporter if `reporterEmail` provided and no match by email
   (query `peopleEmailRepository.findByEmail()` — inject `PeopleEmailRepository` as optional/stub;
   if email match exists, use that person; otherwise create minimal Person with firstname/lastname/role=public).
   NOTE: `PeopleEmailRepository` is from Wave 2c (people management). Declare a minimal interface
   stub here so this compiles. Wave 2c completes it.
6. Look up default open substatus: `substatusRepository.findFirstByStatusAndIsDefaultTrue("open")`.
7. Build `Ticket` entity; set `status="open"`, `enteredDate=now()`, `lastModified=now()`,
   `substatusId=defaultOpenSubstatus.getId()`.
8. If category has `defaultPersonId` set and `ticket.assignedPersonId` is null, assign it.
9. Save ticket via `ticketRepository.save()`.
10. Call `ticketHistoryService.append(ticket.getId(), ACTION_OPEN, enteredByPersonId, null, null, null)`.
11. Return ticket.

**assignTicket(Long ticketId, Integer assignedPersonId, Integer staffPersonId):**
1. Load ticket; throw 404 `TICKET_NOT_FOUND`.
2. Load assignee person; throw 422 `INVALID_ASSIGNEE` if role ≠ "staff".
3. Update `assignedPersonId`, `lastModified`.
4. Call `append(ticketId, ACTION_ASSIGNMENT, staffPersonId, assignedPersonId, null, null)`.

**updateTicket(Long ticketId, UpdateTicketRequest req, Integer staffPersonId):**
1. Load ticket; validate staff role (caller must be staff — enforced by @PreAuthorize in controller).
2. Track changes for history data JSON.
3. If `category_id` changes: build data JSON `{"original":{"category_id":old},"updated":{"category_id":new}}`;
   call `append(..., ACTION_CHANGE_CATEGORY, staffPersonId, null, null, dataJson)`.
4. If location fields change: build data JSON; call `append(..., ACTION_CHANGE_LOCATION, ...)`.
5. Apply other field updates. Call `append(..., ACTION_UPDATE, staffPersonId, null, null, dataJson)`.

**closeTicket(Long ticketId, CloseTicketRequest req, Integer staffPersonId):**
1. Load ticket; throw 422 `INVALID_TRANSITION` if already closed.
2. Load substatus; throw 422 `INVALID_SUBSTATUS` if `substatus.status ≠ "closed"`.
3. Set `status="closed"`, `closedDate=now()`, `substatusId`.
4. Call `append(..., ACTION_CLOSED, staffPersonId, null, null, null)`.

**markDuplicate(Long ticketId, Long parentId, Integer staffPersonId):**
1. Load ticket and parent; throw 422 `CIRCULAR_DUPLICATE` if parentId == ticketId or if following parent chain leads back to ticketId (check parent.parentId is not ticketId).
2. Load "Duplicate" substatus (id=3 from seed).
3. Set `parentId=parentId`, `status="closed"`, `closedDate=now()`, `substatusId=3`.
4. Call `append(..., ACTION_DUPLICATE, staffPersonId, null, null, "{\"duplicate\":{\"ticket_id\":" + parentId + "}}")`.

**reopenTicket(Long ticketId, String reason, Integer staffPersonId):**
1. Load ticket; throw 422 `INVALID_TRANSITION` if already open.
2. Load default open substatus.
3. Set `status="open"`, `closedDate=null`, `substatusId=defaultOpen.getId()`.
4. String notes = reason != null && !reason.isBlank() ? reason : "Reopened".
5. Call `append(..., ACTION_UPDATE, staffPersonId, null, notes, null)`.

**addComment(Long ticketId, String notes, Integer personId):**
1. Load ticket; throw 404 if not found.
2. Validate notes not blank.
3. Call `append(..., ACTION_COMMENT, personId, null, notes, null)`.

---

### api/src/main/java/com/ureport/controller/TicketController.java

`@RestController @RequestMapping("/api/v1/tickets")`.

All staff-mutating endpoints use `@PreAuthorize("hasRole('STAFF')")`.
Extract `JwtUserDetails` principal from `SecurityContextHolder` to get `personId`.

Endpoints per FRD F00 API surface:
```
POST   /api/v1/tickets                     → createTicket (staff/public/anonymous per category)
GET    /api/v1/tickets/{id}               → getTicket (role-based)
PATCH  /api/v1/tickets/{id}               @PreAuthorize(staff) → updateTicket
PATCH  /api/v1/tickets/{id}/assign        @PreAuthorize(staff) → assignTicket
PATCH  /api/v1/tickets/{id}/close         @PreAuthorize(staff) → closeTicket
PATCH  /api/v1/tickets/{id}/reopen        @PreAuthorize(staff) → reopenTicket
PATCH  /api/v1/tickets/{id}/duplicate     @PreAuthorize(staff) → markDuplicate
POST   /api/v1/tickets/{id}/comments      @PreAuthorize(staff) → addComment
DELETE /api/v1/tickets/{id}               @PreAuthorize(staff) → deleteTicket
```

`GET /api/v1/tickets/{id}` checks category `displayPermissionLevel` via `permissionEvaluator`.

---

### api/src/main/java/com/ureport/controller/TicketHistoryController.java

`@RestController @RequestMapping("/api/v1/tickets")`.
Both endpoints require `@PreAuthorize("hasRole('STAFF')")` per FRD F01 ("Staff see full history").

```
GET /api/v1/tickets/{id}/history           → ticketHistoryService.getHistory(id)
GET /api/v1/tickets/{id}/history/{historyId} → single entry lookup
```

---

### DTOs

**CreateTicketRequest:** Fields matching FRD F00 inputs with @NotNull on category_id and description.
**UpdateTicketRequest:** All optional fields matching FRD F00 Update Ticket inputs.
**CloseTicketRequest:** `@NotNull Integer substatusId`, optional `String notes`.
**TicketResponse:** All fields from FRD F00 outputs, including `historyCount`, `mediaCount`.
**HistoryEntryResponse:** All fields from FRD F01 outputs including `renderedDescription`.

---

### Tests

**api/src/test/java/com/ureport/service/TicketServiceTest.java**

JUnit 5 + Mockito. Mock: `TicketRepository`, `TicketHistoryService`, `CategoryRepository`,
`SubstatusRepository`, `PermissionEvaluator`, `PersonRepository`.

Tests:
- `testCreateTicket_success_createsTicketAndAppendsOpenHistory()`
- `testCreateTicket_inactiveCategory_throws404()`
- `testCreateTicket_permissionDenied_throws403()`
- `testCreateTicket_emptyDescription_throws422()`
- `testCreateTicket_invalidCoordinates_throws422()`
- `testCloseTicket_success_setsStatusClosedAndAppendsHistory()`
- `testCloseTicket_alreadyClosed_throws422()`
- `testCloseTicket_wrongSubstatusType_throws422()`
- `testMarkDuplicate_circularParentage_throws422()`
- `testReopenTicket_success_setsStatusOpen()`
- `testReopenTicket_alreadyOpen_throws422()`
- `testAssignTicket_nonStaffAssignee_throws422()`

**api/src/test/java/com/ureport/service/TicketHistoryServiceTest.java**

Tests:
- `testAppend_insertsImmutableRow()`
- `testGetHistory_orderedByEnteredDateAsc()`
- `testTemplateVariableResolution_enteredByPerson()`
- `testTemplateVariableResolution_originalField()`
- `testTemplateVariableResolution_unknownTokenPassthrough()`

  </action>
  <verify>
mvn -f api/pom.xml test -pl . -Dtest="TicketServiceTest,AuthServiceTest,TicketHistoryServiceTest" -q 2>&1 | tail -10 && echo TESTS_PASSED
grep -n '@Entity' api/src/main/java/com/ureport/entity/Ticket.java && echo TICKET_ENTITY_OK
grep -n 'insertable=false.*updatable=false\|updatable=false.*insertable=false' api/src/main/java/com/ureport/entity/Ticket.java && echo SEARCH_VECTOR_READONLY_OK
grep -n 'ACTION_OPEN' api/src/main/java/com/ureport/service/TicketService.java && echo ACTION_CONSTANTS_OK
grep -n 'CIRCULAR_DUPLICATE' api/src/main/java/com/ureport/service/TicketService.java && echo DUPLICATE_CHECK_OK
grep -n 'resolve' api/src/main/java/com/ureport/util/TemplateVariableResolver.java && echo RESOLVER_OK
  </verify>
  <done>
- Ticket.java: @Entity with all 25 columns, searchVector as insertable=false/updatable=false,
  @PrePersist/@PreUpdate for enteredDate/lastModified
- TicketHistory.java: @Entity with all 9 columns, @PrePersist only (immutable)
- Category, Substatus, Action entities with full column mappings
- TicketRepository, TicketHistoryRepository, ActionRepository, SubstatusRepository, CategoryRepository
- TemplateVariableResolver: resolves {enteredByPerson}, {actionPerson}, {original:field},
  {updated:field}, {duplicate:ticket_id}; unknown tokens passed through unchanged
- TicketHistoryService: append() (immutable INSERT only), getHistory() with rendered descriptions
- TicketService: all 7 lifecycle methods with validation, error states from FRD F00,
  ACTION_* integer constants matching seed IDs from 03-seed.sql
- TicketController: 9 endpoints with @PreAuthorize staff guards
- TicketHistoryController: 2 endpoints with @PreAuthorize staff guards
- All request/response DTOs
- 12 TicketServiceTest tests passing, 5 TicketHistoryServiceTest tests passing
- mvn test exits 0
  </done>
</task>

<feature_dependencies>
Implements: F0 (complete ticket lifecycle CRUD: create/assign/update/close/reopen/duplicate/comment
  with all validation rules and error states from FRD F00), F1 (TicketHistoryService append-only
  log, TemplateVariableResolver with all {variable} tokens, history API with rendered descriptions)
Depends on: Task 1 (SecurityConfig, JwtUserDetails, PermissionEvaluator, exception classes),
  Wave 1 (tickets, ticketHistory, categories, substatus, actions, people tables; seeded action
  IDs 1-10 and substatus IDs 1-4 in 03-seed.sql)
Enables: F2 (Open311RequestsController calls TicketService.createTicket),
  F11 (TicketSearchService extends TicketRepository declared here),
  F5 (PeopleController depends on Person entity + SecurityConfig from this wave),
  All other waves that import TicketService, TicketHistoryService, or entity classes
</feature_dependencies>

</tasks>

<verification>
After both tasks complete:

1. Project compiles:
```bash
mvn -f api/pom.xml compile -q && echo COMPILE_OK
```

2. All unit tests pass:
```bash
mvn -f api/pom.xml test -q && echo ALL_TESTS_PASSED
```

3. Security layer complete:
```bash
grep -n 'SecurityFilterChain' api/src/main/java/com/ureport/config/SecurityConfig.java && echo OK
grep -n 'JwtAuthenticationFilter\|ApiKeyAuthenticationFilter' api/src/main/java/com/ureport/config/SecurityConfig.java && echo FILTERS_OK
```

4. Entity integrity:
```bash
grep -n 'insertable=false' api/src/main/java/com/ureport/entity/Ticket.java && echo SEARCH_VECTOR_OK
grep -n 'passwordHash' api/src/main/java/com/ureport/entity/Person.java && echo PASSWORD_HASH_OK
```

5. System action IDs hardwired correctly:
```bash
grep -n 'ACTION_OPEN.*=.*1' api/src/main/java/com/ureport/service/TicketService.java && echo ACTION_IDS_OK
```

6. Integration contracts satisfied:
```bash
grep -n 'spring-boot-starter-security' api/pom.xml &&
grep -n 'jjwt' api/pom.xml &&
grep -n 'postgresql' api/pom.xml &&
echo CONTRACT_OK

grep -n 'generateToken' api/src/main/java/com/ureport/security/JwtTokenProvider.java &&
grep -n 'validateToken' api/src/main/java/com/ureport/security/JwtTokenProvider.java &&
echo JWT_CONTRACT_OK

grep -n 'createTicket' api/src/main/java/com/ureport/service/TicketService.java &&
grep -n 'ticketHistoryService' api/src/main/java/com/ureport/service/TicketService.java &&
echo TICKET_SERVICE_CONTRACT_OK
```

7. Docker build (if Docker available):
```bash
docker build -t ureport-api-check api/ 2>&1 | tail -5 && echo DOCKER_BUILD_OK
```
</verification>

<success_criteria>
- api/ directory exists with complete Maven project structure
- mvn compile exits 0 with zero errors
- mvn test exits 0 with all tests passing (≥19 unit tests: 7 AuthService + 12 TicketService + 5 TicketHistoryService)
- SecurityConfig: stateless JWT session, JwtAuthFilter + ApiKeyFilter in chain, correct permitAll rules
- JwtTokenProvider: jjwt 0.12.x API, HS256 signing, all 5 methods (generateToken, validateToken, getClaims, getPersonId, getJti)
- JwtAuthenticationFilter: extracts Bearer token, validates, checks blacklist, sets SecurityContext
- ApiKeyAuthenticationFilter: SHA-256 lookup, BCrypt verify, sets ApiKeyPrincipal
- PermissionEvaluator: isAllowed(callerRole, requiredLevel) using anonymous/public/staff hierarchy
- Ticket.java: all 25 columns mapped, searchVector insertable=false/updatable=false
- TicketHistory.java: all 9 columns, no update/delete methods
- TemplateVariableResolver: resolves {enteredByPerson}, {actionPerson}, {original:field}, {updated:field}, {duplicate:ticket_id}; unknown tokens unchanged
- TicketService: ACTION_OPEN=1 through ACTION_COMMENT=9 matching seed, all 7 lifecycle methods, all validation + error states from FRD F00
- All integration_contracts.provides.verify commands exit 0
</success_criteria>

<output>
After completion, create `.planning/express/implement-the-full-ureport-modernization/02-SUMMARY.md`
summarizing:
- Files created: count and list
- Compile status: mvn compile result
- Test count and results
- Security architecture: filters, JWT config, BCrypt
- Ticket lifecycle: 7 methods, action ID mapping
- Template resolver: variables supported
- Any deviations from spec (should be none; flag any)
- Integration contract verification: all provides.verify commands ran and passed
</output>
