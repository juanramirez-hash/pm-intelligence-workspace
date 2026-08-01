import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessProduct,
} from '../entities/product'

import {
  buildBusinessPrices,
} from './buildBusinessPrices'

const product: BusinessProduct = {
  id: 'P-1',
  model: 'MODEL-1',
  sku: 'P-1',
  brand: 'UNV',
  brandId: 'UNV',
  firstSale: null,
  lastSale: null,
  revenue: 0,
  grossProfit: 0,
  quantity: 0,
  documents: 0,
  activePeriods: new Set(),
  brands: new Set(),
  customers: new Set(),
  locations: new Set(),
}

const products = new Map([
  [product.id, product],
])

describe('PL-001 Business Price Builder', () => {
  it('materializes price facts and scenarios without mutating the base price', () => {
    const result = buildBusinessPrices(
      [{
        productId: 'p-1',
        brandId: 'unv',
        currency: 'mxn',
        cost: 100,
        listPrice: 200,
        sellingPrice: 150,
        effectiveDate: '2026-07-31',
        source: 'erp',
      }],
      [{
        priceId: 'P-1::MXN::2026-07-31',
        name: 'Silver',
        kind: 'pricing_group',
        pricingGroupId: 'silver',
        discountRate: 0.46,
      }],
      products,
    )

    const price = result.prices.get(
      'P-1::MXN::2026-07-31',
    )
    const scenario = result.scenarios.get(
      'P-1::MXN::2026-07-31::PRICING_GROUP::SILVER',
    )

    expect(price).toMatchObject({
      productId: 'P-1',
      brandId: 'UNV',
      currency: 'MXN',
      cost: 100,
      listPrice: 200,
      sellingPrice: 150,
      discountRate: 0.25,
      grossProfit: 50,
      grossMargin: 0.333333,
      pricingFactor: 2,
      marginBand: '30_to_35',
    })
    expect(scenario).toMatchObject({
      productId: 'P-1',
      pricingGroupId: 'SILVER',
      sellingPrice: 108,
      discountRate: 0.46,
      grossProfit: 8,
      grossMargin: 0.074074,
    })
    expect(price?.sellingPrice).toBe(150)
    expect(result.summary.totalPrices).toBe(1)
    expect(result.summary.totalScenarios).toBe(1)
    expect(result.summary.blockingIssues).toBe(0)
  })

  it('rejects invalid monetary inputs and orphan scenarios', () => {
    const result = buildBusinessPrices(
      [{
        productId: 'P-1',
        brandId: 'UNV',
        currency: 'MXN',
        cost: -1,
        listPrice: 0,
        effectiveDate: '2026-07-31',
      }],
      [{
        priceId: 'UNKNOWN',
        name: 'Custom',
        kind: 'custom',
        sellingPrice: 100,
      }],
      products,
    )

    expect(result.prices.size).toBe(0)
    expect(result.scenarios.size).toBe(0)
    expect(result.summary.invalidPriceInputs).toBe(1)
    expect(result.summary.invalidScenarioInputs).toBe(1)
    expect(result.summary.blockingIssues).toBe(2)
  })

  it('uses latest input row for duplicate ids and keeps an audit warning', () => {
    const result = buildBusinessPrices(
      [
        {
          id: 'PRICE-1',
          productId: 'P-1',
          brandId: 'UNV',
          currency: 'MXN',
          cost: 100,
          listPrice: 200,
          sellingPrice: 150,
          effectiveDate: '2026-07-31',
        },
        {
          id: 'PRICE-1',
          productId: 'P-1',
          brandId: 'UNV',
          currency: 'MXN',
          cost: 100,
          listPrice: 200,
          sellingPrice: 140,
          effectiveDate: '2026-07-31',
        },
      ],
      [],
      products,
    )

    expect(result.prices.get('PRICE-1')?.sellingPrice).toBe(140)
    expect(result.summary.duplicatePriceRecords).toBe(1)
    expect(result.qualityIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PRICE_DUPLICATE_ID',
          severity: 'warning',
        }),
      ]),
    )
  })
})
