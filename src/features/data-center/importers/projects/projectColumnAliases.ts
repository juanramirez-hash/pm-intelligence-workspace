export const PROJECT_COLUMN_ALIASES = {
  internalId: [
    'Internal ID',
    'ID interno',
    'InternalID',
  ],
  projectId: [
    'ID',
    'Proyecto',
    'Project ID',
    'Project',
  ],
  name: [
    'Name',
    'Nombre',
    'Nombre del proyecto',
    'Project Name',
  ],
  endUser: [
    'Usuario final',
    'Usuario Final',
    'End User',
  ],
  customer: [
    'Cliente (Proyecto)',
    'Cliente Proyecto',
    'Customer',
    'Cliente',
  ],
  salesExecutive: [
    'Ejecutivo de ventas',
    'Ejecutivo de Venta',
    'Sales Executive',
    'Sales Rep',
  ],
  location: [
    'Location',
    'Ubicacion',
    'Ubicación',
  ],
  assignedBusinessDeveloper: [
    'BD Asignado',
    'Business Developer Asignado',
  ],
  assignedProductManager: [
    'PM Asignado',
    'Product Manager Asignado',
  ],
  group: [
    'Grupo',
    'Group',
  ],
  primaryBrand: [
    'Marca principal',
    'Marca Principal',
    'Primary Brand',
  ],
  createdAt: [
    'Fecha de alta',
    'Fecha Alta',
    'Created Date',
  ],
  elapsedDays: [
    'Días transcurridos',
    'Dias transcurridos',
    'Elapsed Days',
  ],
  currency: [
    'Moneda del proyecto',
    'Moneda',
    'Currency',
  ],
  status: [
    'Status',
    'Estado',
    'Project Status',
  ],
  closingProbability: [
    'Probabilidad de cierre (%)',
    'Probabilidad de cierre',
    'Closing Probability',
  ],
  estimatedCloseDate: [
    'Fecha estimada de cierre',
    'Fecha Estimada de Cierre',
    'Estimated Close Date',
  ],
  estimatedBillingDate: [
    'Fecha estimada de facturacion',
    'Fecha estimada de facturación',
    'Fecha Estimada de Facturacion',
    'Estimated Billing Date',
  ],
  amountToClose: [
    'Monto por cerrar (USD)',
    'Monto por cerrar',
    'Amount to Close',
  ],
  observations: [
    'Observaciones',
    'Comments',
  ],
  assignedEngineer: [
    'Ingeniero asignado',
    'Assigned Engineer',
  ],
  approximateAmount: [
    'Monto aproximado del proyecto',
    'Monto aproximado',
    'Approximate Project Amount',
  ],
  invoicedAmount: [
    'Monto Facturado (USD)',
    'Monto Facturado',
    'Invoiced Amount',
  ],
  reportAmountToInvoice: [
    'Monto por facturar (USD) Reporte',
    'Monto por facturar Reporte',
  ],
  amountToInvoice: [
    'Monto por facturar (USD)',
    'Monto por facturar',
    'Amount to Invoice',
  ],
  isDuplicate: [
    'Proyecto repetido',
    'Proyecto Repetido',
    'Repeated Project',
  ],
} as const

export type ProjectField =
  keyof typeof PROJECT_COLUMN_ALIASES
