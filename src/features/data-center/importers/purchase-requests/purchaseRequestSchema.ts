import type {
  PurchaseRequestField,
} from './purchaseRequestColumnAliases'

export const REQUIRED_PURCHASE_REQUEST_FIELDS:
  PurchaseRequestField[] = [
  'purchaseRequestNumber',
  'requestDate',
  'requestStatus',
  'itemCode',
]

export const RECOMMENDED_PURCHASE_REQUEST_FIELDS:
  PurchaseRequestField[] = [
  'salesOrderNumber',
  'brand',
  'model',
  'description',
  'quantity',
  'relatedPurchaseOrderNumber',
  'cashAuthorizationStatus',
  'orderStatus',
  'alreadyOrderedStatus',
  'preferredSupplierName',
  'actualSupplierName',
  'assignedBuyer',
]

export const OPTIONAL_PURCHASE_REQUEST_FIELDS:
  PurchaseRequestField[] = [
  'sourceItemStatus',
  'advancePaymentNote',
  'executiveName',
  'stockQuantity',
  'availableForSaleQuantity',
  'cashReleaseDate',
  'requestExpirationDate',
  'expectedPurchaseOrderArrivalDate',
  'branch',
  'itemBlockedForRequestStatus',
  'rmaOrderStatus',
  'purchasingTrafficComments',
  'sourceInternalId',
  'projectId',
  'projectEstimatedDeliveryDate',
  'requestEstimatedDeliveryDate',
  'createdBy',
  'sourceElapsedDays',
  'expressShippingPaidStatus',
  'projectWarehouseOrderStatus',
  'processDate',
]

export const ALL_PURCHASE_REQUEST_FIELDS:
  PurchaseRequestField[] = [
  ...REQUIRED_PURCHASE_REQUEST_FIELDS,
  ...RECOMMENDED_PURCHASE_REQUEST_FIELDS,
  ...OPTIONAL_PURCHASE_REQUEST_FIELDS,
]