import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ExecutiveHero } from './ExecutiveHero'


describe('ExecutiveHero', () => {
  it('renders the executive hierarchy without requiring a calculated score', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveHero
        eyebrow="Brand Intelligence"
        metrics={[
          {
            label: 'Revenue',
            value: '$19.3 M',
          },
        ]}
        score={{
          score: null,
          label: 'Pendiente',
        }}
        summaryItems={[
          {
            label: 'Cobertura',
            value: '53 marcas',
          },
        ]}
        title="Centro de Inteligencia de Marcas"
      />,
    )

    expect(markup).toContain('data-atlas-component="executive-hero"')
    expect(markup).toContain('data-atlas-component="executive-health-score"')
    expect(markup).toContain('Brand Intelligence')
    expect(markup).toContain('Revenue')
    expect(markup).toContain('53 marcas')
  })
})
