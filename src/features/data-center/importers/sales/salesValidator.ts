import type { ValidationResult } from '../../types/commonTypes'
import {
  salesColumnAliases,
  type SalesField,
} from './salesColumnAliases'
import {
  ALL_SALES_FIELDS,
  RECOMMENDED_SALES_FIELDS,
  REQUIRED_SALES_FIELDS,
} from './salesSchema'

export type SalesColumnMap = Partial<Record<SalesField, string>>

export interface SalesValidationResult extends ValidationResult {
  columnMap: SalesColumnMap
  missingRequiredFields: SalesField[]
  missingRecommendedFields: SalesField[]
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
    const matchedColumn = normalizedHeaders.get(
      normalizeHeader(alias),
    )

    if (matchedColumn) {
      return matchedColumn
    }
  }

  return undefined
}

export function validateSalesColumns(
  headers: string[],
): SalesValidationResult {
  const cleanHeaders = headers
    .map((header) => String(header).trim())
    .filter(Boolean)

  const columnMap: SalesColumnMap = {}

  for (const field of ALL_SALES_FIELDS) {
    const matchedColumn = findMatchingColumn(
      cleanHeaders,
      salesColumnAliases[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields = REQUIRED_SALES_FIELDS.filter(
    (field) => !columnMap[field],
  )

  const missingRecommendedFields =
    RECOMMENDED_SALES_FIELDS.filter(
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

  const errors = missingRequiredFields.map((field) => ({
    column: field,
    message: `Falta una columna obligatoria para el campo "${field}".`,
  }))

  const warnings = missingRecommendedFields.map(
    (field) =>
      `No se encontró una columna recomendada para el campo "${field}".`,
  )

  return {
    valid: missingRequiredFields.length === 0,
    errors,
    warnings,
    columnMap,
    missingRequiredFields,
    missingRecommendedFields,
    unknownColumns,
  }
}