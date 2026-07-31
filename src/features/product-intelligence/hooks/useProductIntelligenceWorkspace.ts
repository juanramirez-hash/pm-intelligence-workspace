import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  buildProductWorkspaceViewModel,
  ProductDecisionEngine,
} from '../../../core/decision'
import { useWorkspaceContext } from '../../workspaces/shared/hooks/useWorkspaceContext'
import {
  buildProductCatalogReplacement,
} from '../engine/productCatalogReplacement'

export function useProductIntelligenceWorkspace() {
  const { productId } = useParams<{ productId: string }>()
  const context = useWorkspaceContext()

  return useMemo(() => {
    if (!productId || !context.repository || !context.currentPeriodId) {
      return {
        productId: productId ?? null,
        workspace: null,
        catalogReplacement: null,
      }
    }

    const repository = context.repository

    const decision = new ProductDecisionEngine(repository).evaluate(
      productId,
      context.currentPeriodId,
    )

    const customerNames = new Map(
      repository.getCustomers().map((customer) => [
        customer.id,
        customer.name,
      ]),
    )

    const product =
      repository.product.findById(productId) ??
      repository.product.findByName(productId) ??
      repository.product.findByCode(productId)

    const catalogReplacement = product
      ? buildProductCatalogReplacement(product, {
          findProductById: (id) =>
            repository.product.findById(id),
          findProductByName: (name) =>
            repository.product.findByName(name),
          findProductByCode: (code) =>
            repository.product.findByCode(code),
          findLatestInventoryByProduct: (identity) =>
            repository.inventory.findLatestByProduct(identity),
        })
      : null

    return {
      productId,
      workspace: decision
        ? buildProductWorkspaceViewModel(decision, customerNames)
        : null,
      catalogReplacement,
    }
  }, [context.currentPeriodId, context.repository, productId])
}
