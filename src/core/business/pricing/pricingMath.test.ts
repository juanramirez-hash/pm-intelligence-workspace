import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculatePriceAfterAdditionalDiscount,
  calculatePriceDiscountRate,
  calculatePriceFromDiscount,
  calculatePriceFromSellingFactor,
  calculatePriceFromTargetGrossMargin,
  calculatePriceFromTargetGrossProfit,
  calculatePriceGrossMargin,
  calculatePriceGrossProfit,
  calculatePriceFactor,
  calculateSellingPriceFactor,
  classifyPriceMarginBand,
} from './pricingMath'

describe('PL-001 / PL-003 Pricing Math Contracts', () => {
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

  it('returns null factors when cost is zero', () => {
    expect(calculatePriceFactor(200, 100)).toBe(2)
    expect(calculatePriceFactor(200, 0)).toBeNull()
    expect(calculateSellingPriceFactor(150, 100)).toBe(1.5)
    expect(calculateSellingPriceFactor(150, 0)).toBeNull()
  })

  it('solves inverse target calculations', () => {
    expect(
      calculatePriceFromTargetGrossMargin(100, 0.25),
    ).toBeCloseTo(133.333333, 6)
    expect(
      calculatePriceFromTargetGrossProfit(100, 35),
    ).toBe(135)
    expect(
      calculatePriceFromSellingFactor(100, 1.6),
    ).toBe(160)
  })

  it('composes additional discounts instead of adding rates', () => {
    expect(
      calculatePriceAfterAdditionalDiscount(150, 0.05),
    ).toBe(142.5)
    expect(
      calculatePriceDiscountRate(200, 142.5),
    ).toBe(0.2875)
  })

  it('rejects impossible target inputs', () => {
    expect(
      calculatePriceFromTargetGrossMargin(100, 1),
    ).toBeNull()
    expect(
      calculatePriceFromSellingFactor(100, 0),
    ).toBeNull()
    expect(
      calculatePriceFromTargetGrossProfit(100, -101),
    ).toBeNull()
  })

  it('classifies the official margin bands', () => {
    expect(classifyPriceMarginBand(-0.01)).toBe('negative')
    expect(classifyPriceMarginBand(0.22)).toBe('20_to_25')
    expect(classifyPriceMarginBand(0.28)).toBe('25_to_30')
    expect(classifyPriceMarginBand(0.4)).toBe('35_plus')
  })
})
