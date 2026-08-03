import {
  useMemo,
} from 'react'

import {
  useDataCenterStore,
} from '../../data-center/store/dataCenterStore'

import {
  buildExecutiveWorkspace,
} from '../engine/buildExecutiveWorkspace'

export function useExecutiveWorkspace() {
  const state =
    useDataCenterStore()

  return useMemo(
    () =>
      buildExecutiveWorkspace(
        state,
      ),
    [state],
  )
}
