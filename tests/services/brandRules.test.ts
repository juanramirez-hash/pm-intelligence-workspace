// MB-001 brand page rules: periods, equivalent working days, year over year,
// annual projection, month against month, monthly series and cost
// visibility. Pure functions, no PostgreSQL.

import { describe, expect, it } from 'vitest'

import {
  BRAND_RULES,
  assembleMonthComparison,
  assembleYearComparison,
  buildMonthlySeries,
  buildYearWindowPlan,
  costVisibleForBrand,
  equivalentWorkingDayCutoff,
  periodOptions,
  resolveBrandPeriod,
  resolveComparableMonthCutoffs,
  variationSet,
} from '../../server/services/brandRules.js'

import {
  resolvePeriodWindow,
} from '../../server/services/myDayRules.js'

const metrics = (revenue: number, grossProfit: number, extra: Record<string, number> = {}) => ({
  revenue,
  grossProfit,
  quantity: 10,
  documents: 4,
  customers: 3,
  products: 2,
  rowCount: 8,
  ...extra,
})

describe('MB-001 periods', () => {
  it('offers the cutoff month and the 11 before it, newest first', () => {
    const options = periodOptions('2026-11-24')

    expect(options).toHaveLength(12)
    expect(options[0]).toBe('2026-11')
    expect(options[11]).toBe('2025-12')
    expect(periodOptions(null)).toEqual([])
    expect(periodOptions('2026-02-10')[2]).toBe('2025-12')
  })

  it('defaults to the cutoff month and rejects months out of range with 400', () => {
    expect(resolveBrandPeriod(undefined, '2026-11-24')).toBe('2026-11')
    expect(resolveBrandPeriod('2025-12', '2026-11-24')).toBe('2025-12')
    expect(resolveBrandPeriod(undefined, null)).toBeNull()

    for (const bad of ['2025-11', '2026-12', '2026-13', 'noviembre', '']) {
      expect(() => resolveBrandPeriod(bad, '2026-11-24')).toThrow(expect.objectContaining({ statusCode: 400 }))
    }

    expect(() => resolveBrandPeriod('2025-11', '2026-11-24')).toThrow('últimos 12 meses')
  })
})

describe('MB-001 equivalent working days', () => {
  it('cuts the target month on the same weekday count (Monday to Friday)', () => {
    // 24 Nov 2026 = 17 weekdays; the 17th weekday of Nov 2025 is the 25th.
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-24', '2025-11')).toBe('2025-11-25')
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-24', '2026-10')).toBe('2026-10-23')
    // Fewer weekdays in the target month: its last day.
    expect(equivalentWorkingDayCutoff('2026-01', '2026-01-30', '2022-01')).toBe('2022-01-31')
    // No weekday elapsed yet.
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-01', '2025-11')).toBeNull()
  })

  it('adjusts every window to the shortest one when a year has fewer weekdays', () => {
    // 30 Jan 2026 = 22 weekdays; Jan 2022 only has 21: the reference.
    const cutoffs = resolveComparableMonthCutoffs('2026-01', '2026-01-30', [2026, 2022], false)

    expect(cutoffs).toEqual([
      { year: 2026, periodId: '2026-01', end: '2026-01-31', dateTo: '2026-01-29', workingDays: 21 },
      { year: 2022, periodId: '2022-01', end: '2022-01-31', dateTo: '2022-01-31', workingDays: 21 },
    ])
  })

  it('compares complete months when the month is closed', () => {
    expect(resolveComparableMonthCutoffs('2026-09', '2026-09-30', [2026, 2025, 2024], true)).toEqual([
      { year: 2026, periodId: '2026-09', end: '2026-09-30', dateTo: '2026-09-30', workingDays: 22 },
      { year: 2025, periodId: '2025-09', end: '2025-09-30', dateTo: '2025-09-30', workingDays: 22 },
      { year: 2024, periodId: '2024-09', end: '2024-09-30', dateTo: '2024-09-30', workingDays: 21 },
    ])
  })

  it('has no comparison without a weekday in the open month', () => {
    expect(resolveComparableMonthCutoffs('2026-11', '2026-11-01', [2026, 2025, 2024], false)).toBeNull()
  })
})

describe('MB-001 year window plan', () => {
  it('plans 8 windows: monthly and YTD of 3 years plus the 2 previous full years', () => {
    const plan = buildYearWindowPlan('2026-11', '2026-11-24')

    expect(plan.available).toBe(true)
    expect(plan.closed).toBe(false)
    expect(plan.windows.map((window: { key: string }) => window.key)).toEqual([
      'monthly:2026', 'ytd:2026', 'monthly:2025', 'ytd:2025', 'monthly:2024', 'ytd:2024', 'fy:2025', 'fy:2024',
    ])
    expect(plan.windows.find((window: { key: string }) => window.key === 'monthly:2025')).toMatchObject({
      dateFrom: '2025-11-01', dateTo: '2025-11-25',
    })
    expect(plan.windows.find((window: { key: string }) => window.key === 'ytd:2024')).toMatchObject({
      dateFrom: '2024-01-01', dateTo: '2024-11-25',
    })
    expect(plan.description).toContain('igual número de días laborables')
  })

  it('uses complete months for a closed month and says so', () => {
    const plan = buildYearWindowPlan('2026-09', '2026-11-24')

    expect(plan.closed).toBe(true)
    expect(plan.windows.find((window: { key: string }) => window.key === 'monthly:2026')).toMatchObject({ dateTo: '2026-09-30' })
    expect(plan.description).toContain('Mes cerrado')
  })

  it('explains why there is no comparison', () => {
    expect(buildYearWindowPlan('2026-11', null)).toMatchObject({
      available: false, description: 'No hay información suficiente para construir el comparativo multi-año.',
    })
    expect(buildYearWindowPlan('2026-12', '2026-11-24')).toMatchObject({
      available: false, currentYear: 2026, description: 'El periodo seleccionado todavía no tiene corte de datos.',
    })
    expect(buildYearWindowPlan('2026-11', '2026-11-01')).toMatchObject({
      available: false, description: 'No se pudo establecer un corte laboral equivalente para los tres años.',
    })
  })
})

describe('MB-001 annual projection', () => {
  const plan = buildYearWindowPlan('2026-11', '2026-11-24')
  const assemble = (entries: Array<[string, ReturnType<typeof metrics>]>, options = {}) =>
    assembleYearComparison(plan, new Map(entries), options)

  it('projects the year with the average share the YTD had of the full year', () => {
    const result = assemble([
      ['monthly:2026', metrics(100, 20)],
      ['ytd:2026', metrics(900, 180)],
      ['monthly:2025', metrics(90, 18)],
      ['ytd:2025', metrics(800, 160)],
      ['fy:2025', metrics(1000, 200)],
      ['monthly:2024', metrics(80, 16)],
      ['ytd:2024', metrics(600, 150)],
      ['fy:2024', metrics(1000, 250)],
    ])

    // Revenue shares 0.8 and 0.6 → 0.7; gross profit shares 0.8 and 0.6 → 0.7.
    expect(result.annual.projection).toMatchObject({
      year: 2026,
      historicalRevenueCompletionRatio: expect.closeTo(0.7, 10),
      historicalGrossProfitCompletionRatio: expect.closeTo(0.7, 10),
      historicalYearsUsed: [2025, 2024],
    })
    expect(result.annual.projection?.revenue).toBeCloseTo(900 / 0.7, 6)
    expect(result.annual.projection?.grossProfit).toBeCloseTo(180 / 0.7, 6)
    expect(result.annual.projection?.grossMargin).toBeCloseTo(0.2, 6)
    // Real closes of the two previous years are shown too.
    expect(result.annual.previousYear).toMatchObject({ periodId: '2025-FY', revenue: 1000 })
    expect(result.annual.twoYearsBack).toMatchObject({ periodId: '2024-FY', revenue: 1000 })
    expect(result.annual.projectionVariations.vsPreviousYear?.revenue.amount).toBeCloseTo(900 / 0.7 - 1000, 6)
  })

  it('shows a year without sales as missing, never as zero', () => {
    const result = assemble([
      ['monthly:2026', metrics(100, 20)],
      ['ytd:2026', metrics(900, 180)],
      ['monthly:2025', metrics(90, 18)],
      ['ytd:2025', metrics(800, 160)],
      ['fy:2025', metrics(1000, 200)],
      ['monthly:2024', metrics(0, 0, { rowCount: 0, quantity: 0, documents: 0, customers: 0, products: 0 })],
      ['ytd:2024', metrics(0, 0, { rowCount: 0 })],
      ['fy:2024', metrics(0, 0, { rowCount: 0 })],
    ])

    expect(result.monthly.twoYearsBack).toBeNull()
    expect(result.ytd.twoYearsBack).toBeNull()
    expect(result.annual.twoYearsBack).toBeNull()
    expect(result.monthly.variations.vsTwoYearsBack).toBeNull()
    expect(result.annual.projection?.historicalYearsUsed).toEqual([2025])
    expect(result.annual.projection?.revenue).toBeCloseTo(900 / 0.8, 6)
  })

  it('keeps the current window with zeros and rowCount 0 (a fact, not missing)', () => {
    const empty = { rowCount: 0, quantity: 0, documents: 0, customers: 0, products: 0 }
    const result = assemble([
      ['monthly:2026', metrics(0, 0, empty)],
      ['ytd:2026', metrics(500, 100)],
      ['ytd:2025', metrics(800, 160)],
      ['fy:2025', metrics(1000, 200)],
    ])

    expect(result.monthly.current).toMatchObject({ revenue: 0, rowCount: 0, grossMargin: null })
  })

  it('has no projection without a previous year with sales or when the share is 0', () => {
    expect(assemble([['ytd:2026', metrics(900, 180)]]).annual.projection).toBeNull()

    // A YTD of 0 (credit notes) gives a share of 0: not used.
    const zeroShare = assemble([
      ['ytd:2026', metrics(900, 180)],
      ['ytd:2025', metrics(0, 0)],
      ['fy:2025', metrics(1000, 200)],
    ])

    expect(zeroShare.annual.projection).toBeNull()

    // With another year that has a share, the zero one is not listed as used.
    const oneUsable = assemble([
      ['ytd:2026', metrics(900, 180)],
      ['ytd:2025', metrics(0, 0)],
      ['fy:2025', metrics(1000, 200)],
      ['ytd:2024', metrics(600, 150)],
      ['fy:2024', metrics(1000, 250)],
    ])

    expect(oneUsable.annual.projection?.historicalYearsUsed).toEqual([2024])
    expect(oneUsable.annual.projection?.revenue).toBeCloseTo(900 / 0.6, 6)
  })

  it('projects revenue without gross profit when that share is missing', () => {
    const result = assemble([
      ['ytd:2026', metrics(900, 180)],
      ['ytd:2025', metrics(800, 0)],
      ['fy:2025', metrics(1000, 0)],
    ])

    expect(result.annual.projection).toMatchObject({ grossProfit: null, grossMargin: null })
    expect(result.annual.projection?.revenue).toBeCloseTo(900 / 0.8, 6)
  })

  it('compares the projection with the annual quota only when there is one', () => {
    const entries: Array<[string, ReturnType<typeof metrics>]> = [
      ['ytd:2026', metrics(900, 180)],
      ['ytd:2025', metrics(800, 160)],
      ['fy:2025', metrics(1000, 200)],
    ]

    expect(assemble(entries).annual.target).toBeNull()
    expect(assemble(entries, { annualTarget: { revenue: 1500, monthsWithTarget: 12 } }).annual.target).toMatchObject({
      revenue: 1500,
      monthsWithTarget: 12,
      monthsInYear: 12,
      complete: true,
      projectedAttainment: expect.closeTo(900 / 0.8 / 1500, 10),
      ytdAttainment: expect.closeTo(900 / 1500, 10),
    })
  })

  it('reports how many months have a quota when some are missing (10 de 12)', () => {
    const entries: Array<[string, ReturnType<typeof metrics>]> = [
      ['monthly:2026', metrics(300, 60)],
      ['ytd:2026', metrics(900, 180)],
      ['ytd:2025', metrics(800, 160)],
      ['fy:2025', metrics(1000, 200)],
    ]
    const target = assemble(entries, { annualTarget: { revenue: 1250, monthsWithTarget: 10 } }).annual.target

    expect(target).toMatchObject({ revenue: 1250, monthsWithTarget: 10, monthsInYear: 12, complete: false })
  })

  it('compares each year against the previous ones: amount, percentage and margin points', () => {
    const result = assemble([
      ['monthly:2026', metrics(120, 30, { customers: 5, products: 4 })],
      ['monthly:2025', metrics(100, 20, { customers: 4, products: 4 })],
      ['monthly:2024', metrics(150, 30, { customers: 6, products: 2 })],
    ])
    const vsPrevious = result.monthly.variations.vsPreviousYear

    expect(vsPrevious?.revenue).toEqual({ amount: 20, percentage: 0.2 })
    expect(vsPrevious?.customers).toEqual({ amount: 1, percentage: 0.25 })
    expect(vsPrevious?.products).toEqual({ amount: 0, percentage: 0 })
    // 25 % margin against 20 %: +5 points.
    expect(vsPrevious?.grossMarginPoints).toBeCloseTo(5, 10)
    expect(result.monthly.variations.vsTwoYearsBack?.revenue).toEqual({ amount: -30, percentage: -0.2 })
    expect(result.monthly.variations.vsTwoYearsBack?.grossMarginPoints).toBeCloseTo(5, 10)
  })

  it('returns null gross profit and margin, with costHidden, without cost access', () => {
    const result = assemble(
      [
        ['monthly:2026', metrics(120, 30)],
        ['ytd:2026', metrics(900, 180)],
        ['monthly:2025', metrics(100, 20)],
        ['ytd:2025', metrics(800, 160)],
        ['fy:2025', metrics(1000, 200)],
      ],
      { costVisible: false },
    )
    const serialized = JSON.stringify(result)

    expect(result.costHidden).toBe(true)
    expect(result.monthly.current).toMatchObject({ revenue: 120, grossProfit: null, grossMargin: null })
    expect(result.ytd.previousYear).toMatchObject({ grossProfit: null, grossMargin: null })
    expect(result.annual.projection).toMatchObject({ grossProfit: null, grossMargin: null, historicalGrossProfitCompletionRatio: null })
    expect(result.monthly.variations.vsPreviousYear?.grossProfit).toEqual({ amount: null, percentage: null })
    expect(result.monthly.variations.vsPreviousYear?.grossMarginPoints).toBeNull()
    // The raw value never leaves the server.
    expect(serialized).not.toContain('_grossProfit')
    expect(serialized).not.toContain('"grossProfit":30')
  })

  it('answers unavailable with its description', () => {
    expect(assembleYearComparison(buildYearWindowPlan('2026-12', '2026-11-24'), new Map())).toEqual({
      available: false,
      currentYear: 2026,
      description: 'El periodo seleccionado todavía no tiene corte de datos.',
      // CAL-001: no windows, so no years to report.
      calendarMissingYears: [],
      holidaysExcluded: false,
      costHidden: false,
    })
  })
})

describe('MB-001 month against month (MD-001 rules)', () => {
  const open = resolvePeriodWindow('2026-11', '2026-11-24')

  it('compares at the equivalent working day with sales, margin, customers, products and documents', () => {
    const result = assembleMonthComparison(
      open,
      metrics(1200, 300, { customers: 6, products: 5, documents: 9 }),
      metrics(1000, 200, { customers: 4, products: 5, documents: 6 }),
    )

    expect(result).toMatchObject({
      available: true,
      basis: 'equivalent-working-days',
      periodStatus: 'open',
      current: { dateFrom: '2026-11-01', dateTo: '2026-11-24', workingDays: 17, grossMargin: 0.25 },
      previous: { dateFrom: '2026-10-01', dateTo: '2026-10-23', workingDays: 17, grossMargin: 0.2 },
    })
    expect(result.variations.revenue).toEqual({ amount: 200, percentage: 0.2 })
    expect(result.variations.customers).toEqual({ amount: 2, percentage: 0.5 })
    expect(result.variations.documents).toEqual({ amount: 3, percentage: 0.5 })
    expect(result.variations.grossMarginPoints).toBeCloseTo(5, 10)
  })

  it('compares complete months once the month is closed', () => {
    const closed = assembleMonthComparison(resolvePeriodWindow('2026-09', '2026-11-24'), metrics(10, 2), metrics(20, 4))

    expect(closed).toMatchObject({ basis: 'full-month', periodStatus: 'closed' })
    expect(closed.current.dateTo).toBe('2026-09-30')
    expect(closed.previous.dateTo).toBe('2026-08-31')
  })

  it('answers a brand without sales with zeros and null margin (GEOVISION)', () => {
    const result = assembleMonthComparison(open, undefined, undefined)

    expect(result.current).toMatchObject({ revenue: 0, grossProfit: 0, grossMargin: null, documents: 0 })
    expect(result.variations.revenue).toEqual({ amount: 0, percentage: 0 })
  })

  it('hides gross profit and margin without cost access', () => {
    const result = assembleMonthComparison(open, metrics(1200, 300), metrics(1000, 200), false)

    expect(result.costHidden).toBe(true)
    expect(result.current).toMatchObject({ revenue: 1200, grossProfit: null, grossMargin: null })
    expect(result.variations.grossProfit).toEqual({ amount: null, percentage: null })
    expect(result.variations.grossMarginPoints).toBeNull()
  })
})

describe('MB-001 variations', () => {
  it('is null when either window is missing', () => {
    expect(variationSet(null, metrics(1, 1))).toBeNull()
    expect(variationSet(metrics(1, 1), null)).toBeNull()
  })
})

describe('MB-001 monthly series', () => {
  const series = buildMonthlySeries({
    endPeriod: '2026-11',
    metricRows: [
      { periodId: '2026-11', revenue: 500, grossProfit: 100, grossMargin: 0.2, quantity: 5, customers: 3, products: 2, documents: 4 },
      { periodId: '2026-09', revenue: 900, grossProfit: 180, grossMargin: 0.2, quantity: 9, customers: 5, products: 3, documents: 8 },
    ],
    targetRows: [
      { periodId: '2026-11', revenue: 1000, grossProfit: 250, grossMargin: 0.25 },
      { periodId: '2026-10', revenue: 800, grossProfit: null, grossMargin: null },
    ],
    cutoff: '2026-11-24',
  })

  it('has 24 months ending at the selected one, oldest first', () => {
    expect(series).toHaveLength(BRAND_RULES.seriesMonths)
    expect(series[0]?.periodId).toBe('2024-12')
    expect(series.at(-1)?.periodId).toBe('2026-11')
  })

  it('shows a month without sales as missing (null), keeping its target', () => {
    const october = series.find((row) => row.periodId === '2026-10')

    expect(october).toMatchObject({
      hasSales: false, revenue: null, grossProfit: null, customers: null, attainment: null,
      target: { revenue: 800 },
    })
    expect(series.find((row) => row.periodId === '2025-03')).toMatchObject({ hasSales: false, revenue: null, target: null })
  })

  it('computes the attainment of months with sales and target, and marks the open month', () => {
    expect(series.at(-1)).toMatchObject({ hasSales: true, revenue: 500, attainment: 0.5, partial: true })
    expect(series.find((row) => row.periodId === '2026-09')).toMatchObject({ attainment: null, partial: false })
  })

  it('does not mark a closed cutoff month as partial and hides cost', () => {
    const hidden = buildMonthlySeries({
      endPeriod: '2026-11',
      metricRows: [{ periodId: '2026-11', revenue: 500, grossProfit: 100, grossMargin: 0.2, quantity: 5, customers: 3, products: 2, documents: 4 }],
      targetRows: [{ periodId: '2026-11', revenue: 1000, grossProfit: 250, grossMargin: 0.25 }],
      cutoff: '2026-11-30',
      costVisible: false,
    })

    expect(hidden.at(-1)).toMatchObject({
      partial: false, revenue: 500, grossProfit: null, grossMargin: null,
      target: { revenue: 1000, grossProfit: null, grossMargin: null },
    })
  })
})

describe('MB-001 cost visibility', () => {
  it('follows the cost scope of SEC-003A', () => {
    expect(costVisibleForBrand({ mode: 'all' }, 'UNV')).toBe(true)
    expect(costVisibleForBrand({ mode: 'assigned', brandKeys: ['UNV', 'AJAX'] }, 'UNV')).toBe(true)
    expect(costVisibleForBrand({ mode: 'assigned', brandKeys: ['AJAX'] }, 'UNV')).toBe(false)
    expect(costVisibleForBrand({ mode: 'assigned', brandKeys: [] }, 'UNV')).toBe(false)
    expect(costVisibleForBrand({ mode: 'none' }, 'UNV')).toBe(false)
    expect(costVisibleForBrand(undefined, 'UNV')).toBe(false)
  })
})
