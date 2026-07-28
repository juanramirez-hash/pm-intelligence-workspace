import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

export type ProductSalesReconciliationStatus =
  | 'matched'
  | 'ambiguous'
  | 'unmatched'

export type ProductSalesReconciliationStrategy =
  | 'erp_code'
  | 'brand_model'
  | 'none'

export type ProductSalesReconciliationReason =
  | 'matched_by_erp_code'
  | 'matched_by_brand_model'
  | 'ambiguous_erp_code'
  | 'ambiguous_brand_model'
  | 'product_not_found'
  | 'missing_product_identity'

export interface ProductSalesReconciliationResult {
  status: ProductSalesReconciliationStatus
  strategy: ProductSalesReconciliationStrategy
  reason: ProductSalesReconciliationReason

  product: NormalizedProductMasterRow | null
  candidateCodes: string[]

  normalizedProductCode: string | null
  normalizedBrandId: string | null
  normalizedModel: string | null
}

export interface ProductSalesReconciliationSummary {
  totalRows: number
  matchedRows: number
  matchedByErpCode: number
  matchedByBrandAndModel: number
  ambiguousRows: number
  ambiguousByErpCode: number
  ambiguousByBrandAndModel: number
  unmatchedRows: number
  missingIdentityRows: number
  matchRate: number
}

export interface ProductSalesReconciliationIndex {
  byCode: Map<string, NormalizedProductMasterRow[]>
  byBrandAndModel: Map<string, NormalizedProductMasterRow[]>
}

export function normalizeProductIdentityValue(
  value: string | null | undefined,
): string | null {
  const normalizedValue =
    (value ?? '')
      .trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalizedValue || null
}

export function buildProductBrandModelIdentityKey(
  brand: string | null | undefined,
  model: string | null | undefined,
): string | null {
  const normalizedBrand =
    normalizeProductIdentityValue(brand)

  const normalizedModel =
    normalizeProductIdentityValue(model)

  if (!normalizedBrand || !normalizedModel) {
    return null
  }

  return `${normalizedBrand}::${normalizedModel}`
}

function addCandidate(
  index: Map<string, NormalizedProductMasterRow[]>,
  key: string | null,
  product: NormalizedProductMasterRow,
): void {
  if (!key) {
    return
  }

  const candidates = index.get(key) ?? []
  candidates.push(product)
  index.set(key, candidates)
}

function sortCandidateIndexes(
  index: Map<string, NormalizedProductMasterRow[]>,
): void {
  for (const candidates of index.values()) {
    candidates.sort(
      (left, right) =>
        left.code.localeCompare(right.code),
    )
  }
}

export function buildProductSalesReconciliationIndex(
  productMaster: readonly NormalizedProductMasterRow[],
): ProductSalesReconciliationIndex {
  const byCode =
    new Map<string, NormalizedProductMasterRow[]>()

  const byBrandAndModel =
    new Map<string, NormalizedProductMasterRow[]>()

  for (const product of productMaster) {
    addCandidate(
      byCode,
      normalizeProductIdentityValue(product.code),
      product,
    )

    addCandidate(
      byBrandAndModel,
      buildProductBrandModelIdentityKey(
        product.brand,
        product.model,
      ),
      product,
    )
  }

  sortCandidateIndexes(byCode)
  sortCandidateIndexes(byBrandAndModel)

  return {
    byCode,
    byBrandAndModel,
  }
}

function toCandidateCodes(
  candidates: readonly NormalizedProductMasterRow[],
): string[] {
  return candidates
    .map((candidate) => candidate.code)
    .sort((left, right) => left.localeCompare(right))
}

export function reconcileSalesProduct(
  row: Pick<
    NormalizedSalesRow,
    'productCode' | 'brand' | 'model'
  >,
  index: ProductSalesReconciliationIndex,
): ProductSalesReconciliationResult {
  const normalizedProductCode =
    normalizeProductIdentityValue(row.productCode)

  const normalizedBrandId =
    normalizeProductIdentityValue(row.brand)

  const normalizedModel =
    normalizeProductIdentityValue(row.model)

  if (normalizedProductCode) {
    const codeCandidates =
      index.byCode.get(normalizedProductCode) ?? []

    if (codeCandidates.length === 1) {
      return {
        status: 'matched',
        strategy: 'erp_code',
        reason: 'matched_by_erp_code',
        product: codeCandidates[0] ?? null,
        candidateCodes: toCandidateCodes(codeCandidates),
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      }
    }

    if (codeCandidates.length > 1) {
      return {
        status: 'ambiguous',
        strategy: 'erp_code',
        reason: 'ambiguous_erp_code',
        product: null,
        candidateCodes: toCandidateCodes(codeCandidates),
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      }
    }
  }

  const brandModelKey =
    buildProductBrandModelIdentityKey(
      normalizedBrandId,
      normalizedModel,
    )

  if (brandModelKey) {
    const brandModelCandidates =
      index.byBrandAndModel.get(brandModelKey) ?? []

    if (brandModelCandidates.length === 1) {
      return {
        status: 'matched',
        strategy: 'brand_model',
        reason: 'matched_by_brand_model',
        product: brandModelCandidates[0] ?? null,
        candidateCodes: toCandidateCodes(brandModelCandidates),
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      }
    }

    if (brandModelCandidates.length > 1) {
      return {
        status: 'ambiguous',
        strategy: 'brand_model',
        reason: 'ambiguous_brand_model',
        product: null,
        candidateCodes: toCandidateCodes(brandModelCandidates),
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      }
    }
  }

  return {
    status: 'unmatched',
    strategy: 'none',
    reason:
      normalizedProductCode || brandModelKey
        ? 'product_not_found'
        : 'missing_product_identity',
    product: null,
    candidateCodes: [],
    normalizedProductCode,
    normalizedBrandId,
    normalizedModel,
  }
}

export function createProductSalesReconciliationSummary():
  ProductSalesReconciliationSummary {
  return {
    totalRows: 0,
    matchedRows: 0,
    matchedByErpCode: 0,
    matchedByBrandAndModel: 0,
    ambiguousRows: 0,
    ambiguousByErpCode: 0,
    ambiguousByBrandAndModel: 0,
    unmatchedRows: 0,
    missingIdentityRows: 0,
    matchRate: 0,
  }
}

export function registerProductSalesReconciliationResult(
  summary: ProductSalesReconciliationSummary,
  result: ProductSalesReconciliationResult,
): void {
  summary.totalRows += 1

  if (result.status === 'matched') {
    summary.matchedRows += 1

    if (result.strategy === 'erp_code') {
      summary.matchedByErpCode += 1
    }

    if (result.strategy === 'brand_model') {
      summary.matchedByBrandAndModel += 1
    }
  }

  if (result.status === 'ambiguous') {
    summary.ambiguousRows += 1

    if (result.strategy === 'erp_code') {
      summary.ambiguousByErpCode += 1
    }

    if (result.strategy === 'brand_model') {
      summary.ambiguousByBrandAndModel += 1
    }
  }

  if (result.status === 'unmatched') {
    summary.unmatchedRows += 1

    if (result.reason === 'missing_product_identity') {
      summary.missingIdentityRows += 1
    }
  }

  summary.matchRate =
    summary.totalRows > 0
      ? summary.matchedRows / summary.totalRows
      : 0
}
