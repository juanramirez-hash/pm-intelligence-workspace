import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PricingScenarioExecutiveComparisonModel,
} from '../types'

import {
  buildPricingScenarioExecutiveExport,
} from './buildPricingScenarioExecutiveExport'

function comparison(): PricingScenarioExecutiveComparisonModel {
  return {
    available: true,
    status: 'ready',
    generatedAt: '2026-08-01T18:00:00.000Z',
    methodology: 'pricing-executive-comparison-v1',
    executionMode: 'simulation-only',
    isolation: {
      mutatesSourcePrice: false,
      persistsScenarioResults: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    disclaimer: 'SIMULACIÓN SIN EFECTO COMERCIAL. No publica precios.',
    source: {
      priceId: 'PRICE-1',
      productId: 'P-1',
      productName: 'Cámara IP',
      model: 'IPC-ONE',
      sku: 'SKU-1',
      brandId: 'UNV',
      brandName: 'UNV',
      currency: 'MXN',
      effectiveDate: '2026-07-01',
      source: 'erp',
      sourceReference: 'pricing.xlsx#MXN',
      metrics: {
        currency: 'MXN',
        cost: 70,
        listPrice: 200,
        sellingPrice: 120,
        discountRate: 0.4,
        grossProfit: 50,
        grossMargin: 50 / 120,
        listPriceFactor: 200 / 70,
        sellingPriceFactor: 120 / 70,
        marginBand: '35_plus',
      },
    },
    requestedScenarioKeys: ['TEMPLATE:SILVER-1'],
    rows: [{
      key: 'TEMPLATE:SILVER-1',
      order: 1,
      origin: 'template',
      configurationId: 'SILVER-1',
      name: 'Silver 1',
      pricingGroupId: 'SILVER',
      evaluationStatus: 'warning',
      basis: {
        type: 'discount_rate',
        discountRate: 0.46,
      },
      metrics: {
        currency: 'MXN',
        cost: 70,
        listPrice: 200,
        sellingPrice: 108,
        discountRate: 0.46,
        grossProfit: 38,
        grossMargin: 38 / 108,
        listPriceFactor: 200 / 70,
        sellingPriceFactor: 108 / 70,
        marginBand: '35_plus',
      },
      delta: {
        sellingPrice: -12,
        sellingPriceRate: -0.1,
        discountRate: 0.06,
        grossProfit: -12,
        grossProfitRate: -0.24,
        grossMargin: (38 / 108) - (50 / 120),
      },
      guardrails: [{
        type: 'minimum_gross_margin',
        threshold: 0.36,
        severity: 'warning',
      }],
      guardrailSummary: {
        total: 1,
        warning: 1,
        blocking: 0,
      },
      signals: [{
        code: 'MINIMUM_GROSS_MARGIN_NOT_MET',
        severity: 'warning',
        message: 'No cumple el margen mínimo.',
        actual: 38 / 108,
        threshold: 0.36,
      }],
      signalSummary: {
        total: 1,
        info: 0,
        warning: 1,
        blocking: 0,
        invalid: 0,
      },
      templateIssues: [],
      explainability: [
        'Se aplicó el descuento explícito sobre el precio de lista.',
      ],
      sourceReference: 'LAB-001',
      notes: 'Simulación de revisión.',
    }],
    summary: {
      requestedRows: 1,
      selectedRows: 1,
      validRows: 0,
      warningRows: 1,
      blockedRows: 0,
      invalidSelections: 0,
      rowsWithGuardrails: 1,
      rowsWithSignals: 1,
    },
    issues: [],
    workspaceIssues: [],
    limitations: [
      'No modifica ni publica precios.',
    ],
  }
}

describe('buildPricingScenarioExecutiveExport', () => {
  it('construye un libro determinístico con cinco hojas ejecutivas', () => {
    const payload = buildPricingScenarioExecutiveExport(
      comparison(),
      new Date('2026-08-01T18:30:00.000Z'),
    )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Pricing-Laboratory-IPC-ONE-MXN-2026-08-01.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Comparación',
      'Guardrails y Señales',
      'Supuestos y Trazabilidad',
      'Metadatos',
    ])
  })

  it('exporta precio vigente, escenario y variaciones como valores numéricos', () => {
    const payload = buildPricingScenarioExecutiveExport(comparison())
    const comparisonSheet = payload.sheets.find(
      (sheet) => sheet.name === 'Comparación',
    )

    expect(comparisonSheet?.rows[1]).toMatchObject({
      1: 'Silver 1',
      6: 120,
      7: 108,
      8: -12,
      9: -0.1,
      13: 50,
      14: 38,
    })
    expect(comparisonSheet?.columnFormats?.[7]).toContain('#,##0.00')
    expect(comparisonSheet?.columnFormats?.[9]).toContain('0.0%')
  })

  it('incluye aviso obligatorio, aislamiento, guardrails y trazabilidad', () => {
    const payload = buildPricingScenarioExecutiveExport(comparison())
    const allText = payload.sheets
      .flatMap((sheet) => sheet.rows)
      .flat()
      .filter((cell): cell is string => typeof cell === 'string')
      .join(' | ')

    expect(allText).toContain('SIMULACIÓN SIN EFECTO COMERCIAL')
    expect(allText).toContain('Margen mínimo')
    expect(allText).toContain('MINIMUM_GROSS_MARGIN_NOT_MET')
    expect(allText).toContain('Se aplicó el descuento explícito')
    expect(allText).toContain('Escribe Business Repository')
    expect(allText).toContain('Publicación de precio')
  })
})
