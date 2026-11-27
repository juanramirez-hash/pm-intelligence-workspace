// NAV-002B: migration 041 retires the legacy roles analyst and viewer.
// Structure of the SQL (guard first, CHECK, DELETE), its rollback, and that
// the application no longer accepts those roles.

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import { createSettingsUsersRouter } from '../../server/routes/settingsUsers.js'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const compact = (sql: string) => sql.replace(/\s+/g, ' ').trim()
// SQL statements only (comment lines removed).
const statementsOf = (sql: string) => compact(sql.replace(/^\s*--.*$/gm, ''))

const migration = statementsOf(read('../../server/migrations/041_remove_legacy_roles.sql'))
const rollback = statementsOf(read('../../server/migrations/rollback/041_remove_legacy_roles.rollback.sql'))

const rolesOf = (sql: string, marker: string) => {
  const block = new RegExp(`${marker} CHECK \\( role = ANY \\( ARRAY\\[ ([^\\]]+) \\] \\) \\)`).exec(sql)?.[1] ?? ''

  return block.match(/'([a-z]+)'::text/g)?.map((value) => value.split("'")[1])
}

describe('NAV-002B migration 041', () => {
  it('fails with a clear message before changing anything when analyst or viewer have users', () => {
    const guard = migration.indexOf('DO $$')
    const raise = migration.indexOf('RAISE EXCEPTION')
    const firstChange = Math.min(
      migration.indexOf('DROP CONSTRAINT'),
      migration.indexOf('ADD CONSTRAINT'),
      migration.indexOf('DELETE FROM app_roles'),
    )

    expect(guard).toBeGreaterThan(0)
    expect(raise).toBeGreaterThan(guard)
    // The guard comes first: nothing is changed before it runs.
    expect(firstChange).toBeGreaterThan(raise)
    expect(migration).toContain("WHERE role IN ('analyst', 'viewer')")
    expect(migration).toContain('IF remaining IS NOT NULL THEN')
    expect(migration).toMatch(/RAISE EXCEPTION 'No se pueden retirar los roles analyst y viewer: todavía tienen usuarios \(%\)\./)
    expect(migration).toContain('Pasa esos usuarios a otro rol en Configuración')
    // One transaction: the exception reverts everything.
    expect(migration.startsWith('BEGIN;')).toBe(true)
    expect(migration.trim().endsWith('COMMIT;')).toBe(true)
  })

  it('leaves the CHECK with only admin, manager, pm, engineering and assistant', () => {
    expect(rolesOf(migration, 'ADD CONSTRAINT app_users_role_check')).toEqual([
      'admin', 'manager', 'pm', 'engineering', 'assistant',
    ])
  })

  it('deletes analyst and viewer from app_roles, only those', () => {
    expect(migration).toContain("DELETE FROM app_roles WHERE role_key IN ('analyst', 'viewer');")
    expect(migration.match(/DELETE FROM/g)).toHaveLength(1)
  })

  it('touches no data, no user and not the pricing scope', () => {
    expect(migration).not.toMatch(/INSERT INTO|UPDATE app_users|data_cache_version =|DROP TABLE|CASCADE/)
    expect(migration).not.toContain("'pricing'")
  })

  it('needs no startup schema requirement (it adds no table nor column)', async () => {
    const { REQUIRED_SCHEMA } = await import('../../server/db/schemaCheck.js')

    expect(REQUIRED_SCHEMA.some((item: { migration: string }) => item.migration === '041')).toBe(false)
  })
})

describe('NAV-002B rollback 041', () => {
  it('restores the CHECK with the 7 roles', () => {
    expect(rolesOf(rollback, 'ADD CONSTRAINT app_users_role_check')).toEqual([
      'admin', 'analyst', 'viewer', 'manager', 'pm', 'engineering', 'assistant',
    ])
  })

  it('restores both roles with the values of migration 028', () => {
    const original = statementsOf(read('../../server/migrations/028_app_roles.sql'))
    const row = (roleKey: string, source: string) =>
      new RegExp(`\\( '${roleKey}', '[^']+', '[^']+', '[a-z]+', (?:TRUE|FALSE), TRUE, TRUE \\)`).exec(source)?.[0]

    for (const roleKey of ['analyst', 'viewer']) {
      expect(row(roleKey, rollback)).toBeDefined()
      expect(row(roleKey, rollback)).toBe(row(roleKey, original))
    }

    expect(rollback).toContain('ON CONFLICT (role_key) DO NOTHING;')
  })

  it('tells to apply it before the rollback of 040, which moves assistants to analyst', () => {
    const raw = read('../../server/migrations/rollback/041_remove_legacy_roles.rollback.sql')

    expect(raw).toContain('aplica ESTE rollback')
    expect(raw).toContain('040')
    expect(rollback).not.toMatch(/CASCADE/i)
  })
})

describe('NAV-002B the application no longer accepts analyst nor viewer', () => {
  function buildResponse() {
    const res = { status: vi.fn(), json: vi.fn() }

    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)

    return res
  }

  type Handler = (req: unknown, res: ReturnType<typeof buildResponse>) => Promise<unknown>

  async function call(method: 'post' | 'patch', path: string, req: Record<string, unknown>) {
    const query = vi.fn(async () => ({ rows: [], rowCount: 0 }))
    const pool = { query, connect: vi.fn(async () => ({ query, release: vi.fn() })) }
    const router = createSettingsUsersRouter(pool) as unknown as {
      stack: Array<{ route?: { path: string, methods: Record<string, boolean>, stack: Array<{ handle: Handler }> } }>
    }
    const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])?.route
    const res = buildResponse()

    await route!.stack[0]!.handle({ authUser: { id: 1, role: 'admin' }, ...req }, res)

    return { res, query }
  }

  it.each(['analyst', 'viewer'])('rejects %s when creating a user', async (role) => {
    const { res, query } = await call('post', '/', { body: { email: 'nuevo@example.test', name: 'Nuevo', role } })

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({ error: 'Role is not valid' })
    expect(query).not.toHaveBeenCalled()
  })

  it.each(['analyst', 'viewer'])('rejects %s when changing a role', async (role) => {
    const { res, query } = await call('patch', '/:id', { params: { id: '5' }, body: { role } })

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({ error: 'Role is not valid' })
    expect(query).not.toHaveBeenCalled()
  })

  it('offers only the five current roles in Configuración', () => {
    const routes = read('../../server/routes/settingsUsers.js')
    const allowed = /const ALLOWED_ROLES =\s*new Set\(\[([\s\S]*?)\]\)/.exec(routes)?.[1] ?? ''

    expect(allowed.match(/'([a-z]+)'|ASSISTANT_ROLE/g)).toEqual(["'admin'", "'manager'", "'pm'", "'engineering'", 'ASSISTANT_ROLE'])

    const page = read('../../src/features/settings/SettingsPage.tsx')
    const roleOptions = /const roleOptions: Array<\{[\s\S]*?\}> = \[([\s\S]*?)\n  \]/.exec(page)?.[1] ?? ''

    expect(roleOptions.match(/value: '([a-z]+)'/g)).toEqual([
      "value: 'admin'", "value: 'manager'", "value: 'pm'", "value: 'engineering'", "value: 'assistant'",
    ])
    expect(page).not.toMatch(/Legacy|'viewer'|'analyst'/)
  })

  it('removes the legacy scope from the role scopes', () => {
    expect(read('../../server/routes/settingsRoles.js')).not.toMatch(/^\s*'legacy',/m)
    expect(read('../../src/features/settings/settingsRolesRepository.ts')).not.toContain("'legacy'")
    expect(read('../../src/features/auth/authTypes.ts')).not.toMatch(/\|\s*'legacy'/)
  })
})
