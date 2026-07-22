import type {
  BusinessDataModel,
  BusinessPeriod,
} from '../models'

export interface RevenuePeriodSummary {
  id: string

  year: number
  month: number

  periodStart: string
  periodEnd: string

  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  customerCount: number
  brandCount: number
  productCount: number
}

function comparePeriods(
  first: RevenuePeriodSummary,
  second: RevenuePeriodSummary,
): number {
  if (first.year !== second.year) {
    return first.year - second.year
  }

  return first.month - second.month
}

function mapPeriod(
  period: BusinessPeriod,
): RevenuePeriodSummary {
  return {
    id: period.id,

    year: period.year,
    month: period.month,

    periodStart:
      period.periodStart,

    periodEnd:
      period.periodEnd,

    revenue:
      period.revenue,

    grossProfit:
      period.grossProfit,

    quantity:
      period.quantity,

    documents:
      period.documents,

    customerCount:
      period.customers.size,

    brandCount:
      period.brands.size,

    productCount:
      period.products.size,
  }
}

export class RevenueQueries {
  private readonly model:
    BusinessDataModel

  constructor(
    model: BusinessDataModel,
  ) {
    this.model = model
  }

  getMonthly():
    RevenuePeriodSummary[] {
    return [
      ...this.model.periods.values(),
    ]
      .map(mapPeriod)
      .sort(comparePeriods)
  }

  getByYear(
    year: number,
  ): RevenuePeriodSummary[] {
    if (
      !Number.isInteger(year) ||
      year < 0
    ) {
      return []
    }

    return this
      .getMonthly()
      .filter(
        period =>
          period.year === year,
      )
  }

  getLastMonths(
    limit: number,
  ): RevenuePeriodSummary[] {
    if (
      !Number.isFinite(limit) ||
      limit <= 0
    ) {
      return []
    }

    const normalizedLimit =
      Math.floor(limit)

    const periods =
      this.getMonthly()

    return periods.slice(
      Math.max(
        periods.length -
          normalizedLimit,
        0,
      ),
    )
  }

  findById(
    id: string,
  ): RevenuePeriodSummary | undefined {
    const normalizedId =
      id.trim()

    if (!normalizedId) {
      return undefined
    }

    const period =
      this.model.periods.get(
        normalizedId,
      )

    if (!period) {
      return undefined
    }

    return mapPeriod(period)
  }

  findByYearAndMonth(
    year: number,
    month: number,
  ): RevenuePeriodSummary | undefined {
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return undefined
    }

    return this
      .getMonthly()
      .find(
        period =>
          period.year === year &&
          period.month === month,
      )
  }
}