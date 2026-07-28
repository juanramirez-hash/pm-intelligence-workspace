import {
  useMemo,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import {
  buildSalesWorkspace,
} from '../engine'

import {
  useSalesWorkspaceStore,
} from '../store'

export function useSalesWorkspace() {
  const workspace =
    useWorkspaceContext()

  const filters =
    useSalesWorkspaceStore(
      (state) => state.filters,
    )

  const setPeriodId =
    useSalesWorkspaceStore(
      (state) => state.setPeriodId,
    )

  const setComparisonMode =
    useSalesWorkspaceStore(
      (state) => state.setComparisonMode,
    )

  const setSearchTerm =
    useSalesWorkspaceStore(
      (state) => state.setSearchTerm,
    )

  const setDimensionValues =
    useSalesWorkspaceStore(
      (state) => state.setDimensionValues,
    )

  const toggleDimensionValue =
    useSalesWorkspaceStore(
      (state) => state.toggleDimensionValue,
    )

  const clearDimension =
    useSalesWorkspaceStore(
      (state) => state.clearDimension,
    )

  const resetFilters =
    useSalesWorkspaceStore(
      (state) => state.resetFilters,
    )

  const viewModel =
    useMemo(
      () =>
        buildSalesWorkspace(
          workspace.repository,
          filters,
        ),
      [
        workspace.repository,
        filters,
      ],
    )

  return {
    ...viewModel,
    filters,
    source: workspace.sales,
    health: workspace.health,
    actions: {
      setPeriodId,
      setComparisonMode,
      setSearchTerm,
      setDimensionValues,
      toggleDimensionValue,
      clearDimension,
      resetFilters,
    },
  }
}
