import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchDesign,
} from '../../../core/business/pricing'

import {
  buildPriceTierLadderInputFromDraft,
  createEmptyPricingTierDraft,
  createEmptyPricingTierLadderDraft,
  parsePricingTierLadderFactors,
} from './pricingTierLadderDraft'

function sourceBatch() {
  return evaluatePriceBatchDesign({
    id: 'Batch 1',
    brandName: 'Nueva Marca',
    currency: 'MXN',
    products: [
      {
        id: 'P-1',
        model: 'Modelo 1',
        sku: null,
        cost: 100,
      },
    ],
    discountRates: [0.32],
    objective: {
      type: 'target_gross_margin',
      grossMargin: 0.24,
    },
    commonFactor: {
      strategy: 'protect_all',
    },
  })
}

describe('pricingTierLadderDraft', () => {
  it('starts without hidden discounts, objectives or factors', () => {
    expect(createEmptyPricingTierLadderDraft()).toEqual({
      tiers: [createEmptyPricingTierDraft(1)],
      commonListFactors: '',
      notes: '',
    })
  })

  it('parses optional explicit factors without requiring a default', () => {
    expect(parsePricingTierLadderFactors('')).toEqual({
      factors: [],
      errors: [],
    })
    expect(parsePricingTierLadderFactors('1.9, 2.1 2.3')).toEqual({
      factors: [1.9, 2.1, 2.3],
      errors: [],
    })
  })

  it('builds mixed margin and GP tiers from explicit percentages and amounts', () => {
    const source = sourceBatch()
    const result = buildPriceTierLadderInputFromDraft(source, {
      tiers: [
        {
          key: 'tier-1',
          label: 'Comercial 32',
          discountRate: '32',
          objectiveType: 'minimum_gross_margin',
          objectiveValue: '24',
          notes: '',
        },
        {
          key: 'tier-2',
          label: 'Silver',
          discountRate: '46',
          objectiveType: 'minimum_gross_profit',
          objectiveValue: '40',
          notes: 'Nivel especial',
        },
      ],
      commonListFactors: '2, 2.7',
      notes: 'Arquitectura nueva',
    }, 3)

    expect(result.valid).toBe(true)
    expect(result.input?.id).toBe('TIER-LADDER-3')
    expect(result.input?.tiers).toEqual([
      expect.objectContaining({
        label: 'Comercial 32',
        discountRate: 0.32,
        objective: {
          type: 'minimum_gross_margin',
          grossMargin: 0.24,
        },
      }),
      expect.objectContaining({
        label: 'Silver',
        discountRate: 0.46,
        objective: {
          type: 'minimum_gross_profit',
          grossProfit: 40,
        },
      }),
    ])
    expect(result.input?.commonListFactors).toEqual([2, 2.7])
    expect(result.input?.products).not.toBe(source.input.products)
  })

  it('rejects duplicate tier discounts and invalid objectives', () => {
    const result = buildPriceTierLadderInputFromDraft(sourceBatch(), {
      tiers: [
        {
          key: 'tier-1',
          label: 'Nivel A',
          discountRate: '32',
          objectiveType: 'minimum_gross_margin',
          objectiveValue: '100',
          notes: '',
        },
        {
          key: 'tier-2',
          label: 'Nivel B',
          discountRate: '32',
          objectiveType: 'minimum_gross_profit',
          objectiveValue: '-1',
          notes: '',
        },
      ],
      commonListFactors: '',
      notes: '',
    }, 1)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
