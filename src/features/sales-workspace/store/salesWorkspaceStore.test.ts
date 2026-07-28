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
    ).toMatchObject({
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

  it('combina y limpia dimensiones de segmentación', () => {
    const store =
      useSalesWorkspaceStore.getState()

    store.setDimensionValues(
      'brand',
      ['UNV'],
    )
    store.setDimensionValues(
      'customer',
      ['C1'],
    )
    store.setSearchTerm('cliente uno')

    expect(
      useSalesWorkspaceStore.getState().filters,
    ).toMatchObject({
      brandIds: ['UNV'],
      customerIds: ['C1'],
      searchTerm: 'cliente uno',
    })

    useSalesWorkspaceStore
      .getState()
      .clearDimension('customer')

    expect(
      useSalesWorkspaceStore.getState().filters.customerIds,
    ).toEqual([])
  })

})
