import {
  useMemo,
} from 'react'

import {
  useParams,
  useSearchParams,
} from 'react-router-dom'

import {
  buildCustomerWorkspaceViewModel,
  CustomerDecisionEngine,
} from '../../../core/decision'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

export function useCustomerIntelligenceWorkspace() {
  const { customerId } =
    useParams<{
      customerId: string
    }>()

  const [searchParams] =
    useSearchParams()

  const brandId =
    searchParams.get('brand')

  const context =
    useWorkspaceContext()

  return useMemo(() => {
    if (
      !customerId ||
      !context.repository ||
      !context.currentPeriodId
    ) {
      return {
        customerId:
          customerId ?? null,
        workspace: null,
      }
    }

    const engine =
      new CustomerDecisionEngine(
        context.repository,
      )

    const decision = engine.evaluate(
      customerId,
      context.currentPeriodId,
      brandId,
    )

    return {
      customerId,
      workspace: decision
        ? buildCustomerWorkspaceViewModel(
            decision,
          )
        : null,
    }
  }, [
    brandId,
    context.currentPeriodId,
    context.repository,
    customerId,
  ])
}
