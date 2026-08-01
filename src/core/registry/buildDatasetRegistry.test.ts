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
      pricingLastImportedFile: 'pricing.xlsx',
      pricingLastImportedAt: '2026-07-31T20:00:00.000Z',
    })

    expect(registry.find((dataset) => dataset.type === 'pricing'))
      .toMatchObject({
        status: 'active',
        storage: 'indexeddb',
        totalRows: 15,
        ignoredRows: 0,
        lastImportedFile: 'pricing.xlsx',
      })
  })
})
