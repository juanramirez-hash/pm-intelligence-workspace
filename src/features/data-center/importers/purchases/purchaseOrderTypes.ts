export type PurchaseOrderLineType =
  | 'product'
  | 'tax'
  | 'discount'
  | 'adjustment'

export interface PurchaseOrderStatusSummaryItem {
  status: string
  totalOrders: number
}

export interface PurchaseOrderCurrencySummaryItem {
  currency: string
  totalAmount: number
}

export interface NormalizedPurchaseOrderRow {
  lineKey: string
  sourceRowNumber: number
  duplicateOccurrences: number

  purchaseOrderNumber: string
  sourceInternalId: string | null
  sourceSecondaryInternalId: string | null
  purchaseOrderReference: string | null

  purchaseOrderDate: string
  periodId: string
  expectedReceiptDate: string | null

  status: string | null
  mainMemo: string | null

  supplierId: string | null
  supplierName: string | null
  currency: string | null

  lineType: PurchaseOrderLineType
  itemCode: string | null
  brand: string | null
  lineMemo: string | null
  quantity: number | null
  amountForeignCurrency: number | null
  weight: number | null

  supplierLeadTimeDays: number | null
  supplierExpressLeadTimeDays: number | null
  inventoryDays: number | null

  shipmentNumber: string | null
  shipmentStatus: string | null
  zone: string | null
  purchasingExecutive: string | null

  coffDate: string | null
  atdDate: string | null
  ataDate: string | null
  atwDate: string | null

  department: string | null
  valueClassification: string | null
  valueScore: number | null
  amountClassification: string | null
}

export interface PurchaseOrderDatasetSummary {
  periodStart: string | null
  periodEnd: string | null

  totalOrders: number
  totalLines: number

  productLines: number
  taxLines: number
  discountLines: number
  adjustmentLines: number

  duplicateSourceLines: number
  ordersMissingSupplier: number
  ordersMissingCurrency: number
  ordersWithHeaderConflicts: number
  linesMissingAmount: number

  statuses: PurchaseOrderStatusSummaryItem[]
  amountsByCurrency: PurchaseOrderCurrencySummaryItem[]

  processedRows: number
  ignoredRows: number
}