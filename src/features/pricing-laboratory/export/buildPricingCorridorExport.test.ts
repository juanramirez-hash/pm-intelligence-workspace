import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceCorridor,
} from '../../../core/business/pricing'

import {
  buildPricingCorridorExport,
} from './buildPricingCorridorExport'

function createResult() {
  return evaluatePriceCorridor({
    id: 'Corridor 1',
    sourceBatchId: 'Batch 1',
    brandName: 'Nueva Marca',
    sourceCostCurrency: 'USD',
    reportingCurrency: 'MXN',
    referenceExchangeRate: 18,
    costBasis: 'reference_purchase_cost',
    products: [{
      id: 'P-1',
      model: 'Modelo 1',
      sku: 'SKU-1',
      cost: 10,
      quantity: 5,
      explicitLandedCost: null,
    }],
    scenarios: [{
      id: 'BASE',
      label: 'Base',
      costChangeRate: 0,
      exchangeRate: 18,
    }],
    tiers: [{
      id: 'SILVER',
      label: 'Silver',
      discountRate: 0.46,
      minimumGrossMargin: 0.24,
      minimumGrossProfit: null,
    }],
    commonListFactors: [2.5],
  })
}

describe('buildPricingCorridorExport', () => {
  it('builds six traceable sheets with the mandatory disclaimer', () => {
    const payload = buildPricingCorridorExport(
      createResult(),
      new Date('2026-08-02T12:00:00.000Z'),
    )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Pricing-Corridor-Nueva-Marca-MXN-2026-08-02.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Corredores Producto',
      'Matriz Corredor',
      'Pisos y Descuentos',
      'Resumen Escenario Factor',
      'Metadatos',
    ])
    expect(payload.sheets[0]?.rows.flat()).toContain(
      'SIMULACIÓN SIN EFECTO COMERCIAL',
    )
    expect(payload.sheets[3]?.rows.flat()).toContain('Silver')
  })

  it('rejects an unavailable result', () => {
    const result = createResult()
    result.available = false

    expect(() => buildPricingCorridorExport(result)).toThrow(
      'Pricing corridor result is not available for export.',
    )
  })
})
