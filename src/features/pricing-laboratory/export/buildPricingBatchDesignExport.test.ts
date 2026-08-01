import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchDesign,
} from '../../../core/business/pricing'

import {
  buildPricingBatchDesignExport,
} from './buildPricingBatchDesignExport'

import {
  buildPricingBatchPrintDocument,
} from './printPricingBatchDesign'

function buildResult() {
  return evaluatePriceBatchDesign({
    id: 'BATCH-EXPORT',
    brandName: 'Nueva Marca',
    currency: 'MXN',
    products: [
      {
        id: 'PRODUCT-1',
        model: 'MODELO-01',
        sku: 'SKU-01',
        cost: 100,
      },
      {
        id: 'PRODUCT-2',
        model: 'MODELO-02',
        sku: 'SKU-02',
        cost: 200,
      },
    ],
    discountRates: [0.32, 0.34],
    objective: {
      type: 'target_gross_margin',
      grossMargin: 0.24,
    },
    commonFactor: {
      strategy: 'protect_all',
    },
  })
}

describe('buildPricingBatchDesignExport', () => {
  it('builds a five-sheet workbook payload', () => {
    const payload = buildPricingBatchDesignExport(
      buildResult(),
      new Date('2026-08-01T12:00:00.000Z'),
    )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Pricing-Batch-Nueva-Marca-MXN-2026-08-01.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Matriz de Pricing',
      'Resumen por Descuento',
      'Productos y Supuestos',
      'Metadatos',
    ])
    expect(payload.sheets[1]?.rows).toHaveLength(5)
  })

  it('includes the no-commercial-effect disclaimer', () => {
    const payload = buildPricingBatchDesignExport(buildResult())
    const flattened = payload.sheets.flatMap((sheet) => sheet.rows).flat()

    expect(flattened).toContain('SIMULACIÓN SIN EFECTO COMERCIAL')
  })

  it('builds an isolated printable document', () => {
    const html = buildPricingBatchPrintDocument(buildResult())

    expect(html).toContain('Pricing Laboratory · Matriz por lote')
    expect(html).toContain('SIMULACIÓN SIN EFECTO COMERCIAL')
    expect(html).toContain('MODELO-01')
    expect(html).toContain('Factor común')
  })
})
