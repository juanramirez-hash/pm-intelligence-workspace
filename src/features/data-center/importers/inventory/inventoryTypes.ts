export interface RawInventoryRow {
  [column: string]: unknown
}

export interface NormalizedInventoryRow {
  snapshotDate: string | null
  productName: string
  productCode: string | null
  brand: string | null
  model: string | null
  location: string

  onHand: number
  available: number | null
  committed: number | null
  inTransit: number | null
  onOrder: number | null

  unitCost: number | null
  inventoryValue: number | null
  currency: string | null
}

export interface InventoryDatasetSummary {
  periodStart: string | null
  periodEnd: string | null

  totalPositions: number
  uniqueProducts: number
  uniqueLocations: number

  totalOnHand: number
  totalAvailable: number
  totalCommitted: number
  totalInTransit: number
  totalOnOrder: number
  totalInventoryValue: number

  negativeStockRows: number
  duplicatePositions: number

  processedRows: number
  ignoredRows: number
}
