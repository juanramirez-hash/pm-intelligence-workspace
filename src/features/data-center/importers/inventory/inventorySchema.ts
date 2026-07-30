import type { InventoryField } from './inventoryColumnAliases'

export const REQUIRED_INVENTORY_FIELDS: InventoryField[] = [
  'productName',
  'location',
  'onHand',
]

export const RECOMMENDED_INVENTORY_FIELDS: InventoryField[] = [
  'snapshotDate',
  'brand',
  'model',
  'available',
  'inventoryValue',
]

export const OPTIONAL_INVENTORY_FIELDS: InventoryField[] = [
  'productCode',
  'committed',
  'inTransit',
  'onOrder',
  'unitCost',
  'currency',
]

export const ALL_INVENTORY_FIELDS: InventoryField[] = [
  ...REQUIRED_INVENTORY_FIELDS,
  ...RECOMMENDED_INVENTORY_FIELDS,
  ...OPTIONAL_INVENTORY_FIELDS,
]
