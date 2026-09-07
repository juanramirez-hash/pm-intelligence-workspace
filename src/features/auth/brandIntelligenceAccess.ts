import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
} from '../../core/analytics/brands'

import type {
  AuthenticatedUser,
} from './authTypes'

import {
  canAccessBrand,
} from './brandAccess'

function getVariationPercentage(
  currentValue: number,
  previousValue: number,
): number | null {
  if (previousValue === 0) {
    return currentValue === 0
      ? 0
      : null
  }

  return (
    currentValue -
    previousValue
  ) / previousValue
}

function sortByRevenueDescending(
  left: BrandIntelligenceItem,
  right: BrandIntelligenceItem,
): number {
  return (
    right.currentPeriod.revenue -
    left.currentPeriod.revenue
  )
}

function sortByVariationDescending(
  left: BrandIntelligenceItem,
  right: BrandIntelligenceItem,
): number {
  return (
    right.revenueVariation -
    left.revenueVariation
  )
}

function sortByVariationAscending(
  left: BrandIntelligenceItem,
  right: BrandIntelligenceItem,
): number {
  return (
    left.revenueVariation -
    right.revenueVariation
  )
}

function scopeBrandItems(
  user: AuthenticatedUser,
  brands: readonly BrandIntelligenceItem[],
): BrandIntelligenceItem[] {
  return brands.filter(
    (brand) =>
      canAccessBrand(
        user,
        brand.brandId,
      ),
  )
}

export function scopeBrandIntelligenceSummary(
  user: AuthenticatedUser,
  summary: BrandIntelligenceSummary,
): BrandIntelligenceSummary {
  if (user.scope !== 'assigned') {
    return summary
  }

  const accessibleBrands =
    scopeBrandItems(
      user,
      summary.brands,
    )

  const currentPeriodRevenue =
    accessibleBrands.reduce(
      (total, brand) =>
        total +
        brand.currentPeriod.revenue,
      0,
    )

  const previousPeriodRevenue =
    accessibleBrands.reduce(
      (total, brand) =>
        total +
        brand.previousPeriod.revenue,
      0,
    )

  const brands =
    accessibleBrands.map(
      (brand) => ({
        ...brand,
        revenueParticipation:
          currentPeriodRevenue === 0
            ? 0
            : brand.currentPeriod.revenue /
              currentPeriodRevenue,
      }),
    )

  const attentionBrands =
    brands.filter(
      (brand) =>
        brand.requiresAttention,
    )

  const revenueVariation =
    currentPeriodRevenue -
    previousPeriodRevenue

  return {
    ...summary,

    totalBrands:
      brands.length,

    activeBrands:
      brands.filter(
        (brand) =>
          brand.lifecycleStatus ===
          'active',
      ).length,

    newBrands:
      brands.filter(
        (brand) =>
          brand.lifecycleStatus ===
          'new',
      ).length,

    recoveredBrands:
      brands.filter(
        (brand) =>
          brand.lifecycleStatus ===
          'recovered',
      ).length,

    inactiveBrands:
      brands.filter(
        (brand) =>
          brand.lifecycleStatus ===
          'inactive',
      ).length,

    lostBrands:
      brands.filter(
        (brand) =>
          brand.lifecycleStatus ===
          'lost',
      ).length,

    growingBrands:
      brands.filter(
        (brand) =>
          brand.trendStatus ===
          'growing',
      ).length,

    decliningBrands:
      brands.filter(
        (brand) =>
          brand.trendStatus ===
          'declining',
      ).length,

    stableBrands:
      brands.filter(
        (brand) =>
          brand.trendStatus ===
          'stable',
      ).length,

    brandsWithoutComparison:
      brands.filter(
        (brand) =>
          brand.trendStatus ===
          'without_comparison',
      ).length,

    brandsRequiringAttention:
      attentionBrands.length,

    currentPeriodRevenue,

    previousPeriodRevenue,

    revenueVariation,

    revenueVariationPercentage:
      getVariationPercentage(
        currentPeriodRevenue,
        previousPeriodRevenue,
      ),

    brands,

    attentionBrands,

    topGrowingBrands:
      brands
        .filter(
          (brand) =>
            brand.trendStatus ===
            'growing',
        )
        .sort(
          sortByVariationDescending,
        )
        .slice(
          0,
          10,
        ),

    topDecliningBrands:
      brands
        .filter(
          (brand) =>
            brand.trendStatus ===
            'declining',
        )
        .sort(
          sortByVariationAscending,
        )
        .slice(
          0,
          10,
        ),

    topRevenueBrands:
      [...brands]
        .sort(
          sortByRevenueDescending,
        )
        .slice(
          0,
          10,
        ),
  }
}