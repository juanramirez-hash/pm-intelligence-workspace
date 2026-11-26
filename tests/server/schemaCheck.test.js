import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  REQUIRED_SCHEMA,
  assertSchemaOrExit,
  buildMissingSchemaSql,
} from '../../server/db/schemaCheck.js'

function connectionRefused() {
  return Object.assign(
    new Error('connect ECONNREFUSED 127.0.0.1:5432'),
    { code: 'ECONNREFUSED' },
  )
}

function buildLogger() {
  return {
    error: vi.fn(),
    warn: vi.fn(),
  }
}

async function runCheck(pool) {
  const exit = vi.fn()
  const sleep = vi.fn(async () => {})
  const logger = buildLogger()
  const started = await assertSchemaOrExit(pool, {
    exit,
    sleep,
    logger,
  })

  return {
    started,
    exit,
    sleep,
    logger,
  }
}

describe('startup schema check (OPS-001)', () => {
  it('lists every required migration in one query', () => {
    const sql = buildMissingSchemaSql()

    expect(REQUIRED_SCHEMA).toEqual(
      expect.arrayContaining([
        { migration: '036', table: 'data_cache_version' },
        {
          migration: '037',
          table: 'app_roles',
          column: 'cost_access',
        },
      ]),
    )
    expect(sql).toContain("('036', 'data_cache_version', NULL::TEXT)")
    expect(sql).toContain("('037', 'app_roles', 'cost_access')")
    expect(sql).toContain('information_schema.columns')
  })

  it('requires the MD-002 inventory columns of migration 038', () => {
    const sql = buildMissingSchemaSql()

    for (const table of ['inventory_snapshots', 'inventory_import_staging']) {
      for (const column of ['catalog_status', 'last_sale_date']) {
        expect(REQUIRED_SCHEMA).toContainEqual({ migration: '038', table, column })
        expect(sql).toContain(`('038', '${table}', '${column}')`)
      }
    }
  })

  it('requires the MD-002-HOTFIX1 inventory_items table of migration 039', () => {
    expect(REQUIRED_SCHEMA).toContainEqual({ migration: '039', table: 'inventory_items' })
    expect(buildMissingSchemaSql()).toContain("('039', 'inventory_items', NULL::TEXT)")
  })

  it('rejects requirements that are not plain identifiers', () => {
    expect(() =>
      buildMissingSchemaSql([
        { migration: '038', table: "app_roles'; DROP TABLE x; --" },
      ]),
    ).toThrow('Invalid schema requirement')
  })

  it('starts when the schema is complete', async () => {
    const pool = {
      query: vi.fn(async () => ({ rows: [] })),
    }
    const { started, exit, logger } = await runCheck(pool)

    expect(started).toBe(true)
    expect(exit).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
    expect(pool.query).toHaveBeenCalledTimes(1)
  })

  it('exits with the missing migration and does not retry', async () => {
    const pool = {
      query: vi.fn(async () => ({
        rows: [
          {
            message:
              'Falta la migración 037: app_roles.cost_access',
          },
        ],
      })),
    }
    const { started, exit, sleep, logger } = await runCheck(pool)

    expect(started).toBe(false)
    expect(logger.error).toHaveBeenCalledWith(
      'Falta la migración 037: app_roles.cost_access',
    )
    expect(exit).toHaveBeenCalledWith(1)
    expect(pool.query).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('waits for PostgreSQL and starts when it answers on the third attempt', async () => {
    const pool = {
      query: vi
        .fn()
        .mockRejectedValueOnce(connectionRefused())
        .mockRejectedValueOnce(connectionRefused())
        .mockResolvedValueOnce({ rows: [] }),
    }
    const { started, exit, sleep, logger } = await runCheck(pool)

    expect(started).toBe(true)
    expect(exit).not.toHaveBeenCalled()
    expect(pool.query).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(5000)
    expect(logger.warn.mock.calls.map(([message]) => message)).toEqual([
      'Esperando a PostgreSQL… intento 1/24',
      'Esperando a PostgreSQL… intento 2/24',
    ])
  })

  it('exits after 24 attempts when PostgreSQL never answers', async () => {
    const pool = {
      query: vi.fn(async () => {
        throw connectionRefused()
      }),
    }
    const { started, exit, sleep, logger } = await runCheck(pool)

    expect(started).toBe(false)
    expect(pool.query).toHaveBeenCalledTimes(24)
    expect(sleep).toHaveBeenCalledTimes(23)
    expect(logger.error).toHaveBeenCalledWith(
      'No se pudo verificar el esquema: connect ECONNREFUSED 127.0.0.1:5432',
    )
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('does not retry errors that are not connection errors', async () => {
    const pool = {
      query: vi.fn(async () => {
        throw Object.assign(
          new Error('permission denied for schema information_schema'),
          { code: '42501' },
        )
      }),
    }
    const { exit, sleep, logger } = await runCheck(pool)

    expect(pool.query).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith(
      'No se pudo verificar el esquema: permission denied for schema information_schema',
    )
    expect(exit).toHaveBeenCalledWith(1)
  })
})
