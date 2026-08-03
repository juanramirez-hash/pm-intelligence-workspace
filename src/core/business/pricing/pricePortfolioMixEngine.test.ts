import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePricePortfolioMix,
} from './pricePortfolioMixEngine'

import type {
  PricePortfolioMixInput,
} from './pricePortfolioMixContracts'

function buildInput(): PricePortfolioMixInput {
  return {
    id: 'Portfolio 1',
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
        cost: 200,
      },
    ],
    discountRates: [0.32, 0.34],
    objective: {
      type: 'target_gross_margin',
      grossMargin: 0.24,
    },
    commonListFactors: [1.9, 2.1],
    mixes: [
      {
        id: 'MIX-CONSERVATIVE',
        label: 'Conservadora',
        quantities: [
          {
            productId: 'P-1',
            quantity: 10,
          },
          {
            productId: 'P-2',
            quantity: 5,
          },
        ],
      },
      {
        id: 'MIX-TARGET',
        label: 'Objetivo',
        quantities: [
          {
            productId: 'P-1',
            quantity: 20,
          },
          {
            productId: 'P-2',
            quantity: 20,
          },
        ],
      },
    ],
  }
}

describe('evaluatePricePortfolioMix', () => {
  it('builds Mix by Factor by Discount cells', () => {
    const result = evaluatePricePortfolioMix(buildInput())

    expect(result.available).toBe(true)
    expect(result.methodology).toBe('price-portfolio-mix-v1')
    expect(result.cells).toHaveLength(8)
    expect(result.summary.mixCount).toBe(2)
    expect(result.summary.factorCount).toBe(2)
    expect(result.summary.discountCount).toBe(2)
  })

  it('weights financial totals with the explicit quantities', () => {
    const result = evaluatePricePortfolioMix(buildInput())
    const cell = result.cells.find(
      (item) => item.mixId === 'MIX-CONSERVATIVE' &&
        item.commonListFactor === 2.1 &&
        item.discountRate === 0.32,
    )

    expect(cell?.totalUnits).toBe(15)
    expect(cell?.totalCost).toBe(2000)
    expect(cell?.totalListPrice).toBe(4200)
    expect(cell?.totalSellingPrice).toBe(2856)
    expect(cell?.totalGrossProfit).toBe(856)
    expect(cell?.grossMargin).toBeCloseTo(0.29972, 5)
    expect(cell?.weightedNetFactor).toBeCloseTo(1.428, 6)
  })

  it('publishes sales and GP concentration by product', () => {
    const result = evaluatePricePortfolioMix(buildInput())
    const cell = result.cells.find(
      (item) => item.mixId === 'MIX-CONSERVATIVE' &&
        item.commonListFactor === 2.1 &&
        item.discountRate === 0.32,
    )

    expect(cell?.topSalesProductId).toBe('P-1')
    expect(cell?.topSalesShare).toBe(0.5)
    expect(cell?.topGrossProfitProductId).toBe('P-1')
    expect(cell?.topGrossProfitShare).toBe(0.5)
  })

  it('compares mixes without ranking or selecting a winner', () => {
    const result = evaluatePricePortfolioMix(buildInput())

    expect(result.mixSummaries).toHaveLength(2)
    expect(result.mixSummaries[0]?.mixId).toBe('MIX-CONSERVATIVE')
    expect(result.mixSummaries[1]?.mixId).toBe('MIX-TARGET')
    expect(result.explainability.join(' ')).toContain('no ordena ni recomienda')
  })

  it('calculates volume coverage from units rather than product count', () => {
    const input = buildInput()
    input.objective = {
      type: 'target_gross_profit',
      grossProfit: 50,
    }
    input.commonListFactors = [2]
    input.discountRates = [0.32]
    input.mixes = [{
      id: 'MIX-WEIGHTED',
      label: 'Ponderada',
      quantities: [
        {
          productId: 'P-1',
          quantity: 90,
        },
        {
          productId: 'P-2',
          quantity: 10,
        },
      ],
    }]

    const result = evaluatePricePortfolioMix(input)
    const cell = result.cells[0]

    expect(cell?.meetsObjectiveProductCount).toBe(1)
    expect(cell?.belowObjectiveProductCount).toBe(1)
    expect(cell?.volumeCoverageRate).toBe(0.1)
    expect(cell?.feasibility).toBe('partially_feasible')
  })

  it('rejects mixes with zero or invalid volume', () => {
    const input = buildInput()
    input.mixes = [{
      id: 'EMPTY',
      label: 'Sin volumen',
      quantities: [
        {
          productId: 'P-1',
          quantity: 0,
        },
        {
          productId: 'P-2',
          quantity: -1,
        },
      ],
    }]

    const result = evaluatePricePortfolioMix(input)

    expect(result.available).toBe(false)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_PORTFOLIO_MIX_INVALID_QUANTITY',
    )).toBe(true)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_PORTFOLIO_MIX_ZERO_VOLUME',
    )).toBe(true)
  })

  it('rejects unknown and duplicated product quantities', () => {
    const input = buildInput()
    input.mixes = [{
      id: 'BAD-MIX',
      label: 'Inválida',
      quantities: [
        {
          productId: 'P-1',
          quantity: 1,
        },
        {
          productId: 'P-1',
          quantity: 2,
        },
        {
          productId: 'UNKNOWN',
          quantity: 3,
        },
      ],
    }]

    const result = evaluatePricePortfolioMix(input)

    expect(result.available).toBe(false)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_PORTFOLIO_MIX_DUPLICATE_QUANTITY_PRODUCT',
    )).toBe(true)
    expect(result.issues.some(
      (item) => item.code === 'PRICE_PORTFOLIO_MIX_UNKNOWN_PRODUCT',
    )).toBe(true)
  })

  it('returns isolated copies and never mutates source assumptions', () => {
    const input = buildInput()
    const snapshot = structuredClone(input)
    const first = evaluatePricePortfolioMix(input)

    first.input.products[0]!.cost = 999
    first.input.mixes[0]!.quantities[0]!.quantity = 999
    first.input.commonListFactors.splice(0, 1)

    const second = evaluatePricePortfolioMix(input)

    expect(input).toEqual(snapshot)
    expect(second.input.products[0]?.cost).toBe(100)
    expect(second.input.mixes[0]?.quantities[0]?.quantity).toBe(10)
    expect(second.input.commonListFactors).toEqual([1.9, 2.1])
    expect(second.isolation).toEqual({
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsPortfolioMix: false,
      writesForecast: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    })
  })
})
