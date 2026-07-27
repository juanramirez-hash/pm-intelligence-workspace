import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AtlasCard } from './AtlasCard'

describe('AtlasCard', () => {
  it('preserves the existing default API', () => {
    const markup = renderToStaticMarkup(
      <AtlasCard>Contenido</AtlasCard>,
    )

    expect(markup).toContain('data-atlas-component="card"')
    expect(markup).toContain('data-variant="default"')
    expect(markup).toContain('Contenido')
  })

  it('supports semantic variants and spacing', () => {
    const markup = renderToStaticMarkup(
      <AtlasCard variant="critical" padding="spacious">
        Riesgo
      </AtlasCard>,
    )

    expect(markup).toContain('data-variant="critical"')
    expect(markup).toContain('padding:32px')
  })
})
