import type { SpreadsheetRow } from '../../parsers/spreadsheetParser'
import type { ImportPlugin } from '../../engine/importPlugin'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'

import {
  OPTIONAL_INVENTORY_FIELDS,
  RECOMMENDED_INVENTORY_FIELDS,
  REQUIRED_INVENTORY_FIELDS,
} from './inventorySchema'
import {
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
  const headers = new Set<string>()

  for (const row of rows) {
    Object.keys(row).forEach((header) => {
      const cleanHeader = header.trim()
      if (cleanHeader) {
        headers.add(cleanHeader)
      }
    })
  }

  return [...headers]
}

function calculateConfidence(
  validation: InventoryValidationResult,
): number {
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
      matchedRequiredFields: REQUIRED_INVENTORY_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
      ),
      missingRequiredFields: validation.missingRequiredFields,
      matchedRecommendedFields: RECOMMENDED_INVENTORY_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
      ),
      matchedOptionalFields: OPTIONAL_INVENTORY_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
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
