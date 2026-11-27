// NAV-001: GET /api/status/data-cutoff, session only and dates only.

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import { createDataStatusRouter } from '../../server/routes/dataStatus.js'

type Handler = (req: unknown, res: ReturnType<typeof buildResponse>, next?: () => void) => unknown

function buildResponse() {
  const res = { status: vi.fn(), json: vi.fn(), set: vi.fn() }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.set.mockReturnValue(res)

  return res
}

function fakePool() {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('MAX(sale_date)')) {
      return { rows: [{ cutoff: '2026-11-24' }] }
    }

    if (sql.includes('FROM data_imports')) {
      return {
        rows: [
          { dataset_type: 'sales', id: '43', uploaded_at: '2026-11-25T15:00:00.000Z' },
          { dataset_type: 'inventory', id: '41', uploaded_at: '2026-11-26T15:00:00.000Z' },
          { dataset_type: 'purchases', id: '42', uploaded_at: '2026-08-26T15:00:00.000Z' },
        ],
      }
    }

    throw new Error(`Unexpected query: ${sql}`)
  })

  return { query }
}

async function invoke(pool: ReturnType<typeof fakePool>) {
  const router = createDataStatusRouter(pool, () => new Date('2026-11-27T18:00:00.000Z')) as unknown as {
    stack: Array<{ route?: { path: string, stack: Array<{ handle: Handler }> }, handle: Handler }>
  }
  const res = buildResponse()

  for (const layer of router.stack.filter((item) => !item.route)) {
    layer.handle({}, res, () => {})
  }

  await router.stack.find((layer) => layer.route?.path === '/data-cutoff')!.route!.stack[0]!.handle({}, res)

  return res
}

describe('NAV-001 GET /api/status/data-cutoff', () => {
  it('returns the sales cutoff and the freshness of sales, inventory and purchases', async () => {
    const pool = fakePool()
    const res = await invoke(pool)

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({
      ok: true,
      salesCutoff: '2026-11-24',
      staleAfterDays: 7,
      anyStale: true,
      sources: {
        sales: { referenceDate: '2026-11-24', daysSince: 3, stale: false },
        inventory: { referenceDate: '2026-11-26', daysSince: 1, stale: false },
        purchases: { referenceDate: '2026-08-26', stale: true },
      },
    })
    // Two small reads; never a dataset.
    expect(pool.query).toHaveBeenCalledTimes(2)

    for (const [sql] of pool.query.mock.calls) {
      const text = String(sql)

      expect(text).not.toMatch(/inventory_snapshots|inventory_items|purchase_orders/)

      if (text.includes('sales_facts')) {
        expect(text).toContain('MAX(sale_date)')
      }
    }
  })

  it('answers 500 with a Spanish message when the database fails', async () => {
    const pool = { query: vi.fn(async () => { throw new Error('down') }) }
    const res = await invoke(pool as unknown as ReturnType<typeof fakePool>)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json.mock.calls[0]?.[0]).toMatchObject({ ok: false, error: 'No se pudo consultar la fecha de corte' })
  })

  it('requires only a session (no brand scope) and is rate limited', () => {
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

    expect(read('../../server/registerBusinessRoutes.js')).toMatch(
      /'\/api\/status',\s*requireAuth,\s*authenticatedUser,\s*createDataStatusRouter\(pool\)/,
    )
    expect(read('../../server/routes/dataStatus.js')).not.toContain('requireBrandScope')
    expect(read('../../server/index.js')).toMatch(/'\/api\/status',\s*createApiRateLimit\(\)/)
  })
})
