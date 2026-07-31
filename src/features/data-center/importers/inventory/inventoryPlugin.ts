import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import type { ImportPlugin } from '../../engine/importPlugin'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'

import {
  OPTIONAL_INVENTORY_FIELDS,
  RECOMMENDED_INVENTORY_FIELDS,
  REQUIRED_INVENTORY_FIELDS,
} from './inventorySchema'
import {
  normalizeInventoryHeader,
  validateInventoryHeaders,
  type InventoryValidationResult,
} from './inventoryValidator'
import { normalizeInventoryRows } from './inventoryNormalizer'
import {
  buildInventoryBusinessModel,
  type InventoryBusinessModel,
} from './inventoryBusinessModel'
import type {
  InventoryDatasetSummary,
  NormalizedInventoryRow,
} from './inventoryTypes'

const INVENTORY_REPORT_TYPE = 'inventory' as const

function extractHeaders(rows: SpreadsheetRow[]): string[] {
  /*
   * Preserve the exact spreadsheet key used by each row.
   *
   * Wide NetSuite inventory exports can contain leading spaces, repeated
   * spaces, or NBSP characters in physical column names. Trimming here
   * makes validation succeed but breaks the later `row[column]` lookup.
   * Normalization is used only to deduplicate equivalent headers.
   */
  const headersByNormalizedValue = new Map<string, string>()

  for (const row of rows) {
    for (const header of Object.keys(row)) {
      const normalizedHeader = normalizeInventoryHeader(header)

      if (
        normalizedHeader &&
        !headersByNormalizedValue.has(normalizedHeader)
      ) {
        headersByNormalizedValue.set(
          normalizedHeader,
          header,
        )
      }
    }
  }

  return [...headersByNormalizedValue.values()]
}

function matchedFields(
  validation: InventoryValidationResult,
  fields: readonly (keyof InventoryValidationResult['columnMap'])[],
): string[] {
  if (
    validation.valid &&
    validation.sourceLayout === 'wide_by_location'
  ) {
    return fields.map(String)
  }

  return fields
    .filter((field) => Boolean(validation.columnMap[field]))
    .map(String)
}

function calculateConfidence(
  validation: InventoryValidationResult,
): number {
  if (
    validation.valid &&
    validation.sourceLayout === 'wide_by_location'
  ) {
    const locations = Object.keys(
      validation.wideLocationColumns,
    ).length

    return Math.min(99, 90 + locations)
  }

  const required = REQUIRED_INVENTORY_FIELDS.filter(
    (field) => Boolean(validation.columnMap[field]),
  ).length
  const recommended = RECOMMENDED_INVENTORY_FIELDS.filter(
    (field) => Boolean(validation.columnMap[field]),
  ).length
  const optional = OPTIONAL_INVENTORY_FIELDS.filter(
    (field) => Boolean(validation.columnMap[field]),
  ).length

  return Math.round(
    (required / REQUIRED_INVENTORY_FIELDS.length) * 70 +
    (recommended / RECOMMENDED_INVENTORY_FIELDS.length) * 25 +
    (optional / OPTIONAL_INVENTORY_FIELDS.length) * 5,
  )
}

function createEmptySummary(
  ignoredRows: number,
): InventoryDatasetSummary {
  return {
    periodStart: null,
    periodEnd: null,
    totalPositions: 0,
    uniqueProducts: 0,
    uniqueLocations: 0,
    totalOnHand: 0,
    totalAvailable: 0,
    totalCommitted: 0,
    totalInTransit: 0,
    totalOnOrder: 0,
    totalInventoryValue: 0,
    negativeStockRows: 0,
    duplicatePositions: 0,
    processedRows: 0,
    ignoredRows,
  }
}

export const inventoryImportPlugin: ImportPlugin<
  SpreadsheetRow,
  NormalizedInventoryRow,
  InventoryBusinessModel,
  InventoryDatasetSummary,
  InventoryValidationResult
> = {
  reportType: INVENTORY_REPORT_TYPE,

  detect(headers): ReportDetectionResult {
    const validation = validateInventoryHeaders(headers)

    return {
      reportType: INVENTORY_REPORT_TYPE,
      valid: validation.valid,
      confidence: calculateConfidence(validation),
      matchedRequiredFields: matchedFields(
        validation,
        REQUIRED_INVENTORY_FIELDS,
      ),
      missingRequiredFields: validation.missingRequiredFields,
      matchedRecommendedFields: matchedFields(
        validation,
        RECOMMENDED_INVENTORY_FIELDS,
      ),
      matchedOptionalFields: matchedFields(
        validation,
        OPTIONAL_INVENTORY_FIELDS,
      ),
    }
  },

  extractHeaders,
  validate: validateInventoryHeaders,
  normalize: normalizeInventoryRows,
  buildBusinessModel: buildInventoryBusinessModel,
  process: (businessModel) => businessModel.summary,
  createEmptySummary,
}
