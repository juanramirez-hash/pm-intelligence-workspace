import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceCostFxStress,
} from '../../../core/business/pricing'

import {
  buildPricingCostFxStressExport,
} from './buildPricingCostFxStressExport'

function result() {
  return evaluatePriceCostFxStress({
    id: 'STRESS-1',
    sourceBatchId: 'BATCH-1',
    brandName: 'Nueva Marca',
    sourceCostCurrency: 'USD',
    reportingCurrency: 'MXN',
    referenceExchangeRate: 18,
    products: [{ id: 'P-1', model: 'Modelo 1', sku: null, cost: 10, quantity: 5 }],
    scenarios: [{ id: 'BASE', label: 'Base', costChangeRate: 0, exchangeRate: 18 }],
    tiers: [{
      id: 'SILVER',
      label: 'Silver',
      discountRate: 0.46,
      objective: { type: 'minimum_gross_margin', grossMargin: 0.24 },
    }],
    commonListFactors: [2.5],
  })
}

describe('buildPricingCostFxStressExport', () => {
  it('builds a six-sheet documentary workbook', () => {
    const payload = buildPricingCostFxStressExport(
      result(),
      new Date('2026-08-02T12:00:00.000Z'),
    )

    expect(payload.sheets).toHaveLength(6)
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Matriz Stress',
      'Detalle por Producto',
      'Resumen Escenarios',
      'Resumen por Factor',
      'Metadatos',
    ])
    expect(payload.fileName).toContain('Cost-FX-Stress')
  })

  it('includes the mandatory disclaimer and explicit FX assumptions', () => {
    const payload = buildPricingCostFxStressExport(result())
    const summaryText = payload.sheets[0]?.rows.flat().join(' ')
    const metadataText = payload.sheets[5]?.rows.flat().join(' ')

    expect(summaryText).toContain('SIMULACIÓN SIN EFECTO COMERCIAL')
    expect(metadataText).toContain('Consulta tipo de cambio en vivo')
    expect(metadataText).toContain('false')
  })

  it('rejects unavailable results', () => {
    const unavailable = result()
    unavailable.available = false

    expect(() => buildPricingCostFxStressExport(unavailable)).toThrow()
  })
})
