export const salesColumnAliases = {
  date: [
    'Date',
    'Fecha',
  ],

  brand: [
    'Marca',
    'Brand',
  ],

  revenue: [
    'Transaction Total (Revenue)',
    'Revenue',
    'Venta',
    'Ventas',
    'Importe',
  ],

  grossProfit: [
    'Est. Gross Profit (Line)',
    'Gross Profit',
    'GP',
  ],

  customerId: [
    '# cliente',
    'Customer ID',
    'Cliente',
  ],

  customerName: [
    'Customer/Project: Name (Grouped)',
    'Customer Name',
    'Nombre cliente',
  ],

  productCode: [
    'Product Code',
    'ERP Product Code',
    'ERP Code',
    'Item Code',
    'Item: Name',
    'Item Name',
    'SKU',
    'Código de producto',
    'Codigo de producto',
    'Código ERP',
    'Codigo ERP',
    'Código artículo',
    'Codigo articulo',
  ],

  model: [
    'Modelo',
    'Model',
    'SKU',
  ],

  productStatus: [
    'Estatus ABCDE',
    'Status ABCDE',
    'Clasificación ABCDE',
    'Clasificacion ABCDE',
    'CLASIFICACION VALOR',
    'CLASIFICACIÓN VALOR',
    'Clasificacion Valor',
    'Clasificación Valor',
    'ABC Status',
    'Estatus',
    'ABC',
  ],

  quantity: [
    'Quantity',
    'Cantidad',
  ],

  documentNumber: [
    'Document Number',
    'Factura',
    'Pedido',
  ],

  location: [
    'Location: Name (Grouped)',
    'Location',
    'Sucursal',
  ],

  salesRep: [
    'Primary Sales Rep: Name (Grouped)',
    'Primary Sales Rep',
    'Sales Rep',
    'Vendedor',
  ],

  currency: [
    'Purchase Currency: Name',
    'Currency',
    'Divisa',
    'Moneda',
  ],
} as const

export type SalesField =
  keyof typeof salesColumnAliases