export const PURCHASE_ORDER_COLUMN_ALIASES = {
  sourceInternalId: [
    'Internal ID',
  ],
  purchaseOrderNumber: [
    'Document Number',
  ],
  purchaseOrderReference: [
    'PO/Check Number',
  ],
  purchaseOrderDate: [
    'Date',
  ],
  expectedReceiptDate: [
    'Due Date/Receive By',
  ],
  mainMemo: [
    'Memo (Main)',
  ],
  supplierLeadTimeDays: [
    'Lead time (dias) (heredado de proveedor)',
  ],
  supplierExpressLeadTimeDays: [
    'Lead time express (dias) (heredado de proveedor)',
  ],
  inventoryDays: [
    'Dias de inventario',
  ],
  weight: [
    'Weight',
  ],
  status: [
    'Status',
  ],
  brand: [
    'Marca',
  ],
  itemCode: [
    'ITEM',
  ],
  lineMemo: [
    'Memo',
  ],
  quantity: [
    'Quantity',
  ],
  amountForeignCurrency: [
    'Amount (Foreign Currency)',
  ],
  currency: [
    'Currency',
  ],
  supplierId: [
    'ID',
  ],
  supplierName: [
    'Name',
  ],
  shipmentNumber: [
    'Embarque',
  ],
  shipmentStatus: [
    'Status Embarque',
  ],
  zone: [
    'Zona',
  ],
  purchasingExecutive: [
    'Ejecutivo de Compras',
  ],
  coffDate: [
    'COFF',
  ],
  atdDate: [
    'ATD',
  ],
  ataDate: [
    'ATA',
  ],
  atwDate: [
    'ATW',
  ],
  sourceSecondaryInternalId: [
    'Internal ID_1',
  ],
  department: [
    'Department',
  ],
  valueClassification: [
    'CLASIFICACION VALOR',
  ],
  valueScore: [
    'CLASIFICACION VALOR: SCORE',
  ],
  amountClassification: [
    'Clasificacion Monto (HML)',
  ],
} as const

export type PurchaseOrderField =
  keyof typeof PURCHASE_ORDER_COLUMN_ALIASES