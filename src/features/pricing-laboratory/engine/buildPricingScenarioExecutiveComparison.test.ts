import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PricingLaboratoryWorkspaceModel,
  PricingLaboratoryWorkspaceScenarioRow,
} from '../types'

import {
  buildPricingScenarioExecutiveComparison,
} from './buildPricingScenarioExecutiveComparison'

function scenarioRow(
  overrides: Partial<PricingLaboratoryWorkspaceScenarioRow> = {},
): PricingLaboratoryWorkspaceScenarioRow {
  return {
    key: 'TEMPLATE:SILVER-1',
    origin: 'template',
    configurationId: 'SILVER-1',
    templateId: 'SILVER',
    storedScenarioId: null,
    name: 'Silver 1',
    kind: 'pricing_group',
    pricingGroupId: 'SILVER',
    orchestrationStatus: 'evaluated',
    evaluationStatus: 'valid',
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
      grossMargin: -0.05,
    },
    resolvedGuardrails: [],
    signals: [],
    issues: [],
    explainability: ['Cálculo temporal.'],
    sourceReference: 'LAB-001',
    notes: null,
    selected: false,
    ...overrides,
  }
}

function workspace(
  overrides: Partial<PricingLaboratoryWorkspaceModel> = {},
): PricingLaboratoryWorkspaceModel {
  const scenarios = [
    scenarioRow(),
    scenarioRow({
      key: 'TEMPLATE:PROJECT-1',
      configurationId: 'PROJECT-1',
      templateId: 'PROJECT',
      name: 'Proyecto 1',
      kind: 'project',
      pricingGroupId: 'PROJECT',
      evaluationStatus: 'blocked',
      basis: {
        type: 'selling_price',
        sellingPrice: 95,
      },
      metrics: {
        currency: 'MXN',
        cost: 70,
        listPrice: 200,
        sellingPrice: 95,
        discountRate: 0.525,
        grossProfit: 25,
        grossMargin: 25 / 95,
        listPriceFactor: 200 / 70,
        sellingPriceFactor: 95 / 70,
        marginBand: '25_to_30',
      },
      delta: {
        sellingPrice: -25,
        sellingPriceRate: -25 / 120,
        discountRate: 0.125,
        grossProfit: -25,
        grossProfitRate: -0.5,
        grossMargin: (25 / 95) - (50 / 120),
      },
      resolvedGuardrails: [{
        type: 'minimum_gross_margin',
        threshold: 0.3,
        severity: 'blocking',
      }],
      signals: [{
        code: 'MINIMUM_GROSS_MARGIN_NOT_MET',
        severity: 'blocking',
        message: 'No cumple el margen mínimo.',
        actual: 25 / 95,
        threshold: 0.3,
      }],
    }),
    scenarioRow({
      key: 'TEMPLATE:INVALID-1',
      configurationId: 'INVALID-1',
      templateId: 'CUSTOM',
      name: 'Inválido',
      evaluationStatus: null,
      orchestrationStatus: 'invalid',
      basis: null,
      metrics: null,
      delta: null,
    }),
  ]

  return {
    available: true,
    status: 'ready',
    unavailableReason: null,
    generatedAt: '2026-08-01T18:00:00.000Z',
    methodology: {
      workspace: 'pricing-workspace-v1',
      templates: 'pricing-template-v1',
      engineering: 'price-engineering-v1',
    },
    executionMode: 'simulation-only',
    isolation: {
      mutatesSourcePrice: false,
      persistsScenarioResults: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    selection: {
      requestedProductId: 'P-1',
      requestedCurrency: 'MXN',
      selectedProductId: 'P-1',
      selectedCurrency: 'MXN',
      products: [],
      currencies: [],
    },
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
    scenarios,
    selectedScenario: null,
    summary: {
      totalRows: scenarios.length,
      templateRows: scenarios.length,
      storedRows: 0,
      evaluatedRows: 2,
      disabledRows: 0,
      notApplicableRows: 0,
      validEvaluations: 1,
      warningEvaluations: 0,
      blockedEvaluations: 1,
      invalidEvaluations: 1,
      rowsWithMetrics: 2,
      templateIssueCount: 0,
      selectedScenarioKey: null,
    },
    issues: [],
    templateIssues: [],
    explainability: [],
    limitations: [
      'No modifica ni publica precios.',
    ],
    ...overrides,
  }
}

describe('buildPricingScenarioExecutiveComparison', () => {
  it('incluye únicamente escenarios seleccionados y conserva el orden del Workspace', () => {
    const result = buildPricingScenarioExecutiveComparison(
      workspace(),
      ['template:project-1', 'template:silver-1'],
    )

    expect(result.status).toBe('ready')
    expect(result.rows.map((row) => row.key)).toEqual([
      'TEMPLATE:SILVER-1',
      'TEMPLATE:PROJECT-1',
    ])
    expect(result.summary).toMatchObject({
      selectedRows: 2,
      validRows: 1,
      blockedRows: 1,
      rowsWithGuardrails: 1,
      rowsWithSignals: 1,
    })
    expect(result.disclaimer).toContain('SIN EFECTO COMERCIAL')
  })

  it('conserva escenarios bloqueados como evidencia documental sin convertirlos en recomendación', () => {
    const result = buildPricingScenarioExecutiveComparison(
      workspace(),
      ['TEMPLATE:PROJECT-1'],
    )

    expect(result.available).toBe(true)
    expect(result.rows[0]).toMatchObject({
      evaluationStatus: 'blocked',
      guardrailSummary: {
        blocking: 1,
      },
      signalSummary: {
        blocking: 1,
      },
    })
    expect(result.isolation.writesBusinessRepository).toBe(false)
  })

  it('reporta selecciones inexistentes o no calculables sin ocultar las válidas', () => {
    const result = buildPricingScenarioExecutiveComparison(
      workspace(),
      [
        'TEMPLATE:SILVER-1',
        'TEMPLATE:INVALID-1',
        'TEMPLATE:MISSING',
      ],
    )

    expect(result.status).toBe('partial')
    expect(result.rows).toHaveLength(1)
    expect(result.summary.invalidSelections).toBe(2)
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'EXECUTIVE_COMPARISON_SCENARIO_NOT_CALCULABLE',
      'EXECUTIVE_COMPARISON_SCENARIO_NOT_FOUND',
    ])
  })

  it('permanece vacío hasta que el usuario elige una comparación', () => {
    const result = buildPricingScenarioExecutiveComparison(
      workspace(),
      [],
    )

    expect(result.available).toBe(false)
    expect(result.status).toBe('empty')
    expect(result.summary.selectedRows).toBe(0)
    expect(result.issues[0]?.code).toBe(
      'EXECUTIVE_COMPARISON_SELECTION_EMPTY',
    )
  })

  it('bloquea la salida cuando no existe una fuente de precio vigente', () => {
    const result = buildPricingScenarioExecutiveComparison(
      workspace({
        source: null,
        available: false,
        status: 'awaiting_selection',
      }),
      ['TEMPLATE:SILVER-1'],
    )

    expect(result.available).toBe(false)
    expect(result.status).toBe('unavailable')
    expect(result.issues[0]?.code).toBe(
      'EXECUTIVE_COMPARISON_SOURCE_UNAVAILABLE',
    )
  })

  it('devuelve copias aisladas del precio fuente y de las métricas comparadas', () => {
    const sourceWorkspace = workspace()
    const first = buildPricingScenarioExecutiveComparison(
      sourceWorkspace,
      ['TEMPLATE:SILVER-1'],
    )

    if (!first.source || !first.rows[0]) {
      throw new Error('Fixture ejecutivo incompleto.')
    }

    first.source.metrics.sellingPrice = 1
    first.rows[0].metrics.sellingPrice = 2

    const second = buildPricingScenarioExecutiveComparison(
      sourceWorkspace,
      ['TEMPLATE:SILVER-1'],
    )

    expect(second.source?.metrics.sellingPrice).toBe(120)
    expect(second.rows[0]?.metrics.sellingPrice).toBe(108)
  })
})
