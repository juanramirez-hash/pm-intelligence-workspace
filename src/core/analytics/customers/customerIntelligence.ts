import type {
  BusinessCustomer,
} from '../../business/entities/customer'

import type {
  BusinessCustomerPeriod,
} from '../../business/entities/customerPeriod'

import type {
  BusinessRepository,
} from '../../business/repository'

import {
  addMonths,
  endOfMonth,
  getDaysBetween,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
} from '../shared/dateAnalytics'

import type {
  CustomerIntelligenceItem,
  CustomerIntelligenceSummary,
  CustomerLifecycleStatus,
  CustomerPeriodMetrics,
  CustomerTrendStatus,
} from './customerIntelligenceTypes'

interface CustomerAnalysisRecord {
  customer: BusinessCustomer

  firstPurchaseDate: Date
  lastPurchaseDate: Date

  currentPeriod:
    CustomerPeriodMetrics

  previousPeriod:
    CustomerPeriodMetrics

  purchasedBeforePreviousPeriod:
    boolean
}

export interface CustomerIntelligenceOptions {
  inactiveDays?: number
  lostDays?: number
  stableVariationThreshold?: number
}

const DEFAULT_INACTIVE_DAYS = 90
const DEFAULT_LOST_DAYS = 180
const DEFAULT_STABLE_THRESHOLD = 0.05

function createPeriodMetrics():
  CustomerPeriodMetrics {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
  }
}

function mapPeriodMetrics(
  period:
    BusinessCustomerPeriod |
    undefined,
): CustomerPeriodMetrics {
  if (!period) {
    return createPeriodMetrics()
  }

  return {
    revenue:
      period.revenue,

    grossProfit:
      period.grossProfit,

    quantity:
      period.quantity,

    documents:
      period.documents,
  }
}

function getPeriodId(
  date: Date,
): string {
  const year =
    date.getUTCFullYear()

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, '0')

  return `${year}-${month}`
}

function hasPeriodActivity(
  period:
    CustomerPeriodMetrics,
): boolean {
  return (
    period.revenue !== 0 ||
    period.quantity !== 0 ||
    period.documents > 0
  )
}

function getRevenueVariationPercentage(
  currentRevenue: number,
  previousRevenue: number,
): number | null {
  if (previousRevenue === 0) {
    return currentRevenue === 0
      ? 0
      : null
  }

  return (
    (
      currentRevenue -
      previousRevenue
    ) /
    previousRevenue
  )
}

function determineLifecycleStatus(
  record: CustomerAnalysisRecord,
  currentPeriodStart: Date,
  daysSinceLastPurchase: number,
  inactiveDays: number,
  lostDays: number,
): CustomerLifecycleStatus {
  const hasCurrentPurchases =
    hasPeriodActivity(
      record.currentPeriod,
    )

  const hasPreviousPurchases =
    hasPeriodActivity(
      record.previousPeriod,
    )

  const isNewCustomer =
    hasCurrentPurchases &&
    record.firstPurchaseDate >=
      currentPeriodStart

  if (isNewCustomer) {
    return 'new'
  }

  const isRecoveredCustomer =
    hasCurrentPurchases &&
    !hasPreviousPurchases &&
    record
      .purchasedBeforePreviousPeriod

  if (isRecoveredCustomer) {
    return 'recovered'
  }

  if (
    daysSinceLastPurchase >=
    lostDays
  ) {
    return 'lost'
  }

  if (
    daysSinceLastPurchase >=
    inactiveDays
  ) {
    return 'inactive'
  }

  return 'active'
}

function determineTrendStatus(
  currentRevenue: number,
  previousRevenue: number,
  stableThreshold: number,
): CustomerTrendStatus {
  if (
    currentRevenue === 0 &&
    previousRevenue === 0
  ) {
    return 'without_comparison'
  }

  if (previousRevenue === 0) {
    return 'without_comparison'
  }

  const variation =
    (
      currentRevenue -
      previousRevenue
    ) /
    previousRevenue

  if (
    variation >
    stableThreshold
  ) {
    return 'growing'
  }

  if (
    variation <
    -stableThreshold
  ) {
    return 'declining'
  }

  return 'stable'
}

function getAttentionReason(
  lifecycleStatus:
    CustomerLifecycleStatus,
  trendStatus:
    CustomerTrendStatus,
): string | null {
  if (
    lifecycleStatus === 'lost'
  ) {
    return 'Cliente sin compra durante 180 días o más.'
  }

  if (
    lifecycleStatus ===
    'inactive'
  ) {
    return 'Cliente sin compra durante 90 días o más.'
  }

  if (
    trendStatus ===
    'declining'
  ) {
    return 'Cliente con caída relevante frente al periodo anterior.'
  }

  return null
}

function sortByVariationDescending(
  left:
    CustomerIntelligenceItem,
  right:
    CustomerIntelligenceItem,
): number {
  return (
    (
      right.revenueVariation ??
      0
    ) -
    (
      left.revenueVariation ??
      0
    )
  )
}

function sortByVariationAscending(
  left:
    CustomerIntelligenceItem,
  right:
    CustomerIntelligenceItem,
): number {
  return (
    (
      left.revenueVariation ??
      0
    ) -
    (
      right.revenueVariation ??
      0
    )
  )
}

export function buildCustomerIntelligence(
  repository: BusinessRepository,
  analysisDate:
    string | null,
  options:
    CustomerIntelligenceOptions = {},
): CustomerIntelligenceSummary | null {
  if (!analysisDate) {
    return null
  }

  const parsedAnalysisDate =
    parseIsoDate(
      analysisDate,
    )

  if (!parsedAnalysisDate) {
    return null
  }

  const currentPeriodStart =
    startOfMonth(
      parsedAnalysisDate,
    )

  const currentPeriodEnd =
    endOfMonth(
      parsedAnalysisDate,
    )

  const previousPeriodReference =
    addMonths(
      currentPeriodStart,
      -1,
    )

  const previousPeriodStart =
    startOfMonth(
      previousPeriodReference,
    )

  const previousPeriodEnd =
    endOfMonth(
      previousPeriodReference,
    )

  const currentPeriodId =
    getPeriodId(
      currentPeriodStart,
    )

  const previousPeriodId =
    getPeriodId(
      previousPeriodStart,
    )

  const inactiveDays =
    options.inactiveDays ??
    DEFAULT_INACTIVE_DAYS

  const lostDays =
    options.lostDays ??
    DEFAULT_LOST_DAYS

  const stableThreshold =
    options
      .stableVariationThreshold ??
    DEFAULT_STABLE_THRESHOLD

  const customers:
    CustomerIntelligenceItem[] =
    []

  for (
  const customer of
    repository.customer.getAll()
) {
  const firstPurchase =
    customer.firstPurchase

  const lastPurchase =
    customer.lastPurchase

  if (
    !firstPurchase ||
    !lastPurchase
  ) {
    continue
  }

  const firstPurchaseDate =
    parseIsoDate(
      firstPurchase,
    )

  const lastPurchaseDate =
    parseIsoDate(
      lastPurchase,
    )

  if (
    !firstPurchaseDate ||
    !lastPurchaseDate
  ) {
    continue
  }

    const currentPeriod =
      mapPeriodMetrics(
        repository.customer
          .findPeriod(
            customer.id,
            currentPeriodId,
          ),
      )

    const previousPeriod =
      mapPeriodMetrics(
        repository.customer
          .findPeriod(
            customer.id,
            previousPeriodId,
          ),
      )

    const timeline =
      repository.customer
        .getCustomerTimeline(
          customer.id,
        )

    const purchasedBeforePreviousPeriod =
      timeline.some(
        customerPeriod =>
          customerPeriod.periodId <
          previousPeriodId,
      )

    const record:
      CustomerAnalysisRecord = {
      customer,

      firstPurchaseDate,
      lastPurchaseDate,

      currentPeriod,
      previousPeriod,

      purchasedBeforePreviousPeriod,
    }

    const daysSinceLastPurchase =
      getDaysBetween(
        lastPurchaseDate,
        parsedAnalysisDate,
      )

    const lifecycleStatus =
      determineLifecycleStatus(
        record,
        currentPeriodStart,
        daysSinceLastPurchase,
        inactiveDays,
        lostDays,
      )

    const trendStatus =
      determineTrendStatus(
        currentPeriod.revenue,
        previousPeriod.revenue,
        stableThreshold,
      )

    const revenueVariation =
      currentPeriod.revenue -
      previousPeriod.revenue

    const revenueVariationPercentage =
      getRevenueVariationPercentage(
        currentPeriod.revenue,
        previousPeriod.revenue,
      )

    const attentionReason =
      getAttentionReason(
        lifecycleStatus,
        trendStatus,
      )

    customers.push({
      customerId:
        customer.id,

      customerName:
        customer.name,

      lifecycleStatus,

      trendStatus,

      lastPurchaseDate:
        lastPurchase,
      daysSinceLastPurchase,

      currentPeriod: {
        ...currentPeriod,
      },

      previousPeriod: {
        ...previousPeriod,
      },

      revenueVariation,

      revenueVariationPercentage,

      historicalRevenue:
        customer.revenue,

      historicalGrossProfit:
        customer.grossProfit,

      historicalQuantity:
        customer.quantity,

      historicalDocuments:
        customer.documents,

      requiresAttention:
        attentionReason !== null,

      attentionReason,
    })
  }

  const attentionCustomers =
    customers
      .filter(
        customer =>
          customer
            .requiresAttention,
      )
      .sort(
        (
          left,
          right,
        ) => {
          if (
            right
              .daysSinceLastPurchase !==
            left
              .daysSinceLastPurchase
          ) {
            return (
              right
                .daysSinceLastPurchase -
              left
                .daysSinceLastPurchase
            )
          }

          return (
            (
              left.revenueVariation ??
              0
            ) -
            (
              right.revenueVariation ??
              0
            )
          )
        },
      )

  const topGrowingCustomers =
    customers
      .filter(
        customer =>
          customer.trendStatus ===
          'growing',
      )
      .sort(
        sortByVariationDescending,
      )
      .slice(0, 10)

  const topDecliningCustomers =
    customers
      .filter(
        customer =>
          customer.trendStatus ===
          'declining',
      )
      .sort(
        sortByVariationAscending,
      )
      .slice(0, 10)

  return {
    analysisDate:
      toIsoDate(
        parsedAnalysisDate,
      ),

    currentPeriodStart:
      toIsoDate(
        currentPeriodStart,
      ),

    currentPeriodEnd:
      toIsoDate(
        currentPeriodEnd,
      ),

    previousPeriodStart:
      toIsoDate(
        previousPeriodStart,
      ),

    previousPeriodEnd:
      toIsoDate(
        previousPeriodEnd,
      ),

    totalCustomers:
      customers.length,

    activeCustomers:
      customers.filter(
        customer =>
          customer
            .lifecycleStatus ===
          'active',
      ).length,

    newCustomers:
      customers.filter(
        customer =>
          customer
            .lifecycleStatus ===
          'new',
      ).length,

    recoveredCustomers:
      customers.filter(
        customer =>
          customer
            .lifecycleStatus ===
          'recovered',
      ).length,

    inactiveCustomers:
      customers.filter(
        customer =>
          customer
            .lifecycleStatus ===
          'inactive',
      ).length,

    lostCustomers:
      customers.filter(
        customer =>
          customer
            .lifecycleStatus ===
          'lost',
      ).length,

    growingCustomers:
      customers.filter(
        customer =>
          customer
            .trendStatus ===
          'growing',
      ).length,

    decliningCustomers:
      customers.filter(
        customer =>
          customer
            .trendStatus ===
          'declining',
      ).length,

    stableCustomers:
      customers.filter(
        customer =>
          customer
            .trendStatus ===
          'stable',
      ).length,

    customersRequiringAttention:
      attentionCustomers.length,

    customers,

    attentionCustomers,

    topGrowingCustomers,

    topDecliningCustomers,
  }
}