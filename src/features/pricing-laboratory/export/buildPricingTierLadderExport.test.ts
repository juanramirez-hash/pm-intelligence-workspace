import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceTierLadder,
} from '../../../core/business/pricing'

import {
  buildPricingTierLadderExport,
} from './buildPricingTierLadderExport'

function result() {
  return evaluatePriceTierLadder({
    id: 'Ladder 1',
    sourceBatchId: 'Batch 1',
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
  })
}

describe('buildPricingTierLadderExport', () => {
  it('creates a six-sheet documentary export with explicit assumptions', () => {
    const payload = buildPricingTierLadderExport(
      result(),
      new Date('2026-08-01T12:00:00.000Z'),
    )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Pricing-Discount-Ladder-Nueva-Marca-MXN-2026-08-01.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Escalera Comercial',
      'Matriz Factor Nivel',
      'Detalle por Producto',
      'Resumen por Factor',
      'Metadatos',
    ])
    expect(payload.sheets[0]?.rows).toEqual(expect.arrayContaining([
      ['Aviso obligatorio', 'SIMULACIÓN SIN EFECTO COMERCIAL'],
      ['Nivel limitante', 'Silver'],
    ]))
  })

  it('exports numerical factors, discounts, GP and margin as values', () => {
    const payload = buildPricingTierLadderExport(result())
    const matrix = payload.sheets.find(
      (sheet) => sheet.name === 'Matriz Factor Nivel',
    )
    const firstDataRow = matrix?.rows[1]

    expect(typeof firstDataRow?.[1]).toBe('number')
    expect(typeof firstDataRow?.[3]).toBe('number')
    expect(typeof firstDataRow?.[16]).toBe('number')
    expect(typeof firstDataRow?.[17]).toBe('number')
  })
})
