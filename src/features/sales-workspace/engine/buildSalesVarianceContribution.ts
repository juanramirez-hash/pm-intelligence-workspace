import type {
  BusinessRepository,
  SalesSegmentationDimension,
  SalesSegmentationFilter,
  SalesSegmentationGroup,
} from '../../../core/business/repository'

import type {
  SalesContributionBreakdown,
  SalesContributionItem,
  SalesCustomerMovementItem,
  SalesCustomerMovementStatus,
  SalesVarianceContributionAnalysis,
  SalesVarianceMetric,
  SalesWorkspaceFilters,
} from '../types'

interface BuildSalesVarianceContributionInput {
  repository: BusinessRepository
  filters: SalesWorkspaceFilters
  currentPeriodId: string
  comparisonPeriodId: string | null
  comparisonLabel: string
  currentDateTo?: string
  comparisonDateTo?: string
}

interface InternalContributionBreakdown {
  summary: SalesContributionBreakdown
  items: SalesContributionItem[]
}

export function createEmptySalesVarianceContributionAnalysis(
  comparisonLabel: string,
  unavailableReason: string,
): SalesVarianceContributionAnalysis {
  const emptyBreakdown = (
    dimension: 'brand' | 'customer' | 'product',
  ): SalesContributionBreakdown => ({
    dimension,
    positiveContribution: 0,
    negativeContribution: 0,
    stableCount: 0,
    positive: [],
    negative: [],
  })

  return {
    available: false,
    unavailableReason,
    comparisonPeriodId: null,
    comparisonLabel,
    revenue: {
      current: 0,
      comparison: 0,
      absoluteVariation: 0,
      percentageVariation: 0,
    },
    grossProfit: {
      current: 0,
      comparison: 0,
      absoluteVariation: 0,
      percentageVariation: 0,
    },
    quantity: {
      current: 0,
      comparison: 0,
      absoluteVariation: 0,
      percentageVariation: 0,
    },
    documents: {
      current: 0,
      comparison: 0,
      absoluteVariation: 0,
      percentageVariation: 0,
    },
    grossMargin: {
      current: 0,
      comparison: 0,
      pointVariation: 0,
    },
    netRevenueVariation: 0,
    positiveRevenueContribution: 0,
    negativeRevenueContribution: 0,
    brands: emptyBreakdown('brand'),
    customers: emptyBreakdown('customer'),
    products: emptyBreakdown('product'),
    customerMovements: {
      newCount: 0,
      recoveredCount: 0,
      growingCount: 0,
      decliningCount: 0,
      lostCount: 0,
      stableCount: 0,
      newRevenue: 0,
      recoveredRevenue: 0,
      lostRevenue: 0,
      decliningRevenue: 0,
      items: [],
    },
  }
}

function calculatePercentageVariation(
  current: number,
  comparison: number,
): number | null {
  if (comparison === 0) {
    return current === 0
      ? 0
      : null
  }

  return (
    (current - comparison) /
    Math.abs(comparison)
  ) * 100
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

function buildMetric(
  current: number,
  comparison: number,
): SalesVarianceMetric {
  return {
    current,
    comparison,
    absoluteVariation:
      current - comparison,
    percentageVariation:
      calculatePercentageVariation(
        current,
        comparison,
      ),
  }
}

function buildSegmentationFilter(
  filters: SalesWorkspaceFilters,
  periodIds: readonly string[],
  dateTo?: string,
): SalesSegmentationFilter {
  return {
    periodIds,
    dateTo,
    brandIds: filters.brandIds,
    customerIds: filters.customerIds,
    productIds: filters.productIds,
    locationIds: filters.locationIds,
    salesRepresentativeIds:
      filters.salesRepresentativeIds,
    searchTerm:
      filters.searchTerm ?? null,
  }
}

function indexGroups(
  currentGroups: SalesSegmentationGroup[],
  comparisonGroups: SalesSegmentationGroup[],
): Record<
  string,
  {
    id: string
    label: string
    current: SalesSegmentationGroup | null
    comparison: SalesSegmentationGroup | null
  }
> {
  const index = Object.create(null) as Record<
    string,
    {
      id: string
      label: string
      current: SalesSegmentationGroup | null
      comparison: SalesSegmentationGroup | null
    }
  >

  for (const group of currentGroups) {
    index[group.id] = {
      id: group.id,
      label: group.label,
      current: group,
      comparison: null,
    }
  }

  for (const group of comparisonGroups) {
    const existing = index[group.id]

    if (existing) {
      existing.comparison = group
      continue
    }

    index[group.id] = {
      id: group.id,
      label: group.label,
      current: null,
      comparison: group,
    }
  }

  return index
}

function buildContributionBreakdown(
  dimension: Extract<
    SalesSegmentationDimension,
    'brand' | 'customer' | 'product'
  >,
  currentGroups: SalesSegmentationGroup[],
  comparisonGroups: SalesSegmentationGroup[],
  currentRevenue: number,
  comparisonRevenue: number,
): InternalContributionBreakdown {
  const indexed =
    indexGroups(
      currentGroups,
      comparisonGroups,
    )

  const preliminary =
    Object.values(indexed)
      .map((entry) => {
        const current =
          entry.current
        const comparison =
          entry.comparison

        const currentItemRevenue =
          current?.revenue ?? 0
        const comparisonItemRevenue =
          comparison?.revenue ?? 0
        const revenueVariation =
          currentItemRevenue -
          comparisonItemRevenue

        const currentParticipation =
          currentRevenue === 0
            ? 0
            : (
                currentItemRevenue /
                currentRevenue
              ) * 100

        const comparisonParticipation =
          comparisonRevenue === 0
            ? 0
            : (
                comparisonItemRevenue /
                comparisonRevenue
              ) * 100

        return {
          id: entry.id,
          label: entry.label,
          currentRevenue:
            currentItemRevenue,
          comparisonRevenue:
            comparisonItemRevenue,
          revenueVariation,
          revenueVariationPercentage:
            calculatePercentageVariation(
              currentItemRevenue,
              comparisonItemRevenue,
            ),
          currentGrossProfit:
            current?.grossProfit ?? 0,
          comparisonGrossProfit:
            comparison?.grossProfit ?? 0,
          grossProfitVariation:
            (current?.grossProfit ?? 0) -
            (comparison?.grossProfit ?? 0),
          currentQuantity:
            current?.quantity ?? 0,
          comparisonQuantity:
            comparison?.quantity ?? 0,
          quantityVariation:
            (current?.quantity ?? 0) -
            (comparison?.quantity ?? 0),
          currentDocuments:
            current?.documents ?? 0,
          comparisonDocuments:
            comparison?.documents ?? 0,
          documentsVariation:
            (current?.documents ?? 0) -
            (comparison?.documents ?? 0),
          currentParticipation,
          comparisonParticipation,
          mixVariationPoints:
            currentParticipation -
            comparisonParticipation,
          movementShare: 0,
          direction:
            revenueVariation > 0
              ? 'positive' as const
              : revenueVariation < 0
                ? 'negative' as const
                : 'stable' as const,
        }
      })

  const totalAbsoluteMovement =
    preliminary.reduce(
      (total, item) =>
        total +
        Math.abs(
          item.revenueVariation,
        ),
      0,
    )

  const items: SalesContributionItem[] =
    preliminary.map((item) => ({
      ...item,
      movementShare:
        totalAbsoluteMovement === 0
          ? 0
          : (
              Math.abs(
                item.revenueVariation,
              ) /
              totalAbsoluteMovement
            ) * 100,
    }))

  const positiveItems =
    items
      .filter(
        (item) =>
          item.direction === 'positive',
      )
      .sort(
        (left, right) =>
          right.revenueVariation -
            left.revenueVariation ||
          left.label.localeCompare(
            right.label,
            'es-MX',
          ),
      )

  const negativeItems =
    items
      .filter(
        (item) =>
          item.direction === 'negative',
      )
      .sort(
        (left, right) =>
          left.revenueVariation -
            right.revenueVariation ||
          left.label.localeCompare(
            right.label,
            'es-MX',
          ),
      )

  return {
    summary: {
      dimension,
      positiveContribution:
        positiveItems.reduce(
          (total, item) =>
            total +
            item.revenueVariation,
          0,
        ),
      negativeContribution:
        Math.abs(
          negativeItems.reduce(
            (total, item) =>
              total +
              item.revenueVariation,
            0,
          ),
        ),
      stableCount:
        items.filter(
          (item) =>
            item.direction === 'stable',
        ).length,
      positive:
        positiveItems.slice(0, 8),
      negative:
        negativeItems.slice(0, 8),
    },
    items,
  }
}

function classifyCustomerMovement(
  currentRevenue: number,
  comparisonRevenue: number,
  historicalRevenue: number,
): SalesCustomerMovementStatus {
  if (
    currentRevenue > 0 &&
    comparisonRevenue === 0
  ) {
    return historicalRevenue > 0
      ? 'recovered'
      : 'new'
  }

  if (
    currentRevenue === 0 &&
    comparisonRevenue > 0
  ) {
    return 'lost'
  }

  if (currentRevenue > comparisonRevenue) {
    return 'growing'
  }

  if (currentRevenue < comparisonRevenue) {
    return 'declining'
  }

  return 'stable'
}

function buildCustomerMovements(
  items: SalesContributionItem[],
  historicalGroups: SalesSegmentationGroup[],
) {
  const historicalIndex =
    Object.create(null) as Record<
      string,
      number
    >

  for (const group of historicalGroups) {
    historicalIndex[group.id] =
      group.revenue
  }

  const movementItems:
    SalesCustomerMovementItem[] =
    items
      .map((item) => {
        const historicalRevenue =
          historicalIndex[item.id] ?? 0

        return {
          id: item.id,
          label: item.label,
          status:
            classifyCustomerMovement(
              item.currentRevenue,
              item.comparisonRevenue,
              historicalRevenue,
            ),
          currentRevenue:
            item.currentRevenue,
          comparisonRevenue:
            item.comparisonRevenue,
          historicalRevenue,
          revenueVariation:
            item.revenueVariation,
          revenueVariationPercentage:
            item.revenueVariationPercentage,
        }
      })
      .sort(
        (left, right) =>
          Math.abs(
            right.revenueVariation,
          ) -
            Math.abs(
              left.revenueVariation,
            ) ||
          left.label.localeCompare(
            right.label,
            'es-MX',
          ),
      )

  const count = (
    status: SalesCustomerMovementStatus,
  ) =>
    movementItems.filter(
      (item) =>
        item.status === status,
    ).length

  const sumCurrent = (
    statuses: SalesCustomerMovementStatus[],
  ) =>
    movementItems
      .filter((item) =>
        statuses.includes(item.status),
      )
      .reduce(
        (total, item) =>
          total + item.currentRevenue,
        0,
      )

  const sumComparison = (
    statuses: SalesCustomerMovementStatus[],
  ) =>
    movementItems
      .filter((item) =>
        statuses.includes(item.status),
      )
      .reduce(
        (total, item) =>
          total +
          item.comparisonRevenue,
        0,
      )

  return {
    newCount: count('new'),
    recoveredCount: count('recovered'),
    growingCount: count('growing'),
    decliningCount: count('declining'),
    lostCount: count('lost'),
    stableCount: count('stable'),
    newRevenue:
      sumCurrent(['new']),
    recoveredRevenue:
      sumCurrent(['recovered']),
    lostRevenue:
      sumComparison(['lost']),
    decliningRevenue:
      sumComparison(['declining']) -
      sumCurrent(['declining']),
    items:
      movementItems.slice(0, 12),
  }
}

export function buildSalesVarianceContributionAnalysis({
  repository,
  filters,
  currentPeriodId,
  comparisonPeriodId,
  comparisonLabel,
  currentDateTo,
  comparisonDateTo,
}: BuildSalesVarianceContributionInput): SalesVarianceContributionAnalysis {
  if (!comparisonPeriodId) {
    return createEmptySalesVarianceContributionAnalysis(
      comparisonLabel,
      'No existe un periodo comparable para explicar la variación del segmento seleccionado.',
    )
  }

  const currentFilter =
    buildSegmentationFilter(
      filters,
      [currentPeriodId],
      currentDateTo,
    )

  const comparisonFilter =
    buildSegmentationFilter(
      filters,
      [comparisonPeriodId],
      comparisonDateTo,
    )

  const currentSummary =
    repository.salesSegmentation.summarize(
      currentFilter,
    )

  const comparisonSummary =
    repository.salesSegmentation.summarize(
      comparisonFilter,
    )

  const buildDimension = (
    dimension: Extract<
      SalesSegmentationDimension,
      'brand' | 'customer' | 'product'
    >,
  ) =>
    buildContributionBreakdown(
      dimension,
      repository.salesSegmentation.groupBy(
        dimension,
        currentFilter,
      ),
      repository.salesSegmentation.groupBy(
        dimension,
        comparisonFilter,
      ),
      currentSummary.revenue,
      comparisonSummary.revenue,
    )

  const brands = buildDimension('brand')
  const customers = buildDimension('customer')
  const products = buildDimension('product')

  const historicalPeriodIds =
    repository.revenue
      .getMonthly()
      .filter(
        (period) =>
          period.id < comparisonPeriodId,
      )
      .map((period) => period.id)

  const historicalCustomerGroups =
    historicalPeriodIds.length === 0
      ? []
      : repository.salesSegmentation.groupBy(
          'customer',
          buildSegmentationFilter(
            filters,
            historicalPeriodIds,
          ),
        )

  const currentGrossMargin =
    calculateGrossMargin(
      currentSummary.revenue,
      currentSummary.grossProfit,
    )

  const comparisonGrossMargin =
    calculateGrossMargin(
      comparisonSummary.revenue,
      comparisonSummary.grossProfit,
    )

  return {
    available: true,
    unavailableReason: null,
    comparisonPeriodId,
    comparisonLabel,
    revenue:
      buildMetric(
        currentSummary.revenue,
        comparisonSummary.revenue,
      ),
    grossProfit:
      buildMetric(
        currentSummary.grossProfit,
        comparisonSummary.grossProfit,
      ),
    quantity:
      buildMetric(
        currentSummary.quantity,
        comparisonSummary.quantity,
      ),
    documents:
      buildMetric(
        currentSummary.documents,
        comparisonSummary.documents,
      ),
    grossMargin: {
      current: currentGrossMargin,
      comparison: comparisonGrossMargin,
      pointVariation:
        currentGrossMargin -
        comparisonGrossMargin,
    },
    netRevenueVariation:
      currentSummary.revenue -
      comparisonSummary.revenue,
    positiveRevenueContribution:
      brands.summary.positiveContribution,
    negativeRevenueContribution:
      brands.summary.negativeContribution,
    brands: brands.summary,
    customers: customers.summary,
    products: products.summary,
    customerMovements:
      buildCustomerMovements(
        customers.items,
        historicalCustomerGroups,
      ),
  }
}