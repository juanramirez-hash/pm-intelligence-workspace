import type {
  ProductMasterField,
} from './productMasterColumnAliases'

export const REQUIRED_PRODUCT_MASTER_FIELDS = [
  'name',
  'model',
  'brand',
] as const satisfies readonly ProductMasterField[]

export const RECOMMENDED_PRODUCT_MASTER_FIELDS = [
  'erpInternalId',
  'code',
  'description',
  'commercialStatus',
  'category',
] as const satisfies readonly ProductMasterField[]

export const OPTIONAL_PRODUCT_MASTER_FIELDS = [
  'vendorCode',
  'vendorName',
  'classification',
  'trend',
  'subcategory1',
  'subcategory2',
  'createdAt',
  'updatedAt',
  'averageCostUsd',
  'totalValue',
  'currency',
  'inventoryValueMxn',
  'inventoryValueUsd',
  'lastPurchaseDate',
  'lastSaleDate',
  'unitsSoldLast90Days',
  'preferredVendor',
  'productClass',
  'secondaryCategory1',
  'secondaryCategory2',
  'quantityPricingSchedule',
  'formulaText',
  'onHand',
  'onOrder',
  'catalogStatus',
  'inactiveForPurchases',
  'showOnPortal',
  'supersededBy',
  'blockPurchaseRequests',
  'directSubstitute',
  'benchmarkS',
  'benchmarkT',
  'benchmarkO',
] as const satisfies readonly ProductMasterField[]

export const ALL_PRODUCT_MASTER_FIELDS = [
  ...REQUIRED_PRODUCT_MASTER_FIELDS,
  ...RECOMMENDED_PRODUCT_MASTER_FIELDS,
  ...OPTIONAL_PRODUCT_MASTER_FIELDS,
] as const satisfies readonly ProductMasterField[]
