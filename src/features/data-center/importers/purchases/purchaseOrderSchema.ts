import type {
  PurchaseOrderField,
} from './purchaseOrderColumnAliases'

export const REQUIRED_PURCHASE_ORDER_FIELDS:
  PurchaseOrderField[] = [
  'purchaseOrderNumber',
  'purchaseOrderDate',
  'status',
  'amountForeignCurrency',
]

export const RECOMMENDED_PURCHASE_ORDER_FIELDS:
  PurchaseOrderField[] = [
  'purchaseOrderReference',
  'expectedReceiptDate',
  'itemCode',
  'quantity',
  'currency',
  'supplierId',
  'supplierName',
  'lineMemo',
  'purchasingExecutive',
]

export const OPTIONAL_PURCHASE_ORDER_FIELDS:
  PurchaseOrderField[] = [
  'sourceInternalId',
  'sourceSecondaryInternalId',
  'mainMemo',
  'supplierLeadTimeDays',
  'supplierExpressLeadTimeDays',
  'inventoryDays',
  'weight',
  'brand',
  'shipmentNumber',
  'shipmentStatus',
  'zone',
  'coffDate',
  'atdDate',
  'ataDate',
  'atwDate',
  'department',
  'valueClassification',
  'valueScore',
  'amountClassification',
]

export const ALL_PURCHASE_ORDER_FIELDS:
  PurchaseOrderField[] = [
  ...REQUIRED_PURCHASE_ORDER_FIELDS,
  ...RECOMMENDED_PURCHASE_ORDER_FIELDS,
  ...OPTIONAL_PURCHASE_ORDER_FIELDS,
]