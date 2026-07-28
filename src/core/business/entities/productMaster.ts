export type ProductCommercialStatus = 'A' | 'B' | 'C' | 'D' | 'E'

/**
 * Canonical product identity owned by the Business Core.
 *
 * This entity contains stable catalogue attributes only. Transactional and
 * analytical values remain outside the master contract and will migrate to
 * specialised period/snapshot entities in later PMC sprints.
 */
export interface BusinessProductMaster {
  /** Stable business identifier. It will resolve to the ERP product code. */
  id: string

  /** ERP product code (catalogue `Name`). */
  code: string

  /** Internal numeric/string identifier assigned by the ERP. */
  erpInternalId: string | null

  /** Manufacturer or commercial model. */
  model: string

  /** Compatibility field used by current Product Workspace views. */
  sku: string

  /** Canonical brand identifier. */
  brandId: string

  /** Compatibility label retained while workspaces migrate to brandId. */
  brand: string

  description: string | null
  classification: string | null
  trend: string | null
  catalogStatus: string | null

  /** A-D measure customer penetration; E identifies a new product. */
  commercialStatus: ProductCommercialStatus | null

  vendorCode: string | null
  vendorName: string | null

  category: string | null
  subcategory1: string | null
  subcategory2: string | null

  createdAt: string | null
  updatedAt: string | null
}

/**
 * Transitional analytics contract.
 *
 * These fields preserve the current Product Intelligence implementation while
 * metrics are progressively moved to BusinessProductPeriod and future
 * inventory/cost snapshots. New code must not add catalogue attributes here.
 */
export interface BusinessProductLegacyAnalytics {
  firstSale: string | null
  lastSale: string | null

  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  activePeriods: Set<string>
  brands: Set<string>
  customers: Set<string>
  locations: Set<string>
}

/**
 * Temporary compatibility shape used by existing builders and workspaces.
 * BusinessProductMaster is the canonical identity contract from PMC-002.
 */
export type BusinessProduct =
  BusinessProductMaster & BusinessProductLegacyAnalytics
