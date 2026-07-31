import type { NormalizationResult } from '../../engine/importPlugin'
import type { InventoryField } from './inventoryColumnAliases'
import type {
  NormalizedInventoryRow,
  RawInventoryRow,
} from './inventoryTypes'
import type {
  InventoryValidationResult,
  WideInventoryLocationColumnMap,
} from './inventoryValidator'

function getValue(
  row: RawInventoryRow,
  validation: InventoryValidationResult,
  field: InventoryField,
): unknown {
  const column = validation.columnMap[field]
  return column ? row[column] : null
}

function getWideValue(
  row: RawInventoryRow,
  columns: WideInventoryLocationColumnMap,
  field: keyof WideInventoryLocationColumnMap,
): unknown {
  const column = columns[field]
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

  const directMatch = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
  )
  if (directMatch) {
    const [, year, month, day] = directMatch
    return `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`
  }

  const date = new Date(normalized)
  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString().slice(0, 10)
}

function normalizeLongInventoryRows(
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

function normalizeWideInventoryRows(
  rows: RawInventoryRow[],
  validation: InventoryValidationResult,
): NormalizationResult<NormalizedInventoryRow> {
  const normalizedRows: NormalizedInventoryRow[] = []
  let ignoredRows = 0

  for (const row of rows) {
    const productName = identifier(
      getValue(row, validation, 'productName'),
    )

    if (!productName) {
      ignoredRows += 1
      continue
    }

    let generatedPositions = 0

    for (const [location, columns] of Object.entries(
      validation.wideLocationColumns,
    )) {
      const onHand = numberValue(
        getWideValue(row, columns, 'onHand'),
      )
      const available = numberValue(
        getWideValue(row, columns, 'available'),
      )
      const committed = numberValue(
        getWideValue(row, columns, 'committed'),
      )
      const inTransit = numberValue(
        getWideValue(row, columns, 'inTransit'),
      )
      const onOrder = numberValue(
        getWideValue(row, columns, 'onOrder'),
      )
      const unitCost = numberValue(
        getWideValue(row, columns, 'unitCost'),
      )

      const hasOperationalData = [
        onHand,
        available,
        committed,
        inTransit,
        onOrder,
      ].some((value) => value !== null)

      if (!hasOperationalData) {
        continue
      }

      const normalizedOnHand = onHand ?? 0

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
        onHand: normalizedOnHand,
        available,
        committed,
        inTransit,
        onOrder,
        unitCost,
        inventoryValue:
          unitCost !== null
            ? normalizedOnHand * unitCost
            : null,
        currency: identifier(
          getValue(row, validation, 'currency'),
        ),
      })
      generatedPositions += 1
    }

    if (generatedPositions === 0) {
      ignoredRows += 1
    }
  }

  return { rows: normalizedRows, ignoredRows }
}

export function normalizeInventoryRows(
  rows: RawInventoryRow[],
  validation: InventoryValidationResult,
): NormalizationResult<NormalizedInventoryRow> {
  return validation.sourceLayout === 'wide_by_location'
    ? normalizeWideInventoryRows(rows, validation)
    : normalizeLongInventoryRows(rows, validation)
}
