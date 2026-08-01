import type { ValidationResult } from '../../types/commonTypes'
import {
  ALL_EXCHANGE_RATE_FIELDS,
  RECOMMENDED_EXCHANGE_RATE_FIELDS,
  REQUIRED_EXCHANGE_RATE_FIELDS,
} from './exchangeRateSchema'
import {
  EXCHANGE_RATE_COLUMN_ALIASES,
  type ExchangeRateField,
} from './exchangeRateColumnAliases'

export type ExchangeRateColumnMap =
  Partial<Record<ExchangeRateField, string>>

export interface ExchangeRateValidationResult
  extends ValidationResult {
  columnMap: ExchangeRateColumnMap
  missingRequiredFields: ExchangeRateField[]
  missingRecommendedFields: ExchangeRateField[]
  unknownColumns: string[]
}

function normalizeHeader(value: string): string {
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

export function validateExchangeRateHeaders(
  headers: string[],
): ExchangeRateValidationResult {
  const sourceHeaders = headers
    .map((header) => String(header))
    .filter((header) => Boolean(normalizeHeader(header)))
  const columnMap: ExchangeRateColumnMap = {}

  for (const field of ALL_EXCHANGE_RATE_FIELDS) {
    const matchedColumn = findMatchingColumn(
      sourceHeaders,
      EXCHANGE_RATE_COLUMN_ALIASES[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields =
    REQUIRED_EXCHANGE_RATE_FIELDS.filter(
      (field) => !columnMap[field],
    )
  const missingRecommendedFields =
    RECOMMENDED_EXCHANGE_RATE_FIELDS.filter(
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
        message: `Falta la columna obligatoria de tipo de cambio: ${field}.`,
      }),
    ),
    warnings: missingRecommendedFields.map(
      (field) =>
        `No se encontró la columna recomendada de tipo de cambio: ${field}.`,
    ),
    columnMap,
    missingRequiredFields,
    missingRecommendedFields,
    unknownColumns: sourceHeaders.filter(
      (header) => !recognizedColumns.has(header),
    ),
  }
}
