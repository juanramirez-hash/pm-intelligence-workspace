export interface BusinessPurchaseRequest {
  id: string
  purchaseRequestNumber: string

  sourceRowNumber: number
  duplicateOccurrences: number
  sourceInternalId: string | null

  requestDate: string
  periodId: string

  salesOrderNumber: string | null
  relatedPurchaseOrderNumber: string | null

  requestStatus: string | null
  sourceItemStatus: string | null
  orderStatus: string | null

  itemCode: string | null
  brandId: string | null
  model: string | null
  description: string | null
  quantity: number | null

  cashAuthorizationStatus: string | null
  advancePaymentNote: string | null
  alreadyOrderedStatus: string | null
  executiveName: string | null

  stockQuantity: number | null
  availableForSaleQuantity: number | null

  cashReleaseDate: string | null
  requestExpirationDate: string | null
  expectedPurchaseOrderArrivalDate: string | null

  preferredSupplierName: string | null
  actualSupplierName: string | null

  branch: string | null
  itemBlockedForRequestStatus: string | null
  rmaOrderStatus: string | null
  purchasingTrafficComments: string | null

  projectId: string | null
  projectEstimatedDeliveryDate: string | null
  requestEstimatedDeliveryDate: string | null

  createdBy: string | null
  sourceElapsedDays: number | null
  expressShippingPaidStatus: string | null
  projectWarehouseOrderStatus: string | null
  assignedBuyer: string | null
  processDate: string | null
}