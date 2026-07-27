import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { KPIContainer } from './KPIContainer'

describe('KPIContainer', () => {
  it('renders its optional header, actions and KPI content', () => {
    const markup = renderToStaticMarkup(
      <KPIContainer
        title="Indicadores ejecutivos"
        description="Lectura consolidada del periodo"
        actions={<button type="button">Actualizar</button>}
        variant="surface"
        padding="default"
      >
        <div>Revenue KPI</div>
      </KPIContainer>,
    )

    expect(markup).toContain('data-atlas-component="kpi-container"')
    expect(markup).toContain('data-variant="surface"')
    expect(markup).toContain('Indicadores ejecutivos')
    expect(markup).toContain('Actualizar')
    expect(markup).toContain('Revenue KPI')
  })

  it('supports a plain full-width content-only container', () => {
    const markup = renderToStaticMarkup(
      <KPIContainer>
        <span>KPIs</span>
      </KPIContainer>,
    )

    expect(markup).toContain('data-width="full"')
    expect(markup).toContain('data-padding="none"')
    expect(markup).toContain('KPIs')
  })
})
