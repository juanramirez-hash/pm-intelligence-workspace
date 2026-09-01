import type {
  ValidationResult,
} from '../../types/commonTypes'

import {
  CUSTOMER_MASTER_COLUMN_ALIASES,
  type CustomerMasterField,
} from './customerMasterColumnAliases'

import {
  ALL_CUSTOMER_MASTER_FIELDS,
  RECOMMENDED_CUSTOMER_MASTER_FIELDS,
  REQUIRED_CUSTOMER_MASTER_FIELDS,
} from './customerMasterSchema'

export type CustomerMasterColumnMap =
  Partial<Record<CustomerMasterField, string>>

export interface CustomerMasterValidationResult
  extends ValidationResult {
  columnMap: CustomerMasterColumnMap
  missingRequiredFields: CustomerMasterField[]
  missingRecommendedFields: CustomerMasterField[]
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
    headers.map((header) => [
      normalizeHeader(header),
      header,
    ]),
  )

  for (const alias of aliases) {
    const match =
      normalizedHeaders.get(
        normalizeHeader(alias),
      )

    if (match) {
      return match
    }
  }

  return undefined
}

export function validateCustomerMasterHeaders(
  headers: string[],
): CustomerMasterValidationResult {
  const cleanHeaders = headers
    .map((header) =>
      String(header).trim(),
    )
    .filter(Boolean)

  const columnMap:
    CustomerMasterColumnMap = {}

  for (
    const field of
      ALL_CUSTOMER_MASTER_FIELDS
  ) {
    const matchedColumn =
      findMatchingColumn(
        cleanHeaders,
        CUSTOMER_MASTER_COLUMN_ALIASES[
          field
        ],
      )

    if (matchedColumn) {
      columnMap[field] =
        matchedColumn
    }
  }

  const missingRequiredFields =
    REQUIRED_CUSTOMER_MASTER_FIELDS
      .filter(
        (field) =>
          !columnMap[field],
      )

  const missingRecommendedFields =
    RECOMMENDED_CUSTOMER_MASTER_FIELDS
      .filter(
        (field) =>
          !columnMap[field],
      )

  const recognizedColumns =
    new Set(
      Object.values(columnMap)
        .filter(
          (
            column,
          ): column is string =>
            Boolean(column),
        ),
    )

  const unknownColumns =
    cleanHeaders.filter(
      (header) =>
        !recognizedColumns.has(header),
    )

  return {
    valid:
      missingRequiredFields
        .length === 0,

    errors:
      missingRequiredFields.map(
        (field) => ({
          column: field,
          message:
            `Falta una columna obligatoria para el campo "${field}".`,
        }),
      ),

    warnings:
      missingRecommendedFields.map(
        (field) =>
          `No se encontro la columna recomendada "${field}".`,
      ),

    columnMap,

    missingRequiredFields: [
      ...missingRequiredFields,
    ],

    missingRecommendedFields: [
      ...missingRecommendedFields,
    ],

    unknownColumns,
  }
}