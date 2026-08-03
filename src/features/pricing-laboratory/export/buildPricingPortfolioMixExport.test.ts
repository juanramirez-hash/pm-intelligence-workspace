import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePricePortfolioMix,
} from '../../../core/business/pricing'

import {
  buildPricingPortfolioMixExport,
} from './buildPricingPortfolioMixExport'

function result() {
  return evaluatePricePortfolioMix({
    id: 'PORTFOLIO-1',
    sourceBatchId: 'BATCH-1',
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
    discountRates: [0.32],
    objective: {
      type: 'target_gross_margin',
      grossMargin: 0.24,
    },
    commonListFactors: [2.1],
    mixes: [{
      id: 'MIX-1',
      label: 'Objetivo',
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
    }],
  })
}

describe('buildPricingPortfolioMixExport', () => {
  it('builds a six-sheet documentary workbook', () => {
    const payload = buildPricingPortfolioMixExport(
      result(),
      new Date('2026-08-02T12:00:00.000Z'),
    )

    expect(payload.sheets).toHaveLength(6)
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Matriz Mezcla',
      'Detalle por Producto',
      'Resumen por Mezcla',
      'Resumen por Factor',
      'Metadatos',
    ])
    expect(payload.fileName).toContain('Pricing-Portfolio-Mix')
  })

  it('includes the mandatory disclaimer and weighted rows', () => {
    const payload = buildPricingPortfolioMixExport(result())
    const summaryText = payload.sheets[0]?.rows.flat().join(' ')
    const matrix = payload.sheets[1]?.rows

    expect(summaryText).toContain('SIMULACIÓN SIN EFECTO COMERCIAL')
    expect(matrix?.[1]?.[5]).toBe(15)
    expect(matrix?.[1]?.[13]).toBe(2856)
  })

  it('rejects unavailable results', () => {
    const unavailable = result()
    unavailable.available = false

    expect(() => buildPricingPortfolioMixExport(unavailable)).toThrow()
  })
})
