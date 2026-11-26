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

import {
  createMyDayRouter,
  resolveMyDayBrandSource,
} from '../../server/routes/myDay.js'

interface TestRequest {
  authUser?: { scope?: string, brandIds?: string[], costAccess?: boolean }
  query: Record<string, string>
  params?: Record<string, string>
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
  availability.loadLatestImports.mockResolvedValue(new Map([
    ['inventory', { importId: 41, uploadedAt: '2026-11-21T15:00:00.000Z' }],
    ['purchases', { importId: 42, uploadedAt: '2026-11-21T16:00:00.000Z' }],
    ['sales', { importId: 43, uploadedAt: '2026-11-21T14:00:00.000Z' }],
  ]))
  // MD-002 load (before HOTFIX1): positions only.
  availability.loadInventoryCoverage.mockResolvedValue({
    itemRecords: 0, itemRecordsWithPositions: 0, itemRecordsWithStatus: 0,
    positionArticles: 3, positionsHaveStatus: true,
  })
  availability.loadInventoryItems.mockResolvedValue([
    {
      itemKey: 'OUT', itemCode: 'OUT', brand: 'UNV', brandKey: 'UNV', catalogStatus: 'DE LINEA',
      onHand: 0, pendingReceiptUnits: 10, lastSaleDate: '2026-11-18',
    },
    {
      itemKey: 'LOW', itemCode: 'LOW', brand: 'UNV', brandKey: 'UNV', catalogStatus: 'DE LINEA',
      onHand: 9, pendingReceiptUnits: 0, lastSaleDate: '2026-11-19',
    },
    {
      itemKey: 'ORDER', itemCode: 'ORDER', brand: 'UNV', brandKey: 'UNV', catalogStatus: 'SOBRE PEDIDO',
      onHand: 0, pendingReceiptUnits: 0, lastSaleDate: null,
    },
  ])
  // Window 2026-08-21..2026-11-20 = 92 days.
  availability.loadItemSales.mockResolvedValue(new Map([['OUT', 46], ['LOW', 92]]))
  availability.loadPendingPurchaseOrderLines.mockResolvedValue([
    {
      itemKey: 'OUT', purchaseOrderNumber: 'PO-7', supplierName: 'Proveedor', status: 'Pending Receipt',
      shipmentStatus: 'EN ADUANA', expectedReceiptDate: '2026-11-28', currency: 'USD',
      brand: 'UNV', brandKey: 'UNV', costVisible: true, amount: 500,
    },
  ])
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

describe('MD-002 view parameter', () => {
  const ROUTES = ['/', '/lost-customers', '/stock-alerts', '/arrivals']

  it('keeps the MD-001 behavior by default and with view=mine', () => {
    expect(resolveMyDayBrandSource({ scope: 'all', brandIds: ['UNV'] }, 'mine')).toEqual({
      mode: 'assigned', brandKeys: ['UNV'],
    })
    expect(resolveMyDayBrandSource({ scope: 'all', brandIds: ['UNV'] }, 'all')).toEqual({
      mode: 'all-brands', brandKeys: [],
    })
  })

  it('answers every route with all brands for scope all and view=all', async () => {
    for (const path of ROUTES) {
      const res = await invoke(path, {
        authUser: { scope: 'all', brandIds: ['UNV'] },
        query: { view: 'all' },
      })

      expect(res.status).not.toHaveBeenCalled()
      expect(body(res)).toMatchObject({ ok: true })
    }

    // MD-001 with view=all: every active brand.
    expect(mocks.loadActiveBrandKeys).toHaveBeenCalled()
    // Availability with view=all: no brand filter.
    expect(availability.loadInventoryItems).toHaveBeenCalledWith(expect.anything(), 41, null)
    expect(availability.loadPendingPurchaseOrderLines).toHaveBeenCalledWith(
      expect.anything(), { brandKeys: null }, expect.anything(),
    )
  })

  it('rejects view=all without scope all (403) and invalid views (400) on every route', async () => {
    for (const path of ROUTES) {
      const forbidden = await invoke(path, {
        authUser: { scope: 'assigned', brandIds: ['UNV'] },
        query: { view: 'all' },
      })
      const invalid = await invoke(path, {
        authUser: { scope: 'all', brandIds: ['UNV'] },
        query: { view: 'todas' },
      })

      expect(forbidden.status).toHaveBeenCalledWith(403)
      expect(invalid.status).toHaveBeenCalledWith(400)
    }

    const kind = await invoke('/stock-alerts/:kind', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: { view: 'all' },
      params: { kind: 'out-of-stock' },
    })

    expect(kind.status).toHaveBeenCalledWith(403)
  })
})

describe('MD-002 GET /api/my-day/stock-alerts', () => {
  it('classifies the assigned brands from the latest inventory, without cost', async () => {
    const res = await invoke('/stock-alerts', {
      authUser: { scope: 'assigned', brandIds: ['UNV'], costAccess: true },
      query: { brands: 'HIKVISION' } as Record<string, string>,
    })

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(availability.loadInventoryItems).toHaveBeenCalledWith(expect.anything(), 41, ['UNV'])
    // Only DE LINEA items read sales and purchase orders.
    expect(availability.loadItemSales).toHaveBeenCalledWith(
      expect.anything(), ['OUT', 'LOW'], { from: '2026-08-21', to: '2026-11-20', days: 92, months: 3 },
    )
    expect(availability.loadPendingPurchaseOrderLines).toHaveBeenCalledWith(
      expect.anything(), { itemKeys: ['OUT', 'LOW'] }, { mode: 'none' },
    )
    expect(body(res)).toMatchObject({
      ok: true,
      view: 'mine',
      dataCutoff: '2026-11-20',
      brandSource: 'assigned',
      limit: 20,
      sources: {
        inventory: { lastImportedAt: '2026-11-21T15:00:00.000Z' },
        sales: { dataCutoff: '2026-11-20' },
      },
      outOfStock: {
        total: 1,
        hasMore: false,
        rows: [{
          itemCode: 'OUT', onHand: 0, pendingReceiptUnits: 10, avgMonthlyUnits: 15.33,
          lastSaleDate: '2026-11-18', arrivalStatus: 'scheduled',
          nextArrival: { date: '2026-11-28', purchaseOrderNumber: 'PO-7', shipmentStatus: 'EN ADUANA' },
        }],
      },
      lowStock: {
        total: 1,
        rows: [{ itemCode: 'LOW', onHand: 9, coverageDays: 9, arrivalStatus: 'no-po' }],
      },
      dataQuality: { items: 3, itemsWithoutCatalogStatus: 0 },
    })
    expect(JSON.stringify(body(res))).not.toContain('"amount"')
  })

  it('reports a missing catalog status instead of inferring it', async () => {
    availability.loadInventoryCoverage.mockResolvedValue({
      itemRecords: 0, itemRecordsWithPositions: 0, itemRecordsWithStatus: 0,
      positionArticles: 3, positionsHaveStatus: false,
    })

    const res = await invoke('/stock-alerts', { authUser: { scope: 'assigned', brandIds: ['UNV'] }, query: {} })

    expect(body(res)).toMatchObject({
      reason: 'catalog-status-missing',
      outOfStock: { total: 0, rows: [] },
      lowStock: { total: 0, rows: [] },
    })
    expect(availability.loadInventoryItems).not.toHaveBeenCalled()
  })

  it('answers without data when there is no inventory or no assignments', async () => {
    availability.loadLatestImports.mockResolvedValue(new Map())

    const noInventory = await invoke('/stock-alerts', { authUser: { scope: 'assigned', brandIds: ['UNV'] }, query: {} })

    expect(body(noInventory)).toMatchObject({
      reason: 'no-inventory-data',
      sources: { inventory: { status: 'no-data', lastImportedAt: null } },
    })

    const none = await invoke('/stock-alerts', { authUser: { scope: 'assigned', brandIds: [] }, query: {} })

    expect(body(none)).toMatchObject({ reason: 'no-brand-assignments', outOfStock: { rows: [] } })
  })

  it('filters one brand only inside the user brands', async () => {
    await invoke('/stock-alerts', {
      authUser: { scope: 'assigned', brandIds: ['UNV', 'HIKVISION'] },
      query: { brand: 'hik vision' },
    })

    expect(availability.loadInventoryItems).toHaveBeenCalledWith(expect.anything(), 41, ['HIKVISION'])

    const outside = await invoke('/stock-alerts', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: { brand: 'DAHUA' },
    })

    expect(outside.status).toHaveBeenCalledWith(403)
  })

  it('pages one list and validates the kind', async () => {
    const res = await invoke('/stock-alerts/:kind', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: { limit: '1', offset: '0' },
      params: { kind: 'low-stock' },
    })

    expect(body(res)).toMatchObject({
      kind: 'low-stock', limit: 1, offset: 0, total: 1, hasMore: false,
      rows: [{ itemCode: 'LOW' }],
    })

    const bad = await invoke('/stock-alerts/:kind', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: {},
      params: { kind: 'agotados' },
    })

    expect(bad.status).toHaveBeenCalledWith(400)
  })
})

describe('MD-002-HOTFIX1 inventory coverage', () => {
  const ITEM_RECORDS = {
    itemRecords: 4, itemRecordsWithPositions: 2, itemRecordsWithStatus: 4,
    positionArticles: 2, positionsHaveStatus: true,
  }

  beforeEach(() => {
    availability.loadInventoryCoverage.mockResolvedValue(ITEM_RECORDS)
    availability.loadInventoryItemRecords.mockResolvedValue([
      {
        itemKey: 'OUT', itemCode: 'OUT', brand: 'UNV', brandKey: 'UNV', catalogStatus: 'DE LINEA',
        onHand: 0, pendingReceiptUnits: 10, lastSaleDate: '2026-11-18', positions: 1,
      },
      // No quantity in any branch: not in the positions, still out of stock.
      {
        itemKey: 'EMPTY', itemCode: 'EMPTY', brand: 'UNV', brandKey: 'UNV', catalogStatus: 'DE LINEA',
        onHand: 0, pendingReceiptUnits: 0, lastSaleDate: '2025-02-06', positions: 0,
      },
      {
        itemKey: 'LOW', itemCode: 'LOW', brand: 'UNV', brandKey: 'UNV', catalogStatus: 'DE LINEA',
        onHand: 9, pendingReceiptUnits: 0, lastSaleDate: '2026-11-19', positions: 1,
      },
      {
        itemKey: 'ORDER', itemCode: 'ORDER', brand: 'UNV', brandKey: 'UNV', catalogStatus: 'SOBRE PEDIDO',
        onHand: 0, pendingReceiptUnits: 0, lastSaleDate: null, positions: 0,
      },
    ])
  })

  it('reads every article from the item records and flags the coverage as complete', async () => {
    const res = await invoke('/stock-alerts', { authUser: { scope: 'all', brandIds: [] }, query: { view: 'all' } })

    expect(availability.loadInventoryItemRecords).toHaveBeenCalledWith(expect.anything(), 41, null)
    expect(availability.loadInventoryItems).not.toHaveBeenCalled()
    expect(availability.loadItemSales).toHaveBeenCalledWith(
      expect.anything(), ['OUT', 'EMPTY', 'LOW'], expect.anything(),
    )
    expect(body(res)).toMatchObject({
      inventoryCoverage: {
        complete: true, source: 'items', articles: 4, articlesWithPositions: 2, reason: null,
      },
      outOfStock: {
        total: 2,
        complete: true,
        rows: [
          { itemCode: 'OUT', positions: 1 },
          { itemCode: 'EMPTY', positions: 0, onHand: 0, lastSaleDate: '2025-02-06', arrivalStatus: 'no-po' },
        ],
      },
      lowStock: { total: 1, complete: true, rows: [{ itemCode: 'LOW', coverageDays: 9 }] },
    })
  })

  it('pages the full lists from the item records', async () => {
    const res = await invoke('/stock-alerts/:kind', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: { limit: '1', offset: '1' },
      params: { kind: 'out-of-stock' },
    })

    expect(availability.loadInventoryItemRecords).toHaveBeenCalledWith(expect.anything(), 41, ['UNV'])
    expect(body(res)).toMatchObject({
      complete: true, total: 2, hasMore: false, rows: [{ itemCode: 'EMPTY' }],
    })
  })

  it('flags an MD-002 load (positions only) as incomplete', async () => {
    availability.loadInventoryCoverage.mockResolvedValue({
      itemRecords: 0, itemRecordsWithPositions: 0, itemRecordsWithStatus: 0,
      positionArticles: 2098, positionsHaveStatus: true,
    })

    const res = await invoke('/stock-alerts', { authUser: { scope: 'assigned', brandIds: ['UNV'] }, query: {} })

    expect(availability.loadInventoryItemRecords).not.toHaveBeenCalled()
    expect(availability.loadInventoryItems).toHaveBeenCalledWith(expect.anything(), 41, ['UNV'])
    expect(body(res)).toMatchObject({
      inventoryCoverage: {
        complete: false,
        source: 'positions',
        articles: null,
        articlesWithPositions: 2098,
        reason: 'inventory-loaded-before-item-records',
      },
      outOfStock: { complete: false, rows: [{ itemCode: 'OUT', positions: null }] },
      lowStock: { complete: false },
    })

    const kind = await invoke('/stock-alerts/:kind', {
      authUser: { scope: 'assigned', brandIds: ['UNV'] },
      query: {},
      params: { kind: 'low-stock' },
    })

    expect(body(kind)).toMatchObject({ complete: false })
  })

  it('reports a missing catalog status in the item records', async () => {
    availability.loadInventoryCoverage.mockResolvedValue({ ...ITEM_RECORDS, itemRecordsWithStatus: 0 })

    const res = await invoke('/stock-alerts', { authUser: { scope: 'assigned', brandIds: ['UNV'] }, query: {} })

    expect(body(res)).toMatchObject({
      reason: 'catalog-status-missing',
      inventoryCoverage: { complete: true, source: 'items' },
    })
    expect(availability.loadInventoryItemRecords).not.toHaveBeenCalled()
  })
})

describe('MD-002 GET /api/my-day/arrivals', () => {
  it('lists the purchase orders of the user brands with the cost scope', async () => {
    const res = await invoke('/arrivals', {
      authUser: { scope: 'assigned', brandIds: ['UNV'], costAccess: true },
      query: {},
    })

    expect(availability.loadPendingPurchaseOrderLines).toHaveBeenCalledWith(
      expect.anything(), { brandKeys: ['UNV'] }, { mode: 'assigned', brandKeys: ['UNV'] },
    )
    expect(body(res)).toMatchObject({
      ok: true,
      dataCutoff: '2026-11-20',
      window: { from: '2026-11-20', to: '2026-12-04', days: 14 },
      summary: { purchaseOrders: 1, upcoming: 1, overdue: 0, costHidden: false },
      total: 1,
      rows: [{
        purchaseOrderNumber: 'PO-7',
        expectedReceiptDate: '2026-11-28',
        amountsByCurrency: { USD: { amount: 500 } },
      }],
    })
  })

  it('never shows 0 for hidden costs', async () => {
    availability.loadPendingPurchaseOrderLines.mockResolvedValue([
      {
        itemKey: 'OUT', purchaseOrderNumber: 'PO-7', supplierName: 'Proveedor', status: 'Pending Receipt',
        shipmentStatus: null, expectedReceiptDate: '2026-11-28', currency: 'USD',
        brand: 'UNV', brandKey: 'UNV', costVisible: false, amount: null,
      },
    ])

    const res = await invoke('/arrivals', {
      authUser: { scope: 'assigned', brandIds: ['UNV'], costAccess: false },
      query: {},
    })

    expect(availability.loadPendingPurchaseOrderLines).toHaveBeenCalledWith(
      expect.anything(), expect.anything(), { mode: 'none' },
    )
    expect(body(res)).toMatchObject({
      summary: { costHidden: true, amountsByCurrency: { USD: { amount: null, linesHidden: 1 } } },
      rows: [{ costHidden: true, amountsByCurrency: { USD: { amount: null } } }],
    })
  })

  it('reports missing purchase order data', async () => {
    availability.loadLatestImports.mockResolvedValue(new Map([
      ['inventory', { importId: 41, uploadedAt: '2026-11-21T15:00:00.000Z' }],
    ]))

    const res = await invoke('/arrivals', { authUser: { scope: 'assigned', brandIds: ['UNV'] }, query: {} })

    expect(body(res)).toMatchObject({ reason: 'no-purchase-data', rows: [], summary: null })
    expect(availability.loadPendingPurchaseOrderLines).not.toHaveBeenCalled()
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
