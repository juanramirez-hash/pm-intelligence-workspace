import type {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  ForecastBaselineProjection,
  ForecastConfidenceLevel,
  ForecastCoverageStatus,
  ForecastInventoryPriority,
  ForecastInventorySignal,
  ForecastMetricValues,
  ForecastProductInventoryInsight,
  ForecastScenarioId,
  ForecastScenarioProjection,
  ForecastTargetStatus,
} from '../../../core/business/forecast'

import {
  DEFAULT_FORECAST_WORKSPACE_FILTERS,
  DEFAULT_FORECAST_WORKSPACE_REQUEST,
} from '../types/forecastWorkspaceTypes'

import type {
  ForecastWorkspaceBrandRow,
  ForecastWorkspaceCoverageBreakdown,
  ForecastWorkspaceFilters,
  ForecastWorkspaceInventorySummary,
  ForecastWorkspaceModel,
  ForecastWorkspacePortfolioSummary,
  ForecastWorkspacePriorityItem,
  ForecastWorkspaceRequest,
  ForecastWorkspaceScenarioOption,
  ForecastWorkspaceStatus,
} from '../types/forecastWorkspaceTypes'

const EMPTY_VALUES: ForecastMetricValues = {
  revenue: 0,
  grossProfit: 0,
  quantity: 0,
}

const COVERAGE_STATUSES: ForecastCoverageStatus[] = [
  'unavailable',
  'no-demand',
  'stockout',
  'shortage',
  'low',
  'balanced',
  'excess',
]

const PRIORITIES: ForecastInventoryPriority[] = [
  'critical',
  'high',
  'medium',
  'low',
  'none',
]

const CONFIDENCE_LEVELS: ForecastConfidenceLevel[] = [
  'high',
  'medium',
  'low',
]

function roundValue(
  value: number,
  decimals = 2,
): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function normalizeIdentifier(
  value: string,
): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function normalizeLimit(
  value: number,
): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.floor(value)
}

function normalizeRequest(
  request: Partial<ForecastWorkspaceRequest> | undefined,
): ForecastWorkspaceRequest {
  return {
    scenarioId:
      request?.scenarioId ??
      DEFAULT_FORECAST_WORKSPACE_REQUEST.scenarioId,
    filters: {
      ...DEFAULT_FORECAST_WORKSPACE_FILTERS,
      ...request?.filters,
    },
    rankingLimit:
      request?.rankingLimit ??
      DEFAULT_FORECAST_WORKSPACE_REQUEST.rankingLimit,
  }
}

function scenarioById(
  projection: ForecastBaselineProjection | undefined,
  scenarioId: ForecastScenarioId,
): ForecastScenarioProjection | undefined {
  return projection?.scenarios.find(
    (scenario) => scenario.id === scenarioId,
  )
}

function scenarioValues(
  projection: ForecastBaselineProjection | undefined,
  scenarioId: ForecastScenarioId,
): ForecastMetricValues {
  const scenario = scenarioById(projection, scenarioId)

  if (scenario) {
    return { ...scenario.values }
  }

  if (projection) {
    return { ...projection.expected }
  }

  return { ...EMPTY_VALUES }
}

function scenarioGrossMargin(
  projection: ForecastBaselineProjection | undefined,
  scenarioId: ForecastScenarioId,
): number | null {
  return scenarioById(projection, scenarioId)?.grossMargin ??
    projection?.expectedGrossMargin ??
    null
}

function scenarioTargetAttainment(
  projection: ForecastBaselineProjection | undefined,
  scenarioId: ForecastScenarioId,
): number | null {
  return scenarioById(projection, scenarioId)?.targetAttainment ??
    projection?.target.expectedAttainment ??
    null
}

function resolveTargetStatus(
  actualRevenue: number,
  targetRevenue: number | null,
  targetAttainment: number | null,
): ForecastTargetStatus {
  if (targetRevenue === null || targetAttainment === null) {
    return 'unavailable'
  }

  if (actualRevenue >= targetRevenue) {
    return 'achieved'
  }

  if (targetAttainment >= 1.05) {
    return 'ahead'
  }

  if (targetAttainment >= 0.98) {
    return 'on-track'
  }

  return 'behind'
}

function buildPortfolioSummary(
  projection: ForecastBaselineProjection | undefined,
  scenarioId: ForecastScenarioId,
): ForecastWorkspacePortfolioSummary {
  if (!projection) {
    return {
      available: false,
      actual: { ...EMPTY_VALUES },
      projected: { ...EMPTY_VALUES },
      projectedGrossMargin: null,
      targetRevenue: null,
      targetAttainment: null,
      revenueGap: null,
      requiredDailyRevenue: null,
      targetStatus: 'unavailable',
      confidenceScore: null,
      confidenceLevel: null,
      explainability: [],
      limitations: [
        'No existe una proyección consolidada de portafolio.',
      ],
    }
  }

  const projected = scenarioValues(projection, scenarioId)
  const targetAttainment = scenarioTargetAttainment(
    projection,
    scenarioId,
  )

  return {
    available: true,
    actual: { ...projection.actual },
    projected,
    projectedGrossMargin: scenarioGrossMargin(
      projection,
      scenarioId,
    ),
    targetRevenue: projection.target.revenue,
    targetAttainment,
    revenueGap: projection.target.revenue === null
      ? null
      : roundValue(
          Math.max(
            0,
            projection.target.revenue - projected.revenue,
          ),
        ),
    requiredDailyRevenue: projection.target.requiredDailyRevenue,
    targetStatus: resolveTargetStatus(
      projection.actual.revenue,
      projection.target.revenue,
      targetAttainment,
    ),
    confidenceScore: projection.confidence.score,
    confidenceLevel: projection.confidence.level,
    explainability: [...projection.explainability],
    limitations: [...projection.confidence.limitations],
  }
}

function buildScenarioOptions(
  foundationScenarios: ReturnType<
    BusinessRepository['forecast']['getFoundation']
  >['scenarios'],
  portfolioProjection: ForecastBaselineProjection | undefined,
  selectedId: ForecastScenarioId,
): ForecastWorkspaceScenarioOption[] {
  return foundationScenarios.map((definition) => {
    const scenario = scenarioById(
      portfolioProjection,
      definition.id,
    )

    return {
      id: definition.id,
      label: definition.label,
      purpose: definition.purpose,
      selected: definition.id === selectedId,
      portfolioRevenue: scenario?.values.revenue ?? null,
      portfolioGrossProfit: scenario?.values.grossProfit ?? null,
      portfolioQuantity: scenario?.values.quantity ?? null,
      portfolioGrossMargin: scenario?.grossMargin ?? null,
      targetAttainment: scenario?.targetAttainment ?? null,
    }
  })
}

function selectedDemand(
  item: ForecastProductInventoryInsight,
  scenarioId: ForecastScenarioId,
): number | null {
  if (scenarioId === 'conservative') {
    return item.demand.conservativeQuantity
  }

  if (scenarioId === 'accelerated') {
    return item.demand.acceleratedQuantity
  }

  return item.demand.expectedQuantity
}

function selectedRemainingDemand(
  item: ForecastProductInventoryInsight,
  scenarioId: ForecastScenarioId,
): number | null {
  const demand = selectedDemand(item, scenarioId)

  if (demand === null) {
    return null
  }

  return roundValue(
    Math.max(0, demand - item.demand.actualQuantity),
  )
}

function itemMatchesSearch(
  item: ForecastProductInventoryInsight,
  search: string,
): boolean {
  const normalizedSearch = normalizeIdentifier(search)

  if (!normalizedSearch) {
    return true
  }

  const value = normalizeIdentifier(
    [
      item.productId,
      item.productName,
      item.model ?? '',
      item.brandId ?? '',
      item.recommendedAction,
      ...item.signals.map((signal) =>
        `${signal.title} ${signal.rationale}`,
      ),
      item.catalog.supersededBy ?? '',
      item.catalog.directSubstitute ?? '',
    ].join(' '),
  )

  return value.includes(normalizedSearch)
}

function itemMatchesFilters(
  item: ForecastProductInventoryInsight,
  filters: ForecastWorkspaceFilters,
): boolean {
  if (
    filters.brandId !== 'all' &&
    item.brandId !== filters.brandId
  ) {
    return false
  }

  if (
    filters.coverage !== 'all' &&
    item.coverage.availableStatus !== filters.coverage &&
    item.coverage.supplyStatus !== filters.coverage
  ) {
    return false
  }

  if (
    filters.priority !== 'all' &&
    item.priority !== filters.priority
  ) {
    return false
  }

  if (
    filters.confidence !== 'all' &&
    item.baselineConfidence !== filters.confidence
  ) {
    return false
  }

  return itemMatchesSearch(item, filters.search)
}

function emptyCoverageBreakdown(): ForecastWorkspaceCoverageBreakdown {
  return {
    unavailable: 0,
    noDemand: 0,
    stockout: 0,
    shortage: 0,
    low: 0,
    balanced: 0,
    excess: 0,
  }
}

function addCoverage(
  result: ForecastWorkspaceCoverageBreakdown,
  status: ForecastCoverageStatus,
): void {
  if (status === 'no-demand') {
    result.noDemand += 1
    return
  }

  result[status] += 1
}

function buildInventorySummary(
  report: ReturnType<
    BusinessRepository['forecast']['getInventoryIntelligenceReport']
  >,
  filteredItems: readonly ForecastProductInventoryInsight[],
  scenarioId: ForecastScenarioId,
): ForecastWorkspaceInventorySummary {
  const coverage = emptyCoverageBreakdown()

  const summary = filteredItems.reduce(
    (result, item) => {
      const expectedDemand = selectedDemand(item, scenarioId)
      const remainingDemand = selectedRemainingDemand(
        item,
        scenarioId,
      )

      addCoverage(coverage, item.coverage.availableStatus)

      result.productsWithProjectedDemand +=
        expectedDemand !== null && expectedDemand > 0 ? 1 : 0
      result.productsWithoutProjectedDemand +=
        expectedDemand === null || expectedDemand <= 0 ? 1 : 0
      result.criticalItems += item.priority === 'critical' ? 1 : 0
      result.highPriorityItems += item.priority === 'high' ? 1 : 0
      result.availableUnits += item.inventory.available
      result.inboundUnits += item.inventory.inbound
      result.inventoryValue += item.inventory.inventoryValue
      result.expectedDemandUnits += expectedDemand ?? 0
      result.remainingDemandUnits += remainingDemand ?? 0
      result.projectedAvailableAfterDemand += Math.max(
        0,
        item.inventory.available - (remainingDemand ?? 0),
      )
      result.projectedSupplyAfterDemand += Math.max(
        0,
        item.inventory.available +
          item.inventory.inbound -
          (remainingDemand ?? 0),
      )
      result.supersededInventoryProducts +=
        item.catalog.isSuperseded &&
        item.inventory.available + item.inventory.inbound > 0
          ? 1
          : 0
      result.replacementRecoveries += item.signals.some(
        (signal) => signal.type === 'replacement-recovery',
      )
        ? 1
        : 0
      result.affectedInventoryValue += item.priority !== 'none'
        ? item.inventory.inventoryValue
        : 0

      return result
    },
    {
      productsWithProjectedDemand: 0,
      productsWithoutProjectedDemand: 0,
      criticalItems: 0,
      highPriorityItems: 0,
      availableUnits: 0,
      inboundUnits: 0,
      inventoryValue: 0,
      expectedDemandUnits: 0,
      remainingDemandUnits: 0,
      projectedAvailableAfterDemand: 0,
      projectedSupplyAfterDemand: 0,
      supersededInventoryProducts: 0,
      replacementRecoveries: 0,
      affectedInventoryValue: 0,
    },
  )

  return {
    reportStatus: report.status,
    productsAnalyzed: report.summary.productsAnalyzed,
    filteredProducts: filteredItems.length,
    productsWithProjectedDemand:
      summary.productsWithProjectedDemand,
    productsWithoutProjectedDemand:
      summary.productsWithoutProjectedDemand,
    criticalItems: summary.criticalItems,
    highPriorityItems: summary.highPriorityItems,
    availableUnits: roundValue(summary.availableUnits),
    inboundUnits: roundValue(summary.inboundUnits),
    inventoryValue: roundValue(summary.inventoryValue),
    expectedDemandUnits: roundValue(summary.expectedDemandUnits),
    remainingDemandUnits: roundValue(summary.remainingDemandUnits),
    projectedAvailableAfterDemand: roundValue(
      summary.projectedAvailableAfterDemand,
    ),
    projectedSupplyAfterDemand: roundValue(
      summary.projectedSupplyAfterDemand,
    ),
    supersededInventoryProducts:
      summary.supersededInventoryProducts,
    replacementRecoveries: summary.replacementRecoveries,
    affectedInventoryValue: roundValue(
      summary.affectedInventoryValue,
    ),
    coverage,
  }
}

function maxSignalScore(
  items: readonly ForecastProductInventoryInsight[],
  category?: ForecastInventorySignal['category'],
): number {
  return items.reduce(
    (maximum, item) => Math.max(
      maximum,
      ...item.signals
        .filter((signal) => !category || signal.category === category)
        .map((signal) => signal.score),
      0,
    ),
    0,
  )
}

function averageCoverage(
  items: readonly ForecastProductInventoryInsight[],
): number | null {
  const values = items
    .map((item) => item.coverage.availableMonths)
    .filter((value): value is number => value !== null)

  if (values.length === 0) {
    return null
  }

  return roundValue(
    values.reduce((total, value) => total + value, 0) /
      values.length,
    4,
  )
}

function buildBrandRows(
  projections: readonly ForecastBaselineProjection[],
  items: readonly ForecastProductInventoryInsight[],
  filters: ForecastWorkspaceFilters,
  scenarioId: ForecastScenarioId,
): ForecastWorkspaceBrandRow[] {
  return projections
    .map((projection) => {
      const brandId = projection.entityId ?? ''
      const brandItems = items.filter(
        (item) => item.brandId === brandId,
      )
      const projected = scenarioValues(projection, scenarioId)
      const targetAttainment = scenarioTargetAttainment(
        projection,
        scenarioId,
      )

      return {
        brandId,
        label: projection.entityLabel,
        actual: { ...projection.actual },
        projected,
        projectedGrossMargin: scenarioGrossMargin(
          projection,
          scenarioId,
        ),
        targetRevenue: projection.target.revenue,
        targetAttainment,
        revenueGap: projection.target.revenue === null
          ? null
          : roundValue(
              Math.max(
                0,
                projection.target.revenue - projected.revenue,
              ),
            ),
        targetStatus: resolveTargetStatus(
          projection.actual.revenue,
          projection.target.revenue,
          targetAttainment,
        ),
        confidenceScore: projection.confidence.score,
        confidenceLevel: projection.confidence.level,
        productsAnalyzed: brandItems.length,
        criticalProducts: brandItems.filter(
          (item) => item.priority === 'critical',
        ).length,
        highPriorityProducts: brandItems.filter(
          (item) => item.priority === 'high',
        ).length,
        stockoutProducts: brandItems.filter(
          (item) => item.coverage.availableStatus === 'stockout',
        ).length,
        shortageProducts: brandItems.filter(
          (item) => item.coverage.availableStatus === 'shortage',
        ).length,
        lowCoverageProducts: brandItems.filter(
          (item) => item.coverage.availableStatus === 'low',
        ).length,
        excessProducts: brandItems.filter(
          (item) => item.coverage.availableStatus === 'excess',
        ).length,
        noDemandProducts: brandItems.filter(
          (item) => item.coverage.availableStatus === 'no-demand',
        ).length,
        averageAvailableCoverageMonths: averageCoverage(brandItems),
        riskScore: maxSignalScore(brandItems, 'risk'),
        navigation: {
          entityType: 'brand' as const,
          entityId: brandId,
          label: projection.entityLabel,
          href: `/brands/${encodeURIComponent(brandId)}`,
        },
      }
    })
    .filter((row) => {
      if (
        filters.brandId !== 'all' &&
        row.brandId !== filters.brandId
      ) {
        return false
      }

      if (
        filters.confidence !== 'all' &&
        row.confidenceLevel !== filters.confidence
      ) {
        return false
      }

      const search = normalizeIdentifier(filters.search)

      return !search || normalizeIdentifier(
        `${row.brandId} ${row.label}`,
      ).includes(search)
    })
    .sort(
      (left, right) =>
        right.riskScore - left.riskScore ||
        right.projected.revenue - left.projected.revenue ||
        left.label.localeCompare(right.label),
    )
}

function primarySignal(
  item: ForecastProductInventoryInsight,
  category: ForecastInventorySignal['category'],
): ForecastInventorySignal | undefined {
  return item.signals
    .filter((signal) => signal.category === category)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.type.localeCompare(right.type),
    )[0]
}

function priorityItem(
  item: ForecastProductInventoryInsight,
  category: ForecastInventorySignal['category'],
  scenarioId: ForecastScenarioId,
): ForecastWorkspacePriorityItem | null {
  const signal = primarySignal(item, category)

  if (!signal) {
    return null
  }

  return {
    id: `${category}::${item.productId}`,
    category,
    signalType: signal.type,
    priority: signal.priority,
    score: signal.score,
    title: signal.title,
    rationale: signal.rationale,
    recommendedAction: item.recommendedAction,
    productId: item.productId,
    productName: item.productName,
    model: item.model,
    brandId: item.brandId,
    confidenceLevel: item.baselineConfidence,
    expectedDemandUnits: selectedDemand(item, scenarioId),
    remainingDemandUnits: selectedRemainingDemand(
      item,
      scenarioId,
    ),
    availableUnits: item.inventory.available,
    inboundUnits: item.inventory.inbound,
    availableCoverageMonths: item.coverage.availableMonths,
    supplyCoverageMonths: item.coverage.supplyMonths,
    inventoryValue: item.inventory.inventoryValue,
    isSuperseded: item.catalog.isSuperseded,
    navigation: {
      entityType: 'product',
      entityId: item.productId,
      label: item.productName,
      href: `/products/${encodeURIComponent(item.productId)}`,
    },
    replacementNavigation:
      item.replacement?.resolved && item.replacement.productId
        ? {
            entityType: 'product',
            entityId: item.replacement.productId,
            label:
              item.replacement.productName ??
              item.replacement.productId,
            href: `/products/${encodeURIComponent(item.replacement.productId)}`,
          }
        : null,
  }
}

function buildRanking(
  items: readonly ForecastProductInventoryInsight[],
  category: 'risk' | 'opportunity',
  scenarioId: ForecastScenarioId,
  limit: number,
): ForecastWorkspacePriorityItem[] {
  return items
    .map((item) => priorityItem(item, category, scenarioId))
    .filter(
      (item): item is ForecastWorkspacePriorityItem =>
        item !== null,
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.inventoryValue - left.inventoryValue ||
        left.productName.localeCompare(right.productName),
    )
    .slice(0, normalizeLimit(limit))
}

function resolveWorkspaceStatus(
  portfolio: ForecastWorkspacePortfolioSummary,
  inventoryStatus: ForecastWorkspaceInventorySummary['reportStatus'],
): ForecastWorkspaceStatus {
  if (!portfolio.available) {
    return 'unavailable'
  }

  if (
    inventoryStatus !== 'ready' ||
    portfolio.confidenceLevel === 'low'
  ) {
    return 'partial'
  }

  return 'ready'
}

function uniqueStrings(
  values: readonly string[],
): string[] {
  return [...new Set(values.filter(Boolean))]
}

export function buildForecastWorkspace(
  repository: BusinessRepository | null,
  request?: Partial<ForecastWorkspaceRequest>,
): ForecastWorkspaceModel {
  const normalizedRequest = normalizeRequest(request)

  if (!repository) {
    return {
      available: false,
      status: 'unavailable',
      unavailableReason:
        'Forecast Workspace requiere ventas normalizadas y Business Repository disponible.',
      generatedAt: null,
      methodology: {
        baseline: 'baseline-v1',
        inventory: 'forecast-inventory-v1',
      },
      scenarioId: normalizedRequest.scenarioId,
      scenarios: [],
      filters: normalizedRequest.filters,
      filterOptions: {
        brands: [],
        coverage: [...COVERAGE_STATUSES],
        priorities: [...PRIORITIES],
        confidenceLevels: [...CONFIDENCE_LEVELS],
      },
      period: {
        currentPeriodId: null,
        dataCutoff: null,
        snapshotDate: null,
        periodStatus: null,
        totalWorkingDays: null,
        elapsedWorkingDays: null,
        remainingWorkingDays: null,
        progress: null,
      },
      portfolio: buildPortfolioSummary(
        undefined,
        normalizedRequest.scenarioId,
      ),
      inventory: {
        reportStatus: 'unavailable',
        productsAnalyzed: 0,
        filteredProducts: 0,
        productsWithProjectedDemand: 0,
        productsWithoutProjectedDemand: 0,
        criticalItems: 0,
        highPriorityItems: 0,
        availableUnits: 0,
        inboundUnits: 0,
        inventoryValue: 0,
        expectedDemandUnits: 0,
        remainingDemandUnits: 0,
        projectedAvailableAfterDemand: 0,
        projectedSupplyAfterDemand: 0,
        supersededInventoryProducts: 0,
        replacementRecoveries: 0,
        affectedInventoryValue: 0,
        coverage: emptyCoverageBreakdown(),
      },
      brands: [],
      riskRanking: [],
      opportunityRanking: [],
      explainability: [],
      limitations: [
        'No existe un Business Repository para construir el Workspace.',
      ],
    }
  }

  const foundation = repository.forecast.getFoundation()
  const portfolioProjection =
    repository.forecast.getPortfolioBaselineProjection()
  const brandProjections =
    repository.forecast.getBaselineProjections('brand')
  const inventoryReport =
    repository.forecast.getInventoryIntelligenceReport()
  const filteredItems = inventoryReport.items.filter(
    (item) => itemMatchesFilters(
      item,
      normalizedRequest.filters,
    ),
  )
  const portfolio = buildPortfolioSummary(
    portfolioProjection,
    normalizedRequest.scenarioId,
  )
  const inventory = buildInventorySummary(
    inventoryReport,
    filteredItems,
    normalizedRequest.scenarioId,
  )
  const status = resolveWorkspaceStatus(
    portfolio,
    inventory.reportStatus,
  )

  const explainability = uniqueStrings([
    `Escenario activo: ${normalizedRequest.scenarioId}.`,
    'La proyección comercial consume exclusivamente Forecast Baseline Engine baseline-v1.',
    'La cobertura consume Forecast Inventory Intelligence forecast-inventory-v1.',
    'Los rankings se ordenan por score de señal y valor de inventario afectado.',
    ...portfolio.explainability,
  ])

  const limitations = uniqueStrings([
    ...foundation.constraints,
    ...portfolio.limitations,
    ...inventoryReport.quality.notes,
    'Los filtros de cobertura y prioridad afectan los productos y KPIs de inventario; el resumen comercial de portafolio conserva la proyección consolidada oficial.',
  ])

  return {
    available: portfolio.available,
    status,
    unavailableReason: portfolio.available
      ? null
      : 'No existe una proyección consolidada de portafolio.',
    generatedAt: inventoryReport.generatedAt || foundation.generatedAt,
    methodology: {
      baseline: portfolioProjection?.methodologyVersion ?? 'baseline-v1',
      inventory: inventoryReport.methodologyVersion,
    },
    scenarioId: normalizedRequest.scenarioId,
    scenarios: buildScenarioOptions(
      foundation.scenarios,
      portfolioProjection,
      normalizedRequest.scenarioId,
    ),
    filters: normalizedRequest.filters,
    filterOptions: {
      brands: brandProjections
        .map((projection) => ({
          id: projection.entityId ?? '',
          label: projection.entityLabel,
        }))
        .filter((brand) => Boolean(brand.id))
        .sort((left, right) => left.label.localeCompare(right.label)),
      coverage: [...COVERAGE_STATUSES],
      priorities: [...PRIORITIES],
      confidenceLevels: [...CONFIDENCE_LEVELS],
    },
    period: {
      currentPeriodId:
        portfolioProjection?.currentPeriodId ??
        foundation.currentPeriodId,
      dataCutoff:
        portfolioProjection?.dataCutoff ??
        foundation.dataCutoff,
      snapshotDate: inventoryReport.snapshotDate,
      periodStatus:
        portfolioProjection?.timing.periodStatus ?? null,
      totalWorkingDays:
        portfolioProjection?.timing.totalWorkingDays ?? null,
      elapsedWorkingDays:
        portfolioProjection?.timing.elapsedWorkingDays ?? null,
      remainingWorkingDays:
        portfolioProjection?.timing.remainingWorkingDays ?? null,
      progress: portfolioProjection?.timing.progress ?? null,
    },
    portfolio,
    inventory,
    brands: buildBrandRows(
      brandProjections,
      inventoryReport.items,
      normalizedRequest.filters,
      normalizedRequest.scenarioId,
    ),
    riskRanking: buildRanking(
      filteredItems,
      'risk',
      normalizedRequest.scenarioId,
      normalizedRequest.rankingLimit,
    ),
    opportunityRanking: buildRanking(
      filteredItems,
      'opportunity',
      normalizedRequest.scenarioId,
      normalizedRequest.rankingLimit,
    ),
    explainability,
    limitations,
  }
}
