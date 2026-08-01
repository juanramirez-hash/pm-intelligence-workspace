import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  PricingScenarioExecutiveComparisonModel,
} from '../types'

import {
  PricingScenarioExecutiveComparison,
} from './PricingScenarioExecutiveComparison'

const comparison: PricingScenarioExecutiveComparisonModel = {
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
    sourceReference: null,
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
      grossMargin: -0.05,
    },
    guardrails: [],
    guardrailSummary: {
      total: 0,
      warning: 0,
      blocking: 0,
    },
    signals: [],
    signalSummary: {
      total: 0,
      info: 0,
      warning: 0,
      blocking: 0,
      invalid: 0,
    },
    templateIssues: [],
    explainability: ['Cálculo temporal.'],
    sourceReference: null,
    notes: null,
  }],
  summary: {
    requestedRows: 1,
    selectedRows: 1,
    validRows: 0,
    warningRows: 1,
    blockedRows: 0,
    invalidSelections: 0,
    rowsWithGuardrails: 0,
    rowsWithSignals: 0,
  },
  issues: [],
  workspaceIssues: [],
  limitations: [],
}

describe('PricingScenarioExecutiveComparison', () => {
  it('renderiza el precio vigente, la selección y el aviso sin efecto comercial', () => {
    const markup = renderToStaticMarkup(
      <PricingScenarioExecutiveComparison comparison={comparison} />,
    )

    expect(markup).toContain('data-pricing-component="executive-comparison"')
    expect(markup).toContain('SIMULACIÓN SIN EFECTO COMERCIAL')
    expect(markup).toContain('Precio vigente')
    expect(markup).toContain('Silver 1')
    expect(markup).toContain('Advertencia')
    expect(markup).toContain('Temporal de sesión')
  })
})
