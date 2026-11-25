// MD-001 "Mi día": SQL reads with a fake pool (no PostgreSQL).

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  countLostCustomers,
  labelBrands,
  loadActiveBeforePrevious,
  loadActiveBrandKeys,
  loadLostCustomers,
  loadTargets,
  loadWindowMetrics,
  resolveLossWindow,
} from '../../server/services/myDayService.js'

function fakePool(rows: Array<Record<string, unknown>> = []) {
  const query = vi.fn(async () => ({ rows }))

  return {
    pool: { query },
    sql: () => String((query.mock.calls[0] as unknown[])[0]),
    params: () => (query.mock.calls[0] as unknown[])[1] as unknown[],
  }
}

const COMPARISON = {
  currentFrom: '2026-11-01',
  currentTo: '2026-11-20',
  previousFrom: '2026-10-01',
  previousTo: '2026-10-21',
}

describe('MD-001 my day service', () => {
  it('reads both windows by sale_date and the brands as a parameter', async () => {
    const { pool, sql, params } = fakePool([
      {
        label: 'current', brand_key: 'UNV', revenue: '1500.50', gross_profit: '300.10',
        quantity: '12', documents: '4', customers: '3', products: '2',
      },
      {
        label: 'previous', brand_key: 'UNV', revenue: '1000', gross_profit: '250',
        quantity: '10', documents: '3', customers: '2', products: '2',
      },
    ])

    const result = await loadWindowMetrics(pool, ['UNV', 'HIKVISION'], COMPARISON)

    expect(sql()).toContain('f.sale_date BETWEEN w.date_from AND w.date_to')
    expect(sql()).toContain('brand_key(f.brand) = ANY($5::TEXT[])')
    expect(sql()).not.toContain('UNV')
    expect(params()).toEqual([
      '2026-11-01', '2026-11-20', '2026-10-01', '2026-10-21', ['UNV', 'HIKVISION'],
    ])
    expect(result.current.get('UNV')).toEqual({
      revenue: 1500.5, grossProfit: 300.1, quantity: 12,
      documents: 4, customers: 3, products: 2,
    })
    expect(result.previous.get('UNV')?.revenue).toBe(1000)
    expect(result.current.has('HIKVISION')).toBe(false)
  })

  it('takes the latest target per brand, like brand_period_scorecard', async () => {
    const { pool, sql, params } = fakePool([
      {
        brand_key: 'UNV', target_revenue: '600000', target_gross_profit: null,
        target_gross_margin: '0.18', working_days: '20',
      },
    ])

    const targets = await loadTargets(pool, ['UNV'], '2026-11')

    expect(sql()).toContain('ORDER BY brand_key(brand_id), updated_at DESC, id DESC')
    expect(params()).toEqual(['2026-11', ['UNV']])
    expect(targets.get('UNV')).toEqual({
      revenue: 600000, grossProfit: null, grossMargin: 0.18, workingDays: 20,
    })
  })

  it('finds activity before the previous period for new vs recovered', async () => {
    const { pool, sql, params } = fakePool([{ brand_key: 'UNV' }])

    const active = await loadActiveBeforePrevious(pool, ['UNV', 'NUEVA'], '2026-10')

    expect(sql()).toContain('period_id < $2')
    expect(params()).toEqual([['UNV', 'NUEVA'], '2026-10'])
    expect([...active]).toEqual(['UNV'])
  })

  it('lists every brand with sales or target for scope all without assignments', async () => {
    const { pool, sql, params } = fakePool([
      { brand_key: 'HIKVISION' }, { brand_key: 'UNV' }, { brand_key: null },
    ])

    expect(await loadActiveBrandKeys(pool, '2026-11', '2026-10')).toEqual([
      'HIKVISION', 'UNV',
    ])
    expect(sql()).toContain('FROM brand_period_metrics')
    expect(sql()).toContain('FROM brand_targets')
    expect(params()).toEqual([['2026-11', '2026-10']])
  })

  it('uses the lost-customers rule of /api/metrics for several brands', async () => {
    const window = resolveLossWindow('2026-11', '2026-11-20', 2, 1)

    expect(window).toEqual({
      baseFrom: '2026-08', baseTo: '2026-08', inactiveFrom: '2026-09', inactiveTo: '2026-10',
    })

    const listed = fakePool([
      {
        brand_key: 'UNV', customer_id: 'C-2', customer_name: 'Dos', base_revenue: '900',
        base_gross_profit: '90', active_months: '1', last_sale_date: '2026-08-20',
        avg_monthly_revenue: '900.00',
      },
      { brand_key: 'UNV', customer_id: 'C-3' },
    ])

    const lost = await loadLostCustomers(listed.pool, ['UNV'], window!, { limit: 1, offset: 0 })

    expect(listed.sql()).toContain('NOT EXISTS')
    expect(listed.sql()).toContain('r.brand_key = m.brand_key AND r.customer_id = m.customer_id')
    expect(listed.sql()).toContain('HAVING SUM(m.revenue) > 0')
    expect(listed.params()).toEqual([['UNV'], '2026-08', '2026-08', '2026-09', '2026-10', 2, 0])
    expect(lost).toEqual({
      hasMore: true,
      rows: [{
        brandKey: 'UNV', customerId: 'C-2', customerName: 'Dos', baseRevenue: 900,
        baseGrossProfit: 90, activeMonths: 1, lastSaleDate: '2026-08-20', avgMonthlyRevenue: 900,
      }],
    })

    const counted = fakePool([{ brand_key: 'UNV', customers: '7' }])

    expect(await countLostCustomers(counted.pool, ['UNV'], window!)).toEqual(
      new Map([['UNV', 7]]),
    )
    expect(counted.sql()).toContain('GROUP BY brand_key')
    expect(resolveLossWindow('2026-11', null, 2, 1)).toBeNull()
  })

  it('labels brands with the sales label, then the assignment, then the key', () => {
    expect(
      labelBrands(
        ['STREAMAXMERIVA', 'UNV', 'NUEVA'],
        new Map([['STREAMAXMERIVA', 'STREAMAX - MERIVA']]),
        ['unv'],
      ),
    ).toEqual([
      { brandKey: 'STREAMAXMERIVA', brandLabel: 'STREAMAX - MERIVA' },
      { brandKey: 'UNV', brandLabel: 'unv' },
      { brandKey: 'NUEVA', brandLabel: 'NUEVA' },
    ])
  })
})
