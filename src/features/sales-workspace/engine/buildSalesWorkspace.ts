import type {
  BusinessRepository,
  RevenuePeriodSummary,
} from '../../../core/business/repository'

import type {
  SalesWorkspaceComparison,
  SalesWorkspaceFilters,
  SalesWorkspaceRankingItem,
  SalesWorkspaceSnapshot,
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
