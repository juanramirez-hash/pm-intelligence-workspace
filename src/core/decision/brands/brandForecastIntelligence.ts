import type {
  BusinessBrandSnapshot,
} from '../../business'

export type BrandForecastStatus =
  | 'not-evaluable'
  | 'critical'
  | 'at-risk'
  | 'on-track'
  | 'ahead'
  | 'achieved'

export interface BrandForecastIntelligence {
  workingDays: number | null
  elapsedWorkingDays: number | null
  remainingWorkingDays: number | null
  expectedProgress: number | null
  actualProgress: number | null
  paceIndex: number | null
  revenueTarget: number | null
  actualRevenue: number
  expectedRevenueToDate: number | null
  revenueVarianceToPace: number | null
  projectedRevenue: number | null
  projectedAttainment: number | null
  revenueGap: number | null
  requiredDailyRevenue: number | null
  currentDailyRevenue: number | null
  achievementProbability: number | null
  confidence: number
  status: BrandForecastStatus
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function resolveStatus(
  actualRevenue: number,
  revenueTarget: number | null,
  projectedAttainment: number | null,
): BrandForecastStatus {
  if (revenueTarget === null || projectedAttainment === null) return 'not-evaluable'
  if (actualRevenue >= revenueTarget) return 'achieved'
  if (projectedAttainment >= 1.05) return 'ahead'
  if (projectedAttainment >= 0.98) return 'on-track'
  if (projectedAttainment >= 0.85) return 'at-risk'
  return 'critical'
}

export function buildBrandForecastIntelligence(
  snapshot: BusinessBrandSnapshot,
): BrandForecastIntelligence {
  const pace = snapshot.attainment.revenuePace
  const actualRevenue = snapshot.actuals.revenue
  const revenueTarget = snapshot.target.revenue
  const workingDays = pace.workingDays
  const elapsedWorkingDays = pace.elapsedWorkingDays
  const remainingWorkingDays = workingDays !== null && elapsedWorkingDays !== null
    ? Math.max(0, workingDays - elapsedWorkingDays)
    : null
  const expectedProgress = workingDays !== null && elapsedWorkingDays !== null && workingDays > 0
    ? elapsedWorkingDays / workingDays
    : null
  const actualProgress = snapshot.attainment.revenue.attainment
  const projectedRevenue = pace.projectedPeriodEnd
  const projectedAttainment = projectedRevenue !== null && revenueTarget !== null && revenueTarget > 0
    ? projectedRevenue / revenueTarget
    : null
  const revenueGap = revenueTarget === null
    ? null
    : Math.max(0, revenueTarget - actualRevenue)
  const requiredDailyRevenue = revenueGap !== null && remainingWorkingDays !== null && remainingWorkingDays > 0
    ? revenueGap / remainingWorkingDays
    : revenueGap === 0 ? 0 : null
  const currentDailyRevenue = elapsedWorkingDays !== null && elapsedWorkingDays > 0
    ? actualRevenue / elapsedWorkingDays
    : null
  const paceIndex = pace.attainmentToPlan

  const probability = projectedAttainment === null || paceIndex === null
    ? null
    : clamp(
        50 +
        (projectedAttainment - 1) * 90 +
        (paceIndex - 1) * 35 +
        (elapsedWorkingDays ?? 0) * 0.8,
      )

  const confidence = clamp(
    45 +
    (workingDays !== null ? 15 : 0) +
    (revenueTarget !== null ? 15 : 0) +
    Math.min(25, (elapsedWorkingDays ?? 0) * 1.5),
  )

  return {
    workingDays,
    elapsedWorkingDays,
    remainingWorkingDays,
    expectedProgress,
    actualProgress,
    paceIndex,
    revenueTarget,
    actualRevenue,
    expectedRevenueToDate: pace.expectedToDate,
    revenueVarianceToPace: pace.varianceToPlan,
    projectedRevenue,
    projectedAttainment,
    revenueGap,
    requiredDailyRevenue,
    currentDailyRevenue,
    achievementProbability: probability === null ? null : round(probability),
    confidence: round(confidence),
    status: resolveStatus(actualRevenue, revenueTarget, projectedAttainment),
  }
}
