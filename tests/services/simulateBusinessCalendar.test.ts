// CAL-001: the read-only simulation Juan runs in production before applying
// migration 043: the numbers it prints (today -> calendar) and that it writes
// nothing and does not need the table.

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  BUSINESS_CALENDAR_SEED,
  createBusinessCalendar,
} from '../../server/services/businessCalendar.js'

import {
  periodDays,
  projectedClose,
  simulateBrands,
  simulatePeriod,
  simulateYear,
} from '../../server/scripts/simulateBusinessCalendar.js'

const calendar = createBusinessCalendar([...BUSINESS_CALENDAR_SEED])

describe('CAL-001 simulation: cutoff 2026-11-26', () => {
  const simulated = simulatePeriod('2026-11', '2026-11-26', calendar)

  it('elapsed and total days, today -> calendar', () => {
    expect(simulated.today).toEqual({ elapsed: 19, total: 21, remaining: 2, open: true })
    expect(simulated.calendar).toEqual({ elapsed: 18, total: 20, remaining: 2, open: true })
  })

  it('the projection factor and the equivalent cutoffs', () => {
    expect(simulated.factor.today).toBeCloseTo(21 / 19, 10)
    expect(simulated.factor.calendar).toBeCloseTo(20 / 18, 10)
    expect(simulated.equivalents.today).toEqual({ previousMonth: '2026-10-27', previousYear: '2025-11-27', twoYearsBack: '2024-11-27' })
    expect(simulated.equivalents.calendar).toEqual({ previousMonth: '2026-10-26', previousYear: '2025-11-27', twoYearsBack: '2024-11-27' })
  })

  it('a closed month: elapsed equals total', () => {
    expect(periodDays('2026-09', '2026-11-26', calendar)).toEqual({ elapsed: 20, total: 20, remaining: 0, open: false })
    expect(periodDays('2026-12', '2026-11-26', calendar)).toEqual({ elapsed: 0, total: 21, remaining: 21, open: true })
  })

  it('every month of 2026: total days like the report to Juan, and the cutoff of the previous month', () => {
    const months = simulateYear(2026, 15, calendar)

    expect(months.map((month) => month.totalToday)).toEqual([22, 20, 22, 22, 21, 22, 23, 21, 22, 22, 21, 23])
    expect(months.map((month) => month.totalCalendar)).toEqual([21, 19, 21, 20, 20, 22, 23, 21, 20, 22, 20, 21])
    expect(months).toHaveLength(12)
    // April: the 15th has 11 weekdays but only 9 business days (Semana Santa on the 2nd and 3rd).
    expect(months[3]).toMatchObject({ elapsedToday: 11, elapsedCalendar: 9, previousToday: '2026-03-16', previousCalendar: '2026-03-12' })
  })
})

describe('CAL-001 simulation: projected close per brand', () => {
  const simulated = simulatePeriod('2026-11', '2026-11-26', calendar)
  const result = simulateBrands(
    [
      { brandKey: 'A', label: 'A', revenue: 900, target: 1200 },
      { brandKey: 'B', label: 'B', revenue: 0, target: 500 },
      { brandKey: 'C', label: 'C', revenue: 100, target: 0 },
    ],
    simulated,
  )

  it('sales / elapsed x total, today -> calendar, with the quota attainment', () => {
    const [a] = result.brands

    expect(projectedClose(900, 19, 21)).toBeCloseTo((900 / 19) * 21, 10)
    expect(a?.closeToday).toBeCloseTo((900 / 19) * 21, 10)
    expect(a?.closeCalendar).toBeCloseTo((900 / 18) * 20, 10)
    expect(a?.delta).toBeCloseTo((900 / 18) * 20 - (900 / 19) * 21, 10)
    expect(a?.attainmentToday).toBeCloseTo((900 / 19) * 21 / 1200, 10)
    expect(a?.attainmentCalendar).toBeCloseTo((900 / 18) * 20 / 1200, 10)
  })

  it('a brand without quota has no attainment, never 0 or Infinity', () => {
    expect(result.brands[2]?.attainmentToday).toBeNull()
    expect(result.brands[2]?.attainmentCalendar).toBeNull()
  })

  it('the portfolio adds every brand and every quota', () => {
    expect(result.portfolio.revenue).toBe(1000)
    expect(result.portfolio.target).toBe(1700)
    expect(result.portfolio.closeCalendar).toBeCloseTo((1000 / 18) * 20, 10)
    expect(result.portfolio.attainmentCalendar).toBeCloseTo((1000 / 18) * 20 / 1700, 10)
  })

  it('no elapsed business day means no projection (missing, not 0)', () => {
    expect(projectedClose(500, 0, 20)).toBeNull()
    expect(simulateBrands([{ brandKey: 'A', label: 'A', revenue: 500, target: 100 }], simulatePeriod('2026-12', '2026-11-26', calendar)).brands[0]?.closeCalendar).toBeNull()
  })
})

describe('CAL-001 simulation is read only and independent of the migration', () => {
  const source = readFileSync('server/scripts/simulateBusinessCalendar.js', 'utf8')
  const sql = [...source.matchAll(/client\.query\(\s*`([^`]*)`/g)].map((match) => match[1] ?? '')

  it('only reads: SELECTs inside BEGIN READ ONLY ... ROLLBACK', () => {
    expect(sql).toHaveLength(2)

    for (const statement of sql) {
      expect(statement.trim().toUpperCase().startsWith('SELECT')).toBe(true)
    }

    expect(source).toContain("client.query('BEGIN READ ONLY')")
    expect(source).toContain("client.query('ROLLBACK')")
    expect(source.replace(/\/\/.*$/gm, '')).not.toMatch(/\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|GRANT)\b/)
  })

  it('uses the calendar inside the script unless --from-db is given', () => {
    expect(source).toContain('createBusinessCalendar([...BUSINESS_CALENDAR_SEED])')
    expect(source).toContain("if (fromDb) {\n      calendar = await loadBusinessCalendar(pool)")
    expect(sql.join(' ')).not.toContain('business_calendar')
  })
})
