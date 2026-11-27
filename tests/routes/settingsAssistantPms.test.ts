// NAV-002: "PMs a cargo" of an assistant in Configuración (admin only):
// GET/PUT /api/settings/users/:id/pms, effective brands and the links removed
// when an assistant moves to another role.

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import {
  buildEffectiveBrands,
  createSettingsUsersRouter,
  normalizePmUserIds,
} from '../../server/routes/settingsUsers.js'

interface Row { [key: string]: unknown }

interface Fixture {
  target?: Row | null
  activePmIds?: number[]
  links?: Row[]
  own?: Row[]
  inherited?: Row[]
}

function buildPool(fixture: Fixture = {}) {
  const target = fixture.target === undefined
    ? { id: 5, role: 'assistant', active: true }
    : fixture.target
  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    const text = sql.replace(/\s+/g, ' ').trim()

    if (text.includes('FOR UPDATE') && text.includes('role = \'admin\'')) {
      // PATCH lock: actor (admin) and target.
      return {
        rows: [{ id: 1, role: 'admin', active: true }, ...(target ? [target] : [])],
        rowCount: 2,
      }
    }

    if (text.startsWith('SELECT id, role FROM app_users WHERE id = $1')) {
      return { rows: target ? [target] : [], rowCount: target ? 1 : 0 }
    }

    if (text.includes('id = ANY($1::BIGINT[])') && text.includes('AND role = $2')) {
      const requested = params[0] as number[]
      const active = new Set(fixture.activePmIds ?? [])

      return { rows: requested.filter((id) => active.has(id)).map((id) => ({ id })), rowCount: 0 }
    }

    if (text.includes('FROM app_user_pm_links l JOIN app_users pm ON pm.id = l.pm_user_id WHERE')) {
      return { rows: fixture.links ?? [], rowCount: 0 }
    }

    if (text.includes('FROM app_user_brand_assignments WHERE user_id = $1')) {
      return { rows: fixture.own ?? [], rowCount: 0 }
    }

    if (text.includes('inherited.brand_id')) {
      return { rows: fixture.inherited ?? [], rowCount: 0 }
    }

    if (text.startsWith('UPDATE app_users')) {
      return { rows: [{ id: 5, role: 'pm', active: true }], rowCount: 1 }
    }

    return { rows: [], rowCount: 3 }
  })
  const release = vi.fn()

  return { pool: { query, connect: vi.fn(async () => ({ query, release })) }, query }
}

function buildResponse() {
  const res = { status: vi.fn(), json: vi.fn() }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)

  return res
}

type Handler = (req: unknown, res: ReturnType<typeof buildResponse>) => Promise<unknown>

async function call(
  fixture: ReturnType<typeof buildPool>,
  method: 'get' | 'put' | 'patch',
  path: string,
  req: Record<string, unknown>,
) {
  const router = createSettingsUsersRouter(fixture.pool) as unknown as {
    stack: Array<{ route?: { path: string, methods: Record<string, boolean>, stack: Array<{ handle: Handler }> } }>
  }
  const route = router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])?.route
  const res = buildResponse()

  await route!.stack[0]!.handle({ authUser: { id: 1, role: 'admin' }, body: {}, ...req }, res)

  return res
}

const statements = (fixture: ReturnType<typeof buildPool>) =>
  fixture.query.mock.calls.map(([sql]) => String(sql).replace(/\s+/g, ' ').trim())

describe('NAV-002 PUT /api/settings/users/:id/pms', () => {
  it('links active PMs to an assistant, replacing the previous links', async () => {
    const fixture = buildPool({ activePmIds: [7, 8] })
    const res = await call(fixture, 'put', '/:id/pms', { params: { id: '5' }, body: { pmUserIds: [7, '8', 7] } })

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ ok: true, pmUserIds: [7, 8] })

    const sql = statements(fixture)
    const insert = fixture.query.mock.calls.find(([text]) => String(text).includes('INSERT INTO app_user_pm_links'))!

    expect(sql).toContain('DELETE FROM app_user_pm_links WHERE assistant_user_id = $1')
    expect(insert[1]).toEqual([5, [7, 8], 1])
    expect(sql.at(-1)).toBe('COMMIT')
  })

  it('rejects linking users that are not active PMs', async () => {
    const fixture = buildPool({ activePmIds: [7] })
    const res = await call(fixture, 'put', '/:id/pms', { params: { id: '5' }, body: { pmUserIds: [7, 9] } })

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({
      error: 'Solo se pueden vincular PMs activos; no son PM activos los usuarios 9',
    })
    expect(statements(fixture)).not.toContain('DELETE FROM app_user_pm_links WHERE assistant_user_id = $1')
    expect(statements(fixture)).toContain('ROLLBACK')
  })

  it('rejects an assistant in charge of itself, invalid lists and non-assistants', async () => {
    const self = await call(buildPool(), 'put', '/:id/pms', { params: { id: '5' }, body: { pmUserIds: [5] } })

    expect(self.status).toHaveBeenCalledWith(400)
    expect(self.json.mock.calls[0]?.[0]).toMatchObject({ error: 'Una auxiliar no puede quedar a cargo de sí misma' })

    const invalid = await call(buildPool(), 'put', '/:id/pms', { params: { id: '5' }, body: { pmUserIds: 'x' } })

    expect(invalid.status).toHaveBeenCalledWith(400)

    const pm = await call(
      buildPool({ target: { id: 5, role: 'pm', active: true } }),
      'put',
      '/:id/pms',
      { params: { id: '5' }, body: { pmUserIds: [7] } },
    )

    expect(pm.status).toHaveBeenCalledWith(409)

    const missing = await call(buildPool({ target: null }), 'put', '/:id/pms', { params: { id: '5' }, body: { pmUserIds: [] } })

    expect(missing.status).toHaveBeenCalledWith(404)
  })

  it('clears the links with an empty list', async () => {
    const fixture = buildPool()
    const res = await call(fixture, 'put', '/:id/pms', { params: { id: '5' }, body: { pmUserIds: [] } })

    expect(res.json).toHaveBeenCalledWith({ ok: true, pmUserIds: [] })
    expect(statements(fixture)).toContain('DELETE FROM app_user_pm_links WHERE assistant_user_id = $1')
    expect(statements(fixture).some((sql) => sql.includes('INSERT INTO app_user_pm_links'))).toBe(false)
  })
})

describe('NAV-002 GET /api/settings/users/:id/pms', () => {
  it('returns the PMs and the effective brands with their origin', async () => {
    const fixture = buildPool({
      links: [
        { pm_user_id: 7, name: 'Luis Mayorga', email: 'luis@example.test', role: 'pm', active: true },
        { pm_user_id: 9, name: 'Ex PM', email: 'ex@example.test', role: 'pm', active: false },
      ],
      own: [{ brand_id: 'AJAX' }, { brand_id: 'UNV (UNIVIEW)' }],
      inherited: [
        { brand_id: 'UNV (UNIVIEW)', pm_user_id: 7, pm_name: 'Luis Mayorga', pm_email: 'luis@example.test' },
        { brand_id: 'HIKVISION', pm_user_id: 7, pm_name: 'Luis Mayorga', pm_email: 'luis@example.test' },
      ],
    })
    const res = await call(fixture, 'get', '/:id/pms', { params: { id: '5' } })

    expect(res.json.mock.calls[0]?.[0]).toEqual({
      ok: true,
      role: 'assistant',
      pmUserIds: [7, 9],
      pms: [
        { id: 7, name: 'Luis Mayorga', email: 'luis@example.test', counts: true },
        { id: 9, name: 'Ex PM', email: 'ex@example.test', counts: false },
      ],
      effectiveBrands: [
        { brandId: 'AJAX', own: true, fromPms: [] },
        { brandId: 'HIKVISION', own: false, fromPms: [{ id: 7, name: 'Luis Mayorga', email: 'luis@example.test' }] },
        { brandId: 'UNV (UNIVIEW)', own: true, fromPms: [{ id: 7, name: 'Luis Mayorga', email: 'luis@example.test' }] },
      ],
    })
  })

  it('shows only own brands for a user that is not an assistant', async () => {
    const fixture = buildPool({
      target: { id: 5, role: 'pm', active: true },
      own: [{ brand_id: 'AJAX' }],
      inherited: [{ brand_id: 'HIKVISION', pm_user_id: 7, pm_name: 'Otro', pm_email: null }],
    })
    const res = await call(fixture, 'get', '/:id/pms', { params: { id: '5' } })

    expect(res.json.mock.calls[0]?.[0]).toMatchObject({
      effectiveBrands: [{ brandId: 'AJAX', own: true, fromPms: [] }],
    })
  })
})

describe('NAV-002 role change of an assistant', () => {
  it('removes its PM links when it moves to another role', async () => {
    const fixture = buildPool()
    const res = await call(fixture, 'patch', '/:id', { params: { id: '5' }, body: { role: 'pm' } })

    expect(res.json.mock.calls[0]?.[0]).toMatchObject({ ok: true, removedPmLinks: 3 })
    expect(statements(fixture)).toContain('DELETE FROM app_user_pm_links WHERE assistant_user_id = $1')
  })

  it('keeps the links while it stays an assistant or for other roles', async () => {
    const sameRole = buildPool()

    await call(sameRole, 'patch', '/:id', { params: { id: '5' }, body: { role: 'assistant' } })

    const pm = buildPool({ target: { id: 5, role: 'pm', active: true } })

    await call(pm, 'patch', '/:id', { params: { id: '5' }, body: { role: 'engineering' } })

    for (const fixture of [sameRole, pm]) {
      expect(statements(fixture).some((sql) => sql.includes('DELETE FROM app_user_pm_links'))).toBe(false)
    }
  })
})

describe('NAV-002 helpers and protection', () => {
  it('normalizes the PM ids', () => {
    expect(normalizePmUserIds([3, '4', 3])).toEqual([3, 4])
    expect(normalizePmUserIds([0])).toBeNull()
    expect(normalizePmUserIds(['x'])).toBeNull()
    expect(normalizePmUserIds(null)).toBeNull()
  })

  it('merges own and inherited brands', () => {
    expect(buildEffectiveBrands(['B'], [
      { brand_id: 'A', pm_user_id: '7', pm_name: 'PM 7', pm_email: null },
      { brand_id: 'A', pm_user_id: '8', pm_name: null, pm_email: 'pm8@example.test' },
    ])).toEqual([
      { brandId: 'A', own: false, fromPms: [{ id: 7, name: 'PM 7', email: null }, { id: 8, name: null, email: 'pm8@example.test' }] },
      { brandId: 'B', own: true, fromPms: [] },
    ])
  })

  it('keeps every settings user route behind requireAdmin and offers the Auxiliar role', () => {
    const index = readFileSync(new URL('../../server/index.js', import.meta.url), 'utf8')
    const routes = readFileSync(new URL('../../server/routes/settingsUsers.js', import.meta.url), 'utf8')

    expect(index).toMatch(/'\/api\/settings\/users',\s*requireAuth,\s*authenticatedUser,\s*requireAdmin,/)
    expect(routes).toMatch(/ALLOWED_ROLES =[\s\S]*ASSISTANT_ROLE,[\s\S]*\]\)/)
  })
})
