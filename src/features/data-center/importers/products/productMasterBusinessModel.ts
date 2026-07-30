import type {
  NormalizedProductMasterRow,
  ProductMasterDatasetSummary,
} from './productMasterTypes'

export interface ProductMasterBusinessModel {
  products: NormalizedProductMasterRow[]
  summary: ProductMasterDatasetSummary
}

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function countDuplicateGroups(values: string[]): number {
  const counts = new Map<string, number>()

  for (const value of values) {
    if (!value) {
      continue
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return [...counts.values()].filter((count) => count > 1).length
}

function isInactive(product: NormalizedProductMasterRow): boolean {
  if (product.inactiveForPurchases === true) {
    return true
  }

  const status = normalize(product.catalogStatus)

  return [
    'INACTIVO',
    'INACTIVE',
    'DESCONTINUADO',
    'DISCONTINUED',
  ].includes(status)
}

export function buildProductMasterBusinessModel(
  products: NormalizedProductMasterRow[],
  ignoredRows: number,
): ProductMasterBusinessModel {
  const uniqueBrands = new Set<string>()
  let activeProducts = 0
  let inactiveProducts = 0
  let productsWithInventory = 0
  let productsOnOrder = 0

  for (const product of products) {
    uniqueBrands.add(normalize(product.brand))

    if (isInactive(product)) {
      inactiveProducts += 1
    } else {
      activeProducts += 1
    }

    if ((product.onHand ?? 0) > 0) {
      productsWithInventory += 1
    }

    if ((product.onOrder ?? 0) > 0) {
      productsOnOrder += 1
    }
  }

  const duplicateNames = countDuplicateGroups(
    products.map((product) => normalize(product.name ?? product.code)),
  )

  const duplicateCodes = countDuplicateGroups(
    products.map((product) => normalize(product.code)),
  )

  const duplicateErpInternalIds = countDuplicateGroups(
    products.map((product) => normalize(product.erpInternalId)),
  )

  const ambiguousBrandModels = countDuplicateGroups(
    products.map((product) =>
      `${normalize(product.brand)}::${normalize(product.model)}`,
    ),
  )

  return {
    products,
    summary: {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts,
      productsWithInventory,
      productsOnOrder,
      uniqueBrands: uniqueBrands.size,
      duplicateNames,
      duplicateCodes,
      duplicateErpInternalIds,
      ambiguousBrandModels,
      processedRows: products.length,
      ignoredRows,
    },
  }
}
