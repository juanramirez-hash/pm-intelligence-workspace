// MD-001 "Mi día": status, trend, attention, pace and portfolio rules.

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  ATTENTION_REASONS,
  attentionReason,
  buildMyDayBrands,
  buildMyDayPortfolio,
  emptyMetrics,
  lifecycleStatus,
  participation,
  quotaPace,
  resolvePeriodWindow,
  trendStatus,
  variationPercentage,
} from '../../server/services/myDayRules.js'

const sold = (revenue: number, extra: Record<string, number> = {}) => ({
  ...emptyMetrics(),
  revenue,
  grossProfit: revenue * 0.2,
  quantity: 1,
  documents: 1,
  customers: 1,
  products: 1,
  ...extra,
})

describe('MD-001 lifecycle status', () => {
  it('follows the five Executive states', () => {
    const none = emptyMetrics()

    expect(lifecycleStatus(sold(10), none, false)).toBe('new')
    expect(lifecycleStatus(sold(10), none, true)).toBe('recovered')
    expect(lifecycleStatus(none, sold(10), true)).toBe('lost')
    expect(lifecycleStatus(none, none, true)).toBe('inactive')
    expect(lifecycleStatus(sold(10), sold(5), false)).toBe('active')
  })

  it('counts customers or products as activity, like Executive', () => {
    expect(
      lifecycleStatus({ ...emptyMetrics(), customers: 1 }, emptyMetrics(), false),
    ).toBe('new')
  })
})

describe('MD-001 trend and attention', () => {
  it('uses ±5 % as stable, both edges included', () => {
    expect(trendStatus(105, 100)).toBe('stable')
    expect(trendStatus(95, 100)).toBe('stable')
    expect(trendStatus(105.01, 100)).toBe('growing')
    expect(trendStatus(94.99, 100)).toBe('declining')
    expect(trendStatus(10, 0)).toBe('without_comparison')
    expect(trendStatus(0, 0)).toBe('without_comparison')
  })

  it('needs attention when lost, inactive or falling 15 % or more', () => {
    expect(attentionReason('lost', 'declining', -1)).toBe(ATTENTION_REASONS.lost)
    expect(attentionReason('inactive', 'without_comparison', 0)).toBe(
      ATTENTION_REASONS.inactive,
    )
    expect(attentionReason('active', 'declining', -0.15)).toBe(
      ATTENTION_REASONS.declining,
    )
    expect(attentionReason('active', 'declining', -0.149)).toBeNull()
    expect(attentionReason('active', 'growing', 0.5)).toBeNull()
  })

  it('returns NULL variation when the previous value is 0', () => {
    expect(variationPercentage(10, 0)).toBeNull()
    expect(variationPercentage(0, 0)).toBe(0)
    expect(variationPercentage(80, 100)).toBeCloseTo(-0.2)
  })

  it('shares inside the portfolio, 0 without sales', () => {
    expect(participation(25, 100)).toBe(0.25)
    expect(participation(0, 0)).toBe(0)
  })
})

describe('MD-001 period window', () => {
  it('compares an open month with the same weekdays of the previous one', () => {
    // 20 Nov 2026 (Friday) is the 15th weekday; the 15th weekday of
    // October 2026 is the 21st.
    expect(resolvePeriodWindow('2026-11', '2026-11-20')).toMatchObject({
      periodStatus: 'open',
      previousPeriod: '2026-10',
      comparison: {
        basis: 'equivalent-working-days',
        currentFrom: '2026-11-01',
        currentTo: '2026-11-20',
        previousFrom: '2026-10-01',
        previousTo: '2026-10-21',
        holidaysExcluded: false,
      },
      workingDays: { elapsed: 15, total: 21, remaining: 6, holidaysExcluded: false },
    })
  })

  it('compares full months once closed', () => {
    expect(resolvePeriodWindow('2026-10', '2026-11-20')).toMatchObject({
      periodStatus: 'closed',
      comparison: {
        basis: 'full-month',
        currentTo: '2026-10-31',
        previousTo: '2026-09-30',
      },
      workingDays: { elapsed: 22, total: 22, remaining: 0 },
    })
  })

  it('uses the full previous month before the first weekday', () => {
    // 1 Nov 2026 is a Sunday: no weekday elapsed (Executive fallback).
    expect(resolvePeriodWindow('2026-11', '2026-11-01')).toMatchObject({
      periodStatus: 'open',
      comparison: { basis: 'full-previous-month', previousTo: '2026-10-31' },
      workingDays: { elapsed: 0, total: 21, remaining: 21 },
    })
  })

  it('has no data for a period after the cutoff', () => {
    expect(resolvePeriodWindow('2026-12', '2026-11-20')).toMatchObject({
      periodStatus: 'after-cutoff',
      comparison: null,
    })
  })
})

describe('MD-001 quota pace', () => {
  const open = { elapsed: 15, total: 21, remaining: 6, holidaysExcluded: false }

  it('projects the close by weekdays and spreads the gap over the remaining ones', () => {
    expect(quotaPace(150, 300, open, 'open')).toEqual({
      attainment: 0.5,
      gap: 150,
      projectedRevenue: 210,
      projectedAttainment: 0.7,
      dailyGap: 25,
    })
  })

  it('gives a daily gap of 0 once the quota is reached', () => {
    expect(quotaPace(400, 300, open, 'open')).toMatchObject({ gap: 0, dailyGap: 0 })
  })

  it('keeps the revenue as close and no daily gap once the month closed', () => {
    expect(
      quotaPace(150, 300, { elapsed: 21, total: 21, remaining: 0 }, 'closed'),
    ).toEqual({
      attainment: 0.5,
      gap: 150,
      projectedRevenue: 150,
      projectedAttainment: 0.5,
      dailyGap: null,
    })
  })

  it('returns NULL without target or before the first weekday', () => {
    expect(quotaPace(150, null, open, 'open')).toMatchObject({
      attainment: null,
      gap: null,
      projectedRevenue: 210,
      projectedAttainment: null,
      dailyGap: null,
    })
    expect(
      quotaPace(0, 300, { elapsed: 0, total: 21, remaining: 21 }, 'open'),
    ).toMatchObject({ projectedRevenue: null, projectedAttainment: null, dailyGap: 300 / 21 })
  })
})

describe('MD-001 brands and portfolio', () => {
  const window = resolvePeriodWindow('2026-11', '2026-11-20')
  const brands = buildMyDayBrands({
    window,
    brands: [
      { brandKey: 'UNV', brandLabel: 'UNV' },
      { brandKey: 'HIKVISION', brandLabel: 'HIKVISION' },
      { brandKey: 'NUEVA', brandLabel: 'NUEVA' },
    ],
    current: new Map([
      ['UNV', sold(300)],
      ['HIKVISION', sold(100)],
    ]),
    previous: new Map([
      ['UNV', sold(250)],
      ['HIKVISION', sold(200)],
    ]),
    targets: new Map([
      ['UNV', { revenue: 600, grossProfit: null, grossMargin: null, workingDays: 20 }],
    ]),
    activeBeforePrevious: new Set(['UNV', 'HIKVISION', 'NUEVA']),
    lostCustomers: new Map([['HIKVISION', 2]]),
  })

  it('builds each brand like the Executive table, sorted by revenue', () => {
    expect(brands.map((brand) => brand.brandKey)).toEqual([
      'UNV',
      'HIKVISION',
      'NUEVA',
    ])
    expect(brands[0]).toMatchObject({
      revenue: 300,
      target: { revenue: 600, workingDays: 20 },
      attainment: 0.5,
      projectedRevenue: 420,
      dailyGap: 50,
      revenueVariationPercentage: 0.2,
      trendStatus: 'growing',
      lifecycleStatus: 'active',
      participation: 0.75,
      requiresAttention: false,
    })
    expect(brands[1]).toMatchObject({
      target: null,
      attainment: null,
      trendStatus: 'declining',
      requiresAttention: true,
      attentionReason: ATTENTION_REASONS.declining,
      lostCustomers: 2,
    })
    // An assigned brand without any sale still appears.
    expect(brands[2]).toMatchObject({
      revenue: 0,
      lifecycleStatus: 'inactive',
      grossMargin: null,
      requiresAttention: true,
    })
  })

  it('totals the portfolio and computes the quota only over brands with target', () => {
    expect(buildMyDayPortfolio(brands, window)).toMatchObject({
      brands: 3,
      brandsWithTarget: 1,
      revenue: 400,
      revenueWithTarget: 300,
      target: 600,
      attainment: 0.5,
      projectedRevenue: 560,
      projectedRevenueWithTarget: 420,
      projectedAttainment: 0.7,
      gap: 300,
      dailyGap: 50,
      previousRevenue: 450,
      brandsRequiringAttention: 2,
      lostCustomers: 2,
    })
  })
})
