import {
  describe,
  expect,
  it,
} from 'vitest'

import type { BusinessPrice } from '../entities/price'

import {
  PricingTemplateEngine,
  evaluatePricingTemplateSet,
} from './pricingTemplateEngine'

const price: BusinessPrice = {
  id: 'SKU-001::MXN::2026-08-01',
  productId: 'SKU-001',
  brandId: 'UNV',
  currency: 'MXN',
  cost: 100,
  listPrice: 200,
  sellingPrice: 150,
  discountRate: 0.25,
  grossProfit: 50,
  grossMargin: 1 / 3,
  pricingFactor: 2,
  marginBand: '30_to_35',
  pricingGroupId: 'CURRENT',
  effectiveDate: '2026-08-01',
  source: 'erp',
  sourceReference: 'pricing.xlsx#2',
}

describe('PL-004 Pricing Group Templates and Guardrails', () => {
  it('evaluates Silver only from the explicit discount supplied', () => {
    const result = evaluatePricingTemplateSet({
      price,
      templates: [{
        id: 'UNV-SILVER',
        templateId: 'SILVER',
        basis: {
          type: 'discount_rate',
          discountRate: 0.46,
        },
      }],
    })

    expect(result.templates[0]?.evaluation?.pricingGroupId).toBe('SILVER')
    expect(result.templates[0]?.evaluation?.metrics?.sellingPrice).toBe(108)
    expect(result.templates[0]?.definition.numericPolicy).toBe(
      'explicit-input-only',
    )
  })

  it('keeps promotion, project and custom templates in their scenario kinds', () => {
    const result = evaluatePricingTemplateSet({
      price,
      templates: [
        {
          id: 'PROMO',
          templateId: 'PROMOTION',
          basis: {
            type: 'additional_discount',
            discountRate: 0.05,
            applyTo: 'current_selling_price',
          },
        },
        {
          id: 'PROJECT-1',
          templateId: 'PROJECT',
          basis: {
            type: 'target_gross_margin',
            grossMargin: 0.24,
          },
        },
        {
          id: 'CUSTOM-1',
          templateId: 'CUSTOM',
          basis: {
            type: 'selling_price',
            sellingPrice: 140,
          },
        },
      ],
    })

    expect(result.laboratory.scenarios.map((item) => item.kind)).toEqual([
      'promotion',
      'project',
      'custom',
    ])
  })

  it('applies a matching brand and currency scope', () => {
    const result = evaluatePricingTemplateSet({
      price,
      templates: [{
        id: 'UNV-GOLD-MXN',
        templateId: 'GOLD',
        basis: {
          type: 'discount_rate',
          discountRate: 0.48,
        },
        scope: {
          brandIds: ['UNV'],
          currencies: ['MXN'],
        },
      }],
    })

    expect(result.templates[0]?.status).toBe('evaluated')
    expect(result.summary.notApplicableTemplates).toBe(0)
  })

  it('does not evaluate a template outside its explicit scope', () => {
    const result = evaluatePricingTemplateSet({
      price,
      templates: [{
        id: 'OTHER-BRAND',
        templateId: 'PLATINUM',
        basis: {
          type: 'discount_rate',
          discountRate: 0.5,
        },
        scope: {
          brandIds: ['AJAX'],
        },
      }],
    })

    expect(result.templates[0]?.status).toBe('not_applicable')
    expect(result.laboratory.scenarios).toEqual([])
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'TEMPLATE_NOT_APPLICABLE',
          severity: 'info',
        }),
      ]),
    )
  })

  it('resolves default, profile and template guardrails by explicit precedence', () => {
    const result = evaluatePricingTemplateSet({
      price,
      defaultGuardrails: [{
        type: 'minimum_gross_margin',
        threshold: 0.2,
        severity: 'warning',
      }],
      guardrailProfiles: [{
        id: 'COMMERCIAL',
        name: 'Commercial review',
        guardrails: [{
          type: 'minimum_gross_margin',
          threshold: 0.24,
          severity: 'warning',
        }],
      }],
      templates: [{
        id: 'PROJECT-OVERRIDE',
        templateId: 'PROJECT',
        guardrailProfileId: 'COMMERCIAL',
        basis: {
          type: 'selling_price',
          sellingPrice: 125,
        },
        guardrails: [{
          type: 'minimum_gross_margin',
          threshold: 0.25,
          severity: 'blocking',
        }],
      }],
    })

    expect(result.templates[0]?.resolvedGuardrails).toEqual([{
      type: 'minimum_gross_margin',
      threshold: 0.25,
      severity: 'blocking',
    }])
    expect(result.templates[0]?.evaluation?.status).toBe('blocked')
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'GUARDRAIL_OVERRIDDEN',
          severity: 'info',
        }),
      ]),
    )
  })

  it('keeps warning guardrails as review signals', () => {
    const result = evaluatePricingTemplateSet({
      price,
      guardrailProfiles: [{
        id: 'SILVER-POLICY',
        name: 'Silver policy draft',
        guardrails: [{
          type: 'maximum_discount_rate',
          threshold: 0.45,
          severity: 'warning',
        }],
      }],
      templates: [{
        id: 'SILVER-TEST',
        templateId: 'SILVER',
        guardrailProfileId: 'SILVER-POLICY',
        basis: {
          type: 'discount_rate',
          discountRate: 0.46,
        },
      }],
    })

    expect(result.templates[0]?.evaluation?.status).toBe('warning')
  })

  it('marks duplicate configuration identifiers invalid', () => {
    const result = evaluatePricingTemplateSet({
      price,
      templates: [
        {
          id: 'DUPLICATE',
          templateId: 'SILVER',
          basis: {
            type: 'discount_rate',
            discountRate: 0.46,
          },
        },
        {
          id: 'duplicate',
          templateId: 'GOLD',
          basis: {
            type: 'discount_rate',
            discountRate: 0.48,
          },
        },
      ],
    })

    expect(result.templates.map((item) => item.status)).toEqual([
      'invalid',
      'invalid',
    ])
    expect(result.summary.invalidTemplates).toBe(2)
    expect(result.laboratory.scenarios).toEqual([])
  })

  it('rejects a missing or duplicated guardrail profile', () => {
    const missing = evaluatePricingTemplateSet({
      price,
      templates: [{
        id: 'MISSING-PROFILE',
        templateId: 'GOLD',
        guardrailProfileId: 'NOT-FOUND',
        basis: {
          type: 'discount_rate',
          discountRate: 0.48,
        },
      }],
    })

    const duplicated = evaluatePricingTemplateSet({
      price,
      guardrailProfiles: [
        {
          id: 'DUP',
          name: 'One',
          guardrails: [],
        },
        {
          id: 'dup',
          name: 'Two',
          guardrails: [],
        },
      ],
      templates: [{
        id: 'DUP-PROFILE',
        templateId: 'GOLD',
        guardrailProfileId: 'DUP',
        basis: {
          type: 'discount_rate',
          discountRate: 0.48,
        },
      }],
    })

    expect(missing.templates[0]?.status).toBe('invalid')
    expect(duplicated.templates[0]?.status).toBe('invalid')
  })

  it('keeps disabled templates out of the calculation engine', () => {
    const result = evaluatePricingTemplateSet({
      price,
      templates: [{
        id: 'DISABLED',
        templateId: 'PROMOTION',
        enabled: false,
        basis: {
          type: 'discount_rate',
          discountRate: 0.1,
        },
      }],
    })

    expect(result.templates[0]?.status).toBe('disabled')
    expect(result.summary.disabledTemplates).toBe(1)
    expect(result.laboratory.scenarios).toEqual([])
  })

  it('does not mutate prices, templates, profiles or guardrails', () => {
    const input = {
      price,
      defaultGuardrails: [{
        type: 'minimum_gross_margin' as const,
        threshold: 0.2,
        severity: 'warning' as const,
      }],
      guardrailProfiles: [{
        id: 'PROFILE',
        name: 'Profile',
        guardrails: [{
          type: 'maximum_discount_rate' as const,
          threshold: 0.5,
          severity: 'warning' as const,
        }],
      }],
      templates: [{
        id: 'IMMUTABLE',
        templateId: 'CUSTOM' as const,
        guardrailProfileId: 'PROFILE',
        basis: {
          type: 'selling_price' as const,
          sellingPrice: 140,
        },
      }],
    }
    const original = structuredClone(input)

    const result = evaluatePricingTemplateSet(input)

    expect(input).toEqual(original)
    expect(result.isolation).toEqual({
      mutatesSourcePrice: false,
      persistsScenarioResults: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    })
  })

  it('preserves template order and summarizes every disposition', () => {
    const result = evaluatePricingTemplateSet({
      price,
      templates: [
        {
          id: 'EVALUATED',
          templateId: 'SILVER',
          basis: {
            type: 'selling_price',
            sellingPrice: 140,
          },
        },
        {
          id: 'DISABLED',
          templateId: 'GOLD',
          enabled: false,
          basis: {
            type: 'selling_price',
            sellingPrice: 130,
          },
        },
        {
          id: 'NOT-APPLICABLE',
          templateId: 'PLATINUM',
          scope: {
            currencies: ['USD'],
          },
          basis: {
            type: 'selling_price',
            sellingPrice: 120,
          },
        },
      ],
    })

    expect(result.templates.map((item) => item.configurationId)).toEqual([
      'EVALUATED',
      'DISABLED',
      'NOT-APPLICABLE',
    ])
    expect(result.summary).toEqual({
      totalTemplates: 3,
      evaluatedTemplates: 1,
      disabledTemplates: 1,
      notApplicableTemplates: 1,
      invalidTemplates: 0,
      guardrailProfiles: 0,
      totalIssues: 1,
    })
  })

  it('exposes an engine facade with the same simulation-only result', () => {
    const engine = new PricingTemplateEngine()
    const result = engine.evaluate({
      price,
      templates: [{
        id: 'ENGINE',
        templateId: 'CUSTOM',
        basis: {
          type: 'selling_price_factor',
          factor: 1.5,
        },
      }],
    })

    expect(result.methodology).toBe('pricing-template-v1')
    expect(result.executionMode).toBe('simulation-only')
    expect(result.templates[0]?.evaluation?.metrics?.sellingPrice).toBe(150)
  })
})
