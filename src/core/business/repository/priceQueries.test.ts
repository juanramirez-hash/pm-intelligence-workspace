import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  BusinessRepository,
} from './businessRepository'

function createRepository(): BusinessRepository {
  return new BusinessRepository(
    buildBusinessDataModel([], {
      prices: [
        {
          id: 'PRICE-OLD',
          productId: 'P-1',
          brandId: 'UNV',
          currency: 'MXN',
          cost: 90,
          listPrice: 200,
          sellingPrice: 150,
          effectiveDate: '2026-06-01',
          source: 'erp',
        },
        {
          id: 'PRICE-CURRENT',
          productId: 'P-1',
          brandId: 'UNV',
          currency: 'MXN',
          cost: 100,
          listPrice: 220,
          sellingPrice: 160,
          effectiveDate: '2026-07-01',
          pricingGroupId: 'current',
          source: 'erp',
        },
        {
          id: 'PRICE-2',
          productId: 'P-2',
          brandId: 'ENSON',
          currency: 'USD',
          cost: 10,
          listPrice: 20,
          sellingPrice: 18,
          effectiveDate: '2026-07-01',
          source: 'erp',
        },
      ],
      priceScenarios: [
        {
          id: 'SCENARIO-SILVER',
          priceId: 'PRICE-CURRENT',
          name: 'Silver',
          kind: 'pricing_group',
          pricingGroupId: 'silver',
          discountRate: 0.46,
        },
      ],
    }),
  )
}

describe('PL-001 Price Repository', () => {
  it('finds current price by product and currency', () => {
    const repository = createRepository()

    expect(
      repository.prices.findCurrentByProduct('p-1', 'mxn'),
    ).toMatchObject({
      id: 'PRICE-CURRENT',
      productId: 'P-1',
      currency: 'MXN',
    })
    expect(
      repository.findCurrentPriceByProduct('P-1'),
    ).toMatchObject({
      id: 'PRICE-CURRENT',
    })
  })

  it('uses prebuilt indexes for brand, currency and margin band queries', () => {
    const repository = createRepository()

    expect(repository.prices.getByBrand('unv')).toHaveLength(2)
    expect(repository.prices.getByCurrency('usd')).toHaveLength(1)
    expect(
      repository.prices.getByMarginBand('35_plus'),
    ).toHaveLength(3)
    expect(
      repository.prices.findByMargin(0.35, 0.5),
    ).toHaveLength(3)
    expect(
      repository.prices.findByGrossProfit(50, 70),
    ).toHaveLength(2)
    expect(
      repository.prices.getByPricingGroup('current'),
    ).toHaveLength(1)
  })

  it('exposes scenarios by price and pricing group', () => {
    const repository = createRepository()

    expect(
      repository.prices.getScenarios('price-current'),
    ).toEqual([
      expect.objectContaining({
        id: 'SCENARIO-SILVER',
        pricingGroupId: 'SILVER',
      }),
    ])
    expect(
      repository.prices.getScenariosByPricingGroup('silver'),
    ).toHaveLength(1)
  })

  it('returns isolated copies and pricing quality metadata', () => {
    const repository = createRepository()
    const price = repository.prices.findById('PRICE-CURRENT')

    if (!price) {
      throw new Error('Expected PRICE-CURRENT')
    }

    price.sellingPrice = 1

    expect(
      repository.prices.findById('PRICE-CURRENT')?.sellingPrice,
    ).toBe(160)
    expect(repository.getPrices()).toHaveLength(3)
    expect(repository.getPricingSummary()).toMatchObject({
      totalPrices: 3,
      totalScenarios: 1,
      uniqueProducts: 2,
      uniqueBrands: 2,
      uniqueCurrencies: 2,
    })
    expect(
      repository.prices.getQualityIssues().filter(
        (issue) => issue.code === 'PRICE_PRODUCT_NOT_FOUND',
      ),
    ).toHaveLength(3)
  })
})
