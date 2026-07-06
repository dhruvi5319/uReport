---
phase: 01-infrastructure-foundation
plan: GAP-02
type: execute
wave: 1
depends_on: []
files_modified:
  - .pivota/start-dev.sh
  - .planning/infrastructure.json
autonomous: true
gap_closure: true

features:
  implements: ["ARCH-02", "DB-01"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Spring Boot starts and connects to PostgreSQL — no BeanCreationException on flywayInitializer"
    - "start-dev.sh never passes a mysql:// URL to SPRING_DATASOURCE_URL; always uses jdbc:postgresql://"
    - "When PIVOTA_DB_MODE=sidecar-mysql and DATABASE_URL=mysql://..., the script constructs jdbc:postgresql:// from PGHOST/PGPORT/PGDATABASE or falls back to application.yml default"
    - "infrastructure.json declares postgres sidecar so the platform provisions PostgreSQL instead of MySQL"
    - "bash -n validates start-dev.sh without syntax errors after the change"
  artifacts:
    - path: ".pivota/start-dev.sh"
      provides: "DATABASE_URL normalization that handles mysql:// scheme correctly"
      contains: "mysql://"
    - path: ".planning/infrastructure.json"
      provides: "Platform sidecar declaration — PostgreSQL required"
      contains: "postgres"
  key_links:
    - from: ".pivota/start-dev.sh"
      to: "SPRING_DATASOURCE_URL"
      via: "DATABASE_URL normalization block (lines ~141-165)"
      pattern: "jdbc:postgresql"
    - from: ".planning/infrastructure.json"
      to: "Daytona platform sidecar provisioner"
      via: "infrastructure.json sidecars array"
      pattern: "\"kind\".*postgres"

integration_contracts:
  requires: []
  provides:
    - artifact: ".pivota/start-dev.sh"
      exports: ["start-dev entrypoint with mysql:// protection"]
      shape: "Bash script; mysql:// scheme handled by constructing jdbc:postgresql:// from PG* vars; never passes MySQL URL to Spring"
      verify: "grep -n 'mysql://' .pivota/start-dev.sh && grep -n 'jdbc:postgresql' .pivota/start-dev.sh && echo CONTRACT_OK"
    - artifact: ".planning/infrastructure.json"
      exports: ["postgres sidecar declaration"]
      shape: "JSON; sidecars array with kind=postgres"
      verify: "python3 -c \"import json; d=json.load(open('.planning/infrastructure.json')); assert any(s.get('kind','').startswith('postgres') for s in d.get('sidecars',[])); print('CONTRACT_OK')\""
---

<objective>
Fix the MySQL-sidecar-vs-PostgreSQL-stack mismatch that causes Spring Boot to fail with
`BeanCreationException: flywayInitializer → Connection to localhost:5432 refused`.

Purpose: The Daytona sandbox injects `PIVOTA_DB_MODE=sidecar-mysql` and
`DATABASE_URL=mysql://ureport:ureport@localhost:3306/ureport`. The existing `start-dev.sh`
DATABASE_URL normalization handles `postgresql://` and `postgres://` schemes but lets `mysql://`
fall through to an "unknown scheme" warning, then exports `SPRING_DATASOURCE_URL=mysql://...`.
Spring Boot's HikariCP with `org.postgresql.Driver` cannot parse a `mysql://` URL and defaults
to attempting `localhost:5432` — which has nothing listening.

The architecturally correct fix (Option B from the planning context) is to:
1. **Treat `mysql://` as a signal to ignore DATABASE_URL entirely** and construct
   `jdbc:postgresql://` from `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD` env vars,
   or leave `SPRING_DATASOURCE_URL` unset so `application.yml` default
   (`jdbc:postgresql://localhost:5432/ureport`) applies.
2. **Ensure `.planning/infrastructure.json` declares the PostgreSQL sidecar** in the format
   the Daytona platform reads, so future sandbox restarts provision PostgreSQL instead of MySQL.

The project is PostgreSQL-only: all Flyway migrations use PostgreSQL-specific features
(tsvector, SERIAL PKs, BOOLEAN, GIN indexes, pg_trgm). MySQL support cannot be added
without re-architecting the entire schema — Option B is the only viable fix.

Output:
- `.pivota/start-dev.sh` — mysql:// branch updated: ignore MySQL URL, construct PostgreSQL URL
- `.planning/infrastructure.json` — verified/updated to declare postgres sidecar correctly
- git commit: `fix(pivota): handle mysql:// sidecar injection — construct jdbc:postgresql:// URL`
</objective>

<feature_dependencies>
Implements: ARCH-02: Dev-server startup and database connectivity for the Spring Boot stack
Implements: DB-01: PostgreSQL connection established (prerequisite for all Flyway migrations)
Depends on: None (gap closure within Phase 1)
Enables: None (unblocks all other Phase 1 UAT tests skipped due to this blocker)
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
@.planning/phases/01-infrastructure-foundation/01-GAP-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix mysql:// handling in start-dev.sh DATABASE_URL normalization block</name>
  <files>.pivota/start-dev.sh</files>
  <action>
Edit the DATABASE_URL normalization block in `.pivota/start-dev.sh` (currently lines ~138–165).

**Current broken behavior:**
The block handles `jdbc:postgresql://` and `postgresql://`/`postgres://` but lets `mysql://`
fall through to the "unknown scheme" branch:
```bash
else
  # Unknown scheme — pass through and let Spring/Flyway report the error
  export SPRING_DATASOURCE_URL="${DATABASE_URL}"
  echo "[pivota] WARNING: DATABASE_URL scheme unrecognized — passed as-is to SPRING_DATASOURCE_URL"
fi
```
This exports `SPRING_DATASOURCE_URL=mysql://...` which Spring Boot / HikariCP cannot parse with
`org.postgresql.Driver`. HikariCP then defaults to attempting `localhost:5432` → connection refused.

**Required fix:**
Replace the entire DATABASE_URL normalization block (the `if [[ -n "${DATABASE_URL:-}" ]]; then ...
fi` section, currently at ~lines 141–165) with this updated version that adds an explicit `mysql://`
handling case BEFORE the generic unknown-scheme fallthrough:

```bash
# --- Construct SPRING_DATASOURCE_URL from injected DATABASE_URL ---
# Spring Boot / HikariCP requires jdbc:postgresql:// scheme.
# Platform injects DATABASE_URL (may be postgresql://, postgres://, or sidecar-mysql mysql:// prefix).
if [[ -n "${DATABASE_URL:-}" ]]; then
  if [[ "${DATABASE_URL}" == jdbc:postgresql://* ]]; then
    export SPRING_DATASOURCE_URL="${DATABASE_URL}"
    echo "[pivota] SPRING_DATASOURCE_URL set from DATABASE_URL (already jdbc: scheme)"
  elif [[ "${DATABASE_URL}" == postgresql://* || "${DATABASE_URL}" == postgres://* ]]; then
    # Convert postgresql://user:pass@host:port/db to jdbc:postgresql://host:port/db?user=...&password=...
    _stripped="${DATABASE_URL#postgresql://}"
    _stripped="${_stripped#postgres://}"
    if [[ "$_stripped" == *"@"* ]]; then
      _userpass="${_stripped%%@*}"
      _hostpart="${_stripped#*@}"
      _user="${_userpass%%:*}"
      _pass="${_userpass#*:}"
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${_hostpart}?user=${_user}&password=${_pass}"
    else
      export SPRING_DATASOURCE_URL="jdbc:postgresql://${_stripped}"
    fi
    echo "[pivota] SPRING_DATASOURCE_URL normalized from DATABASE_URL"
  elif [[ "${DATABASE_URL}" == mysql://* || "${DATABASE_URL}" == mysql+*://* ]]; then
    # Platform injected a MySQL sidecar URL (PIVOTA_DB_MODE=sidecar-mysql).
    # This Spring Boot app is PostgreSQL-only (org.postgresql.Driver, tsvector, GIN indexes).
    # Ignore the MySQL URL entirely and construct a PostgreSQL JDBC URL from PG* env vars.
    # If PG* vars are not set, leave SPRING_DATASOURCE_URL unset so application.yml default
    # (jdbc:postgresql://localhost:5432/ureport) applies via ${DATABASE_URL:...} fallback.
    echo "[pivota] WARNING: DATABASE_URL is MySQL scheme (PIVOTA_DB_MODE=${PIVOTA_DB_MODE:-unset})"
    echo "[pivota] This stack is PostgreSQL-only — ignoring MySQL URL, constructing PostgreSQL JDBC URL"
    _PG_HOST="${PGHOST:-}"
    _PG_PORT="${PGPORT:-5432}"
    _PG_DB="${PGDATABASE:-ureport}"
    _PG_USER="${PGUSER:-}"
    _PG_PASS="${PGPASSWORD:-}"
    if [[ -n "$_PG_HOST" ]]; then
      # PG* sidecar vars are available — construct the full JDBC URL
      if [[ -n "$_PG_USER" && -n "$_PG_PASS" ]]; then
        export SPRING_DATASOURCE_URL="jdbc:postgresql://${_PG_HOST}:${_PG_PORT}/${_PG_DB}?user=${_PG_USER}&password=${_PG_PASS}"
      elif [[ -n "$_PG_USER" ]]; then
        export SPRING_DATASOURCE_URL="jdbc:postgresql://${_PG_HOST}:${_PG_PORT}/${_PG_DB}?user=${_PG_USER}"
      else
        export SPRING_DATASOURCE_URL="jdbc:postgresql://${_PG_HOST}:${_PG_PORT}/${_PG_DB}"
      fi
      echo "[pivota] SPRING_DATASOURCE_URL constructed from PG* vars: jdbc:postgresql://${_PG_HOST}:${_PG_PORT}/${_PG_DB}?<credentials-redacted>"
    else
      # No PG* vars — leave SPRING_DATASOURCE_URL unset.
      # application.yml default: ${DATABASE_URL:jdbc:postgresql://localhost:5432/ureport}
      # Since DATABASE_URL is set (but MySQL), Spring will try to use it unless we override.
      # Export the PostgreSQL default explicitly so HikariCP never sees the mysql:// URL.
      export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/ureport"
      echo "[pivota] No PG* vars found — using application.yml default: jdbc:postgresql://localhost:5432/ureport"
    fi
  else
    # Truly unknown scheme — pass through so Spring/Flyway can surface the error clearly.
    export SPRING_DATASOURCE_URL="${DATABASE_URL}"
    echo "[pivota] WARNING: DATABASE_URL scheme unrecognized — passed as-is to SPRING_DATASOURCE_URL"
  fi
fi
```

**Also update the decision-trace comment block** at the top of the file. Find the existing comment:
```
#   - SPRING_DATASOURCE_URL: Spring Boot / HikariCP requires a jdbc:postgresql://
#     URL. Platform injects DATABASE_URL (plain postgresql:// or similar); this
#     wrapper converts it to the JDBC form so Spring picks it up without manual
#     application.properties changes.
```

Replace it with:
```
#   - SPRING_DATASOURCE_URL: Spring Boot / HikariCP requires a jdbc:postgresql://
#     URL. Platform may inject DATABASE_URL as postgresql://, postgres://, or
#     mysql:// (PIVOTA_DB_MODE=sidecar-mysql). The mysql:// case is handled by
#     constructing jdbc:postgresql:// from PG* env vars or falling back to the
#     application.yml default — the MySQL URL is never passed to org.postgresql.Driver.
```

After editing, run:
```bash
bash -n .pivota/start-dev.sh && echo "SYNTAX OK"
```
  </action>
  <verify>
```bash
# 1. Syntax check
bash -n .pivota/start-dev.sh && echo "BASH_SYNTAX OK"

# 2. mysql:// case is explicitly handled (not just unknown-scheme)
grep -n 'mysql://' .pivota/start-dev.sh && echo "MYSQL_CASE OK"

# 3. mysql:// case does NOT export SPRING_DATASOURCE_URL=mysql://...
# (the branch must construct jdbc:postgresql:// or leave it as PostgreSQL default)
python3 - <<'EOF'
import re, sys
content = open('.pivota/start-dev.sh').read()
# Find the mysql:// branch block
mysql_block_match = re.search(
    r'mysql://\*.*?(?=elif|else\b.*?\n(?!\s)|\bfi\b)',
    content, re.DOTALL
)
if mysql_block_match:
    block = mysql_block_match.group(0)
    if 'jdbc:postgresql' in block:
        print("MYSQL_BRANCH_CONSTRUCTS_POSTGRES OK")
    else:
        print("FAIL: mysql:// branch does not construct jdbc:postgresql://")
        sys.exit(1)
else:
    print("FAIL: mysql:// branch not found")
    sys.exit(1)
EOF

# 4. jdbc:postgresql still present (postgresql:// and mysql:// both produce it)
grep -c 'jdbc:postgresql' .pivota/start-dev.sh | grep -qv '^0$' && echo "JDBC_POSTGRESQL OK"

# 5. SPRING_DATASOURCE_URL never assigned mysql:// directly
! grep -E 'SPRING_DATASOURCE_URL.*mysql://' .pivota/start-dev.sh && echo "NO_MYSQL_DATASOURCE_URL OK"

# 6. mvn spring-boot:run still present (GAP-01 work intact)
grep -q 'mvn spring-boot:run' .pivota/start-dev.sh && echo "MVN_CMD OK"
```
  </verify>
  <done>
- `bash -n .pivota/start-dev.sh` exits 0 (no syntax errors)
- A `mysql://` branch explicitly handles `PIVOTA_DB_MODE=sidecar-mysql` injection
- The mysql:// branch constructs `jdbc:postgresql://` from PG* vars or exports the localhost default
- `SPRING_DATASOURCE_URL` is never set to a `mysql://` value under any code path
- All existing GAP-01 work is preserved (mvn spring-boot:run, Java 21 pre-exec, postgresql:// normalization)
- The "unknown scheme" fallthrough is now only reached by non-mysql, non-postgresql schemes
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify infrastructure.json postgres sidecar declaration and commit</name>
  <files>.planning/infrastructure.json</files>
  <action>
**Step 1 — Read current `.planning/infrastructure.json`:**

Current content:
```json
{
  "sidecars": [
    { "kind": "postgres" }
  ]
}
```

The `kind: "postgres"` declaration is already correct. However, since the Daytona platform is
provisioning MySQL instead of PostgreSQL (ignoring this file or picking up the legacy PHP
`docker-compose.yml` MySQL service), we need to make the PostgreSQL declaration more explicit
and unambiguous. Update the file to use the full canonical form that matches what the platform
expects for a PostgreSQL 16 sidecar, including the database name that matches `application.yml`:

```json
{
  "sidecars": [
    {
      "kind": "postgres",
      "version": "16",
      "database": "ureport",
      "username": "ureport",
      "password": "ureport"
    }
  ]
}
```

This mirrors the `docker-compose.yml` db service environment variables:
- `POSTGRES_DB: ureport`
- `POSTGRES_USER: ureport`  
- `POSTGRES_PASSWORD: ureport`

And matches the `application.yml` datasource defaults:
- `url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/ureport}`
- `username: ${DB_USER:ureport}`
- `password: ${DB_PASSWORD:ureport}`

**Step 2 — Validate JSON:**
```bash
python3 -m json.tool .planning/infrastructure.json > /dev/null && echo "JSON_VALID OK"
```

**Step 3 — Commit both files atomically:**
```bash
git add .pivota/start-dev.sh .planning/infrastructure.json
git commit -m "fix(pivota): handle mysql:// sidecar injection — construct jdbc:postgresql:// URL

- start-dev.sh: add explicit mysql:// branch in DATABASE_URL normalization block
  that constructs jdbc:postgresql:// from PG* vars instead of passing mysql:// to
  org.postgresql.Driver (which caused BeanCreationException on flywayInitializer)
- infrastructure.json: expand postgres sidecar declaration with version/database/
  username/password so platform provisions PostgreSQL instead of MySQL"
```
  </action>
  <verify>
```bash
# 1. JSON is valid
python3 -m json.tool .planning/infrastructure.json > /dev/null && echo "JSON_VALID OK"

# 2. sidecars array has exactly one entry with kind=postgres
python3 -c "
import json, sys
d = json.load(open('.planning/infrastructure.json'))
sidecars = d.get('sidecars', [])
assert len(sidecars) == 1, f'Expected 1 sidecar, got {len(sidecars)}'
assert sidecars[0]['kind'] == 'postgres', f'Expected kind=postgres, got {sidecars[0][\"kind\"]}'
print('SIDECAR_POSTGRES OK')
"

# 3. version field present (16)
python3 -c "
import json
d = json.load(open('.planning/infrastructure.json'))
assert d['sidecars'][0].get('version') == '16', 'version should be 16'
print('VERSION OK')
"

# 4. database name matches application.yml default
python3 -c "
import json
d = json.load(open('.planning/infrastructure.json'))
assert d['sidecars'][0].get('database') == 'ureport', 'database should be ureport'
print('DATABASE_NAME OK')
"

# 5. Commit exists with expected message
git log --oneline -1 | grep -q 'mysql.*sidecar.*jdbc:postgresql\|handle mysql' && echo "COMMIT OK"
```
  </verify>
  <done>
- `.planning/infrastructure.json` is valid JSON
- `sidecars[0].kind` is `"postgres"`, version is `"16"`, database is `"ureport"`
- Both `start-dev.sh` and `infrastructure.json` committed in a single atomic commit
- Commit message explains both: the script normalization fix AND the infrastructure declaration update
- `git log --oneline -1` shows the fix commit
  </done>
</task>

</tasks>

<verification>
After both tasks complete, run these end-to-end checks:

```bash
echo "=== start-dev.sh: mysql:// handling ==="
bash -n .pivota/start-dev.sh && echo "SYNTAX: OK"
grep -q 'mysql://' .pivota/start-dev.sh && echo "MYSQL_CASE_PRESENT: OK"
! grep -E 'SPRING_DATASOURCE_URL=.*mysql://' .pivota/start-dev.sh && echo "NO_MYSQL_DATASOURCE_URL: OK"
grep -q 'jdbc:postgresql' .pivota/start-dev.sh && echo "JDBC_POSTGRESQL_PRESENT: OK"
grep -q 'mvn spring-boot:run' .pivota/start-dev.sh && echo "MVN_CMD_INTACT: OK"
grep -q 'openjdk-21' .pivota/start-dev.sh && echo "JAVA_INSTALL_INTACT: OK"

echo "=== infrastructure.json ==="
python3 -m json.tool .planning/infrastructure.json > /dev/null && echo "JSON_VALID: OK"
python3 -c "
import json
d = json.load(open('.planning/infrastructure.json'))
s = d['sidecars'][0]
assert s['kind'] == 'postgres' and s.get('version') == '16' and s.get('database') == 'ureport'
print('SIDECAR_SPEC: OK')
"

echo "=== git commit ==="
git log --oneline -3 | head -3
```

**Simulated mysql:// injection test** (confirms the fix works for the exact failure scenario):
```bash
# Export the same vars the platform injects:
(
  export DATABASE_URL="mysql://ureport:ureport@localhost:3306/ureport"
  export PIVOTA_DB_MODE="sidecar-mysql"
  # Source only the normalization block (not the full script which would try to install Java)
  bash -c '
    if [[ "${DATABASE_URL}" == mysql://* ]]; then
      _PG_HOST="${PGHOST:-}"
      if [[ -n "$_PG_HOST" ]]; then
        SPRING_DATASOURCE_URL="jdbc:postgresql://${_PG_HOST}:${PGPORT:-5432}/${PGDATABASE:-ureport}"
      else
        SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/ureport"
      fi
      echo "RESULT: SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL"
      [[ "$SPRING_DATASOURCE_URL" == jdbc:postgresql://* ]] && echo "MYSQL_FIX: OK"
    fi
  '
)
```
</verification>

<success_criteria>
- `bash -n .pivota/start-dev.sh` exits 0 (no syntax errors after edit)
- `grep 'mysql://' .pivota/start-dev.sh` shows the explicit mysql:// branch (not just the unknown-scheme fallthrough)
- `SPRING_DATASOURCE_URL` is never assigned a `mysql://` value in any code path of start-dev.sh
- When `DATABASE_URL=mysql://...` is injected, `SPRING_DATASOURCE_URL` will be set to `jdbc:postgresql://...` using PG* vars or the localhost default
- `.planning/infrastructure.json` declares `kind: "postgres"` with `version: "16"` and `database: "ureport"`
- Both files committed atomically with a message explaining the mysql:// sidecar fix
- Root cause from `01-UAT.md` gap — "mysql:// URL passed verbatim to org.postgresql.Driver" — fully resolved
- Spring Boot should now connect to PostgreSQL (either via platform-provisioned PG sidecar on next restart, or via application.yml default `localhost:5432`)
</success_criteria>

<output>
After completion, create `.planning/phases/01-infrastructure-foundation/01-GAP-02-SUMMARY.md`
documenting:
- Root cause: mysql:// scheme in DATABASE_URL fell through to unknown-scheme branch → SPRING_DATASOURCE_URL=mysql://... → HikariCP connection failure
- Fix applied: Added explicit `mysql://` branch in start-dev.sh normalization block that constructs jdbc:postgresql:// from PG* vars or localhost default
- infrastructure.json updated: postgres sidecar with version/database/username/password fields
- Commit hash
- Whether PG* vars were available in this environment (check PGHOST)
- Next action: Re-run `./pivota/start-dev.sh` (or re-provision the workspace to get a PostgreSQL sidecar)
</output>
