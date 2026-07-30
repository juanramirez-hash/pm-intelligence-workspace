import type { NormalizationResult } from '../../engine/importPlugin'
import type { InventoryField } from './inventoryColumnAliases'
import type {
  NormalizedInventoryRow,
  RawInventoryRow,
} from './inventoryTypes'
import type { InventoryValidationResult } from './inventoryValidator'

function getValue(
  row: RawInventoryRow,
  validation: InventoryValidationResult,
  field: InventoryField,
): unknown {
  const column = validation.columnMap[field]
  return column ? row[column] : null
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).trim().replace(/\s+/g, ' ')
  return normalized || null
}

function identifier(value: unknown): string | null {
  const normalized = text(value)
  return normalized
    ? normalized.toLocaleUpperCase('es-MX')
    : null
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const normalizedText = text(value)
  if (!normalizedText) {
    return null
  }

  const negativeByParentheses =
    normalizedText.startsWith('(') && normalizedText.endsWith(')')
  const normalized = normalizedText
    .replace(/[()$,%]/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
  const parsed = Number(normalized)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return negativeByParentheses ? -parsed : parsed
}

function dateValue(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30)
    return new Date(excelEpoch + value * 86_400_000)
      .toISOString()
      .slice(0, 10)
  }

  const normalized = text(value)
  if (!normalized) {
    return null
  }

  const directMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (directMatch) {
    const [, year, month, day] = directMatch
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`
  }

  const date = new Date(normalized)
  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString().slice(0, 10)
}

export function normalizeInventoryRows(
  rows: RawInventoryRow[],
  validation: InventoryValidationResult,
): NormalizationResult<NormalizedInventoryRow> {
  const normalizedRows: NormalizedInventoryRow[] = []
  let ignoredRows = 0

  for (const row of rows) {
    const productName = identifier(
      getValue(row, validation, 'productName'),
    )
    const location = text(
      getValue(row, validation, 'location'),
    )
    const onHand = numberValue(
      getValue(row, validation, 'onHand'),
    )

    if (!productName || !location || onHand === null) {
      ignoredRows += 1
      continue
    }

    normalizedRows.push({
      snapshotDate: dateValue(
        getValue(row, validation, 'snapshotDate'),
      ),
      productName,
      productCode: identifier(
        getValue(row, validation, 'productCode'),
      ),
      brand: text(getValue(row, validation, 'brand')),
      model: text(getValue(row, validation, 'model')),
      location,
      onHand,
      available: numberValue(
        getValue(row, validation, 'available'),
      ),
      committed: numberValue(
        getValue(row, validation, 'committed'),
      ),
      inTransit: numberValue(
        getValue(row, validation, 'inTransit'),
      ),
      onOrder: numberValue(
        getValue(row, validation, 'onOrder'),
      ),
      unitCost: numberValue(
        getValue(row, validation, 'unitCost'),
      ),
      inventoryValue: numberValue(
        getValue(row, validation, 'inventoryValue'),
      ),
      currency: identifier(
        getValue(row, validation, 'currency'),
      ),
    })
  }

  return { rows: normalizedRows, ignoredRows }
}
