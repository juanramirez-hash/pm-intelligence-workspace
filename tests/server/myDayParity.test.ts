// MD-001: "Mi día" (server) must give the same status, trend, attention and
// working-day comparison as the Executive brand table (frontend).
//
// CAL-001: the Executive table counts Monday to Friday and does not know the
// calendar of non-working days (it is retired in EX-001, so it is not given the
// calendar). The working-day parity is therefore checked with an EMPTY
// calendar, which is the same Monday-to-Friday rule; with the calendar Mi día
// differs from the Executive table by design (see businessCalendar.test.ts).

import { readFileSync } from 'node:fs'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  DEFAULT_ATTENTION_DECLINE_THRESHOLD,
  DEFAULT_STABLE_THRESHOLD,
} from '../../src/core/analytics/brands/brandIntelligence'
import {
  countWeekdaysInclusive,
  resolveEquivalentWorkingDayCutoff,
} from '../../src/core/analytics/shared/dateAnalytics'

import { EMPTY_CALENDAR } from '../../server/services/businessCalendar.js'
import {
  equivalentPreviousCutoff,
  monthEnd,
  shiftMonth,
  weekdaysBetween,
  weekdaysInPeriod,
} from '../../server/services/metricPeriods.js'
import {
  ATTENTION_REASONS,
  MY_DAY_RULES,
} from '../../server/services/myDayRules.js'

function everyDay(from: string, to: string): string[] {
  const days: string[] = []

  for (
    const cursor = new Date(`${from}T00:00:00Z`);
    cursor.toISOString().slice(0, 10) <= to;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    days.push(cursor.toISOString().slice(0, 10))
  }

  return days
}

describe('MD-001 parity with Executive', () => {
  it('uses the Executive thresholds', () => {
    expect(MY_DAY_RULES.stableVariationThreshold).toBe(
      DEFAULT_STABLE_THRESHOLD,
    )
    expect(MY_DAY_RULES.attentionDeclineThreshold).toBe(
      DEFAULT_ATTENTION_DECLINE_THRESHOLD,
    )
  })

  it('uses the Executive attention texts', () => {
    const source = readFileSync(
      new URL(
        '../../src/core/analytics/brands/brandIntelligence.ts',
        import.meta.url,
      ),
      'utf8',
    )

    for (const reason of Object.values(ATTENTION_REASONS)) {
      expect(source).toContain(`'${reason}'`)
    }
  })

  it('cuts the previous month like Executive on every day of 2024-2027', () => {
    const mismatches: string[] = []

    for (const cutoff of everyDay('2024-01-01', '2027-12-31')) {
      const period = cutoff.slice(0, 7)
      const previous = shiftMonth(period, -1)
      const executive = resolveEquivalentWorkingDayCutoff(
        period,
        cutoff,
        previous,
        monthEnd(previous),
      )
      const myDay = equivalentPreviousCutoff(period, cutoff, EMPTY_CALENDAR)

      if (executive !== myDay) {
        mismatches.push(`${cutoff}: ${executive} vs ${myDay}`)
      }

      const elapsed = countWeekdaysInclusive(`${period}-01`, cutoff)

      if (elapsed !== weekdaysBetween(`${period}-01`, cutoff, EMPTY_CALENDAR)) {
        mismatches.push(`${cutoff}: weekdays`)
      }
    }

    expect(mismatches).toEqual([])
  })

  it('counts Monday-to-Friday working days per month', () => {
    expect(weekdaysInPeriod('2026-11', EMPTY_CALENDAR)).toBe(21)
    expect(weekdaysInPeriod('2026-02', EMPTY_CALENDAR)).toBe(20)
    expect(weekdaysInPeriod('2026-03', EMPTY_CALENDAR)).toBe(22)
  })
})
