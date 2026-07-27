import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExecutivePanel } from './ExecutivePanel'

describe('ExecutivePanel', () => {
  it('renders executive metadata and content', () => {
    const markup = renderToStaticMarkup(
      <ExecutivePanel count={4} subtitle="Resumen" title="Crecimiento" tone="positive">
        <p>Contenido</p>
      </ExecutivePanel>,
    )

    expect(markup).toContain('data-atlas-component="executive-panel"')
    expect(markup).toContain('Crecimiento')
    expect(markup).toContain('Contenido')
  })
})
