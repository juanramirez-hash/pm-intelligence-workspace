import type {
  NormalizedPurchaseRequestRow,
  PurchaseRequestDatasetSummary,
} from './purchaseRequestTypes'

export interface PurchaseRequestBusinessModel {
  requests: NormalizedPurchaseRequestRow[]
  summary: PurchaseRequestDatasetSummary
}

export function mergePurchaseRequestRows(
  existingRows:
    readonly NormalizedPurchaseRequestRow[],
  incomingRows:
    readonly NormalizedPurchaseRequestRow[],
): NormalizedPurchaseRequestRow[] {
  const incomingRequestNumbers = new Set(
    incomingRows.map(
      (row) => row.purchaseRequestNumber,
    ),
  )

  const rowsByRequestNumber = new Map<
    string,
    NormalizedPurchaseRequestRow
  >()

  for (const row of existingRows) {
    if (
      !incomingRequestNumbers.has(
        row.purchaseRequestNumber,
      )
    ) {
      rowsByRequestNumber.set(
        row.purchaseRequestNumber,
        row,
      )
    }
  }

  for (const row of incomingRows) {
    rowsByRequestNumber.set(
      row.purchaseRequestNumber,
      row,
    )
  }

  return [...rowsByRequestNumber.values()]
    .sort(
      (left, right) =>
        left.requestDate.localeCompare(
          right.requestDate,
        ) ||
        left.purchaseRequestNumber.localeCompare(
          right.purchaseRequestNumber,
        ),
    )
}

export function buildPurchaseRequestBusinessModel(
  rows:
    readonly NormalizedPurchaseRequestRow[],
  ignoredRows = 0,
): PurchaseRequestBusinessModel {
  const requests =
    mergePurchaseRequestRows([], rows)

  const dates = requests
    .map(
      (request) =>
        request.requestDate,
    )
    .sort()

  const statusCounts =
    new Map<string, number>()

  for (const request of requests) {
    const status =
      request.requestStatus ??
      'Sin estado'

    statusCounts.set(
      status,
      (
        statusCounts.get(status) ?? 0
      ) + 1,
    )
  }

  return {
    requests,

    summary: {
      periodStart:
        dates[0] ?? null,
      periodEnd:
        dates.at(-1) ?? null,

      totalRequests:
        requests.length,

      requestsWithPurchaseOrder:
        requests.filter(
          (request) =>
            Boolean(
              request
                .relatedPurchaseOrderNumber,
            ),
        ).length,

      requestsWithoutPurchaseOrder:
        requests.filter(
          (request) =>
            !request
              .relatedPurchaseOrderNumber,
        ).length,

      requestsMissingQuantity:
        requests.filter(
          (request) =>
            request.quantity === null,
        ).length,

      requestsMissingItemCode:
        requests.filter(
          (request) =>
            !request.itemCode,
        ).length,

      requestsWithProject:
        requests.filter(
          (request) =>
            Boolean(request.projectId),
        ).length,

      requestsWithAssignedBuyer:
        requests.filter(
          (request) =>
            Boolean(
              request.assignedBuyer,
            ),
        ).length,

      duplicateSourceRows:
        requests.reduce(
          (total, request) =>
            total +
            request.duplicateOccurrences,
          0,
        ),

      statuses:
        [...statusCounts.entries()]
          .map(
            ([
              status,
              totalRequests,
            ]) => ({
              status,
              totalRequests,
            }),
          )
          .sort(
            (left, right) =>
              right.totalRequests -
                left.totalRequests ||
              left.status.localeCompare(
                right.status,
              ),
          ),

      processedRows:
        requests.length,
      ignoredRows,
    },
  }
}