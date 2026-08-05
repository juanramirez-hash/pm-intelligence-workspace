import type {
  NormalizedPurchaseRequestRow,
} from '../../../features/data-center/importers/purchase-requests/purchaseRequestTypes'

import type {
  BusinessPurchaseRequest,
} from '../entities/purchaseRequest'

export interface BusinessPurchaseRequestsResult {
  requests: Map<string, BusinessPurchaseRequest>
}

function normalizeIdentifier(
  value: string | null,
): string | null {
  const normalized =
    value
      ?.trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalized || null
}

export function buildBusinessPurchaseRequests(
  rows: readonly NormalizedPurchaseRequestRow[],
): BusinessPurchaseRequestsResult {
  const requests =
    new Map<
      string,
      BusinessPurchaseRequest
    >()

  for (const row of rows) {
    const purchaseRequestId =
      normalizeIdentifier(
        row.purchaseRequestNumber,
      ) ??
      row.purchaseRequestNumber

    requests.set(
      purchaseRequestId,
      {
        id:
          purchaseRequestId,
        purchaseRequestNumber:
          purchaseRequestId,

        sourceRowNumber:
          row.sourceRowNumber,
        duplicateOccurrences:
          row.duplicateOccurrences,
        sourceInternalId:
          row.sourceInternalId,

        requestDate:
          row.requestDate,
        periodId:
          row.periodId,

        salesOrderNumber:
          normalizeIdentifier(
            row.salesOrderNumber,
          ),
        relatedPurchaseOrderNumber:
          normalizeIdentifier(
            row.relatedPurchaseOrderNumber,
          ),

        requestStatus:
          row.requestStatus,
        sourceItemStatus:
          row.sourceItemStatus,
        orderStatus:
          row.orderStatus,

        itemCode:
          normalizeIdentifier(
            row.itemCode,
          ),
        brandId:
          normalizeIdentifier(
            row.brand,
          ),
        model:
          row.model,
        description:
          row.description,
        quantity:
          row.quantity,

        cashAuthorizationStatus:
          row.cashAuthorizationStatus,
        advancePaymentNote:
          row.advancePaymentNote,
        alreadyOrderedStatus:
          row.alreadyOrderedStatus,
        executiveName:
          row.executiveName,

        stockQuantity:
          row.stockQuantity,
        availableForSaleQuantity:
          row.availableForSaleQuantity,

        cashReleaseDate:
          row.cashReleaseDate,
        requestExpirationDate:
          row.requestExpirationDate,
        expectedPurchaseOrderArrivalDate:
          row.expectedPurchaseOrderArrivalDate,

        preferredSupplierName:
          row.preferredSupplierName,
        actualSupplierName:
          row.actualSupplierName,

        branch:
          normalizeIdentifier(
            row.branch,
          ),
        itemBlockedForRequestStatus:
          row.itemBlockedForRequestStatus,
        rmaOrderStatus:
          row.rmaOrderStatus,
        purchasingTrafficComments:
          row.purchasingTrafficComments,

        projectId:
          normalizeIdentifier(
            row.projectId,
          ),
        projectEstimatedDeliveryDate:
          row.projectEstimatedDeliveryDate,
        requestEstimatedDeliveryDate:
          row.requestEstimatedDeliveryDate,

        createdBy:
          row.createdBy,
        sourceElapsedDays:
          row.sourceElapsedDays,
        expressShippingPaidStatus:
          row.expressShippingPaidStatus,
        projectWarehouseOrderStatus:
          row.projectWarehouseOrderStatus,
        assignedBuyer:
          row.assignedBuyer,
        processDate:
          row.processDate,
      },
    )
  }

  return {
    requests,
  }
}