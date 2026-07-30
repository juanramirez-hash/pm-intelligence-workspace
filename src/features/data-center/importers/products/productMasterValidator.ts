import type {
  ValidationResult,
} from '../../types/commonTypes'

import {
  PRODUCT_MASTER_COLUMN_ALIASES,
  type ProductMasterField,
} from './productMasterColumnAliases'

import {
  ALL_PRODUCT_MASTER_FIELDS,
  RECOMMENDED_PRODUCT_MASTER_FIELDS,
  REQUIRED_PRODUCT_MASTER_FIELDS,
} from './productMasterSchema'

export type ProductMasterColumnMap =
  Partial<Record<ProductMasterField, string>>

export interface ProductMasterValidationResult
  extends ValidationResult {
  columnMap: ProductMasterColumnMap
  missingRequiredFields: ProductMasterField[]
  missingRecommendedFields: ProductMasterField[]
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

export function validateProductMasterHeaders(
  headers: string[],
): ProductMasterValidationResult {
  const cleanHeaders = headers
    .map((header) => String(header).trim())
    .filter(Boolean)

  const columnMap: ProductMasterColumnMap = {}

  for (const field of ALL_PRODUCT_MASTER_FIELDS) {
    const matchedColumn = findMatchingColumn(
      cleanHeaders,
      PRODUCT_MASTER_COLUMN_ALIASES[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields = REQUIRED_PRODUCT_MASTER_FIELDS.filter(
    (field) => !columnMap[field],
  )

  const missingRecommendedFields = RECOMMENDED_PRODUCT_MASTER_FIELDS.filter(
    (field) => !columnMap[field],
  )

  const recognizedColumns = new Set(
    Object.values(columnMap).filter(
      (column): column is string => Boolean(column),
    ),
  )

  const unknownColumns = cleanHeaders.filter(
    (header) => !recognizedColumns.has(header),
  )

  return {
    valid: missingRequiredFields.length === 0,
    errors: missingRequiredFields.map((field) => ({
      column: field,
      message: `Falta una columna obligatoria para el campo "${field}".`,
    })),
    warnings: missingRecommendedFields.map(
      (field) => `No se encontro la columna recomendada "${field}".`,
    ),
    columnMap,
    missingRequiredFields: [...missingRequiredFields],
    missingRecommendedFields: [...missingRecommendedFields],
    unknownColumns,
  }
}
