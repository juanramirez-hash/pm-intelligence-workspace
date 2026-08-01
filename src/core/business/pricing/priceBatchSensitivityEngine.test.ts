import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchSensitivity,
} from './priceBatchSensitivityEngine'

import type {
  PriceBatchSensitivityInput,
} from './priceBatchSensitivityContracts'

function buildInput(): PriceBatchSensitivityInput {
  return {
    id: 'Sensitivity 1',
    sourceBatchId: 'Batch 1',
    brandName: 'Nueva Marca',
    currency: 'MXN',
    products: [
      {
        id: 'P-1',
        model: 'Modelo 1',
        sku: 'SKU-1',
        cost: 100,
      },
      {
        id: 'P-2',
        model: 'Modelo 2',
        sku: 'SKU-2',
        cost: 200,
      },
    ],
    discountRates: [0.32, 0.34],
    objective: {
      type: 'target_gross_profit',
      grossProfit: 50,
    },
    commonListFactors: [1.8, 2, 2.3],
  }
}

describe('evaluatePriceBatchSensitivity', () => {
  it('builds a Factor by Discount sensitivity matrix', () => {
    const result = evaluatePriceBatchSensitivity(buildInput())

    expect(result.available).toBe(true)
    expect(result.methodology).toBe('price-batch-sensitivity-v1')
    expect(result.cells).toHaveLength(6)
    expect(result.summary.productCount).toBe(2)
    expect(result.summary.discountCount).toBe(2)
    expect(result.summary.factorCount).toBe(3)
    expect(result.globalMinimumFactor).toBeCloseTo(2.2727, 4)
  })

  it('publishes the mathematical minimum factor per discount', () => {
    const result = evaluatePriceBatchSensitivity(buildInput())

    expect(result.discountMinimums[0]?.minimumRequiredFactor).toBeCloseTo(2.2059, 4)
    expect(result.discountMinimums[0]?.limitingProductId).toBe('P-1')
    expect(result.discountMinimums[1]?.minimumRequiredFactor).toBeCloseTo(2.2727, 4)
    expect(result.discountMinimums[1]?.limitingProductLabel).toBe('Modelo 1')
  })

  it('classifies not feasible, partial and fully feasible cells', () => {
    const result = evaluatePriceBatchSensitivity(buildInput())
    const low = result.cells.find(
      (cell) => cell.commonListFactor === 1.8 && cell.discountRate === 0.32,
    )
    const middle = result.cells.find(
      (cell) => cell.commonListFactor === 2 && cell.discountRate === 0.32,
    )
    const high = result.cells.find(
      (cell) => cell.commonListFactor === 2.3 && cell.discountRate === 0.34,
    )

    expect(low?.feasibility).toBe('not_feasible')
    expect(low?.coverageRate).toBe(0)
    expect(middle?.feasibility).toBe('partially_feasible')
    expect(middle?.coverageRate).toBe(0.5)
    expect(high?.feasibility).toBe('fully_feasible')
    expect(high?.coverageRate).toBe(1)
    expect(high?.band).toBe('above_minimum')
  })

  it('summarizes feasibility by factor without selecting a winner', () => {
    const result = evaluatePriceBatchSensitivity(buildInput())
    const high = result.factorSummaries.find(
      (summary) => summary.commonListFactor === 2.3,
    )

    expect(high?.fullyFeasibleAcrossAllDiscounts).toBe(true)
    expect(high?.fullyFeasibleDiscountCount).toBe(2)
    expect(result.summary.fullyFeasibleFactorCount).toBe(1)
    expect(result.explainability.join(' ')).toContain('no una recomendación comercial')
  })

  it('warns when no captured factor protects all combinations', () => {
    const input = buildInput()
    input.commonListFactors = [1.8, 2]

    const result = evaluatePriceBatchSensitivity(input)

    expect(result.available).toBe(true)
    expect(result.status).toBe('warning')
    expect(result.summary.fullyFeasibleFactorCount).toBe(0)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_SENSITIVITY_NO_FULLY_FEASIBLE_FACTOR',
    )).toBe(true)
  })

  it('rejects duplicate or invalid factors', () => {
    const input = buildInput()
    input.commonListFactors = [2, 2, 0]

    const result = evaluatePriceBatchSensitivity(input)

    expect(result.available).toBe(false)
    expect(result.status).toBe('invalid')
    expect(result.issues.some(
      (item) => item.code === 'PRICE_SENSITIVITY_DUPLICATE_FACTOR',
    )).toBe(true)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_SENSITIVITY_INVALID_FACTOR',
    )).toBe(true)
  })

  it('returns isolated copies and never mutates the source input', () => {
    const input = buildInput()
    const snapshot = structuredClone(input)
    const first = evaluatePriceBatchSensitivity(input)

    first.input.products[0]!.cost = 999
    first.input.commonListFactors.splice(0, 1)

    const second = evaluatePriceBatchSensitivity(input)

    expect(input).toEqual(snapshot)
    expect(second.input.products[0]?.cost).toBe(100)
    expect(second.input.commonListFactors).toEqual([1.8, 2, 2.3])
    expect(second.isolation).toEqual({
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsSensitivity: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    })
  })
})
