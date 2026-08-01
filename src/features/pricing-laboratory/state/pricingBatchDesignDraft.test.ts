import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildPriceBatchDesignInputFromDraft,
  createEmptyPricingBatchDesignDraft,
  parsePricingBatchProductsText,
} from './pricingBatchDesignDraft'

describe('pricingBatchDesignDraft', () => {
  it('builds a batch input from products, discounts and a common objective', () => {
    const result = buildPriceBatchDesignInputFromDraft({
      ...createEmptyPricingBatchDesignDraft(),
      brandName: 'Nueva Marca',
      currency: 'mxn',
      discountRates: '32, 34, 37',
      objectiveType: 'target_gross_margin',
      objectiveValue: '24',
      products: [
        {
          key: 'PRODUCT-1',
          model: 'MODELO-01',
          sku: 'SKU-01',
          cost: '100',
          notes: '',
        },
        {
          key: 'PRODUCT-2',
          model: 'MODELO-02',
          sku: '',
          cost: '200',
          notes: 'Referencia nueva',
        },
      ],
    }, 3)

    expect(result.valid).toBe(true)
    expect(result.input?.id).toBe('NEW-BRAND-BATCH-3')
    expect(result.input?.currency).toBe('MXN')
    expect(result.input?.discountRates).toEqual([0.32, 0.34, 0.37])
    expect(result.input?.products).toHaveLength(2)
    expect(result.input?.objective).toEqual({
      type: 'target_gross_margin',
      grossMargin: 0.24,
    })
  })

  it('supports an explicit common factor', () => {
    const draft = createEmptyPricingBatchDesignDraft()
    const result = buildPriceBatchDesignInputFromDraft({
      ...draft,
      currency: 'USD',
      discountRates: '34',
      objectiveType: 'target_gross_profit',
      objectiveValue: '2',
      commonFactorStrategy: 'explicit',
      explicitCommonFactor: '2.15',
      products: [{
        key: 'PRODUCT-1',
        model: 'MODEL',
        sku: '',
        cost: '6',
        notes: '',
      }],
    }, 1)

    expect(result.input?.commonFactor).toEqual({
      strategy: 'explicit',
      factor: 2.15,
    })
  })

  it('parses rows copied from Excel with tabs', () => {
    const parsed = parsePricingBatchProductsText(
      'MODELO-01\tSKU-01\t100\tEntrada\nMODELO-02\tSKU-02\t200',
      4,
    )

    expect(parsed.errors).toEqual([])
    expect(parsed.products).toEqual([
      {
        key: 'BATCH-PRODUCT-4',
        model: 'MODELO-01',
        sku: 'SKU-01',
        cost: '100',
        notes: 'Entrada',
      },
      {
        key: 'BATCH-PRODUCT-5',
        model: 'MODELO-02',
        sku: 'SKU-02',
        cost: '200',
        notes: '',
      },
    ])
  })

  it('reports invalid pasted costs', () => {
    const parsed = parsePricingBatchProductsText(
      'MODELO-01\tSKU-01\tNO-COST',
    )

    expect(parsed.products).toEqual([])
    expect(parsed.errors).toContain(
      'La línea 1 contiene un costo no numérico.',
    )
  })
})
