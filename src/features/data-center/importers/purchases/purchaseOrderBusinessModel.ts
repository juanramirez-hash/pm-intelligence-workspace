import type {
  NormalizedPurchaseOrderRow,
  PurchaseOrderDatasetSummary,
} from './purchaseOrderTypes'

export interface BusinessPurchaseOrder {
  purchaseOrderNumber: string
  sourceInternalId: string | null
  purchaseOrderReference: string | null

  purchaseOrderDate: string
  periodId: string
  expectedReceiptDate: string | null

  status: string | null
  mainMemo: string | null

  supplierId: string | null
  supplierName: string | null
  currency: string | null

  shipmentNumber: string | null
  shipmentStatus: string | null
  zone: string | null
  purchasingExecutive: string | null
  department: string | null

  lineKeys: string[]
  headerConflictFields: string[]
}

export interface PurchaseOrderBusinessModel {
  orders: BusinessPurchaseOrder[]
  lines: NormalizedPurchaseOrderRow[]
  summary: PurchaseOrderDatasetSummary
}

const HEADER_FIELDS = [
  'sourceInternalId',
  'purchaseOrderReference',
  'purchaseOrderDate',
  'expectedReceiptDate',
  'status',
  'mainMemo',
  'supplierId',
  'supplierName',
  'currency',
  'shipmentNumber',
  'shipmentStatus',
  'zone',
  'purchasingExecutive',
  'department',
] as const satisfies readonly (
  keyof NormalizedPurchaseOrderRow
)[]

function roundCurrency(
  value: number,
): number {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100
}

function normalizedHeaderValue(
  value: unknown,
): string {
  return value === null ||
    value === undefined
    ? ''
    : String(value)
}

function getHeaderConflictFields(
  rows: readonly NormalizedPurchaseOrderRow[],
): string[] {
  return HEADER_FIELDS.filter((field) => {
    const values = new Set(
      rows
        .map((row) =>
          normalizedHeaderValue(row[field]),
        )
        .filter(Boolean),
    )

    return values.size > 1
  })
}

function selectHeaderRow(
  rows: readonly NormalizedPurchaseOrderRow[],
): NormalizedPurchaseOrderRow {
  return [...rows].sort(
    (left, right) =>
      left.sourceRowNumber -
      right.sourceRowNumber,
  )[0]
}

export function mergePurchaseOrderRows(
  existingRows:
    readonly NormalizedPurchaseOrderRow[],
  incomingRows:
    readonly NormalizedPurchaseOrderRow[],
): NormalizedPurchaseOrderRow[] {
  const incomingOrders = new Set(
    incomingRows.map(
      (row) => row.purchaseOrderNumber,
    ),
  )

  const rowsByLineKey = new Map<
    string,
    NormalizedPurchaseOrderRow
  >()

  for (const row of existingRows) {
    if (
      !incomingOrders.has(
        row.purchaseOrderNumber,
      )
    ) {
      rowsByLineKey.set(
        row.lineKey,
        row,
      )
    }
  }

  for (const row of incomingRows) {
    rowsByLineKey.set(
      row.lineKey,
      row,
    )
  }

  return [...rowsByLineKey.values()]
    .sort(
      (left, right) =>
        left.purchaseOrderDate.localeCompare(
          right.purchaseOrderDate,
        ) ||
        left.purchaseOrderNumber.localeCompare(
          right.purchaseOrderNumber,
        ) ||
        left.lineKey.localeCompare(
          right.lineKey,
        ),
    )
}

export function buildPurchaseOrderBusinessModel(
  rows:
    readonly NormalizedPurchaseOrderRow[],
  ignoredRows = 0,
): PurchaseOrderBusinessModel {
  const lines =
    mergePurchaseOrderRows([], rows)

  const rowsByOrder = new Map<
    string,
    NormalizedPurchaseOrderRow[]
  >()

  for (const line of lines) {
    const current =
      rowsByOrder.get(
        line.purchaseOrderNumber,
      ) ?? []

    current.push(line)

    rowsByOrder.set(
      line.purchaseOrderNumber,
      current,
    )
  }

  const orders =
    [...rowsByOrder.entries()]
      .map(
        ([
          purchaseOrderNumber,
          orderRows,
        ]): BusinessPurchaseOrder => {
          const header =
            selectHeaderRow(orderRows)

          return {
            purchaseOrderNumber,
            sourceInternalId:
              header.sourceInternalId,
            purchaseOrderReference:
              header.purchaseOrderReference,

            purchaseOrderDate:
              header.purchaseOrderDate,
            periodId:
              header.periodId,
            expectedReceiptDate:
              header.expectedReceiptDate,

            status:
              header.status,
            mainMemo:
              header.mainMemo,

            supplierId:
              header.supplierId,
            supplierName:
              header.supplierName,
            currency:
              header.currency,

            shipmentNumber:
              header.shipmentNumber,
            shipmentStatus:
              header.shipmentStatus,
            zone:
              header.zone,
            purchasingExecutive:
              header.purchasingExecutive,
            department:
              header.department,

            lineKeys:
              orderRows.map(
                (row) => row.lineKey,
              ),
            headerConflictFields:
              getHeaderConflictFields(
                orderRows,
              ),
          }
        },
      )
      .sort(
        (left, right) =>
          left.purchaseOrderDate.localeCompare(
            right.purchaseOrderDate,
          ) ||
          left.purchaseOrderNumber.localeCompare(
            right.purchaseOrderNumber,
          ),
      )

  const dates = orders
    .map(
      (order) =>
        order.purchaseOrderDate,
    )
    .sort()

  const statusCounts =
    new Map<string, number>()

  for (const order of orders) {
    const status =
      order.status ?? 'Sin estado'

    statusCounts.set(
      status,
      (
        statusCounts.get(status) ?? 0
      ) + 1,
    )
  }

  const currencyAmounts =
    new Map<string, number>()

  for (const line of lines) {
    if (
      !line.currency ||
      line.amountForeignCurrency === null
    ) {
      continue
    }

    currencyAmounts.set(
      line.currency,
      (
        currencyAmounts.get(
          line.currency,
        ) ?? 0
      ) +
        line.amountForeignCurrency,
    )
  }

  return {
    orders,
    lines,
    summary: {
      periodStart:
        dates[0] ?? null,
      periodEnd:
        dates.at(-1) ?? null,

      totalOrders:
        orders.length,
      totalLines:
        lines.length,

      productLines:
        lines.filter(
          (line) =>
            line.lineType === 'product',
        ).length,
      taxLines:
        lines.filter(
          (line) =>
            line.lineType === 'tax',
        ).length,
      discountLines:
        lines.filter(
          (line) =>
            line.lineType === 'discount',
        ).length,
      adjustmentLines:
        lines.filter(
          (line) =>
            line.lineType === 'adjustment',
        ).length,

      duplicateSourceLines:
        lines.reduce(
          (total, line) =>
            total +
            line.duplicateOccurrences,
          0,
        ),
      ordersMissingSupplier:
        orders.filter(
          (order) =>
            !order.supplierId &&
            !order.supplierName,
        ).length,
      ordersMissingCurrency:
        orders.filter(
          (order) =>
            !order.currency,
        ).length,
      ordersWithHeaderConflicts:
        orders.filter(
          (order) =>
            order.headerConflictFields
              .length > 0,
        ).length,
      linesMissingAmount:
        lines.filter(
          (line) =>
            line.amountForeignCurrency ===
            null,
        ).length,

      statuses:
        [...statusCounts.entries()]
          .map(
            ([status, totalOrders]) => ({
              status,
              totalOrders,
            }),
          )
          .sort(
            (left, right) =>
              right.totalOrders -
                left.totalOrders ||
              left.status.localeCompare(
                right.status,
              ),
          ),

      amountsByCurrency:
        [...currencyAmounts.entries()]
          .map(
            ([
              currency,
              totalAmount,
            ]) => ({
              currency,
              totalAmount:
                roundCurrency(
                  totalAmount,
                ),
            }),
          )
          .sort(
            (left, right) =>
              left.currency.localeCompare(
                right.currency,
              ),
          ),

      processedRows:
        lines.length,
      ignoredRows,
    },
  }
}