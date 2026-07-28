import { create } from 'zustand'

import type {
  SalesComparisonMode,
  SalesWorkspaceFilters,
} from '../types'

export interface SalesWorkspaceState {
  filters: SalesWorkspaceFilters

  setPeriodId: (
    periodId: string | null,
  ) => void

  setComparisonMode: (
    comparisonMode: SalesComparisonMode,
  ) => void

  resetFilters: () => void
}

export const DEFAULT_SALES_WORKSPACE_FILTERS:
SalesWorkspaceFilters = {
  periodId: null,
  comparisonMode:
    'previous-period',
}

export const useSalesWorkspaceStore =
  create<SalesWorkspaceState>(
    (set) => ({
      filters: {
        ...DEFAULT_SALES_WORKSPACE_FILTERS,
      },

      setPeriodId: (periodId) =>
        set((state) => ({
          filters: {
            ...state.filters,
            periodId,
          },
        })),

      setComparisonMode:
        (comparisonMode) =>
          set((state) => ({
            filters: {
              ...state.filters,
              comparisonMode,
            },
          })),

      resetFilters: () =>
        set({
          filters: {
            ...DEFAULT_SALES_WORKSPACE_FILTERS,
          },
        }),
    }),
  )
