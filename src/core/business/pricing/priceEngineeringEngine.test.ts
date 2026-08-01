import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessPrice,
  BusinessPriceScenario,
} from '../entities/price'

import {
  createEngineeringScenarioFromStored,
  evaluatePriceLaboratory,
} from './priceEngineeringEngine'

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

describe('PL-003 Price Engineering Engine', () => {
  it('evaluates a direct selling price without mutating the source', () => {
    const original = structuredClone(price)
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [{
        id: 'CUSTOM-1',
        name: 'Precio capturado',
        kind: 'custom',
        basis: {
          type: 'selling_price',
          sellingPrice: 140,
        },
      }],
    })

    expect(result.available).toBe(true)
    expect(result.executionMode).toBe('simulation-only')
    expect(result.scenarios[0]?.metrics?.grossProfit).toBe(40)
    expect(result.scenarios[0]?.delta?.sellingPrice).toBe(-10)
    expect(price).toEqual(original)
  })

  it('evaluates a discount over list price', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [{
        id: 'DISC-30',
        name: 'Descuento 30%',
        kind: 'promotion',
        basis: {
          type: 'discount_rate',
          discountRate: 0.3,
        },
      }],
    })

    expect(result.scenarios[0]?.metrics?.sellingPrice).toBe(140)
    expect(result.scenarios[0]?.metrics?.discountRate).toBe(0.3)
  })

  it('solves the price required for a target gross margin', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [{
        id: 'MARGIN-25',
        name: 'Margen 25%',
        kind: 'custom',
        basis: {
          type: 'target_gross_margin',
          grossMargin: 0.25,
        },
      }],
    })

    expect(result.scenarios[0]?.metrics?.sellingPrice).toBe(133.33)
    expect(result.scenarios[0]?.metrics?.grossMargin).toBeCloseTo(
      0.249981,
      6,
    )
  })

  it('solves target gross profit and selling-price factor', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [
        {
          id: 'GP-35',
          name: 'GP 35',
          kind: 'custom',
          basis: {
            type: 'target_gross_profit',
            grossProfit: 35,
          },
        },
        {
          id: 'FACTOR-1.6',
          name: 'Factor 1.6',
          kind: 'custom',
          basis: {
            type: 'selling_price_factor',
            factor: 1.6,
          },
        },
      ],
    })

    expect(result.scenarios[0]?.metrics?.sellingPrice).toBe(135)
    expect(result.scenarios[1]?.metrics?.sellingPrice).toBe(160)
    expect(result.scenarios[1]?.metrics?.sellingPriceFactor).toBe(1.6)
  })

  it('compounds an additional discount over the current price', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [{
        id: 'EXTRA-5',
        name: '5% adicional',
        kind: 'promotion',
        basis: {
          type: 'additional_discount',
          discountRate: 0.05,
          applyTo: 'current_selling_price',
        },
      }],
    })

    expect(result.scenarios[0]?.metrics?.sellingPrice).toBe(142.5)
    expect(result.scenarios[0]?.metrics?.discountRate).toBe(0.2875)
  })

  it('does not invent a hidden minimum margin policy', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [{
        id: 'LOW-BUT-UNRESTRICTED',
        name: 'Margen bajo sin política',
        kind: 'custom',
        basis: {
          type: 'selling_price',
          sellingPrice: 101,
        },
      }],
    })

    expect(result.scenarios[0]?.metrics?.grossMargin).toBeCloseTo(
      1 / 101,
      6,
    )
    expect(result.scenarios[0]?.status).toBe('valid')
  })

  it('blocks only when an explicit blocking guardrail is violated', () => {
    const result = evaluatePriceLaboratory({
      price,
      defaultGuardrails: [{
        type: 'minimum_gross_margin',
        threshold: 0.28,
        severity: 'blocking',
      }],
      scenarios: [{
        id: 'LOW-MARGIN',
        name: 'Margen bajo',
        kind: 'custom',
        basis: {
          type: 'selling_price',
          sellingPrice: 130,
        },
      }],
    })

    expect(result.scenarios[0]?.status).toBe('blocked')
    expect(result.scenarios[0]?.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'MINIMUM_GROSS_MARGIN_NOT_MET',
          severity: 'blocking',
        }),
      ]),
    )
  })

  it('keeps warning guardrails non-blocking', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [{
        id: 'WARN',
        name: 'Advertencia',
        kind: 'custom',
        basis: {
          type: 'discount_rate',
          discountRate: 0.4,
        },
        guardrails: [{
          type: 'maximum_discount_rate',
          threshold: 0.35,
          severity: 'warning',
        }],
      }],
    })

    expect(result.scenarios[0]?.status).toBe('warning')
  })

  it('returns an invalid scenario instead of throwing', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [{
        id: 'INVALID',
        name: 'Margen imposible',
        kind: 'custom',
        basis: {
          type: 'target_gross_margin',
          grossMargin: 1,
        },
      }],
    })

    expect(result.scenarios[0]?.status).toBe('invalid')
    expect(result.scenarios[0]?.metrics).toBeNull()
  })

  it('adapts persisted scenarios without persisting the evaluation', () => {
    const stored: BusinessPriceScenario = {
      id: 'SILVER-001',
      priceId: price.id,
      productId: price.productId,
      name: 'Silver capturado',
      kind: 'pricing_group',
      pricingGroupId: 'SILVER',
      sellingPrice: 145,
      discountRate: 0.275,
      grossProfit: 45,
      grossMargin: 45 / 145,
      marginBand: '30_to_35',
      effectiveDate: null,
      source: 'manual',
      sourceReference: null,
    }

    const laboratoryInput = createEngineeringScenarioFromStored(stored)
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [laboratoryInput],
    })

    expect(result.scenarios[0]?.pricingGroupId).toBe('SILVER')
    expect(result.scenarios[0]?.metrics?.sellingPrice).toBe(145)
    expect(result.isolation.persistsScenarioResults).toBe(false)
  })

  it('summarizes multiple scenario statuses in input order', () => {
    const result = evaluatePriceLaboratory({
      price,
      scenarios: [
        {
          id: 'VALID',
          name: 'Válido',
          kind: 'custom',
          basis: {
            type: 'selling_price',
            sellingPrice: 150,
          },
        },
        {
          id: 'WARNING',
          name: 'Arriba de lista',
          kind: 'custom',
          basis: {
            type: 'selling_price',
            sellingPrice: 210,
          },
        },
        {
          id: 'INVALID',
          name: 'Inválido',
          kind: 'custom',
          basis: {
            type: 'selling_price_factor',
            factor: 0,
          },
        },
      ],
    })

    expect(result.scenarios.map((scenario) => scenario.scenarioId)).toEqual([
      'VALID',
      'WARNING',
      'INVALID',
    ])
    expect(result.summary).toEqual({
      totalScenarios: 3,
      validScenarios: 1,
      warningScenarios: 1,
      blockedScenarios: 0,
      invalidScenarios: 1,
    })
  })

  it('does not convert or mix the source currency', () => {
    const usdPrice: BusinessPrice = {
      ...price,
      id: 'SKU-001::USD::2026-08-01',
      currency: 'USD',
      cost: 10,
      listPrice: 20,
      sellingPrice: 15,
    }

    const result = evaluatePriceLaboratory({
      price: usdPrice,
      scenarios: [{
        id: 'USD-1',
        name: 'USD',
        kind: 'custom',
        basis: {
          type: 'discount_rate',
          discountRate: 0.25,
        },
      }],
    })

    expect(result.base?.currency).toBe('USD')
    expect(result.scenarios[0]?.metrics?.currency).toBe('USD')
  })
})
