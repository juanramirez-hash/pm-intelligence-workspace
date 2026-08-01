import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchSensitivity,
} from '../../../core/business/pricing'

import {
  buildPricingBatchSensitivityExport,
} from './buildPricingBatchSensitivityExport'

function result() {
  return evaluatePriceBatchSensitivity({
    id: 'Sensitivity 1',
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
      type: 'target_gross_profit',
      grossProfit: 50,
    },
    commonListFactors: [2, 2.3],
  })
}

describe('buildPricingBatchSensitivityExport', () => {
  it('builds a six-sheet documentary workbook', () => {
    const payload = buildPricingBatchSensitivityExport(
      result(),
      new Date('2026-08-01T12:00:00.000Z'),
    )

    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Matriz Sensibilidad',
      'Mínimos por Descuento',
      'Resumen por Factor',
      'Detalle por Producto',
      'Metadatos',
    ])
    expect(payload.fileName).toBe(
      'PM-Intelligence-Pricing-Sensitivity-Nueva-Marca-MXN-2026-08-01.xlsx',
    )
  })

  it('includes the mandatory non-commercial disclaimer', () => {
    const payload = buildPricingBatchSensitivityExport(result())
    const values = payload.sheets.flatMap((sheet) => sheet.rows.flat())

    expect(values).toContain('SIMULACIÓN SIN EFECTO COMERCIAL')
    expect(values).toContain('price-batch-sensitivity-v1')
  })

  it('exports factor, discount, feasibility and product detail', () => {
    const payload = buildPricingBatchSensitivityExport(result())
    const matrix = payload.sheets[1]
    const detail = payload.sheets[4]

    expect(matrix?.rows).toHaveLength(5)
    expect(matrix?.rows[0]).toContain('Factor mínimo requerido')
    expect(detail?.rows).toHaveLength(9)
    expect(detail?.rows[0]).toContain('Factor individual requerido')
  })
})
