// MB-001: the server rules of the year over year comparison, year to date and
// annual close give the same windows, sums and projection as the client code
// they replace (src/core/decision/brands/brandCommercialComparison.ts), for
// fixed data, open and closed months, and a missing year.

import { describe, expect, it } from 'vitest'

import {
  buildBrandCommercialComparison,
} from '../../src/core/decision/brands/brandCommercialComparison'

import {
  resolveEquivalentWorkingDayCutoff,
} from '../../src/core/analytics/shared/dateAnalytics'

import {
  assembleYearComparison,
  buildYearWindowPlan,
  equivalentWorkingDayCutoff,
} from '../../server/services/brandRules.js'

import {
  equivalentPreviousCutoff,
  monthEnd,
  shiftMonth,
} from '../../server/services/metricPeriods.js'

interface Fact {
  date: string
  period: string
  revenue: number
  grossProfit: number
  quantity: number
  customer: string
  product: string
  document: string
}

const BRAND = 'UNV (UNIVIEW)'

/** Deterministic daily sales (weekends included) from `from` to `to`. */
function buildFacts(from: string, to: string, skipYear?: number): Fact[] {
  const facts: Fact[] = []

  for (
    const cursor = new Date(`${from}T00:00:00Z`);
    cursor.toISOString().slice(0, 10) <= to;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const date = cursor.toISOString().slice(0, 10)
    const year = Number(date.slice(0, 4))

    if (year === skipYear) {
      continue
    }

    const day = Math.floor(cursor.getTime() / 86_400_000)
    const revenue = 1000 + ((day * 37) % 900) + (year - 2023) * 150
    const grossProfit = Math.round(revenue * (0.18 + (day % 7) / 100))

    facts.push({
      date,
      period: date.slice(0, 7),
      revenue,
      grossProfit,
      quantity: 1 + (day % 4),
      customer: `C${day % 9}`,
      product: `P${day % 6}`,
      document: `D${date}`,
    })
  }

  return facts
}

function sums(facts: readonly Fact[], dateFrom: string, dateTo: string) {
  const rows = facts.filter((fact) => fact.date >= dateFrom && fact.date <= dateTo)

  return {
    revenue: rows.reduce((total, fact) => total + fact.revenue, 0),
    grossProfit: rows.reduce((total, fact) => total + fact.grossProfit, 0),
    quantity: rows.reduce((total, fact) => total + fact.quantity, 0),
    documents: new Set(rows.map((fact) => fact.document)).size,
    customers: new Set(rows.map((fact) => fact.customer)).size,
    products: new Set(rows.map((fact) => fact.product)).size,
    rowCount: rows.length,
  }
}

function clientComparison(facts: readonly Fact[], period: string, cutoff: string) {
  const repository = {
    getDataPeriodEnd: () => cutoff,
    salesSegmentation: {
      summarize: (filter: { periodIds?: string[], dateFrom?: string, dateTo?: string }) => {
        const rows = facts.filter(
          (fact) =>
            (!filter.periodIds || filter.periodIds.includes(fact.period)) &&
            (!filter.dateFrom || fact.date >= filter.dateFrom) &&
            (!filter.dateTo || fact.date <= filter.dateTo),
        )
        const total = sums(rows, '0000-01-01', '9999-12-31')

        return {
          revenue: total.revenue,
          grossProfit: total.grossProfit,
          quantity: total.quantity,
          documents: total.documents,
          customerCount: total.customers,
          productCount: total.products,
          rowCount: total.rowCount,
        }
      },
    },
  }
  const snapshot = (periodId: string) => ({
    periodId,
    actuals: { revenue: 1, customers: 1 },
  })
  const decision = {
    brandId: BRAND,
    currentPeriodId: period,
    previousPeriodId: shiftMonth(period, -1),
    currentSnapshot: snapshot(period),
    previousSnapshot: snapshot(shiftMonth(period, -1)),
  }

  return buildBrandCommercialComparison(repository as never, decision as never)
}

function serverComparison(facts: readonly Fact[], period: string, cutoff: string) {
  const plan = buildYearWindowPlan(period, cutoff)
  const metrics = new Map(
    (plan.available ? plan.windows : []).map((window: { key: string, dateFrom: string, dateTo: string }) => [
      window.key,
      sums(facts, window.dateFrom, window.dateTo),
    ]),
  )

  return assembleYearComparison(plan, metrics as never)
}

const WINDOW_FIELDS = [
  'periodId', 'dateFrom', 'dateTo', 'workingDays', 'revenue', 'grossProfit',
  'grossMargin', 'quantity', 'documents', 'customers', 'products', 'rowCount',
] as const

function windowOf(source: Record<string, unknown> | null) {
  return source === null
    ? null
    : Object.fromEntries(WINDOW_FIELDS.map((field) => [field, source[field]]))
}

function expectSameComparison(
  server: ReturnType<typeof serverComparison>,
  client: ReturnType<typeof clientComparison>,
  label: string,
) {
  // `year` is the first field of the client window and is also compared.
  for (const kind of ['monthly', 'ytd'] as const) {
    for (const slot of ['current', 'previousYear', 'twoYearsBack'] as const) {
      expect({ label, kind, slot, window: windowOf(server[kind][slot]) }).toEqual({
        label,
        kind,
        slot,
        window: windowOf(client[kind][slot] as never),
      })
    }
  }

  for (const slot of ['previousYear', 'twoYearsBack'] as const) {
    expect({ label, slot, window: windowOf(server.annual[slot]) }).toEqual({
      label,
      slot,
      window: windowOf(client.annual[slot] as never),
    })
  }

  const serverProjection = server.annual.projection
  const clientProjection = client.annual.projection

  expect({ label, hasProjection: serverProjection !== null }).toEqual({
    label,
    hasProjection: clientProjection !== null,
  })

  if (serverProjection && clientProjection) {
    for (const field of [
      'year', 'revenue', 'grossProfit', 'grossMargin',
      'historicalRevenueCompletionRatio', 'historicalGrossProfitCompletionRatio',
      'historicalYearsUsed',
    ] as const) {
      expect(serverProjection[field]).toEqual(clientProjection[field])
    }
  }

  expect(server.description).toBe(client.multiYearDescription)
  expect(server.currentYear).toBe(client.currentYear)
}

describe('MB-001 parity with brandCommercialComparison.ts', () => {
  const facts = buildFacts('2024-01-01', '2026-12-31')

  it('equivalent working day cutoffs match the client and MD-001 for every day', () => {
    let compared = 0

    for (const source of ['2024-03', '2025-02', '2026-02', '2026-07', '2026-11']) {
      for (
        const cursor = new Date(`${source}-01T00:00:00Z`);
        cursor.toISOString().slice(0, 7) === source;
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      ) {
        const cutoff = cursor.toISOString().slice(0, 10)

        for (const target of ['2023-02', '2024-02', '2025-02', '2025-11', '2026-11']) {
          expect(equivalentWorkingDayCutoff(source, cutoff, target)).toBe(
            resolveEquivalentWorkingDayCutoff(source, cutoff, target, monthEnd(target)),
          )
          compared += 1
        }

        // Same rule MD-001 uses against the previous month.
        expect(equivalentWorkingDayCutoff(source, cutoff, shiftMonth(source, -1))).toBe(
          equivalentPreviousCutoff(source, cutoff),
        )
      }
    }

    expect(compared).toBeGreaterThan(700)
  })

  it('gives the same comparison for an open month (24 Nov 2026)', () => {
    expectSameComparison(
      serverComparison(facts, '2026-11', '2026-11-24'),
      clientComparison(facts, '2026-11', '2026-11-24'),
      'open',
    )
  })

  it('gives the same comparison for a closed month (September, cutoff 24 Nov)', () => {
    expectSameComparison(
      serverComparison(facts, '2026-09', '2026-11-24'),
      clientComparison(facts, '2026-09', '2026-11-24'),
      'closed',
    )
  })

  it('gives the same comparison for every month and several cutoffs of 2026', () => {
    let cases = 0

    for (let month = 1; month <= 11; month += 1) {
      const period = `2026-${String(month).padStart(2, '0')}`

      for (const day of [3, 10, 17, 24, 28]) {
        const cutoff = `${period}-${String(day).padStart(2, '0')}`

        // The cutoff is the last date with sales: nothing after it.
        const cut = facts.filter((fact) => fact.date <= cutoff)

        expectSameComparison(
          serverComparison(cut, period, cutoff),
          clientComparison(cut, period, cutoff),
          `${period} @ ${cutoff}`,
        )
        cases += 1
      }
    }

    expect(cases).toBe(55)
  })

  it('treats a year without sales as missing and projects with the years that have data', () => {
    const withoutOldest = buildFacts('2024-01-01', '2026-12-31', 2024)
    const server = serverComparison(withoutOldest, '2026-11', '2026-11-24')
    const client = clientComparison(withoutOldest, '2026-11', '2026-11-24')

    expectSameComparison(server, client, 'missing 2024')
    expect(server.monthly.twoYearsBack).toBeNull()
    expect(server.ytd.twoYearsBack).toBeNull()
    expect(server.annual.twoYearsBack).toBeNull()
    expect(server.annual.projection?.historicalYearsUsed).toEqual([2025])
  })

  it('has no projection without any previous year', () => {
    const onlyCurrent = buildFacts('2026-01-01', '2026-12-31')
    const server = serverComparison(onlyCurrent, '2026-11', '2026-11-24')

    expectSameComparison(server, clientComparison(onlyCurrent, '2026-11', '2026-11-24'), 'only 2026')
    expect(server.annual.projection).toBeNull()
    expect(server.monthly.previousYear).toBeNull()
    // The current year keeps its window.
    expect(server.monthly.current?.rowCount).toBeGreaterThan(0)
  })

  it('reproduces a fixed case by hand', () => {
    // 2026-11 open at the 24th: 17 weekdays; the same 17th weekday of 2025
    // and 2024 is 25 Nov of both years.
    const server = serverComparison(facts, '2026-11', '2026-11-24')

    expect(server.monthly.current).toMatchObject({ dateFrom: '2026-11-01', dateTo: '2026-11-24', workingDays: 17 })
    expect(server.monthly.previousYear).toMatchObject({ dateTo: '2025-11-25', workingDays: 17 })
    expect(server.monthly.twoYearsBack).toMatchObject({ dateTo: '2024-11-25', workingDays: 17 })
    expect(server.ytd.current).toMatchObject({ dateFrom: '2026-01-01', dateTo: '2026-11-24' })
    expect(server.annual.previousYear).toMatchObject({ dateFrom: '2025-01-01', dateTo: '2025-12-31' })
    expect(server.annual.projection?.historicalYearsUsed).toEqual([2025, 2024])
  })
})
