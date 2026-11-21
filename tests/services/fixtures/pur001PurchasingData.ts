// PUR-001: synthetic purchase orders for the per-currency tests. Orders are
// derived from their lines, as buildBusinessPurchaseOrders does.

import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../../../src/core/business/entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../../src/core/business/entities/purchaseRequest'

export const PUR001_REFERENCE_DATE = '2026-08-01'

export interface LineSpec {
  po: string
  supplier: string | null
  currency: string | null
  status: string
  expected: string | null
  brand: string
  item: string
  quantity: number
  amount: number | null
}

export function purchaseOrderLine(
  spec: LineSpec,
  index: number,
): BusinessPurchaseOrderLine {
  return {
    id: `${spec.po}::${index}`,
    purchaseOrderId: spec.po,
    purchaseOrderNumber: spec.po,

    sourceRowNumber: index + 2,
    duplicateOccurrences: 0,

    sourceInternalId: `INT-${spec.po}`,
    sourceSecondaryInternalId: null,
    purchaseOrderReference: null,

    purchaseOrderDate: '2026-07-01',
    periodId: '2026-07',
    expectedReceiptDate: spec.expected,

    status: spec.status,
    mainMemo: null,

    supplierId: spec.supplier,
    supplierName: spec.supplier ? `Proveedor ${spec.supplier}` : null,
    currency: spec.currency,

    lineType: 'product',
    itemCode: spec.item,
    brandId: spec.brand,
    lineMemo: null,
    quantity: spec.quantity,
    amountForeignCurrency: spec.amount,
    weight: null,

    supplierLeadTimeDays: null,
    supplierExpressLeadTimeDays: null,
    inventoryDays: null,

    shipmentNumber: null,
    shipmentStatus: null,
    zone: null,
    purchasingExecutive: null,

    coffDate: null,
    atdDate: null,
    ataDate: null,
    atwDate: null,

    department: null,
    valueClassification: null,
    valueScore: null,
    amountClassification: null,
  }
}

export function purchaseOrdersFromLines(
  lines: readonly BusinessPurchaseOrderLine[],
): BusinessPurchaseOrder[] {
  const orders = new Map<string, BusinessPurchaseOrder>()

  for (const line of lines) {
    const order = orders.get(line.purchaseOrderNumber) ?? {
      id: line.purchaseOrderId,
      purchaseOrderNumber: line.purchaseOrderNumber,

      sourceInternalId: line.sourceInternalId,
      sourceSecondaryInternalId: null,
      purchaseOrderReference: null,

      purchaseOrderDate: line.purchaseOrderDate,
      periodId: line.periodId,
      expectedReceiptDate: line.expectedReceiptDate,

      status: line.status,
      mainMemo: null,

      supplierId: line.supplierId,
      supplierName: line.supplierName,
      currency: line.currency,

      shipmentNumber: null,
      shipmentStatus: null,
      zone: null,
      purchasingExecutive: null,
      department: null,

      amountForeignCurrency: null,
      linesWithoutAmount: 0,
      quantity: 0,
      lineCount: 0,
      duplicateSourceLines: 0,

      lineIds: new Set<string>(),
      itemCodes: new Set<string>(),
      brandIds: new Set<string>(),
      lineTypes: new Set<BusinessPurchaseOrderLine['lineType']>(),

      headerConflictFields: [],
    }

    order.amountForeignCurrency =
      line.amountForeignCurrency === null
        ? order.amountForeignCurrency
        : (order.amountForeignCurrency ?? 0) + line.amountForeignCurrency
    order.linesWithoutAmount +=
      line.amountForeignCurrency === null ? 1 : 0
    order.quantity += line.quantity ?? 0
    order.lineCount += 1
    order.lineIds.add(line.id)
    if (line.itemCode) order.itemCodes.add(line.itemCode)
    if (line.brandId) order.brandIds.add(line.brandId)
    order.lineTypes.add(line.lineType)

    orders.set(line.purchaseOrderNumber, order)
  }

  return [...orders.values()]
}

export function purchaseRequest(
  id: string,
  relatedPurchaseOrderNumber: string | null,
  brandId: string,
  itemCode: string,
  requestStatus: string,
): BusinessPurchaseRequest {
  return {
    id,
    purchaseRequestNumber: id,

    sourceRowNumber: 2,
    duplicateOccurrences: 0,
    sourceInternalId: `INT-${id}`,

    requestDate: '2026-06-25',
    periodId: '2026-06',

    salesOrderNumber: null,
    relatedPurchaseOrderNumber,

    requestStatus,
    sourceItemStatus: null,
    orderStatus: null,

    itemCode,
    brandId,
    model: null,
    description: null,
    quantity: 4,

    cashAuthorizationStatus: null,
    advancePaymentNote: null,
    alreadyOrderedStatus: null,
    executiveName: null,

    stockQuantity: null,
    availableForSaleQuantity: null,

    cashReleaseDate: null,
    requestExpirationDate: null,
    expectedPurchaseOrderArrivalDate: null,

    preferredSupplierName: null,
    actualSupplierName: null,

    branch: null,
    itemBlockedForRequestStatus: null,
    rmaOrderStatus: null,
    purchasingTrafficComments: null,

    projectId: null,
    projectEstimatedDeliveryDate: null,
    requestEstimatedDeliveryDate: null,

    createdBy: null,
    sourceElapsedDays: null,
    expressShippingPaidStatus: null,
    projectWarehouseOrderStatus: null,
    assignedBuyer: 'Comprador Uno',
    processDate: null,
  }
}

export function buildDataset(specs: readonly LineSpec[]) {
  const lines = specs.map((spec, index) => purchaseOrderLine(spec, index))

  return {
    lines,
    orders: purchaseOrdersFromLines(lines),
  }
}

// Only USD: the per-currency results must equal the previous totals.
export const USD_ONLY_LINES: LineSpec[] = [
  { po: 'PO-1', supplier: 'S1', currency: 'USD', status: 'Pending Receipt', expected: '2026-08-10', brand: 'UNV', item: 'U-1', quantity: 10, amount: 1000 },
  { po: 'PO-1', supplier: 'S1', currency: 'USD', status: 'Pending Receipt', expected: '2026-08-10', brand: 'HIKVISION', item: 'H-1', quantity: 5, amount: 250.5 },
  { po: 'PO-2', supplier: 'S2', currency: 'USD', status: 'Pending Receipt', expected: '2026-07-28', brand: 'UNV', item: 'U-2', quantity: 3, amount: 330 },
  { po: 'PO-3', supplier: 'S2', currency: 'USD', status: 'Partially Received', expected: '2026-07-20', brand: 'HIKVISION', item: 'H-1', quantity: 8, amount: null },
  { po: 'PO-4', supplier: 'S3', currency: 'USD', status: 'Pending Receipt', expected: '2026-07-10', brand: 'STREAMAX', item: 'S-1', quantity: 2, amount: 4100 },
  { po: 'PO-5', supplier: 'S3', currency: 'USD', status: 'Pending Receipt', expected: '2026-06-01', brand: 'UNV', item: 'U-1', quantity: 1, amount: 75 },
  { po: 'PO-6', supplier: 'S1', currency: 'USD', status: 'Pending Receipt', expected: null, brand: 'STREAMAX', item: 'S-2', quantity: 6, amount: 600 },
  { po: 'PO-7', supplier: null, currency: 'USD', status: 'Fully Billed', expected: '2026-05-01', brand: 'UNV', item: 'U-3', quantity: 4, amount: 444 },
]

export const USD_ONLY_REQUESTS: BusinessPurchaseRequest[] = [
  purchaseRequest('SC-1', 'PO-1', 'UNV', 'U-1', 'Approved'),
  purchaseRequest('SC-2', null, 'HIKVISION', 'H-1', 'Pending'),
  purchaseRequest('SC-3', 'PO-4', 'STREAMAX', 'S-1', 'Approved'),
]
