import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import {
  buildSalesWorkspace,
} from '../engine'

import {
  loadSalesDetailRows,
  loadSalesFilterOptions,
} from '../repositories/salesAnalyticsApi'

import {
  useSalesWorkspaceStore,
} from '../store'

import type {
  SalesWorkspaceDetailRow,
  SalesWorkspaceFilterOptions,
  SalesWorkspaceFilters,
} from '../types'

interface SalesAnalyticsOverlay {
  requestKey: string
  filterOptions: SalesWorkspaceFilterOptions
  detailRows: SalesWorkspaceDetailRow[]
}

function buildAnalyticsRequestKey(
  periodId: string,
  filters: SalesWorkspaceFilters,
): string {
  return JSON.stringify({
    periodId,
    brandIds:
      filters.brandIds ?? [],
    customerIds:
      filters.customerIds ?? [],
    productIds:
      filters.productIds ?? [],
    locationIds:
      filters.locationIds ?? [],
    salesRepresentativeIds:
      filters.salesRepresentativeIds ?? [],
    searchTerm:
      filters.searchTerm?.trim() ?? '',
  })
}

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

  const baseViewModel =
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

  const analyticsRequestKey =
    useMemo(
      () =>
        baseViewModel.selectedPeriodId
          ? buildAnalyticsRequestKey(
              baseViewModel.selectedPeriodId,
              filters,
            )
          : null,
      [
        baseViewModel.selectedPeriodId,
        filters,
      ],
    )

  const [
    analyticsOverlay,
    setAnalyticsOverlay,
  ] =
    useState<SalesAnalyticsOverlay | null>(
      null,
    )

  useEffect(
    () => {
      const periodId =
        baseViewModel.selectedPeriodId

      if (
        !baseViewModel.available ||
        !periodId ||
        !analyticsRequestKey
      ) {
        setAnalyticsOverlay(null)

        return
      }

      const controller =
        new AbortController()

      setAnalyticsOverlay(null)

      void Promise.all([
        loadSalesFilterOptions(
          periodId,
          filters,
          controller.signal,
        ),
        loadSalesDetailRows(
          periodId,
          filters,
          100,
          controller.signal,
        ),
      ])
        .then(
          ([
            filterOptions,
            detailRows,
          ]) => {
            if (
              controller.signal.aborted
            ) {
              return
            }

            setAnalyticsOverlay({
              requestKey:
                analyticsRequestKey,
              filterOptions,
              detailRows,
            })
          },
        )
        .catch(() => {
          if (
            controller.signal.aborted
          ) {
            return
          }

          setAnalyticsOverlay(null)
        })

      return () => {
        controller.abort()
      }
    },
    [
      analyticsRequestKey,
      baseViewModel.available,
      baseViewModel.selectedPeriodId,
      filters,
    ],
  )

  const viewModel =
    useMemo(
      () => {
        if (
          !analyticsRequestKey ||
          analyticsOverlay?.requestKey !==
            analyticsRequestKey
        ) {
          return baseViewModel
        }

        return {
          ...baseViewModel,
          filterOptions:
            analyticsOverlay.filterOptions,
          detailRows:
            analyticsOverlay.detailRows,
        }
      },
      [
        analyticsRequestKey,
        analyticsOverlay,
        baseViewModel,
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