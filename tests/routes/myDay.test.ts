// MD-001 "Mi día" routes: brand source, validation and responses, with the
// SQL service mocked.

import { readFileSync } from 'node:fs'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const mocks = vi.hoisted(() => ({
  loadDataCutoff: vi.fn(),
  loadActiveBrandKeys: vi.fn(),
  loadBrandLabels: vi.fn(),
  loadWindowMetrics: vi.fn(),
  loadTargets: vi.fn(),
  loadActiveBeforePrevious: vi.fn(),
  countLostCustomers: vi.fn(),
  loadLostCustomers: vi.fn(),
}))

vi.mock('../../server/services/myDayService.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...mocks,
}))

import {
  createMyDayRouter,
  resolveMyDayBrandSource,
} from '../../server/routes/myDay.js'

interface TestRequest {
  authUser?: { scope?: string, brandIds?: string[] }
  query: Record<string, string>
}

function buildResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    set: vi.fn(),
  }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.set.mockReturnValue(res)

  return res
}

type Handler = (req: TestRequest, res: ReturnType<typeof buildResponse>, next?: () => void) => unknown

async function invoke(path: string, req: TestRequest) {
  const router = createMyDayRouter({ query: vi.fn() }) as unknown as {
    stack: Array<{ route?: { path: string, stack: Array<{ handle: Handler }> }, handle: Handler }>
  }
  const res = buildResponse()

  // Router-level middleware first (Cache-Control).
  for (const layer of router.stack.filter((item) => !item.route)) {
    layer.handle(req, res, () => {})
  }

  const route = router.stack.find((layer) => layer.route?.path === path)?.route

  if (!route) {
    throw new Error(`GET ${path} was not found`)
  }

  await route.stack[0]!.handle(req, res)

  return res
}

const body = (res: ReturnType<typeof buildResponse>) =>
  res.json.mock.calls[0]?.[0] as Record<string, unknown>

beforeEach(() => {
  vi.clearAllMocks()
  mocks.loadDataCutoff.mockResolvedValue('2026-11-20')
  mocks.loadActiveBrandKeys.mockResolvedValue(['HIKVISION', 'UNV'])
  mocks.loadBrandLabels.mockResolvedValue(new Map([['UNV', 'UNV']]))
  mocks.loadWindowMetrics.mockResolvedValue({
    current: new Map([['UNV', { revenue: 300, grossProfit: 60, quantity: 3, documents: 2, customers: 2, products: 1 }]]),
    previous: new Map([['UNV', { revenue: 250, grossProfit: 50, quantity: 2, documents: 2, customers: 2, products: 1 }]]),
  })
  mocks.loadTargets.mockResolvedValue(new Map())
  mocks.loadActiveBeforePrevious.mockResolvedValue(new Set(['UNV']))
  mocks.countLostCustomers.mockResolvedValue(new Map())
  mocks.loadLostCustomers.mockResolvedValue({ hasMore: false, rows: [] })
})

describe('MD-001 brand source', () => {
  it('uses the assignments for any valid scope', () => {
    expect(resolveMyDayBrandSource({ scope: 'assigned', brandIds: ['unv', 'Hik Vision'] })).toEqual({
      mode: 'assigned', brandKeys: ['UNV', 'HIKVISION'],
    })
    expect(resolveMyDayBrandSource({ scope: 'all', brandIds: ['UNV'] })).toEqual({
      mode: 'assigned', brandKeys: ['UNV'],
    })
  })

  it('uses every active brand for scope all without assignments', () => {
    expect(resolveMyDayBrandSource({ scope: 'all', brandIds: [] }).mode).toBe('all-brands')
    expect(resolveMyDayBrandSource({ scope: 'assigned', brandIds: [] }).mode).toBe('none')
  })

  it('rejects scopes without commercial access', () => {
    expect(() => resolveMyDayBrandSource({ scope: 'pricing', brandIds: ['UNV'] })).toThrow(
      'Brand access scope is invalid',
    )
  })
})

describe('MD-001 GET /api/my-day', () => {
  it('reads only the assigned brands for the cutoff month, without cache', async () => {
    const res = await invoke('/', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      // Client attempts to widen the brands are ignored.
      query: { brands: 'HIKVISION', scope: 'all' } as Record<string, string>,
    })

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(mocks.loadWindowMetrics).toHaveBeenCalledWith(
      expect.anything(),
      ['UNV'],
      expect.objectContaining({ currentTo: '2026-11-20', previousTo: '2026-10-21' }),
    )
    expect(mocks.loadActiveBrandKeys).not.toHaveBeenCalled()
    expect(body(res)).toMatchObject({
      ok: true,
      period: '2026-11',
      dataCutoff: '2026-11-20',
      brandSource: 'assigned',
      periodStatus: 'open',
      workingDays: { elapsed: 15, total: 21, remaining: 6, holidaysExcluded: false },
      portfolio: { brands: 1, revenue: 300 },
      brands: [{ brandKey: 'UNV', trendStatus: 'growing', lifecycleStatus: 'active' }],
    })
  })

  it('accepts another period and validates it', async () => {
    await invoke('/', { authUser: { scope: 'all', brandIds: ['UNV'] }, query: { period: '2026-10' } })

    expect(mocks.loadTargets).toHaveBeenCalledWith(expect.anything(), ['UNV'], '2026-10')

    const bad = await invoke('/', { authUser: { scope: 'all', brandIds: ['UNV'] }, query: { period: '2026-13' } })

    expect(bad.status).toHaveBeenCalledWith(400)
  })

  it('uses every active brand for scope all without assignments', async () => {
    await invoke('/', { authUser: { scope: 'all', brandIds: [] }, query: {} })

    expect(mocks.loadActiveBrandKeys).toHaveBeenCalledWith(expect.anything(), '2026-11', '2026-10')
    expect(mocks.loadWindowMetrics).toHaveBeenCalledWith(
      expect.anything(), ['HIKVISION', 'UNV'], expect.anything(),
    )
  })

  it('answers 200 with no brands for users without assignments', async () => {
    const res = await invoke('/', { authUser: { scope: 'assigned', brandIds: [] }, query: {} })

    expect(res.status).not.toHaveBeenCalled()
    expect(body(res)).toMatchObject({ ok: true, brands: [], reason: 'no-brand-assignments' })
    expect(mocks.loadWindowMetrics).not.toHaveBeenCalled()
  })

  it('answers with no data for a period after the cutoff', async () => {
    const res = await invoke('/', { authUser: { scope: 'assigned', brandIds: ['UNV'] }, query: { period: '2026-12' } })

    expect(body(res)).toMatchObject({ brands: [], reason: 'period-after-data-cutoff' })
  })

  it('rejects invalid scopes with 403', async () => {
    const res = await invoke('/', { authUser: { scope: 'legacy', brandIds: ['UNV'] }, query: {} })

    expect(res.status).toHaveBeenCalledWith(403)
  })
})

describe('MD-001 GET /api/my-day/lost-customers', () => {
  it('lists lost customers of the assigned brands with their labels', async () => {
    mocks.loadLostCustomers.mockResolvedValue({
      hasMore: false,
      rows: [{ brandKey: 'UNV', customerId: 'C-1', baseRevenue: 900 }],
    })

    const res = await invoke('/lost-customers', {
      authUser: { scope: 'assigned', brandIds: ['UNV', 'HIKVISION'] },
      query: {},
    })

    expect(mocks.loadLostCustomers).toHaveBeenCalledWith(
      expect.anything(),
      ['UNV', 'HIKVISION'],
      { baseFrom: '2026-08', baseTo: '2026-08', inactiveFrom: '2026-09', inactiveTo: '2026-10' },
      { limit: 50, offset: 0 },
    )
    expect(body(res)).toMatchObject({
      inactivePeriods: 2,
      basePeriods: 1,
      rows: [{ brandKey: 'UNV', brandLabel: 'UNV', customerId: 'C-1' }],
    })
  })

  it('filters one brand only inside the user brands', async () => {
    await invoke('/lost-customers', {
      authUser: { scope: 'assigned', brandIds: ['UNV', 'HIKVISION'] },
      query: { brand: 'unv' },
    })

    expect(mocks.loadLostCustomers).toHaveBeenCalledWith(
      expect.anything(), ['UNV'], expect.anything(), expect.anything(),
    )

    const outside = await invoke('/lost-customers', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: { brand: 'DAHUA' },
    })

    expect(outside.status).toHaveBeenCalledWith(403)
  })

  it('validates the window and paging parameters', async () => {
    const res = await invoke('/lost-customers', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: { inactivePeriods: '0' },
    })

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('answers 200 with no rows for users without assignments', async () => {
    const res = await invoke('/lost-customers', { authUser: { scope: 'assigned', brandIds: [] }, query: {} })

    expect(body(res)).toMatchObject({ rows: [], reason: 'no-brand-assignments' })
    expect(mocks.loadLostCustomers).not.toHaveBeenCalled()
  })
})

describe('MD-001 mounting', () => {
  const read = (path: string) =>
    readFileSync(new URL(path, import.meta.url), 'utf8')

  it('requires a session and a loaded user', () => {
    expect(read('../../server/registerBusinessRoutes.js')).toMatch(
      /'\/api\/my-day',\s*requireAuth,\s*authenticatedUser,\s*createMyDayRouter\(pool\)/,
    )
  })

  it('applies the SEC-004 rate limit', () => {
    expect(read('../../server/index.js')).toMatch(
      /'\/api\/my-day',\s*createApiRateLimit\(\)/,
    )
  })
})
