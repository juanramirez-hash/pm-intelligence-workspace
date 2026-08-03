import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceLandedCost,
} from '../../../core/business/pricing'

import {
  buildPricingLandedCostExport,
} from './buildPricingLandedCostExport'

function createResult() {
  return evaluatePriceLandedCost({
    id: 'Landed 1',
    sourceBatchId: 'Batch 1',
    brandName: 'Nueva Marca',
    sourceCostCurrency: 'USD',
    reportingCurrency: 'MXN',
    referenceExchangeRate: 18,
    listPriceBasis: 'reference_landed_cost',
    products: [{
      id: 'P-1',
      model: 'Modelo 1',
      sku: 'SKU-1',
      cost: 10,
      quantity: 5,
    }],
    components: [{
      id: 'FREIGHT',
      label: 'Flete',
      category: 'freight',
      direction: 'add',
      calculation: {
        type: 'percentage_of_purchase_cost',
        rate: 0.05,
      },
      productIds: null,
    }],
    scenarios: [{
      id: 'BASE',
      label: 'Base',
      purchaseCostChangeRate: 0,
      exchangeRate: 18,
      componentChangeRate: 0,
    }],
    tiers: [{
      id: 'TIER-1',
      label: 'Comercial 34',
      discountRate: 0.34,
      objective: {
        type: 'minimum_gross_margin',
        grossMargin: 0.24,
      },
    }],
    commonListFactors: [2.1],
  })
}

describe('buildPricingLandedCostExport', () => {
  it('builds six traceable sheets with the mandatory disclaimer', () => {
    const payload = buildPricingLandedCostExport(
      createResult(),
      new Date('2026-08-02T12:00:00.000Z'),
    )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Pricing-Landed-Cost-Nueva-Marca-MXN-2026-08-02.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Waterfall Componentes',
      'Matriz Landed Cost',
      'Detalle por Producto',
      'Resumen Escenario Factor',
      'Metadatos',
    ])
    expect(payload.sheets[0]?.rows.flat()).toContain(
      'SIMULACIÓN SIN EFECTO COMERCIAL',
    )
    expect(payload.sheets[1]?.rows.flat()).toContain('Flete')
  })

  it('rejects an unavailable result', () => {
    const result = createResult()
    result.available = false

    expect(() => buildPricingLandedCostExport(result)).toThrow(
      'Pricing landed-cost result is not available for export.',
    )
  })
})
