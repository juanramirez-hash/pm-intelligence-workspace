import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import type {
  PricingLaboratoryWorkspaceScenarioRow,
} from '../types'

import {
  PricingScenarioTable,
} from './PricingScenarioTable'

const row: PricingLaboratoryWorkspaceScenarioRow = {
  key: 'TEMPLATE:UI-SILVER-1',
  origin: 'template',
  configurationId: 'UI-SILVER-1',
  templateId: 'SILVER',
  storedScenarioId: null,
  name: 'Silver 1',
  kind: 'pricing_group',
  pricingGroupId: 'SILVER',
  orchestrationStatus: 'evaluated',
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
  resolvedGuardrails: [],
  signals: [],
  issues: [],
  explainability: ['Cálculo temporal.'],
  sourceReference: null,
  notes: null,
  selected: true,
}

describe('PricingScenarioTable', () => {
  it('renders comparison metrics and temporary-only actions', () => {
    const markup = renderToStaticMarkup(
      <PricingScenarioTable
        currency="MXN"
        onRemove={vi.fn()}
        onSelect={vi.fn()}
        rows={[row]}
      />,
    )

    expect(markup).toContain('data-pricing-component="scenario-table"')
    expect(markup).toContain('Silver 1')
    expect(markup).toContain('Advertencia')
    expect(markup).toContain('Temporal')
    expect(markup).toContain('Quitar Silver 1')
  })
})
