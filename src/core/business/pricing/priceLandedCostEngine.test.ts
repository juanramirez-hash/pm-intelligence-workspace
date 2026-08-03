import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceLandedCost,
} from './priceLandedCostEngine'

import type {
  PriceLandedCostInput,
} from './priceLandedCostContracts'

function createInput(): PriceLandedCostInput {
  return {
    id: 'Landed 1',
    sourceBatchId: 'Batch 1',
    brandName: 'Nueva Marca',
    sourceCostCurrency: 'USD',
    reportingCurrency: 'MXN',
    referenceExchangeRate: 18,
    listPriceBasis: 'reference_landed_cost',
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
    components: [
      {
        id: 'FREIGHT',
        label: 'Flete',
        category: 'freight',
        direction: 'add',
        calculation: {
          type: 'percentage_of_purchase_cost',
          rate: 0.05,
        },
        productIds: null,
      },
      {
        id: 'INSURANCE',
        label: 'Seguro',
        category: 'insurance',
        direction: 'add',
        calculation: {
          type: 'percentage_of_current_subtotal',
          rate: 0.01,
        },
        productIds: null,
      },
      {
        id: 'TARIFF',
        label: 'Arancel',
        category: 'tariff',
        direction: 'add',
        calculation: {
          type: 'percentage_of_current_subtotal',
          rate: 0.10,
        },
        productIds: null,
      },
      {
        id: 'REBATE',
        label: 'Rebate',
        category: 'rebate',
        direction: 'subtract',
        calculation: {
          type: 'fixed_per_unit',
          amount: 2,
        },
        productIds: null,
      },
    ],
    scenarios: [
      {
        id: 'BASE',
        label: 'Base',
        purchaseCostChangeRate: 0,
        exchangeRate: 18,
        componentChangeRate: 0,
      },
    ],
    tiers: [
      {
        id: 'TIER-1',
        label: 'Comercial 34',
        discountRate: 0.34,
        objective: {
          type: 'minimum_gross_margin',
          grossMargin: 0.24,
        },
      },
    ],
    commonListFactors: [2],
  }
}

describe('evaluatePriceLandedCost', () => {
  it('builds a sequential landed-cost waterfall and fixed candidate list price', () => {
    const result = evaluatePriceLandedCost(createInput())
    const product = result.cells[0]?.products[0]

    expect(result.available).toBe(true)
    expect(result.methodology).toBe('price-landed-cost-waterfall-v1')
    expect(product?.referencePurchaseCost).toBe(180)
    expect(product?.waterfall.map((step) => step.componentLabel)).toEqual([
      'Flete',
      'Seguro',
      'Arancel',
      'Rebate',
    ])
    expect(product?.landedCost).toBeCloseTo(207.98, 2)
    expect(product?.candidateListPrice).toBeCloseTo(415.96, 2)
    expect(product?.metrics?.sellingPrice).toBeCloseTo(274.53, 2)
    expect(product?.metrics?.grossProfit).toBeCloseTo(66.55, 2)
    expect(product?.waterfall[0]?.grossProfitImpact).toBe(-90)
    expect(result.isolation.persistsLandedCost).toBe(false)
  })

  it('allocates a fixed total by product quantity', () => {
    const input = createInput()
    input.components = [{
      id: 'CUSTOMS',
      label: 'Gastos aduanales',
      category: 'customs',
      direction: 'add',
      calculation: {
        type: 'fixed_total_by_quantity',
        amount: 300,
      },
      productIds: null,
    }]

    const result = evaluatePriceLandedCost(input)
    const products = result.cells[0]?.products ?? []

    expect(products[0]?.waterfall[0]?.allocationWeight).toBeCloseTo(2 / 3, 6)
    expect(products[1]?.waterfall[0]?.allocationWeight).toBeCloseTo(1 / 3, 6)
    expect(products[0]?.waterfall[0]?.unitImpact).toBe(20)
    expect(products[1]?.waterfall[0]?.unitImpact).toBe(20)
    expect(products.reduce(
      (total, product) => total + (product.waterfall[0]?.totalImpact ?? 0),
      0,
    )).toBe(300)
  })

  it('allocates a fixed total by purchase-cost value', () => {
    const input = createInput()
    input.components = [{
      id: 'HANDLING',
      label: 'Maniobras',
      category: 'handling',
      direction: 'add',
      calculation: {
        type: 'fixed_total_by_purchase_cost',
        amount: 360,
      },
      productIds: null,
    }]

    const result = evaluatePriceLandedCost(input)
    const products = result.cells[0]?.products ?? []

    expect(products[0]?.waterfall[0]?.allocationWeight).toBe(0.5)
    expect(products[1]?.waterfall[0]?.allocationWeight).toBe(0.5)
    expect(products[0]?.waterfall[0]?.unitImpact).toBe(18)
    expect(products[1]?.waterfall[0]?.unitImpact).toBe(36)
  })

  it('keeps the candidate list fixed while stressing cost, FX and components', () => {
    const input = createInput()
    input.scenarios.push({
      id: 'STRESS',
      label: 'Costo +10 / TC 20 / cargos +20',
      purchaseCostChangeRate: 0.10,
      exchangeRate: 20,
      componentChangeRate: 0.20,
    })

    const result = evaluatePriceLandedCost(input)
    const base = result.cells.find((cell) => cell.scenarioId === 'BASE')
      ?.products[0]
    const stress = result.cells.find((cell) => cell.scenarioId === 'STRESS')
      ?.products[0]

    expect(base?.candidateListPrice).toBe(stress?.candidateListPrice)
    expect(stress?.stressedPurchaseCost).toBe(220)
    expect(stress?.landedCost).toBeGreaterThan(base?.landedCost ?? 0)
    expect(stress?.metrics?.grossMargin).toBeLessThan(base?.metrics?.grossMargin ?? 1)
  })

  it('supports components scoped to selected products', () => {
    const input = createInput()
    input.components = [{
      id: 'LOGISTICS',
      label: 'Logística nacional',
      category: 'domestic_logistics',
      direction: 'add',
      calculation: {
        type: 'fixed_per_unit',
        amount: 25,
      },
      productIds: ['P-2'],
    }]

    const result = evaluatePriceLandedCost(input)
    const products = result.cells[0]?.products ?? []

    expect(products[0]?.waterfall).toHaveLength(0)
    expect(products[1]?.waterfall).toHaveLength(1)
    expect(products[1]?.landedCost).toBe(385)
  })

  it('identifies the limiting product and required factor', () => {
    const result = evaluatePriceLandedCost(createInput())
    const cell = result.cells[0]

    expect(cell?.minimumRequiredFactor).not.toBeNull()
    expect(cell?.limitingProductId).toBeTruthy()
    expect(cell?.factorGapToMinimum).not.toBeNull()
    expect(result.summary.globalMaximumRequiredFactor).not.toBeNull()
  })

  it('rejects an unknown product in component scope', () => {
    const input = createInput()
    input.components[0] = {
      ...input.components[0]!,
      productIds: ['UNKNOWN'],
    }

    const result = evaluatePriceLandedCost(input)

    expect(result.available).toBe(false)
    expect(result.issues.some(
      (issue) => issue.code === 'PRICE_LANDED_COST_UNKNOWN_COMPONENT_PRODUCT',
    )).toBe(true)
  })

  it('does not mutate the source input', () => {
    const input = createInput()
    const snapshot = JSON.stringify(input)

    const result = evaluatePriceLandedCost(input)
    result.input.components[0]!.label = 'Cambiado'
    result.cells[0]!.products[0]!.waterfall[0]!.componentLabel = 'Cambiado'

    expect(JSON.stringify(input)).toBe(snapshot)
    expect(input.components[0]?.label).toBe('Flete')
  })
})
