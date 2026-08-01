import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceTierLadder,
} from './priceTierLadderEngine'

import type {
  PriceTierLadderInput,
} from './priceTierLadderContracts'

function input(): PriceTierLadderInput {
  return {
    id: 'Ladder 1',
    sourceBatchId: 'Batch 1',
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
        cost: 150,
      },
    ],
    tiers: [
      {
        id: 'commercial-32',
        label: 'Comercial 32',
        discountRate: 0.32,
        objective: {
          type: 'minimum_gross_margin',
          grossMargin: 0.24,
        },
      },
      {
        id: 'silver-46',
        label: 'Silver',
        discountRate: 0.46,
        objective: {
          type: 'minimum_gross_profit',
          grossProfit: 40,
        },
      },
    ],
    commonListFactors: [2, 2.7],
  }
}

describe('evaluatePriceTierLadder', () => {
  it('calculates a different mathematical minimum for every commercial tier', () => {
    const result = evaluatePriceTierLadder(input())

    expect(result.available).toBe(true)
    expect(result.tierMinimums).toHaveLength(2)
    expect(result.tierMinimums[0]?.minimumRequiredFactor).toBeCloseTo(1.935, 4)
    expect(result.tierMinimums[1]?.minimumRequiredFactor).toBeCloseTo(2.5926, 4)
  })

  it('identifies the limiting tier and product for the whole ladder', () => {
    const result = evaluatePriceTierLadder(input())

    expect(result.globalMinimumFactor).toBeCloseTo(2.5926, 4)
    expect(result.limitingTierId).toBe('SILVER-46')
    expect(result.limitingTierLabel).toBe('Silver')
    expect(result.limitingProductId).toBe('P-1')
    expect(result.limitingProductLabel).toBe('Modelo 1')
  })

  it('evaluates candidate factors against every tier and product', () => {
    const result = evaluatePriceTierLadder(input())
    const factorTwo = result.factorSummaries.find(
      (summary) => summary.commonListFactor === 2,
    )
    const factorTwoSeven = result.factorSummaries.find(
      (summary) => summary.commonListFactor === 2.7,
    )

    expect(result.cells).toHaveLength(4)
    expect(factorTwo?.fullyFeasibleAcrossAllTiers).toBe(false)
    expect(factorTwo?.notFeasibleTierCount).toBe(1)
    expect(factorTwoSeven?.fullyFeasibleAcrossAllTiers).toBe(true)
  })

  it('preserves different objectives across the discount ladder', () => {
    const result = evaluatePriceTierLadder(input())
    const marginCell = result.cells.find(
      (cell) => cell.tierId === 'COMMERCIAL-32' && cell.commonListFactor === 2,
    )
    const gpCell = result.cells.find(
      (cell) => cell.tierId === 'SILVER-46' && cell.commonListFactor === 2,
    )

    expect(marginCell?.objective.type).toBe('minimum_gross_margin')
    expect(marginCell?.feasibility).toBe('fully_feasible')
    expect(gpCell?.objective.type).toBe('minimum_gross_profit')
    expect(gpCell?.feasibility).toBe('not_feasible')
  })

  it('can calculate tier minimums without hidden candidate factors', () => {
    const withoutFactors = input()
    withoutFactors.commonListFactors = []
    const result = evaluatePriceTierLadder(withoutFactors)

    expect(result.available).toBe(true)
    expect(result.cells).toEqual([])
    expect(result.globalMinimumFactor).toBeCloseTo(2.5926, 4)
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'PRICE_TIER_LADDER_NO_CANDIDATE_FACTORS',
        severity: 'info',
      }),
    ]))
  })

  it('rejects duplicate discounts because every tier must be unambiguous', () => {
    const duplicate = input()
    duplicate.tiers[1] = {
      ...duplicate.tiers[1],
      discountRate: 0.32,
    }
    const result = evaluatePriceTierLadder(duplicate)

    expect(result.available).toBe(false)
    expect(result.status).toBe('invalid')
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'PRICE_TIER_LADDER_DUPLICATE_TIER_DISCOUNT',
      }),
    ]))
  })

  it('does not mutate products, tiers or candidate factors', () => {
    const source = input()
    const snapshot = structuredClone(source)
    const result = evaluatePriceTierLadder(source)

    expect(source).toEqual(snapshot)
    expect(result.input.products).not.toBe(source.products)
    expect(result.input.tiers).not.toBe(source.tiers)
    expect(result.input.commonListFactors).not.toBe(source.commonListFactors)
  })

  it('declares simulation-only isolation with no repository writes', () => {
    const result = evaluatePriceTierLadder(input())

    expect(result.executionMode).toBe('simulation-only')
    expect(result.isolation).toEqual({
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsLadder: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    })
  })
})
