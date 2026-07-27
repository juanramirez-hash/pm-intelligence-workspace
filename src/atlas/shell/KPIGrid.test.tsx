import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { KPIGrid } from './KPIGrid'

describe('KPIGrid', () => {
  it('renders a responsive KPI grid with the requested columns', () => {
    const markup = renderToStaticMarkup(
      <KPIGrid columns={6} gap="spacious">
        <article>Revenue</article>
        <article>Margin</article>
      </KPIGrid>,
    )

    expect(markup).toContain('data-atlas-component="kpi-grid"')
    expect(markup).toContain('data-columns="6"')
    expect(markup).toContain('data-gap="spacious"')
    expect(markup).toContain('Revenue')
    expect(markup).toContain('Margin')
  })

  it('supports automatic columns and start alignment', () => {
    const markup = renderToStaticMarkup(
      <KPIGrid columns="auto" align="start">
        <div>Automatic KPI</div>
      </KPIGrid>,
    )

    expect(markup).toContain('data-columns="auto"')
    expect(markup).toContain('data-align="start"')
  })
})
