import type {
  BusinessPurchaseRequest,
} from '../entities/purchaseRequest'

import type {
  BusinessDataModel,
} from '../models'

export interface PurchaseRequestIndexes {
  requestsByNumber:
    Map<string, BusinessPurchaseRequest>

  requestsByPeriod:
    Map<string, BusinessPurchaseRequest[]>

  requestsByPurchaseOrder:
    Map<string, BusinessPurchaseRequest[]>

  requestsBySalesOrder:
    Map<string, BusinessPurchaseRequest[]>

  requestsByProject:
    Map<string, BusinessPurchaseRequest[]>

  requestsByStatus:
    Map<string, BusinessPurchaseRequest[]>

  requestsByItemCode:
    Map<string, BusinessPurchaseRequest[]>

  requestsByBrand:
    Map<string, BusinessPurchaseRequest[]>

  requestsByBuyer:
    Map<string, BusinessPurchaseRequest[]>
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

export function buildPurchaseRequestIndexes(
  model: BusinessDataModel,
): PurchaseRequestIndexes {
  const requestsByNumber =
    new Map<
      string,
      BusinessPurchaseRequest
    >()

  const requestsByPeriod =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  const requestsByPurchaseOrder =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  const requestsBySalesOrder =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  const requestsByProject =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  const requestsByStatus =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  const requestsByItemCode =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  const requestsByBrand =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  const requestsByBuyer =
    new Map<
      string,
      BusinessPurchaseRequest[]
    >()

  for (
    const request of
    model.purchaseRequests?.values() ?? []
  ) {
    const requestNumber =
      normalizeIndexValue(
        request.purchaseRequestNumber,
      ) ??
      request.purchaseRequestNumber

    requestsByNumber.set(
      requestNumber,
      request,
    )

    push(
      requestsByPeriod,
      request.periodId,
      request,
    )

    if (
      request.relatedPurchaseOrderNumber
    ) {
      push(
        requestsByPurchaseOrder,
        request.relatedPurchaseOrderNumber,
        request,
      )
    }

    if (request.salesOrderNumber) {
      push(
        requestsBySalesOrder,
        request.salesOrderNumber,
        request,
      )
    }

    if (request.projectId) {
      push(
        requestsByProject,
        request.projectId,
        request,
      )
    }

    const statusKey =
      normalizeIndexValue(
        request.requestStatus,
      )

    if (statusKey) {
      push(
        requestsByStatus,
        statusKey,
        request,
      )
    }

    if (request.itemCode) {
      push(
        requestsByItemCode,
        request.itemCode,
        request,
      )
    }

    if (request.brandId) {
      push(
        requestsByBrand,
        request.brandId,
        request,
      )
    }

    const buyerKey =
      normalizeIndexValue(
        request.assignedBuyer,
      )

    if (buyerKey) {
      push(
        requestsByBuyer,
        buyerKey,
        request,
      )
    }
  }

  return {
    requestsByNumber,
    requestsByPeriod,
    requestsByPurchaseOrder,
    requestsBySalesOrder,
    requestsByProject,
    requestsByStatus,
    requestsByItemCode,
    requestsByBrand,
    requestsByBuyer,
  }
}