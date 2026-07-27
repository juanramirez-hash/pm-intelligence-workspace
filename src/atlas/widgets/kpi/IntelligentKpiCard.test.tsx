import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { IntelligentKpiCard } from './IntelligentKpiCard'

describe('IntelligentKpiCard', () => {
  it('renders status, trend, insight, sparkline and source metadata', () => {
    const markup = renderToStaticMarkup(
      <IntelligentKpiCard
        context="Periodo actual"
        history={[4, 6, 5, 8]}
        insight="El indicador mantiene una evolución favorable."
        source="Business Repository"
        status={{ label: 'Favorable', tone: 'positive' }}
        title="En crecimiento"
        tone="positive"
        trend={{ direction: 'up', sentiment: 'positive', value: '+4' }}
        value="12"
      />,
    )

    expect(markup).toContain('data-atlas-component="intelligent-kpi-card"')
    expect(markup).toContain('data-atlas-component="kpi-status-badge"')
    expect(markup).toContain('data-atlas-component="kpi-trend"')
    expect(markup).toContain('data-atlas-component="kpi-sparkline"')
    expect(markup).toContain('Business Repository')
  })
})
