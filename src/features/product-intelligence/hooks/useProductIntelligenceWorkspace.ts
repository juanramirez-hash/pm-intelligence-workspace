import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  buildProductWorkspaceViewModel,
  ProductDecisionEngine,
} from '../../../core/decision'
import { useWorkspaceContext } from '../../workspaces/shared/hooks/useWorkspaceContext'

export function useProductIntelligenceWorkspace() {
  const { productId } = useParams<{ productId: string }>()
  const context = useWorkspaceContext()

  return useMemo(() => {
    if (!productId || !context.repository || !context.currentPeriodId) {
      return { productId: productId ?? null, workspace: null }
    }

    const decision = new ProductDecisionEngine(context.repository).evaluate(
      productId,
      context.currentPeriodId,
    )

    const customerNames = new Map(
      context.repository.getCustomers().map((customer) => [customer.id, customer.name]),
    )

    return {
      productId,
      workspace: decision
        ? buildProductWorkspaceViewModel(decision, customerNames)
        : null,
    }
  }, [context.currentPeriodId, context.repository, productId])
}
