export type InventoryField =
  | 'snapshotDate'
  | 'productName'
  | 'productCode'
  | 'brand'
  | 'model'
  | 'location'
  | 'onHand'
  | 'available'
  | 'committed'
  | 'inTransit'
  | 'onOrder'
  | 'unitCost'
  | 'inventoryValue'
  | 'currency'

export const INVENTORY_COLUMN_ALIASES: Record<
  InventoryField,
  readonly string[]
> = {
  snapshotDate: [
    'Fecha de corte',
    'Snapshot Date',
    'Inventory Date',
    'Fecha inventario',
    'Date',
  ],
  productName: [
    'Name',
    'Name (Grouped)',
    'Product Name',
    'Item: Name',
    'Item Name',
    'Nombre de producto',
  ],
  productCode: [
    'Product Code',
    'ERP Product Code',
    'ERP Code',
    'Item Code',
    'SKU',
    'Codigo',
    'Código',
  ],
  brand: ['Marca', 'Brand'],
  model: ['Modelo', 'Model'],
  location: [
    'Location',
    'Location: Name',
    'Location: Name (Grouped)',
    'Ubicacion',
    'Ubicación',
    'Almacen',
    'Almacén',
    'Sucursal',
  ],
  onHand: [
    'On Hand',
    'On Hand (Grouped)',
    'Existencia',
    'Existencias',
    'Stock',
    'Cantidad disponible fisica',
    'Cantidad disponible física',
  ],
  available: [
    'Available',
    'Available Quantity',
    'Disponible',
    'Existencia disponible',
    'Stock disponible',
  ],
  committed: [
    'Committed',
    'Committed Quantity',
    'Comprometido',
    'Reservado',
  ],
  inTransit: [
    'In Transit',
    'In-Transit',
    'En transito',
    'En tránsito',
  ],
  onOrder: [
    'On Order',
    'Cantidad en orden',
    'En orden',
    'Ordenado',
  ],
  unitCost: [
    'Unit Cost',
    'Average Cost',
    'Costo unitario',
    'Costo promedio',
    'costo promedio (USD)',
  ],
  inventoryValue: [
    'Inventory Value',
    'Total Value',
    'Valor de inventario',
    'Valor inventario',
  ],
  currency: ['Currency', 'Moneda', 'Divisa'],
}
