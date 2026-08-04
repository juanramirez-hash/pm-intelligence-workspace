import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessRepository,
} from '../../../core/business/repository'

import {
  buildExecutiveCommercialTrends,
} from './executiveCommercialTrends'

function createRepository(): BusinessRepository {
  return {
    revenue: {
      getLastMonths: () => [
        {
          id: '2026-06',
          year: 2026,
          month: 6,
          periodStart: '2026-06-01',
          periodEnd: '2026-06-30',
          revenue: 100,
          grossProfit: 30,
          quantity: 10,
          documents: 4,
          customerCount: 2,
          brandCount: 2,
          productCount: 3,
        },
        {
          id: '2026-07',
          year: 2026,
          month: 7,
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          revenue: 150,
          grossProfit: 45,
          quantity: 15,
          documents: 6,
          customerCount: 3,
          brandCount: 2,
          productCount: 4,
        },
      ],
    },
    customer: {
      getAll: () => [
        {
          id: '000001',
          name: 'Cliente Uno',
          firstPurchase: null,
          lastPurchase: null,
          revenue: 120,
          grossProfit: 36,
          quantity: 12,
          documents: 5,
          brands: new Set(),
          products: new Set(),
          locations: new Set(),
          activePeriods:
            new Set(['2026-06', '2026-07']),
        },
        {
          id: '000002',
          name: 'Cliente Dos',
          firstPurchase: null,
          lastPurchase: null,
          revenue: 80,
          grossProfit: 16,
          quantity: 8,
          documents: 3,
          brands: new Set(),
          products: new Set(),
          locations: new Set(),
          activePeriods:
            new Set(['2026-07']),
        },
      ],
      topByRevenue: () => [
        {
          id: '000001',
          name: 'Cliente Uno',
          firstPurchase: null,
          lastPurchase: null,
          revenue: 120,
          grossProfit: 36,
          quantity: 12,
          documents: 5,
          brands: new Set(),
          products: new Set(),
          locations: new Set(),
          activePeriods:
            new Set(['2026-06', '2026-07']),
        },
      ],
    },
  } as unknown as BusinessRepository
}

describe(
  'Executive commercial trends',
  () => {
    it('builds monthly revenue and customer concentration from the repository', () => {
      const result =
        buildExecutiveCommercialTrends(
          createRepository(),
        )

      expect(result.periodCount).toBe(2)

      expect(result.monthlyRevenue).toEqual([
        expect.objectContaining({
          periodId: '2026-06',
          revenue: 100,
          grossMargin: 30,
        }),
        expect.objectContaining({
          periodId: '2026-07',
          revenue: 150,
          grossMargin: 30,
        }),
      ])

      expect(result.totalCustomerRevenue).toBe(200)

      expect(result.topCustomers).toEqual([
        expect.objectContaining({
          customerId: '000001',
          customerName: 'Cliente Uno',
          revenueShare: 0.6,
          activePeriods: 2,
        }),
      ])
    })

    it('returns an explicit empty model without a repository', () => {
      expect(
        buildExecutiveCommercialTrends(null),
      ).toEqual({
        monthlyRevenue: [],
        topCustomers: [],
        totalCustomerRevenue: 0,
        periodCount: 0,
      })
    })
  },
)
