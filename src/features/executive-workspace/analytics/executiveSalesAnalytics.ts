import type { NormalizedSalesRow } from '../../data-center/importers/sales/salesTypes'

export interface SalesComparisonMetric {
  currentValue: number | null
  previousValue: number | null
  variationPercentage: number | null
}

export interface ExecutiveSalesAnalytics {
  hasData: boolean

  latestPeriodKey: string | null
  latestPeriodLabel: string | null

  currentMonthSales: number | null

  monthComparison: SalesComparisonMetric
  quarterComparison: SalesComparisonMetric
  yearComparison: SalesComparisonMetric

  previousMonthLabel: string | null

  currentQuarterLabel: string | null
  previousQuarterLabel: string | null
  quarterComparisonDetail: string | null

  previousYear: number | null
}

interface MonthlySalesAggregate {
  key: string
  year: number
  month: number
  totalSales: number
}

interface YearMonth {
  year: number
  month: number
}

const monthFormatter = new Intl.DateTimeFormat(
  'es-MX',
  {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  },
)

function createEmptyComparison(): SalesComparisonMetric {
  return {
    currentValue: null,
    previousValue: null,
    variationPercentage: null,
  }
}

function createEmptyAnalytics(): ExecutiveSalesAnalytics {
  return {
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

function normalizeDate(
  value: string,
): Date | null {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function getMonthKey(
  year: number,
  month: number,
): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatMonthLabel(
  year: number,
  month: number,
): string {
  const date = new Date(
    Date.UTC(year, month - 1, 1),
  )

  const label = monthFormatter.format(date)

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
  return Math.ceil(month / 3)
}

function getQuarterStartMonth(
  quarter: number,
): number {
  return (quarter - 1) * 3 + 1
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

function buildMonthlySales(
  rows: NormalizedSalesRow[],
): MonthlySalesAggregate[] {
  const aggregates = new Map<
    string,
    MonthlySalesAggregate
  >()

  for (const row of rows) {
    const date = normalizeDate(row.date)

    if (!date) {
      continue
    }

    const year = date.getUTCFullYear()
    const month =
      date.getUTCMonth() + 1

    const key = getMonthKey(
      year,
      month,
    )

    const existing =
      aggregates.get(key)

    if (existing) {
      existing.totalSales += row.revenue
      continue
    }

    aggregates.set(key, {
      key,
      year,
      month,
      totalSales: row.revenue,
    })
  }

  return [...aggregates.values()].sort(
    (firstPeriod, secondPeriod) =>
      firstPeriod.key.localeCompare(
        secondPeriod.key,
      ),
  )
}

function getMonthSales(
  monthlySales: MonthlySalesAggregate[],
  year: number,
  month: number,
): number | null {
  const key = getMonthKey(
    year,
    month,
  )

  const period = monthlySales.find(
    (item) => item.key === key,
  )

  return period?.totalSales ?? null
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
    ((currentValue - previousValue) /
      Math.abs(previousValue)) *
    100
  )
}

function createComparison(
  currentValue: number | null,
  previousValue: number | null,
): SalesComparisonMetric {
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
  monthlySales: MonthlySalesAggregate[],
  year: number,
  months: number[],
): number | null {
  const values = months.map(
    (month) =>
      getMonthSales(
        monthlySales,
        year,
        month,
      ),
  )

  if (
    values.some(
      (value) => value === null,
    )
  ) {
    return null
  }

  return values.reduce<number>(
    (total, value) =>
      total + (value ?? 0),
    0,
  )
}

/**
 * Compara el trimestre disponible contra el mismo número
 * de meses del trimestre anterior.
 *
 * Ejemplo:
 * - Último periodo: mayo 2026
 * - Periodo actual: abril + mayo
 * - Periodo anterior: enero + febrero
 *
 * Esto evita comparar un trimestre parcial contra uno completo.
 */
function buildQuarterComparison(
  monthlySales: MonthlySalesAggregate[],
  latestYear: number,
  latestMonth: number,
): {
  metric: SalesComparisonMetric
  currentQuarterLabel: string
  previousQuarterLabel: string
  detail: string
} {
  const currentQuarter =
    getQuarterNumber(latestMonth)

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
        length: elapsedMonths,
      },
      (_, index) =>
        currentQuarterStart + index,
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
        length: elapsedMonths,
      },
      (_, index) =>
        previousQuarterStart + index,
    )

  const currentValue = sumMonths(
    monthlySales,
    latestYear,
    currentMonths,
  )

  const previousValue = sumMonths(
    monthlySales,
    previousQuarter.year,
    previousMonths,
  )

  const currentMonthNames =
    currentMonths.map((month) =>
      formatMonthLabel(
        latestYear,
        month,
      ),
    )

  const previousMonthNames =
    previousMonths.map((month) =>
      formatMonthLabel(
        previousQuarter.year,
        month,
      ),
    )

  return {
    metric: createComparison(
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

export function calculateExecutiveSalesAnalytics(
  rows: NormalizedSalesRow[],
): ExecutiveSalesAnalytics {
  if (rows.length === 0) {
    return createEmptyAnalytics()
  }

  const monthlySales =
    buildMonthlySales(rows)

  if (monthlySales.length === 0) {
    return createEmptyAnalytics()
  }

  const latestPeriod =
    monthlySales[
      monthlySales.length - 1
    ]

  const previousMonth =
    getPreviousMonth(
      latestPeriod.year,
      latestPeriod.month,
    )

  const previousMonthSales =
    getMonthSales(
      monthlySales,
      previousMonth.year,
      previousMonth.month,
    )

  const previousYearSales =
    getMonthSales(
      monthlySales,
      latestPeriod.year - 1,
      latestPeriod.month,
    )

  const quarterComparison =
    buildQuarterComparison(
      monthlySales,
      latestPeriod.year,
      latestPeriod.month,
    )

  return {
    hasData: true,

    latestPeriodKey:
      latestPeriod.key,

    latestPeriodLabel:
      formatMonthLabel(
        latestPeriod.year,
        latestPeriod.month,
      ),

    currentMonthSales:
      latestPeriod.totalSales,

    monthComparison:
      createComparison(
        latestPeriod.totalSales,
        previousMonthSales,
      ),

    quarterComparison:
      quarterComparison.metric,

    yearComparison:
      createComparison(
        latestPeriod.totalSales,
        previousYearSales,
      ),

    previousMonthLabel:
      formatMonthLabel(
        previousMonth.year,
        previousMonth.month,
      ),

    currentQuarterLabel:
      quarterComparison.currentQuarterLabel,

    previousQuarterLabel:
      quarterComparison.previousQuarterLabel,

    quarterComparisonDetail:
      quarterComparison.detail,

    previousYear:
      latestPeriod.year - 1,
  }
}