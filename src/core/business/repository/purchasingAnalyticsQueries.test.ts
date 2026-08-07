import { describe, expect, it } from 'vitest'

import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import type {
  BusinessPurchaseOrder,
  BusinessPurchaseOrderLine,
} from '../entities/purchaseOrder'

import type {
  BusinessPurchaseRequest,
} from '../entities/purchaseRequest'

import {
  PurchasingAnalyticsQueries,
} from './purchasingAnalyticsQueries'

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

function buildModel(): BusinessDataModel {
  return {
    generatedAt: '2026-07-25T00:00:00.000Z',

    periodStart: null,
    periodEnd: null,

    totals: {
      revenue: 0,
      grossProfit: 0,
      quantity: 0,
      documents: 0,
    },

    customers: new Map(),
    customerPeriods: new Map(),
    customerBrandPeriods: new Map(),

    brands: new Map(),
    brandPeriods: new Map(),
    brandTargets: new Map(),

    products: new Map(),
    productPeriods: new Map(),

    salesSegments: new Map(),

    inventorySnapshots: new Map(),
    inventoryPositions: new Map(),

    projects: new Map(),
    projectBillings: new Map(),
    projectBillingLines: new Map(),

    purchaseOrders: new Map([
      ['PO1001', purchaseOrder({})],
    ]),

    purchaseOrderLines: new Map([
      ['PO1001::1', purchaseOrderLine({})],
    ]),

    purchaseRequests: new Map([
      ['SC1001', purchaseRequest({})],
      [
        'SC1002',
        purchaseRequest({
          id: 'SC1002',
          purchaseRequestNumber: 'SC1002',
          relatedPurchaseOrderNumber: null,
          salesOrderNumber: null,
          projectId: null,
          assignedBuyer: 'Buyer Dos',
          quantity: 4,
        }),
      ],
    ]),

    exchangeRates: new Map(),

    prices: new Map(),
    priceScenarios: new Map(),
    pricingQualityIssues: [],

    periods: new Map(),

    documentNumbers: new Set(),
    locations: new Set(),
    salesRepresentatives: new Set(),
    currencies: new Set(),

    processedRows: 0,
    ignoredRows: 0,
  }
}

describe('PVW-002 PurchasingAnalyticsQueries', () => {
  it('expone reporte, totales, linkage y ciclo como copias', () => {
    const queries =
      new PurchasingAnalyticsQueries(
        buildModel(),
        '2026-07-25',
      )

    const report =
      queries.getReport()

    expect(
      report.totals.purchaseOrders,
    ).toBe(1)

    expect(
      report.totals.purchaseRequests,
    ).toBe(2)

    expect(
      queries.getLinkage().withoutPurchaseOrder,
    ).toBe(1)

    expect(
      queries.getCycle().averageDaysRequestToPurchaseOrder,
    ).toBe(3)

    report.totals.purchaseOrders = 999

    expect(
      queries.getTotals().purchaseOrders,
    ).toBe(1)
  })

  it('expone agrupaciones y top-N sin mutar el reporte interno', () => {
    const queries =
      new PurchasingAnalyticsQueries(
        buildModel(),
        '2026-07-25',
      )

    expect(
      queries.getBySupplier()[0]?.key,
    ).toBe('SUP-1')

    expect(
      queries.getByBuyer(),
    ).toHaveLength(2)

    expect(
      queries.getTopBrands(1),
    ).toHaveLength(1)

    expect(
      queries.getTopItems(0),
    ).toHaveLength(0)

    const suppliers =
      queries.getBySupplier()

    suppliers[0]!.purchaseOrders = 999

    expect(
      queries.getBySupplier()[0]?.purchaseOrders,
    ).toBe(1)
  })

  it('expone estados y buckets de aging', () => {
    const queries =
      new PurchasingAnalyticsQueries(
        buildModel(),
        '2026-07-25',
      )

    expect(
      queries.getStatus().some(
        (summary) =>
          summary.status === 'OPEN',
      ),
    ).toBe(true)

    expect(
      queries.findAging(
        '1_7_days',
      )?.purchaseOrders,
    ).toBe(1)

    expect(
      queries.findAging(
        '31_plus_days',
      )?.purchaseOrders,
    ).toBe(0)
  })
})