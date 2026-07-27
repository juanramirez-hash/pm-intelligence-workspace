import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ExecutiveHeader } from './ExecutiveHeader'

describe('ExecutiveHeader', () => {
  it('renders executive identity, context and actions', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveHeader
        eyebrow="Brand Intelligence"
        title="UNV"
        subtitle="Performance Score 94"
        description="Desempeño ejecutivo por marca"
        status={<span>Saludable</span>}
        metadata={<span>Actualizado hoy</span>}
        actions={<button type="button">Exportar</button>}
      />,
    )

    expect(markup).toContain(
      'data-atlas-component="executive-header"',
    )
    expect(markup).toContain('Brand Intelligence')
    expect(markup).toContain('UNV')
    expect(markup).toContain('Performance Score 94')
    expect(markup).toContain('Saludable')
    expect(markup).toContain('Exportar')
  })

  it('supports the intelligence tone and extension content', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveHeader
        title="AI Commercial Intelligence"
        tone="intelligence"
      >
        <div>Executive insight</div>
      </ExecutiveHeader>,
    )

    expect(markup).toContain('data-tone="intelligence"')
    expect(markup).toContain('Executive insight')
  })
})
