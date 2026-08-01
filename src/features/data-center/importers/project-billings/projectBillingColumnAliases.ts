export const PROJECT_BILLING_COLUMN_ALIASES = {
  internalId: [
    'Internal ID',
    'ID interno',
    'InternalID',
  ],
  projectId: [
    'Proyecto',
    'Project',
    'Project ID',
  ],
  projectDescription: [
    'Descripcion',
    'Descripción',
    'Project Description',
  ],
  endUser: [
    'Name',
    'Usuario final',
    'End User',
  ],
  customer: [
    'Name_1',
    'Name 2',
    'Customer',
    'Cliente',
  ],
  primaryBrand: [
    'Marca principal en proyecto',
    'Marca principal del proyecto',
    'Primary Project Brand',
  ],
  itemCode: [
    'Item',
    'SKU',
    'Codigo de articulo',
    'Código de artículo',
  ],
  model: [
    'Modelo',
    'Model',
  ],
  brand: [
    'Marca',
    'Brand',
  ],
  quantity: [
    'Quantity',
    'Cantidad',
  ],
  amount: [
    'Amount',
    'Monto',
    'Importe',
  ],
  date: [
    'Date',
    'Fecha',
    'Fecha de facturacion',
    'Fecha de facturación',
  ],
  documentNumber: [
    'Document Number',
    'Numero de documento',
    'Número de documento',
    'Factura',
  ],
  documentStatus: [
    'Status documento',
    'Document Status',
  ],
  createdFrom: [
    'Created From',
    'Creado desde',
  ],
  relatedDocumentStatus: [
    'Status documento relacionado',
    'Related Document Status',
  ],
  currency: [
    'Currency',
    'Moneda',
  ],
  estimatedCloseDate: [
    'Fecha estimada de cierre',
    'Estimated Close Date',
  ],
  estimatedBillingDate: [
    'Fecha estimada de facturacion',
    'Fecha estimada de facturación',
    'Estimated Billing Date',
  ],
  estimatedDeliveryDate: [
    'Fecha estimada de entrega',
    'Estimated Delivery Date',
  ],
  salesRepresentative: [
    'Sales Rep',
    'Ejecutivo de ventas',
  ],
  salesLocation: [
    'Ubicación del vendedor',
    'Ubicacion del vendedor',
    'Sales Location',
  ],
  assignedBusinessDeveloper: [
    'BD Asignado',
    'Assigned Business Developer',
  ],
  purchaseDescription: [
    'Purchase Description',
    'Descripcion de compra',
    'Descripción de compra',
  ],
} as const

export type ProjectBillingField =
  keyof typeof PROJECT_BILLING_COLUMN_ALIASES
