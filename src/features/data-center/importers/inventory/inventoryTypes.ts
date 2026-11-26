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

  // MD-002: "Estatus" and "Fecha de ultima venta" of the NetSuite export.
  // Optional: rows read back from the API do not carry them.
  catalogStatus?: string | null
  lastSaleDate?: string | null
}

/**
 * MD-002-HOTFIX1: one record per article of the file, including the
 * articles without any quantity (NetSuite leaves those cells empty, so they
 * produce no position). Totals of every branch, empty cells as 0. No costs.
 */
export interface InventoryItemRecord {
  itemCode: string
  brand: string | null
  catalogStatus: string | null
  lastSaleDate: string | null
  onHand: number
  committed: number
  available: number
  inTransit: number
  onOrder: number
  // Positions this article produced in the normalized rows (0 = none).
  positions: number
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
  // NULL when no row has value (no cost access, SEC-003C).
  totalInventoryValue: number | null
  rowsWithoutValue: number

  negativeStockRows: number
  duplicatePositions: number

  processedRows: number
  ignoredRows: number
}
