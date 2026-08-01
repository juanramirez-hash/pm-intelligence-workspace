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
  PricingTierLadderAnalyzer,
} from './PricingTierLadderAnalyzer'

describe('PricingTierLadderAnalyzer', () => {
  it('renders the explicit multi-tier pricing workflow without hidden defaults', () => {
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
      <PricingTierLadderAnalyzer source={source} />,
    )

    expect(markup).toContain('data-pricing-component="tier-ladder-analyzer"')
    expect(markup).toContain('Arquitectura multinivel y escalera de descuentos')
    expect(markup).toContain('Factores comunes candidatos')
    expect(markup).toContain('Agregar nivel')
    expect(markup).toContain('Calcular escalera comercial')
    expect(markup).toContain('Exportar escalera')
    expect(markup).toContain('No existe un factor oculto')
  })
})
