import {
  buildSalesCommercialOpportunities,
} from './buildSalesCommercialOpportunities'

import {
  buildSalesExecutiveSummary,
} from './buildSalesExecutiveSummary'

import {
  buildSalesVarianceContributionAnalysis,
  createEmptySalesVarianceContributionAnalysis,
} from './buildSalesVarianceContribution'

import {
  countWeekdaysInclusive,
  resolveEquivalentWorkingDayCutoff,
} from '../../../core/analytics/shared/dateAnalytics'

import {
  calculateMetricAttainment,
  calculateRevenuePace,
} from '../../../core/business/attainment'

import type {
  BusinessBrandTarget,
} from '../../../core/business/entities/brandTarget'

import type {
  BusinessRepository,
  RevenuePeriodSummary,
  SalesSegmentationDimension,
  SalesSegmentationFilter,
  SalesSegmentationGroup,
  SalesSegmentationOption,
} from '../../../core/business/repository'

import type {
  SalesPerformanceStatus,
  SalesWorkspaceBrandPerformanceItem,
  SalesWorkspaceActiveFilter,
  SalesWorkspaceComparison,
  SalesWorkspaceFilterDimension,
  SalesWorkspaceFilterOptions,
  SalesWorkspaceFilters,
  SalesWorkspaceForecast,
  SalesWorkspacePerformance,
  SalesWorkspaceRankingItem,
  SalesWorkspaceSnapshot,
  SalesWorkspaceTargetMetric,
  SalesWorkspaceViewModel,
} from '../types'

const periodFormatter =
  new Intl.DateTimeFormat(
    'es-MX',
    {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  )

function formatPeriodLabel(
  year: number,
  month: number,
): string {
  const label =
    periodFormatter.format(
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

function calculateGrossMargin(
  revenue: number,
  grossProfit: number,
): number {
  if (revenue === 0) {
    return 0
  }

  return (
    grossProfit /
    revenue
  ) * 100
}

function calculateVariation(
  currentValue: number,
  previousValue: number | null,
): number | null {
  if (
    previousValue === null ||
    previousValue === 0
  ) {
    return null
  }

  return (
    (
      currentValue -
      previousValue
    ) /
    Math.abs(previousValue)
  ) * 100
}

function mapSnapshot(
  period: RevenuePeriodSummary,
): SalesWorkspaceSnapshot {
  return {
    periodId: period.id,
    periodLabel:
      formatPeriodLabel(
        period.year,
        period.month,
      ),
    revenue: period.revenue,
    grossProfit:
      period.grossProfit,
    grossMargin:
      calculateGrossMargin(
        period.revenue,
        period.grossProfit,
      ),
    quantity: period.quantity,
    documents: period.documents,
    customerCount:
      period.customerCount,
    brandCount:
      period.brandCount,
    productCount:
      period.productCount,
  }
}

function findComparisonPeriod(
  periods: RevenuePeriodSummary[],
  currentPeriod: RevenuePeriodSummary,
  filters: SalesWorkspaceFilters,
): RevenuePeriodSummary | null {
  if (
    filters.comparisonMode ===
      'previous-year'
  ) {
    return (
      periods.find(
        (period) =>
          period.year ===
            currentPeriod.year - 1 &&
          period.month ===
            currentPeriod.month,
      ) ?? null
    )
  }

  const currentIndex =
    periods.findIndex(
      (period) =>
        period.id ===
        currentPeriod.id,
    )

  if (currentIndex <= 0) {
    return null
  }

  return (
    periods[
      currentIndex - 1
    ] ?? null
  )
}

function buildComparison(
  currentPeriod: RevenuePeriodSummary,
  previousPeriod: RevenuePeriodSummary | null,
  filters: SalesWorkspaceFilters,
): SalesWorkspaceComparison {
  const currentMargin =
    calculateGrossMargin(
      currentPeriod.revenue,
      currentPeriod.grossProfit,
    )

  const previousMargin =
    previousPeriod
      ? calculateGrossMargin(
          previousPeriod.revenue,
          previousPeriod.grossProfit,
        )
      : null

  return {
    mode: filters.comparisonMode,
    label:
      filters.comparisonMode ===
      'previous-year'
        ? 'Mismo mes del año anterior'
        : 'Periodo anterior',
    previousPeriodId:
      previousPeriod?.id ?? null,
    previousPeriodLabel:
      previousPeriod
        ? formatPeriodLabel(
            previousPeriod.year,
            previousPeriod.month,
          )
        : null,
    revenueVariation:
      calculateVariation(
        currentPeriod.revenue,
        previousPeriod?.revenue ?? null,
      ),
    grossProfitVariation:
      calculateVariation(
        currentPeriod.grossProfit,
        previousPeriod?.grossProfit ?? null,
      ),
    quantityVariation:
      calculateVariation(
        currentPeriod.quantity,
        previousPeriod?.quantity ?? null,
      ),
    marginPointVariation:
      previousMargin === null
        ? null
        : currentMargin -
          previousMargin,
  }
}

function sortRanking(
  items: SalesWorkspaceRankingItem[],
): SalesWorkspaceRankingItem[] {
  return items
    .sort(
      (left, right) =>
        right.revenue -
          left.revenue ||
        left.label.localeCompare(
          right.label,
          'es-MX',
        ),
    )
    .slice(0, 5)
}

function calculateParticipation(
  revenue: number,
  totalRevenue: number,
): number {
  if (totalRevenue === 0) {
    return 0
  }

  return (
    revenue /
    totalRevenue
  ) * 100
}

function buildSegmentationFilter(
  filters: SalesWorkspaceFilters,
  periodIds?: readonly string[],
  omitDimension?: SalesWorkspaceFilterDimension,
  dateFrom?: string,
  dateTo?: string,
): SalesSegmentationFilter {
  return {
    periodIds,
    dateFrom,
    dateTo,
    brandIds:
      omitDimension === 'brand'
        ? undefined
        : filters.brandIds,
    customerIds:
      omitDimension === 'customer'
        ? undefined
        : filters.customerIds,
    productIds:
      omitDimension === 'product'
        ? undefined
        : filters.productIds,
    locationIds:
      omitDimension === 'location'
        ? undefined
        : filters.locationIds,
    salesRepresentativeIds:
      omitDimension === 'salesRepresentative'
        ? undefined
        : filters.salesRepresentativeIds,
    searchTerm:
      filters.searchTerm ?? null,
  }
}

function buildFilteredPeriod(
  repository: BusinessRepository,
  period: RevenuePeriodSummary,
  filters: SalesWorkspaceFilters,
  dateTo?: string,
): RevenuePeriodSummary {
  const summary =
    repository.salesSegmentation.summarize(
      buildSegmentationFilter(
        filters,
        [period.id],
        undefined,
        undefined,
        dateTo,
      ),
    )

  return {
    ...period,
    revenue: summary.revenue,
    grossProfit: summary.grossProfit,
    quantity: summary.quantity,
    documents: summary.documents,
    customerCount: summary.customerCount,
    brandCount: summary.brandCount,
    productCount: summary.productCount,
  }
}

function buildSegmentationRanking(
  repository: BusinessRepository,
  dimension: Extract<
    SalesSegmentationDimension,
    'brand' | 'customer' | 'product'
  >,
  filters: SalesWorkspaceFilters,
  periodId: string,
  totalRevenue: number,
): SalesWorkspaceRankingItem[] {
  return sortRanking(
    repository.salesSegmentation
      .groupBy(
        dimension,
        buildSegmentationFilter(
          filters,
          [periodId],
        ),
      )
      .map((group) => ({
        id: group.id,
        label: group.label,
        revenue: group.revenue,
        grossProfit: group.grossProfit,
        quantity: group.quantity,
        documents: group.documents,
        participation:
          calculateParticipation(
            group.revenue,
            totalRevenue,
          ),
      })),
  )
}

function mapFilterOptions(
  groups: SalesSegmentationGroup[],
): SalesSegmentationOption[] {
  return groups
    .map((group) => ({
      id: group.id,
      label: group.label,
      revenue: group.revenue,
    }))
    .sort((left, right) =>
      left.label.localeCompare(
        right.label,
        'es-MX',
      ),
    )
}

function buildFilterOptions(
  repository: BusinessRepository,
  filters: SalesWorkspaceFilters,
  periodId: string,
): SalesWorkspaceFilterOptions {
  const group = (
    dimension: Exclude<
      SalesSegmentationDimension,
      'period'
    >,
    filterDimension: SalesWorkspaceFilterDimension,
  ) =>
    mapFilterOptions(
      repository.salesSegmentation.groupBy(
        dimension,
        buildSegmentationFilter(
          filters,
          [periodId],
          filterDimension,
        ),
      ),
    )

  return {
    brands: group('brand', 'brand'),
    customers: group('customer', 'customer'),
    products: group('product', 'product'),
    locations: group('location', 'location'),
    salesRepresentatives: group(
      'salesRepresentative',
      'salesRepresentative',
    ),
  }
}

function findOptionLabel(
  options: SalesSegmentationOption[],
  id: string,
): string {
  return (
    options.find(
      (option) => option.id === id,
    )?.label ?? id
  )
}

function buildActiveFilters(
  filters: SalesWorkspaceFilters,
  options: SalesWorkspaceFilterOptions,
): SalesWorkspaceActiveFilter[] {
  const result: SalesWorkspaceActiveFilter[] = []

  const append = (
    dimension: SalesWorkspaceFilterDimension,
    ids: readonly string[] | undefined,
    source: SalesSegmentationOption[],
  ) => {
    for (const id of ids ?? []) {
      result.push({
        dimension,
        id,
        label: findOptionLabel(source, id),
      })
    }
  }

  append('brand', filters.brandIds, options.brands)
  append('customer', filters.customerIds, options.customers)
  append('product', filters.productIds, options.products)
  append('location', filters.locationIds, options.locations)
  append(
    'salesRepresentative',
    filters.salesRepresentativeIds,
    options.salesRepresentatives,
  )

  const searchTerm =
    filters.searchTerm?.trim()

  if (searchTerm) {
    result.push({
      dimension: 'search',
      id: searchTerm,
      label: `Búsqueda: ${searchTerm}`,
    })
  }

  return result
}

function hasNonBrandTargetFilters(
  filters: SalesWorkspaceFilters,
): boolean {
  return Boolean(
    filters.customerIds?.length ||
    filters.productIds?.length ||
    filters.locationIds?.length ||
    filters.salesRepresentativeIds?.length ||
    filters.searchTerm?.trim(),
  )
}

function buildEmptyComparison(
  filters: SalesWorkspaceFilters,
): SalesWorkspaceComparison {
  return {
    mode: filters.comparisonMode,
    label:
      filters.comparisonMode ===
      'previous-year'
        ? 'Mismo mes del año anterior'
        : 'Periodo anterior',
    previousPeriodId: null,
    previousPeriodLabel: null,
    revenueVariation: null,
    grossProfitVariation: null,
    quantityVariation: null,
    marginPointVariation: null,
  }
}

function sumNullable(
  values: Array<number | null>,
): number | null {
  const finiteValues =
    values.filter(
      (value): value is number =>
        value !== null &&
        Number.isFinite(value),
    )

  if (finiteValues.length === 0) {
    return null
  }

  return finiteValues.reduce(
    (total, value) =>
      total + value,
    0,
  )
}

function normalizeMarginTarget(
  value: number | null,
): number | null {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.abs(value) <= 1
    ? value * 100
    : value
}

function resolveTargetGrossMargin(
  targets: BusinessBrandTarget[],
  targetRevenue: number | null,
  targetGrossProfit: number | null,
): number | null {
  const pairedTargets =
    targets.filter(
      (target) =>
        target.targetRevenue !== null &&
        target.targetGrossProfit !== null,
    )

  const pairedRevenue =
    sumNullable(
      pairedTargets.map(
        (target) =>
          target.targetRevenue,
      ),
    )

  const pairedGrossProfit =
    sumNullable(
      pairedTargets.map(
        (target) =>
          target.targetGrossProfit,
      ),
    )

  if (
    pairedRevenue !== null &&
    pairedGrossProfit !== null &&
    pairedRevenue !== 0
  ) {
    return calculateGrossMargin(
      pairedRevenue,
      pairedGrossProfit,
    )
  }

  if (
    targetRevenue !== null &&
    targetGrossProfit !== null &&
    targetRevenue !== 0
  ) {
    return calculateGrossMargin(
      targetRevenue,
      targetGrossProfit,
    )
  }

  const weightedTargets =
    targets
      .map((target) => ({
        margin:
          normalizeMarginTarget(
            target.targetGrossMargin,
          ),
        revenue:
          target.targetRevenue,
      }))
      .filter(
        (
          target,
        ): target is {
          margin: number
          revenue: number
        } =>
          target.margin !== null &&
          target.revenue !== null &&
          target.revenue > 0,
      )

  if (weightedTargets.length > 0) {
    const weightedRevenue =
      weightedTargets.reduce(
        (total, target) =>
          total + target.revenue,
        0,
      )

    if (weightedRevenue > 0) {
      return (
        weightedTargets.reduce(
          (total, target) =>
            total +
            target.margin *
              target.revenue,
          0,
        ) /
        weightedRevenue
      )
    }
  }

  const margins =
    targets
      .map((target) =>
        normalizeMarginTarget(
          target.targetGrossMargin,
        ),
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      )

  if (margins.length === 0) {
    return null
  }

  return margins.reduce(
    (total, value) =>
      total + value,
    0,
  ) / margins.length
}

function resolveWorkingDays(
  targets: BusinessBrandTarget[],
): number | null {
  const frequency =
    new Map<number, number>()

  for (const target of targets) {
    const workingDays =
      target.workingDays

    if (
      workingDays === null ||
      !Number.isInteger(workingDays) ||
      workingDays <= 0
    ) {
      continue
    }

    frequency.set(
      workingDays,
      (frequency.get(workingDays) ?? 0) + 1,
    )
  }

  return (
    [...frequency.entries()]
      .sort(
        (left, right) =>
          right[1] - left[1] ||
          right[0] - left[0],
      )[0]?.[0] ?? null
  )
}

function resolvePeriodCutoff(
  repository: BusinessRepository,
  period: RevenuePeriodSummary,
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

function resolveElapsedWorkingDays(
  period: RevenuePeriodSummary,
  workingDays: number | null,
  cutoff: string,
): number | null {
  if (workingDays === null) {
    return null
  }

  const calendarWeekdays =
    countWeekdaysInclusive(
      `${period.id}-01`,
      cutoff,
    )

  if (calendarWeekdays === null) {
    return null
  }

  return Math.min(
    calendarWeekdays,
    workingDays,
  )
}

function isOpenSelectedPeriod(
  repository: BusinessRepository,
  period: RevenuePeriodSummary,
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

function mapTargetMetric(
  actual: number,
  target: number | null,
): SalesWorkspaceTargetMetric {
  const metric =
    calculateMetricAttainment(
      actual,
      target,
    )

  return {
    actual,
    target: metric.target,
    variance: metric.variance,
    attainment:
      metric.attainment === null
        ? null
        : metric.attainment * 100,
  }
}

function buildTargetCoverage(
  period: RevenuePeriodSummary,
  targets: BusinessBrandTarget[],
  activeBrandIds: readonly string[],
) {
  const targetedBrandIds =
    new Set(
      targets.map(
        (target) => target.brandId,
      ),
    )

  const coveredActiveBrands =
    activeBrandIds.filter(
      (brandId) =>
        targetedBrandIds.has(brandId),
    ).length

  const activeBrands =
    activeBrandIds.length ||
    period.brandCount

  return {
    targetedBrands:
      targetedBrandIds.size,
    activeBrands,
    coveredActiveBrands,
    activeBrandsWithoutTarget:
      Math.max(
        activeBrands - coveredActiveBrands,
        0,
      ),
    coveragePercentage:
      activeBrands > 0
        ? (coveredActiveBrands / activeBrands) * 100
        : 0,
  }
}

function buildEmptyForecast(
  unavailableReason: string | null = null,
): SalesWorkspaceForecast {
  return {
    available: false,
    officialAvailable: false,
    status: 'unavailable',
    periodId: null,
    dataCutoff: null,
    expectedRevenue: null,
    expectedGrossProfit: null,
    expectedAttainment: null,
    confidenceScore: null,
    confidenceLevel: null,
    unavailableReason,
  }
}

function buildForecast(
  repository: BusinessRepository,
  period: RevenuePeriodSummary,
  targetRevenue: number | null,
  scopeBlocked: boolean,
  selectedBrandIds: readonly string[] = [],
): SalesWorkspaceForecast {
  if (scopeBlocked) {
    return buildEmptyForecast(
      'El Forecast Project-Aware no se aplica a filtros por cliente, producto, ubicación, vendedor o búsqueda para evitar mezclar una proyección consolidada con un segmento parcial.',
    )
  }

  if (selectedBrandIds.length > 1) {
    return buildEmptyForecast(
      'El Forecast Project-Aware no se publica para selecciones de múltiples marcas hasta contar con una agregación explícita y validada.',
    )
  }

  const projection =
    selectedBrandIds.length === 1
      ? repository.forecast.findProjectAwareBrandProjection(
          selectedBrandIds[0]!,
        )
      : repository.forecast.getProjectAwarePortfolioProjection()

  if (!projection) {
    return buildEmptyForecast(
      'No existe una proyección Project-Aware disponible.',
    )
  }

  if (projection.currentPeriodId !== period.id) {
    return buildEmptyForecast(
      `El Forecast Project-Aware corresponde a ${projection.currentPeriodId} y no al periodo seleccionado ${period.id}.`,
    )
  }

  const expectedRevenue =
    projection.officialAvailable
      ? projection.expected.revenue
      : null

  const expectedGrossProfit =
    projection.officialAvailable
      ? projection.expected.grossProfit
      : null

  return {
    available: true,
    officialAvailable:
      projection.officialAvailable,
    status: projection.status,
    periodId:
      projection.currentPeriodId,
    dataCutoff:
      projection.dataCutoff,
    expectedRevenue,
    expectedGrossProfit,
    expectedAttainment:
      expectedRevenue !== null &&
      targetRevenue !== null &&
      targetRevenue !== 0
        ? (
            expectedRevenue /
            targetRevenue
          ) * 100
        : null,
    confidenceScore:
      projection.confidence.score,
    confidenceLevel:
      projection.confidence.level,
    unavailableReason:
      projection.officialAvailable
        ? null
        : 'El Forecast Project-Aware existe, pero su estado actual no permite publicarlo como forecast oficial.',
  }
}

function buildEmptyPerformance(
  period: RevenuePeriodSummary | null,
  unavailableReason: string | null = null,
  forecast: SalesWorkspaceForecast = buildEmptyForecast(),
): SalesWorkspacePerformance {
  const revenue =
    period?.revenue ?? 0

  const grossProfit =
    period?.grossProfit ?? 0

  const grossMargin =
    calculateGrossMargin(
      revenue,
      grossProfit,
    )

  return {
    available: false,
    unavailableReason,
    revenue:
      mapTargetMetric(
        revenue,
        null,
      ),
    grossProfit:
      mapTargetMetric(
        grossProfit,
        null,
      ),
    grossMargin:
      mapTargetMetric(
        grossMargin,
        null,
      ),
    pace: {
      status: 'not-evaluable',
      dataCutoff:
        period?.periodEnd ?? null,
      workingDays: null,
      elapsedWorkingDays: null,
      remainingWorkingDays: null,
      currentDailyRevenue: null,
      requiredDailyRevenue: null,
      expectedToDate: null,
      varianceToPlan: null,
      attainmentToPlan: null,
      projectedPeriodEnd: null,
      projectedAttainment: null,
    },
    forecast,
    coverage: {
      targetedBrands: 0,
      activeBrands:
        period?.brandCount ?? 0,
      coveredActiveBrands: 0,
      activeBrandsWithoutTarget:
        period?.brandCount ?? 0,
      coveragePercentage: 0,
    },
  }
}

function buildPerformance(
  repository: BusinessRepository,
  period: RevenuePeriodSummary,
  targets: BusinessBrandTarget[],
  activeBrandIds: readonly string[],
  selectedBrandIds: readonly string[],
): SalesWorkspacePerformance {
  const targetRevenue =
    sumNullable(
      targets.map(
        (target) =>
          target.targetRevenue,
      ),
    )

  const forecast =
    buildForecast(
      repository,
      period,
      targetRevenue,
      false,
      selectedBrandIds,
    )

  if (targets.length === 0) {
    return buildEmptyPerformance(
      period,
      null,
      forecast,
    )
  }

  const cutoff =
    resolvePeriodCutoff(
      repository,
      period,
    )

  const targetGrossProfit =
    sumNullable(
      targets.map(
        (target) =>
          target.targetGrossProfit,
      ),
    )

  const targetGrossMargin =
    resolveTargetGrossMargin(
      targets,
      targetRevenue,
      targetGrossProfit,
    )

  const actualGrossMargin =
    calculateGrossMargin(
      period.revenue,
      period.grossProfit,
    )

  const workingDays =
    resolveWorkingDays(
      targets,
    )

  const elapsedWorkingDays =
    resolveElapsedWorkingDays(
      period,
      workingDays,
      cutoff,
    )

  const revenuePace =
    calculateRevenuePace(
      period.revenue,
      targetRevenue,
      workingDays,
      elapsedWorkingDays,
    )

  const remainingWorkingDays =
    workingDays !== null &&
    elapsedWorkingDays !== null
      ? Math.max(
          workingDays -
            elapsedWorkingDays,
          0,
        )
      : null

  const requiredDailyRevenue =
    targetRevenue !== null &&
    remainingWorkingDays !== null
      ? remainingWorkingDays > 0
        ? Math.max(
            targetRevenue -
              period.revenue,
            0,
          ) /
          remainingWorkingDays
        : targetRevenue <=
            period.revenue
          ? 0
          : null
      : null

  return {
    available: true,
    unavailableReason: null,
    revenue:
      mapTargetMetric(
        period.revenue,
        targetRevenue,
      ),
    grossProfit:
      mapTargetMetric(
        period.grossProfit,
        targetGrossProfit,
      ),
    grossMargin:
      mapTargetMetric(
        actualGrossMargin,
        targetGrossMargin,
      ),
    pace: {
      status:
        revenuePace.status,
      dataCutoff:
        cutoff,
      workingDays:
        revenuePace.workingDays,
      elapsedWorkingDays:
        revenuePace.elapsedWorkingDays,
      remainingWorkingDays,
      currentDailyRevenue:
        elapsedWorkingDays !== null &&
        elapsedWorkingDays > 0
          ? period.revenue /
            elapsedWorkingDays
          : null,
      requiredDailyRevenue,
      expectedToDate:
        revenuePace.expectedToDate,
      varianceToPlan:
        revenuePace.varianceToPlan,
      attainmentToPlan:
        revenuePace.attainmentToPlan === null
          ? null
          : revenuePace.attainmentToPlan * 100,
      projectedPeriodEnd:
        revenuePace.projectedPeriodEnd,
      projectedAttainment:
        targetRevenue === null ||
        targetRevenue === 0 ||
        revenuePace.projectedPeriodEnd === null
          ? null
          : (
              revenuePace.projectedPeriodEnd /
              targetRevenue
            ) * 100,
    },
    forecast,
    coverage:
      buildTargetCoverage(
        period,
        targets,
        activeBrandIds,
      ),
  }
}

function resolveBrandTargetGrossMargin(
  target: BusinessBrandTarget,
): number | null {
  if (
    target.targetRevenue !== null &&
    target.targetGrossProfit !== null &&
    target.targetRevenue !== 0
  ) {
    return calculateGrossMargin(
      target.targetRevenue,
      target.targetGrossProfit,
    )
  }

  return normalizeMarginTarget(
    target.targetGrossMargin,
  )
}

function statusPriority(
  status: SalesPerformanceStatus,
): number {
  switch (status) {
    case 'behind-plan':
      return 0
    case 'on-plan':
      return 1
    case 'ahead-of-plan':
      return 2
    case 'achieved':
      return 3
    case 'not-evaluable':
      return 4
  }
}

function buildBrandPerformance(
  repository: BusinessRepository,
  period: RevenuePeriodSummary,
  targets: BusinessBrandTarget[],
): SalesWorkspaceBrandPerformanceItem[] {
  const cutoff =
    resolvePeriodCutoff(
      repository,
      period,
    )

  return targets
    .map((target) => {
      const brand =
        repository.brand.findById(
          target.brandId,
        )

      const actual =
        repository.brand.findPeriod(
          target.brandId,
          period.id,
        )

      const actualRevenue =
        actual?.revenue ?? 0

      const actualGrossProfit =
        actual?.grossProfit ?? 0

      const currentGrossMargin =
        calculateGrossMargin(
          actualRevenue,
          actualGrossProfit,
        )

      const targetGrossMargin =
        resolveBrandTargetGrossMargin(
          target,
        )

      const elapsedWorkingDays =
        resolveElapsedWorkingDays(
          period,
          target.workingDays,
          cutoff,
        )

      const pace =
        calculateRevenuePace(
          actualRevenue,
          target.targetRevenue,
          target.workingDays,
          elapsedWorkingDays,
        )

      const projectedAttainment =
        pace.projectedPeriodEnd !== null &&
        target.targetRevenue !== null &&
        target.targetRevenue !== 0
          ? (
              pace.projectedPeriodEnd /
              target.targetRevenue
            ) * 100
          : null

      return {
        brandId: target.brandId,
        brandName:
          brand?.name ??
          target.brandId,
        actualRevenue,
        targetRevenue:
          target.targetRevenue,
        attainment:
          target.targetRevenue !== null &&
          target.targetRevenue !== 0
            ? (
                actualRevenue /
                target.targetRevenue
              ) * 100
            : null,
        expectedToDate:
          pace.expectedToDate,
        varianceToPlan:
          pace.varianceToPlan,
        projectedRevenue:
          pace.projectedPeriodEnd,
        projectedAttainment,
        currentGrossMargin,
        targetGrossMargin,
        marginVariancePoints:
          targetGrossMargin === null
            ? null
            : currentGrossMargin -
              targetGrossMargin,
        status: pace.status,
      }
    })
    .sort(
      (left, right) =>
        statusPriority(
          left.status,
        ) -
          statusPriority(
            right.status,
          ) ||
        (left.varianceToPlan ?? Number.POSITIVE_INFINITY) -
          (right.varianceToPlan ?? Number.POSITIVE_INFINITY) ||
        (right.targetRevenue ?? 0) -
          (left.targetRevenue ?? 0) ||
        left.brandName.localeCompare(
          right.brandName,
          'es-MX',
        ),
    )
}

export function buildSalesWorkspace(
  repository: BusinessRepository | null,
  filters: SalesWorkspaceFilters,
): SalesWorkspaceViewModel {
  const emptyFilterOptions: SalesWorkspaceFilterOptions = {
    brands: [],
    customers: [],
    products: [],
    locations: [],
    salesRepresentatives: [],
  }

  if (!repository) {
    return {
      available: false,
      periodOptions: [],
      selectedPeriodId: null,
      selectedPeriodLabel:
        'Sin periodo disponible',
      current: null,
      comparison:
        buildEmptyComparison(filters),
      performance:
        buildEmptyPerformance(null),
      brandPerformance: [],
      commercialOpportunities: {
        available: false,
        unavailableReason:
          'No existen datos de ventas para evaluar oportunidades comerciales.',
        totalImpact: 0,
        totalCount: 0,
        criticalCount: 0,
        highCount: 0,
        requiredDailyRevenue: null,
        opportunities: [],
      },
      varianceContribution:
        createEmptySalesVarianceContributionAnalysis(
          filters.comparisonMode === 'previous-year'
            ? 'Mismo mes del año anterior'
            : 'Periodo anterior',
          'No existen datos de ventas para explicar variaciones comerciales.',
        ),
      executiveSummary:
        buildSalesExecutiveSummary({
          available: false,
          selectedPeriodLabel:
            'Sin periodo disponible',
          current: null,
          comparison:
            buildEmptyComparison(filters),
          performance:
            buildEmptyPerformance(null),
          varianceContribution:
            createEmptySalesVarianceContributionAnalysis(
              filters.comparisonMode === 'previous-year'
                ? 'Mismo mes del año anterior'
                : 'Periodo anterior',
              'No existen datos de ventas para explicar variaciones comerciales.',
            ),
          commercialOpportunities: {
            available: false,
            unavailableReason:
              'No existen datos de ventas para evaluar oportunidades comerciales.',
            totalImpact: 0,
            totalCount: 0,
            criticalCount: 0,
            highCount: 0,
            requiredDailyRevenue: null,
            opportunities: [],
          },
          reconciliation: {
            totalRows: 0,
            matchedRows: 0,
            ambiguousRows: 0,
            unmatchedRows: 0,
            matchRate: 0,
          },
          activeFilters: [],
        }),
      trend: [],
      topBrands: [],
      topCustomers: [],
      topProducts: [],
      reconciliation: {
        totalRows: 0,
        matchedRows: 0,
        ambiguousRows: 0,
        unmatchedRows: 0,
        matchRate: 0,
      },
      filterOptions: emptyFilterOptions,
      activeFilters: [],
      hasActiveSegmentationFilters: false,
      detailRows: [],
      detailTotalRows: 0,
      detailSourceRows: 0,
    }
  }

  const periods =
    repository.revenue.getMonthly()

  const latestPeriod =
    periods.at(-1) ?? null

  const selectedBasePeriod =
    filters.periodId
      ? repository.revenue.findById(
          filters.periodId,
        ) ?? latestPeriod
      : latestPeriod

  if (!selectedBasePeriod) {
    return buildSalesWorkspace(
      null,
      filters,
    )
  }

  const previousBasePeriod =
    findComparisonPeriod(
      periods,
      selectedBasePeriod,
      filters,
    )

  const selectedCutoff =
    resolvePeriodCutoff(
      repository,
      selectedBasePeriod,
    )

  const compareEquivalentProgress =
    isOpenSelectedPeriod(
      repository,
      selectedBasePeriod,
    )

  const comparisonCutoff =
    compareEquivalentProgress &&
    previousBasePeriod
      ? resolveEquivalentWorkingDayCutoff(
          selectedBasePeriod.id,
          selectedCutoff,
          previousBasePeriod.id,
          previousBasePeriod.periodEnd,
        )
      : null

  const selectedPeriod =
    buildFilteredPeriod(
      repository,
      selectedBasePeriod,
      filters,
      compareEquivalentProgress
        ? selectedCutoff
        : undefined,
    )

  const previousPeriod =
    previousBasePeriod
      ? buildFilteredPeriod(
          repository,
          previousBasePeriod,
          filters,
          comparisonCutoff ??
            undefined,
        )
      : null

  const selectedIndex =
    periods.findIndex(
      (period) =>
        period.id === selectedBasePeriod.id,
    )

  const trendStart =
    Math.max(
      0,
      selectedIndex - 11,
    )

  const visibleTrendPeriods =
    new Set(
      periods
        .slice(
          trendStart,
          selectedIndex + 1,
        )
        .map((period) => period.id),
    )

  const reconciliation =
    repository.product
      .getReconciliationSummary()

  const filterOptions =
    buildFilterOptions(
      repository,
      filters,
      selectedBasePeriod.id,
    )

  const activeFilters =
    buildActiveFilters(
      filters,
      filterOptions,
    )

  const periodSegmentationFilter =
    buildSegmentationFilter(
      filters,
      [selectedBasePeriod.id],
    )

  const selectedSummary =
    repository.salesSegmentation.summarize(
      periodSegmentationFilter,
    )

  const activeBrandGroups =
    repository.salesSegmentation.groupBy(
      'brand',
      periodSegmentationFilter,
    )

  const targetScopeBlocked =
    hasNonBrandTargetFilters(filters)

  const selectedBrandIds =
    filters.brandIds ?? []

  const periodTargets =
    repository.targets
      .findPeriodTargets(
        selectedBasePeriod.id,
      )
      .filter(
        (target) =>
          selectedBrandIds.length === 0 ||
          selectedBrandIds.includes(
            target.brandId,
          ),
      )

  const performance =
    targetScopeBlocked
      ? buildEmptyPerformance(
          selectedPeriod,
          'Los objetivos mensuales están definidos por marca. Al filtrar por cliente, producto, ubicación, vendedor o búsqueda, el cumplimiento se desactiva para evitar comparar un segmento parcial contra una cuota completa.',
          buildForecast(
            repository,
            selectedPeriod,
            null,
            true,
            selectedBrandIds,
          ),
        )
      : buildPerformance(
          repository,
          selectedPeriod,
          periodTargets,
          activeBrandGroups.map(
            (group) => group.id,
          ),
          selectedBrandIds,
        )

  const brandPerformance =
    targetScopeBlocked
      ? []
      : buildBrandPerformance(
          repository,
          selectedPeriod,
          periodTargets,
        )

  const varianceContribution =
    buildSalesVarianceContributionAnalysis({
      repository,
      filters,
      currentPeriodId:
        selectedBasePeriod.id,
      comparisonPeriodId:
        previousBasePeriod?.id ?? null,
      comparisonLabel:
        filters.comparisonMode ===
        'previous-year'
          ? 'Mismo mes del año anterior'
          : 'Periodo anterior',
      currentDateTo:
        compareEquivalentProgress
          ? selectedCutoff
          : undefined,
      comparisonDateTo:
        comparisonCutoff ??
        undefined,
    })

  const commercialOpportunities =
    buildSalesCommercialOpportunities({
      repository,
      filters,
      currentPeriodId:
        selectedBasePeriod.id,
      comparisonPeriodId:
        previousBasePeriod?.id ?? null,
      currentRevenue:
        selectedPeriod.revenue,
      performance,
      brandPerformance,
    })

  const selectedPeriodLabel =
    formatPeriodLabel(
      selectedBasePeriod.year,
      selectedBasePeriod.month,
    )

  const current =
    mapSnapshot(selectedPeriod)

  const comparison =
    buildComparison(
      selectedPeriod,
      previousPeriod,
      filters,
    )

  const reconciliationView = {
    totalRows:
      reconciliation.totalRows,
    matchedRows:
      reconciliation.matchedRows,
    ambiguousRows:
      reconciliation.ambiguousRows,
    unmatchedRows:
      reconciliation.unmatchedRows,
    matchRate:
      reconciliation.matchRate * 100,
  }

  const trend =
    repository.salesSegmentation
      .groupBy(
        'period',
        buildSegmentationFilter(filters),
      )
      .filter((group) =>
        visibleTrendPeriods.has(group.id),
      )
      .map((group) => {
        const period =
          repository.revenue.findById(
            group.id,
          )

        return {
          periodId: group.id,
          periodLabel: period
            ? formatPeriodLabel(
                period.year,
                period.month,
              )
            : group.label,
          revenue: group.revenue,
          grossProfit: group.grossProfit,
          grossMargin: group.grossMargin,
        }
      })

  const topBrands =
    buildSegmentationRanking(
      repository,
      'brand',
      filters,
      selectedBasePeriod.id,
      selectedPeriod.revenue,
    )

  const topCustomers =
    buildSegmentationRanking(
      repository,
      'customer',
      filters,
      selectedBasePeriod.id,
      selectedPeriod.revenue,
    )

  const topProducts =
    buildSegmentationRanking(
      repository,
      'product',
      filters,
      selectedBasePeriod.id,
      selectedPeriod.revenue,
    )

  const detailRows =
    repository.salesSegmentation
      .getDetailRows(
        periodSegmentationFilter,
        100,
      )

  const executiveSummary =
    buildSalesExecutiveSummary({
      available: true,
      selectedPeriodLabel,
      current,
      comparison,
      performance,
      varianceContribution,
      commercialOpportunities,
      reconciliation:
        reconciliationView,
      activeFilters,
    })

  return {
    available: true,
    periodOptions:
      [...periods]
        .reverse()
        .map((period) => ({
          id: period.id,
          label:
            formatPeriodLabel(
              period.year,
              period.month,
            ),
          year: period.year,
          month: period.month,
        })),
    selectedPeriodId:
      selectedBasePeriod.id,
    selectedPeriodLabel,
    current,
    comparison,
    performance,
    brandPerformance,
    commercialOpportunities,
    varianceContribution,
    executiveSummary,
    trend,
    topBrands,
    topCustomers,
    topProducts,
    reconciliation:
      reconciliationView,
    filterOptions,
    activeFilters,
    hasActiveSegmentationFilters:
      activeFilters.length > 0,
    detailRows,
    detailTotalRows:
      selectedSummary.segmentCount,
    detailSourceRows:
      selectedSummary.rowCount,
  }

}