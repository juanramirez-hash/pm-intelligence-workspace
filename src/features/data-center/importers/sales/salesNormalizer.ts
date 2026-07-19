import {
  parseCurrency,
  parseExcelDate,
  parseIdentifier,
  parseNumber,
  parseString,
} from '../../utils/valueParsers'
import type { SalesColumnMap } from './salesValidator'
import type { NormalizedSalesRow } from './salesTypes'

export type RawSalesRow =
  Record<string, unknown>

export interface SalesNormalizationResult {
  rows: NormalizedSalesRow[]
  ignoredRows: number
}

function getMappedValue(
  row: RawSalesRow,
  columnMap: SalesColumnMap,
  field: keyof SalesColumnMap,
): unknown {
  const sourceColumn = columnMap[field]

  if (!sourceColumn) {
    return null
  }

  return row[sourceColumn]
}

function isEmptyValue(
  value: unknown,
): boolean {
  return (
    value === null ||
    value === undefined ||
    (
      typeof value === 'string' &&
      value.trim() === ''
    )
  )
}

function isCompletelyEmptyRow(
  row: RawSalesRow,
): boolean {
  return Object.values(row).every(
    isEmptyValue,
  )
}

function isTotalLabel(
  value: unknown,
): boolean {
  const normalizedValue = parseString(value)
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (!normalizedValue) {
    return false
  }

  return [
    'total',
    'totales',
    'gran total',
    'grand total',
    'total general',
    'subtotal',
  ].includes(normalizedValue)
}

function isTotalRow(
  row: RawSalesRow,
  columnMap: SalesColumnMap,
): boolean {
  const brandValue = getMappedValue(
    row,
    columnMap,
    'brand',
  )

  const customerValue = getMappedValue(
    row,
    columnMap,
    'customerName',
  )

  const modelValue = getMappedValue(
    row,
    columnMap,
    'model',
  )

  const documentValue = getMappedValue(
    row,
    columnMap,
    'documentNumber',
  )

  return [
    brandValue,
    customerValue,
    modelValue,
    documentValue,
  ].some(isTotalLabel)
}

function extractCustomerId(
  explicitCustomerId: unknown,
  customerNameValue: unknown,
): string | null {
  const parsedExplicitId = parseIdentifier(
    explicitCustomerId,
  )

  if (parsedExplicitId) {
    return parsedExplicitId
  }

  const customerName =
    parseString(customerNameValue)

  if (!customerName) {
    return null
  }

  /*
   * El reporte de Tecnosinergia contiene el ID y el nombre
   * en una sola columna:
   *
   * 039010 BICOMER COMERCIO...
   *
   * Se toma el identificador inicial de seis dígitos.
   */
  const customerIdMatch =
    customerName.match(/^\s*(\d{6})(?:\s|$)/)

  if (customerIdMatch?.[1]) {
    return customerIdMatch[1]
  }

  /*
   * Respaldo para formatos que no contienen un ID separado.
   * Permite contar al cliente por su nombre sin perder la fila.
   */
  return parseIdentifier(customerName)
}

export function normalizeSalesRow(
  row: RawSalesRow,
  columnMap: SalesColumnMap,
): NormalizedSalesRow | null {
  if (isCompletelyEmptyRow(row)) {
    return null
  }

  if (isTotalRow(row, columnMap)) {
    return null
  }

  const rawDate = getMappedValue(
    row,
    columnMap,
    'date',
  )

  const rawBrand = getMappedValue(
    row,
    columnMap,
    'brand',
  )

  const rawRevenue = getMappedValue(
    row,
    columnMap,
    'revenue',
  )

  const rawCustomerId = getMappedValue(
    row,
    columnMap,
    'customerId',
  )

  const rawCustomerName = getMappedValue(
    row,
    columnMap,
    'customerName',
  )

  const date = parseExcelDate(rawDate)
  const brand = parseString(rawBrand)

  /*
   * Revenue puede ser cero, por lo que no debemos rechazar
   * la fila únicamente porque el resultado numérico sea 0.
   * Solo se rechaza cuando el valor fuente está vacío.
   */
  const hasRevenueValue =
    !isEmptyValue(rawRevenue)

  if (
    !date ||
    !brand ||
    !hasRevenueValue
  ) {
    return null
  }

  return {
    date,
    brand,

    revenue: parseCurrency(
      rawRevenue,
    ),

    grossProfit: parseCurrency(
      getMappedValue(
        row,
        columnMap,
        'grossProfit',
      ),
    ),

    customerId: extractCustomerId(
      rawCustomerId,
      rawCustomerName,
    ),

    customerName: parseString(
      rawCustomerName,
    ),

    model: parseIdentifier(
      getMappedValue(
        row,
        columnMap,
        'model',
      ),
    ),

    quantity: parseNumber(
      getMappedValue(
        row,
        columnMap,
        'quantity',
      ),
    ),

    documentNumber: parseIdentifier(
      getMappedValue(
        row,
        columnMap,
        'documentNumber',
      ),
    ),

    location: parseString(
      getMappedValue(
        row,
        columnMap,
        'location',
      ),
    ),

    salesRep: parseString(
      getMappedValue(
        row,
        columnMap,
        'salesRep',
      ),
    ),

    currency: parseString(
      getMappedValue(
        row,
        columnMap,
        'currency',
      ),
    ),
  }
}

export function normalizeSalesRows(
  rawRows: RawSalesRow[],
  columnMap: SalesColumnMap,
): SalesNormalizationResult {
  const normalizedRows:
    NormalizedSalesRow[] = []

  let ignoredRows = 0

  for (const rawRow of rawRows) {
    const normalizedRow =
      normalizeSalesRow(
        rawRow,
        columnMap,
      )

    if (!normalizedRow) {
      ignoredRows += 1
      continue
    }

    normalizedRows.push(
      normalizedRow,
    )
  }

  return {
    rows: normalizedRows,
    ignoredRows,
  }
}