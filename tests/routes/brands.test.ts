// MB-001 brand routes: brand resolution, scope, cost visibility, validation
// and responses, with the SQL services mocked.

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const brands = vi.hoisted(() => ({
  loadAllBrandKeys: vi.fn(),
  loadBrandIdentity: vi.fn(),
  loadBrandSalesDates: vi.fn(),
  loadBrandTeam: vi.fn(),
  loadCustomerRows: vi.fn(),
  loadDocuments: vi.fn(),
  loadExportLines: vi.fn(),
  loadInventoryForItems: vi.fn(),
  loadLostProducts: vi.fn(),
  loadMonthlySeriesRows: vi.fn(),
  loadProductRows: vi.fn(),
  loadTargetsRange: vi.fn(),
  loadYearWindows: vi.fn(),
}))

vi.mock('../../server/services/brandsService.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...brands,
}))

const myDay = vi.hoisted(() => ({
  loadDataCutoff: vi.fn(),
  loadBrandLabels: vi.fn(),
  loadWindowMetrics: vi.fn(),
  loadTargets: vi.fn(),
  loadActiveBeforePrevious: vi.fn(),
  countLostCustomers: vi.fn(),
  loadLostCustomers: vi.fn(),
}))

vi.mock('../../server/services/myDayService.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...myDay,
}))

const availability = vi.hoisted(() => ({
  loadLatestImports: vi.fn(),
  loadInventoryCoverage: vi.fn(),
  loadInventoryItemRecords: vi.fn(),
  loadInventoryItems: vi.fn(),
  loadItemSales: vi.fn(),
  loadPendingPurchaseOrderLines: vi.fn(),
}))

vi.mock('../../server/services/myDayAvailabilityService.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...availability,
}))

const actions = vi.hoisted(() => ({ listActions: vi.fn() }))

vi.mock('../../server/services/actionService.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...actions,
}))

const calendarMock = vi.hoisted(() => ({ loadBusinessCalendar: vi.fn() }))

vi.mock('../../server/services/businessCalendar.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...calendarMock,
}))

import {
  BUSINESS_CALENDAR_SEED,
  EMPTY_CALENDAR,
  createBusinessCalendar,
} from '../../server/services/businessCalendar.js'

import {
  createBrandsRouter,
  exportColumns,
  exportRow,
} from '../../server/routes/brands.js'

interface AuthUser {
  scope: string
  brandIds: string[]
  costAccess?: boolean
}

interface TestRequest {
  authUser: AuthUser
  query: Record<string, string>
  params?: Record<string, string>
  brandScope?: unknown
}

function buildResponse() {
  const res = { status: vi.fn(), json: vi.fn(), set: vi.fn() }

  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  res.set.mockReturnValue(res)

  return res
}

type Handler = (req: TestRequest, res: ReturnType<typeof buildResponse>, next?: () => void) => unknown

async function invoke(
  path: string,
  user: AuthUser,
  params: Record<string, string> = {},
  query: Record<string, string> = {},
) {
  const router = createBrandsRouter({ query: vi.fn() }) as unknown as {
    stack: Array<{ route?: { path: string, stack: Array<{ handle: Handler }> }, handle: Handler }>
  }
  const res = buildResponse()
  const req: TestRequest = { authUser: user, query, params }

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const body = (res: ReturnType<typeof buildResponse>) => res.json.mock.calls[0]?.[0] as Record<string, any>
const statusOf = (res: ReturnType<typeof buildResponse>) => res.status.mock.calls[0]?.[0] as number | undefined

const METRICS = { revenue: 300, grossProfit: 60, quantity: 3, documents: 2, customers: 2, products: 1 }
const PM: AuthUser = { scope: 'assigned', brandIds: ['UNVUNIVIEW'], costAccess: true }
const PM_NO_COST: AuthUser = { scope: 'assigned', brandIds: ['UNVUNIVIEW'], costAccess: false }
const ADMIN: AuthUser = { scope: 'all', brandIds: [], costAccess: true }
// Assistants arrive with the effective brands (own + their PM's) in brandIds.
const ASSISTANT: AuthUser = { scope: 'assigned', brandIds: ['UNVUNIVIEW', 'HIKVISION'], costAccess: false }

beforeEach(() => {
  vi.clearAllMocks()
  calendarMock.loadBusinessCalendar.mockResolvedValue(EMPTY_CALENDAR)
  myDay.loadDataCutoff.mockResolvedValue('2026-11-24')
  brands.loadBrandIdentity.mockResolvedValue({
    known: true, label: 'UNV (UNIVIEW)', firstSaleDate: '2019-01-02', lastSaleDate: '2026-11-23',
  })
  brands.loadBrandTeam.mockResolvedValue({ pms: [{ id: 7, name: 'Luis' }], assistants: [] })
  brands.loadAllBrandKeys.mockResolvedValue(['UNVUNIVIEW', 'GEOVISION'])
  brands.loadBrandSalesDates.mockResolvedValue(new Map())
  brands.loadYearWindows.mockResolvedValue(new Map())
  brands.loadMonthlySeriesRows.mockResolvedValue([])
  brands.loadTargetsRange.mockResolvedValue([])
  brands.loadDocuments.mockResolvedValue({
    total: 1, lines: 2, revenue: 300, grossProfit: 60, hasMore: false,
    rows: [{
      documentNumber: 'F-1', saleDate: '2026-11-20', customerId: 'C', customerName: 'Cliente', salesRep: null,
      location: null, lines: 2, quantity: 3, revenue: 300, grossProfit: 60,
    }],
  })
  brands.loadExportLines.mockResolvedValue({
    truncated: false,
    rows: [{
      saleDate: '2026-11-20', documentNumber: 'F-1', customerId: 'C', customerName: 'Cliente', salesRep: null,
      location: null, productCode: 'A', model: null, quantity: 3, revenue: 300, grossProfit: 60,
    }],
  })
  brands.loadCustomerRows.mockResolvedValue({
    hasMore: false,
    counts: { activos: 1, suben: 1, bajan: 0 },
    rows: [{
      customerId: 'C', customerName: 'Cliente', revenue: 300, previousRevenue: 200, grossProfit: 60,
      previousGrossProfit: 40, documents: 2, lastSaleDate: '2026-11-20',
    }],
  })
  brands.loadProductRows.mockResolvedValue({
    soldTotal: 1, hasMore: false,
    rows: [{
      itemKey: 'A', itemCode: 'A', model: null, quantity: 3, previousQuantity: 2, revenue: 300,
      previousRevenue: 200, grossProfit: 60, previousGrossProfit: 40,
    }],
  })
  brands.loadLostProducts.mockResolvedValue({ total: 0, hasMore: false, rows: [] })
  brands.loadInventoryForItems.mockResolvedValue(new Map())
  myDay.loadBrandLabels.mockResolvedValue(new Map([['UNVUNIVIEW', 'UNV (UNIVIEW)']]))
  myDay.loadWindowMetrics.mockResolvedValue({
    current: new Map([['UNVUNIVIEW', METRICS]]),
    previous: new Map([['UNVUNIVIEW', { ...METRICS, revenue: 250, grossProfit: 50 }]]),
  })
  myDay.loadTargets.mockResolvedValue(new Map())
  myDay.loadActiveBeforePrevious.mockResolvedValue(new Set(['UNVUNIVIEW']))
  myDay.countLostCustomers.mockResolvedValue(new Map())
  myDay.loadLostCustomers.mockResolvedValue({ hasMore: false, rows: [] })
  availability.loadLatestImports.mockResolvedValue(new Map())
  actions.listActions.mockResolvedValue({ summary: { total: 0 }, rows: [] })
})

describe('MB-001 brand resolution', () => {
  it.each(['UNV (UNIVIEW)', 'unv (uniview)', 'UNVUNIVIEW'])('resolves %s to the same brand key', async (name) => {
    const res = await invoke('/:brand', PM, { brand: name })

    expect(statusOf(res)).toBeUndefined()
    expect(body(res)).toMatchObject({ ok: true, brandKey: 'UNVUNIVIEW', brandLabel: 'UNV (UNIVIEW)' })
    expect(brands.loadBrandIdentity.mock.calls[0]?.[1]).toBe('UNVUNIVIEW')
  })

  it('rejects an invalid brand with 400', async () => {
    expect(statusOf(await invoke('/:brand', PM, { brand: '***' }))).toBe(400)
  })

  it('answers 404 for an unknown brand inside the scope', async () => {
    brands.loadBrandIdentity.mockResolvedValue({ known: false, label: 'NADA', firstSaleDate: null, lastSaleDate: null })

    expect(statusOf(await invoke('/:brand', ADMIN, { brand: 'NADA' }))).toBe(404)
  })
})

describe('MB-001 scope', () => {
  it('forbids a brand outside the scope of a PM, on every endpoint', async () => {
    for (const path of ['/:brand', '/:brand/sales', '/:brand/sales/export', '/:brand/customers', '/:brand/products']) {
      const res = await invoke(path, PM, { brand: 'HIKVISION' })

      expect(statusOf(res)).toBe(403)
      expect(JSON.stringify(body(res))).toContain('fuera del alcance')
    }

    expect(brands.loadBrandIdentity).not.toHaveBeenCalled()
  })

  it('lets the assistant see the brands of their PM and forbids others', async () => {
    expect(statusOf(await invoke('/:brand', ASSISTANT, { brand: 'HIKVISION' }))).toBeUndefined()
    expect(statusOf(await invoke('/:brand', ASSISTANT, { brand: 'GEOVISION' }))).toBe(403)
  })

  it('lets an admin open any brand', async () => {
    expect(statusOf(await invoke('/:brand', ADMIN, { brand: 'GEOVISION' }))).toBeUndefined()
  })

  it('the directory of a PM only reads their own brands', async () => {
    await invoke('/', PM)

    expect(brands.loadAllBrandKeys).not.toHaveBeenCalled()
    expect(myDay.loadWindowMetrics.mock.calls[0]?.[1]).toEqual(['UNVUNIVIEW'])
  })

  it('view=all is only for the scope all', async () => {
    expect(statusOf(await invoke('/', PM, {}, { view: 'all' }))).toBe(403)

    const allowed = await invoke('/', ADMIN, {}, { view: 'all' })

    expect(statusOf(allowed)).toBeUndefined()
    expect(body(allowed).brandSource).toBe('all-brands')
  })
})

describe('MB-001 hidden costs', () => {
  it('shows gross profit with cost access', async () => {
    const result = body(await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' }))

    expect(result.costHidden).toBe(false)
    expect(result.monthOverMonth.current.grossProfit).toBe(60)
    expect(result.documents.grossProfit).toBe(60)
    expect(result.documents.rows[0].grossProfit).toBe(60)
  })

  it('hides gross profit as null (never 0) without cost access', async () => {
    const result = body(await invoke('/:brand/sales', PM_NO_COST, { brand: 'UNVUNIVIEW' }))

    expect(result.costHidden).toBe(true)
    expect(result.monthOverMonth.current.grossProfit).toBeNull()
    expect(result.monthOverMonth.current.grossMargin).toBeNull()
    expect(result.documents.grossProfit).toBeNull()
    expect(result.documents.rows[0].grossProfit).toBeNull()
    // Revenue stays visible.
    expect(result.monthOverMonth.current.revenue).toBe(300)
  })

  it('hides it in the header, customers, products and the directory', async () => {
    const header = body(await invoke('/:brand', PM_NO_COST, { brand: 'UNVUNIVIEW' }))
    const customers = body(await invoke('/:brand/customers', PM_NO_COST, { brand: 'UNVUNIVIEW' }))
    const products = body(await invoke('/:brand/products', PM_NO_COST, { brand: 'UNVUNIVIEW' }))
    const directory = body(await invoke('/', PM_NO_COST))

    expect(header.brand.grossProfit).toBeNull()
    expect(customers.rows[0].grossProfit).toBeNull()
    expect(customers.rows[0].previousGrossProfit).toBeNull()
    expect(products.rows[0].grossProfit).toBeNull()
    expect(directory.rows[0].grossProfit).toBeNull()
    expect(directory.rows[0].revenue).toBe(300)
  })

  it('the export has no cost columns without cost access', async () => {
    const hidden = body(await invoke('/:brand/sales/export', PM_NO_COST, { brand: 'UNVUNIVIEW' }))
    const visible = body(await invoke('/:brand/sales/export', PM, { brand: 'UNVUNIVIEW' }))
    const keys = (result: { columns: Array<{ key: string }> }) => result.columns.map((column) => column.key)

    expect(keys(hidden as never)).not.toContain('grossProfit')
    expect(keys(hidden as never)).not.toContain('grossMargin')
    expect(hidden.rows[0]).not.toHaveProperty('grossProfit')
    expect(hidden.rows[0]).not.toHaveProperty('grossMargin')
    expect(keys(visible as never)).toEqual(expect.arrayContaining(['grossProfit', 'grossMargin']))
    expect(visible.rows[0]).toMatchObject({ grossProfit: 60, grossMargin: 0.2 })
  })

  it('exportColumns and exportRow follow the cost flag', () => {
    expect(exportColumns(false)).toHaveLength(10)
    expect(exportColumns(true)).toHaveLength(12)
    expect(exportRow({ revenue: 0, grossProfit: 5 } as never, true)).toMatchObject({ grossMargin: null })
    expect(exportRow({ revenue: 10, grossProfit: 5 } as never, false)).toEqual({ revenue: 10 })
  })
})

describe('MB-001 brand without sales (GEOVISION-like)', () => {
  beforeEach(() => {
    myDay.loadWindowMetrics.mockResolvedValue({ current: new Map(), previous: new Map() })
    brands.loadDocuments.mockResolvedValue({ total: 0, lines: 0, revenue: 0, grossProfit: 0, hasMore: false, rows: [] })
    brands.loadCustomerRows.mockResolvedValue({ hasMore: false, counts: { activos: 0, suben: 0, bajan: 0 }, rows: [] })
    brands.loadProductRows.mockResolvedValue({ soldTotal: 0, hasMore: false, rows: [] })
    brands.loadExportLines.mockResolvedValue({ truncated: false, rows: [] })
  })

  it.each(['/:brand', '/:brand/sales', '/:brand/sales/export', '/:brand/customers', '/:brand/products'])(
    'answers 200 on %s',
    async (path) => {
      const res = await invoke(path, ADMIN, { brand: 'GEOVISION' })

      expect(statusOf(res)).toBeUndefined()
      expect(body(res).ok).toBe(true)
    },
  )

  it('the header says it has no sales in the period', async () => {
    expect(body(await invoke('/:brand', ADMIN, { brand: 'GEOVISION' })).hasSalesInPeriod).toBe(false)
  })

  it('the series marks months without sales as missing', async () => {
    const result = body(await invoke('/:brand/sales', ADMIN, { brand: 'GEOVISION' }))

    expect(JSON.stringify(result.series)).toContain('"hasSales":false')
  })
})

describe('MB-001 validation', () => {
  it('rejects a period outside the last 12 months or malformed with 400', async () => {
    for (const period of ['2025-01', '2026-13', 'noviembre']) {
      expect(statusOf(await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' }, { period }))).toBe(400)
    }
  })

  it('accepts the cutoff month and a month of the last 12', async () => {
    expect(body(await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' })).period).toBe('2026-11')
    expect(body(await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' }, { period: '2026-03' })).period).toBe('2026-03')
  })

  it('validates sections and filters', async () => {
    expect(statusOf(await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' }, { sections: 'series,inventada' }))).toBe(400)
    expect(statusOf(await invoke('/:brand/customers', PM, { brand: 'UNVUNIVIEW' }, { filter: 'inventado' }))).toBe(400)
    expect(statusOf(await invoke('/:brand/products', PM, { brand: 'UNVUNIVIEW' }, { filter: 'inventado' }))).toBe(400)
    expect(statusOf(await invoke('/', PM, {}, { status: 'raro' }))).toBe(400)
    expect(statusOf(await invoke('/', PM, {}, { sort: 'raro' }))).toBe(400)
  })

  it('reads only the requested sales sections', async () => {
    const res = await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' }, { sections: 'series' })

    expect(body(res)).toHaveProperty('series')
    expect(body(res)).not.toHaveProperty('documents')
    expect(body(res)).not.toHaveProperty('yearOverYear')
    expect(brands.loadDocuments).not.toHaveBeenCalled()
    expect(brands.loadYearWindows).not.toHaveBeenCalled()
  })

  it('customers use the filter and report counts including por-recuperar', async () => {
    myDay.countLostCustomers.mockResolvedValue(new Map([['UNVUNIVIEW', 4]]))

    const res = await invoke('/:brand/customers', PM, { brand: 'UNVUNIVIEW' }, { filter: 'suben' })

    expect(brands.loadCustomerRows.mock.calls[0]?.[3]).toBe('suben')
    expect(body(res).counts).toEqual({ activos: 1, suben: 1, bajan: 0, 'por-recuperar': 4 })
    expect(body(res).rows[0]).toMatchObject({ variation: 100, variationPercentage: 0.5 })
  })

  it('products show missing stock as null, never 0', async () => {
    const res = await invoke('/:brand/products', PM, { brand: 'UNVUNIVIEW' })

    expect(body(res).reason).toBe('no-inventory-data')
    expect(body(res).rows[0]).toMatchObject({ onHand: null, catalogStatus: null, pendingReceiptUnits: null })
  })
})

describe('CAL-001 calendar in the brand page', () => {
  const seed = () => createBusinessCalendar([...BUSINESS_CALENDAR_SEED])

  it('the header counts business days with the calendar and compares the template', async () => {
    calendarMock.loadBusinessCalendar.mockResolvedValue(seed())
    myDay.loadDataCutoff.mockResolvedValue('2026-11-26')
    myDay.loadTargets.mockResolvedValue(new Map([
      ['UNVUNIVIEW', { revenue: 1000, grossProfit: null, grossMargin: null, workingDays: 21 }],
    ]))

    const result = body(await invoke('/:brand', PM, { brand: 'UNVUNIVIEW' }))

    expect(result.workingDays).toEqual({ elapsed: 18, total: 20, remaining: 2, holidaysExcluded: true, templateTotal: 21, mismatch: true })
    expect(result.calendarMissingYears).toEqual([])
    expect(result.comparison).toMatchObject({ previousTo: '2026-10-26' })
  })

  it('the sales comparisons count the days of each window with the calendar', async () => {
    calendarMock.loadBusinessCalendar.mockResolvedValue(seed())
    myDay.loadDataCutoff.mockResolvedValue('2026-11-26')

    const result = body(await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' }, { sections: 'comparison,yoy' }))

    expect(result.monthOverMonth.current).toMatchObject({ dateTo: '2026-11-26', workingDays: 18 })
    expect(result.monthOverMonth.previous).toMatchObject({ dateTo: '2026-10-26', workingDays: 18 })
    expect(result.monthOverMonth.holidaysExcluded).toBe(true)
    expect(result.yearOverYear.holidaysExcluded).toBe(true)
    expect(result.yearOverYear.calendarMissingYears).toEqual([])

    const windows = brands.loadYearWindows.mock.calls[0]?.[2] as Array<{ key: string, dateTo: string, workingDays: number }>

    expect(windows.find((window) => window.key === 'monthly:2025')).toMatchObject({ dateTo: '2025-11-27', workingDays: 18 })
    expect(windows.find((window) => window.key === 'monthly:2024')).toMatchObject({ dateTo: '2024-11-27', workingDays: 18 })
  })

  it('warns of a year without calendar in the header, the sales and the directory', async () => {
    calendarMock.loadBusinessCalendar.mockResolvedValue(seed())
    myDay.loadDataCutoff.mockResolvedValue('2027-01-20')

    expect(body(await invoke('/:brand', PM, { brand: 'UNVUNIVIEW' })).calendarMissingYears).toEqual([2027])
    expect(body(await invoke('/:brand/sales', PM, { brand: 'UNVUNIVIEW' }, { sections: 'comparison,yoy' })).yearOverYear.calendarMissingYears).toEqual([2027])
    expect(body(await invoke('/', PM)).calendarMissingYears).toEqual([2027])
  })
})
