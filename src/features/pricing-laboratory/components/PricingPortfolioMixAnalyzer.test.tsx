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
  PricingPortfolioMixAnalyzer,
} from './PricingPortfolioMixAnalyzer'

describe('PricingPortfolioMixAnalyzer', () => {
  it('renders the explicit volume-weighted portfolio workflow', () => {
    const source = evaluatePriceBatchDesign({
      id: 'Batch 1',
      brandName: 'Nueva Marca',
      currency: 'MXN',
      products: [
        {
          id: 'P-1',
          model: 'Modelo 1',
          sku: null,
          cost: 100,
        },
      ],
      discountRates: [0.32],
      objective: {
        type: 'target_gross_margin',
        grossMargin: 0.24,
      },
      commonFactor: {
        strategy: 'protect_all',
      },
    })
    const markup = renderToStaticMarkup(
      <PricingPortfolioMixAnalyzer source={source} />,
    )

    expect(markup).toContain('data-pricing-component="portfolio-mix-analyzer"')
    expect(markup).toContain('Simulación ponderada por volumen y mezcla')
    expect(markup).toContain('Factores comunes candidatos')
    expect(markup).toContain('Agregar mezcla')
    expect(markup).toContain('Cantidad asumida')
    expect(markup).toContain('Calcular mezcla ponderada')
    expect(markup).toContain('no se selecciona un ganador automáticamente')
  })
})
