import {
  useMemo,
} from 'react'

import {
  resolveCostVisibility,
  type CostVisibility,
} from './brandAccess'

import {
  useAuth,
} from './useAuth'

export function useCostVisibility(): CostVisibility {
  const { user } = useAuth()

  return useMemo(
    () => resolveCostVisibility(user),
    [user],
  )
}
