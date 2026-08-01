import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  PricingBatchDesigner,
} from './PricingBatchDesigner'

describe('PricingBatchDesigner', () => {
  it('renders the multi-product brand pricing workflow', () => {
    const markup = renderToStaticMarkup(
      <PricingBatchDesigner />,
    )

    expect(markup).toContain('data-pricing-component="batch-designer"')
    expect(markup).toContain('Matriz por lote de nueva marca')
    expect(markup).toContain('Descuentos a evaluar')
    expect(markup).toContain('Estrategia de factor común')
    expect(markup).toContain('Pegado rápido desde Excel')
    expect(markup).toContain('Calcular matriz por lote')
    expect(markup).toContain('Exportar Excel')
    expect(markup).toContain('Imprimir / PDF')
  })
})
