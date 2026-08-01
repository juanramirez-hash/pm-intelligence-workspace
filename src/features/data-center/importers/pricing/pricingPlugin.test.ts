import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  runImportEngine,
} from '../../engine/importEngine'

import {
  pricingImportPlugin,
} from './pricingPlugin'

import {
  runDataCenterImport,
} from '../../services/importService'

describe('PL-002 Pricing Data Center import plugin', () => {
  it('detecta el reporte ERP y genera precios MXN y USD sin mezclar monedas', () => {
    const rows = [
      {
        Name: 'CI111UNV01',
        Marca: 'UNV',
        Modelo: 'IPC-A',
        'Purchase Price': 200,
        'Ultimo precio de compra (USD)': 10,
        'Precio Lista (MXN)': 500,
        'Precio USD': 25,
        Moneda: 'USD',
        Currency: 'USD',
        'Quantity Pricing Schedule': 'CATALOGO 2026',
      },
    ]

    const result = runImportEngine(
      pricingImportPlugin,
      rows,
      Object.keys(rows[0] ?? {}),
    )

    expect(result.valid).toBe(true)
    expect(result.normalizedRows).toHaveLength(2)
    expect(result.normalizedRows.map((row) => row.currency))
      .toEqual(['MXN', 'USD'])
    expect(result.normalizedRows[0]?.sellingPrice).toBe(500)
    expect(result.summary.generatedPriceFacts).toBe(2)
    expect(result.summary.dualCurrencySourceRows).toBe(1)
    expect(result.businessModel?.prices[0]?.grossMargin).toBe(0.6)
  })

  it('acepta un contrato canónico con precio de venta explícito', () => {
    const rows = [
      {
        SKU: 'SW100TPL01',
        Brand: 'TP-LINK',
        Cost: 600,
        'List Price': 1200,
        'Selling Price': 900,
        'Price Currency': 'MXN',
        'Effective Date': '2026-07-31',
        'Pricing Group': 'GOLD',
      },
    ]

    const result = runImportEngine(
      pricingImportPlugin,
      rows,
      Object.keys(rows[0] ?? {}),
    )

    expect(result.valid).toBe(true)
    expect(result.normalizedRows).toHaveLength(1)
    expect(result.normalizedRows[0]).toMatchObject({
      productId: 'SW100TPL01',
      brandId: 'TP-LINK',
      currency: 'MXN',
      cost: 600,
      listPrice: 1200,
      sellingPrice: 900,
      pricingGroupId: 'GOLD',
      effectiveDate: '2026-07-31',
    })
    expect(result.businessModel?.prices[0]?.grossProfit).toBe(300)
    expect(result.businessModel?.prices[0]?.discountRate).toBe(0.25)
  })

  it('ignora filas que no contienen un canal monetario completo', () => {
    const rows = [
      {
        Name: 'CI111UNV01',
        Marca: 'UNV',
        'Purchase Price': null,
        'Precio Lista (MXN)': 500,
      },
    ]

    const result = runImportEngine(
      pricingImportPlugin,
      rows,
      Object.keys(rows[0] ?? {}),
    )

    expect(result.valid).toBe(true)
    expect(result.normalizedRows).toEqual([])
    expect(result.ignoredRows).toBe(1)
    expect(result.summary.sourceRows).toBe(1)
  })

  it('rechaza encabezados sin un canal completo de costo y lista', () => {
    const detection = pricingImportPlugin.detect([
      'Name',
      'Marca',
      'Modelo',
      'Description',
    ])

    expect(detection.valid).toBe(false)
    expect(detection.missingRequiredFields).toContain('pricingChannel')
  })

  it('prioriza Pricing sobre Product Master para la firma real del reporte ERP', () => {
    const result = runDataCenterImport([
      {
        Name: 'CI111UNV01',
        Description: 'Cámara',
        Modelo: 'IPC-A',
        Marca: 'UNV',
        'Purchase Price': 200,
        'Ultimo precio de compra (USD)_1': 10,
        'Precio Lista (MXN)': 500,
        'Precio USD': 25,
        Moneda: 'USD',
        Currency: 'USD',
        'Quantity Pricing Schedule': 'CATALOGO 2026',
      },
    ])

    expect(result.reportType).toBe('pricing')
    expect(result.valid).toBe(true)
    expect(result.normalizedRows).toHaveLength(2)
  })

  it('evita construir un precio USD cuando el costo fuente está declarado en MXN', () => {
    const rows = [
      {
        Name: 'AAAMK111TEC24',
        Marca: 'TECNOSINERGIA',
        'Purchase Price': 100,
        'Purchase Price (Foreign Currency)': 100,
        Moneda: 'MXN',
        'Precio Lista (MXN)': 180,
        'Precio USD': 10.41,
      },
    ]

    const result = runImportEngine(
      pricingImportPlugin,
      rows,
      Object.keys(rows[0] ?? {}),
    )

    expect(result.normalizedRows).toHaveLength(1)
    expect(result.normalizedRows[0]?.currency).toBe('MXN')
    expect(result.summary.skippedUsdCrossCurrencyRows).toBe(1)
  })
})
