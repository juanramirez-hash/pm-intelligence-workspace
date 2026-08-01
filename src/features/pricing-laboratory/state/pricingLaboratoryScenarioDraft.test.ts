import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildPricingLaboratoryTemplateFromDraft,
  createEmptyPricingLaboratoryScenarioDraft,
} from './pricingLaboratoryScenarioDraft'

describe('pricingLaboratoryScenarioDraft', () => {
  it('requires an explicit value and a selected scope', () => {
    const result = buildPricingLaboratoryTemplateFromDraft(
      createEmptyPricingLaboratoryScenarioDraft(),
      1,
      null,
    )

    expect(result.valid).toBe(false)
    expect(result.input).toBeNull()
    expect(result.errors).toContain(
      'Selecciona producto y moneda antes de agregar un escenario.',
    )
  })

  it('converts a visual percentage into a decimal discount basis', () => {
    const draft = {
      ...createEmptyPricingLaboratoryScenarioDraft(),
      templateId: 'SILVER' as const,
      basisType: 'discount_rate' as const,
      basisValue: '46',
    }

    const result = buildPricingLaboratoryTemplateFromDraft(
      draft,
      2,
      {
        productId: 'P-1',
        currency: 'MXN',
      },
    )

    expect(result.valid).toBe(true)
    expect(result.input?.id).toBe('UI-SILVER-2')
    expect(result.input?.basis).toEqual({
      type: 'discount_rate',
      discountRate: 0.46,
    })
    expect(result.input?.scope).toEqual({
      productIds: ['P-1'],
      currencies: ['MXN'],
    })
  })

  it('preserves the selected base for a compounded additional discount', () => {
    const draft = {
      ...createEmptyPricingLaboratoryScenarioDraft(),
      templateId: 'PROMOTION' as const,
      basisType: 'additional_discount' as const,
      basisValue: '5',
      additionalDiscountBase: 'current_selling_price' as const,
    }

    const result = buildPricingLaboratoryTemplateFromDraft(
      draft,
      1,
      {
        productId: 'P-1',
        currency: 'USD',
      },
    )

    expect(result.input?.basis).toEqual({
      type: 'additional_discount',
      discountRate: 0.05,
      applyTo: 'current_selling_price',
    })
  })

  it('builds only the guardrails explicitly captured by the user', () => {
    const draft = createEmptyPricingLaboratoryScenarioDraft()
    draft.basisValue = '500'
    draft.guardrails.minimumGrossMargin = '24'
    draft.guardrails.maximumDiscountRate = '48'
    draft.guardrails.severity = 'blocking'

    const result = buildPricingLaboratoryTemplateFromDraft(
      draft,
      1,
      {
        productId: 'P-1',
        currency: 'MXN',
      },
    )

    expect(result.input?.guardrails).toEqual([
      {
        type: 'minimum_gross_margin',
        threshold: 0.24,
        severity: 'blocking',
      },
      {
        type: 'maximum_discount_rate',
        threshold: 0.48,
        severity: 'blocking',
      },
    ])
  })

  it('rejects percentages outside the visual laboratory range', () => {
    const draft = {
      ...createEmptyPricingLaboratoryScenarioDraft(),
      basisType: 'target_gross_margin' as const,
      basisValue: '100',
    }

    const result = buildPricingLaboratoryTemplateFromDraft(
      draft,
      1,
      {
        productId: 'P-1',
        currency: 'MXN',
      },
    )

    expect(result.valid).toBe(false)
    expect(result.input).toBeNull()
  })
})
