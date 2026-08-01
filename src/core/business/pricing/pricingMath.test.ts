import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculatePriceDiscountRate,
  calculatePriceGrossMargin,
  calculatePriceGrossProfit,
  calculatePriceFactor,
  calculatePriceFromDiscount,
  classifyPriceMarginBand,
} from './pricingMath'

describe('PL-001 Pricing Math Contracts', () => {
  it('uses gross margin over selling price', () => {
    expect(calculatePriceGrossProfit(150, 100)).toBe(50)
    expect(calculatePriceGrossMargin(150, 100)).toBeCloseTo(
      1 / 3,
      8,
    )
  })

  it('derives discount from list price', () => {
    expect(calculatePriceDiscountRate(200, 150)).toBe(0.25)
    expect(
      calculatePriceFromDiscount(200, 0.25),
    ).toBe(150)
  })

  it('returns a null pricing factor when cost is zero', () => {
    expect(calculatePriceFactor(200, 100)).toBe(2)
    expect(calculatePriceFactor(200, 0)).toBeNull()
  })

  it('classifies the official margin bands', () => {
    expect(classifyPriceMarginBand(-0.01)).toBe('negative')
    expect(classifyPriceMarginBand(0.22)).toBe('20_to_25')
    expect(classifyPriceMarginBand(0.28)).toBe('25_to_30')
    expect(classifyPriceMarginBand(0.4)).toBe('35_plus')
  })
})
