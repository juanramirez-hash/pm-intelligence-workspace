// NetSuite sources for the weekly manual load (DC-001): export from NetSuite
// and drop the file into the Data Center. Importers without a source here
// show "Fuente sin configurar"; do not add links that were not confirmed.

export type DataCenterImporterId =
  | 'sales'
  | 'targets'
  | 'inventory'
  | 'purchase-orders'
  | 'purchase-requests'
  | 'pricing'
  | 'product-master'
  | 'customer-master'
  | 'projects'
  | 'project-billings'
  | 'exchange-rates'

export type NetsuiteSourceKind =
  | 'report'
  | 'saved-search'

export interface NetsuiteSource {
  name: string
  kind: NetsuiteSourceKind
  url: string
  staleAfterDays: number
  // Overrides the help line of its kind.
  help?: string
}

// Same order as importPluginRegistry.
export const DATA_CENTER_IMPORTERS: ReadonlyArray<{
  id: DataCenterImporterId
  label: string
}> = [
  { id: 'sales', label: 'Ventas' },
  { id: 'targets', label: 'Objetivos comerciales' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'purchase-orders', label: 'Órdenes de compra' },
  { id: 'purchase-requests', label: 'Solicitudes de compra' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'product-master', label: 'Product Master' },
  { id: 'customer-master', label: 'Clientes' },
  { id: 'project-billings', label: 'Facturación de proyectos' },
  { id: 'projects', label: 'Proyectos' },
  { id: 'exchange-rates', label: 'Tipos de cambio' },
]

export const NETSUITE_SOURCES: Partial<
  Record<DataCenterImporterId, NetsuiteSource>
> = {
  sales: {
    name: 'TS - Detalle de ventas PM',
    kind: 'report',
    url: 'https://4820964.app.netsuite.com/app/reporting/reportrunner.nl?cr=1108&reload=T',
    staleAfterDays: 7,
  },
  inventory: {
    name: 'TS - Reporte de inventario por sucursal',
    kind: 'report',
    url: 'https://4820964.app.netsuite.com/app/reporting/reportrunner.nl?cr=478&reload=T',
    staleAfterDays: 7,
    // DC-002: the raw NetSuite export imports as is.
    help: 'Ejecutar el reporte, usar Exportar → Excel y arrastrar el archivo tal cual (no hace falta limpiarlo)',
  },
  'purchase-orders': {
    name: 'TS - Lista de PO con Item',
    kind: 'saved-search',
    url: 'https://4820964.app.netsuite.com/app/common/search/searchresults.nl?searchid=3582',
    staleAfterDays: 7,
    // MD-002: the purchase orders are exported to Excel, not CSV.
    help: 'Abrir la búsqueda y usar Exportar → Excel',
  },
  projects: {
    name: 'TS - Mis Proyectos PMs',
    kind: 'saved-search',
    url: 'https://4820964.app.netsuite.com/app/common/search/searchresults.nl?searchid=4355',
    staleAfterDays: 7,
  },
  'project-billings': {
    name: 'TS - Facturas por proyecto por item',
    kind: 'saved-search',
    url: 'https://4820964.app.netsuite.com/app/common/search/searchresults.nl?searchid=4777',
    staleAfterDays: 7,
  },
}

export const NETSUITE_EXPORT_HELP: Record<NetsuiteSourceKind, string> = {
  report: 'Ejecutar el reporte y usar Exportar → Excel',
  'saved-search': 'Abrir la búsqueda y usar Exportar → CSV',
}
