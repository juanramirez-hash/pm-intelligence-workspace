// MD-002 "Mi día" availability rules: pure functions, no PostgreSQL.

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ARRIVAL_ROW_STATUSES,
  MY_DAY_AVAILABILITY_RULES,
  buildArrivals,
  buildStockAlerts,
  compareOutOfStock,
  pageRows,
  resolveArrival,
  resolveArrivalWindow,
  resolveInventoryCoverage,
  resolveSalesWindow,
  selectArrivalRows,
  sourceFreshness,
} from '../../server/services/myDayAvailabilityRules.js'

const CUTOFF = '2026-11-24'
const WINDOW = resolveSalesWindow(CUTOFF)!

function item(overrides: Record<string, unknown>) {
  return {
    itemKey: 'A',
    itemCode: 'A',
    brand: 'UNV',
    brandKey: 'UNV',
    catalogStatus: 'DE LINEA',
    onHand: 0,
    pendingReceiptUnits: 0,
    lastSaleDate: null,
    ...overrides,
  }
}

function line(overrides: Record<string, unknown>) {
  return {
    itemKey: 'A',
    purchaseOrderNumber: 'PO1',
    supplierName: 'Proveedor',
    status: 'Pending Receipt',
    shipmentStatus: 'EMBARCADO',
    expectedReceiptDate: '2026-11-30',
    currency: 'USD',
    brand: 'UNV',
    brandKey: 'UNV',
    costVisible: true,
    amount: 100,
    ...overrides,
  }
}

describe('MD-002 rules', () => {
  it('keeps every threshold and status list in one frozen object', () => {
    expect(MY_DAY_AVAILABILITY_RULES).toMatchObject({
      catalogStatus: 'DE LINEA',
      salesWindowMonths: 3,
      lowStockCoverageDays: 30,
      arrivalWindowDays: 14,
      purchaseOrders: {
        pendingStatuses: ['Pending Receipt', 'Pending Bill'],
        arrivedStatuses: ['Fully Billed'],
        lineType: 'product',
      },
      freshness: { staleAfterDays: 7 },
    })
    expect(Object.isFrozen(MY_DAY_AVAILABILITY_RULES.purchaseOrders.pendingStatuses)).toBe(true)
    expect(MY_DAY_AVAILABILITY_RULES.notes.pendingReceiptUnits).toContain('Cantidad Actual en Orden')
  })

  it('uses a calendar window of 3 months back from the sales cutoff', () => {
    expect(WINDOW).toEqual({ from: '2026-08-25', to: '2026-11-24', days: 92, months: 3 })
    // End of month is clamped: 31 May minus 3 months is 28 Feb.
    expect(resolveSalesWindow('2026-05-31')).toMatchObject({ from: '2026-03-01', days: 92 })
    expect(resolveSalesWindow('2026-01-15')).toMatchObject({ from: '2025-10-16' })
    expect(resolveSalesWindow(null)).toBeNull()
  })
})

describe('MD-002 stock alerts', () => {
  it('lists every DE LINEA item with zero total stock, with or without sales', () => {
    const { outOfStock, lowStock } = buildStockAlerts({
      items: [
        item({ itemKey: 'SOLD', itemCode: 'SOLD' }),
        item({ itemKey: 'NEVER', itemCode: 'NEVER' }),
        item({ itemKey: 'OTHER', catalogStatus: 'SOBRE PEDIDO' }),
        item({ itemKey: 'NEGATIVE', itemCode: 'NEGATIVE', onHand: -2 }),
      ],
      salesByItem: new Map([['SOLD', 30]]),
      linesByItem: new Map(),
      window: WINDOW,
      cutoff: CUTOFF,
    })

    expect(outOfStock.map((row) => row.itemKey)).toEqual(['SOLD', 'NEGATIVE', 'NEVER'])
    expect(outOfStock[0]).toMatchObject({ avgMonthlyUnits: 10, netUnits: 30, arrivalStatus: 'no-po' })
    expect(outOfStock[2]).toMatchObject({ avgMonthlyUnits: 0, lastSaleDate: null })
    expect(lowStock).toEqual([])
  })

  it('orders out of stock by sales, then last sale date, never sold last', () => {
    const rows = [
      { itemCode: 'C', avgMonthlyUnits: 0, lastSaleDate: null },
      { itemCode: 'B', avgMonthlyUnits: 0, lastSaleDate: '2026-01-10' },
      { itemCode: 'A', avgMonthlyUnits: 0, lastSaleDate: '2026-06-01' },
      { itemCode: 'D', avgMonthlyUnits: 2.5, lastSaleDate: '2025-01-01' },
      { itemCode: 'E', avgMonthlyUnits: 7, lastSaleDate: null },
    ].sort(compareOutOfStock)

    expect(rows.map((row) => row.itemCode)).toEqual(['E', 'D', 'A', 'B', 'C'])
  })

  it('puts an item in low stock at exactly 30 days of coverage and not after', () => {
    // 92 units in 92 days = 1 per day.
    const { lowStock } = buildStockAlerts({
      items: [
        item({ itemKey: 'EDGE', itemCode: 'EDGE', onHand: 30 }),
        item({ itemKey: 'OVER', itemCode: 'OVER', onHand: 31 }),
        item({ itemKey: 'FAST', itemCode: 'FAST', onHand: 10 }),
      ],
      salesByItem: new Map([['EDGE', 92], ['OVER', 92], ['FAST', 92]]),
      linesByItem: new Map(),
      window: WINDOW,
      cutoff: CUTOFF,
    })

    expect(lowStock.map((row) => [row.itemKey, row.coverageDays])).toEqual([
      ['FAST', 10],
      ['EDGE', 30],
    ])
    expect(lowStock[0]).toMatchObject({ avgDailyUnits: 1, avgMonthlyUnits: 30.67 })
  })

  it('leaves out items without net sales in the window from low stock', () => {
    const { lowStock, outOfStock } = buildStockAlerts({
      items: [
        item({ itemKey: 'NONE', onHand: 1 }),
        item({ itemKey: 'RETURNS', onHand: 1 }),
      ],
      salesByItem: new Map([['RETURNS', -3]]),
      linesByItem: new Map(),
      window: WINDOW,
      cutoff: CUTOFF,
    })

    expect(lowStock).toEqual([])
    expect(outOfStock).toEqual([])
  })

  it('counts missing status and brand, never infers them', () => {
    const { outOfStock, dataQuality } = buildStockAlerts({
      items: [
        item({ itemKey: 'NO-STATUS', catalogStatus: null }),
        item({ itemKey: 'NO-BRAND', brand: null, brandKey: null }),
      ],
      salesByItem: new Map(),
      linesByItem: new Map(),
      window: WINDOW,
      cutoff: CUTOFF,
    })

    expect(outOfStock.map((row) => row.itemKey)).toEqual(['NO-BRAND'])
    expect(dataQuality).toMatchObject({
      items: 2,
      itemsWithoutCatalogStatus: 1,
      itemsWithoutBrand: 1,
    })
    expect(dataQuality).not.toHaveProperty('deLineaWithoutInventory')
  })

  it('counts on order without purchase order and purchase orders without on order', () => {
    const { outOfStock, dataQuality } = buildStockAlerts({
      items: [
        item({ itemKey: 'MISSING-PO', itemCode: 'B', pendingReceiptUnits: 5 }),
        item({ itemKey: 'BILLED', itemCode: 'A', pendingReceiptUnits: 0 }),
      ],
      salesByItem: new Map(),
      linesByItem: new Map([['BILLED', [line({ itemKey: 'BILLED', status: 'Pending Bill' })]]]),
      window: WINDOW,
      cutoff: CUTOFF,
    })

    expect(outOfStock.map((row) => [row.itemKey, row.arrivalStatus])).toEqual([
      ['BILLED', 'no-po'],
      ['MISSING-PO', 'no-po-data'],
    ])
    expect(dataQuality).toMatchObject({
      onOrderWithoutPurchaseOrder: 1,
      purchaseOrdersWithoutOnOrder: 1,
    })
  })
})

describe('MD-002 next arrival', () => {
  it('takes the nearest scheduled purchase order on or after the cutoff', () => {
    const arrival = resolveArrival(50, [
      line({ purchaseOrderNumber: 'LATE', expectedReceiptDate: '2026-11-01' }),
      line({ purchaseOrderNumber: 'NEXT', expectedReceiptDate: '2026-11-24' }),
      line({ purchaseOrderNumber: 'AFTER', expectedReceiptDate: '2026-12-20' }),
    ], CUTOFF)

    expect(arrival.arrivalStatus).toBe('scheduled')
    expect(arrival.nextArrival).toMatchObject({
      date: '2026-11-24',
      purchaseOrderNumber: 'NEXT',
      overdue: false,
      hasOverduePurchaseOrders: true,
    })
  })

  it('marks overdue, no date, no PO data and no PO', () => {
    expect(resolveArrival(5, [
      line({ purchaseOrderNumber: 'B', expectedReceiptDate: '2026-11-20' }),
      line({ purchaseOrderNumber: 'A', expectedReceiptDate: '2026-10-01' }),
    ], CUTOFF)).toMatchObject({
      arrivalStatus: 'overdue',
      nextArrival: { purchaseOrderNumber: 'A', overdue: true },
    })
    expect(resolveArrival(5, [line({ expectedReceiptDate: null })], CUTOFF)).toMatchObject({
      arrivalStatus: 'no-date',
      nextArrival: { date: null, purchaseOrderNumber: 'PO1' },
    })
    expect(resolveArrival(5, [], CUTOFF)).toMatchObject({
      arrivalStatus: 'no-po-data', nextArrival: null,
    })
    expect(resolveArrival(0, [], CUTOFF)).toMatchObject({
      arrivalStatus: 'no-po', nextArrival: null, purchaseOrderWithoutOnOrder: false,
    })
    expect(resolveArrival(0, [line({})], CUTOFF)).toMatchObject({
      arrivalStatus: 'no-po', nextArrival: null, purchaseOrderWithoutOnOrder: true,
    })
  })
})

describe('MD-002 arrivals', () => {
  it('keeps purchase orders due in 14 days or overdue, grouped by order', () => {
    expect(resolveArrivalWindow(CUTOFF)).toEqual({ from: CUTOFF, to: '2026-12-08', days: 14 })

    const { rows, summary } = buildArrivals({
      cutoff: CUTOFF,
      lines: [
        line({ purchaseOrderNumber: 'PO1', itemKey: 'A', expectedReceiptDate: '2026-12-08', amount: 100 }),
        line({ purchaseOrderNumber: 'PO1', itemKey: 'B', expectedReceiptDate: '2026-11-30', amount: 50, shipmentStatus: 'EN ADUANA' }),
        line({ purchaseOrderNumber: 'PO2', expectedReceiptDate: '2026-11-10', currency: 'MXN', amount: 2000 }),
        line({ purchaseOrderNumber: 'PO3', expectedReceiptDate: '2026-12-09' }),
        line({ purchaseOrderNumber: 'PO4', expectedReceiptDate: null }),
      ],
    })

    expect(rows.map((row) => [row.purchaseOrderNumber, row.expectedReceiptDate, row.overdue])).toEqual([
      ['PO2', '2026-11-10', true],
      ['PO1', '2026-11-30', false],
    ])
    expect(rows[1]).toMatchObject({
      latestExpectedReceiptDate: '2026-12-08',
      shipmentStatuses: ['EMBARCADO', 'EN ADUANA'],
      items: 2,
      lines: 2,
      amountsByCurrency: { USD: { amount: 150, lines: 2, linesWithoutAmount: 0, linesHidden: 0 } },
      costHidden: false,
    })
    // Never converted between currencies.
    expect(summary).toMatchObject({
      purchaseOrders: 2,
      upcoming: 1,
      overdue: 1,
      linesWithoutDate: 1,
      amountsByCurrency: {
        USD: { amount: 150 },
        MXN: { amount: 2000 },
      },
    })
  })

  it('returns null amounts, never 0, without cost access', () => {
    const { rows, summary } = buildArrivals({
      cutoff: CUTOFF,
      lines: [
        line({ costVisible: false, amount: null, currency: null }),
        line({ amount: null }),
      ],
    })

    expect(rows[0]).toMatchObject({
      costHidden: true,
      amountsByCurrency: {
        SIN_MONEDA: { amount: null, lines: 1, linesHidden: 1 },
        USD: { amount: null, lines: 1, linesWithoutAmount: 1 },
      },
    })
    expect(summary.costHidden).toBe(true)
  })
})

describe('MD-003-HOTFIX1 arrivals by status', () => {
  const { rows } = buildArrivals({
    cutoff: CUTOFF,
    lines: [
      line({ purchaseOrderNumber: 'UP-LATER', expectedReceiptDate: '2026-12-05' }),
      line({ purchaseOrderNumber: 'OLD', expectedReceiptDate: '2026-08-10' }),
      line({ purchaseOrderNumber: 'UP-SOON', expectedReceiptDate: '2026-11-24' }),
      line({ purchaseOrderNumber: 'RECENT', expectedReceiptDate: '2026-11-20' }),
      line({ purchaseOrderNumber: 'MIDDLE', expectedReceiptDate: '2026-10-01' }),
    ],
  })

  it('lists upcoming orders soonest first', () => {
    expect(ARRIVAL_ROW_STATUSES).toEqual(['upcoming', 'overdue'])
    expect(selectArrivalRows(rows, 'upcoming').map((row) => row.purchaseOrderNumber)).toEqual([
      'UP-SOON', 'UP-LATER',
    ])
  })

  it('lists overdue orders most recent first', () => {
    expect(selectArrivalRows(rows, 'overdue').map((row) => row.purchaseOrderNumber)).toEqual([
      'RECENT', 'MIDDLE', 'OLD',
    ])
  })

  it('keeps the original order without status', () => {
    expect(selectArrivalRows(rows).map((row) => row.purchaseOrderNumber)).toEqual([
      'OLD', 'MIDDLE', 'RECENT', 'UP-SOON', 'UP-LATER',
    ])
    expect(selectArrivalRows(rows)).toBe(rows)
  })
})

describe('MD-002-HOTFIX1 inventory coverage', () => {
  it('uses the item records when the import has them', () => {
    expect(resolveInventoryCoverage({
      itemRecords: 4682, itemRecordsWithPositions: 2098, itemRecordsWithStatus: 4682,
      positionArticles: 2098, positionsHaveStatus: true,
    })).toEqual({
      coverage: {
        complete: true, source: 'items', articles: 4682, articlesWithPositions: 2098, reason: null,
      },
      hasCatalogStatus: true,
    })
  })

  it('falls back to the positions of an older load, flagged as incomplete', () => {
    expect(resolveInventoryCoverage({
      itemRecords: 0, itemRecordsWithPositions: 0, itemRecordsWithStatus: 0,
      positionArticles: 2098, positionsHaveStatus: false,
    })).toEqual({
      coverage: {
        complete: false,
        source: 'positions',
        articles: null,
        articlesWithPositions: 2098,
        reason: 'inventory-loaded-before-item-records',
      },
      hasCatalogStatus: false,
    })
  })

  it('keeps the position count of each alert row, null without item records', () => {
    const { outOfStock } = buildStockAlerts({
      items: [item({ itemKey: 'EMPTY', positions: 0 }), item({ itemKey: 'OLD', itemCode: 'OLD' })],
      salesByItem: new Map(),
      linesByItem: new Map(),
      window: WINDOW,
      cutoff: CUTOFF,
    })

    expect(outOfStock.map((row) => [row.itemKey, row.positions])).toEqual([
      ['EMPTY', 0],
      ['OLD', null],
    ])
  })
})

describe('MD-002 freshness and paging', () => {
  // 20:00 on 20 Nov 2026 in Mexico City = 02:00 UTC on 21 Nov.
  const NOW = new Date('2026-11-21T02:00:00.000Z')

  it('is stale after 7 calendar days, measured in Mexico City', () => {
    expect(sourceFreshness({ lastImportedAt: '2026-11-14T01:30:00.000Z' }, NOW)).toMatchObject({
      referenceDate: '2026-11-13', daysSince: 7, status: 'up-to-date', stale: false,
    })
    expect(sourceFreshness({ lastImportedAt: '2026-11-13T01:30:00.000Z' }, NOW)).toMatchObject({
      referenceDate: '2026-11-12', daysSince: 8, status: 'stale', stale: true,
    })
    expect(sourceFreshness({ lastImportedAt: null, dataCutoff: '2026-11-20' }, NOW)).toMatchObject({
      daysSince: 0, status: 'up-to-date',
    })
    expect(sourceFreshness({ lastImportedAt: null }, NOW)).toMatchObject({
      lastImportedAt: null, daysSince: null, status: 'no-data', stale: null,
    })
  })

  it('pages rows with the total', () => {
    expect(pageRows([1, 2, 3], 2, 0)).toEqual({ total: 3, hasMore: true, rows: [1, 2] })
    expect(pageRows([1, 2, 3], 2, 2)).toEqual({ total: 3, hasMore: false, rows: [3] })
  })
})
