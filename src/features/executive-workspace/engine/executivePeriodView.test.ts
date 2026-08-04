import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedSalesRow,
} from '../../data-center/importers/sales/salesTypes'

import {
  buildBusinessDataModel,
} from '../../../core/business/builders'

import {
  BusinessRepository,
} from '../../../core/business/repository'

import {
  buildExecutivePeriodSelection,
  buildExecutivePeriodView,
} from './executivePeriodView'

function row(
  date: string,
  brand: string,
  customerId: string,
  model: string,
  revenue: number,
): NormalizedSalesRow {
  return {
    date,
    brand,
    revenue,
    grossProfit: revenue * 0.3,
    customerId,
    customerName: `Cliente ${customerId}`,
    model,
    quantity: 1,
    documentNumber:
      `${date}-${brand}-${customerId}-${model}`,
    location: 'CDMX',
    salesRep: 'PM',
    currency: 'MXN',
  }
}

function createRepository():
BusinessRepository {
  const rows:
    NormalizedSalesRow[] = [
    row('2025-05-10', 'UNV', 'C1', 'P-A', 50),
    row('2025-06-10', 'UNV', 'C1', 'P-A', 60),
    row('2025-07-10', 'UNV', 'C1', 'P-A', 70),
    row('2026-02-10', 'ZKTECO', 'C4', 'P-D', 40),
    row('2026-03-10', 'UNV', 'C1', 'P-A', 80),
    row('2026-04-10', 'UNV', 'C1', 'P-A', 100),
    row('2026-05-10', 'UNV', 'C1', 'P-A', 120),
    row('2026-06-10', 'UNV', 'C1', 'P-A', 100),
    row('2026-06-12', 'UNV', 'C2', 'P-B', 50),
    row('2026-06-14', 'UNV', 'C5', 'P-E', 100),
    row('2026-07-10', 'UNV', 'C1', 'P-A', 80),
    row('2026-07-12', 'AJAX', 'C3', 'P-C', 200),
    row('2026-07-14', 'ZKTECO', 'C4', 'P-D', 60),
    row('2026-07-16', 'UNV', 'C5', 'P-E', 110),
  ]

  return new BusinessRepository(
    buildBusinessDataModel(rows),
  )
}

describe(
  'EW-001-HOTFIX1 executive period view',
  () => {
    it('resolves monthly navigation and quick ranges', () => {
      const repository =
        createRepository()

      const month =
        buildExecutivePeriodSelection(
          repository,
          {
            anchorPeriodId: '2026-07',
            preset: 'month',
          },
        )

      expect(month.currentPeriodIds).toEqual([
        '2026-07',
      ])

      expect(
        month.comparisonPeriodIds,
      ).toEqual(['2026-06'])

      expect(
        month.previousAnchorPeriodId,
      ).toBe('2026-06')

      expect(month.nextAnchorPeriodId).toBeNull()

      const quarter =
        buildExecutivePeriodSelection(
          repository,
          {
            anchorPeriodId: '2026-07',
            preset: 'last_3_months',
          },
        )

      expect(quarter.currentPeriodIds).toEqual([
        '2026-05',
        '2026-06',
        '2026-07',
      ])

      expect(
        quarter.comparisonPeriodIds,
      ).toEqual([
        '2026-02',
        '2026-03',
        '2026-04',
      ])
    })

    it('calculates attention over the selected month instead of historical totals', () => {
      const view =
        buildExecutivePeriodView(
          createRepository(),
          {
            anchorPeriodId: '2026-07',
            preset: 'month',
          },
        )

      expect(
        view.attention.products
          .totalAnalyzed,
      ).toBe(5)

      expect(
        view.attention.products
          .entitiesRequiringAttention,
      ).toBe(2)

      expect(
        [
          ...(
            view.attention.products
              .entityIds
              ?.requiringAttention ?? []
          ),
        ].sort(),
      ).toEqual(['P-A', 'P-B'])

      expect(
        view.attention.products
          .decliningEntities,
      ).toBe(1)

      expect(
        view.attention.products
          .inactiveOrLostEntities,
      ).toBe(1)

      expect(
        view.attention.products
          .newEntities,
      ).toBe(1)

      expect(
        view.attention.products
          .recoveredEntities,
      ).toBe(1)

      expect(
        view.attention.customers
          .totalAnalyzed,
      ).toBe(5)

      expect(
        view.attention.customers
          .activeEntities,
      ).toBe(4)

      expect(
        view.attention.customers
          .entitiesRequiringAttention,
      ).toBe(1)

      expect(
        view.attention.customers
          .entityIds
          ?.requiringAttention,
      ).toEqual(['C1'])

      expect(
        view.attention.customers
          .inactiveOrLostEntities,
      ).toBe(0)

      expect(
        view.attention.customers
          .newEntities,
      ).toBe(1)

      expect(
        view.attention.customers
          .recoveredEntities,
      ).toBe(1)

      expect(
        view.attention.brands
          .totalAnalyzed,
      ).toBe(3)
    })

    it('updates sales, trends, top customers and Brand Intelligence from one selection', () => {
      const view =
        buildExecutivePeriodView(
          createRepository(),
          {
            anchorPeriodId: '2026-07',
            preset: 'month',
          },
        )

      expect(
        view.salesPerformance
          .currentRevenue,
      ).toBe(450)

      expect(
        view.salesPerformance
          .comparison.comparisonValue,
      ).toBe(250)

      expect(
        view.commercialTrends
          .monthlyRevenue.at(-1)
          ?.periodId,
      ).toBe('2026-07')

      expect(
        view.commercialTrends
          .topCustomers[0]
          ?.customerId,
      ).toBe('C3')

      expect(
        view.brands?.currentPeriodId,
      ).toBe('2026-07')

      expect(
        view.brands
          ?.brandsRequiringAttention,
      ).toBe(1)
    })
  },
)
