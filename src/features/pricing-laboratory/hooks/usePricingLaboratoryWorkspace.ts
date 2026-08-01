import {
  useMemo,
} from 'react'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

import {
  buildPricingLaboratoryWorkspace,
} from '../engine'

import type {
  PricingLaboratoryWorkspaceModel,
  PricingLaboratoryWorkspaceRequest,
} from '../types'

export function usePricingLaboratoryWorkspace(
  request?: Partial<PricingLaboratoryWorkspaceRequest>,
): PricingLaboratoryWorkspaceModel {
  const context = useWorkspaceContext()

  return useMemo(
    () => buildPricingLaboratoryWorkspace(
      context.repository,
      request,
    ),
    [context.repository, request],
  )
}
