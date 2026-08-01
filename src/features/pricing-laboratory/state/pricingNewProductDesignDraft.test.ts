import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildPriceDesignInputFromDraft,
  createEmptyPricingNewProductDesignDraft,
} from './pricingNewProductDesignDraft'

describe('buildPriceDesignInputFromDraft', () => {
  it('builds a cost-based target margin design', () => {
    const result = buildPriceDesignInputFromDraft({
      ...createEmptyPricingNewProductDesignDraft(),
      brandName: 'Nueva Marca',
      model: 'MODELO-01',
      currency: 'mxn',
      cost: '100',
      discountRate: '34',
      objectiveType: 'target_gross_margin',
      objectiveValue: '24',
    }, 2)

    expect(result.valid).toBe(true)
    expect(result.input).toEqual({
      id: 'NEW-PRODUCT-2',
      identity: {
        brandName: 'Nueva Marca',
        model: 'MODELO-01',
        sku: null,
      },
      currency: 'MXN',
      cost: 100,
      discountRate: 0.34,
      objective: {
        type: 'target_gross_margin',
        grossMargin: 0.24,
      },
      notes: null,
    })
  })

  it('supports explicit list factor calculations', () => {
    const result = buildPriceDesignInputFromDraft({
      ...createEmptyPricingNewProductDesignDraft(),
      currency: 'USD',
      cost: '6',
      discountRate: '32',
      objectiveType: 'list_price_factor',
      objectiveValue: '2.1',
    }, 1)

    expect(result.input?.objective).toEqual({
      type: 'list_price_factor',
      factor: 2.1,
    })
  })

  it('requires cost, currency, discount and objective value', () => {
    const result = buildPriceDesignInputFromDraft(
      createEmptyPricingNewProductDesignDraft(),
      1,
    )

    expect(result.valid).toBe(false)
    expect(result.input).toBeNull()
    expect(result.errors.length).toBeGreaterThanOrEqual(4)
  })

  it('rejects a 100 percent discount', () => {
    const result = buildPriceDesignInputFromDraft({
      ...createEmptyPricingNewProductDesignDraft(),
      currency: 'MXN',
      cost: '100',
      discountRate: '100',
      objectiveValue: '24',
    }, 1)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'El descuento debe ser mayor o igual a 0% y menor a 100%.',
    )
  })
})
