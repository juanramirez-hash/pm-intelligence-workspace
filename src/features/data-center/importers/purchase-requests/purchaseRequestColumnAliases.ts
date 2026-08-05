export const PURCHASE_REQUEST_COLUMN_ALIASES = {
  purchaseRequestNumber: [
    'ID',
  ],
  requestDate: [
    'Maximum of FECHA DE SOLICITUD',
  ],
  salesOrderNumber: [
    'Document Number',
  ],
  requestStatus: [
    'ESTATUS SC',
  ],
  itemCode: [
    'CODIGO',
  ],
  brand: [
    'MARCA',
  ],
  model: [
    'MODELO',
  ],
  description: [
    'DESCRIPCION',
  ],
  sourceItemStatus: [
    'Estatus',
  ],
  quantity: [
    'QTY',
  ],
  relatedPurchaseOrderNumber: [
    'Document Number_1',
  ],
  cashAuthorizationStatus: [
    'AUTORIZADO POR CAJA',
  ],
  advancePaymentNote: [
    'ANTICIPO?',
  ],
  orderStatus: [
    'ESTATUS PEDIDO',
    'Status',
  ],
  alreadyOrderedStatus: [
    'YA SE PIDIO?',
  ],
  executiveName: [
    'EJECUTIVO',
  ],
  stockQuantity: [
    'Maximum of EN STOCK',
  ],
  availableForSaleQuantity: [
    'Maximum of DISPONIBLE PARA VENTA',
  ],
  cashReleaseDate: [
    'FECHA DE LIBERACION CAJA PEDIDO',
  ],
  requestExpirationDate: [
    'FECHA VENCIMIENTO SC',
  ],
  preferredSupplierName: [
    'PROVEEDOR',
  ],
  expectedPurchaseOrderArrivalDate: [
    'FECHA DE LLEGADA PO',
  ],
  branch: [
    'SUCURSAL',
  ],
  itemBlockedForRequestStatus: [
    'ARTICULO BLOQUEADO PARA SC',
  ],
  rmaOrderStatus: [
    'PEDIDO DE RMA',
  ],
  purchasingTrafficComments: [
    'Comentarios compras/trafico',
  ],
  sourceInternalId: [
    'Internal ID',
  ],
  projectId: [
    'Proyecto',
  ],
  projectEstimatedDeliveryDate: [
    'Fecha estimada de entrega del proyecto ACTUAL',
  ],
  requestEstimatedDeliveryDate: [
    'Fecha estimada de entrega SC',
  ],
  actualSupplierName: [
    'Name',
  ],
  createdBy: [
    'Created By',
  ],
  sourceElapsedDays: [
    'Round to Hundredths of Maximum of Días transcurridos',
  ],
  expressShippingPaidStatus: [
    'Envio express pagado',
  ],
  projectWarehouseOrderStatus: [
    'Pedido en almacen de proyectos',
  ],
  assignedBuyer: [
    'Comprador asignado',
  ],
  processDate: [
    'Fecha procesar',
  ],
} as const

export type PurchaseRequestField =
  keyof typeof PURCHASE_REQUEST_COLUMN_ALIASES