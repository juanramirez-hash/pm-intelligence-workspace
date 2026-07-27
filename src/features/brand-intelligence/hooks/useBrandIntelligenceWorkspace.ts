import {
  useMemo,
} from 'react'

import {
  useParams,
} from 'react-router-dom'

import {
  BrandDecisionEngine,
  buildBrandWorkspaceViewModel,
} from '../../../core/decision'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

export function useBrandIntelligenceWorkspace() {
  const {
    brandId,
  } = useParams<{
    brandId: string
  }>()

  const workspace =
    useWorkspaceContext()

  return useMemo(() => {
    if (
      !brandId ||
      !workspace.repository ||
      !workspace.currentPeriodId
    ) {
      return {
        brandId: brandId ?? null,
        workspace: null,
      }
    }

    const engine =
      new BrandDecisionEngine(
        workspace.repository,
      )

    const decision = engine.evaluate(
      brandId,
      workspace.currentPeriodId,
    )

    return {
      brandId,
      workspace: decision
        ? buildBrandWorkspaceViewModel(
            decision,
          )
        : null,
    }
  }, [
    brandId,
    workspace.repository,
    workspace.currentPeriodId,
  ])
}
