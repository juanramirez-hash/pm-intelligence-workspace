export type BusinessPurchaseOrderLineType =
  | 'product'
  | 'tax'
  | 'discount'
  | 'adjustment'

export interface BusinessPurchaseOrderLine {
  id: string
  purchaseOrderId: string
  purchaseOrderNumber: string

  sourceRowNumber: number
  duplicateOccurrences: number

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

  lineType: BusinessPurchaseOrderLineType
  itemCode: string | null
  brandId: string | null
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

export interface BusinessPurchaseOrder {
  id: string
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

  shipmentNumber: string | null
  shipmentStatus: string | null
  zone: string | null
  purchasingExecutive: string | null
  department: string | null

  amountForeignCurrency: number
  quantity: number
  lineCount: number
  duplicateSourceLines: number

  lineIds: Set<string>
  itemCodes: Set<string>
  brandIds: Set<string>
  lineTypes: Set<BusinessPurchaseOrderLineType>

  headerConflictFields: string[]
}