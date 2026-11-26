import type { NormalizationResult } from '../../engine/importPlugin'
import type { InventoryField } from './inventoryColumnAliases'
import type {
  InventoryItemRecord,
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

function validDateKey(
  year: number,
  month: number,
  day: number,
): string | null {
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

/**
 * "Fecha de ultima venta" (MD-002): a date cell (local date, as SheetJS
 * builds it with cellDates), an Excel serial, YYYY-MM-DD or the day-first
 * D/M/YYYY of the NetSuite Mexico account. Anything else is null, never
 * guessed.
 */
export function lastSaleDateValue(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : validDateKey(
        value.getFullYear(),
        value.getMonth() + 1,
        value.getDate(),
      )
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) {
      return null
    }

    const excelEpoch = Date.UTC(1899, 11, 30)
    return new Date(excelEpoch + Math.floor(value) * 86_400_000)
      .toISOString()
      .slice(0, 10)
  }

  const normalized = text(value)
  if (!normalized) {
    return null
  }

  const isoMatch = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
  )
  if (isoMatch) {
    return validDateKey(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    )
  }

  const dayFirstMatch = normalized.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
  )
  if (dayFirstMatch) {
    return validDateKey(
      Number(dayFirstMatch[3]),
      Number(dayFirstMatch[2]),
      Number(dayFirstMatch[1]),
    )
  }

  return null
}

/**
 * Only when the file has the columns: an export without them normalizes
 * exactly as before (DC-002 V1 regression baselines).
 */
function itemFields(
  row: RawInventoryRow,
  validation: InventoryValidationResult,
): Pick<NormalizedInventoryRow, 'catalogStatus' | 'lastSaleDate'> {
  const fields: Pick<
    NormalizedInventoryRow,
    'catalogStatus' | 'lastSaleDate'
  > = {}

  if (validation.columnMap.catalogStatus) {
    fields.catalogStatus = identifier(
      getValue(row, validation, 'catalogStatus'),
    )
  }

  if (validation.columnMap.lastSaleDate) {
    fields.lastSaleDate = lastSaleDateValue(
      getValue(row, validation, 'lastSaleDate'),
    )
  }

  return fields
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
      ...itemFields(row, validation),
    })
  }

  return { rows: normalizedRows, ignoredRows }
}

/**
 * NetSuite grouping rows such as "Inventory Item": a label in the item
 * column, without brand, code or any number (DC-002). They are ignored
 * rows, not errors.
 */
function isGroupingRow(
  row: RawInventoryRow,
  validation: InventoryValidationResult,
): boolean {
  return (
    !text(getValue(row, validation, 'brand')) &&
    !identifier(getValue(row, validation, 'productCode')) &&
    Object.values(row).every(
      (value) => typeof value !== 'number',
    )
  )
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

    if (
      !productName ||
      isGroupingRow(row, validation)
    ) {
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
        ...itemFields(row, validation),
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

const roundQuantity = (value: number): number =>
  Math.round(value * 10_000) / 10_000

/**
 * MD-002-HOTFIX1: one record per article. Totals come from the same
 * normalized positions that go to inventory_snapshots (so they always
 * match); in the wide NetSuite export, articles whose cells are all empty
 * produce no position and are added here with zero totals. Grouping rows
 * ("Inventory Item") and the Total columns are excluded exactly as in the
 * positions. Duplicated item codes are summed into one record.
 */
export function buildInventoryItems(
  rows: RawInventoryRow[],
  validation: InventoryValidationResult,
  positions: readonly NormalizedInventoryRow[] =
    normalizeInventoryRows(rows, validation).rows,
): InventoryItemRecord[] {
  const items = new Map<string, InventoryItemRecord>()

  const ensure = (itemCode: string): InventoryItemRecord => {
    const existing = items.get(itemCode)

    if (existing) {
      return existing
    }

    const created: InventoryItemRecord = {
      itemCode,
      brand: null,
      catalogStatus: null,
      lastSaleDate: null,
      onHand: 0,
      committed: 0,
      available: 0,
      inTransit: 0,
      onOrder: 0,
      positions: 0,
    }

    items.set(itemCode, created)

    return created
  }

  const fill = (
    item: InventoryItemRecord,
    brand: string | null,
    fields: Pick<NormalizedInventoryRow, 'catalogStatus' | 'lastSaleDate'>,
  ) => {
    item.brand = item.brand ?? brand
    item.catalogStatus = item.catalogStatus ?? fields.catalogStatus ?? null
    item.lastSaleDate = item.lastSaleDate ?? fields.lastSaleDate ?? null
  }

  if (validation.sourceLayout === 'wide_by_location') {
    for (const row of rows) {
      const itemCode = identifier(
        getValue(row, validation, 'productName'),
      )

      if (!itemCode || isGroupingRow(row, validation)) {
        continue
      }

      fill(
        ensure(itemCode),
        text(getValue(row, validation, 'brand')),
        itemFields(row, validation),
      )
    }
  }

  for (const position of positions) {
    const item = ensure(position.productName)

    fill(item, position.brand, position)
    item.onHand += position.onHand
    item.committed += position.committed ?? 0
    item.available += position.available ?? 0
    item.inTransit += position.inTransit ?? 0
    item.onOrder += position.onOrder ?? 0
    item.positions += 1
  }

  return [...items.values()].map((item) => ({
    ...item,
    onHand: roundQuantity(item.onHand),
    committed: roundQuantity(item.committed),
    available: roundQuantity(item.available),
    inTransit: roundQuantity(item.inTransit),
    onOrder: roundQuantity(item.onOrder),
  }))
}
