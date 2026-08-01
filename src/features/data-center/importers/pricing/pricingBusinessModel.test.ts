import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedProductMasterRow,
} from '../products/productMasterTypes'

import {
  buildPricingBusinessModel,
} from './pricingBusinessModel'

import type {
  NormalizedPricingRow,
} from './pricingTypes'

function productMasterRow(
  name: string,
  brand = 'UNV',
): NormalizedProductMasterRow {
  return {
    erpInternalId: name,
    name,
    code: name,
    model: name,
    brand,
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

function pricingRow(
  productId: string,
  brandId = 'UNV',
): NormalizedPricingRow {
  return {
    productId,
    brandId,
    currency: 'MXN',
    cost: 100,
    listPrice: 200,
    sellingPrice: 200,
    pricingGroupId: null,
    effectiveDate: null,
    source: 'imported',
    sourceReference: `${productId}::MXN`,
    sourceRowNumber: 2,
    sourceChannel: 'mxn',
    model: productId,
    purchaseCurrency: 'USD',
    quantityPricingSchedule: null,
    usdChannelSkippedForCurrencyMismatch: false,
  }
}

describe('PL-002 Pricing source integration', () => {
  it('reconcilia precios contra Product Master y conserva diferencias auditables', () => {
    const result = buildPricingBusinessModel(
      [
        pricingRow('P-1'),
        pricingRow('P-2', 'TP-LINK'),
        pricingRow('P-3'),
      ],
      0,
      [
        productMasterRow('P-1'),
        productMasterRow('P-2'),
      ],
    )

    expect(result.summary.productMasterAvailable).toBe(true)
    expect(result.summary.reconciledPriceFacts).toBe(2)
    expect(result.summary.pricesWithoutProduct).toBe(1)
    expect(result.summary.priceBrandMismatches).toBe(1)
    expect(result.summary.productCoverageRate).toBeCloseTo(2 / 3)
    expect(result.qualityIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PRICE_PRODUCT_NOT_FOUND',
          productId: 'P-3',
        }),
        expect.objectContaining({
          code: 'PRICE_BRAND_MISMATCH',
          productId: 'P-2',
        }),
      ]),
    )
  })

  it('deja la conciliación pendiente cuando Product Master no está cargado', () => {
    const result = buildPricingBusinessModel(
      [pricingRow('P-1')],
      0,
    )

    expect(result.summary.productMasterAvailable).toBe(false)
    expect(result.summary.productCoverageRate).toBeNull()
    expect(result.summary.pricesWithoutProduct).toBe(0)
  })
})
