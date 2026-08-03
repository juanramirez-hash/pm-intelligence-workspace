import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceCorridor,
} from './priceCorridorEngine'

import type {
  PriceCorridorInput,
} from './priceCorridorContracts'

function createInput(): PriceCorridorInput {
  return {
    id: 'Corridor 1',
    sourceBatchId: 'Batch 1',
    brandName: 'Nueva Marca',
    sourceCostCurrency: 'USD',
    reportingCurrency: 'MXN',
    referenceExchangeRate: 1,
    costBasis: 'reference_purchase_cost',
    products: [{
      id: 'P-1',
      model: 'Modelo 1',
      sku: 'SKU-1',
      cost: 100,
      quantity: 10,
      explicitLandedCost: null,
    }],
    scenarios: [{
      id: 'STRESS',
      label: 'Costo +10%',
      costChangeRate: 0.10,
      exchangeRate: 1,
    }],
    tiers: [{
      id: 'GOLD',
      label: 'Gold',
      discountRate: 0.30,
      minimumGrossMargin: 0.20,
      minimumGrossProfit: 15,
    }],
    commonListFactors: [2],
  }
}

describe('evaluatePriceCorridor', () => {
  it('calculates the governing floor, maximum discount and safety distance', () => {
    const result = evaluatePriceCorridor(createInput())
    const cell = result.cells[0]
    const product = cell?.products[0]

    expect(result.available).toBe(true)
    expect(product?.referenceUnitCost).toBe(100)
    expect(product?.stressedUnitCost).toBe(110)
    expect(product?.floorFromGrossMargin).toBe(137.5)
    expect(product?.floorFromGrossProfit).toBe(125)
    expect(product?.priceFloor).toBe(137.5)
    expect(product?.candidateListPrice).toBe(200)
    expect(product?.candidateNetPrice).toBe(140)
    expect(product?.maximumDiscountRate).toBe(0.3125)
    expect(product?.safetyAmount).toBe(2.5)
    expect(product?.exposure).toBe('safe')
    expect(cell?.feasibility).toBe('fully_feasible')
  })

  it('marks a candidate below the floor without changing the source cost', () => {
    const input = createInput()
    input.commonListFactors = [1.8]
    const original = structuredClone(input)
    const result = evaluatePriceCorridor(input)
    const product = result.cells[0]?.products[0]

    expect(product?.candidateNetPrice).toBe(126)
    expect(product?.priceFloor).toBe(137.5)
    expect(product?.safetyAmount).toBe(-11.5)
    expect(product?.exposure).toBe('below_floor')
    expect(result.cells[0]?.feasibility).toBe('not_feasible')
    expect(result.status).toBe('warning')
    expect(input).toEqual(original)
    expect(result.isolation.mutatesSourceCost).toBe(false)
    expect(result.isolation.approvesDiscount).toBe(false)
  })

  it('uses explicit landed cost and the exchange-rate ratio under stress', () => {
    const input = createInput()
    input.referenceExchangeRate = 18
    input.costBasis = 'reference_landed_cost'
    input.products[0]!.cost = 10
    input.products[0]!.explicitLandedCost = 180
    input.scenarios[0]!.exchangeRate = 20

    const result = evaluatePriceCorridor(input)
    const product = result.cells[0]?.products[0]

    expect(product?.referenceUnitCost).toBe(180)
    expect(product?.stressedUnitCost).toBe(220)
    expect(product?.candidateListPrice).toBe(360)
  })

  it('derives the mathematical factor required at the evaluated discount', () => {
    const result = evaluatePriceCorridor(createInput())
    const product = result.cells[0]?.products[0]

    expect(product?.requiredListFactor).toBeCloseTo(
      137.5 / (100 * 0.70),
      6,
    )
    expect(result.summary.globalMaximumRequiredFactor).toBe(
      product?.requiredListFactor,
    )
    expect(result.criticalScenarioLabel).toBe('Costo +10%')
  })

  it('rejects missing landed cost, invalid floors and empty factors', () => {
    const input = createInput()
    input.costBasis = 'reference_landed_cost'
    input.products[0]!.explicitLandedCost = null
    input.tiers[0]!.minimumGrossMargin = null
    input.tiers[0]!.minimumGrossProfit = null
    input.commonListFactors = []

    const result = evaluatePriceCorridor(input)

    expect(result.available).toBe(false)
    expect(result.status).toBe('invalid')
    expect(result.issues.some(
      (item) => item.code === 'PRICE_CORRIDOR_MISSING_LANDED_COST',
    )).toBe(true)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_CORRIDOR_INVALID_TIER',
    )).toBe(true)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_CORRIDOR_EMPTY_FACTORS',
    )).toBe(true)
  })
})
