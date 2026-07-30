import type { ProductCommercialStatus } from '../../../../core/business/entities/product'

export interface RawProductMasterRow {
  [column: string]: unknown
}

/**
 * Normalized ERP catalogue row.
 *
 * Canonical Product Master fields coexist with their legacy aliases during
 * PMC-004 so existing Data Center and Product Workspace consumers continue
 * working while the Business Core adopts the canonical contract.
 */
export interface NormalizedProductMasterRow {
  erpInternalId: string | null
  /** Unique ERP Name: canonical product identity. */
  name: string
  /** Legacy/alternate code retained for compatibility and secondary lookup. */
  code: string
  model: string
  brand: string

  vendorCode: string | null
  vendorName?: string | null

  description: string | null
  classification?: string | null
  commercialStatus: ProductCommercialStatus | null
  trend: string | null

  category?: string | null
  subcategory1?: string | null
  subcategory2?: string | null

  createdAt?: string | null
  updatedAt?: string | null

  averageCostUsd: number | null
  totalValue: number | null
  currency: string | null
  inventoryValueMxn: number | null
  inventoryValueUsd: number | null
  lastPurchaseDate: string | null
  lastSaleDate: string | null
  unitsSoldLast90Days: number | null

  /** Legacy aliases retained until Product Workspace migration is complete. */
  preferredVendor: string | null
  productClass: string | null
  secondaryCategory1: string | null
  secondaryCategory2: string | null

  quantityPricingSchedule: string | null
  formulaText: string | null
  onHand: number | null
  onOrder: number | null
  catalogStatus: string | null
  inactiveForPurchases: boolean | null
  showOnPortal: boolean | null
  supersededBy: string | null
  blockPurchaseRequests: boolean | null
  directSubstitute: string | null
  benchmarkS: string | null
  benchmarkT: string | null
  benchmarkO: string | null
}

export interface ProductMasterDatasetSummary {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  productsWithInventory: number
  productsOnOrder: number
  uniqueBrands: number
  duplicateNames: number
  duplicateCodes: number
  duplicateErpInternalIds: number
  ambiguousBrandModels: number
  processedRows: number
  ignoredRows: number
}
