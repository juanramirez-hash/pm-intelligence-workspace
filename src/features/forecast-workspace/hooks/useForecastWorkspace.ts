import {
  useEffect,
  useMemo,
} from 'react'

import {
  apiDataRepository,
} from '../../data-center/repositories/apiDataRepository'

import {
  useDataCenterStore,
} from '../../data-center/store/dataCenterStore'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import {
  buildForecastWorkspace,
} from '../engine/buildForecastWorkspace'

import type {
  ForecastWorkspaceModel,
  ForecastWorkspaceRequest,
} from '../types/forecastWorkspaceTypes'

export function useForecastWorkspace(
  request?: Partial<ForecastWorkspaceRequest>,
): ForecastWorkspaceModel {
  const workspace =
    useWorkspaceContext()

  useEffect(
    () => {
      let active = true
      let loadedForForecast = false

      const currentState =
        useDataCenterStore.getState()

      if (
        currentState
          .normalizedProjectBillings
          .length === 0
      ) {
        void apiDataRepository
          .loadProjectBillingDataset()
          .then((dataset) => {
            if (
              !active ||
              !dataset
            ) {
              return
            }

            const state =
              useDataCenterStore.getState()

            state.setProjectBillingSummary(
              dataset.summary,
            )

            state.setNormalizedProjectBillings(
              dataset.normalizedRows,
            )

            loadedForForecast = true
          })
          .catch((error) => {
            console.error(
              'Forecast project billing load failed:',
              error,
            )
          })
      }

      return () => {
        active = false

        if (!loadedForForecast) {
          return
        }

        useDataCenterStore
          .getState()
          .setNormalizedProjectBillings(
            [],
          )
      }
    },
    [],
  )

  return useMemo(
    () =>
      buildForecastWorkspace(
        workspace.repository,
        request,
      ),
    [
      workspace.repository,
      request,
    ],
  )
}