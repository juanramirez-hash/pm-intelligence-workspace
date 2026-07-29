import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  SalesExecutiveSummaryPanel,
} from './SalesExecutiveSummaryPanel'

describe('SW-006 SalesExecutiveSummaryPanel', () => {
  it('presenta lectura, perspectiva y hallazgos ejecutivos', () => {
    const markup =
      renderToStaticMarkup(
        <SalesExecutiveSummaryPanel
          summary={{
            available: true,
            title: 'Resumen ejecutivo · Marzo de 2026',
            overview: 'La venta creció frente al periodo anterior.',
            outlook: 'La proyección supera la cuota mensual.',
            filterContext: 'Vista consolidada.',
            findings: [
              {
                id: 'driver',
                label: 'Principal impulsor',
                value: 'UNV',
                detail: 'Aporta crecimiento incremental.',
                tone: 'positive',
              },
            ],
          }}
        />,
      )

    expect(markup).toContain(
      'data-atlas-component="sales-executive-summary-panel"',
    )
    expect(markup).toContain('Lectura del periodo')
    expect(markup).toContain('Perspectiva de cierre')
    expect(markup).toContain('Principal impulsor')
    expect(markup).toContain('UNV')
  })
})
