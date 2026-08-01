import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchDesign,
} from './priceBatchDesignEngine'

function baseInput() {
  return {
    id: 'BATCH-001',
    brandName: 'Nueva Marca',
    currency: 'MXN',
    products: [
      {
        id: 'PRODUCT-1',
        model: 'MODELO-01',
        sku: 'SKU-01',
        cost: 100,
        notes: null,
      },
      {
        id: 'PRODUCT-2',
        model: 'MODELO-02',
        sku: 'SKU-02',
        cost: 200,
        notes: null,
      },
    ],
    discountRates: [0.32, 0.34],
    objective: {
      type: 'target_gross_profit' as const,
      grossProfit: 50,
    },
    commonFactor: {
      strategy: 'protect_all' as const,
      factor: null,
    },
    notes: null,
  }
}

describe('evaluatePriceBatchDesign', () => {
  it('builds a product by discount matrix with a common protecting factor', () => {
    const result = evaluatePriceBatchDesign(baseInput())

    expect(result.available).toBe(true)
    expect(result.status).toBe('valid')
    expect(result.summary.productCount).toBe(2)
    expect(result.summary.discountCount).toBe(2)
    expect(result.rows).toHaveLength(4)
    expect(result.commonListFactor).toBeCloseTo(2.2727, 4)
    expect(result.summary.belowObjectiveCount).toBe(0)
    expect(result.rows.every(
      (row) => row.compliance === 'meets_objective',
    )).toBe(true)
  })

  it('uses the average required factor and identifies rows below objective', () => {
    const result = evaluatePriceBatchDesign({
      ...baseInput(),
      commonFactor: {
        strategy: 'average_required',
      },
    })

    expect(result.available).toBe(true)
    expect(result.status).toBe('warning')
    expect(result.summary.belowObjectiveCount).toBeGreaterThan(0)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_BATCH_BELOW_OBJECTIVE',
    )).toBe(true)
  })

  it('evaluates an explicit factor without changing it', () => {
    const result = evaluatePriceBatchDesign({
      ...baseInput(),
      commonFactor: {
        strategy: 'explicit',
        factor: 2.5,
      },
    })

    expect(result.commonListFactor).toBe(2.5)
    expect(result.rows.every(
      (row) => row.commonListFactor === 2.5,
    )).toBe(true)
  })

  it('publishes aggregated totals by discount', () => {
    const result = evaluatePriceBatchDesign(baseInput())
    const discount32 = result.discountSummaries.find(
      (item) => item.discountRate === 0.32,
    )

    expect(discount32?.productCount).toBe(2)
    expect(discount32?.totalCost).toBe(300)
    expect(discount32?.totalSellingPrice).toBeGreaterThan(300)
    expect(discount32?.totalGrossProfit).toBeGreaterThan(0)
  })

  it('rejects duplicated discounts and invalid product costs', () => {
    const result = evaluatePriceBatchDesign({
      ...baseInput(),
      products: [
        {
          id: 'INVALID',
          model: 'INVALID',
          sku: null,
          cost: 0,
        },
      ],
      discountRates: [0.34, 0.34],
    })

    expect(result.available).toBe(false)
    expect(result.status).toBe('invalid')
    expect(result.issues.map((item) => item.code)).toContain(
      'PRICE_BATCH_INVALID_PRODUCT',
    )
    expect(result.issues.map((item) => item.code)).toContain(
      'PRICE_BATCH_DUPLICATE_DISCOUNT',
    )
  })

  it('rejects a missing explicit common factor', () => {
    const result = evaluatePriceBatchDesign({
      ...baseInput(),
      commonFactor: {
        strategy: 'explicit',
        factor: null,
      },
    })

    expect(result.available).toBe(false)
    expect(result.issues.map((item) => item.code)).toContain(
      'PRICE_BATCH_INVALID_COMMON_FACTOR',
    )
  })

  it('does not mutate the supplied batch input', () => {
    const input = baseInput()
    const snapshot = structuredClone(input)

    evaluatePriceBatchDesign(input)

    expect(input).toEqual(snapshot)
  })

  it('declares simulation-only isolation', () => {
    const result = evaluatePriceBatchDesign(baseInput())

    expect(result.executionMode).toBe('simulation-only')
    expect(result.isolation).toEqual({
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsBatch: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    })
  })
})
