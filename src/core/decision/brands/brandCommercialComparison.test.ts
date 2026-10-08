import { assert, describe, it } from 'vitest'
import { SalesSegmentationQueries } from '../../business/repository/salesSegmentationQueries'
import type { BusinessRepository } from '../../business/repository'
import type { BrandDecisionModel } from './brandDecisionTypes'
import { buildBrandCommercialComparison } from './brandCommercialComparison'

function fixture(cutoff = '2026-09-17', currentId = '2026-09', previousId = '2026-08') {
  const rows = [
    ['2026-08-03', 'A', 'C1', 'P1', 100],
    ['2026-08-19', 'A', 'C1', 'P1', 200],
    ['2026-08-20', 'A', 'C2', 'P2', 900],
    ['2026-08-03', 'B', 'C1', 'P1', 9000],
    ['2026-09-01', 'A', 'C1', 'P1', 120],
    ['2026-09-17', 'A', 'C1', 'P2', 180],
    ['2026-09-18', 'A', 'C3', 'P3', 1000],
  ] as const
  const salesSegments = new Map(rows.map(([dateId, brandId, customerId, productId, revenue], index) => [String(index), {
    id: String(index), dateId, periodId: dateId.slice(0, 7), brandId, customerId, productId,
    revenue, grossProfit: revenue / 4, quantity: 1, rowCount: 1,
    documentNumbers: new Set([`DOC${index}`]),
  }]))
  const salesSegmentation = new SalesSegmentationQueries({
    salesSegments, customers: new Map(), products: new Map(), brands: new Map(),
  } as unknown as ConstructorParameters<typeof SalesSegmentationQueries>[0])
  const repository = { salesSegmentation, getDataPeriodEnd: () => cutoff } as unknown as BusinessRepository
  const snapshot = (periodId: string) => ({ periodId, actuals: { revenue: 1200, customers: 2 } })
  const decision = {
    brandId: 'A', currentPeriodId: currentId, previousPeriodId: previousId,
    currentSnapshot: snapshot(currentId), previousSnapshot: snapshot(previousId),
  } as unknown as BrandDecisionModel
  return { repository, decision }
}
function multiYearFixture(
  include2024 = true,
) {
  const rows = [
    // 2025:
    // YTD al corte = 200
    // FY = 400
    // avance histórico = 50%
    [
      '2025-01-10',
      'A',
      'C25-1',
      'P25-1',
      100,
    ],

    [
      '2025-09-17',
      'A',
      'C25-2',
      'P25-2',
      100,
    ],

    [
      '2025-12-10',
      'A',
      'C25-3',
      'P25-3',
      200,
    ],

    // 2026:
    // YTD al corte = 600
    // Si el avance histórico es 50%,
    // el cierre proyectado debe ser 1,200.
    [
      '2026-01-12',
      'A',
      'C26-1',
      'P26-1',
      300,
    ],

    [
      '2026-09-17',
      'A',
      'C26-2',
      'P26-2',
      300,
    ],

    // Está después del corte y no debe entrar.
    [
      '2026-09-18',
      'A',
      'C26-3',
      'P26-3',
      900,
    ],
  ] as Array<
    readonly [
      string,
      string,
      string,
      string,
      number,
    ]
  >

  if (include2024) {
    rows.push(
      // 2024:
      // 13er día laborable de septiembre
      // cae el 18.
      // YTD = 400
      // FY = 800
      // avance histórico = 50%.
      [
        '2024-01-10',
        'A',
        'C24-1',
        'P24-1',
        200,
      ],

      [
        '2024-09-18',
        'A',
        'C24-2',
        'P24-2',
        200,
      ],

      [
        '2024-12-10',
        'A',
        'C24-3',
        'P24-3',
        400,
      ],
    )
  }

  const salesSegments =
    new Map(
      rows.map(
        (
          [
            dateId,
            brandId,
            customerId,
            productId,
            revenue,
          ],
          index,
        ) => [
          String(index),
          {
            id:
              String(index),

            dateId,

            periodId:
              dateId.slice(
                0,
                7,
              ),

            brandId,
            customerId,
            productId,

            revenue,

            grossProfit:
              revenue / 4,

            quantity: 1,
            rowCount: 1,

            documentNumbers:
              new Set([
                `MY${index}`,
              ]),
          },
        ],
      ),
    )

  const salesSegmentation =
    new SalesSegmentationQueries({
      salesSegments,
      customers: new Map(),
      products: new Map(),
      brands: new Map(),
    } as unknown as ConstructorParameters<
      typeof SalesSegmentationQueries
    >[0])

  const repository = {
    salesSegmentation,

    getDataPeriodEnd:
      () =>
        '2026-09-17',
  } as unknown as BusinessRepository

  const decision = {
    brandId: 'A',

    currentPeriodId:
      '2026-09',

    previousPeriodId:
      '2026-08',

    currentSnapshot: {
      periodId:
        '2026-09',

      actuals: {
        revenue: 1200,
        customers: 3,
      },
    },

    previousSnapshot:
      null,
  } as unknown as BrandDecisionModel

  return {
    repository,
    decision,
  }
}

describe('Brand commercial comparison at equivalent cutoff', () => {
  it('uses 13 working days in both months and unique customers/products within each window', () => {
    const { repository, decision } = fixture()
    const result = buildBrandCommercialComparison(repository, decision)
    assert.match(result.ranges['2026-08'], /2026-08-19 · 13/)
    assert.match(result.ranges['2026-09'], /2026-09-17 · 13/)
    assert.equal(result.snapshots[0].actuals.revenue, 300)
    assert.equal(result.snapshots[1].actuals.revenue, 300)
    assert.equal(result.snapshots[0].actuals.customers, 1)
    assert.equal(result.snapshots[0].actuals.products, 1)
    assert.equal(result.snapshots[1].actuals.products, 2)
    assert.equal(result.snapshots[1].actuals.grossMargin, 0.25)
    assert.equal(decision.currentSnapshot.actuals.revenue, 1200)
  })
  it('keeps complete months for closed periods', () => {
    const { repository, decision } = fixture('2026-09-30')
    const result = buildBrandCommercialComparison(repository, decision)
    assert.equal(result.snapshots[0].actuals.revenue, 1200)
    assert.equal(result.snapshots[1].actuals.revenue, 1300)
    assert.match(result.description, /Mes cerrado/)
  })
  it('does not substitute a full month when there are no elapsed working days', () => {
    const { repository, decision } = fixture('2026-08-02', '2026-08', '2026-07')
    assert.equal(buildBrandCommercialComparison(repository, decision).snapshots.length, 0)
  })
  it('does not publish fabricated prior-period changes when prior snapshot is absent', () => {
    const { repository, decision } = fixture()
    decision.previousSnapshot = null
    const result = buildBrandCommercialComparison(repository, decision)
    assert.equal(result.snapshots.length, 1)
    assert.match(result.description, /variación no disponible/)
  })
  it('reports missing dated detail instead of monthly totals as comparable data', () => {
    const { repository, decision } = fixture('2026-11-17', '2026-11', '2026-10')
    const result = buildBrandCommercialComparison(repository, decision)
    assert.equal(result.snapshots.length, 0)
    assert.match(result.description, /Falta detalle/)
  })
  it('groups recovery amounts by brand even when the same customer buys other brands', () => {
    const { repository } = fixture()
    const customer = repository.salesSegmentation.groupBy('customer', { periodIds: ['2026-08'], brandIds: ['A'] }).find((row) => row.id === 'C1')
    assert.equal(customer?.revenue, 300)
    assert.equal(customer?.grossProfit, 75)
    assert.equal(customer?.documents, 2)
  })
    it(
    'compares the same working-day segment across the current year and two prior years',
    () => {
      const {
        repository,
        decision,
      } =
        multiYearFixture()

      const result =
        buildBrandCommercialComparison(
          repository,
          decision,
        )

      assert.equal(
        result.currentYear,
        2026,
      )

      assert.equal(
        result.monthly.current
          ?.workingDays,
        13,
      )

      assert.equal(
        result.monthly.previousYear
          ?.workingDays,
        13,
      )

      assert.equal(
        result.monthly.twoYearsBack
          ?.workingDays,
        13,
      )

      assert.equal(
        result.monthly.current
          ?.dateTo,
        '2026-09-17',
      )

      assert.equal(
        result.monthly.previousYear
          ?.dateTo,
        '2025-09-17',
      )

      assert.equal(
        result.monthly.twoYearsBack
          ?.dateTo,
        '2024-09-18',
      )

      assert.equal(
        result.monthly.current
          ?.revenue,
        300,
      )

      assert.equal(
        result.monthly.previousYear
          ?.revenue,
        100,
      )

      assert.equal(
        result.monthly.twoYearsBack
          ?.revenue,
        200,
      )
    },
  )

  it(
    'builds equivalent YTD windows for the same segment of each year',
    () => {
      const {
        repository,
        decision,
      } =
        multiYearFixture()

      const result =
        buildBrandCommercialComparison(
          repository,
          decision,
        )

      assert.equal(
        result.ytd.current
          ?.revenue,
        600,
      )

      assert.equal(
        result.ytd.previousYear
          ?.revenue,
        200,
      )

      assert.equal(
        result.ytd.twoYearsBack
          ?.revenue,
        400,
      )

      assert.equal(
        result.ytd.current
          ?.dateFrom,
        '2026-01-01',
      )

      assert.equal(
        result.ytd.previousYear
          ?.dateFrom,
        '2025-01-01',
      )

      assert.equal(
        result.ytd.twoYearsBack
          ?.dateFrom,
        '2024-01-01',
      )
    },
  )

  it(
    'projects annual revenue and GP from historical completion ratios',
    () => {
      const {
        repository,
        decision,
      } =
        multiYearFixture()

      const result =
        buildBrandCommercialComparison(
          repository,
          decision,
        )

      assert.equal(
        result.annual.previousYear
          ?.revenue,
        400,
      )

      assert.equal(
        result.annual.twoYearsBack
          ?.revenue,
        800,
      )

      assert.equal(
        result.annual.projection
          ?.historicalRevenueCompletionRatio,
        0.5,
      )

      assert.equal(
        result.annual.projection
          ?.revenue,
        1200,
      )

      assert.equal(
        result.annual.projection
          ?.grossProfit,
        300,
      )

      assert.equal(
        result.annual.projection
          ?.grossMargin,
        0.25,
      )

      assert.deepEqual(
        result.annual.projection
          ?.historicalYearsUsed,
        [
          2025,
          2024,
        ],
      )
    },
  )

  it(
    'falls back to one historical year when the second prior year has no data',
    () => {
      const {
        repository,
        decision,
      } =
        multiYearFixture(
          false,
        )

      const result =
        buildBrandCommercialComparison(
          repository,
          decision,
        )

      assert.equal(
        result.monthly.twoYearsBack,
        null,
      )

      assert.equal(
        result.ytd.twoYearsBack,
        null,
      )

      assert.equal(
        result.annual.twoYearsBack,
        null,
      )

      assert.deepEqual(
        result.annual.projection
          ?.historicalYearsUsed,
        [
          2025,
        ],
      )

      assert.equal(
        result.annual.projection
          ?.revenue,
        1200,
      )
    },
  )
})
