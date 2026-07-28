import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  SalesWorkspaceFilterBar,
} from './SalesWorkspaceFilterBar'

describe('SW-001 SalesWorkspaceFilterBar', () => {
  it('publica los filtros globales de periodo y comparación', () => {
    const markup =
      renderToStaticMarkup(
        <SalesWorkspaceFilterBar
          comparisonMode="previous-period"
          effectivePeriodLabel="Marzo de 2026"
          filterPeriodId={null}
          onComparisonModeChange={() => undefined}
          onPeriodChange={() => undefined}
          onReset={() => undefined}
          periodOptions={[
            {
              id: '2026-03',
              label: 'Marzo de 2026',
              year: 2026,
              month: 3,
            },
          ]}
        />,
      )

    expect(markup).toContain(
      'data-sales-workspace-component="filter-bar"',
    )
    expect(markup).toContain(
      'Filtros globales de ventas',
    )
    expect(markup).toContain(
      'Mismo mes del año anterior',
    )
    expect(markup).toContain(
      'Marzo de 2026',
    )
  })
})
