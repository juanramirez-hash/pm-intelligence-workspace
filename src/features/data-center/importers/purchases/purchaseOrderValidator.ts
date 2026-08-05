import type {
  ValidationResult,
} from '../../types/commonTypes'
import {
  ALL_PURCHASE_ORDER_FIELDS,
  RECOMMENDED_PURCHASE_ORDER_FIELDS,
  REQUIRED_PURCHASE_ORDER_FIELDS,
} from './purchaseOrderSchema'
import {
  PURCHASE_ORDER_COLUMN_ALIASES,
  type PurchaseOrderField,
} from './purchaseOrderColumnAliases'

export type PurchaseOrderColumnMap =
  Partial<Record<PurchaseOrderField, string>>

export interface PurchaseOrderValidationResult
  extends ValidationResult {
  columnMap: PurchaseOrderColumnMap
  missingRequiredFields: PurchaseOrderField[]
  missingRecommendedFields: PurchaseOrderField[]
  unknownColumns: string[]
}

export function normalizePurchaseOrderHeader(
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
      normalizePurchaseOrderHeader(header),
      header,
    ]),
  )

  for (const alias of aliases) {
    const match = normalizedHeaders.get(
      normalizePurchaseOrderHeader(alias),
    )

    if (match) {
      return match
    }
  }

  return undefined
}

export function validatePurchaseOrderHeaders(
  headers: string[],
): PurchaseOrderValidationResult {
  const sourceHeaders = headers
    .map((header) => String(header))
    .filter((header) =>
      Boolean(normalizePurchaseOrderHeader(header)),
    )

  const columnMap: PurchaseOrderColumnMap = {}

  for (const field of ALL_PURCHASE_ORDER_FIELDS) {
    const matchedColumn = findMatchingColumn(
      sourceHeaders,
      PURCHASE_ORDER_COLUMN_ALIASES[field],
    )

    if (matchedColumn) {
      columnMap[field] = matchedColumn
    }
  }

  const missingRequiredFields =
    REQUIRED_PURCHASE_ORDER_FIELDS.filter(
      (field) => !columnMap[field],
    )

  const missingRecommendedFields =
    RECOMMENDED_PURCHASE_ORDER_FIELDS.filter(
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
        message:
          `Falta la columna obligatoria de órdenes de compra: ${field}.`,
      }),
    ),
    warnings: missingRecommendedFields.map(
      (field) =>
        `No se encontró la columna recomendada de órdenes de compra: ${field}.`,
    ),
    columnMap,
    missingRequiredFields,
    missingRecommendedFields,
    unknownColumns: sourceHeaders.filter(
      (header) => !recognizedColumns.has(header),
    ),
  }
}