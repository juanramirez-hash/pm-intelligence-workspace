import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessProduct,
} from '../../../core/business/entities/product'

import type {
  BusinessProductPeriod,
} from '../../../core/business/entities/productPeriod'

import type {
  BusinessRepository,
} from '../../../core/business/repository'

import {
  buildExecutiveProductAttention,
} from './executiveProductAttention'

function product(
  id: string,
): BusinessProduct {
  return {
    id,
    model: id,
    sku: id,
    brand: 'TEST',
    firstSale: null,
    lastSale: null,
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
    activePeriods: new Set(),
    brands: new Set(),
    customers: new Set(),
    locations: new Set(),
  }
}

function period(
  productId: string,
  periodId: string,
  revenue: number,
): BusinessProductPeriod {
  return {
    id: `${periodId}::${productId}`,
    productId,
    periodId,
    revenue,
    grossProfit: revenue * 0.25,
    quantity: revenue > 0 ? 1 : 0,
    documents: revenue > 0 ? 1 : 0,
    customers: new Set(),
    brands: new Set(),
    locations: new Set(),
  }
}

function repository(): BusinessRepository {
  const products = new Map(
    [
      'GROWING',
      'DECLINING',
      'NEW',
      'RECOVERED',
      'LOST',
    ].map(
      (id) => [id, product(id)],
    ),
  )

  const timelines = new Map<
    string,
    BusinessProductPeriod[]
  >([
    [
      'GROWING',
      [
        period('GROWING', '2026-06', 100),
        period('GROWING', '2026-07', 150),
      ],
    ],
    [
      'DECLINING',
      [
        period('DECLINING', '2026-06', 100),
        period('DECLINING', '2026-07', 60),
      ],
    ],
    [
      'NEW',
      [
        period('NEW', '2026-07', 50),
      ],
    ],
    [
      'RECOVERED',
      [
        period('RECOVERED', '2026-05', 40),
        period('RECOVERED', '2026-07', 70),
      ],
    ],
    [
      'LOST',
      [
        period('LOST', '2026-06', 90),
      ],
    ],
  ])

  const byPeriodId = new Map([
    [
      '2026-06',
      [
        period('GROWING', '2026-06', 100),
        period('DECLINING', '2026-06', 100),
        period('LOST', '2026-06', 90),
      ],
    ],
    [
      '2026-07',
      [
        period('GROWING', '2026-07', 150),
        period('DECLINING', '2026-07', 60),
        period('NEW', '2026-07', 50),
        period('RECOVERED', '2026-07', 70),
      ],
    ],
  ])

  return {
    getPeriods: () => [
      {
        id: '2026-05',
        year: 2026,
        month: 5,
      },
      {
        id: '2026-06',
        year: 2026,
        month: 6,
      },
      {
        id: '2026-07',
        year: 2026,
        month: 7,
      },
    ],
    product: {
      findPeriodsByPeriodId: (
        periodId: string,
      ) => byPeriodId.get(periodId) ?? [],
      findById: (
        id: string,
      ) => products.get(id),
      findTimeline: (
        id: string,
      ) => timelines.get(id) ?? [],
    },
  } as unknown as BusinessRepository
}

describe(
  'buildExecutiveProductAttention',
  () => {
    it('clasifica crecimiento, caída, altas, recuperación y pérdida', () => {
      const result =
        buildExecutiveProductAttention(
          repository(),
          '2026-07',
        )

      expect(result).toEqual({
        currentPeriodId: '2026-07',
        previousPeriodId: '2026-06',
        totalProducts: 5,
        activeProducts: 4,
        productsRequiringAttention: 2,
        growingProducts: 1,
        decliningProducts: 1,
        recoveredProducts: 1,
        newProducts: 1,
        inactiveOrLostProducts: 1,
      })
    })

    it('returns null without repository or current period', () => {
      expect(
        buildExecutiveProductAttention(
          null,
          '2026-07',
        ),
      ).toBeNull()

      expect(
        buildExecutiveProductAttention(
          repository(),
          null,
        ),
      ).toBeNull()
    })
  },
)
