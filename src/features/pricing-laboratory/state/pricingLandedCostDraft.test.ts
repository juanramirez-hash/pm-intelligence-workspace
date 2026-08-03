import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchDesign,
} from '../../../core/business/pricing'

import {
  buildPriceLandedCostInputFromDraft,
  createEmptyPricingLandedCostComponentDraft,
  createEmptyPricingLandedCostDraft,
  createEmptyPricingLandedCostScenarioDraft,
  parsePricingLandedCostFactors,
} from './pricingLandedCostDraft'

function createSource() {
  return evaluatePriceBatchDesign({
    id: 'Batch 1',
    brandName: 'Nueva Marca',
    currency: 'USD',
    products: [
      {
        id: 'P-1',
        model: 'Modelo 1',
        sku: 'SKU-1',
        cost: 10,
      },
    ],
    discountRates: [0.34],
    objective: {
      type: 'target_gross_margin',
      grossMargin: 0.24,
    },
    commonFactor: {
      strategy: 'explicit',
      factor: 2.1,
    },
  })
}

describe('pricingLandedCostDraft', () => {
  it('creates a visible baseline without hidden cost components', () => {
    const draft = createEmptyPricingLandedCostDraft(createSource())

    expect(draft.sourceCostCurrency).toBe('USD')
    expect(draft.reportingCurrency).toBe('USD')
    expect(draft.referenceExchangeRate).toBe('1')
    expect(draft.listPriceBasis).toBe('reference_landed_cost')
    expect(draft.components).toEqual([])
    expect(draft.scenarios[0]?.label).toBe('Base')
    expect(draft.tiers[0]?.discountRate).toBe('34')
    expect(draft.tiers[0]?.objectiveValue).toBe('24')
  })

  it('parses explicit factor lists and reports duplicates', () => {
    expect(parsePricingLandedCostFactors('2.1, 2.3')).toEqual({
      factors: [2.1, 2.3],
      errors: [],
    })
    expect(parsePricingLandedCostFactors('2.1 2.1').errors).toHaveLength(1)
  })

  it('builds a typed landed-cost input from explicit draft values', () => {
    const source = createSource()
    const draft = createEmptyPricingLandedCostDraft(source)
    const component = createEmptyPricingLandedCostComponentDraft(1)
    component.label = 'Flete'
    component.category = 'freight'
    component.calculationType = 'percentage_of_purchase_cost'
    component.value = '5'
    draft.components = [component]
    draft.reportingCurrency = 'MXN'
    draft.referenceExchangeRate = '18'
    draft.scenarios[0]!.exchangeRate = '18'

    const result = buildPriceLandedCostInputFromDraft(source, draft, 1)

    expect(result.valid).toBe(true)
    expect(result.input?.components[0]?.calculation).toEqual({
      type: 'percentage_of_purchase_cost',
      rate: 0.05,
    })
    expect(result.input?.products[0]?.quantity).toBe(1)
    expect(result.input?.tiers[0]?.objective).toEqual({
      type: 'minimum_gross_margin',
      grossMargin: 0.24,
    })
  })

  it('rejects incomplete scenarios and negative component values', () => {
    const source = createSource()
    const draft = createEmptyPricingLandedCostDraft(source)
    const component = createEmptyPricingLandedCostComponentDraft(1)
    component.label = 'Seguro'
    component.value = '-1'
    draft.components = [component]
    draft.scenarios = [createEmptyPricingLandedCostScenarioDraft(2)]

    const result = buildPriceLandedCostInputFromDraft(source, draft, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.some((error) => error.includes('valor no negativo'))).toBe(true)
    expect(result.errors.some((error) => error.includes('tipo de cambio'))).toBe(true)
  })
})
