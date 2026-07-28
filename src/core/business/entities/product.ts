/**
 * Transitional compatibility entry point for PMC-002.
 *
 * BusinessProductMaster is the canonical catalogue identity. BusinessProduct
 * remains intentionally compatible with legacy tests, builders and workspaces
 * until all consumers migrate to period/snapshot entities.
 */
import type {
  BusinessProductLegacyAnalytics,
  BusinessProductMaster,
  ProductCommercialStatus,
} from './productMaster'

export type {
  BusinessProductLegacyAnalytics,
  BusinessProductMaster,
  ProductCommercialStatus,
} from './productMaster'

export type ProductIdentitySource =
  | 'product_master'
  | 'sales_fallback'
  | 'ambiguous_match'

/**
 * Compatibility shape used by the current BusinessDataModel.
 *
 * Legacy fields remain required because existing fixtures construct products
 * directly. Product Master attributes are optional here while the canonical
 * BusinessProductMaster contract remains strict in productMaster.ts.
 */
export interface BusinessProduct extends BusinessProductLegacyAnalytics {
  id: string
  model: string
  sku: string
  brand: string

  code?: BusinessProductMaster['code']
  erpInternalId?: BusinessProductMaster['erpInternalId']
  brandId?: BusinessProductMaster['brandId']
  description?: BusinessProductMaster['description']
  classification?: BusinessProductMaster['classification']
  trend?: BusinessProductMaster['trend']
  catalogStatus?: BusinessProductMaster['catalogStatus']
  commercialStatus?: ProductCommercialStatus | null
  vendorCode?: BusinessProductMaster['vendorCode']
  vendorName?: BusinessProductMaster['vendorName']
  category?: BusinessProductMaster['category']
  subcategory1?: BusinessProductMaster['subcategory1']
  subcategory2?: BusinessProductMaster['subcategory2']
  createdAt?: BusinessProductMaster['createdAt']
  updatedAt?: BusinessProductMaster['updatedAt']

  identitySource?: ProductIdentitySource

  averageCostUsd?: number | null
  totalValue?: number | null
  currency?: string | null
  inventoryValueMxn?: number | null
  inventoryValueUsd?: number | null
  lastPurchaseDate?: string | null
  lastCatalogSaleDate?: string | null
  unitsSoldLast90Days?: number | null
  preferredVendor?: string | null
  productClass?: string | null
  secondaryCategory1?: string | null
  secondaryCategory2?: string | null
  quantityPricingSchedule?: string | null
  formulaText?: string | null
  onHand?: number | null
  onOrder?: number | null
  inactiveForPurchases?: boolean | null
  showOnPortal?: boolean | null
  supersededBy?: string | null
  blockPurchaseRequests?: boolean | null
  directSubstitute?: string | null
  benchmarkS?: string | null
  benchmarkT?: string | null
  benchmarkO?: string | null
}
