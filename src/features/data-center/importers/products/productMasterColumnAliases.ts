export type ProductMasterField =
  | 'erpInternalId'
  | 'brand'
  | 'code'
  | 'model'
  | 'vendorCode'
  | 'vendorName'
  | 'description'
  | 'classification'
  | 'commercialStatus'
  | 'trend'
  | 'category'
  | 'subcategory1'
  | 'subcategory2'
  | 'createdAt'
  | 'updatedAt'
  | 'averageCostUsd'
  | 'totalValue'
  | 'currency'
  | 'inventoryValueMxn'
  | 'inventoryValueUsd'
  | 'lastPurchaseDate'
  | 'lastSaleDate'
  | 'unitsSoldLast90Days'
  | 'preferredVendor'
  | 'productClass'
  | 'secondaryCategory1'
  | 'secondaryCategory2'
  | 'quantityPricingSchedule'
  | 'formulaText'
  | 'onHand'
  | 'onOrder'
  | 'catalogStatus'
  | 'inactiveForPurchases'
  | 'showOnPortal'
  | 'supersededBy'
  | 'blockPurchaseRequests'
  | 'directSubstitute'
  | 'benchmarkS'
  | 'benchmarkT'
  | 'benchmarkO'

export const PRODUCT_MASTER_COLUMN_ALIASES: Record<ProductMasterField, readonly string[]> = {
  erpInternalId: ['Internal ID', 'Internal Id', 'ERP Internal ID'],
  brand: ['Marca', 'Brand'],
  code: ['Name', 'Codigo interno', 'Código interno', 'Item Name', 'SKU interno'],
  model: ['Modelo', 'Model'],
  vendorCode: ['Vendor Name / Code', 'Vendor Code', 'Código de proveedor', 'Codigo de proveedor'],
  vendorName: ['Vendor Name', 'Nombre del proveedor', 'Proveedor', 'Preferred Vendor'],
  description: ['Description', 'Descripcion', 'Descripción'],
  classification: ['Classification', 'Clasificacion', 'Clasificación'],
  commercialStatus: ['CLASIFICACION VALOR', 'CLASIFICACIÓN VALOR', 'Clasificacion Valor', 'Clasificación Valor'],
  trend: ['Tendencia', 'Trend'],
  category: ['Category', 'Categoria', 'Categoría', 'Class', 'Clase'],
  subcategory1: ['Subcategory 1', 'Categoria secundaria 1', 'Categoría secundaria 1'],
  subcategory2: ['Subcategory 2', 'Categoria secundaria 2', 'Categoría secundaria 2'],
  createdAt: ['Date Created', 'Created Date', 'Created At', 'Fecha de creación', 'Fecha de creacion'],
  updatedAt: ['Last Modified', 'Date Last Modified', 'Updated At', 'Fecha de modificación', 'Fecha de modificacion'],
  averageCostUsd: ['costo promedio (USD)', 'Costo promedio USD', 'Average Cost USD'],
  totalValue: ['Total Value'],
  currency: ['Moneda', 'Currency'],
  inventoryValueMxn: ['Valor de inventario MXN'],
  inventoryValueUsd: ['Valor de inventario USD'],
  lastPurchaseDate: ['Fecha de ultima compra', 'Fecha de última compra'],
  lastSaleDate: ['Fecha de ultima venta', 'Fecha de última venta'],
  unitsSoldLast90Days: ['Piezas vendidas en los ultimos 90 dias', 'Piezas vendidas en los últimos 90 días'],
  preferredVendor: ['Preferred Vendor'],
  productClass: ['Class', 'Clase'],
  secondaryCategory1: ['Categoria secundaria 1', 'Categoría secundaria 1'],
  secondaryCategory2: ['Categoria secundaria 2', 'Categoría secundaria 2'],
  quantityPricingSchedule: ['Quantity Pricing Schedule'],
  formulaText: ['Formula (Text)', 'Fórmula (Texto)'],
  onHand: ['On Hand'],
  onOrder: ['On Order'],
  catalogStatus: ['Estatus', 'Status'],
  inactiveForPurchases: ['Inactivo para Compras'],
  showOnPortal: ['Mostrar el Portal'],
  supersededBy: ['NETSTOCK Superseded By'],
  blockPurchaseRequests: ['Bloquear solicitudes de compra'],
  directSubstitute: ['Producto sustituto directo'],
  benchmarkS: ['Benchmark S'],
  benchmarkT: ['Benchmark T'],
  benchmarkO: ['Benchmark O'],
}
