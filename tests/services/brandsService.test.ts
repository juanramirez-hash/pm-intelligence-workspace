// MB-001 brand page: SQL reads with a fake pool (no PostgreSQL).

import { describe, expect, it, vi } from 'vitest'

import {
  allBrandKeysQuery,
  annualTargetFrom,
  brandIdentityQuery,
  brandTeamQueries,
  customerCountsQuery,
  customerRowsQuery,
  documentsQuery,
  exportLinesQuery,
  inventoryForItemsQuery,
  loadBrandIdentity,
  loadBrandSalesDates,
  loadBrandTeam,
  loadCustomerRows,
  loadDocuments,
  loadExportLines,
  loadInventoryForItems,
  loadLostProducts,
  loadMonthlySeriesRows,
  loadProductRows,
  loadTargetsRange,
  loadYearWindows,
  lostProductsQuery,
  monthlySeriesQuery,
  productRowsQuery,
  targetsRangeQuery,
  yearWindowsQuery,
} from '../../server/services/brandsService.js'

import {
  buildYearWindowPlan,
} from '../../server/services/brandRules.js'

function fakePool(...results: Array<Array<Record<string, unknown>>>) {
  const query = vi.fn(async () => ({ rows: results.shift() ?? [] }))

  return {
    pool: { query },
    sql: (index = 0) => String((query.mock.calls[index] as unknown[])[0]),
    params: (index = 0) => (query.mock.calls[index] as unknown[])[1] as unknown[],
    calls: () => query.mock.calls.length,
  }
}

const COMPARISON = {
  currentFrom: '2026-11-01',
  currentTo: '2026-11-24',
  previousFrom: '2026-10-01',
  previousTo: '2026-10-23',
}

describe('MB-001 queries never interpolate values', () => {
  const brand = 'UNVUNIVIEW'
  const plan = buildYearWindowPlan('2026-11', '2026-11-24')
  const queries = [
    brandIdentityQuery(brand),
    brandTeamQueries(brand).pms,
    brandTeamQueries(brand).assistants,
    allBrandKeysQuery(),
    yearWindowsQuery(brand, plan.windows),
    monthlySeriesQuery(brand, '2024-12', '2026-11'),
    targetsRangeQuery(brand, '2024-12', '2026-12'),
    documentsQuery(brand, '2026-11-01', '2026-11-30', 50, 0),
    exportLinesQuery(brand, '2026-11-01', '2026-11-30', 20000),
    customerRowsQuery(brand, COMPARISON, 'activos', 50, 0),
    customerCountsQuery(brand, COMPARISON),
    productRowsQuery(brand, COMPARISON, 50, 0),
    lostProductsQuery(brand, { baseFrom: '2026-08', baseTo: '2026-08', inactiveFrom: '2026-09', inactiveTo: '2026-10' }, 50, 0),
    inventoryForItemsQuery(41, ['A-1']),
  ]

  it('sends the brand, dates and limits as parameters', () => {
    for (const query of queries) {
      expect(query.sql).not.toContain(brand)
      expect(query.sql).not.toMatch(/2026-1[01]-\d\d/)
      // Every placeholder has a parameter.
      const placeholders = [...new Set(query.sql.match(/\$\d+/g) ?? [])].map((item) => Number(item.slice(1)))

      expect(Math.max(0, ...placeholders)).toBe(query.params.length)
    }
  })
})

describe('MB-001 identity and team', () => {
  it('knows a brand by sales, target, assignment or products and prefers the sales label', async () => {
    const { pool, sql, params } = fakePool([{
      known: true, label: 'GEOVISION', first_sale_date: '2019-03-04', last_sale_date: '2026-06-18',
    }])

    expect(await loadBrandIdentity(pool, 'GEOVISION')).toEqual({
      known: true, label: 'GEOVISION', firstSaleDate: '2019-03-04', lastSaleDate: '2026-06-18',
    })
    expect(sql()).toContain('FROM brand_period_metrics WHERE brand_key = $1')
    expect(sql()).toContain('FROM brand_targets')
    expect(sql()).toContain('FROM app_user_brand_assignments')
    expect(sql()).toContain('FROM products')
    expect(params()).toEqual(['GEOVISION'])
  })

  it('answers unknown for a brand with nothing, labelled by its key', async () => {
    const { pool } = fakePool([{ known: false, label: null, first_sale_date: null, last_sale_date: null }])

    expect(await loadBrandIdentity(pool, 'NADA')).toEqual({
      known: false, label: 'NADA', firstSaleDate: null, lastSaleDate: null,
    })
  })

  it('lists active PMs and the assistants that see the brand (own or through a PM)', async () => {
    const { pool, sql, params } = fakePool(
      [{ id: '7', name: 'Luis Mayorga' }],
      [{ id: '5', name: 'Olivia Lopez' }],
    )

    expect(await loadBrandTeam(pool, 'UNVUNIVIEW')).toEqual({
      pms: [{ id: 7, name: 'Luis Mayorga' }],
      assistants: [{ id: 5, name: 'Olivia Lopez' }],
    })
    expect(sql(0)).toContain("u.active = TRUE AND u.role = 'pm'")
    expect(sql(1)).toContain("u.role = 'assistant'")
    expect(sql(1)).toContain('app_user_pm_links')
    expect(sql(1)).toContain("pm.active = TRUE AND pm.role = 'pm'")
    expect(params(1)).toEqual(['UNVUNIVIEW'])
  })

  it('reads the first and last sale of many brands in one query', async () => {
    const { pool, params, calls } = fakePool([
      { brand_key: 'GEOVISION', first_sale_date: '2019-03-04', last_sale_date: '2026-06-18' },
    ])

    expect(await loadBrandSalesDates(pool, ['GEOVISION', 'UNVUNIVIEW'])).toEqual(
      new Map([['GEOVISION', { firstSaleDate: '2019-03-04', lastSaleDate: '2026-06-18' }]]),
    )
    expect(calls()).toBe(1)
    expect(params()).toEqual([['GEOVISION', 'UNVUNIVIEW']])
  })
})

describe('MB-001 year windows', () => {
  const plan = buildYearWindowPlan('2026-11', '2026-11-24')

  it('reads the 8 windows in one query, one scan, so every window answers', async () => {
    const { pool, sql, params } = fakePool([
      { key: 'monthly:2026', revenue: '1500.50', gross_profit: '300', quantity: '12', documents: '4', customers: '3', products: '2', row_count: '9' },
      { key: 'fy:2024', revenue: '0', gross_profit: '0', quantity: '0', documents: '0', customers: '0', products: '0', row_count: '0' },
    ])

    const windows = await loadYearWindows(pool, 'UNVUNIVIEW', plan.windows)

    // One read of sales_facts: the brand and one overall range, then FILTER per window.
    expect(sql().match(/FROM sales_facts/g)).toHaveLength(1)
    expect(sql()).not.toContain('JOIN sales_facts')
    expect(sql()).toContain('brand_key(f.brand) = $1')
    expect(sql()).toContain('f.sale_date BETWEEN LEAST(')
    expect(sql()).toContain('AND GREATEST(')
    expect(sql()).toContain('COUNT(f.sale_date) FILTER (WHERE f.sale_date BETWEEN $3::DATE AND $4::DATE) AS row_count_0')
    expect(sql()).toContain("COUNT(DISTINCT NULLIF(f.document_number, '')) FILTER")
    expect(sql().match(/FILTER \(WHERE/g)).toHaveLength(plan.windows.length * 7)
    expect(sql()).toContain('t(key, revenue, gross_profit, quantity, documents, customers, products, row_count)')
    expect(params()).toHaveLength(1 + plan.windows.length * 3)
    expect(params().slice(0, 4)).toEqual(['UNVUNIVIEW', 'monthly:2026', '2026-11-01', '2026-11-24'])
    expect(windows.get('monthly:2026')).toEqual({
      revenue: 1500.5, grossProfit: 300, quantity: 12, documents: 4, customers: 3, products: 2, rowCount: 9,
    })
    // A year without sales answers with rowCount 0 (missing for the rules).
    expect(windows.get('fy:2024')?.rowCount).toBe(0)
  })
})

describe('MB-001 series, targets and annual quota', () => {
  it('reads the monthly series from the brand_period_metrics view', async () => {
    const { pool, sql, params } = fakePool([
      {
        period_id: '2026-11', revenue: '500', gross_profit: '100', gross_margin: '0.2', quantity: '5',
        active_customers: '3', active_products: '2', documents: '4',
      },
    ])

    expect(await loadMonthlySeriesRows(pool, 'UNVUNIVIEW', '2024-12', '2026-11')).toEqual([
      { periodId: '2026-11', revenue: 500, grossProfit: 100, grossMargin: 0.2, quantity: 5, customers: 3, products: 2, documents: 4 },
    ])
    expect(sql()).toContain('FROM brand_period_metrics')
    expect(params()).toEqual(['UNVUNIVIEW', '2024-12', '2026-11'])
  })

  it('takes the latest target of each period, like brand_period_scorecard', async () => {
    const { pool, sql } = fakePool([
      { period_id: '2026-11', target_revenue: '1000', target_gross_profit: null, target_gross_margin: '0.25' },
    ])

    expect(await loadTargetsRange(pool, 'UNVUNIVIEW', '2024-12', '2026-12')).toEqual([
      { periodId: '2026-11', revenue: 1000, grossProfit: null, grossMargin: 0.25 },
    ])
    expect(sql()).toContain('DISTINCT ON (period_id)')
    expect(sql()).toContain('ORDER BY period_id, updated_at DESC, id DESC')
  })

  it('sums the monthly targets of the year; none means no annual quota', () => {
    const rows = [
      { periodId: '2026-01', revenue: 100, grossProfit: null, grossMargin: null },
      { periodId: '2026-02', revenue: 200, grossProfit: null, grossMargin: null },
      { periodId: '2025-12', revenue: 999, grossProfit: null, grossMargin: null },
      { periodId: '2026-03', revenue: null, grossProfit: 10, grossMargin: null },
    ]

    expect(annualTargetFrom(rows, 2026)).toEqual({ revenue: 300, monthsWithTarget: 2 })
    expect(annualTargetFrom(rows, 2027)).toBeNull()
  })

  it('counts the months with quota of the year (10 de 12) and ignores months without revenue quota', () => {
    const months = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, '0')}`)
    const rows = months.map((periodId, index) => ({
      periodId,
      revenue: index < 10 ? 100 : null,
      grossProfit: 5,
      grossMargin: null,
    }))

    expect(annualTargetFrom(rows, 2026)).toEqual({ revenue: 1000, monthsWithTarget: 10 })
  })
})

describe('MB-001 documents and export', () => {
  it('pages the documents of the brand with their totals', async () => {
    const { pool, sql, params } = fakePool(
      [
        {
          document_number: 'F-1', sale_date: '2026-11-20', customer_id: 'C-1', customer_name: 'Cliente', sales_rep: 'Ana',
          location: 'CDMX', lines: '3', quantity: '9', revenue: '900', gross_profit: '180',
        },
        { document_number: null, sale_date: '2026-11-19', customer_id: null, customer_name: null, sales_rep: null, location: null, lines: '1', quantity: '1', revenue: '10', gross_profit: '1' },
      ],
      [{ documents: '42', lines: '120', revenue: '50000', gross_profit: '9000' }],
    )

    const result = await loadDocuments(pool, 'UNVUNIVIEW', '2026-11-01', '2026-11-30', { limit: 1, offset: 0 })

    expect(sql(0)).toContain('GROUP BY COALESCE(')
    expect(sql(0)).toContain("'SIN-DOC:'")
    expect(params(0)).toEqual(['UNVUNIVIEW', '2026-11-01', '2026-11-30', 2, 0])
    expect(result).toMatchObject({ total: 42, lines: 120, revenue: 50000, grossProfit: 9000, hasMore: true })
    expect(result.rows).toEqual([{
      documentNumber: 'F-1', saleDate: '2026-11-20', customerId: 'C-1', customerName: 'Cliente', salesRep: 'Ana',
      location: 'CDMX', lines: 3, quantity: 9, revenue: 900, grossProfit: 180,
    }])
  })

  it('exports the lines of the period and flags a truncated export', async () => {
    const line = (index: number) => ({
      sale_date: '2026-11-02', document_number: `F-${index}`, customer_id: 'C', customer_name: 'Cliente',
      sales_rep: null, location: null, product_name: 'ABC-1', model: 'M1', quantity: '1', revenue: '10', gross_profit: '2',
    })
    const { pool, params } = fakePool([line(1), line(2), line(3)])

    const result = await loadExportLines(pool, 'UNVUNIVIEW', '2026-11-01', '2026-11-30', 2)

    expect(params()).toEqual(['UNVUNIVIEW', '2026-11-01', '2026-11-30', 3])
    expect(result.truncated).toBe(true)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({ documentNumber: 'F-1', productCode: 'ABC-1', model: 'M1', revenue: 10, grossProfit: 2 })
  })
})

describe('MB-001 customers', () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    customer_id: 'C-1', customer_name: 'Cliente Uno', revenue: '900', gross_profit: '90', documents: '3',
    current_rows: '5', previous_revenue: '600', previous_gross_profit: '60', last_sale_date: '2026-11-20',
    active_total: '40', rising_total: '12', falling_total: '9', ...overrides,
  })

  it('selects, orders and filters each customer filter in SQL', () => {
    const activos = customerRowsQuery('UNVUNIVIEW', COMPARISON, 'activos', 50, 0)
    const suben = customerRowsQuery('UNVUNIVIEW', COMPARISON, 'suben', 50, 0)
    const bajan = customerRowsQuery('UNVUNIVIEW', COMPARISON, 'bajan', 50, 0)

    expect(activos.sql).toContain('WHERE current_rows > 0')
    expect(activos.sql).toContain('ORDER BY revenue DESC, customer_id')
    expect(suben.sql).toContain('WHERE revenue - previous_revenue > 0')
    expect(suben.sql).toContain('ORDER BY (revenue - previous_revenue) DESC')
    expect(bajan.sql).toContain('WHERE revenue - previous_revenue < 0')
    expect(bajan.sql).toContain('ORDER BY (revenue - previous_revenue) ASC')
    // The previous window starts the range: one pass over both windows.
    expect(activos.sql).toContain('f.sale_date BETWEEN $4::DATE AND $3::DATE')
    expect(activos.params).toEqual([
      'UNVUNIVIEW', '2026-11-01', '2026-11-24', '2026-10-01', '2026-10-23', 51, 0,
    ])
    expect(() => customerRowsQuery('X', COMPARISON, 'inventado', 50, 0)).toThrow('Filtro de clientes desconocido')
  })

  it('takes the counts of every filter from the page itself', async () => {
    const { pool, calls } = fakePool([row(), row({ customer_id: 'C-2' })])

    const result = await loadCustomerRows(pool, 'UNVUNIVIEW', COMPARISON, 'activos', { limit: 1, offset: 0 })

    expect(calls()).toBe(1)
    expect(result.counts).toEqual({ activos: 40, suben: 12, bajan: 9 })
    expect(result.hasMore).toBe(true)
    expect(result.rows).toEqual([{
      customerId: 'C-1', customerName: 'Cliente Uno', revenue: 900, previousRevenue: 600, grossProfit: 90,
      previousGrossProfit: 60, documents: 3, lastSaleDate: '2026-11-20',
    }])
  })

  it('asks for the counts when the page is empty, and a customer without id has null id', async () => {
    const { pool, sql, calls } = fakePool([], [{ active: '4', rising: '0', falling: '1' }])

    const empty = await loadCustomerRows(pool, 'UNVUNIVIEW', COMPARISON, 'suben', { limit: 50, offset: 0 })

    expect(calls()).toBe(2)
    expect(sql(1)).toContain('COUNT(*) FILTER (WHERE current_rows > 0) AS active')
    expect(empty.counts).toEqual({ activos: 4, suben: 0, bajan: 1 })

    const { pool: second } = fakePool([row({ customer_id: '' })])

    expect((await loadCustomerRows(second, 'UNVUNIVIEW', COMPARISON, 'activos', { limit: 50, offset: 0 })).rows[0]?.customerId).toBeNull()
  })
})

describe('MB-001 products', () => {
  it('lists the products sold in the window against the previous one, by item code', async () => {
    const { pool, sql, params } = fakePool([{
      item_key: 'ABC-1', item_code: 'ABC-1', model: 'M1', quantity: '9', revenue: '900', gross_profit: '90',
      current_rows: '5', previous_quantity: '4', previous_revenue: '400', previous_gross_profit: '40', sold_total: '120',
    }])

    const result = await loadProductRows(pool, 'UNVUNIVIEW', COMPARISON, { limit: 50, offset: 0 })

    expect(sql()).toContain("UPPER(BTRIM(REGEXP_REPLACE(f.product_name, '\\s+', ' ', 'g')))")
    expect(sql()).toContain('WHERE current_rows > 0')
    expect(params()).toEqual(['UNVUNIVIEW', '2026-11-01', '2026-11-24', '2026-10-01', '2026-10-23', 51, 0])
    expect(result).toMatchObject({ soldTotal: 120, hasMore: false })
    expect(result.rows[0]).toEqual({
      itemKey: 'ABC-1', itemCode: 'ABC-1', model: 'M1', quantity: 9, previousQuantity: 4, revenue: 900,
      previousRevenue: 400, grossProfit: 90, previousGrossProfit: 40,
    })
  })

  it('finds products that sold in the base month and in none of the inactive months', async () => {
    const window = { baseFrom: '2026-08', baseTo: '2026-08', inactiveFrom: '2026-09', inactiveTo: '2026-10' }
    const { pool, sql, params } = fakePool([{
      item_key: 'OLD-1', item_code: 'OLD-1', model: null, base_revenue: '700', base_quantity: '7', base_gross_profit: '70', lost_total: '3',
    }])

    const result = await loadLostProducts(pool, 'UNVUNIVIEW', window, { limit: 50, offset: 0 })

    expect(sql()).toContain('HAVING SUM(f.revenue) FILTER (WHERE f.sale_date BETWEEN $2::DATE AND $3::DATE) > 0')
    expect(sql()).toContain('COUNT(*) FILTER (WHERE f.sale_date BETWEEN $4::DATE AND $5::DATE) = 0')
    expect(params()).toEqual(['UNVUNIVIEW', '2026-08-01', '2026-08-31', '2026-09-01', '2026-10-31', 51, 0])
    expect(result.total).toBe(3)
    expect(result.rows[0]).toMatchObject({ itemKey: 'OLD-1', model: null, baseRevenue: 700 })
  })

  it('reads stock and catalog status of the latest import; nothing to read for no items', async () => {
    const { pool, sql, params } = fakePool([
      { item_key: 'ABC-1', on_hand: '0.0000', on_order: '40.0000', catalog_status: 'DE LINEA', last_sale_date: '2026-11-02' },
    ])

    expect(await loadInventoryForItems(pool, 41, ['ABC-1', 'ZZZ'])).toEqual(
      new Map([['ABC-1', { onHand: 0, pendingReceiptUnits: 40, catalogStatus: 'DE LINEA', lastSaleDate: '2026-11-02' }]]),
    )
    expect(sql()).toContain('FROM inventory_items')
    expect(sql()).toContain('WHERE import_id = $1')
    expect(params()).toEqual([41, ['ABC-1', 'ZZZ']])

    const none = fakePool()

    expect(await loadInventoryForItems(none.pool, 41, [])).toEqual(new Map())
    expect(none.calls()).toBe(0)
  })
})
