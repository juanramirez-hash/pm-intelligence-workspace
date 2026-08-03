import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  evaluatePriceBatchDesign,
} from '../../../core/business/pricing'

import {
  PricingCostFxStressAnalyzer,
} from './PricingCostFxStressAnalyzer'

describe('PricingCostFxStressAnalyzer', () => {
  it('renders the explicit cost and exchange-rate stress workflow', () => {
    const source = evaluatePriceBatchDesign({
      id: 'Batch 1',
      brandName: 'Nueva Marca',
      currency: 'USD',
      products: [{ id: 'P-1', model: 'Modelo 1', sku: null, cost: 10 }],
      discountRates: [0.32],
      objective: { type: 'target_gross_margin', grossMargin: 0.24 },
      commonFactor: { strategy: 'explicit', factor: 2.1 },
    })
    const markup = renderToStaticMarkup(
      <PricingCostFxStressAnalyzer source={source} />,
    )

    expect(markup).toContain('data-pricing-component="cost-fx-stress-analyzer"')
    expect(markup).toContain('Stress de costo y tipo de cambio')
    expect(markup).toContain('Moneda del costo')
    expect(markup).toContain('Factores candidatos')
    expect(markup).toContain('Agregar escenario')
    expect(markup).toContain('Agregar nivel')
    expect(markup).toContain('Calcular prueba de estrés')
    expect(markup).toContain('No consulta tasas en vivo')
  })
})
