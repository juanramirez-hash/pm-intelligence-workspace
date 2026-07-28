import type { ImportPlugin } from '../../engine/importPlugin'
import type { ReportDetectionResult } from '../../types/reportDetectionTypes'
import { buildProductMasterBusinessModel, summarizeProductMaster, type ProductMasterBusinessModel } from './productMasterBusinessModel'
import { normalizeProductMasterRows } from './productMasterNormalizer'
import type { NormalizedProductMasterRow, ProductMasterDatasetSummary, RawProductMasterRow } from './productMasterTypes'
import { normalizeProductMasterHeader, validateProductMasterHeaders, type ProductMasterValidationResult } from './productMasterValidator'

function extractHeaders(rows: RawProductMasterRow[]): string[] {
  const headers = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const clean = key.trim()
      if (clean) headers.add(clean)
    }
  }
  return [...headers]
}

function detect(headers: string[]): ReportDetectionResult {
  const validation = validateProductMasterHeaders(headers)
  const normalized = new Set(headers.map(normalizeProductMasterHeader))
  const signatureColumns = [
    'internal id',
    'vendor name code',
    'on hand',
    'on order',
    'clasificacion valor',
  ]
  const signatureMatches = signatureColumns.filter((column) => normalized.has(column)).length
  const requiredMatches = 3 - validation.missingRequiredFields.length
  const confidence = Math.min(100, Math.round((requiredMatches / 3) * 70 + (signatureMatches / signatureColumns.length) * 30))

  return {
    reportType: 'products',
    valid: validation.valid,
    confidence,
    matchedRequiredFields: Object.keys(validation.columnMap),
    matchedRecommendedFields: [],
    matchedOptionalFields: [],
    missingRequiredFields: validation.missingRequiredFields,
  }
}

export const productMasterImportPlugin: ImportPlugin<
  RawProductMasterRow,
  NormalizedProductMasterRow,
  ProductMasterBusinessModel,
  ProductMasterDatasetSummary,
  ProductMasterValidationResult
> = {
  reportType: 'products',
  detect,
  extractHeaders,
  validate: validateProductMasterHeaders,
  normalize: normalizeProductMasterRows,
  buildBusinessModel: buildProductMasterBusinessModel,
  process: summarizeProductMaster,
  createEmptySummary: (ignoredRows) => ({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    productsWithInventory: 0,
    productsOnOrder: 0,
    uniqueBrands: 0,
    duplicateCodes: 0,
    duplicateErpInternalIds: 0,
    ambiguousBrandModels: 0,
    processedRows: 0,
    ignoredRows,
  }),
}
