export interface BusinessInventorySnapshot {
  id: string
  snapshotDate: string | null

  positions: number
  products: Set<string>
  unresolvedProducts: Set<string>
  locations: Set<string>

  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inventoryValue: number
}
