import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessInventoryPosition,
} from '../../entities/inventoryPosition'

import type {
  BusinessPurchaseOrderLine,
} from '../../entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../entities/purchaseRequest'

import {
  buildPurchasingInventoryAnalytics,
} from './purchasingInventoryAnalytics'

function inventoryPosition(
  overrides:
    Partial<BusinessInventoryPosition>,
): BusinessInventoryPosition {
  return {
    id: '2026-07-30::P-1::CDMX',
    snapshotDate: '2026-07-30',
    productId: 'P-1',
    productName: 'Producto 1',
    productCode: 'SKU-1',
    brandId: 'UNV',
    model: null,
    locationId: 'CDMX',
    identityStatus: 'current_master',
    onHand: 10,
    available: 7,
    committed: 3,
    inTransit: 2,
    onOrder: 4,
    unitCost: 100,
    inventoryValue: 1000,
    currency: 'MXN',
    sourceRows: 1,
    ...overrides,
  }
}

function purchaseOrderLine(
  overrides:
    Partial<BusinessPurchaseOrderLine>,
): BusinessPurchaseOrderLine {
  return {
    id: 'PO-1::1',
    purchaseOrderId: 'PO-1',
    purchaseOrderNumber: 'PO-1',

    sourceRowNumber: 2,
    duplicateOccurrences: 0,

    sourceInternalId: null,
    sourceSecondaryInternalId: null,
    purchaseOrderReference: null,

    purchaseOrderDate: '2026-07-20',
    periodId: '2026-07',
    expectedReceiptDate: '2026-08-05',

    status: 'Open',
    mainMemo: null,

    supplierId: 'SUP-1',
    supplierName: 'Proveedor Uno',
    currency: 'USD',

    lineType: 'product',
    itemCode: 'SKU-1',
    brandId: 'UNV',
    lineMemo: null,
    quantity: 8,
    amountForeignCurrency: 800,
    weight: null,

    supplierLeadTimeDays: null,
    supplierExpressLeadTimeDays: null,
    inventoryDays: null,

    shipmentNumber: null,
    shipmentStatus: null,
    zone: null,
    purchasingExecutive: 'Buyer Uno',

    coffDate: null,
    atdDate: null,
    ataDate: null,
    atwDate: null,

    department: null,
    valueClassification: null,
    valueScore: null,
    amountClassification: null,

    ...overrides,
  }
}

function purchaseRequest(
  overrides:
    Partial<BusinessPurchaseRequest>,
): BusinessPurchaseRequest {
  return {
    id: 'SC-1',
    purchaseRequestNumber: 'SC-1',

    sourceRowNumber: 2,
    duplicateOccurrences: 0,
    sourceInternalId: null,

    requestDate: '2026-07-18',
    periodId: '2026-07',

    salesOrderNumber: null,
    relatedPurchaseOrderNumber: 'PO-1',

    requestStatus: 'Approved',
    sourceItemStatus: null,
    orderStatus: null,

    itemCode: 'SKU-1',
    brandId: 'UNV',
    model: null,
    description: null,
    quantity: 8,

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
    actualSupplierName: 'Proveedor Uno',

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
    assignedBuyer: 'Buyer Uno',
    processDate: null,

    ...overrides,
  }
}

describe(
  'Purchasing + Inventory Analytics',
  () => {
    it(
      'consolida inventario, PO y SC por productCode/itemCode',
      () => {
        const report =
          buildPurchasingInventoryAnalytics({
            inventoryPositions: [
              inventoryPosition({
                productCode: 'sku-1',
              }),
            ],
            purchaseOrderLines: [
              purchaseOrderLine({
                itemCode: 'SKU-1',
              }),
            ],
            purchaseRequests: [
              purchaseRequest({
                itemCode: 'Sku-1',
              }),
            ],
            snapshotDate:
              '2026-07-30',
            referenceDate:
              '2026-07-30',
          })

        expect(
          report.items,
        ).toHaveLength(1)

        const item =
          report.items[0]

        expect(
          item?.itemCode,
        ).toBe('SKU-1')

        expect(
          item?.hasInventory,
        ).toBe(true)

        expect(
          item?.hasPurchasing,
        ).toBe(true)

        expect(
          item?.inventory.available,
        ).toBe(7)

        expect(
          item?.inventory.inboundUnits,
        ).toBe(6)

        expect(
          item?.purchasing.openPurchaseOrders,
        ).toBe(1)

        expect(
          item?.purchasing.openPurchaseOrderQuantity,
        ).toBe(8)

        expect(
          item?.purchasing.purchaseRequestsWithPurchaseOrder,
        ).toBe(1)

        expect(
          item?.purchasing.suppliers,
        ).toEqual([
          'Proveedor Uno',
        ])

        expect(
          item?.purchasing.buyers,
        ).toEqual([
          'Buyer Uno',
        ])
      },
    )

    it(
      'excluye PO terminales y detecta PO abiertas vencidas o próximas',
      () => {
        const report =
          buildPurchasingInventoryAnalytics({
            inventoryPositions: [
              inventoryPosition({
                available: 0,
              }),
            ],
            purchaseOrderLines: [
              purchaseOrderLine({
                id: 'PO-CLOSED::1',
                purchaseOrderId:
                  'PO-CLOSED',
                purchaseOrderNumber:
                  'PO-CLOSED',
                status: 'Closed',
                expectedReceiptDate:
                  '2026-07-20',
                quantity: 10,
              }),
              purchaseOrderLine({
                id: 'PO-OVERDUE::1',
                purchaseOrderId:
                  'PO-OVERDUE',
                purchaseOrderNumber:
                  'PO-OVERDUE',
                status: 'Open',
                expectedReceiptDate:
                  '2026-07-29',
                quantity: 5,
              }),
              purchaseOrderLine({
                id: 'PO-DUE::1',
                purchaseOrderId:
                  'PO-DUE',
                purchaseOrderNumber:
                  'PO-DUE',
                status: 'Open',
                expectedReceiptDate:
                  '2026-08-04',
                quantity: 3,
              }),
            ],
            purchaseRequests: [],
            snapshotDate:
              '2026-07-30',
            referenceDate:
              '2026-07-30',
          })

        const item =
          report.items[0]

        expect(
          item?.purchasing.purchaseOrderLines,
        ).toBe(3)

        expect(
          item?.purchasing.openPurchaseOrderLines,
        ).toBe(2)

        expect(
          item?.purchasing.openPurchaseOrders,
        ).toBe(2)

        expect(
          item?.purchasing.openPurchaseOrderQuantity,
        ).toBe(8)

        expect(
          item?.purchasing.overduePurchaseOrders,
        ).toBe(1)

        expect(
          item?.purchasing.dueNext7DaysPurchaseOrders,
        ).toBe(1)

        expect(
          report.summary
            .itemsWithNoAvailableStockAndOpenPurchaseOrder,
        ).toBe(1)

        expect(
          report.summary
            .itemsWithNoAvailableStockAndOverduePurchaseOrder,
        ).toBe(1)
      },
    )

    it(
      'no hace fallback por nombre cuando falta productCode y reporta calidad',
      () => {
        const report =
          buildPurchasingInventoryAnalytics({
            inventoryPositions: [
              inventoryPosition({
                productId: null,
                productName: 'SKU-1',
                productCode: null,
                identityStatus:
                  'unresolved',
              }),
            ],
            purchaseOrderLines: [
              purchaseOrderLine({
                itemCode: 'SKU-1',
              }),
              purchaseOrderLine({
                id: 'NO-CODE::1',
                purchaseOrderId:
                  'NO-CODE',
                purchaseOrderNumber:
                  'NO-CODE',
                itemCode: null,
              }),
            ],
            purchaseRequests: [
              purchaseRequest({
                id: 'SC-NO-PO',
                relatedPurchaseOrderNumber:
                  null,
                requestStatus:
                  'Cancelled',
                itemCode: 'SKU-1',
                quantity: 4,
              }),
              purchaseRequest({
                id: 'SC-NO-CODE',
                itemCode: null,
              }),
            ],
            snapshotDate:
              '2026-07-30',
            referenceDate:
              '2026-07-30',
          })

        expect(
          report.quality
            .inventoryPositionsWithoutProductCode,
        ).toBe(1)

        expect(
          report.quality
            .purchaseOrderLinesWithoutItemCode,
        ).toBe(1)

        expect(
          report.quality
            .purchaseRequestsWithoutItemCode,
        ).toBe(1)

        const item =
          report.items.find(
            (candidate) =>
              candidate.itemCode ===
              'SKU-1',
          )

        expect(
          item?.hasInventory,
        ).toBe(false)

        expect(
          item?.hasPurchasing,
        ).toBe(true)

        expect(
          item?.purchasing.purchaseRequestsWithoutPurchaseOrder,
        ).toBe(1)

        expect(
          item?.purchasing.requestedQuantityWithoutPurchaseOrder,
        ).toBe(4)
      },
    )
  },
)