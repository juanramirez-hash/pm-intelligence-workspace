import type {
  ValidationResult,
} from '../../types/commonTypes'
import {
  ALL_PURCHASE_REQUEST_FIELDS,
  RECOMMENDED_PURCHASE_REQUEST_FIELDS,
  REQUIRED_PURCHASE_REQUEST_FIELDS,
} from './purchaseRequestSchema'
import {
  PURCHASE_REQUEST_COLUMN_ALIASES,
  type PurchaseRequestField,
} from './purchaseRequestColumnAliases'

export type PurchaseRequestColumnMap =
  Partial<Record<PurchaseRequestField, string>>

export interface PurchaseRequestValidationResult
  extends ValidationResult {
  columnMap: PurchaseRequestColumnMap
  missingRequiredFields: PurchaseRequestField[]
  missingRecommendedFields: PurchaseRequestField[]
  unknownColumns: string[]
}

export function normalizePurchaseRequestHeader(
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
      normalizePurchaseRequestHeader(header),
      header,
    ]),
  )

  for (const alias of aliases) {
    const match = normalizedHeaders.get(
      normalizePurchaseRequestHeader(alias),
    )

    if (match) {
      return match
    }
  }

  return undefined
}

function getRecognizedColumns(
  headers: readonly string[],
): Set<string> {
  const normalizedAliases = new Set(
    Object.values(
      PURCHASE_REQUEST_COLUMN_ALIASES,
    )
      .flatMap((aliases) => aliases)
      .map(normalizePurchaseRequestHeader),
  )

  return new Set(
    headers.filter((header) =>
      normalizedAliases.has(
        normalizePurchaseRequestHeader(header),
      ),
    ),
  )
}

export function validatePurchaseRequestHeaders(
  headers: string[],
): PurchaseRequestValidationResult {
  const sourceHeaders = headers
    .map((header) => String(header))
    .filter((header) =>
      Boolean(
        normalizePurchaseRequestHeader(header),
      ),
    )

  const columnMap:
    PurchaseRequestColumnMap = {}

  for (
    const field of
    ALL_PURCHASE_REQUEST_FIELDS
  ) {
    const matchedColumn =
      findMatchingColumn(
        sourceHeaders,
        PURCHASE_REQUEST_COLUMN_ALIASES[field],
      )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields =
    REQUIRED_PURCHASE_REQUEST_FIELDS.filter(
      (field) => !columnMap[field],
    )

  const missingRecommendedFields =
    RECOMMENDED_PURCHASE_REQUEST_FIELDS.filter(
      (field) => !columnMap[field],
    )

  const recognizedColumns =
    getRecognizedColumns(sourceHeaders)

  return {
    valid:
      missingRequiredFields.length === 0,

    errors:
      missingRequiredFields.map(
        (field) => ({
          message:
            `Falta la columna obligatoria de solicitudes de compra: ${field}.`,
        }),
      ),

    warnings:
      missingRecommendedFields.map(
        (field) =>
          `No se encontró la columna recomendada de solicitudes de compra: ${field}.`,
      ),

    columnMap,
    missingRequiredFields,
    missingRecommendedFields,

    unknownColumns:
      sourceHeaders.filter(
        (header) =>
          !recognizedColumns.has(header),
      ),
  }
}