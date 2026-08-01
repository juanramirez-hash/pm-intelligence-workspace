import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceDesign,
} from './priceDesignEngine'

function baseInput() {
  return {
    id: 'DESIGN-001',
    identity: {
      brandName: 'Nueva Marca',
      model: 'MODELO-01',
      sku: null,
    },
    currency: 'MXN',
    cost: 100,
    discountRate: 0.34,
    objective: {
      type: 'target_gross_margin' as const,
      grossMargin: 0.24,
    },
    notes: null,
  }
}

describe('evaluatePriceDesign', () => {
  it('derives list price and factor from cost, target margin and discount', () => {
    const result = evaluatePriceDesign(baseInput())

    expect(result.available).toBe(true)
    expect(result.status).toBe('valid')
    expect(result.metrics?.sellingPrice).toBeCloseTo(131.58, 2)
    expect(result.metrics?.listPrice).toBeCloseTo(199.36, 2)
    expect(result.metrics?.listPriceFactor).toBeCloseTo(1.9936, 4)
    expect(result.metrics?.grossMargin).toBeCloseTo(0.24, 3)
  })

  it('derives list price from target GP and discount', () => {
    const result = evaluatePriceDesign({
      ...baseInput(),
      objective: {
        type: 'target_gross_profit',
        grossProfit: 30,
      },
    })

    expect(result.metrics?.sellingPrice).toBe(130)
    expect(result.metrics?.listPrice).toBeCloseTo(196.97, 2)
    expect(result.metrics?.grossProfit).toBe(30)
  })

  it('derives list price from a requested net selling price', () => {
    const result = evaluatePriceDesign({
      ...baseInput(),
      objective: {
        type: 'target_selling_price',
        sellingPrice: 150,
      },
    })

    expect(result.metrics?.sellingPrice).toBe(150)
    expect(result.metrics?.listPrice).toBeCloseTo(227.27, 2)
    expect(result.metrics?.sellingPriceFactor).toBe(1.5)
  })

  it('evaluates a list factor at the declared discount', () => {
    const result = evaluatePriceDesign({
      ...baseInput(),
      objective: {
        type: 'list_price_factor',
        factor: 2,
      },
    })

    expect(result.metrics?.listPrice).toBe(200)
    expect(result.metrics?.sellingPrice).toBe(132)
    expect(result.metrics?.grossMargin).toBeCloseTo(0.242424, 6)
  })

  it('reconstructs list price from a net selling factor', () => {
    const result = evaluatePriceDesign({
      ...baseInput(),
      objective: {
        type: 'selling_price_factor',
        factor: 1.3,
      },
    })

    expect(result.metrics?.sellingPrice).toBe(130)
    expect(result.metrics?.listPrice).toBeCloseTo(196.97, 2)
    expect(result.metrics?.sellingPriceFactor).toBe(1.3)
  })

  it('evaluates an explicit list price', () => {
    const result = evaluatePriceDesign({
      ...baseInput(),
      objective: {
        type: 'list_price',
        listPrice: 200,
      },
    })

    expect(result.metrics?.sellingPrice).toBe(132)
    expect(result.metrics?.grossProfit).toBe(32)
    expect(result.metrics?.listPriceFactor).toBe(2)
  })

  it('keeps the resulting source transient and isolated', () => {
    const input = baseInput()
    const result = evaluatePriceDesign(input)

    expect(result.transientPrice?.source).toBe('manual')
    expect(result.transientPrice?.effectiveDate).toBeNull()
    expect(result.isolation).toEqual({
      mutatesCatalogPrice: false,
      persistsDesign: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    })
    expect(input.cost).toBe(100)
  })

  it('warns when the declared list price and discount produce negative GP', () => {
    const result = evaluatePriceDesign({
      ...baseInput(),
      objective: {
        type: 'list_price',
        listPrice: 120,
      },
    })

    expect(result.available).toBe(true)
    expect(result.status).toBe('warning')
    expect(result.signals.some(
      (item) => item.code === 'PRICE_DESIGN_NEGATIVE_GROSS_PROFIT',
    )).toBe(true)
  })

  it('rejects missing currency, invalid cost and invalid discount', () => {
    const result = evaluatePriceDesign({
      ...baseInput(),
      currency: '',
      cost: 0,
      discountRate: 1,
    })

    expect(result.available).toBe(false)
    expect(result.status).toBe('invalid')
    expect(result.metrics).toBeNull()
    expect(result.transientPrice).toBeNull()
  })
})
