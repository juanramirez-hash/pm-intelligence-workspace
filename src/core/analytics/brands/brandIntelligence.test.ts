import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../../business/builders'

import {
  BusinessRepository,
} from '../../business/repository'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  buildBrandIntelligence,
} from './brandIntelligence'

function sale(
  overrides: Partial<NormalizedSalesRow>,
): NormalizedSalesRow {
  return {
    date: '2026-07-01',
    brand: 'UNV',
    revenue: 100,
    grossProfit: 25,
    customerId: 'C1',
    customerName: 'Cliente Uno',
    productCode: null,
    model: 'IPC-A',
    productStatus: 'A',
    quantity: 1,
    documentNumber: 'D1',
    location: 'CDMX',
    salesRep: 'VENDEDOR 1',
    currency: 'MXN',
    ...overrides,
  }
}

describe(
  'Brand Intelligence equivalent open-period comparison',
  () => {
    it(
      'compara un periodo abierto contra el mismo ordinal de weekdays del periodo anterior',
      () => {
        const repository =
          new BusinessRepository(
            buildBusinessDataModel([
              sale({
                date: '2026-07-01',
                revenue: 100,
                grossProfit: 25,
                documentNumber: 'JUL-01',
              }),
              sale({
                date: '2026-07-10',
                revenue: 200,
                grossProfit: 50,
                documentNumber: 'JUL-10',
              }),
              sale({
                date: '2026-07-20',
                revenue: 1000,
                grossProfit: 250,
                documentNumber: 'JUL-20',
              }),
              sale({
                date: '2026-08-03',
                revenue: 150,
                grossProfit: 30,
                documentNumber: 'AUG-03',
              }),
              sale({
                date: '2026-08-12',
                revenue: 250,
                grossProfit: 70,
                documentNumber: 'AUG-12',
              }),
            ]),
          )

        const summary =
          buildBrandIntelligence(
            repository,
          )

        expect(summary).not.toBeNull()

        if (!summary) {
          return
        }

        expect(
          summary.analysisDate,
        ).toBe(
          '2026-08-12',
        )

        expect(
          summary.currentPeriodId,
        ).toBe(
          '2026-08',
        )

        expect(
          summary.currentPeriodEnd,
        ).toBe(
          '2026-08-12',
        )

        expect(
          summary.previousPeriodId,
        ).toBe(
          '2026-07',
        )

        expect(
          summary.previousPeriodEnd,
        ).toBe(
          '2026-07-10',
        )

        expect(
          summary.currentPeriodRevenue,
        ).toBe(
          400,
        )

        expect(
          summary.previousPeriodRevenue,
        ).toBe(
          300,
        )

        expect(
          summary.revenueVariation,
        ).toBe(
          100,
        )

        expect(
          summary.revenueVariationPercentage,
        ).toBeCloseTo(
          1 / 3,
        )

        const brand =
          summary.brands.find(
            (item) =>
              item.brandId ===
              'UNV',
          )

        expect(brand).toBeDefined()

        expect(
          brand?.currentPeriod.revenue,
        ).toBe(
          400,
        )

        expect(
          brand?.previousPeriod.revenue,
        ).toBe(
          300,
        )

        expect(
          brand?.revenueVariation,
        ).toBe(
          100,
        )

        expect(
          brand?.revenueVariationPercentage,
        ).toBeCloseTo(
          1 / 3,
        )

        expect(
          brand?.trendStatus,
        ).toBe(
          'growing',
        )
      },
    )
  },
)