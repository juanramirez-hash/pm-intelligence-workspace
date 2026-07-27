import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders optional metadata without changing the base contract', () => {
    const markup = renderToStaticMarkup(
      <PageHeader
        eyebrow="Inteligencia comercial"
        title="Brand Workspace"
        description="Resumen ejecutivo"
        metadata={<span>Actualizado hoy</span>}
      />,
    )

    expect(markup).toContain('data-atlas-component="page-header"')
    expect(markup).toContain('Brand Workspace')
    expect(markup).toContain('Actualizado hoy')
  })
})
