import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceCostFxStress,
} from './priceCostFxStressEngine'

import type {
  PriceCostFxStressInput,
} from './priceCostFxStressContracts'

function buildInput(): PriceCostFxStressInput {
  return {
    id: 'Stress 1',
    sourceBatchId: 'Batch 1',
    brandName: 'Nueva Marca',
    sourceCostCurrency: 'USD',
    reportingCurrency: 'MXN',
    referenceExchangeRate: 18,
    products: [
      {
        id: 'P-1',
        model: 'Modelo 1',
        sku: 'SKU-1',
        cost: 10,
        quantity: 10,
      },
      {
        id: 'P-2',
        model: 'Modelo 2',
        sku: 'SKU-2',
        cost: 20,
        quantity: 5,
      },
    ],
    scenarios: [
      {
        id: 'BASE',
        label: 'Base',
        costChangeRate: 0,
        exchangeRate: 18,
      },
      {
        id: 'STRESS',
        label: 'Costo +10 / TC 20',
        costChangeRate: 0.1,
        exchangeRate: 20,
      },
    ],
    tiers: [
      {
        id: 'TIER-32',
        label: 'Comercial 32',
        discountRate: 0.32,
        objective: {
          type: 'minimum_gross_margin',
          grossMargin: 0.24,
        },
      },
      {
        id: 'TIER-46',
        label: 'Silver',
        discountRate: 0.46,
        objective: {
          type: 'minimum_gross_margin',
          grossMargin: 0.24,
        },
      },
    ],
    commonListFactors: [2, 2.5],
  }
}

describe('evaluatePriceCostFxStress', () => {
  it('builds Scenario by Factor by Tier cells', () => {
    const result = evaluatePriceCostFxStress(buildInput())

    expect(result.available).toBe(true)
    expect(result.methodology).toBe('price-cost-fx-stress-v1')
    expect(result.cells).toHaveLength(8)
    expect(result.summary.scenarioCount).toBe(2)
    expect(result.summary.factorCount).toBe(2)
    expect(result.summary.tierCount).toBe(2)
  })

  it('applies explicit cost change and exchange rate before pricing', () => {
    const result = evaluatePriceCostFxStress(buildInput())
    const cell = result.cells.find(
      (item) => item.scenarioId === 'STRESS' &&
        item.commonListFactor === 2 &&
        item.tierId === 'TIER-32',
    )
    const product = cell?.products.find((item) => item.product.id === 'P-1')

    expect(product?.baseCostInSourceCurrency).toBe(10)
    expect(product?.adjustedCostInSourceCurrency).toBe(11)
    expect(product?.convertedBaseCost).toBe(180)
    expect(product?.stressedUnitCost).toBe(220)
    expect(cell?.stressedCostTotal).toBe(4400)
  })

  it('calculates weighted GP and margin using explicit quantities', () => {
    const result = evaluatePriceCostFxStress(buildInput())
    const cell = result.cells.find(
      (item) => item.scenarioId === 'BASE' &&
        item.commonListFactor === 2.5 &&
        item.tierId === 'TIER-32',
    )

    expect(cell?.totalUnits).toBe(15)
    expect(cell?.stressedCostTotal).toBe(3600)
    expect(cell?.totalSellingPrice).toBe(6120)
    expect(cell?.totalGrossProfit).toBe(2520)
    expect(cell?.grossMargin).toBeCloseTo(0.411765, 6)
  })

  it('identifies the scenario with the highest required factor as critical', () => {
    const result = evaluatePriceCostFxStress(buildInput())

    expect(result.criticalScenarioId).toBe('STRESS')
    expect(result.criticalScenarioLabel).toBe('Costo +10 / TC 20')
    expect(result.summary.globalMaximumRequiredFactor).toBeGreaterThan(0)
  })

  it('classifies factor feasibility across stress scenarios', () => {
    const result = evaluatePriceCostFxStress(buildInput())
    const factor2 = result.factorSummaries.find(
      (summary) => summary.commonListFactor === 2,
    )
    const factor25 = result.factorSummaries.find(
      (summary) => summary.commonListFactor === 2.5,
    )

    expect(factor2?.fullyFeasibleAcrossAllScenariosAndTiers).toBe(false)
    expect(factor25?.fullyFeasibleCellCount).toBeGreaterThanOrEqual(
      factor2?.fullyFeasibleCellCount ?? 0,
    )
  })

  it('rejects invalid exchange rates and cost changes at or below -100%', () => {
    const input = buildInput()
    input.scenarios = [{
      id: 'BAD',
      label: 'Inválido',
      costChangeRate: -1,
      exchangeRate: 0,
    }]

    const result = evaluatePriceCostFxStress(input)

    expect(result.available).toBe(false)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_COST_FX_STRESS_INVALID_SCENARIO',
    )).toBe(true)
  })

  it('requires explicit factors, tiers and positive portfolio volume', () => {
    const input = buildInput()
    input.commonListFactors = []
    input.tiers = []
    input.products = input.products.map((product) => ({
      ...product,
      quantity: 0,
    }))

    const result = evaluatePriceCostFxStress(input)

    expect(result.available).toBe(false)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_COST_FX_STRESS_EMPTY_FACTORS',
    )).toBe(true)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_COST_FX_STRESS_EMPTY_TIERS',
    )).toBe(true)
  })

  it('returns isolated copies and never mutates source assumptions', () => {
    const input = buildInput()
    const snapshot = structuredClone(input)
    const first = evaluatePriceCostFxStress(input)

    first.input.products[0]!.cost = 999
    first.input.scenarios[0]!.exchangeRate = 999
    first.input.commonListFactors.splice(0, 1)

    const second = evaluatePriceCostFxStress(input)

    expect(input).toEqual(snapshot)
    expect(second.input.products[0]?.cost).toBe(10)
    expect(second.input.scenarios[0]?.exchangeRate).toBe(18)
    expect(second.input.commonListFactors).toEqual([2, 2.5])
    expect(second.isolation).toEqual({
      mutatesCatalogPrice: false,
      mutatesSourceCost: false,
      persistsStressTest: false,
      fetchesLiveExchangeRate: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    })
  })
})
