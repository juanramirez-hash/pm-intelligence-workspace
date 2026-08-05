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
  NormalizedPurchaseOrderRow,
  PurchaseOrderLineType,
} from './purchaseOrderTypes'
import type {
  PurchaseOrderValidationResult,
} from './purchaseOrderValidator'

const TAX_ITEM_CODES = new Set([
  'COMPRAS NACIONAL',
  'COMPRAS EXTRANJERO',
  'COMPRAS EXENTO',
])

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

function normalizeComparisonText(
  value: string | null,
): string {
  return value
    ?.toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim() ?? ''
}

function classifyPurchaseOrderLine(
  itemCode: string | null,
  lineMemo: string | null,
  quantity: number | null,
): PurchaseOrderLineType {
  if (
    itemCode &&
    TAX_ITEM_CODES.has(itemCode)
  ) {
    return 'tax'
  }

  const normalizedMemo =
    normalizeComparisonText(lineMemo)

  if (
    quantity === -1 &&
    (
      normalizedMemo === 'iva' ||
      normalizedMemo === 'vat'
    )
  ) {
    return 'tax'
  }

  if (
    itemCode &&
    normalizeComparisonText(itemCode)
      .includes('descuento')
  ) {
    return 'discount'
  }

  if (!itemCode) {
    return 'adjustment'
  }

  return 'product'
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

function buildLineKey(
  values: readonly unknown[],
): string {
  return stableHash(
    JSON.stringify(
      values.map((value) => value ?? null),
    ),
  )
}

export function normalizePurchaseOrderRows(
  rows: SpreadsheetRow[],
  validation: PurchaseOrderValidationResult,
): NormalizationResult<NormalizedPurchaseOrderRow> {
  const rowsByLineKey = new Map<
    string,
    NormalizedPurchaseOrderRow
  >()
  let ignoredRows = 0

  for (
    const [rowIndex, row] of rows.entries()
  ) {
    const purchaseOrderNumber =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.purchaseOrderNumber,
        ),
      )

    const purchaseOrderDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap.purchaseOrderDate,
        ),
      )

    if (
      !purchaseOrderNumber ||
      !purchaseOrderDate
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

    const sourceSecondaryInternalId =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap
            .sourceSecondaryInternalId,
        ),
      )

    const purchaseOrderReference =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap
            .purchaseOrderReference,
        ),
      )

    const expectedReceiptDate =
      toDateOnly(
        getValue(
          row,
          validation.columnMap
            .expectedReceiptDate,
        ),
      )

    const status = parseNullableText(
      getValue(
        row,
        validation.columnMap.status,
      ),
    )

    const mainMemo = parseNullableText(
      getValue(
        row,
        validation.columnMap.mainMemo,
      ),
    )

    const supplierId =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.supplierId,
        ),
      )

    const supplierName =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.supplierName,
        ),
      )

    const currency =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.currency,
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

    const lineMemo = parseNullableText(
      getValue(
        row,
        validation.columnMap.lineMemo,
      ),
    )

    const quantity = parseNullableNumber(
      getValue(
        row,
        validation.columnMap.quantity,
      ),
    )

    const amountForeignCurrency =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap
            .amountForeignCurrency,
        ),
      )

    const weight = parseNullableNumber(
      getValue(
        row,
        validation.columnMap.weight,
      ),
    )

    const supplierLeadTimeDays =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap
            .supplierLeadTimeDays,
        ),
      )

    const supplierExpressLeadTimeDays =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap
            .supplierExpressLeadTimeDays,
        ),
      )

    const inventoryDays =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap.inventoryDays,
        ),
      )

    const shipmentNumber =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap.shipmentNumber,
        ),
      )

    const shipmentStatus =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.shipmentStatus,
        ),
      )

    const zone = parseNullableText(
      getValue(
        row,
        validation.columnMap.zone,
      ),
    )

    const purchasingExecutive =
      parseNullableText(
        getValue(
          row,
          validation.columnMap
            .purchasingExecutive,
        ),
      )

    const coffDate = toDateOnly(
      getValue(
        row,
        validation.columnMap.coffDate,
      ),
    )

    const atdDate = toDateOnly(
      getValue(
        row,
        validation.columnMap.atdDate,
      ),
    )

    const ataDate = toDateOnly(
      getValue(
        row,
        validation.columnMap.ataDate,
      ),
    )

    const atwDate = toDateOnly(
      getValue(
        row,
        validation.columnMap.atwDate,
      ),
    )

    const department =
      parseNullableText(
        getValue(
          row,
          validation.columnMap.department,
        ),
      )

    const valueClassification =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap
            .valueClassification,
        ),
      )

    const valueScore =
      parseNullableNumber(
        getValue(
          row,
          validation.columnMap.valueScore,
        ),
      )

    const amountClassification =
      normalizeIdentifier(
        getValue(
          row,
          validation.columnMap
            .amountClassification,
        ),
      )

    const lineType =
      classifyPurchaseOrderLine(
        itemCode,
        lineMemo,
        quantity,
      )

    const lineKey = buildLineKey([
      purchaseOrderNumber,
      sourceInternalId,
      sourceSecondaryInternalId,
      purchaseOrderReference,
      purchaseOrderDate,
      expectedReceiptDate,
      status,
      mainMemo,
      supplierId,
      supplierName,
      currency,
      lineType,
      itemCode,
      brand,
      lineMemo,
      quantity,
      amountForeignCurrency,
      weight,
      supplierLeadTimeDays,
      supplierExpressLeadTimeDays,
      inventoryDays,
      shipmentNumber,
      shipmentStatus,
      zone,
      purchasingExecutive,
      coffDate,
      atdDate,
      ataDate,
      atwDate,
      department,
      valueClassification,
      valueScore,
      amountClassification,
    ])

    const existing =
      rowsByLineKey.get(lineKey)

    if (existing) {
      existing.duplicateOccurrences += 1
      continue
    }

    rowsByLineKey.set(lineKey, {
      lineKey,
      sourceRowNumber: rowIndex + 2,
      duplicateOccurrences: 0,

      purchaseOrderNumber,
      sourceInternalId,
      sourceSecondaryInternalId,
      purchaseOrderReference,

      purchaseOrderDate,
      periodId:
        getPeriodId(purchaseOrderDate),
      expectedReceiptDate,

      status,
      mainMemo,

      supplierId,
      supplierName,
      currency,

      lineType,
      itemCode,
      brand,
      lineMemo,
      quantity,
      amountForeignCurrency,
      weight,

      supplierLeadTimeDays,
      supplierExpressLeadTimeDays,
      inventoryDays,

      shipmentNumber,
      shipmentStatus,
      zone,
      purchasingExecutive,

      coffDate,
      atdDate,
      ataDate,
      atwDate,

      department,
      valueClassification,
      valueScore,
      amountClassification,
    })
  }

  return {
    rows: [...rowsByLineKey.values()],
    ignoredRows,
  }
}