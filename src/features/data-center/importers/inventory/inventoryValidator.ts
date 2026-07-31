import type { ValidationResult } from '../../types/commonTypes'

import {
  INVENTORY_COLUMN_ALIASES,
  type InventoryField,
} from './inventoryColumnAliases'
import {
  ALL_INVENTORY_FIELDS,
  RECOMMENDED_INVENTORY_FIELDS,
  REQUIRED_INVENTORY_FIELDS,
} from './inventorySchema'

export type InventoryColumnMap =
  Partial<Record<InventoryField, string>>

export type InventorySourceLayout =
  | 'long'
  | 'wide_by_location'

export type WideInventoryMetric =
  | 'onHand'
  | 'available'
  | 'committed'
  | 'inTransit'
  | 'onOrder'
  | 'unitCost'

export type WideInventoryLocationColumnMap = Partial<
  Record<WideInventoryMetric, string>
>

export interface InventoryValidationResult
  extends ValidationResult {
  columnMap: InventoryColumnMap
  sourceLayout: InventorySourceLayout
  wideLocationColumns: Record<
    string,
    WideInventoryLocationColumnMap
  >
  missingRequiredFields: InventoryField[]
  missingRecommendedFields: InventoryField[]
  unknownColumns: string[]
}

export function normalizeInventoryHeader(
  value: string,
): string {
  return value
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function findMatchingColumn(
  headers: string[],
  aliases: readonly string[],
): string | undefined {
  const normalizedHeaders = new Map(
    headers.map((header) => [
      normalizeInventoryHeader(header),
      header,
    ]),
  )

  for (const alias of aliases) {
    const match = normalizedHeaders.get(
      normalizeInventoryHeader(alias),
    )

    if (match) {
      return match
    }
  }

  return undefined
}

const WIDE_METRIC_SUFFIXES: readonly [
  WideInventoryMetric,
  readonly string[],
][] = [
  ['onOrder', ['cantidad actual en orden']],
  ['onHand', ['en mano']],
  ['committed', ['cantidad comprometida']],
  ['available', ['cantidad actual disponible']],
  [
    'inTransit',
    [
      'cantidad actual en tránsito',
      'cantidad actual en transito',
      'cantidad en tránsito',
      'cantidad en transito',
    ],
  ],
  ['unitCost', ['average cost', 'costo promedio']],
]

const NORMALIZED_WIDE_METRIC_SUFFIXES =
  WIDE_METRIC_SUFFIXES.flatMap(([metric, suffixes]) =>
    suffixes.map((suffix) => ({
      metric,
      suffix: normalizeInventoryHeader(suffix),
    })),
  ).sort(
    (left, right) =>
      right.suffix.length - left.suffix.length,
  )

function parseWideLocationColumn(
  header: string,
): {
  location: string
  metric: WideInventoryMetric
} | null {
  const normalizedHeader = normalizeInventoryHeader(header)

  for (const {
    metric,
    suffix,
  } of NORMALIZED_WIDE_METRIC_SUFFIXES) {
    const separator = ` ${suffix}`

    if (!normalizedHeader.endsWith(separator)) {
      continue
    }

    const normalizedLocation = normalizedHeader
      .slice(0, -separator.length)
      .trim()

    if (
      !normalizedLocation ||
      normalizedLocation === 'total'
    ) {
      return null
    }

    return {
      location: normalizedLocation
        .toLocaleUpperCase('es-MX'),
      metric,
    }
  }

  return null
}

function buildWideLocationColumns(
  headers: readonly string[],
): Record<string, WideInventoryLocationColumnMap> {
  const result: Record<
    string,
    WideInventoryLocationColumnMap
  > = {}

  for (const header of headers) {
    const parsed = parseWideLocationColumn(header)

    if (!parsed) {
      continue
    }

    const locationColumns = result[parsed.location] ?? {}
    locationColumns[parsed.metric] = header
    result[parsed.location] = locationColumns
  }

  return Object.fromEntries(
    Object.entries(result).filter(
      ([, columns]) => Boolean(columns.onHand),
    ),
  )
}

export function validateInventoryHeaders(
  headers: string[],
): InventoryValidationResult {
  /*
   * Preserve the exact source header as the row lookup key.
   *
   * Excel reports may contain leading spaces, repeated spaces, or NBSP
   * characters in the physical column name. Normalization is only for
   * matching; trimming the stored header breaks `row[column]` because the
   * original object key remains unchanged.
   */
  const sourceHeaders = headers
    .map((header) => String(header))
    .filter((header) => Boolean(normalizeInventoryHeader(header)))

  const columnMap: InventoryColumnMap = {}

  for (const field of ALL_INVENTORY_FIELDS) {
    const matchedColumn = findMatchingColumn(
      sourceHeaders,
      INVENTORY_COLUMN_ALIASES[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const longLayoutValid = REQUIRED_INVENTORY_FIELDS.every(
    (field) => Boolean(columnMap[field]),
  )

  const wideLocationColumns = buildWideLocationColumns(
    sourceHeaders,
  )
  const wideLayoutValid =
    Boolean(columnMap.productName) &&
    Object.keys(wideLocationColumns).length > 0

  const sourceLayout: InventorySourceLayout =
    longLayoutValid
      ? 'long'
      : 'wide_by_location'

  const valid = longLayoutValid || wideLayoutValid

  const missingRequiredFields = valid
    ? []
    : REQUIRED_INVENTORY_FIELDS.filter(
        (field) => !columnMap[field],
      )

  const missingRecommendedFields =
    RECOMMENDED_INVENTORY_FIELDS.filter((field) => {
      if (columnMap[field]) {
        return false
      }

      if (wideLayoutValid) {
        return ![
          'available',
          'inventoryValue',
        ].includes(field)
      }

      return true
    })

  const recognizedColumns = new Set(
    Object.values(columnMap).filter(
      (column): column is string => Boolean(column),
    ),
  )

  for (const columns of Object.values(wideLocationColumns)) {
    for (const column of Object.values(columns)) {
      if (column) {
        recognizedColumns.add(column)
      }
    }
  }

  return {
    valid,
    errors: missingRequiredFields.map((field) => ({
      column: field,
      message: `Falta una columna obligatoria para inventario: "${field}".`,
    })),
    warnings: missingRecommendedFields.map(
      (field) =>
        `No se encontró la columna recomendada de inventario "${field}".`,
    ),
    columnMap,
    sourceLayout,
    wideLocationColumns,
    missingRequiredFields: [...missingRequiredFields],
    missingRecommendedFields: [...missingRecommendedFields],
    unknownColumns: sourceHeaders.filter(
      (header) => !recognizedColumns.has(header),
    ),
  }
}
