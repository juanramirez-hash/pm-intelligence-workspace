import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../../../core/business/entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../../core/business/entities/purchaseRequest'

import {
  buildPurchasingAnalytics,
} from '../../../core/business/analytics/purchasing'

import type {
  PurchasingAgingBucket,
  PurchasingAnalyticsGroup,
  PurchasingAnalyticsReport,
} from '../../../core/business/analytics/purchasing'

export type PurchasingWorkspaceDimension =
  | 'supplier'
  | 'buyer'
  | 'brand'
  | 'item'

export interface PurchasingWorkspaceFilters {
  search: string
  supplierId: string
  buyer: string
  brandId: string
  itemCode: string
  status: string
  agingBucket: PurchasingAgingBucket | 'all'
}

export interface PurchasingWorkspaceModel {
  available: boolean
  analytics: PurchasingAnalyticsReport | null

  orders: BusinessPurchaseOrder[]
  lines: BusinessPurchaseOrderLine[]
  requests: BusinessPurchaseRequest[]

  suppliers: string[]
  buyers: string[]
  brands: string[]
  items: string[]
  statuses: string[]
}

export const DEFAULT_PURCHASING_WORKSPACE_FILTERS:
  PurchasingWorkspaceFilters = {
    search: '',
    supplierId: 'all',
    buyer: 'all',
    brandId: 'all',
    itemCode: 'all',
    status: 'all',
    agingBucket: 'all',
  }

function normalizeSearchValue(
  value: string | null | undefined,
): string {
  return value
    ?.trim()
    .toLocaleUpperCase('es-MX') ?? ''
}

export function matchesPurchasingSearch(
  value: string,
  search: string,
): boolean {
  const normalizedSearch =
    normalizeSearchValue(search)

  return normalizedSearch.length === 0 ||
    normalizeSearchValue(value)
      .includes(normalizedSearch)
}

function uniqueSorted(
  values: readonly (
    string | null | undefined
  )[],
): string[] {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter(
          (value): value is string =>
            Boolean(value),
        ),
    ),
  ].sort((left, right) =>
    left.localeCompare(
      right,
      'es-MX',
      {
        sensitivity: 'base',
      },
    ),
  )
}

function isClosedOrder(
  order: BusinessPurchaseOrder,
): boolean {
  const status =
    normalizeSearchValue(
      order.status,
    )

  const closedTokens = [
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
  ]

  return closedTokens.some(
    (token) =>
      status.includes(token),
  )
}

function getOrderAgingBucket(
  order: BusinessPurchaseOrder,
  referenceDateValue: string,
): PurchasingAgingBucket | null {
  if (!order.expectedReceiptDate) {
    return 'undated'
  }

  if (isClosedOrder(order)) {
    return 'current'
  }

  const referenceDate =
    new Date(
      `${referenceDateValue.slice(0, 10)}T00:00:00Z`,
    )

  const expectedReceiptDate =
    new Date(
      `${order.expectedReceiptDate.slice(0, 10)}T00:00:00Z`,
    )

  if (
    Number.isNaN(
      referenceDate.getTime(),
    ) ||
    Number.isNaN(
      expectedReceiptDate.getTime(),
    )
  ) {
    return null
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000

  const overdueDays =
    Math.floor(
      (
        referenceDate.getTime() -
        expectedReceiptDate.getTime()
      ) / millisecondsPerDay,
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

export function buildPurchasingWorkspaceModel(
  orders: readonly BusinessPurchaseOrder[],
  lines: readonly BusinessPurchaseOrderLine[],
  requests: readonly BusinessPurchaseRequest[],
  referenceDate?: string,
): PurchasingWorkspaceModel {
  const analytics =
    buildPurchasingAnalytics({
      orders,
      lines,
      requests,
      ...(referenceDate
        ? { referenceDate }
        : {}),
    })

  const suppliers =
    uniqueSorted([
      ...orders.map(
        (order) =>
          order.supplierId ??
          order.supplierName,
      ),
      ...requests.flatMap(
        (request) => [
          request.actualSupplierName,
          request.preferredSupplierName,
        ],
      ),
    ])

  const buyers =
    uniqueSorted([
      ...orders.map(
        (order) =>
          order.purchasingExecutive,
      ),
      ...requests.map(
        (request) =>
          request.assignedBuyer,
      ),
    ])

  const brands =
    uniqueSorted([
      ...lines.map(
        (line) =>
          line.brandId,
      ),
      ...orders.flatMap(
        (order) =>
          [...order.brandIds],
      ),
      ...requests.map(
        (request) =>
          request.brandId,
      ),
    ])

  const items =
    uniqueSorted([
      ...lines.map(
        (line) =>
          line.itemCode,
      ),
      ...orders.flatMap(
        (order) =>
          [...order.itemCodes],
      ),
      ...requests.map(
        (request) =>
          request.itemCode,
      ),
    ])

  const statuses =
    uniqueSorted([
      ...orders.map(
        (order) =>
          order.status,
      ),
      ...requests.map(
        (request) =>
          request.requestStatus,
      ),
    ])

  return {
    available:
      orders.length > 0 ||
      lines.length > 0 ||
      requests.length > 0,

    analytics,
    orders: [...orders],
    lines: [...lines],
    requests: [...requests],

    suppliers,
    buyers,
    brands,
    items,
    statuses,
  }
}

export function buildPurchasingWorkspaceAnalytics(
  orders: readonly BusinessPurchaseOrder[],
  lines: readonly BusinessPurchaseOrderLine[],
  requests: readonly BusinessPurchaseRequest[],
  referenceDate: string,
): PurchasingAnalyticsReport {
  return buildPurchasingAnalytics({
    orders,
    lines,
    requests,
    referenceDate,
  })
}

export function getPurchasingWorkspaceGroups(
  report: PurchasingAnalyticsReport,
  dimension: PurchasingWorkspaceDimension,
): PurchasingAnalyticsGroup[] {
  if (dimension === 'supplier') {
    return report.bySupplier.map(
      (group) => ({ ...group }),
    )
  }

  if (dimension === 'buyer') {
    return report.byBuyer.map(
      (group) => ({ ...group }),
    )
  }

  if (dimension === 'brand') {
    return report.byBrand.map(
      (group) => ({ ...group }),
    )
  }

  return report.byItem.map(
    (group) => ({ ...group }),
  )
}

export function filterPurchasingGroups(
  groups: readonly PurchasingAnalyticsGroup[],
  search: string,
): PurchasingAnalyticsGroup[] {
  return groups.filter(
    (group) =>
      matchesPurchasingSearch(
        `${group.label} ${group.key}`,
        search,
      ),
  )
}

export function filterPurchasingOrders(
  orders: readonly BusinessPurchaseOrder[],
  filters: PurchasingWorkspaceFilters,
  referenceDate: string,
): BusinessPurchaseOrder[] {
  return orders.filter((order) => {
    if (
      filters.supplierId !== 'all' &&
      order.supplierId !==
        filters.supplierId &&
      order.supplierName !==
        filters.supplierId
    ) {
      return false
    }

    if (
      filters.buyer !== 'all' &&
      order.purchasingExecutive !==
        filters.buyer
    ) {
      return false
    }

    if (
      filters.brandId !== 'all' &&
      !order.brandIds.has(
        filters.brandId,
      )
    ) {
      return false
    }

    if (
      filters.itemCode !== 'all' &&
      !order.itemCodes.has(
        filters.itemCode,
      )
    ) {
      return false
    }

    if (
      filters.status !== 'all' &&
      normalizeSearchValue(
        order.status,
      ) !==
        normalizeSearchValue(
          filters.status,
        )
    ) {
      return false
    }

    if (
      filters.agingBucket !== 'all' &&
      getOrderAgingBucket(
        order,
        referenceDate,
      ) !== filters.agingBucket
    ) {
      return false
    }

    return matchesPurchasingSearch(
      [
        order.purchaseOrderNumber,
        order.purchaseOrderReference ?? '',
        order.supplierId ?? '',
        order.supplierName ?? '',
        order.purchasingExecutive ?? '',
        order.status ?? '',
        ...order.brandIds,
        ...order.itemCodes,
      ].join(' '),
      filters.search,
    )
  })
}

export function filterPurchasingLines(
  lines: readonly BusinessPurchaseOrderLine[],
  orders: readonly BusinessPurchaseOrder[],
): BusinessPurchaseOrderLine[] {
  const orderIds =
    new Set(
      orders.map(
        (order) => order.id,
      ),
    )

  return lines.filter(
    (line) =>
      orderIds.has(
        line.purchaseOrderId,
      ),
  )
}

export function filterPurchasingRequests(
  requests: readonly BusinessPurchaseRequest[],
  filters: PurchasingWorkspaceFilters,
): BusinessPurchaseRequest[] {
  return requests.filter(
    (request) => {
      if (
        filters.supplierId !== 'all' &&
        request.actualSupplierName !==
          filters.supplierId &&
        request.preferredSupplierName !==
          filters.supplierId
      ) {
        return false
      }

      if (
        filters.buyer !== 'all' &&
        request.assignedBuyer !==
          filters.buyer
      ) {
        return false
      }

      if (
        filters.brandId !== 'all' &&
        request.brandId !==
          filters.brandId
      ) {
        return false
      }

      if (
        filters.itemCode !== 'all' &&
        request.itemCode !==
          filters.itemCode
      ) {
        return false
      }

      if (
        filters.status !== 'all' &&
        normalizeSearchValue(
          request.requestStatus,
        ) !==
          normalizeSearchValue(
            filters.status,
          )
      ) {
        return false
      }

      return matchesPurchasingSearch(
        [
          request.purchaseRequestNumber,
          request.salesOrderNumber ?? '',
          request.relatedPurchaseOrderNumber ?? '',
          request.itemCode ?? '',
          request.brandId ?? '',
          request.description ?? '',
          request.assignedBuyer ?? '',
          request.preferredSupplierName ?? '',
          request.actualSupplierName ?? '',
          request.requestStatus ?? '',
          request.projectId ?? '',
        ].join(' '),
        filters.search,
      )
    },
  )
}