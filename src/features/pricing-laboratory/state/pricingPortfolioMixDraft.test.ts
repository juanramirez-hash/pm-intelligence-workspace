import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PriceBatchDesignResult,
} from '../../../core/business/pricing'

import {
  buildPricePortfolioMixInputFromDraft,
  createEmptyPricingPortfolioMixDraft,
  createEmptyPricingPortfolioMixScenarioDraft,
  parsePricingPortfolioMixFactors,
} from './pricingPortfolioMixDraft'

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
        type: 'target_gross_margin',
        grossMargin: 0.24,
      },
      commonFactor: {
        strategy: 'explicit',
        factor: 2.1,
      },
    },
    commonListFactor: 2.1,
    rows: [],
    discountSummaries: [],
    summary: {
      productCount: 2,
      discountCount: 2,
      matrixRowCount: 4,
      calculableRowCount: 4,
      warningRowCount: 0,
      invalidRowCount: 0,
      meetsObjectiveCount: 4,
      belowObjectiveCount: 0,
      commonListFactor: 2.1,
    },
    issues: [],
    explainability: [],
  }
}

describe('pricingPortfolioMixDraft', () => {
  it('creates a mix with quantity slots for every product', () => {
    const draft = createEmptyPricingPortfolioMixDraft(['P-1', 'P-2'])

    expect(draft.mixes).toHaveLength(1)
    expect(draft.mixes[0]?.quantities).toEqual({
      'P-1': '',
      'P-2': '',
    })
  })

  it('parses explicit candidate factors and rejects duplicates', () => {
    expect(parsePricingPortfolioMixFactors('1.9, 2.1')).toEqual({
      factors: [1.9, 2.1],
      errors: [],
    })

    expect(parsePricingPortfolioMixFactors('2.1 2.1').errors).toHaveLength(1)
  })

  it('builds the core input from multiple volume mixes', () => {
    const draft = createEmptyPricingPortfolioMixDraft(['P-1', 'P-2'])
    draft.commonListFactors = '1.9, 2.1'
    draft.mixes[0]!.label = 'Conservadora'
    draft.mixes[0]!.quantities['P-1'] = '10'
    draft.mixes[0]!.quantities['P-2'] = '5'
    const second = createEmptyPricingPortfolioMixScenarioDraft(2, ['P-1', 'P-2'])
    second.label = 'Agresiva'
    second.quantities['P-1'] = '50'
    second.quantities['P-2'] = '25'
    draft.mixes.push(second)

    const result = buildPricePortfolioMixInputFromDraft(
      source(),
      draft,
      3,
    )

    expect(result.valid).toBe(true)
    expect(result.input?.id).toBe('PORTFOLIO-MIX-3')
    expect(result.input?.mixes).toHaveLength(2)
    expect(result.input?.mixes[0]?.quantities[0]?.quantity).toBe(10)
    expect(result.input?.commonListFactors).toEqual([1.9, 2.1])
  })

  it('rejects negative quantities and mixes without volume', () => {
    const draft = createEmptyPricingPortfolioMixDraft(['P-1', 'P-2'])
    draft.commonListFactors = '2.1'
    draft.mixes[0]!.quantities['P-1'] = '-1'

    const result = buildPricePortfolioMixInputFromDraft(
      source(),
      draft,
      1,
    )

    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('mayor o igual a cero')
    expect(result.errors.join(' ')).toContain('al menos una cantidad mayor a cero')
  })
})
