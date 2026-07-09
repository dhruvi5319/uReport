---
phase: 08-core-frontend-screens
plan: PGAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - .pivota/start-dev.sh
autonomous: true
gap_closure: true

features:
  implements: ["GAP-08-01"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Spring Boot backend starts with H2 in-memory DB when PostgreSQL is not available"
    - "Vite frontend stays running because the backend no longer crashes on startup"
    - "The React app is accessible in the preview (http://localhost:5173)"
  artifacts:
    - path: ".pivota/start-dev.sh"
      provides: "mvn spring-boot:run with -Dspring.profiles.active=dev flag"
      contains: "-Dspring.profiles.active=dev"
  key_links:
    - from: ".pivota/start-dev.sh"
      to: "backend/src/main/resources/application-dev.yml"
      via: "-Dspring.profiles.active=dev JVM argument"
      pattern: "spring\\.profiles\\.active=dev"

integration_contracts:
  requires: []
  provides:
    - artifact: ".pivota/start-dev.sh"
      exports: ["dev-profile-activation"]
      shape: |
        Line 226: exec bash -c 'mvn spring-boot:run -q -Dspring.profiles.active=dev'
      verify: "grep -n 'spring.profiles.active=dev' .pivota/start-dev.sh && echo CONTRACT_OK"
---

<objective>
Activate the Spring Boot `dev` profile in the dev server start script so the backend uses H2 in-memory DB instead of PostgreSQL.

Purpose: The sandbox environment has no PostgreSQL sidecar. The backend already has `application-dev.yml` with H2 + Flyway disabled, but `start-dev.sh` never activates it. The backend crashes on launch trying to reach PostgreSQL, which kills the Vite frontend process via the shared process group, making the preview inaccessible.

Output: `.pivota/start-dev.sh` with `-Dspring.profiles.active=dev` appended to the `mvn spring-boot:run` invocation. Backend starts cleanly on H2; Vite stays up; preview accessible at http://localhost:5173.
</objective>

<feature_dependencies>
Implements: GAP-08-01: Dev server stays running so the React frontend is accessible in the preview
Depends on: None
Enables: None (unblocks UAT tests 1-18 which were pending due to server instability)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/08-core-frontend-screens/08-UAT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add -Dspring.profiles.active=dev to mvn spring-boot:run in start-dev.sh</name>
  <files>.pivota/start-dev.sh</files>
  <action>
Edit `.pivota/start-dev.sh` line 226. The current line is:

```bash
    && exec bash -c 'mvn spring-boot:run -q'
```

Change it to:

```bash
    && exec bash -c 'mvn spring-boot:run -q -Dspring.profiles.active=dev'
```

This activates `backend/src/main/resources/application-dev.yml` at Spring Boot startup, which:
- Switches datasource to `jdbc:h2:mem:devdb` (no PostgreSQL required)
- Sets `spring.flyway.enabled: false` (no migration against H2)
- Sets `spring.jpa.hibernate.ddl-auto: create-drop` (schema managed by Hibernate)
- Disables LDAP and CAS (not available in dev sandbox)
- Uses a default `jwt.secret` dev value

Do NOT change any other lines. Do NOT add SPRING_PROFILES_ACTIVE as an environment variable export — the JVM system property via `-D` is sufficient and scoped to this Maven invocation only.
  </action>
  <verify>
Run the following checks (do not start the full server — just verify the file edit is correct):

```bash
grep -n 'spring.profiles.active=dev' .pivota/start-dev.sh && echo "PROFILE_FLAG_PRESENT"
grep -n 'mvn spring-boot:run' .pivota/start-dev.sh
```

Expected output:
- Line containing `spring.profiles.active=dev` is found → prints `PROFILE_FLAG_PRESENT`
- The `mvn spring-boot:run` line shows the full updated command with `-Dspring.profiles.active=dev`
  </verify>
  <done>
`.pivota/start-dev.sh` line 226 reads:
`    && exec bash -c 'mvn spring-boot:run -q -Dspring.profiles.active=dev'`

`grep -n 'spring.profiles.active=dev' .pivota/start-dev.sh` exits 0 and prints the matching line.

No other lines in the file are modified.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| script→JVM | Shell script passes JVM system property string into Maven/Spring Boot process |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-08G-01 | Tampering | `.pivota/start-dev.sh` JVM arg | accept | The `-Dspring.profiles.active=dev` value is a hardcoded literal string in the script, not derived from user input. No injection surface. Residual risk: a developer who edits start-dev.sh could supply a malicious profile name, but this is the same trust level as editing any script in the repo. |
| T-08G-02 | Information disclosure | `application-dev.yml` jwt.secret default | accept | Default dev JWT secret (`dev-secret-32-characters-minimum-for-hs256`) is only active when the `dev` profile is active — i.e., in sandboxes without PostgreSQL. Production deployments use a real `JWT_SECRET` env var and never activate the dev profile. Residual risk owned by the operator who must ensure `dev` profile is never activated in production. |
</threat_model>

<verification>
After executing Task 1:

```bash
# Verify the profile flag is in the script
grep -n 'spring.profiles.active=dev' .pivota/start-dev.sh && echo "VERIFICATION PASSED"

# Confirm no other lines changed (line count should be unchanged at 244)
wc -l .pivota/start-dev.sh

# Confirm application-dev.yml still has H2 config (unchanged)
grep 'h2:mem' backend/src/main/resources/application-dev.yml && echo "H2_CONFIG_OK"
grep 'flyway:' backend/src/main/resources/application-dev.yml && echo "FLYWAY_SECTION_OK"
```

All three checks must pass.
</verification>

<success_criteria>
- `.pivota/start-dev.sh` contains `-Dspring.profiles.active=dev` on the `mvn spring-boot:run` line
- `grep` exits 0 confirming the profile flag is present
- `application-dev.yml` is untouched (H2 datasource, Flyway disabled, LDAP/CAS disabled)
- When the dev server next starts, Spring Boot activates the `dev` profile, connects to H2, and stays running — keeping Vite alive and the preview accessible at http://localhost:5173
</success_criteria>

<output>
After completion, create `.planning/phases/08-core-frontend-screens/08-PGAP-01-SUMMARY.md` following the summary template.
</output>
