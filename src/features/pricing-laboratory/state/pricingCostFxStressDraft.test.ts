import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PriceBatchDesignResult,
} from '../../../core/business/pricing'

import {
  buildPriceCostFxStressInputFromDraft,
  createEmptyPricingCostFxStressDraft,
  createEmptyPricingCostFxStressScenarioDraft,
  createEmptyPricingCostFxStressTierDraft,
  parsePricingCostFxStressFactors,
} from './pricingCostFxStressDraft'

function source(): PriceBatchDesignResult {
  return {
    available: true,
    methodology: 'price-batch-design-v1',
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsBatch: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: 'valid',
    input: {
      id: 'BATCH-1',
      brandName: 'Nueva Marca',
      currency: 'USD',
      products: [
        { id: 'P-1', model: 'Modelo 1', sku: null, cost: 10 },
        { id: 'P-2', model: 'Modelo 2', sku: null, cost: 20 },
      ],
      discountRates: [0.32],
      objective: { type: 'target_gross_margin', grossMargin: 0.24 },
      commonFactor: { strategy: 'explicit', factor: 2.1 },
    },
    commonListFactor: 2.1,
    rows: [],
    discountSummaries: [],
    summary: {
      productCount: 2,
      discountCount: 1,
      matrixRowCount: 2,
      calculableRowCount: 2,
      warningRowCount: 0,
      invalidRowCount: 0,
      meetsObjectiveCount: 2,
      belowObjectiveCount: 0,
      commonListFactor: 2.1,
    },
    issues: [],
    explainability: [],
  }
}

describe('pricingCostFxStressDraft', () => {
  it('creates visible base assumptions without live FX lookup', () => {
    const draft = createEmptyPricingCostFxStressDraft(source())

    expect(draft.sourceCostCurrency).toBe('USD')
    expect(draft.reportingCurrency).toBe('USD')
    expect(draft.referenceExchangeRate).toBe('1')
    expect(draft.scenarios[0]?.costChangePercent).toBe('0')
    expect(draft.scenarios[0]?.exchangeRate).toBe('1')
    expect(draft.quantities).toEqual({ 'P-1': '1', 'P-2': '1' })
  })

  it('parses explicit factors and rejects duplicates', () => {
    expect(parsePricingCostFxStressFactors('2, 2.5')).toEqual({
      factors: [2, 2.5],
      errors: [],
    })
    expect(parsePricingCostFxStressFactors('2 2').errors).toHaveLength(1)
  })

  it('builds stress scenarios, tiers and quantities from the draft', () => {
    const draft = createEmptyPricingCostFxStressDraft(source())
    draft.reportingCurrency = 'MXN'
    draft.referenceExchangeRate = '18'
    draft.commonListFactors = '2, 2.5'
    draft.quantities['P-1'] = '10'
    draft.quantities['P-2'] = '5'
    draft.scenarios[0]!.exchangeRate = '18'
    const stress = createEmptyPricingCostFxStressScenarioDraft(2)
    stress.label = 'Costo +10 / TC 20'
    stress.costChangePercent = '10'
    stress.exchangeRate = '20'
    draft.scenarios.push(stress)
    const tier = createEmptyPricingCostFxStressTierDraft(1)
    tier.label = 'Silver'
    tier.discountRate = '46'
    tier.objectiveValue = '24'
    draft.tiers = [tier]

    const result = buildPriceCostFxStressInputFromDraft(source(), draft, 3)

    expect(result.valid).toBe(true)
    expect(result.input?.id).toBe('COST-FX-STRESS-3')
    expect(result.input?.scenarios).toHaveLength(2)
    expect(result.input?.scenarios[1]?.costChangeRate).toBe(0.1)
    expect(result.input?.tiers[0]?.discountRate).toBe(0.46)
    expect(result.input?.products[0]?.quantity).toBe(10)
  })

  it('rejects missing factors, invalid rates and zero total volume', () => {
    const draft = createEmptyPricingCostFxStressDraft(source())
    draft.commonListFactors = ''
    draft.quantities['P-1'] = '0'
    draft.quantities['P-2'] = '0'
    draft.scenarios[0]!.exchangeRate = '0'

    const result = buildPriceCostFxStressInputFromDraft(source(), draft, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('factor común')
    expect(result.errors.join(' ')).toContain('tipo de cambio')
    expect(result.errors.join(' ')).toContain('cantidad mayor a cero')
  })
})
