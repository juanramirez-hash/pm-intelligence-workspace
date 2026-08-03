import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchDesign,
} from '../../../core/business/pricing'

import {
  buildPriceCorridorInputFromDraft,
  createEmptyPricingCorridorDraft,
  createEmptyPricingCorridorScenarioDraft,
  createEmptyPricingCorridorTierDraft,
  parsePricingCorridorFactors,
} from './pricingCorridorDraft'

function createSource() {
  return evaluatePriceBatchDesign({
    id: 'Batch 1',
    brandName: 'Nueva Marca',
    currency: 'USD',
    products: [{
      id: 'P-1',
      model: 'Modelo 1',
      sku: 'SKU-1',
      cost: 10,
    }],
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

describe('pricingCorridorDraft', () => {
  it('creates a visible baseline from the batch without hidden thresholds', () => {
    const draft = createEmptyPricingCorridorDraft(createSource())

    expect(draft.sourceCostCurrency).toBe('USD')
    expect(draft.reportingCurrency).toBe('USD')
    expect(draft.referenceExchangeRate).toBe('1')
    expect(draft.costBasis).toBe('reference_purchase_cost')
    expect(draft.quantities['P-1']).toBe('1')
    expect(draft.explicitLandedCosts['P-1']).toBe('')
    expect(draft.scenarios[0]?.label).toBe('Base')
    expect(draft.tiers[0]?.discountPercent).toBe('34')
    expect(draft.tiers[0]?.minimumGrossMarginPercent).toBe('24')
    expect(draft.commonListFactors).toBe('2.1')
  })

  it('parses explicit factors and reports duplicates', () => {
    expect(parsePricingCorridorFactors('2.1, 2.3')).toEqual({
      factors: [2.1, 2.3],
      errors: [],
    })
    expect(parsePricingCorridorFactors('2.1 2.1').errors).toHaveLength(1)
  })

  it('builds a typed corridor input with simultaneous margin and GP floors', () => {
    const source = createSource()
    const draft = createEmptyPricingCorridorDraft(source)
    draft.reportingCurrency = 'MXN'
    draft.referenceExchangeRate = '18'
    draft.scenarios[0]!.exchangeRate = '18'
    draft.tiers[0]!.minimumGrossProfit = '25'

    const result = buildPriceCorridorInputFromDraft(source, draft, 1)

    expect(result.valid).toBe(true)
    expect(result.input?.products[0]?.quantity).toBe(1)
    expect(result.input?.tiers[0]).toMatchObject({
      discountRate: 0.34,
      minimumGrossMargin: 0.24,
      minimumGrossProfit: 25,
    })
  })

  it('requires explicit landed cost when that basis is selected', () => {
    const source = createSource()
    const draft = createEmptyPricingCorridorDraft(source)
    draft.costBasis = 'reference_landed_cost'

    const result = buildPriceCorridorInputFromDraft(source, draft, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.some(
      (error) => error.includes('costo aterrizado explícito'),
    )).toBe(true)
  })

  it('rejects incomplete scenarios and tiers without floors', () => {
    const source = createSource()
    const draft = createEmptyPricingCorridorDraft(source)
    const scenario = createEmptyPricingCorridorScenarioDraft(2)
    const tier = createEmptyPricingCorridorTierDraft(2)
    scenario.label = 'Stress'
    tier.label = 'Proyecto'
    tier.discountPercent = '40'
    draft.scenarios = [scenario]
    draft.tiers = [tier]

    const result = buildPriceCorridorInputFromDraft(source, draft, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.some(
      (error) => error.includes('tipo de cambio'),
    )).toBe(true)
    expect(result.errors.some(
      (error) => error.includes('piso de margen o GP'),
    )).toBe(true)
  })
})
