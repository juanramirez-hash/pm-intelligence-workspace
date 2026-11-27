// MB-001C: year over year of a portfolio (/api/brand-portfolio/year-over-year):
// scope mine/all/403, assistants, hidden costs, portfolio quota and parity with
// the brand page when the portfolio is one brand. SQL services mocked.

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const brands = vi.hoisted(() => ({
  loadBrandIdentity: vi.fn(),
  loadYearWindows: vi.fn(),
  loadMonthlySeriesRows: vi.fn(),
  loadTargetsRange: vi.fn(),
  loadDocuments: vi.fn(),
  loadPortfolioYearWindows: vi.fn(),
  loadPortfolioTargetsRange: vi.fn(),
}))

vi.mock('../../server/services/brandsService.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...brands,
}))

const myDay = vi.hoisted(() => ({
  loadDataCutoff: vi.fn(),
  loadWindowMetrics: vi.fn(),
}))

vi.mock('../../server/services/myDayService.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...myDay,
}))

import { createBrandPortfolioRouter } from '../../server/routes/brandPortfolio.js'
import { createBrandsRouter } from '../../server/routes/brands.js'
import {
  buildYearWindowPlan,
  costVisibleForPortfolio,
} from '../../server/services/brandRules.js'

interface AuthUser {
  scope: string
  brandIds: string[]
  costAccess?: boolean
}

interface TestRequest {
  authUser: AuthUser
  query: Record<string, string>
  params?: Record<string, string>
}

function buildResponse() {
  const res = { status: vi.fn(), json: vi.fn(), set: vi.fn() }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.set.mockReturnValue(res)

  return res
}

type Handler = (req: TestRequest, res: ReturnType<typeof buildResponse>, next?: () => void) => unknown
type Layer = { route?: { path: string, stack: Array<{ handle: Handler }> }, handle: Handler }

async function call(
  router: unknown,
  path: string,
  user: AuthUser,
  query: Record<string, string> = {},
  params: Record<string, string> = {},
) {
  const stack = (router as { stack: Layer[] }).stack
  const res = buildResponse()
  const req: TestRequest = { authUser: user, query, params }

  for (const layer of stack.filter((item) => !item.route)) {
    layer.handle(req, res, () => {})
  }

  const route = stack.find((layer) => layer.route?.path === path)?.route

  if (!route) {
    throw new Error(`GET ${path} was not found`)
  }

  await route.stack[0]!.handle(req, res)

  return res
}

const portfolio = (user: AuthUser, query: Record<string, string> = {}) =>
  call(createBrandPortfolioRouter({ query: vi.fn() }), '/year-over-year', user, query)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const body = (res: ReturnType<typeof buildResponse>) => res.json.mock.calls[0]?.[0] as Record<string, any>
const statusOf = (res: ReturnType<typeof buildResponse>) => res.status.mock.calls[0]?.[0] as number | undefined

const PM: AuthUser = { scope: 'assigned', brandIds: ['BELDEN', 'UNV (UNIVIEW)'], costAccess: true }
const PM_NO_COST: AuthUser = { scope: 'assigned', brandIds: ['BELDEN', 'UNV (UNIVIEW)'], costAccess: false }
// An assistant arrives with the effective brands (own plus the PM's).
const ASSISTANT: AuthUser = { scope: 'assigned', brandIds: ['BELDEN', 'UNV (UNIVIEW)', 'ZKTECO'], costAccess: false }
const ADMIN: AuthUser = { scope: 'all', brandIds: [], costAccess: true }
const ADMIN_NO_COST: AuthUser = { scope: 'all', brandIds: [], costAccess: false }
const NO_BRANDS: AuthUser = { scope: 'assigned', brandIds: [], costAccess: true }

const plan = buildYearWindowPlan('2026-11', '2026-11-24')

function metricsFor(multiplier: number) {
  return new Map(
    plan.windows.map((window: { key: string }, index: number) => [
      window.key,
      {
        revenue: (index + 1) * 1000 * multiplier,
        grossProfit: (index + 1) * 200 * multiplier,
        quantity: (index + 1) * 10,
        documents: index + 3,
        customers: index + 2,
        products: index + 1,
        rowCount: index + 5,
      },
    ]),
  )
}

const QUOTA_ROWS = Array.from({ length: 12 }, (_, index) => ({
  periodId: `2026-${String(index + 1).padStart(2, '0')}`,
  revenue: index < 10 ? 100000 : null,
  grossProfit: null,
  grossMargin: null,
}))

beforeEach(() => {
  vi.clearAllMocks()
  myDay.loadDataCutoff.mockResolvedValue('2026-11-24')
  brands.loadPortfolioYearWindows.mockResolvedValue(metricsFor(1))
  brands.loadPortfolioTargetsRange.mockResolvedValue(QUOTA_ROWS)
  brands.loadYearWindows.mockResolvedValue(metricsFor(1))
  brands.loadTargetsRange.mockResolvedValue(QUOTA_ROWS)
  brands.loadMonthlySeriesRows.mockResolvedValue([])
  brands.loadBrandIdentity.mockResolvedValue({
    known: true, label: 'UNV (UNIVIEW)', firstSaleDate: '2019-01-02', lastSaleDate: '2026-11-23',
  })
})

describe('MB-001C scope', () => {
  it('Mis marcas reads the effective brands of the user, as brand keys', async () => {
    const res = await portfolio(PM)

    expect(statusOf(res)).toBeUndefined()
    expect(brands.loadPortfolioYearWindows.mock.calls[0]?.[1]).toEqual(['BELDEN', 'UNVUNIVIEW'])
    expect(brands.loadPortfolioTargetsRange.mock.calls[0]?.[1]).toEqual(['BELDEN', 'UNVUNIVIEW'])
    expect(body(res)).toMatchObject({ ok: true, view: 'mine', brandSource: 'assigned', brandCount: 2, period: '2026-11' })
  })

  it('an assistant sees the brands of their PM (effective brands)', async () => {
    await portfolio(ASSISTANT)

    expect(brands.loadPortfolioYearWindows.mock.calls[0]?.[1]).toEqual(['BELDEN', 'UNVUNIVIEW', 'ZKTECO'])
  })

  it('Todas (scope all) has no brand filter: brands without a PM included', async () => {
    const res = await portfolio(ADMIN, { view: 'all' })

    expect(brands.loadPortfolioYearWindows.mock.calls[0]?.[1]).toBeNull()
    expect(brands.loadPortfolioTargetsRange.mock.calls[0]?.[1]).toBeNull()
    expect(body(res)).toMatchObject({ view: 'all', brandSource: 'all-brands', brandCount: null })
  })

  it('an admin without assigned brands sees everything in Mis marcas, like the directory', async () => {
    const res = await portfolio(ADMIN)

    expect(brands.loadPortfolioYearWindows.mock.calls[0]?.[1]).toBeNull()
    expect(body(res).brandSource).toBe('all-brands')
  })

  it.each([PM, ASSISTANT])('view=all is a 403 for a user without scope all', async (user) => {
    const res = await portfolio(user, { view: 'all' })

    expect(statusOf(res)).toBe(403)
    expect(brands.loadPortfolioYearWindows).not.toHaveBeenCalled()
  })

  it('a user without assigned brands is stopped by the brand scope, with no query', async () => {
    const res = await portfolio(NO_BRANDS)

    expect(statusOf(res)).toBe(403)
    expect(body(res).ok).toBe(false)
    expect(brands.loadPortfolioYearWindows).not.toHaveBeenCalled()
  })

  it('answers with the reason when there are no sales at all', async () => {
    myDay.loadDataCutoff.mockResolvedValue(null)

    const res = await portfolio(PM)

    expect(body(res)).toMatchObject({ reason: 'no-sales-data', yearOverYear: null, period: null })
  })

  it('validates the view and the period (last 12 months)', async () => {
    expect(statusOf(await portfolio(PM, { view: 'otra' }))).toBe(400)
    expect(statusOf(await portfolio(PM, { period: '2025-01' }))).toBe(400)
    expect(statusOf(await portfolio(PM, { period: '2026-13' }))).toBe(400)
    expect(body(await portfolio(PM, { period: '2026-09' })).period).toBe('2026-09')
  })
})

describe('MB-001C hidden costs', () => {
  it('shows gross profit and margin when the user has cost access to every included brand', async () => {
    const result = body(await portfolio(PM))

    expect(result.costHidden).toBe(false)
    expect(result.yearOverYear.costHidden).toBe(false)
    expect(result.yearOverYear.monthly.current.grossProfit).toBe(200)
    expect(result.yearOverYear.monthly.current.grossMargin).toBeCloseTo(0.2, 10)
  })

  it('hides them as null plus costHidden (never 0) without cost access', async () => {
    for (const user of [PM_NO_COST, ASSISTANT]) {
      const result = body(await portfolio(user))
      const json = JSON.stringify(result.yearOverYear)

      expect(result.costHidden).toBe(true)
      expect(result.yearOverYear.costHidden).toBe(true)
      expect(result.yearOverYear.monthly.current.grossProfit).toBeNull()
      expect(result.yearOverYear.monthly.current.grossMargin).toBeNull()
      expect(result.yearOverYear.ytd.current.grossProfit).toBeNull()
      expect(result.yearOverYear.annual.projection.grossProfit).toBeNull()
      expect(result.yearOverYear.annual.projection.grossMargin).toBeNull()
      expect(json).not.toMatch(/"grossProfit":[1-9]/)
      // Revenue stays visible.
      expect(result.yearOverYear.monthly.current.revenue).toBe(1000)
    }
  })

  it('Todas needs cost access to all the brands', async () => {
    expect(body(await portfolio(ADMIN, { view: 'all' })).costHidden).toBe(false)
    expect(body(await portfolio(ADMIN_NO_COST, { view: 'all' })).costHidden).toBe(true)
  })

  it('costVisibleForPortfolio: every included brand must be visible', () => {
    expect(costVisibleForPortfolio({ mode: 'all' }, null)).toBe(true)
    expect(costVisibleForPortfolio({ mode: 'all' }, ['A'])).toBe(true)
    expect(costVisibleForPortfolio({ mode: 'assigned', brandKeys: ['A', 'B'] }, ['A', 'B'])).toBe(true)
    expect(costVisibleForPortfolio({ mode: 'assigned', brandKeys: ['A'] }, ['A', 'B'])).toBe(false)
    expect(costVisibleForPortfolio({ mode: 'assigned', brandKeys: ['A'] }, null)).toBe(false)
    expect(costVisibleForPortfolio({ mode: 'assigned', brandKeys: ['A'] }, [])).toBe(false)
    expect(costVisibleForPortfolio({ mode: 'none' }, ['A'])).toBe(false)
    expect(costVisibleForPortfolio(undefined, null)).toBe(false)
  })
})

describe('MB-001C portfolio quota', () => {
  it('annual quota = sum of the monthly quotas, with "10 de 12" when months are missing', async () => {
    const target = body(await portfolio(PM)).yearOverYear.annual.target

    expect(target).toMatchObject({ revenue: 1000000, monthsWithTarget: 10, monthsInYear: 12, complete: false })
  })

  it('a complete year of quotas is complete', async () => {
    brands.loadPortfolioTargetsRange.mockResolvedValue(QUOTA_ROWS.map((row) => ({ ...row, revenue: 50000 })))

    expect(body(await portfolio(ADMIN, { view: 'all' })).yearOverYear.annual.target).toMatchObject({
      revenue: 600000, monthsWithTarget: 12, complete: true,
    })
  })

  it('no quota loaded means no annual quota', async () => {
    brands.loadPortfolioTargetsRange.mockResolvedValue([])

    expect(body(await portfolio(PM)).yearOverYear.annual.target).toBeNull()
  })

  it('reads the quotas of the period year', async () => {
    await portfolio(PM, { period: '2026-09' })

    expect(brands.loadPortfolioTargetsRange.mock.calls[0]?.slice(2)).toEqual(['2026-01', '2026-12'])
  })
})

describe('MB-001C parity with the brand page', () => {
  it('a portfolio of one brand gives the same comparison as the brand page', async () => {
    const user: AuthUser = { scope: 'assigned', brandIds: ['UNV (UNIVIEW)'], costAccess: true }
    const brandRes = await call(
      createBrandsRouter({ query: vi.fn() }),
      '/:brand/sales',
      user,
      { sections: 'yoy' },
      { brand: 'UNVUNIVIEW' },
    )
    const portfolioRes = await portfolio(user)

    expect(statusOf(brandRes)).toBeUndefined()
    expect(body(portfolioRes).yearOverYear).toEqual(body(brandRes).yearOverYear)
    expect(body(portfolioRes).yearOverYear.available).toBe(true)
    // Same keys went to the brand SQL and to the portfolio SQL.
    expect(brands.loadYearWindows.mock.calls[0]?.[1]).toBe('UNVUNIVIEW')
    expect(brands.loadPortfolioYearWindows.mock.calls[0]?.[1]).toEqual(['UNVUNIVIEW'])
  })

  it('the same holds with the cost hidden', async () => {
    const user: AuthUser = { scope: 'assigned', brandIds: ['UNV (UNIVIEW)'], costAccess: false }
    const brandRes = await call(
      createBrandsRouter({ query: vi.fn() }),
      '/:brand/sales',
      user,
      { sections: 'yoy' },
      { brand: 'UNVUNIVIEW' },
    )

    expect(body(await portfolio(user)).yearOverYear).toEqual(body(brandRes).yearOverYear)
  })
})
