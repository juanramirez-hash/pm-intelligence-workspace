import type {
  BusinessRepository,
  RevenuePeriodSummary,
} from '../repository'

export interface RevenueComparisonMetric {
  currentValue: number | null
  previousValue: number | null
  variationPercentage: number | null
}

export interface RevenueMetrics {
  totalRevenue: number

  averageCustomerRevenue: number

  top10Revenue: number

  top10Participation: number

  hasData: boolean

  latestPeriodKey: string | null

  latestPeriodLabel: string | null

  currentMonthSales: number | null

  monthComparison:
    RevenueComparisonMetric

  quarterComparison:
    RevenueComparisonMetric

  yearComparison:
    RevenueComparisonMetric

  previousMonthLabel: string | null

  currentQuarterLabel: string | null

  previousQuarterLabel: string | null

  quarterComparisonDetail: string | null

  previousYear: number | null
}

interface YearMonth {
  year: number
  month: number
}

interface QuarterComparisonResult {
  metric:
    RevenueComparisonMetric

  currentQuarterLabel: string

  previousQuarterLabel: string

  detail: string
}

const monthFormatter =
  new Intl.DateTimeFormat(
    'es-MX',
    {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  )

function createEmptyComparison():
RevenueComparisonMetric {
  return {
    currentValue: null,
    previousValue: null,
    variationPercentage: null,
  }
}

function formatMonthLabel(
  year: number,
  month: number,
): string {
  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
      ),
    )

  const label =
    monthFormatter.format(
      date,
    )

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  )
}

function getPreviousMonth(
  year: number,
  month: number,
): YearMonth {
  if (month === 1) {
    return {
      year: year - 1,
      month: 12,
    }
  }

  return {
    year,
    month: month - 1,
  }
}

function getQuarterNumber(
  month: number,
): number {
  return Math.ceil(
    month / 3,
  )
}

function getQuarterStartMonth(
  quarter: number,
): number {
  return (
    (quarter - 1) * 3 + 1
  )
}

function getPreviousQuarter(
  year: number,
  quarter: number,
): {
  year: number
  quarter: number
} {
  if (quarter === 1) {
    return {
      year: year - 1,
      quarter: 4,
    }
  }

  return {
    year,
    quarter: quarter - 1,
  }
}

function getQuarterLabel(
  year: number,
  quarter: number,
): string {
  return `T${quarter} ${year}`
}

function getMonthRevenue(
  periods:
    RevenuePeriodSummary[],
  year: number,
  month: number,
): number | null {
  const period =
    periods.find(
      item =>
        item.year === year &&
        item.month === month,
    )

  return (
    period?.revenue ??
    null
  )
}

function calculateVariation(
  currentValue: number | null,
  previousValue: number | null,
): number | null {
  if (
    currentValue === null ||
    previousValue === null ||
    previousValue === 0
  ) {
    return null
  }

  return (
    (
      (
        currentValue -
        previousValue
      ) /
      Math.abs(
        previousValue,
      )
    ) *
    100
  )
}

function createComparison(
  currentValue: number | null,
  previousValue: number | null,
): RevenueComparisonMetric {
  return {
    currentValue,
    previousValue,
    variationPercentage:
      calculateVariation(
        currentValue,
        previousValue,
      ),
  }
}

function sumMonths(
  periods:
    RevenuePeriodSummary[],
  year: number,
  months: number[],
): number | null {
  const values =
    months.map(
      month =>
        getMonthRevenue(
          periods,
          year,
          month,
        ),
    )

  if (
    values.some(
      value =>
        value === null,
    )
  ) {
    return null
  }

  return values.reduce<number>(
    (
      total,
      value,
    ) =>
      total +
      (value ?? 0),
    0,
  )
}

function buildQuarterComparison(
  periods:
    RevenuePeriodSummary[],
  latestYear: number,
  latestMonth: number,
): QuarterComparisonResult {
  const currentQuarter =
    getQuarterNumber(
      latestMonth,
    )

  const currentQuarterStart =
    getQuarterStartMonth(
      currentQuarter,
    )

  const elapsedMonths =
    latestMonth -
    currentQuarterStart +
    1

  const currentMonths =
    Array.from(
      {
        length:
          elapsedMonths,
      },
      (
        _,
        index,
      ) =>
        currentQuarterStart +
        index,
    )

  const previousQuarter =
    getPreviousQuarter(
      latestYear,
      currentQuarter,
    )

  const previousQuarterStart =
    getQuarterStartMonth(
      previousQuarter.quarter,
    )

  const previousMonths =
    Array.from(
      {
        length:
          elapsedMonths,
      },
      (
        _,
        index,
      ) =>
        previousQuarterStart +
        index,
    )

  const currentValue =
    sumMonths(
      periods,
      latestYear,
      currentMonths,
    )

  const previousValue =
    sumMonths(
      periods,
      previousQuarter.year,
      previousMonths,
    )

  const currentMonthNames =
    currentMonths.map(
      month =>
        formatMonthLabel(
          latestYear,
          month,
        ),
    )

  const previousMonthNames =
    previousMonths.map(
      month =>
        formatMonthLabel(
          previousQuarter.year,
          month,
        ),
    )

  return {
    metric:
      createComparison(
        currentValue,
        previousValue,
      ),

    currentQuarterLabel:
      getQuarterLabel(
        latestYear,
        currentQuarter,
      ),

    previousQuarterLabel:
      getQuarterLabel(
        previousQuarter.year,
        previousQuarter.quarter,
      ),

    detail:
      `${currentMonthNames.join(' + ')} contra ` +
      `${previousMonthNames.join(' + ')}.`,
  }
}

export function buildRevenueMetrics(
  repository: BusinessRepository,
): RevenueMetrics {
  const totals =
    repository.getTotals()

  const customers =
    repository.getCustomers()

  const top10 =
    repository.customer
      .topByRevenue(10)

  const top10Revenue =
    top10.reduce(
      (
        total,
        customer,
      ) =>
        total +
        customer.revenue,
      0,
    )

  const baseMetrics = {
    totalRevenue:
      totals.revenue,

    averageCustomerRevenue:
      customers.length > 0
        ? totals.revenue /
          customers.length
        : 0,

    top10Revenue,

    top10Participation:
      totals.revenue > 0
        ? top10Revenue /
          totals.revenue
        : 0,
  }

  const monthlyRevenue =
    repository.revenue
      .getMonthly()

  if (
    monthlyRevenue.length === 0
  ) {
    return {
      ...baseMetrics,

      hasData: false,

      latestPeriodKey: null,

      latestPeriodLabel: null,

      currentMonthSales: null,

      monthComparison:
        createEmptyComparison(),

      quarterComparison:
        createEmptyComparison(),

      yearComparison:
        createEmptyComparison(),

      previousMonthLabel: null,

      currentQuarterLabel: null,

      previousQuarterLabel: null,

      quarterComparisonDetail: null,

      previousYear: null,
    }
  }

  const latestPeriod =
    monthlyRevenue[
      monthlyRevenue.length - 1
    ]

  const previousMonth =
    getPreviousMonth(
      latestPeriod.year,
      latestPeriod.month,
    )

  const previousMonthRevenue =
    getMonthRevenue(
      monthlyRevenue,
      previousMonth.year,
      previousMonth.month,
    )

  const previousYearRevenue =
    getMonthRevenue(
      monthlyRevenue,
      latestPeriod.year - 1,
      latestPeriod.month,
    )

  const quarterComparison =
    buildQuarterComparison(
      monthlyRevenue,
      latestPeriod.year,
      latestPeriod.month,
    )

  return {
    ...baseMetrics,

    hasData: true,

    latestPeriodKey:
      latestPeriod.id,

    latestPeriodLabel:
      formatMonthLabel(
        latestPeriod.year,
        latestPeriod.month,
      ),

    currentMonthSales:
      latestPeriod.revenue,

    monthComparison:
      createComparison(
        latestPeriod.revenue,
        previousMonthRevenue,
      ),

    quarterComparison:
      quarterComparison.metric,

    yearComparison:
      createComparison(
        latestPeriod.revenue,
        previousYearRevenue,
      ),

    previousMonthLabel:
      formatMonthLabel(
        previousMonth.year,
        previousMonth.month,
      ),

    currentQuarterLabel:
      quarterComparison
        .currentQuarterLabel,

    previousQuarterLabel:
      quarterComparison
        .previousQuarterLabel,

    quarterComparisonDetail:
      quarterComparison.detail,

    previousYear:
      latestPeriod.year - 1,
  }
}