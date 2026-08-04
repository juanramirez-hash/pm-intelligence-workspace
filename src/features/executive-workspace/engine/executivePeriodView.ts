import type {
  BrandIntelligenceItem,
  BrandIntelligenceSummary,
  BrandLifecycleStatus,
  BrandPeriodMetrics,
  BrandTrendStatus,
} from '../../../core/analytics/brands'

import type {
  BusinessBrand,
} from '../../../core/business/entities/brand'

import type {
  BusinessBrandPeriod,
} from '../../../core/business/entities/brandPeriod'

import type {
  BusinessProduct,
} from '../../../core/business/entities/product'

import type {
  BusinessProductPeriod,
} from '../../../core/business/entities/productPeriod'

import type {
  BusinessRepository,
  RevenuePeriodSummary,
} from '../../../core/business/repository'

import {
  buildExecutiveCustomerAttentionSummary,
} from './executiveCustomerLifecycle'

import type {
  ExecutiveAttentionSummary,
  ExecutiveCommercialTrends,
  ExecutiveComparisonMetric,
  ExecutiveCustomerConcentrationItem,
  ExecutiveEntityAttentionSummary,
  ExecutivePeriodOption,
  ExecutivePeriodPreset,
  ExecutivePeriodSelection,
  ExecutivePeriodView,
  ExecutiveRevenueTrendPoint,
  ExecutiveSalesPeriodPerformance,
} from '../types/executiveWorkspaceTypes'

const STABLE_VARIATION_THRESHOLD = 0.05
const BRAND_ATTENTION_DECLINE_THRESHOLD = -0.15
const DEFAULT_CUSTOMER_LIMIT = 10
const DEFAULT_TREND_MONTH_LIMIT = 12

const MONTH_FORMATTER =
  new Intl.DateTimeFormat(
    'es-MX',
    {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  )

const PRESET_LABELS:
  Record<ExecutivePeriodPreset, string> = {
    month: 'Mes',
    last_3_months: 'Últimos 3 meses',
    last_6_months: 'Últimos 6 meses',
    year_to_date: 'Año actual',
  }

interface PeriodActivity {
  periodId: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

interface AggregatedActivity {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

interface AggregatedBrandActivity
  extends AggregatedActivity {
  customers: Set<string>
  products: Set<string>
}

interface EntityClassification {
  current:
    AggregatedActivity

  comparison:
    AggregatedActivity

  currentActive: boolean

  comparisonActive: boolean

  lifecycle:
    'active' |
    'new' |
    'recovered' |
    'lost'

  trend:
    'growing' |
    'declining' |
    'stable' |
    'without_comparison'

  variation: number

  variationPercentage:
    number | null

  requiresAttention: boolean
}

export interface BuildExecutivePeriodViewOptions {
  anchorPeriodId?:
    string | null

  preset?:
    ExecutivePeriodPreset

  customerLimit?: number

  trendMonthLimit?: number
}

function formatPeriod(
  year: number,
  month: number,
): string {
  const label =
    MONTH_FORMATTER.format(
      new Date(
        Date.UTC(
          year,
          month - 1,
          1,
        ),
      ),
    )

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  )
}

function parsePeriodId(
  periodId: string,
): {
  year: number
  month: number
} | null {
  const [year, month] =
    periodId.split('-').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  return {
    year,
    month,
  }
}

function toPeriodOption(
  period: RevenuePeriodSummary,
): ExecutivePeriodOption {
  return {
    id: period.id,
    year: period.year,
    month: period.month,
    label: formatPeriod(
      period.year,
      period.month,
    ),
  }
}

function formatPeriodRange(
  periodIds: readonly string[],
  periodsById:
    ReadonlyMap<string, ExecutivePeriodOption>,
  fallback: string,
): string {
  const first =
    periodIds.length > 0
      ? periodsById.get(periodIds[0])
      : undefined

  const last =
    periodIds.length > 0
      ? periodsById.get(
          periodIds[periodIds.length - 1],
        )
      : undefined

  if (!first || !last) {
    return fallback
  }

  if (first.id === last.id) {
    return first.label
  }

  return `${first.label} – ${last.label}`
}

function getPreviousYearPeriodId(
  periodId: string,
): string | null {
  const parsed =
    parsePeriodId(periodId)

  if (!parsed) {
    return null
  }

  return `${parsed.year - 1}-${String(parsed.month).padStart(2, '0')}`
}

function buildEmptySelection(
  preset: ExecutivePeriodPreset,
): ExecutivePeriodSelection {
  return {
    preset,
    presetLabel: PRESET_LABELS[preset],
    anchorPeriodId: null,
    availablePeriods: [],
    currentPeriodIds: [],
    comparisonPeriodIds: [],
    priorYearPeriodIds: [],
    currentLabel: 'Sin periodo disponible',
    comparisonLabel: 'Sin comparación disponible',
    priorYearLabel: 'Sin comparación anual disponible',
    currentStartPeriodId: null,
    currentEndPeriodId: null,
    comparisonStartPeriodId: null,
    comparisonEndPeriodId: null,
    previousAnchorPeriodId: null,
    nextAnchorPeriodId: null,
  }
}

export function buildExecutivePeriodSelection(
  repository: BusinessRepository | null,
  options: BuildExecutivePeriodViewOptions = {},
): ExecutivePeriodSelection {
  const preset =
    options.preset ?? 'month'

  if (!repository) {
    return buildEmptySelection(preset)
  }

  const availablePeriods =
    repository.revenue
      .getMonthly()
      .map(toPeriodOption)

  if (availablePeriods.length === 0) {
    return buildEmptySelection(preset)
  }

  const availableIds =
    new Set(
      availablePeriods.map(
        (period) => period.id,
      ),
    )

  const requestedAnchor =
    options.anchorPeriodId?.trim() ?? ''

  const anchorPeriodId =
    availableIds.has(requestedAnchor)
      ? requestedAnchor
      : availablePeriods[
          availablePeriods.length - 1
        ].id

  const anchorIndex =
    availablePeriods.findIndex(
      (period) =>
        period.id === anchorPeriodId,
    )

  const anchor =
    availablePeriods[anchorIndex]

  let currentPeriods:
    ExecutivePeriodOption[] = []

  let comparisonPeriods:
    ExecutivePeriodOption[] = []

  if (preset === 'month') {
    currentPeriods = [anchor]

    comparisonPeriods =
      anchorIndex > 0
        ? [
            availablePeriods[
              anchorIndex - 1
            ],
          ]
        : []
  } else if (
    preset === 'last_3_months' ||
    preset === 'last_6_months'
  ) {
    const requestedLength =
      preset === 'last_3_months'
        ? 3
        : 6

    const currentStartIndex =
      Math.max(
        anchorIndex -
          requestedLength +
          1,
        0,
      )

    currentPeriods =
      availablePeriods.slice(
        currentStartIndex,
        anchorIndex + 1,
      )

    comparisonPeriods =
      availablePeriods.slice(
        Math.max(
          currentStartIndex -
            currentPeriods.length,
          0,
        ),
        currentStartIndex,
      )
  } else {
    currentPeriods =
      availablePeriods.filter(
        (period) =>
          period.year === anchor.year &&
          period.month <= anchor.month,
      )

    comparisonPeriods =
      currentPeriods
        .map(
          (period) =>
            availablePeriods.find(
              (candidate) =>
                candidate.year ===
                  period.year - 1 &&
                candidate.month ===
                  period.month,
            ),
        )
        .filter(
          (
            period,
          ): period is ExecutivePeriodOption =>
            period !== undefined,
        )
  }

  const currentPeriodIds =
    currentPeriods.map(
      (period) => period.id,
    )

  const comparisonPeriodIds =
    comparisonPeriods.map(
      (period) => period.id,
    )

  const priorYearPeriodIds =
    currentPeriodIds
      .map(getPreviousYearPeriodId)
      .filter(
        (
          periodId,
        ): periodId is string =>
          periodId !== null &&
          availableIds.has(periodId),
      )

  const periodsById =
    new Map(
      availablePeriods.map(
        (period) => [
          period.id,
          period,
        ],
      ),
    )

  return {
    preset,
    presetLabel: PRESET_LABELS[preset],
    anchorPeriodId,
    availablePeriods,
    currentPeriodIds,
    comparisonPeriodIds,
    priorYearPeriodIds,
    currentLabel:
      formatPeriodRange(
        currentPeriodIds,
        periodsById,
        'Sin periodo disponible',
      ),
    comparisonLabel:
      formatPeriodRange(
        comparisonPeriodIds,
        periodsById,
        'Sin comparación disponible',
      ),
    priorYearLabel:
      formatPeriodRange(
        priorYearPeriodIds,
        periodsById,
        'Sin comparación anual disponible',
      ),
    currentStartPeriodId:
      currentPeriodIds[0] ?? null,
    currentEndPeriodId:
      currentPeriodIds.at(-1) ?? null,
    comparisonStartPeriodId:
      comparisonPeriodIds[0] ?? null,
    comparisonEndPeriodId:
      comparisonPeriodIds.at(-1) ?? null,
    previousAnchorPeriodId:
      availablePeriods[
        anchorIndex - 1
      ]?.id ?? null,
    nextAnchorPeriodId:
      availablePeriods[
        anchorIndex + 1
      ]?.id ?? null,
  }
}

function createEmptyActivity():
AggregatedActivity {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
  }
}

function aggregateActivity(
  timeline: readonly PeriodActivity[],
  periodIds: ReadonlySet<string>,
): AggregatedActivity {
  return timeline.reduce<AggregatedActivity>(
    (total, period) => {
      if (!periodIds.has(period.periodId)) {
        return total
      }

      total.revenue += period.revenue
      total.grossProfit += period.grossProfit
      total.quantity += period.quantity
      total.documents += period.documents

      return total
    },
    createEmptyActivity(),
  )
}

function calculateVariationPercentage(
  currentValue: number,
  comparisonValue: number,
): number | null {
  if (comparisonValue === 0) {
    return null
  }

  return (
    currentValue - comparisonValue
  ) / Math.abs(comparisonValue)
}

function classifyEntity(
  timeline: readonly PeriodActivity[],
  selection: ExecutivePeriodSelection,
  attentionDeclineThreshold: number,
): EntityClassification | null {
  const currentIds =
    new Set(selection.currentPeriodIds)

  const comparisonIds =
    new Set(selection.comparisonPeriodIds)

  const current =
    aggregateActivity(
      timeline,
      currentIds,
    )

  const comparison =
    aggregateActivity(
      timeline,
      comparisonIds,
    )

  const currentActive =
    current.revenue > 0

  const comparisonActive =
    comparison.revenue > 0

  if (!currentActive && !comparisonActive) {
    return null
  }

  const variation =
    current.revenue -
    comparison.revenue

  const variationPercentage =
    calculateVariationPercentage(
      current.revenue,
      comparison.revenue,
    )

  let lifecycle:
    EntityClassification['lifecycle']

  if (currentActive && comparisonActive) {
    lifecycle = 'active'
  } else if (currentActive) {
    const firstActivePeriodId =
      [...timeline]
        .filter(
          (period) => period.revenue > 0,
        )
        .sort(
          (left, right) =>
            left.periodId.localeCompare(
              right.periodId,
            ),
        )[0]?.periodId ?? null

    lifecycle =
      firstActivePeriodId &&
      currentIds.has(firstActivePeriodId)
        ? 'new'
        : 'recovered'
  } else {
    lifecycle = 'lost'
  }

  let trend:
    EntityClassification['trend']

  if (!currentActive || !comparisonActive) {
    trend = 'without_comparison'
  } else if (
    (variationPercentage ?? 0) >
    STABLE_VARIATION_THRESHOLD
  ) {
    trend = 'growing'
  } else if (
    (variationPercentage ?? 0) <
    -STABLE_VARIATION_THRESHOLD
  ) {
    trend = 'declining'
  } else {
    trend = 'stable'
  }

  const requiresAttention =
    lifecycle === 'lost' ||
    (
      trend === 'declining' &&
      variationPercentage !== null &&
      variationPercentage <=
        attentionDeclineThreshold
    )

  return {
    current,
    comparison,
    currentActive,
    comparisonActive,
    lifecycle,
    trend,
    variation,
    variationPercentage,
    requiresAttention,
  }
}

function createEmptyAttentionIds() {
  return {
    analyzed: [] as string[],
    active: [] as string[],
    requiringAttention: [] as string[],
    growing: [] as string[],
    declining: [] as string[],
    stable: [] as string[],
    recovered: [] as string[],
    new: [] as string[],
    inactiveOrLost: [] as string[],
  }
}

function buildAttentionSummary<
  TEntity,
  TPeriod extends PeriodActivity,
>(
  entities: readonly TEntity[],
  entityIdFor:
    (entity: TEntity) => string,
  timelineFor:
    (entity: TEntity) => readonly TPeriod[],
  selection: ExecutivePeriodSelection,
  attentionDeclineThreshold =
    -STABLE_VARIATION_THRESHOLD,
): ExecutiveEntityAttentionSummary {
  const entityIds =
    createEmptyAttentionIds()

  const result:
    ExecutiveEntityAttentionSummary = {
    totalAnalyzed: 0,
    activeEntities: 0,
    entitiesRequiringAttention: 0,
    growingEntities: 0,
    decliningEntities: 0,
    stableEntities: 0,
    recoveredEntities: 0,
    newEntities: 0,
    inactiveOrLostEntities: 0,
    entityIds,
  }

  for (const entity of entities) {
    const classification =
      classifyEntity(
        timelineFor(entity),
        selection,
        attentionDeclineThreshold,
      )

    if (!classification) {
      continue
    }

    const entityId = entityIdFor(entity)

    result.totalAnalyzed += 1
    entityIds.analyzed.push(entityId)

    if (classification.currentActive) {
      result.activeEntities += 1
      entityIds.active.push(entityId)
    }

    if (classification.requiresAttention) {
      result.entitiesRequiringAttention += 1
      entityIds.requiringAttention.push(
        entityId,
      )
    }

    if (classification.trend === 'growing') {
      result.growingEntities += 1
      entityIds.growing.push(entityId)
    } else if (
      classification.trend === 'declining'
    ) {
      result.decliningEntities += 1
      entityIds.declining.push(entityId)
    } else if (
      classification.trend === 'stable'
    ) {
      result.stableEntities += 1
      entityIds.stable.push(entityId)
    }

    if (classification.lifecycle === 'new') {
      result.newEntities += 1
      entityIds.new.push(entityId)
    } else if (
      classification.lifecycle === 'recovered'
    ) {
      result.recoveredEntities += 1
      entityIds.recovered.push(entityId)
    } else if (
      classification.lifecycle === 'lost'
    ) {
      result.inactiveOrLostEntities += 1
      entityIds.inactiveOrLost.push(
        entityId,
      )
    }
  }

  return result
}

function buildExecutiveAttention(
  repository: BusinessRepository | null,
  selection: ExecutivePeriodSelection,
): ExecutiveAttentionSummary {
  if (!repository) {
    const empty =
      buildAttentionSummary(
        [],
        () => '',
        () => [],
        selection,
      )

    return {
      products: empty,
      brands: { ...empty },
      customers: { ...empty },
    }
  }

  return {
    products:
      buildAttentionSummary<
        BusinessProduct,
        BusinessProductPeriod
      >(
        repository.product.getAll(),
        (product) => product.id,
        (product) =>
          repository.product.findTimeline(
            product.id,
          ),
        selection,
      ),
    brands:
      buildAttentionSummary<
        BusinessBrand,
        BusinessBrandPeriod
      >(
        repository.brand.getAll(),
        (brand) => brand.id,
        (brand) =>
          repository.brand.findPeriodsByBrandId(
            brand.id,
          ),
        selection,
        BRAND_ATTENTION_DECLINE_THRESHOLD,
      ),
    customers:
      buildExecutiveCustomerAttentionSummary(
        repository,
        selection,
      ),
  }
}

function sumRevenuePeriods(
  repository: BusinessRepository,
  periodIds: readonly string[],
): AggregatedActivity | null {
  const periods =
    periodIds
      .map(
        (periodId) =>
          repository.revenue.findById(
            periodId,
          ),
      )
      .filter(
        (
          period,
        ): period is RevenuePeriodSummary =>
          period !== undefined,
      )

  if (periods.length === 0) {
    return null
  }

  return periods.reduce<AggregatedActivity>(
    (total, period) => {
      total.revenue += period.revenue
      total.grossProfit +=
        period.grossProfit
      total.quantity += period.quantity
      total.documents += period.documents

      return total
    },
    createEmptyActivity(),
  )
}

function createComparisonMetric(
  current: AggregatedActivity | null,
  comparison: AggregatedActivity | null,
): ExecutiveComparisonMetric {
  return {
    currentValue:
      current?.revenue ?? null,
    comparisonValue:
      comparison?.revenue ?? null,
    variationPercentage:
      current && comparison
        ? calculateVariationPercentage(
            current.revenue,
            comparison.revenue,
          ) === null
          ? null
          : (
              calculateVariationPercentage(
                current.revenue,
                comparison.revenue,
              ) ?? 0
            ) * 100
        : null,
  }
}

function buildSalesPerformance(
  repository: BusinessRepository | null,
  selection: ExecutivePeriodSelection,
): ExecutiveSalesPeriodPerformance {
  if (!repository) {
    return {
      hasData: false,
      currentRevenue: null,
      currentGrossProfit: null,
      grossMargin: null,
      averageMonthlyRevenue: null,
      periodCount: 0,
      currentLabel: selection.currentLabel,
      comparisonLabel:
        selection.comparisonLabel,
      priorYearLabel:
        selection.priorYearLabel,
      comparison:
        createComparisonMetric(
          null,
          null,
        ),
      priorYearComparison:
        createComparisonMetric(
          null,
          null,
        ),
    }
  }

  const current =
    sumRevenuePeriods(
      repository,
      selection.currentPeriodIds,
    )

  const comparison =
    sumRevenuePeriods(
      repository,
      selection.comparisonPeriodIds,
    )

  const priorYear =
    sumRevenuePeriods(
      repository,
      selection.priorYearPeriodIds,
    )

  const periodCount =
    selection.currentPeriodIds.length

  return {
    hasData: current !== null,
    currentRevenue:
      current?.revenue ?? null,
    currentGrossProfit:
      current?.grossProfit ?? null,
    grossMargin:
      current && current.revenue !== 0
        ? (
            current.grossProfit /
            current.revenue
          ) * 100
        : null,
    averageMonthlyRevenue:
      current && periodCount > 0
        ? current.revenue /
          periodCount
        : null,
    periodCount,
    currentLabel:
      selection.currentLabel,
    comparisonLabel:
      selection.comparisonLabel,
    priorYearLabel:
      selection.priorYearLabel,
    comparison:
      createComparisonMetric(
        current,
        comparison,
      ),
    priorYearComparison:
      createComparisonMetric(
        current,
        priorYear,
      ),
  }
}

function aggregateBrandActivity(
  timeline: readonly BusinessBrandPeriod[],
  periodIds: ReadonlySet<string>,
): AggregatedBrandActivity {
  return timeline.reduce<AggregatedBrandActivity>(
    (total, period) => {
      if (!periodIds.has(period.periodId)) {
        return total
      }

      total.revenue += period.revenue
      total.grossProfit += period.grossProfit
      total.quantity += period.quantity
      total.documents += period.documents

      for (const customerId of period.customers) {
        total.customers.add(customerId)
      }

      for (const productId of period.products) {
        total.products.add(productId)
      }

      return total
    },
    {
      ...createEmptyActivity(),
      customers: new Set<string>(),
      products: new Set<string>(),
    },
  )
}

function mapBrandPeriodMetrics(
  activity: AggregatedBrandActivity,
): BrandPeriodMetrics {
  return {
    revenue: activity.revenue,
    grossProfit: activity.grossProfit,
    quantity: activity.quantity,
    documents: activity.documents,
    customers: activity.customers.size,
    products: activity.products.size,
    margin:
      activity.revenue !== 0
        ? activity.grossProfit /
          activity.revenue
        : null,
  }
}

function getPeriodBoundary(
  repository: BusinessRepository,
  periodId: string | null,
  boundary: 'start' | 'end',
): string {
  if (!periodId) {
    return ''
  }

  const period =
    repository.revenue.findById(periodId)

  if (!period) {
    return `${periodId}-01`
  }

  return boundary === 'start'
    ? period.periodStart
    : period.periodEnd
}

function buildBrandSummary(
  repository: BusinessRepository | null,
  selection: ExecutivePeriodSelection,
): BrandIntelligenceSummary | null {
  if (
    !repository ||
    selection.currentPeriodIds.length === 0
  ) {
    return null
  }

  const currentIds =
    new Set(selection.currentPeriodIds)

  const comparisonIds =
    new Set(selection.comparisonPeriodIds)

  const currentPeriodRevenue =
    sumRevenuePeriods(
      repository,
      selection.currentPeriodIds,
    )?.revenue ?? 0

  const previousPeriodRevenue =
    sumRevenuePeriods(
      repository,
      selection.comparisonPeriodIds,
    )?.revenue ?? 0

  const brands:
    BrandIntelligenceItem[] = []

  for (const brand of repository.brand.getAll()) {
    const timeline =
      repository.brand.findPeriodsByBrandId(
        brand.id,
      )

    const classification =
      classifyEntity(
        timeline,
        selection,
        BRAND_ATTENTION_DECLINE_THRESHOLD,
      )

    if (!classification) {
      continue
    }

    const current =
      aggregateBrandActivity(
        timeline,
        currentIds,
      )

    const previous =
      aggregateBrandActivity(
        timeline,
        comparisonIds,
      )

    const currentPeriod =
      mapBrandPeriodMetrics(current)

    const previousPeriod =
      mapBrandPeriodMetrics(previous)

    const lifecycleStatus:
      BrandLifecycleStatus =
      classification.lifecycle

    const trendStatus:
      BrandTrendStatus =
      classification.trend

    const grossProfitVariation =
      current.grossProfit -
      previous.grossProfit

    const grossProfitVariationPercentage =
      calculateVariationPercentage(
        current.grossProfit,
        previous.grossProfit,
      )

    const marginVariation =
      currentPeriod.margin !== null &&
      previousPeriod.margin !== null
        ? currentPeriod.margin -
          previousPeriod.margin
        : null

    let attentionReason:
      string | null = null

    if (lifecycleStatus === 'lost') {
      attentionReason =
        'Marca con actividad en el periodo comparable y sin venta en el periodo seleccionado.'
    } else if (
      trendStatus === 'declining' &&
      classification
        .variationPercentage !== null &&
      classification
        .variationPercentage <=
          BRAND_ATTENTION_DECLINE_THRESHOLD
    ) {
      attentionReason =
        'Marca con caída relevante frente al periodo comparable.'
    }

    brands.push({
      brandId: brand.id,
      brandName: brand.name,
      lifecycleStatus,
      trendStatus,
      currentPeriod,
      previousPeriod,
      revenueVariation:
        classification.variation,
      revenueVariationPercentage:
        classification
          .variationPercentage,
      grossProfitVariation,
      grossProfitVariationPercentage,
      marginVariation,
      customerVariation:
        current.customers.size -
        previous.customers.size,
      productVariation:
        current.products.size -
        previous.products.size,
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
      revenueParticipation:
        currentPeriodRevenue !== 0
          ? current.revenue /
            currentPeriodRevenue
          : 0,
      requiresAttention:
        attentionReason !== null,
      attentionReason,
    })
  }

  const sortByRevenue =
    (
      left: BrandIntelligenceItem,
      right: BrandIntelligenceItem,
    ) =>
      right.currentPeriod.revenue -
      left.currentPeriod.revenue

  const sortByVariationDescending =
    (
      left: BrandIntelligenceItem,
      right: BrandIntelligenceItem,
    ) =>
      right.revenueVariation -
      left.revenueVariation

  const sortByVariationAscending =
    (
      left: BrandIntelligenceItem,
      right: BrandIntelligenceItem,
    ) =>
      left.revenueVariation -
      right.revenueVariation

  const attentionBrands =
    brands
      .filter(
        (brand) =>
          brand.requiresAttention,
      )
      .sort(sortByVariationAscending)

  const currentStart =
    selection.currentStartPeriodId

  const currentEnd =
    selection.currentEndPeriodId

  const comparisonStart =
    selection.comparisonStartPeriodId

  const comparisonEnd =
    selection.comparisonEndPeriodId

  const revenueVariation =
    currentPeriodRevenue -
    previousPeriodRevenue

  return {
    analysisDate:
      getPeriodBoundary(
        repository,
        currentEnd,
        'end',
      ),
    currentPeriodId:
      currentEnd ?? '',
    currentPeriodStart:
      getPeriodBoundary(
        repository,
        currentStart,
        'start',
      ),
    currentPeriodEnd:
      getPeriodBoundary(
        repository,
        currentEnd,
        'end',
      ),
    previousPeriodId:
      comparisonEnd ?? '',
    previousPeriodStart:
      getPeriodBoundary(
        repository,
        comparisonStart,
        'start',
      ),
    previousPeriodEnd:
      getPeriodBoundary(
        repository,
        comparisonEnd,
        'end',
      ),
    totalBrands: brands.length,
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
    inactiveBrands: 0,
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
      calculateVariationPercentage(
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
        .sort(sortByVariationDescending)
        .slice(0, 10),
    topDecliningBrands:
      brands
        .filter(
          (brand) =>
            brand.trendStatus ===
            'declining',
        )
        .sort(sortByVariationAscending)
        .slice(0, 10),
    topRevenueBrands:
      [...brands]
        .sort(sortByRevenue)
        .slice(0, 10),
  }
}

function calculateGrossMargin(
  revenue: number,
  grossProfit: number,
): number {
  return revenue !== 0
    ? (
        grossProfit /
        revenue
      ) * 100
    : 0
}

function normalizeLimit(
  value: number | undefined,
  fallback: number,
): number {
  if (
    value === undefined ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return fallback
  }

  return Math.floor(value)
}

function buildCommercialTrends(
  repository: BusinessRepository | null,
  selection: ExecutivePeriodSelection,
  options: BuildExecutivePeriodViewOptions,
): ExecutiveCommercialTrends {
  if (!repository) {
    return {
      monthlyRevenue: [],
      topCustomers: [],
      totalCustomerRevenue: 0,
      periodCount: 0,
    }
  }

  const trendMonthLimit =
    normalizeLimit(
      options.trendMonthLimit,
      DEFAULT_TREND_MONTH_LIMIT,
    )

  const customerLimit =
    normalizeLimit(
      options.customerLimit,
      DEFAULT_CUSTOMER_LIMIT,
    )

  const anchorIndex =
    selection.availablePeriods.findIndex(
      (period) =>
        period.id ===
        selection.anchorPeriodId,
    )

  const trendPeriods =
    anchorIndex >= 0
      ? selection.availablePeriods.slice(
          Math.max(
            anchorIndex -
              trendMonthLimit +
              1,
            0,
          ),
          anchorIndex + 1,
        )
      : []

  const monthlyRevenue:
    ExecutiveRevenueTrendPoint[] =
    trendPeriods
      .map(
        (period) =>
          repository.revenue.findById(
            period.id,
          ),
      )
      .filter(
        (
          period,
        ): period is RevenuePeriodSummary =>
          period !== undefined,
      )
      .map(
        (period) => ({
          periodId: period.id,
          year: period.year,
          month: period.month,
          revenue: period.revenue,
          grossProfit:
            period.grossProfit,
          grossMargin:
            calculateGrossMargin(
              period.revenue,
              period.grossProfit,
            ),
          customerCount:
            period.customerCount,
          brandCount:
            period.brandCount,
          productCount:
            period.productCount,
        }),
      )

  const currentIds =
    new Set(selection.currentPeriodIds)

  const customers =
    repository.customer
      .getAll()
      .map(
        (customer) => {
          const activity =
            aggregateActivity(
              repository.customer
                .getCustomerTimeline(
                  customer.id,
                ),
              currentIds,
            )

          return {
            customer,
            activity,
          }
        },
      )
      .filter(
        (record) =>
          record.activity.revenue > 0,
      )

  const totalCustomerRevenue =
    customers.reduce(
      (total, record) =>
        total +
        record.activity.revenue,
      0,
    )

  const topCustomers:
    ExecutiveCustomerConcentrationItem[] =
    customers
      .sort(
        (left, right) =>
          right.activity.revenue -
          left.activity.revenue ||
          left.customer.id.localeCompare(
            right.customer.id,
          ),
      )
      .slice(0, customerLimit)
      .map(
        ({ customer, activity }) => ({
          customerId: customer.id,
          customerName:
            customer.name || customer.id,
          revenue: activity.revenue,
          grossProfit:
            activity.grossProfit,
          grossMargin:
            calculateGrossMargin(
              activity.revenue,
              activity.grossProfit,
            ),
          documents:
            activity.documents,
          activePeriods:
            repository.customer
              .getCustomerTimeline(
                customer.id,
              )
              .filter(
                (period) =>
                  currentIds.has(
                    period.periodId,
                  ) &&
                  period.revenue > 0,
              ).length,
          revenueShare:
            totalCustomerRevenue > 0
              ? activity.revenue /
                totalCustomerRevenue
              : 0,
        }),
      )

  return {
    monthlyRevenue,
    topCustomers,
    totalCustomerRevenue,
    periodCount:
      monthlyRevenue.length,
  }
}

export function buildExecutivePeriodView(
  repository: BusinessRepository | null,
  options: BuildExecutivePeriodViewOptions = {},
): ExecutivePeriodView {
  const selection =
    buildExecutivePeriodSelection(
      repository,
      options,
    )

  return {
    selection,
    salesPerformance:
      buildSalesPerformance(
        repository,
        selection,
      ),
    attention:
      buildExecutiveAttention(
        repository,
        selection,
      ),
    brands:
      buildBrandSummary(
        repository,
        selection,
      ),
    commercialTrends:
      buildCommercialTrends(
        repository,
        selection,
        options,
      ),
  }
}
