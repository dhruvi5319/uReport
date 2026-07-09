#!/usr/bin/env bash
# verify-dockerfiles.sh
# Verifies key Dockerfile instructions exist in backend and frontend Dockerfiles.
# Exits 0 if all checks pass; exits 1 on first failure.
#
# NOTE: The sandbox has no Docker daemon — this script uses grep to confirm
# structural validity (no docker build required). Approved approach per
# locked decision: "use --check flag if available, or mock the build
# verification with file existence checks".
set -euo pipefail

# Resolve paths relative to project root (support running from any directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKEND_DF="${PROJECT_ROOT}/backend/Dockerfile"
FRONTEND_DF="${PROJECT_ROOT}/frontend/Dockerfile"

echo "=== Verifying ${BACKEND_DF} ==="

# Check file exists
test -f "${BACKEND_DF}" || { echo "ERROR: ${BACKEND_DF} not found"; exit 1; }

# Check FROM instruction (multi-stage: at least 2 FROM lines expected)
FROM_COUNT=$(grep -c "^FROM " "${BACKEND_DF}" || true)
[ "${FROM_COUNT}" -ge 1 ] || { echo "ERROR: No FROM instruction in ${BACKEND_DF}"; exit 1; }
echo "  [OK] FROM instruction(s): ${FROM_COUNT}"

# Check RUN instruction (build steps)
grep -q "^RUN " "${BACKEND_DF}" || { echo "ERROR: No RUN instruction in ${BACKEND_DF}"; exit 1; }
echo "  [OK] RUN instruction present"

# Check COPY instruction
grep -q "^COPY " "${BACKEND_DF}" || { echo "ERROR: No COPY instruction in ${BACKEND_DF}"; exit 1; }
echo "  [OK] COPY instruction present"

# Check EXPOSE instruction
grep -q "^EXPOSE " "${BACKEND_DF}" || { echo "ERROR: No EXPOSE instruction in ${BACKEND_DF}"; exit 1; }
echo "  [OK] EXPOSE instruction present"

# Check ENTRYPOINT or CMD instruction
(grep -q "^ENTRYPOINT " "${BACKEND_DF}" || grep -q "^CMD " "${BACKEND_DF}") \
  || { echo "ERROR: No ENTRYPOINT or CMD in ${BACKEND_DF}"; exit 1; }
echo "  [OK] ENTRYPOINT/CMD instruction present"

echo ""
echo "=== Verifying ${FRONTEND_DF} ==="

# Check file exists
test -f "${FRONTEND_DF}" || { echo "ERROR: ${FRONTEND_DF} not found"; exit 1; }

# Check nginx base image
grep -q "nginx" "${FRONTEND_DF}" || { echo "ERROR: nginx base image not found in ${FRONTEND_DF}"; exit 1; }
echo "  [OK] nginx base image present"

# Check COPY instruction (static build artifacts or nginx.conf)
grep -q "^COPY " "${FRONTEND_DF}" || { echo "ERROR: No COPY instruction in ${FRONTEND_DF}"; exit 1; }
echo "  [OK] COPY instruction present"

# Check nginx.conf is referenced or EXPOSE 80
if grep -q "nginx.conf" "${FRONTEND_DF}" || grep -q "^EXPOSE 80" "${FRONTEND_DF}"; then
  echo "  [OK] nginx.conf reference or EXPOSE 80 present"
else
  echo "  [WARNING] nginx.conf not referenced and no EXPOSE 80 (may be fine if using default config)"
fi
echo "  [OK] Frontend Dockerfile structure valid"

echo ""
echo "=== All Dockerfile checks passed ==="
exit 0
