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
} from '../../../core/business/repository'

import type {
  SalesPerformanceStatus,
  SalesWorkspaceBrandPerformanceItem,
  SalesWorkspaceComparison,
  SalesWorkspaceFilters,
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

function buildBrandRanking(
  repository: BusinessRepository,
  periodId: string,
  totalRevenue: number,
): SalesWorkspaceRankingItem[] {
  return sortRanking(
    repository
      .getBrands()
      .map((brand) => {
        const period =
          repository.brand.findPeriod(
            brand.id,
            periodId,
          )

        if (!period) {
          return null
        }

        return {
          id: brand.id,
          label: brand.name,
          revenue: period.revenue,
          grossProfit:
            period.grossProfit,
          quantity: period.quantity,
          documents: period.documents,
          participation:
            calculateParticipation(
              period.revenue,
              totalRevenue,
            ),
        }
      })
      .filter(
        (
          item,
        ): item is SalesWorkspaceRankingItem =>
          item !== null &&
          item.revenue !== 0,
      ),
  )
}

function buildCustomerRanking(
  repository: BusinessRepository,
  periodId: string,
  totalRevenue: number,
): SalesWorkspaceRankingItem[] {
  return sortRanking(
    repository
      .getCustomers()
      .map((customer) => {
        const period =
          repository.customer.findPeriod(
            customer.id,
            periodId,
          )

        if (!period) {
          return null
        }

        return {
          id: customer.id,
          label:
            customer.name ||
            customer.id,
          revenue: period.revenue,
          grossProfit:
            period.grossProfit,
          quantity: period.quantity,
          documents: period.documents,
          participation:
            calculateParticipation(
              period.revenue,
              totalRevenue,
            ),
        }
      })
      .filter(
        (
          item,
        ): item is SalesWorkspaceRankingItem =>
          item !== null &&
          item.revenue !== 0,
      ),
  )
}

function buildProductRanking(
  repository: BusinessRepository,
  periodId: string,
  totalRevenue: number,
): SalesWorkspaceRankingItem[] {
  return sortRanking(
    repository
      .getProducts()
      .map((product) => {
        const period =
          repository.product.findPeriod(
            product.id,
            periodId,
          )

        if (!period) {
          return null
        }

        return {
          id: product.id,
          label:
            product.model ||
            product.sku ||
            product.id,
          revenue: period.revenue,
          grossProfit:
            period.grossProfit,
          quantity: period.quantity,
          documents: period.documents,
          participation:
            calculateParticipation(
              period.revenue,
              totalRevenue,
            ),
        }
      })
      .filter(
        (
          item,
        ): item is SalesWorkspaceRankingItem =>
          item !== null &&
          item.revenue !== 0,
      ),
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

function parseIsoDate(
  value: string,
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value,
    )

  if (!match) {
    return null
  }

  const date =
    new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
      ),
    )

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date
}

function countWeekdaysInclusive(
  startValue: string,
  endValue: string,
): number | null {
  const start =
    parseIsoDate(startValue)

  const end =
    parseIsoDate(endValue)

  if (
    !start ||
    !end ||
    start > end
  ) {
    return null
  }

  let weekdays = 0

  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(
      cursor.getUTCDate() + 1,
    )
  ) {
    const day =
      cursor.getUTCDay()

    if (
      day !== 0 &&
      day !== 6
    ) {
      weekdays += 1
    }
  }

  return weekdays
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
  repository: BusinessRepository,
  period: RevenuePeriodSummary,
  targets: BusinessBrandTarget[],
) {
  const targetedBrandIds =
    new Set(
      targets.map(
        (target) =>
          target.brandId,
      ),
    )

  const activeBrandIds =
    repository
      .getBrands()
      .filter((brand) =>
        Boolean(
          repository.brand.findPeriod(
            brand.id,
            period.id,
          ),
        ),
      )
      .map((brand) =>
        brand.id,
      )

  const coveredActiveBrands =
    activeBrandIds.filter(
      (brandId) =>
        targetedBrandIds.has(
          brandId,
        ),
    ).length

  const activeBrands =
    activeBrandIds.length

  return {
    targetedBrands:
      targetedBrandIds.size,
    activeBrands,
    coveredActiveBrands,
    activeBrandsWithoutTarget:
      Math.max(
        activeBrands -
          coveredActiveBrands,
        0,
      ),
    coveragePercentage:
      activeBrands > 0
        ? (
            coveredActiveBrands /
            activeBrands
          ) * 100
        : 0,
  }
}

function buildEmptyPerformance(
  period: RevenuePeriodSummary | null,
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
): SalesWorkspacePerformance {
  if (targets.length === 0) {
    return buildEmptyPerformance(
      period,
    )
  }

  const cutoff =
    resolvePeriodCutoff(
      repository,
      period,
    )

  const targetRevenue =
    sumNullable(
      targets.map(
        (target) =>
          target.targetRevenue,
      ),
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
    coverage:
      buildTargetCoverage(
        repository,
        period,
        targets,
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
    }
  }

  const periods =
    repository.revenue.getMonthly()

  const latestPeriod =
    periods.at(-1) ?? null

  const selectedPeriod =
    filters.periodId
      ? repository.revenue.findById(
          filters.periodId,
        ) ?? latestPeriod
      : latestPeriod

  if (!selectedPeriod) {
    return buildSalesWorkspace(
      null,
      filters,
    )
  }

  const previousPeriod =
    findComparisonPeriod(
      periods,
      selectedPeriod,
      filters,
    )

  const selectedIndex =
    periods.findIndex(
      (period) =>
        period.id ===
        selectedPeriod.id,
    )

  const trendStart =
    Math.max(
      0,
      selectedIndex - 11,
    )

  const reconciliation =
    repository.product
      .getReconciliationSummary()

  const periodTargets =
    repository.targets.findPeriodTargets(
      selectedPeriod.id,
    )

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
      selectedPeriod.id,
    selectedPeriodLabel:
      formatPeriodLabel(
        selectedPeriod.year,
        selectedPeriod.month,
      ),
    current:
      mapSnapshot(
        selectedPeriod,
      ),
    comparison:
      buildComparison(
        selectedPeriod,
        previousPeriod,
        filters,
      ),
    performance:
      buildPerformance(
        repository,
        selectedPeriod,
        periodTargets,
      ),
    brandPerformance:
      buildBrandPerformance(
        repository,
        selectedPeriod,
        periodTargets,
      ),
    trend:
      periods
        .slice(
          trendStart,
          selectedIndex + 1,
        )
        .map((period) => ({
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
        })),
    topBrands:
      buildBrandRanking(
        repository,
        selectedPeriod.id,
        selectedPeriod.revenue,
      ),
    topCustomers:
      buildCustomerRanking(
        repository,
        selectedPeriod.id,
        selectedPeriod.revenue,
      ),
    topProducts:
      buildProductRanking(
        repository,
        selectedPeriod.id,
        selectedPeriod.revenue,
      ),
    reconciliation: {
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
    },
  }
}
