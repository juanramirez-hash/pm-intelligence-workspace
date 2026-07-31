import type {
  ForecastMetricValues,
} from './forecastProjectionContracts'

const METRIC_KEYS = [
  'revenue',
  'grossProfit',
  'quantity',
] as const

export function roundForecastValue(
  value: number,
): number {
  return Math.round(value * 100) / 100
}

export function roundForecastRatio(
  value: number,
): number {
  return Math.round(value * 10_000) / 10_000
}

export function clampForecastValue(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function averageMetricValues(
  values: readonly ForecastMetricValues[],
): ForecastMetricValues | null {
  if (values.length === 0) {
    return null
  }

  const totals = values.reduce<ForecastMetricValues>(
    (result, value) => ({
      revenue: result.revenue + value.revenue,
      grossProfit: result.grossProfit + value.grossProfit,
      quantity: result.quantity + value.quantity,
    }),
    {
      revenue: 0,
      grossProfit: 0,
      quantity: 0,
    },
  )

  return {
    revenue: roundForecastValue(totals.revenue / values.length),
    grossProfit: roundForecastValue(totals.grossProfit / values.length),
    quantity: roundForecastValue(totals.quantity / values.length),
  }
}

function linearProjection(
  values: readonly number[],
): number | null {
  if (values.length < 2) {
    return null
  }

  const xAverage = (values.length - 1) / 2
  const yAverage = values.reduce(
    (total, value) => total + value,
    0,
  ) / values.length

  let numerator = 0
  let denominator = 0

  values.forEach((value, index) => {
    const xDelta = index - xAverage
    numerator += xDelta * (value - yAverage)
    denominator += xDelta ** 2
  })

  if (denominator === 0) {
    return roundForecastValue(values.at(-1) ?? 0)
  }

  const slope = numerator / denominator
  const intercept = yAverage - slope * xAverage
  const projection = intercept + slope * values.length

  return roundForecastValue(Math.max(0, projection))
}

export function projectMetricTrend(
  values: readonly ForecastMetricValues[],
): ForecastMetricValues | null {
  if (values.length < 2) {
    return null
  }

  const result = {} as ForecastMetricValues

  for (const key of METRIC_KEYS) {
    const projection = linearProjection(
      values.map((value) => value[key]),
    )

    if (projection === null) {
      return null
    }

    result[key] = projection
  }

  return result
}

export function calculateTrendRate(
  latestValue: number | null,
  projectedValue: number | null,
  referenceValue: number | null,
): number | null {
  if (
    latestValue === null ||
    projectedValue === null
  ) {
    return null
  }

  const denominator = Math.max(
    Math.abs(latestValue),
    Math.abs(referenceValue ?? 0),
  )

  if (denominator === 0) {
    return projectedValue === 0
      ? 0
      : null
  }

  return roundForecastRatio(
    (projectedValue - latestValue) / denominator,
  )
}

export function coefficientOfVariation(
  values: readonly number[],
): number | null {
  if (values.length < 2) {
    return null
  }

  const average = values.reduce(
    (total, value) => total + value,
    0,
  ) / values.length

  if (average === 0) {
    return values.every((value) => value === 0)
      ? 0
      : null
  }

  const variance = values.reduce(
    (total, value) => total + (value - average) ** 2,
    0,
  ) / values.length

  return roundForecastRatio(
    Math.sqrt(variance) / Math.abs(average),
  )
}

export function multiplyMetricValues(
  values: ForecastMetricValues,
  factor: number,
): ForecastMetricValues {
  return {
    revenue: roundForecastValue(values.revenue * factor),
    grossProfit: roundForecastValue(values.grossProfit * factor),
    quantity: roundForecastValue(values.quantity * factor),
  }
}

export function floorAtActual(
  values: ForecastMetricValues,
  actual: ForecastMetricValues,
): ForecastMetricValues {
  return {
    revenue: roundForecastValue(
      Math.max(actual.revenue, values.revenue),
    ),
    grossProfit: roundForecastValue(
      Math.max(actual.grossProfit, values.grossProfit),
    ),
    quantity: roundForecastValue(
      Math.max(actual.quantity, values.quantity),
    ),
  }
}

export function grossMarginFromValues(
  values: ForecastMetricValues,
): number | null {
  if (values.revenue === 0) {
    return null
  }

  return roundForecastRatio(
    values.grossProfit / values.revenue,
  )
}
