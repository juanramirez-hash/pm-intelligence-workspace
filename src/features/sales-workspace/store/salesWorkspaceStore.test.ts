import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  DEFAULT_SALES_WORKSPACE_FILTERS,
  useSalesWorkspaceStore,
} from './salesWorkspaceStore'

describe('SW-001 Sales Workspace store', () => {
  beforeEach(() => {
    useSalesWorkspaceStore
      .getState()
      .resetFilters()
  })

  it('actualiza y restablece el contexto global', () => {
    useSalesWorkspaceStore
      .getState()
      .setPeriodId('2026-03')

    useSalesWorkspaceStore
      .getState()
      .setComparisonMode(
        'previous-year',
      )

    expect(
      useSalesWorkspaceStore
        .getState()
        .filters,
    ).toEqual({
      periodId: '2026-03',
      comparisonMode:
        'previous-year',
    })

    useSalesWorkspaceStore
      .getState()
      .resetFilters()

    expect(
      useSalesWorkspaceStore
        .getState()
        .filters,
    ).toEqual(
      DEFAULT_SALES_WORKSPACE_FILTERS,
    )
  })
})
