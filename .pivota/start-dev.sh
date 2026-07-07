#!/usr/bin/env bash
# Dev server for uReport backend — Spring Boot only (no Docker in this sandbox)
# Sandbox facts: runs as root (no sudo needed), apt-get installs Java 21 + Maven if absent
#
# Edits ABOVE the END PIVOTA PREAMBLE marker are reset on regen.
# Edits BELOW the marker are preserved on regen.

set -euo pipefail

# === Bash version guard ===
if (( BASH_VERSINFO[0] < 4 )) || { (( BASH_VERSINFO[0] == 4 )) && (( BASH_VERSINFO[1] < 3 )); }; then
  echo "[pivota] bash 4.3+ required; found ${BASH_VERSION}" >&2
  exit 127
fi

# === Tee all output to log file ===
mkdir -p /tmp
exec > >(tee -a /tmp/pivota-dev.log) 2>&1
echo "[pivota] $(date -Iseconds) start-dev.sh begin"

# === Install Java 21 if absent (root has direct apt-get access — no sudo) ===
if ! command -v java >/dev/null 2>&1; then
  echo "[pivota] Java not found; installing openjdk-21-jdk-headless (~2min)"
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openjdk-21-jdk-headless
fi

# === Detect / set JAVA_HOME ===
# Resolve JAVA_HOME from the java binary on PATH after install.
if command -v java >/dev/null 2>&1; then
  JAVA_HOME=$(readlink -f "$(command -v java)" 2>/dev/null | sed -E "s%/bin/java$%%")
  export JAVA_HOME
  export PATH="${JAVA_HOME}/bin:${PATH}"
  echo "[pivota] JAVA_HOME=${JAVA_HOME}"
else
  echo "[pivota] ERROR: java not found even after install attempt" >&2
  exit 1
fi

# === Install Maven if absent (root has direct apt-get access — no sudo) ===
if ! command -v mvn >/dev/null 2>&1; then
  echo "[pivota] installing Maven (one-time, ~30s)"
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq maven
fi
echo "[pivota] Maven: $(mvn --version 2>/dev/null | head -1)"

# === Seed JWT_SECRET default for dev (required by application.yml) ===
# application-dev.yml supplies a default, but set the env var here as belt-and-braces
export JWT_SECRET="${JWT_SECRET:-dev-secret-32-characters-minimum-for-hs256}"

# === Start Spring Boot backend with dev profile ===
echo "[pivota] starting Spring Boot backend (spring.profiles.active=dev) on port 8080"
cd backend
exec mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.jvmArguments="-DJWT_SECRET=${JWT_SECRET}"
# === END PIVOTA PREAMBLE ===
