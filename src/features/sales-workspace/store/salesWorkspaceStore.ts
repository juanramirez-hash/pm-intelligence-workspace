import { create } from 'zustand'

import type {
  SalesComparisonMode,
  SalesWorkspaceFilterDimension,
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

  setSearchTerm: (
    searchTerm: string,
  ) => void

  setDimensionValues: (
    dimension: SalesWorkspaceFilterDimension,
    values: string[],
  ) => void

  toggleDimensionValue: (
    dimension: SalesWorkspaceFilterDimension,
    value: string,
  ) => void

  clearDimension: (
    dimension: SalesWorkspaceFilterDimension | 'search',
  ) => void

  resetFilters: () => void
}

export const DEFAULT_SALES_WORKSPACE_FILTERS:
SalesWorkspaceFilters = {
  periodId: null,
  comparisonMode:
    'previous-period',
  brandIds: [],
  customerIds: [],
  productIds: [],
  locationIds: [],
  salesRepresentativeIds: [],
  searchTerm: '',
}

function getFilterKey(
  dimension: SalesWorkspaceFilterDimension,
):
  | 'brandIds'
  | 'customerIds'
  | 'productIds'
  | 'locationIds'
  | 'salesRepresentativeIds' {
  switch (dimension) {
    case 'brand':
      return 'brandIds'
    case 'customer':
      return 'customerIds'
    case 'product':
      return 'productIds'
    case 'location':
      return 'locationIds'
    case 'salesRepresentative':
      return 'salesRepresentativeIds'
  }
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

      setSearchTerm: (searchTerm) =>
        set((state) => ({
          filters: {
            ...state.filters,
            searchTerm,
          },
        })),

      setDimensionValues:
        (dimension, values) =>
          set((state) => ({
            filters: {
              ...state.filters,
              [getFilterKey(dimension)]: [
                ...new Set(values),
              ],
            },
          })),

      toggleDimensionValue:
        (dimension, value) =>
          set((state) => {
            const key =
              getFilterKey(dimension)
            const current =
              state.filters[key] ?? []
            const exists =
              current.includes(value)

            return {
              filters: {
                ...state.filters,
                [key]: exists
                  ? current.filter(
                      (item) =>
                        item !== value,
                    )
                  : [...current, value],
              },
            }
          }),

      clearDimension: (dimension) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...(dimension === 'search'
              ? { searchTerm: '' }
              : {
                  [getFilterKey(dimension)]: [],
                }),
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
