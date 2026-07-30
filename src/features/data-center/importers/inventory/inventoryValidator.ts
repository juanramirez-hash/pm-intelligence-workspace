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

export interface InventoryValidationResult
  extends ValidationResult {
  columnMap: InventoryColumnMap
  missingRequiredFields: InventoryField[]
  missingRecommendedFields: InventoryField[]
  unknownColumns: string[]
}

function normalizeHeader(value: string): string {
  return value
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
    headers.map((header) => [normalizeHeader(header), header]),
  )

  for (const alias of aliases) {
    const match = normalizedHeaders.get(normalizeHeader(alias))

    if (match) {
      return match
    }
  }

  return undefined
}

export function validateInventoryHeaders(
  headers: string[],
): InventoryValidationResult {
  const cleanHeaders = headers
    .map((header) => String(header).trim())
    .filter(Boolean)

  const columnMap: InventoryColumnMap = {}

  for (const field of ALL_INVENTORY_FIELDS) {
    const matchedColumn = findMatchingColumn(
      cleanHeaders,
      INVENTORY_COLUMN_ALIASES[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields = REQUIRED_INVENTORY_FIELDS.filter(
    (field) => !columnMap[field],
  )
  const missingRecommendedFields = RECOMMENDED_INVENTORY_FIELDS.filter(
    (field) => !columnMap[field],
  )
  const recognizedColumns = new Set(
    Object.values(columnMap).filter(
      (column): column is string => Boolean(column),
    ),
  )

  return {
    valid: missingRequiredFields.length === 0,
    errors: missingRequiredFields.map((field) => ({
      column: field,
      message: `Falta una columna obligatoria para inventario: "${field}".`,
    })),
    warnings: missingRecommendedFields.map(
      (field) => `No se encontró la columna recomendada de inventario "${field}".`,
    ),
    columnMap,
    missingRequiredFields: [...missingRequiredFields],
    missingRecommendedFields: [...missingRecommendedFields],
    unknownColumns: cleanHeaders.filter(
      (header) => !recognizedColumns.has(header),
    ),
  }
}
