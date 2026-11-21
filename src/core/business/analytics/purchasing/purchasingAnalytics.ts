import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../../entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../entities/purchaseRequest'

import {
  isClosedPurchaseOrderStatus,
} from './purchaseOrderStatus'

import {
  addCostValue,
  compareCostDescending,
  finalizeCostTotal,
} from '../costValues'

export type PurchasingAgingBucket =
  | 'current'
  | '1_7_days'
  | '8_15_days'
  | '16_30_days'
  | '31_plus_days'
  | 'undated'

// PUR-001: amounts are kept by currency code and never added across
// currencies (no exchange rate anywhere). Orders without a currency go to
// this group.
export const PURCHASING_NO_CURRENCY = 'SIN_MONEDA'

export const PURCHASING_NO_CURRENCY_LABEL = 'Sin moneda'

export interface PurchasingCurrencyAmount {
  // NULL when no line has amount (SEC-003C); 0 without lines.
  amount: number | null
  linesWithoutAmount: number
  purchaseOrders: number
  purchaseOrderLines: number
  orderedQuantity: number
  overduePurchaseOrders: number
}

export type PurchasingAmountsByCurrency =
  Record<string, PurchasingCurrencyAmount>

export interface PurchasingAnalyticsInput {
  orders: readonly BusinessPurchaseOrder[]
  lines: readonly BusinessPurchaseOrderLine[]
  requests: readonly BusinessPurchaseRequest[]
  referenceDate?: string
}

export interface PurchasingAnalyticsTotals {
  purchaseOrders: number
  purchaseOrderLines: number
  purchaseRequests: number

  openPurchaseOrders: number
  overduePurchaseOrders: number
  purchaseOrdersDueNext7Days: number

  purchaseRequestsWithoutPurchaseOrder: number
  purchaseRequestsWithPurchaseOrder: number

  orderedQuantity: number
  amountsByCurrency: PurchasingAmountsByCurrency
  // Currency codes present, USD first, SIN_MONEDA last.
  currencies: string[]
  purchaseOrdersWithoutCurrency: number
  linesWithoutAmount: number
  requestedQuantity: number

  suppliers: number
  buyers: number
  brands: number
  items: number

  linkedRequestRate: number
  overdueOrderRate: number
}

export interface PurchasingAnalyticsGroup {
  key: string
  label: string

  purchaseOrders: number
  purchaseOrderLines: number
  purchaseRequests: number

  orderedQuantity: number
  amountsByCurrency: PurchasingAmountsByCurrency
  linesWithoutAmount: number
  requestedQuantity: number

  overduePurchaseOrders: number
  purchaseRequestsWithoutPurchaseOrder: number
}

export interface PurchasingStatusSummary {
  status: string
  purchaseOrders: number
  purchaseRequests: number
  amountsByCurrency: PurchasingAmountsByCurrency
  linesWithoutAmount: number
}

export interface PurchasingAgingSummary {
  bucket: PurchasingAgingBucket
  purchaseOrders: number
  amountsByCurrency: PurchasingAmountsByCurrency
  linesWithoutAmount: number
}

export interface PurchasingLinkageSummary {
  purchaseRequests: number
  linkedToPurchaseOrder: number
  withoutPurchaseOrder: number
  linkedPurchaseOrderExists: number
  orphanPurchaseOrderReferences: number
  linkedToSalesOrder: number
  linkedToProject: number
}

export interface PurchasingCycleSummary {
  comparableRequests: number
  averageDaysRequestToPurchaseOrder: number | null
  medianDaysRequestToPurchaseOrder: number | null
  minDaysRequestToPurchaseOrder: number | null
  maxDaysRequestToPurchaseOrder: number | null
}

export interface PurchasingAnalyticsReport {
  generatedAt: string
  referenceDate: string

  totals: PurchasingAnalyticsTotals
  linkage: PurchasingLinkageSummary
  cycle: PurchasingCycleSummary

  bySupplier: PurchasingAnalyticsGroup[]
  byBuyer: PurchasingAnalyticsGroup[]
  byBrand: PurchasingAnalyticsGroup[]
  byItem: PurchasingAnalyticsGroup[]

  byStatus: PurchasingStatusSummary[]
  aging: PurchasingAgingSummary[]
}

interface MutableGroup {
  key: string
  label: string

  purchaseOrderIds: Set<string>
  purchaseOrderLineIds: Set<string>
  purchaseRequestIds: Set<string>

  orderedQuantity: number
  amounts: MutableAmountsByCurrency
  linesWithoutAmount: number
  requestedQuantity: number

  overduePurchaseOrderIds: Set<string>
  requestIdsWithoutPurchaseOrder: Set<string>
}

interface MutableStatusSummary {
  purchaseOrderIds: Set<string>
  purchaseRequestIds: Set<string>
  amounts: MutableAmountsByCurrency
  linesWithoutAmount: number
}

interface MutableAgingSummary {
  purchaseOrderIds: Set<string>
  amounts: MutableAmountsByCurrency
  linesWithoutAmount: number
}

interface MutableCurrencyAmount {
  amount: number | null
  linesWithoutAmount: number
  purchaseOrderIds: Set<string>
  lineIds: Set<string>
  orderedQuantity: number
  overduePurchaseOrderIds: Set<string>
}

type MutableAmountsByCurrency =
  Map<string, MutableCurrencyAmount>

/** Upper case without spaces; empty values go to SIN_MONEDA. */
export function normalizePurchasingCurrency(
  value: string | null | undefined,
): string {
  const normalized =
    value
      ?.replace(/\s+/g, '')
      .toLocaleUpperCase('es-MX')

  return normalized || PURCHASING_NO_CURRENCY
}

export function purchasingCurrencyLabel(
  currency: string,
): string {
  return currency === PURCHASING_NO_CURRENCY
    ? PURCHASING_NO_CURRENCY_LABEL
    : currency
}

/** USD first, then alphabetical, SIN_MONEDA last. */
export function comparePurchasingCurrencies(
  left: string,
  right: string,
): number {
  const rank = (currency: string) =>
    currency === 'USD'
      ? 0
      : currency === PURCHASING_NO_CURRENCY
        ? 2
        : 1

  return rank(left) - rank(right) ||
    left.localeCompare(right)
}

function currencyEntry(
  amounts: MutableAmountsByCurrency,
  currency: string,
): MutableCurrencyAmount {
  const current =
    amounts.get(currency)

  if (current) {
    return current
  }

  const created: MutableCurrencyAmount = {
    amount: null,
    linesWithoutAmount: 0,
    purchaseOrderIds: new Set<string>(),
    lineIds: new Set<string>(),
    orderedQuantity: 0,
    overduePurchaseOrderIds: new Set<string>(),
  }

  amounts.set(
    currency,
    created,
  )

  return created
}

function addOrderToAmounts(
  amounts: MutableAmountsByCurrency,
  order: BusinessPurchaseOrder,
  overdue: boolean,
): void {
  const entry =
    currencyEntry(
      amounts,
      normalizePurchasingCurrency(order.currency),
    )

  entry.purchaseOrderIds.add(order.id)

  if (overdue) {
    entry.overduePurchaseOrderIds.add(order.id)
  }
}

function addLineToAmounts(
  amounts: MutableAmountsByCurrency,
  line: BusinessPurchaseOrderLine,
  currency: string,
): void {
  const entry =
    currencyEntry(
      amounts,
      currency,
    )

  entry.purchaseOrderIds.add(line.purchaseOrderId)
  entry.lineIds.add(line.id)
  entry.orderedQuantity += line.quantity ?? 0
  entry.amount =
    addCostValue(
      entry.amount,
      line.amountForeignCurrency,
    )
  entry.linesWithoutAmount +=
    line.amountForeignCurrency === null
      ? 1
      : 0
}

// Status and aging add whole orders (their lines' sum).
function addOrderAmountToAmounts(
  amounts: MutableAmountsByCurrency,
  order: BusinessPurchaseOrder,
  overdue: boolean,
): void {
  const entry =
    currencyEntry(
      amounts,
      normalizePurchasingCurrency(order.currency),
    )

  entry.purchaseOrderIds.add(order.id)

  for (const lineId of order.lineIds) {
    entry.lineIds.add(lineId)
  }

  if (overdue) {
    entry.overduePurchaseOrderIds.add(order.id)
  }

  entry.orderedQuantity += order.quantity
  entry.amount =
    addCostValue(
      entry.amount,
      order.amountForeignCurrency,
    )
  entry.linesWithoutAmount +=
    order.linesWithoutAmount
}

function finalizeAmountsByCurrency(
  amounts: MutableAmountsByCurrency,
  contributors: 'lines' | 'orders',
): PurchasingAmountsByCurrency {
  return Object.fromEntries(
    [...amounts.entries()]
      .sort(([left], [right]) =>
        comparePurchasingCurrencies(left, right),
      )
      .map(([currency, entry]) => [
        currency,
        {
          amount:
            finalizeCostTotal(
              entry.amount,
              contributors === 'lines'
                ? entry.lineIds.size
                : entry.purchaseOrderIds.size,
            ),
          linesWithoutAmount:
            entry.linesWithoutAmount,
          purchaseOrders:
            entry.purchaseOrderIds.size,
          purchaseOrderLines:
            entry.lineIds.size,
          orderedQuantity:
            entry.orderedQuantity,
          overduePurchaseOrders:
            entry.overduePurchaseOrderIds.size,
        },
      ]),
  )
}

const AGING_BUCKET_ORDER: readonly PurchasingAgingBucket[] = [
  'current',
  '1_7_days',
  '8_15_days',
  '16_30_days',
  '31_plus_days',
  'undated',
]

function safeRatio(
  numerator: number,
  denominator: number,
): number {
  return denominator > 0
    ? numerator / denominator
    : 0
}

function normalizeKey(
  value: string | null | undefined,
  fallback: string,
): string {
  const normalized =
    value
      ?.trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalized || fallback
}

function parseDateOnly(
  value: string | null | undefined,
): Date | null {
  if (!value) {
    return null
  }

  const date =
    new Date(`${value.slice(0, 10)}T00:00:00Z`)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

function toDateOnlyIso(
  value: string | undefined,
): string {
  if (value) {
    return value.slice(0, 10)
  }

  return new Date()
    .toISOString()
    .slice(0, 10)
}

function diffDays(
  left: Date,
  right: Date,
): number {
  const millisecondsPerDay =
    24 * 60 * 60 * 1000

  return Math.floor(
    (
      left.getTime() -
      right.getTime()
    ) /
      millisecondsPerDay,
  )
}

function isClosedOrder(
  order: BusinessPurchaseOrder,
): boolean {
  return isClosedPurchaseOrderStatus(
    order.status,
  )
}

function isOverdueOrder(
  order: BusinessPurchaseOrder,
  referenceDate: Date,
): boolean {
  if (isClosedOrder(order)) {
    return false
  }

  const expectedReceiptDate =
    parseDateOnly(
      order.expectedReceiptDate,
    )

  if (!expectedReceiptDate) {
    return false
  }

  return expectedReceiptDate < referenceDate
}

function isDueWithinDays(
  order: BusinessPurchaseOrder,
  referenceDate: Date,
  days: number,
): boolean {
  if (isClosedOrder(order)) {
    return false
  }

  const expectedReceiptDate =
    parseDateOnly(
      order.expectedReceiptDate,
    )

  if (!expectedReceiptDate) {
    return false
  }

  const difference =
    diffDays(
      expectedReceiptDate,
      referenceDate,
    )

  return difference >= 0 &&
    difference <= days
}

function classifyAging(
  order: BusinessPurchaseOrder,
  referenceDate: Date,
): PurchasingAgingBucket {
  if (isClosedOrder(order)) {
    return 'current'
  }

  const expectedReceiptDate =
    parseDateOnly(
      order.expectedReceiptDate,
    )

  if (!expectedReceiptDate) {
    return 'undated'
  }

  const overdueDays =
    diffDays(
      referenceDate,
      expectedReceiptDate,
    )

  if (overdueDays <= 0) {
    return 'current'
  }

  if (overdueDays <= 7) {
    return '1_7_days'
  }

  if (overdueDays <= 15) {
    return '8_15_days'
  }

  if (overdueDays <= 30) {
    return '16_30_days'
  }

  return '31_plus_days'
}

function getOrCreateGroup(
  groups: Map<string, MutableGroup>,
  key: string,
  label: string,
): MutableGroup {
  const current =
    groups.get(key)

  if (current) {
    return current
  }

  const created: MutableGroup = {
    key,
    label,

    purchaseOrderIds:
      new Set<string>(),
    purchaseOrderLineIds:
      new Set<string>(),
    purchaseRequestIds:
      new Set<string>(),

    orderedQuantity: 0,
    amounts: new Map(),
    linesWithoutAmount: 0,
    requestedQuantity: 0,

    overduePurchaseOrderIds:
      new Set<string>(),
    requestIdsWithoutPurchaseOrder:
      new Set<string>(),
  }

  groups.set(
    key,
    created,
  )

  return created
}

function registerOrderInGroup(
  groups: Map<string, MutableGroup>,
  key: string,
  label: string,
  order: BusinessPurchaseOrder,
  overdue: boolean,
): void {
  const group =
    getOrCreateGroup(
      groups,
      key,
      label,
    )

  group.purchaseOrderIds.add(
    order.id,
  )

  if (overdue) {
    group.overduePurchaseOrderIds.add(
      order.id,
    )
  }

  addOrderToAmounts(
    group.amounts,
    order,
    overdue,
  )
}

function registerLineInGroup(
  groups: Map<string, MutableGroup>,
  key: string,
  label: string,
  line: BusinessPurchaseOrderLine,
  currency: string,
): void {
  const group =
    getOrCreateGroup(
      groups,
      key,
      label,
    )

  if (
    group.purchaseOrderLineIds.has(
      line.id,
    )
  ) {
    return
  }

  group.purchaseOrderLineIds.add(
    line.id,
  )

  group.purchaseOrderIds.add(
    line.purchaseOrderId,
  )

  group.orderedQuantity +=
    line.quantity ?? 0

  addLineToAmounts(
    group.amounts,
    line,
    currency,
  )

  group.linesWithoutAmount +=
    line.amountForeignCurrency === null
      ? 1
      : 0
}

function registerRequestInGroup(
  groups: Map<string, MutableGroup>,
  key: string,
  label: string,
  request: BusinessPurchaseRequest,
): void {
  const group =
    getOrCreateGroup(
      groups,
      key,
      label,
    )

  if (
    group.purchaseRequestIds.has(
      request.id,
    )
  ) {
    return
  }

  group.purchaseRequestIds.add(
    request.id,
  )

  group.requestedQuantity +=
    request.quantity ?? 0

  if (
    !request.relatedPurchaseOrderNumber
  ) {
    group.requestIdsWithoutPurchaseOrder.add(
      request.id,
    )
  }
}

function finalizeGroups(
  groups: Map<string, MutableGroup>,
  sortCurrency: string | null,
): PurchasingAnalyticsGroup[] {
  return [
    ...groups.values(),
  ]
    .map(
      (group) => ({
        key:
          group.key,
        label:
          group.label,

        purchaseOrders:
          group.purchaseOrderIds.size,
        purchaseOrderLines:
          group.purchaseOrderLineIds.size,
        purchaseRequests:
          group.purchaseRequestIds.size,

        orderedQuantity:
          group.orderedQuantity,
        amountsByCurrency:
          finalizeAmountsByCurrency(
            group.amounts,
            'lines',
          ),
        linesWithoutAmount:
          group.linesWithoutAmount,
        requestedQuantity:
          group.requestedQuantity,

        overduePurchaseOrders:
          group.overduePurchaseOrderIds.size,
        purchaseRequestsWithoutPurchaseOrder:
          group.requestIdsWithoutPurchaseOrder.size,
      }),
    )
    // By the amount in the default currency (USD), never across
    // currencies; selectPurchasingCurrencyView ranks any other currency.
    .sort(
      (left, right) =>
        compareCostDescending(
          sortCurrency
            ? left.amountsByCurrency[sortCurrency]?.amount ?? null
            : null,
          sortCurrency
            ? right.amountsByCurrency[sortCurrency]?.amount ?? null
            : null,
        ) ||
        right.purchaseOrders -
          left.purchaseOrders ||
        left.label.localeCompare(
          right.label,
        ),
    )
}

function calculateMedian(
  values: readonly number[],
): number | null {
  if (values.length === 0) {
    return null
  }

  const sorted =
    [...values].sort(
      (left, right) =>
        left - right,
    )

  const middle =
    Math.floor(
      sorted.length / 2,
    )

  if (
    sorted.length % 2 === 1
  ) {
    return sorted[middle]
  }

  return (
    sorted[middle - 1] +
    sorted[middle]
  ) / 2
}

function buildCycleSummary(
  requests: readonly BusinessPurchaseRequest[],
  ordersByNumber: ReadonlyMap<
    string,
    BusinessPurchaseOrder
  >,
): PurchasingCycleSummary {
  const cycleDays: number[] = []

  for (const request of requests) {
    const relatedPurchaseOrderNumber =
      request.relatedPurchaseOrderNumber

    if (!relatedPurchaseOrderNumber) {
      continue
    }

    const order =
      ordersByNumber.get(
        relatedPurchaseOrderNumber,
      )

    if (!order) {
      continue
    }

    const requestDate =
      parseDateOnly(
        request.requestDate,
      )

    const purchaseOrderDate =
      parseDateOnly(
        order.purchaseOrderDate,
      )

    if (
      !requestDate ||
      !purchaseOrderDate
    ) {
      continue
    }

    const days =
      diffDays(
        purchaseOrderDate,
        requestDate,
      )

    if (days >= 0) {
      cycleDays.push(days)
    }
  }

  if (cycleDays.length === 0) {
    return {
      comparableRequests: 0,
      averageDaysRequestToPurchaseOrder:
        null,
      medianDaysRequestToPurchaseOrder:
        null,
      minDaysRequestToPurchaseOrder:
        null,
      maxDaysRequestToPurchaseOrder:
        null,
    }
  }

  return {
    comparableRequests:
      cycleDays.length,

    averageDaysRequestToPurchaseOrder:
      cycleDays.reduce(
        (total, value) =>
          total + value,
        0,
      ) /
      cycleDays.length,

    medianDaysRequestToPurchaseOrder:
      calculateMedian(cycleDays),

    minDaysRequestToPurchaseOrder:
      Math.min(
        ...cycleDays,
      ),

    maxDaysRequestToPurchaseOrder:
      Math.max(
        ...cycleDays,
      ),
  }
}

export function buildPurchasingAnalytics(
  input: PurchasingAnalyticsInput,
): PurchasingAnalyticsReport {
  const referenceDateIso =
    toDateOnlyIso(
      input.referenceDate,
    )

  const referenceDate =
    parseDateOnly(
      referenceDateIso,
    ) ??
    new Date(
      `${referenceDateIso}T00:00:00Z`,
    )

  const ordersByNumber =
    new Map<
      string,
      BusinessPurchaseOrder
    >()

  const orderIds =
    new Set<string>()

  const supplierIds =
    new Set<string>()

  const buyers =
    new Set<string>()

  const brands =
    new Set<string>()

  const items =
    new Set<string>()

  const supplierGroups =
    new Map<
      string,
      MutableGroup
    >()

  const buyerGroups =
    new Map<
      string,
      MutableGroup
    >()

  const brandGroups =
    new Map<
      string,
      MutableGroup
    >()

  const itemGroups =
    new Map<
      string,
      MutableGroup
    >()

  const statusGroups =
    new Map<
      string,
      MutableStatusSummary
    >()

  const agingGroups =
    new Map<
      PurchasingAgingBucket,
      MutableAgingSummary
    >()

  const totalAmounts: MutableAmountsByCurrency =
    new Map()

  let openPurchaseOrders = 0
  let overduePurchaseOrders = 0
  let purchaseOrdersDueNext7Days = 0
  let purchaseOrdersWithoutCurrency = 0

  for (const order of input.orders) {
    ordersByNumber.set(
      order.purchaseOrderNumber,
      order,
    )

    if (
      !orderIds.has(order.id) &&
      normalizePurchasingCurrency(order.currency) ===
        PURCHASING_NO_CURRENCY
    ) {
      purchaseOrdersWithoutCurrency += 1
    }

    orderIds.add(order.id)

    const supplierKey =
      normalizeKey(
        order.supplierId ??
          order.supplierName,
        'SIN PROVEEDOR',
      )

    const supplierLabel =
      order.supplierName ??
      order.supplierId ??
      'Sin proveedor'

    supplierIds.add(
      supplierKey,
    )

    const overdue =
      isOverdueOrder(
        order,
        referenceDate,
      )

    if (!isClosedOrder(order)) {
      openPurchaseOrders += 1
    }

    if (overdue) {
      overduePurchaseOrders += 1
    }

    if (
      isDueWithinDays(
        order,
        referenceDate,
        7,
      )
    ) {
      purchaseOrdersDueNext7Days += 1
    }

    registerOrderInGroup(
      supplierGroups,
      supplierKey,
      supplierLabel,
      order,
      overdue,
    )

    addOrderToAmounts(
      totalAmounts,
      order,
      overdue,
    )

    const statusKey =
      normalizeKey(
        order.status,
        'SIN ESTADO',
      )

    const statusSummary =
      statusGroups.get(
        statusKey,
      ) ?? {
        purchaseOrderIds:
          new Set<string>(),
        purchaseRequestIds:
          new Set<string>(),
        amounts:
          new Map(),
        linesWithoutAmount: 0,
      }

    statusSummary
      .purchaseOrderIds
      .add(order.id)

    addOrderAmountToAmounts(
      statusSummary.amounts,
      order,
      overdue,
    )

    statusSummary
      .linesWithoutAmount +=
      order.linesWithoutAmount

    statusGroups.set(
      statusKey,
      statusSummary,
    )

    const agingBucket =
      classifyAging(
        order,
        referenceDate,
      )

    const agingSummary =
      agingGroups.get(
        agingBucket,
      ) ?? {
        purchaseOrderIds:
          new Set<string>(),
        amounts:
          new Map(),
        linesWithoutAmount: 0,
      }

    agingSummary
      .purchaseOrderIds
      .add(order.id)

    addOrderAmountToAmounts(
      agingSummary.amounts,
      order,
      overdue,
    )

    agingSummary
      .linesWithoutAmount +=
      order.linesWithoutAmount

    agingGroups.set(
      agingBucket,
      agingSummary,
    )
  }

  let orderedQuantity = 0
  let linesWithoutAmount = 0

  for (const line of input.lines) {
    orderedQuantity +=
      line.quantity ?? 0

    linesWithoutAmount +=
      line.amountForeignCurrency === null
        ? 1
        : 0

    const order =
      ordersByNumber.get(
        line.purchaseOrderNumber,
      )

    // The order's currency, as in status and aging; the line's only when
    // the order is not loaded.
    const currency =
      normalizePurchasingCurrency(
        order
          ? order.currency
          : line.currency,
      )

    addLineToAmounts(
      totalAmounts,
      line,
      currency,
    )

    const supplierKey =
      normalizeKey(
        order?.supplierId ??
          order?.supplierName,
        'SIN PROVEEDOR',
      )

    const supplierLabel =
      order?.supplierName ??
      order?.supplierId ??
      'Sin proveedor'

    registerLineInGroup(
      supplierGroups,
      supplierKey,
      supplierLabel,
      line,
      currency,
    )

    const brandKey =
      normalizeKey(
        line.brandId,
        'SIN MARCA',
      )

    brands.add(
      brandKey,
    )

    registerLineInGroup(
      brandGroups,
      brandKey,
      line.brandId ??
        'Sin marca',
      line,
      currency,
    )

    const itemKey =
      normalizeKey(
        line.itemCode,
        'SIN ARTICULO',
      )

    items.add(
      itemKey,
    )

    registerLineInGroup(
      itemGroups,
      itemKey,
      line.itemCode ??
        'Sin artículo',
      line,
      currency,
    )
  }

  let requestedQuantity = 0
  let purchaseRequestsWithoutPurchaseOrder =
    0
  let linkedPurchaseOrderExists = 0
  let orphanPurchaseOrderReferences = 0
  let linkedToSalesOrder = 0
  let linkedToProject = 0

  for (const request of input.requests) {
    requestedQuantity +=
      request.quantity ?? 0

    const relatedPurchaseOrderNumber =
      request.relatedPurchaseOrderNumber

    if (!relatedPurchaseOrderNumber) {
      purchaseRequestsWithoutPurchaseOrder +=
        1
    } else if (
      ordersByNumber.has(
        relatedPurchaseOrderNumber,
      )
    ) {
      linkedPurchaseOrderExists += 1
    } else {
      orphanPurchaseOrderReferences +=
        1
    }

    if (request.salesOrderNumber) {
      linkedToSalesOrder += 1
    }

    if (request.projectId) {
      linkedToProject += 1
    }

    const buyerKey =
      normalizeKey(
        request.assignedBuyer,
        'SIN COMPRADOR',
      )

    buyers.add(
      buyerKey,
    )

    registerRequestInGroup(
      buyerGroups,
      buyerKey,
      request.assignedBuyer ??
        'Sin comprador',
      request,
    )

    const brandKey =
      normalizeKey(
        request.brandId,
        'SIN MARCA',
      )

    brands.add(
      brandKey,
    )

    registerRequestInGroup(
      brandGroups,
      brandKey,
      request.brandId ??
        'Sin marca',
      request,
    )

    const itemKey =
      normalizeKey(
        request.itemCode,
        'SIN ARTICULO',
      )

    items.add(
      itemKey,
    )

    registerRequestInGroup(
      itemGroups,
      itemKey,
      request.itemCode ??
        'Sin artículo',
      request,
    )

    if (relatedPurchaseOrderNumber) {
      const relatedOrder =
        ordersByNumber.get(
          relatedPurchaseOrderNumber,
        )

      if (relatedOrder) {
        const supplierKey =
          normalizeKey(
            relatedOrder.supplierId ??
              relatedOrder.supplierName,
            'SIN PROVEEDOR',
          )

        const supplierLabel =
          relatedOrder.supplierName ??
          relatedOrder.supplierId ??
          'Sin proveedor'

        registerRequestInGroup(
          supplierGroups,
          supplierKey,
          supplierLabel,
          request,
        )
      }
    }

    const requestStatusKey =
      normalizeKey(
        request.requestStatus,
        'SIN ESTADO',
      )

    const statusSummary =
      statusGroups.get(
        requestStatusKey,
      ) ?? {
        purchaseOrderIds:
          new Set<string>(),
        purchaseRequestIds:
          new Set<string>(),
        amounts:
          new Map(),
        linesWithoutAmount: 0,
      }

    statusSummary
      .purchaseRequestIds
      .add(request.id)

    statusGroups.set(
      requestStatusKey,
      statusSummary,
    )
  }

  const linkedToPurchaseOrder =
    input.requests.length -
    purchaseRequestsWithoutPurchaseOrder

  const totals: PurchasingAnalyticsTotals = {
    purchaseOrders:
      orderIds.size,
    purchaseOrderLines:
      input.lines.length,
    purchaseRequests:
      input.requests.length,

    openPurchaseOrders,
    overduePurchaseOrders,
    purchaseOrdersDueNext7Days,

    purchaseRequestsWithoutPurchaseOrder,
    purchaseRequestsWithPurchaseOrder:
      linkedToPurchaseOrder,

    orderedQuantity,
    amountsByCurrency:
      finalizeAmountsByCurrency(
        totalAmounts,
        'lines',
      ),
    currencies:
      [...totalAmounts.keys()].sort(
        comparePurchasingCurrencies,
      ),
    purchaseOrdersWithoutCurrency,
    linesWithoutAmount,
    requestedQuantity,

    suppliers:
      supplierIds.size,
    buyers:
      buyers.size,
    brands:
      brands.size,
    items:
      items.size,

    linkedRequestRate:
      safeRatio(
        linkedToPurchaseOrder,
        input.requests.length,
      ),

    overdueOrderRate:
      safeRatio(
        overduePurchaseOrders,
        openPurchaseOrders,
      ),
  }

  const linkage: PurchasingLinkageSummary = {
    purchaseRequests:
      input.requests.length,
    linkedToPurchaseOrder,
    withoutPurchaseOrder:
      purchaseRequestsWithoutPurchaseOrder,
    linkedPurchaseOrderExists,
    orphanPurchaseOrderReferences,
    linkedToSalesOrder,
    linkedToProject,
  }

  const cycle =
    buildCycleSummary(
      input.requests,
      ordersByNumber,
    )

  const byStatus =
    [...statusGroups.entries()]
      .map(
        ([
          status,
          summary,
        ]) => ({
          status,

          purchaseOrders:
            summary
              .purchaseOrderIds
              .size,

          purchaseRequests:
            summary
              .purchaseRequestIds
              .size,

          amountsByCurrency:
            finalizeAmountsByCurrency(
              summary.amounts,
              'orders',
            ),

          linesWithoutAmount:
            summary
              .linesWithoutAmount,
        }),
      )
      .sort(
        (left, right) =>
          right.purchaseOrders -
            left.purchaseOrders ||
          right.purchaseRequests -
            left.purchaseRequests ||
          left.status.localeCompare(
            right.status,
          ),
      )

  const aging =
    AGING_BUCKET_ORDER.map(
      (bucket) => {
        const summary =
          agingGroups.get(bucket)

        return {
          bucket,

          purchaseOrders:
            summary
              ?.purchaseOrderIds
              .size ?? 0,

          amountsByCurrency:
            summary
              ? finalizeAmountsByCurrency(
                  summary.amounts,
                  'orders',
                )
              : {},

          linesWithoutAmount:
            summary
              ?.linesWithoutAmount ??
            0,
        }
      },
    )

  const sortCurrency =
    defaultPurchasingCurrency(
      totals.currencies,
    )

  return {
    generatedAt:
      new Date().toISOString(),
    referenceDate:
      referenceDateIso,

    totals,
    linkage,
    cycle,

    bySupplier:
      finalizeGroups(
        supplierGroups,
        sortCurrency,
      ),

    byBuyer:
      finalizeGroups(
        buyerGroups,
        sortCurrency,
      ),

    byBrand:
      finalizeGroups(
        brandGroups,
        sortCurrency,
      ),

    byItem:
      finalizeGroups(
        itemGroups,
        sortCurrency,
      ),

    byStatus,
    aging,
  }
}

export interface PurchasingCurrencyGroup {
  key: string
  label: string

  purchaseOrders: number
  purchaseOrderLines: number
  purchaseRequests: number

  orderedQuantity: number
  // Amount in the view's currency only.
  amount: number | null
  linesWithoutAmount: number

  overduePurchaseOrders: number
}

export interface PurchasingCurrencyStatus {
  status: string
  purchaseOrders: number
  amount: number | null
  linesWithoutAmount: number
}

export interface PurchasingCurrencyAging {
  bucket: PurchasingAgingBucket
  purchaseOrders: number
  amount: number | null
  linesWithoutAmount: number
}

export interface PurchasingCurrencyView {
  currency: string
  // Orders in the view's currency and in every other one.
  purchaseOrders: number
  purchaseOrdersInOtherCurrencies: number

  bySupplier: PurchasingCurrencyGroup[]
  byBuyer: PurchasingCurrencyGroup[]
  byBrand: PurchasingCurrencyGroup[]
  byItem: PurchasingCurrencyGroup[]

  byStatus: PurchasingCurrencyStatus[]
  aging: PurchasingCurrencyAging[]
}

/** USD when present; otherwise the first currency. */
export function defaultPurchasingCurrency(
  currencies: readonly string[],
): string | null {
  return currencies.includes('USD')
    ? 'USD'
    : currencies[0] ?? null
}

function toCurrencyGroup(
  group: PurchasingAnalyticsGroup,
  entry: PurchasingCurrencyAmount | undefined,
): PurchasingCurrencyGroup {
  return {
    key: group.key,
    label: group.label,

    purchaseOrders:
      entry?.purchaseOrders ?? 0,
    purchaseOrderLines:
      entry?.purchaseOrderLines ?? 0,
    // Requests have no currency: the group's requests.
    purchaseRequests:
      group.purchaseRequests,

    orderedQuantity:
      entry?.orderedQuantity ?? 0,
    amount:
      entry ? entry.amount : 0,
    linesWithoutAmount:
      entry?.linesWithoutAmount ?? 0,

    overduePurchaseOrders:
      entry?.overduePurchaseOrders ?? 0,
  }
}

// Only the groups with orders in the currency, by their amount in it.
function rankByCurrency(
  groups: readonly PurchasingAnalyticsGroup[],
  currency: string,
): PurchasingCurrencyGroup[] {
  return groups
    .filter(
      (group) =>
        (group.amountsByCurrency[currency]
          ?.purchaseOrders ?? 0) > 0,
    )
    .map(
      (group) =>
        toCurrencyGroup(
          group,
          group.amountsByCurrency[currency],
        ),
    )
    .sort(
      (left, right) =>
        compareCostDescending(
          left.amount,
          right.amount,
        ) ||
        right.purchaseOrders -
          left.purchaseOrders ||
        left.label.localeCompare(
          right.label,
        ),
    )
}

/**
 * Rankings, status and aging of one currency. Orders in other currencies
 * are left out, never converted.
 */
export function selectPurchasingCurrencyView(
  report: PurchasingAnalyticsReport,
  currency: string,
): PurchasingCurrencyView {
  const purchaseOrders =
    report.totals.amountsByCurrency[currency]
      ?.purchaseOrders ?? 0

  return {
    currency,
    purchaseOrders,
    purchaseOrdersInOtherCurrencies:
      Object.entries(
        report.totals.amountsByCurrency,
      )
        .filter(([code]) => code !== currency)
        .reduce(
          (total, [, entry]) =>
            total + entry.purchaseOrders,
          0,
        ),

    bySupplier:
      rankByCurrency(
        report.bySupplier,
        currency,
      ),
    // Buyers come from requests, which have no amount or currency.
    byBuyer:
      report.byBuyer.map(
        (group) =>
          toCurrencyGroup(
            group,
            group.amountsByCurrency[currency],
          ),
      ),
    byBrand:
      rankByCurrency(
        report.byBrand,
        currency,
      ),
    byItem:
      rankByCurrency(
        report.byItem,
        currency,
      ),

    byStatus:
      report.byStatus
        .filter(
          (summary) =>
            (summary.amountsByCurrency[currency]
              ?.purchaseOrders ?? 0) > 0,
        )
        .map(
          (summary) => {
            const entry =
              summary.amountsByCurrency[currency]

            return {
              status: summary.status,
              purchaseOrders:
                entry?.purchaseOrders ?? 0,
              amount:
                entry ? entry.amount : 0,
              linesWithoutAmount:
                entry?.linesWithoutAmount ?? 0,
            }
          },
        ),

    aging:
      report.aging.map(
        (summary) => {
          const entry =
            summary.amountsByCurrency[currency]

          return {
            bucket: summary.bucket,
            purchaseOrders:
              entry?.purchaseOrders ?? 0,
            amount:
              entry ? entry.amount : 0,
            linesWithoutAmount:
              entry?.linesWithoutAmount ?? 0,
          }
        },
      ),
  }
}
