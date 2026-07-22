import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  addMonths,
  endOfMonth,
  getDaysBetween,
  isDateWithinRange,
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

interface MutableCustomerRecord {
  customerId: string
  customerName: string

  firstPurchaseDate: Date
  lastPurchaseDate: Date

  historicalRevenue: number
  historicalGrossProfit: number
  historicalQuantity: number

  historicalDocuments:
    Set<string>

  currentPeriod:
    CustomerPeriodMetrics

  previousPeriod:
    CustomerPeriodMetrics

  currentDocuments:
    Set<string>

  previousDocuments:
    Set<string>

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

function normalizeCustomerId(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .toLocaleUpperCase(
        'es-MX',
      )

  return normalizedValue || null
}

function normalizeCustomerName(
  value: string | null,
  customerId: string,
): string {
  const normalizedName =
    value
      ?.trim()
      .replace(/\s+/g, ' ')

  return normalizedName ||
    `Cliente ${customerId}`
}

function createPeriodMetrics():
  CustomerPeriodMetrics {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
  }
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
    (currentRevenue -
      previousRevenue) /
    previousRevenue
  )
}

function determineLifecycleStatus(
  record: MutableCustomerRecord,
  currentPeriodStart: Date,
  daysSinceLastPurchase: number,
  inactiveDays: number,
  lostDays: number,
): CustomerLifecycleStatus {
  const hasCurrentPurchases =
    record.currentPeriod.revenue !== 0 ||
    record.currentPeriod.quantity !== 0 ||
    record.currentDocuments.size > 0

  const hasPreviousPurchases =
    record.previousPeriod.revenue !== 0 ||
    record.previousPeriod.quantity !== 0 ||
    record.previousDocuments.size > 0

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
    record.purchasedBeforePreviousPeriod

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
    (currentRevenue -
      previousRevenue) /
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
    (right.revenueVariation ?? 0) -
    (left.revenueVariation ?? 0)
  )
}

function sortByVariationAscending(
  left:
    CustomerIntelligenceItem,
  right:
    CustomerIntelligenceItem,
): number {
  return (
    (left.revenueVariation ?? 0) -
    (right.revenueVariation ?? 0)
  )
}

export function buildCustomerIntelligence(
  rows: NormalizedSalesRow[],
  options:
    CustomerIntelligenceOptions = {},
): CustomerIntelligenceSummary | null {
  const validDates =
    rows
      .map((row) =>
        parseIsoDate(row.date),
      )
      .filter(
        (
          date,
        ): date is Date =>
          date !== null,
      )

  if (validDates.length === 0) {
    return null
  }

const analysisTimestamp =
  validDates.reduce(
    (
      latestTimestamp,
      date,
    ) =>
      Math.max(
        latestTimestamp,
        date.getTime(),
      ),
    Number.NEGATIVE_INFINITY,
  )

const analysisDate =
  new Date(
    analysisTimestamp,
  )

  const currentPeriodStart =
    startOfMonth(analysisDate)

  const currentPeriodEnd =
    endOfMonth(analysisDate)

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

  const customerRecords =
    new Map<
      string,
      MutableCustomerRecord
    >()

  for (const row of rows) {
    const customerId =
      normalizeCustomerId(
        row.customerId,
      )

    const rowDate =
      parseIsoDate(row.date)

    if (
      !customerId ||
      !rowDate
    ) {
      continue
    }

    let record =
      customerRecords.get(
        customerId,
      )

    if (!record) {
      record = {
        customerId,

        customerName:
          normalizeCustomerName(
            row.customerName,
            customerId,
          ),

        firstPurchaseDate:
          rowDate,

        lastPurchaseDate:
          rowDate,

        historicalRevenue: 0,

        historicalGrossProfit: 0,

        historicalQuantity: 0,

        historicalDocuments:
          new Set<string>(),

        currentPeriod:
          createPeriodMetrics(),

        previousPeriod:
          createPeriodMetrics(),

        currentDocuments:
          new Set<string>(),

        previousDocuments:
          new Set<string>(),

        purchasedBeforePreviousPeriod:
          false,
      }

      customerRecords.set(
        customerId,
        record,
      )
    }

    if (
      rowDate <
      record.firstPurchaseDate
    ) {
      record.firstPurchaseDate =
        rowDate
    }

    if (
      rowDate >
      record.lastPurchaseDate
    ) {
      record.lastPurchaseDate =
        rowDate
    }

    if (
      row.customerName?.trim()
    ) {
      record.customerName =
        normalizeCustomerName(
          row.customerName,
          customerId,
        )
    }

    record.historicalRevenue +=
      row.revenue

    record.historicalGrossProfit +=
      row.grossProfit

    record.historicalQuantity +=
      row.quantity

    if (row.documentNumber) {
      record.historicalDocuments.add(
        row.documentNumber,
      )
    }

    if (
      isDateWithinRange(
        rowDate,
        currentPeriodStart,
        currentPeriodEnd,
      )
    ) {
      record.currentPeriod.revenue +=
        row.revenue

      record.currentPeriod.grossProfit +=
        row.grossProfit

      record.currentPeriod.quantity +=
        row.quantity

      if (row.documentNumber) {
        record.currentDocuments.add(
          row.documentNumber,
        )
      }

      continue
    }

    if (
      isDateWithinRange(
        rowDate,
        previousPeriodStart,
        previousPeriodEnd,
      )
    ) {
      record.previousPeriod.revenue +=
        row.revenue

      record.previousPeriod.grossProfit +=
        row.grossProfit

      record.previousPeriod.quantity +=
        row.quantity

      if (row.documentNumber) {
        record.previousDocuments.add(
          row.documentNumber,
        )
      }

      continue
    }

    if (
      rowDate <
      previousPeriodStart
    ) {
      record
        .purchasedBeforePreviousPeriod =
        true
    }
  }

  const customers:
    CustomerIntelligenceItem[] =
    []

  for (
    const record of
      customerRecords.values()
  ) {
    record.currentPeriod.documents =
      record.currentDocuments.size

    record.previousPeriod.documents =
      record.previousDocuments.size

    const daysSinceLastPurchase =
      getDaysBetween(
        record.lastPurchaseDate,
        analysisDate,
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
        record.currentPeriod
          .revenue,
        record.previousPeriod
          .revenue,
        stableThreshold,
      )

    const revenueVariation =
      record.currentPeriod.revenue -
      record.previousPeriod.revenue

    const revenueVariationPercentage =
      getRevenueVariationPercentage(
        record.currentPeriod
          .revenue,
        record.previousPeriod
          .revenue,
      )

    const attentionReason =
      getAttentionReason(
        lifecycleStatus,
        trendStatus,
      )

    customers.push({
      customerId:
        record.customerId,

      customerName:
        record.customerName,

      lifecycleStatus,

      trendStatus,

      lastPurchaseDate:
        toIsoDate(
          record.lastPurchaseDate,
        ),

      daysSinceLastPurchase,

      currentPeriod: {
        ...record.currentPeriod,
      },

      previousPeriod: {
        ...record.previousPeriod,
      },

      revenueVariation,

      revenueVariationPercentage,

      historicalRevenue:
        record.historicalRevenue,

      historicalGrossProfit:
        record.historicalGrossProfit,

      historicalQuantity:
        record.historicalQuantity,

      historicalDocuments:
        record
          .historicalDocuments
          .size,

      requiresAttention:
        attentionReason !== null,

      attentionReason,
    })
  }

  const attentionCustomers =
    customers
      .filter(
        (customer) =>
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
             (left.revenueVariation ?? 0) -
             (right.revenueVariation ?? 0)
            )
        },
      )

  const topGrowingCustomers =
    customers
      .filter(
        (customer) =>
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
        (customer) =>
          customer.trendStatus ===
          'declining',
      )
      .sort(
        sortByVariationAscending,
      )
      .slice(0, 10)

  return {
    analysisDate:
      toIsoDate(analysisDate),

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
        (customer) =>
          customer
            .lifecycleStatus ===
          'active',
      ).length,

    newCustomers:
      customers.filter(
        (customer) =>
          customer
            .lifecycleStatus ===
          'new',
      ).length,

    recoveredCustomers:
      customers.filter(
        (customer) =>
          customer
            .lifecycleStatus ===
          'recovered',
      ).length,

    inactiveCustomers:
      customers.filter(
        (customer) =>
          customer
            .lifecycleStatus ===
          'inactive',
      ).length,

    lostCustomers:
      customers.filter(
        (customer) =>
          customer
            .lifecycleStatus ===
          'lost',
      ).length,

    growingCustomers:
      customers.filter(
        (customer) =>
          customer
            .trendStatus ===
          'growing',
      ).length,

    decliningCustomers:
      customers.filter(
        (customer) =>
          customer
            .trendStatus ===
          'declining',
      ).length,

    stableCustomers:
      customers.filter(
        (customer) =>
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