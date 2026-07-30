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
  | 'name'
  | 'erp_code'
  | 'brand_model'
  | 'none'

export type ProductIdentityAttributeWarning =
  | 'brand_mismatch'
  | 'model_mismatch'

export type ProductSalesReconciliationReason =
  | 'matched_by_name'
  | 'matched_by_name_with_attribute_warning'
  | 'historical_unlisted'
  | 'matched_by_erp_code'
  | 'matched_by_brand_model'
  | 'ambiguous_name'
  | 'ambiguous_erp_code'
  | 'ambiguous_brand_model'
  | 'product_not_found'
  | 'missing_product_identity'

export interface ProductSalesReconciliationResult {
  status: ProductSalesReconciliationStatus
  strategy: ProductSalesReconciliationStrategy
  reason: ProductSalesReconciliationReason

  product: NormalizedProductMasterRow | null
  candidateNames: string[]
  candidateCodes: string[]
  attributeWarnings: ProductIdentityAttributeWarning[]

  normalizedProductName: string | null
  normalizedProductCode: string | null
  normalizedBrandId: string | null
  normalizedModel: string | null
}

export interface ProductSalesReconciliationSummary {
  totalRows: number
  matchedRows: number
  matchedByName: number
  matchedByNameWithWarnings: number
  matchedHistoricalUnlisted: number
  matchedByErpCode: number
  matchedByBrandAndModel: number
  ambiguousRows: number
  ambiguousByName: number
  ambiguousByErpCode: number
  ambiguousByBrandAndModel: number
  unmatchedRows: number
  missingIdentityRows: number
  matchRate: number
}

export interface ProductSalesReconciliationIndex {
  byName: Map<string, NormalizedProductMasterRow[]>
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

export function getProductMasterName(
  product: Pick<NormalizedProductMasterRow, 'name' | 'code'>,
): string {
  /*
   * Rows persisted by IQ-001 do not contain `name` yet. Falling back to
   * `code` makes the migration backward compatible because IQ-001 mapped the
   * ERP Name column into code.
   */
  return product.name ?? product.code
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
        getProductMasterName(left).localeCompare(
          getProductMasterName(right),
        ) || left.code.localeCompare(right.code),
    )
  }
}

export function buildProductSalesReconciliationIndex(
  productMaster: readonly NormalizedProductMasterRow[],
): ProductSalesReconciliationIndex {
  const byName =
    new Map<string, NormalizedProductMasterRow[]>()

  const byCode =
    new Map<string, NormalizedProductMasterRow[]>()

  const byBrandAndModel =
    new Map<string, NormalizedProductMasterRow[]>()

  for (const product of productMaster) {
    addCandidate(
      byName,
      normalizeProductIdentityValue(
        getProductMasterName(product),
      ),
      product,
    )

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

  sortCandidateIndexes(byName)
  sortCandidateIndexes(byCode)
  sortCandidateIndexes(byBrandAndModel)

  return {
    byName,
    byCode,
    byBrandAndModel,
  }
}

function toCandidateNames(
  candidates: readonly NormalizedProductMasterRow[],
): string[] {
  return candidates
    .map(getProductMasterName)
    .sort((left, right) => left.localeCompare(right))
}

function toCandidateCodes(
  candidates: readonly NormalizedProductMasterRow[],
): string[] {
  return candidates
    .map((candidate) => candidate.code)
    .sort((left, right) => left.localeCompare(right))
}

function getAttributeWarnings(
  row: Pick<NormalizedSalesRow, 'brand' | 'model'>,
  product: NormalizedProductMasterRow,
): ProductIdentityAttributeWarning[] {
  const warnings: ProductIdentityAttributeWarning[] = []

  const rowBrand = normalizeProductIdentityValue(row.brand)
  const productBrand = normalizeProductIdentityValue(product.brand)

  if (rowBrand && productBrand && rowBrand !== productBrand) {
    warnings.push('brand_mismatch')
  }

  const rowModel = normalizeProductIdentityValue(row.model)
  const productModel = normalizeProductIdentityValue(product.model)

  if (rowModel && productModel && rowModel !== productModel) {
    warnings.push('model_mismatch')
  }

  return warnings
}

function createResult(
  partial: Pick<
    ProductSalesReconciliationResult,
    | 'status'
    | 'strategy'
    | 'reason'
    | 'product'
    | 'candidateNames'
    | 'candidateCodes'
    | 'attributeWarnings'
  >,
  normalizedProductName: string | null,
  normalizedProductCode: string | null,
  normalizedBrandId: string | null,
  normalizedModel: string | null,
): ProductSalesReconciliationResult {
  return {
    ...partial,
    normalizedProductName,
    normalizedProductCode,
    normalizedBrandId,
    normalizedModel,
  }
}

export function reconcileSalesProduct(
  row: Pick<
    NormalizedSalesRow,
    'productName' | 'productCode' | 'brand' | 'model'
  >,
  index: ProductSalesReconciliationIndex,
): ProductSalesReconciliationResult {
  const normalizedProductName =
    normalizeProductIdentityValue(row.productName)

  const normalizedProductCode =
    normalizeProductIdentityValue(row.productCode)

  const normalizedBrandId =
    normalizeProductIdentityValue(row.brand)

  const normalizedModel =
    normalizeProductIdentityValue(row.model)

  if (normalizedProductName) {
    const nameCandidates =
      index.byName.get(normalizedProductName) ?? []

    if (nameCandidates.length === 1) {
      const product = nameCandidates[0] ?? null
      const attributeWarnings = product
        ? getAttributeWarnings(row, product)
        : []

      return createResult(
        {
          status: 'matched',
          strategy: 'name',
          reason:
            attributeWarnings.length > 0
              ? 'matched_by_name_with_attribute_warning'
              : 'matched_by_name',
          product,
          candidateNames: toCandidateNames(nameCandidates),
          candidateCodes: toCandidateCodes(nameCandidates),
          attributeWarnings,
        },
        normalizedProductName,
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      )
    }

    if (nameCandidates.length > 1) {
      return createResult(
        {
          status: 'ambiguous',
          strategy: 'name',
          reason: 'ambiguous_name',
          product: null,
          candidateNames: toCandidateNames(nameCandidates),
          candidateCodes: toCandidateCodes(nameCandidates),
          attributeWarnings: [],
        },
        normalizedProductName,
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      )
    }
  }

  /* Legacy explicit product codes remain a controlled secondary fallback. */
  if (normalizedProductCode) {
    const codeCandidates =
      index.byCode.get(normalizedProductCode) ?? []

    if (codeCandidates.length === 1) {
      return createResult(
        {
          status: 'matched',
          strategy: 'erp_code',
          reason: 'matched_by_erp_code',
          product: codeCandidates[0] ?? null,
          candidateNames: toCandidateNames(codeCandidates),
          candidateCodes: toCandidateCodes(codeCandidates),
          attributeWarnings: [],
        },
        normalizedProductName,
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      )
    }

    if (codeCandidates.length > 1) {
      return createResult(
        {
          status: 'ambiguous',
          strategy: 'erp_code',
          reason: 'ambiguous_erp_code',
          product: null,
          candidateNames: toCandidateNames(codeCandidates),
          candidateCodes: toCandidateCodes(codeCandidates),
          attributeWarnings: [],
        },
        normalizedProductName,
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      )
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
      return createResult(
        {
          status: 'matched',
          strategy: 'brand_model',
          reason: 'matched_by_brand_model',
          product: brandModelCandidates[0] ?? null,
          candidateNames: toCandidateNames(brandModelCandidates),
          candidateCodes: toCandidateCodes(brandModelCandidates),
          attributeWarnings: [],
        },
        normalizedProductName,
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      )
    }

    if (brandModelCandidates.length > 1) {
      return createResult(
        {
          status: 'ambiguous',
          strategy: 'brand_model',
          reason: 'ambiguous_brand_model',
          product: null,
          candidateNames: toCandidateNames(brandModelCandidates),
          candidateCodes: toCandidateCodes(brandModelCandidates),
          attributeWarnings: [],
        },
        normalizedProductName,
        normalizedProductCode,
        normalizedBrandId,
        normalizedModel,
      )
    }
  }

  if (normalizedProductName) {
    /*
     * A unique Name coming from historical sales remains a valid business
     * identity even when the item is no longer present in the current
     * Product Master. It is materialized as a historical sales identity and
     * must not block Inventory Workspace.
     */
    return createResult(
      {
        status: 'matched',
        strategy: 'name',
        reason: 'historical_unlisted',
        product: null,
        candidateNames: [],
        candidateCodes: [],
        attributeWarnings: [],
      },
      normalizedProductName,
      normalizedProductCode,
      normalizedBrandId,
      normalizedModel,
    )
  }

  return createResult(
    {
      status: 'unmatched',
      strategy: 'none',
      reason:
        normalizedProductName ||
        normalizedProductCode ||
        brandModelKey
          ? 'product_not_found'
          : 'missing_product_identity',
      product: null,
      candidateNames: [],
      candidateCodes: [],
      attributeWarnings: [],
    },
    normalizedProductName,
    normalizedProductCode,
    normalizedBrandId,
    normalizedModel,
  )
}

export function createProductSalesReconciliationSummary():
  ProductSalesReconciliationSummary {
  return {
    totalRows: 0,
    matchedRows: 0,
    matchedByName: 0,
    matchedByNameWithWarnings: 0,
    matchedHistoricalUnlisted: 0,
    matchedByErpCode: 0,
    matchedByBrandAndModel: 0,
    ambiguousRows: 0,
    ambiguousByName: 0,
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

    if (result.reason === 'matched_by_name') {
      summary.matchedByName += 1
    }

    if (result.reason === 'matched_by_name_with_attribute_warning') {
      summary.matchedByName += 1
      summary.matchedByNameWithWarnings += 1
    }

    if (result.reason === 'historical_unlisted') {
      summary.matchedByName += 1
      summary.matchedHistoricalUnlisted += 1
    }

    if (result.reason === 'matched_by_erp_code') {
      summary.matchedByErpCode += 1
    }

    if (result.reason === 'matched_by_brand_model') {
      summary.matchedByBrandAndModel += 1
    }
  } else if (result.status === 'ambiguous') {
    summary.ambiguousRows += 1

    if (result.reason === 'ambiguous_name') {
      summary.ambiguousByName += 1
    }

    if (result.reason === 'ambiguous_erp_code') {
      summary.ambiguousByErpCode += 1
    }

    if (result.reason === 'ambiguous_brand_model') {
      summary.ambiguousByBrandAndModel += 1
    }
  } else {
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
