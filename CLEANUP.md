# Legacy Code Cleanup

## Deletion Gate

The legacy PHP/MySQL/Solr directories MUST NOT be deleted until all of the following
verification gates pass:

1. **Docker Compose stack starts cleanly:**
   ```bash
   docker compose up -d && docker compose ps
   # All 4 services must show 'running' or 'healthy' status
   ```

2. **Spring Boot tests pass (including Open311 fixture tests):**
   ```bash
   mvn -f api/pom.xml test 2>&1 | grep -E 'BUILD|Tests run|FAIL|ERROR'
   # Required: BUILD SUCCESS, 0 failures, 0 errors
   ```

3. **FTS corpus tests pass:**
   ```bash
   mvn -f api/pom.xml test -Dtest=FtsEquivalenceTest 2>&1 | tail -10
   # Required: BUILD SUCCESS
   ```

4. **Open311 fixture tests pass:**
   ```bash
   mvn -f api/pom.xml test -Dtest=Open311FixtureTest 2>&1 | tail -10
   # Required: BUILD SUCCESS
   ```

5. **Playwright E2E smoke tests pass:**
   ```bash
   npx playwright test e2e/journeys.spec.ts --reporter=list 2>&1 | tail -30
   # Required: 0 failed tests
   ```

## Deletion Commands

After ALL gates above pass, execute:

```bash
# Remove legacy PHP application
rm -rf crm/

# Remove Ansible deployment scripts
rm -rf ansible/

# Remove PHP-specific infrastructure configuration
rm -rf infra/

# Verify only new stack files remain
ls -la
# Expected: db/, api/, web/, e2e/, project_specs/, CLEANUP.md, docker-compose.yml, etc.
# Expected gone: crm/, ansible/, infra/
```

## Verification After Deletion

```bash
# Confirm the new stack still works after legacy removal
docker compose down && docker compose up -d && docker compose ps
# Expected: all 4 services healthy

# Confirm no source file references legacy paths
grep -r "crm/" api/src/ web/src/ 2>/dev/null | grep -v ".git"
# Expected: no matches (new code must not reference deleted legacy paths)
```

## Notes

- The `docker-compose.yml` no longer references `crm/`, `ansible/`, or `infra/`.
- The `./db/init/` scripts replace `crm/scripts/mysql.sql` as the database source of truth.
- The legacy MySQL schema in `crm/scripts/mysql.sql` was the reference for PostgreSQL DDL in Wave 1.
- After deletion, the FRD, TechArch, and PRD in `project_specs/` remain as the authoritative specification.
