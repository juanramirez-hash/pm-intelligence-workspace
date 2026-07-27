import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ExecutiveStatusBar } from './ExecutiveStatusBar'

describe('ExecutiveStatusBar', () => {
  it('renders semantic status metadata as a description list', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveStatusBar
        items={[
          {
            label: 'Estado',
            value: 'Datos actualizados',
            tone: 'healthy',
          },
          {
            label: 'Periodo',
            value: 'ENE–JUN 2026',
          },
        ]}
      />,
    )

    expect(markup).toContain(
      'data-atlas-component="executive-status-bar"',
    )
    expect(markup).toContain('<dl')
    expect(markup).toContain('Datos actualizados')
    expect(markup).toContain('ENE–JUN 2026')
  })

  it('supports compact density, subtle variant and extension regions', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveStatusBar
        density="compact"
        variant="subtle"
        leading={<span>Sincronización</span>}
        trailing={<button type="button">Actualizar</button>}
        items={[]}
      />,
    )

    expect(markup).toContain('data-density="compact"')
    expect(markup).toContain('data-variant="subtle"')
    expect(markup).toContain('Sincronización')
    expect(markup).toContain('Actualizar')
  })
})
