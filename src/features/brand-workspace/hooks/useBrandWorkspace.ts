import {
  useMemo,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import {
  filterBrands,
  selectBrandById,
  sortBrands,
} from '../selectors/brandWorkspaceSelectors'

import {
  useBrandWorkspaceStore,
} from '../store/brandWorkspaceStore'

export function useBrandWorkspace() {
  const workspace =
    useWorkspaceContext()

  const filters =
    useBrandWorkspaceStore(
      (state) =>
        state.filters,
    )

  const selectedBrandId =
    useBrandWorkspaceStore(
      (state) =>
        state.selectedBrandId,
    )

  const sortField =
    useBrandWorkspaceStore(
      (state) =>
        state.sortField,
    )

  const sortDirection =
    useBrandWorkspaceStore(
      (state) =>
        state.sortDirection,
    )

  const brands =
    workspace.brands?.brands ??
    []

  const filteredBrands =
    useMemo(
      () =>
        sortBrands(
          filterBrands(
            brands,
            filters,
          ),
          sortField,
          sortDirection,
        ),
      [
        brands,
        filters,
        sortField,
        sortDirection,
      ],
    )

  const selectedBrand =
    useMemo(
      () =>
        selectBrandById(
          brands,
          selectedBrandId,
        ),
      [
        brands,
        selectedBrandId,
      ],
    )

  return {
    workspace,

    summary:
      workspace.brands,

    summaryAvailable:
      workspace.brands !== null,

    brands,

    filteredBrands,

    selectedBrand,

    filters,

    selectedBrandId,

    sortField,

    sortDirection,

    actions: {
      setSearch:
        useBrandWorkspaceStore(
          (state) =>
            state.setSearch,
        ),

      setLifecycleFilter:
        useBrandWorkspaceStore(
          (state) =>
            state.setLifecycleFilter,
        ),

      setTrendFilter:
        useBrandWorkspaceStore(
          (state) =>
            state.setTrendFilter,
        ),

      setRequiresAttention:
        useBrandWorkspaceStore(
          (state) =>
            state.setRequiresAttention,
        ),

      setSelectedBrandId:
        useBrandWorkspaceStore(
          (state) =>
            state.setSelectedBrandId,
        ),

      setSortField:
        useBrandWorkspaceStore(
          (state) =>
            state.setSortField,
        ),

      setSortDirection:
        useBrandWorkspaceStore(
          (state) =>
            state.setSortDirection,
        ),

      resetFilters:
        useBrandWorkspaceStore(
          (state) =>
            state.resetFilters,
        ),

      resetWorkspace:
        useBrandWorkspaceStore(
          (state) =>
            state.resetWorkspace,
        ),
    },
  }
}