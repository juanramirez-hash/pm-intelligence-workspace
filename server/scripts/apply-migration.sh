#!/usr/bin/env bash
# Applies one migration in production with a verified backup (OPS-001).
#
# Usage (from the repository, as the nexus user):
#   bash server/scripts/apply-migration.sh server/migrations/NNN_descripcion.sql
#
# - Backs up pm_intelligence_db with pg_dump as postgres into
#   ~/respaldos/pm_intelligence_db_pre_<NNN>_<fecha>.dump and stops if the
#   backup is smaller than 1 MB.
# - Applies the migration as postgres (app_users, app_roles and
#   app_user_brand_assignments belong to postgres) in a single transaction.
# - Lists the schema requirements of server/db/schemaCheck.js that are
#   still missing.
# - Does not restart the backend.

set -euo pipefail

DATABASE="pm_intelligence_db"
BACKUP_DIR="${HOME}/respaldos"
MIN_BACKUP_BYTES=$((1024 * 1024))
SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

if [[ $# -ne 1 ]]; then
  fail "Uso: bash server/scripts/apply-migration.sh server/migrations/NNN_descripcion.sql"
fi

MIGRATION_FILE="$1"
MIGRATION_NAME="$(basename "${MIGRATION_FILE}")"

[[ -f "${MIGRATION_FILE}" ]] ||
  fail "No existe el archivo de migración: ${MIGRATION_FILE}"

[[ "${MIGRATION_NAME}" =~ ^([0-9]{3})_.+\.sql$ ]] ||
  fail "El archivo debe llamarse NNN_descripcion.sql: ${MIGRATION_NAME}"

MIGRATION_NUMBER="${BASH_REMATCH[1]}"
BACKUP_FILE="${BACKUP_DIR}/${DATABASE}_pre_${MIGRATION_NUMBER}_$(date +%Y%m%d_%H%M%S).dump"

umask 077
mkdir -p "${BACKUP_DIR}"

echo "1/3 Respaldo de ${DATABASE} en ${BACKUP_FILE}"

# The redirection runs as nexus, so the dump belongs to nexus with mode 600.
if ! sudo -u postgres pg_dump -Fc "${DATABASE}" > "${BACKUP_FILE}"; then
  fail "pg_dump falló. No se aplicó la migración."
fi

BACKUP_BYTES="$(stat -c %s "${BACKUP_FILE}")"

if (( BACKUP_BYTES < MIN_BACKUP_BYTES )); then
  fail "El respaldo pesa ${BACKUP_BYTES} bytes (mínimo ${MIN_BACKUP_BYTES}). Revisa pg_dump. No se aplicó la migración."
fi

echo "    Respaldo correcto: ${BACKUP_BYTES} bytes"

echo "2/3 Aplicando ${MIGRATION_NAME}"

if ! sudo -u postgres psql -d "${DATABASE}" -v ON_ERROR_STOP=1 -1 < "${MIGRATION_FILE}"; then
  fail "La migración ${MIGRATION_NAME} falló y se revirtió completa. Respaldo previo: ${BACKUP_FILE}. No reinicies el backend."
fi

echo "3/3 Requisitos de esquema del backend"

if MISSING_SQL="$(node --input-type=module -e \
  'const { pathToFileURL } = await import("node:url"); const schema = await import(pathToFileURL(process.argv[1]).href); process.stdout.write(schema.buildMissingSchemaSql())' \
  "${SERVER_DIR}/db/schemaCheck.js" 2>/dev/null)"; then
  MISSING="$(sudo -u postgres psql -d "${DATABASE}" -v ON_ERROR_STOP=1 -At -c "${MISSING_SQL}")"

  if [[ -n "${MISSING}" ]]; then
    echo "    Siguen faltando (el backend no arrancará hasta aplicarlas):"
    echo "${MISSING}" | sed 's/^/    - /'
  else
    echo "    Esquema completo para el código actual."
  fi
else
  echo "    No se pudo leer server/db/schemaCheck.js; revisa el log del backend al reiniciar."
fi

echo "Migración aplicada. Ahora reinicia: sudo systemctl restart pm-intelligence-api"
