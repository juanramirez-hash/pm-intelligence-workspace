import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchDesign,
} from '../../../core/business/pricing'

import {
  buildPriceBatchSensitivityInputFromDraft,
  createEmptyPricingBatchSensitivityDraft,
  parsePricingBatchSensitivityFactors,
} from './pricingBatchSensitivityDraft'

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
    discountRates: [0.32, 0.34],
    objective: {
      type: 'target_gross_margin',
      grossMargin: 0.24,
    },
    commonFactor: {
      strategy: 'protect_all',
    },
  })
}

describe('pricingBatchSensitivityDraft', () => {
  it('starts without hidden factor assumptions', () => {
    expect(createEmptyPricingBatchSensitivityDraft()).toEqual({
      commonListFactors: '',
      notes: '',
    })
  })

  it('parses explicit factors separated by comma, spaces or lines', () => {
    const result = parsePricingBatchSensitivityFactors('1.9, 2.0\n2.15;2.3')

    expect(result.errors).toEqual([])
    expect(result.factors).toEqual([1.9, 2, 2.15, 2.3])
  })

  it('rejects duplicate and invalid factors', () => {
    const result = parsePricingBatchSensitivityFactors('2 2 0 bad')

    expect(result.factors).toEqual([2])
    expect(result.errors).toHaveLength(3)
  })

  it('builds a sensitivity input from an isolated batch copy', () => {
    const source = sourceBatch()
    const result = buildPriceBatchSensitivityInputFromDraft(
      source,
      {
        commonListFactors: '1.9, 2.1, 2.3',
        notes: 'Análisis de familia',
      },
      4,
    )

    expect(result.valid).toBe(true)
    expect(result.input?.id).toBe('BATCH-SENSITIVITY-4')
    expect(result.input?.sourceBatchId).toBe('BATCH 1')
    expect(result.input?.commonListFactors).toEqual([1.9, 2.1, 2.3])
    expect(result.input?.products).not.toBe(source.input.products)
  })
})
