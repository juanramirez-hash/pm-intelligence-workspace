import type { ValidationResult } from '../../types/commonTypes'
import {
  ALL_PROJECT_BILLING_FIELDS,
  RECOMMENDED_PROJECT_BILLING_FIELDS,
  REQUIRED_PROJECT_BILLING_FIELDS,
} from './projectBillingSchema'
import {
  PROJECT_BILLING_COLUMN_ALIASES,
  type ProjectBillingField,
} from './projectBillingColumnAliases'

export type ProjectBillingColumnMap =
  Partial<Record<ProjectBillingField, string>>

export interface ProjectBillingValidationResult
  extends ValidationResult {
  columnMap: ProjectBillingColumnMap
  missingRequiredFields: ProjectBillingField[]
  missingRecommendedFields: ProjectBillingField[]
  unknownColumns: string[]
}

export function normalizeProjectBillingHeader(
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
      normalizeProjectBillingHeader(header),
      header,
    ]),
  )

  for (const alias of aliases) {
    const match = normalizedHeaders.get(
      normalizeProjectBillingHeader(alias),
    )

    if (match) {
      return match
    }
  }

  return undefined
}

export function validateProjectBillingHeaders(
  headers: string[],
): ProjectBillingValidationResult {
  const sourceHeaders = headers
    .map((header) => String(header))
    .filter((header) => Boolean(normalizeProjectBillingHeader(header)))

  const columnMap: ProjectBillingColumnMap = {}

  for (const field of ALL_PROJECT_BILLING_FIELDS) {
    const matchedColumn = findMatchingColumn(
      sourceHeaders,
      PROJECT_BILLING_COLUMN_ALIASES[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields =
    REQUIRED_PROJECT_BILLING_FIELDS.filter(
      (field) => !columnMap[field],
    )
  const missingRecommendedFields =
    RECOMMENDED_PROJECT_BILLING_FIELDS.filter(
      (field) => !columnMap[field],
    )
  const recognizedColumns = new Set(
    Object.values(columnMap).filter(
      (column): column is string => Boolean(column),
    ),
  )

  return {
    valid: missingRequiredFields.length === 0,
    errors: missingRequiredFields.map(
      (field) => ({
        message: `Falta la columna obligatoria de facturación de proyectos: ${field}.`,
      }),
    ),
    warnings: missingRecommendedFields.map(
      (field) =>
        `No se encontró la columna recomendada de facturación de proyectos: ${field}.`,
    ),
    columnMap,
    missingRequiredFields,
    missingRecommendedFields,
    unknownColumns: sourceHeaders.filter(
      (header) => !recognizedColumns.has(header),
    ),
  }
}
