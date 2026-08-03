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
  PricingPriceCorridorAnalyzer,
} from './PricingPriceCorridorAnalyzer'

describe('PricingPriceCorridorAnalyzer', () => {
  it('renders the explicit price corridor workflow', () => {
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
      <PricingPriceCorridorAnalyzer source={source} />,
    )

    expect(markup).toContain('data-pricing-component="price-corridor-analyzer"')
    expect(markup).toContain('Corredor de precio, descuento máximo y piso de margen')
    expect(markup).toContain('Tipo de cambio de referencia')
    expect(markup).toContain('Agregar escenario')
    expect(markup).toContain('Agregar nivel')
    expect(markup).toContain('Calcular corredor y descuento máximo')
    expect(markup).toContain('no aprueba descuentos')
  })
})
