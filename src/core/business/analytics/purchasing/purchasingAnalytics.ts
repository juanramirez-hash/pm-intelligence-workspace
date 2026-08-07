import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../../entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../entities/purchaseRequest'

export type PurchasingAgingBucket =
  | 'current'
  | '1_7_days'
  | '8_15_days'
  | '16_30_days'
  | '31_plus_days'
  | 'undated'

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
  orderedAmountForeignCurrency: number
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
  orderedAmountForeignCurrency: number
  requestedQuantity: number

  overduePurchaseOrders: number
  purchaseRequestsWithoutPurchaseOrder: number
}

export interface PurchasingStatusSummary {
  status: string
  purchaseOrders: number
  purchaseRequests: number
  orderedAmountForeignCurrency: number
}

export interface PurchasingAgingSummary {
  bucket: PurchasingAgingBucket
  purchaseOrders: number
  orderedAmountForeignCurrency: number
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
  orderedAmountForeignCurrency: number
  requestedQuantity: number

  overduePurchaseOrderIds: Set<string>
  requestIdsWithoutPurchaseOrder: Set<string>
}

interface MutableStatusSummary {
  purchaseOrderIds: Set<string>
  purchaseRequestIds: Set<string>
  orderedAmountForeignCurrency: number
}

interface MutableAgingSummary {
  purchaseOrderIds: Set<string>
  orderedAmountForeignCurrency: number
}

const CLOSED_STATUS_TOKENS = [
  'CLOSED',
  'CERRADA',
  'CERRADO',
  'CANCELLED',
  'CANCELED',
  'CANCELADA',
  'CANCELADO',
  'RECEIVED',
  'RECIBIDA',
  'RECIBIDO',
  'COMPLETED',
  'COMPLETADA',
  'COMPLETADO',
] as const

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
  const normalizedStatus =
    normalizeKey(
      order.status,
      '',
    )

  if (!normalizedStatus) {
    return false
  }

  return CLOSED_STATUS_TOKENS.some(
    (token) =>
      normalizedStatus.includes(token),
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
    orderedAmountForeignCurrency: 0,
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
}

function registerLineInGroup(
  groups: Map<string, MutableGroup>,
  key: string,
  label: string,
  line: BusinessPurchaseOrderLine,
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

  group.orderedAmountForeignCurrency +=
    line.amountForeignCurrency ?? 0
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
        orderedAmountForeignCurrency:
          group.orderedAmountForeignCurrency,
        requestedQuantity:
          group.requestedQuantity,

        overduePurchaseOrders:
          group.overduePurchaseOrderIds.size,
        purchaseRequestsWithoutPurchaseOrder:
          group.requestIdsWithoutPurchaseOrder.size,
      }),
    )
    .sort(
      (left, right) =>
        right
          .orderedAmountForeignCurrency -
          left
            .orderedAmountForeignCurrency ||
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

  let openPurchaseOrders = 0
  let overduePurchaseOrders = 0
  let purchaseOrdersDueNext7Days = 0

  for (const order of input.orders) {
    ordersByNumber.set(
      order.purchaseOrderNumber,
      order,
    )

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
        orderedAmountForeignCurrency:
          0,
      }

    statusSummary
      .purchaseOrderIds
      .add(order.id)

    statusSummary
      .orderedAmountForeignCurrency +=
      order.amountForeignCurrency

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
        orderedAmountForeignCurrency:
          0,
      }

    agingSummary
      .purchaseOrderIds
      .add(order.id)

    agingSummary
      .orderedAmountForeignCurrency +=
      order.amountForeignCurrency

    agingGroups.set(
      agingBucket,
      agingSummary,
    )
  }

  let orderedQuantity = 0
  let orderedAmountForeignCurrency = 0

  for (const line of input.lines) {
    orderedQuantity +=
      line.quantity ?? 0

    orderedAmountForeignCurrency +=
      line.amountForeignCurrency ?? 0

    const order =
      ordersByNumber.get(
        line.purchaseOrderNumber,
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
        orderedAmountForeignCurrency:
          0,
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
    orderedAmountForeignCurrency,
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

          orderedAmountForeignCurrency:
            summary
              .orderedAmountForeignCurrency,
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

          orderedAmountForeignCurrency:
            summary
              ?.orderedAmountForeignCurrency ??
            0,
        }
      },
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
      ),

    byBuyer:
      finalizeGroups(
        buyerGroups,
      ),

    byBrand:
      finalizeGroups(
        brandGroups,
      ),

    byItem:
      finalizeGroups(
        itemGroups,
      ),

    byStatus,
    aging,
  }
}