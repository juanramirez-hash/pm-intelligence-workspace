import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedInventoryRow,
} from '../../../features/data-center/importers/inventory/inventoryTypes'

import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import type {
  BusinessPurchaseOrderLine,
} from '../entities/purchaseOrder'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  ForecastDataQueries,
} from './forecastDataQueries'

import {
  PurchasingInventoryQueries,
} from './purchasingInventoryQueries'

import {
  PurchasingForecastQueries,
} from './purchasingForecastQueries'

function salesRow(
  date: string,
  productName: string,
  revenue: number,
  quantity: number,
): NormalizedSalesRow {
  return {
    date,
    brand: 'UNV',
    revenue,
    grossProfit:
      revenue * 0.25,
    customerId: 'C-1',
    customerName:
      'Cliente Uno',
    productName,
    productCode:
      productName,
    model:
      productName,
    quantity,
    documentNumber:
      `${productName}-${date}`,
    location: 'CDMX',
    salesRep: null,
    currency: 'MXN',
  }
}

function productMasterRow(
  name: string,
): NormalizedProductMasterRow {
  return {
    erpInternalId: name,
    name,
    code: name,
    model: name,
    brand: 'UNV',
    vendorCode: null,
    vendorName: null,
    description: null,
    classification: null,
    commercialStatus: 'A',
    trend: null,
    category: null,
    subcategory1: null,
    subcategory2: null,
    createdAt: null,
    updatedAt: null,
    averageCostUsd: null,
    totalValue: null,
    currency: 'MXN',
    inventoryValueMxn: null,
    inventoryValueUsd: null,
    lastPurchaseDate: null,
    lastSaleDate: null,
    unitsSoldLast90Days: null,
    preferredVendor: null,
    productClass: null,
    secondaryCategory1: null,
    secondaryCategory2: null,
    quantityPricingSchedule: null,
    formulaText: null,
    onHand: null,
    onOrder: null,
    catalogStatus: null,
    inactiveForPurchases: false,
    showOnPortal: true,
    supersededBy: null,
    blockPurchaseRequests: false,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
  }
}

function inventoryRow(
  productName: string,
  available: number,
): NormalizedInventoryRow {
  return {
    snapshotDate:
      '2026-03-13',
    productName,
    productCode:
      productName,
    brand: 'UNV',
    model:
      productName,
    location: 'CDMX',
    onHand:
      available,
    available,
    committed: 0,
    inTransit: 0,
    onOrder: 0,
    unitCost: 100,
    inventoryValue:
      available * 100,
    currency: 'MXN',
  }
}

function purchaseOrderLine():
BusinessPurchaseOrderLine {
  return {
    id: 'PO-1::1',
    purchaseOrderId: 'PO-1',
    purchaseOrderNumber: 'PO-1',

    sourceRowNumber: 2,
    duplicateOccurrences: 0,

    sourceInternalId: null,
    sourceSecondaryInternalId: null,
    purchaseOrderReference: null,

    purchaseOrderDate:
      '2026-03-10',
    periodId: '2026-03',
    expectedReceiptDate:
      '2026-03-18',

    status: 'Open',
    mainMemo: null,

    supplierId: 'SUP-1',
    supplierName:
      'Proveedor Uno',
    currency: 'USD',

    lineType: 'product',
    itemCode: 'P-EXCESS',
    brandId: 'UNV',
    lineMemo: null,
    quantity: 25,
    amountForeignCurrency:
      2500,
    weight: null,

    supplierLeadTimeDays: null,
    supplierExpressLeadTimeDays: null,
    inventoryDays: null,

    shipmentNumber: null,
    shipmentStatus: null,
    zone: null,
    purchasingExecutive:
      'Buyer Uno',

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

function buildModel() {
  const model =
    buildBusinessDataModel(
      [
        salesRow(
          '2026-01-30',
          'P-EXCESS',
          100,
          10,
        ),
        salesRow(
          '2026-02-27',
          'P-EXCESS',
          120,
          12,
        ),
        salesRow(
          '2026-03-13',
          'P-EXCESS',
          100,
          10,
        ),
      ],
      {
        brandTargets: [
          {
            brandId: 'UNV',
            periodId:
              '2026-03',
            targetRevenue: 300,
            workingDays: 22,
          },
        ],

        productMaster: [
          productMasterRow(
            'P-EXCESS',
          ),
        ],

        inventory: [
          inventoryRow(
            'P-EXCESS',
            100,
          ),
        ],
      },
    )

  const line =
    purchaseOrderLine()

  const purchaseOrderLines =
    model.purchaseOrderLines ??
    new Map<
      string,
      BusinessPurchaseOrderLine
    >()

  purchaseOrderLines.set(
    line.id,
    line,
  )

  model.purchaseOrderLines =
    purchaseOrderLines

  return model
}

describe(
  'PurchasingForecastQueries',
  () => {
    it(
      'compone los reportes existentes y expone revisiones de posible sobrecompra',
      () => {
        const model =
          buildModel()

        const forecast =
          new ForecastDataQueries(
            model,
          )

        const purchasingInventory =
          new PurchasingInventoryQueries(
            model,
            '2026-03-13',
          )

        const queries =
          new PurchasingForecastQueries(
            forecast
              .getInventoryIntelligenceReport(),

            purchasingInventory
              .getReport(),
          )

        const report =
          queries.getReport()

        expect(
          report.summary
            .matchedProducts,
        ).toBe(1)

        expect(
          report.summary
            .potentialOverbuyReviews,
        ).toBe(1)

        expect(
          queries
            .getPotentialOverbuyReviews(),
        ).toHaveLength(1)

        expect(
          queries.findByProductId(
            ' p-excess ',
          )?.productId,
        ).toBe('P-EXCESS')
      },
    )

    it(
      'devuelve copias defensivas del reporte compuesto',
      () => {
        const model =
          buildModel()

        const forecast =
          new ForecastDataQueries(
            model,
          )

        const purchasingInventory =
          new PurchasingInventoryQueries(
            model,
            '2026-03-13',
          )

        const queries =
          new PurchasingForecastQueries(
            forecast
              .getInventoryIntelligenceReport(),

            purchasingInventory
              .getReport(),
          )

        const first =
          queries.getReport()

        const firstItem =
          first.items[0]

        if (firstItem) {
          firstItem.purchasing
            .openPurchaseOrders =
            999

          firstItem.signals.splice(
            0,
          )

          firstItem.forecast
            .coverage.availableMonths =
            -999
        }

        const second =
          queries.getReport()

        expect(
          second.items[0]
            ?.purchasing
            .openPurchaseOrders,
        ).toBe(1)

        expect(
          second.items[0]
            ?.signals,
        ).toHaveLength(1)

        expect(
          second.items[0]
            ?.forecast.coverage
            .availableMonths,
        ).toBeGreaterThan(3)

        expect(
          second.items[0]
            ?.purchasing,
        ).not.toBe(
          first.items[0]
            ?.purchasing,
        )

        expect(
          second.items[0]
            ?.signals,
        ).not.toBe(
          first.items[0]
            ?.signals,
        )
      },
    )
  },
)