import type {
  BusinessMetricAttainment,
  BusinessPerformanceStatus,
  BusinessRevenuePace,
} from './businessTargetAttainment'

function isFiniteNumber(
  value: number | null,
): value is number {
  return (
    value !== null &&
    Number.isFinite(value)
  )
}

export function calculateAttainmentRatio(
  actual: number | null,
  target: number | null,
): number | null {
  if (
    !isFiniteNumber(actual) ||
    !isFiniteNumber(target) ||
    target === 0
  ) {
    return null
  }

  return actual / target
}

export function calculateMetricAttainment(
  actual: number | null,
  target: number | null,
): BusinessMetricAttainment {
  const hasActual =
    isFiniteNumber(actual)

  const hasTarget =
    isFiniteNumber(target)

  return {
    actual: hasActual
      ? actual
      : null,
    target: hasTarget
      ? target
      : null,
    variance:
      hasActual && hasTarget
        ? actual - target
        : null,
    attainment:
      calculateAttainmentRatio(
        actual,
        target,
      ),
  }
}

function normalizeWorkingDays(
  value: number | null,
): number | null {
  if (
    value === null ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    return null
  }

  return value
}

function normalizeElapsedWorkingDays(
  value: number | null | undefined,
  workingDays: number | null,
): number | null {
  if (
    value === null ||
    value === undefined ||
    workingDays === null ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > workingDays
  ) {
    return null
  }

  return value
}

function resolvePerformanceStatus(
  actualRevenue: number,
  targetRevenue: number | null,
  expectedToDate: number | null,
): BusinessPerformanceStatus {
  if (targetRevenue === null) {
    return 'not-evaluable'
  }

  if (actualRevenue >= targetRevenue) {
    return 'achieved'
  }

  if (expectedToDate === null) {
    return 'not-evaluable'
  }

  if (actualRevenue > expectedToDate) {
    return 'ahead-of-plan'
  }

  if (actualRevenue === expectedToDate) {
    return 'on-plan'
  }

  return 'behind-plan'
}

export function calculateRevenuePace(
  actualRevenue: number,
  targetRevenue: number | null,
  workingDaysInput: number | null,
  elapsedWorkingDaysInput?: number | null,
): BusinessRevenuePace {
  const workingDays =
    normalizeWorkingDays(
      workingDaysInput,
    )

  const elapsedWorkingDays =
    normalizeElapsedWorkingDays(
      elapsedWorkingDaysInput,
      workingDays,
    )

  const hasTargetRevenue =
    isFiniteNumber(targetRevenue)

  const expectedToDate =
    hasTargetRevenue &&
    workingDays !== null &&
    elapsedWorkingDays !== null
      ? (
          targetRevenue *
          elapsedWorkingDays
        ) / workingDays
      : null

  const varianceToPlan =
    expectedToDate !== null
      ? actualRevenue -
        expectedToDate
      : null

  const attainmentToPlan =
    calculateAttainmentRatio(
      actualRevenue,
      expectedToDate,
    )

  const projectedPeriodEnd =
    workingDays !== null &&
    elapsedWorkingDays !== null &&
    elapsedWorkingDays > 0
      ? (
          actualRevenue /
          elapsedWorkingDays
        ) * workingDays
      : null

  return {
    workingDays,
    elapsedWorkingDays,
    expectedToDate,
    varianceToPlan,
    attainmentToPlan,
    projectedPeriodEnd,
    status:
      resolvePerformanceStatus(
        actualRevenue,
        hasTargetRevenue
          ? targetRevenue
          : null,
        expectedToDate,
      ),
  }
}
