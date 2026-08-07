import { describe, expect, it } from 'vitest'

import {
  buildPurchasingAnalytics,
} from './purchasingAnalytics'

import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../../entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../../entities/purchaseRequest'

function purchaseOrder(
  overrides: Partial<BusinessPurchaseOrder>,
): BusinessPurchaseOrder {
  return {
    id: 'PO1001',
    purchaseOrderNumber: 'PO1001',

    sourceInternalId: 'INT-PO-1',
    sourceSecondaryInternalId: null,
    purchaseOrderReference: null,

    purchaseOrderDate: '2026-07-01',
    periodId: '2026-07',
    expectedReceiptDate: '2026-07-20',

    status: 'Open',
    mainMemo: null,

    supplierId: 'SUP-1',
    supplierName: 'Proveedor Uno',
    currency: 'USD',

    shipmentNumber: null,
    shipmentStatus: null,
    zone: null,
    purchasingExecutive: null,
    department: null,

    amountForeignCurrency: 1000,
    quantity: 10,
    lineCount: 1,
    duplicateSourceLines: 0,

    lineIds: new Set(['PO1001::1']),
    itemCodes: new Set(['SKU-1']),
    brandIds: new Set(['UNV']),
    lineTypes: new Set(['product']),

    headerConflictFields: [],

    ...overrides,
  }
}

function purchaseOrderLine(
  overrides: Partial<BusinessPurchaseOrderLine>,
): BusinessPurchaseOrderLine {
  return {
    id: 'PO1001::1',
    purchaseOrderId: 'PO1001',
    purchaseOrderNumber: 'PO1001',

    sourceRowNumber: 2,
    duplicateOccurrences: 0,

    sourceInternalId: 'INT-PO-1',
    sourceSecondaryInternalId: null,
    purchaseOrderReference: null,

    purchaseOrderDate: '2026-07-01',
    periodId: '2026-07',
    expectedReceiptDate: '2026-07-20',

    status: 'Open',
    mainMemo: null,

    supplierId: 'SUP-1',
    supplierName: 'Proveedor Uno',
    currency: 'USD',

    lineType: 'product',
    itemCode: 'SKU-1',
    brandId: 'UNV',
    lineMemo: null,
    quantity: 10,
    amountForeignCurrency: 1000,
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

    ...overrides,
  }
}

function purchaseRequest(
  overrides: Partial<BusinessPurchaseRequest>,
): BusinessPurchaseRequest {
  return {
    id: 'SC1001',
    purchaseRequestNumber: 'SC1001',

    sourceRowNumber: 2,
    duplicateOccurrences: 0,
    sourceInternalId: 'INT-SC-1',

    requestDate: '2026-06-28',
    periodId: '2026-06',

    salesOrderNumber: 'SO1001',
    relatedPurchaseOrderNumber: 'PO1001',

    requestStatus: 'Approved',
    sourceItemStatus: null,
    orderStatus: null,

    itemCode: 'SKU-1',
    brandId: 'UNV',
    model: null,
    description: null,
    quantity: 10,

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

    projectId: 'PRJ-1',
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

describe('PVW-002 buildPurchasingAnalytics', () => {
  it('calcula totales, linkage y ciclo SC a PO', () => {
    const report =
      buildPurchasingAnalytics({
        referenceDate:
          '2026-07-25',

        orders: [
          purchaseOrder({}),
        ],

        lines: [
          purchaseOrderLine({}),
        ],

        requests: [
          purchaseRequest({}),
          purchaseRequest({
            id: 'SC1002',
            purchaseRequestNumber:
              'SC1002',
            relatedPurchaseOrderNumber:
              null,
            salesOrderNumber:
              null,
            projectId:
              null,
            assignedBuyer:
              'Buyer Dos',
            quantity:
              4,
          }),
        ],
      })

    expect(
      report.totals.purchaseOrders,
    ).toBe(1)

    expect(
      report.totals.purchaseOrderLines,
    ).toBe(1)

    expect(
      report.totals.purchaseRequests,
    ).toBe(2)

    expect(
      report.totals.orderedQuantity,
    ).toBe(10)

    expect(
      report.totals.requestedQuantity,
    ).toBe(14)

    expect(
      report.linkage.linkedToPurchaseOrder,
    ).toBe(1)

    expect(
      report.linkage.withoutPurchaseOrder,
    ).toBe(1)

    expect(
      report.linkage.linkedPurchaseOrderExists,
    ).toBe(1)

    expect(
      report.linkage.orphanPurchaseOrderReferences,
    ).toBe(0)

    expect(
      report.cycle.comparableRequests,
    ).toBe(1)

    expect(
      report.cycle.averageDaysRequestToPurchaseOrder,
    ).toBe(3)

    expect(
      report.cycle.medianDaysRequestToPurchaseOrder,
    ).toBe(3)
  })

  it('clasifica vencimiento y aging de ordenes abiertas', () => {
    const report =
      buildPurchasingAnalytics({
        referenceDate:
          '2026-07-25',

        orders: [
          purchaseOrder({
            id: 'PO-OVERDUE-5',
            purchaseOrderNumber:
              'PO-OVERDUE-5',
            expectedReceiptDate:
              '2026-07-20',
            amountForeignCurrency:
              500,
          }),
          purchaseOrder({
            id: 'PO-OVERDUE-20',
            purchaseOrderNumber:
              'PO-OVERDUE-20',
            expectedReceiptDate:
              '2026-07-05',
            amountForeignCurrency:
              700,
          }),
          purchaseOrder({
            id: 'PO-DUE-SOON',
            purchaseOrderNumber:
              'PO-DUE-SOON',
            expectedReceiptDate:
              '2026-07-30',
            amountForeignCurrency:
              300,
          }),
          purchaseOrder({
            id: 'PO-CLOSED',
            purchaseOrderNumber:
              'PO-CLOSED',
            expectedReceiptDate:
              '2026-07-01',
            status:
              'Closed',
            amountForeignCurrency:
              200,
          }),
        ],

        lines: [],
        requests: [],
      })

    expect(
      report.totals.openPurchaseOrders,
    ).toBe(3)

    expect(
      report.totals.overduePurchaseOrders,
    ).toBe(2)

    expect(
      report.totals.purchaseOrdersDueNext7Days,
    ).toBe(1)

    expect(
      report.aging.find(
        (summary) =>
          summary.bucket ===
          '1_7_days',
      )?.purchaseOrders,
    ).toBe(1)

    expect(
      report.aging.find(
        (summary) =>
          summary.bucket ===
          '16_30_days',
      )?.purchaseOrders,
    ).toBe(1)

    expect(
      report.totals.overdueOrderRate,
    ).toBeCloseTo(
      2 / 3,
    )
  })

  it('agrupa por proveedor, comprador, marca y articulo y detecta PO huerfana', () => {
    const report =
      buildPurchasingAnalytics({
        referenceDate:
          '2026-07-10',

        orders: [
          purchaseOrder({}),
        ],

        lines: [
          purchaseOrderLine({}),
        ],

        requests: [
          purchaseRequest({}),
          purchaseRequest({
            id: 'SC-ORPHAN',
            purchaseRequestNumber:
              'SC-ORPHAN',
            relatedPurchaseOrderNumber:
              'PO-NO-EXISTE',
            itemCode:
              'SKU-2',
            brandId:
              'ZKTECO',
            assignedBuyer:
              'Buyer Dos',
            quantity:
              2,
          }),
        ],
      })

    expect(
      report.bySupplier[0]?.key,
    ).toBe('SUP-1')

    expect(
      report.bySupplier[0]?.purchaseOrders,
    ).toBe(1)

    expect(
      report.bySupplier[0]?.purchaseRequests,
    ).toBe(1)

    expect(
      report.byBrand.some(
        (group) =>
          group.key === 'UNV',
      ),
    ).toBe(true)

    expect(
      report.byBrand.some(
        (group) =>
          group.key === 'ZKTECO',
      ),
    ).toBe(true)

    expect(
      report.byItem.some(
        (group) =>
          group.key === 'SKU-2',
      ),
    ).toBe(true)

    expect(
      report.byBuyer,
    ).toHaveLength(2)

    expect(
      report.linkage.orphanPurchaseOrderReferences,
    ).toBe(1)
  })
})