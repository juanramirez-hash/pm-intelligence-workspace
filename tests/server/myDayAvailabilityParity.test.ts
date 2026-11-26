// MD-002: the server freshness of "Mi día" must match the DC-001 "Fuentes de
// NetSuite" panel for the same dates (America/Mexico_City).

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  NETSUITE_SOURCES,
} from '../../src/features/data-center/config/netsuiteSources'
import {
  buildNetsuiteSourceRows,
  calendarDaysBetween as panelCalendarDaysBetween,
} from '../../src/features/data-center/engine/netsuiteSourceStatus'

import {
  MY_DAY_AVAILABILITY_RULES,
  calendarDaysBetween,
  sourceFreshness,
} from '../../server/services/myDayAvailabilityRules.js'

const TIME_ZONE = MY_DAY_AVAILABILITY_RULES.freshness.timeZone

describe('MD-002 freshness parity with DC-001', () => {
  it('uses the same stale threshold as the panel sources', () => {
    for (const id of ['sales', 'inventory', 'purchase-orders'] as const) {
      expect(NETSUITE_SOURCES[id]?.staleAfterDays).toBe(
        MY_DAY_AVAILABILITY_RULES.freshness.staleAfterDays,
      )
    }
  })

  it('gives the same days and status for every hour of three weeks', () => {
    const now = new Date('2026-11-21T02:00:00.000Z')

    for (let hours = 0; hours < 21 * 24; hours += 1) {
      const lastImportedAt = new Date(now.getTime() - hours * 3_600_000).toISOString()
      const [panel] = buildNetsuiteSourceRows(
        { 'purchase-orders': { lastImportedAt, dataCutoff: null } },
        now,
        TIME_ZONE,
      ).filter((row) => row.importerId === 'purchase-orders')
      const server = sourceFreshness({ lastImportedAt }, now)

      expect([server.referenceDate, server.daysSince, server.status]).toEqual([
        panel!.referenceDate,
        panel!.daysSinceReference,
        panel!.status,
      ])
    }
  })

  it('prefers the sales cutoff like the panel', () => {
    const now = new Date('2026-11-21T02:00:00.000Z')
    const [panel] = buildNetsuiteSourceRows(
      { sales: { lastImportedAt: '2026-11-20T15:00:00.000Z', dataCutoff: '2026-11-12' } },
      now,
      TIME_ZONE,
    )
    const server = sourceFreshness(
      { lastImportedAt: '2026-11-20T15:00:00.000Z', dataCutoff: '2026-11-12' },
      now,
    )

    expect(server).toMatchObject({
      referenceDate: panel!.referenceDate,
      daysSince: panel!.daysSinceReference,
      status: panel!.status,
    })
  })

  it('counts calendar days the same way', () => {
    for (const [from, to] of [
      ['2026-10-31', '2026-11-01'],
      ['2026-12-31', '2027-01-07'],
      ['2024-02-28', '2024-03-01'],
      ['bad', '2027-01-07'],
    ]) {
      expect(calendarDaysBetween(from, to)).toBe(panelCalendarDaysBetween(from!, to!))
    }
  })
})
