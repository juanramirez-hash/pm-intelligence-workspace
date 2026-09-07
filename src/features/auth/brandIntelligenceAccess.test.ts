import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
} from '../../core/analytics/brands'

import type {
  AuthenticatedUser,
} from './authTypes'

import {
  scopeBrandIntelligenceSummary,
} from './brandIntelligenceAccess'

function buildUser(): AuthenticatedUser {
  return {
    id: 1,
    email: 'pm@example.com',
    name: 'PM',
    role: 'pm',
    roleName: 'Product Manager',
    scope: 'assigned',
    writeAccess: true,
    brandIds: [
      'ALTER',
      'MIKROTIK',
    ],
  }
}

function buildBrand(
  brandId: string,
  currentRevenue: number,
  previousRevenue: number,
  trendStatus:
    BrandIntelligenceItem['trendStatus'],
  requiresAttention = false,
): BrandIntelligenceItem {
  return {
    brandId,
    brandName: brandId,

    lifecycleStatus: 'active',
    trendStatus,

    currentPeriod: {
      revenue: currentRevenue,
      grossProfit: 0,
      quantity: 0,
      documents: 0,
      customers: 0,
      products: 0,
      margin: null,
    },

    previousPeriod: {
      revenue: previousRevenue,
      grossProfit: 0,
      quantity: 0,
      documents: 0,
      customers: 0,
      products: 0,
      margin: null,
    },

    revenueVariation:
      currentRevenue -
      previousRevenue,

    revenueVariationPercentage:
      previousRevenue === 0
        ? null
        : (
            currentRevenue -
            previousRevenue
          ) / previousRevenue,

    grossProfitVariation: 0,
    grossProfitVariationPercentage: 0,
    marginVariation: null,
    customerVariation: 0,
    productVariation: 0,

    historicalRevenue:
      currentRevenue,

    historicalGrossProfit: 0,
    historicalQuantity: 0,
    historicalCustomers: 0,
    historicalProducts: 0,

    revenueParticipation: 0,

    requiresAttention,

    attentionReason:
      requiresAttention
        ? 'Attention'
        : null,
  }
}

function buildSummary():
  BrandIntelligenceSummary {
  const brands = [
    buildBrand(
      'ALTER',
      100,
      80,
      'growing',
    ),
    buildBrand(
      'MIKROTIK',
      50,
      100,
      'declining',
      true,
    ),
    buildBrand(
      'UNV (UNIVIEW)',
      1000,
      500,
      'growing',
    ),
  ]

  return {
    analysisDate: '2026-09-06',

    currentPeriodId: '2026-09',
    currentPeriodStart:
      '2026-09-01',
    currentPeriodEnd:
      '2026-09-06',

    previousPeriodId: '2026-08',
    previousPeriodStart:
      '2026-08-01',
    previousPeriodEnd:
      '2026-08-06',

    totalBrands: 3,

    activeBrands: 3,
    newBrands: 0,
    recoveredBrands: 0,
    inactiveBrands: 0,
    lostBrands: 0,

    growingBrands: 2,
    decliningBrands: 1,
    stableBrands: 0,
    brandsWithoutComparison: 0,

    brandsRequiringAttention: 1,

    currentPeriodRevenue: 1150,
    previousPeriodRevenue: 680,

    revenueVariation: 470,

    revenueVariationPercentage:
      470 / 680,

    brands,

    attentionBrands:
      brands.filter(
        (brand) =>
          brand.requiresAttention,
      ),

    topGrowingBrands:
      brands.filter(
        (brand) =>
          brand.trendStatus ===
          'growing',
      ),

    topDecliningBrands:
      brands.filter(
        (brand) =>
          brand.trendStatus ===
          'declining',
      ),

    topRevenueBrands:
      [...brands],
  }
}

describe(
  'scopeBrandIntelligenceSummary',
  () => {
    it(
      'recalculates summary using only assigned brands',
      () => {
        const result =
          scopeBrandIntelligenceSummary(
            buildUser(),
            buildSummary(),
          )

        expect(
          result.brands.map(
            (brand) =>
              brand.brandId,
          ),
        ).toEqual([
          'ALTER',
          'MIKROTIK',
        ])

        expect(
          result.totalBrands,
        ).toBe(2)

        expect(
          result.currentPeriodRevenue,
        ).toBe(150)

        expect(
          result.previousPeriodRevenue,
        ).toBe(180)

        expect(
          result.revenueVariation,
        ).toBe(-30)

        expect(
          result.growingBrands,
        ).toBe(1)

        expect(
          result.decliningBrands,
        ).toBe(1)

        expect(
          result.brandsRequiringAttention,
        ).toBe(1)

        expect(
          result.topRevenueBrands.map(
            (brand) =>
              brand.brandId,
          ),
        ).toEqual([
          'ALTER',
          'MIKROTIK',
        ])

        expect(
          result.brands[0]
            ?.revenueParticipation,
        ).toBeCloseTo(
          100 / 150,
        )

        expect(
          result.brands[1]
            ?.revenueParticipation,
        ).toBeCloseTo(
          50 / 150,
        )
      },
    )
  },
)