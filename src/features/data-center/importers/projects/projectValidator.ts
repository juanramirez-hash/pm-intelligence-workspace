import type { ValidationResult } from '../../types/commonTypes'
import {
  ALL_PROJECT_FIELDS,
  RECOMMENDED_PROJECT_FIELDS,
  REQUIRED_PROJECT_FIELDS,
} from './projectSchema'
import {
  PROJECT_COLUMN_ALIASES,
  type ProjectField,
} from './projectColumnAliases'

export type ProjectColumnMap =
  Partial<Record<ProjectField, string>>

export interface ProjectValidationResult
  extends ValidationResult {
  columnMap: ProjectColumnMap
  missingRequiredFields: ProjectField[]
  missingRecommendedFields: ProjectField[]
  unknownColumns: string[]
}

export function normalizeProjectHeader(
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
  headers: readonly string[],
  aliases: readonly string[],
): string | undefined {
  const normalizedHeaders = new Map(
    headers.map((header) => [
      normalizeProjectHeader(header),
      header,
    ]),
  )

  for (const alias of aliases) {
    const match = normalizedHeaders.get(
      normalizeProjectHeader(alias),
    )

    if (match) {
      return match
    }
  }

  return undefined
}

export function validateProjectHeaders(
  headers: string[],
): ProjectValidationResult {
  const sourceHeaders = headers
    .map((header) => String(header))
    .filter((header) => Boolean(normalizeProjectHeader(header)))

  const columnMap: ProjectColumnMap = {}

  for (const field of ALL_PROJECT_FIELDS) {
    const matchedColumn = findMatchingColumn(
      sourceHeaders,
      PROJECT_COLUMN_ALIASES[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields =
    REQUIRED_PROJECT_FIELDS.filter(
      (field) => !columnMap[field],
    )

  const missingRecommendedFields =
    RECOMMENDED_PROJECT_FIELDS.filter(
      (field) => !columnMap[field],
    )

  const recognizedColumns = new Set(
    Object.values(columnMap).filter(
      (column): column is string => Boolean(column),
    ),
  )

  const unknownColumns = sourceHeaders.filter(
    (header) => !recognizedColumns.has(header),
  )

  const errors = missingRequiredFields.map(
    (field) => ({
      message: `Falta la columna obligatoria de proyectos: ${field}.`,
    }),
  )

  const warnings = missingRecommendedFields.map(
    (field) =>
      `No se encontró la columna recomendada de proyectos: ${field}.`,
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
