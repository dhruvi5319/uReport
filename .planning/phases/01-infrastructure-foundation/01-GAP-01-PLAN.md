---
phase: 01-infrastructure-foundation
plan: GAP-01
type: execute
wave: 1
depends_on: []
files_modified:
  - .pivota/start-dev.sh
  - .pivota/dev-script.meta.json
autonomous: true
gap_closure: true

features:
  implements: ["ARCH-02"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - ".pivota/start-dev.sh runs Spring Boot via `mvn spring-boot:run` in backend/ — no docker compose invocation"
    - "Java 21 and Maven are installed via apt-get in the pre-exec snippet if not already on PATH"
    - "DATABASE_URL is resolved to a valid jdbc:postgresql:// URL before Spring Boot starts"
    - "Spring Boot binds to 0.0.0.0:8080 (not loopback)"
    - "bash -n validates start-dev.sh without syntax errors"
    - "dev-script.meta.json has catalog_entry=null and reflects the new inputs"
  artifacts:
    - path: ".pivota/start-dev.sh"
      provides: "Executable dev-server launcher using Maven Spring Boot plugin"
      contains: "mvn spring-boot:run"
    - path: ".pivota/dev-script.meta.json"
      provides: "Metadata for the agent-synthesized dev script"
      contains: "catalog_entry"
  key_links:
    - from: ".pivota/start-dev.sh"
      to: "backend/mvn spring-boot:run"
      via: "EXEC_CMD in retry loop"
      pattern: "mvn spring-boot:run"
    - from: ".pivota/start-dev.sh"
      to: "DATABASE_URL"
      via: "PRE_EXEC_SNIPPET jdbc:postgresql:// override"
      pattern: "jdbc:postgresql"

integration_contracts:
  requires: []
  provides:
    - artifact: ".pivota/start-dev.sh"
      exports: ["start-dev entrypoint"]
      shape: "Bash script; EXEC_CMD='cd backend && mvn spring-boot:run ...'; chmod 755"
      verify: "grep -n 'mvn spring-boot:run' .pivota/start-dev.sh && echo CONTRACT_OK"
    - artifact: ".pivota/dev-script.meta.json"
      exports: ["catalog_entry"]
      shape: "JSON; catalog_entry=null, generator_version=init-dev-server@1"
      verify: "python3 -c \"import json,sys; d=json.load(open('.pivota/dev-script.meta.json')); assert d['catalog_entry'] is None\" && echo CONTRACT_OK"
---

<objective>
Regenerate `.pivota/start-dev.sh` and `.pivota/dev-script.meta.json` so the dev-server launcher
uses `mvn spring-boot:run` instead of `docker compose up`.

Purpose: The Daytona K8s sandbox has no Docker daemon, so the compose-based start-dev.sh
fails unconditionally. The correct strategy for this environment is running Spring Boot
directly via the Maven Spring Boot plugin, with a pre-exec snippet to install Java 21 + Maven
if they are not already present, and DATABASE_URL normalization to ensure Spring Boot receives
a valid `jdbc:postgresql://` connection string regardless of what the platform injects.

Output:
- `.pivota/start-dev.sh` — rewritten, chmod 755, passes `bash -n`
- `.pivota/dev-script.meta.json` — updated, catalog_entry=null (agent-synthesized)
- git commit: `chore(pivota): regenerate dev-server startup script (agent-synthesized: java-spring-direct)`
</objective>

<feature_dependencies>
Implements: ARCH-02: Docker Compose / dev-server setup for the three-container Spring Boot stack
Depends on: None
Enables: None (gap closure within Phase 1)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
@/root/.config/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-infrastructure-foundation/01-UAT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite .pivota/start-dev.sh for Maven Spring Boot launch</name>
  <files>.pivota/start-dev.sh</files>
  <action>
Rewrite `.pivota/start-dev.sh` from scratch, following the wrapper template at
`/home/daytona/.config/opencode/pivota_spec-framework/workflows/init-dev-server/wrapper-template.sh`
verbatim for all structural sections. Only the variable blocks specific to this stack change.

**Substitution values for the template placeholders:**

| Placeholder | Value |
|---|---|
| `{{CATALOG_ENTRY_ID}}` | `agent-synthesized: java-spring-direct` |
| `{{GENERATOR_VERSION}}` | `init-dev-server@1` |
| `{{ENV_PREAMBLE_LINES}}` | `export SERVER_ADDRESS=0.0.0.0` |
| `{{PRE_EXEC_SNIPPET}}` | (see below) |
| `{{LOCK_FILE}}` | `backend/pom.xml` |
| `{{INSTALL_PRESENCE_CHECK}}` | `~/.m2/repository` |
| `{{INSTALL_CMD}}` | `cd backend && mvn dependency:resolve -B -q` |
| `{{EXEC_CMD}}` | `cd backend && mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.address=0.0.0.0"` |

**PRE_EXEC_SNIPPET — paste this block verbatim (replaces the `{{PRE_EXEC_SNIPPET}}` line):**

```bash
# === Agent-synthesized pre-exec: install Java 21 + Maven if not present ===
if ! command -v java &>/dev/null || ! java -version 2>&1 | grep -q 'version "21'; then
  echo "[pivota] Java 21 not found — installing via apt-get"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq && apt-get install -y -qq openjdk-21-jdk-headless
  export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
  export PATH="$JAVA_HOME/bin:$PATH"
fi
if ! command -v mvn &>/dev/null; then
  echo "[pivota] Maven not found — installing via apt-get"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq && apt-get install -y -qq maven
fi

# === DATABASE_URL normalization (platform may inject mysql:// or raw postgresql:// scheme) ===
# Spring Boot / HikariCP requires jdbc:postgresql:// scheme.
# If DATABASE_URL is set but does NOT start with jdbc:postgresql://, construct the correct
# JDBC URL from PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD, or fall back to the
# application.yml default (jdbc:postgresql://localhost:5432/ureport).
if [[ -n "${DATABASE_URL:-}" && "${DATABASE_URL}" != jdbc:postgresql://* ]]; then
  echo "[pivota] DATABASE_URL scheme is not jdbc:postgresql:// — constructing JDBC URL from PG* vars"
  _PG_HOST="${PGHOST:-localhost}"
  _PG_PORT="${PGPORT:-5432}"
  _PG_DB="${PGDATABASE:-ureport}"
  _PG_USER="${PGUSER:-}"
  _PG_PASS="${PGPASSWORD:-}"
  if [[ -n "$_PG_USER" && -n "$_PG_PASS" ]]; then
    export DATABASE_URL="jdbc:postgresql://${_PG_HOST}:${_PG_PORT}/${_PG_DB}?user=${_PG_USER}&password=${_PG_PASS}"
  elif [[ -n "$_PG_USER" ]]; then
    export DATABASE_URL="jdbc:postgresql://${_PG_HOST}:${_PG_PORT}/${_PG_DB}?user=${_PG_USER}"
  else
    export DATABASE_URL="jdbc:postgresql://${_PG_HOST}:${_PG_PORT}/${_PG_DB}"
  fi
  echo "[pivota] DATABASE_URL normalized to: ${DATABASE_URL%%\?*}?<credentials-redacted>"
fi
# If DATABASE_URL is unset entirely, let application.yml default (jdbc:postgresql://localhost:5432/ureport) apply.
```

**Decision trace comment to add at the top of the file (after the existing decision-trace block, before `set -euo pipefail`):**

```
#   - No mvnw wrapper in backend/ — must use system `mvn` (apt-get installed in pre-exec).
#   - DATABASE_URL normalization: platform may inject mysql:// or raw postgresql:// scheme;
#     convert to jdbc:postgresql:// so HikariCP accepts it (Spring Boot cannot auto-prefix).
#   - SERVER_ADDRESS=0.0.0.0 env preamble: Spring Boot binds server.address from this env
#     var so the preview iframe can reach port 8080 from outside the sandbox loopback.
#   - EXEC_CMD runs 'cd backend &&' because mvn must be invoked from the module directory;
#     -Dspring-boot.run.jvmArguments redundantly passes server.address as a JVM property
#     (belt-and-suspenders alongside the env var).
```

**Full file structure (in order):**
1. Shebang + header comment block (update catalog entry ID and generator version)
2. Updated decision-trace block (add the three bullet points above to the existing list)
3. `set -euo pipefail`
4. Bash version guard (verbatim from template)
5. tee log section (update catalog reference in echo from `compose` to `agent-synthesized: java-spring-direct`)
6. ENV_PREAMBLE_LINES block (`export SERVER_ADDRESS=0.0.0.0`) with comment
7. .env.example seed block (verbatim from template)
8. PRE_EXEC_SNIPPET block (paste the Java 21 + Maven + DATABASE_URL snippet above)
9. D-12 idempotent install block with the new variable values
10. D-14 retry loop with `EXEC_CMD='cd backend && mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.address=0.0.0.0"'`
11. `exit 1` unreachable + `# === END PIVOTA PREAMBLE ===` + preservation comment

After writing the file, run:
```bash
chmod 755 .pivota/start-dev.sh
```
  </action>
  <verify>
```bash
# 1. File exists and is executable
test -x .pivota/start-dev.sh && echo "FILE_EXECUTABLE OK"

# 2. Bash syntax check (no syntax errors)
bash -n .pivota/start-dev.sh && echo "BASH_SYNTAX OK"

# 3. Must NOT contain docker compose
grep -c 'docker compose' .pivota/start-dev.sh && echo "FAIL: docker compose still present" || echo "NO_DOCKER_COMPOSE OK"

# 4. Must contain mvn spring-boot:run
grep -q 'mvn spring-boot:run' .pivota/start-dev.sh && echo "MVN_CMD OK"

# 5. Must contain DATABASE_URL normalization
grep -q 'jdbc:postgresql' .pivota/start-dev.sh && echo "JDBC_NORMALIZATION OK"

# 6. Must contain Java 21 install
grep -q 'openjdk-21' .pivota/start-dev.sh && echo "JAVA_INSTALL OK"

# 7. Must bind 0.0.0.0
grep -q 'SERVER_ADDRESS=0.0.0.0' .pivota/start-dev.sh && echo "BIND_ADDRESS OK"

# 8. Must reference correct log entry
grep -q 'agent-synthesized: java-spring-direct' .pivota/start-dev.sh && echo "CATALOG_REF OK"
```
  </verify>
  <done>
- `.pivota/start-dev.sh` exists, is chmod 755, and passes `bash -n` with zero errors
- Contains `mvn spring-boot:run` as the EXEC_CMD — no `docker compose` present
- Contains a pre-exec snippet that installs `openjdk-21-jdk-headless` and `maven` via apt-get
- Contains DATABASE_URL normalization logic that converts non-`jdbc:postgresql://` values
- Contains `export SERVER_ADDRESS=0.0.0.0` in the ENV_PREAMBLE section
- LOCK_FILE is `backend/pom.xml`, INSTALL_PRESENCE_CHECK is `~/.m2/repository`
- All structural sections from the template are preserved verbatim
  </done>
</task>

<task type="auto">
  <name>Task 2: Update .pivota/dev-script.meta.json and commit both files</name>
  <files>.pivota/dev-script.meta.json</files>
  <action>
**Step 1 — Rewrite `.pivota/dev-script.meta.json`:**

Write the following JSON to `.pivota/dev-script.meta.json`:

```json
{
  "generator_version": "init-dev-server@1",
  "catalog_entry": null,
  "generated_at": "<CURRENT_ISO8601_TIMESTAMP>",
  "inspection_inputs_hash": "<COMPUTED_HASH>",
  "inspection_inputs": {
    "matched_globs": [
      "backend/pom.xml",
      "docker-compose.yml"
    ],
    "manifest_signatures": [
      "backend/pom.xml:groupId=com.ureport:artifactId=ureport-api:java.version=21",
      "docker-compose.yml:services:api,db,web"
    ],
    "existing_scripts": [
      ".pivota/start-dev.sh"
    ]
  },
  "agent_synthesis_reason": "No mvnw wrapper present in backend/; catalog compose entry requires Docker daemon absent in Daytona K8s sandbox. Agent chose java-spring-direct strategy: mvn spring-boot:run with apt-get Java 21 + Maven pre-exec."
}
```

For `<CURRENT_ISO8601_TIMESTAMP>`: use `date -u +"%Y-%m-%dT%H:%M:%SZ"` shell output.

For `<COMPUTED_HASH>`: compute a deterministic sha256 over the concatenated inspection inputs
string using this shell command and paste the resulting hex digest:
```bash
printf '%s\n' \
  "backend/pom.xml" \
  "docker-compose.yml" \
  "backend/pom.xml:groupId=com.ureport:artifactId=ureport-api:java.version=21" \
  "docker-compose.yml:services:api,db,web" \
  ".pivota/start-dev.sh" \
  "agent-synthesized: java-spring-direct" \
  | sha256sum | cut -d' ' -f1
```

**Step 2 — Validate JSON syntax:**
```bash
python3 -m json.tool .pivota/dev-script.meta.json > /dev/null && echo "JSON_VALID OK"
```

**Step 3 — git add and commit both files:**
```bash
git add .pivota/start-dev.sh .pivota/dev-script.meta.json
git commit -m "chore(pivota): regenerate dev-server startup script (agent-synthesized: java-spring-direct)"
```
  </action>
  <verify>
```bash
# 1. JSON is valid
python3 -m json.tool .pivota/dev-script.meta.json > /dev/null && echo "JSON_VALID OK"

# 2. catalog_entry is null
python3 -c "import json,sys; d=json.load(open('.pivota/dev-script.meta.json')); assert d['catalog_entry'] is None, 'catalog_entry should be null'; print('CATALOG_NULL OK')"

# 3. matched_globs contains backend/pom.xml
python3 -c "import json; d=json.load(open('.pivota/dev-script.meta.json')); assert 'backend/pom.xml' in d['inspection_inputs']['matched_globs']; print('GLOBS OK')"

# 4. agent_synthesis_reason present
python3 -c "import json; d=json.load(open('.pivota/dev-script.meta.json')); assert 'agent_synthesis_reason' in d; print('REASON OK')"

# 5. Commit exists with the correct message
git log --oneline -1 | grep -q 'agent-synthesized: java-spring-direct' && echo "COMMIT OK"
```
  </verify>
  <done>
- `.pivota/dev-script.meta.json` is valid JSON with `catalog_entry: null`
- `inspection_inputs.matched_globs` includes `backend/pom.xml` and `docker-compose.yml`
- `inspection_inputs_hash` is a valid sha256 hex digest of the new inspection inputs
- `agent_synthesis_reason` documents why compose was not used
- `generated_at` reflects the current timestamp
- Both files are committed with message: `chore(pivota): regenerate dev-server startup script (agent-synthesized: java-spring-direct)`
- `git log --oneline -1` shows the commit
  </done>
</task>

</tasks>

<verification>
After both tasks complete, run these end-to-end checks:

```bash
# Full syntax and content validation
echo "=== start-dev.sh checks ==="
test -x .pivota/start-dev.sh && echo "EXECUTABLE: OK"
bash -n .pivota/start-dev.sh && echo "SYNTAX: OK"
grep -q 'mvn spring-boot:run' .pivota/start-dev.sh && echo "EXEC_CMD: OK"
grep -q 'openjdk-21' .pivota/start-dev.sh && echo "JAVA_INSTALL: OK"
grep -q 'jdbc:postgresql' .pivota/start-dev.sh && echo "JDBC_NORM: OK"
grep -q 'SERVER_ADDRESS=0.0.0.0' .pivota/start-dev.sh && echo "BIND: OK"
grep -q 'backend/pom.xml' .pivota/start-dev.sh && echo "LOCK_FILE: OK"
grep -q '~/.m2/repository' .pivota/start-dev.sh && echo "PRESENCE_CHECK: OK"
! grep -q 'docker compose' .pivota/start-dev.sh && echo "NO_DOCKER: OK"

echo "=== dev-script.meta.json checks ==="
python3 -m json.tool .pivota/dev-script.meta.json > /dev/null && echo "JSON_VALID: OK"
python3 -c "import json; d=json.load(open('.pivota/dev-script.meta.json')); assert d['catalog_entry'] is None; print('CATALOG_NULL: OK')"

echo "=== git commit check ==="
git log --oneline -1 | grep -q 'java-spring-direct' && echo "COMMIT: OK"
```

All checks must print OK. No docker compose references must remain in start-dev.sh.
</verification>

<success_criteria>
- `bash -n .pivota/start-dev.sh` exits 0 (no syntax errors)
- `grep 'docker compose' .pivota/start-dev.sh` returns non-zero (no matches)
- `grep 'mvn spring-boot:run' .pivota/start-dev.sh` returns 0 (match found)
- `.pivota/dev-script.meta.json` passes `python3 -m json.tool` and has `catalog_entry: null`
- `git log --oneline -1` shows commit with `agent-synthesized: java-spring-direct`
- Gap from `01-UAT.md` — "EXEC_CMD uses docker compose up" — is fully resolved
</success_criteria>

<output>
After completion, create `.planning/phases/01-infrastructure-foundation/01-GAP-01-SUMMARY.md`
documenting:
- What was changed (start-dev.sh strategy: compose → java-spring-direct)
- PRE_EXEC_SNIPPET installed (Java 21 via openjdk-21-jdk-headless, Maven via maven)
- DATABASE_URL normalization logic added
- meta.json updated with catalog_entry=null and agent_synthesis_reason
- Commit hash
</output>
