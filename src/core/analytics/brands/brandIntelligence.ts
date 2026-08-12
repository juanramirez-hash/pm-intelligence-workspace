import {
  resolveEquivalentWorkingDayCutoff,
} from '../shared/dateAnalytics'

import type {
  BusinessBrand,
} from '../../business/entities/brand'

import type {
  BusinessBrandPeriod,
} from '../../business/entities/brandPeriod'

import type {
  BusinessPeriod,
} from '../../business/models/businessDataModel'

import type {
  BusinessRepository,
} from '../../business/repository'

import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
  BrandLifecycleStatus,
  BrandPeriodMetrics,
  BrandTrendStatus,
} from './brandIntelligenceTypes'

export interface BrandIntelligenceOptions {
  stableVariationThreshold?: number
  attentionDeclineThreshold?: number
}

const DEFAULT_STABLE_THRESHOLD = 0.05

const DEFAULT_ATTENTION_DECLINE_THRESHOLD =
  -0.15

function createEmptyPeriodMetrics():
  BrandPeriodMetrics {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,

    customers: 0,
    products: 0,

    margin: null,
  }
}

function buildPeriodMetrics(
  brandPeriod:
    BusinessBrandPeriod | undefined,
): BrandPeriodMetrics {
  if (!brandPeriod) {
    return createEmptyPeriodMetrics()
  }

  return {
    revenue:
      brandPeriod.revenue,

    grossProfit:
      brandPeriod.grossProfit,

    quantity:
      brandPeriod.quantity,

    documents:
      brandPeriod.documents,

    customers:
      brandPeriod.customers.size,

    products:
      brandPeriod.products.size,

    margin:
      getMargin(
        brandPeriod.revenue,
        brandPeriod.grossProfit,
      ),
  }
}

function buildSegmentationPeriodMetricsByBrand(
  repository: BusinessRepository,
  periodId: string,
  dateTo: string,
): Map<string, BrandPeriodMetrics> {
  return new Map<
    string,
    BrandPeriodMetrics
  >(
    repository.salesSegmentation
      .groupBy(
        'brand',
        {
          periodIds: [periodId],
          dateTo,
        },
      )
      .map(
        (
          group,
        ): [
          string,
          BrandPeriodMetrics,
        ] => [
          group.id,
          {
            revenue:
              group.revenue,

            grossProfit:
              group.grossProfit,

            quantity:
              group.quantity,

            documents:
              group.documents,

            customers:
              group.customerCount,

            products:
              group.productCount,

            margin:
              getMargin(
                group.revenue,
                group.grossProfit,
              ),
          },
        ],
      ),
  )
}

function resolvePeriodCutoff(
  repository: BusinessRepository,
  period: BusinessPeriod,
): string {
  const dataPeriodEnd =
    repository.getDataPeriodEnd()

  if (
    dataPeriodEnd?.startsWith(
      `${period.id}-`,
    )
  ) {
    return dataPeriodEnd
  }

  return period.periodEnd
}

function isOpenPeriod(
  repository: BusinessRepository,
  period: BusinessPeriod,
): boolean {
  const dataPeriodEnd =
    repository.getDataPeriodEnd()

  return Boolean(
    dataPeriodEnd?.startsWith(
      `${period.id}-`,
    ) &&
    dataPeriodEnd < period.periodEnd,
  )
}

function getMargin(
  revenue: number,
  grossProfit: number,
): number | null {
  if (revenue === 0) {
    return null
  }

  return grossProfit / revenue
}

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

function getPreviousPeriodId(
  period: BusinessPeriod,
): string {
  const previousMonthDate =
    new Date(
      Date.UTC(
        period.year,
        period.month - 2,
        1,
      ),
    )

  const year =
    previousMonthDate
      .getUTCFullYear()

  const month =
    String(
      previousMonthDate
        .getUTCMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}`
}

function getLatestPeriod(
  repository: BusinessRepository,
): BusinessPeriod | null {
  let latestPeriod:
    BusinessPeriod | null = null

  for (
    const period of
      repository.getPeriods()
  ) {
    if (
      !latestPeriod ||
      period.id >
        latestPeriod.id
    ) {
      latestPeriod =
        period
    }
  }

  return latestPeriod
}

function hasBrandActivity(
  metrics: BrandPeriodMetrics,
): boolean {
  return (
    metrics.revenue !== 0 ||
    metrics.grossProfit !== 0 ||
    metrics.quantity !== 0 ||
    metrics.documents > 0 ||
    metrics.customers > 0 ||
    metrics.products > 0
  )
}

function hasActivityBeforePeriod(
  repository: BusinessRepository,
  brandId: string,
  periodId: string,
): boolean {
  const brandTimeline =
    repository.brand
      .getBrandTimeline(
        brandId,
      )

  for (
    const brandPeriod of
      brandTimeline
  ) {
    if (
      brandPeriod.periodId <
        periodId &&
      (
        brandPeriod.revenue !== 0 ||
        brandPeriod.grossProfit !== 0 ||
        brandPeriod.quantity !== 0 ||
        brandPeriod.documents > 0
      )
    ) {
      return true
    }
  }

  return false
}

function determineLifecycleStatus(
  currentPeriod:
    BrandPeriodMetrics,
  previousPeriod:
    BrandPeriodMetrics,
  hadActivityBeforePreviousPeriod:
    boolean,
): BrandLifecycleStatus {
  const hasCurrentActivity =
    hasBrandActivity(
      currentPeriod,
    )

  const hasPreviousActivity =
    hasBrandActivity(
      previousPeriod,
    )

  if (
    hasCurrentActivity &&
    !hasPreviousActivity &&
    !hadActivityBeforePreviousPeriod
  ) {
    return 'new'
  }

  if (
    hasCurrentActivity &&
    !hasPreviousActivity &&
    hadActivityBeforePreviousPeriod
  ) {
    return 'recovered'
  }

  if (
    !hasCurrentActivity &&
    hasPreviousActivity
  ) {
    return 'lost'
  }

  if (
    !hasCurrentActivity &&
    !hasPreviousActivity
  ) {
    return 'inactive'
  }

  return 'active'
}

function determineTrendStatus(
  currentRevenue: number,
  previousRevenue: number,
  stableThreshold: number,
): BrandTrendStatus {
  if (
    currentRevenue === 0 &&
    previousRevenue === 0
  ) {
    return 'without_comparison'
  }

  if (previousRevenue === 0) {
    return 'without_comparison'
  }

  const variation =
    (
      currentRevenue -
      previousRevenue
    ) / previousRevenue

  if (
    variation >
    stableThreshold
  ) {
    return 'growing'
  }

  if (
    variation <
    -stableThreshold
  ) {
    return 'declining'
  }

  return 'stable'
}

function getAttentionReason(
  lifecycleStatus:
    BrandLifecycleStatus,
  trendStatus:
    BrandTrendStatus,
  revenueVariationPercentage:
    number | null,
  attentionDeclineThreshold:
    number,
): string | null {
  if (
    lifecycleStatus ===
    'lost'
  ) {
    return 'Marca con venta en el periodo anterior y sin actividad en el periodo actual.'
  }

  if (
    lifecycleStatus ===
    'inactive'
  ) {
    return 'Marca sin actividad en los periodos actual y anterior.'
  }

  if (
    trendStatus ===
      'declining' &&
    revenueVariationPercentage !==
      null &&
    revenueVariationPercentage <=
      attentionDeclineThreshold
  ) {
    return 'Marca con caída relevante de venta frente al periodo anterior.'
  }

  return null
}

function buildBrandItem(
  repository: BusinessRepository,
  brand: BusinessBrand,
  currentPeriodId: string,
  previousPeriodId: string,
  currentPeriodRevenue: number,
  stableThreshold: number,
  attentionDeclineThreshold: number,
  currentMetricsByBrand:
    ReadonlyMap<
      string,
      BrandPeriodMetrics
    > | null,
  previousMetricsByBrand:
    ReadonlyMap<
      string,
      BrandPeriodMetrics
    > | null,
): BrandIntelligenceItem {
  const currentPeriod =
    currentMetricsByBrand
      ? currentMetricsByBrand.get(
          brand.id,
        ) ??
        createEmptyPeriodMetrics()
      : buildPeriodMetrics(
          repository.brand.findPeriod(
            brand.id,
            currentPeriodId,
          ),
        )

  const previousPeriod =
    previousMetricsByBrand
      ? previousMetricsByBrand.get(
          brand.id,
        ) ??
        createEmptyPeriodMetrics()
      : buildPeriodMetrics(
          repository.brand.findPeriod(
            brand.id,
            previousPeriodId,
          ),
        )

  const hadActivityBeforePreviousPeriod =
    hasActivityBeforePeriod(
      repository,
      brand.id,
      previousPeriodId,
    )

  const lifecycleStatus =
    determineLifecycleStatus(
      currentPeriod,
      previousPeriod,
      hadActivityBeforePreviousPeriod,
    )

  const trendStatus =
    determineTrendStatus(
      currentPeriod.revenue,
      previousPeriod.revenue,
      stableThreshold,
    )

  const revenueVariation =
    currentPeriod.revenue -
    previousPeriod.revenue

  const revenueVariationPercentage =
    getVariationPercentage(
      currentPeriod.revenue,
      previousPeriod.revenue,
    )

  const grossProfitVariation =
    currentPeriod.grossProfit -
    previousPeriod.grossProfit

  const grossProfitVariationPercentage =
    getVariationPercentage(
      currentPeriod.grossProfit,
      previousPeriod.grossProfit,
    )

  const marginVariation =
    currentPeriod.margin !== null &&
    previousPeriod.margin !== null
      ? currentPeriod.margin -
        previousPeriod.margin
      : null

  const customerVariation =
    currentPeriod.customers -
    previousPeriod.customers

  const productVariation =
    currentPeriod.products -
    previousPeriod.products

  const revenueParticipation =
    currentPeriodRevenue === 0
      ? 0
      : currentPeriod.revenue /
        currentPeriodRevenue

  const attentionReason =
    getAttentionReason(
      lifecycleStatus,
      trendStatus,
      revenueVariationPercentage,
      attentionDeclineThreshold,
    )

  return {
    brandId:
      brand.id,

    brandName:
      brand.name,

    lifecycleStatus,

    trendStatus,

    currentPeriod,

    previousPeriod,

    revenueVariation,

    revenueVariationPercentage,

    grossProfitVariation,

    grossProfitVariationPercentage,

    marginVariation,

    customerVariation,

    productVariation,

    historicalRevenue:
      brand.revenue,

    historicalGrossProfit:
      brand.grossProfit,

    historicalQuantity:
      brand.quantity,

    historicalCustomers:
      brand.customers.size,

    historicalProducts:
      brand.products.size,

    revenueParticipation,

    requiresAttention:
      attentionReason !== null,

    attentionReason,
  }
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

function sortAttentionBrands(
  left: BrandIntelligenceItem,
  right: BrandIntelligenceItem,
): number {
  const lifecyclePriority:
    Record<
      BrandLifecycleStatus,
      number
    > = {
      lost: 5,
      inactive: 4,
      recovered: 3,
      new: 2,
      active: 1,
    }

  const priorityDifference =
    lifecyclePriority[
      right.lifecycleStatus
    ] -
    lifecyclePriority[
      left.lifecycleStatus
    ]

  if (
    priorityDifference !== 0
  ) {
    return priorityDifference
  }

  return (
    left.revenueVariation -
    right.revenueVariation
  )
}

export function buildBrandIntelligence(
  repository: BusinessRepository,
  options:
    BrandIntelligenceOptions = {},
): BrandIntelligenceSummary | null {
  const currentPeriod =
    getLatestPeriod(
      repository,
    )

  if (!currentPeriod) {
    return null
  }

  const previousPeriodId =
    getPreviousPeriodId(
      currentPeriod,
    )

  const previousPeriod =
    repository
      .getPeriods()
      .find(
        (period) =>
          period.id ===
          previousPeriodId,
      )

  const currentCutoff =
    resolvePeriodCutoff(
      repository,
      currentPeriod,
    )

  const compareEquivalentProgress =
    isOpenPeriod(
      repository,
      currentPeriod,
    )

  const comparisonCutoff =
    compareEquivalentProgress &&
    previousPeriod
      ? resolveEquivalentWorkingDayCutoff(
          currentPeriod.id,
          currentCutoff,
          previousPeriod.id,
          previousPeriod.periodEnd,
        )
      : null

  const currentMetricsByBrand =
    compareEquivalentProgress
      ? buildSegmentationPeriodMetricsByBrand(
          repository,
          currentPeriod.id,
          currentCutoff,
        )
      : null

  const previousMetricsByBrand =
    compareEquivalentProgress &&
    comparisonCutoff
      ? buildSegmentationPeriodMetricsByBrand(
          repository,
          previousPeriodId,
          comparisonCutoff,
        )
      : null

  const currentPeriodRevenue =
    compareEquivalentProgress
      ? repository.salesSegmentation
          .summarize({
            periodIds: [
              currentPeriod.id,
            ],
            dateTo:
              currentCutoff,
          })
          .revenue
      : currentPeriod.revenue

  const previousPeriodRevenue =
    compareEquivalentProgress &&
    comparisonCutoff
      ? repository.salesSegmentation
          .summarize({
            periodIds: [
              previousPeriodId,
            ],
            dateTo:
              comparisonCutoff,
          })
          .revenue
      : previousPeriod?.revenue ?? 0

  const stableThreshold =
    options
      .stableVariationThreshold ??
    DEFAULT_STABLE_THRESHOLD

  const attentionDeclineThreshold =
    options
      .attentionDeclineThreshold ??
    DEFAULT_ATTENTION_DECLINE_THRESHOLD

  const brands:
    BrandIntelligenceItem[] =
    []

  for (
    const brand of
      repository.brand.getAll()
  ) {
    brands.push(
      buildBrandItem(
        repository,
        brand,
        currentPeriod.id,
        previousPeriodId,
        currentPeriodRevenue,
        stableThreshold,
        attentionDeclineThreshold,
        currentMetricsByBrand,
        previousMetricsByBrand,
      ),
    )
  }

  const attentionBrands =
    brands
      .filter(
        (brand) =>
          brand.requiresAttention,
      )
      .sort(
        sortAttentionBrands,
      )

  const topGrowingBrands =
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
      )

  const topDecliningBrands =
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
      )

  const topRevenueBrands =
    [...brands]
      .sort(
        sortByRevenueDescending,
      )
      .slice(
        0,
        10,
      )

  const revenueVariation =
    currentPeriodRevenue -
    previousPeriodRevenue

  const revenueVariationPercentage =
    getVariationPercentage(
      currentPeriodRevenue,
      previousPeriodRevenue,
    )

  return {
    analysisDate:
      compareEquivalentProgress
        ? currentCutoff
        : currentPeriod.periodEnd,

    currentPeriodId:
      currentPeriod.id,

    currentPeriodStart:
      currentPeriod.periodStart,

    currentPeriodEnd:
      compareEquivalentProgress
        ? currentCutoff
        : currentPeriod.periodEnd,

    previousPeriodId,

    previousPeriodStart:
      previousPeriod
        ?.periodStart ??
      `${previousPeriodId}-01`,

    previousPeriodEnd:
      compareEquivalentProgress &&
      comparisonCutoff
        ? comparisonCutoff
        : previousPeriod
            ?.periodEnd ??
          `${previousPeriodId}-01`,

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

    revenueVariationPercentage,

    brands,

    attentionBrands,

    topGrowingBrands,

    topDecliningBrands,

    topRevenueBrands,
  }
}