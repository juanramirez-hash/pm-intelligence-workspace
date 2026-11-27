// CAL-001: the business calendar (Monday to Friday minus the non-working days)
// and the rules that use it: Mi día windows, equivalent cutoffs, the brand
// page year over year windows, missing years and the quota template check.

import { readFileSync } from 'node:fs'

import { describe, expect, it, vi } from 'vitest'

import {
  BUSINESS_CALENDAR_SEED,
  DAY_TYPES,
  EMPTY_CALENDAR,
  createBusinessCalendar,
  loadBusinessCalendar,
  monthSummaries,
  templateChecks,
} from '../../server/services/businessCalendar.js'

import {
  assembleMonthComparison,
  assembleYearComparison,
  buildYearWindowPlan,
  equivalentWorkingDayCutoff,
} from '../../server/services/brandRules.js'

import {
  equivalentPreviousCutoff,
  monthEnd,
  weekdaysBetween,
  weekdaysInPeriod,
} from '../../server/services/metricPeriods.js'

import {
  quotaPace,
  resolvePeriodWindow,
  withTemplateWorkingDays,
} from '../../server/services/myDayRules.js'

const SEED = createBusinessCalendar([...BUSINESS_CALENDAR_SEED])

// -- An oracle written independently of the module -----------------------------

const OFF = new Set(BUSINESS_CALENDAR_SEED.map((entry) => entry.date))

function oracleIsWorking(date: string): boolean {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()

  return weekday >= 1 && weekday <= 5 && !OFF.has(date)
}

function oracleDates(from: string, to: string): string[] {
  const dates: string[] = []
  const cursor = new Date(`${from}T12:00:00Z`)
  const end = new Date(`${to}T12:00:00Z`)

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

const oracleCount = (from: string, to: string) => oracleDates(from, to).filter(oracleIsWorking).length

const oracleNth = (period: string, n: number): string | null =>
  oracleDates(`${period}-01`, monthEnd(period)).filter(oracleIsWorking)[n - 1] ?? null

describe('CAL-001 business calendar', () => {
  it('Monday to Friday minus the non-working days; weekends never count', () => {
    expect(SEED.isWorkingDay('2026-11-13')).toBe(true) // Friday
    expect(SEED.isWorkingDay('2026-11-14')).toBe(false) // Saturday
    expect(SEED.isWorkingDay('2026-11-15')).toBe(false) // Sunday
    expect(SEED.isWorkingDay('2026-11-16')).toBe(false) // Revolución (Monday)
    expect(SEED.isWorkingDay('2026-12-31')).toBe(false) // company day
    expect(EMPTY_CALENDAR.isWorkingDay('2026-11-16')).toBe(true)
  })

  it('counts each month of 2024-2026 like the oracle, with and without the calendar', () => {
    for (const year of [2024, 2025, 2026]) {
      for (let month = 1; month <= 12; month += 1) {
        const period = `${year}-${String(month).padStart(2, '0')}`

        expect(SEED.businessDaysInPeriod(period), period).toBe(oracleCount(`${period}-01`, monthEnd(period)))
        expect(weekdaysInPeriod(period, SEED), period).toBe(oracleCount(`${period}-01`, monthEnd(period)))
        expect(weekdaysInPeriod(period), period).toBeGreaterThanOrEqual(SEED.businessDaysInPeriod(period))
      }
    }
  })

  it('counts any range and the Nth business day like the oracle', () => {
    for (const [from, to] of [
      ['2026-11-01', '2026-11-26'],
      ['2026-01-01', '2026-11-26'],
      ['2025-01-01', '2025-12-31'],
      ['2024-03-25', '2024-04-05'],
      ['2026-09-21', '2026-09-21'],
    ]) {
      expect(SEED.businessDaysBetween(from!, to!), `${from}..${to}`).toBe(oracleCount(from!, to!))
    }

    expect(SEED.businessDaysBetween('2026-11-10', '2026-11-01')).toBe(0)

    for (const period of ['2024-03', '2025-09', '2026-04', '2026-11', '2026-12']) {
      for (let n = 1; n <= 23; n += 1) {
        expect(SEED.nthBusinessDay(period, n), `${period} #${n}`).toBe(oracleNth(period, n))
      }
    }
  })

  it('without a calendar it is Monday to Friday (the default of the pure rules)', () => {
    expect(weekdaysInPeriod('2026-11')).toBe(21)
    expect(weekdaysBetween('2026-11-01', '2026-11-26')).toBe(19)
    expect(EMPTY_CALENDAR.entries).toEqual([])
  })

  it('reports the years of a range that have no calendar loaded', () => {
    expect(SEED.missingYears('2026-12-01', '2026-12-31')).toEqual([])
    expect(SEED.missingYears('2026-12-01', '2027-01-31')).toEqual([2027])
    expect(SEED.missingYears('2023-01-01', '2027-12-31')).toEqual([2023, 2027])
    expect(EMPTY_CALENDAR.missingYears('2026-01-01', '2026-12-31')).toEqual([2026])
    expect(SEED.coversYear(2026)).toBe(true)
    expect(SEED.coversYear(2027)).toBe(false)
  })

  it('rejects a malformed date instead of guessing', () => {
    expect(() => SEED.isWorkingDay('26-11-2026')).toThrow()
    expect(() => SEED.businessDaysBetween('2026-11-01', 'mañana')).toThrow()
  })
})

describe('CAL-001 initial calendar', () => {
  it('has the 35 dates of 2024, 2025 and 2026, none on a weekend, none repeated', () => {
    const years = (year: number) => BUSINESS_CALENDAR_SEED.filter((entry) => entry.date.startsWith(`${year}-`))

    expect(BUSINESS_CALENDAR_SEED).toHaveLength(35)
    expect([years(2024).length, years(2025).length, years(2026).length]).toEqual([12, 12, 11])
    expect(new Set(BUSINESS_CALENDAR_SEED.map((entry) => entry.date)).size).toBe(35)

    for (const entry of BUSINESS_CALENDAR_SEED) {
      const weekday = new Date(`${entry.date}T12:00:00Z`).getUTCDay()

      expect(weekday >= 1 && weekday <= 5, entry.date).toBe(true)
      expect(DAY_TYPES).toContain(entry.type)
      expect(entry.description.trim()).not.toBe('')
    }

    expect(BUSINESS_CALENDAR_SEED.find((entry) => entry.date === '2026-12-31')).toMatchObject({
      type: 'company',
      description: 'Fin de año',
    })
  })

  it('gives the business days per month of 2026 reported to Juan', () => {
    expect(monthSummaries(SEED, 2026).map((month) => month.businessDays)).toEqual([21, 19, 21, 20, 20, 22, 23, 21, 20, 22, 20, 21])
    expect(monthSummaries(SEED, 2026).map((month) => month.weekdays)).toEqual([22, 20, 22, 22, 21, 22, 23, 21, 22, 22, 21, 23])
  })

  it('migration 043 loads exactly the same rows (kept in step by this test)', () => {
    const sql = readFileSync('server/migrations/043_business_calendar.sql', 'utf8')
    const rows = [...sql.matchAll(/^\s+\('(\d{4}-\d{2}-\d{2})', '(official|company)', '([^']+)'\)/gm)]
      .map((match) => ({ date: match[1], type: match[2], description: match[3] }))

    expect(rows).toEqual(BUSINESS_CALENDAR_SEED.map((entry) => ({ ...entry })))
    expect(sql).toContain('ON CONFLICT (calendar_date) DO NOTHING')
    // No statement touches the cache version (only the comment explains why).
    expect(sql.replace(/--.*$/gm, '')).not.toContain('data_cache_version')
  })
})

describe('CAL-001 reads and the quota template check', () => {
  it('loads the whole calendar with plain text dates', async () => {
    const query = vi.fn(async () => ({
      rows: [
        { calendar_date: '2026-11-16', day_type: 'official', description: 'Día de la Revolución' },
        { calendar_date: '2026-09-21', day_type: 'company', description: 'Yom Kipur' },
      ],
    }))
    const calendar = await loadBusinessCalendar({ query })

    expect(String((query.mock.calls[0] as unknown[])[0])).toContain('calendar_date::TEXT')
    expect(calendar.entries.map((entry) => entry.date)).toEqual(['2026-09-21', '2026-11-16'])
    expect(calendar.isWorkingDay('2026-11-16')).toBe(false)
  })

  it('reports February and December 2026, where the template differs from the calendar', () => {
    const checks = templateChecks(SEED, 2026, [
      { period: '2026-01', workingDays: 21, brands: 30 },
      { period: '2026-02', workingDays: 20, brands: 30 },
      { period: '2026-12', workingDays: 23, brands: 29 },
      { period: '2026-12', workingDays: 21, brands: 1 },
    ])
    const by = (period: string) => checks.find((check) => check.period === period)!

    expect(by('2026-01')).toMatchObject({ calendarDays: 21, status: 'match' })
    expect(by('2026-02')).toMatchObject({ calendarDays: 19, status: 'mismatch', templateValues: [{ workingDays: 20, brands: 30 }] })
    // Mixed values: any value that differs makes it a mismatch.
    expect(by('2026-12')).toMatchObject({ calendarDays: 21, status: 'mismatch' })
    expect(by('2026-12').templateValues).toEqual([{ workingDays: 21, brands: 1 }, { workingDays: 23, brands: 29 }])
    expect(by('2026-03')).toMatchObject({ status: 'no-template', templateValues: [] })
    expect(checks).toHaveLength(12)
  })

  it('withTemplateWorkingDays: the calendar rules, the template is only compared', () => {
    const days = { elapsed: 18, total: 20, remaining: 2, holidaysExcluded: true }

    expect(withTemplateWorkingDays(days, [21, 21])).toEqual({ ...days, templateTotal: 21, mismatch: true })
    expect(withTemplateWorkingDays(days, [20, 20])).toEqual({ ...days, templateTotal: 20, mismatch: false })
    expect(withTemplateWorkingDays(days, [20, 21])).toEqual({ ...days, templateTotal: null, mismatch: true })
    expect(withTemplateWorkingDays(days, [])).toEqual({ ...days, templateTotal: null, mismatch: false })
    expect(withTemplateWorkingDays(days, [Number.NaN])).toEqual({ ...days, templateTotal: null, mismatch: false })
  })
})

describe('CAL-001 Mi día windows with the calendar', () => {
  it('2026-11 at the 26th: 18 of 20 business days (was 19 of 21), previous month cut on the 26th', () => {
    const window = resolvePeriodWindow('2026-11', '2026-11-26', SEED)

    expect(window.workingDays).toEqual({ elapsed: 18, total: 20, remaining: 2, holidaysExcluded: true })
    expect(window.calendarMissingYears).toEqual([])
    expect(window.comparison).toMatchObject({
      basis: 'equivalent-working-days',
      currentTo: '2026-11-26',
      previousTo: '2026-10-26',
      holidaysExcluded: true,
    })

    const before = resolvePeriodWindow('2026-11', '2026-11-26')

    expect(before.workingDays).toEqual({ elapsed: 19, total: 21, remaining: 2, holidaysExcluded: false })
    expect(before.comparison?.previousTo).toBe('2026-10-27')
  })

  it('the pace uses the calendar: projected close = revenue / elapsed × total', () => {
    const window = resolvePeriodWindow('2026-11', '2026-11-26', SEED)
    const pace = quotaPace(900, 1200, window.workingDays, window.periodStatus)

    expect(pace.projectedRevenue).toBeCloseTo((900 / 18) * 20, 10)
    expect(pace.dailyGap).toBeCloseTo((1200 - 900) / 2, 10)
  })

  it('a closed month shows its business days; the numbers of the close do not change', () => {
    const window = resolvePeriodWindow('2026-09', '2026-11-26', SEED)

    expect(window.periodStatus).toBe('closed')
    expect(window.workingDays).toEqual({ elapsed: 20, total: 20, remaining: 0, holidaysExcluded: true })
  })

  it('a period of a year without calendar warns and counts Monday to Friday', () => {
    const window = resolvePeriodWindow('2027-01', '2027-01-15', SEED)

    expect(window.calendarMissingYears).toEqual([2027])
    expect(window.workingDays.holidaysExcluded).toBe(false)
    expect(window.workingDays.total).toBe(weekdaysInPeriod('2027-01'))
    // December 2026 has a calendar, the previous year of January 2027 does too.
    expect(resolvePeriodWindow('2026-12', '2026-12-31', SEED).calendarMissingYears).toEqual([])
  })

  it('January looks at December of the previous year', () => {
    expect(resolvePeriodWindow('2026-01', '2026-01-20', createBusinessCalendar([{ date: '2026-01-01', type: 'official', description: 'x' }])).calendarMissingYears).toEqual([2025])
  })

  it('the cutoff on a non-working day counts the business days before it', () => {
    // 2026-11-16 is a holiday: the 16th has the same business days as Friday the 13th.
    expect(weekdaysBetween('2026-11-01', '2026-11-16', SEED)).toBe(weekdaysBetween('2026-11-01', '2026-11-13', SEED))
    expect(equivalentPreviousCutoff('2026-11', '2026-11-16', SEED)).toBe(equivalentPreviousCutoff('2026-11', '2026-11-13', SEED))
  })
})

describe('CAL-001 year over year windows with the calendar', () => {
  it('the same number of business days in each year, with that year calendar', () => {
    const plan = buildYearWindowPlan('2026-11', '2026-11-26', SEED)

    expect(plan.available).toBe(true)

    const windows = new Map(plan.windows.map((window: { key: string, dateTo: string, workingDays: number, dateFrom: string }) => [window.key, window]))

    expect(windows.get('monthly:2026')).toMatchObject({ dateFrom: '2026-11-01', dateTo: '2026-11-26', workingDays: 18 })
    // 18th business day of November 2025 (the 17th is a holiday) and of 2024 (the 18th).
    expect(windows.get('monthly:2025')).toMatchObject({ dateTo: '2025-11-27', workingDays: 18 })
    expect(windows.get('monthly:2024')).toMatchObject({ dateTo: '2024-11-27', workingDays: 18 })
    expect(oracleNth('2025-11', 18)).toBe('2025-11-27')
    expect(oracleNth('2024-11', 18)).toBe('2024-11-27')
    // Year to date: business days from January to the equivalent cutoff.
    expect(windows.get('ytd:2026')?.workingDays).toBe(oracleCount('2026-01-01', '2026-11-26'))
    expect(windows.get('ytd:2025')?.workingDays).toBe(oracleCount('2025-01-01', '2025-11-27'))
    expect(windows.get('fy:2025')?.workingDays).toBe(oracleCount('2025-01-01', '2025-12-31'))
    expect(plan.calendarMissingYears).toEqual([])
    expect(plan.holidaysExcluded).toBe(true)
    expect(plan.description).toContain('menos feriados y días de la empresa')
  })

  it('every window of an open month has the same business days as the reference', () => {
    for (const cutoff of ['2026-03-10', '2026-04-08', '2026-09-22', '2026-12-22']) {
      const plan = buildYearWindowPlan(cutoff.slice(0, 7), cutoff, SEED)
      const monthly = plan.windows.filter((window: { kind: string }) => window.kind === 'monthly')
      const days = monthly.map((window: { workingDays: number }) => window.workingDays)

      expect(new Set(days).size, cutoff).toBe(1)

      for (const window of monthly) {
        expect(window.workingDays).toBe(oracleCount(window.dateFrom, window.dateTo))
      }
    }
  })

  it('a year without calendar is reported and the old description is kept', () => {
    const plan = buildYearWindowPlan('2027-01', '2027-01-15', SEED)

    expect(plan.calendarMissingYears).toEqual([2027])
    expect(plan.holidaysExcluded).toBe(false)
    expect(plan.description).toContain('sin ajuste por feriados')
  })

  it('the comparison answers with the missing years and holidaysExcluded', () => {
    const plan = buildYearWindowPlan('2027-01', '2027-01-15', SEED)
    const result = assembleYearComparison(plan, new Map())

    expect(result.calendarMissingYears).toEqual([2027])
    expect(result.holidaysExcluded).toBe(false)
    expect(assembleYearComparison(buildYearWindowPlan('2026-11', '2026-11-26', SEED), new Map()).holidaysExcluded).toBe(true)
  })

  it('equivalentWorkingDayCutoff follows the calendar; without it, Monday to Friday', () => {
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-26', '2025-11', SEED)).toBe('2025-11-27')
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-26', '2025-11')).toBe('2025-11-27')
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-26', '2026-10', SEED)).toBe('2026-10-26')
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-26', '2026-10')).toBe('2026-10-27')
    // Fewer business days in the target month: its last day.
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-30', '2026-09', SEED)).toBe('2026-09-30')
    expect(equivalentWorkingDayCutoff('2026-11', '2026-11-01', '2026-10', SEED)).toBeNull()
  })

  it('the month against month comparison counts the days of each side with the calendar', () => {
    const window = resolvePeriodWindow('2026-11', '2026-11-26', SEED)
    const result = assembleMonthComparison(window, undefined, undefined, true, SEED)

    expect(result.current.workingDays).toBe(18)
    expect(result.previous.workingDays).toBe(18)
    expect(result.holidaysExcluded).toBe(true)
    expect(result.calendarMissingYears).toEqual([])
  })
})
