import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  ExecutiveEntityAttentionSummary,
  ExecutivePeriodSelection,
} from '../types/executiveWorkspaceTypes'

import {
  buildExecutiveAttentionRoute,
  filterExecutiveAttentionEntities,
  getExecutiveAttentionSignals,
  parseExecutiveAttentionRequest,
} from './executiveAttentionNavigation'

const selection:
  ExecutivePeriodSelection = {
  preset: 'month',
  presetLabel: 'Mes',
  anchorPeriodId: '2026-07',
  availablePeriods: [],
  currentPeriodIds: ['2026-07'],
  comparisonPeriodIds: ['2026-06'],
  priorYearPeriodIds: ['2025-07'],
  currentLabel: 'Julio de 2026',
  comparisonLabel: 'Junio de 2026',
  priorYearLabel: 'Julio de 2025',
  currentStartPeriodId: '2026-07',
  currentEndPeriodId: '2026-07',
  comparisonStartPeriodId: '2026-06',
  comparisonEndPeriodId: '2026-06',
  previousAnchorPeriodId: '2026-06',
  nextAnchorPeriodId: null,
}

const summary:
  ExecutiveEntityAttentionSummary = {
  totalAnalyzed: 3,
  activeEntities: 2,
  entitiesRequiringAttention: 2,
  growingEntities: 1,
  decliningEntities: 1,
  stableEntities: 0,
  recoveredEntities: 0,
  newEntities: 0,
  inactiveOrLostEntities: 1,
  entityIds: {
    analyzed: ['A', 'B', 'C'],
    active: ['A', 'B'],
    requiringAttention: ['B', 'C'],
    growing: ['A'],
    declining: ['B'],
    stable: [],
    recovered: [],
    new: [],
    inactiveOrLost: ['C'],
  },
}

describe(
  'executiveAttentionNavigation',
  () => {
    it('builds a contextual attention route', () => {
      expect(
        buildExecutiveAttentionRoute(
          'customers',
          selection,
        ),
      ).toBe(
        '/attention/customers?view=attention&preset=month&anchor=2026-07',
      )
    })

    it('reconstructs the selected period from query parameters', () => {
      const parameters = new URLSearchParams(
        'view=attention&preset=last_3_months&anchor=2026-07',
      )

      expect(
        parseExecutiveAttentionRequest(
          parameters,
        ),
      ).toEqual({
        enabled: true,
        preset: 'last_3_months',
        anchorPeriodId: '2026-07',
      })
    })

    it('filters the directory to the exact attention ids and preserves their signals', () => {
      const entities = [
        { id: 'A' },
        { id: 'B' },
        { id: 'C' },
      ]

      expect(
        filterExecutiveAttentionEntities(
          entities,
          summary,
          (entity) => entity.id,
        ),
      ).toEqual([
        { id: 'B' },
        { id: 'C' },
      ])

      expect(
        getExecutiveAttentionSignals(
          'B',
          summary,
        ),
      ).toEqual(['declining'])

      expect(
        getExecutiveAttentionSignals(
          'C',
          summary,
        ),
      ).toEqual(['inactive_or_lost'])
    })
  },
)
