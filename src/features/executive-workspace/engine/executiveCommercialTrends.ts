import type {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  ExecutiveCommercialTrends,
  ExecutiveCustomerConcentrationItem,
  ExecutiveRevenueTrendPoint,
} from '../types/executiveWorkspaceTypes'

const DEFAULT_MONTH_LIMIT = 12
const DEFAULT_CUSTOMER_LIMIT = 10

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

export interface BuildExecutiveCommercialTrendsOptions {
  monthLimit?: number

  customerLimit?: number
}

export function buildExecutiveCommercialTrends(
  repository: BusinessRepository | null,
  options: BuildExecutiveCommercialTrendsOptions = {},
): ExecutiveCommercialTrends {
  if (!repository) {
    return {
      monthlyRevenue: [],
      topCustomers: [],
      totalCustomerRevenue: 0,
      periodCount: 0,
    }
  }

  const monthLimit =
    normalizeLimit(
      options.monthLimit,
      DEFAULT_MONTH_LIMIT,
    )

  const customerLimit =
    normalizeLimit(
      options.customerLimit,
      DEFAULT_CUSTOMER_LIMIT,
    )

  const monthlyRevenue:
    ExecutiveRevenueTrendPoint[] =
    repository.revenue
      .getLastMonths(monthLimit)
      .map(
        (period) => ({
          periodId: period.id,
          year: period.year,
          month: period.month,
          revenue: period.revenue,
          grossProfit: period.grossProfit,
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

  const customers =
    repository.customer.getAll()

  const totalCustomerRevenue =
    customers.reduce(
      (total, customer) =>
        total + customer.revenue,
      0,
    )

  const topCustomers:
    ExecutiveCustomerConcentrationItem[] =
    repository.customer
      .topByRevenue(customerLimit)
      .map(
        (customer) => ({
          customerId: customer.id,
          customerName:
            customer.name || customer.id,
          revenue: customer.revenue,
          grossProfit:
            customer.grossProfit,
          grossMargin:
            calculateGrossMargin(
              customer.revenue,
              customer.grossProfit,
            ),
          documents: customer.documents,
          activePeriods:
            customer.activePeriods.size,
          revenueShare:
            totalCustomerRevenue > 0
              ? customer.revenue /
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
