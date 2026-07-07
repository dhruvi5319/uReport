---
phase: 03-open311-georeport-v2-api
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
  implements: ["F0", "API-01"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "start-dev.sh installs JDK 21 and Maven idempotently (checks command -v before apt-get)"
    - "start-dev.sh launches the Spring Boot backend via mvn spring-boot:run in backend/"
    - "start-dev.sh never references docker or docker-compose in EXEC_CMD"
    - "dev-script.meta.json has catalog_entry=null and an updated timestamp"
  artifacts:
    - path: ".pivota/start-dev.sh"
      provides: "Idempotent JDK 21 + Maven install and mvn spring-boot:run launcher"
      contains: "mvn spring-boot:run"
    - path: ".pivota/dev-script.meta.json"
      provides: "Updated metadata with catalog_entry=null"
      contains: "null"
  key_links:
    - from: ".pivota/start-dev.sh"
      to: "backend/ (Spring Boot Maven project)"
      via: "mvn spring-boot:run"
      pattern: "mvn spring-boot:run"
    - from: ".pivota/start-dev.sh (INSTALL_CMD)"
      to: "/root/.m2/repository"
      via: "apt-get install openjdk-21-jdk-headless maven"
      pattern: "openjdk-21-jdk-headless"

integration_contracts:
  requires: []
  provides:
    - artifact: ".pivota/start-dev.sh"
      exports: ["JDK 21 install", "Maven install", "mvn spring-boot:run exec"]
      shape: |
        INSTALL_CMD installs openjdk-21-jdk-headless and maven via apt-get (idempotent).
        LOCK_FILE_PATH=backend/pom.xml, INSTALL_PRESENCE_CHECK=/root/.m2/repository.
        EXEC_CMD='cd /home/daytona/project/backend && mvn spring-boot:run'.
        ENV preamble exports SERVER_ADDRESS=0.0.0.0.
      verify: "grep -n 'mvn spring-boot:run' .pivota/start-dev.sh && grep -n 'openjdk-21-jdk-headless' .pivota/start-dev.sh && echo CONTRACT_OK"
    - artifact: ".pivota/dev-script.meta.json"
      exports: ["catalog_entry: null"]
      shape: '{ "catalog_entry": null, ... }'
      verify: "grep -n '\"catalog_entry\": null' .pivota/dev-script.meta.json && echo CONTRACT_OK"
---

<objective>
Fix the dev server start script so the Spring Boot backend can actually launch in the K8s sandbox where Docker is unavailable.

Purpose: The UAT blocker (Test 1 and all 8 downstream tests skipped) is caused entirely by `start-dev.sh` running `docker compose up`, which fails with "docker: command not found" in the K8s environment. The backend is a Spring Boot 3.3 Maven project — it needs JDK 21 + Maven installed, then `mvn spring-boot:run`.

Output:
- `.pivota/start-dev.sh` — rewritten with correct INSTALL_CMD (apt-get JDK 21 + Maven), LOCK_FILE_PATH, INSTALL_PRESENCE_CHECK, ENV preamble, and EXEC_CMD
- `.pivota/dev-script.meta.json` — updated with `catalog_entry: null` and fresh timestamp
</objective>

<feature_dependencies>
Implements: F0: Open311 GeoReport v2 API (dev server must start for all 9 UAT tests), API-01: Open311 endpoint contract compliance
Depends on: None
Enables: None (gap closure — unblocks UAT re-run)
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
@/root/.config/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-open311-georeport-v2-api/03-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite .pivota/start-dev.sh for Spring Boot / Maven</name>
  <files>.pivota/start-dev.sh</files>
  <action>
Rewrite `.pivota/start-dev.sh` in-place, preserving the ENTIRE wrapper preamble structure (bash version guard, tee logging, .env seeding, pre-exec snippet block, lockfile sentinel, retry loop). Only the following values change from the current file:

1. **Header comment** — change `Catalog entry: compose` → `Catalog entry: agent-fallback (spring-boot/maven)`

2. **Catalog log line** — line 38:
   `echo "[pivota] $(date -Iseconds) start-dev.sh begin (catalog: compose)"`
   → `echo "[pivota] $(date -Iseconds) start-dev.sh begin (catalog: agent-fallback spring-boot/maven)"`

3. **Per-stack ENV preamble** — replace the compose-specific comment block (lines 41-55) with:
   ```bash
   # === D-11.1: bind Spring Boot to 0.0.0.0 so sandbox preview reaches it ===
   # application.yml already sets server.address=0.0.0.0 and server.port=8080;
   # the env var below is an extra safety net for runtime override.
   export SERVER_ADDRESS=0.0.0.0
   ```

4. **PRE_EXEC_SNIPPET block** — the blank snippet area (currently between lines 82-85) stays empty (no changes needed).

5. **Lockfile variables** (lines 87-90) — replace the four lines:
   ```bash
   SENTINEL="/tmp/pivota-setup-sentinel"
   LOCK_FILE_PATH=""
   INSTALL_PRESENCE_CHECK=""
   INSTALL_CMD=''   # single-quoted: catalog must escape internal quotes correctly
   ```
   with:
   ```bash
   SENTINEL="/tmp/pivota-setup-sentinel"
   LOCK_FILE_PATH="backend/pom.xml"
   INSTALL_PRESENCE_CHECK="/root/.m2/repository"
   INSTALL_CMD='
   if ! command -v java &>/dev/null || ! java -version 2>&1 | grep -q "21"; then
     echo "[pivota] installing openjdk-21-jdk-headless..."
     apt-get update -qq && apt-get install -y --no-install-recommends openjdk-21-jdk-headless
   else
     echo "[pivota] java 21 already installed, skipping"
   fi
   if ! command -v mvn &>/dev/null; then
     echo "[pivota] installing maven..."
     apt-get update -qq && apt-get install -y --no-install-recommends maven
   else
     echo "[pivota] maven already installed, skipping"
   fi
   '
   ```

6. **EXEC_CMD** (line 132) — replace:
   ```bash
   EXEC_CMD='docker compose up'
   ```
   with:
   ```bash
   EXEC_CMD='cd /home/daytona/project/backend && mvn spring-boot:run'
   ```

Do NOT modify any other part of the file. The retry loop, sentinel logic, .env seeding, bash version guard, tee logging, and trailing user-content section (after `# === END PIVOTA PREAMBLE ===`) must all be preserved verbatim.
  </action>
  <verify>
```bash
# 1. No docker/docker-compose reference in EXEC_CMD
grep 'EXEC_CMD=' .pivota/start-dev.sh
# Expected: EXEC_CMD='cd /home/daytona/project/backend && mvn spring-boot:run'

# 2. JDK install present
grep 'openjdk-21-jdk-headless' .pivota/start-dev.sh && echo "JDK_INSTALL_OK"

# 3. Maven install present
grep 'maven' .pivota/start-dev.sh | grep 'apt-get' && echo "MAVEN_INSTALL_OK"

# 4. Lockfile and presence check set
grep 'LOCK_FILE_PATH="backend/pom.xml"' .pivota/start-dev.sh && echo "LOCK_FILE_OK"
grep 'INSTALL_PRESENCE_CHECK="/root/.m2/repository"' .pivota/start-dev.sh && echo "PRESENCE_CHECK_OK"

# 5. SERVER_ADDRESS export present
grep 'export SERVER_ADDRESS=0.0.0.0' .pivota/start-dev.sh && echo "ENV_OK"

# 6. Wrapper structure intact — bash version guard still present
grep 'BASH_VERSINFO' .pivota/start-dev.sh && echo "VERSION_GUARD_OK"

# 7. Retry loop still present
grep 'ATTEMPT <= 3' .pivota/start-dev.sh && echo "RETRY_LOOP_OK"

# 8. END PIVOTA PREAMBLE marker still present
grep 'END PIVOTA PREAMBLE' .pivota/start-dev.sh && echo "PREAMBLE_MARKER_OK"

# 9. Script is executable / valid bash syntax
bash -n .pivota/start-dev.sh && echo "BASH_SYNTAX_OK"
```
  </verify>
  <done>
- `EXEC_CMD` is `cd /home/daytona/project/backend && mvn spring-boot:run` — no docker reference
- `LOCK_FILE_PATH=backend/pom.xml` and `INSTALL_PRESENCE_CHECK=/root/.m2/repository` are set
- `INSTALL_CMD` idempotently installs `openjdk-21-jdk-headless` and `maven` via apt-get with `command -v` guards
- `export SERVER_ADDRESS=0.0.0.0` is in the ENV preamble
- All wrapper structure elements (version guard, tee logging, .env seeding, sentinel, retry loop, preamble marker) are still present
- `bash -n .pivota/start-dev.sh` exits 0 (valid syntax)
  </done>
</task>

<task type="auto">
  <name>Task 2: Update .pivota/dev-script.meta.json to agent-fallback catalog</name>
  <files>.pivota/dev-script.meta.json</files>
  <action>
Rewrite `.pivota/dev-script.meta.json` with `catalog_entry` set to `null` (agent fallback — no built-in catalog matched the Spring Boot project correctly) and update `generated_at` to the current ISO-8601 timestamp.

The file must be valid JSON and contain these exact top-level keys:
```json
{
  "generator_version": "init-dev-server@1",
  "catalog_entry": null,
  "generated_at": "<current UTC ISO-8601 timestamp>",
  "inspection_inputs_hash": "8b5060a2ea9bf58ccb68afd854a703d9664c2629a9c054134ea4c126b6b8c0e0",
  "inspection_inputs": {
    "matched_globs": [
      "docker-compose.yml"
    ],
    "manifest_signatures": [
      "docker-compose.yml:services:app,db,phpmyadmin,solr"
    ],
    "existing_scripts": []
  },
  "gap_closure_note": "catalog_entry reset to null: docker-compose.yml describes legacy PHP/Apache stack; backend is Spring Boot 3.3 Maven — EXEC_CMD corrected to mvn spring-boot:run"
}
```

Use `date -u +%Y-%m-%dT%H:%M:%SZ` to obtain the current UTC timestamp and substitute it into `generated_at`.
  </action>
  <verify>
```bash
# 1. Valid JSON
python3 -c "import json,sys; d=json.load(open('.pivota/dev-script.meta.json')); assert d['catalog_entry'] is None, 'catalog_entry must be null'; print('JSON_VALID_AND_NULL_OK')"

# 2. gap_closure_note present
python3 -c "import json; d=json.load(open('.pivota/dev-script.meta.json')); assert 'gap_closure_note' in d; print('NOTE_OK')"

# 3. generated_at updated (should be today's date, not 2026-07-07T01:46:04Z)
python3 -c "import json; d=json.load(open('.pivota/dev-script.meta.json')); print('generated_at:', d['generated_at'])"
```
  </verify>
  <done>
- `catalog_entry` is `null` in the JSON
- `generated_at` reflects the time this gap closure ran (not the original 2026-07-07T01:46:04Z value)
- `gap_closure_note` explains why catalog was reset
- File is valid JSON (python3 parses without error)
  </done>
</task>

</tasks>

<verification>
After both tasks complete, verify the full contract:

```bash
# Contract verification
grep -n 'mvn spring-boot:run' .pivota/start-dev.sh && \
grep -n 'openjdk-21-jdk-headless' .pivota/start-dev.sh && \
grep -n '"catalog_entry": null' .pivota/dev-script.meta.json && \
echo "ALL_CONTRACTS_OK"

# Confirm no docker in EXEC_CMD line
grep 'EXEC_CMD=' .pivota/start-dev.sh | grep -v docker && echo "NO_DOCKER_IN_EXEC_OK"

# Bash syntax check
bash -n .pivota/start-dev.sh && echo "SYNTAX_OK"
```
</verification>

<success_criteria>
Gap is closed when:
1. `.pivota/start-dev.sh` uses `mvn spring-boot:run` as EXEC_CMD — no docker reference
2. `.pivota/start-dev.sh` installs JDK 21 and Maven idempotently before the first run
3. `.pivota/start-dev.sh` passes `bash -n` syntax check
4. `.pivota/dev-script.meta.json` has `"catalog_entry": null`
5. Re-running the UAT start sequence will launch the Spring Boot app on port 8080 (server.address=0.0.0.0 via application.yml + env var), unblocking all 9 UAT tests
</success_criteria>

<output>
After completion, create `.planning/phases/03-open311-georeport-v2-api/03-GAP-01-SUMMARY.md`
</output>
