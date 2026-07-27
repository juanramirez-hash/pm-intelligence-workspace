import type { ValidationResult } from '../../types/commonTypes'
import {
  targetColumnAliases,
  type TargetField,
} from './targetColumnAliases'
import {
  ALL_TARGET_FIELDS,
  RECOMMENDED_TARGET_FIELDS,
  REQUIRED_TARGET_FIELDS,
} from './targetSchema'

export type TargetColumnMap = Partial<Record<TargetField, string>>

export interface TargetValidationResult extends ValidationResult {
  columnMap: TargetColumnMap
  missingRequiredFields: TargetField[]
  missingRecommendedFields: TargetField[]
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

export function validateTargetColumns(
  headers: string[],
): TargetValidationResult {
  const cleanHeaders = headers
    .map((header) => String(header).trim())
    .filter(Boolean)

  const columnMap: TargetColumnMap = {}

  for (const field of ALL_TARGET_FIELDS) {
    const matchedColumn = findMatchingColumn(
      cleanHeaders,
      targetColumnAliases[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields = REQUIRED_TARGET_FIELDS.filter(
    (field) => !columnMap[field],
  )

  const missingRecommendedFields = RECOMMENDED_TARGET_FIELDS.filter(
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

  return {
    valid: missingRequiredFields.length === 0,
    errors,
    warnings: missingRecommendedFields.map(
      (field) => `No se encontró la columna recomendada "${field}".`,
    ),
    columnMap,
    missingRequiredFields,
    missingRecommendedFields,
    unknownColumns,
  }
}
