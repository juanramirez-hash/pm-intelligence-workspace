import type {
  NormalizationResult,
} from '../../engine/importPlugin'
import type {
  SpreadsheetRow,
} from '../../parsers/spreadsheetParser'
import {
  parseExcelDate,
  parseString,
} from '../../utils/valueParsers'
import type {
  NormalizedPurchaseRequestRow,
} from './purchaseRequestTypes'
import type {
  PurchaseRequestValidationResult,
} from './purchaseRequestValidator'

function getValue(
  row: SpreadsheetRow,
  column: string | undefined,
): unknown {
  return column ? row[column] : undefined
}

function parseNullableText(
  value: unknown,
): string | null {
  const text = parseString(value)

  if (!text) {
    return null
  }

  const normalized = text
    .toLocaleLowerCase('es-MX')
    .replace(/\s+/g, ' ')
    .trim()

  if (
    normalized === '- none -' ||
    normalized === 'none'
  ) {
    return null
  }

  return text
}

function parsePurchasingTrafficComments(
  value: unknown,
): string | null {
  const text = parseNullableText(value)

  if (
    text?.toLocaleLowerCase('es-MX') ===
    'error: field is restricted'
  ) {
    return null
  }

  return text
}

function normalizeIdentifier(
  value: unknown,
): string | null {
  const text = parseNullableText(value)

  return text
    ? text
        .toLocaleUpperCase('es-MX')
        .replace(/\s+/g, ' ')
    : null
}

function parseNullableNumber(
  value: unknown,
): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : null
  }

  const text = parseNullableText(value)

  if (!text) {
    return null
  }

  const normalizedValue = text
    .replace(/\s+/g, '')
    .replace(/[^\d,.-]/g, '')

  if (!normalizedValue) {
    return null
  }

  const decimalSeparator =
    normalizedValue.includes(',') &&
    normalizedValue.includes('.')
      ? normalizedValue.lastIndexOf(',') >
        normalizedValue.lastIndexOf('.')
        ? ','
        : '.'
      : normalizedValue.includes(',')
        ? ','
        : '.'

  const numericValue =
    decimalSeparator === ','
      ? normalizedValue
          .replace(/\./g, '')
          .replace(',', '.')
      : normalizedValue.replace(/,/g, '')

  const parsedValue = Number(numericValue)

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null
}

function toDateOnly(
  value: unknown,
): string | null {
  return parseExcelDate(value)?.slice(0, 10) ?? null
}

function getPeriodId(
  date: string,
): string {
  return date.slice(0, 7)
}

function stableHash(
  value: string,
): string {
  let hash = 2166136261

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

function buildRequestKey(
  values: readonly unknown[],
): string {
  return stableHash(
    JSON.stringify(
      values.map((value) => value ?? null),
    ),
  )
}

export function normalizePurchaseRequestRows(
  rows: SpreadsheetRow[],
  validation: PurchaseRequestValidationResult,
): NormalizationResult<NormalizedPurchaseRequestRow> {
  const rowsByRequestKey = new Map<
    string,
    NormalizedPurchaseRequestRow
  >()

  let ignoredRows = 0

  for (
    const [rowIndex, row] of rows.entries()
  ) {
    const purchaseRequestNumber =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap
            .purchaseRequestNumber,
        ),
      )

    const requestDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap.requestDate,
        ),
      )

    if (
      !purchaseRequestNumber ||
      !requestDate
    ) {
      ignoredRows += 1
      continue
    }

    const sourceInternalId =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.sourceInternalId,
        ),
      )

    const salesOrderNumber =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.salesOrderNumber,
        ),
      )

    const relatedPurchaseOrderNumber =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap
            .relatedPurchaseOrderNumber,
        ),
      )

    const requestStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.requestStatus,
        ),
      )

    const sourceItemStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.sourceItemStatus,
        ),
      )

    const orderStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.orderStatus,
        ),
      )

    const itemCode =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.itemCode,
        ),
      )

    const brand =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.brand,
        ),
      )

    const model =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.model,
        ),
      )

    const description =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.description,
        ),
      )

    const quantity =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap.quantity,
        ),
      )

    const cashAuthorizationStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap
            .cashAuthorizationStatus,
        ),
      )

    const advancePaymentNote =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.advancePaymentNote,
        ),
      )

    const alreadyOrderedStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap
            .alreadyOrderedStatus,
        ),
      )

    const executiveName =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.executiveName,
        ),
      )

    const stockQuantity =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap.stockQuantity,
        ),
      )

    const availableForSaleQuantity =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap
            .availableForSaleQuantity,
        ),
      )

    const cashReleaseDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap.cashReleaseDate,
        ),
      )

    const requestExpirationDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap
            .requestExpirationDate,
        ),
      )

    const expectedPurchaseOrderArrivalDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap
            .expectedPurchaseOrderArrivalDate,
        ),
      )

    const preferredSupplierName =
      parseNullableText(
        getValue(
          row,
          validation.columnMap
            .preferredSupplierName,
        ),
      )

    const actualSupplierName =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.actualSupplierName,
        ),
      )

    const branch =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.branch,
        ),
      )

    const itemBlockedForRequestStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap
            .itemBlockedForRequestStatus,
        ),
      )

    const rmaOrderStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.rmaOrderStatus,
        ),
      )

    const purchasingTrafficComments =
      parsePurchasingTrafficComments(
        getValue(
          row,
          validation.columnMap
            .purchasingTrafficComments,
        ),
      )

    const projectId =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.projectId,
        ),
      )

    const projectEstimatedDeliveryDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap
            .projectEstimatedDeliveryDate,
        ),
      )

    const requestEstimatedDeliveryDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap
            .requestEstimatedDeliveryDate,
        ),
      )

    const createdBy =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.createdBy,
        ),
      )

    const sourceElapsedDays =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap.sourceElapsedDays,
        ),
      )

    const expressShippingPaidStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap
            .expressShippingPaidStatus,
        ),
      )

    const projectWarehouseOrderStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap
            .projectWarehouseOrderStatus,
        ),
      )

    const assignedBuyer =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.assignedBuyer,
        ),
      )

    const processDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap.processDate,
        ),
      )

    const requestKey =
      buildRequestKey([
        purchaseRequestNumber,
        sourceInternalId,
        requestDate,
        salesOrderNumber,
        relatedPurchaseOrderNumber,
        requestStatus,
        sourceItemStatus,
        orderStatus,
        itemCode,
        brand,
        model,
        description,
        quantity,
        cashAuthorizationStatus,
        advancePaymentNote,
        alreadyOrderedStatus,
        executiveName,
        stockQuantity,
        availableForSaleQuantity,
        cashReleaseDate,
        requestExpirationDate,
        expectedPurchaseOrderArrivalDate,
        preferredSupplierName,
        actualSupplierName,
        branch,
        itemBlockedForRequestStatus,
        rmaOrderStatus,
        purchasingTrafficComments,
        projectId,
        projectEstimatedDeliveryDate,
        requestEstimatedDeliveryDate,
        createdBy,
        sourceElapsedDays,
        expressShippingPaidStatus,
        projectWarehouseOrderStatus,
        assignedBuyer,
        processDate,
      ])

    const existing =
      rowsByRequestKey.get(requestKey)

    if (existing) {
      existing.duplicateOccurrences += 1
      continue
    }

    rowsByRequestKey.set(requestKey, {
      requestKey,
      sourceRowNumber: rowIndex + 2,
      duplicateOccurrences: 0,

      purchaseRequestNumber,
      sourceInternalId,

      requestDate,
      periodId:
        getPeriodId(requestDate),

      salesOrderNumber,
      relatedPurchaseOrderNumber,

      requestStatus,
      sourceItemStatus,
      orderStatus,

      itemCode,
      brand,
      model,
      description,
      quantity,

      cashAuthorizationStatus,
      advancePaymentNote,
      alreadyOrderedStatus,
      executiveName,

      stockQuantity,
      availableForSaleQuantity,

      cashReleaseDate,
      requestExpirationDate,
      expectedPurchaseOrderArrivalDate,

      preferredSupplierName,
      actualSupplierName,

      branch,
      itemBlockedForRequestStatus,
      rmaOrderStatus,
      purchasingTrafficComments,

      projectId,
      projectEstimatedDeliveryDate,
      requestEstimatedDeliveryDate,

      createdBy,
      sourceElapsedDays,
      expressShippingPaidStatus,
      projectWarehouseOrderStatus,
      assignedBuyer,
      processDate,
    })
  }

  return {
    rows: [...rowsByRequestKey.values()],
    ignoredRows,
  }
}