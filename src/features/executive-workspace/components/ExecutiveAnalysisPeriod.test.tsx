import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import type {
  ExecutivePeriodSelection,
} from '../types/executiveWorkspaceTypes'

import {
  ExecutiveAnalysisPeriod,
} from './ExecutiveAnalysisPeriod'

const selection:
  ExecutivePeriodSelection = {
  preset: 'month',
  presetLabel: 'Mes',
  anchorPeriodId: '2026-07',
  availablePeriods: [
    {
      id: '2026-05',
      year: 2026,
      month: 5,
      label: 'Mayo de 2026',
    },
    {
      id: '2026-06',
      year: 2026,
      month: 6,
      label: 'Junio de 2026',
    },
    {
      id: '2026-07',
      year: 2026,
      month: 7,
      label: 'Julio de 2026',
    },
  ],
  currentPeriodIds: ['2026-07'],
  comparisonPeriodIds: ['2026-06'],
  priorYearPeriodIds: [],
  currentLabel: 'Julio de 2026',
  comparisonLabel: 'Junio de 2026',
  priorYearLabel:
    'Sin comparación anual disponible',
  currentStartPeriodId: '2026-07',
  currentEndPeriodId: '2026-07',
  comparisonStartPeriodId: '2026-06',
  comparisonEndPeriodId: '2026-06',
  previousAnchorPeriodId: '2026-06',
  nextAnchorPeriodId: null,
}

describe(
  'ExecutiveAnalysisPeriod',
  () => {
    it('renders period controls and comparison context', () => {
      const markup =
        renderToStaticMarkup(
          <ExecutiveAnalysisPeriod
            lastImportedAt="2026-07-31T22:57:00.000Z"
            onNextPeriod={vi.fn()}
            onPresetChange={vi.fn()}
            onPreviousPeriod={vi.fn()}
            selection={selection}
          />,
        )

      expect(markup).toContain(
        'Periodo de análisis',
      )

      expect(markup).toContain(
        'Julio de 2026',
      )

      expect(markup).toContain(
        'Junio de 2026',
      )

      expect(markup).toContain(
        'Último mes',
      )

      expect(markup).toContain(
        '3 meses',
      )

      expect(markup).toContain(
        '6 meses',
      )

      expect(markup).toContain(
        'Año actual',
      )

      expect(markup).toContain(
        'aria-label="Periodo anterior"',
      )
    })
  },
)
