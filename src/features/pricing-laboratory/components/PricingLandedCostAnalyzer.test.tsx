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
  PricingLandedCostAnalyzer,
} from './PricingLandedCostAnalyzer'

describe('PricingLandedCostAnalyzer', () => {
  it('renders the explicit landed-cost and price-waterfall workflow', () => {
    const source = evaluatePriceBatchDesign({
      id: 'Batch 1',
      brandName: 'Nueva Marca',
      currency: 'USD',
      products: [{
        id: 'P-1',
        model: 'Modelo 1',
        sku: null,
        cost: 10,
      }],
      discountRates: [0.34],
      objective: {
        type: 'target_gross_margin',
        grossMargin: 0.24,
      },
      commonFactor: {
        strategy: 'explicit',
        factor: 2.1,
      },
    })
    const markup = renderToStaticMarkup(
      <PricingLandedCostAnalyzer source={source} />,
    )

    expect(markup).toContain('data-pricing-component="landed-cost-analyzer"')
    expect(markup).toContain('Costo aterrizado y waterfall de precio')
    expect(markup).toContain('Tipo de cambio de referencia')
    expect(markup).toContain('Agregar componente')
    expect(markup).toContain('Agregar escenario')
    expect(markup).toContain('Agregar nivel')
    expect(markup).toContain('Calcular landed cost y waterfall')
    expect(markup).toContain('No registra landed cost')
  })
})
