import type {
  NormalizedPurchaseOrderRow,
} from '../../../features/data-center/importers/purchases/purchaseOrderTypes'

import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../entities/purchaseOrder'

export interface BusinessPurchaseOrdersResult {
  orders: Map<string, BusinessPurchaseOrder>
  lines: Map<string, BusinessPurchaseOrderLine>
}

const HEADER_FIELDS = [
  'sourceInternalId',
  'sourceSecondaryInternalId',
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

function normalizeHeaderValue(
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
          normalizeHeaderValue(row[field]),
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

export function buildBusinessPurchaseOrders(
  rows: readonly NormalizedPurchaseOrderRow[],
): BusinessPurchaseOrdersResult {
  const orders =
    new Map<string, BusinessPurchaseOrder>()

  const lines =
    new Map<string, BusinessPurchaseOrderLine>()

  const rowsByOrder =
    new Map<
      string,
      NormalizedPurchaseOrderRow[]
    >()

  for (const row of rows) {
    const purchaseOrderId =
      normalizeIdentifier(
        row.purchaseOrderNumber,
      ) ??
      row.purchaseOrderNumber

    const line:
      BusinessPurchaseOrderLine = {
      id: row.lineKey,
      purchaseOrderId,
      purchaseOrderNumber:
        purchaseOrderId,

      sourceRowNumber:
        row.sourceRowNumber,
      duplicateOccurrences:
        row.duplicateOccurrences,

      sourceInternalId:
        row.sourceInternalId,
      sourceSecondaryInternalId:
        row.sourceSecondaryInternalId,
      purchaseOrderReference:
        row.purchaseOrderReference,

      purchaseOrderDate:
        row.purchaseOrderDate,
      periodId:
        row.periodId,
      expectedReceiptDate:
        row.expectedReceiptDate,

      status:
        row.status,
      mainMemo:
        row.mainMemo,

      supplierId:
        normalizeIdentifier(
          row.supplierId,
        ),
      supplierName:
        row.supplierName,
      currency:
        normalizeIdentifier(
          row.currency,
        ),

      lineType:
        row.lineType,
      itemCode:
        normalizeIdentifier(
          row.itemCode,
        ),
      brandId:
        normalizeIdentifier(
          row.brand,
        ),
      lineMemo:
        row.lineMemo,
      quantity:
        row.quantity,
      amountForeignCurrency:
        row.amountForeignCurrency,
      weight:
        row.weight,

      supplierLeadTimeDays:
        row.supplierLeadTimeDays,
      supplierExpressLeadTimeDays:
        row.supplierExpressLeadTimeDays,
      inventoryDays:
        row.inventoryDays,

      shipmentNumber:
        row.shipmentNumber,
      shipmentStatus:
        row.shipmentStatus,
      zone:
        row.zone,
      purchasingExecutive:
        row.purchasingExecutive,

      coffDate:
        row.coffDate,
      atdDate:
        row.atdDate,
      ataDate:
        row.ataDate,
      atwDate:
        row.atwDate,

      department:
        row.department,
      valueClassification:
        row.valueClassification,
      valueScore:
        row.valueScore,
      amountClassification:
        row.amountClassification,
    }

    lines.set(
      line.id,
      line,
    )

    const currentRows =
      rowsByOrder.get(
        purchaseOrderId,
      ) ?? []

    currentRows.push(row)

    rowsByOrder.set(
      purchaseOrderId,
      currentRows,
    )
  }

  for (
    const [
      purchaseOrderNumber,
      orderRows,
    ] of rowsByOrder
  ) {
    const header =
      selectHeaderRow(
        orderRows,
      )

    const lineIds =
      new Set(
        orderRows.map(
          (row) => row.lineKey,
        ),
      )

    const orderLines =
      [...lineIds]
        .map((lineId) =>
          lines.get(lineId),
        )
        .filter(
          (
            line,
          ): line is BusinessPurchaseOrderLine =>
            Boolean(line),
        )

    orders.set(
      purchaseOrderNumber,
      {
        id:
          purchaseOrderNumber,
        purchaseOrderNumber,

        sourceInternalId:
          header.sourceInternalId,
        sourceSecondaryInternalId:
          header.sourceSecondaryInternalId,
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
          normalizeIdentifier(
            header.supplierId,
          ),
        supplierName:
          header.supplierName,
        currency:
          normalizeIdentifier(
            header.currency,
          ),

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

        amountForeignCurrency:
          orderLines.reduce(
            (total, line) =>
              total +
              (
                line
                  .amountForeignCurrency ??
                0
              ),
            0,
          ),

        quantity:
          orderLines.reduce(
            (total, line) =>
              total +
              (
                line.quantity ??
                0
              ),
            0,
          ),

        lineCount:
          orderLines.length,

        duplicateSourceLines:
          orderLines.reduce(
            (total, line) =>
              total +
              line.duplicateOccurrences,
            0,
          ),

        lineIds:
          new Set(
            orderLines.map(
              (line) => line.id,
            ),
          ),

        itemCodes:
          new Set(
            orderLines
              .map(
                (line) =>
                  line.itemCode,
              )
              .filter(
                (
                  itemCode,
                ): itemCode is string =>
                  Boolean(itemCode),
              ),
          ),

        brandIds:
          new Set(
            orderLines
              .map(
                (line) =>
                  line.brandId,
              )
              .filter(
                (
                  brandId,
                ): brandId is string =>
                  Boolean(brandId),
              ),
          ),

        lineTypes:
          new Set(
            orderLines.map(
              (line) =>
                line.lineType,
            ),
          ),

        headerConflictFields:
          getHeaderConflictFields(
            orderRows,
          ),
      },
    )
  }

  return {
    orders,
    lines,
  }
}