import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  findPricingLaboratoryTemplateDefinition,
  getStandardPricingLaboratoryTemplates,
} from './pricingTemplateCatalog'

describe('PL-004 Pricing Template Catalog', () => {
  it('publishes the six standard laboratory templates without numeric policy', () => {
    const templates = getStandardPricingLaboratoryTemplates()

    expect(templates.map((template) => template.id)).toEqual([
      'PROMOTION',
      'SILVER',
      'GOLD',
      'PLATINUM',
      'PROJECT',
      'CUSTOM',
    ])
    expect(templates.every(
      (template) => template.numericPolicy === 'explicit-input-only',
    )).toBe(true)
    expect(templates.every(
      (template) => !('discountRate' in template),
    )).toBe(true)
  })

  it('returns isolated copies of definitions and basis suggestions', () => {
    const first = getStandardPricingLaboratoryTemplates()
    const second = getStandardPricingLaboratoryTemplates()

    const firstTemplate = first[0]

    expect(firstTemplate).toBeDefined()

    if (!firstTemplate) {
      throw new Error('Expected the PROMOTION template definition.')
    }

    ;(firstTemplate.suggestedBasisTypes as string[]).splice(0, 1)

    expect(second[0]?.suggestedBasisTypes).toEqual([
      'discount_rate',
      'additional_discount',
      'selling_price',
      'target_gross_margin',
    ])
  })

  it('maps Silver to a pricing-group scenario without assigning values', () => {
    const silver = findPricingLaboratoryTemplateDefinition('SILVER')

    expect(silver?.kind).toBe('pricing_group')
    expect(silver?.pricingGroupId).toBe('SILVER')
    expect(silver?.numericPolicy).toBe('explicit-input-only')
  })
})
