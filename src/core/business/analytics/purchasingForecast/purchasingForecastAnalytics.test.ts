import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ForecastInventoryIntelligenceReport,
  ForecastProductInventoryInsight,
} from '../../forecast'

import type {
  PurchasingInventoryAnalyticsReport,
  PurchasingInventoryItem,
} from '../purchasingInventory'

import {
  buildPurchasingForecastAnalytics,
} from './purchasingForecastAnalytics'

function forecastInsight(
  overrides:
    Partial<ForecastProductInventoryInsight> = {},
): ForecastProductInventoryInsight {
  return {
    id: 'forecast-inventory::P-1',
    methodologyVersion:
      'forecast-inventory-v1',
    status: 'ready',
    currentPeriodId: '2026-08',
    dataCutoff: '2026-08-13',
    snapshotDate: '2026-08-13',

    productId: 'P-1',
    productName: 'Producto 1',
    model: null,
    brandId: 'UNV',

    baselineConfidence: null,

    demand: {
      actualQuantity: 10,
      conservativeQuantity: 8,
      expectedQuantity: 20,
      acceleratedQuantity: 24,
      remainingExpectedQuantity: 10,
      expectedDailyQuantity: 1,
    },

    inventory: {
      sourceAvailable: true,
      linked: true,
      positions: 1,
      locations: 1,
      onHand: 100,
      available: 84,
      committed: 16,
      inTransit: 0,
      onOrder: 0,
      inbound: 0,
      inventoryValue: 8400,
      availableAfterRemainingDemand: 74,
      supplyAfterRemainingDemand: 74,
    },

    coverage: {
      availableStatus: 'excess',
      supplyStatus: 'excess',
      availableMonths: 4.2,
      availableWorkingDays: 84,
      supplyMonths: 4.2,
      supplyWorkingDays: 84,
    },

    catalog: {
      commercialStatus: null,
      supersededBy: null,
      directSubstitute: null,
      isSuperseded: false,
    },

    replacement: null,

    priority: 'medium',
    score: 60,

    recommendedAction:
      'Diseñar una acción comercial o ajuste de demanda para reducir cobertura excedente.',

    signals: [
      {
        id: 'excess-stock::P-1',
        type: 'excess-stock',
        category: 'risk',
        priority: 'medium',
        score: 60,
        title:
          'Inventario excedente frente al forecast',
        rationale:
          'La disponibilidad supera el umbral de cobertura.',
        evidence: {
          availableMonths: 4.2,
          thresholdMonths: 3,
        },
      },
    ],

    explainability: [],
    limitations: [],

    ...overrides,
  }
}

function forecastReport(
  items:
    ForecastProductInventoryInsight[],
): ForecastInventoryIntelligenceReport {
  return {
    generatedAt:
      '2026-08-13T12:00:00.000Z',
    methodologyVersion:
      'forecast-inventory-v1',
    status: 'ready',
    currentPeriodId: '2026-08',
    dataCutoff: '2026-08-13',
    snapshotDate: '2026-08-13',

    thresholds: {
      lowCoverageMonths: 1,
      excessCoverageMonths: 3,
    },

    summary: {
      productsAnalyzed: items.length,
      productsWithProjectedDemand:
        items.length,
      productsWithoutProjectedDemand: 0,
      criticalItems: 0,
      highPriorityItems: 0,
      stockoutRisks: 0,
      currentPeriodShortages: 0,
      lowCoverageProducts: 0,
      excessStockProducts:
        items.filter(
          (item) =>
            item.coverage
              .availableStatus ===
            'excess',
        ).length,
      noProjectedDemandProducts: 0,
      supersededInventoryProducts: 0,
      inboundRecoveries: 0,
      replacementRecoveries: 0,
      affectedInventoryValue: 8400,
    },

    quality: {
      productProjections: items.length,
      inventoryProducts: items.length,
      projectedProductsWithoutInventory: 0,
      inventoryProductsWithoutProjection: 0,
      unresolvedInventoryPositions: 0,
      notes: [],
    },

    items,
  }
}

function purchasingItem(
  overrides:
    Partial<PurchasingInventoryItem> = {},
): PurchasingInventoryItem {
  return {
    itemCode: 'SKU-1',
    productId: 'P-1',
    productName: 'Producto 1',
    brandId: 'UNV',
    snapshotDate: '2026-08-13',

    hasInventory: true,
    hasPurchasing: true,

    inventory: {
      positions: 1,
      locations: 1,
      onHand: 100,
      available: 84,
      committed: 16,
      inTransit: 0,
      onOrder: 0,
      inboundUnits: 0,
      inventoryValue: 8400,
    },

    purchasing: {
      purchaseOrderLines: 1,
      openPurchaseOrderLines: 1,
      openPurchaseOrders: 1,
      openPurchaseOrderQuantity: 25,
      overduePurchaseOrders: 0,
      dueNext7DaysPurchaseOrders: 1,

      purchaseRequests: 1,
      purchaseRequestsWithPurchaseOrder: 1,
      purchaseRequestsWithoutPurchaseOrder: 0,
      requestedQuantity: 25,
      requestedQuantityWithoutPurchaseOrder: 0,

      suppliers: [
        'Proveedor Uno',
      ],

      buyers: [
        'Buyer Uno',
      ],
    },

    ...overrides,
  }
}

function purchasingReport(
  items:
    PurchasingInventoryItem[],
): PurchasingInventoryAnalyticsReport {
  return {
    generatedAt:
      '2026-08-13T12:00:00.000Z',
    snapshotDate: '2026-08-13',
    referenceDate: '2026-08-13',

    summary: {
      items: items.length,
      itemsWithInventory:
        items.filter(
          (item) =>
            item.hasInventory,
        ).length,
      itemsWithPurchasing:
        items.filter(
          (item) =>
            item.hasPurchasing,
        ).length,

      itemsWithNoAvailableStock: 0,
      itemsWithOpenPurchaseOrders:
        items.filter(
          (item) =>
            item.purchasing
              .openPurchaseOrders > 0,
        ).length,
      itemsWithOverduePurchaseOrders: 0,

      itemsWithNoAvailableStockAndNoOpenPurchaseOrder:
        0,
      itemsWithNoAvailableStockAndOpenPurchaseOrder:
        0,
      itemsWithNoAvailableStockAndOverduePurchaseOrder:
        0,
    },

    quality: {
      inventoryPositionsWithoutProductCode: 0,
      purchaseOrderLinesWithoutItemCode: 0,
      purchaseRequestsWithoutItemCode: 0,
    },

    items,
  }
}

describe(
  'Purchasing + Forecast Analytics',
  () => {
    it(
      'marca revisión de posible sobrecompra cuando la cobertura disponible ya es excedente y existe PO abierta',
      () => {
        const report =
          buildPurchasingForecastAnalytics({
            forecastInventory:
              forecastReport([
                forecastInsight(),
              ]),

            purchasingInventory:
              purchasingReport([
                purchasingItem({
                  itemCode: 'SKU-1',
                  productId: 'P-1',
                }),
              ]),
          })

        expect(
          report.summary
            .matchedProducts,
        ).toBe(1)

        expect(
          report.summary
            .potentialOverbuyReviews,
        ).toBe(1)

        const item =
          report.items[0]

        expect(
          item?.productId,
        ).toBe('P-1')

        expect(
          item?.itemCode,
        ).toBe('SKU-1')

        const signal =
          item?.signals.find(
            (candidate) =>
              candidate.type ===
              'potential-overbuy-review',
          )

        expect(
          signal,
        ).toBeDefined()

        expect(
          signal?.evidence,
        ).toMatchObject({
          availableCoverageMonths:
            4.2,
          openPurchaseOrders: 1,
          openPurchaseOrderQuantity:
            25,
          openPurchaseOrderQuantitySemantics:
            'nominal-open-line-quantity',
        })
      },
    )

    it(
      'no hace fallback por itemCode cuando Purchasing no tiene productId canónico',
      () => {
        const report =
          buildPurchasingForecastAnalytics({
            forecastInventory:
              forecastReport([
                forecastInsight({
                  productId: 'P-1',
                }),
              ]),

            purchasingInventory:
              purchasingReport([
                purchasingItem({
                  itemCode: 'P-1',
                  productId: null,
                }),
              ]),
          })

        expect(
          report.summary
            .matchedProducts,
        ).toBe(0)

        expect(
          report.summary
            .potentialOverbuyReviews,
        ).toBe(0)

        expect(
          report.quality
            .purchasingItemsWithoutProductId,
        ).toBe(1)

        expect(
          report.items,
        ).toHaveLength(0)
      },
    )
  },
)