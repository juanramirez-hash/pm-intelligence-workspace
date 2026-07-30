export type BusinessInventoryIdentityStatus =
  | 'current_master'
  | 'unresolved'

export interface BusinessInventoryPosition {
  id: string

  snapshotDate: string | null
  productId: string | null
  productName: string
  productCode: string | null
  brandId: string | null
  model: string | null
  locationId: string

  identityStatus: BusinessInventoryIdentityStatus

  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number

  unitCost: number | null
  inventoryValue: number
  currency: string | null

  sourceRows: number
}
