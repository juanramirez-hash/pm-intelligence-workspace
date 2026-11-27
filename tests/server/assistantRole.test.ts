// NAV-002: "Auxiliar" role linked to its PMs: migration 040, effective brands
// of the authenticated user, brand scope, costs, "Mi día" and Acciones.

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import { REQUIRED_SCHEMA } from '../../server/db/schemaCheck.js'
import { loadAuthenticatedUser } from '../../server/middleware/loadAuthenticatedUser.js'
import {
  buildCostVisibilityCondition,
  requireBrandScope,
  resolveCostScope,
} from '../../server/middleware/requireBrandScope.js'
import { resolveMyDayBrandSource } from '../../server/routes/myDay.js'
import { addActionComment, canModifyAction } from '../../server/services/actionService.js'
import { effectiveBrandIdsSql } from '../../server/services/effectiveBrands.js'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const compact = (sql: string) => sql.replace(/\s+/g, ' ').trim()
// SQL statements only (comment lines removed).
const statementsOf = (sql: string) => compact(sql.replace(/^\s*--.*$/gm, ''))

const ASSISTANT = {
  id: 5,
  email: 'aux@example.test',
  name: 'Auxiliar',
  role: 'assistant',
  roleName: 'Auxiliar',
  scope: 'assigned',
  writeAccess: true,
  costAccess: false,
  brandIds: ['HIKVISION', 'UNV (UNIVIEW)'],
}

describe('NAV-002 migration 040', () => {
  const migration = statementsOf(read('../../server/migrations/040_assistant_role.sql'))
  const rollback = statementsOf(read('../../server/migrations/rollback/040_assistant_role.rollback.sql'))

  it('creates the Auxiliar role with assigned scope, write access and no costs', () => {
    expect(migration).toMatch(/^.*BEGIN;/)
    expect(migration).toMatch(/INSERT INTO app_roles \( role_key, role_name, description, scope, write_access, cost_access, active, system_role \) VALUES \( 'assistant', 'Auxiliar', '[^']+', 'assigned', TRUE, FALSE, TRUE, FALSE \) ON CONFLICT \(role_key\) DO NOTHING;/)
    expect(migration.trim().endsWith('COMMIT;')).toBe(true)
  })

  it('accepts assistant in the role CHECK, keeping the 6 current roles', () => {
    const check = /ADD CONSTRAINT app_users_role_check CHECK \( role = ANY \( ARRAY\[ ([^\]]+) \] \) \)/.exec(migration)?.[1]

    expect(check?.match(/'([a-z]+)'::text/g)?.map((value) => value.split("'")[1])).toEqual([
      'admin', 'analyst', 'viewer', 'manager', 'pm', 'engineering', 'assistant',
    ])
  })

  it('creates app_user_pm_links with its key, the not-self check, cascades and grants', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.app_user_pm_links')
    expect(migration).toContain('PRIMARY KEY (assistant_user_id, pm_user_id)')
    expect(migration).toContain('CHECK (assistant_user_id <> pm_user_id)')
    expect(migration.match(/REFERENCES app_users\(id\) ON DELETE CASCADE/g)).toHaveLength(2)
    expect(migration).toContain('GRANT SELECT, INSERT, DELETE ON TABLE public.app_user_pm_links TO pm_intelligence;')
    // No user data and no business data.
    expect(migration).not.toMatch(/INSERT INTO app_user_pm_links|INSERT INTO app_users|data_cache_version =/)
  })

  it('requires the table at startup', () => {
    expect(REQUIRED_SCHEMA).toContainEqual({ migration: '040', table: 'app_user_pm_links' })
  })

  it('rolls back moving assistants to analyst, restoring the CHECK, without CASCADE', () => {
    const order = [
      "UPDATE app_users SET role = 'analyst' WHERE role = 'assistant';",
      'DROP CONSTRAINT IF EXISTS app_users_role_check;',
      'DROP TABLE IF EXISTS public.app_user_pm_links;',
      "DELETE FROM app_roles WHERE role_key = 'assistant';",
    ].map((statement) => rollback.indexOf(statement))

    expect(order.every((index) => index > 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(rollback).not.toMatch(/CASCADE/i)
    expect(rollback).not.toContain("'assistant'::text")
  })
})

describe('NAV-002 effective brands of the authenticated user', () => {
  it('adds, for an assistant only, the brands of its active PMs', () => {
    const sql = compact(effectiveBrandIdsSql('u.id', 'u.role'))

    expect(sql).toContain('FROM app_user_brand_assignments own WHERE own.user_id = u.id UNION')
    expect(sql).toContain("JOIN app_users pm ON pm.id = l.pm_user_id AND pm.active = TRUE AND pm.role = 'pm'")
    expect(sql).toContain('JOIN app_user_brand_assignments inherited ON inherited.user_id = pm.id')
    expect(sql).toContain("WHERE l.assistant_user_id = u.id AND u.role = 'assistant'")
  })

  it('loads brandIds with the inherited brands and keeps the cost access of the role', async () => {
    const pool = {
      query: vi.fn(async () => ({
        rows: [{
          id: 5, email: 'aux@example.test', name: 'Auxiliar', role: 'assistant', active: true,
          role_name: 'Auxiliar', scope: 'assigned', write_access: true, cost_access: false,
          role_active: true, brand_ids: ['HIKVISION', 'UNV (UNIVIEW)'],
        }],
      })),
    }
    const req: { session: { user: { id: number } }, authUser?: unknown } = { session: { user: { id: 5 } } }
    const next = vi.fn()

    await loadAuthenticatedUser(pool)(req, {}, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(compact(String((pool.query.mock.calls[0] as unknown[])[0]))).toContain(compact(effectiveBrandIdsSql('u.id', 'u.role')))
    expect(req.authUser).toEqual(ASSISTANT)
  })

  it('gives an empty list to an assistant without PMs nor own brands', async () => {
    const pool = {
      query: vi.fn(async () => ({
        rows: [{
          id: 5, email: 'aux@example.test', name: null, role: 'assistant', active: true,
          role_name: 'Auxiliar', scope: 'assigned', write_access: true, cost_access: false,
          role_active: true, brand_ids: [],
        }],
      })),
    }
    const req: { session: { user: { id: number } }, authUser?: { brandIds: string[] } } = { session: { user: { id: 5 } } }

    await loadAuthenticatedUser(pool)(req, {}, vi.fn())

    expect(req.authUser?.brandIds).toEqual([])
  })
})

describe('NAV-002 scope, costs and "Mi día" for an assistant', () => {
  function scope(authUser: unknown) {
    const req: { authUser: unknown, brandScope?: unknown } = { authUser }
    const res = { status: vi.fn(), json: vi.fn() }
    const next = vi.fn()

    res.status.mockReturnValue(res)
    requireBrandScope(req, res, next)

    return { req, res, next }
  }

  it('sees the brands of its PMs like a PM with those assignments', () => {
    const { req, next } = scope(ASSISTANT)

    expect(next).toHaveBeenCalledTimes(1)
    expect(req.brandScope).toEqual({ mode: 'assigned', brandKeys: ['HIKVISION', 'UNVUNIVIEW'] })
    expect(resolveMyDayBrandSource(ASSISTANT)).toEqual({ mode: 'assigned', brandKeys: ['HIKVISION', 'UNVUNIVIEW'] })
  })

  it('behaves like a PM without brands when it has none (same 403)', () => {
    const withoutBrands = { ...ASSISTANT, brandIds: [] }
    const { res, next } = scope(withoutBrands)
    const pm = scope({ ...withoutBrands, role: 'pm' })

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json.mock.calls[0]).toEqual(pm.res.json.mock.calls[0])
    expect(resolveMyDayBrandSource(withoutBrands).mode).toBe('none')
  })

  it('cannot use view=all in "Mi día"', () => {
    expect(() => resolveMyDayBrandSource(ASSISTANT, 'all')).toThrow('Vista no permitida')
  })

  it('never sees costs while the role has no cost access', () => {
    const costScope = resolveCostScope(ASSISTANT)

    expect(costScope).toEqual({ mode: 'none' })
    expect(buildCostVisibilityCondition(costScope, 'brand', [])).toBe('FALSE')
    // Configurable later in Configuración: with cost_access only its brands.
    expect(resolveCostScope({ ...ASSISTANT, costAccess: true })).toEqual({
      mode: 'assigned', brandKeys: ['HIKVISION', 'UNVUNIVIEW'],
    })
  })
})

describe('NAV-002 Acciones for an assistant', () => {
  const assistant = { id: 5, role: 'assistant', scope: 'assigned', linkedPmIds: ['7'] }

  it('edits its own actions and those of its linked PMs, no others', () => {
    expect(canModifyAction(assistant, 5)).toBe(true)
    expect(canModifyAction(assistant, 7)).toBe(true)
    expect(canModifyAction(assistant, 8)).toBe(false)
    expect(canModifyAction({ id: 3, role: 'pm', scope: 'assigned', linkedPmIds: [] }, 7)).toBe(false)
    expect(canModifyAction({ id: 1, role: 'admin', scope: 'all', linkedPmIds: [] }, 7)).toBe(true)
  })

  it('comments on an action of a brand inherited from its PM', async () => {
    const query = vi.fn(async (sql: string) => {
      const text = compact(sql)

      if (text.startsWith('SELECT u.id,u.active')) {
        return { rows: [{ id: 5, role: 'assistant', active: true, scope: 'assigned', write_access: true, role_active: true }] }
      }

      if (text.startsWith('SELECT brand_id FROM app_user_brand_assignments WHERE user_id=$1')) {
        return { rows: [] }
      }

      if (text.includes('SELECT inherited.brand_id')) {
        return { rows: [{ brand_id: 'UNV (UNIVIEW)', pm_user_id: 7 }] }
      }

      if (text.includes('SELECT pm.id AS pm_user_id')) {
        return { rows: [{ pm_user_id: 7 }] }
      }

      if (text.startsWith('SELECT * FROM pm_actions')) {
        return { rows: [{ id: 30, brand_id: 'UNV (UNIVIEW)', owner_user_id: 7 }] }
      }

      return { rows: [], rowCount: 1 }
    })
    const pool = { connect: async () => ({ query, release: vi.fn() }) }

    await expect(addActionComment(pool, 30, 5, 'Seguimiento con el cliente')).resolves.toEqual({ actionId: 30 })

    const inherited = query.mock.calls.find(([sql]) => String(sql).includes('SELECT inherited.brand_id'))!

    expect(compact(String(inherited[0]))).toContain('FOR SHARE OF l, pm, inherited')
    expect(inherited[1]).toEqual([5])
  })

  it('still cannot reassign actions to other users', () => {
    const routes = read('../../server/routes/actions.js')

    expect(routes).toContain("if (!isTeamWideRole(req.authUser) && String(ownerUserId) !== String(req.authUser.id)) throw httpError(403,'No puedes asignar acciones a otro usuario')")
    expect(routes).toContain("if (changes.ownerUserId !== undefined && !isTeamWideRole(req.authUser)) throw httpError(403,'Reasignar requiere alcance total')")
  })
})
