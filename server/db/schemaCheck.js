// Startup schema check (OPS-001). The backend must not start when a
// migration it depends on is missing: on 13 Nov 2026 migration 037 was not
// applied, the new code was started anyway and every /api/auth/me answered
// 500.
//
// Each migration that adds a table or column the code reads adds it here.
// The same query is used by server/scripts/apply-migration.sh.
//
// information_schema only lists objects the connected user has some
// privilege on; the application user reads all of these.

export const REQUIRED_SCHEMA = [
  {
    migration: '036',
    table: 'data_cache_version',
  },
  {
    migration: '037',
    table: 'app_roles',
    column: 'cost_access',
  },
]

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/

function sqlLiteral(value) {
  if (value === undefined || value === null) {
    return 'NULL::TEXT'
  }

  if (!IDENTIFIER.test(value) && !/^[0-9]{3}$/.test(value)) {
    throw new Error(`Invalid schema requirement: ${value}`)
  }

  return `'${value}'`
}

/**
 * One row per missing requirement, with its log message:
 * "Falta la migración 037: app_roles.cost_access".
 */
export function buildMissingSchemaSql(
  requirements = REQUIRED_SCHEMA,
) {
  const rows = requirements
    .map(
      ({ migration, table, column }) =>
        `(${sqlLiteral(migration)}, ${sqlLiteral(table)}, ${sqlLiteral(column)})`,
    )
    .join(',\n      ')

  return `
    SELECT
      'Falta la migración ' || required.migration || ': ' ||
        CASE
          WHEN required.column_name IS NULL
            THEN 'tabla ' || required.table_name
          ELSE required.table_name || '.' || required.column_name
        END AS message
    FROM (
      VALUES
      ${rows}
    ) AS required (migration, table_name, column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns existing
      WHERE
        existing.table_schema = 'public'
        AND existing.table_name = required.table_name
        AND (
          required.column_name IS NULL
          OR existing.column_name = required.column_name
        )
    )
    ORDER BY required.migration, required.table_name
  `
}

export async function findMissingSchema(pool) {
  const result = await pool.query(
    buildMissingSchemaSql(),
  )

  return result.rows.map((row) => row.message)
}

const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  // PostgreSQL: connection exceptions and "the database system is starting up".
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '57P03',
])

export function isConnectionError(error) {
  if (CONNECTION_ERROR_CODES.has(error?.code)) {
    return true
  }

  const message = String(error?.message ?? '')

  return /timeout|Connection terminated/i.test(message)
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

/**
 * Resolves true when the schema is complete. Otherwise logs the reason and
 * exits with code 1:
 * - incomplete schema: one message per missing migration, no retries;
 * - database not reachable: retries every 5 s up to 24 times (about two
 *   minutes), so a server reboot does not leave the service failed when
 *   PostgreSQL starts after the backend.
 */
export async function assertSchemaOrExit(
  pool,
  {
    attempts = 24,
    delayMs = 5000,
    sleep = wait,
    exit = (code) => process.exit(code),
    logger = console,
  } = {},
) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let missing

    try {
      missing = await findMissingSchema(pool)
    } catch (error) {
      // Only an unreachable database is retried.
      if (
        !isConnectionError(error) ||
        attempt === attempts
      ) {
        logger.error(
          `No se pudo verificar el esquema: ${error?.message ?? error}`,
        )
        exit(1)
        return false
      }

      logger.warn(
        `Esperando a PostgreSQL… intento ${attempt}/${attempts}`,
      )
      await sleep(delayMs)
      continue
    }

    if (missing.length > 0) {
      for (const message of missing) {
        logger.error(message)
      }

      exit(1)
      return false
    }

    return true
  }

  return false
}
