import type {
  BusinessBrandSnapshot,
} from '../snapshots'

import type {
  BusinessHealthComponent,
  BusinessHealthComponentStatus,
} from './healthScore'

import type {
  BusinessHealthBenchmarks,
} from './healthScoreOptions'

import type {
  BusinessHealthComponentId,
  BusinessHealthWeights,
} from './healthWeights'

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function ratioToScore(
  numerator: number | null,
  denominator: number | null,
): number | null {
  if (
    numerator === null ||
    denominator === null ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return null
  }

  return clampScore(
    (numerator / denominator) * 100,
  )
}

function directRatioToScore(
  ratio: number | null,
): number | null {
  if (
    ratio === null ||
    !Number.isFinite(ratio) ||
    ratio < 0
  ) {
    return null
  }

  return clampScore(ratio * 100)
}

function classifyComponent(
  score: number | null,
): BusinessHealthComponentStatus {
  if (score === null) {
    return 'not-evaluable'
  }

  if (score >= 90) {
    return 'strong'
  }

  if (score >= 70) {
    return 'stable'
  }

  if (score >= 50) {
    return 'attention'
  }

  return 'risk'
}

function buildComponent(
  id: BusinessHealthComponentId,
  rawValue: number | null,
  benchmark: number | null,
  score: number | null,
  weight: number,
): BusinessHealthComponent {
  return {
    id,
    rawValue,
    benchmark,
    normalizedScore: score,
    weight,
    weightedImpact:
      score === null
        ? null
        : (score * weight) / 100,
    status: classifyComponent(score),
  }
}

export function buildBusinessHealthComponents(
  snapshot: BusinessBrandSnapshot,
  weights: BusinessHealthWeights,
  benchmarks: BusinessHealthBenchmarks = {},
): readonly BusinessHealthComponent[] {
  const revenueAttainment =
    snapshot.attainment.revenue.attainment
  const grossProfitAttainment =
    snapshot.attainment.grossProfit.attainment
  const marginAttainment =
    snapshot.attainment.grossMargin.attainment
  const forecast =
    snapshot.attainment.revenuePace
      .projectedPeriodEnd
  const paceAttainment =
    snapshot.attainment.revenuePace
      .attainmentToPlan

  return [
    buildComponent(
      'revenue',
      snapshot.actuals.revenue,
      snapshot.target.revenue,
      directRatioToScore(revenueAttainment),
      weights.revenue,
    ),
    buildComponent(
      'grossProfit',
      snapshot.actuals.grossProfit,
      snapshot.target.grossProfit,
      directRatioToScore(grossProfitAttainment),
      weights.grossProfit,
    ),
    buildComponent(
      'margin',
      snapshot.actuals.grossMargin,
      snapshot.target.grossMargin,
      directRatioToScore(marginAttainment),
      weights.margin,
    ),
    buildComponent(
      'forecast',
      forecast,
      snapshot.target.revenue,
      ratioToScore(
        forecast,
        snapshot.target.revenue,
      ),
      weights.forecast,
    ),
    buildComponent(
      'pace',
      snapshot.actuals.revenue,
      snapshot.attainment.revenuePace
        .expectedToDate,
      directRatioToScore(paceAttainment),
      weights.pace,
    ),
    buildComponent(
      'customers',
      snapshot.actuals.customers,
      benchmarks.minimumCustomers ?? null,
      ratioToScore(
        snapshot.actuals.customers,
        benchmarks.minimumCustomers ?? null,
      ),
      weights.customers,
    ),
    buildComponent(
      'products',
      snapshot.actuals.products,
      benchmarks.minimumProducts ?? null,
      ratioToScore(
        snapshot.actuals.products,
        benchmarks.minimumProducts ?? null,
      ),
      weights.products,
    ),
    buildComponent(
      'trend',
      benchmarks.revenueTrendRatio ?? null,
      1,
      directRatioToScore(
        benchmarks.revenueTrendRatio ?? null,
      ),
      weights.trend,
    ),
  ]
}
