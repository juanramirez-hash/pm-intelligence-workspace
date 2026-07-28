import type {
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessDataModel,
} from '../models'

export interface ProductIndexes {
  byId:
    Map<string, BusinessProduct>

  byCode:
    Map<string, BusinessProduct>

  byErpInternalId:
    Map<string, BusinessProduct>

  byBrandId:
    Map<string, BusinessProduct[]>

  byModel:
    Map<string, BusinessProduct[]>

  byBrandAndModel:
    Map<string, BusinessProduct[]>

  byVendorName:
    Map<string, BusinessProduct[]>

  byClassification:
    Map<string, BusinessProduct[]>

  byCategory:
    Map<string, BusinessProduct[]>

  bySubcategory1:
    Map<string, BusinessProduct[]>

  bySubcategory2:
    Map<string, BusinessProduct[]>

  byCatalogStatus:
    Map<string, BusinessProduct[]>

  byCommercialStatus:
    Map<string, BusinessProduct[]>

  byIdentitySource:
    Map<string, BusinessProduct[]>
}

export function normalizeProductIndexValue(
  value: string | null | undefined,
): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

export function buildBrandAndModelKey(
  brandId: string,
  model: string,
): string {
  const normalizedBrandId =
    normalizeProductIndexValue(brandId)

  const normalizedModel =
    normalizeProductIndexValue(model)

  if (!normalizedBrandId || !normalizedModel) {
    return ''
  }

  return `${normalizedBrandId}::${normalizedModel}`
}

function addToGroupedIndex(
  index: Map<string, BusinessProduct[]>,
  key: string,
  product: BusinessProduct,
): void {
  if (!key) {
    return
  }

  const products = index.get(key) ?? []
  products.push(product)
  index.set(key, products)
}

function sortGroupedIndex(
  index: Map<string, BusinessProduct[]>,
): void {
  for (const products of index.values()) {
    products.sort(
      (left, right) =>
        left.id.localeCompare(right.id),
    )
  }
}

export function buildProductIndexes(
  model: BusinessDataModel,
): ProductIndexes {
  const byId =
    new Map<string, BusinessProduct>()

  const byCode =
    new Map<string, BusinessProduct>()

  const byErpInternalId =
    new Map<string, BusinessProduct>()

  const byBrandId =
    new Map<string, BusinessProduct[]>()

  const byModel =
    new Map<string, BusinessProduct[]>()

  const byBrandAndModel =
    new Map<string, BusinessProduct[]>()

  const byVendorName =
    new Map<string, BusinessProduct[]>()

  const byClassification =
    new Map<string, BusinessProduct[]>()

  const byCategory =
    new Map<string, BusinessProduct[]>()

  const bySubcategory1 =
    new Map<string, BusinessProduct[]>()

  const bySubcategory2 =
    new Map<string, BusinessProduct[]>()

  const byCatalogStatus =
    new Map<string, BusinessProduct[]>()

  const byCommercialStatus =
    new Map<string, BusinessProduct[]>()

  const byIdentitySource =
    new Map<string, BusinessProduct[]>()

  for (const product of model.products.values()) {
    const normalizedId =
      normalizeProductIndexValue(product.id)

    const normalizedCode =
      normalizeProductIndexValue(product.code)

    const normalizedErpInternalId =
      normalizeProductIndexValue(product.erpInternalId)

    const normalizedBrandId =
      normalizeProductIndexValue(
        product.brandId || product.brand,
      )

    const normalizedModel =
      normalizeProductIndexValue(product.model)

    const normalizedVendorName =
      normalizeProductIndexValue(
        product.vendorName ??
        product.preferredVendor,
      )

    const normalizedClassification =
      normalizeProductIndexValue(
        product.classification ??
        product.productClass,
      )

    const normalizedCategory =
      normalizeProductIndexValue(
        product.category ??
        product.productClass,
      )

    const normalizedSubcategory1 =
      normalizeProductIndexValue(
        product.subcategory1 ??
        product.secondaryCategory1,
      )

    const normalizedSubcategory2 =
      normalizeProductIndexValue(
        product.subcategory2 ??
        product.secondaryCategory2,
      )

    const normalizedCatalogStatus =
      normalizeProductIndexValue(product.catalogStatus)

    const normalizedCommercialStatus =
      normalizeProductIndexValue(product.commercialStatus)

    const normalizedIdentitySource =
      normalizeProductIndexValue(product.identitySource)

    if (normalizedId) {
      byId.set(normalizedId, product)
    }

    if (normalizedCode) {
      byCode.set(normalizedCode, product)
    }

    if (normalizedErpInternalId) {
      byErpInternalId.set(
        normalizedErpInternalId,
        product,
      )
    }

    addToGroupedIndex(
      byBrandId,
      normalizedBrandId,
      product,
    )

    addToGroupedIndex(
      byModel,
      normalizedModel,
      product,
    )

    addToGroupedIndex(
      byBrandAndModel,
      buildBrandAndModelKey(
        normalizedBrandId,
        normalizedModel,
      ),
      product,
    )

    addToGroupedIndex(
      byVendorName,
      normalizedVendorName,
      product,
    )

    addToGroupedIndex(
      byClassification,
      normalizedClassification,
      product,
    )

    addToGroupedIndex(
      byCategory,
      normalizedCategory,
      product,
    )

    addToGroupedIndex(
      bySubcategory1,
      normalizedSubcategory1,
      product,
    )

    addToGroupedIndex(
      bySubcategory2,
      normalizedSubcategory2,
      product,
    )

    addToGroupedIndex(
      byCatalogStatus,
      normalizedCatalogStatus,
      product,
    )

    addToGroupedIndex(
      byCommercialStatus,
      normalizedCommercialStatus,
      product,
    )

    addToGroupedIndex(
      byIdentitySource,
      normalizedIdentitySource,
      product,
    )
  }

  const groupedIndexes = [
    byBrandId,
    byModel,
    byBrandAndModel,
    byVendorName,
    byClassification,
    byCategory,
    bySubcategory1,
    bySubcategory2,
    byCatalogStatus,
    byCommercialStatus,
    byIdentitySource,
  ]

  for (const index of groupedIndexes) {
    sortGroupedIndex(index)
  }

  return {
    byId,
    byCode,
    byErpInternalId,
    byBrandId,
    byModel,
    byBrandAndModel,
    byVendorName,
    byClassification,
    byCategory,
    bySubcategory1,
    bySubcategory2,
    byCatalogStatus,
    byCommercialStatus,
    byIdentitySource,
  }
}
