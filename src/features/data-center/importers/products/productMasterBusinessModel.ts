import type { NormalizedProductMasterRow, ProductMasterDatasetSummary } from './productMasterTypes'

export interface ProductMasterBusinessModel {
  productsByCode: Map<string, NormalizedProductMasterRow>
  productsByErpInternalId: Map<string, NormalizedProductMasterRow>
  productsByBrandModel: Map<string, NormalizedProductMasterRow[]>
  duplicateCodes: Set<string>
  duplicateErpInternalIds: Set<string>
  ambiguousBrandModels: Set<string>
  processedRows: number
  ignoredRows: number
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLocaleUpperCase('es-MX').replace(/\s+/g, ' ')
}

function brandModelKey(brand: string, model: string): string {
  return `${normalizeIdentifier(brand)}::${normalizeIdentifier(model)}`
}

export function buildProductMasterBusinessModel(
  rows: NormalizedProductMasterRow[],
  ignoredRows = 0,
): ProductMasterBusinessModel {
  const model: ProductMasterBusinessModel = {
    productsByCode: new Map(),
    productsByErpInternalId: new Map(),
    productsByBrandModel: new Map(),
    duplicateCodes: new Set(),
    duplicateErpInternalIds: new Set(),
    ambiguousBrandModels: new Set(),
    processedRows: rows.length,
    ignoredRows,
  }

  for (const row of rows) {
    const existingCode = model.productsByCode.get(row.code)
    if (existingCode) model.duplicateCodes.add(row.code)
    else model.productsByCode.set(row.code, row)

    if (row.erpInternalId) {
      const existingInternalId = model.productsByErpInternalId.get(row.erpInternalId)
      if (existingInternalId) model.duplicateErpInternalIds.add(row.erpInternalId)
      else model.productsByErpInternalId.set(row.erpInternalId, row)
    }

    const key = brandModelKey(row.brand, row.model)
    const candidates = model.productsByBrandModel.get(key) ?? []
    candidates.push(row)
    model.productsByBrandModel.set(key, candidates)
    if (candidates.length > 1) model.ambiguousBrandModels.add(key)
  }

  return model
}

export function summarizeProductMaster(
  model: ProductMasterBusinessModel,
): ProductMasterDatasetSummary {
  const products = [...model.productsByCode.values()]
  const inactive = products.filter((product) =>
    product.catalogStatus?.toLocaleUpperCase('es-MX').includes('INACT') ||
    product.inactiveForPurchases === true,
  ).length

  return {
    totalProducts: products.length,
    activeProducts: products.length - inactive,
    inactiveProducts: inactive,
    productsWithInventory: products.filter((product) => (product.onHand ?? 0) > 0).length,
    productsOnOrder: products.filter((product) => (product.onOrder ?? 0) > 0).length,
    uniqueBrands: new Set(products.map((product) => normalizeIdentifier(product.brand))).size,
    duplicateCodes: model.duplicateCodes.size,
    duplicateErpInternalIds: model.duplicateErpInternalIds.size,
    ambiguousBrandModels: model.ambiguousBrandModels.size,
    processedRows: model.processedRows,
    ignoredRows: model.ignoredRows,
  }
}
