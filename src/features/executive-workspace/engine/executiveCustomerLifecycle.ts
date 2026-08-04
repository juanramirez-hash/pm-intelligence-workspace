import type {
  BusinessCustomer,
} from '../../../core/business/entities/customer'

import type {
  BusinessCustomerPeriod,
} from '../../../core/business/entities/customerPeriod'

import type {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  ExecutiveEntityAttentionSummary,
  ExecutivePeriodSelection,
} from '../types/executiveWorkspaceTypes'

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000

const DEFAULT_INACTIVE_DAYS = 90
const DEFAULT_LOST_DAYS = 180
const DEFAULT_DECLINE_THRESHOLD = -0.05
const STABLE_VARIATION_THRESHOLD = 0.05

interface CustomerActivity {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

interface CustomerLifecycleConfiguration {
  inactiveDays: number
  lostDays: number
  declineThreshold: number
}

export interface ExecutiveCustomerLifecycleOptions {
  inactiveDays?: number
  lostDays?: number
  declineThreshold?: number
}

function createEmptyActivity():
CustomerActivity {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
  }
}

function hasActivity(
  activity: CustomerActivity,
): boolean {
  return (
    activity.revenue !== 0 ||
    activity.grossProfit !== 0 ||
    activity.quantity !== 0 ||
    activity.documents > 0
  )
}

function hasPeriodActivity(
  period: BusinessCustomerPeriod,
): boolean {
  return hasActivity(period)
}

function aggregateActivity(
  timeline:
    readonly BusinessCustomerPeriod[],
  periodIds: ReadonlySet<string>,
): CustomerActivity {
  return timeline.reduce<CustomerActivity>(
    (total, period) => {
      if (!periodIds.has(period.periodId)) {
        return total
      }

      total.revenue += period.revenue
      total.grossProfit +=
        period.grossProfit
      total.quantity += period.quantity
      total.documents += period.documents

      return total
    },
    createEmptyActivity(),
  )
}

function parseIsoDate(
  value: string | null,
): Date | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

function getPeriodStartFallback(
  periodId: string,
): Date | null {
  const date = new Date(`${periodId}-01T00:00:00.000Z`)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

function getPeriodEndFallback(
  periodId: string,
): Date | null {
  const [year, month] =
    periodId.split('-').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  return new Date(
    Date.UTC(year, month, 0),
  )
}

function resolvePeriodBoundary(
  repository: BusinessRepository,
  periodId: string | null,
  boundary: 'start' | 'end',
): Date | null {
  if (!periodId) {
    return null
  }

  const period =
    repository.revenue.findById(periodId)

  const source =
    boundary === 'start'
      ? period?.periodStart
      : period?.periodEnd

  const parsed =
    parseIsoDate(source ?? null)

  if (parsed) {
    return parsed
  }

  return boundary === 'start'
    ? getPeriodStartFallback(periodId)
    : getPeriodEndFallback(periodId)
}

function getDaysBetween(
  startDate: Date,
  endDate: Date,
): number {
  const startUtc = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  )

  const endUtc = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  )

  return Math.max(
    0,
    Math.floor(
      (endUtc - startUtc) /
        MILLISECONDS_PER_DAY,
    ),
  )
}

function isWithinRange(
  date: Date,
  startDate: Date,
  endDate: Date,
): boolean {
  return (
    date.getTime() >= startDate.getTime() &&
    date.getTime() <= endDate.getTime()
  )
}

function dateToPeriodId(
  date: Date,
): string {
  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, '0'),
  ].join('-')
}

function findFirstPurchaseDate(
  customer: BusinessCustomer,
  timeline:
    readonly BusinessCustomerPeriod[],
  repository: BusinessRepository,
  analysisDate: Date,
): Date | null {
  const customerDate =
    parseIsoDate(customer.firstPurchase)

  if (
    customerDate &&
    customerDate.getTime() <=
      analysisDate.getTime()
  ) {
    return customerDate
  }

  const firstPeriod = timeline.find(
    (period) =>
      hasPeriodActivity(period) &&
      period.periodId <=
        dateToPeriodId(analysisDate),
  )

  return firstPeriod
    ? resolvePeriodBoundary(
        repository,
        firstPeriod.periodId,
        'start',
      )
    : null
}

function findLastPurchaseDateAtCutoff(
  customer: BusinessCustomer,
  timeline:
    readonly BusinessCustomerPeriod[],
  repository: BusinessRepository,
  analysisDate: Date,
): Date | null {
  const customerDate =
    parseIsoDate(customer.lastPurchase)

  if (
    customerDate &&
    customerDate.getTime() <=
      analysisDate.getTime()
  ) {
    return customerDate
  }

  const analysisPeriodId =
    dateToPeriodId(analysisDate)

  const lastPeriod = [...timeline]
    .filter(
      (period) =>
        hasPeriodActivity(period) &&
        period.periodId <= analysisPeriodId,
    )
    .sort(
      (left, right) =>
        right.periodId.localeCompare(
          left.periodId,
        ),
    )[0]

  return lastPeriod
    ? resolvePeriodBoundary(
        repository,
        lastPeriod.periodId,
        'end',
      )
    : null
}

function normalizeConfiguration(
  options:
    ExecutiveCustomerLifecycleOptions,
): CustomerLifecycleConfiguration {
  const inactiveDays =
    options.inactiveDays ??
    DEFAULT_INACTIVE_DAYS

  const lostDays =
    options.lostDays ??
    DEFAULT_LOST_DAYS

  if (
    !Number.isFinite(inactiveDays) ||
    !Number.isFinite(lostDays) ||
    inactiveDays < 0 ||
    lostDays <= inactiveDays
  ) {
    return {
      inactiveDays:
        DEFAULT_INACTIVE_DAYS,
      lostDays:
        DEFAULT_LOST_DAYS,
      declineThreshold:
        DEFAULT_DECLINE_THRESHOLD,
    }
  }

  const declineThreshold =
    options.declineThreshold ??
    DEFAULT_DECLINE_THRESHOLD

  return {
    inactiveDays:
      Math.floor(inactiveDays),
    lostDays:
      Math.floor(lostDays),
    declineThreshold:
      Number.isFinite(declineThreshold)
        ? Math.min(
            0,
            declineThreshold,
          )
        : DEFAULT_DECLINE_THRESHOLD,
  }
}

function createEmptyAttentionIds() {
  return {
    analyzed: [] as string[],
    active: [] as string[],
    requiringAttention: [] as string[],
    growing: [] as string[],
    declining: [] as string[],
    stable: [] as string[],
    recovered: [] as string[],
    new: [] as string[],
    inactiveOrLost: [] as string[],
  }
}

function createEmptySummary(
  entityIds = createEmptyAttentionIds(),
): ExecutiveEntityAttentionSummary {
  return {
    totalAnalyzed: 0,
    activeEntities: 0,
    entitiesRequiringAttention: 0,
    growingEntities: 0,
    decliningEntities: 0,
    stableEntities: 0,
    recoveredEntities: 0,
    newEntities: 0,
    inactiveOrLostEntities: 0,
    entityIds,
  }
}

export function buildExecutiveCustomerAttentionSummary(
  repository: BusinessRepository | null,
  selection: ExecutivePeriodSelection,
  options:
    ExecutiveCustomerLifecycleOptions = {},
): ExecutiveEntityAttentionSummary {
  const entityIds =
    createEmptyAttentionIds()

  const result =
    createEmptySummary(entityIds)

  if (
    !repository ||
    selection.currentPeriodIds.length === 0
  ) {
    return result
  }

  const currentStartDate =
    resolvePeriodBoundary(
      repository,
      selection.currentStartPeriodId,
      'start',
    )

  const analysisDate =
    resolvePeriodBoundary(
      repository,
      selection.currentEndPeriodId,
      'end',
    )

  if (!currentStartDate || !analysisDate) {
    return result
  }

  const configuration =
    normalizeConfiguration(options)

  const currentIds = new Set(
    selection.currentPeriodIds,
  )

  const comparisonIds = new Set(
    selection.comparisonPeriodIds,
  )

  const historyBoundary =
    selection.comparisonStartPeriodId ??
    selection.currentStartPeriodId

  for (
    const customer of
      repository.customer.getAll()
  ) {
    const timeline =
      repository.customer
        .getCustomerTimeline(customer.id)
        .filter(hasPeriodActivity)
        .sort(
          (left, right) =>
            left.periodId.localeCompare(
              right.periodId,
            ),
        )

    const firstPurchaseDate =
      findFirstPurchaseDate(
        customer,
        timeline,
        repository,
        analysisDate,
      )

    const lastPurchaseDate =
      findLastPurchaseDateAtCutoff(
        customer,
        timeline,
        repository,
        analysisDate,
      )

    if (
      !firstPurchaseDate ||
      !lastPurchaseDate ||
      firstPurchaseDate.getTime() >
        analysisDate.getTime()
    ) {
      continue
    }

    result.totalAnalyzed += 1
    entityIds.analyzed.push(customer.id)

    const current = aggregateActivity(
      timeline,
      currentIds,
    )

    const comparison = aggregateActivity(
      timeline,
      comparisonIds,
    )

    const currentActive =
      hasActivity(current)

    const comparisonActive =
      hasActivity(comparison)

    if (currentActive) {
      result.activeEntities += 1
      entityIds.active.push(customer.id)
    }

    const firstPurchaseInCurrent =
      currentActive &&
      isWithinRange(
        firstPurchaseDate,
        currentStartDate,
        analysisDate,
      )

    const purchasedBeforeComparison =
      historyBoundary !== null &&
      timeline.some(
        (period) =>
          period.periodId <
          historyBoundary,
      )

    const recovered =
      currentActive &&
      !comparisonActive &&
      !firstPurchaseInCurrent &&
      purchasedBeforeComparison

    if (firstPurchaseInCurrent) {
      result.newEntities += 1
      entityIds.new.push(customer.id)
    } else if (recovered) {
      result.recoveredEntities += 1
      entityIds.recovered.push(customer.id)
    }

    const daysSinceLastPurchase =
      getDaysBetween(
        lastPurchaseDate,
        analysisDate,
      )

    const lost =
      daysSinceLastPurchase >=
      configuration.lostDays

    const inactive =
      !lost &&
      daysSinceLastPurchase >=
        configuration.inactiveDays

    if (inactive || lost) {
      result.inactiveOrLostEntities += 1
      entityIds.inactiveOrLost.push(
        customer.id,
      )
    }

    let declining = false

    if (currentActive && comparisonActive) {
      const variationPercentage =
        comparison.revenue !== 0
          ? (
              current.revenue -
              comparison.revenue
            ) /
            Math.abs(
              comparison.revenue,
            )
          : null

      if (
        variationPercentage !== null &&
        variationPercentage >
          STABLE_VARIATION_THRESHOLD
      ) {
        result.growingEntities += 1
        entityIds.growing.push(customer.id)
      } else if (
        variationPercentage !== null &&
        variationPercentage <
          -STABLE_VARIATION_THRESHOLD
      ) {
        result.decliningEntities += 1
        entityIds.declining.push(customer.id)

        declining =
          variationPercentage <=
          configuration.declineThreshold
      } else {
        result.stableEntities += 1
        entityIds.stable.push(customer.id)
      }
    }

    if (inactive || lost || declining) {
      result.entitiesRequiringAttention += 1
      entityIds.requiringAttention.push(
        customer.id,
      )
    }
  }

  return result
}
