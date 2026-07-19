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

  model: [
    'Modelo',
    'Model',
    'SKU',
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