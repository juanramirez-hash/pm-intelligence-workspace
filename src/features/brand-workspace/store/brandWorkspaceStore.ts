import {
  create,
} from 'zustand'

import type {
  BrandLifecycleFilter,
  BrandTrendFilter,
  BrandWorkspaceSortDirection,
  BrandWorkspaceSortField,
  BrandWorkspaceUiState,
} from '../types/brandWorkspaceTypes'

interface BrandWorkspaceActions {
  setSearch:
    (search: string) => void

  setLifecycleFilter:
    (
      lifecycle:
        BrandLifecycleFilter,
    ) => void

  setTrendFilter:
    (
      trend:
        BrandTrendFilter,
    ) => void

  setRequiresAttention:
    (
      requiresAttention:
        boolean,
    ) => void

  setSelectedBrandId:
    (
      selectedBrandId:
        string | null,
    ) => void

  setSortField:
    (
      sortField:
        BrandWorkspaceSortField,
    ) => void

  setSortDirection:
    (
      sortDirection:
        BrandWorkspaceSortDirection,
    ) => void

  resetFilters:
    () => void

  resetWorkspace:
    () => void
}

export type BrandWorkspaceStore =
  BrandWorkspaceUiState &
  BrandWorkspaceActions

const initialState:
  BrandWorkspaceUiState = {
    filters: {
      search: '',
      lifecycle: 'all',
      trend: 'all',
      requiresAttention: false,
    },

    selectedBrandId: null,

    sortField: 'revenue',

    sortDirection: 'desc',
  }

export const useBrandWorkspaceStore =
  create<BrandWorkspaceStore>(
    (set) => ({
      ...initialState,

      setSearch:
        (search) =>
          set((state) => ({
            filters: {
              ...state.filters,
              search,
            },
          })),

      setLifecycleFilter:
        (lifecycle) =>
          set((state) => ({
            filters: {
              ...state.filters,
              lifecycle,
            },
          })),

      setTrendFilter:
        (trend) =>
          set((state) => ({
            filters: {
              ...state.filters,
              trend,
            },
          })),

      setRequiresAttention:
        (requiresAttention) =>
          set((state) => ({
            filters: {
              ...state.filters,
              requiresAttention,
            },
          })),

      setSelectedBrandId:
        (selectedBrandId) =>
          set({
            selectedBrandId,
          }),

      setSortField:
        (sortField) =>
          set({
            sortField,
          }),

      setSortDirection:
        (sortDirection) =>
          set({
            sortDirection,
          }),

      resetFilters:
        () =>
          set((state) => ({
            filters:
              initialState.filters,

            selectedBrandId:
              state.selectedBrandId,
          })),

      resetWorkspace:
        () =>
          set({
            ...initialState,
          }),
    }),
  )