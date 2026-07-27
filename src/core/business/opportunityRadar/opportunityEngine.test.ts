import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
} from '../../analytics/brands'

import {
  OpportunityEngine,
} from './opportunityEngine'

import {
  calculateOpportunityScore,
  classifyOpportunityPriority,
} from './opportunityScore'

function createBrand(
  overrides: Partial<BrandIntelligenceItem>,
): BrandIntelligenceItem {
  return {
    brandId: 'brand-1',
    brandName: 'Marca Uno',
    lifecycleStatus: 'active',
    trendStatus: 'stable',
    currentPeriod: {
      revenue: 100,
      grossProfit: 30,
      quantity: 10,
      documents: 2,
      customers: 3,
      products: 2,
      margin: 0.3,
    },
    previousPeriod: {
      revenue: 100,
      grossProfit: 30,
      quantity: 10,
      documents: 2,
      customers: 3,
      products: 2,
      margin: 0.3,
    },
    revenueVariation: 0,
    revenueVariationPercentage: 0,
    grossProfitVariation: 0,
    grossProfitVariationPercentage: 0,
    marginVariation: 0,
    customerVariation: 0,
    productVariation: 0,
    historicalRevenue: 200,
    historicalGrossProfit: 60,
    historicalQuantity: 20,
    historicalCustomers: 4,
    historicalProducts: 3,
    revenueParticipation: 0.05,
    requiresAttention: false,
    attentionReason: null,
    ...overrides,
  }
}

function createSummary(
  brands: BrandIntelligenceItem[],
): BrandIntelligenceSummary {
  return {
    analysisDate: '2026-07-31T18:00:00.000Z',
    currentPeriodId: '2026-07',
    currentPeriodStart: '2026-07-01',
    currentPeriodEnd: '2026-07-31',
    previousPeriodId: '2026-06',
    previousPeriodStart: '2026-06-01',
    previousPeriodEnd: '2026-06-30',
    totalBrands: brands.length,
    activeBrands: brands.filter(
      (brand) => brand.lifecycleStatus === 'active',
    ).length,
    newBrands: 0,
    recoveredBrands: 0,
    inactiveBrands: brands.filter(
      (brand) => brand.lifecycleStatus === 'inactive',
    ).length,
    lostBrands: brands.filter(
      (brand) => brand.lifecycleStatus === 'lost',
    ).length,
    growingBrands: brands.filter(
      (brand) => brand.trendStatus === 'growing',
    ).length,
    decliningBrands: brands.filter(
      (brand) => brand.trendStatus === 'declining',
    ).length,
    stableBrands: brands.filter(
      (brand) => brand.trendStatus === 'stable',
    ).length,
    brandsWithoutComparison: 0,
    brandsRequiringAttention: brands.filter(
      (brand) => brand.requiresAttention,
    ).length,
    currentPeriodRevenue: brands.reduce(
      (total, brand) => total + brand.currentPeriod.revenue,
      0,
    ),
    previousPeriodRevenue: brands.reduce(
      (total, brand) => total + brand.previousPeriod.revenue,
      0,
    ),
    revenueVariation: brands.reduce(
      (total, brand) => total + brand.revenueVariation,
      0,
    ),
    revenueVariationPercentage: null,
    brands,
    attentionBrands: brands.filter(
      (brand) => brand.requiresAttention,
    ),
    topGrowingBrands: brands.filter(
      (brand) => brand.trendStatus === 'growing',
    ),
    topDecliningBrands: brands.filter(
      (brand) => brand.trendStatus === 'declining',
    ),
    topRevenueBrands: [...brands],
  }
}

describe('Opportunity Radar', () => {
  it('calculates and classifies a normalized score', () => {
    const score = calculateOpportunityScore({
      impact: 100,
      urgency: 100,
      probability: 100,
      coverage: 100,
      risk: 100,
    })

    expect(score).toBe(100)
    expect(classifyOpportunityPriority(score)).toBe('critical')
  })

  it('builds deterministic opportunities ordered by score', () => {
    const declining = createBrand({
      brandId: 'declining',
      brandName: 'Marca en descenso',
      trendStatus: 'declining',
      revenueVariation: -500,
      revenueVariationPercentage: -0.5,
      requiresAttention: true,
      attentionReason: 'Contracción relevante',
      currentPeriod: {
        revenue: 500,
        grossProfit: 120,
        quantity: 8,
        documents: 2,
        customers: 5,
        products: 4,
        margin: 0.24,
      },
      previousPeriod: {
        revenue: 1000,
        grossProfit: 300,
        quantity: 15,
        documents: 4,
        customers: 7,
        products: 5,
        margin: 0.3,
      },
    })

    const growing = createBrand({
      brandId: 'growing',
      brandName: 'Marca en crecimiento',
      trendStatus: 'growing',
      revenueVariation: 150,
      revenueVariationPercentage: 0.3,
      currentPeriod: {
        revenue: 650,
        grossProfit: 180,
        quantity: 12,
        documents: 3,
        customers: 6,
        products: 5,
        margin: 0.28,
      },
      previousPeriod: {
        revenue: 500,
        grossProfit: 140,
        quantity: 9,
        documents: 2,
        customers: 4,
        products: 4,
        margin: 0.28,
      },
    })

    const radar = new OpportunityEngine()
      .buildForBrandWorkspace(
        createSummary([declining, growing]),
      )

    expect(radar.opportunities.length).toBeGreaterThan(0)
    expect(radar.opportunities[0]?.score).toBeGreaterThanOrEqual(
      radar.opportunities.at(-1)?.score ?? 0,
    )
    expect(
      radar.opportunities.some(
        (opportunity) =>
          opportunity.type === 'recovery',
      ),
    ).toBe(true)
    expect(
      radar.opportunities.every(
        (opportunity) =>
          opportunity.explanation.ruleId.length > 0,
      ),
    ).toBe(true)
  })
})
