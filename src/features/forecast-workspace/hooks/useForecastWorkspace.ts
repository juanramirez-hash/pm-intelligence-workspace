import {
  useMemo,
} from 'react'

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
  const workspace = useWorkspaceContext()

  return useMemo(
    () => buildForecastWorkspace(
      workspace.repository,
      request,
    ),
    [workspace.repository, request],
  )
}
