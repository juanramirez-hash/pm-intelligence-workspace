import type {
  RevenuePeriodSummary,
} from '../repository'

export interface RevenueComparisonMetric {
  currentValue: number | null
  previousValue: number | null
  variationPercentage: number | null
}

export interface QuarterComparisonResult {
  metric: RevenueComparisonMetric

  currentQuarterLabel: string

  previousQuarterLabel: string

  detail: string
}

interface YearMonth {
  year: number
  month: number
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

export function createEmptyComparison():
RevenueComparisonMetric {
  return {
    currentValue: null,
    previousValue: null,
    variationPercentage: null,
  }
}

export function formatMonthLabel(
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

export function getPreviousMonth(
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
) {
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
) {
  return `T${quarter} ${year}`
}

export function calculateVariation(
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
      currentValue -
      previousValue
    ) /
    Math.abs(previousValue)
  ) * 100
}

export function createComparison(
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

function getRevenue(
  periods: RevenuePeriodSummary[],
  year: number,
  month: number,
): number | null {
  const found =
    periods.find(
      p =>
        p.year === year &&
        p.month === month,
    )

  return found?.revenue ?? null
}

function sumMonths(
  periods: RevenuePeriodSummary[],
  year: number,
  months: number[],
): number | null {
  const values =
    months.map(
      month =>
        getRevenue(
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

export function buildQuarterComparison(
  periods: RevenuePeriodSummary[],
  latestYear: number,
  latestMonth: number,
): QuarterComparisonResult {

  const currentQuarter =
    getQuarterNumber(
      latestMonth,
    )

  const start =
    getQuarterStartMonth(
      currentQuarter,
    )

  const elapsed =
    latestMonth -
    start +
    1

  const currentMonths =
    Array.from(
      {
        length: elapsed,
      },
      (_, i) => start + i,
    )

  const previous =
    getPreviousQuarter(
      latestYear,
      currentQuarter,
    )

  const previousStart =
    getQuarterStartMonth(
      previous.quarter,
    )

  const previousMonths =
    Array.from(
      {
        length: elapsed,
      },
      (_, i) =>
        previousStart + i,
    )

  return {

    metric:
      createComparison(

        sumMonths(
          periods,
          latestYear,
          currentMonths,
        ),

        sumMonths(
          periods,
          previous.year,
          previousMonths,
        ),
      ),

    currentQuarterLabel:
      getQuarterLabel(
        latestYear,
        currentQuarter,
      ),

    previousQuarterLabel:
      getQuarterLabel(
        previous.year,
        previous.quarter,
      ),

    detail:
      `${currentMonths
        .map(
          month =>
            formatMonthLabel(
              latestYear,
              month,
            ),
        )
        .join(' + ')} contra ${previousMonths
        .map(
          month =>
            formatMonthLabel(
              previous.year,
              month,
            ),
        )
        .join(' + ')}.`,
  }
}