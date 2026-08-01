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
  PricingBatchSensitivityAnalyzer,
} from './PricingBatchSensitivityAnalyzer'

describe('PricingBatchSensitivityAnalyzer', () => {
  it('renders the explicit Factor by Discount sensitivity workflow', () => {
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
      discountRates: [0.32, 0.34],
      objective: {
        type: 'target_gross_margin',
        grossMargin: 0.24,
      },
      commonFactor: {
        strategy: 'protect_all',
      },
    })
    const markup = renderToStaticMarkup(
      <PricingBatchSensitivityAnalyzer source={source} />,
    )

    expect(markup).toContain('data-pricing-component="batch-sensitivity-analyzer"')
    expect(markup).toContain('Sensibilidad de factor común y factibilidad')
    expect(markup).toContain('Factores comunes a evaluar')
    expect(markup).toContain('Agregar este factor')
    expect(markup).toContain('Calcular sensibilidad')
    expect(markup).toContain('Exportar sensibilidad')
    expect(markup).toContain('no una recomendación comercial')
  })
})
