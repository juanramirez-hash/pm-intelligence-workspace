import type {
  ImportPlugin,
} from '../../engine/importPlugin'

import type {
  SpreadsheetRow,
} from '../../parsers/spreadsheetParser'

import type {
  ReportDetectionResult,
} from '../../types/reportDetectionTypes'

import {
  buildProductMasterBusinessModel,
  type ProductMasterBusinessModel,
} from './productMasterBusinessModel'

import {
  normalizeProductMasterRows,
} from './productMasterNormalizer'

import {
  OPTIONAL_PRODUCT_MASTER_FIELDS,
  RECOMMENDED_PRODUCT_MASTER_FIELDS,
  REQUIRED_PRODUCT_MASTER_FIELDS,
} from './productMasterSchema'

import type {
  NormalizedProductMasterRow,
  ProductMasterDatasetSummary,
} from './productMasterTypes'

import {
  validateProductMasterHeaders,
  type ProductMasterValidationResult,
} from './productMasterValidator'

const PRODUCT_MASTER_REPORT_TYPE = 'products' as const

function extractHeaders(rows: SpreadsheetRow[]): string[] {
  const headers = new Set<string>()

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim()

      if (cleanKey) {
        headers.add(cleanKey)
      }
    }
  }

  return [...headers]
}

function calculateConfidence(
  validation: ProductMasterValidationResult,
): number {
  const required = REQUIRED_PRODUCT_MASTER_FIELDS.filter(
    (field) => Boolean(validation.columnMap[field]),
  ).length

  const recommended = RECOMMENDED_PRODUCT_MASTER_FIELDS.filter(
    (field) => Boolean(validation.columnMap[field]),
  ).length

  const optional = OPTIONAL_PRODUCT_MASTER_FIELDS.filter(
    (field) => Boolean(validation.columnMap[field]),
  ).length

  return Math.round(
    (required / REQUIRED_PRODUCT_MASTER_FIELDS.length) * 65 +
    (recommended / RECOMMENDED_PRODUCT_MASTER_FIELDS.length) * 25 +
    (optional / OPTIONAL_PRODUCT_MASTER_FIELDS.length) * 10,
  )
}

function createEmptySummary(
  ignoredRows: number,
): ProductMasterDatasetSummary {
  return {
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    productsWithInventory: 0,
    productsOnOrder: 0,
    uniqueBrands: 0,
    duplicateNames: 0,
    duplicateCodes: 0,
    duplicateErpInternalIds: 0,
    ambiguousBrandModels: 0,
    processedRows: 0,
    ignoredRows,
  }
}

export const productMasterImportPlugin: ImportPlugin<
  SpreadsheetRow,
  NormalizedProductMasterRow,
  ProductMasterBusinessModel,
  ProductMasterDatasetSummary,
  ProductMasterValidationResult
> = {
  reportType: PRODUCT_MASTER_REPORT_TYPE,

  detect(headers): ReportDetectionResult {
    const validation = validateProductMasterHeaders(headers)

    return {
      reportType: PRODUCT_MASTER_REPORT_TYPE,
      valid: validation.valid,
      confidence: calculateConfidence(validation),
      matchedRequiredFields: REQUIRED_PRODUCT_MASTER_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
      ),
      missingRequiredFields: validation.missingRequiredFields,
      matchedRecommendedFields: RECOMMENDED_PRODUCT_MASTER_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
      ),
      matchedOptionalFields: OPTIONAL_PRODUCT_MASTER_FIELDS.filter(
        (field) => Boolean(validation.columnMap[field]),
      ),
    }
  },

  extractHeaders,
  validate: validateProductMasterHeaders,
  normalize: normalizeProductMasterRows,
  buildBusinessModel: buildProductMasterBusinessModel,
  process: (businessModel) => businessModel.summary,
  createEmptySummary,
}
