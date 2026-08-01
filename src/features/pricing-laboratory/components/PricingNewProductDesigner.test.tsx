import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  PricingNewProductDesigner,
} from './PricingNewProductDesigner'

describe('PricingNewProductDesigner', () => {
  it('renders a catalog-independent cost design workflow', () => {
    const markup = renderToStaticMarkup(
      <PricingNewProductDesigner />,
    )

    expect(markup).toContain('data-pricing-component="new-product-designer"')
    expect(markup).toContain('Diseño desde costo')
    expect(markup).toContain('Factor de lista')
    expect(markup).toContain('Factor neto')
    expect(markup).toContain('32, 34 u otro')
    expect(markup).toContain('No requiere que el producto')
  })
})
