import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildDatasetRegistry,
} from './buildDatasetRegistry'

import type {
  BuildDatasetRegistryInput,
} from './buildDatasetRegistry'

function emptyInput(): BuildDatasetRegistryInput {
  return {
    salesSummary: null,
    salesLastImportedFile: null,
    salesLastImportedAt: null,
    targetSummary: null,
    targetsLastImportedFile: null,
    targetsLastImportedAt: null,
    productMasterSummary: null,
    productMasterLastImportedFile: null,
    productMasterLastImportedAt: null,
    inventorySummary: null,
    inventoryLastImportedFile: null,
    inventoryLastImportedAt: null,
  }
}

describe('PL-002 Dataset Registry integration', () => {
  it('publica Pricing como dataset activo y persistido', () => {
    const registry = buildDatasetRegistry({
      ...emptyInput(),
      pricingSummary: {
        sourceRows: 10,
        generatedPriceFacts: 15,
        uniqueProducts: 10,
        uniqueBrands: 2,
        uniqueCurrencies: 2,
        mxnPrices: 10,
        usdPrices: 5,
        otherCurrencyPrices: 0,
        dualCurrencySourceRows: 5,
        singleCurrencySourceRows: 5,
        skippedUsdCrossCurrencyRows: 0,
        pricesWithNegativeMargin: 0,
        pricesAboveList: 0,
        pricesWithoutEffectiveDate: 15,
        duplicatePriceRecords: 0,
        productMasterAvailable: true,
        reconciledPriceFacts: 15,
        pricesWithoutProduct: 0,
        priceBrandMismatches: 0,
        productCoverageRate: 1,
        blockingIssues: 0,
        warningIssues: 0,
        periodStart: null,
        periodEnd: null,
        processedRows: 15,
        ignoredRows: 0,
      },
      pricingLastImportedFile:
        'pricing.xlsx',
      pricingLastImportedAt:
        '2026-07-31T20:00:00.000Z',
    })

    expect(
      registry.find(
        (dataset) =>
          dataset.type === 'pricing',
      ),
    ).toMatchObject({
      status: 'active',
      storage: 'indexeddb',
      totalRows: 15,
      ignoredRows: 0,
      lastImportedFile:
        'pricing.xlsx',
    })
  })

  it('publica Ordenes de compra como dataset activo y persistido', () => {
    const registry = buildDatasetRegistry({
      ...emptyInput(),
      purchaseOrderSummary: {
        periodStart: '2025-02-13',
        periodEnd: '2026-08-06',
        totalOrders: 1200,
        totalLines: 7064,
        productLines: 6900,
        taxLines: 100,
        discountLines: 40,
        adjustmentLines: 24,
        duplicateSourceLines: 7,
        ordersMissingSupplier: 3,
        ordersMissingCurrency: 2,
        ordersWithHeaderConflicts: 1,
        linesMissingAmount: 5,
        statuses: [],
        amountsByCurrency: [],
        processedRows: 7064,
        ignoredRows: 7,
      },
      purchaseOrderLastImportedFile:
        'purchase-orders.xlsx',
      purchaseOrderLastImportedAt:
        '2026-08-10T15:00:00.000Z',
    })

    expect(
      registry.find(
        (dataset) =>
          dataset.type === 'purchases',
      ),
    ).toMatchObject({
      status: 'active',
      storage: 'indexeddb',
      totalRows: 7064,
      ignoredRows: 7,
      periodStart: '2025-02-13',
      periodEnd: '2026-08-06',
      lastImportedFile:
        'purchase-orders.xlsx',
      lastImportedAt:
        '2026-08-10T15:00:00.000Z',
      version: 1,
    })
  })

  it('publica Solicitudes de compra como dataset activo y persistido', () => {
    const registry = buildDatasetRegistry({
      ...emptyInput(),
      purchaseRequestSummary: {
        periodStart: '2026-01-01',
        periodEnd: '2026-08-06',
        totalRequests: 814,
        requestsWithPurchaseOrder: 500,
        requestsWithoutPurchaseOrder: 314,
        requestsMissingQuantity: 4,
        requestsMissingItemCode: 3,
        requestsWithProject: 200,
        requestsWithAssignedBuyer: 700,
        duplicateSourceRows: 0,
        statuses: [],
        processedRows: 814,
        ignoredRows: 0,
      },
      purchaseRequestLastImportedFile:
        'purchase-requests.xlsx',
      purchaseRequestLastImportedAt:
        '2026-08-10T15:30:00.000Z',
    })

    expect(
      registry.find(
        (dataset) =>
          dataset.type ===
          'purchaseRequests',
      ),
    ).toMatchObject({
      status: 'active',
      storage: 'indexeddb',
      totalRows: 814,
      ignoredRows: 0,
      periodStart: '2026-01-01',
      periodEnd: '2026-08-06',
      lastImportedFile:
        'purchase-requests.xlsx',
      lastImportedAt:
        '2026-08-10T15:30:00.000Z',
      version: 1,
    })
  })
})