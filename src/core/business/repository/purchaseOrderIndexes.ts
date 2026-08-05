import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../entities/purchaseOrder'

import type {
  BusinessDataModel,
} from '../models'

export interface PurchaseOrderIndexes {
  ordersByNumber:
    Map<string, BusinessPurchaseOrder>

  ordersByPeriod:
    Map<string, BusinessPurchaseOrder[]>

  ordersBySupplier:
    Map<string, BusinessPurchaseOrder[]>

  ordersByStatus:
    Map<string, BusinessPurchaseOrder[]>

  linesByOrder:
    Map<string, BusinessPurchaseOrderLine[]>

  linesByPeriod:
    Map<string, BusinessPurchaseOrderLine[]>

  linesByItemCode:
    Map<string, BusinessPurchaseOrderLine[]>

  linesByBrand:
    Map<string, BusinessPurchaseOrderLine[]>
}

function normalizeIndexValue(
  value: string | null,
): string | null {
  const normalized =
    value
      ?.trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalized || null
}

function push<T>(
  index: Map<string, T[]>,
  key: string,
  value: T,
): void {
  const items =
    index.get(key) ?? []

  items.push(value)
  index.set(key, items)
}

export function buildPurchaseOrderIndexes(
  model: BusinessDataModel,
): PurchaseOrderIndexes {
  const ordersByNumber =
    new Map<
      string,
      BusinessPurchaseOrder
    >()

  const ordersByPeriod =
    new Map<
      string,
      BusinessPurchaseOrder[]
    >()

  const ordersBySupplier =
    new Map<
      string,
      BusinessPurchaseOrder[]
    >()

  const ordersByStatus =
    new Map<
      string,
      BusinessPurchaseOrder[]
    >()

  const linesByOrder =
    new Map<
      string,
      BusinessPurchaseOrderLine[]
    >()

  const linesByPeriod =
    new Map<
      string,
      BusinessPurchaseOrderLine[]
    >()

  const linesByItemCode =
    new Map<
      string,
      BusinessPurchaseOrderLine[]
    >()

  const linesByBrand =
    new Map<
      string,
      BusinessPurchaseOrderLine[]
    >()

  for (
    const order of
    model.purchaseOrders?.values() ?? []
  ) {
    const orderNumber =
      normalizeIndexValue(
        order.purchaseOrderNumber,
      ) ??
      order.purchaseOrderNumber

    ordersByNumber.set(
      orderNumber,
      order,
    )

    push(
      ordersByPeriod,
      order.periodId,
      order,
    )

    const supplierKey =
      normalizeIndexValue(
        order.supplierId ??
        order.supplierName,
      )

    if (supplierKey) {
      push(
        ordersBySupplier,
        supplierKey,
        order,
      )
    }

    const statusKey =
      normalizeIndexValue(
        order.status,
      )

    if (statusKey) {
      push(
        ordersByStatus,
        statusKey,
        order,
      )
    }
  }

  for (
    const line of
    model.purchaseOrderLines?.values() ?? []
  ) {
    push(
      linesByOrder,
      line.purchaseOrderId,
      line,
    )

    push(
      linesByPeriod,
      line.periodId,
      line,
    )

    if (line.itemCode) {
      push(
        linesByItemCode,
        line.itemCode,
        line,
      )
    }

    if (line.brandId) {
      push(
        linesByBrand,
        line.brandId,
        line,
      )
    }
  }

  return {
    ordersByNumber,
    ordersByPeriod,
    ordersBySupplier,
    ordersByStatus,
    linesByOrder,
    linesByPeriod,
    linesByItemCode,
    linesByBrand,
  }
}