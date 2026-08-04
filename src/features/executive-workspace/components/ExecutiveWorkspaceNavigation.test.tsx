import {
  renderToStaticMarkup,
} from 'react-dom/server'

import {
  MemoryRouter,
} from 'react-router-dom'

import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ExecutiveAttentionSummary,
  ExecutivePeriodSelection,
  ExecutiveSalesPeriodPerformance,
} from '../types/executiveWorkspaceTypes'

import {
  ExecutiveAttentionCenter,
} from './ExecutiveAttentionCenter'

import {
  ExecutiveBrandOverview,
} from './ExecutiveBrandOverview'

import {
  ExecutiveSalesPerformance,
} from './ExecutiveSalesPerformance'

const emptyEntity = {
  totalAnalyzed: 0,
  activeEntities: 0,
  entitiesRequiringAttention: 0,
  growingEntities: 0,
  decliningEntities: 0,
  stableEntities: 0,
  recoveredEntities: 0,
  newEntities: 0,
  inactiveOrLostEntities: 0,
}

const attention:
  ExecutiveAttentionSummary = {
  products: emptyEntity,
  brands: { ...emptyEntity },
  customers: { ...emptyEntity },
}

const selection:
  ExecutivePeriodSelection = {
  preset: 'month',
  presetLabel: 'Mes',
  anchorPeriodId: '2026-07',
  availablePeriods: [],
  currentPeriodIds: [],
  comparisonPeriodIds: [],
  priorYearPeriodIds: [],
  currentLabel: 'Sin periodo disponible',
  comparisonLabel:
    'Sin comparación disponible',
  priorYearLabel:
    'Sin comparación anual disponible',
  currentStartPeriodId: null,
  currentEndPeriodId: null,
  comparisonStartPeriodId: null,
  comparisonEndPeriodId: null,
  previousAnchorPeriodId: null,
  nextAnchorPeriodId: null,
}

const performance:
  ExecutiveSalesPeriodPerformance = {
  hasData: false,
  currentRevenue: null,
  currentGrossProfit: null,
  grossMargin: null,
  averageMonthlyRevenue: null,
  periodCount: 0,
  currentLabel: selection.currentLabel,
  comparisonLabel:
    selection.comparisonLabel,
  priorYearLabel:
    selection.priorYearLabel,
  comparison: {
    currentValue: null,
    comparisonValue: null,
    variationPercentage: null,
  },
  priorYearComparison: {
    currentValue: null,
    comparisonValue: null,
    variationPercentage: null,
  },
}

describe(
  'Executive workspace navigation',
  () => {
    it('exposes direct routes to commercial reports', () => {
      const markup =
        renderToStaticMarkup(
          <MemoryRouter>
            <ExecutiveSalesPerformance
              performance={performance}
              periodBadge="Mes"
            />

            <ExecutiveAttentionCenter
              attention={attention}
              selection={selection}
            />

            <ExecutiveBrandOverview
              brands={null}
            />
          </MemoryRouter>,
        )

      expect(markup).toContain(
        'href="/sales"',
      )

      expect(markup).toContain(
        'href="/attention/brands?view=attention&amp;preset=month&amp;anchor=2026-07"',
      )

      expect(markup).toContain(
        'href="/attention/customers?view=attention&amp;preset=month&amp;anchor=2026-07"',
      )

      expect(markup).toContain(
        'href="/attention/products?view=attention&amp;preset=month&amp;anchor=2026-07"',
      )
    })
  },
)
