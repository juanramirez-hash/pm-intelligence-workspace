import {
  useMemo,
} from 'react'

import {
  useDataCenterStore,
} from '../../../data-center/store/dataCenterStore'

import {
  buildWorkspaceContext,
} from '../engine/buildWorkspaceContext'

export function useWorkspaceContext() {
  const state =
    useDataCenterStore()

  return useMemo(
    () =>
      buildWorkspaceContext(
        state,
      ),
    [state],
  )
}